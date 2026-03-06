import { db } from "../db";
import { householdMembers } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const ROLE_RANK: Record<string, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Returns the active householdId for a given userId.
 * Throws if the user has no active household membership.
 * Phase 1A: used for adapter lookup in Phase 1B route updates.
 */
export async function getHouseholdForUser(userId: number): Promise<number> {
  const member = await db.query.householdMembers.findFirst({
    where: and(
      eq(householdMembers.userId, userId),
      eq(householdMembers.status, "active")
    ),
  });

  if (!member) {
    throw new Error(
      `User ${userId} has no active household membership. This should not happen — every user is auto-assigned a default household.`
    );
  }

  return member.householdId;
}

/**
 * Middleware factory that enforces a minimum household role.
 * Phase 1A: placeholder — not wired into routes yet.
 * Phase 1B/2: attach to household-scoped mutating routes.
 *
 * Usage: router.post("/some-route", requireHouseholdRole("admin"), handler)
 */
export function requireHouseholdRole(minRole: "member" | "admin" | "owner") {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as { id: number } | undefined)?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorised" });
    }

    const member = await db.query.householdMembers.findFirst({
      where: and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.status, "active")
      ),
    });

    if (!member) {
      return res.status(403).json({ error: "No active household membership" });
    }

    const userRank = ROLE_RANK[member.role] ?? 0;
    const requiredRank = ROLE_RANK[minRole] ?? 0;

    if (userRank < requiredRank) {
      return res.status(403).json({
        error: `Requires household role '${minRole}' or higher. Your role: '${member.role}'`,
      });
    }

    next();
  };
}
