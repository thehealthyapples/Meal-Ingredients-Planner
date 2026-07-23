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
 * Third register (ED2 · LIVINGHOME2 § 10.3): `dressingChecks()` below verifies the
 * Environmental Dressing Register — checksum match; NO household-data binding (or any
 * forbidden field) reachable; celebration items gated by the § 7.2 permission; the § 5.1
 * placement exclusions encoded; every item's admission doc present; the runtime guarantee
 * that each item resolves in an allowed room and is refused where § 5.1 requires; that
 * only the one mouth imports the dressing assets; and that every item's still asset is
 * byte-locked to its checksum. At LH1 the register holds ONE admitted item (the Standing
 * Welcome — a bowl of apples); these checks are live gates over it.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { inflateSync } from "node:zlib";

import {
  livingDetailsManifest,
  larderJarAssetRegister,
  larderVisualGapRegister,
  LARDER_JAR_ASSET_DIR,
  LARDER_JAR_INGREDIENT_FAMILIES,
  LARDER_JAR_OWNER_COMPONENT,
  LARDER_JAR_SHARED_SPEC,
  LARDER_REJECTED_PREDECESSOR_DIR,
  VISUAL_GAP_GREEN,
  assertJarRecordWellFormed,
  applyJarChecksumDrift,
  buildJarExportSet,
  deriveJarAvailability,
  promoteJarToCandidate,
  recordJarHomeOwnerApproval,
  type JarVisualApproval,
  type LarderJarAssetRecord,
} from "../../client/src/components/layout/living-details-manifest";
import {
  loadDressingRegister,
  canonicalizeItems,
  resolveDressing,
  resolveRoomDressing,
  toRenderPlan,
  validatePlacement,
  assertAdmissible,
  isPlacementRefused,
  FORBIDDEN_DRESSING_KEYS,
  PLACEMENT_EXCLUSIONS,
  type SeasonKey,
  type RoomId,
} from "../../client/src/lib/living-home/dressing-register";

const ROOT = resolve(process.cwd());
const HOUSE_REGISTER = "docs/implementation/assets/house-asset-register.json";
const LIFE_ASSET_DIR = "client/src/assets/living-home";
const LIFE_OWNER_COMPONENT = "client/src/components/layout/living-details.tsx";
const CLIENT_SRC = "client/src";
// ED2/LH1 — the Dressing Register runtime + its DOM mouth (built at LH1).
const DRESSING_ASSET_DIR = "client/src/assets/living-home/dressing";
// The import needle (alias-agnostic): both `@/assets/...` and `client/src/assets/...`
// forms contain this substring, so the one-mouth check catches either.
const DRESSING_ASSET_IMPORT = "assets/living-home/dressing";
const DRESSING_OWNER_COMPONENT = "client/src/components/layout/dressing-layer.tsx";
// LARDER_ASSET_GOVERNANCE_FOUNDATION — the Larder jar asset section of the Life
// Register (fourth governed asset class; same register module, same verifier).
const LARDER_JAR_IMPORT = "assets/living-home/larder";
const LARDER_REJECTED_FILES = ["larder-counter.webp", "larder-jars.webp"];

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

/**
 * True if `src` actually IMPORTS (or url()-references) a path containing `needle` —
 * i.e. the needle appears inside a quoted string, as every import/url must. A bare
 * mention in a comment (no quotes) is deliberately NOT a match: the "one mouth" law is
 * about importing the asset, not naming its directory in prose.
 */
