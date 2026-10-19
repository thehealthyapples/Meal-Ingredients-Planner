import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const scannerSource = readFileSync(path.join(process.cwd(), "client/src/pages/meals-page.tsx"), "utf8");
const realBookSource = readFileSync(path.join(process.cwd(), "client/src/pages/cookbook-real-book-concept.tsx"), "utf8");
assert.match(realBookSource, /navigate\("\/cookbook\/grid\?openScan=1"\)/, "Real Book hands Scan to the canonical Cookbook scanner entry");
assert.match(scannerSource, /params\.get\("openScan"\)\s*===\s*"1"/, "legacy Cookbook accepts standalone openScan entry");
assert.match(scannerSource, /scanFileRef\.current\?\.click\(\)/, "standalone scan entry opens canonical recipe file input");
assert.match(scannerSource, /navigate\("\/cookbook",\s*\{\s*replace:\s*true\s*\}/, "standalone scan entry removes its URL flag without leaving Cookbook");
console.log("cookbook canonical scan entry contract: ok");
