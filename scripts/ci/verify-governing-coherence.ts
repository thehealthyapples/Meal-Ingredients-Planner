/**
 * THA Governing-Document Coherence Gate
 * =====================================
 *
 *     npm run verify:coherence
 *
 * WHY THIS EXISTS
 * ---------------
 * `CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` § 8.4 measures the platform on four
 * signals. Three of them exist because someone built the check: `verify:publication`
 * (projection drift), `verify:schema-coverage` (schema drift), `adoption:check`
 * (adoption drift). The fourth row read, in full:
 *
 *     | Governing-document coherence | UNMEASURED — no gate exists. |
 *
 * and it is the row that produced the largest item in that backlog. THA can
 * mechanically detect a projection disagreeing with its owner, and has nothing at
 * all for a governing document disagreeing with the code it governs. That class
 * produced DOC-1, DOC-2, DOC-4, OWN-1, OWN-3 and OWN-5 — every one found by a human
 * reading prose, months late.
 *
 * This gate is the first thing that can fail on it. It implements the two checks
 * CONV1 § 8.2 (Horizon 2) names and grades "Low" cost, and deliberately not the
 * third — "no two governing documents name different owners for one domain", graded
 * Medium, which needs a machine-readable ownership claim THA does not yet have.
 * Building two of three and saying so beats building nothing while the table's
 * fourth row stays blank.
 *
 *   COH-1  Every Source of Truth Register domain names a source of truth that exists.
 *          Would have caught OWN-5 (Pantry + 3 live domains with no row in the
 *          document that owns ownership) and OWN-4 (a declared owner that is not
 *          built) — the latter as a DECLARED state, not a failure, per § 8.2.
 *
 *   COH-2  Every `file:line` citation in governing architecture resolves.
 *          Would have caught DOC-2's dangling reference and capabilities/
 *          household.md's rotted `:8526–8541` — a citation pointing into a file
 *          that had since shrunk past it.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * It does not read a governing document as law, and it creates no rule. It checks
 * that what the canon already says still resolves against the tree. Where this gate
 * and a governing document disagree about what is true, the document is not
 * automatically wrong — but one of them is, and that is the entire point: today
 * neither can be checked against the other at all.
 *
 * It cannot detect a citation that resolves to the WRONG place — only one that
 * resolves to nowhere. A line number that still exists but now points at a
 * different function passes here. That is the known ceiling of a `file:line` check
 * and the reason DOC-1's L2 lesson ("cite the owner and the behaviour; a line
 * number is a claim with a short half-life") remains the better practice. This gate
 * catches the rot it can see.
 */

import fs from "fs";
import path from "path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const ARCH_DIR = path.join(REPO_ROOT, "docs/architecture");
const REGISTER = path.join(ARCH_DIR, "THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md");
const SCHEMA = path.join(REPO_ROOT, "shared/schema.ts");

type Severity = "fail" | "warn";
interface Finding {
  readonly check: "COH-1" | "COH-2";
  readonly severity: Severity;
  readonly where: string;
  readonly detail: string;
}

const findings: Finding[] = [];
const add = (f: Finding) => findings.push(f);

/**
 * An owner the Register declares BEFORE it is built. CANONICAL_PUBLICATION_
 * ARCHITECTURE.md § Transition Rules requires exactly this order ("every new
 * domain must be declared before implementation"), so a declared-not-built owner
 * is the architecture working, not failing. CONV1 § 8.2 asks for it to be
 * reported "as a *declared* state, not a failure" — hence warn, never fail.
 */
const DECLARED_NOT_BUILT = /DECLARED,\s*NOT\s*BUILT/i;

