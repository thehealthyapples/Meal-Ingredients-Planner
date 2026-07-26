/**
 * The Living Larder's shelves — the room's presentation vocabulary
 * (LARDER_CATEGORY_FIRST, 2026-07-24).
 *
 * WHAT THIS IS. One pure reading that answers a single question: *which shelf
 * of the pantry does this staple live on?* It is Layer 1 of the Two-Layer Law
 * (`LARDER2` § II.10) — presentation that **owns no fact** — and it stores
 * nothing, writes nothing, and adds no field to any owner.
 *
 * WHERE EACH ANSWER COMES FROM (`LARDER2` § II.11's zone → owner map, exactly):
 *
 *   • The household's own STORAGE PLACES are Domain 30's `category` — the
 *     enforced six (`larder · fruit · fridge · freezer · household · pet`).
 *     Five of them are shelves in their own right and are read straight from
 *     the owner; nothing here re-owns or re-splits them.
 *
 *   • Within the `larder` place, the finer shelves (Grains, Flours, Pasta,
 *     Pulses, Nuts & Seeds, Herbs & Spices, Oils & Fats) are
 *     **presentation-derived from Domain 2** — a reading of *what a food is*,
 *     resolved through Domain 2's own resolver (`resolveCanonicalFood`, the ONE
 *     resolver — `GOV2` Rule 5) and its own editorial family
 *     (`CANONICAL_SEED[].food.category` / `.subcategory`). No second stored
 *     categorisation is minted, and no keyword list, substring match or guess
 *     is used anywhere in this file.
 *
 *   • **If Domain 2 does not resolve a food's family, the item simply rests on
 *     the general larder shelf — an honest absence, never a guess**
 *     (`LARDER2` § II.11, verbatim; Core Principle 6).
 *
 * ONE DELIBERATE SECOND READING, AND WHY IT IS NOT A GUESS. Where the room is
 * already *showing* a staple as an approved jar, that jar's ingredient family
 * is the Life Register's own curated, Home-Owner-approved binding of the
 * household's words to a food (§ J `canonicalFoodMappings`). Asking Domain 2
 * for *that* family's shelf keeps the shelf and the artwork in agreement — a
 * jar of plain flour never stands anywhere but the Flours shelf. It is the same
 * curated mapping that decided the picture, read once more; it invents nothing.
 *
 * The room holds still (`LARDER3` `LIA5`): the shelf order below is fixed and
 * never sorted by the data. A shelf the household keeps nothing on is simply
 * not there — the pet-corner precedent (`LARDER2` § I.8), not an empty state.
 */

import { resolveCanonicalFood } from "@shared/canonical/resolver";
import { CANONICAL_SEED } from "@shared/canonical/foods";

/**
 * WHERE IN THE ROOM A SHELF STANDS (`LIVING_LARDER_CANONICAL_EXPERIENCE_REFINEMENT`,
 * 2026-07-24). The room is one architectural space, and every category has a
 * **berth** in it — a real place in the built-in, not a card in a grid.
 *
 *   `dry-store`    — a stretch of shelf in the open shelving on the BACK WALL.
 *   `working-wall` — hung on the LEFT RETURN, beneath the casement and in the
 *                    one morning. `LARDER5` § 9.2's elevation puts the spice
 *                    rack exactly here (`A5│spice`), and § 8.1 says why: the
 *                    things a household reaches for constantly belong in the
 *                    light, which is the room making the useful thing easy to
 *                    reach by ARCHITECTURE rather than by advice.
 *   `under-run`    — a piece of fitted furniture in the run beneath the worktop.
 *   `floor`        — a piece standing FORWARD on the flagstones (the room's own
 *                    worktable), which is what gives the one elevation its depth.
 *   `terminus`     — the tall store cupboard that ends the wall on the right,
 *                    rising PAST the worktop as it would in a real pantry.
 *
 * This is presentation, and only presentation: a berth stores nothing, writes
 * nothing, and adds no field to any owner. It answers *where does the household
 * keep this in the room they are looking at*, which is a question about the
 * picture, never about the data.
 */
