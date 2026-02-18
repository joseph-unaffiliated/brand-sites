# Validation Retry Queue

When Email Oversight times out during magic-link subscribe, the email is still allowed to subscribe and is queued for later re-validation. A cron job re-validates these emails in batch; any that come back **invalid** are updated in BigQuery, unsubscribed from all brands, and added to global suppression (BQ + Customer.io).

## Flow

1. **Subscribe (magic-link)**  
   `validateEmail()` calls Email Oversight. If the request **times out**:
   - The subscribe flow continues (we treat timeout as non-blocking).
   - The email is inserted into `analytics.validation_retry_queue` (and `validateEmail` returns `{ valid: true, reason: 'timeout' }`).

2. **Cron: `/api/process-validation-retry`**  
   Runs every 6 hours (`0 */6 * * *`). For each row in the queue (up to 50 per run):
   - Re-call Email Oversight.
   - **Valid**: remove the row from the queue; no other changes.
   - **Invalid**:
     - Update `analytics.users`: `emailValidationStatus`, `emailValidationReason`, clear subscriptions, set `globalSuppressionDate`.
     - Call `handleGlobalSuppression` (unsubscribe from all brands in BQ + Customer.io).
     - Ensure Customer.io has `global_suppression` and `global_suppression_date` set for that person.
     - Remove the row from the queue.

## Setup

1. **Create the queue table in BigQuery**  
   Run the SQL in `docs/CREATE_VALIDATION_RETRY_QUEUE_TABLE.sql` (replace the project ID if needed).

2. **Cron**  
   The Vercel cron for `/api/process-validation-retry` is already in `vercel.json` (every 6 hours).

## Manual run

- **GET or POST**  
  `https://your-app.vercel.app/api/process-validation-retry`  
- Optional query: `?limit=50` (default 50).

Response includes `processed`, `valid`, and `invalid` counts.
