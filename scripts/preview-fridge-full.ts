// Offline, faithful render of the whole Fridge Working Position (same plate, same
// object CSS, same occlusion masks, same step-zoom) so the composition can be
// self-reviewed without the rate-limited demo server.
import { chromium } from "playwright";
import path from "path";
import { pathToFileURL } from "url";
const REPO = "C:/Users/Colin/The Healthy Apples/GitHub/tha-living-larder-authoritative";
const fdir = `${REPO}/client/src/assets/living-home/larder/fridge`;
const url = (p: string) => pathToFileURL(p).href;
const plate = url(`${REPO}/client/public/images/living-home/room/work-fridge-empty.png`);
const A = (slug: string) => url(`${fdir}/tha-fridge-${slug}.png`);

// current FRIDGE_OBJECTS (name slug, x, y BASE, h)
const OBJ: [string, number, number, number][] = [
  ["juice",29,30,10.5],["apple-juice",29,43.5,10.5],["milk",29,57,12],
  ["ketchup",69.5,30,10.5],["mayonnaise",69.5,43.5,8.5],["bbq-sauce",69.5,57,10],
  ["pickles",40,23,8],["jalapenos",50,23,8],["olives",60,23,8],
  ["cheese",44,33.3,6.6],["cheddar",56,33.3,6.4],
  ["yoghurt",44,43.3,7],["cream",56,43.3,5.5],
  ["lettuce",45,60,7],["tomatoes",38,59.5,5.2],["pepper",36.5,61,6],["cucumber",42,55.5,3.8],["radishes",48,59,4.6],["spring-onions",41,61,4],
  ["berries",54,59.5,5],["grapes",59,61,6.5],
];
const imgFilter = "saturate(0.9) contrast(0.95) brightness(0.995) drop-shadow(0 2px 3px rgba(10,16,24,.4)) drop-shadow(0 1px 1px rgba(10,16,24,.28))";
const seat = "position:absolute;left:50%;top:100%;transform:translate(-50%,-42%);width:84%;height:22%;min-height:10px;background:radial-gradient(ellipse 50% 55% at 50% 30%,rgba(0,0,0,.6),rgba(4,8,14,.32) 42%,rgba(4,8,14,0) 76%);filter:blur(2.6px);z-index:-1";
const objHtml = OBJ.map(([s,x,y,h]) =>
  `<div style="position:absolute;left:${x}%;top:${y-h}%;height:${h}%;transform:translate(-50%,0);display:flex;justify-content:center">
     <span style="${seat}"></span>
     <img src="${A(s)}" style="height:100%;width:auto;filter:${imgFilter}">
   </div>`).join("");

const shelvesMask = "linear-gradient(to bottom,transparent 0 23.6%,#000 23.6% 26%,transparent 26% 34%,#000 34% 36.5%,transparent 36.5% 44.1%,#000 44.1% 46.5%,transparent 46.5% 100%)";
const doorMask = "linear-gradient(to bottom,transparent 0 19%,#000 19% 22.8%,transparent 22.8% 29.5%,#000 29.5% 34.2%,transparent 34.2% 43%,#000 43% 48%,transparent 48% 56.5%,#000 56.5% 62.3%,transparent 62.3% 100%)";
const front = (clip: string, op: number, mask?: string) =>
  `<div style="position:absolute;inset:0;background:url('${plate}') center/cover;opacity:${op};clip-path:${clip};${mask?`-webkit-mask-image:${mask};mask-image:${mask}`:""}"></div>`;

const html = `<!doctype html><html><body style="margin:0">
<div style="position:relative;width:1440px;height:980px;overflow:hidden;background:#cfcfcf">
  <div style="position:absolute;inset:0;transform:scale(1.2);transform-origin:50% 22%">
    <div style="position:absolute;inset:0;background:url('${plate}') center/cover"></div>
    <div style="position:absolute;inset:0">${objHtml}</div>
    ${process.env.DEBUG_LINES ? [24,34.5,45.5,48].map(y=>`<div style="position:absolute;left:33%;right:33%;top:${y}%;height:0;border-top:2px solid red"></div><div style="position:absolute;left:33%;top:${y}%;color:red;font:bold 11px sans-serif;transform:translateY(-100%)">${y}</div>`).join("") : ""}
    ${front("polygon(34.5% 48%,64.5% 48%,64.5% 62.5%,34.5% 62.5%)",0.55)}
    ${front("polygon(34.5% 12%,64.5% 12%,64.5% 48%,34.5% 48%)",0.9,shelvesMask)}
    ${front("polygon(24% 12%,34.5% 12%,34.5% 66%,24% 66%)",0.92,doorMask)}
    ${front("polygon(64.5% 12%,74.5% 12%,74.5% 66%,64.5% 66%)",0.92,doorMask)}
  </div>
</div></body></html>`;

(async () => {
  const fs = await import("fs");
  const htmlPath = path.resolve(`${REPO}/artifacts/_fridge-full.html`);
  fs.writeFileSync(htmlPath, html);
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  const out = path.resolve("docs/implementation/pantry-final-evidence/fridge-full-offline.png");
  await p.screenshot({ path: out });
  console.log("->", out);
  await b.close();
})();
