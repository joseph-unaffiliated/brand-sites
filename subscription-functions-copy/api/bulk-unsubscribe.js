/**
 * Bulk Unsubscribe Endpoint
 * Unsubscribes multiple emails from one or more brands
 * 
 * POST /api/bulk-unsubscribe
 * Body: {
 *   "emails": ["email1@example.com", "email2@example.com"],
 *   "brand": "heebnewsletters" or ["heebnewsletters", "thepicklereport"],
 *   "options": {
 *     "batchSize": 10,
 *     "delayBetweenBatches": 500
 *   }
 * }
 * 
 * Or with per-email brands:
 * {
 *   "unsubscribes": [
 *     { "email": "user1@example.com", "brands": ["heebnewsletters"] },
 *     { "email": "user2@example.com", "brands": ["heebnewsletters", "thepicklereport"] }
 *   ]
 * }
 * 
 * Or CSV format:
 * Body: "email,brand\nuser1@example.com,heebnewsletters\nuser2@example.com,heebnewsletters"
 */

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import crypto from 'crypto';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

// Customer.io API configuration
const CIO_SITE_ID = process.env.CIO_SITE_ID;
const CIO_API_KEY = process.env.CIO_API_KEY;
const CIO_TRACK_URL = process.env.CIO_TRACK_URL || 'https://track.customer.io/api/v2';

// Create basic auth header
const cioAuth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');

// Mapping from brand IDs to Customer.io brand object names
const CUSTOMER_IO_BRAND_NAMES = {
  'batmitzvahhorrorstories': 'Bat Mitzvah Horror Stories',
  'grapejuiceandnostalgia': 'Grape Juice and Nostalgia',
  'hardresets': 'Hard Resets',
  'highdiaries': 'High Diaries',
  'hipspeak': 'Hipspeak',
  'hookuplists': 'Hookup Lists',
  'millennialvsgenz': 'Millennial vs Gen Z',
  'obscuremixtape': 'Obscure Mixtape',
  'onetimeatcamp': 'One Time at Camp',
  'the90sparent': 'The 90s Parent',
  'thecomingofageparty': 'The Coming of Age Party',
  'thedadsdad': 'The Dad\'s Dad',
  'theeyeballerscookbook': 'The Eyeballer\'s Cookbook',
  'themixedhome': 'The Mixed Home',
  'thepackandplay': 'The Pack and Play',
  'thepicklereport': 'The Pickle Report',
  'theproudparent': 'The Proud Parent',
  'thequirkiest': 'The Quirkiest',
  'thestewardprize': 'The Steward Prize',
  'toddlercinema': 'Toddler Cinema',
  'zitsandcake': 'Zits and Cake',
  'heebnewsletters': 'Heeb Newsletters'
};

// HTTP client with timeout
const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function findUserByEmail(email) {
  const query = `
    SELECT userID 
    FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
    WHERE email = @email 
    LIMIT 1
  `;
  
  try {
    const [rows] = await bq.query({ query, params: { email: email.toLowerCase() } });
    return rows.length > 0 ? rows[0].userID : null;
  } catch (error) {
    console.error('User lookup error:', error.message);
    return null;
  }
}

/**
 * Send batched requests to Customer.io
 */
