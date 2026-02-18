# Brand Email Campaigns Guide

This guide shows you how to send emails to people with relationships to specific brands using Customer.io's segmentation features.

## 🎯 Overview

With your brand relationship system, people are now associated with brand objects in Customer.io. This enables powerful segmentation for targeted email campaigns.

## 📊 Available Brands

Your system manages relationships to these brand objects:

| Brand ID | Brand Name |
|----------|------------|
| `batmitzvahhorrorstories` | Bat Mitzvah Horror Stories |
| `grapejuiceandnostalgia` | Grapejuice and Nostalgia |
| `hardresets` | Hard Resets |
| `highdiaries` | High Diaries |
| `hipspeak` | Hipspeak |
| `hookuplists` | Hookup Lists |
| `millennialvsgenz` | Millennial vs Gen Z |
| `obscuremixtape` | Obscure Mixtape |
| `onetimeatcamp` | One Time at Camp |
| `the90sparent` | The 90s Parent |
| `thecomingofageparty` | The Coming of Age Party |
| `thedadsdad` | The Dad's Dad |
| `theeyeballerscookbook` | The Eyeballer's Cookbook |
| `themixedhome` | The Mixed Home |
| `thepackandplay` | The Pack & Play |
| `thepicklereport` | The Pickle Report |
| `theproudparent` | The Proud Parent |
| `thequirkiest` | The Quirkiest |
| `thestewardprize` | The Steward Prize |
| `toddlercinema` | Toddler Cinema |
| `zitsandcake` | Zits & Cake |

## 🔍 Method 1: Customer.io Dashboard Segmentation

### Step 1: Create a Segment
1. Go to **Customer.io Dashboard** → **Segments**
2. Click **"Create Segment"**
3. Choose **"People"** as the segment type

### Step 2: Set Up Brand Relationship Filter
1. Add a filter: **"Has relationship to"**
2. Select **"Brand"** as the object type
3. Choose the specific brand (e.g., `hardresets`)
4. Set condition: **"Has relationship"**

### Step 3: Create Campaign
1. Go to **Campaigns** → **Create Campaign**
2. Select your segment
3. Design your email
4. Send to all people in the segment

## 🔍 Method 2: API-Based Segmentation

### Using Customer.io API to Get Brand Subscribers

```javascript
// Get all people with relationship to a specific brand
async function getBrandSubscribers(brandId) {
  const response = await fetch(`https://api.customer.io/v1/segments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CIO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `brand_${brandId}_subscribers`,
      filters: {
        and: [
          {
            type: "relationship",
            relationship_type: "brand",
            relationship_id: brandId
          }
        ]
      }
    })
  });
  
  return response.json();
}

