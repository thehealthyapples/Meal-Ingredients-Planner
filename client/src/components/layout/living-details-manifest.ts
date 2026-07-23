/**
 * The Life Register — the Living Details manifest (EXP3 § 7.2).
 *
 * This is the single declarative source of truth for the Living Home's Layer-4
 * "Living Details": the household's own life showing through a room's environment
 * band. Every detail is *data-borne or dead* (Blueprint § 12.1) — nothing enters
 * this register without a `binding` to a canonical owner whose true facts decide,
 * at read time, whether the detail appears at all.
 *
 * ── EXP3 Phase 2 status: DELIBERATELY EMPTY. ────────────────────────────────────
 * This module ships the SHAPE and an EMPTY manifest. It has NO consumer and NO
 * owner component yet: the composition mouth (`living-details.tsx`, EXP3 § 7.1) and
 * the resolver (EXP3 § 7.3) land with the FIRST admitted detail — the Cookbook
 * pilot, EXP3 Phase 3 — never before (an authored-but-unadopted foundation is the
 * exact failure UIA § 17 forbids). Nothing imports this file today, so it changes
 * no UI and adds no runtime behaviour.
 *
 * The type shape makes the six Blueprint § 12.1 laws unbreakable by construction:
 * a spec CANNOT carry motion, text/copy, an occasion/tradition key, a colour
 * override, or a per-surface exposure — there is no field for any of them.
 *
 * NOT this register: House assets (immutable architecture — see
 * `docs/implementation/assets/house-asset-register.json`) and Environmental
 * Dressing (the claim-free third register, DECLARED-NOT-BUILT — LIVINGHOME2).
 * A binding is precisely what distinguishes Life from Dressing: Life MUST bind to
 * a household fact; Dressing MUST NOT. The verifier enforces the boundary.
 *
 * ── LARDER_ASSET_GOVERNANCE_FOUNDATION extension (2026-07-23). ─────────────────
 * This module — the Life Register — is ALSO the single owner of the governance
 * records for physical, data-bound Living Home assets: the Living Larder jar
 * assets (§ J below). Jars are Life-class, not House-class, by EXP3 § 4.4's own
 * line: *"Life assets are deliberately NOT listed here [the House Register] —
 * their nature is that what appears is decided by data at read time, not by
 * their bytes."* Which jar a household sees is decided by their Domain-30 pantry
 * facts at read time; the jar ARTWORK bytes are nonetheless checksum-locked and
 * Home-Owner-approved, exactly in the Dressing register's manner (EXP3 § 4.4).
 * The Living Details manifest above is byte-untouched by this extension: the
 * one-per-realm law, the binding law and the occasion ban apply to Living
 * Details exactly as before, and `livingDetailsManifest` remains empty. No
 * second register, verifier, approval log or state owner exists — the jar
 * section lives HERE so that it cannot become one.
 */

/** Shell realm ids a detail may attach to. Kept as `string` to track the shell's own realm vocabulary. */
export type Realm =
  | "cookbook"
  | "pantry"
  | "orchard"
  | "nutrition"
  | "diary"
  | (string & {});

/** A reference into the shared object library (EXP3 § 6). Resolved to media only by the owner component. */
export interface ObjectRef {
  /** Fact-shaped object id (e.g. "plums"), one file, one owner — never room-shaped. */
  readonly id: string;
}

export interface LivingDetailSpec {
  /** One detail id, admitted by name (Blueprint § 12.1.6). */
  readonly id: string;
  /** The admission's document id — no anonymous charm (EXP3 § 7.2). */
  readonly admittedBy: string;
  /** The predecessor detail retired in the same decision, or null (Blueprint § 12.1.1 — one per domain). */
  readonly retires: string | null;
  /** The data binding — its presence is what makes this the LIFE register, not Dressing. */
  readonly binding: {
    /** The canonical owner read (query key / module), named. */
    readonly source: string;
    /** Human-readable truth condition, e.g. "household has >=1 pantry item in season (Domain 11 n pantry facts)". */
    readonly predicate: string;
  };
  /** Object-library ids; each renders only if its fact holds. */
  readonly objects: ReadonlyArray<ObjectRef>;
  /** Declared visual ceiling, never tuned per surface (UIA § 15). */
  readonly ceiling: {
    readonly maxObjects: number;
    readonly strengthToken: string;
  };

