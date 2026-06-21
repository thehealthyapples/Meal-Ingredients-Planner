// WS8 — Food Discovery Engine: curated cuisine seed (Tier 3, editorial).
//
// THIS IS NOT "every food tagged Mediterranean". That set is enormous (tomato,
// lamb, pasta, feta, olives, oranges, rice, aubergine…) and discovery from it
// would wander to almost anything — the "random / overwhelming" failure.
//
// Instead each cuisine carries a SMALL, hand-picked list of EMBLEMATIC,
// BEGINNER-FRIENDLY foods — the ones a knowledgeable friend would name first if
// you said "I love this cuisine, what else should I try?". Restraint is the
// feature. Add cautiously; review every entry; keep each list short.
//
// All slugs below are real canonical food slugs (shared/canonical/foods.ts).

export interface CuisineSeed {
  slug: string;
  /** Adjective form used in reasons: "A common ${name} ingredient." */
  name: string;
  foods: Array<{ slug: string; name: string }>;
}

export const CUISINE_SEED: CuisineSeed[] = [
  {
    slug: "mediterranean",
    name: "Mediterranean",
    foods: [
      { slug: "tomato", name: "Tomato" },
      { slug: "aubergine", name: "Aubergine" },
      { slug: "courgette", name: "Courgette" },
      { slug: "fennel", name: "Fennel" },
      { slug: "artichoke", name: "Artichoke" },
      { slug: "olives", name: "Olives" },
      { slug: "chickpeas", name: "Chickpeas" },
      { slug: "extra-virgin-olive-oil", name: "Extra Virgin Olive Oil" },
      { slug: "sardines", name: "Sardines" },
      { slug: "feta", name: "Feta" },
    ],
  },
  {
    slug: "italian",
    name: "Italian",
    foods: [
      { slug: "tomato", name: "Tomato" },
      { slug: "basil", name: "Basil" },
      { slug: "mozzarella", name: "Mozzarella" },
      { slug: "garlic", name: "Garlic" },
      { slug: "oregano", name: "Oregano" },
      { slug: "parmesan", name: "Parmesan" },
      { slug: "olives", name: "Olives" },
      { slug: "fennel", name: "Fennel" },
    ],
  },
  {
    slug: "middle-eastern",
    name: "Middle Eastern",
    foods: [
      { slug: "chickpeas", name: "Chickpeas" },
      { slug: "aubergine", name: "Aubergine" },
      { slug: "sesame-seeds", name: "Sesame Seeds" },
      { slug: "cumin", name: "Cumin" },
      { slug: "coriander", name: "Coriander" },
      { slug: "parsley", name: "Parsley" },
      { slug: "pomegranate", name: "Pomegranate" },
      { slug: "lemon", name: "Lemon" },
      { slug: "mint", name: "Mint" },
    ],
  },
  {
    slug: "indian",
    name: "Indian",
    foods: [
      { slug: "lentils", name: "Lentils" },
      { slug: "chickpeas", name: "Chickpeas" },
      { slug: "turmeric", name: "Turmeric" },
      { slug: "cumin", name: "Cumin" },
      { slug: "coriander", name: "Coriander" },
      { slug: "ginger", name: "Ginger" },
      { slug: "cardamom", name: "Cardamom" },
      { slug: "spinach", name: "Spinach" },
    ],
  },
  {
    slug: "mexican",
    name: "Mexican",
    foods: [
      { slug: "black-beans", name: "Black Beans" },
      { slug: "kidney-beans", name: "Kidney Beans" },
      { slug: "tomato", name: "Tomato" },
      { slug: "chilli", name: "Chilli" },
      { slug: "lime", name: "Lime" },
      { slug: "coriander", name: "Coriander" },
      { slug: "avocado", name: "Avocado" },
      { slug: "corn", name: "Sweetcorn" },
    ],
  },
  {
    slug: "east-asian",
    name: "East Asian",
    foods: [
      { slug: "pak-choi", name: "Pak Choi" },
      { slug: "ginger", name: "Ginger" },
      { slug: "shiitake-mushroom", name: "Shiitake Mushroom" },
      { slug: "tofu", name: "Tofu" },
      { slug: "edamame", name: "Edamame" },
      { slug: "miso", name: "Miso" },
      { slug: "sesame-seeds", name: "Sesame Seeds" },
      { slug: "spring-onion", name: "Spring Onion" },
    ],
  },
  {
    slug: "british",
    name: "British",
    foods: [
      { slug: "potato", name: "Potato" },
      { slug: "carrots", name: "Carrots" },
      { slug: "leek", name: "Leek" },
      { slug: "cabbage", name: "Cabbage" },
      { slug: "parsnip", name: "Parsnip" },
      { slug: "swede", name: "Swede" },
      { slug: "apple", name: "Apple" },
      { slug: "oats", name: "Oats" },
    ],
  },
];

// ── Derived indices (built once) ──────────────────────────────────────────────

let _foodToCuisines: Map<string, CuisineSeed[]> | null = null;

/** food slug → cuisines it is an emblematic member of (may be several). */
export function getCuisinesForFood(slug: string): CuisineSeed[] {
  if (!_foodToCuisines) {
    _foodToCuisines = new Map();
    for (const cuisine of CUISINE_SEED) {
      for (const f of cuisine.foods) {
        const list = _foodToCuisines.get(f.slug) ?? [];
        list.push(cuisine);
        _foodToCuisines.set(f.slug, list);
      }
    }
  }
  return _foodToCuisines.get(slug) ?? [];
}

export function getCuisine(slug: string): CuisineSeed | undefined {
  return CUISINE_SEED.find((c) => c.slug === slug);
}
