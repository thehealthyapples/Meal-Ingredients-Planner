import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface FirstVisitHintProps {
  /** Unique key for this area — used to persist dismissed state in localStorage */
  areaKey: string;
  /** The hint message to display */
  message: string;
  className?: string;
}

/**
 * Displays a single, dismissible hint the first time a user visits an area.
 * Once dismissed it never reappears. Dismissal is stored in localStorage.
 * Aligned with the Healthy Apples philosophy: calm, non-intrusive, one-time.
 */
export function FirstVisitHint({ areaKey, message, className }: FirstVisitHintProps) {
  const storageKey = `tha_visited_${areaKey}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen) setVisible(true);
    } catch {
      // localStorage unavailable — silently skip
    }
  }, [storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 mb-3 ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="text-base shrink-0" aria-hidden="true">🍎</span>
      <p className="flex-1 text-sm text-foreground/75">{message}</p>
      <button
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        onClick={dismiss}
        aria-label="Dismiss hint"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
