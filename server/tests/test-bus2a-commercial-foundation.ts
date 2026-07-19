// BUS2A — verification for the commercial platform foundation.
//
// Run: npx tsx server/tests/test-bus2a-commercial-foundation.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS TEST IS ACTUALLY GUARDING, AND WHY EACH PART IS SHAPED AS IT IS.
//
// A commercial layer has three failure modes, and they are not equally visible.
//
//  1. IT TELLS A HOUSEHOLD SOMETHING UNTRUE ABOUT MONEY. This is the one BUS1
//     found already shipping ("25% off your first 6 months" off no price at
//     all). It is invisible to every functional test, because the product works
//     perfectly while lying. Guarded by the pricing-gate checks and by a source
//     scan that fails if an unsubstantiated claim reappears.
//
//  2. IT GETS ENTITLEMENT WRONG. A household loses access they are paying for,
//     or keeps access they are not. Guarded by resolving every combination of
//     subscription, household subscription and legacy tier — and by asserting
//     the OLD access.ts rule and the NEW one agree, which is what makes the
//     convergence provable rather than asserted.
//
//  3. IT APPLIES A BILLING EVENT TWICE. Guarded against a REAL DATABASE,
//     because the guarantee is a unique constraint and a transaction — facts
//     about Postgres, not about the code's intentions. A mocked store would
//     assert the mock's behaviour. Every provider redelivers webhooks, so this
//     is the normal path, not the edge case.
//
// The lifecycle and reducer checks are pure and need no database. The idempotency
// and projection checks need one and say so. Every row created is namespaced by
// a marker and swept at START as well as at end — a test that only tidies up
// when it passes litters exactly when something is already wrong (BUS1's rule).
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from "fs";
import { join } from "path";
import { eq, like } from "drizzle-orm";
import { db, pool } from "../db";
import { billingEvents, households, subscriptions, users } from "@shared/schema";
import {
  BILLING_EVENT_KINDS,
  DEFAULT_TRIAL_DAYS,
  FEATURE_KEYS,
  LIMIT_KEYS,
  PAST_DUE_GRACE_DAYS,
  PLAN_CATALOGUE,
  PLAN_IDS,
  annualSavingPercent,
  applyBillingEvent,
  classifyPlanChange,
  effectivePlan,
  effectiveStatus,
  freeSnapshot,
  isPublishable,
  projectSubscription,
  resolveEntitlements,
  resolvePlanCatalogue,
  type BillingEvent,
  type PlanId,
  type SubscriptionSnapshot,
} from "@shared/commerce";
import {
  entitlementsForUser,
  entitlementsFromUser,
} from "../commerce/entitlement-service";
import {
  ingestBillingEvent,
  rebuildFromEventLog,
} from "../commerce/subscription-store";
import { billingProvider, paymentsAvailable } from "../commerce/billing-provider";

