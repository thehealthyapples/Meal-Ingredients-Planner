import { chromium } from "playwright";
const BASE = "http://localhost:5000";
(async () => {
  const b = await chromium.launch({ executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.request.post(`${BASE}/api/login`, { data: { username: "price.single.parent.owner@dev.thehealthyapples.dev", password: "devworld-dev-only" } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/pantry`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  const out = await p.evaluate(() => {
    const rows: any[] = [];
    const sel = ["html","body","#root","[data-testid=larder-room]",".lardr-inner",".lv-band",".lv-run",".lv-floorline",".lv-doors",".lv-casement",".lv-drystore"];
    for (const s of sel) {
      const e = document.querySelector(s) as HTMLElement | null;
      if (!e) { rows.push({ sel: s, missing: true }); continue; }
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      rows.push({ sel: s, top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width),
        overflow: cs.overflow, position: cs.position, minH: cs.minHeight, display: cs.display });
    }
    // ancestors of the room
    const room = document.querySelector("[data-testid=larder-room]") as HTMLElement;
    const anc: any[] = [];
    let n: HTMLElement | null = room?.parentElement ?? null;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      anc.push({ tag: n.tagName + "." + (n.className||"").toString().slice(0,60), h: Math.round(n.getBoundingClientRect().height), overflow: cs.overflow, position: cs.position });
      n = n.parentElement;
    }
    const casImgs = Array.from(document.querySelectorAll(".lv-casement img, .lv-casement *")).slice(0,10).map(e=>({tag:e.tagName, cls:(e as HTMLElement).className.toString().slice(0,50), src:(e as HTMLImageElement).src?.slice(-50)}));
    return { rows, anc, scrollH: document.documentElement.scrollHeight, casImgs };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
