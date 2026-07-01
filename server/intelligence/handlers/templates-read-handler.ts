/**
 * Templates Read Handler (INT16 — tenth live capability binding)
 * ================================================================
 * The TENTH execution handler bound to the THA Intelligence Platform. It makes the
 * `templates` capability *executable* for READ-ONLY intents only, by delegating every
 * read to the existing Templates owner (storage) through a {@link TemplatesReadPort}.
 * It proves the reusable Port → Handler → Binding pattern (first established for the
 * Planner in INT2) against a tenth, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe — per the canonical Capability Card,
 * docs/architecture/capabilities/templates.md):
 *   • READ-ONLY, SIX SCOPES ONLY. Only the "read" verb executes, for `scope` in
 *     "meal-templates" / "meal-template" / "plan-templates" / "plan-templates-mine" /
 *     "plan-templates-default" / "plan-template". There is NO code path here for
 *     `explain` (no stored rationale on a template), `search` (no search-by-name/tag
 *     method exists anywhere in storage.ts), `recommend`/`generate`/`add`/`import`/
 *     `delete`/`share` (writes/generation), all of which remain in the templates
 *     allow-list but are out of scope for this read-only binding.
 *   • TWO DISTINCT ENTITIES. `meal_templates` (component/shell templates for the
 *     personal-plate composer) are fully PUBLIC, unauthenticated reference data — no
 *     ownership column exists on the table at all (`server/routes.ts:5378-5396`).
 *     `meal_plan_templates` (full weekly plan templates) are own-data + published-
 *     global, exactly per the Card. The two are never conflated in this handler.
 *   • TIER IS SERVER-RESOLVED, NEVER CLIENT-SUPPLIED. The live `/api/plan-templates/
 *     library` route derives `tier` from `hasPremiumAccess(user)` server-side
 *     (`server/routes.ts:7193`) — never from a request parameter. This handler mirrors
 *     that exactly via `context.premium`; accepting a `tier` intent parameter would let
 *     any caller request premium-tier templates without actually holding premium
 *     access, a privilege-escalation bug this binding does not introduce.
 *   • GATE REPLICATED, NOT DELEGATED, FOR SINGLE PLAN-TEMPLATE READS. Per the Card's
 *     CRITICAL FINDING, `GET /api/plan-templates/:id` (server/routes.ts:7522) has NO
 *     owner/published/admin check at all in the live route — it returns ANY template
 *     by id regardless of draft/owner status. This handler is STRICTER than that route:
 *     it only returns a plan template that is published-and-global, owned by the
 *     caller, or requested by an admin. This is a documented, narrow exception to
 *     "owner remains owner" (an ownership/auth gate, not domain business logic),
 *     permitted by INT7A's allowed-list, and a deliberately stricter posture than the
 *     existing under-gated human route.
 *   • NO SHARE-TOKEN EXPOSURE. `shareToken` is a join secret on `meal_plan_templates`
 *     (the sharing-link equivalent of household's `inviteCode`, INT13 precedent) — no
 *     result shape in this binding carries it.
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO templates business rule and NO synthesis of its own.
 *
 * The handler is built by {@link createTemplatesReadHandler} with a port provider, so
 * the production binding injects the real owning service and tests inject an
 * in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { TemplatesReadPort, PlanTemplateWithCount, PlanTemplateWithItems } from "./templates-read-port.js";
import { toInt, requireUserId, gap, denied, readOnlyVerbGuard } from "./_read-kit.js";
import type { MealTemplate, MealPlanTemplateItem } from "@shared/schema";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/** A meal-shell template as the read binding surfaces it — every stored field (fully public, no ownership column). */
export interface MealTemplateView {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly defaultCalories: number | null;
  readonly defaultProtein: number | null;
  readonly defaultCarbs: number | null;
  readonly defaultFat: number | null;
  readonly title: string | null;
  readonly cuisine: string | null;
  readonly sharedBaseComponents: readonly string[] | null;
  readonly proteinSlots: readonly string[] | null;
  readonly carbSlots: readonly string[] | null;
  readonly vegSlots: readonly string[] | null;
  readonly toppingSlots: readonly string[] | null;
  readonly sauceSlots: readonly string[] | null;
  readonly compatibleDiets: readonly string[] | null;
  readonly estimatedTotalTime: number | null;
  readonly estimatedExtraTimePerVariant: number | null;
  readonly costBand: string | null;
  readonly isActive: boolean;
  readonly primarySlot: string | null;
  readonly suitableSlots: readonly string[];
  readonly energyBand: string | null;
  readonly styleTags: readonly string[];
  readonly nutritionOpportunities: readonly string[];
}

