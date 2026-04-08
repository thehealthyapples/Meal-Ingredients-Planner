/**
 * Food synonym dictionary and fuzzy spelling corrector.
 * Used on both client (meal filtering) and server (web search query expansion).
 *
 * Synonym map is one-directional in definition but expanded bidirectionally at runtime:
 *   searching "eggplant" also matches "aubergine" entries and vice-versa.
 *
 * Ranking contract (callers must enforce):
 *   1. Exact substring match (score 100)
 *   2. Synonym match (score 80)
 *   3. Fuzzy match ≥ 80% similarity (score proportional)
 */

// ---------------------------------------------------------------------------
// Synonym dictionary
// Each key is the canonical/UK term; values are alternates (US variants, common
// spelling variants, abbreviations).  Expansion is bidirectional.
// ---------------------------------------------------------------------------
const SYNONYM_MAP: Record<string, string[]> = {
  aubergine:             ["eggplant"],
  courgette:             ["zucchini"],
  coriander:             ["cilantro"],
  rocket:                ["arugula", "roquette"],
  "spring onion":        ["scallion", "green onion", "salad onion"],
  swede:                 ["rutabaga"],
  prawn:                 ["shrimp"],
  "king prawn":          ["jumbo shrimp", "tiger prawn"],
  capsicum:              ["bell pepper", "sweet pepper"],
  "red pepper":          ["red capsicum", "red bell pepper"],
  "green pepper":        ["green capsicum", "green bell pepper"],
  "yellow pepper":       ["yellow capsicum", "yellow bell pepper"],
  mince:                 ["ground meat", "ground beef", "minced meat"],
  "minced beef":         ["ground beef"],
  "minced lamb":         ["ground lamb"],
  "minced pork":         ["ground pork"],
  cornflour:             ["cornstarch", "corn starch"],
  "plain flour":         ["all-purpose flour", "all purpose flour"],
  "self-raising flour":  ["self-rising flour", "self raising flour"],
  "caster sugar":        ["superfine sugar", "castor sugar", "baker's sugar"],
  "icing sugar":         ["powdered sugar", "confectioners sugar", "confectioner's sugar"],
  "double cream":        ["heavy cream", "whipping cream", "heavy whipping cream"],
  "single cream":        ["light cream", "pouring cream", "coffee cream"],
  "crème fraîche":       ["creme fraiche", "soured cream"],
  "natural yogurt":      ["plain yogurt", "plain yoghurt", "natural yoghurt"],
  "tomato purée":        ["tomato paste", "tomato puree"],
  passata:               ["strained tomatoes", "tomato passata", "sieved tomatoes"],
  "stock cube":          ["bouillon cube", "broth cube"],
  "worcestershire sauce":["worcester sauce", "brown sauce"],
  "broad bean":          ["fava bean"],
  "mange tout":          ["snow pea", "snap pea", "mangetout"],
  "pak choi":            ["bok choy", "bok choi", "pac choi"],
  "butternut squash":    ["butternut pumpkin"],
  "jacket potato":       ["baked potato"],
  "spring greens":       ["collard greens"],
  "runner bean":         ["green bean", "string bean", "french bean"],
  "sweet potato":        ["yam", "kumara"],
  "chestnut mushroom":   ["cremini mushroom", "brown mushroom", "baby bella"],
  "butter beans":        ["lima beans", "lima bean"],
  "haricot bean":        ["navy bean", "white bean"],
  "borlotti bean":       ["cranberry bean"],
  beetroot:              ["beet", "red beet"],
  sultanas:              ["golden raisins", "raisins"],
  "bicarbonate of soda": ["baking soda", "bicarb"],
  gammon:                ["ham steak"],
  chips:                 ["fries", "french fries"],
  crisps:                ["chips", "potato chips"],
  porridge:              ["oatmeal"],
  biscuit:               ["cookie"],
  tin:                   ["can"],
  tinned:                ["canned"],
  flatbread:             ["naan", "pita", "pitta"],
  couscous:              ["cous cous"],
  edamame:               ["edamame beans", "soy beans", "soybeans"],
  tahini:                ["sesame paste", "tahina"],
  hummus:                ["houmous", "hummous"],
  "chilli flakes":       ["red pepper flakes", "dried chilli", "crushed red pepper"],
  chilli:                ["chili", "chile"],
  "spring roll":         ["egg roll"],
  "soy sauce":           ["soya sauce"],
};

// ---------------------------------------------------------------------------
// Build a flat, bidirectional lookup for fast synonym expansion
// Key: any variant (lowercased) → canonical + all its siblings
// ---------------------------------------------------------------------------
type SynonymGroup = string[];
const SYNONYM_LOOKUP = new Map<string, SynonymGroup>();

