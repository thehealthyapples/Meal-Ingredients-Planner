/**
 * Pantry Write Handler (COMP_ACT1 — Companion Action Activation)
 * ==============================================================
 * Makes the `add` and `delete` verbs on the `pantry` capability executable, by
 * delegating to the existing Pantry owner (`storage.addPantryItem` /
 * `storage.deletePantryItem`) through a {@link PantryWritePort}. It is the write-side
 * counterpart of the read-only Pantry binding (INT8, see pantry-read-handler.ts).
 *
 * OWNERSHIP: both owner methods are user-scoped (they take the caller's `userId`), so
 * ownership is enforced by the owner itself — exactly as `POST /api/pantry` and
 * `DELETE /api/pantry/:id` rely on. The handler adds no cross-user path.
 *
 * HARD BOUNDARIES:
 *   • TWO VERBS. Only "add" and "delete" execute here; anything else is an honest gap.
 *   • DELEGATION ONLY. No pantry business rule is re-implemented here.
 *   • NOTHING GUESSED. A missing ingredient/category (add) or id (delete) is an honest
 *     gap, never a silent no-op or a fabricated success.
 *   • CONFIRMATION IS ALREADY ENFORCED UPSTREAM by the Intent Engine's CONFIRM step
 *     (add → light, delete → strong; server-resolved in permissions.ts).
 */

import {
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { PantryWritePort } from "./pantry-write-port.js";
import { toInt, requireUserId, gap } from "./_read-kit.js";
import type { UserPantryItem } from "@shared/schema";

/** The categories the live `POST /api/pantry` route accepts — mirrored, not relaxed. */
const VALID_CATEGORIES = new Set(["larder", "fridge", "freezer", "household", "fruit", "pet"]);

/** The result of a successful "add" — the stored pantry item the owner returned. */
export interface PantryAddResult {
  readonly scope: "add";
  readonly item: {
    readonly id: number;
    readonly ingredientKey: string;
    readonly displayName: string | null;
    readonly category: string;
  };
}

/** The result of a successful "delete" — the pantry item id the owner removed. */
export interface PantryDeleteResult {
  readonly scope: "delete";
  readonly id: number;
}

function toAddResult(item: UserPantryItem): PantryAddResult {
  return {
    scope: "add",
    item: {
      id: item.id,
      ingredientKey: item.ingredientKey,
      displayName: item.displayName,
      category: item.category,
    },
  };
}

async function handleAdd(
  intent: Intent,
  userId: number,
  port: PantryWritePort,
): Promise<PantryAddResult> {
  const params = intent.parameters ?? {};
  const ingredient = typeof params.ingredient === "string" ? params.ingredient.trim() : "";
  const category = typeof params.category === "string" ? params.category.trim() : "";
  if (!ingredient) {
    throw gap("Adding a pantry item needs { ingredient } — the item to add to your pantry.");
  }
  if (!VALID_CATEGORIES.has(category)) {
    throw gap(
      `Adding a pantry item needs a valid { category }. Supported: larder, fridge, freezer, household, fruit, pet.`,
    );
  }
  const notes = typeof params.notes === "string" && params.notes.trim() ? params.notes.trim() : undefined;
  const displayName = typeof params.displayName === "string" && params.displayName.trim()
    ? params.displayName.trim()
    : ingredient;
  const needQuantityValue = typeof params.needQuantityValue === "number" ? params.needQuantityValue : null;
  const needUnit = typeof params.needUnit === "string" ? params.needUnit : null;

  const item = await port.addPantryItem(
    userId,
    ingredient,
    category,
    notes,
    displayName,
    undefined,
    needQuantityValue,
    needUnit,
  );
  return toAddResult(item);
}

async function handleDelete(
  intent: Intent,
  userId: number,
  port: PantryWritePort,
): Promise<PantryDeleteResult> {
  const params = intent.parameters ?? {};
  const id = toInt(params.id);
  if (id === undefined) {
    throw gap("Deleting a pantry item needs { id } — the pantry item to remove.");
  }
  // Own-data only by construction: the owner method scopes the delete to this userId.
  await port.deletePantryItem(userId, id);
  return { scope: "delete", id };
}

/**
 * Create the pantry write handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner).
 */
export function createPantryWriteHandler(
  resolvePort: () => Promise<PantryWritePort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb !== "add" && intent.verb !== "delete") {
      throw gap(
        `Pantry is bound to the Intelligence Platform for write on "add" and "delete": "${intent.verb}" is not executable via the platform yet.`,
      );
    }
    const userId = requireUserId(context, "Pantry");
    const port = await resolvePort();
    if (intent.verb === "delete") return handleDelete(intent, userId, port);
    return handleAdd(intent, userId, port);
  };
}
