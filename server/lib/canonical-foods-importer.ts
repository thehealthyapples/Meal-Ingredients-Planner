/**
 * NK6D Canonical Foods Importer
 *
 * Thin translation layer: Parse v2.0-draft YAML → extract knowledge → insert using existing services
 * No new architecture, no new schema, no new tables.
 * Extends existing canonical knowledge persistence.
 */

import { readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  knowledgeFoods,
  knowledgeFoodNutrients,
  knowledgeFoodBenefits,
  knowledgeHealthBenefits,
  knowledgeNutrients,
} from "@shared/schema";

export interface ImportResult {
  success: boolean;
  foodSlug: string;
  fileName: string;
  errors: string[];
  warnings: string[];
  inserted: {
    foods: number;
    nutrients: number;
    benefits: number;
  };
  skipped: {
    nutrients: string[];
    benefits: string[];
  };
}

/**
 * Import a single canonical food YAML file
 */
export async function importCanonicalFood(
  filePath: string,
  forceUpsert: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    foodSlug: "",
    fileName: filePath.split("/").pop() || filePath,
    errors: [],
    warnings: [],
    inserted: { foods: 0, nutrients: 0, benefits: 0 },
    skipped: { nutrients: [], benefits: [] },
  };

  try {
    // Step 1: Parse YAML
    const content = readFileSync(filePath, "utf-8");
    const draft = parseYaml(content) as any;

    if (!draft?.record?.canonical_slug) {
      result.errors.push("Missing record.canonical_slug in YAML");
      return result;
    }

    result.foodSlug = draft.record.canonical_slug;

    // Step 2: Extract knowledge sections (ignore governance)
    const foodIdentity = extractFoodIdentity(draft);
    const nutrients = extractNutrients(draft);
    const benefits = extractBenefits(draft);

    if (!foodIdentity.slug) {
      result.errors.push("Could not extract valid food identity");
      return result;
    }

    // Step 3: Check for duplicate
    const existing = await db.query.knowledgeFoods.findFirst({
      where: (t) => eq(t.slug, foodIdentity.slug),
    });

    if (existing && !forceUpsert) {
      result.errors.push(
        `Food slug "${foodIdentity.slug}" already exists. Use --force-upsert to override.`
      );
      return result;
    }

    // Step 4: Resolve and validate foreign keys
    const nutrientSlugs = await resolveNutrientSlugs(nutrients.map((n) => n.slug));
    const benefitSlugs = await resolveBenefitSlugs(benefits.map((b) => b.slug));

    // Identify skipped nutrients/benefits (not found in vocabularies)
    for (const n of nutrients) {
      if (!nutrientSlugs[n.slug]) {
        result.skipped.nutrients.push(n.slug);
      }
    }
    for (const b of benefits) {
      if (!benefitSlugs[b.slug]) {
        result.skipped.benefits.push(b.slug);
      }
    }

    if (result.skipped.nutrients.length > 0) {
      result.warnings.push(
        `Skipped unknown nutrients: ${result.skipped.nutrients.join(", ")}`
      );
    }
    if (result.skipped.benefits.length > 0) {
      result.warnings.push(
        `Skipped unknown benefits: ${result.skipped.benefits.join(", ")}`
      );
    }

    // Step 5: Insert food identity
    if (forceUpsert && existing) {
      // Update existing
      await db
        .update(knowledgeFoods)
        .set(foodIdentity)
        .where(eq(knowledgeFoods.slug, foodIdentity.slug));
    } else {
      // Insert new
      await db.insert(knowledgeFoods).values(foodIdentity);
    }
    result.inserted.foods = 1;

    // Step 6: Insert nutrients
    for (const nutrient of nutrients) {
      if (!nutrientSlugs[nutrient.slug]) continue; // Skip unknown nutrients

      try {
        // Delete existing if force-upsert
        if (forceUpsert) {
          await db
            .delete(knowledgeFoodNutrients)
            .where(
              (t) =>
                eq(t.foodSlug, foodIdentity.slug) &&
                eq(t.nutrientSlug, nutrient.slug)
            );
        }

        await db.insert(knowledgeFoodNutrients).values({
          foodSlug: foodIdentity.slug,
          nutrientSlug: nutrient.slug,
          role: nutrient.role || null,
          confidence: nutrient.confidence || "emerging",
          // Quantitative values NOT imported (per v2.0-draft policy)
          isActive: true,
        } as any); // Use any to bypass Drizzle type issues with nullable fields
        result.inserted.nutrients++;
      } catch (error) {
        result.warnings.push(
          `Failed to insert nutrient ${nutrient.slug}: ${error instanceof Error ? error.message : "unknown error"}`
        );
      }
    }

    // Step 7: Insert benefits
    for (const benefit of benefits) {
      if (!benefitSlugs[benefit.slug]) continue; // Skip unknown benefits

      try {
        // Delete existing if force-upsert
        if (forceUpsert) {
          await db
            .delete(knowledgeFoodBenefits)
            .where(
              (t) =>
                eq(t.foodSlug, foodIdentity.slug) &&
                eq(t.benefitSlug, benefit.slug)
            );
        }

        await db.insert(knowledgeFoodBenefits).values({
          foodSlug: foodIdentity.slug,
          benefitSlug: benefit.slug,
          wording: benefit.wording || null,
          evidenceTone: benefit.evidenceTone || null,
          ranking: 0,
          // Evidence sources NOT imported (Phase 2 work)
          isActive: true,
        } as any); // Use any to bypass Drizzle type issues with nullable fields
        result.inserted.benefits++;
      } catch (error) {
        result.warnings.push(
          `Failed to insert benefit ${benefit.slug}: ${error instanceof Error ? error.message : "unknown error"}`
        );
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : String(error)
    );
    return result;
  }
}

