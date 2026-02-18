# Updated Brand Unsubscription System

This guide explains the updated brand-specific unsubscription system that redirects users to brand websites and logs unsubscriptions in both Customer.io and BigQuery.

## 🎯 Updated Specifications

### **1. Brand Website Redirect**
- ✅ **Redirects to brand website** (e.g., `zitsandcake.com?unsubscribed=true`)
- ✅ **No subscription details shown** - clean redirect experience
- ✅ **Uses `?unsubscribed=true`** instead of `?subscribed=true`

### **2. Dual Logging System**
- ✅ **Customer.io**: Removes brand relationship + updates attributes
- ✅ **BigQuery**: Logs unsubscription with brand and date in `unsubscribed_brands` field
- ✅ **Re-unsubscription handling**: Keeps only most recent unsubscribe date

### **3. Enhanced Data Tracking**
- ✅ **`unsubscribed_brands`** attribute in Customer.io (array of brand objects)
- ✅ **`unsubscribed_brands`** field in BigQuery users table (JSON string)
- ✅ **Automatic cleanup** of old unsubscription dates

## 🔄 How It Works Now

### Step 1: User Clicks Unsubscribe Link
```
https://magic.zitsandcake.com/unsubscribe?email=user@example.com&action=unsubscribe
```

OR for multiple brands:
```
https://magic.unaffiliated.com/unsubscribe?email=user@example.com&brands=zitsandcake,hardresets&action=unsubscribe
```

### Step 2: System Processes Unsubscription
1. **Removes brand relationship** from Customer.io
2. **Updates Customer.io attributes**:
   - Removes brand relationship from Customer.io
   - Updates `unsubscribed_brands` object with timestamp
3. **Logs to BigQuery**:
   - Updates `unsubscribed_brands` field in users table
   - Removes old unsubscription entries for same brand
   - Keeps only most recent unsubscribe timestamp

### Step 3: Redirect to Brand Website
```
🔄 Redirecting to: https://zitsandcake.com?unsubscribed=true
```

## 📊 Data Structure

### Customer.io Attributes
```json
{
  "subscribed_brands": {
    "zitsandcake": 1704873600000,
    "hardresets": 1705066200000
  },
  "unsubscribed_brands": {
    "zitsandcake": 1705312200000
  }
}
```

### BigQuery Users Table
```sql
-- Consistent structure for both subscription states
subscriptions: STRING     -- JSON string: {"zitsandcake":{"subscribed_timestamp":1704873600000,"subSource":"utm_source"}}
unsubscribed_brands: STRING     -- JSON string: {"zitsandcake":1705312200000,"hardresets":1705761900000}

-- Example data for user who subscribed to multiple brands and unsubscribed from one:
subscriptions: '{"zitsandcake":{"subscribed_timestamp":1704873600000,"subSource":"magic_link"},"hardresets":{"subscribed_timestamp":1705066200000,"subSource":"magic_link"}}'
unsubscribed_brands: '{"zitsandcake":1705312200000}'
```

## 🔧 Implementation Details

### 1. Updated Brand Management Functions

```javascript
// Enhanced removeBrandRelationships function
async function removeBrandRelationships(personId, brandObjectIds, reason = 'user_request') {
    // Removes brand relationships
    // Updates Customer.io attributes
    // Returns unsubscribe date for BigQuery logging
}

// New BigQuery logging function
async function logUnsubscriptionToBigQuery(userId, brandId, unsubscribeDate, reason) {
    // Gets current user data
    // Removes old unsubscription entries for same brand
    // Adds new unsubscription entry
    // Updates users table
}
```

### 2. Updated Webhook Handlers

```javascript
// Brand unsubscribe webhook
export function createBrandUnsubscribeWebhookHandler() {
    // Processes unsubscription
    // Logs to BigQuery
    // Returns redirect URL
}

// Unsubscribe page handler
export function createUnsubscribePageHandler() {
    // Processes unsubscription
    // Logs to BigQuery
    // Redirects to brand website
}
```

## 🚀 Usage Examples

### 1. Webhook Unsubscription
```bash
curl -X POST "https://your-domain.com/webhook/brand-unsubscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "person_id": "user_123",
    "brand_id": "zitsandcake"
  }'

# Response:
{
  "success": true,
  "brand_unsubscribed": "zitsandcake",
  "redirect_url": "https://zitsandcake.com?unsubscribed=true",
  "unsubscribe_date": "2024-01-15T10:30:00Z",
  "bigquery_logged": true
}
```

### 2. Direct Unsubscribe Link
```
https://magic.zitsandcake.com/unsubscribe?email=user@example.com&action=unsubscribe
```

OR for multiple brands:
```
https://magic.unaffiliated.com/unsubscribe?email=user@example.com&brands=zitsandcake,hardresets&action=unsubscribe
```

