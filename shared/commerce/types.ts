// BUS2A — the commercial vocabulary of The Healthy Apples.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 1 — one canonical identity per entity. A PlanId is NOT a new key
//     space: the three ids below are the three values `users.subscription_tier`
//     has always held, and the three `server/lib/access.ts` has always returned.
//     Introducing a fourth name for the same three things is exactly the defect
//     Principle 1 exists to prevent.
//   Principle 2 — one owner per fact. This module owns "what plans exist and
//     what they entitle". The `subscriptions` table owns "what a household
//     actually holds". Those are different facts at different scopes and
//     neither restates the other.
//   Principle 5 — a reference vocabulary beside the entity spine. No table, no
//     cache, no column, no clock.
//   Principle 6 — honest gaps over invented facts. See PRICING, below.
//
// PURE AND ZERO-I/O. Imported by client and server alike. It reads no database,
// no environment variable, no clock and no request. Everything time-dependent
// takes `now` as an argument.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE BOUNDARY THIS MODULE EXISTS TO DRAW
//
//   Billing Provider → Billing Events → Subscription Projection → Entitlements
//                                                                      ↓
//                                                              Product Access
//
// A payment provider (Stripe, later, under BUS2B) owns PAYMENT FACTS: whether a
// card was charged, whether an invoice settled, what a customer id is. THA owns
// the ENTITLEMENT PROJECTION: what a household may actually do in the product.
//
// These are deliberately not the same thing, and the direction of the arrow is
// the whole architecture. The provider's facts flow IN as events. Entitlements
// are DERIVED from them. Nothing downstream of the projection ever asks a
// payment provider a question, and no provider vocabulary — no `price_1abc`, no
// `sub_xyz`, no `incomplete_expired` — appears anywhere past the boundary.
//
// The reason is not tidiness. It is that a household's access to the product it
// depends on must not be an availability question about a third party's API. If
// Stripe is unreachable, the projection still answers, because the projection is
// THA's own data.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The plans a household can be on.
 *
 * These three values are the platform's existing tier vocabulary, unchanged:
 * `users.subscription_tier` stores them, `server/lib/access.ts` returns them,
 * `sanitizeUser.ts` exposes them, and the admin tier-change endpoint validates
 * against exactly this set. BUS2A adds no fourth plan and renames none of them.
 *
 * `friends_family` is a real plan and not a flag: it entitles like premium but
 * is never sold, has no price in any currency, and can only be granted by an
 * operator. Modelling it as a plan rather than as an override is what keeps the
 * entitlement projection a single rule — see PLAN_CATALOGUE.
 */
export const PLAN_IDS = ["free", "premium", "friends_family"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

/**
 * How often a paid plan bills.
 *
 * A period is a property of a PRICE, never of a plan: "premium" is one plan
 * available at two cadences, not two plans. Modelling it the other way is how
 * products end up with `premium_monthly` and `premium_annual` as separate
 * entitlement sources that can drift apart.
 */
export const BILLING_PERIODS = ["monthly", "annual"] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number];

/**
 * The lifecycle a subscription moves through.
 *
 * This is THA's vocabulary, not a provider's. It is deliberately SMALLER than
 * Stripe's: Stripe distinguishes `incomplete` from `incomplete_expired` because
 * it cares about payment-intent mechanics, and THA does not — from the
 * product's point of view a subscription that never activated is a subscription
 * that does not entitle, and one word covers it. BUS2B maps the provider's
 * vocabulary onto this one at the boundary and nowhere else.
 *
 *   trialing   — in a trial. ENTITLES. May or may not have a payment method.
 *   active     — paid and current. ENTITLES.
 *   past_due   — payment failed, still inside the retry window. ENTITLES,
 *                deliberately: see ENTITLING_STATUSES.
 *   cancelled  — cancellation requested, term not yet finished. ENTITLES until
 *                `currentPeriodEnd`. This is the state "cancel" produces; it is
 *                not the end of access.
 *   expired    — the term finished, whether by cancellation, by a failed
 *                recovery, or by a trial that was never converted. Does not
 *                entitle. TERMINAL.
 *   incomplete — never successfully started. Does not entitle. TERMINAL.
 */
export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "incomplete",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * The statuses that grant access.
 *
 * `past_due` is in this list ON PURPOSE, and it is the one entry that deserves
 * an argument rather than an assertion.
 *
 * A failed payment is very often a bank's fraud heuristic, an expired card, or
 * a house move — not a decision to leave. Cutting a household off from their
 * own meal plan, their own allergy records and their own shopping list at the
 * moment a card is declined punishes them for their bank's behaviour, and it
 * does it on the day they are most likely to be dealing with something else.
 *
 * The recovery window is bounded (see PAST_DUE_GRACE_DAYS) and it ends in
 * `expired` like anything else. THA is not choosing to be paid less; it is
 * choosing not to make a payment problem into a food problem.
 */
export const ENTITLING_STATUSES: readonly SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "cancelled",
] as const;

/**
 * How long a `past_due` subscription keeps entitling before it expires.
 *
 * A DURATION, NOT A DATE. Per THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 8.1 this is
 * an INSTANT consumer, not a CIVIL one — it needs no calendar, no time zone and
 * no household. Household Time is correctly NOT consumed here.
 */
export const PAST_DUE_GRACE_DAYS = 14;

/** The default length of a trial, in days. A duration, not a date — as above. */
export const DEFAULT_TRIAL_DAYS = 14;

