// HOME_ARRIVAL_REIMAGINED — Arrival, reimagined from first principles.
//
// The arch is no longer the defining feature. The ORCHARD is the emotional anchor:
// the real landscape around the house, always viewed from the same location — the
// view the family sees every time they come home. These are 8 RADICALLY DIFFERENT
// arrival experiences, each a from-scratch architectural composition (not an
// injection onto the existing ARRIVAL1 room), embedding the owner's real orchard
// asset (client/public/orchard.webp — the v2 North Star orchard).
//
// Fixed, never challenged: modern living in a traditional English orchard ·
// hospitality before productivity · technology becoming quieter as it becomes
// better · Arrival is coming home. Everything else (banner, hero, nav, the arch)
// is challenged.
//
// Nothing here edits app source. Each concept is a self-contained HTML page rendered
// headless at desktop 1440 and mobile 430, deviceScaleFactor 2.
//
// Usage: npx tsx scripts/capture-home-arrival-reimagined.ts   (ONLY=1,8 to re-render some)
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "fs";
import path from "path";

const OUT = path.resolve("docs/ui-audit/home-arrival-reimagined");
const SCRATCH =
  "/tmp/claude-1000/-home-runner-workspace/4b8bb913-385a-47f7-8a08-4b7579c285c1/scratchpad";

// ---- assets, inlined as data URIs so each page is self-contained ------------
const b64 = (p: string) => readFileSync(p).toString("base64");
const ORCHARD = `data:image/webp;base64,${b64(path.resolve("client/public/orchard.webp"))}`;
const F_HAND = `data:font/woff2;base64,${b64(path.join(SCRATCH, "fonts/caveat.woff2"))}`;
const F_SERIF = `data:font/woff2;base64,${b64(path.join(SCRATCH, "fonts/cormorant.woff2"))}`;
const F_SANS = `data:font/woff2;base64,${b64(path.join(SCRATCH, "fonts/inter.woff2"))}`;

// ---- the household's one real day (identical across all eight) --------------
const DAY = {
  name: "Chloe",
  companion: "Spring greens are at their best — shall we plan something for the weekend?",
  goodNews: "The kettle's on and today's already planned — the greens are at their best.",
  facts: [
    { k: "Meals", v: "Three planned today" },
    { k: "Shopping", v: "Nothing left to fetch" },
    { k: "Orchard", v: "28 of 30 varieties this week" },
  ],
  action: "Start tonight's dinner",
  doors: ["Planner", "Cookbook", "Pantry", "Shopping"],
};

// ---- shared design tokens (the ARRIVAL1 material palette) -------------------
const TOKENS = /* css */ `
@font-face{font-family:'THA Hand';src:url(${F_HAND}) format('woff2');font-weight:600;font-display:block}
@font-face{font-family:'THA Serif';src:url(${F_SERIF}) format('woff2');font-weight:400 500;font-display:block}
@font-face{font-family:'THA Sans';src:url(${F_SANS}) format('woff2');font-weight:300 600;font-display:block}
:root{
  --plaster:#efe8da; --plaster-2:#e6ddca; --plaster-warm:#f3ecdd;
  --oak:#c49a63; --oak-deep:#8a6a40; --oak-lip:#e2c290; --stone:#dcd5c6; --stone-cool:#d0d1c8;
  --ivory:#faf6ee; --ink:#3c3a32; --ink-soft:#736f61; --ink-faint:#9a9484;
  --leaf:#7c8a4e; --leaf-deep:#5f6b3a; --brass:#b39366; --brass-lit:#d8bd8f;
  --sans:'THA Sans',system-ui,sans-serif; --serif:'THA Serif',Georgia,serif; --hand:'THA Hand',cursive;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased;overflow:hidden}
.orchard{background-image:url(${ORCHARD});background-size:cover;background-position:50% 42%}
/* one morning light — a single soft flare high-centre, never a second sun */
.morning{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% -12%,rgba(255,248,228,.55),rgba(255,248,228,0) 55%);pointer-events:none}
.hand{font-family:var(--hand);line-height:.95}
.serif{font-family:var(--serif)}
.eyebrow{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--ink-faint);font-weight:500}
.door{font-family:var(--sans);font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);font-weight:500}
.action{font-family:var(--sans);font-weight:500;letter-spacing:.02em;color:var(--ink);
  background:linear-gradient(180deg,#f7f1e6,#eadfca);border:1px solid rgba(138,106,64,.35);
  box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 6px 18px -8px rgba(60,50,30,.4);border-radius:999px}
`;

