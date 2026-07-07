// FI5 — Food Intelligence UI Activation.
//
// The ONE presentation owner for surfacing the platform's Food Opportunity
// bundle (OD1's `opportunity-delivery` capability, fed by FI4's Food
// Opportunity Engine) across every consuming surface — Dashboard, Planner,
// Cookbook, Pantry. Every surface renders through THIS component with
// different props (which domains, how many, what to call it); none of them
// re-fetches, re-groups or re-derives the bundle a second way (mirrors
// PlannerIntelligenceStrip's own "queries the SAME key" dedup discipline).
//
// Progressive enrichment: a household with nothing to show renders either an
// honest, quiet empty message or nothing at all — never a fabricated
// opportunity. `domains` selects from the bundle's own `grouped` map (already
// grouped by owning Business Domain by OD1 — planner / pantry / shopping);
// omitting it shows the household's top opportunities across every domain.

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  useFoodOpportunities,
  type FoodOpportunity,
} from "@/hooks/use-food-opportunities";
import { FoodOpportunityCard } from "@/components/intelligence/FoodOpportunityCard";

export interface FoodOpportunitiesPanelProps {
  /**
   * Which owning domains (from the bundle's `grouped` map — "planner" |
   * "pantry" | "shopping") to show. Omit to show the household's top
   * opportunities across every domain.
   */
  domains?: readonly string[];
  /** Max opportunities to show. */
  limit?: number;
  /** Small label shown above/alongside the list. */
  title: string;
  icon?: React.ReactNode;
  /**
   * Compact renders a single header row ("Title · N") with an expand toggle
   * (Dashboard/Planner/Cookbook style, mirrors PlannerIntelligenceStrip).
   * Non-compact renders the card grid directly.
   */
  compact?: boolean;
  /** Shown when there is genuinely nothing to surface. Omit to render nothing. */
  emptyMessage?: string;
  className?: string;
  "data-testid"?: string;
}

export default function FoodOpportunitiesPanel({
  domains,
  limit = 5,
  title,
  icon,
  compact = false,
  emptyMessage,
  className,
  ...rest
}: FoodOpportunitiesPanelProps) {
  const { data, isPending, isResolving, accept, dismiss } =
    useFoodOpportunities();
  const [expanded, setExpanded] = useState(false);

  const items = useMemo<FoodOpportunity[]>(() => {
    if (!data?.resolved) return [];
    const source = domains
      ? domains.flatMap((d) => data.grouped[d] ?? [])
      : data.opportunities;
    return source.slice(0, limit);
  }, [data, domains, limit]);

  // No layout shift while the first fetch is in flight.
  if (isPending) return null;

  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <p
        className="text-xs text-muted-foreground/50 italic"
        data-testid={rest["data-testid"] ? `${rest["data-testid"]}-empty` : undefined}
      >
        {emptyMessage}
      </p>
    );
  }

  const cards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((o) => (
        <FoodOpportunityCard
          key={o.id}
          opportunity={o}
          onAccept={accept}
          onDismiss={dismiss}
          busy={isResolving}
        />
      ))}
    </div>
  );

  if (!compact) {
    return (
      <div className={className} data-testid={rest["data-testid"]}>
        {title && (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60 flex items-center gap-1.5">
            {icon}
            {title}
          </p>
        )}
        {cards}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-border/30 bg-muted/20 ${className ?? ""}`}
      data-testid={rest["data-testid"]}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={expanded}
        data-testid={rest["data-testid"] ? `${rest["data-testid"]}-toggle` : undefined}
      >
        {icon}
        <span className="text-xs font-medium text-foreground/80 flex-1">
          {title} · {items.length}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
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
            <div className="border-t border-border/30 px-3 pt-3 pb-3">
              {cards}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
