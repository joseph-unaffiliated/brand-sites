-- Updated Users table schema with unified lead data fields
-- This extends the existing schema to support Meta leads, RB2B leads, and other lead sources

-- Add new columns to existing Users table
ALTER TABLE `unaffiliated-data.analytics.users` 
ADD COLUMN IF NOT EXISTS leadSource STRING,           -- 'meta_lead_ads', 'rb2b', 'magic_link', 'manual', etc.
ADD COLUMN IF NOT EXISTS leadData JSON,               -- Full lead payload from source
ADD COLUMN IF NOT EXISTS firstName STRING,
ADD COLUMN IF NOT EXISTS lastName STRING,
ADD COLUMN IF NOT EXISTS phone STRING,
ADD COLUMN IF NOT EXISTS companyName STRING,          -- Already exists for RB2B
ADD COLUMN IF NOT EXISTS companyDomain STRING,        -- Already exists for RB2B
ADD COLUMN IF NOT EXISTS companySize STRING,          -- Already exists for RB2B
ADD COLUMN IF NOT EXISTS industry STRING,             -- Already exists for RB2B
ADD COLUMN IF NOT EXISTS companyData JSON,            -- Already exists for RB2B
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP;         -- Already exists for RB2B

-- Note: BigQuery automatically creates indexes on columns, so no explicit CREATE INDEX statements needed
-- BigQuery will optimize queries on these fields automatically

-- Complete schema reference (for documentation)
/*
CREATE TABLE `unaffiliated-data.analytics.users` (
  userID STRING NOT NULL,
  email STRING,
  emailHash STRING,
  subscriptions JSON,           -- Brand subscriptions with timestamps and sources
  unsubscribed_brands STRING, -- JSON string of unsubscribed brands
  snoozed_brands STRING,      -- JSON string of snoozed brands with reactivation dates
  
  -- Lead source tracking
  leadSource STRING,          -- 'meta_lead_ads', 'rb2b', 'magic_link', 'manual', etc.
  leadData JSON,              -- Full lead payload from source
  
  -- Personal information (from Meta leads, forms, etc.)
  firstName STRING,
  lastName STRING,
  phone STRING,
  
  -- Company information (from RB2B, Meta leads, etc.)
  companyName STRING,
  companyDomain STRING,
  companySize STRING,
  industry STRING,
  companyData JSON,           -- Full company data payload
  
  -- Timestamps
  recentClickDate TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
*/
