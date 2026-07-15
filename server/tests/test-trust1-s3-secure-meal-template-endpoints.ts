/**
 * test-trust1-s3-secure-meal-template-endpoints.ts — TRUST1-S3
 * ============================================================
 * Five write routes on `meal_templates` had no authorisation check of any kind. Any anonymous
 * caller on the internet could create, edit or DELETE global platform content. The DELETE handler's
 * entire body was:
 *
 *     await storage.deleteMealTemplate(parseInt(req.params.id)); res.sendStatus(204);
 *
 * This is R4. It is remarkable precisely BECAUSE the rest of the codebase is disciplined here — 66
 * routes use `assertAdmin` and 205 check `req.isAuthenticated()` — which is why it went unnoticed:
 * it is an outlier in a clean pattern, and NOTHING TESTED FOR IT. That last clause is the one this
 * file exists to make false, permanently.
 *
 * ── THE TRAP: THE OBVIOUS FIX IS WRONG ────────────────────────────────────────────────────────────
 *
 * `meal_templates` is global platform content with no `userId` column (shared/schema.ts:49), so the
 * tidy one-word answer is `assertAdmin` on all five. It would have broken a live feature.
 *
 * The Analyser's "Link to template" button called POST /api/meal-templates and
 * POST /api/meal-templates/:id/products as a SIGNED-IN HOUSEHOLD, neither admin. `assertAdmin`
 * on the create route would have been a 403 and a "Couldn't create template" toast for every
 * non-admin household on the platform.
 *
 * ── RM3 (2026-07-15): THE PRODUCT ROUTES WERE RETIRED ─────────────────────────────────────────────
 *
 * The "Link to template" flow wrote the duplicate `meal_template_products` representation, which had
 * no live consumer (RM1 §3.3, §8). RM3 retired the flow and its routes:
 *     POST   /api/meal-templates/:id/products   (retired)
 *     GET    /api/meal-templates/:id/products    (retired)
 *     DELETE /api/meal-template-products/:id     (retired)
 *     POST   /api/meal-templates/:id/resolve     (retired — meal-resolution-service.ts deleted)
 * so the assertions about them below were removed with them. The `POST /api/meal-templates` create
 * route survives as generic template creation and is still verified here (anonymous refused, a
 * non-admin household still succeeds), because it is the one route whose guard split remains
 * load-bearing.
 *
 * The guard split that remains, and is the design:
 *
 *     POST   /api/meal-templates              → authenticated  (household template creation)
 *     PATCH  /api/meal-templates/:id          → assertAdmin    (mutating shared content)
 *     DELETE /api/meal-templates/:id          → assertAdmin    (destroying shared content)
 *
 * Every one of them is closed to ANONYMOUS callers, which is the whole of R4. The assertions below
 * therefore prove BOTH directions, and the second is the one a plausible implementation of this task
 * gets wrong: anonymous is refused, AND a non-admin household can still create.
 *
 * ── THE STRUCTURAL TEST ───────────────────────────────────────────────────────────────────────────
 *
 * The guard stops THIS defect. The audit stops the NEXT one. Section 1 is a static guard audit over
 * every write route in `routes.ts` and `auth.ts`: each must be guarded, or on an explicit justified
 * public allowlist, or on a recorded deferred-defect list. A new unguarded write route matches none
 * of the three and fails the build — and that is not claimed here, it is PROVEN by mutation, by
 * injecting a synthetic unguarded route and watching the audit catch it.
 *
 *   npm run test:trust1-s3-secure-meal-template-endpoints
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";

import { db } from "../db.js";
import { users, mealTemplates } from "../../shared/schema.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

// ===========================================================================
// 1. STATIC GUARD AUDIT
// ===========================================================================

type Guard = "ADMIN" | "AUTHENTICATED" | "UNGUARDED";

interface RouteReg {
  file: string;
  line: number;
  verb: string;
  path: string;
  guard: Guard;
}

const WRITE_VERBS = new Set(["post", "patch", "put", "delete"]);

/**
 * Return the handler's body — and NOTHING after it — by brace-matching from its opening `{`.
 *
 * A fixed-size window CANNOT be used here, and the reason is worth stating because it is a live bug
 * this audit shipped with for exactly one run. `POST /api/logout` has a four-line body and is
 * immediately followed by `GET /api/user`, whose first statement is
 * `if (!req.isAuthenticated()) return res.sendStatus(401);`. A 400-character window ran straight off
 * the end of logout and into /api/user's guard — and logout was classified GUARDED on the strength of
 * a guard belonging to a DIFFERENT ROUTE.
 *
 * That is a false negative in a security audit: the one error class that must never occur, because a
 * route that is falsely reported as guarded is a route nobody will ever look at again. Any short
 * handler followed by a guarded one would have inherited its neighbour's protection. The body is
 * therefore bounded by the handler's own closing brace, and a canary below proves the bleed is dead.
 */
