// HOME_INTERIOR_ARCHITECTURE — eight radically different interior homes.
//
// The mission: reimagine the COMPLETE INTERIOR of The Healthy Apples Home, keeping
// only the LOCKED structure — the orchard, the concept of the house, the archway,
// and the philosophy of modern living in a traditional English orchard. Everything
// else (arrival, navigation, furniture, cabinetry, wall treatments, flooring,
// materials, lighting, typography, composition, Companion placement, controls) is
// redesigned from scratch. These are not five feelings of one room (HOME_FINAL_
// CONCEPTS did that) — they are eight DIFFERENT HOMES.
//
// Each home is a self-contained HTML interior rendered by Playwright at desktop
// (1440) and mobile (430), deviceScaleFactor 2, on the SAME populated day so the
// homes are directly comparable. The real orchard (/orchard.webp) and the apple
// (/_brand2-apple.png) are served by the running dev server; the material palette
// is ARRIVAL1's own (index.css .home-arrival) and the type is THA's own
// (Inter / DM Sans / Caveat). Nothing edits app source.
//
// Usage: npx tsx scripts/capture-home-interior-architecture.ts   (ONLY=1,8 for some)
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const HOST = "http://localhost:5000";
const ORCHARD = `${HOST}/orchard.webp`;
const APPLE = `${HOST}/_brand2-apple.png`;
const OUT = path.resolve("docs/ui-audit/home-interior-architecture");

// ── The populated day — the SAME real data every home lays out ────────────────
const D = {
  name: "Chloe",
  date: "Friday, 17 July",
  meals: [
    { type: "Breakfast", name: "Green Protein Smoothie" },
    { type: "Lunch", name: "Spring Lentil Salad" },
    { type: "Dinner", name: "Herb-Roasted Chicken" },
  ],
  shopping: ["Milk", "Mixed Nuts", "Olive Oil", "Spinach", "Oats"],
  plants: 28,
  plantTarget: 30,
  companion: "Spring greens are at their best — shall we plan something for the weekend?",
  primary: "Open the planner",
  rooms: [
    { label: "Planner", glyph: "▤" },
    { label: "Cookbook", glyph: "❦" },
    { label: "Pantry", glyph: "▦" },
    { label: "Shopping", glyph: "◫" },
  ],
};

// ── Shared foundation ─────────────────────────────────────────────────────────
// The ARRIVAL1 orchard material palette (index.css .home-arrival), exact HSL.
const BASE = `
:root{
  --wall:36 46% 94%; --wall-shadow:34 34% 88%; --wall-lit:38 62% 96%;
  --floor:33 27% 84%; --floor-near:32 22% 79%;
  --oak:41 36% 58%; --oak-lit:42 43% 66%; --oak-body:41 38% 47%; --oak-edge:44 42% 28%;
  --ivory:39 64% 97%; --ivory-edge:38 32% 90%;
  --leaf:74 30% 30%; --leaf-soft:74 24% 40%;
  --brass:41 48% 58%; --brass-lit:44 62% 74%; --brass-deep:38 46% 40%;
  --ink:56 16% 20%; --muted:56 10% 42%;
  --sans:'Inter',-apple-system,'Segoe UI',sans-serif;
  --display:'DM Sans',-apple-system,'Segoe UI',sans-serif;
  --sig:'Caveat','Segoe Script',cursive;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%}
body{font-family:var(--sans);color:hsl(var(--ink));-webkit-font-smoothing:antialiased;background:hsl(var(--wall))}
.plaster{background:
  radial-gradient(132% 54% at 50% -8%, hsl(var(--wall-lit)) 0%, hsl(var(--wall-lit)/0) 62%),
  radial-gradient(80% 62% at 0% 26%, hsl(var(--wall-shadow)/.45) 0%, hsl(var(--wall-shadow)/0) 55%),
  radial-gradient(80% 62% at 100% 26%, hsl(var(--wall-shadow)/.45) 0%, hsl(var(--wall-shadow)/0) 55%),
  hsl(var(--wall));}
.oak{background:
  radial-gradient(120% 120% at 50% -20%, hsl(var(--oak-lit)) 0%, hsl(var(--oak-lit)/0) 60%),
  linear-gradient(178deg, hsl(var(--oak)) 0%, hsl(var(--oak-body)) 100%);
  position:relative;}
.oak::before{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;
  background:repeating-linear-gradient(91deg, hsl(var(--oak-edge)/.16) 0 1px, transparent 1px 9px);}
.stone{background:linear-gradient(180deg, hsl(var(--floor)) 0%, hsl(var(--floor-near)) 100%);}
.ivory{background:hsl(var(--ivory));border:1px solid hsl(var(--ivory-edge));}
.sig{font-family:var(--sig);color:hsl(var(--leaf));line-height:1}
.muted{color:hsl(var(--muted))}
/* pressed INTO plaster (dark rim up, lit rim down — the room's one morning) */
.emboss{color:hsl(35 22% 74%);text-shadow:0 -1px 1px hsl(34 30% 72%),0 1px 1px hsl(42 74% 99%);}
/* engraved INTO oak */
.engrave{color:hsl(41 44% 26%);text-shadow:0 -1px 0 hsl(41 30% 34%),0 1px 0 hsl(44 55% 80%/.55);}
/* brass plate */
.brass{background:linear-gradient(180deg,hsl(var(--brass-lit)) 0%,hsl(var(--brass)) 46%,hsl(var(--brass-deep)) 100%);
  color:hsl(38 40% 22%);border:1px solid hsl(var(--brass-deep)/.7);
  box-shadow:inset 0 1px 0 hsl(46 70% 86%/.7),inset 0 -1px 2px hsl(38 46% 30%/.5),0 1px 2px hsl(38 40% 20%/.3);}
.apple{-webkit-mask:url(${APPLE}) center/contain no-repeat;mask:url(${APPLE}) center/contain no-repeat;}
`;

// The orchard seen through a plaster arch that GROWS from the surface it stands on.
// `spring` = where the arch meets its base (table / sill / floor), so it reads as
// grown, not hung. Returns a positioned block; caller sizes the wrapper.
function arch(radiusTop = "50% 50% 0 0 / 62% 62% 0 0") {
  return `
  <div class="orchard-arch" style="position:relative;width:100%;height:100%;overflow:hidden;
     border-radius:${radiusTop};
     box-shadow:inset 0 0 0 1px hsl(var(--wall-shadow)/.6), inset 0 14px 30px -10px hsl(38 40% 30%/.35), inset 0 -2px 0 hsl(42 74% 99%/.4);">
    <img src="${ORCHARD}" alt="orchard" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 42%;">
    <div style="position:absolute;inset:0;background:
       radial-gradient(70% 40% at 50% 6%, hsl(46 90% 92%/.5), transparent 60%),
       linear-gradient(180deg, transparent 60%, hsl(40 40% 30%/.14));"></div>
  </div>`;
}

