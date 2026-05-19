/**
 * Staging bus — bridges scan-review acceptance to the proposal tray.
 *
 * emitStageProposal:
 *   Called by PlannerScanReview when a proposal is accepted.
 *   Writes directly to the proposal-tray sessionStorage key so the item
 *   survives even when IdlePanelContent is unmounted (it is, during scan-review
 *   mode). Also notifies any active in-memory listeners for live updates.
 *
 * subscribeStagingBus:
 *   Called by IdlePanelContent on mount. Returns an unsubscribe function.
 *   Handles live adds when the idle panel is open alongside a scan-review
 *   workflow that shares a single view (unlikely but safe to handle).
 */

const PROPOSAL_TRAY_KEY = "planner-proposal-tray";

interface StoredEntry {
  name: string;
  mealType: string;
}

type Listener = (name: string, mealType: string) => void;
const listeners: Listener[] = [];

export function subscribeStagingBus(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * Remove a single staged entry by exact name + mealType match.
 * Used when an already-approved proposal is re-edited with a new name,
 * so the old tray entry is replaced rather than duplicated.
 */
export function removeStageProposal(name: string, mealType: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    const raw = sessionStorage.getItem(PROPOSAL_TRAY_KEY);
    if (!raw) return;
    const existing: StoredEntry[] = (JSON.parse(raw) as unknown[]).filter(
      (s): s is StoredEntry =>
        typeof s === "object" && s !== null &&
        typeof (s as StoredEntry).name === "string" &&
        typeof (s as StoredEntry).mealType === "string",
    );
    const filtered = existing.filter(
      p => !(p.name.toLowerCase() === trimmed.toLowerCase() && p.mealType === mealType),
    );
    if (filtered.length === existing.length) return; // Nothing removed
    if (filtered.length === 0) {
      sessionStorage.removeItem(PROPOSAL_TRAY_KEY);
    } else {
      sessionStorage.setItem(PROPOSAL_TRAY_KEY, JSON.stringify(filtered));
    }
  } catch {}
}

export function emitStageProposal(name: string, mealType: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;

  // Persist to sessionStorage so the item survives mode switches and refreshes.
  // IdlePanelContent reads this key on mount — no extra wiring needed.
  try {
    const raw = sessionStorage.getItem(PROPOSAL_TRAY_KEY);
    const existing: StoredEntry[] = raw
      ? (JSON.parse(raw) as unknown[]).filter(
          (s): s is StoredEntry =>
            typeof s === "object" &&
            s !== null &&
            typeof (s as StoredEntry).name === "string" &&
            typeof (s as StoredEntry).mealType === "string",
        )
      : [];
    const isDup = existing.some(
      p =>
        p.name.toLowerCase() === trimmed.toLowerCase() &&
        p.mealType === mealType,
    );
    if (!isDup) {
      existing.push({ name: trimmed, mealType });
      sessionStorage.setItem(PROPOSAL_TRAY_KEY, JSON.stringify(existing));
    }
  } catch {}

  // Notify any active in-memory listeners (live update path).
  for (const fn of [...listeners]) fn(trimmed, mealType);
}
