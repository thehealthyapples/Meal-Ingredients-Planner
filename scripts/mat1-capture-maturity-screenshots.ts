/**
 * MAT1 — Platform Maturity & Trust: capture the production evidence.
 *
 * Read-only w.r.t. the product; writes only PNGs + a manifest into
 * docs/implementation/assets/mat1/. Follows the AFI3_5 capture pattern exactly
 * (same demo-session handling, same seeding poll, same expand-before-paint trick) —
 * this is not a new harness, it is the existing one pointed at MAT1's claims.
 *
 * WHAT THIS PROVES, and why each probe is here:
 *
 *   1. THE CANDIDATE-SET FIX (AFI_VERIFY1 §4.2 / MAT1 M1). The audit measured the
 *      engine generating 30 observations and delivering 10, with 20 discarded INSIDE
 *      the producer before LEARN1 could rank them — and the Pantry surface rendering
 *      EMPTY for a fully stocked pantry as a result. This script asks the live API
 *      for the delivered bundle AND records the per-domain spread, so the pantry
 *      domain either appears or is honestly recorded as absent. It never asserts a
 *      number it did not read.
 *
 *   2. THE DOMAIN LABELS (AFI_VERIFY1 §4.3 / MAT1 M2). Every delivered opportunity's
 *      domain is checked against the shared registry the card now renders from, so a
 *      card falling through to the generic "Food" is caught in the LIVE bundle and
 *      not only in the unit suite.
 *
 *   3. THE RETIRED LIMB (AFI_VERIFY1 §4.1 / MAT1 M3). `/api/household-nutrition` is
 *      probed to confirm it stays absent — the dead panel's only data source.
 *
 *   MAT1_BASE_URL=http://localhost:5055 npx tsx scripts/mat1-capture-maturity-screenshots.ts
 *
 * Captured by session MAT1_Platform_Maturity_And_Trust.
 */
import { chromium, type Browser, type BrowserContext } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { OPPORTUNITY_DOMAIN_LABELS } from "../shared/attention/index.js";

const BASE = process.env.MAT1_BASE_URL ?? "http://localhost:5055";
const OUT = resolve(import.meta.dirname, "..", "docs/implementation/assets/mat1");
const EXECUTABLE = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const VIEWPORT = { width: 430, height: 932 };