// ---- viewports -------------------------------------------------------------
const VIEWPORTS = [
  { key: "desktop", width: 1440, height: 900 },
  { key: "mobile", width: 430, height: 880 },
] as const;
type VP = (typeof VIEWPORTS)[number];

const page = (css: string, body: string) => `<!doctype html><html><head><meta charset="utf-8">
<style>${TOKENS}${css}</style></head><body>${body}</body></html>`;

// small shared fragments ------------------------------------------------------
const doorsRow = (cls = "") =>
  DAY.doors.map((d) => `<span class="door ${cls}">${d}</span>`).join("");
const factsInline = () =>
  DAY.facts.map((f) => `<span class="fx"><b>${f.v}</b><i>${f.k}</i></span>`).join("");

// =============================================================================
//  THE EIGHT ARRIVALS
// =============================================================================
type Concept = { n: number; slug: string; name: string; render: (m: boolean) => string };

const CONCEPTS: Concept[] = [
  // 1 — THE THRESHOLD ---------------------------------------------------------
  {
    n: 1, slug: "1-threshold", name: "The Threshold",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;display:flex;flex-direction:column;background:var(--plaster)}
      .view{position:relative;flex:1 1 ${m ? "56%" : "64%"};min-height:0}
      .view .orchard{position:absolute;inset:0}
      .sightline{position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,var(--brass-lit),transparent);opacity:.7}
      .vignette{position:absolute;inset:0;background:linear-gradient(180deg,rgba(60,58,50,.10),transparent 22%,transparent 74%,rgba(239,232,218,.28))}
      .sill{flex:0 0 auto;position:relative;padding:${m ? "26px 26px 30px" : "38px 64px 40px"};background:linear-gradient(180deg,var(--plaster-warm),var(--plaster))}
      .hi{font-family:var(--hand);color:var(--ink);font-size:${m ? "44px" : "62px"};margin-bottom:${m ? "10px" : "14px"}}
      .line{font-family:var(--serif);font-size:${m ? "18px" : "23px"};color:var(--ink-soft);max-width:640px;line-height:1.35;margin-bottom:${m ? "20px" : "24px"}}
      .facts{display:flex;gap:${m ? "22px" : "44px"};flex-wrap:wrap;margin-bottom:${m ? "22px" : "26px"}}
      .fx{display:flex;flex-direction:column-reverse;gap:2px}
      .fx b{font-weight:500;font-size:${m ? "15px" : "17px"};color:var(--ink)}
      .fx i{font-style:normal;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-faint)}
      .row{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
      .action{padding:${m ? "13px 22px" : "14px 28px"};font-size:${m ? "14px" : "15px"}}
      .doors{display:flex;gap:${m ? "16px" : "30px"};flex-wrap:wrap}
    `, `
      <div class="wrap">
        <div class="view orchard"><div class="morning"></div><div class="vignette"></div><div class="sightline"></div></div>
        <div class="sill">
          <div class="hi">Welcome home, ${DAY.name}</div>
          <div class="line">${DAY.companion}</div>
          <div class="facts">${factsInline()}</div>
          <div class="row">
            <button class="action">${DAY.action}</button>
            <div class="doors">${doorsRow()}</div>
          </div>
        </div>
      </div>`),
  },

  // 2 — THE COURTYARD ---------------------------------------------------------
  {
    n: 2, slug: "2-courtyard", name: "The Courtyard",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;background:linear-gradient(180deg,#e4ddce,#d8d0bf);display:flex;align-items:center;justify-content:center;padding:${m ? "22px" : "56px"}}
      .cloister{position:relative;width:100%;max-width:${m ? "100%" : "1120px"};height:100%;max-height:${m ? "100%" : "760px"};
        background:#eae3d4;border-radius:4px;box-shadow:0 40px 90px -50px rgba(50,44,30,.5);
        display:grid;grid-template-rows:${m ? "auto 1fr auto" : "auto 1fr auto"};padding:${m ? "22px" : "40px 56px"}}
      .top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:${m ? "14px" : "22px"}}
      .hi{font-family:var(--hand);font-size:${m ? "34px" : "44px"};color:var(--ink)}
      .sig{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--ink-faint)}
      .court{position:relative;display:grid;grid-template-columns:${m ? "1fr" : "180px 1fr"};gap:${m ? "16px" : "34px"};min-height:0}
      .aside{display:flex;flex-direction:column;justify-content:center;gap:${m ? "12px" : "20px"};${m ? "order:2" : ""}}
      .fx b{display:block;font-weight:500;font-size:${m ? "14px" : "16px"};color:var(--ink)}
      .fx i{font-style:normal;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-faint)}
      .void{position:relative;border-radius:2px;overflow:hidden;min-height:${m ? "260px" : "auto"};
        box-shadow:inset 0 0 0 1px rgba(120,100,70,.25),inset 0 18px 40px -20px rgba(40,34,20,.55)}
      .void .orchard{position:absolute;inset:0}
      .frameline{position:absolute;inset:10px;border:1px solid rgba(255,250,240,.35);pointer-events:none}
      .cl{font-family:var(--serif);font-size:${m ? "15px" : "18px"};color:var(--ink-soft);margin-top:${m ? "14px" : "0"};max-width:520px;line-height:1.35}
      .foot{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:${m ? "16px" : "26px"};flex-wrap:wrap}
      .doors{display:flex;gap:${m ? "14px" : "26px"};flex-wrap:wrap}
      .action{padding:12px 22px;font-size:14px}
    `, `
      <div class="wrap"><div class="cloister">
        <div class="top"><div class="hi">Welcome home, ${DAY.name}</div><div class="sig">The Healthy Apples</div></div>
        <div class="court">
          <div class="aside">${DAY.facts.map((f) => `<div class="fx"><b>${f.v}</b><i>${f.k}</i></div>`).join("")}</div>
          <div class="void orchard"><div class="morning"></div><div class="frameline"></div></div>
        </div>
        <div class="foot"><div class="cl">${DAY.companion}</div>
          <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><button class="action">${DAY.action}</button><div class="doors">${doorsRow()}</div></div>
        </div>
      </div></div>`),
  },

  // 3 — THE RESTORED FARMHOUSE ------------------------------------------------
  {
    n: 3, slug: "3-farmhouse", name: "The Restored Farmhouse",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;background:
        linear-gradient(180deg,#efe7d5,#e7dcc6);overflow:hidden}
      .wall{position:absolute;inset:0;background:
        radial-gradient(140% 100% at 50% 0,rgba(255,252,244,.6),transparent 60%),
        repeating-linear-gradient(92deg,rgba(180,160,120,.05) 0 3px,transparent 3px 7px);opacity:.9}
      .windows{position:relative;display:flex;justify-content:center;gap:${m ? "0" : "34px"};padding:${m ? "30px 20px 0" : "46px 0 0"}}
      .win{position:relative;width:${m ? "100%" : "300px"};height:${m ? "300px" : "330px"};border-radius:120px 120px 6px 6px;overflow:hidden;
        box-shadow:0 30px 60px -34px rgba(40,30,15,.7),inset 0 0 0 10px #efe7d5,inset 0 0 0 12px rgba(120,95,55,.5);
        ${m ? "" : "border:1px solid rgba(120,95,55,.3)"}}
      .win.side{${m ? "display:none" : "opacity:.94;transform:scale(.9);align-self:flex-end"}}
      .win .orchard{position:absolute;inset:0}
      .mullion{position:absolute;inset:0;pointer-events:none}
      .mullion:before{content:"";position:absolute;left:50%;top:0;bottom:0;width:6px;background:rgba(70,52,30,.7);transform:translateX(-50%)}
      .mullion:after{content:"";position:absolute;left:0;right:0;top:52%;height:6px;background:rgba(70,52,30,.7)}
      .sill{position:relative;margin:${m ? "0 20px" : "0 auto"};max-width:${m ? "none" : "760px"};
        margin-top:${m ? "-14px" : "-18px"};height:${m ? "20px" : "26px"};background:linear-gradient(180deg,#c49a63,#8a6a40);
        border-radius:3px;box-shadow:0 14px 26px -12px rgba(40,25,10,.6)}
      .below{position:relative;text-align:center;padding:${m ? "22px 24px 26px" : "30px 40px 34px"}}
      .hi{font-family:var(--hand);font-size:${m ? "40px" : "54px"};color:var(--ink);margin-bottom:8px}
      .line{font-family:var(--serif);font-size:${m ? "17px" : "21px"};color:var(--ink-soft);max-width:600px;margin:0 auto 18px;line-height:1.35}
      .facts{display:flex;justify-content:center;gap:${m ? "18px" : "40px"};flex-wrap:wrap;margin-bottom:20px}
      .fx b{font-weight:500;font-size:15px;color:var(--ink)}.fx i{display:block;font-style:normal;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-faint)}
      .rail{display:flex;align-items:center;justify-content:center;gap:${m ? "16px" : "28px"};flex-wrap:wrap}
      .action{padding:12px 24px;font-size:14px}
      .doors{display:flex;gap:${m ? "14px" : "24px"};flex-wrap:wrap}
    `, `
      <div class="wrap"><div class="wall"></div>
        <div class="windows">
          <div class="win side orchard"><div class="mullion"></div></div>
          <div class="win orchard"><div class="morning"></div><div class="mullion"></div></div>
          <div class="win side orchard"><div class="mullion"></div></div>
        </div>
        <div class="sill"></div>
        <div class="below">
          <div class="hi">Welcome home, ${DAY.name}</div>
          <div class="line">${DAY.companion}</div>
          <div class="facts">${DAY.facts.map((f) => `<span class="fx"><b>${f.v}</b><i>${f.k}</i></span>`).join("")}</div>
          <div class="rail"><button class="action">${DAY.action}</button><div class="doors">${doorsRow()}</div></div>
        </div>
      </div>`),
  },

  // 4 — THE LONG LIGHT --------------------------------------------------------
  {
    n: 4, slug: "4-long-light", name: "The Long Light",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;background:#f4f1ea;display:flex;flex-direction:column}
      .ribbon{position:relative;flex:0 0 ${m ? "34%" : "38%"};margin:${m ? "0" : "0"};overflow:hidden}
      .ribbon .orchard{position:absolute;inset:0;background-position:50% 46%;filter:saturate(.92) brightness(1.04)}
      .ribbon:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.14),transparent 40%,rgba(244,241,234,.5))}
      .body{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;padding:${m ? "0 30px" : "0 110px"}}
      .hi{font-family:var(--sans);font-weight:300;font-size:${m ? "34px" : "50px"};letter-spacing:-.01em;color:var(--ink);margin-bottom:${m ? "16px" : "22px"}}
      .hi b{font-weight:500}
      .line{font-family:var(--sans);font-weight:300;font-size:${m ? "16px" : "20px"};color:var(--ink-soft);max-width:560px;line-height:1.5;margin-bottom:${m ? "26px" : "40px"}}
      .facts{display:flex;gap:${m ? "24px" : "56px"};flex-wrap:wrap;margin-bottom:${m ? "30px" : "48px"}}
      .fx b{font-weight:400;font-size:${m ? "15px" : "18px"};color:var(--ink)}
      .fx i{display:block;font-style:normal;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--ink-faint);margin-top:4px}
      .foot{display:flex;align-items:center;gap:${m ? "20px" : "40px"};flex-wrap:wrap;border-top:1px solid rgba(120,110,85,.18);padding-top:${m ? "22px" : "28px"}}
      .action{padding:12px 24px;font-size:14px;background:none;border:1px solid rgba(95,107,58,.5);color:var(--leaf-deep);box-shadow:none}
      .doors{display:flex;gap:${m ? "16px" : "30px"};flex-wrap:wrap}
      .door{color:var(--ink-faint);font-size:12px}
    `, `
      <div class="wrap">
        <div class="ribbon orchard"><div class="morning"></div></div>
        <div class="body">
          <div class="hi">Good morning, <b>${DAY.name}</b></div>
          <div class="line">${DAY.companion}</div>
          <div class="facts">${DAY.facts.map((f) => `<span class="fx"><b>${f.v}</b><i>${f.k}</i></span>`).join("")}</div>
          <div class="foot"><button class="action">${DAY.action}</button><div class="doors">${doorsRow()}</div></div>
        </div>
      </div>`),
  },

  // 5 — THE GLASSHOUSE --------------------------------------------------------
  {
    n: 5, slug: "5-glasshouse", name: "The Glasshouse",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;overflow:hidden;background:#dfe0d4}
      .canopy{position:absolute;left:0;right:0;top:0;height:${m ? "50%" : "58%"}}
      .canopy .orchard{position:absolute;inset:0;background-position:50% 30%;filter:brightness(1.06)}
      .glaze{position:absolute;inset:0;pointer-events:none;
        background:repeating-linear-gradient(90deg,rgba(70,58,34,.0) 0 ${m ? "78px" : "150px"},rgba(70,58,34,.55) ${m ? "78px" : "150px"} ${m ? "84px" : "158px"});}
      .glaze:after{content:"";position:absolute;left:0;right:0;top:0;height:8px;background:rgba(70,58,34,.6)}
      .skylight{position:absolute;left:0;right:0;top:0;height:${m ? "50%" : "58%"};
        background:linear-gradient(180deg,rgba(255,250,232,.45),transparent 60%);mix-blend-mode:screen}
      .beams{position:absolute;left:0;right:0;top:${m ? "50%" : "58%"};bottom:0;pointer-events:none;
        background:repeating-linear-gradient(104deg,rgba(255,248,225,.0) 0 60px,rgba(255,248,225,.18) 60px 96px)}
      .room{position:absolute;left:0;right:0;bottom:0;height:${m ? "58%" : "50%"};
        background:linear-gradient(180deg,rgba(223,224,212,0),#e9e4d6 34%)}
      .plinth{position:absolute;left:50%;transform:translateX(-50%);bottom:${m ? "30px" : "56px"};
        width:${m ? "calc(100% - 40px)" : "820px"};max-width:calc(100% - 40px);
        background:linear-gradient(180deg,#efe9dc,#ded6c4);border-radius:4px;
        box-shadow:0 40px 70px -40px rgba(50,40,20,.6),inset 0 1px 0 rgba(255,255,255,.6);
        padding:${m ? "22px 24px 24px" : "30px 44px 32px"}}
      .hi{font-family:var(--hand);font-size:${m ? "38px" : "52px"};color:var(--ink);margin-bottom:10px}
      .line{font-family:var(--serif);font-size:${m ? "16px" : "20px"};color:var(--ink-soft);max-width:600px;line-height:1.35;margin-bottom:18px}
      .facts{display:flex;gap:${m ? "18px" : "44px"};flex-wrap:wrap;margin-bottom:20px}
      .fx b{font-weight:500;font-size:15px;color:var(--ink)}.fx i{display:block;font-style:normal;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-faint);margin-top:3px}
      .row{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
      .action{padding:12px 24px;font-size:14px;background:linear-gradient(180deg,#f4ecda,#e4d3ad);border-color:rgba(179,147,102,.6)}
      .doors{display:flex;gap:${m ? "14px" : "26px"};flex-wrap:wrap}
    `, `
      <div class="wrap">
        <div class="canopy orchard"><div class="skylight"></div><div class="glaze"></div></div>
        <div class="room"></div><div class="beams"></div>
        <div class="plinth">
          <div class="hi">Welcome home, ${DAY.name}</div>
          <div class="line">${DAY.companion}</div>
          <div class="facts">${DAY.facts.map((f) => `<span class="fx"><b>${f.v}</b><i>${f.k}</i></span>`).join("")}</div>
          <div class="row"><button class="action">${DAY.action}</button><div class="doors">${doorsRow()}</div></div>
        </div>
      </div>`),
  },

  // 6 — THE REFLECTION --------------------------------------------------------
  {
    n: 6, slug: "6-reflection", name: "The Reflection",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;overflow:hidden;background:#c7ccbc}
      .real{position:absolute;left:0;right:0;top:0;height:${m ? "44%" : "50%"}}
      .real .orchard{position:absolute;inset:0;background-position:50% 64%}
      .water{position:absolute;left:0;right:0;top:${m ? "44%" : "50%"};bottom:0;overflow:hidden}
      .mirror{position:absolute;inset:0;background-image:url(${ORCHARD});background-size:cover;
        background-position:50% 64%;transform:scaleY(-1);filter:blur(2px) saturate(.8) brightness(.98)}
      .tint{position:absolute;inset:0;background:linear-gradient(180deg,rgba(150,166,150,.35),rgba(120,140,130,.78));mix-blend-mode:multiply}
      .ripple{position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.06) 0 2px,rgba(120,130,120,.06) 2px 7px);mix-blend-mode:overlay}
      .shore{position:absolute;left:0;right:0;top:${m ? "44%" : "50%"};height:3px;transform:translateY(-1px);
        background:linear-gradient(90deg,transparent,rgba(255,252,244,.85),transparent);box-shadow:0 6px 20px -4px rgba(255,250,235,.5)}
      .float{position:absolute;left:50%;transform:translateX(-50%);top:${m ? "27%" : "30%"};width:${m ? "calc(100% - 44px)" : "820px"};max-width:calc(100% - 44px);text-align:center}
      .hi{font-family:var(--hand);font-size:${m ? "44px" : "62px"};color:#fffdf7;text-shadow:0 2px 22px rgba(60,60,40,.55);margin-bottom:10px}
      .line{font-family:var(--serif);font-size:${m ? "16px" : "21px"};color:#f4f1e6;max-width:560px;margin:0 auto;line-height:1.35;text-shadow:0 2px 14px rgba(50,54,36,.6)}
      .below{position:absolute;left:50%;transform:translateX(-50%);bottom:${m ? "44px" : "66px"};width:${m ? "calc(100% - 44px)" : "820px"};max-width:calc(100% - 44px);text-align:center}
      .facts{display:flex;justify-content:center;gap:${m ? "18px" : "42px"};flex-wrap:wrap;margin-bottom:22px}
      .fx b{font-weight:500;font-size:15px;color:#fbf8ee;text-shadow:0 1px 10px rgba(40,44,28,.7)}.fx i{display:block;font-style:normal;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#e0ddca;margin-top:3px}
      .rail{display:flex;align-items:center;justify-content:center;gap:${m ? "16px" : "28px"};flex-wrap:wrap}
      .action{padding:12px 24px;font-size:14px;background:rgba(250,246,238,.9);backdrop-filter:blur(2px)}
      .doors{display:flex;gap:${m ? "14px" : "24px"};flex-wrap:wrap}.door{color:#eeeadb}
    `, `
      <div class="wrap">
        <div class="real orchard"><div class="morning"></div></div>
        <div class="water"><div class="mirror"></div><div class="tint"></div><div class="ripple"></div></div>
        <div class="shore"></div>
        <div class="float">
          <div class="hi">Welcome home, ${DAY.name}</div>
          <div class="line">${DAY.companion}</div>
        </div>
        <div class="below">
          <div class="facts">${DAY.facts.map((f) => `<span class="fx"><b>${f.v}</b><i>${f.k}</i></span>`).join("")}</div>
          <div class="rail"><button class="action">${DAY.action}</button><div class="doors">${doorsRow()}</div></div>
        </div>
      </div>`),
  },

  // 7 — THE WALK --------------------------------------------------------------
  {
    n: 7, slug: "7-walk", name: "The Walk",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;overflow:hidden;background:#3a3a2c}
      .land{position:absolute;inset:0}
      .land .orchard{position:absolute;inset:0;background-position:50% 40%;transform:scale(1.08)}
      .depth{position:absolute;inset:0;background:
        radial-gradient(80% 60% at 50% 30%,transparent,rgba(30,32,20,.35) 90%),
        linear-gradient(180deg,transparent 40%,rgba(28,30,18,.55))}
      .near{position:absolute;left:0;right:0;bottom:0;padding:${m ? "0 26px 34px" : "0 0 60px"};text-align:center}
      .hi{font-family:var(--hand);font-size:${m ? "44px" : "68px"};color:#fbf7ec;text-shadow:0 2px 24px rgba(20,22,10,.6);margin-bottom:${m ? "8px" : "12px"}}
      .line{font-family:var(--serif);font-size:${m ? "17px" : "22px"};color:#efe9d8;max-width:600px;margin:0 auto ${m ? "22px" : "30px"};line-height:1.35;text-shadow:0 2px 16px rgba(20,22,10,.7)}
      .facts{display:flex;justify-content:center;gap:${m ? "20px" : "46px"};flex-wrap:wrap;margin-bottom:${m ? "24px" : "34px"}}
      .fx b{font-weight:500;font-size:15px;color:#faf6ea;text-shadow:0 1px 10px rgba(20,22,10,.7)}
      .fx i{display:block;font-style:normal;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#cfcbb6;margin-top:3px}
      .rail{display:flex;align-items:center;justify-content:center;gap:${m ? "16px" : "30px"};flex-wrap:wrap}
      .action{padding:13px 26px;font-size:14px;background:rgba(250,246,238,.9);border-color:rgba(255,255,255,.4)}
      .doors{display:flex;gap:${m ? "16px" : "28px"};flex-wrap:wrap}.door{color:#e7e2cf}
      .path{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:${m ? "60%" : "40%"};height:46%;
        background:linear-gradient(180deg,rgba(255,248,225,0),rgba(255,248,225,.10));clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);pointer-events:none}
    `, `
      <div class="wrap">
        <div class="land orchard"><div class="morning"></div></div>
        <div class="depth"></div><div class="path"></div>
        <div class="near">
          <div class="hi">Welcome home, ${DAY.name}</div>
          <div class="line">${DAY.companion}</div>
          <div class="facts">${DAY.facts.map((f) => `<span class="fx"><b>${f.v}</b><i>${f.k}</i></span>`).join("")}</div>
          <div class="rail"><button class="action">${DAY.action}</button><div class="doors">${doorsRow()}</div></div>
        </div>
      </div>`),
  },

  // 8 — THE CLEARING (Claude's original) --------------------------------------
  {
    n: 8, slug: "8-clearing", name: "The Clearing",
    render: (m) => page(`
      .wrap{position:relative;height:100vh;overflow:hidden}
      .land{position:absolute;inset:0}
      .land .orchard{position:absolute;inset:0;background-position:50% 44%}
      .haze{position:absolute;inset:0;background:
        radial-gradient(90% 70% at 50% 8%,rgba(255,250,235,.5),transparent 55%),
        linear-gradient(180deg,rgba(255,252,244,.12),transparent 30%,transparent 66%,rgba(70,74,48,.28))}
      .sky{position:absolute;left:0;right:0;top:${m ? "8%" : "12%"};text-align:center}
      .hi{font-family:var(--hand);font-size:${m ? "50px" : "82px"};color:#fffdf6;
        text-shadow:0 2px 30px rgba(90,80,40,.55),0 0 2px rgba(120,110,70,.4)}
      .dew{position:absolute;left:0;right:0;top:${m ? "34%" : "40%"};text-align:center}
      .good{font-family:var(--serif);font-style:italic;font-size:${m ? "19px" : "27px"};color:#fbf8ee;max-width:${m ? "88%" : "620px"};
        margin:0 auto;line-height:1.4;text-shadow:0 2px 20px rgba(60,54,26,.6)}
      .facts{position:absolute;left:0;right:0;bottom:${m ? "150px" : "168px"};display:flex;justify-content:center;gap:${m ? "22px" : "60px"};flex-wrap:wrap}
      .fx{opacity:.92}
      .fx b{font-weight:400;font-size:${m ? "14px" : "16px"};color:#f6f2e4;text-shadow:0 1px 12px rgba(40,40,20,.6)}
      .fx i{display:block;font-style:normal;font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#dcd8c2;margin-top:4px}
      .paths{position:absolute;left:0;right:0;bottom:${m ? "44px" : "60px"};display:flex;justify-content:center;gap:${m ? "22px" : "60px"};flex-wrap:wrap}
      .p{position:relative;font-family:var(--sans);font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#f3efe0;text-shadow:0 1px 10px rgba(40,40,20,.7);padding-top:16px}
      .p:before{content:"";position:absolute;left:50%;top:0;transform:translateX(-50%);width:1px;height:10px;background:linear-gradient(180deg,rgba(255,250,235,.9),transparent)}
    `, `
      <div class="wrap">
        <div class="land orchard"><div class="haze"></div></div>
        <div class="sky"><div class="hi">Welcome home, ${DAY.name}</div></div>
        <div class="dew"><div class="good">${DAY.goodNews}</div></div>
        <div class="facts">${DAY.facts.map((f) => `<span class="fx"><b>${f.v}</b><i>${f.k}</i></span>`).join("")}</div>
        <div class="paths">${DAY.doors.map((d) => `<span class="p">${d}</span>`).join("")}</div>
      </div>`),
  },
];

// =============================================================================
async function main() {
  mkdirSync(OUT, { recursive: true });
  const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  for (const c of CONCEPTS) {
    if (only && !only.includes(String(c.n)) && !only.includes(c.slug)) continue;
    for (const vp of VIEWPORTS as readonly VP[]) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const pg = await ctx.newPage();
      await pg.setContent(c.render(vp.key === "mobile"), { waitUntil: "load" });
      await pg.waitForTimeout(350); // let fonts settle
      const file = path.join(OUT, `${c.slug}-${vp.key}.png`);
      await pg.screenshot({ path: file });
      await ctx.close();
      console.log("rendered", path.basename(file));
    }
  }
  await browser.close();
  console.log("DONE", OUT);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
