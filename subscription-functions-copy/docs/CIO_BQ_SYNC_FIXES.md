# Customer.io to BigQuery Sync - Fixes and Improvements

## Overview

This document outlines the fixes made to ensure click and campaign data from Customer.io are properly synced to BigQuery.

## Issues Fixed

### 1. **Duplicate Prevention in Clicks Table**
   - **Problem**: `syncEmailEventToClicks` was using `INSERT` which could create duplicate records if the same event was processed twice
   - **Fix**: Changed to `MERGE` statement that uses `clickID` (from Customer.io `event_id`) as the unique key
   - **Result**: Duplicate events are now handled gracefully - existing records are updated instead of creating duplicates

### 2. **Webhook Payload Structure Handling**
   - **Problem**: Code expected flat payload structure, but Customer.io sends nested structure
   - **Fix**: Updated `syncEmailEventToClicks` to handle both:
     - Nested structure: `{ event_type, data: { person, campaign, link, device } }`
     - Flat structure: `{ type, person_id, campaign_id, email, ... }` (legacy)
   - **Result**: Webhook handler now correctly extracts data from Customer.io's actual webhook format

### 3. **Unique clickID Generation**
   - **Problem**: `clickID` was generated using `Date.now()` which could collide if multiple events happen in same millisecond
   - **Fix**: Now uses Customer.io's `event_id` if available, or generates deterministic ID from person_id + campaign_id + timestamp
   - **Result**: Each event has a truly unique identifier

### 4. **Campaign Performance Sync**
   - **Problem**: `syncCampaignToCampaigns` existed but:
     - Used string interpolation (SQL injection risk)
     - Was never called from webhook handler
     - Didn't handle all campaign fields from schema
   - **Fix**:
     - Converted to parameterized queries with proper types
     - Added campaign event handling in webhook handler
     - Added `aggregateCampaignPerformanceFromClicks` function to aggregate performance from clicks table
     - Added support for all campaign schema fields (complaintVolume, subscribesVolume, date)
   - **Result**: Campaign performance data can now be synced via webhooks or aggregated from clicks table

### 5. **Error Handling and Logging**
   - **Problem**: Limited error context made debugging difficult
   - **Fix**: Added comprehensive logging with event IDs, event types, and full error context
   - **Result**: Easier to debug issues when they occur

## Schema Mapping

### Clicks Table Fields Mapped

| Customer.io Field | BigQuery Field | Notes |
|-----------------|----------------|-------|
| `event_id` | `clickID` | Unique identifier |
| `person.id` | `userID` | Person identifier |
| `person.email` | `email` | Email address |
| `campaign.id` | `campaignID` | Campaign identifier |
| `campaign.name` | `cio_campaign_name` | Campaign name |
| `campaign.segment_id` | `cio_segment_id` | Segment ID |
| `link.url` | `url` | Clicked URL (for click events) |
| `device.user_agent` | `userAgent` | User agent string |
| `device.ip` | `locationIP` | IP address |
| `event_type` | `cio_event_type` | Mapped: sent, opened, clicked, bounced, unsubscribed |
| `timestamp` | `date` | Event timestamp |

### Campaigns Table Fields Mapped

| Customer.io Field | BigQuery Field | Notes |
|-----------------|----------------|-------|
| `campaign.id` | `campaignID` | Unique identifier |
| `sent_count` | `sendVolume` | Number of emails sent |
| `opened_count` | `openVolume` | Number of opens |
| `clicked_count` | `clickVolume` | Number of clicks |
| `unsubscribed_count` | `unsubVolume` | Number of unsubscribes |
| `bounced_count` | `bounceVolume` | Number of bounces |
| `campaign.name` | `cio_campaign_name` | Campaign name |
| `campaign.segment_id` | `cio_segment_id` | Segment ID |
| Calculated | `cio_delivery_rate` | (sent - bounced) / sent |
| Calculated | `cio_open_rate` | opened / sent |
| Calculated | `cio_click_rate` | clicked / sent |
| Calculated | `cio_unsubscribe_rate` | unsubscribed / sent |
| Calculated | `cio_bounce_rate` | bounced / sent |

## Webhook Event Types Supported

### Email Events (→ clicks table)
- `email.sent` → `cio_event_type: 'sent'`
- `email.opened` → `cio_event_type: 'opened'`
- `email.clicked` → `cio_event_type: 'clicked'`
- `email.bounced` → `cio_event_type: 'bounced'`
- `email.unsubscribed` → `cio_event_type: 'unsubscribed'`
- `email.delivered` → `cio_event_type: 'delivered'`

