# Bot-Blocking Implementation - Next Steps

## ✅ Implementation Complete

All backend code and JavaScript files are ready. Here's what's been implemented:

### Backend (Complete)
- ✅ `handleExecute()` function created - processes subscribe/unsubscribe/snooze
- ✅ `/execute` endpoint route detection added
- ✅ Feature flag logic implemented (`ENABLE_BOT_BLOCKING`)
- ✅ Immediate redirect logic when feature flag is enabled
- ✅ All URL parameters preserved in redirects

### Frontend Scripts (Ready to Deploy)
- ✅ Success/Unsub/Snooze/Poll page script - integrated with existing code
- ✅ Article page script - integrated with existing code
- ✅ Redirect page script - integrated with existing code

## 🚀 Deployment Steps

### Step 1: Deploy Backend Code
The backend changes are ready. You can deploy them now:

```bash
cd "/Users/joseph/Dropbox/Unaffiliated/Data Configuration/subscription-functions"
git add api/magic-link.js
git commit -m "Add bot-blocking execute endpoint and feature flag"
git push origin main
```

This will auto-deploy to Vercel. **The feature flag defaults to `false`**, so existing flows will continue working.

### Step 2: Add JavaScript to Webflow Pages

**Success/Unsub/Snooze/Poll Page:**
1. Open Webflow → Your brand site
2. Go to the page that handles success/unsub/snooze/poll states
3. Find the existing subscription page handler script
4. Replace it with the contents of `webflow-success-page-script.js`
5. Publish the site

**Article Pages:**
1. Open Webflow → Your brand site
2. Go to article page template
3. Find the existing article page script (before `</body>`)
4. Replace it with the contents of `webflow-article-page-script.js`
5. Publish the site

**Redirect Page (`/redirect`):**
1. Open Webflow → Your brand site
2. Go to the `/redirect` page
3. Find the existing redirect script (before `</body>`)
4. Replace it with the contents of `webflow-redirect-page-script.js`
5. Publish the site

**Repeat for all brands** (heebnewsletters, hookuplists, thepicklereport, etc.)

### Step 3: Test Execute Endpoint (Before Enabling Feature Flag)

Test the `/execute` endpoint directly to ensure it works:

```bash
# Test subscribe
curl -X POST https://magic.heebnewsletters.com/execute \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","brand":"heebnewsletters","action":"subscribe"}'

# Test unsubscribe
curl -X POST https://magic.heebnewsletters.com/execute \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","brand":"heebnewsletters","action":"unsubscribe"}'
```

Expected response: `{"success":true,"action":"subscribe"}`

### Step 4: Test Success Page JavaScript

1. Visit a success page manually with params:
   ```
   https://heebnewsletters.com?subscribed=true&email=test@example.com
   ```
2. Open browser console
3. Verify you see:
   - "⚙️ Executing subscription action..."
   - "✅ Subscription action completed successfully"
4. Check that `#subscribed-message-gem` updates to "You're now subscribed to"

### Step 5: Enable Feature Flag

Once you've verified everything works:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `ENABLE_BOT_BLOCKING`
   - **Value**: `true`
   - **Environment**: Production (and Preview if you want to test there)
3. Redeploy (or wait for next auto-deploy)

### Step 6: Test Complete Flow

**Test Subscribe:**
1. Visit: `https://magic.heebnewsletters.com?email=test@example.com`
2. Should redirect immediately to: `https://heebnewsletters.com?subscribed=true&email=test@example.com`
3. Success page should show "Confirming your subscription to"
4. After ~1-2 seconds, should update to "You're now subscribed to"
5. Check BigQuery/Customer.io to verify subscription completed

**Test Unsubscribe:**
1. Visit: `https://magic.heebnewsletters.com/unsubscribe?email=test@example.com`
2. Should redirect immediately to: `https://heebnewsletters.com?unsubscribed=true&email=test@example.com`
3. Unsub page should show "You're now being unsubscribed"
4. After ~1-2 seconds, should update to "We're sorry to see you go"

**Test Snooze:**
1. Visit: `https://magic.heebnewsletters.com/snooze?email=test@example.com`
2. Should redirect immediately to: `https://heebnewsletters.com?snoozed=true&email=test@example.com`
3. Snooze page should show "You're now being snoozed"
4. After ~1-2 seconds, should update to "See you in 3 months!"

**Test Article Flow:**
1. Visit: `https://magic.heebnewsletters.com/beastieboys?email=test@example.com`
2. Should redirect to: `https://heebnewsletters.com/beastieboys?subscribed=true&email=test@example.com`
3. Toast notification should appear
4. Subscription should complete in background

**Test External Redirect:**
1. Visit: `https://magic.heebnewsletters.com/?email=test@example.com&redirect&sitename=NYMag&url=aHR0cHM6Ly93d3cudGhlY3V0LmNvbS8...`
2. Should redirect to: `https://heebnewsletters.com/redirect?sitename=NYMag&url=...&email=...`
3. Redirect page should show site name
4. After 2 seconds, should redirect to external URL
5. Subscription should complete in background

**Test Poll Flow:**
1. Visit: `https://magic.heebnewsletters.com/poll?...&email=test@example.com&subscribed=true`
2. Poll page should show
3. `.poll-thanksmessage` element should be visible
4. Subscription should complete in background

### Step 7: Test Bot Detection

**Test with Gmail Scanner:**
1. Send a test email with a magic link
2. Check Customer.io reports for "machine clicks"
3. Verify machine clicks do NOT result in subscriptions
4. Verify human clicks DO result in subscriptions

## 🔄 Rollback Plan

If anything goes wrong:

1. **Instant Rollback**: Set `ENABLE_BOT_BLOCKING=false` in Vercel environment variables
2. **Code Rollback**: `git revert <commit-hash>` and push

## 📊 Monitoring

After enabling, monitor:
- Vercel function logs for errors
- BigQuery for subscription events
- Customer.io for relationship updates
- Browser console errors on success pages

## ✅ Success Criteria

- [ ] Execute endpoint works via direct POST
- [ ] Success page JavaScript fires POST correctly
- [ ] Bot detection blocks Gmail scanner
- [ ] Real users complete subscriptions successfully
- [ ] Unsubscribe flow works
- [ ] Snooze flow works
- [ ] Article page flow works
- [ ] Poll page flow works
- [ ] External redirect flow works
- [ ] Zapier integration still works (direct POST to `/execute`)
- [ ] All message elements update correctly

## 🎯 Current Status

- **Backend**: ✅ Ready to deploy
- **Frontend Scripts**: ✅ Ready to copy to Webflow
- **Feature Flag**: ⏳ Not enabled (defaults to `false`)
- **Testing**: ⏳ Pending

## Next Action

1. Deploy backend code (git push)
2. Add JavaScript to Webflow pages
3. Test execute endpoint
4. Test success page JavaScript
5. Enable feature flag when ready
6. Test complete flows
7. Monitor for issues
