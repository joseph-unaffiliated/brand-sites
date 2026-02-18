/**
 * Automated Sync Scheduler and Monitor
 * Handles scheduled syncs and monitoring between BigQuery and Customer.io
 */

import { syncAllUsersToCustomerIO, validateDataConsistency as validateBQToCIO } from './bq-to-cio-sync.js';
import { syncAllPersonsToBigQuery, validateDataConsistency as validateCIOToBQ } from './cio-to-bq-sync-enhanced.js';

// Sync configuration
const SYNC_CONFIG = {
  // Sync intervals (in minutes)
  intervals: {
    bqToCIO: parseInt(process.env.BQ_TO_CIO_SYNC_INTERVAL) || 60, // Default: 1 hour
    cioToBQ: parseInt(process.env.CIO_TO_BQ_SYNC_INTERVAL) || 30, // Default: 30 minutes
    validation: parseInt(process.env.VALIDATION_INTERVAL) || 240   // Default: 4 hours
  },
  
  // Batch sizes
  batchSizes: {
    bqToCIO: parseInt(process.env.BQ_TO_CIO_BATCH_SIZE) || 100,
    cioToBQ: parseInt(process.env.CIO_TO_BQ_BATCH_SIZE) || 100
  },
  
  // Limits for full syncs
  limits: {
    bqToCIO: parseInt(process.env.BQ_TO_CIO_LIMIT) || 1000,
    cioToBQ: parseInt(process.env.CIO_TO_BQ_LIMIT) || 1000
  }
};

// Monitoring and alerting
const MONITORING_CONFIG = {
  // Alert thresholds
  thresholds: {
    errorRate: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 0.05, // 5%
    syncTime: parseInt(process.env.SYNC_TIME_THRESHOLD) || 300000,  // 5 minutes
    validationIssues: parseInt(process.env.VALIDATION_ISSUES_THRESHOLD) || 10
  },
  
  // Alert channels
  alerts: {
    webhook: process.env.ALERT_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    slack: process.env.SLACK_WEBHOOK_URL
  }
};

// Sync state tracking
let syncState = {
  lastSync: {
    bqToCIO: null,
    cioToBQ: null,
    validation: null
  },
  stats: {
    bqToCIO: { successful: 0, failed: 0, total: 0 },
    cioToBQ: { successful: 0, failed: 0, total: 0 },
    validation: { issues: 0, checked: 0 }
  },
  alerts: []
};

/**
 * Send alert notification
 */
async function sendAlert(level, message, details = {}) {
  const alert = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  syncState.alerts.push(alert);
  
  console.log(`🚨 ALERT [${level.toUpperCase()}]: ${message}`);
  
  // Send to webhook if configured
  if (MONITORING_CONFIG.alerts.webhook) {
    try {
      await fetch(MONITORING_CONFIG.alerts.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error.message);
    }
  }
  
  // Send to Slack if configured
  if (MONITORING_CONFIG.alerts.slack) {
    try {
      const slackMessage = {
        text: `🚨 *${level.toUpperCase()}*: ${message}`,
        attachments: [{
          color: level === 'error' ? 'danger' : level === 'warning' ? 'warning' : 'good',
          fields: Object.entries(details).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true
          }))
        }]
      };
      
      await fetch(MONITORING_CONFIG.alerts.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }
}

/**
 * Run BigQuery to Customer.io sync
 */
