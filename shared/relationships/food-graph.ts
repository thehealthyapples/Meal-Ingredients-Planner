// WS7 POC — Food Relationship Graph
//
// Proof of concept: given a food, return a small set of trusted neighbouring
// foods and explain WHY they are related.
//
// Three tiers of relationship:
//   Tier 1 — structural identity
//     same_variety    derived from canonical food variety data
//     same_family     derived from canonical food category/subcategory
//     similar_to      editorial — commonly used in similar cooking contexts
//
//   Tier 2 — culinary & nutritional
//     often_cooked_with  editorial — established cooking pairings
//     shares_benefits    inferred from FOOD_BENEFITS overlap (≥2 shared)
//     seasonal_with      editorial — peak season alignment (UK)
//
//   Tier 3 — purpose-driven
//     alternative_for_goal  editorial — with labelled goal
//
// Trust rules (enforced throughout):
//   NO rankings. NO healthy vs unhealthy. NO best foods.
//   Only: "these foods are meaningfully related."

import { CANONICAL_SEED } from "../canonical/foods";
import { FOOD_BENEFITS } from "../knowledge/relationships";

// ── Types ────────────────────────────────────────────────────────────────────

export type RelationshipType =
  | "same_variety"
  | "same_family"
  | "similar_to"
  | "often_cooked_with"
  | "shares_benefits"
  | "seasonal_with"
  | "alternative_for_goal";

export interface FoodRelationship {
  slug: string;
  name: string;
  type: RelationshipType;
  explanation: string;
  /** Only present for alternative_for_goal. Describes the purpose. */
  goal?: string;
}

export interface FoodGraph {
  slug: string;
  name: string;
  /** Null when slug is a variety (shows parent canonical). */
  canonicalSlug: string | null;
  relationships: FoodRelationship[];
}

// ── Internal editorial data ──────────────────────────────────────────────────

interface EditorialEdge {
  type: RelationshipType;
  slug: string;
  name: string;
  explanation: string;
  goal?: string;
}