### Person Events (→ users table)
- `person.created` → Creates new user record
- `person.updated` → Updates existing user record

### Campaign Events (→ campaigns table)
- `campaign.updated` → Updates campaign performance
- `campaign.completed` → Final campaign performance sync

## Next Steps

### 1. Configure Customer.io Webhooks

You need to set up webhooks in Customer.io to send events to your endpoint:

1. Go to Customer.io Settings → Integrations → Webhooks
2. Add webhook with URL: `https://magic.unaffiliated.co/api/cio-webhook`
3. Select events to send:
   - ✅ `email.sent`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.unsubscribed`
   - ✅ `email.delivered`
   - ✅ `person.created`
   - ✅ `person.updated`
   - ✅ `campaign.updated` (if available)
   - ✅ `campaign.completed` (if available)

### 2. Test Webhook Integration

After deploying, test with a real campaign:

1. Send a test email campaign
2. Have someone open and click the email
3. Check BigQuery `clicks` table for new records
4. Verify `cio_event_type` values are correct
5. Check that `clickID` is unique for each event

### 3. Set Up Campaign Performance Aggregation (Optional)

If Customer.io doesn't send campaign performance webhooks, you can aggregate from clicks table:

```javascript
// This can be called periodically (e.g., daily cron job)
import { aggregateCampaignPerformanceFromClicks } from './api/cio-to-bq-sync-enhanced.js';

// Aggregate for a specific campaign
await aggregateCampaignPerformanceFromClicks('campaign_id_123');
```

Or create a scheduled job to aggregate all campaigns:

```sql
-- BigQuery query to get all unique campaign IDs from clicks
SELECT DISTINCT campaignID 
FROM `unaffiliated-data.analytics.clicks`
WHERE source = 'customer_io'
  AND campaignID IS NOT NULL
```

### 4. Monitor and Validate

- Check Vercel logs for webhook processing
- Monitor BigQuery for new click records
- Validate that campaign performance data is being updated
- Set up alerts for webhook failures

## Troubleshooting

### No clicks appearing in BigQuery

1. **Check webhook is configured**: Verify webhook URL in Customer.io dashboard
2. **Check Vercel logs**: Look for webhook processing errors
3. **Verify event types**: Ensure Customer.io is sending the events you selected
4. **Check BigQuery permissions**: Verify service account has write access

### Duplicate clicks

- This should no longer happen with MERGE statement
- If duplicates appear, check that `clickID` is being set correctly from `event_id`

### Campaign performance not updating

1. **Check if Customer.io sends campaign webhooks**: May need to use aggregation function instead
2. **Verify campaign IDs match**: Ensure `campaignID` in clicks table matches campaigns table
3. **Run aggregation function**: Use `aggregateCampaignPerformanceFromClicks` to sync manually

### Webhook errors

- Check webhook signature verification (if enabled)
- Verify webhook payload structure matches expected format
- Check BigQuery query errors in logs
- Ensure all required environment variables are set

## API Functions Available

### `syncEmailEventToClicks(eventData)`
Syncs a single email event to clicks table. Handles both nested and flat webhook structures.

### `syncCampaignToCampaigns(campaignData)`
Syncs campaign performance data to campaigns table. Can be called with webhook data or API data.

### `aggregateCampaignPerformanceFromClicks(campaignId)`
Aggregates campaign performance metrics from clicks table and syncs to campaigns table.

### `handleCustomerIOWebhook(req, res)`
Main webhook handler that routes events to appropriate sync functions.

## Environment Variables Required

- `GCP_PROJECT_ID` - BigQuery project ID
- `GCP_SERVICE_ACCOUNT_KEY` - Service account JSON key
- `CIO_SITE_ID` - Customer.io site ID (for API calls)
- `CIO_API_KEY` - Customer.io API key (for API calls)
- `CIO_WEBHOOK_SECRET` - Optional, for webhook signature verification
- `EMAIL_SALT` - Optional, for email hashing

## Deployment

After making these changes:

1. Commit and push to GitHub
2. Vercel will automatically deploy
3. Configure Customer.io webhooks to point to deployed endpoint
4. Test with a real campaign
5. Monitor logs and BigQuery for data flow

