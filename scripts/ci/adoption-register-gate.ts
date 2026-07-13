#!/usr/bin/env tsx
/**
 * Adoption Register Gate — PX1-W5.3
 *
 *   npx tsx scripts/ci/adoption-register-gate.ts check     # verify (exit 1 on failure)
 *   npx tsx scripts/ci/adoption-register-gate.ts record    # regenerate the document, tighten ratchets
 *   npx tsx scripts/ci/adoption-register-gate.ts measure   # print what the code actually says
 *
 * THA_UI_ARCHITECTURE.md § 17 mandates an adoption register in which
 * "authored-but-unadopted must be impossible to hide". This gate is the half of
 * that sentence a document cannot keep on its own.
 *
 * It asserts four things against `docs/implementation/ux/adoption-register.json`,
 * which is the register's single source of truth:
 *
 *   1. ADOPTION   Every canonical owner is imported by at least its declared floor.
 *                 An owner with 0 importers is authored-but-unadopted — the exact
 *                 failure state UIA § 17 exists to end — and fails the gate.
 *   2. RIVALS     Every rival count is a ceiling. A rival count that RISES fails:
 *                 a competing implementation cannot enter the codebase without
 *                 someone raising the ceiling in the register, by hand, with a
 *                 reason. A count that falls is reported so the ratchet tightens.
 *   3. RETIRED    Every retired predecessor stays retired: zero occurrences in
 *                 code, forever. A predecessor that comes back fails.
 *   4. ORPHANS    Every module with 0 importers is a known, named, owned orphan.
 *                 A NEW orphan fails — dead code cannot appear in silence.
 *
 * Modelled on `scripts/ci/typecheck-gate.ts` (check|record): a recorded baseline
 * that may tighten automatically and may only be loosened by a human, deliberately.
 * `record` NEVER raises a ceiling — that is the whole point of the ratchet.
 *
 * COMMENTS ARE NOT CODE. Every pattern is matched against source with comments
 * stripped. THA's retire-on-introduction discipline (UIA § 17) requires a
 * workstream to NAME the predecessor it deleted, so the codebase is full of
 * comments like "Predecessor: `BadAppleWarningModal` — deleted in this change".
 * A gate that matched raw text would fail on the very evidence that proves
 * compliance, and would teach engineers to stop writing the record down.
 *
 * Read-only in `check` and `measure`. Touches no application code, ever.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const SRC = join(ROOT, "client/src");
const REGISTER_JSON = join(ROOT, "docs/implementation/ux/adoption-register.json");
const REGISTER_DOC = join(ROOT, "docs/implementation/ux/ADOPTION_REGISTER.md");

// ---------------------------------------------------------------- types

type Enforcement = "machine" | "review";

interface Rival {
  what: string;
  pattern: string;
  ceiling: number;
  note?: string;
  /** Files that legitimately contain the pattern — above all, the owner that DEFINES it. */
  excludePaths?: string[];
}

interface Concern {
  id: string;
  concern: string;
  owner: string | null;
  ownerPath?: string;
  ownerKind?: "module" | "css" | "external" | "none";
  owns: string;
  status: "governed" | "half-adopted" | "no-owner";
  enforcement: Enforcement;
  adoptionFloor?: number;
  definedIn?: string;
  definedSymbols?: string[];
  exemptions?: { surface: string; why: string }[];
  rivals?: Rival[];
  retired?: { name: string; pattern: string; retiredBy: string; excludePaths?: string[] }[];
  openMigration?: { finding: string; remaining: string; owner: string; why: string } | null;
  /**
   * Measured and reported, NOT enforced. For facts a ratchet would misrepresent —
   * 842 `dark:` utilities are not a rival to be capped, they are correct practice
   * with no theme owner to make them reachable. `asAt` is the declared count on
   * `asAtDate`; the gate NOTICEs (never fails) when the live count has moved, so
   * the figure nags rather than rots.
   */
  evidence?: { what: string; pattern: string; asAt: number; asAtDate: string; excludePaths?: string[] }[];
}

interface Register {
  $schema_note: string;
  version: string;
  updated: string;
  owner: string;
  governedBy: string[];
  concerns: Concern[];
  orphans: {
    note: string;
    scanRoots: string[];
    known: { path: string; loc: number; disposition: string; owner: string }[];
  };
}

// ---------------------------------------------------------------- source model

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(p)) out.push(p);
  }
  return out;
}

