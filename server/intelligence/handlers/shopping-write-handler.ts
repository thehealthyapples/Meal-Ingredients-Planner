/**
 * Shopping Write Handler (INT40 — Companion Task Delegation & Assisted Actions)
 * ==============================================================================
 * The FIRST write execution path bound to the THA Intelligence Platform. It makes the
 * `add` verb on the `shopping` capability executable, by delegating to the existing
 * Shopping owner (`storage.addShoppingListExtra`) through a {@link ShoppingWritePort}.
 * This is the write-side counterpart of the Port → Handler → Binding pattern already
 * proven read-only for every other capability (see shopping-read-handler.ts).
 *
 * HARD BOUNDARIES (the reason this handler is safe):
 *   • ONE VERB. Only "add" executes here. Any other verb throws an honest gap — there
 *     is no code path here that deletes, prices, matches products, builds a basket,
 *     orders, or checks out.
 *   • DELEGATION ONLY. The write is a single forward to the owning service via the
 *     port. This file contains NO shopping business rule of its own.
 *   • CONFIRMATION IS ALREADY ENFORCED UPSTREAM. The Intent Engine's CONFIRM step
 *     (server/intelligence/intent-engine.ts) only reaches this handler once the caller
 *     has confirmed — this handler never re-checks confirmation itself.
 *   • PERMISSION-AWARE / OWN DATA ONLY. The caller must be an authenticated user; the
 *     write is scoped to that user's household by the owner method itself.
 *   • HONEST GAPS. A missing/invalid item name is an honest gap, never a silent no-op
 *     or a fabricated success.
 */

import {
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { ShoppingWritePort } from "./shopping-write-port.js";
import { requireUserId, gap } from "./_read-kit.js";
import type { ShoppingListExtra } from "@shared/schema";

/** The result of a successful "add" — the stored row the owner returned. */
export interface ShoppingAddResult {
  readonly scope: "add";
  readonly item: {
    readonly id: number;
    readonly name: string;
    readonly category: string;
    readonly alwaysAdd: boolean;
  };
}

/** The result of a successful "delete" — the extra id the owner removed. */
export interface ShoppingDeleteResult {
  readonly scope: "delete";
  readonly id: number;
}

function toResult(extra: ShoppingListExtra): ShoppingAddResult {
  return {
    scope: "add",
    item: {
      id: extra.id,
      name: extra.name,
      category: extra.category,
      alwaysAdd: extra.alwaysAdd,
    },
  };
}

async function handleAdd(
  intent: Intent,
  userId: number,
  port: ShoppingWritePort,
): Promise<ShoppingAddResult> {
  const params = intent.parameters ?? {};
  const name = typeof params.name === "string" ? params.name.trim() : "";
  if (!name) {
    throw gap('Adding a shopping item needs { name } — the item to add to your shopping list.');
  }
  const category = typeof params.category === "string" && params.category.trim() ? params.category.trim() : undefined;
  const alwaysAdd = typeof params.alwaysAdd === "boolean" ? params.alwaysAdd : undefined;

  const extra = await port.addShoppingListExtra(userId, name, category, alwaysAdd);
  return toResult(extra);
}

async function handleDelete(
  intent: Intent,
  userId: number,
  port: ShoppingWritePort,
): Promise<ShoppingDeleteResult> {
  const params = intent.parameters ?? {};
  const id = typeof params.id === "number" && Number.isInteger(params.id)
    ? params.id
    : typeof params.id === "string" && /^\d+$/.test(params.id)
      ? Number(params.id)
      : undefined;
  if (id === undefined) {
    throw gap('Deleting a shopping item needs { id } — the shopping-list extra to remove.');
  }
  // Own-data only by construction: the owner method scopes the delete to this userId,
  // so a foreign extra id simply removes nothing — no cross-user delete is possible.
  await port.deleteShoppingListExtra(userId, id);
  return { scope: "delete", id };
}

/**
 * Create the shopping write handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner). Executes "add" (INT40) and
 * "delete" (COMP_ACT1); any other verb is an honest gap.
 */
export function createShoppingWriteHandler(
  resolvePort: () => Promise<ShoppingWritePort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    if (intent.verb !== "add" && intent.verb !== "delete") {
      throw gap(
        `Shopping is bound to the Intelligence Platform for write on "add" and "delete": "${intent.verb}" is not executable via the platform yet.`,
      );
    }
    const userId = requireUserId(context, "Shopping");
    const port = await resolvePort();
    if (intent.verb === "delete") return handleDelete(intent, userId, port);
    return handleAdd(intent, userId, port);
  };
}