for (const [canonical, variants] of Object.entries(SYNONYM_MAP)) {
  const group: SynonymGroup = [canonical, ...variants].map(s => s.toLowerCase());
  for (const term of group) {
    SYNONYM_LOOKUP.set(term, group);
  }
}

// ---------------------------------------------------------------------------
// Known food terms used for fuzzy spelling correction
// Kept as a flat list so levenshtein can compare efficiently
// ---------------------------------------------------------------------------
export const FOOD_TERM_DICTIONARY: string[] = [
  // vegetables
  "aubergine", "courgette", "broccoli", "cauliflower", "asparagus",
  "artichoke", "leek", "spinach", "lettuce", "cucumber", "tomato",
  "avocado", "mushroom", "capsicum", "celery", "carrot", "parsnip",
  "turnip", "celeriac", "fennel", "beetroot", "sweetcorn", "radish",
  "watercress", "rocket", "chicory", "endive", "kale", "chard",
  "pak choi", "swede", "shallot", "spring onion", "pumpkin",
  "butternut", "squash", "peas", "beans", "lentils", "chickpeas",
  // fruit
  "strawberry", "raspberry", "blueberry", "blackberry", "mango",
  "pineapple", "papaya", "lychee", "passion fruit", "pomegranate",
  "clementine", "satsuma", "tangerine", "banana", "apple", "pear",
  "peach", "apricot", "plum", "cherry", "grape", "melon",
  // proteins
  "chicken", "salmon", "tuna", "sardine", "mackerel", "halibut",
  "haddock", "plaice", "anchovies", "prawn", "scallop", "squid",
  "beef", "pork", "lamb", "turkey", "duck", "venison",
  "bacon", "sausage", "mince", "steak",
  // dairy & eggs
  "butter", "cheese", "cream", "yogurt", "yoghurt", "milk",
  "mozzarella", "parmesan", "ricotta", "cheddar", "feta",
  "brie", "camembert", "gouda", "emmental",
  // herbs & spices
  "coriander", "cinnamon", "paprika", "cumin", "cardamom", "turmeric",
  "oregano", "thyme", "rosemary", "basil", "parsley", "tarragon",
  "chervil", "marjoram", "saffron", "fenugreek", "nutmeg", "cloves",
  "ginger", "garlic", "chilli", "pepper", "cayenne",
  // pasta/grains
  "fettuccine", "tagliatelle", "pappardelle", "rigatoni", "linguine",
  "penne", "gnocchi", "risotto", "couscous", "quinoa", "polenta",
  "bulgur", "buckwheat", "spaghetti", "lasagne", "tortellini",
  "rice", "pasta", "noodles", "barley", "oats", "flour",
  // bread
  "baguette", "croissant", "brioche", "sourdough", "ciabatta",
  "focaccia", "bruschetta", "biscuit", "cracker", "pitta",
  // sauces & condiments
  "ketchup", "mustard", "mayonnaise", "vinegar", "tahini",
  "hummus", "pesto", "sriracha", "teriyaki", "harissa",
  // international
  "guacamole", "jalapeño", "chipotle", "tortilla", "enchilada",
  "quesadilla", "edamame", "tabbouleh", "falafel", "shawarma",
  "ratatouille", "hollandaise", "bechamel", "vinaigrette",
  "prosciutto", "pancetta", "chorizo", "pancakes", "waffles",
];

// ---------------------------------------------------------------------------
// Levenshtein distance (space-optimised single-row)
// ---------------------------------------------------------------------------
export function levenshtein(a: string, b: string): number {
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  // Fast bail-out: if length difference alone exceeds threshold, skip
  if (Math.abs(la - lb) > 5) return Math.abs(la - lb);

  const row: number[] = Array.from({ length: lb + 1 }, (_, i) => i);
  for (let i = 1; i <= la; i++) {
    let prev = i;
    for (let j = 1; j <= lb; j++) {
      const val =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : 1 + Math.min(row[j - 1], row[j], prev);
      row[j - 1] = prev;
      prev = val;
    }
    row[lb] = prev;
  }
  return row[lb];
}

/**
 * Return similarity ratio 0-1 between two strings.
 * 1.0 = identical.
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ---------------------------------------------------------------------------
// Spelling correction
// Finds the closest food term if similarity ≥ FUZZY_THRESHOLD
// ---------------------------------------------------------------------------
const FUZZY_THRESHOLD = 0.75; // require ≥75% similarity
const MIN_CORRECT_LEN = 4;    // don't correct very short words (avoid false positives)

/**
 * If `term` is close to a known food word, return the known word.
 * Otherwise return `term` unchanged.
 */
