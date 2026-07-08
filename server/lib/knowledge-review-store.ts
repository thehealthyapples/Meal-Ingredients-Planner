/**
 * KQ1B — Knowledge Review Workbench, Phase 0 store.
 *
 * A GENERAL, governed review queue for knowledge items a governed process could
 * not resolve on its own. This is a PROPOSAL / worklist layer only — it owns no
 * canonical identity, mints no entity, and does not fork the single GOV2
 * resolver (docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md). Phase 0 only
 * CAPTURES and READS; there is no editing, export, import, approval, alias
 * application, or entity creation here (those are later phases per KQ1A §10).
 *
 * Generalisation (KQ1B): the queue is not vocabulary-specific. `reviewType`
 * discriminates the kind of review; the first implemented type is "vocabulary"
 * (unresolved nutrient/benefit terms from the GOV2 resolver/importer). Future
 * review types are additive — a new `reviewType` + `details` payload, no schema
 * redesign.
 */

import { createHash } from "node:crypto";
import { db } from "../db";
import { and, asc, desc, eq, gte, ilike, inArray, ne, or, sql } from "drizzle-orm";
import {
  knowledgeReviewQueue,
  knowledgeReviewBatches,
  knowledgeReviewDecisions,
  knowledgeVocabularyAliases,
  knowledgeReleases,
  knowledgeRollbackPoints,
  knowledgeReviewAudit,
  knowledgeFoods,
  knowledgeFoodNutrients,
  knowledgeFoodBenefits,
  knowledgeNutrientBenefits,
  users,
} from "@shared/schema";
import type {
  KnowledgeReviewContext,
  KnowledgeReviewQueueItem,
  KnowledgeReviewBatch,
  KnowledgeReviewDecision,
  KnowledgeRelease,
  KnowledgeVocabularyAlias,
} from "@shared/schema";
import {
  normaliseVocabularyTerm,
  NUTRIENT_SEED,
  HEALTH_BENEFIT_SEED,
  NUTRIENT_ALIASES,
  BENEFIT_ALIASES,
  CANONICAL_NUTRIENT_SLUGS,
  CANONICAL_BENEFIT_SLUGS,
  setVocabularyOverlay,
} from "@shared/knowledge";

/** The one implemented review type in Phase 0. */
export const REVIEW_TYPE_VOCABULARY = "vocabulary" as const;

/** How many distinct sighting contexts to retain per item (bounded growth). */
const MAX_CONTEXTS = 50;

// ── KQ1C — Phase 1 editorial vocabulary ─────────────────────────────────────
// Reviewer-assignable triage priorities (ordered high→low for sorting).
export const REVIEW_PRIORITIES = ["high", "medium", "low"] as const;
export type ReviewPriority = (typeof REVIEW_PRIORITIES)[number];

// Statuses a reviewer may set in Phase 1. Deliberately EXCLUDES the approval /
// apply / hand-off statuses — those belong to later phases behind a human gate
// (KQ1A §8). Phase 1 is triage only: no approvals, no canonical changes.
export const EDITABLE_REVIEW_STATUSES = [
  "unresolved",
  "in_review",
  "deferred",
  "rejected",
] as const;
export type EditableReviewStatus = (typeof EDITABLE_REVIEW_STATUSES)[number];

// Common "knowledge origin" presets (free text is still allowed). These classify
// where the knowledge ORIGINATES editorially, distinct from `source` (the
// capture channel). Surfaced as suggestions in the UI.
export const KNOWLEDGE_ORIGIN_PRESETS = [
  "import-draft",
  "ai-extraction",
  "ocr-scan",
  "free-text-search",
  "external-source",
  "editorial",
  "unknown",
] as const;

/** A single review item to capture. Deduped by (reviewType, domain, dedupeKey). */
export interface ReviewItemInput {
  reviewType: string;
  /** Filterable sub-domain, e.g. "nutrient" | "benefit" | "food". */
  domain: string;
  /** Stable dedupe discriminator within (reviewType, domain). */
  dedupeKey: string;
  /** First-seen verbatim display label. */
  label: string;
  /** Origin of this sighting, e.g. "importer". */
  source: string;
  /** Review-type-specific payload merged into `details` on first insert. */
  details?: Record<string, unknown>;
  /** Where this item was sighted (appended to `contexts`, deduped). */
  context?: KnowledgeReviewContext;
}

function contextKey(c: KnowledgeReviewContext): string {
  return JSON.stringify({ source: c.source, foodSlug: c.foodSlug, file: c.file, path: c.path });
}

/**
 * Capture a review item. Idempotent-by-identity: a first sighting inserts a row;
 * every subsequent sighting of the same (reviewType, domain, dedupeKey)
 * increments `occurrenceCount`, refreshes `lastSeenAt`, and appends a new,
 * distinct context — never a duplicate row. Read-modify-write keeps the context
 * merge and cap simple; capture volume is low (import/resolve runs).
 *
 * Best-effort by contract: callers wrap this so a capture failure never breaks
 * the governed process it observes. It still throws on a hard DB error so the
 * caller can log it.
 */
export async function recordReviewItem(input: ReviewItemInput): Promise<void> {
  const now = new Date();
  const sighting: KnowledgeReviewContext = {
    ...(input.context ?? { source: input.source }),
    at: input.context?.at ?? now.toISOString(),
  };

  const existing = await db.query.knowledgeReviewQueue.findFirst({
    where: and(
      eq(knowledgeReviewQueue.reviewType, input.reviewType),
      eq(knowledgeReviewQueue.domain, input.domain),
      eq(knowledgeReviewQueue.dedupeKey, input.dedupeKey),
    ),
  });

  if (existing) {
    // Merge the sighting: dedupe contexts by identity, cap the retained set.
    const seen = new Set(existing.contexts.map(contextKey));
    const mergedContexts = seen.has(contextKey(sighting))
      ? existing.contexts
      : [...existing.contexts, sighting].slice(-MAX_CONTEXTS);

    await db
      .update(knowledgeReviewQueue)
      .set({
        occurrenceCount: existing.occurrenceCount + 1,
        lastSeenAt: now,
        updatedAt: now,
        contexts: mergedContexts,
      })
      .where(eq(knowledgeReviewQueue.id, existing.id));
    return;
  }

  await db
    .insert(knowledgeReviewQueue)
    .values({
      reviewType: input.reviewType,
      domain: input.domain,
      dedupeKey: input.dedupeKey,
      label: input.label,
      source: input.source,
      details: input.details ?? {},
      contexts: [sighting],
      occurrenceCount: 1,
      status: "unresolved",
      firstSeenAt: now,
      lastSeenAt: now,
    })
    // Guard the insert against a concurrent first-sighting: if another writer
    // won the race, fold this sighting in instead of failing the unique key.
    .onConflictDoUpdate({
      target: [knowledgeReviewQueue.reviewType, knowledgeReviewQueue.domain, knowledgeReviewQueue.dedupeKey],
      set: {
        occurrenceCount: sql`${knowledgeReviewQueue.occurrenceCount} + 1`,
        lastSeenAt: now,
        updatedAt: now,
      },
    });
}

/**
 * Capture an unresolved VOCABULARY term (the Phase 0 feed). `domain` is the
 * vocabulary kind ("nutrient" | "benefit"). The dedupe key is the GOV2 single
 * normaliser's output, so the same term under any casing/separator dedupes to
 * one row (GOV2 Rule 5).
 */
export async function recordUnresolvedVocabularyTerm(args: {
  domain: string;
  rawTerm: string;
  reason: string;
  source: string;
  context?: KnowledgeReviewContext;
}): Promise<void> {
  const normalised = normaliseVocabularyTerm(args.rawTerm);
  if (!normalised) return; // nothing meaningful to review
  await recordReviewItem({
    reviewType: REVIEW_TYPE_VOCABULARY,
    domain: args.domain,
    dedupeKey: normalised,
    label: args.rawTerm,
    source: args.source,
    details: { normalisedTerm: normalised, rawTerm: args.rawTerm, reason: args.reason },
    context: args.context,
  });
}

export type ReviewSortBy =
  | "lastSeenAt"
  | "firstSeenAt"
  | "occurrenceCount"
  | "label"
  | "priority"
  | "status";

