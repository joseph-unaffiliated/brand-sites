/**
 * One-time script to send all emails from Users table to Retention.com suppression list
 * 
 * Usage:
 *   node send-all-users-to-retention-suppression.js
 * 
 * Requires environment variables:
 *   - GCP_PROJECT_ID
 *   - GCP_SERVICE_ACCOUNT_KEY (JSON string)
 *   - RETENTION_API_ID
 *   - RETENTION_API_KEY
 */

import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import FormData from 'form-data';

// Note: Set environment variables before running:
//   export GCP_PROJECT_ID="your-project-id"
//   export GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
//   export RETENTION_API_ID="your-api-id"
//   export RETENTION_API_KEY="your-api-key"

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

const httpClient = axios.create({
  timeout: 60000, // 60 second timeout for large batches
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get all emails from Users table
 */
async function getAllUserEmails() {
  try {
    console.log('🔍 Querying all emails from Users table...');
    
    const query = `
      SELECT DISTINCT email
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE email IS NOT NULL
        AND email != ''
      ORDER BY email
    `;
    
    const [rows] = await bq.query({ query });
    
    const emails = rows
      .map(row => row.email?.toLowerCase().trim())
      .filter(email => email && email.includes('@')); // Basic email validation
    
    console.log(`📊 Found ${emails.length} unique emails`);
    
    return emails;
  } catch (error) {
    console.error('❌ Error querying users:', error.message);
    throw error;
  }
}

/**
 * Send emails to Retention.com suppression list
 */
async function sendToRetentionSuppression(emails) {
  if (!process.env.RETENTION_API_KEY) {
    throw new Error('RETENTION_API_KEY environment variable is required');
  }
  if (!process.env.RETENTION_API_ID) {
    throw new Error('RETENTION_API_ID environment variable is required');
  }
  
  if (emails.length === 0) {
    console.log('ℹ️ No emails to send');
    return { success: false, reason: 'no_emails' };
  }
  
  try {
    // Format as CSV: header row "email" followed by email addresses, one per line
    const csvContent = `email\n${emails.join('\n')}`;
    
    // Create FormData for file upload
    const formData = new FormData();
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    formData.append('file', csvBuffer, {
      filename: 'suppression.csv',
      contentType: 'text/csv'
    });
    
    console.log(`📤 Sending ${emails.length} emails to Retention.com suppression list...`);
    console.log(`📦 CSV size: ${(csvBuffer.length / 1024).toFixed(2)} KB`);
    
    const response = await httpClient.post(
      'https://api.retention.com/api/v1/suppression',
      formData,
      {
        headers: {
          'api-id': process.env.RETENTION_API_ID,
          'api-key': process.env.RETENTION_API_KEY,
          ...formData.getHeaders() // Adds Content-Type with boundary for multipart/form-data
        },
        timeout: 60000
      }
    );
    
    console.log(`✅ Successfully sent ${emails.length} emails to Retention.com suppression list`);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    return { success: true, count: emails.length, response: response.data };
  } catch (error) {
    console.error('❌ Failed to send emails to Retention.com suppression:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 ONE-TIME SCRIPT: Send all users to Retention.com suppression list');
  console.log('⚠️  This will send ALL emails from the Users table to Retention.com');
  console.log('');
  
  // Validate environment variables
  if (!process.env.GCP_PROJECT_ID) {
    console.error('❌ GCP_PROJECT_ID environment variable is required');
    process.exit(1);
  }
  
  if (!process.env.RETENTION_API_ID || !process.env.RETENTION_API_KEY) {
    console.error('❌ RETENTION_API_ID and RETENTION_API_KEY environment variables are required');
    process.exit(1);
  }
  
  try {
    // Get all emails
    const emails = await getAllUserEmails();
    
    if (emails.length === 0) {
      console.log('ℹ️ No emails found in Users table');
      process.exit(0);
    }
    
    // Confirm before sending
    console.log('');
    console.log(`📧 Ready to send ${emails.length} emails to Retention.com suppression list`);
    console.log('📝 First 10 emails:');
    emails.slice(0, 10).forEach((email, i) => {
      console.log(`   ${i + 1}. ${email}`);
    });
    if (emails.length > 10) {
      console.log(`   ... and ${emails.length - 10} more`);
    }
    console.log('');
    console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Send to Retention.com
    const result = await sendToRetentionSuppression(emails);
    
    if (result.success) {
      console.log('');
      console.log('✅ SUCCESS! All emails have been sent to Retention.com suppression list');
      console.log(`📊 Total emails sent: ${result.count}`);
    } else {
      console.error('❌ Failed to send emails:', result.reason);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

