/**
 * Capture the CURRENT THA interface as visual evidence (UX_CURRENT_INTERFACE_VISUAL_EVIDENCE).
 *
 *   LD_LIBRARY_PATH=<chromium-libs> npx tsx scripts/capture-ux-evidence.ts
 *
 * Purpose: photograph the product as it exists today, at desktop and mobile
 * widths, so a design direction can be argued from the real interface rather
 * than from memory. It recommends nothing and changes nothing.
 *
 * ZERO-WRITE. It writes only into docs/ui-audit/current-interface-snapshots/.
 * It performs no database write of any kind, creates no account, and invents no
 * production data. The one interaction that would normally write (the click behind
 * the success toast) has its POST intercepted and answered in the browser, so the
 * toast renders and the write never reaches the server.
 *
 * Sessions — both are pre-existing, fictional, DEV-only households.
 *   - household  : a **Development World** household (documented shared DEV password).
 *                  The richest realistic data THA has: planner, pantry, diary.
 *   - benchmark  : a seeded **benchmark** household. Used only because it already owns
 *                  a real 7-item shopping list, which no Development World household
 *                  does — dev-world shopping lists are derived on demand, never seeded.
 *   - public     : no session.
 *
 * On induced states. Loading, error and unresolved cannot be reached by looking at a
 * healthy surface, and the data that would produce them does not exist on any household
 * this script can authenticate as. They are therefore induced **in the browser only**, by
 * intercepting the API response the client receives (Playwright page.route). The
 * unresolved shot flips review flags on the benchmark household's OWN real items — no
 * item is invented. Nothing is persisted; the database is never written. Every such shot
 * is marked `induced` in the manifest with its exact mechanism. A shot NOT marked
 * `induced` is the product in its natural state.
 *
 * Admin surfaces are NOT captured — by explicit decision, to avoid the temporary
 * privilege change that reaching them would require. Recorded, not hidden.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/ui-audit/current-interface-snapshots");

// The Development World household this evidence is captured from. Fictional,
// DEV-only, already imported. Password is the documented shared DEV password
// (scripts/import-development-world.ts:106, DEVWORLD2 §"Shared DEV password").
const DW_USER = "price.single.parent.owner@dev.thehealthyapples.dev";
const DW_PASS = process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";

// A second fictional household — a seeded BENCHMARK household. Used only because it
// already owns a real 7-item shopping list, which no Development World household does
// (dev-world shopping lists are derived on demand and are never seeded).
const BM_USER = "john.harris.auto@benchmark.thehealthyapples.dev";
const BM_PASS = process.env.BENCHMARK_WORLD_PASSWORD ?? "BenchmarkWorld!2026";

// A real meal in that household's plan (Golden Potato, Chickpea & Spinach Curry).
const MEAL_ID = 3653;

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

type Session = "public" | "household" | "benchmark";
type Rec = {
  file: string | null;
  route: string;
  viewport: string;
  state: string;
  component: string;
  session: Session;
  induced: string | null;
  ok: boolean;
  note?: string;
};
const records: Rec[] = [];

function label(v: { width: number; height: number }) {
  return `${v.width === DESKTOP.width ? "desktop" : "mobile"}-${v.width}`;
}

async function settle(page: Page, ms = 1600) {
  await page.waitForTimeout(ms);
}

/** Full-page + above-the-fold pair, the WX9A convention. */
async function shootPage(
  page: Page,
  id: string,
  meta: Omit<Rec, "file" | "viewport" | "ok"> & { viewport: { width: number; height: number } },
) {
  const vp = label(meta.viewport);
  for (const mode of ["fold", "full"] as const) {
    const file = `${id}-${vp}-${mode}.png`;
    try {
      await page.screenshot({ path: resolve(OUT, file), fullPage: mode === "full" });
      records.push({ ...meta, viewport: `${meta.viewport.width}x${meta.viewport.height}`, file, ok: true });
      console.log(`  ✓ ${file}`);
    } catch (e: any) {
      records.push({
        ...meta,
        viewport: `${meta.viewport.width}x${meta.viewport.height}`,
        file: null,
        ok: false,
        note: e.message.split("\n")[0],
      });
      console.log(`  ✗ ${file} — ${e.message.split("\n")[0]}`);
    }
  }
}