// Example: Get all Hard Resets subscribers
const hardResetsSubscribers = await getBrandSubscribers('hardresets');
```

## 🔍 Method 3: Campaign API

### Send Campaign to Brand Subscribers

```javascript
// Create and send campaign to brand subscribers
async function sendBrandCampaign(brandId, campaignData) {
  // First, create the campaign
  const campaignResponse = await fetch(`https://api.customer.io/v1/campaigns`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CIO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `${brandId}_newsletter`,
      subject: campaignData.subject,
      from_email: campaignData.fromEmail,
      from_name: campaignData.fromName,
      html: campaignData.htmlContent,
      text: campaignData.textContent
    })
  });
  
  const campaign = await campaignResponse.json();
  
  // Then, send to brand subscribers
  const sendResponse = await fetch(`https://api.customer.io/v1/campaigns/${campaign.id}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CIO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      segment_id: `brand_${brandId}_subscribers`,
      send_at: campaignData.sendAt || 'now'
    })
  });
  
  return sendResponse.json();
}

// Example: Send Hard Resets newsletter
await sendBrandCampaign('hardresets', {
  subject: 'This Week in Hard Resets',
  fromEmail: 'newsletter@hardresets.com',
  fromName: 'Hard Resets Team',
  htmlContent: '<h1>Your weekly reset...</h1>',
  textContent: 'Your weekly reset...',
  sendAt: '2024-01-15T10:00:00Z'
});
```

## 🔍 Method 4: Using Your Webhook System

### Create Brand-Specific Webhook Handler

```javascript
// Add this to your subscriber-functions-webhooks.js
export function createBrandCampaignWebhookHandler() {
  return async (req, res) => {
    try {
      const { brand_id, campaign_data } = req.body;
      
      if (!brand_id || !campaign_data) {
        return res.status(400).json({ 
          error: 'Missing required fields: brand_id and campaign_data' 
        });
      }
      
      console.log(`📧 Sending campaign for brand: ${brand_id}`);
      
      // Use Customer.io API to send campaign
      const result = await sendBrandCampaign(brand_id, campaign_data);
      
      res.status(200).json({ 
        success: true, 
        campaign_id: result.campaign_id,
        recipients: result.recipients
      });
    } catch (error) {
      console.error('❌ Brand campaign error:', error.message);
      res.status(500).json({ error: error.message });
    }
  };
}
```

## 📋 Practical Examples

### Example 1: Send Weekly Newsletter to Hard Resets Subscribers

```bash
curl -X POST "https://your-domain.com/webhook/brand-campaign" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "hardresets",
    "campaign_data": {
      "subject": "Your Weekly Hard Reset",
      "from_email": "newsletter@hardresets.com",
      "from_name": "Hard Resets",
      "html_content": "<h1>Time for a reset!</h1><p>Here are this week's insights...</p>",
      "text_content": "Time for a reset! Here are this week's insights...",
      "send_at": "2024-01-15T09:00:00Z"
    }
  }'
```

### Example 2: Send Cross-Brand Campaign

```bash
# Send to subscribers of multiple brands
curl -X POST "https://your-domain.com/webhook/multi-brand-campaign" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_ids": ["hardresets", "thequirkiest", "zitsandcake"],
    "campaign_data": {
      "subject": "Special Cross-Brand Announcement",
      "from_email": "team@unaffiliated.co",
      "from_name": "Unaffiliated Team",
      "html_content": "<h1>Big News!</h1><p>We have exciting updates...</p>"
    }
  }'
```

## 🎯 Advanced Segmentation

### Combine Brand Relationships with Other Attributes

```javascript
// Segment: Hard Resets subscribers who are also subscribed to The Quirkiest
const advancedSegment = {
  name: "hard_resets_and_quirky_subscribers",
  filters: {
    and: [
      {
        type: "relationship",
        relationship_type: "brand", 
        relationship_id: "hardresets"
      },
      {
        type: "relationship",
        relationship_type: "brand",
        relationship_id: "thequirkiest"
      },
      {
        type: "attribute",
        attribute: "subscribed",
        operator: "equals",
        value: true
      }
    ]
  }
};
```

### Time-Based Brand Campaigns

```javascript
// Send to subscribers who joined in the last 30 days
const recentSubscribersSegment = {
  name: "recent_hard_resets_subscribers",
  filters: {
    and: [
      {
        type: "relationship",
        relationship_type: "brand",
        relationship_id: "hardresets"
      },
      {
        type: "attribute",
        attribute: "hardresets_subscription_date",
        operator: "greater_than",
        value: "30 days ago"
      }
    ]
  }
};
```

## 📊 Analytics & Tracking

### Track Brand Campaign Performance

```javascript
// Track campaign opens by brand
async function trackBrandCampaignOpen(campaignId, brandId, userId) {
  await fetch(`https://track.customer.io/api/v1/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'brand_campaign_opened',
      data: { 
        campaign_id: campaignId,
        brand_id: brandId,
        opened_at: new Date().toISOString()
      },
      id: userId
    })
  });
}
```

## 🚀 Quick Start Checklist

1. **✅ Set up Customer.io segments** for each brand
2. **✅ Create brand-specific campaigns** in Customer.io dashboard
3. **✅ Test with small segments** before sending to full lists
4. **✅ Set up webhook handlers** for automated campaigns
5. **✅ Monitor campaign performance** and engagement rates

## 💡 Pro Tips

- **Use brand-specific sender names** (e.g., "Hard Resets Team" vs "The Quirkiest")
- **Personalize content** based on brand relationship
- **Track engagement** by brand to optimize content
- **Set up automated welcome series** for new brand subscribers
- **Create cross-brand campaigns** for special announcements

Your brand relationship system is now ready for powerful, targeted email campaigns! 🎉
