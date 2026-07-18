// BRAND2 — the embossed apple, refined into THA's architectural signature.
//
// Renders 12 genuinely-different architectural treatments of ONE idea — an apple
// pressed into the plaster of the canonical ARRIVAL1 wall — plus size / height /
// colour studies. Every treatment is injected into the LIVE /home in the browser
// only; nothing here edits app source. The room, arch, orchard and furniture are
// byte-untouched (BRAND1's discipline, continued).
//
// Emboss physics: Home's one light falls from the arch, top-centre (index.css
// `radial-gradient(... at 50% -8%)`). So a DEBOSS (pressed in) reads as a dark
// rim along the TOP of the shape and a lit rim along the BOTTOM; a RAISED boss is
// the inverse. Every treatment below obeys that single light.
//
// Usage: npx tsx scripts/capture-brand2-embossed-apple.ts
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/brand2-embossed");
const APPLE = "/_brand2-apple.png";

const POP: Record<string, unknown> = {
  "**/api/planner/current-week": { anchored: true, weekNumber: 1, todayDayOfWeek: 5 },
  "**/api/planner/full": [{ weekNumber: 1, days: [{ dayOfWeek: 5, entries: [
    { id: 1, mealId: "m1", mealType: "breakfast" }, { id: 2, mealId: "m2", mealType: "lunch" }, { id: 3, mealId: "m3", mealType: "dinner" }] }] }],
  "**/api/meals/summary": [{ id: "m1", name: "Green Protein Smoothie", imageUrl: null }, { id: "m2", name: "Spring Lentil Salad", imageUrl: null }, { id: "m3", name: "Herb-Roasted Chicken", imageUrl: null }],
  "**/api/shopping-list*": [{ id: 1, name: "Milk", checked: false }, { id: 2, name: "Mixed Nuts", checked: false }, { id: 3, name: "Olive Oil", checked: false }, { id: 4, name: "Spinach", checked: false }, { id: 5, name: "Oats", checked: false }],
  "**/api/home/intelligence": { weeklyProgress: { plantCount: 28 } },
  "**/api/intelligence/companion/notices": { notices: [{ id: "n1", text: "Spring greens are at their best — shall we plan something for the weekend?" }], gatheredCount: 1 },
  "**/api/intelligence/food-opportunities": { resolved: true, opportunities: [], grouped: {} },
};

