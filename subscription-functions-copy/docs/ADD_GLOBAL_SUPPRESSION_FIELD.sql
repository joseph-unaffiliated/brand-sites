-- Add globalSuppressionDate field to users table if it doesn't exist
-- Run this in BigQuery to ensure the field exists

ALTER TABLE `unaffiliated-data.analytics.users` 
ADD COLUMN IF NOT EXISTS globalSuppressionDate TIMESTAMP;

-- Verify the field was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM `unaffiliated-data.analytics.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'users' 
  AND column_name = 'globalSuppressionDate';

