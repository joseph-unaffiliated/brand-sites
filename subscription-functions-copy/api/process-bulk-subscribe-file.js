/**
 * Process bulk subscription from CSV file
 * 
 * Usage:
 *   node api/process-bulk-subscribe-file.js bulk-subscribe.csv
 * 
 * CSV Format:
 *   email,brands
 *   user@example.com,thepicklereport
 *   user2@example.com,thepicklereport,themixedhome
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processCSVFile(filePath) {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.error('❌ CSV file must have at least a header and one data row');
      return;
    }
    
    // Parse header
    const header = lines[0].toLowerCase().trim();
    const headerParts = header.split(',').map(h => h.trim());
    
    const emailIndex = headerParts.indexOf('email');
    const brandsIndex = headerParts.indexOf('brands');
    
    if (emailIndex === -1) {
      console.error('❌ CSV must have an "email" column');
      return;
    }
    
    if (brandsIndex === -1) {
      console.error('❌ CSV must have a "brands" column');
      return;
    }
    
    // Parse data rows
    const subscriptions = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: Invalid format - ${line}`);
        continue;
      }
      
      const email = parts[emailIndex];
      const brandsStr = parts[brandsIndex];
      
      if (!email) {
        errors.push(`Line ${i + 1}: Missing email`);
        continue;
      }
      
      if (!brandsStr) {
        errors.push(`Line ${i + 1}: Missing brands for ${email}`);
        continue;
      }
      
      // Parse brands (comma-separated)
      const brands = brandsStr.split(',').map(b => b.trim()).filter(Boolean);
      
      if (brands.length === 0) {
        errors.push(`Line ${i + 1}: No valid brands for ${email}`);
        continue;
      }
      
      subscriptions.push({
        email: email,
        brands: brands
      });
    }
    
    if (errors.length > 0) {
      console.error('❌ Errors found in CSV file:');
      errors.forEach(error => console.error(`  - ${error}`));
      return;
    }
    
    if (subscriptions.length === 0) {
      console.error('❌ No valid subscriptions found in CSV file');
      return;
    }
    
    console.log(`✅ Parsed ${subscriptions.length} subscriptions from CSV`);
    console.log(`📋 Sample subscriptions:`);
    subscriptions.slice(0, 3).forEach(sub => {
      console.log(`  - ${sub.email} → ${sub.brands.join(', ')}`);
    });
    if (subscriptions.length > 3) {
      console.log(`  ... and ${subscriptions.length - 3} more`);
    }
    
    // Call the bulk subscribe endpoint
    const endpoint = process.env.BULK_SUBSCRIBE_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/bulk-subscribe` :
                     'https://subscription-functions.vercel.app/api/bulk-subscribe';
    
    console.log(`\n🚀 Processing subscriptions via ${endpoint}...`);
    console.log(`⚠️  Note: If this fails, the endpoint may not be deployed yet.`);
    console.log(`   You can set BULK_SUBSCRIBE_URL environment variable to use a different endpoint.`);
    
    // Automatically handle chunking for large requests
    let remainingSubscriptions = subscriptions;
    let allResults = [];
    let totalSuccessful = 0;
    let totalFailed = 0;
    let chunkNumber = 1;
    
    while (remainingSubscriptions.length > 0) {
      console.log(`\n📦 Processing chunk ${chunkNumber} (${remainingSubscriptions.length} emails remaining)...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptions: remainingSubscriptions,
          options: {
            batchSize: 10,  // Process 10 emails per batch
            delayBetweenBatches: 500  // 500ms delay between batches
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
        console.error(`Error: ${errorText}`);
        break;
      }
      
      const result = await response.json();
      
      // Accumulate results
      if (result.results) {
        allResults = allResults.concat(result.results);
      }
      if (result.summary) {
        totalSuccessful += result.summary.successful || 0;
        totalFailed += result.summary.failed || 0;
      }
      
      console.log(`   ✅ Chunk ${chunkNumber} complete: ${result.summary?.successful || 0} successful, ${result.summary?.failed || 0} failed`);
      
      // Check if there are more emails to process
      if (result.hasMore && result.remaining && result.remaining.length > 0) {
        remainingSubscriptions = result.remaining;
        chunkNumber++;
        // Small delay between chunks to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // All done
        remainingSubscriptions = [];
      }
    }
    
    console.log(`\n✅ All processing complete!`);
    console.log(`📊 Final Summary:`);
    console.log(`   Total Processed: ${allResults.length}`);
    console.log(`   Successful: ${totalSuccessful}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${allResults.length > 0 ? ((totalSuccessful / allResults.length) * 100).toFixed(1) : 0}%`);
    
    const allErrors = allResults.filter(r => !r.success);
    if (allErrors.length > 0) {
      console.log(`\n❌ Errors (first 10):`);
      allErrors.slice(0, 10).forEach(error => {
        console.log(`   - ${error.email}: ${error.error}`);
      });
      if (allErrors.length > 10) {
        console.log(`   ... and ${allErrors.length - 10} more errors`);
      }
    }
    
    // Save combined results to a file
    const finalResult = {
      message: 'Bulk subscription processing complete (auto-chunked)',
      summary: {
        total: allResults.length,
        successful: totalSuccessful,
        failed: totalFailed,
        successRate: `${allResults.length > 0 ? ((totalSuccessful / allResults.length) * 100).toFixed(1) : 0}%`
      },
      results: allResults,
      errors: allErrors.slice(0, 20)
    };
    
    const resultsFile = filePath.replace('.csv', '_results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(finalResult, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Error processing file:', error.message);
    console.error(error.stack);
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node api/process-bulk-subscribe-file.js <csv-file>');
  console.error('\nExample:');
  console.error('  node api/process-bulk-subscribe-file.js bulk-subscribe.csv');
  console.error('\nCSV Format:');
  console.error('  email,brands');
  console.error('  user@example.com,thepicklereport');
  console.error('  user2@example.com,thepicklereport,themixedhome');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

processCSVFile(filePath);