  // Structurally ABSENT, forever — and that absence IS the law made mechanical:
  //   • no motion / animation fields ...... a Living Detail is still (Blueprint § 12.1.5)
  //   • no text / copy fields ............. details never carry text (Blueprint § 6.1)
  //   • no occasion / tradition key ....... LH3 · LIVINGHOME1 § 10.4 (a tradition never carries an asset)
  //   • no colour override ................ UIA § 7 owns colour
  //   • no per-surface exposure ........... UIA § 16 owns exposure tokens
}

/**
 * The one-per-domain law as a type: a realm maps to AT MOST ONE spec.
 * (Partial: most realms have no Living Detail; that is the honest default.)
 */
export type LivingDetailsManifest = Partial<Record<Realm, LivingDetailSpec>>;

/**
 * THE MANIFEST — empty at EXP3 Phase 2 by design.
 *
 * The first entry is admitted at EXP3 Phase 3 (the Cookbook pilot), through the
 * full experience gate stack, retiring "the well-thumbed page" in the same
 * decision. Until then, every room's band renders exactly as it does today.
 */
export const livingDetailsManifest: LivingDetailsManifest = {};

// ═════════════════════════════════════════════════════════════════════════════
// § J · LARDER JAR ASSET GOVERNANCE (LARDER_ASSET_GOVERNANCE_FOUNDATION)
//
// The governance, lifecycle and validation foundation for the 27 approved
// Living Larder jar assets: 25 ingredient visual families, one empty
// shopping-state jar, one green visual-gap fallback jar. GOVERNANCE ONLY —
// no artwork exists yet (every record is `planned`), no runtime UI reads this
// section, and no asset may reach runtime or an export until it is `approved`
// with a checksum-bound Home Owner approval, verified by
// `scripts/ci/verify-living-home-assets.ts` (the ONE verifier).
//
// Owners cited, never restated:
//   • ingredient identity ......... Domain 2 (Canonical Food) — a jar renders a
//     canonical food; it never invents one (LARDER1). Mappings here are CURATED;
//     an unmapped food gets the fallback jar + a Visual Gap record, never a guess.
//   • household staples ........... Domain 30 (`user_pantry_items`) — which jar
//     appears is that owner's fact at read time; this section owns only artwork
//     governance, no business data.
//   • aesthetic approval .......... HOME_OWNER_ARCHITECTURE.md — recorded below,
//     bound to the exact file checksum (an unrecorded approval is not an approval).
//   • UI colour ................... THA_UI_ARCHITECTURE.md § 7. `visual-gap-green`
//     below is an ARTWORK-CONTENT colour (the fallback jar's pellet pigment, like
//     the apples' red-green in the Dressing assets), never a UI token; any UI-token
//     use would require a UIA amendment first.
//   • jar form .................... LIVING_LARDER_ASSET_LIBRARY.md (ASSET1) — one
//     jar, specified once, reused forever; the shared spec below binds every file
//     to one identical form so 27 files can never become 27 rival jars.
// ═════════════════════════════════════════════════════════════════════════════

/** Lifecycle: planned → candidate → approved. Checksum drift returns approved → candidate. */
export type JarApprovalStatus = "planned" | "candidate" | "approved";

/** Runtime availability. ONLY a checksum-bound-approved asset may ever be "available". */
export type JarAvailabilityState = "available" | "unavailable";

/** The Larder's presentation shelving vocabulary — presentation only; Domain 2 owns food identity. */
export type LarderJarCategory =
  | "grains"
  | "pasta"
  | "legumes"
  | "nuts-seeds"
  | "baking"
  | "breakfast"
  | "any";

/**
 * One Home Owner visual approval, bound to the EXACT file checksum it approved
 * (HOMEOWNER1: an unrecorded approval is not an approval; a checksum-free
 * approval is an approval of nothing in particular).
 */
export interface JarVisualApproval {
  readonly status: "approved" | "superseded" | "invalidated-by-checksum-drift";
  readonly approvedByRole: "home-owner";
  /** ISO 8601 timestamp. */
  readonly approvedAt: string;
  /** sha256 of the exact PNG bytes approved. */
  readonly approvedChecksum: string;
  readonly notes?: string;
}

/** One rejection: a candidate file refused, with its evidence kept (never deleted). */
export interface JarRejectionRecord {
  /** ISO 8601 timestamp. */
  readonly rejectedAt: string;
  /** sha256 of the rejected bytes, or null when a planned direction was refused before any file existed. */
  readonly rejectedChecksum: string | null;
  readonly reason: string;
  /** The asset id (or archived path) that replaced the rejected work, once resolved. */
  readonly replacementRef: string | null;
}

