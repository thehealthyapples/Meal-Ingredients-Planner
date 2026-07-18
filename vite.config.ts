import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  // PROD1 — strip `console.*` and `debugger` from the PRODUCTION bundle only.
  //
  // 57 `console.*` calls ship to households today, and several run on ordinary
  // flows rather than in error paths: `[THA-STORE-DEBUG]` groups every product
  // search result and every barcode scan, and `[recipe-scan-timing]` logs file
  // sizes and MIME types for every recipe photograph a household takes.
  //
  // This codebase has already paid for this once and written the lesson down —
  // MealUpliftPanel.tsx records logging that "shipped to production and traced a
  // household's recipe to their browser console." The lesson was recorded but
  // never generalised; this generalises it.
  //
  // Deliberately build-time and production-only: `esbuild.drop` does not apply to
  // the dev server, so developer diagnostics are untouched while developing. No
  // call site is edited, so nothing is lost from the source — the statements
  // simply stop being emitted into what a household downloads.
  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
