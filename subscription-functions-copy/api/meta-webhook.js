import { BigQuery } from '@google-cloud/bigquery';
import crypto from 'crypto';
import { v5 as uuidv5 } from 'uuid';

// Namespace UUID for deterministic userID generation (v5)
// This ensures the same email always generates the same userID, preventing race condition duplicates
const USER_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Standard DNS namespace UUID

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

function hashEmail(email, salt = process.env.EMAIL_SALT || 'default-salt') {
  try {
    return crypto.createHash('sha256').update(email + salt).digest('hex');
  } catch (error) {
    console.error('Email hashing error:', error.message);
    return email;
  }
}

// Brand mapping for Meta Lead Ads
const META_BRAND_MAPPING = {
  'batmitzvahhorrorstories': 'batmitzvahhorrorstories',
  'onetimeatcamp': 'onetimeatcamp',
  'zitsandcake': 'zitsandcake',
  'thepicklereport': 'thepicklereport'
};

/**
 * Meta Lead Ads Webhook Handler
 * Receives lead data from Meta and automatically subscribes users via magic link
 */
export default async function handler(req, res) {
  console.log('🚀 META WEBHOOK HANDLER - Lead Ads Integration');
  
  try {
    // Verify webhook (Meta requires this for setup)
    if (req.method === 'GET') {
      return handleWebhookVerification(req, res);
    }
    
    // Handle lead data (POST)
    if (req.method === 'POST') {
      return handleLeadData(req, res);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Meta webhook error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle Meta webhook verification
 */
async function handleWebhookVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log('🔍 Webhook verification request:', { mode, token: token ? '***' : 'missing', challenge });
  
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
  
  if (!VERIFY_TOKEN) {
    console.error('❌ META_VERIFY_TOKEN not configured');
    return res.status(500).json({ error: 'Webhook verification token not configured' });
  }
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verification successful');
    return res.status(200).send(challenge);
  }
  
  console.log('❌ Webhook verification failed');
  return res.status(403).send('Forbidden');
}

/**
 * Handle incoming lead data from Meta
 */
async function handleLeadData(req, res) {
  console.log('📥 Processing Meta lead data...');
  
  const body = req.body;
  console.log('📊 Lead data payload:', JSON.stringify(body, null, 2));
  
  if (!body.entry) {
    console.log('⚠️ No entry data in payload');
    return res.status(200).json({ success: true, message: 'No entry data' });
  }
  
  const processedLeads = [];
  
  // Process each entry
  for (const entry of body.entry) {
    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.value && change.value.leadgen_id) {
          try {
            const leadId = change.value.leadgen_id;
            const formId = change.value.form_id;
            const pageId = change.value.page_id;
            
            console.log(`🔍 Processing lead ${leadId} from form ${formId} on page ${pageId}`);
            
            // Fetch lead details from Meta Graph API
            const leadData = await getLeadDetails(leadId);
            
            if (leadData && leadData.email) {
              // Determine brand from form ID or page ID
              const brand = determineBrandFromMetaData(formId, pageId);
              
              if (brand) {
                console.log(`📧 Subscribing ${leadData.email} to ${brand} via Meta lead`);
                
                // First, upsert lead data to Users table
                const upsertResult = await upsertMetaLeadToUsersTable(
                  leadData.email, 
                  brand, 
                  leadId, 
                  formId, 
                  pageId,
                  leadData,
                  true, // We'll update this based on subscription result
                  null
                );
                
                if (!upsertResult.success) {
                  console.error(`❌ Failed to upsert lead ${leadId} to Users table:`, upsertResult.error);
                  processedLeads.push({
                    leadId,
                    email: leadData.email,
                    brand,
                    success: false,
                    error: `Users table upsert failed: ${upsertResult.error}`
                  });
                  continue;
                }
                
                // Subscribe user via magic link system
                const subscriptionResult = await subscribeUserFromMetaLead(
                  leadData.email, 
                  brand, 
                  leadId, 
                  formId, 
                  pageId,
                  leadData
                );
                
                // Update the lead data with final subscription result
                if (subscriptionResult.success !== true) {
                  await upsertMetaLeadToUsersTable(
                    leadData.email, 
                    brand, 
                    leadId, 
                    formId, 
                    pageId,
                    leadData,
                    false,
                    subscriptionResult.error
                  );
                }
                
                processedLeads.push({
                  leadId,
                  email: leadData.email,
                  brand,
                  success: subscriptionResult.success,
                  error: subscriptionResult.error
                });
                
                console.log(`✅ Lead ${leadId} processed:`, subscriptionResult.success ? 'SUCCESS' : 'FAILED');
              } else {
                console.log(`⚠️ Could not determine brand for lead ${leadId}`);
                processedLeads.push({
                  leadId,
                  email: leadData.email,
                  brand: null,
                  success: false,
                  error: 'Could not determine brand'
                });
              }
            } else {
              console.log(`⚠️ No email found for lead ${leadId}`);
              processedLeads.push({
                leadId,
                email: null,
                brand: null,
                success: false,
                error: 'No email found'
              });
            }
          } catch (leadError) {
            console.error(`❌ Error processing lead ${change.value.leadgen_id}:`, leadError.message);
            processedLeads.push({
              leadId: change.value.leadgen_id,
              email: null,
              brand: null,
              success: false,
              error: leadError.message
            });
          }
        }
      }
    }
  }
  
  console.log(`📊 Processed ${processedLeads.length} leads:`, processedLeads);
  
  return res.status(200).json({ 
    success: true, 
    processedLeads,
    summary: {
      total: processedLeads.length,
      successful: processedLeads.filter(l => l.success).length,
      failed: processedLeads.filter(l => !l.success).length
    }
  });
}

