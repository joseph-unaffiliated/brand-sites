/**
 * Enhanced Customer.io to BigQuery Integration Script
 * Syncs subscription changes and email events to your existing BigQuery tables
 */

import { BigQuery } from '@google-cloud/bigquery';
import crypto from 'crypto';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

// Customer.io API configuration
const CIO_SITE_ID = process.env.CIO_SITE_ID;
const CIO_API_KEY = process.env.CIO_API_KEY;
const CIO_TRACK_URL = process.env.CIO_TRACK_URL || 'https://track.customer.io/api/v2';

// Reverse mapping from Customer.io brand names to URL-friendly names
const BRAND_NAME_TO_ID = {
    'Bat Mitzvah Horror Stories': 'batmitzvahhorrorstories',
    'Grape Juice and Nostalgia': 'grapejuiceandnostalgia',
    'Hard Resets': 'hardresets',
    'High Diaries': 'highdiaries',
    'Hipspeak': 'hipspeak',
    'Hookup Lists': 'hookuplists',
    'Millennial vs Gen Z': 'millennialvsgenz',
    'Obscure Mixtape': 'obscuremixtape',
    'One Time at Camp': 'onetimeatcamp',
    'The 90s Parent': 'the90sparent',
    'The Coming of Age Party': 'thecomingofageparty',
    'The Dad\'s Dad': 'thedadsdad',
    'The Eyeballer\'s Cookbook': 'theeyeballerscookbook',
    'The Mixed Home': 'themixedhome',
    'The Pack and Play': 'thepackandplay',
    'The Pickle Report': 'thepicklereport',
    'The Proud Parent': 'theproudparent',
    'The Quirkiest': 'thequirkiest',
    'The Steward Prize': 'thestewardprize',
    'Toddler Cinema': 'toddlercinema',
    'Zits and Cake': 'zitsandcake',
    'Heeb Newsletters': 'heebnewsletters'
};

// Mapping from UTM campaign prefixes to brand IDs
// Used to extract brand from UTMcampaign (e.g., "HL" = hookuplists)
const UTM_PREFIX_TO_BRAND = {
    'HL': 'hookuplists',
    'TPR': 'thepicklereport',
    'TMH': 'themixedhome',
    'BMHS': 'batmitzvahhorrorstories',
    'GAN': 'grapejuiceandnostalgia',
    'HR': 'hardresets',
    'HD': 'highdiaries',
    'HS': 'hipspeak',
    'MVG': 'millennialvsgenz',
    'OM': 'obscuremixtape',
    'OTAC': 'onetimeatcamp',
    'TNP': 'the90sparent',
    'TCAP': 'thecomingofageparty',
    'TDD': 'thedadsdad',
    'TEC': 'theeyeballerscookbook',
    'TPAP': 'thepackandplay',
    'TPP': 'theproudparent',
    'TQ': 'thequirkiest',
    'TSP': 'thestewardprize',
    'TC': 'toddlercinema',
    'ZAC': 'zitsandcake',
    'HN': 'heebnewsletters'
};

function hashEmail(email, salt = process.env.EMAIL_SALT || 'default-salt') {
  try {
    return crypto.createHash('sha256').update(email + salt).digest('hex');
  } catch (error) {
    console.error('Email hashing error:', error.message);
    return email;
  }
}

/**
 * Parse UTM parameters from a URL
 * Returns an object with utm_source, utm_medium, utm_campaign, utm_content, utm_term
 */
function parseUTMParameters(url) {
  if (!url) return {};
  
  try {
    const urlObj = new URL(url);
    const params = {};
    
    // Get all UTM parameters from URL
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmParams.forEach(param => {
      const value = urlObj.searchParams.get(param);
      if (value) {
        params[param] = decodeURIComponent(value);
      }
    });
    
    // Also check for camelCase versions (Customer.io sometimes uses these)
    const camelCaseMap = {
      'utmSource': 'utm_source',
      'utmMedium': 'utm_medium',
      'utmCampaign': 'utm_campaign',
      'utmContent': 'utm_content',
      'utmTerm': 'utm_term'
    };
    
    Object.entries(camelCaseMap).forEach(([camel, snake]) => {
      const value = urlObj.searchParams.get(camel);
      if (value && !params[snake]) {
        params[snake] = decodeURIComponent(value);
      }
    });
    
    return params;
  } catch (error) {
    console.error('Error parsing UTM parameters from URL:', error.message);
    return {};
  }
}

/**
 * Extract brand ID from UTMcampaign parameter
 * Looks for brand prefix at the start of the campaign (e.g., "HL" = hookuplists)
 */
function extractBrandFromUTMCampaign(utmCampaign) {
  if (!utmCampaign) return null;
  
  // Try to match brand prefix at the start of the campaign
  // Format: "HL" or "HL - Campaign Name" or "HL_CampaignName"
  const upperCampaign = utmCampaign.toUpperCase();
  
  // Check for exact prefix match or prefix followed by separator
  for (const [prefix, brandId] of Object.entries(UTM_PREFIX_TO_BRAND)) {
    if (upperCampaign.startsWith(prefix)) {
      // Check if it's followed by a separator or end of string
      const nextChar = upperCampaign[prefix.length];
      if (!nextChar || nextChar === ' ' || nextChar === '-' || nextChar === '_' || nextChar === '|') {
        return brandId;
      }
    }
  }
  
  return null;
}

/**
 * Extract brand ID from campaign name
 * Uses BRAND_NAME_TO_ID mapping to find matching brand
 */
function extractBrandFromCampaignName(campaignName) {
  if (!campaignName) return null;
  
  // Try exact match first
  if (BRAND_NAME_TO_ID[campaignName]) {
    return BRAND_NAME_TO_ID[campaignName];
  }
  
  // Try case-insensitive match
  const lowerName = campaignName.toLowerCase();
  for (const [cioName, brandId] of Object.entries(BRAND_NAME_TO_ID)) {
    if (cioName.toLowerCase() === lowerName) {
      return brandId;
    }
  }
  
  // Try to find brand name within campaign name (e.g., "The Pickle Report - Weekly Newsletter")
  for (const [cioName, brandId] of Object.entries(BRAND_NAME_TO_ID)) {
    if (campaignName.toLowerCase().includes(cioName.toLowerCase())) {
      return brandId;
    }
  }
  
  // Try to match brand ID directly in campaign name (e.g., "hookuplists", "thepicklereport")
  const brandIds = Object.values(BRAND_NAME_TO_ID);
  for (const brandId of brandIds) {
    if (lowerName.includes(brandId)) {
      return brandId;
    }
  }
  
  return null;
}

/**
 * Convert Customer.io relationships to BigQuery subscriptions format
 */
function convertRelationshipsToSubscriptions(relationships) {
  const subscriptions = {};
  
  if (!relationships || !Array.isArray(relationships)) return subscriptions;
  
  relationships.forEach(rel => {
    if (rel.identifiers && rel.identifiers.object_type_id === "1") {
      const brandName = rel.identifiers.object_id;
      const brandId = BRAND_NAME_TO_ID[brandName];
      
      if (brandId) {
        subscriptions[brandId] = {
          subscribed_timestamp: Date.now(),
          subSource: 'cio_sync'
        };
      }
    }
  });
  
  return subscriptions;
}

/**
 * Detect magic link URLs and return the appropriate eventType
 * Magic link URLs: https://magic.[brand].com/unsubscribe, /snooze, or root (subscribe)
 * Returns: 'unsubscribe', 'snooze', 'subscribe', or null if not a magic link
 */
