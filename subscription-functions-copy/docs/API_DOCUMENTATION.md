# API Documentation

## Overview

The Subscription Functions API provides endpoints for managing brand subscriptions and unsubscriptions. All functionality is consolidated in the `magic-link.js` handler.

## Base URL

All endpoints are served from your Vercel deployment:
- `https://your-deployment.vercel.app`

## Endpoints

### Magic Link Handler

**Endpoint**: `/api/magic-link`  
**Methods**: `GET`, `POST`  
**Description**: Handles both subscriptions and unsubscriptions based on URL path and parameters.

#### Subscription (Root Path)

**URL**: `https://magic.[brand].com/` or `https://magic.unaffiliated.com/`

**Parameters**:
- `email` (required): User's email address
- `brands` (optional): Comma-separated list of brand IDs for multi-brand subscriptions
- `utm_source` (optional): Traffic source tracking
- `utm_medium` (optional): Traffic medium tracking
- `utm_campaign` (optional): Campaign tracking
- `utm_content` (optional): Content tracking
- `utm_term` (optional): Keyword tracking

**Examples**:
```
# Single brand subscription
https://magic.thepicklereport.com/?email=user@example.com&utm_source=webflow

# Multi-brand subscription
https://magic.unaffiliated.com/?email=user@example.com&brands=thepicklereport,themixedhome&utm_source=social
```

**Response**: Redirects to brand website with `?subscribed=true`

#### Unsubscription

**URL**: `https://magic.[brand].com/unsubscribe` or `https://magic.unaffiliated.com/unsubscribe`

**Parameters**:
- `email` (required): User's email address
- `brands` (optional): Comma-separated list of brand IDs for multi-brand unsubscriptions

**Examples**:
```
# Single brand unsubscription
https://magic.thepicklereport.com/unsubscribe?email=user@example.com

# Multi-brand unsubscription
https://magic.unaffiliated.com/unsubscribe?email=user@example.com&brands=thepicklereport,themixedhome
```

**Response**: Redirects to brand website with `?unsubscribed=true`

#### Request past issue

**URL**: `https://magic.[brand].com/request`

**Parameters**:
- `email` (required): User's email address
- `issue` (required): Issue identifier (e.g. `001`). Combined with brand code to set Customer.io attribute `requested_issue` (e.g. `TPR_issue001` for The Pickle Report).

**Example**:
```
https://magic.thepicklereport.com/request?issue=001&email=user@example.com
```

**Response**: Sets Customer.io person attribute `requested_issue` (e.g. `TPR_issue001`) and redirects to brand website with `?request=true`. Use the attribute in Customer.io to trigger a campaign that sends the requested newsletter issue.

## Data Structures

### Customer.io Person Attributes

#### subscribed_brands
```json
{
  "thepicklereport": 1704873600000,
  "themixedhome": 1704873600000
}
```

#### unsubscribed_brands
```json
{
  "thepicklereport": 1705312200000
}
```

#### Individual Brand Attributes
- `subscribed_to_[brand]`: Boolean indicating subscription status
- `[brand]_subscription_date`: ISO timestamp of subscription
- `requested_issue`: String (e.g. `TPR_issue001`) set when user requests a past newsletter issue via `/request` link; use in Customer.io to trigger sending that issue

### BigQuery Schema

