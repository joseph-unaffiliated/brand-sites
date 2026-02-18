/**
 * Optimized Magic Link Handler with Batched Customer.io API Calls
 * Reduces API calls and adds proper timeouts
 */

import axios from 'axios';
import { v5 as uuidv5 } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import { BigQuery } from '@google-cloud/bigquery';
import crypto from 'crypto';
import FormData from 'form-data';

// Namespace UUID for deterministic userID generation (v5)
// This ensures the same email always generates the same userID, preventing race condition duplicates
const USER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Standard DNS namespace UUID

// Brand mapping from subscription attributes to brand object IDs
const BRAND_MAPPING = {
    'subscribed_to_batmitzvahhorrorstories': 'batmitzvahhorrorstories',
    'subscribed_to_grapejuiceandnostalgia': 'grapejuiceandnostalgia',
    'subscribed_to_hardresets': 'hardresets',
    'subscribed_to_highdiaries': 'highdiaries',
    'subscribed_to_hipspeak': 'hipspeak',
    'subscribed_to_hookuplists': 'hookuplists',
    'subscribed_to_millennialvsgenz': 'millennialvsgenz',
    'subscribed_to_obscuremixtape': 'obscuremixtape',
    'subscribed_to_onetimeatcamp': 'onetimeatcamp',
    'subscribed_to_the90sparent': 'the90sparent',
    'subscribed_to_thecomingofageparty': 'thecomingofageparty',
    'subscribed_to_thedadsdad': 'thedadsdad',
    'subscribed_to_theeyeballerscookbook': 'theeyeballerscookbook',
    'subscribed_to_themixedhome': 'themixedhome',
    'subscribed_to_thepackandplay': 'thepackandplay',
    'subscribed_to_thepicklereport': 'thepicklereport',
    'subscribed_to_theproudparent': 'theproudparent',
    'subscribed_to_thequirkiest': 'thequirkiest',
    'subscribed_to_thestewardprize': 'thestewardprize',
    'subscribed_to_toddlercinema': 'toddlercinema',
    'subscribed_to_zitsandcake': 'zitsandcake',
    'subscribed_to_heebnewsletters': 'heebnewsletters'
};

// Mapping from URL-friendly brand names to actual Customer.io brand object names
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

// Brand slug to short code (for requested_issue attribute, e.g. TPR_issue001)
const BRAND_SLUG_TO_CODE = {
    'batmitzvahhorrorstories': 'BMHS',
    'grapejuiceandnostalgia': 'GAN',
    'hardresets': 'HR',
    'highdiaries': 'HD',
    'hipspeak': 'HS',
    'hookuplists': 'HL',
    'millennialvsgenz': 'MVG',
    'obscuremixtape': 'OM',
    'onetimeatcamp': 'OTAC',
    'the90sparent': 'TNP',
    'thecomingofageparty': 'TCAP',
    'thedadsdad': 'TDD',
    'theeyeballerscookbook': 'TEC',
    'themixedhome': 'TMH',
    'thepackandplay': 'TPAP',
    'thepicklereport': 'TPR',
    'theproudparent': 'TPP',
    'thequirkiest': 'TQ',
    'thestewardprize': 'TSP',
    'toddlercinema': 'TC',
    'zitsandcake': 'ZAC',
    'heebnewsletters': 'HN'
};

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
const auth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');

// HTTP client with timeout configuration
const httpClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

function hashEmail(email, salt = process.env.EMAIL_SALT || 'default-salt') {
  try {
    return crypto.createHash('sha256').update(email + salt).digest('hex');
  } catch (error) {
    console.error('Email hashing error:', error.message);
    return email;
  }
}

function hashIP(ip, salt = process.env.IP_SALT || 'default-salt') {
  if (!ip) return null;
  try {
    return crypto.createHash('sha256').update(ip + salt).digest('hex');
  } catch (error) {
    console.error('IP hashing error:', error.message);
    return ip;
  }
}

/**
 * Queue an email for later validation retry (e.g. after Email Oversight timeout).
 * Used so subscribe flow is not blocked; batch processor will re-validate and apply invalid handling.
 */
async function queueEmailForValidationRetry(email, userID = null, source = 'magic_link') {
  if (!process.env.GCP_PROJECT_ID) {
    console.warn('queueEmailForValidationRetry: GCP_PROJECT_ID not set, skipping queue');
    return { queued: false };
  }
  try {
    const insertQuery = `
      INSERT INTO \`${process.env.GCP_PROJECT_ID}.analytics.validation_retry_queue\`
        (email, userID, source, queued_at)
      VALUES (@email, @userID, @source, CURRENT_TIMESTAMP())
    `;
    await bq.query({
      query: insertQuery,
      params: { email, userID, source },
      types: { email: 'STRING', userID: 'STRING', source: 'STRING' }
    });
    console.log('Queued email for validation retry:', email);
    return { queued: true };
  } catch (err) {
    console.error('queueEmailForValidationRetry error:', err.message);
    return { queued: false };
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
      score: response.data.Score
    };
  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' ||
      (error.message && String(error.message).toLowerCase().includes('timeout'));
    if (isTimeout) {
      console.warn('Email validation timeout, queuing for retry:', email);
      await queueEmailForValidationRetry(email, null, 'magic_link');
      return { valid: true, reason: 'timeout' };
    }
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
    const [rows] = await bq.query({ query, params: { email } });
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
    console.log(`📤 Sending ${batchRequests.length} batched requests to Customer.io...`);
    
    const response = await httpClient.post(`${CIO_TRACK_URL}/batch`, {
      batch: batchRequests
    }, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    console.log(`✅ Batch request successful: ${response.status}`);
    return { success: true, response: response.data };
    
  } catch (error) {
    console.error('❌ Batch request failed:', error.message);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Batch payload:', JSON.stringify(batchRequests, null, 2));
    return { success: false, error: error.message };
  }
}

/**
 * Remove brand relationships from a person and log unsubscription or snooze
 */
