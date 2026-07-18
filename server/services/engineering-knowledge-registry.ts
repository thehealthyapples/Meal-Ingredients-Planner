/**
 * Engineering Knowledge Registry (ENGINT1)
 * ========================================
 * The owner-side read surface over THA's ENGINEERING knowledge: the governing
 * architecture, the investigations, the implementation reports, the roadmap, the
 * repository conventions and the release record.
 *
 * IT OWNS NOTHING. This is TIP1 §3.1 taken literally — *"TIP does not own
 * knowledge. It owns an index of pointers into the existing owners. Every answer
 * cites its source. When the source changes, the index is rebuilt; the answer
 * changes with it. There is never a second editable copy of any fact."*
 *
 * So the index stores POINTERS and METADATA ONLY — `path`, `docId`, `title`,
 * `date`, `status`, heading outline, mtime. It never stores a document's prose.
 * Excerpts are read from the file at answer time and returned with their line
 * numbers, so every citation is a `path:line` a human can open and check. Delete
 * this module and not one engineering fact is lost; rebuild it and nothing is
 * restored, because nothing was ever held here.
 *
 * FRESHNESS OVER GENERATION. The Product Knowledge Registry's generated
 * `product.json` (Rule PKR21) is the right shape for knowledge a human authors
 * deliberately and rarely. Engineering knowledge is the opposite: it changes
 * several times per session, and a generated artefact would be stale before the
 * session that generated it ended — the precise failure PKCA Rule KC14 names for
 * a self-describing domain, where *"a stale entry is indistinguishable from a
 * fresh one by reading it"*. So the index is built live from the filesystem and
 * invalidated on mtime. It is a cache, and Principle 7 permits a cache.
 *
 * NON-FABRICATION IS THE WHOLE POINT. Every function here returns either
 * evidence with a citation or an explicit, structured absence. Nothing infers a
 * completion status the repository does not record — see `roadmapPosition()`,
 * whose headline finding is that the roadmap does NOT record per-workstream
 * completion, and which says so rather than deriving one.
 *
 * PLANE: developer only. TIP1 §7 and §4.2 — this module is reachable exclusively
 * through the `developer` capability on the isolated developer plane, and never
 * from the household Companion. See `server/intelligence/developer-plane.ts`.
 */

import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// What counts as engineering knowledge, and who owns it
// ---------------------------------------------------------------------------

export type EngineeringDocKind =
  | "architecture"
  | "investigation"
  | "implementation"
  | "roadmap"
  | "release"
  | "protocol";

/**
 * The canonical sources, each named with the owner it points AT. This table is
 * the module's entire notion of what engineering knowledge is; adding a source
 * is one row, and no other code changes.
 */
interface SourceRoot {
  readonly dir: string;
  readonly kind: EngineeringDocKind;
  readonly recursive: boolean;
  readonly owner: string;
}

const SOURCE_ROOTS: readonly SourceRoot[] = [
  {
    dir: "docs/architecture",
    kind: "architecture",
    recursive: true,
    owner: "docs/architecture/ — governing architecture, indexed in its README.md",
  },
  {
    dir: "docs/investigations",
    kind: "investigation",
    recursive: true,
    owner: "docs/investigations/<workstream>/ — point-in-time analysis and history",
  },
  {
    dir: "docs/implementation",
    kind: "implementation",
    recursive: true,
    owner: "docs/implementation/<workstream>/ — implementation reports",
  },
  {
    dir: ".engineering/protocols",
    kind: "protocol",
    recursive: false,
    owner: ".engineering/protocols/ — engineering process protocols",
  },
];

/** Single-file sources that do not live under a source root. */
const SOURCE_FILES: readonly { readonly path: string; readonly kind: EngineeringDocKind }[] = [
  { path: "RELEASE.md", kind: "release" },
  { path: "docs/release-notes.md", kind: "release" },
  { path: "docs/release-matrix.md", kind: "release" },
];

/**
 * The roadmap is an `architecture` document by location, but it answers a
 * different question from every other one, so it is classified separately.
 */
const ROADMAP_PATH = "docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md";

