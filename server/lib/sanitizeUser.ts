/**
 * sanitizeUser.ts — the ONE serialiser for a `users` row leaving the server.
 *
 * ── TRUST1-S8: this is an ALLOWLIST, and that is the whole point ────────────────────────────────
 * It used to be a denylist: spread the entire row, then `delete` three known-bad fields. That is
 * safe only for as long as somebody remembers to extend it every time a column is added to `users`
 * — and nobody did. `passwordResetToken` and `passwordResetExpires` (shared/schema.ts:27-28) were
 * added to the same table the denylist existed to protect, were never added to it, and were
 * therefore returned in the body of `GET /api/user` to any client holding a session.
 *
 * That is a live password-reset token disclosed on every profile read. Worse, until TRUST1-P8 that
 * response body was then written verbatim to stdout by the request logger — so a reset token in a
 * log was a password reset available to anyone who could read logs.
 *
 * **The denylist had already failed twice, on the same table, for the same reason.** Extending it
 * to five entries would not have been a fix; it would have been a deferral until the next column.
 * So the default is inverted: a field is returned ONLY if it is named in SAFE_USER_FIELDS below.
 * A new column on `users` is now invisible by default, and it stays invisible until somebody makes
 * a decision about it — which is the decision the denylist let people skip.
 *
 * The two lists below are exhaustive over `users`, and `test-trust1-s8-p8-no-secret-disclosure.ts`
 * proves it against the real Drizzle table at runtime: add a column to `users` and classify it in
 * neither list, and `npm test` fails until you do. Not a lint, not a convention — a failing test.
 */

import type { User } from "@shared/schema";

/**
 * Every `users` column that may be serialised back to the user it belongs to.
 *
 * Adding a field here is a disclosure decision. Make it deliberately.
 */
export const SAFE_USER_FIELDS = [
  "id",
  "username",
  "displayName",
  "firstName",
  "profilePhotoUrl",
  "measurementPreference",
  "preferredPriceTier",
  "onboardingCompleted",
  "starterMealsLoaded",
  "isBetaUser",
  "emailVerified",
  // dietPattern / dietRestrictions retired (CONV1 P4 / OWN-1) — a person's diet is
  // owned by their household_eaters row and served by the profile/household reads.
  "eatingSchedule",
  "role",
  "subscriptionTier",
  "subscriptionStatus",
  "subscriptionExpiresAt",
  "updatedAt",
  "isDemo",
  "demoExpiresAt",
  "demoClaimedEmail",
  "createdAt",
  "lastLoginAt",
  "lastSeenAt",
  "customMetricDefs",
  "diaryExtraMetrics",
] as const satisfies readonly (keyof User)[];

/**
 * Every `users` column that must never leave the server, under any circumstance, to anybody —
 * including to the user the row belongs to, and including to an admin.
 *
 * A credential and a live single-use token are not "the user's data to see"; they are the means of
 * becoming that user. `passwordResetToken` in particular is a bearer credential: whoever holds it
 * can take the account, and that includes anyone reading a log or a browser network tab.
 *
 * This list exists to be *classified*, not merely deleted — it is what lets the exhaustiveness
 * check below prove that every column has been consciously placed on one side or the other.
 */
export const SECRET_USER_FIELDS = [
  "password",
  "emailVerificationToken",
  "emailVerificationExpires",
  "passwordResetToken",
  "passwordResetExpires",
] as const satisfies readonly (keyof User)[];

/**
 * Compile-time exhaustiveness. If a column is added to `users` and classified in neither list,
 * `Unclassified` stops being `never` and this line fails to typecheck, naming the offending column.
 *
 * The runtime test is the enforcing gate (typecheck is red at baseline — TRUST1-S10's M0 problem —
 * so a new error here could be lost in the noise, whereas `npm test` is green and stays green).
 * This guard is here because it names the omission *at the point of the omission*, which a test in
 * another file cannot do.
 */
type Unclassified = Exclude<
  keyof User,
  (typeof SAFE_USER_FIELDS)[number] | (typeof SECRET_USER_FIELDS)[number]
>;
const _everyUserColumnIsClassified: Unclassified[] = [];
void _everyUserColumnIsClassified;

/** A `users` row as it is permitted to leave the server. Derived from the allowlist, never hand-written. */
export type SafeUser = Pick<User, (typeof SAFE_USER_FIELDS)[number]>;

/**
 * Project a `users` row onto the allowlist.
 *
 * Note what this does NOT do: it does not copy the row and remove things. It builds a new object
 * containing only named fields, so anything it has not been told about — a new column, a field
 * grafted onto the row at runtime, a join that widened the shape — is dropped rather than passed
 * through. Absence is the default. That is the difference between this and what it replaced.
 */
export function sanitizeUser(user: User | null | undefined): SafeUser | null {
  if (!user) return null;

  const row = user as Record<string, unknown>;
  const safe: Record<string, unknown> = {};

  for (const field of SAFE_USER_FIELDS) {
    if (field in row) safe[field] = row[field];
  }

  return safe as SafeUser;
}
