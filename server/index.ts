import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runTemplateMigration } from "./template-migration";
import { seedReadyMeals } from "./lib/seed-ready-meals";

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

/**
 * Health endpoint:
 * - Useful for Replit autoscale
 * - Quick way to confirm the server is alive without hitting DB-heavy routes
 */
app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

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

  // Avoid logging huge JSON bodies (can slow dev + clutter logs)
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    // Capture only for API responses; keep it light
    if (path.startsWith("/api") && bodyJson && typeof bodyJson === "object") {
      capturedJsonResponse = bodyJson as Record<string, any>;
    }
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // In production, avoid logging full JSON payloads (privacy/perf)
      if (process.env.NODE_ENV !== "production" && capturedJsonResponse) {
        const preview = JSON.stringify(capturedJsonResponse);
        // Trim very large payload logs
        logLine += ` :: ${preview.length > 500 ? preview.slice(0, 500) + "…" : preview}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  /**
   * IMPORTANT:
   * Seeding/migrations on every boot can slow deployments and cause inconsistent data.
   * - Keep migrations if required (depends on your workflow)
   * - Run seeding only in development by default
   *
   * If you truly need these in production, use an explicit env flag like RUN_SEEDS=true
   */
  const isProd = process.env.NODE_ENV === "production";
  const runSeeds = process.env.RUN_SEEDS === "true";

  await runTemplateMigration().catch((err) =>
    console.error("[Template Migration] Error:", err),
  );

  if (!isProd || runSeeds) {
    await seedReadyMeals().catch((err) =>
      console.error("[Seed Ready Meals] Error:", err),
    );
  }

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

  // Only setup Vite in development (after routes)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Replit requires PORT and 0.0.0.0
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