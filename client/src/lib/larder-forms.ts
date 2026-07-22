// Larder — deterministic physical-form derivation (presentation only).
//
// LARDER1 §3: the physical vocabulary — "shelves, jars, large jars, tins, herbs,
// bottles, baskets, drawers" — is "a reading of data the owner already holds; it
// introduces no new stored fact." This module is that reading. It maps an existing
// Domain 30 record to the physical object the room draws it as, deterministically,
// from the record's own name and storage location. It PERSISTS NOTHING, invents no
// food, and makes no claim: the label on the object is always the household's real
// displayName; the *shape* is only how the room shows what they already keep.
//
// LARDER1 §1/§16: "Do not force every product into a jar." Unknown packaging
// resolves to an honest generic container, never a confident wrong one.

export type PhysicalForm =
  | "jar"        // dry staples read by looking — oats, rice, flour, lentils
  | "large-jar"  // bulk dry — pasta shapes, cereal
  | "tin"        // canned goods — tinned tomatoes, beans, tuna
  | "bottle"     // liquids — oil, vinegar, sauce, milk
  | "packet"     // flexible packaging — noodles, crisps, dried pasta
  | "box"        // cartons — cereal, eggs, tea, stock cubes
  | "tub"        // chilled tubs — butter, yoghurt, spread
  | "basket"     // ambient produce — onions, potatoes, apples, garlic
  | "herbs"      // fresh/potted herbs — basil, thyme, rosemary
  | "generic";   // honest fallback — packaging THA cannot infer

// Each keyword list is checked in priority order. First match wins. The lists are
// intentionally conservative: a miss falls through to `generic`, which is honest,
// rather than a confident wrong shape (Core Principle 6, cited by LARDER1 §14).
const RULES: Array<{ form: PhysicalForm; words: string[] }> = [
  // Liquids first — "olive oil", "soy sauce", "milk" must never read as a tin/jar.
  { form: "bottle", words: [
    "oil", "vinegar", "sauce", "ketchup", "soy", "honey", "syrup", "juice",
    "milk", "wine", "dressing", "squash", "cordial", "passata", "stock ", "broth",
    "gravy", "mayonnaise", "mustard", "worcester", "tabasco", "sriracha", "water",
  ] },
  // Canned goods.
  { form: "tin", words: [
    "tin", "canned", "can of", "tuna", "sardine", "anchov", "corned",
    "baked bean", "chopped tomato", "coconut milk", "sweetcorn", "soup",
  ] },
  // Chilled tubs.
  { form: "tub", words: [
    "butter", "yoghurt", "yogurt", "margarine", "spread", "ice cream",
    "cream cheese", "hummus", "houmous", "dip", "sour cream", "creme fraiche",
  ] },
  // Fresh / potted herbs.
  { form: "herbs", words: [
    "basil", "thyme", "rosemary", "oregano", "parsley", "coriander", "mint",
    "sage", "dill", "chive", "tarragon", "herb",
  ] },
  // Ambient produce → basket.
  { form: "basket", words: [
    "onion", "potato", "garlic", "shallot", "apple", "banana", "orange",
    "lemon", "lime", "pear", "tomato", "carrot", "pepper", "avocado", "melon",
    "berry", "berries", "grape", "mango", "pineapple", "squash ", "pumpkin",
    "sprout", "cabbage", "broccoli", "cauliflower", "courgette", "aubergine",
    "mushroom", "ginger", "chilli", "fruit", "veg",
  ] },
  // Boxes / cartons.
  { form: "box", words: [
    "cereal", "cornflake", "muesli", "granola", "egg", "tea bag", "teabag",
    "stock cube", "cracker", "biscuit", "cake mix", "porridge box",
  ] },
  // Flexible packets.
  { form: "packet", words: [
    "noodle", "crisp", "chip", "snack", "crackers", "wrap", "tortilla",
    "spaghetti", "penne", "fusilli", "macaroni", "lasagne", "linguine",
  ] },
  // Bulk dry → large jar (pasta, big grains).
  { form: "large-jar", words: [
    "pasta", "spaghett", "rigatoni", "orzo", "bulgur",
  ] },
  // Dry staples → jar.
  { form: "jar", words: [
    "oat", "rice", "flour", "sugar", "lentil", "quinoa", "couscous", "barley",
    "bean", "chickpea", "pea", "seed", "nut", "coffee", "salt", "spice",
    "cinnamon", "cumin", "paprika", "turmeric", "pepper corn", "dried",
    "raisin", "sultana", "apricot", "date", "fig", "almond", "cashew", "walnut",
    "chocolate", "cocoa", "baking", "yeast",
  ] },
];

// Storage location gives a default when the name tells us nothing. Fridge/freezer
// default to a generic tub-ish container; fruit to a basket; larder to a jar.
const CATEGORY_DEFAULT: Record<string, PhysicalForm> = {
  fruit: "basket",
  fridge: "tub",
  freezer: "packet",
  larder: "jar",
  household: "generic",
  pet: "generic",
};

/**
 * Derive the physical form for a record. Pure and deterministic: same record →
 * same form, every render, on every device. Never persisted.
 */
export function deriveForm(input: { name: string; category: string }): PhysicalForm {
  const hay = (input.name || "").toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((w) => hay.includes(w))) return rule.form;
  }
  return CATEGORY_DEFAULT[input.category] ?? "generic";
}

// A stable per-item variation index (0..n-1) so identical forms on one shelf do
// not render as identical clones — derived from the record id, not randomness, so
// it is deterministic and resume-stable.
export function variantOf(id: number, n: number): number {
  return ((id % n) + n) % n;
}
