# Retention.com Integration Setup

This guide explains how to set up and use the Retention.com integration for lead capture and suppression.

## Overview

Retention.com is a lead capture service that identifies visitors to your websites. When a visitor shows interest (clicks), Retention.com sends a webhook with their information. This integration:

1. **Captures leads** from Retention.com webhooks (without auto-subscribing)
2. **Validates emails** via EmailOversight before storing
3. **Determines brand interest** from the landing page domain
4. **Stores in BigQuery** with full lead data
5. **Suppresses unsubscribed emails** in Retention.com

## Webhook Setup

### 1. Configure Webhook in Retention.com Dashboard

1. Log into your Retention.com account
2. Navigate to **Webhooks** or **Integrations** section
3. Add a new webhook with:
   - **URL**: `https://magic.unaffiliated.co/retention`
   - **Method**: POST
   - **Body Format**: JSON

### 2. Webhook Payload Structure

Retention.com will send webhooks with this structure:

```json
{
  "email": "test@retention.com",
  "email_domain": "@retention.com",
  "first_name": "First Name",
  "last_name": "Last Name",
  "clicked_at": "Mon, 28 Nov 2022 19:47:42 UTC +00:00",
  "landing_page_url": "https://yourwebsite.com",
  "landing_page_domain": "yourwebsite.com",
  "referrer": "https://some.referralurl.com",
  "page_title": "Page Title Here"
}
```

### 3. What Happens When Webhook is Received

1. **Email Validation**: Email is validated via EmailOversight API
2. **Brand Detection**: System determines brand from `landing_page_domain`
3. **BigQuery Storage**: Lead is stored in `analytics.users` table with:
   - `leadSource = 'retention'`
   - `leadData` containing full webhook payload
   - `brand_interest` in leadData (if brand can be determined)
   - Email validation results
4. **No Subscription**: Lead is **NOT** automatically subscribed to Customer.io

## Domain to Brand Mapping

The system maps landing page domains to brand IDs. Current mappings:

| Domain | Brand ID |
|--------|----------|
| `thepicklereport.com` | `thepicklereport` |
| `themixedhome.com` | `themixedhome` |
| `batmitzvahhorrorstories.com` | `batmitzvahhorrorstories` |
| ... (all 22 brands) | ... |

To add a new domain mapping, edit `api/retention-webhook.js` and add to the `DOMAIN_TO_BRAND` object.

## Suppression API Integration

When users unsubscribe via the magic link system, their email is automatically added to Retention.com's suppression list to prevent future lead capture.

### Environment Variables

Add these to your Vercel environment variables:

```bash
# Retention.com API Credentials
RETENTION_API_KEY=your_api_key_here
RETENTION_API_ID=your_api_id_here  # Optional, if Retention.com uses API ID + Key
```

### Getting API Credentials

1. Log into Retention.com
2. Go to **My Account** > **API Details**
3. Click **New Credentials**
4. Provide a name and description
5. Copy the **API Key** and **API ID** (if provided)

### How Suppression Works

1. User unsubscribes via magic link (`/unsubscribe?email=...`)
2. System processes unsubscription (removes from Customer.io, updates BigQuery)
3. System calls Retention.com suppression API with the email
4. Email is added to Retention.com suppression list
5. Retention.com will not capture this email in the future

## BigQuery Schema

Leads from Retention.com are stored in the `analytics.users` table with:

- **leadSource**: `'retention'`
- **leadData**: Full JSON payload from webhook including:
  - `email_domain`
  - `clicked_at`
  - `landing_page_url`
  - `landing_page_domain`
  - `referrer`
  - `page_title`
  - `brand_interest` (if brand determined)
- **firstName**: From `first_name` in webhook
- **lastName**: From `last_name` in webhook
- **emailValidationStatus**: Result from EmailOversight
- **emailValidationReason**: Detailed validation reason
- **emailIsDisposable**: Boolean from EmailOversight
- **emailIsFree**: Boolean from EmailOversight
- **recentClickDate**: Parsed from `clicked_at`

## Testing

### Test Webhook Locally

```bash
curl -X POST http://localhost:3000/retention \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "email_domain": "@example.com",
    "first_name": "Test",
    "last_name": "User",
    "clicked_at": "Mon, 28 Nov 2022 19:47:42 UTC +00:00",
    "landing_page_url": "https://thepicklereport.com",
    "landing_page_domain": "thepicklereport.com",
    "referrer": "https://google.com",
    "page_title": "Test Page"
  }'
```

### Verify in BigQuery

```sql
SELECT 
  email,
  firstName,
  lastName,
  leadSource,
  JSON_EXTRACT_SCALAR(leadData, '$.brand_interest') as brand_interest,
  JSON_EXTRACT_SCALAR(leadData, '$.landing_page_domain') as landing_page,
  emailValidationStatus,
  createdAt
FROM `unaffiliated-data.analytics.users`
WHERE leadSource = 'retention'
ORDER BY createdAt DESC
LIMIT 10;
```

## Troubleshooting

### Webhook Not Receiving Data

1. Check Retention.com dashboard to ensure webhook is configured
2. Check Vercel logs for incoming requests
3. Verify webhook URL is correct: `https://magic.unaffiliated.co/retention`

### Email Validation Failing

- Check EmailOversight API key is configured
- Check EmailOversight account has credits
- Invalid emails are rejected (not stored)

### Brand Not Detected

- Check `landing_page_domain` in webhook payload
- Verify domain is in `DOMAIN_TO_BRAND` mapping
- Add domain to mapping if missing

### Suppression Not Working

- Verify `RETENTION_API_KEY` is set in Vercel
- Check Retention.com API credentials are correct
- Review Vercel logs for API errors
- Suppression failures don't block unsubscription (non-blocking)

## Notes

- **Leads are NOT automatically subscribed** - they're stored for tracking and can be manually processed later
- **Email validation is required** - invalid emails are rejected
- **Brand interest is optional** - if brand can't be determined, lead is still stored
- **Suppression is non-blocking** - if suppression API fails, unsubscription still succeeds

## Related Documentation

- [Users Table Schema](USERS_TABLE_SCHEMA.md) - Complete BigQuery schema
- [API Documentation](API_DOCUMENTATION.md) - API endpoints
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Environment variables setup