function detectMagicLinkEventType(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check if it's a magic link domain (magic.[brand].com)
    const magicLinkMatch = hostname.match(/^magic\.([^.]+)\.com$/);
    if (!magicLinkMatch) return null;
    
    // Extract the action from the path
    if (pathname === '/unsubscribe' || pathname.startsWith('/unsubscribe')) {
      return 'unsubscribe';
    } else if (pathname === '/snooze' || pathname.startsWith('/snooze')) {
      return 'snooze';
    } else if (pathname === '/' || pathname === '') {
      // Root path is typically subscribe
      return 'subscribe';
    }
    
    return null;
  } catch (error) {
    // URL parsing failed, not a magic link
    return null;
  }
}

/**
 * Sync email event to your existing clicks table
 * Handles Customer.io webhook events: email.sent, email.opened, email.clicked, email.bounced, email.unsubscribed
 * 
 * Customer.io webhook payload structure:
 * {
 *   "event_id": "unique_event_id",
 *   "event_type": "email.clicked",
 *   "timestamp": 1234567890,
 *   "data": {
 *     "person": { "id": "...", "email": "...", "attributes": {...} },
 *     "campaign": { "id": "...", "name": "...", "segment_id": "..." },
 *     "link": { "url": "..." },
 *     "device": { "user_agent": "...", "ip": "..." }
 *   }
 * }
 */
/**
 * Queue email event to staging table for batch processing
 * This prevents "too many DML statements" errors by batching events
 */
async function queueEmailEventToClicks(eventData) {
  try {
    // Handle multiple payload formats:
    // 1. Segment-style: { type: "track", event: "Email Delivered", properties: {...}, context: {...} }
    // 2. Customer.io native: { event_type: "email.delivered", data: { person, campaign, ... } }
    // 3. Flat format: { type: "email.delivered", person_id: "...", campaign_id: "..." }
    
    let eventType = '';
    let eventId = '';
    let personId = '';
    let email = '';
    let campaignId = '';
    let campaignName = null;
    let segmentId = null;
    let linkUrl = null;
    let userAgent = null;
    let locationIP = null;
    let eventTimestamp = Date.now();
    
    // Check if this is Segment-style format (type: "track" with event field)
    if (eventData.type === 'track' && eventData.event) {
      // Segment-style format
      const segmentEvent = eventData.event;
      
      // Map Segment event names to our event types
      const segmentEventMapping = {
        'Email Sent': 'email.sent',
        'Email Opened': 'email.opened',
        'Email Clicked': 'email.clicked',
        'Email Link Clicked': 'email.clicked',
        'Email Bounced': 'email.bounced',
        'Email Unsubscribed': 'email.unsubscribed',
        'Email Delivered': 'email.delivered',
        'Email Marked as Spam': 'email.spam_complaint',
        'Email Spam Complaint': 'email.spam_complaint', // Legacy/alternative name
        'Email SpamComplaint': 'email.spam_complaint' // Legacy/alternative name
      };
      
      eventType = segmentEventMapping[segmentEvent] || segmentEvent.toLowerCase().replace(/\s+/g, '.');
      eventId = eventData.messageId || `${eventData.userId}_${eventData.properties?.campaign_id || 'unknown'}_${Date.now()}`;
      
      // Extract from Segment format
      personId = eventData.userId || eventData.properties?.customer_id || eventData.properties?.userId || '';
      email = eventData.context?.traits?.email || eventData.properties?.recipient || eventData.properties?.email || '';
      campaignId = eventData.properties?.campaign_id?.toString() || '';
      campaignName = eventData.properties?.campaign_name || null;
      segmentId = eventData.properties?.segment_id?.toString() || null;
      // Extract href from properties (Customer.io uses 'href' for link clicks)
      linkUrl = eventData.properties?.href || eventData.properties?.link_url || eventData.properties?.url || null;
      userAgent = eventData.context?.userAgent || eventData.properties?.user_agent || null;
      locationIP = eventData.context?.ip || eventData.properties?.ip || null;
      
      // Parse timestamp
      if (eventData.timestamp) {
        eventTimestamp = typeof eventData.timestamp === 'string' 
          ? new Date(eventData.timestamp).getTime() 
          : eventData.timestamp;
      }
      
    } else {
      // Customer.io native or flat format
      eventType = eventData.event_type || eventData.type || '';
      eventId = eventData.event_id || eventData.messageId || `${eventData.person?.id || eventData.person_id || eventData.userId}_${eventData.campaign?.id || eventData.campaign_id}_${Date.now()}`;
      
      // Extract data from nested structure (Customer.io webhook format)
      const person = eventData.person || eventData.data?.person || {};
      const campaign = eventData.campaign || eventData.data?.campaign || {};
      const link = eventData.link || eventData.data?.link || {};
      const device = eventData.device || eventData.data?.device || {};
      
      personId = person.id || eventData.person_id || eventData.userId || '';
      email = person.email || person.attributes?.email || eventData.email || eventData.properties?.recipient || '';
      campaignId = campaign.id || eventData.campaign_id || eventData.properties?.campaign_id?.toString() || '';
      campaignName = campaign.name || eventData.campaign_name || eventData.properties?.campaign_name || null;
      segmentId = campaign.segment_id || eventData.segment_id || eventData.properties?.segment_id?.toString() || null;
      linkUrl = link.url || eventData.link_url || eventData.url || eventData.properties?.link_url || null;
      userAgent = device.user_agent || eventData.user_agent || eventData.context?.userAgent || null;
      locationIP = device.ip || eventData.ip || eventData.locationIP || eventData.context?.ip || null;
      
      // Parse timestamp
      if (eventData.timestamp || eventData.data?.timestamp) {
        const ts = eventData.timestamp || eventData.data?.timestamp;
        eventTimestamp = typeof ts === 'string' ? new Date(ts).getTime() : ts;
      }
    }
    
    const emailHash = hashEmail(email);
    const eventDate = new Date(eventTimestamp);
    
    // Map Customer.io event types to your schema
    const eventTypeMapping = {
      'email.sent': 'sent',
      'email.opened': 'opened', 
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.unsubscribed': 'unsubscribed',
      'email.delivered': 'delivered',
      'email.spam_complaint': 'spam_complaint',
      'email.spamcomplaint': 'spam_complaint'
    };
    
    let cioEventType = eventTypeMapping[eventType] || 'unknown';
    
    // Override eventType for magic link URLs (unsubscribe, snooze, subscribe)
    // This ensures clicks to magic links are logged with the correct action type
    if (cioEventType === 'clicked' && linkUrl) {
      const magicLinkEventType = detectMagicLinkEventType(linkUrl);
      if (magicLinkEventType) {
        cioEventType = magicLinkEventType;
        console.log(`🔗 Detected magic link: ${linkUrl} → eventType: ${cioEventType}`);
      }
    }
    
    // Parse UTM parameters from the URL if available (needed for brand extraction)
    // Initialize as empty object to avoid undefined errors
    const utmParams = linkUrl ? parseUTMParameters(linkUrl) : {};
    
    // Extract brand using multiple strategies
    // Wrap in try-catch to ensure brand extraction failures don't prevent click logging
    let brand = null;
    try {
      // Strategy 1: Check explicit brand field (works for both formats)
      if (eventData.brand || eventData.properties?.brand) {
        brand = eventData.brand || eventData.properties?.brand;
      } else if (eventData.campaign?.attributes?.brand) {
        // Customer.io native format
        brand = eventData.campaign.attributes.brand;
      }
      
      // Strategy 2: For clicks, extract from UTMcampaign prefix (e.g., "HL" = hookuplists)
      if (!brand && (cioEventType === 'clicked' || cioEventType === 'opened')) {
        const utmCampaign = (utmParams && utmParams.utm_campaign) || eventData.utm_campaign || eventData.properties?.utmCampaign;
        if (utmCampaign) {
          brand = extractBrandFromUTMCampaign(utmCampaign);
        }
      }
      
      // Strategy 3: Extract from campaign name using BRAND_NAME_TO_ID mapping
      if (!brand && campaignName) {
        brand = extractBrandFromCampaignName(campaignName);
      }
      
      // Strategy 4: Try to extract from URL domain (for clicks with URLs)
      if (!brand && linkUrl) {
        try {
          const urlObj = new URL(linkUrl);
          const hostname = urlObj.hostname.replace('www.', '');
          // Check if hostname matches a brand domain pattern
          const brandMatch = hostname.match(/^([^.]+)\.com$/);
          if (brandMatch) {
            const domainBrand = brandMatch[1];
            // Check if it's a valid brand ID
            if (Object.values(BRAND_NAME_TO_ID).includes(domainBrand)) {
              brand = domainBrand;
            }
          }
        } catch (e) {
          // URL parsing failed, ignore
        }
      }
    } catch (error) {
      // Brand extraction failed, but we'll still log the click with brand = null
      console.warn(`⚠️ Brand extraction failed (continuing anyway): ${error.message}`);
    }
    
    console.log(`📥 Queueing email event for batch processing: ${eventType} (${cioEventType})`);
    console.log(`   Event ID: ${eventId}, Person: ${personId}, Campaign: ${campaignId}, Brand: ${brand || 'unknown'}`);
    
    // Insert into staging queue table (no MERGE, just INSERT - duplicates handled in batch processor)
    const eventDateISO = eventDate.toISOString();
    const insertQuery = `
      INSERT INTO \`${process.env.GCP_PROJECT_ID}.analytics.clicks_queue\` (
        clickID, userID, email, emailHash, campaignID, articleID, brand, url, dateISO,
        CPCrevenue, sponsorID, locationIP, UTMsource, UTMcampaign, UTMmedium, UTMcontent, userAgent,
        cfBotScore, validationStatus, companyName, companyDomain, companySize,
        industry, source, eventType, cio_campaign_name, cio_segment_id,
        cio_delivery_status, cio_engagement_score, prefetched, queued_at
      )
      VALUES (
        @clickID, @userID, @email, @emailHash, @campaignID, @articleID, @brand, @url, @dateISO,
        @CPCrevenue, @sponsorID, @locationIP, @UTMsource, @UTMcampaign, @UTMmedium, @UTMcontent, @userAgent,
        @cfBotScore, @validationStatus, @companyName, @companyDomain, @companySize,
        @industry, @source, @eventType, @cio_campaign_name, @cio_segment_id,
        @cio_delivery_status, @cio_engagement_score, @prefetched, CURRENT_TIMESTAMP()
      )
    `;
    
    try {
      await bq.query({
        query: insertQuery,
        params: {
          clickID: eventId,
          userID: personId,
          email: email,
          emailHash: emailHash,
          campaignID: campaignId,
          articleID: null,
          brand: brand,
          url: linkUrl,
          dateISO: eventDateISO,
          CPCrevenue: null,
          sponsorID: null,
          locationIP: locationIP,
          UTMsource: (utmParams && utmParams.utm_source) || eventData.utm_source || null,
          UTMcampaign: (utmParams && utmParams.utm_campaign) || eventData.utm_campaign || null,
          UTMmedium: (utmParams && utmParams.utm_medium) || eventData.utm_medium || null,
          UTMcontent: (utmParams && utmParams.utm_content) || eventData.utm_content || null,
          userAgent: userAgent,
          cfBotScore: null,
          validationStatus: null,
          companyName: null,
          companyDomain: null,
          companySize: null,
          industry: null,
          source: 'customer_io',
          eventType: cioEventType,
          cio_campaign_name: campaignName,
          cio_segment_id: segmentId,
          cio_delivery_status: eventData.delivery_status || null,
          cio_engagement_score: eventData.engagement_score || null,
          prefetched: eventData.properties?.prefetched ?? eventData.prefetched ?? null
        },
        types: {
          clickID: 'STRING',
          userID: 'STRING',
          email: 'STRING',
          emailHash: 'STRING',
          campaignID: 'STRING',
          articleID: 'STRING',
          brand: 'STRING',
          url: 'STRING',
          dateISO: 'STRING',
          CPCrevenue: 'FLOAT',
          sponsorID: 'STRING',
          locationIP: 'STRING',
          UTMsource: 'STRING',
          UTMcampaign: 'STRING',
          UTMmedium: 'STRING',
          UTMcontent: 'STRING',
          userAgent: 'STRING',
          cfBotScore: 'INTEGER',
          validationStatus: 'STRING',
          companyName: 'STRING',
          companyDomain: 'STRING',
          companySize: 'INTEGER',
          industry: 'STRING',
          source: 'STRING',
          eventType: 'STRING',
          cio_campaign_name: 'STRING',
          cio_segment_id: 'STRING',
          cio_delivery_status: 'STRING',
          cio_engagement_score: 'FLOAT',
          prefetched: 'BOOL'
        }
      });
      
      console.log(`✅ Successfully queued email event: ${eventId}`);
      return { success: true, eventId, cioEventType };
      
    } catch (error) {
      // If insert fails (e.g., table doesn't exist), log but don't fail the webhook
      console.error(`⚠️ Failed to queue event (non-fatal): ${error.message}`);
      // Return success anyway - the batch processor will catch up
      return { success: true, eventId, cioEventType, warning: 'Event queued with warning' };
    }
    
  } catch (error) {
    console.error(`❌ Error queueing email event:`, error.message);
    console.error('Event data:', JSON.stringify(eventData, null, 2));
    return { success: false, error: error.message };
  }
}

