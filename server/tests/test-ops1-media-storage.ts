/**
 * test-ops1-media-storage.ts — OPS1
 * =================================
 * Meal photos were written to `process.cwd()/uploads/meal-photos` and served by Express static
 * middleware. Production is Render: a web service's filesystem is rebuilt on every deploy and is not
 * shared between instances. So every uploaded photo was destroyed on the next deploy, while its URL
 * survived in the `meals` row — a household's photo became a broken image, permanently, and the
 * platform reported the upload as a success while it happened. That is REL1 Blocker 2.
 *
 * OPS1 puts a second provider behind the SAME two exported functions (`saveMediaFile`,
 * `deleteMediaFile`) — S3-compatible object storage — and this file proves the four things that
 * make the swap safe:
 *
 *   1. PERSISTENCE. Bytes outlive the process that wrote them. For `local` that means the file is
 *      still on disk after a restart; for `s3` it means the object is still in the bucket after the
 *      client that PUT it has been thrown away and rebuilt. The s3 case is exercised against a real
 *      `@aws-sdk/client-s3` client — real signing, real HTTP — talking to an in-process
 *      S3-compatible endpoint, so the code path under test is the code path production runs.
 *
 *   2. PRODUCTION CANNOT SILENTLY GO EPHEMERAL. This is the actual fix. The old default was "local
 *      disk" in every environment, so production wrote to a doomed disk *by inheriting a default
 *      nobody chose*. A production deploy that has not been told where media lives now resolves to
 *      `unavailable` and declines uploads with a 503. Writing to `uploads/` in production is still
 *      permitted — a mounted volume is a legitimate answer — but ONLY when a human typed
 *      MEDIA_STORAGE_PROVIDER=local. The assertion that matters most here is the one that fails if
 *      an incompletely-configured bucket ever falls BACK to local disk: a half-configured bucket
 *      must decline, because bytes written where they cannot be read back are worse than no bytes.
 *
 *   3. FAILURE IS SAFE IN BOTH DIRECTIONS, AND THE TWO DIRECTIONS ARE OPPOSITE.
 *        save   MUST throw   — a failed write must never return a URL, or the meal row would point
 *                              at an object that does not exist.
 *        delete MUST NOT throw — `PATCH /api/meals/:id/image` deletes the old photo BEFORE it writes
 *                              the new URL. If a delete failure propagated, a storage hiccup would
 *                              stop a household REPLACING a photo. An orphaned object costs a
 *                              fraction of a cent; a blocked edit costs the household their work.
 *
 *   4. DELETE STAYS INSIDE ITS OWN STORAGE. `meals.imageUrl` also holds DALL·E URLs and recipe
 *      images scraped from publisher sites. Delete must ignore every URL this platform did not
 *      upload, and must never traverse out of its own directory or key prefix.
 *
 * It also holds the structural line OPS1 was told not to cross: there is ONE media storage
 * implementation. The test greps the server for a second writer or a second static mount, so a
 * future "quick" upload endpoint cannot quietly become the platform's second storage system.
 *
 *   npm run test:ops1-media-storage
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// An in-process S3-compatible endpoint. Path-style addressing (/bucket/key),
// which is what R2, MinIO and B2 use and what the module configures whenever an
// endpoint is set. It stores bytes in a Map — standing in for the bucket, which
// is the whole point: the bytes live somewhere the app process does not own.
// ─────────────────────────────────────────────────────────────────────────────
interface FakeBucket {
  objects: Map<string, { body: Buffer; contentType: string; cacheControl: string }>;
  requests: { method: string; url: string; authorization: string }[];
  /** Fail EVERY request until cleared. It must be every request, not just the
   *  next one: the AWS SDK retries a 5xx by default (3 attempts), so a one-shot
   *  failure is absorbed by the retry and the operation SUCCEEDS. A test that
   *  failed only the next request would assert nothing — it would be testing the
   *  retry, and passing for the wrong reason. Outage, not hiccup. */
  failAll: boolean;
  server: http.Server;
  port: number;
  close: () => Promise<void>;
}

