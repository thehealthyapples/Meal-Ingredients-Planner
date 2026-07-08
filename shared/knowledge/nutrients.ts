// WS0 — Nutrition Knowledge Registry: Nutrients seed data.
//
// Editorial, human-curated, deterministic. Descriptions explain what a nutrient
// is and broadly what the body uses it for — no dosing, no medical claims.
// Edit freely; every row is upserted by slug.
import type { InsertKnowledgeNutrient } from "../schema";

export const NUTRIENT_SEED: InsertKnowledgeNutrient[] = [
  { slug: "fibre", name: "Fibre", category: "macronutrient", displayOrder: 1,
    description: "Plant material the body doesn't fully digest. Helps feed gut bacteria and keeps digestion moving." },
  // NK6M — `protein` is the SINGLE canonical protein identity (see displayOrder 31).
  // "Plant protein" and "animal protein" are SOURCE attributes of that one
  // nutrient, not separate identities: the source is a property of the food the
  // protein comes from, not of the substance. The former `plant-protein` identity
  // was collapsed into `protein` and now resolves to it as an alias (GOV2 Rule 3/7,
  // canonical-vocabulary-resolver.ts). This slot is intentionally left to `protein`.
  { slug: "unsaturated-fats", name: "Unsaturated Fats", category: "macronutrient", displayOrder: 3,
    description: "The fats found in olive oil, avocado, nuts and seeds, central to a heart-friendly way of eating." },
  { slug: "omega-3", name: "Omega-3", category: "fatty-acid", displayOrder: 4,
    description: "A family of unsaturated fats found in oily fish, walnuts and flaxseed, associated with heart and brain health." },
  { slug: "magnesium", name: "Magnesium", category: "mineral", displayOrder: 5,
    description: "A mineral the body uses in hundreds of processes, including muscle and nervous-system function." },
  { slug: "zinc", name: "Zinc", category: "mineral", displayOrder: 6,
    description: "A mineral that contributes to normal immune function and helps the body use nutrients." },
  { slug: "iron", name: "Iron", category: "mineral", displayOrder: 7,
    description: "A mineral the body uses to carry oxygen in the blood and to release energy from food." },
  { slug: "calcium", name: "Calcium", category: "mineral", displayOrder: 8,
    description: "A mineral that bones and teeth are built from, also used by muscles and nerves." },
  { slug: "potassium", name: "Potassium", category: "mineral", displayOrder: 9,
    description: "A mineral that helps balance fluids and supports normal blood pressure and muscle function." },
  { slug: "selenium", name: "Selenium", category: "mineral", displayOrder: 10,
    description: "A trace mineral that acts as part of the body's antioxidant defences." },
  { slug: "manganese", name: "Manganese", category: "mineral", displayOrder: 11,
    description: "A trace mineral involved in bone formation and the body's antioxidant systems." },
  { slug: "copper", name: "Copper", category: "mineral", displayOrder: 12,
    description: "A trace mineral the body uses for energy release and to keep nerves and immunity working normally." },
  { slug: "iodine", name: "Iodine", category: "mineral", displayOrder: 13,
    description: "A trace mineral needed for normal thyroid function and metabolism." },
  { slug: "vitamin-c", name: "Vitamin C", category: "vitamin", displayOrder: 14,
    description: "A water-soluble vitamin that supports the immune system and helps the body absorb iron from plants." },
  { slug: "vitamin-d", name: "Vitamin D", category: "vitamin", displayOrder: 15,
    description: "The 'sunshine' vitamin that helps the body use calcium and supports normal immune function." },
  { slug: "vitamin-e", name: "Vitamin E", category: "vitamin", displayOrder: 16,
    description: "A fat-soluble antioxidant vitamin found in nuts, seeds and plant oils." },
  { slug: "vitamin-k", name: "Vitamin K", category: "vitamin", displayOrder: 17,
    description: "A vitamin found in leafy greens that contributes to normal blood clotting and bone health." },
  { slug: "vitamin-a", name: "Vitamin A", category: "vitamin", displayOrder: 18,
    description: "A vitamin important for vision, skin and immunity. Plants supply it as beta-carotene." },
  { slug: "beta-carotene", name: "Beta-Carotene", category: "phytonutrient", family: "carotenoids", displayOrder: 19,
    description: "The orange-red plant pigment the body can convert into vitamin A." },
  { slug: "folate", name: "Folate", category: "vitamin", displayOrder: 20,
    description: "A B vitamin (B9) found in leafy greens and legumes, used to make new cells." },
  { slug: "vitamin-b6", name: "Vitamin B6", category: "vitamin", displayOrder: 21,
    description: "A B vitamin involved in energy release and normal nervous-system function." },
  { slug: "vitamin-b12", name: "Vitamin B12", category: "vitamin", displayOrder: 22,
    description: "A B vitamin used to make red blood cells and keep the nervous system healthy." },
  { slug: "polyphenols", name: "Polyphenols", category: "phytonutrient", displayOrder: 23,
    description: "A large family of protective plant compounds found in colourful fruit, vegetables, herbs and olive oil." },
  { slug: "flavonoids", name: "Flavonoids", category: "phytonutrient", displayOrder: 24,
    description: "A group of polyphenols giving plants colour and associated with heart and brain health." },
  { slug: "anthocyanins", name: "Anthocyanins", category: "phytonutrient", displayOrder: 25,
    description: "The deep blue-purple pigments in berries and red cabbage, a type of flavonoid." },
  { slug: "lycopene", name: "Lycopene", category: "phytonutrient", family: "carotenoids", displayOrder: 26,
    description: "The red pigment in tomatoes, more available to the body once tomatoes are cooked." },
  { slug: "sulforaphane", name: "Sulforaphane", category: "phytonutrient", displayOrder: 27,
    description: "A protective compound formed in brassicas such as broccoli and kale." },
  { slug: "allicin", name: "Allicin", category: "phytonutrient", displayOrder: 28,
    description: "A sulphur compound released when garlic is crushed or chopped." },
  { slug: "nitrates", name: "Dietary Nitrates", category: "phytonutrient", displayOrder: 29,
    description: "Natural compounds in beetroot and leafy greens associated with healthy blood flow." },
  { slug: "live-cultures", name: "Live Cultures", category: "other", displayOrder: 30,
    description: "Beneficial bacteria found in fermented foods such as live yogurt, kefir, kimchi and sauerkraut." },
  // NK6L — vocabulary added from the NK6K canonical governance triage. Each is a
  // real substance with no prior canonical home; none is a synonym of an
  // existing identity (GOV2 Rule 4 new-identity decisions).
  // NK6M — the single canonical protein identity. Covers protein from every
  // source; whether it is plant or animal protein is a SOURCE attribute carried by
  // the food, not a separate nutrient. `plant-protein`/`animal-protein` resolve
  // here via the resolver (no duplicate ownership).
  { slug: "protein", name: "Protein", category: "macronutrient", displayOrder: 31,
    description: "The protein in foods used to build and repair the body. It comes from both plant sources (beans, lentils, nuts and seeds) and animal sources (eggs, fish and dairy); the source is a property of the food, not a different nutrient." },
  { slug: "choline", name: "Choline", category: "other", displayOrder: 32,
    description: "An essential nutrient found in eggs and other foods, used by the brain and to keep cell membranes healthy." },
  { slug: "lutein", name: "Lutein", category: "phytonutrient", family: "carotenoids", displayOrder: 33,
    description: "A yellow carotenoid found in leafy greens and egg yolks that concentrates in the eye, associated with eye-health nutrition context." },
  { slug: "zeaxanthin", name: "Zeaxanthin", category: "phytonutrient", family: "carotenoids", displayOrder: 34,
    description: "A carotenoid found alongside lutein in leafy greens, sweetcorn and egg yolks, associated with eye-health nutrition context." },
  // Glucosinolates keep their OWN canonical identity (NK6L amendment: not aliased
  // to sulforaphane). The precursor→active relationship to sulforaphane is stated
  // once, here, in prose — sulforaphane still owns its own facts (no duplication).
  { slug: "glucosinolates", name: "Glucosinolates", category: "phytonutrient", displayOrder: 35,
    description: "Sulphur compounds in brassicas such as broccoli and kale. When the vegetable is chopped or chewed they convert into active compounds, including sulforaphane." },
  // NK6M — parent phytonutrient FAMILY. `carotenoids` is a real canonical identity
  // in its own right (the fat-soluble plant pigment family), and it is the parent
  // that beta-carotene, lycopene, lutein and zeaxanthin are classified beneath via
  // their `family: "carotenoids"` attribute. The members are NOT merged or aliased
  // into it — each keeps its own identity, description and facts. Family is a
  // classification, not an alias.
  { slug: "carotenoids", name: "Carotenoids", category: "phytonutrient", displayOrder: 36,
    description: "The family of fat-soluble yellow, orange and red plant pigments — including beta-carotene, lycopene, lutein and zeaxanthin — found in colourful vegetables and leafy greens. Absorbed better with a little fat in the meal." },
];