export interface ListReviewQueueParams {
  reviewType?: string;
  domain?: string;
  status?: string;
  source?: string;
  /** KQ1C advanced filters. */
  priority?: string;
  knowledgeOrigin?: string;
  /** When true, only items that carry a suggested canonical match. */
  hasSuggestion?: boolean;
  /** Case-insensitive substring over label + dedupeKey. */
  search?: string;
  sortBy?: ReviewSortBy;
  sortDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/** Build the WHERE clause shared by list + export from the same filter params. */
function buildQueueWhere(params: ListReviewQueueParams) {
  const conds = [];
  if (params.reviewType) conds.push(eq(knowledgeReviewQueue.reviewType, params.reviewType));
  if (params.domain) conds.push(eq(knowledgeReviewQueue.domain, params.domain));
  if (params.status) conds.push(eq(knowledgeReviewQueue.status, params.status));
  if (params.source) conds.push(eq(knowledgeReviewQueue.source, params.source));
  if (params.priority) conds.push(eq(knowledgeReviewQueue.priority, params.priority));
  if (params.knowledgeOrigin) conds.push(eq(knowledgeReviewQueue.knowledgeOrigin, params.knowledgeOrigin));
  if (params.hasSuggestion) {
    conds.push(sql`${knowledgeReviewQueue.suggestedCanonicalSlug} is not null and ${knowledgeReviewQueue.suggestedCanonicalSlug} <> ''`);
  }
  if (params.search && params.search.trim()) {
    const q = `%${params.search.trim()}%`;
    conds.push(or(ilike(knowledgeReviewQueue.label, q), ilike(knowledgeReviewQueue.dedupeKey, q))!);
  }
  return conds.length ? and(...conds) : undefined;
}

/** Read the queue with server-side filter / search / sort (read-only). */
export async function listReviewQueue(
  params: ListReviewQueueParams = {},
): Promise<{ items: KnowledgeReviewQueueItem[]; total: number }> {
  const where = buildQueueWhere(params);
  const dir = (params.sortDir ?? "desc") === "asc" ? asc : desc;

  // Priority is a text enum; sort it by rank (high > medium > low) with NULLs
  // last, not lexically. Everything else sorts on its native column.
  const orderBy = (() => {
    switch (params.sortBy) {
      case "priority":
        return dir(sql`case ${knowledgeReviewQueue.priority}
          when 'high' then 3 when 'medium' then 2 when 'low' then 1 else 0 end`);
      case "status":
        return dir(knowledgeReviewQueue.status);
      case "firstSeenAt":
        return dir(knowledgeReviewQueue.firstSeenAt);
      case "occurrenceCount":
        return dir(knowledgeReviewQueue.occurrenceCount);
      case "label":
        return dir(knowledgeReviewQueue.label);
      case "lastSeenAt":
      default:
        return dir(knowledgeReviewQueue.lastSeenAt);
    }
  })();

  const limit = Math.min(Math.max(params.limit ?? 200, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);

  const items = await db
    .select()
    .from(knowledgeReviewQueue)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeReviewQueue)
    .where(where);

  return { items, total: count };
}

// ── KQ1C — Phase 1: inline & bulk editing of review fields ──────────────────

/** The editable review fields. `undefined` = leave unchanged; `null` = clear. */
export interface ReviewItemPatch {
  priority?: string | null;
  knowledgeOrigin?: string | null;
  reviewNotes?: string | null;
  suggestedCanonicalSlug?: string | null;
  status?: string;
}

/** Normalise + validate a patch into a DB update set. Throws on invalid input. */
function coercePatch(patch: ReviewItemPatch): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  const clean = (v: string | null | undefined): string | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const t = v.trim();
    return t === "" ? null : t;
  };

  if (patch.priority !== undefined) {
    const p = clean(patch.priority);
    if (p !== null && !REVIEW_PRIORITIES.includes(p as ReviewPriority)) {
      throw new Error(`invalid priority "${p}"`);
    }
    set.priority = p;
  }
  if (patch.status !== undefined) {
    if (!EDITABLE_REVIEW_STATUSES.includes(patch.status as EditableReviewStatus)) {
      throw new Error(`status "${patch.status}" is not editable in Phase 1`);
    }
    set.status = patch.status;
  }
  if (patch.knowledgeOrigin !== undefined) set.knowledgeOrigin = clean(patch.knowledgeOrigin);
  if (patch.reviewNotes !== undefined) set.reviewNotes = clean(patch.reviewNotes);
  if (patch.suggestedCanonicalSlug !== undefined) {
    // Stored normalised so it lines up with the resolver's canonical slugs. This
    // is a SUGGESTION only — never applied to the resolver in Phase 1.
    const raw = clean(patch.suggestedCanonicalSlug);
    set.suggestedCanonicalSlug = raw == null ? null : normaliseVocabularyTerm(raw) || null;
  }
  return set;
}

/** Edit the review fields of one queue item. Returns the updated row (or null). */
export async function updateReviewItem(
  id: number,
  patch: ReviewItemPatch,
): Promise<KnowledgeReviewQueueItem | null> {
  const set = coercePatch(patch);
  if (Object.keys(set).length === 0) {
    return (await db.query.knowledgeReviewQueue.findFirst({
      where: eq(knowledgeReviewQueue.id, id),
    })) ?? null;
  }
  set.updatedAt = new Date();
  const [row] = await db
    .update(knowledgeReviewQueue)
    .set(set)
    .where(eq(knowledgeReviewQueue.id, id))
    .returning();
  return row ?? null;
}

/** Apply the same patch to many items. Returns how many rows were updated. */
export async function bulkUpdateReviewItems(
  ids: number[],
  patch: ReviewItemPatch,
): Promise<number> {
  const cleanIds = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
  if (cleanIds.length === 0) return 0;
  const set = coercePatch(patch);
  if (Object.keys(set).length === 0) return 0;
  set.updatedAt = new Date();
  const rows = await db
    .update(knowledgeReviewQueue)
    .set(set)
    .where(inArray(knowledgeReviewQueue.id, cleanIds))
    .returning({ id: knowledgeReviewQueue.id });
  return rows.length;
}

// ── KQ1C — Phase 1: export for external LLM review (JSON + CSV) ──────────────

/** The canonical entity a suggested slug points at, if it is a real one. */
interface CanonicalEntityRef {
  slug: string;
  name: string;
  description: string;
}

// Canonical lookup maps, derived from the single source of truth (NK6F). Used
// only to ENRICH exports with context; never to mint or resolve identity.
const NUTRIENT_BY_SLUG = new Map<string, CanonicalEntityRef>(
  NUTRIENT_SEED.map((n) => [n.slug, { slug: n.slug, name: n.name, description: n.description ?? "" }]),
);
const BENEFIT_BY_SLUG = new Map<string, CanonicalEntityRef>(
  HEALTH_BENEFIT_SEED.map((b) => [b.slug, { slug: b.slug, name: b.name, description: b.description ?? "" }]),
);

function lookupCanonicalEntity(domain: string, slug: string | null): CanonicalEntityRef | null {
  if (!slug) return null;
  if (domain === "nutrient") return NUTRIENT_BY_SLUG.get(slug) ?? null;
  if (domain === "benefit") return BENEFIT_BY_SLUG.get(slug) ?? null;
  return null;
}

/** The decision fields an external reviewer/LLM fills per item (KQ1D round-trip).
 *  Exported as an all-null stub; the reviewer sets `decisionType` and the fields
 *  relevant to it. Excluded from the export checksum so filling it does not
 *  break provenance (the checksum guards only the SOURCE fields THA emitted). */
export interface ReviewDecisionEnvelope {
  /** alias | new_identity | reject | defer — null in the exported stub. */
  decisionType: string | null;
  /** For "alias": the existing canonical slug to bind to. */
  targetCanonicalSlug: string | null;
  /** For "alias": the alt-name string to bind (defaults to the term). */
  aliasString: string | null;
  /** For "new_identity": the proposed hand-off artifact fields. */
  proposedNewSlug: string | null;
  proposedNewName: string | null;
  proposedNewDescription: string | null;
  /** The reviewer's grounding for the decision. */
  rationale: string | null;
  /** low | medium | high. */
  confidence: string | null;
  /** Which reviewer (human/agent identity) produced this decision. KQ1E: shown
   *  next to the model in the Consensus & Comparison workspace. */
  reviewer: string | null;
  /** Which model produced this decision (per-item provenance). */
  reviewerModel: string | null;
  /** Free-text reviewer notes for this decision. */
  reviewerNotes: string | null;
}

/** A single export record — everything an external LLM needs to review a term. */
export interface ReviewExportItem {
  id: number;
  reviewType: string;
  domain: string;
  source: string;
  knowledgeOrigin: string | null;
  label: string;
  normalisedTerm: string;
  status: string;
  priority: string | null;
  occurrenceCount: number;
  contexts: KnowledgeReviewContext[];
  /** Why the resolver rejected the term (from `details.reason`). */
  rejectionReason: string | null;
  /** The reviewer's suggested canonical match (a slug; may be empty). */
  suggestedCanonicalMatch: string | null;
  /** The canonical entity the suggestion points at, when it is a real slug. */
  existingCanonicalEntity: CanonicalEntityRef | null;
  reviewerNotes: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  /** Reviewer-fillable decision stub (excluded from the provenance checksum). */
  decision: ReviewDecisionEnvelope;
}

/** The source fields that make up an item's provenance identity, in the exact
 *  order the checksum hashes them. The reviewer-fillable `decision` is NOT here,
 *  so filling it in never changes the checksum — only tampering with a source
 *  field does. Import re-projects incoming items onto these keys and re-hashes. */
const CHECKSUM_SOURCE_KEYS = [
  "id",
  "reviewType",
  "domain",
  "source",
  "knowledgeOrigin",
  "label",
  "normalisedTerm",
  "status",
  "priority",
  "occurrenceCount",
  "contexts",
  "rejectionReason",
  "suggestedCanonicalMatch",
  "existingCanonicalEntity",
  "reviewerNotes",
  "firstSeenAt",
  "lastSeenAt",
] as const;

/** The empty decision stub written into every exported item. */
function emptyDecision(): ReviewDecisionEnvelope {
  return {
    decisionType: null,
    targetCanonicalSlug: null,
    aliasString: null,
    proposedNewSlug: null,
    proposedNewName: null,
    proposedNewDescription: null,
    rationale: null,
    confidence: null,
    reviewer: null,
    reviewerModel: null,
    reviewerNotes: null,
  };
}

export const EXPORT_SCHEMA_VERSION = "kq1c-phase1-export-1" as const;

export interface ReviewExportPackage {
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  scope: string;
  count: number;
  /** Machine round-trip provenance — sha256 over each item's source fields. */
  checksum: string;
  /** Package-level reviewing model; the reviewer may set this before re-import. */
  reviewerModel: string | null;
  /** How an external LLM should fill each item (a hint, not enforced). */
  instructions: string;
  items: ReviewExportItem[];
}

function toExportItem(row: KnowledgeReviewQueueItem): ReviewExportItem {
  const details = (row.details ?? {}) as Record<string, unknown>;
  const rejectionReason = typeof details.reason === "string" ? details.reason : null;
  const normalisedTerm =
    typeof details.normalisedTerm === "string" ? details.normalisedTerm : row.dedupeKey;
  return {
    id: row.id,
    reviewType: row.reviewType,
    domain: row.domain,
    source: row.source,
    knowledgeOrigin: row.knowledgeOrigin ?? null,
    label: row.label,
    normalisedTerm,
    status: row.status,
    priority: row.priority ?? null,
    occurrenceCount: row.occurrenceCount,
    contexts: row.contexts ?? [],
    rejectionReason,
    suggestedCanonicalMatch: row.suggestedCanonicalSlug ?? null,
    existingCanonicalEntity: lookupCanonicalEntity(row.domain, row.suggestedCanonicalSlug ?? null),
    reviewerNotes: row.reviewNotes ?? null,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    decision: emptyDecision(),
  };
}

