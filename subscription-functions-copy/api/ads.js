import axios from 'axios';
import { BigQuery } from '@google-cloud/bigquery';
import crypto from 'crypto';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

function hashIP(ip, salt = process.env.IP_SALT || 'default-salt') {
  if (!ip) return null;
  try {
    return crypto.createHash('sha256').update(ip + salt).digest('hex');
  } catch (error) {
    console.error('IP hashing error:', error.message);
    return ip; // Fallback to raw IP if hashing fails
  }
}

async function fetchAdsFromAirtable() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_NAME) {
    console.log('⚠️ Airtable credentials not configured, using fallback ads');
    return getFallbackAds();
  }

  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
        },
        params: {
          filterByFormula: '{Status} = "Active"',
          sort: [{ field: 'Priority', direction: 'desc' }],
          maxRecords: 50
        },
        timeout: 5000
      }
    );

    const ads = response.data.records.map(record => ({
      id: record.id,
      title: record.fields.Title || 'Sponsored Content',
      description: record.fields.Description || '',
      imageUrl: record.fields.Image?.[0]?.url || null,
      linkUrl: record.fields.Link || '#',
      sponsor: record.fields.Sponsor || 'Unknown',
      category: record.fields.Category || 'general',
      priority: record.fields.Priority || 1,
      ctaText: record.fields.CTA || 'Learn More',
      backgroundColor: record.fields.BackgroundColor || '#ffffff',
      textColor: record.fields.TextColor || '#000000'
    }));

    console.log(`📊 Fetched ${ads.length} active ads from Airtable`);
    return ads;
  } catch (error) {
    console.error('❌ Airtable API error:', error.message);
    console.log('🔄 Falling back to default ads');
    return getFallbackAds();
  }
}

function getFallbackAds() {
  return [
    {
      id: 'fallback-1',
      title: 'Unaffiliated Newsletter',
      description: 'Stay informed with our weekly newsletter',
      imageUrl: null,
      linkUrl: 'https://unaffiliated.co/subscribe',
      sponsor: 'Unaffiliated',
      category: 'newsletter',
      priority: 1,
      ctaText: 'Subscribe',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    }
  ];
}

function selectAd(ads, userAgent = '', previousAdId = null) {
  if (ads.length === 0) return null;
  
  // Filter out the previously shown ad if provided
  const availableAds = previousAdId 
    ? ads.filter(ad => ad.id !== previousAdId)
    : ads;
  
  if (availableAds.length === 0) return ads[0]; // Fallback to any ad if only one available
  
  // Weighted selection based on priority
  const totalPriority = availableAds.reduce((sum, ad) => sum + ad.priority, 0);
  let random = Math.random() * totalPriority;
  
  for (const ad of availableAds) {
    random -= ad.priority;
    if (random <= 0) {
      return ad;
    }
  }
  
  // Fallback to first ad
  return availableAds[0];
}

async function trackAdImpression(adId, userAgent, ip, referer = null) {
  try {
    const impressionsTable = bq.dataset('analytics').table('ad_impressions');
    await impressionsTable.insert([{
      impressionID: `imp_${crypto.randomUUID()}`,
      adID: adId,
      date: new Date(),
      userAgent: userAgent || null,
      referer: referer || null,
      locationIP: hashIP(ip),
      source: 'ad_server'
    }]);
    console.log('✅ Ad impression tracked');
  } catch (error) {
    console.error('❌ Failed to track impression:', error.message);
  }
}

export default async function handler(req, res) {
  console.log('🚀 AD SERVER HANDLER');
  
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }
  
  try {
    const { format = 'json', previous_ad = null, referer = null } = req.query;
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    
    console.log('📊 Ad request:', { format, previousAd: previous_ad, referer });
    
    // Fetch ads from Airtable
    const ads = await fetchAdsFromAirtable();
    
    // Select an ad (avoiding the previous one if specified)
    const selectedAd = selectAd(ads, userAgent, previous_ad);
    
    if (!selectedAd) {
      console.log('❌ No ads available');
      return res.status(404).json({ error: 'No ads available' });
    }
    
    // Track impression
    await trackAdImpression(selectedAd.id, userAgent, ip, referer);
    
    // Format response based on requested format
    if (format === 'html') {
      const html = `
        <div class="sponsored-ad" style="
          background-color: ${selectedAd.backgroundColor};
          color: ${selectedAd.textColor};
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          font-family: Arial, sans-serif;
        ">
          ${selectedAd.imageUrl ? `<img src="${selectedAd.imageUrl}" alt="${selectedAd.title}" style="max-width: 100%; height: auto; margin-bottom: 15px;">` : ''}
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">${selectedAd.title}</h3>
          ${selectedAd.description ? `<p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.8;">${selectedAd.description}</p>` : ''}
          <a href="${selectedAd.linkUrl}" style="
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
          ">${selectedAd.ctaText}</a>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">Sponsored by ${selectedAd.sponsor}</p>
        </div>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }
    
    // Default JSON response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json({
      success: true,
      ad: {
        id: selectedAd.id,
        title: selectedAd.title,
        description: selectedAd.description,
        imageUrl: selectedAd.imageUrl,
        linkUrl: selectedAd.linkUrl,
        sponsor: selectedAd.sponsor,
        category: selectedAd.category,
        ctaText: selectedAd.ctaText,
        backgroundColor: selectedAd.backgroundColor,
        textColor: selectedAd.textColor
      },
      meta: {
        totalAds: ads.length,
        timestamp: new Date().toISOString(),
        format: format
      }
    });
    
  } catch (error) {
    console.error('❌ Ad server error:', error.message);
    console.error('Full error:', error);
    
    // Return fallback ad on error
    const fallbackAd = getFallbackAds()[0];
    res.status(200).json({
      success: true,
      ad: fallbackAd,
      meta: {
        error: 'Using fallback ad due to server error',
        timestamp: new Date().toISOString()
      }
    });
  }
}
