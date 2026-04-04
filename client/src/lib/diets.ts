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
  { value: "Paleo",         label: "Paleo",           def: "Whole, unprocessed foods — no grains or dairy." },
  { value: "DASH",          label: "DASH",            def: "Heart-healthy approach, low in sodium and saturated fat." },
  { value: "MIND",          label: "MIND",            def: "Brain-healthy foods — leafy greens, berries, nuts, and fish." },
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
