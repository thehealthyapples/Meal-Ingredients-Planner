// PKC Phase 0 — sourced nutrient↔benefit claim pack.
//
// Originally the Master Roadmap §6 minimum ("5 established benefits via the
// nutrient bridge": Heart / Gut / Bone / Immune / Energy). Extended by KNOW1
// (2026-07-09) to every further benefit for which an authorised EU claim
// actually exists — 12 of THA's 15 benefits. The remaining 3 are honest gaps
// (see HONEST GAPS below) and must stay uncited until a real source exists.
//
// RULES (enforced by validateKnowledgeSeed + test-knowledge-claim-coverage):
//   • Citations only — every (nutrient, benefit) pair below must already exist
//     in NUTRIENT_BENEFITS (shared/knowledge/relationships.ts). This file adds
//     sources to existing editorial links; it never adds a new claim.
//   • Every SourceRef must pass shared/knowledge/evidence.ts (Layer-1 trusted
//     domain, https, ISO lastReviewed).
//   • This file is CANDIDATE-stage content (Rule KC9). Seeding it does NOT
//     publish anything: rows stay hidden until a human runs the sign-off gate
//     (npm run knowledge:signoff), which alone sets reviewed_at.
//
// lastReviewed records the authoring-pass LINK check. It is NOT the editorial
// sign-off — that is reviewed_at, and only a human sets it.
//
// KNOW1 verification pass (2026-07-09): every EFSA wording below was checked
// verbatim against the official EU Register of nutrition and health claims
// (ec.europa.eu). Three drafted wordings were WRONG and were corrected, which is
// the reason this check exists: "…for the normal function of the skin" (the
// register says "of skin"), "DHA contributes to the maintenance of…" (the
// register says "to maintenance of"), and "Vitamin B12 contributes to normal
// neurological function" — which is not an authorised claim at all, and was
// replaced with the authorised "…normal functioning of the nervous system".
// No URL was added by that pass, so the 2026-07-03 link check still covers every
// citation here. Note for whoever next re-checks the links: eur-lex.europa.eu now
// serves a bot challenge (HTTP 202) to automated requests — it must be opened in
// a real browser to confirm, and an automated 200 check will report a false
// failure.
//
// HONEST GAPS (Rule E1 — no citation, no card). Three benefits carry editorial
// nutrient links but no authorised source, so they render nowhere. Each was
// checked against the EU Register and found to have none:
//   • sleep-quality             — no authorised magnesium↔sleep claim exists
//                                 (melatonin is the only authorised sleep claim).
//   • blood-sugar-balance       — the authorised post-prandial blood-glucose
//                                 claims name specific substances (beta-glucans,
//                                 pectins, arabinoxylan, resistant starch…), not
//                                 the generic `fibre` identity THA models.
//   • anti-inflammatory-support — the register authorises NO anti-inflammatory
//                                 claim, for any substance.
// Closing one of these requires a source, not a better-sounding sentence.
//
// EFSA wordings are the authorised claims of Commission Regulation (EU)
// No 432/2012 (the EU Register). NHS pages are tier-1 UK public-health copy.
import type { KnowledgeSourceRef } from "./evidence";

export interface SourcedNutrientBenefitClaim {
  nutrientSlug: string;
  benefitSlug: string;
  /** Sourced claims are 'established' — backed by an authorised/official source. */
  evidenceStrength: "established";
  sourceRefs: KnowledgeSourceRef[];
}

const CHECKED = "2026-07-03";

const EU_REGISTER: Omit<KnowledgeSourceRef, "title"> = {
  body: "EFSA",
  url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32012R0432",
  evidenceLevel: "established",
  lastReviewed: CHECKED,
};

const efsa = (authorisedWording: string): KnowledgeSourceRef => ({
  ...EU_REGISTER,
  title: `Commission Regulation (EU) No 432/2012 — authorised claim: “${authorisedWording}”`,
});

const nhs = (title: string, url: string): KnowledgeSourceRef => ({
  body: "NHS",
  title,
  url,
  evidenceLevel: "established",
  lastReviewed: CHECKED,
});