const EDITORIAL_GRAPH: Record<string, { name: string; edges: EditorialEdge[] }> = {

  // ── Tomato ──────────────────────────────────────────────────────────────────
  "tomato": {
    name: "Tomato",
    edges: [
      {
        type: "similar_to", slug: "pepper", name: "Pepper",
        explanation: "Both are fruiting vegetables commonly used fresh in salads, sauces and roasted dishes across Mediterranean cooking.",
      },
      {
        type: "similar_to", slug: "aubergine", name: "Aubergine",
        explanation: "Both are Mediterranean nightshade vegetables that work well roasted, in stews or baked in gratin-style dishes.",
      },
      {
        type: "often_cooked_with", slug: "basil", name: "Basil",
        explanation: "A classic Italian pairing — tomato and basil appear together in salads, sauces, bruschetta and pizza.",
      },
      {
        type: "often_cooked_with", slug: "mozzarella", name: "Mozzarella",
        explanation: "The caprese combination of tomato, mozzarella and basil is a cornerstone of Italian cooking.",
      },
      {
        type: "often_cooked_with", slug: "garlic", name: "Garlic",
        explanation: "Garlic forms the flavour base of almost every tomato sauce, from pasta to curries.",
      },
      {
        type: "often_cooked_with", slug: "onion", name: "Onion",
        explanation: "Onion and tomato together begin countless pasta sauces, curries and stews across world cuisines.",
      },
      {
        type: "often_cooked_with", slug: "extra-virgin-olive-oil", name: "Extra Virgin Olive Oil",
        explanation: "Mediterranean cooking nearly always pairs tomatoes with olive oil, whether as a dressing or cooking base.",
      },
      {
        type: "often_cooked_with", slug: "oregano", name: "Oregano",
        explanation: "Oregano and tomato are a natural pair in pasta sauces, pizza and Greek salads.",
      },
      {
        type: "seasonal_with", slug: "aubergine", name: "Aubergine",
        explanation: "Both peak in UK summer (July–September), making them natural companions in season.",
      },
      {
        type: "seasonal_with", slug: "courgette", name: "Courgette",
        explanation: "Both are summer fruiting vegetables in season together from July through September in the UK.",
      },
      {
        type: "seasonal_with", slug: "basil", name: "Basil",
        explanation: "Basil thrives in summer alongside tomatoes — both are at their peak from July through September.",
      },
      {
        type: "alternative_for_goal", slug: "pepper", name: "Pepper",
        explanation: "A sweet fruiting vegetable that works well raw in salads or roasted in place of tomatoes in Mediterranean dishes.",
        goal: "vegetarian",
      },
      {
        type: "alternative_for_goal", slug: "butternut-squash", name: "Butternut Squash",
        explanation: "A warming roasted alternative for autumn and winter when fresh tomatoes are out of season.",
        goal: "seasonal-swap",
      },
    ],
  },

  // ── Chickpeas ────────────────────────────────────────────────────────────────
  "chickpeas": {
    name: "Chickpeas",
    edges: [
      {
        type: "similar_to", slug: "cannellini-beans", name: "Cannellini Beans",
        explanation: "Both are versatile, creamy legumes used in stews, soups and salads; cannellini are slightly milder.",
      },
      {
        type: "similar_to", slug: "butter-beans", name: "Butter Beans",
        explanation: "Both are large, mild legumes with a satisfying texture in salads, traybakes and stews.",
      },
      {
        type: "similar_to", slug: "lentils", name: "Lentils",
        explanation: "Both are plant protein staples used in similar dishes — dhal, soups, stews and curries.",
      },
      {
        type: "often_cooked_with", slug: "garlic", name: "Garlic",
        explanation: "Garlic is the starting point for most chickpea dishes, from hummus to curries and roasted chickpeas.",
      },
      {
        type: "often_cooked_with", slug: "cumin", name: "Cumin",
        explanation: "Cumin's earthy warmth is used in chickpea curries, falafels and roasted chickpea dishes.",
      },
      {
        type: "often_cooked_with", slug: "turmeric", name: "Turmeric",
        explanation: "Turmeric gives chickpea curries their golden colour and a gentle warmth.",
      },
      {
        type: "often_cooked_with", slug: "lemon", name: "Lemon",
        explanation: "A squeeze of lemon balances hummus, chickpea salads and roasted chickpea dishes.",
      },
      {
        type: "often_cooked_with", slug: "spinach", name: "Spinach",
        explanation: "Spinach and chickpeas are a popular combination in curries and quick one-pan dishes.",
      },
      {
        type: "often_cooked_with", slug: "coriander", name: "Coriander",
        explanation: "Fresh coriander finishes chickpea curries, falafels and Middle Eastern chickpea dishes.",
      },
      {
        type: "often_cooked_with", slug: "tomato", name: "Tomato",
        explanation: "Tomatoes form the sauce base of many chickpea stews across North African and Indian cooking.",
      },
      {
        type: "alternative_for_goal", slug: "tofu", name: "Tofu",
        explanation: "Firm tofu provides plant protein in similar cooking contexts — traybakes, curries and stir-fries.",
        goal: "vegetarian-protein",
      },
      {
        type: "alternative_for_goal", slug: "lentils", name: "Lentils",
        explanation: "Lentils offer similar plant protein in soups, stews and dhal; they cook without soaking.",
        goal: "higher-fibre",
      },
      {
        type: "alternative_for_goal", slug: "edamame", name: "Edamame",
        explanation: "Young soya beans provide complete plant protein in salads and grain bowls.",
        goal: "vegetarian-protein",
      },
      {
        type: "alternative_for_goal", slug: "cannellini-beans", name: "Cannellini Beans",
        explanation: "A milder, creamier alternative that works in the same soups, stews and salads.",
        goal: "dairy-free",
      },
    ],
  },

  // ── Chicken ──────────────────────────────────────────────────────────────────
  "chicken": {
    name: "Chicken",
    edges: [
      {
        type: "similar_to", slug: "turkey", name: "Turkey",
        explanation: "Both are lean poultry with a similar mild flavour; turkey works in most chicken recipes.",
      },
      {
        type: "often_cooked_with", slug: "garlic", name: "Garlic",
        explanation: "Garlic appears in almost every chicken dish across world cuisines.",
      },
      {
        type: "often_cooked_with", slug: "lemon", name: "Lemon",
        explanation: "Lemon brightens roasted chicken and marinades across Mediterranean cooking.",
      },
      {
        type: "often_cooked_with", slug: "coriander", name: "Coriander",
        explanation: "Fresh coriander finishes Thai, Indian and Middle Eastern chicken dishes.",
      },
      {
        type: "often_cooked_with", slug: "paprika", name: "Paprika",
        explanation: "Paprika gives colour and warmth to chicken spice rubs, marinades and stews.",
      },
      {
        type: "often_cooked_with", slug: "tomato", name: "Tomato",
        explanation: "Tomatoes form the sauce base of chicken curries, casseroles and traybakes.",
      },
      {
        type: "often_cooked_with", slug: "onion", name: "Onion",
        explanation: "Onion is the cooking base for most chicken dishes across world cuisines.",
      },
      {
        type: "often_cooked_with", slug: "thyme", name: "Thyme",
        explanation: "Thyme is a classic partner for roast chicken, traybakes and French-style stews.",
      },
      {
        type: "alternative_for_goal", slug: "turkey", name: "Turkey",
        explanation: "Lean poultry with a similar protein content and mild flavour; works in most chicken recipes with no change to the cooking method.",
        goal: "lower-saturated-fat",
      },
      {
        type: "alternative_for_goal", slug: "tofu", name: "Tofu",
        explanation: "Firm tofu absorbs marinades well and can be baked, grilled or stir-fried in the same preparation style as chicken.",
        goal: "vegetarian",
      },
      {
        type: "alternative_for_goal", slug: "tempeh", name: "Tempeh",
        explanation: "Fermented soya with a firm texture and deeper flavour; slices and cubes work where chicken is used in stir-fries and traybakes.",
        goal: "vegetarian",
      },
      {
        type: "alternative_for_goal", slug: "lentils", name: "Lentils",
        explanation: "Provide plant protein in curries, stews and bolognese-style dishes where chicken is the main protein.",
        goal: "vegetarian",
      },
      {
        type: "alternative_for_goal", slug: "chickpeas", name: "Chickpeas",
        explanation: "A satisfying plant protein in curries and traybakes that most households already stock.",
        goal: "vegetarian",
      },
      {
        type: "alternative_for_goal", slug: "salmon", name: "Salmon",
        explanation: "A different protein source that works in baked and pan-cooked preparations using similar seasonings.",
        goal: "pescatarian",
      },
    ],
  },

  // ── Greek Yoghurt ────────────────────────────────────────────────────────────
  // Note: greek-yoghurt is a variety of yoghurt canonical. It is included as a
  // graph node here because it has distinct nutritional characteristics and is
  // commonly queried directly by households. The derived same_variety resolver
  // will also surface it via the yoghurt canonical.
  "greek-yoghurt": {
    name: "Greek Yoghurt",
    edges: [
      {
        type: "similar_to", slug: "kefir", name: "Kefir",
        explanation: "Both are fermented dairy products with live cultures; kefir is drinkable and has a more pronounced tang.",
      },
      {
        type: "similar_to", slug: "yoghurt", name: "Yoghurt",
        explanation: "Greek yoghurt is strained yoghurt — the same culture, concentrated to a thicker texture and higher protein content.",
      },
      {
        type: "often_cooked_with", slug: "blueberry", name: "Blueberry",
        explanation: "Blueberries and Greek yoghurt are a popular breakfast and snack combination.",
      },
      {
        type: "often_cooked_with", slug: "cucumber", name: "Cucumber",
        explanation: "Greek yoghurt and cucumber form the base of tzatziki and raita — staples in Greek and South Asian cooking.",
      },
      {
        type: "often_cooked_with", slug: "garlic", name: "Garlic",
        explanation: "Garlic is essential in tzatziki and yoghurt-based dips, dressings and marinades.",
      },
      {
        type: "often_cooked_with", slug: "mint", name: "Mint",
        explanation: "Mint and yoghurt are paired in tzatziki, raita and Middle Eastern sauces.",
      },
      {
        type: "often_cooked_with", slug: "raspberry", name: "Raspberry",
        explanation: "A common pairing for breakfasts, layered desserts and snacks.",
      },
      {
        type: "alternative_for_goal", slug: "kefir", name: "Kefir",
        explanation: "A drinkable fermented dairy option that provides similar live cultures and protein.",
        goal: "fermented-foods",
      },
      {
        type: "alternative_for_goal", slug: "oat-milk", name: "Oat Milk",
        explanation: "A plant-based option for those avoiding dairy; lower in protein but suitable for dressings and smoothies.",
        goal: "dairy-free",
      },
      {
        type: "alternative_for_goal", slug: "soy-milk", name: "Soy Milk",
        explanation: "The highest-protein plant milk alternative; works in smoothies and some dressings.",
        goal: "dairy-free",
      },
      {
        type: "alternative_for_goal", slug: "tofu", name: "Tofu",
        explanation: "Silken tofu blended smoothly can stand in for Greek yoghurt in dips, smoothies and some baked dishes.",
        goal: "dairy-free",
      },
    ],
  },

  // ── Yoghurt (canonical) ──────────────────────────────────────────────────────
  "yoghurt": {
    name: "Yoghurt",
    edges: [
      {
        type: "similar_to", slug: "kefir", name: "Kefir",
        explanation: "Both are fermented dairy products with live cultures; kefir is drinkable and has a tangier flavour.",
      },
      {
        type: "similar_to", slug: "greek-yoghurt", name: "Greek Yoghurt",
        explanation: "Greek yoghurt is strained yoghurt — thicker and higher in protein, made the same way.",
      },
      {
        type: "often_cooked_with", slug: "blueberry", name: "Blueberry",
        explanation: "A popular breakfast pairing; blueberries and yoghurt are combined in bowls, parfaits and smoothies.",
      },
      {
        type: "often_cooked_with", slug: "raspberry", name: "Raspberry",
        explanation: "A common pairing for breakfasts, snacks and layered desserts.",
      },
      {
        type: "often_cooked_with", slug: "cucumber", name: "Cucumber",
        explanation: "Yoghurt and cucumber form the base of tzatziki, raita and cooling Middle Eastern sauces.",
      },
      {
        type: "alternative_for_goal", slug: "kefir", name: "Kefir",
        explanation: "A drinkable fermented dairy alternative providing similar live cultures.",
        goal: "fermented-foods",
      },
      {
        type: "alternative_for_goal", slug: "oat-milk", name: "Oat Milk",
        explanation: "A plant-based option for those avoiding dairy; works in smoothies and dressings.",
        goal: "dairy-free",
      },
      {
        type: "alternative_for_goal", slug: "soy-milk", name: "Soy Milk",
        explanation: "The highest-protein plant milk; works where yoghurt is used in smoothies or baking.",
        goal: "dairy-free",
      },
    ],
  },
};