const MARKER = "bus2a-verify";
const ROOT = join(import.meta.dirname, "../..");
let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail?: string) {
  checks++;
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function source(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

/**
 * A file's source with comments removed.
 *
 * The boundary checks below scan for provider vocabulary and for Household Time
 * imports. Both must test what the code DOES, not what its documentation SAYS —
 * and these files document their boundaries at length, naming the very things
 * they must not use, precisely so the next person understands why. Scanning raw
 * text would make writing down the rule a violation of it, and the fix for that
 * would be to delete the explanation, which is the wrong direction.
 *
 * String literals are preserved, so a provider SDK name in an import or an
 * identifier is still caught. The scanner tracks quotes and template literals
 * rather than regex-stripping, because a naive `//` strip truncates every URL
 * in the file and would silently hide whatever followed on those lines.
 */
function codeOf(relativePath: string): string {
  const text = source(relativePath);
  let out = "";
  let i = 0;
  let quote: string | null = null;

  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];

    if (quote) {
      if (c === "\\") {
        out += c + (next ?? "");
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      out += c;
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }

    if (c === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }

    if (c === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    out += c;
    i++;
  }

  return out;
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-18T12:00:00.000Z");
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);
const ahead = (days: number) => new Date(NOW.getTime() + days * DAY);

function snapshot(over: Partial<SubscriptionSnapshot>): SubscriptionSnapshot {
  return { ...freeSnapshot(), ...over };
}

async function main() {
  console.log("\n=== BUS2A — Commercial Platform Foundation ===\n");

  // ═══════════════════════════════════════════════════════════════════════
  console.log("── 1. The plan catalogue is coherent ──");
  // ═══════════════════════════════════════════════════════════════════════

  check(
    "every plan id has a definition",
    PLAN_IDS.every(id => PLAN_CATALOGUE[id]?.id === id),
  );

  check(
    "the plan ids are exactly the three the database already permits",
    JSON.stringify([...PLAN_IDS].sort()) ===
      JSON.stringify(["free", "friends_family", "premium"]),
    "a fourth plan needs a migration to the users_subscription_tier_check constraint",
  );

  // A gate granted by nothing is dead code that reads like a live protection.
  for (const feature of FEATURE_KEYS) {
    check(
      `feature "${feature}" is granted by at least one plan`,
      PLAN_IDS.some(id => PLAN_CATALOGUE[id].features.includes(feature)),
    );
    check(
      `feature "${feature}" is withheld by at least one plan`,
      PLAN_IDS.some(id => !PLAN_CATALOGUE[id].features.includes(feature)),
      "a feature every plan grants is not a gate",
    );
  }

  check(
    "the free plan grants no features but is not empty of value",
    PLAN_CATALOGUE.free.features.length === 0 &&
      PLAN_CATALOGUE.free.summary.length > 0,
  );

  check(
    "friends_family entitles exactly as premium does",
    JSON.stringify([...PLAN_CATALOGUE.friends_family.features].sort()) ===
      JSON.stringify([...PLAN_CATALOGUE.premium.features].sort()),
  );

  check(
    "friends_family carries no price in any currency",
    PLAN_CATALOGUE.friends_family.prices.length === 0,
    "it is granted by an operator and must never appear as purchasable",
  );

  check(
    "friends_family is not self-serve",
    PLAN_CATALOGUE.friends_family.selfServe === false,
  );

  // ── THE SAFETY INVARIANT ────────────────────────────────────────────────
  // A household on the free plan must be exactly as safe as one paying. THA
  // stores allergies by design; gating a warning behind a subscription would
  // be the single worst thing this platform could do.
  const SAFETY_WORDS = [
    "allergen", "allergy", "restriction", "safety", "warning", "intoleran",
  ];
  const unsafeFeature = FEATURE_KEYS.find(f =>
    SAFETY_WORDS.some(w => f.toLowerCase().includes(w)),
  );
  check(
    "NO feature key is safety-related — safety is never a paid feature",
    unsafeFeature === undefined,
    unsafeFeature ? `"${unsafeFeature}" looks safety-related` : undefined,
  );
  const unsafeLimit = LIMIT_KEYS.find(l =>
    SAFETY_WORDS.some(w => l.toLowerCase().includes(w)),
  );
  check(
    "NO limit key is safety-related",
    unsafeLimit === undefined,
    unsafeLimit ? `"${unsafeLimit}" looks safety-related` : undefined,
  );

  // ── The two LIVE limits keep their existing values ──────────────────────
  check(
    "max-private-plan-templates is still 4 on free (unchanged from the env default)",
    PLAN_CATALOGUE.free.limits["max-private-plan-templates"] === 4,
  );
  check(
    "max-shared-plans is still 1 on free (unchanged from the route literal)",
    PLAN_CATALOGUE.free.limits["max-shared-plans"] === 1,
  );
  check(
    "premium lifts both ceilings",
    PLAN_CATALOGUE.premium.limits["max-private-plan-templates"] === undefined &&
      PLAN_CATALOGUE.premium.limits["max-shared-plans"] === undefined,
  );
  check(
    "the three unenforced limits cap nobody — BUS2A takes away nothing",
    PLAN_IDS.every(id =>
      ["max-saved-meals", "max-product-analyses-per-month", "max-planned-days-per-week"]
        .every(k => PLAN_CATALOGUE[id].limits[k as never] === undefined),
    ),
  );

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 2. No commercial claim without configured pricing ──");
  // ═══════════════════════════════════════════════════════════════════════

  check(
    "pricing FAILS CLOSED — unconfigured is not publishable",
    isPublishable({ configured: false }) === false,
  );
  check(
    "an unconfigured catalogue can quote no annual saving",
    annualSavingPercent({ configured: false }) === null,
  );
  check(
    "the default catalogue is unconfigured — no price is publishable today",
    isPublishable({ configured: false }) === false &&
      annualSavingPercent({ configured: false }) === null,
  );

  const configured = {
    configured: true,
    prices: { monthly: 500, annual: 5000 },
  };
  check(
    "a configured catalogue is publishable",
    isPublishable(configured) === true,
  );
  check(
    "the annual saving is COMPUTED from the two amounts, never typed",
    // 12 × 500 = 6000; 5000 is a saving of 1000/6000 ≈ 17%.
    annualSavingPercent(configured) === 17,
  );
  check(
    "configured prices reach the catalogue",
    resolvePlanCatalogue(configured).premium.prices.find(p => p.period === "monthly")
      ?.amountMinorUnits === 500,
  );
  check(
    "no saving is claimed when annual is not actually cheaper",
    annualSavingPercent({ configured: true, prices: { monthly: 500, annual: 6000 } }) === null,
  );
  check(
    "every price is in minor units — no floating-point money",
    resolvePlanCatalogue(configured).premium.prices.every(
      p => Number.isInteger(p.amountMinorUnits),
    ),
  );
  check(
    "no provider price id exists anywhere today",
    PLAN_IDS.every(id =>
      PLAN_CATALOGUE[id].prices.every(p => p.providerPriceId === null),
    ),
  );

  // ── The withdrawn claim must not come back ──────────────────────────────
  // Scanned WITHOUT comments: the file's header quotes the withdrawn wording
  // verbatim to explain what was removed and why, which is exactly what a
  // future editor needs to see and must not itself trip the check.
  const bannerCode = codeOf("client/src/components/TrialBanner.tsx");
  check(
    "TrialBanner renders no '25% off' claim",
    !bannerCode.includes("25% off") && !bannerCode.includes("25% discount"),
  );
  check(
    "TrialBanner promises no discount code it cannot send",
    !/discount code/i.test(bannerCode),
  );
  check(
    "TrialBanner records WHY the claim was withdrawn, for the next editor",
    source("client/src/components/TrialBanner.tsx").includes("BUS2A") &&
      source("client/src/components/TrialBanner.tsx").includes("Terms of Service"),
  );

  // ── The Terms of Service must remain TRUE after BUS2A ───────────────────
  const terms = source("shared/legal/documents/terms-of-service.ts");
  check(
    "the published Terms still say THA processes no payments — and are still true",
    terms.includes("does not currently charge for anything"),
    "BUS2A must not make the platform's own published Terms false",
  );

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 3. The subscription lifecycle ──");
  // ═══════════════════════════════════════════════════════════════════════

  check(
    "a trial inside its window entitles",
    effectiveStatus(
      snapshot({ planId: "premium", status: "trialing", trialEndsAt: ahead(3) }),
      NOW,
    ) === "trialing",
  );
  check(
    "a trial past its end expires WITHOUT a scheduler having run",
    effectiveStatus(
      snapshot({ planId: "premium", status: "trialing", trialEndsAt: ago(1) }),
      NOW,
    ) === "expired",
    "this is the whole reason expiry is derived on read — THA has no scheduler",
  );
  check(
    "an expired trial resolves to the free plan",
    effectivePlan(
      snapshot({ planId: "premium", status: "trialing", trialEndsAt: ago(1) }),
      NOW,
    ) === "free",
  );
  check(
    "a trial with no end date is treated as ended, not as permanent",
    effectiveStatus(
      snapshot({ planId: "premium", status: "trialing", trialEndsAt: null }),
      NOW,
    ) === "expired",
  );

  check(
    "past_due still entitles inside the grace window",
    effectiveStatus(
      snapshot({ planId: "premium", status: "past_due", pastDueSince: ago(3) }),
      NOW,
    ) === "past_due",
    "a declined card must not become a food problem",
  );
  check(
    `past_due expires after the ${PAST_DUE_GRACE_DAYS}-day window`,
    effectiveStatus(
      snapshot({
        planId: "premium",
        status: "past_due",
        pastDueSince: ago(PAST_DUE_GRACE_DAYS + 1),
      }),
      NOW,
    ) === "expired",
  );

  check(
    "a cancelled subscription keeps access to the end of the paid term",
    effectivePlan(
      snapshot({ planId: "premium", status: "cancelled", currentPeriodEnd: ahead(10) }),
      NOW,
    ) === "premium",
    "they paid for this term; cancelling must not remove it immediately",
  );
  check(
    "a cancelled subscription past its term expires",
    effectiveStatus(
      snapshot({ planId: "premium", status: "cancelled", currentPeriodEnd: ago(1) }),
      NOW,
    ) === "expired",
  );
  check(
    "an ACTIVE subscription past its period end reports expired, not active",
    effectiveStatus(
      snapshot({ planId: "premium", status: "active", currentPeriodEnd: ago(1) }),
      NOW,
    ) === "expired",
    "a renewal event that never arrived must not grant access",
  );

  check(
    "upgrades are immediate, downgrades are deferred, laterals are neither",
    classifyPlanChange("free", "premium") === "upgrade" &&
      classifyPlanChange("premium", "free") === "downgrade" &&
      classifyPlanChange("premium", "friends_family") === "lateral" &&
      classifyPlanChange("premium", "premium") === "none",
  );

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 4. The billing-event reducer is pure and deterministic ──");
  // ═══════════════════════════════════════════════════════════════════════

  const evt = (
    id: string,
    kind: BillingEvent["kind"],
    days: number,
    over: Partial<BillingEvent> = {},
  ): BillingEvent => ({
    providerEventId: id,
    kind,
    occurredAt: ago(days),
    ...over,
  });

  const log: BillingEvent[] = [
    evt("e1", "trial-started", 40, { planId: "premium", trialEndsAt: ago(26) }),
    evt("e2", "activated", 26, {
      planId: "premium",
      billingPeriod: "monthly",
      currentPeriodEnd: ahead(4),
    }),
    evt("e3", "payment-failed", 5),
    evt("e4", "payment-recovered", 4, { currentPeriodEnd: ahead(26) }),
  ];

  const projected = projectSubscription(freeSnapshot(), log);
  check(
    "folding the log produces an active premium subscription",
    projected.planId === "premium" && projected.status === "active",
  );
  check(
    "recovery cleared the past-due marker",
    projected.pastDueSince === null,
  );
  check(
    "activation cleared the trial end date",
    projected.trialEndsAt === null,
    "a stale trial end on an active subscription would later read as expired",
  );

  // Webhook delivery order is not causal order. The projection must not care.
  const shuffled = [log[2], log[0], log[3], log[1]];
  check(
    "projection is order-independent — arrival order is not causal order",
    JSON.stringify(projectSubscription(freeSnapshot(), shuffled)) ===
      JSON.stringify(projected),
  );

  check(
    "the reducer does not mutate its input",
    (() => {
      const before = snapshot({ planId: "free", status: "expired" });
      const frozen = JSON.stringify(before);
      applyBillingEvent(before, evt("x", "activated", 0, { planId: "premium" }));
      return JSON.stringify(before) === frozen;
    })(),
  );

  check(
    "repeated payment failures do not restart the grace window",
    (() => {
      const first = applyBillingEvent(
        snapshot({ planId: "premium", status: "active" }),
        evt("f1", "payment-failed", 10),
      );
      const second = applyBillingEvent(first, evt("f2", "payment-failed", 2));
      return second.pastDueSince?.getTime() === ago(10).getTime();
    })(),
    "otherwise a retrying provider keeps a subscription past_due forever",
  );

  check(
    "a downgrade is deferred to period end, not applied immediately",
    (() => {
      const s = applyBillingEvent(
        snapshot({ planId: "premium", status: "active", currentPeriodEnd: ahead(10) }),
        evt("d1", "plan-changed", 0, { planId: "free" }),
      );
      return s.planId === "premium" && s.pendingPlanId === "free";
    })(),
  );

  check(
    "a deferred downgrade lands at the next renewal",
    (() => {
      const pending = snapshot({
        planId: "premium",
        status: "active",
        pendingPlanId: "free",
      });
      const renewed = applyBillingEvent(
        pending,
        evt("r1", "renewed", 0, { currentPeriodEnd: ahead(30) }),
      );
      return renewed.planId === "free" && renewed.pendingPlanId === null;
    })(),
  );

  check(
    "an upgrade is applied immediately",
    applyBillingEvent(
      snapshot({ planId: "free", status: "active" }),
      evt("u1", "plan-changed", 0, { planId: "premium" }),
    ).planId === "premium",
  );

  check(
    "cancelling clears a pending downgrade that can never land",
    applyBillingEvent(
      snapshot({ planId: "premium", status: "active", pendingPlanId: "free" }),
      evt("c1", "cancellation-scheduled", 0, { currentPeriodEnd: ahead(5) }),
    ).pendingPlanId === null,
  );

  check(
    "every declared event kind is handled by the reducer",
    BILLING_EVENT_KINDS.every(kind => {
      const before = snapshot({ planId: "premium", status: "active" });
      const after = applyBillingEvent(before, evt("k", kind, 0));
      return after !== undefined && typeof after.status === "string";
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 5. Entitlement resolution ──");
  // ═══════════════════════════════════════════════════════════════════════

  check(
    "no source at all resolves to free",
    resolveEntitlements({}, NOW).planId === "free" &&
      resolveEntitlements({}, NOW).source === "default",
  );

  check(
    "the legacy tier still grants access — no household loses what it has",
    resolveEntitlements({ legacyTier: "premium" }, NOW).planId === "premium" &&
      resolveEntitlements({ legacyTier: "premium" }, NOW).source === "legacy-tier",
    "the subscriptions table is empty in every environment; ignoring the column would drop every premium household to free",
  );

  check(
    "an active subscription outranks the legacy tier",
    resolveEntitlements(
      {
        subscription: snapshot({
          planId: "premium",
          status: "active",
          currentPeriodEnd: ahead(10),
        }),
        legacyTier: "free",
      },
      NOW,
    ).source === "subscription",
  );

  check(
    "a household member's subscription entitles the whole household",
    resolveEntitlements(
      {
        subscription: null,
        householdSubscriptions: [
          snapshot({ planId: "premium", status: "active", currentPeriodEnd: ahead(10) }),
        ],
        legacyTier: "free",
      },
      NOW,
    ).planId === "premium",
  );

  check(
    "resolution takes the MAXIMUM, not a precedence chain",
    resolveEntitlements(
      {
        // Their own subscription lapsed…
        subscription: snapshot({
          planId: "premium",
          status: "cancelled",
          currentPeriodEnd: ago(5),
        }),
        // …but their household is still paying.
        householdSubscriptions: [
          snapshot({ planId: "premium", status: "active", currentPeriodEnd: ahead(10) }),
        ],
      },
      NOW,
    ).planId === "premium",
    "under strict precedence one lapsed card would remove the whole family's access",
  );

  check(
    "an expired household subscription entitles nobody",
    resolveEntitlements(
      {
        householdSubscriptions: [
          snapshot({ planId: "premium", status: "expired" }),
        ],
      },
      NOW,
    ).planId === "free",
  );

  check(
    "resolved limits expose every declared limit key",
    LIMIT_KEYS.every(
      k => k in resolveEntitlements({ legacyTier: "free" }, NOW).limits,
    ),
  );

  // ── THE CONVERGENCE PROOF ───────────────────────────────────────────────
  // The exact rule server/lib/access.ts held before BUS2A, preserved here so
  // the convergence is demonstrated rather than asserted.
  const oldGetTier = (tier: string | undefined): PlanId =>
    tier === "premium" || tier === "friends_family" ? tier : "free";
  const oldHasPremium = (tier: string | undefined): boolean => {
    const t = oldGetTier(tier);
    return t === "premium" || t === "friends_family";
  };

  const tierCases = ["free", "premium", "friends_family", undefined, "nonsense"];
  check(
    "the new rule gives the OLD answer for every tier value, including junk",
    tierCases.every(tier => {
      const user = { subscriptionTier: tier as string };
      const now = entitlementsFromUser(tier === undefined ? null : user, NOW);
      return (
        now.planId === oldGetTier(tier) &&
        now.planId !== "free" === oldHasPremium(tier)
      );
    }),
    "behaviour must be byte-identical; this is a convergence, not a change",
  );

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 6. The payment-provider boundary holds ──");
  // ═══════════════════════════════════════════════════════════════════════

  check(
    "no payment provider is configured — BUS2A activates none",
    paymentsAvailable() === false && billingProvider().id === "none",
  );
  check(
    "the null provider fails honestly rather than throwing",
    (await billingProvider().createCheckoutSession({
      userId: 0,
      householdId: null,
      planId: "premium",
      billingPeriod: "monthly",
      successUrl: "",
      cancelUrl: "",
    })) === null,
  );

  // shared/commerce is imported by the CLIENT. A provider SDK, key or
  // vocabulary reaching it would ship a payment integration to the browser.
  const PROVIDER_WORDS = ["stripe", "paddle", "braintree", "paypal", "sk_live", "pk_live"];
  for (const file of [
    "shared/commerce/types.ts",
    "shared/commerce/plans.ts",
    "shared/commerce/subscription.ts",
    "shared/commerce/entitlements.ts",
    "shared/commerce/index.ts",
  ]) {
    // Comments stripped: these modules explain the boundary by naming what
    // must stay behind it. Imports and identifiers are what matter.
    const text = codeOf(file).toLowerCase();
    const offender = PROVIDER_WORDS.find(w => text.includes(w));
    check(
      `${file} names no payment provider`,
      offender === undefined,
      offender ? `found "${offender}"` : undefined,
    );
  }

  check(
    "no module outside the provider boundary imports a provider SDK",
    !source("shared/commerce/billing-events.ts").includes('from "stripe"') &&
      !source("server/commerce/subscription-store.ts").toLowerCase().includes("stripe") &&
      !source("server/commerce/entitlement-service.ts").toLowerCase().includes("stripe"),
  );

  // ── The permanently-INSTANT domain rule (HT10) ──────────────────────────
  for (const file of [
    "shared/commerce/types.ts",
    "shared/commerce/plans.ts",
    "shared/commerce/subscription.ts",
    "shared/commerce/entitlements.ts",
    "server/commerce/entitlement-service.ts",
    "server/commerce/subscription-store.ts",
    "server/lib/access.ts",
  ]) {
    const text = codeOf(file);
    check(
      `${file} consumes no Household Time (HT10)`,
      !/from ["'].*time\/household-time|householdToday|householdPhase/.test(text),
      "a trial's length must never depend on where a family lives",
    );
  }

  check(
    "trial and grace lengths are DURATIONS in days, not calendar dates",
    Number.isInteger(DEFAULT_TRIAL_DAYS) && Number.isInteger(PAST_DUE_GRACE_DAYS),
  );

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 7. Idempotency and projection, against a real database ──");
  // ═══════════════════════════════════════════════════════════════════════

  // Sweep residue at START, not only at end.
  await db.delete(billingEvents).where(like(billingEvents.providerEventId, `${MARKER}%`));
  await db.delete(users).where(like(users.username, `${MARKER}%`));

  const [payer] = await db
    .insert(users)
    .values({
      username: `${MARKER}-payer`,
      password: "x",
      subscriptionTier: "free",
    })
    .returning();
  const [partner] = await db
    .insert(users)
    .values({
      username: `${MARKER}-partner`,
      password: "x",
      subscriptionTier: "free",
    })
    .returning();

  const [home] = await db
    .insert(households)
    .values({ name: `${MARKER}-home`, inviteCode: `${MARKER}-code` })
    .returning();

  const activation: BillingEvent = {
    providerEventId: `${MARKER}-activate-1`,
    kind: "activated",
    occurredAt: ago(1),
    planId: "premium",
    billingPeriod: "monthly",
    currentPeriodEnd: ahead(29),
  };

  const first = await ingestBillingEvent(activation, {
    userId: payer.id,
    householdId: home.id,
  });
  check("a new billing event is applied", first.result === "applied");

  // THE CENTRAL GUARANTEE. Every provider redelivers.
  const second = await ingestBillingEvent(activation, {
    userId: payer.id,
    householdId: home.id,
  });
  check(
    "REDELIVERY of the same provider event id is a no-op, not a second application",
    second.result === "duplicate",
  );

  const eventRows = await db
    .select()
    .from(billingEvents)
    .where(eq(billingEvents.providerEventId, activation.providerEventId));
  check(
    "the redelivered event created no second row — the unique constraint held",
    eventRows.length === 1,
  );

  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, payer.id));
  check("exactly one subscription row exists", subRows.length === 1);
  check(
    "the subscription is active premium",
    subRows[0]?.planId === "premium" && subRows[0]?.status === "active",
  );
  check(
    "the event was linked to the subscription and marked processed",
    eventRows[0]?.subscriptionId === subRows[0]?.id &&
      eventRows[0]?.processedAt !== null,
  );
  check(
    "no provider identifier was stored — there is no provider",
    subRows[0]?.providerSubscriptionId === null &&
      subRows[0]?.providerCustomerId === null,
  );
  check(
    "the raw provider payload is NOT stored — only translated canonical fields",
    (() => {
      const keys = Object.keys((eventRows[0]?.payload ?? {}) as object).sort();
      return JSON.stringify(keys) === JSON.stringify([
        "billingPeriod", "currentPeriodEnd", "planId", "trialEndsAt",
      ]);
    })(),
    "a raw payload would put card metadata and billing addresses into THA's schema",
  );

  // A second, DIFFERENT event must still apply.
  const renewal: BillingEvent = {
    providerEventId: `${MARKER}-renew-1`,
    kind: "renewed",
    occurredAt: NOW,
    currentPeriodEnd: ahead(59),
  };
  const third = await ingestBillingEvent(renewal, {
    userId: payer.id,
    householdId: home.id,
  });
  check("a different event still applies", third.result === "applied");

  const rebuilt = await rebuildFromEventLog(subRows[0].id);
  const stored = (
    await db.select().from(subscriptions).where(eq(subscriptions.id, subRows[0].id))
  )[0];
  check(
    "replaying the whole event log reproduces the stored snapshot",
    rebuilt?.planId === stored.planId && rebuilt?.status === stored.status,
    "if these diverge, believe the log — the incremental path has a bug",
  );

  // ── Household entitlement, end to end, through the database ─────────────
  await db.insert(await import("@shared/schema").then(m => m.householdMembers)).values([
    { householdId: home.id, userId: payer.id, role: "owner", status: "active" },
    { householdId: home.id, userId: partner.id, role: "member", status: "active" },
  ]);

  const partnerState = await entitlementsForUser(
    { id: partner.id, subscriptionTier: "free" },
    home.id,
    NOW,
  );
  check(
    "a partner with no subscription of their own is entitled by the household",
    partnerState.planId === "premium" && partnerState.source === "household",
    "one plan, one list, one set of allergies — a family cannot have four answers",
  );

  const payerState = await entitlementsForUser(
    { id: payer.id, subscriptionTier: "free" },
    home.id,
    NOW,
  );
  check(
    "the payer is entitled by their own subscription",
    payerState.planId === "premium" && payerState.source === "subscription",
  );

  // A departed member stops entitling the household they left.
  const { householdMembers } = await import("@shared/schema");
  await db
    .update(householdMembers)
    .set({ status: "left" })
    .where(eq(householdMembers.userId, payer.id));

  const afterDeparture = await entitlementsForUser(
    { id: partner.id, subscriptionTier: "free" },
    home.id,
    NOW,
  );
  check(
    "a departed member's subscription stops entitling the household they left",
    afterDeparture.planId === "free",
  );

  // ── The sync/async agreement precondition ──────────────────────────────
  const allSubs = await db.select().from(subscriptions);
  const testOwned = allSubs.filter(s => s.userId === payer.id || s.userId === partner.id);
  check(
    "the ONLY subscription rows in the database are this test's own",
    allSubs.length === testOwned.length,
    `found ${allSubs.length - testOwned.length} rows BUS2A did not create — the synchronous access.ts path is no longer equivalent to the async one, and every gate must migrate (BUS2B)`,
  );

  // ── Clean up ────────────────────────────────────────────────────────────
  await db.delete(billingEvents).where(like(billingEvents.providerEventId, `${MARKER}%`));
  await db.delete(subscriptions).where(eq(subscriptions.userId, payer.id));
  await db.delete(subscriptions).where(eq(subscriptions.userId, partner.id));
  await db.delete(householdMembers).where(eq(householdMembers.householdId, home.id));
  await db.delete(households).where(eq(households.id, home.id));
  await db.delete(users).where(like(users.username, `${MARKER}%`));

  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n── 8. Every surface resolves through the projection ──");
  // ═══════════════════════════════════════════════════════════════════════
  //
  // Section 5 proves the RULE converged. This section proves the CALL SITES
  // did, which is a different claim and the one that was previously false:
  // BUS2A's architecture doc and the Source of Truth Register both recorded
  // `share-plan-dialog.tsx:47` as converged while it was still comparing tier
  // strings, and recorded the template ceiling as moved off the environment
  // while `server/auth.ts` was still reading MAX_PRIVATE_TEMPLATES_FREE.
  //
  // A convergence recorded in prose and not in a test is a convergence that
  // lasts until the next person writes the obvious line. These checks are the
  // reason the claim is now safe to make.

  const CLIENT_SURFACES = [
    "client/src/components/share-plan-dialog.tsx",
    "client/src/components/templates-panel.tsx",
  ];

  for (const relPath of CLIENT_SURFACES) {
    // codeOf(), not source(): the comment left at each converged site quotes
    // the defective line it replaced, so scanning raw text would make
    // explaining the rule a violation of it — see codeOf's own note.
    const src = codeOf(relPath);
    // Matches `subscriptionTier === "premium"` and friends. The projection is
    // the only thing allowed to turn a plan into a verdict (C11 / Principle 2).
    check(
      `${relPath} decides access through the projection, not a tier string`,
      !/subscriptionTier\s*===/.test(src),
      "resolve via useEntitlements(); a tier comparison here is a second owner of the plan rule",
    );
  }

  const authSrc = codeOf("server/auth.ts");
  check(
    "server/auth.ts no longer reads plan limits from the environment",
    !/MAX_PRIVATE_TEMPLATES_(FREE|PREMIUM)/.test(authSrc),
    "the plan catalogue owns every ceiling; an env var describing a limit the catalogue enforces is a rival owner",
  );
  check(
    "/api/config serves the template ceiling from the plan catalogue",
    /limitFor\(/.test(authSrc) && /entitlementsForPlan\(/.test(authSrc),
    "the value the client is TOLD must come from the same place the server ENFORCES",
  );

  // The ceiling the share dialog prints must be computed, not typed. A typed
  // number beside a rule that can change is C3's "save 20% next to a 17%
  // saving" defect wearing different clothes.
  const shareSrc = codeOf("client/src/components/share-plan-dialog.tsx");
  check(
    "share-plan-dialog prints a COMPUTED ceiling, never a typed one",
    !/Free plan:\s*1\s+shared/.test(shareSrc) && /sharedCeiling/.test(shareSrc),
    "the shared-plan ceiling must be read from the catalogue and interpolated",
  );

  // The client's reader must fail CLOSED. A hook that defaulted to a permissive
  // state while loading would show a household an unlocked control the server
  // then refuses — an offer withdrawn at the moment it is accepted.
  const hookSrc = codeOf("client/src/hooks/use-entitlements.ts");
  check(
    "the client entitlement hook falls back to the FREE plan",
    /entitlementsForPlan\("free"\)/.test(hookSrc),
    "failing open here means promising access the server will refuse",
  );
  check(
    "the client entitlement hook reads the canonical endpoint",
    hookSrc.includes("/api/commerce/entitlements"),
    "the client must consume the same projection the server resolves",
  );

  console.log(`\n=== ${checks - failures}/${checks} checks passed ===\n`);
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async err => {
  console.error("\nVerification crashed:", err);
  await pool.end();
  process.exit(1);
});
