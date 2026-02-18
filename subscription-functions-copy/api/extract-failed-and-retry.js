/**
 * Extract failed emails from results JSON and create a retry CSV
 * Then process the retry CSV
 * 
 * Usage:
 *   node api/extract-failed-and-retry.js <results-json> <original-csv>
 * 
 * Example:
 *   node api/extract-failed-and-retry.js my-bulk_results.json my-bulk.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractFailedAndRetry(resultsJsonPath, originalCsvPath) {
  try {
    // Read results JSON
    console.log(`📖 Reading results from: ${resultsJsonPath}`);
    const resultsContent = fs.readFileSync(resultsJsonPath, 'utf-8');
    const results = JSON.parse(resultsContent);
    
    // Extract failed emails
    const failedEntries = results.results.filter(r => !r.success);
    console.log(`\n❌ Found ${failedEntries.length} failed subscriptions`);
    
    if (failedEntries.length === 0) {
      console.log('✅ No failed subscriptions to retry!');
      return;
    }
    
    // Read original CSV to get brands for failed emails
    console.log(`\n📖 Reading original CSV: ${originalCsvPath}`);
    const csvContent = fs.readFileSync(originalCsvPath, 'utf-8');
    const csvLines = csvContent.split('\n').filter(line => line.trim());
    
    // Parse header
    const header = csvLines[0].toLowerCase().trim();
    const headerParts = header.split(',').map(h => h.trim());
    const emailIndex = headerParts.indexOf('email');
    const brandsIndex = headerParts.indexOf('brands');
    
    if (emailIndex === -1 || brandsIndex === -1) {
      console.error('❌ CSV must have "email" and "brands" columns');
      return;
    }
    
    // Create a map of email -> brands from original CSV
    const emailToBrands = new Map();
    for (let i = 1; i < csvLines.length; i++) {
      const line = csvLines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',').map(p => p.trim());
      if (parts.length > Math.max(emailIndex, brandsIndex)) {
        const email = parts[emailIndex].toLowerCase().trim();
        const brands = parts[brandsIndex];
        if (email && brands) {
          emailToBrands.set(email, brands);
        }
      }
    }
    
    // Create retry CSV
    const retryCsvPath = originalCsvPath.replace('.csv', '_retry.csv');
    const retryLines = ['email,brands'];
    
    let foundCount = 0;
    let notFoundCount = 0;
    
    for (const failedEntry of failedEntries) {
      const email = failedEntry.email.toLowerCase().trim();
      const brands = emailToBrands.get(email);
      
      if (brands) {
        retryLines.push(`${email},${brands}`);
        foundCount++;
      } else {
        console.warn(`⚠️  Could not find brands for ${email} in original CSV`);
        notFoundCount++;
      }
    }
    
    if (foundCount === 0) {
      console.error('❌ Could not find brands for any failed emails in original CSV');
      return;
    }
    
    // Write retry CSV
    fs.writeFileSync(retryCsvPath, retryLines.join('\n'));
    console.log(`\n✅ Created retry CSV: ${retryCsvPath}`);
    console.log(`   Found brands for ${foundCount} emails`);
    if (notFoundCount > 0) {
      console.log(`   ⚠️  Could not find brands for ${notFoundCount} emails`);
    }
    
    // Process the retry CSV
    console.log(`\n🚀 Processing retry CSV...`);
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const processScript = path.join(__dirname, 'process-bulk-subscribe-file.js');
    const { stdout, stderr } = await execAsync(`node "${processScript}" "${retryCsvPath}"`);
    
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Main execution
const resultsJsonPath = process.argv[2];
const originalCsvPath = process.argv[3];

if (!resultsJsonPath || !originalCsvPath) {
  console.error('Usage: node api/extract-failed-and-retry.js <results-json> <original-csv>');
  console.error('\nExample:');
  console.error('  node api/extract-failed-and-retry.js my-bulk_results.json my-bulk.csv');
  process.exit(1);
}

if (!fs.existsSync(resultsJsonPath)) {
  console.error(`❌ Results JSON not found: ${resultsJsonPath}`);
  process.exit(1);
}

if (!fs.existsSync(originalCsvPath)) {
  console.error(`❌ Original CSV not found: ${originalCsvPath}`);
  process.exit(1);
}

extractFailedAndRetry(resultsJsonPath, originalCsvPath);
