/**
 * test-intelligence-platform.ts
 * =============================
 * Verifies the INT1 Intelligence Platform foundation: capability discovery, the
 * Intent Engine pipeline (locate → validate → permission → confirm → invoke), the
 * permission model, honest gaps, and the foundation "not_executable" state.
 *
 * These tests assert ORCHESTRATION, not business logic — the platform owns none.
 *
 * Run with: npx tsx server/tests/test-intelligence-platform.ts
 */

import type { User } from "../../shared/schema.js";
import {
  IntelligencePlatform,
  CapabilityRegistry,
  canInvokeCapability,
  confirmationFor,
  resolveContext,
  type IntelligenceContext,
} from "../intelligence/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

const asUser = (over: Partial<User>): User => over as User;

const userCtx: IntelligenceContext = { role: "user", userId: "1", premium: false };
const adminCtx: IntelligenceContext = { role: "admin", userId: "2", premium: true };
const developerCtx: IntelligenceContext = { role: "developer", userId: "3" };

async function main(): Promise<void> {
  const platform = new IntelligencePlatform(new CapabilityRegistry());

  section("Capability discovery (one canonical registry)");
  const caps = platform.listCapabilities();
  assert(caps.length === 13, "all 13 canonical capabilities registered", `got ${caps.length}`);
  assert(platform.getCapability("planner") !== undefined, "planner capability discoverable");
  assert(platform.getCapability("nutrition-knowledge") !== undefined, "nutrition-knowledge capability discoverable");
  assert(platform.getCapability("does-not-exist") === undefined, "unknown capability is absent");
  assert(
    caps.every((c) => c.availability !== "available"),
    "no capability is executable yet — none 'available' (foundation: no handler bound)",
  );
  assert(
    platform.getCapability("developer")!.availability === "never",
    "developer capability is 'never' in the user-facing plane (TIP1 §7 isolation)",
  );

  section("Context resolution maps existing access.ts roles");
  assert(resolveContext(asUser({ id: 1, role: "user", subscriptionTier: "free" })).role === "user", "user role resolves to 'user'");
  assert(resolveContext(asUser({ id: 2, role: "admin", subscriptionTier: "premium" })).role === "admin", "admin role resolves to 'admin'");
  assert(resolveContext(null).role === "user", "anonymous defaults to 'user'");
  assert(resolveContext(asUser({ id: 2, role: "admin", subscriptionTier: "premium" })).premium === true, "premium flag derived from access.ts");

  section("Foundation state: registered capability returns honest not_executable");
  const readPlanner = await platform.handle({ verb: "read", capabilityId: "planner" }, userCtx);
  assert(readPlanner.status === "not_executable", "read planner → not_executable (no handler bound)", readPlanner.status);
  assert(/registered but has no execution handler/.test(readPlanner.message), "message honestly explains the gap");

  section("Closed allow-list: unknown capability & unsupported verb");
  const unknown = await platform.handle({ verb: "read", capabilityId: "nope" }, userCtx);
  assert(unknown.status === "unknown_capability", "unknown capability rejected", unknown.status);
  const unsupported = await platform.handle({ verb: "order", capabilityId: "planner" }, userCtx);
  assert(unsupported.status === "unsupported_intent", "unsupported verb on planner rejected", unsupported.status);

  section("Honest gaps (TIP2 §2.4)");
  const orderShopping = await platform.handle({ verb: "order", capabilityId: "shopping" }, userCtx);
  assert(orderShopping.status === "gap", "order shopping → honest gap (no order owner)", orderShopping.status);
  assert(/not owned by any service yet/.test(orderShopping.message), "gap message is honest");

  section("Permission enforcement (server-side boundary)");
  const userAdmin = await platform.handle({ verb: "read", capabilityId: "administration" }, userCtx);
  assert(userAdmin.status === "denied", "user denied admin capability", userAdmin.status);
  const adminAdmin = await platform.handle({ verb: "read", capabilityId: "administration" }, adminCtx);
  assert(adminAdmin.status === "not_executable", "admin permitted admin capability (then foundation gap)", adminAdmin.status);
  const userDev = await platform.handle({ verb: "read", capabilityId: "developer" }, userCtx);
  assert(userDev.status === "denied", "user denied developer (never-in-user-plane) capability", userDev.status);
  const adminDev = await platform.handle({ verb: "read", capabilityId: "developer" }, adminCtx);
  assert(adminDev.status === "denied", "admin denied developer capability (distinct profiles)", adminDev.status);
  const devDev = await platform.handle({ verb: "read", capabilityId: "developer" }, developerCtx);
  assert(devDev.status === "denied", "developer capability is never exposed via this plane (availability never)", devDev.status);

  section("Knowledge-class & role gates (unit)");
  const adminCap = platform.getCapability("administration")!;
  assert(canInvokeCapability(adminCtx, adminCap).allowed, "admin can invoke admin capability");
  assert(!canInvokeCapability(userCtx, adminCap).allowed, "user cannot invoke admin capability");

  section("Confirmation model (deterministic, server-side)");
  const planner = platform.getCapability("planner")!;
  assert(confirmationFor(planner, "read") === "none", "read → no confirmation");
  assert(confirmationFor(planner, "add") === "light", "add → light confirmation");
  assert(confirmationFor(planner, "replace") === "required", "replace → required confirmation");
  assert(confirmationFor(planner, "delete") === "strong", "delete → strong confirmation");
  assert(confirmationFor(adminCap, "add") === "strong", "admin mutation → always strong");

  section("Confirmation gate halts a state-changing intent until confirmed");
  const addUnconfirmed = await platform.handle({ verb: "add", capabilityId: "shopping" }, userCtx);
  assert(addUnconfirmed.status === "confirmation_required", "add shopping (unconfirmed) → confirmation_required", addUnconfirmed.status);
  assert(addUnconfirmed.confirmation === "light", "confirmation tier reported as light");
  const addConfirmed = await platform.handle({ verb: "add", capabilityId: "shopping" }, userCtx, { confirmed: true });
  assert(addConfirmed.status === "not_executable", "add shopping (confirmed) → proceeds to foundation gap", addConfirmed.status);

  section("Future handler binding (extension point — proves the contract)");
  const isolated = new IntelligencePlatform(new CapabilityRegistry());
  let serviceCalled = false;
  isolated.registerHandler("planner", async () => {
    serviceCalled = true; // a real handler would delegate to meal-service.ts here
    return { ok: true };
  });
  assert(isolated.getCapability("planner")!.availability === "available", "binding a handler flips availability to 'available'");
  const executed = await isolated.handle({ verb: "read", capabilityId: "planner" }, userCtx);
  assert(executed.status === "ok" && serviceCalled, "bound handler executes via the pipeline", executed.status);

  // --- summary ---
  console.log(`\n${"=".repeat(48)}`);
  console.log(`Intelligence Platform foundation: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