/**
 * A price for one plan at one cadence.
 *
 * `amountMinorUnits` is in the currency's minor unit (pence for GBP) because
 * money in a floating-point number is a defect waiting for a rounding boundary.
 *
 * `providerPriceId` is the ONLY provider-shaped field in this entire module, it
 * is nullable, and it is nullable today for every price. BUS2B fills it. Until
 * it is filled, `isPublishable` is false and nothing may quote this price to a
 * household — see below.
 */
export interface PlanPrice {
  period: BillingPeriod;
  currency: "GBP";
  amountMinorUnits: number;
  /** Set by BUS2B. Null means "this price does not exist at any provider yet". */
  providerPriceId: string | null;
}

/**
 * A commercial claim THA is willing to make in its own voice.
 *
 * There is exactly one rule and it has no exceptions: a price, a saving, a
 * discount or a percentage may be shown to a household ONLY if it is computed
 * from configured, non-placeholder pricing. See `isPublishable`.
 *
 * This exists because BUS1 found the opposite already shipping. `TrialBanner.tsx`
 * offered "25% off your first 6 months" in a product with no subscription, no
 * price, no payment path and no six-month term — a discount off nothing, on a
 * platform whose own Core Principle 6 says trust is the product. BUS2A withdraws
 * it (see the implementation report) and this type is what stops the next one.
 */
export interface PlanDefinition {
  id: PlanId;
  /** The household-facing name. Never a tier code. */
  name: string;
  /** One honest sentence. No superlatives, no urgency, no scarcity. */
  summary: string;
  /** Empty for plans that are never sold (`free`, `friends_family`). */
  prices: readonly PlanPrice[];
  /** Whether a household can choose this plan themselves. */
  selfServe: boolean;
  /** Features this plan grants. */
  features: readonly FeatureKey[];
  /** Numeric ceilings. Absent key = no ceiling. */
  limits: Readonly<Partial<Record<LimitKey, number>>>;
}

/**
 * The closed vocabulary of gateable features.
 *
 * CLOSED ON PURPOSE. A feature gate that can be invented at a call site is a
 * feature gate nobody can enumerate, and "what does premium actually get you?"
 * becomes a question answerable only by grepping. Every key here is checkable
 * against the catalogue, and `npm run test:bus2a-commercial-foundation` fails if
 * a key is granted by no plan (dead gate) or by every plan (pointless gate).
 *
 * NOTHING SAFETY-RELATED MAY EVER APPEAR IN THIS LIST. Allergen warnings,
 * dietary-restriction enforcement, ingredient safety and every other protective
 * behaviour are unconditional and are not features. A household on the free
 * plan is exactly as safe as one paying. This is enforced by a test, not by
 * good intentions — see test-bus2a-commercial-foundation.ts.
 */
export const FEATURE_KEYS = [
  /** Importing a plan marked `isPremium`. LIVE today — server/routes.ts:7285. */
  "premium-meal-templates",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/**
 * The closed vocabulary of countable ceilings.
 *
 * A limit is a NUMBER a plan may cap, distinct from a feature, which a plan
 * either has or has not. They are separated because the enforcement differs:
 * a feature gate answers before the work starts, a limit answers by counting
 * what already exists.
 *
 * TWO OF THESE ARE ALREADY LIVE, AND THAT IS THE POINT OF LISTING THEM HERE.
 * `max-private-plan-templates` is enforced at `server/routes.ts:7192` from an
 * environment variable (`MAX_PRIVATE_TEMPLATES_FREE`, defaulting to 4), and
 * `max-shared-plans` is enforced at `server/routes.ts:7319` from the integer
 * literal `1`. Neither was written down anywhere a person could read, so
 * "what does the free plan actually limit?" was answerable only by grep, and
 * the free plan's own ceiling could be changed by an environment variable with
 * no review. BUS2A converges both onto this catalogue — that is a convergence
 * of existing behaviour, not a new restriction, and the numbers are unchanged.
 *
 * THE OTHER THREE ARE DEFINED BUT NOT ENFORCED, DELIBERATELY. Each has a
 * `TODO [PREMIUM]` comment sitting at its intended enforcement point in
 * `server/routes.ts` — :927, :3342 and :6109 — written by whoever first meant
 * to enforce them and never removed. BUS2A gives them a canonical definition
 * and a resolver but DOES NOT switch them on: taking away capability a
 * household already has is a commercial decision, not an engineering one, and
 * it is not BUS2A's to make. They are ABSENT from every plan in the catalogue,
 * which resolves as "no ceiling" — exactly today's behaviour.
 */
export const LIMIT_KEYS = [
  /** LIVE — server/routes.ts:7192. */
  "max-private-plan-templates",
  /** LIVE — server/routes.ts:7319. */
  "max-shared-plans",
  /** Defined, not enforced — server/routes.ts:927. */
  "max-saved-meals",
  /** Defined, not enforced — server/routes.ts:3342. */
  "max-product-analyses-per-month",
  /** Defined, not enforced — server/routes.ts:6109. */
  "max-planned-days-per-week",
] as const;

export type LimitKey = (typeof LIMIT_KEYS)[number];

/**
 * Where an entitlement decision came from.
 *
 * Carried on every resolved entitlement so that an operator looking at a
 * support ticket can answer "why does this household have this?" without
 * reasoning about precedence rules from memory.
 *
 *   subscription — an entitling row in `subscriptions` for this user.
 *   household    — an entitling row held by ANOTHER member of their household.
 *   legacy-tier  — `users.subscription_tier`, the pre-BUS2A owner. See
 *                  RESOLUTION ORDER in entitlements.ts; this source is what
 *                  BUS2B retires.
 *   default      — no source at all. The free plan.
 */
export const ENTITLEMENT_SOURCES = [
  "subscription",
  "household",
  "legacy-tier",
  "default",
] as const;

export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];