/** A single element close-up (buttons, cards, search, nav). */
async function shootEl(
  page: Page,
  id: string,
  selector: string,
  meta: Omit<Rec, "file" | "viewport" | "ok"> & { viewport: { width: number; height: number } },
) {
  const file = `${id}-${label(meta.viewport)}.png`;
  const base = { ...meta, viewport: `${meta.viewport.width}x${meta.viewport.height}` };
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: "visible", timeout: 6000 });
    await el.screenshot({ path: resolve(OUT, file) });
    records.push({ ...base, file, ok: true });
    console.log(`  ✓ ${file}`);
  } catch (e: any) {
    records.push({ ...base, file: null, ok: false, note: `selector "${selector}" not found/visible` });
    console.log(`  ✗ ${file} — selector not found: ${selector}`);
  }
}

async function goto(page: Page, route: string) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30_000 });
}

async function login(ctx: BrowserContext) {
  const r = await ctx.request.post(`${BASE}/api/login`, { data: { username: DW_USER, password: DW_PASS } });
  if (!r.ok()) throw new Error(`dev-world login failed: ${r.status()}`);
}

/**
 * A second fictional household — a **benchmark** household, already seeded, which
 * (unlike the Development World households) owns a real shopping list of 7 items.
 * It is what makes the populated Shopping surface and the unresolved state capturable
 * from data that already exists, instead of from data we would have had to invent.
 */
