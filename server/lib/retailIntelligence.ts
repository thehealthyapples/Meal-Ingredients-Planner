/**
 * Retail Intelligence Layer v1
 *
 * Improves store availability data for products from OpenFoodFacts (OFF).
 * OFF store tags are user-contributed and frequently incomplete.  This layer
 * supplements confirmed OFF data with brand and category inference so that
 * products are not hidden from retailer flows just because OFF only recorded
 * one store.
 *
 * Confidence levels:
 *   OFF store tags  → 0.95  (verified, direct from source)
 *   Brand inference → 0.60  (brand known to have wide UK distribution)
 *   Category        → 0.30  (product type typically sold in these chains)
 *
 * All three tiers run independently and are merged with these rules:
 *   • OFF-confirmed stores always keep 0.95 — never downgraded
 *   • Brand-inferred stores are added at 0.60 only if not already confirmed
 *   • Category-inferred stores are added at 0.30 only if not already covered
 *   • No store appears twice — highest confidence wins
 *
 * No external APIs are called.  All inference is static knowledge encoded below.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type KnownStore =
  | 'Tesco'
  | "Sainsbury's"
  | 'Asda'
  | 'Morrisons'
  | 'Aldi'
  | 'Lidl'
  | 'Waitrose'
  | 'Ocado'
  | 'Co-op'
  | 'M&S'
  | 'Iceland';

/** Which evidence tiers contributed to the final store list. */
export type InferenceSource =
  | 'off-data'
  | 'brand'
  | 'category'
  | 'off-data+brand'
  | 'off-data+category'
  | 'off-data+brand+category'
  | 'none';

export interface RetailEnrichment {
  /** All stores in scope — confirmed first, then inferred.  Use storeConfidence to filter. */
  availableStores: KnownStore[];
  /** Per-store confidence: 0.95 = OFF confirmed; 0.60 = brand inferred; 0.30 = category inferred. */
  storeConfidence: Record<string, number>;
  /** Which tiers produced data for this result. */
  inferenceSource: InferenceSource;
  /** Stores verified directly from OFF store tags (confidence 0.95). */
  confirmedStores: KnownStore[];
  /** Stores added by brand or category inference that were not in confirmedStores. */
  inferredStores: KnownStore[];
}

export interface RawStoreInput {
  /** Combined raw strings from stores_tags + purchase_places_tags + stores (split by comma). */
  storeTags: string[];
  brand: string | null | undefined;
  categoryTags: string[];
  /** Barcode used as primary cache key when present. */
  barcode?: string | null;
}

// ── Store tier constants ────────────────────────────────────────────────────────
// These are the building blocks for the brand map below.
// Use the narrowest tier that honestly reflects a brand's real UK distribution.

/** Big 4 only — Tesco, Sainsbury's, Asda, Morrisons. */
const MAINSTREAM: KnownStore[] = ['Tesco', "Sainsbury's", 'Asda', 'Morrisons'];

/** Big 4 + Co-op.  Suitable for mainstream brands with convenience-store reach. */
const MAINSTREAM_PLUS_COOP: KnownStore[] = [...MAINSTREAM, 'Co-op'];

/** All major UK chains including discounters, Waitrose, Ocado, Iceland. */
const ALL_MAJOR: KnownStore[] = [...MAINSTREAM, 'Aldi', 'Lidl', 'Waitrose', 'Ocado', 'Co-op', 'Iceland'];

/** Big 4 + Waitrose + Ocado — brand skips discounters but is otherwise wide. */
const PREMIUM_CHAINS: KnownStore[] = [...MAINSTREAM, 'Waitrose', 'Ocado'];

/** Tesco + Sainsbury's + Waitrose + Ocado — premium-leaning, skips Asda/Morrisons/discounters. */
const BROAD_PREMIUM: KnownStore[] = ['Tesco', "Sainsbury's", 'Waitrose', 'Ocado'];

/** Sainsbury's + Waitrose + Ocado — selective/specialist brands with upmarket bias. */
const SELECTIVE: KnownStore[] = ["Sainsbury's", 'Waitrose', 'Ocado'];

/** Big 4 + Iceland — frozen/chilled food brands with strong Iceland presence. */
const MAINSTREAM_ICELAND: KnownStore[] = [...MAINSTREAM, 'Iceland'];

// ── OFF store tag → canonical name ────────────────────────────────────────────
// Centralised here so both search-products and barcode endpoints use the same map.
// Export so routes.ts debug logging can reference it without re-declaring inline.

export const STORE_TAG_MAP: Record<string, KnownStore> = {
  // Tesco
  'tesco': 'Tesco',
  'en:tesco': 'Tesco',
  'tesco stores': 'Tesco',
  'en:tesco-stores': 'Tesco',
  'tesco.com': 'Tesco',
  'en:tesco.com': 'Tesco',
  'tesco extra': 'Tesco',
  'tesco express': 'Tesco',
  'tesco metro': 'Tesco',
  // Sainsbury's
  "sainsbury's": "Sainsbury's",
  "en:sainsbury-s": "Sainsbury's",
  'sainsburys': "Sainsbury's",
  "en:sainsburys": "Sainsbury's",
  "sainsbury's local": "Sainsbury's",
  // Asda
  'asda': 'Asda',
  'en:asda': 'Asda',
  // Morrisons
  'morrisons': 'Morrisons',
  'en:morrisons': 'Morrisons',
  // Aldi
  'aldi': 'Aldi',
  'en:aldi': 'Aldi',
  // Lidl
  'lidl': 'Lidl',
  'en:lidl': 'Lidl',
  // Waitrose
  'waitrose': 'Waitrose',
  'en:waitrose': 'Waitrose',
  'waitrose & partners': 'Waitrose',
  'en:waitrose-partners': 'Waitrose',
  // Ocado
  'ocado': 'Ocado',
  'en:ocado': 'Ocado',
  // Co-op
  'co-op': 'Co-op',
  'coop': 'Co-op',
  'en:co-op': 'Co-op',
  'co-operative': 'Co-op',
  'the co-operative': 'Co-op',
  // M&S
  'm&s': 'M&S',
  'marks & spencer': 'M&S',
  'marks and spencer': 'M&S',
  'en:marks-spencer': 'M&S',
  // Iceland
  'iceland': 'Iceland',
  'en:iceland': 'Iceland',
};

