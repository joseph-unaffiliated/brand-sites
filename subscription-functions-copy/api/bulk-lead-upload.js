/**
 * Bulk Lead CSV Upload Endpoint
 * 
 * Accepts CSV file upload with explicit brand column and syncs lead tags to Customer.io
 * 
 * POST /api/bulk-lead-upload
 * 
 * Accepts either:
 * 1. Raw CSV text in request body
 * 2. JSON array of lead objects
 * 
 * CSV format (required columns):
 * - email (required)
 * - brand (required) - brand ID (e.g., "hookuplists", "thepicklereport")
 * - first_name (optional)
 * - last_name (optional)
 * 
 * Body format (JSON):
 * {
 *   "leads": [
 *     {
 *       "email": "user@example.com",
 *       "brand": "hookuplists",
 *       "first_name": "First",
 *       "last_name": "Last"
 *     }
 *   ]
 * }
 */

import axios from 'axios';
import { v5 as uuidv5 } from 'uuid';
import { BigQuery } from '@google-cloud/bigquery';
import crypto from 'crypto';

// Namespace UUID for deterministic userID generation (v5)
const USER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

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

// Valid brand IDs (for validation)
const VALID_BRANDS = [
  'batmitzvahhorrorstories', 'grapejuiceandnostalgia', 'hardresets', 'highdiaries',
  'hipspeak', 'hookuplists', 'millennialvsgenz', 'obscuremixtape', 'onetimeatcamp',
  'the90sparent', 'thecomingofageparty', 'thedadsdad', 'theeyeballerscookbook',
  'themixedhome', 'thepackandplay', 'thepicklereport', 'theproudparent',
  'thequirkiest', 'thestewardprize', 'toddlercinema', 'zitsandcake', 'heebnewsletters'
];

function hashEmail(email, salt = process.env.EMAIL_SALT || 'default-salt') {
  try {
    return crypto.createHash('sha256').update(email.toLowerCase() + salt).digest('hex');
  } catch (error) {
    console.error('Email hashing error:', error.message);
    return email;
  }
}

