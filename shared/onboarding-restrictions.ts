/**
 * SURF1B3 — The onboarding dietary routing contract.
 *
 * ── What this module owns ────────────────────────────────────────────────────
 * Exactly one thing: **which onboarding selections are hard safety facts, and
 * which are soft preferences.** It is a routing rule, not a rules engine.
 *
 * It defines **no food, no allergen and no keyword.** Every judgement about what a
 * declared string *means* is delegated to the canonical restriction library
 * (`shared/restrictions/`), which remains the single owner of restriction
 * knowledge (ARCHITECTURE_PRINCIPLES.md, Principle 2). A test scans this file's
 * source and fails if a food keyword ever appears in it — the same guard SURF1B
 * put on the household safety resolver.
 *
 * ── The defect this closes ───────────────────────────────────────────────────
 * Onboarding asked "Allergies or intolerances" and wrote every answer to
 * `user_preferences.excluded_ingredients` — the column SURF1B classifies as
 * *"soft, advisory, never a safety gate"*. It never wrote `users.diet_restrictions`,
 * the authoritative hard-restriction owner that the household safety resolver, the
 * meal safety gate and the AI context all read.
 *
 * A household that declared a nut allergy during onboarding, and never afterwards
 * visited the Profile page, was carried as a **preference**: the Companion was told
 * "try to avoid nuts" rather than "never violate this", and `isMealSafeForHousehold()`
 * — the one gate that can refuse a meal — could not see the allergy at all.
 *
 * ── The vocabulary trap this avoids ──────────────────────────────────────────
 * Onboarding's chips were keyed `nuts`/`dairy`/`gluten`; the Profile's chips are
 * keyed `Nuts`/`Dairy-Free`/`Gluten-Free`. Routing the onboarding value *verbatim*
 * into `users.diet_restrictions` would have stored a restriction the Profile page
 * cannot render as selected, and — before SURF1B3 widened that door — could not
 * re-save without a 400.
 *
 * So a promoted value is written in the vocabulary the profile owns. That mapping is
 * **derived from the canonical library, never hand-written**: two declared strings
 * are the same restriction precisely when they resolve to the same set of canonical
 * restriction ids. `dairy` and `Dairy-Free` both resolve to `{dairy}`; `nuts` and
 * `Nuts` both resolve to `{peanut, tree_nut}`. No alias table exists here, because
 * an alias table here would be a second owner of the fact.
 */

import { getRestrictionMatches, isEnforceableRestriction } from './restrictions/restriction-resolver';

// ─── The declarable hard restrictions ────────────────────────────────────────

/**
 * The hard restrictions a household may declare through THA's own chips, in the
 * canonical storage vocabulary owned by the profile.
 *
 * This is the single owner of that list. It replaces the three copies that had
 * drifted apart: `ALLERGY_INTOLERANCE_OPTIONS` (client, profile + eater forms),
 * `ALLERGY_OPTIONS` (client, onboarding — lower-cased, a different vocabulary for
 * the same seven facts), and `ALLOWED_DIET_RESTRICTIONS` (server, the profile enum).
 *
 * Every value here is asserted enforceable by the canonical library in test. The
 * library knows more restrictions than this list offers (`mustard`, `coconut`,
 * `meat`, `fish`, `honey`); those remain declarable through free text and the API,
 * and adding a chip for them is a product decision this workstream does not take.
 */
export const DECLARABLE_HARD_RESTRICTIONS = [
  { value: 'Gluten-Free', label: 'Gluten-Free', onboardingLabel: 'Gluten' },
  { value: 'Dairy-Free',  label: 'Dairy-Free',  onboardingLabel: 'Dairy' },
  { value: 'Nuts',        label: 'Nuts',        onboardingLabel: 'Nuts' },
  { value: 'Eggs',        label: 'Eggs',        onboardingLabel: 'Eggs' },
  { value: 'Shellfish',   label: 'Shellfish',   onboardingLabel: 'Shellfish' },
  { value: 'Soy',         label: 'Soy',         onboardingLabel: 'Soy' },
  { value: 'Sesame',      label: 'Sesame',      onboardingLabel: 'Sesame' },
] as const;