/**
 * Canonical set of OFF store tags that identify a UK retailer.
 * Used by the English-language product filter in routes.ts to rescue
 * records that carry UK retailer data but lack English language metadata.
 */
export const UK_RETAILER_STORE_TAGS = new Set<string>([
  'en:tesco', 'en:sainsbury-s', 'en:asda', 'en:morrisons', 'en:waitrose',
  'en:aldi', 'en:lidl', 'en:ocado', 'en:co-op', 'en:iceland',
]);

// ── Brand → inferred stores ────────────────────────────────────────────────────
//
// Keys are the brand string after _normBrand() — lowercase, a-z0-9 only,
// accented characters mapped to ASCII equivalents before stripping.
//
// Matching strategy (applied in order per segment):
//   1. Exact key match
//   2. Normalised brand string starts with key   (handles "Coca-Cola GB Ltd" → cocacola*)
//   3. Normalised brand string contains key       (handles "Ben & Jerry's,Unilever" → *benjerry*)
//
// Tier selection guide:
//   ALL_MAJOR          → truly ubiquitous brands found in every major chain inc. discounters
//   MAINSTREAM_PLUS_COOP → mainstream + Co-op, skips premium/discounters
//   MAINSTREAM         → Big 4 only, no Co-op, no premium
//   PREMIUM_CHAINS     → Big 4 + Waitrose + Ocado, skips discounters
//   BROAD_PREMIUM      → Tesco + Sainsbury's + Waitrose + Ocado, upmarket mainstream
//   SELECTIVE          → Sainsbury's + Waitrose + Ocado, specialist/premium
//   MAINSTREAM_ICELAND → Big 4 + Iceland, for frozen-food-focused brands
//
// Do NOT add: own-brand labels (Tesco, Sainsbury's etc.), Aldi/Lidl own-brand,
// clearly niche or ambiguous brands, or anything where confidence is questionable.