/**
 * The SHARED visual specification — one owner for every fact all 27 jars share
 * (Principle 2: 27 copies of one geometry would be 27 rival owners of it).
 * Every record references this spec via `spec`; `resolveLarderJarRecord()`
 * merges it back for consumers that need the full per-asset view.
 */
export const LARDER_JAR_SHARED_SPEC = {
  specId: "larder-jar-shared-spec-v1",
  /** Master canvas — exact, verified from PNG IHDR. */
  dimensions: { width: 512, height: 768 },
  aspectRatio: "2:3",
  format: "PNG master with genuine RGBA transparency; transparent corners; exactly one jar per file",
  /** One identical jar form across all files (ASSET1 — one jar, reused forever). */
  jarForm: {
    type: "traditional clamp-top jar",
    glass: "clear glass with restrained reflections",
    lid: "clear glass lid",
    clasp: "brushed silver clasp",
    sealingRing: "natural off-white sealing ring",
  },
  lighting: "soft neutral-warm frontal daylight from slightly above-left",
  shadow: "minimal contact shadow",
  contents: {
    rendering: "photorealistic ingredients at true-to-life ingredient scale",
    nominalFillHeight: 0.7,
    permittedSettlingVariation: 0.03,
    /** Fill is presentation only. It must NEVER represent household quantity. */
    fillIsSemantic: false,
  },
  /** Shared geometry: jar baseline, canvas padding and positioning are identical in every file. */
  geometry: {
    baseline: "shared jar baseline; identical crop, scale and vertical placement in every file",
    padding: "shared canvas padding; the jar never touches a canvas edge",
    positioning: "horizontally centred; one jar only",
  },
  /** The label plate and its runtime-text law. NO wording is ever baked into artwork. */
  label: {
    rectangle: { x: 106, y: 438, width: 300, height: 112 },
    textSafeInset: { x: 18, y: 12 },
    treatment:
      "traditional scalloped chalkboard silhouette; restrained side curves; very subtle matte grain; no baked wording — runtime text only",
    typography: {
      fontFamily: "Nunito Sans",
      fontWeight: 500,
      colour: "white",
      textCase: "sentence case",
      alignment: "centred horizontally and vertically",
      maxLines: 2,
      fontSizeRangePx: { min: 28, max: 36 },
      abbreviation: "never — no abbreviation, no ellipsis",
      accessibleName: "full accessible name required outside the artwork",
    },
  },
} as const;

export type LarderJarSharedSpecId = typeof LARDER_JAR_SHARED_SPEC.specId;

/**
 * One governed Larder jar asset record. Facts every jar shares live ONCE on
 * `LARDER_JAR_SHARED_SPEC` (referenced by `spec`); a record holds only what
 * genuinely varies per asset, plus its full lifecycle state and history.
 */
export interface LarderJarAssetRecord {
  /** Canonical asset id — `tha-larder-jar-<family>`. */
  readonly id: string;
  /** `tha-larder-jar-<family>.png`, under LARDER_JAR_ASSET_DIR. */
  readonly filename: string;
  /** Stable semantic visual family, kebab-case (e.g. "rolled-oats"). */
  readonly family: string;
  /** Within-family variant. All 27 foundation records are the single "master" rendering. */
  readonly variant: "master";
  readonly visualDescription: string;
  /**
   * CURATED Domain-2-facing mappings (exact pantry-name strings this family may
   * represent). Never inferred: an unmapped canonical food takes the fallback jar
   * and a Visual Gap record. Empty for the empty jar and the fallback jar.
   */
  readonly canonicalFoodMappings: ReadonlyArray<string>;
  readonly allowedLarderCategory: LarderJarCategory;
  /** Labels are runtime text only (shared spec label law); never baked wording. */
  readonly dynamicLabel: true;
  readonly availabilityState: JarAvailabilityState;
  /** All geometry/label/typography metadata — owned once by the shared spec. */
  readonly spec: LarderJarSharedSpecId;
  readonly requiresTransparency: true;
  readonly permittedUses: ReadonlyArray<string>;
  readonly prohibitedUses: ReadonlyArray<string>;
  /** Families a viewer could mistake this one for — curated, symmetric where sensible. */
  readonly confusableWith: ReadonlyArray<string>;
  readonly approvalStatus: JarApprovalStatus;
  /** sha256 of the current file bytes; null exactly while `planned`. */
  readonly checksum: string | null;
  /** Predecessor or rejected work this asset supersedes (archived path or asset id), or null. */
  readonly predecessorOrRejectedReference: string | null;
  /** The one declared runtime mouth (DECLARED — no runtime binding exists yet). */
  readonly ownerComponent: string;
  /** The live approval — non-null with status "approved" ONLY when checksum-bound. */
  readonly visualApproval: JarVisualApproval | null;
  readonly visualApprovalHistory: ReadonlyArray<JarVisualApproval>;
  readonly rejectionHistory: ReadonlyArray<JarRejectionRecord>;
}

