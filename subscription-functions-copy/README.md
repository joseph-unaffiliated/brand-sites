# Subscription Functions

A production-ready brand subscription management system built for Vercel that handles magic link subscriptions, unsubscriptions, snooze functionality, and integrates with Customer.io and BigQuery.

## 🎯 What This Repository Contains

This repository contains a **centralized subscription management system** for Unaffiliated Inc.'s portfolio of 22 newsletter brands. It provides:

- **Magic link subscription URLs** - Simple, clean URLs that users can click to subscribe or unsubscribe
- **Multi-brand subscription management** - Handle subscriptions across 22 different brands from a single system
- **Bidirectional data synchronization** - Keeps BigQuery (analytics) and Customer.io (email marketing) in sync
- **Lead capture integration** - Processes leads from Meta Lead Ads, Retention.com, and manual sources
- **Analytics and tracking** - Comprehensive click tracking, subscription history, and user behavior data
- **Bulk processing tools** - Scripts for bulk subscription processing and data recovery

## 🚀 What It Does

### Core Functionality

1. **Subscription Management**
   - Users visit magic link URLs (e.g., `https://magic.thepicklereport.com?email=user@example.com`)
   - System validates email, creates/updates user record, and subscribes to specified brands
   - Updates both BigQuery (for analytics) and Customer.io (for email campaigns)

2. **Unsubscription Handling**
   - Brand-specific unsubscriptions via `/unsubscribe` URLs
   - Maintains unsubscription history for compliance and analytics
   - Removes brand relationships in Customer.io while preserving user data

3. **Snooze Functionality**
   - Allows users to temporarily pause subscriptions
   - Dual-mode: subscribed users get unsubscribed temporarily, unsubscribed users get scheduled for future subscription
   - Automatic reactivation after 3 months or when user actively subscribes

4. **Data Synchronization**
   - Automated bidirectional sync between BigQuery and Customer.io
   - Real-time webhook integration for email events (sent, opened, clicked)
   - Conflict resolution and data validation

5. **Lead Processing**
   - Integrates Meta Lead Ads webhooks to capture form submissions
   - Processes Retention.com webhooks for lead data with brand interest
   - Unified lead storage in BigQuery `Users` table

6. **Analytics & Tracking**
   - Click tracking with UTM parameters
   - Subscription history with timestamps
   - User behavior analytics in BigQuery

## 💡 Why This System Exists

### Business Problem

Unaffiliated Inc. operates **22 different newsletter brands**, each with its own subscription base. Managing subscriptions across multiple brands requires:

1. **Centralized Management** - One system to handle all brands instead of 22 separate systems
2. **Data Consistency** - Keep analytics (BigQuery) and email marketing (Customer.io) synchronized
3. **Compliance** - Track unsubscriptions and maintain audit trails
4. **User Experience** - Simple, clean URLs that work across all brands
5. **Analytics** - Unified tracking of subscriptions, clicks, and user behavior across all brands
6. **Lead Capture** - Process leads from multiple sources (Meta ads, B2B forms, manual entry) into a single system

### Technical Challenges Solved

- **Race Conditions** - Deterministic UUID generation prevents duplicate user records
- **BigQuery Streaming Buffer** - Uses MERGE operations instead of UPDATE to avoid buffer limitations
- **API Rate Limits** - Batched Customer.io API calls with proper timeouts
- **Data Integrity** - Bidirectional sync with conflict resolution
- **Scalability** - Serverless architecture on Vercel handles traffic spikes
- **Privacy** - Email and IP hashing for GDPR/privacy compliance

### Key Benefits

✅ **Single Source of Truth** - All subscription data flows through one system  
✅ **Automated Sync** - No manual data entry between systems  
✅ **Brand Flexibility** - Easy to add new brands or modify existing ones  
✅ **Analytics Ready** - All data stored in BigQuery for analysis  
✅ **Email Marketing Ready** - Customer.io relationships and attributes automatically maintained  
✅ **Compliance** - Full audit trail of subscriptions, unsubscriptions, and snoozes  

### Real-World Use Cases