const rel = (f: string) => relative(ROOT, f).replace(/\\/g, "/");

/**
 * Strip comments and string/template contents, so a pattern matches CODE only.
 * Strings are blanked (not removed) so offsets and counts stay sane; a class name
 * inside a className="..." string is deliberately KEPT — see `keepStrings`.
 */
function stripComments(src: string, keepStrings: boolean): string {
  let out = "";
  let i = 0;
  const n = src.length;
  let quote: string | null = null;

  while (i < n) {
    const c = src[i];
    const d = src[i + 1];

    if (quote) {
      if (c === "\\") { out += keepStrings ? src.slice(i, i + 2) : "  "; i += 2; continue; }
      if (c === quote) { quote = null; out += c; i++; continue; }
      out += keepStrings ? c : c === "\n" ? "\n" : " ";
      i++;
      continue;
    }

    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") { out += " "; i++; }
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2; out += "  ";
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) { out += src[i] === "\n" ? "\n" : " "; i++; }
      i += 2; out += "  ";
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }

    out += c;
    i++;
  }
  return out;
}

const files = walk(SRC);
/** Code with comments stripped, string literals KEPT (class names live in strings). */
const code = new Map<string, string>();
/** Raw text, used only for CSS definition checks. */
const raw = new Map<string, string>();

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const r = rel(f);
  raw.set(r, src);
  code.set(r, f.endsWith(".css") ? src : stripComments(src, true));
}

const tsFiles = [...code.entries()].filter(([f]) => !f.endsWith(".css"));
const cssText = [...raw.entries()].filter(([f]) => f.endsWith(".css")).map(([, s]) => s).join("\n");

// ---------------------------------------------------------------- import graph

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;

function resolveSpec(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(join(ROOT, fromFile)), spec);
  else return null;
  const cands = [base, `${base}.tsx`, `${base}.ts`, `${base}.css`, join(base, "index.tsx"), join(base, "index.ts")];
  for (const c of cands) {
    try { if (statSync(c).isFile()) return rel(c); } catch { /* not a file */ }
  }
  return null;
}

const importers = new Map<string, Set<string>>();
for (const [f, src] of code) {
  for (const m of src.matchAll(IMPORT_RE)) {
    const target = resolveSpec(m[1], f);
    if (!target || target === f) continue;
    if (!importers.has(target)) importers.set(target, new Set());
    importers.get(target)!.add(f);
  }
}
const importerCount = (mod: string) => importers.get(mod)?.size ?? 0;

/**
 * Count pattern matches across all TS/TSX source, comments stripped.
 * `exclude` skips the files that legitimately hold the pattern — above all the
 * owner that DEFINES the thing its rivals copy (`use-adaptive-density` declares
 * `useIsMobile`; counting it as its own rival would be nonsense).
 */
function countPattern(pattern: string, exclude: string[] = []): { n: number; where: string[] } {
  const re = new RegExp(pattern, "g");
  let n = 0;
  const where: string[] = [];
  for (const [f, src] of tsFiles) {
    if (exclude.includes(f)) continue;
    const m = src.match(re);
    if (m?.length) { n += m.length; where.push(`${f}:${m.length}`); }
  }
  return { n, where };
}

// ---------------------------------------------------------------- checks

const register: Register = JSON.parse(readFileSync(REGISTER_JSON, "utf8"));
const mode = process.argv[2] ?? "check";

interface Result { level: "PASS" | "FAIL" | "NOTICE"; line: string }
const results: Result[] = [];
const pass = (l: string) => results.push({ level: "PASS", line: l });
const fail = (l: string) => results.push({ level: "FAIL", line: l });
const notice = (l: string) => results.push({ level: "NOTICE", line: l });

/** Ceilings that CAN be tightened; `record` applies these, `check` only reports them. */
const tightenable: { concern: string; what: string; from: number; to: number }[] = [];