/** The governed asset directory (inside the Living Home tree; carved out of the Life orphan check by the verifier). */
export const LARDER_JAR_ASSET_DIR = "client/src/assets/living-home/larder/jars";

/** The one declared future mouth for jar assets (runtime binding is a later, separate pass). */
export const LARDER_JAR_OWNER_COMPONENT = "client/src/pages/larder-room.tsx";

/** The archived, rejected predecessors (evidence kept, never deleted). */
export const LARDER_REJECTED_PREDECESSOR_DIR = "docs/reference-assets/rejected/living-larder";

const JAR_PERMITTED_USES: ReadonlyArray<string> = Object.freeze([
  "larder-room-shelf-presentation",
  "approved-production-export",
]);

const JAR_PROHIBITED_USES: ReadonlyArray<string> = Object.freeze([
  "household-quantity-representation",
  "nutrition-quality-or-freshness-claim",
  "marketing-or-promotional-use",
  "use-outside-the-larder-room-presentation",
  "representation-of-any-food-outside-canonicalFoodMappings",
]);

/** Shorthand for one planned ingredient-family record (the foundation state of all 27). */
function plannedJar(
  family: string,
  category: LarderJarCategory,
  visualDescription: string,
  mappings: ReadonlyArray<string>,
  confusableWith: ReadonlyArray<string>,
  overrides?: Partial<Pick<LarderJarAssetRecord, "permittedUses" | "prohibitedUses" | "predecessorOrRejectedReference">>,
): LarderJarAssetRecord {
  return {
    id: `tha-larder-jar-${family}`,
    filename: `tha-larder-jar-${family}.png`,
    family,
    variant: "master",
    visualDescription,
    canonicalFoodMappings: mappings,
    allowedLarderCategory: category,
    dynamicLabel: true,
    availabilityState: "unavailable",
    spec: LARDER_JAR_SHARED_SPEC.specId,
    requiresTransparency: true,
    permittedUses: overrides?.permittedUses ?? JAR_PERMITTED_USES,
    prohibitedUses: overrides?.prohibitedUses ?? JAR_PROHIBITED_USES,
    confusableWith,
    approvalStatus: "planned",
    checksum: null,
    predecessorOrRejectedReference:
      overrides?.predecessorOrRejectedReference ??
      `${LARDER_REJECTED_PREDECESSOR_DIR}/larder-jars.webp`,
    ownerComponent: LARDER_JAR_OWNER_COMPONENT,
    visualApproval: null,
    visualApprovalHistory: [],
    rejectionHistory: [],
  };
}

/**
 * THE PLANNED INVENTORY — all 27 records, explicit, planned, unavailable,
 * checksum null. 25 approved ingredient visual families + the empty
 * shopping-state jar + the green visual-gap fallback jar. The inventory is
 * CLOSED at 27: adding a family is a governance change to this register, in
 * this file, verified by the inventory check.
 */
