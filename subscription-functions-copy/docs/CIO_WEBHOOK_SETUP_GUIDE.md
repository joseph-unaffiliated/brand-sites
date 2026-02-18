# Customer.io Webhook Setup Guide

## Step-by-Step Configuration

### 1. Action Section

**Action Name**: 
```
BigQuery Sync - Clicks & Campaigns
```
(Or any descriptive name you prefer)

**Action Type**: 
- Keep "Send" selected ✅

### 2. Trigger Section

**Option A: Code Mode (Recommended)**

Enable "Code mode" toggle and paste this code (single line with lowercase `or`):

**For Segment-style events (if events come as "Email Delivered" with spaces):**

**Recommended (Optimized for Performance):**
```javascript
event = "Email Opened" or event = "Email Link Clicked" or event = "Email Marked as Spam"
```

**Full Configuration (All Events):**
```javascript
event = "Email Sent" or event = "Email Opened" or event = "Email Link Clicked" or event = "Email Bounced" or event = "Email Unsubscribed" or event = "Email Delivered" or event = "Email Marked as Spam" or event = "person.created" or event = "person.updated"
```

**Note**: Customer.io uses "Email Link Clicked" (not "Email Clicked") for click events.

**OR for Customer.io native format (if events come as "email.delivered" with dots):**

**Recommended (Optimized for Performance):**
```javascript
event = "email.opened" or event = "email.clicked" or event = "email.spam_complaint"
```

**Full Configuration (All Events):**
```javascript
event = "email.sent" or event = "email.opened" or event = "email.clicked" or event = "email.bounced" or event = "email.unsubscribed" or event = "email.delivered" or event = "email.spam_complaint" or event = "person.created" or event = "person.updated"
```

**Note**: 
- The **recommended** configuration only tracks opens, clicks, and spam complaints to reduce BigQuery load and avoid quota errors
- For spam complaints, the event name may vary. See "Finding the Correct Spam Complaint Event Name" section below
- If you need other events (sent, delivered, bounced, unsubscribed), use the full configuration

**Note**: Based on your data, you're using Segment-style format, so use the first option with title case and spaces.

**Note**: 
- In Customer.io, "Track Event Name" in visual mode translates to `event=` in code mode
- Do NOT include `event = "track"` - that's for link tracking, not webhook event types
- FQL (Filter Query Language) requires lowercase `or` operators, not uppercase `OR`
- The trigger conditions determine WHEN to send data to your webhook endpoint

**Option B: Visual Mode (Alternative)**

If you prefer not to use code mode:

**Condition Logic**: 
- Select "Any" (we want ANY of these events to trigger the webhook)

**Add Conditions**:

Click "+ Add Condition" and add these conditions one by one. For each condition:
- **Field**: Select "Track Event Name" (this translates to `event=` in code mode)
- **Operator**: Select "is"
- **Value**: Enter the event name

**Recommended Events (Optimized for Performance):**

1. **Email Opened**:
   - Track Event Name `is` `Email Opened` (Segment-style) or `email.opened` (native)

2. **Email Link Clicked**:
   - Track Event Name `is` `Email Link Clicked` (Segment-style) or `email.clicked` (native)
   - **Note**: Use "Email Link Clicked" not "Email Clicked"

3. **Email Marked as Spam**:
   - Track Event Name `is` `Email Marked as Spam` (Segment-style - correct name)
   - OR Track Event Name `is` `email.spam_complaint` (native format)
   - Note: May also appear as `Email Spam Complaint` in some configurations (legacy name)

**Additional Events (Optional - Increases BigQuery Load):**

4. **Email Sent**:
   - Track Event Name `is` `Email Sent` (Segment-style) or `email.sent` (native)

5. **Email Bounced**:
   - Track Event Name `is` `Email Bounced` (Segment-style) or `email.bounced` (native)

