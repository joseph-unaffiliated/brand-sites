# One-Time Script: Send All Users to Retention.com Suppression List

This script sends all emails from the Users table to Retention.com's suppression list.

## Prerequisites

- Node.js installed
- Environment variables set (see below)

## Environment Variables

Set these environment variables before running:

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'  # Full JSON as string
export RETENTION_API_ID="your-api-id"
export RETENTION_API_KEY="your-api-key"
```

Or create a `.env` file (optional, requires `dotenv` package):

```
GCP_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
RETENTION_API_ID=your-api-id
RETENTION_API_KEY=your-api-key
```

## Usage

```bash
node send-all-users-to-retention-suppression.js
```

The script will:
1. Query all emails from the Users table
2. Show you a preview (first 10 emails)
3. Wait 5 seconds (press Ctrl+C to cancel)
4. Send all emails to Retention.com suppression list

## Notes

- This is a **one-time script** - it sends ALL emails from the Users table
- The script includes a 5-second delay before sending (press Ctrl+C to cancel)
- Uses the same API format as the batch suppression endpoint
- Sends emails as a CSV file via multipart/form-data

## Troubleshooting

If you get "Cannot find module 'dotenv'", that's fine - the script will work without it if you set environment variables directly.
