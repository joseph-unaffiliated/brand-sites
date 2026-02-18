# Deployment Guide

## Prerequisites

- Vercel account
- Google Cloud Platform account with BigQuery access
- Customer.io account with API access
- EmailOversight API key
- Domain names for your brands

## Environment Setup

### 1. Vercel Project Setup

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard:

```bash
# Customer.io Configuration
CIO_SITE_ID=your_site_id
CIO_API_KEY=your_api_key
CIO_TRACK_URL=https://track.customer.io/api/v2

# Google Cloud Platform
GCP_PROJECT_ID=unaffiliated-data
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Email Validation
EMAILOVERSIGHT_API_KEY=your_api_key

# Data Hashing
EMAIL_SALT=your_email_salt
IP_SALT=your_ip_salt
```

### 2. BigQuery Setup

#### Create Tables

```sql
-- Users table
CREATE TABLE `unaffiliated-data.analytics.users` (
  userID STRING NOT NULL,
  email STRING,
  emailHash STRING,
  subscriptions JSON,
  unsubscribed_brands STRING,
  recentClickDate TIMESTAMP,
  createdAt TIMESTAMP
);

-- Clicks table
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

#### Service Account Setup

1. Create a service account in Google Cloud Console
2. Grant BigQuery Data Editor and BigQuery Job User roles
3. Generate and download JSON key
4. Add the entire JSON as `GCP_SERVICE_ACCOUNT_KEY` environment variable

### 3. Customer.io Setup

#### Create Brand Objects

Create these brand objects in Customer.io:

1. The Pickle Report
2. The Mixed Home
3. Bat Mitzvah Horror Stories
4. Hard Resets
5. Grape Juice and Nostalgia
6. High Diaries
7. Hookup Lists
8. Millennial vs Gen Z
9. Obscure Mixtape
10. One Time at Camp
11. The 90s Parent
12. The Coming of Age Party
13. The Dad's Dad
14. The Eyeballer's Cookbook
15. The Pack and Play
16. The Proud Parent
17. The Quirkiest
18. The Steward Prize
19. Toddler Cinema
20. Zits and Cake

#### API Access

1. Get your Site ID and API Key from Customer.io settings
2. Ensure API key has permissions for:
   - Person management
   - Relationship management
   - Attribute updates

### 4. Domain Configuration

#### DNS Setup

Configure your domains to point to Vercel:

```bash
# Add these CNAME records to your DNS
magic.thepicklereport.com → your-deployment.vercel.app
magic.themixedhome.com → your-deployment.vercel.app
magic.unaffiliated.com → your-deployment.vercel.app
# ... (repeat for all brand domains)
```

#### Vercel Domain Configuration

1. Go to Vercel dashboard → Project → Domains
2. Add each domain:
   - `magic.thepicklereport.com`
   - `magic.themixedhome.com`
   - `magic.unaffiliated.com`
   - etc.

3. Verify DNS propagation

## Deployment Process

### 1. Code Deployment

```bash
# Push to main branch
git add .
git commit -m "Deploy subscription functions"
git push origin main

# Vercel will automatically deploy
```

### 2. Verify Deployment

#### Test Subscription
```bash
curl "https://magic.thepicklereport.com/?email=test@example.com&utm_source=deployment_test"
```

#### Test Unsubscription
```bash
curl "https://magic.thepicklereport.com/unsubscribe?email=test@example.com"
```

#### Check Logs
- Go to Vercel dashboard → Functions → View logs
- Look for successful API calls and data updates

### 3. Database Verification

#### Check BigQuery
```sql
-- Verify user was created/updated
SELECT * FROM `unaffiliated-data.analytics.users` 
WHERE email = 'test@example.com' 
ORDER BY createdAt DESC 
LIMIT 1;

-- Verify click was logged
SELECT * FROM `unaffiliated-data.analytics.clicks` 
WHERE emailHash = 'hashed_email' 
ORDER BY clickDate DESC 
LIMIT 1;
```

#### Check Customer.io
- Go to Customer.io dashboard
- Search for test user
- Verify brand relationships and attributes

## Monitoring Setup

### 1. Vercel Analytics

Enable Vercel Analytics in dashboard:
- Function execution metrics
- Error rates
- Performance monitoring

### 2. BigQuery Monitoring

Set up alerts for:
- Failed queries
- High error rates
- Unusual traffic patterns

### 3. Customer.io Monitoring

Monitor:
- API rate limits
- Failed relationship operations
- Attribute update errors

## Troubleshooting

### Common Issues

#### 1. BigQuery Streaming Buffer Error
```
Error: UPDATE or DELETE statement over table would affect rows in the streaming buffer
```
**Solution**: Use MERGE statements (already implemented)

#### 2. Customer.io Relationship Not Removed
```
Error: Relationship still exists after unsubscribe
```
**Solution**: Use `delete_relationships` action (already implemented)

#### 3. Domain Not Working
```
Error: Domain not resolving
```
**Solution**: 
- Check DNS propagation
- Verify Vercel domain configuration
- Wait 24-48 hours for full propagation

#### 4. Environment Variables Not Set
```
Error: Environment variable not found
```
**Solution**: 
- Check Vercel environment variables
- Redeploy after adding variables
- Verify variable names match exactly

### Debug Commands

#### Check Environment Variables
```bash
# In Vercel function logs
console.log('CIO_SITE_ID:', process.env.CIO_SITE_ID);
console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID);
```

#### Test API Connections
```bash
# Test Customer.io API
curl -X POST "https://track.customer.io/api/v2/entity" \
  -H "Authorization: Basic $(echo -n 'site_id:api_key' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"type":"person","identifiers":{"id":"test"},"action":"identify"}'

# Test BigQuery connection
# Check Vercel function logs for BigQuery operations
```

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] BigQuery tables created and accessible
- [ ] Customer.io brand objects created
- [ ] All domains configured and verified
- [ ] Test subscriptions working
- [ ] Test unsubscriptions working
- [ ] Data flowing to BigQuery
- [ ] Customer.io relationships working
- [ ] Monitoring and alerts configured
- [ ] Documentation updated
- [ ] Team trained on system

## Rollback Plan

### Emergency Rollback

1. **Revert Code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Disable Domains**:
   - Remove domains from Vercel
   - Update DNS to point elsewhere

3. **Data Recovery**:
   - Restore from BigQuery backups
   - Re-sync Customer.io data if needed

### Gradual Rollback

1. **Disable New Subscriptions**:
   - Update code to return maintenance message
   - Keep unsubscriptions working

2. **Monitor Impact**:
   - Check error rates
   - Monitor user complaints

3. **Full Rollback**:
   - Revert to previous working version
   - Verify all functionality

## Maintenance

### Regular Tasks

#### Weekly
- [ ] Check error rates in Vercel logs
- [ ] Monitor BigQuery usage and costs
- [ ] Review Customer.io API usage

#### Monthly
- [ ] Update dependencies
- [ ] Review and optimize BigQuery queries
- [ ] Check domain SSL certificates
- [ ] Review monitoring alerts

#### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Disaster recovery testing
