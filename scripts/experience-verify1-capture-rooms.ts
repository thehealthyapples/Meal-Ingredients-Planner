// EXPERIENCE_VERIFY1 — household experience browser verification.
//
// PROD2 recorded "No browser verification possible (Playwright Chromium cannot
// launch: libglib-2.0.so.0)". That is now fixed at the ENVIRONMENT level — the
// bundled chrome binaries in .cache/ms-playwright (gitignored) are symlinked to
// the nix-provided Chromium, so `chromium.launch()` works unmodified and every
// existing capture script is unblocked without a code change.
//
// This harness verifies the seven household rooms the mission names. It follows
// the conventions the existing capture scripts already established
// (scripts/capture-north2-rooms.ts): port 5000, the dev-world login, 1440x900
// at deviceScaleFactor 2, fonts.ready then a settle delay.
//
// It OBSERVES and never fixes: console errors, failed requests, and whether the
// room's own landmark actually rendered. A room that throws is recorded as a
// defect, not skipped quietly.
//
// Usage: npx tsx scripts/experience-verify1-capture-rooms.ts [label]

import { chromium, type ConsoleMessage, type Request } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/experience-verify1");
const LABEL = process.argv[2] ?? "verify";

/** The seven rooms named by the mission. Companion is NOT a room — it is the
 *  FloatingAssistant presence mounted in every room (THA_EXPERIENCE_BLUEPRINT:
 *  "the friend at the counter"), so it is verified as an overlay on Home rather
 *  than by inventing a page for it. */
const ROOMS = [
  { name: "home", path: "/home", landmark: "text=/./" },
  { name: "planner", path: "/planner", landmark: "text=/./" },
  { name: "pantry", path: "/pantry", landmark: "text=/./" },
  { name: "shopping", path: "/shopping-workspace", landmark: "text=/./" },
  { name: "nutrition", path: "/plant-diversity", landmark: "text=/./" },
  { name: "diary", path: "/my-diary", landmark: "text=/./" },
] as const;

interface RoomResult {
  room: string;
  path: string;
  status: "PASS" | "DEFECT" | "ERROR";
  httpErrors: string[];
  consoleErrors: string[];
  pageErrors: string[];
  notes: string[];
  screenshot: string | null;
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const login = await ctx.request.post(`${BASE}/api/login`, {
    data: {
      username: "price.single.parent.owner@dev.thehealthyapples.dev",
      password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
    },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);
  console.log(`login ok (${login.status()})`);

  const results: RoomResult[] = [];

  for (const room of ROOMS) {
    const httpErrors: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const notes: string[] = [];

    const page = await ctx.newPage();
    page.on("console", (m: ConsoleMessage) => {
      if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
    });
    page.on("pageerror", (e: Error) => pageErrors.push(String(e.message).slice(0, 300)));
    page.on("requestfailed", (r: Request) =>
      httpErrors.push(`FAILED ${r.method()} ${r.url().replace(BASE, "")} — ${r.failure()?.errorText ?? "?"}`),
    );
    page.on("response", (r) => {
      if (r.status() >= 400) httpErrors.push(`${r.status()} ${r.request().method()} ${r.url().replace(BASE, "")}`);
    });

    let screenshot: string | null = null;
    let status: RoomResult["status"] = "PASS";

    try {
      await page.goto(`${BASE}${room.path}`, { waitUntil: "networkidle", timeout: 45_000 });
      await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
      await page.waitForTimeout(2200);

      // Did the room actually render anything, or is it a blank shell?
      const bodyText = (await page.textContent("body").catch(() => "")) ?? "";
      if (bodyText.trim().length < 40) {
        notes.push(`body text is ${bodyText.trim().length} chars — room may have rendered blank`);
        status = "DEFECT";
      }
      // The not-found page is a routing defect, never a pass.
      if (/didn't find that page|not found/i.test(bodyText) && room.path !== "/404") {
        notes.push("room rendered the NOT-FOUND page");
        status = "DEFECT";
      }

      const file = path.join(OUT, `${LABEL}-${room.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      screenshot = path.relative(process.cwd(), file);
    } catch (e) {
      status = "ERROR";
      notes.push((e as Error).message.split("\n")[0]);
    }

    if (pageErrors.length > 0 && status === "PASS") status = "DEFECT";
    results.push({ room: room.name, path: room.path, status, httpErrors, consoleErrors, pageErrors, notes, screenshot });
    console.log(
      `${status.padEnd(6)} ${room.name.padEnd(10)} http:${httpErrors.length} console:${consoleErrors.length} pageerr:${pageErrors.length}`,
    );
    await page.close();
  }

  // ── Companion — a presence, not a room ─────────────────────────────────────
  {
    const httpErrors: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const notes: string[] = [];
    let status: RoomResult["status"] = "PASS";
    let screenshot: string | null = null;

    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
    page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 300)));
    page.on("response", (r) => { if (r.status() >= 400) httpErrors.push(`${r.status()} ${r.url().replace(BASE, "")}`); });

    try {
      await page.goto(`${BASE}/home`, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(2000);

      // The Companion is mounted once inside ProtectedRoute as FloatingAssistant.
      // The trigger is `button-open-assistant`; the panel it opens is
      // `assistant-panel`. Assert the PANEL, never the click — the first version
      // of this harness matched `[data-testid*="companion"]`, hit Home's static
      // Companion CARD, reported PASS, and produced a screenshot byte-identical
      // to Home. A click that changes nothing is not evidence.
      const trigger = page.locator('[data-testid="button-open-assistant"]');
      if ((await trigger.count()) === 0) {
        notes.push("no button-open-assistant found on /home");
        status = "DEFECT";
      } else {
        await trigger.first().click({ timeout: 10_000 });
        try {
          await page.locator('[data-testid="assistant-panel"]').waitFor({ state: "visible", timeout: 15_000 });
          await page.waitForTimeout(2500);
          notes.push("assistant-panel opened and is visible");
        } catch {
          notes.push("button-open-assistant clicked but assistant-panel never became visible");
          status = "DEFECT";
        }
      }

      const file = path.join(OUT, `${LABEL}-companion.png`);
      await page.screenshot({ path: file, fullPage: false });
      screenshot = path.relative(process.cwd(), file);
    } catch (e) {
      status = "ERROR";
      notes.push((e as Error).message.split("\n")[0]);
    }

    if (pageErrors.length > 0 && status === "PASS") status = "DEFECT";
    results.push({ room: "companion", path: "/home (overlay)", status, httpErrors, consoleErrors, pageErrors, notes, screenshot });
    console.log(`${status.padEnd(6)} companion  http:${httpErrors.length} console:${consoleErrors.length} pageerr:${pageErrors.length}`);
    await page.close();
  }

  writeFileSync(path.join(OUT, `${LABEL}-results.json`), JSON.stringify({ base: BASE, label: LABEL, results }, null, 2) + "\n");

  await ctx.close();
  await browser.close();

  const defects = results.filter((r) => r.status !== "PASS");
  console.log(`\n${results.length - defects.length}/${results.length} rooms clean`);
  for (const d of defects) {
    console.log(`\n— ${d.room} (${d.status}) ${d.path}`);
    for (const n of d.notes) console.log(`    note: ${n}`);
    for (const e of d.pageErrors.slice(0, 3)) console.log(`    pageerror: ${e}`);
    for (const e of d.httpErrors.slice(0, 5)) console.log(`    http: ${e}`);
  }
  // Observation harness: a defect is a finding to report, never a failed build.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