export type DeclarableHardRestriction = (typeof DECLARABLE_HARD_RESTRICTIONS)[number]['value'];

/** The sentinel chip that opens onboarding's free-text box. Never stored. */
export const ONBOARDING_OTHER_VALUE = 'other';

// ─── Canonical identity ──────────────────────────────────────────────────────

/**
 * The set of canonical restriction ids a declared string resolves to, as a stable
 * key. `''` when the library cannot enforce the value at all.
 *
 * This is the platform's definition of "the same restriction, said differently".
 */
function canonicalKey(declared: string): string {
  return getRestrictionMatches([declared])
    .map(m => m.restriction.id)
    .sort()
    .join('+');
}

/**
 * Rewrite a declared restriction into the vocabulary the profile owns, when THA
 * offers a chip for the same canonical restriction. Otherwise return it unchanged.
 *
 * `dairy` → `Dairy-Free`   (same canonical id set: {dairy})
 * `nuts`  → `Nuts`         (same canonical id set: {peanut, tree_nut})
 * `mustard` → `mustard`    (enforceable, but THA offers no chip for it)
 * `kiwi`  → `kiwi`         (not enforceable — the caller must not store it)
 *
 * Derived wholly from the canonical library. Adding a chip above automatically
 * extends this; there is nothing else to remember to update.
 */
export function canonicaliseDeclaredRestriction(declared: string): string {
  const key = canonicalKey(declared);
  if (!key) return declared;
  const chip = DECLARABLE_HARD_RESTRICTIONS.find(r => canonicalKey(r.value) === key);
  return chip ? chip.value : declared;
}

/** True when `declared` is already covered by one of `existing`, canonically. */
export function isAlreadyDeclared(declared: string, existing: string[]): boolean {
  const key = canonicalKey(declared);
  if (!key) return false;
  return existing.some(e => canonicalKey(e) === key);
}

// ─── The routing rule ────────────────────────────────────────────────────────

export interface RoutedOnboardingDietaryFacts {
  /** HARD — safety facts. Written to `users.diet_restrictions`, the canonical owner. */
  hardRestrictions: string[];
  /** SOFT — preferences and dislikes. Written to `user_preferences.excluded_ingredients`. */
  softExclusions: string[];
  /**
   * Free-text values the canonical library cannot enforce. They are kept as soft
   * exclusions (nothing the household typed is discarded) and named back to them,
   * because a restriction THA cannot enforce must never be presented as one.
   */
  unenforceable: string[];
}

/**
 * Split a free-text "Other" entry into the individual things the household named.
 * Commas, semicolons, newlines and the word "and" all separate; blanks collapse.
 */
export function parseOtherRestrictionText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/[,;\n]|\band\b/i)
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);
}

/**
 * Route an onboarding "Allergies or intolerances" submission to its two owners.
 *
 * **Every selected chip is a hard restriction.** The screen asks for allergies and
 * intolerances, and an allergy is not a preference. This is the whole fix.
 *
 * **Free text is asked of the canonical library, value by value.** What THA can
 * enforce becomes a hard restriction — so a household typing `mustard` is now
 * genuinely protected rather than merely accommodated. What THA cannot enforce
 * stays a soft exclusion, and is reported back so the household is told the truth
 * rather than being left to assume a guarantee that does not exist.
 *
 * Order is preserved and values are deduplicated canonically, so a household that
 * selects the Dairy chip *and* types "dairy" ends up with one restriction, not two.
 */
