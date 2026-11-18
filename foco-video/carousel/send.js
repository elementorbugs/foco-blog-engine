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
// a video-only story (e.g. a one-shot meme reel with no end card) has no stills: --video needs only video.mp4
if (!slides.length && !process.argv.includes("--video")) throw new Error(`no rendered slides in ${out}; run build.js ${slug} render first`);

// PNGs are ~1-2 MB each; JPEG q2 keeps them sharp on a phone and the email well under Gmail's 25 MB limit
// TikTok 9:16 slides, then Instagram 4:5 versions (IG crops 9:16 and cuts the text)
const igSlides = fs.readdirSync(out).filter((f) => /^ig-slide-\d+\.png$/.test(f)).sort((a, b) => parseInt(a.slice(9)) - parseInt(b.slice(9)));
let attachments = [...slides, ...igSlides].map((f) => {
  const jpg = path.join(out, f.replace(".png", ".jpg"));
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", path.join(out, f), "-q:v", "2", jpg]);
  return { filename: path.basename(jpg), path: jpg };
});
// --video: email the animated video instead of the slides, re-encoded to fit Gmail (~18 MB); the full-quality
// video.mp4 stays in the out folder for upload
if (process.argv.includes("--video")) {
  const src = path.join(out, "video.mp4");
  if (!fs.existsSync(src)) throw new Error(`no video.mp4 in ${out}; run carousel/video.js ${slug} first`);
  // ffmpeg-static has no ffprobe: read the duration from ffmpeg's own header line
  const head = require("child_process").spawnSync(FFMPEG, ["-i", src]).stderr.toString();
  const [, hh, mm, ss] = head.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const dur = +hh * 3600 + +mm * 60 + +ss;
  const kbps = Math.floor((18 * 8192) / dur) - 128;
  const mail = path.join(out, "video-email.mp4");
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", src, "-c:v", "libx264", "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`, "-c:a", "aac", "-b:a", "128k", mail]);
  attachments = [{ filename: `${slug}.mp4`, path: mail }];
}

const read = (f) => (fs.existsSync(path.join(out, f)) ? fs.readFileSync(path.join(out, f), "utf8") : "");
// a video with library music must carry the license credit (CC BY 4.0) in its caption
const credit = process.argv.includes("--video") && read("music-credit.txt") ? `\n\n${read("music-credit.txt")}` : "";
const caption = read("caption-tiktok.txt")
  ? `=== TIKTOK ===\n${read("caption-tiktok.txt")}${credit}\n=== INSTAGRAM ===\n${read("caption-instagram.txt")}${credit}`
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
    // time in the subject so each send is its own email (same subject = Gmail stacks it into the old thread)
    subject: `FOCO Social: ${process.argv.includes("--video") ? "video" : "carousel"} "${slug}"${process.argv.includes("--video") ? "" : ` (${slides.length} slides)`} ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
    text: `Your carousel is ready. TikTok: slide-1..N (9:16). Instagram: ig-slide-1..N (4:5, use these on IG so nothing gets cut). Both in order, 1 = hook.

Captions to paste:

${caption}`,
    html: `<p>Your carousel is ready. TikTok: slide-1..N (9:16). Instagram: ig-slide-1..N (4:5, use these on IG so nothing gets cut). Both in order, 1 = hook.</p><p><b>Captions to paste:</b></p><pre style="white-space:pre-wrap;font-family:inherit">${esc(caption)}</pre>`,
    attachments,
  };
  // Prefer HTTPS (works in cloud sandboxes); fall back to Gmail SMTP
  const id = resendKey ? await viaResend(mail) : await viaGmail(mail);
  console.log(`sent to ${to} via ${resendKey ? "Resend" : "Gmail"}`, id);
})().catch((e) => {
  console.error("send failed:", e.message);
  process.exit(1);
});
