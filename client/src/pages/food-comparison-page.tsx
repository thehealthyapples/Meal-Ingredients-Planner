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
import { ArrowLeft, Scale, Plus, X, ScanBarcode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import BarcodeScanner from "@/components/BarcodeScanner";
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

interface FoodComparisonPageProps {
  /**
   * FOODUI1 (2026-10-29) — true when rendered as the Food page's Compare tab
   * rather than the standalone /compare route. Suppresses the page-level Back
   * link (the parent page's own tabs are the way back) and outer page padding
   * (the parent already provides a container). The engine, inputs and results
   * are identical either way — this changes chrome only.
   */
  embedded?: boolean;
  /**
   * 2026-10-31 — when provided (WeekFoodExplorer's inline "Compare foods",
   * opened directly in its own middle column), seeds the item inputs from
   * this instead of the URL's ?items=. That embed deliberately never
   * navigates — the owner's own words were "should never take me away from
   * the food page" — so there is no URL to read or write here. Omit this
   * prop for every other caller (the standalone /compare route, and the Food
   * page's separate "Look up a food" tab) to keep the existing
   * deep-linkable, URL-driven behaviour unchanged.
   */
  seedItems?: string[];
  /**
   * 2026-11-01 — WeekFoodExplorer's Compare tab renders the result itself,
   * split one subject per column instead of this page's own side-by-side
   * table (the table doesn't fit a single column). `hideResult` keeps this
   * component the one owner of the item inputs and the /api/foods/compare
   * fetch — it just stops rendering FoodComparisonView itself — and
   * `onBundleChange` hands the fetched bundle up so the parent can render
   * SubjectComparisonPanel from it instead.
   */
  hideResult?: boolean;
  onBundleChange?: (bundle: FoodComparisonBundle | undefined) => void;
}

export default function FoodComparisonPage({ embedded = false, seedItems, hideResult = false, onBundleChange }: FoodComparisonPageProps = {}) {
  const search = useSearch();
  const seeded = useMemo(() => seedItems ?? parseItems(search), [search, seedItems]);

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
  // seedItems mode never navigates, so there is no URL change to adopt here.
  useEffect(() => {
    if (seedItems) return;
    if (seeded.length >= MIN_ITEMS) {
      const padded = [...seeded];
      while (padded.length < MIN_ITEMS) padded.push("");
      setItems(padded);
      setSubmitted(seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, seedItems]);

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
  // 2026-11-02 (owner) — "the search and the compare fields should actually
  // both allow the bar code scanner to be an input": same BarcodeScanner +
  // GET /api/products/barcode/:barcode route WeekFoodExplorer's own search
  // box now uses — a scan resolves to a real product name and fills THIS
  // slot with it, same as typing the name would, so the rest of the compare
  // flow (resolution, scoring) is unchanged.
  const { toast } = useToast();
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  async function handleBarcodeScan(barcode: string) {
    const index = scanningIndex;
    setScanningIndex(null);
    if (index === null) return;
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`, { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast({ title: "Couldn't find that product", description: body.message ?? "Try scanning again.", variant: "destructive" });
        return;
      }
      const data = await response.json();
      if (data.product?.product_name) {
        updateItem(index, data.product.product_name);
      }
    } catch {
      toast({ title: "Couldn't read that barcode", description: "Try scanning again.", variant: "destructive" });
    }
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

  useEffect(() => {
    onBundleChange?.(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className={embedded ? "w-full" : "mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6"}>
      {!embedded && (
        <Link
          href="/cookbook"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors mb-5"
          data-testid="link-back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      )}

      {/* FOODUI13 — embedded on the Food page's own "Look up a food" tab, this
          repeated its own "Compare foods" heading right under that tab's name
          and a "Back to search" link — the same redundant-title stacking the
          standalone page's heading exists to solve for. Standalone keeps it;
          embedded relies on the parent tab's own context instead. */}
      <header className={cn("space-y-1", embedded ? "mb-3" : "mb-5")}>
        {!embedded && (
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-primary/70 flex-shrink-0" aria-hidden="true" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="compare-title">
              Compare foods
            </h1>
          </div>
        )}
        <p className={cn("max-w-md text-base leading-snug text-muted-foreground/80", !embedded && "pl-8")}>
          <strong className="font-semibold text-foreground/90">Side by side</strong>, with the reasons, not just a score.
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
              <button
                type="button"
                onClick={() => setScanningIndex(i)}
                className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label={`Scan a barcode for food ${i + 1}`}
                data-testid={`compare-scan-${i}`}
              >
                <ScanBarcode className="h-4 w-4" />
              </button>
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
        // FNDFIX8 (2026-11-03) — the loaded result (FoodComparisonView) is a
        // short verdict banner followed by one wide comparison table, not one
        // undifferentiated blob — split to match that two-part shape.
        <div className="py-4 space-y-4" aria-busy="true" aria-label="Comparing those foods">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
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

      {enabled && data && !hideResult && <FoodComparisonView bundle={data} />}

      {!enabled && !hideResult && (
        <p className={cn(subtleText, "text-center py-8")} data-testid="compare-empty">
          Enter two foods to compare.
        </p>
      )}

      <BarcodeScanner isOpen={scanningIndex !== null} onScan={handleBarcodeScan} onClose={() => setScanningIndex(null)} />
    </div>
  );
}
