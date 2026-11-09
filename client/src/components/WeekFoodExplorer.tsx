import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ScanBarcode } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { appendPendingIngredient } from "@/lib/quick-list";
import { useToast } from "@/hooks/use-toast";
import { FoodReport } from "@/components/FoodReport";
import { HouseholdNutritionCentre } from "@/components/HouseholdNutritionCentre";
import { FoodQuickLook } from "@/components/intelligence";
import AppleRating from "@/components/AppleRating";
import AnalyserDetailV2 from "@/components/analyser/AnalyserDetailV2";
import BarcodeScanner from "@/components/BarcodeScanner";
import type { InputProduct } from "@/lib/analyser-view-model";
import {
  SubjectComparisonPanel,
  ComparisonVerdict,
  orderedComparisonDimensions,
  type FoodComparisonBundle,
  type ComparisonDimensionKey,
} from "@/components/intelligence/FoodComparisonView";
import FoodDetailPage from "@/pages/food-detail-page";
import FoodComparisonPage from "@/pages/food-comparison-page";
import { useWeekFoodRows, type IngredientRow, type WeekMealEntry } from "@/components/PlantDiversityReport";
import { getCategoryEmoji, getIngredientImage } from "@/lib/ingredient-imagery";
import { buildRowVarietyDisplays } from "@shared/canonical/variety";
import { buildFoodReport, nutrientSlugForDisplayName } from "@shared/canonical/food-report-adapter";

type Mode = "foods" | "nutrients";
type LookupResult = {
  nutrient: { slug: string; name: string; foods: Array<{ name: string; canonicalSlug: string | null }> } | null;
  food: { name: string; canonicalSlug: string | null } | null;
};
// 2026-11-02 (owner) — "searching... in foods should show both foods from
// analyser and THA's own library" / "i dont want to have to open analyser -
// i want the information to display in the center column": the same
// GET /api/search-products Analyser's own search already uses (live Open
// Food Facts + a real computed score, every time) returns the FULL
// InputProduct shape AnalyserDetailV2 (Analyser's own real product-detail
// view) already renders from — ingredients, additive breakdown, swaps — so
// this reads that type directly rather than a thinner, view-only shape that
// would force a second trip to Analyser just to see the rest.
// GET /api/knowledge/nutrients/:slug (getNutrientDetailView) — real, governed
// nutrient-benefit data: a description of what the nutrient does, plus the
// evidence-gated benefit tags linked to it. Only `.nutrient` and `.benefits`
// are used here; the food list keeps coming from /api/foods/lookup above,
// which already bridges knowledge-registry slugs to canonical ones the way
// this endpoint's own `foods` array does not (FOODUI16 found that gap once
// already — not repeating it by consuming the unbridged list here too).
type NutrientDetail = {
  nutrient: { slug: string; name: string; description: string | null; category: string | null };
  benefits: Array<{ slug: string; name: string; icon: string | null }>;
};

interface Props {
  weekMeals: WeekMealEntry[];
  week: string;
  availableWeeks: string[];
  onWeekChange: (week: string) => void;
  isLoading: boolean;
  isDefaultWeek: boolean;
}

// Literal, fully-spelled-out classes (not string-built) so Tailwind's JIT
// scanner — which only sees what's written in source, not what a template
// literal would interpolate at runtime — actually generates the CSS for
// each. compareColumnCount is clamped to 2-4, so these three cover every
// case.
function compareGridColsClass(columnCount: number): string {
  if (columnCount >= 4) return "lg:grid-cols-[minmax(260px,0.8fr)_minmax(280px,1fr)_minmax(280px,1fr)_minmax(280px,1fr)_minmax(280px,1fr)]";
  if (columnCount === 3) return "lg:grid-cols-[minmax(260px,0.8fr)_minmax(280px,1fr)_minmax(280px,1fr)_minmax(280px,1fr)]";
  return "lg:grid-cols-[minmax(260px,0.8fr)_minmax(280px,1fr)_minmax(280px,1fr)]";
}

function mealContext(row: IngredientRow): string {
  return row.dayNames.flatMap((day) =>
    (row.dayMealMap.get(day) ?? []).map((meal) => `${day} · ${meal}`),
  ).join(" · ");
}

