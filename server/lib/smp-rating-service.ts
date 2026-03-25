// ---------------------------------------------------------------------------
// Whole-food recognition
// ---------------------------------------------------------------------------

const WHOLE_FOOD_CORE = new Set([
  // Vegetables
  "onion", "onions", "carrot", "carrots", "potato", "potatoes",
  "sweet potato", "sweet potatoes",
  "tomato", "tomatoes", "cherry tomato", "cherry tomatoes",
  "plum tomato", "plum tomatoes", "vine tomato", "vine tomatoes", "spinach",
  "broccoli", "cauliflower", "cabbage", "lettuce", "celery", "cucumber",
  "courgette", "zucchini", "aubergine", "eggplant", "pepper", "peppers",
  "capsicum", "mushroom", "mushrooms", "garlic", "leek", "leeks",
  "pea", "peas", "bean", "beans", "lentil", "lentils", "chickpea", "chickpeas",
  "sweetcorn", "corn", "parsnip", "turnip", "swede", "beetroot", "beet",
  "asparagus", "artichoke", "kale", "chard", "radish",
  "spring onion", "spring onions", "scallion", "scallions",
  "green onion", "green onions", "salad onion", "salad onions",
  "shallot", "shallots",
  "butternut squash", "pumpkin", "fennel", "pak choi", "bok choy",
  "spring greens", "watercress", "rocket", "arugula", "edamame",
  "mangetout", "sugar snap peas", "broad bean", "broad beans",
  "runner bean", "runner beans", "okra",
  "bean sprout", "bean sprouts", "beansprout", "beansprouts",
  "mung bean sprout", "mung bean sprouts",
  // Tinned/canned compound terms that may reach the name check
  // (ingredient-text validation still required at scoring time)
  "tinned beans", "tinned chickpeas", "tinned lentils", "tinned tomatoes",
  "canned beans", "canned chickpeas", "canned lentils", "canned tomatoes",
  "dried beans", "dried chickpeas", "dried lentils",
  // Fruits
  "apple", "apples", "banana", "bananas", "orange", "oranges",
  "grape", "grapes", "strawberry", "strawberries", "blueberry", "blueberries",
  "raspberry", "raspberries", "mango", "mangoes", "pineapple", "watermelon",
  "melon", "kiwi", "pear", "pears", "plum", "plums", "cherry", "cherries",
  "peach", "peaches", "apricot", "apricots", "lemon", "lemons",
  "lime", "limes", "grapefruit", "avocado", "avocados",
  "fig", "figs", "date", "dates", "nectarine", "nectarines",
  "clementine", "clementines", "satsuma", "satsumas",
  "tangerine", "tangerines", "pomegranate", "pomegranates",
  // Grains / staples
  "oats", "oat", "rice", "quinoa", "barley", "rye", "wheat", "buckwheat",
  "millet", "spelt", "polenta", "cornmeal", "couscous", "bulgur", "bulgur wheat",
  // Seeds & nuts
  "chia seed", "chia seeds", "flaxseed", "linseed",
  "sunflower seed", "sunflower seeds", "pumpkin seed", "pumpkin seeds",
  "sesame seed", "sesame seeds", "hemp seed", "hemp seeds",
  "almond", "almonds", "walnut", "walnuts", "cashew", "cashews",
  "brazil nut", "brazil nuts", "pecan", "pecans",
  "pistachio", "pistachios", "hazelnut", "hazelnuts", "macadamia",
  "pine nut", "pine nuts",
  // Plain protein (meat / fish / eggs)
  "egg", "eggs",
  "chicken", "chicken breast", "chicken thigh", "chicken thighs",
  "chicken leg", "chicken legs",
  "beef", "beef steak", "beef mince", "lamb", "lamb chop", "lamb chops",
  "pork", "pork chop", "pork chops", "turkey", "turkey breast",
  "salmon", "salmon fillet", "salmon fillets", "tuna", "cod",
  "cod fillet", "cod fillets", "haddock", "mackerel", "sardine", "sardines",
  "trout", "herring", "prawn", "prawns", "shrimp", "crab", "lobster",
  "mussel", "mussels",
  "tofu", "tempeh",
  // Plain dairy
  "milk", "butter", "cream",
  "plain yogurt", "plain yoghurt", "natural yogurt", "natural yoghurt",
  "greek yogurt", "greek yoghurt", "greek-style yogurt", "greek-style yoghurt",
  "cottage cheese", "ricotta", "mozzarella", "feta",
  // Herbs / spices (whole or dried)
  "ginger", "turmeric", "cinnamon", "cumin", "coriander", "paprika",
  "black pepper", "pepper", "sea salt", "salt", "thyme", "rosemary",
  "basil", "oregano", "parsley", "dill", "mint", "chilli", "chili",
  "cayenne", "cardamom", "clove", "cloves", "nutmeg",
  "bay leaf", "bay leaves", "star anise", "saffron", "sumac",
  // Oils (unrefined)
  "olive oil", "extra virgin olive oil", "coconut oil",
  // Natural sweeteners
  "honey", "maple syrup",
]);