export const larderJarAssetRegister: ReadonlyArray<LarderJarAssetRecord> = Object.freeze([
  plannedJar("rolled-oats", "breakfast",
    "Photorealistic rolled oat flakes, pale cream, softly irregular, settled to the shared fill line.",
    ["rolled oats"], ["granola"]),
  plannedJar("white-rice", "grains",
    "Photorealistic white long-grain rice, bright matte white grains, fine and even.",
    ["white rice"], ["couscous", "sugar", "mixed-rice"]),
  plannedJar("brown-rice", "grains",
    "Photorealistic brown wholegrain rice, warm tan grains with visible bran sheen.",
    ["brown rice"], ["mixed-rice", "pearl-barley"]),
  plannedJar("mixed-rice", "grains",
    "Photorealistic mixed rice blend: white, brown and dark wild grains interleaved.",
    ["mixed rice"], ["brown-rice", "white-rice"]),
  plannedJar("white-penne", "pasta",
    "Photorealistic white penne tubes, pale gold semolina, angled cuts visible.",
    ["white penne"], ["wholemeal-penne", "white-fusilli"]),
  plannedJar("wholemeal-penne", "pasta",
    "Photorealistic wholemeal penne tubes, warm brown speckled semolina.",
    ["wholemeal penne"], ["white-penne", "wholemeal-fusilli"]),
  plannedJar("white-fusilli", "pasta",
    "Photorealistic white fusilli spirals, pale gold, loosely stacked.",
    ["white fusilli"], ["wholemeal-fusilli", "white-penne"]),
  plannedJar("wholemeal-fusilli", "pasta",
    "Photorealistic wholemeal fusilli spirals, warm brown speckled.",
    ["wholemeal fusilli"], ["white-fusilli", "wholemeal-penne"]),
  plannedJar("red-lentils", "legumes",
    "Photorealistic split red lentils, warm coral-orange discs, fine and even.",
    ["red lentils"], ["green-lentils"]),
  plannedJar("green-lentils", "legumes",
    "Photorealistic green lentils, muted khaki-green discs with matte skins.",
    ["green lentils"], ["red-lentils"]),
  plannedJar("dried-chickpeas", "legumes",
    "Photorealistic dried chickpeas, pale beige rounds with a dimpled beak.",
    ["dried chickpeas"], ["cannellini-beans"]),
  plannedJar("black-beans", "legumes",
    "Photorealistic dried black turtle beans, deep matte black ovals.",
    ["black beans"], ["kidney-beans"]),
  plannedJar("mixed-nuts", "nuts-seeds",
    "Photorealistic mixed whole nuts: almonds, walnuts, cashews, hazelnuts.",
    ["mixed nuts"], ["granola"]),
  plannedJar("pumpkin-seeds", "nuts-seeds",
    "Photorealistic pumpkin seeds, flat deep-green kernels.",
    ["pumpkin seeds"], ["sunflower-seeds"]),
  plannedJar("plain-flour", "baking",
    "Photorealistic plain white flour, soft matte powder with a gently settled surface.",
    ["plain flour"], ["ground-almonds"]),
  plannedJar("quinoa", "grains",
    "Photorealistic uncooked quinoa, tiny ivory spheres with visible germ rings.",
    ["quinoa"], ["couscous", "pearl-barley"]),
  plannedJar("couscous", "grains",
    "Photorealistic couscous, fine pale golden granules, even and dry.",
    ["couscous"], ["white-rice", "quinoa", "sugar"]),
  plannedJar("pearl-barley", "grains",
    "Photorealistic pearl barley, plump ivory grains with a soft pearled sheen.",
    ["pearl barley"], ["quinoa", "brown-rice"]),
  plannedJar("kidney-beans", "legumes",
    "Photorealistic dried kidney beans, deep glossy red-brown kidneys.",
    ["kidney beans"], ["black-beans"]),
  plannedJar("cannellini-beans", "legumes",
    "Photorealistic dried cannellini beans, matte ivory-white kidneys.",
    ["cannellini beans"], ["dried-chickpeas"]),
  plannedJar("sunflower-seeds", "nuts-seeds",
    "Photorealistic hulled sunflower seeds, soft grey teardrop kernels.",
    ["sunflower seeds"], ["pumpkin-seeds"]),
  plannedJar("chia-seeds", "nuts-seeds",
    "Photorealistic chia seeds, tiny mottled grey-black and white ovals.",
    ["chia seeds"], []),
  plannedJar("ground-almonds", "baking",
    "Photorealistic ground almonds, pale warm-cream coarse meal, gently settled.",
    ["ground almonds"], ["plain-flour"]),
  plannedJar("granola", "breakfast",
    "Photorealistic granola clusters, toasted golden oats and nuts, irregular.",
    ["granola"], ["rolled-oats", "mixed-nuts"]),
  plannedJar("sugar", "baking",
    "Photorealistic white granulated sugar, fine bright crystalline grains.",
    ["sugar"], ["white-rice", "couscous"]),
  // The empty shopping-state jar — the same jar, honestly empty. Its emptiness is
  // a PRESENTATION of the shopping state owned elsewhere (Domain 15); it asserts
  // no quantity and carries no food.
  plannedJar("empty", "any",
    "The identical clamp-top jar, honestly empty: clear glass, no contents, no residue.",
    [], [], {
      permittedUses: [
        "larder-room-shelf-presentation",
        "shopping-state-presentation",
        "approved-production-export",
      ],
      prohibitedUses: [
        "household-quantity-representation",
        "nutrition-quality-or-freshness-claim",
        "marketing-or-promotional-use",
        "use-outside-the-larder-room-presentation",
        "representation-of-any-specific-food",
      ],
    }),
  // The green visual-gap fallback jar — the honest gap made visible. Contents are
  // uniform, smooth, rounded NON-FOOD geometric pellets in visual-gap-green: it can
  // never be mistaken for a real ingredient, which is the point (Principle 6 —
  // honest gaps over fabricated mappings).
  plannedJar("fallback-green", "any",
    "The identical clamp-top jar filled with uniform, smooth, rounded non-food geometric " +
      "pellets in visual-gap-green (#63A844) — deliberately unmistakable for any real food.",
    [], [], {
      permittedUses: [
        "visual-gap-presentation-of-unmapped-canonical-foods",
        "approved-production-export",
      ],
      prohibitedUses: [
        "any-meaning-other-than-visual-gap",
        "household-quantity-representation",
        "nutrition-quality-or-freshness-claim",
        "marketing-or-promotional-use",
        "use-outside-the-larder-room-presentation",
      ],
    }),
]);