/**
 * Deterministic checksum over an item's SOURCE fields (sha256 of the canonical
 * JSON of the `CHECKSUM_SOURCE_KEYS`, in order). Provenance for the import
 * round-trip: a reviewer filling the `decision` stub does not change it, but any
 * edit to a source field does — so import can detect tampering. Projecting onto
 * a fixed key order makes it independent of incoming key ordering. Backward
 * compatible with KQ1C exports (which carried exactly these fields, no decision).
 */
function checksumItems(items: readonly Record<string, unknown>[]): string {
  const projected = items.map((it) => {
    const o: Record<string, unknown> = {};
    for (const k of CHECKSUM_SOURCE_KEYS) o[k] = it[k] ?? null;
    return o;
  });
  return createHash("sha256").update(JSON.stringify(projected)).digest("hex");
}

export type ExportScope = "selected" | "filtered" | "all";

export interface CollectExportParams {
  scope: ExportScope;
  ids?: number[];
  filters?: ListReviewQueueParams;
}

/** Gather the rows an export should contain, per scope. */
async function collectExportRows(params: CollectExportParams): Promise<KnowledgeReviewQueueItem[]> {
  if (params.scope === "selected") {
    const cleanIds = Array.from(new Set((params.ids ?? []).filter((n) => Number.isInteger(n) && n > 0)));
    if (cleanIds.length === 0) return [];
    return db
      .select()
      .from(knowledgeReviewQueue)
      .where(inArray(knowledgeReviewQueue.id, cleanIds))
      .orderBy(asc(knowledgeReviewQueue.id));
  }
  // "filtered" applies the current filters; "all" ignores them entirely.
  const where = params.scope === "filtered" ? buildQueueWhere(params.filters ?? {}) : undefined;
  return db
    .select()
    .from(knowledgeReviewQueue)
    .where(where)
    .orderBy(asc(knowledgeReviewQueue.id));
}

/**
 * Build the export package for external LLM review. `exportedAt` is passed in so
 * the store stays free of ambient clock reads (callers own the timestamp).
 */
export async function buildReviewExport(
  params: CollectExportParams & { exportedAt: string },
): Promise<ReviewExportPackage> {
  const rows = await collectExportRows(params);
  const items = rows.map(toExportItem);
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: params.exportedAt,
    scope: params.scope,
    count: items.length,
    checksum: checksumItems(items as unknown as Record<string, unknown>[]),
    reviewerModel: null,
    instructions:
      "For each item, fill its `decision` object. Set decision.decisionType to one of: " +
      "\"alias\" (a same-thing synonym of an existing canonical identity — set targetCanonicalSlug and " +
      "aliasString), \"new_identity\" (names a real thing with no canonical home — set proposedNewSlug/" +
      "proposedNewName/proposedNewDescription for editorial hand-off), \"reject\" (not a valid knowledge " +
      "term), or \"defer\" (revisit later). Always set decision.rationale. Optionally set decision.confidence " +
      "(low|medium|high), decision.reviewer (your reviewer identity) and decision.reviewerModel. Multiple " +
      "reviewers may each submit a package for the same items — their proposals are compared for consensus. " +
      "Ground every decision in the item's domain, contexts, " +
      "rejectionReason and existingCanonicalEntity description. Do NOT edit any other field — the source " +
      "fields are checksummed and a re-import validates them. Do not invent identities.",
    items,
  };
}

const CSV_COLUMNS = [
  "id",
  "reviewType",
  "domain",
  "source",
  "knowledgeOrigin",
  "label",
  "normalisedTerm",
  "status",
  "priority",
  "occurrenceCount",
  "rejectionReason",
  "suggestedCanonicalMatch",
  "existingCanonicalSlug",
  "existingCanonicalName",
  "existingCanonicalDescription",
  "reviewerNotes",
  "contexts",
  "firstSeenAt",
  "lastSeenAt",
  // Reviewer-fillable decision columns (mirror the JSON `decision` stub). JSON
  // is the source of truth for round-trip import; these are for spreadsheet use.
  "decisionType",
  "decisionTargetCanonicalSlug",
  "decisionAliasString",
  "decisionProposedNewSlug",
  "decisionProposedNewName",
  "decisionProposedNewDescription",
  "decisionRationale",
  "decisionConfidence",
  "decisionReviewer",
  "decisionReviewerModel",
] as const;

function csvCell(value: unknown): string {
  const s =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  // Quote if the cell contains a delimiter, quote, or newline; escape quotes.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialise an export package to CSV (one row per item). */
export function exportToCsv(pkg: ReviewExportPackage): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const it of pkg.items) {
    const row: Record<(typeof CSV_COLUMNS)[number], unknown> = {
      id: it.id,
      reviewType: it.reviewType,
      domain: it.domain,
      source: it.source,
      knowledgeOrigin: it.knowledgeOrigin,
      label: it.label,
      normalisedTerm: it.normalisedTerm,
      status: it.status,
      priority: it.priority,
      occurrenceCount: it.occurrenceCount,
      rejectionReason: it.rejectionReason,
      suggestedCanonicalMatch: it.suggestedCanonicalMatch,
      existingCanonicalSlug: it.existingCanonicalEntity?.slug ?? null,
      existingCanonicalName: it.existingCanonicalEntity?.name ?? null,
      existingCanonicalDescription: it.existingCanonicalEntity?.description ?? null,
      reviewerNotes: it.reviewerNotes,
      contexts: it.contexts,
      firstSeenAt: it.firstSeenAt,
      lastSeenAt: it.lastSeenAt,
      decisionType: it.decision.decisionType,
      decisionTargetCanonicalSlug: it.decision.targetCanonicalSlug,
      decisionAliasString: it.decision.aliasString,
      decisionProposedNewSlug: it.decision.proposedNewSlug,
      decisionProposedNewName: it.decision.proposedNewName,
      decisionProposedNewDescription: it.decision.proposedNewDescription,
      decisionRationale: it.decision.rationale,
      decisionConfidence: it.decision.confidence,
      decisionReviewer: it.decision.reviewer,
      decisionReviewerModel: it.decision.reviewerModel,
    };
    lines.push(CSV_COLUMNS.map((c) => csvCell(row[c])).join(","));
  }
  return lines.join("\r\n");
}

// ════════════════════════════════════════════════════════════════════════════
// KQ1D — Phase 2: Knowledge Review Package import & proposals
// ════════════════════════════════════════════════════════════════════════════
// Import a reviewed Knowledge Review Package (the JSON envelope exported above,
// with each item's `decision` stub filled by an external LLM/reviewer). This is
// a PROPOSAL layer only: it validates provenance, then creates `proposed`
// decision records LINKED to the queue terms they resolve, preserving reviewer
// metadata and the original context. It writes NOTHING to the resolver, mints no
// canonical entity, changes no canonical vocabulary, and does not apply aliases
// or roll anything back (all later phases — KQ1A §10). Approval is a human gate
// that records intent; it too changes no canonical knowledge in Phase 2.

/** The decision types a reviewer may assign. Matches GOV2's two apply outcomes
 *  (alias / new_identity) plus the two terminal non-apply intents. */
export const DECISION_TYPES = ["alias", "new_identity", "reject", "defer"] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

/** Statuses a proposal can hold. `superseded` (KQ1E) marks sibling proposals for
 *  a term that a human resolved by approving a different proposal. Apply/rollback
 *  states are later phases. */
export const DECISION_STATUSES = ["proposed", "approved", "published", "rejected", "superseded", "rolled_back"] as const;

/** Proposal statuses that still count as an ACTIVE opinion for a term (i.e. a
 *  live proposal a human has neither approved, rejected, nor superseded). Only
 *  active proposals participate in consensus. */
export const ACTIVE_DECISION_STATUSES: readonly string[] = ["proposed"];

/**
 * The GOV2-shaped "what is being proposed" fingerprint of a decision — the
 * dimension reviewers must AGREE on for consensus. Two proposals agree iff their
 * signatures are equal. This measures agreement only, never truth (GOV2: the
 * human gate still decides). For alias the identity is the canonical target; for
 * new_identity the proposed new slug; reject/defer are terminal intents.
 */
export function decisionSignature(d: {
  decisionType: string;
  targetCanonicalSlug?: string | null;
  proposedNewSlug?: string | null;
}): string {
  switch (d.decisionType) {
    case "alias":
      return `alias:${d.targetCanonicalSlug ?? ""}`;
    case "new_identity":
      return `new_identity:${d.proposedNewSlug ?? ""}`;
    default:
      return d.decisionType; // reject | defer
  }
}

/** Package schema versions this importer accepts (provenance allow-list). */
export const IMPORTABLE_SCHEMA_VERSIONS: readonly string[] = [EXPORT_SCHEMA_VERSION];

/** A validation failure surfaced to the caller with a clear, actionable reason. */
export class ReviewPackageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewPackageError";
  }
}

/** The minimally-validated shape of an incoming package (post envelope check). */
interface ParsedPackage {
  schemaVersion: string;
  checksum: string;
  exportedAt: string | null;
  reviewerModel: string | null;
  items: Array<Record<string, unknown>>;
}

/**
 * Validate the envelope shape and provenance of an incoming package. Throws a
 * `ReviewPackageError` on any failure (unknown/missing schema version, missing
 * checksum, non-array items, or a checksum that does not match the item source
 * fields — i.e. the file was tampered with). Filling the `decision` stub does
 * not affect the checksum, so a legitimately-reviewed package still validates.
 */
