export const DIET_PATTERNS = [
  { value: "Mediterranean", label: "Mediterranean", desc: "Olive oil, fish & veg" },
  { value: "DASH",          label: "DASH",          desc: "Heart-healthy, low sodium" },
  { value: "MIND",          label: "MIND",          desc: "Brain-healthy foods" },
  { value: "Flexitarian",   label: "Flexitarian",   desc: "Mostly plant-based" },
  { value: "Vegetarian",    label: "Vegetarian",    desc: "No meat or fish" },
  { value: "Vegan",         label: "Vegan",         desc: "No animal products" },
  { value: "Keto",          label: "Keto",          desc: "High fat, low carb" },
  { value: "Low-Carb",      label: "Low-Carb / Atkins", desc: "Reduced carbohydrates" },
  { value: "Paleo",         label: "Paleo",         desc: "Whole, unprocessed foods" },
  { value: "Carnivore",     label: "Carnivore",     desc: "Meat-based diet" },
] as const;

export type DietPatternValue = (typeof DIET_PATTERNS)[number]["value"];

export const DIET_RESTRICTIONS = [
  { value: "Gluten-Free", label: "Gluten-Free", desc: "No gluten" },
  { value: "Dairy-Free",  label: "Dairy-Free",  desc: "No dairy products" },
] as const;

export type DietRestrictionValue = (typeof DIET_RESTRICTIONS)[number]["value"];

// ─── Canonical shared options (used across all dietary input surfaces) ────────

/** Diet pattern chips - used on profile, eater form, guest form, planner. */
export const DIET_PATTERN_OPTIONS = [
  { value: "Mediterranean", label: "Mediterranean" },
  { value: "DASH",          label: "DASH" },
  { value: "MIND",          label: "MIND" },
  { value: "Flexitarian",   label: "Flexitarian" },
  { value: "Vegetarian",    label: "Vegetarian" },
  { value: "Vegan",         label: "Vegan" },
  { value: "Keto",          label: "Keto" },
  { value: "Low-Carb",      label: "Low-Carb / Atkins" },
  { value: "Paleo",         label: "Paleo" },
  { value: "Carnivore",     label: "Carnivore" },
] as const;

/** Allergy & intolerance chips - hard constraints, used everywhere. */
export const ALLERGY_INTOLERANCE_OPTIONS = [
  { value: "Gluten-Free", label: "Gluten-Free" },
  { value: "Dairy-Free",  label: "Dairy-Free" },
  { value: "Nuts",        label: "Nuts" },
  { value: "Eggs",        label: "Eggs" },
  { value: "Shellfish",   label: "Shellfish" },
  { value: "Soy",         label: "Soy" },
  { value: "Sesame",      label: "Sesame" },
] as const;

export const EATING_SCHEDULES = [
  { value: "None",                 label: "No preference",        desc: "Eat at any time" },
  { value: "Intermittent Fasting", label: "Intermittent Fasting", desc: "Time-restricted eating" },
] as const;

export type EatingScheduleValue = (typeof EATING_SCHEDULES)[number]["value"];

// ─── Onboarding: shared diet options with definitions ───────────────────────
// Single source of truth for dietary preferences shown during onboarding and
// anywhere else that needs diet chips with inline definitions.

export interface OnboardingDietOption {
  value: string;
  label: string;
  def: string;
}

