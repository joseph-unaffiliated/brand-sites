# Retention.com Batch Suppression Setup Guide

This guide explains how to set up the scheduled batch suppression job that sends new subscriber emails to Retention.com twice daily.

## Overview

The batch suppression endpoint queries BigQuery for users who subscribed since the last sync and sends their emails to Retention.com's suppression list. This avoids hitting the 3 API calls/day rate limit by batching all new subscribers into a single call.

## Prerequisites

- Retention.com API credentials (`RETENTION_API_KEY` and `RETENTION_API_ID`)
- BigQuery access configured
- Vercel project deployed

## Step 1: Configure Environment Variables

Add these environment variables in your Vercel project settings:

### Required Variables (if not already set):
- `RETENTION_API_KEY` - Your Retention.com API key
- `RETENTION_API_ID` - Your Retention.com API ID
- `GCP_PROJECT_ID` - Your Google Cloud Project ID
- `GCP_SERVICE_ACCOUNT_KEY` - Your BigQuery service account JSON key

### Optional Variables:
- `RETENTION_LAST_SYNC_TIMESTAMP` - Timestamp (milliseconds) of last successful sync. If not set, defaults to 24 hours ago.
- `RETENTION_BATCH_SECRET` - Secret token for endpoint authentication (recommended for production)

## Step 2: Configure Cron Job in Vercel

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/retention-batch-suppression",
      "schedule": "0 9,21 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 9,21 * * *` means: Run at 9:00 AM and 9:00 PM UTC every day
- Format: `minute hour day month weekday`
- To change times, modify the schedule (times are in UTC)

**Common Schedule Examples:**
- `0 12,0 * * *` - Noon and midnight UTC
- `0 8,20 * * *` - 8 AM and 8 PM UTC
- `0 */12 * * *` - Every 12 hours (at :00 minutes)

## Step 3: Deploy to Vercel

After updating `vercel.json`, deploy to Vercel:

```bash
git add vercel.json
git commit -m "Add Retention.com batch suppression cron job"
git push origin main
```

Vercel will automatically detect the cron job configuration and set it up.

## Step 4: Verify Cron Job Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. You should see the `retention-batch-suppression` job listed
4. Check that it's scheduled correctly (9 AM and 9 PM UTC)

## Step 5: Test the Endpoint Manually

Before the cron job runs, test the endpoint manually:

```bash
# Without secret (if RETENTION_BATCH_SECRET is not set)
curl https://your-project.vercel.app/api/retention-batch-suppression

# With secret (if RETENTION_BATCH_SECRET is set)
curl "https://your-project.vercel.app/api/retention-batch-suppression?secret=your-secret"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully sent 15 emails to Retention.com",
  "count": 15,
  "lastSyncTimestamp": 1704873600000,
  "newLastSyncTimestamp": 1704959999000,
  "emails": ["user1@example.com", "user2@example.com", ...]
}
```

## Step 6: Update Last Sync Timestamp (Optional)

The endpoint returns `newLastSyncTimestamp` in the response. You have two options:

### Option A: Manual Update (Simple)
After each successful run, manually update the `RETENTION_LAST_SYNC_TIMESTAMP` environment variable in Vercel with the `newLastSyncTimestamp` value from the response.

### Option B: Automatic Update (Advanced)
Modify the endpoint to store the timestamp in a metadata table in BigQuery or use Vercel KV to persist it automatically.

## How It Works

1. **Cron Job Triggers**: Vercel calls the endpoint at scheduled times (9 AM and 9 PM UTC)
2. **Query BigQuery**: Endpoint queries for users with subscription timestamps after `RETENTION_LAST_SYNC_TIMESTAMP`
3. **Format CSV**: Emails are formatted as CSV with header row
4. **Send to Retention.com**: Single API call sends all new subscriber emails
5. **Return Results**: Endpoint returns count and new timestamp for next sync

## Monitoring

### Check Cron Job Logs
1. Go to Vercel dashboard → **Deployments**
2. Click on a deployment
3. Go to **Functions** tab
4. Find `retention-batch-suppression` function
5. View logs to see execution history

### Monitor Success/Failure
The endpoint logs:
- Number of emails found
- API call success/failure
- Any errors during processing

## Troubleshooting

### Cron Job Not Running
- Check Vercel dashboard → Settings → Cron Jobs
- Verify the schedule syntax is correct
- Ensure the endpoint path matches exactly

### No Emails Found
- Check `RETENTION_LAST_SYNC_TIMESTAMP` - if it's too recent, no new subscribers will be found
- Verify BigQuery query is working: check logs for query results
- Ensure subscriptions have `subscribed_timestamp` values

### API Rate Limit Exceeded
- The endpoint should only make 1 API call per run (batches all emails)
- If you're hitting limits, check that you're not calling it manually too often
- Verify the cron job is only running twice daily

### Authentication Errors
- Verify `RETENTION_API_KEY` and `RETENTION_API_ID` are correct
- Check that `RETENTION_BATCH_SECRET` matches if using authentication

## Rate Limits

- **Retention.com API**: 3 calls per day
- **This setup**: 2 calls per day (via cron job)
- **Remaining**: 1 call per day for manual/ad-hoc use

## Next Steps

1. Monitor the first few runs to ensure it's working correctly
2. Set up alerts if the endpoint fails (optional)
3. Consider storing `lastSyncTimestamp` automatically for better reliability

