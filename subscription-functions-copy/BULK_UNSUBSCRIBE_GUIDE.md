# Bulk Unsubscribe Guide

The easiest way to bulk-unsubscribe a list of emails from a brand is to use the Python script with a CSV file.

## Quick Start

### Option 1: Python Script (Recommended)

1. **Create a CSV file** with emails:
   ```csv
   email
   user1@example.com
   user2@example.com
   user3@example.com
   ```

2. **Run the script**:
   ```bash
   python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters
   ```

### Option 2: API Endpoint (For Programmatic Use)

You can also call the API endpoint directly:

```bash
curl -X POST https://subscription-functions.vercel.app/api/bulk-unsubscribe \
  -H "Content-Type: application/json" \
  -d '{
    "emails": ["user1@example.com", "user2@example.com"],
    "brand": "heebnewsletters"
  }'
```

## CSV Format

### Simple Format (Same Brand for All)

```csv
email
user1@example.com
user2@example.com
user3@example.com
```

Then specify the brand with `--brand`:
```bash
python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters
```

### Advanced Format (Different Brands per Email)

```csv
email,brand
user1@example.com,heebnewsletters
user2@example.com,thepicklereport
user3@example.com,heebnewsletters
```

Then use `--brand-column brand`:
```bash
python3 bulk-unsubscribe.py emails.csv --brand-column brand
```

## Python Script Options

```bash
python3 bulk-unsubscribe.py <csv_file> --brand <brand_id> [options]
```

**Required:**
- `csv_file`: Path to CSV file with emails
- `--brand`: Brand ID to unsubscribe from (unless using `--brand-column`)

**Optional:**
- `--batch-size N`: Process N emails per batch (default: 1)
- `--delay N`: Delay in seconds between batches (default: 0.5)
- `--dry-run`: Preview what would be unsubscribed without actually doing it
- `--email-column NAME`: Name of email column (default: "email")
- `--brand-column NAME`: Name of brand column (if different per email)

## Examples

### Example 1: Unsubscribe 100 emails from heebnewsletters

```bash
python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters --batch-size 10 --delay 1
```

### Example 2: Dry run to preview

```bash
python3 bulk-unsubscribe.py emails.csv --brand heebnewsletters --dry-run
```

### Example 3: Different brands per email

```csv
email,brand
user1@example.com,heebnewsletters
user2@example.com,thepicklereport
user3@example.com,heebnewsletters
```

```bash
python3 bulk-unsubscribe.py emails.csv --brand-column brand
```

## API Endpoint Usage

### Simple Format (Same Brand for All Emails)

```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "brand": "heebnewsletters"
}
```

Or multiple brands:
```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "brand": ["heebnewsletters", "thepicklereport"]
}
```

### Advanced Format (Per-Email Brands)

```json
{
  "unsubscribes": [
    { "email": "user1@example.com", "brands": ["heebnewsletters"] },
    { "email": "user2@example.com", "brands": ["heebnewsletters", "thepicklereport"] }
  ]
}
```

### CSV Format (POST body as CSV text)

```bash
curl -X POST https://subscription-functions.vercel.app/api/bulk-unsubscribe \
  -H "Content-Type: text/csv" \
  -d "email,brand
user1@example.com,heebnewsletters
user2@example.com,heebnewsletters"
```

### Options

```json
{
  "emails": ["user@example.com"],
  "brand": "heebnewsletters",
  "options": {
    "batchSize": 10,
    "delayBetweenBatches": 500,
    "dryRun": false
  }
}
```

## What Happens

1. **User Lookup**: Finds user by email in BigQuery
2. **Customer.io Update**: 
   - Removes brand relationship
   - Sets `subscribed_to_[brand] = false`
   - Sets `lead_for_[brand] = false`
   - Updates `unsubscribed_brands` object with timestamp
3. **BigQuery Update**:
   - Removes brand from `subscriptions` JSON
   - Adds brand to `unsubscribed_brands` JSON with timestamp

## Response Format

```json
{
  "success": true,
  "summary": {
    "total": 100,
    "successful": 98,
    "failed": 2,
    "errors": [
      {
        "email": "user@example.com",
        "error": "User not found"
      }
    ]
  },
  "message": "Processed 100 unsubscribes: 98 successful, 2 failed"
}
```

## Notes

- **Case Insensitive**: Email addresses are normalized to lowercase
- **User Not Found**: If a user doesn't exist in BigQuery, the unsubscribe will fail (they're not subscribed anyway)
- **Batch Processing**: The script processes emails in batches to avoid timeouts
- **Idempotent**: Unsubscribing an already-unsubscribed user is safe (updates timestamp)
