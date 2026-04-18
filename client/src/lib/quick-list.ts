// Canonical Quick List write path.
// All surfaces that write pending ingredients for /list to pick up must go through here.
// list-page.tsx reads PENDING_LIST_KEY on mount and supports both payload formats.

const PENDING_LIST_KEY = "tha-pending-list-ingredients";

export type PendingListPayload =
  | string[]                                    // version 1 — plain ingredient names
  | { version: 2; items: { productName: string; [k: string]: unknown }[] }; // version 2 — parsed

export function writePendingIngredients(payload: PendingListPayload): void {
  try {
    localStorage.setItem(PENDING_LIST_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private browse quota, etc.) — silently skip
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
