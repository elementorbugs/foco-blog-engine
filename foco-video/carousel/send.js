// Email a rendered carousel (slides as JPEGs + caption) via Gmail SMTP, so Adi gets it on his phone.
// Usage: node carousel/send.js <slug>
//
// Needs (env var, or the repo's gitignored .env when running locally):
//   GMAIL_USER          the Gmail address that sends (e.g. adibenelyahu@gmail.com)
//   GMAIL_APP_PASSWORD  a Google "app password" (myaccount.google.com/apppasswords), NOT the account password
//   MAIL_TO             optional, defaults to GMAIL_USER
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
const to = E("MAIL_TO") || user;
if (!user || !pass) {
  console.error("missing GMAIL_USER / GMAIL_APP_PASSWORD (env vars or .env)");
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

const caption = fs.existsSync(path.join(out, "caption.txt")) ? fs.readFileSync(path.join(out, "caption.txt"), "utf8") : "";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

(async () => {
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  const info = await transport.sendMail({
    from: `FOCO Social <${user}>`,
    to,
    subject: `FOCO Social: carousel "${slug}" (${slides.length} slides)`,
    text: `Your carousel is ready. Slides are attached in order (slide-1 = hook).\n\nCaption to paste:\n\n${caption}`,
    html: `<p>Your carousel is ready. Slides are attached in order (slide-1 = hook).</p><p><b>Caption to paste:</b></p><pre style="white-space:pre-wrap;font-family:inherit">${esc(caption)}</pre>`,
    attachments,
  });
  console.log("sent to", to, info.messageId);
})().catch((e) => {
  console.error("send failed:", e.message);
  process.exit(1);
});
