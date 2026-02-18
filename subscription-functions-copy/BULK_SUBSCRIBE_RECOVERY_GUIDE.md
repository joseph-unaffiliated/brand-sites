# Bulk Subscribe Recovery Guide

## Overview

This guide helps you bulk subscribe users who "fell through the cracks" during the bot-blocking transition period. The bulk subscribe endpoint is **idempotent**, meaning it's safe to include users who are already subscribed - they won't be duplicated or cause errors.

## Step 1: Identify Users Who Need Recovery

### Option A: Query BigQuery for Clicked But Not Subscribed

Run this SQL query in BigQuery to find emails that clicked but aren't subscribed:

```sql
-- Find emails that clicked but aren't subscribed to a specific brand
-- Replace 'heebnewsletters' with your brand and adjust date range
SELECT DISTINCT c.email
FROM `your-project.analytics.clicks` c
LEFT JOIN `your-project.analytics.users` u ON c.email = u.email
WHERE c.brand = 'heebnewsletters'
  AND c.date >= '2024-01-01'  -- Adjust to your date range
  AND c.date <= '2024-01-31'   -- Adjust to your date range
  AND c.eventType = 'subscribe'
  AND (
    u.subscriptions IS NULL 
    OR JSON_EXTRACT_SCALAR(u.subscriptions, '$.heebnewsletters') IS NULL
  )
ORDER BY c.date DESC
```

### Option B: Export from Your Source

If you have a list of emails from another source (spreadsheet, database, etc.), you can use that directly.

## Step 2: Prepare Your CSV File

Create a CSV file with this format:

```csv
email,brands
user1@example.com,heebnewsletters
user2@example.com,heebnewsletters
user3@example.com,heebnewsletters
```

### CSV Format Rules

- **Header row required**: First line must be `email,brands`
- **Email column**: The email address to subscribe
- **Brands column**: Comma-separated list of brand IDs
  - For single brand: `heebnewsletters`
  - For multiple brands: `heebnewsletters,thepicklereport`
- **One subscription per row**: Each row is one email with its brands

### Important Notes

✅ **Safe to include already-subscribed users**: The endpoint is idempotent. If a user is already subscribed, it will:
- Update their subscription timestamp (harmless)
- Not create duplicates
- Not cause errors

✅ **Safe to run multiple times**: You can run the same CSV file multiple times without issues.

✅ **No duplicates**: The system uses MERGE operations that prevent duplicate subscriptions.

## Step 3: Run the Bulk Subscribe

### Option 1: Using the Script (Recommended)

**Where to put your CSV file:**
- You can put the CSV file **anywhere** on your computer
- The script accepts the full path or relative path to the file
- Examples:
  - `node api/process-bulk-subscribe-file.js recovery-emails.csv` (if CSV is in project root)
  - `node api/process-bulk-subscribe-file.js ~/Downloads/recovery-emails.csv` (full path)
  - `node api/process-bulk-subscribe-file.js /Users/joseph/Documents/recovery-emails.csv` (absolute path)

```bash
node api/process-bulk-subscribe-file.js recovery-emails.csv
```

The script will:
1. Parse your CSV file
2. Validate the format
3. Process subscriptions **one at a time** (1 second delay between each)
4. Show you a summary
5. Save detailed results to `recovery-emails_results.json` (in the same directory as your CSV)

### Option 2: Using the API Directly

If you prefer to use the API directly, convert your CSV to JSON:

```json
{
  "emails": [
    "user1@example.com",
    "user2@example.com",
    "user3@example.com"
  ],
  "brands": "heebnewsletters",
  "options": {
    "batchSize": 10,
    "delayBetweenBatches": 1000,
    "dryRun": false
  }
}
```

Then call:
```bash
curl -X POST https://subscription-functions.vercel.app/api/bulk-subscribe \
  -H "Content-Type: application/json" \
  -d @recovery-request.json
```

## Step 4: Review Results

After processing, check:

1. **Console output**: Shows summary (total, successful, failed)
2. **Results JSON file**: Detailed results for each email
   - `success: true` = subscription processed successfully
   - `success: false` = check the `error` field

### Example Output

```
✅ Parsed 150 subscriptions from CSV
📋 Sample subscriptions:
  - user1@example.com → heebnewsletters
  - user2@example.com → heebnewsletters
  ... and 148 more

🚀 Processing subscriptions via https://subscription-functions.vercel.app/api/bulk-subscribe...

✅ Processing complete!
📊 Summary:
   Total: 150
   Successful: 148
   Failed: 2
   Success Rate: 98.7%

💾 Results saved to: recovery-emails_results.json
```

## What Gets Processed

Each email goes through the **exact same flow** as a regular subscription:

1. ✅ **Email validation** (EmailOversight API)
2. ✅ **User lookup/creation** in BigQuery
3. ✅ **Customer.io sync** (brand relationships + attributes)
4. ✅ **BigQuery update** (subscriptions, timestamps)
5. ✅ **Click tracking** (logged with utm_source=bulk_subscribe, utm_campaign=recovery)

## Troubleshooting

### "HTTP 400: Missing email or brand"
- Check that your CSV has both `email` and `brands` columns
- Verify no empty rows

### "Email validation failed"
- Some emails may fail EmailOversight validation
- These will be skipped (check results JSON for details)

### High failure rate
- Check email format (must be valid emails)
- Verify brand IDs are correct
- Check Customer.io API status
- Review error messages in results JSON

### Processing is slow
- This is normal - the endpoint processes one at a time to respect rate limits
- Default: 1 second delay between each email
- For large lists, this ensures stability and prevents API rate limit issues

## Best Practices

1. **Test with a small file first** (5-10 emails) to verify everything works
2. **Use dry run** to preview what will be processed:
   ```json
   {
     "emails": ["..."],
     "brands": "heebnewsletters",
     "options": {"dryRun": true}
   }
   ```
3. **Check results JSON** for detailed information on each email
4. **Retry failed emails** by creating a new CSV with just the failed ones

## Brand IDs Reference

Common brand IDs:
- `heebnewsletters` - Heeb Newsletters
- `thepicklereport` - The Pickle Report
- `hookuplists` - Hookup Lists
- `the90sparent` - The 90s Parent
- `hardresets` - Hard Resets
- (See full list in `docs/BULK_SUBSCRIBE_CSV_GUIDE.md`)

## Technical Details

- **Endpoint**: Uses `/execute` endpoint (bypasses bot detection)
- **Method**: POST with JSON body
- **Idempotency**: Safe to run multiple times with same emails
- **Rate limiting**: Processes one at a time (sequential) with 1 second delay between each
- **Timeout**: 30 seconds per email
- **CSV Location**: Can be anywhere - provide full path or relative path when running the script
