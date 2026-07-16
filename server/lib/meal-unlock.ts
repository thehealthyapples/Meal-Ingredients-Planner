/**
 * Meal Unlock (NTC-P2)
 * ====================
 * "Adding walnuts would unlock 3 meals you already have the rest of."
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT
 * ---------------------------------------------------------------------------
 * This is the WX7 pantry-opportunities computation, moved out of `server/routes.ts`.
 * The Notice Engine Architecture §7.2 named it as one of three ungoverned notice
 * channels — "WX7's pantry-opportunities block builds ad-hoc opportunities in
 * `routes.ts`" — and §8 scheduled its convergence as NTC-P2. This module is that
 * convergence, and the three things that were actually wrong with it are fixed here:
 *
 *   1. IT WAS A SECOND ENGINE INSIDE A ROUTE HANDLER. It computed a new metric — a
 *      count of meals unlocked per missing ingredient — inline in `routes.ts`, where
 *      nothing could test it and nothing owned it. It is now a pure function with an
 *      owner and a test.
 *   2. IT IMPERSONATED AN OD1 OPPORTUNITY. It was called `opportunity` while sharing no
 *      type with `DeliverableOpportunity`: un-muted, un-de-duplicated, un-resolvable,
 *      and citing nothing. It is now called what it is — a meal unlock — and it cites
 *      the meals it counted.
 *   3. THE CLIENT WROTE ITS PROSE. `PantryIntelligencePanel` composed the sentence
 *      itself, the one place in this surface family where the client authored words
 *      about a household's data. The sentence is composed HERE now, once, server-side.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS NOT AN OD1 OPPORTUNITY, AND NOT A NOTICE
 * ---------------------------------------------------------------------------
 * Both were considered under NTC-P2's gate, and both are wrong — recorded here rather
 * than quietly resolved, because the next person to read this will ask.
 *
 * NOT AN OD1 OPPORTUNITY. §8 admits new producers "where they earn it". This fact does
 * not, on two counts. It is FOOD-SCOPED: it exists only because the household opened a
 * panel about one specific food, so it is never *delivered* to a household and OD1's
 * lifecycle (`delivered → acknowledged → dismissed | accepted`) has nothing to
 * transition. And OD1's `subject` requires `{ entity, id: number, label }` — an existing
 * row. The unlock ingredient is precisely the thing the household DOES NOT HAVE: it has
 * no row and no id. The type system refuses it, and it is right to.
 *
 * NOT A NOTICE. §2.1 defines a Notice as a fact the household "did not ask about". The
 * household tapped this food. This is the answer to the question the panel asks — page
 * content, in the same family as the `mealSupport`, `household` and `simplyBetter`
 * sections rendered beside it, none of which are notices either. Running it through the
 * Silence Rules would make it compete for a household-moment attention budget it was
 * never spending.
 *
 * THE PROMOTION PATH IS NAMED, NOT TAKEN. A HOUSEHOLD-scoped version of this fact —
 * "the one ingredient that would unlock the most meals for you" — has a subject, has a
 * delivery, would be muteable and resolvable, and WOULD earn `OPPORTUNITY_SOURCES`
 * registration. It is a candidate for NTC-P3. Building it here would be a product
 * change disguised as a convergence, which is the mistake PHASE5B explicitly declined
 * to make.
 *
 * ---------------------------------------------------------------------------
 * PURE. No I/O, no storage, no platform. It takes already-fetched pantry items and
 * already-fetched meals and returns a value — so every rule below is unit-testable
 * without a database, and "nothing to say" is a correct, complete answer of `null`.
 * ---------------------------------------------------------------------------
 */

import type { EvidenceCitation } from "../../shared/attention/decision";

/** A meal, narrowed to the two fields this computation reads. */
export interface UnlockMealLike {
  readonly name: string;
  readonly ingredients: readonly string[] | null;
}

