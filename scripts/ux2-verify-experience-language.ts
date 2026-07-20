/**
 * UX2 — verify the Experience Language completion in the RUNNING product.
 *
 *   npx tsx scripts/ux2-verify-experience-language.ts
 *
 * ZERO-WRITE. Authenticates as an existing fictional Development World household
 * and only reads; it writes nothing to the database and produces no files.
 *
 * WHY THIS EXISTS. Every defect UX2 actually shipped and had to fix was invisible
 * to the build, the typecheck and all three gates:
 *
 *   • the three embossed apple reliefs masked themselves with an asset that was
 *     not published, so all three rendered as NOTHING — and the dev server's SPA
 *     fallback answered the missing PNG with 200 + text/html, so even a status
 *     check would have passed;
 *   • the pressed wall apple was positioned by reasoning ("open plaster, offset
 *     right, eye height") onto the exact coordinates the Companion's sentences
 *     occupy.
 *
 * Both are valid CSS and passing markup. So this file MEASURES the things a
 * picture would show — asset reachability, geometric collision, and the resting
 * quiet of the header — rather than asserting that classes exist.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

let passed = 0;
let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

type Box = { x: number; y: number; width: number; height: number } | null;
function overlaps(a: Box, b: Box): boolean {
  if (!a || !b) return false;
  return (
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  );
}

async function open(ctx: BrowserContext, route: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  return page;
}

async function main() {
  const browser: Browser = await chromium.launch();

  // ── 1. THE MASK ASSET ─────────────────────────────────────────────────────
  // The one that bit. A 404 answered by the SPA shell is still a 404 for a mask,
  // so the CONTENT TYPE is the assertion, never the status code.
  console.log("\n1. THE EMBOSSED MARK'S ASSET — reachable, and actually an image");
  {
    const ctx = await browser.newContext();
    const r = await ctx.request.get(`${BASE}/tha-apple.png`);
    const type = r.headers()["content-type"] ?? "";
    check(r.ok(), "/tha-apple.png resolves", `status ${r.status()}`);
    check(
      type.startsWith("image/"),
      "/tha-apple.png is an IMAGE, not the SPA shell — a mask cannot mask with HTML",
      `content-type was "${type}"`,
    );
    await ctx.close();
  }

  // ── 2. THE ROOM'S GEOMETRY ────────────────────────────────────────────────
  console.log("\n2. HOME — the pressed apple presses into CLEAR wall (BRAND2 § 4.7)");
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
    if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
    const page = await open(ctx, "/home");

    const apple = await page.locator('[data-testid="home-pressed-apple"]').boundingBox();
    const companion = await page.locator('[data-testid="card-home-companion"]').boundingBox().catch(() => null);
    const doors = await page.locator('[data-testid="home-doors"]').boundingBox();
    const today = await page.locator('[data-testid="ground-home"]').boundingBox();
    const greeting = await page.locator('[data-testid="text-home-greeting"]').boundingBox();

    check(apple !== null, "the relief is in the room at all (it was invisible before the asset fix)");
    check(!overlaps(apple, doors), "it does not lie across the doors run", JSON.stringify({ apple, doors }));
    check(!overlaps(apple, today), "it does not lie across today's facts", JSON.stringify({ apple, today }));
    check(!overlaps(apple, greeting), "it does not lie across the greeting", JSON.stringify({ apple, greeting }));
    if (companion) {
      check(!overlaps(apple, companion), "it does not lie across the Companion's sentences — the defect this check was written for", JSON.stringify({ apple, companion }));
    }

    // The sill is load-bearing in perpetuity (NORTH4 R2): nothing the household
    // reads may sit on the glass.
    const glass = await page.locator('[data-testid="home-orchard-window"]').boundingBox();
    const sill = await page.locator('[data-testid="home-sill"]').boundingBox();
    check(glass !== null && sill !== null, "the glass and the sill are both present");
    if (glass && sill) {
      check(sill.y >= glass.y + glass.height - 2, "the sill sits below the glass — the boundary is in the right place");
      check(!overlaps(greeting, glass), "the greeting is BELOW the sill, never laid on the orchard (NORTH4 R2)");
      check(!overlaps(today, glass), "today's facts are below the sill too");
    }
    await page.close();
    await ctx.close();
  }

  // ── 3. THE ONE GREEN ──────────────────────────────────────────────────────
  console.log("\n3. THE PLATFORM PRIMARY — hue 74, everywhere, in both hours");
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
    if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
    const page = await open(ctx, "/home");
    const read = (name: string) =>
      page.evaluate(
        (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
        name,
      );
    for (const token of ["--primary", "--ring", "--sidebar-primary", "--primary-tint", "--primary-ink"]) {
      const v = await read(token);
      check(v.startsWith("74 "), `${token} is the orchard's hue 74`, `was "${v}"`);
    }
    // ARRIVAL1's Home-scoped override must be GONE, not merely equal: while it
    // stood, Home was still a room that knew its own green.
    const scoped = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-testid="home-room"]');
      return el ? (el.style.getPropertyValue("--primary") || "") : "absent";
    });
    check(scoped === "" || scoped === "absent", "Home declares no green of its own — it inherits the house's", `got "${scoped}"`);
    await page.close();
    await ctx.close();
  }

  // ── 4. THE PERMANENT HEADER ───────────────────────────────────────────────
  // One material in every room. The header used to render `realm-header-bg`, so
  // its background changed colour on every door — the single largest reason the
  // product read as nine applications wearing one navigation.
  console.log("\n4. THE HEADER — ONE material across the widest hue spread the house contains");
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
    if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
    const rooms = [
      ["home", "/home"],
      ["planner", "/planner"],
      ["cookbook", "/cookbook"],
      ["pantry", "/pantry"],
      ["diary", "/my-diary"],
      ["orchard", "/orchard"],
    ] as const;
    const backgrounds: Record<string, string> = {};
    for (const [slug, route] of rooms) {
      const page = await open(ctx, route);
      const header = page.locator("header.shell-header").first();
      backgrounds[slug] = await header
        .evaluate((el) => getComputedStyle(el).backgroundColor)
        .catch(() => "MISSING");
      // The brand relief is in every room's header, at one size (UI Principle 4).
      const mark = await page.locator('[data-testid="link-workspace-brand"] .brand-mark').first().boundingBox();
      check(mark !== null && mark.width > 0, `${slug}: the brand relief is present in the header`);
      await page.close();
    }
    const distinct = new Set(Object.values(backgrounds));
    check(
      distinct.size === 1,
      "the header is the SAME material in all six rooms",
      JSON.stringify(backgrounds),
    );
    check(!Object.values(backgrounds).includes("MISSING"), "every room mounts the shared shell header");
    await ctx.close();
  }

  // ── 5. THE COMPANION ──────────────────────────────────────────────────────
  console.log("\n5. THE COMPANION — the mark, not a chat bubble");
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
    if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
    const page = await open(ctx, "/planner");
    const emblem = await page.locator('[data-testid="companion-emblem"]').boundingBox();
    check(emblem !== null && emblem.width > 0, "the Companion wears the carved apple emblem");
    const state = await page
      .locator('[data-testid="button-open-assistant"]')
      .getAttribute("data-companion-state");
    check(state !== null, "the emblem declares a presence state", `got ${state}`);
    // UX3 AMENDED THIS ASSERTION, and the amendment is the point rather than a
    // convenience. It read `state === "idle"`, which was correct on the day it was
    // written for a reason that has since stopped being true: UX2 defined `aware`
    // in CSS and deliberately never set it, so "at rest" could only ever mean idle.
    //
    // UX3 wired `aware` to the Notice Engine on an owner ruling, so a Companion
    // holding something to say is now a REST state too — and the assertion's real
    // subject was never the string. It was COMP1 § 7: at rest the Companion shows
    // PRESENCE, never urgency. Both resting states satisfy that; `speaking` and
    // `listening` are the two that must not appear unprompted, so they are what
    // this now excludes by name.
    check(
      state === "idle" || state === "aware",
      "at rest it is idle or aware — presence, never urgency (COMP1 § 7)",
      `got ${state}`,
    );
    // COMP1 § 6: the light must not reach under the nav or clip the screen edge.
    const light = await page.locator(".companion-light").first().boundingBox();
    const vp = page.viewportSize()!;
    if (light) {
      check(light.x + light.width <= vp.width + 1, "its light does not spill past the screen edge");
    }
    await page.close();
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${"─".repeat(60)}`);
  console.log(`UX2 experience language: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