// small svg plant ring (still — no motion), 28/30
function ring(size = 64, stroke = 6) {
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const pct = D.plants / D.plantTarget;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="hsl(74 22% 82%)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="hsl(74 32% 32%)" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${pct * c} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

// ── The eight homes ───────────────────────────────────────────────────────────
type Home = { id: string; name: string; css: string; body: string };
const HOMES: Home[] = [];

// 1 ── THE LONG TABLE — the luxury country kitchen. One long oak refectory table
// under a wide orchard window; navigation carved into the table's front edge; the
// day laid out as objects on the wood; the Companion a note by the head of the table.
HOMES.push({
  id: "1-long-table",
  name: "The Long Table",
  css: `
  .lt{min-height:100%;padding:0 0 64px;display:flex;flex-direction:column;align-items:center}
  .lt-view{width:100%;max-width:1180px;height:300px;margin:0 auto;padding:0 40px}
  .lt-arch{width:100%;height:100%}
  .lt-sig{margin:26px 0 4px;font-size:76px}
  .lt-hello{font-family:var(--display);font-size:19px;color:hsl(var(--muted));letter-spacing:.01em}
  .lt-date{margin-top:6px;font-size:14px}
  /* the table: a broad oak plane, edge toward us, standing on the stone floor */
  .lt-table{position:relative;width:min(1120px,92vw);margin:30px auto 0;border-radius:14px 14px 6px 6px;
     padding:34px 44px 0;box-shadow:0 40px 60px -34px hsl(41 40% 20%/.6);}
  .lt-things{display:grid;grid-template-columns:1.3fr 1fr .9fr;gap:26px;padding-bottom:30px}
  .lt-thing{position:relative}
  .lt-lbl{font-family:var(--display);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:hsl(44 40% 82%/.9);margin-bottom:12px}
  .lt-note{background:hsl(var(--ivory));border-radius:3px;padding:16px 18px;box-shadow:0 10px 18px -10px hsl(41 40% 18%/.7),0 1px 0 hsl(0 0% 100%/.6) inset;transform:rotate(-.6deg)}
  .lt-meal{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid hsl(38 28% 88%)}
  .lt-meal:last-child{border-bottom:0}
  .lt-meal b{font-weight:600}.lt-meal span{color:hsl(var(--muted));font-size:13px}
  .lt-list{list-style:none}.lt-list li{padding:5px 0;border-bottom:1px dashed hsl(38 24% 86%);font-size:14px}
  .lt-orch{display:flex;align-items:center;gap:14px}
  /* the carved front edge of the table = the navigation */
  .lt-edge{position:relative;margin:0 -44px;height:66px;border-radius:0 0 6px 6px;
     display:flex;align-items:center;justify-content:center;gap:8px;
     box-shadow:inset 0 2px 6px hsl(41 40% 20%/.5), inset 0 -3px 0 hsl(44 55% 78%/.4);}
  .lt-edge::before{content:"";position:absolute;inset:0;opacity:.5;background:repeating-linear-gradient(91deg,hsl(var(--oak-edge)/.2) 0 1px,transparent 1px 9px)}
  .lt-room{position:relative;font-family:var(--display);font-size:15px;letter-spacing:.16em;text-transform:uppercase;padding:10px 22px}
  .lt-room+.lt-room{border-left:1px solid hsl(44 40% 30%/.4)}
  .lt-do{margin:22px auto 0;display:inline-flex}
  .lt-btn{display:inline-flex;align-items:center;gap:10px;padding:14px 30px;border-radius:999px;
     font-family:var(--display);font-weight:600;font-size:16px;color:hsl(40 50% 96%);
     background:linear-gradient(180deg,hsl(74 26% 34%),hsl(74 30% 26%));box-shadow:0 12px 22px -12px hsl(74 40% 16%/.8)}
  .lt-comp{position:relative;width:min(1120px,92vw);margin:22px auto 0;display:flex;justify-content:flex-end}
  .lt-card{max-width:400px;background:hsl(var(--ivory));border-radius:4px;padding:15px 18px 17px;
     box-shadow:0 14px 26px -16px hsl(41 40% 18%/.7);transform:rotate(.5deg)}
  .lt-card .k{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:hsl(var(--leaf-soft));margin-bottom:6px}
  .lt-card p{font-family:var(--sig);font-size:23px;color:hsl(var(--ink));line-height:1.25}
  @media(max-width:640px){
    .lt-view{height:210px;padding:0 16px}.lt-sig{font-size:52px}
    .lt-table{width:94vw;padding:22px 20px 0}.lt-things{grid-template-columns:1fr;gap:16px}
    .lt-edge{margin:0 -20px;flex-wrap:wrap;height:auto;padding:6px 0}
    .lt-room{padding:9px 14px;font-size:12px}.lt-room+.lt-room{border-left:0}
    .lt-comp,.lt-card{width:auto;max-width:none}
  }`,
  body: `
  <div class="lt plaster">
    <div class="lt-view"><div class="lt-arch">${arch()}</div></div>
    <div style="text-align:center">
      <div class="lt-hello">Welcome home,</div>
      <div class="lt-sig sig">${D.name}</div>
      <div class="lt-date muted">${D.date}</div>
    </div>
    <div class="lt-table oak">
      <div class="lt-things">
        <div class="lt-thing"><div class="lt-lbl">Today's meals</div>
          <div class="lt-note">${D.meals.map(m => `<div class="lt-meal"><b>${m.name}</b><span>${m.type}</span></div>`).join("")}</div>
        </div>
        <div class="lt-thing"><div class="lt-lbl">Shopping list</div>
          <div class="lt-note"><ul class="lt-list">${D.shopping.slice(0, 4).map(s => `<li>${s}</li>`).join("")}<li style="color:hsl(var(--muted))">and 1 more</li></ul></div>
        </div>
        <div class="lt-thing"><div class="lt-lbl">From the orchard</div>
          <div class="lt-note lt-orch">${ring(66)}<div><div style="font-size:26px;font-weight:600">${D.plants}<span style="font-size:15px;font-weight:400;color:hsl(var(--muted))"> / ${D.plantTarget}</span></div><div style="font-size:13px;color:hsl(var(--muted))">plants this week</div></div></div>
        </div>
      </div>
      <div class="lt-edge oak">
        ${D.rooms.map(r => `<div class="lt-room engrave">${r.label}</div>`).join("")}
      </div>
    </div>
    <div class="lt-do"><a class="lt-btn">${D.primary} <span>→</span></a></div>
    <div class="lt-comp"><div class="lt-card"><div class="k">Companion</div><p>${D.companion}</p></div></div>
  </div>`,
});

// 2 ── THE DRESSER WALL — a floor-to-ceiling built-in Welsh dresser IS the whole
// interface. The orchard window is set into the top of the dresser; the day rests on
// open shelves; navigation is engraved oak drawers with brass label-holders; the
// Companion is a framed card propped on a shelf.
HOMES.push({
  id: "2-dresser-wall",
  name: "The Dresser Wall",
  css: `
  .dr{min-height:100%;padding:34px 0 60px;display:flex;justify-content:center;background:
     radial-gradient(120% 60% at 50% 0%, hsl(var(--wall-lit)) 0%, hsl(var(--wall-lit)/0) 55%), hsl(var(--wall))}
  .dr-unit{width:min(1160px,94vw);border-radius:12px 12px 4px 4px;padding:0 0 0;position:relative;
     box-shadow:0 50px 70px -40px hsl(41 40% 18%/.7), inset 0 0 0 2px hsl(44 42% 30%/.4)}
  .dr-top{padding:18px 18px 0}
  .dr-arch{height:240px;border-radius:44% 44% 0 0/70% 70% 0 0;overflow:hidden;box-shadow:inset 0 0 0 6px hsl(44 42% 30%/.5)}
  .dr-greet{text-align:center;padding:20px 0 6px}
  .dr-hello{font-family:var(--display);font-size:17px;color:hsl(44 46% 84%)}
  .dr-sig{font-size:58px;margin-top:2px;color:hsl(44 60% 88%)}
  .dr-shelf{margin:12px 20px 0;border-radius:4px;padding:22px 22px 26px;position:relative;
     box-shadow:inset 0 3px 8px hsl(41 40% 16%/.55), inset 0 -1px 0 hsl(44 55% 78%/.35)}
  .dr-shelf::after{content:"";position:absolute;left:0;right:0;bottom:-9px;height:9px;border-radius:0 0 4px 4px;background:linear-gradient(180deg,hsl(var(--oak-body)),hsl(var(--oak-edge)));}
  .dr-plates{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:18px}
  .dr-plate{background:hsl(var(--ivory));border-radius:3px;padding:15px 16px;box-shadow:0 12px 18px -12px hsl(41 40% 16%/.8)}
  .dr-plate h4{font-family:var(--display);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:hsl(var(--leaf-soft));margin-bottom:10px}
  .dr-m{display:flex;justify-content:space-between;gap:8px;font-size:14px;padding:5px 0;border-bottom:1px solid hsl(38 26% 90%)}
  .dr-m:last-child{border:0}.dr-m span{color:hsl(var(--muted));font-size:12px}
  .dr-li{list-style:none}.dr-li li{font-size:13px;padding:3px 0}
  .dr-orch{display:flex;align-items:center;gap:12px}
  .dr-comp{margin-top:16px;background:hsl(var(--ivory));border-left:3px solid hsl(var(--leaf));border-radius:2px;padding:12px 16px;box-shadow:0 10px 16px -12px hsl(41 40% 16%/.7)}
  .dr-comp .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:hsl(var(--leaf-soft))}
  .dr-comp p{font-family:var(--sig);font-size:22px;line-height:1.2;margin-top:3px}
  /* the drawers = navigation, engraved oak fronts with brass label plates */
  .dr-drawers{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:22px 20px 20px}
  .dr-drawer{border-radius:5px;height:96px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
     box-shadow:inset 0 2px 5px hsl(41 40% 18%/.5), inset 0 -3px 0 hsl(44 55% 78%/.35), 0 3px 6px -3px hsl(41 40% 16%/.5)}
  .dr-glyph{font-size:24px;color:hsl(41 44% 26%);text-shadow:0 1px 0 hsl(44 55% 80%/.5)}
  .dr-pull{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:34px;height:8px;border-radius:5px}
  .dr-name{font-family:var(--display);font-size:11px;letter-spacing:.18em;text-transform:uppercase;padding:3px 12px;border-radius:2px}
  .dr-do{grid-column:1/-1;display:flex;justify-content:center;margin-top:2px}
  .dr-btn{display:inline-flex;align-items:center;gap:10px;padding:14px 32px;border-radius:6px;font-family:var(--display);font-weight:600;color:hsl(40 50% 96%);
     background:linear-gradient(180deg,hsl(74 26% 34%),hsl(74 30% 25%));box-shadow:0 12px 20px -12px hsl(74 40% 16%/.8)}
  @media(max-width:640px){
    .dr-arch{height:170px}.dr-sig{font-size:44px}
    .dr-shelf{margin:12px 12px 0;padding:16px}.dr-plates{grid-template-columns:1fr;gap:12px}
    .dr-drawers{grid-template-columns:repeat(2,1fr);margin:16px 12px}
  }`,
  body: `
  <div class="dr">
    <div class="dr-unit oak">
      <div class="dr-top"><div class="dr-arch">${arch("0")}</div></div>
      <div class="dr-greet"><div class="dr-hello">Welcome home,</div><div class="dr-sig sig">${D.name}</div></div>
      <div class="dr-shelf oak">
        <div class="dr-plates">
          <div class="dr-plate"><h4>Today's meals</h4>${D.meals.map(m => `<div class="dr-m"><b>${m.name}</b><span>${m.type}</span></div>`).join("")}</div>
          <div class="dr-plate"><h4>Shopping</h4><ul class="dr-li">${D.shopping.map(s => `<li>· ${s}</li>`).join("")}</ul></div>
          <div class="dr-plate"><h4>From the orchard</h4><div class="dr-orch">${ring(58)}<div><b style="font-size:22px">${D.plants}</b><span style="color:hsl(var(--muted))"> / ${D.plantTarget}</span><div style="font-size:12px;color:hsl(var(--muted))">plants</div></div></div></div>
        </div>
        <div class="dr-comp"><div class="k">Companion</div><p>${D.companion}</p></div>
      </div>
      <div class="dr-drawers">
        ${D.rooms.map(r => `<div class="dr-drawer oak"><div class="dr-pull brass"></div><div class="dr-glyph">${r.glyph}</div><div class="dr-name brass">${r.label}</div></div>`).join("")}
        <div class="dr-do"><a class="dr-btn">${D.primary} →</a></div>
      </div>
    </div>
  </div>`,
});

// 3 ── THE LIGHT ROOM — a Scandinavian retreat. Pale, airy, weightless. A tall
// central arch; everything floats on the plaster with vast air; navigation is a quiet
// column of labels EMBOSSED into the plaster (no boxes); the day is a single thin
// picture-rail ledge with three small objects; the Companion is a whisper of text low.
HOMES.push({
  id: "3-light-room",
  name: "The Light Room",
  css: `
  .lr{min-height:100%;padding:56px 6vw 80px;background:
     radial-gradient(90% 60% at 50% -6%, hsl(40 60% 98%), hsl(38 40% 95%) 60%, hsl(36 34% 93%));
     display:grid;grid-template-columns:1fr 260px;gap:64px;align-items:start}
  .lr-main{max-width:640px}
  .lr-arch{width:100%;max-width:560px;height:360px;margin-bottom:40px}
  .lr-hello{font-family:var(--display);font-weight:300;font-size:20px;letter-spacing:.04em;color:hsl(56 8% 46%)}
  .lr-sig{font-size:82px;margin:6px 0 0;font-weight:500}
  .lr-date{margin-top:20px;font-size:13px;letter-spacing:.04em;color:hsl(56 8% 52%)}
  /* the picture-rail ledge: one thin shelf, three small things resting on it */
  .lr-ledge{margin-top:52px;position:relative;padding-top:26px}
  .lr-ledge::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,hsl(34 26% 80%),transparent);box-shadow:0 2px 6px -2px hsl(34 30% 60%/.5)}
  .lr-row{display:flex;gap:44px;flex-wrap:wrap}
  .lr-item .t{font-family:var(--display);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:hsl(56 8% 56%);margin-bottom:8px}
  .lr-item .v{font-size:15px;line-height:1.6}.lr-item .v b{font-weight:600}
  .lr-item .v span{color:hsl(56 8% 52%)}
  .lr-orch{display:flex;align-items:center;gap:12px}
  .lr-do{margin-top:46px}
  .lr-btn{font-family:var(--display);font-weight:500;font-size:16px;letter-spacing:.02em;color:hsl(74 30% 26%);
     border:1.5px solid hsl(74 24% 46%/.6);padding:12px 26px;border-radius:2px;display:inline-flex;gap:10px;align-items:center}
  .lr-comp{margin-top:34px;font-family:var(--sig);font-size:24px;color:hsl(74 22% 34%);max-width:420px;line-height:1.3}
  .lr-comp .k{display:block;font-family:var(--display);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:hsl(56 8% 60%);margin-bottom:6px}
  /* navigation: labels pressed INTO the plaster, a calm vertical column */
  .lr-nav{position:sticky;top:56px;display:flex;flex-direction:column;gap:30px;padding-top:8px}
  .lr-nav .n{font-family:var(--display);font-size:17px;letter-spacing:.16em;text-transform:uppercase}
  .lr-nav .n small{display:block;font-size:10px;letter-spacing:.14em;margin-top:5px;color:hsl(35 18% 76%)}
  .lr-mark{margin-top:auto;width:30px;height:30px;background:hsl(35 20% 78%);opacity:.7}
  @media(max-width:640px){
    .lr{grid-template-columns:1fr;padding:36px 26px 70px;gap:34px}
    .lr-arch{height:230px}.lr-sig{font-size:58px}.lr-row{gap:26px}
    .lr-nav{position:static;flex-direction:row;flex-wrap:wrap;gap:18px 26px;border-top:1px solid hsl(34 22% 86%);padding-top:26px}
  }`,
  body: `
  <div class="lr">
    <div class="lr-main">
      <div class="lr-arch">${arch()}</div>
      <div class="lr-hello">Welcome home,</div>
      <div class="lr-sig sig">${D.name}</div>
      <div class="lr-date">${D.date}</div>
      <div class="lr-ledge">
        <div class="lr-row">
          <div class="lr-item"><div class="t">Today</div><div class="v">${D.meals.map(m => `<div><b>${m.name}</b> <span>${m.type.toLowerCase()}</span></div>`).join("")}</div></div>
          <div class="lr-item"><div class="t">To fetch</div><div class="v">${D.shopping.slice(0, 3).map(s => `<div>${s}</div>`).join("")}<div style="color:hsl(56 8% 52%)">+2 more</div></div></div>
          <div class="lr-item"><div class="t">Orchard</div><div class="v lr-orch">${ring(52)}<div><b style="font-size:20px">${D.plants}</b><span> / ${D.plantTarget}</span></div></div></div>
        </div>
      </div>
      <div class="lr-do"><a class="lr-btn">${D.primary} →</a></div>
      <div class="lr-comp"><span class="k">Companion</span>${D.companion}</div>
    </div>
    <nav class="lr-nav">
      ${D.rooms.map(r => `<div class="n emboss">${r.label}</div>`).join("")}
      <div class="lr-mark apple" title="THA"></div>
    </nav>
  </div>`,
});

// 4 ── THE GARDEN ROOM — the contemporary orchard house. The orchard becomes the
// ENTIRE upper architecture: a full-width run of three tall arched lights (an
// orangery), the trees pouring in. Beneath it a single low honed-stone plinth floats
// as the working surface; navigation is the slim oak mullions between the arches.
HOMES.push({
  id: "4-garden-room",
  name: "The Garden Room",
  css: `
  .gr{min-height:100%;display:flex;flex-direction:column;background:hsl(38 40% 95%)}
  /* the glazed orchard wall — the whole top of the house */
  .gr-glass{position:relative;height:440px;display:grid;grid-template-columns:1fr 12px 1fr 12px 1fr;padding:0}
  .gr-light{position:relative;overflow:hidden;border-radius:50% 50% 0 0/26% 26% 0 0;margin-top:26px}
  .gr-light img{position:absolute;inset:0;width:100%;height:130%;object-fit:cover;object-position:50% 40%}
  .gr-light::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,hsl(46 80% 92%/.28),transparent 30%,hsl(40 40% 30%/.12))}
  /* the mullions between the lights = navigation */
  .gr-mull{position:relative;margin-top:26px;border-radius:4px 4px 0 0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:26px}
  .gr-mull span{writing-mode:vertical-rl;transform:rotate(180deg);font-family:var(--display);font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:hsl(41 44% 26%);text-shadow:0 1px 0 hsl(44 55% 80%/.5)}
  .gr-greet{text-align:center;margin-bottom:22px}
  .gr-hello{font-family:var(--display);font-weight:300;letter-spacing:.02em;font-size:17px;color:hsl(30 12% 40%)}
  .gr-sig{font-size:58px;color:hsl(74 34% 26%);margin-top:2px}
  /* the honed-stone plinth floating below the glass */
  .gr-plinth{position:relative;margin:-22px auto 0;width:min(1180px,94vw);border-radius:8px;
     background:linear-gradient(180deg,hsl(30 10% 88%),hsl(30 8% 80%));
     box-shadow:0 40px 70px -40px hsl(30 20% 30%/.6),inset 0 1px 0 hsl(0 0% 100%/.6);padding:30px 40px;z-index:3}
  .gr-row{display:grid;grid-template-columns:1.3fr 1fr 1fr auto;gap:26px;align-items:center}
  .gr-cell h4{font-family:var(--display);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:hsl(30 10% 46%);margin-bottom:9px}
  .gr-cell .m{display:flex;justify-content:space-between;gap:10px;font-size:14px;padding:4px 0}
  .gr-cell .m span{color:hsl(30 8% 48%);font-size:12px}
  .gr-cell ul{list-style:none;font-size:13px}.gr-cell ul li{padding:2px 0}
  .gr-orch{display:flex;align-items:center;gap:12px}
  .gr-btn{white-space:nowrap;display:inline-flex;align-items:center;gap:10px;padding:15px 28px;border-radius:6px;font-family:var(--display);font-weight:600;color:hsl(40 50% 96%);
     background:linear-gradient(180deg,hsl(74 28% 32%),hsl(74 32% 24%));box-shadow:0 14px 24px -12px hsl(74 40% 16%/.8)}
  .gr-comp{width:min(1180px,94vw);margin:18px auto 60px;background:hsl(30 12% 92%);border-radius:6px;padding:14px 20px;display:flex;gap:14px;align-items:center;box-shadow:0 16px 30px -22px hsl(30 20% 30%/.5)}
  .gr-comp .k{font-family:var(--display);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:hsl(var(--leaf-soft))}
  .gr-comp p{font-family:var(--sig);font-size:23px;line-height:1.2}
  @media(max-width:640px){
    .gr-glass{height:300px;grid-template-columns:1fr 8px 1fr}
    .gr-glass .gr-light:nth-child(5),.gr-glass .gr-mull:nth-child(4){display:none}
    .gr-sig{font-size:48px}.gr-row{grid-template-columns:1fr;gap:16px}
    .gr-mull span{font-size:10px}
  }`,
  body: `
  <div class="gr">
    <div class="gr-glass">
      <div class="gr-light"><img src="${ORCHARD}" alt="orchard"></div>
      <div class="gr-mull oak"><span>${D.rooms[0].label}</span></div>
      <div class="gr-light"><img src="${ORCHARD}" alt="orchard" style="object-position:50% 46%"></div>
      <div class="gr-mull oak"><span>${D.rooms[1].label}</span></div>
      <div class="gr-light"><img src="${ORCHARD}" alt="orchard" style="object-position:52% 42%"></div>
    </div>
    <div class="gr-plinth">
      <div class="gr-greet"><div class="gr-hello">Welcome home,</div><div class="gr-sig sig">${D.name}</div></div>
      <div class="gr-row">
        <div class="gr-cell"><h4>Today's meals</h4>${D.meals.map(m => `<div class="m"><b>${m.name}</b><span>${m.type}</span></div>`).join("")}</div>
        <div class="gr-cell"><h4>Shopping · 5 to buy</h4><ul>${D.shopping.map(s => `<li>· ${s}</li>`).join("")}</ul></div>
        <div class="gr-cell"><h4>From the orchard</h4><div class="gr-orch">${ring(58)}<div><b style="font-size:22px">${D.plants}</b> / ${D.plantTarget}<div style="font-size:12px;color:hsl(30 8% 48%)">plants this week</div></div></div></div>
        <a class="gr-btn">${D.primary} →</a>
      </div>
    </div>
    <div class="gr-comp"><span class="k">Companion</span><p>${D.companion}</p></div>
  </div>`,
});

// 5 ── THE ARCHITECT'S HOUSE — the architect's own home. Confident, modern, a little
// austere. A double-height plaster volume; a single monolithic oak-and-stone island
// stands in the centre (furniture built into the house); one dramatic shaft of light
// from the arch; the day and the navigation are ENGRAVED into the stone lintel and the
// island's edge; the Companion lives in a niche cut into the wall.
HOMES.push({
  id: "5-architects-house",
  name: "The Architect's House",
  css: `
  .ah{min-height:100%;position:relative;overflow:hidden;background:
     linear-gradient(180deg,hsl(36 30% 92%),hsl(34 22% 88%))}
  /* one shaft of light from the arch */
  .ah::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:56%;height:100%;pointer-events:none;
     background:radial-gradient(60% 44% at 50% 0%, hsl(46 80% 96%/.85), transparent 62%)}
  .ah-wrap{position:relative;max-width:1200px;margin:0 auto;padding:0 46px 70px}
  .ah-arch{width:min(520px,60%);height:430px;margin:0 auto}
  .ah-arch .orchard-arch{border-radius:50% 50% 0 0/80% 80% 0 0}
  /* stone lintel across the top of the island, with the greeting + nav engraved */
  .ah-greet{text-align:center;margin-top:30px}
  .ah-hello{font-family:var(--display);font-weight:300;letter-spacing:.34em;text-transform:uppercase;font-size:13px;color:hsl(56 8% 44%)}
  .ah-sig{font-family:var(--display);font-weight:300;font-size:60px;letter-spacing:-.02em;color:hsl(56 14% 22%);margin-top:8px}
  .ah-island{position:relative;margin:40px auto 0;width:min(940px,96%);border-radius:3px;
     background:linear-gradient(180deg,hsl(30 10% 84%),hsl(30 8% 74%));
     box-shadow:0 50px 80px -44px hsl(30 24% 24%/.7),inset 0 1px 0 hsl(0 0% 100%/.5);padding:0}
  .ah-lintel{position:relative;padding:20px 34px;border-bottom:1px solid hsl(30 12% 66%/.6);display:flex;justify-content:center;gap:0}
  .ah-nav{font-family:var(--display);font-size:14px;letter-spacing:.26em;text-transform:uppercase;padding:6px 26px;
     color:hsl(30 14% 34%);text-shadow:0 1px 0 hsl(0 0% 100%/.6),0 -1px 0 hsl(30 14% 40%/.4)}
  .ah-nav+.ah-nav{border-left:1px solid hsl(30 12% 66%/.6)}
  .ah-body{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:0}
  .ah-col{padding:26px 30px}
  .ah-col+.ah-col{border-left:1px solid hsl(30 12% 66%/.5)}
  .ah-col h4{font-family:var(--display);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:hsl(30 10% 46%);margin-bottom:14px}
  .ah-col .m{font-size:15px;padding:6px 0;border-bottom:1px solid hsl(30 10% 78%/.6)}
  .ah-col .m:last-child{border:0}.ah-col .m span{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:hsl(30 8% 50%);margin-top:2px}
  .ah-col ul{list-style:none;font-size:14px}.ah-col ul li{padding:4px 0}
  .ah-orch{display:flex;align-items:center;gap:14px}
  .ah-do{display:flex;justify-content:center;padding:0 0 30px}
  .ah-btn{display:inline-flex;align-items:center;gap:12px;padding:16px 40px;border-radius:2px;font-family:var(--display);font-weight:600;letter-spacing:.04em;color:hsl(40 50% 96%);
     background:hsl(56 16% 20%);box-shadow:0 16px 30px -16px hsl(56 30% 10%/.8)}
  /* the Companion niche cut into the wall */
  .ah-niche{position:absolute;right:46px;top:120px;width:250px;padding:20px 22px;border-radius:2px;
     background:linear-gradient(180deg,hsl(34 24% 86%),hsl(34 20% 82%));
     box-shadow:inset 0 6px 16px hsl(30 20% 40%/.4),inset 0 -1px 0 hsl(0 0% 100%/.4)}
  .ah-niche .k{font-family:var(--display);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:hsl(var(--leaf-soft))}
  .ah-niche p{font-family:var(--sig);font-size:23px;line-height:1.25;margin-top:8px;color:hsl(56 14% 24%)}
  @media(max-width:640px){
    .ah-wrap{padding:0 18px 60px}.ah-arch{width:82%;height:250px}.ah-sig{font-size:42px}
    .ah-niche{position:static;width:auto;margin:22px 0 0}
    .ah-lintel{flex-wrap:wrap;gap:2px}.ah-nav{padding:6px 14px;font-size:12px}.ah-nav+.ah-nav{border-left:0}
    .ah-body{grid-template-columns:1fr}.ah-col+.ah-col{border-left:0;border-top:1px solid hsl(30 12% 66%/.5)}
  }`,
  body: `
  <div class="ah">
    <div class="ah-wrap">
      <div class="ah-arch">${arch("50% 50% 0 0/80% 80% 0 0")}</div>
      <div class="ah-greet"><div class="ah-hello">Welcome home</div><div class="ah-sig">${D.name}</div></div>
      <div class="ah-island">
        <div class="ah-lintel">${D.rooms.map(r => `<div class="ah-nav">${r.label}</div>`).join("")}</div>
        <div class="ah-body">
          <div class="ah-col"><h4>Today</h4>${D.meals.map(m => `<div class="m">${m.name}<span>${m.type}</span></div>`).join("")}</div>
          <div class="ah-col"><h4>Shopping</h4><ul>${D.shopping.map(s => `<li>${s}</li>`).join("")}</ul></div>
          <div class="ah-col"><h4>Orchard</h4><div class="ah-orch">${ring(60)}<div><b style="font-size:24px">${D.plants}</b> / ${D.plantTarget}<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:hsl(30 8% 50%);margin-top:2px">plants</div></div></div></div>
        </div>
        <div class="ah-do"><a class="ah-btn">${D.primary} →</a></div>
      </div>
      <div class="ah-niche"><div class="k">Companion</div><p>${D.companion}</p></div>
    </div>
  </div>`,
});

// 6 ── THE HEARTH — the home around a warm heart. The arch is a glowing hearth with a
// dawn orchard beyond; everything gathers around it. A heavy oak mantel beam runs
// beneath the arch and CARRIES the navigation, carved into the beam; the day rests on
// the mantel; a handwritten note is propped against the arch (the smile); warmest of all.
HOMES.push({
  id: "6-hearth",
  name: "The Hearth",
  css: `
  .he{min-height:100%;padding:44px 0 64px;display:flex;flex-direction:column;align-items:center;background:
     radial-gradient(80% 60% at 50% 8%, hsl(38 66% 92%), hsl(34 40% 88%) 55%, hsl(30 30% 84%))}
  .he-hearth{position:relative;width:min(560px,88vw);height:330px}
  .he-hearth .orchard-arch{border-radius:48% 48% 0 0/64% 64% 0 0;box-shadow:inset 0 0 0 10px hsl(41 34% 52%/.5),inset 0 0 60px hsl(40 60% 60%/.4),0 30px 70px -30px hsl(40 60% 40%/.5)}
  /* the warm glow spilling from the hearth */
  .he-glow{position:absolute;left:50%;top:-10%;transform:translateX(-50%);width:150%;height:150%;pointer-events:none;z-index:-1;
     background:radial-gradient(46% 40% at 50% 34%, hsl(42 88% 78%/.7), transparent 66%)}
  .he-note{position:absolute;right:-6px;bottom:24px;width:200px;background:hsl(var(--ivory));padding:14px 16px;border-radius:3px;
     transform:rotate(3deg);box-shadow:0 16px 26px -14px hsl(40 40% 24%/.7)}
  .he-note p{font-family:var(--sig);font-size:20px;line-height:1.25;color:hsl(56 16% 24%)}
  .he-greet{text-align:center;margin-top:26px}
  .he-hello{font-family:var(--display);font-size:18px;color:hsl(38 30% 42%)}
  .he-sig{font-size:74px;margin-top:2px}
  /* the mantel beam — heavy oak, carrying carved navigation */
  .he-mantel{position:relative;width:min(880px,94vw);margin:30px auto 0;border-radius:6px;height:80px;
     display:flex;align-items:center;justify-content:space-around;
     box-shadow:0 22px 40px -22px hsl(41 40% 20%/.8),inset 0 2px 0 hsl(44 55% 78%/.4),inset 0 -6px 12px hsl(41 40% 18%/.4)}
  .he-room{font-family:var(--display);font-size:15px;letter-spacing:.16em;text-transform:uppercase}
  .he-shelf{width:min(880px,94vw);margin:26px auto 0;display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:22px}
  .he-obj{background:hsl(var(--ivory));border-radius:4px;padding:16px 18px;box-shadow:0 14px 22px -14px hsl(40 40% 24%/.6),inset 0 1px 0 hsl(0 0% 100%/.6)}
  .he-obj h4{font-family:var(--display);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:hsl(var(--leaf-soft));margin-bottom:11px}
  .he-obj .m{display:flex;justify-content:space-between;gap:10px;font-size:14px;padding:5px 0;border-bottom:1px solid hsl(38 26% 90%)}
  .he-obj .m:last-child{border:0}.he-obj .m span{color:hsl(var(--muted));font-size:12px}
  .he-obj ul{list-style:none;font-size:13px}.he-obj ul li{padding:3px 0}
  .he-orch{display:flex;align-items:center;gap:12px}
  .he-do{margin-top:30px}
  .he-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 34px;border-radius:999px;font-family:var(--display);font-weight:600;font-size:16px;color:hsl(40 52% 96%);
     background:linear-gradient(180deg,hsl(24 46% 46%),hsl(20 48% 38%));box-shadow:0 16px 26px -14px hsl(22 50% 28%/.8)}
  @media(max-width:640px){
    .he-hearth{height:240px}.he-sig{font-size:52px}.he-note{width:150px;right:2px}
    .he-mantel{flex-wrap:wrap;height:auto;padding:10px;gap:6px 0}.he-room{padding:6px 10px;font-size:12px}
    .he-shelf{grid-template-columns:1fr;gap:14px}
  }`,
  body: `
  <div class="he">
    <div class="he-hearth"><div class="he-glow"></div>${arch("48% 48% 0 0/64% 64% 0 0")}
      <div class="he-note"><p>The kettle's on — today's already planned, and the greens are at their best.</p></div>
    </div>
    <div class="he-greet"><div class="he-hello">Come in — welcome home,</div><div class="he-sig sig">${D.name}</div></div>
    <div class="he-mantel oak">${D.rooms.map(r => `<div class="he-room engrave">${r.label}</div>`).join("")}</div>
    <div class="he-shelf">
      <div class="he-obj"><h4>Today's meals</h4>${D.meals.map(m => `<div class="m"><b>${m.name}</b><span>${m.type}</span></div>`).join("")}</div>
      <div class="he-obj"><h4>Shopping</h4><ul>${D.shopping.map(s => `<li>· ${s}</li>`).join("")}</ul></div>
      <div class="he-obj"><h4>From the orchard</h4><div class="he-orch">${ring(58)}<div><b style="font-size:22px">${D.plants}</b> / ${D.plantTarget}<div style="font-size:12px;color:hsl(var(--muted))">plants</div></div></div></div>
    </div>
    <div class="he-do"><a class="he-btn">${D.primary} →</a></div>
  </div>`,
});

// 7 ── THE ENTRANCE HALL — arrival as ceremony. You come through the front door into
// a hall; the orchard arch is the view at the FAR end drawing you in (perspective).
// A slim hall console holds the day where post and keys land; navigation is a row of
// panelled doors off the hall; the Companion is a note tucked in the mirror frame.
HOMES.push({
  id: "7-entrance-hall",
  name: "The Entrance Hall",
  css: `
  .en{min-height:100%;position:relative;background:linear-gradient(180deg,hsl(36 40% 93%),hsl(34 28% 86%));overflow:hidden}
  /* the hall runner floor in perspective */
  .en-floor{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:70%;height:62%;
     background:linear-gradient(180deg,hsl(33 24% 82%),hsl(32 20% 76%));clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);opacity:.8}
  .en-wrap{position:relative;max-width:1120px;margin:0 auto;padding:44px 40px 64px;text-align:center}
  /* the arch at the end of the hall */
  .en-arch{width:min(360px,52%);height:400px;margin:0 auto}
  .en-arch .orchard-arch{border-radius:50% 50% 0 0/78% 78% 0 0;box-shadow:inset 0 0 0 14px hsl(36 30% 88%),inset 0 0 0 16px hsl(34 24% 80%/.7),0 30px 60px -30px hsl(34 30% 40%/.5)}
  .en-hello{margin-top:26px;font-family:var(--display);font-size:17px;color:hsl(38 22% 40%);letter-spacing:.02em}
  .en-sig{font-size:66px;margin-top:2px}
  .en-date{margin-top:8px;font-size:13px;color:hsl(var(--muted))}
  /* the hall console table — a slim ledge where the day lands */
  .en-console{position:relative;width:min(760px,92vw);margin:28px auto 0;border-radius:6px 6px 3px 3px;padding:18px 26px;
     box-shadow:0 30px 46px -28px hsl(41 40% 20%/.7)}
  .en-things{display:grid;grid-template-columns:1.3fr 1fr auto;gap:24px;align-items:center;text-align:left}
  .en-things h4{font-family:var(--display);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:hsl(44 42% 82%/.9);margin-bottom:8px}
  .en-things .m{font-size:14px;color:hsl(44 50% 92%);padding:3px 0}.en-things .m span{color:hsl(44 34% 78%/.9);font-size:12px}
  .en-things ul{list-style:none;font-size:13px;color:hsl(44 50% 92%)}.en-things ul li{padding:2px 0}
  .en-orch{display:flex;align-items:center;gap:12px;color:hsl(44 50% 92%)}
  /* the row of doors off the hall = navigation */
  .en-doors{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;width:min(760px,92vw);margin:26px auto 0}
  .en-door{position:relative;height:130px;border-radius:6px 6px 3px 3px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:16px;gap:8px;
     box-shadow:inset 0 0 0 2px hsl(44 42% 30%/.4),inset 6px 6px 14px hsl(41 40% 18%/.35),inset -4px -4px 10px hsl(44 55% 78%/.3),0 10px 18px -12px hsl(41 40% 16%/.6)}
  .en-door::before{content:"";position:absolute;inset:10px;border-radius:4px 4px 2px 2px;box-shadow:inset 0 0 0 1.5px hsl(44 42% 30%/.35)}
  .en-knob{position:absolute;top:54%;right:14px;width:9px;height:9px;border-radius:50%}
  .en-door .nm{font-family:var(--display);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:hsl(41 44% 24%);text-shadow:0 1px 0 hsl(44 55% 80%/.5)}
  .en-do{margin-top:26px}
  .en-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 34px;border-radius:999px;font-family:var(--display);font-weight:600;font-size:16px;color:hsl(40 52% 96%);
     background:linear-gradient(180deg,hsl(74 26% 34%),hsl(74 30% 25%));box-shadow:0 14px 24px -12px hsl(74 40% 16%/.8)}
  .en-comp{width:min(760px,92vw);margin:22px auto 0;background:hsl(var(--ivory));border-radius:4px;padding:13px 18px;text-align:left;box-shadow:0 14px 24px -16px hsl(41 40% 18%/.6)}
  .en-comp .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:hsl(var(--leaf-soft))}
  .en-comp p{font-family:var(--sig);font-size:22px;line-height:1.2;margin-top:3px}
  @media(max-width:640px){
    .en-arch{width:74%;height:250px}.en-sig{font-size:48px}
    .en-things{grid-template-columns:1fr;gap:14px}
    .en-doors{grid-template-columns:repeat(2,1fr);gap:12px}.en-door{height:104px}
  }`,
  body: `
  <div class="en">
    <div class="en-floor"></div>
    <div class="en-wrap">
      <div class="en-arch">${arch("50% 50% 0 0/78% 78% 0 0")}</div>
      <div class="en-hello">Welcome home,</div>
      <div class="en-sig sig">${D.name}</div>
      <div class="en-date">${D.date}</div>
      <div class="en-console oak">
        <div class="en-things">
          <div><h4>Today's meals</h4>${D.meals.map(m => `<div class="m">${m.name} <span>· ${m.type}</span></div>`).join("")}</div>
          <div><h4>Shopping · 5</h4><ul>${D.shopping.slice(0, 4).map(s => `<li>${s}</li>`).join("")}<li style="opacity:.7">and 1 more</li></ul></div>
          <div><h4 style="text-align:center">Orchard</h4><div class="en-orch">${ring(54)}<b style="font-size:20px">${D.plants}</b><span style="opacity:.8">/${D.plantTarget}</span></div></div>
        </div>
      </div>
      <div class="en-doors">
        ${D.rooms.map(r => `<div class="en-door oak"><div class="en-knob brass"></div><div class="nm">${r.label}</div></div>`).join("")}
      </div>
      <div class="en-comp"><div class="k">Companion</div><p>${D.companion}</p></div>
      <div class="en-do"><a class="en-btn">${D.primary} →</a></div>
    </div>
  </div>`,
});

// 8 ── THE MORNING ROOM (Claude's own) — the home reduced to its most human moment:
// a single deep oak windowsill seat beneath a great arched window onto the orchard.
// The orchard IS the upper architecture (the great window); the arch grows from the
// sill. The day is laid on the sunny sill like things you'd set down with your coffee;
// navigation is a slim engraved BRASS plate-rail beneath the sill (architectural
// object, not buttons); the Companion is the warmth of the light itself, with one
// true line resting on the sill. Intimate, luminous, unmistakably a place to sit.
HOMES.push({
  id: "8-morning-room",
  name: "The Morning Room",
  css: `
  .mo{min-height:100%;display:flex;justify-content:center;background:
     radial-gradient(120% 70% at 50% -4%, hsl(42 70% 97%), hsl(38 44% 94%) 52%, hsl(35 34% 91%))}
  .mo-room{width:min(1080px,96vw);padding:40px 0 66px;display:flex;flex-direction:column;align-items:center}
  /* the great arched window — the orchard as the upper architecture */
  .mo-window{position:relative;width:min(720px,92vw);height:420px}
  .mo-window .orchard-arch{border-radius:50% 50% 0 0/44% 44% 0 0;
     box-shadow:inset 0 0 0 12px hsl(38 44% 92%),inset 0 0 0 14px hsl(35 28% 82%/.8),0 34px 70px -34px hsl(38 40% 40%/.5)}
  /* glazing bars — a modern-traditional arched window */
  .mo-bars{position:absolute;inset:14px;border-radius:46% 46% 0 0/42% 42% 0 0;pointer-events:none}
  .mo-bars::before,.mo-bars::after{content:"";position:absolute;background:hsl(38 40% 90%/.9);box-shadow:0 0 4px hsl(38 30% 60%/.5)}
  .mo-bars::before{left:50%;top:6%;bottom:0;width:6px;transform:translateX(-50%)}
  .mo-bars::after{left:8%;right:8%;top:52%;height:6px}
  /* warm light pooling on the sill */
  .mo-pool{position:absolute;left:-6%;right:-6%;bottom:-30px;height:120px;pointer-events:none;
     background:radial-gradient(60% 100% at 50% 0%, hsl(44 88% 82%/.6), transparent 70%)}
  /* the deep oak windowsill seat */
  .mo-sill{position:relative;width:min(760px,94vw);margin:-6px auto 0;border-radius:10px 10px 8px 8px;
     padding:26px 34px 30px;box-shadow:0 40px 60px -34px hsl(41 40% 20%/.65),inset 0 2px 0 hsl(44 58% 80%/.5)}
  .mo-greet{text-align:center;margin-bottom:22px}
  .mo-hello{font-family:var(--display);font-size:17px;color:hsl(44 46% 86%)}
  .mo-sig{font-size:62px;margin-top:2px;color:hsl(44 62% 90%)}
  /* the day, set on the sill like things by your coffee */
  .mo-things{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:20px}
  .mo-obj{background:hsl(var(--ivory));border-radius:5px;padding:15px 17px;box-shadow:0 12px 20px -12px hsl(41 40% 16%/.75),inset 0 1px 0 hsl(0 0% 100%/.7)}
  .mo-obj:nth-child(1){transform:rotate(-.6deg)}.mo-obj:nth-child(3){transform:rotate(.6deg)}
  .mo-obj h4{font-family:var(--display);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:hsl(var(--leaf-soft));margin-bottom:10px}
  .mo-obj .m{display:flex;justify-content:space-between;gap:8px;font-size:14px;padding:4px 0;border-bottom:1px solid hsl(38 26% 90%)}
  .mo-obj .m:last-child{border:0}.mo-obj .m span{color:hsl(var(--muted));font-size:12px}
  .mo-obj ul{list-style:none;font-size:13px}.mo-obj ul li{padding:3px 0}
  .mo-orch{display:flex;align-items:center;gap:11px}
  /* the Companion as the light — one true line resting on the sill in THA's hand */
  .mo-line{margin-top:20px;text-align:center;font-family:var(--sig);font-size:26px;line-height:1.3;color:hsl(74 24% 30%);max-width:560px;margin-left:auto;margin-right:auto}
  /* navigation: a slim engraved brass plate-rail beneath the sill */
  .mo-rail{position:relative;width:min(760px,94vw);margin:0 auto;height:44px;border-radius:0 0 8px 8px;display:flex;align-items:center;justify-content:space-around;
     background:linear-gradient(180deg,hsl(var(--brass-lit)),hsl(var(--brass)) 55%,hsl(var(--brass-deep)));
     box-shadow:inset 0 1px 0 hsl(46 72% 88%/.7),inset 0 -2px 3px hsl(38 46% 30%/.5),0 14px 24px -14px hsl(38 44% 24%/.7)}
  .mo-rail .r{font-family:var(--display);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:hsl(38 44% 22%);text-shadow:0 1px 0 hsl(46 72% 84%/.6)}
  .mo-rail .r+.r{border-left:1px solid hsl(38 46% 34%/.4)}
  .mo-rail .r{padding:6px 18px}
  .mo-do{margin-top:30px}
  .mo-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 34px;border-radius:999px;font-family:var(--display);font-weight:600;font-size:16px;color:hsl(40 52% 96%);
     background:linear-gradient(180deg,hsl(74 27% 33%),hsl(74 31% 25%));box-shadow:0 16px 26px -14px hsl(74 40% 16%/.8)}
  @media(max-width:640px){
    .mo-window{height:260px}.mo-sig{font-size:44px}
    .mo-sill{padding:18px 16px 22px}.mo-things{grid-template-columns:1fr;gap:12px}
    .mo-obj:nth-child(n){transform:none}
    .mo-rail{flex-wrap:wrap;height:auto;padding:4px 0}.mo-rail .r{padding:8px 12px}.mo-rail .r+.r{border-left:0}
    .mo-line{font-size:22px}
  }`,
  body: `
  <div class="mo">
    <div class="mo-room">
      <div class="mo-window">
        ${arch("50% 50% 0 0/44% 44% 0 0")}
        <div class="mo-bars"></div>
        <div class="mo-pool"></div>
      </div>
      <div class="mo-sill oak">
        <div class="mo-greet"><div class="mo-hello">Good morning,</div><div class="mo-sig sig">${D.name}</div></div>
        <div class="mo-things">
          <div class="mo-obj"><h4>Today's meals</h4>${D.meals.map(m => `<div class="m"><b>${m.name}</b><span>${m.type}</span></div>`).join("")}</div>
          <div class="mo-obj"><h4>Shopping · 5</h4><ul>${D.shopping.map(s => `<li>· ${s}</li>`).join("")}</ul></div>
          <div class="mo-obj"><h4>From the orchard</h4><div class="mo-orch">${ring(56)}<div><b style="font-size:22px">${D.plants}</b> / ${D.plantTarget}<div style="font-size:12px;color:hsl(var(--muted))">plants</div></div></div></div>
        </div>
        <div class="mo-line">The greens are at their best this morning — worth a plan for the weekend.</div>
      </div>
      <div class="mo-rail">${D.rooms.map(r => `<div class="r">${r.label}</div>`).join("")}</div>
      <div class="mo-do"><a class="mo-btn">${D.primary} →</a></div>
    </div>
  </div>`,
});

// ── Render ────────────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { key: "desktop", width: 1440, height: 1024 },
  { key: "mobile", width: 430, height: 932 },
] as const;

function docHtml(h: Home): string {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=Inter:wght@300..700&family=Caveat:wght@500;600&display=swap" rel="stylesheet">
  <style>${BASE}${h.css}</style></head><body>${h.body}</body></html>`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  for (const h of HOMES) {
    if (only && !only.some((o) => h.id.startsWith(o) || h.id.includes(o))) continue;
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.setContent(docHtml(h), { waitUntil: "networkidle" });
      await page.evaluate(() => (document as any).fonts.ready);
      await page.waitForTimeout(1400);
      await page.screenshot({ path: path.join(OUT, `${h.id}-${vp.key}.png`), fullPage: true });
      await ctx.close();
      console.log("captured", h.id, vp.key);
    }
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
