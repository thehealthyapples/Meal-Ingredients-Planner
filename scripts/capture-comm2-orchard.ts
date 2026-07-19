// COMM2 — captures of the Orchard (/orchard): the room that looks outward.
//
// Usage: npx tsx scripts/capture-comm2-orchard.ts
//
// Two states, because the room must survive both:
//   • empty     — REAL. The dev household belongs to no neighbourhood, which is
//                 the true state of every household on the platform today. E3.
//   • populated — MOCKED at the network edge. The rows do not exist in the
//                 database; this proves the room RENDERS them correctly, and
//                 proves nothing about the boundary. The boundary is proven by
//                 test-comm2-orchard-isolation.ts, against real Postgres.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/comm2-orchard");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

// Note what is NOT here: no household names, because the API returns none.
const POPULATED: Record<string, unknown> = {
  "**/api/community": [
    { id: 1, name: "Ashdown Lane", kind: "neighbourhood" },
    { id: 2, name: "The Old Dairy", kind: "neighbourhood" },
  ],
  "**/api/community/invitations": [
    { id: 7, communityId: 3, expiresAt: "2026-08-02T00:00:00.000Z" },
  ],
  "**/api/community/1/members": {
    communityId: 1,
    memberCount: 4,
    members: [
      { householdId: 11, role: "owner" },
      { householdId: 12, role: "member" },
      { householdId: 13, role: "member" },
      { householdId: 14, role: "member" },
    ],
  },
};

async function login(ctx: any) {
  const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
  if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
}

async function settle(page: any) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const vp of VIEWPORTS) {
    // ── empty (real) ──
    {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      await login(ctx);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/orchard`, { waitUntil: "networkidle" });
      await settle(page);
      const empty = await page.locator('[data-testid="orchard-empty"]').count();
      console.log(`  ${vp.name} empty-state present: ${empty === 1}`);
      await page.screenshot({ path: path.join(OUT, `empty-${vp.name}.png`), fullPage: true });
      await ctx.close();
    }

    // ── populated (mocked) ──
    {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      await login(ctx);
      const page = await ctx.newPage();
      for (const [glob, body] of Object.entries(POPULATED)) {
        await page.route(glob, (route: any) =>
          route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
      }
      await page.goto(`${BASE}/orchard`, { waitUntil: "networkidle" });
      await settle(page);
      await page.screenshot({ path: path.join(OUT, `overview-${vp.name}.png`), fullPage: true });

      // A neighbourhood — the presences and the privacy note.
      await page.locator('[data-testid="orchard-neighbourhood-1"]').click();
      await settle(page);
      const presences = await page.locator('[data-testid="orchard-presences"] li').count();
      const note = await page.locator('[data-testid="orchard-privacy-note"]').count();
      console.log(`  ${vp.name} presences: ${presences}, privacy note: ${note === 1}`);
      await page.screenshot({ path: path.join(OUT, `neighbourhood-${vp.name}.png`), fullPage: true });

      // The Village.
      await page.locator('[data-testid="orchard-back-to-overview"]').click();
      await settle(page);
      await page.locator('[data-testid="orchard-part-village"]').click();
      await settle(page);
      await page.screenshot({ path: path.join(OUT, `village-${vp.name}.png`), fullPage: true });

      // The High Street — real retailers, unmocked.
      await page.locator('[data-testid="orchard-part-highstreet"]').click();
      await settle(page);
      const retailers = await page.locator('[data-testid="orchard-retailers"] li').count();
      console.log(`  ${vp.name} retailers (real, unmocked): ${retailers}`);
      await page.screenshot({ path: path.join(OUT, `high-street-${vp.name}.png`), fullPage: true });

      await ctx.close();
    }

    // ── the invitation gate, arrived at by link ──
    if (vp.name === "desktop") {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      await login(ctx);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/orchard?invitation=demo-token-not-real`, { waitUntil: "networkidle" });
      await settle(page);
      const gate = await page.locator('[data-testid="orchard-invitation-gate"]').count();
      console.log(`  invitation gate present when arriving by link: ${gate === 1}`);
      await page.screenshot({ path: path.join(OUT, `invitation-gate-desktop.png`), fullPage: true });
      await ctx.close();
    }
    console.log(`captured ${vp.name}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
