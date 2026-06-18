// WS0 — Nutrition Knowledge Registry: retrieval helpers.
//
// READ-ONLY, ADDITIVE access layer over the knowledge_* tables. This is the
// single point through which other systems (Plant Diversity Tier B, Pantry
// Explore / Nutrition Knowledge Hub, Weekly Nutrition Report, Health Benefits,
// Simply Better Choices, Recommendation Stage 1) read editorial nutrition
// knowledge.
//
// IMPORTANT — intentional boundaries:
//   • This module is NOT wired into planner ranking, the restriction engine,
//     meal scoring or recommendation ranking. It only stores and retrieves.
//   • evidenceStrength on food↔benefit and nutrient↔benefit links is returned
//     for storage/internal use but MUST NOT be surfaced to users yet. Prefer
//     getFoodBenefitsForDisplay() / getNutrientBenefitsForDisplay(), which strip
//     the evidence signal before it can reach the UI.
import { db } from "../db";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  knowledgeFoods,
  knowledgeNutrients,
  knowledgeHealthBenefits,
  knowledgeFoodNutrients,
  knowledgeFoodBenefits,
  knowledgeNutrientBenefits,
  type KnowledgeFood,
  type KnowledgeNutrient,
  type KnowledgeHealthBenefit,
} from "@shared/schema";

// ── Entities ─────────────────────────────────────────────────────────────────

export async function listFoods(opts?: { category?: string; includeInactive?: boolean }): Promise<KnowledgeFood[]> {
  const where = [];
  if (!opts?.includeInactive) where.push(eq(knowledgeFoods.isActive, true));
  if (opts?.category) where.push(eq(knowledgeFoods.category, opts.category));
  return db
    .select()
    .from(knowledgeFoods)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(knowledgeFoods.displayOrder), asc(knowledgeFoods.name));
}

export async function getFoodBySlug(slug: string): Promise<KnowledgeFood | undefined> {
  const [row] = await db.select().from(knowledgeFoods).where(eq(knowledgeFoods.slug, slug)).limit(1);
  return row;
}

export async function listNutrients(opts?: { includeInactive?: boolean }): Promise<KnowledgeNutrient[]> {
  const where = opts?.includeInactive ? undefined : eq(knowledgeNutrients.isActive, true);
  return db.select().from(knowledgeNutrients).where(where).orderBy(asc(knowledgeNutrients.displayOrder), asc(knowledgeNutrients.name));
}

export async function getNutrientBySlug(slug: string): Promise<KnowledgeNutrient | undefined> {
  const [row] = await db.select().from(knowledgeNutrients).where(eq(knowledgeNutrients.slug, slug)).limit(1);
  return row;
}

export async function listHealthBenefits(opts?: { includeInactive?: boolean }): Promise<KnowledgeHealthBenefit[]> {
  const where = opts?.includeInactive ? undefined : eq(knowledgeHealthBenefits.isActive, true);
  return db.select().from(knowledgeHealthBenefits).where(where).orderBy(asc(knowledgeHealthBenefits.displayOrder), asc(knowledgeHealthBenefits.name));
}

export async function getHealthBenefitBySlug(slug: string): Promise<KnowledgeHealthBenefit | undefined> {
  const [row] = await db.select().from(knowledgeHealthBenefits).where(eq(knowledgeHealthBenefits.slug, slug)).limit(1);
  return row;
}

// ── Relationships ────────────────────────────────────────────────────────────

export interface FoodNutrientLink {
  nutrient: KnowledgeNutrient;
  amount: string | null;
  confidence: string;
  ranking: number;
  source: string;
}

/** Nutrients a food notably contributes, most prominent first. */
export async function getNutrientsForFood(foodSlug: string): Promise<FoodNutrientLink[]> {
  const links = await db
    .select()
    .from(knowledgeFoodNutrients)
    .where(and(eq(knowledgeFoodNutrients.foodSlug, foodSlug), eq(knowledgeFoodNutrients.isActive, true)))
    .orderBy(asc(knowledgeFoodNutrients.ranking));
  if (links.length === 0) return [];
  const nutrients = await listNutrients();
  const bySlug = new Map(nutrients.map((n) => [n.slug, n]));
  return links
    .map((l) => {
      const nutrient = bySlug.get(l.nutrientSlug);
      return nutrient ? { nutrient, amount: l.amount, confidence: l.confidence, ranking: l.ranking, source: l.source } : null;
    })
    .filter((x): x is FoodNutrientLink => x !== null);
}

