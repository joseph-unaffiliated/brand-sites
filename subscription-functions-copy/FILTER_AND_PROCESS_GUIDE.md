# Filter and Process Heeb Leads

This guide helps you process only the remaining leads by excluding emails that are already successfully processed in Customer.io.

## Step 1: Export Already-Processed Emails from Customer.io

1. Go to Customer.io dashboard
2. Navigate to People/Profiles
3. Filter by attribute: `lead_for_heebnewsletters = true`
4. Export the list as CSV (Customer.io export feature)
5. Save the CSV file (e.g., `customers-2026-01-13_19-42.csv`)

The script automatically detects Customer.io CSV exports and extracts emails where `lead_for_heebnewsletters = true`.

**Alternative:** You can also provide a simple text file with one email per line, and the script will work with that too.

## Step 2: Run the Filter and Process Script

```bash
# Using default path (looks for customers-2026-01-13_19-42.csv in Downloads)
python3 filter-and-process-heeb-leads.py

# Or specify the Customer.io CSV export file path
python3 filter-and-process-heeb-leads.py /path/to/customers-export.csv

# Or use a simple text file (one email per line)
python3 filter-and-process-heeb-leads.py /path/to/processed-emails.txt
```

The script will:
1. ✅ Read the original CSV (`Heeb's List - Active Leads.csv`)
2. ✅ Read the processed emails file
3. ✅ Filter out already-processed emails
4. ✅ Show you how many remain to process
5. ✅ Ask for confirmation
6. ✅ Process only the remaining emails in batches

## Example Output

```
============================================================
🔍 Filter and Process Heeb Leads
============================================================

📁 Processed emails file: /Users/joseph/Downloads/customers-2026-01-13_19-42.csv
📁 Original CSV: /Users/joseph/Downloads/Heeb's List - Active Leads.csv

📖 Reading processed emails from /Users/joseph/Downloads/customers-2026-01-13_19-42.csv...
   Found 1056 emails with lead_for_heebnewsletters=true
📖 Reading CSV file: /Users/joseph/Downloads/Heeb's List - Active Leads.csv...
   Found 4358 leads in CSV

📊 Filtering Results:
   Original: 4358 leads
   Already processed: 1039 leads
   Remaining to process: 3319 leads

⚠️  About to process 3319 leads
Continue? (y/n): y

🚀 Processing 3319 leads in 166 batches...
============================================================
...
```

## Notes

- The script processes in batches of 20 to avoid Vercel timeouts
- It will skip emails that are already in the processed list
- Failed batches will be reported but won't stop the process
- You can run it multiple times - it will skip already-processed emails each time
