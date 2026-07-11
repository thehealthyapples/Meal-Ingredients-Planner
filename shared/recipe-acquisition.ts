/**
 * FS3 — Canonical Recipe Acquisition Architecture (policy owner).
 *
 * Single source of truth for HOW recipe content may enter THA, WHAT may be
 * stored, and UNDER WHAT RIGHT each stored recipe is held. Every acquisition
 * path (recipe search, URL import, Smart Suggest harvesting, auto-import,
 * seeds) must consult this module — a source without a policy entry here is
 * unfetchable and unpersistable by construction.
 *
 * Governing document: docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md
 * Evidence base: docs/investigations/knowledge/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md,
 *                docs/investigations/cookbook/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md
 *
 * This is reference/policy vocabulary (Architecture Principle 5), not
 * knowledge data — it duplicates no DB store. Runtime enablement state
 * (admin toggles) stays in `recipe_source_settings`; this module owns the
 * licensing/storage policy layer that admin toggles may never override.
 */

// ─── Canonical vocabulary ─────────────────────────────────────────────────────

/**
 * The four acquisition lanes. Every recipe row belongs to exactly one lane;
 * the lane determines who may see it and what rights THA needs to hold it.
 */
export type AcquisitionLane =
  /** THA-owned or fully-redistributable content served to all users (starter meals, shells, ready-meal facts, future syndicated corpora). */
  | "tha_library"
  /** Content acquired from a licensed external provider under that provider's licence (TheMealDB, Edamam, future commercial partners). */
  | "licensed_discovery"
  /** Content a user directed into their own private cookbook (URL import, paste, photo, hand-typed). Never visible to other users. */
  | "personal_cookbook"
  /** User-authored content explicitly shared to other users under a THA ToS rights grant. Defined lane; no runtime feature yet. */
  | "community_cookbook";

/** How a recipe row came to exist — the acquisition act, not the content category. */
export type AcquisitionType =
  | "authored"           // THA-authored, or hand-typed by the owning user
  | "licensed_import"    // persisted from a licensed provider whose licence permits storage
  | "user_import"        // user-directed fetch of a specific URL into their private cookbook
  | "user_transcription" // user pasted/photographed content they possess (THA is a transcription tool)
  | "product"            // factual product identity (barcode scan, ready-meal catalogue) — no expressive content
  | "derived"            // generated from another meal (swap variants, placeholders); inherits the base meal's lane
  | "community_share";   // shared into the community cookbook under the ToS rights grant (future)

/** What THA may persist from a source. */
export type StoragePolicy =
  | "import"    // full content may be stored and kept
  | "cache_ttl" // may be cached only within the licence TTL; never promoted to a meal row
  | "link_only" // card fields (title/image-link/ingredients per licence) + URL; never instructions
  | "forbidden"; // nothing may be fetched or stored

/** The state of THA's right to use a source. Only `owned`, `licensed` and `conditional` sources are callable. */
export type LicenceState =
  | "owned"          // THA IP
  | "licensed"       // explicit licence verified and complied with
  | "conditional"    // licensed, with an outstanding compliance action recorded in `licenceNote`
  | "pending_review" // terms not yet reviewed — not callable until reviewed
  | "unlicensed";    // no right exists — never callable

export interface AcquisitionSourcePolicy {
  /** Stable source key. External keys match `recipe-source-gate` SourceKey values. */
  sourceKey: string;
  /** Human label as it appears on candidates' `source` field. */
  label: string;
  /** Lane content from this source enters. `null` = no lawful lane exists today. */
  lane: AcquisitionLane | null;
  storagePolicy: StoragePolicy;
  licenceState: LicenceState;
  /** Licence identifier recorded onto persisted rows (`meals.licence_ref`). */
  licenceRef: string | null;
  /** Attribution written onto persisted rows and rendered on cards. `null` = no attribution duty. */
  attributionText: string | null;
  /**
   * Whether THA may fetch a source's detail pages to extract content
   * (enrichment/re-scrape). False for every current source — the architecture
   * permits no THA-initiated scraping. A future partner whose licence permits
   * server-side fetch flips this per source.
   */
  allowContentFetch: boolean;
  /** Why the policy is what it is, with the FS1/FS2 reference. */
  licenceNote: string;
}

