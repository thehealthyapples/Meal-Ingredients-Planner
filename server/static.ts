import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "./app-version";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const html = fs.readFileSync(indexPath, "utf-8").replace(
      "</head>",
      `<script>window.__APP_VERSION__ = "${APP_VERSION}";</script></head>`,
    );
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });
}
