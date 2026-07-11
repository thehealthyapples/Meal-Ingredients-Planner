import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runTemplateMigration } from "./template-migration";
import { seedReadyMeals } from "./lib/seed-ready-meals";
import { seedFoodKnowledge } from "./lib/seed-food-knowledge";
import { seedPantryKnowledge } from "./seeds/seed-pantry-knowledge";
import { runMigrations } from "./migrations/runner";
import { storage } from "./storage";
import { getUploadDir } from "./lib/media-storage";
import { auditStartupEnvironment } from "./lib/platform-status";

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
  // ── Required environment: fail closed ────────────────────────────────────────
  // TRUST1-S1. The audit below reads the canonical environment inventory owned by
  // server/lib/platform-status.ts. It used to be declared a second time inline here, and the two
  // copies had already drifted — the inline one never learned about THEMEALDB_API_KEY. One fact,
  // one owner.
  //
  // The audit already returned the missing REQUIRED keys. Nothing ever read them: absence was
  // logged and the server booted anyway, so a missing SESSION_SECRET scrolled past among four
  // hundred other lines while the platform ran on a published signing key. Absence is now fatal,
  // in every environment including development. A crash is noticed; a silent downgrade is not.
  const missing = auditStartupEnvironment();
  if (missing.length > 0) {
    console.error(
      `\n[Startup] FATAL — refusing to start. Missing required environment variable(s): ${missing.join(", ")}.\n` +
        `          These are required in every environment, including development.\n` +
        `          See .env.example for what each one is and how to set it.\n`,
    );
    process.exit(1);
  }

  await runMigrations();
  await runTemplateMigration().catch(err => console.error("[Template Migration] Error:", err));
  await seedReadyMeals().catch(err => console.error("[Seed Ready Meals] Error:", err));
  await seedFoodKnowledge().catch(err => console.error("[Seed Food Knowledge] Error:", err));
  await seedPantryKnowledge().catch(err => console.error("[Seed Pantry Knowledge] Error:", err));
  // Sync default pantry items for all households. Runs in the background so it
  // does not delay server startup. Idempotent: only inserts missing defaults,
  // never overwrites user-created or user-modified items.
  storage.syncAllPantryDefaults().catch(err => console.error("[Pantry Sync] Error:", err));
  // Serve locally-uploaded meal photos.
  // PRODUCTION NOTE: Replace with object storage (R2/S3) for multi-instance deployments.
  const uploadDir = getUploadDir();
  console.log(`[Startup] Meal photo uploads stored in: ${uploadDir}`);
  app.use("/uploads/meal-photos", express.static(uploadDir));

  await registerRoutes(httpServer, app);

  // KQ1F — load the governed alias overlay (published aliases) into the single
  // GOV2 resolver at boot, so published aliases resolve from the first request.
  // Best-effort: a failure here must never block the server from serving.
  try {
    const { loadVocabularyOverlayFromDb } = await import("./lib/knowledge-review-store");
    const overlay = await loadVocabularyOverlayFromDb();
    console.log(`[Startup] Knowledge alias overlay loaded: ${overlay.nutrient} nutrient + ${overlay.benefit} benefit alias(es)`);
  } catch (err) {
    console.error("[Startup] Failed to load knowledge alias overlay (continuing):", err);
  }

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
