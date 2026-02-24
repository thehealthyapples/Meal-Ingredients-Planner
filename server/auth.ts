import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendVerificationEmail } from "./email";

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

  app.get("/api/config", (_req, res) => {
    res.json({
      registrationEnabled: isProduction,
      environment: isProduction ? "production" : "beta",
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
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
