/**
 * BigQuery to Customer.io Integration Script
 * Syncs user data from BigQuery to Customer.io
 */

import { BigQuery } from '@google-cloud/bigquery';
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

// Brand mapping for Customer.io object names
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

function hashEmail(email, salt = process.env.EMAIL_SALT || 'default-salt') {
  try {
    return crypto.createHash('sha256').update(email + salt).digest('hex');
  } catch (error) {
    console.error('Email hashing error:', error.message);
    return email;
  }
}

/**
 * Convert BigQuery subscriptions JSON to Customer.io brand relationships
 */
function convertSubscriptionsToRelationships(subscriptionsJson) {
  const relationships = [];
  
  if (!subscriptionsJson) return relationships;
  
  try {
    const subscriptions = typeof subscriptionsJson === 'string' 
      ? JSON.parse(subscriptionsJson) 
      : subscriptionsJson;
    
    for (const [brandId, subscriptionData] of Object.entries(subscriptions)) {
      const cioBrandName = CUSTOMER_IO_BRAND_NAMES[brandId];
      if (cioBrandName) {
        relationships.push({
          identifiers: {
            object_type_id: "1",
            object_id: cioBrandName
          }
        });
      }
    }
  } catch (error) {
    console.error('Error parsing subscriptions:', error.message);
  }
  
  return relationships;
}

/**
 * Sync a single user from BigQuery to Customer.io
 */
