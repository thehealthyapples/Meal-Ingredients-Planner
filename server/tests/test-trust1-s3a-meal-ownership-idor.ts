/**
 * test-trust1-s3a-meal-ownership-idor.ts — TRUST1-S3A
 * ===================================================
 * `POST /api/meals/:id/link-template` took a meal by SEQUENTIAL INTEGER ID, with no session and no
 * ownership check, and then mutated it:
 *
 *     const meal = await storage.getMeal(mealId);
 *     if (!meal) return res.status(404)…            // exists? yes. yours? never asked.
 *     await storage.updateMealTemplateId(mealId, templateId);
 *     await storage.updateMealSourceType(mealId, body.sourceType);
 *
 * Both storage calls filter on `meals.id` ALONE (server/storage.ts:1004, :1027) while `meals` has a
 * `userId` column that is NOT NULL (shared/schema.ts:98). So the row was owned, the query did not
 * care, and the route did not ask. **Any anonymous caller on the internet could mutate any
 * household's meal by counting upwards from 1.**
 *
 * This is worse than R4, the defect TRUST1-S3 was written to close. R4 was anonymous writes to
 * SHARED platform content. This is anonymous writes to PERSONAL, user-owned rows — and it is not in
 * the TRUST1 programme at all. S3's 322-route audit found it; S3's scope did not permit fixing it;
 * S3 recorded it on a deferred-defect register that fails the build if it is ever quietly dropped.
 * S3A is that debt being paid, which is the only reason the register existed.
 *
 * ── WHY THE NON-OWNER GETS 404 AND NOT 403 ────────────────────────────────────────────────────────
 *
 * A 403 would be the intuitive answer and it would leave the vulnerability half-open. "Forbidden"
 * confirms the row EXISTS — so an attacker sweeping ids still learns which meal ids are real, and
 * how many meals the platform holds, purely from the status code. The guard would stop the write and
 * keep the oracle.
 *
 * So "not yours" and "not there" are made indistinguishable from outside, which is exactly what the
 * three sibling meal routes already do (routes.ts:1251, :9983, :10420). The enumeration assertion
 * below is the one that proves it: it sweeps a range of ids as a hostile authenticated household and
 * requires that EVERY response be identical — same status, same body — for ids that exist and ids
 * that do not.
 *
 *   npm run test:trust1-s3a-meal-ownership-idor
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq, inArray } from "drizzle-orm";

import { db } from "../db.js";
import { users, meals, mealTemplates } from "../../shared/schema.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

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

// ---------------------------------------------------------------------------
// 1. Source-level: the guard exists, and it is the CANONICAL one
// ---------------------------------------------------------------------------

function sourceAudit(): void {
  section("1. The route carries the canonical ownership guard — not a bespoke one");

  const src = readFileSync(`${REPO_ROOT}/server/routes.ts`, "utf8");

  const start = src.indexOf(`app.post("/api/meals/:id/link-template"`);
  check("the route still exists", start !== -1);
  if (start === -1) return;

  // The handler's opening lines — the only place a guard may live. A check made after the mutation
  // is not a guard, it is an apology.
  const head = src.slice(start, start + 900);

  check(
    "it authenticates before anything else (canonical inline idiom, 205 other sites)",
    /if\s*\(\s*!\s*req\.isAuthenticated\(\)\s*\)\s*return\s+res\.sendStatus\(401\)/.test(head),
  );
  check(
    "it enforces OWNERSHIP: meal.userId !== req.user!.id",
    /meal\.userId\s*!==\s*req\.user!?\.id/.test(head),
  );
  check(
    "the non-owner branch returns 404, never 403 (no existence oracle)",
    /meal\.userId\s*!==\s*req\.user!?\.id\s*\)\s*return\s+res\.status\(404\)/.test(head),
    "a 403 here would still leak which meal ids are real",
  );
  check(
    "no second authorisation framework was introduced (no new helper imported)",
    !/requireOwner|assertOwner|ownershipGuard|mealOwner/i.test(src),
    "a bespoke ownership helper appeared; the canonical inline idiom is the mechanism",
  );

  // Meal-template ownership semantics must be UNTOUCHED — S3A is forbidden from changing them.
  check(
    "meal_templates guards are unchanged from TRUST1-S3 (S3A must not alter template semantics)",
    /app\.patch\("\/api\/meal-templates\/:id",\s*assertAdmin/.test(src) &&
      /app\.delete\("\/api\/meal-templates\/:id",\s*assertAdmin/.test(src) &&
      /app\.delete\("\/api\/meal-template-products\/:id",\s*assertAdmin/.test(src),
  );
}

// ---------------------------------------------------------------------------
// 2. Over the wire — two real households, one real attacker
// ---------------------------------------------------------------------------

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

/** Retries transport failures only. An HTTP response — any status — is returned untouched. */
async function fetchResilient(url: string, init: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetch(url, { ...init, headers: { ...(init.headers as object), connection: "close" } });
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  throw lastErr;
}

