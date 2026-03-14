import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.GCP_PROJECT_ID;
let credentials;
if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
  try {
    const raw = process.env.GCP_SERVICE_ACCOUNT_KEY.trim();
    let jsonStr = raw;
    if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length > 100) {
      try {
        jsonStr = Buffer.from(raw, "base64").toString("utf8");
      } catch (_) {
        /* use raw as JSON */
      }
    }
    credentials = JSON.parse(jsonStr.replace(/\\n/g, "\n"));
  } catch (e) {
    console.error("[api/subscriptions] Invalid GCP_SERVICE_ACCOUNT_KEY:", e.message);
  }
}

function getBigQuery() {
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is not set");
  }
  return new BigQuery({
    projectId,
    ...(credentials && { credentials }),
  });
}

/**
 * GET /api/subscriptions?email=... or POST with body { email }
 * Returns { email, subscribedBrands: string[] } for the given email.
 * Auth: email from client (rate limiting / CORS should be configured by deployer).
 */
export async function GET(request) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  return fetchSubscriptions(email.trim().toLowerCase());
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const email = body?.email;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  return fetchSubscriptions(email.trim().toLowerCase());
}

async function fetchSubscriptions(normalizedEmail) {
  try {
    const bq = getBigQuery();
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
      return NextResponse.json({ email: normalizedEmail, subscribedBrands: [] });
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
      return NextResponse.json({
        email: row.email ?? normalizedEmail,
        subscribedBrands: [],
      });
    }
    const subscribedBrands = Object.keys(subscriptions).filter(
      (k) => subscriptions[k] != null && subscriptions[k] !== false
    );
    return NextResponse.json({
      email: row.email ?? normalizedEmail,
      subscribedBrands,
    });
  } catch (err) {
    console.error("[api/subscriptions]", err.message);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