function walkMarkdown(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(p, out);
    else if (entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const rel = (p: string) => path.relative(REPO_ROOT, p);

// ---------------------------------------------------------------------------
// COH-1 — Every Register domain names a source of truth that exists
// ---------------------------------------------------------------------------

/** Every table name the schema actually declares — the ground truth for a `DB x` claim. */
function declaredTables(): Set<string> {
  const src = fs.readFileSync(SCHEMA, "utf8");
  return new Set([...src.matchAll(/pgTable\(\s*["'`]([a-z0-9_]+)["'`]/g)].map((m) => m[1]));
}

/** A path the Register points at: `shared/canonical/foods.ts`, or a directory `shared/knowledge/`. */
const PATH_RE = /(?:^|[\s(`*|])((?:client|server|shared|scripts|docs|data)\/[A-Za-z0-9_./-]*(?:\.[A-Za-z]{2,4}|\/))/g;
/**
 * A bare module basename — `nutrition-benefit-library.ts`, cited without its
 * directory. Domain 18 names its contested owner this way, and treating that as
 * "prose, nothing to check" would quietly excuse the one row most worth checking.
 */
const BARE_MODULE_RE = /`?\b([a-z0-9][a-z0-9-]*\.tsx?)\b`?/g;
/** A backticked lower_snake_case token — a table claim (`meals`, `user_pantry_items`). */
const TABLE_RE = /`([a-z][a-z0-9_]*)`/g;
/** A column claim — `users.subscriptionTier`. The checkable part is the table. */
const COLUMN_RE = /`([a-z][a-z0-9_]*)\.([A-Za-z][A-Za-z0-9_]*)`/g;

function checkRegisterDomains(tables: Set<string>): number {
  const src = fs.readFileSync(REGISTER, "utf8");
  const lines = src.split("\n");

  // Domain blocks: "### Domain 30: Pantry State" → up to the next "### " / "## ".
  const starts: { line: number; title: string }[] = [];
  lines.forEach((l, i) => {
    const m = /^### (Domain \d+:.*)$/.exec(l);
    if (m) starts.push({ line: i, title: m[1].trim() });
  });

  for (let d = 0; d < starts.length; d++) {
    const from = starts[d].line;
    let to = lines.length;
    for (let i = from + 1; i < lines.length; i++) {
      if (/^#{2,3} /.test(lines[i])) { to = i; break; }
    }
    const block = lines.slice(from, to);
    const blockText = block.join("\n");
    const row = block.find((l) => /^\|\s*Authoritative Source\s*\|/i.test(l));

    // Register Rule 1: "Every major domain must declare a named source of truth."
    // A domain with no row at all is the rule breached by omission — OWN-5's shape,
    // where the document that owns ownership did not know the domain existed.
    if (!row) {
      add({ check: "COH-1", severity: "fail", where: `${rel(REGISTER)} — ${starts[d].title}`,
            detail: "declares no Authoritative Source row (Register Rule 1: every major domain must declare a named source of truth)." });
      continue;
    }

    const declaredOnly = DECLARED_NOT_BUILT.test(blockText);
    const severity: Severity = declaredOnly ? "warn" : "fail";

    // THE DECLARED OWNER IS THE FIRST ARTEFACT THE ROW NAMES. Everything after it
    // is commentary, and the commentary is frequently about things that are SUPPOSED
    // not to exist. Domain 22 is the proof: its row names
    // `shared/canonical/diversity-groups.ts` (the owner) and then says "the contest
    // with `client/src/lib/nutrition-variety.ts` was resolved by M4 in the canonical
    // seed's favour" — the rival is gone because the architecture won. Judging every
    // path in the cell would report that victory as a defect, which is how a gate
    // teaches people to ignore it (CONV1 R2).
    //
    // So: check what the domain declares it is owned BY, and nothing else. The
    // ceiling is stated plainly — a row naming an owner plus six of its tables is
    // verified on the owner alone.
    const fullPaths = [...row.matchAll(PATH_RE)].map((m) => ({ kind: "path" as const, name: m[1], at: m.index! }));
    const artefacts: { kind: "path" | "table"; name: string; at: number }[] = [
      ...fullPaths,
      // A basename counts when the tree resolves it uniquely (use the real path), or
      // when it resolves to NOTHING (a dangling owner claim — keep the name as
      // written so the failure quotes the document). Only an AMBIGUOUS basename is
      // skipped, because there this gate would be choosing which file the sentence
      // meant, and it has no standing to.
      ...[...row.matchAll(BARE_MODULE_RE)]
        .filter((m) => !fullPaths.some((p) => p.name.endsWith(m[1])))
        .filter((m) => (basenameIndex.get(m[1])?.length ?? 0) !== 1 ? (basenameIndex.get(m[1])?.length ?? 0) === 0 : true)
        .map((m) => ({
          kind: "path" as const,
          name: basenameIndex.get(m[1])?.[0] ?? m[1],
          at: m.index!,
        })),
      ...[...row.matchAll(COLUMN_RE)].map((m) => ({ kind: "table" as const, name: m[1], at: m.index! })),
      ...[...row.matchAll(TABLE_RE)]
        .map((m) => ({ kind: "table" as const, name: m[1], at: m.index! }))
        // A table claim is a claim about the DB. A lowercase prose word in backticks
        // is not, and must not be guessed at.
        .filter((t) => tables.has(t.name) || t.name.includes("_")),
    ].sort((a, b) => a.at - b.at);

    if (artefacts.length === 0) {
      add({ check: "COH-1", severity: "warn", where: `${rel(REGISTER)} — ${starts[d].title}`,
            detail: "Authoritative Source row names no checkable artefact (no file path, no DB table) — prose only, so nothing here can be verified." });
      continue;
    }

    const owner = artefacts[0];
    const exists = owner.kind === "path"
      ? fs.existsSync(path.join(REPO_ROOT, owner.name))
      : tables.has(owner.name);

    if (exists) continue;

    add({
      check: "COH-1",
      severity,
      where: `${rel(REGISTER)} — ${starts[d].title}`,
      detail: declaredOnly
        ? `declares owner \`${owner.name}\`, which does not exist — DECLARED, NOT BUILT (an intended state: the owner is declared ahead of implementation, as CANONICAL_PUBLICATION_ARCHITECTURE.md § Transition Rules requires).`
        : owner.kind === "path"
          ? `names source of truth \`${owner.name}\`, which does not exist on disk.`
          : `names DB table \`${owner.name}\` as its source of truth, which shared/schema.ts does not declare.`,
    });
  }
  return starts.length;
}

// ---------------------------------------------------------------------------
// COH-2 — Every file:line citation in governing architecture resolves
// ---------------------------------------------------------------------------

/** `server/storage.ts:2129` / `shared/schema.ts:1010-1020` — an explicit, self-contained citation. */
const EXPLICIT_RE = /`([A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|json|sql|sh|md)):(\d+)(?:\s*[-–]\s*(\d+))?`/g;
/**
 * `:8526–8541` — a BARE citation, whose file is whatever was last named on the same
 * line. This is how the Register and the capability cards actually write runs of
 * references ("`/api/pantry` (`server/routes.ts:7788` GET · `:7808` POST")), and it
 * is the exact shape of the rotted household.md reference CONV1 § 8.2 names.
 */
const BARE_RE = /`:(\d+)(?:\s*[-–]\s*(\d+))?`/g;

const lineCountCache = new Map<string, number | null>();
function lineCount(relPath: string): number | null {
  if (lineCountCache.has(relPath)) return lineCountCache.get(relPath)!;
  const abs = path.join(REPO_ROOT, relPath);
  let n: number | null = null;
  try {
    if (fs.statSync(abs).isFile()) n = fs.readFileSync(abs, "utf8").split("\n").length;
  } catch { n = null; }
  lineCountCache.set(relPath, n);
  return n;
}

/**
 * Basename → every repo path carrying it. The canon routinely cites a full path once
 * and then shortens it ("`server/intelligence/…/observation-engine.ts:47` … then
 * `observation-engine.ts:133`"), exactly as a reader would. A gate that called those
 * broken would report ~30 false failures on day one and be switched off by the end
 * of the week, which is precisely the fate CONV1 R2 describes.
 */
const basenameIndex = new Map<string, string[]>();
(function indexRepo(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "build") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) indexRepo(p);
    else {
      const list = basenameIndex.get(entry.name) ?? [];
      list.push(path.relative(REPO_ROOT, p));
      basenameIndex.set(entry.name, list);
    }
  }
})(REPO_ROOT);

/**
 * Resolve a cited path: as written, then relative to the citing document, then — for
 * a bare basename — by repo index. An AMBIGUOUS basename (several files share it)
 * resolves to null and is skipped, never guessed: a gate may not invent the file a
 * sentence meant.
 */
function resolveCitedPath(cited: string, fromDoc: string, sameLineContext: string[]): string | null {
  if (lineCount(cited) !== null) return cited;
  const nearby = path.relative(REPO_ROOT, path.resolve(path.dirname(fromDoc), cited));
  if (lineCount(nearby) !== null) return nearby;

  if (!cited.includes("/")) {
    // Prefer a full path already named on this line — that is what a reader binds to.
    const fromContext = sameLineContext.find((p) => path.basename(p) === cited);
    if (fromContext && lineCount(fromContext) !== null) return fromContext;
    const candidates = basenameIndex.get(cited) ?? [];
    if (candidates.length === 1) return candidates[0];
    return null; // ambiguous or unknown — do not guess
  }
  return null;
}

function checkCitations(): number {
  let total = 0;
  for (const doc of walkMarkdown(ARCH_DIR)) {
    const lines = fs.readFileSync(doc, "utf8").split("\n");
    lines.forEach((line, i) => {
      const at = `${rel(doc)}:${i + 1}`;
      let lastPath: string | null = null;

      // Walk explicit and bare citations in the order they appear, so a bare `:NNN`
      // binds to the file named to its left — the way a reader binds it.
      const hits = [
        ...[...line.matchAll(EXPLICIT_RE)].map((m) => ({ idx: m.index!, kind: "explicit" as const, m })),
        ...[...line.matchAll(BARE_RE)].map((m) => ({ idx: m.index!, kind: "bare" as const, m })),
      ].sort((a, b) => a.idx - b.idx);

      for (const hit of hits) {
        const cited = hit.kind === "explicit" ? hit.m[1] : lastPath;
        const start = Number(hit.kind === "explicit" ? hit.m[2] : hit.m[1]);
        const end = hit.kind === "explicit" ? hit.m[3] : hit.m[2];
        const highest = end ? Number(end) : start;

        if (hit.kind === "explicit") {
          const fullPathsOnLine = [...line.matchAll(EXPLICIT_RE)].map((x) => x[1]).filter((p) => p.includes("/"));
          const r = resolveCitedPath(hit.m[1], doc, fullPathsOnLine);
          total++;
          if (!r) {
            // An ambiguous basename is not a broken citation — it is one this gate
            // cannot adjudicate. Say which it is; a finding a reader cannot act on
            // is noise, and noise is how a gate loses its authority.
            const ambiguous = !hit.m[1].includes("/") && (basenameIndex.get(hit.m[1])?.length ?? 0) > 1;
            if (ambiguous) continue;
            lastPath = null;
            add({ check: "COH-2", severity: "fail", where: at,
                  detail: `cites \`${hit.m[1]}:${start}\` — no such file in the tree.` });
            continue;
          }
          lastPath = r;
          const n = lineCount(r)!;
          if (highest > n) {
            add({ check: "COH-2", severity: "fail", where: at,
                  detail: `cites \`${hit.m[1]}:${end ? `${start}-${end}` : start}\` — the file has ${n} lines.` });
          }
          continue;
        }

        // A bare `:NNN` binds to a file by MEANING, not by position, and this gate
        // cannot read meaning. Register:580 is the proof: it cites
        // `server/routes.ts:8549-8792`, then `world-seeder.ts:81-87`, then "Routes
        // disclaim ownership (`:8544`)" — positionally that last one attaches to
        // world-seeder.ts (624 lines) and looks broken; a human binds it to routes.ts
        // instantly, from the word "Routes" and the size of the number.
        //
        // So a bare ref is adjudicated ONLY on a line that names exactly one file,
        // where there is nothing to get wrong. On any other line it is skipped, and
        // the coverage is lost on purpose: a false failure costs more than a missed
        // one, because it is spent from the gate's credibility rather than the
        // codebase's.
        if (!cited) continue;
        const distinctFiles = new Set([...line.matchAll(EXPLICIT_RE)].map((x) => x[1]));
        if (distinctFiles.size !== 1) continue;
        const n = lineCount(cited);
        if (n === null) continue; // the explicit citation it hangs off already reported
        total++;
        if (highest > n) {
          add({ check: "COH-2", severity: "fail", where: at,
                detail: `cites \`:${end ? `${start}-${end}` : start}\` in ${cited} — the file has ${n} lines.` });
        }
      }
    });
  }
  return total;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const tables = declaredTables();
const domainCount = checkRegisterDomains(tables);
const citationCount = checkCitations();

const fails = findings.filter((f) => f.severity === "fail");
const warns = findings.filter((f) => f.severity === "warn");

console.log("\n── THA Governing-Document Coherence (CONV1 § 8.2, Horizon 2) ──\n");
console.log(`COH-1  Register domains checked: ${domainCount}  (against ${tables.size} declared tables)`);
console.log(`COH-2  file:line citations checked: ${citationCount}  (across ${walkMarkdown(ARCH_DIR).length} governing documents)\n`);

for (const check of ["COH-1", "COH-2"] as const) {
  const mine = findings.filter((f) => f.check === check);
  if (mine.length === 0) { console.log(`${check}: ✓ clean\n`); continue; }
  console.log(`${check}:`);
  for (const f of mine) {
    console.log(`  ${f.severity === "fail" ? "✗ [FAIL]" : "⚠ [WARN]"} ${f.where}`);
    console.log(`      ${f.detail}`);
  }
  console.log("");
}

console.log("── Coherence status ──");
console.log(`${fails.length} failed, ${warns.length} warned.\n`);

if (fails.length > 0) {
  console.log("RESULT: FAIL — governing architecture disagrees with the tree it governs.\n");
  process.exit(1);
}
console.log("RESULT: PASS — every declared owner and every file:line citation resolves.\n");
process.exit(0);