export function validateReviewPackage(raw: unknown): ParsedPackage {
  if (!raw || typeof raw !== "object") {
    throw new ReviewPackageError("Not a Knowledge Review Package (expected a JSON object).");
  }
  const pkg = raw as Record<string, unknown>;
  const schemaVersion = typeof pkg.schemaVersion === "string" ? pkg.schemaVersion : "";
  if (!schemaVersion) {
    throw new ReviewPackageError("Missing schemaVersion — not a Knowledge Review Package.");
  }
  if (!IMPORTABLE_SCHEMA_VERSIONS.includes(schemaVersion)) {
    throw new ReviewPackageError(
      `Unsupported package schemaVersion "${schemaVersion}". Expected one of: ${IMPORTABLE_SCHEMA_VERSIONS.join(", ")}.`,
    );
  }
  const checksum = typeof pkg.checksum === "string" ? pkg.checksum : "";
  if (!checksum) {
    throw new ReviewPackageError("Missing checksum — cannot verify provenance.");
  }
  if (!Array.isArray(pkg.items)) {
    throw new ReviewPackageError("Package `items` must be an array.");
  }
  const items = pkg.items as Array<Record<string, unknown>>;

  // Provenance: recompute the checksum over each item's source fields and
  // compare. A mismatch means a source field was altered (tamper guard).
  const actual = checksumItems(items);
  if (actual !== checksum) {
    throw new ReviewPackageError(
      "Checksum mismatch — the package's source fields were altered after export " +
        "(only the per-item `decision` may be edited). Re-export and review again.",
    );
  }

  return {
    schemaVersion,
    checksum,
    exportedAt: typeof pkg.exportedAt === "string" ? pkg.exportedAt : null,
    reviewerModel: typeof pkg.reviewerModel === "string" ? pkg.reviewerModel : null,
    items,
  };
}

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/** Read the filled `decision` object off a raw import item (tolerant of shape). */
function readItemDecision(item: Record<string, unknown>): Record<string, unknown> {
  const d = item.decision;
  return d && typeof d === "object" ? (d as Record<string, unknown>) : {};
}

export interface ImportPackageResult {
  batchId: number;
  itemCount: number;
  /** Proposals created (linked to a live queue term). */
  created: number;
  /** Items whose term already had an IDENTICAL active proposal (same reviewer +
   *  model + decision) — a duplicate re-import. Distinct reviewers/decisions for
   *  the same term are NOT skipped; they accumulate for consensus (KQ1E). */
  skippedExisting: number;
  /** Items whose referenced queue term no longer exists / does not match. */
  skippedMissingTerm: number;
  /** Items with no decision or an invalid decisionType. */
  skippedInvalid: number;
  warnings: string[];
}

/**
 * Import a validated, reviewed package: create a batch record and one `proposed`
 * decision per item whose decision is set and whose queue term still exists.
 * Idempotent-ish: an item whose term already carries an active (proposed/
 * approved) proposal is skipped. Preserves reviewer metadata and a snapshot of
 * the term's original context. Applies NOTHING to canonical space.
 */
export async function importReviewPackage(args: {
  raw: unknown;
  filename?: string | null;
  userId?: number | null;
  importedAt: string;
}): Promise<ImportPackageResult> {
  const pkg = validateReviewPackage(args.raw);
  const warnings: string[] = [];

  // Create the batch (provenance record) up front so every proposal links to it.
  const [batch] = await db
    .insert(knowledgeReviewBatches)
    .values({
      direction: "import",
      format: "json",
      schemaVersion: pkg.schemaVersion,
      checksum: pkg.checksum,
      exportedAt: pkg.exportedAt ? new Date(pkg.exportedAt) : null,
      reviewerModel: pkg.reviewerModel,
      sourceFilename: args.filename ?? null,
      itemCount: pkg.items.length,
      proposalCount: 0,
      status: "imported",
      createdByUserId: args.userId ?? null,
    })
    .returning();

  let created = 0;
  let skippedExisting = 0;
  let skippedMissingTerm = 0;
  let skippedInvalid = 0;
  const now = new Date();

  for (const item of pkg.items) {
    const termId = Number(item.id);
    const normalisedTerm = asString(item.normalisedTerm) ?? "";
    const decision = readItemDecision(item);
    const decisionType = asString(decision.decisionType);

    if (!decisionType) {
      skippedInvalid++;
      continue; // reviewer left this item undecided — not an error
    }
    if (!DECISION_TYPES.includes(decisionType as DecisionType)) {
      skippedInvalid++;
      warnings.push(`term ${termId}: invalid decisionType "${decisionType}" — skipped`);
      continue;
    }

    // Resolve and validate the linked queue term (the DoD's linkage guarantee).
    const term = Number.isInteger(termId) && termId > 0
      ? await db.query.knowledgeReviewQueue.findFirst({ where: eq(knowledgeReviewQueue.id, termId) })
      : undefined;
    if (!term) {
      skippedMissingTerm++;
      warnings.push(`term ${termId} ("${normalisedTerm}"): queue item not found — skipped`);
      continue;
    }
    if (normalisedTerm && term.dedupeKey !== normalisedTerm) {
      skippedMissingTerm++;
      warnings.push(
        `term ${termId}: normalisedTerm "${normalisedTerm}" no longer matches queue key "${term.dedupeKey}" — skipped`,
      );
      continue;
    }

    // Resolve the proposal's canonical-facing fields first (SUGGESTIONS only —
    // nothing is ever applied). For alias proposals, normalise the slug/alias so
    // they line up with the resolver's canonical space.
    const targetSlugRaw = asString(decision.targetCanonicalSlug);
    const aliasRaw = asString(decision.aliasString);
    const resolvedTargetSlug =
      decisionType === "alias" && targetSlugRaw ? normaliseVocabularyTerm(targetSlugRaw) || null : targetSlugRaw;
    const resolvedNewSlug =
      decisionType === "new_identity"
        ? (asString(decision.proposedNewSlug) ? normaliseVocabularyTerm(asString(decision.proposedNewSlug)!) || null : null)
        : null;
    const reviewer = asString(decision.reviewer);
    const reviewerModel = asString(decision.reviewerModel) ?? pkg.reviewerModel;
    const signature = decisionSignature({
      decisionType,
      targetCanonicalSlug: resolvedTargetSlug,
      proposedNewSlug: resolvedNewSlug,
    });

    // KQ1E — multiple reviewers may each submit a package for the same term; the
    // proposals are COMPARED for consensus. So we no longer skip on "term already
    // has any proposal". Idempotency is now per PROPOSAL: skip only an IDENTICAL
    // active proposal (same reviewer + model + decision signature) so re-importing
    // the same file is still a no-op, but a different reviewer's or a different
    // decision for the same term accumulates as a distinct opinion.
    const siblings = await db
      .select()
      .from(knowledgeReviewDecisions)
      .where(
        and(
          eq(knowledgeReviewDecisions.termId, term.id),
          inArray(knowledgeReviewDecisions.status, ["proposed", "approved"]),
        ),
      );
    const duplicate = siblings.some(
      (s) =>
        (s.reviewer ?? null) === reviewer &&
        (s.reviewerModel ?? null) === reviewerModel &&
        decisionSignature(s) === signature,
    );
    if (duplicate) {
      skippedExisting++;
      warnings.push(
        `term ${term.id} ("${term.dedupeKey}"): an identical active proposal from this reviewer already exists — skipped`,
      );
      continue;
    }

    // Preserve the term's original context so the proposal stays interpretable.
    const details = (term.details ?? {}) as Record<string, unknown>;
    const originalContext = {
      label: term.label,
      normalisedTerm: term.dedupeKey,
      domain: term.domain,
      reviewType: term.reviewType,
      source: term.source,
      knowledgeOrigin: term.knowledgeOrigin ?? null,
      occurrenceCount: term.occurrenceCount,
      rejectionReason: typeof details.reason === "string" ? details.reason : null,
      contexts: term.contexts ?? [],
      suggestedCanonicalSlug: term.suggestedCanonicalSlug ?? null,
    };

    await db.insert(knowledgeReviewDecisions).values({
      batchId: batch.id,
      termId: term.id,
      reviewType: term.reviewType,
      domain: term.domain,
      decisionType,
      targetCanonicalSlug: resolvedTargetSlug,
      aliasString:
        decisionType === "alias"
          ? (aliasRaw ? normaliseVocabularyTerm(aliasRaw) || null : term.dedupeKey)
          : aliasRaw,
      proposedNewSlug: resolvedNewSlug,
      proposedNewName: decisionType === "new_identity" ? asString(decision.proposedNewName) : null,
      proposedNewDescription: decisionType === "new_identity" ? asString(decision.proposedNewDescription) : null,
      rationale: asString(decision.rationale),
      confidence: asString(decision.confidence),
      reviewer,
      reviewerModel,
      reviewerNotes: asString(decision.reviewerNotes),
      originalContext,
      status: "proposed",
    });

    // Reflect the proposal on the queue term (proposal-layer state — NOT
    // canonical). Never DOWNGRADE a term a human has already approved; otherwise
    // the term now has a decision awaiting a human gate/consensus.
    if (term.status !== "approved") {
      await db
        .update(knowledgeReviewQueue)
        .set({ status: "proposed", updatedAt: now })
        .where(eq(knowledgeReviewQueue.id, term.id));
    }

    created++;
  }

  await db
    .update(knowledgeReviewBatches)
    .set({ proposalCount: created })
    .where(eq(knowledgeReviewBatches.id, batch.id));

  return {
    batchId: batch.id,
    itemCount: pkg.items.length,
    created,
    skippedExisting,
    skippedMissingTerm,
    skippedInvalid,
    warnings,
  };
}

// ── Proposal read + human-gate approve/reject ───────────────────────────────

/** List import batches, newest first. */
export async function listImportBatches(): Promise<KnowledgeReviewBatch[]> {
  return db
    .select()
    .from(knowledgeReviewBatches)
    .orderBy(desc(knowledgeReviewBatches.createdAt));
}

/** A proposal enriched with the current state of its linked queue term. */
export interface DecisionWithTerm extends KnowledgeReviewDecision {
  term: {
    id: number;
    label: string;
    domain: string;
    dedupeKey: string;
    status: string;
  } | null;
}

