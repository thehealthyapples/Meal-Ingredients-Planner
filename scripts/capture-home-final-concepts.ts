// HOME_FINAL_CONCEPTS — the final five Home experiences, before Home is locked.
//
// Five GENUINELY DIFFERENT experiences of the SAME canonical ARRIVAL1 room. The
// room, arch, orchard, oak console, stone floor and layout are byte-untouched
// (the BRAND1/BRAND2 discipline): every concept is injected into the LIVE /home in
// the browser only; nothing here edits app source. What changes is the EXPERIENCE —
// branding, banner, greeting, typography, composition, materials, lighting, arrival
// sequence, emotional emphasis, and the relationship between greeting · apple · arch.
//
// The room has ONE morning light, falling from the arch top-centre (index.css
// `radial-gradient(... at 50% -8%)`). Every lighting move and every pressed apple
// obeys that one light (dark rim up / lit rim down for a deboss) — BRAND2 § 2.
//
// Concepts:  A The Signature Wall · B The Family Home · C The Architect's House ·
//            D The Orchard House · E Claude's Best Idea ("The House That Was
//            Expecting You").
//
// Usage: npx tsx scripts/capture-home-final-concepts.ts   (ONLY=A,E to re-render some)
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/home-final-concepts");
const APPLE = "/_brand2-apple.png";

// A populated household, so every concept renders a real, warm morning (the same
// mock BRAND2 used, so the room is directly comparable to that study).
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