function linkTemplate(base: string, mealId: number, cookie: string | null, body: unknown = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["cookie"] = cookie;
  return fetchResilient(`${base}/api/meals/${mealId}/link-template`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
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

/** The fields this route can mutate. Snapshotted before and after the attack. */
async function snapshot(ids: number[]) {
  const rows = await db.select().from(meals).where(inArray(meals.id, ids));
  return rows
    .map((m) => `${m.id}:${m.mealTemplateId ?? "null"}:${m.mealSourceType}`)
    .sort()
    .join(" | ");
}

async function endToEnd(): Promise<void> {
  section("2. Over the wire — the owner, an anonymous attacker, and a hostile household");

  if (!process.env.DATABASE_URL) {
    console.warn(
      "  ! SKIPPED — no DATABASE_URL, so no real request can be driven.\n" +
        "    These assertions did NOT run. This is not a pass.",
    );
    return;
  }

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const stamp = randomBytes(6).toString("hex");
  const password = "correct-horse-battery-staple";
  const hashed = await hashPassword(password);

  const nameA = `s3a-owner-${stamp}@test.invalid`;
  const nameB = `s3a-attacker-${stamp}@test.invalid`;

  const [alice] = await db
    .insert(users)
    .values({ username: nameA, password: hashed, isBetaUser: true, emailVerified: true })
    .returning();
  const [mallory] = await db
    .insert(users)
    .values({ username: nameB, password: hashed, isBetaUser: true, emailVerified: true })
    .returning();

  // Alice owns two meals. Mallory owns one — so we can prove Mallory is a real, functioning
  // household whose OWN writes succeed, and that only the cross-household writes are refused.
  const [aliceMeal] = await db
    .insert(meals)
    .values({ userId: alice.id, name: `S3A Alice dinner ${stamp}`, ingredients: ["rice"] })
    .returning();
  const [aliceMeal2] = await db
    .insert(meals)
    .values({ userId: alice.id, name: `S3A Alice lunch ${stamp}`, ingredients: ["bread"] })
    .returning();
  const [malloryMeal] = await db
    .insert(meals)
    .values({ userId: mallory.id, name: `S3A Mallory dinner ${stamp}`, ingredients: ["pasta"] })
    .returning();

  const [template] = await db
    .insert(mealTemplates)
    .values({ name: `S3A template ${stamp}`, category: "dinner" })
    .returning();

  const aliceIds = [aliceMeal.id, aliceMeal2.id];
  const createdTemplateIds: number[] = [template.id];
  let child: ChildProcess | undefined;
  let output = "";

  try {
    child = spawn("npx", ["tsx", "server/index.ts"], {
      cwd: REPO_ROOT,
      detached: true, // own process group, so the finally block reaps the whole tree
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: "development",
        SESSION_SECRET: randomBytes(32).toString("hex"), // generated, never a fallback (TRUST1-S1)
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

    const before = await snapshot([...aliceIds, malloryMeal.id]);

    // ── ANONYMOUS ────────────────────────────────────────────────────────────────────────────────
    console.log("\n  Anonymous caller (no session):");

    const anon = await linkTemplate(base, aliceMeal.id, null, { templateId: template.id });
    check("anonymous link-template on Alice's meal → 401", anon.status === 401, `got ${anon.status}`);

    const anonSourceType = await linkTemplate(base, aliceMeal.id, null, { sourceType: "ready_meal" });
    check("anonymous sourceType mutation → 401", anonSourceType.status === 401, `got ${anonSourceType.status}`);

    // ── AUTHENTICATED NON-OWNER ──────────────────────────────────────────────────────────────────
    console.log("\n  Mallory — a real, authenticated household who does not own the meal:");

    const malloryCookie = await login(base, nameB, password);
    check("Mallory can log in (she is a legitimate user, not a broken one)", malloryCookie !== null);

    const cross = await linkTemplate(base, aliceMeal.id, malloryCookie, { templateId: template.id });
    check("authenticated NON-OWNER on Alice's meal → 404", cross.status === 404, `got ${cross.status}`);
    check(
      "…and it is 404, not 403 — the guard is not an existence oracle",
      cross.status !== 403,
      "403 confirms the row exists and re-opens enumeration",
    );

    const crossSource = await linkTemplate(base, aliceMeal.id, malloryCookie, { sourceType: "ready_meal" });
    check("non-owner sourceType mutation → 404", crossSource.status === 404, `got ${crossSource.status}`);

    // Mallory's OWN meal still works — proving the guard blocks the attack, not the feature.
    const own = await linkTemplate(base, malloryMeal.id, malloryCookie, { templateId: template.id });
    check("Mallory linking HER OWN meal → 200 (the guard blocks the attack, not the household)", own.status === 200, `got ${own.status}`);

    // ── SEQUENTIAL ID ENUMERATION — the assertion this task exists for ────────────────────────────
    console.log("\n  Mallory sweeps sequential meal ids (the actual exploit):");

    const sweepLow = Math.max(1, aliceMeal.id - 6);
    const sweepIds: number[] = [];
    for (let id = sweepLow; id <= aliceMeal.id + 2; id++) sweepIds.push(id);

    const statuses = new Map<number, number>();
    const bodies = new Set<string>();
    for (const id of sweepIds) {
      if (id === malloryMeal.id) continue; // her own row is legitimately hers; not part of the attack
      const r = await linkTemplate(base, id, malloryCookie, { templateId: template.id, sourceType: "ready_meal" });
      statuses.set(id, r.status);
      bodies.add(`${r.status}:${await r.text()}`);
    }

    const allRefused = Array.from(statuses.values()).every((s) => s === 404);
    check(
      `enumerating ids ${sweepLow}–${aliceMeal.id + 2} as a hostile household → every response 404`,
      allRefused,
      Array.from(statuses.entries())
        .filter(([, s]) => s !== 404)
        .map(([id, s]) => `id ${id} → ${s}`)
        .join(", "),
    );

    // Real rows and non-existent rows must be INDISTINGUISHABLE. If they differ, the sweep still
    // maps which meal ids exist — the write is blocked and the oracle survives.
    check(
      "…and existing rows are indistinguishable from non-existent ones (one unique response, no oracle)",
      bodies.size === 1,
      `${bodies.size} distinct responses leaked which ids are real: ${Array.from(bodies).join(" / ")}`,
    );

    // THE assertion. Not one byte of anyone's meal changed.
    const after = await snapshot([...aliceIds, malloryMeal.id]);
    const aliceBefore = before.split(" | ").filter((s) => aliceIds.includes(Number(s.split(":")[0])));
    const aliceAfter = after.split(" | ").filter((s) => aliceIds.includes(Number(s.split(":")[0])));
    check(
      "…and NOT ONE of Alice's meal rows was mutated by the sweep",
      JSON.stringify(aliceBefore) === JSON.stringify(aliceAfter),
      `before: ${aliceBefore.join(", ")}\n      after:  ${aliceAfter.join(", ")}`,
    );

    // ── THE OWNER — existing functionality must be intact ────────────────────────────────────────
    console.log("\n  Alice — the owner. Existing functionality must be untouched:");

    const aliceCookie = await login(base, nameA, password);
    check("Alice can log in", aliceCookie !== null);

    const ownerLink = await linkTemplate(base, aliceMeal.id, aliceCookie, { templateId: template.id });
    check("OWNER links her own meal to an explicit template → 200", ownerLink.status === 200, `got ${ownerLink.status}`);

    const [linked] = await db.select().from(meals).where(eq(meals.id, aliceMeal.id));
    check("…and the link actually persisted (mealTemplateId is set)", linked?.mealTemplateId === template.id, `mealTemplateId=${linked?.mealTemplateId}`);

    const ownerSource = await linkTemplate(base, aliceMeal.id, aliceCookie, {
      templateId: template.id,
      sourceType: "ready_meal",
    });
    check("OWNER sets sourceType → 200", ownerSource.status === 200, `got ${ownerSource.status}`);

    const [sourced] = await db.select().from(meals).where(eq(meals.id, aliceMeal.id));
    check("…and sourceType persisted", sourced?.mealSourceType === "ready_meal", `mealSourceType=${sourced?.mealSourceType}`);

    // The auto-create branch: no templateId supplied → the route creates/reuses a template by name.
    const autoCreate = await linkTemplate(base, aliceMeal2.id, aliceCookie, {});
    check("OWNER links with NO templateId → 200 (auto-create-by-name branch still works)", autoCreate.status === 200, `got ${autoCreate.status}`);

    const [auto] = await db.select().from(meals).where(eq(meals.id, aliceMeal2.id));
    check("…and a template was created and linked", typeof auto?.mealTemplateId === "number", `mealTemplateId=${auto?.mealTemplateId}`);
    if (typeof auto?.mealTemplateId === "number") createdTemplateIds.push(auto.mealTemplateId);

    // A meal that does not exist must look exactly like one you do not own.
    const missing = await linkTemplate(base, 2_000_000_000, aliceCookie, { templateId: template.id });
    check("a non-existent meal → 404 (same as a meal you don't own)", missing.status === 404, `got ${missing.status}`);
  } catch (err) {
    console.error(`\n  ! the test could not complete. Child process output:\n${output.slice(-1500)}`);
    throw err;
  } finally {
    if (child?.pid) {
      try {
        process.kill(-child.pid, "SIGKILL"); // the GROUP — killing npx alone orphans the server
      } catch {
        child.kill("SIGKILL");
      }
    }
    await db.delete(meals).where(inArray(meals.id, [...aliceIds, malloryMeal.id])).catch(() => {});
    await db.delete(mealTemplates).where(inArray(mealTemplates.id, createdTemplateIds)).catch(() => {});
    await db.delete(users).where(inArray(users.id, [alice.id, mallory.id])).catch(() => {});
  }
}

async function main(): Promise<void> {
  console.log("\nTRUST1-S3A — a household may mutate only the meals it owns\n");

  sourceAudit();
  await endToEnd();

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nTRUST1-S3A test crashed:", err);
  process.exit(1);
});
