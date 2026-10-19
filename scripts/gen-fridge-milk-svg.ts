// Fridge item — photoreal glass milk bottle, drawn as SVG (northstar jar technique).
// Layered like the jars: baked shadow · back glass · milk (with cylindrical shading)
// · front reflections + daylight · foil cap · vector label. Rendered to PNG (480x860).
import { chromium } from "playwright";
import path from "node:path";

const W = 480, H = 860, CX = 240;

// Smooth glass milk-bottle silhouette (cubic shoulders, short neck).
const bottlePath =
  `M 112 776 Q 112 800 136 800 L 344 800 Q 368 800 368 776 L 368 300 ` +
  `C 368 240 330 200 296 186 L 296 120 Q 296 113 289 113 L 191 113 Q 184 113 184 120 L 184 186 ` +
  `C 150 200 112 240 112 300 Z`;
// Milk fills the body; surface sits just under the shoulder with a meniscus.
const milkTop = `M 116 300 Q 240 309 364 300`;
const milkPath = `${milkTop} L 364 776 Q 364 796 344 796 L 136 796 Q 116 796 116 776 Z`;

function svg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="bottle"><path d="${bottlePath}"/></clipPath>
    <!-- milk: vertical tone, then a cylindrical horizontal shade, then a core highlight -->
    <linearGradient id="milk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#faf6ee"/><stop offset="1" stop-color="#ece5d5"/></linearGradient>
    <linearGradient id="milkCyl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(150,138,110,0.30)"/><stop offset="0.12" stop-color="rgba(150,138,110,0.05)"/>
      <stop offset="0.32" stop-color="rgba(255,255,255,0.10)"/><stop offset="0.6" stop-color="rgba(150,138,110,0)"/>
      <stop offset="0.86" stop-color="rgba(120,108,84,0.14)"/><stop offset="1" stop-color="rgba(96,86,64,0.34)"/></linearGradient>
    <linearGradient id="glassTint" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(210,226,228,0.24)"/><stop offset="0.2" stop-color="rgba(244,250,250,0.07)"/>
      <stop offset="0.5" stop-color="rgba(240,248,248,0.03)"/><stop offset="0.82" stop-color="rgba(224,234,236,0.08)"/>
      <stop offset="1" stop-color="rgba(202,220,224,0.26)"/></linearGradient>
    <linearGradient id="foil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2f3f5"/><stop offset="0.4" stop-color="#d2d4da"/><stop offset="1" stop-color="#9a9ca4"/></linearGradient>
    <linearGradient id="daylight" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="rgba(255,252,244,0.24)"/><stop offset="0.5" stop-color="rgba(255,252,244,0)"/></linearGradient>
    <radialGradient id="baseGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="rgba(255,255,255,0.5)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="soft1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
  </defs>

  <!-- baked contact shadow -->
  <ellipse cx="${CX}" cy="806" rx="150" ry="15" fill="rgba(18,22,28,0.34)" filter="url(#soft)"/>

  <!-- back glass -->
  <path d="${bottlePath}" fill="url(#glassTint)" stroke="rgba(122,142,148,0.5)" stroke-width="2.2"/>

  <!-- milk with cylindrical shading -->
  <g clip-path="url(#bottle)">
    <path d="${milkPath}" fill="url(#milk)"/>
    <path d="${milkPath}" fill="url(#milkCyl)"/>
    <!-- vertical core light -->
    <rect x="150" y="300" width="60" height="496" fill="rgba(255,255,255,0.22)" filter="url(#soft)"/>
    <!-- meniscus: bright surface line + soft shadow just beneath -->
    <path d="${milkTop}" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="3.5" filter="url(#soft1)"/>
    <path d="M 116 306 Q 240 315 364 306" fill="none" stroke="rgba(120,108,84,0.22)" stroke-width="5" filter="url(#soft2)"/>
    <!-- thick glass base rim -->
    <ellipse cx="${CX}" cy="782" rx="118" ry="12" fill="rgba(120,110,86,0.18)" filter="url(#soft2)"/>
    <ellipse cx="${CX}" cy="778" rx="116" ry="10" fill="url(#baseGlow)" opacity="0.5"/>
  </g>

  <!-- glass front: reflections + daylight -->
  <g>
    <!-- crisp specular streak (left) -->
    <rect x="150" y="316" width="15" height="430" rx="7" fill="rgba(255,255,255,0.5)" filter="url(#soft1)"/>
    <rect x="172" y="330" width="7" height="380" rx="3" fill="rgba(255,255,255,0.28)" filter="url(#soft1)"/>
    <!-- rim light on the right edge -->
    <path d="M 362 320 C 362 500 360 680 350 760" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="5" filter="url(#soft2)"/>
    <!-- shoulder catch -->
    <path d="M 150 232 C 175 205 210 194 236 192" fill="none" stroke="rgba(255,255,255,0.34)" stroke-width="5" filter="url(#soft2)"/>
    <!-- neck highlight -->
    <rect x="210" y="120" width="14" height="66" rx="7" fill="rgba(255,255,255,0.30)" filter="url(#soft1)"/>
    <path d="${bottlePath}" fill="url(#daylight)"/>
    <path d="${bottlePath}" fill="none" stroke="rgba(255,255,255,0.26)" stroke-width="1"/>
  </g>

  <!-- neck lip -->
  <rect x="182" y="115" width="116" height="9" rx="4" fill="rgba(232,238,240,0.7)" stroke="rgba(120,140,146,0.4)" stroke-width="1"/>

  <!-- foil cap: dome + crimp ridges + highlight -->
  <path d="M 180 118 L 300 118 L 296 96 Q 240 80 184 96 Z" fill="url(#foil)" stroke="rgba(118,122,130,0.5)" stroke-width="1.4"/>
  ${Array.from({ length: 9 }, (_, i) => { const x = 190 + i * 12; return `<line x1="${x}" y1="98" x2="${x}" y2="118" stroke="rgba(120,124,132,0.35)" stroke-width="1"/>`; }).join("")}
  <path d="M 184 96 Q 240 80 296 96" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" filter="url(#soft1)"/>
  <rect x="196" y="98" width="12" height="20" rx="6" fill="rgba(255,255,255,0.45)" filter="url(#soft1)"/>

  <!-- paper label, clean vector text -->
  <g>
    <rect x="138" y="502" width="204" height="128" rx="8" fill="#f6f1e6" stroke="rgba(120,105,80,0.30)" stroke-width="1.4"/>
    <rect x="138" y="502" width="204" height="128" rx="8" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1" transform="translate(0 1)"/>
    <text x="${CX}" y="556" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="29" font-weight="600" letter-spacing="1.5" fill="#3a352e">WHOLE</text>
    <text x="${CX}" y="598" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="29" font-weight="600" letter-spacing="2.5" fill="#3a352e">MILK</text>
  </g>
</svg>`;
}

async function main() {
  const outStd = path.resolve("docs/implementation/pantry-final-evidence/proto-milk.png");
  const asset = path.resolve("client/src/assets/living-home/larder/fridge/tha-fridge-milk-svg.png");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:transparent">${svg()}</body>`);
  await page.screenshot({ path: outStd, omitBackground: true });
  await page.screenshot({ path: asset, omitBackground: true });
  console.log("wrote", outStd);
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