export type LarderZone = "dry-store" | "working-wall" | "under-run" | "floor" | "terminus";

/**
 * The approved piece of joinery a berth is built from — one of the House
 * Register's byte-locked masters (`larder-room-metrics.ts` `JoineryId`), chosen
 * once here so the room's furniture plan is legible in one place. No new
 * artwork is implied by any value: every one of these already exists and is
 * already approved.
 */
export type LarderPiece =
  | "shelf"          /* an oak board in the dresser            → shelf-medium  */
  | "spice-rack"     /* the rack hung in its own bay           → spice-rack    */
  | "cold-cupboard"  /* the cold cupboard in the fitted run    → cupboard-double */
  | "deep-drawer"    /* the deep drawers in the fitted run     → drawer-deep   */
  | "small-drawers"  /* the little drawers at the run's end    → drawer-shallow */
  | "worktable"      /* the table standing forward on the floor → prep-table   */
  | "store-cupboard"; /* the tall cupboard ending the wall     → cupboard-single */

/** A shelf of the pantry. Presentation only — it owns no fact by existing. */
export interface LarderShelf {
  readonly id: string;
  /** The household's word for the shelf, as the shelf-edge label reads it. */
  readonly label: string;
  /**
   * `place` — one of Domain 30's own storage places, read from `category`.
   * `family` — a reading of Domain 2 identity, arranged within the `larder` place.
   */
  readonly kind: "place" | "family";
  /** For a `place` shelf: the Domain 30 category it presents. */
  readonly category?: string;
  /** What the shelf holds, in the household's words — used for the empty invitation. */
  readonly holds: string;
  /** Where in the room this category is kept. Presentation only. */
  readonly zone: LarderZone;
  /** The approved piece of furniture the berth is built from. Presentation only. */
  readonly piece: LarderPiece;
}

/**
 * THE SHELVES, in the one fixed order the room always draws them — which is now
 * also the room's **furniture plan**, read left to right and top to bottom as a
 * person standing at the door would read it: the dry store's own families on the
 * built-in's boards, then the household's other storage places in the run of
 * furniture beneath the worktop, and the tall store cupboard ending the wall.
 * Order is the room's, never the data's (`LARDER3` LIA5 — the room holds still).
 */
export const LARDER_SHELVES: ReadonlyArray<LarderShelf> = Object.freeze([
  { id: "grains", label: "Grains", kind: "family", holds: "grains and rice", zone: "dry-store", piece: "shelf" },
  { id: "flours", label: "Flours", kind: "family", holds: "flours", zone: "dry-store", piece: "shelf" },
  { id: "pasta", label: "Pasta", kind: "family", holds: "pasta", zone: "dry-store", piece: "shelf" },
  { id: "pulses", label: "Pulses", kind: "family", holds: "beans and lentils", zone: "dry-store", piece: "shelf" },
  { id: "nuts-seeds", label: "Nuts & Seeds", kind: "family", holds: "nuts and seeds", zone: "dry-store", piece: "shelf" },
  { id: "herbs-spices", label: "Herbs & Spices", kind: "family", holds: "herbs and spices", zone: "working-wall", piece: "spice-rack" },
  { id: "oils-fats", label: "Oils & Fats", kind: "family", holds: "oils", zone: "dry-store", piece: "shelf" },
  { id: "larder", label: "The rest of the larder", kind: "family", holds: "everything else kept on the shelves", zone: "dry-store", piece: "shelf" },
  { id: "fridge", label: "Kept Cold", kind: "place", category: "fridge", holds: "what is kept cold", zone: "under-run", piece: "cold-cupboard" },
  { id: "freezer", label: "Kept Frozen", kind: "place", category: "freezer", holds: "what is kept frozen", zone: "under-run", piece: "deep-drawer" },
  { id: "pet", label: "Pet Corner", kind: "place", category: "pet", holds: "the animals' own things", zone: "under-run", piece: "small-drawers" },
  { id: "household", label: "Household", kind: "place", category: "household", holds: "what keeps the house going", zone: "terminus", piece: "store-cupboard" },
  { id: "fruit", label: "Fruit & Veg", kind: "place", category: "fruit", holds: "fruit and vegetables", zone: "floor", piece: "worktable" },
]);

