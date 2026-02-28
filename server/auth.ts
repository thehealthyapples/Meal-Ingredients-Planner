import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { sanitizeUser } from "./lib/sanitizeUser";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

const APP_BASE_URL = process.env.APP_BASE_URL || "https://www.thehealthyapples.com";

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const isProduction = process.env.NODE_ENV === "production" || process.env.ENABLE_REGISTRATION === "true";

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "r3pl1t_s3cr3t_k3y_123456",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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

  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@thehealthyapples.com";
  const SUGGESTIONS_EMAIL = process.env.SUGGESTIONS_EMAIL || "suggestions@thehealthyapples.com";

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

  app.post("/api/register", async (req, res) => {
    if (!isProduction) {
      return res.status(403).json({ message: "Private beta — registration is currently closed. Request access to join." });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    try {
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "An account with that email already exists." });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
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

  app.get("/api/verify-email", async (req, res) => {
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

      return res.redirect(`${APP_BASE_URL}/auth?verified=1`);
    } catch (err: any) {
      console.error("[Auth] Email verification error:", err?.message);
      return res.redirect(`${APP_BASE_URL}/auth?verify_error=server`);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      if (!isProduction && !user.isBetaUser) {
        return res.status(403).json({ message: "Private beta — your account does not have beta access. Request access to join." });
      }
      if (isProduction && !user.emailVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in." });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.status(200).json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/resend-verification", async (req, res) => {
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

  app.post("/api/forgot-password", async (req, res) => {
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

  app.post("/api/reset-password", async (req, res) => {
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

  app.post("/api/change-password", async (req, res) => {
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
}
