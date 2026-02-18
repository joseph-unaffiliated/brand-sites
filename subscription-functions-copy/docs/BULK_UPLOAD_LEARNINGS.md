# Bulk Upload Learnings & Best Practices

Learnings from the Jan 2025 bulk subscription project (1,729 records). Use this guide when running future bulk uploads of subscription records.

## Tools (Retained)

- **`api/bulk-subscribe.js`** – API endpoint: `POST /api/bulk-subscribe`. Processes up to 20 emails per request; the script handles chunking automatically.
- **`api/process-bulk-subscribe-file.js`** – Reads a CSV and calls the API in chunks (with delay between chunks). Run: `node api/process-bulk-subscribe-file.js <your-file>.csv`
- **`api/extract-failed-and-retry.js`** – Extracts failed emails from a `*_results.json` file, builds a retry CSV (with brands from the original CSV), and runs the processor on it. Run: `node api/extract-failed-and-retry.js <results.json> <original.csv>`

## Best Practices

### 1. Chunk size and timeouts

- The API processes **at most 20 emails per request** to avoid Vercel serverless timeouts.
- `process-bulk-subscribe-file.js` automatically splits large CSVs into chunks and sends multiple requests (with a short delay between chunks). No need to manually split the file.

### 2. Idempotency

- The bulk subscribe flow is **idempotent**. Safe to:
  - Include already-subscribed users (they are updated, not duplicated).
  - Re-run the same CSV multiple times.
- BigQuery uses MERGE operations; Customer.io and subscription state are updated without creating duplicates.

### 3. Retrying failures

- Some failures are transient (e.g. BigQuery "concurrent update" errors). Retrying often succeeds.
- Use **`extract-failed-and-retry.js`**:
  1. After a run, you get `<name>_results.json`.
  2. Run: `node api/extract-failed-and-retry.js <name>_results.json <name>.csv`
  3. It creates `<name>_retry.csv` and runs the processor on it.
- You can run the retry script again on the new results file (e.g. `*_retry_results.json`) if needed; repeat until failures are acceptable or zero.

### 4. BigQuery concurrent update errors

- Errors like *"Could not serialize access to table ... users due to concurrent update"* are concurrency-related.
- Retrying the same records in a **smaller batch** (e.g. via the retry script) usually resolves them. No code changes required.

### 5. CSV format

- **Header:** `email,brands` (required).
- **Rows:** One row per subscription; `email` and `brands` required.
- **Brands:** Comma-separated list of brand IDs (e.g. `heebnewsletters` or `heebnewsletters,thepicklereport`).
- See **`docs/BULK_SUBSCRIBE_CSV_GUIDE.md`** and **`BULK_SUBSCRIBE_RECOVERY_GUIDE.md`** for full format and examples.

### 6. Naming and cleanup

- Use a **project-specific prefix** for the run (e.g. `BulkSubscribeJan26.csv`). The script derives output names from the input:
  - Results: `<basename>_results.json`
  - Retry CSV: `<basename>_retry.csv`
  - Retry results: `<basename>_retry_results.json`
- Keep the source CSV elsewhere or in a single folder so you can archive or delete all `*_results.json`, `*_retry*.csv`, and part files after the project is done.

### 7. Order of operations

1. Prepare CSV with `email,brands` and optional header row.
2. Run: `node api/process-bulk-subscribe-file.js yourfile.csv`
3. Check `yourfile_results.json` for `success: false` entries.
4. If there are failures, run: `node api/extract-failed-and-retry.js yourfile_results.json yourfile.csv`
5. Repeat step 4 on retry results if needed.

## Related docs

- **BULK_SUBSCRIBE_RECOVERY_GUIDE.md** – Step-by-step recovery workflow and BigQuery query to find missed subscribers.
- **BULK_SUBSCRIBE_GUIDE.md** – API payload formats and options.
- **BULK_SUBSCRIBE_CSV_GUIDE.md** – CSV format and examples.