export const NUTRIENT_BENEFIT_SOURCES: SourcedNutrientBenefitClaim[] = [
  // ── Heart Health ────────────────────────────────────────────────────────────
  {
    nutrientSlug: "potassium",
    benefitSlug: "heart-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("Potassium contributes to the maintenance of normal blood pressure")],
  },
  {
    nutrientSlug: "omega-3",
    benefitSlug: "heart-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("EPA and DHA contribute to the normal function of the heart")],
  },
  {
    nutrientSlug: "unsaturated-fats",
    benefitSlug: "heart-health",
    evidenceStrength: "established",
    sourceRefs: [
      efsa(
        "Replacing saturated fats with unsaturated fats in the diet contributes to the maintenance of normal blood cholesterol levels",
      ),
    ],
  },
  {
    nutrientSlug: "fibre",
    benefitSlug: "heart-health",
    evidenceStrength: "established",
    sourceRefs: [
      nhs(
        "How to get more fibre into your diet — fibre intake associated with lower risk of cardiovascular disease",
        "https://www.nhs.uk/live-well/eat-well/digestive-health/how-to-get-more-fibre-into-your-diet/",
      ),
    ],
  },

  // ── Gut Health ──────────────────────────────────────────────────────────────
  {
    nutrientSlug: "fibre",
    benefitSlug: "gut-health",
    evidenceStrength: "established",
    sourceRefs: [
      nhs(
        "How to get more fibre into your diet — fibre and digestive health",
        "https://www.nhs.uk/live-well/eat-well/digestive-health/how-to-get-more-fibre-into-your-diet/",
      ),
    ],
  },

  // ── Bone Health ─────────────────────────────────────────────────────────────
  {
    nutrientSlug: "calcium",
    benefitSlug: "bone-health",
    evidenceStrength: "established",
    sourceRefs: [
      efsa("Calcium is needed for the maintenance of normal bones"),
      nhs("Calcium — Vitamins and minerals", "https://www.nhs.uk/conditions/vitamins-and-minerals/calcium/"),
    ],
  },
  {
    nutrientSlug: "vitamin-d",
    benefitSlug: "bone-health",
    evidenceStrength: "established",
    sourceRefs: [
      efsa("Vitamin D contributes to the maintenance of normal bones"),
      nhs("Vitamin D — Vitamins and minerals", "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/"),
    ],
  },
  {
    nutrientSlug: "vitamin-k",
    benefitSlug: "bone-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin K contributes to the maintenance of normal bones")],
  },
  {
    nutrientSlug: "magnesium",
    benefitSlug: "bone-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("Magnesium contributes to the maintenance of normal bones")],
  },
  {
    nutrientSlug: "manganese",
    benefitSlug: "bone-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("Manganese contributes to the maintenance of normal bones")],
  },

  // ── Immune Support ──────────────────────────────────────────────────────────
  {
    nutrientSlug: "vitamin-c",
    benefitSlug: "immune-support",
    evidenceStrength: "established",
    sourceRefs: [
      efsa("Vitamin C contributes to the normal function of the immune system"),
      nhs("Vitamin C — Vitamins and minerals", "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/"),
    ],
  },
  {
    nutrientSlug: "vitamin-d",
    benefitSlug: "immune-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin D contributes to the normal function of the immune system")],
  },
  {
    nutrientSlug: "zinc",
    benefitSlug: "immune-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Zinc contributes to the normal function of the immune system")],
  },
  {
    nutrientSlug: "selenium",
    benefitSlug: "immune-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Selenium contributes to the normal function of the immune system")],
  },
  {
    nutrientSlug: "copper",
    benefitSlug: "immune-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Copper contributes to the normal function of the immune system")],
  },
  {
    nutrientSlug: "vitamin-a",
    benefitSlug: "immune-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin A contributes to the normal function of the immune system")],
  },

  // ── Energy Support ──────────────────────────────────────────────────────────
  {
    nutrientSlug: "iron",
    benefitSlug: "energy-support",
    evidenceStrength: "established",
    sourceRefs: [
      efsa("Iron contributes to normal energy-yielding metabolism"),
      nhs("Iron — Vitamins and minerals", "https://www.nhs.uk/conditions/vitamins-and-minerals/iron/"),
    ],
  },
  {
    nutrientSlug: "vitamin-b12",
    benefitSlug: "energy-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin B12 contributes to normal energy-yielding metabolism")],
  },
  {
    nutrientSlug: "vitamin-b6",
    benefitSlug: "energy-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin B6 contributes to normal energy-yielding metabolism")],
  },
  {
    nutrientSlug: "vitamin-c",
    benefitSlug: "energy-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin C contributes to normal energy-yielding metabolism")],
  },
  {
    nutrientSlug: "folate",
    benefitSlug: "energy-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Folate contributes to the reduction of tiredness and fatigue")],
  },
  {
    nutrientSlug: "iodine",
    benefitSlug: "energy-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Iodine contributes to normal energy-yielding metabolism")],
  },
  {
    nutrientSlug: "copper",
    benefitSlug: "energy-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Copper contributes to normal energy-yielding metabolism")],
  },

  // ── Muscle Recovery ─────────────────────────────────────────────────────────
  // KNOW1. `protein` is THA's single canonical protein identity (NK6M) — the
  // authorised claim is source-agnostic, exactly as that merge argued.
  {
    nutrientSlug: "protein",
    benefitSlug: "muscle-recovery",
    evidenceStrength: "established",
    sourceRefs: [efsa("Protein contributes to the maintenance of muscle mass")],
  },
  {
    nutrientSlug: "magnesium",
    benefitSlug: "muscle-recovery",
    evidenceStrength: "established",
    sourceRefs: [efsa("Magnesium contributes to normal muscle function")],
  },
  {
    nutrientSlug: "potassium",
    benefitSlug: "muscle-recovery",
    evidenceStrength: "established",
    sourceRefs: [efsa("Potassium contributes to normal muscle function")],
  },

  // ── Skin Health ─────────────────────────────────────────────────────────────
  // KNOW1. `vitamin-e`, `beta-carotene` and `lycopene` also carry editorial
  // skin-health links, and stay UNCITED: the register authorises no skin claim
  // for any of the three. Those three chips do not render (Rule E1).
  {
    nutrientSlug: "vitamin-a",
    benefitSlug: "skin-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin A contributes to the maintenance of normal skin")],
  },
  {
    nutrientSlug: "zinc",
    benefitSlug: "skin-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("Zinc contributes to the maintenance of normal skin")],
  },
  {
    nutrientSlug: "vitamin-c",
    benefitSlug: "skin-health",
    evidenceStrength: "established",
    // Register wording is "of skin", not "of the skin". Verified 2026-07-09.
    sourceRefs: [efsa("Vitamin C contributes to normal collagen formation for the normal function of skin")],
  },

  // ── Eye Health ──────────────────────────────────────────────────────────────
  // KNOW1. `beta-carotene` keeps its editorial eye-health link and stays uncited —
  // the register authorises no beta-carotene claim. `lutein`/`zeaxanthin` hold no
  // benefit link at all, correctly: their eye claims are not authorised either.
  {
    nutrientSlug: "vitamin-a",
    benefitSlug: "eye-health",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin A contributes to the maintenance of normal vision")],
  },

  // ── Brain Health ────────────────────────────────────────────────────────────
  // KNOW1. The DHA claim cites the omega-3 identity, as the heart-health claim
  // above already does. `unsaturated-fats`, `flavonoids` and `anthocyanins` keep
  // their editorial links and stay uncited — no authorised brain claim exists.
  {
    nutrientSlug: "omega-3",
    benefitSlug: "brain-health",
    evidenceStrength: "established",
    // Register wording is "to maintenance of", not "to the maintenance of".
    // Conditions of use: ≥40 mg DHA per 100 g and per 100 kcal; the beneficial
    // effect is obtained with a daily intake of 250 mg DHA.
    sourceRefs: [efsa("DHA contributes to maintenance of normal brain function")],
  },
  {
    nutrientSlug: "vitamin-b12",
    benefitSlug: "brain-health",
    evidenceStrength: "established",
    // "Vitamin B12 contributes to normal neurological function" is NOT an
    // authorised claim and must never be quoted. This is the authorised string.
    sourceRefs: [efsa("Vitamin B12 contributes to normal functioning of the nervous system")],
  },

  // ── Mood Support ────────────────────────────────────────────────────────────
  // KNOW1. "Normal psychological function" is the register's own concept and the
  // closest authorised wording to THA's mood-support benefit; the citation shows
  // it verbatim rather than paraphrasing it into a mood claim. `omega-3` and
  // `vitamin-d` keep their editorial links and stay uncited — neither has an
  // authorised psychological-function claim.
  {
    nutrientSlug: "magnesium",
    benefitSlug: "mood-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Magnesium contributes to normal psychological function")],
  },
  {
    nutrientSlug: "vitamin-b6",
    benefitSlug: "mood-support",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin B6 contributes to normal psychological function")],
  },

  // ── Healthy Ageing ──────────────────────────────────────────────────────────
  // KNOW1. Cell protection from oxidative stress is the only authorised concept
  // that speaks to THA's healthy-ageing benefit, and vitamin E is the only one of
  // this benefit's six editorial nutrients that carries it. `beta-carotene`,
  // `folate`, `polyphenols`, `anthocyanins` and `sulforaphane` stay uncited.
  {
    nutrientSlug: "vitamin-e",
    benefitSlug: "healthy-ageing",
    evidenceStrength: "established",
    sourceRefs: [efsa("Vitamin E contributes to the protection of cells from oxidative stress")],
  },

  // ── Digestive Comfort ───────────────────────────────────────────────────────
  // KNOW1. `live-cultures` keeps its editorial digestive-comfort link and stays
  // uncited: the one authorised live-cultures claim is narrowly about improving
  // lactose digestion in people who have difficulty digesting lactose, which is
  // not the claim this benefit makes. An honest gap, not an oversight.
  {
    nutrientSlug: "fibre",
    benefitSlug: "digestive-comfort",
    evidenceStrength: "established",
    sourceRefs: [
      nhs(
        "How to get more fibre into your diet — fibre and digestive health",
        "https://www.nhs.uk/live-well/eat-well/digestive-health/how-to-get-more-fibre-into-your-diet/",
      ),
    ],
  },
];

/** The five launch benefits this pack covers (Master Roadmap §6 minimum set). */
export const SOURCED_LAUNCH_BENEFITS = [
  "heart-health",
  "gut-health",
  "bone-health",
  "immune-support",
  "energy-support",
] as const;
