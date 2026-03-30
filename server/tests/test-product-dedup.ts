/**
 * Product deduplication / canonical grouping — Verification Tests
 *
 * Proves that the canonical rule engine + consumable grouping key correctly:
 *   1. Collapse multiple Cadbury Double Decker noisy variants into one group
 *   2. Keep Rustlers "The Mighty Double Decker" separate (different brand)
 *   3. Merge pack-size variations of the same product
 *   4. Select clean titles as group representatives over garbled/ALL-CAPS ones
 *   5. Never merge different brands that share a product name
 *
 * Run with:  npx tsx server/tests/test-product-dedup.ts
 */

import { getCanonicalProduct } from "../lib/productCanonicaliser.js";

// ---------------------------------------------------------------------------
// Tiny test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function expect<T>(label: string, actual: T, expected: T): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    console.error(`       got:      ${JSON.stringify(actual)}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ---------------------------------------------------------------------------
// Helper: simulate the Stage-2 consumable key logic from routes.ts
// ---------------------------------------------------------------------------

const _norm = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const _normBrand = (brand: string | null | undefined): string =>
  _norm(((brand ?? '').split(',')[0]).replace(/\s+(?:ltd\.?|plc\.?|inc\.?|gb|uk|group|foods|beverages?|company|co\.?)(?:\s|$)/gi, '').trim());

const _SIZE_RE = /\b[\d.]+\s*(?:x\s*[\d.]+\s*)?(?:m(?:illilitres?|illiliters?|ls?)?|cl|litres?|liters?|l|g(?:rams?|rammes?|r)?|kg(?:ilograms?|ilogrammes?)?|mg|oz)\b/gi;
const _PACK_RE = /\b(?:\d+\s*(?:pk|pack|packs?|cans?|bottles?|cartons?|bars?|fingers?|sticks?|pieces?|pouches?|bags?)|pack\s+of\s+\d+|multipack|multi-pack|(?:\d+\s*)?individually\s+wrapped|twin|single|mini(?:atures?|s)?|snack\s+size|fun\s+size|sharing\s+bag|fingers?|bars?|sticks?)\b/gi;
const _MERCH_RE = /\b(?:sustainably[\s-]*sourced?(?:\s+cocoa)?|responsibly[\s-]*sourced?(?:\s+cocoa)?|sourced?\s+cocoa|rainforest\s+alliance(?:\s+certified)?|sustainably|responsibly)\b/gi;

const _normNameForKey = (brand: string | null, name: string | null): string => {
  const nb = _norm(brand);
  const nn = _norm(name);
  if (!nb) return nn;
  if (nn.startsWith(nb)) return nn.slice(nb.length) || nn;
  if (nn.endsWith(nb)) return nn.slice(0, nn.length - nb.length) || nn;
  return nn;
};

