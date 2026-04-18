import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Plus, Loader2, Home, Refrigerator, Archive, Layers, ShoppingBasket, ChevronDown, ChevronRight, PawPrint, Settings2, Apple, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FirstVisitHint } from "@/components/first-visit-hint";
import { getPantryKnowledge, pantryItemMatchesQuery, MICRO_INSIGHTS } from "@/lib/pantry-knowledge";

interface PantryItem {
  id: number;
  userId: number;
  ingredientKey: string;
  displayName: string | null;
  category: string;
  isDefault: boolean;
  isDeleted: boolean;
  notes: string | null;
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

const ALL_FOOD_CATEGORIES = [
  { value: "larder", label: "Larder", icon: Archive },
  { value: "fridge", label: "Fridge", icon: Refrigerator },
  { value: "freezer", label: "Freezer", icon: Layers },
  { value: "fruit", label: "Fruit", icon: Apple },
  { value: "pet", label: "Pet Food & Care", icon: PawPrint },
] as const;

type FoodCategory = "larder" | "fridge" | "freezer" | "fruit" | "pet";

function loadVisibleCats(): Set<FoodCategory> {
  try {
    const saved = localStorage.getItem("pantry-visible-cats");
    if (saved) return new Set(JSON.parse(saved) as FoodCategory[]);
  } catch {}
  return new Set<FoodCategory>(["larder", "fridge", "freezer", "fruit", "pet"]);
}

function FoodPantrySection({ items, isLoading }: { items: PantryItem[]; isLoading: boolean }) {
  const { toast } = useToast();
  const qclient = useQueryClient();
  const [ingredient, setIngredient] = useState("");
  const [category, setCategory] = useState<FoodCategory>("larder");
  const [openSections, setOpenSections] = useState<Record<FoodCategory, boolean>>({
    larder: true,
    fridge: false,
    freezer: false,
    fruit: false,
    pet: false,
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [visibleCats, setVisibleCats] = useState<Set<FoodCategory>>(loadVisibleCats);
  const [filterQuery, setFilterQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [serverKnowledge, setServerKnowledge] = useState<Map<string, "loading" | null | { supports: string[]; highlights?: string[]; whyItMatters: string; goodToKnow?: string; howToChoose?: string[]; tags: string[] }>>(new Map());

  const addMutation = useMutation({
    mutationFn: (data: { ingredient: string; displayName: string; category: string }) =>
      apiRequest("POST", "/api/pantry", data),
    onSuccess: () => {
      qclient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setIngredient("");
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

  const foodCatValues = ALL_FOOD_CATEGORIES.map(c => c.value as string);
  const foodItems = items.filter(i => foodCatValues.includes(i.category));
  const grouped = ALL_FOOD_CATEGORIES
    .filter(cat => visibleCats.has(cat.value as FoodCategory))
    .map(cat => ({
      ...cat,
      items: foodItems.filter(i => i.category === cat.value),
    }));

  const filteredGrouped = useMemo(() => {
    if (!filterQuery.trim()) return grouped;
    return grouped
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          pantryItemMatchesQuery(
            item.displayName || item.ingredientKey,
            item.ingredientKey,
            filterQuery,
          )
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [grouped, filterQuery]);

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

  const handleAdd = () => {
    if (!ingredient.trim()) return;
    addMutation.mutate({ ingredient: ingredient.trim(), displayName: ingredient.trim(), category });
  };

  const toggleSection = (cat: FoodCategory) => {
    setOpenSections(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleItem = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGroupAll = (groupItems: PantryItem[]) => {
    const ids = groupItems.map(i => i.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const sendToBasket = async () => {
    if (selected.size === 0) return;
    setSending(true);
    const toSend = foodItems.filter(i => selected.has(i.id));
    try {
      await Promise.all(
        toSend.map(item =>
          apiRequest("POST", "/api/shopping-list/extras", {
            name: item.displayName || item.ingredientKey,
            category: item.category,
          })
        )
      );
      toast({ title: `Added ${toSend.length} item${toSend.length > 1 ? "s" : ""} to basket` });
      setSelected(new Set());
      qclient.invalidateQueries({ queryKey: ["/api/shopping-list/extras"] });
    } catch {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const toggleCatVisible = (cat: FoodCategory) => {
    setVisibleCats(prev => {
      const next = new Set(prev);
      if (next.has(cat) && next.size > 1) next.delete(cat);
      else next.add(cat);
      localStorage.setItem("pantry-visible-cats", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const emptyLabel: Record<FoodCategory, string> = {
    larder: "No larder staples yet - try adding olive oil or pasta.",
    fridge: "No fridge staples yet - try adding milk or eggs.",
    freezer: "No freezer items yet.",
    fruit: "No fruit yet - try adding apples or berries.",
    pet: "No pet food or care items yet.",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <PantryIcon className="h-4 w-4 text-primary" />
          <h2 className="text-base font-medium">Food Pantry</h2>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              size="sm"
              onClick={sendToBasket}
              disabled={sending}
              data-testid="button-food-send-to-basket"
            >
              {sending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShoppingBasket className="h-3 w-3 mr-1" />}
              Send {selected.size} to Basket
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-pantry-settings">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="end">
              <p className="text-xs font-medium text-muted-foreground mb-2">Show sections</p>
              <div className="space-y-2">
                {ALL_FOOD_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <label key={cat.value} className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={visibleCats.has(cat.value as FoodCategory)}
                        onCheckedChange={() => toggleCatVisible(cat.value as FoodCategory)}
                        data-testid={`checkbox-visible-${cat.value}`}
                      />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{cat.label}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Tick items you need this week and tap "Send to Basket", or just keep them here to auto-collapse in your shopping list.
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        <Input
          placeholder="e.g. olive oil, chilli flakes…"
          value={ingredient}
          onChange={e => setIngredient(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          className="flex-1 min-w-[150px] text-sm"
          data-testid="input-food-pantry-ingredient"
        />
        <Select value={category} onValueChange={v => setCategory(v as FoodCategory)}>
          <SelectTrigger className="w-32 text-sm shrink-0" data-testid="select-food-pantry-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_FOOD_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!ingredient.trim() || addMutation.isPending}
          data-testid="button-food-pantry-add"
        >
          {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          <span className="ml-1">Add</span>
        </Button>
      </div>

      {/* Benefit / ingredient search */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by ingredient or benefit (e.g. gut health, omega-3)"
          value={filterQuery}
          onChange={e => setFilterQuery(e.target.value)}
          className="w-full pl-8 pr-8 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          data-testid="input-pantry-search"
        />
        {filterQuery && (
          <button
            type="button"
            onClick={() => setFilterQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : filterQuery.trim() && filteredGrouped.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-6">
          No items matched "{filterQuery}"
        </p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          {filteredGrouped.map((group, idx) => {
            const Icon = group.icon;
            const isOpen = openSections[group.value as FoodCategory];
            const ChevronIcon = isOpen ? ChevronDown : ChevronRight;
            const groupSelectedCount = group.items.filter(i => selected.has(i.id)).length;
            const allGroupSelected = group.items.length > 0 && groupSelectedCount === group.items.length;
            return (
              <div key={group.value} className={idx > 0 ? "border-t border-border" : ""}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => toggleSection(group.value as FoodCategory)}
                  data-testid={`button-toggle-${group.value}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{group.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{group.items.length}</Badge>
                    {groupSelectedCount > 0 && (
                      <Badge variant="default" className="text-[10px] h-4 px-1.5">{groupSelectedCount} selected</Badge>
                    )}
                  </div>
                  <ChevronIcon className="h-4 w-4 text-muted-foreground" />
                </button>
                {isOpen && (
                  <div className="bg-muted/20 px-3 pb-3">
                    {group.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pt-2">
                        {emptyLabel[group.value as FoodCategory]}
                      </p>
                    ) : (
                      <div className="pt-1">
                        <label className="flex items-center gap-3 pb-2 mb-1 border-b border-border/50 cursor-pointer select-none min-h-[2.75rem]">
                          <Checkbox
                            checked={allGroupSelected}
                            onCheckedChange={() => toggleGroupAll(group.items)}
                            data-testid={`checkbox-select-all-${group.value}`}
                          />
                          <span className="text-xs text-muted-foreground">Select all</span>
                        </label>
                        <div className="space-y-0 max-h-64 overflow-y-auto">
                          {group.items.map(item => {
                            const staticKnow = getPantryKnowledge(item.ingredientKey);
                            const serverKnow = serverKnowledge.get(item.ingredientKey);
                            const knowledge = staticKnow ?? (serverKnow !== "loading" ? serverKnow ?? null : null);
                            const hasKnowledge = !!staticKnow || serverKnow !== undefined;
                            const isExpanded = expandedItems.has(item.id);
                            const isLoadingKnowledge = serverKnow === "loading";
                            return (
                              <div key={item.id} className="group" data-testid={`row-food-pantry-item-${item.id}`}>
                                <div className="flex items-center">
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
                                                <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                                                  {s}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {knowledge.highlights && knowledge.highlights.length > 0 && (
                                          <div className={knowledge.supports.length === 0 ? "pt-2.5" : ""}>
                                            <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/50 font-medium mb-1.5">Highlights</p>
                                            <div className="flex flex-wrap gap-1">
                                              {knowledge.highlights.map(h => (
                                                <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/40 text-muted-foreground border border-border/40">
                                                  {h}
                                                </span>
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function HouseholdSection({ items, isLoading }: { items: PantryItem[]; isLoading: boolean }) {
  const { toast } = useToast();
  const qclient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);

  const householdItems = items.filter(i => i.category === "household");

  const addMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/pantry", { ingredient: name, displayName: name, category: "household" }),
    onSuccess: () => {
      qclient.invalidateQueries({ queryKey: ["/api/pantry"] });
      setNewItem("");
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

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === householdItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(householdItems.map(i => i.id)));
    }
  };

  const sendToBasket = async () => {
    if (selected.size === 0) return;
    setSending(true);
    const toSend = householdItems.filter(i => selected.has(i.id));
    try {
      await Promise.all(
        toSend.map(item =>
          apiRequest("POST", "/api/shopping-list/extras", {
            name: item.displayName || item.ingredientKey,
            category: "household",
          })
        )
      );
      toast({ title: `Added ${toSend.length} item${toSend.length > 1 ? "s" : ""} to basket` });
      setSelected(new Set());
      qclient.invalidateQueries({ queryKey: ["/api/shopping-list/extras"] });
    } catch {
      toast({ title: "Failed to add to basket", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          <h2 className="text-base font-medium">Household Essentials</h2>
        </div>
        {selected.size > 0 && (
          <Button
            size="sm"
            onClick={sendToBasket}
            disabled={sending}
            data-testid="button-send-to-basket"
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShoppingBasket className="h-3 w-3 mr-1" />}
            Send {selected.size} to Basket
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Tick items you need this week, then tap "Send to Basket".
      </p>

      <div className="flex gap-2 mb-5">
        <Input
          placeholder="Add household item…"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && newItem.trim() && addMutation.mutate(newItem.trim())}
          className="flex-1 text-sm"
          data-testid="input-household-item"
        />
        <Button
          size="sm"
          onClick={() => newItem.trim() && addMutation.mutate(newItem.trim())}
          disabled={!newItem.trim() || addMutation.isPending}
          data-testid="button-household-add"
        >
          {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          <span className="ml-1">Add</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : householdItems.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No household items yet.</p>
      ) : (
        <div>
          <label className="flex items-center gap-3 pb-2 border-b border-border mb-2 cursor-pointer select-none min-h-[2.75rem]">
            <Checkbox
              checked={selected.size === householdItems.length && householdItems.length > 0}
              onCheckedChange={toggleAll}
              data-testid="checkbox-select-all-household"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </label>
          <div className="max-h-72 overflow-y-auto">
            {householdItems.map(item => (
              <div key={item.id} className="flex items-center group" data-testid={`row-household-item-${item.id}`}>
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
        </div>
      )}
    </Card>
  );
}

export default function PantryPage() {
  const { data: items = [], isLoading } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry"],
  });

  // Rotate by day-of-month — stable per session, different each day
  const microInsight = MICRO_INSIGHTS[new Date().getDate() % MICRO_INSIGHTS.length];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-pantry-title">
          <PantryIcon className="h-5 w-5 text-primary" />
          My Pantry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your everyday choices live here.
        </p>
        <p className="text-xs text-muted-foreground/50 mt-2 italic" data-testid="text-pantry-micro-insight">
          {microInsight}
        </p>
      </div>

      <FirstVisitHint
        areaKey="pantry"
        message="Add the ingredients you have at home — fridge, freezer, and larder. Your pantry helps tailor meal suggestions and avoids duplicates when you shop."
      />

      <FoodPantrySection items={items} isLoading={isLoading} />
      <HouseholdSection items={items} isLoading={isLoading} />
    </div>
  );
}
