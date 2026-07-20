// INTARCH2 — the two surfaces the room walk cannot photograph.
//
// The room harness walks eleven rooms and reports `grooves=0` in every one. That
// is a true measurement and it needed explaining rather than excusing: the
// support tier's only scaffold consumer is `ui/tabs`' TabsList, and every live
// TabsList in the product sits inside a dialog, a panel, or an admin page — none
// of which the room walk opens. A rule that ships unphotographed is a rule
// nobody checked (ODL2's lesson, and EXPADOPT1 learned it twice), so this
// harness opens the one that IS reachable.
//
// It photographs the Cookbook's "Import Recipe" dialog, which carries BOTH
// things this workstream needs to see and the room walk cannot:
//
//   1. THE GROOVE — a real TabsList ("Paste a link" / "Paste text") standing in
//      the support material, with a trigger raised out of it in plaster.
//   2. THE RETIRED DIALOG RULE — `[role="dialog"] .shadcn-card` was deleted in
//      this change. Any card inside a modal is the surface that would show it if
//      that retirement was wrong.
//
// Usage: npx tsx scripts/capture-intarch2-groove-and-modal.ts <before|after>
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/intarch2-material-surfaces");
const LABEL = process.argv[2] ?? "after";

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // the groove is an etch of light; it needs the pixels
  });
  const login = await ctx.request.post(`${BASE}/api/login`, {
    data: {
      username: "price.single.parent.owner@dev.thehealthyapples.dev",
      password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
    },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);

  const page = await ctx.newPage();
  await page.goto(`${BASE}/cookbook`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => (document as any).fonts.ready);
  await page.waitForTimeout(1500);

  // The Cookbook's "Add Recipe" opens a chooser; "import" is the option that
  // leads to the tabbed dialog. Two clicks, because that is the household's own
  // path to it and a screenshot of a surface reached any other way is a
  // screenshot of something a household never sees.
  await page.click('[data-testid="button-cookbook-add-recipe"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(600);
  // The Cookbook's add-recipe control opens the tabbed import dialog directly on
  // this build. If a chooser step is ever put back in front of it, take it.
  if (!(await page.locator('[role="tablist"]').count())) {
    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: /paste a link|import/i })
      .first()
      .click({ timeout: 8000 });
  }
  await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
  await page.waitForTimeout(1200);

  const dialog = page.locator('[role="dialog"]').first();
  await dialog.screenshot({ path: path.join(OUT, `${LABEL}-groove-import-dialog.png`) });

  const probe = await page.evaluate(() => {
    const el = document.createElement("div");
    el.style.backgroundColor = "var(--surface-support)";
    document.body.appendChild(el);
    const resolvedSupport = getComputedStyle(el).backgroundColor;
    el.remove();

    const list = document.querySelector('[role="tablist"]');
    const active = document.querySelector('[role="tab"][data-state="active"]');
    return {
      grooves: document.querySelectorAll(".surface-support").length,
      tabListBg: list ? getComputedStyle(list).backgroundColor : "(none)",
      tabListShadow: list ? getComputedStyle(list).boxShadow : "(none)",
      resolvedSupport,
      activeTriggerBg: active ? getComputedStyle(active).backgroundColor : "(none)",
      cardsInDialog: document.querySelectorAll('[role="dialog"] .shadcn-card').length,
    };
  });
  console.log(`${LABEL} grooves=${probe.grooves}`);
  console.log(`${LABEL} tablist background = ${probe.tabListBg}`);
  console.log(`${LABEL} --surface-support  = ${probe.resolvedSupport}`);
  console.log(`${LABEL} tablist box-shadow = ${probe.tabListShadow}`);
  console.log(`${LABEL} active trigger bg  = ${probe.activeTriggerBg}`);
  console.log(`${LABEL} cards inside dialog= ${probe.cardsInDialog}`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