async function removeBrandRelationships(userID, brandObjectIds, normalizedEmail, isSnooze = false, snoozeType = 'unsubscribe_then_subscribe', isNewUser = false) {
  const relationships = brandObjectIds.map(brandId => ({
    identifiers: {
      object_type_id: "1",
      object_id: CUSTOMER_IO_BRAND_NAMES[brandId] || brandId
    }
  }));
  
  // Prepare unsubscription/snooze attributes
  const unsubscribeAttributes = {};
  const unsubscribeDate = new Date().toISOString();
  
  if (isSnooze) {
    // For snooze, add snoozed_brands attribute (object with brand IDs as keys and reactivation timestamps)
    const snoozedBrandsObj = {};
    brandObjectIds.forEach(brandId => {
      const reactivationDate = new Date();
      reactivationDate.setMonth(reactivationDate.getMonth() + 3);
      snoozedBrandsObj[brandId] = reactivationDate.getTime();
    });
    unsubscribeAttributes['snoozed_brands'] = snoozedBrandsObj;
    
    // Add snooze-specific attributes
    brandObjectIds.forEach(brandId => {
      unsubscribeAttributes[`snoozed_from_${brandId}`] = true;
      unsubscribeAttributes[`${brandId}_snooze_date`] = unsubscribeDate;
      unsubscribeAttributes[`${brandId}_snooze_type`] = snoozeType;
    });
  } else {
    // For unsubscribe, add unsubscribed_brands attribute (object with brand IDs as keys)
    const unsubscribedBrandsObj = {};
    brandObjectIds.forEach(brandId => {
      unsubscribedBrandsObj[brandId] = new Date().getTime();
    });
    unsubscribeAttributes['unsubscribed_brands'] = unsubscribedBrandsObj;
  }
  
  // Remove individual brand subscription attributes (common for both unsubscribe and snooze)
  brandObjectIds.forEach(brandId => {
    unsubscribeAttributes[`subscribed_to_${brandId}`] = false;
    unsubscribeAttributes[`${brandId}_subscription_date`] = null;
    // Remove lead tag when unsubscribing (set to false)
    // This handles cases where someone unsubscribes from marketing emails even if they were never subscribed
    unsubscribeAttributes[`lead_for_${brandId}`] = false;
  });
  
  // Use conditional identifiers based on whether user is new
  const identifiers = isNewUser 
    ? { email: normalizedEmail }  // New users: use email only
    : { id: userID };             // Existing users: use ID only
  
  // Create batched requests for unsubscribe
  const attributeRequest = {
    type: "person",
    identifiers: identifiers,
    action: "identify",
    attributes: {
      email: normalizedEmail,
      ...unsubscribeAttributes
    }
  };
  
  const relationshipRequest = {
    type: "person",
    identifiers: identifiers,
    action: "delete_relationships",
    cio_relationships: relationships
  };
  
  try {
    console.log(`📤 Removing ${relationships.length} brand relationships from person ${userID}...`);
    console.log(`   Brands being removed: ${brandObjectIds.join(', ')}`);
    
    const batchRequests = [attributeRequest, relationshipRequest];
    const result = await sendBatchedCustomerIORequests(batchRequests);
    
    if (result.success) {
      console.log(`   ✅ Success: Updated attributes and removed brand relationships from person ${userID}`);
      return { 
        success: true, 
        removed_brands: brandObjectIds,
        unsubscribe_date: unsubscribeDate
      };
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Remove brand from subscriptions and log unsubscription to BigQuery
 */
async function removeBrandFromSubscriptionsAndLogUnsubscription(userId, brandId, unsubscribeDate, normalizedEmail, isNewUser = false) {
  try {
    console.log(`📊 Removing ${brandId} from subscriptions and logging unsubscription for ${userId}`);
    
    // First, get current user data to update both subscriptions and unsubscribed_brands
    const query = `
      SELECT userID, subscriptions, unsubscribed_brands
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE userID = @userID 
      LIMIT 1
    `;
    
    const [rows] = await bq.query({ query, params: { userID: userId } });
    
    if (rows.length === 0) {
      console.log(`   ⚠️ User ${userId} not found in BigQuery`);
      return { success: false, error: 'User not found' };
    }
    
    const currentUser = rows[0];
    let subscriptions = {};
    let unsubscribedBrands = {};
    
    // Parse existing subscriptions if they exist
    if (currentUser.subscriptions) {
      try {
        subscriptions = JSON.parse(currentUser.subscriptions);
      } catch (e) {
        console.log('   ⚠️ Could not parse existing subscriptions, starting fresh');
        subscriptions = {};
      }
    }
    
    // Parse existing unsubscribed_brands if they exist
    if (currentUser.unsubscribed_brands) {
      try {
        unsubscribedBrands = JSON.parse(currentUser.unsubscribed_brands);
      } catch (e) {
        console.log('   ⚠️ Could not parse existing unsubscribed_brands, starting fresh');
        unsubscribedBrands = {};
      }
    }
    
    // Remove brand from subscriptions
    if (subscriptions[brandId]) {
      delete subscriptions[brandId];
      console.log(`   ✅ Removed ${brandId} from subscriptions`);
    } else {
      console.log(`   ⚠️ ${brandId} not found in subscriptions`);
    }
    
    // Add/update unsubscription entry for this brand
    unsubscribedBrands[brandId] = new Date().getTime();
    console.log(`   ✅ Added ${brandId} to unsubscribed_brands`);
    
    // Use MERGE to avoid streaming buffer issues - subscriptions is JSON, unsubscribed_brands is STRING
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
      USING (
        SELECT 
          '${userId}' as userID,
          JSON '${JSON.stringify(subscriptions)}' as subscriptions,
          '${JSON.stringify(unsubscribedBrands)}' as unsubscribed_brands
      ) AS source
      ON target.userID = source.userID
      WHEN MATCHED THEN
        UPDATE SET 
          subscriptions = source.subscriptions,
          unsubscribed_brands = source.unsubscribed_brands
    `;
    
    await bq.query({
      query: mergeQuery
    });
    
    console.log(`   ✅ Successfully updated subscriptions and unsubscribed_brands for ${userId}`);
    
    // Now update Customer.io with individual boolean attributes and unsubscribed_brands
    try {
      console.log(`   📤 Updating Customer.io individual boolean attributes and unsubscribed_brands...`);
      
      // Convert subscriptions object to individual boolean attributes
      let attributes = {};
      Object.keys(subscriptions).forEach(brandId => {
        attributes[`subscribed_to_${brandId}`] = true;
      });
      
      // Add unsubscribed_brands attribute
      attributes['unsubscribed_brands'] = unsubscribedBrands;
      
      // Use conditional identifiers based on whether user is new
      const identifiers = isNewUser 
        ? { email: normalizedEmail }  // New users: use email only
        : { id: userId };             // Existing users: use ID only
      
      const cioRequest = {
        type: "person",
        identifiers: identifiers,
        action: "identify",
        attributes: {
          email: normalizedEmail,
          ...attributes
        }
      };
      
      const cioResult = await sendBatchedCustomerIORequests([cioRequest]);
      
      if (cioResult.success) {
        console.log(`   ✅ Successfully updated Customer.io individual boolean attributes`);
      } else {
        console.log(`   ⚠️ Customer.io boolean attributes update failed: ${cioResult.error}`);
      }
    } catch (cioError) {
      console.log(`   ⚠️ Customer.io boolean attributes update error: ${cioError.message}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ BigQuery subscription/unsubscription update error:', error.message);
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
 * Create brand relationships for a person
 */
async function createBrandRelationships(userID, brandList, normalizedEmail, allSubscriptions = null, isNewUser = false) {
  try {
    console.log(`🔗 Creating brand relationships for ${brandList.length} brands...`);
    
    // Create person identify request with individual boolean attributes
    let attributes = {
      email: normalizedEmail
    };
    
    // Set individual boolean attributes for each brand
    if (allSubscriptions) {
      // Set all existing brands to true
      Object.keys(allSubscriptions).forEach(brandId => {
        attributes[`subscribed_to_${brandId}`] = true;
      });
    }
    
    // Add current brands to the attributes
    brandList.forEach(brandId => {
      attributes[`subscribed_to_${brandId}`] = true;
      // Remove lead tag when subscribing (set to false)
      attributes[`lead_for_${brandId}`] = false;
    });
    
    // Use conditional identifiers based on whether user is new
    const identifiers = isNewUser 
      ? { email: normalizedEmail }  // New users: use email only
      : { id: userID };             // Existing users: use ID only
    
    const personRequest = {
      type: "person",
      identifiers: identifiers,
      action: "identify",
      attributes: {
        email: normalizedEmail,
        ...attributes
      },
      cio_relationships: brandList.map(brandId => ({
        identifiers: {
          object_type_id: "1",
          object_id: CUSTOMER_IO_BRAND_NAMES[brandId] || brandId
        }
      }))
    };

    // Create event requests for each brand
    const eventRequests = brandList.map(brandName => ({
      type: "delivery",
      identifiers: identifiers,
      action: "event",
      name: 'magic_link_subscribe',
      data: { 
        brand: brandName, 
        all_brands: brandList.join(',')
      }
    }));

    // Combine all requests into a single batch
    const batchRequests = [personRequest, ...eventRequests];
    
    const result = await sendBatchedCustomerIORequests(batchRequests);
    
    if (result.success) {
      console.log(`✅ Brand relationships created: ${brandList.length} brands`);
      
      // For new users, update the record with ID to populate the ID field
      if (isNewUser) {
        console.log(`🔄 New user detected - updating Customer.io record with ID...`);
        const updateResult = await updateCustomerIORecordWithID(userID, normalizedEmail, attributes);
        
        if (updateResult.success) {
          console.log(`✅ Customer.io record updated with ID successfully`);
        } else {
          console.log(`⚠️ Customer.io ID update failed: ${updateResult.error}`);
          // Don't fail the whole operation, just log the warning
        }
      }
      
      return { success: true, relationships: brandList.length };
    } else {
      console.error('❌ Brand relationship creation failed:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Brand relationship creation error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is currently subscribed to a specific brand
 */
async function checkUserSubscriptionStatus(userId, brandId) {
  try {
    console.log(`🔍 Checking subscription status for ${userId} and brand ${brandId}`);
    
    const query = `
      SELECT subscriptions
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE userID = @userID 
      LIMIT 1
    `;
    
    const [rows] = await bq.query({ query, params: { userID: userId } });
    
    if (rows.length === 0) {
      console.log(`   ⚠️ User ${userId} not found in BigQuery`);
      return false;
    }
    
    const user = rows[0];
    if (!user.subscriptions) {
      console.log(`   📊 No subscriptions found for ${userId}`);
      return false;
    }
    
    let subscriptions = {};
    try {
      subscriptions = JSON.parse(user.subscriptions);
    } catch (e) {
      console.log(`   ⚠️ Could not parse subscriptions for ${userId}`);
      return false;
    }
    
    const isSubscribed = subscriptions.hasOwnProperty(brandId);
    console.log(`   📊 Subscription status for ${brandId}:`, isSubscribed);
    
    return isSubscribed;
    
  } catch (error) {
    console.error('❌ Subscription status check error:', error.message);
    return false;
  }
}

/**
 * Update existing user's leadData in BQ with request-issue info (scenario b: in BQ but not subscribed).
 * Does not touch subscriptions.
 */
async function updateUserLeadDataForRequest(userID, brandSlug, requestedIssue) {
  try {
    const readQuery = `
      SELECT leadData FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE userID = @userID LIMIT 1
    `;
    const [rows] = await bq.query({ query: readQuery, params: { userID } });
    let leadData = {};
    if (rows.length > 0 && rows[0].leadData) {
      const raw = rows[0].leadData;
      leadData = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
    }
    if (!leadData.request_issue_by_brand) leadData.request_issue_by_brand = {};
    leadData.request_issue_by_brand[brandSlug] = {
      requested_issue: requestedIssue,
      requested_at: new Date().toISOString()
    };
    const leadDataStr = JSON.stringify(leadData);
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
      USING (SELECT @userID AS userID, PARSE_JSON(@leadData) AS leadData) AS source
      ON target.userID = source.userID
      WHEN MATCHED THEN
        UPDATE SET leadData = source.leadData, updatedAt = CURRENT_TIMESTAMP()
    `;
    await bq.query({
      query: mergeQuery,
      params: { userID, leadData: leadDataStr },
      types: { userID: 'STRING', leadData: 'STRING' }
    });
    console.log('✅ Updated BQ leadData for request (scenario b)');
    return { success: true };
  } catch (error) {
    console.error('❌ updateUserLeadDataForRequest error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create new user in BQ for request-issue (scenario c: not in BQ). Marks as lead only, no subscriptions.
 */
async function insertRequestIssueUser(normalizedEmail, brandSlug, requestedIssue) {
  const userID = uuidv5(normalizedEmail, USER_NAMESPACE);
  const leadDataStr = JSON.stringify({
    source: 'request_issue',
    brand: brandSlug,
    requested_issue: requestedIssue,
    requested_at: new Date().toISOString()
  });
  const mergeQuery = `
    MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
    USING (
      SELECT
        @userID AS userID,
        @email AS email,
        @emailHash AS emailHash,
        @leadSource AS leadSource,
        PARSE_JSON(@leadData) AS leadData,
        CURRENT_TIMESTAMP() AS createdAt,
        CURRENT_TIMESTAMP() AS updatedAt
    ) AS source
    ON target.userID = source.userID
    WHEN NOT MATCHED THEN
      INSERT (userID, email, emailHash, leadSource, leadData, createdAt, updatedAt)
      VALUES (source.userID, source.email, source.emailHash, source.leadSource, source.leadData, source.createdAt, source.updatedAt)
  `;
  try {
    await bq.query({
      query: mergeQuery,
      params: {
        userID,
        email: normalizedEmail,
        emailHash: hashEmail(normalizedEmail),
        leadSource: 'request_issue',
        leadData: leadDataStr
      },
      types: { userID: 'STRING', email: 'STRING', emailHash: 'STRING', leadSource: 'STRING', leadData: 'STRING' }
    });
    console.log('✅ Created new user in BQ for request (scenario c)');
    return { success: true, userID };
  } catch (error) {
    console.error('❌ insertRequestIssueUser error:', error.message);
    return { success: false, error: error.message, userID };
  }
}

/**
 * Upload email to Retention.com suppression list
 * Called after subscription (so Retention knows not to capture this lead)
 */
async function addToRetentionSuppression(email) {
  // Retention.com requires API Key and API ID (both can be in RETENTION_API_KEY or separate)
  if (!process.env.RETENTION_API_KEY) {
    console.log('⚠️ Retention.com API key not configured, skipping suppression upload');
    return { success: false, reason: 'no_api_key' };
  }

  try {
    // Retention.com expects CSV file upload via multipart/form-data
    // Format: header row "email" followed by email addresses, one per line
    // Emails should be lowercase before hashing (if using MD5) or sending
    const normalizedEmail = email.toLowerCase().trim();
    const csvContent = `email\n${normalizedEmail}`;
    
    // Retention.com API authentication requires api-id and api-key as separate headers
    if (!process.env.RETENTION_API_ID) {
      console.log('⚠️ Retention.com API ID not configured, skipping suppression upload');
      return { success: false, reason: 'no_api_id' };
    }
    
    // Create FormData for file upload (using native FormData in Node.js 18+)
    const formData = new FormData();
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    formData.append('file', csvBuffer, {
      filename: 'suppression.csv',
      contentType: 'text/csv'
    });
    
    const response = await httpClient.post(
      'https://api.retention.com/api/v1/suppression',
      formData,
      {
        headers: {
          'api-id': process.env.RETENTION_API_ID,
          'api-key': process.env.RETENTION_API_KEY,
          ...formData.getHeaders() // Adds Content-Type with boundary for multipart/form-data
        },
        timeout: 10000
      }
    );

    console.log('✅ Email added to Retention.com suppression list');
    return { success: true };
  } catch (error) {
    // Don't fail the whole process if suppression upload fails
    console.error('⚠️ Failed to add email to Retention.com suppression:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false, reason: error.message };
  }
}

/**
 * Log click event to BigQuery clicks table
 */
async function logClickToBigQuery(userID, email, brandList, options = {}) {
  const {
    campaignID = null,
    articleID = null,
    utm_source = null,
    utm_campaign = null,
    utm_medium = null,
    utm_content = null,
    userAgent = null,
    eventType = 'subscribe',
    url = null
  } = options;
  
  // Insert click to BigQuery (one record per brand)
  for (const brandName of brandList) {
    try {
      const clickID = uuidv4();
      const insertQuery = `
        INSERT INTO \`${process.env.GCP_PROJECT_ID}.analytics.clicks\` (
          clickID, userID, email, emailHash, campaignID, articleID, brand, 
          UTMsource, UTMcampaign, UTMmedium, UTMcontent, userAgent, date, eventType, url, source
        ) VALUES (
          '${clickID}', '${userID}', '${email}', '${hashEmail(email)}', 
          ${campaignID ? `'${campaignID.replace(/'/g, "''")}'` : 'NULL'}, 
          ${articleID ? `'${articleID.replace(/'/g, "''")}'` : 'NULL'}, 
          '${brandName}', 
          ${utm_source ? `'${utm_source.replace(/'/g, "''")}'` : 'NULL'}, 
          ${utm_campaign ? `'${utm_campaign.replace(/'/g, "''")}'` : 'NULL'}, 
          ${utm_medium ? `'${utm_medium.replace(/'/g, "''")}'` : 'NULL'}, 
          ${utm_content ? `'${utm_content.replace(/'/g, "''")}'` : 'NULL'}, 
          ${userAgent ? `'${userAgent.replace(/'/g, "''")}'` : 'NULL'}, 
          CURRENT_TIMESTAMP(),
          '${eventType}',
          ${url ? `'${url.replace(/'/g, "''")}'` : 'NULL'},
          'magic_link'
        )
      `;
      
      await bq.query({
        query: insertQuery
      });
      
      console.log(`✅ Click logged for brand: ${brandName} (eventType: ${eventType})`);
    } catch (clickError) {
      console.error(`❌ Click logging failed for ${brandName}:`, clickError.message);
    }
  }
}

async function logSnoozeToBigQuery(userId, brandId, reactivationTimestamp, snoozeType = 'unsubscribe_then_subscribe') {
  try {
    console.log(`😴 Logging snooze to BigQuery: ${userId} for ${brandId} until ${new Date(reactivationTimestamp).toISOString()}`);
    
    // First, get current user data to update snoozed_brands
    const query = `
      SELECT userID, snoozed_brands
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE userID = @userID 
      LIMIT 1
    `;
    
    const [rows] = await bq.query({ query, params: { userID: userId } });
    
    if (rows.length === 0) {
      console.log(`   ⚠️ User ${userId} not found in BigQuery`);
      return { success: false, error: 'User not found' };
    }
    
    const currentUser = rows[0];
    let snoozedBrands = {};
    
    // Parse existing snoozed_brands if they exist
    if (currentUser.snoozed_brands) {
      try {
        snoozedBrands = JSON.parse(currentUser.snoozed_brands);
      } catch (e) {
        console.log('   ⚠️ Could not parse existing snoozed_brands, starting fresh');
        snoozedBrands = {};
      }
    }
    
    // Add/update snooze entry for this brand with reactivation timestamp and type
    snoozedBrands[brandId] = {
      reactivation_timestamp: reactivationTimestamp,
      snooze_type: snoozeType,
      snooze_date: new Date().getTime()
    };
    
    // Update user record with new snoozed_brands
    const updateQuery = `
      UPDATE \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      SET 
        snoozed_brands = @snoozed_brands
      WHERE userID = @userID
    `;
    
    await bq.query({
      query: updateQuery,
      params: {
        userID: userId,
        snoozed_brands: JSON.stringify(snoozedBrands)
      }
    });
    
    console.log(`   ✅ Snooze logged to BigQuery for ${userId} for ${brandId}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ BigQuery snooze logging error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Execute endpoint - Does the actual subscription/unsubscribe/snooze work
 * Called via POST from success pages after bot detection or from Zapier/programmatic calls
 */
export async function handleExecute(req, res) {
  console.log('⚙️ EXECUTE ENDPOINT - Processing action');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, brand, brands, campaignID, utm_source, utm_campaign, articleID, action } = req.body;
  
  if (!email || !brand) {
    return res.status(400).json({ error: 'Missing email or brand' });
  }
  
  const normalizedEmail = email.replace(/ /g, '+').toLowerCase().trim();
  const finalAction = action || 'subscribe';
  
  let brandList = [];
  if (brands) brandList = brands.split(',').map(b => b.trim()).filter(b => b);
  else if (brand && brand.trim()) brandList = [brand.trim()];
  else return res.status(400).json({ error: 'Missing brand' });
  
  try {
    // Handle unsubscribe
    if (finalAction === 'unsubscribe') {
      const userID = await findUserByEmail(normalizedEmail);
      if (!userID) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      for (const brandId of brandList) {
        const result = await removeBrandRelationships(userID, [brandId], normalizedEmail, false, 'unsubscribe_then_subscribe', false);
        if (result.success) {
          await removeBrandFromSubscriptionsAndLogUnsubscription(
            userID, brandId, result.unsubscribe_date, normalizedEmail, false
          );
        }
      }
      
      await logClickToBigQuery(userID, normalizedEmail, brandList, {
        userAgent: req.headers['user-agent'],
        eventType: 'unsubscribe'
      });
      
      return res.status(200).json({ success: true, action: 'unsubscribe' });
    }
    
    // Handle snooze
    if (finalAction === 'snooze') {
      const userID = await findUserByEmail(normalizedEmail);
      if (!userID) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const reactivationDate = new Date();
      reactivationDate.setMonth(reactivationDate.getMonth() + 3);
      const reactivationTimestamp = reactivationDate.getTime();
      
      for (const brandId of brandList) {
        const isCurrentlySubscribed = await checkUserSubscriptionStatus(userID, brandId);
        
        if (isCurrentlySubscribed) {
          const result = await removeBrandRelationships(userID, [brandId], normalizedEmail, true, 'unsubscribe_then_subscribe', false);
          if (result.success) {
            await logSnoozeToBigQuery(userID, brandId, reactivationTimestamp, 'unsubscribe_then_subscribe');
          }
        } else {
          await logSnoozeToBigQuery(userID, brandId, reactivationTimestamp, 'subscribe_later');
        }
      }
      
      await logClickToBigQuery(userID, normalizedEmail, brandList, {
        userAgent: req.headers['user-agent'],
        eventType: 'snooze'
      });
      
      return res.status(200).json({ success: true, action: 'snooze' });
    }
    
    // Handle subscribe (default)
    const validationResult = await validateEmail(normalizedEmail);
    let userID = await findUserByEmail(normalizedEmail);
    let isNewUser = !userID;
    
    if (!userID) {
      userID = uuidv5(normalizedEmail.toLowerCase(), USER_NAMESPACE);
    }
    
    // Update BigQuery with MERGE
    let subscriptionsObj = {};
    let finalSnoozedBrands = null;
    
    if (!isNewUser) {
      try {
        const query = `
          SELECT subscriptions, snoozed_brands
          FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
          WHERE userID = @userID 
          LIMIT 1
        `;
        
        const [rows] = await bq.query({ query, params: { userID } });
        
        if (rows.length > 0) {
          const userData = rows[0];
          if (userData.subscriptions) {
            subscriptionsObj = typeof userData.subscriptions === 'string' 
              ? JSON.parse(userData.subscriptions) 
              : userData.subscriptions;
          }
          
          if (userData.snoozed_brands) {
            try {
              const snoozedBrands = JSON.parse(userData.snoozed_brands);
              
              brandList.forEach(brand => {
                if (snoozedBrands[brand]) {
                  delete snoozedBrands[brand];
                }
              });
              
              finalSnoozedBrands = JSON.stringify(snoozedBrands);
            } catch (e) {
              finalSnoozedBrands = userData.snoozed_brands;
            }
          }
        }
      } catch (mergeError) {
        console.log('⚠️ Could not fetch existing user data');
      }
    }
    
    brandList.forEach(brand => {
      subscriptionsObj[brand] = {
        subscribed_timestamp: new Date().getTime(),
        subSource: utm_source || null
      };
    });
    
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
      USING (
        SELECT 
          '${userID}' as userID,
          '${normalizedEmail}' as email,
          '${hashEmail(normalizedEmail)}' as emailHash,
          JSON '${JSON.stringify(subscriptionsObj)}' as subscriptions,
          ${finalSnoozedBrands ? `'${finalSnoozedBrands}'` : 'NULL'} as snoozed_brands,
          CURRENT_TIMESTAMP() as recentClickDate,
          CURRENT_TIMESTAMP() as createdAt
      ) AS source
      ON target.email = source.email
      WHEN MATCHED THEN
        UPDATE SET 
          subscriptions = source.subscriptions,
          ${finalSnoozedBrands ? 'snoozed_brands = source.snoozed_brands,' : ''}
          recentClickDate = source.recentClickDate
      WHEN NOT MATCHED THEN
        INSERT (userID, email, emailHash, subscriptions, ${finalSnoozedBrands ? 'snoozed_brands, ' : ''}recentClickDate, createdAt)
        VALUES (source.userID, source.email, source.emailHash, source.subscriptions, ${finalSnoozedBrands ? 'source.snoozed_brands, ' : ''}source.recentClickDate, source.createdAt)
    `;
    
    await bq.query({ query: mergeQuery });
    
    if (validationResult.valid) {
      const brandResult = await createBrandRelationships(userID, brandList, normalizedEmail, subscriptionsObj, isNewUser);
      if (!brandResult.success) {
        console.error('❌ Brand relationship creation failed:', brandResult.error);
      }
    }
    
    await logClickToBigQuery(userID, normalizedEmail, brandList, {
      campaignID,
      articleID,
      utm_source,
      utm_campaign,
      userAgent: req.headers['user-agent'],
      eventType: 'subscribe'
    });
    
    return res.status(200).json({ success: true, action: 'subscribe' });
    
  } catch (error) {
    console.error('❌ Execute endpoint error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  console.log('🚀 MAGIC-LINK HANDLER - Batched API Calls');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  console.log('📋 Full request object keys:', Object.keys(req));
  
  // PRIORITY 1: Check for execute requests - multiple detection methods
  // Check URL string first (most reliable - works even if query parsing fails)
  // Check both req.url and any other URL-related properties
  const urlString = req.url || req.originalUrl || '';
  const hasExecuteInUrl = urlString.includes('execute=true') || urlString.includes('execute%3Dtrue');
  
  if (req.method === 'POST' && hasExecuteInUrl) {
    console.log('✅ Routing to handleExecute via URL string check (execute=true in URL)');
    console.log('📋 URL string that matched:', urlString);
    return handleExecute(req, res);
  }
  
  console.log('📋 URL string check - hasExecuteInUrl:', hasExecuteInUrl);
  console.log('📋 URL string value:', urlString);
  
  // PRIORITY 2: Check header (reliable for programmatic calls)
  // Headers are case-insensitive in HTTP but Node.js lowercases them
  const executeHeader = req.headers['x-execute-request'] || req.headers['X-Execute-Request'];
  if (req.method === 'POST' && executeHeader === 'true') {
    console.log('✅ Routing to handleExecute via X-Execute-Request header');
    return handleExecute(req, res);
  }
  
  console.log('📋 X-Execute-Request header:', executeHeader);
  console.log('📋 URL contains execute=true:', req.url && req.url.includes('execute=true'));
  
  // PRIORITY 2: Check request body for execute requests
  // This is the most reliable indicator and should be checked before anything else
  if (req.method === 'POST') {
    console.log('📋 Checking for execute request in POST body...');
    console.log('📋 req.body type:', typeof req.body);
    console.log('📋 req.body value:', req.body ? (typeof req.body === 'string' ? req.body.substring(0, 200) : JSON.stringify(req.body).substring(0, 200)) : 'null');
    
    if (req.body) {
      let bodyObj = req.body;
      
      // Handle string body (might need parsing)
      if (typeof req.body === 'string') {
        try {
          bodyObj = JSON.parse(req.body);
          console.log('📋 Parsed string body to object');
        } catch (e) {
          console.log('📋 Could not parse body as JSON:', e.message);
          // Not JSON, continue
        }
      }
      
      // If body has action field, this is definitely an execute request
      if (bodyObj && typeof bodyObj === 'object') {
        console.log('📋 Body is object, checking for action field...');
        console.log('📋 bodyObj.action:', bodyObj.action);
        if (bodyObj.action) {
          console.log('✅ Routing to handleExecute via body.action field (PRIORITY)');
          return handleExecute(req, res);
        }
      }
    } else {
      console.log('⚠️ req.body is null/undefined - body might not be parsed yet');
    }
  }
  
  // Auto-detect action from URL path
  // Check both req.url and x-vercel-rewrite-path header (Vercel preserves original path in header)
  const urlPath = req.url.split('?')[0];
  const originalPath = req.headers['x-vercel-rewrite-path'] || req.headers['x-invoke-path'] || urlPath;
  const effectivePath = originalPath.split('?')[0];
  
  console.log('📋 URL path:', urlPath);
  console.log('📋 Effective path:', effectivePath);
  
  // Handle CORS preflight for /execute endpoint
  if ((effectivePath === '/execute' || urlPath === '/execute') && req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  // Handle POST requests to /execute endpoint
  if (req.method === 'POST') {
    // Check if path indicates /execute
    if (effectivePath === '/execute' || urlPath === '/execute') {
      console.log('✅ Routing to handleExecute via path');
      return handleExecute(req, res);
    }
    
    // Check query parameter for execute flag (workaround for routing issues)
    // Check both URLSearchParams and req.query (Vercel might parse it differently)
    const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
    const executeFromUrl = urlParams.get('execute') === 'true';
    
    // Note: req.query might not be populated yet, so we check URLSearchParams first
    if (executeFromUrl) {
      console.log('✅ Routing to handleExecute via query parameter (URL)');
      return handleExecute(req, res);
    }
  }
  
  const { email, brand, brands, campaignID, utm_source, utm_campaign, articleID, action, redirect, sitename, url, poll, issue } = req.query;
  
  // Extract brand from domain
  const host = req.headers.host || '';
  const domainParts = host.split('.');
  const inferredBrand = domainParts.length >= 3 && domainParts[0] === 'magic' 
    ? domainParts[1]
    : null;
  
  const isUnsubscribePath = urlPath === '/unsubscribe';
  const isSnoozePath = urlPath === '/snooze';
  const isRequestPath = effectivePath === '/request' || urlPath === '/request';
  const finalAction = isUnsubscribePath ? 'unsubscribe' : 
                     isSnoozePath ? 'snooze' : 
                     isRequestPath ? 'request' : action;
  
  console.log('Request params:', { brand, brands, campaignID, utm_source, utm_campaign, articleID, action, issue });
  console.log('Host:', host, 'Inferred brand:', inferredBrand);
  console.log('URL path:', urlPath, 'Is unsubscribe path:', isUnsubscribePath, 'Is snooze path:', isSnoozePath, 'Is request path:', isRequestPath, 'Final action:', finalAction);
  
  // Handle root path requests gracefully
  if (urlPath === '/' && !email && !brand && !brands && !inferredBrand) {
    console.log('📋 Root path request - returning help information');
    return res.status(200).json({
      message: 'Subscription Functions API',
      usage: {
        subscribe: 'Add ?email=...&brand=... parameters',
        unsubscribe: 'Use /unsubscribe?email=... or magic.[brand].com/unsubscribe?email=...',
        snooze: 'Use /snooze?email=... or magic.[brand].com/snooze?email=... (pauses subscription for 3 months)',
        request: 'Use /request?issue=001&email=... or magic.[brand].com/request?issue=001&email=... (request past newsletter issue)',
        examples: [
          'https://magic.thepicklereport.com?email=user@example.com',
          'https://magic.thepicklereport.com/unsubscribe?email=user@example.com',
          'https://magic.thepicklereport.com/snooze?email=user@example.com',
          'https://magic.thepicklereport.com/request?issue=001&email=user@example.com'
        ]
      },
      features: ['Batched Customer.io API calls', '10-second timeouts', 'Optimized performance']
    });
  }
  
  let brandList = [];
  if (brands) brandList = brands.split(',').map(b => b.trim()).filter(b => b);
  else if (brand && brand.trim()) brandList = [brand.trim()];
  else if (inferredBrand) brandList = [inferredBrand];
  else return res.status(400).send('Missing brand parameter - provide ?brand= or use brand domain like magic.zitsandcake.com');
  
  if (!email) return res.status(400).send('Missing email parameter');
  
  const normalizedEmail = email.replace(/ /g, '+').toLowerCase().trim();
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  
  // ============================================================================
  // Request past issue: (a) subscribed → set requested_issue only; (b) in BQ not subscribed → lead + BQ leadData; (c) not in BQ → create user + lead
  // ============================================================================
  if (finalAction === 'request') {
    if (!issue || String(issue).trim() === '') {
      return res.status(400).send('Missing issue parameter - use /request?issue=001&email=...');
    }
    const brandSlug = brandList[0];
    const brandCode = BRAND_SLUG_TO_CODE[brandSlug];
    if (!brandCode) {
      return res.status(400).send('Request issue not supported for this brand');
    }
    const issueParam = String(issue).trim();
    const requestedIssue = `${brandCode}_issue${issueParam}`;
    console.log('📬 Processing request past issue:', { email: normalizedEmail, brandSlug, brandCode, requestedIssue });
    try {
      const userID = await findUserByEmail(normalizedEmail);
      const isSubscribed = userID ? await checkUserSubscriptionStatus(userID, brandSlug) : false;

      if (userID && isSubscribed) {
        // (a) In BQ and already subscribed to brand: set requested_issue in Customer.io only
        console.log('📬 Scenario (a): user subscribed, setting requested_issue only');
        const identifyRequest = {
          type: 'person',
          identifiers: { id: userID },
          action: 'identify',
          attributes: { email: normalizedEmail, requested_issue: requestedIssue }
        };
        const cioResult = await sendBatchedCustomerIORequests([identifyRequest]);
        if (!cioResult.success) {
          console.error('❌ Customer.io identify failed for request:', cioResult.error);
          return res.status(500).send('Failed to record request. Please try again.');
        }
        console.log('✅ Customer.io requested_issue set (scenario a):', requestedIssue);
      } else if (userID && !isSubscribed) {
        // (b) In BQ but not subscribed: update BQ leadData, then set lead + requested_issue in Customer.io
        console.log('📬 Scenario (b): user in BQ not subscribed, adding as lead and updating leadData');
        const bqResult = await updateUserLeadDataForRequest(userID, brandSlug, requestedIssue);
        if (!bqResult.success) {
          console.error('❌ BQ leadData update failed:', bqResult.error);
          return res.status(500).send('Failed to record request. Please try again.');
        }
        const identifyRequest = {
          type: 'person',
          identifiers: { id: userID },
          action: 'identify',
          attributes: {
            email: normalizedEmail,
            requested_issue: requestedIssue,
            [`lead_for_${brandSlug}`]: true
          }
        };
        const cioResult = await sendBatchedCustomerIORequests([identifyRequest]);
        if (!cioResult.success) {
          console.error('❌ Customer.io identify failed for request:', cioResult.error);
          return res.status(500).send('Failed to record request. Please try again.');
        }
        console.log('✅ Customer.io lead + requested_issue set (scenario b):', requestedIssue);
      } else {
        // (c) Not in BQ: create user in BQ (lead only), then add to Customer.io as lead with requested_issue
        console.log('📬 Scenario (c): new user, creating in BQ and adding as lead');
        const insertResult = await insertRequestIssueUser(normalizedEmail, brandSlug, requestedIssue);
        const newUserID = insertResult.userID;
        if (!insertResult.success || !newUserID) {
          console.error('❌ BQ insert failed:', insertResult.error);
          return res.status(500).send('Failed to record request. Please try again.');
        }
        const identifyRequest = {
          type: 'person',
          identifiers: { email: normalizedEmail },
          action: 'identify',
          attributes: {
            email: normalizedEmail,
            requested_issue: requestedIssue,
            [`lead_for_${brandSlug}`]: true
          }
        };
        const cioResult = await sendBatchedCustomerIORequests([identifyRequest]);
        if (!cioResult.success) {
          console.error('❌ Customer.io identify failed for request:', cioResult.error);
          return res.status(500).send('Failed to record request. Please try again.');
        }
        const updateResult = await updateCustomerIORecordWithID(newUserID, normalizedEmail, {
          requested_issue: requestedIssue,
          [`lead_for_${brandSlug}`]: true
        });
        if (!updateResult.success) {
          console.warn('⚠️ Customer.io ID update failed (non-fatal):', updateResult.error);
        }
        console.log('✅ New user created and Customer.io lead + requested_issue set (scenario c):', requestedIssue);
      }

      const redirectUrl = `https://${brandSlug}.com/?request=true&email=${encodeURIComponent(normalizedEmail)}`;
      return res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('❌ Request issue error:', error.message);
      return res.status(500).send('Request failed. Please try again.');
    }
  }
  
  // ============================================================================
  // FEATURE FLAG: Immediate Redirect (Bot Blocking)
  // If enabled, redirect immediately before processing
  // ============================================================================
  const enableBotBlocking = process.env.ENABLE_BOT_BLOCKING === 'true';
  
  if (enableBotBlocking) {
    console.log('🚀 Bot blocking enabled - redirecting immediately');
    
    // Build redirect URL with all original params
    const params = new URLSearchParams();
    params.set('email', normalizedEmail);
    if (campaignID) params.set('campaignID', campaignID);
    if (utm_source) params.set('utm_source', utm_source);
    if (utm_campaign) params.set('utm_campaign', utm_campaign);
    if (articleID) params.set('articleID', articleID);
    if (brands) params.set('brands', brands);
    if (poll !== undefined) params.set('poll', poll || ''); // Preserve poll parameter (even if empty)
    
    let redirectUrl;
    const isArticlePath = urlPath &&
      urlPath !== '/' &&
      urlPath !== '/unsubscribe' &&
      urlPath !== '/snooze' &&
      urlPath !== '/request' &&
      !urlPath.startsWith('/api/');
    
    if (finalAction === 'unsubscribe') {
      params.set('unsubscribed', 'true');
      redirectUrl = `https://${brandList[0]}.com?${params.toString()}`;
      console.log(`🔄 Immediate redirect to unsubscribe page: ${redirectUrl}`);
      return res.redirect(302, redirectUrl);
    }
    
    if (finalAction === 'snooze') {
      params.set('snoozed', 'true');
      redirectUrl = `https://${brandList[0]}.com?${params.toString()}`;
      console.log(`🔄 Immediate redirect to snooze page: ${redirectUrl}`);
      return res.redirect(302, redirectUrl);
    }
    
    // Subscribe redirects
    if (typeof redirect !== 'undefined' && url) {
      // Scenario 2: External redirect
      params.set('sitename', sitename || '');
      params.set('url', url);
      redirectUrl = `https://${brandList[0]}.com/redirect?${params.toString()}`;
      console.log(`🔄 Immediate redirect to external redirect page: ${redirectUrl}`);
    } else if (isArticlePath) {
      // Scenario 1: Article link
      const articlePath = urlPath.substring(1);
      params.set('subscribed', 'true');
      redirectUrl = `https://${brandList[0]}.com/${articlePath}?${params.toString()}`;
      console.log(`🔄 Immediate redirect to article page: ${redirectUrl}`);
    } else {
      // Default: Success page (or poll page if poll parameter exists)
      params.set('subscribed', 'true');
      redirectUrl = `https://${brandList[0]}.com?${params.toString()}`;
      if (poll !== undefined) {
        console.log(`🔄 Immediate redirect to poll page: ${redirectUrl}`);
      } else {
        console.log(`🔄 Immediate redirect to default success page: ${redirectUrl}`);
      }
    }
    
    return res.redirect(302, redirectUrl);
  }
  
  // If feature flag is disabled, continue with existing flow below
  
  // Handle unsubscribe action
  if (finalAction === 'unsubscribe') {
    console.log('📤 Processing unsubscribe request:', { email: normalizedEmail, brandList });
    
    try {
      // Find user by email to get person_id
      const userID = await findUserByEmail(normalizedEmail);
      
      if (!userID) {
        console.log(`⚠️ User not found for email: ${normalizedEmail}`);
        return res.status(404).send('User not found');
      }
      
      // Process the unsubscription for each brand
      for (const brandId of brandList) {
        console.log(`🔄 Processing unsubscription for brand: ${brandId}`);
        const result = await removeBrandRelationships(userID, [brandId], normalizedEmail, false, 'unsubscribe_then_subscribe', false);
        console.log(`📤 removeBrandRelationships result:`, result);
        
        if (result.success) {
          console.log(`✅ Customer.io unsubscription successful for ${brandId}`);
          
          // Remove brand from BigQuery subscriptions AND log unsubscription
          const bigQueryResult = await removeBrandFromSubscriptionsAndLogUnsubscription(
            userID, 
            brandId, 
            result.unsubscribe_date,
            normalizedEmail,
            false
          );
          console.log(`📊 BigQuery update result:`, bigQueryResult);
          
          if (!bigQueryResult.success) {
            console.error('❌ BigQuery update failed:', bigQueryResult.error);
          }
        } else {
          console.error(`❌ Failed to unsubscribe from ${brandId}:`, result.error);
        }
      }
      
      // Log unsubscribe clicks to BigQuery
      await logClickToBigQuery(userID, normalizedEmail, brandList, {
        userAgent: req.headers['user-agent'],
        eventType: 'unsubscribe'
      });
      
      // Redirect to first brand website with unsubscribed parameter and email
      const brandWebsite = `https://${brandList[0]}.com?unsubscribed=true&email=${encodeURIComponent(normalizedEmail)}`;
      console.log(`🔄 Redirecting to: ${brandWebsite}`);
      
      return res.redirect(302, brandWebsite);
    } catch (error) {
      console.error('❌ Unsubscribe error:', error.message);
      return res.status(500).send('Unsubscription failed. Please try again.');
    }
  }
  
  // Handle snooze action
  if (finalAction === 'snooze') {
    // Normalize email - handle spaces that should be +, lowercase, trim
    const normalizedEmail = email.replace(/ /g, '+').toLowerCase().trim();
    
    console.log('😴 Processing snooze request:', { email: normalizedEmail, brandList });
    
    try {
      // Find user by email to get person_id
      const userID = await findUserByEmail(normalizedEmail);
      
      if (!userID) {
        console.log(`⚠️ User not found for email: ${normalizedEmail}`);
        return res.status(404).send('User not found');
      }
      
      // Calculate reactivation date (3 months from now)
      const reactivationDate = new Date();
      reactivationDate.setMonth(reactivationDate.getMonth() + 3);
      const reactivationTimestamp = reactivationDate.getTime();
      
      console.log(`😴 Snoozing subscription until: ${reactivationDate.toISOString()}`);
      
      // Check current subscription status for each brand
      for (const brandId of brandList) {
        console.log(`🔄 Processing snooze for brand: ${brandId}`);
        
        // Check if user is currently subscribed to this brand
        const isCurrentlySubscribed = await checkUserSubscriptionStatus(userID, brandId);
        console.log(`📊 Current subscription status for ${brandId}:`, isCurrentlySubscribed);
        
        if (isCurrentlySubscribed) {
          // Case 1: Currently subscribed - unsubscribe temporarily and schedule reactivation
          console.log(`😴 User is subscribed to ${brandId}, temporarily unsubscribing...`);
          
          const result = await removeBrandRelationships(userID, [brandId], normalizedEmail, true, 'unsubscribe_then_subscribe', false);
          console.log(`📤 removeBrandRelationships result:`, result);
          
          if (result.success) {
            console.log(`✅ Customer.io snooze successful for ${brandId}`);
            
            // Log snooze to BigQuery with reactivation date
            const snoozeResult = await logSnoozeToBigQuery(userID, brandId, reactivationTimestamp, 'unsubscribe_then_subscribe');
            console.log(`📊 Snooze logging result:`, snoozeResult);
            
            if (!snoozeResult.success) {
              console.error('❌ Snooze logging failed:', snoozeResult.error);
            }
          } else {
            console.error(`❌ Failed to snooze ${brandId}:`, result.error);
          }
        } else {
          // Case 2: Not currently subscribed - schedule subscription in 3 months
          console.log(`😴 User is not subscribed to ${brandId}, scheduling subscription in 3 months...`);
          
          // Just log the snooze without changing current subscription status
          const snoozeResult = await logSnoozeToBigQuery(userID, brandId, reactivationTimestamp, 'subscribe_later');
          console.log(`📊 Snooze logging result:`, snoozeResult);
          
          if (!snoozeResult.success) {
            console.error('❌ Snooze logging failed:', snoozeResult.error);
          }
        }
      }
      
      // Log snooze clicks to BigQuery
      await logClickToBigQuery(userID, normalizedEmail, brandList, {
        userAgent: req.headers['user-agent'],
        eventType: 'snooze'
      });
      
      // Redirect to first brand website with snoozed parameter and email
      const brandWebsite = `https://${brandList[0]}.com?snoozed=true&email=${encodeURIComponent(normalizedEmail)}`;
      console.log(`🔄 Redirecting to: ${brandWebsite}`);
      
      return res.redirect(302, brandWebsite);
    } catch (error) {
      console.error('❌ Snooze error:', error.message);
      return res.status(500).send('Snooze failed. Please try again.');
    }
  }
  
  try {
    console.log('🚀 Starting optimized magic-link handler for:', { brandList });
    
    // Validate email quality
    const validationResult = await validateEmail(normalizedEmail);
    console.log('📧 Email validation:', validationResult);
    
    let userID = await findUserByEmail(normalizedEmail);
    let isNewUser = !userID;
    
    console.log('🔍 User lookup result:', { userID, isNewUser });
    
    if (!userID) {
      // Generate deterministic UUID v5 based on email to prevent race condition duplicates
      // Same email will always generate the same UUID, even in concurrent requests
      userID = uuidv5(normalizedEmail.toLowerCase(), USER_NAMESPACE);
      console.log('New user (deterministic UUID):', userID);
    } else {
      console.log('Existing user:', userID);
    }
    
    // Customer.io call will be made after we build the complete subscriptions object
    
    // Update BigQuery with MERGE
    try {
      console.log('🔄 Processing user subscriptions with MERGE...');
      
      let subscriptionsObj = {};
      let finalSnoozedBrands = null;
      
      // For existing users, start with existing subscriptions
      if (!isNewUser) {
        try {
          const query = `
            SELECT subscriptions, snoozed_brands
            FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
            WHERE userID = @userID 
            LIMIT 1
          `;
          
          const [rows] = await bq.query({ query, params: { userID } });
          
          if (rows.length > 0) {
            const userData = rows[0];
            
            // Start with existing subscriptions
            if (userData.subscriptions) {
              subscriptionsObj = typeof userData.subscriptions === 'string' 
                ? JSON.parse(userData.subscriptions) 
                : userData.subscriptions;
              console.log('📊 Started with existing subscriptions:', Object.keys(subscriptionsObj));
            }
            
            // Handle snooze data - clear snoozed brands that user is actively subscribing to
            if (userData.snoozed_brands) {
              try {
                const snoozedBrands = JSON.parse(userData.snoozed_brands);
                const clearedSnoozes = {};
                
                // Check if any of the brands being subscribed to are currently snoozed
                brandList.forEach(brand => {
                  if (snoozedBrands[brand]) {
                    console.log(`😴 Clearing snooze for ${brand} - user actively subscribed`);
                    clearedSnoozes[brand] = {
                      ...snoozedBrands[brand],
                      cleared_date: new Date().getTime(),
                      cleared_reason: 'active_subscription'
                    };
                    delete snoozedBrands[brand];
                  }
                });
                
                // If we cleared any snoozes, prepare the updated snoozed_brands for the MERGE
                if (Object.keys(clearedSnoozes).length > 0) {
                  console.log(`🧹 Cleared ${Object.keys(clearedSnoozes).length} snoozed brands due to active subscription`);
                  finalSnoozedBrands = JSON.stringify(snoozedBrands);
                  console.log('✅ Prepared cleared snoozed brands for MERGE');
                } else {
                  // No snoozes were cleared, keep existing snoozed_brands
                  finalSnoozedBrands = userData.snoozed_brands;
                }
              } catch (e) {
                console.log('⚠️ Could not parse existing snoozed_brands');
                finalSnoozedBrands = userData.snoozed_brands; // Keep original if parsing fails
              }
            }
          }
        } catch (mergeError) {
          console.log('⚠️ Could not fetch existing user data, using new subscriptions only');
        }
      }
      
      // Add new brands to subscriptions (whether existing or new user)
      brandList.forEach(brand => {
        subscriptionsObj[brand] = {
          subscribed_timestamp: new Date().getTime(),
          subSource: utm_source || null
        };
      });
      
      console.log('📊 Final subscriptions after adding new brands:', Object.keys(subscriptionsObj));
      console.log('📝 Final subscriptions for MERGE:', JSON.stringify(subscriptionsObj, null, 2));
      
      // Use MERGE statement to handle both insert and update
      const mergeQuery = `
        MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
        USING (
          SELECT 
            '${userID}' as userID,
            '${normalizedEmail}' as email,
            '${hashEmail(normalizedEmail)}' as emailHash,
            JSON '${JSON.stringify(subscriptionsObj)}' as subscriptions,
            ${finalSnoozedBrands ? `'${finalSnoozedBrands}'` : 'NULL'} as snoozed_brands,
            CURRENT_TIMESTAMP() as recentClickDate,
            CURRENT_TIMESTAMP() as createdAt
        ) AS source
        ON target.email = source.email
        WHEN MATCHED THEN
          UPDATE SET 
            subscriptions = source.subscriptions,
            ${finalSnoozedBrands ? 'snoozed_brands = source.snoozed_brands,' : ''}
            recentClickDate = source.recentClickDate
        WHEN NOT MATCHED THEN
          INSERT (userID, email, emailHash, subscriptions, ${finalSnoozedBrands ? 'snoozed_brands, ' : ''}recentClickDate, createdAt)
          VALUES (source.userID, source.email, source.emailHash, source.subscriptions, ${finalSnoozedBrands ? 'source.snoozed_brands, ' : ''}source.recentClickDate, source.createdAt)
      `;
      
      console.log('🔍 MERGE query params:', { userID, email: normalizedEmail, emailHash: hashEmail(normalizedEmail) });
      
      await bq.query({
        query: mergeQuery
      });
      
      console.log('✅ User record MERGED successfully (inserted or updated)');
      console.log('📊 Final subscriptions:', JSON.stringify(subscriptionsObj, null, 2));
      
      // Now send to Customer.io with the complete subscriptions object
      if (validationResult.valid) {
        console.log('✅ Email is valid, sending batched requests to Customer.io');
        
        // Create batched Customer.io requests with complete subscriptions
        const brandResult = await createBrandRelationships(userID, brandList, normalizedEmail, subscriptionsObj, isNewUser);
        
        if (brandResult.success) {
          console.log(`✅ Brand relationships created: ${brandResult.relationships} brands`);
        } else {
          console.error('❌ Brand relationship creation failed:', brandResult.error);
        }
      } else {
        console.log('❌ Email is invalid, skipping Customer.io:', validationResult.reason);
      }
      
    } catch (mergeError) {
      console.error('❌ User MERGE failed:', mergeError.message);
      console.error('MERGE error details:', JSON.stringify(mergeError.errors || mergeError.response?.insertErrors, null, 2));
    }
    
    // Insert click to BigQuery (one record per brand)
    await logClickToBigQuery(userID, normalizedEmail, brandList, {
      campaignID,
      articleID,
      utm_source,
      utm_campaign,
      userAgent: req.headers['user-agent'],
      eventType: 'subscribe'
    });
    
    // Retention.com suppression is now handled via scheduled batch job (twice daily)
    // Removed per-request suppression to stay within API rate limits (3 calls/day)
    
    // Determine redirect destination based on URL structure and parameters
    let redirectUrl;
    const isArticlePath = urlPath &&
      urlPath !== '/' &&
      urlPath !== '/unsubscribe' &&
      urlPath !== '/snooze' &&
      urlPath !== '/request' &&
      !urlPath.startsWith('/api/');
    
    if (typeof redirect !== 'undefined' && url) {
      // Scenario 2: External redirect with interstitial on brand site
      redirectUrl = `https://${brandList[0]}.com/redirect?sitename=${encodeURIComponent(sitename || '')}&url=${encodeURIComponent(url)}`;
      console.log(`🔄 Redirecting to external redirect page: ${redirectUrl}`);
    } else if (isArticlePath) {
      // Scenario 1: Article link - go directly to article page with subscribed flag
      const articlePath = urlPath.substring(1);
      redirectUrl = `https://${brandList[0]}.com/${articlePath}?subscribed=true&email=${encodeURIComponent(normalizedEmail)}`;
      console.log(`🔄 Redirecting to article page: ${redirectUrl}`);
    } else {
      // Default: Redirect to brand website with subscribed parameter and email
      redirectUrl = `https://${brandList[0]}.com?subscribed=true&email=${encodeURIComponent(normalizedEmail)}`;
      console.log(`🔄 Redirecting to default success page: ${redirectUrl}`);
    }
    
    return res.redirect(302, redirectUrl);
    
  } catch (error) {
    console.error('❌ Magic-link handler error:', error.message);
    return res.status(500).send('Subscription failed. Please try again.');
  }
}