/**
 * Extract food identity from v2.0-draft YAML
 */
function extractFoodIdentity(draft: any) {
  const identity = draft.identity || {};
  const record = draft.record || {};

  return {
    slug: record.canonical_slug || "",
    name: record.display_name || "",
    scientificName: record.scientific_or_source_name || null,
    category: mapFoodCategory(identity.food_category) || "other",
    description: draft.classification?.whole_food_status || null,
    aliases: identity.aliases || [],
    plantFamily: identity.plant_count_policy?.plant_family || null,
    countsToDiversity: identity.plant_count_policy?.counts_towards_plant_diversity ?? true,
    isActive: true,
  };
}

/**
 * Extract nutrients from v2.0-draft YAML
 */
function extractNutrients(draft: any) {
  const notable = draft.nutrition_profile?.notable_nutrients || [];
  return notable.map((n: any) => ({
    slug: normalizeSlug(n.nutrient || n.slug || ""),
    role: n.role || null,
    confidence: mapConfidence(n.confidence || "emerging"),
  }));
}

/**
 * Extract benefits from v2.0-draft YAML
 */
function extractBenefits(draft: any) {
  const benefitLanguage = draft.benefit_language || [];
  return benefitLanguage.map((b: any) => ({
    slug: normalizeSlug(b.area || b.slug || ""),
    wording: b.approved_wording || null,
    evidenceTone: b.evidence_tone || null,
  }));
}

/**
 * Map v2.0-draft food_category enum to existing category name
 */
function mapFoodCategory(draft_category: string | undefined): string {
  if (!draft_category) return "other";

  const mapping: Record<string, string> = {
    leafy_green_vegetable: "vegetable",
    cruciferous_vegetable: "vegetable",
    legume_pulse: "legume",
    whole_grain: "grain",
    fish_shellfish: "fish",
    meat_poultry: "meat",
    dairy: "dairy",
    egg: "protein",
    nut_seed: "nuts",
    fruit: "fruit",
    oil: "oil",
    fermented: "fermented",
    herb_spice: "herbs",
  };

  return mapping[draft_category] || draft_category;
}

/**
 * Map v2.0-draft confidence enum to existing confidence level
 */
function mapConfidence(draft_conf: string | undefined): string {
  if (!draft_conf) return "emerging";

  const mapping: Record<string, string> = {
    well_established: "established",
    well_established_with_absorption_context: "established",
    high_level_consensus: "established",
    moderate: "emerging",
    emerging: "emerging",
    established: "established",
    good: "good",
  };

  return mapping[draft_conf] || "emerging";
}

/**
 * Normalize slug: convert kebab-case to snake_case if needed
 */
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

/**
 * Resolve nutrient slugs: check which exist in knowledge_nutrients
 */
async function resolveNutrientSlugs(
  slugs: string[]
): Promise<Record<string, boolean>> {
  const unique = [...new Set(slugs)];
  const result: Record<string, boolean> = {};

  for (const slug of unique) {
    const exists = await db.query.knowledgeNutrients.findFirst({
      where: (t) => eq(t.slug, slug),
    });
    result[slug] = !!exists;
  }

  return result;
}

/**
 * Resolve benefit slugs: check which exist in knowledge_health_benefits
 */
async function resolveBenefitSlugs(
  slugs: string[]
): Promise<Record<string, boolean>> {
  const unique = [...new Set(slugs)];
  const result: Record<string, boolean> = {};

  for (const slug of unique) {
    const exists = await db.query.knowledgeHealthBenefits.findFirst({
      where: (t) => eq(t.slug, slug),
    });
    result[slug] = !!exists;
  }

  return result;
}