// ─── The acquisition source register ──────────────────────────────────────────

/**
 * External sources. Keyed by the same source keys as `recipe-source-gate`.
 * FS2 §1–§3 is the evidence base for every entry.
 */
export const ACQUISITION_SOURCE_REGISTER: Record<string, AcquisitionSourcePolicy> = {
  themealdb: {
    sourceKey: "themealdb",
    label: "TheMealDB",
    lane: "licensed_discovery",
    storagePolicy: "import",
    licenceState: "conditional",
    licenceRef: "themealdb-api",
    attributionText: "Recipe from TheMealDB (themealdb.com)",
    allowContentFetch: false, // API returns full content; detail pages are never scraped
    licenceNote:
      "Open recipe API. Compliance action outstanding: production use requires the supporter key, not the shared test key (FS1 G2, FS2 §1.D). Content import is permitted by the API's terms.",
  },
  edamam: {
    sourceKey: "edamam",
    label: "Edamam",
    lane: "licensed_discovery",
    storagePolicy: "link_only",
    licenceState: "licensed",
    licenceRef: "edamam-recipe-search",
    attributionText: "Recipe via Edamam — full recipe at the publisher's site",
    allowContentFetch: false, // hard rule (FS2 R7): never fetch an Edamam sourceUrl for instructions
    licenceNote:
      "Edamam Recipe Search is licensed for ingredients + nutrition + link-out only, never cooking instructions (FS1 §1.4, FS2 §1.D). Candidates may not be persisted as meals; instructions live at the publisher.",
  },
  apininjas: {
    sourceKey: "apininjas",
    label: "API-Ninjas",
    lane: null,
    storagePolicy: "forbidden",
    licenceState: "pending_review",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote: "Terms never reviewed (FS1 G7). Not callable until reviewed; returns full instruction text so redistribution terms matter most (FS2 §1.D).",
  },
  bigoven: {
    sourceKey: "bigoven",
    label: "BigOven",
    lane: null,
    storagePolicy: "forbidden",
    licenceState: "pending_review",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote: "Terms never reviewed (FS1 G7); API programme liveness unverified (FS2 §3.7). Not callable until reviewed.",
  },
  fatsecret: {
    sourceKey: "fatsecret",
    label: "FatSecret",
    lane: null,
    storagePolicy: "forbidden",
    licenceState: "pending_review",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote: "Terms never reviewed (FS1 G7). Not callable until reviewed.",
  },
  bbcgoodfood: {
    sourceKey: "bbcgoodfood",
    label: "BBC Good Food",
    lane: null,
    storagePolicy: "forbidden",
    licenceState: "unlicensed",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote:
      "No licence. robots.txt disallows the scraped /search endpoints; ToS prohibits automated access (FS2 §2.1). Future lawful route: Immediate Media syndication licence (FS2 §3.1) — a register entry change, not an architecture change.",
  },
  allrecipes: {
    sourceKey: "allrecipes",
    label: "AllRecipes",
    lane: null,
    storagePolicy: "forbidden",
    licenceState: "unlicensed",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote: "No licence; scraping breached publisher ToS (FS2 §2). Future lawful route: Dotdash Meredith content licensing (FS2 §3.2).",
  },
  jamieoliver: {
    sourceKey: "jamieoliver",
    label: "Jamie Oliver",
    lane: null,
    storagePolicy: "forbidden",
    licenceState: "unlicensed",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote: "No licence; scraping breached publisher ToS (FS2 §2, §3.3).",
  },
  seriouseats: {
    sourceKey: "seriouseats",
    label: "Serious Eats",
    lane: null,
    storagePolicy: "forbidden",
    licenceState: "unlicensed",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote: "No licence; scraping breached publisher ToS (FS2 §2). Future lawful route: Dotdash Meredith content licensing (FS2 §3.2).",
  },
};

/**
 * Internal (THA-owned) candidate sources that flow through the same
 * persistence funnel as external candidates. Owned content: always storable.
 */
