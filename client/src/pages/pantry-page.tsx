import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2, Plus, Loader2, Home, Refrigerator, Archive, Layers,
  ShoppingBasket, ChevronDown, PawPrint, Apple, Search, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FirstVisitHint } from "@/components/first-visit-hint";
import { getPantryKnowledge, pantryItemMatchesQuery, MICRO_INSIGHTS } from "@/lib/pantry-knowledge";
import { PageHeader } from "@/components/PageHeader";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

interface PantryItem {
  id: number;
  userId: number;
  ingredientKey: string;
  displayName: string | null;
  category: string;
  isDefault: boolean;
  isDeleted: boolean;
  notes: string | null;
  needQuantityValue: number | null;
  needUnit: string | null;
}

// ── Need Quantity inline control ──────────────────────────────────────────────

function NeedQuantityControl({
  item,
  onPatch,
}: {
  item: PantryItem;
  onPatch: (id: number, qty: number | null, unit: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [unit, setUnit] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const hasNeed = item.needQuantityValue !== null;

  const save = () => {
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) {
      setEditing(false);
      return;
    }
    onPatch(item.id, n, unit.trim() || null);
    setEditing(false);
  };

  const handleFocusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) save();
  };

  if (editing) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-1 shrink-0"
        onBlur={handleFocusOut}
      >
        <input
          autoFocus
          type="number"
          min={0.1}
          step={0.5}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="w-12 h-6 text-xs px-1.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 tabular-nums text-center"
          data-testid={`input-need-qty-${item.id}`}
        />
        <input
          type="text"
          placeholder="unit"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="w-12 h-6 text-xs px-1.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
          data-testid={`input-need-unit-${item.id}`}
        />
      </div>
    );
  }

  if (hasNeed) {
    return (
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => { setVal(item.needQuantityValue!.toString()); setUnit(item.needUnit ?? ""); setEditing(true); }}
          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-700 hover:bg-amber-100 transition-colors dark:bg-amber-950/20 dark:border-amber-800/50 dark:text-amber-400"
          data-testid={`button-need-qty-edit-${item.id}`}
        >
          Need {item.needQuantityValue}{item.needUnit ? ` ${item.needUnit}` : ""}
        </button>
        <button
          onClick={() => onPatch(item.id, null, null)}
          className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors"
          title="Clear need quantity"
          data-testid={`button-need-qty-clear-${item.id}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setVal("1"); setUnit(""); setEditing(true); }}
      className="shrink-0 text-[11px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/25 text-muted-foreground/40 hover:text-muted-foreground/70 hover:border-muted-foreground/40 transition-colors"
      data-testid={`button-need-qty-add-${item.id}`}
    >
      + Need
    </button>
  );
}

function PantryIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="1" y1="20" x2="23" y2="20" />
      <rect x="1.5" y="14" width="5" height="6" rx="1" />
      <rect x="2.5" y="12.5" width="3" height="2" rx="0.5" />
      <rect x="9.5" y="11" width="5" height="9" rx="1" />
      <rect x="10.5" y="9.5" width="3" height="2" rx="0.5" />
      <rect x="17" y="13" width="5.5" height="7" rx="1" />
      <rect x="18" y="11.5" width="3" height="2" rx="0.5" />
    </svg>
  );
}

// ── Category definitions ──────────────────────────────────────────────────────

const FOOD_CATS = [
  { value: "larder"  as const, label: "Larder",  icon: Archive      },
  { value: "fridge"  as const, label: "Fridge",  icon: Refrigerator },
  { value: "freezer" as const, label: "Freezer", icon: Layers       },
  { value: "fruit"   as const, label: "Fruit",   icon: Apple        },
];

const HOME_CATS = [
  { value: "household" as const, label: "Household",       icon: Home     },
  { value: "pet"       as const, label: "Pet Food & Care", icon: PawPrint },
];

type FoodCat = typeof FOOD_CATS[number]["value"];
type HomeCat = typeof HOME_CATS[number]["value"];

const FOOD_CAT_EMPTY: Record<FoodCat, string> = {
  larder:  "No larder staples yet — try adding olive oil or pasta.",
  fridge:  "No fridge staples yet — try adding milk or eggs.",
  freezer: "No freezer items yet.",
  fruit:   "No fruit yet — try adding apples or berries.",
};

const HOME_CAT_EMPTY: Record<HomeCat, string> = {
  household: "No household items yet.",
  pet:       "No pet food or care items yet.",
};


// ── Category tab buttons ──────────────────────────────────────────────────────
// Used in the page banner (via PageHeader center/actions) and not inside cards.
// Selected = realm-bg/realm-text; unselected = muted foreground.

function CategoryTabs<T extends string>({
  categories,
  active,
  onChange,
  className,
}: {
  categories: Array<{ value: T; label: string; icon: React.ComponentType<{ className?: string }> }>;
  active: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={className ?? "flex items-center gap-1 rounded-lg bg-muted/40 p-1"}
      role="tablist"
    >
      {categories.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="tab"
          aria-selected={active === value}
          onClick={() => onChange(value)}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
            active === value
              ? "shadow-sm realm-banner-btn"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid={`button-pantry-cat-${value}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{label.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}

// ── Food Pantry Section ───────────────────────────────────────────────────────
// Tabs are rendered in the page banner — not inside this card.

function FoodPantrySection({
  items,
  isLoading,
  activeCategory,
  onCategoryChange,
}: {
  items: PantryItem[];
  isLoading: boolean;
  activeCategory: FoodCat;
  onCategoryChange: (c: FoodCat) => void;
}) {
  const { toast } = useToast();
  const qclient = useQueryClient();

  // Single query state drives both live filtering and new-item add
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendQty, setSendQty] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [serverKnowledge, setServerKnowledge] = useState<Map<string, "loading" | null | {
    supports: string[];
    highlights?: string[];
    whyItMatters: string;
    goodToKnow?: string;
    howToChoose?: string[];
    tags: string[];
  }>>(new Map());

  const addMutation = useMutation({
    mutationFn: (data: { ingredient: string; displayName: string; category: string }) =>
      apiRequest("POST", "/api/pantry", data),
    onSuccess: () => {
      qclient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setQuery("");
    },
    onError: (err: any) => {
      const body = err?.body ?? err;
      if (body?.error === "already_exists") {
        toast({ title: "Already in pantry", description: "This ingredient is already listed.", variant: "destructive" });
      } else {
        toast({ title: "Failed to add item", variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/pantry/${id}`),
    onSuccess: (_, id) => {
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
      qclient.invalidateQueries({ queryKey: ["/api/pantry"] });
    },
    onError: () => toast({ title: "Failed to remove item", variant: "destructive" }),
  });

  const patchQuantityMutation = useMutation({
    mutationFn: ({ id, needQuantityValue, needUnit }: { id: number; needQuantityValue: number | null; needUnit: string | null }) =>
      apiRequest("PATCH", `/api/pantry/${id}`, { needQuantityValue, needUnit }),
    onSuccess: () => qclient.invalidateQueries({ queryKey: ["/api/pantry"] }),
    onError: () => toast({ title: "Failed to update need quantity", variant: "destructive" }),
  });

  const handlePatchQuantity = (id: number, qty: number | null, unit: string | null) => {
    patchQuantityMutation.mutate({ id, needQuantityValue: qty, needUnit: unit });
  };

  const foodCatValues = FOOD_CATS.map(c => c.value as string);
  const allFoodItems = items.filter(i => foodCatValues.includes(i.category));
  const activeItems = allFoodItems.filter(i => i.category === activeCategory);

  const displayedItems = useMemo(() => {
    if (!query.trim()) return activeItems;
    return activeItems.filter(item =>
      pantryItemMatchesQuery(item.displayName || item.ingredientKey, item.ingredientKey, query)
    );
  }, [activeItems, query]);

  // Called when banner tab changes
  const handleCategoryChange = (cat: FoodCat) => {
    onCategoryChange(cat);
    setSelected(new Set());
    setQuery("");
  };

  const handleAdd = () => {
    if (!query.trim()) return;
    addMutation.mutate({ ingredient: query.trim(), displayName: query.trim(), category: activeCategory });
  };

  const toggleItem = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const ids = displayedItems.map(i => i.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const toggleExpanded = (id: number, ingredientKey: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const staticKnowledge = getPantryKnowledge(ingredientKey);
        if (!staticKnowledge && !serverKnowledge.has(ingredientKey)) {
          setServerKnowledge(m => new Map(m).set(ingredientKey, "loading"));
          fetch(`/api/pantry/knowledge/${encodeURIComponent(ingredientKey)}`)
            .then(r => r.json())
            .then(data => setServerKnowledge(m => new Map(m).set(ingredientKey, data)))
            .catch(() => setServerKnowledge(m => new Map(m).set(ingredientKey, null)));
        }
      }
      return next;
    });
  };

  const sendToBasket = async () => {
    if (selected.size === 0) return;
    setSending(true);
    const toSend = allFoodItems.filter(i => selected.has(i.id));
    try {
      await Promise.all(
        toSend.map(item =>
          apiRequest("POST", "/api/shopping-list", {
            productName: item.displayName || item.ingredientKey,
            quantityValue: sendQty,
            unit: "unit",
            category: item.category,
            source: "pantry",
          })
        )
      );
      toast({ title: `Added ${toSend.length} item${toSend.length > 1 ? "s" : ""} to basket` });
      setSelected(new Set());
      setSendQty(1);
      qclient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    } catch {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const needItems = displayedItems.filter(i => i.needQuantityValue !== null);
  const inPantryItems = displayedItems.filter(i => i.needQuantityValue === null);
  const showGroupHeaders = needItems.length > 0;

  const selectedInActive = displayedItems.filter(i => selected.has(i.id)).length;
  const allActiveSelected = displayedItems.length > 0 && displayedItems.every(i => selected.has(i.id));
  const catLabel = FOOD_CATS.find(c => c.value === activeCategory)?.label.toLowerCase() ?? "pantry";

  return (
    <Card className="p-4 sm:p-5">
      {/* Section header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PantryIcon className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Food</h2>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={sendQty}
              onChange={e => setSendQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 h-8 text-[13px] px-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 tabular-nums text-center"
              aria-label="Quantity to send"
              data-testid="input-food-send-qty"
            />
            <Button
              size="sm"
              className="realm-banner-btn"
              onClick={sendToBasket}
              disabled={sending}
              data-testid="button-food-send-to-basket"
            >
              {sending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShoppingBasket className="h-3 w-3 mr-1" />}
              Send {selected.size}
            </Button>
          </div>
        )}
      </div>

      {/* Unified search + add — single field drives live filtering and new-item add */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${catLabel} or add ingredient…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="w-full pl-8 pr-8 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            data-testid="input-food-pantry-ingredient"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          className="realm-banner-btn"
          onClick={handleAdd}
          disabled={!query.trim() || addMutation.isPending}
          data-testid="button-food-pantry-add"
        >
          {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          <span className="ml-1">Add</span>
        </Button>
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : query.trim() && displayedItems.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-6">
          No items matched "{query}"
        </p>
      ) : (
        <div
          className="rounded-lg border border-border/40 overflow-hidden"
          style={{ background: "color-mix(in srgb, var(--realm-bg) 22%, white)" }}
        >
          {displayedItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-4 py-5">
              {FOOD_CAT_EMPTY[activeCategory]}
            </p>
          ) : (
            <div className="px-3 pt-1 pb-2">
              <label className="flex items-center gap-3 pb-2 mb-1 border-b border-border/40 cursor-pointer select-none min-h-[2.75rem]">
                <Checkbox
                  checked={allActiveSelected}
                  onCheckedChange={toggleAll}
                  data-testid={`checkbox-select-all-${activeCategory}`}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
                {selectedInActive > 0 && (
                  <Badge variant="default" className="text-[10px] h-4 px-1.5 ml-auto">
                    {selectedInActive} selected
                  </Badge>
                )}
              </label>

              <div className="max-h-72 overflow-y-auto">
                {([
                  ...(showGroupHeaders ? [{ group: "need" as const, groupItems: needItems }] : []),
                  { group: "inPantry" as const, groupItems: showGroupHeaders ? inPantryItems : displayedItems },
                ]).map(({ group, groupItems }) => (
                  <div key={group}>
                    {showGroupHeaders && (
                      <p className={`text-[10px] uppercase tracking-[0.08em] font-semibold px-0.5 pt-1.5 pb-0.5 ${
                        group === "need"
                          ? "text-amber-600/80 dark:text-amber-400/70"
                          : "text-muted-foreground/40 mt-1"
                      }`}>
                        {group === "need" ? "Need" : "In Pantry"}
                      </p>
                    )}
                    {groupItems.map(item => {
                      const staticKnow = getPantryKnowledge(item.ingredientKey);
                      const serverKnow = serverKnowledge.get(item.ingredientKey);
                      const knowledge = staticKnow ?? (serverKnow !== "loading" ? serverKnow ?? null : null);
                      const isExpanded = expandedItems.has(item.id);
                      const isLoadingKnowledge = serverKnow === "loading";

                      return (
                        <div key={item.id} className="group" data-testid={`row-food-pantry-item-${item.id}`}>
                          <div className="flex items-center gap-1">
                            <label
                              className="flex items-center gap-3 flex-1 min-w-0 py-2.5 cursor-pointer select-none min-h-[2.75rem]"
                              data-testid={`label-food-${item.id}`}
                            >
                              <Checkbox
                                checked={selected.has(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                                data-testid={`checkbox-food-${item.id}`}
                              />
                              <span className="text-sm flex-1 min-w-0 truncate">{item.displayName || item.ingredientKey}</span>
                            </label>
                            <NeedQuantityControl item={item} onPatch={handlePatchQuantity} />
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.id, item.ingredientKey)}
                              className="p-2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors shrink-0"
                              title={isExpanded ? "Hide details" : "Learn about this ingredient"}
                              data-testid={`button-food-pantry-expand-${item.id}`}
                            >
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={() => deleteMutation.mutate(item.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-food-pantry-delete-${item.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {isExpanded && (
                            <div className="pl-9 pr-3 pb-3 space-y-2.5 border-t border-border/30 mt-0.5">
                              {isLoadingKnowledge && (
                                <p className="text-xs text-muted-foreground/50 italic pt-2.5">Loading ingredient info…</p>
                              )}
                              {!isLoadingKnowledge && knowledge && (
                                <>
                                  {knowledge.supports.length > 0 && (
                                    <div className="pt-2.5">
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium mb-1.5">Supports</p>
                                      <div className="flex flex-wrap gap-1">
                                        {knowledge.supports.map(s => (
                                          <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">{s}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {knowledge.highlights && knowledge.highlights.length > 0 && (
                                    <div className={knowledge.supports.length === 0 ? "pt-2.5" : ""}>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium mb-1.5">Highlights</p>
                                      <div className="flex flex-wrap gap-1">
                                        {knowledge.highlights.map(h => (
                                          <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/40 text-muted-foreground border border-border/40">{h}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium mb-0.5">Why it matters</p>
                                    <p className="text-xs text-muted-foreground/80 leading-relaxed">{knowledge.whyItMatters}</p>
                                  </div>
                                  {knowledge.goodToKnow && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium mb-0.5">Good to know</p>
                                      <p className="text-xs text-muted-foreground/80 leading-relaxed">{knowledge.goodToKnow}</p>
                                    </div>
                                  )}
                                  {knowledge.howToChoose && knowledge.howToChoose.length > 0 && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium mb-1">How to choose</p>
                                      <ul className="space-y-0.5">
                                        {knowledge.howToChoose.map((tip, i) => (
                                          <li key={i} className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                                            <span className="text-muted-foreground/40 mt-0.5 shrink-0">·</span>
                                            {tip}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              )}
                              {!isLoadingKnowledge && !knowledge && (
                                <p className="text-xs text-muted-foreground/50 italic pt-2.5">No additional info available yet.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Home Pantry Section ───────────────────────────────────────────────────────
// Tabs are rendered in the page banner — not inside this card.
// Unified query field drives both live filtering and new-item add (same pattern as Food).

function HomePantrySection({
  items,
  isLoading,
  activeCategory,
  onCategoryChange,
}: {
  items: PantryItem[];
  isLoading: boolean;
  activeCategory: HomeCat;
  onCategoryChange: (c: HomeCat) => void;
}) {
  const { toast } = useToast();
  const qclient = useQueryClient();

  // Single query state drives both live filtering and new-item add
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendQty, setSendQty] = useState(1);

  const homeCatValues = HOME_CATS.map(c => c.value as string);
  const allHomeItems = items.filter(i => homeCatValues.includes(i.category));
  const activeItems = allHomeItems.filter(i => i.category === activeCategory);

  const displayedItems = useMemo(() => {
    if (!query.trim()) return activeItems;
    const q = query.toLowerCase();
    return activeItems.filter(item =>
      (item.displayName || item.ingredientKey).toLowerCase().includes(q)
    );
  }, [activeItems, query]);

  const addMutation = useMutation({
    mutationFn: ({ name, cat }: { name: string; cat: string }) =>
      apiRequest("POST", "/api/pantry", { ingredient: name, displayName: name, category: cat }),
    onSuccess: () => {
      qclient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setQuery("");
    },
    onError: (err: any) => {
      const body = err?.body ?? err;
      if (body?.error === "already_exists") {
        toast({ title: "Already in list", description: "This item is already there.", variant: "destructive" });
      } else {
        toast({ title: "Failed to add item", variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/pantry/${id}`),
    onSuccess: (_, id) => {
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
      qclient.invalidateQueries({ queryKey: ["/api/pantry"] });
    },
    onError: () => toast({ title: "Failed to remove item", variant: "destructive" }),
  });

  const patchQuantityMutation = useMutation({
    mutationFn: ({ id, needQuantityValue, needUnit }: { id: number; needQuantityValue: number | null; needUnit: string | null }) =>
      apiRequest("PATCH", `/api/pantry/${id}`, { needQuantityValue, needUnit }),
    onSuccess: () => qclient.invalidateQueries({ queryKey: ["/api/pantry"] }),
    onError: () => toast({ title: "Failed to update need quantity", variant: "destructive" }),
  });

  const handlePatchQuantity = (id: number, qty: number | null, unit: string | null) => {
    patchQuantityMutation.mutate({ id, needQuantityValue: qty, needUnit: unit });
  };

  const handleAdd = () => {
    if (!query.trim()) return;
    // Pass category explicitly to avoid stale closure
    addMutation.mutate({ name: query.trim(), cat: activeCategory });
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const ids = displayedItems.map(i => i.id);
    const allSel = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSel) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const handleCategoryChange = (cat: HomeCat) => {
    onCategoryChange(cat);
    setSelected(new Set());
    setQuery("");
  };

  const sendToBasket = async () => {
    if (selected.size === 0) return;
    setSending(true);
    const toSend = allHomeItems.filter(i => selected.has(i.id));
    try {
      await Promise.all(
        toSend.map(item =>
          apiRequest("POST", "/api/shopping-list", {
            productName: item.displayName || item.ingredientKey,
            quantityValue: sendQty,
            unit: "unit",
            category: item.category,
            source: item.category === "pet" ? "pantry" : "household",
          })
        )
      );
      toast({ title: `Added ${toSend.length} item${toSend.length > 1 ? "s" : ""} to basket` });
      setSelected(new Set());
      setSendQty(1);
      qclient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    } catch {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const homeNeedItems = displayedItems.filter(i => i.needQuantityValue !== null);
  const homeInPantryItems = displayedItems.filter(i => i.needQuantityValue === null);
  const homeShowGroupHeaders = homeNeedItems.length > 0;

  const allActiveSelected = displayedItems.length > 0 && displayedItems.every(i => selected.has(i.id));
  const catLabel = HOME_CATS.find(c => c.value === activeCategory)?.label.toLowerCase() ?? "item";

  return (
    <Card className="p-4 sm:p-5">
      {/* Section header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Home</h2>
          <CategoryTabs
            categories={HOME_CATS}
            active={activeCategory}
            onChange={handleCategoryChange}
            className="flex items-center gap-1 rounded-lg bg-muted/40 p-0.5 ml-1"
          />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={sendQty}
              onChange={e => setSendQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 h-8 text-[13px] px-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 tabular-nums text-center"
              aria-label="Quantity to send"
              data-testid="input-household-send-qty"
            />
            <Button
              size="sm"
              className="realm-banner-btn"
              onClick={sendToBasket}
              disabled={sending}
              data-testid="button-send-to-basket"
            >
              {sending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShoppingBasket className="h-3 w-3 mr-1" />}
              Send {selected.size}
            </Button>
          </div>
        )}
      </div>

      {/* Unified search + add — same pattern as Food panel */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${catLabel} or add item…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="w-full pl-8 pr-8 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            data-testid="input-household-item"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          className="realm-banner-btn"
          onClick={handleAdd}
          disabled={!query.trim() || addMutation.isPending}
          data-testid="button-household-add"
        >
          {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          <span className="ml-1">Add</span>
        </Button>
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : query.trim() && displayedItems.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-6">
          No items matched "{query}"
        </p>
      ) : (
        <div
          className="rounded-lg border border-border/40 overflow-hidden"
          style={{ background: "color-mix(in srgb, var(--realm-bg) 22%, white)" }}
        >
          {displayedItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-4 py-5">
              {HOME_CAT_EMPTY[activeCategory]}
            </p>
          ) : (
            <div className="px-3 pt-1 pb-2">
              <label className="flex items-center gap-3 pb-2 border-b border-border/40 mb-1 cursor-pointer select-none min-h-[2.75rem]">
                <Checkbox
                  checked={allActiveSelected}
                  onCheckedChange={toggleAll}
                  data-testid="checkbox-select-all-household"
                />
                <span className="text-xs text-muted-foreground">Select all</span>
                {selected.size > 0 && (
                  <Badge variant="default" className="text-[10px] h-4 px-1.5 ml-auto">
                    {selected.size} selected
                  </Badge>
                )}
              </label>
              <div className="max-h-72 overflow-y-auto">
                {([
                  ...(homeShowGroupHeaders ? [{ group: "need" as const, groupItems: homeNeedItems }] : []),
                  { group: "inPantry" as const, groupItems: homeShowGroupHeaders ? homeInPantryItems : displayedItems },
                ]).map(({ group, groupItems }) => (
                  <div key={group}>
                    {homeShowGroupHeaders && (
                      <p className={`text-[10px] uppercase tracking-[0.08em] font-semibold px-0.5 pt-1.5 pb-0.5 ${
                        group === "need"
                          ? "text-amber-600/80 dark:text-amber-400/70"
                          : "text-muted-foreground/40 mt-1"
                      }`}>
                        {group === "need" ? "Need" : "In Pantry"}
                      </p>
                    )}
                    {groupItems.map(item => (
                      <div key={item.id} className="flex items-center gap-1 group" data-testid={`row-household-item-${item.id}`}>
                        <label
                          className="flex items-center gap-3 flex-1 min-w-0 py-2.5 cursor-pointer select-none min-h-[2.75rem]"
                          data-testid={`label-household-${item.id}`}
                        >
                          <Checkbox
                            checked={selected.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            data-testid={`checkbox-household-${item.id}`}
                          />
                          <span className="flex-1 text-sm truncate">{item.displayName || item.ingredientKey}</span>
                        </label>
                        <NeedQuantityControl item={item} onPatch={handlePatchQuantity} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-household-delete-${item.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PantryPage() {
  const { data: items = [], isLoading } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry"],
  });

  const [activeFood, setActiveFood] = useState<FoodCat>("larder");
  const [activeHome, setActiveHome] = useState<HomeCat>("household");
  const [mobileHomeOpen, setMobileHomeOpen] = useState(false);

  // Repeat-tap nav: open Home drawer when mobile nav fires tha:open-workspace for this page
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ href: string }>).detail?.href === "/pantry") {
        setMobileHomeOpen(true);
      }
    };
    window.addEventListener("tha:open-workspace", handler);
    return () => window.removeEventListener("tha:open-workspace", handler);
  }, []);

  const microInsight = MICRO_INSIGHTS[new Date().getDate() % MICRO_INSIGHTS.length];

  return (
    <>
      <PageHeader
        title="My Pantry"
        icon={<PantryIcon className="h-5 w-5" />}
        realm="pantry"
        titleTestId="text-pantry-title"
        center={
          <CategoryTabs
            categories={FOOD_CATS}
            active={activeFood}
            onChange={setActiveFood}
            className="flex items-center gap-1 rounded-lg bg-muted/40 p-1"
          />
        }
        context={<span>Your everyday choices live here.</span>}
      />

      {/* data-realm propagates CSS custom properties so tabs use var(--realm-bg/text) */}
      <div
        data-realm="pantry"
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 space-y-3"
      >
        <p className="text-xs text-muted-foreground/50 italic" data-testid="text-pantry-micro-insight">
          {microInsight}
        </p>

        <FirstVisitHint
          areaKey="pantry"
          message="Add the ingredients you have at home - fridge, freezer, and larder. Your pantry helps tailor meal suggestions and avoids duplicates when you shop."
        />

        {/* Two-column layout: Food (dominant, 2/3) | Home (narrower, 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-8">
          <div className="lg:col-span-2">
            <FoodPantrySection
              items={items}
              isLoading={isLoading}
              activeCategory={activeFood}
              onCategoryChange={setActiveFood}
            />
          </div>
          <div className="lg:col-span-1">
            <HomePantrySection
              items={items}
              isLoading={isLoading}
              activeCategory={activeHome}
              onCategoryChange={setActiveHome}
            />
          </div>
        </div>
      </div>

      <Drawer open={mobileHomeOpen} onOpenChange={setMobileHomeOpen} shouldScaleBackground={false}>
        <DrawerContent className="flex flex-col max-h-[85vh]" data-testid="drawer-household" data-realm="pantry">
          <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0 realm-header-bg">
            <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" style={{ color: "var(--realm-accent)" }} />
              Home
            </DrawerTitle>
            <button
              onClick={() => setMobileHomeOpen(false)}
              className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
              aria-label="Close"
              data-testid="button-household-drawer-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="w-full h-px shrink-0 bg-[var(--realm-border)]" />
          <div
            className="flex-1 overflow-y-auto min-h-0 px-4 pt-3"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <CategoryTabs
              categories={HOME_CATS}
              active={activeHome}
              onChange={(v) => { setActiveHome(v); setMobileHomeOpen(false); }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