export interface BenefitLink {
  benefit: KnowledgeHealthBenefit;
  ranking: number;
  source: string;
  /** Internal editorial signal — DO NOT show to users yet. */
  evidenceStrength: string;
}

/** Health benefits a food supports. Includes evidenceStrength (storage only). */
export async function getBenefitsForFood(foodSlug: string): Promise<BenefitLink[]> {
  const links = await db
    .select()
    .from(knowledgeFoodBenefits)
    .where(and(eq(knowledgeFoodBenefits.foodSlug, foodSlug), eq(knowledgeFoodBenefits.isActive, true)))
    .orderBy(asc(knowledgeFoodBenefits.ranking));
  return joinBenefits(links.map((l) => ({ benefitSlug: l.benefitSlug, ranking: l.ranking, source: l.source, evidenceStrength: l.evidenceStrength })));
}

/** Health benefits a nutrient supports. Includes evidenceStrength (storage only). */
export async function getBenefitsForNutrient(nutrientSlug: string): Promise<BenefitLink[]> {
  const links = await db
    .select()
    .from(knowledgeNutrientBenefits)
    .where(and(eq(knowledgeNutrientBenefits.nutrientSlug, nutrientSlug), eq(knowledgeNutrientBenefits.isActive, true)))
    .orderBy(asc(knowledgeNutrientBenefits.ranking));
  return joinBenefits(links.map((l) => ({ benefitSlug: l.benefitSlug, ranking: l.ranking, source: l.source, evidenceStrength: l.evidenceStrength })));
}

/** Reverse lookup: foods that notably contribute a nutrient, most prominent first. */
export async function getFoodsForNutrient(nutrientSlug: string): Promise<KnowledgeFood[]> {
  const links = await db
    .select()
    .from(knowledgeFoodNutrients)
    .where(and(eq(knowledgeFoodNutrients.nutrientSlug, nutrientSlug), eq(knowledgeFoodNutrients.isActive, true)))
    .orderBy(asc(knowledgeFoodNutrients.ranking));
  return foodsBySlugs(links.map((l) => l.foodSlug));
}

/** Reverse lookup: foods that support a health benefit. */
export async function getFoodsForBenefit(benefitSlug: string): Promise<KnowledgeFood[]> {
  const links = await db
    .select()
    .from(knowledgeFoodBenefits)
    .where(and(eq(knowledgeFoodBenefits.benefitSlug, benefitSlug), eq(knowledgeFoodBenefits.isActive, true)))
    .orderBy(asc(knowledgeFoodBenefits.ranking));
  return foodsBySlugs(links.map((l) => l.foodSlug));
}

// ── Display-safe helpers (evidence strength stripped) ──────────────────────────

export interface DisplayBenefit {
  benefit: KnowledgeHealthBenefit;
  ranking: number;
  source: string;
}

const stripEvidence = (links: BenefitLink[]): DisplayBenefit[] =>
  links.map(({ benefit, ranking, source }) => ({ benefit, ranking, source }));

/** Food → benefits with evidence strength removed. Safe to pass to the UI. */
export async function getFoodBenefitsForDisplay(foodSlug: string): Promise<DisplayBenefit[]> {
  return stripEvidence(await getBenefitsForFood(foodSlug));
}

/** Nutrient → benefits with evidence strength removed. Safe to pass to the UI. */
export async function getNutrientBenefitsForDisplay(nutrientSlug: string): Promise<DisplayBenefit[]> {
  return stripEvidence(await getBenefitsForNutrient(nutrientSlug));
}

// ── Internal join helpers ──────────────────────────────────────────────────────

async function joinBenefits(
  rows: Array<{ benefitSlug: string; ranking: number; source: string; evidenceStrength: string }>,
): Promise<BenefitLink[]> {
  if (rows.length === 0) return [];
  const benefits = await listHealthBenefits();
  const bySlug = new Map(benefits.map((b) => [b.slug, b]));
  return rows
    .map((r) => {
      const benefit = bySlug.get(r.benefitSlug);
      return benefit ? { benefit, ranking: r.ranking, source: r.source, evidenceStrength: r.evidenceStrength } : null;
    })
    .filter((x): x is BenefitLink => x !== null);
}

async function foodsBySlugs(slugs: string[]): Promise<KnowledgeFood[]> {
  if (slugs.length === 0) return [];
  const rows = await db
    .select()
    .from(knowledgeFoods)
    .where(and(inArray(knowledgeFoods.slug, slugs), eq(knowledgeFoods.isActive, true)));
  // Preserve the ranking order implied by the incoming slug list.
  const order = new Map(slugs.map((s, i) => [s, i]));
  return rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}
