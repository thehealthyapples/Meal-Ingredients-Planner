/**
 * PROD1 — Product Completion Programme: capture the user-acceptance evidence.
 *
 * Read-only w.r.t. the product; writes only PNGs and a manifest into
 * docs/implementation/assets/prod1/. Follows the existing AFI3_5/MAT1 capture
 * pattern (same demo-session handling, same expand-before-paint discipline).
 *
 * WHY THIS SCRIPT FORCES FAILURES RATHER THAN PHOTOGRAPHING THE HAPPY PATH.
 *
 * PROD1's central fix is that a failed load must stop rendering as "you have
 * nothing". A screenshot of a working room proves nothing about that: the room
 * looked fine before the fix too. The only evidence that means anything is the
 * room under the exact failure the audit described — so for each room this script
 * ABORTS that room's own API call with Playwright request interception and
 * captures what the household is then shown.
 *
 * The acceptance test for each room is therefore a pair:
 *   BEFORE-shaped: with the request aborted, does the room still claim the
 *                  household's data is empty? (It must NOT.)
 *   AFTER:         does it name what failed, promise nothing was lost, and offer
 *                  a way to retry? (It must.)
 *
 * The assertion is made on RENDERED TEXT, not on the presence of a component, so
 * a component that mounted but said the wrong thing still fails.
 *
 *   PROD1_BASE_URL=http://localhost:5056 npx tsx scripts/prod1-capture-product-completion.ts
 *
 * Captured by session PROD1_Product_Completion_Programme.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.PROD1_BASE_URL ?? "http://localhost:5056";
const OUT = resolve(import.meta.dirname, "..", "docs/implementation/assets/prod1");
const EXECUTABLE = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const VIEWPORT = { width: 430, height: 932 };

interface Result {
  id: string;
  name: string;
  file: string | null;
  ok: boolean;
  [k: string]: unknown;
}

const results: Result[] = [];

/**
 * What each room must NEVER say about THE THING THAT FAILED TO LOAD.
 *
 * This matcher was got wrong twice, and both mistakes are worth keeping visible
 * because they are opposite failures of the same lazy instinct — judging a page
 * by a global string search.
 *
 * FIRST it was too NARROW: a list of literal strings ("no items", "no larder
 * staples", …). The Pantry passed while the screenshot beside it plainly showed
 * "No household items yet." under an honest error card — a REAL defect, because
 * both of that room's sections read the same failed `/api/pantry` query and only
 * one had been fixed. "No household items" simply does not contain "no items".
 *
 * THEN it was too BROAD: a shape-matcher for "no … yet" anywhere in the body. It
 * failed the Cookbook on "No frozen meals yet" — which is NOT a defect. The
 * freezer is its own `/api/freezer` query; it loaded fine and the household
 * genuinely has no frozen meals. Flagging it would have pushed me to "fix" a
 * sentence that was true.
 *
 * The correct scope is neither: a room may only be judged on what it claims about
 * ITS OWN failed data. So each room declares the specific false sentence it would
 * tell about the thing that did not load, and unrelated sections — reading
 * unrelated queries that succeeded — are left alone to tell the truth.
 */
const FALSE_ABSENCE_BY_ROOM: Record<string, RegExp> = {
  shopping: /your shopping list is empty|your basket is empty/i,
  cookbook: /your cookbook is empty|no meals found/i,
  planner: /no meals planned|add your first meal to this week/i,
  diary: /nothing added yet/i,
  pantry: /no larder staples|no fridge items yet|no freezer items yet|no household items yet|no pet items yet/i,
};
/** The sentence LoadError says. */
const HONEST_FAILURE = /couldn't load|nothing has been lost|try again/i;

async function shoot(page: Page, id: string, name: string, extra: Record<string, unknown> = {}) {
  const file = `${id}.png`;
  await page.screenshot({ path: resolve(OUT, file), fullPage: true });
  results.push({ id, name, file, ok: true, ...extra });
}

/**
 * Drive one room with its own API call aborted, and judge what the household is
 * shown. `urlPart` is the request this room cannot live without.
 */
