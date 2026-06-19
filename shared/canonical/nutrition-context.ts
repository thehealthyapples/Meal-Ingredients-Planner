// WS2F — Canonical Food Report: curated Nutrition Context facts.
//
// Short, evidence-based, educational context lines for selected canonical foods.
// This is the first authored set of WS2D Stage S2 "typed context facts" — the
// eventual home is a WS0 knowledge_context table; for now they live here so the
// Food Report can surface them without a schema change.
//
// Rules (from WS2F brief):
//   • Short — one or two sentences maximum.
//   • Evidence-based — describes real nutritional context, not marketing.
//   • Educational — explains the "why", not what to do.
//   • Not medical — no disease claims, no treatment language.
//   • Expandable — callers may show/hide excess items.
//   • Optional — not every food needs a context line; absent = render nothing.
//
// Keyed by canonical food slug (WS2A). Every key here must correspond to a real
// canonical food in CANONICAL_SEED; validate in test-food-report-adapter.ts.

export const NUTRITION_CONTEXT: Record<string, string[]> = {
  // ── Vegetables ──────────────────────────────────────────────────────────────
  "tomato": [
    "Cooking and processing increase lycopene availability — tomato-based sauces and tinned tomatoes are particularly rich sources.",
  ],
  "spinach": [
    "Pairing spinach with a source of vitamin C, such as lemon juice or tomatoes, supports iron absorption.",
  ],

  // ── Mushrooms ───────────────────────────────────────────────────────────────
  "mushroom": [
    "Placing mushrooms gill-side up in sunlight or UV light for a short time can increase their vitamin D content.",
    "Mushrooms are one of the few non-animal foods that naturally contain vitamin D.",
  ],

  // ── Legumes ─────────────────────────────────────────────────────────────────
  "chickpeas": [
    "Combining chickpeas with wholegrains such as rice provides a complete range of essential amino acids.",
  ],
  "lentils": [
    "Lentils provide both plant protein and fibre in one ingredient, making them a well-rounded addition to meals.",
  ],

  // ── Seeds ───────────────────────────────────────────────────────────────────
  "flaxseed": [
    "Ground flaxseed is easier for the body to absorb than whole seeds — a coffee grinder works well.",
  ],
  "chia-seeds": [
    "Chia seeds absorb many times their weight in water; soaking them first makes them gentler on digestion.",
  ],

  // ── Nuts ────────────────────────────────────────────────────────────────────
  "walnuts": [
    "Walnuts are among the richest plant sources of ALA omega-3, which the body can partly convert to DHA and EPA.",
  ],

  // ── Healthy fats ────────────────────────────────────────────────────────────
  "extra-virgin-olive-oil": [
    "A cornerstone of Mediterranean-style eating, associated with heart and brain health in observational studies.",
    "Extra virgin is the least processed form — cold-pressed and retaining more of its natural plant compounds.",
  ],
  "avocado": [
    "The healthy fats in avocado can support absorption of fat-soluble vitamins such as A, D, E and K from the same meal.",
  ],
};