// ── Derived-data indices (built once, lazily) ─────────────────────────────────

interface CanonicalIndex {
  /** canonical slug → { name, category, subcategory, varieties: [{slug, name}], parentSlug?: string } */
  bySlug: Map<string, {
    name: string;
    category: string;
    subcategory: string;
    varieties: Array<{ slug: string; name: string }>;
  }>;
  /** variety slug → { name, parentSlug } */
  byVarietySlug: Map<string, { name: string; parentSlug: string }>;
  /** subcategory → canonical slugs that share it */
  bySubcategory: Map<string, string[]>;
}

let _canonicalIndex: CanonicalIndex | null = null;

function getCanonicalIndex(): CanonicalIndex {
  if (_canonicalIndex) return _canonicalIndex;

  const bySlug: CanonicalIndex["bySlug"] = new Map();
  const byVarietySlug: CanonicalIndex["byVarietySlug"] = new Map();
  const bySubcategory: CanonicalIndex["bySubcategory"] = new Map();

  for (const entry of CANONICAL_SEED) {
    const { slug, name, category, subcategory } = entry.food;
    const varieties = (entry.varieties ?? []).map(v => ({ slug: v.slug, name: v.name }));

    bySlug.set(slug, { name, category: category ?? "", subcategory: subcategory ?? "", varieties });

    for (const v of varieties) {
      byVarietySlug.set(v.slug, { name: v.name, parentSlug: slug });
    }

    const sub = subcategory ?? "";
    if (sub) {
      const group = bySubcategory.get(sub) ?? [];
      group.push(slug);
      bySubcategory.set(sub, group);
    }
  }

  _canonicalIndex = { bySlug, byVarietySlug, bySubcategory };
  return _canonicalIndex;
}