/** A plan template's display-safe fields. NEVER includes `shareToken` (a join secret — INT13 `inviteCode` precedent). */
interface PlanTemplateFields {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isDefault: boolean;
  readonly isPremium: boolean;
  readonly ownerUserId: number | null;
  readonly season: string | null;
  readonly status: string;
  readonly createdBy: number | null;
  readonly publishedAt: Date | null;
  readonly visibility: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** A plan template summary — for the library/mine listing scopes. */
export interface PlanTemplateSummaryView extends PlanTemplateFields {
  readonly itemCount: number;
}

/** A single typed plan-template slot. */
export interface PlanTemplateItemView {
  readonly id: string;
  readonly templateId: string;
  readonly weekNumber: number;
  readonly dayOfWeek: number;
  readonly mealSlot: string;
  readonly mealId: number;
}

/** A plan template's full detail — for the default/by-id scopes. */
export interface PlanTemplateDetailView extends PlanTemplateFields {
  readonly items: readonly PlanTemplateItemView[];
}

export interface TemplatesMealTemplatesReadResult {
  readonly scope: "meal-templates";
  readonly templateCount: number;
  readonly templates: readonly MealTemplateView[];
  readonly source: "templates";
}

export interface TemplatesMealTemplateReadResult {
  readonly scope: "meal-template";
  readonly template: MealTemplateView;
  readonly source: "templates";
}

export interface TemplatesPlanLibraryReadResult {
  readonly scope: "plan-templates";
  readonly globalTemplates: readonly PlanTemplateSummaryView[];
  readonly myTemplates: readonly PlanTemplateSummaryView[];
  readonly source: "templates";
}

export interface TemplatesPlanMineReadResult {
  readonly scope: "plan-templates-mine";
  readonly templates: readonly PlanTemplateSummaryView[];
  readonly source: "templates";
}

export interface TemplatesPlanDefaultReadResult {
  readonly scope: "plan-templates-default";
  readonly template: PlanTemplateDetailView;
  readonly source: "templates";
}

export interface TemplatesPlanDetailReadResult {
  readonly scope: "plan-template";
  readonly template: PlanTemplateDetailView;
  readonly source: "templates";
}

export type TemplatesReadResult =
  | TemplatesMealTemplatesReadResult
  | TemplatesMealTemplateReadResult
  | TemplatesPlanLibraryReadResult
  | TemplatesPlanMineReadResult
  | TemplatesPlanDefaultReadResult
  | TemplatesPlanDetailReadResult;

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication, no shareToken)
// ---------------------------------------------------------------------------

function toMealTemplateView(t: MealTemplate): MealTemplateView {
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description ?? null,
    imageUrl: t.imageUrl ?? null,
    defaultCalories: t.defaultCalories ?? null,
    defaultProtein: t.defaultProtein ?? null,
    defaultCarbs: t.defaultCarbs ?? null,
    defaultFat: t.defaultFat ?? null,
    title: t.title ?? null,
    cuisine: t.cuisine ?? null,
    sharedBaseComponents: t.sharedBaseComponents ?? null,
    proteinSlots: t.proteinSlots ?? null,
    carbSlots: t.carbSlots ?? null,
    vegSlots: t.vegSlots ?? null,
    toppingSlots: t.toppingSlots ?? null,
    sauceSlots: t.sauceSlots ?? null,
    compatibleDiets: t.compatibleDiets ?? null,
    estimatedTotalTime: t.estimatedTotalTime ?? null,
    estimatedExtraTimePerVariant: t.estimatedExtraTimePerVariant ?? null,
    costBand: t.costBand ?? null,
    isActive: t.isActive,
    primarySlot: t.primarySlot ?? null,
    suitableSlots: t.suitableSlots,
    energyBand: t.energyBand ?? null,
    styleTags: t.styleTags,
    nutritionOpportunities: t.nutritionOpportunities,
  };
}

