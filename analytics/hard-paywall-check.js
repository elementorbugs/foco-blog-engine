// Hard paywall check (agreed with Adi 2026-10-06): did turning the paywall close button Off (~Sep 28)
// bring more paying users than it cost in uninstalls? Weekly app-only numbers from GA4 (Firebase), written to
// the Desktop. Scheduled once for 2026-10-13 via Windows Task Scheduler ("FOCO hard paywall check").
//   node analytics/hard-paywall-check.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const SA = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "ga4-service-account.json"), "utf8"));
const PROPERTY = "properties/543983823";
// Close button Off from ~Sep 28 (paywall_dismissed dropped to ~0); Adi switched it back On 2026-10-06.
// Devices pick the switch up on their next launch, so Oct 6 itself is mixed and left out.
const PERIODS = [
  { name: "before (soft)", startDate: "2026-09-07", endDate: "2026-09-27" },
  { name: "hard paywall", startDate: "2026-09-28", endDate: "2026-10-05" },
  { name: "soft again", startDate: "2026-10-07", endDate: "yesterday" },
];

const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const post = (host, p, body, headers) =>
  new Promise((res, rej) => {
    const r = https.request({ host, path: p, method: "POST", headers }, (s) => {
      let d = "";
      s.on("data", (c) => (d += c));
      s.on("end", () => (s.statusCode < 300 ? res(JSON.parse(d)) : rej(new Error(`${s.statusCode} ${d.slice(0, 300)}`))));
    });
    r.on("error", rej);
    r.end(body);
  });

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: SA.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(SA.private_key, "base64url");
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}`;
  return (await post("oauth2.googleapis.com", "/token", body, { "Content-Type": "application/x-www-form-urlencoded" })).access_token;
}

const day = (d) => (d === "yesterday" ? new Date(Date.now() - 864e5) : new Date(`${d}T12:00:00`));
const days = (per) => Math.max(1, Math.round((day(per.endDate) - day(per.startDate)) / 864e5) + 1);
// a period that hasn't started yet (e.g. running this before Oct 8) would be an invalid GA4 range
const ACTIVE = PERIODS.filter((per) => day(per.startDate) <= day("yesterday"));

(async () => {
  const t = await token();
  const r = await post(
    "analyticsdata.googleapis.com",
    `/v1beta/${PROPERTY}:runReport`,
    JSON.stringify({
      dateRanges: ACTIVE,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "totalUsers" }],
      dimensionFilter: { filter: { fieldName: "platform", inListFilter: { values: ["Android", "iOS"] } } },
      limit: 5000,
    }),
    { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
  );
  // with several date ranges, GA4 appends the range name as the last dimension value
  const p = {};
  (r.rows || []).forEach((x) => ((p[x.dimensionValues[1].value] ||= {})[x.dimensionValues[0].value] = +x.metricValues[0].value));
  const rcEvents = [...new Set(Object.values(p).flatMap((v) => Object.keys(v).filter((e) => e.startsWith("rc_") || e === "subscription_expired")))].sort();
  const cols = ["first_open", "app_remove", "paywall_view", "paywall_dismissed", "trial_started", "purchase_success", ...rcEvents];
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "-");

  const lines = [
    `FOCO hard paywall check, generated ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
    "Close button Off (hard) Sep 28 - Oct 5, back On from Oct 6. App only (Android + iOS), users per period.",
    "",
    ["period", "days", ...cols, "installs/day", "remove/install", "trial/install", "purchase/install"].join(" | "),
  ];
  ACTIVE.forEach((per) => {
    const v = p[per.name] || {};
    const n = days(per);
    lines.push([`${per.name} (${per.startDate}..${per.endDate})`, n, ...cols.map((c) => v[c] || 0), ((v.first_open || 0) / n).toFixed(1), pct(v.app_remove || 0, v.first_open), pct(v.trial_started || 0, v.first_open), pct(v.purchase_success || 0, v.first_open)].join(" | "));
  });
  lines.push("", "How to read it:");
  lines.push("- remove/install up in the hard period and back down after = the hard paywall drove uninstalls.");
  lines.push("- The 7-day annual trial came back the same week the hard paywall went on (Sep 23-28), so more trials");
  lines.push("  in the hard period is not proof the hard paywall caused them.");
  lines.push("- Trials started in the hard period convert (or not) 7 days later, so their payments land in the");
  lines.push("  'soft again' row (rc_* events). That, against the uninstall change, is the deciding number.");

  const out = path.join(os.homedir(), "Desktop", `FOCO-hard-paywall-check-${new Date().toISOString().slice(0, 10)}.txt`);
  fs.writeFileSync(out, lines.join("\n"), "utf8");
  console.log(lines.join("\n"));
  console.log("\nwrote", out);
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
