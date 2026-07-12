// PHASE5C — Ambient Intelligence.
//
// The ONE ambient surface. Every page that has intelligence to show mounts this
// and nothing else, so intelligence looks, behaves and stays quiet the same way
// everywhere in THA.
//
// It owns NO intelligence. It fetches nothing of its own (it composes
// FoodOpportunitiesPanel, which shares the one canonical query key so TanStack
// dedupes the bundle across every mounted surface), and it RE-RANKS NOTHING: the
// Decision Engine already ordered, budgeted and suppressed this bundle
// (attention → learning → seen → arrival) and the client renders that order
// verbatim. Absorbing selection, ranking or budgeting here is precisely what
// DEC1 §3 forbids.
//
// CALM BEFORE CAPABILITY. The surface is collapsed by default — a single quiet
// row that a household may ignore forever. It renders nothing at all when there
// is nothing validated to say (never a placeholder, never a fabricated card).
//
// The ONE exception: a `critical` opportunity opens the surface itself. THA's
// closed critical allowlist has exactly one member — a product on the shopping
// list conflicting with a named household member's stored hard restriction — and
// a household must not have to click to discover it. This is a presentation
// response to an attention level the ENGINE assigned; no attention is derived,
// inflated or re-computed here (ATTN1 A1/A2, DEC1 §3.3).

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFoodOpportunities } from "@/hooks/use-food-opportunities";
import { FoodOpportunityCard } from "./FoodOpportunityCard";
import { focusRing, presentationFor } from "./intelligence-tokens";

export interface AmbientIntelligenceProps {
  /**
   * Which owning Business Domains to surface, selected from the bundle's own
   * `grouped` map (planner | pantry | shopping — grouped by OD1, not by us).
   *
   * Each domain has exactly ONE canonical page (Experience Principle 6): the
   * page where the thing the opportunity names actually lives. Omit `domains`
   * only on Home/Dashboard, the one sanctioned aggregate view.
   */
  domains?: readonly string[];
  /** Max opportunities to show. The server's budget already applies above this. */
  limit?: number;
  /** The quiet label on the collapsed row. */
  title?: string;
  /** Stable key for remembering this surface's expansion within a session. */
  surfaceKey: string;
  className?: string;
  "data-testid"?: string;
}

export default function AmbientIntelligence({
  domains,
  limit = 5,
  title = "Things you could do",
  surfaceKey,
  className,
  ...rest
}: AmbientIntelligenceProps) {
  // PHASE5E — `acknowledge` is passed through for the first time. It has been plumbed
  // end-to-end since PHASE5B (route, verb, lifecycle, ordering) with no UI caller, so
  // COACH1's "seen yields to unseen" ordering had no signal to order by. The card fires
  // it when the household asks the Companion "Why this?".
  const { data, isPending, isResolving, accept, dismiss, acknowledge } = useFoodOpportunities();
  const storageKey = `tha.ambient.${surfaceKey}`;

  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(storageKey) === "1";
  });

  const items = useMemo(() => {
    // `trust.resolved === false` means no producer was reached — a degraded read,
    // not an empty household. It renders as absence, never as a fabricated "all
    // clear" (Core Principle 6).
    if (!data?.resolved) return [];
    const source = domains
      ? domains.flatMap((d) => data.grouped[d] ?? [])
      : data.opportunities;
    return source.slice(0, limit);
  }, [data, domains, limit]);

  // A critical opportunity is never left folded away behind a click.
  const hasCritical = items.some((o) => presentationFor(o.priority).demandsAttention);

  useEffect(() => {
    if (hasCritical) setExpanded(true);
  }, [hasCritical]);

  const toggle = () => {
    setExpanded((open) => {
      const next = !open;
      try {
        window.sessionStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // A browser that refuses sessionStorage loses the memory, not the surface.
      }
      return next;
    });
  };

  // No layout shift while the first fetch is in flight; nothing to say → say nothing.
  if (isPending || items.length === 0) return null;

  const testId = rest["data-testid"] ?? `ambient-intelligence-${surfaceKey}`;

  return (
    <section
      className={cn(
        "rounded-lg border bg-muted/20",
        hasCritical ? "border-destructive/30 bg-destructive/5" : "border-border/30",
        className,
      )}
      aria-label={title}
      data-testid={testId}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-lg",
          focusRing,
        )}
        data-testid={`${testId}-toggle`}
      >
        <Sparkles
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0",
            hasCritical ? "text-destructive" : "text-primary/60",
          )}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-foreground/80 flex-1">
          {title} · {items.length}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className={cn(
                "border-t px-3 pt-3 pb-3",
                hasCritical ? "border-destructive/20" : "border-border/30",
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((o) => (
                  <FoodOpportunityCard
                    key={o.id}
                    opportunity={o}
                    onAccept={accept}
                    onDismiss={dismiss}
                    onAcknowledge={acknowledge}
                    busy={isResolving}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
