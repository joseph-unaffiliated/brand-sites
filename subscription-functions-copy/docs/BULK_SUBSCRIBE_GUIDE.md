# Bulk Subscription Processing Guide

## Overview

The bulk subscribe endpoint allows you to process multiple email subscriptions at once, going through the same magic link flow as individual subscriptions. This is useful for:
- Recovering subscriptions that were missed during downtime
- Bulk importing subscribers
- Processing subscription lists

## API Endpoint

**URL**: `POST /api/bulk-subscribe`

## Usage

### Simple Format (Same Brands for All Emails)

```json
{
  "emails": [
    "user1@example.com",
    "user2@example.com",
    "user3@example.com"
  ],
  "brands": "thepicklereport"
}
```

Or multiple brands:

```json
{
  "emails": [
    "user1@example.com",
    "user2@example.com"
  ],
  "brands": ["thepicklereport", "themixedhome"]
}
```

### Advanced Format (Per-Email Brands)

```json
{
  "subscriptions": [
    {
      "email": "user1@example.com",
      "brands": ["thepicklereport"]
    },
    {
      "email": "user2@example.com",
      "brands": ["thepicklereport", "themixedhome"]
    },
    {
      "email": "user3@example.com",
      "brands": ["zitsandcake"]
    }
  ]
}
```

### Options

```json
{
  "emails": ["user@example.com"],
  "brands": "thepicklereport",
  "options": {
    "batchSize": 10,              // Process 10 emails at a time (default: 10)
    "delayBetweenBatches": 1000,  // Wait 1 second between batches (default: 1000ms)
    "dryRun": false               // Set to true to preview without processing
  }
}
```

## Examples

### cURL

```bash
# Simple bulk subscribe
curl -X POST https://subscription-functions.vercel.app/api/bulk-subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["user1@example.com", "user2@example.com"],
    "brands": "thepicklereport"
  }'

# Advanced with per-email brands
curl -X POST https://subscription-functions.vercel.app/api/bulk-subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptions": [
      {"email": "user1@example.com", "brands": ["thepicklereport"]},
      {"email": "user2@example.com", "brands": ["thepicklereport", "themixedhome"]}
    ]
  }'

# Dry run first (recommended)
curl -X POST https://subscription-functions.vercel.app/api/bulk-subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["user1@example.com", "user2@example.com"],
    "brands": "thepicklereport",
    "options": {"dryRun": true}
  }'
```

### JavaScript/Node.js

```javascript
const response = await fetch('https://subscription-functions.vercel.app/api/bulk-subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emails: [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com'
    ],
    brands: 'thepicklereport',
    options: {
      batchSize: 10,
      delayBetweenBatches: 1000
    }
  })
});

const result = await response.json();
console.log(`Processed: ${result.summary.successful} successful, ${result.summary.failed} failed`);
```

### Python

```python
import requests

response = requests.post(
    'https://subscription-functions.vercel.app/api/bulk-subscribe',
    json={
        'emails': [
            'user1@example.com',
            'user2@example.com',
            'user3@example.com'
        ],
        'brands': 'thepicklereport',
        'options': {
            'batchSize': 10,
            'delayBetweenBatches': 1000
        }
    }
)

result = response.json()
print(f"Processed: {result['summary']['successful']} successful, {result['summary']['failed']} failed")
```

## Response Format

### Success Response

```json
{
  "message": "Bulk subscription processing complete",
  "summary": {
    "total": 100,
    "successful": 95,
    "failed": 5,
    "successRate": "95.0%"
  },
  "results": [
    {
      "email": "user1@example.com",
      "success": true,
      "userID": "uuid-here",
      "brands": ["thepicklereport"],
      "isNewUser": true
    },
    {
      "email": "user2@example.com",
      "success": false,
      "error": "Email validation failed: invalid"
    }
  ],
  "errors": [
    // First 20 errors for quick review
  ]
}
```

## What Gets Processed

Each email goes through the **exact same flow** as a regular magic link subscription:

1. ✅ **Email validation** (EmailOversight API)
2. ✅ **User lookup/creation** in BigQuery
3. ✅ **Customer.io sync** (brand relationships + attributes)
4. ✅ **BigQuery update** (subscriptions, timestamps)
5. ✅ **Click tracking** (logged with utm_source=bulk_subscribe)

## Best Practices

### 1. Always Dry Run First

```json
{
  "emails": ["..."],
  "brands": "...",
  "options": {"dryRun": true}
}
```

### 2. Process in Batches

For large lists (100+ emails), use smaller batch sizes:

```json
{
  "options": {
    "batchSize": 5,
    "delayBetweenBatches": 2000
  }
}
```

### 3. Monitor Rate Limits

- Customer.io has rate limits
- BigQuery has quotas
- The endpoint includes delays between batches by default

### 4. Handle Errors

Check the `errors` array in the response and retry failed emails if needed.

## Error Handling

Common errors:

- **Email validation failed**: Email doesn't pass EmailOversight validation
- **No brands specified**: Missing or empty brands array
- **HTTP timeout**: Request to magic link endpoint timed out
- **Unknown error**: Unexpected error during processing

## Recovery Use Case

For recovering subscriptions during downtime:

1. **Export emails** from your source (spreadsheet, database, etc.)
2. **Format as JSON**:
   ```json
   {
     "emails": ["email1@example.com", "email2@example.com"],
     "brands": "thepicklereport"
   }
   ```
3. **Dry run first** to verify
4. **Execute** the bulk subscribe
5. **Review results** and retry any failures

## Limitations

- Maximum batch size: Recommended 10-20 emails per batch
- Rate limits: Respects Customer.io and BigQuery rate limits
- Timeout: 30 seconds per email
- Memory: Large lists (>1000 emails) should be split into multiple requests

## Troubleshooting

### "Method not allowed"
- Ensure you're using `POST` method

### "Missing required field"
- Check that you have either `emails` or `subscriptions` in the request body

### "No brands specified"
- Ensure `brands` is provided (string or array)

### High failure rate
- Check email format (must be valid emails)
- Verify brands exist in the system
- Check Customer.io API status
- Review error messages in response


