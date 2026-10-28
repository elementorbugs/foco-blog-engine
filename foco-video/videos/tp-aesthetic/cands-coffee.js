// Vertical b-roll candidates from Pexels for the aesthetic task-paralysis short.
const fs = require('fs'), path = require('path'), https = require('https');
const { execFileSync } = require('child_process'); const FF = require('ffmpeg-static');
const key = fs.readFileSync('C:/Users/USER/remindher-blog/.pexels-key', 'utf8').trim();
const scenes = [['coffee', 'woman holding mug by window calm']];
const getJson = u => new Promise((res, rej) => https.get(u, { headers: { Authorization: key } }, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => res(JSON.parse(d))); }).on('error', rej));
const getBuf = u => new Promise((res, rej) => https.get(u, x => { if (x.statusCode >= 300 && x.headers.location) return getBuf(x.headers.location).then(res, rej); const c = []; x.on('data', d => c.push(d)); x.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
(async () => {
  const meta = {};
  for (const [id, q] of scenes) {
    const j = await getJson(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=6&size=medium`);
    meta[id] = [];
    for (let i = 0; i < (j.videos || []).length; i++) {
      const v = j.videos[i];
      fs.writeFileSync(path.join('work', `${id}-${i + 1}.jpg`), await getBuf(v.image));
      const f = v.video_files.filter(f => f.height >= 1280 && f.width < f.height).sort((a, b) => Math.abs(a.height - 1920) - Math.abs(b.height - 1920))[0];
      meta[id].push({ pick: i + 1, id: v.id, dur: v.duration, user: v.user && v.user.name, url: f && f.link, w: f && f.width, h: f && f.height });
    }
    const row = meta[id].map(m => `-i work/${id}-${m.pick}.jpg`).join(' ').split(' ');
    execFileSync(FF, ['-y', '-loglevel', 'error', ...row, '-filter_complex', meta[id].map((m, i) => `[${i}:v]scale=200:356:force_original_aspect_ratio=increase,crop=200:356[v${i}]`).join(';') + ';' + meta[id].map((m, i) => `[v${i}]`).join('') + `hstack=inputs=${meta[id].length}`, `work/row-${id}.jpg`]);
  }
  const all=JSON.parse(fs.readFileSync('work/cands.json','utf8'));all.coffee=meta.coffee;fs.writeFileSync('work/cands.json', JSON.stringify(all, null, 1));
  for (const [id] of scenes) console.log(id, meta[id].map(m => `${m.pick}:${m.dur}s ${m.w}x${m.h}`).join(' | '));
})().catch(e => console.error(e.message));