async function sendBatchedCustomerIORequests(batchRequests) {
  try {
    const response = await httpClient.post(`${CIO_TRACK_URL}/batch`, {
      batch: batchRequests
    }, {
      headers: {
        'Authorization': `Basic ${cioAuth}`
      }
    });

    return { success: true, response: response.data };
    
  } catch (error) {
    console.error('❌ Batch request failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Remove brand relationships from Customer.io
 */
async function removeBrandRelationships(userID, brandIds, normalizedEmail) {
  const relationships = brandIds.map(brandId => ({
    identifiers: {
      object_type_id: "1",
      object_id: CUSTOMER_IO_BRAND_NAMES[brandId] || brandId
    }
  }));
  
  // Prepare unsubscription attributes
  const unsubscribeAttributes = {};
  const unsubscribeDate = new Date().getTime();
  
  // Add unsubscribed_brands attribute
  const unsubscribedBrandsObj = {};
  brandIds.forEach(brandId => {
    unsubscribedBrandsObj[brandId] = unsubscribeDate;
  });
  unsubscribeAttributes['unsubscribed_brands'] = unsubscribedBrandsObj;
  
  // Remove individual brand subscription attributes
  brandIds.forEach(brandId => {
    unsubscribeAttributes[`subscribed_to_${brandId}`] = false;
    unsubscribeAttributes[`${brandId}_subscription_date`] = null;
    unsubscribeAttributes[`lead_for_${brandId}`] = false;
  });
  
  // Create batched requests for unsubscribe
  const attributeRequest = {
    type: "person",
    identifiers: { id: userID },
    action: "identify",
    attributes: {
      email: normalizedEmail,
      ...unsubscribeAttributes
    }
  };
  
  const relationshipRequest = {
    type: "person",
    identifiers: { id: userID },
    action: "delete_relationships",
    cio_relationships: relationships
  };
  
  try {
    const batchRequests = [attributeRequest, relationshipRequest];
    const result = await sendBatchedCustomerIORequests(batchRequests);
    
    if (result.success) {
      return { 
        success: true, 
        removed_brands: brandIds,
        unsubscribe_date: new Date(unsubscribeDate).toISOString()
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove brand from subscriptions and log unsubscription to BigQuery
 */
async function removeBrandFromSubscriptionsAndLogUnsubscription(userId, brandId, unsubscribeDate, normalizedEmail) {
  try {
    // First, get current user data to update both subscriptions and unsubscribed_brands
    const query = `
      SELECT userID, subscriptions, unsubscribed_brands
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE userID = @userID 
      LIMIT 1
    `;
    
    const [rows] = await bq.query({ query, params: { userID: userId } });
    
    if (rows.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const currentUser = rows[0];
    let subscriptions = {};
    let unsubscribedBrands = {};
    
    // Parse existing subscriptions if they exist
    if (currentUser.subscriptions) {
      try {
        subscriptions = typeof currentUser.subscriptions === 'string' 
          ? JSON.parse(currentUser.subscriptions) 
          : currentUser.subscriptions;
      } catch (e) {
        subscriptions = {};
      }
    }
    
    // Parse existing unsubscribed_brands if they exist
    if (currentUser.unsubscribed_brands) {
      try {
        unsubscribedBrands = typeof currentUser.unsubscribed_brands === 'string'
          ? JSON.parse(currentUser.unsubscribed_brands)
          : currentUser.unsubscribed_brands;
      } catch (e) {
        unsubscribedBrands = {};
      }
    }
    
    // Remove brand from subscriptions
    if (subscriptions[brandId]) {
      delete subscriptions[brandId];
    }
    
    // Add/update unsubscription entry for this brand
    unsubscribedBrands[brandId] = new Date(unsubscribeDate).getTime();
    
    // Use MERGE to update
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
      USING (
        SELECT 
          @userID as userID,
          PARSE_JSON(@subscriptions) as subscriptions,
          @unsubscribed_brands as unsubscribed_brands
      ) AS source
      ON target.userID = source.userID
      WHEN MATCHED THEN
        UPDATE SET 
          subscriptions = source.subscriptions,
          unsubscribed_brands = source.unsubscribed_brands
    `;
    
    await bq.query({
      query: mergeQuery,
      params: {
        userID: userId,
        subscriptions: JSON.stringify(subscriptions),
        unsubscribed_brands: JSON.stringify(unsubscribedBrands)
      },
      types: {
        userID: 'STRING',
        subscriptions: 'STRING',
        unsubscribed_brands: 'STRING'
      }
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ BigQuery subscription/unsubscription update error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Process a single unsubscribe
 */
async function processSingleUnsubscribe(email, brandIds) {
  const normalizedEmail = email.toLowerCase().trim();
  const brandList = Array.isArray(brandIds) ? brandIds : [brandIds].filter(Boolean);
  
  if (brandList.length === 0) {
    return {
      email: normalizedEmail,
      success: false,
      error: 'No brands specified'
    };
  }
  
  try {
    // Find user by email
    const userID = await findUserByEmail(normalizedEmail);
    
    if (!userID) {
      return {
        email: normalizedEmail,
        success: false,
        error: 'User not found'
      };
    }
    
    // Process unsubscription for each brand
    const results = [];
    for (const brandId of brandList) {
      // Remove brand relationships from Customer.io
      const cioResult = await removeBrandRelationships(userID, [brandId], normalizedEmail);
      
      if (cioResult.success) {
        // Remove brand from BigQuery subscriptions AND log unsubscription
        const bqResult = await removeBrandFromSubscriptionsAndLogUnsubscription(
          userID, 
          brandId, 
          cioResult.unsubscribe_date,
          normalizedEmail
        );
        
        if (bqResult.success) {
          results.push({ brand: brandId, success: true });
        } else {
          results.push({ brand: brandId, success: false, error: `BigQuery update failed: ${bqResult.error}` });
        }
      } else {
        results.push({ brand: brandId, success: false, error: `Customer.io update failed: ${cioResult.error}` });
      }
    }
    
    const allSuccessful = results.every(r => r.success);
    
    return {
      email: normalizedEmail,
      success: allSuccessful,
      brands: results,
      error: allSuccessful ? null : 'Some brands failed to unsubscribe'
    };
    
  } catch (error) {
    return {
      email: normalizedEmail,
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }
  
  const headerLine = lines[0];
  const header = headerLine.split(',').map(h => h.toLowerCase().trim());
  
  const emailIndex = header.indexOf('email');
  if (emailIndex === -1) {
    throw new Error('CSV must have an "email" column');
  }
  
  const brandIndex = header.indexOf('brand');
  if (brandIndex === -1) {
    throw new Error('CSV must have a "brand" column');
  }
  
  const unsubscribes = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',').map(p => p.trim());
    const email = parts[emailIndex];
    const brand = parts[brandIndex];
    
    if (!email || !brand) continue;
    
    unsubscribes.push({
      email: email,
      brands: [brand.toLowerCase().trim()]
    });
  }
  
  return unsubscribes;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  let unsubscribeList = [];
  
  // Check if body is CSV text or JSON
  if (typeof req.body === 'string' && req.body.includes(',')) {
    // Assume it's CSV text
    console.log('📄 Parsing CSV from request body...');
    try {
      unsubscribeList = parseCSV(req.body);
    } catch (error) {
      return res.status(400).json({ error: `CSV parsing error: ${error.message}` });
    }
  } else if (req.body.unsubscribes && Array.isArray(req.body.unsubscribes)) {
    // Advanced format: per-email brands
    unsubscribeList = req.body.unsubscribes.map(item => ({
      email: item.email,
      brands: Array.isArray(item.brands) ? item.brands : [item.brands].filter(Boolean)
    }));
  } else if (req.body.emails && req.body.brand) {
    // Simple format: same brand(s) for all emails
    const brandList = Array.isArray(req.body.brand) ? req.body.brand : [req.body.brand].filter(Boolean);
    if (brandList.length === 0) {
      return res.status(400).json({ error: 'No brands specified' });
    }
    
    unsubscribeList = req.body.emails.map(email => ({
      email: email,
      brands: brandList
    }));
  } else {
    return res.status(400).json({
      error: 'Invalid request body',
      usage: {
        simple: {
          emails: ['email1@example.com', 'email2@example.com'],
          brand: 'heebnewsletters' // or ['heebnewsletters', 'thepicklereport']
        },
        advanced: {
          unsubscribes: [
            { email: 'user1@example.com', brands: ['heebnewsletters'] },
            { email: 'user2@example.com', brands: ['heebnewsletters', 'thepicklereport'] }
          ]
        },
        csv: 'email,brand\nuser1@example.com,heebnewsletters\nuser2@example.com,heebnewsletters'
      }
    });
  }
  
  if (unsubscribeList.length === 0) {
    return res.status(400).json({ error: 'No unsubscribes to process' });
  }
  
  const options = req.body.options || {};
  const batchSize = options.batchSize || 10;
  const delayBetweenBatches = options.delayBetweenBatches || 500;
  const dryRun = options.dryRun || false;
  
  console.log(`🚀 Starting bulk unsubscribe processing: ${unsubscribeList.length} emails`);
  console.log(`📦 Batch size: ${batchSize}, Delay: ${delayBetweenBatches}ms`);
  
  if (dryRun) {
    return res.status(200).json({
      success: true,
      dryRun: true,
      message: `Would process ${unsubscribeList.length} unsubscribes`,
      unsubscribes: unsubscribeList
    });
  }
  
  const results = {
    total: unsubscribeList.length,
    successful: 0,
    failed: 0,
    errors: []
  };
  
  // Process in batches
  for (let i = 0; i < unsubscribeList.length; i += batchSize) {
    const batch = unsubscribeList.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(unsubscribeList.length / batchSize);
    
    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} emails)`);
    
    // Process batch in parallel
    const batchPromises = batch.map(item => 
      processSingleUnsubscribe(item.email, item.brands)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      if (result.success) {
        results.successful++;
        console.log(`✅ ${result.email}: Unsubscribed from ${result.brands.length} brand(s)`);
      } else {
        results.failed++;
        results.errors.push({
          email: result.email,
          error: result.error
        });
        console.log(`❌ ${result.email}: ${result.error}`);
      }
    }
    
    // Delay between batches (except for the last batch)
    if (i + batchSize < unsubscribeList.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  console.log(`\n📊 Processing Complete!`);
  console.log(`Total: ${results.total}, Successful: ${results.successful}, Failed: ${results.failed}`);
  
  return res.status(200).json({
    success: true,
    summary: results,
    message: `Processed ${results.total} unsubscribes: ${results.successful} successful, ${results.failed} failed`
  });
}
