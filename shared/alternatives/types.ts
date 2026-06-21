// WS9 — Food Alternatives Engine: public types.
//
// Alternatives answer ONE question: "Given a food, what else could fulfil a
// similar ROLE — for a different dietary choice, a similar culinary slot, a
// lower-UPF preference, a different cuisine, or so a household can adapt one meal
// for different eaters?"
//
// This is NOT Discovery. Discovery (WS8) asks "what else might I ENJOY?".
// Alternatives ask "what else could WORK HERE?". The two are deliberately kept
// apart — see docs/investigations/WS9_ALTERNATIVES_ENGINE.md §"Discovery vs
// Alternatives".
//
// Alternatives are POSSIBILITIES, never obligations. There are deliberately:
//   • NO rankings, NO scores, NO "healthier / better / superior" anywhere
//   • NO verdict on the anchor food — it is fine; we are answering a question
//   • NO familiarity signal (that is a Discovery concept — alternatives don't
//     reorder by what you already eat, because all five options are equally valid)
// Every option is editorial (curated + reviewed). Soft "lower-UPF" / "cuisine"
// alternatives cannot be safely derived algorithmically, so WS9 is Tier-3 curated
// throughout.

/** The five — and only five — alternative types WS9 implements. */
export type AlternativeType =
  | "dietary" //   1. Dietary Alternatives        (chicken → tofu, tempeh, lentils)
  | "meal_role" // 2. Meal Role Alternatives      (rice → brown rice, quinoa)
  | "lower_upf" // 3. Lower UPF Alternatives       (cereal → porridge, muesli)
  | "cuisine" //   4. Cuisine Alternatives         (basil → parsley, coriander, mint)
  | "household"; // 5. Household Adaptation         (one meal → different eaters)

/**
 * Hard dietary patterns WS9 understands as CONSTRAINTS (the "exclusion gate" from
 * the WS9 investigation). When a context carries diets, options are filtered to
 * those that satisfy ALL of them — never a preference ranking, only a gate.
 */
export type Diet =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "dairy_free"
  | "gluten_free"
  | "nut_free"
  | "soya_free"
  | "keto"
  | "lower_carb";

export interface AlternativeOption {
  slug: string;
  name: string;
  type: AlternativeType;
  /**
   * Friend-voice "why this can fulfil a similar role". Role-anchored,
   * goal-conditional, never a verdict on the anchor. Guaranteed free of
   * ranking / judgement language by the trust guard.
   */
  reason: string;
  /**
   * Optional HONESTY note — surfaced when the option tastes or cooks
   * meaningfully differently (cauliflower rice is not neutral like rice).
   * Prevents the "swap and be disappointed" trap. Never a downside verdict.
   */
  note?: string;
  /** The dietary patterns this option satisfies (used by the exclusion gate). */
  suitableFor: Diet[];
  /** Only present on `cuisine` options — the cuisine this herb/ingredient suits. */
  cuisine?: string;
  /** WS9 is curated throughout — provenance is always editorial. */
  source: "editorial";
}

export interface AlternativeSection {
  type: AlternativeType;
  /** Invitational heading — possibility, never instruction. */
  title: string;
  options: AlternativeOption[];
}

/** One member of a household, with their hard dietary constraints (if any). */
export interface Eater {
  name: string;
  diets?: Diet[];
}

export interface HouseholdContext {
  /** The people sharing the meal. Drives Household Adaptation (type 5). */
  eaters?: Eater[];
}

/**
 * Optional context that NARROWS alternatives from "all possibilities" to "the
 * ones that fit". Absent context = show the full set of possibilities (the
 * default, because alternatives are possibilities). Present context = gate.
 */
export interface AlternativeContext {
  /** Hard dietary constraints — the exclusion gate. */
  diets?: Diet[];
  /** When true, keep only the Lower-UPF section (a stated philosophy preference). */
  preferLowerUpf?: boolean;
  /** Restrict cuisine alternatives to a single cuisine. */
  cuisine?: string;
  /** When present, the result also carries a per-eater Household Adaptation. */
  household?: HouseholdContext;
}

export interface AlternativeRequest {
  /** Anchor food. Accepts a canonical slug, a variety slug, or a WS9 anchor alias. */
  food: string;
  context?: AlternativeContext;
  /** Restrict to specific alternative types. Default: every applicable type. */
  types?: AlternativeType[];
  /** Max options surfaced per section. Default: 6 (the curated set is small). */
  limitPerType?: number;
}

/** One eater's place in an adapted shared meal. */
export interface HouseholdAdaptationMember {
  eater: string;
  /** The food this eater has in the shared role. */
  slug: string;
  name: string;
  /** True when the eater keeps the anchor food unchanged (no adaptation needed). */
  shared: boolean;
  /** Why this fills the same role for this eater — non-judgemental. */
  reason: string;
}

export interface HouseholdAdaptation {
  /** The shared role being adapted (the anchor food everyone started from). */
  anchor: { slug: string; name: string };
  members: HouseholdAdaptationMember[];
}

export interface AlternativesResult {
  /** The anchor the alternatives were built for, or null if unknown (silent). */
  anchor: { slug: string; name: string } | null;
  /** Empty sections are omitted entirely — empty is silent, never "nothing". */
  sections: AlternativeSection[];
  /** Present only when context.household.eaters was supplied. */
  adaptation?: HouseholdAdaptation;
}

/**
 * Friendly section headings. Each is a POSSIBILITY ("could", "options"), never an
 * instruction ("switch", "should"). Note the absence of any comparison word.
 */
export const SECTION_TITLES: Record<AlternativeType, string> = {
  dietary: "Different dietary choices",
  meal_role: "Could fill a similar role",
  lower_upf: "Less processed options",
  cuisine: "In a different cuisine",
  household: "Adapting for the household",
};
