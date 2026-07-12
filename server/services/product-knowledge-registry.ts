// Product Knowledge Registry — the read layer (PHASE5A)
// ============================================================================
//
// The knowledge of what The Healthy Apples ITSELF is: its domains, pages,
// journeys, capabilities, integrations, settings, claims and glossary.
//
// Governing architecture:
//   docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md (PKR1/PKR2)
//   docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §9 (PKR3)
//
// This module is the READ layer over a registry it does not own. The registry
// is authored in `docs/product/inventory/product.yaml` and lives, for humans, as
// prose under `docs/product/`. This module reads exactly one artefact:
//
//   docs/product/inventory/product.json   — the generated machine form
//
// and nothing else, ever (Rule PKR21). It does not read the prose. It does not
// read the repository. It does not read the YAML. One artefact, one reader.
//
// ── The four ownerships this module must not take ──────────────────────────
//
//   IT DOES NOT OWN THE KNOWLEDGE.  docs/product/ owns it. This module has no
//     write path — there is no function here that creates, edits or retires an
//     entry, by construction. A product fact is corrected by editing the YAML
//     and regenerating, never by anything at runtime.
//
//   IT DOES NOT DECIDE WHO ANYONE IS.  This is the safety property the whole
//     permission model rests on (Rule PKR25): THE REGISTRY CLASSIFIES;
//     `server/lib/access.ts` AUTHORISES. This module is handed a role that
//     access.ts already resolved, and it filters against it. It never inspects a
//     session, never reads `users.role` itself, and never grants anything.
//     That separation is what stops a Markdown edit from becoming a privilege
//     escalation — because the registry is authored as documentation and
//     reviewed as documentation, and it must never hold a power that is only
//     safe under a security review it does not get.
//
//   IT DOES NOT SERIALISE ANYTHING INTO A PROMPT.  It returns typed data. The
//     Context Composition Engine (INT17) owns every byte the model reads.
//
//   IT DOES NOT SPEAK.  The Companion speaks, from what survives the filter.
//
// ── Filtering happens HERE, before composition — never in the model ─────────
//
// Rule PKR26. Content above the caller's tier is dropped before the prompt is
// built. The model is never shown a secret and asked to keep it: a prompt that
// contains admin content plus an instruction not to reveal it HAS ALREADY
// LEAKED, and no amount of instruction-following makes it not have leaked.

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { IntelligenceRole } from "../intelligence/types.js";

// ── Visibility ───────────────────────────────────────────────────────────────

/** PKR2 §11.1. An entry's `visibility` names the LOWEST tier permitted to be
 *  told it — `household` means "households AND ABOVE", never "households only". */
export const PRODUCT_VISIBILITIES = ["public", "household", "admin", "developer"] as const;
export type ProductVisibility = (typeof PRODUCT_VISIBILITIES)[number];

/**
 * Rule PKR23 — visibility is MONOTONIC: developer ⊇ admin ⊇ household ⊇ public.
 * A higher tier sees everything every lower tier sees. There is no fact an admin
 * may not be told but a household may.
 *
 * This is what stops the registry becoming four registries. Non-monotonic
 * visibility would need two versions of one fact, and two versions of one fact
 * is the exact failure this architecture exists to end.
 */
const VISIBILITY_RANK: Readonly<Record<ProductVisibility, number>> = {
  public: 0,
  household: 1,
  admin: 2,
  developer: 3,
};

/**
 * Rule PKR22 — VISIBILITY FAILS CLOSED.
 *
 * A missing label, an unrecognised value, or a typo resolves to `developer` —
 * the most restrictive tier — and is served to NO ONE at runtime (no caller can
 * hold the `developer` role today; see viewerTier below).
 *
 * It never defaults to `public`. Absence of a label is never permission. This is
 * the one place in the platform where an incomplete record is a SECURITY defect
 * rather than an invisible fact (PKCA Rule KC13), and it is deliberately not
 * traded off against the inconvenience of over-restriction: wrongly hiding a
 * fact costs a reader an answer; wrongly exposing one cannot be undone.
 */
export function normaliseVisibility(raw: unknown): ProductVisibility {
  return typeof raw === "string" && (PRODUCT_VISIBILITIES as readonly string[]).includes(raw)
    ? (raw as ProductVisibility)
    : "developer";
}

