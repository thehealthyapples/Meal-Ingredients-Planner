/**
 * TEMP — Nutrition Boost ingredient-row provenance API verification
 *
 * Exercises the server contract the new dialog-level provenance UI depends on:
 *   1. POST /api/uplift/accept returns `applications` with status 'accepted'
 *   2. GET /api/meals/:id/uplift-applications returns the persisted row (reopen path)
 *   3. DELETE /api/uplift/applications/:id strips the ingredient + clears the row
 *   4. GET uplift-applications for a system meal still 403s (auth unchanged)
 *   5. System-meal accept forks and keys applications by the fork id
 *
 * Creates a throwaway beta user + meals, deletes everything at the end.
 * Run with: npx tsx server/tests/tmp_boost_provenance_api_test.ts
 */

import { storage } from "../storage";
import { hashPassword } from "../auth";
import { db } from "../db";
import { users, meals, mealUpliftApplications } from "@shared/schema";
import { eq } from "drizzle-orm";

const BASE = "http://localhost:5000";
const USERNAME = `tmp_boost_provenance_${Date.now()}@test.local`;

let passed = 0;
let failed = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`, detail !== undefined ? JSON.stringify(detail) : "");
    failed++;
  }
}

async function main() {
  // ── Setup: temp beta user + owned meal ─────────────────────────────────────
  const user = await storage.createUser({
    username: USERNAME,
    password: await hashPassword("TmpTest!2026"),
  });
  await db.update(users).set({ isBetaUser: true }).where(eq(users.id, user.id));

  const meal = await storage.createMeal(user.id, {
    name: "TMP Provenance Test Soup",
    ingredients: ["pasta", "tomato sauce"],
    instructions: ["Simmer."],
    servings: 2,
  } as any);

  const loginRes = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: "TmpTest!2026" }),
  });
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0] ?? "";
  check("login succeeds for temp beta user", loginRes.status === 200 && !!cookie, loginRes.status);
  const authed = (path: string, init: RequestInit = {}) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Cookie: cookie, ...(init.headers ?? {}) },
    });

  const forkIds: number[] = [];
  try {
    // ── 1. POST accept returns applications (pumpkin seeds) ──────────────────
    const acceptRes = await authed("/api/uplift/accept", {
      method: "POST",
      body: JSON.stringify({
        mealId: meal.id,
        suggestions: [
          {
            ruleId: "tmp-test-rule",
            ruleName: "TMP Test Rule",
            ingredient: "pumpkin seeds",
            action: "add",
            quantity: "1 tbsp",
            explanation: "test",
          },
        ],
      }),
    });
    const acceptBody = await acceptRes.json();
    check("POST accept → 201", acceptRes.status === 201, acceptRes.status);
    check("POST response includes applications array", Array.isArray(acceptBody.applications), acceptBody);
    check(
      "application row is status 'accepted' for pumpkin seeds",
      acceptBody.applications?.[0]?.status === "accepted" &&
        acceptBody.applications?.[0]?.ingredient === "pumpkin seeds",
      acceptBody.applications?.[0]
    );
    check("ingredient added to meal", acceptBody.added?.includes("pumpkin seeds"), acceptBody.added);
    const appId = acceptBody.applications[0].id as number;

    // ── 2. GET uplift-applications returns persisted row (reopen path) ───────
    const getRes = await authed(`/api/meals/${meal.id}/uplift-applications`);
    const getBody = await getRes.json();
    check("GET uplift-applications → 200", getRes.status === 200, getRes.status);
    check(
      "GET returns the accepted pumpkin seeds row",
      getBody.applications?.some(
        (a: any) => a.id === appId && a.ingredient === "pumpkin seeds" && a.status === "accepted"
      ),
      getBody.applications
    );

    // ── 3. DELETE removes ingredient + clears provenance ─────────────────────
    const delRes = await authed(`/api/uplift/applications/${appId}`, { method: "DELETE" });
    const delBody = await delRes.json();
    check("DELETE application → 200, ingredientRemoved", delRes.status === 200 && delBody.ingredientRemoved === true, delBody);
    const mealAfter = await storage.getMeal(meal.id);
    check(
      "pumpkin seeds removed from meal ingredients",
      !mealAfter!.ingredients.some((i) => i.toLowerCase().includes("pumpkin seeds")),
      mealAfter!.ingredients
    );
    check(
      "other ingredients untouched",
      mealAfter!.ingredients.includes("pasta") && mealAfter!.ingredients.includes("tomato sauce"),
      mealAfter!.ingredients
    );
    const getAfterDel = await (await authed(`/api/meals/${meal.id}/uplift-applications`)).json();
    check(
      "GET after delete no longer returns the row",
      !getAfterDel.applications?.some((a: any) => a.id === appId),
      getAfterDel.applications
    );

    // ── Repeat with cannellini beans ──────────────────────────────────────────
    const beansRes = await authed("/api/uplift/accept", {
      method: "POST",
      body: JSON.stringify({
        mealId: meal.id,
        suggestions: [
          { ruleId: "tmp-test-rule", ruleName: "TMP Test Rule", ingredient: "cannellini beans", action: "add", explanation: "test" },
        ],
      }),
    });
    const beansBody = await beansRes.json();
    check(
      "cannellini beans accepted with application row",
      beansRes.status === 201 && beansBody.applications?.[0]?.status === "accepted",
      beansBody.applications?.[0]
    );

    // ── 4. System meal GET still 403s ─────────────────────────────────────────
    const [systemMeal] = await db.select().from(meals).where(eq(meals.isSystemMeal, true)).limit(1);
    if (systemMeal) {
      const sysGet = await authed(`/api/meals/${systemMeal.id}/uplift-applications`);
      check("GET uplift-applications for system meal → 403 (auth unchanged)", sysGet.status === 403, sysGet.status);

      // ── 5. System-meal accept forks; applications keyed by fork id ─────────
      const forkRes = await authed("/api/uplift/accept", {
        method: "POST",
        body: JSON.stringify({
          mealId: systemMeal.id,
          suggestions: [
            { ruleId: "tmp-test-rule", ruleName: "TMP Test Rule", ingredient: "pumpkin seeds", action: "add", explanation: "test" },
          ],
        }),
      });
      const forkBody = await forkRes.json();
      if (forkBody.mealId && forkBody.mealId !== systemMeal.id) forkIds.push(forkBody.mealId);
      check(
        "system meal accept forks (forkedFromMealId set, new mealId)",
        forkRes.status === 201 && forkBody.forkedFromMealId === systemMeal.id && forkBody.mealId !== systemMeal.id,
        { mealId: forkBody.mealId, forkedFromMealId: forkBody.forkedFromMealId }
      );
      check(
        "fork applications keyed by fork mealId",
        forkBody.applications?.every((a: any) => a.mealId === forkBody.mealId),
        forkBody.applications
      );
      const forkGet = await (await authed(`/api/meals/${forkBody.mealId}/uplift-applications`)).json();
      check(
        "GET on fork returns accepted row",
        forkGet.applications?.some((a: any) => a.ingredient === "pumpkin seeds" && a.status === "accepted"),
        forkGet.applications
      );
    } else {
      console.log("  – no system meal in dev DB; skipped 403/fork checks");
    }
  } finally {
    // ── Cleanup: applications → meals → user ─────────────────────────────────
    await db.delete(mealUpliftApplications).where(eq(mealUpliftApplications.userId, user.id));
    for (const id of [meal.id, ...forkIds]) {
      await db.delete(meals).where(eq(meals.id, id));
    }
    await db.delete(users).where(eq(users.id, user.id));
    console.log(`\nCleanup done (user ${user.id}, meals ${[meal.id, ...forkIds].join(", ")})`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Test run error:", e);
  process.exit(1);
});
