/**
 * EXP3 Phase 2 — `verify:living-home-assets`.
 *
 * The Living Home's constancy gate (EXP3 § 7.4). It proves, mechanically, that:
 *
 *   1. every House-Register asset's bytes match its registered hash — the house
 *      cannot drift (EXP3 § 4.4);
 *   2. the Life Register (living-details-manifest.ts) obeys one-per-realm and every
 *      spec discloses `binding`, `admittedBy`, `retires` (EXP3 § 7.2 / § 12.1);
 *   3. NO occasion/tradition-shaped key appears in the Life manifest
 *      (LH3 · LIVINGHOME1 § 10.4 made mechanical);
 *   4. nothing outside the owner component imports from `assets/living-home/`
 *      (one mouth — EXP3 § 6 / § 7.1);
 *   5. no Life asset is authored-but-unadopted and no manifest id resolves to no
 *      asset (EXP3 § 7.4.5).
 *
 * Read-only: hashes and reads files, writes nothing.
 * Exit codes: 0 — all checks pass · 1 — any check fails or a fatal error.
 * Run with: npm run verify:living-home-assets
 *
 * Extension point (declared, not built): when the Environmental Dressing Register
 * exists (ED2+, LIVINGHOME2 § 10.3 — gated behind the § 10.2 amendments landed by
 * ED1 and this Phase 2), its third-register checks are added in `dressingChecks()`
 * below. They are NOT part of this Phase 2 (ED1 § 2 Amendment 4).
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { livingDetailsManifest } from "../../client/src/components/layout/living-details-manifest";

const ROOT = resolve(process.cwd());
const HOUSE_REGISTER = "docs/implementation/assets/house-asset-register.json";
const LIFE_ASSET_DIR = "client/src/assets/living-home";
const LIFE_OWNER_COMPONENT = "client/src/components/layout/living-details.tsx";
const CLIENT_SRC = "client/src";

const ICON = { pass: "✓", fail: "✗", skip: "○" } as const;

interface CheckResult {
  title: string;
  outcome: "pass" | "fail" | "skip";
  detail: string;
}

const results: CheckResult[] = [];
function record(title: string, outcome: CheckResult["outcome"], detail: string) {
  results.push({ title, outcome, detail });
}

function sha256(absPath: string): string {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

/** Walk a directory returning every file path relative to ROOT. */
function walk(absDir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(absDir)) {
    const abs = join(absDir, entry);
    if (statSync(abs).isDirectory()) out.push(...walk(abs));
    else out.push(relative(ROOT, abs));
  }
  return out;
}

// ── Check 1 — House Register: bytes match registered hashes (EXP3 § 4.4) ──────────
function checkHouseRegister() {
  const regPath = resolve(ROOT, HOUSE_REGISTER);
  if (!existsSync(regPath)) {
    record("House Register present", "fail", `${HOUSE_REGISTER} is missing.`);
    return;
  }
  let register: { assets?: Array<{ id: string; path: string; sha256: string }> };
  try {
    register = JSON.parse(readFileSync(regPath, "utf8"));
  } catch (e) {
    record("House Register parses", "fail", `${HOUSE_REGISTER} is not valid JSON: ${(e as Error).message}`);
    return;
  }
  const assets = register.assets ?? [];
  if (assets.length === 0) {
    record("House Register has assets", "fail", "The House Register lists no assets.");
    return;
  }
  const drifted: string[] = [];
  for (const a of assets) {
    const abs = resolve(ROOT, a.path);
    if (!existsSync(abs)) {
      drifted.push(`${a.id}: file missing at ${a.path}`);
      continue;
    }
    const actual = sha256(abs);
    if (actual !== a.sha256) {
      drifted.push(`${a.id}: ${a.path} drifted (registered ${a.sha256.slice(0, 12)}…, actual ${actual.slice(0, 12)}…). Update the register row in the SAME commit, citing the amendment (EXP3 § 4.4).`);
    }
  }
  if (drifted.length) {
    record("House assets match registered hashes", "fail", drifted.join("  |  "));
  } else {
    record("House assets match registered hashes", "pass", `${assets.length} House asset(s) byte-locked and unchanged.`);
  }
}

// ── Check 2 — Life manifest: one-per-realm + required disclosure (EXP3 § 7.2) ─────
const OCCASION_TOKENS = [
  "occasion", "tradition", "celebration", "holiday", "festival",
  "christmas", "easter", "eid", "diwali", "hanukkah", "passover", "ramadan", "wreath",
];

function checkLifeManifest() {
  const realms = Object.keys(livingDetailsManifest);
  if (realms.length === 0) {
    record("Life manifest well-formed", "pass", "Manifest is empty (EXP3 Phase 2 — no detail admitted yet). One-per-realm and disclosure hold vacuously.");
    return;
  }
  const problems: string[] = [];
  for (const realm of realms) {
    const spec = (livingDetailsManifest as Record<string, unknown>)[realm] as
      | { id?: string; admittedBy?: string; retires?: unknown; binding?: { source?: string; predicate?: string } }
      | undefined;
    if (!spec) continue;
    if (!spec.admittedBy) problems.push(`${realm}: spec lacks 'admittedBy' (no anonymous charm — EXP3 § 7.2).`);
    if (!("retires" in spec)) problems.push(`${realm}: spec lacks 'retires' disclosure (Blueprint § 12.1.1).`);
    if (!spec.binding || !spec.binding.source || !spec.binding.predicate) {
      problems.push(`${realm}: spec lacks a complete 'binding' (source + predicate). A binding is what makes it Life, not Dressing (EXP3 § 7.2).`);
    }
  }
  if (problems.length) record("Life manifest well-formed", "fail", problems.join("  |  "));
  else record("Life manifest well-formed", "pass", `${realms.length} realm(s), each one spec with binding/admittedBy/retires disclosed.`);
}

