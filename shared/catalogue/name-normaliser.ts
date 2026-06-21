// WS0.12 — Name Normaliser.
//
// USDA descriptions are inverted, comma-qualified, and carry program boilerplate:
//   "Oil, canola"                  → "Canola oil"
//   "Fish, haddock"                → "Haddock"
//   "Cheese, feta, low moisture"   → "Feta cheese"
//   "Oca (New Zealand yam), raw"   → "Oca"   (parenthetical harvested as an alias)
//   "Orange juice, raw, includes foods for USDA food distribution program"
//                                  → "Orange juice"
//
// The transform is deliberately CONSERVATIVE. It only drops comma-segments that
// are in a known NOISE set (preparation states, grades, fat levels, packaging).
// Any *unknown* trailing segment is KEPT as a distinguishing qualifier and the
// result is marked `review` — so "Oil, olive, extra virgin" and
// "Oil, olive, extra light" stay DISTINCT instead of silently collapsing to a
// colliding "Olive oil". Nothing meaningful is ever silently discarded:
// dropped noise is recorded, parentheticals become alias candidates.
//
// Output quality bands feed promotion readiness (Part D):
//   "auto"   — fully resolved by safe rules, no unknown qualifier retained
//   "review" — resolved but an unknown qualifier was kept (Claude/THA confirms phrasing)
//   "manual" — could not parse to a clean name; original retained, needs authoring

export type NameQuality = "auto" | "review" | "manual";

export interface NameNormalisation {
  normalisedName: string;       // human, title-cased THA display name
  quality: NameQuality;
  droppedQualifiers: string[];  // noise segments removed (never silently lost)
  keptQualifiers: string[];     // distinguishing segments retained (drive `review`)
  aliasCandidates: string[];    // parenthetical content + original description
  pattern: string;              // which rule fired (for reporting / auditing)
}

