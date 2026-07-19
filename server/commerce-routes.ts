// BUS2A — Commercial HTTP surface.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//
// Registered by server/routes.ts via `registerCommerceRoutes(app)`, following
// BUS1's `registerTrustRoutes(app)`: a bounded domain owns its own endpoints in
// its own module rather than appending to the 13,000-line route monolith.
//
// ─── WHAT IS NOT HERE ────────────────────────────────────────────────────────
//
// There is no checkout endpoint, no card capture, no price confirmation, no
// upgrade route and no cancellation route. BUS2A takes no payments and
// activates no subscriptions, so shipping the routes that would do so — even
// disabled — would leave live payment surface area sitting in the platform
// waiting for a configuration mistake to expose it.
//
// What IS here is the three things the product needs to be honest about its own
// commercial state, plus the webhook door BUS2B walks through.

import type { Express, Request, Response } from "express";
import type { User } from "@shared/schema";
import { getHouseholdForUser } from "./lib/household";
import {
  PLAN_IDS,
  annualSavingPercent,
  isPublishable,
  resolvePlanCatalogue,
  type PricingConfiguration,
} from "@shared/commerce";
import { entitlementsForUser } from "./commerce/entitlement-service";
import { billingProvider, paymentsAvailable } from "./commerce/billing-provider";

/**
 * Deployment configuration, read at the EDGE and injected into the pure module.
 *
 * `shared/commerce/plans.ts` reads no environment of its own — it is imported by
 * the client, where `process.env` does not exist and where a secret would be a
 * disclosure. This is the one place the environment is consulted.
 *
 * `THA_PRICING_CONFIGURED` must be the literal string "true". FAILS CLOSED in
 * every other case — unset, empty, "1", "yes", a typo — because the failure
 * mode of failing open is quoting placeholder prices to households as if they
 * were real, which is the exact defect BUS2A exists to close.
 */
function pricingConfiguration(): PricingConfiguration {
  const configured = process.env.THA_PRICING_CONFIGURED === "true";
  if (!configured) return { configured: false };

  const monthly = Number.parseInt(process.env.THA_PRICE_MONTHLY_PENCE ?? "", 10);
  const annual = Number.parseInt(process.env.THA_PRICE_ANNUAL_PENCE ?? "", 10);

  return {
    configured: true,
    prices: {
      ...(Number.isFinite(monthly) ? { monthly } : {}),
      ...(Number.isFinite(annual) ? { annual } : {}),
    },
  };
}

export function registerCommerceRoutes(app: Express): void {
  /**
   * The plan catalogue.
   *
   * PUBLIC — a household must be able to see what a plan includes before
   * deciding to create an account, for the same reason BUS1's Rule TC9 makes
   * the legal documents public.
   *
   * `pricingPublishable` is the client's instruction, not a hint. When it is
   * false the amounts are placeholders and MUST NOT be rendered; the client
   * shows what each plan includes and says plainly that pricing is not settled.
   * The flag is sent rather than the prices being withheld so that the shape of
   * the response does not change the day pricing is configured.
   */
  app.get("/api/commerce/plans", (_req: Request, res: Response) => {
    const pricing = pricingConfiguration();
    const publishable = isPublishable(pricing);
    const catalogue = resolvePlanCatalogue(pricing);

    res.json({
      plans: PLAN_IDS.map(id => {
        const plan = catalogue[id];
        return {
          id: plan.id,
          name: plan.name,
          summary: plan.summary,
          selfServe: plan.selfServe,
          features: plan.features,
          limits: plan.limits,
          // Amounts are omitted entirely when they are not publishable. A
          // client cannot render what it was never sent, which is a stronger
          // guarantee than trusting every future consumer to check a flag.
          prices: publishable ? plan.prices : [],
        };
      }),
      pricingPublishable: publishable,
      annualSavingPercent: annualSavingPercent(pricing),
      /** False in every environment today. The client offers no checkout. */
      paymentsAvailable: paymentsAvailable(),
    });
  });

  /**
   * The signed-in household's entitlement projection.
   *
   * The canonical answer to "what may we do?", resolved through the async
   * household-aware path — so it is correct the day BUS2B writes the first
   * subscription row, without this endpoint changing.
   *
   * `source` is included so an operator reading a support ticket can answer
   * "why does this household have this?" without reasoning about precedence
   * from memory.
   */
  app.get("/api/commerce/entitlements", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user as User;
      const householdId = await getHouseholdForUser(user.id);
      const state = await entitlementsForUser(user, householdId);

      res.json({
        planId: state.planId,
        source: state.source,
        features: state.features,
        limits: state.limits,
      });
    } catch (err) {
      console.error("[Commerce] entitlements failed:", err);
      res.status(500).json({ message: "Could not load your plan" });
    }
  });

  /**
   * The billing webhook door.
   *
   * ─────────────────────────────────────────────────────────────────────────
   * IT ACCEPTS NOTHING TODAY, AND THAT IS THE SECURE DEFAULT RATHER THAN A GAP.
   *
   * With no provider configured, `translateWebhook()` returns null and this
   * endpoint answers 503 without reading, parsing, trusting or storing a single
   * byte of the request. An unauthenticated public endpoint that mutates
   * subscription state is the highest-value target this workstream could
   * possibly create, so before BUS2B it does nothing at all.
   *
   * When BUS2B registers a provider, the ONLY thing that changes is that
   * `translateWebhook()` starts returning events — and it is contractually
   * required to verify the payload's signature before it does. Signature
   * verification lives with the provider adapter because only the adapter knows
   * the scheme; there is no THA-side "trust this if it looks right" path, and
   * this handler cannot be made to accept an event the adapter did not vouch
   * for.
   *
   * The ingest it will call is idempotent at the DATABASE — a unique constraint
   * on `provider_event_id` — so redelivery, which every provider does routinely,
   * is a no-op rather than a second application. This handler must answer 2xx
   * for a duplicate, or the provider retries forever.
   * ─────────────────────────────────────────────────────────────────────────
   */
  app.post("/api/commerce/billing/webhook", async (req: Request, res: Response) => {
    const provider = billingProvider();

    if (!provider.isConfigured()) {
      // Deliberately uninformative and deliberately not 404: a 404 would
      // suggest the route does not exist, and BUS2B needs the path stable.
      return res.status(503).json({ message: "Billing is not enabled" });
    }

    try {
      const signature = req.headers["stripe-signature"];
      const event = await provider.translateWebhook(
        typeof req.body === "string" ? req.body : JSON.stringify(req.body),
        typeof signature === "string" ? signature : null,
      );

      // Null means "verified but not a fact about household access" — most of
      // what a provider sends. Acknowledged so it is not retried.
      if (!event) return res.status(200).json({ received: true, applied: false });

      // BUS2B resolves the event to a THA user before ingesting. There is no
      // resolution path yet, and inventing one now would mean guessing the
      // mapping a provider has not been chosen for.
      return res.status(501).json({ message: "Event routing is not implemented" });
    } catch (err) {
      console.error("[Commerce] webhook failed:", err);
      res.status(400).json({ message: "Could not process event" });
    }
  });
}
