/**
 * The Dressing Register — the Environmental Dressing Runtime (ED2 · LIVINGHOME2 § 10.3).
 *
 * This is the single source of truth for the Living Home's THIRD register:
 * **Environmental Dressing** — claim-free objects of the home's own hospitality
 * (a bowl of apples, a folded blanket, pumpkins by the door) that turn only with
 * the year, identical for every household, asserting nothing about any of them.
 *
 *   House  = never changes  (docs/implementation/assets/house-asset-register.json)
 *   Life   = the household's true data, data-borne or dead  (living-details-manifest.ts)
 *   ▶ Dressing = the home quietly lives — the narrow middle THIS module owns.
 *
 * ── LH1 status: ONE admitted item — the Standing Welcome. ───────────────────────
 * The register was DELIBERATELY EMPTY through ED2. LH1 (LIVINGHOME2 Phase 3) admits
 * the FIRST item — a bowl of apples (§ 3, `STANDING_WELCOME_BOWL_OF_APPLES`) — through
 * the full admission pipeline (LHDC1 § 21) with its Home Owner approval recorded. This
 * module remains the *runtime and the shape* — one register, one loader, one placement
 * resolver, one runtime resolver, one renderer interface + shell, placement validation,
 * and the admission hook, built to the ED1 § 5–§ 7 contract — and is now also the one
 * governed place that decides the one admitted item. Further items are admitted one at
 * a time (LH2, § 5), never as a batch (ED10).
 *
 * ── The visible mouth. ──────────────────────────────────────────────────────────
 * This is a PURE data + logic module: no React, no asset import, no DOM. The
 * DOM-painting mouth (`client/src/components/layout/dressing-layer.tsx`) consumes this
 * module and is the ONE surface that imports the still asset and paints it — mounted by
 * the shell's room threshold into the committed E2 window band (EXP3 § 7.1 / UIA § 17:
 * the mouth lands WITH its first consumer, which it now has). The renderer is still,
 * wordless, aria-hidden, pointer-events-none (ED7). `scripts/ci/verify-living-home-assets.ts`
 * also reads this module (a script importer is not a client consumer).
 *
 * ── The forbidden things are inexpressible, not merely discouraged. ──────────────
 * A `DressingItem` has NO field for a data binding, text, a count, a door, an
 * interaction, motion, an hour key, a campaign, or a household id (ED1 § 5). The
 * type system refuses them; the runtime `assertAdmissible()` and the verifier's
 * `dressingChecks()` refuse them a second time, at read time, over the serialised
 * register — so a future author cannot slip one in without deleting the comment that
 * says why they may not.
 *
 * Owner of the LAW: `LIVING_HOME_ENVIRONMENTAL_DRESSING_ARCHITECTURE.md` (LIVINGHOME2,
 * ED1–ED12). Owner of WHEN it turns: `shared/seasonal/season-rule.ts` (Domain 11,
 * HT17) — consumed here, never derived. Owner of WHETHER an occasion may dress: the
 * future `household_traditions` domain (LIVINGHOME1 § 7), read as a permission only.
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1 · Vocabulary (Domain-11 season only — no dates, no clocks, no hours)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The ONLY axis of variation for a dressing item (ED6 · HT13/HT17). Domain-11
 * season vocabulary. NO hour, NO date, NO clock — the year turns, never the hour.
 */
export type SeasonKey = "spring" | "summer" | "autumn" | "winter" | "year-round";

/** The shell's room ids a placement may name. Kept open to track the shell's vocabulary. */
export type RoomId =
  | "home"
  | "cookbook"
  | "pantry"
  | "larder"
  | "nutrition"
  | "diary"
  | "orchard"
  | "planner"
  | "shopping"
  | "analyser"
  | "household"
  | "admin"
  | (string & {});

/**
 * A region the house already commits (EXP3 § 5 band regions). Dressing adds NO new
 * region — it composes inside what the house already owns, so no layout shift is
 * possible (ED5 · EXP3 § 9).
 */
export type CommittedRegion = string;

