/**
 * Sync Scheduler API Endpoint
 * Handles sync status and manual trigger requests
 */

import { triggerManualSync, getStatus } from './sync-scheduler.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Route based on the request
  if (req.url.includes('/sync-status')) {
    return await getStatus(req, res);
  } else if (req.url.includes('/trigger-sync')) {
    return await triggerManualSync(req, res);
  } else {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
}