/**
 * The highest visibility tier this caller may be told, from the role
 * `server/lib/access.ts` already resolved. This function does NOT resolve
 * identity — it translates an already-authorised role into a disclosure ceiling.
 *
 * Note what `premium` is NOT doing here: nothing. Rule PKR24 — visibility keys
 * on ROLE, never on subscription tier. A free household may be told, fully and
 * accurately, what a premium capability does; they simply cannot use it. Feature
 * access is enforced by hasPremiumAccess() at the point of use. A product that
 * will not explain what it sells is indefensible, and hiding premium features
 * from free households would put the Companion in the position of pretending
 * capabilities do not exist.
 *
 * `developer` is unreachable today: resolveContext() maps the live `users.role`
 * enum to `user` | `admin` only and never produces `developer`. Developer-tier
 * entries are therefore served to nobody through this (user-facing) plane —
 * which is exactly TIP1 §7's physical-isolation posture, and is why fail-closed
 * to `developer` is a safe default rather than a theoretical one.
 */
export function viewerTier(role: IntelligenceRole, authenticated: boolean): ProductVisibility {
  if (role === "developer" || role === "service") return "developer";
  if (role === "admin") return "admin";
  return authenticated ? "household" : "public";
}

/** May a caller at `tier` be told an entry labelled `entryVisibility`? */
export function tierPermits(tier: ProductVisibility, entryVisibility: ProductVisibility): boolean {
  return VISIBILITY_RANK[tier] >= VISIBILITY_RANK[entryVisibility];
}

// ── The entry ────────────────────────────────────────────────────────────────

/** The entry spine (PKR1 §7) — the MVF bar for this domain (PKCA §3.1). */
export interface ProductEntry {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly status: string;
  readonly visibility: ProductVisibility;
  readonly purpose: string;
  readonly owner: string;
  readonly sources: readonly string[];
  readonly related: readonly string[];
  readonly lastVerified: string | null;
}

/** What a caller at a given tier is permitted to be told about one entry.
 *
 *  `owner`, `sources` and `lastVerified` are DELIBERATELY absent. They are
 *  internal governance metadata — a file path, an engineer's name, a
 *  verification date — and PKR2 §11.1 places them at `developer` tier. A
 *  household asking what the Planner is should be told what it is FOR, not
 *  which .tsx file renders it. Projecting them here would leak developer-tier
 *  metadata attached to a household-tier entry, which is exactly the kind of
 *  quiet disclosure Rule PKR22 exists to prevent. */
export interface ProductEntryView {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly status: string;
  readonly purpose: string;
  readonly related: readonly string[];
}

function toView(entry: ProductEntry): ProductEntryView {
  return {
    id: entry.id,
    name: entry.name,
    section: entry.section,
    status: entry.status,
    purpose: entry.purpose,
    related: entry.related,
  };
}

// ── Loading (derived, rebuildable, never written back to) ────────────────────

const INVENTORY_PATH = join(process.cwd(), "docs", "product", "inventory", "product.json");

interface Cache {
  mtimeMs: number;
  entries: ProductEntry[];
}

let cache: Cache | null = null;

/** Test-only override. Held SEPARATELY from `cache` on purpose: an override
 *  smuggled into the cache would be evicted the moment the file's mtime moved,
 *  so a test would silently start asserting against the real inventory. */
let override: ProductEntry[] | null = null;

/**
 * Load the generated inventory. Cached against the file's mtime, so an edit +
 * regenerate is picked up without a restart, and a hot path does not re-read the
 * file on every turn.
 *
 * This is a DERIVED READ PROJECTION (Principle 7): rebuildable from source at
 * any time, and never written back to. It is not a second owner of anything.
 *
 * A missing or malformed inventory yields ZERO entries — not a throw, and not a
 * fallback. The Companion then knows nothing about THA and says so, which is
 * honest. The alternative (a hardcoded default set of product facts) is exactly
 * the second narrator Rule PKR27 forbids, and it would be the most dangerous
 * possible one: wrong, confident, and in the product's own voice.
 */
function load(): ProductEntry[] {
  if (override !== null) return override;

  let mtimeMs: number;
  try {
    mtimeMs = statSync(INVENTORY_PATH).mtimeMs;
  } catch {
    return [];
  }
  if (cache && cache.mtimeMs === mtimeMs) return cache.entries;

  let entries: ProductEntry[] = [];
  try {
    const parsed = JSON.parse(readFileSync(INVENTORY_PATH, "utf8"));
    const raw = Array.isArray(parsed?.entries) ? parsed.entries : [];
    entries = raw.filter(isUsable).map(toEntry);
  } catch {
    entries = [];
  }

  cache = { mtimeMs, entries };
  return entries;
}

