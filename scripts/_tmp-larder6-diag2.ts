import { chromium } from "playwright";
const BASE = "http://localhost:5000";
(async () => {
  const b = await chromium.launch({ executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.request.post(`${BASE}/api/login`, { data: { username: "price.single.parent.owner@dev.thehealthyapples.dev", password: "devworld-dev-only" } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/pantry`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  console.log(JSON.stringify(await p.evaluate(() => {
    const room = document.querySelector("[data-testid=larder-room]") as HTMLElement;
    const cs = getComputedStyle(room);
    const inner = document.querySelector(".lardr-inner") as HTMLElement;
    const ics = getComputedStyle(inner);
    return {
      room: { h: room.getBoundingClientRect().height, offsetH: room.offsetHeight, scrollH: room.scrollHeight,
        height: cs.height, maxH: cs.maxHeight, minH: cs.minHeight, contain: cs.contain, display: cs.display, pb: cs.paddingBottom },
      inner: { h: inner.getBoundingClientRect().height, position: ics.position, top: ics.top, display: ics.display, flex: ics.flex },
      innerChildren: Array.from(inner.children).map(c => ({ cls: (c as HTMLElement).className.toString().slice(0,40), h: Math.round(c.getBoundingClientRect().height), pos: getComputedStyle(c).position })),
      main: { h: (room.parentElement as HTMLElement).getBoundingClientRect().height, cs: getComputedStyle(room.parentElement as HTMLElement).height },
    };
  }), null, 1));
  await b.close();
})();
