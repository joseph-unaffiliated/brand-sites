/**
 * Customer.io Webhook Handler
 * Handles real-time updates from Customer.io to sync to BigQuery
 */

import { handleCustomerIOWebhook } from './cio-to-bq-sync-enhanced.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  
  // Verify webhook signature (optional but recommended)
  const signature = req.headers['x-customerio-signature'];
  if (signature && !verifyWebhookSignature(req.body, signature)) {
    console.error('❌ Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }
  
  // Handle the webhook
  await handleCustomerIOWebhook(req, res);
}

/**
 * Verify Customer.io webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  // Customer.io webhook signature verification
  // This is a placeholder - implement based on Customer.io's signature method
  const crypto = require('crypto');
  const secret = process.env.CIO_WEBHOOK_SECRET;
  
  if (!secret) {
    console.warn('⚠️ No webhook secret configured, skipping signature verification');
    return true;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}
