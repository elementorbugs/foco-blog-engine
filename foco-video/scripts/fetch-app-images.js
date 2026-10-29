// Downloads App Store icons + screenshots for each app in the video -> public/apps/
// Usage: node scripts/fetch-app-images.js
const fs = require("fs");
const path = require("path");

const APPS = { sunsama: 1475755747, inflow: 1528183849, morgen: 1604574131, tiimo: 1480220328, foco: 6762489184, goblin: 6449003064, finch: 1528595748, habitica: 994882113, structured: 1499198946, todoist: 572688855, motion: 1580440623, llamalife: 6454469750, ticktick: 626144601, things: 904237743, mstodo: 1212616790, notion: 1232780281, trello: 461504587, forest: 866450515, flora: 1225155794, pokesleep: 1579464667, pikmin: 1556357398, plantnanny: 1424178757 };
// Pass app names to fetch only those: node scripts/fetch-app-images.js todoist motion
const ONLY = process.argv.slice(2);
const OUT = path.join(__dirname, "..", "public", "apps");
fs.mkdirSync(OUT, { recursive: true });

const save = async (url, file) => {
  const res = await fetch(url);
  fs.writeFileSync(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
};

(async () => {
  for (const [name, id] of Object.entries(APPS)) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    const { results } = await (await fetch(`https://itunes.apple.com/lookup?id=${id}&country=us`)).json();
    const app = results[0];
    await save(app.artworkUrl512, `${name}-icon.png`);
    const shots = app.screenshotUrls.slice(0, 8);
    for (let i = 0; i < shots.length; i++) await save(shots[i].replace(/\/[^/]+$/, "/1000x0w.png"), `${name}-${i + 1}.png`);
    console.log(name, app.trackName, `${shots.length} screenshots`);
  }
})();
