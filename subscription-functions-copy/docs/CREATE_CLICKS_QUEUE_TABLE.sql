-- Create clicks_queue staging table for batch processing
-- This table queues email events from Customer.io webhooks to avoid "too many DML statements" errors
-- Run this in BigQuery to create the queue table

CREATE TABLE IF NOT EXISTS `unaffiliated-data.analytics.clicks_queue` (
  clickID STRING NOT NULL,
  userID STRING,
  email STRING,
  emailHash STRING,
  campaignID STRING,
  articleID STRING,
  brand STRING,
  url STRING,
  dateISO STRING,  -- ISO 8601 timestamp string, will be parsed in batch processor
  CPCrevenue FLOAT64,
  sponsorID STRING,
  locationIP STRING,
  UTMsource STRING,
  UTMcampaign STRING,
  UTMmedium STRING,
  UTMcontent STRING,
  userAgent STRING,
  cfBotScore INTEGER,
  validationStatus STRING,
  companyName STRING,
  companyDomain STRING,
  companySize INTEGER,
  industry STRING,
  source STRING,
  eventType STRING,
  cio_campaign_name STRING,
  cio_segment_id STRING,
  cio_delivery_status STRING,
  cio_engagement_score FLOAT64,
  prefetched BOOL,
  queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(queued_at)
CLUSTER BY clickID;

-- Create index on clickID for faster lookups during batch processing
-- Note: BigQuery doesn't support explicit indexes, but clustering helps

-- Verify the table was created
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM `unaffiliated-data.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'clicks_queue'
ORDER BY ordinal_position;