async function benchmarkContext(browser: Browser, viewport: { width: number; height: number }) {
  const ctx = await browser.newContext({ viewport });
  const r = await ctx.request.post(`${BASE}/api/login`, { data: { username: BM_USER, password: BM_PASS } });
  if (!r.ok()) throw new Error(`benchmark login failed: ${r.status()}`);
  return ctx;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser: Browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  // ─────────────────────────────────────────────────────────── SURFACES
  // Every named surface, both widths, natural state, real Development World data.
  const SURFACES: { id: string; route: string; name: string }[] = [
    { id: "01-home", route: "/home", name: "Home" },
    { id: "02-planner", route: "/planner", name: "Planner" },
    { id: "03-cookbook", route: "/cookbook", name: "Cookbook" },
    { id: "04-meal-detail", route: `/meals/${MEAL_ID}`, name: "Meal detail" },
    { id: "05-shopping", route: "/shopping-workspace", name: "Shopping workspace" },
    { id: "06-pantry", route: "/pantry", name: "Pantry" },
    { id: "07-nutrition", route: "/plant-diversity", name: "Nutrition (Plant Diversity)" },
    { id: "08-profile", route: "/profile", name: "Profile / Household" },
    { id: "09-diary", route: "/my-diary", name: "My Diary" },
    { id: "10-analyser", route: "/analyser", name: "Analyser" },
    { id: "11-dashboard", route: "/dashboard", name: "Dashboard (legacy home)" },
    { id: "12-partners", route: "/partners", name: "Partners" },
    { id: "13-basket", route: "/basket", name: "Basket / Analyse basket" },
  ];

  for (const vp of [DESKTOP, MOBILE]) {
    const ctx = await browser.newContext({ viewport: vp });
    await login(ctx);
    const page = await ctx.newPage();
    console.log(`\n── Surfaces @ ${label(vp)} (Development World household)`);
    for (const s of SURFACES) {
      await goto(page, s.route);
      await settle(page);
      await shootPage(page, s.id, {
        route: s.route,
        state: "populated (natural)",
        component: s.name,
        session: "household",
        induced: null,
        viewport: vp,
      });
    }
    await ctx.close();
  }

  // Public surfaces
  for (const vp of [DESKTOP, MOBILE]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    console.log(`\n── Public surfaces @ ${label(vp)}`);
    for (const s of [
      { id: "14-landing", route: "/", name: "Landing (logged out)", state: "populated (natural)" },
      { id: "15-auth", route: "/auth", name: "Sign in — form", state: "form (natural)" },
      { id: "16-not-found", route: "/this-route-does-not-exist", name: "Not Found", state: "error — 404 (natural)" },
    ]) {
      await goto(page, s.route);
      await settle(page);
      await shootPage(page, s.id, {
        route: s.route,
        state: s.state,
        component: s.name,
        session: "public",
        induced: null,
        viewport: vp,
      });
    }
    await ctx.close();
  }

  // ─────────────────────────────────────────── COMPONENTS & INTERACTIONS
  for (const vp of [DESKTOP, MOBILE]) {
    const ctx = await browser.newContext({ viewport: vp });
    await login(ctx);
    const page = await ctx.newPage();
    console.log(`\n── Components & interactions @ ${label(vp)}`);

    // Companion — floating assistant drawer (mounted on every authed surface).
    await goto(page, "/home");
    await settle(page);
    await shootEl(page, "20-companion-fab", '[aria-label="Open Apple assistant"]', {
      route: "/home",
      state: "closed (natural)",
      component: "FloatingAssistant — FAB",
      session: "household",
      induced: null,
      viewport: vp,
    });
    try {
      await page.click('[aria-label="Open Apple assistant"]', { timeout: 6000 });
      await settle(page, 2000);
      await shootPage(page, "21-companion-open", {
        route: "/home",
        state: "open (natural)",
        component: "FloatingAssistant — Companion drawer",
        session: "household",
        induced: null,
        viewport: vp,
      });
      await page.keyboard.press("Escape");
      await settle(page, 700);
    } catch {
      console.log("  ✗ companion drawer — FAB not clickable");
      records.push({
        file: null, route: "/home", viewport: `${vp.width}x${vp.height}`,
        state: "open", component: "FloatingAssistant — Companion drawer",
        session: "household", induced: null, ok: false, note: "FAB not clickable",
      });
    }

    // Workspace: large panel on desktop, bottom sheet / drawer on mobile.
    // Opened via the app's own repeat-tap mechanism (nav-bar.tsx:694).
    await goto(page, "/cookbook");
    await settle(page);
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent("tha:open-workspace", { detail: { href: "/cookbook" } })),
    );
    await settle(page, 1800);
    await shootPage(page, vp.width === DESKTOP.width ? "22-workspace-large" : "23-mobile-bottom-sheet", {
      route: "/cookbook",
      state: "open (natural)",
      component:
        vp.width === DESKTOP.width
          ? "CookbookWorkspacePanel — large workspace (Overlay → Dialog)"
          : "CookbookWorkspacePanel — mobile bottom sheet (Overlay → Drawer)",
      session: "household",
      induced: null,
      viewport: vp,
    });
    await page.keyboard.press("Escape");
    await settle(page, 700);

    // Meal card, insight card, search, buttons, bottom nav.
    // Meal card + the primary/secondary buttons that live on it.
    await goto(page, "/cookbook");
    await settle(page, 2200);
    await shootEl(page, "24-meal-card", '[data-testid^="card-meal-"]', {
      route: "/cookbook", state: "populated (natural)", component: "MealCard",
      session: "household", induced: null, viewport: vp,
    });
    // Buttons. On DESKTOP the meal card exposes its primary/secondary actions
    // inline. On MOBILE those same buttons are in the DOM but hidden — the actions
    // move into the meal action sheet — so the mobile close-ups come from there.
    // That difference is itself evidence and is recorded rather than smoothed over.
    if (vp.width === DESKTOP.width) {
      await shootEl(page, "27a-button-primary", '[data-testid^="button-add-to-list-"]', {
        route: "/cookbook", state: "default (natural)",
        component: 'Button variant="default" (primary) — "Add to list", inline on the meal card',
        session: "household", induced: null, viewport: vp,
      });
      await shootEl(page, "27b-button-secondary", '[data-testid^="button-freeze-"]', {
        route: "/cookbook", state: "default (natural)",
        component: "Button — secondary/outline variant, inline on the meal card",
        session: "household", induced: null, viewport: vp,
      });
    } else {
      try {
        await page.locator('[data-testid^="button-card-actions-"]').first().click({ timeout: 6000 });
        await settle(page, 1500);
      } catch { /* recorded below */ }
      await shootEl(page, "27a-button-primary", '[data-testid^="sheet-action-shopping-"]', {
        route: "/cookbook", state: "default (natural)",
        component: "Button — primary action inside the meal action sheet (the inline card buttons are HIDDEN at this width)",
        session: "household", induced: null, viewport: vp,
      });
      await shootEl(page, "27b-button-secondary", '[data-testid^="sheet-action-freeze-"]', {
        route: "/cookbook", state: "default (natural)",
        component: "Button — secondary action inside the meal action sheet",
        session: "household", induced: null, viewport: vp,
      });
      await page.keyboard.press("Escape");
      await settle(page, 800);
    }

    // Search. Desktop uses the canonical header input (data-testid=input-workspace-search).
    // Mobile has a toggle that reveals a SEPARATE visible input; the canonical one
    // stays hidden. Captured as the app actually behaves at each width.
    await goto(page, "/cookbook"); // fresh page — any overlay from the step above is gone
    await settle(page, 2200);
    if (vp.width === MOBILE.width) {
      try {
        await page.click('[data-testid="button-workspace-mobile-search"]', { timeout: 4000 });
        await settle(page, 1200);
      } catch { /* recorded below */ }
      await shootEl(page, "25-search", '[data-testid="input-workspace-search-mobile"]', {
        route: "/cookbook",
        state: "expanded via mobile search toggle (natural)",
        component:
          'WorkspaceHeader — mobile search. NOTE: this is a SECOND search input (input-workspace-search-mobile); the desktop one (input-workspace-search) is in the DOM at this width but hidden. Two inputs own one concern.',
        session: "household", induced: null, viewport: vp,
      });
    } else {
      await shootEl(page, "25-search", '[data-testid="input-workspace-search"]', {
        route: "/cookbook",
        state: "empty input (natural)",
        component: "WorkspaceHeader — canonical search",
        session: "household", induced: null, viewport: vp,
      });
    }

    // Insight cards. Home's intelligence surfaces are the reminder + plant-diversity cards.
    await goto(page, "/home");
    await settle(page);
    await shootEl(page, "26a-insight-card-reminders", '[data-testid="card-home-reminders"]', {
      route: "/home", state: "populated (natural)", component: 'Home intelligence card — "A gentle reminder"',
      session: "household", induced: null, viewport: vp,
    });
    await shootEl(page, "26b-insight-card-plants", '[data-testid="card-home-plant-diversity"]', {
      route: "/home", state: "populated — 0 of 30 plants (natural)", component: "Home intelligence card — Plant Diversity",
      session: "household", induced: null, viewport: vp,
    });
    if (vp.width === MOBILE.width) {
      await shootEl(page, "28-bottom-nav", '[data-testid="mobile-bottom-nav"]', {
        route: "/home", state: "default (natural)", component: "BottomNav — primary navigation (all breakpoints)",
        session: "household", induced: null, viewport: vp,
      });
    }

    // Forms. THA has almost no HTML <form>: Profile is rows + switches, not a form.
    // The genuine form in the product is the sign-in page (react-hook-form).
    await goto(page, "/profile");
    await settle(page);
    await shootEl(page, "29a-profile-settings-rows", '[data-testid="card-goals"]', {
      route: "/profile", state: "populated (natural)", component: "Profile settings rows (NOT an HTML <form>)",
      session: "household", induced: null, viewport: vp,
    });
    await shootEl(page, "29b-profile-toggles", '[data-testid="card-feature-toggles"]', {
      route: "/profile", state: "populated (natural)", component: "Profile feature toggles — Switch controls",
      session: "household", induced: null, viewport: vp,
    });

    await ctx.close();
  }

  // ─────────────────────────────────────────────────────────────── STATES
  for (const vp of [DESKTOP, MOBILE]) {
    console.log(`\n── States @ ${label(vp)}`);

    // LOADING — hold every API response open so the skeletons stay on screen.
    {
      const ctx = await browser.newContext({ viewport: vp });
      await login(ctx);
      const page = await ctx.newPage();
      await page.route("**/api/**", async (route) => {
        await new Promise((r) => setTimeout(r, 15_000));
        await route.continue();
      });
      page.goto(`${BASE}/home`, { waitUntil: "commit" }).catch(() => {});
      await page.waitForTimeout(2500);
      await shootPage(page, "30-loading", {
        route: "/home",
        state: "loading — Skeleton / RouteFallback",
        component: "ui/skeleton.tsx, App.tsx RouteFallback",
        session: "household",
        induced: "page.route delayed every /api/** response by 15s — browser-only, nothing persisted",
        viewport: vp,
      });
      await ctx.close();
    }

    // ERROR — the DESIGNED error state, which is per-SECTION, not per-page. Failing a
    // single section's endpoint is what actually renders LoadError ("We couldn't load…"
    // + Try again) inside an otherwise healthy page. Failing everything does not — see
    // 31b below.
    {
      const ctx = await browser.newContext({ viewport: vp });
      await login(ctx);
      const page = await ctx.newPage();
      await page.route("**/api/home/intelligence**", (route) =>
        route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"induced"}' }),
      );
      await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded" }).catch(() => {});
      await settle(page, 5000);
      await shootPage(page, "31-error", {
        route: "/home",
        state: "error — designed LoadError, one section failed, rest of page healthy",
        component: 'ui/load-error.tsx ("We couldn\'t load…" + Try again), error-boundary.tsx',
        session: "household",
        induced:
          "page.route returned HTTP 500 for /api/home/intelligence only — every other endpoint healthy. Browser-only, nothing persisted",
        viewport: vp,
      });
      await ctx.close();
    }

    // ERROR (total) — what the product does when EVERY api call fails. The answer is a
    // BLANK WHITE PAGE: the shell never mounts, so no ErrorBoundary and no LoadError is
    // ever reached. Verified to be true even with /api/user left healthy, and on
    // /dashboard and /pantry as well as /home. Captured as evidence of a state with no
    // owner. Recorded, not diagnosed — this document recommends nothing.
    {
      const ctx = await browser.newContext({ viewport: vp });
      await login(ctx);
      const page = await ctx.newPage();
      await page.route("**/api/**", (route) =>
        route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"induced"}' }),
      );
      await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded" }).catch(() => {});
      await settle(page, 4500);
      await shootPage(page, "31b-error-total-api-failure", {
        route: "/home",
        state: "error — TOTAL API failure (session lost): renders a blank white page, no designed state",
        component: "(none — no owner for this state)",
        session: "household",
        induced: "page.route returned HTTP 500 for every /api/** including /api/user — browser-only, nothing persisted",
        viewport: vp,
      });
      await ctx.close();
    }

    // EMPTY — two kinds. Shopping is genuinely empty for this household (natural).
    // Cookbook with a no-match query is the "filtered" variant.
    {
      const ctx = await browser.newContext({ viewport: vp });
      await login(ctx);
      const page = await ctx.newPage();
      await goto(page, "/shopping-workspace");
      await settle(page);
      await shootPage(page, "32-empty-shopping", {
        route: "/shopping-workspace",
        state: "empty (NATURAL — this household has no shopping list)",
        component: "ui/empty-state.tsx (variant=empty)",
        session: "household",
        induced: null,
        viewport: vp,
      });
      await goto(page, "/cookbook?q=zzzzqqqxnotathing");
      await settle(page, 2200);
      await shootPage(page, "33-empty-filtered", {
        route: "/cookbook?q=zzzzqqqxnotathing",
        state: "empty — filtered / no results (natural: real search, no matches)",
        component: "ui/empty-state.tsx (variant=filtered)",
        session: "household",
        induced: null,
        viewport: vp,
      });
      await ctx.close();
    }

    // SHOPPING (populated) — the benchmark household owns a real 7-item list, so the
    // Shopping and Basket surfaces can be photographed with content rather than empty.
    {
      const ctx = await benchmarkContext(browser, vp);
      const page = await ctx.newPage();
      for (const s of [
        { id: "05b-shopping-populated", route: "/shopping-workspace", name: "Shopping workspace — populated" },
        { id: "13b-basket-populated", route: "/basket", name: "Basket — populated" },
      ]) {
        await goto(page, s.route);
        await settle(page, 2500);
        await shootPage(page, s.id, {
          route: s.route,
          state: "populated (natural — 7 real seeded items)",
          component: s.name,
          session: "benchmark",
          induced: null,
          viewport: vp,
        });
      }
      await ctx.close();
    }

    // UNRESOLVED + WARNING — needs_review shopping items. No household this script can
    // authenticate as has any (the 12 that exist belong to accounts whose passwords are
    // unknown). Induced by rewriting the GET /api/shopping-list response in the browser:
    // the benchmark household's OWN 7 real items, with the review flags flipped on 3 of
    // them. No item is invented and nothing is persisted.
    {
      const ctx = await benchmarkContext(browser, vp);
      const page = await ctx.newPage();
      await page.route("**/api/shopping-list**", async (route) => {
        if (route.request().method() !== "GET") return route.continue();
        const res = await route.fetch();
        let body: any;
        try {
          body = await res.json();
        } catch {
          return route.fulfill({ response: res });
        }
        const items = Array.isArray(body) ? body : body?.items;
        if (Array.isArray(items)) {
          items.slice(0, 3).forEach((it: any) => {
            it.needsReview = true;
            it.reviewReason = "ambiguous_term";
            it.resolutionState = "unresolved";
          });
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
      await goto(page, "/basket");
      await settle(page, 3000);
      await shootPage(page, "34-unresolved", {
        route: "/basket",
        state: "unresolved / warning — 'Needs attention' items (needsReview)",
        component: "ShoppingListView — Needs attention section, amber warning treatment",
        session: "benchmark",
        induced:
          "page.route rewrote GET /api/shopping-list, setting needsReview=true + reviewReason='ambiguous_term' on 3 of the household's OWN 7 real items — browser-only, nothing invented, nothing persisted",
        viewport: vp,
      });
      await ctx.close();
    }

    // SUCCESS — a real toast from a real click ("Add to basket" on a meal card).
    // That one click writes to TWO endpoints — POST /api/user-basket AND
    // POST /api/shopping-list/from-meals — and BOTH are intercepted and answered
    // locally with 200. The toast is genuine UI; neither write reaches the server.
    // (/api/nutrition/bulk is deliberately NOT intercepted: the Cookbook will not
    // render its cards without it.)
    {
      const ctx = await benchmarkContext(browser, vp);
      const page = await ctx.newPage();
      const swallowWrite = (route: any) => {
        if (route.request().method() === "GET") return route.continue();
        return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      };
      await page.route("**/api/user-basket**", swallowWrite);
      await page.route("**/api/shopping-list**", swallowWrite);
      await page.route("**/api/shopping-list/**", swallowWrite);

      await goto(page, "/cookbook");
      await settle(page, 3000);
      try {
        // Desktop: the action is inline on the card.
        // Mobile: it is hidden — the same action lives in the meal action sheet.
        if (vp.width === MOBILE.width) {
          await page.locator('[data-testid^="button-card-actions-"]').first().click({ timeout: 8000 });
          await settle(page, 1500);
          await page.locator('[data-testid^="sheet-action-shopping-"]').first().click({ timeout: 8000 });
        } else {
          await page.locator('[data-testid^="button-add-basket-"]').first().click({ timeout: 8000 });
        }
        await settle(page, 1800);

        // The add does not go straight to a toast: it first asks WHO is eating
        // ("Who's eating this meal?"). Capture that modal, then confirm it — the
        // toast only appears on the far side of it.
        if ((await page.locator('[role="dialog"]').count()) > 0) {
          await shootPage(page, "38-audience-modal", {
            route: "/cookbook",
            state: "open (natural)",
            component: '"Who\'s eating this meal?" — audience-selection modal, shown BEFORE the add completes',
            session: "benchmark",
            induced: null,
            viewport: vp,
          });
          await page.locator('[role="dialog"] button:has-text("Add")').last().click({ timeout: 8000 });
        }
        await settle(page, 1200);
        await shootPage(page, "35-success-toast", {
          route: "/cookbook",
          state: 'success feedback — toast ("Added to basket")',
          component: "ui/toaster.tsx, ui/toast.tsx (CheckCircle2, primary, 2500ms)",
          session: "benchmark",
          induced:
            'real UI interaction ("Add to basket" on a meal card). Both writes it fires (POST /api/user-basket and POST /api/shopping-list/from-meals) were intercepted and answered locally with 200 — the toast is genuine, neither write reached the server, nothing persisted',
          viewport: vp,
        });
      } catch {
        records.push({
          file: null, route: "/cookbook", viewport: `${vp.width}x${vp.height}`,
          state: "success feedback — toast", component: "ui/toaster.tsx",
          session: "benchmark", induced: null, ok: false,
          note: "could not trigger a toast",
        });
        console.log("  ✗ success toast — could not trigger");
      }
      await ctx.close();
    }

    // COMPACT MODAL — "Add to week" from a meal card (dialog-foundation compact).
    // Plus the meal action sheet, which is the canonical mobile bottom sheet.
    {
      const ctx = await browser.newContext({ viewport: vp });
      await login(ctx);
      const page = await ctx.newPage();
      await goto(page, "/cookbook");
      await settle(page, 2500);
      try {
        // Same split as the toast: inline on desktop, inside the action sheet on mobile.
        if (vp.width === MOBILE.width) {
          await page.locator('[data-testid^="button-card-actions-"]').first().click({ timeout: 6000 });
          await settle(page, 1500);
          await page.locator('[data-testid^="sheet-action-planner-"]').first().click({ timeout: 6000 });
        } else {
          await page.locator('[data-testid^="button-add-planner-"]').first().click({ timeout: 6000 });
        }
        await settle(page, 1800);
        const shown = await page.locator('[role="dialog"]').count();
        if (!shown) throw new Error("no dialog");
        await shootPage(page, "36-compact-modal", {
          route: "/cookbook",
          state: "open (natural)",
          component: "AddToWeekModal — compact modal (ui/dialog-foundation.ts)",
          session: "household",
          induced: null,
          viewport: vp,
        });
        await page.keyboard.press("Escape");
        await settle(page, 800);
      } catch {
        records.push({
          file: null, route: "/cookbook", viewport: `${vp.width}x${vp.height}`,
          state: "open", component: "AddToWeekModal — compact modal",
          session: "household", induced: null, ok: false,
          note: "add-to-planner modal did not open",
        });
        console.log("  ✗ compact modal — did not open");
      }

      // Meal action sheet — the explicit bottom-sheet/drawer pattern. It is
      // MOBILE-ONLY: at desktop width button-card-actions is not rendered at all,
      // because the card shows its actions inline instead. Recorded, not treated
      // as a failure.
      if (vp.width === MOBILE.width) {
        try {
          await goto(page, "/cookbook"); // fresh page — the modal above is fully gone
          await settle(page, 2200);
          await page.locator('[data-testid^="button-card-actions-"]').first().click({ timeout: 6000 });
          await settle(page, 1600);
          await shootPage(page, "37-meal-action-sheet", {
            route: "/cookbook",
            state: "open (natural)",
            component: "Meal action sheet — drawer-meal-action-sheet (vaul Drawer). MOBILE ONLY.",
            session: "household",
            induced: null,
            viewport: vp,
          });
        } catch {
          records.push({
            file: null, route: "/cookbook", viewport: `${vp.width}x${vp.height}`,
            state: "open", component: "Meal action sheet",
            session: "household", induced: null, ok: false,
            note: "meal action sheet did not open",
          });
          console.log("  ✗ meal action sheet — did not open");
        }
      }
      await ctx.close();
    }
  }

  await browser.close();

  const ok = records.filter((r) => r.ok).length;
  writeFileSync(
    resolve(OUT, "manifest.json"),
    JSON.stringify(
      {
        captured_for: "UX_CURRENT_INTERFACE_VISUAL_EVIDENCE",
        base_url: BASE,
        zero_write: "No database write of any kind. No account created. No production data invented.",
        sessions: {
          household: { world: "Development World", account: DW_USER, note: "fictional, DEV-only, already imported" },
          benchmark: { world: "Benchmark", account: BM_USER, note: "fictional, seeded; the only household with a real shopping list" },
          public: "no session",
        },
        viewports: { desktop: DESKTOP, mobile: MOBILE },
        admin: "NOT CAPTURED — requires an admin session; skipped by explicit decision to avoid a privilege change.",
        captured: ok,
        failed: records.length - ok,
        shots: records,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`\n  ${ok}/${records.length} shots captured → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