const BRAND_STORE_MAP: Record<string, KnownStore[]> = {

  // ── Soft drinks & carbonates ─────────────────────────────────────────────────
  // Ubiquitous colas/sodas found in every major UK chain including discounters

  cocacola:         ALL_MAJOR,   // Coca-Cola, Coke, Diet Coke, Coke Zero
  coke:             ALL_MAJOR,   // alias used in some OFF entries
  pepsi:            ALL_MAJOR,
  pepsico:          ALL_MAJOR,   // PepsiCo parent string on some OFF entries
  drpepper:         ALL_MAJOR,   // Dr Pepper / Dr. Pepper
  fanta:            ALL_MAJOR,
  sprite:           ALL_MAJOR,
  schweppes:        ALL_MAJOR,
  lucozade:         ALL_MAJOR,
  ribena:           ALL_MAJOR,
  robinsons:        ALL_MAJOR,
  redbull:          ALL_MAJOR,   // Red Bull
  monster:          ALL_MAJOR,   // Monster Energy
  rockstar:         ALL_MAJOR,   // Rockstar Energy
  oasis:            MAINSTREAM_PLUS_COOP,
  j2o:              MAINSTREAM_PLUS_COOP,
  vimto:            ALL_MAJOR,
  snapple:          BROAD_PREMIUM,
  caprisun:         MAINSTREAM_PLUS_COOP, // Capri-Sun
  sunnyd:           MAINSTREAM,           // SunnyD
  lilt:             ALL_MAJOR,            // discontinued 2023 but still in OFF

  // ── Water & premium mixers ───────────────────────────────────────────────────

  fevertree:        BROAD_PREMIUM,   // Fever-Tree premium mixers
  sanpellegrino:    BROAD_PREMIUM,   // San Pellegrino
  perrier:          BROAD_PREMIUM,
  evian:            PREMIUM_CHAINS,
  volvic:           PREMIUM_CHAINS,
  highlandspring:   PREMIUM_CHAINS,  // Highland Spring
  harrogate:        BROAD_PREMIUM,   // Harrogate Spring Water
  belu:             BROAD_PREMIUM,
  hildon:           SELECTIVE,       // Hildon — premium still/sparkling

  // ── Juices, smoothies & soft fruit drinks ───────────────────────────────────

  innocent:         PREMIUM_CHAINS,
  tropicana:        PREMIUM_CHAINS,
  copella:          BROAD_PREMIUM,
  belvoir:          BROAD_PREMIUM,   // Belvoir Fruit Farms cordials
  bottlegreen:      BROAD_PREMIUM,   // Bottlegreen cordials
  plenish:          BROAD_PREMIUM,   // Plenish cold-pressed juices
  cawstonpress:     BROAD_PREMIUM,   // Cawston Press
  jimmys:           BROAD_PREMIUM,   // Jimmy's Iced Coffee
  firefly:          BROAD_PREMIUM,   // Firefly drinks
  bai:              BROAD_PREMIUM,   // Bai antioxidant drinks
  miwadi:           MAINSTREAM,      // Miwadi squash

  // ── Hot drinks ───────────────────────────────────────────────────────────────

  nescafe:          ALL_MAJOR,       // Nescafé instant coffee
  kenco:            PREMIUM_CHAINS,  // Kenco ground/instant coffee
  taylors:          BROAD_PREMIUM,   // Taylors of Harrogate
  tetley:           ALL_MAJOR,       // Tetley tea bags
  pgtips:           ALL_MAJOR,       // PG Tips
  yorkshiretea:     ALL_MAJOR,       // Yorkshire Tea (Bettys & Taylors)
  twinings:         PREMIUM_CHAINS,
  clipper:          BROAD_PREMIUM,   // Clipper organic teas
  lavazza:          BROAD_PREMIUM,
  illy:             SELECTIVE,       // illy — selective premium distribution
  douweegberts:     BROAD_PREMIUM,   // Douwe Egberts
  pukka:            BROAD_PREMIUM,   // Pukka herbal teas
  lipton:           MAINSTREAM_PLUS_COOP,
  whittard:         SELECTIVE,       // Whittard of Chelsea

  // ── Crisps & savoury snacks ──────────────────────────────────────────────────

  walkers:          ALL_MAJOR,
  pringles:         ALL_MAJOR,
  doritos:          ALL_MAJOR,
  hulahoop:         ALL_MAJOR,       // Hula Hoops
  quavers:          ALL_MAJOR,
  wotsits:          ALL_MAJOR,
  frazzles:         ALL_MAJOR,
  skips:            ALL_MAJOR,
  mccoys:           ALL_MAJOR,       // McCoy's
  tyrells:          BROAD_PREMIUM,   // Tyrrells
  pipers:           BROAD_PREMIUM,   // Pipers Crisps
  kettle:           PREMIUM_CHAINS,  // Kettle Chips
  popchips:         BROAD_PREMIUM,
  hippeas:          BROAD_PREMIUM,   // Hippeas chickpea puffs
  seabrook:         MAINSTREAM,      // Seabrook Crisps
  propercorn:       BROAD_PREMIUM,   // Proper Corn
  sensations:       ALL_MAJOR,       // Walkers Sensations (explicit for direct-brand match)
  popcorners:       BROAD_PREMIUM,   // PopCorners

  // ── Snack bars & health snacks ───────────────────────────────────────────────

  nakd:             BROAD_PREMIUM,   // NAKD fruit & nut bars
  graze:            BROAD_PREMIUM,
  bear:             BROAD_PREMIUM,   // Bear Real Fruit Yoyos / Paws
  eatnatural:       BROAD_PREMIUM,   // Eat Natural
  naturevalley:     PREMIUM_CHAINS,  // Nature Valley (General Mills)
  belvita:          ALL_MAJOR,       // BelVita breakfast biscuits
  trek:             BROAD_PREMIUM,   // Trek protein bars
  kind:             BROAD_PREMIUM,   // KIND bars
  clif:             BROAD_PREMIUM,   // Clif Bar
  tribe:            BROAD_PREMIUM,   // Tribe bars
  pulsin:           BROAD_PREMIUM,   // Pulsin protein bars
  grenade:          PREMIUM_CHAINS,  // Grenade Carb Killa
  rxbar:            SELECTIVE,       // RXBAR
  fulfil:           BROAD_PREMIUM,   // Fulfil nutrition bars
  barebells:        BROAD_PREMIUM,   // Barebells protein bars

  // ── Biscuits & crackers ──────────────────────────────────────────────────────

  mcvities:         ALL_MAJOR,
  jacobs:           ALL_MAJOR,       // Jacob's crackers & biscuits
  maryland:         ALL_MAJOR,       // Maryland Cookies
  foxs:             ALL_MAJOR,       // Fox's Biscuits
  burton:           MAINSTREAM_PLUS_COOP, // Burton's Biscuits / Burton Biscuits
  oreo:             ALL_MAJOR,       // Oreo (Mondelez)
  lotus:            PREMIUM_CHAINS,  // Lotus Biscoff
  bahlsen:          BROAD_PREMIUM,   // Bahlsen
  duchy:            SELECTIVE,       // Duchy Originals
  tunnocks:         MAINSTREAM_PLUS_COOP, // Tunnock's
  border:           BROAD_PREMIUM,   // Border Biscuits
  bonnmaman:        BROAD_PREMIUM,   // Bonne Maman
  ryvita:           PREMIUM_CHAINS,
  ritz:             ALL_MAJOR,       // Ritz crackers (Mondelez)
  carrs:            BROAD_PREMIUM,   // Carr's crackers
  nairns:           PREMIUM_CHAINS,  // Nairn's oatcakes
  wasa:             BROAD_PREMIUM,   // WASA crispbreads
  hobnobs:          ALL_MAJOR,       // McVitie's Hobnobs (explicit for direct match)
  patersons:        MAINSTREAM_PLUS_COOP, // Paterson's Shortbread
  lees:             MAINSTREAM_PLUS_COOP, // Lee's snowballs/teacakes (Scotland)
  doves:            BROAD_PREMIUM,   // Dove's Farm (also in bread; covers both)

  // ── Chocolate & confectionery ────────────────────────────────────────────────

  cadbury:          ALL_MAJOR,
  nestle:           ALL_MAJOR,       // Nestlé — accent normalised to nestle
  nestl:            ALL_MAJOR,       // legacy key for entries where é stripped without mapping
  mars:             ALL_MAJOR,
  kitkat:           ALL_MAJOR,       // KitKat (Nestlé)
  rowntrees:        ALL_MAJOR,       // Rowntree's
  galaxy:           ALL_MAJOR,       // Galaxy (Mars)
  twix:             ALL_MAJOR,
  bounty:           ALL_MAJOR,
  snickers:         ALL_MAJOR,
  maltesers:        ALL_MAJOR,
  mms:              ALL_MAJOR,       // M&Ms
  smarties:         ALL_MAJOR,       // Smarties (Nestlé)
  ferrero:          ALL_MAJOR,       // Ferrero Rocher
  kinder:           ALL_MAJOR,       // Kinder Bueno, Kinder eggs
  raffaello:        BROAD_PREMIUM,   // Raffaello (Ferrero)
  haribo:           ALL_MAJOR,
  swizzels:         MAINSTREAM_PLUS_COOP, // Swizzels Matlow
  maynards:         ALL_MAJOR,       // Maynards Bassetts
  bassetts:         ALL_MAJOR,
  werthers:         MAINSTREAM_PLUS_COOP, // Werther's Original
  terrys:           MAINSTREAM_PLUS_COOP, // Terry's Chocolate Orange
  thorntons:        BROAD_PREMIUM,
  lindt:            BROAD_PREMIUM,
  greenblacks:      SELECTIVE,       // Green & Black's
  hotelchocolat:    SELECTIVE,       // Hotel Chocolat
  divine:           BROAD_PREMIUM,   // Divine Chocolate (Fairtrade)
  montezumas:       SELECTIVE,       // Montezuma's
  chupachups:       MAINSTREAM_PLUS_COOP, // Chupa Chups
  starburst:        ALL_MAJOR,       // Starburst (Mars)
  skittles:         ALL_MAJOR,       // Skittles (Mars)
  wrigleys:         MAINSTREAM_PLUS_COOP, // Wrigley's chewing gum
  maoam:            MAINSTREAM_PLUS_COOP, // MAOAM (Haribo)
  jellybelly:       BROAD_PREMIUM,   // Jelly Belly
  toffifee:         BROAD_PREMIUM,   // Toffifee (Storck)
  celebrations:     ALL_MAJOR,       // Celebrations (Mars)
  qualitystreet:    ALL_MAJOR,       // Quality Street (Nestlé)
  roses:            ALL_MAJOR,       // Cadbury Roses (prefix matches cadbury too)

  // ── Cereals & breakfast ──────────────────────────────────────────────────────

  kelloggs:         ALL_MAJOR,
  kellogs:          ALL_MAJOR,       // common misspelling in OFF
  weetabix:         ALL_MAJOR,
  quaker:           ALL_MAJOR,
  oatly:            PREMIUM_CHAINS,
  alpen:            PREMIUM_CHAINS,  // Alpen muesli
  jordans:          BROAD_PREMIUM,   // Jordan's cereals
  dorset:           BROAD_PREMIUM,   // Dorset Cereals
  rudehealth:       BROAD_PREMIUM,   // Rude Health
  moma:             BROAD_PREMIUM,   // MOMA
  scotts:           MAINSTREAM_PLUS_COOP, // Scott's Porage Oats
  flahavans:        BROAD_PREMIUM,   // Flahavan's
  readybrek:        ALL_MAJOR,       // Ready Brek (Weetabix Group)
  bobsredmill:      BROAD_PREMIUM,   // Bob's Red Mill
  freyas:           BROAD_PREMIUM,   // Freya's granola
  rude:             BROAD_PREMIUM,   // "Rude Health" short-form in some OFF entries

  // ── Bread & bakery ───────────────────────────────────────────────────────────

  warburtons:       MAINSTREAM_PLUS_COOP,
  hovis:            MAINSTREAM_PLUS_COOP,
  kingsmill:        MAINSTREAM_PLUS_COOP,
  roberts:          MAINSTREAM_PLUS_COOP, // Roberts Bakery
  genius:           PREMIUM_CHAINS,  // Genius gluten-free
  bfree:            BROAD_PREMIUM,   // BFree gluten-free wraps/rolls
  schar:            BROAD_PREMIUM,   // Schär gluten-free — ä → a
  dovesfarm:        BROAD_PREMIUM,   // Dove's Farm
  stpierre:         BROAD_PREMIUM,   // St Pierre brioche

  // ── Dairy: cheese, butter & cream ────────────────────────────────────────────

  cathedralcity:    PREMIUM_CHAINS,  // Cathedral City cheddar
  philadelphia:     ALL_MAJOR,       // Kraft Philadelphia cream cheese
  lurpak:           PREMIUM_CHAINS,
  anchor:           ALL_MAJOR,       // Anchor butter & cream
  kerrygold:        PREMIUM_CHAINS,  // Kerrygold Irish butter
  cravendale:       MAINSTREAM_PLUS_COOP, // Cravendale milk (Arla)
  president:        BROAD_PREMIUM,   // Président butter/brie — é → e
  babybel:          ALL_MAJOR,       // Mini Babybel
  laughingcow:      ALL_MAJOR,       // The Laughing Cow
  dairylea:         ALL_MAJOR,       // Dairylea (Kraft)
  cheestring:       MAINSTREAM_PLUS_COOP, // Cheestrings
  pilgrimschoice:   PREMIUM_CHAINS,  // Pilgrim's Choice cheddar
  josephheler:      BROAD_PREMIUM,   // Joseph Heler artisan cheese
  shropshire:       SELECTIVE,       // Shropshire/artisan cheese brands

  // ── Dairy: yogurt & chilled desserts ─────────────────────────────────────────

  muller:           ALL_MAJOR,       // Müller — ü → u
  mller:            ALL_MAJOR,       // Müller fallback if ü stripped without mapping
  activia:          PREMIUM_CHAINS,  // Activia (Danone)
  danone:           PREMIUM_CHAINS,
  arla:             MAINSTREAM_PLUS_COOP,
  fage:             BROAD_PREMIUM,   // Fage Total Greek yogurt
  onken:            BROAD_PREMIUM,
  rachels:          BROAD_PREMIUM,   // Rachel's organic
  yeo:              PREMIUM_CHAINS,  // Yeo Valley
  yeovalley:        PREMIUM_CHAINS,
  lactofree:        MAINSTREAM_PLUS_COOP, // Lactofree (Arla)
  emmi:             SELECTIVE,       // Emmi Swiss dairy
  sthelens:         BROAD_PREMIUM,   // St Helen's Farm goat dairy
  actimel:          PREMIUM_CHAINS,  // Actimel (Danone)
  liberte:          BROAD_PREMIUM,   // Liberté yogurts

  // ── Plant-based dairy alternatives ───────────────────────────────────────────

  alpro:            ALL_MAJOR,
  koko:             BROAD_PREMIUM,   // Koko dairy-free
  califia:          BROAD_PREMIUM,   // Califia Farms
  coconutcollaborative: BROAD_PREMIUM, // The Coconut Collaborative
  rebelkitchen:     BROAD_PREMIUM,   // Rebel Kitchen
  minorfigures:     SELECTIVE,       // Minor Figures oat milk
  naturli:          BROAD_PREMIUM,   // Naturli plant-based
  violife:          BROAD_PREMIUM,   // Violife vegan cheese
  vitalite:         MAINSTREAM,      // Vitalite plant-based spread
  pure:             MAINSTREAM,      // Pure dairy-free spread
  nuttvia:          BROAD_PREMIUM,   // Nuttvia hazelnut spread
  myprotein:        BROAD_PREMIUM,   // MyProtein (Tesco/online; also in Sainsbury's)
  vivera:           BROAD_PREMIUM,   // Vivera plant-based
  beyond:           BROAD_PREMIUM,   // Beyond Meat
  thisisnot:        BROAD_PREMIUM,   // This isn't... (plant-based brand)

  // ── Ice cream & frozen desserts ───────────────────────────────────────────────

  benjerry:         PREMIUM_CHAINS,  // Ben & Jerry's — ampersand + apostrophe stripped
  haagendazs:       BROAD_PREMIUM,   // Häagen-Dazs — ä → a
  walls:            MAINSTREAM_PLUS_COOP, // Wall's ice cream (Unilever)
  magnum:           MAINSTREAM_PLUS_COOP, // Magnum (Unilever)
  cartedor:         MAINSTREAM_PLUS_COOP, // Carte D'Or (Unilever)
  cornetto:         MAINSTREAM_PLUS_COOP, // Cornetto (Unilever)
  calippo:          MAINSTREAM,      // Calippo (Unilever)
  gu:               BROAD_PREMIUM,   // Gü desserts — ü → u
  judes:            SELECTIVE,       // Jude's ice cream
  oppo:             SELECTIVE,       // Oppo Brothers lower-calorie ice cream
  booja:            SELECTIVE,       // Booja-Booja vegan
  halotop:          BROAD_PREMIUM,   // Halo Top

  // ── Condiments, sauces & marinades ───────────────────────────────────────────

  heinz:            ALL_MAJOR,
  hellmanns:        ALL_MAJOR,
  branston:         ALL_MAJOR,
  colmans:          ALL_MAJOR,       // Colman's mustard/sauces
  hp:               ALL_MAJOR,       // HP Sauce
  leaperrins:       PREMIUM_CHAINS,  // Lea & Perrins Worcestershire sauce
  tabasco:          PREMIUM_CHAINS,
  nandos:           MAINSTREAM_PLUS_COOP,
  encona:           MAINSTREAM_PLUS_COOP, // Encona hot sauces
  franks:           PREMIUM_CHAINS,  // Frank's RedHot
  sharwoods:        MAINSTREAM_PLUS_COOP, // Sharwood's
  pataks:           MAINSTREAM_PLUS_COOP, // Patak's
  dolmio:           ALL_MAJOR,       // Dolmio pasta sauces (Mars Foods)
  loydgrossman:     PREMIUM_CHAINS,  // Loyd Grossman
  sacla:            BROAD_PREMIUM,   // Sacla' pesto & sauces
  napolina:         MAINSTREAM_PLUS_COOP, // Napolina pasta/tomatoes
  amoy:             MAINSTREAM_PLUS_COOP, // Amoy soy sauce & noodles
  bluedragon:       MAINSTREAM_PLUS_COOP, // Blue Dragon
  kikkoman:         BROAD_PREMIUM,
  leekumkee:        MAINSTREAM_PLUS_COOP, // Lee Kum Kee
  schwartz:         ALL_MAJOR,       // Schwartz herbs & spices
  oldelpaso:        ALL_MAJOR,       // Old El Paso (General Mills)
  santamaria:       MAINSTREAM_PLUS_COOP, // Santa Maria
  discovery:        MAINSTREAM_PLUS_COOP, // Discovery world foods
  bart:             BROAD_PREMIUM,   // Bart spices
  linghams:         BROAD_PREMIUM,   // Lingham's ginger sauce
  thaitaste:        BROAD_PREMIUM,   // Thai Taste
  wahaca:           SELECTIVE,       // Wahaca sauces
  maille:           BROAD_PREMIUM,   // Maille Dijon mustard
  bisto:            ALL_MAJOR,       // Bisto gravy granules
  oxo:              ALL_MAJOR,       // OXO stock cubes
  knorr:            ALL_MAJOR,       // Knorr stock/sauces (Unilever)
  campbells:        MAINSTREAM_PLUS_COOP, // Campbell's soup
  marigold:         BROAD_PREMIUM,   // Marigold bouillon powder
  cholula:          BROAD_PREMIUM,   // Cholula hot sauce

  // ── Canned & ambient grocery ─────────────────────────────────────────────────

  baxters:          PREMIUM_CHAINS,  // Baxters soups
  crosseblackwell:  BROAD_PREMIUM,   // Crosse & Blackwell
  johnwest:         ALL_MAJOR,       // John West tuna & fish
  princes:          ALL_MAJOR,       // Princes tinned fish, meats, beans
  clearspring:      BROAD_PREMIUM,   // Clearspring organic
  merchantgourmet:  BROAD_PREMIUM,   // Merchant Gourmet grains & lentils
  belazu:           SELECTIVE,       // Belazu antipasti & oils
  ortiz:            SELECTIVE,       // Ortiz premium tuna
  mutti:            BROAD_PREMIUM,   // Mutti Italian tomatoes
  cirio:            BROAD_PREMIUM,   // Cirio tomatoes
  biona:            BROAD_PREMIUM,   // Biona organic canned goods

  // ── Pasta, rice & grains ─────────────────────────────────────────────────────

  barilla:          BROAD_PREMIUM,   // Barilla pasta
  dececco:          BROAD_PREMIUM,   // De Cecco pasta
  garofalo:         SELECTIVE,       // Garofalo pasta
  tilda:            MAINSTREAM_PLUS_COOP, // Tilda rice
  unclebens:        ALL_MAJOR,       // Uncle Ben's rice & sauces
  kohinoor:         MAINSTREAM,      // Kohinoor basmati rice

  // ── Spreads, jams & sweet condiments ─────────────────────────────────────────

  marmite:          ALL_MAJOR,
  nutella:          ALL_MAJOR,
  sunpat:           MAINSTREAM_PLUS_COOP, // Sun-Pat peanut butter
  meridian:         BROAD_PREMIUM,   // Meridian nut butters
  wholeearth:       BROAD_PREMIUM,   // Whole Earth peanut butter
  hartleys:         MAINSTREAM_PLUS_COOP, // Hartley's jam
  stdalfour:        BROAD_PREMIUM,   // St Dalfour jam
  rowse:            MAINSTREAM_PLUS_COOP, // Rowse honey
  lyles:            ALL_MAJOR,       // Lyle's Golden Syrup
  tatelyle:         ALL_MAJOR,       // Tate & Lyle sugar
  silverspoon:      ALL_MAJOR,       // Silver Spoon sugar
  billingtons:      BROAD_PREMIUM,   // Billington's unrefined sugar

  // ── Cooking, baking & pantry ─────────────────────────────────────────────────

  shipton:          BROAD_PREMIUM,   // Shipton Mill flours
  marriages:        BROAD_PREMIUM,   // Marriage's Millers flour
  allinson:         MAINSTREAM_PLUS_COOP, // Allinson flour & bread mixes
  wrights:          MAINSTREAM_PLUS_COOP, // Wright's baking mixes
  robertsons:       MAINSTREAM,      // Robertson's marmalade
  filippoberio:     BROAD_PREMIUM,   // Filippo Berio olive oil
  borges:           BROAD_PREMIUM,   // Borges olive oil
  carbonell:        BROAD_PREMIUM,   // Carbonell olive oil

  // ── Meat, fish & chilled ready meals ─────────────────────────────────────────

  richmond:         MAINSTREAM_PLUS_COOP, // Richmond sausages
  heck:             BROAD_PREMIUM,   // HECK sausages/burgers
  lindamccartney:   PREMIUM_CHAINS,  // Linda McCartney vegetarian
  quorn:            ALL_MAJOR,
  mattessons:       MAINSTREAM_PLUS_COOP, // Mattessons smoked sausage
  peperami:         MAINSTREAM_PLUS_COOP, // Peperami (Jack Link's)
  ginsters:         MAINSTREAM_PLUS_COOP, // Ginsters pasties
  saucyfish:        BROAD_PREMIUM,   // The Saucy Fish Co.
  charliebigham:    SELECTIVE,       // Charlie Bigham's premium ready meals
  cook:             SELECTIVE,       // COOK frozen meals
  mccain:           MAINSTREAM_PLUS_COOP, // McCain chips & oven fries

  // ── Frozen foods ──────────────────────────────────────────────────────────────

  birdseye:         MAINSTREAM_ICELAND,
  youngs:           MAINSTREAM_ICELAND,
  findus:           MAINSTREAM_ICELAND,
  auntbessie:       MAINSTREAM_ICELAND, // Aunt Bessie's
  goodfellas:       MAINSTREAM_ICELAND, // Goodfella's Pizza
  droetker:         MAINSTREAM_PLUS_COOP, // Dr. Oetker — . and space stripped → droetker
  chicagotown:      MAINSTREAM_ICELAND,  // Chicago Town
  rustlers:         MAINSTREAM_PLUS_COOP, // Rustlers microwave burgers

  // ── Baby & toddler food ───────────────────────────────────────────────────────

  ellaskitchen:     PREMIUM_CHAINS,  // Ella's Kitchen
  organix:          BROAD_PREMIUM,   // Organix organic baby
  hipp:             BROAD_PREMIUM,   // HiPP organic
  holle:            SELECTIVE,       // Holle organic (premium/specialist)
  cowgate:          MAINSTREAM_PLUS_COOP, // Cow & Gate
  aptamil:          PREMIUM_CHAINS,  // Aptamil formula (Danone)

};

