import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// OPS1 — Canonical media storage
//
// This module is the SINGLE owner of uploaded meal photo bytes. Nothing else in
// the platform writes, reads, or deletes media files. Two providers sit behind
// one interface; callers (`server/routes.ts`) never learn which one is active:
//
//   local  — the working copy on disk. Development, and any deployment that has
//            mounted a persistent volume at UPLOAD_DIR. Bytes live in
//            `uploads/meal-photos/`, served by Express static middleware.
//
//   s3     — S3-compatible object storage. The canonical PRODUCTION provider.
//            Cloudflare R2 is the recommended implementation; any S3-compatible
//            endpoint works (AWS S3, Backblaze B2, MinIO). Bytes live in a
//            bucket and are served directly from MEDIA_PUBLIC_BASE_URL — the
//            app never proxies them.
//
// WHY THIS EXISTS: a Render web service's filesystem is rebuilt on every deploy
// and is not shared between instances. `process.cwd()/uploads/meal-photos` is
// therefore ephemeral in production: photos were lost on every redeploy while
// their URLs survived in the database, pointing at nothing. That is REL1
// Blocker 2, and this module is its resolution.
//
// The full architecture — provider resolution, URL shape, failure semantics and
// the operator runbook — is documented in:
//   docs/implementation/platform/OPS1_PRODUCTION_MEDIA_STORAGE.md
// ─────────────────────────────────────────────────────────────────────────────

export type MediaProviderKind = "local" | "s3" | "unavailable";

/**
 * Thrown when media storage is not usable in the current environment. The
 * upload route translates this into a 503 — an honest "not right now" — rather
 * than writing bytes somewhere they will not survive.
 */
export class MediaStorageUnavailableError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "MediaStorageUnavailableError";
  }
}

// ── Local provider paths ─────────────────────────────────────────────────────

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads", "meal-photos");

/** The URL prefix local media is served under. Also the legacy URL shape: rows
 *  written before OPS1 carry `/uploads/meal-photos/...` and must still resolve
 *  and still be deletable when the local provider is active. */
export const UPLOAD_URL_PREFIX = "/uploads/meal-photos";

/** The key prefix objects live under in the bucket. Mirrors the local layout so
 *  a bucket is browsable by the same names an operator sees on disk. */
const OBJECT_KEY_PREFIX = "meal-photos";

// ── Provider resolution ──────────────────────────────────────────────────────

export interface S3Config {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Absent for AWS S3 proper; required for R2/B2/MinIO. */
  endpoint?: string;
  /** R2 requires the literal "auto". */
  region: string;
  /** Public origin the bucket is served from, no trailing slash. */
  publicBaseUrl: string;
  /** R2/MinIO need path-style addressing; AWS S3 does not. */
  forcePathStyle: boolean;
}

export type MediaStorageResolution =
  | { kind: "local"; dir: string; note: string }
  | { kind: "s3"; config: S3Config }
  | { kind: "unavailable"; reason: string };

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/**
 * Decide which provider is active, purely from the environment. Pure and total:
 * it never throws and never touches the network — the boot log and the tests
 * both read it, and an operator can reason about production from the env alone.
 *
 * The rules, in order:
 *
 *   1. MEDIA_STORAGE_PROVIDER is honoured when set. `local` in production is a
 *      LEGITIMATE choice — it is how a persistent volume (a Render disk mounted
 *      at UPLOAD_DIR) is selected — but it must be a decision someone typed, not
 *      a default they inherited.
 *   2. Unset + S3 credentials present  → s3.
 *   3. Unset + no credentials + dev    → local. The working copy; costs nothing.
 *   4. Unset + no credentials + PROD   → unavailable.
 *
 * Rule 4 is the entire point of this function. The old module's default was
 * rule 3 in every environment, so production silently wrote photos to a disk
 * that was about to be destroyed, and reported success while doing it. A
 * production deployment that has not been told where media lives does not get to
 * guess: it declines the upload and says so.
 */
