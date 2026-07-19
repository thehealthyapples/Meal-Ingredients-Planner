// BUS2A — the commercial domain's one front door.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 4 — runtime consumes one assembled model per entity. Consumers
//   import from `@shared/commerce`, never from a file inside it, so the module
//   boundary is real and a later reshuffle inside it breaks nobody.
//
// PURE AND ZERO-I/O. Imported by client and server alike.
//
// The flow this domain implements, end to end:
//
//   Billing Provider  →  Billing Events  →  Subscription Projection
//        (BUS2B)          billing-events.ts     subscription.ts
//                                                     ↓
//                                              Entitlements
//                                             entitlements.ts
//                                                     ↓
//                                             Product Access
//                                          server/lib/access.ts
//
// Everything above the last line is pure. The I/O lives in server/commerce/,
// and the payment provider lives behind server/commerce/billing-provider.ts —
// which, today, cannot take a payment, because BUS2A integrates no provider.

export * from "./types";
export * from "./plans";
export * from "./subscription";
export * from "./billing-events";
export * from "./entitlements";