6. **Email Unsubscribed**:
   - Track Event Name `is` `Email Unsubscribed` (Segment-style) or `email.unsubscribed` (native)

7. **Email Delivered**:
   - Track Event Name `is` `Email Delivered` (Segment-style) or `email.delivered` (native)

8. **Person Created**:
   - Track Event Name `is` `person.created`

9. **Person Updated**:
   - Track Event Name `is` `person.updated`

**Note**: 
- The recommended configuration (opens, clicks, spam complaints) reduces BigQuery load and helps avoid quota errors
- The correct event name for spam is **"Email Marked as Spam"** (not "Email Spam Complaint")

### Finding the Correct Spam Complaint Event Name

Since you don't want to test by marking an email as spam, here are ways to find the correct event name:

#### Method 1: Check Customer.io's Available Events List

1. **In Customer.io Webhook Configuration**:
   - When adding a condition in Visual Mode, click the dropdown for "Track Event Name"
   - Look through the list of available events
   - Search for terms like "spam", "complaint", or "abuse"
   - Common variations:
     - `Email Spam Complaint`
     - `email.spam_complaint`
     - `email.spamcomplaint`
     - `email.abuse_report`
     - `Email Abuse Report`

2. **In Customer.io Documentation**:
   - Go to Customer.io Settings → Integrations → Webhooks
   - Look for a list of available webhook events
   - Check the "Reporting Webhooks" section for event types

#### Method 2: Use Customer.io's Test Feature

1. **In the Webhook Configuration**:
   - Look for a "Test" or "Send Test" button/tab
   - If available, you can select different event types from a dropdown
   - Look for spam-related events in the test event list
   - This will show you the exact event name format Customer.io uses

2. **Send a Test Event**:
   - Select the spam complaint event from the test dropdown
   - Click "Send Test Event"
   - Check your Vercel logs to see what event name was received
   - The logs will show: `📋 Event type: [exact-event-name]`

#### Method 3: Check Customer.io Activity Logs

1. **If you have historical spam complaints**:
   - Go to Customer.io → Activity Logs or Event History
   - Look for any spam complaint events that occurred in the past
   - The event name shown there is what you should use in the webhook trigger

#### Method 4: Contact Customer.io Support

If you can't find the event name:
- Contact Customer.io support and ask: "What is the exact webhook event name for spam complaints?"
- They can provide the exact event name format for your account

#### Method 5: Use a Wildcard (If Supported)

Some Customer.io configurations allow wildcards:
```javascript
event = "Email Spam*" or event = "email.spam*"
```
However, this is less precise and may catch unintended events.

### 3. Data Structure Section

#### URL
```
https://magic.unaffiliated.co/api/cio-webhook
```

#### HTTP Method
- Keep "POST" selected ✅

#### Enable Batching
- Keep "False" selected ✅
- We want real-time events, not batched

#### Headers (Optional)
You can leave this empty, or add custom headers if needed:

**If you want to add a custom header** (e.g., for identification):
- Click "Add Key/Value"
- Key: `X-Webhook-Source`
- Value: `customer-io`

**Note**: The webhook handler will verify signatures if `CIO_WEBHOOK_SECRET` is set in your environment variables. Customer.io may automatically add signature headers.

#### Payload (Data)

**Option 1: Use Default Payload (Recommended)**

Customer.io will send its standard webhook payload format. Our handler supports this format. You can:

- Leave the payload field as `$.` (which means "send entire event")
- Or click "Edit Key/Value" and ensure it's set to send the full event object

**Option 2: Custom Payload Structure**

If you want to customize the payload, you can structure it like this:

```json
{
  "event_id": "$.event_id",
  "event_type": "$.event_type",
  "timestamp": "$.timestamp",
  "data": {
    "person": "$.data.person",
    "campaign": "$.data.campaign",
    "link": "$.data.link",
    "device": "$.data.device"
  }
}
```