const CONCEPTS = ["baseline", "A", "B", "C", "D", "E"] as const;
const VIEWPORTS = [
  { key: "desktop", width: 1440, height: 1400 },
  { key: "mobile", width: 430, height: 1560 },
] as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const concept of CONCEPTS) {
    if (only && !only.includes(concept)) continue;
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      await ctx.request.post(`${BASE}/api/login`, { data: { username: "price.single.parent.owner@dev.thehealthyapples.dev", password: "devworld-dev-only" } });
      const page = await ctx.newPage();
      await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
      for (const [g, b] of Object.entries(POP)) await page.route(g, (r: any) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) }));
      await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => (document as any).fonts.ready);
      await page.waitForTimeout(1600);

      await page.evaluate(({ concept, APPLE }) => {
        const room = document.querySelector('[data-testid="home-room"]') as HTMLElement;
        if (!room) return;
        const arch = (document.querySelector('[data-testid="home-orchard-arch"]') || document.querySelector('.home-arch')) as HTMLElement | null;
        const greeting = document.querySelector('[data-testid="text-home-greeting"]') as HTMLElement | null;
        const signature = document.querySelector('[data-testid="text-home-signature"]') as HTMLElement | null;
        const welcome = greeting?.querySelector('span') as HTMLElement | null; // the "Welcome home," line
        const dateEl = document.querySelector('[data-testid="text-home-date"]') as HTMLElement | null;
        const header = document.querySelector('header') as HTMLElement | null;
        const companion = document.querySelector('[data-testid="card-home-companion"]') as HTMLElement | null;
        const console_ = document.querySelector('[data-testid="ground-home"]') as HTMLElement | null;

        const roomBox = room.getBoundingClientRect();
        const rel = (el: HTMLElement | null) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x - roomBox.x, y: b.y - roomBox.y, w: b.width, h: b.height }; };
        const roomW = roomBox.width;

        const DARK = (a: number) => `hsl(56 40% 9% / ${a})`;
        const LIGHT = (a: number) => `hsl(40 72% 99% / ${a})`;
        const WALL = "hsl(36 46% 94%)";

        // a full-room lighting/atmosphere wash
        const wash = (css: Partial<CSSStyleDeclaration>) => {
          const d = document.createElement("div");
          d.className = "hfc-wash";
          Object.assign(d.style, { position: "absolute", inset: "0", pointerEvents: "none" } as any, css as any);
          room.appendChild(d);
          return d;
        };
        // an absolutely-placed mark (apple, plaque, signature)
        const mark = (css: Partial<CSSStyleDeclaration>, cls = "") => {
          const d = document.createElement("div");
          d.className = "hfc-mark " + cls;
          Object.assign(d.style, { position: "absolute", pointerEvents: "none", zIndex: "5" } as any, css as any);
          room.appendChild(d);
          return d;
        };
        const appleMask = (size: number, background: string, extra: Partial<CSSStyleDeclaration> = {}) => ({
          width: size + "px", height: size + "px", background,
          WebkitMaskImage: `url(${APPLE})`, maskImage: `url(${APPLE})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          ...extra,
        } as Partial<CSSStyleDeclaration>);
        const deboss = (dark: number, light: number, off: number, blur: number) =>
          `drop-shadow(0 ${-off}px ${blur}px ${DARK(dark)}) drop-shadow(0 ${off}px ${blur}px ${LIGHT(light)})`;

        // The canonical BRAND2 "Pressed Apple", beside the arch at eye height.
        const pressedApple = () => {
          const a = rel(arch);
          const s = Math.min(150, roomW * 0.34);
          const besideX = a ? Math.min(a.x + a.w + 40, roomW - s - 14) : roomW - s - 24;
          const eyeY = a ? a.y + a.h * 0.34 : 300;
          mark(appleMask(s + 3, "hsl(37 18% 87% / 0.5)", { left: (besideX - 2) + "px", top: (eyeY + 3) + "px", filter: "blur(1.6px)", transform: "rotate(-1deg)" }));
          mark(appleMask(s,
            "radial-gradient(96% 86% at 34% 30%, hsl(41 15% 94%), hsl(38 13% 90%) 68%, hsl(36 12% 87%))",
            { left: besideX + "px", top: eyeY + "px", transform: "rotate(0.5deg)",
              filter: deboss(0.19, 0.92, 2.4, 1.8),
              WebkitMaskImage: `url(${APPLE}), radial-gradient(92% 96% at 24% 28%, #000 0%, rgba(0,0,0,0.78) 64%, rgba(0,0,0,0.6) 100%)`,
              maskImage: `url(${APPLE}), radial-gradient(92% 96% at 24% 28%, #000 0%, rgba(0,0,0,0.78) 64%, rgba(0,0,0,0.6) 100%)`,
              WebkitMaskComposite: "source-in", maskComposite: "intersect",
            } as any));
        };

        // Banner treatments (BRAND1 §4). C/D dissolve it into plaster; A/B/E reform
        // it to a single quiet apple.
        const hideLongLogo = () => {
          header?.querySelectorAll('img, a[aria-label="Home"], .realm-title').forEach((e) => ((e as HTMLElement).style.visibility = "hidden"));
        };
        const dissolveBand = () => {
          if (!header) return;
          header.style.background = "transparent";
          header.style.borderBottom = "none";
          header.style.boxShadow = "none";
        };
        const headerApple = () => {
          if (!header) return;
          const holder = header.querySelector('a[aria-label="Home"], .realm-title')?.parentElement || header;
          const d = document.createElement("div");
          Object.assign(d.style, { position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", width: "26px", height: "26px", zIndex: "50",
            background: "hsl(74 30% 30%)", WebkitMaskImage: `url(${APPLE})`, maskImage: `url(${APPLE})`,
            WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" } as any);
          (holder as HTMLElement).style.position = (holder as HTMLElement).style.position || "relative";
          header.appendChild(d);
        };

        // set the greeting's two lines
        const setWelcome = (t: string, css: Partial<CSSStyleDeclaration> = {}) => { if (welcome) { welcome.textContent = t; Object.assign(welcome.style, css as any); } };
        const setSignature = (css: Partial<CSSStyleDeclaration>) => { if (signature) Object.assign(signature.style, css as any); };
        // a warm personal "good-news" line, inserted under the date
        const goodNews = (t: string, css: Partial<CSSStyleDeclaration> = {}) => {
          if (!dateEl) return;
          const p = document.createElement("p");
          p.className = "hfc-goodnews";
          p.textContent = t;
          Object.assign(p.style, { marginTop: "14px", maxWidth: "30rem", fontSize: "1.0625rem", lineHeight: "1.6", color: "hsl(74 22% 26%)" } as any, css as any);
          dateEl.parentElement?.appendChild(p);
        };

        switch (concept) {
          case "baseline": break;

          // ── A · THE SIGNATURE WALL ────────────────────────────────────────────
          // The whole room is one signed piece. THA's identity is the wall: the
          // household's name in THA's own hand, the pressed apple beside the arch,
          // and the maker's script routed into the oak. Warm, neutral, crafted.
          case "A": {
            dissolveBand(); hideLongLogo(); headerApple();
            // the name, a touch larger & warmer — the room's loudest signature
            setSignature({ letterSpacing: "-0.01em" });
            setWelcome("Welcome home,");
            pressedApple();
            // carved-oak maker's signature, routed into the console (tone-on-tone oak)
            if (console_) {
              const c = rel(console_);
              if (c) {
                const sig = document.createElement("div");
                sig.className = "hfc-mark";
                sig.textContent = "The Healthy Apples";
                Object.assign(sig.style, { position: "absolute", left: (c.x + c.w - 262) + "px", top: (c.y + c.h - 52) + "px",
                  width: "244px", textAlign: "right", fontFamily: "'Caveat','Segoe Script',cursive", fontSize: "31px", zIndex: "20",
                  color: "hsl(41 46% 32%)", textShadow: "0 -1px 0 hsl(44 62% 88% / 0.7), 0 1.5px 1.5px hsl(41 46% 20% / 0.6)", opacity: "0.96", pointerEvents: "none" } as any);
                room.appendChild(sig);
              }
            }
            break;
          }

          // ── B · THE FAMILY HOME ───────────────────────────────────────────────
          // The warmest, most human. A lived-in golden morning, a personal hello,
          // the Companion foregrounded like a friend already in the kitchen, and a
          // small family maker's-mark by the door. Belonging over polish.
          case "B": {
            dissolveBand(); hideLongLogo(); headerApple();
            // a warmer, lived-in morning light
            wash({ zIndex: "1", background: "radial-gradient(120% 66% at 50% -4%, hsl(40 88% 82% / 0.6), hsl(40 80% 82% / 0) 58%), linear-gradient(180deg, hsl(38 70% 84% / 0.30), hsl(36 44% 82% / 0.06) 62%, transparent)", mixBlendMode: "soft-light" });
            wash({ zIndex: "1", background: "linear-gradient(180deg, hsl(41 70% 80% / 0.16), transparent 40%)" });
            setWelcome("Morning,");
            setSignature({});
            goodNews("The kitchen's yours today — three meals planned, the greens are at their best, and there's nothing left to fetch.");
            // warm the Companion card so the friend-at-the-counter reads first
            if (companion) { companion.style.boxShadow = "0 2px 4px hsl(56 40% 9% / 0.10), 0 18px 40px -20px hsl(41 60% 30% / 0.5)"; companion.style.transform = "scale(1.015)"; }
            // a small family maker's-mark plaque, low in the stone floor, left of
            // the doors — clear of the greeting and the good-news line above.
            {
              const c = rel(console_);
              const px = 36, py = c ? c.y + c.h + 28 : roomBox.height * 0.78;
              const plaque = document.createElement("div");
              plaque.className = "hfc-mark";
              Object.assign(plaque.style, { position: "absolute", left: px + "px", top: py + "px", display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 12px", borderRadius: "8px", background: "hsl(33 24% 82% / 0.5)", boxShadow: "inset 0 1px 0 hsl(40 60% 96% / 0.5), inset 0 -1px 2px hsl(56 40% 9% / 0.12)", zIndex: "5", pointerEvents: "none" } as any);
              const ap = document.createElement("div");
              Object.assign(ap.style, { width: "20px", height: "20px", background: "hsl(56 30% 30% / 0.6)", WebkitMaskImage: `url(${APPLE})`, maskImage: `url(${APPLE})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" } as any);
              const t = document.createElement("span");
              t.textContent = "· a home, est. ·";
              Object.assign(t.style, { fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(56 22% 30% / 0.7)" } as any);
              plaque.appendChild(ap); plaque.appendChild(t); room.appendChild(plaque);
            }
            break;
          }

          // ── C · THE ARCHITECT'S HOUSE ─────────────────────────────────────────
          // The most restrained. Cool, clean, gallery-calm; the household's name in
          // a refined light editorial serif (not the flourish); maximum air; NO
          // visible mark — the architecture is the brand. Banner gone into plaster.
          case "C": {
            dissolveBand(); hideLongLogo(); // no apple in the header either — silence
            // cool the light a half-step; quiet, even, museum daylight
            wash({ zIndex: "1", background: "radial-gradient(120% 60% at 50% -6%, hsl(210 24% 92% / 0.5), transparent 60%), linear-gradient(180deg, hsl(214 20% 90% / 0.18), transparent 55%)", mixBlendMode: "soft-light" });
            // the name, re-set as light editorial serif — precise, not handwritten
            setSignature({ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: "300", fontSize: signature && signature.getBoundingClientRect().width > 0 ? "3.4rem" : "3.4rem", letterSpacing: "-0.02em", color: "hsl(56 12% 22%)" });
            setWelcome("Welcome home,", { fontWeight: "300", letterSpacing: "0.02em", color: "hsl(56 8% 42%)" });
            // more air: push the console down a touch so the wall breathes
            if (console_) { const sec = console_.closest("section") as HTMLElement | null; if (sec) sec.style.marginTop = "4.5rem"; }
            break;
          }

          // ── D · THE ORCHARD HOUSE ─────────────────────────────────────────────
          // The orchard is the hero. A luminous green-gold morning, the arch's light
          // amplified so the view breathes into the room; the greeting steps back so
          // the world is what you meet first. No mark — the orchard is the logo.
          case "D": {
            hideLongLogo(); dissolveBand();
            // green-gold living morning across the wall — the orchard breathes in
            wash({ zIndex: "1", background: "radial-gradient(130% 76% at 50% -4%, hsl(72 66% 76% / 0.7), transparent 54%), linear-gradient(180deg, hsl(74 52% 72% / 0.34), hsl(58 44% 78% / 0.12) 48%, transparent)", mixBlendMode: "soft-light" });
            // amplify the arch's own morning: a large luminous halo around the opening
            if (arch) {
              const a = rel(arch)!;
              wash({ zIndex: "6", left: (a.x - a.w * 0.7) + "px", top: (a.y - a.h * 0.3) + "px", width: (a.w * 2.4) + "px", height: (a.h * 1.7) + "px", inset: "auto",
                background: "radial-gradient(50% 46% at 50% 40%, hsl(50 84% 84% / 0.66) 0%, hsl(54 70% 82% / 0) 70%)", mixBlendMode: "screen" } as any);
            }
            // the greeting steps back so the view leads
            setSignature({ opacity: "0.82", fontSize: "3.1rem" });
            setWelcome("Welcome home,", { opacity: "0.8" });
            break;
          }

          // ── E · CLAUDE'S BEST IDEA · "The House That Was Expecting You" ────────
          // The synthesis, tuned for one thing: a small daily smile. A warm first-
          // light morning (the house is ready), the name in THA's own hand, ONE warm
          // true line of good news, and the pressed apple beside the arch — the quiet
          // "made for you" signature. Banner reformed to a single apple.
          case "E": {
            dissolveBand(); hideLongLogo(); headerApple();
            // first-light: a warm dawn from the arch, gentler at the edges
            wash({ zIndex: "1", background: "radial-gradient(120% 64% at 50% -6%, hsl(42 92% 84% / 0.62), hsl(42 82% 82% / 0) 56%)", mixBlendMode: "soft-light" });
            wash({ zIndex: "1", background: "linear-gradient(180deg, hsl(43 78% 82% / 0.18), transparent 42%)" });
            // a whisper of extra warmth spilling from the arch onto the wall around it
            if (arch) {
              const a = rel(arch)!;
              wash({ zIndex: "6", left: (a.x - a.w * 0.4) + "px", top: (a.y - a.h * 0.15) + "px", width: (a.w * 1.8) + "px", height: (a.h * 1.3) + "px", inset: "auto",
                background: "radial-gradient(50% 46% at 50% 42%, hsl(44 86% 82% / 0.34) 0%, hsl(44 86% 82% / 0) 72%)", mixBlendMode: "screen" } as any);
            }
            setWelcome("Good morning,");
            setSignature({});
            goodNews("The house is ready for you. The kettle's on, today's already planned — and the first thing worth knowing is that the greens are at their best.",
              { color: "hsl(74 24% 26%)" });
            pressedApple();
            break;
          }
        }
      }, { concept, APPLE });

      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, `${concept}-${vp.key}.png`), fullPage: false });
      await ctx.close();
      console.log("captured", concept, vp.key);
    }
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
