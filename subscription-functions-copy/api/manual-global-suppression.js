/**
 * Manual Global Suppression Endpoint
 * 
 * Allows manual triggering of global suppression for a user
 * Useful for testing or processing missed spam complaints
 * 
 * Usage:
 * POST /api/manual-global-suppression
 * Body: { "userID": "..." } OR { "email": "..." }
 * 
 * OR via query params:
 * GET /api/manual-global-suppression?userID=... OR ?email=...
 */

import { handleGlobalSuppression } from './cio-to-bq-sync-enhanced.js';
import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
    : undefined
});

/**
 * Generate deterministic userID from email (same as magic-link.js)
 */
function generateUserID(email) {
  const crypto = require('crypto');
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID v5 namespace
  const normalizedEmail = email.toLowerCase().trim();
  
  // Create namespace UUID buffer
  const namespaceBuffer = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  
  // Create email buffer
  const emailBuffer = Buffer.from(normalizedEmail, 'utf8');
  
  // Combine and hash
  const combined = Buffer.concat([namespaceBuffer, emailBuffer]);
  const hash = crypto.createHash('sha1').update(combined).digest();
  
  // Set version (5) and variant bits
  hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // Variant 10
  
  // Format as UUID
  return [
    hash.toString('hex', 0, 4),
    hash.toString('hex', 4, 6),
    hash.toString('hex', 6, 8),
    hash.toString('hex', 8, 10),
    hash.toString('hex', 10, 16)
  ].join('-');
}

function hashEmail(email, salt = process.env.EMAIL_SALT || 'default-salt') {
  const crypto = require('crypto');
  try {
    return crypto.createHash('sha256').update(email + salt).digest('hex');
  } catch (error) {
    console.error('Email hashing error:', error.message);
    return email;
  }
}

/**
 * Find userID by email
 */
async function findUserByEmail(email) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const emailHash = hashEmail(normalizedEmail);
    
    const query = `
      SELECT userID, email
      FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
      WHERE email = @email OR emailHash = @emailHash
      LIMIT 1
    `;
    
    const [rows] = await bq.query({
      query,
      params: { email: normalizedEmail, emailHash: emailHash },
      types: { email: 'STRING', emailHash: 'STRING' }
    });
    
    if (rows.length > 0) {
      return rows[0].userID;
    }
    
    // If not found, generate deterministic userID
    return generateUserID(normalizedEmail);
  } catch (error) {
    console.error('Error finding user:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    console.log('🚫 Manual Global Suppression Endpoint');
    
    // Support both GET (query params) and POST (body)
    const userID = req.query.userID || req.body?.userID;
    const email = req.query.email || req.body?.email;
    
    if (!userID && !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userID or email'
      });
    }
    
    let finalUserID = userID;
    let finalEmail = email;
    
    // If email provided, find or generate userID
    if (email && !userID) {
      console.log(`📧 Looking up user by email: ${email}`);
      finalUserID = await findUserByEmail(email);
      
      // Get email from BigQuery to ensure we have the correct one
      const query = `
        SELECT email
        FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
        WHERE userID = @userID
        LIMIT 1
      `;
      
      const [rows] = await bq.query({
        query,
        params: { userID: finalUserID },
        types: { userID: 'STRING' }
      });
      
      if (rows.length > 0 && rows[0].email) {
        finalEmail = rows[0].email;
      } else {
        finalEmail = email.toLowerCase().trim();
      }
    }
    
    // If userID provided but no email, get email from BigQuery
    if (userID && !email) {
      const query = `
        SELECT email
        FROM \`${process.env.GCP_PROJECT_ID}.analytics.users\`
        WHERE userID = @userID
        LIMIT 1
      `;
      
      const [rows] = await bq.query({
        query,
        params: { userID: finalUserID },
        types: { userID: 'STRING' }
      });
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `User not found: ${finalUserID}`
        });
      }
      
      finalEmail = rows[0].email || '';
      if (!finalEmail) {
        return res.status(400).json({
          success: false,
          error: `User ${finalUserID} has no email address`
        });
      }
    }
    
    console.log(`🚫 Triggering global suppression for user: ${finalUserID} (${finalEmail})`);
    
    // Use current timestamp as spam complaint timestamp
    const spamComplaintTimestamp = Date.now();
    
    // Call the global suppression handler
    const result = await handleGlobalSuppression(finalUserID, finalEmail, spamComplaintTimestamp);
    
    if (result.success) {
      console.log(`✅ Global suppression completed successfully`);
      return res.status(200).json({
        success: true,
        message: 'Global suppression applied successfully',
        userID: finalUserID,
        email: finalEmail,
        unsubscribedBrands: result.unsubscribedBrands || [],
        timestamp: new Date(spamComplaintTimestamp).toISOString()
      });
    } else {
      console.error(`❌ Global suppression failed: ${result.error}`);
      return res.status(500).json({
        success: false,
        error: result.error || 'Global suppression failed',
        userID: finalUserID,
        email: finalEmail
      });
    }
    
  } catch (error) {
    console.error('❌ Manual global suppression error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