/**
 * Legacy function name - now queues events instead of direct MERGE
 * Kept for backward compatibility
 */
async function syncEmailEventToClicks(eventData) {
  return await queueEmailEventToClicks(eventData);
}

/**
 * Process queued email events in batch to avoid "too many DML statements" errors
 * This function is called by a cron job to process events from clicks_queue table
 */
async function processClicksQueue() {
  try {
    console.log('🔄 Processing clicks queue...');
    
    // Get all queued events
    const queueQuery = `
      SELECT 
        clickID, userID, email, emailHash, campaignID, articleID, brand, url, dateISO,
        CPCrevenue, sponsorID, locationIP, UTMsource, UTMcampaign, UTMmedium, UTMcontent, userAgent,
        cfBotScore, validationStatus, companyName, companyDomain, companySize,
        industry, source, eventType, cio_campaign_name, cio_segment_id,
        cio_delivery_status, cio_engagement_score, prefetched
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.clicks_queue\`
      ORDER BY queued_at ASC
      LIMIT 1000
    `;
    
    const [rows] = await bq.query(queueQuery);
    
    if (rows.length === 0) {
      console.log('✅ No events in queue');
      return { success: true, processed: 0 };
    }
    
    console.log(`📦 Processing ${rows.length} queued events...`);
    
    // Build batch MERGE query
    // Deduplicate by clickID - if same event was queued multiple times (webhook retries),
    // keep only the most recent version (by queued_at DESC)
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.clicks\` AS target
      USING (
        SELECT 
          clickID, userID, email, emailHash, campaignID, articleID, brand, url,
          PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', dateISO) AS date,
          CPCrevenue, sponsorID, locationIP, UTMsource, UTMcampaign, UTMmedium, UTMcontent, userAgent,
          cfBotScore, validationStatus, companyName, companyDomain, companySize,
          industry, source, eventType, cio_campaign_name, cio_segment_id,
          cio_delivery_status, cio_engagement_score, prefetched,
          CURRENT_TIMESTAMP() AS cio_last_synced_at
        FROM (
          SELECT 
            clickID, userID, email, emailHash, campaignID, articleID, brand, url, dateISO,
            CPCrevenue, sponsorID, locationIP, UTMsource, UTMcampaign, UTMmedium, UTMcontent, userAgent,
            cfBotScore, validationStatus, companyName, companyDomain, companySize,
            industry, source, eventType, cio_campaign_name, cio_segment_id,
            cio_delivery_status, cio_engagement_score, prefetched,
            ROW_NUMBER() OVER (PARTITION BY clickID ORDER BY queued_at DESC) as rn
          FROM \`${process.env.GCP_PROJECT_ID}.analytics.clicks_queue\`
          WHERE clickID IN UNNEST(@clickIDs)
        )
        WHERE rn = 1
      ) AS source
      ON target.clickID = source.clickID
      WHEN MATCHED THEN
        UPDATE SET
          userID = COALESCE(source.userID, target.userID),
          email = COALESCE(source.email, target.email),
          emailHash = COALESCE(source.emailHash, target.emailHash),
          campaignID = COALESCE(source.campaignID, target.campaignID),
          brand = COALESCE(source.brand, target.brand),
          url = COALESCE(source.url, target.url),
          date = GREATEST(COALESCE(source.date, TIMESTAMP('1970-01-01')), COALESCE(target.date, TIMESTAMP('1970-01-01'))),
          locationIP = COALESCE(source.locationIP, target.locationIP),
          UTMsource = COALESCE(source.UTMsource, target.UTMsource),
          UTMcampaign = COALESCE(source.UTMcampaign, target.UTMcampaign),
          UTMmedium = COALESCE(source.UTMmedium, target.UTMmedium),
          UTMcontent = COALESCE(source.UTMcontent, target.UTMcontent),
          userAgent = COALESCE(source.userAgent, target.userAgent),
          eventType = COALESCE(source.eventType, target.eventType),
          cio_campaign_name = COALESCE(source.cio_campaign_name, target.cio_campaign_name),
          cio_segment_id = COALESCE(source.cio_segment_id, target.cio_segment_id),
          cio_delivery_status = COALESCE(source.cio_delivery_status, target.cio_delivery_status),
          cio_engagement_score = COALESCE(source.cio_engagement_score, target.cio_engagement_score),
          prefetched = COALESCE(source.prefetched, target.prefetched),
          cio_last_synced_at = source.cio_last_synced_at
      WHEN NOT MATCHED THEN
        INSERT (
          clickID, userID, email, emailHash, campaignID, articleID, brand, url, date,
          CPCrevenue, sponsorID, locationIP, UTMsource, UTMcampaign, UTMmedium, UTMcontent, userAgent,
          cfBotScore, validationStatus, companyName, companyDomain, companySize,
          industry, source, eventType, cio_campaign_name, cio_segment_id,
          cio_delivery_status, cio_engagement_score, prefetched, cio_last_synced_at
        )
        VALUES (
          source.clickID, source.userID, source.email, source.emailHash, source.campaignID, 
          source.articleID, source.brand, source.url, source.date,
          source.CPCrevenue, source.sponsorID, source.locationIP, source.UTMsource, 
          source.UTMcampaign, source.UTMmedium, source.UTMcontent, source.userAgent,
          source.cfBotScore, source.validationStatus, source.companyName, source.companyDomain, 
          source.companySize, source.industry, source.source,
          source.eventType, source.cio_campaign_name, source.cio_segment_id,
          source.cio_delivery_status, source.cio_engagement_score, source.prefetched, source.cio_last_synced_at
        )
    `;
    
    const clickIDs = rows.map(row => row.clickID);
    
    await bq.query({
      query: mergeQuery,
      params: { clickIDs }
    });
    
    // Delete processed events from queue
    const deleteQuery = `
      DELETE FROM \`${process.env.GCP_PROJECT_ID}.analytics.clicks_queue\`
      WHERE clickID IN UNNEST(@clickIDs)
    `;
    
    await bq.query({
      query: deleteQuery,
      params: { clickIDs }
    });
    
    console.log(`✅ Successfully processed ${rows.length} events from queue`);
    return { success: true, processed: rows.length };
    
  } catch (error) {
    console.error(`❌ Error processing clicks queue:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Handle global suppression when user marks email as spam
 * - Sets globalSuppressionDate in users table
 * - Unsubscribes from all brands
 */
async function handleGlobalSuppression(userID, email, spamComplaintTimestamp) {
  try {
    console.log(`🚫 Handling global suppression for user ${userID} (${email})`);
    
    // Get user's current subscriptions from BigQuery
    const query = `
      SELECT userID, email, subscriptions, unsubscribed_brands
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE userID = @userID 
      LIMIT 1
    `;
    
    const [rows] = await bq.query({ 
      query, 
      params: { userID: userID },
      types: { userID: 'STRING' }
    });
    
    if (rows.length === 0) {
      console.log(`   ⚠️ User ${userID} not found in BigQuery`);
      return { success: false, error: 'User not found' };
    }
    
    const currentUser = rows[0];
    let subscriptions = {};
    let unsubscribedBrands = {};
    
    // Parse existing subscriptions
    if (currentUser.subscriptions) {
      try {
        subscriptions = typeof currentUser.subscriptions === 'string' 
          ? JSON.parse(currentUser.subscriptions) 
          : currentUser.subscriptions;
      } catch (e) {
        console.log('   ⚠️ Could not parse existing subscriptions');
        subscriptions = {};
      }
    }
    
    // Parse existing unsubscribed_brands
    if (currentUser.unsubscribed_brands) {
      try {
        unsubscribedBrands = typeof currentUser.unsubscribed_brands === 'string'
          ? JSON.parse(currentUser.unsubscribed_brands)
          : currentUser.unsubscribed_brands;
      } catch (e) {
        console.log('   ⚠️ Could not parse existing unsubscribed_brands');
        unsubscribedBrands = {};
      }
    }
    
    // Get all subscribed brand IDs
    const subscribedBrandIds = Object.keys(subscriptions);
    
    if (subscribedBrandIds.length === 0) {
      console.log(`   ℹ️ User ${userID} has no active subscriptions - setting globalSuppressionDate only`);
      
      // Build query after we know the final state
      // Use direct string interpolation like other MERGE queries in the codebase
      const finalSubscriptions = JSON.stringify(subscriptions);
      const finalUnsubscribedBrands = JSON.stringify(unsubscribedBrands);
      const globalSuppressionDateISO = new Date(spamComplaintTimestamp).toISOString();
      
      console.log(`   🔍 MERGE query values:`, {
        userID,
        subscriptions: finalSubscriptions,
        unsubscribed_brands: finalUnsubscribedBrands,
        globalSuppressionDate: globalSuppressionDateISO
      });
      
      const updateQuery = `
        MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
        USING (
          SELECT 
            '${userID}' AS userID,
            JSON '${finalSubscriptions.replace(/'/g, "''")}' AS subscriptions,
            '${finalUnsubscribedBrands.replace(/'/g, "''")}' AS unsubscribed_brands,
            PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', '${globalSuppressionDateISO}') AS globalSuppressionDate
        ) AS source
        ON target.userID = source.userID
        WHEN MATCHED THEN
          UPDATE SET
            subscriptions = source.subscriptions,
            unsubscribed_brands = source.unsubscribed_brands,
            globalSuppressionDate = source.globalSuppressionDate
        WHEN NOT MATCHED THEN
          INSERT (userID, subscriptions, unsubscribed_brands, globalSuppressionDate)
          VALUES (source.userID, source.subscriptions, source.unsubscribed_brands, source.globalSuppressionDate)
      `;
      
      await bq.query({
        query: updateQuery
      });
      
      console.log(`   ✅ Updated BigQuery: set globalSuppressionDate`);
    } else {
      console.log(`   📋 Found ${subscribedBrandIds.length} active subscriptions: ${subscribedBrandIds.join(', ')}`);
      
      // Unsubscribe from all brands - add to unsubscribed_brands
      subscribedBrandIds.forEach(brandId => {
        unsubscribedBrands[brandId] = spamComplaintTimestamp;
      });
      
      // Remove all subscriptions
      subscriptions = {};
      
      // Build query AFTER updating subscriptions and unsubscribedBrands
      // Use direct string interpolation like other MERGE queries in the codebase
      const finalSubscriptions = JSON.stringify(subscriptions);
      const finalUnsubscribedBrands = JSON.stringify(unsubscribedBrands);
      const globalSuppressionDateISO = new Date(spamComplaintTimestamp).toISOString();
      
      console.log(`   🔍 MERGE query values:`, {
        userID,
        subscriptions: finalSubscriptions,
        unsubscribed_brands: finalUnsubscribedBrands,
        globalSuppressionDate: globalSuppressionDateISO
      });
      
      const updateQuery = `
        MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
        USING (
          SELECT 
            '${userID}' AS userID,
            JSON '${finalSubscriptions.replace(/'/g, "''")}' AS subscriptions,
            '${finalUnsubscribedBrands.replace(/'/g, "''")}' AS unsubscribed_brands,
            PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', '${globalSuppressionDateISO}') AS globalSuppressionDate
        ) AS source
        ON target.userID = source.userID
        WHEN MATCHED THEN
          UPDATE SET
            subscriptions = source.subscriptions,
            unsubscribed_brands = source.unsubscribed_brands,
            globalSuppressionDate = source.globalSuppressionDate
        WHEN NOT MATCHED THEN
          INSERT (userID, subscriptions, unsubscribed_brands, globalSuppressionDate)
          VALUES (source.userID, source.subscriptions, source.unsubscribed_brands, source.globalSuppressionDate)
      `;
      
      // Update BigQuery: clear subscriptions, update unsubscribed_brands, set globalSuppressionDate
      await bq.query({
        query: updateQuery
      });
      
      console.log(`   ✅ Updated BigQuery: cleared subscriptions, set globalSuppressionDate`);
      
      // Unsubscribe from all brands in Customer.io
      if (subscribedBrandIds.length > 0) {
        try {
          console.log(`   📤 Unsubscribing from ${subscribedBrandIds.length} brands in Customer.io...`);
          
          // Map brand IDs to Customer.io brand names
          // BRAND_NAME_TO_ID maps: Customer.io brand name -> brand ID
          // We need the reverse: brand ID -> Customer.io brand name
          const cioBrandNames = {};
          Object.entries(BRAND_NAME_TO_ID).forEach(([cioName, brandId]) => {
            cioBrandNames[brandId] = cioName;
          });
          
          const cioRelationships = subscribedBrandIds.map(brandId => ({
            identifiers: {
              object_type_id: "1",
              object_id: cioBrandNames[brandId] || brandId
            }
          }));
          
          // Prepare unsubscribed_brands attribute for Customer.io
          const unsubscribeAttributes = {
            email: email,
            unsubscribed_brands: unsubscribedBrands,
            global_suppression: true,
            global_suppression_date: new Date(spamComplaintTimestamp).toISOString()
          };
          
          // Remove individual brand subscription attributes
          subscribedBrandIds.forEach(brandId => {
            unsubscribeAttributes[`subscribed_to_${brandId}`] = false;
            unsubscribeAttributes[`${brandId}_subscription_date`] = null;
          });
          
          // Make Customer.io API calls
          const auth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');
          
          // Update attributes
          const attributeRequest = {
            type: "person",
            identifiers: { id: userID },
            action: "identify",
            attributes: unsubscribeAttributes
          };
          
          // Remove relationships
          const relationshipRequest = {
            type: "person",
            identifiers: { id: userID },
            action: "delete_relationships",
            cio_relationships: cioRelationships
          };
          
          // Send both requests
          const [attrResponse, relResponse] = await Promise.all([
            fetch(`${CIO_TRACK_URL}/entity`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(attributeRequest)
            }),
            fetch(`${CIO_TRACK_URL}/entity`, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(relationshipRequest)
            })
          ]);
          
          if (attrResponse.ok && relResponse.ok) {
            console.log(`   ✅ Successfully unsubscribed from all brands in Customer.io`);
          } else {
            const attrError = await attrResponse.text().catch(() => 'Unknown error');
            const relError = await relResponse.text().catch(() => 'Unknown error');
            console.log(`   ⚠️ Customer.io unsubscribe partially failed - attributes: ${attrResponse.ok ? 'OK' : attrError}, relationships: ${relResponse.ok ? 'OK' : relError}`);
          }
        } catch (cioError) {
          console.log(`   ⚠️ Customer.io unsubscribe error: ${cioError.message}`);
          // Don't fail the whole operation if Customer.io fails
        }
      }
    }
    
    console.log(`   ✅ Global suppression completed for user ${userID}`);
    return { success: true, unsubscribedBrands: subscribedBrandIds };
    
  } catch (error) {
    console.error('❌ Error handling global suppression:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync campaign performance to your existing campaigns table
 * Can be called with campaign data from webhook or API, or will aggregate from clicks table
 */
async function syncCampaignToCampaigns(campaignData) {
  try {
    const campaignId = campaignData.id || campaignData.campaignID || campaignData.campaign_id;
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }
    
    console.log(`🔄 Syncing campaign to campaigns table: ${campaignId}`);
    
    // Extract campaign data (handle both webhook and API formats)
    const campaignName = campaignData.name || campaignData.campaign_name || null;
    const segmentId = campaignData.segment_id || null;
    const brand = campaignData.brand || campaignData.attributes?.brand || null;
    
    // Calculate volumes and rates from provided data or use defaults
    const sendVolume = campaignData.sent_count || campaignData.sent || campaignData.metrics?.sent || 0;
    const openVolume = campaignData.opened_count || campaignData.opened || campaignData.metrics?.opened || 0;
    const clickVolume = campaignData.clicked_count || campaignData.clicked || campaignData.metrics?.clicked || 0;
    const unsubVolume = campaignData.unsubscribed_count || campaignData.unsubscribed || campaignData.metrics?.unsubscribed || 0;
    const bounceVolume = campaignData.bounced_count || campaignData.bounced || campaignData.metrics?.bounced || 0;
    const complaintVolume = campaignData.complaint_count || campaignData.complaints || campaignData.metrics?.complaints || 0;
    const subscribesVolume = campaignData.subscribes_count || campaignData.subscribes || campaignData.metrics?.subscribes || 0;
    
    // Calculate rates
    const deliveryRate = sendVolume > 0 ? (sendVolume - bounceVolume) / sendVolume : 0;
    const openRate = sendVolume > 0 ? openVolume / sendVolume : 0;
    const clickRate = sendVolume > 0 ? clickVolume / sendVolume : 0;
    const unsubscribeRate = sendVolume > 0 ? unsubVolume / sendVolume : 0;
    const bounceRate = sendVolume > 0 ? bounceVolume / sendVolume : 0;
    
    // Parse date if provided
    let campaignDate = null;
    if (campaignData.date || campaignData.created_at || campaignData.sent_at) {
      const dateStr = campaignData.date || campaignData.created_at || campaignData.sent_at;
      campaignDate = new Date(dateStr).toISOString();
    }
    
    // Use MERGE with parameterized query
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.campaigns\` AS target
      USING (
        SELECT 
          @campaignID AS campaignID,
          @sendVolume AS sendVolume,
          @openVolume AS openVolume,
          @clickVolume AS clickVolume,
          @complaintVolume AS complaintVolume,
          @unsubVolume AS unsubVolume,
          @subscribesVolume AS subscribesVolume,
          @date AS date,
          @brand AS brand,
          @cio_campaign_name AS cio_campaign_name,
          @cio_segment_id AS cio_segment_id,
          @cio_delivery_rate AS cio_delivery_rate,
          @cio_open_rate AS cio_open_rate,
          @cio_click_rate AS cio_click_rate,
          @cio_unsubscribe_rate AS cio_unsubscribe_rate,
          @cio_bounce_rate AS cio_bounce_rate,
          CURRENT_TIMESTAMP() AS cio_last_synced_at
      ) AS source
      ON target.campaignID = source.campaignID
      WHEN MATCHED THEN
        UPDATE SET 
          sendVolume = GREATEST(COALESCE(source.sendVolume, 0), COALESCE(target.sendVolume, 0)),
          openVolume = GREATEST(COALESCE(source.openVolume, 0), COALESCE(target.openVolume, 0)),
          clickVolume = GREATEST(COALESCE(source.clickVolume, 0), COALESCE(target.clickVolume, 0)),
          complaintVolume = GREATEST(COALESCE(source.complaintVolume, 0), COALESCE(target.complaintVolume, 0)),
          unsubVolume = GREATEST(COALESCE(source.unsubVolume, 0), COALESCE(target.unsubVolume, 0)),
          subscribesVolume = GREATEST(COALESCE(source.subscribesVolume, 0), COALESCE(target.subscribesVolume, 0)),
          date = COALESCE(source.date, target.date),
          brand = COALESCE(source.brand, target.brand),
          cio_campaign_name = COALESCE(source.cio_campaign_name, target.cio_campaign_name),
          cio_segment_id = COALESCE(source.cio_segment_id, target.cio_segment_id),
          cio_delivery_rate = COALESCE(source.cio_delivery_rate, target.cio_delivery_rate),
          cio_open_rate = COALESCE(source.cio_open_rate, target.cio_open_rate),
          cio_click_rate = COALESCE(source.cio_click_rate, target.cio_click_rate),
          cio_unsubscribe_rate = COALESCE(source.cio_unsubscribe_rate, target.cio_unsubscribe_rate),
          cio_bounce_rate = COALESCE(source.cio_bounce_rate, target.cio_bounce_rate),
          cio_last_synced_at = CURRENT_TIMESTAMP()
      WHEN NOT MATCHED THEN
        INSERT (
          campaignID, sendVolume, openVolume, clickVolume, complaintVolume, unsubVolume, 
          subscribesVolume, date, brand, cio_campaign_name, cio_segment_id, 
          cio_delivery_rate, cio_open_rate, cio_click_rate, 
          cio_unsubscribe_rate, cio_bounce_rate, cio_last_synced_at
        )
        VALUES (
          source.campaignID, source.sendVolume, source.openVolume, source.clickVolume, 
          source.complaintVolume, source.unsubVolume, source.subscribesVolume, source.date,
          source.brand, source.cio_campaign_name, source.cio_segment_id,
          source.cio_delivery_rate, source.cio_open_rate, source.cio_click_rate,
          source.cio_unsubscribe_rate, source.cio_bounce_rate, source.cio_last_synced_at
        )
    `;
    
    await bq.query({
      query: mergeQuery,
      params: {
        campaignID: campaignId,
        sendVolume: sendVolume,
        openVolume: openVolume,
        clickVolume: clickVolume,
        complaintVolume: complaintVolume,
        unsubVolume: unsubVolume,
        subscribesVolume: subscribesVolume,
        date: campaignDate,
        brand: brand,
        cio_campaign_name: campaignName,
        cio_segment_id: segmentId,
        cio_delivery_rate: deliveryRate,
        cio_open_rate: openRate,
        cio_click_rate: clickRate,
        cio_unsubscribe_rate: unsubscribeRate,
        cio_bounce_rate: bounceRate
      },
      types: {
        campaignID: 'STRING',
        sendVolume: 'INTEGER',
        openVolume: 'INTEGER',
        clickVolume: 'INTEGER',
        complaintVolume: 'INTEGER',
        unsubVolume: 'INTEGER',
        subscribesVolume: 'INTEGER',
        date: 'TIMESTAMP',
        brand: 'STRING',
        cio_campaign_name: 'STRING',
        cio_segment_id: 'STRING',
        cio_delivery_rate: 'FLOAT',
        cio_open_rate: 'FLOAT',
        cio_click_rate: 'FLOAT',
        cio_unsubscribe_rate: 'FLOAT',
        cio_bounce_rate: 'FLOAT'
      }
    });
    
    console.log(`✅ Successfully synced campaign to campaigns table: ${campaignId}`);
    return { success: true, campaignID: campaignId };
    
  } catch (error) {
    console.error(`❌ Error syncing campaign to campaigns:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Aggregate campaign performance from clicks table and sync to campaigns table
 * This is useful when Customer.io doesn't send campaign performance webhooks
 */
async function aggregateCampaignPerformanceFromClicks(campaignId) {
  try {
    console.log(`📊 Aggregating campaign performance from clicks table: ${campaignId}`);
    
    const query = `
      SELECT 
        campaignID,
        COUNTIF(eventType = 'sent') AS sendVolume,
        COUNTIF(eventType = 'opened') AS openVolume,
        COUNTIF(eventType = 'clicked') AS clickVolume,
        COUNTIF(eventType = 'unsubscribed') AS unsubVolume,
        COUNTIF(eventType = 'bounced') AS bounceVolume,
        MAX(cio_campaign_name) AS cio_campaign_name,
        MAX(cio_segment_id) AS cio_segment_id,
        MAX(brand) AS brand,
        MIN(date) AS date
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.clicks\`
      WHERE campaignID = @campaignID
        AND source = 'customer_io'
      GROUP BY campaignID
    `;
    
    const [rows] = await bq.query({
      query,
      params: { campaignID: campaignId },
      types: { campaignID: 'STRING' }
    });
    
    if (rows.length === 0) {
      console.log(`⚠️ No clicks data found for campaign: ${campaignId}`);
      return { success: false, error: 'No data found' };
    }
    
    const aggregated = rows[0];
    
    // Sync aggregated data to campaigns table
    const campaignData = {
      id: aggregated.campaignID,
      campaignID: aggregated.campaignID,
      sent_count: aggregated.sendVolume || 0,
      opened_count: aggregated.openVolume || 0,
      clicked_count: aggregated.clickVolume || 0,
      unsubscribed_count: aggregated.unsubVolume || 0,
      bounced_count: aggregated.bounceVolume || 0,
      campaign_name: aggregated.cio_campaign_name,
      segment_id: aggregated.cio_segment_id,
      brand: aggregated.brand,
      date: aggregated.date
    };
    
    return await syncCampaignToCampaigns(campaignData);
    
  } catch (error) {
    console.error(`❌ Error aggregating campaign performance:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync a single person from Customer.io to BigQuery (users table)
 */
async function syncPersonToBigQuery(person) {
  try {
    console.log(`🔄 Syncing person ${person.id} to BigQuery...`);
    
    // Extract email
    const email = person.attributes?.email;
    if (!email) {
      console.log(`⚠️ No email found for person ${person.id}, skipping`);
      return { success: false, personId: person.id, error: 'No email' };
    }
    
    // Convert relationships to subscriptions
    const subscriptions = convertRelationshipsToSubscriptions(person.cio_relationships);
    
    // Get unsubscribed brands from attributes
    const unsubscribedBrands = person.attributes?.unsubscribed_brands || {};
    
    // Prepare BigQuery data
    const userID = person.id;
    const emailHash = hashEmail(email);
    
    // Use MERGE to handle both insert and update
    const mergeQuery = `
      MERGE \`${process.env.GCP_PROJECT_ID}.analytics.users\` AS target
      USING (
        SELECT 
          '${userID}' as userID,
          '${email}' as email,
          '${emailHash}' as emailHash,
          JSON '${JSON.stringify(subscriptions)}' as subscriptions,
          '${JSON.stringify(unsubscribedBrands)}' as unsubscribed_brands,
          CURRENT_TIMESTAMP() as recentClickDate,
          CURRENT_TIMESTAMP() as createdAt
      ) AS source
      ON target.email = source.email
      WHEN MATCHED THEN
        UPDATE SET 
          subscriptions = source.subscriptions,
          unsubscribed_brands = source.unsubscribed_brands,
          recentClickDate = source.recentClickDate
      WHEN NOT MATCHED THEN
        INSERT (userID, email, emailHash, subscriptions, unsubscribed_brands, recentClickDate, createdAt)
        VALUES (source.userID, source.email, source.emailHash, source.subscriptions, source.unsubscribed_brands, source.recentClickDate, source.createdAt)
    `;
    
    await bq.query({ query: mergeQuery });
    
    console.log(`✅ Successfully synced person ${person.id} to BigQuery`);
    return { success: true, personId: person.id };
    
  } catch (error) {
    console.error(`❌ Error syncing person ${person.id}:`, error.message);
    return { success: false, personId: person.id, error: error.message };
  }
}

/**
 * Get all persons from Customer.io with pagination
 */
async function getAllPersonsFromCustomerIO(options = {}) {
  const { limit = 1000, offset = 0 } = options;
  
  try {
    console.log('📤 Fetching persons from Customer.io...');
    
    const auth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64');
    const response = await fetch(`${CIO_TRACK_URL}/entity?type=person&limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Customer.io API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 Retrieved ${data.results?.length || 0} persons from Customer.io`);
    
    return data.results || [];
    
  } catch (error) {
    console.error('❌ Error fetching persons from Customer.io:', error.message);
    throw error;
  }
}

/**
 * Sync all persons from Customer.io to BigQuery
 */
async function syncAllPersonsToBigQuery(options = {}) {
  const {
    batchSize = 100,
    limit = null,
    dryRun = false
  } = options;
  
  try {
    console.log('🚀 Starting Customer.io to BigQuery sync...');
    
    // Get all persons from Customer.io
    const persons = await getAllPersonsFromCustomerIO({ limit });
    
    console.log(`📈 Found ${persons.length} persons to sync`);
    
    if (dryRun) {
      console.log('🔍 DRY RUN - Would sync these persons:');
      persons.slice(0, 5).forEach(person => {
        console.log(`  - ${person.id}: ${person.attributes?.email || 'No email'}`);
      });
      return { success: true, count: persons.length, dryRun: true };
    }
    
    // Process in batches
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < persons.length; i += batchSize) {
      const batch = persons.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(persons.length / batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(person => syncPersonToBigQuery(person));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.successful++;
        } else {
          results.failed++;
          const error = result.status === 'rejected' 
            ? result.reason 
            : result.value.error;
          results.errors.push({
            personId: batch[index].id,
            error: error
          });
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < persons.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('✅ Sync completed!');
    console.log(`📊 Results: ${results.successful} successful, ${results.failed} failed`);
    
    if (results.errors.length > 0) {
      console.log('❌ Errors:');
      results.errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error.personId}: ${error.error}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Handle Customer.io webhook for real-time sync
 * 
 * Customer.io webhook payload structure:
 * {
 *   "event_id": "unique_event_id",
 *   "event_type": "email.clicked" | "email.opened" | "email.sent" | "person.updated" | etc,
 *   "timestamp": 1234567890,
 *   "data": {
 *     "person": { "id": "...", "email": "...", "attributes": {...} },
 *     "campaign": { "id": "...", "name": "...", "segment_id": "..." },
 *     "link": { "url": "..." },
 *     "device": { "user_agent": "...", "ip": "..." }
 *   }
 * }
 * 
 * OR flat structure (legacy):
 * {
 *   "type": "email.clicked",
 *   "person_id": "...",
 *   "campaign_id": "...",
 *   "email": "...",
 *   ...
 * }
 */
async function handleCustomerIOWebhook(req, res) {
  try {
    console.log('🔔 Customer.io webhook received');
    
    const webhookBody = req.body;
    
    // Detect event type - handle both Segment-style and Customer.io native formats
    let eventType = '';
    if (webhookBody.type === 'track' && webhookBody.event) {
      // Segment-style: map event name to event type
      const segmentEventMapping = {
        'Email Sent': 'email.sent',
        'Email Opened': 'email.opened',
        'Email Clicked': 'email.clicked',
        'Email Link Clicked': 'email.clicked',
        'Email Bounced': 'email.bounced',
        'Email Unsubscribed': 'email.unsubscribed',
        'Email Delivered': 'email.delivered',
        'Email Marked as Spam': 'email.spam_complaint',
        'Email Spam Complaint': 'email.spam_complaint', // Legacy/alternative name
        'Email SpamComplaint': 'email.spam_complaint' // Legacy/alternative name
      };
      eventType = segmentEventMapping[webhookBody.event] || webhookBody.event.toLowerCase().replace(/\s+/g, '.');
    } else {
      eventType = webhookBody.event_type || webhookBody.type || '';
    }
    
    const eventId = webhookBody.event_id || webhookBody.messageId || null;
    
    console.log(`📋 Event type: ${eventType}, Event ID: ${eventId}`);
    console.log(`📦 Payload format: ${webhookBody.type === 'track' ? 'Segment-style' : 'Customer.io native'}`);
    
    // Handle email events (sent, opened, clicked, bounced, unsubscribed, delivered, spam_complaint)
    // Check for Segment-style track events or Customer.io email events
    if (eventType.startsWith('email.') || 
        webhookBody.type?.startsWith('email.') ||
        (webhookBody.type === 'track' && webhookBody.event && webhookBody.event.toLowerCase().includes('email'))) {
      // Email event - queue for batch processing
      // Pass the entire webhook body so queueEmailEventToClicks can extract what it needs
      // No delay needed since we're just inserting into queue (not doing MERGE)
      const jitterDelay = Math.floor(Math.random() * 500);
      if (jitterDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, jitterDelay));
      }
      
      const result = await queueEmailEventToClicks(webhookBody);
      if (result.success) {
        console.log(`✅ Successfully queued email event: ${result.cioEventType}`);
        
        // If this is a spam complaint, handle global suppression
        if (result.cioEventType === 'spam_complaint') {
          console.log(`🚫 Spam complaint detected - triggering global suppression`);
          
          // Extract user info from webhook
          let userID = '';
          let email = '';
          
          if (webhookBody.type === 'track' && webhookBody.userId) {
            // Segment-style format
            userID = webhookBody.userId;
            email = webhookBody.context?.traits?.email || webhookBody.properties?.recipient || webhookBody.properties?.email || '';
          } else {
            // Customer.io native format
            const person = webhookBody.data?.person || webhookBody.person || {};
            userID = person.id || webhookBody.person_id || webhookBody.userId || '';
            email = person.email || person.attributes?.email || webhookBody.email || webhookBody.properties?.recipient || '';
          }
          
          if (userID && email) {
            const timestamp = webhookBody.timestamp || webhookBody.data?.timestamp || Date.now();
            const spamTimestamp = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
            
            const suppressionResult = await handleGlobalSuppression(userID, email, spamTimestamp);
            if (suppressionResult.success) {
              console.log(`✅ Global suppression completed - unsubscribed from ${suppressionResult.unsubscribedBrands?.length || 0} brands`);
            } else {
              console.error(`❌ Global suppression failed: ${suppressionResult.error}`);
              // Don't fail the webhook response, but log the error
            }
          } else {
            console.error(`❌ Could not extract userID or email for global suppression`);
          }
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Email event synced successfully',
          eventId: result.eventId,
          eventType: result.cioEventType
        });
      } else {
        console.error(`❌ Failed to sync email event: ${result.error}`);
        return res.status(500).json({ 
          success: false, 
          error: `Email event sync failed: ${result.error}` 
        });
      }
    } 
    // Handle person events
    else if (eventType === 'person.updated' || eventType === 'person.created' || 
             webhookBody.type === 'person.updated' || webhookBody.type === 'person.created') {
      // Person event - sync to users table
      // Extract person data from nested structure
      const personData = webhookBody.data?.person || webhookBody.person || webhookBody;
      const result = await syncPersonToBigQuery(personData);
      if (result.success) {
        console.log(`✅ Successfully synced person to users table`);
        return res.status(200).json({ 
          success: true, 
          message: 'Person synced successfully',
          personId: result.personId
        });
      } else {
        console.error(`❌ Failed to sync person: ${result.error}`);
        return res.status(500).json({ 
          success: false, 
          error: `Person sync failed: ${result.error}` 
        });
      }
    } 
    // Handle campaign events (if Customer.io sends them)
    else if (eventType === 'campaign.updated' || eventType === 'campaign.completed' ||
             webhookBody.type === 'campaign.updated' || webhookBody.type === 'campaign.completed') {
      // Campaign event - sync campaign performance to campaigns table
      const campaignData = webhookBody.data?.campaign || webhookBody.campaign || webhookBody;
      const result = await syncCampaignToCampaigns(campaignData);
      if (result.success) {
        console.log(`✅ Successfully synced campaign to campaigns table`);
        return res.status(200).json({ 
          success: true, 
          message: 'Campaign synced successfully',
          campaignID: result.campaignID
        });
      } else {
        console.error(`❌ Failed to sync campaign: ${result.error}`);
        return res.status(500).json({ 
          success: false, 
          error: `Campaign sync failed: ${result.error}` 
        });
      }
    } 
    else {
      console.log(`⚠️ Ignoring webhook type: ${eventType || webhookBody.type || 'unknown'}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook ignored (unsupported event type)' 
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    console.error('Webhook body:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ 
      success: false, 
      error: `Webhook processing failed: ${error.message}` 
    });
  }
}

/**
 * Validate data consistency between Customer.io and BigQuery
 */
async function validateDataConsistency(options = {}) {
  const { sampleSize = 100 } = options;
  
  try {
    console.log('🔍 Validating data consistency...');
    
    // Get sample of persons from Customer.io
    const persons = await getAllPersonsFromCustomerIO({ limit: sampleSize });
    console.log(`📊 Checking ${persons.length} persons for consistency...`);
    
    const issues = [];
    
    for (const person of persons) {
      try {
        const email = person.attributes?.email;
        if (!email) continue;
        
        // Get user from BigQuery
        const query = `
          SELECT 
            userID,
            email,
            subscriptions,
            unsubscribed_brands
          FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
          WHERE email = @email
          LIMIT 1
        `;
        
        const [rows] = await bq.query({ query, params: { email } });
        
        if (rows.length === 0) {
          issues.push({
            personId: person.id,
            email: email,
            type: 'not_found_in_bq',
            error: 'Person not found in BigQuery'
          });
          continue;
        }
        
        const bqUser = rows[0];
        
        // Compare subscriptions
        const cioSubscriptions = convertRelationshipsToSubscriptions(person.cio_relationships);
        const bqSubscriptions = bqUser.subscriptions ? 
          (typeof bqUser.subscriptions === 'string' ? JSON.parse(bqUser.subscriptions) : bqUser.subscriptions) : {};
        
        // Check for mismatches
        const cioBrands = Object.keys(cioSubscriptions);
        const bqBrands = Object.keys(bqSubscriptions);
        
        if (cioBrands.length !== bqBrands.length || 
            !cioBrands.every(brand => bqBrands.includes(brand))) {
          issues.push({
            personId: person.id,
            email: email,
            type: 'subscription_mismatch',
            cioBrands,
            bqBrands
          });
        }
        
      } catch (error) {
        issues.push({
          personId: person.id,
          email: person.attributes?.email,
          type: 'validation_error',
          error: error.message
        });
      }
    }
    
    console.log(`🔍 Validation complete: ${issues.length} issues found`);
    
    if (issues.length > 0) {
      console.log('❌ Issues found:');
      issues.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.personId}: ${issue.type}`);
      });
    }
    
    return { issues, totalChecked: persons.length };
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Export functions for use in other scripts
export {
  syncAllPersonsToBigQuery,
  syncPersonToBigQuery,
  syncEmailEventToClicks,
  queueEmailEventToClicks,
  processClicksQueue,
  syncCampaignToCampaigns,
  aggregateCampaignPerformanceFromClicks,
  handleCustomerIOWebhook,
  handleGlobalSuppression,
  validateDataConsistency
};

// Default export for Vercel function
export default async function handler(req, res) {
  return await handleCustomerIOWebhook(req, res);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const options = {};
  
  // Parse command line options
  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--dry-run') options.dryRun = true;
    if (arg === '--batch-size') options.batchSize = parseInt(process.argv[++i]);
    if (arg === '--limit') options.limit = parseInt(process.argv[++i]);
    if (arg === '--sample-size') options.sampleSize = parseInt(process.argv[++i]);
  }
  
  switch (command) {
    case 'sync-all':
      await syncAllPersonsToBigQuery(options);
      break;
    case 'validate':
      await validateDataConsistency(options);
      break;
    default:
      console.log('Usage:');
      console.log('  node cio-to-bq-sync.js sync-all [--dry-run] [--batch-size 100] [--limit 1000]');
      console.log('  node cio-to-bq-sync.js validate [--sample-size 100]');
      console.log('  node cio-to-bq-sync.js sync-ids personId1 personId2 [--dry-run]');
  }
}