export function resolveMediaStorage(env: NodeJS.ProcessEnv = process.env): MediaStorageResolution {
  const isProduction = env.NODE_ENV === "production";
  const declared = (env.MEDIA_STORAGE_PROVIDER ?? "").trim().toLowerCase();

  const bucket = env.MEDIA_S3_BUCKET?.trim();
  const accessKeyId = env.MEDIA_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.MEDIA_S3_SECRET_ACCESS_KEY?.trim();
  const publicBaseUrl = env.MEDIA_PUBLIC_BASE_URL?.trim();
  const endpoint = env.MEDIA_S3_ENDPOINT?.trim();
  const region = env.MEDIA_S3_REGION?.trim() || "auto";

  const hasS3Credentials = Boolean(bucket && accessKeyId && secretAccessKey);

  const localDir = env.UPLOAD_DIR ? path.resolve(env.UPLOAD_DIR) : UPLOAD_DIR;

  const wantsS3 = declared === "s3" || (declared === "" && hasS3Credentials);

  if (wantsS3) {
    // Every field is load-bearing. A partially-configured bucket is a worse
    // outcome than a declined upload: it writes bytes nobody can read back.
    const missing: string[] = [];
    if (!bucket) missing.push("MEDIA_S3_BUCKET");
    if (!accessKeyId) missing.push("MEDIA_S3_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("MEDIA_S3_SECRET_ACCESS_KEY");
    // Without a public origin the URL we hand the client resolves to nothing.
    // THA does not proxy media, so this cannot be defaulted — see the
    // "Why not a proxy" section of the OPS1 implementation report.
    if (!publicBaseUrl) missing.push("MEDIA_PUBLIC_BASE_URL");

    if (missing.length > 0) {
      return {
        kind: "unavailable",
        reason:
          `Object storage selected (MEDIA_STORAGE_PROVIDER=s3) but incompletely configured. ` +
          `Missing: ${missing.join(", ")}.`,
      };
    }

    return {
      kind: "s3",
      config: {
        bucket: bucket!,
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
        endpoint: endpoint || undefined,
        region,
        publicBaseUrl: trimTrailingSlash(publicBaseUrl!),
        // AWS S3 is the only endpoint that must NOT be path-style addressed.
        forcePathStyle: Boolean(endpoint),
      },
    };
  }

  if (declared === "local") {
    return {
      kind: "local",
      dir: localDir,
      note: isProduction
        ? "EXPLICIT local storage in production — photos survive only if a persistent volume is mounted at this path."
        : "Local disk (development).",
    };
  }

  if (declared !== "") {
    return {
      kind: "unavailable",
      reason: `Unknown MEDIA_STORAGE_PROVIDER="${declared}". Valid values: "local", "s3".`,
    };
  }

  if (isProduction) {
    return {
      kind: "unavailable",
      reason:
        "No media storage configured in production. Set MEDIA_STORAGE_PROVIDER=s3 with " +
        "MEDIA_S3_BUCKET / MEDIA_S3_ACCESS_KEY_ID / MEDIA_S3_SECRET_ACCESS_KEY / MEDIA_PUBLIC_BASE_URL, " +
        "or MEDIA_STORAGE_PROVIDER=local with a persistent volume mounted at UPLOAD_DIR. " +
        "Refusing to write uploads to an ephemeral filesystem.",
    };
  }

  return { kind: "local", dir: localDir, note: "Local disk (development default)." };
}

/** Resolved once at module load: the provider cannot change under a running
 *  process, and a request must never re-read the environment to find out where
 *  it is allowed to write. */
let resolution: MediaStorageResolution = resolveMediaStorage();

/** Test-only: re-resolve after mutating process.env. Not used by the server. */
export function __reresolveMediaStorageForTests(): MediaStorageResolution {
  resolution = resolveMediaStorage();
  s3ClientPromise = null;
  return resolution;
}

export function getMediaProviderKind(): MediaProviderKind {
  return resolution.kind;
}

/** True when local media must be served by Express static middleware. When the
 *  s3 provider is active the bucket serves its own bytes and the middleware is
 *  not mounted at all — there is one serving path, never two. */
export function isLocalMediaProvider(): boolean {
  return resolution.kind === "local";
}

// ── Local provider ───────────────────────────────────────────────────────────

function localDir(): string {
  return resolution.kind === "local" ? resolution.dir : UPLOAD_DIR;
}

function ensureDir(): void {
  const dir = localDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Returns the local upload directory, creating it if needed. Only meaningful
 *  for the local provider; `server/index.ts` calls it solely to mount static. */
export function getUploadDir(): string {
  ensureDir();
  return localDir();
}

function extensionFor(mimeType: string): string {
  return mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
}

/** The filename convention is shared by both providers — unchanged since before
 *  OPS1, so a local file and an object key are the same name in two places. */
function buildFilename(mimeType: string, userId: number): string {
  const hash = crypto.randomBytes(8).toString("hex");
  return `meal-${userId}-${Date.now()}-${hash}.${extensionFor(mimeType)}`;
}

async function saveLocal(buffer: Buffer, mimeType: string, userId: number): Promise<string> {
  ensureDir();
  const filename = buildFilename(mimeType, userId);
  await fs.promises.writeFile(path.join(localDir(), filename), buffer);
  return `${UPLOAD_URL_PREFIX}/${filename}`;
}

async function deleteLocal(url: string): Promise<void> {
  const dir = localDir();
  const filename = path.basename(url);
  // Guard against path traversal.
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return;
  const filepath = path.join(dir, filename);
  if (!filepath.startsWith(dir + path.sep) && filepath !== dir) return;
  try {
    await fs.promises.unlink(filepath);
  } catch {
    // File already gone — that's fine.
  }
}

// ── S3-compatible provider ───────────────────────────────────────────────────

// The SDK is imported lazily, for two reasons: a local/dev boot should not pay
// to load it, and a missing or broken SDK degrades media to "unavailable"
// instead of taking the whole platform down at import time.
let s3ClientPromise: Promise<any> | null = null;

async function getS3Client(config: S3Config): Promise<{ client: any; PutObjectCommand: any; DeleteObjectCommand: any }> {
  if (!s3ClientPromise) {
    s3ClientPromise = (async () => {
      const sdk = await import("@aws-sdk/client-s3");
      const client = new sdk.S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: config.forcePathStyle,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
      return { client, PutObjectCommand: sdk.PutObjectCommand, DeleteObjectCommand: sdk.DeleteObjectCommand };
    })().catch((err) => {
      // Do not cache a failed import — the next upload may as well retry.
      s3ClientPromise = null;
      throw err;
    });
  }
  return s3ClientPromise;
}

/** `https://media.example.com/meal-photos/meal-7-…jpg` → `meal-photos/meal-7-…jpg`.
 *  Returns null for any URL this bucket did not issue: DALL·E images, recipe
 *  images scraped from publisher sites, and legacy local paths all fall through
 *  here untouched, which is what keeps delete from reaching outside its own
 *  storage. */
function objectKeyFromUrl(url: string, config: S3Config): string | null {
  const base = config.publicBaseUrl + "/";
  if (!url.startsWith(base)) return null;
  const key = url.slice(base.length);
  if (!key.startsWith(OBJECT_KEY_PREFIX + "/")) return null;
  if (key.includes("..")) return null;
  return key;
}

async function saveS3(
  buffer: Buffer,
  mimeType: string,
  userId: number,
  config: S3Config,
): Promise<string> {
  const { client, PutObjectCommand } = await getS3Client(config);
  const key = `${OBJECT_KEY_PREFIX}/${buildFilename(mimeType, userId)}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Photos are immutable: the filename carries a random suffix, so a given
      // key is written exactly once and may be cached indefinitely.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${config.publicBaseUrl}/${key}`;
}

async function deleteS3(url: string, config: S3Config): Promise<void> {
  const key = objectKeyFromUrl(url, config);
  if (!key) return; // Not ours. Leave it alone.
  const { client, DeleteObjectCommand } = await getS3Client(config);
  await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

// ── Public interface (unchanged signatures — see routes.ts) ───────────────────

/**
 * Save a media buffer and return the URL to store on the meal row.
 *
 * Local  → `/uploads/meal-photos/meal-7-….jpg` (relative; served by Express)
 * S3     → `https://media.…/meal-photos/meal-7-….jpg` (absolute; served by the bucket)
 *
 * Both go straight into an `<img src>`, which is why the API did not have to
 * change to support object storage.
 *
 * Throws MediaStorageUnavailableError when no provider is configured, and the
 * underlying error when the write itself fails. In both cases NOTHING has been
 * written and no meal row has been touched — the caller is a pure upload
 * endpoint, and the meal is only updated by a separate PATCH once it holds a
 * URL. A failed upload therefore cannot leave a half-created photo behind.
 */
export async function saveMediaFile(
  buffer: Buffer,
  mimeType: string,
  userId: number,
): Promise<string> {
  switch (resolution.kind) {
    case "local":
      return saveLocal(buffer, mimeType, userId);
    case "s3":
      return saveS3(buffer, mimeType, userId, resolution.config);
    case "unavailable":
      throw new MediaStorageUnavailableError(resolution.reason);
  }
}

/**
 * Delete a previously-stored media file.
 *
 * NEVER THROWS. `PATCH /api/meals/:id/image` calls this before it updates the
 * row; if a failed delete threw, a household would be unable to REPLACE a photo
 * because the OLD one could not be removed — a storage hiccup would become a
 * broken feature. An orphaned object costs a fraction of a cent; a failed
 * replacement costs the household their edit. So a delete failure is logged and
 * swallowed, and the row update proceeds.
 *
 * Silently ignores anything this platform did not upload: DALL·E URLs, recipe
 * images from publisher sites, and null.
 */
export async function deleteMediaFile(url: string | null | undefined): Promise<void> {
  if (!url) return;

  try {
    // Legacy and local URLs are handled by the local provider regardless of
    // which provider is ACTIVE, so that rows written before OPS1 still clean up
    // when running on a local disk. Under s3 the prefix does not match a bucket
    // URL and the file is not on this disk anyway, so it is correctly a no-op.
    if (url.startsWith(UPLOAD_URL_PREFIX + "/")) {
      if (resolution.kind === "local") await deleteLocal(url);
      return;
    }

    if (resolution.kind === "s3") {
      await deleteS3(url, resolution.config);
    }
  } catch (err) {
    console.error(`[media-storage] delete failed (ignored, row update proceeds): ${String(err)}`);
  }
}

/** One line at boot, so a misconfigured production deploy is visible in the log
 *  aggregator before a household ever finds it by failing to upload a photo. */
export function logMediaStorageStatus(): void {
  switch (resolution.kind) {
    case "local":
      console.log(`[Startup] Media storage: LOCAL DISK → ${resolution.dir} — ${resolution.note}`);
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[Startup] Media storage WARNING: the local provider is active in production. " +
            "Uploaded photos are LOST ON EVERY DEPLOY unless a persistent volume is mounted at this path.",
        );
      }
      break;
    case "s3":
      console.log(
        `[Startup] Media storage: S3-COMPATIBLE OBJECT STORAGE → bucket="${resolution.config.bucket}" ` +
          `endpoint="${resolution.config.endpoint ?? "aws"}" public="${resolution.config.publicBaseUrl}"`,
      );
      break;
    case "unavailable":
      console.error(`[Startup] Media storage UNAVAILABLE — photo uploads will return 503. ${resolution.reason}`);
      break;
  }
}