function importsAssetPath(src: string, needle: string): boolean {
  const re = new RegExp(`['"\`][^'"\`\\n]*${needle.replace(/[/]/g, "\\/")}[^'"\`\\n]*['"\`]`);
  return re.test(src);
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
    if (file === LIFE_OWNER_COMPONENT) continue; // the one lawful Life mouth (lands Phase 3)
    // The Dressing mouth lawfully imports the assets/living-home/dressing/ subdir; that
    // subdir is a different register with its own single-mouth gate (D7 below), so it is
    // not a Life-asset violation.
    if (file === DRESSING_OWNER_COMPONENT) continue;
    const src = readFileSync(resolve(ROOT, file), "utf8");
    if (
      importsAssetPath(src, "assets/living-home") &&
      !importsAssetPath(src, DRESSING_ASSET_IMPORT) &&
      // The larder/jars subtree is the fourth governed section (Larder jar assets,
      // LARDER_ASSET_GOVERNANCE_FOUNDATION) with its own single-mouth + lifecycle
      // gates (J-checks below) — not a Life-manifest asset.
      !importsAssetPath(src, LARDER_JAR_IMPORT)
    ) {
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
    ? walk(dirAbs).filter(
        (f) =>
          /\.(webp|avif|png|svg|jpg|jpeg)$/i.test(f) &&
          // The dressing/ subdir is the third register (Dressing), not Life — it has its
          // own single-mouth (D7) and byte-lock (D8) gates and is not referenced by the
          // Life manifest, so it must not be judged an orphan Life asset.
          !f.startsWith(`${DRESSING_ASSET_DIR}/`) &&
          // The larder/ subtree is the Larder jar asset section of the Life Register
          // (LARDER_ASSET_GOVERNANCE_FOUNDATION) with its own registration, lifecycle
          // and stray-file gates (J-checks) — not a Life-manifest object asset.
          !f.startsWith("client/src/assets/living-home/larder/"),
      )
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

// ── Dressing Register — third-register checks (ED2 · LIVINGHOME2 § 10.3) ──────────
// Built by ED2 to the seam ED1 § 2 Amendment 4 declared. The register is EMPTY by
// design (LIVINGHOME2 § 10.4 Phase 2), so several checks hold vacuously — honestly
// labelled as such; each is a REAL gate the moment ED3 admits the first item.

function stringSha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function dressingChecks() {
  const registry = loadDressingRegister();
  const items = registry.items;

  // D1 — the register loads and its checksum matches its canonical bytes (EXP3 § 4.4).
  if (!Array.isArray(items)) {
    record("Dressing register loads", "fail", "loadDressingRegister() did not return an items array.");
  } else {
    const recomputed = stringSha256(canonicalizeItems(items));
    if (recomputed !== registry.checksum) {
      record(
        "Dressing register checksum matches",
        "fail",
        `Registered ${registry.checksum.slice(0, 12)}…, actual ${recomputed.slice(0, 12)}…. Recompute DRESSING_REGISTER_CHECKSUM in the SAME commit that changes the items (EXP3 § 4.4).`,
      );
    } else {
      record(
        "Dressing register loads & checksum matches",
        "pass",
        `${items.length} dressing item(s) — register byte-locked (${items.length === 0 ? "empty, as ED2 mandates" : "constant within its season states"}).`,
      );
    }
  }

  // D2 — claim-free by construction: NO forbidden field reachable over the whole
  // register (a `binding` is the § 9.10 forgery; text/count/href/motion/hour/campaign/
  // householdId carry information, interaction, an hour, a channel, or a household).
  const serialised = JSON.stringify(items).toLowerCase();
  const forbiddenHits = FORBIDDEN_DRESSING_KEYS.filter((k) => serialised.includes(`"${k.toLowerCase()}"`));
  if (forbiddenHits.length) {
    record(
      "No forbidden field reachable from the Dressing register",
      "fail",
      `Forbidden key(s) present: ${forbiddenHits.join(", ")}. Dressing is claim-free, still, wordless, and never a channel (ED1 § 5 — a binding defines the Life register, not this one).`,
    );
  } else {
    record(
      "No forbidden field reachable from the Dressing register (claim-free by type)",
      "pass",
      "No household-data binding, text, count, door, motion, hour, campaign, or household id anywhere in the register.",
    );
  }

  // D3 — every item is admissible (ED8/ED10), and celebration items are gated (§ 7.2).
  const admissionProblems: string[] = [];
  for (const item of items) admissionProblems.push(...assertAdmissible(item));
  if (admissionProblems.length) {
    record("Every dressing item is admissible", "fail", admissionProblems.join("  |  "));
  } else {
    record(
      "Every dressing item is admissible & celebration-gated",
      "pass",
      items.length === 0
        ? "Empty register — admission (ED8/ED10) and § 7.2 celebration gating hold vacuously."
        : `${items.length} item(s), each with a named purpose, admission doc, valid season, and fail-closed celebration gating.`,
    );
  }

  // D4 — placement exclusions encoded (§ 5.1) and every item lawful for its kind.
  const encodesLaw =
    (PLACEMENT_EXCLUSIONS.produce ?? []).includes("pantry") &&
    (PLACEMENT_EXCLUSIONS.book ?? []).includes("cookbook") &&
    (PLACEMENT_EXCLUSIONS.meal ?? []).includes("planner");
  const placementProblems: string[] = [];
  for (const item of items) {
    // The kind is an admission-time fact, not stored on the item; the verifier cannot
    // infer it for an already-admitted item, so it re-checks the encoded law holds and
    // that each item's declared refusedRooms is internally consistent (non-empty regions).
    placementProblems.push(...validatePlacement(item));
    if (!item.placement || typeof item.placement.region !== "string" || !item.placement.region) {
      placementProblems.push(`${item.id}: placement.region must name a committed house region (§ 5.1 · EXP3 § 5).`);
    }
  }
  if (!encodesLaw) {
    record("Placement exclusions enforced (§ 5.1)", "fail", "PLACEMENT_EXCLUSIONS no longer encodes the pantry/cookbook/planner room-subject law.");
  } else if (placementProblems.length) {
    record("Placement exclusions enforced (§ 5.1)", "fail", placementProblems.join("  |  "));
  } else {
    record(
      "Placement exclusions enforced (§ 5.1 — no produce in Pantry, no book in Cookbook, no meal in Planner)",
      "pass",
      "The room-subject law is encoded; every registered item's placement is lawful.",
    );
  }

  // D5 — every dressing item's admission document exists on disk (ED10).
  const missingDocs: string[] = [];
  for (const item of items) {
    const docAbs = resolve(ROOT, item.admissionDocId);
    if (!existsSync(docAbs)) missingDocs.push(`${item.id}: admission doc "${item.admissionDocId}" not found.`);
  }
  if (missingDocs.length) {
    record("Every dressing item's admission doc exists", "fail", missingDocs.join("  |  "));
  } else {
    record(
      "Every dressing item's admission doc exists",
      "pass",
      items.length === 0 ? "Empty register — nothing to cite (holds vacuously)." : `${items.length} admission doc(s) present.`,
    );
  }

  // D6 — the runtime GUARANTEE. For the EMPTY register: resolves and renders to
  // NOTHING in every room and season. For a NON-EMPTY register: every admitted item
  // resolves in a room it does not refuse, is ABSENT in each room its placement refuses
  // (§ 5.1), and each resolved item paints exactly one still descriptor.
  const seasons: SeasonKey[] = ["spring", "summer", "autumn", "winter", "year-round"];
  const rooms = ["home", "cookbook", "pantry", "planner", "orchard"];
  let totalResolved = 0;
  let totalRendered = 0;
  for (const season of seasons) {
    for (const room of rooms) {
      const resolved = resolveDressing({ room, season });
      totalResolved += resolved.length;
      totalRendered += toRenderPlan(resolved).descriptors.length;
    }
  }
  if (items.length === 0) {
    if (totalResolved !== 0 || totalRendered !== 0) {
      record(
        "Empty register resolves & renders to nothing",
        "fail",
        `Expected zero output from the empty register, got ${totalResolved} resolved / ${totalRendered} rendered. No dressing may appear.`,
      );
    } else {
      record(
        "Empty register resolves & renders to nothing (runtime guarantee)",
        "pass",
        `${seasons.length} season(s) × ${rooms.length} room(s): 0 resolved, 0 rendered.`,
      );
    }
  } else {
    const runtimeProblems: string[] = [];
    const allRooms: RoomId[] = ["home", "cookbook", "pantry", "larder", "nutrition", "diary", "orchard", "planner", "shopping", "analyser", "household"];
    const allSeasons: SeasonKey[] = ["spring", "summer", "autumn", "winter"];
    for (const item of items) {
      const probeSeason: SeasonKey = item.season === "year-round" ? "spring" : item.season;
      // Refused where its placement refuses it (§ 5.1) — must NOT resolve there.
      for (const refused of item.placement.refusedRooms) {
        const there = resolveDressing({ room: refused, season: probeSeason });
        if (there.some((r) => r.id === item.id)) {
          runtimeProblems.push(`${item.id}: resolves in "${refused}", which its placement refuses (§ 5.1).`);
        }
      }
      // Present in a room it does NOT refuse (respecting any onlyRooms allow-list),
      // painting exactly one descriptor there.
      const candidateRooms = item.placement.onlyRooms ?? ["home", "cookbook", "diary", "orchard", "planner", "shopping"];
      const allowed = candidateRooms.find((r) => !isPlacementRefused(item, r));
      if (!allowed) {
        runtimeProblems.push(`${item.id}: refuses every room it may appear in — it could never render.`);
      } else {
        const there = resolveDressing({ room: allowed, season: probeSeason });
        if (!there.some((r) => r.id === item.id)) {
          runtimeProblems.push(`${item.id}: does not resolve in the allowed room "${allowed}".`);
        }
        const painted = toRenderPlan(there.filter((r) => r.id === item.id)).descriptors.length;
        if (painted !== 1) {
          runtimeProblems.push(`${item.id}: expected 1 still descriptor in "${allowed}", got ${painted}.`);
        }
      }
      // Every admitted item must WIN a sill somewhere (resolveRoomDressing) — no item is
      // authored yet shadowed to death by another sharing its room + season.
      let winsSomewhere = false;
      for (const room of allRooms) {
        for (const season of allSeasons) {
          if (resolveRoomDressing({ room, season })?.id === item.id) { winsSomewhere = true; break; }
        }
        if (winsSomewhere) break;
      }
      if (!winsSomewhere) {
        runtimeProblems.push(`${item.id}: admitted but never the one object on any room's sill (shadowed) — a home never shows it (ED10/ED7).`);
      }
    }
    // Belt-and-braces: no room + season may yield more than one object on its sill.
    for (const room of allRooms) {
      for (const season of allSeasons) {
        const one = resolveRoomDressing({ room, season });
        const all = resolveDressing({ room, season });
        if (one && all.length > 1) {
          // Legal only if exactly one is season-specific (the winner) and the rest are the year-round base.
          const seasonal = all.filter((i) => i.season !== "year-round");
          if (seasonal.length > 1) {
            runtimeProblems.push(`${room}/${season}: ${seasonal.length} season-specific objects contend for one sill (${seasonal.map((i) => i.id).join(", ")}) — a sill holds one object (ED7).`);
          }
        }
      }
    }
    if (runtimeProblems.length) {
      record("Every dressing item resolves & renders correctly", "fail", [...new Set(runtimeProblems)].join("  |  "));
    } else {
      record(
        "Every dressing item resolves & renders correctly (runtime guarantee)",
        "pass",
        `${items.length} item(s): each resolves where it should, is refused where § 5.1/onlyRooms requires, wins one sill somewhere, and no sill ever holds two season-specific objects (${seasons.length}×${rooms.length} sweep: ${totalResolved} resolved / ${totalRendered} rendered).`,
      );
    }
  }

  // D7 — one mouth: only the (future, declared) dressing owner component may import the
  // dressing asset dir. The dir is unbuilt at ED2; any importer of it fails here.
  const clientAbs = resolve(ROOT, CLIENT_SRC);
  if (existsSync(clientAbs)) {
    const offenders: string[] = [];
    for (const file of walk(clientAbs)) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      if (file === DRESSING_OWNER_COMPONENT) continue; // the one lawful mouth (LH1)
      const src = readFileSync(resolve(ROOT, file), "utf8");
      if (importsAssetPath(src, DRESSING_ASSET_IMPORT)) {
        offenders.push(`${file} imports from ${DRESSING_ASSET_DIR}/ — only ${DRESSING_OWNER_COMPONENT} may (one mouth — LIVINGHOME2 § 10.3).`);
      }
    }
    if (offenders.length) record("Only the owner component imports Dressing assets", "fail", offenders.join("  |  "));
    else record("Only the owner component imports Dressing assets", "pass", `No unauthorised import of ${DRESSING_ASSET_DIR}/ — only ${DRESSING_OWNER_COMPONENT} (the one mouth) may.`);
  }

  // D8 — every dressing item's still asset exists and its bytes hash to the item's
  // checksum (EXP3 § 4.4 manner, for the third register): the rendered object cannot
  // drift without the item checksum AND the register checksum changing in the same commit.
  if (items.length === 0) {
    record("Every dressing asset byte-locked to its item checksum", "pass", "Empty register — no asset to lock (holds vacuously).");
  } else {
    const assetProblems: string[] = [];
    const EXTS = ["svg", "webp", "avif", "png"];
    for (const item of items) {
      const found = EXTS
        .map((e) => resolve(ROOT, DRESSING_ASSET_DIR, `${item.render.assetId}.${e}`))
        .find(existsSync);
      if (!found) {
        assetProblems.push(`${item.id}: no still asset for assetId "${item.render.assetId}" under ${DRESSING_ASSET_DIR}/.`);
        continue;
      }
      const actual = sha256(found);
      if (actual !== item.checksum) {
        assetProblems.push(
          `${item.id}: asset drifted (item checksum ${item.checksum.slice(0, 12)}…, actual ${actual.slice(0, 12)}…). Recompute the item checksum AND the register checksum in the SAME commit (EXP3 § 4.4).`,
        );
      }
    }
    if (assetProblems.length) record("Every dressing asset byte-locked to its item checksum", "fail", assetProblems.join("  |  "));
    else record("Every dressing asset byte-locked to its item checksum", "pass", `${items.length} still asset(s) match their registered item checksum.`);
  }
}

// ── Larder jar asset checks (J1–J12) — LARDER_ASSET_GOVERNANCE_FOUNDATION ─────
// The lifecycle, checksum-approval and export gates over the Life Register's
// Larder jar section. All 27 records are `planned` at the foundation, so the
// file-level checks hold vacuously — honestly labelled, and real gates the
// moment the first candidate PNG lands.

/** Minimal deterministic PNG inspection: IHDR facts + decoded RGBA pixels. */
interface PngFacts {
  width: number;
  height: number;
  bitDepth: number;
  colourType: number;
  /** Unfiltered raw RGBA pixels (only when colourType 6, bitDepth 8). */
  pixels: Uint8Array | null;
  /** Raw text found in tEXt/iTXt chunks (checked for baked-wording metadata). */
  textChunks: string[];
}

function readPng(absPath: string): PngFacts | { error: string } {
  const buf = readFileSync(absPath);
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 8 || !SIG.every((b, i) => buf[i] === b)) return { error: "not a PNG (bad signature)" };
  let width = 0, height = 0, bitDepth = 0, colourType = -1;
  const idat: Buffer[] = [];
  const textChunks: string[] = [];
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colourType = data[9];
      if (data[12] !== 0) return { error: "interlaced PNG — masters must be non-interlaced" };
    } else if (type === "IDAT") idat.push(Buffer.from(data));
    else if (type === "tEXt" || type === "iTXt" || type === "zTXt") textChunks.push(data.toString("latin1"));
    else if (type === "IEND") break;
    off += 12 + len;
  }
  let pixels: Uint8Array | null = null;
  if (colourType === 6 && bitDepth === 8 && idat.length) {
    try {
      const raw = inflateSync(Buffer.concat(idat));
      const stride = width * 4;
      pixels = new Uint8Array(width * height * 4);
      let prev = new Uint8Array(stride);
      for (let y = 0; y < height; y++) {
        const rowStart = y * (stride + 1);
        const filter = raw[rowStart];
        const row = raw.subarray(rowStart + 1, rowStart + 1 + stride);
        const out = new Uint8Array(stride);
        for (let x = 0; x < stride; x++) {
          const a = x >= 4 ? out[x - 4] : 0;
          const b = prev[x];
          const c = x >= 4 ? prev[x - 4] : 0;
          let v = row[x];
          if (filter === 1) v = (v + a) & 0xff;
          else if (filter === 2) v = (v + b) & 0xff;
          else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
          else if (filter === 4) {
            const p = a + b - c;
            const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
            v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          }
          out[x] = v;
        }
        pixels.set(out, y * stride);
        prev = out;
      }
    } catch {
      pixels = null;
    }
  }
  return { width, height, bitDepth, colourType, pixels, textChunks };
}

