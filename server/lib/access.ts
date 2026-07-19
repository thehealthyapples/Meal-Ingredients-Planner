// THE PLATFORM'S SOLE AUTHORISATION AUTHORITY.
//
// BUS1 (THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md § 9) established that there is
// exactly one of these and that nothing else may become a second: the personal
// data registry LABELS where it never AUTHORISES, and the same line is held by
// BUS2A's entitlement projection. This file is where "who is this, and may they
// do this?" is answered, and it is the only such place.
//
// ─── WHAT BUS2A CHANGED HERE, AND WHAT IT DID NOT ────────────────────────────
//
// CHANGED: the RULE moved out. What a plan grants is now decided once, in
// shared/commerce/entitlements.ts, and this file consumes it. Before BUS2A that
// rule was four independent string comparisons — here, at server/routes.ts:7319,
// at share-plan-dialog.tsx:47 and at templates-panel.tsx:211 — each free to
// drift. One of them (routes.ts:7319) had already been copied out of this file
// by hand, which is how the drift starts.
//
// UNCHANGED: every exported signature, and every answer any of them gives.
// `hasPremiumAccess(user)` returns exactly what it returned before for exactly
// the same inputs. This is a convergence onto one rule engine, not a change of
// behaviour, and the verification test asserts the old and the new answers
// agree across every tier and both null cases.
//
// MUST NEVER CONSUME HOUSEHOLD TIME. `server/verification/publication-register.ts`
// fails the build (check `ht-instant-domains-clean`, severity: fail) if this
// file imports shared/time/household-time.ts. Trial/Subscription is a
// permanently-INSTANT domain — a trial's length must never depend on where a
// family lives (HT10). Everything BUS2A imports here is clock-free and takes an
// explicit `Date`, so the verdict holds transitively as well as literally.

import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import type { FeatureKey, PlanId } from "@shared/commerce";
import { hasFeature } from "@shared/commerce";
import { entitlementsFromUser } from "../commerce/entitlement-service";

/**
 * The three tiers.
 *
 * Now an ALIAS of `PlanId` rather than a second declaration of the same three
 * strings — Principle 1, one canonical identity per entity. The name is kept
 * because existing call sites import it; `PlanId` is the canonical spelling for
 * new code.
 */
export type SubscriptionTier = PlanId;

export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === "admin";
}

/**
 * The plan a user is on.
 *
 * Resolves through the shared entitlement rule rather than comparing strings,
 * so it agrees with every other consumer of that rule by construction.
 *
 * SYNCHRONOUS, AND THEREFORE LEGACY-TIER ONLY. It sees `users.subscription_tier`
 * and not the `subscriptions` table — which is exactly right today, because
 * BUS2A activates no subscriptions and the table is empty in every environment.
 * When BUS2B writes the first row, gates that must see a household's shared
 * subscription move to `entitlementsForUser()`, which is async and does. That
 * migration is a named BUS2B deliverable; see entitlement-service.ts.
 */
export function getTier(user: User | null | undefined): SubscriptionTier {
  return entitlementsFromUser(user).planId;
}

/**
 * Whether a user has premium-level access.
 *
 * Kept as the platform's blunt instrument because most of its call sites
 * genuinely mean "premium or better". New gates should prefer
 * `hasFeatureAccess()`, which names the capability being protected rather than
 * the tier — a gate that says WHAT it protects survives a plan being renamed,
 * and can be enumerated and tested. `hasPremiumAccess` can be neither.
 */
export function hasPremiumAccess(user: User | null | undefined): boolean {
  return getTier(user) !== "free";
}

/**
 * Whether a user's plan grants a specific feature.
 *
 * `isAdmin` is NOT consulted here, deliberately. An operator bypass is a fact
 * about a ROLE and belongs at the call site that wants one (as
 * server/routes.ts:7284 already does, explicitly and visibly). Folding it in
 * would mean the plan catalogue — a data file — could decide operator access,
 * which is how an edit that looks like configuration becomes a privilege
 * escalation. BUS1 refused the same shape for the personal data registry.
 */
export function hasFeatureAccess(
  user: User | null | undefined,
  feature: FeatureKey,
): boolean {
  return hasFeature(entitlementsFromUser(user), feature);
}

export function assertAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated() || !isAdmin(req.user as User)) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}

export function requirePremium(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  if (!hasPremiumAccess(req.user as User)) {
    res.status(402).json({ message: "Premium subscription required" });
    return;
  }
  next();
}

/** Middleware form of `hasFeatureAccess`. */
export function requireFeature(feature: FeatureKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!hasFeatureAccess(req.user as User, feature)) {
      res.status(402).json({ message: "This is a Premium feature" });
      return;
    }
    next();
  };
}