/** The 25 approved ingredient families, in approval order — the closed inventory the verifier checks. */
export const LARDER_JAR_INGREDIENT_FAMILIES: ReadonlyArray<string> = Object.freeze([
  "rolled-oats", "white-rice", "brown-rice", "mixed-rice", "white-penne",
  "wholemeal-penne", "white-fusilli", "wholemeal-fusilli", "red-lentils",
  "green-lentils", "dried-chickpeas", "black-beans", "mixed-nuts",
  "pumpkin-seeds", "plain-flour", "quinoa", "couscous", "pearl-barley",
  "kidney-beans", "cannellini-beans", "sunflower-seeds", "chia-seeds",
  "ground-almonds", "granola", "sugar",
]);

// ── § J.2 · Semantic colour governance — visual-gap-green ─────────────────────

/**
 * The ONE governed semantic colour of this section. An ARTWORK-CONTENT colour:
 * the pigment of the fallback jar's non-food pellets, exactly as the apples'
 * red-green is the Dressing assets' pigment. It is NOT a UI token — UI colour
 * stays THA_UI_ARCHITECTURE.md § 7's, and promoting this value to a token would
 * require a UIA amendment FIRST. It has exactly one meaning, and the verifier
 * enforces that no second meaning and no second governed colour appear here.
 */
export const VISUAL_GAP_GREEN = {
  colourId: "visual-gap-green",
  baseColour: "#63A844",
  meaning: "approved visual representation missing",
  /** The only assets this colour's meaning may apply to. */
  appliesOnlyToAssetIds: ["tha-larder-jar-fallback-green"],
  /** What it must NEVER mean — a single forbidden meaning here is a verifier failure. */
  mustNeverMean: [
    "quantity",
    "nutrition",
    "quality",
    "freshness",
    "availability",
    "error",
    "shopping-list state",
  ],
} as const;

// ── § J.3 · The Visual Gap Register — honest gaps, one owner ──────────────────

/**
 * One recorded visual gap: a canonical food a household actually displays that
 * has NO approved visual family yet, shown with the fallback jar. Recorded here
 * — the Life Register is the ONE persistent owner of visual gaps; no runtime
 * store, log or second file may own them. Entries are added by commit (there is
 * no runtime Larder UI yet); `visual-gap-register.json` in the export package is
 * a PROJECTION of this array, never a second owner.
 */
export interface LarderVisualGapRecord {
  /** Canonical food identity (Domain 2 name) the gap is about. */
  readonly canonicalFoodIdentity: string;
  /** The pantry name the household actually sees, where it differs; else null. */
  readonly displayedPantryName: string | null;
  readonly fallbackAssetId: "tha-larder-jar-fallback-green";
  /** ISO date the gap was first encountered. */
  readonly firstEncountered: string;
  /** The visual family intended to close the gap, or null while undecided. */
  readonly intendedVisualFamily: string | null;
  readonly status: "open" | "resolved";
  /** The approved asset id that closed the gap; non-null exactly when resolved. */
  readonly replacementAssetId: string | null;
}

/** EMPTY at the foundation: no runtime Larder UI exists, so no gap has been encountered. */
export const larderVisualGapRegister: ReadonlyArray<LarderVisualGapRecord> = Object.freeze([]);

// ── § J.4 · Lifecycle law — pure, deterministic, verifier-enforced ────────────

