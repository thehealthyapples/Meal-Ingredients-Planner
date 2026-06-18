// WS0 — Nutrition Knowledge Registry: Health Benefits seed data.
//
// Editorial, human-curated, deterministic. Descriptions are educational and
// framed around "what foods can add" — never disease cures, treatments or
// medical advice. Edit freely; every row is upserted by slug.
import type { InsertKnowledgeHealthBenefit } from "../schema";

export const HEALTH_BENEFIT_SEED: InsertKnowledgeHealthBenefit[] = [
  {
    slug: "gut-health",
    name: "Gut Health",
    description:
      "Foods that feed and support a thriving gut microbiome — fibre-rich plants and fermented foods that add variety to what lives in your gut.",
    icon: "sprout",
    displayOrder: 1,
  },
  {
    slug: "heart-health",
    name: "Heart Health",
    description:
      "Foods associated with a heart-friendly way of eating, such as unsaturated fats, fibre, potassium and colourful plants.",
    icon: "heart",
    displayOrder: 2,
  },
  {
    slug: "immune-support",
    name: "Immune Support",
    description:
      "Foods that contribute nutrients your immune system uses, including vitamin C, zinc and a wide range of plants.",
    icon: "shield",
    displayOrder: 3,
  },
  {
    slug: "sleep-quality",
    name: "Sleep Quality",
    description:
      "Foods and nutrients often linked with restful routines, such as magnesium-rich seeds and nuts.",
    icon: "moon",
    displayOrder: 4,
  },
  {
    slug: "bone-health",
    name: "Bone Health",
    description:
      "Foods that supply nutrients bones draw on, including calcium, vitamin D, vitamin K and magnesium.",
    icon: "bone",
    displayOrder: 5,
  },
  {
    slug: "brain-health",
    name: "Brain Health",
    description:
      "Foods associated with supporting the brain, such as omega-3 fats and colourful polyphenol-rich plants.",
    icon: "brain",
    displayOrder: 6,
  },
  {
    slug: "blood-sugar-balance",
    name: "Blood Sugar Balance",
    description:
      "Fibre-rich, slow-energy foods that help meals feel steady and satisfying.",
    icon: "activity",
    displayOrder: 7,
  },
  {
    slug: "muscle-recovery",
    name: "Muscle Recovery",
    description:
      "Foods that add protein and minerals which muscles use to rebuild and recover.",
    icon: "dumbbell",
    displayOrder: 8,
  },
  {
    slug: "skin-health",
    name: "Skin Health",
    description:
      "Foods rich in vitamin C, healthy fats and colourful antioxidants that support healthy-looking skin.",
    icon: "sparkles",
    displayOrder: 9,
  },
  {
    slug: "energy-support",
    name: "Energy Support",
    description:
      "Foods that supply iron, B vitamins and steady carbohydrates the body uses to release energy.",
    icon: "zap",
    displayOrder: 10,
  },
  {
    slug: "eye-health",
    name: "Eye Health",
    description:
      "Foods rich in beta-carotene, vitamin A and protective plant pigments associated with eye health.",
    icon: "eye",
    displayOrder: 11,
  },
  {
    slug: "digestive-comfort",
    name: "Digestive Comfort",
    description:
      "Gentle, fibre-rich and fermented foods that many people find help digestion feel comfortable.",
    icon: "leaf",
    displayOrder: 12,
  },
  {
    slug: "healthy-ageing",
    name: "Healthy Ageing",
    description:
      "A varied, plant-rich pattern of eating associated with feeling well over the long term.",
    icon: "clock",
    displayOrder: 13,
  },
  {
    slug: "mood-support",
    name: "Mood Support",
    description:
      "Foods supplying omega-3, magnesium and B vitamins, part of an overall balanced way of eating.",
    icon: "smile",
    displayOrder: 14,
  },
  {
    slug: "anti-inflammatory-support",
    name: "Anti-Inflammatory Support",
    description:
      "Colourful plants, herbs, oily fish and extra virgin olive oil associated with an anti-inflammatory style of eating.",
    icon: "flame",
    displayOrder: 15,
  },
];