for (const c of register.concerns) {
  // 1. ADOPTION — the owner exists and is used.
  if (c.ownerKind === "module" && c.ownerPath) {
    if (!code.has(c.ownerPath)) {
      fail(`[${c.id}] canonical owner is MISSING from the tree: ${c.ownerPath}`);
    } else {
      const n = importerCount(c.ownerPath);
      const floor = c.adoptionFloor ?? 1;
      if (n < floor) {
        fail(`[${c.id}] owner ${c.owner} has ${n} importer(s), below its declared floor of ${floor}` +
             (n === 0 ? " — AUTHORED-BUT-UNADOPTED (UIA §17)" : ""));
      } else {
        pass(`[${c.id}] ${c.owner} adopted by ${n} module(s) (floor ${floor})`);
      }
    }
  }
  if (c.ownerKind === "css" && c.definedSymbols?.length) {
    const missing = c.definedSymbols.filter((s) => !cssText.includes(s));
    if (missing.length) fail(`[${c.id}] declared in the register but NOT DEFINED in CSS: ${missing.join(", ")}`);
    else pass(`[${c.id}] ${c.owner} defines ${c.definedSymbols.length} symbol(s)`);
  }

  // 2. RIVALS — a ratchet. Rises fail; falls tighten.
  for (const r of c.rivals ?? []) {
    const { n } = countPattern(r.pattern, r.excludePaths);
    if (n > r.ceiling) {
      fail(`[${c.id}] rival count ROSE: ${r.what} — ${n} in code, ceiling ${r.ceiling}. ` +
           `Adopt ${c.owner ?? "an owner"}, or raise the ceiling in the register with a reason (UIA §17: exemptions are explicit).`);
    } else {
      pass(`[${c.id}] ${r.what}: ${n} ≤ ${r.ceiling}`);
      if (n < r.ceiling) tightenable.push({ concern: c.id, what: r.what, from: r.ceiling, to: n });
    }
  }

  // 2b. EVIDENCE — dated figures. They nag when they move; they never fail.
  for (const e of c.evidence ?? []) {
    const { n } = countPattern(e.pattern, e.excludePaths);
    if (n !== e.asAt) {
      notice(`[${c.id}] recorded fact has moved: ${e.what} — ${e.asAt} as at ${e.asAtDate}, now ${n}. Re-date it (\`npm run adoption:record\`).`);
    } else {
      pass(`[${c.id}] ${e.what}: ${n} (as recorded)`);
    }
  }

  // 3. RETIRED — a predecessor never comes back.
  for (const t of c.retired ?? []) {
    const { n, where } = countPattern(t.pattern, t.excludePaths);
    if (n > 0) {
      fail(`[${c.id}] RETIRED predecessor is live again: ${t.name} (retired by ${t.retiredBy}) — ${n} occurrence(s) in code: ${where.slice(0, 3).join(" ")}`);
    } else {
      pass(`[${c.id}] retired: ${t.name} — still gone`);
    }
  }
}

// 4. ORPHANS — authored-but-unadopted, anywhere.
const knownOrphans = new Map(register.orphans.known.map((o) => [o.path, o]));
const scanRe = new RegExp(`^(${register.orphans.scanRoots.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`);
const measuredOrphans: string[] = [];
for (const f of code.keys()) {
  if (f.endsWith(".css") || !scanRe.test(f)) continue;
  if (importerCount(f) === 0) measuredOrphans.push(f);
}
for (const o of measuredOrphans.sort()) {
  if (!knownOrphans.has(o)) {
    fail(`[orphans] NEW authored-but-unadopted module (0 importers): ${o} — ` +
         `adopt it, delete it, or record it in the register with an owner (UIA §17).`);
  } else {
    pass(`[orphans] known: ${o} (owner: ${knownOrphans.get(o)!.owner})`);
  }
}
for (const [p] of knownOrphans) {
  if (!measuredOrphans.includes(p)) notice(`[orphans] recorded orphan is gone: ${p} — remove it from the register.`);
}

// ---------------------------------------------------------------- document rendering