/**
 * The ONE definition of availability (Principle 2). A record's stored
 * `availabilityState` must equal this derivation; the verifier fails any drift.
 * Available ⇔ approved + checksum present + live Home Owner approval bound to
 * that exact checksum. Everything else — planned, candidate, drifted — is
 * unavailable.
 */
export function deriveJarAvailability(record: LarderJarAssetRecord): JarAvailabilityState {
  return record.approvalStatus === "approved" &&
    record.checksum !== null &&
    record.visualApproval !== null &&
    record.visualApproval.status === "approved" &&
    record.visualApproval.approvedChecksum === record.checksum
    ? "available"
    : "unavailable";
}

/** planned → candidate: a real file now exists with this checksum. Still unavailable. */
export function promoteJarToCandidate(
  record: LarderJarAssetRecord,
  fileChecksum: string,
): LarderJarAssetRecord {
  if (record.approvalStatus !== "planned") {
    throw new Error(`${record.id}: only a planned record may become candidate (is ${record.approvalStatus}).`);
  }
  if (!fileChecksum) throw new Error(`${record.id}: a candidate requires a real file checksum.`);
  return { ...record, approvalStatus: "candidate", checksum: fileChecksum, availabilityState: "unavailable" };
}

/**
 * candidate → approved: ONLY on a recorded Home Owner approval bound to the
 * candidate's exact checksum, and only after automated verification has passed
 * (the verifier gates the commit that records this).
 */
export function recordJarHomeOwnerApproval(
  record: LarderJarAssetRecord,
  approval: JarVisualApproval,
): LarderJarAssetRecord {
  if (record.approvalStatus !== "candidate") {
    throw new Error(`${record.id}: only a candidate may be approved (is ${record.approvalStatus}).`);
  }
  if (approval.status !== "approved" || approval.approvedByRole !== "home-owner") {
    throw new Error(`${record.id}: approval must be a live home-owner approval.`);
  }
  if (record.checksum === null || approval.approvedChecksum !== record.checksum) {
    throw new Error(`${record.id}: approval must be bound to the exact candidate checksum.`);
  }
  return {
    ...record,
    approvalStatus: "approved",
    availabilityState: "available",
    visualApproval: approval,
    visualApprovalHistory: [...record.visualApprovalHistory, approval],
  };
}

/**
 * Checksum drift on an approved asset: the file's bytes no longer match the
 * approved checksum. The asset returns to candidate, availability is withdrawn,
 * and the previous approval is PRESERVED in history as invalidated — fresh
 * automated verification and a fresh Home Owner approval are required.
 */
export function applyJarChecksumDrift(
  record: LarderJarAssetRecord,
  actualChecksum: string,
): LarderJarAssetRecord {
  if (record.approvalStatus !== "approved" || record.visualApproval === null) {
    throw new Error(`${record.id}: drift applies only to an approved record.`);
  }
  if (actualChecksum === record.checksum) {
    throw new Error(`${record.id}: no drift — bytes match the approved checksum.`);
  }
  const invalidated: JarVisualApproval = {
    ...record.visualApproval,
    status: "invalidated-by-checksum-drift",
  };
  return {
    ...record,
    approvalStatus: "candidate",
    availabilityState: "unavailable",
    checksum: actualChecksum,
    visualApproval: null,
    visualApprovalHistory: [
      ...record.visualApprovalHistory.filter((a) => a !== record.visualApproval),
      invalidated,
    ],
  };
}

