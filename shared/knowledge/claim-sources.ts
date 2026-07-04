// PKC Phase 0 — sourced nutrient↔benefit claim pack (Master Roadmap §6
// "minimum 5 established benefits via the nutrient bridge": Heart / Gut /
// Bone / Immune / Energy).
//
// RULES (enforced by validateKnowledgeSeed):
//   • Citations only — every (nutrient, benefit) pair below must already exist
//     in NUTRIENT_BENEFITS (shared/knowledge/relationships.ts). This file adds
//     sources to existing editorial links; it never adds a new claim.
//   • Every SourceRef must pass shared/knowledge/evidence.ts (Layer-1 trusted
//     domain, https, ISO lastReviewed).
//   • This file is CANDIDATE-stage content (Rule KC9). Seeding it does NOT
//     publish anything: rows stay hidden until a human runs the sign-off gate
//     (npm run knowledge:signoff), which alone sets reviewed_at.
//
// lastReviewed below records the authoring-pass link check (all URLs verified
// resolving 2026-07-03). It is NOT the editorial sign-off — that is reviewed_at.
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
];

/** The five launch benefits this pack covers (Master Roadmap §6 minimum set). */
export const SOURCED_LAUNCH_BENEFITS = [
  "heart-health",
  "gut-health",
  "bone-health",
  "immune-support",
  "energy-support",
] as const;
