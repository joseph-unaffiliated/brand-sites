/**
 * Batch processor for validation_retry_queue.
 * Re-validates emails that timed out during Email Oversight; invalid emails get
 * BQ validation fields updated, unsubscribe from all brands, and global suppression.
 * Called by cron (e.g. every 6 hours).
 */

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import { v5 as uuidv5 } from 'uuid';
import { handleGlobalSuppression } from './cio-to-bq-sync-enhanced.js';

const USER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const CIO_SITE_ID = process.env.CIO_SITE_ID;
const CIO_API_KEY = process.env.CIO_API_KEY;
const CIO_TRACK_URL = process.env.CIO_TRACK_URL || 'https://track.customer.io/api/v2';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

const httpClient = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

async function findUserByEmail(email) {
  const query = `
    SELECT userID FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
    WHERE email = @email LIMIT 1
  `;
  try {
    const [rows] = await bq.query({ query, params: { email }, types: { email: 'STRING' } });
    return rows.length > 0 ? rows[0].userID : null;
  } catch (err) {
    console.error('findUserByEmail error:', err.message);
    return null;
  }
}

async function validateEmail(email) {
  if (!process.env.EMAILOVERSIGHT_API_KEY) {
    return { valid: true, reason: 'no_api_key' };
  }
  try {
    const response = await httpClient.post(
      'https://api.emailoversight.com/api/emailvalidation',
      { ListId: 245740, Email: email },
      { headers: { ApiToken: process.env.EMAILOVERSIGHT_API_KEY } }
    );
    const result = response.data.Result;
    return {
      valid: result === 'Valid' || result === 'Verified',
      reason: result,
      score: response.data.Score
    };
  } catch (error) {
    console.error('Validation retry API error:', email, error.message);
    return { valid: true, reason: 'validation_error' };
  }
}

async function updateUserValidationAndSuppress(userID, email, validationReason) {
  const projectId = process.env.GCP_PROJECT_ID;
  const now = new Date().toISOString();
  const mergeQuery = `
    MERGE \`${projectId}.analytics.users\` AS target
    USING (
      SELECT
        @userID AS userID,
        @email AS email,
        @emailValidationStatus AS emailValidationStatus,
        @emailValidationReason AS emailValidationReason,
        PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', @globalSuppressionDate) AS globalSuppressionDate,
        CAST('{}' AS JSON) AS subscriptions,
        CAST('{}' AS STRING) AS unsubscribed_brands
    ) AS source
    ON target.userID = source.userID
    WHEN MATCHED THEN
      UPDATE SET
        emailValidationStatus = source.emailValidationStatus,
        emailValidationReason = source.emailValidationReason,
        globalSuppressionDate = source.globalSuppressionDate,
        subscriptions = source.subscriptions,
        unsubscribed_brands = source.unsubscribed_brands
    WHEN NOT MATCHED THEN
      INSERT (userID, email, emailValidationStatus, emailValidationReason, globalSuppressionDate, subscriptions, unsubscribed_brands)
      VALUES (source.userID, source.email, source.emailValidationStatus, source.emailValidationReason, source.globalSuppressionDate, source.subscriptions, source.unsubscribed_brands)
  `;
  await bq.query({
    query: mergeQuery,
    params: {
      userID,
      email,
      emailValidationStatus: validationReason || 'Invalid',
      emailValidationReason: validationReason || 'Invalid',
      globalSuppressionDate: now
    },
    types: {
      userID: 'STRING',
      email: 'STRING',
      emailValidationStatus: 'STRING',
      emailValidationReason: 'STRING',
      globalSuppressionDate: 'STRING'
    }
  });
}

/** Set global_suppression in Customer.io (handleGlobalSuppression only does this when user had subscriptions). */
async function setCustomerIOGlobalSuppression(userID, email) {
  if (!CIO_SITE_ID || !CIO_API_KEY) return;
  const auth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');
  try {
    await httpClient.post(
      `${CIO_TRACK_URL}/entity`,
      {
        type: 'person',
        identifiers: { id: userID },
        action: 'identify',
        attributes: {
          email,
          global_suppression: true,
          global_suppression_date: new Date().toISOString()
        }
      },
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    console.log('Set global_suppression in CIO for', email);
  } catch (err) {
    console.warn('CIO global_suppression update failed for', email, err.message);
  }
}

async function processValidationRetryQueue(options = {}) {
  const limit = options.limit ?? 50;
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    return { success: false, error: 'GCP_PROJECT_ID not set', processed: 0, valid: 0, invalid: 0 };
  }

  const selectQuery = `
    SELECT email, userID, source, queued_at
    FROM \`${projectId}.analytics.validation_retry_queue\`
    ORDER BY queued_at ASC
    LIMIT @limit
  `;
  let rows = [];
  try {
    const [job] = await bq.query({
      query: selectQuery,
      params: { limit },
      types: { limit: 'INT64' }
    });
    rows = job;
  } catch (err) {
    console.error('Failed to read validation_retry_queue:', err.message);
    return { success: false, error: err.message, processed: 0, valid: 0, invalid: 0 };
  }

  if (rows.length === 0) {
    return { success: true, processed: 0, valid: 0, invalid: 0 };
  }

  const toDelete = [];
  let validCount = 0;
  let invalidCount = 0;

  for (const row of rows) {
    const email = row.email;
    const result = await validateEmail(email);
    toDelete.push(email);

    if (result.valid) {
      validCount++;
      continue;
    }

    invalidCount++;
    const userID = row.userID || await findUserByEmail(email) || uuidv5(email.toLowerCase(), USER_NAMESPACE);

    try {
      await updateUserValidationAndSuppress(userID, email, result.reason);
      const suppressionResult = await handleGlobalSuppression(userID, email, Date.now());
      if (!suppressionResult.success) {
        console.warn('handleGlobalSuppression failed for', email, suppressionResult.error);
      }
      await setCustomerIOGlobalSuppression(userID, email);
    } catch (err) {
      console.error('Invalid-handling error for', email, err.message);
      // Still remove from queue so we don't retry forever with the same failure
    }
  }

  if (toDelete.length === 0) {
    return { success: true, processed: 0, valid: validCount, invalid: invalidCount };
  }

  const deleteQuery = `
    DELETE FROM \`${projectId}.analytics.validation_retry_queue\`
    WHERE email IN UNNEST(@emails)
  `;
  try {
    await bq.query({
      query: deleteQuery,
      params: { emails: toDelete },
      types: { emails: ['STRING'] }
    });
  } catch (err) {
    console.error('Failed to delete processed rows from queue:', err.message);
    return { success: false, error: err.message, processed: toDelete.length, valid: validCount, invalid: invalidCount };
  }

  return { success: true, processed: toDelete.length, valid: validCount, invalid: invalidCount };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 50;
  console.log('Validation retry batch processor started, limit:', limit);

  try {
    const result = await processValidationRetryQueue({ limit });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Processed ${result.processed} (valid: ${result.valid}, invalid: ${result.invalid})`,
        processed: result.processed,
        valid: result.valid,
        invalid: result.invalid
      });
    }
    return res.status(500).json({
      success: false,
      error: result.error || 'Unknown error',
      processed: result.processed ?? 0,
      valid: result.valid ?? 0,
      invalid: result.invalid ?? 0
    });
  } catch (error) {
    console.error('Validation retry processor error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export { processValidationRetryQueue };