// ── Check 3 — no occasion/tradition key in the Life manifest (LH3) ────────────────
function checkNoOccasionKeys() {
  const serialized = JSON.stringify(livingDetailsManifest).toLowerCase();
  const hits = OCCASION_TOKENS.filter((t) => serialized.includes(t));
  if (hits.length) {
    record("No occasion/tradition key in Life manifest", "fail", `Forbidden occasion/tradition token(s) present: ${hits.join(", ")}. A tradition never carries a Life asset (LH3 · LIVINGHOME1 § 10.4); occasions reach the home only as words/doors/food, and — claim-free — through the separate Dressing register.`);
  } else {
    record("No occasion/tradition key in Life manifest", "pass", "No occasion/tradition-shaped key present.");
  }
}

// ── Check 4 — only the owner component imports assets/living-home/ (EXP3 § 6) ─────
function checkSingleMouth() {
  const clientAbs = resolve(ROOT, CLIENT_SRC);
  if (!existsSync(clientAbs)) {
    record("Only the owner component imports Life assets", "skip", `${CLIENT_SRC} not found.`);
    return;
  }
  const offenders: string[] = [];
  for (const file of walk(clientAbs)) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    if (file === LIFE_OWNER_COMPONENT) continue; // the one lawful mouth (lands Phase 3)
    const src = readFileSync(resolve(ROOT, file), "utf8");
    if (src.includes("assets/living-home")) {
      offenders.push(`${file} imports from assets/living-home/ — only ${LIFE_OWNER_COMPONENT} may (EXP3 § 6/§ 7.1).`);
    }
  }
  if (offenders.length) record("Only the owner component imports Life assets", "fail", offenders.join("  |  "));
  else record("Only the owner component imports Life assets", "pass", "No unauthorised import of assets/living-home/ (the dir is unbuilt; the mouth lands with its first consumer).");
}

// ── Check 5 — no orphan Life asset, no dangling manifest id (EXP3 § 7.4.5) ─────────
function checkNoOrphans() {
  const dirAbs = resolve(ROOT, LIFE_ASSET_DIR);
  const onDisk = existsSync(dirAbs)
    ? walk(dirAbs).filter((f) => /\.(webp|avif|png|svg|jpg|jpeg)$/i.test(f))
    : [];

  const referencedIds = new Set<string>();
  for (const realm of Object.keys(livingDetailsManifest)) {
    const spec = (livingDetailsManifest as Record<string, { objects?: Array<{ id: string }> }>)[realm];
    for (const obj of spec?.objects ?? []) referencedIds.add(obj.id);
  }

  const problems: string[] = [];
  // Orphan assets: a file on disk whose id (basename without extension) no manifest references.
  for (const file of onDisk) {
    const base = file.split("/").pop()!.replace(/\.[^.]+$/, "");
    if (!referencedIds.has(base)) {
      problems.push(`orphan asset ${file} — authored but unadopted (UIA § 17).`);
    }
  }
  // Dangling ids: a manifest object id with no asset file.
  const diskBasenames = new Set(onDisk.map((f) => f.split("/").pop()!.replace(/\.[^.]+$/, "")));
  for (const id of referencedIds) {
    if (!diskBasenames.has(id)) problems.push(`manifest object id "${id}" resolves to no asset in ${LIFE_ASSET_DIR}/.`);
  }

  if (onDisk.length === 0 && referencedIds.size === 0) {
    record("No orphan Life assets / dangling ids", "pass", `${LIFE_ASSET_DIR}/ is unbuilt and the manifest references no object — nothing to orphan (EXP3 Phase 2).`);
  } else if (problems.length) {
    record("No orphan Life assets / dangling ids", "fail", problems.join("  |  "));
  } else {
    record("No orphan Life assets / dangling ids", "pass", `${onDisk.length} asset(s) all referenced; ${referencedIds.size} id(s) all resolved.`);
  }
}

// ── Extension point: Dressing Register (DECLARED-NOT-BUILT — LIVINGHOME2 § 10.3) ──
function dressingChecks() {
  // Intentionally empty. When ED2 builds the empty Dressing Register, its checks land
  // here (ED1 § 2 Amendment 4): register checksums; NO household-data binding reachable
  // from the dressing mouth (a `binding` field is the § 9.10 forgery); celebration items
  // unreachable without the § 7.2 per-tradition permission; placement exclusions
  // (LIVINGHOME2 § 5.1) enforced; every dressing item's admission doc exists.
}

function main() {
  console.log("EXP3 Phase 2 — Living Home Asset Verification");
  console.log("=============================================\n");

  checkHouseRegister();
  checkLifeManifest();
  checkNoOccasionKeys();
  checkSingleMouth();
  checkNoOrphans();
  dressingChecks();

  let failed = 0;
  for (const r of results) {
    console.log(`${ICON[r.outcome]} [${r.outcome.toUpperCase()}] ${r.title}`);
    console.log(`    ${r.detail}`);
    if (r.outcome === "fail") failed++;
  }

  const passed = results.filter((r) => r.outcome === "pass").length;
  const skipped = results.filter((r) => r.outcome === "skip").length;
  console.log("\n── Living Home asset verification ──");
  console.log(`Checks: ${results.length} run — ${passed} passed, ${failed} failed, ${skipped} skipped`);

  if (failed > 0) {
    console.error(`\nRESULT: FAIL — ${failed} check(s) failed. The Living Home must not drift.`);
    process.exitCode = 1;
  } else {
    console.log("\nRESULT: PASS — the house is byte-locked; the Life register is honest and empty.");
  }
}

try {
  main();
} catch (err) {
  console.error("Fatal:", err);
  process.exit(1);
}