export const ONBOARDING_DIET_OPTIONS: OnboardingDietOption[] = [
  { value: "Vegetarian",    label: "Vegetarian",      def: "No meat or fish. May include dairy and eggs." },
  { value: "Vegan",         label: "Vegan",           def: "No animal products (meat, fish, dairy, or eggs)." },
  { value: "Pescatarian",   label: "Pescatarian",     def: "No meat, but includes fish and seafood." },
  { value: "Flexitarian",   label: "Flexitarian",     def: "Mostly plant-based, with occasional meat or fish." },
  { value: "Mediterranean", label: "Mediterranean",   def: "Rich in vegetables, olive oil, legumes, and fish." },
  { value: "Halal",         label: "Halal",           def: "Foods prepared according to Islamic dietary guidelines." },
  { value: "Kosher",        label: "Kosher",          def: "Foods prepared according to Jewish dietary laws." },
  { value: "Dairy-free",    label: "Dairy-free",      def: "No milk or dairy-based ingredients." },
  { value: "Gluten-free",   label: "Gluten-free",     def: "No wheat, barley, or rye." },
  { value: "Keto",          label: "Keto",            def: "Very low carbohydrate, high fat approach." },
  { value: "Low-Carb",      label: "Low-carb",        def: "Reduced carbohydrates, focuses on protein and vegetables." },
  { value: "Paleo",         label: "Paleo",           def: "Whole, unprocessed foods - no grains or dairy." },
  { value: "DASH",          label: "DASH",            def: "Heart-healthy approach, low in sodium and saturated fat." },
  { value: "MIND",          label: "MIND",            def: "Brain-healthy foods - leafy greens, berries, nuts, and fish." },
];

// ─── Onboarding: allergy options ────────────────────────────────────────────

export interface AllergyOption {
  value: string;
  label: string;
}

export const ALLERGY_OPTIONS: AllergyOption[] = [
  { value: "nuts",      label: "Nuts" },
  { value: "dairy",     label: "Dairy" },
  { value: "gluten",    label: "Gluten" },
  { value: "eggs",      label: "Eggs" },
  { value: "shellfish", label: "Shellfish" },
  { value: "soy",       label: "Soy" },
  { value: "sesame",    label: "Sesame" },
  { value: "other",     label: "Other" },
];

// ─── Onboarding: eating style options ───────────────────────────────────────
// Stored in userPreferences.dietTypes with "style:" prefix so they don't
// conflict with actual diet type values but persist in the same field.

export interface EatingStyleOption {
  value: string;       // stored as "style:<value>" in dietTypes
  label: string;
  def: string;
}

export const EATING_STYLE_OPTIONS: EatingStyleOption[] = [
  { value: "simple-meals",     label: "Simple meals",        def: "Easy to prepare, minimal ingredients." },
  { value: "family-friendly",  label: "Family-friendly",     def: "Suitable for a wide range of tastes." },
  { value: "quick-convenient", label: "Quick & convenient",  def: "Fast options for busy routines." },
  { value: "whole-foods",      label: "Whole foods focused",  def: "Less processed, closer to natural ingredients." },
];

// ─── Display label formatter ──────────────────────────────────────────────────
// Maps raw stored diet/restriction values to human-readable display labels.
// Adult eater defaultDietTypes are stored lowercase by the server
// (via DIET_PATTERN_TO_DIET_TYPE), so "keto" must map to "Keto".
// Used only for display — stored values and matching logic are unchanged.

const DIET_LABEL_LOOKUP: Record<string, string> = {
  // Diet patterns (stored as lowercase for adult eaters)
  mediterranean: "Mediterranean",
  dash:          "DASH",
  mind:          "MIND",
  flexitarian:   "Flexitarian",
  vegetarian:    "Vegetarian",
  vegan:         "Vegan",
  keto:          "Keto",
  "low-carb":    "Low-Carb",
  paleo:         "Paleo",
  carnivore:     "Carnivore",
  pescatarian:   "Pescatarian",
  halal:         "Halal",
  kosher:        "Kosher",
  // Allergies & intolerances
  "gluten-free": "Gluten-Free",
  "dairy-free":  "Dairy-Free",
  nuts:          "Nuts",
  eggs:          "Eggs",
  shellfish:     "Shellfish",
  soy:           "Soy",
  sesame:        "Sesame",
  "upf-free":    "UPF-Free",
};

/** Format a raw stored diet/restriction value for user-visible display.
 *  "keto" → "Keto", "gluten-free" → "Gluten-Free", "low-carb" → "Low-Carb".
 *  Falls back to capitalising each hyphen-separated segment for unknown values.
 *  Does NOT modify stored values, API shapes, or matching logic. */
export function formatDietLabel(value: string): string {
  return DIET_LABEL_LOOKUP[value.toLowerCase()]
    ?? value.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
}
