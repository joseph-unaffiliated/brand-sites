-- Create validation_retry_queue table for emails that timed out during Email Oversight validation
-- Processed by cron /api/process-validation-retry; invalid emails get BQ update, unsubscribe all, global suppression
-- Run this in BigQuery to create the queue table

CREATE TABLE IF NOT EXISTS `unaffiliated-data.analytics.validation_retry_queue` (
  email STRING NOT NULL,
  userID STRING,
  source STRING,
  queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(queued_at)
CLUSTER BY email;

-- Verify the table was created
SELECT
  column_name,
  data_type,
  is_nullable
FROM `unaffiliated-data.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'validation_retry_queue'
ORDER BY ordinal_position;
