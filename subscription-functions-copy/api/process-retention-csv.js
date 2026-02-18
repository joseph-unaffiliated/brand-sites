/**
 * Process Retention.com CSV export and add leads to BigQuery
 * 
 * POST /api/process-retention-csv
 * 
 * Accepts either:
 * 1. JSON array of lead objects (from parsed CSV)
 * 2. Raw CSV text in request body
 * 
 * Body format (JSON):
 * {
 *   "leads": [
 *     {
 *       "email": "user@example.com",
 *       "email_domain": "example.com",
 *       "first_name": "First",
 *       "last_name": "Last",
 *       "last_observed": "2025-12-13 04:10:15 UTC",
 *       "landing_page_url": "https://hookuplists.com/...",
 *       "landing_page_domain": "hookuplists.com",
 *       "referrer": "http://hookuplists.com/",
 *       "page_title": "Hookup Lists",
 *       "useragent": "Facebook"
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

// Domain to brand ID mapping
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
  'heebnewsletters.com': 'heebnewsletters',
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
  
  const normalizedDomain = landingPageDomain.toLowerCase().replace(/^www\./, '');
  
  if (DOMAIN_TO_BRAND[normalizedDomain]) {
    return DOMAIN_TO_BRAND[normalizedDomain];
  }
  
  if (DOMAIN_TO_BRAND[`www.${normalizedDomain}`]) {
    return DOMAIN_TO_BRAND[`www.${normalizedDomain}`];
  }
  
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

async function upsertRetentionLeadToUsersTable(email, leadData, validationResult, brandId) {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = hashEmail(normalizedEmail);
  const userID = uuidv5(normalizedEmail, USER_NAMESPACE);
  
  // Parse last_observed timestamp (from CSV, similar to clicked_at)
  let clickedAtTimestamp = null;
  if (leadData.last_observed || leadData.clicked_at) {
    try {
      const timestampStr = leadData.last_observed || leadData.clicked_at;
      clickedAtTimestamp = new Date(timestampStr).toISOString();
    } catch (e) {
      console.log('⚠️ Could not parse timestamp:', leadData.last_observed || leadData.clicked_at);
    }
  }
  
  // Prepare leadData JSON (store everything from CSV)
  const leadDataJson = JSON.stringify({
    email_domain: leadData.email_domain,
    clicked_at: leadData.clicked_at || leadData.last_observed,
    landing_page_url: leadData.landing_page_url,
    landing_page_domain: leadData.landing_page_domain,
    referrer: leadData.referrer,
    page_title: leadData.page_title,
    useragent: leadData.useragent,
    brand_interest: brandId
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
  
  const emailDomainIndex = header.indexOf('email_domain');
  const firstNameIndex = header.indexOf('first_name');
  const lastNameIndex = header.indexOf('last_name');
  const lastObservedIndex = header.indexOf('last_observed');
  const landingPageUrlIndex = header.indexOf('landing_page_url');
  const landingPageDomainIndex = header.indexOf('landing_page_domain');
  const referrerIndex = header.indexOf('referrer');
  const pageTitleIndex = header.indexOf('page_title');
  const useragentIndex = header.indexOf('useragent');
  
  // Parse data rows
  const leads = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    const email = parts[emailIndex];
    if (!email) continue;
    
    leads.push({
      email: email,
      email_domain: emailDomainIndex >= 0 ? parts[emailDomainIndex] : null,
      first_name: firstNameIndex >= 0 ? parts[firstNameIndex] : null,
      last_name: lastNameIndex >= 0 ? parts[lastNameIndex] : null,
      last_observed: lastObservedIndex >= 0 ? parts[lastObservedIndex] : null,
      landing_page_url: landingPageUrlIndex >= 0 ? parts[landingPageUrlIndex] : null,
      landing_page_domain: landingPageDomainIndex >= 0 ? parts[landingPageDomainIndex] : null,
      referrer: referrerIndex >= 0 ? parts[referrerIndex] : null,
      page_title: pageTitleIndex >= 0 ? parts[pageTitleIndex] : null,
      useragent: useragentIndex >= 0 ? parts[useragentIndex] : null
    });
  }
  
  return leads;
}

export default async function handler(req, res) {
  console.log('🚀 PROCESS RETENTION CSV ENDPOINT');
  
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
        error: 'Invalid request body. Expected JSON with "leads" array or CSV text.' 
      });
    }
    
    if (leads.length === 0) {
      return res.status(400).json({ error: 'No leads found in request' });
    }
    
    console.log(`📊 Processing ${leads.length} leads...`);
    
    const results = {
      total: leads.length,
      successful: 0,
      failed: 0,
      skipped: 0,
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
        
        const normalizedEmail = lead.email.toLowerCase().trim();
        console.log(`[${rowNum}/${leads.length}] Processing: ${normalizedEmail.substring(0, 10)}***`);
        
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
        
        // Determine brand from domain
        const brandId = determineBrandFromDomain(lead.landing_page_domain);
        
        // Upsert to BigQuery
        const result = await upsertRetentionLeadToUsersTable(
          normalizedEmail,
          lead,
          validationResult,
          brandId
        );
        
        results.successful++;
        console.log(`✅ ${result.isNewUser ? 'Created' : 'Updated'} lead in BigQuery`);
        
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
    console.log(`Total: ${results.total}, Successful: ${results.successful}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
    
    return res.status(200).json({
      success: true,
      summary: results,
      message: `Processed ${results.total} leads: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`
    });
    
  } catch (error) {
    console.error('❌ Processing error:', error);
    return res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
}

