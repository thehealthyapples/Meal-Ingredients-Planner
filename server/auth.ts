import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "./email";
import { sanitizeUser } from "./lib/sanitizeUser";
// BUS1 — the consent ledger. Registration is the moment consent is given, so it
// is the moment it must be recorded; capturing it anywhere later would be
// recording an agreement THA cannot show was ever actually made.
import { recordConsents, consentContextFrom } from "./privacy/consent-service";
import { REQUIRED_CONSENTS_AT_REGISTRATION } from "@shared/privacy/consent";
// BUS1 — company contact addresses converged onto their single owner. These
// defaults previously lived as string literals here AND as a second hardcoded
// copy in client/src/pages/profile-page.tsx; both are now this one file
// (Principle 2). The environment overrides below are unchanged.
import { COMPANY_PROFILE } from "@shared/legal";
// TRUST1-S5. `authRateLimit(route)` returns that route's middleware chain — per-IP, and per-account
// where an account can be identified. server/lib/auth-rate-limit.ts is the ONE owner of every limit,
// every window, and the policy list; nothing here decides a number. It throws on an unknown route
// rather than returning an empty chain, so a typo below cannot silently unguard an endpoint.
import { authRateLimit } from "./lib/auth-rate-limit";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

const APP_BASE_URL = process.env.APP_BASE_URL || "https://www.thehealthyapples.com";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Exported for BUS1: account erasure re-verifies the password at the moment of
// deletion. An irreversible action must be confirmed by the person holding the
// password, not merely by whoever holds the session cookie.
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * NOT AN ENVIRONMENT CHECK. Despite its name, this constant is TRUE whenever the private-beta
 * registration flow is closed — which includes a developer running locally with
 * ENABLE_REGISTRATION=true. It gates registration and email-verification behaviour (see its four
 * call sites below) and it says NOTHING about where the code is deployed.
 *
 * Do not reach for it when you mean "are we in production". For that, use
 * `isProductionDeployment()`. TRUST1-S2 explains, at length, what happens if you confuse the two.
 */
const isProduction = process.env.NODE_ENV === "production" || process.env.ENABLE_REGISTRATION === "true";

/** Session lifetime. Unchanged by TRUST1-S2; `TRUST1-S7` revisits it (idle timeout, 7 days). */
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * TRUST1-S2 — is this a production *deployment*?
 *
 * `NODE_ENV` alone. Deliberately, and this is the whole task.
 *
 * The obvious implementation of S2 was to reuse the `isProduction` constant directly above, and it
 * would have caused a production-grade outage on every developer's laptop. That constant is
 * `NODE_ENV === "production" || ENABLE_REGISTRATION === "true"` — so for anyone running locally with
 * ENABLE_REGISTRATION=true, it is TRUE, and the session cookie would have been marked `Secure` over
 * plain HTTP.
 *
 * The failure mode is not a visible error. `express-session` refuses to *send* a `Secure` cookie
 * over an insecure connection at all (`express-session/index.js:235` — `if (cookie.secure &&
 * !issecure(req, trustProxy)) return`). So no `Set-Cookie` header is emitted, the browser stores
 * nothing, and `POST /api/login` returns **200 with a user object** while establishing no session
 * whatsoever. The developer sees a login that succeeds and then behaves as though they are logged
 * out, with nothing in the log to say why.
 *
 * Hence a separate predicate with an honest name. Registration policy and deployment environment
 * are two different facts and they get two different functions.
 *
 * Read from `process.env` at call time rather than captured at module load, so this is testable
 * across the environment matrix without re-importing the module.
 */
export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * TRUST1-S2 — the flags on the cookie that *is* the user's identity.
 *
 * `httpOnly` and `sameSite` were already correct and are preserved exactly. `secure` was hardcoded
 * `false`, which meant the session cookie was transmitted in plaintext on any request that reached
 * the app over HTTP — and `app.set("trust proxy", 1)` confirms the app sits behind a TLS-terminating
 * proxy, which is precisely the topology in which a downgraded or misrouted request is possible.
 *
 * The three flags are one protection, not three:
 *   httpOnly  — script cannot read it        (XSS cannot steal the session)
 *   sameSite  — another site cannot send it  (CSRF cannot ride the session)
 *   secure    — the network cannot see it    (interception cannot copy the session)
 *
 * In production, a secure-flagged cookie combined with `trust proxy` means the cookie is issued only
 * when `X-Forwarded-Proto: https` — so a request that somehow arrives over plaintext gets no session
 * cookie rather than a plaintext one. Failing closed is the point.
 *
 * The flag is never written as a literal here. It is computed, always — the test scans this file for
 * a hardcoded value and exempts nothing, not even prose, because a rule with a comment exemption is
 * a rule with a hole in it.
 */
