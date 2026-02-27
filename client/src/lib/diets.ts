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
