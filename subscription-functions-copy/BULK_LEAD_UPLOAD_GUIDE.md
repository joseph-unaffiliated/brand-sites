# Bulk Lead CSV Upload Guide

## CSV Format

### Required Columns
- **`email`** (required) - The email address of the lead
- **`brand`** (required) - The brand ID (see valid brands below)

### Optional Columns
- **`first_name`** (optional) - First name
- **`last_name`** (optional) - Last name

## Example CSV

```csv
email,brand,first_name,last_name
user1@example.com,hookuplists,John,Doe
user2@example.com,thepicklereport,Jane,Smith
user3@example.com,heebnewsletters,Bob,Johnson
```

Or without optional columns:

```csv
email,brand
user1@example.com,hookuplists
user2@example.com,thepicklereport
user3@example.com,heebnewsletters
```

## Valid Brand IDs

The following brand IDs are accepted:

- `batmitzvahhorrorstories`
- `grapejuiceandnostalgia`
- `hardresets`
- `highdiaries`
- `hipspeak`
- `hookuplists`
- `millennialvsgenz`
- `obscuremixtape`
- `onetimeatcamp`
- `the90sparent`
- `thecomingofageparty`
- `thedadsdad`
- `theeyeballerscookbook`
- `themixedhome`
- `thepackandplay`
- `thepicklereport`
- `theproudparent`
- `thequirkiest`
- `thestewardprize`
- `toddlercinema`
- `zitsandcake`
- `heebnewsletters`

## How to Upload

### Option 1: Send CSV as Text (POST request body)

```bash
curl -X POST https://subscription-functions.vercel.app/api/bulk-lead-upload \
  -H "Content-Type: text/csv" \
  --data-binary @leads.csv
```

Or inline:

```bash
curl -X POST https://subscription-functions.vercel.app/api/bulk-lead-upload \
  -H "Content-Type: text/csv" \
  -d "email,brand,first_name,last_name
user1@example.com,hookuplists,John,Doe
user2@example.com,thepicklereport,Jane,Smith"
```

### Option 2: Send as JSON

```bash
curl -X POST https://subscription-functions.vercel.app/api/bulk-lead-upload \
  -H "Content-Type: application/json" \
  -d '{
    "leads": [
      {
        "email": "user1@example.com",
        "brand": "hookuplists",
        "first_name": "John",
        "last_name": "Doe"
      },
      {
        "email": "user2@example.com",
        "brand": "thepicklereport",
        "first_name": "Jane",
        "last_name": "Smith"
      }
    ]
  }'
```

## What Happens

1. **Email Validation**: Each email is validated using EmailOversight (if configured)
2. **User Creation/Update**: User is created or updated in BigQuery with:
   - `leadData.brand_interest` = the brand ID
   - `leadSource` = 'bulk_upload'
3. **Lead Qualification Check**: System checks if user qualifies as a lead:
   - Has `brand_interest` matching the brand
   - No subscriptions
   - Not unsubscribed from that brand
4. **Customer.io Sync**: If qualified, syncs `lead_for_[brand] = true` tag to Customer.io
5. **ID Population**: For new users, ensures Customer.io ID field is populated

## Response Format

```json
{
  "success": true,
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "skipped": 0,
    "leadTagsSynced": 3,
    "errors": []
  },
  "message": "Processed 3 leads: 3 successful, 0 failed, 0 skipped, 3 lead tags synced to Customer.io"
}
```

## Notes

- **Case Insensitive**: Column headers are case-insensitive (e.g., `Email`, `EMAIL`, `email` all work)
- **Whitespace**: Leading/trailing whitespace is trimmed
- **Quoted Fields**: CSV parser handles quoted fields with commas
- **Duplicate Emails**: If a user already exists, their `leadData` will be updated
- **Lead Qualification**: Only qualified leads get tags synced to Customer.io
- **Brand Validation**: Invalid brand IDs will cause the row to be skipped