async function shoot(
  ctx: BrowserContext,
  s: { id: string; route: string; toggle?: string; wait?: string; name: string },
  results: any[],
) {
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle", timeout: 40_000 });
    // Record what ACTUALLY happened, not what was configured — a surface that never
    // appeared must not be reported as captured.
    const surfaceFound = s.wait
      ? await page.waitForSelector(s.wait, { timeout: 15_000 }).then(() => true).catch(() => false)
      : null;
    let toggled = false;
    if (s.toggle) {
      const btn = await page
        .waitForSelector(`[data-testid="${s.toggle}"]`, { timeout: 15_000 })
        .catch(() => null);
      if (btn) {
        if ((await btn.getAttribute("aria-expanded")) !== "true") {
          await btn.click();
          await page.waitForTimeout(600);
        }
        toggled = (await btn.getAttribute("aria-expanded")) === "true";
      }
    }
    await page.waitForTimeout(1200);
    const file = `${s.id}.png`;
    await page.screenshot({ path: resolve(OUT, file), fullPage: true });
    results.push({ ...s, file, status: resp?.status() ?? null, surfaceFound, toggled, ok: true });
    console.log(`  ✓ ${s.id.padEnd(30)} ${s.route}${surfaceFound === false ? "  (surface absent)" : ""}`);
  } catch (e: any) {
    results.push({ ...s, file: null, ok: false, error: e.message });
    console.log(`  ✗ ${s.id.padEnd(30)} ${s.route}  — ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let browser: Browser | undefined;
  const results: any[] = [];
  const evidence: Record<string, unknown> = {};

  try {
    browser = await chromium.launch({
      executablePath: EXECUTABLE,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
    const ctx = await browser.newContext({ viewport: VIEWPORT });

    // The ambient surface is collapsed by default (calm before capability) and reads
    // these keys in its `useState` initialiser — seeding them beats clicking, which
    // races the opportunity fetch.
    await ctx.addInitScript(() => {
      for (const k of ["home", "planner", "pantry", "shopping", "cookbook"]) {
        window.sessionStorage.setItem(`tha.ambient.${k}`, "1");
      }
    });

    const reuse = process.env.MAT1_SESSION_COOKIE;
    if (reuse) {
      const [name, ...rest] = reuse.split("=");
      const url = new URL(BASE);
      await ctx.addCookies([
        { name, value: rest.join("="), domain: url.hostname, path: "/", httpOnly: true, secure: false, sameSite: "Lax" },
      ]);
      console.log(`  reusing existing demo session via ${name}`);
    } else {
      const demo = await ctx.request.post(`${BASE}/api/demo/start`);
      if (!demo.ok()) throw new Error(`/api/demo/start returned ${demo.status()}`);
      console.log(`  demo household opened (${demo.status()})`);
    }

    // `/api/demo/start` returns as soon as the user row exists; the pantry, shopping
    // and cookbook seeding lands AFTER. Polling is what separates "this household has
    // no such observation" from "this household was not seeded yet".
    //
    // BREAKING ON `length > 0` IS THE RACE, NOT THE FIX. The planner generators fire
    // first, so a bundle of planner-only observations arrives while the other three
    // domains are still being written — and a capture taken there reports an empty
    // Pantry surface that is a timing artifact, exactly the artifact the AFI3_5 script
    // recorded hitting. Waiting for the bundle to STOP GROWING is the honest signal:
    // it is true whether the household ends up with five observations or fifty.
    // SETTLING IS STRICTER THAN IT LOOKS, and the reason is a mistake this script
    // already made once. An earlier version broke as soon as the bundle stopped
    // growing, hit a plateau of planner-only observations at ~30s, and wrote a
    // manifest saying "5 delivered, planner only" — while the screenshots taken
    // moments later showed a Shopping surface full of `already in your pantry`
    // cards. The manifest and its own evidence disagreed, because pantry and
    // shopping seeding lands in a second wave AFTER a plateau, not before one.
    //
    // So: require a LONG unchanged run (6 consecutive identical reads ≈ 15s) and a
    // floor on elapsed attempts, so a plateau between seeding waves cannot be
    // mistaken for the end of seeding. The manifest must describe the same
    // household state the PNGs show, or it is worse than no manifest.
    let all: any[] = [];
    let stable = 0;
    const MIN_ATTEMPTS = 16;
    const STABLE_READS = 6;
    for (let attempt = 1; attempt <= 40; attempt++) {
      const bundle = await ctx.request.get(`${BASE}/api/intelligence/food-opportunities`);
      if (bundle.ok()) {
        const body: any = await bundle.json();
        const next = body.opportunities ?? [];
        const sameShape =
          next.length === all.length &&
          new Set(next.map((o: any) => o.id)).size === new Set(all.map((o: any) => o.id)).size &&
          next.every((o: any) => all.some((p: any) => p.id === o.id));
        stable = sameShape && next.length > 0 ? stable + 1 : 0;
        all = next;
        if (stable >= STABLE_READS && attempt >= MIN_ATTEMPTS) {
          const domains = [...new Set(all.map((o: any) => o.domain))];
          console.log(
            `  household settled (attempt ${attempt}, ${all.length} delivered, domains: ${domains.join(", ")})`,
          );
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 2500));
    }

    // ── PROBE 1 — the candidate-set fix, measured on the live bundle ──────────
    const byDomain: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const o of all) {
      byDomain[o.domain] = (byDomain[o.domain] ?? 0) + 1;
      byPriority[o.priority] = (byPriority[o.priority] ?? 0) + 1;
    }
    console.log(`\n  --- delivered bundle: ${all.length} opportunities ---`);
    console.log(`  by domain   : ${JSON.stringify(byDomain)}`);
    console.log(`  by priority : ${JSON.stringify(byPriority)}`);
    evidence.delivered_total = all.length;
    evidence.delivered_by_domain = byDomain;
    evidence.delivered_by_priority = byPriority;

    // The audit's headline symptom: `low`-priority pantry observations starved out by
    // the producer's own clamp. Recorded either way — an honest absence is a result.
    evidence.low_priority_delivered = byPriority["low"] ?? 0;
    evidence.pantry_delivered = byDomain["pantry"] ?? 0;

    // ── PROBE 2 — every delivered domain has a label (no card reads "Food") ───
    const unlabelled = [...new Set(all.map((o: any) => o.domain))].filter(
      (d) => !(d in OPPORTUNITY_DOMAIN_LABELS),
    );
    console.log(
      `  domain labels: ${unlabelled.length === 0 ? "every delivered domain is labelled" : `UNLABELLED → ${unlabelled.join(", ")}`}`,
    );
    evidence.unlabelled_domains = unlabelled;

    // ── PROBE 3 — the retired limb's route stays absent ───────────────────────
    //
    // STATUS CODE IS NOT THE TEST. In dev the Vite middleware serves index.html as a
    // catch-all, so EVERY unmatched path returns 200 text/html — including a control
    // path that certainly does not exist. An unregistered API route is therefore
    // identified by its CONTENT TYPE, not its status: a real JSON route answers
    // application/json, the catch-all answers text/html. The control probe is
    // captured alongside it so the manifest carries the comparison rather than
    // asking a reader to trust the interpretation.
    const probe = async (path: string) => {
      const r = await ctx.request.get(`${BASE}${path}`).catch(() => null);
      return r
        ? { status: r.status(), contentType: r.headers()["content-type"] ?? null }
        : { status: "unreachable", contentType: null };
    };
    const dead = await probe("/api/household-nutrition");
    const control = await probe("/api/definitely-not-a-real-route-xyz");
    const isAbsent = dead.contentType === control.contentType;
    console.log(
      `  /api/household-nutrition → ${dead.status} ${dead.contentType}\n` +
        `  control unmatched route  → ${control.status} ${control.contentType}\n` +
        `  ⇒ retired route is ${isAbsent ? "ABSENT (indistinguishable from an unmatched path)" : "STILL SERVING — investigate"}`,
    );
    evidence.retired_route = { probed: dead, control, absent: isAbsent };

    // The Companion's own voice — proves the delivered observations survive the
    // notice channel too, not only the card channel.
    const notices = await ctx.request.get(`${BASE}/api/intelligence/companion/notices`);
    if (notices.ok()) {
      const body: any = await notices.json();
      const lines = (body.notices ?? []).map((n: any) => `[${n.category}] ${n.text}`);
      console.log(`\n  --- companion notices (cap ${body?.trust?.cap}) ---`);
      for (const l of lines) console.log(`  • ${l}`);
      evidence.companion_notices = lines;
    }
    console.log("");

    const shots = [
      {
        id: "pantry-ambient",
        name: "Pantry — the surface AFI_VERIFY1 §4.2 measured rendering EMPTY for a stocked pantry",
        route: "/pantry",
        toggle: "ambient-intelligence-pantry-toggle",
        wait: '[data-testid="ambient-intelligence-pantry"]',
      },
      {
        id: "home-ambient-aggregate",
        name: "Home — aggregate ambient across all four registered domains",
        route: "/home",
        toggle: "ambient-intelligence-home-toggle",
        wait: '[data-testid="ambient-intelligence-home"]',
      },
      {
        id: "shopping-ambient",
        name: "Shopping — ambient, incl. the sole `critical` emitter's safety path",
        route: "/shopping-workspace",
        toggle: "ambient-intelligence-shopping-toggle",
        wait: '[data-testid="ambient-intelligence-shopping"]',
      },
      {
        id: "cookbook-ambient",
        name: "Cookbook — the domain whose label MAT1's conformance suite now guards",
        route: "/meals",
        toggle: "ambient-cookbook-toggle",
        wait: '[data-testid="ambient-cookbook"]',
      },
      {
        id: "planner-ambient",
        name: "Planner — ambient",
        route: "/weekly-planner",
        toggle: "ambient-intelligence-planner-toggle",
        wait: '[data-testid="ambient-intelligence-planner"]',
      },
      {
        id: "home-companion-notices",
        name: "Home — the Companion card (the notice channel, same OD1 bundle)",
        route: "/home",
        wait: '[data-testid="card-home-companion"]',
      },
      {
        id: "plant-diversity",
        name: "Plant diversity — the surface whose WEEKLY_PLANT_TARGET MAT1 converged to one owner",
        route: "/plant-diversity",
      },
    ];
    for (const s of shots) await shoot(ctx, s, results);

    // RE-READ THE BUNDLE AFTER THE CAPTURES, and record BOTH.
    //
    // The settle poll above can plateau: this demo household seeds planner first and
    // pantry/shopping in a later wave, with a gap between them long enough to look
    // like the end of seeding. The screenshots then span a LATER window than the
    // snapshot the manifest took — which is exactly how an earlier run produced a
    // manifest reading "planner only" beside a PNG showing five Shopping cards.
    //
    // Rather than tune the heuristic until the two happen to agree, record both ends
    // honestly and let the manifest state the drift. A reader can then see which
    // household state each PNG belongs to, instead of being handed one number that
    // silently contradicts the images beside it.
    const finalBundle = await ctx.request.get(`${BASE}/api/intelligence/food-opportunities`);
    if (finalBundle.ok()) {
      const body: any = await finalBundle.json();
      const final = body.opportunities ?? [];
      const finalByDomain: Record<string, number> = {};
      for (const o of final) finalByDomain[o.domain] = (finalByDomain[o.domain] ?? 0) + 1;
      console.log(`\n  --- bundle AFTER captures: ${final.length} opportunities ---`);
      console.log(`  by domain   : ${JSON.stringify(finalByDomain)}`);
      const drifted = final.length !== all.length;
      console.log(
        drifted
          ? `  ⚠ seeding continued during capture (${all.length} → ${final.length}); the PNGs show the LATER state`
          : `  bundle unchanged across the capture window — manifest and PNGs describe the same household`,
      );
      evidence.after_capture_total = final.length;
      evidence.after_capture_by_domain = finalByDomain;
      evidence.seeding_drifted_during_capture = drifted;
      // Re-check the label registry against everything the household ended up with.
      const lateUnlabelled = [...new Set(final.map((o: any) => o.domain))].filter(
        (d) => !(d in OPPORTUNITY_DOMAIN_LABELS),
      );
      evidence.unlabelled_domains_after_capture = lateUnlabelled;
      console.log(
        `  domain labels (final): ${lateUnlabelled.length === 0 ? "every delivered domain is labelled" : `UNLABELLED → ${lateUnlabelled.join(", ")}`}`,
      );
    }

    await ctx.close();
  } finally {
    await browser?.close();
  }

  const captured = results.filter((r) => r.ok).length;
  writeFileSync(
    resolve(OUT, "manifest.json"),
    JSON.stringify(
      {
        captured_by: "MAT1_Platform_Maturity_And_Trust",
        base_url: BASE,
        viewport: VIEWPORT,
        captured,
        failed: results.length - captured,
        evidence,
        shots: results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`\n  ${captured}/${results.length} surfaces captured → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