// ─────────────────────────────────────────────────────────────────────────────
// § 2 · The item shape — what CAN be expressed is the whole design
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A reference to a household-DECLARED occasion + its explicit dressing permission
 * (LIVINGHOME2 § 7.2). A permission, NEVER content: the dressing renders the home's
 * welcome, not the household's declaration.
 */
export interface CelebrationBinding {
  /** A declared tradition id (LIVINGHOME1 § 7). Read as a permission, never shown. */
  readonly occasionRef: string;
  /** Structurally always true: no occasion dresses without the household's leave. */
  readonly requiresDressingPermission: true;
}

/**
 * Where a dressing item may render — and, as importantly, where it is REFUSED
 * (LIVINGHOME2 § 5.1). Placement is legibility, not layout.
 */
export interface PlacementSpec {
  /** A region the house already owns — dressing adds none (EXP3 § 5). */
  readonly region: CommittedRegion;
  /** Rooms where THIS item's context would make it read as the room's data (§ 5.1). */
  readonly refusedRooms: ReadonlyArray<RoomId>;
}

/** How a dressing item is painted: a still asset at a declared strength. Nothing else. */
export interface RendererRef {
  /** A bundler-hashed STILL asset under assets/living-home/dressing/. No motion, ever. */
  readonly assetId: string;
  /** The ED7 strength ceiling; never tuned per surface (UIA § 15). */
  readonly strengthToken: string;
}

/**
 * One admitted dressing item. What is ABSENT here IS the platform (ED1 § 5):
 *   • no `binding` ....... a data binding defines the LIFE register — its presence
 *                          here is the § 9.10 forgery (build failure)
 *   • no `text`/`copy` ... dressing is wordless (ED4/ED7)
 *   • no `count`/`status`  dressing carries zero information (ED4)
 *   • no `href`/`onClick`  dressing is not a door and not interactive (ED4)
 *   • no `motion` ........ dressing is still (ED7)
 *   • no `hourKey`/`time`  no hour-of-day dressing, ever (ED6/HT13)
 *   • no `campaignId` .... dressing is never a channel / product-event mark (ED11)
 *   • no `householdId`/`segment`  no per-household dressing, variant, or experiment (ED1)
 * There is no field for any of them, and `FORBIDDEN_DRESSING_KEYS` proves it at read time.
 */
export interface DressingItem {
  /** Item id, admitted by name (ED10). */
  readonly id: string;
  /** The admission document id — no anonymous charm (ED10). */
  readonly admissionDocId: string;
  /** The ED8 named hospitality (welcome/comfort/care/the year's passage). "It looks nice" is refused. */
  readonly hospitalityPurpose: string;
  /** The ONLY axis of variation (ED6). */
  readonly season: SeasonKey;
  /** Present only for a § 7.2-gated celebration item; absent for standing/seasonal items. */
  readonly celebration?: CelebrationBinding;
  /** Where it renders, and where it is refused (§ 5.1). */
  readonly placement: PlacementSpec;
  /** How it is painted — still, wordless, decorative-declared (ED7). */
  readonly render: RendererRef;
  /** Constancy proof — byte-constant within a registered season state (EXP3 § 4.4 manner). */
  readonly checksum: string;
}

/**
 * The whole immutable Dressing Register. One collection, one checksum, keyed only by
 * season. **Empty is a valid, lawful register — and is the state at ED2.**
 */
