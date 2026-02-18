-- Rename cio_event_type column to eventType in clicks table
-- Run this in BigQuery to rename the column

ALTER TABLE `unaffiliated-data.analytics.clicks` 
RENAME COLUMN cio_event_type TO eventType;

-- Verify the column was renamed
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM `unaffiliated-data.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'clicks' 
  AND column_name = 'eventType';

