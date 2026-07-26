// LARDER_CATEGORY_FIRST — exercise the room, don't just read it.
// Walks the wall → a shelf → an object's menu (by keyboard), adds to Shopping
// and proves the staple stays, adds a new staple by search and proves it lands
// on the shelf its identity belongs to, then takes it back out.
// Usage: npx tsx scripts/verify-larder-category-first.ts
import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/evidence/2026-07-24-larder-category-first");

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function shoppingCount(page: Page): Promise<number> {
  // cache-busted: a plain GET can be served from the browser's HTTP cache and
  // report a stale count, which would make this check lie in both directions.
  const res = await page.request.get(`${BASE}/api/shopping-list?_=${process.hrtime.bigint()}`);
  const body = await res.json();
  return Array.isArray(body) ? body.length : (body.items?.length ?? -1);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const login = await ctx.request.post(`${BASE}/api/login`, {
    data: {
      username: "price.single.parent.owner@dev.thehealthyapples.dev",
      password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
    },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pantry`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="larder-room"]');

  // 1 — the wall is the first thing, and it is shelves, not cupboards.
  const bays = await page.locator('[data-testid^="lardr-shelf-"]').count();
  check("the wall presents named shelves", bays >= 5, `${bays} shelves`);
  check("no cupboard or appliance door remains",
    (await page.locator('[data-testid^="lardr-appliance-toggle-"]').count()) === 0);

  // 2 — selecting a category steps up to that shelf.
  await page.locator('[data-testid="lardr-shelf-grains"]').click();
  await page.waitForSelector('[data-testid="lardr-shelfview-grains"]');
  const objects = page.locator('[data-testid^="lardr-product-"]');
  const onGrains = await objects.count();
  check("the shelf shows what stands on it", onGrains > 0, `${onGrains} objects`);
  const jarBox = await objects.first().boundingBox();
  check("jars are large enough to read", (jarBox?.height ?? 0) >= 120, `${Math.round(jarBox?.height ?? 0)}px tall`);

  // 3 — keyboard only: reach an object and open its actions.
  await page.keyboard.press("Tab");
  for (let i = 0; i < 12; i++) {
    const id = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? "");
    if (id.startsWith("lardr-product-")) break;
    await page.keyboard.press("Tab");
  }
  const focusedId = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? "");
  check("an object is reachable by keyboard", focusedId.startsWith("lardr-product-"), focusedId);
  await page.keyboard.press("Enter");
  const menuOpen = await page.locator('[data-testid^="lardr-menu-"]').first().isVisible();
  check("Enter opens the object's actions", menuOpen);
  await page.screenshot({ path: path.join(OUT, "desktop-keyboard-menu.png") });

  // 4 — add to shopping: Shopping gains one, the larder loses nothing.
  const beforeShop = await shoppingCount(page);
  const beforeItems = await objects.count();
  await page.locator('[data-testid^="lardr-act-shop-"]').first().click();
  await page.waitForTimeout(2500);
  const afterShop = await shoppingCount(page);
  const afterItems = await objects.count();
  check("adding to Shopping originates a Domain 15 entry", afterShop === beforeShop + 1, `${beforeShop} → ${afterShop}`);
  check("the staple STAYS in the larder (LARDER1 §8)", afterItems === beforeItems, `${beforeItems} → ${afterItems}`);
  await page.screenshot({ path: path.join(OUT, "desktop-added-to-shopping.png") });

  // 5 — back to the wall.
  await page.locator('[data-testid="lardr-shelf-back"]').click();
  await page.waitForSelector('[data-testid="lardr-wall"]');
  check("stepping back returns to the wall of shelves", true);

  // 6 — search adds a staple, and it arrives on the shelf its identity belongs to.
  await page.locator('[data-testid="lardr-add-input"]').fill("Pearl barley");
  await page.locator('[data-testid="lardr-add-btn"]').click();
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/pantry?shelf=grains`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="lardr-shelfview-grains"]');
  const landed = await page.locator('[data-testid="lardr-shelfview-grains"]').getByText("Pearl barley").first().isVisible();
  check("a searched-for staple arrives on its own shelf", landed);
  await page.screenshot({ path: path.join(OUT, "desktop-search-added.png") });

  // 7 — take it back out again (leaves the dev world as it was found).
  const added = page.locator('[data-testid^="lardr-product-"]', { hasText: "Pearl barley" }).first();
  await added.click();
  await page.locator('[data-testid^="lardr-act-bin-"]').first().click();
  await page.waitForTimeout(1200);
  const stillThere = await page.locator('[data-testid="lardr-shelfview-grains"]').getByText("Pearl barley").count();
  check("taking a staple out removes it from the room", stillThere === 0);

  // 8 — a place shelf shows its contents without drawing an appliance interior.
  await page.goto(`${BASE}/pantry?shelf=fridge`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="lardr-shelfview-fridge"]');
  const cold = await page.locator('[data-testid^="lardr-product-"]').count();
  check("what is kept cold is still reachable", cold > 0, `${cold} objects`);

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
