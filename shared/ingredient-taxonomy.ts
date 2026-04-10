/**
 * Curated ingredient taxonomy — shared by client and server.
 *
 * Maps normalizedName (output of normalizeIngredientKey) to a category label.
 * Category labels must match existing labels used by the app (see INGREDIENT_CATEGORIES
 * in server/lib/ingredient-utils.ts).
 *
 * Keep this file small and readable. ~30–50 common UK grocery items only.
 * Use exact normalizedName lookup — no fuzzy matching.
 */
export const INGREDIENT_TAXONOMY: Record<string, string> = {
  // ── Produce ────────────────────────────────────────────────────────────────
  garlic: 'produce',
  onion: 'produce',
  'red onion': 'produce',
  spinach: 'produce',
  tomato: 'produce',
  tomatoes: 'produce',
  cucumber: 'produce',
  broccoli: 'produce',
  carrot: 'produce',
  carrots: 'produce',
  mushroom: 'produce',
  mushrooms: 'produce',
  courgette: 'produce',
  pepper: 'produce',
  'red pepper': 'produce',
  kale: 'produce',
  leek: 'produce',

  // ── Fruit ─────────────────────────────────────────────────────────────────
  banana: 'fruit',
  bananas: 'fruit',
  apple: 'fruit',
  apples: 'fruit',
  blueberry: 'fruit',
  blueberries: 'fruit',
  strawberry: 'fruit',
  strawberries: 'fruit',
  lemon: 'fruit',
  avocado: 'fruit',

  // ── Dairy ─────────────────────────────────────────────────────────────────
  milk: 'dairy',
  butter: 'dairy',
  cheese: 'dairy',
  cheddar: 'dairy',
  'greek yoghurt': 'dairy',
  'greek yogurt': 'dairy',
  yoghurt: 'dairy',
  yogurt: 'dairy',
  cream: 'dairy',

  // ── Eggs ──────────────────────────────────────────────────────────────────
  egg: 'eggs',
  eggs: 'eggs',

  // ── Meat ──────────────────────────────────────────────────────────────────
  'chicken breast': 'meat',
  chicken: 'meat',
  bacon: 'meat',
  mince: 'meat',
  'beef mince': 'meat',

  // ── Fish ──────────────────────────────────────────────────────────────────
  salmon: 'fish',
  tuna: 'fish',
  cod: 'fish',

  // ── Grains ────────────────────────────────────────────────────────────────
  rice: 'grains',
  pasta: 'grains',
  oats: 'grains',
  oat: 'grains',

  // ── Bakery ────────────────────────────────────────────────────────────────
  bread: 'bakery',
  sourdough: 'bakery',

  // ── Oils ──────────────────────────────────────────────────────────────────
  'olive oil': 'oils',
  'vegetable oil': 'oils',

  // ── Condiments ────────────────────────────────────────────────────────────
  honey: 'condiments',
  'soy sauce': 'condiments',

  // ── Nuts ──────────────────────────────────────────────────────────────────
  almond: 'nuts',
  almonds: 'nuts',

  // ── Pantry ────────────────────────────────────────────────────────────────
  potato: 'pantry',
  potatoes: 'pantry',
  'sweet potato': 'pantry',
};
