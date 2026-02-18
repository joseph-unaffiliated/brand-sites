-- Add prefetched field to clicks table
-- Run this in BigQuery to add the prefetched boolean field

ALTER TABLE `unaffiliated-data.analytics.clicks` 
ADD COLUMN IF NOT EXISTS prefetched BOOL;

-- Verify the field was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM `unaffiliated-data.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'clicks' 
  AND column_name = 'prefetched';

