# Bot-Blocking Magic Link Implementation

## Status: Phase 1 & 3 Complete ✅

### What's Been Implemented

1. **Execute Endpoint** (`/api/magic-link/execute`)
   - New `handleExecute()` function that processes subscribe/unsubscribe/snooze
   - Accepts POST requests with JSON body
   - Returns JSON response: `{ success: true/false, action: 'subscribe'|'unsubscribe'|'snooze' }`
   - Route detection added: `/execute` path with POST method

2. **Feature Flag & Immediate Redirect**
   - Feature flag: `ENABLE_BOT_BLOCKING` environment variable
   - When `ENABLE_BOT_BLOCKING=true`: Immediate redirect before processing
   - When `ENABLE_BOT_BLOCKING=false` (default): Existing flow (no changes)
   - All original URL parameters preserved in redirect URLs

3. **JavaScript Files for Webflow Pages**
   - `webflow-success-page-script.js` - For success page (subscribed/unsubscribed/snoozed)
   - `webflow-article-page-script.js` - For article pages
   - `webflow-poll-page-script.js` - For poll pages
   - `webflow-redirect-page-script.js` - For external redirect page

## Next Steps

### Phase 2: Add JavaScript to Webflow Pages

1. **Success Page** (handles subscribed/unsubscribed/snoozed states)
   - Copy contents of `webflow-success-page-script.js`
   - Add `executeSubscriptionAction()` function to your existing subscription page handler
   - Call `executeSubscriptionAction()` in `checkPageState()` after showing success/unsub/snoozed screen
   - Ensure elements exist: `#subscribed-message-gem`, `#unsub-copy-text`, `#snooze-copy-text`

2. **Article Pages**
   - Copy contents of `webflow-article-page-script.js`
   - Add before `</body>` tag on article page template
   - Toast notification already exists, this just executes the POST

3. **Poll Pages**
   - Copy contents of `webflow-poll-page-script.js`
   - Add before `</body>` tag on poll page template
   - Ensures `.poll-thanksmessage` element shows when `?subscribed=true`

4. **External Redirect Page** (`/redirect`)
   - Copy contents of `webflow-redirect-page-script.js`
   - Add before `</body>` tag on redirect page
   - Executes POST, then existing redirect script handles final destination

### Phase 3: Enable Feature Flag

1. **Set Environment Variable in Vercel**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `ENABLE_BOT_BLOCKING` = `true`
   - Deploy to production

2. **Test All Flows**
   - Test subscribe (default, article, external redirect)
   - Test unsubscribe
   - Test snooze
   - Verify bot detection blocks Gmail scanner
   - Verify real users complete subscriptions

### Testing Checklist

- [ ] Execute endpoint works via direct POST (test with curl/Zapier)
- [ ] Success page JavaScript fires POST correctly
- [ ] Bot detection blocks Gmail scanner
- [ ] Real users complete subscriptions successfully
- [ ] Unsubscribe flow works
- [ ] Snooze flow works
- [ ] Article page flow works
- [ ] Poll page flow works
- [ ] External redirect flow works
- [ ] Zapier integration still works (direct POST to `/execute`)
- [ ] Element updates work correctly (`#subscribed-message-gem`, `#unsub-copy-text`, `#snooze-copy-text`)

## Rollback Strategy

If issues occur:

1. **Instant Rollback**: Set `ENABLE_BOT_BLOCKING=false` in Vercel (old flow resumes immediately)
2. **Git Rollback**: `git revert <commit-hash>` to revert code changes

## API Endpoint

### POST `/execute`

**URL**: `https://magic.[brand].com/execute`

**Request Body**:
```json
{
  "email": "user@example.com",
  "brand": "heebnewsletters",
  "action": "subscribe",
  "campaignID": "optional",
  "utm_source": "optional",
  "utm_campaign": "optional",
  "articleID": "optional"
}
```

**Response**:
```json
{
  "success": true,
  "action": "subscribe"
}
```

**For Zapier/Programmatic Use**:
- POST directly to `/execute` endpoint
- No bot detection (bypasses client-side checks)
- Works immediately

## Files Modified

- `api/magic-link.js` - Added `handleExecute()` function and feature flag logic
- `webflow-success-page-script.js` - JavaScript for success page (NEW)
- `webflow-article-page-script.js` - JavaScript for article pages (NEW)
- `webflow-poll-page-script.js` - JavaScript for poll pages (NEW)
- `webflow-redirect-page-script.js` - JavaScript for redirect page (NEW)

## Notes

- Feature flag defaults to `false` (old behavior) for safety
- All original URL parameters are preserved in redirect URLs
- Brand is extracted from hostname on success pages (not included in redirect URLs)
- Bot detection requires 4/6 checks to pass (lenient)
- POST requests use `navigator.sendBeacon()` as fallback for reliability