async function syncUserToCustomerIO(user) {
  try {
    console.log(`🔄 Syncing user ${user.userID} to Customer.io...`);
    
    // Convert subscriptions to Customer.io format
    const subscribedBrands = {};
    const relationships = convertSubscriptionsToRelationships(user.subscriptions);
    
    if (user.subscriptions) {
      try {
        const subscriptions = typeof user.subscriptions === 'string' 
          ? JSON.parse(user.subscriptions) 
          : user.subscriptions;
        
        for (const [brandId, subscriptionData] of Object.entries(subscriptions)) {
          subscribedBrands[brandId] = subscriptionData.subscribed_timestamp || subscriptionData;
        }
      } catch (error) {
        console.error(`Error parsing subscriptions for user ${user.userID}:`, error.message);
      }
    }
    
    // Parse unsubscribed brands
    let unsubscribedBrands = {};
    if (user.unsubscribed_brands) {
      try {
        unsubscribedBrands = typeof user.unsubscribed_brands === 'string'
          ? JSON.parse(user.unsubscribed_brands)
          : user.unsubscribed_brands;
      } catch (error) {
        console.error(`Error parsing unsubscribed_brands for user ${user.userID}:`, error.message);
      }
    }
    
    // Prepare Customer.io person data
    const personData = {
      type: "person",
      identifiers: {
        id: user.userID,
        email: user.email
      },
      action: "identify",
      attributes: {
        email: user.email,
        emailHash: user.emailHash,
        subscribed_brands: subscribedBrands,
        unsubscribed_brands: unsubscribedBrands,
        recentClickDate: user.recentClickDate,
        createdAt: user.createdAt
      },
      cio_relationships: relationships
    };
    
    // Send to Customer.io
    const auth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');
    const response = await fetch(`${CIO_TRACK_URL}/entity`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(personData)
    });
    
    if (response.ok) {
      console.log(`✅ Successfully synced user ${user.userID} to Customer.io`);
      return { success: true, userID: user.userID };
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to sync user ${user.userID}: ${errorText}`);
      return { success: false, userID: user.userID, error: errorText };
    }
    
  } catch (error) {
    console.error(`❌ Error syncing user ${user.userID}:`, error.message);
    return { success: false, userID: user.userID, error: error.message };
  }
}

/**
 * Sync all users from BigQuery to Customer.io
 */
async function syncAllUsersToCustomerIO(options = {}) {
  const {
    batchSize = 100,
    offset = 0,
    limit = null,
    dryRun = false
  } = options;
  
  try {
    console.log('🚀 Starting BigQuery to Customer.io sync...');
    
    // Build query
    let query = `
      SELECT 
        userID,
        email,
        emailHash,
        subscriptions,
        unsubscribed_brands,
        recentClickDate,
        createdAt
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE email IS NOT NULL
      ORDER BY createdAt DESC
    `;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    if (offset > 0) {
      query += ` OFFSET ${offset}`;
    }
    
    console.log('📊 Fetching users from BigQuery...');
    const [rows] = await bq.query({ query });
    
    console.log(`📈 Found ${rows.length} users to sync`);
    
    if (dryRun) {
      console.log('🔍 DRY RUN - Would sync these users:');
      rows.slice(0, 5).forEach(user => {
        console.log(`  - ${user.userID}: ${user.email}`);
      });
      return { success: true, count: rows.length, dryRun: true };
    }
    
    // Process in batches
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(user => syncUserToCustomerIO(user));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.successful++;
        } else {
          results.failed++;
          const error = result.status === 'rejected' 
            ? result.reason 
            : result.value.error;
          results.errors.push({
            userID: batch[index].userID,
            error: error
          });
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('✅ Sync completed!');
    console.log(`📊 Results: ${results.successful} successful, ${results.failed} failed`);
    
    if (results.errors.length > 0) {
      console.log('❌ Errors:');
      results.errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error.userID}: ${error.error}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync specific users by email list
 */
async function syncUsersByEmail(emails, options = {}) {
  const { dryRun = false } = options;
  
  try {
    console.log(`🔄 Syncing ${emails.length} specific users...`);
    
    // Build query for specific emails
    const emailList = emails.map(email => `'${email}'`).join(',');
    const query = `
      SELECT 
        userID,
        email,
        emailHash,
        subscriptions,
        unsubscribed_brands,
        recentClickDate,
        createdAt
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE email IN (${emailList})
    `;
    
    const [rows] = await bq.query({ query });
    console.log(`📊 Found ${rows.length} users matching email list`);
    
    if (dryRun) {
      console.log('🔍 DRY RUN - Would sync these users:');
      rows.forEach(user => {
        console.log(`  - ${user.userID}: ${user.email}`);
      });
      return { success: true, count: rows.length, dryRun: true };
    }
    
    // Sync each user
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (const user of rows) {
      const result = await syncUserToCustomerIO(user);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          userID: user.userID,
          error: result.error
        });
      }
    }
    
    console.log(`✅ Sync completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Validate data consistency between BigQuery and Customer.io
 */
async function validateDataConsistency(options = {}) {
  const { sampleSize = 100 } = options;
  
  try {
    console.log('🔍 Validating data consistency...');
    
    // Get sample of users from BigQuery
    const query = `
      SELECT 
        userID,
        email,
        subscriptions,
        unsubscribed_brands
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE email IS NOT NULL
      ORDER BY RAND()
      LIMIT ${sampleSize}
    `;
    
    const [rows] = await bq.query({ query });
    console.log(`📊 Checking ${rows.length} users for consistency...`);
    
    const issues = [];
    
    for (const user of rows) {
      try {
        // Get user from Customer.io
        const auth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');
        const response = await fetch(`${CIO_TRACK_URL}/entity`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          url: `${CIO_TRACK_URL}/entity?type=person&id=${user.userID}`
        });
        
        if (response.ok) {
          const cioUser = await response.json();
          
          // Compare subscriptions
          const bqSubscriptions = user.subscriptions ? 
            (typeof user.subscriptions === 'string' ? JSON.parse(user.subscriptions) : user.subscriptions) : {};
          const cioSubscriptions = cioUser.attributes?.subscribed_brands || {};
          
          // Check for mismatches
          const bqBrands = Object.keys(bqSubscriptions);
          const cioBrands = Object.keys(cioSubscriptions);
          
          if (bqBrands.length !== cioBrands.length || 
              !bqBrands.every(brand => cioBrands.includes(brand))) {
            issues.push({
              userID: user.userID,
              email: user.email,
              type: 'subscription_mismatch',
              bqBrands,
              cioBrands
            });
          }
        } else {
          issues.push({
            userID: user.userID,
            email: user.email,
            type: 'not_found_in_cio',
            error: await response.text()
          });
        }
        
      } catch (error) {
        issues.push({
          userID: user.userID,
          email: user.email,
          type: 'validation_error',
          error: error.message
        });
      }
    }
    
    console.log(`🔍 Validation complete: ${issues.length} issues found`);
    
    if (issues.length > 0) {
      console.log('❌ Issues found:');
      issues.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.userID}: ${issue.type}`);
      });
    }
    
    return { issues, totalChecked: rows.length };
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Export functions for use in other scripts
export {
  syncAllUsersToCustomerIO,
  syncUsersByEmail,
  syncUserToCustomerIO,
  validateDataConsistency
};

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const options = {};
  
  // Parse command line options
  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--dry-run') options.dryRun = true;
    if (arg === '--batch-size') options.batchSize = parseInt(process.argv[++i]);
    if (arg === '--limit') options.limit = parseInt(process.argv[++i]);
    if (arg === '--offset') options.offset = parseInt(process.argv[++i]);
    if (arg === '--sample-size') options.sampleSize = parseInt(process.argv[++i]);
  }
  
  switch (command) {
    case 'sync-all':
      await syncAllUsersToCustomerIO(options);
      break;
    case 'validate':
      await validateDataConsistency(options);
      break;
    default:
      console.log('Usage:');
      console.log('  node bq-to-cio-sync.js sync-all [--dry-run] [--batch-size 100] [--limit 1000] [--offset 0]');
      console.log('  node bq-to-cio-sync.js validate [--sample-size 100]');
      console.log('  node bq-to-cio-sync.js sync-emails email1@example.com email2@example.com [--dry-run]');
  }
}