# Automatically redirects to:
https://zitsandcake.com?unsubscribed=true
```

### 3. Email Template Integration
```html
<!-- In your Customer.io email template -->
<div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
    <p>
        <a href="https://magic.zitsandcake.com/unsubscribe?email={{email}}&action=unsubscribe" 
           style="color: #666; text-decoration: underline;">
            Unsubscribe from Zits and Cake
        </a>
    </p>
</div>
```

## 🔍 Re-unsubscription Handling

### Scenario: User Unsubscribes from Multiple Brands
1. **First unsubscription**: Zits and Cake on `2024-01-15T10:30:00Z`
2. **Second unsubscription**: Hard Resets on `2024-01-20T14:45:00Z`
3. **User re-subscribes to Zits and Cake**: Brand relationship restored
4. **Third unsubscription**: Zits and Cake again on `2024-01-25T09:15:00Z`

### Result: Each Brand Keeps Its Own Timestamp
```json
{
  "subscribed_brands": {
    "hardresets": 1705066200000
  },
  "unsubscribed_brands": {
    "zitsandcake": 1706166900000,  // Most recent for this brand
    "hardresets": 1705761900000    // Still original timestamp
  }
}
```

## 📊 BigQuery Schema Update

### Required Schema Changes
```sql
-- Add this field to your users table
ALTER TABLE `your-project.analytics.users` 
ADD COLUMN unsubscribed_brands STRING;
```

### Query Examples
```sql
-- Find users who unsubscribed from specific brand
SELECT userID, email, unsubscribed_brands
FROM `your-project.analytics.users`
WHERE JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.zitsandcake') IS NOT NULL;

-- Find users who unsubscribed from SPECIFIC brand in last 7 days
SELECT userID, email, 
       JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.zitsandcake') as brand_timestamp
FROM `your-project.analytics.users`
WHERE JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.zitsandcake') > 
      UNIX_MILLIS(TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY));

-- Find users who unsubscribed from multiple brands with different timestamps
SELECT userID, email,
       JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.zitsandcake') as zitsandcake_timestamp,
       JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.hardresets') as hardresets_timestamp
FROM `your-project.analytics.users`
WHERE JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.zitsandcake') IS NOT NULL
  AND JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.hardresets') IS NOT NULL;

-- Count unsubscriptions by brand with timestamps
SELECT 
  brand_key,
  COUNT(*) as unsubscription_count,
  MIN(JSON_EXTRACT_SCALAR(unsubscribed_brands, CONCAT('$.', brand_key))) as earliest_timestamp,
  MAX(JSON_EXTRACT_SCALAR(unsubscribed_brands, CONCAT('$.', brand_key))) as latest_timestamp
FROM `your-project.analytics.users`,
UNNEST(JSON_EXTRACT_ARRAY(JSON_KEYS(unsubscribed_brands))) as brand_key
WHERE unsubscribed_brands IS NOT NULL
GROUP BY brand_key
ORDER BY unsubscription_count DESC;

-- Find users who unsubscribed from brand A before brand B
SELECT userID, email,
       JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.zitsandcake') as zitsandcake_timestamp,
       JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.hardresets') as hardresets_timestamp
FROM `your-project.analytics.users`
WHERE JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.zitsandcake') < 
      JSON_EXTRACT_SCALAR(unsubscribed_brands, '$.hardresets');
```

## 🎨 Brand Website Integration

### Handle `?unsubscribed=true` Parameter
```javascript
// On brand websites (zitsandcake.com, hardresets.com, etc.)
function checkUnsubscriptionSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const isUnsubscribed = urlParams.get('unsubscribed') === 'true';
  
  if (isUnsubscribed) {
    showUnsubscribeConfirmation();
    // Clean up URL
    const url = new URL(window.location);
    url.searchParams.delete('unsubscribed');
    window.history.replaceState({}, '', url);
  }
}

function showUnsubscribeConfirmation() {
  // Show brand-specific unsubscription confirmation
  const message = document.createElement('div');
  message.innerHTML = `
    <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
      ✅ You've been unsubscribed from our newsletter. You won't receive any more emails from us.
    </div>
  `;
  document.body.insertBefore(message, document.body.firstChild);
}
```

## 🚀 Setup Checklist

1. **✅ Deploy updated webhook handlers**
2. **✅ Add `unsubscribed_brands` field to BigQuery users table**
3. **✅ Update email templates** with brand-specific unsubscribe links
4. **✅ Add unsubscription handling** to brand websites
5. **✅ Test complete flow** from email click to brand website redirect

## 💡 Benefits

- ✅ **Clean user experience** - Direct redirect to brand website
- ✅ **Comprehensive logging** - Both Customer.io and BigQuery tracking
- ✅ **Data integrity** - Only most recent unsubscription dates kept
- ✅ **Brand-specific messaging** - Each brand can handle unsubscription confirmation
- ✅ **Analytics ready** - Easy to query unsubscription patterns in BigQuery

Your updated brand unsubscription system is now ready! Users get a clean redirect experience while you maintain comprehensive tracking across both platforms. 🎉
