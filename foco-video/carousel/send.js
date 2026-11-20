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

// --pack (Adi, 2026-11-20 "send it to me nicely"): ONE designed email per post: inline preview of all slides,
// a posting checklist, captions in boxes, attachments = TikTok + IG slides + the effects-only video (~9 MB).
const pack = process.argv.includes("--pack");
let previewCid = null;
if (pack) {
  const sheet = path.join(out, "preview-sheet.jpg");
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", path.join(out, "slide-%d.png"), "-vf", `scale=270:-1,tile=${slides.length}x1:padding=8:color=0x0a0410`, "-frames:v", "1", "-q:v", "3", sheet]);
  previewCid = "preview@foco";
  attachments.push({ filename: "preview.jpg", path: sheet, cid: previewCid });
  const vsrc = ["video-no-music.mp4", "video.mp4"].map((f) => path.join(out, f)).find((f) => fs.existsSync(f));
  if (vsrc) {
    const head = require("child_process").spawnSync(FFMPEG, ["-i", vsrc]).stderr.toString();
    const [, hh, mm, ss] = head.match(/Duration: (\d+):(\d+):([\d.]+)/);
    const kbps = Math.floor((9 * 8192) / (+hh * 3600 + +mm * 60 + +ss)) - 128;
    const vmail = path.join(out, "video-pack.mp4");
    execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", vsrc, "-c:v", "libx264", "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`, "-c:a", "aac", "-b:a", "128k", vmail]);
    attachments.push({ filename: `${slug}-${path.basename(vsrc)}`, path: vmail });
  }
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
  // Some networks resolve smtp.gmail.com to IPv6 but cannot route it (ENETUNREACH): connect to the IPv4 address,
  // keeping the real hostname for TLS
  let host = "smtp.gmail.com";
  try { host = (await require("dns").promises.resolve4("smtp.gmail.com"))[0]; } catch {}
  for (const [port, secure] of [[465, true], [587, false]]) {
    try {
      const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass }, connectionTimeout: 15000, tls: { servername: "smtp.gmail.com" } });
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
  if (pack) {
    const box = (title, body) => `<div style="margin:18px 0"><div style="font:600 13px/1 Arial;letter-spacing:2px;color:#A78BFA;margin-bottom:8px">${title}</div><div style="background:#ffffff;border:1px solid #e6e0f5;border-radius:14px;padding:16px 18px;font:15px/1.55 Arial;color:#1a1626;white-space:pre-wrap">${esc(body)}</div></div>`;
    const tk = read("caption-tiktok.txt"), ig = read("caption-instagram.txt");
    const hook = (read("caption-tiktok.txt").split(/\r?\n/)[0] || slug);
    mail.subject = `FOCO post ready: ${slug.replace(/^story-/, "").replace(/-/g, " ")} (carousel + video) ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
    mail.html = `<div style="background:#f4f1fb;padding:24px 0"><div style="max-width:640px;margin:0 auto;font-family:Arial,sans-serif">
<div style="background:linear-gradient(135deg,#0a0410,#2d1257);border-radius:20px 20px 0 0;padding:28px 28px 22px;color:#fff">
<div style="font:700 12px/1 Arial;letter-spacing:3px;color:#A78BFA">FOCO SOCIAL</div>
<div style="font:700 26px/1.25 Georgia,serif;margin-top:10px">${esc(hook)}</div>
<div style="font:14px/1.5 Arial;color:#B8B0CC;margin-top:8px">${slides.length}-slide carousel + effects-only video, ready to post.</div></div>
<div style="background:#fff;padding:22px 28px;border-radius:0 0 20px 20px">
<img src="cid:${previewCid}" alt="slides preview" style="width:100%;border-radius:12px;display:block">
<div style="font:600 13px/1 Arial;letter-spacing:2px;color:#A78BFA;margin:22px 0 10px">HOW TO POST</div>
<table style="font:15px/1.5 Arial;color:#1a1626;border-collapse:collapse">
<tr><td style="padding:4px 10px 4px 0;vertical-align:top">🎬</td><td><b>TikTok video:</b> upload the <b>.mp4</b> attachment, add a trending sound, then <b>Volume: Original 100%, Added 15-25%</b> so the sound effects stay on top.</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top">📱</td><td><b>TikTok photo carousel:</b> <b>slide-1 ... slide-${slides.length}</b> in order (1 = hook).</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top">📸</td><td><b>Instagram:</b> <b>ig-slide-1 ... ig-slide-${slides.length}</b> (4:5, nothing gets cut), turn the AI label off: these are real photos.</td></tr>
<tr><td style="padding:4px 10px 4px 0;vertical-align:top">🏷️</td><td>Tracking id: <b>${slug}</b>. Send me the numbers after a few days.</td></tr></table>
${box("TIKTOK CAPTION", tk)}${box("INSTAGRAM CAPTION", ig)}
<div style="font:12px/1.5 Arial;color:#7d738f;margin-top:18px">The video has no music, so no music credit is needed. If you post the music version instead, add the credit line from music-credit.txt.</div>
</div></div></div>`;
    mail.text = `FOCO post ready: ${slug}

TikTok video: upload the mp4, add a sound, Volume: Original 100%, Added 15-25%.
TikTok carousel: slide-1..${slides.length}. Instagram: ig-slide-1..${slides.length}.

=== TIKTOK ===
${tk}

=== INSTAGRAM ===
${ig}`;
  }
  // Prefer HTTPS (works in cloud sandboxes); fall back to Gmail SMTP
  const id = resendKey ? await viaResend(mail) : await viaGmail(mail);
  console.log(`sent to ${to} via ${resendKey ? "Resend" : "Gmail"}`, id);
})().catch((e) => {
  console.error("send failed:", e.message);
  process.exit(1);
});