// ── Category → inferred stores ─────────────────────────────────────────────────
// OFF category tags that reliably map to UK mainstream distribution.

const CATEGORY_STORE_MAP: Record<string, KnownStore[]> = {
  // Soft drinks
  'en:soft-drinks': MAINSTREAM_PLUS_COOP,
  'en:carbonated-drinks': MAINSTREAM_PLUS_COOP,
  'en:sodas': MAINSTREAM_PLUS_COOP,
  'en:colas': MAINSTREAM_PLUS_COOP,
  'en:energy-drinks': MAINSTREAM_PLUS_COOP,
  // Biscuits / snacks
  'en:biscuits-and-cakes': MAINSTREAM_PLUS_COOP,
  'en:biscuits': MAINSTREAM_PLUS_COOP,
  'en:crackers': MAINSTREAM,
  'en:oatcakes': PREMIUM_CHAINS,
  'en:snacks': MAINSTREAM,
  'en:crisps': MAINSTREAM,
  'en:chips': MAINSTREAM,
  // Cereals / breakfast
  'en:cereals-and-their-products': MAINSTREAM,
  'en:breakfast-cereals': MAINSTREAM,
  // Dairy
  'en:dairy-products': MAINSTREAM,
  'en:yogurts': MAINSTREAM,
  'en:cheeses': MAINSTREAM,
  // Bakery
  'en:breads': MAINSTREAM_PLUS_COOP,
  // Confectionery
  'en:chocolates': MAINSTREAM_PLUS_COOP,
  'en:sweets': MAINSTREAM_PLUS_COOP,
  // Condiments
  'en:condiments': MAINSTREAM,
  'en:sauces': MAINSTREAM,
  // Ambient grocery
  'en:canned-foods': MAINSTREAM_PLUS_COOP,
  'en:frozen-foods': MAINSTREAM,
};

