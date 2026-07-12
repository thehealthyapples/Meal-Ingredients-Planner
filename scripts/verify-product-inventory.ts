/**
 * Verify the Product Knowledge Registry against its own governing rules.
 *
 *   npx tsx scripts/verify-product-inventory.ts
 *
 * The PKR architecture names its own declared-vs-enforced gap on the day the
 * domain was created (PKCA Rule KC8): currency, visibility, and the
 * prose↔inventory bijection were "today entirely unenforced". This script is
 * what closes that gap. It asserts, mechanically:
 *
 *   PKR11  bijection — every inventory record has exactly one prose entry, and
 *          every prose entry has exactly one inventory record. No orphans
 *          (a record with no document), no invisibles (a document with no record).
 *   PKR12  every entry names a human owner.
 *   PKR22  every entry declares a valid visibility. Absence is never permission.
 *   PKR23  visibility is monotonic — a `related` link may not point from a
 *          lower tier to a higher one without the reader being told.
 *   PKR7   one owner per page — no two page entries share a canonical route.
 *   §7     ids are unique and never reused.
 *   §8     every section is one of the 28 canonical sections.
 *   §15.3  entries not verified within 90 days are PRESUMED STALE.
 *   §8s20  a Marketing Message / Benefit / Competitive Advantage with no
 *          substantiating entry and no stated substantiation_gap is a
 *          fabrication and must not stand.
 *
 * Read-only. Exits non-zero if the registry is not true.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse } from "yaml";

const ROOT = resolve(import.meta.dirname, "..");
const PRODUCT = resolve(ROOT, "docs/product");
const SRC = resolve(PRODUCT, "inventory/product.yaml");

const VISIBILITIES = ["public", "household", "admin", "developer"] as const;
const TIER_RANK: Record<string, number> = { public: 0, household: 1, admin: 2, developer: 3 };
const SECTIONS = new Set(
  JSON.parse(readFileSync(resolve(PRODUCT, "inventory/schema/product-schema.json"), "utf8"))
    .$defs.entry.properties.section.enum as string[],
);

const STALE_AFTER_DAYS = 90;
// Passed in so the script is deterministic and testable; defaults to today.
const TODAY = new Date(process.env.PKR_TODAY ?? new Date().toISOString().slice(0, 10));

type Entry = Record<string, any>;
const doc = parse(readFileSync(SRC, "utf8")) as { entries: Entry[] };
const entries = doc.entries ?? [];
const byId = new Map<string, Entry>();

let failures = 0;
let warnings = 0;
const fail = (rule: string, msg: string) => {
  console.error(`  FAIL  [${rule}] ${msg}`);
  failures++;
};
const warn = (rule: string, msg: string) => {
  console.warn(`  WARN  [${rule}] ${msg}`);
  warnings++;
};

console.log("Product Knowledge Registry verification\n");

// --- §7 unique ids, §8 canonical sections, PKR12 owner, PKR22 visibility ----
for (const e of entries) {
  const id = String(e.id ?? "<missing id>");
  if (byId.has(id)) fail("§7", `duplicate id "${id}" — ids are unique and never reused`);
  byId.set(id, e);

  if (!SECTIONS.has(String(e.section)))
    fail("§8", `${id} declares section "${e.section}", which is not one of the 28 canonical sections`);

  if (!e.owner || typeof e.owner !== "string" || !e.owner.trim())
    fail("PKR12", `${id} names no human owner — an entry with no owner will be stale within a quarter`);

  if (!e.visibility || !VISIBILITIES.includes(e.visibility))
    fail("PKR22", `${id} has visibility ${JSON.stringify(e.visibility)} — absence of a label is never permission`);

  if (!e.purpose || !String(e.purpose).trim())
    fail("§7", `${id} states no purpose — a list of routes is a grep, not product knowledge`);
}

// --- PKR7 one owner per page (no two pages share a canonical route) ---------
const routeOwners = new Map<string, string>();
for (const e of entries) {
  if (e.section !== "pages" || !e.route) continue;
  const existing = routeOwners.get(e.route);
  if (existing)
    fail("PKR7", `route ${e.route} is claimed by both ${existing} and ${e.id} — one owner per page`);
  routeOwners.set(e.route, String(e.id));
}

// --- related ids must resolve ----------------------------------------------
for (const e of entries) {
  for (const r of (e.related ?? []) as string[]) {
    if (!byId.has(r)) fail("§7", `${e.id} relates to "${r}", which is not a registry id`);
  }
}

// --- PKR23 visibility is monotonic -----------------------------------------
// An entry may not point a reader at something they are not permitted to see
// without that being visible in the registry itself.
for (const e of entries) {
  const here = TIER_RANK[String(e.visibility)] ?? 3;
  for (const r of (e.related ?? []) as string[]) {
    const target = byId.get(r);
    if (!target) continue;
    const there = TIER_RANK[String(target.visibility)] ?? 3;
    if (there > here)
      warn(
        "PKR23",
        `${e.id} (${e.visibility}) relates to ${r} (${target.visibility}) — a lower tier points at a higher one; confirm the link discloses nothing`,
      );
  }
}

// --- §8 s20 claims must be substantiated, or their gap stated honestly ------
const CLAIM_SECTIONS = new Set(["marketing-messages", "benefits", "competitive-advantages"]);
for (const e of entries) {
  if (!CLAIM_SECTIONS.has(String(e.section))) continue;
  const sub = (e.substantiated_by ?? []) as string[];
  if (sub.length === 0 && !e.substantiation_gap)
    fail(
      "§8s20",
      `${e.id} claims something about THA, cites no substantiating entry, and states no substantiation_gap — a claim with no citable entry is a fabrication`,
    );
  for (const s of sub) {
    if (!byId.has(s)) fail("§8s20", `${e.id} claims substantiation from "${s}", which is not a registry id`);
  }
}

// --- §15.3 presumed stale ---------------------------------------------------
for (const e of entries) {
  const d = new Date(String(e.last_verified));
  const ageDays = Math.floor((TODAY.getTime() - d.getTime()) / 86_400_000);
  if (Number.isNaN(ageDays)) {
    fail("§15.3", `${e.id} has an unparseable last_verified "${e.last_verified}"`);
  } else if (ageDays > STALE_AFTER_DAYS) {
    warn("§15.3", `${e.id} was last verified ${ageDays} days ago — PRESUMED STALE`);
  }
}

// --- PKR11 bijection: every record ↔ exactly one prose entry ---------------
// A prose entry declares the record it belongs to with an `entry: <id>` line in
// its front matter. An inventory record with no document is an ORPHAN; a
// document with no record is INVISIBLE. The mapping must be total.
const proseIds = new Map<string, string>();
const walk = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return walk(p);
    return p.endsWith(".md") ? [p] : [];
  });
};

// Registry navigation documents are indices, not entries. They are excluded by
// name — deliberately and visibly, so the exclusion cannot hide a real entry.
const INDEX_DOCS = new Set(["README.md", "OWNERS.md", "VISIBILITY.md"]);

// PKR §18 carve-out: `glossary.md` is ONE file — "the vocabulary is not
// divisible", because a vocabulary split across files develops dialects. It is
// therefore the one document permitted to declare more than one entry. Every
// other document describes exactly one concept (§10.1: no omnibus documents).
const MULTI_ENTRY_DOCS = new Set(["glossary.md"]);

for (const file of walk(PRODUCT)) {
  const base = file.split("/").pop()!;
  if (INDEX_DOCS.has(base)) continue;
  const text = readFileSync(file, "utf8");
  const rel = file.replace(ROOT + "/", "");
  const ids = [...text.matchAll(/^entry:\s*([a-z][a-z0-9-]*)\s*$/gm)].map((m) => m[1]);

  if (ids.length === 0) {
    fail("PKR11", `${rel} declares no "entry: <id>" line — a document with no record is invisible`);
    continue;
  }
  if (ids.length > 1 && !MULTI_ENTRY_DOCS.has(base))
    fail(
      "§10.1",
      `${rel} describes ${ids.length} concepts — a file describing three pages has three owners and therefore none`,
    );

  for (const id of ids) {
    const existing = proseIds.get(id);
    if (existing)
      fail("PKR11", `entry "${id}" is described by both ${existing} and ${rel} — two entries for one concept is a defect`);
    proseIds.set(id, rel);
    if (!byId.has(id)) fail("PKR11", `${rel} describes "${id}", which has no inventory record`);
  }
}

for (const id of byId.keys()) {
  if (!proseIds.has(id)) fail("PKR11", `inventory record "${id}" has no prose entry — an orphan`);
}

// --- Report -----------------------------------------------------------------
console.log(`\n  ${entries.length} inventory records`);
console.log(`  ${proseIds.size} prose entries`);
console.log(`  bijection: ${entries.length === proseIds.size && failures === 0 ? "TOTAL" : "BROKEN"}`);
console.log(`\n  ${failures} failure(s), ${warnings} warning(s)\n`);

if (failures > 0) {
  console.error("The registry is not true. Correct it — the registry is corrected, never defended (Rule PKR15).");
  process.exit(1);
}
console.log("The registry is internally true.");
