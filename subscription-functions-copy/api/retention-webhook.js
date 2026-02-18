/**
 * Retention.com Webhook Handler
 * 
 * Processes webhooks from Retention.com that contain lead data.
 * These leads are NOT automatically subscribed, but are stored in BigQuery
 * with brand interest indicated by the landing_page_domain.
 * 
 * Webhook URL: https://magic.unaffiliated.co/retention
 * 
 * Payload structure:
 * {
 *   "email": "test@retention.com",
 *   "email_domain": "@retention.com",
 *   "first_name": "First Name",
 *   "last_name": "Last Name",
 *   "clicked_at": "Mon, 28 Nov 2022 19:47:42 UTC +00:00",
 *   "landing_page_url": "https://yourwebsite.com",
 *   "landing_page_domain": "yourwebsite.com",
 *   "referrer": "https://some.referralurl.com",
 *   "page_title": "Page Title Here"
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

// Domain to brand ID mapping
// Maps landing_page_domain to brand IDs
const DOMAIN_TO_BRAND = {
  'thepicklereport.com': 'thepicklereport',
  'themixedhome.com': 'themixedhome',
  'batmitzvahhorrorstories.com': 'batmitzvahhorrorstories',
  'grapejuiceandnostalgia.com': 'grapejuiceandnostalgia',
  'hardresets.com': 'hardresets',
  'highdiaries.com': 'highdiaries',
  'hipspeak.com': 'hipspeak',
  'hookuplists.com': 'hookuplists',
  'millennialvsgenz.com': 'millennialvsgenz',
  'obscuremixtape.com': 'obscuremixtape',
  'onetimeatcamp.com': 'onetimeatcamp',
  'the90sparent.com': 'the90sparent',
  'thecomingofageparty.com': 'thecomingofageparty',
  'thedadsdad.com': 'thedadsdad',
  'theeyeballerscookbook.com': 'theeyeballerscookbook',
  'thepackandplay.com': 'thepackandplay',
  'theproudparent.com': 'theproudparent',
  'thequirkiest.com': 'thequirkiest',
  'thestewardprize.com': 'thestewardprize',
  'toddlercinema.com': 'toddlercinema',
  'zitsandcake.com': 'zitsandcake',
  // Also support www. variants
  'www.themixedhome.com': 'themixedhome',
  'www.thepicklereport.com': 'thepicklereport',
  'www.batmitzvahhorrorstories.com': 'batmitzvahhorrorstories',
  'www.grapejuiceandnostalgia.com': 'grapejuiceandnostalgia',
  'www.hardresets.com': 'hardresets',
  'www.highdiaries.com': 'highdiaries',
  'www.hipspeak.com': 'hipspeak',
  'www.hookuplists.com': 'hookuplists',
  'www.millennialvsgenz.com': 'millennialvsgenz',
  'www.obscuremixtape.com': 'obscuremixtape',
  'www.onetimeatcamp.com': 'onetimeatcamp',
  'www.the90sparent.com': 'the90sparent',
  'www.thecomingofageparty.com': 'thecomingofageparty',
  'www.thedadsdad.com': 'thedadsdad',
  'www.theeyeballerscookbook.com': 'theeyeballerscookbook',
  'www.thepackandplay.com': 'thepackandplay',
  'www.theproudparent.com': 'theproudparent',
  'www.thequirkiest.com': 'thequirkiest',
  'www.thestewardprize.com': 'thestewardprize',
  'www.toddlercinema.com': 'toddlercinema',
  'www.zitsandcake.com': 'zitsandcake',
  'heebnewsletters.com': 'heebnewsletters',
  'www.heebnewsletters.com': 'heebnewsletters',
};

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

function determineBrandFromDomain(landingPageDomain) {
  if (!landingPageDomain) return null;
  
  // Normalize domain (remove www., lowercase)
  const normalizedDomain = landingPageDomain.toLowerCase().replace(/^www\./, '');
  
  // Direct match
  if (DOMAIN_TO_BRAND[normalizedDomain]) {
    return DOMAIN_TO_BRAND[normalizedDomain];
  }
  
  // Also check with www. prefix
  if (DOMAIN_TO_BRAND[`www.${normalizedDomain}`]) {
    return DOMAIN_TO_BRAND[`www.${normalizedDomain}`];
  }
  
  console.log(`⚠️ Could not determine brand from domain: ${landingPageDomain}`);
  return null;
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
 * A user qualifies as a lead if:
 * 1. leadData.brand_interest contains that brand (string)
 * 2. subscriptions is NULL or {}
 * 3. The brand is NOT in unsubscribed_brands
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
      console.log('⚠️ Could not parse leadData:', e.message);
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
      console.log('⚠️ Could not parse subscriptions:', e.message);
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
      console.log('⚠️ Could not parse unsubscribed_brands:', e.message);
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
    console.log(`📤 Sending ${batchRequests.length} batched requests to Customer.io...`);
    
    const response = await httpClient.post(`${CIO_TRACK_URL}/batch`, {
      batch: batchRequests
    }, {
      headers: {
        'Authorization': `Basic ${cioAuth}`
      }
    });

    console.log(`✅ Batch request successful: ${response.status}`);
    return { success: true, response: response.data };
    
  } catch (error) {
    console.error('❌ Batch request failed:', error.message);
    console.error('❌ Error response:', error.response?.data);
    return { success: false, error: error.message };
  }
}

/**
 * Sync lead tags to Customer.io
 * Sets lead_for_[brandId] = true attribute
 */
