import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(path.join(process.cwd(), "client/src/pages/meals-page.tsx"), "utf8");
assert.match(source, /params\.get\("openScan"\)\s*===\s*"1"/, "legacy Cookbook accepts standalone openScan entry");
assert.match(source, /scanFileRef\.current\?\.click\(\)/, "standalone scan entry opens canonical recipe file input");
assert.match(source, /navigate\("\/cookbook",\s*\{\s*replace:\s*true\s*\}/, "standalone scan entry removes its URL flag without leaving Cookbook");
console.log("cookbook canonical scan entry contract: ok");