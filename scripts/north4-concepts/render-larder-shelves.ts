import { chromium } from "playwright";
import { resolve } from "path";
const OUT = resolve("docs/ui-audit/north4-concepts/larder-food-group-shelves-desktop.png");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });
  const p = await b.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 2 });
  await p.goto("file://" + resolve("scripts/north4-concepts/larder-food-group-shelves.html"), { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT });
  console.log("->", OUT);
  await b.close();
})();