async function syncLeadTagsToCustomerIO(userID, email, brandId, isNewUser = false) {
  try {
    console.log(`🏷️ Syncing lead tag for brand ${brandId} to Customer.io...`);
    
    // Use conditional identifiers based on whether user is new
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
      console.log(`✅ Successfully synced lead tag lead_for_${brandId} to Customer.io`);
      
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
      console.error(`❌ Failed to sync lead tag: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error syncing lead tag to Customer.io:', error.message);
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

/**
 * Remove lead tag from Customer.io
 * Sets lead_for_[brandId] = false attribute
 */
async function removeLeadTagFromCustomerIO(userID, email, brandId, isNewUser = false) {
  try {
    console.log(`🏷️ Removing lead tag for brand ${brandId} from Customer.io...`);
    
    // Use conditional identifiers based on whether user is new
    const identifiers = isNewUser 
      ? { email: email }  // New users: use email only
      : { id: userID };   // Existing users: use ID only
    
    const cioRequest = {
      type: "person",
      identifiers: identifiers,
      action: "identify",
      attributes: {
        email: email,
        [`lead_for_${brandId}`]: false
      }
    };
    
    const result = await sendBatchedCustomerIORequests([cioRequest]);
    
    if (result.success) {
      console.log(`✅ Successfully removed lead tag lead_for_${brandId} from Customer.io`);
      return { success: true };
    } else {
      console.error(`❌ Failed to remove lead tag: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error removing lead tag from Customer.io:', error.message);
    return { success: false, error: error.message };
  }
}

async function upsertRetentionLeadToUsersTable(email, leadData, validationResult, brandId) {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmail(normalizedEmail);
  const userID = uuidv5(normalizedEmail, USER_NAMESPACE);
  
  // Parse clicked_at timestamp
  let clickedAtTimestamp = null;
  if (leadData.clicked_at) {
    try {
      clickedAtTimestamp = new Date(leadData.clicked_at).toISOString();
    } catch (e) {
      console.log('⚠️ Could not parse clicked_at timestamp:', leadData.clicked_at);
    }
  }
  
  // Prepare leadData JSON (store everything from webhook)
  const leadDataJson = JSON.stringify({
    email_domain: leadData.email_domain,
    clicked_at: leadData.clicked_at,
    landing_page_url: leadData.landing_page_url,
    landing_page_domain: leadData.landing_page_domain,
    referrer: leadData.referrer,
    page_title: leadData.page_title,
    brand_interest: brandId // Add brand interest to leadData
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
        @recentClickDate AS recentClickDate,
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
        recentClickDate = GREATEST(COALESCE(source.recentClickDate, TIMESTAMP('1970-01-01')), COALESCE(target.recentClickDate, TIMESTAMP('1970-01-01'))),
        updatedAt = CURRENT_TIMESTAMP()
    WHEN NOT MATCHED THEN
      INSERT (
        userID, email, emailHash, firstName, lastName,
        leadSource, leadData,
        emailValidationStatus, emailValidationReason,
        emailIsDisposable, emailIsFree,
        recentClickDate, createdAt, updatedAt
      )
      VALUES (
        source.userID, source.email, source.emailHash, source.firstName, source.lastName,
        source.leadSource, source.leadData,
        source.emailValidationStatus, source.emailValidationReason,
        source.emailIsDisposable, source.emailIsFree,
        source.recentClickDate, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
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
        leadSource: 'retention',
        leadData: leadDataJson,
        emailValidationStatus: validationResult.reason || null,
        emailValidationReason: validationResult.reason || null,
        emailIsDisposable: validationResult.isDisposable || false,
        emailIsFree: validationResult.isFree || false,
        recentClickDate: clickedAtTimestamp || null
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
        emailIsFree: 'BOOL',
        recentClickDate: 'TIMESTAMP'
      }
    });
    
    console.log(`✅ Retention lead ${isNewUser ? 'created' : 'updated'} in BigQuery:`, {
      userID,
      email: normalizedEmail.substring(0, 5) + '***',
      brandInterest: brandId,
      isValid: validationResult.valid
    });
    
    return { success: true, userID, isNewUser };
  } catch (error) {
    console.error('❌ BigQuery MERGE error:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  console.log('🚀 RETENTION.COM WEBHOOK HANDLER');
  
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  
  try {
    const {
      email,
      email_domain,
      first_name,
      last_name,
      clicked_at,
      landing_page_url,
      landing_page_domain,
      referrer,
      page_title
    } = req.body;
    
    console.log('📧 Retention.com webhook received:', {
      email: email ? email.substring(0, 5) + '***' : 'no-email',
      landing_page_domain,
      hasName: !!(first_name || last_name)
    });
    
    if (!email) {
      console.error('❌ Missing email in webhook payload');
      return res.status(400).json({ error: 'Missing email' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email via EmailOversight
    console.log('🔍 Validating email...');
    const validationResult = await validateEmail(normalizedEmail);
    
    if (!validationResult.valid) {
      console.log('⚠️ Email validation failed, skipping storage:', validationResult.reason);
      // Return 200 OK so Retention.com webhook configuration succeeds
      // but don't store invalid emails in BigQuery
      return res.status(200).json({
        success: true,
        message: 'Webhook received (email validation failed, not stored)',
        reason: validationResult.reason,
        stored: false
      });
    }
    
    // Determine brand from landing_page_domain
    const brandId = determineBrandFromDomain(landing_page_domain);
    
    // Prepare lead data
    const leadData = {
      email_domain,
      first_name,
      last_name,
      clicked_at,
      landing_page_url,
      landing_page_domain,
      referrer,
      page_title
    };
    
    // Upsert to BigQuery (do NOT subscribe to Customer.io)
    const result = await upsertRetentionLeadToUsersTable(
      normalizedEmail,
      leadData,
      validationResult,
      brandId
    );
    
    // Fetch the updated user record from BigQuery to check lead qualification
    let leadTagSynced = false;
    let oldBrandRemoved = false;
    if (brandId && result.success) {
      try {
        // First, get the old user record to check for previous brand_interest
        let oldBrandInterest = null;
        if (!result.isNewUser) {
          const oldUserQuery = `
            SELECT leadData
            FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
            WHERE userID = @userID 
            LIMIT 1
          `;
          
          try {
            const [oldUserRows] = await bq.query({ 
              query: oldUserQuery, 
              params: { userID: result.userID } 
            });
            
            if (oldUserRows.length > 0 && oldUserRows[0].leadData) {
              try {
                const oldLeadData = typeof oldUserRows[0].leadData === 'string' 
                  ? JSON.parse(oldUserRows[0].leadData) 
                  : oldUserRows[0].leadData;
                oldBrandInterest = oldLeadData.brand_interest;
              } catch (e) {
                // Could not parse old leadData, ignore
              }
            }
          } catch (e) {
            // Could not fetch old user, ignore
          }
        }
        
        // If brand_interest changed, remove old lead tag
        if (oldBrandInterest && oldBrandInterest !== brandId) {
          console.log(`🔄 Brand interest changed from ${oldBrandInterest} to ${brandId}, removing old lead tag...`);
          const removeResult = await removeLeadTagFromCustomerIO(
            result.userID,
            normalizedEmail,
            oldBrandInterest,
            result.isNewUser
          );
          
          if (removeResult.success) {
            oldBrandRemoved = true;
            console.log(`✅ Removed old lead tag for brand ${oldBrandInterest}`);
          } else {
            console.log(`⚠️ Failed to remove old lead tag (non-fatal): ${removeResult.error}`);
          }
        }
        
        // Now check if user qualifies as lead for new brand
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
          if (isUserLeadForBrand(user, brandId)) {
            // Sync lead tag to Customer.io
            const tagResult = await syncLeadTagsToCustomerIO(
              result.userID,
              normalizedEmail,
              brandId,
              result.isNewUser
            );
            
            if (tagResult.success) {
              leadTagSynced = true;
              console.log(`✅ Lead tag synced to Customer.io for brand ${brandId}`);
            } else {
              console.log(`⚠️ Failed to sync lead tag (non-fatal): ${tagResult.error}`);
            }
          } else {
            console.log(`ℹ️ User does not qualify as lead for brand ${brandId}`);
          }
        }
      } catch (error) {
        // Don't fail webhook if Customer.io sync fails
        console.error('⚠️ Error checking/syncing lead tag (non-fatal):', error.message);
      }
    }
    
    console.log('✅ Retention.com webhook processed successfully:', {
      userID: result.userID,
      isNewUser: result.isNewUser,
      brandInterest: brandId,
      leadTagSynced,
      oldBrandRemoved
    });
    
    return res.status(200).json({
      success: true,
      userID: result.userID,
      brandInterest: brandId,
      leadTagSynced,
      oldBrandRemoved,
      message: 'Lead stored successfully (not subscribed)'
    });
    
  } catch (error) {
    console.error('❌ Retention.com webhook error:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}

