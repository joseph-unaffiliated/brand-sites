# Adding a New Brand

When adding a new brand to the subscription system, you need to update several files to ensure proper integration with BigQuery, Customer.io, and the magic link system.

## 📋 Required Updates

### 1. `api/magic-link.js`

**Two mappings need to be updated:**

#### a) `BRAND_MAPPING` (lines 12-33)
Add the subscription attribute → brand ID mapping:
```javascript
const BRAND_MAPPING = {
    // ... existing brands ...
    'subscribed_to_newbrandname': 'newbrandname',  // ← ADD THIS
};
```

#### b) `CUSTOMER_IO_BRAND_NAMES` (lines 36-57)
Add the brand ID → Customer.io display name mapping:
```javascript
const CUSTOMER_IO_BRAND_NAMES = {
    // ... existing brands ...
    'newbrandname': 'New Brand Display Name',  // ← ADD THIS
};
```

### 2. `api/bq-to-cio-sync.js`

**Update `CUSTOMER_IO_BRAND_NAMES` (lines 22-43):**
```javascript
const CUSTOMER_IO_BRAND_NAMES = {
    // ... existing brands ...
    'newbrandname': 'New Brand Display Name',  // ← ADD THIS (must match magic-link.js)
};
```

### 3. `api/cio-to-bq-sync-enhanced.js`

**Update `BRAND_NAME_TO_ID` (lines 22-43):**
This is the reverse mapping (Customer.io display name → brand ID):
```javascript
const BRAND_NAME_TO_ID = {
    // ... existing brands ...
    'New Brand Display Name': 'newbrandname',  // ← ADD THIS (reverse of CUSTOMER_IO_BRAND_NAMES)
};
```

### 4. `docs/BRAND_EMAIL_CAMPAIGNS.md`

**Add to the brand table (lines 13-34):**
```markdown
| Brand ID | Brand Name |
|----------|------------|
| ... existing brands ... |
| `newbrandname` | New Brand Display Name |  ← ADD THIS
```

### 5. `api/meta-webhook.js` (Optional - Only if using Meta Lead Ads)

**If the new brand will use Meta Lead Ads, add to brand detection mapping:**

#### Option A: Form ID mapping (lines 301-305)
```javascript
const FORM_BRAND_MAPPING = {
    // ... existing forms ...
    'your_form_id_here': 'newbrandname',  // ← ADD THIS
};
```

#### Option B: Page ID mapping (lines 312-316)
```javascript
const PAGE_BRAND_MAPPING = {
    // ... existing pages ...
    'your_page_id_here': 'newbrandname',  // ← ADD THIS
};
```

## 🔧 Steps to Add a Brand

1. **Determine the brand identifier:**
   - Choose a URL-friendly brand ID (e.g., `newbrandname`)
   - Determine the Customer.io display name (e.g., `New Brand Display Name`)

2. **Update code files:**
   - Add to `BRAND_MAPPING` in `api/magic-link.js`
   - Add to `CUSTOMER_IO_BRAND_NAMES` in `api/magic-link.js`
   - Add to `CUSTOMER_IO_BRAND_NAMES` in `api/bq-to-cio-sync.js`
   - Add to `BRAND_NAME_TO_ID` in `api/cio-to-bq-sync-enhanced.js`

3. **Update documentation:**
   - Add to brand table in `docs/BRAND_EMAIL_CAMPAIGNS.md`

4. **Create Customer.io Brand Object:**
   - Go to Customer.io Dashboard
   - Create a new Brand object with the exact display name (e.g., `New Brand Display Name`)
   - The brand ID in Customer.io will be generated automatically

5. **Configure Meta Lead Ads (if applicable):**
   - Add Form ID or Page ID mapping in `api/meta-webhook.js`

6. **Deploy and test:**
   - Deploy changes to Vercel
   - Test subscription via magic link: `https://magic.unaffiliated.com?email=test@example.com&brand=newbrandname`
   - Verify the brand appears in BigQuery and Customer.io

## ⚠️ Important Notes

- **Brand ID format**: Must be lowercase, no spaces, URL-friendly (e.g., `thepicklereport`, not `The Pickle Report`)
- **Customer.io display name**: Must match exactly what you create in Customer.io (e.g., `The Pickle Report`)
- **Consistency**: All mappings must use the same brand ID and display name across all files
- **Customer.io objects**: Brand objects must be created manually in Customer.io Dashboard - they are not auto-created

## 🎯 Quick Checklist

- [ ] Added to `BRAND_MAPPING` in `api/magic-link.js`
- [ ] Added to `CUSTOMER_IO_BRAND_NAMES` in `api/magic-link.js`
- [ ] Added to `CUSTOMER_IO_BRAND_NAMES` in `api/bq-to-cio-sync.js`
- [ ] Added to `BRAND_NAME_TO_ID` in `api/cio-to-bq-sync-enhanced.js`
- [ ] Added to brand table in `docs/BRAND_EMAIL_CAMPAIGNS.md`
- [ ] Added Meta Lead Ads mapping (if applicable) in `api/meta-webhook.js`
- [ ] Created Brand object in Customer.io Dashboard
- [ ] Tested subscription via magic link
- [ ] Verified in BigQuery
- [ ] Verified in Customer.io

## 📝 Example

To add "The Awesome Brand" with brand ID `theawesomebrand`:

**File: `api/magic-link.js`**
```javascript
const BRAND_MAPPING = {
    // ... existing ...
    'subscribed_to_theawesomebrand': 'theawesomebrand',
};

const CUSTOMER_IO_BRAND_NAMES = {
    // ... existing ...
    'theawesomebrand': 'The Awesome Brand',
};
```

**File: `api/bq-to-cio-sync.js`**
```javascript
const CUSTOMER_IO_BRAND_NAMES = {
    // ... existing ...
    'theawesomebrand': 'The Awesome Brand',
};
```

**File: `api/cio-to-bq-sync-enhanced.js`**
```javascript
const BRAND_NAME_TO_ID = {
    // ... existing ...
    'The Awesome Brand': 'theawesomebrand',
};
```

**File: `docs/BRAND_EMAIL_CAMPAIGNS.md`**
```markdown
| `theawesomebrand` | The Awesome Brand |
```

**Customer.io Dashboard:**
- Create Brand object named: `The Awesome Brand`

That's it! Your new brand is now integrated. 🎉





