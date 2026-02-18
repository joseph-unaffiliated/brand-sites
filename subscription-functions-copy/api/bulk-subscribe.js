/**
 * Bulk subscription processing endpoint
 * Processes multiple emails through the magic link flow
 * 
 * POST /api/bulk-subscribe
 * Body: {
 *   "emails": ["email1@example.com", "email2@example.com"],
 *   "brands": "thepicklereport" or ["thepicklereport", "themixedhome"],
 *   "options": {
 *     "batchSize": 10,
 *     "delayBetweenBatches": 1000
 *   }
 * }
 * 
 * Or with per-email brands:
 * {
 *   "subscriptions": [
 *     { "email": "user1@example.com", "brands": ["thepicklereport"] },
 *     { "email": "user2@example.com", "brands": ["thepicklereport", "themixedhome"] }
 *   ]
 * }
 */

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import { v5 as uuidv5 } from 'uuid';
import crypto from 'crypto';
import { handleExecute } from './magic-link.js';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

const USER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Import the core functions from magic-link.js
// We'll need to replicate the key logic here
async function validateEmail(email) {
  const apiKey = process.env.EMAILOVERSIGHT_API_KEY;
  if (!apiKey) {
    console.log('⚠️ EmailOversight API key not set, skipping validation');
    return { valid: true, quality: 'unknown' };
  }
  
  try {
    const response = await axios.get(`https://api.emailoversight.com/api/email/validate`, {
      params: { email, api_key: apiKey },
      timeout: 5000
    });
    
    return {
      valid: response.data.valid === true || response.data.valid === 'true',
      quality: response.data.quality || 'unknown'
    };
  } catch (error) {
    console.error('Email validation error:', error.message);
    return { valid: true, quality: 'unknown' }; // Default to valid on error
  }
}

function hashEmail(email, salt = process.env.EMAIL_SALT || 'default-salt') {
  try {
    return crypto.createHash('sha256').update(email + salt).digest('hex');
  } catch (error) {
    console.error('Email hashing error:', error.message);
    return email;
  }
}

async function findUserByEmail(email) {
  const query = `
    SELECT userID 
    FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
    WHERE email = @email 
    LIMIT 1
  `;
  
  try {
    const [rows] = await bq.query({ query, params: { email } });
    return rows.length > 0 ? rows[0].userID : null;
  } catch (error) {
    console.error('BigQuery lookup error:', error.message);
    return null;
  }
}

