import { chromium } from "playwright";
import { writeFileSync, unlinkSync } from "fs";
import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const PUB = path.resolve("client/public/__emblem.html");
const OUT = path.resolve("docs/implementation/interaction-evidence");

// A standalone page whose ONLY content is the canonical Companion emblem, so the
// element's corners screenshot to true transparency. CSS mirrors index.css's
// `.companion-emblem`; the mask is the same public /tha-apple.png.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;background:transparent}
  .wrap{width:240px;height:240px;display:flex;align-items:center;justify-content:center}
  .companion-emblem{position:relative;display:block;width:200px;height:200px;border-radius:50%;
    background:radial-gradient(120% 90% at 50% 8%, hsl(74 16% 54%), hsl(74 14% 44%) 70%);
    box-shadow:inset 0 4px 0 hsl(74 20% 72% / .7), inset 0 -8px 12px hsl(74 24% 26% / .5), 0 24px 64px -16px hsl(56 45% 9% / .34);}
  .companion-emblem i{position:absolute;inset:0;margin:auto;width:80%;height:80%;display:block;
    -webkit-mask:url("/tha-apple.png") center / contain no-repeat;mask:url("/tha-apple.png") center / contain no-repeat;}
  .companion-emblem .c-occ{background:hsl(74 28% 26%);filter:blur(4px);transform:scale(1.04) translateY(4px);opacity:.7;}
  .companion-emblem .c-rim-up{background:hsl(74 30% 28%);transform:translateY(-6px);opacity:.9;}
  .companion-emblem .c-rim-lo{background:hsl(74 42% 72%);transform:translateY(6px);opacity:.95;}
  .companion-emblem .c-face{background:linear-gradient(to bottom, hsl(74 22% 34%) 0%, hsl(74 17% 44%) 52%, hsl(74 24% 56%) 100%);}
</style></head><body><div class="wrap"><span class="companion-emblem">
  <i class="c-occ"></i><i class="c-rim-up"></i><i class="c-rim-lo"></i><i class="c-face"></i>
</span></div></body></html>`;

async function run() {
  writeFileSync(PUB, html);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 320, height: 320 }, deviceScaleFactor: 4 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/__emblem.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.locator(".companion-emblem").screenshot({ path: path.join(OUT, "companion-logo.png"), omitBackground: true });
  console.log("companion-logo.png (transparent, 800px)");
  await ctx.close(); await b.close();
  unlinkSync(PUB);
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); try { unlinkSync(PUB); } catch {} process.exit(1); });
