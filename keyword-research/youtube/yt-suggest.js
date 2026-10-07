// YouTube autocomplete for seed topics (+ a-z expansion on the strongest seeds) -> suggest.json
const fs = require("fs");
const seeds = ["adhd task paralysis","adhd can't start","adhd procrastination","adhd motivation","adhd focus","adhd productivity","adhd body doubling","adhd study","adhd cleaning","adhd morning routine","adhd time blindness","adhd executive dysfunction","adhd overwhelm","adhd burnout","how to stop procrastinating adhd","adhd apps","adhd planner","adhd to do list","adhd tips","adhd brain","adhd focus music","adhd work from home","adhd college","adhd women","adhd routine"];
const deep = ["adhd task paralysis","adhd procrastination","adhd focus","adhd productivity","adhd study","adhd cleaning"];
const get = async (q) => {
  const r = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=en&gl=us&q=${encodeURIComponent(q)}`);
  return (JSON.parse(await r.text())[1] || []);
};
(async () => {
  const out = {};
  for (const s of seeds) out[s] = await get(s);
  for (const s of deep) for (const c of "abcdefghijklmnopqrstuvwxyz") out[`${s} ${c}`] = await get(`${s} ${c}`);
  fs.writeFileSync("suggest.json", JSON.stringify(out, null, 1));
  const all = [...new Set(Object.values(out).flat())];
  console.log("unique suggestions:", all.length);
})();