function renderDoc(r: Register): string {
  const badge = (s: Concern["status"]) =>
    s === "governed" ? "✅ governed" : s === "half-adopted" ? "⚠️ half-adopted" : "❌ no owner";

  const L: string[] = [];
  L.push("<!-- GENERATED FILE — DO NOT EDIT BY HAND.");
  L.push("     Source of truth: docs/implementation/ux/adoption-register.json");
  L.push("     Regenerate:      npm run adoption:record");
  L.push("     Verified by:     npm run adoption:check (fails if this file drifts from the JSON)");
  L.push("-->");
  L.push("");
  L.push("# The Platform Experience Adoption Register");
  L.push("");
  L.push(`**Version:** ${r.version} · **Updated:** ${r.updated} · **Owner:** ${r.owner}`);
  L.push("");
  L.push("> **UIA § 17:** *\"Every canonical building block carries a visible register: what it owns,");
  L.push("> which surfaces have adopted it, which are exempt and why. **Authored-but-unadopted must be");
  L.push("> impossible to hide.** The register lives beside the implementation (it is operational, not");
  L.push("> architectural); its existence is mandated here.\"*");
  L.push("");
  L.push("This is that register. It is **operational, not architectural**: it creates no law, and every");
  L.push("rule it enforces belongs to a document listed below. It is **present tense** — it describes the");
  L.push("codebase as it is now, and it is *corrected*, never superseded. A stale row is a defect.");
  L.push("");
  L.push("**It is not a document that can quietly go stale.** It *declares*; the code is *measured* against");
  L.push("it, on every run, by `scripts/ci/adoption-register-gate.ts` — which fails CI when a canonical owner");
  L.push("loses its last consumer, when a rival count rises above a ceiling below, when a retired predecessor");
  L.push("returns, or when a new module appears with no importers. Run `npm run adoption:check` to see where");
  L.push("the codebase actually stands. This file is generated from `adoption-register.json`, its single");
  L.push("source of truth; the gate fails if the two ever disagree, so the prose can never drift from the data.");
  L.push("");
  L.push("**Governed by:** " + r.governedBy.join(" · "));
  L.push("");
  L.push("---");
  L.push("");
  L.push("## 1. Canonical owners");
  L.push("");
  L.push("**Enforcement** says whether the row is machine-checked or human-reviewed. It is stated per row");
  L.push("rather than implied, so the gap between what is *declared* and what is *enforced* is visible on");
  L.push("the day the register is created, rather than discovered months after it started costing something");
  L.push("(PKCA Rule KC8).");
  L.push("");
  L.push("**There are no adoption counts in this document, deliberately.** A count in prose is a count that");
  L.push("rots: it is correct on the day it is typed and wrong by the next commit, and a register that");
  L.push("carries stale numbers teaches its readers not to trust it. The live counts are measured from the");
  L.push("code on every run — `npm run adoption:check` prints them, and fails the build when one of them");
  L.push("breaks a rule below. **The document declares; the gate measures.**");
  L.push("");
  L.push("| # | Concern | Canonical owner | Owns | Status | Enforcement |");
  L.push("|---|---|---|---|---|---|");
  r.concerns.forEach((c, i) => {
    const owner = c.owner ? `\`${c.owner}\`` : "**— none —**";
    L.push(`| ${i + 1} | **${c.concern}** | ${owner} | ${c.owns} | ${badge(c.status)} | ${c.enforcement} |`);
  });
  L.push("");

  // Rivals
  L.push("## 2. Rivals — the ratchet");
  L.push("");
  L.push("Each count is a **ceiling measured from the code**. The gate fails if a count rises: a competing");
  L.push("implementation cannot enter THA without someone raising the ceiling here, by hand, with a reason.");
  L.push("That is the whole mechanism by which *\"future work cannot introduce competing implementations");
  L.push("without explicit ownership\"* is true rather than hoped for.");
  L.push("");
  L.push("| Concern | Rival | Ceiling | Note |");
  L.push("|---|---|---|---|");
  for (const c of r.concerns) {
    for (const rv of c.rivals ?? []) {
      L.push(`| ${c.concern} | ${rv.what} | ${rv.ceiling} | ${rv.note ?? ""} |`);
    }
  }
  L.push("");

  // Exemptions
  L.push("## 3. Exemptions — explicit, with a reason");
  L.push("");
  L.push("*\"Any surface exempt from a canonical owner is exempt in the register, with a reason — never");
  L.push("silently.\"* (UIA § 17)");
  L.push("");
  L.push("| Concern | Exempt surface | Why |");
  L.push("|---|---|---|");
  for (const c of r.concerns) {
    for (const e of c.exemptions ?? []) L.push(`| ${c.concern} | ${e.surface} | ${e.why} |`);
  }
  L.push("");

  // Retired
  L.push("## 4. Retired predecessors — and they stay retired");
  L.push("");
  L.push("Retire-on-introduction (UIA § 17) is a promise about the past. This table is the promise being");
  L.push("kept: the gate asserts **zero occurrences in code** for every name below, forever. A predecessor");
  L.push("that comes back fails CI.");
  L.push("");
  L.push("Their names survive in *comments* — the retirement record each workstream was required to leave —");
  L.push("and the gate strips comments before matching, so writing that record down can never fail the build.");
  L.push("");
  L.push("| Predecessor | Concern | Retired by |");
  L.push("|---|---|---|");
  for (const c of r.concerns) {
    for (const t of c.retired ?? []) L.push(`| \`${t.name}\` | ${c.concern} | ${t.retiredBy} |`);
  }
  L.push("");

  // Evidence
  const hasEvidence = r.concerns.some((c) => c.evidence?.length);
  if (hasEvidence) {
    L.push("## 4a. Measured facts — recorded, not enforced");
    L.push("");
    L.push("Numbers a ratchet would misrepresent: 842 `dark:` utilities are not a rival to be capped, they");
    L.push("are correct practice with no theme owner to make them reachable. These are the two figures in");
    L.push("this register that *are* frozen — so each is **dated**, and the gate re-measures it on every run");
    L.push("and raises a notice the moment it has moved. It nags; it never fails. (PKCA Rule KC14: for a");
    L.push("self-describing record, currency *is* the evidence standard, and it needs a named owner.)");
    L.push("");
    L.push("| Concern | Fact | Count | As at |");
    L.push("|---|---|---|---|");
    for (const c of r.concerns) {
      for (const e of c.evidence ?? []) {
        L.push(`| ${c.concern} | ${e.what} | ${e.asAt} | ${e.asAtDate} |`);
      }
    }
    L.push("");
  }

  // Open migrations
  L.push("## 5. Outstanding migrations — deferred, owned, not hidden");
  L.push("");
  L.push("An owner exists for each concern below and its rivals are capped. What remains is the migration of");
  L.push("existing consumers — recorded here with a **named owner**, because a migration nobody owns is a");
  L.push("migration that does not happen.");
  L.push("");
  L.push("| Concern | Finding | What remains | Owner | Why it is deferred |");
  L.push("|---|---|---|---|---|");
  for (const c of r.concerns) {
    const m = c.openMigration;
    if (m) L.push(`| ${c.concern} | \`${m.finding}\` | ${m.remaining} | ${m.owner} | ${m.why} |`);
  }
  L.push("");

  // Orphans
  L.push("## 6. Authored-but-unadopted — the orphan ratchet");
  L.push("");
  L.push(r.orphans.note);
  L.push("");
  L.push("The gate fails on a **new** orphan. These are the known ones, each named and owned. They are");
  L.push("recorded as **defects, not exemptions** — an exemption says \"this is fine\"; these are not fine,");
  L.push("they are simply not hidden.");
  L.push("");
  L.push("| Module | LOC | Disposition | Owner |");
  L.push("|---|---|---|---|");
  for (const o of r.orphans.known) L.push(`| \`${o.path}\` | ${o.loc} | ${o.disposition} | ${o.owner} |`);
  L.push("");
  L.push("---");
  L.push("");
  L.push("## 7. How to change this register");
  L.push("");
  L.push("1. **Adopting an owner** — migrate the consumer, then `npm run adoption:record` to tighten the ceiling.");
  L.push("2. **Introducing a new owner** — add a concern row naming what it owns, its predecessor, and its");
  L.push("   first consumers. An owner with no consumers fails the gate, by design: it is not permitted to");
  L.push("   author a foundation and adopt it later.");
  L.push("3. **Retiring a predecessor** — migrate every consumer, delete it, and add it to § 4 in the same");
  L.push("   change. The gate then keeps it dead.");
  L.push("4. **Needing an exception** — raise the ceiling in § 2 or add an exemption in § 3, *with a reason*.");
  L.push("   This is deliberately a visible, reviewable edit rather than a silent one.");
  L.push("");
  L.push("_Generated from `adoption-register.json`. The register is operational, not architectural: the law is");
  L.push("the [Experience](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) and");
  L.push("[UI](../../architecture/THA_UI_ARCHITECTURE.md) Architectures'. This file only makes it checkable._");
  L.push("");
  return L.join("\n");
}

