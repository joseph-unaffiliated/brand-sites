/**
 * Retention.com Batch Suppression Endpoint
 * 
 * Sends emails of users who subscribed since the last sync to Retention.com suppression list.
 * Should be called twice daily via scheduled job (Vercel Cron, GitHub Actions, etc.)
 * 
 * Rate limit: 3 API calls per day to Retention.com
 */

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import FormData from 'form-data';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

// HTTP client with timeout
const httpClient = axios.create({
  timeout: 30000, // 30 second timeout for batch operations
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get the last sync timestamp from BigQuery metadata table or default to 24 hours ago
 * This persists between cron job runs automatically
 */
async function getLastSyncTimestamp() {
  try {
    // Try to get the last sync timestamp from a metadata table in BigQuery
    const query = `
      SELECT last_sync_timestamp
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.retention_sync_metadata\`
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const [rows] = await bq.query({ query });
    
    if (rows.length > 0 && rows[0].last_sync_timestamp) {
      const timestamp = parseInt(rows[0].last_sync_timestamp, 10);
      console.log(`📅 Retrieved last sync timestamp from BigQuery: ${new Date(timestamp).toISOString()}`);
      return timestamp;
    }
  } catch (error) {
    // Table doesn't exist yet or query failed - will create it on first successful sync
    console.log('ℹ️ No previous sync timestamp found in BigQuery, using default');
  }
  
  // Fallback: Use environment variable if set
  if (process.env.RETENTION_LAST_SYNC_TIMESTAMP) {
    return parseInt(process.env.RETENTION_LAST_SYNC_TIMESTAMP, 10);
  }
  
  // Default to 24 hours ago if no previous sync
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  return yesterday.getTime();
}

/**
 * Store the last sync timestamp in BigQuery for persistence between runs
 */
async function saveLastSyncTimestamp(timestamp) {
  try {
    // Create or update the metadata table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS \`${process.env.GCP_PROJECT_ID}.analytics.retention_sync_metadata\` (
        last_sync_timestamp INT64,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
      )
    `;
    
    await bq.query({ query: createTableQuery });
    
    // Insert the new timestamp
    const insertQuery = `
      INSERT INTO \`${process.env.GCP_PROJECT_ID}.analytics.retention_sync_metadata\` 
        (last_sync_timestamp, updated_at)
      VALUES (@timestamp, CURRENT_TIMESTAMP())
    `;
    
    await bq.query({
      query: insertQuery,
      params: { timestamp }
    });
    
    console.log(`✅ Saved last sync timestamp to BigQuery: ${new Date(timestamp).toISOString()}`);
  } catch (error) {
    console.error('⚠️ Failed to save last sync timestamp to BigQuery:', error.message);
    // Don't throw - this is not critical, the sync still succeeded
  }
}

/**
 * Query BigQuery for users who subscribed since last sync
 */
async function getNewSubscribersSince(lastSyncTimestamp) {
  try {
    console.log(`🔍 Querying for users who subscribed since ${new Date(lastSyncTimestamp).toISOString()}`);
    
    // Query for users who have subscriptions with timestamps after lastSyncTimestamp
    // BigQuery requires constant JSON paths, so we'll query all users with subscriptions
    // and filter by checking if any subscription timestamp >= lastSyncTimestamp
    // We use a JavaScript UDF to extract timestamps dynamically
    const query = `
      CREATE TEMP FUNCTION extractSubscriptionTimestamps(subscriptions JSON)
      RETURNS ARRAY<INT64>
      LANGUAGE js AS """
        if (!subscriptions) return [];
        const timestamps = [];
        for (const brand in subscriptions) {
          if (subscriptions[brand] && subscriptions[brand].subscribed_timestamp) {
            timestamps.push(parseInt(subscriptions[brand].subscribed_timestamp));
          }
        }
        return timestamps;
      """;
      
      SELECT DISTINCT email
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE subscriptions IS NOT NULL
        AND email IS NOT NULL
        AND email != ''
        AND EXISTS (
          SELECT 1
          FROM UNNEST(extractSubscriptionTimestamps(subscriptions)) AS timestamp
          WHERE timestamp >= @lastSyncTimestamp
        )
    `;
    
    const [rows] = await bq.query({
      query,
      params: {
        lastSyncTimestamp: lastSyncTimestamp
      }
    });
    
    const emails = rows
      .map(row => row.email)
      .filter(email => email && typeof email === 'string')
      .map(email => email.toLowerCase().trim())
      .filter(email => email && email.includes('@')); // Basic email validation
    console.log(`📊 Found ${emails.length} users who subscribed since last sync`);
    
    return emails;
  } catch (error) {
    console.error('❌ Error querying new subscribers:', error.message);
    throw error;
  }
}

/**
 * Send emails to Retention.com suppression list
 */
async function sendToRetentionSuppression(emails) {
  if (!process.env.RETENTION_API_KEY) {
    console.log('⚠️ Retention.com API key not configured');
    return { success: false, reason: 'no_api_key' };
  }
  if (!process.env.RETENTION_API_ID) {
    console.log('⚠️ Retention.com API ID not configured');
    return { success: false, reason: 'no_api_id' };
  }
  
  if (emails.length === 0) {
    console.log('ℹ️ No emails to send, skipping API call');
    return { success: true, count: 0 };
  }
  
  try {
    // Format as CSV: header row "email" followed by email addresses, one per line
    const csvContent = `email\n${emails.join('\n')}`;
    
    // Create FormData for file upload
    const formData = new FormData();
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    formData.append('file', csvBuffer, {
      filename: 'suppression.csv',
      contentType: 'text/csv'
    });
    
    console.log(`📤 Sending ${emails.length} emails to Retention.com suppression list...`);
    
    const response = await httpClient.post(
      'https://api.retention.com/api/v1/suppression',
      formData,
      {
        headers: {
          'api-id': process.env.RETENTION_API_ID,
          'api-key': process.env.RETENTION_API_KEY,
          ...formData.getHeaders() // Adds Content-Type with boundary for multipart/form-data
        },
        timeout: 30000
      }
    );
    
    console.log(`✅ Successfully sent ${emails.length} emails to Retention.com suppression list`);
    return { success: true, count: emails.length };
  } catch (error) {
    console.error('⚠️ Failed to send emails to Retention.com suppression:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false, reason: error.message, count: emails.length };
  }
}

export default async function handler(req, res) {
  console.log('🚀 RETENTION.COM BATCH SUPPRESSION HANDLER');
  
  // Optional: Add authentication check (e.g., secret token in query params or headers)
  const { secret, timestamp } = req.query;
  if (process.env.RETENTION_BATCH_SECRET && secret !== process.env.RETENTION_BATCH_SECRET) {
    console.error('❌ Invalid secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get last sync timestamp - use query param if provided, otherwise get from BigQuery or default
    const lastSyncTimestamp = timestamp 
      ? parseInt(timestamp, 10) 
      : await getLastSyncTimestamp();
    const currentTimestamp = new Date().getTime();
    
    console.log(`📅 Last sync: ${new Date(lastSyncTimestamp).toISOString()}`);
    console.log(`📅 Current time: ${new Date(currentTimestamp).toISOString()}`);
    
    // Query for new subscribers
    const emails = await getNewSubscribersSince(lastSyncTimestamp);
    
    if (emails.length === 0) {
      console.log('ℹ️ No new subscribers since last sync');
      // Still update the timestamp so next run knows where to start
      await saveLastSyncTimestamp(currentTimestamp);
      return res.status(200).json({
        success: true,
        message: 'No new subscribers to sync',
        count: 0,
        lastSyncTimestamp: lastSyncTimestamp,
        currentTimestamp: currentTimestamp
      });
    }
    
    // Send to Retention.com
    const result = await sendToRetentionSuppression(emails);
    
    if (result.success) {
      // Save the new sync timestamp to BigQuery for next run
      await saveLastSyncTimestamp(currentTimestamp);
      
      console.log(`✅ Batch suppression completed: ${result.count} emails sent`);
      
      return res.status(200).json({
        success: true,
        message: `Successfully sent ${result.count} emails to Retention.com`,
        count: result.count,
        lastSyncTimestamp: lastSyncTimestamp,
        newLastSyncTimestamp: currentTimestamp,
        emails: emails.slice(0, 10) // Return first 10 for debugging (remove in production if sensitive)
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.reason,
        count: result.count,
        lastSyncTimestamp: lastSyncTimestamp
      });
    }
  } catch (error) {
    console.error('❌ Batch suppression error:', error.message);
    return res.status(500).json({
      error: 'Batch suppression failed',
      message: error.message
    });
  }
}