async function runBQToCIOSync() {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting scheduled BQ → CIO sync...');
    
    const result = await syncAllUsersToCustomerIO({
      batchSize: SYNC_CONFIG.batchSizes.bqToCIO,
      limit: SYNC_CONFIG.limits.bqToCIO
    });
    
    const duration = Date.now() - startTime;
    syncState.lastSync.bqToCIO = new Date().toISOString();
    
    // Update stats
    syncState.stats.bqToCIO.successful += result.successful || 0;
    syncState.stats.bqToCIO.failed += result.failed || 0;
    syncState.stats.bqToCIO.total += (result.successful || 0) + (result.failed || 0);
    
    // Check for alerts
    const errorRate = result.failed / ((result.successful || 0) + (result.failed || 0));
    
    if (errorRate > MONITORING_CONFIG.thresholds.errorRate) {
      await sendAlert('warning', 'High error rate in BQ → CIO sync', {
        errorRate: `${(errorRate * 100).toFixed(1)}%`,
        successful: result.successful,
        failed: result.failed
      });
    }
    
    if (duration > MONITORING_CONFIG.thresholds.syncTime) {
      await sendAlert('warning', 'Slow BQ → CIO sync', {
        duration: `${(duration / 1000).toFixed(1)}s`,
        recordsProcessed: (result.successful || 0) + (result.failed || 0)
      });
    }
    
    console.log(`✅ BQ → CIO sync completed in ${(duration / 1000).toFixed(1)}s`);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ BQ → CIO sync failed:', error.message);
    
    await sendAlert('error', 'BQ → CIO sync failed', {
      error: error.message,
      duration: `${(duration / 1000).toFixed(1)}s`
    });
    
    throw error;
  }
}

/**
 * Run Customer.io to BigQuery sync
 */
async function runCIOToBQSync() {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting scheduled CIO → BQ sync...');
    
    const result = await syncAllPersonsToBigQuery({
      batchSize: SYNC_CONFIG.batchSizes.cioToBQ,
      limit: SYNC_CONFIG.limits.cioToBQ
    });
    
    const duration = Date.now() - startTime;
    syncState.lastSync.cioToBQ = new Date().toISOString();
    
    // Update stats
    syncState.stats.cioToBQ.successful += result.successful || 0;
    syncState.stats.cioToBQ.failed += result.failed || 0;
    syncState.stats.cioToBQ.total += (result.successful || 0) + (result.failed || 0);
    
    // Check for alerts
    const errorRate = result.failed / ((result.successful || 0) + (result.failed || 0));
    
    if (errorRate > MONITORING_CONFIG.thresholds.errorRate) {
      await sendAlert('warning', 'High error rate in CIO → BQ sync', {
        errorRate: `${(errorRate * 100).toFixed(1)}%`,
        successful: result.successful,
        failed: result.failed
      });
    }
    
    if (duration > MONITORING_CONFIG.thresholds.syncTime) {
      await sendAlert('warning', 'Slow CIO → BQ sync', {
        duration: `${(duration / 1000).toFixed(1)}s`,
        recordsProcessed: (result.successful || 0) + (result.failed || 0)
      });
    }
    
    console.log(`✅ CIO → BQ sync completed in ${(duration / 1000).toFixed(1)}s`);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ CIO → BQ sync failed:', error.message);
    
    await sendAlert('error', 'CIO → BQ sync failed', {
      error: error.message,
      duration: `${(duration / 1000).toFixed(1)}s`
    });
    
    throw error;
  }
}

/**
 * Run data validation
 */
async function runValidation() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Starting scheduled data validation...');
    
    // Run both validations in parallel
    const [bqToCIOResult, cioToBQResult] = await Promise.allSettled([
      validateBQToCIO({ sampleSize: 100 }),
      validateCIOToBQ({ sampleSize: 100 })
    ]);
    
    const duration = Date.now() - startTime;
    syncState.lastSync.validation = new Date().toISOString();
    
    let totalIssues = 0;
    let totalChecked = 0;
    
    // Process BQ → CIO validation results
    if (bqToCIOResult.status === 'fulfilled') {
      totalIssues += bqToCIOResult.value.issues?.length || 0;
      totalChecked += bqToCIOResult.value.totalChecked || 0;
    }
    
    // Process CIO → BQ validation results
    if (cioToBQResult.status === 'fulfilled') {
      totalIssues += cioToBQResult.value.issues?.length || 0;
      totalChecked += cioToBQResult.value.totalChecked || 0;
    }
    
    syncState.stats.validation.issues += totalIssues;
    syncState.stats.validation.checked += totalChecked;
    
    // Check for alerts
    if (totalIssues > MONITORING_CONFIG.thresholds.validationIssues) {
      await sendAlert('warning', 'High number of validation issues', {
        issues: totalIssues,
        checked: totalChecked,
        issueRate: `${((totalIssues / totalChecked) * 100).toFixed(1)}%`
      });
    }
    
    console.log(`✅ Validation completed in ${(duration / 1000).toFixed(1)}s: ${totalIssues} issues found`);
    return { issues: totalIssues, checked: totalChecked };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Validation failed:', error.message);
    
    await sendAlert('error', 'Data validation failed', {
      error: error.message,
      duration: `${(duration / 1000).toFixed(1)}s`
    });
    
    throw error;
  }
}

