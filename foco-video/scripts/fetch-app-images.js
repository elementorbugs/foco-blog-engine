// Downloads App Store icons + screenshots for each app in the video -> public/apps/
// Usage: node scripts/fetch-app-images.js
const fs = require("fs");
const path = require("path");

const APPS = { sunsama: 1475755747, inflow: 1528183849, morgen: 1604574131, tiimo: 1480220328, foco: 6762489184, goblin: 6449003064, finch: 1528595748, habitica: 994882113 };
const OUT = path.join(__dirname, "..", "public", "apps");
fs.mkdirSync(OUT, { recursive: true });

const save = async (url, file) => {
  const res = await fetch(url);
  fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
};

(async () => {
  for (const [name, id] of Object.entries(APPS)) {
    const { results } = await (await fetch(`https://itunes.apple.com/lookup?id=${id}&country=us`)).json();
    const app = results[0];
    await save(app.artworkUrl512, `${name}-icon.png`);
    const shots = app.screenshotUrls.slice(0, 6);
    for (let i = 0; i < shots.length; i++) await save(shots[i].replace(/\/[^/]+$/, "/1000x0w.png"), `${name}-${i + 1}.png`);
    console.log(name, app.trackName, `${shots.length} screenshots`);
  }
})();