/**
 * Fetch lead details from Meta Graph API
 */
async function getLeadDetails(leadId) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN not configured');
  }
  
  try {
    console.log(`🔍 Fetching lead details for ${leadId}...`);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${leadId}?access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 Lead data for ${leadId}:`, JSON.stringify(data, null, 2));
    
    // Extract email and other fields from field_data
    const leadData = {
      email: null,
      firstName: null,
      lastName: null,
      phone: null,
      customFields: {}
    };
    
    if (data.field_data) {
      for (const field of data.field_data) {
        const value = field.values && field.values[0];
        
        switch (field.name) {
          case 'email':
            leadData.email = value;
            break;
          case 'first_name':
            leadData.firstName = value;
            break;
          case 'last_name':
            leadData.lastName = value;
            break;
          case 'phone_number':
            leadData.phone = value;
            break;
          default:
            leadData.customFields[field.name] = value;
        }
      }
    }
    
    return leadData;
    
  } catch (error) {
    console.error(`❌ Error fetching lead ${leadId}:`, error.message);
    throw error;
  }
}

/**
 * Determine brand from Meta form/page data
 */
function determineBrandFromMetaData(formId, pageId) {
  // You can customize this logic based on your Meta setup
  // For now, we'll use a simple mapping or you can configure form-specific brands
  
  // Option 1: Map by form ID (if you have specific forms per brand)
  const FORM_BRAND_MAPPING = {
    // Add your form IDs here
    // '1234567890123456': 'batmitzvahhorrorstories',
    // '2345678901234567': 'onetimeatcamp',
  };
  
  if (FORM_BRAND_MAPPING[formId]) {
    return FORM_BRAND_MAPPING[formId];
  }
  
  // Option 2: Map by page ID (if you have specific pages per brand)
  const PAGE_BRAND_MAPPING = {
    // Add your page IDs here
    // '9876543210987654': 'batmitzvahhorrorstories',
    // '8765432109876543': 'onetimeatcamp',
  };
  
  if (PAGE_BRAND_MAPPING[pageId]) {
    return PAGE_BRAND_MAPPING[pageId];
  }
  
  // Option 3: No default brand - return null if brand cannot be determined
  console.log(`⚠️ Could not determine brand for form ${formId}, page ${pageId} - no default brand configured`);
  return null;
}

/**
 * Subscribe user via magic link system
 */
async function subscribeUserFromMetaLead(email, brand, leadId, formId, pageId, leadData) {
  try {
    console.log(`🔗 Subscribing ${email} to ${brand} via magic link...`);
    
    // Call your existing magic link endpoint
    const magicLinkUrl = `https://subscription-functions.vercel.app/?email=${encodeURIComponent(email)}&brand=${brand}&utm_source=meta_lead_ads&utm_campaign=lead_form&campaignID=${leadId}`;
    
    console.log(`📤 Calling magic link: ${magicLinkUrl}`);
    
    const response = await fetch(magicLinkUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Meta-LeadAds-Webhook/1.0'
      }
    });
    
    if (response.ok) {
      console.log(`✅ Magic link subscription successful for ${email}`);
      return { success: true };
    } else {
      console.error(`❌ Magic link subscription failed: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error(`❌ Error subscribing ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create or update user record in BigQuery Users table with Meta lead data
 */
async function upsertMetaLeadToUsersTable(email, brand, leadId, formId, pageId, leadData, success, error = null) {
  try {
    console.log(`📊 Upserting Meta lead to Users table: ${email} -> ${brand}`);
    
    // Generate deterministic UUID v5 based on email to prevent race condition duplicates
    // Same email will always generate the same UUID, even in concurrent requests
    const normalizedEmail = email.toLowerCase().trim();
    const userID = uuidv5(normalizedEmail, USER_NAMESPACE);
    const emailHash = hashEmail(normalizedEmail);
    const timestamp = new Date().toISOString();
    
    // Prepare lead data for storage
    const fullLeadData = {
      leadId,
      formId,
      pageId,
      brand,
      success,
      error,
      processedAt: timestamp,
      customFields: leadData.customFields,
      metaLeadData: leadData // Store original Meta lead data
    };
    
    // Use MERGE to handle both insert and update
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
      USING (
        SELECT 
          '${userID}' as userID,
          '${normalizedEmail}' as email,
          '${emailHash}' as emailHash,
          'meta_lead_ads' as leadSource,
          JSON '${JSON.stringify(fullLeadData).replace(/'/g, "''")}' as leadData,
          ${leadData.firstName ? `'${leadData.firstName.replace(/'/g, "''")}'` : 'NULL'} as firstName,
          ${leadData.lastName ? `'${leadData.lastName.replace(/'/g, "''")}'` : 'NULL'} as lastName,
          ${leadData.phone ? `'${leadData.phone.replace(/'/g, "''")}'` : 'NULL'} as phone,
          CURRENT_TIMESTAMP() as recentClickDate,
          CURRENT_TIMESTAMP() as createdAt,
          CURRENT_TIMESTAMP() as updatedAt
      ) AS source
      ON target.email = source.email
      WHEN MATCHED THEN
        UPDATE SET 
          leadSource = source.leadSource,
          leadData = source.leadData,
          firstName = COALESCE(source.firstName, target.firstName),
          lastName = COALESCE(source.lastName, target.lastName),
          phone = COALESCE(source.phone, target.phone),
          recentClickDate = source.recentClickDate,
          updatedAt = source.updatedAt
      WHEN NOT MATCHED THEN
        INSERT (userID, email, emailHash, leadSource, leadData, firstName, lastName, phone, recentClickDate, createdAt, updatedAt)
        VALUES (source.userID, source.email, source.emailHash, source.leadSource, source.leadData, source.firstName, source.lastName, source.phone, source.recentClickDate, source.createdAt, source.updatedAt)
    `;
    
    await bq.query({ query: mergeQuery });
    console.log(`✅ Meta lead upserted to Users table successfully`);
    
    return { success: true, userID };
    
  } catch (bqError) {
    console.error('❌ Error upserting to Users table:', bqError.message);
    return { success: false, error: bqError.message };
  }
}