// ── Benefit overlap computation ───────────────────────────────────────────────

function derivedSharesBenefits(
  targetSlug: string,
  existingSlugs: Set<string>,
  limit = 4,
): FoodRelationship[] {
  const targetBenefits = FOOD_BENEFITS[targetSlug];
  if (!targetBenefits || targetBenefits.length === 0) return [];

  const targetSet = new Set(targetBenefits);
  const scored: Array<{ slug: string; name: string; overlap: string[] }> = [];

  for (const [slug, benefits] of Object.entries(FOOD_BENEFITS)) {
    if (slug === targetSlug || existingSlugs.has(slug)) continue;

    const overlap = benefits.filter(b => targetSet.has(b));
    if (overlap.length >= 2) {
      const index = getCanonicalIndex();
      const canonical = index.bySlug.get(slug);
      if (!canonical) continue;
      scored.push({ slug, name: canonical.name, overlap });
    }
  }

  // Sort by overlap count descending, then alphabetically for determinism
  scored.sort((a, b) =>
    b.overlap.length - a.overlap.length || a.name.localeCompare(b.name),
  );

  return scored.slice(0, limit).map(({ slug, name, overlap }) => ({
    slug,
    name,
    type: "shares_benefits" as RelationshipType,
    explanation: `Both ${name.toLowerCase()} and this food support ${overlap.slice(0, 2).join(" and ")}.`,
  }));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the food relationship graph for a given slug.
 *
 * Accepts both canonical food slugs ("tomato") and variety slugs
 * ("greek-yoghurt"). Returns null when the slug is not recognised.
 *
 * Relationships are returned in tier order:
 *   same_variety → same_family → similar_to →
 *   often_cooked_with → shares_benefits → seasonal_with →
 *   alternative_for_goal
 */
export function getFoodRelationships(slug: string): FoodGraph | null {
  const index = getCanonicalIndex();

  const isCanonical = index.bySlug.has(slug);
  const varietyInfo = index.byVarietySlug.get(slug);
  const hasEditorial = !!EDITORIAL_GRAPH[slug];

  if (!isCanonical && !varietyInfo && !hasEditorial) return null;

  const editorial = EDITORIAL_GRAPH[slug];
  const displayName = editorial?.name
    ?? index.bySlug.get(slug)?.name
    ?? varietyInfo?.name
    ?? slug;

  const canonicalSlug = isCanonical ? slug : (varietyInfo?.parentSlug ?? null);
  const canonicalInfo = canonicalSlug ? index.bySlug.get(canonicalSlug) : null;

  const relationships: FoodRelationship[] = [];
  const seenSlugs = new Set<string>([slug]);

  const add = (rel: FoodRelationship) => {
    if (!seenSlugs.has(rel.slug)) {
      seenSlugs.add(rel.slug);
      relationships.push(rel);
    }
  };

  // ── Tier 1a: same_variety (derived — always unique, always first) ───────────

  if (isCanonical && canonicalInfo && canonicalInfo.varieties.length > 0) {
    for (const v of canonicalInfo.varieties) {
      add({
        slug: v.slug,
        name: v.name,
        type: "same_variety",
        explanation: `${v.name} is a variety of ${displayName}.`,
      });
    }
  }

  if (!isCanonical && varietyInfo) {
    const parentInfo = index.bySlug.get(varietyInfo.parentSlug);
    if (parentInfo) {
      add({
        slug: varietyInfo.parentSlug,
        name: parentInfo.name,
        type: "same_variety",
        explanation: `${displayName} is a variety of ${parentInfo.name}.`,
      });
    }
    for (const v of parentInfo?.varieties ?? []) {
      if (v.slug !== slug) {
        add({
          slug: v.slug,
          name: v.name,
          type: "same_variety",
          explanation: `${v.name} is another variety of ${parentInfo?.name ?? "the same food"}.`,
        });
      }
    }
  }

  // ── Tier 1b–3: editorial relationships (run before derived same_family) ───
  // Editorial wins — specific culinary knowledge takes priority over category
  // proximity. Derived same_family fills in gaps afterwards.

  const editorialOrder: RelationshipType[] = [
    "similar_to",
    "often_cooked_with",
    "seasonal_with",
    "alternative_for_goal",
  ];

  for (const tier of editorialOrder) {
    for (const edge of editorial?.edges ?? []) {
      if (edge.type === tier) {
        add({ slug: edge.slug, name: edge.name, type: edge.type, explanation: edge.explanation, goal: edge.goal });
      }
    }
  }

  // ── Tier 1c: same_family (derived — fills gaps not covered editorially) ───

  const subcat = canonicalInfo?.subcategory ?? "";
  if (subcat) {
    const siblings = (index.bySubcategory.get(subcat) ?? [])
      .filter(s => s !== slug && s !== canonicalSlug)
      .slice(0, 5);
    for (const sibSlug of siblings) {
      const sib = index.bySlug.get(sibSlug);
      if (sib) {
        add({
          slug: sibSlug,
          name: sib.name,
          type: "same_family",
          explanation: `${sib.name} and ${displayName} are both ${subcat.toLowerCase()}.`,
        });
      }
    }
  }

  // ── Tier 2: shares_benefits (inferred, fills in after editorial + family) ──

  const benefitSlugs = derivedSharesBenefits(
    canonicalSlug && FOOD_BENEFITS[canonicalSlug] ? canonicalSlug : slug,
    seenSlugs,
    4,
  );
  for (const rel of benefitSlugs) {
    add(rel);
  }

  return {
    slug,
    name: displayName,
    canonicalSlug,
    relationships,
  };
}

// ── Worked example runner ─────────────────────────────────────────────────────

/**
 * Formats a FoodGraph result as a human-readable string for the POC.
 * Not for production use — demonstration only.
 */
export function formatFoodGraph(graph: FoodGraph): string {
  const TIER_LABELS: Record<RelationshipType, string> = {
    same_variety: "Varieties",
    same_family: "Same family",
    similar_to: "Similar foods",
    often_cooked_with: "Often cooked with",
    shares_benefits: "Shares benefits",
    seasonal_with: "In season together",
    alternative_for_goal: "Alternative choices",
  };

  const groups = new Map<RelationshipType, FoodRelationship[]>();
  const order: RelationshipType[] = [
    "same_variety",
    "similar_to",
    "often_cooked_with",
    "seasonal_with",
    "alternative_for_goal",
    "same_family",
    "shares_benefits",
  ];

  for (const rel of graph.relationships) {
    const group = groups.get(rel.type) ?? [];
    group.push(rel);
    groups.set(rel.type, group);
  }

  const lines: string[] = [`\n══ ${graph.name} ══`];

  for (const type of order) {
    const items = groups.get(type);
    if (!items || items.length === 0) continue;
    lines.push(`\n${TIER_LABELS[type]}:`);
    for (const rel of items) {
      const goalTag = rel.goal ? ` [${rel.goal}]` : "";
      lines.push(`  • ${rel.name}${goalTag}`);
      lines.push(`    ${rel.explanation}`);
    }
  }

  return lines.join("\n");
}
