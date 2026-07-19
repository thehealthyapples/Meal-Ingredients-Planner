// NAV1 — the one way to open the Companion from elsewhere in the house.
//
// The Companion's open state is local to `FloatingAssistant`, which is correct:
// one assistant, one channel, one piece of state (PHASE5D). NAV1 needed a
// Companion entry in the permanent header without lifting that state into the
// shell — lifting it would put the panel's lifecycle in a component that has no
// business knowing about it, and would give the Companion a second owner.
//
// So the header ASKS rather than controls. This is the same idiom the bottom nav
// already uses to open a room's workspace drawer (`tha:open-workspace`,
// nav-bar.tsx) — an existing pattern followed, not a new one invented.
//
// The constant lives in its own module so the header does not have to import
// `FloatingAssistant` (a ~1,900-line component) merely to name a string.

export const COMPANION_OPEN_EVENT = "tha:open-companion";

/** Ask the Companion to open. No-op if it is not mounted. */
export function openCompanion() {
  window.dispatchEvent(new CustomEvent(COMPANION_OPEN_EVENT));
}