/**
 * Get sync status and health
 */
function getSyncStatus() {
  const now = new Date();
  
  return {
    status: 'healthy',
    lastSync: syncState.lastSync,
    stats: syncState.stats,
    config: SYNC_CONFIG,
    health: {
      bqToCIO: {
        lastRun: syncState.lastSync.bqToCIO,
        nextRun: syncState.lastSync.bqToCIO ? 
          new Date(new Date(syncState.lastSync.bqToCIO).getTime() + SYNC_CONFIG.intervals.bqToCIO * 60000) : 
          null,
        successRate: syncState.stats.bqToCIO.total > 0 ? 
          (syncState.stats.bqToCIO.successful / syncState.stats.bqToCIO.total) : 0
      },
      cioToBQ: {
        lastRun: syncState.lastSync.cioToBQ,
        nextRun: syncState.lastSync.cioToBQ ? 
          new Date(new Date(syncState.lastSync.cioToBQ).getTime() + SYNC_CONFIG.intervals.cioToBQ * 60000) : 
          null,
        successRate: syncState.stats.cioToBQ.total > 0 ? 
          (syncState.stats.cioToBQ.successful / syncState.stats.cioToBQ.total) : 0
      },
      validation: {
        lastRun: syncState.lastSync.validation,
        nextRun: syncState.lastSync.validation ? 
          new Date(new Date(syncState.lastSync.validation).getTime() + SYNC_CONFIG.intervals.validation * 60000) : 
          null,
        issueRate: syncState.stats.validation.checked > 0 ? 
          (syncState.stats.validation.issues / syncState.stats.validation.checked) : 0
      }
    },
    recentAlerts: syncState.alerts.slice(-10)
  };
}

/**
 * Manual sync trigger endpoint
 */
export async function triggerManualSync(req, res) {
  try {
    const { type, dryRun = false } = req.query;
    
    let result;
    
    switch (type) {
      case 'bq-to-cio':
        result = await syncAllUsersToCustomerIO({ 
          batchSize: SYNC_CONFIG.batchSizes.bqToCIO,
          limit: SYNC_CONFIG.limits.bqToCIO,
          dryRun: dryRun === 'true'
        });
        break;
        
      case 'cio-to-bq':
        result = await syncAllPersonsToBigQuery({ 
          batchSize: SYNC_CONFIG.batchSizes.cioToBQ,
          limit: SYNC_CONFIG.limits.cioToBQ,
          dryRun: dryRun === 'true'
        });
        break;
        
      case 'validation':
        result = await runValidation();
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid sync type. Use: bq-to-cio, cio-to-bq, or validation' });
    }
    
    res.status(200).json({
      success: true,
      type,
      dryRun: dryRun === 'true',
      result
    });
    
  } catch (error) {
    console.error('❌ Manual sync failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Status endpoint
 */
export async function getStatus(req, res) {
  try {
    const status = getSyncStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Export functions for use in other scripts
export {
  runBQToCIOSync,
  runCIOToBQSync,
  runValidation,
  getSyncStatus,
  sendAlert,
  triggerManualSync,
  getStatus
};

// CLI interface for manual runs
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'sync-bq-to-cio':
      await runBQToCIOSync();
      break;
    case 'sync-cio-to-bq':
      await runCIOToBQSync();
      break;
    case 'validate':
      await runValidation();
      break;
    case 'status':
      console.log(JSON.stringify(getSyncStatus(), null, 2));
      break;
    default:
      console.log('Usage:');
      console.log('  node sync-scheduler.js sync-bq-to-cio');
      console.log('  node sync-scheduler.js sync-cio-to-bq');
      console.log('  node sync-scheduler.js validate');
      console.log('  node sync-scheduler.js status');
  }
}
