import type { User } from "@shared/schema";

const SENSITIVE_FIELDS: (keyof User)[] = [
  "password",
  "emailVerificationToken",
  "emailVerificationExpires",
];

export type SafeUser = Omit<User, "password" | "emailVerificationToken" | "emailVerificationExpires">;

export function sanitizeUser(user: User | null | undefined): SafeUser | null {
  if (!user) return null;
  const safe = { ...user } as Record<string, unknown>;
  for (const field of SENSITIVE_FIELDS) {
    delete safe[field as string];
  }
  if (process.env.NODE_ENV !== "production") {
    const leaked = SENSITIVE_FIELDS.filter(f => f in safe);
    if (leaked.length > 0) {
      console.warn("[sanitizeUser] BUG: sensitive fields still present after sanitization:", leaked);
    }
  }
  return safe as SafeUser;
}
