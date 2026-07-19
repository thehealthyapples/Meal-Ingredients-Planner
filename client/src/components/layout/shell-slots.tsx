// NAV1 — the shell's slot contracts.
//
// These live in their own module rather than in `app-shell.tsx` for one concrete
// reason: `app-shell` imports `WorkspaceHeader`, and `WorkspaceHeader` must be
// able to register its own presence with the shell. Putting the contracts in
// either of those two files makes them import each other, and a cycle between a
// component and the layout that mounts it is the kind of thing that works in dev
// and fails on a production build's hoisting order.
//
// Nothing here renders the shell. It only declares how a page talks to it.

import {
  createContext,
  useContext,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/** A shell region a page can occupy: register on mount, release on unmount. */
export interface SlotPresence {
  register: () => () => void;
}

/* ── Header presence ─────────────────────────────────────────────────────────
 *
 * While at least one PAGE header is mounted, the shell's default header stands
 * down, so there is exactly one header on screen and never two.
 */
export const PageHeaderPresenceContext = createContext<SlotPresence | null>(null);

export function useRegisterPageHeader(enabled: boolean) {
  const presence = useContext(PageHeaderPresenceContext);
  const register = presence?.register;
  useLayoutEffect(() => {
    if (!enabled || !register) return;
    return register();
  }, [enabled, register]);
}

/* ── The contextual rail ─────────────────────────────────────────────────────
 *
 * A portal, not lifted state, and the reason is not style: a room's actions are
 * arbitrary JSX whose identity changes on every render, so pushing them through
 * `useState` sets state during render and loops forever. The header slot has
 * used a portal since PX1 for the same reason; this follows it.
 */
export const RoomActionsSlotContext = createContext<HTMLElement | null>(null);
export const RoomActionsPresenceContext = createContext<SlotPresence | null>(null);

/**
 * Declares the current room's contextual actions — the actions of the room you
 * are standing in, never navigation to another one.
 *
 * Renders into the shell's desktop rail, and renders nothing below `lg`, where
 * the room already owns its full width.
 */
export function RoomActions({ children }: { children: ReactNode }) {
  const slot = useContext(RoomActionsSlotContext);
  const presence = useContext(RoomActionsPresenceContext);
  const register = presence?.register;

  useLayoutEffect(() => {
    if (!register) return;
    return register();
  }, [register]);

  return slot ? createPortal(children, slot) : null;
}