async function attachTerms(decisions: KnowledgeReviewDecision[]): Promise<DecisionWithTerm[]> {
  const termIds = Array.from(new Set(decisions.map((d) => d.termId)));
  const terms = termIds.length
    ? await db.select().from(knowledgeReviewQueue).where(inArray(knowledgeReviewQueue.id, termIds))
    : [];
  const byId = new Map(terms.map((t) => [t.id, t]));
  return decisions.map((d) => {
    const t = byId.get(d.termId);
    return {
      ...d,
      term: t ? { id: t.id, label: t.label, domain: t.domain, dedupeKey: t.dedupeKey, status: t.status } : null,
    };
  });
}

/** List proposals, optionally filtered by batch and/or status. Newest first. */
export async function listDecisions(params: { batchId?: number; status?: string } = {}): Promise<DecisionWithTerm[]> {
  const conds = [];
  if (params.batchId) conds.push(eq(knowledgeReviewDecisions.batchId, params.batchId));
  if (params.status) conds.push(eq(knowledgeReviewDecisions.status, params.status));
  const rows = await db
    .select()
    .from(knowledgeReviewDecisions)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(knowledgeReviewDecisions.createdAt));
  return attachTerms(rows);
}

/** A batch plus its proposals (for the batch-detail view). */
export async function getBatchDetail(
  batchId: number,
): Promise<{ batch: KnowledgeReviewBatch; decisions: DecisionWithTerm[] } | null> {
  const batch = await db.query.knowledgeReviewBatches.findFirst({
    where: eq(knowledgeReviewBatches.id, batchId),
  });
  if (!batch) return null;
  const decisions = await listDecisions({ batchId });
  return { batch, decisions };
}

/**
 * Approve a proposal (human gate). Records intent ONLY — it does not apply the
 * alias, mint an entity, or touch the resolver/canonical vocabulary (apply is
 * Phase 3). A proposal must be `proposed` to be approved.
 */
export async function approveDecision(id: number, userId: number | null): Promise<KnowledgeReviewDecision> {
  const decision = await db.query.knowledgeReviewDecisions.findFirst({
    where: eq(knowledgeReviewDecisions.id, id),
  });
  if (!decision) throw new ReviewPackageError("Proposal not found.");
  if (decision.status !== "proposed") {
    throw new ReviewPackageError(`Proposal is "${decision.status}" — only a proposed decision can be approved.`);
  }
  const now = new Date();
  const [row] = await db
    .update(knowledgeReviewDecisions)
    .set({ status: "approved", approvedByUserId: userId, approvedAt: now, updatedAt: now })
    .where(eq(knowledgeReviewDecisions.id, id))
    .returning();

  // KQ1E — a term may carry several competing proposals (multi-reviewer
  // consensus). Approving ONE resolves the term, so mark the remaining active
  // (proposed) siblings `superseded` — they lose their vote but stay on record
  // for audit/history. This is still a proposal-layer state change only; no
  // canonical write, no alias applied.
  await db
    .update(knowledgeReviewDecisions)
    .set({ status: "superseded", updatedAt: now })
    .where(
      and(
        eq(knowledgeReviewDecisions.termId, decision.termId),
        eq(knowledgeReviewDecisions.status, "proposed"),
        ne(knowledgeReviewDecisions.id, id),
      ),
    );

  // Reflect approval on the queue term (proposal-layer state only).
  await db
    .update(knowledgeReviewQueue)
    .set({ status: "approved", updatedAt: now })
    .where(eq(knowledgeReviewQueue.id, decision.termId));
  return row;
}

/**
 * Reject a proposal (human gate). Records intent ONLY — no canonical change. If
 * the term has no remaining active proposal afterward, revert it to `in_review`
 * so it returns to the triage worklist.
 */
export async function rejectDecision(id: number, userId: number | null): Promise<KnowledgeReviewDecision> {
  const decision = await db.query.knowledgeReviewDecisions.findFirst({
    where: eq(knowledgeReviewDecisions.id, id),
  });
  if (!decision) throw new ReviewPackageError("Proposal not found.");
  if (decision.status === "rejected") return decision;
  const now = new Date();
  const [row] = await db
    .update(knowledgeReviewDecisions)
    .set({ status: "rejected", rejectedAt: now, approvedByUserId: userId, updatedAt: now })
    .where(eq(knowledgeReviewDecisions.id, id))
    .returning();

  // If nothing active remains for this term, return it to the triage worklist.
  const stillActive = await db.query.knowledgeReviewDecisions.findFirst({
    where: and(
      eq(knowledgeReviewDecisions.termId, decision.termId),
      inArray(knowledgeReviewDecisions.status, ["proposed", "approved"]),
    ),
  });
  if (!stillActive) {
    await db
      .update(knowledgeReviewQueue)
      .set({ status: "in_review", updatedAt: now })
      .where(eq(knowledgeReviewQueue.id, decision.termId));
  }
  return row;
}

// ════════════════════════════════════════════════════════════════════════════
// KQ1E — Phase 3: Consensus & Comparison
// ════════════════════════════════════════════════════════════════════════════
// Group the proposal-layer decisions BY review item so a human can compare every
// reviewer/model's proposal for the same term before approving. "Consensus" here
// measures AGREEMENT ONLY, never truth (GOV2: the human gate is still the only
// thing that resolves a term, and even approval applies nothing to canonical
// space in this phase — no alias applied, no vocabulary/entity changed, no
// resolver write, no rollback). This module only READS + classifies.

/** The consensus classification of one review item over its proposals. */
export type ConsensusState =
  | "awaiting_review" // an open term with no active proposal yet
  | "awaiting_consensus" // exactly one active proposal — a single, un-corroborated opinion
  | "conflict" // ≥2 active proposals that DISAGREE on the decision
  | "consensus" // ≥2 active proposals that AGREE — ready for the human approval gate
  | "approved" // a human already approved a proposal for this term
  | "inactive"; // a deferred/dismissed term with no active proposal (not in any tile)

/** One proposal, projected for side-by-side comparison in the workspace. */
export interface ConsensusProposal {
  id: number;
  batchId: number;
  decisionType: string;
  targetCanonicalSlug: string | null;
  aliasString: string | null;
  proposedNewSlug: string | null;
  proposedNewName: string | null;
  proposedNewDescription: string | null;
  rationale: string | null;
  confidence: string | null;
  reviewer: string | null;
  reviewerModel: string | null;
  reviewerNotes: string | null;
  status: string;
  /** The agreement fingerprint (what reviewers must match to agree). */
  signature: string;
  createdAt: string;
}

/** A single distinct proposed decision + how many active proposals back it. */
export interface ConsensusOption {
  signature: string;
  count: number;
  /** A representative proposal for this option (for display of the target). */
  sample: ConsensusProposal;
}

/** All proposals for one review item, grouped with a computed consensus verdict. */
export interface ConsensusGroup {
  term: {
    id: number;
    label: string;
    domain: string;
    dedupeKey: string;
    status: string;
    reviewType: string;
  };
  state: ConsensusState;
  totalProposals: number;
  activeCount: number;
  /** Distinct proposed decisions among the ACTIVE proposals (the "vote spread").
   *  Sorted by descending support. Length > 1 ⇒ conflict. */
  options: ConsensusOption[];
  agreement: {
    /** True when all active proposals share one decision (and there is ≥1). */
    agreed: boolean;
    /** The decision the plurality of active proposals back (null if none active). */
    majoritySignature: string | null;
    majorityCount: number;
    /** majorityCount / activeCount (0 when no active proposals). */
    ratio: number;
    /** Distinct reviewer identities (reviewer + model) among active proposals. */
    reviewerCount: number;
  };
  proposals: ConsensusProposal[];
}

export interface ConsensusDashboard {
  counts: {
    awaitingReview: number;
    awaitingConsensus: number;
    conflicting: number;
    awaitingApproval: number;
    approved: number;
    totalTerms: number;
    totalProposals: number;
  };
  groups: ConsensusGroup[];
}

function toConsensusProposal(d: KnowledgeReviewDecision): ConsensusProposal {
  return {
    id: d.id,
    batchId: d.batchId,
    decisionType: d.decisionType,
    targetCanonicalSlug: d.targetCanonicalSlug ?? null,
    aliasString: d.aliasString ?? null,
    proposedNewSlug: d.proposedNewSlug ?? null,
    proposedNewName: d.proposedNewName ?? null,
    proposedNewDescription: d.proposedNewDescription ?? null,
    rationale: d.rationale ?? null,
    confidence: d.confidence ?? null,
    reviewer: d.reviewer ?? null,
    reviewerModel: d.reviewerModel ?? null,
    reviewerNotes: d.reviewerNotes ?? null,
    status: d.status,
    signature: decisionSignature(d),
    createdAt: d.createdAt.toISOString(),
  };
}

/** Rank used to sort groups so the human's attention lands on conflicts first. */
const STATE_RANK: Record<ConsensusState, number> = {
  conflict: 0,
  consensus: 1,
  awaiting_consensus: 2,
  awaiting_review: 3,
  approved: 4,
  inactive: 5,
};

/**
 * Classify one review item and build its comparison group from its proposals.
 * Consensus is computed over ACTIVE (proposed) proposals only; approved/rejected/
 * superseded proposals are retained for history but do not vote.
 */