/** Record-level law: every internal consistency rule a record must satisfy. Empty ⇒ well-formed. */
export function assertJarRecordWellFormed(record: LarderJarAssetRecord): string[] {
  const problems: string[] = [];
  const expectFile = `${record.id}.png`;
  if (record.id !== `tha-larder-jar-${record.family}`) {
    problems.push(`${record.id}: id must be tha-larder-jar-<family>.`);
  }
  if (record.filename !== expectFile) {
    problems.push(`${record.id}: filename must be "${expectFile}" (is "${record.filename}").`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(record.family)) {
    problems.push(`${record.id}: family must be stable kebab-case.`);
  }
  if (record.spec !== LARDER_JAR_SHARED_SPEC.specId) {
    problems.push(`${record.id}: must reference the one shared spec (${LARDER_JAR_SHARED_SPEC.specId}).`);
  }
  if (record.dynamicLabel !== true) problems.push(`${record.id}: dynamicLabel must be true — labels are runtime text only.`);
  if (record.requiresTransparency !== true) problems.push(`${record.id}: requiresTransparency must be true.`);
  if (record.ownerComponent !== LARDER_JAR_OWNER_COMPONENT) {
    problems.push(`${record.id}: ownerComponent must be the one declared mouth (${LARDER_JAR_OWNER_COMPONENT}).`);
  }
  if (record.permittedUses.length === 0) problems.push(`${record.id}: permittedUses must be declared.`);
  if (record.prohibitedUses.length === 0) problems.push(`${record.id}: prohibitedUses must be declared.`);
  if (record.approvalStatus === "planned") {
    if (record.checksum !== null) problems.push(`${record.id}: a planned record's checksum must be null.`);
    if (record.visualApproval !== null) problems.push(`${record.id}: a planned record has no live approval.`);
  }
  if (record.approvalStatus === "candidate" && record.checksum === null) {
    problems.push(`${record.id}: a candidate must carry its file checksum.`);
  }
  if (record.approvalStatus === "approved") {
    if (record.checksum === null) problems.push(`${record.id}: an approved record must carry its checksum.`);
    if (record.visualApproval === null || record.visualApproval.status !== "approved") {
      problems.push(`${record.id}: an approved record requires a live home-owner approval.`);
    } else if (record.visualApproval.approvedChecksum !== record.checksum) {
      problems.push(`${record.id}: approval is not bound to the current checksum — return to candidate.`);
    }
  }
  if (record.availabilityState !== deriveJarAvailability(record)) {
    problems.push(`${record.id}: availabilityState "${record.availabilityState}" contradicts the derived law "${deriveJarAvailability(record)}".`);
  }
  const isFallback = record.id === "tha-larder-jar-fallback-green";
  const isEmpty = record.id === "tha-larder-jar-empty";
  if ((isFallback || isEmpty) && record.canonicalFoodMappings.length !== 0) {
    problems.push(`${record.id}: the ${isEmpty ? "empty" : "fallback"} jar maps to no canonical food.`);
  }
  if (!isFallback && !isEmpty && record.canonicalFoodMappings.length === 0) {
    problems.push(`${record.id}: an ingredient family must carry at least one curated mapping.`);
  }
  return problems;
}

// ── § J.5 · The approved-only export contract — defined, not yet produced ─────

/**
 * The authoritative approved-only package definition. The production ZIP is NOT
 * created by the foundation (no artwork exists); this contract is what any
 * future export MUST satisfy, and `buildJarExportSet()` is the ONE function that
 * decides inclusion — the verifier proves it excludes everything unapproved.
 */
export const LARDER_JAR_EXPORT_CONTRACT = {
  packageLayout: [
    "assets/jars/ — the 27 approved transparent PNG masters, exactly",
    "manifest/asset-manifest.csv — one row per approved asset: id, filename, family, checksum, approvedAt",
    "manifest/asset-map.json — projection of the approved records (this register is the owner; the file is never edited by hand)",
    "manifest/visual-gap-register.json — projection of larderVisualGapRegister",
    "manifest/CLAUDE_ASSET_REFERENCE.md — generated reference for AI consumers",
    "README.md — package identity, contract version, completeness statement",
  ],
  rules: [
    "only approved assets are included",
    "every included checksum matches its live Home Owner approval",
    "runtime derivatives are excluded (masters only)",
    "rejected predecessors are excluded",
    "an incomplete package can never be reported complete",
  ],
} as const;

export interface JarExportSet {
  readonly included: ReadonlyArray<LarderJarAssetRecord>;
  readonly excluded: ReadonlyArray<{ readonly id: string; readonly reason: string }>;
  /** True ONLY when every one of the 27 registered assets is included. */
  readonly complete: boolean;
}

/** The ONE inclusion decision for any export or runtime manifest. Fail-closed. */
export function buildJarExportSet(
  records: ReadonlyArray<LarderJarAssetRecord> = larderJarAssetRegister,
): JarExportSet {
  const included: LarderJarAssetRecord[] = [];
  const excluded: Array<{ id: string; reason: string }> = [];
  for (const record of records) {
    const wellFormed = assertJarRecordWellFormed(record);
    if (wellFormed.length > 0) {
      excluded.push({ id: record.id, reason: `record not well-formed: ${wellFormed[0]}` });
    } else if (deriveJarAvailability(record) !== "available") {
      excluded.push({ id: record.id, reason: `not available (status: ${record.approvalStatus})` });
    } else {
      included.push(record);
    }
  }
  return {
    included,
    excluded,
    complete: included.length === records.length && records.length > 0,
  };
}
