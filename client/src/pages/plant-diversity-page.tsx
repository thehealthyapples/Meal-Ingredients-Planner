import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { BarChart3, Salad, X, Search, Scale, ArrowRight, Plus } from "lucide-react";
import { useWeekMealEntries } from "@/hooks/use-week-meal-entries";
import { WeekFoodExplorer } from "@/components/WeekFoodExplorer";
import { pageContainerClass } from "@/components/workspace-header";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FoodComparisonPage from "@/pages/food-comparison-page";

// FOODUI7 (2026-10-29) — mirrors the server's /api/foods/lookup response.
interface FoodLookupRef {
  knowledgeSlug: string;
  name: string;
  canonicalSlug: string | null;
}
interface FoodLookupResult {
  query: string;
  nutrient: { slug: string; name: string; foods: FoodLookupRef[] } | null;
  food: { knowledgeSlug: string; name: string; canonicalSlug: string | null; similar: FoodLookupRef[] } | null;
}

/**
 * PROD2: the "Benefits" and "Suggestions" tabs were withdrawn.
 *
 * Both rendered a "Coming soon" card and nothing else, so half of this room's
 * doors opened onto a description of unbuilt work. A tab is a promise that
 * there is something behind it; two of these four had nothing, which is the
 * incomplete-experience-presented-as-a-destination this programme removes.
 *
 * This is a withdrawal, not a deletion of intent: the Health Benefits Explorer
 * and Personalised Suggestions remain unbuilt product ideas, and their absence
 * is now silent rather than advertised. When either is built, it returns here
 * as a tab with a room behind it.
 */
// FOODUI1 (2026-10-29) — this room absorbs two more doors: a quick on-ramp to
// Analyser (full experience stays at /analyser, not duplicated here — see the
// Analyser capability card and the Domain 19 reconciliation note for why a
// second product-analysis surface is not built from scratch) and the existing
// Compare page (`food-comparison-page.tsx`, FI20). "Swap" is not a fifth tab:
// it is inherently about one specific product (Analyser's "Best swap in
// store" card), so it stays contextual inside Look up a food / a product's
// own detail view rather than becoming a browsable destination with nothing
// to browse until a product is chosen.
//
// FOODUI10 (2026-10-29) — Compare was withdrawn as its own tab. One food typed
// in and one typed in next to it were two different forms doing adjacent
// jobs (one search box, one two-box compare form) when they're really one
// decision: "tell me about this" becomes "tell me the difference" the moment
// a second food is added. Look up a food now owns both — the same input
// array FoodComparisonPage already used, just surfaced here; the engine and
// the standalone /compare route are untouched; only this tab's own form
// changed, and only in how many items it starts with and what its button
// does once there are two.
type NutritionTab = "foods" | "look-up";

const NUTRITION_TABS: Array<{ id: NutritionTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "foods", label: "Foods", icon: Salad },
  { id: "look-up", label: "Look up a food", icon: Search },
];

