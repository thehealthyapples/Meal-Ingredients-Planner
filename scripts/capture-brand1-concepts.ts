// BRAND1 — architectural branding concepts, rendered on the CANONICAL ARRIVAL1 room.
//
// The room is never modified. Each concept is injected into the live /home in the
// browser only (addStyleTag + a mark element positioned relative to the arch /
// console / floor), then screenshotted. Nothing here edits app source.
//
// Usage: npx tsx scripts/capture-brand1-concepts.ts
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/brand1");
const APPLE = "/_brand1-apple.png";

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

// Each concept is a browser-side function name; we pass an id and the injector runs in page.
const CONCEPTS = [
  "baseline", "c1_none", "c2_apple_plaster", "c3_wordmark_plaster", "c4_carved_oak",
  "c5_brass_inlay", "c6_etched_stone", "c7_light_reveal", "c8_makers_mark",
  "c9_keystone_apple", "c10_orchard_integrated",
  // top-banner fates
  "banner_a_gone", "banner_b_dissolve", "banner_c_orchard", "banner_d_reform",
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const concept of CONCEPTS) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2 });
    await ctx.request.post(`${BASE}/api/login`, { data: { username: "price.single.parent.owner@dev.thehealthyapples.dev", password: "devworld-dev-only" } });
    const page = await ctx.newPage();
    // esbuild (via tsx) instruments nested functions with __name(); define a no-op in
    // the page so the injected evaluate() body runs in the browser.
    await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
    for (const [g, b] of Object.entries(POP)) await page.route(g, (r: any) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) }));
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => (document as any).fonts.ready);
    await page.waitForTimeout(1800);

    await page.evaluate(({ concept, APPLE }) => {
      const room = document.querySelector('[data-testid="home-room"]') as HTMLElement;
      const arch = document.querySelector('[data-testid="home-orchard-arch"]') as HTMLElement;
      const console_ = document.querySelector('[data-testid="ground-home"]') as HTMLElement;
      const header = document.querySelector('header') as HTMLElement;
      if (!room) return;
      const roomBox = room.getBoundingClientRect();
      const rel = (el: HTMLElement) => { const b = el.getBoundingClientRect(); return { x: b.x - roomBox.x, y: b.y - roomBox.y, w: b.width, h: b.height }; };

      // helper: add an absolutely-positioned mark into the room
      const mark = (css: Partial<CSSStyleDeclaration>, cls = "") => {
        const d = document.createElement("div");
        d.className = "brand1-mark " + cls;
        Object.assign(d.style, { position: "absolute", pointerEvents: "none", zIndex: "50" } as any, css as any);
        room.appendChild(d);
        return d;
      };
      // an apple silhouette element (uses the png as an alpha mask, so any material colour)
      const appleMask = (size: number, color: string, extra: Partial<CSSStyleDeclaration> = {}) => ({
        width: size + "px", height: size + "px",
        background: color,
        WebkitMaskImage: `url(${APPLE})`, maskImage: `url(${APPLE})`,
        WebkitMaskSize: "contain", maskSize: "contain",
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
        ...extra,
      } as Partial<CSSStyleDeclaration>);

      // neutralise the top banner brand for in-room concepts (hide logo + realm title),
      // so the architectural mark carries the identity alone.
      const hideBanner = () => {
        header?.querySelectorAll('a[aria-label="Home"], .realm-title').forEach((e) => ((e as HTMLElement).style.visibility = "hidden"));
      };

      const a = arch ? rel(arch) : null;
      const c = console_ ? rel(console_) : null;

      switch (concept) {
        case "baseline": break;

        case "c1_none":
          hideBanner();
          break;

        case "c2_apple_plaster": { // embossed (debossed) apple pressed into the plaster wall
          hideBanner();
          const size = 150;
          const m = mark(appleMask(size, "hsl(35 30% 90%)", {
            filter: "drop-shadow(-1px -1px 0 hsl(56 40% 9% / 0.16)) drop-shadow(1.5px 1.5px 1px hsl(44 60% 99% / 0.9))",
            opacity: "0.9",
          }));
          if (a) { m.style.left = (a.x - size - 40) + "px"; m.style.top = (a.y + 30) + "px"; }
          else { m.style.left = "60px"; m.style.top = "120px"; }
          break;
        }

        case "c3_wordmark_plaster": { // the long wordmark embossed low into the plaster
          hideBanner();
          const d = mark({
            left: "50%", top: (a ? a.y + a.h + 24 : 460) + "px", transform: "translateX(-50%)",
            font: "600 30px 'Fraunces', Georgia, serif", letterSpacing: "0.04em",
            color: "hsl(35 26% 90%)",
            textShadow: "-1px -1px 0 hsl(56 40% 9% / 0.14), 1px 1px 1px hsl(44 60% 99% / 0.85)",
            whiteSpace: "nowrap",
          });
          d.textContent = "THE HEALTHY APPLES";
          break;
        }

        case "c4_carved_oak": { // the signature carved into the oak console, bottom-right on the wood
          hideBanner();
          if (c) {
            const d = mark({
              left: (c.x + c.w - 320) + "px", top: (c.y + c.h - 56) + "px",
              font: "italic 700 34px 'Caveat', cursive", color: "hsl(45 55% 23%)",
              textShadow: "0 2px 0 hsl(44 62% 90% / 0.85), 0 -1px 1px hsl(45 55% 10% / 0.8)",
            });
            d.textContent = "The Healthy Apples";
          }
          break;
        }

        case "c5_brass_inlay": { // a thin brass apple inlaid into the oak console
          if (c) {
            const size = 44;
            const m = mark(appleMask(size, "linear-gradient(135deg, hsl(44 78% 74%), hsl(40 70% 50%) 45%, hsl(38 60% 38%) 70%, hsl(46 82% 82%))", {
              left: (c.x + c.w - size - 26) + "px", top: (c.y + 22) + "px",
              filter: "drop-shadow(0 1px 1px hsl(44 60% 20% / 0.5)) drop-shadow(0 0 2px hsl(46 90% 85% / 0.6))",
            }));
            void m;
          }
          break;
        }

        case "c6_etched_stone": { // the name etched into the stone floor, on the threshold below the console
          hideBanner();
          const d = mark({
            left: "50%", top: (c ? c.y + c.h + 15 : 1160) + "px", transform: "translateX(-50%)",
            font: "600 13px 'Fraunces', Georgia, serif", letterSpacing: "0.4em",
            color: "hsl(33 14% 56%)",
            textShadow: "0 1.5px 0 hsl(40 44% 97% / 0.85), 0 -1px 1px hsl(45 34% 34% / 0.5)",
            whiteSpace: "nowrap",
          });
          d.textContent = "THE HEALTHY APPLES";
          break;
        }

        case "c7_light_reveal": { // apple visible only where the arch's morning rakes the wall
          hideBanner();
          const size = 190;
          const m = mark(appleMask(size, "hsl(40 40% 88%)", {
            filter: "drop-shadow(0 1px 0 hsl(44 60% 99% / 0.9)) drop-shadow(0 -1px 1px hsl(56 40% 9% / 0.10))",
            WebkitMaskImage: `url(${APPLE}), radial-gradient(60% 80% at 60% 30%, #000 0%, transparent 72%)`,
            maskImage: `url(${APPLE}), radial-gradient(60% 80% at 60% 30%, #000 0%, transparent 72%)`,
            WebkitMaskComposite: "source-in", maskComposite: "intersect",
            opacity: "0.85",
          } as any));
          if (a) { m.style.left = (a.x + a.w + 30) + "px"; m.style.top = (a.y + 20) + "px"; }
          else { m.style.right = "80px"; m.style.top = "120px"; }
          break;
        }

        case "c8_makers_mark": { // a small foundation-stone plaque, low corner
          hideBanner();
          const d = mark({
            left: "34px", bottom: "30px",
            width: "128px", height: "128px", borderRadius: "6px",
            background: "radial-gradient(120% 120% at 30% 20%, hsl(34 22% 84%), hsl(33 20% 76%))",
            boxShadow: "inset 0 1px 0 hsl(40 40% 96% / 0.6), inset 0 -2px 4px hsl(56 40% 9% / 0.12), 0 2px 6px hsl(56 40% 9% / 0.10)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
          });
          const ap = document.createElement("div");
          Object.assign(ap.style, appleMask(38, "hsl(43 40% 42%)", { filter: "drop-shadow(0 1px 0 hsl(44 55% 90% / 0.5))" }) as any);
          const t = document.createElement("div");
          t.textContent = "THA"; Object.assign(t.style, { font: "600 13px 'Fraunces', serif", letterSpacing: "0.28em", color: "hsl(45 20% 40%)" } as any);
          const t2 = document.createElement("div");
          t2.textContent = "· est. ·"; Object.assign(t2.style, { font: "500 9px 'Fraunces', serif", letterSpacing: "0.2em", color: "hsl(45 14% 52%)" } as any);
          d.append(ap, t, t2);
          break;
        }

        case "c9_keystone_apple": { // the apple as the keystone at the crown of the arch
          hideBanner();
          if (a) {
            const size = 92;
            mark(appleMask(size, "linear-gradient(135deg, hsl(35 34% 93%), hsl(34 26% 80%) 55%, hsl(33 22% 72%))", {
              left: (a.x + a.w / 2 - size / 2) + "px", top: (a.y - size * 0.52) + "px",
              filter: "drop-shadow(0 3px 4px hsl(56 40% 9% / 0.26)) drop-shadow(0 1px 0 hsl(44 60% 99% / 0.85))",
              zIndex: "6",
            }));
          }
          break;
        }

        case "c10_orchard_integrated": { // identity IN the orchard — a whisper wordmark on the sky/glass of the view
          hideBanner();
          if (a) {
            const d = mark({
              left: (a.x + a.w / 2) + "px", top: (a.y + 34) + "px", transform: "translateX(-50%)",
              font: "italic 600 22px 'Caveat', cursive", color: "hsl(40 50% 96% / 0.82)",
              textShadow: "0 1px 4px hsl(56 40% 9% / 0.35)", whiteSpace: "nowrap", zIndex: "6",
            });
            d.textContent = "The Healthy Apples";
          }
          break;
        }

        // ── TOP-BANNER FATES ────────────────────────────────────────────────
        case "banner_a_gone":
          if (header) header.style.visibility = "hidden";
          break;
        case "banner_b_dissolve": // logo → a small tone-on-tone apple watermark, wordmark gone
          header?.querySelectorAll('.realm-title').forEach((e) => ((e as HTMLElement).style.visibility = "hidden"));
          header?.querySelectorAll('a[aria-label="Home"] img').forEach((e) => Object.assign((e as HTMLElement).style, { opacity: "0.32", filter: "grayscale(0.4) sepia(0.3)" }));
          break;
        case "banner_c_orchard": { // the header band takes the orchard's own light/material
          if (header) header.style.background = "linear-gradient(180deg, hsl(36 46% 94%), hsl(34 34% 90%))";
          header?.querySelectorAll('.realm-title').forEach((e) => ((e as HTMLElement).style.visibility = "hidden"));
          break;
        }
        case "banner_d_reform": // wordmark → a single quiet apple mark, left, no title
          header?.querySelectorAll('.realm-title').forEach((e) => ((e as HTMLElement).style.visibility = "hidden"));
          header?.querySelectorAll('a[aria-label="Home"] img').forEach((e) => Object.assign((e as HTMLElement).style, { width: "26px", height: "26px", objectFit: "contain" }));
          break;
      }
    }, { concept, APPLE });

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, `${concept}.png`), fullPage: false });
    // a guaranteed close-up: clip to the union bounding box of the injected marks.
    const clip = await page.evaluate(() => {
      const marks = Array.from(document.querySelectorAll('.brand1-mark')) as HTMLElement[];
      if (!marks.length) return null;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const m of marks) { const b = m.getBoundingClientRect(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom); }
      const pad = 60;
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
