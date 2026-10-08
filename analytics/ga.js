// Ad-hoc GA4 query helper: node analytics/ga.js '<runReport JSON body>' | node analytics/ga.js meta
const fs = require("fs"), path = require("path"), crypto = require("crypto"), https = require("https");
const SA = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "ga4-service-account.json"), "utf8"));
const P = "properties/543983823";
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const req = (method, host, p, body, headers) => new Promise((res, rej) => {
  const r = https.request({ host, path: p, method, headers }, (s) => { let d = ""; s.on("data", (c) => (d += c)); s.on("end", () => (s.statusCode < 300 ? res(JSON.parse(d)) : rej(new Error(`${s.statusCode} ${d.slice(0, 400)}`)))); });
  r.on("error", rej); r.end(body);
});
(async () => {
  const now = Math.floor(Date.now() / 1000);
  const u = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: SA.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign("RSA-SHA256").update(u).sign(SA.private_key, "base64url");
  const t = (await req("POST", "oauth2.googleapis.com", "/token", `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${u}.${sig}`, { "Content-Type": "application/x-www-form-urlencoded" })).access_token;
  const H = { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
  if (process.argv[2] === "meta") {
    const m = await req("GET", "analyticsdata.googleapis.com", `/v1beta/${P}/metadata`, null, H);
    m.dimensions.filter((d) => d.apiName.startsWith("customEvent")).forEach((d) => console.log(d.apiName));
    return;
  }
  const r = await req("POST", "analyticsdata.googleapis.com", `/v1beta/${P}:runReport`, process.argv[2], H);
  for (const row of r.rows || []) console.log([...row.dimensionValues.map((d) => d.value), ...row.metricValues.map((m) => m.value)].join("\t"));
})().catch((e) => { console.error(e.message); process.exit(1); });
