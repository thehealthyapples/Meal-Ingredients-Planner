// Adaptive-workspace screenshot harness.
// Usage: node shoot.mjs <outDir>
// Auth: POSTs /api/demo/start to get a seeded, onboarded demo session cookie.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:5000";
const outDir = process.argv[2] || "out";
fs.mkdirSync(outDir, { recursive: true });

// The 4 workspace tiers — representative mid-tier widths.
const TIERS = [
  { name: "1-laptop",        w: 1152, h: 800 },
  { name: "2-desktop",       w: 1440, h: 900 },
  { name: "3-large-desktop", w: 1728, h: 1080 },
  { name: "4-ultrawide",     w: 2560, h: 1280 },
];

// Workspaces to capture. mealId resolved at runtime from the seeded cookbook.
const PAGES = [
  { name: "cookbook", path: "/cookbook" },
  { name: "planner",  path: "/weekly-planner" },
  { name: "shopping", path: "/shopping-workspace" },
  { name: "mealdetail", path: "__MEAL__" }, // resolved below
];

async function startDemo() {
  const res = await fetch(`${BASE}/api/demo/start`, { method: "POST" });
  if (!res.ok) throw new Error(`demo/start failed: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() || [res.headers.get("set-cookie")].filter(Boolean);
  // Parse the connect.sid cookie
  const cookies = [];
  for (const c of setCookie) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    cookies.push({ name: pair.slice(0, idx), value: pair.slice(idx + 1), domain: "localhost", path: "/" });
  }
  return cookies;
}

async function resolveMealId(cookieHeader) {
  // Pull a meal id from the seeded meals API.
  const res = await fetch(`${BASE}/api/meals`, { headers: { cookie: cookieHeader } });
  if (!res.ok) return null;
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.meals || data.items || []);
  return list[0]?.id ?? null;
}

const exe = path.resolve(".cache/ms-playwright/chromium-1223/chrome-linux64/chrome");

const browser = await chromium.launch({ executablePath: exe });
try {
  const cookies = await startDemo();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  console.log("auth cookies:", cookies.map(c => c.name).join(","));

  const mealId = await resolveMealId(cookieHeader);
  console.log("meal id:", mealId);

  for (const tier of TIERS) {
    const context = await browser.newContext({
      viewport: { width: tier.w, height: tier.h },
      deviceScaleFactor: 1,
    });
    await context.addCookies(cookies);
    const page = await context.newPage();

    for (const p of PAGES) {
      let urlPath = p.path;
      if (urlPath === "__MEAL__") {
        if (!mealId) { console.log(`skip mealdetail (no meal id)`); continue; }
        urlPath = `/meals/${mealId}`;
      }
      try {
        await page.goto(`${BASE}${urlPath}`, { waitUntil: "networkidle", timeout: 30000 });
      } catch {
        await page.goto(`${BASE}${urlPath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      }
      await page.waitForTimeout(2500); // let lazy content + animations settle
      const file = path.join(outDir, `${p.name}__${tier.name}.png`);
      await page.screenshot({ path: file, fullPage: false }); // viewport shot = what fits above the fold
      console.log("shot:", file);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log("DONE");