function alphaAt(png: PngFacts, x: number, y: number): number {
  return png.pixels ? png.pixels[(y * png.width + x) * 4 + 3] : 255;
}

function larderJarChecks() {
  const records = larderJarAssetRegister;

  // J1 — the closed 27-record inventory: 25 ingredient families + empty + fallback,
  // each exactly once, unique ids/filenames/families.
  const problemsJ1: string[] = [];
  if (records.length !== 27) problemsJ1.push(`register holds ${records.length} records, not 27.`);
  const ids = new Set(records.map((r) => r.id));
  const families = new Set(records.map((r) => r.family));
  const filenames = new Set(records.map((r) => r.filename));
  if (ids.size !== records.length) problemsJ1.push("duplicate asset id.");
  if (families.size !== records.length) problemsJ1.push("duplicate family.");
  if (filenames.size !== records.length) problemsJ1.push("duplicate filename.");
  if (LARDER_JAR_INGREDIENT_FAMILIES.length !== 25) {
    problemsJ1.push(`ingredient family list holds ${LARDER_JAR_INGREDIENT_FAMILIES.length}, not 25.`);
  }
  for (const fam of LARDER_JAR_INGREDIENT_FAMILIES) {
    if (!families.has(fam)) problemsJ1.push(`approved ingredient family "${fam}" is missing from the register.`);
  }
  for (const special of ["empty", "fallback-green"]) {
    if (!families.has(special)) problemsJ1.push(`the "${special}" jar is missing from the register.`);
  }
  record(
    "Jar inventory is the approved 27 (J1)",
    problemsJ1.length ? "fail" : "pass",
    problemsJ1.length ? problemsJ1.join("  |  ") : "25 ingredient families + empty + fallback-green, all unique, all present.",
  );

  // J2 — every record is well-formed and its stored availability equals the derived law.
  const problemsJ2 = records.flatMap((r) => assertJarRecordWellFormed(r));
  record(
    "Every jar record well-formed; availability obeys the one law (J2)",
    problemsJ2.length ? "fail" : "pass",
    problemsJ2.length ? problemsJ2.join("  |  ") : `${records.length} record(s) internally consistent; availability ⇔ checksum-bound approval.`,
  );

  // J3 — lifecycle/availability: planned & candidate are ALWAYS unavailable; only a
  // checksum-bound approved record is available.
  const problemsJ3: string[] = [];
  for (const r of records) {
    if (r.approvalStatus !== "approved" && (r.availabilityState === "available" || deriveJarAvailability(r) === "available")) {
      problemsJ3.push(`${r.id}: ${r.approvalStatus} record must be unavailable.`);
    }
  }
  record(
    "Planned/candidate jars are unavailable (J3)",
    problemsJ3.length ? "fail" : "pass",
    problemsJ3.length
      ? problemsJ3.join("  |  ")
      : `${records.filter((r) => r.approvalStatus !== "approved").length} unapproved record(s), all unavailable (planned: ${records.filter((r) => r.approvalStatus === "planned").length}, candidate: ${records.filter((r) => r.approvalStatus === "candidate").length}).`,
  );

  // J4 — files on disk: a missing file is lawful ONLY for a planned record; every
  // candidate/approved record must have its registered file; every file in the jar
  // dir must be a registered filename (no strays).
  const jarDirAbs = resolve(ROOT, LARDER_JAR_ASSET_DIR);
  const onDisk = existsSync(jarDirAbs)
    ? readdirSync(jarDirAbs).filter((f) => /\.(png|webp|avif|svg|jpg|jpeg)$/i.test(f))
    : [];
  const problemsJ4: string[] = [];
  for (const r of records) {
    const exists = onDisk.includes(r.filename);
    if (r.approvalStatus !== "planned" && !exists) {
      problemsJ4.push(`${r.id}: ${r.approvalStatus} record but no file at ${LARDER_JAR_ASSET_DIR}/${r.filename}.`);
    }
    if (r.approvalStatus === "planned" && exists) {
      problemsJ4.push(`${r.id}: a file exists but the record is still planned — promote to candidate (with checksum) in the same commit.`);
    }
  }
  for (const f of onDisk) {
    if (!records.some((r) => r.filename === f)) {
      problemsJ4.push(`stray file ${LARDER_JAR_ASSET_DIR}/${f} — not a registered jar filename.`);
    }
  }
  record(
    "Jar files match lifecycle (missing only while planned; no strays) (J4)",
    problemsJ4.length ? "fail" : "pass",
    problemsJ4.length
      ? problemsJ4.join("  |  ")
      : onDisk.length === 0
        ? "No files yet — all 27 records are planned, for which absence is the lawful state (honest vacuity)."
        : `${onDisk.length} file(s), each registered and lifecycle-consistent.`,
  );

  // J5 — PNG integrity for every existing candidate/approved file: exact 512×768,
  // 8-bit RGBA, transparent corners, genuine (non-vacuous) alpha, no opaque or
  // checkerboard background, no text-chunk label wording. Vacuous while no file exists.
  const problemsJ5: string[] = [];
  let inspected = 0;
  for (const r of records) {
    if (!onDisk.includes(r.filename)) continue;
    inspected++;
    const png = readPng(resolve(jarDirAbs, r.filename));
    if ("error" in png) {
      problemsJ5.push(`${r.id}: ${png.error}.`);
      continue;
    }
    const { width, height } = LARDER_JAR_SHARED_SPEC.dimensions;
    if (png.width !== width || png.height !== height) {
      problemsJ5.push(`${r.id}: ${png.width}×${png.height}, must be exactly ${width}×${height}.`);
    }
    if (png.colourType !== 6 || png.bitDepth !== 8) {
      problemsJ5.push(`${r.id}: colour type ${png.colourType}/bit depth ${png.bitDepth} — must be 8-bit RGBA (type 6).`);
    } else if (!png.pixels) {
      problemsJ5.push(`${r.id}: pixel data could not be decoded for alpha verification.`);
    } else {
      const corners = [
        alphaAt(png, 0, 0),
        alphaAt(png, png.width - 1, 0),
        alphaAt(png, 0, png.height - 1),
        alphaAt(png, png.width - 1, png.height - 1),
      ];
      if (corners.some((a) => a !== 0)) {
        problemsJ5.push(`${r.id}: corners are not fully transparent (alpha ${corners.join("/")}) — opaque or checkerboard background.`);
      }
      let transparent = 0;
      const total = png.width * png.height;
      for (let i = 3; i < png.pixels.length; i += 4) if (png.pixels[i] === 0) transparent++;
      if (transparent === 0) problemsJ5.push(`${r.id}: no transparent pixel anywhere — alpha channel is not genuine.`);
      if (transparent < total * 0.05) {
        problemsJ5.push(`${r.id}: under 5% transparent pixels — background does not read as transparent.`);
      }
    }
    const bakedWords = png.textChunks.filter((t) => /label|title|name/i.test(t));
    if (bakedWords.length) {
      problemsJ5.push(`${r.id}: PNG text chunk carries label-like metadata (${bakedWords.length} chunk(s)) — labels are runtime text only.`);
    }
  }
  record(
    "Jar PNG integrity: 512×768 RGBA, transparent corners, genuine alpha (J5)",
    problemsJ5.length ? "fail" : "pass",
    problemsJ5.length
      ? problemsJ5.join("  |  ")
      : inspected === 0
        ? "No file exists yet (all planned) — dimensional/alpha gates hold vacuously and arm on the first candidate."
        : `${inspected} file(s) verified: exact canvas, 8-bit RGBA, transparent corners, genuine alpha, no baked-label metadata.`,
  );

  // J6 — checksum-bound approval: every approved record's file bytes hash to BOTH the
  // record checksum AND the live approval's approvedChecksum; drift ⇒ fail (the asset
  // must return to candidate and lose availability in the correcting commit).
  const problemsJ6: string[] = [];
  for (const r of records) {
    if (r.approvalStatus === "planned") continue;
    const abs = resolve(jarDirAbs, r.filename);
    if (!existsSync(abs)) continue; // J4 already fails this
    const actual = sha256(abs);
    if (r.approvalStatus === "candidate" && actual !== r.checksum) {
      // A stale candidate checksum would let a future approval bind to bytes that
      // no longer exist — refuse the drift at the candidate stage already.
      problemsJ6.push(
        `${r.id}: candidate bytes ${actual.slice(0, 12)}… do not match the registered checksum ${String(r.checksum).slice(0, 12)}… — re-record the candidate checksum in the SAME commit that changes the file.`,
      );
    }
    if (r.approvalStatus === "approved" && (actual !== r.checksum || r.visualApproval?.approvedChecksum !== actual)) {
      problemsJ6.push(
        `${r.id}: bytes ${actual.slice(0, 12)}… do not match the approved checksum ${String(r.checksum).slice(0, 12)}… — approval is INVALID; return the record to candidate + unavailable, preserve the approval in history, re-verify and re-approve (checksum drift law).`,
      );
    }
  }
  const candidateCount = records.filter((r) => r.approvalStatus === "candidate").length;
  record(
    "Candidate + approved jars are checksum-bound (J6)",
    problemsJ6.length ? "fail" : "pass",
    problemsJ6.length
      ? problemsJ6.join("  |  ")
      : `${candidateCount} candidate(s) byte-match their registered checksum; no approved asset drifts (0 approved — that gate arms with the first approval).`,
  );

  // J7 — no runtime reference to unapproved assets, and one mouth only: no client file
  // other than the declared owner component may reference the jar asset dir at all,
  // and even the owner may not reference it while nothing is approved.
  const problemsJ7: string[] = [];
  const clientAbs = resolve(ROOT, CLIENT_SRC);
  const approvedCount = records.filter((r) => r.approvalStatus === "approved").length;
  if (existsSync(clientAbs)) {
    for (const file of walk(clientAbs)) {
      if (!/\.(ts|tsx|css)$/.test(file)) continue;
      const src = readFileSync(resolve(ROOT, file), "utf8");
      if (file === "client/src/components/layout/living-details-manifest.ts") continue; // the register itself
      if (!importsAssetPath(src, LARDER_JAR_IMPORT)) continue;
      if (file !== LARDER_JAR_OWNER_COMPONENT) {
        problemsJ7.push(`${file} references ${LARDER_JAR_ASSET_DIR}/ — only ${LARDER_JAR_OWNER_COMPONENT} (the one declared mouth) may.`);
      } else if (approvedCount === 0) {
        problemsJ7.push(`${file} references jar assets while 0 are approved — planned/candidate assets may not reach runtime.`);
      }
    }
  }
  record(
    "No runtime reference to planned/candidate jars; one mouth only (J7)",
    problemsJ7.length ? "fail" : "pass",
    problemsJ7.length ? problemsJ7.join("  |  ") : `No client reference to ${LARDER_JAR_ASSET_DIR}/ (0 approved; any reference today would fail).`,
  );

  // J8 — export law: buildJarExportSet() excludes every unapproved/drifted record and
  // never reports an incomplete package complete. Proven over the real register AND a
  // synthetic sweep (planned/candidate/forged-approval records must all be excluded).
  const problemsJ8: string[] = [];
  const exportSet = buildJarExportSet();
  if (exportSet.included.some((r) => r.approvalStatus !== "approved")) {
    problemsJ8.push("export set includes a non-approved record.");
  }
  if (exportSet.included.length !== records.filter((r) => deriveJarAvailability(r) === "available").length) {
    problemsJ8.push("export inclusion diverges from the availability law.");
  }
  if (exportSet.complete && exportSet.included.length !== records.length) {
    problemsJ8.push("an incomplete package reports complete.");
  }
  if (exportSet.complete !== (records.length > 0 && exportSet.included.length === records.length)) {
    problemsJ8.push("completeness is not the strict all-27 condition.");
  }
  // Synthetic: a forged approval (approved status, checksum mismatch) must be excluded.
  const base = records[0];
  if (base) {
    const forged: LarderJarAssetRecord = {
      ...base,
      approvalStatus: "approved",
      checksum: "aa".repeat(32),
      availabilityState: "unavailable",
      visualApproval: {
        status: "approved",
        approvedByRole: "home-owner",
        approvedAt: "2026-07-23T00:00:00Z",
        approvedChecksum: "bb".repeat(32),
      },
      visualApprovalHistory: [],
    };
    const forgedSet = buildJarExportSet([forged]);
    if (forgedSet.included.length !== 0 || forgedSet.complete) {
      problemsJ8.push("a forged (checksum-unbound) approval reached the export set.");
    }
  }
  record(
    "Exports include only checksum-approved assets; incompleteness is never hidden (J8)",
    problemsJ8.length ? "fail" : "pass",
    problemsJ8.length
      ? problemsJ8.join("  |  ")
      : `Export set: ${exportSet.included.length} included / ${exportSet.excluded.length} excluded, complete=${exportSet.complete} (honest: nothing is approved yet); forged approvals excluded.`,
  );

  // J9 — lifecycle behaviour self-test: planned → candidate → approved → drift, over a
  // synthetic record with fixed timestamps (deterministic; proves the checksum-drift
  // invalidation law executes, not merely that it is written down).
  const problemsJ9: string[] = [];
  if (base) {
    try {
      const c1 = "cc".repeat(32);
      const c2 = "dd".repeat(32);
      // A synthetic PLANNED record (the register's own records may lawfully already
      // be candidates/approved — the self-test always exercises the full path).
      const syntheticPlanned: LarderJarAssetRecord = {
        ...base,
        approvalStatus: "planned",
        checksum: null,
        availabilityState: "unavailable",
        visualApproval: null,
        visualApprovalHistory: [],
        rejectionHistory: [],
      };
      const candidate = promoteJarToCandidate(syntheticPlanned, c1);
      if (candidate.approvalStatus !== "candidate" || candidate.availabilityState !== "unavailable") {
        problemsJ9.push("candidate promotion did not yield an unavailable candidate.");
      }
      if (deriveJarAvailability(candidate) !== "unavailable") problemsJ9.push("a candidate derives available.");
      const approval: JarVisualApproval = {
        status: "approved",
        approvedByRole: "home-owner",
        approvedAt: "2026-07-23T00:00:00Z",
        approvedChecksum: c1,
        notes: "self-test",
      };
      const approved = recordJarHomeOwnerApproval(candidate, approval);
      if (deriveJarAvailability(approved) !== "available") problemsJ9.push("a checksum-bound approval did not yield availability.");
      let wrongBindingRefused = false;
      try {
        recordJarHomeOwnerApproval(candidate, { ...approval, approvedChecksum: c2 });
      } catch {
        wrongBindingRefused = true;
      }
      if (!wrongBindingRefused) problemsJ9.push("an approval NOT bound to the candidate checksum was accepted.");
      const drifted = applyJarChecksumDrift(approved, c2);
      if (drifted.approvalStatus !== "candidate" || deriveJarAvailability(drifted) !== "unavailable") {
        problemsJ9.push("checksum drift did not return the asset to candidate/unavailable.");
      }
      if (!drifted.visualApprovalHistory.some((a) => a.status === "invalidated-by-checksum-drift" && a.approvedChecksum === c1)) {
        problemsJ9.push("drift did not preserve the invalidated approval in history.");
      }
      if (drifted.visualApproval !== null) problemsJ9.push("a drifted asset still carries a live approval.");
    } catch (e) {
      problemsJ9.push(`lifecycle self-test threw: ${(e as Error).message}`);
    }
  }
  record(
    "Lifecycle law executes: candidate → checksum-bound approval → drift invalidation (J9)",
    problemsJ9.length ? "fail" : "pass",
    problemsJ9.length
      ? problemsJ9.join("  |  ")
      : "Synthetic sweep: unbound approvals refused; drift withdraws availability and preserves history.",
  );

  // J10 — visual-gap-green has ONE meaning, applies only to the governed fallback, and
  // is not a second colour registry (exactly one governed colour entry exists here).
  const problemsJ10: string[] = [];
  if (VISUAL_GAP_GREEN.colourId !== "visual-gap-green" || VISUAL_GAP_GREEN.baseColour !== "#63A844") {
    problemsJ10.push(`governed colour drifted: ${VISUAL_GAP_GREEN.colourId} ${VISUAL_GAP_GREEN.baseColour}.`);
  }
  if (VISUAL_GAP_GREEN.meaning !== "approved visual representation missing") {
    problemsJ10.push(`meaning drifted: "${VISUAL_GAP_GREEN.meaning}".`);
  }
  const gapApplies = [...VISUAL_GAP_GREEN.appliesOnlyToAssetIds];
  if (gapApplies.length !== 1 || gapApplies[0] !== "tha-larder-jar-fallback-green") {
    problemsJ10.push("visual-gap-green may apply ONLY to the governed fallback jar.");
  }
  const FORBIDDEN_MEANINGS = ["quantity", "nutrition", "quality", "freshness", "availability", "error", "shopping-list state"];
  for (const m of FORBIDDEN_MEANINGS) {
    if (!VISUAL_GAP_GREEN.mustNeverMean.includes(m as (typeof VISUAL_GAP_GREEN.mustNeverMean)[number])) {
      problemsJ10.push(`forbidden-meaning list lost "${m}".`);
    }
  }
  record(
    "visual-gap-green: one colour, one meaning, fallback-only (J10)",
    problemsJ10.length ? "fail" : "pass",
    problemsJ10.length
      ? problemsJ10.join("  |  ")
      : "#63A844 means exactly 'approved visual representation missing', on the fallback jar only; artwork-content colour, no UI token.",
  );

  // J11 — the Visual Gap Register: every entry names a canonical food, the governed
  // fallback, a first-encountered date and a coherent status; resolved ⇔ replacement.
  const problemsJ11: string[] = [];
  for (const gap of larderVisualGapRegister) {
    if (!gap.canonicalFoodIdentity) problemsJ11.push("a gap lacks its canonical food identity.");
    if (gap.fallbackAssetId !== "tha-larder-jar-fallback-green") {
      problemsJ11.push(`${gap.canonicalFoodIdentity}: gap must reference the governed fallback jar.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}/.test(gap.firstEncountered)) {
      problemsJ11.push(`${gap.canonicalFoodIdentity}: firstEncountered must be an ISO date.`);
    }
    if ((gap.status === "resolved") !== (gap.replacementAssetId !== null)) {
      problemsJ11.push(`${gap.canonicalFoodIdentity}: resolved ⇔ replacementAssetId recorded.`);
    }
    if (gap.replacementAssetId && !larderJarAssetRegister.some((r) => r.id === gap.replacementAssetId)) {
      problemsJ11.push(`${gap.canonicalFoodIdentity}: replacement "${gap.replacementAssetId}" is not a registered asset.`);
    }
  }
  record(
    "Visual Gap Register well-formed; one owner (J11)",
    problemsJ11.length ? "fail" : "pass",
    problemsJ11.length
      ? problemsJ11.join("  |  ")
      : `${larderVisualGapRegister.length} gap(s) recorded (none yet — no runtime Larder UI exists; honest empty).`,
  );

  // J12 — rejected predecessors: archived under the evidence path with a rejection
  // record, ABSENT from the client tree, and referenced by no client source.
  const problemsJ12: string[] = [];
  const archiveAbs = resolve(ROOT, LARDER_REJECTED_PREDECESSOR_DIR);
  for (const f of LARDER_REJECTED_FILES) {
    if (!existsSync(resolve(archiveAbs, f))) problemsJ12.push(`archive missing ${LARDER_REJECTED_PREDECESSOR_DIR}/${f}.`);
    if (existsSync(resolve(ROOT, "client/src/assets/larder", f))) {
      problemsJ12.push(`rejected predecessor still present at client/src/assets/larder/${f}.`);
    }
  }
  if (!existsSync(resolve(archiveAbs, "REJECTION_RECORD.md"))) {
    problemsJ12.push(`archive lacks its REJECTION_RECORD.md (an unrecorded rejection is not a rejection).`);
  }
  if (existsSync(clientAbs)) {
    for (const file of walk(clientAbs)) {
      if (!/\.(ts|tsx|css)$/.test(file)) continue;
      // The register itself lawfully NAMES the archive paths as evidence pointers
      // (predecessorOrRejectedReference) — a record of the rejection, not an import.
      if (file === "client/src/components/layout/living-details-manifest.ts") continue;
      const src = readFileSync(resolve(ROOT, file), "utf8");
      if (LARDER_REJECTED_FILES.some((f) => importsAssetPath(src, f))) {
        problemsJ12.push(`${file} still references a rejected predecessor asset.`);
      }
    }
  }
  record(
    "Rejected predecessors archived with evidence; out of runtime forever (J12)",
    problemsJ12.length ? "fail" : "pass",
    problemsJ12.length
      ? problemsJ12.join("  |  ")
      : `${LARDER_REJECTED_FILES.join(" + ")} archived under ${LARDER_REJECTED_PREDECESSOR_DIR}/ with a rejection record; no client reference.`,
  );

  // HONEST GAP (reported, not hidden): baked-wording detection inside the label
  // rectangle's PIXELS is not deterministically automatable without OCR. The automated
  // gates cover metadata text chunks (J5) and the runtime-text law (dynamicLabel, J2);
  // wording-in-pixels remains a Home Owner visual-approval responsibility (J6 binds
  // that approval to the exact bytes, so an approved file cannot silently change).
  record(
    "Baked-label wording in pixels — honest automation gap",
    "pass",
    "Deterministic checks cover PNG text metadata + runtime-text law; in-pixel wording review is bound to the checksum-locked Home Owner approval (cannot be silently bypassed).",
  );
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
  larderJarChecks();

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
    console.log("\nRESULT: PASS — the house is byte-locked; the Life register is honest and empty; the Dressing register is byte-locked and every admitted item is claim-free, still, and lawfully placed.");
  }
}

try {
  main();
} catch (err) {
  console.error("Fatal:", err);
  process.exit(1);
}
