# Meta Lead Ads Integration Setup Guide

This guide will help you connect Meta Lead Ads directly to your magic link subscription system, automatically subscribing users when they fill out your lead forms.

## 🎯 What This Does

When someone fills out a Meta Lead Ad form, this integration will:
1. **Receive the lead data** via webhook from Meta
2. **Extract the email address** from the lead form
3. **Determine which brand** the lead belongs to
4. **Create/update user record** in the unified Users table with lead data
5. **Automatically subscribe** the user via your magic link system
6. **Track everything** in the same Users table as RB2B leads and manual signups

## 📋 Prerequisites

- Meta Business Account with Lead Ads enabled
- Meta App with appropriate permissions
- Vercel deployment with environment variables configured
- BigQuery table created (see schema below)

## 🔧 Setup Steps

### 1. Update Users Table Schema

Run this SQL in BigQuery to add the new lead tracking fields to your existing Users table:

```sql
-- Add new columns to existing Users table for unified lead tracking
ALTER TABLE `unaffiliated-data.analytics.users` 
ADD COLUMN IF NOT EXISTS leadSource STRING,           -- 'meta_lead_ads', 'rb2b', 'magic_link', etc.
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

-- Note: BigQuery automatically optimizes queries on these fields, no explicit indexes needed
```

**Note**: This extends your existing Users table to support Meta leads alongside RB2B leads and manual signups in a unified data model.

### 2. Configure Environment Variables

Add these to your Vercel environment variables:

```bash
# Meta Webhook Verification Token (create a random string)
META_VERIFY_TOKEN=your_random_verification_token_here

# Meta App Access Token (get from Meta Developer Console)
META_ACCESS_TOKEN=your_meta_app_access_token

# Note: No default brand configured - leads will be skipped if brand detection fails
```

### 3. Deploy the Webhook

The webhook is already configured in `vercel.json` and will be available at:
```
https://subscription-functions.vercel.app/api/meta-webhook
```

### 4. Configure Meta Lead Ads Webhook

In Meta Business Suite:

1. **Go to Lead Ads Forms**
2. **Select your form** (or create a new one)
3. **Go to Settings → Webhooks**
4. **Add webhook URL**: `https://subscription-functions.vercel.app/api/meta-webhook`
5. **Set verification token**: Use the same value as `META_VERIFY_TOKEN`
6. **Subscribe to events**: Select `leadgen` events
7. **Test the webhook** to ensure it's working

### 5. Configure Brand Mapping

Edit `api/meta-webhook.js` to customize brand detection:

#### Option A: Form-Specific Brands
```javascript
const FORM_BRAND_MAPPING = {
  '1234567890123456': 'batmitzvahhorrorstories',  // Your form ID
  '2345678901234567': 'onetimeatcamp',            // Another form ID
};
```

#### Option B: Page-Specific Brands
```javascript
const PAGE_BRAND_MAPPING = {
  '9876543210987654': 'batmitzvahhorrorstories',  // Your page ID
  '8765432109876543': 'onetimeatcamp',            // Another page ID
};
```

#### Option C: Default Brand
Set `META_DEFAULT_BRAND` environment variable for a single brand.

## 🧪 Testing

### 1. Test Webhook Verification
```bash
curl "https://subscription-functions.vercel.app/api/meta-webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

Should return: `test123`

### 2. Test Lead Processing
Create a test lead in Meta and check:
- Vercel logs for processing details
- BigQuery `meta_leads` table for logged data
- Customer.io for new subscriber records

### 3. Verify Magic Link Integration
Check that leads are properly subscribed by:
- Looking at BigQuery `users` table
- Checking Customer.io for new records
- Verifying email campaigns are triggered

## 📊 Monitoring & Analytics

### BigQuery Queries

**View all Meta leads:**
```sql
SELECT * FROM `unaffiliated-data.analytics.meta_leads`
ORDER BY createdAt DESC
LIMIT 100;
```

**Success rate by brand:**
```sql
SELECT 
  brand,
  COUNT(*) as total_leads,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_leads,
  ROUND(SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate
FROM `unaffiliated-data.analytics.meta_leads`
GROUP BY brand
ORDER BY success_rate DESC;
```

**Failed leads with errors:**
```sql
SELECT 
  leadId,
  email,
  brand,
  error,
  createdAt
FROM `unaffiliated-data.analytics.meta_leads`
WHERE success = false
ORDER BY createdAt DESC;
```

### Vercel Logs

Monitor webhook processing in Vercel dashboard:
- Look for `🚀 META WEBHOOK HANDLER` entries
- Check for `✅` success or `❌` error messages
- Monitor processing times and error rates

## 🔧 Customization

### Custom Lead Fields

The webhook captures custom fields from your Meta forms. To use them:

1. **In your Meta form**, add custom fields
2. **In the webhook**, they'll be stored in `customFields` JSON
3. **Query them** in BigQuery or pass them to Customer.io

### Advanced Brand Detection

For complex brand detection logic, modify the `determineBrandFromMetaData` function:

```javascript
function determineBrandFromMetaData(formId, pageId) {
  // Custom logic based on:
  // - Form ID patterns
  // - Page ID patterns  
  // - Custom field values
  // - Time-based rules
  // - Geographic data
  
  return 'detected_brand';
}
```

### Error Handling

The webhook includes comprehensive error handling:
- **Meta API failures**: Logged and reported
- **Magic link failures**: Tracked in BigQuery
- **BigQuery failures**: Don't break the webhook
- **Invalid data**: Gracefully handled

## 🚨 Troubleshooting

### Common Issues

**Webhook verification fails:**
- Check `META_VERIFY_TOKEN` matches in both places
- Ensure webhook URL is accessible
- Verify Meta app permissions

**Leads not processing:**
- Check `META_ACCESS_TOKEN` is valid
- Verify Meta app has `leads_retrieval` permission
- Check Vercel logs for API errors

**Brand detection not working:**
- Update `FORM_BRAND_MAPPING` or `PAGE_BRAND_MAPPING`
- Set `META_DEFAULT_BRAND` as fallback
- Check form/page IDs in Meta Business Suite

**Magic link subscription fails:**
- Verify magic link endpoint is working
- Check email validation in magic link
- Ensure Customer.io integration is functional

### Debug Mode

Add debug logging by setting:
```bash
DEBUG_META_WEBHOOK=true
```

This will log detailed information about lead processing.

## 📈 Performance & Scaling

- **Webhook timeout**: 10 seconds (Vercel limit)
- **Concurrent leads**: Handles multiple leads per webhook call
- **Rate limiting**: Meta handles rate limiting on their end
- **BigQuery**: Partitioned table for efficient queries

## 🔒 Security

- **Webhook verification**: Meta's built-in verification
- **Access tokens**: Stored securely in Vercel environment
- **Data privacy**: Only necessary data is logged
- **Error handling**: No sensitive data in error logs

## 📞 Support

If you encounter issues:
1. Check Vercel logs for detailed error messages
2. Verify all environment variables are set
3. Test webhook verification endpoint
4. Check Meta Business Suite webhook status
5. Review BigQuery logs for data issues