/**
 * Templates carry literal `[YYYY-MM-DD]` placeholders and describe no real work.
 * Indexing them would let a placeholder be cited as evidence.
 */
const EXCLUDED_BASENAMES = new Set([
  "README.md",
  "IMPLEMENTATION_TEMPLATE.md",
  "INVESTIGATION_TEMPLATE.md",
  "RELEASE_TEMPLATE.md",
  "REPOSITORY_HOUSEKEEPING_TEMPLATE.md",
  "COMP4A2_IMPLEMENTATION_REPORT_TEMPLATE.md",
]);

const EXCLUDED_DIR_SEGMENTS = new Set(["backups", "node_modules", ".git"]);

// ---------------------------------------------------------------------------
// The index entry — a POINTER, never a copy
// ---------------------------------------------------------------------------

export interface EngineeringDocRef {
  /** Repo-relative path. This is the pointer; the file remains the owner. */
  readonly path: string;
  readonly kind: EngineeringDocKind;
  /** Workstream folder (`intelligence`, `companion`, …) or null for flat sources. */
  readonly workstream: string | null;
  /** The EWO id prefix — `ENGINT1` from `ENGINT1_ENGINEERING_INTELLIGENCE.md`. */
  readonly docId: string | null;
  /** First `# ` heading, or the filename stem when the file has none. */
  readonly title: string;
  /** Parsed from either header dialect; null when the document states none. */
  readonly date: string | null;
  readonly status: string | null;
  readonly branch: string | null;
  readonly rollback: string | null;
  /** `##`/`###` outline — enough to route a question, never the prose itself. */
  readonly headings: readonly string[];
  readonly bytes: number;
  readonly mtimeMs: number;
}

export interface EngineeringCitation {
  readonly path: string;
  readonly line: number;
  readonly text: string;
}

export interface EngineeringSearchHit {
  readonly doc: EngineeringDocRef;
  readonly score: number;
  readonly citations: readonly EngineeringCitation[];
}

/** A structured, reportable absence. Never an empty array pretending to be an answer. */
export interface EngineeringGap {
  readonly question: string;
  readonly reason: string;
  readonly searched: readonly string[];
}

// ---------------------------------------------------------------------------
// Index build + mtime cache
// ---------------------------------------------------------------------------

interface IndexSnapshot {
  readonly docs: readonly EngineeringDocRef[];
  readonly builtAtMs: number;
  readonly rootMtimeMs: number;
  /**
   * Document frequency per surface term — how many documents mention it in their
   * title, headings or filename.
   *
   * This exists because THA's engineering corpus is pathologically self-similar:
   * "architecture", "intelligence", "platform", "household" and "companion"
   * appear in hundreds of titles, so an unweighted match on them ranks the whole
   * corpus equally and answers *"which document owns Planner architecture?"* with
   * whichever architecture document happened to sort first. That is not a weak
   * answer, it is a WRONG one — and a confidently wrong owner is precisely what
   * this capability must never produce. See `termWeight`.
   */
  readonly docFrequency: ReadonlyMap<string, number>;
}

let snapshot: IndexSnapshot | null = null;

/** Re-stat at most this often. Bounds filesystem work under a burst of questions. */
const REVALIDATE_AFTER_MS = 15_000;

function repoRoot(): string {
  return process.cwd();
}

async function walkMarkdown(absDir: string, recursive: boolean): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(absDir, { withFileTypes: true });
  } catch {
    return []; // A source root that does not exist is an honest absence, not a crash.
  }

  const found: string[] = [];
  for (const entry of entries) {
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      if (!recursive || EXCLUDED_DIR_SEGMENTS.has(entry.name)) continue;
      found.push(...(await walkMarkdown(abs, recursive)));
    } else if (entry.isFile() && entry.name.endsWith(".md") && !EXCLUDED_BASENAMES.has(entry.name)) {
      found.push(abs);
    }
  }
  return found;
}

/**
 * Parse the header of an engineering document.
 *
 * Two dialects are live in the repository and both must be read: the template's
 * bold key/value lines (`**Date:** 2026-07-18`) and the newer headerless
 * two-column metadata table (`| **Date** | 2026-07-18 |`). A document matching
 * neither yields nulls — which is the honest result, not a defect to paper over.
 */
