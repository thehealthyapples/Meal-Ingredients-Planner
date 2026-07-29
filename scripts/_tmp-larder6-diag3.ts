import { chromium } from "playwright";
const BASE = "http://localhost:5000";
(async () => {
  const b = await chromium.launch({ executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.request.post(`${BASE}/api/login`, { data: { username: "price.single.parent.owner@dev.thehealthyapples.dev", password: "devworld-dev-only" } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/pantry`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  console.log(JSON.stringify(await p.evaluate(() => {
    const room = document.querySelector("[data-testid=larder-room]") as HTMLElement;
    const main = room.parentElement as HTMLElement;
    const mcs = getComputedStyle(main);
    const rcs = getComputedStyle(room);
    return { mainDisplay: mcs.display, mainFlexDir: mcs.flexDirection, mainPadB: mcs.paddingBottom, mainH: mcs.height,
      roomFlex: rcs.flex, roomFlexShrink: rcs.flexShrink, roomFlexBasis: rcs.flexBasis, siblings: main.children.length,
      sib: Array.from(main.children).map(c=>({cls:(c as HTMLElement).className.toString().slice(0,40), h: Math.round(c.getBoundingClientRect().height)})) };
  }), null, 1));
  await b.close();
})();
