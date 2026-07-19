// COMM1A — captures of the invitation journey.
//
// Usage: npx tsx scripts/capture-comm1a-invitation.ts
//
// Every address used here is on the RFC 2606 reserved `.test` TLD, which cannot
// resolve, so no email can reach a real person even where SMTP is configured.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/comm1a-invitation");
const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};
const INVITEE = `comm1a-capture-${process.pid}@invalid.test`;

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  try {
    // ── The inviter's side: the Village's invite form ──
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      const login = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
      if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
      const page = await ctx.newPage();

      await page.route("**/api/community", (r) =>
        r.fulfill({ status: 200, contentType: "application/json",
          body: JSON.stringify([{ id: 1, name: "Ashdown Lane", kind: "neighbourhood" }]) }));

      await page.goto(`${BASE}/orchard`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      await page.locator('[data-testid="orchard-part-village"]').click();
      await page.waitForTimeout(1200);

      const form = await page.locator('[data-testid="orchard-invite"]').count();
      const emailField = await page.locator('[data-testid="orchard-invite-email"]').count();
      console.log(`  ${vp.name} invite form present: ${form === 1}, email field: ${emailField === 1}`);

      await page.screenshot({ path: path.join(OUT, `village-invite-${vp.name}.png`), fullPage: true });
      await ctx.close();
    }

    // ── Create a real invitation so the doorstep has something to render ──
    const ctx = await browser.newContext({ viewport: VIEWPORTS[0], deviceScaleFactor: 2 });
    await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
    const created = await ctx.request.post(`${BASE}/api/invitations`, { data: { email: INVITEE } });
    console.log(`  invitation created: ${created.status()}`);
    const body = await created.json();
    console.log(`  response keys: ${Object.keys(body).join(", ")}`);
    await ctx.close();

    const row = await db.execute<{ token: string }>(sql`
      SELECT token FROM household_invitations WHERE invited_email = ${INVITEE}`);
    const token = row.rows[0]?.token;
    if (!token) throw new Error("no token minted");

    // ── The recipient's side: the doorstep, SIGNED OUT ──
    for (const vp of VIEWPORTS) {
      const anon = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      const page = await anon.newPage();
      await page.goto(`${BASE}/invitation?token=${encodeURIComponent(token)}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);

      const preview = await page.locator('[data-testid="invitation-preview"]').count();
      const signup = await page.locator('[data-testid="invitation-signup"]').count();
      const addressText = await page.locator('[data-testid="invitation-address"]').textContent().catch(() => "");
      console.log(`  ${vp.name} doorstep preview: ${preview === 1}, signup CTA: ${signup === 1}`);
      console.log(`  ${vp.name} address shown: ${addressText?.trim().slice(0, 90)}`);
      console.log(`  ${vp.name} full address leaked: ${addressText?.includes(INVITEE)}`);

      await page.screenshot({ path: path.join(OUT, `doorstep-${vp.name}.png`), fullPage: true });

      // The signup link must carry the token — the thing /shared/:token drops.
      if (signup === 1) {
        const href = await page.locator('[data-testid="invitation-signup"]').locator("xpath=ancestor::a").getAttribute("href").catch(() => null);
        console.log(`  ${vp.name} signup link carries token: ${href?.includes("invitation=") ?? false}`);
      }
      await anon.close();
    }

    // ── An invalid token ──
    const anon2 = await browser.newContext({ viewport: VIEWPORTS[0], deviceScaleFactor: 2 });
    const p2 = await anon2.newPage();
    await p2.goto(`${BASE}/invitation?token=not-a-real-token`, { waitUntil: "networkidle" });
    await p2.waitForTimeout(1000);
    await p2.screenshot({ path: path.join(OUT, "doorstep-invalid-desktop.png"), fullPage: true });
    console.log(`  invalid token renders the unavailable message: ${(await p2.locator("text=isn't available").count()) > 0}`);
    await anon2.close();

    // ── The signup page carries the token through ──
    const anon3 = await browser.newContext({ viewport: VIEWPORTS[0], deviceScaleFactor: 2 });
    const p3 = await anon3.newPage();
    await p3.goto(`${BASE}/auth?invitation=${encodeURIComponent(token)}`, { waitUntil: "networkidle" });
    await p3.waitForTimeout(1500);
    await p3.screenshot({ path: path.join(OUT, "signup-with-invitation-desktop.png"), fullPage: true });
    await anon3.close();
  } finally {
    await db.execute(sql`DELETE FROM household_invitations WHERE invited_email LIKE 'comm1a-capture-%@invalid.test'`);
    await browser.close();
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
