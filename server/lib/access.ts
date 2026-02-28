import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

export type SubscriptionTier = "free" | "premium" | "friends_family";

export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === "admin";
}

export function getTier(user: User | null | undefined): SubscriptionTier {
  const tier = user?.subscriptionTier as SubscriptionTier | undefined;
  if (tier === "premium" || tier === "friends_family") return tier;
  return "free";
}

export function hasPremiumAccess(user: User | null | undefined): boolean {
  const tier = getTier(user);
  return tier === "premium" || tier === "friends_family";
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
