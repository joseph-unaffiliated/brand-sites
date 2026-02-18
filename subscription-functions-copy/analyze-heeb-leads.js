/**
 * Analyze Heeb Leads CSV
 * 
 * Checks each email from the CSV against:
 * 1. BigQuery users table (validation status, subscriptions, unsubscribed_brands)
 * 2. Customer.io (lead_for_heebnewsletters attribute)
 * 
 * Categorizes emails as:
 * - Already processed (has lead tag in Customer.io)
 * - Failed validation
 * - Already subscribed/unsubscribed (wouldn't qualify as lead)
 * - Still needs processing
 */

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import fs from 'fs';

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
const CSV_FILE = "/Users/joseph/Downloads/Heeb's List - Active Leads.csv";

/**
 * Check if user qualifies as a lead for a specific brand
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
 * Get user from BigQuery
 */
async function getUserFromBigQuery(email) {
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
    WHERE email = @email
    LIMIT 1
  `;
  
  try {
    const [rows] = await bq.query({ query, params: { email: email.toLowerCase() } });
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`Error querying BigQuery for ${email}:`, error.message);
    return null;
  }
}

/**
 * Check Customer.io for lead tag using entity API
 */
async function checkCustomerIOLeadTag(email) {
  try {
    // Customer.io API: Get person by email using entity endpoint
    // First, try to get by email identifier
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
      return false; // Person not found
    }
    // Don't log errors for every email, just return false
    return false;
  }
}

/**
 * Analyze a single email
 */
async function analyzeEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Get user from BigQuery
  const user = await getUserFromBigQuery(normalizedEmail);
  
  // Check Customer.io
  const hasLeadTag = await checkCustomerIOLeadTag(normalizedEmail);
  
  const result = {
    email: normalizedEmail,
    inBigQuery: !!user,
    hasLeadTagInCIO: hasLeadTag,
    status: 'unknown',
    reason: '',
    details: {}
  };
  
  if (hasLeadTag) {
    result.status = 'already_processed';
    result.reason = 'Has lead_for_heebnewsletters tag in Customer.io';
  } else if (!user) {
    result.status = 'needs_processing';
    result.reason = 'Not in BigQuery, needs to be processed';
  } else {
    // Check validation status
    const validationStatus = user.emailValidationStatus || user.emailValidationReason;
    if (validationStatus && !['Valid', 'Verified', 'no_api_key', 'validation_error'].includes(validationStatus)) {
      result.status = 'failed_validation';
      result.reason = `Email validation failed: ${validationStatus}`;
      result.details.validationStatus = validationStatus;
    } else {
      // Check if user qualifies as lead
      const qualifiesAsLead = isUserLeadForBrand(user, BRAND_ID);
      
      if (!qualifiesAsLead) {
        // Check why they don't qualify
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
          result.details.subscriptions = Object.keys(subscriptions);
        } else if (unsubscribedBrands[BRAND_ID]) {
          result.status = 'unsubscribed';
          result.reason = 'User unsubscribed from heebnewsletters';
        } else if (leadData?.brand_interest !== BRAND_ID) {
          result.status = 'wrong_brand_interest';
          result.reason = `Brand interest is ${leadData?.brand_interest || 'null'}, not ${BRAND_ID}`;
        } else {
          result.status = 'needs_processing';
          result.reason = 'In BigQuery but lead tag not synced to Customer.io';
        }
      } else {
        result.status = 'needs_processing';
        result.reason = 'Qualifies as lead but tag not in Customer.io';
      }
    }
  }
  
  return result;
}

/**
 * Main analysis function
 */
async function analyzeLeads() {
  console.log('📖 Reading CSV file...');
  
  // Read CSV file manually
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Skip header
  const emails = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (assuming email,brand format)
    const parts = line.split(',');
    if (parts.length >= 2) {
      const email = parts[0].trim().replace(/^"|"$/g, '');
      if (email && email.includes('@')) {
        emails.push(email.toLowerCase());
      }
    }
  }
  
  console.log(`📊 Found ${emails.length} emails in CSV`);
  console.log('🔍 Analyzing each email...\n');
  
  const results = {
    already_processed: [],
    failed_validation: [],
    already_subscribed: [],
    unsubscribed: [],
    wrong_brand_interest: [],
    needs_processing: [],
    unknown: []
  };
  
  let processed = 0;
  const total = emails.length;
  
  for (const email of emails) {
    processed++;
    if (processed % 100 === 0) {
      console.log(`   Processed ${processed}/${total}...`);
    }
    
    const result = await analyzeEmail(email);
    results[result.status].push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total emails in CSV: ${total}`);
  console.log(`Already processed (has lead tag): ${results.already_processed.length}`);
  console.log(`Failed validation: ${results.failed_validation.length}`);
  console.log(`Already subscribed: ${results.already_subscribed.length}`);
  console.log(`Unsubscribed: ${results.unsubscribed.length}`);
  console.log(`Wrong brand interest: ${results.wrong_brand_interest.length}`);
  console.log(`Needs processing: ${results.needs_processing.length}`);
  console.log(`Unknown: ${results.unknown.length}`);
  console.log();
  
  // Write detailed results to files
  const outputDir = './lead-analysis-results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Write needs_processing list
  if (results.needs_processing.length > 0) {
    const needsProcessingFile = `${outputDir}/needs-processing.csv`;
    const csvContent = 'email,reason\n' + 
      results.needs_processing.map(r => `"${r.email}","${r.reason}"`).join('\n');
    fs.writeFileSync(needsProcessingFile, csvContent);
    console.log(`✅ Wrote ${results.needs_processing.length} emails that need processing to: ${needsProcessingFile}`);
  }
  
  // Write already processed list
  if (results.already_processed.length > 0) {
    const alreadyProcessedFile = `${outputDir}/already-processed.csv`;
    const csvContent = 'email\n' + 
      results.already_processed.map(r => `"${r.email}"`).join('\n');
    fs.writeFileSync(alreadyProcessedFile, csvContent);
    console.log(`✅ Wrote ${results.already_processed.length} already processed emails to: ${alreadyProcessedFile}`);
  }
  
  // Write failed validation list
  if (results.failed_validation.length > 0) {
    const failedFile = `${outputDir}/failed-validation.csv`;
    const csvContent = 'email,reason\n' + 
      results.failed_validation.map(r => `"${r.email}","${r.reason}"`).join('\n');
    fs.writeFileSync(failedFile, csvContent);
    console.log(`✅ Wrote ${results.failed_validation.length} failed validation emails to: ${failedFile}`);
  }
  
  // Write already subscribed list
  if (results.already_subscribed.length > 0) {
    const subscribedFile = `${outputDir}/already-subscribed.csv`;
    const csvContent = 'email,reason,subscriptions\n' + 
      results.already_subscribed.map(r => 
        `"${r.email}","${r.reason}","${(r.details.subscriptions || []).join(',')}"`
      ).join('\n');
    fs.writeFileSync(subscribedFile, csvContent);
    console.log(`✅ Wrote ${results.already_subscribed.length} already subscribed emails to: ${subscribedFile}`);
  }
  
  // Write full results JSON
  const fullResultsFile = `${outputDir}/full-results.json`;
  fs.writeFileSync(fullResultsFile, JSON.stringify(results, null, 2));
  console.log(`✅ Wrote full results to: ${fullResultsFile}`);
  
  console.log('\n✅ Analysis complete!');
}

// Run analysis
analyzeLeads().catch(console.error);
