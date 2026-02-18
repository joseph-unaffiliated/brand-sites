/**
 * One-Time Lead Sync Script
 * 
 * Processes all existing users in BigQuery and syncs current leads to Customer.io
 * 
 * POST /api/sync-all-leads-to-cio
 * 
 * Query parameters:
 * - limit: Maximum number of users to process (optional, default: all)
 * - batchSize: Number of users to process per batch (optional, default: 100)
 * - dryRun: If true, only logs what would be done without making changes (optional, default: false)
 * 
 * Example:
 * POST /api/sync-all-leads-to-cio?limit=1000&batchSize=50&dryRun=false
 */

import axios from 'axios';
import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

// HTTP client with timeout
const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Customer.io API configuration
const CIO_SITE_ID = process.env.CIO_SITE_ID;
const CIO_API_KEY = process.env.CIO_API_KEY;
const CIO_TRACK_URL = process.env.CIO_TRACK_URL || 'https://track.customer.io/api/v2';

// Create basic auth header
const cioAuth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');

/**
 * Check if a user qualifies as a lead for a specific brand
 */
function isUserLeadForBrand(user, brandId) {
  if (!user || !brandId) return false;
  
  // Parse leadData JSON to extract brand_interest
  let brandInterest = null;
  if (user.leadData) {
    try {
      const leadData = typeof user.leadData === 'string' ? JSON.parse(user.leadData) : user.leadData;
      brandInterest = leadData.brand_interest;
    } catch (e) {
      return false;
    }
  }
  
  // Check if brand_interest matches
  if (brandInterest !== brandId) {
    return false;
  }
  
  // Check if subscriptions is NULL or empty
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
    return false; // User has subscriptions, not a lead
  }
  
  // Check if brand is NOT in unsubscribed_brands
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
    return false; // User unsubscribed from this brand, not a lead
  }
  
  return true;
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
 * Sync lead tags to Customer.io
 */
async function syncLeadTagsToCustomerIO(userID, email, brandId) {
  try {
    const identifiers = { id: userID };
    
    const cioRequest = {
      type: "person",
      identifiers: identifiers,
      action: "identify",
      attributes: {
        email: email,
        [`lead_for_${brandId}`]: true
      }
    };
    
    const result = await sendBatchedCustomerIORequests([cioRequest]);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all users from BigQuery
 */
async function getAllUsers(limit = null) {
  try {
    let query = `
      SELECT userID, email, leadData, subscriptions, unsubscribed_brands
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE leadData IS NOT NULL
    `;
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    console.log('📊 Querying BigQuery for users with leadData...');
    const [rows] = await bq.query({ query });
    
    console.log(`✅ Found ${rows.length} users with leadData`);
    return rows;
  } catch (error) {
    console.error('❌ Error querying BigQuery:', error.message);
    throw error;
  }
}

/**
 * Extract brand_interest from leadData
 */
function extractBrandInterest(leadData) {
  if (!leadData) return null;
  
  try {
    const parsed = typeof leadData === 'string' ? JSON.parse(leadData) : leadData;
    return parsed.brand_interest || null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  console.log('🚀 ONE-TIME LEAD SYNC SCRIPT');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get query parameters
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const batchSize = req.query.batchSize ? parseInt(req.query.batchSize) : 100;
    const dryRun = req.query.dryRun === 'true';
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    }
    
    // Get all users with leadData
    const users = await getAllUsers(limit);
    
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users with leadData found',
        summary: {
          total: 0,
          processed: 0,
          leadsFound: 0,
          tagsSynced: 0,
          errors: 0
        }
      });
    }
    
    console.log(`📊 Processing ${users.length} users in batches of ${batchSize}...`);
    
    const results = {
      total: users.length,
      processed: 0,
      leadsFound: 0,
      tagsSynced: 0,
      errors: 0,
      errorDetails: []
    };
    
    // Process in batches
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(users.length / batchSize);
      
      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} users)...`);
      
      // Process batch
      for (const user of batch) {
        try {
          results.processed++;
          
          // Extract brand_interest from leadData
          const brandInterest = extractBrandInterest(user.leadData);
          
          if (!brandInterest) {
            continue; // No brand_interest, skip
          }
          
          // Check if user qualifies as lead
          if (isUserLeadForBrand(user, brandInterest)) {
            results.leadsFound++;
            
            if (!dryRun) {
              // Sync lead tag to Customer.io
              const tagResult = await syncLeadTagsToCustomerIO(
                user.userID,
                user.email,
                brandInterest
              );
              
              if (tagResult.success) {
                results.tagsSynced++;
                console.log(`✅ Synced lead tag for ${user.email.substring(0, 10)}*** (${brandInterest})`);
              } else {
                results.errors++;
                results.errorDetails.push({
                  userID: user.userID,
                  email: user.email,
                  brand: brandInterest,
                  error: tagResult.error
                });
                console.error(`❌ Failed to sync lead tag for ${user.email}: ${tagResult.error}`);
              }
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 50));
            } else {
              console.log(`🔍 [DRY RUN] Would sync lead tag for ${user.email.substring(0, 10)}*** (${brandInterest})`);
            }
          }
        } catch (error) {
          results.errors++;
          results.errorDetails.push({
            userID: user.userID,
            email: user.email,
            error: error.message
          });
          console.error(`❌ Error processing user ${user.userID}:`, error.message);
        }
      }
      
      // Delay between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        console.log(`⏳ Waiting 1 second before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n✅ Sync completed!`);
    console.log(`📊 Summary:`);
    console.log(`   Total users: ${results.total}`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Leads found: ${results.leadsFound}`);
    console.log(`   Tags synced: ${results.tagsSynced}`);
    console.log(`   Errors: ${results.errors}`);
    
    return res.status(200).json({
      success: true,
      dryRun,
      summary: results,
      message: dryRun 
        ? `Dry run completed: Would sync ${results.leadsFound} lead tags`
        : `Sync completed: ${results.tagsSynced} lead tags synced to Customer.io`
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return res.status(500).json({
      error: 'Sync failed',
      message: error.message
    });
  }
}
