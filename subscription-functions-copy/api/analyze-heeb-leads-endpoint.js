/**
 * Analyze Heeb Leads Endpoint
 * 
 * Analyzes the CSV file against BigQuery and Customer.io to determine:
 * - Which emails already have lead tags in Customer.io
 * - Which failed validation
 * - Which are already subscribed/unsubscribed
 * - Which still need processing
 */

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

const CIO_SITE_ID = process.env.CIO_SITE_ID;
const CIO_API_KEY = process.env.CIO_API_KEY;
const CIO_TRACK_URL = process.env.CIO_TRACK_URL || 'https://track.customer.io/api/v2';

const cioAuth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');

const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'Authorization': `Basic ${cioAuth}`
  }
});

const BRAND_ID = 'heebnewsletters';

/**
 * Check if user qualifies as a lead for a specific brand
 */
function isUserLeadForBrand(user, brandId) {
  if (!user || !brandId) return false;
  
  let brandInterest = null;
  if (user.leadData) {
    try {
      const leadData = typeof user.leadData === 'string' ? JSON.parse(user.leadData) : user.leadData;
      brandInterest = leadData.brand_interest;
    } catch (e) {
      return false;
    }
  }
  
  if (brandInterest !== brandId) {
    return false;
  }
  
  let subscriptions = {};
  if (user.subscriptions) {
    try {
      subscriptions = typeof user.subscriptions === 'string' 
        ? JSON.parse(user.subscriptions) 
        : user.subscriptions;
    } catch (e) {
      subscriptions = {};
    }
  }
  
  if (Object.keys(subscriptions).length > 0) {
    return false;
  }
  
  let unsubscribedBrands = {};
  if (user.unsubscribed_brands) {
    try {
      unsubscribedBrands = typeof user.unsubscribed_brands === 'string'
        ? JSON.parse(user.unsubscribed_brands)
        : user.unsubscribed_brands;
    } catch (e) {
      unsubscribedBrands = {};
    }
  }
  
  if (unsubscribedBrands[brandId]) {
    return false;
  }
  
  return true;
}

/**
 * Get users from BigQuery in batch
 */
async function getUsersFromBigQuery(emails) {
  if (emails.length === 0) return [];
  
  const emailList = emails.map(email => `'${email.toLowerCase()}'`).join(',');
  const query = `
    SELECT 
      userID,
      email,
      leadData,
      subscriptions,
      unsubscribed_brands,
      emailValidationStatus,
      emailValidationReason
    FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
    WHERE email IN (${emailList})
  `;
  
  try {
    const [rows] = await bq.query({ query });
    return rows;
  } catch (error) {
    console.error('Error querying BigQuery:', error.message);
    return [];
  }
}

/**
 * Check Customer.io for lead tags in batch
 * Note: Customer.io doesn't have a great batch lookup API, so we'll need to check individually
 * But we'll optimize by checking only emails that are in BigQuery
 */
async function checkCustomerIOLeadTag(email) {
  try {
    // Try to get person by email using entity API
    const response = await httpClient.get(
      `${CIO_TRACK_URL}/entity`,
      {
        params: {
          type: 'person',
          email: email.toLowerCase()
        }
      }
    );
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const person = response.data.results[0];
      const leadTag = person.attributes?.[`lead_for_${BRAND_ID}`];
      return leadTag === true;
    }
    
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    return false;
  }
}

/**
 * Analyze emails
 */
