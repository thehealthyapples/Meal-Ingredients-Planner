/**
 * HOUSE_VISUAL_DESIGN — render the five new rooms of The Healthy Apples House at
 * desktop · tablet · mobile, in both honest states (filled · empty).
 *
 * Every render is checked MECHANICALLY against the rules HOUSE_COMPLETE §12.3.4
 * prescribed, so the design is JUDGED RATHER THAN ASSERTED — the standard the three
 * locked rooms each shipped to, and the gap this session exists to close:
 *
 *   HOUSE-WIDE  (every room, every breakpoint, both states)
 *     · one Companion, 48px, in the same corner            (Blueprint §13)
 *     · the pressed apple present and tone-on-tone          (BRAND2 §6)
 *     · the constant door-run present (desktop/tablet)      (Blueprint §14)
 *     · nothing the household reads crosses onto the glass  (Blueprint §6.1)
 *     · no room is darker than the Pantry's floor           (Article IV — "quieter
 *       is never darker"; E1 is broader, never dimmer)
 *
 *   PER ROOM
 *     · Family Table  — no day carries a border or a chip; the week is ONE plane
 *                       with all 7 days present at every breakpoint  (T1, T2, T3)
 *     · Garden Room   — the noticeboard renders ABOVE the data tier   (G3)
 *     · Tasting Bench — exactly ONE object on the bench; no finding reads as a
 *                       dominant-red verdict                          (B1, B2)
 *     · Family Journal— the most air in the house, and MORE on mobile (J4, J5)
 *     · Mirror        — the strata order is identical at all three
 *                       breakpoints, and the people never shrink      (M1, M7)
 *
 *   LD_LIBRARY_PATH=<curated-chromium-libs> npx tsx scripts/north4-concepts/render-house-rooms.ts
 *
 * Design/exploration only — nothing here is imported by the app.
 */
import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const OUT = resolve("docs/ui-audit/house-visual-design");

const ROOMS = [
  { id: "family-table", file: "room-family-table.html", name: "Family Table" },
  { id: "garden-room", file: "room-garden-room.html", name: "Garden Room" },
  { id: "tasting-bench", file: "room-tasting-bench.html", name: "Tasting Bench" },
  { id: "family-journal", file: "room-family-journal.html", name: "Family Journal" },
  { id: "mirror", file: "room-mirror.html", name: "Mirror" },
] as const;

const STATES = ["filled", "empty"] as const;
const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 960 },
  { id: "tablet", width: 834, height: 1112 },
  { id: "mobile", width: 390, height: 844 },
];

