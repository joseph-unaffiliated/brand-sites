# Clicks Queue Batching Implementation

## Overview

This document describes the batching system implemented to prevent "too many DML statements" errors when processing Customer.io webhook events.

## Problem

BigQuery has a limit of 20 concurrent DML statements (MERGE, INSERT, UPDATE, DELETE) per table. When Customer.io sends many webhook events simultaneously (e.g., during large email sends), multiple serverless function instances process them concurrently, each executing a MERGE statement. This exceeds the 20 concurrent DML limit and causes errors:

```
Resources exceeded during query execution: Too many DML statements outstanding against table unaffiliated-data:analytics.clicks, limit is 20.
```

## Solution

Instead of directly MERGEing events into the `clicks` table, events are now:

1. **Queued**: Webhook events are inserted into a staging table (`clicks_queue`)
2. **Batched**: A cron job processes queued events in batches (up to 1000 at a time)
3. **Merged**: All queued events are processed in a single MERGE statement

This reduces concurrent DML statements from potentially hundreds to just 1-2 per minute.

## Architecture

### Components

1. **`queueEmailEventToClicks()`** - Queues events to `clicks_queue` table
2. **`processClicksQueue()`** - Processes queued events in batch
3. **`/api/process-clicks-queue`** - Vercel endpoint called by cron job
4. **`clicks_queue` table** - BigQuery staging table

### Flow

```
Customer.io Webhook
    ↓
queueEmailEventToClicks()
    ↓
INSERT INTO clicks_queue (fast, no MERGE)
    ↓
[Queue accumulates events]
    ↓
Cron Job (every 2 minutes)
    ↓
processClicksQueue()
    ↓
Single MERGE statement (processes up to 1000 events)
    ↓
DELETE from clicks_queue
    ↓
Events now in clicks table
```

## Setup

### 1. Create the Queue Table

Run the SQL in `docs/CREATE_CLICKS_QUEUE_TABLE.sql` in BigQuery:

```sql
CREATE TABLE IF NOT EXISTS `unaffiliated-data.analytics.clicks_queue` (
  -- (see SQL file for full schema)
)
PARTITION BY DATE(queued_at)
CLUSTER BY clickID;
```

### 2. Deploy Code Changes

The following files have been updated:
- `api/cio-to-bq-sync-enhanced.js` - Modified to queue events instead of direct MERGE
- `api/process-clicks-queue.js` - New batch processor endpoint
- `vercel.json` - Added cron job (runs every 2 minutes)

### 3. Verify Cron Job

After deployment, verify the cron job is active in Vercel:
- Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
- You should see `/api/process-clicks-queue` running every 2 minutes

## Performance Characteristics

### Latency
- **Before**: Events appeared in `clicks` table immediately (real-time)
- **After**: Events appear within 2-4 minutes (near real-time)

This is acceptable for analytics use cases where 2-3 minute delay is fine.

### Throughput
- **Before**: Limited by 20 concurrent DML statements
- **After**: Can handle thousands of events per minute (batched into single MERGE)

### Cost
- **No additional vendors**: Uses existing BigQuery and Vercel infrastructure
- **Minimal storage cost**: Queue table is small and events are deleted after processing
- **Same query cost**: Batch MERGE costs similar to individual MERGEs

## Monitoring

### Check Queue Size

```sql
SELECT COUNT(*) as queued_events
FROM `unaffiliated-data.analytics.clicks_queue`;
```

If this number grows consistently, the batch processor may not be keeping up. Consider:
- Reducing cron interval (e.g., every 1 minute instead of 2)
- Increasing batch size (currently 1000 events per batch)

### Check Processing Logs

Monitor Vercel function logs for `/api/process-clicks-queue`:
- Look for "✅ Successfully processed X events from queue"
- Watch for errors in batch processing

### Manual Trigger

You can manually trigger batch processing:

```bash
curl -X POST https://subscription-functions.vercel.app/api/process-clicks-queue
```

## Troubleshooting

### Queue Not Processing

1. Check cron job is active in Vercel dashboard
2. Check function logs for errors
3. Verify `clicks_queue` table exists and has correct schema
4. Manually trigger batch processor to test

### Events Stuck in Queue

1. Check for errors in batch processor logs
2. Verify BigQuery permissions for service account
3. Check if MERGE query is failing (may need to adjust batch size)

### High Queue Size

If queue consistently has > 1000 events:
- Reduce cron interval (e.g., every 1 minute)
- Increase batch size limit (currently 1000, can be increased)
- Check if batch processor is timing out (Vercel has 60s limit)

## Rollback

If you need to rollback to direct MERGE:

1. Change `queueEmailEventToClicks` back to `syncEmailEventToClicks` (direct MERGE)
2. Remove cron job from `vercel.json`
3. Redeploy

The old function `syncEmailEventToClicks` is still exported for backward compatibility.