async function validateEmail(email) {
  if (!process.env.EMAILOVERSIGHT_API_KEY) {
    console.log('⚠️ EmailOversight API key not configured, skipping validation');
    return { valid: true, reason: 'no_api_key' };
  }

  try {
    const response = await httpClient.post('https://api.emailoversight.com/api/emailvalidation', {
      ListId: 245740,
      Email: email
    }, {
      headers: { 
        'ApiToken': process.env.EMAILOVERSIGHT_API_KEY
      }
    });

    return {
      valid: response.data.Result === 'Valid' || response.data.Result === 'Verified',
      reason: response.data.Result,
      score: response.data.Score,
      isDisposable: response.data.IsDisposable || false,
      isFree: response.data.IsFree || false
    };
  } catch (error) {
    console.error('Email validation error:', error.message);
    return { valid: true, reason: 'validation_error' };
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
    const [rows] = await bq.query({ query, params: { email: email.toLowerCase() } });
    return rows.length > 0 ? rows[0].userID : null;
  } catch (error) {
    console.error('User lookup error:', error.message);
    return null;
  }
}

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
async function syncLeadTagsToCustomerIO(userID, email, brandId, isNewUser = false) {
  try {
    const identifiers = isNewUser 
      ? { email: email }  // New users: use email only
      : { id: userID };   // Existing users: use ID only
    
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
      // For new users, update the record with ID to populate the ID field
      if (isNewUser) {
        const updateResult = await updateCustomerIORecordWithID(userID, email, {
          [`lead_for_${brandId}`]: true
        });
        
        if (updateResult.success) {
          console.log(`✅ Customer.io record updated with ID for new user`);
        } else {
          console.log(`⚠️ Customer.io ID update failed (non-fatal): ${updateResult.error}`);
        }
      }
      
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update Customer.io record with ID for new users
 * This ensures the ID field is populated after initial creation with email identifier
 */
async function updateCustomerIORecordWithID(userID, normalizedEmail, attributes) {
  try {
    console.log(`🔄 Updating Customer.io record with ID: ${userID}`);
    
    // Create update request with ID identifier
    const updateRequest = {
      type: "person",
      identifiers: {
        id: userID
      },
      action: "identify",
      attributes: {
        email: normalizedEmail,
        ...attributes
      }
    };
    
    const result = await sendBatchedCustomerIORequests([updateRequest]);
    
    if (result.success) {
      console.log(`✅ Customer.io record updated with ID successfully`);
      return { success: true };
    } else {
      console.error(`❌ Customer.io ID update failed: ${result.error}`);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Customer.io ID update error:', error.message);
    return { success: false, error: error.message };
  }
}

async function upsertLeadToUsersTable(email, leadData, validationResult, brandId) {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmail(normalizedEmail);
  const userID = uuidv5(normalizedEmail, USER_NAMESPACE);
  
  // Prepare leadData JSON with brand_interest
  const leadDataJson = JSON.stringify({
    brand_interest: brandId,
    source: 'bulk_upload',
    uploaded_at: new Date().toISOString()
  });
  
  // Check if user already exists
  const existingUserID = await findUserByEmail(normalizedEmail);
  const isNewUser = !existingUserID;
  
  // Use MERGE to handle both insert and update
  const mergeQuery = `
    MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
    USING (
      SELECT 
        @userID AS userID,
        @email AS email,
        @emailHash AS emailHash,
        @firstName AS firstName,
        @lastName AS lastName,
        @leadSource AS leadSource,
        PARSE_JSON(@leadData) AS leadData,
        @emailValidationStatus AS emailValidationStatus,
        @emailValidationReason AS emailValidationReason,
        @emailIsDisposable AS emailIsDisposable,
        @emailIsFree AS emailIsFree,
        CURRENT_TIMESTAMP() AS updatedAt
    ) AS source
    ON target.userID = source.userID
    WHEN MATCHED THEN
      UPDATE SET
        email = COALESCE(target.email, source.email),
        emailHash = COALESCE(target.emailHash, source.emailHash),
        firstName = COALESCE(source.firstName, target.firstName),
        lastName = COALESCE(source.lastName, target.lastName),
        leadSource = COALESCE(source.leadSource, target.leadSource),
        leadData = COALESCE(source.leadData, target.leadData),
        emailValidationStatus = COALESCE(source.emailValidationStatus, target.emailValidationStatus),
        emailValidationReason = COALESCE(source.emailValidationReason, target.emailValidationReason),
        emailIsDisposable = COALESCE(source.emailIsDisposable, target.emailIsDisposable),
        emailIsFree = COALESCE(source.emailIsFree, target.emailIsFree),
        updatedAt = CURRENT_TIMESTAMP()
    WHEN NOT MATCHED THEN
      INSERT (
        userID, email, emailHash, firstName, lastName,
        leadSource, leadData,
        emailValidationStatus, emailValidationReason,
        emailIsDisposable, emailIsFree, createdAt, updatedAt
      )
      VALUES (
        source.userID, source.email, source.emailHash, source.firstName, source.lastName,
        source.leadSource, source.leadData,
        source.emailValidationStatus, source.emailValidationReason,
        source.emailIsDisposable, source.emailIsFree, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
      )
  `;
  
  try {
    await bq.query({
      query: mergeQuery,
      params: {
        userID,
        email: normalizedEmail,
        emailHash,
        firstName: leadData.first_name || null,
        lastName: leadData.last_name || null,
        leadSource: 'bulk_upload',
        leadData: leadDataJson,
        emailValidationStatus: validationResult.reason || null,
        emailValidationReason: validationResult.reason || null,
        emailIsDisposable: validationResult.isDisposable || false,
        emailIsFree: validationResult.isFree || false
      },
      types: {
        userID: 'STRING',
        email: 'STRING',
        emailHash: 'STRING',
        firstName: 'STRING',
        lastName: 'STRING',
        leadSource: 'STRING',
        leadData: 'STRING',
        emailValidationStatus: 'STRING',
        emailValidationReason: 'STRING',
        emailIsDisposable: 'BOOL',
        emailIsFree: 'BOOL'
      }
    });
    
    return { success: true, userID, isNewUser };
  } catch (error) {
    console.error('❌ BigQuery MERGE error:', error.message);
    throw error;
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }
  
  // Parse header
  const headerLine = lines[0];
  const header = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  // Find column indices
  const emailIndex = header.indexOf('email');
  if (emailIndex === -1) {
    throw new Error('CSV must have an "email" column');
  }
  
  const brandIndex = header.indexOf('brand');
  if (brandIndex === -1) {
    throw new Error('CSV must have a "brand" column');
  }
  
  const firstNameIndex = header.indexOf('first_name');
  const lastNameIndex = header.indexOf('last_name');
  
  // Parse data rows
  const leads = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    const email = parts[emailIndex];
    const brand = parts[brandIndex];
    
    if (!email || !brand) continue;
    
    leads.push({
      email: email,
      brand: brand.toLowerCase().trim(),
      first_name: firstNameIndex >= 0 ? parts[firstNameIndex] : null,
      last_name: lastNameIndex >= 0 ? parts[lastNameIndex] : null
    });
  }
  
  return leads;
}

export default async function handler(req, res) {
  console.log('🚀 BULK LEAD CSV UPLOAD ENDPOINT');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    let leads = [];
    
    // Check if body is CSV text or JSON
    if (typeof req.body === 'string' && req.body.includes(',')) {
      // Assume it's CSV text
      console.log('📄 Parsing CSV from request body...');
      leads = parseCSV(req.body);
    } else if (req.body.leads && Array.isArray(req.body.leads)) {
      // JSON array of leads
      console.log('📋 Using leads from JSON body...');
      leads = req.body.leads;
    } else {
      return res.status(400).json({ 
        error: 'Invalid request body. Expected JSON with "leads" array or CSV text in body.' 
      });
    }
    
    await processLeads(leads, res);
    
  } catch (error) {
    console.error('❌ Processing error:', error);
    return res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
}

async function processLeads(leads, res, resolve = null, reject = null) {
  try {
    if (leads.length === 0) {
      const response = res.status(400).json({ error: 'No leads found in request' });
      if (resolve) resolve(response);
      return response;
    }
    
    console.log(`📊 Processing ${leads.length} leads...`);
    
    const results = {
      total: leads.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      leadTagsSynced: 0,
      errors: []
    };
    
    // Process each lead
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const rowNum = i + 1;
      
      try {
        if (!lead.email) {
          results.skipped++;
          results.errors.push({ row: rowNum, email: 'N/A', error: 'Missing email' });
          continue;
        }
        
        if (!lead.brand) {
          results.skipped++;
          results.errors.push({ row: rowNum, email: lead.email, error: 'Missing brand' });
          continue;
        }
        
        // Validate brand
        if (!VALID_BRANDS.includes(lead.brand)) {
          results.skipped++;
          results.errors.push({ row: rowNum, email: lead.email, error: `Invalid brand: ${lead.brand}` });
          continue;
        }
        
        const normalizedEmail = lead.email.toLowerCase().trim();
        console.log(`[${rowNum}/${leads.length}] Processing: ${normalizedEmail.substring(0, 10)}*** (${lead.brand})`);
        
        // Validate email
        const validationResult = await validateEmail(normalizedEmail);
        
        if (!validationResult.valid) {
          results.skipped++;
          results.errors.push({ 
            row: rowNum, 
            email: normalizedEmail, 
            error: `Email validation failed: ${validationResult.reason}` 
          });
          continue;
        }
        
        // Upsert to BigQuery
        const result = await upsertLeadToUsersTable(
          normalizedEmail,
          lead,
          validationResult,
          lead.brand
        );
        
        results.successful++;
        console.log(`✅ ${result.isNewUser ? 'Created' : 'Updated'} lead in BigQuery`);
        
        // Fetch the updated user record to check lead qualification
        if (result.success) {
          try {
            const userQuery = `
              SELECT userID, email, leadData, subscriptions, unsubscribed_brands
              FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
              WHERE userID = @userID 
              LIMIT 1
            `;
            
            const [userRows] = await bq.query({ 
              query: userQuery, 
              params: { userID: result.userID } 
            });
            
            if (userRows.length > 0) {
              const user = userRows[0];
              
              // Check if user qualifies as lead
              if (isUserLeadForBrand(user, lead.brand)) {
                // Sync lead tag to Customer.io
                const tagResult = await syncLeadTagsToCustomerIO(
                  result.userID,
                  normalizedEmail,
                  lead.brand,
                  result.isNewUser
                );
                
                if (tagResult.success) {
                  results.leadTagsSynced++;
                  console.log(`✅ Lead tag synced to Customer.io for brand ${lead.brand}`);
                } else {
                  console.log(`⚠️ Failed to sync lead tag (non-fatal): ${tagResult.error}`);
                }
              }
            }
          } catch (error) {
            // Don't fail if Customer.io sync fails
            console.error('⚠️ Error syncing lead tag (non-fatal):', error.message);
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.failed++;
        const email = lead.email || 'unknown';
        results.errors.push({ row: rowNum, email, error: error.message });
        console.error(`❌ Row ${rowNum} error:`, error.message);
      }
    }
    
    console.log(`\n📊 Processing Complete!`);
    console.log(`Total: ${results.total}, Successful: ${results.successful}, Failed: ${results.failed}, Skipped: ${results.skipped}, Lead Tags Synced: ${results.leadTagsSynced}`);
    
    const response = res.status(200).json({
      success: true,
      summary: results,
      message: `Processed ${results.total} leads: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped, ${results.leadTagsSynced} lead tags synced to Customer.io`
    });
    
    if (resolve) resolve(response);
    return response;
    
  } catch (error) {
    const response = res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
    if (reject) reject(error);
    else if (resolve) resolve(response);
    return response;
  }
}