// ---------------------------------------------------------------- modes

if (mode === "measure") {
  console.log("Adoption Register — measured against the code\n");
  for (const c of register.concerns) {
    const adopted = c.ownerKind === "module" && c.ownerPath ? importerCount(c.ownerPath) : "—";
    console.log(`  ${c.id.padEnd(26)} owner=${String(adopted).padStart(3)}`);
    for (const rv of c.rivals ?? []) {
      const { n } = countPattern(rv.pattern, rv.excludePaths);
      const flag = n > rv.ceiling ? "  << ROSE" : n < rv.ceiling ? "  (tighten)" : "";
      console.log(`      rival ${rv.what.padEnd(44)} ${String(n).padStart(4)} / ceiling ${rv.ceiling}${flag}`);
    }
    for (const e of c.evidence ?? []) {
      const { n } = countPattern(e.pattern, e.excludePaths);
      console.log(`      fact  ${e.what.padEnd(44)} ${String(n).padStart(4)}`);
    }
    for (const t of c.retired ?? []) {
      const { n, where } = countPattern(t.pattern, t.excludePaths);
      if (n) console.log(`      RETIRED-BUT-LIVE ${t.name}: ${n}  ${where.slice(0, 3).join(" ")}`);
    }
  }
  console.log("\n  orphans (0 importers):");
  for (const o of measuredOrphans.sort()) console.log(`      ${o}  (${(code.get(o)!.split("\n").length)} LOC)`);
  process.exit(0);
}

