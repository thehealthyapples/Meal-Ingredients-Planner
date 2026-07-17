// Measure the room. Where the air is, and what falls below the fold.
import { chromium } from "playwright";

const BASE = "http://localhost:5000";
const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

const PROBE = `(() => {
  const rows = [];
  const q = function (sel, label) {
    const el = document.querySelector(sel);
    if (!el) { rows.push({ label: label, missing: true }); return; }
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    rows.push({ label: label, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height),
      font: cs.fontSize + " / " + cs.fontWeight + " / " + cs.fontFamily.split(",")[0], color: cs.color });
  };
  q("header", "shell header");
  q('[data-testid="text-home-title"]', "header title");
  q('[data-testid="text-home-greeting"]', "h1 greeting");
  q('[data-testid="text-home-signature"]', "signature name");
  q('[data-testid="text-home-date"]', "date");
  q('[data-testid="card-home-companion"]', "companion card");
  q('[data-testid="text-home-today-heading"]', "today heading");
  q('[data-testid="ground-home"]', "GROUND (counter)");
  q('[data-testid="card-home-glance"]', "glance card");
  q('[data-testid="button-home-primary"]', "THE ONE DOOR");
  q('[data-testid="home-doors"]', "doors of the house");
  q('[data-testid="link-home-dashboard"]', "dashboard link");

  const sal = document.querySelector('[data-testid="text-home-greeting"] span');
  if (sal) {
    const cs = getComputedStyle(sal); const r = sal.getBoundingClientRect();
    rows.push({ label: "SALUTATION span", top: Math.round(r.top), h: Math.round(r.height),
      font: cs.fontSize + " / " + cs.fontWeight + " / " + cs.fontFamily.split(",")[0], color: cs.color });
  }
  const tokens = {};
  const rs = getComputedStyle(document.documentElement);
  const names = ["--background","--foreground","--muted-foreground","--card","--primary","--primary-border","--accent","--border",
    "--ground-plane","--ground-plane-border","--surface-primary","--surface-primary-border","--surface-support","--surface-support-border",
    "--shadow-ground","--shadow-primary","--shadow-support","--orchard-exposure-e3","--radius-ground","--radius-primary","--radius-support","--light-ambient"];
  for (const t of names) tokens[t] = rs.getPropertyValue(t).trim();

  let navTop = null;
  const navs = document.querySelectorAll("nav");
  for (const n of navs) {
    const r = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    if (cs.position === "fixed" && r.top > window.innerHeight / 2) navTop = Math.round(r.top);
  }
  return { rows: rows, tokens: tokens, docH: document.documentElement.scrollHeight, vh: window.innerHeight, navTop: navTop };
})()`;

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
  if (!r.ok()) throw new Error(`login ${r.status()}`);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
  await page.evaluate(() => (document as any).fonts.ready);
  await page.waitForTimeout(2500);

  const out: any = await page.evaluate(PROBE);
  console.log("viewport:", out.vh, " document:", out.docH, " OVERFLOW:", out.docH - out.vh, " navTop:", out.navTop);
  console.log("\n--- geometry (y from viewport top) ---");
  for (const row of out.rows) console.log(JSON.stringify(row));
  console.log("\n--- tokens ---");
  for (const [k, v] of Object.entries(out.tokens)) console.log(String(k).padEnd(26), v);

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