function toPlanTemplateFields(t: PlanTemplateWithCount | PlanTemplateWithItems): PlanTemplateFields {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    isDefault: t.isDefault,
    isPremium: t.isPremium,
    ownerUserId: t.ownerUserId ?? null,
    season: t.season ?? null,
    status: t.status,
    createdBy: t.createdBy ?? null,
    publishedAt: t.publishedAt ?? null,
    visibility: t.visibility,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function toPlanTemplateSummaryView(t: PlanTemplateWithCount): PlanTemplateSummaryView {
  return { ...toPlanTemplateFields(t), itemCount: t.itemCount };
}

function toPlanTemplateItemView(i: MealPlanTemplateItem): PlanTemplateItemView {
  return {
    id: i.id,
    templateId: i.templateId,
    weekNumber: i.weekNumber,
    dayOfWeek: i.dayOfWeek,
    mealSlot: i.mealSlot,
    mealId: i.mealId,
  };
}

function toPlanTemplateDetailView(t: PlanTemplateWithItems): PlanTemplateDetailView {
  return { ...toPlanTemplateFields(t), items: t.items.map(toPlanTemplateItemView) };
}

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

async function handleRead(
  intent: Intent,
  context: IntelligenceContext,
  port: TemplatesReadPort,
): Promise<TemplatesReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;

  if (scope === "meal-templates") {
    const templates = await port.getMealTemplates();
    return {
      scope: "meal-templates",
      templateCount: templates.length,
      templates: templates.map(toMealTemplateView),
      source: "templates",
    };
  }

  if (scope === "meal-template") {
    const id = toInt(params.mealTemplateId);
    if (id === undefined) {
      throw gap('Reading a meal-template detail requires a { mealTemplateId } parameter (a positive integer).');
    }
    const template = await port.getMealTemplate(id);
    if (!template) {
      throw gap(`No meal template found for id ${id}.`);
    }
    return { scope: "meal-template", template: toMealTemplateView(template), source: "templates" };
  }

  if (scope === "plan-templates") {
    // Mirrors server/routes.ts:7190-7202 — auth is hard-required and tier is
    // SERVER-RESOLVED from the caller's own premium status, never a request parameter.
    const userId = requireUserId(context, "Templates");
    const tier = context.premium ? "premium" : "free";
    const [globalTemplates, myTemplates] = await Promise.all([
      port.getPublishedGlobalTemplates(tier),
      port.getUserPrivateTemplates(userId),
    ]);
    return {
      scope: "plan-templates",
      globalTemplates: globalTemplates.map(toPlanTemplateSummaryView),
      myTemplates: myTemplates.map(toPlanTemplateSummaryView),
      source: "templates",
    };
  }

  if (scope === "plan-templates-mine") {
    const userId = requireUserId(context, "Templates");
    const templates = await port.getUserPrivateTemplates(userId);
    return {
      scope: "plan-templates-mine",
      templates: templates.map(toPlanTemplateSummaryView),
      source: "templates",
    };
  }

  if (scope === "plan-templates-default") {
    const template = await port.getDefaultTemplate();
    if (!template) {
      throw gap("No default plan template is currently set.");
    }
    return { scope: "plan-templates-default", template: toPlanTemplateDetailView(template), source: "templates" };
  }

  if (scope === "plan-template") {
    const id = params.planTemplateId;
    if (typeof id !== "string" || id.length === 0) {
      throw gap('Reading a plan-template detail requires a { planTemplateId } parameter (a non-empty string id).');
    }
    const template = await port.getTemplateWithItems(id);
    if (!template) {
      throw gap(`No plan template found for id ${id}.`);
    }

    // STRICTER than server/routes.ts:7522 (which has no gate at all — the Card's
    // CRITICAL FINDING): only a published-global template, the caller's own template,
    // or an admin request may see this template's content.
    const callerId = toInt(context.userId);
    const isPublishedGlobal = template.ownerUserId === null && template.status === "published";
    const isOwnTemplate = callerId !== undefined && template.ownerUserId === callerId;
    const isAdminCaller = context.role === "admin";
    if (!isPublishedGlobal && !isOwnTemplate && !isAdminCaller) {
      throw denied(
        "Plan template not accessible. The Intelligence Platform only surfaces a draft or " +
          "private plan template to its owner or an admin — stricter than the existing human route.",
      );
    }

    return { scope: "plan-template", template: toPlanTemplateDetailView(template), source: "templates" };
  }

  throw gap(
    `Unsupported templates read scope ${JSON.stringify(scope)}. Supported scopes: "meal-templates", ` +
      '"meal-template", "plan-templates", "plan-templates-mine", "plan-templates-default", "plan-template".',
  );
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the templates read-only handler. `resolvePort` provides the owning-service
 * surface (production: real storage; tests: in-memory owner). The returned handler is
 * what the Capability Registry binds to the `templates` capability (INT16).
 */
export function createTemplatesReadHandler(
  resolvePort: () => Promise<TemplatesReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" executes. "explain" (no stored rationale),
    // "search" (no search method exists on the owner), "recommend"/"generate"/"add"/
    // "import"/"delete"/"share" (writes/generation) are all in the templates
    // allow-list but all out of scope for this read-only binding.
    readOnlyVerbGuard(intent, ["read"], "Templates");

    const port = await resolvePort();

    // No blanket requireUserId here: unlike most prior bindings, Templates blends
    // public reference data (meal-templates, plan-templates-default, and a
    // published-global plan-template) with own-data scopes (plan-templates,
    // plan-templates-mine, and a private plan-template). Each scope above resolves
    // its own auth requirement, mirroring the live routes' per-endpoint auth gates.
    return handleRead(intent, context, port);
  };
}