export interface MealUnlock {
  /** The canonical name of the ONE ingredient the household is missing. */
  readonly ingredient: string;
  /** How many meals adding it would unlock. */
  readonly mealCount: number;
  /** Up to three of those meals, named. */
  readonly meals: readonly string[];
  /**
   * The sentence the surface renders. Composed HERE — the client renders it verbatim and
   * writes no prose of its own.
   */
  readonly text: string;
  /**
   * What this claim rests on, cited. Rule E1 — no citation, no card: this fact counts
   * real meals against a real pantry, and it now says so rather than asserting a number
   * a household cannot check.
   */
  readonly evidence: readonly EvidenceCitation[];
}

/**
 * How many meal names the sentence may cite. Unchanged from the WX7 original — this is a
 * presentation cap on an already-complete count, not a threshold on the fact.
 */
const MAX_CITED_MEALS = 3;

/**
 * Find the single ingredient that, if the household had it, would unlock the most meals
 * containing `slug` for which they already have everything else.
 *
 * `resolve` is the shared canonical resolver, injected rather than imported so this module
 * stays pure and testable. It is the SAME resolver the pantry route already used — no
 * second identity space.
 *
 * Returns `null` when no real meal supports the claim. Silence, never a fabricated
 * stand-in: the section simply disappears, exactly as it did before.
 */
export function findMealUnlock(
  slug: string,
  pantryItems: readonly { readonly displayName: string | null; readonly ingredientKey: string; readonly isDeleted: boolean | null }[],
  meals: readonly UnlockMealLike[],
  resolve: (name: string) => { canonicalSlug?: string | null; canonicalName?: string | null },
): MealUnlock | null {
  // What the household already has.
  const pantrySlugs = new Set<string>();
  for (const item of pantryItems) {
    if (item.isDeleted) continue;
    const r = resolve(item.displayName || item.ingredientKey);
    if (r.canonicalSlug) pantrySlugs.add(r.canonicalSlug);
  }

  // missingSlug → the meals it would unlock.
  const unlock = new Map<string, { meals: string[]; name: string }>();

  for (const meal of meals) {
    const slugs = new Set<string>();
    const slugName = new Map<string, string>();
    for (const ing of meal.ingredients ?? []) {
      const r = resolve(ing);
      if (r.canonicalSlug) {
        slugs.add(r.canonicalSlug);
        if (!slugName.has(r.canonicalSlug)) {
          slugName.set(r.canonicalSlug, r.canonicalName || ing);
        }
      }
    }

    // The meal must contain the viewed food, and the household must lack EXACTLY ONE
    // other canonical ingredient. "Exactly one" is the whole honesty of the claim: it is
    // what makes "you already have the rest of" true rather than nearly true.
    if (!slugs.has(slug)) continue;
    const missing = Array.from(slugs).filter((s) => s !== slug && !pantrySlugs.has(s));
    if (missing.length !== 1) continue;

    const missSlug = missing[0];
    const acc = unlock.get(missSlug);
    if (acc) {
      acc.meals.push(meal.name);
    } else {
      unlock.set(missSlug, { meals: [meal.name], name: slugName.get(missSlug) ?? missSlug });
    }
  }

  // The ingredient that unlocks the most meals. Ties break on the first seen, which is
  // stable because `meals` arrives in a stable order — deterministic, no clock, no random.
  let best: { slug: string; meals: string[]; name: string } | null = null;
  for (const [missSlug, acc] of Array.from(unlock)) {
    if (!best || acc.meals.length > best.meals.length) {
      best = { slug: missSlug, ...acc };
    }
  }
  if (!best) return null;

  const mealCount = best.meals.length;
  const cited = best.meals.slice(0, MAX_CITED_MEALS);

  return {
    ingredient: best.name,
    mealCount,
    meals: cited,
    text: `Adding ${best.name} would unlock ${mealCount} ${mealCount === 1 ? "meal" : "meals"} you already have the rest of.`,
    evidence: [
      {
        source: "cookbook-meals",
        detail:
          cited.length > 0
            ? `Such as ${cited.join(", ")}.`
            : `${mealCount} ${mealCount === 1 ? "meal" : "meals"} in your cookbook.`,
      },
      {
        source: "pantry-items",
        detail: `You already have every other ingredient ${mealCount === 1 ? "it" : "they"} need.`,
      },
    ],
  };
}