if (mode === "record") {
  let changed = false;
  for (const t of tightenable) {
    const c = register.concerns.find((x) => x.id === t.concern)!;
    const rv = c.rivals!.find((x) => x.what === t.what)!;
    console.log(`  tighten  ${t.concern} / ${t.what}: ${t.from} → ${t.to}`);
    rv.ceiling = t.to;
    changed = true;
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const c of register.concerns) {
    for (const e of c.evidence ?? []) {
      const { n } = countPattern(e.pattern, e.excludePaths);
      if (n !== e.asAt) {
        console.log(`  re-date ${c.id} / ${e.what}: ${e.asAt} (${e.asAtDate}) → ${n} (${today})`);
        e.asAt = n;
        e.asAtDate = today;
        changed = true;
      }
    }
  }
  if (changed) {
    writeFileSync(REGISTER_JSON, `${JSON.stringify(register, null, 2)}\n`);
    console.log(`  wrote ${rel(REGISTER_JSON)}`);
  }
  writeFileSync(REGISTER_DOC, renderDoc(register));
  console.log(`  wrote ${rel(REGISTER_DOC)}`);
  console.log("\nRatchets only tighten here. Raising a ceiling is a deliberate, reviewable edit to the JSON.");
  process.exit(0);
}

// mode === "check"
let docDrift = false;
try {
  const onDisk = readFileSync(REGISTER_DOC, "utf8");
  if (onDisk !== renderDoc(register)) docDrift = true;
} catch {
  docDrift = true;
}
if (docDrift) {
  fail("[document] ADOPTION_REGISTER.md has drifted from adoption-register.json — run `npm run adoption:record`. " +
       "The register's prose and its data have one owner; they may never disagree.");
} else {
  pass("[document] ADOPTION_REGISTER.md is in sync with adoption-register.json");
}

console.log("Adoption Register Gate — UIA §17\n");
const failures = results.filter((r) => r.level === "FAIL");
const notices = results.filter((r) => r.level === "NOTICE");

for (const r of results.filter((x) => x.level === "PASS")) console.log(`  PASS    ${r.line}`);
for (const r of notices) console.log(`  NOTICE  ${r.line}`);
for (const r of failures) console.log(`  FAIL    ${r.line}`);

// The live adoption counts. Deliberately NOT frozen into the document (a number in
// prose rots); printed here instead, so they are always one command away.
console.log("\n  Live adoption — measured now:");
for (const c of register.concerns) {
  if (c.ownerKind !== "module" || !c.ownerPath || !code.has(c.ownerPath)) continue;
  const n = importerCount(c.ownerPath);
  const flag = n === 0 ? "  <-- AUTHORED-BUT-UNADOPTED" : "";
  console.log(`    ${c.concern.padEnd(34)} ${String(n).padStart(3)} importer(s)${flag}`);
}

console.log("");
if (tightenable.length) {
  console.log(`  ${tightenable.length} ceiling(s) can be tightened — run \`npm run adoption:record\`.`);
}
console.log(`  ${results.filter((r) => r.level === "PASS").length} passed · ${notices.length} notice(s) · ${failures.length} failed`);

if (failures.length) {
  console.log("\nThe adoption register is the instrument that makes authored-but-unadopted impossible to hide.");
  console.log("A failure here is not a broken build — it is the register doing its job. Fix the code, or");
  console.log("record the decision in docs/implementation/ux/adoption-register.json, with a reason.");
  process.exit(1);
}
process.exit(0);