**However, we recommend using Option 1** (default payload) because:
- Our handler already supports Customer.io's standard format
- It includes all necessary fields automatically
- Less configuration means fewer errors

### 4. Save and Enable

1. Click "Save" or "Save Action"
2. Make sure the action is **Enabled** (there should be a toggle or checkbox)
3. The yellow warning banner should disappear once the action is configured and enabled

## Testing the Webhook

### Quick Test: Click an Email

The simplest way to test:

1. **Send yourself a test email** from Customer.io (or use an existing campaign)
2. **Click a link in the email** - this will trigger an `email.clicked` event
3. **Open the email** - this will trigger an `email.opened` event (if tracking is enabled)

### Comprehensive Testing Steps

#### 1. Check Vercel Logs (Real-time)

Go to your Vercel dashboard → Your project → Functions → `/api/cio-webhook` → Logs

You should see:
```
🔔 Customer.io webhook received
📋 Event type: email.clicked, Event ID: [some-id]
🔄 Syncing email event to clicks table: email.clicked (clicked)
✅ Successfully synced email event to clicks table: [event-id]
```

**If you see errors**, check:
- Webhook URL is correct
- Webhook is enabled in Customer.io
- Environment variables are set in Vercel

#### 2. Check BigQuery for New Records

Run this query in BigQuery:

```sql
SELECT 
  clickID,
  userID,
  email,
  campaignID,
  cio_event_type,
  cio_campaign_name,
  date,
  source
FROM `unaffiliated-data.analytics.clicks`
WHERE source = 'customer_io'
ORDER BY date DESC
LIMIT 20
```

You should see:
- New records with `source = 'customer_io'`
- `cio_event_type` values like: `'clicked'`, `'opened'`, `'sent'`
- Recent `date` timestamps

#### 3. Test Different Event Types

To test all event types, you can:

**Email Events:**
- ✅ `email.sent` - Automatically triggered when email is sent
- ✅ `email.opened` - Triggered when email is opened (if tracking enabled)
- ✅ `email.clicked` - Triggered when link is clicked
- ✅ `email.bounced` - Triggered if email bounces (hard to test intentionally)
- ✅ `email.unsubscribed` - Triggered when unsubscribe link is clicked
- ✅ `email.delivered` - Automatically triggered when email is delivered
- ✅ `email.spam_complaint` / `Email Marked as Spam` - Triggered when user marks email as spam (correct event name: "Email Marked as Spam")

**Person Events:**
- ✅ `person.created` - Triggered when new person is created in Customer.io
- ✅ `person.updated` - Triggered when person attributes are updated

#### 4. Use Customer.io Tester (If Available)

If Customer.io has a "Tester" tab in the webhook configuration:
1. Go to the "Tester" tab
2. Select an event type (e.g., `email.clicked`)
3. Click "Send Test Event"
4. Check Vercel logs to see if it was received

**For Spam Complaints**:
- Look for spam-related events in the test event dropdown
- If available, select "Email Spam Complaint" or similar
- Send a test event to see the exact payload structure
- Check Vercel logs to confirm the event name format

#### 5. Monitor for Issues

Watch for:
- ❌ **401 errors** - Webhook signature verification failing
- ❌ **500 errors** - BigQuery query errors or missing fields
- ❌ **No logs** - Webhook not being triggered (check Customer.io webhook status)
- ❌ **Missing data** - Events received but not appearing in BigQuery

### Expected Results

After clicking an email, within a few seconds you should see:

1. **Vercel Log**: `🔔 Customer.io webhook received` with event details
2. **BigQuery**: New row in `clicks` table with:
   - `cio_event_type = 'clicked'`
   - `source = 'customer_io'`
   - `url` = the link that was clicked
   - `date` = timestamp of the click

### Troubleshooting Test Failures

**No webhook received:**
- Check webhook is enabled in Customer.io
- Verify URL is exactly: `https://magic.unaffiliated.co/api/cio-webhook`
- Check Customer.io webhook logs/delivery status