export function correctFoodSpelling(term: string): string {
  const t = term.toLowerCase().trim();
  if (t.length < MIN_CORRECT_LEN) return term;

  // Exact match in dictionary — already correct
  if (FOOD_TERM_DICTIONARY.includes(t)) return term;

  // Check synonyms too
  if (SYNONYM_LOOKUP.has(t)) return term;

  let bestWord = term;
  let bestSim = 0;

  for (const word of FOOD_TERM_DICTIONARY) {
    const s = similarity(t, word);
    if (s > bestSim) {
      bestSim = s;
      bestWord = word;
    }
  }
  // Also check synonym keys
  SYNONYM_LOOKUP.forEach((_, word) => {
    if (word.includes(' ')) return; // skip multi-word synonyms in correction
    const s = similarity(t, word);
    if (s > bestSim) {
      bestSim = s;
      bestWord = word;
    }
  });

  return bestSim >= FUZZY_THRESHOLD ? bestWord : term;
}

// ---------------------------------------------------------------------------
// Query expansion
// Returns all candidate search strings: corrected form + all synonyms
// ---------------------------------------------------------------------------

/**
 * Given a raw search query, return an ordered array of expanded terms.
 * Index 0 is always the (possibly corrected) canonical form of the input.
 * Subsequent entries are synonym alternatives.
 *
 * Example:
 *   "aurbegine pasta"  → ["aubergine pasta", "eggplant pasta"]
 *   "zucchini"         → ["zucchini", "courgette"]
 *   "eggplant curry"   → ["eggplant curry", "aubergine curry"]
 */
export function expandSearchQuery(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [query];

  // Collect words and correct each one individually
  const words = q.split(/\s+/);
  const corrected = words.map(w => correctFoodSpelling(w));
  const baseQuery = corrected.join(" ");

  const results = new Set<string>([baseQuery]);

  // Check if the whole query (or corrected query) matches a synonym group
  const wholeGroup = SYNONYM_LOOKUP.get(baseQuery);
  if (wholeGroup) {
    for (const alt of wholeGroup) {
      results.add(alt);
    }
  }

  // Check each word — if it has a synonym, produce a full-query variant
  for (let i = 0; i < corrected.length; i++) {
    const group = SYNONYM_LOOKUP.get(corrected[i]);
    if (!group) continue;
    for (const alt of group) {
      if (alt === corrected[i]) continue;
      const swapped = [...corrected];
      swapped[i] = alt;
      results.add(swapped.join(" "));
    }
  }

  return Array.from(results);
}

// ---------------------------------------------------------------------------
// Client-side meal scoring
// Returns a score 0-100. 0 means no match.
// ---------------------------------------------------------------------------

/**
 * Score a single text field (e.g. meal name or one ingredient) against one
 * search term. Returns 0 if no match.
 *
 * Scoring:
 *   100 — exact substring match
 *    80 — word-level exact match (the term equals a word in the text)
 *    55 — fuzzy match on any word in text (similarity ≥ FUZZY_THRESHOLD)
 */
function scoreTextField(text: string, term: string): number {
  const t = text.toLowerCase();
  const q = term.toLowerCase();
  if (!q || !t) return 0;

  // Exact substring
  if (t.includes(q)) return 100;

  // Word-level exact
  const words = t.split(/[\s,\-\/]+/);
  for (const w of words) {
    if (w === q) return 80;
  }

  // Fuzzy on words (only for terms ≥ 4 chars to avoid noise)
  if (q.length >= 4) {
    for (const w of words) {
      if (w.length < 3) continue;
      const s = similarity(w, q);
      if (s >= FUZZY_THRESHOLD) return Math.round(55 * s);
    }
  }

  return 0;
}

/**
 * Score a meal against a user search query.
 * Returns 0 (no match) or a positive score.
 * Name matches score higher than ingredient matches.
 *
 * Callers should:
 *   - Filter out meals with score === 0
 *   - Sort by score DESC when a search term is active
 */
export function scoreMealSearch(
  meal: { name: string; ingredients?: string[] | null },
  query: string
): number {
  if (!query.trim()) return 100; // no filter active

  const expandedQueries = expandSearchQuery(query);
  let best = 0;

  for (const eq of expandedQueries) {
    // Score the meal name (full expanded query as phrase)
    const nameScore = scoreTextField(meal.name, eq);
    if (nameScore > best) best = nameScore;

    // Also score individual words of the expanded query against the name
    const eqWords = eq.split(/\s+/);
    for (const w of eqWords) {
      const ws = scoreTextField(meal.name, w);
      if (ws > best) best = ws;
    }

    // Score ingredients (weighted at 70% of name score)
    if (meal.ingredients) {
      for (const ing of meal.ingredients) {
        const is = Math.round(scoreTextField(ing, eq) * 0.7);
        if (is > best) best = is;
        for (const w of eqWords) {
          const ws = Math.round(scoreTextField(ing, w) * 0.7);
          if (ws > best) best = ws;
        }
      }
    }

    if (best === 100) break; // can't do better
  }

  return best;
}
