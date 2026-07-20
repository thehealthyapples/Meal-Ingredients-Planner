/**
 * COOKBOOK1 — Cookbook Curation
 * =============================
 * The single owner of the question **"what belongs on the Cookbook shelf, and
 * under what name?"**
 *
 * WHY THIS EXISTS
 * ---------------
 * `EXPREVIEW1` (docs/investigations/EXPREVIEW1_FIRST_TIME_HOUSEHOLD_EXPERIENCE.md
 * § 6) found the Cookbook to be the worst room in the house, and the finding was
 * not a design finding:
 *
 *   > "Twelve cards. One combinatorial engine. A visible loop over {black bean,
 *   >  butter bean, cannellini bean, chicken thigh} × {cabbage, celery} ×
 *   >  {beetroot, cucumber, tomato}. And at the end of it, a recipe whose name
 *   >  ends in the digit 2, because the machine collided with itself and
 *   >  appended an integer."
 *
 * The room had no way to tell an authored recipe from a generated one, because
 * nothing in THA owned that distinction. Every one of the 500 rows in the
 * founding import carries `acquisition_type: "authored"` — including the 490
 * that were emitted from a template. The provenance record asserts authorship
 * that did not happen, so the Cookbook could only present all 500 as equals and
 * the household could only conclude, correctly, that it was looking at machine
 * output.
 *
 * This module is where that distinction now lives, once.
 *
 * WHAT THIS OWNS
 * --------------
 *   - The shelf vocabulary (`CookbookShelf`) and the order shelves are read in.
 *   - The rule that assigns a meal to a shelf (`shelfForMeal`).
 *   - The recognition of the generated cohort (`isGeneratedLibraryName`).
 *   - The names shelves are given in the interface (`SHELF_LABELS`).
 *
 * WHAT THIS DOES NOT OWN
 * ----------------------
 *   - The meal itself. `meals` (shared/schema.ts) remains the sole owner of a
 *     recipe and of its ownership; this module reads a meal and returns a label
 *     for it. It stores nothing, and it creates no second record of a recipe.
 *   - Acquisition provenance. `shared/recipe-acquisition.ts` owns the four
 *     lanes. This module deliberately does NOT read `acquisitionType`, because
 *     on the founding import that field is wrong (see above). When the owner
 *     corrects the provenance of the generated cohort, this module should read
 *     it and `isGeneratedLibraryName` should be retired in the same change.
 *   - The planner, the intelligence platform, or canonical food. Nothing here
 *     touches any of them.
 *
 * ARCHITECTURE NOTE (GEA17 — the presentation layer owns no fact)
 * --------------------------------------------------------------
 * The Cookbook page previously derived its own sections from a private
 * `getMealDisplayCategory()` with a private `SECTION_LABELS` map. That was the
 * presentation layer owning a fact. This module is the successor, and it
 * retires that predecessor in the same change (GEA18).
 */

import type { Meal } from "../schema";

// ── The shelves ──────────────────────────────────────────────────────────────

/**
 * A cookbook has shelves, not categories. The distinction is not cosmetic: a
 * category is a property of a recipe, a shelf is a decision about where it
 * lives — and a family cookbook is defined by that decision far more than by
 * its contents.
 */
export type CookbookShelf =
  /** Recipes this household wrote down or imported for themselves. Theirs. */
  | "household"
  /** The ten recipes a person actually wrote for THA. The founding cookbook. */
  | "kitchen"
  /** Recipes the household brought in from the web. */
  | "web"
  /**
   * The 490 template-generated variations from the founding import.
   *
   * These are not deleted and they are not hidden — they remain owned by the
   * meal record exactly as before, they remain fully searchable, and the
   * planner can still reach every one of them. They are simply not *shelved*:
   * a browsing household does not meet them, because meeting 490 permutations
   * of three vegetables is the specific experience EXPREVIEW1 identified as the
   * thing that stops a household believing the house.
   */
  | "library"
  /** Packaged products. Information, not cooking. */
  | "packaged"
  /** Drinks. */
  | "drinks";

/**
 * Reading order. The household's own food comes first, always — `EXPGOV1`
 * § 12.2: *"life comes from the household, not from decoration. The fix for a
 * lifeless room is more of the household, not more of THA."*
 */
export const SHELF_ORDER: readonly CookbookShelf[] = [
  "household",
  "kitchen",
  "web",
  "packaged",
  "drinks",
  "library",
] as const;

