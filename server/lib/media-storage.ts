import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Local-disk media storage
//
// PRODUCTION NOTE: This module writes uploaded meal photos to a local directory
// and serves them via Express static middleware. This is suitable for a single-
// instance development/staging environment.
//
// For production deployments with ephemeral filesystems or multiple instances
// (e.g. Replit deployments, Docker, cloud run), swap the saveMediaFile /
// deleteMediaFile implementations below for an object-storage backend such as
// Cloudflare R2 (recommended) or AWS S3, keeping the same exported interface.
//
// Required future steps for production:
//   1. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
//      R2_PUBLIC_BASE_URL env vars.
//   2. Implement R2MediaStorage that satisfies this module's exports.
//   3. Remove the Express static middleware added in server/index.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads", "meal-photos");

export const UPLOAD_URL_PREFIX = "/uploads/meal-photos";

function ensureDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/** Returns the upload directory, creating it if needed. */
export function getUploadDir(): string {
  ensureDir();
  return UPLOAD_DIR;
}

/**
 * Save a media buffer to local disk.
 * Returns the public URL path (e.g. "/uploads/meal-photos/meal-1-1234-abc.jpg").
 */
export async function saveMediaFile(
  buffer: Buffer,
  mimeType: string,
  userId: number
): Promise<string> {
  ensureDir();
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const hash = crypto.randomBytes(8).toString("hex");
  const filename = `meal-${userId}-${Date.now()}-${hash}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(filepath, buffer);
  return `${UPLOAD_URL_PREFIX}/${filename}`;
}

/**
 * Delete a locally-stored media file.
 * Silently ignores DALL-E / external URLs and already-deleted files.
 */
export async function deleteMediaFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  if (!url.startsWith(UPLOAD_URL_PREFIX + "/")) return; // not a local file
  const filename = path.basename(url);
  // Guard against path traversal
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return;
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!filepath.startsWith(UPLOAD_DIR + path.sep) && filepath !== UPLOAD_DIR) return;
  try {
    await fs.promises.unlink(filepath);
  } catch {
    // File already gone — that's fine
  }
}