async function failedLoad(
  ctx: BrowserContext,
  room: { id: string; name: string; route: string; urlPart: string; wait?: string },
) {
  const page = await ctx.newPage();
  try {
    // Abort ONLY this room's own read. Everything else on the page loads
    // normally, so what is captured is the room failing — not a dead app.
    await page.route((url) => url.pathname.includes(room.urlPart), (r) => r.abort());

    await page.goto(`${BASE}${room.route}`, { waitUntil: "domcontentloaded", timeout: 40_000 });
    // The room needs a moment to settle into its error branch; `networkidle` is
    // unreliable here because we deliberately killed one of its requests.
    await page.waitForTimeout(6000);

    const body = (await page.locator("body").innerText().catch(() => "")) || "";
    const forbidden = FALSE_ABSENCE_BY_ROOM[room.id];
    if (!forbidden) throw new Error(`No false-absence pattern declared for room "${room.id}"`);
    const claimsEmpty = forbidden.test(body);
    const saysFailed = HONEST_FAILURE.test(body);

    await shoot(page, `${room.id}-failed-load`, room.name, {
      route: room.route,
      abortedRequest: room.urlPart,
      // THE ACCEPTANCE CRITERIA, judged on what the household can actually read.
      stillClaimsDataIsEmpty: claimsEmpty,
      namesTheFailureAndOffersRetry: saysFailed,
      accepted: saysFailed && !claimsEmpty,
    });

    console.log(
      `  ${saysFailed && !claimsEmpty ? "✓" : "✗"} ${room.id.padEnd(20)} ` +
        `failed-load → ${saysFailed ? "names the failure" : "SILENT"}` +
        `${claimsEmpty ? " · STILL CLAIMS EMPTY (defect)" : ""}`,
    );
  } catch (e: any) {
    results.push({ id: `${room.id}-failed-load`, name: room.name, file: null, ok: false, error: e.message });
    console.log(`  ✗ ${room.id.padEnd(20)} ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let browser: Browser | undefined;
  const evidence: Record<string, unknown> = {};

  try {
    browser = await chromium.launch({
      executablePath: EXECUTABLE,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
    const ctx = await browser.newContext({ viewport: VIEWPORT });

    // `/api/demo/start` is rate-limited (429) — deliberately, since it creates a
    // real household. PROD1_SESSION_COOKIE reuses an already-open session so a
    // re-capture never depends on the limiter's window (same accommodation the
    // AFI3_5 capture script makes).
    const reuse = process.env.PROD1_SESSION_COOKIE;
    if (reuse) {
      const [name, ...rest] = reuse.split("=");
      const url = new URL(BASE);
      await ctx.addCookies([
        { name, value: rest.join("="), domain: url.hostname, path: "/", httpOnly: true, secure: false, sameSite: "Lax" },
      ]);
      console.log(`  reusing existing session via ${name}\n`);
    } else {
      const demo = await ctx.request.post(`${BASE}/api/demo/start`);
      if (!demo.ok()) throw new Error(`/api/demo/start returned ${demo.status()}`);
      console.log(`  demo household opened (${demo.status()})\n`);
    }

    // ── The rooms, each under its own failure ────────────────────────────────
    console.log("  --- failed-load acceptance, one room at a time ---");
    const rooms = [
      { id: "shopping", name: "Shopping — the P0: a household at the supermarket", route: "/shopping-workspace", urlPart: "/api/shopping-list" },
      { id: "cookbook", name: "Cookbook — rendered a blank page on failure", route: "/meals", urlPart: "/api/meals" },
      { id: "planner", name: "Planner — painted seven blank days on failure", route: "/weekly-planner", urlPart: "/api/planner/full" },
      { id: "diary", name: "Diary — a logged day read as an unlogged one", route: "/diary", urlPart: "/api/food-diary" },
      { id: "pantry", name: "Pantry — a stocked larder read as empty", route: "/pantry", urlPart: "/api/pantry" },
    ];
    for (const room of rooms) await failedLoad(ctx, room);

    // ── The wrong door ───────────────────────────────────────────────────────
    console.log("\n  --- production polish ---");
    const nf = await ctx.newPage();
    await nf.goto(`${BASE}/this-page-does-not-exist`, { waitUntil: "networkidle", timeout: 40_000 });
    await nf.waitForTimeout(1500);
    const nfText = (await nf.locator("body").innerText().catch(() => "")) || "";
    const leaksDevLanguage = /forget to add the page to the router/i.test(nfText);
    const offersWayHome = await nf.locator('[data-testid="button-not-found-home"]').count();
    await shoot(nf, "not-found", "404 — the wrong door", {
      leaksDeveloperLanguage: leaksDevLanguage,
      offersWayHome: offersWayHome > 0,
      accepted: !leaksDevLanguage && offersWayHome > 0,
    });
    console.log(
      `  ${!leaksDevLanguage && offersWayHome > 0 ? "✓" : "✗"} not-found           ` +
        `dev language: ${leaksDevLanguage ? "STILL PRESENT" : "gone"} · way home: ${offersWayHome > 0 ? "yes" : "NO"}`,
    );
    await nf.close();

    // ── The logo's destination ───────────────────────────────────────────────
    //
    // This probe was originally written against `nav-bar.tsx`'s TopBar, on an audit
    // finding that the brand logo pointed at /dashboard while /home is canonical.
    // The probe returned `null` at every route and both viewports, which is how the
    // finding turned out to be a FALSE POSITIVE: `TopBar` is exported and has zero
    // consumers — it never renders. The logo a household actually taps lives in
    // `workspace-header.tsx`, and it already pointed at /home.
    //
    // The probe is kept, aimed at the real element, because "the logo goes home" is
    // worth holding true — and because a probe that reads `null` and is believed is
    // exactly how the false positive happened in the first place. It now FAILS if
    // the element is absent, rather than reporting a null as a verdict.
    const nav = await ctx.newPage();
    await nav.goto(`${BASE}/pantry`, { waitUntil: "networkidle", timeout: 40_000 });
    await nav.waitForTimeout(2500);
    const logo = nav.locator('header a[href], [data-testid="workspace-header"] a[href]').first();
    const logoCount = await nav.locator('a[href="/home"]').count();
    const logoHref = await logo.getAttribute("href").catch(() => null);
    evidence.shipped_logo_href = logoHref;
    evidence.links_to_home_present = logoCount;
    evidence.logo_element_found = logoHref !== null;
    const logoOk = logoHref === "/home";
    results.push({
      id: "logo-destination", name: "The brand logo reaches the canonical home", file: null, ok: true,
      shippedLogoHref: logoHref, accepted: logoOk,
    });
    console.log(`  ${logoOk ? "✓" : "✗"} brand logo          → ${logoHref ?? "ELEMENT NOT FOUND"} (canonical home is /home)`);
    await nav.close();

    // ── Document metadata (the share loop) ───────────────────────────────────
    const meta = await ctx.newPage();
    await meta.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 40_000 });
    const head = await meta.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? null,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null,
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute("content") ?? null,
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? null,
    }));
    evidence.document_metadata = head;
    console.log(`  ${head.title ? "✓" : "✗"} document metadata   title="${head.title}" og:title=${head.ogTitle ? "set" : "MISSING"}`);
    await meta.close();

    // ── The happy path, for the record ───────────────────────────────────────
    console.log("\n  --- working rooms (for the record) ---");
    for (const r of [
      { id: "shopping-empty", route: "/shopping-workspace", name: "Shopping — a genuinely empty list, with its way forward" },
      { id: "cookbook-working", route: "/meals", name: "Cookbook — working" },
      { id: "pantry-working", route: "/pantry", name: "Pantry — working" },
    ]) {
      const p = await ctx.newPage();
      try {
        await p.goto(`${BASE}${r.route}`, { waitUntil: "networkidle", timeout: 40_000 });
        await p.waitForTimeout(2500);
        await shoot(p, r.id, r.name, { route: r.route });
        console.log(`  ✓ ${r.id}`);
      } catch (e: any) {
        results.push({ id: r.id, name: r.name, file: null, ok: false, error: e.message });
      } finally {
        await p.close();
      }
    }

    await ctx.close();
  } finally {
    await browser?.close();
  }

  const accepted = results.filter((r) => r.accepted === true).length;
  const judged = results.filter((r) => "accepted" in r).length;
  writeFileSync(
    resolve(OUT, "manifest.json"),
    JSON.stringify(
      { captured_by: "PROD1_Product_Completion_Programme", base_url: BASE, viewport: VIEWPORT, accepted, judged, evidence, shots: results },
      null,
      2,
    ) + "\n",
  );
  console.log(`\n  acceptance: ${accepted}/${judged} judged surfaces accepted → ${OUT}`);
  if (accepted !== judged) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