function buildConsensusGroup(
  term: KnowledgeReviewQueueItem,
  decisions: KnowledgeReviewDecision[],
): ConsensusGroup {
  const proposals = decisions
    .map(toConsensusProposal)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const active = proposals.filter((p) => ACTIVE_DECISION_STATUSES.includes(p.status));
  const hasApproved = proposals.some((p) => p.status === "approved");

  // Tally the distinct proposed decisions among the active proposals.
  const bySig = new Map<string, ConsensusProposal[]>();
  for (const p of active) {
    const list = bySig.get(p.signature) ?? [];
    list.push(p);
    bySig.set(p.signature, list);
  }
  const options: ConsensusOption[] = Array.from(bySig.entries())
    .map(([signature, list]) => ({ signature, count: list.length, sample: list[0] }))
    .sort((a, b) => b.count - a.count || a.signature.localeCompare(b.signature));

  const majority = options[0] ?? null;
  const reviewerCount = new Set(
    active.map((p) => `${p.reviewer ?? ""}|${p.reviewerModel ?? ""}`),
  ).size;

  let state: ConsensusState;
  if (hasApproved) {
    state = "approved";
  } else if (active.length === 0) {
    state =
      term.status === "unresolved" || term.status === "in_review"
        ? "awaiting_review"
        : "inactive";
  } else if (options.length > 1) {
    state = "conflict";
  } else if (active.length >= 2) {
    state = "consensus";
  } else {
    state = "awaiting_consensus";
  }

  return {
    term: {
      id: term.id,
      label: term.label,
      domain: term.domain,
      dedupeKey: term.dedupeKey,
      status: term.status,
      reviewType: term.reviewType,
    },
    state,
    totalProposals: proposals.length,
    activeCount: active.length,
    options,
    agreement: {
      agreed: active.length >= 1 && options.length === 1,
      majoritySignature: majority?.signature ?? null,
      majorityCount: majority?.count ?? 0,
      ratio: active.length ? (majority?.count ?? 0) / active.length : 0,
      reviewerCount,
    },
    proposals,
  };
}

/**
 * Build the Consensus & Comparison dashboard: the four backlog counts (Awaiting
 * Review / Awaiting Consensus / Conflicting Reviews / Awaiting Approval) plus the
 * per-term comparison groups (every term that has at least one proposal). Pure
 * read — nothing is mutated, and nothing is ever applied to canonical space.
 */
export async function getConsensusDashboard(): Promise<ConsensusDashboard> {
  const [terms, decisions] = await Promise.all([
    db.select().from(knowledgeReviewQueue),
    db.select().from(knowledgeReviewDecisions),
  ]);

  const byTerm = new Map<number, KnowledgeReviewDecision[]>();
  for (const d of decisions) {
    const list = byTerm.get(d.termId) ?? [];
    list.push(d);
    byTerm.set(d.termId, list);
  }

  const counts = {
    awaitingReview: 0,
    awaitingConsensus: 0,
    conflicting: 0,
    awaitingApproval: 0,
    approved: 0,
    totalTerms: terms.length,
    totalProposals: decisions.length,
  };

  const groups: ConsensusGroup[] = [];
  for (const term of terms) {
    const termDecisions = byTerm.get(term.id) ?? [];
    const group = buildConsensusGroup(term, termDecisions);
    switch (group.state) {
      case "awaiting_review": counts.awaitingReview++; break;
      case "awaiting_consensus": counts.awaitingConsensus++; break;
      case "conflict": counts.conflicting++; break;
      case "consensus": counts.awaitingApproval++; break;
      case "approved": counts.approved++; break;
    }
    // Only terms that actually carry proposals are comparison groups; a term with
    // no proposals is just backlog reflected in the Awaiting Review count.
    if (termDecisions.length > 0) groups.push(group);
  }

  groups.sort(
    (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.term.id - b.term.id,
  );

  return { counts, groups };
}

// ════════════════════════════════════════════════════════════════════════════
// KQ1F — Phase 4: Publish, Release Notes, Rollback & Knowledge Health
// ════════════════════════════════════════════════════════════════════════════
// PUBLISH is the final governed workflow and the ONLY operation that changes
// canonical knowledge. It changes it through exactly ONE mechanism — writing an
// approved `alias` decision to the governed alias overlay the single GOV2
// resolver reads (GOV2 Rule 3: an alias is content, not a new identity). It NEVER
// mints a canonical entity: `new_identity` decisions become hand-off artifacts
// for the TypeScript vocabulary owner (NK6F). Every publish is atomic-ish over
// its decisions, auto-creates a Knowledge Release + a rollback point, and appends
// append-only audit rows. Only `approved` proposals are eligible.

const KIND_TO_CANONICAL: Record<string, ReadonlySet<string>> = {
  nutrient: CANONICAL_NUTRIENT_SLUGS,
  benefit: CANONICAL_BENEFIT_SLUGS,
};

/**
 * Load the governed alias overlay from the DB into the single resolver. Reads
 * every ACTIVE `knowledge_vocabulary_aliases` row, groups by kind, and installs
 * it via `setVocabularyOverlay` (which re-applies the anti-fork guard). Called at
 * server boot and after every publish/rollback so published aliases resolve
 * through THE resolver. Returns the install result (including any rejected rows —
 * which would indicate a canonical slug was removed from the seed under a live
 * alias, a governance error worth logging).
 */
export async function loadVocabularyOverlayFromDb(): Promise<{
  nutrient: number;
  benefit: number;
  rejected: Array<{ kind: string; alias: string; target: string }>;
}> {
  const rows = await db
    .select()
    .from(knowledgeVocabularyAliases)
    .where(eq(knowledgeVocabularyAliases.isActive, true));
  const nutrient: Record<string, string> = {};
  const benefit: Record<string, string> = {};
  for (const r of rows) {
    if (r.kind === "nutrient") nutrient[r.aliasNormalised] = r.canonicalSlug;
    else if (r.kind === "benefit") benefit[r.aliasNormalised] = r.canonicalSlug;
  }
  const result = setVocabularyOverlay({ nutrient, benefit });
  if (result.rejected.length) {
    console.warn("[KnowledgeReview] overlay load rejected non-canonical targets:", result.rejected);
  }
  return result;
}

/** Append an append-only audit row (best-effort; never throws to the caller). */
async function recordAudit(entry: {
  entity: string;
  entityId?: number | null;
  action: string;
  actorKind?: "human" | "llm" | "system";
  actorUserId?: number | null;
  releaseId?: number | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  detail?: string | null;
}): Promise<void> {
  try {
    await db.insert(knowledgeReviewAudit).values({
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      action: entry.action,
      actorKind: entry.actorKind ?? "human",
      actorUserId: entry.actorUserId ?? null,
      releaseId: entry.releaseId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      detail: entry.detail ?? null,
    });
  } catch (err) {
    console.error("[KnowledgeReview] audit write failed:", err);
  }
}

export interface PublishResult {
  releaseId: number;
  rollbackId: number;
  aliasesPublished: number;
  newEntities: number;
  updatedEntities: number;
  rejectedProposals: number;
  deferredProposals: number;
  linkedProposalIds: number[];
  linkedBatchIds: number[];
  /** Hand-off artifacts emitted for new-identity decisions (never auto-minted). */
  handoffs: Array<{ decisionId: number; domain: string | null; slug: string | null; name: string | null; description: string | null }>;
  warnings: string[];
}

/**
 * Publish approved proposals. This is the ONLY canonical-knowledge write in the
 * whole Workbench. Processes every eligible `approved` decision (all of them, or
 * the given `decisionIds`):
 *   • alias        → governed overlay row (anti-fork validated) — the canonical change
 *   • new_identity → hand-off artifact (audited; NEVER auto-minted)
 *   • reject       → term marked rejected
 *   • defer        → term marked deferred
 * Auto-creates a Knowledge Release (who approved/published + the change counts +
 * links) and a rollback point (deterministic reverse snapshot), appends audit
 * rows, then reloads the resolver overlay so published aliases resolve at once.
 */
export async function publishApprovedDecisions(args: {
  decisionIds?: number[];
  userId: number | null;
  notes?: string | null;
  publishedAt: Date;
}): Promise<PublishResult> {
  const warnings: string[] = [];

  // 1. Gather eligible approved decisions.
  const idFilter = args.decisionIds && args.decisionIds.length
    ? inArray(knowledgeReviewDecisions.id, Array.from(new Set(args.decisionIds.filter((n) => Number.isInteger(n) && n > 0))))
    : undefined;
  const approved = await db
    .select()
    .from(knowledgeReviewDecisions)
    .where(idFilter ? and(eq(knowledgeReviewDecisions.status, "approved"), idFilter) : eq(knowledgeReviewDecisions.status, "approved"))
    .orderBy(asc(knowledgeReviewDecisions.id));

  if (approved.length === 0) {
    throw new ReviewPackageError("No approved proposals to publish. Approve proposals on the consensus gate first.");
  }

  const now = args.publishedAt;

  // 2. Create the release shell up front so overlay rows + audit can link to it.
  const approverIds = Array.from(
    new Set(approved.map((d) => d.approvedByUserId).filter((n): n is number => typeof n === "number")),
  );
  const linkedBatchIds = Array.from(new Set(approved.map((d) => d.batchId)));
  const [release] = await db
    .insert(knowledgeReleases)
    .values({
      publishedAt: now,
      approvedByUserId: approverIds.length === 1 ? approverIds[0] : null,
      approvedByUserIds: approverIds,
      publishedByUserId: args.userId ?? null,
      linkedBatchIds,
      linkedProposalIds: approved.map((d) => d.id),
      notes: args.notes ?? null,
      status: "published",
    })
    .returning();

  // 3. Process each decision by type, capturing a reverse snapshot as we go.
  const aliasRowIds: number[] = [];
  const decisionSnap: Array<{ id: number; prevStatus: string }> = [];
  const termSnap: Array<{ id: number; prevStatus: string }> = [];
  const updatedTargets = new Set<string>();
  const handoffs: PublishResult["handoffs"] = [];
  let aliasesPublished = 0;
  let newEntities = 0;
  let rejectedProposals = 0;
  let deferredProposals = 0;

  // Track prior term status once per term (a term may have several decisions, but
  // only one is approved at a time, so this is safe).
  const termPrev = new Map<number, string>();
  const rememberTerm = async (termId: number) => {
    if (termPrev.has(termId)) return;
    const t = await db.query.knowledgeReviewQueue.findFirst({ where: eq(knowledgeReviewQueue.id, termId) });
    const prev = t?.status ?? "approved";
    termPrev.set(termId, prev);
    termSnap.push({ id: termId, prevStatus: prev });
  };

  for (const d of approved) {
    decisionSnap.push({ id: d.id, prevStatus: d.status });
    await rememberTerm(d.termId);

    if (d.decisionType === "alias") {
      const kind = d.domain ?? "";
      const canonical = KIND_TO_CANONICAL[kind];
      const target = d.targetCanonicalSlug ? normaliseVocabularyTerm(d.targetCanonicalSlug) : "";
      // aliasString was normalised at import; re-normalise defensively (idempotent).
      const key = normaliseVocabularyTerm(d.aliasString ?? "");
      if (!canonical) {
        warnings.push(`decision ${d.id}: alias domain "${kind}" is not a governed vocabulary — skipped`);
        continue;
      }
      if (!target || !canonical.has(target)) {
        // Anti-fork: never publish an alias to a non-canonical target.
        warnings.push(`decision ${d.id}: alias target "${d.targetCanonicalSlug}" is not a canonical ${kind} slug — skipped`);
        continue;
      }
      if (!key) {
        warnings.push(`decision ${d.id}: alias has no alias string — skipped`);
        continue;
      }
      // GOV2 many-to-one: one alias string → exactly one identity. Reconcile with
      // any existing ACTIVE overlay row for this (kind, key).
      const existing = await db
        .select()
        .from(knowledgeVocabularyAliases)
        .where(and(
          eq(knowledgeVocabularyAliases.kind, kind),
          eq(knowledgeVocabularyAliases.aliasNormalised, key),
          eq(knowledgeVocabularyAliases.isActive, true),
        ));
      if (existing.length) {
        if (existing[0].canonicalSlug === target) {
          warnings.push(`decision ${d.id}: alias "${key}" → "${target}" already published — skipped (idempotent)`);
        } else {
          warnings.push(`decision ${d.id}: alias "${key}" already resolves to "${existing[0].canonicalSlug}" (conflict with "${target}") — skipped`);
        }
      } else {
        const [row] = await db
          .insert(knowledgeVocabularyAliases)
          .values({ kind, aliasNormalised: key, canonicalSlug: target, decisionId: d.id, releaseId: release.id, isActive: true })
          .returning();
        aliasRowIds.push(row.id);
        aliasesPublished++;
        updatedTargets.add(`${kind}:${target}`);
        await recordAudit({ entity: "alias", entityId: row.id, action: "published", actorUserId: args.userId, releaseId: release.id, after: { kind, alias: key, canonicalSlug: target, decisionId: d.id } });
      }
      // Mark decision published + term published.
      await db.update(knowledgeReviewDecisions).set({ status: "published", updatedAt: now }).where(eq(knowledgeReviewDecisions.id, d.id));
      await db.update(knowledgeReviewQueue).set({ status: "published", updatedAt: now }).where(eq(knowledgeReviewQueue.id, d.termId));
      await recordAudit({ entity: "decision", entityId: d.id, action: "published", actorUserId: args.userId, releaseId: release.id, before: { status: "approved" }, after: { status: "published" } });
    } else if (d.decisionType === "new_identity") {
      // Hand-off artifact ONLY — the Workbench never mints a canonical entity.
      newEntities++;
      handoffs.push({ decisionId: d.id, domain: d.domain, slug: d.proposedNewSlug, name: d.proposedNewName, description: d.proposedNewDescription });
      await db.update(knowledgeReviewDecisions).set({ status: "published", updatedAt: now }).where(eq(knowledgeReviewDecisions.id, d.id));
      await db.update(knowledgeReviewQueue).set({ status: "handed_off", updatedAt: now }).where(eq(knowledgeReviewQueue.id, d.termId));
      await recordAudit({ entity: "decision", entityId: d.id, action: "handed_off", actorUserId: args.userId, releaseId: release.id, after: { domain: d.domain, proposedNewSlug: d.proposedNewSlug, proposedNewName: d.proposedNewName, proposedNewDescription: d.proposedNewDescription } });
    } else if (d.decisionType === "reject") {
      rejectedProposals++;
      await db.update(knowledgeReviewDecisions).set({ status: "published", updatedAt: now }).where(eq(knowledgeReviewDecisions.id, d.id));
      await db.update(knowledgeReviewQueue).set({ status: "rejected", updatedAt: now }).where(eq(knowledgeReviewQueue.id, d.termId));
      await recordAudit({ entity: "decision", entityId: d.id, action: "rejected", actorUserId: args.userId, releaseId: release.id, after: { status: "rejected" } });
    } else if (d.decisionType === "defer") {
      deferredProposals++;
      await db.update(knowledgeReviewDecisions).set({ status: "published", updatedAt: now }).where(eq(knowledgeReviewDecisions.id, d.id));
      await db.update(knowledgeReviewQueue).set({ status: "deferred", updatedAt: now }).where(eq(knowledgeReviewQueue.id, d.termId));
      await recordAudit({ entity: "decision", entityId: d.id, action: "deferred", actorUserId: args.userId, releaseId: release.id, after: { status: "deferred" } });
    } else {
      warnings.push(`decision ${d.id}: unknown decisionType "${d.decisionType}" — skipped`);
    }
  }

  // 4. Create the rollback point with the deterministic reverse snapshot.
  const [rollback] = await db
    .insert(knowledgeRollbackPoints)
    .values({
      releaseId: release.id,
      snapshot: { aliasRowIds, decisions: decisionSnap, terms: termSnap, handoffCount: newEntities },
      status: "active",
    })
    .returning();

  const updatedEntities = updatedTargets.size;

  // 5. Finalise the release with counts + the rollback link.
  const [finalRelease] = await db
    .update(knowledgeReleases)
    .set({
      aliasesPublished,
      newEntities,
      updatedEntities,
      rejectedProposals,
      deferredProposals,
      rollbackId: rollback.id,
    })
    .where(eq(knowledgeReleases.id, release.id))
    .returning();

  await recordAudit({
    entity: "release",
    entityId: release.id,
    action: "published",
    actorUserId: args.userId,
    releaseId: release.id,
    after: { aliasesPublished, newEntities, updatedEntities, rejectedProposals, deferredProposals, linkedProposalIds: approved.map((d) => d.id) },
    detail: args.notes ?? null,
  });

  // 6. Reload the resolver overlay so published aliases resolve immediately.
  await loadVocabularyOverlayFromDb();

  return {
    releaseId: finalRelease.id,
    rollbackId: rollback.id,
    aliasesPublished,
    newEntities,
    updatedEntities,
    rejectedProposals,
    deferredProposals,
    linkedProposalIds: finalRelease.linkedProposalIds,
    linkedBatchIds: finalRelease.linkedBatchIds,
    handoffs,
    warnings,
  };
}

// ── Releases (read) ──────────────────────────────────────────────────────────

export interface ReleaseView extends KnowledgeRelease {
  approvedByUsername: string | null;
  publishedByUsername: string | null;
  rolledBackByUsername: string | null;
}

async function usernamesFor(ids: Array<number | null | undefined>): Promise<Map<number, string>> {
  const clean = Array.from(new Set(ids.filter((n): n is number => typeof n === "number")));
  if (!clean.length) return new Map();
  const rows = await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, clean));
  return new Map(rows.map((r) => [r.id, r.username]));
}