// ── In-memory cache ────────────────────────────────────────────────────────────

interface CacheEntry {
  data: RetailEnrichment;
  expiry: number;
}

// 5-minute TTL — long enough to cover repeated search result renders,
// short enough to pick up any OFF data updates within a session.
const CACHE_TTL_MS = 5 * 60 * 1000;
const _cache = new Map<string, CacheEntry>();

function _cacheKey(input: RawStoreInput): string {
  if (input.barcode) return `b:${input.barcode}`;
  const brand = _normBrand(input.brand);
  const tags = [...input.storeTags, ...input.categoryTags].map(t => t.toLowerCase()).sort().join(',');
  return `c:${brand}::${tags}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Normalise a brand string to a-z0-9 only for map lookups.
 * Maps common accented characters to ASCII equivalents before stripping
 * so that Müller → muller, Häagen-Dazs → haagendazs, Gü → gu, Nestlé → nestle.
 */
function _normBrand(brand: string | null | undefined): string {
  if (!brand) return '';
  let s = brand.toLowerCase();
  // ASCII-fold common accented characters first
  s = s
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõöø]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/ç/g, 'c')
    .replace(/ß/g, 'ss')
    .replace(/[ýÿ]/g, 'y');
  // Strip everything that is not a-z or 0-9
  return s.replace(/[^a-z0-9]/g, '');
}

function _mapStoreTags(rawTags: string[]): KnownStore[] {
  const out = new Set<KnownStore>();
  for (const tag of rawTags) {
    const mapped = STORE_TAG_MAP[tag.toLowerCase()];
    if (mapped) out.add(mapped);
  }
  return Array.from(out);
}

/**
 * Infer stores from brand name.
 *
 * OFF brand strings can be multi-valued (e.g. "Ben & Jerry's,Unilever").
 * We split on commas and semicolons and try each segment independently,
 * returning the first match found.  Matching order per segment:
 *   1. Exact normalised key
 *   2. Normalised brand starts with key  (handles suffix noise: "Coca-Cola GB Ltd")
 *   3. Normalised brand contains key     (handles prefix noise: "The Laughing Cow")
 */
function _inferFromBrand(brand: string | null | undefined): KnownStore[] {
  if (!brand) return [];
  // Split multi-brand strings: "Ben & Jerry's,Unilever" → ["Ben & Jerry's", "Unilever"]
  const segments = brand.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const nb = _normBrand(seg);
    if (!nb) continue;
    // 1. Exact match
    if (BRAND_STORE_MAP[nb]) return BRAND_STORE_MAP[nb];
    // 2. Prefix match — "cocacolagbltd".startsWith("cocacola")
    for (const [key, stores] of Object.entries(BRAND_STORE_MAP)) {
      if (nb.startsWith(key)) return stores;
    }
    // 3. Substring match — "thelaughingcow".includes("laughingcow")
    for (const [key, stores] of Object.entries(BRAND_STORE_MAP)) {
      if (nb.includes(key)) return stores;
    }
  }
  return [];
}

function _inferFromCategories(categoryTags: string[]): KnownStore[] {
  const out = new Set<KnownStore>();
  for (const tag of categoryTags) {
    const stores = CATEGORY_STORE_MAP[tag.toLowerCase()];
    if (stores) stores.forEach(s => out.add(s));
  }
  return Array.from(out);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Enrich a product's store availability by merging all three evidence tiers.
 *
 * All tiers run independently; results are merged so a product confirmed at
 * one retailer by OFF is not prevented from appearing at additional likely
 * retailers inferred from its brand or category.
 *
 * Merge rules:
 *   • OFF-confirmed stores always keep confidence 0.95
 *   • Brand-inferred stores are added at 0.60 only if not already confirmed
 *   • Category-inferred stores are added at 0.30 only if not already covered
 *   • Duplicates are never introduced — highest confidence wins per store
 *
 * Results are cached by barcode (or composite key if no barcode) for
 * CACHE_TTL_MS milliseconds to avoid redundant work on repeated lookups.
 */
export function enrichRetailData(input: RawStoreInput): RetailEnrichment {
  const key = _cacheKey(input);
  const cached = _cache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;

  // Collect all three tiers independently
  const offStores = _mapStoreTags(input.storeTags);
  const brandStores = _inferFromBrand(input.brand);
  const catStores = _inferFromCategories(input.categoryTags);

  const confidenceMap: Record<string, number> = {};
  const confirmedSet = new Set<KnownStore>();
  const inferredSet = new Set<KnownStore>();

  // Tier 1 — OFF confirmed: always 0.95, cannot be downgraded
  for (const s of offStores) {
    confidenceMap[s] = 0.95;
    confirmedSet.add(s);
  }

  // Tier 2 — Brand inferred: 0.60, skip stores already confirmed by OFF
  const brandAdded = new Set<KnownStore>();
  for (const s of brandStores) {
    if (!confirmedSet.has(s)) {
      confidenceMap[s] = 0.60;
      inferredSet.add(s);
      brandAdded.add(s);
    }
  }

  // Tier 3 — Category inferred: 0.30, skip stores already covered by OFF or brand
  const catAdded = new Set<KnownStore>();
  for (const s of catStores) {
    if (!confirmedSet.has(s) && !inferredSet.has(s)) {
      confidenceMap[s] = 0.30;
      inferredSet.add(s);
      catAdded.add(s);
    }
  }

  const confirmedStores = Array.from(confirmedSet);
  const inferredStores = Array.from(inferredSet);
  // Confirmed stores first so callers iterating availableStores see highest-confidence entries first
  const availableStores: KnownStore[] = [...confirmedStores, ...inferredStores];

  const hasOff = confirmedStores.length > 0;
  const hasBrand = brandAdded.size > 0;
  const hasCat = catAdded.size > 0;

  let inferenceSource: InferenceSource;
  if (!availableStores.length) {
    inferenceSource = 'none';
  } else if (hasOff && hasBrand && hasCat) {
    inferenceSource = 'off-data+brand+category';
  } else if (hasOff && hasBrand) {
    inferenceSource = 'off-data+brand';
  } else if (hasOff && hasCat) {
    inferenceSource = 'off-data+category';
  } else if (hasOff) {
    inferenceSource = 'off-data';
  } else if (hasBrand) {
    inferenceSource = 'brand';
  } else {
    inferenceSource = 'category';
  }

  return _cache_and_return(key, {
    availableStores,
    storeConfidence: confidenceMap,
    inferenceSource,
    confirmedStores,
    inferredStores,
  });
}

function _cache_and_return(key: string, data: RetailEnrichment): RetailEnrichment {
  _cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
  return data;
}

/**
 * Filter a product's available stores by minimum confidence threshold.
 *
 * Convenience helper for swap and analyser flows that need different levels
 * of evidence certainty:
 *   >= 0.95  → confirmed by OFF only (strict)
 *   >= 0.60  → confirmed + brand-inferred (practical shopping flows)
 *   >= 0.30  → all stores including category-inferred (broadest fallback)
 */
export function getStoresForThreshold(
  enrichment: RetailEnrichment,
  minConfidence: number,
): KnownStore[] {
  return enrichment.availableStores.filter(
    s => (enrichment.storeConfidence[s] ?? 0) >= minConfidence,
  );
}

/**
 * Evict a specific barcode from the cache (e.g. after a user manually updates store data).
 * No-op if the barcode is not cached.
 */
export function invalidateRetailCache(barcode: string): void {
  _cache.delete(`b:${barcode}`);
}

/**
 * Stubbed verification hook — reserved for a future lightweight check
 * (e.g. a single HEAD request to a retailer search page to confirm presence).
 * Returns the input store list unchanged until implemented.
 */
export async function verifyStoreAvailability(
  stores: KnownStore[],
  _productName: string,
): Promise<KnownStore[]> {
  // TODO: implement lightweight verification when a suitable zero-cost signal
  // is identified (e.g. a public product API or cached retailer feed).
  return stores;
}