/** The house-wide checks every room must pass, in every state, at every size. */
async function houseChecks(page: Page, viewport: string) {
  return page.evaluate((vp) => {
    const p: string[] = [];
    const rect = (s: string) => {
      const el = document.querySelector(s) as HTMLElement | null;
      return el ? el.getBoundingClientRect() : null;
    };

    // ONE Companion, 48px, same corner in every room (Blueprint §13)
    const comps = document.querySelectorAll(".companion");
    if (comps.length !== 1) p.push(`${comps.length} Companion marks (must be exactly 1)`);
    const c = rect(".companion");
    if (!c) p.push("no Companion");
    else {
      if (Math.round(c.width) !== 48 || Math.round(c.height) !== 48) p.push(`Companion is ${Math.round(c.width)}px (must be 48)`);
      if (c.right > window.innerWidth - 12 || c.bottom > window.innerHeight - 12) p.push("Companion has left its corner");
    }

    // the pressed apple: present on desktop/tablet, and TONE-ON-TONE (no pigment)
    const wa = document.querySelector(".wall-apple .wa-face") as HTMLElement | null;
    // The mark is a DESKTOP wall detail across the whole house: both locked rooms
    // that carry it hide it below their breakpoint (Kitchen ≤900, Pantry ≤980 —
    // different numbers for one mark, which `_house.css` resolves to one owner),
    // and at tablet 834 both are hidden. So it is required on desktop only.
    if (vp === "desktop") {
      if (!wa) p.push("no pressed apple");
      else {
        // it must actually be ON THE WALL, not merely in the document: the mark is
        // "discovered rather than displayed", which still requires it to be there.
        const ab = wa.getBoundingClientRect();
        if (ab.width < 1 || ab.height < 1) p.push("the pressed apple has no size");
        else if (ab.bottom < 0 || ab.top > document.body.scrollHeight) p.push("the pressed apple is off the wall");
        // Parse the rgb()/rgba() COLOUR STOPS ONLY. Matching bare digits also
        // swallows a gradient's stop POSITIONS ("… 50%"), which shifts the
        // triples out of phase and reports pigment in a tone-on-tone wall.
        const bg = getComputedStyle(wa).backgroundImage;
        for (const m of Array.from(bg.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g))) {
          const [r, g, b] = [+m[1], +m[2], +m[3]];
          if (Math.max(r, g, b) - Math.min(r, g, b) > 60) {
            p.push("pressed apple carries pigment (must be tone-on-tone)");
            break;
          }
        }
      }
    }

    // the constant door-run (collapses to the Companion on mobile, by design)
    const doors = document.querySelectorAll(".doors .door").length;
    if (vp !== "mobile" && doors !== 4) p.push(`${doors} doors (the shell must carry 4)`);
    const here = document.querySelectorAll(".door.here").length;
    if (vp !== "mobile" && here !== 1) p.push(`${here} doors read as "here" (must be exactly 1)`);

    // NOTHING THE HOUSEHOLD READS CROSSES ONTO THE GLASS (Blueprint §6.1)
    const win = rect(".window");
    if (win && win.width > 0) {
      const readers = [".title", ".subtitle", ".note .n-say", ".entry .e-body", ".item .n",
                       ".person .nm", ".rec .r-what", ".finding .f-say", ".day-name", ".meal .m-name"];
      for (const sel of readers) {
        for (const el of Array.from(document.querySelectorAll(sel)) as HTMLElement[]) {
          const b = el.getBoundingClientRect();
          if (b.width <= 0 || b.height <= 0) continue;
          if (b.left < win.right - 2 && b.right > win.left + 2 && b.top < win.bottom - 2 && b.bottom > win.top + 2) {
            p.push(`${sel} crosses onto the glass`);
            break;
          }
        }
      }
    }

    // THE STATE LAW — a room shows ONE state at a time. A room rule that styles a
    // state element out-specifies the shared law on source order, and the filled
    // week then renders its own empty line underneath itself. Caught here because
    // it is invisible to every other check: both states are individually correct.
    const wrongState = vp === "" ? "" : (document.documentElement.dataset.state === "empty" ? ".filled-only" : ".empty-only");
    const leaked = Array.from(document.querySelectorAll(wrongState)).filter((el) => {
      const b = (el as HTMLElement).getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    }).length;
    if (leaked) p.push(`${leaked} ${wrongState} element(s) render in the ${document.documentElement.dataset.state} state`);

    // ARTICLE IV — the light never leaves. A room's plaster must never be darker
    // than the house floor: "quieter is never darker", "E1 is broader, not dimmer".
    const roomBg = getComputedStyle(document.querySelector(".room") as HTMLElement).backgroundColor;
    const body = getComputedStyle(document.body).backgroundColor;
    const lum = (col: string) => {
      const m = col.match(/\d+/g); if (!m) return 1;
      const [r, g, b] = m.map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };
    const L = Math.max(lum(roomBg), lum(body));
    if (L < 0.82) p.push(`room reads dark (luminance ${L.toFixed(3)} — the house floor is 0.82)`);

    return { problems: p, luminance: +L.toFixed(3), pageH: document.body.scrollHeight,
             win: win && win.width > 0 ? `${Math.round(win.width)}x${Math.round(win.height)}` : "E1 (light only)" };
  }, viewport);
}