// Qualifiers that may precede or follow a core term without disqualifying it.
// NOTE: "tinned" and "canned" are intentionally EXCLUDED here; canned items
// only reach 5 apples if their actual ingredient list is also clean.
const WHOLE_FOOD_QUALIFIER_PREFIXES = [
  "fresh", "frozen", "organic", "raw", "peeled", "chopped", "sliced",
  "diced", "whole", "dried", "plain", "washed", "baby", "new",
  "red", "green", "yellow", "white", "brown", "sweet", "large", "medium",
  "small", "boneless", "skinless", "free-range", "free range",
  "british", "english", "local", "seasonal", "extra virgin",
  "salted", "unsalted", "mixed", "ripe",
  "loose", "unwaxed", "waxed", "trimmed", "prepared", "ready to cook",
  "ready to eat", "stir-fry", "stir fry",
];

const WHOLE_FOOD_DISQUALIFIERS = [
  "ring", "rings", "chip", "chips", "crisp", "crisps", "nugget", "nuggets",
  "burger", "burgers", "powder", "extract", "concentrate", "sauce",
  "paste", "vinegar", "pickled", "smoked", "cured", "flavoured", "flavored",
  "coated", "battered", "breaded", "stuffed", "marinated",
  "instant", "microwave", "processed", "reformed",
  "bar", "cake", "cookie", "biscuit", "cracker", "bread", "roll", "wrap",
  "spread", "dip", "relish", "chutney", "ketchup", "mayo", "mayonnaise",
  "soup", "stew", "curry", "casserole", "pie", "tart",
  "artificial", "modified starch",
  "baked beans",  // compound override — baked beans ≠ plain beans
  "in sauce", "in brine with",
];

export function isWholeFoodIngredient(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (!lower) return false;

  if (WHOLE_FOOD_DISQUALIFIERS.some(d => lower.includes(d))) return false;

  if (WHOLE_FOOD_CORE.has(lower)) return true;

  const qualifierRx = new RegExp(
    `^(${WHOLE_FOOD_QUALIFIER_PREFIXES.map(q => q.replace(/[-]/g, "[-]")).join("|")})\\s+`,
    "i",
  );
  const suffixRx = new RegExp(
    `\\s+(${WHOLE_FOOD_QUALIFIER_PREFIXES.map(q => q.replace(/[-]/g, "[-]")).join("|")})$`,
    "i",
  );

  const stripped = lower.replace(qualifierRx, "").trim();
  if (stripped !== lower && WHOLE_FOOD_CORE.has(stripped)) return true;

  const strippedSuffix = lower.replace(suffixRx, "").trim();
  if (strippedSuffix !== lower && WHOLE_FOOD_CORE.has(strippedSuffix)) return true;

  return false;
}