// ── Boilerplate the USDA appends that carries no food meaning ──────────────
const BOILERPLATE_PATTERNS: RegExp[] = [
  /,?\s*includes? foods? for usda('?s)? food distribution program\(?s?\)?/i,
  /,?\s*includes? foods? for usda('?s)? food distribution programs?/i,
  /,?\s*\(?usda commodity\)?/i,
  /,?\s*ndb no\.?\s*\d+/i,
  /,?\s*\bnfs\b/i,                 // "Not Further Specified"
];

// ── Comma-segments that are NOISE: preparation, grade, packaging, fat level ──
// If a trailing segment matches one of these, it is dropped safely.
// Anything NOT here is treated as DISTINGUISHING and retained (→ review).
const NOISE_SEGMENT_PATTERNS: RegExp[] = [
  /^raw$/i, /^fresh$/i, /^cooked\b.*/i, /^boiled\b.*/i, /^steamed\b.*/i,
  /^roasted\b.*/i, /^dry roasted\b.*/i, /^baked\b.*/i, /^dried\b.*/i,
  /^canned\b.*/i, /^tinned\b.*/i, /^frozen\b.*/i, /^bottled\b.*/i,
  /^unprepared$/i, /^prepared\b.*/i, /^uncooked$/i,
  /^with salt added$/i, /^without salt\b.*/i, /^with added\b.*/i,
  /^salt added$/i, /^no salt added$/i, /^unsalted$/i, /^salted$/i,
  /^low moisture\b.*/i, /^part-?skim$/i, /^whole milk$/i, /^nonfat$/i,
  /^non-?fat$/i, /^low ?fat$/i, /^lowfat\b.*/i, /^reduced fat\b.*/i,
  /^fat free$/i, /^skim$/i, /^\d+(\.\d+)?% ?milkfat$/i, /^\d+% ?fat$/i,
  /^plain$/i, /^unsweetened$/i, /^unenriched$/i, /^enriched$/i,
  /^unbleached$/i, /^bleached$/i, /^refrigerated$/i, /^shelf ?stable$/i,
  /^from concentrate$/i, /^crumbled$/i, /^grated$/i, /^shredded$/i,
  /^sliced$/i, /^chopped$/i, /^diced$/i, /^halves$/i, /^whole$/i,
  /^kernels?$/i, /^pieces$/i, /^ground$/i, /^granulated$/i,
  /^grade [a-z]$/i, /^large$/i, /^medium$/i, /^small$/i, /^extra large$/i,
  /^all varieties$/i, /^all types$/i, /^mature seeds?\b.*/i, /^seeds?$/i,
  /^drained solids?$/i, /^solids? and liquids?$/i, /^in water$/i,
  /^with skin\b.*/i, /^without skin\b.*/i, /^peeled$/i, /^unpeeled$/i,
  /^flesh and skin$/i, /^flesh$/i, /^skin$/i, /^fluid$/i, /^old fashioned$/i,
];

// ── Class words handled as a SUFFIX: "<class>, <specifier>" → "<specifier> <class>" ──
// e.g. "Oil, canola" → "Canola oil"; "Cheese, feta" → "Feta cheese".
const SUFFIX_CLASSES = new Set([
  "oil", "cheese", "juice", "yogurt", "yoghurt", "vinegar", "flour",
  "butter", "milk", "cream", "nectar",
]);

// ── Class words that are a GENERIC GROUPING: drop the class, keep the specifier ──
// e.g. "Fish, haddock" → "Haddock"; "Nuts, almonds" → "Almonds".
const DROP_CLASSES = new Set([
  "fish", "nuts", "nut", "seeds", "seed", "beans", "bean", "peas", "pea",
  "berries", "greens", "squash", "melons",
]);

function isNoise(segment: string): boolean {
  return NOISE_SEGMENT_PATTERNS.some((p) => p.test(segment.trim()));
}

function titleCase(name: string): string {
  // Title-case but keep small connector words lowercase mid-phrase, and keep
  // existing all-caps acronyms / hyphenated forms readable.
  const small = new Set(["and", "or", "with", "of", "in", "the", "a"]);
  return name
    .split(/\s+/)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && small.has(lower)) return lower;
      if (/-/.test(w)) {
        return w.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("-");
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}

function extractParentheticals(text: string): { stripped: string; contents: string[] } {
  const contents: string[] = [];
  const stripped = text.replace(/\(([^)]*)\)/g, (_, inner) => {
    const trimmed = String(inner).trim();
    if (trimmed) contents.push(trimmed);
    return " ";
  });
  return { stripped: stripped.replace(/\s+/g, " ").trim(), contents };
}

/**
 * Normalise a USDA description into a clean THA display name.
 *
 * Parenthetical rule (chosen): STRIP the parenthetical from the display name
 * ("Oca (New Zealand yam)" → "Oca") and HARVEST its contents as an alias
 * candidate. Rationale: the display name stays beautiful and unambiguous, while
 * the regional/common name is preserved as a searchable alias rather than
 * discarded — directly answering the trust risk "remove legitimate regional
 * foods". One rule, no information loss.
 */
export function normaliseName(usdaDescription: string): NameNormalisation {
  const aliasCandidates: string[] = [];
  const original = usdaDescription.trim();
  aliasCandidates.push(original);

  // 1. Strip program boilerplate.
  let working = original;
  for (const p of BOILERPLATE_PATTERNS) working = working.replace(p, "");
  working = working.replace(/[,;]\s*$/, "").trim();

  // 2. Harvest + strip parentheticals.
  const { stripped, contents } = extractParentheticals(working);
  working = stripped;
  for (const c of contents) if (!aliasCandidates.includes(c)) aliasCandidates.push(c);

  // 3. Split into comma-segments and classify.
  const segments = working.split(",").map((s) => s.trim()).filter(Boolean);

  if (segments.length === 0) {
    return {
      normalisedName: titleCase(original),
      quality: "manual",
      droppedQualifiers: [],
      keptQualifiers: [],
      aliasCandidates,
      pattern: "empty-after-strip",
    };
  }

  const head = segments[0];
  const headLower = head.toLowerCase();
  const tail = segments.slice(1);

  const dropped: string[] = [];
  const meaningful: string[] = [];
  for (const seg of tail) {
    if (isNoise(seg)) dropped.push(seg);
    else meaningful.push(seg);
  }

  // The first meaningful segment is the SPECIFIER consumed into the name; any
  // further meaningful segments are EXTRA distinguishing qualifiers that we
  // retain (never collapse) but that force a `review` band.
  const specifier = meaningful[0];
  const extras = meaningful.slice(1);

  let normalisedName: string;
  let pattern: string;

  // 4a. SUFFIX class reorder: "Oil, canola" → "Canola oil";
  //     "Oil, olive, extra virgin" → "Extra virgin olive oil".
  if (SUFFIX_CLASSES.has(headLower) && specifier) {
    normalisedName = [...extras, specifier, headLower].join(" ");
    pattern = "suffix-class-reorder";
  } else if (SUFFIX_CLASSES.has(headLower)) {
    normalisedName = headLower; // only noise tail → bare class ("Milk")
    pattern = "suffix-class-bare";
  // 4b. DROP class: "Fish, haddock" → "Haddock".
  } else if (DROP_CLASSES.has(headLower) && specifier) {
    normalisedName = [specifier, ...extras].join(" ");
    pattern = "drop-class";
  } else if (DROP_CLASSES.has(headLower)) {
    normalisedName = headLower; // nothing specific survived — keep the group word
    pattern = "drop-class-bare";
  // 4c. Generic: head is the food; meaningful qualifiers prefix it.
  } else if (meaningful.length >= 1) {
    // "Peppers, bell, green" → head=peppers, meaningful=[bell, green]
    normalisedName = `${meaningful.join(" ")} ${head}`;
    pattern = "qualifier-prefix";
  } else {
    normalisedName = head;
    pattern = "head-only";
  }

  normalisedName = titleCase(normalisedName.replace(/\s+/g, " ").trim());

  // 5. Quality band.
  //   manual  — empty / nonsensical result
  //   review  — extra distinguishing qualifiers retained, OR a slash/percent/"or"
  //             survived (kept distinct, but a human confirms the phrasing)
  //   auto    — clean reorder, only the specifier kept, only noise dropped
  const extraRetained = extras.length > 0 || pattern === "qualifier-prefix" && meaningful.length > 1;
  let quality: NameQuality;
  if (!normalisedName || normalisedName.length < 2) {
    quality = "manual";
  } else if (extraRetained || /[%/]/.test(normalisedName) || /\bor\b/i.test(normalisedName)) {
    quality = "review";
  } else {
    quality = "auto";
  }

  return { normalisedName, quality, droppedQualifiers: dropped, keptQualifiers: meaningful, aliasCandidates, pattern };
}
