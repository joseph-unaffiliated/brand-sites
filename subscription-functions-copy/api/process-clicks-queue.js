/**
 * Batch Processor for Clicks Queue
 * Processes queued email events from clicks_queue table to clicks table
 * This endpoint is called by a Vercel cron job to avoid "too many DML statements" errors
 */

import { processClicksQueue } from './cio-to-bq-sync-enhanced.js';

export default async function handler(req, res) {
  // Allow both GET (for cron) and POST (for manual triggers)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }
  
  console.log('🔄 Clicks queue batch processor started');
  
  try {
    const result = await processClicksQueue();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Processed ${result.processed} events from queue`,
        processed: result.processed
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Unknown error processing queue'
      });
    }
  } catch (error) {
    console.error('❌ Batch processor error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
