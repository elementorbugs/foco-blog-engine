// Fetch portrait Pexels candidates per carousel slide -> carousel/photos/<slide>-<n>.jpg (+ credits.json)
// Key is read from the user's other project so FOCO's blog pipeline (which reacts to .pexels-key) is untouched.
// Usage: node carousel/fetch-photos.js
const fs = require("fs");
const path = require("path");

const KEY = fs.readFileSync("C:/Users/USER/remindher-blog/.pexels-key", "utf8").trim();
const OUT = path.join(__dirname, "photos");
fs.mkdirSync(OUT, { recursive: true });

const SETS = {
  v1: {
  hook: "woman lying on couch with phone",
  email: "laptop on bed coffee",
  laundry: "pile of clothes laundry",
  call: "hand holding phone at home",
  dishes: "dirty dishes in sink",
  papers: "paperwork documents on table",
  desk: "messy desk",
  },
  instead: {
    hook2: "woman looking at laptop bored",
    fridge: "person looking in open fridge",
    plants: "watering houseplants",
    scroll: "scrolling phone in bed night",
    spices: "organized spice jars",
    youtube: "watching video on laptop at night",
    clock: "wall clock late night",
  },
  tiny: {
    hook3: "woman sitting on floor overwhelmed",
    clean: "messy living room",
    study: "open textbook notes desk",
    gym: "sneakers by the door",
    inbox: "laptop email inbox",
    cook: "kitchen cutting board vegetables",
    shower: "bathroom shower towels",
  },
  morning: {
    hook4: "woman waking up in bed morning",
    alarm: "alarm clock bed morning",
    phonebed: "woman using phone in bed",
    coffee: "cup of coffee on table morning",
    mirror: "woman getting ready mirror",
    keys: "keys on table",
    late: "woman walking fast street",
  },
  lazy: {
    hook5: "tired woman lying on sofa",
    soak: "pots soaking in kitchen sink",
    mail: "pile of letters envelopes",
    chair: "clothes pile on chair",
    texts: "phone screen notifications",
    suitcase: "open suitcase bedroom",
    bottles: "empty water bottles on desk",
  },
  say: {
    hook6: "woman rolling eyes annoyed",
    sayStart: "overwhelmed woman at desk with papers",
    sayFive: "steep mountain path",
    sayWrite: "sticky notes on wall",
    sayEarlier: "woman lying on bed thinking",
    sayPressure: "woman typing laptop at night",
    sayPlanner: "stack of notebooks",
  },
  tax: {
    hook7: "receipts and wallet",
    taxPackage: "cardboard package at door",
    taxParking: "parking ticket on car windshield",
    taxTrial: "credit card and laptop online shopping",
    taxLibrary: "library books stack",
    taxFridge: "vegetables in fridge drawer",
    taxBill: "bills envelopes calculator",
  },
};
const SET = process.argv[2] || "v1";
const SLIDES = SETS[SET];

(async () => {
  const cf = path.join(OUT, "credits.json");
  const credits = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, "utf8")) : {};
  for (const [slide, q] of Object.entries(SLIDES)) {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=portrait&per_page=6`, { headers: { Authorization: KEY } });
    const { photos } = await res.json();
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const img = await fetch(p.src.large2x);
      fs.writeFileSync(path.join(OUT, `${slide}-${i + 1}.jpg`), Buffer.from(await img.arrayBuffer()));
      credits[`${slide}-${i + 1}`] = { photographer: p.photographer, url: p.url };
    }
    console.log(slide, photos.length);
  }
  fs.writeFileSync(path.join(OUT, "credits.json"), JSON.stringify(credits, null, 2));
})();