export interface DressingRegistry {
  readonly items: ReadonlyArray<DressingItem>;
  /** sha256 over `canonicalizeItems(items)`; the verifier recomputes and compares. */
  readonly checksum: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3 · The register itself — the first admitted item (LH1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical, deterministic serialisation the checksum is taken over. Exported so
 * the verifier hashes the EXACT same bytes — one definition, no drift (one-owner-per-fact).
 */
export function canonicalizeItems(items: ReadonlyArray<DressingItem>): string {
  return JSON.stringify(items);
}

/**
 * LH1 — THE STANDING WELCOME. The first admitted Environmental Dressing object
 * (LIVINGHOME2 Phase 3 / § 5): **a bowl of apples**, the home's quiet signature and
 * the house's own fruit, set out year-round. It claims nothing about any household
 * (ED3) — it is the same bowl on every household's sill, offered to a family who has
 * not yet unpacked (§ 7.3). Admitted against the Living Home Design Constitution
 * (LHDC1): warm, matte, hand-thrown ceramic, the orchard's living red-green, lit by
 * the one morning, still and wordless.
 *
 * Admission evidence: `docs/implementation/assets/dressing/standing-welcome-bowl-of-apples.admission.md`
 * (LHDC1 § 21 — Home Owner approval recorded there, § 20).
 *
 * Placement (§ 5.1 · LHDC1 § 17): it renders on the sill of the committed E2 window
 * band, in the browsing/reflective rooms where a bowl on the windowsill reads
 * unmistakably as the home's warmth. It is REFUSED in:
 *   • pantry / larder — § 5.1 produce law (a bowl of apples there reads as YOUR stock);
 *   • nutrition — LHDC1 § 17 per-placement legibility (in the diet room a bowl of fruit
 *     could be read as dietary advice — a claim/coaching the layer must never make, ED3).
 * The no-view rooms (planner, shopping, analyser, household, admin) never render it
 * because the mouth only composes where the house commits an E2 region — an exposure
 * fact the mouth owns, kept separate from these legibility refusals.
 */
export const STANDING_WELCOME_BOWL_OF_APPLES: DressingItem = {
  id: "standing-welcome-bowl-of-apples",
  admissionDocId:
    "docs/implementation/assets/dressing/standing-welcome-bowl-of-apples.admission.md",
  hospitalityPurpose:
    "The home's standing welcome: a bowl of the house's own apples set out on the " +
    "windowsill, so a household arriving tired at the end of a day finds the home " +
    "already warm — offered to everyone alike, in every season, asking and claiming " +
    "nothing about anyone.",
  season: "year-round",
  placement: {
    region: "room-threshold-sill",
    refusedRooms: ["pantry", "larder", "nutrition"],
  },
  render: {
    assetId: "standing-welcome-bowl-of-apples",
    strengthToken: "--dressing-strength",
  },
  // sha256 of the still asset's bytes (standing-welcome-bowl-of-apples.svg) — the
  // object's constancy proof (EXP3 § 4.4 manner). Recomputed in the SAME commit that
  // changes the asset; the verifier hashes the file and compares (dressingChecks D8).
  checksum: "d3e66b7514971aee71567f3e348ce72c08de73c1aa118975105cf408b4ee4243",
};

/**
 * sha256 over `canonicalizeItems(items)` — the whole register's constancy proof.
 * Recomputed IN THE SAME COMMIT that changes the items (EXP3 § 4.4), enforced by
 * `dressingChecks()` D1. (Empty-register value was
 * 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945 = sha256("[]"),
 * kept here for traceability of the byte the register turned from.)
 */
export const DRESSING_REGISTER_CHECKSUM = "75aef6f8d8f9f140747bf2127c51fe0e0a9040d6a5ce102ab2560dc54f17c1fc";

/**
 * THE REGISTER — one admitted item at LH1: the Standing Welcome. The year turns by
 * admitting further items one at a time (LH2, § 5), never as a batch (ED10).
 */
export const dressingRegister: DressingRegistry = {
  items: [STANDING_WELCOME_BOWL_OF_APPLES],
  checksum: DRESSING_REGISTER_CHECKSUM,
};

// ─────────────────────────────────────────────────────────────────────────────
// § 4 · The register loader — the one door onto the register
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load the Dressing Register. The single accessor everything else reads through, so
 * there is exactly one door onto the register's contents. Returns a frozen view — the
 * runtime cannot mutate the register (it turns only between reviewed, registered
 * states, never at runtime — ED6 · § 7.1).
 */
export function loadDressingRegister(): DressingRegistry {
  return Object.freeze({
    items: Object.freeze([...dressingRegister.items]),
    checksum: dressingRegister.checksum,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5 · Placement — the room-subject law (LIVINGHOME2 § 5.1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The kinds of dressing whose CONTEXT would turn them into a claim about the household
 * if placed in a room whose subject is that same data. A `DressingItem` does not carry
 * a "kind" field (it carries no information); a kind is inferred at ADMISSION from the
 * item's asset/hospitality purpose and encoded as `refusedRooms` on its `PlacementSpec`.
 * This map is the law the verifier checks admissions against.
 */
export const PLACEMENT_EXCLUSIONS: Readonly<Record<string, ReadonlyArray<RoomId>>> = Object.freeze({
  /** No produce dressing in the Pantry/Larder room — a bowl of apples there reads as YOUR pantry (ED3). */
  produce: ["pantry", "larder"],
  /** No book dressing in the Cookbook room — an unlabelled book there reads as YOUR collection (ED3). */
  book: ["cookbook"],
  /** No meal-shaped dressing in the Planner — reads as YOUR plan (ED3). */
  meal: ["planner"],
});

/** True if this item is refused in this room by its own placement spec (§ 5.1). */
export function isPlacementRefused(item: DressingItem, room: RoomId): boolean {
  return item.placement.refusedRooms.includes(room);
}

/**
 * Placement resolver: of the items handed in, those NOT refused in this room. Pure.
 * For the empty register this is always `[]`.
 */
export function resolvePlacement(items: ReadonlyArray<DressingItem>, room: RoomId): DressingItem[] {
  return items.filter((item) => !isPlacementRefused(item, room));
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 · The runtime resolver — pure, deterministic, clock-free
// ─────────────────────────────────────────────────────────────────────────────

export interface DressingResolveInput {
  /** The register to resolve against (defaults to the canonical one). */
  readonly registry?: DressingRegistry;
  /** The room being rendered. */
  readonly room: RoomId;
  /** The Domain-11 season answer (consumed, never derived — HT17). */
  readonly season: SeasonKey;
  /** Occasions the household has DECLARED and explicitly permitted dressing for (§ 7.2). */
  readonly permittedOccasions?: ReadonlySet<string>;
}

/**
 * Resolve which dressing items are present for a given room + season. Pure and
 * clock-free (ED6 · HT14 — no scheduler): the same inputs always yield the same
 * result, so the home feels stable. An item is present iff
 *   • its season matches (season key or "year-round"), AND
 *   • the room does not refuse it (§ 5.1), AND
 *   • for a celebration item, its occasion is in `permittedOccasions` (§ 7.2 —
 *     fail-closed: no permitted set ⇒ no celebration dressing).
 *
 * **For the empty register this returns `[]` in every room and every season** — the
 * whole point of ED2. It NEVER covers honest absence: an empty result is an honest
 * empty result, not a placeholder (ED1 § 4.1 invariant 6).
 */
export function resolveDressing(input: DressingResolveInput): DressingItem[] {
  const registry = input.registry ?? loadDressingRegister();
  const permitted = input.permittedOccasions ?? new Set<string>();

  const bySeason = registry.items.filter(
    (item) => item.season === input.season || item.season === "year-round",
  );
  const byRoom = resolvePlacement(bySeason, input.room);
  return byRoom.filter((item) => {
    if (!item.celebration) return true; // standing / seasonal — no permission needed
    return permitted.has(item.celebration.occasionRef); // celebration — fail-closed
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7 · The renderer — interface + shell (DOM mouth lands at ED3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One descriptor the mouth paints: a still image at a declared strength, in a
 * committed region. There is NO field for text, motion, or an interaction handler —
 * the renderer cannot express them (ED4/ED7).
 */
export interface DressingRenderDescriptor {
  readonly assetId: string;
  readonly region: CommittedRegion;
  readonly strengthToken: string;
  /** Always decorative — aria-hidden, empty alt, pointer-events-none at the mouth (ED7). */
  readonly decorative: true;
}

/** A resolved render plan. `descriptors: []` means the mouth paints nothing. */
export interface DressingRenderPlan {
  readonly descriptors: ReadonlyArray<DressingRenderDescriptor>;
}

/**
 * The renderer SHELL: map resolved items → a render plan of still, wordless,
 * decorative descriptors. This is the one renderer; the DOM-painting React mouth
 * (`dressing-layer.tsx`, DECLARED-NOT-BUILT) will consume this plan when it lands with
 * the first item (ED3). **For the empty register this returns an empty plan — the
 * renderer produces no output.**
 */
export function toRenderPlan(items: ReadonlyArray<DressingItem>): DressingRenderPlan {
  return {
    descriptors: items.map((item) => ({
      assetId: item.render.assetId,
      region: item.placement.region,
      strengthToken: item.render.strengthToken,
      decorative: true as const,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8 · Admission hooks + placement validation — the read-time refusals
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The keys that must NEVER appear on a dressing item. The type system already forbids
 * them; this list refuses them a second time at read time (over the serialised
 * register), because JSON has no types. A `binding` here is the § 9.10 forgery (it is
 * precisely what defines the LIFE register); the rest carry information, motion, an
 * hour, a channel, or a household — none of which dressing may hold.
 */
export const FORBIDDEN_DRESSING_KEYS: ReadonlyArray<string> = Object.freeze([
  "binding",
  "text",
  "copy",
  "label",
  "count",
  "status",
  "href",
  "onclick",
  "onClick",
  "motion",
  "animation",
  "transition",
  "hourkey",
  "hourKey",
  "time",
  "clock",
  "campaignid",
  "campaignId",
  "event",
  "householdid",
  "householdId",
  "segment",
  "variant",
  "experiment",
]);

/**
 * Placement validation (§ 5.1): the item's declared `refusedRooms` must cover every
 * room its inferred kind excludes. Returns violation messages; empty ⇒ valid.
 * `kind` is supplied at admission (it is NOT stored on the item — dressing carries no
 * information); it is used only to check the declared placement against the law.
 */
export function validatePlacement(item: DressingItem, kind?: keyof typeof PLACEMENT_EXCLUSIONS): string[] {
  const problems: string[] = [];
  if (!kind) return problems;
  const mustRefuse = PLACEMENT_EXCLUSIONS[kind] ?? [];
  for (const room of mustRefuse) {
    if (!item.placement.refusedRooms.includes(room)) {
      problems.push(
        `${item.id}: a "${kind}" item must refuse the "${room}" room (§ 5.1) — add it to placement.refusedRooms.`,
      );
    }
  }
  return problems;
}

/**
 * The admission hook (ED10): validate one candidate item against the runtime's
 * non-negotiable requirements. Returns violation messages; empty ⇒ admissible.
 * This is the single guard every admitted item passes; the register is empty today,
 * so it guards a future ED3 admission, not a present one.
 */
export function assertAdmissible(item: DressingItem): string[] {
  const problems: string[] = [];
  if (!item.id) problems.push("item lacks an id (ED10 — admitted by name).");
  if (!item.admissionDocId) problems.push(`${item.id || "item"}: lacks admissionDocId (ED10 — no anonymous charm).`);
  if (!item.hospitalityPurpose || !item.hospitalityPurpose.trim()) {
    problems.push(`${item.id || "item"}: lacks a named hospitalityPurpose (ED8 — "it looks nice" is refused).`);
  }
  const SEASONS: SeasonKey[] = ["spring", "summer", "autumn", "winter", "year-round"];
  if (!SEASONS.includes(item.season)) {
    problems.push(`${item.id || "item"}: season "${item.season}" is not a Domain-11 key (ED6/HT17).`);
  }
  if (item.celebration && item.celebration.requiresDressingPermission !== true) {
    problems.push(`${item.id}: a celebration item must require dressing permission (§ 7.2 — fail-closed).`);
  }
  // Second-line refusal: no forbidden key present on the serialised item.
  const serialised = JSON.stringify(item).toLowerCase();
  for (const key of FORBIDDEN_DRESSING_KEYS) {
    const needle = `"${key.toLowerCase()}"`;
    if (serialised.includes(needle)) {
      problems.push(`${item.id || "item"}: carries forbidden field matching "${key}" — dressing is claim-free, still, wordless, and never a channel (ED1 § 5).`);
    }
  }
  return problems;
}
