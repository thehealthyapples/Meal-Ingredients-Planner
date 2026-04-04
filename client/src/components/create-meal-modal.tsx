import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Plus, Loader2, Search } from "lucide-react";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the new meal id after creation */
  onCreated?: (mealId: number) => void;
}

export function CreateMealModal({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [mealName, setMealName] = useState("");
  const [items, setItems] = useState<PendingItem[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
    enabled: open,
  });

  const { data: productHistory = [] } = useQuery<ProductHistoryItem[]>({
    queryKey: ["/api/user/product-history"],
    enabled: open,
  });

  const createMealMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/meals", {
        name: mealName.trim(),
        ingredients: [],
        instructions: [],
        servings: 1,
        kind: "meal",
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
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Meal</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 py-1">
          <Input
            placeholder="Meal name"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            autoFocus
          />

          {/* Items added so far */}
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

          {/* Add items section */}
          <Tabs defaultValue="manual">
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
              <TabsTrigger value="recipe" className="flex-1">Recipe</TabsTrigger>
              <TabsTrigger value="product" className="flex-1">Product</TabsTrigger>
            </TabsList>

            {/* Manual */}
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

            {/* Recipe */}
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

            {/* Product (barcode reuse — Epic 2) */}
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
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!mealName.trim() || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Create Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