function FoodImage({ row, large = false }: { row: IngredientRow; large?: boolean }) {
  const image = getIngredientImage(row.displayName);
  const size = large ? "h-24 w-24" : "h-9 w-9";
  return image ? <img src={image.src} alt={image.alt} className={`${size} shrink-0 rounded-lg object-cover`} />
    : <span className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-muted text-2xl`} aria-hidden="true">
        {getCategoryEmoji(row.plantCategory ?? row.reportCategory)}
      </span>;
}

// Real, governed "what does this nutrient do" data (description + the
// evidence-gated benefit tags linked to it) — the actual content the owner
// asked for ("information about the benefits of nutrients"), not invented
// copy. Called once per column below with that column's own slug, so the
// two can show different nutrients' benefits at once.
function useNutrientDetail(slug: string | null) {
  return useQuery<NutrientDetail>({
    queryKey: ["/api/knowledge/nutrients", slug],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge/nutrients/${encodeURIComponent(slug!)}`);
      if (!response.ok) throw new Error("Nutrient detail unavailable");
      return response.json() as Promise<NutrientDetail>;
    },
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function WeekFoodExplorer({ weekMeals, week, availableWeeks, onWeekChange, isLoading, isDefaultWeek }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // 2026-11-02 (owner) — "i dont want to have to open analyser - i want the
  // information to display in the center column": same mutation
  // products-page.tsx's own "Add to Basket" uses (api.shoppingList.add),
  // wired here too so AnalyserDetailV2's actions work in place rather than
  // only rendering as information with no real buttons behind them.
  const addToBasket = useMutation({
    mutationFn: async (product: InputProduct) => {
      const res = await apiRequest("POST", api.shoppingList.add.path, {
        productName: product.product_name,
        imageUrl: product.image_url,
        quantity: 1,
        brand: product.brand,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added to basket", description: "Product added" });
    },
    onError: () => {
      toast({ title: "Couldn't add that product", description: "Try again in a moment.", variant: "destructive" });
    },
  });
  const handleAddToQuickList = (product: InputProduct) => {
    appendPendingIngredient(product.product_name + (product.brand ? ` (${product.brand})` : ""));
    toast({ title: "Added to quick list" });
  };

  const [mode, setMode] = useState<Mode>("foods");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  // 2026-11-02 (owner) — "the search and the compare fields should actually
  // both allow the bar code scanner to be an input". Same BarcodeScanner
  // component and GET /api/products/barcode/:barcode route products-page.tsx
  // already uses — a scan resolves directly to a real product (precise, no
  // fuzzy text search needed) and opens it the same way clicking a search
  // result already does.
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const handleBarcodeScan = async (barcode: string) => {
    setShowBarcodeScanner(false);
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`, { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast({ title: "Couldn't find that product", description: body.message ?? "Try scanning again.", variant: "destructive" });
        return;
      }
      const data = await response.json();
      if (data.product) {
        setQuery(data.product.product_name);
        setSubmittedQuery(data.product.product_name);
        setSelectedLiveProduct(data.product as InputProduct);
        setLookupSelectedFood(null);
        setLookupSelectedNutrient(null);
        setRelatedSlug(null);
        setRelatedNutrientName(null);
        setRelatedNutrientSlug(null);
        setComparing(false);
      }
    } catch {
      toast({ title: "Couldn't read that barcode", description: "Try scanning again.", variant: "destructive" });
    }
  };
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  // 2026-10-31 (owner) — "the ability to select more than one vitamin - and
  // then having foods returned that have all nutrients in them". Separate
  // from `selectedNutrient` above (which still browses this WEEK's own foods
  // for one nutrient, unchanged): the checkbox builds a filter set resolved
  // against the whole Food Knowledge Registry, not just this week, since
  // "what has vitamin C and vitamin K and calcium" is a question about foods
  // in general, not what happened to be eaten in one week.
  const [multiSelectedNutrients, setMultiSelectedNutrients] = useState<string[]>([]);
  const toggleMultiNutrient = (name: string) =>
    setMultiSelectedNutrients((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  const multiNutrientSlugs = useMemo(
    () => multiSelectedNutrients.map((n) => nutrientSlugForDisplayName(n)).filter((s): s is string => s !== null),
    [multiSelectedNutrients],
  );
  const { data: multiNutrientResult, isFetching: multiNutrientPending } = useQuery<{ foods: Array<{ name: string; canonicalSlug: string | null }> }>({
    queryKey: ["/api/foods/lookup-nutrients", multiNutrientSlugs.join(",")],
    queryFn: async () => {
      const response = await fetch(`/api/foods/lookup-nutrients?slugs=${encodeURIComponent(multiNutrientSlugs.join(","))}`);
      if (!response.ok) throw new Error("Lookup failed");
      return response.json();
    },
    enabled: multiNutrientSlugs.length >= 2,
    retry: false,
  });
  // FOODUI1 follow-up (2026-10-30) — a food or nutrient found via search (which
  // may not be in this week's own rows at all) displays on the right the same
  // way a week food does, rather than navigating to its own /foods/:slug page.
  // Takes priority over a week-row selection while set; picking a week row or
  // switching mode clears it so the normal browsing view returns.
  const [lookupSelectedFood, setLookupSelectedFood] = useState<{ name: string; canonicalSlug: string } | null>(null);
  const [lookupSelectedNutrient, setLookupSelectedNutrient] = useState<{ slug: string; name: string; foods: Array<{ name: string; canonicalSlug: string | null }> } | null>(null);
  // 2026-11-02 (owner) — "searching... in foods should show both foods from
  // analyser and THA's own library": same slot pattern as the two above —
  // picking a live-searched packaged product shows it here instead of
  // navigating away, same as picking a food or nutrient already does.
  const [selectedLiveProduct, setSelectedLiveProduct] = useState<InputProduct | null>(null);
  // FOODUI1 follow-up (2026-10-30) — the third column. Anything "similar" or
  // "related" to whatever the middle column is reviewing (a Connected Foods
  // chip, a nutrient's linked food, "View full food page") opens here, using
  // the real food-detail page embedded — not a lighter duplicate — so this is
  // genuinely more than the middle column already shows. Its own internal
  // food links call back into this same slot rather than opening a fourth.
  const [relatedSlug, setRelatedSlug] = useState<{ slug: string; name: string } | null>(null);
  // A clicked nutrient pill (Key Nutrients, FoodReport) also opens here: the
  // nutrient's own linked-foods list, reusing the same lookup the search box
  // already uses. Mutually exclusive with relatedSlug — selecting one clears
  // the other, same as the lookup pair above.
  const [relatedNutrientName, setRelatedNutrientName] = useState<string | null>(null);
  // Resolved once via the new reverse lookup (FoodReport's pill only ever
  // hands back a display name) — null only if a nutrient's seed entry was
  // somehow retired after the report was built; the benefit section simply
  // doesn't render in that edge case rather than guessing a slug.
  const [relatedNutrientSlug, setRelatedNutrientSlug] = useState<string | null>(null);
  const selectRelated = (slug: string, name: string) => { setRelatedSlug({ slug, name }); setRelatedNutrientName(null); setRelatedNutrientSlug(null); };
  const selectRelatedNutrient = (name: string) => { setRelatedNutrientName(name); setRelatedNutrientSlug(nutrientSlugForDisplayName(name)); setRelatedSlug(null); };
  // 2026-10-31 (owner) — "clicking compare foods should never take me away
  // from the food page... it should open the search bar in the current
  // column". Previously "Compare foods" called back up to the page, which
  // navigated to a completely separate tab/screen. Now it's local state:
  // the middle column swaps to FoodComparisonPage's own search-and-results
  // UI in place, with columns 1 and 3 untouched — no navigation at all.
  const [comparing, setComparing] = useState(false);
  // 2026-11-02 (owner) — "i search ketchup - and on the result i should be
  // able to select them and then hit compare": widened from a single seed
  // slug to an array so multiple SEARCH RESULTS (not just one food) can
  // start a comparison already pre-filled — FoodComparisonPage's own
  // `seedItems` prop already took an array, this just stopped wrapping a
  // single value into one.
  const [compareSeed, setCompareSeed] = useState<string[]>([]);
  const startCompare = (seeds: string[] = []) => { setCompareSeed(seeds); setComparing(true); };
  // Checkbox selection across the live product search results (below) — a
  // food/nutrient row only ever starts a compare with ITSELF (via
  // startCompare), but packaged-product search results can return several
  // candidates worth comparing against each other directly from the list.
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const toggleProductSelection = (name: string) =>
    setSelectedProductNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  // 2026-11-01 (owner) — "a compare button where the blue box is... when the
  // items are selected to compare they should appear in the middle and right
  // column". FoodComparisonPage still owns the inputs and the fetch
  // (`hideResult` just stops it rendering its own side-by-side table); this
  // state is only the fetched bundle, handed up via `onBundleChange` so the
  // two resolved subjects can be split one-per-column instead.
  const [compareBundle, setCompareBundle] = useState<FoodComparisonBundle | undefined>(undefined);
  const compareResolved = useMemo(
    () => compareBundle?.subjects.filter((s) => s.kind !== "unresolved") ?? [],
    [compareBundle],
  );
  const compareOrderedDimensions = useMemo(
    () => (compareBundle ? orderedComparisonDimensions(compareBundle) : []),
    [compareBundle],
  );
  // 2026-11-01 (owner) — "I expect another column to appear, not the
  // additional product under another food": a 3rd/4th food stacked inside
  // one of only two fixed columns read as "under another food", not its own
  // comparison. Every resolved subject now gets a REAL grid column of its
  // own — the page's own column count grows with the comparison (2 to 4,
  // FoodComparisonPage's own MAX_ITEMS) instead of staying fixed at 2 with
  // extra foods stacked vertically inside one of them.
  const compareColumnCount = Math.max(2, Math.min(4, compareResolved.length));
  // 2026-11-01 (owner) — "when expanding a why on one column the same why
  // should expand in the other": one shared expand-set, keyed by dimension,
  // for every compare column — so clicking "Why?" under Kale's "How
  // processed" expands "How processed" for every other food in the
  // comparison too, not just Kale's own column.
  const [expandedComparisonDimensions, setExpandedComparisonDimensions] = useState<Set<ComparisonDimensionKey>>(new Set());
  const toggleComparisonDimension = (dimension: ComparisonDimensionKey) => {
    setExpandedComparisonDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(dimension)) next.delete(dimension);
      else next.add(dimension);
      return next;
    });
  };
  // Scroll lock (owner: "the scroll of both columns when comparing should
  // lock and scroll at the same pace") — generalised from a fixed pair to N
  // columns: scrolling any one mirrors its scrollTop onto every other open
  // compare column. Guarded by `comparing` and a re-entrancy flag so setting
  // one column's scrollTop from another's handler doesn't bounce back and
  // forth, and so this never touches scrolling on the normal (non-compare)
  // columns, which don't use these refs at all.
  const compareColumnRefs = useRef<(HTMLElement | null)[]>([]);
  const syncingCompareScroll = useRef(false);
  const syncCompareScroll = (sourceIndex: number) => {
    if (!comparing || syncingCompareScroll.current) return;
    const from = compareColumnRefs.current[sourceIndex];
    if (!from) return;
    syncingCompareScroll.current = true;
    compareColumnRefs.current.forEach((el, i) => {
      if (i !== sourceIndex && el) el.scrollTop = from.scrollTop;
    });
    syncingCompareScroll.current = false;
  };
  const { data: relatedNutrientLookup, isFetching: relatedNutrientPending } = useQuery<LookupResult>({
    queryKey: ["/api/foods/lookup", "related-nutrient", relatedNutrientName],
    queryFn: async () => {
      const response = await fetch(`/api/foods/lookup?q=${encodeURIComponent(relatedNutrientName!)}`);
      if (!response.ok) throw new Error("Food lookup unavailable");
      return response.json() as Promise<LookupResult>;
    },
    enabled: !!relatedNutrientName,
    retry: false,
  });
  const { data: lookupNutrientDetail } = useNutrientDetail(lookupSelectedNutrient?.slug ?? null);
  const { data: relatedNutrientDetail } = useNutrientDetail(relatedNutrientSlug);
  const { rows } = useWeekFoodRows(weekMeals);
  const needle = query.trim().toLocaleLowerCase();
  const visibleRows = useMemo(() => rows.filter((row) =>
    !needle || [row.displayName, row.reportCategory, row.benefitSummary ?? "", ...row.keyNutrients]
      .some((value) => value.toLocaleLowerCase().includes(needle)),
  ), [rows, needle]);
  const nutrients = useMemo(() => [...new Set(rows.flatMap((row) => row.keyNutrients))].sort(), [rows]);
  const visibleNutrients = nutrients.filter((name) => !needle || name.toLocaleLowerCase().includes(needle));
  const selected = rows.find((row) => row.displayKey === selectedKey) ?? null;
  const selectedCanonicalSlug = selected?.section === "plant-based"
    ? buildRowVarietyDisplays(weekMeals.flatMap((meal) => meal.ingredients), [{ key: selected.displayKey, representative: selected.canonicalKey }]).get(selected.displayKey)?.canonicalSlug ?? selected.canonicalKey
    : selected?.canonicalKey ?? null;
  const hasFoodProfile = selectedCanonicalSlug ? !!buildFoodReport(selectedCanonicalSlug) : false;

  const { data: lookup, isFetching: lookupPending } = useQuery<LookupResult>({
    queryKey: ["/api/foods/lookup", submittedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/foods/lookup?q=${encodeURIComponent(submittedQuery)}`);
      if (!response.ok) throw new Error("Food lookup unavailable");
      return response.json() as Promise<LookupResult>;
    },
    enabled: submittedQuery.length > 0,
    retry: false,
  });
  // 2026-11-02 (owner) — "searching... in foods should show both foods from
  // analyser and THA's own library": runs alongside the THA-library lookup
  // above, not instead of it — both result sets render together rather than
  // one being a fallback link that leaves the page. Same endpoint Analyser's
  // own search already calls.
  const { data: liveProductSearch, isFetching: liveProductPending } = useQuery<{ products: InputProduct[] }>({
    queryKey: ["/api/search-products", submittedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search-products?q=${encodeURIComponent(submittedQuery)}`, { credentials: "include" });
      if (!response.ok) throw new Error("Product search unavailable");
      return response.json();
    },
    enabled: submittedQuery.length > 0,
    retry: false,
  });
  const matchedThisWeek = lookup?.food
    ? rows.some((row) => row.displayName.toLocaleLowerCase() === lookup.food!.name.toLocaleLowerCase())
    : false;

  // grid-rows-[1fr] — without it, the single implicit row sizes to its tallest
  // column's own CONTENT (back to guessing), not to this grid's own
  // flex-1-determined height; this makes the row actually consume the full
  // height flex-1 gives the grid, so align-items:stretch (default) correctly
  // stretches every column — including column 1, whose own flex-col scroll
  // box fills what's left after its heading/search — to the real available
  // space, with no vh/rem figure hand-measured.
  return (
    <>
    <div
      className={`grid min-w-0 gap-4 lg:flex-1 lg:min-h-0 lg:grid-rows-[1fr] lg:overflow-x-auto ${comparing ? compareGridColsClass(compareColumnCount) : "lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]"}`}
      data-testid="food-week-explorer"
    >
      <section className="min-w-0 min-h-0 flex flex-col" aria-label={mode === "foods" ? "Foods from your week" : "Nutrients from your week"}>
        {/* FOODBG1 follow-up (2026-10-30) — heading, description and the mode
            tabs now share ONE full-width translucent box instead of three
            separately-sized pieces (a narrow text-hugging strip, then a
            smaller inline tab pill below it) — that mismatch was what read as
            "not neat". This box is now the same width as the search row, the
            list box below it, and the right-hand panel, so the column reads
            as one consistent stack of same-width pieces. Text keeps its
            drop-shadow as a second line of defence over the photo. */}
        <div className="rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm px-4 py-3 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground [text-shadow:0_1px_3px_rgba(0,0,0,0.15)]">{comparing ? "Compare foods" : mode === "foods" ? "Foods from your week" : "Nutrients from your week"}</h1>
          <p className="mt-1 text-sm text-muted-foreground [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">{comparing ? "Side by side, with the reasons, not just a score." : mode === "foods" ? "Ingredients used in your meals." : "Nutrients linked to foods in your meals; these are not amounts eaten."}</p>
          <div className="mt-3 inline-flex rounded-lg border border-border/60 bg-card p-1" role="tablist" aria-label="Weekly food view">
            {(["foods", "nutrients"] as const).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={mode === item}
                onClick={() => { setMode(item); setSelectedKey(null); setSelectedNutrient(null); setMultiSelectedNutrients([]); setLookupSelectedFood(null); setLookupSelectedNutrient(null); setSelectedLiveProduct(null); setSelectedProductNames([]); setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); setComparing(false); }}
                className={`rounded-md px-4 py-1.5 text-sm ${mode === item ? "realm-banner-btn font-medium" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-week-${item}`}>{item === "foods" ? "Foods" : "Nutrients"}</button>
            ))}
            <button type="button" role="tab" aria-selected={comparing}
              onClick={() => { setSelectedKey(null); setSelectedNutrient(null); setMultiSelectedNutrients([]); setLookupSelectedFood(null); setLookupSelectedNutrient(null); setSelectedLiveProduct(null); setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); startCompare(); }}
              className={`rounded-md px-4 py-1.5 text-sm ${comparing ? "realm-banner-btn font-medium" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-week-compare">Compare</button>
          </div>
        </div>
        {comparing ? (
          // 2026-11-01 (owner) — the compare input lives here now, not in
          // column 2, so every resolved subject's own panel (columns 2+3,
          // below) can start right at the top of its column instead of
          // sharing space with the search box above it.
          <div className="mt-3 flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm shadow-sm">
            <div className="sticky top-0 z-10 flex items-center justify-end border-b border-border/30 bg-card px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setComparing(false); setCompareBundle(undefined); setExpandedComparisonDimensions(new Set()); }}
                data-testid="button-compare-close"
              >
                Close
              </button>
            </div>
            <div className="px-3 sm:px-4 pt-3 pb-3 sm:pb-4 space-y-4">
              <FoodComparisonPage embedded seedItems={compareSeed} hideResult onBundleChange={setCompareBundle} />
              {/* 2026-11-01 (owner) — "I don't want the summary at the top of
                  the column, it should be below the input": the verdict used
                  to render above the first food's own panel in column 2. It's
                  a fact about the comparison as a whole, not about whichever
                  food renders first, so it now sits here instead — directly
                  below the item inputs it's the result of. */}
              {compareBundle && compareResolved.length > 0 && (
                <ComparisonVerdict
                  recommendation={compareBundle.recommendation}
                  recommendationGap={compareBundle.recommendationGap}
                  trust={compareBundle.trust}
                />
              )}
            </div>
          </div>
        ) : (
        <>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <form className="relative min-w-0 flex-1" onSubmit={(event) => { event.preventDefault(); setSubmittedQuery(query.trim()); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setSubmittedQuery(""); }}
              placeholder="Search foods, nutrients or attributes" aria-label="Search foods, nutrients or attributes"
              className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="input-week-food-search" />
            <button type="button" onClick={() => setShowBarcodeScanner(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Scan a barcode" data-testid="button-open-barcode-scanner">
              <ScanBarcode className="h-4 w-4" />
            </button>
          </form>
          <label className="sr-only" htmlFor="food-week-picker">Choose a Planner week</label>
          <select id="food-week-picker" value={week} onChange={(event) => { onWeekChange(event.target.value); setSelectedKey(null); }}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm" data-testid="select-food-week">
            {(availableWeeks.includes(week) ? availableWeeks : [week, ...availableWeeks]).map((value) =>
              <option key={value} value={value}>{value === week && isDefaultWeek ? `This week · Week ${value}` : `Week ${value}`}</option>)}
          </select>
        </div>
        {/* FOODBG1 follow-up (2026-10-30) — fixed height + internal scroll, not
            min-height: as the search narrows the row count (or the lookup
            result block below it mounts), the box's own footprint no longer
            changes, so the page's total height stays stable while typing —
            that stability is what stops the background photo visibly
            rescaling/"moving" mid-search (CSS `cover` sizing recomputes
            against this box's live height; a height that keeps changing on
            every keystroke is what made it look like a bug). */}
        <div className="mt-3 flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm shadow-sm">
          {/* Sticky header (2026-10-31; restructured 2026-10-31) — pinned to
              the top of this box's own scroll, not the page's. Previously
              this used a negative margin to bleed into the box's own padding
              so its background would reach the edges — but position:sticky
              combined with a negative margin is unreliable (the "stuck"
              geometry doesn't account for the margin consistently), which is
              what let a scrolled-past row peek out above the header instead
              of disappearing behind it. Fixed the standard way instead: the
              OUTER box carries no padding of its own at all, so this header
              (flush against the box edges, full width, real background) and
              the content wrapper below (which supplies its own padding) sit
              side by side rather than one trying to escape the other's. */}
          <div className="sticky top-0 z-10 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground bg-card border-b border-border/30">
            <span>{mode === "foods" ? "Foods in this week’s meals" : "Nutrients in this week’s foods"}</span>
            <span>{mode === "foods" ? `${visibleRows.length} foods` : `${visibleNutrients.length} nutrients`}</span>
          </div>
          <div className="px-3 sm:px-4 pt-3 pb-3 sm:pb-4">
          {isLoading ? <p className="py-8 text-sm text-muted-foreground">Loading this week’s meals…</p> : mode === "foods" ? (
            <div className="space-y-2">
              {visibleRows.map((row) => (
                <button key={row.displayKey} type="button" onClick={() => { setSelectedKey(row.displayKey); setLookupSelectedFood(null); setLookupSelectedNutrient(null); setSelectedLiveProduct(null); setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); setComparing(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${selected?.displayKey === row.displayKey ? "border-primary/50 bg-card shadow-sm" : "border-border/60 hover:bg-muted/40"}`}
                  data-testid={`week-food-${row.displayKey}`}>
                  <FoodImage row={row} />
                  <span className="min-w-0 flex-1"><strong className="block text-sm truncate">{row.displayName}</strong><span className="mt-0.5 block text-xs text-muted-foreground truncate">{mealContext(row)}</span></span>
                  <span aria-hidden="true" className="shrink-0 text-muted-foreground">›</span>
                </button>
              ))}
              {visibleRows.length === 0 && <p className="py-5 text-sm text-muted-foreground">{needle ? "No meal foods match this search in the selected week." : "No meal foods recorded for this week yet."}</p>}
            </div>
          ) : <>
          {multiSelectedNutrients.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2">
              <span className="text-[11px] font-medium text-muted-foreground">Find foods with all of:</span>
              {multiSelectedNutrients.map((name) => (
                <span key={name} className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-2 py-0.5 text-[11px]">
                  {name}
                  <button type="button" onClick={() => toggleMultiNutrient(name)} aria-label={`Remove ${name}`} className="text-muted-foreground hover:text-foreground">×</button>
                </span>
              ))}
              <button type="button" onClick={() => setMultiSelectedNutrients([])} className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground">Clear</button>
            </div>
          )}
          <div className="space-y-2">{visibleNutrients.map((name) => (
            <div key={name}
              className={`flex w-full items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${selectedNutrient === name ? "border-primary/50 bg-card font-medium shadow-sm" : "border-border/60 hover:bg-muted/40"}`}>
              <input type="checkbox" checked={multiSelectedNutrients.includes(name)} onChange={() => toggleMultiNutrient(name)}
                aria-label={`Select ${name} to filter foods with multiple nutrients`}
                className="h-3.5 w-3.5 shrink-0 accent-primary" data-testid={`checkbox-multi-nutrient-${name}`} />
              <button type="button" onClick={() => { setSelectedNutrient(name); setLookupSelectedFood(null); setLookupSelectedNutrient(null); setSelectedLiveProduct(null); setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); setComparing(false); }}
                className="min-w-0 flex-1 text-left">{name}</button>
              <span className="shrink-0 text-xs text-muted-foreground">{rows.filter((row) => row.keyNutrients.includes(name)).length} foods</span>
            </div>
          ))}{visibleNutrients.length === 0 && <p className="py-5 text-sm text-muted-foreground">No linked nutrients found for this week.</p>}</div>
          </>}
          {needle && <div className="mt-4 border-t border-border/50 pt-3 text-sm">
            {lookupPending && <p className="text-muted-foreground">Looking up food knowledge…</p>}
            {lookup?.food && <div className="rounded-lg bg-muted/40 p-3"><strong>{lookup.food.name}</strong><span className="ml-2 text-xs text-muted-foreground">{matchedThisWeek ? "In this week’s meals" : "Not eaten in selected week"}</span>
              {lookup.food.canonicalSlug && (
                <button type="button" className="mt-1 block text-xs text-primary underline"
                  onClick={() => { setLookupSelectedFood({ name: lookup.food!.name, canonicalSlug: lookup.food!.canonicalSlug! }); setLookupSelectedNutrient(null); setSelectedLiveProduct(null); setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); setComparing(false); }}
                  data-testid="button-lookup-view-food-details">
                  View food details
                </button>
              )}</div>}
            {lookup?.nutrient && (
              <button type="button" className="w-full rounded-lg bg-muted/40 p-3 text-left text-muted-foreground hover:text-foreground"
                onClick={() => { setLookupSelectedNutrient(lookup.nutrient!); setLookupSelectedFood(null); setSelectedLiveProduct(null); setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); setComparing(false); }}
                data-testid="button-lookup-view-nutrient">
                {lookup.nutrient.name}: {lookup.nutrient.foods.length} linked foods in Food Knowledge.
                <span className="ml-1 text-primary underline">View</span>
              </button>
            )}
            {!lookupPending && !lookup && <button type="button" onClick={() => setSubmittedQuery(query.trim())} className="text-xs text-primary underline">Search all foods</button>}
            {/* 2026-11-02 (owner) — "searching... in foods should show both
                foods from analyser and THA's own library": packaged products
                found by the SAME live search Analyser's own search uses,
                rendered alongside the food/nutrient results above rather than
                as a link that navigates away from this page. */}
            {(lookup?.food || lookup?.nutrient) && <div className="mt-3 border-t border-border/40 pt-3" />}
            {liveProductPending && <p className="text-muted-foreground">Searching packaged products…</p>}
            {/* 2026-11-02 (owner) — "i search ketchup - and on the result i
                should be able to select them and then hit compare": a
                checkbox per result (same pattern as the multi-nutrient
                checkboxes above) lets several search results be picked
                without leaving this list; the name itself stays its own
                clickable target for "view this one now", so ticking a box
                and opening a product are two separate actions on the same
                row, not one overloaded click. */}
            {selectedProductNames.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2">
                <span className="text-[11px] font-medium text-muted-foreground">Compare:</span>
                {selectedProductNames.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-2 py-0.5 text-[11px]">
                    {name}
                    <button type="button" onClick={() => toggleProductSelection(name)} aria-label={`Remove ${name}`} className="text-muted-foreground hover:text-foreground">×</button>
                  </span>
                ))}
                <button type="button" onClick={() => setSelectedProductNames([])} className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground">Clear</button>
                {selectedProductNames.length >= 2 && (
                  <button
                    type="button"
                    className="w-full mt-1 rounded-md realm-banner-btn px-3 py-1.5 text-xs font-medium"
                    onClick={() => {
                      setLookupSelectedFood(null); setLookupSelectedNutrient(null); setSelectedLiveProduct(null);
                      setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null);
                      startCompare(selectedProductNames);
                      setSelectedProductNames([]);
                    }}
                    data-testid="button-compare-selected-products"
                  >
                    Compare {selectedProductNames.length} selected
                  </button>
                )}
              </div>
            )}
            {(liveProductSearch?.products ?? []).slice(0, 5).map((p) => (
              <div
                key={p.barcode ?? p.product_name}
                className="flex w-full items-center gap-2 rounded-lg bg-muted/40 p-3 hover:bg-muted/70"
              >
                <input
                  type="checkbox"
                  checked={selectedProductNames.includes(p.product_name)}
                  onChange={() => toggleProductSelection(p.product_name)}
                  aria-label={`Select ${p.product_name} to compare`}
                  className="h-3.5 w-3.5 shrink-0 accent-primary"
                  data-testid={`checkbox-live-product-${p.barcode ?? p.product_name}`}
                />
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => { setSelectedLiveProduct(p); setLookupSelectedFood(null); setLookupSelectedNutrient(null); setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); setComparing(false); }}
                  data-testid={`button-live-product-${p.barcode ?? p.product_name}`}
                >
                  {p.upfAnalysis?.thaRating != null && (
                    <AppleRating rating={p.upfAnalysis.thaRating} sizePx={18} showTooltip={false} animate={false} />
                  )}
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate">{p.product_name}</strong>
                    {p.brand && <span className="block text-xs text-muted-foreground truncate">{p.brand}</span>}
                  </span>
                </button>
                <span className="shrink-0 text-[11px] text-muted-foreground">Analyser</span>
              </div>
            ))}
            {!liveProductPending && liveProductSearch && liveProductSearch.products.length === 0 && (
              <p className="text-xs text-muted-foreground">No packaged products found for “{query}”.</p>
            )}
          </div>}
          </div>
        </div>
        </>
        )}
      </section>
      {/* 2026-11-01 (owner) — comparing now renders its own dynamic set of
          columns (below, one per resolved food) in place of these two fixed
          ones entirely, rather than squeezing results into them — so these
          keep exactly their pre-Compare, non-compare behaviour and no longer
          need to know `comparing` exists at all. */}
      {comparing ? (
        Array.from({ length: compareColumnCount }).map((_, i) => (
          <section
            key={i}
            ref={(el) => { compareColumnRefs.current[i] = el; }}
            onScroll={() => syncCompareScroll(i)}
            className="min-w-0 min-h-0 overflow-y-auto rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm shadow-sm"
            aria-label={compareResolved[i] ? `Compare: ${compareResolved[i].name ?? compareResolved[i].query}` : "Compare column"}
            data-testid={`week-food-compare-${i}`}
          >
            {compareResolved[i] ? (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-4 sm:pt-5">
                <SubjectComparisonPanel
                  subject={compareResolved[i]}
                  dimensions={compareOrderedDimensions}
                  expandedDimensions={expandedComparisonDimensions}
                  onToggleDimension={toggleComparisonDimension}
                />
              </div>
            ) : compareBundle ? (
              <div className="flex h-full min-h-[20rem] flex-col justify-center px-4 sm:px-5 py-4 sm:py-5">
                <p className="text-sm text-muted-foreground">We couldn't match that to a food we know — try a different name.</p>
              </div>
            ) : (
              <div className="flex h-full min-h-[20rem] flex-col justify-center px-4 sm:px-5 py-4 sm:py-5">
                <h2 className="text-lg font-semibold">{i === 0 ? "Add a food" : "Add a second food"}</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Type {i === 0 ? "a food" : "another food"} into the box in the left column to compare it here.
                </p>
              </div>
            )}
          </section>
        ))
      ) : (
        <>
      {/* Full page height (minus the shell chrome above and below it), not the
          fixed 28rem column 1 uses — middle and right review the current
          selection in depth and deserve the room; the internal scroll keeps
          the PAGE itself from growing regardless. */}
      <section
        className="min-w-0 min-h-0 overflow-y-auto rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" aria-label="Food details" data-testid="week-food-details">
        {/* 2026-10-31 — no padding on the section itself (see column 1's own
            note above for why): each branch below supplies its own padding
            on its sticky header and its content wrapper instead. */}
        {multiSelectedNutrients.length >= 2 ? <>
          <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-border/50 bg-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Foods with all selected nutrients</p>
              <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setMultiSelectedNutrients([])} data-testid="button-multi-nutrient-clear">Clear</button>
            </div>
            <h2 className="mt-1 text-xl font-semibold">{multiSelectedNutrients.join(" + ")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Foods linked to every one of these nutrients in Food Knowledge — not limited to this week.
            </p>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3">
            {multiNutrientPending ? (
              <p className="text-sm text-muted-foreground">Looking up foods…</p>
            ) : multiNutrientSlugs.length < multiSelectedNutrients.length ? (
              <p className="text-sm text-muted-foreground">One of the selected nutrients couldn't be resolved — try clearing and reselecting.</p>
            ) : (
              <div className="space-y-2">
                {(multiNutrientResult?.foods ?? []).map((f) => (
                  <button key={f.name} type="button" className="block w-full rounded-lg border border-border/60 p-3 text-left text-sm hover:bg-muted/40"
                    onClick={() => f.canonicalSlug && selectRelated(f.canonicalSlug, f.name)}
                    disabled={!f.canonicalSlug} data-testid={`button-multi-nutrient-food-${f.name}`}>
                    {f.name}
                  </button>
                ))}
                {(multiNutrientResult?.foods ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No foods in Food Knowledge are linked to all of these nutrients.</p>
                )}
              </div>
            )}
          </div>
        </> : selectedLiveProduct ? <>
          {/* 2026-11-02 (owner) — "i dont want to have to open analyser - i
              want the information to display in the center column": the real
              Analyser product-detail view (ingredients, additive breakdown,
              swaps, actions), embedded directly rather than a thinner
              confirmation card pointing elsewhere — same component
              products-page.tsx itself uses for this exact job. */}
          <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 sm:pt-5 pb-2 flex items-center justify-between gap-3 bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Found via a live product search — not something you've scanned
            </p>
            <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedLiveProduct(null)} data-testid="button-live-product-clear">Clear</button>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2">
            <AnalyserDetailV2
              product={selectedLiveProduct}
              otherProducts={(liveProductSearch?.products ?? []).filter((p) => p !== selectedLiveProduct)}
              onAddToBasket={() => addToBasket.mutate(selectedLiveProduct)}
              onAddToQuickList={() => handleAddToQuickList(selectedLiveProduct)}
              onViewProduct={(p) => setSelectedLiveProduct(p as InputProduct)}
              addToBasketPending={addToBasket.isPending}
            />
          </div>
        </> : lookupSelectedFood ? <>
          {/* Sticky header — stays pinned while FoodReport/FoodQuickLook's
              own content scrolls beneath it inside this box. */}
          <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 sm:pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border/50 bg-card">
            <div>
              <h2 className="text-xl font-semibold">{lookupSelectedFood.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {rows.some((row) => row.displayName.toLocaleLowerCase() === lookupSelectedFood.name.toLocaleLowerCase())
                  ? "In this week’s meals" : "Not eaten in selected week"}
              </p>
            </div>
            <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setLookupSelectedFood(null)} data-testid="button-lookup-food-clear">Clear</button>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-5">
          <div><FoodReport canonicalSlug={lookupSelectedFood.canonicalSlug} onSelectNutrient={selectRelatedNutrient} /><FoodQuickLook slug={lookupSelectedFood.canonicalSlug} onSelectFood={selectRelated} /></div>
          <div className="mt-4 flex gap-4 text-sm"><button type="button" className="text-primary underline" onClick={() => startCompare([lookupSelectedFood.canonicalSlug])}>Compare foods</button></div>
          </div>
        </> : lookupSelectedNutrient ? <>
          <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 sm:pt-5 pb-4 flex items-start justify-between gap-3 border-b border-border/50 bg-card">
            <h2 className="text-xl font-semibold">{lookupSelectedNutrient.name}</h2>
            <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setLookupSelectedNutrient(null)} data-testid="button-lookup-nutrient-clear">Clear</button>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3">
          {lookupNutrientDetail?.nutrient.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">{lookupNutrientDetail.nutrient.description}</p>
          )}
          {lookupNutrientDetail && lookupNutrientDetail.benefits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lookupNutrientDetail.benefits.map((b) => (
                <span key={b.slug} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  {b.name}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Foods linked to {lookupSelectedNutrient.name.toLocaleLowerCase()} in Food Knowledge — not limited to this week, and not amounts consumed.
          </p>
          <div className="mt-2 space-y-2">
            {lookupSelectedNutrient.foods.map((f) => (
              <button key={f.name} type="button" className={`block w-full rounded-lg border p-3 text-left text-sm hover:bg-muted/40 ${relatedSlug?.slug === f.canonicalSlug ? "border-primary/50 bg-card shadow-sm" : "border-border/60"}`}
                onClick={() => f.canonicalSlug && selectRelated(f.canonicalSlug, f.name)}
                disabled={!f.canonicalSlug} data-testid={`button-lookup-nutrient-food-${f.name}`}>
                {f.name}
              </button>
            ))}
            {lookupSelectedNutrient.foods.length === 0 && <p className="text-sm text-muted-foreground">No foods are linked to this nutrient yet.</p>}
          </div>
          </div>
        </> : selected && mode === "foods" ? <>
          <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 sm:pt-5 pb-4 flex items-start gap-4 border-b border-border/50 bg-card"><FoodImage row={selected} large />
            <div><h2 className="text-xl font-semibold">{selected.displayName}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.reportCategory}</p><p className="mt-2 text-xs text-muted-foreground">{mealContext(selected)}</p></div></div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-5">
          <h3 className="text-sm font-semibold">Nutrients linked to this food</h3>
          <p className="mt-2 text-sm text-muted-foreground">{selected.keyNutrients.length ? selected.keyNutrients.join(" · ") : "No linked nutrient information available yet."}</p>
          {selectedCanonicalSlug && <div className="mt-5 border-t border-border/50 pt-4"><FoodReport canonicalSlug={selectedCanonicalSlug} onSelectNutrient={selectRelatedNutrient} /><FoodQuickLook slug={selectedCanonicalSlug} onSelectFood={selectRelated} /></div>}
          <p className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Meal history shows which food was used, not how much was eaten. Nutrient amounts appear only when sourced for that food.</p>
          <div className="mt-4 flex gap-4 text-sm">{hasFoodProfile && selectedCanonicalSlug && <button type="button" className="text-primary underline" onClick={() => selectRelated(selectedCanonicalSlug, selected.displayName)}>Full food profile</button>}<button type="button" className="text-primary underline" onClick={() => startCompare(selectedCanonicalSlug ? [selectedCanonicalSlug] : [])}>Compare foods</button></div>
          </div>
        </> : mode === "nutrients" ? <div className="px-4 sm:px-5 py-4 sm:py-5"><h2 className="text-xl font-semibold">{selectedNutrient ?? "Nutrients from your week"}</h2><p className="mt-2 text-sm text-muted-foreground">{selectedNutrient ? "Linked to these foods in your selected week." : "Choose a nutrient to see which of this week’s foods it is linked to."} These links do not measure how much anyone ate.</p>{selectedNutrient && <div className="mt-5 space-y-2">{rows.filter((row) => row.keyNutrients.includes(selectedNutrient)).map((row) => <button key={row.displayKey} type="button" onClick={() => { setMode("foods"); setSelectedKey(row.displayKey); }} className="block w-full rounded-lg border border-border/60 p-3 text-left text-sm hover:bg-muted/40">{row.displayName}<span className="ml-2 text-xs text-muted-foreground">{mealContext(row)}</span></button>)}</div>}<button type="button" className="mt-5 text-sm text-primary underline" onClick={() => setShowOverview((value) => !value)}>{showOverview ? "Hide household overview" : "View household nutrient overview"}</button>{showOverview && <div className="mt-4"><HouseholdNutritionCentre week={week} /></div>}</div> : <div className="flex h-full min-h-[20rem] flex-col justify-center px-4 sm:px-5 py-4 sm:py-5"><h2 className="text-lg font-semibold">Choose a food</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Select a food from your meals to see its details here.</p><button type="button" className="mt-5 self-start text-sm text-primary underline" onClick={() => startCompare()}>Compare foods</button></div>}
      </section>
      {/* FOODUI1 follow-up (2026-10-30) — third column: "review related
          food/nutrient". Embeds the real food-detail page (not a lighter
          duplicate of column 2) so "View full food page" and a Connected
          Foods/Discover chip genuinely show more, not the same thing again.
          Same fixed height + scroll as the other two columns, so picking
          something related never grows the overall page. */}
      <section
        className="min-w-0 min-h-0 overflow-y-auto rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" aria-label="Related food" data-testid="week-food-related">
        {/* 2026-10-31 — same no-padding-on-the-section restructure as the
            other two columns; see column 1's note for why. */}
        {relatedSlug ? <>
          <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 sm:pt-5 pb-2 flex items-center justify-between gap-3 bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Related to your selection</p>
            <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); }} data-testid="button-related-clear">Clear</button>
          </div>
          {/* FoodDetailPage's own `embedded` mode renders with no padding of
              its own (it assumes a parent container already provides one) —
              this wrapper is that container. */}
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2">
            <FoodDetailPage embedded embeddedSlug={relatedSlug.slug} onSelectFood={selectRelated} />
          </div>
        </> : relatedNutrientName ? <>
          <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 sm:pt-5 pb-4 border-b border-border/50 bg-card">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Related to your selection</p>
              <button type="button" className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setRelatedSlug(null); setRelatedNutrientName(null); setRelatedNutrientSlug(null); }} data-testid="button-related-clear">Clear</button>
            </div>
            <h2 className="mt-1 text-xl font-semibold">{relatedNutrientName}</h2>
            {relatedNutrientDetail?.nutrient.description && (
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{relatedNutrientDetail.nutrient.description}</p>
            )}
            {relatedNutrientDetail && relatedNutrientDetail.benefits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {relatedNutrientDetail.benefits.map((b) => (
                  <span key={b.slug} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    {b.name}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Foods linked to {relatedNutrientName.toLocaleLowerCase()} in Food Knowledge — not limited to this week, and not amounts consumed.
            </p>
          </div>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-5">
          {relatedNutrientPending ? (
            <p className="text-sm text-muted-foreground">Looking up linked foods…</p>
          ) : (
            <div className="space-y-2">
              {(relatedNutrientLookup?.nutrient?.foods ?? []).map((f) => (
                <button key={f.name} type="button" className="block w-full rounded-lg border border-border/60 p-3 text-left text-sm hover:bg-muted/40"
                  onClick={() => f.canonicalSlug && selectRelated(f.canonicalSlug, f.name)}
                  disabled={!f.canonicalSlug} data-testid={`button-related-nutrient-food-${f.name}`}>
                  {f.name}
                </button>
              ))}
              {(relatedNutrientLookup?.nutrient?.foods ?? []).length === 0 && <p className="text-sm text-muted-foreground">No foods are linked to this nutrient yet.</p>}
            </div>
          )}
          </div>
        </> : (
          <div className="flex h-full min-h-[20rem] flex-col justify-center px-4 sm:px-5 py-4 sm:py-5">
            <h2 className="text-lg font-semibold">Nothing related selected</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              A similar food, a key nutrient pill, or "View full food page" from the middle column opens its detail here.
            </p>
          </div>
        )}
      </section>
        </>
      )}
    </div>
    <BarcodeScanner isOpen={showBarcodeScanner} onScan={handleBarcodeScan} onClose={() => setShowBarcodeScanner(false)} />
    </>
  );
}