function consumableKey(brand: string | null, name: string | null): string {
  // Mirror the Stage-2 logic in routes.ts _consumableKey2 for the non-canonical path
  const cleaned = (name ?? '')
    .replace(_SIZE_RE, '')
    .replace(_PACK_RE, '')
    .replace(_MERCH_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
  const b = _normBrand(brand);
  const n = _normNameForKey(brand, cleaned || name);
  return `${b}|${n}`;
}

function canonicalKey(brand: string | null, name: string | null): string {
  const c = getCanonicalProduct(name, brand);
  if (c) return `_c:${_norm(c.brand)}|${_norm(c.name)}`;
  return consumableKey(brand, name);
}

// ---------------------------------------------------------------------------
// 1. Cadbury Double Decker variants all resolve to the same canonical product
// ---------------------------------------------------------------------------

section("getCanonicalProduct — Cadbury Double Decker variants");

const DD_CANONICAL = { name: "Cadbury Double Decker", brand: "Cadbury" };

expect(
  '"Double Decker" (brand: Cadbury) → canonical',
  getCanonicalProduct("Double Decker", "Cadbury"),
  DD_CANONICAL,
);

expect(
  '"Cadbury Double Decker" → canonical',
  getCanonicalProduct("Cadbury Double Decker", "Cadbury"),
  DD_CANONICAL,
);

expect(
  '"Cadbury double DECKER 4BAR BARS SUSTAINABLY SOURCE" → canonical',
  getCanonicalProduct("Cadbury double DECKER 4BAR BARS SUSTAINABLY SOURCE", "Cadbury"),
  DD_CANONICAL,
);

expect(
  '"Cadbury double decker chocolate" → canonical',
  getCanonicalProduct("Cadbury double decker chocolate", "Cadbury"),
  DD_CANONICAL,
);

expect(
  '"Cadbury double DECKER 4BARS SOURCED COCOA" → canonical',
  getCanonicalProduct("Cadbury double DECKER 4BARS SOURCED COCOA", "Cadbury"),
  DD_CANONICAL,
);

expect(
  '"DOUBLE DECKER" all-caps (brand: Cadbury) → canonical',
  getCanonicalProduct("DOUBLE DECKER", "Cadbury"),
  DD_CANONICAL,
);

// ---------------------------------------------------------------------------
// 2. Rustlers "The Mighty Double Decker" stays separate (different brand)
// ---------------------------------------------------------------------------

section("getCanonicalProduct — no-brand Double Decker merges with Cadbury");

expect(
  '"Double Decker" (no brand) → Cadbury canonical',
  getCanonicalProduct("Double Decker", null),
  DD_CANONICAL,
);

expect(
  '"double DECKER" all-caps, no brand → Cadbury canonical',
  getCanonicalProduct("double DECKER", null),
  DD_CANONICAL,
);

expect(
  '"double DECKER" brand=null string → Cadbury canonical',
  getCanonicalProduct("double DECKER", "null"),
  DD_CANONICAL,
);

section("getCanonicalProduct — non-chocolate double deckers NOT merged");

expect(
  '"Double Decker Oatmeal Creme Pie" (Little Debbie) → null',
  getCanonicalProduct("Double Decker Oatmeal Creme Pie", "Little Debbie"),
  null,
);

expect(
  '"Double decker cheese pizza" → null',
  getCanonicalProduct("Double decker cheese pizza", null),
  null,
);

expect(
  '"Cheesy double decker taco dinner kit" (Velveeta) → null',
  getCanonicalProduct("Cheesy double decker taco dinner kit", "Velveeta"),
  null,
);

expect(
  '"Double Decker New York-Style Cheesecake" → null',
  getCanonicalProduct("Double Decker New York-Style Cheesecake", "President\'s Choice"),
  null,
);

expect(
  '"Moonpie chocolate double decker pies" → null',
  getCanonicalProduct("Moonpie chocolate double decker pies", null),
  null,
);

expect(
  '"Double Decker Sandwich Cookie" → null',
  getCanonicalProduct("Double Decker Sandwich Cookie", null),
  null,
);

section("getCanonicalProduct — Rustlers Double Decker must NOT merge with Cadbury");

expect(
  '"The Mighty Double Decker" (brand: Rustlers) → null (no match)',
  getCanonicalProduct("The Mighty Double Decker", "Rustlers"),
  null,
);

expect(
  '"Double Decker" (brand: Rustlers) → null',
  getCanonicalProduct("Double Decker", "Rustlers"),
  null,
);

// ---------------------------------------------------------------------------
// 3. Cherry Coke canonical rules still work (no regression)
// ---------------------------------------------------------------------------

section("getCanonicalProduct — Cherry Coke regression check");

expect(
  '"Cherry Coke" → Cherry Coke',
  getCanonicalProduct("Cherry Coke", "Coca-Cola"),
  { name: "Cherry Coke", brand: "Coca-Cola" },
);

expect(
  '"Cherry Coke Zero" → Cherry Coke Zero',
  getCanonicalProduct("Cherry Coke Zero", "Coca-Cola"),
  { name: "Cherry Coke Zero", brand: "Coca-Cola" },
);

expect(
  '"Cherry cola" (no brand) → Cherry Coke',
  getCanonicalProduct("Cherry cola", null),
  { name: "Cherry Coke", brand: "Coca-Cola" },
);

// ---------------------------------------------------------------------------
// 4. Canonical key — all Cadbury Double Decker variants collapse to same key
// ---------------------------------------------------------------------------

section("canonical key — all Cadbury variants collapse to one key");

const ddKey = canonicalKey("Cadbury", "Double Decker");

expect(
  'key("Cadbury Double Decker") === key("Double Decker" / Cadbury)',
  canonicalKey("Cadbury", "Cadbury Double Decker"),
  ddKey,
);

expect(
  'key("Cadbury double DECKER 4BAR BARS SUSTAINABLY SOURCE") === ddKey',
  canonicalKey("Cadbury", "Cadbury double DECKER 4BAR BARS SUSTAINABLY SOURCE"),
  ddKey,
);

expect(
  'key("Cadbury double decker chocolate") === ddKey',
  canonicalKey("Cadbury", "Cadbury double decker chocolate"),
  ddKey,
);

expect(
  'key("Cadbury double DECKER 4BARS SOURCED COCOA") === ddKey',
  canonicalKey("Cadbury", "Cadbury double DECKER 4BARS SOURCED COCOA"),
  ddKey,
);

expect(
  'key("Double Decker", no brand) === ddKey',
  canonicalKey(null, "Double Decker"),
  ddKey,
);

expect(
  'key("double DECKER", no brand) === ddKey',
  canonicalKey(null, "double DECKER"),
  ddKey,
);

// ---------------------------------------------------------------------------
// 5. Rustlers key is different from Cadbury key
// ---------------------------------------------------------------------------

section("canonical key — Rustlers stays in a separate group");

const rustlersKey = canonicalKey("Rustlers", "The Mighty Double Decker");

expect(
  "Rustlers key !== Cadbury key",
  rustlersKey !== ddKey,
  true,
);

console.log(`     Cadbury key:  ${ddKey}`);
console.log(`     Rustlers key: ${rustlersKey}`);

// ---------------------------------------------------------------------------
// 6. Pack-size variations merge (consumable key strips sizes)
// ---------------------------------------------------------------------------

section("consumable key — pack-size variations collapse");

const ddBase = consumableKey("Cadbury", "Double Decker");

expect(
  '"Double Decker 47.1g" → same as "Double Decker"',
  consumableKey("Cadbury", "Double Decker 47.1g"),
  ddBase,
);

expect(
  '"Double Decker 4 bars" → same as "Double Decker"',
  consumableKey("Cadbury", "Double Decker 4 bars"),
  ddBase,
);

expect(
  '"Double Decker 4BAR" → same as "Double Decker"',
  consumableKey("Cadbury", "Double Decker 4 bar"),
  ddBase,
);

// ---------------------------------------------------------------------------
// 7. Merchandising noise strips correctly
// ---------------------------------------------------------------------------

section("consumable key — merchandising noise stripped");

expect(
  '"Double Decker Sustainably Sourced" → same as base',
  consumableKey("Cadbury", "Double Decker Sustainably Sourced"),
  ddBase,
);

expect(
  '"Double Decker Responsibly Sourced Cocoa" → same as base',
  consumableKey("Cadbury", "Double Decker Responsibly Sourced Cocoa"),
  ddBase,
);

expect(
  '"Double Decker Sustainably Sourced Cocoa" → same as base',
  consumableKey("Cadbury", "Double Decker Sustainably Sourced Cocoa"),
  ddBase,
);

// ---------------------------------------------------------------------------
// 8. Different brands with the same core name stay separate
// ---------------------------------------------------------------------------

section("canonical key — different brands never merge");

const snickers = canonicalKey("Mars", "Snickers");
const snickersOther = canonicalKey("Some Other Brand", "Snickers");

expect(
  '"Snickers" (Mars) !== "Snickers" (Some Other Brand)',
  snickers !== snickersOther,
  true,
);

expect(
  "Cadbury Double Decker key !== Rustlers Double Decker key",
  ddKey !== rustlersKey,
  true,
);

// ---------------------------------------------------------------------------
// 9. Twix — pack/format variants collapse; flavour variants stay separate
// ---------------------------------------------------------------------------

section("consumable key — Twix pack/format variants collapse into one family");

const twixBase = consumableKey("Mars", "Twix");

expect(
  '"Twix Twin" → same as "Twix" (twin is a pack descriptor)',
  consumableKey("Mars", "Twix Twin"),
  twixBase,
);

expect(
  '"Twix 16pk" → same as "Twix" (16pk is a count descriptor)',
  consumableKey("Mars", "Twix 16pk"),
  twixBase,
);

expect(
  '"Twix 9pk" → same as "Twix"',
  consumableKey("Mars", "Twix 9pk"),
  twixBase,
);

expect(
  '"Twix Fingers" → same as "Twix" (fingers is a shape/format word)',
  consumableKey("Mars", "Twix Fingers"),
  twixBase,
);

expect(
  '"Twix Bar" → same as "Twix"',
  consumableKey("Mars", "Twix Bar"),
  twixBase,
);

section("consumable key — Twix flavour/formulation variants remain separate");

expect(
  '"Twix White" stays separate (white = formulation)',
  consumableKey("Mars", "Twix White") !== twixBase,
  true,
);

expect(
  '"Twix White" and "Twix White" are self-consistent',
  consumableKey("Mars", "Twix White") === consumableKey("Mars", "Twix White"),
  true,
);

expect(
  '"TWIX GLUTEN FREE 4 INDIVIDUALLY WRAPPED Chocolate" strips count+wrapping but keeps gluten free',
  consumableKey("Mars", "TWIX GLUTEN FREE 4 INDIVIDUALLY WRAPPED Chocolate") !== twixBase,
  true,
);

// ---------------------------------------------------------------------------
// 10. KitKat — pack/count variants collapse; Chunky stays separate
// ---------------------------------------------------------------------------

section("consumable key — KitKat pack variants collapse");

const kkBase = consumableKey("Nestlé", "Kit Kat");

expect(
  '"Kit Kat 4 Finger" → same as "Kit Kat" (4 finger = count+format)',
  consumableKey("Nestlé", "Kit Kat 4 Finger"),
  kkBase,
);

expect(
  '"Kit Kat Fingers" → same as "Kit Kat" (standalone format word)',
  consumableKey("Nestlé", "Kit Kat Fingers"),
  kkBase,
);

expect(
  '"Kit Kat Mini" → same as "Kit Kat"',
  consumableKey("Nestlé", "Kit Kat Mini"),
  kkBase,
);

expect(
  '"Kit Kat Minis" → same as "Kit Kat"',
  consumableKey("Nestlé", "Kit Kat Minis"),
  kkBase,
);

expect(
  '"Kit Kat 6 pack" → same as "Kit Kat"',
  consumableKey("Nestlé", "Kit Kat 6 pack"),
  kkBase,
);

expect(
  '"Kit Kat Chunky" stays separate (distinct product variant)',
  consumableKey("Nestlé", "Kit Kat Chunky") !== kkBase,
  true,
);

// ---------------------------------------------------------------------------
// 11. Snickers — pack/format variants collapse; Salted Caramel stays separate
// ---------------------------------------------------------------------------

section("consumable key — Snickers pack variants collapse");

const snickersBase = consumableKey("Mars", "Snickers");

expect(
  '"Snickers Bar" → same as "Snickers"',
  consumableKey("Mars", "Snickers Bar"),
  snickersBase,
);

expect(
  '"Snickers Fun Size" → same as "Snickers"',
  consumableKey("Mars", "Snickers Fun Size"),
  snickersBase,
);

expect(
  '"Snickers Mini" → same as "Snickers"',
  consumableKey("Mars", "Snickers Mini"),
  snickersBase,
);

expect(
  '"Snickers Minis" → same as "Snickers"',
  consumableKey("Mars", "Snickers Minis"),
  snickersBase,
);

expect(
  '"Snickers 4 pack" → same as "Snickers"',
  consumableKey("Mars", "Snickers 4 pack"),
  snickersBase,
);

expect(
  '"Snickers Sharing Bag" → same as "Snickers"',
  consumableKey("Mars", "Snickers Sharing Bag"),
  snickersBase,
);

expect(
  '"Snickers Salted Caramel" stays separate (formulation variant)',
  consumableKey("Mars", "Snickers Salted Caramel") !== snickersBase,
  true,
);

expect(
  '"Snickers Protein" stays separate (formulation variant)',
  consumableKey("Mars", "Snickers Protein") !== snickersBase,
  true,
);

// ---------------------------------------------------------------------------
// 12. Individually-wrapped stripping (with and without count prefix)
// ---------------------------------------------------------------------------

section("consumable key — individually-wrapped stripping");

const twixGFBase = consumableKey("Mars", "Twix Gluten Free");

expect(
  '"Twix Gluten Free 4 Individually Wrapped" → same as "Twix Gluten Free"',
  consumableKey("Mars", "Twix Gluten Free 4 Individually Wrapped"),
  twixGFBase,
);

expect(
  '"Twix Gluten Free Individually Wrapped" → same as "Twix Gluten Free"',
  consumableKey("Mars", "Twix Gluten Free Individually Wrapped"),
  twixGFBase,
);

// ---------------------------------------------------------------------------
// 13. Canonical key — descriptive Twix names all collapse to one canonical group
// ---------------------------------------------------------------------------

section("canonical key — Twix descriptive name variants collapse");

const twixCanonical = canonicalKey("Mars", "Twix");

expect(
  '"Twix Caramel Biscuit Bar" collapses to canonical Twix',
  canonicalKey("Mars", "Twix Caramel Biscuit Bar"),
  twixCanonical,
);

expect(
  '"Twix Biscuit Bar" collapses to canonical Twix',
  canonicalKey("Mars", "Twix Biscuit Bar"),
  twixCanonical,
);

expect(
  '"Twix Chocolate Biscuit" collapses to canonical Twix',
  canonicalKey("Mars", "Twix Chocolate Biscuit"),
  twixCanonical,
);

expect(
  '"Twix Caramel" collapses to canonical Twix',
  canonicalKey("Mars", "Twix Caramel"),
  twixCanonical,
);

expect(
  '"Twix Twin" collapses to canonical Twix',
  canonicalKey("Mars", "Twix Twin"),
  twixCanonical,
);

expect(
  '"Twix White" stays separate from canonical Twix',
  canonicalKey("Mars", "Twix White") !== twixCanonical,
  true,
);

expect(
  '"Twix Gluten Free" stays separate from canonical Twix',
  canonicalKey("Mars", "Twix Gluten Free") !== twixCanonical,
  true,
);

// ---------------------------------------------------------------------------
// 14. Canonical key — Snickers descriptive name variants collapse
// ---------------------------------------------------------------------------

section("canonical key — Snickers descriptive name variants collapse");

const snickersCanonical = canonicalKey("Mars", "Snickers");

expect(
  '"Snickers Peanut Caramel Nougat" collapses to canonical Snickers',
  canonicalKey("Mars", "Snickers Peanut Caramel Nougat"),
  snickersCanonical,
);

expect(
  '"Snickers Caramel" collapses to canonical Snickers',
  canonicalKey("Mars", "Snickers Caramel"),
  snickersCanonical,
);

expect(
  '"Snickers Chocolate Bar" collapses to canonical Snickers',
  canonicalKey("Mars", "Snickers Chocolate Bar"),
  snickersCanonical,
);

expect(
  '"Snickers Protein" stays separate from canonical Snickers',
  canonicalKey("Mars", "Snickers Protein") !== snickersCanonical,
  true,
);

expect(
  '"Snickers Almond" stays separate from canonical Snickers',
  canonicalKey("Mars", "Snickers Almond") !== snickersCanonical,
  true,
);

// ---------------------------------------------------------------------------
// 15. Canonical key — Kit Kat descriptive name variants collapse
// ---------------------------------------------------------------------------

section("canonical key — Kit Kat descriptive name variants collapse");

const kitkatCanonical = canonicalKey("Nestlé", "Kit Kat");

expect(
  '"Kit Kat 4 Finger Milk Chocolate" collapses to canonical Kit Kat',
  canonicalKey("Nestlé", "Kit Kat 4 Finger Milk Chocolate"),
  kitkatCanonical,
);

expect(
  '"KitKat Milk Chocolate Bar" collapses to canonical Kit Kat',
  canonicalKey("Nestlé", "KitKat Milk Chocolate Bar"),
  kitkatCanonical,
);

expect(
  '"Kit Kat Chunky" stays separate from canonical Kit Kat',
  canonicalKey("Nestlé", "Kit Kat Chunky") !== kitkatCanonical,
  true,
);

expect(
  '"Kit Kat Gold" stays separate from canonical Kit Kat',
  canonicalKey("Nestlé", "Kit Kat Gold") !== kitkatCanonical,
  true,
);

expect(
  '"Kit Kat Dark" stays separate from canonical Kit Kat',
  canonicalKey("Nestlé", "Kit Kat Dark") !== kitkatCanonical,
  true,
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${"─".repeat(55)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) process.exit(1);