function toReleaseView(r: KnowledgeRelease, names: Map<number, string>): ReleaseView {
  return {
    ...r,
    approvedByUsername: r.approvedByUserId != null ? names.get(r.approvedByUserId) ?? null : null,
    publishedByUsername: r.publishedByUserId != null ? names.get(r.publishedByUserId) ?? null : null,
    rolledBackByUsername: r.rolledBackByUserId != null ? names.get(r.rolledBackByUserId) ?? null : null,
  };
}

/** List Knowledge Releases, newest first, with resolved usernames. */
export async function listReleases(): Promise<ReleaseView[]> {
  const rows = await db.select().from(knowledgeReleases).orderBy(desc(knowledgeReleases.publishedAt));
  const names = await usernamesFor(rows.flatMap((r) => [r.approvedByUserId, r.publishedByUserId, r.rolledBackByUserId]));
  return rows.map((r) => toReleaseView(r, names));
}

export interface ReleaseDetail extends ReleaseView {
  aliases: KnowledgeVocabularyAlias[];
  proposals: DecisionWithTerm[];
  audit: Array<{ id: number; entity: string; entityId: number | null; action: string; actorKind: string; detail: string | null; createdAt: string }>;
}

/** One release with its published aliases, linked proposals, and audit trail. */
export async function getReleaseDetail(id: number): Promise<ReleaseDetail | null> {
  const release = await db.query.knowledgeReleases.findFirst({ where: eq(knowledgeReleases.id, id) });
  if (!release) return null;
  const names = await usernamesFor([release.approvedByUserId, release.publishedByUserId, release.rolledBackByUserId]);
  const aliases = await db.select().from(knowledgeVocabularyAliases).where(eq(knowledgeVocabularyAliases.releaseId, id));
  const proposalIds = release.linkedProposalIds ?? [];
  const decisionRows = proposalIds.length
    ? await db.select().from(knowledgeReviewDecisions).where(inArray(knowledgeReviewDecisions.id, proposalIds))
    : [];
  const proposals = await attachTerms(decisionRows);
  const auditRows = await db
    .select()
    .from(knowledgeReviewAudit)
    .where(eq(knowledgeReviewAudit.releaseId, id))
    .orderBy(asc(knowledgeReviewAudit.id));
  return {
    ...toReleaseView(release, names),
    aliases,
    proposals,
    audit: auditRows.map((a) => ({
      id: a.id, entity: a.entity, entityId: a.entityId, action: a.action,
      actorKind: a.actorKind, detail: a.detail, createdAt: a.createdAt.toISOString(),
    })),
  };
}

/**
 * Roll a published release back. Non-destructive and exact: deactivates the
 * overlay rows it created (resolution reverts to pre-release behaviour), returns
 * each published decision to `approved` and each term to its snapshotted prior
 * status, marks the release `rolled_back` + the rollback point `consumed`, audits
 * every reversal, and reloads the resolver overlay. New-identity hand-offs are
 * NOT auto-unwound (they were never applied to canonical space by the Workbench).
 */
