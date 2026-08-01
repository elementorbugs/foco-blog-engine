#!/usr/bin/env node
/**
 * audit-contrast.js — find unreadable text on a live post.
 *
 * Light articles carry dark components (charts, the body-doubling tool).
 * The light ink rules are element-level + !important, so a new dark
 * component silently renders near-black text on a near-black card.
 * This walks the rendered page, resolves each text node's real background
 * (gradients included) and reports every pair under WCAG AA 4.5:1.
 *
 * Usage:  node scripts/audit-contrast.js <url> [url...]
 *         node scripts/audit-contrast.js --all      # every published post
 *
 * Needs Chrome installed. No Playwright, no npm install.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = [
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));
if (!CHROME) { console.error('Chrome not found'); process.exit(1); }

const MIN_RATIO = 4.5;

// runs in the page
const PROBE = `(function(){
  function parse(s){if(!s)return null;var m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;var p=m[1].split(',').map(parseFloat);return {c:p.slice(0,3),a:p.length>3?p[3]:1}}
  function lum(c){var a=c.map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]}
  function ratio(f,b){var L1=lum(f),L2=lum(b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)}
  function bgOf(el){var e=el;while(e&&e!==document.documentElement){var cs=getComputedStyle(e);var bi=cs.backgroundImage;
      if(bi&&bi!=='none'&&/gradient/.test(bi)){var g=parse(bi);if(g&&g.a>0.5)return g.c}
      var bc=parse(cs.backgroundColor);if(bc&&bc.a>0.5)return bc.c;e=e.parentElement}
    return [255,255,255]}
  var out=[];
  document.querySelectorAll('article *, .blog-single *').forEach(function(el){
    var own=[].slice.call(el.childNodes).filter(function(n){return n.nodeType===3&&n.textContent.trim()})
             .map(function(n){return n.textContent.trim()}).join(' ');
    if(!own)return;
    var cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)<0.15)return;
    var f=parse(cs.color);if(!f)return;
    var b=bgOf(el), r=ratio(f.c,b);
    if(r<${MIN_RATIO})out.push({tag:el.tagName.toLowerCase(),cls:(typeof el.className==='string'?el.className:''),
      fg:cs.color,bg:'rgb('+b.map(Math.round).join(',')+')',ratio:+r.toFixed(2),text:own.slice(0,48)});
  });
  // base64 so post text containing quotes/entities cannot corrupt the payload
  var pre=document.createElement('pre');pre.id='FOCO_AUDIT';
  pre.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(out))));
  document.body.appendChild(pre);
})();`;

function audit(url) {
  const tmp = path.join(os.tmpdir(), 'foco-audit-' + Date.now() + '.html');
  // inject the probe by wrapping the page: fetch it, append <script>, load from disk
  // a local .html path also works, so a fix can be checked before it is published
  const html = fs.existsSync(url)
    ? fs.readFileSync(url, 'utf8')
    : execFileSync('curl', ['-s', '-A', 'Mozilla/5.0', url], { maxBuffer: 64e6 }).toString();
  fs.writeFileSync(tmp, html.replace('</body>', `<script>${PROBE}<\/script></body>`));
  const dom = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=4000',
    '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/'),
  ], { maxBuffer: 64e6, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  fs.unlinkSync(tmp);
  const m = dom.match(/<pre id="FOCO_AUDIT">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  return JSON.parse(Buffer.from(m[1].trim(), 'base64').toString('utf8'));
}

(async () => {
  let urls = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (process.argv.includes('--all')) {
    const xml = execFileSync('curl', ['-s', 'https://www.tryfoco.com/post-sitemap.xml'], { maxBuffer: 32e6 }).toString();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  }
  if (!urls.length) { console.error('usage: node scripts/audit-contrast.js <url> | --all'); process.exit(1); }

  let totalFails = 0;
  for (const url of urls) {
    let fails;
    try { fails = audit(url); } catch (e) { console.log(`?? ${url}  (${e.message})`); continue; }
    totalFails += fails.length;
    const slug = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
    if (!fails.length) { console.log(`OK  ${slug}`); continue; }
    console.log(`FAIL ${slug}  (${fails.length} under ${MIN_RATIO}:1)`);
    fails.sort((a, b) => a.ratio - b.ratio).forEach(f =>
      console.log(`     ${String(f.ratio).padStart(5)}  ${f.tag.padEnd(7)} ${f.cls.slice(0, 22).padEnd(22)} ${f.fg.padEnd(19)} on ${f.bg.padEnd(15)} "${f.text}"`));
  }
  console.log(`\n${totalFails} contrast failure(s) across ${urls.length} page(s).`);
  process.exit(totalFails ? 1 : 0);
})();