function handlerBody(source: string, openBrace: number): string {
  let depth = 0;
  let i = openBrace;
  let quote: string | null = null;

  for (; i < source.length; i++) {
    const c = source[i];
    const prev = source[i - 1];

    if (quote) {
      if (c === quote && prev !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }
    if (c === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
      if (i === -1) break;
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      i = source.indexOf("*/", i);
      if (i === -1) break;
      i++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return source.slice(openBrace + 1, i);
    }
  }
  return source.slice(openBrace + 1, Math.min(source.length, openBrace + 400));
}

/**
 * Classify every route registration in a source file.
 *
 * The guard must sit at the TOP of the handler (or in the middleware slot). A check performed after
 * database work is not a guard, so only the body's opening lines are inspected. An OPTIONAL session
 * read — `req.isAuthenticated() ? req.user!.id : undefined` — is deliberately NOT a guard, and the
 * negation-with-return requirement below is what distinguishes the two. /resolve read the session
 * exactly that way and was wide open.
 */
function auditRoutes(source: string, file: string): RouteReg[] {
  const found: RouteReg[] = [];
  const re = /\bapp\.(get|post|patch|put|delete)\s*\(/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const verb = m[1];
    const openParen = m.index + m[0].length;

    // The handler begins at the first `=> {`. A middleware that is itself an arrow — the
    // `(req, res, next) => next()` no-op this task removed — has no `=> {` and is skipped over
    // correctly, landing us on the real handler.
    const arrow = source.indexOf("=> {", openParen);
    if (arrow === -1) continue;

    const head = source.slice(openParen, arrow); // path + middleware + handler params
    // Bounded by the handler's own closing brace — never the next route's. Then the opening lines
    // only, because a check made after database work is not a guard.
    const body = handlerBody(source, arrow + 3).slice(0, 400);

    // Path: a string literal, or a computed expression (e.g. api.meals.create.path).
    const lit = head.match(/^\s*(['"`])([^'"`]*)\1/);
    const path = lit ? lit[2] : (head.match(/^\s*([A-Za-z_$][\w$.]*)/)?.[1] ?? "<computed>");

    // Middleware slot = everything after the path argument.
    const middleware = lit ? head.slice(lit[0].length) : head;

    const hasAdminMw = /\bassertAdmin\b/.test(middleware);
    const negatedAuth = /if\s*\(\s*!\s*req\.isAuthenticated\(\)/.test(body);
    const manualAdmin =
      negatedAuth && /req\.user!?\.role\s*!==\s*['"]admin['"]/.test(body) && /\b40[13]\b/.test(body);
    const authGuard = negatedAuth && /\b(?:sendStatus|status)\s*\(\s*40[13]\s*\)/.test(body);

    let guard: Guard = "UNGUARDED";
    if (hasAdminMw || manualAdmin) guard = "ADMIN";
    else if (authGuard) guard = "AUTHENTICATED";

    const line = source.slice(0, m.index).split("\n").length;
    found.push({ file, line, verb, path, guard });
  }

  return found;
}

/**
 * Deliberately-public WRITE routes, each with a stated justification.
 *
 * This list is the deliverable's actual value: it converts every public write from an OVERSIGHT into
 * a DECISION. A route is not on it because it happened to be unguarded — it is on it because someone
 * wrote down why it may be.
 */
const PUBLIC_WRITE_ALLOWLIST: Record<string, string> = {
  // ── server/routes.ts ──
  "post /api/knowledge/ingredient-lookup":
    "Pure compute over GLOBAL reference knowledge; performs no database write. POST carries a batch " +
    "body (capped at 200) that would not fit in a query string. Its GET siblings are public by design.",
  "post /api/uplift/batch":
    "Deterministic nutrition-uplift compute; performs no database write. Capped at 200 meals. Reads " +
    "the session only to filter by household restrictions, and returns generic output without one.",
  "post /api/benchmark-impersonation/stop":
    "Mutates ONLY the caller's own session. Self-limiting: it no-ops unless the session already " +
    "carries impersonation state, which only an admin-guarded route can ever set.",

  // ── server/auth.ts — the authentication surface itself. Public by nature: a caller with no
  //    session is exactly who these exist to serve. Their protection is rate limiting (TRUST1-S5),
  //    not authorisation, and S5 is a separate Phase 0 task.
  "post /api/register": "Authentication surface — the caller has no session by definition.",
  "post /api/login": "Authentication surface — the caller has no session by definition.",
  "post /api/logout": "Authentication surface — idempotent; destroys whatever session is presented.",
  "post /api/resend-verification": "Authentication surface — pre-verification, so pre-session.",
  "post /api/forgot-password": "Authentication surface — the caller cannot log in; that is the point.",
  "post /api/reset-password": "Authentication surface — authorised by a single-use emailed token.",
  "post /api/demo/start": "Deliberate anonymous demo entry point; creates a demo user by design.",
};

/**
 * Write routes that are KNOWN to be unguarded and are NOT fixed by TRUST1-S3.
 *
 * This is a defect register, not an approval. Each entry is a live vulnerability that S3's route
 * audit FOUND and that S3's approved scope does not permit it to fix. The list exists so the audit
 * can still fail on a NEW unguarded route while telling the truth about the ones already known —
 * the alternative was to silently allowlist a real defect, which is how R4 survived in the first
 * place.
 *
 * It must SHRINK. Adding to it requires deliberately editing this file, and the count assertion
 * below makes that impossible to do by accident.
 */
const KNOWN_UNGUARDED_DEFERRED: Record<string, string> = {
  // EMPTY — and it got here the way a defect register is supposed to.
  //
  // S3 recorded exactly one entry: `post /api/meals/:id/link-template`, an anonymous cross-user
  // IDOR on the user-owned `meals` table that S3's scope did not permit it to fix. **TRUST1-S3A
  // fixed it** (routes.ts, authenticate + ownership), so the entry was RETIRED rather than
  // rewritten, and the register is now empty.
  //
  // This is the point of the mechanism. The register was never an allowlist; it was a debt with a
  // name on it, and the "no dead entries" assertion below is what forced this file to be edited the
  // moment the debt was paid. A register that can only shrink, and that fails the build when an
  // entry stops being true, cannot quietly become a list of things everyone has agreed to ignore.
};

function keyOf(r: RouteReg): string {
  return `${r.verb} ${r.path}`;
}

function runGuardAudit(): { all: RouteReg[]; unaccounted: RouteReg[] } {
  const routesSrc = readFileSync(`${REPO_ROOT}/server/routes.ts`, "utf8");
  const authSrc = readFileSync(`${REPO_ROOT}/server/auth.ts`, "utf8");

  const all = [
    ...auditRoutes(routesSrc, "server/routes.ts"),
    ...auditRoutes(authSrc, "server/auth.ts"),
  ];

  const unaccounted = all.filter(
    (r) =>
      WRITE_VERBS.has(r.verb) &&
      r.guard === "UNGUARDED" &&
      !(keyOf(r) in PUBLIC_WRITE_ALLOWLIST) &&
      !(keyOf(r) in KNOWN_UNGUARDED_DEFERRED),
  );

  return { all, unaccounted };
}

function staticAudit(): void {
  section("1. Static guard audit — every write route is guarded, allowlisted, or a recorded defect");

  const { all, unaccounted } = runGuardAudit();
  const writes = all.filter((r) => WRITE_VERBS.has(r.verb));

  check(
    "the audit actually parsed the route table (>250 registrations found)",
    all.length > 250,
    `found only ${all.length}`,
  );

  // ── The five in-scope routes, each with its SPECIFIC expected guard. A test that only asserted
  //    "guarded" would pass if every route were assertAdmin — which is the regression that breaks
  //    the Analyser. The guard TYPE is load-bearing, so it is asserted.
  // RM3: the product/resolve routes were retired; only the three meal_templates
  // write routes remain, and their guard split is still load-bearing.
  const expected: Array<[string, Guard, string]> = [
    ["post /api/meal-templates", "AUTHENTICATED", "household template creation"],
    ["patch /api/meal-templates/:id", "ADMIN", "mutates shared platform content"],
    ["delete /api/meal-templates/:id", "ADMIN", "destroys shared platform content"],
  ];

  for (const [key, want, why] of expected) {
    const r = all.find((x) => keyOf(x) === key);
    check(
      `${key} → ${want} (${why})`,
      r?.guard === want,
      r ? `found ${r.guard} at ${r.file}:${r.line}` : "route not found at all",
    );
  }

  // ── The three /api/admin/* jobs whose middleware slot held `(req, res, next) => next()` — a no-op
  //    where a guard belongs. All three rewrite EVERY user's shopping list, with dryRun defaulting
  //    to false.
  for (const key of [
    "post /api/admin/backfill-classifications",
    "post /api/admin/normalise-categories",
    "post /api/admin/backfill-ambiguous-categories",
  ]) {
    const r = all.find((x) => keyOf(x) === key);
    check(`${key} → ADMIN (was a no-op middleware)`, r?.guard === "ADMIN", r ? `found ${r.guard}` : "not found");
  }

  check(
    "no `(req, res, next) => next()` no-op middleware survives anywhere in server/",
    !/next\s*\)\s*=>\s*next\(\)/.test(
      readFileSync(`${REPO_ROOT}/server/routes.ts`, "utf8").replace(/^\s*\/\/.*$/gm, ""),
    ),
    "a no-op pass-through is still sitting in a middleware slot",
  );

  // ── THE STRUCTURAL ASSERTION.
  check(
    `every one of the ${writes.length} write routes is guarded, allowlisted, or a recorded defect`,
    unaccounted.length === 0,
    unaccounted.map((r) => `UNGUARDED: ${r.verb.toUpperCase()} ${r.path} (${r.file}:${r.line})`).join("\n      "),
  );

  // ── The deferred-defect register must not grow by accident. TRUST1-S3A retired its only entry
  //    (the link-template IDOR), so it is now EMPTY and must stay that way.
  check(
    "the deferred-defect register is empty — S3A paid its only debt (it must SHRINK, never grow)",
    Object.keys(KNOWN_UNGUARDED_DEFERRED).length === 0,
    `it now holds ${Object.keys(KNOWN_UNGUARDED_DEFERRED).length}: ${Object.keys(KNOWN_UNGUARDED_DEFERRED).join(", ")}`,
  );

  // ── No DEAD allowlist entries. An allowlist entry for a route that is currently guarded is a
  //    pre-signed permission slip: the day someone removes that route's guard, the audit stays green
  //    and says nothing. Every entry must name a route that is genuinely unguarded TODAY, so that the
  //    list can only ever bless what a human actually looked at.
  const unguardedKeys = new Set(
    all.filter((r) => WRITE_VERBS.has(r.verb) && r.guard === "UNGUARDED").map(keyOf),
  );
  const dead = [...Object.keys(PUBLIC_WRITE_ALLOWLIST), ...Object.keys(KNOWN_UNGUARDED_DEFERRED)].filter(
    (k) => !unguardedKeys.has(k),
  );
  check(
    "no allowlist or deferred entry is dead (each names a route that is genuinely unguarded today)",
    dead.length === 0,
    `dead entries would silently bless a route the day its guard is removed: ${dead.join(", ")}`,
  );

  // ── MUTATION PROOF. A test that has never failed is a hope, not a control. Inject a synthetic
  //    unguarded write route and prove the audit catches it. This is the assertion that makes
  //    "a newly-added unguarded write route would fail the guard audit" a FACT rather than a claim.
  const canary = `
  app.post("/api/trust1-s3-canary", async (req, res) => {
    await storage.deleteMealTemplate(parseInt(req.params.id));
    res.sendStatus(204);
  });
`;
  const mutated = auditRoutes(
    readFileSync(`${REPO_ROOT}/server/routes.ts`, "utf8") + canary,
    "server/routes.ts",
  );
  const caught = mutated.find((r) => r.path === "/api/trust1-s3-canary");
  check(
    "MUTATION: a newly-added unguarded write route is detected as UNGUARDED",
    caught?.guard === "UNGUARDED",
    caught ? `it was classified ${caught.guard} — the audit is blind` : "the canary was not parsed at all",
  );
  check(
    "MUTATION: that new route is on no allowlist, so it FAILS the audit",
    caught !== undefined &&
      !(keyOf(caught) in PUBLIC_WRITE_ALLOWLIST) &&
      !(keyOf(caught) in KNOWN_UNGUARDED_DEFERRED),
    "a brand-new unguarded route would slip through — the audit does not actually gate anything",
  );

  // ── And the inverse: the audit must not be so lax that a guarded route reads as unguarded, nor so
  //    strict that it cannot tell an OPTIONAL session read from a guard.
  const optionalReadCanary = `
  app.post("/api/trust1-s3-optional-canary", async (req, res) => {
    const userId = req.isAuthenticated() ? req.user!.id : undefined;
    res.json({ userId });
  });
`;
  const optMutated = auditRoutes(
    readFileSync(`${REPO_ROOT}/server/routes.ts`, "utf8") + optionalReadCanary,
    "server/routes.ts",
  );
  const optCaught = optMutated.find((r) => r.path === "/api/trust1-s3-optional-canary");
  check(
    "MUTATION: an OPTIONAL session read is not mistaken for a guard (this is exactly what /resolve did)",
    optCaught?.guard === "UNGUARDED",
    `classified ${optCaught?.guard} — the audit would have blessed the original /resolve`,
  );

  // ── MUTATION: the guard-bleed regression. An unguarded route with a SHORT body, immediately
  //    followed by a guarded one, must not inherit its neighbour's guard. The first version of this
  //    audit did exactly that to POST /api/logout, and reported it protected. A false "guarded" is
  //    the only error class here that is worse than no audit at all, because it ends the enquiry.
  const bleedCanary = `
  app.post("/api/trust1-s3-bleed-canary", (req, res) => {
    res.sendStatus(200);
  });

  app.get("/api/trust1-s3-guarded-neighbour", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ ok: true });
  });
`;
  const bleedMutated = auditRoutes(
    readFileSync(`${REPO_ROOT}/server/routes.ts`, "utf8") + bleedCanary,
    "server/routes.ts",
  );
  const bleedCaught = bleedMutated.find((r) => r.path === "/api/trust1-s3-bleed-canary");
  const neighbour = bleedMutated.find((r) => r.path === "/api/trust1-s3-guarded-neighbour");
  check(
    "MUTATION: a short unguarded handler does NOT inherit the next route's guard (the logout bleed)",
    bleedCaught?.guard === "UNGUARDED",
    `classified ${bleedCaught?.guard} — the body window is bleeding into the following route again`,
  );
  check(
    "MUTATION: …while its genuinely-guarded neighbour is still read correctly",
    neighbour?.guard === "AUTHENTICATED",
    `classified ${neighbour?.guard}`,
  );

  console.log(
    `\n  Audit summary: ${all.length} registrations · ${writes.length} writes · ` +
      `${writes.filter((r) => r.guard === "ADMIN").length} admin · ` +
      `${writes.filter((r) => r.guard === "AUTHENTICATED").length} authenticated · ` +
      `${Object.keys(PUBLIC_WRITE_ALLOWLIST).length} justified-public · ` +
      `${Object.keys(KNOWN_UNGUARDED_DEFERRED).length} recorded defect`,
  );
}

// ===========================================================================
// 2. END-TO-END — real server, real session, real HTTP status codes
// ===========================================================================

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const addr = probe.address();
      const port = typeof addr === "object" && addr !== null ? addr.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * A fetch that survives a stale pooled socket.
 *
 * Node's HTTP server closes an idle keep-alive connection after 5s; undici pools sockets and will
 * happily reuse one the server has just closed, which surfaces as `SocketError: other side closed`.
 * It never fired in a standalone run and fired reliably inside the full 63-suite `npm test`, where
 * the gaps between requests are longer — i.e. exactly the conditions of a CI runner.
 *
 * The retry is deliberately narrow: it retries ONLY transport failures, where no HTTP response was
 * ever produced. An HTTP response is returned untouched, however unwelcome its status — retrying a
 * 403 until it turned into a 200 would defeat the entire purpose of this file.
 */
async function fetchResilient(url: string, init: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetch(url, { ...init, headers: { ...(init.headers as object), connection: "close" } });
    } catch (err) {
      lastErr = err; // transport-level only; a real HTTP status has already returned above
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  throw lastErr;
}

async function login(base: string, username: string, password: string): Promise<string | null> {
  const res = await fetchResilient(`${base}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.status !== 200) return null;
  const raw = res.headers.get("set-cookie");
  return raw ? raw.split(";")[0] : null;
}

function req(
  base: string,
  method: string,
  path: string,
  cookie?: string | null,
  body?: unknown,
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["cookie"] = cookie;
  return fetchResilient(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function endToEnd(): Promise<void> {
  section("2. Over the wire — a real server, a real anonymous caller, real status codes");

  if (!process.env.DATABASE_URL) {
    console.warn(
      "  ! SKIPPED — no DATABASE_URL, so no real request can be driven.\n" +
        "    These assertions did NOT run. This is not a pass. Run where a database is reachable.",
    );
    return;
  }

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const stamp = randomBytes(6).toString("hex");

  const password = "correct-horse-battery-staple";
  const hashed = await hashPassword(password);

  const adminName = `trust1-s3-admin-${stamp}@test.invalid`;
  const userName = `trust1-s3-user-${stamp}@test.invalid`;

  const [admin] = await db
    .insert(users)
    .values({ username: adminName, password: hashed, role: "admin", isBetaUser: true, emailVerified: true })
    .returning();
  const [household] = await db
    .insert(users)
    .values({ username: userName, password: hashed, role: "user", isBetaUser: true, emailVerified: true })
    .returning();

  // A safe, disposable target. Anonymous DELETE is attempted against THIS row, and the assertion
  // that matters is that it is still here afterwards.
  const [victim] = await db
    .insert(mealTemplates)
    .values({ name: `TRUST1-S3 canary ${stamp}`, category: "dinner" })
    .returning();

  let child: ChildProcess | undefined;
  const createdTemplateIds: number[] = [victim.id];
  let output = "";

  try {
    // The REAL production entry point — `server/index.ts`, exactly as TRUST1-S1's test drives it and
    // exactly as Render runs it. There is no bespoke fixture, and that is deliberate.
    //
    // A hand-rolled fixture that imported `registerRoutes` was tried first, and it exposed a real
    // pre-existing defect rather than working: `server/lib/seed-ready-meals.ts`, `seed-food-knowledge.ts`
    // and `openfoodfacts-importer.ts` each import `{ log }` from `../index`, and `server/index.ts`
    // ends in a top-level IIFE that calls `httpServer.listen()`. So importing routes.ts — for any
    // reason at all — BOOTS THE ENTIRE WEB SERVER. The fixture bound a port, the transitively-booted
    // real server bound the same port, and the child died of EADDRINUSE mid-suite. See
    // TRUST1_S3_SECURE_MEAL_TEMPLATE_ENDPOINTS.md § Route Audit Results; S3 does not fix it (that is
    // production refactoring, outside scope) and does not paper over it either.
    //
    // `detached: true` puts the child in its own PROCESS GROUP so the kill in `finally` reaps the
    // whole tree. Killing the `npx` pid alone does not: the chain is npx → sh -c → node → node, and
    // SIGKILL to the wrapper ORPHANS the real server, which keeps its heap and its database
    // connections. That leak stranded 102 processes and 5.7GB during this task's own runs, until
    // fresh spawns began dying of OOM with a bare "Aborted" that reads exactly like a code
    // regression and is not one.
    child = spawn("npx", ["tsx", "server/index.ts"], {
      cwd: REPO_ROOT,
      detached: true,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "development",
        // Generated UNCONDITIONALLY. Reading the ambient value and falling back with an or-operator
        // is the precise fail-closed defect TRUST1-S1 abolished, and S1's scanner is absolute: it
        // exempts nothing, not test files, not even prose. It caught this line twice — once as code,
        // once as a comment describing the code. The child needs *a* secret, not *the* secret;
        // sessions only have to be consistent within the single process spawned here.
        SESSION_SECRET: randomBytes(32).toString("hex"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const up = await new Promise<boolean>((resolve) => {
      const onChunk = (b: Buffer) => {
        output += b.toString();
        if (output.includes(`serving on port ${port}`)) resolve(true);
      };
      child!.stdout!.on("data", onChunk);
      child!.stderr!.on("data", onChunk);
      setTimeout(() => resolve(false), 240_000);
    });

    if (!up) throw new Error(`the server never listened.\n      tail: ${output.slice(-800)}`);

    // ── ANONYMOUS — the three surviving write routes. This is R4. (RM3 retired the
    //    product/resolve routes; their anonymous-refusal assertions went with them.) ─────────────
    console.log("\n  Anonymous caller (no session):");

    const anonCreate = await req(base, "POST", "/api/meal-templates", null, { name: "hostile", category: "dinner" });
    check("anonymous CREATE  POST   /api/meal-templates → rejected", anonCreate.status === 401, `got ${anonCreate.status}`);

    const anonPatch = await req(base, "PATCH", `/api/meal-templates/${victim.id}`, null, { name: "defaced" });
    check("anonymous UPDATE  PATCH  /api/meal-templates/:id → rejected", anonPatch.status === 403, `got ${anonPatch.status}`);

    const anonDelete = await req(base, "DELETE", `/api/meal-templates/${victim.id}`, null);
    check("anonymous DELETE  DELETE /api/meal-templates/:id → rejected", anonDelete.status === 403, `got ${anonDelete.status}`);

    // THE assertion. Before S3 this returned 204 and the row was gone.
    const [stillThere] = await db.select().from(mealTemplates).where(eq(mealTemplates.id, victim.id));
    check("…and the template SURVIVED the anonymous DELETE", stillThere !== undefined, "the row was destroyed anonymously");
    check("…and it was not defaced by the anonymous PATCH", stillThere?.name === `TRUST1-S3 canary ${stamp}`, `name is now "${stillThere?.name}"`);

    // ── AUTHENTICATED NON-ADMIN — household template creation must still work. ────────────────────
    console.log("\n  Signed-in household, non-admin (generic template creation):");

    const userCookie = await login(base, userName, password);
    check("a non-admin household can log in", userCookie !== null, "login failed; the assertions below are meaningless");

    const userCreate = await req(base, "POST", "/api/meal-templates", userCookie, {
      name: `TRUST1-S3 household ${stamp}`,
      category: "dinner",
    });
    check("household CREATE → still succeeds (201)", userCreate.status === 201, `got ${userCreate.status}`);

    if (userCreate.status === 201) {
      const householdTemplateId = (await userCreate.json()).id;
      if (householdTemplateId) createdTemplateIds.push(householdTemplateId);
    }

    // …but a household still may not destroy shared platform content.
    const userDelete = await req(base, "DELETE", `/api/meal-templates/${victim.id}`, userCookie);
    check("household DELETE → refused (403): destroying shared content stays admin-only", userDelete.status === 403, `got ${userDelete.status}`);

    // ── ADMIN — everything still works. This is the over-guarding regression check. ───────────────
    console.log("\n  Admin:");

    const adminCookie = await login(base, adminName, password);
    check("an admin can log in", adminCookie !== null, "login failed; the assertions below are meaningless");

    const adminPatch = await req(base, "PATCH", `/api/meal-templates/${victim.id}`, adminCookie, { name: `TRUST1-S3 renamed ${stamp}` });
    check("admin UPDATE → succeeds (200)", adminPatch.status === 200, `got ${adminPatch.status}`);

    const adminCreate = await req(base, "POST", "/api/meal-templates", adminCookie, { name: `TRUST1-S3 admin ${stamp}`, category: "dinner" });
    check("admin CREATE → succeeds (201)", adminCreate.status === 201, `got ${adminCreate.status}`);
    if (adminCreate.status === 201) createdTemplateIds.push((await adminCreate.json()).id);

    const adminDelete = await req(base, "DELETE", `/api/meal-templates/${victim.id}`, adminCookie);
    check("admin DELETE → succeeds (204)", adminDelete.status === 204, `got ${adminDelete.status}`);

    const [gone] = await db.select().from(mealTemplates).where(eq(mealTemplates.id, victim.id));
    check("…and the template is actually gone (admin deletion is not merely accepted)", gone === undefined);

    // ── PUBLIC READS still work. Over-guarding is the identifiable regression risk. ───────────────
    console.log("\n  Public reads (must NOT have been over-guarded):");

    const anonList = await req(base, "GET", "/api/meal-templates", null);
    check("anonymous GET /api/meal-templates → still 200 (public reference data, unchanged)", anonList.status === 200, `got ${anonList.status}`);
    // RM3: the GET /api/meal-templates/:id/products read was retired with the rest of the
    // meal_template_products surface, so its "still reachable" assertion was dropped here —
    // asserting a retired route is reachable would be a false comfort, not a regression guard.
  } catch (err) {
    // If the server died, its stderr is the diagnosis and the socket error is just the symptom.
    // Without this, an OOM-killed or crashed child reads as `TypeError: fetch failed`, which looks
    // exactly like a broken guard and is not one. That misreading cost real time on this task.
    console.error(`\n  ! the test could not complete. Child process output:\n${output.slice(-1500)}`);
    throw err;
  } finally {
    // Kill the process GROUP (negative pid), not just the wrapper — see the spawn comment above.
    if (child?.pid) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL"); // group already gone, or the platform declined; fall back
      }
    }
    for (const id of createdTemplateIds) {
      await db.delete(mealTemplates).where(eq(mealTemplates.id, id)).catch(() => {});
    }
    await db.delete(users).where(eq(users.id, admin.id)).catch(() => {});
    await db.delete(users).where(eq(users.id, household.id)).catch(() => {});
  }
}

// ===========================================================================

async function main(): Promise<void> {
  console.log("\nTRUST1-S3 — no meal-template write route is reachable by an anonymous caller\n");

  staticAudit();
  await endToEnd();

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nTRUST1-S3 test crashed:", err);
  process.exit(1);
});
