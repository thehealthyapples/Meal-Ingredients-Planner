// BUS2A — the payment provider boundary.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. A provider owns PAYMENT facts (was a card
//     charged, did an invoice settle, what is a customer id). THA owns the
//     ENTITLEMENT projection. This file is the seam, and it is the only place in
//     the platform that will ever be allowed to know a provider exists.
//
// ─────────────────────────────────────────────────────────────────────────────
// THERE IS NO PAYMENT PROVIDER. THAT IS NOT AN OMISSION — IT IS THE DELIVERABLE.
//
// BUS2A integrates no Stripe, processes no payment and activates no live
// subscription. What it delivers is a commercial domain that is COMPLETE AND
// CORRECT WITHOUT ONE, so that adding Stripe under BUS2B is the implementation
// of one interface and the writing of one translator — not the retrofitting of
// a domain around a vendor's data model.
//
// The test of whether that boundary is real is simple and is enforced by
// `npm run test:bus2a-commercial-foundation`: no module outside this file may
// name a payment provider, and no provider vocabulary may appear in
// shared/commerce/ at all.
//
// THE PLATFORM'S TERMS OF SERVICE CURRENTLY SAY, IN THIS REPOSITORY:
//   "The Healthy Apples does not currently charge for anything, and does not
//    process payments. There is nothing to pay, no subscription to cancel, and
//    we hold no card details."
//                    — shared/legal/documents/terms-of-service.ts, § no-payments
//
// Every word of that remains TRUE after BUS2A, and keeping it true is a hard
// constraint on this workstream rather than a nice property of it. The Terms
// also promise: "If we introduce paid features in future, we will present the
// commercial terms to you then, clearly, and ask you to agree to them before
// anything is charged." BUS2B cannot take a first payment without discharging
// that promise — a commercial-terms document, a consent type to agree to it,
// and a version recorded against the agreement (BUS1's ledger already supports
// all three; none of them is created here, because there is nothing yet to
// agree to and a dormant clause for a thing that does not exist is exactly what
// BUS1 refused to ship).
// ─────────────────────────────────────────────────────────────────────────────

import type { BillingEvent } from "@shared/commerce";

/**
 * What a payment provider must be able to do, in THA's words.
 *
 * Deliberately small. It does NOT expose "charge this card", "create a price"
 * or "list invoices": those are operations on the provider's domain, and a THA
 * service reaching for them is a THA service that has crossed the boundary.
 * What THA needs is a way to send a household TO the provider, a way to send
 * them back to manage what they hold, and a way to receive what happened.
 */
export interface BillingProvider {
  /** A stable identifier for logs and diagnostics. Never shown to a household. */
  readonly id: string;

  /** Whether this provider can currently do anything at all. */
  isConfigured(): boolean;

  /**
   * Begin a subscription. Returns a URL to send the household to.
   *
   * Returns null when the provider cannot act, which is ALWAYS today. Callers
   * must handle null by telling the household plainly that subscriptions are
   * not available yet — never by showing a broken checkout, and never by
   * pretending the click did something.
   */
  createCheckoutSession(request: CheckoutRequest): Promise<string | null>;

  /**
   * A URL where a household manages what they already hold — change plan,
   * change card, cancel.
   *
   * THA does not reimplement any of that. A cancellation flow inside THA that
   * "helpfully" offers a discount, a pause, or a survey before letting somebody
   * leave is the dark pattern BUS1 § 8.1 forbids for account deletion, and the
   * same rule applies to a subscription.
   */
  createManagementSession(providerCustomerId: string): Promise<string | null>;

  /**
   * Translate a provider's webhook into THA's vocabulary.
   *
   * THE ONE FUNCTION PERMITTED TO KNOW PROVIDER VOCABULARY. Returns null for
   * anything that does not change what a household may do — which will be most
   * of what arrives, and discarding it is a decision this boundary exists to
   * make rather than a gap.
   *
   * MUST verify the payload's signature before returning anything. An
   * unverified webhook is an unauthenticated request that grants subscriptions.
   */
  translateWebhook(rawBody: string, signature: string | null): Promise<BillingEvent | null>;
}

export interface CheckoutRequest {
  userId: number;
  householdId: number | null;
  planId: "premium";
  billingPeriod: "monthly" | "annual";
  /** Where to send the household afterwards. */
  successUrl: string;
  cancelUrl: string;
}

/**
 * The provider THA has: none.
 *
 * NOT A STUB TO BE FILLED IN. It is the correct, permanent implementation for a
 * platform with no payment processing, and it stays registered in every
 * environment where none is configured — including production after BUS2B, if
 * the keys are absent. It fails HONESTLY: every operation returns null, nothing
 * throws, and no surface is left believing a checkout is one click away.
 *
 * `isConfigured()` returning false is what every commerce route checks before
 * offering anything, which means "we cannot take payments" is answered by the
 * same code path in dev, in test, and in production.
 */
export class NoBillingProvider implements BillingProvider {
  readonly id = "none";

  isConfigured(): boolean {
    return false;
  }

  async createCheckoutSession(): Promise<string | null> {
    return null;
  }

  async createManagementSession(): Promise<string | null> {
    return null;
  }

  async translateWebhook(): Promise<BillingEvent | null> {
    return null;
  }
}

let activeProvider: BillingProvider = new NoBillingProvider();

/**
 * The provider in use.
 *
 * One accessor, so that "which provider is active?" has a single answer and a
 * single place to change. BUS2B registers a Stripe implementation here at boot
 * and touches nothing else in this file.
 */
export function billingProvider(): BillingProvider {
  return activeProvider;
}

/**
 * Register a provider. Called at boot by BUS2B; unused today.
 *
 * Exported rather than made a constructor argument because the provider is a
 * process-wide fact, like the database pool, and threading it through every
 * call site would put provider-shaped parameters on services that must not know
 * a provider exists.
 */
export function registerBillingProvider(provider: BillingProvider): void {
  activeProvider = provider;
  console.log(`[Commerce] Billing provider registered: ${provider.id}`);
}

/** True when THA can currently take money. False everywhere, today. */
export function paymentsAvailable(): boolean {
  return activeProvider.isConfigured();
}