export function routeOnboardingDietarySelections(input: {
  /** Chip values selected on the allergy screen, possibly including `other`. */
  allergies: string[];
  /** The free-text box behind the `other` chip. */
  otherText?: string;
  /** Genuine dislikes and ingredient preferences, from any surface that collects them. */
  dislikes?: string[];
}): RoutedOnboardingDietaryFacts {
  const hardRestrictions: string[] = [];
  const softExclusions: string[] = [];
  const unenforceable: string[] = [];

  const addHard = (declared: string) => {
    const canonical = canonicaliseDeclaredRestriction(declared);
    if (!isAlreadyDeclared(canonical, hardRestrictions)) hardRestrictions.push(canonical);
  };
  const addSoft = (value: string) => {
    if (!softExclusions.includes(value)) softExclusions.push(value);
  };

  // 1. Chips — declared allergies and intolerances. Hard, always.
  for (const chip of input.allergies ?? []) {
    if (chip === ONBOARDING_OTHER_VALUE) continue;
    if (!isEnforceableRestriction(chip)) {
      // A chip THA cannot enforce is a platform defect, not a household mistake:
      // it means a chip was offered that the library does not know. Fail closed —
      // never store it as a hard restriction the household would rely on.
      unenforceable.push(chip);
      addSoft(chip);
      continue;
    }
    addHard(chip);
  }

  // 2. Free text — the library decides, one value at a time.
  for (const typed of parseOtherRestrictionText(input.otherText ?? '')) {
    if (isEnforceableRestriction(typed)) addHard(typed);
    else { unenforceable.push(typed); addSoft(typed); }
  }

  // 3. Genuine dislikes — soft, always. A dislike is never promoted, however
  //    enforceable it happens to be: "I don't like eggs" is not "eggs will hurt me",
  //    and collapsing the two would put a hard gate around a matter of taste.
  for (const dislike of input.dislikes ?? []) addSoft(dislike.trim().toLowerCase());

  return { hardRestrictions, softExclusions, unenforceable };
}

// ─── Legacy repair (live data + cached clients) ──────────────────────────────

/**
 * The values onboarding wrote to `user_preferences.excluded_ingredients` before
 * SURF1B3 that are, in fact, declared hard restrictions — and the soft list with
 * those values removed.
 *
 * Used by two callers, which is the point: the onboarding write door (so a browser
 * still running the pre-SURF1B3 bundle cannot file an allergy as a preference) and
 * the live-data repair script. One rule, one implementation, no chance of the
 * migration and the runtime disagreeing about what an allergy is.
 *
 * **The safe-to-promote criterion, stated once.** A value is promoted only when it
 * is *confidently identifiable* as a declared allergy:
 *
 *   1. it resolves through the canonical restriction library, AND
 *   2. it arrived through the onboarding allergy screen — the only writer of
 *      `excluded_ingredients` that ever asked about allergies. Every other surface
 *      that collects an excluded ingredient is collecting a *dislike*.
 *
 * The caller establishes (2) by only ever passing this function a list it knows came
 * from that screen. This function establishes (1). A value the library cannot enforce
 * is left exactly where it is — which is why `mushrooms` stays a preference.
 */
export function promoteSoftAllergies(input: {
  /** The current `user_preferences.excluded_ingredients`. */
  softExclusions: string[];
  /** The current `users.diet_restrictions`. */
  hardRestrictions: string[];
}): {
  /** Canonicalised values to ADD to `users.diet_restrictions`. */
  promote: string[];
  /** `user_preferences.excluded_ingredients` after the promoted values move out. */
  remainingSoft: string[];
  /** True when nothing needs to change — the repair is a no-op for this user. */
  noop: boolean;
} {
  const promote: string[] = [];
  const remainingSoft: string[] = [];

  for (const value of input.softExclusions ?? []) {
    // A dislike THA cannot enforce is a preference and stays one.
    if (!isEnforceableRestriction(value)) { remainingSoft.push(value); continue; }

    // The hard owner already holds this fact. Leave the soft row exactly as it is:
    // the safety path already sees the restriction, so moving it buys no safety, and
    // a repair that rewrites rows it does not need to is a repair with a blast radius
    // it does not need either. (The residual duplication predates SURF1B3 — see the
    // implementation document's Remaining Limitations.)
    if (isAlreadyDeclared(value, input.hardRestrictions ?? [])) { remainingSoft.push(value); continue; }

    const canonical = canonicaliseDeclaredRestriction(value);
    if (!isAlreadyDeclared(canonical, promote)) promote.push(canonical);
  }

  const noop =
    promote.length === 0 &&
    remainingSoft.length === (input.softExclusions ?? []).length;

  return { promote, remainingSoft, noop };
}
