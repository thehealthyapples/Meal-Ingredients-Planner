const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const imagePath = path.join(root, 'client/public/orchard.webp');
const orchard = fs.readFileSync(imagePath).toString('base64');
const imageHref = `data:image/webp;base64,${orchard}`;
const out = __dirname;

const C = {
  ink: '#26332c', olive: '#657144', muted: '#74796d', paper: '#fbf8f0',
  white: '#fffdf8', line: '#ded8c7', soft: '#eeeadc', sky: '#eef4ed',
  gold: '#b68c44', green: '#6d8150', blue: '#5e8294', pale: '#f3efe5',
};

function esc(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function text(x, y, value, size = 18, fill = C.ink, weight = 400, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
}
function rect(x, y, w, h, fill, rx = 12, stroke = 'none') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
}
function rule(x1, y1, x2, y2, color = C.line, width = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
}
function badge(x, y, label, fill = C.soft, color = C.olive) {
  const w = label.length * 8 + 26;
  return `${rect(x, y - 22, w, 32, fill, 16)}${text(x + w / 2, y, label, 13, color, 600, 'middle')}`;
}
function base({ title, tab, scope, screen = 'DESKTOP CONCEPT' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1000" viewBox="0 0 1440 1000">
<defs><clipPath id="garden"><rect width="1440" height="190"/></clipPath><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#38422d" flood-opacity=".10"/></filter></defs>
<rect width="1440" height="1000" fill="${C.paper}"/>
<g clip-path="url(#garden)"><image href="${imageHref}" x="0" y="0" width="1440" height="220" preserveAspectRatio="xMidYMid slice"/><rect x="0" y="0" width="1440" height="190" fill="#f4f2e5" opacity=".25"/></g>
<rect x="0" y="190" width="1440" height="750" fill="${C.paper}"/>
${rect(0, 190, 1440, 2, C.line, 0)}
${text(54, 224, 'THE HEALTHY APPLES', 12, C.olive, 700)}${text(1385, 224, screen, 12, C.muted, 600, 'end')}
${text(54, 276, title, 32, C.ink, 600)}${text(54, 305, scope, 15, C.muted, 400)}
${rect(54, 326, 1332, 54, C.white, 13, C.line)}
${badge(72, 361, 'Foods', tab === 'Foods' ? C.olive : C.soft, tab === 'Foods' ? C.white : C.muted)}
${badge(158, 361, 'Nutrients', tab === 'Nutrients' ? C.olive : C.soft, tab === 'Nutrients' ? C.white : C.muted)}
${text(1365, 360, 'CONCEPT ONLY · SAMPLE VALUES', 12, C.muted, 600, 'end')}
${rule(0, 940, 1440, 940, C.line, 1)}
${rect(0, 941, 1440, 59, C.white, 0)}
${['Home', 'Planner', 'Cookbook', 'Shopping', 'Pantry', 'Nutrition', 'Diary', 'Analyser', 'Household'].map((n, i) => `${text(255 + i * 118, 976, n, 13, n === 'Nutrition' ? C.olive : C.muted, n === 'Nutrition' ? 600 : 400, 'middle')}`).join('')}
${text(54, 920, 'Concept values are illustrative and are not live household data.', 12, C.muted, 400)}
`;
}

function panel(x, y, w, h, title, kicker = '') {
  return `${rect(x, y, w, h, C.white, 16, C.line)}${kicker ? text(x + 24, y + 30, kicker.toUpperCase(), 11, C.olive, 700) : ''}${text(x + 24, y + (kicker ? 62 : 38), title, 21, C.ink, 600)}`;
}

const foods = base({ title: 'Foods', tab: 'Foods', scope: 'Your planned meals this week · Week of 26 October' }) +
  panel(54, 405, 860, 174, 'This week’s food variety', 'One factual summary') +
  text(82, 514, '8', 52, C.olive, 600) + text(128, 510, 'plant groups appear across 6 planned meals', 20, C.ink, 500) +
  text(82, 548, 'Based on ingredients matched to the canonical plant groups for this planner week.', 14, C.muted) +
  panel(936, 405, 450, 174, 'At a glance', 'This planner week') +
  text(966, 514, '6', 35, C.ink, 600) + text(1008, 510, 'meals', 16, C.muted) +
  text(1125, 514, '8', 35, C.ink, 600) + text(1167, 510, 'plant groups', 16, C.muted) +
  panel(54, 602, 1332, 282, 'Foods in the planner', 'Details') +
  `${text(82, 711, 'Plant foods', 16, C.ink, 600)}${text(420, 711, 'Beans · leafy greens · fruit · whole grains', 15, C.muted)}${text(1335, 711, 'View foods', 14, C.olive, 600, 'end')}${rule(82, 732, 1358, 732)}` +
  `${text(82, 777, 'Other ingredients', 16, C.ink, 600)}${text(420, 777, 'Eggs · dairy · fish', 15, C.muted)}${text(1335, 777, '6 meals', 14, C.muted, 500, 'end')}${rule(82, 798, 1358, 798)}` +
  `${text(82, 843, 'Every figure names its week and source.', 14, C.muted)}${text(1355, 843, 'Evidence and interpretation stay separate', 13, C.olive, 500, 'end')}` + '</svg>';

const nutrients = base({ title: 'Nutrients', tab: 'Nutrients', scope: 'All available planner history · Knowledge coverage, not measured nutrient intake' }) +
  panel(54, 405, 850, 204, 'Nutrients linked to foods in your planner history', 'A factual notice') +
  text(82, 520, '18', 58, C.olive, 600) + text(151, 516, 'nutrients are currently linked to the foods shown', 20, C.ink, 500) +
  text(82, 559, 'This describes available food knowledge. It does not estimate what anyone consumed.', 15, C.muted) +
  text(82, 585, 'Coverage depends on which foods have reviewed nutrient records.', 14, C.muted) +
  panel(926, 405, 460, 204, 'How to read this', 'Evidence') +
  `${text(954, 505, 'Knowledge coverage', 17, C.ink, 600)}${text(954, 535, 'What the registry links to those foods', 14, C.muted)}${text(954, 570, 'Intake', 17, C.ink, 600)}${text(954, 597, 'Not available from these coverage counts', 14, C.muted)}` +
  panel(54, 632, 1332, 252, 'Knowledge connected to foods', 'Details') +
  `${text(82, 734, 'Nutrient', 14, C.muted, 600)}${text(672, 734, 'Foods with a reviewed link', 14, C.muted, 600)}${text(1330, 734, 'Evidence', 14, C.muted, 600, 'end')}${rule(82, 750, 1358, 750)}` +
  `${text(82, 792, 'Fibre', 17, C.ink, 500)}${text(672, 792, 'Example list from the registry', 15, C.muted)}${text(1330, 792, 'View source', 14, C.olive, 600, 'end')}${rule(82, 812, 1358, 812)}` +
  `${text(82, 853, 'No daily targets or health judgments are implied.', 14, C.muted)}` + '</svg>';

const evidence = base({ title: 'Nutrients', tab: 'Nutrients', scope: 'A proposed detail view · available only when source links are verified' }) +
  panel(54, 405, 1332, 94, 'Nutrient detail', 'Selected item') +
  `${badge(82, 476, 'Example: fibre', C.soft, C.olive)}${text(320, 476, 'Open a source trail only when the registry can identify the food and evidence.', 15, C.muted)}` +
  panel(54, 522, 640, 300, 'Foods associated with this entry', 'Canonical food links') +
  `${text(82, 631, 'Oats', 17, C.ink, 500)}${text(638, 631, 'Food page', 14, C.olive, 600, 'end')}${rule(82, 650, 664, 650)}` +
  `${text(82, 700, 'Lentils', 17, C.ink, 500)}${text(638, 700, 'Food page', 14, C.olive, 600, 'end')}${rule(82, 719, 664, 719)}` +
  `${text(82, 773, 'No household intake amount is inferred.', 14, C.muted)}` +
  panel(716, 522, 670, 300, 'Where this comes from', 'Provenance') +
  `${text(744, 631, 'Knowledge owner', 15, C.muted)}${text(1348, 631, 'Nutrition Knowledge Registry', 15, C.ink, 500, 'end')}${rule(744, 650, 1358, 650)}` +
  `${text(744, 700, 'Evidence state', 15, C.muted)}${text(1348, 700, 'Reviewed record available', 15, C.ink, 500, 'end')}${rule(744, 719, 1358, 719)}` +
  `${text(744, 773, 'The source-meal drill-down is a separate approved interaction.', 14, C.muted)}` + '</svg>';

const empty = base({ title: 'Foods', tab: 'Foods', scope: 'An honest explanation when this planner week has no meal data' }) +
  `${rect(206, 436, 1028, 356, C.white, 20, C.line)}<circle cx="720" cy="518" r="38" fill="${C.soft}"/>` +
  `${text(720, 529, 'i', 30, C.olive, 600, 'middle')}${text(720, 602, 'No meal data for this week yet', 27, C.ink, 600, 'middle')}` +
  `${text(720, 646, 'A food summary will appear when the Planner has meals for the selected week.', 17, C.muted, 400, 'middle')}` +
  `${text(720, 679, 'We do not treat missing information as zero or as a household score.', 15, C.muted, 400, 'middle')}` +
  `${rect(626, 714, 188, 44, C.olive, 10)}${text(720, 742, 'Open Planner', 15, C.white, 600, 'middle')}` + '</svg>';

const phone = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1120" viewBox="0 0 600 1120">
<defs><clipPath id="phoneGarden"><rect x="46" y="34" width="508" height="270" rx="28"/></clipPath><filter id="phoneShadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#2d3327" flood-opacity=".16"/></filter></defs>
<rect width="600" height="1120" fill="#e6e1d5"/><rect x="34" y="20" width="532" height="1080" rx="36" fill="${C.white}" filter="url(#phoneShadow)"/>
<g clip-path="url(#phoneGarden)"><image href="${imageHref}" x="46" y="34" width="508" height="270" preserveAspectRatio="xMidYMid slice"/><rect x="46" y="34" width="508" height="270" fill="#f4f2e5" opacity=".22"/></g>
${text(68, 345, 'Nutrition', 27, C.ink, 600)}${text(68, 373, 'Same orchard view · all copy on solid ground', 13, C.muted)}
${rect(60, 396, 480, 54, C.paper, 14, C.line)}${badge(74, 431, 'Foods', C.olive, C.white)}${badge(160, 431, 'Nutrients', C.soft, C.muted)}${text(520, 431, 'PHONE CONCEPT', 10, C.muted, 600, 'end')}
${rect(60, 472, 480, 198, C.white, 16, C.line)}${text(84, 511, 'THIS PLANNER WEEK', 11, C.olive, 700)}${text(84, 552, 'Your meals include', 17, C.ink, 500)}${text(84, 596, '7 plant groups', 30, C.olive, 600)}${text(84, 631, 'Illustrative example · source and week named', 12, C.muted)}
${rect(60, 690, 480, 254, C.white, 16, C.line)}${text(84, 731, 'Foods in the planner', 20, C.ink, 600)}${text(84, 772, 'Plant foods', 16, C.ink, 500)}${text(84, 800, 'Beans · greens · fruit · grains', 13, C.muted)}${rule(84, 817, 516, 817)}${text(84, 857, 'Other ingredients', 16, C.ink, 500)}${text(84, 885, 'Eggs · dairy · fish', 13, C.muted)}
${text(300, 986, 'CONCEPT ONLY · VALUES ARE ILLUSTRATIVE', 11, C.muted, 600, 'middle')}
</svg>`;

const files = [
  ['01-foods-overview-desktop.svg', foods],
  ['02-nutrients-knowledge-desktop.svg', nutrients],
  ['03-source-detail-desktop.svg', evidence],
  ['04-incomplete-data-desktop.svg', empty],
  ['05-nutrition-phone.svg', phone],
];
for (const [name, svg] of files) fs.writeFileSync(path.join(out, name), svg, 'utf8');
console.log(`Wrote ${files.length} Nutrition concept SVGs using ${path.relative(root, imagePath)}.`);
