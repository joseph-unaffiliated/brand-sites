-- Verify Lead Tag Creation Test
-- Test email: joseph+test80@unaffiliated.co
-- Expected brand: obscuremixtape

-- 1. Check if user was created/updated in BigQuery
SELECT 
  userID,
  email,
  firstName,
  lastName,
  leadSource,
  leadData,
  subscriptions,
  unsubscribed_brands,
  createdAt,
  updatedAt
FROM `unaffiliated-data.analytics.users`
WHERE email = 'joseph+test80@unaffiliated.co'
ORDER BY updatedAt DESC
LIMIT 1;

-- 2. Check leadData structure
SELECT 
  email,
  JSON_EXTRACT_SCALAR(leadData, '$.brand_interest') AS brand_interest,
  JSON_EXTRACT_SCALAR(leadData, '$.landing_page_domain') AS landing_page_domain,
  JSON_EXTRACT_SCALAR(leadData, '$.clicked_at') AS clicked_at,
  leadData
FROM `unaffiliated-data.analytics.users`
WHERE email = 'joseph+test80@unaffiliated.co'
  AND leadData IS NOT NULL;

-- 3. Verify lead qualification logic
-- User should qualify as lead if:
-- - leadData.brand_interest = 'obscuremixtape'
-- - subscriptions is NULL or {}
-- - obscuremixtape is NOT in unsubscribed_brands
SELECT 
  email,
  JSON_EXTRACT_SCALAR(leadData, '$.brand_interest') AS brand_interest,
  subscriptions,
  unsubscribed_brands,
  CASE 
    WHEN JSON_EXTRACT_SCALAR(leadData, '$.brand_interest') = 'obscuremixtape'
      AND (subscriptions IS NULL OR subscriptions = '{}')
      AND (unsubscribed_brands IS NULL OR JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.obscuremixtape') IS NULL)
    THEN 'SHOULD BE LEAD'
    ELSE 'NOT A LEAD'
  END AS lead_status
FROM `unaffiliated-data.analytics.users`
WHERE email = 'joseph+test80@unaffiliated.co';
