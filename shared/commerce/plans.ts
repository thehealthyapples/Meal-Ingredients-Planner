// BUS2A — the plan catalogue, and the rule that governs quoting a price.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. This module owns "what each plan grants".
//     Before BUS2A that fact had no owner at all: it was distributed across an
//     environment variable (MAX_PRIVATE_TEMPLATES_FREE), an integer literal in a
//     route handler, three unimplemented TODO comments, and two client
//     components that each re-derived the tier by hand.
//   Principle 6 — honest gaps over invented facts. See THE PRICING RULE.
//
// PURE AND ZERO-I/O. Imported by client and server alike. No env var is read
// here; configuration is INJECTED (see resolvePlanCatalogue).
//
// MUST NEVER CONSUME HOUSEHOLD TIME. Subscription/Trial is one of the five
// permanently-INSTANT domains (THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 8.1, HT10),
// and `server/verification/publication-register.ts` fails the build if
// `server/lib/access.ts` ever imports it. That verdict extends to this module by
// intent: a trial's length must never depend on where a family lives. Every
// duration here is a count of days, and every comparison takes an explicit
// `Date` — there is no `householdToday` in this domain and there never will be.

import type {
  BillingPeriod,
  FeatureKey,
  LimitKey,
  PlanDefinition,
  PlanId,
  PlanPrice,
} from "./types";
import { PLAN_IDS } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// THE PRICING RULE
//
// Every amount in this file is a PLACEHOLDER. Not one of them has been agreed,
// approved, or checked against a market, and no legal entity exists to charge
// them. They are here so the shape of the domain is real and testable, and for
// no other reason.
//
// So the rule is mechanical rather than cultural: a price is PUBLISHABLE only
// when it has been explicitly configured, and `isPublishable()` is the only
// thing permitted to answer that question. Nothing may render an amount, a
// saving, a percentage or a term to a household unless it says yes.
//
// This is not hypothetical caution. BUS1 found `TrialBanner.tsx` shipping
// "25% off your first 6 months" — off an unstated price, for a six-month term
// that does not exist, on a plan that cannot be bought, in a product whose own
// Terms of Service say in the same repository (terms-of-service.ts:181): "The
// Healthy Apples does not currently charge for anything, and does not process
// payments." One of those two statements was a lie to households, and the
// Terms were the true one.
//
// THE ANNUAL SAVING IS COMPUTED, NEVER TYPED. `annualSavingPercent()` derives
// it from the two configured amounts, so a saving can never be quoted that the
// prices do not actually produce. A hand-written "save 20%" beside prices that
// save 17% is the same defect as the banner, just quieter.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Placeholder amounts, in pence.
 *
 * Overridden by `resolvePlanCatalogue({ prices })` — which is how deployment
 * configuration reaches this pure module without it reading an environment.
 */
export const PLACEHOLDER_PRICES: Readonly<Record<BillingPeriod, number>> = {
  monthly: 499,
  annual: 4990,
};

/**
 * True when the caller has supplied real, approved pricing.
 *
 * FAILS CLOSED. The default catalogue is unconfigured, so the honest answer to
 * "may I show a household a price?" is NO everywhere until somebody decides
 * otherwise on purpose. A default of `true` would mean forgetting to configure
 * pricing shows placeholders to households as if they were real, which is the
 * failure mode this whole module exists to prevent.
 */
export interface PricingConfiguration {
  /** Set true ONLY when the amounts below are commercially approved. */
  configured: boolean;
  prices?: Partial<Record<BillingPeriod, number>>;
  /** Filled by BUS2B from the payment provider. */
  providerPriceIds?: Partial<Record<BillingPeriod, string>>;
}

export const UNCONFIGURED_PRICING: PricingConfiguration = { configured: false };

/**
 * What every plan grants.
 *
 * `free` is a real plan and not an absence. A household on it gets the whole of
 * THA's safety behaviour, the whole of its food knowledge, and the Companion —
 * because the Premium Experience Principles (THA_EXPERIENCE_ARCHITECTURE.md
 * § 17) define premium as "the perceptible result of care taken on the
 * household's behalf" and say explicitly that it is NOT exclusivity: it is the
 * quality every household receives, including the ones who pay nothing.
 *
 * What premium lifts is therefore volume and convenience — how many plans you
 * may keep, how many you may share — never whether THA tells you the truth
 * about your food.
 */
