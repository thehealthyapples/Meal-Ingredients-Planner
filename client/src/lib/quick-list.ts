// Canonical Quick List write path.
// All surfaces that write pending ingredients must go through here.
//
// The reader is shopping-workspace-page.tsx, which reads PENDING_LIST_KEY on
// mount, clears it, and supports both payload formats. (This comment previously
// named list-page.tsx and the /list route; both were retired by PROD2 — the
// workspace had already taken the handoff over, leaving list-page a dead rival.)

const PENDING_LIST_KEY = "tha-pending-list-ingredients";

export type PendingListPayload =
  | string[]                                    // version 1 - plain ingredient names
  | { version: 2; items: { productName: string; [k: string]: unknown }[] }; // version 2 - parsed

export function writePendingIngredients(payload: PendingListPayload): void {
  try {
    localStorage.setItem(PENDING_LIST_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private browse quota, etc.) - silently skip
  }
}

export function appendPendingIngredient(name: string): void {
  try {
    const raw = localStorage.getItem(PENDING_LIST_KEY);
    let existing: string[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed as string[];
      }
      // If the existing payload is version 2, we can't safely append a raw string
      // to it; start fresh as version 1 with this ingredient.
    }
    if (!existing.includes(name)) {
      localStorage.setItem(PENDING_LIST_KEY, JSON.stringify([...existing, name]));
    }
  } catch {
    // silently skip
  }
}
