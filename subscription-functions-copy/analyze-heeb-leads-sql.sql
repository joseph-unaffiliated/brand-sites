-- Analyze Heeb Leads from CSV
-- This query checks BigQuery for all emails and their status

-- First, create a temporary table with the emails from CSV
-- (You'll need to replace this with actual emails from your CSV)

WITH csv_emails AS (
  -- This is a sample - replace with your actual emails
  SELECT email FROM UNNEST([
    '00avery.13@gmail.com',
    '11539357a@gmail.com',
    '188.steve@gmail.com'
    -- Add all emails from CSV here
  ]) AS email
),
user_data AS (
  SELECT 
    u.email,
    u.userID,
    u.leadData,
    u.subscriptions,
    u.unsubscribed_brands,
    u.emailValidationStatus,
    u.emailValidationReason,
    -- Check if brand_interest matches
    JSON_EXTRACT_SCALAR(u.leadData, '$.brand_interest') AS brand_interest,
    -- Check if has subscriptions
    CASE 
      WHEN u.subscriptions IS NULL THEN false
      WHEN JSON_EXTRACT(u.subscriptions, '$') = '{}' THEN false
      ELSE true
    END AS has_subscriptions,
    -- Check if unsubscribed from heebnewsletters
    CASE
      WHEN u.unsubscribed_brands IS NULL THEN false
      WHEN JSON_EXTRACT_SCALAR(u.unsubscribed_brands, '$.heebnewsletters') IS NOT NULL THEN true
      ELSE false
    END AS is_unsubscribed
  FROM `analytics.users` u
  INNER JOIN csv_emails ce ON LOWER(u.email) = LOWER(ce.email)
)
SELECT 
  email,
  userID,
  brand_interest,
  emailValidationStatus,
  emailValidationReason,
  has_subscriptions,
  is_unsubscribed,
  CASE
    WHEN brand_interest = 'heebnewsletters' 
      AND NOT has_subscriptions 
      AND NOT is_unsubscribed 
      AND (emailValidationStatus IN ('Valid', 'Verified', 'no_api_key', 'validation_error') OR emailValidationStatus IS NULL)
    THEN 'QUALIFIES_AS_LEAD'
    WHEN brand_interest = 'heebnewsletters' AND has_subscriptions
    THEN 'ALREADY_SUBSCRIBED'
    WHEN brand_interest = 'heebnewsletters' AND is_unsubscribed
    THEN 'UNSUBSCRIBED'
    WHEN brand_interest != 'heebnewsletters' OR brand_interest IS NULL
    THEN 'WRONG_BRAND_INTEREST'
    WHEN emailValidationStatus NOT IN ('Valid', 'Verified', 'no_api_key', 'validation_error') AND emailValidationStatus IS NOT NULL
    THEN 'FAILED_VALIDATION'
    ELSE 'UNKNOWN'
  END AS status,
  CASE
    WHEN brand_interest = 'heebnewsletters' 
      AND NOT has_subscriptions 
      AND NOT is_unsubscribed 
      AND (emailValidationStatus IN ('Valid', 'Verified', 'no_api_key', 'validation_error') OR emailValidationStatus IS NULL)
    THEN 'Should have lead tag in Customer.io'
    WHEN brand_interest = 'heebnewsletters' AND has_subscriptions
    THEN 'Has subscriptions, cannot be lead'
    WHEN brand_interest = 'heebnewsletters' AND is_unsubscribed
    THEN 'Unsubscribed from heebnewsletters'
    WHEN brand_interest != 'heebnewsletters' OR brand_interest IS NULL
    THEN CONCAT('Brand interest is: ', COALESCE(brand_interest, 'NULL'))
    WHEN emailValidationStatus NOT IN ('Valid', 'Verified', 'no_api_key', 'validation_error') AND emailValidationStatus IS NOT NULL
    THEN CONCAT('Validation failed: ', emailValidationStatus)
    ELSE 'Unknown status'
  END AS reason
FROM user_data
ORDER BY status, email;

-- To find emails NOT in BigQuery:
-- SELECT ce.email
-- FROM csv_emails ce
-- LEFT JOIN `analytics.users` u ON LOWER(ce.email) = LOWER(u.email)
-- WHERE u.email IS NULL;
