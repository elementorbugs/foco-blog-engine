// Email a rendered carousel (slides as JPEGs + caption) via Gmail SMTP, so Adi gets it on his phone.
// Usage: node carousel/send.js <slug>
//
// Needs (env var, or the repo's gitignored .env when running locally):
//   GMAIL_USER          the Gmail address that sends (e.g. adibenelyahu@gmail.com)
//   GMAIL_APP_PASSWORD  a Google "app password" (myaccount.google.com/apppasswords), NOT the account password
//   MAIL_TO             optional, defaults to GMAIL_USER
//   RESEND_API_KEY      optional: send over HTTPS via resend.com instead of SMTP. Cloud sandboxes often block SMTP
//                       (port 465) but allow HTTPS. Without a verified domain, Resend only delivers to the
//                       Resend account's own email address.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
// bundled ffmpeg, so this also runs in cloud sessions that have no system ffmpeg
const FFMPEG = require("ffmpeg-static");
const nodemailer = require("nodemailer");

const ROOT = path.join(__dirname, "..");
const slug = process.argv[2];
if (!slug) {
  console.error("usage: node carousel/send.js <slug>");
  process.exit(1);
}

const envFile = path.join(ROOT, "..", ".env");
const fileEnv = {};
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.+?)"?\s*$/);
    if (m) fileEnv[m[1]] = m[2];
  }
}
const E = (k) => process.env[k] || fileEnv[k];
const user = E("GMAIL_USER");
const pass = E("GMAIL_APP_PASSWORD");
const resendKey = E("RESEND_API_KEY");
const to = E("MAIL_TO") || user;
if (!to || (!resendKey && !pass)) {
  console.error("need MAIL_TO or GMAIL_USER, plus GMAIL_APP_PASSWORD or RESEND_API_KEY (env vars or .env)");
  process.exit(1);
}

const out = path.join(ROOT, "out", `tiktok-${slug}`);
const slides = fs.readdirSync(out).filter((f) => /^slide-\d+\.png$/.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)));
if (!slides.length) throw new Error(`no rendered slides in ${out}; run build.js ${slug} render first`);

// PNGs are ~1-2 MB each; JPEG q2 keeps them sharp on a phone and the email well under Gmail's 25 MB limit
const attachments = slides.map((f) => {
  const jpg = path.join(out, f.replace(".png", ".jpg"));
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", path.join(out, f), "-q:v", "2", jpg]);
  return { filename: path.basename(jpg), path: jpg };
});

const read = (f) => (fs.existsSync(path.join(out, f)) ? fs.readFileSync(path.join(out, f), "utf8") : "");
const caption = read("caption-tiktok.txt")
  ? `=== TIKTOK ===\n${read("caption-tiktok.txt")}\n=== INSTAGRAM ===\n${read("caption-instagram.txt")}`
  : read("caption.txt");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function viaResend(mail) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "FOCO Social <onboarding@resend.dev>",
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: mail.attachments.map((a) => ({ filename: a.filename, content: fs.readFileSync(a.path).toString("base64") })),
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(body)}`);
  return body.id;
}

// Some sandboxes block port 465 but allow 587 (STARTTLS), so try both before giving up
async function viaGmail(mail) {
  let lastErr;
  for (const [port, secure] of [[465, true], [587, false]]) {
    try {
      const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port, secure, auth: { user, pass }, connectionTimeout: 15000 });
      const info = await transport.sendMail({ ...mail, from: `FOCO Social <${user}>` });
      return `${info.messageId} (port ${port})`;
    } catch (e) {
      console.error(`gmail port ${port} failed: ${e.message}`);
      lastErr = e;
    }
  }
  throw lastErr;
}

(async () => {
  const mail = {
    to,
    subject: `FOCO Social: carousel "${slug}" (${slides.length} slides)`,
    text: `Your carousel is ready. Slides are attached in order (slide-1 = hook).

Captions to paste:

${caption}`,
    html: `<p>Your carousel is ready. Slides are attached in order (slide-1 = hook).</p><p><b>Captions to paste:</b></p><pre style="white-space:pre-wrap;font-family:inherit">${esc(caption)}</pre>`,
    attachments,
  };
  // Prefer HTTPS (works in cloud sandboxes); fall back to Gmail SMTP
  const id = resendKey ? await viaResend(mail) : await viaGmail(mail);
  console.log(`sent to ${to} via ${resendKey ? "Resend" : "Gmail"}`, id);
})().catch((e) => {
  console.error("send failed:", e.message);
  process.exit(1);
});
