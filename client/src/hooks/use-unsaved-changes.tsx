// PX1-W0 — the canonical unsaved-changes guard.
//
// Profile is the only surface in THA with a dirty→Save model, and it carries FOUR
// independent dirty flags behind FOUR separate "Save" buttons. Everywhere else in
// the product commits on interaction. So the household — having learned everywhere
// else that THA saves as you go — edits two sections, presses one Save, walks away,
// and silently loses the other. There was no `beforeunload` and no route guard
// anywhere in the client (fnd-px-persistence-model-split).
//
// This is the guard, not a redesign of the save model. The four sections keep their
// own Save buttons; they simply declare their dirty state to one registry, and the
// page asks before letting the household leave with work in it.
//
// Two exits are covered:
//   • Leaving the app (reload, close, and Profile's own back button, which does a
//     full `window.location.href` assignment) → `beforeunload`, the browser's prompt.
//   • Leaving in-app (bottom nav, any Link, any `navigate()`) → wouter routes
//     through `history.pushState`, which it patches at module load to dispatch its
//     own event (wouter/esm/use-browser-location.js:48–75). Wrapping that method
//     while — and only while — there is unsaved work lets us hold the navigation,
//     ask, and then replay the EXACT call we withheld. Wouter never sees the
//     blocked attempt, so it cannot desynchronise from the URL.
//
// The browser's own Back button (popstate) is not guarded: blocking it requires
// pushing a decoy history entry, which is its own class of defect. Recorded rather
// than papered over.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean;
  setSectionDirty: (key: string, dirty: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

/** Wraps a surface whose sections each hold their own dirty state. */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirtySections, setDirtySections] = useState<string[]>([]);

  const setSectionDirty = useCallback((key: string, dirty: boolean) => {
    setDirtySections((prev) => {
      const present = prev.includes(key);
      if (dirty === present) return prev;
      return dirty ? [...prev, key] : prev.filter((k) => k !== key);
    });
  }, []);

  const value = useMemo(
    () => ({ hasUnsavedChanges: dirtySections.length > 0, setSectionDirty }),
    [dirtySections, setSectionDirty],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
  );
}

/**
 * Declares one section's unsaved state. Each section keeps its own `dirty` flag and
 * its own Save button; this only makes that flag visible to the page's guard.
 */
export function useUnsavedSection(key: string, isDirty: boolean) {
  const ctx = useContext(UnsavedChangesContext);
  const setSectionDirty = ctx?.setSectionDirty;

  useEffect(() => {
    setSectionDirty?.(key, isDirty);
  }, [setSectionDirty, key, isDirty]);

  useEffect(() => {
    return () => setSectionDirty?.(key, false);
  }, [setSectionDirty, key]);
}

export interface UnsavedChangesGuard {
  hasUnsavedChanges: boolean;
  /** True while a navigation is being held pending the household's answer. */
  isPrompting: boolean;
  /** Run an action (e.g. a back button) through the guard. */
  guard: (action: () => void) => void;
  /** Discard the unsaved work and let the held navigation through. */
  leave: () => void;
  /** Cancel the held navigation and stay on the page. */
  stay: () => void;
}

/**
 * Installed once, by the page that owns the sections. Returns the state a
 * confirmation dialog needs — the page renders the canonical `ui/alert-dialog`;
 * this hook invents no UI of its own.
 */
export function useUnsavedChangesGuard(): UnsavedChangesGuard {
  const ctx = useContext(UnsavedChangesContext);
  const hasUnsavedChanges = ctx?.hasUnsavedChanges ?? false;

  const [isPrompting, setIsPrompting] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  // Set once the household has answered "leave". Profile's own back button exits by
  // assigning `window.location.href`, which would otherwise raise the browser's
  // prompt a second time for a question they have already been asked.
  const isLeaving = useRef(false);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLeaving.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // `navigateThroughWouter` is wouter's own patched pushState: calling it both
    // pushes the entry and dispatches the event wouter's router listens for. We
    // withhold the call, not the URL.
    const navigateThroughWouter = window.history.pushState;
    window.history.pushState = function (
      this: History,
      ...args: Parameters<History["pushState"]>
    ) {
      const to = args[2];
      if (to == null) return navigateThroughWouter.apply(this, args);
      pendingAction.current = () => navigateThroughWouter.apply(window.history, args);
      setIsPrompting(true);
    };

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.history.pushState = navigateThroughWouter;
    };
  }, [hasUnsavedChanges]);

  const guard = useCallback(
    (action: () => void) => {
      if (!hasUnsavedChanges) {
        action();
        return;
      }
      pendingAction.current = action;
      setIsPrompting(true);
    },
    [hasUnsavedChanges],
  );

  const leave = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setIsPrompting(false);
    isLeaving.current = true;
    // The held action was captured against the REAL pushState, so replaying it
    // cannot re-enter the guard.
    action?.();
  }, []);

  const stay = useCallback(() => {
    pendingAction.current = null;
    setIsPrompting(false);
    isLeaving.current = false;
  }, []);

  return { hasUnsavedChanges, isPrompting, guard, leave, stay };
}