#### analytics.users
```sql
CREATE TABLE `unaffiliated-data.analytics.users` (
  userID STRING NOT NULL,
  email STRING,
  emailHash STRING,
  subscriptions JSON,           -- Brand subscriptions with timestamps and sources
  unsubscribed_brands STRING,   -- JSON string of unsubscribed brands
  snoozed_brands STRING,        -- JSON string of snoozed brands with reactivation dates
  
  -- Lead source tracking (unified for Meta, RB2B, manual signups)
  leadSource STRING,            -- 'meta_lead_ads', 'rb2b', 'magic_link', 'manual', etc.
  leadData JSON,                -- Full lead payload from source
  
  -- Personal information (from Meta leads, forms, etc.)
  firstName STRING,
  lastName STRING,
  phone STRING,
  
  -- Company information (from RB2B, Meta leads, etc.)
  companyName STRING,
  companyDomain STRING,
  companySize STRING,
  industry STRING,
  companyData JSON,             -- Full company data payload
  
  -- Timestamps
  recentClickDate TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### analytics.clicks
```sql
CREATE TABLE `unaffiliated-data.analytics.clicks` (
  clickID STRING NOT NULL,
  userID STRING,
  emailHash STRING,
  brand STRING,
  subSource STRING,
  utmSource STRING,
  utmMedium STRING,
  utmCampaign STRING,
  utmContent STRING,
  utmTerm STRING,
  userAgentHash STRING,
  ipHash STRING,
  clickDate TIMESTAMP
);
```

## Brand Mapping

| URL Brand ID | Customer.io Brand Name |
|--------------|------------------------|
| `thepicklereport` | The Pickle Report |
| `themixedhome` | The Mixed Home |
| `batmitzvahhorrorstories` | Bat Mitzvah Horror Stories |
| `hardresets` | Hard Resets |
| `grapejuiceandnostalgia` | Grape Juice and Nostalgia |
| `highdiaries` | High Diaries |
| `hookuplists` | Hookup Lists |
| `millennialvsgenz` | Millennial vs Gen Z |
| `obscuremixtape` | Obscure Mixtape |
| `onetimeatcamp` | One Time at Camp |
| `the90sparent` | The 90s Parent |
| `thecomingofageparty` | The Coming of Age Party |
| `thedadsdad` | The Dad's Dad |
| `theeyeballerscookbook` | The Eyeballer's Cookbook |
| `thepackandplay` | The Pack and Play |
| `theproudparent` | The Proud Parent |
| `thequirkiest` | The Quirkiest |
| `thestewardprize` | The Steward Prize |
| `toddlercinema` | Toddler Cinema |
| `zitsandcake` | Zits and Cake |

## Error Handling

### Common Error Responses

#### Email Validation Failed
```
Status: 400
Response: {
  "error": "Email validation failed",
  "details": "Email quality score too low"
}
```

#### User Not Found (Unsubscribe)
```
Status: 404
Response: {
  "error": "User not found",
  "email": "user@example.com"
}
```

#### BigQuery Error
```
Status: 500
Response: {
  "error": "Database operation failed",
  "details": "BigQuery streaming buffer error"
}
```

#### Customer.io API Error
```
Status: 500
Response: {
  "error": "Customer.io API error",
  "details": "Invalid API key"
}
```

## Rate Limiting

- No explicit rate limiting implemented
- Relies on Vercel's default limits
- Email validation API has its own limits

## Authentication

- Customer.io API: Basic authentication using site ID and API key
- BigQuery: Service account JSON key
- EmailOversight: API key authentication

## Monitoring

### Logs

All operations are logged with structured data:
- User operations (subscribe/unsubscribe)
- API responses
- Error details
- Performance metrics

### Metrics

Track these key metrics:
- Subscription success rate
- Unsubscription completion rate
- Email validation pass rate
- API response times
- Error rates by endpoint

## Testing

### Test Subscription
```bash
curl "https://magic.thepicklereport.com/?email=test@example.com&utm_source=test"
```

### Test Unsubscription
```bash
curl "https://magic.thepicklereport.com/unsubscribe?email=test@example.com"
```

### Test Multi-Brand
```bash
curl "https://magic.unaffiliated.com/?email=test@example.com&brands=thepicklereport,themixedhome"
```

## Integration Examples

### Webflow Form Integration

```html
<form action="https://magic.thepicklereport.com/" method="GET">
  <input type="email" name="email" required>
  <input type="hidden" name="utm_source" value="webflow">
  <button type="submit">Subscribe</button>
</form>
```

### JavaScript Integration

```javascript
// Subscribe user
const subscribeUser = async (email, brands = []) => {
  const url = new URL('https://magic.unaffiliated.com/');
  url.searchParams.set('email', email);
  if (brands.length > 0) {
    url.searchParams.set('brands', brands.join(','));
  }
  
  window.location.href = url.toString();
};

// Unsubscribe user
const unsubscribeUser = async (email, brands = []) => {
  const url = new URL('https://magic.unaffiliated.com/unsubscribe');
  url.searchParams.set('email', email);
  if (brands.length > 0) {
    url.searchParams.set('brands', brands.join(','));
  }
  
  window.location.href = url.toString();
};
```

## Security Considerations

- Email addresses are hashed before storage
- IP addresses are hashed for privacy
- User agents are hashed for privacy
- All sensitive data uses salt-based hashing
- API keys are stored as environment variables
- No PII is logged in plain text

## Performance

- Uses BigQuery MERGE statements to avoid streaming buffer issues
- Parallel API calls where possible
- Efficient JSON data structures
- Minimal data transfer with compressed responses
- Vercel edge functions for global performance
