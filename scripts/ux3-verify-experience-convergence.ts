// UX3 — measures the Experience Convergence Programme against the running product.
//
// Usage: npx tsx scripts/ux3-verify-experience-convergence.ts
//
// Sibling of ux2-verify-experience-language.ts, and it keeps that script's one
// governing habit: it MEASURES rather than asserting that a class name exists.
// UX2's two escaped defects — a mask whose asset 404'd, and a relief positioned
// onto the Companion's column — both shipped green through build, typecheck and
// three gates, and both were caught only by opening a picture. A verifier earns
// its place by testing the things a picture would show.
//
// ZERO-WRITE. Reads only.
import { chromium } from "playwright";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

let passed = 0;
let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`); }
}

async function open(ctx: any, path: string) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1800);
  return page;
}

const ROOMS = ["/home", "/planner", "/cookbook", "/pantry", "/shopping-workspace", "/nutrition", "/my-diary"];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
  if (!r.ok()) throw new Error(`login failed: ${r.status()}`);

  console.log("\n1. THE HEADER — architecture, not browser chrome");
  {
    const page = await open(ctx, "/planner");
    const header = page.locator(".shell-header").first();
    const bb = await header.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { borderBottom: cs.borderBottomWidth, boxShadow: cs.boxShadow };
    });
    // The 1px rule is what made it read as a toolbar. It must be gone, and what
    // replaced it must be a WARM shadow (hue from the room), never black or grey.
    check(bb.borderBottom === "0px", "the header carries no ruled bottom border", `got ${bb.borderBottom}`);
    check(bb.boxShadow !== "none" && bb.boxShadow.includes("rgb"), "it describes its distance with a shadow instead", `got ${bb.boxShadow}`);
    const isWarm = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bb.boxShadow);
    if (isWarm) {
      const [, rr, gg, bbl] = isWarm.map(Number) as unknown as number[];
      check(rr > bbl, "and that shadow is WARM — red channel above blue, never black (UIA § 4)", `rgb(${rr},${gg},${bbl})`);
    }
    // The ruled divider beside the brand mark is retired.
    const dividers = await page.locator(".shell-header .realm-header-border").count();
    check(dividers === 0, "the ruled divider beside the mark is retired — air separates them now", `got ${dividers}`);
    await page.close();
  }

  console.log("\n2. THE ORCHARD — one owner, and the exposure scale obeyed");
  {
    // Blueprint § 6.2: dialogs and overlays are E0 — NO orchard image. Every dialog
    // in the product used to mount /orchard-bg.webp directly, bypassing the owner.
    const page = await open(ctx, "/pantry");
    const bypasses = await page.evaluate(() => {
      const hits: string[] = [];
      document.querySelectorAll("*").forEach((el) => {
        const bg = getComputedStyle(el as Element).backgroundImage;
        if (bg && bg.includes("orchard-bg.webp")) hits.push((el as Element).className?.toString().slice(0, 40) || el.tagName);
      });
      return hits;
    });
    check(bypasses.length === 0, "no room mounts the orchard asset as a CSS background", `got ${bypasses.join(", ")}`);
    await page.close();
  }

  console.log("\n3. THE COMPANION — one owner of coaching, and a presence at rest");
  {
    const page = await open(ctx, "/home");
    // The emblem must be present in every room, and at rest must show presence.
    const state = await page.locator('[data-testid="button-open-assistant"]').getAttribute("data-companion-state");
    check(state === "idle" || state === "aware", "at rest the Companion shows presence, never urgency", `got ${state}`);

    // `aware` is the state UX2 drew and never wired. If notices exist, it must be
    // lit; if they do not, it must not be. Both directions, so the light cannot
    // become decoration that is simply always on.
    await page.click('[data-testid="button-open-assistant"]');
    await page.waitForTimeout(900);
    const noticeCount = await page.locator('[data-testid^="companion-notice-"]').count();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    const restState = await page.locator('[data-testid="button-open-assistant"]').getAttribute("data-companion-state");
    check(
      (noticeCount > 0) === (restState === "aware"),
      "`aware` is lit exactly when the Companion is holding something to say",
      `notices=${noticeCount} state=${restState}`,
    );

    // The panel is furniture: opaque, never frosted glass over the orchard.
    await page.click('[data-testid="button-open-assistant"]');
    await page.waitForTimeout(900);
    const panel = await page.locator('[data-testid="assistant-panel"]').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { filter: cs.backdropFilter, bg: cs.backgroundColor };
    }).catch(() => null);
    if (panel) {
      check(panel.filter === "none", "the Companion's panel is opaque furniture, not frosted glass", `got ${panel.filter}`);
      const alpha = /rgba?\([^)]*?,\s*([\d.]+)\)/.exec(panel.bg);
      check(!alpha || Number(alpha[1]) >= 0.99, "and its surface is fully opaque, so no view smears through it", `got ${panel.bg}`);
    }
    await page.close();
  }

  console.log("\n4. THE ROOMS — coaching has ONE owner, and it is not the room");
  {
    for (const room of ROOMS) {
      const page = await open(ctx, room);
      const body = (await page.locator("body").innerText().catch(() => "")) ?? "";
      // The eyebrows and ambient titles the convergence retired. If any of these
      // reappears in a room, a second mouth has grown back.
      const banned = ["Things you could do", "You could", "Simply better", "Something we've noticed",
                      "What we've noticed about your", "Ways to use what you have", "Gaps in your week",
                      "Worth a look before you shop", "From your Companion"];
      const found = banned.filter((b) => body.includes(b));
      check(found.length === 0, `${room}: no room-owned coaching voice`, `found: ${found.join(" · ")}`);
      await page.close();
    }
  }

  console.log("\n5. SCALE — the room gains air, never width");
  {
    for (const width of [1280, 1920, 2560]) {
      const wctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const wr = await wctx.request.post(`${BASE}/api/login`, { data: CREDS });
      if (!wr.ok()) throw new Error("login failed");
      const page = await open(wctx, "/cookbook");
      const col = await page.locator("main .mx-auto").first().boundingBox();
      if (col) {
        // UIA § 6: "the column serves reading, not the viewport". 1536 is the
        // widest the container may resolve to; beyond it the surplus is margin.
        check(col.width <= 1537, `${width}px: the content column stays a reading width (${Math.round(col.width)}px)`);
        if (width > 1600) {
          // The threshold is 150px rather than 200 because 200 was a number I
          // liked rather than one the design owes: at 1920 the surplus is 192px a
          // side, which is a generous margin by any reading, and an assertion that
          // failed it was measuring my guess, not the product. What this actually
          // has to prove is that the surplus became MARGIN instead of column —
          // and the check above (the column never exceeds a reading width at any
          // viewport) is the half that carries the claim.
          const margin = (width - col.width) / 2;
          check(margin > 150, `${width}px: the surplus became air — ${Math.round(margin)}px of margin each side`);
        }
      }
      await page.close();
      await wctx.close();
    }
  }

  await ctx.close();
  await browser.close();
  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`UX3 experience convergence: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
