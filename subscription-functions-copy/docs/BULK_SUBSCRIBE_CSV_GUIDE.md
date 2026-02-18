# Bulk Subscribe from CSV File

## Quick Start

1. **Create a CSV file** with your emails and brands
2. **Run the script** to process them

## CSV File Format

Create a file called `bulk-subscribe.csv` (or any name) with this format:

```csv
email,brands
user1@example.com,thepicklereport
user2@example.com,thepicklereport
user3@example.com,themixedhome
user4@example.com,thepicklereport,themixedhome
user5@example.com,zitsandcake
```

### Format Rules

- **Header row required**: First line must be `email,brands`
- **Email column**: The email address to subscribe
- **Brands column**: Comma-separated list of brand IDs (e.g., `thepicklereport,themixedhome`)
- **One subscription per row**: Each row is one email with its brands

### Example CSV

```csv
email,brands
john@example.com,thepicklereport
jane@example.com,thepicklereport,themixedhome
bob@example.com,zitsandcake
alice@example.com,thepicklereport
```

## Usage

### Option 1: Using the Script (Recommended)

```bash
node api/process-bulk-subscribe-file.js bulk-subscribe.csv
```

The script will:
1. Parse your CSV file
2. Validate the format
3. Send all subscriptions to the bulk subscribe endpoint
4. Show you a summary of results
5. Save detailed results to a JSON file

### Option 2: Manual Processing

1. Open your CSV file
2. Convert it to JSON format (see below)
3. Use the bulk subscribe API endpoint

## Converting CSV to JSON

If you prefer to use the API directly, convert your CSV to this JSON format:

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
    }
  ]
}
```

Then call:
```bash
curl -X POST https://subscription-functions.vercel.app/api/bulk-subscribe \
  -H "Content-Type: application/json" \
  -d @subscriptions.json
```

## Brand IDs Reference

Use these brand IDs in your CSV:

- `thepicklereport` - The Pickle Report
- `themixedhome` - The Mixed Home
- `batmitzvahhorrorstories` - Bat Mitzvah Horror Stories
- `hardresets` - Hard Resets
- `grapejuiceandnostalgia` - Grape Juice and Nostalgia
- `highdiaries` - High Diaries
- `hipspeak` - Hipspeak
- `hookuplists` - Hookup Lists
- `millennialvsgenz` - Millennial vs Gen Z
- `obscuremixtape` - Obscure Mixtape
- `onetimeatcamp` - One Time at Camp
- `the90sparent` - The 90s Parent
- `thecomingofageparty` - The Coming of Age Party
- `thedadsdad` - The Dad's Dad
- `theeyeballerscookbook` - The Eyeballer's Cookbook
- `thepackandplay` - The Pack and Play
- `theproudparent` - The Proud Parent
- `thequirkiest` - The Quirkiest
- `thestewardprize` - The Steward Prize
- `toddlercinema` - Toddler Cinema
- `zitsandcake` - Zits and Cake

## Example Workflow

1. **Create your CSV file**:
   ```csv
   email,brands
   user1@example.com,thepicklereport
   user2@example.com,thepicklereport,themixedhome
   ```

2. **Run the script**:
   ```bash
   node api/process-bulk-subscribe-file.js bulk-subscribe.csv
   ```

3. **Check the results**:
   - Console output shows summary
   - Detailed results saved to `bulk-subscribe_results.json`

## Output

The script will show:
- Number of subscriptions parsed
- Processing summary (total, successful, failed)
- List of errors (if any)
- Results saved to a JSON file

Example output:
```
✅ Parsed 100 subscriptions from CSV
📋 Sample subscriptions:
  - user1@example.com → thepicklereport
  - user2@example.com → thepicklereport, themixedhome
  ... and 98 more

🚀 Processing subscriptions via https://subscription-functions.vercel.app/api/bulk-subscribe...

✅ Processing complete!
📊 Summary:
   Total: 100
   Successful: 95
   Failed: 5
   Success Rate: 95.0%

💾 Results saved to: bulk-subscribe_results.json
```

## Troubleshooting

### "CSV must have an 'email' column"
- Make sure your first row has `email,brands` (case-insensitive)

### "Missing email" or "Missing brands"
- Check that all rows have both email and brands columns
- Make sure there are no empty rows

### "No valid subscriptions found"
- Verify your CSV has at least one data row (after the header)
- Check that emails and brands are properly formatted

### Processing errors
- Check the results JSON file for detailed error messages
- Common issues:
  - Invalid email format
  - Brand ID doesn't exist
  - Email validation failed

## Tips

1. **Test with a small file first** (5-10 emails)
2. **Check the results JSON** for detailed information
3. **Retry failed emails** by creating a new CSV with just the failed ones
4. **Use Excel/Google Sheets** to create and edit your CSV easily

## File Location

- **CSV file**: Place it in the project root (same directory as `package.json`)
- **Results file**: Created in the same location as your CSV file