const CONCEPTS = [
  "baseline",
  "t01_shallow", "t02_deep_relief", "t03_lime", "t04_polished", "t05_aged",
  "t06_shadow_relief", "t07_raised", "t08_arch_reveal", "t09_eye_beside",
  "t10_above_greeting", "t11_offset_high", "t12_light_discovered",
  // investigations
  "study_size", "study_height", "study_colour",
  // the recommended canonical treatment, stated whole
  "canonical",
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const concept of CONCEPTS) {
    if (only && !only.includes(concept)) continue;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2 });
    await ctx.request.post(`${BASE}/api/login`, { data: { username: "price.single.parent.owner@dev.thehealthyapples.dev", password: "devworld-dev-only" } });
    const page = await ctx.newPage();
    await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
    for (const [g, b] of Object.entries(POP)) await page.route(g, (r: any) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) }));
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => (document as any).fonts.ready);
    await page.waitForTimeout(1800);

    await page.evaluate(({ concept, APPLE }) => {
      const room = document.querySelector('[data-testid="home-room"]') as HTMLElement;
      const arch = document.querySelector('[data-testid="home-orchard-arch"]') as HTMLElement;
      const greeting = document.querySelector('[data-testid="text-home-greeting"]') as HTMLElement;
      const header = document.querySelector('header') as HTMLElement;
      if (!room) return;
      const roomBox = room.getBoundingClientRect();
      const rel = (el: HTMLElement | null) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x - roomBox.x, y: b.y - roomBox.y, w: b.width, h: b.height }; };

      const mark = (css: Partial<CSSStyleDeclaration>, cls = "") => {
        const d = document.createElement("div");
        d.className = "brand2-mark " + cls;
        Object.assign(d.style, { position: "absolute", pointerEvents: "none", zIndex: "5" } as any, css as any);
        room.appendChild(d);
        return d;
      };

      // an apple silhouette using the png as an alpha mask, so it can take ANY
      // fill (a plaster colour, a specular sheen, a colour tint) and any emboss.
      const appleMask = (size: number, background: string, extra: Partial<CSSStyleDeclaration> = {}) => ({
        width: size + "px", height: size + "px",
        background,
        WebkitMaskImage: `url(${APPLE})`, maskImage: `url(${APPLE})`,
        WebkitMaskSize: "contain", maskSize: "contain",
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
        ...extra,
      } as Partial<CSSStyleDeclaration>);

      const DARK = (a: number) => `hsl(56 40% 9% / ${a})`;   // the room's olive shadow
      const LIGHT = (a: number) => `hsl(40 72% 99% / ${a})`; // the plaster highlight
      const WALL = "hsl(36 46% 94%)";                        // --wall, the plaster body

      // DEBOSS — pressed IN. Light from top ⇒ dark rim on top, lit rim on the
      // bottom. depth scales the offset, blur and rim opacity together.
      const deboss = (dark: number, light: number, off: number, blur: number) =>
        `drop-shadow(0 ${-off}px ${blur}px ${DARK(dark)}) drop-shadow(0 ${off}px ${blur}px ${LIGHT(light)})`;
      // RAISED — proud of the wall. The inverse rim.
      const raised = (dark: number, light: number, off: number, blur: number) =>
        `drop-shadow(0 ${off}px ${blur}px ${DARK(dark)}) drop-shadow(0 ${-off}px ${blur}px ${LIGHT(light)})`;

      const hideBanner = () => {
        header?.querySelectorAll('a[aria-label="Home"], .realm-title').forEach((e) => ((e as HTMLElement).style.visibility = "hidden"));
      };
      hideBanner(); // every emboss concept assumes the reformed banner (BRAND1 §4)

      const a = rel(arch);
      const g = rel(greeting);
      // canonical anchor: on the plaster to the RIGHT of the arch, at eye height.
      const besideX = a ? a.x + a.w + 46 : 900;
      const eyeY = a ? a.y + a.h * 0.34 : 300;

      switch (concept) {
        case "baseline": break;

        // 1 — SHALLOW PLASTER EMBOSS · the lightest possible press, tone-on-tone.
        case "t01_shallow": {
          const s = 150;
          mark(appleMask(s, WALL, { left: besideX + "px", top: eyeY + "px", filter: deboss(0.10, 0.55, 1, 0.5), opacity: "0.96" }));
          break;
        }

        // 2 — DEEP CARVED RELIEF · a confident, sculptural carve with a real recess.
        case "t02_deep_relief": {
          const s = 162;
          mark(appleMask(s, "hsl(34 34% 90%)", { left: besideX + "px", top: eyeY + "px",
            filter: deboss(0.26, 0.9, 3, 1.6) + " drop-shadow(0 0 0.5px " + DARK(0.18) + ")" }));
          break;
        }

        // 3 — LIME PLASTER IMPRESSION · cooler, chalky, matte; soft mottled edges.
        case "t03_lime": {
          const s = 156;
          mark(appleMask(s,
            "radial-gradient(120% 120% at 46% 30%, hsl(42 14% 95%), hsl(40 12% 90%) 70%, hsl(38 12% 88%))",
            { left: besideX + "px", top: eyeY + "px", filter: deboss(0.14, 0.6, 2, 3), opacity: "0.97" }));
          break;
        }

        // 4 — SMOOTH POLISHED PLASTER (tadelakt/Venetian) · a waxed sheen catches
        //     the morning; the one finish that returns a soft specular highlight.
        case "t04_polished": {
          const s = 156;
          mark(appleMask(s,
            "linear-gradient(158deg, hsl(41 52% 97%) 0%, hsl(37 40% 94%) 42%, hsl(35 30% 90%) 100%)",
            { left: besideX + "px", top: eyeY + "px",
              filter: deboss(0.18, 1.0, 2, 1) + " drop-shadow(0 -0.5px 0 hsl(46 80% 99% / 0.9))" }));
          break;
        }

        // 5 — AGED HAND-WORKED PLASTER · troweled, imperfect, a maker's thumbprint;
        //     a faint ghost offset + patina in the recess, a whisper of rotation.
        case "t05_aged": {
          const s = 158;
          // patina ghost behind
          mark(appleMask(s + 2, "hsl(35 22% 86% / 0.5)", { left: (besideX - 2) + "px", top: (eyeY + 3) + "px",
            filter: "blur(1.5px)", transform: "rotate(-1.2deg)" }));
          mark(appleMask(s,
            "radial-gradient(90% 80% at 38% 34%, hsl(37 26% 92%), hsl(35 22% 88% ) 72%, hsl(33 20% 85%))",
            { left: besideX + "px", top: eyeY + "px", transform: "rotate(0.6deg)",
              filter: deboss(0.16, 0.7, 2, 2.4) }));
          break;
        }

        // 6 — SUBTLE SHADOW RELIEF · no fill difference at all; the apple is
        //     defined ONLY by a soft cast shadow — pure relief, no edge.
        case "t06_shadow_relief": {
          const s = 170;
          mark(appleMask(s, WALL, { left: besideX + "px", top: eyeY + "px",
            filter: deboss(0.12, 0.42, 1.5, 5), opacity: "0.9" }));
          break;
        }

        // 7 — RAISED BOSS · the apple stands slightly PROUD of the wall (inverse
        //     rim) — a low relief that catches light on top.
        case "t07_raised": {
          const s = 152;
          mark(appleMask(s,
            "radial-gradient(120% 120% at 50% 22%, hsl(39 54% 96%), hsl(36 40% 92%) 68%, hsl(34 32% 88%))",
            { left: besideX + "px", top: eyeY + "px", filter: raised(0.2, 0.85, 2, 1.4) }));
          break;
        }

        // 8 — INTEGRATED INTO THE ARCH REVEAL · pressed into the plaster soffit of
        //     the opening itself, so it belongs to the doorway, not the wall.
        case "t08_arch_reveal": {
          if (a) {
            const s = 52;
            mark(appleMask(s, "hsl(36 40% 90%)", {
              left: (a.x + a.w / 2 - s / 2) + "px", top: (a.y + 6) + "px",
              filter: deboss(0.2, 0.7, 1.5, 1), zIndex: "6", opacity: "0.95" }));
          }
          break;
        }

        // 9 — BESIDE THE ARCH, AT EYE HEIGHT · the canonical placement study.
        case "t09_eye_beside": {
          const s = 150;
          mark(appleMask(s, WALL, { left: besideX + "px", top: (a ? a.y + a.h * 0.42 : 340) + "px",
            filter: deboss(0.15, 0.7, 2, 1.4) }));
          break;
        }

        // 10 — CENTRED ABOVE THE GREETING · on the room's vertical axis.
        case "t10_above_greeting": {
          const s = 128;
          const cx = g ? g.x + g.w / 2 : 720;
          const ty = g ? g.y - s - 18 : 420;
          mark(appleMask(s, WALL, { left: (cx - s / 2) + "px", top: ty + "px",
            filter: deboss(0.15, 0.7, 2, 1.4) }));
          break;
        }

        // 11 — OFFSET ARCHITECTURAL PLACEMENT · high on the wall, off the axis, the
        //     way a plasterer signs near a corner rather than dead-centre.
        case "t11_offset_high": {
          const s = 138;
          mark(appleMask(s, WALL, { left: (a ? a.x - s - 70 : 180) + "px", top: (a ? a.y - 8 : 90) + "px",
            filter: deboss(0.15, 0.7, 2, 1.4) }));
          break;
        }

        // 12 — DISCOVERED BY LIGHT · present only where the arch's morning rakes
        //      the wall; the identity depends on the room's one light.
        case "t12_light_discovered": {
          const s = 176;
          mark(appleMask(s, WALL, {
            left: besideX + "px", top: (eyeY - 20) + "px",
            filter: deboss(0.16, 0.85, 2, 1.4),
            WebkitMaskImage: `url(${APPLE}), radial-gradient(64% 74% at 20% 26%, #000 0%, transparent 74%)`,
            maskImage: `url(${APPLE}), radial-gradient(64% 74% at 20% 26%, #000 0%, transparent 74%)`,
            WebkitMaskComposite: "source-in", maskComposite: "intersect",
          } as any));
          break;
        }

        // STUDY — SIZE · three presses, 96 / 150 / 210, on the wall right of the arch.
        case "study_size": {
          const ys = a ? a.y + a.h * 0.10 : 200;
          [96, 150, 210].forEach((s, i) => {
            mark(appleMask(s, WALL, { left: (besideX - 20) + "px", top: (ys + [0, 150, 330][i]) + "px",
              filter: deboss(0.15, 0.7, 2, 1.4) }));
          });
          break;
        }

        // STUDY — HEIGHT · same apple at three heights on the left wall:
        //         low (by the console), eye (mid-arch), high (near the top).
        case "study_height": {
          const s = 128;
          const lx = a ? a.x - s - 64 : 200;
          [ a ? a.y - 6 : 80, a ? a.y + a.h * 0.40 : 320, a ? a.y + a.h * 0.86 : 560 ].forEach((ty) => {
            mark(appleMask(s, WALL, { left: lx + "px", top: ty + "px", filter: deboss(0.15, 0.7, 2, 1.4) }));
          });
          break;
        }

        // STUDY — COLOUR (challenge the assumption) · tone-on-tone · faint leaf-green
        //         recess · faint apple-red recess, side by side.
        case "study_colour": {
          const s = 132; const ys = a ? a.y + a.h * 0.16 : 240;
          // tone-on-tone
          mark(appleMask(s, WALL, { left: (besideX - 18) + "px", top: ys + "px", filter: deboss(0.15, 0.7, 2, 1.4) }));
          // faint orchard-green in the recess
          mark(appleMask(s, "hsl(74 26% 82%)", { left: (besideX - 18) + "px", top: (ys + 180) + "px",
            filter: `drop-shadow(0 -2px 1.4px hsl(74 40% 20% / 0.24)) drop-shadow(0 2px 1.4px ${LIGHT(0.7)})` }));
          // faint apple-red in the recess
          mark(appleMask(s, "hsl(8 44% 84%)", { left: (besideX - 18) + "px", top: (ys + 360) + "px",
            filter: `drop-shadow(0 -2px 1.4px hsl(8 50% 26% / 0.24)) drop-shadow(0 2px 1.4px ${LIGHT(0.7)})` }));
          break;
        }

        // THE CANONICAL TREATMENT, stated whole (see the report §7):
        //   aged hand-worked lime plaster · tone-on-tone · beside the arch at eye
        //   height, offset · a shallow-to-medium deboss · fully revealed only where
        //   the arch's morning grazes it, always faintly present in shadow.
        case "canonical": {
          const s = 160;
          const lx = besideX; const ty = eyeY;
          // faint hand-worked ghost (the trowel's imperfection) — a whisker off-axis
          mark(appleMask(s + 3, "hsl(37 18% 87% / 0.5)", { left: (lx - 2) + "px", top: (ty + 3) + "px",
            filter: "blur(1.6px)", transform: "rotate(-1deg)" }));
          // the mark: chalky lime fill, medium deboss so it holds on ordinary
          // screens, GENTLY grazed brighter by the arch's morning on its near side
          // and settling into shadow on the far side — always present, never a fade.
          mark(appleMask(s,
            "radial-gradient(96% 86% at 34% 30%, hsl(41 15% 94%), hsl(38 13% 90%) 68%, hsl(36 12% 87%))",
            { left: lx + "px", top: ty + "px", transform: "rotate(0.5deg)",
              filter: deboss(0.19, 0.92, 2.4, 1.8),
              WebkitMaskImage: `url(${APPLE}), radial-gradient(92% 96% at 24% 28%, #000 0%, rgba(0,0,0,0.78) 64%, rgba(0,0,0,0.6) 100%)`,
              maskImage: `url(${APPLE}), radial-gradient(92% 96% at 24% 28%, #000 0%, rgba(0,0,0,0.78) 64%, rgba(0,0,0,0.6) 100%)`,
              WebkitMaskComposite: "source-in", maskComposite: "intersect",
            } as any));
          break;
        }
      }
    }, { concept, APPLE });

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${concept}.png`), fullPage: false });
    const clip = await page.evaluate(() => {
      const marks = Array.from(document.querySelectorAll('.brand2-mark')) as HTMLElement[];
      if (!marks.length) return null;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const m of marks) { const b = m.getBoundingClientRect(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom); }
      const pad = 64;
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
      return { x: x0, y: y0, width: Math.min(1440 - x0, x1 - x0 + pad * 2), height: Math.max(80, y1 - y0 + pad * 2) };
    });
    if (clip && clip.width > 10 && clip.height > 10) await page.screenshot({ path: path.join(OUT, `${concept}-mark.png`), clip }).catch(() => {});
    await ctx.close();
    console.log("captured", concept);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