async function processSingleSubscription(email, brands, options = {}) {
  const normalizedEmail = email.toLowerCase().trim();
  const brandList = Array.isArray(brands) ? brands : [brands].filter(Boolean);
  
  if (brandList.length === 0) {
    return {
      email: normalizedEmail,
      success: false,
      error: 'No brands specified'
    };
  }
  
  try {
    // Validate email
    const validationResult = await validateEmail(normalizedEmail);
    if (!validationResult.valid) {
      return {
        email: normalizedEmail,
        success: false,
        error: `Email validation failed: ${validationResult.quality}`
      };
    }
    
    // Find or create user
    let userID = await findUserByEmail(normalizedEmail);
    const isNewUser = !userID;
    
    if (!userID) {
      userID = uuidv5(normalizedEmail, USER_NAMESPACE);
    }
    
    // Call the /execute endpoint directly via POST
    // This bypasses bot detection and executes immediately (appropriate for programmatic calls)
    // The endpoint is idempotent, so re-processing already-subscribed users is safe
    const brandsParam = brandList.join(',');
    // Use the API route directly to ensure proper routing
    const executeUrl = process.env.EXECUTE_URL || 
                      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/magic-link` :
                      'https://subscription-functions.vercel.app/api/magic-link';
    
    // We'll send the request to the magic-link handler with a special header to route to /execute
    // Actually, let's use the /execute path which should be routed by vercel.json
    const executePath = process.env.EXECUTE_URL || 
                        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/execute` :
                        'https://subscription-functions.vercel.app/execute';
    
    // Determine brand for the request (use first brand, or handle multiple brands)
    const primaryBrand = brandList[0];
    
    try {
      // Call handleExecute directly instead of HTTP request
      // This avoids routing issues and is more reliable
      console.log(`📤 Calling handleExecute directly for ${normalizedEmail}`);
      
      // Create mock request/response objects for handleExecute
      const mockReq = {
        method: 'POST',
        body: {
          email: normalizedEmail,
          brand: primaryBrand,
          brands: brandsParam,
          utm_source: 'bulk_subscribe',
          utm_campaign: 'recovery',
          action: 'subscribe'
        },
        headers: {
          'user-agent': 'BulkSubscribe/1.0'
        },
        url: '/execute'
      };
      
      let responseData = null;
      let responseStatus = 200;
      let responseError = null;
      
      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return mockRes;
        },
        json: (data) => {
          responseData = data;
          return mockRes;
        },
        setHeader: () => mockRes,
        end: () => mockRes
      };
      
      // Call handleExecute directly
      try {
        console.log(`📤 About to call handleExecute with:`, {
          method: mockReq.method,
          body: mockReq.body,
          hasEmail: !!mockReq.body.email,
          hasBrand: !!mockReq.body.brand
        });
        
        await handleExecute(mockReq, mockRes);
        
        console.log(`✅ handleExecute completed. Status: ${responseStatus}`, responseData);
      } catch (executeError) {
        console.error(`❌ handleExecute threw an error:`, executeError);
        throw executeError;
      }
      
      if (responseStatus === 200 && responseData && responseData.success) {
        return {
          email: normalizedEmail,
          success: true,
          userID: userID,
          brands: brandList,
          isNewUser: isNewUser
        };
      } else {
        return {
          email: normalizedEmail,
          success: false,
          error: responseData?.error || `HTTP ${responseStatus}: Execution failed`
        };
      }
    } catch (error) {
      console.error(`❌ Error calling handleExecute:`, error);
      return {
        email: normalizedEmail,
        success: false,
        error: error.message || 'Unknown error'
      };
    }
    
  } catch (error) {
    return {
      email: normalizedEmail,
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  const { emails, brands, subscriptions, options = {} } = req.body;
  
  // Validate input
  if (!emails && !subscriptions) {
    return res.status(400).json({
      error: 'Missing required field: "emails" or "subscriptions"',
      usage: {
        simple: {
          emails: ['email1@example.com', 'email2@example.com'],
          brands: 'thepicklereport' // or ['thepicklereport', 'themixedhome']
        },
        advanced: {
          subscriptions: [
            { email: 'user1@example.com', brands: ['thepicklereport'] },
            { email: 'user2@example.com', brands: ['thepicklereport', 'themixedhome'] }
          ]
        }
      }
    });
  }
  
  // Normalize input format
  let subscriptionList = [];
  
  if (subscriptions) {
    // Advanced format: per-email brands
    subscriptionList = subscriptions.map(sub => ({
      email: sub.email,
      brands: Array.isArray(sub.brands) ? sub.brands : [sub.brands].filter(Boolean)
    }));
  } else {
    // Simple format: same brands for all emails
    const brandList = Array.isArray(brands) ? brands : [brands].filter(Boolean);
    if (brandList.length === 0) {
      return res.status(400).json({ error: 'No brands specified' });
    }
    
    subscriptionList = emails.map(email => ({
      email: email,
      brands: brandList
    }));
  }
  
  // Validate we have subscriptions to process
  if (subscriptionList.length === 0) {
    return res.status(400).json({ error: 'No subscriptions to process' });
  }
  
  const batchSize = options.batchSize || 10; // Default to 10 emails per batch
  const delayBetweenBatches = options.delayBetweenBatches || 500; // 500ms delay between batches
  const dryRun = options.dryRun || false;
  
  // Maximum emails to process in a single request to avoid timeout
  // Vercel functions have a timeout (10s Hobby, 60s Pro), so we limit to 20 emails per request
  const MAX_EMAILS_PER_REQUEST = 20;
  
  // If request exceeds limit, process only the first batch and return remaining
  const shouldChunk = subscriptionList.length > MAX_EMAILS_PER_REQUEST;
  const emailsToProcess = shouldChunk ? subscriptionList.slice(0, MAX_EMAILS_PER_REQUEST) : subscriptionList;
  const remainingEmails = shouldChunk ? subscriptionList.slice(MAX_EMAILS_PER_REQUEST) : [];
  
  console.log(`🚀 Starting bulk subscription processing: ${subscriptionList.length} emails`);
  if (shouldChunk) {
    console.log(`⚠️  Request exceeds limit of ${MAX_EMAILS_PER_REQUEST} emails per request`);
    console.log(`📦 Processing first ${emailsToProcess.length} emails, ${remainingEmails.length} remaining`);
  }
  console.log(`📦 Processing ${batchSize} emails per batch, Delay: ${delayBetweenBatches}ms between batches`);
  
  if (dryRun) {
    return res.status(200).json({
      message: 'Dry run - would process these subscriptions',
      count: subscriptionList.length,
      subscriptions: subscriptionList.slice(0, 10), // Show first 10
      note: 'Add "dryRun": false to execute'
    });
  }
  
  const results = {
    total: subscriptionList.length,
    successful: 0,
    failed: 0,
    results: []
  };
  
  // Process in batches
  for (let i = 0; i < emailsToProcess.length; i += batchSize) {
    const batch = emailsToProcess.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(emailsToProcess.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`);
    
    // Process batch in parallel
    const batchPromises = batch.map(sub => 
      processSingleSubscription(sub.email, sub.brands, options)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      const subscriptionResult = result.status === 'fulfilled' 
        ? result.value 
        : {
            email: batch[index].email,
            success: false,
            error: result.reason?.message || 'Unknown error'
          };
      
      results.results.push(subscriptionResult);
      
      if (subscriptionResult.success) {
        results.successful++;
        console.log(`   ✅ Success: ${subscriptionResult.email}`);
      } else {
        results.failed++;
        console.log(`   ❌ Failed: ${subscriptionResult.email} - ${subscriptionResult.error}`);
      }
    });
    
    // Delay between batches (except for the last batch)
    if (i + batchSize < emailsToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  console.log(`✅ Bulk processing complete: ${results.successful} successful, ${results.failed} failed`);
  
  const response = {
    message: shouldChunk 
      ? `Processed first ${emailsToProcess.length} emails. ${remainingEmails.length} remaining.`
      : 'Bulk subscription processing complete',
    summary: {
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      successRate: `${((results.successful / results.total) * 100).toFixed(1)}%`
    },
    results: results.results,
    errors: results.results.filter(r => !r.success).slice(0, 20) // Show first 20 errors
  };
  
  // If there are remaining emails, include them in the response for automatic chunking
  if (shouldChunk && remainingEmails.length > 0) {
    response.remaining = remainingEmails;
    response.hasMore = true;
  }
  
  return res.status(200).json(response);
}


