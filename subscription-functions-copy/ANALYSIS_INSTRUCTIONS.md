# Analyzing Heeb Leads Status

## Overview
You have 4,358 emails in your CSV and see 1,039 people with `lead_for_heebnewsletters = true` in Customer.io. This guide will help you determine:
- Which emails already have the lead tag ✅
- Which failed validation ❌
- Which are already subscribed/unsubscribed 🚫
- Which still need processing 📝

## Step 1: Run BigQuery Analysis

1. **Generate the SQL query:**
   ```bash
   python3 generate-analysis-sql.py
   ```
   This creates `analyze-heeb-leads-query.sql`

2. **Run the SQL in BigQuery Console:**
   - Open BigQuery console
   - Copy and paste the SQL from `analyze-heeb-leads-query.sql`
   - Run the query
   - Export results to CSV

3. **The query will show:**
   - `QUALIFIES_AS_LEAD`: Emails that should have the lead tag (these are the ones to check in Customer.io)
   - `ALREADY_SUBSCRIBED`: Emails that have subscriptions (cannot be leads)
   - `UNSUBSCRIBED`: Emails unsubscribed from heebnewsletters
   - `FAILED_VALIDATION`: Emails that failed email validation
   - `WRONG_BRAND_INTEREST`: Emails with wrong brand interest
   - `NOT_IN_BQ`: Emails not in BigQuery (from second query)

## Step 2: Check Customer.io Lead Tags

1. **Export emails that QUALIFY_AS_LEAD from BigQuery results to CSV** (save as `qualifies-as-leads.csv`)

2. **Set Customer.io credentials:**
   ```bash
   export CIO_SITE_ID="your_site_id"
   export CIO_API_KEY="your_api_key"
   ```

3. **Run the Customer.io check:**
   ```bash
   python3 check-cio-lead-tags.py
   ```
   This will check which of the qualifying emails already have the lead tag in Customer.io.

## Step 3: Summary

After both steps, you'll have:

### Already Processed ✅
- Emails with `QUALIFIES_AS_LEAD` status in BigQuery AND `has_tag = true` in Customer.io
- These are the 1,039 you see in Customer.io (approximately)

### Needs Processing 📝
- Emails with `QUALIFIES_AS_LEAD` status but `no_tag` or `not_found` in Customer.io
- Emails with `NOT_IN_BQ` status (not in BigQuery at all)

### Failed/Excluded ❌
- `FAILED_VALIDATION`: Email validation failed
- `ALREADY_SUBSCRIBED`: Has subscriptions, cannot be lead
- `UNSUBSCRIBED`: Unsubscribed from heebnewsletters
- `WRONG_BRAND_INTEREST`: Wrong brand interest set

## Alternative: Use the Analysis Endpoint

Once deployed, you can use the analysis endpoint:

```bash
python3 run-analysis.py
```

This will automatically:
1. Read the CSV
2. Query BigQuery for all emails
3. Check Customer.io for lead tags
4. Generate CSV files with results

**Note:** The endpoint needs to be deployed to Vercel first. The file is at `api/analyze-heeb-leads-endpoint.js` and has been added to `vercel.json`.
