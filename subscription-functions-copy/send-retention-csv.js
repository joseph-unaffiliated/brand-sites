/**
 * Send Retention.com CSV to processing endpoint
 * 
 * Usage:
 *   node send-retention-csv.js /path/to/contact_download_*.csv
 * 
 * This script reads the CSV file and sends it to the deployed API endpoint.
 */

import fs from 'fs';

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

async function sendCSVToEndpoint(filePath) {
  try {
    console.log(`📄 Reading CSV file: ${filePath}`);
    const csvText = fs.readFileSync(filePath, 'utf-8');
    
    console.log('📋 Parsing CSV...');
    const leads = parseCSV(csvText);
    console.log(`✅ Parsed ${leads.length} leads from CSV`);
    
    // Determine endpoint URL
    const endpoint = process.env.PROCESS_RETENTION_CSV_URL || 
                     'https://magic.unaffiliated.co/api/process-retention-csv';
    
    console.log(`\n🚀 Sending to endpoint: ${endpoint}`);
    console.log(`📊 Sending ${leads.length} leads...`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leads })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
      console.error(`Error: ${errorText}`);
      process.exit(1);
    }
    
    const result = await response.json();
    
    console.log(`\n✅ Processing Complete!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total: ${result.summary.total}`);
    console.log(`✅ Successful: ${result.summary.successful}`);
    console.log(`❌ Failed: ${result.summary.failed}`);
    console.log(`⚠️ Skipped: ${result.summary.skipped}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (result.summary.errors && result.summary.errors.length > 0) {
      console.log(`\n❌ Errors (first 10):`);
      result.summary.errors.slice(0, 10).forEach(err => {
        console.log(`   Row ${err.row} (${err.email}): ${err.error}`);
      });
      if (result.summary.errors.length > 10) {
        console.log(`   ... and ${result.summary.errors.length - 10} more errors`);
      }
    }
    
    // Save results to file
    const resultsFile = filePath.replace('.csv', '_results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node send-retention-csv.js <csv-file>');
  console.error('\nExample:');
  console.error('  node send-retention-csv.js /Users/joseph/Downloads/contact_download_1765605033.csv');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

sendCSVToEndpoint(filePath);

