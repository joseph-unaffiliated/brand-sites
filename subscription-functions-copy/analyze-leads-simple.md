# Analyzing Heeb Leads Status

Since the endpoint needs to be deployed, here's a simpler approach:

## Option 1: Use BigQuery SQL (Fastest)

Run this query in BigQuery to get the status of all emails:

```sql
-- Replace the email list with emails from your CSV
WITH csv_emails AS (
  SELECT email FROM UNNEST([
    '00avery.13@gmail.com',
    '11539357a@gmail.com',
    -- ... add all 4,358 emails here
  ]) AS email
)
SELECT 
  COALESCE(u.email, ce.email) AS email,
  CASE WHEN u.email IS NULL THEN 'NOT_IN_BQ' ELSE 'IN_BQ' END AS in_bigquery,
  JSON_EXTRACT_SCALAR(u.leadData, '$.brand_interest') AS brand_interest,
  u.emailValidationStatus,
  CASE 
    WHEN u.email IS NULL THEN 'NOT_IN_BQ'
    WHEN JSON_EXTRACT_SCALAR(u.leadData, '$.brand_interest') != 'heebnewsletters' THEN 'WRONG_BRAND'
    WHEN u.emailValidationStatus NOT IN ('Valid', 'Verified', 'no_api_key', 'validation_error', NULL) THEN 'FAILED_VALIDATION'
    WHEN JSON_EXTRACT(u.subscriptions, '$') != '{}' AND u.subscriptions IS NOT NULL THEN 'ALREADY_SUBSCRIBED'
    WHEN JSON_EXTRACT_SCALAR(u.unsubscribed_brands, '$.heebnewsletters') IS NOT NULL THEN 'UNSUBSCRIBED'
    WHEN JSON_EXTRACT_SCALAR(u.leadData, '$.brand_interest') = 'heebnewsletters' 
      AND (JSON_EXTRACT(u.subscriptions, '$') = '{}' OR u.subscriptions IS NULL)
      AND JSON_EXTRACT_SCALAR(u.unsubscribed_brands, '$.heebnewsletters') IS NULL
    THEN 'QUALIFIES_AS_LEAD'
    ELSE 'UNKNOWN'
  END AS status
FROM csv_emails ce
LEFT JOIN `analytics.users` u ON LOWER(ce.email) = LOWER(u.email)
ORDER BY status, email;
```

This will tell you:
- Which emails are NOT in BigQuery (need processing)
- Which failed validation
- Which are already subscribed/unsubscribed
- Which qualify as leads (but may or may not have the Customer.io tag)

## Option 2: Export from Customer.io

Since you see 1,039 people with `lead_for_heebnewsletters = true` in Customer.io:

1. Export all people from Customer.io with that attribute
2. Compare the email list with your CSV
3. The difference tells you which ones still need the tag

## Option 3: Deploy the Analysis Endpoint

The endpoint I created (`api/analyze-heeb-leads-endpoint.js`) will do all this automatically, but it needs to be deployed to Vercel first.

Would you like me to:
1. Create a script to generate the BigQuery SQL with all your emails?
2. Help you export from Customer.io?
3. Deploy the analysis endpoint?