async function startFakeS3(): Promise<FakeBucket> {
  const objects = new Map<string, { body: Buffer; contentType: string; cacheControl: string }>();
  const requests: { method: string; url: string; authorization: string }[] = [];
  const state = { failAll: false };

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      requests.push({
        method: req.method ?? "",
        url: req.url ?? "",
        authorization: (req.headers["authorization"] as string) ?? "",
      });

      if (state.failAll) {
        res.writeHead(500, { "Content-Type": "application/xml" });
        res.end("<Error><Code>InternalError</Code><Message>boom</Message></Error>");
        return;
      }

      // /<bucket>/<key...>
      const url = (req.url ?? "").split("?")[0];
      const key = url.replace(/^\/[^/]+\//, "");

      if (req.method === "PUT") {
        objects.set(key, {
          body: Buffer.concat(chunks),
          contentType: (req.headers["content-type"] as string) ?? "",
          cacheControl: (req.headers["cache-control"] as string) ?? "",
        });
        res.writeHead(200, { ETag: '"fake"' });
        res.end();
        return;
      }
      if (req.method === "DELETE") {
        objects.delete(key);
        res.writeHead(204);
        res.end();
        return;
      }
      if (req.method === "GET") {
        const obj = objects.get(key);
        if (!obj) {
          res.writeHead(404);
          res.end("<Error><Code>NoSuchKey</Code></Error>");
          return;
        }
        res.writeHead(200, { "Content-Type": obj.contentType });
        res.end(obj.body);
        return;
      }
      res.writeHead(405);
      res.end();
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;

  return {
    objects,
    requests,
    get failAll() {
      return state.failAll;
    },
    set failAll(v: boolean) {
      state.failAll = v;
    },
    server,
    port,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  } as FakeBucket;
}

// ─────────────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log("\nOPS1 — Production Media Storage\n");

  const mod = await import("../lib/media-storage");
  const { resolveMediaStorage, MediaStorageUnavailableError } = mod;

  // ── 1. Provider resolution — the fix itself ────────────────────────────────
  console.log("Provider resolution (pure, environment-driven)");

  const S3_ENV = {
    MEDIA_STORAGE_PROVIDER: "s3",
    MEDIA_S3_BUCKET: "tha-media",
    MEDIA_S3_ACCESS_KEY_ID: "key",
    MEDIA_S3_SECRET_ACCESS_KEY: "secret",
    MEDIA_PUBLIC_BASE_URL: "https://media.thehealthyapples.com",
  };

  const dev = resolveMediaStorage({ NODE_ENV: "development" } as NodeJS.ProcessEnv);
  check("development with no configuration → local disk", dev.kind === "local", `got ${dev.kind}`);

  const prodBare = resolveMediaStorage({ NODE_ENV: "production" } as NodeJS.ProcessEnv);
  check(
    "PRODUCTION with no configuration → unavailable (never silently ephemeral) ← REL1 Blocker 2",
    prodBare.kind === "unavailable",
    `got ${prodBare.kind}`,
  );

  const prodS3 = resolveMediaStorage({ NODE_ENV: "production", ...S3_ENV } as NodeJS.ProcessEnv);
  check("production + full bucket configuration → s3", prodS3.kind === "s3", `got ${prodS3.kind}`);

  const prodPartial = resolveMediaStorage({
    NODE_ENV: "production",
    MEDIA_STORAGE_PROVIDER: "s3",
    MEDIA_S3_BUCKET: "tha-media",
    MEDIA_S3_ACCESS_KEY_ID: "key",
    // secret + public base URL missing
  } as NodeJS.ProcessEnv);
  check(
    "production + HALF-configured bucket → unavailable, NOT a fallback to local disk",
    prodPartial.kind === "unavailable",
    `got ${prodPartial.kind}`,
  );

  const prodExplicitLocal = resolveMediaStorage({
    NODE_ENV: "production",
    MEDIA_STORAGE_PROVIDER: "local",
  } as NodeJS.ProcessEnv);
  check(
    "production + EXPLICIT local (a mounted volume) → local, because a human chose it",
    prodExplicitLocal.kind === "local",
    `got ${prodExplicitLocal.kind}`,
  );

  const bogus = resolveMediaStorage({
    NODE_ENV: "production",
    MEDIA_STORAGE_PROVIDER: "gcs",
  } as NodeJS.ProcessEnv);
  check("unknown provider name → unavailable, not a guess", bogus.kind === "unavailable", `got ${bogus.kind}`);

  const trailing = resolveMediaStorage({
    NODE_ENV: "production",
    ...S3_ENV,
    MEDIA_PUBLIC_BASE_URL: "https://media.thehealthyapples.com/",
  } as NodeJS.ProcessEnv);
  check(
    "trailing slash on the public base URL is trimmed (no `…com//meal-photos/…`)",
    trailing.kind === "s3" && trailing.config.publicBaseUrl === "https://media.thehealthyapples.com",
    trailing.kind === "s3" ? trailing.config.publicBaseUrl : trailing.kind,
  );

  // ── 2. Local provider — persistence across restart ─────────────────────────
  console.log("\nLocal provider (development / mounted volume)");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ops1-local-"));
  process.env.NODE_ENV = "development";
  process.env.MEDIA_STORAGE_PROVIDER = "local";
  process.env.UPLOAD_DIR = tmpDir;
  delete process.env.MEDIA_S3_BUCKET;
  mod.__reresolveMediaStorageForTests();

  check("active provider is local", mod.getMediaProviderKind() === "local");
  check("Express static middleware is mounted for local", mod.isLocalMediaProvider() === true);

  const localBytes = Buffer.from("local-photo-bytes");
  const localUrl = await mod.saveMediaFile(localBytes, "image/jpeg", 7);
  check(
    "save returns the unchanged legacy URL shape (existing API preserved)",
    localUrl.startsWith("/uploads/meal-photos/meal-7-") && localUrl.endsWith(".jpg"),
    localUrl,
  );

  // Simulate a restart: the module re-resolves and rebuilds all its state. The
  // disk does not.
  mod.__reresolveMediaStorageForTests();
  const onDisk = path.join(tmpDir, path.basename(localUrl));
  check(
    "PERSISTS ACROSS RESTART — the file is still on disk and readable",
    fs.existsSync(onDisk) && fs.readFileSync(onDisk).equals(localBytes),
  );

  await mod.deleteMediaFile(localUrl);
  check("delete removes the local file", !fs.existsSync(onDisk));

  await mod.deleteMediaFile(localUrl);
  check("deleting an already-deleted file does not throw (idempotent)", true);

  await mod.deleteMediaFile("/uploads/meal-photos/../../../etc/passwd");
  check("path traversal in a delete URL is refused (still exists)", fs.existsSync("/etc/passwd"));

  // ── 3. S3 provider — real SDK, real signing, real HTTP ─────────────────────
  console.log("\nS3-compatible object storage provider (production)");

  const bucket = await startFakeS3();
  const publicBase = "https://media.thehealthyapples.test";

  process.env.NODE_ENV = "production";
  process.env.MEDIA_STORAGE_PROVIDER = "s3";
  process.env.MEDIA_S3_BUCKET = "tha-media";
  process.env.MEDIA_S3_ACCESS_KEY_ID = "test-access-key";
  process.env.MEDIA_S3_SECRET_ACCESS_KEY = "test-secret-key";
  process.env.MEDIA_S3_ENDPOINT = `http://127.0.0.1:${bucket.port}`;
  process.env.MEDIA_S3_REGION = "auto";
  process.env.MEDIA_PUBLIC_BASE_URL = publicBase;
  mod.__reresolveMediaStorageForTests();

  check("active provider is s3", mod.getMediaProviderKind() === "s3");
  check(
    "Express static middleware is NOT mounted under s3 (one serving path, never two)",
    mod.isLocalMediaProvider() === false,
  );

  const photo = Buffer.from("a-households-dinner-photo");
  const s3Url = await mod.saveMediaFile(photo, "image/png", 42);

  check(
    "save returns an absolute public bucket URL",
    s3Url.startsWith(`${publicBase}/meal-photos/meal-42-`) && s3Url.endsWith(".png"),
    s3Url,
  );

  const storedKey = s3Url.slice(publicBase.length + 1);
  const stored = bucket.objects.get(storedKey);
  check("the object really reached the bucket", Boolean(stored));
  check("the bytes are byte-identical to what was uploaded", Boolean(stored && stored.body.equals(photo)));
  check("Content-Type is set from the upload's MIME type", stored?.contentType === "image/png");
  check("immutable Cache-Control is set (the key is random and written once)", (stored?.cacheControl ?? "").includes("immutable"));
  check(
    "the request was AWS SigV4-signed with the configured credentials",
    bucket.requests.some((r) => r.method === "PUT" && r.authorization.includes("AWS4-HMAC-SHA256") && r.authorization.includes("test-access-key")),
  );

  // Persistence: throw the client away entirely and rebuild it, exactly as a
  // redeploy does. The bucket is not the app's process, so the object survives.
  mod.__reresolveMediaStorageForTests();
  check(
    "PERSISTS ACROSS RESTART/REDEPLOY — the object is still in the bucket after the app is rebuilt",
    bucket.objects.has(storedKey) && bucket.objects.get(storedKey)!.body.equals(photo),
  );

  // A second upload must not disturb the first — no duplicate/overwritten media.
  const secondUrl = await mod.saveMediaFile(Buffer.from("a-different-photo"), "image/jpeg", 42);
  check("a second upload gets a distinct key (no collision, no overwrite)", secondUrl !== s3Url);
  check("both objects coexist in the bucket", bucket.objects.size === 2);

  // Delete stays inside its own storage.
  const externalUrl = "https://oaidalleapiprodscus.blob.core.windows.net/private/generated-image.png";
  const before = bucket.objects.size;
  await mod.deleteMediaFile(externalUrl);
  check("a DALL·E URL is ignored by delete (not ours to delete)", bucket.objects.size === before);

  await mod.deleteMediaFile("/uploads/meal-photos/meal-1-legacy.jpg");
  check("a legacy local URL is a no-op under s3 (it is not in this bucket)", bucket.objects.size === before);

  await mod.deleteMediaFile(`${publicBase}/../../secrets/key.txt`);
  check("a traversal outside the key prefix is refused", bucket.objects.size === before);

  await mod.deleteMediaFile(s3Url);
  check("delete removes OUR object from the bucket", !bucket.objects.has(storedKey));
  check("and leaves the other object untouched", bucket.objects.size === 1);

  // ── 4. Failure is safe — and safe means opposite things for save and delete ─
  console.log("\nFailure semantics");

  // A transient 5xx is absorbed by the SDK's retry, so the failure injected here
  // is a sustained outage — the bucket is down, and stays down.
  bucket.failAll = true;

  let saveThrew = false;
  let returnedUrl: string | null = null;
  try {
    returnedUrl = await mod.saveMediaFile(Buffer.from("doomed"), "image/jpeg", 9);
  } catch {
    saveThrew = true;
  }
  check("a failed bucket write THROWS — no URL is returned for bytes that were never stored", saveThrew, `returned ${returnedUrl}`);
  check(
    "and the upload route therefore returns an error instead of a URL to nothing",
    returnedUrl === null,
  );

  let deleteThrew = false;
  try {
    await mod.deleteMediaFile(secondUrl);
  } catch {
    deleteThrew = true;
  }
  check(
    "a failed bucket DELETE does NOT throw — an outage must not stop a household replacing a photo",
    !deleteThrew,
  );

  bucket.failAll = false;
  check(
    "the object survives the failed delete (orphaned, not lost — and the row update still proceeds)",
    bucket.objects.size === 1,
  );

  // Unavailable provider: uploads are declined, loudly and safely.
  process.env.NODE_ENV = "production";
  delete process.env.MEDIA_STORAGE_PROVIDER;
  delete process.env.MEDIA_S3_BUCKET;
  delete process.env.MEDIA_S3_ACCESS_KEY_ID;
  delete process.env.MEDIA_S3_SECRET_ACCESS_KEY;
  delete process.env.MEDIA_S3_ENDPOINT;
  delete process.env.MEDIA_PUBLIC_BASE_URL;
  delete process.env.UPLOAD_DIR;
  mod.__reresolveMediaStorageForTests();

  check("unconfigured production resolves to unavailable", mod.getMediaProviderKind() === "unavailable");

  let unavailableErr: unknown = null;
  try {
    await mod.saveMediaFile(Buffer.from("nowhere-to-go"), "image/jpeg", 1);
  } catch (err) {
    unavailableErr = err;
  }
  check(
    "an upload into unconfigured production throws MediaStorageUnavailableError",
    unavailableErr instanceof MediaStorageUnavailableError,
  );

  let unavailableDeleteThrew = false;
  try {
    await mod.deleteMediaFile("/uploads/meal-photos/meal-1-x.jpg");
  } catch {
    unavailableDeleteThrew = true;
  }
  check("delete is still safe when storage is unavailable", !unavailableDeleteThrew);

  await bucket.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // ── 5. Structure — ONE implementation, and the route reports it honestly ────
  console.log("\nStructural guarantees (one implementation, one serving path)");

  const routes = readFileSync(path.join(REPO_ROOT, "server", "routes.ts"), "utf-8");
  const index = readFileSync(path.join(REPO_ROOT, "server", "index.ts"), "utf-8");

  check(
    "the upload route maps unavailable storage to 503, not a generic 500",
    routes.includes("MediaStorageUnavailableError") && /503/.test(routes.split("MediaStorageUnavailableError")[2] ?? ""),
  );
  check(
    "the static mount is guarded by the active provider",
    index.includes("isLocalMediaProvider()") && index.includes('app.use("/uploads/meal-photos"'),
  );

  // No second storage implementation. Only media-storage.ts may write media or
  // mount a media route.
  const serverFiles: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "tests" || entry.name === "node_modules") continue;
        walk(full);
      } else if (entry.name.endsWith(".ts")) {
        serverFiles.push(full);
      }
    }
  };
  walk(path.join(REPO_ROOT, "server"));

  const otherMediaWriters = serverFiles.filter((f) => {
    if (f.endsWith(path.join("lib", "media-storage.ts"))) return false;
    const src = readFileSync(f, "utf-8");
    return /uploads[/\\]meal-photos|meal-photos/.test(src) && /writeFile|createWriteStream|PutObjectCommand/.test(src);
  });
  check(
    "no second media writer exists anywhere in server/",
    otherMediaWriters.length === 0,
    otherMediaWriters.map((f) => path.relative(REPO_ROOT, f)).join(", "),
  );

  const s3Importers = serverFiles.filter(
    (f) => !f.endsWith(path.join("lib", "media-storage.ts")) && /@aws-sdk\/client-s3/.test(readFileSync(f, "utf-8")),
  );
  check(
    "media-storage.ts is the ONLY module that touches the object-storage SDK",
    s3Importers.length === 0,
    s3Importers.map((f) => path.relative(REPO_ROOT, f)).join(", "),
  );

  // ── Result ────────────────────────────────────────────────────────────────
  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
