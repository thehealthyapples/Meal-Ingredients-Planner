import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runTemplateMigration } from "./template-migration";
import { seedReadyMeals } from "./lib/seed-ready-meals";
import { seedFoodKnowledge } from "./lib/seed-food-knowledge";
import { runMigrations } from "./migrations/runner";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ── Env var audit ────────────────────────────────────────────────────────────
  // Log the presence/absence of required and optional secrets at startup so
  // production misconfigurations surface immediately in server logs rather than
  // failing silently at request time.
  const isProduction = process.env.NODE_ENV === "production";

  // Keys that must be present for the server to function at all.
  const REQUIRED_ENV: { key: string; impact: string }[] = [
    { key: "DATABASE_URL",   impact: "database connection will fail" },
    { key: "SESSION_SECRET", impact: "user sessions will not work" },
  ];

  // Keys that enable specific features; absence degrades functionality but is
  // not fatal. In production we emit ERROR so they appear prominently in logs.
  const FEATURE_ENV: { key: string; impact: string }[] = [
    { key: "OPENAI_API_KEY",      impact: "AI scan/text-import falls back to heuristic parser" },
    { key: "SMTP_HOST",           impact: "email delivery will fail" },
  ];

  // Keys that activate optional data integrations. Absence simply disables the source.
  const INTEGRATION_ENV: { key: string; impact: string }[] = [
    { key: "WHISK_API_KEY",       impact: "Whisk recipe source disabled" },
    { key: "USDA_API_KEY",        impact: "USDA uses public DEMO_KEY (rate-limited)" },
    { key: "EDAMAM_APP_ID",       impact: "Edamam recipe source disabled" },
    { key: "EDAMAM_APP_KEY",      impact: "Edamam recipe source disabled" },
    { key: "SPOONACULAR_API_KEY", impact: "Spoonacular price lookup disabled" },
  ];

  const missing: string[] = [];
  for (const { key, impact } of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
      console.error(`[Startup] MISSING required env var: ${key} — ${impact}`);
    }
  }
  for (const { key, impact } of FEATURE_ENV) {
    if (!process.env[key]) {
      // In production, missing feature env vars are elevated to ERROR so they
      // surface prominently in log aggregators and alerting pipelines.
      const log = isProduction ? console.error : console.warn;
      log(`[Startup] ${isProduction ? "MISSING" : "Optional env var not set:"} ${key} — ${impact}`);
    } else {
      console.log(`[Startup] ${key} ✓`);
    }
  }
  for (const { key, impact } of INTEGRATION_ENV) {
    if (!process.env[key]) {
      console.warn(`[Startup] Integration not configured: ${key} — ${impact}`);
    } else {
      console.log(`[Startup] ${key} ✓`);
    }
  }
  if (missing.length === 0) {
    console.log("[Startup] All required env vars present");
  }

  await runMigrations();
  await runTemplateMigration().catch(err => console.error("[Template Migration] Error:", err));
  await seedReadyMeals().catch(err => console.error("[Seed Ready Meals] Error:", err));
  await seedFoodKnowledge().catch(err => console.error("[Seed Food Knowledge] Error:", err));
  // Sync default pantry items for all households. Runs in the background so it
  // does not delay server startup. Idempotent: only inserts missing defaults,
  // never overwrites user-created or user-modified items.
  storage.syncAllPantryDefaults().catch(err => console.error("[Pantry Sync] Error:", err));
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