/**
 * The Gate (PKCA §1.1, Product Knowledge row): entry-spine completeness. A
 * record missing `id`, `name`, `section`, `purpose` or `owner` is not yet an
 * entry and is not served — it is a candidate that has not cleared the gate.
 *
 * `visibility` is NOT checked here, deliberately: a record with a missing or
 * malformed visibility is not dropped, it is FORCED TO `developer` by
 * normaliseVisibility and thereby served to no one. Dropping it silently would
 * hide a real governance defect; failing it closed makes the entry unreachable
 * while keeping it countable.
 */
function isUsable(raw: any): boolean {
  return (
    raw &&
    typeof raw.id === "string" && raw.id.length > 0 &&
    typeof raw.name === "string" && raw.name.length > 0 &&
    typeof raw.section === "string" && raw.section.length > 0 &&
    typeof raw.purpose === "string" && raw.purpose.length > 0 &&
    typeof raw.owner === "string" && raw.owner.length > 0
  );
}

function toEntry(raw: any): ProductEntry {
  return {
    id: raw.id,
    name: raw.name,
    section: raw.section,
    status: typeof raw.status === "string" ? raw.status : "unknown",
    visibility: normaliseVisibility(raw.visibility),
    purpose: raw.purpose,
    owner: raw.owner,
    sources: Array.isArray(raw.sources) ? raw.sources.filter((s: unknown) => typeof s === "string") : [],
    related: Array.isArray(raw.related) ? raw.related.filter((s: unknown) => typeof s === "string") : [],
    lastVerified: typeof raw.last_verified === "string" ? raw.last_verified : null,
  };
}

/** Test seam: serve an in-memory inventory instead of the file. `null` restores
 *  the real one. Production never calls this. */
export function __setInventoryForTests(entries: ProductEntry[] | null): void {
  override = entries;
  cache = null;
}

// ── The permitted reads ──────────────────────────────────────────────────────
//
// EVERY read below applies the filter FIRST. There is no unfiltered read
// exported from this module — a caller cannot obtain an entry above its tier by
// choosing the wrong function, because no such function exists.

/** Entries this tier may be told, optionally within one section. */
export function listEntries(tier: ProductVisibility, section?: string): ProductEntryView[] {
  return load()
    .filter((e) => tierPermits(tier, e.visibility))
    .filter((e) => (section ? e.section === section : true))
    .map(toView);
}

/**
 * One entry by id — or undefined.
 *
 * Note the single return for BOTH "no such entry" and "exists but above your
 * tier". This is Rule PKR29 (absence is never explained) enforced at the type
 * level rather than left to the Companion's discretion: the caller is given no
 * way to distinguish the two, so it cannot leak the difference even if it wanted
 * to. The existence of an admin-only surface is itself admin-tier knowledge —
 * "there's something here I can't show you" discloses precisely the fact the
 * tier was protecting.
 */
export function getEntry(tier: ProductVisibility, id: string): ProductEntryView | undefined {
  const entry = load().find((e) => e.id === id);
  if (!entry || !tierPermits(tier, entry.visibility)) return undefined;
  return toView(entry);
}

/** Sections this tier can see anything in, with the count it can see. */
export function listSections(tier: ProductVisibility): { section: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of load()) {
    if (!tierPermits(tier, entry.visibility)) continue;
    counts.set(entry.section, (counts.get(entry.section) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => a.section.localeCompare(b.section));
}

/**
 * Search the entries this tier may be told about.
 *
 * A plain substring match over name, id, purpose and section. It is deliberately
 * dumb: ranking product knowledge by relevance is a judgement, and a judgement
 * about which product fact best answers a question is the Companion's to make
 * from grounded data — not this module's to make by scoring.
 *
 * The filter runs BEFORE the match, not after. Matching first and filtering
 * second would mean the number of results was computed over content the caller
 * may not see, which is a side channel: "0 results" and "0 results after
 * filtering 3" are different facts, and only one of them is the caller's to know.
 */
export function searchEntries(tier: ProductVisibility, query: string): ProductEntryView[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return load()
    .filter((e) => tierPermits(tier, e.visibility))
    .filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.purpose.toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q),
    )
    .map(toView);
}
