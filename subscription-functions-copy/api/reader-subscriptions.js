/**
 * GET (or POST) authenticated snapshot of subscribed brands for profile pages.
 * Auth: Authorization: Bearer <readerToken> from /execute (requires READER_TOKEN_SECRET).
 *
 * CORS: set READERS_CORS_ORIGINS=comma,separated,origins for marketing sites.
 */

import { BigQuery } from "@google-cloud/bigquery";
import { verifyReaderToken } from "../lib/reader-token.js";

function corsHeaders(req) {
  const originsRaw = process.env.READERS_CORS_ORIGINS || "";
  const allowed = originsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.origin;
  const origin =
    allowed.length && requestOrigin && allowed.includes(requestOrigin)
      ? requestOrigin
      : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function getBigQuery() {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) throw new Error("GCP_PROJECT_ID is not set");
  let credentials;
  if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.GCP_SERVICE_ACCOUNT_KEY.trim();
      let jsonStr = raw;
      if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length > 100) {
        try {
          jsonStr = Buffer.from(raw, "base64").toString("utf8");
        } catch {
          /* use raw */
        }
      }
      credentials = JSON.parse(jsonStr.replace(/\\n/g, "\n"));
    } catch (e) {
      console.error("[reader-subscriptions] Invalid GCP_SERVICE_ACCOUNT_KEY:", e.message);
    }
  }
  return new BigQuery({ projectId, ...(credentials && { credentials }) });
}

export default async function handler(req, res) {
  const c = corsHeaders(req);
  Object.entries(c).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let token = null;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    token = auth.slice(7);
  }
  if (!token && req.method === "POST" && req.body?.readerToken) {
    token = req.body.readerToken;
  }

  if (!token) {
    return res.status(401).json({ error: "Missing reader token" });
  }

  let normalizedEmail;
  try {
    normalizedEmail = verifyReaderToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const bq = getBigQuery();
    const projectId = process.env.GCP_PROJECT_ID;
    const query = `
      SELECT email, subscriptions
      FROM \`${projectId}.analytics.users\`
      WHERE LOWER(TRIM(email)) = @email
      LIMIT 1
    `;
    const [rows] = await bq.query({
      query,
      params: { email: normalizedEmail },
    });
    if (rows.length === 0) {
      return res.status(200).json({ email: normalizedEmail, subscribedBrands: [] });
    }
    const row = rows[0];
    let subscriptions = row.subscriptions;
    if (typeof subscriptions === "string") {
      try {
        subscriptions = JSON.parse(subscriptions);
      } catch {
        subscriptions = {};
      }
    }
    if (!subscriptions || typeof subscriptions !== "object") {
      return res.status(200).json({
        email: row.email ?? normalizedEmail,
        subscribedBrands: [],
      });
    }
    const subscribedBrands = Object.keys(subscriptions).filter(
      (k) => subscriptions[k] != null && subscriptions[k] !== false
    );
    return res.status(200).json({
      email: row.email ?? normalizedEmail,
      subscribedBrands,
    });
  } catch (err) {
    console.error("[reader-subscriptions]", err.message);
    return res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
}
