// FI20 — Food Comparison page (route: /compare).
//
// Gives the already-built Food Comparison Engine (COMP1) its first UI. The engine
// was reachable only via a Companion utterance ("compare cheddar and brie"); this
// page and its sibling route GET /api/foods/compare are the missing way in for a
// household that wants to decide between two foods deliberately.
//
// It owns NOTHING and computes no comparison: it collects two-to-four food names,
// asks the engine, and renders the engine's cited answer via FoodComparisonView.
// Deep-linkable — /compare?items=cheddar,brie — which is how the Food page's
// "Compare with another food" entry and any shared link arrive here pre-seeded.

import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Scale, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";
import {
  FoodComparisonView,
  type FoodComparisonBundle,
} from "@/components/intelligence/FoodComparisonView";
import { subtleText } from "@/components/intelligence";

const MAX_ITEMS = 4;
const MIN_ITEMS = 2;

function parseItems(search: string): string[] {
  const raw = new URLSearchParams(search).get("items") ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_ITEMS);
}

export default function FoodComparisonPage() {
  const search = useSearch();
  const seeded = useMemo(() => parseItems(search), [search]);

  // The items are the caller's own words. Start from the URL (deep-link) and pad
  // to at least two editable slots so the intent of the page is obvious.
  const [items, setItems] = useState<string[]>(() => {
    const start = [...seeded];
    while (start.length < MIN_ITEMS) start.push("");
    return start;
  });
  // The submitted list — only this drives the fetch, so typing never fires a call.
  const [submitted, setSubmitted] = useState<string[]>(() =>
    seeded.length >= MIN_ITEMS ? seeded : [],
  );

  // If the URL changes underneath us (e.g. a fresh deep-link), adopt it.
  useEffect(() => {
    if (seeded.length >= MIN_ITEMS) {
      const padded = [...seeded];
      while (padded.length < MIN_ITEMS) padded.push("");
      setItems(padded);
      setSubmitted(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // The Companion can see what this page is comparing (deixis): "which is better?"
  // arriving here points at these foods rather than at nothing.
  usePublishCompanionContext({
    currentFoodSlug: submitted[0] || undefined,
  });

  const cleaned = submitted.map((s) => s.trim()).filter((s) => s.length > 0);
  const enabled = cleaned.length >= MIN_ITEMS;
  const queryString = cleaned.join(",");

  const { data, isPending, isError, error } = useQuery<FoodComparisonBundle>({
    queryKey: ["/api/foods/compare", queryString],
    queryFn: async () => {
      const res = await fetch(
        `/api/foods/compare?items=${encodeURIComponent(queryString)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Comparison failed");
      }
      return res.json();
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  function updateItem(i: number, value: string) {
    setItems((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }
  function addItem() {
    setItems((prev) => (prev.length < MAX_ITEMS ? [...prev, ""] : prev));
  }
  function removeItem(i: number) {
    setItems((prev) =>
      prev.length > MIN_ITEMS ? prev.filter((_, idx) => idx !== i) : prev,
    );
  }
  function compare() {
    const next = items.map((s) => s.trim()).filter((s) => s.length > 0);
    setSubmitted(next);
  }

  const canCompare = items.filter((s) => s.trim().length > 0).length >= MIN_ITEMS;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <Link
        href="/cookbook"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors mb-5"
        data-testid="link-back"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <header className="space-y-1.5 mb-5">
        <div className="flex items-center gap-2.5">
          <Scale className="h-5 w-5 text-primary/70 flex-shrink-0" aria-hidden="true" />
          <h1 className="text-2xl font-bold tracking-tight" data-testid="compare-title">
            Compare foods
          </h1>
        </div>
        <p className="text-sm text-muted-foreground/80 leading-relaxed pl-8 max-w-2xl">
          Two everyday choices, side by side — with the reasons, not just a score.
          Weighed against your household where we can.
        </p>
      </header>

      {/* ── Item inputs ── */}
      <Card className="p-4 space-y-3 mb-5">
        <div className="space-y-2">
          {items.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={value}
                onChange={(e) => updateItem(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCompare) compare();
                }}
                placeholder={i === 0 ? "e.g. cheddar" : i === 1 ? "e.g. brie" : "another food"}
                aria-label={`Food ${i + 1}`}
                data-testid={`compare-input-${i}`}
              />
              {items.length > MIN_ITEMS && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                  aria-label={`Remove food ${i + 1}`}
                  data-testid={`compare-remove-${i}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {items.length < MAX_ITEMS ? (
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="compare-add"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another
            </button>
          ) : (
            <span className={subtleText}>Up to four at a time.</span>
          )}
          <Button
            type="button"
            variant="default"
            onClick={compare}
            disabled={!canCompare}
            data-testid="compare-submit"
          >
            Compare
          </Button>
        </div>
      </Card>

      {/* ── Result ── */}
      {/* UINORTH1 — the canonical loading owner (UIA §12 "shape before spin",
          §17), in place of a centred spinner: a card-shaped placeholder tells the
          household a comparison is arriving; a spinner only says "wait". */}
      {enabled && isPending && (
        <div className="py-4" aria-busy="true" aria-label="Comparing those foods">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      )}

      {enabled && isError && (
        <Card className="p-4" data-testid="compare-error">
          <p className={cn("text-sm text-foreground/80")}>
            {(error as Error)?.message ??
              "We couldn't compare those. Try two foods we're likely to know."}
          </p>
        </Card>
      )}

      {enabled && data && <FoodComparisonView bundle={data} />}

      {!enabled && (
        <p className={cn(subtleText, "text-center py-8")} data-testid="compare-empty">
          Enter two foods to compare.
        </p>
      )}
    </div>
  );
}