**1. Newsletter Subscription Flow**
- User visits brand website and clicks "Subscribe"
- Website redirects to `https://magic.thepicklereport.com?email=user@example.com`
- System validates email, creates user record, subscribes to brand
- User is redirected back with `?subscribed=true` confirmation
- Customer.io automatically receives subscription for email campaigns
- BigQuery logs subscription for analytics

**2. Multi-Brand Subscription**
- User wants to subscribe to multiple brands at once
- Website uses `https://magic.unaffiliated.com?email=user@example.com&brands=thepicklereport,themixedhome`
- System creates one user record with subscriptions to both brands
- Both brands receive the subscriber in Customer.io
- Analytics tracks which brands were subscribed together

**3. Lead Capture from Facebook Ads**
- User fills out Meta Lead Ads form on Facebook/Instagram
- Meta sends webhook to `/api/meta-webhook`
- System extracts email, name, phone, and brand from form data
- Creates/updates user record in BigQuery with lead source = "meta_lead_ads"
- Subscribes user to appropriate brand in Customer.io
- Analytics tracks lead source and conversion

**5. Lead Capture from Retention.com**
- Visitor clicks on a brand website (e.g., thepicklereport.com)
- Retention.com identifies the visitor and sends webhook to `/retention`
- System validates email via EmailOversight
- Determines brand interest from landing page domain
- Stores lead in BigQuery with `leadSource = 'retention'` (does NOT auto-subscribe)
- Full webhook payload stored in `leadData` JSON field
- Brand interest indicated in lead data for future reference

**6. Automatic Suppression List Management**
- When user subscribes via magic link, email is automatically added to Retention.com suppression list
- Prevents Retention.com from capturing leads for users you already have as subscribers
- Uses Retention.com API to upload CSV file with email addresses
- Non-blocking: subscription succeeds even if suppression API call fails

**5. Bulk Subscription Recovery**
- System downtime causes missed subscriptions
- Export list of emails that signed up during downtime
- Use bulk subscribe endpoint or CSV processor to process all at once
- All subscriptions go through normal validation and sync flow
- No manual data entry required

**7. User Unsubscribes**
- User clicks unsubscribe link in email or on website
- Visits `https://magic.thepicklereport.com/unsubscribe?email=user@example.com`
- System removes brand relationship in Customer.io
- Logs unsubscription timestamp in BigQuery
- User remains in system (for analytics) but won't receive emails

**8. User Snoozes Subscription**
- User wants temporary break from emails
- Visits `https://magic.thepicklereport.com/snooze?email=user@example.com`
- If subscribed: temporarily unsubscribes, schedules reactivation in 3 months
- If unsubscribed: keeps unsubscribed, schedules subscription in 3 months
- System tracks snooze status and automatically reactivates

## 📋 Table of Contents

