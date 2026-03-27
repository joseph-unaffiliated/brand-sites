/**
 * Signed, opaque reader tokens for profile / cross-brand subscription views.
 * Issued by /execute responses when READER_TOKEN_SECRET is set on the magic deploy.
 */

import crypto from "crypto";

const TTL_SEC = 60 * 60 * 24 * 7; // 7 days

function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(s) {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64");
}

export function signReaderToken(email) {
  const secret = process.env.READER_TOKEN_SECRET;
  if (!secret || !email) return null;
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const payloadJson = JSON.stringify({ e: email.toLowerCase().trim(), exp });
  const payload = base64url(Buffer.from(payloadJson, "utf8"));
  const sig = crypto.createHmac("sha256", secret).update(payload).digest();
  const sigB64 = base64url(sig);
  return `${payload}.${sigB64}`;
}

/**
 * @param {Record<string, unknown>} payload
 * @param {string} normalizedEmail
 */
export function attachReaderToken(payload, normalizedEmail) {
  const readerToken = signReaderToken(normalizedEmail);
  if (readerToken) {
    return { ...payload, readerToken };
  }
  return payload;
}

/**
 * @param {string} token
 * @returns {string} normalized email
 */
export function verifyReaderToken(token) {
  const secret = process.env.READER_TOKEN_SECRET;
  if (!secret || !token || typeof token !== "string") {
    throw new Error("Invalid token");
  }
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token");
  const [payload, sigB64] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(payload, "utf8").digest();
  const sig = fromBase64url(sigB64);
  if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error("Invalid token");
  }
  const json = fromBase64url(payload).toString("utf8");
  const data = JSON.parse(json);
  if (!data.e || typeof data.exp !== "number") throw new Error("Invalid token");
  if (data.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return String(data.e).toLowerCase().trim();
}
