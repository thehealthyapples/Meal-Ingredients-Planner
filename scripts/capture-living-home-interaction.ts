import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs"; import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/interaction-evidence"); mkdirSync(OUT, { recursive: true });
async function open(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("lh-area-fruit-bowl").waitFor({ timeout: 15000 });
  await page.waitForTimeout(1200);
}
async function shot(p: Page, n: string){ await p.screenshot({ path: path.join(OUT, n) }); console.log(n); }
async function run() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); await open(page);
  // Arrival: the lightweight Areas navigator + the three permanent kitchen
  // destinations (quiet at rest — no "drop to…" instruction until something is held)
  await shot(page, "1-arrival-areas-and-destinations.png");
  // Fruit bowl: Living Objects you drag (Apples = photoreal master, gently highlighted;
  // the rest honest, quiet tokens). No action buttons anywhere.
  await page.getByTestId("lh-area-fruit-bowl").click(); await page.waitForTimeout(1300); await shot(page, "2-fruit-objects.png");
  // Pantry shelves → a group's jars as draggable Living Objects
  await page.getByTestId("lh-area-shelves").click(); await page.waitForTimeout(1000);
  await page.getByTestId("lh-open-flours").click(); await page.waitForTimeout(1100); await shot(page, "4-flours-jars.png");
  // Fridge: a zone of household things, drag any to shopping / Apple / bin
  await page.getByTestId("lh-area-fridge").click(); await page.waitForTimeout(1300); await shot(page, "5-fridge-objects.png");
  // Spatial continuity: from Fridge go straight to Tea & Coffee — no return to Arrival
  await page.getByTestId("lh-area-tea-coffee").click(); await page.waitForTimeout(1300); await shot(page, "6-fridge-to-tea-coffee.png");
  await ctx.close(); await b.close();
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); process.exit(1); });