/**
 * What each shelf is called in the room.
 *
 * "Wholefood Suggestions" is retired here. It was the label on the 500, and it
 * was wrong twice: the room does not suggest (GEA21 — rooms report, they never
 * counsel), and what sat beneath it was not a set of suggestions but a library.
 */
export const SHELF_LABELS: Record<CookbookShelf, string> = {
  household: "Your recipes",
  kitchen: "From the THA kitchen",
  web: "Saved from the web",
  packaged: "Packaged & processed",
  drinks: "Drinks",
  library: "The wider library",
};

/**
 * The shelves a household meets when they walk in and browse.
 *
 * `library` is absent by design. It is reached by searching for it, or by
 * asking for it explicitly — never by scrolling into it.
 */
export const BROWSABLE_SHELVES: readonly CookbookShelf[] = [
  "household",
  "kitchen",
  "web",
  "packaged",
  "drinks",
] as const;

// ── Recognising the generated cohort ─────────────────────────────────────────

/**
 * The founding import's generator emitted names from one template:
 *
 *     {Cuisine}-Style {Protein}, {Vegetable} & {Vegetable} {Format}
 *
 * with `British` standing in for the cuisine prefix on the British run, and a
 * collision integer appended whenever the template collided with itself. The
 * integers reach **9** — the import contains 118 suffixed names, not the single
 * "Rice Bowl 2" EXPREVIEW1 happened to land on.
 *
 * Matching the cuisine prefix is what separates the cohort, and it separates it
 * exactly: 490 generated, 10 authored, with no authored name carrying a
 * collision integer. The authored ten are recognisable to a person on sight —
 * "Gentle Taco Rice Bowls", "Lentil & Root Vegetable Cottage Pie" — and none of
 * them carries a cuisine-template prefix.
 *
 * This is a name-shape rule, and a name-shape rule is a thing to be embarrassed
 * about rather than proud of. It is here because the field that *should* carry
 * this fact — `meals.acquisitionType` — asserts "authored" for all 500. See § 8
 * of the implementation report: persisting the classification, and correcting
 * the provenance, is an owner decision this change deliberately does not take
 * on its own authority.
 */
const GENERATED_NAME = /^(?:.+?-[Ss]tyle |British (?=.+, .+ & .+))/;

export function isGeneratedLibraryName(name: string): boolean {
  return GENERATED_NAME.test(name);
}

/**
 * The collision integer the generator appended when it produced a name it had
 * already produced. Purely a defect marker — `" 2"` through `" 9"` at the end
 * of a generated name.
 */
export const COLLISION_SUFFIX = / (\d+)$/;

export function hasCollisionSuffix(name: string): boolean {
  return isGeneratedLibraryName(name) && COLLISION_SUFFIX.test(name);
}

/**
 * A capitalisation defect in the generated cohort: the cuisine token was
 * lower-cased mid-title by the generator, producing "Australian cafe-Style" and
 * "French country-Style". Unlike the collision integers, this one is
 * unambiguously repairable without changing which recipe a name refers to.
 */
export function repairCuisineCapitalisation(name: string): string {
  return name.replace(
    /\b([A-Za-z]+)-[Ss]tyle\b/g,
    (_m, word: string) =>
      `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}-style`,
  );
}

// ── Assigning a meal to a shelf ──────────────────────────────────────────────

/**
 * The one rule. Order matters: a drink that is also a packaged product is a
 * drink, and a generated library recipe is only ever reached after every
 * household-owned classification has been ruled out.
 *
 * This is the successor to `meals-page.tsx`'s private
 * `getMealDisplayCategory()`, which is retired in the same change (GEA18).
 */
export function shelfForMeal(meal: Pick<
  Meal,
  "name" | "isDrink" | "mealFormat" | "isReadyMeal" | "mealSourceType" | "isSystemMeal" | "sourceUrl"
>): CookbookShelf {
  if (meal.isDrink || meal.mealFormat === "drink") return "drinks";
  if (meal.isReadyMeal || meal.mealFormat === "ready-meal") return "packaged";
  if (meal.mealSourceType === "openfoodfacts") return "packaged";
  if (meal.isSystemMeal) {
    return isGeneratedLibraryName(meal.name) ? "library" : "kitchen";
  }
  if (meal.sourceUrl) return "web";
  return "household";
}

/** Is this meal one a browsing household should meet without asking? */
export function isShelved(meal: Parameters<typeof shelfForMeal>[0]): boolean {
  return BROWSABLE_SHELVES.includes(shelfForMeal(meal));
}