async function analyzeEmails(emails) {
  const results = {
    already_processed: [],
    failed_validation: [],
    already_subscribed: [],
    unsubscribed: [],
    wrong_brand_interest: [],
    needs_processing: [],
    not_in_bq: []
  };
  
  // Get all users from BigQuery in one query
  console.log(`Querying BigQuery for ${emails.length} emails...`);
  const users = await getUsersFromBigQuery(emails);
  const userMap = new Map();
  users.forEach(user => {
    userMap.set(user.email.toLowerCase(), user);
  });
  
  console.log(`Found ${users.length} users in BigQuery`);
  
  // Process each email
  let processed = 0;
  for (const email of emails) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`Processed ${processed}/${emails.length}...`);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = userMap.get(normalizedEmail);
    
    // Check Customer.io for lead tag
    const hasLeadTag = await checkCustomerIOLeadTag(normalizedEmail);
    
    const result = {
      email: normalizedEmail,
      inBigQuery: !!user,
      hasLeadTagInCIO: hasLeadTag
    };
    
    if (hasLeadTag) {
      result.status = 'already_processed';
      result.reason = 'Has lead_for_heebnewsletters tag in Customer.io';
      results.already_processed.push(result);
    } else if (!user) {
      result.status = 'not_in_bq';
      result.reason = 'Not in BigQuery, needs to be processed';
      results.not_in_bq.push(result);
    } else {
      // Check validation status
      const validationStatus = user.emailValidationStatus || user.emailValidationReason;
      if (validationStatus && !['Valid', 'Verified', 'no_api_key', 'validation_error'].includes(validationStatus)) {
        result.status = 'failed_validation';
        result.reason = `Email validation failed: ${validationStatus}`;
        results.failed_validation.push(result);
      } else {
        // Check if user qualifies as lead
        const qualifiesAsLead = isUserLeadForBrand(user, BRAND_ID);
        
        if (!qualifiesAsLead) {
          let leadData = null;
          if (user.leadData) {
            try {
              leadData = typeof user.leadData === 'string' ? JSON.parse(user.leadData) : user.leadData;
            } catch (e) {}
          }
          
          let subscriptions = {};
          if (user.subscriptions) {
            try {
              subscriptions = typeof user.subscriptions === 'string' 
                ? JSON.parse(user.subscriptions) 
                : user.subscriptions;
            } catch (e) {}
          }
          
          let unsubscribedBrands = {};
          if (user.unsubscribed_brands) {
            try {
              unsubscribedBrands = typeof user.unsubscribed_brands === 'string'
                ? JSON.parse(user.unsubscribed_brands)
                : user.unsubscribed_brands;
            } catch (e) {}
          }
          
          if (Object.keys(subscriptions).length > 0) {
            result.status = 'already_subscribed';
            result.reason = 'User already has subscriptions';
            result.details = { subscriptions: Object.keys(subscriptions) };
            results.already_subscribed.push(result);
          } else if (unsubscribedBrands[BRAND_ID]) {
            result.status = 'unsubscribed';
            result.reason = 'User unsubscribed from heebnewsletters';
            results.unsubscribed.push(result);
          } else if (leadData?.brand_interest !== BRAND_ID) {
            result.status = 'wrong_brand_interest';
            result.reason = `Brand interest is ${leadData?.brand_interest || 'null'}, not ${BRAND_ID}`;
            results.wrong_brand_interest.push(result);
          } else {
            result.status = 'needs_processing';
            result.reason = 'In BigQuery but lead tag not synced to Customer.io';
            results.needs_processing.push(result);
          }
        } else {
          result.status = 'needs_processing';
          result.reason = 'Qualifies as lead but tag not in Customer.io';
          results.needs_processing.push(result);
        }
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return results;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    let emails = [];
    
    // Accept emails in request body
    if (req.body.emails && Array.isArray(req.body.emails)) {
      emails = req.body.emails;
    } else if (req.body.csv) {
      // Parse CSV from request body
      const lines = req.body.csv.split('\n').filter(line => line.trim());
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          const email = parts[0].trim().replace(/^"|"$/g, '');
          if (email && email.includes('@')) {
            emails.push(email.toLowerCase());
          }
        }
      }
    } else {
      return res.status(400).json({ error: 'Expected emails array or csv in request body' });
    }
    
    if (emails.length === 0) {
      return res.status(400).json({ error: 'No emails found' });
    }
    
    console.log(`Analyzing ${emails.length} emails...`);
    
    const results = await analyzeEmails(emails);
    
    const summary = {
      total: emails.length,
      already_processed: results.already_processed.length,
      failed_validation: results.failed_validation.length,
      already_subscribed: results.already_subscribed.length,
      unsubscribed: results.unsubscribed.length,
      wrong_brand_interest: results.wrong_brand_interest.length,
      needs_processing: results.needs_processing.length,
      not_in_bq: results.not_in_bq.length
    };
    
    return res.status(200).json({
      success: true,
      summary,
      results
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
}