/** The general larder shelf — where an unresolved staple honestly rests. */
export const GENERAL_LARDER_SHELF = "larder";

export const shelfById = (id: string): LarderShelf =>
  LARDER_SHELVES.find((s) => s.id === id) ??
  LARDER_SHELVES.find((s) => s.id === GENERAL_LARDER_SHELF)!;

/** Domain 30 `category` → the place shelf that presents it (`larder` is the dry store). */
const PLACE_SHELF: Readonly<Record<string, string>> = {
  fruit: "fruit",
  fridge: "fridge",
  freezer: "freezer",
  household: "household",
  pet: "pet",
};

/** Domain 2 slug → its editorial family, read once from the seed. */
const SEED_FAMILY: ReadonlyMap<string, { category: string; subcategory: string | null }> =
  new Map(
    CANONICAL_SEED.map((e) => [
      e.food.slug,
      { category: e.food.category ?? "", subcategory: e.food.subcategory ?? null },
    ]),
  );

/**
 * Domain 2's editorial family → the pantry shelf that presents it. Every row is
 * a *reading* of a family Domain 2 already declares; a family absent from this
 * table is not guessed at — it rests on the general shelf.
 */
function shelfForFamily(category: string, subcategory: string | null): string | null {
  switch (category) {
    case "Grains":
      // Domain 2 files flours and pasta as grain subcategories; the pantry keeps
      // them on their own shelves, exactly as a household does.
      if (subcategory === "Flours") return "flours";
      if (subcategory === "Pasta") return "pasta";
      return "grains";
    case "Legumes":
      // Gram/chickpea flour is a legume flour — it belongs with the flours.
      if (subcategory === "Flours") return "flours";
      return "pulses";
    case "Nuts":
    case "Seeds":
      return "nuts-seeds";
    case "Herbs":
    case "Spices":
      return "herbs-spices";
    case "Healthy fats":
      // The family is broad: nut butters are kept with the nuts, oily fish is a
      // protein a household keeps cold or tinned, and neither is an oil.
      if (subcategory === "Nut butters") return "nuts-seeds";
      if (subcategory === "Oily fish") return null;
      return "oils-fats";
    default:
      return null;
  }
}

/** The one resolution: household words → Domain 2 family → shelf, or null. */
function shelfFromIdentity(...names: ReadonlyArray<string | null | undefined>): string | null {
  for (const name of names) {
    if (!name) continue;
    const slug = resolveCanonicalFood(name).canonicalSlug;
    if (!slug) continue;
    const family = SEED_FAMILY.get(slug);
    if (!family) continue;
    const shelf = shelfForFamily(family.category, family.subcategory);
    if (shelf) return shelf;
  }
  return null;
}

/**
 * Which shelf a staple lives on.
 *
 * @param storageCategory the household's own storage place (Domain 30 `category`)
 * @param displayName     the household's own words for it
 * @param ingredientKey   the same staple's normalised key (Domain 30)
 * @param jarFamily       the approved jar family the room is showing it as, if any
 *                        (Life Register § J — a curated Home-Owner-approved binding)
 */
export function shelfForStaple(
  storageCategory: string,
  displayName: string | null,
  ingredientKey: string,
  jarFamily?: string | null,
): string {
  const place = PLACE_SHELF[storageCategory];
  if (place) return place;

  // Within the dry store, the shelf is a reading of what the food IS.
  const byIdentity = shelfFromIdentity(displayName, ingredientKey);
  if (byIdentity) return byIdentity;

  // The artwork's own curated family, so shelf and picture never disagree.
  if (jarFamily) {
    const byArtwork = shelfFromIdentity(jarFamily.replace(/-/g, " "));
    if (byArtwork) return byArtwork;
  }

  return GENERAL_LARDER_SHELF;
}