- [What This Repository Contains](#-what-this-repository-contains)
- [What It Does](#-what-it-does)
- [Why This System Exists](#-why-this-system-exists)
- [Quick Start](#-quick-start)
- [Architecture Overview](#-architecture-overview)
- [API Endpoints](#-api-endpoints)
- [Brand Management](#-brand-management)
- [Data Flow](#-data-flow)
- [Setup & Configuration](#-setup--configuration)
- [File Structure](#-file-structure)
- [Key Features](#-key-features)
- [Incomplete Tasks](#-incomplete-tasks)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)

---

## 🚀 Quick Start

### Essential Environment Variables

```bash
# Customer.io
CIO_SITE_ID=your_site_id
CIO_API_KEY=your_api_key

# Google Cloud Platform
GCP_PROJECT_ID=unaffiliated-data
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Email Validation
EMAILOVERSIGHT_API_KEY=your_api_key

# Data Hashing
EMAIL_SALT=your_email_salt
IP_SALT=your_ip_salt

# Retention.com (optional - for lead capture and suppression)
RETENTION_API_KEY=your_retention_api_key
RETENTION_API_ID=your_retention_api_id
```

### Subscription URLs

**Single Brand:**
```
https://magic.thepicklereport.com?email=user@example.com
```

**Multiple Brands:**
```
https://magic.unaffiliated.com?email=user@example.com&brands=thepicklereport,themixedhome
```

**Unsubscribe:**
```
https://magic.thepicklereport.com/unsubscribe?email=user@example.com
```

**Snooze:**
```
https://magic.thepicklereport.com/snooze?email=user@example.com
```

**Request past issue:**
```
https://magic.thepicklereport.com/request?issue=001&email=user@example.com
```
Sets Customer.io attribute `requested_issue` (e.g. `TPR_issue001`) and redirects to brand site with `?request=true`. Use in Customer.io to trigger a campaign that sends the requested newsletter issue.

---

## 🏗️ Architecture Overview

### System Design Philosophy

This system follows a **unified data model** where all user data (subscriptions, leads, company info) lives in a single BigQuery `Users` table, regardless of source (magic links, Meta ads, Retention.com, manual entry). This design:

- Eliminates data silos between different lead sources
- Simplifies analytics queries (one table instead of many)
- Ensures consistent user identification across all touchpoints
- Enables comprehensive user journey tracking

### Core Components

1. **Magic Link Handler** (`api/magic-link.js`)
   - **Purpose**: Main entry point for all user-initiated subscription actions
   - **Handles**: Subscribe, unsubscribe, snooze, and request past issue actions
   - **Integrates**: Customer.io (for email campaigns) and BigQuery (for analytics)
   - **Key Features**: 
     - Deterministic UUID generation ensures same email = same userID (prevents duplicates)
     - Bot-blocking protection via feature flag (`ENABLE_BOT_BLOCKING`) - when enabled, immediately redirects to success page and executes action via POST request from client-side JavaScript
     - `/execute` endpoint for programmatic subscription actions (bypasses bot detection)

2. **Customer.io Integration**
   - **Purpose**: Maintain brand relationships and attributes for email marketing
   - **Brand Relationships**: Object relationships linking users to brands they're subscribed to
   - **Person Attributes**: 
     - `subscribed_brands` - JSON object with subscription timestamps
     - `unsubscribed_brands` - JSON object with unsubscription timestamps
     - `snoozed_brands` - JSON object with snooze data and reactivation dates
     - Individual boolean flags per brand (`subscribed_to_[brand]`) for easy segmentation

3. **BigQuery Integration**
   - **Purpose**: Single source of truth for all user data and analytics
   - **Unified `analytics.users` Table**: Contains subscriptions, lead data, company info, timestamps
   - **`analytics.clicks` Table**: Tracks all click events with UTM parameters
   - **`analytics.campaigns` Table**: Campaign performance data from Customer.io
   - **Key Feature**: MERGE operations prevent BigQuery streaming buffer issues

4. **Bidirectional Sync System**
   - **Purpose**: Keep BigQuery and Customer.io synchronized
   - **`bq-to-cio-sync.js`**: Syncs subscription changes from BigQuery → Customer.io
   - **`cio-to-bq-sync-enhanced.js`**: Syncs email events and changes from Customer.io → BigQuery
   - **Automated Scheduling**: `sync-scheduler.js` runs periodic syncs to catch any drift
   - **Webhook Integration**: Real-time sync for email events (sent, opened, clicked)

5. **Lead Capture Integrations**
   - **Meta Lead Ads** (`api/meta-webhook.js`): Processes Facebook/Instagram lead form submissions
   - **Retention.com** (`api/retention-webhook.js`): Processes Retention.com webhooks with landing page data and brand interest (leads are NOT automatically subscribed)
   - **Unified Storage**: All leads stored in same `Users` table as magic link subscriptions

6. **Suppression List Management**
   - **Retention.com Suppression API**: Automatically adds subscribed emails to Retention.com's suppression list
   - **Purpose**: Prevents Retention.com from capturing leads for users you already have as subscribers
   - **Implementation**: Called automatically after successful subscription via magic link
   - **Format**: CSV file upload via multipart/form-data
   - **Non-blocking**: Subscription succeeds even if suppression API call fails

### Data Flow

**Subscription Flow (Bot-Blocking Enabled):**
```
User Action → Magic Link Handler
    ├── Immediate Redirect to Brand Website (with ?subscribed=true)
    └── Client-Side JavaScript:
        ├── Bot Detection Check
        ├── If Real Browser: POST to /execute endpoint
        │   ├── Email Validation (EmailOversight)
        │   ├── User Lookup/Creation (BigQuery)
        │   ├── Customer.io Update (relationships + attributes)
        │   ├── BigQuery Update (MERGE operation)
        │   ├── Retention.com Suppression (add to suppression list)
        │   └── Return Success/Failure
        └── If Bot: Action Not Executed
```

**Subscription Flow (Bot-Blocking Disabled - Legacy):**
```
User Action → Magic Link Handler
    ├── Email Validation (EmailOversight)
    ├── User Lookup/Creation (BigQuery)
    ├── Customer.io Update (relationships + attributes)
    ├── BigQuery Update (MERGE operation)
    ├── Retention.com Suppression (add to suppression list)
    └── Redirect to Brand Website
```

**Retention.com Lead Capture Flow:**
```
Retention.com Webhook → /retention endpoint
    ├── Email Validation (EmailOversight)
    ├── Brand Detection (from landing_page_domain)
    ├── BigQuery Storage (leadSource = 'retention')
    └── Return 200 OK (even if validation fails)
```

---

## 📡 API Endpoints

### Magic Link Handler (`/api/magic-link`)

**Routes (via Vercel rewrites):**
- `/` → Subscribe
- `/unsubscribe` → Unsubscribe
- `/snooze` → Snooze
- `/execute` → Execute subscription action (POST only, for programmatic use and bot-blocking flow)

**Query Parameters:**
- `email` (required): User email address
- `brands` (optional): Comma-separated brand IDs
- `utm_source`, `utm_medium`, `utm_campaign`, etc. (optional): Tracking parameters
- `poll` (optional): Poll identifier for poll page functionality

**Response:** 
- When `ENABLE_BOT_BLOCKING=false` (default): Redirects to brand website with status parameter (`?subscribed=true`, `?unsubscribed=true`, `?snoozed=true`) after processing
- When `ENABLE_BOT_BLOCKING=true`: Immediately redirects to brand website, then client-side JavaScript executes the action via POST to `/execute`

### Execute Endpoint (`/execute`)

**Method:** POST only

**Purpose:** Execute subscription actions programmatically. Used by:
- Client-side JavaScript (bot-blocking flow)
- Programmatic integrations (Zapier, etc.)

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "brand": "thepicklereport",
  "action": "subscribe",
  "campaignID": "optional_campaign_id",
  "utm_source": "optional_utm_source",
  "utm_campaign": "optional_utm_campaign"
}
```

**Response:** JSON
```json
{
  "success": true,
  "action": "subscribe"
}
```

### Other Endpoints

- `/api/cio-webhook` - Customer.io webhook handler
- `/api/sync-status` - Get sync status
- `/api/trigger-sync` - Manually trigger sync
- `/api/meta-webhook` - Meta Lead Ads webhook (optional, currently using Zapier)
- `/retention` - **Retention.com webhook handler** - Receives lead data from Retention.com, validates emails, stores in BigQuery with brand interest (does NOT auto-subscribe)
- `/api/bulk-subscribe` - Bulk subscription processing endpoint

---

## 🎨 Brand Management

### Current Brands (23 total)

The system manages subscriptions for these brands:

| Brand ID | Customer.io Display Name |
|----------|-------------------------|
| `batmitzvahhorrorstories` | Bat Mitzvah Horror Stories |
| `grapejuiceandnostalgia` | Grapejuice and Nostalgia |
| `hardresets` | Hard Resets |
| `heebnewsletters` | Heeb Newsletters |
| `highdiaries` | High Diaries |
| `hipspeak` | Hipspeak |
| `hookuplists` | Hookup Lists |
| `millennialvsgenz` | Millennial vs Gen Z |
| `obscuremixtape` | Obscure Mixtape |
| `onetimeatcamp` | One Time at Camp |
| `the90sparent` | The 90s Parent |
| `thecomingofageparty` | The Coming of Age Party |
| `thedadsdad` | The Dad's Dad |
| `theeyeballerscookbook` | The Eyeballer's Cookbook |
| `themixedhome` | The Mixed Home |
| `thepackandplay` | The Pack & Play |
| `thepicklereport` | The Pickle Report |
| `theproudparent` | The Proud Parent |
| `thequirkiest` | The Quirkiest |
| `thestewardprize` | The Steward Prize |
| `toddlercinema` | Toddler Cinema |
| `zitsandcake` | Zits and Cake |

**To add a new brand**, see [`docs/ADDING_A_NEW_BRAND.md`](docs/ADDING_A_NEW_BRAND.md)

### Brand Mapping Files

Brand mappings are defined in three files:
1. `api/magic-link.js` - `BRAND_MAPPING` and `CUSTOMER_IO_BRAND_NAMES`
2. `api/bq-to-cio-sync.js` - `CUSTOMER_IO_BRAND_NAMES`
3. `api/cio-to-bq-sync-enhanced.js` - `BRAND_NAME_TO_ID` (reverse mapping)

**All three files must be updated when adding a new brand.**

---

## 🔄 Data Flow

### Subscription Process

1. **Email Validation** → EmailOversight API
2. **User Lookup** → BigQuery `analytics.users` table
3. **Customer.io Update**:
   - Create/update person record
   - Create brand relationships
   - Set `subscribed_brands` attribute (JSON object)
   - Set individual boolean attributes (`subscribed_to_[brand]`)
4. **BigQuery Update**:
   - MERGE user record with subscriptions
   - Log click event
5. **Retention.com Suppression**:
   - Upload email to Retention.com suppression list via API
   - Prevents Retention.com from capturing this lead in the future
   - Non-blocking (subscription succeeds even if suppression fails)
6. **Redirect** → Brand website with `?subscribed=true`

### Unsubscription Process

1. **User Lookup** → BigQuery
2. **Customer.io Update**:
   - Remove brand relationships (`delete_relationships` action)
   - Update `unsubscribed_brands` attribute
   - Set individual brand attributes to `false`
3. **BigQuery Update**:
   - MERGE user record removing brand from subscriptions
   - Add timestamp to `unsubscribed_brands` JSON
4. **Redirect** → Brand website with `?unsubscribed=true`

### Snooze Process

**Dual-mode behavior:**
- **Currently subscribed users**: Temporarily unsubscribe, schedule reactivation in 3 months
- **Currently unsubscribed users**: Keep unsubscribed, schedule subscription in 3 months

**Steps:**
1. Check current subscription status
2. Update Customer.io with snooze attributes
3. Log to BigQuery with reactivation timestamp
4. **Auto-clearing**: If user actively subscribes while snoozed, snooze is automatically cleared

---

## ⚙️ Setup & Configuration

### 1. Environment Variables

See [Quick Start](#-quick-start) for required variables.

### 2. BigQuery Schema

The `analytics.users` table must include these fields:

```sql
-- Core fields
userID STRING NOT NULL
email STRING
emailHash STRING
subscriptions JSON                    -- Brand subscriptions with timestamps
unsubscribed_brands STRING            -- JSON string of unsubscribed brands
snoozed_brands STRING                 -- JSON string of snoozed brands

-- Lead tracking (unified for Meta, Retention.com, manual)
leadSource STRING                     -- 'meta_lead_ads', 'retention', 'magic_link', etc.
leadData JSON                         -- Full lead payload
firstName STRING
lastName STRING
phone STRING

-- Company information (from Retention.com, etc.)
companyName STRING
companyDomain STRING
companySize STRING
industry STRING
companyData JSON

-- Timestamps
recentClickDate TIMESTAMP
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

See [`docs/UPDATED_USERS_TABLE_SCHEMA.sql`](docs/UPDATED_USERS_TABLE_SCHEMA.sql) for the full schema.

### 3. Customer.io Setup

**Required:**
- Brand objects created in Customer.io (must match `CUSTOMER_IO_BRAND_NAMES` mapping)
- Object type ID: `1` (default for brand objects)
- Webhook endpoint configured (see [Incomplete Tasks](#incomplete-tasks))

### 4. Vercel Configuration

The `vercel.json` file handles URL rewrites:

```json
{
  "rewrites": [
    { "source": "/", "destination": "/api/magic-link" },
    { "source": "/unsubscribe", "destination": "/api/magic-link" },
    { "source": "/snooze", "destination": "/api/magic-link" },
    { "source": "/api/cio-webhook", "destination": "/api/cio-webhook" },
    { "source": "/api/sync-status", "destination": "/api/sync-scheduler-endpoint" },
    { "source": "/api/trigger-sync", "destination": "/api/sync-scheduler-endpoint" },
    { "source": "/api/meta-webhook", "destination": "/api/meta-webhook" }
  ]
}
```

---

## 📁 File Structure

### API Endpoints (`/api/`)

**Core Subscription Handlers:**
- `magic-link.js` - **Main subscription handler**. Processes all subscribe/unsubscribe/snooze requests. Validates emails, creates/updates users, manages Customer.io relationships, logs to BigQuery.

**Data Synchronization:**
- `bq-to-cio-sync.js` - **BigQuery → Customer.io sync**. Ensures Customer.io has latest subscription data from BigQuery.
- `cio-to-bq-sync-enhanced.js` - **Customer.io → BigQuery sync**. Syncs email events (sent, opened, clicked) and subscription changes back to BigQuery.
- `sync-scheduler.js` - **Automated sync orchestrator**. Runs periodic syncs to catch any data drift between systems.
- `sync-scheduler-endpoint.js` - **Sync management API**. Provides endpoints to check sync status and manually trigger syncs.
- `cio-webhook.js` - **Real-time webhook handler**. Processes Customer.io webhooks for immediate data sync.

**Lead Capture:**
- `meta-webhook.js` - **Meta Lead Ads handler**. Processes Facebook/Instagram lead form submissions, extracts brand info, stores in unified Users table.
- `retention-webhook.js` - **Retention.com lead handler**. Processes Retention.com webhooks with landing page data, validates emails, stores in BigQuery with brand interest (does NOT subscribe to Customer.io).
- `bulk-subscribe.js` - **Bulk subscription API**. Processes multiple subscriptions at once (up to 20 per request; script auto-chunks). Used for recovery and bulk imports.
- `process-bulk-subscribe-file.js` - **CSV processor script**. Reads CSV files and calls bulk subscribe endpoint in chunks.
- `extract-failed-and-retry.js` - **Retry script**. Extracts failed emails from a results JSON and re-runs them via the processor.

**Utilities:**
- `ads.js` - **Ad tracking handler**. Tracks ad clicks and conversions.

### Documentation (`/docs/`)

**Setup & Configuration:**
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions for Vercel, BigQuery, and Customer.io
- `ADDING_A_NEW_BRAND.md` - Step-by-step guide for adding a new brand to the system
- `UPDATED_USERS_TABLE_SCHEMA.sql` - BigQuery table schema with all fields and data types

**Integration Guides:**
- `BQ_CIO_INTEGRATION_GUIDE.md` - Detailed explanation of bidirectional sync system
- `META_LEAD_ADS_SETUP.md` - Meta Lead Ads integration setup (currently using Zapier as alternative)
- `API_DOCUMENTATION.md` - Complete API reference with examples

**Campaign & Operations:**
- `BRAND_EMAIL_CAMPAIGNS.md` - Guide for creating Customer.io email campaigns using brand relationships
- `UPDATED_BRAND_UNSUBSCRIBE_GUIDE.md` - Technical details of unsubscribe system
- `BULK_SUBSCRIBE_GUIDE.md` - How to use bulk subscription processing
- `BULK_SUBSCRIBE_CSV_GUIDE.md` - CSV file format and usage
- `BULK_UPLOAD_LEARNINGS.md` - Best practices and learnings for future bulk uploads
- `PROJECT_SUMMARY.md` - High-level project status and overview

### Webflow Scripts (Root Directory)

**Client-Side JavaScript for Webflow Pages:**

- `webflow-success-page-script.js` - **Success/Unsub/Snooze/Poll page handler**. Handles subscription success, unsubscribe, snooze, and poll page states. Includes bot detection and POST execution for bot-blocking flow. Sets/clears localStorage for subscription status.

- `webflow-article-page-script.js` - **Article page subscription handler**. Shows toast notification when `?subscribed=true` is present, executes subscription action via POST, and sets localStorage to suppress subscription banners.

- `webflow-redirect-page-script.js` - **External redirect page handler**. Displays interstitial page with site name, executes subscription action via POST (using `navigator.sendBeacon()` for reliability), then redirects to external URL after 2 seconds.

- `webflow-heebnewsletters-success-page-script.js` - **Heeb Newsletters specific handler**. Same functionality as `webflow-success-page-script.js` but customized for Heeb Newsletters brand-specific requirements.

**Key Features:**
- Bot detection (checks user agent, headless browser indicators, localStorage support, page visibility)
- Dynamic message updates ("Confirming..." → "Success!" or "Failed [click to retry]")
- localStorage management for subscription status and email
- Poll page support
- Error handling with clickable retry (no red styling, no buttons)

### Configuration Files

- `vercel.json` - **Vercel routing configuration**. Maps clean URLs to API endpoints (e.g., `/unsubscribe` → `/api/magic-link`)
- `package.json` - **Dependencies and scripts**. Node.js dependencies and npm scripts for local development

---

## ✨ Key Features

### Core Functionality
- ✅ Magic link subscriptions with clean URLs
- ✅ Brand-specific unsubscriptions
- ✅ Multi-brand subscription support
- ✅ Snooze functionality (dual-mode: subscribed/unsubscribed users)
- ✅ Automatic snooze clearing on active subscription
- ✅ Bot-blocking protection - Prevents email client "machine clicks" from triggering unintended subscriptions via client-side bot detection and POST-based execution
- ✅ Article page subscriptions - Direct subscription links to article pages with toast notifications
- ✅ External redirect subscriptions - Interstitial page for external link subscriptions
- ✅ Poll page support - Poll functionality integrated with subscription flow

### Integrations
- ✅ Customer.io brand relationship management
- ✅ Customer.io person attributes (subscribed_brands, unsubscribed_brands, snoozed_brands)
- ✅ BigQuery logging and analytics
- ✅ Email validation via EmailOversight API
- ✅ Bidirectional BigQuery ↔ Customer.io sync
- ✅ Real-time Customer.io webhook integration
- ✅ Automated sync scheduling
- ✅ Retention.com lead capture webhook integration
- ✅ Retention.com suppression API integration (automatic on subscribe)

### Data Management
- ✅ MERGE operations to avoid BigQuery streaming buffer issues
- ✅ Email normalization and hashing for privacy
- ✅ Deterministic UUID generation (v5) to prevent race condition duplicates
- ✅ Comprehensive error handling and logging
- ✅ Data validation and conflict resolution

---

## ⚠️ Incomplete Tasks

### 1. Customer.io Webhook Actions Configuration 🔴 **HIGH PRIORITY**

**Status**: Code complete, dashboard configuration needed

**What's done:**
- ✅ Webhook endpoint created (`/api/cio-webhook`)
- ✅ Webhook handler implemented

**What's missing:**
- ❌ Configure webhook in Customer.io dashboard:
  1. Go to Customer.io dashboard → Settings → Webhooks
  2. Add webhook URL: `https://subscription-functions.vercel.app/api/cio-webhook`
  3. Select event types:
     - `person.created`
     - `person.updated`
     - `email.sent`
     - `email.opened`
     - `email.clicked`
  4. Test with sample events

---

## 📚 Documentation

### Essential Guides
- **[Adding a New Brand](docs/ADDING_A_NEW_BRAND.md)** - Step-by-step guide for adding brands
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Detailed API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deployment and configuration
- **[BigQuery ↔ Customer.io Integration](docs/BQ_CIO_INTEGRATION_GUIDE.md)** - Sync system details

### Additional Resources
- **[Brand Email Campaigns](docs/BRAND_EMAIL_CAMPAIGNS.md)** - Customer.io segmentation guide
- **[Brand Unsubscribe Guide](docs/UPDATED_BRAND_UNSUBSCRIBE_GUIDE.md)** - Unsubscribe system details
- **[Project Summary](docs/PROJECT_SUMMARY.md)** - Project status and overview
- **[Meta Lead Ads Setup](docs/META_LEAD_ADS_SETUP.md)** - Meta integration (currently using Zapier)
- **[Bulk Subscribe Guide](docs/BULK_SUBSCRIBE_GUIDE.md)** - Bulk subscription processing
- **[Bulk Subscribe CSV Guide](docs/BULK_SUBSCRIBE_CSV_GUIDE.md)** - CSV file format and usage
- **[Bulk Upload Learnings](docs/BULK_UPLOAD_LEARNINGS.md)** - Best practices and learnings for future bulk uploads

---

## 🔍 Troubleshooting

### Common Issues

1. **BigQuery Streaming Buffer Error**
   - **Solution**: System uses MERGE statements instead of UPDATE to avoid this

2. **Customer.io Relationship Not Removed**
   - **Solution**: Uses `delete_relationships` action in batched API calls

3. **Email Validation Failing**
   - **Check**: EmailOversight API key and account credits

4. **Brand Names Mismatch**
   - **Check**: Ensure Customer.io brand objects match `CUSTOMER_IO_BRAND_NAMES` mapping

5. **Duplicate User Records**
   - **Cause**: Race conditions before deterministic UUID fix (January 2025)
   - **Status**: Fixed with deterministic UUID v5 generation - duplicates should no longer occur
   - **Note**: Historical duplicates were cleaned up in January 2025

### Logs

Check Vercel function logs for detailed debugging:
- Customer.io API responses
- BigQuery operation results
- Email validation status
- User lookup results

---

## 📊 Data Structures

### Customer.io Attributes

**`subscribed_brands`**: JSON object with brand IDs as keys and timestamps as values
```json
{
  "thepicklereport": 1704873600000,
  "themixedhome": 1704873600000
}
```

**`unsubscribed_brands`**: JSON object with brand IDs as keys and timestamps as values
```json
{
  "thepicklereport": 1705312200000
}
```

**`snoozed_brands`**: JSON object with brand IDs as keys and snooze data as values
```json
{
  "thepicklereport": {
    "reactivation_timestamp": 1704067200000,
    "snooze_type": "unsubscribe_then_subscribe",
    "snooze_date": 1672531200000
  }
}
```

**Individual brand attributes**: Boolean flags per brand
- `subscribed_to_[brand]`: `true` or `false`
- `snoozed_from_[brand]`: `true` or `false`
- `[brand]_subscription_date`: ISO timestamp or `null`
- `[brand]_snooze_date`: ISO timestamp or `null`
- `[brand]_snooze_type`: `"unsubscribe_then_subscribe"` or `"subscribe_in_future"`

### BigQuery Schema

See [`docs/UPDATED_USERS_TABLE_SCHEMA.sql`](docs/UPDATED_USERS_TABLE_SCHEMA.sql) for complete schema.

---

## 🚀 Deployment

### Automatic Deployment
- Pushes to `main` branch automatically deploy to Vercel
- All environment variables configured in Vercel dashboard

### Manual Deployment
```bash
vercel --prod
```

---

## 📄 License

This project is proprietary to Unaffiliated Inc.

---

## 🤝 Support

For issues or questions, contact the development team.

---

**Last Updated**: January 2025  
**Status**: Production Ready (1 incomplete task: Customer.io webhook dashboard configuration)

---

## 🛡️ Bot-Blocking Feature

### Overview

The bot-blocking feature prevents email client "machine clicks" (like Gmail pre-clicking links for security scanning) from triggering unintended subscriptions, unsubscriptions, or snoozes.

### How It Works

1. **Immediate Redirect**: When `ENABLE_BOT_BLOCKING=true`, magic links immediately redirect to the success page (or article/redirect page) without processing the action first.

2. **Client-Side Bot Detection**: JavaScript on the destination page performs bot detection checks:
   - User agent validation
   - Headless browser detection
   - Plugin availability
   - localStorage support
   - Page visibility state
   - Known bot patterns

3. **POST Execution**: If a real browser is detected, a POST request is sent to `/execute` to complete the subscription action. If a bot is detected, the action is not executed.

4. **Dynamic UI Updates**: The page shows "Confirming..." while processing, then updates to "Success!" or "Failed [click to retry]" based on the result.

### Feature Flag

- **Environment Variable**: `ENABLE_BOT_BLOCKING`
- **Default**: `false` (disabled) - maintains existing behavior
- **When Enabled**: `true` - activates bot-blocking flow

### Programmatic Access

The `/execute` endpoint can be called directly via POST for programmatic integrations (Zapier, etc.), bypassing client-side bot detection.

### Supported Flows

- Default subscription (success page)
- Article page subscriptions (toast notification)
- External redirect subscriptions (interstitial page)
- Unsubscribe actions
- Snooze actions
- Poll page subscriptions

---