export const INTERNAL_SOURCE_POLICIES: Record<string, AcquisitionSourcePolicy> = {
  meal_shell: {
    sourceKey: "meal_shell",
    label: "Meal Shell",
    lane: "tha_library",
    storagePolicy: "import",
    licenceState: "owned",
    licenceRef: null,
    attributionText: null,
    allowContentFetch: false,
    licenceNote: "THA-authored meal shell templates (server/seeds/seed-meal-shell-templates.ts). THA IP.",
  },
};

/** Candidate `source` label → source key, for both external and internal sources. */
const LABEL_TO_SOURCE_KEY: Record<string, string> = Object.fromEntries(
  [...Object.values(ACQUISITION_SOURCE_REGISTER), ...Object.values(INTERNAL_SOURCE_POLICIES)].map(
    (p) => [p.label.toLowerCase(), p.sourceKey],
  ),
);

// ─── Policy resolution ────────────────────────────────────────────────────────

export function getAcquisitionSourcePolicy(sourceKey: string): AcquisitionSourcePolicy | null {
  return ACQUISITION_SOURCE_REGISTER[sourceKey] ?? INTERNAL_SOURCE_POLICIES[sourceKey] ?? null;
}

/** Resolve a candidate's display label ("BBC Good Food") to its policy, or null when unregistered. */
export function getPolicyForSourceLabel(label: string | null | undefined): AcquisitionSourcePolicy | null {
  if (!label) return null;
  const key = LABEL_TO_SOURCE_KEY[label.toLowerCase()];
  return key ? getAcquisitionSourcePolicy(key) : null;
}

/** May THA call this source at all? Admin toggles cannot make a non-acquirable source callable. */
export function isSourceAcquirable(policy: AcquisitionSourcePolicy | null): boolean {
  if (!policy) return false;
  return (
    policy.licenceState === "owned" ||
    policy.licenceState === "licensed" ||
    policy.licenceState === "conditional"
  );
}

/** May content from this source be persisted as a meal row? */
export function mayPersistFromSource(policy: AcquisitionSourcePolicy | null): boolean {
  return isSourceAcquirable(policy) && policy!.storagePolicy === "import";
}

/** May THA fetch this source's detail pages to extract content (enrichment / re-scrape)? */
export function mayFetchSourceContent(policy: AcquisitionSourcePolicy | null): boolean {
  return isSourceAcquirable(policy) && policy!.allowContentFetch === true;
}

// ─── Legacy provenance derivation (backfill + write-time default) ─────────────

export interface DerivedAcquisition {
  acquisitionLane: AcquisitionLane;
  acquisitionType: AcquisitionType;
}

/**
 * Maps the legacy free-text `mealSourceType` to the canonical acquisition
 * facts. Used to default the provenance columns for write paths that predate
 * FS3, and by the one-off backfill (scripts/apply-recipe-acquisition-columns.ts,
 * which mirrors this mapping in SQL). Mapping per FS2 §4.3.
 */
export function deriveAcquisitionFromLegacy(meal: {
  mealSourceType?: string | null;
  sourceUrl?: string | null;
  isSystemMeal?: boolean | null;
}): DerivedAcquisition {
  const t = meal.mealSourceType ?? "scratch";
  switch (t) {
    case "starter":
      return { acquisitionLane: "tha_library", acquisitionType: "authored" };
    case "ready_meal":
      return { acquisitionLane: "tha_library", acquisitionType: "product" };
    case "openfoodfacts":
      return {
        acquisitionLane: meal.isSystemMeal ? "tha_library" : "personal_cookbook",
        acquisitionType: "product",
      };
    case "web":
    case "imported_website":
    case "imported_instagram":
    case "imported_tiktok":
      return { acquisitionLane: "personal_cookbook", acquisitionType: "user_import" };
    case "smart_import":
      return { acquisitionLane: "licensed_discovery", acquisitionType: "licensed_import" };
    case "household-safe-variant":
    case "planner-placeholder":
      return { acquisitionLane: "personal_cookbook", acquisitionType: "derived" };
    case "scratch":
    default:
      // Pre-FS3 auto-imports were laundered to "scratch" but kept their sourceUrl
      // (FS2 C2-a): a scratch row WITH a sourceUrl was acquired from that URL.
      return meal.sourceUrl
        ? { acquisitionLane: "personal_cookbook", acquisitionType: "user_import" }
        : { acquisitionLane: "personal_cookbook", acquisitionType: "authored" };
  }
}
