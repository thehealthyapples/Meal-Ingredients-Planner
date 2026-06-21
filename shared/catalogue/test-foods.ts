// WS0.10 — 50-food ingestion test set.
//
// Representative sample of USDA FoodData Central format (Foundation + SR Legacy).
// Designed to exercise every pipeline stage:
//   • US/UK alias pairs (10 foods that should resolve to existing canonical)
//   • Direct slug matches (10 common foods already in canonical)
//   • New catalogue entries — common (10 foods THA doesn't have yet)
//   • Rare/global foods (10 — incl. required: kohlrabi, oca, teff, laverbread)
//   • Branded product (1 — should be skipped)
//   • Ambiguous / low-confidence entries (5)
//   • Scientific name dedup check (4 foods with scientific names)
//
// Nutrient values are representative per-100g figures from published food
// composition data (USDA / McCance & Widdowson). Not THA editorial — for
// pipeline testing only.

import type { USDAFood } from "./types";

export const TEST_FOODS_50: USDAFood[] = [

  // ─── GROUP 1: US/UK alias pairs (should all resolve to existing canonical) ───

  {
    fdcId: 169967, description: "Zucchini, summer squash, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Cucurbita pepo",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 17 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.21 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.32 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 3.11 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 1.0 },
    ],
  },

  {
    fdcId: 169228, description: "Eggplant, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Solanum melongena",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 25 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 0.98 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.18 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 5.88 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 3.0 },
    ],
  },

  {
    fdcId: 169247, description: "Arugula, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Eruca vesicaria",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 25 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 2.58 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.66 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 3.65 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 1.6 },
    ],
  },

  {
    fdcId: 169097, description: "Coriander (cilantro) leaves, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Coriandrum sativum",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 23 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 2.13 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.52 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 3.67 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.8 },
    ],
  },

  {
    fdcId: 173798, description: "Garbanzo beans (chickpeas), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Legumes and Legume Products" },
    scientificName: "Cicer arietinum",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 364 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 19.3 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 6.04 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 60.65 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 17.4 },
    ],
  },

  {
    fdcId: 168427, description: "Rutabaga, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Brassica napus",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 39 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.08 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.2 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 8.62 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.3 },
    ],
  },

  {
    fdcId: 169248, description: "Scallions (spring onions), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Allium fistulosum",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 32 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.83 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.19 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 7.34 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.6 },
    ],
  },

  {
    fdcId: 169145, description: "Beet, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Beta vulgaris",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 43 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.61 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.17 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 9.56 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.8 },
    ],
  },

  {
    fdcId: 168409, description: "Corn, sweet, yellow, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Zea mays",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 86 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 3.27 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 1.35 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 18.7 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.0 },
    ],
  },

  {
    fdcId: 170468, description: "Shrimp, raw",
    dataType: "Foundation",
    foodCategory: { description: "Finfish and Shellfish Products" },
    scientificName: "Penaeus vannamei",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 85 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 20.1 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.51 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 0.0 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.0 },
    ],
  },

  // ─── GROUP 2: Direct slug matches (common foods already in canonical) ─────────

  {
    fdcId: 170379, description: "Broccoli, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Brassica oleracea var. italica",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 34 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 2.82 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.37 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 6.64 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.6 },
    ],
  },

  {
    fdcId: 170407, description: "Cauliflower, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Brassica oleracea var. botrytis",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 25 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.92 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.28 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 4.97 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.0 },
    ],
  },

  {
    fdcId: 170393, description: "Kale, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Brassica oleracea var. sabellica",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 49 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 4.28 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.93 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 8.75 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 3.6 },
    ],
  },

  {
    fdcId: 168462, description: "Spinach, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Spinacia oleracea",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 23 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 2.86 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.39 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 3.63 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.2 },
    ],
  },

  {
    fdcId: 173944, description: "Lentils, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Legumes and Legume Products" },
    scientificName: "Lens culinaris",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 353 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 25.8 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 1.06 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 60.08 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 30.5 },
    ],
  },

  {
    fdcId: 175167, description: "Salmon, Atlantic, farmed, raw",
    dataType: "Foundation",
    foodCategory: { description: "Finfish and Shellfish Products" },
    scientificName: "Salmo salar",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 208 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 20.42 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 13.42 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 0.0 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.0 },
    ],
  },

  {
    fdcId: 168917, description: "Oats, rolled, raw",
    dataType: "Foundation",
    foodCategory: { description: "Cereal Grains and Pasta" },
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 389 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 16.89 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 6.9 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 66.27 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 10.6 },
    ],
  },

  {
    fdcId: 168918, description: "Quinoa, raw",
    dataType: "Foundation",
    foodCategory: { description: "Cereal Grains and Pasta" },
    scientificName: "Chenopodium quinoa",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 368 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 14.12 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 6.07 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 64.16 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 7.0 },
    ],
  },

  {
    fdcId: 167765, description: "Avocado, raw",
    dataType: "Foundation",
    foodCategory: { description: "Fruits and Fruit Juices" },
    scientificName: "Persea americana",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 160 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 2.0 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 14.66 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 8.53 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 6.7 },
    ],
  },

  {
    fdcId: 168919, description: "Buckwheat, groats, raw",
    dataType: "Foundation",
    foodCategory: { description: "Cereal Grains and Pasta" },
    scientificName: "Fagopyrum esculentum",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 343 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 13.25 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 3.4 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 71.5 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 10.0 },
    ],
  },

  // ─── GROUP 3: New catalogue entries — common foods not yet in THA ─────────────

  {
    fdcId: 171321, description: "Sweet potato, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Ipomoea batatas",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 86 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.57 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.05 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 20.12 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 3.0 },
    ],
  },

  {
    fdcId: 169967, description: "Leek, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Allium ampeloprasum",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 61 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.5 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.3 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 14.15 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 1.8 },
    ],
  },

  {
    fdcId: 169997, description: "Teff, raw",
    dataType: "Foundation",
    foodCategory: { description: "Cereal Grains and Pasta" },
    scientificName: "Eragrostis tef",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 367 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 13.3 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 2.38 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 73.13 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 8.0 },
    ],
  },

  {
    fdcId: 169998, description: "Amaranth grain, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Cereal Grains and Pasta" },
    scientificName: "Amaranthus cruentus",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 371 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 13.56 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 7.02 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 65.25 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 6.7 },
    ],
  },

  {
    fdcId: 169999, description: "Sorghum grain, raw",
    dataType: "Foundation",
    foodCategory: { description: "Cereal Grains and Pasta" },
    scientificName: "Sorghum bicolor",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 329 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 10.62 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 3.46 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 72.09 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 6.3 },
    ],
  },

  {
    fdcId: 168002, description: "Fenugreek seeds, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Spices and Herbs" },
    scientificName: "Trigonella foenum-graecum",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 323 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 23.0 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 6.41 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 58.35 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 24.6 },
    ],
  },

  {
    fdcId: 170000, description: "Miso paste",
    dataType: "SR Legacy",
    foodCategory: { description: "Legumes and Legume Products" },
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 199 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 11.69 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 6.01 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 26.47 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 5.4 },
    ],
  },

  {
    fdcId: 170001, description: "Mackerel, Atlantic, raw",
    dataType: "Foundation",
    foodCategory: { description: "Finfish and Shellfish Products" },
    scientificName: "Scomber scombrus",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 205 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 18.6 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 13.89 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 0.0 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.0 },
    ],
  },

  {
    fdcId: 170002, description: "Tempeh",
    dataType: "SR Legacy",
    foodCategory: { description: "Legumes and Legume Products" },
    scientificName: "Glycine max",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 193 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 20.29 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 10.8 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 7.64 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.0 },
    ],
  },

  {
    fdcId: 170003, description: "Black beans, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Legumes and Legume Products" },
    scientificName: "Phaseolus vulgaris",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 341 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 21.6 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 1.42 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 62.36 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 15.5 },
    ],
  },

  // ─── GROUP 4: Rare / global foods (including 4 required) ──────────────────────

  // Kohlrabi is already in canonical (slug: "kohlrabi") — should be matched_existing
  {
    fdcId: 169281, description: "Kohlrabi, raw",
    dataType: "Foundation",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Brassica oleracea var. gongylodes",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 27 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.7 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.1 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 6.2 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 3.6 },
    ],
  },

  // Oca — South American tuber, not in canonical
  {
    fdcId: 170100, description: "Oca (New Zealand yam), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Oxalis tuberosa",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 61 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.0 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.2 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 14.5 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 1.8 },
    ],
  },

  // Teff — Ethiopian grain, not in canonical (already in Group 3 test, duplicate check)
  // Using as additional validation — the second occurrence should still resolve to proposed new slug
  {
    fdcId: 170101, description: "Laverbread (laver seaweed, cooked)",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Porphyra umbilicalis",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 55 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 5.8 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 1.2 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 5.1 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 3.3 },
    ],
  },

  {
    fdcId: 170102, description: "Jicama (yambean), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Pachyrhizus erosus",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 38 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 0.72 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.09 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 8.82 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 4.9 },
    ],
  },

  {
    fdcId: 170103, description: "Cassava (manioc), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Manihot esculenta",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 160 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.36 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.28 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 38.06 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 1.8 },
    ],
  },

  {
    fdcId: 170104, description: "Plantain, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Fruits and Fruit Juices" },
    scientificName: "Musa paradisiaca",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 122 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.3 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.37 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 31.89 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.3 },
    ],
  },

  {
    fdcId: 170105, description: "Lotus root, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Nelumbo nucifera",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 74 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 2.6 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.1 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 17.23 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 4.9 },
    ],
  },

  {
    fdcId: 170106, description: "Nori (dried seaweed), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Pyropia yezoensis",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 35 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 5.81 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.28 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 5.11 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.3 },
    ],
  },

  {
    fdcId: 170107, description: "Wakame (seaweed), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Undaria pinnatifida",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 45 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 3.03 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.64 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 9.14 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.5 },
    ],
  },

  {
    fdcId: 170108, description: "Moringa leaves, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Moringa oleifera",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 64 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 9.4 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 1.4 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 8.28 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.0 },
    ],
  },

  // ─── GROUP 5: Skip — branded product (1) ──────────────────────────────────────

  {
    fdcId: 999001, description: "HEINZ Organic Ketchup",
    dataType: "Branded Food",
    foodCategory: { description: "Condiments and Sauces" },
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 100 },
    ],
  },

  // ─── GROUP 6: Ambiguous / low-confidence entries ──────────────────────────────

  // Missing most nutrients
  {
    fdcId: 170200, description: "Baobab fruit powder",
    dataType: "SR Legacy",
    foodCategory: { description: "Fruits and Fruit Juices" },
    scientificName: "Adansonia digitata",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 250 },
      // Missing protein, fat, carbs, fibre
    ],
  },

  // Category maps to "Other" — no USDA category
  {
    fdcId: 170201, description: "Yeast extract (vegemite style)",
    dataType: "SR Legacy",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 185 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 27.0 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.0 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 18.0 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 2.0 },
    ],
  },

  // Vegetable — subcategory ambiguous
  {
    fdcId: 170202, description: "Bitter melon (bitter gourd), raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Vegetables and Vegetable Products" },
    scientificName: "Momordica charantia",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 17 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.0 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.17 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 3.7 },
      // Missing fibre
    ],
  },

  // Fish — not oily or white by keyword — ambiguous subcategory
  {
    fdcId: 170203, description: "Tilapia, raw",
    dataType: "Foundation",
    foodCategory: { description: "Finfish and Shellfish Products" },
    scientificName: "Oreochromis niloticus",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 96 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 20.08 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 1.7 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 0.0 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.0 },
    ],
  },

  // Very sparse entry — only a name and one nutrient
  {
    fdcId: 170204, description: "Tepary bean, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Legumes and Legume Products" },
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 340 },
    ],
  },

  // ─── GROUP 7: Additional validation foods ─────────────────────────────────────

  // Jackfruit — tropical fruit, new to catalogue
  {
    fdcId: 174687, description: "Jackfruit, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Fruits and Fruit Juices" },
    scientificName: "Artocarpus heterophyllus",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 95 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 1.72 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.64 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 23.25 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 1.5 },
    ],
  },

  // Cod — already in canonical (slug: "cod") — direct name match
  {
    fdcId: 171958, description: "Cod, Atlantic, raw",
    dataType: "Foundation",
    foodCategory: { description: "Finfish and Shellfish Products" },
    scientificName: "Gadus morhua",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 82 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 17.81 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.67 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 0.0 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 0.0 },
    ],
  },

  // Mung beans — new catalogue entry, not in THA canonical
  {
    fdcId: 174256, description: "Mung beans, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Legumes and Legume Products" },
    scientificName: "Vigna radiata",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 347 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 23.86 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 1.15 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 62.62 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 16.3 },
    ],
  },

  // Persimmon — fruit, new to catalogue
  {
    fdcId: 169941, description: "Persimmons, Japanese, raw",
    dataType: "SR Legacy",
    foodCategory: { description: "Fruits and Fruit Juices" },
    scientificName: "Diospyros kaki",
    foodNutrients: [
      { nutrient: { id: 1008, name: "Energy", unitName: "kcal" }, amount: 70 },
      { nutrient: { id: 1003, name: "Protein", unitName: "g" }, amount: 0.58 },
      { nutrient: { id: 1004, name: "Total lipid (fat)", unitName: "g" }, amount: 0.19 },
      { nutrient: { id: 1005, name: "Carbohydrate, by difference", unitName: "g" }, amount: 18.59 },
      { nutrient: { id: 1079, name: "Fiber, total dietary", unitName: "g" }, amount: 3.6 },
    ],
  },

];
