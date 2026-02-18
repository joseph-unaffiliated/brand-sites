-- Query to verify Customer.io email opens are being saved to clicks table
-- Run this in BigQuery to check recent email open events

-- Recent email opens from Customer.io
SELECT 
  clickID,
  userID,
  email,
  brand,
  eventType,
  date,
  prefetched,
  url,
  UTMsource,
  UTMcampaign,
  UTMmedium,
  UTMcontent,
  cio_campaign_name,
  cio_segment_id,
  cio_last_synced_at,
  source,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), date, MINUTE) AS minutes_ago
FROM `unaffiliated-data.analytics.clicks`
WHERE source = 'customer_io'
  AND eventType = 'opened'
ORDER BY date DESC
LIMIT 50;

-- Summary statistics
SELECT 
  COUNT(*) AS total_opens,
  COUNT(DISTINCT userID) AS unique_users,
  COUNT(DISTINCT email) AS unique_emails,
  COUNTIF(prefetched = true) AS prefetched_opens,
  COUNTIF(prefetched = false) AS non_prefetched_opens,
  COUNTIF(prefetched IS NULL) AS unknown_prefetched,
  MIN(date) AS earliest_open,
  MAX(date) AS latest_open
FROM `unaffiliated-data.analytics.clicks`
WHERE source = 'customer_io'
  AND eventType = 'opened'
  AND date >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY);

-- Check for recent opens (last hour)
SELECT 
  clickID,
  email,
  eventType,
  date,
  prefetched,
  TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), date, MINUTE) AS minutes_ago
FROM `unaffiliated-data.analytics.clicks`
WHERE source = 'customer_io'
  AND eventType = 'opened'
  AND date >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
ORDER BY date DESC;

