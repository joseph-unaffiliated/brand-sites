-- Add UTMmedium and UTMcontent fields to clicks table
-- Run this in BigQuery to add the new UTM tracking fields

ALTER TABLE `unaffiliated-data.analytics.clicks` 
ADD COLUMN IF NOT EXISTS UTMmedium STRING,
ADD COLUMN IF NOT EXISTS UTMcontent STRING;

-- Verify the fields were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM `unaffiliated-data.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'clicks' 
  AND column_name IN ('UTMmedium', 'UTMcontent')
ORDER BY column_name;