export async function rollbackRelease(releaseId: number, userId: number | null, rolledBackAt: Date): Promise<{
  releaseId: number;
  aliasesDeactivated: number;
  decisionsReverted: number;
  termsReverted: number;
}> {
  const release = await db.query.knowledgeReleases.findFirst({ where: eq(knowledgeReleases.id, releaseId) });
  if (!release) throw new ReviewPackageError("Release not found.");
  if (release.status === "rolled_back") throw new ReviewPackageError("Release is already rolled back.");
  const rollback = release.rollbackId
    ? await db.query.knowledgeRollbackPoints.findFirst({ where: eq(knowledgeRollbackPoints.id, release.rollbackId) })
    : null;
  const snap = (rollback?.snapshot ?? {}) as {
    aliasRowIds?: number[];
    decisions?: Array<{ id: number; prevStatus: string }>;
    terms?: Array<{ id: number; prevStatus: string }>;
  };

  // 1. Deactivate the overlay rows this release created.
  const aliasIds = snap.aliasRowIds ?? [];
  let aliasesDeactivated = 0;
  if (aliasIds.length) {
    const rows = await db
      .update(knowledgeVocabularyAliases)
      .set({ isActive: false, deactivatedAt: rolledBackAt })
      .where(and(inArray(knowledgeVocabularyAliases.id, aliasIds), eq(knowledgeVocabularyAliases.isActive, true)))
      .returning({ id: knowledgeVocabularyAliases.id });
    aliasesDeactivated = rows.length;
    for (const r of rows) {
      await recordAudit({ entity: "alias", entityId: r.id, action: "rolled_back", actorUserId: userId, releaseId });
    }
  }

  // 2. Revert decisions published → approved (re-publishable).
  let decisionsReverted = 0;
  for (const d of snap.decisions ?? []) {
    const rows = await db
      .update(knowledgeReviewDecisions)
      .set({ status: "approved", updatedAt: rolledBackAt })
      .where(and(eq(knowledgeReviewDecisions.id, d.id), eq(knowledgeReviewDecisions.status, "published")))
      .returning({ id: knowledgeReviewDecisions.id });
    decisionsReverted += rows.length;
  }

  // 3. Revert terms to their snapshotted prior status.
  let termsReverted = 0;
  for (const t of snap.terms ?? []) {
    const rows = await db
      .update(knowledgeReviewQueue)
      .set({ status: t.prevStatus, updatedAt: rolledBackAt })
      .where(eq(knowledgeReviewQueue.id, t.id))
      .returning({ id: knowledgeReviewQueue.id });
    termsReverted += rows.length;
  }

  // 4. Mark the release + rollback point, audit, and reload the overlay.
  await db.update(knowledgeReleases)
    .set({ status: "rolled_back", rolledBackAt, rolledBackByUserId: userId })
    .where(eq(knowledgeReleases.id, releaseId));
  if (rollback) {
    await db.update(knowledgeRollbackPoints)
      .set({ status: "consumed", consumedAt: rolledBackAt })
      .where(eq(knowledgeRollbackPoints.id, rollback.id));
  }
  await recordAudit({
    entity: "release", entityId: releaseId, action: "rolled_back", actorUserId: userId, releaseId,
    before: { status: "published" }, after: { status: "rolled_back", aliasesDeactivated, decisionsReverted, termsReverted },
  });
  await loadVocabularyOverlayFromDb();

  return { releaseId, aliasesDeactivated, decisionsReverted, termsReverted };
}

// ── Knowledge Health dashboard ───────────────────────────────────────────────

export interface KnowledgeHealth {
  canonical: {
    foods: number;
    nutrients: number;
    benefits: number;
    relationships: number;
  };
  coverage: {
    vocabularyCoveragePct: number;
    aliasCoveragePct: number;
    consensusRatePct: number | null;
  };
  backlog: {
    outstandingReviews: number;
    awaitingConsensus: number;
    awaitingApproval: number;
    unknownTerms: number;
    deferredReviews: number;
    rejectedReviews: number;
  };
  timing: {
    averageReviewTimeHours: number | null;
    averageTimeToPublishHours: number | null;
  };
  release: {
    lastReleaseId: number | null;
    lastReleaseAt: string | null;
    lastPublishedBy: string | null;
    totalReleases: number;
    publishedAliases: number;
  };
  trend: "improving" | "stable" | "declining";
}

async function countRows(table: any): Promise<number> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(table);
  return count;
}

/**
 * Compute the Knowledge Health dashboard. Pure read. Canonical nutrient/benefit
 * counts come from the TS-owned seed (NK6F source of truth); foods + relationships
 * from the DB entity tables. All ratios have documented, monotone definitions.
 */
export async function getKnowledgeHealth(now: Date = new Date()): Promise<KnowledgeHealth> {
  const [foods, relFN, relFB, relNB] = await Promise.all([
    countRows(knowledgeFoods),
    countRows(knowledgeFoodNutrients),
    countRows(knowledgeFoodBenefits),
    countRows(knowledgeNutrientBenefits),
  ]);
  const nutrients = NUTRIENT_SEED.length;
  const benefits = HEALTH_BENEFIT_SEED.length;
  const canonicalVocab = nutrients + benefits;

  // Queue status tallies.
  const statusRows = await db
    .select({ status: knowledgeReviewQueue.status, count: sql<number>`count(*)::int` })
    .from(knowledgeReviewQueue)
    .groupBy(knowledgeReviewQueue.status);
  const byStatus = new Map(statusRows.map((r) => [r.status, r.count]));
  const s = (k: string) => byStatus.get(k) ?? 0;
  const unknownTerms = s("unresolved");
  const inReview = s("in_review");
  const deferredReviews = s("deferred");
  const rejectedReviews = s("rejected");
  // Still-unhandled terms (genuinely unknown to the canonical space).
  const unhandled = unknownTerms + inReview;

  // Published aliases (active overlay) + TS seed aliases.
  const activeOverlay = (await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeVocabularyAliases)
    .where(eq(knowledgeVocabularyAliases.isActive, true)))[0].count;
  const seedAliases = Object.keys(NUTRIENT_ALIASES).length + Object.keys(BENEFIT_ALIASES).length;
  const allAliases = seedAliases + activeOverlay;

  // Coverage %: canonical share of the (canonical + still-unknown) name-space.
  const vocabularyCoveragePct = round1((canonicalVocab / Math.max(1, canonicalVocab + unhandled)) * 100);
  // Alias coverage %: alias share of all recognised names.
  const aliasCoveragePct = round1((allAliases / Math.max(1, canonicalVocab + allAliases)) * 100);

  // Consensus rate from the comparison layer.
  const dash = await getConsensusDashboard();
  const decided = dash.counts.awaitingApproval + dash.counts.conflicting + dash.counts.approved;
  const consensusRatePct = decided > 0
    ? round1(((dash.counts.awaitingApproval + dash.counts.approved) / decided) * 100)
    : null;

  // Timing.
  const approvedOrPublishedTerms = await db
    .select({ firstSeenAt: knowledgeReviewQueue.firstSeenAt, updatedAt: knowledgeReviewQueue.updatedAt })
    .from(knowledgeReviewQueue)
    .where(inArray(knowledgeReviewQueue.status, ["approved", "published", "handed_off"]));
  const averageReviewTimeHours = avgHours(approvedOrPublishedTerms.map((t) => t.updatedAt.getTime() - t.firstSeenAt.getTime()));

  const publishedDecisions = await db
    .select({ approvedAt: knowledgeReviewDecisions.approvedAt, updatedAt: knowledgeReviewDecisions.updatedAt })
    .from(knowledgeReviewDecisions)
    .where(eq(knowledgeReviewDecisions.status, "published"));
  const averageTimeToPublishHours = avgHours(
    publishedDecisions
      .filter((d) => d.approvedAt)
      .map((d) => d.updatedAt.getTime() - (d.approvedAt as Date).getTime()),
  );

  // Releases.
  const releases = await db.select().from(knowledgeReleases).orderBy(desc(knowledgeReleases.publishedAt));
  const last = releases.find((r) => r.status === "published") ?? releases[0] ?? null;
  const names = await usernamesFor([last?.publishedByUserId]);

  // Trend: compare terms newly captured vs newly resolved in the last 7 days.
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const [{ captured }] = await db
    .select({ captured: sql<number>`count(*)::int` })
    .from(knowledgeReviewQueue)
    .where(gte(knowledgeReviewQueue.firstSeenAt, weekAgo));
  const [{ resolved }] = await db
    .select({ resolved: sql<number>`count(*)::int` })
    .from(knowledgeReviewQueue)
    .where(and(
      gte(knowledgeReviewQueue.updatedAt, weekAgo),
      inArray(knowledgeReviewQueue.status, ["approved", "published", "handed_off", "rejected", "deferred"]),
    ));
  let trend: KnowledgeHealth["trend"] = "stable";
  if (resolved > captured) trend = "improving";
  else if (captured > resolved && unhandled > 0) trend = "declining";

  return {
    canonical: { foods, nutrients, benefits, relationships: relFN + relFB + relNB },
    coverage: { vocabularyCoveragePct, aliasCoveragePct, consensusRatePct },
    backlog: {
      outstandingReviews: dash.counts.awaitingReview,
      awaitingConsensus: dash.counts.awaitingConsensus,
      awaitingApproval: dash.counts.awaitingApproval,
      unknownTerms,
      deferredReviews,
      rejectedReviews,
    },
    timing: { averageReviewTimeHours, averageTimeToPublishHours },
    release: {
      lastReleaseId: last?.id ?? null,
      lastReleaseAt: last?.publishedAt ? last.publishedAt.toISOString() : null,
      lastPublishedBy: last?.publishedByUserId != null ? names.get(last.publishedByUserId) ?? null : null,
      totalReleases: releases.filter((r) => r.status === "published").length,
      publishedAliases: activeOverlay,
    },
    trend,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function avgHours(deltasMs: number[]): number | null {
  if (!deltasMs.length) return null;
  const mean = deltasMs.reduce((a, b) => a + b, 0) / deltasMs.length;
  return round1(mean / 3_600_000);
}