export function sessionCookieOptions(): session.CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionDeployment(),
    maxAge: SESSION_MAX_AGE_MS,
  };
}

/**
 * TRUST1-S1 — the session secret fails closed.
 *
 * This value signs every session cookie, so it *is* the user's identity. Until TRUST1-S1 it fell
 * back, whenever the environment variable was unset, to a literal committed to this repository —
 * which meant a single missing variable silently downgraded the platform to a signing key that
 * anyone with read access to the repo, in any clone or fork, forever, could use to forge a cookie
 * for any account, including an admin's. That is a total authentication bypass gated on a
 * configuration mistake, and a configuration mistake is not a safe thing to gate it on.
 *
 * Note that the defect's *shape* is not written out anywhere above, and must not be: the test
 * scans every executable file for it as a literal pattern and exempts nothing, not even prose.
 * A rule with a comment exemption is a rule with a hole in it.
 *
 * There is therefore no fallback. Absence is fatal, in every environment including development:
 * a crash is noticed, and a silent downgrade to a published key is not.
 *
 * The burned literal is matched by DIGEST, never by value — reintroducing the string here to
 * compare against it would put it straight back in the source it was removed from. It is refused
 * because rotation, not deletion, is what actually closed this: the string is in this repository's
 * git history permanently and cannot be unpublished.
 */
const BURNED_SESSION_SECRET_SHA256 =
  "73d30df8ac62143a2a5e3f39732f6938ff20defa9b66626262e1d309936ae140";