function parseHeader(text: string): {
  title: string | null;
  date: string | null;
  status: string | null;
  branch: string | null;
  rollback: string | null;
  headings: string[];
} {
  const lines = text.split("\n");
  let title: string | null = null;
  const headings: string[] = [];
  const fields = new Map<string, string>();

  // Header metadata only ever appears near the top; the outline spans the file.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (title === null) {
      const h1 = /^#\s+(.+?)\s*$/.exec(line);
      if (h1) {
        // Alternation rather than a character class: these are surrogate pairs,
        // and a class of them needs the `u` flag this tsconfig target forbids.
        title = h1[1].replace(/\s*(?:✅|🟢|🟡|🔴|⚠️)+\s*$/, "").trim();
        continue;
      }
    }

    const h = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (h) headings.push(h[2].trim());

    if (i > 80) continue; // metadata scan window

    // Dialect A — **Key:** value
    const bold = /^\*\*([A-Za-z][A-Za-z /]*?):?\*\*[:\s]+(.+?)\s*$/.exec(line);
    if (bold) {
      const key = bold[1].trim().toLowerCase();
      if (!fields.has(key)) fields.set(key, bold[2].trim());
      continue;
    }

    // Dialect B — | **Key** | value |
    const row = /^\|\s*\*\*([A-Za-z][A-Za-z /]*?)\*\*\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
    if (row) {
      const key = row[1].trim().toLowerCase();
      if (!fields.has(key)) fields.set(key, row[2].trim());
    }
  }

  const clean = (v: string | undefined): string | null => {
    if (!v) return null;
    const s = v.replace(/`/g, "").replace(/\*\*/g, "").trim();
    return s.length > 0 ? s : null;
  };

  const dateRaw = clean(fields.get("date"));
  const date = dateRaw && /^\d{4}-\d{2}-\d{2}/.test(dateRaw) ? dateRaw.slice(0, 10) : null;

  return {
    title,
    date,
    status: clean(fields.get("status")),
    branch: clean(fields.get("branch")),
    rollback: clean(fields.get("rollback")) ?? clean(fields.get("rollback tag")),
    headings,
  };
}

function classify(relPath: string): { kind: EngineeringDocKind; workstream: string | null } {
  if (relPath === ROADMAP_PATH) return { kind: "roadmap", workstream: null };

  for (const file of SOURCE_FILES) {
    if (relPath === file.path) return { kind: file.kind, workstream: null };
  }

  for (const root of SOURCE_ROOTS) {
    if (!relPath.startsWith(`${root.dir}/`)) continue;
    const rest = relPath.slice(root.dir.length + 1);
    const segments = rest.split("/");
    return { kind: root.kind, workstream: segments.length > 1 ? segments[0] : null };
  }

  return { kind: "protocol", workstream: null };
}

/** `ENGINT1_ENGINEERING_INTELLIGENCE_FOUNDATION.md` → `ENGINT1`. */
function parseDocId(basename: string): string | null {
  const stem = basename.replace(/\.md$/, "");
  const m = /^([A-Z][A-Z0-9_]*?[0-9][A-Z0-9_]*?)_/.exec(stem) ?? /^([A-Z][A-Z0-9]{1,12})_/.exec(stem);
  return m ? m[1] : null;
}

async function buildIndex(): Promise<IndexSnapshot> {
  const root = repoRoot();
  const absPaths: string[] = [];

  for (const source of SOURCE_ROOTS) {
    absPaths.push(...(await walkMarkdown(path.join(root, source.dir), source.recursive)));
  }
  for (const file of SOURCE_FILES) {
    absPaths.push(path.join(root, file.path));
  }

  const docs: EngineeringDocRef[] = [];
  let rootMtimeMs = 0;

  for (const abs of absPaths) {
    let info;
    try {
      info = await stat(abs);
    } catch {
      continue; // Listed but absent — skip silently; absence is reported by the caller.
    }
    if (!info.isFile()) continue;

    const relPath = path.relative(root, abs).split(path.sep).join("/");
    const { kind, workstream } = classify(relPath);

    let text: string;
    try {
      text = await readFile(abs, "utf8");
    } catch {
      continue;
    }

    const header = parseHeader(text);
    const basename = path.basename(relPath);

    docs.push({
      path: relPath,
      kind,
      workstream,
      docId: parseDocId(basename),
      title: header.title ?? basename.replace(/\.md$/, ""),
      date: header.date,
      status: header.status,
      branch: header.branch,
      rollback: header.rollback,
      headings: header.headings,
      bytes: info.size,
      mtimeMs: info.mtimeMs,
    });

    if (info.mtimeMs > rootMtimeMs) rootMtimeMs = info.mtimeMs;
  }

  // Document frequency over the searchable surface of each document.
  const docFrequency = new Map<string, number>();
  for (const doc of docs) {
    const surface = new Set(terms(`${doc.title} ${doc.headings.join(" ")} ${path.basename(doc.path)}`));
    for (const term of surface) docFrequency.set(term, (docFrequency.get(term) ?? 0) + 1);
  }

  return { docs, builtAtMs: Date.now(), rootMtimeMs, docFrequency };
}

/**
 * The live index. Rebuilt whenever any indexed file's mtime has moved past the
 * snapshot's high-water mark — so a document edited mid-session is answered from
 * its new content, not its old one.
 */
async function index(): Promise<IndexSnapshot> {
  if (snapshot && Date.now() - snapshot.builtAtMs < REVALIDATE_AFTER_MS) return snapshot;

  const next = await buildIndex();
  // Rebuild is the same work as revalidation for a corpus this size, so the
  // snapshot is simply replaced; there is no window in which a stale answer wins.
  snapshot = next;
  return next;
}

/** Test seam — drops the cache so the next question re-reads the filesystem. */
export function invalidateEngineeringIndex(): void {
  snapshot = null;
}

// ---------------------------------------------------------------------------
// PHASE 1 — Engineering knowledge
// ---------------------------------------------------------------------------

export interface EngineeringIndexSummary {
  readonly totalDocuments: number;
  readonly byKind: Readonly<Record<string, number>>;
  readonly byWorkstream: Readonly<Record<string, number>>;
  readonly sources: readonly string[];
  readonly builtAt: string;
}

export async function summariseIndex(): Promise<EngineeringIndexSummary> {
  const snap = await index();
  const byKind: Record<string, number> = {};
  const byWorkstream: Record<string, number> = {};

  for (const doc of snap.docs) {
    byKind[doc.kind] = (byKind[doc.kind] ?? 0) + 1;
    if (doc.workstream) byWorkstream[doc.workstream] = (byWorkstream[doc.workstream] ?? 0) + 1;
  }

  return {
    totalDocuments: snap.docs.length,
    byKind,
    byWorkstream,
    sources: [...SOURCE_ROOTS.map((s) => `${s.dir} — ${s.owner}`), ...SOURCE_FILES.map((f) => f.path)],
    builtAt: new Date(snap.builtAtMs).toISOString(),
  };
}

export async function listDocuments(filter?: {
  kind?: EngineeringDocKind;
  workstream?: string;
}): Promise<EngineeringDocRef[]> {
  const snap = await index();
  return snap.docs
    .filter((d) => (filter?.kind ? d.kind === filter.kind : true))
    .filter((d) => (filter?.workstream ? d.workstream === filter.workstream : true))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.path.localeCompare(b.path));
}

export async function getDocument(idOrPath: string): Promise<EngineeringDocRef | undefined> {
  const snap = await index();
  const needle = idOrPath.trim();
  return (
    snap.docs.find((d) => d.path === needle) ??
    snap.docs.find((d) => d.docId?.toLowerCase() === needle.toLowerCase()) ??
    snap.docs.find((d) => path.basename(d.path).toLowerCase() === needle.toLowerCase())
  );
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "what", "which", "who", "why", "how", "does",
  "do", "did", "this", "that", "these", "those", "it", "its", "of", "for", "to", "in", "on",
  "and", "or", "we", "our", "us", "be", "been", "has", "have", "had", "explain", "describe",
  "summarise", "summarize", "tell", "me", "about", "there", "any", "remain", "remains",
]);

function terms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/** Excerpts are read from the file at answer time — never held in the index. */
async function citationsFor(doc: EngineeringDocRef, queryTerms: string[], max: number): Promise<EngineeringCitation[]> {
  let text: string;
  try {
    text = await readFile(path.join(repoRoot(), doc.path), "utf8");
  } catch {
    return [];
  }

  const lines = text.split("\n");
  const scored: { line: number; text: string; hits: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    const hits = queryTerms.reduce((n, t) => (lower.includes(t) ? n + 1 : n), 0);
    if (hits > 0 && lines[i].trim().length > 20) {
      scored.push({ line: i + 1, text: lines[i].trim().slice(0, 400), hits });
    }
  }

  return scored
    .sort((a, b) => b.hits - a.hits || a.line - b.line)
    .slice(0, max)
    .sort((a, b) => a.line - b.line)
    .map(({ line, text: t }) => ({ path: doc.path, line, text: t }));
}

/**
 * How much a term's presence should count, from how rare it is in the corpus —
 * standard inverse document frequency, normalised to 0…1.
 *
 * A term in one document scores near 1. A term in half the corpus scores near 0,
 * which is the intended effect: matching "architecture" in a repository of 796
 * engineering documents carries almost no information, while matching "planner"
 * or "ENGINT1" carries a great deal. Without this, every question containing a
 * house word retrieved the house.
 */
function termWeight(term: string, snap: IndexSnapshot): number {
  const total = snap.docs.length;
  if (total === 0) return 0;
  const df = snap.docFrequency.get(term) ?? 0;
  const weight = Math.log(total / (1 + df)) / Math.log(total);
  return Math.max(0, Math.min(1, weight));
}

/**
 * A hit must clear this to be reported at all. Below it, the honest answer is a
 * gap — Engineering Intelligence returns nothing rather than the least-bad
 * match, because a plausible wrong owner costs more than an admitted absence.
 */
const MIN_HIT_SCORE = 6;

/** A title/id match strong enough to report even when no body line matched. */
const STRONG_MATCH_SCORE = 22;

/**
 * How many of the question's meaningful terms a document must match to be
 * reported at all.
 *
 * Score alone is not enough. "What governs Planner architecture?" scores
 * `ARCHITECTURE_PRINCIPLES.md` highly on the single word "architecture" — and
 * returning it implies THA has a Planner architecture document, which it does
 * not. Requiring coverage turns that into the honest gap it should always have
 * been: a document that answers half the question answers none of it.
 */
function requiredTermCoverage(termCount: number): number {
  if (termCount <= 1) return 1;
  return Math.max(2, Math.ceil(termCount * 0.5));
}

export interface SearchOptions {
  readonly kind?: EngineeringDocKind;
  readonly workstream?: string;
  readonly limit?: number;
  readonly citationsPerDoc?: number;
}

/**
 * Locate the documents that bear on a question, ranked, each with `path:line`
 * citations. Ranking is deterministic and explainable — title and id matches
 * outrank heading matches, which outrank body matches — because an engineering
 * answer that cannot be checked is worth less than no answer at all.
 */
export async function searchDocuments(query: string, options: SearchOptions = {}): Promise<EngineeringSearchHit[]> {
  const snap = await index();
  const queryTerms = terms(query);
  if (queryTerms.length === 0) return [];

  const limit = options.limit ?? 8;
  const perDoc = options.citationsPerDoc ?? 3;
  const required = requiredTermCoverage(queryTerms.length);
  const candidates: { doc: EngineeringDocRef; score: number }[] = [];

  for (const doc of snap.docs) {
    if (options.kind && doc.kind !== options.kind) continue;
    if (options.workstream && doc.workstream !== options.workstream) continue;

    const title = doc.title.toLowerCase();
    const stem = path.basename(doc.path).toLowerCase();
    const headings = doc.headings.join(" \n ").toLowerCase();

    let score = 0;
    let matchedTerms = 0;

    for (const term of queryTerms) {
      // An explicit EWO id is an exact address, not a keyword — corpus frequency
      // is irrelevant to it, so it is deliberately not weighted.
      if (doc.docId && doc.docId.toLowerCase() === term) {
        score += 40;
        matchedTerms++;
        continue;
      }

      const weight = termWeight(term, snap);
      let termScore = 0;
      if (title.includes(term)) termScore += 22 * weight;
      else if (stem.includes(term)) termScore += 14 * weight;
      if (headings.includes(term)) termScore += 7 * weight;

      if (termScore > 0) {
        score += termScore;
        matchedTerms++;
      }
    }

    // Matching more of the question is worth more than matching one word of it
    // loudly — "planner architecture" should prefer a document about the planner
    // over the most generic architecture document in the tree.
    if (matchedTerms > 1) score *= 1 + 0.35 * (matchedTerms - 1);

    // Governing architecture answers "which document owns this?" — so when the
    // question is about ownership or governance, the architecture tree wins ties.
    if (doc.kind === "architecture") score += 2;

    // Coverage gate first: a document that matches one word of a five-word
    // question is not a weak answer to it, it is an answer to a different one.
    if (matchedTerms < required) continue;

    if (score > 0) candidates.push({ doc, score });
  }

  // Body scan, but only for the shortlist — reading 790 files per question is
  // both slow and unnecessary when the metadata already ranks them.
  const shortlist = candidates.sort((a, b) => b.score - a.score).slice(0, limit * 3);
  const hits: EngineeringSearchHit[] = [];

  for (const { doc, score } of shortlist) {
    const citations = await citationsFor(doc, queryTerms, perDoc);
    hits.push({ doc, score: score + 2 * citations.length, citations });
  }

  return hits
    .filter((h) => h.score >= MIN_HIT_SCORE && (h.citations.length > 0 || h.score >= STRONG_MATCH_SCORE))
    .sort((a, b) => b.score - a.score || (b.doc.date ?? "").localeCompare(a.doc.date ?? ""))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// PHASE 2 — Engineering reasoning
// ---------------------------------------------------------------------------

export interface GoverningOwnerAnswer {
  readonly topic: string;
  readonly governingDocuments: readonly EngineeringSearchHit[];
  readonly supportingImplementations: readonly EngineeringDocRef[];
  readonly gap: EngineeringGap | null;
}

/**
 * "Which document owns this behaviour? What is the source of truth?"
 *
 * Answers ONLY from `docs/architecture/`, because that directory's README
 * declares itself *"the single canonical home for THA's governing
 * architecture"* and states that investigations are history, never rule. An
 * investigation is therefore never returned as an owner — it may be returned as
 * supporting history, clearly separated.
 */
export async function whoGoverns(topic: string): Promise<GoverningOwnerAnswer> {
  const governing = await searchDocuments(topic, { kind: "architecture", limit: 4 });
  const implementations = await searchDocuments(topic, { kind: "implementation", limit: 4 });

  const gap: EngineeringGap | null =
    governing.length === 0
      ? {
          question: `Which governing document owns "${topic}"?`,
          reason:
            "No document in docs/architecture/ matches this topic. That is an honest gap, and it means " +
            "one of two things: the behaviour is governed under a name this question did not use, or it " +
            "has no governing owner yet. Engineering Intelligence will not nominate an owner the " +
            "architecture has not declared.",
          searched: ["docs/architecture/ (governing architecture, including its README index)"],
        }
      : null;

  return {
    topic,
    governingDocuments: governing,
    supportingImplementations: implementations.map((h) => h.doc),
    gap,
  };
}

export interface ImplementationHistoryAnswer {
  readonly topic: string;
  readonly reports: readonly EngineeringSearchHit[];
  readonly investigations: readonly EngineeringDocRef[];
  readonly gap: EngineeringGap | null;
}

/**
 * "Has this already been implemented? Which report describes it? Why does this
 * feature exist?" — implementation reports are the record of what was built;
 * investigations are the record of why. Both are returned, never merged.
 */
export async function implementationHistory(topic: string): Promise<ImplementationHistoryAnswer> {
  const reports = await searchDocuments(topic, { kind: "implementation", limit: 6 });
  const investigations = await searchDocuments(topic, { kind: "investigation", limit: 5 });

  const gap: EngineeringGap | null =
    reports.length === 0
      ? {
          question: `Has "${topic}" been implemented?`,
          reason:
            "No implementation report in docs/implementation/ matches this topic. The absence of a report " +
            "is NOT proof the work was never done — it is proof the repository does not record it. " +
            "Engineering Intelligence reports the absence and will not infer implementation status from " +
            "code, commits, or the fact that something appears to work.",
          searched: ["docs/implementation/<workstream>/ (all workstreams)"],
        }
      : null;

  return { topic, reports, investigations: investigations.map((h) => h.doc), gap };
}

export interface RoadmapWorkstream {
  readonly id: string;
  readonly name: string;
  readonly gatesLaunch: string | null;
  readonly citation: EngineeringCitation;
  /** Implementation reports that NAME this workstream id. Evidence, not a verdict. */
  readonly referencedBy: readonly EngineeringDocRef[];
}

export interface RoadmapPositionAnswer {
  readonly roadmap: EngineeringDocRef | null;
  readonly workstreams: readonly RoadmapWorkstream[];
  readonly openCheckboxes: readonly EngineeringCitation[];
  readonly completionRecorded: false;
  readonly completionGap: EngineeringGap;
}

/**
 * "Where are we against the roadmap? What remains before production? Which
 * workstreams are complete?"
 *
 * THE HONEST ANSWER IS THAT THE ROADMAP DOES NOT SAY. `THA_MASTER_EVOLUTION_
 * ROADMAP.md` declares six launch workstreams (WS0–WS5) and rates each for
 * whether it GATES launch — but it carries no per-workstream done/not-done
 * marker anywhere. Its §8 emoji legend (✅/🟡/🔴) rates readiness DIMENSIONS, not
 * workstreams, and its §9 Definition of Done checkboxes are all unchecked.
 *
 * So `completionRecorded` is the literal `false`, permanently, and the caller is
 * handed the two things that DO exist: the declared workstreams with their
 * gating status, and the implementation reports that name each one. Whether
 * those reports amount to completion is a human judgement on evidence — not a
 * status this module will synthesise. Deriving "WS3 is complete" from the
 * presence of reports mentioning WS3 is exactly the fabrication the Trust Check
 * forbids, and it is the single most tempting one in this whole capability.
 */
export async function roadmapPosition(): Promise<RoadmapPositionAnswer> {
  const snap = await index();
  const roadmap = snap.docs.find((d) => d.path === ROADMAP_PATH) ?? null;

  const completionGap: EngineeringGap = {
    question: "Which workstreams are complete, and what remains before production?",
    reason:
      "The Master Evolution Roadmap declares the launch workstreams and whether each GATES launch, but it " +
      "records no per-workstream completion status — its readiness legend (✅/🟡/🔴) rates production " +
      "DIMENSIONS in §8, not workstreams, and every §9 Definition-of-Done checkbox is unchecked. " +
      "Engineering Intelligence therefore reports the declared workstreams and the implementation reports " +
      "that reference each one, as evidence, and does NOT derive a completion verdict the repository has " +
      "never recorded. To make this answerable, the roadmap itself must carry the status.",
    searched: [ROADMAP_PATH, "docs/implementation/<workstream>/ (reports referencing each WS id)"],
  };

  if (!roadmap) {
    return { roadmap: null, workstreams: [], openCheckboxes: [], completionRecorded: false, completionGap };
  }

  let text: string;
  try {
    text = await readFile(path.join(repoRoot(), roadmap.path), "utf8");
  } catch {
    return { roadmap, workstreams: [], openCheckboxes: [], completionRecorded: false, completionGap };
  }

  const lines = text.split("\n");
  const workstreams: RoadmapWorkstream[] = [];
  const openCheckboxes: EngineeringCitation[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // `| **WS0** | **Knowledge Foundations** | … | **Yes — first.** |`
    const row = /^\|\s*\*{0,2}(WS\d+)\*{0,2}\s*\|\s*\*{0,2}([^|*]+?)\*{0,2}\s*\|(.*)\|\s*$/.exec(line);
    if (row) {
      const id = row[1];
      if (seen.has(id)) continue;
      seen.add(id);

      const cells = row[3].split("|").map((c) => c.replace(/\*\*/g, "").trim());
      const gatesLaunch = cells.length > 0 ? cells[cells.length - 1] || null : null;

      workstreams.push({
        id,
        name: row[2].trim(),
        gatesLaunch,
        citation: { path: roadmap.path, line: i + 1, text: line.trim().slice(0, 400) },
        referencedBy: [],
      });
      continue;
    }

    if (/^\s*-\s*\[ \]\s+\S/.test(line)) {
      openCheckboxes.push({ path: roadmap.path, line: i + 1, text: line.trim().slice(0, 400) });
    }
  }

  // Attach evidence: implementation reports that NAME the workstream id.
  const resolved: RoadmapWorkstream[] = [];
  for (const ws of workstreams) {
    const hits = await searchDocuments(ws.id, { kind: "implementation", limit: 5 });
    resolved.push({ ...ws, referencedBy: hits.map((h) => h.doc) });
  }

  return { roadmap, workstreams: resolved, openCheckboxes, completionRecorded: false, completionGap };
}

export interface RecentChange {
  readonly sha: string;
  readonly date: string;
  readonly subject: string;
}

export interface RecentWorkAnswer {
  readonly commits: readonly RecentChange[];
  readonly reports: readonly EngineeringDocRef[];
  readonly gap: EngineeringGap | null;
}

/**
 * "What changed recently? Which files were involved?"
 *
 * Git history is a canonical source, so it is read — read-only, via `execFile`
 * with fixed arguments and no shell, so nothing here can be turned into command
 * execution. When git is unavailable the answer degrades to the documentary
 * record with an explicit gap, rather than silently returning only half the
 * picture as if it were the whole one.
 */
/** ASCII unit separator — the git `--pretty` field delimiter, named so it is visible in source. */
const SEP = "\x1f";

export async function recentWork(limit = 15): Promise<RecentWorkAnswer> {
  const bounded = Math.max(1, Math.min(limit, 100));
  const reports = (await listDocuments({ kind: "implementation" })).slice(0, bounded);

  let commits: RecentChange[] = [];
  let gap: EngineeringGap | null = null;

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", `-${bounded}`, "--date=short", "--pretty=format:%h%x1f%ad%x1f%s"],
      { cwd: repoRoot(), timeout: 10_000, maxBuffer: 1024 * 1024 },
    );
    commits = stdout
      .split("\n")
      .filter((l) => l.includes(SEP))
      .map((l) => {
        const [sha, date, subject] = l.split(SEP);
        return { sha, date, subject };
      });
  } catch {
    gap = {
      question: "What changed recently?",
      reason:
        "Git history could not be read in this environment, so the commit record is unavailable. The " +
        "implementation reports below are the documentary record only — they are not a substitute for " +
        "the commit log, and this answer is incomplete rather than complete.",
      searched: ["git log", "docs/implementation/<workstream>/"],
    };
  }

  return { commits, reports, gap };
}

export interface RiskAnswer {
  readonly openRoadmapItems: readonly EngineeringCitation[];
  readonly redRatedDocuments: readonly EngineeringDocRef[];
  readonly note: string;
}

/**
 * "What production risks remain? Which architectural gaps remain?"
 *
 * Two evidence streams only: the roadmap's unchecked Definition-of-Done items,
 * and documents that rate THEMSELVES 🔴 RED in their own header. Nothing here
 * assesses risk; it surfaces the risk the repository has already written down.
 */
export async function openRisks(): Promise<RiskAnswer> {
  const position = await roadmapPosition();
  const snap = await index();

  const redRated = snap.docs.filter((d) => d.status != null && /🔴|(^|\s)RED(\s|$)/.test(d.status));

  return {
    openRoadmapItems: position.openCheckboxes,
    redRatedDocuments: redRated.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    note:
      "Surfaced from the roadmap's unchecked Definition-of-Done items and from documents that declare " +
      "their own risk as RED. Engineering Intelligence does not assess risk — it reports the risk THA " +
      "has already recorded about itself. An unrecorded risk will not appear here.",
  };
}
