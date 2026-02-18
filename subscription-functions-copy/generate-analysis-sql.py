import csv

csv_file = "/Users/joseph/Downloads/Heeb's List - Active Leads.csv"

print("📖 Reading CSV file...")
emails = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        email = row['email'].strip()
        if email:
            emails.append(email.lower())

print(f"📊 Found {len(emails)} emails")
print("📝 Generating BigQuery SQL...")

# Generate SQL with all emails
email_list = ",\n    ".join([f"'{email}'" for email in emails])

sql = f"""
-- Analyze Heeb Leads Status
-- Generated from CSV with {len(emails)} emails

WITH csv_emails AS (
  SELECT email FROM UNNEST([
    {email_list}
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
    JSON_EXTRACT_SCALAR(u.leadData, '$.brand_interest') AS brand_interest,
    CASE 
      WHEN u.subscriptions IS NULL THEN false
      WHEN TO_JSON_STRING(COALESCE(u.subscriptions, JSON '{{}}')) = '{{}}' THEN false
      ELSE true
    END AS has_subscriptions,
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
    THEN 'Should have lead tag in Customer.io - check if tag exists'
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

-- Emails NOT in BigQuery (need to be processed)
SELECT 
  ce.email,
  'NOT_IN_BQ' AS status,
  'Not in BigQuery, needs processing' AS reason
FROM csv_emails ce
LEFT JOIN `analytics.users` u ON LOWER(ce.email) = LOWER(u.email)
WHERE u.email IS NULL
ORDER BY ce.email;
"""

output_file = "analyze-heeb-leads-query.sql"
with open(output_file, 'w') as f:
    f.write(sql)

print(f"✅ Generated SQL query: {output_file}")
print(f"   Run this in BigQuery console to get the analysis")
print(f"\n📊 Summary:")
print(f"   - Total emails: {len(emails)}")
print(f"   - The query will show:")
print(f"     * QUALIFIES_AS_LEAD: Emails that should have the lead tag")
print(f"     * ALREADY_SUBSCRIBED: Emails that have subscriptions")
print(f"     * UNSUBSCRIBED: Emails unsubscribed from heebnewsletters")
print(f"     * FAILED_VALIDATION: Emails that failed validation")
print(f"     * WRONG_BRAND_INTEREST: Emails with wrong brand interest")
print(f"     * NOT_IN_BQ: Emails not in BigQuery (from second query)")
