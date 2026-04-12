import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Plus, Loader2, Search, ExternalLink, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Meal } from "@shared/schema";

interface ProductHistoryItem {
  id: number;
  productName: string;
  brand?: string | null;
  imageUrl?: string | null;
  barcode?: string | null;
}

interface PendingItem {
  type: "recipe" | "product" | "manual";
  referenceId?: number | null;
  name: string;
  quantity?: string;
}

export interface ImportedRecipeDraft {
  title: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
  imageUrl: string | null;
  sourceUrl: string;
  sourcePlatform: 'instagram' | 'tiktok' | 'website' | 'manual';
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the new meal id after creation */
  onCreated?: (mealId: number) => void;
  /** Prefill from recipe import — optional, best-effort */
  prefill?: ImportedRecipeDraft;
}

export function CreateMealModal({ open, onOpenChange, onCreated, prefill }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [mealName, setMealName] = useState("");
  const [items, setItems] = useState<PendingItem[]>([]);
  // Instructions managed as a single editable string (joined/split on save)
  const [instructions, setInstructions] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Seed state from prefill when modal opens
  useEffect(() => {
    if (open && prefill) {
      setMealName(prefill.title || "");
      setItems(prefill.ingredients.map(ing => ({ type: "manual" as const, name: ing })));
      setInstructions(prefill.instructions.join("\n"));
    }
  }, [open, prefill]);

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
    enabled: open && !prefill, // don't fetch in import mode — not needed
  });

  const { data: productHistory = [] } = useQuery<ProductHistoryItem[]>({
    queryKey: ["/api/user/product-history"],
    enabled: open && !prefill,
  });

  const createMealMut = useMutation({
    mutationFn: async () => {
      // In import mode, split the instructions textarea back into an array.
      // In non-import mode, instructions are not managed by this modal.
      const resolvedInstructions = prefill
        ? instructions.split("\n").map(s => s.trim()).filter(Boolean)
        : [];

      const res = await apiRequest("POST", "/api/meals", {
        name: mealName.trim(),
        ingredients: [],
        instructions: resolvedInstructions,
        servings: prefill?.servings ?? 1,
        kind: "meal",
        ...(prefill?.imageUrl ? { imageUrl: prefill.imageUrl } : {}),
        ...(prefill ? {
          sourceUrl: prefill.sourceUrl,
          mealSourceType: `imported_${prefill.sourcePlatform}`,
        } : {}),
      });
      return res.json() as Promise<Meal>;
    },
  });

  const addItemMut = useMutation({
    mutationFn: async ({ mealId, item }: { mealId: number; item: PendingItem }) => {
      await apiRequest("POST", `/api/meals/${mealId}/items`, {
        type: item.type,
        referenceId: item.referenceId ?? null,
        name: item.name,
        quantity: item.quantity ?? undefined,
      });
    },
  });

  const handleSave = async () => {
    if (!mealName.trim()) return;
    try {
      const meal = await createMealMut.mutateAsync();
      for (const item of items) {
        await addItemMut.mutateAsync({ mealId: meal.id, item });
      }
      qc.setQueryData<Meal[]>(["/api/meals"], (prev) =>
        prev ? [...prev, meal] : [meal]
      );
      qc.refetchQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal created", description: `"${meal.name}" is ready to add to your planner.` });
      onCreated?.(meal.id);
      handleClose();
    } catch {
      toast({ title: "Failed to create meal", variant: "destructive" });
    }
  };

  const handleClose = () => {
    setMealName("");
    setItems([]);
    setInstructions("");
    setManualName("");
    setManualQty("");
    setRecipeSearch("");
    setProductSearch("");
    onOpenChange(false);
  };

  const addManual = () => {
    if (!manualName.trim()) return;
    setItems((prev) => [...prev, { type: "manual", name: manualName.trim(), quantity: manualQty.trim() || undefined }]);
    setManualName("");
    setManualQty("");
  };

  const addRecipe = (meal: Meal) => {
    if (items.some((i) => i.type === "recipe" && i.referenceId === meal.id)) return;
    setItems((prev) => [...prev, { type: "recipe", referenceId: meal.id, name: meal.name }]);
  };

  const addProduct = (p: ProductHistoryItem) => {
    if (items.some((i) => i.type === "product" && i.referenceId === p.id)) return;
    setItems((prev) => [...prev, { type: "product", referenceId: p.id, name: p.productName }]);
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const filteredMeals = meals.filter((m) =>
    m.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const filteredProducts = productHistory.filter((p) =>
    p.productName.toLowerCase().includes(productSearch.toLowerCase())
  );

  const isSaving = createMealMut.isPending || addItemMut.isPending;

  // Import-mode derived state
  const isImport = !!prefill;
  const hasIngredients = items.length > 0;
  const hasMethod = instructions.trim().length > 0;
  const isPartialImport = isImport && hasIngredients && !hasMethod;
  const canSaveImport = mealName.trim() && hasIngredients;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isImport ? "Review Imported Recipe" : "Create New Meal"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 py-1">

          {/* ── IMPORT MODE ─────────────────────────────────────────────────── */}
          {isImport ? (
            <>
              {/* Attribution / partial-import banner */}
              {isPartialImport ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300/80 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-amber-800 dark:text-amber-300 leading-snug">
                      THA AI has partially imported this recipe. Some fields are missing — please complete before saving.
                    </p>
                    {prefill.sourceUrl && (
                      <a
                        href={prefill.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-600/70 dark:text-amber-400/60 underline underline-offset-2 truncate block mt-0.5"
                      >
                        {prefill.sourceUrl}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200/70 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-2.5">
                  <ExternalLink className="h-3.5 w-3.5 text-amber-600/80 dark:text-amber-400/70 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-amber-700/90 dark:text-amber-300/80 leading-snug">
                      THA AI has imported this recipe. Please validate before saving.
                    </p>
                    {prefill.sourceUrl && (
                      <a
                        href={prefill.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-600/70 dark:text-amber-400/60 underline underline-offset-2 truncate block mt-0.5"
                      >
                        {prefill.sourceUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</p>
                <Input
                  placeholder="Recipe name"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ingredients
                  {!hasIngredients && <span className="ml-1.5 text-amber-600 dark:text-amber-400 normal-case">(missing)</span>}
                </p>
                {items.length > 0 && (
                  <div className="space-y-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.quantity && <span className="text-xs text-muted-foreground">{item.quantity}</span>}
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeItem(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add extra ingredient inline — no tabs noise during import */}
                <div className="flex gap-2 pt-0.5">
                  <Input
                    placeholder="Add ingredient…"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addManual()}
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    placeholder="Qty"
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    className="w-16 h-8 text-sm"
                  />
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={addManual} disabled={!manualName.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Method / Instructions */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Method / Instructions
                  {isPartialImport && <span className="ml-1.5 text-amber-600 dark:text-amber-400 normal-case">(missing)</span>}
                </p>
                <Textarea
                  placeholder={"Enter the method steps, one per line.\n\nE.g.:\nHeat oil in a pan over medium heat.\nAdd onion and cook for 5 minutes.\nStir in remaining ingredients and simmer."}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className={[
                    "min-h-[120px] text-sm resize-none",
                    isPartialImport
                      ? "border-amber-400 dark:border-amber-500 focus-visible:ring-amber-400 dark:focus-visible:ring-amber-500"
                      : "",
                  ].join(" ")}
                />
                <p className="text-[11px] text-muted-foreground">One step per line. Edit freely before saving.</p>
              </div>
            </>
          ) : (
            /* ── STANDARD (NON-IMPORT) MODE — unchanged ──────────────────── */
            <>
              <Input
                placeholder="Meal name"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                autoFocus
              />

              {items.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</p>
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                      <Badge variant="outline" className="shrink-0 text-[10px] capitalize">{item.type}</Badge>
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.quantity && <span className="text-xs text-muted-foreground">{item.quantity}</span>}
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeItem(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Tabs defaultValue="manual">
                <TabsList className="w-full">
                  <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
                  <TabsTrigger value="recipe" className="flex-1">Recipe</TabsTrigger>
                  <TabsTrigger value="product" className="flex-1">Product</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Item name"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addManual()}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Qty"
                      value={manualQty}
                      onChange={(e) => setManualQty(e.target.value)}
                      className="w-20"
                    />
                    <Button size="icon" variant="outline" onClick={addManual} disabled={!manualName.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="recipe" className="mt-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your recipes…"
                      value={recipeSearch}
                      onChange={(e) => setRecipeSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredMeals.slice(0, 30).map((m) => {
                      const added = items.some((i) => i.type === "recipe" && i.referenceId === m.id);
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between rounded px-2 py-1 text-sm cursor-pointer hover:bg-muted ${added ? "opacity-50" : ""}`}
                          onClick={() => !added && addRecipe(m)}
                        >
                          <span className="truncate">{m.name}</span>
                          {added ? <Badge variant="secondary" className="text-[10px]">Added</Badge> : <Plus className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      );
                    })}
                    {filteredMeals.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No recipes found.</p>}
                  </div>
                </TabsContent>

                <TabsContent value="product" className="mt-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search scanned products…"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredProducts.slice(0, 30).map((p) => {
                      const added = items.some((i) => i.type === "product" && i.referenceId === p.id);
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between rounded px-2 py-1 text-sm cursor-pointer hover:bg-muted ${added ? "opacity-50" : ""}`}
                          onClick={() => !added && addProduct(p)}
                        >
                          <div className="min-w-0">
                            <span className="truncate block">{p.productName}</span>
                            {p.brand && <span className="text-xs text-muted-foreground">{p.brand}</span>}
                          </div>
                          {added ? <Badge variant="secondary" className="text-[10px] shrink-0">Added</Badge> : <Plus className="h-3 w-3 text-muted-foreground shrink-0" />}
                        </div>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {productHistory.length === 0 ? "No scanned products yet. Use the scanner to build your history." : "No products match."}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (isImport ? !canSaveImport : !mealName.trim())}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {isImport ? "Save Recipe" : "Create Meal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
