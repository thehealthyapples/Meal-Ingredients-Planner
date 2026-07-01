/**
 * Templates Read Port (INT16)
 * ===========================
 * The NARROW, read-only delegation surface the Plan Templates capability handler is
 * allowed to call. Every method here is a 1:1 forward to an EXISTING owning-service
 * method — the Templates data owner (`server/storage.ts`, SoT D13: meal_templates +
 * meal_plan_templates + meal_plan_template_items tables). This port adds NO templates
 * business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) template reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWNER CORRECTION (per the canonical Capability Card, docs/architecture/capabilities/
 * templates.md): the capability registry's `owningService` string names
 * `server/template-migration.ts` — that file is a ONE-TIME BACKFILL SCRIPT
 * (`runTemplateMigration()`) with no read methods, not a live owner. The real owner is
 * `server/storage.ts`.
 *
 * TWO DISTINCT ENTITIES, BOTH CALLED "TEMPLATES": `meal_templates` (shell/component
 * templates for personal-plate meal composition — a small, fully public reference
 * table with no ownership column at all, per `server/routes.ts:5378-5396`) and
 * `meal_plan_templates` (full weekly plan templates, own-data + published-global, per
 * the Card). This port exposes both surfaces; the handler keeps their scopes distinct.
 *
 * GOVERNANCE: the Templates service (storage) remains the authoritative owner of all
 * template data and business rules (TIP1 Principles 2 & 7). This port only *reads*
 * what the owner exposes; it has NO write methods by construction (INT16 is
 * read-only).
 */

import type { MealTemplate, MealPlanTemplate, MealPlanTemplateItem } from "@shared/schema";

/** A published global or private plan template, with the owner's own item-count projection. */
export type PlanTemplateWithCount = MealPlanTemplate & { itemCount: number };

/** A plan template with its full ordered items (the owner's own detail shape). */
export type PlanTemplateWithItems = MealPlanTemplate & { items: MealPlanTemplateItem[] };

/**
 * The read-only owning-service surface. `getMealTemplate`/`getTemplateWithItems` are
 * NOT scoped by the owner — the handler applies the gate (see module doc and the
 * Card's CRITICAL FINDING on `GET /api/plan-templates/:id`).
 */
export interface TemplatesReadPort {
  /** Meal-shell templates owner — the full public reference list (no ownership column). */
  getMealTemplates(): Promise<MealTemplate[]>;
  /** Meal-shell templates owner — a single shell template by id, or undefined if none exists. */
  getMealTemplate(id: number): Promise<MealTemplate | undefined>;
  /** Plan templates owner — published global templates, optionally tier-filtered. */
  getPublishedGlobalTemplates(tier: string): Promise<PlanTemplateWithCount[]>;
  /** Plan templates owner — the caller's own private templates. */
  getUserPrivateTemplates(userId: number): Promise<PlanTemplateWithCount[]>;
  /** Plan templates owner — a single plan template + its items, by id. NOT ownership/publish-scoped. */
  getTemplateWithItems(id: string): Promise<PlanTemplateWithItems | undefined>;
  /** Plan templates owner — the single template flagged `isDefault`, with its items. */
  getDefaultTemplate(): Promise<PlanTemplateWithItems | undefined>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageTemplatesReadPort(): Promise<TemplatesReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getMealTemplates: () => storage.getMealTemplates(),
    getMealTemplate: (id) => storage.getMealTemplate(id),
    getPublishedGlobalTemplates: (tier) => storage.getPublishedGlobalTemplates(tier),
    getUserPrivateTemplates: (userId) => storage.getUserPrivateTemplates(userId),
    getTemplateWithItems: (id) => storage.getTemplateWithItems(id),
    getDefaultTemplate: () => storage.getDefaultTemplate(),
  };
}