export default function PlantDiversityPage() {
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>();
  const { weekMeals, isLoading, activeWeek, availableWeeks, currentWeekKnown } = useWeekMealEntries(selectedWeek);
  const [, navigate] = useLocation();
  const search = useSearch();

  // FOODUI10 — one food typed and submitted stays an inline lookup. Two or
  // more hands off to the existing /compare route (via this same page's own
  // URL, so it stays inside this tab) — reusing FoodComparisonPage exactly as
  // it already was, not a second comparison implementation.
  const MAX_LOOKUP_ITEMS = 4;
  const compareItems = new URLSearchParams(search)
    .get("items")
    ?.split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, MAX_LOOKUP_ITEMS) ?? [];
  // FOODUI10 — >= 1, not >= 2: a deep link seeding exactly one food (e.g. the
  // "Compare" button on a lookup result) should land ready to compare, with
  // that food already in the first box, not bounce back to a bare search
  // form. This page's own submitLookup never sets ?items= for a single typed
  // query (that stays an inline lookup) — only an explicit "compare" entry
  // point does, so there is no conflict with plain single-food searching.
  const isCompareMode = compareItems.length >= 1;
  // 2026-10-31 — the URL is the only source of truth for which tab is showing
  // (previously a separate `useState`, which is exactly why two screenshots
  // of the same `/food` address could show different content: the address
  // bar never changed when the tab did). `tab=look-up` in the query string
  // and `isCompareMode` are the only two ways to land on "look-up"; anything
  // else is "foods". setActiveTab navigates instead of setting local state,
  // so the URL and what's on screen can never drift apart again.
  const activeTab: NutritionTab =
    isCompareMode || new URLSearchParams(search).get("tab") === "look-up" ? "look-up" : "foods";
  function setActiveTab(tab: NutritionTab) {
    navigate(tab === "look-up" ? "/food?tab=look-up" : "/food");
  }

  // FOODUI4 (2026-10-29) — a real search input, not just a link to one.
  // Submitting navigates to /analyser?q=..., which already auto-runs the
  // search on arrival (products-page.tsx's own urlParams effect) — so this
  // lands the household on already-searched results, not an empty page
  // asking them to type again. Avoids re-embedding Analyser's own header
  // (the portal-collision risk recorded in FOODUI1's report) while still
  // putting a working search box on this page, not just a button to one.
  const [lookupQueries, setLookupQueries] = useState<string[]>([""]);
  const [lookupResult, setLookupResult] = useState<FoodLookupResult | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const filledQueries = lookupQueries.map((q) => q.trim()).filter((q) => q.length > 0);

  function updateLookupQuery(i: number, value: string) {
    setLookupQueries((prev) => prev.map((v, idx) => (idx === i ? value : v)));
    setLookupResult(null);
  }
  function addLookupField() {
    setLookupQueries((prev) => (prev.length < MAX_LOOKUP_ITEMS ? [...prev, ""] : prev));
  }
  function removeLookupField(i: number) {
    setLookupQueries((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  // FOODUI7 — a single query can name a food OR a nutrient ("search for
  // foods, or nutrients"). /api/foods/lookup resolves that first; only when
  // it finds neither (e.g. a packaged product name) does this fall back to
  // opening Analyser with the search already run.
  // FOODUI10 — two or more queries means the household isn't looking one
  // thing up any more, they're deciding between things: hand off to Compare
  // instead of pretending a second food typed into "look up a food" was a
  // mistake to ignore.
  const submitLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filledQueries.length === 0) return;

    if (filledQueries.length >= 2) {
      navigate(`/nutrition?items=${encodeURIComponent(filledQueries.join(","))}`);
      return;
    }

    const q = filledQueries[0];
    setLookupPending(true);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/foods/lookup?q=${encodeURIComponent(q)}`);
      const result: FoodLookupResult = res.ok
        ? await res.json()
        : { query: q, nutrient: null, food: null };
      if (result.nutrient || result.food) {
        setLookupResult(result);
      } else {
        navigate(`/analyser?q=${encodeURIComponent(q)}`);
      }
    } catch {
      navigate(`/analyser?q=${encodeURIComponent(q)}`);
    } finally {
      setLookupPending(false);
    }
  };
  const [mobileWorkspaceOpen, setMobileWorkspaceOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ href: string }>).detail?.href === "/food") {
        setMobileWorkspaceOpen(true);
      }
    };
    window.addEventListener("tha:open-workspace", handler);
    return () => window.removeEventListener("tha:open-workspace", handler);
  }, []);

  return (
    <>
      {/* FOODBG1 (2026-10-30) — owner-supplied full-page background. Lives inside
          this `relative` wrapper rather than `fixed`, so it scrolls with the page
          and spans exactly the content's own height (not just one viewport).
          Saturation/contrast boosted slightly for richness (the same grading
          technique NORTH2 used on the orchard asset), and the scrim is light —
          legibility comes from the translucent, blurred cards below (the same
          `bg-card/70 backdrop-blur` treatment already used elsewhere, e.g. the
          nav sidebar over the orchard image), not from flattening the photo. */}
      {/* 2026-10-31 — flex-1/min-h-0 down this chain (and into WeekFoodExplorer's
          own grid) is what lets the grid's columns use `h-full` and genuinely
          reach the bottom of the page: this div, the content div below it, and
          the grid all participate in the SAME flex sizing <main> already uses
          (it's `flex-1 ... flex flex-col`, confirmed by the PX1-W2 note just
          below), instead of each one guessing a `100vh - Nrem` offset that has
          to be re-measured by hand every time the chrome above or below it
          changes. */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: "url(/images/food/food-variety-orbit-20261030.png)",
            filter: "saturate(1.3) contrast(1.05)",
          }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-background/15" />
        </div>

        {/* PX1-W2 (fnd-px-plant-columns-unreachable): `w-full min-w-0` — as a flex
            item of <main>, this container's min-width:auto let the report table
            grow it past the viewport, where overflow-x-hidden clipped the columns
            instead of letting the table's own scroller work. */}
        <div className={`min-w-0 flex-1 min-h-0 flex flex-col ${pageContainerClass(true)} pb-4 sm:pb-5`} data-realm="nutrition">

        {activeTab === "foods" && (
          <WeekFoodExplorer weekMeals={weekMeals} week={activeWeek} availableWeeks={availableWeeks}
            isDefaultWeek={selectedWeek === undefined && currentWeekKnown}
            onWeekChange={setSelectedWeek} isLoading={isLoading} />
        )}

        {activeTab === "look-up" && <button type="button" onClick={() => setActiveTab("foods")}
          className="mb-3 text-sm text-primary underline">Back to foods from your week</button>}

        {activeTab === "look-up" && isCompareMode && (
          <>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setLookupQueries([""]);
                  navigate("/food");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors"
                data-testid="link-lookup-back-to-search"
              >
                <X className="h-3.5 w-3.5" />
                Back to search
              </button>
            </div>
            <FoodComparisonPage embedded />
          </>
        )}

        {activeTab === "look-up" && !isCompareMode && (
          <>
            <Card className="mb-3 px-4 py-2.5 sm:px-5 sm:py-3 border-border/30 bg-card/70 backdrop-blur-sm shadow-sm">
              <CardTitle as="h2">Look up a food</CardTitle>
              <CardDescription className="mt-1 max-w-md text-base leading-snug">
                Search a <strong className="font-semibold text-foreground/90">food</strong>, a <strong className="font-semibold text-foreground/90">nutrient</strong>, or a <strong className="font-semibold text-foreground/90">packaged product</strong>.
                Add a second food to <strong className="font-semibold text-foreground/90">compare</strong> them side by side.
              </CardDescription>
            </Card>
            <Card className="p-5 space-y-3 border-border/30 bg-card/70 backdrop-blur-sm shadow-sm">
              <form onSubmit={submitLookup} className="space-y-2.5" data-testid="form-nutrition-lookup">
                <div className="space-y-2">
                  {lookupQueries.map((value, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
                        <Input
                          value={value}
                          onChange={(e) => updateLookupQuery(i, e.target.value)}
                          placeholder={
                            i === 0
                              ? "Search a food, a nutrient, or a packaged product, e.g. apple, vitamin c, oat milk…"
                              : "another food to compare, e.g. brie"
                          }
                          className="pl-9"
                          data-testid={i === 0 ? "input-nutrition-lookup" : `input-nutrition-lookup-${i}`}
                        />
                      </div>
                      {lookupQueries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLookupField(i)}
                          className="p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                          aria-label={`Remove food ${i + 1}`}
                          data-testid={`button-nutrition-lookup-remove-${i}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                  {lookupQueries.length < MAX_LOOKUP_ITEMS ? (
                    <button
                      type="button"
                      onClick={addLookupField}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-nutrition-lookup-add"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add another food to compare
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Up to four at a time.</span>
                  )}
                  <Button type="submit" variant="default" className="gap-2 shrink-0" disabled={filledQueries.length === 0 || lookupPending} data-testid="button-nutrition-lookup-submit">
                    {lookupPending ? "Searching…" : filledQueries.length >= 2 ? "Compare" : "Search"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
                <p className="text-xs text-muted-foreground">Scanning a barcode, comparing products, or browsing history?</p>
                <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0" data-testid="link-nutrition-open-analyser">
                  <Link href="/analyser">
                    Open Analyser
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* ── FOODUI7: nutrient or food match ──────────────────────────── */}
            {lookupResult?.nutrient && (
              <Card className="p-5 space-y-3 mt-4 border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" data-testid="card-lookup-nutrient-result">
                <CardTitle as="h3">{lookupResult.nutrient.name}</CardTitle>
                <CardDescription>Foods that notably provide {lookupResult.nutrient.name.toLowerCase()}.</CardDescription>
                {lookupResult.nutrient.foods.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {lookupResult.nutrient.foods.map((f) =>
                      f.canonicalSlug ? (
                        <Link
                          key={f.knowledgeSlug}
                          href={`/foods/${f.canonicalSlug}`}
                          className="inline-flex items-center text-xs rounded-full border border-border/60 bg-primary/5 px-2.5 py-1 leading-none text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                          data-testid={`lookup-nutrient-food-${f.knowledgeSlug}`}
                        >
                          {f.name}
                        </Link>
                      ) : (
                        <span
                          key={f.knowledgeSlug}
                          className="inline-flex items-center text-xs rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 leading-none text-muted-foreground"
                          data-testid={`lookup-nutrient-food-${f.knowledgeSlug}`}
                        >
                          {f.name}
                        </span>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No foods are linked to this nutrient yet.</p>
                )}
              </Card>
            )}

            {lookupResult?.food && (
              <Card className="p-5 space-y-3 mt-4 border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" data-testid="card-lookup-food-result">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle as="h3">{lookupResult.food.name}</CardTitle>
                  <div className="flex gap-2 shrink-0">
                    {lookupResult.food.canonicalSlug && (
                      <>
                        <Button asChild variant="default" size="sm" data-testid="link-lookup-food-profile">
                          <Link href={`/foods/${lookupResult.food.canonicalSlug}`}>View full profile</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="gap-1.5" data-testid="link-lookup-food-compare">
                          <Link href={`/food?items=${encodeURIComponent(lookupResult.food.canonicalSlug)}`}>
                            <Scale className="h-3.5 w-3.5" />
                            Compare
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {lookupResult.food.similar.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                      Similar in nutrients
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {lookupResult.food.similar.map((f) =>
                        f.canonicalSlug ? (
                          <Link
                            key={f.knowledgeSlug}
                            href={`/foods/${f.canonicalSlug}`}
                            className="inline-flex items-center text-xs rounded-full border border-border/60 bg-primary/5 px-2.5 py-1 leading-none text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                            data-testid={`lookup-similar-food-${f.knowledgeSlug}`}
                          >
                            {f.name}
                          </Link>
                        ) : (
                          <span
                            key={f.knowledgeSlug}
                            className="inline-flex items-center text-xs rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 leading-none text-muted-foreground"
                            data-testid={`lookup-similar-food-${f.knowledgeSlug}`}
                          >
                            {f.name}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

      </div>
      </div>

      {/* ── Mobile Nutrition Workspace Drawer ─────────────────────────────── */}
      <Drawer open={mobileWorkspaceOpen} onOpenChange={setMobileWorkspaceOpen} shouldScaleBackground={false}>
        <DrawerContent
          className="flex flex-col max-h-[60vh]"
          data-testid="drawer-nutrition-workspace"
          data-realm="nutrition"
        >
          <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0 realm-header-bg">
            <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: "var(--realm-accent)" }} />
              Food
            </DrawerTitle>
            <button
              onClick={() => setMobileWorkspaceOpen(false)}
              className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
              aria-label="Close workspace"
              data-testid="button-nutrition-workspace-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="w-full h-px shrink-0 bg-[var(--realm-border)]" />
          <div
            className="flex-1 overflow-y-auto min-h-0 px-4 pt-3"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider py-2">View</p>
            <div className="grid grid-cols-2 gap-2 pb-3">
              {NUTRITION_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`flex flex-col items-center gap-1.5 rounded-md border px-1.5 py-3 transition-colors ${
                    activeTab === id
                      ? "border-primary/40 realm-banner-btn"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  onClick={() => { setActiveTab(id); setMobileWorkspaceOpen(false); }}
                  data-testid={`button-ws-nutrition-${id}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-medium leading-none">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
