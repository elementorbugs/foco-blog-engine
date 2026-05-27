// gsc-auth.js — Google Search Console OAuth token management.
//
// Exports getAccessToken({ force }) which returns a valid access token,
// exchanging the long-lived refresh token from .env for a fresh access
// token on demand. Caches the access token to disk (.gsc-cache/token.json)
// so concurrent script runs don't burn through Google's token endpoint.
//
// All other gsc-*.js scripts call this — never hit oauth2.googleapis.com
// directly elsewhere.

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── ENV ─────────────────────────────────────────────────────────────────────
const envSources = {};
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/);
    if (m) envSources[m[1]] = m[2];
  }
}
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '.foco-config', 'wp-creds.env'));
const E = (k) => process.env[k] || envSources[k] || null;

const CLIENT_ID = E('GSC_CLIENT_ID');
const CLIENT_SECRET = E('GSC_CLIENT_SECRET');
const REFRESH_TOKEN = E('GSC_REFRESH_TOKEN');
const PROPERTY = E('GSC_PROPERTY');

function assertEnv() {
  const missing = [];
  if (!CLIENT_ID) missing.push('GSC_CLIENT_ID');
  if (!CLIENT_SECRET) missing.push('GSC_CLIENT_SECRET');
  if (!REFRESH_TOKEN) missing.push('GSC_REFRESH_TOKEN');
  if (!PROPERTY) missing.push('GSC_PROPERTY');
  if (missing.length) {
    throw new Error(`Missing required env: ${missing.join(', ')} (expected in foco-blog-engine/.env)`);
  }
}

// ─── cache ───────────────────────────────────────────────────────────────────
// Access tokens are valid for ~3600s. Cache with a 5-minute safety margin so
// concurrent scripts within a session share one token and we never hand back
// a token about to expire mid-request.
const CACHE_DIR = path.join(__dirname, '.gsc-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'token.json');
const SAFETY_MARGIN_MS = 5 * 60 * 1000;

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (!raw.access_token || !raw.expires_at) return null;
    if (Date.now() + SAFETY_MARGIN_MS >= raw.expires_at) return null;
    return raw;
  } catch { return null; }
}

function writeCache(accessToken, expiresInSec) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify({
    access_token: accessToken,
    expires_at: Date.now() + (expiresInSec * 1000),
  }, null, 2));
}

// ─── token exchange ──────────────────────────────────────────────────────────
function postForm(hostname, path_, formObj) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(formObj).toString();
    const req = https.request({
      hostname, port: 443, path: path_, method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`${hostname}${path_} → HTTP ${res.statusCode}: ${text}`));
        }
        try { resolve(JSON.parse(text)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function refreshAccessToken() {
  const res = await postForm('oauth2.googleapis.com', '/token', {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  if (!res.access_token) {
    throw new Error('No access_token in refresh response: ' + JSON.stringify(res));
  }
  writeCache(res.access_token, res.expires_in || 3600);
  return res.access_token;
}

// ─── public API ──────────────────────────────────────────────────────────────
/**
 * Returns a valid GSC access token. Reads from cache if fresh; otherwise
 * refreshes via the long-lived refresh token. Pass { force: true } to skip
 * the cache (useful after a 401).
 */
async function getAccessToken({ force = false } = {}) {
  assertEnv();
  if (!force) {
    const cached = readCache();
    if (cached) return cached.access_token;
  }
  return refreshAccessToken();
}

/** Returns the GSC property URL from env (already a full URL). */
function getProperty() {
  assertEnv();
  return PROPERTY;
}

/** URL-encodes the property for the searchAnalytics endpoint path segment. */
function getEncodedProperty() {
  return encodeURIComponent(getProperty());
}

module.exports = { getAccessToken, getProperty, getEncodedProperty };

// ─── CLI: `node gsc-auth.js` prints a fresh token and the property list ─────
if (require.main === module) {
  (async () => {
    try {
      const token = await getAccessToken();
      console.log('✓ access token (first 20 chars):', token.slice(0, 20) + '...');
      console.log('✓ property:', getProperty());

      // Quick smoke test: list sites and confirm our property is present.
      const sites = await new Promise((resolve, reject) => {
        https.get({
          hostname: 'www.googleapis.com', path: '/webmasters/v3/sites',
          headers: { 'Authorization': `Bearer ${token}` },
        }, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
            catch (e) { reject(e); }
          });
        }).on('error', reject);
      });

      const ours = (sites.siteEntry || []).find(s => s.siteUrl === getProperty());
      if (ours) {
        console.log(`✓ property visible to this OAuth client (permission: ${ours.permissionLevel})`);
      } else {
        console.log('✗ property NOT visible to this OAuth client. Available:');
        for (const s of sites.siteEntry || []) console.log('   -', s.siteUrl);
        process.exit(1);
      }
    } catch (e) {
      console.error('✗', e.message);
      process.exit(1);
    }
  })();
}
