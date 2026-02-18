# BigQuery Users Table Schema

This document contains the complete schema for the `analytics.users` table in BigQuery. This schema is the single source of truth for all user data, regardless of lead source (magic links, Meta ads, Retention.com, manual entry).

## Complete Schema

```sql
CREATE TABLE `unaffiliated-data.analytics.users` (
  userID STRING NOT NULL,
  email STRING NULLABLE,
  firstName STRING NULLABLE,
  lastName STRING NULLABLE,
  phone STRING NULLABLE,
  
  -- Subscription data
  subscriptions JSON NULLABLE,                    -- Brand subscriptions with timestamps
  unsubscribed_brands STRING NULLABLE,           -- JSON string of unsubscribed brands
  snoozed_brands STRING NULLABLE,                -- JSON string of snoozed brands
  
  -- Email validation
  emailValidationStatus STRING NULLABLE,
  emailValidationReason STRING NULLABLE,
  emailIsDisposable BOOLEAN NULLABLE,
  emailIsFree BOOLEAN NULLABLE,
  emailHash STRING NULLABLE,
  
  -- Lead tracking (unified for Meta, Retention.com, manual)
  leadStatus STRING NULLABLE,
  leadSource STRING NULLABLE,                     -- 'meta_lead_ads', 'retention', 'magic_link', 'manual', etc.
  conversionDate TIMESTAMP NULLABLE,
  conversionPath STRING NULLABLE,
  leadData JSON NULLABLE,                        -- Full lead payload from source
  
  -- Company information (from Retention.com, Meta leads, etc.)
  companyName STRING NULLABLE,
  companyDomain STRING NULLABLE,
  companySize INTEGER NULLABLE,
  industry STRING NULLABLE,
  companyData JSON NULLABLE,
  
  -- Cloudflare data
  cfBotScore INTEGER NULLABLE,
  cfCountry STRING NULLABLE,
  
  -- User agent and location
  signupUserAgent STRING NULLABLE,
  recentLocationIP STRING NULLABLE,
  
  -- Timestamps
  recentClickDate TIMESTAMP NULLABLE,
  globalSuppressionDate TIMESTAMP NULLABLE,
  createdAt TIMESTAMP NULLABLE,
  updatedAt TIMESTAMP NULLABLE
);
```

## Field Descriptions

### Core Identity
- **userID** (STRING, REQUIRED): Deterministic UUID v5 generated from normalized email. Same email always generates same userID.
- **email** (STRING): User's email address (normalized to lowercase)
- **emailHash** (STRING): SHA256 hash of email for privacy compliance
- **firstName** (STRING): User's first name
- **lastName** (STRING): User's last name
- **phone** (STRING): User's phone number

### Subscription Data
- **subscriptions** (JSON): Object with brand IDs as keys and subscription timestamps as values
  ```json
  {
    "thepicklereport": 1704873600000,
    "themixedhome": 1704873600000
  }
  ```
- **unsubscribed_brands** (STRING): JSON string of unsubscribed brands with timestamps
  ```json
  {
    "thepicklereport": 1705312200000
  }
  ```
- **snoozed_brands** (STRING): JSON string of snoozed brands with reactivation data
  ```json
  {
    "thepicklereport": {
      "reactivation_timestamp": 1704067200000,
      "snooze_type": "unsubscribe_then_subscribe",
      "snooze_date": 1672531200000
    }
  }
  ```

### Email Validation
- **emailValidationStatus** (STRING): Status from EmailOversight API ('Valid', 'Invalid', 'Risky', etc.)
- **emailValidationReason** (STRING): Detailed reason for validation status
- **emailIsDisposable** (BOOLEAN): Whether email is from a disposable email service
- **emailIsFree** (BOOLEAN): Whether email is from a free email provider

### Lead Tracking
- **leadSource** (STRING): Source of the lead
  - `'magic_link'` - User subscribed via magic link URL
  - `'meta_lead_ads'` - Lead from Facebook/Instagram Lead Ads
  - `'retention'` - Lead from Retention.com webhook
  - `'manual'` - Manually added
- **leadStatus** (STRING): Status of the lead (e.g., 'new', 'qualified', 'converted')
- **conversionDate** (TIMESTAMP): When lead converted to subscription
- **conversionPath** (STRING): Path user took to convert
- **leadData** (JSON): Complete payload from lead source (webhook data, form data, etc.)

### Company Information
- **companyName** (STRING): Company name
- **companyDomain** (STRING): Company website domain
- **companySize** (INTEGER): Number of employees
- **industry** (STRING): Industry classification
- **companyData** (JSON): Additional company data from source

### Analytics & Tracking
- **recentClickDate** (TIMESTAMP): Most recent click/engagement timestamp
- **signupUserAgent** (STRING): User agent string from signup
- **recentLocationIP** (STRING): Most recent IP address (hashed)
- **cfBotScore** (INTEGER): Cloudflare bot score (0-100)
- **cfCountry** (STRING): Country code from Cloudflare

### Suppression
- **globalSuppressionDate** (TIMESTAMP): Date user was added to global suppression list

### Timestamps
- **createdAt** (TIMESTAMP): When user record was first created
- **updatedAt** (TIMESTAMP): Last update timestamp

## Notes

- All timestamps are stored as BigQuery TIMESTAMP type
- JSON fields store data as JSON strings (BigQuery JSON type)
- Email addresses are normalized to lowercase before hashing
- userID is deterministic (same email = same userID) to prevent duplicates
- This schema supports unified lead storage from multiple sources

## Last Updated
January 2025