/** The per-room checks — each room's own rules, made mechanical. */
async function roomChecks(page: Page, room: string, state: string, viewport: string) {
  return page.evaluate(({ room, state, viewport }) => {
    const p: string[] = [];
    const vis = (el: Element) => {
      const b = (el as HTMLElement).getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    };

    if (room === "family-table") {
      // T1 — the week is ONE plane with all seven days, at every breakpoint.
      // "You never get fewer days on a smaller screen; you stand closer."
      const days = Array.from(document.querySelectorAll(".day")).filter(vis);
      if (days.length !== 7) p.push(`${days.length} days visible (the week is always 7)`);
      // T2/T3 — no day carries a border or a chip; the sun on today is WARMTH only
      for (const d of days) {
        const cs = getComputedStyle(d as HTMLElement);
        if (parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) > 0.5) { p.push("a day carries a border (T3)"); break; }
      }
      const today = document.querySelectorAll(".day.today");
      if (today.length !== 1) p.push(`${today.length} days read as today (must be 1)`);
      // the open day is a laid place: no dashed ghost outline anywhere
      for (const o of Array.from(document.querySelectorAll(".open"))) {
        if (getComputedStyle(o as HTMLElement).borderStyle.includes("dashed")) { p.push("an open day is drawn as a dashed ghost (T2)"); break; }
      }
    }

    if (room === "garden-room" && state === "filled") {
      // G3 — WORDS ABOVE NUMBERS, permanently, at every breakpoint.
      const board = document.querySelector(".board") as HTMLElement | null;
      const data = document.querySelector(".data") as HTMLElement | null;
      if (!board || !data) p.push("noticeboard or data tier missing");
      else if (board.getBoundingClientRect().top >= data.getBoundingClientRect().top)
        p.push("the data tier sits above the noticeboard (G3 — words must be above numbers)");
      // G6 — the garden filling in is COPY + COUNT: assert no leaf/graphic imagery
      const garden = document.querySelector(".note.garden") as HTMLElement | null;
      if (garden && garden.querySelector("img, svg, canvas")) p.push("the garden detail renders imagery (G6 — copy + count only)");
    }

    if (room === "tasting-bench" && state === "filled") {
      // B1 — the bench holds exactly ONE object
      const objs = Array.from(document.querySelectorAll(".pack")).filter(vis);
      if (objs.length !== 1) p.push(`${objs.length} objects on the bench (must be exactly 1)`);
      // B2 — NO VERDICT THEATRE: no finding may read as a dominant-red judgement
      const reds = Array.from(document.querySelectorAll(".finding .f-say, .finding .f-what")).filter((el) => {
        const m = getComputedStyle(el as HTMLElement).color.match(/\d+/g);
        if (!m) return false;
        const [r, g, b] = m.map(Number);
        return r > 150 && r > g + 60 && r > b + 60;
      }).length;
      if (reds) p.push(`${reds} finding(s) read as a red verdict (B2)`);
      // B5 — honest uncertainty is present and first-class, not hidden
      if (!document.querySelectorAll(".finding.unknown").length) p.push("no honest-uncertainty finding shown (B5)");
    }

    if (room === "family-journal") {
      // J5 — the most air in the house, and MORE on mobile, not less.
      const floor = document.querySelector(".floor") as HTMLElement;
      const cs = getComputedStyle(floor);
      const padY = parseFloat(cs.paddingTop);
      const floors: Record<string, number> = { desktop: 120, tablet: 104, mobile: 96 };
      if (padY < floors[viewport]) p.push(`the room has ${padY}px of air (the window seat needs ≥${floors[viewport]})`);
      // J4 — quiet is AIR, never dark: the pool must not darken the room.
      // A stop is only a darkening one if it is BOTH dark AND actually painted:
      // CSS `transparent` computes to `rgba(0, 0, 0, 0)`, so a gradient fading
      // out to nothing reads as black at alpha 0 and must not be flagged.
      const pool = document.querySelector(".pool") as HTMLElement | null;
      if (pool) {
        const bg = getComputedStyle(pool).backgroundImage;
        for (const m of Array.from(bg.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/g))) {
          const [r, g, b] = [+m[1], +m[2], +m[3]];
          const a = m[4] === undefined ? 1 : +m[4];
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          if (a > 0.02 && lum < 0.5) { p.push("the pool darkens the room (J4 — quieter is never darker)"); break; }
        }
      }
      // J1/J9 — nothing is due, and there is no onward action
      const body = document.body.innerText.toLowerCase();
      for (const banned of ["streak", "day streak", "you haven't written", "complete your", "keep it up"]) {
        if (body.includes(banned)) p.push(`the journal prompts ("${banned}") — J1`);
      }
    }

    if (room === "mirror") {
      // M7 — ANCHORED: the strata order must be identical at every breakpoint
      const order = Array.from(document.querySelectorAll(".st-name")).map((e) => (e as HTMLElement).innerText.trim());
      (window as any).__strata = order;
      // M1 — the people never shrink: the avatar is the same size at every size
      const av = document.querySelector(".person .av") as HTMLElement | null;
      if (!av) p.push("no people in the record");
      else if (Math.round(av.getBoundingClientRect().width) !== 52) p.push(`the avatar is ${Math.round(av.getBoundingClientRect().width)}px (must never shrink from 52)`);
      // M2 — people are never form fields: no checkbox/switch in the people band
      if (document.querySelector(".people input, .people [role='switch']")) p.push("a person is rendered as a form field (M2)");
      // M5 — never the bathroom scale
      const body = document.body.innerText.toLowerCase();
      for (const banned of ["weight", "bmi", "progress", "goal weight"]) {
        if (body.includes(banned)) p.push(`the mirror appraises ("${banned}") — M5`);
      }
      return { problems: p, strata: order };
    }

    return { problems: p, strata: null as string[] | null };
  }, { room, state, viewport });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });
  let fraunces = false;
  let problems = 0;
  let renders = 0;
  const strataByRoom: Record<string, string[]> = {};

  for (const room of ROOMS) {
    console.log(`\n${room.name}`);
    const SRC = "file://" + resolve(`scripts/north4-concepts/${room.file}`);

    for (const state of STATES) {
      for (const v of VIEWPORTS) {
        const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 2 });
        // tsx/esbuild compiles named function expressions with a __name() helper that
        // does not exist inside the page. Shim it so page.evaluate bodies run as written.
        await page.addInitScript("globalThis.__name = globalThis.__name || function (f) { return f; };");
        await page.goto(`${SRC}?state=${state}`, { waitUntil: "networkidle" });
        await page.evaluate(() => (document as any).fonts?.ready);
        await page.waitForTimeout(420);
        if (!fraunces) fraunces = await page.evaluate(() => (document as any).fonts.check('300 44px "Fraunces"'));

        const house = await houseChecks(page, v.id);
        const own = await roomChecks(page, room.id, state, v.id);

        // M7 — the Mirror's strata order must match across breakpoints
        if (own.strata) {
          const key = `${room.id}:${state}`;
          if (!strataByRoom[key]) strataByRoom[key] = own.strata;
          else if (strataByRoom[key].join("|") !== own.strata.join("|"))
            own.problems.push("the strata reorder between breakpoints (M7 — anchored means anchored at every size)");
        }

        const base = `${OUT}/${room.id}-${state}-${v.id}`;
        await page.screenshot({ path: `${base}.png` });
        // A full-page capture wherever the room legitimately continues below the
        // fold — including DESKTOP. The Mirror's record is taller than a desktop
        // viewport, so a viewport-only capture cuts the pressed apple off the
        // sheet and the reference shows a room without the house's one mark.
        if (house.pageH > v.height + 8) await page.screenshot({ path: `${base}-full.png`, fullPage: true });
        renders++;

        const all = [...house.problems, ...own.problems];
        problems += all.length;
        const flag = all.length ? `  ⚠ ${all.join("; ")}` : "  ✓ clear";
        console.log(`  ${state.padEnd(6)} ${v.id.padEnd(7)}  orchard=${house.win.padEnd(16)} lum=${house.luminance}  page=${house.pageH}px${flag}`);
        await page.close();
      }
    }
  }

  console.log(`\n${renders} renders · type: Fraunces loaded = ${fraunces}${fraunces ? "" : "  (DejaVu Serif fallback)"}`);
  console.log(problems === 0
    ? `house + per-room checks: ALL CLEAR (${renders}/${renders})`
    : `house + per-room checks: ${problems} problem(s) — see ⚠`);
  await browser.close();
  if (problems) process.exit(2);
}
main().catch((e) => { console.error(e); process.exit(1); });