function buildPlan(
  id: PlanId,
  pricing: PricingConfiguration,
): PlanDefinition {
  const price = (period: BillingPeriod): PlanPrice => ({
    period,
    currency: "GBP",
    amountMinorUnits:
      pricing.prices?.[period] ?? PLACEHOLDER_PRICES[period],
    providerPriceId: pricing.providerPriceIds?.[period] ?? null,
  });

  switch (id) {
    case "free":
      return {
        id: "free",
        name: "The Healthy Apples",
        summary:
          "Everything THA knows about your food, and a plan for the week ahead.",
        prices: [],
        selfServe: true,
        features: [],
        // Both ceilings are TODAY'S live values, moved here from a route
        // handler and an environment variable. Nothing is tightened.
        limits: {
          "max-private-plan-templates": 4,
          "max-shared-plans": 1,
        },
      };

    case "premium":
      return {
        id: "premium",
        name: "The Healthy Apples Premium",
        summary: "Keep and share as many plans as your household needs.",
        prices: [price("monthly"), price("annual")],
        selfServe: true,
        features: ["premium-meal-templates"],
        limits: {},
      };

    case "friends_family":
      return {
        id: "friends_family",
        name: "Friends and Family",
        summary: "Premium, granted by The Healthy Apples. Never sold.",
        // Deliberately empty. This plan has no price in any currency and no
        // billing period; it is granted by an operator through the existing
        // admin endpoint and by no other path. Giving it a price of 0 would
        // make it look like a purchasable free tier and put it in front of
        // households in any surface that lists what can be bought.
        prices: [],
        selfServe: false,
        features: ["premium-meal-templates"],
        limits: {},
      };
  }
}

/**
 * The catalogue, resolved against a pricing configuration.
 *
 * Callers on the server pass configuration read from the environment at the
 * edge; the client receives the resolved catalogue over `/api/commerce/plans`.
 * Neither reaches into an environment from inside this module.
 */
export function resolvePlanCatalogue(
  pricing: PricingConfiguration = UNCONFIGURED_PRICING,
): Readonly<Record<PlanId, PlanDefinition>> {
  return Object.fromEntries(
    PLAN_IDS.map(id => [id, buildPlan(id, pricing)]),
  ) as Record<PlanId, PlanDefinition>;
}

/** The unconfigured catalogue — correct for every entitlement question. */
export const PLAN_CATALOGUE = resolvePlanCatalogue();

export function getPlan(
  id: PlanId,
  pricing?: PricingConfiguration,
): PlanDefinition {
  return pricing ? resolvePlanCatalogue(pricing)[id] : PLAN_CATALOGUE[id];
}

/**
 * THE ONE GATE ON QUOTING MONEY.
 *
 * A price may be shown to a household only if this returns true. It returns
 * false for the entire platform today, and it is meant to.
 */
export function isPublishable(pricing: PricingConfiguration): boolean {
  return pricing.configured === true;
}

/**
 * The annual saving, as a whole percentage, or null if it cannot be stated.
 *
 * Null when pricing is unconfigured, when either amount is missing, or when
 * annual is not actually cheaper — because in all three cases THA does not know
 * of a saving, and Core Principle 6 requires it to say nothing rather than
 * round something up into a claim.
 */
export function annualSavingPercent(
  pricing: PricingConfiguration,
): number | null {
  if (!isPublishable(pricing)) return null;

  const plan = getPlan("premium", pricing);
  const monthly = plan.prices.find(p => p.period === "monthly");
  const annual = plan.prices.find(p => p.period === "annual");
  if (!monthly || !annual) return null;

  const twelveMonths = monthly.amountMinorUnits * 12;
  if (twelveMonths <= 0 || annual.amountMinorUnits >= twelveMonths) return null;

  return Math.round(
    ((twelveMonths - annual.amountMinorUnits) / twelveMonths) * 100,
  );
}

/** Every plan that grants this feature. Used by the catalogue integrity test. */
export function plansGranting(feature: FeatureKey): PlanId[] {
  return PLAN_IDS.filter(id => PLAN_CATALOGUE[id].features.includes(feature));
}

/** A plan's ceiling for a limit, or null meaning "no ceiling". */
export function planLimit(id: PlanId, limit: LimitKey): number | null {
  return PLAN_CATALOGUE[id].limits[limit] ?? null;
}