**Webhook received but no BigQuery data:**
- Check Vercel logs for errors
- Verify `GCP_PROJECT_ID` and `GCP_SERVICE_ACCOUNT_KEY` are set in Vercel
- Check BigQuery permissions for service account

**Wrong data in BigQuery:**
- Check webhook payload structure in Vercel logs
- Verify event data mapping is correct

## Troubleshooting

### No events appearing in BigQuery

1. **Check if webhook is enabled**: Make sure the action is enabled in Customer.io
2. **Check Vercel logs**: Look for errors in the webhook handler
3. **Verify URL**: Ensure the URL is exactly `https://magic.unaffiliated.co/api/cio-webhook`
4. **Check event types**: Make sure you've selected the right event types in triggers

### Webhook returns 401 (Unauthorized)

- This means signature verification is failing
- Check that `CIO_WEBHOOK_SECRET` in Vercel matches Customer.io's webhook secret
- Or temporarily disable signature verification by removing the secret

### Events not matching expected format

- Our handler supports both nested and flat payload structures
- Check Vercel logs to see the actual payload structure
- The handler will log the full webhook body on errors

## Alternative: Multiple Webhooks

If Customer.io allows multiple webhooks, you could create separate webhooks for:

1. **Email Events Webhook**: Only `email.*` events → clicks table
2. **Person Events Webhook**: Only `person.*` events → users table
3. **Campaign Events Webhook**: Only `campaign.*` events → campaigns table

However, a single webhook handling all events is simpler and recommended.

## Next Steps

After configuring the webhook:

1. ✅ Deploy the code changes (if not already deployed)
2. ✅ Configure the webhook in Customer.io (this guide)
3. ✅ Test with a real campaign
4. ✅ Monitor BigQuery for new data
5. ✅ Set up campaign performance aggregation (if needed)

See `docs/CIO_BQ_SYNC_FIXES.md` for more details on the sync functionality.

## Spam Complaint Event Configuration

### What Happens When Spam Complaint is Detected

When a spam complaint webhook is received:

1. **Stored as Click Event**: The spam complaint is logged in the `clicks` table with `cio_event_type = 'spam_complaint'`
2. **Global Suppression**: The user is automatically:
   - Added to global suppression (`globalSuppressionDate` set in `users` table)
   - Unsubscribed from ALL brands (subscriptions cleared, added to `unsubscribed_brands`)
   - Removed from all brand relationships in Customer.io
   - Updated with `global_suppression: true` attribute in Customer.io

### Validating the Event Name Without Marking as Spam

Since you don't want to test by marking an email as spam, use these methods:

1. **Check Customer.io Webhook Event List**:
   - In webhook configuration, when adding conditions, check the dropdown of available events
   - Look for spam-related events

2. **Use Test Feature**:
   - If Customer.io has a "Test" or "Send Test" feature in webhook settings
   - Look for spam complaint events in the test event dropdown
   - Send a test event and check Vercel logs to see the exact event name

3. **Check Documentation**:
   - Customer.io Settings → Integrations → Webhooks
   - Look for "Reporting Webhooks" documentation
   - Check available event types list

4. **Monitor Logs**:
   - When a real spam complaint occurs (even if rare), check Vercel logs
   - The log will show: `📋 Event type: [exact-event-name]`
   - Use that exact name in your webhook trigger

### Spam Complaint Event Name

The correct event name in Customer.io is:
- **`Email Marked as Spam`** (Segment-style, title case with spaces) ✅ **This is the correct name**
- `email.spam_complaint` (native format, lowercase with underscore)
- `email.spamcomplaint` (alternative, lowercase no underscore)

**Note**: Some older configurations may show `Email Spam Complaint` (legacy name), but the current correct name is **`Email Marked as Spam`**.

**Recommendation**: Use `Email Marked as Spam` (if using Segment-style) or `email.spam_complaint` (if using native format).

