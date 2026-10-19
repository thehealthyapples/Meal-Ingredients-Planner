import { chromium } from "playwright";
import path from "path";
import { pathToFileURL } from "url";
const REPO = "C:/Users/Colin/The Healthy Apples/GitHub/tha-living-larder-authoritative";
const plate = pathToFileURL(`${REPO}/client/public/images/living-home/room/work-fridge-empty.png`).href;
const juice = pathToFileURL(`${REPO}/client/src/assets/living-home/larder/fridge/tha-fridge-juice.png`).href;
const tilt = Number(process.argv[2] ?? 26);

const maskBands = "linear-gradient(to bottom, transparent 0 19%, #000 19% 22.8%, transparent 22.8% 29.5%, #000 29.5% 34.2%, transparent 34.2% 43%, #000 43% 48%, transparent 48% 56.5%, #000 56.5% 62.3%, transparent 62.3% 100%)";
const html = `<!doctype html><html><body style="margin:0">
<div style="position:relative;width:1440px;height:980px;overflow:hidden;background:#dcdcdc">
  <div style="position:absolute;inset:0;transform:scale(1.2);transform-origin:50% 22%">
    <div style="position:absolute;inset:0;background:url('${plate}') center/cover"></div>
    <div style="position:absolute;inset:0">
      <img src="${juice}" style="position:absolute;left:29%;top:36%;height:12%;width:auto;
        transform:translate(-50%,0) perspective(700px) rotateY(${tilt}deg);transform-origin:50% 100%;
        filter:saturate(0.9) contrast(0.95) drop-shadow(0 2px 3px rgba(10,16,24,.4))">
    </div>
    <div style="position:absolute;inset:0;background:url('${plate}') center/cover;opacity:.92;
      clip-path:polygon(24% 12%,34.5% 12%,34.5% 66%,24% 66%);
      -webkit-mask-image:${maskBands};mask-image:${maskBands}"></div>
  </div>
</div></body></html>`;

(async () => {
  const fs = await import("fs");
  const htmlPath = path.resolve(`${REPO}/artifacts/_juice-tilt.html`);
  fs.writeFileSync(htmlPath, html);
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  const out = path.resolve(`docs/implementation/pantry-final-evidence/juice-tilt-${tilt}.png`);
  await p.screenshot({ path: out, clip: { x: 250, y: 260, width: 460, height: 500 } });
  console.log("tilt", tilt, "->", out);
  await b.close();
})();