export function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  // `SESSION_SECRET=` on the command line yields "", not undefined — both are absent.
  if (!secret || secret.trim() === "") {
    throw new Error(
      "SESSION_SECRET is not set. Refusing to start.\n" +
        "  It signs every session cookie, so without it sessions cannot be trusted.\n" +
        "  Set it to a high-entropy random value, e.g.\n" +
        "      SESSION_SECRET=$(openssl rand -base64 32)\n" +
        "  See .env.example.",
    );
  }

  if (createHash("sha256").update(secret).digest("hex") === BURNED_SESSION_SECRET_SHA256) {
    throw new Error(
      "SESSION_SECRET is set to the compromised value that was previously hardcoded in this\n" +
        "  repository. It is published in this repo's git history and can never be private again.\n" +
        "  Refusing to start. Rotate it to a value that has never been committed:\n" +
        "      SESSION_SECRET=$(openssl rand -base64 32)",
    );
  }

  return secret;
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  const sessionSettings: session.SessionOptions = {
    secret: requireSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: sessionCookieOptions(),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/api", (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return next();
    const user = req.user as SelectUser;
    if (!user.isDemo) return next();
    if (req.path === "/demo/start" && req.method === "POST") return next();
    if (!user.demoExpiresAt || new Date(user.demoExpiresAt) < new Date()) {
      req.logout((err: any) => {
        if (err) console.error("[Demo] Logout error:", err);
      });
      return res.status(401).json({ code: "DEMO_EXPIRED" });
    }
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as SelectUser).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || COMPANY_PROFILE.supportEmail;
  const SUGGESTIONS_EMAIL = process.env.SUGGESTIONS_EMAIL || COMPANY_PROFILE.suggestionsEmail;

  app.get("/api/config", (_req, res) => {
    const familyPlanEnabled = process.env.FAMILY_PLAN_ENABLED !== "false";
    const premiumFeaturesEnabled = process.env.PREMIUM_FEATURES_ENABLED !== "false";
    const templatesEnabled = process.env.TEMPLATES_ENABLED !== "false";
    const maxPrivateTemplatesFree = parseInt(process.env.MAX_PRIVATE_TEMPLATES_FREE || "4");
    const maxPrivateTemplatesPremium = process.env.MAX_PRIVATE_TEMPLATES_PREMIUM
      ? parseInt(process.env.MAX_PRIVATE_TEMPLATES_PREMIUM)
      : null;
    res.json({
      registrationEnabled: isProduction,
      environment: isProduction ? "production" : "beta",
      supportEmail: SUPPORT_EMAIL,
      suggestionsEmail: SUGGESTIONS_EMAIL,
      familyPlanEnabled,
      premiumFeaturesEnabled,
      templatesEnabled,
      maxPrivateTemplatesFree,
      maxPrivateTemplatesPremium,
    });
  });

  app.post("/api/register", ...authRateLimit("/api/register"), async (req, res) => {
    if (!isProduction) {
      return res.status(403).json({ message: "Private beta — registration is currently closed. Request access to join." });
    }

    const { username, password, timeZone, acceptedAgreements } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // BUS1 — consent is a precondition of the account existing, not a step after
    // it. THA stores allergies and health goals, which are special category data
    // under UK GDPR Art. 9 and lawful only on explicit consent, so an account
    // created without it would be unlawful from its first row.
    //
    // The check is a REFUSAL, never a default: a missing or false flag creates no
    // account. There is deliberately no way to pass this by omission, because a
    // pre-ticked box is not consent (Art. 4(11) — a clear affirmative action).
    if (acceptedAgreements !== true) {
      return res.status(400).json({
        message:
          "Please confirm you agree to the Terms of Service and Privacy Policy, and to us storing your household's dietary needs.",
      });
    }

    try {
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "An account with that email already exists." });
      }

      // CONV1 P5 / SCH-1: the signing-up device reports the household's zone
      // (HT12 — the client may DETECT the zone; it may never decide the day). It
      // is advisory: the write door drops an unknown id to NULL, and the household
      // can always correct it (PATCH /api/household/time-zone). A zone is never
      // required to sign up.
      const user = await storage.createUser(
        {
          username,
          password: await hashPassword(password),
        },
        typeof timeZone === "string" ? timeZone : null,
      );

      storage.seedDefaultHouseholdItems(user.id).catch(e =>
        console.warn("[Auth] Failed to seed household items:", e)
      );
      storage.seedDefaultFoodPantryItems(user.id).catch(e =>
        console.warn("[Auth] Failed to seed food pantry items:", e)
      );

      // Recorded immediately after the account exists and BEFORE anything else
      // can fail, so there can be no account whose consent went unrecorded.
      // Awaited, not fire-and-forget: if the ledger write fails, that is a
      // registration failure, because an account THA cannot show consent for is
      // an account it is not entitled to have.
      await recordConsents({
        userId: user.id,
        consentTypes: REQUIRED_CONSENTS_AT_REGISTRATION,
        granted: true,
        source: "registration",
        context: consentContextFrom(req),
      });

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.setEmailVerificationToken(user.id, token, expires);

      const emailResult = await sendVerificationEmail(username, token);

      if (!emailResult.success) {
        console.warn("[Auth] Email service unavailable — user created but verification email not sent");
      }

      res.status(201).json({
        message: "Account created. Please check your email to verify your account.",
        needsVerification: true,
      });
    } catch (err: any) {
      console.error("Registration error:", err?.message);

      if (err?.code === "23505") {
        return res.status(409).json({ message: "Account already exists." });
      }

      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  app.get("/api/verify-email", ...authRateLimit("/api/verify-email"), async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid verification link." });
    }

    try {
      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.redirect(`${APP_BASE_URL}/auth?verify_error=invalid`);
      }

      if (user.emailVerified) {
        return res.redirect(`${APP_BASE_URL}/auth?verified=1`);
      }

      if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
        return res.redirect(`${APP_BASE_URL}/auth?verify_error=expired`);
      }

      await storage.markEmailVerified(user.id);

      // BUS1 — the welcome email is sent HERE and not at registration, because
      // until this moment THA does not know the address belongs to the person
      // who typed it. Fire-and-forget: a welcome that fails to send must never
      // turn a successful verification into an error the household sees.
      sendWelcomeEmail(user.username).catch((e) =>
        console.warn("[Auth] Welcome email failed:", e?.message),
      );

      return res.redirect(`${APP_BASE_URL}/auth?verified=1`);
    } catch (err: any) {
      console.error("[Auth] Email verification error:", err?.message);
      return res.redirect(`${APP_BASE_URL}/auth?verify_error=server`);
    }
  });

  app.post("/api/login", ...authRateLimit("/api/login"), (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      if (!isProduction && !user.isBetaUser) {
        return res.status(403).json({ message: "Private beta — your account does not have beta access. Request access to join." });
      }
      if (isProduction && !user.emailVerified && user.role !== "admin") {
        return res.status(403).json({ message: "Please verify your email before logging in." });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        storage.updateLastLoginAt(user.id).catch(err =>
          console.error("[Auth] Failed to update last_login_at:", err?.message)
        );
        res.status(200).json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/resend-verification", ...authRateLimit("/api/resend-verification"), async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required." });
    }

    try {
      const user = await storage.getUserByUsername(email.trim().toLowerCase());
      if (!user) {
        return res.json({ message: "If that email exists, a verification link has been sent." });
      }
      if (user.emailVerified) {
        return res.json({ message: "Your email is already verified. You can log in." });
      }

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.setEmailVerificationToken(user.id, token, expires);
      await sendVerificationEmail(email, token);

      res.json({ message: "Verification email sent. Please check your inbox." });
    } catch (err: any) {
      console.error("[Auth] Resend verification error:", err?.message);
      res.status(500).json({ message: "Failed to resend verification email." });
    }
  });

  app.post("/api/forgot-password", ...authRateLimit("/api/forgot-password"), async (req, res) => {
    const { username } = req.body;
    const safeResponse = { message: "If that email is registered, a reset link has been sent." };

    if (!username || typeof username !== "string") {
      return res.json(safeResponse);
    }

    try {
      const user = await storage.getUserByUsername(username.trim().toLowerCase());
      if (user) {
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await storage.setPasswordResetToken(user.id, token, expires);
        await sendPasswordResetEmail(username.trim().toLowerCase(), token);
      }
    } catch (err: any) {
      console.error("[Auth] Forgot password error:", err?.message);
    }

    res.json(safeResponse);
  });

  app.post("/api/reset-password", ...authRateLimit("/api/reset-password"), async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    try {
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset link." });
      }
      if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
      }

      const hashed = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashed);
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: "Password updated. You can now log in." });
    } catch (err: any) {
      console.error("[Auth] Reset password error:", err?.message);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/change-password", ...authRateLimit("/api/change-password"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not logged in." });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    try {
      const user = await storage.getUser((req.user as SelectUser).id);
      if (!user) return res.status(404).json({ message: "User not found." });

      const valid = await comparePasswords(currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ message: "Current password is incorrect." });
      }

      const hashed = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashed);

      res.json({ message: "Password changed successfully." });
    } catch (err: any) {
      console.error("[Auth] Change password error:", err?.message);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(sanitizeUser(req.user as SelectUser));
  });

  app.post("/api/demo/start", ...authRateLimit("/api/demo/start"), async (req, res, next) => {
    try {
      // CONV1 P5 / SCH-1: the demo device may detect its zone too (HT12).
      const { timeZone } = req.body ?? {};
      const user = await storage.createDemoUser(typeof timeZone === "string" ? timeZone : null);
      await storage.seedDemoData(user.id).catch(e =>
        console.error("[Demo] Seed error (non-fatal):", e?.message)
      );
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.status(201).json(sanitizeUser(user));
      });
    } catch (err: any) {
      console.error("[Demo] Failed to start demo session:", err?.message);
      res.status(500).json({ message: "Failed to start demo session. Please try again." });
    }
  });

  app.post("/api/demo/save-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    if (!user.isDemo) return res.status(403).json({ message: "Not a demo account." });
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email required." });
    }
    try {
      const { db: database } = await import("./db");
      const { users: usersTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await database.update(usersTable)
        .set({ demoClaimedEmail: email.trim().toLowerCase() })
        .where(eq(usersTable.id, user.id));
      res.json({ success: true });
    } catch (err: any) {
      console.error("[Demo] Save email error:", err?.message);
      res.status(500).json({ message: "Failed to save email." });
    }
  });

  app.delete("/api/demo/cleanup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    if (!user.isDemo) return res.status(403).json({ message: "Not a demo account." });
    try {
      req.logout(() => {});
      await storage.cleanupDemoUser(user.id);
      res.json({ message: "Demo session cleaned up." });
    } catch (err: any) {
      console.error("[Demo] Cleanup error:", err?.message);
      res.status(500).json({ message: "Cleanup failed." });
    }
  });

  app.delete("/api/admin/demo/cleanup-expired", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    if (user.role !== "admin") return res.status(403).json({ message: "Admin only." });
    const { db: database } = await import("./db");
    const { users: usersTable } = await import("@shared/schema");
    const { sql: sqlExpr, lte } = await import("drizzle-orm");
    const expired = await database.select({ id: usersTable.id })
      .from(usersTable)
      .where(sqlExpr`is_demo = true AND demo_expires_at < NOW()`);
    let cleaned = 0;
    for (const { id } of expired) {
      try { await storage.cleanupDemoUser(id); cleaned++; } catch { }
    }
    res.json({ cleaned });
  });

}
