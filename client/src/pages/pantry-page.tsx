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
import { Trash2, Plus, Loader2, Package, Home, Refrigerator, Archive, Layers, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

const FOOD_CATEGORIES = [
  { value: "larder", label: "Larder", icon: Archive },
  { value: "fridge", label: "Fridge", icon: Refrigerator },
  { value: "freezer", label: "Freezer", icon: Layers },
] as const;

type FoodCategory = "larder" | "fridge" | "freezer";

function FoodPantrySection({ items, isLoading }: { items: PantryItem[]; isLoading: boolean }) {
  const { toast } = useToast();
  const qclient = useQueryClient();
  const [ingredient, setIngredient] = useState("");
  const [category, setCategory] = useState<FoodCategory>("larder");

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
    onSuccess: () => qclient.invalidateQueries({ queryKey: ["/api/pantry"] }),
    onError: () => toast({ title: "Failed to remove item", variant: "destructive" }),
  });

  const foodItems = items.filter(i => ["larder", "fridge", "freezer"].includes(i.category));
  const grouped = FOOD_CATEGORIES.map(cat => ({
    ...cat,
    items: foodItems.filter(i => i.category === cat.value),
  }));

  const handleAdd = () => {
    if (!ingredient.trim()) return;
    addMutation.mutate({ ingredient: ingredient.trim(), displayName: ingredient.trim(), category });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <Package className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-base">Food Pantry</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Ingredients you usually have at home — they'll be collapsed in your shopping list.
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
          <SelectTrigger className="w-28 text-sm" data-testid="select-food-pantry-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOOD_CATEGORIES.map(c => (
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

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ) : foodItems.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No staples yet — try adding olive oil, herbs, spices…</p>
      ) : (
        <div className="space-y-5">
          {grouped.filter(g => g.items.length > 0).map(group => {
            const Icon = group.icon;
            return (
              <div key={group.value}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</p>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{group.items.length}</Badge>
                </div>
                <div className="space-y-1 pl-1">
                  {group.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-2 py-1 group" data-testid={`row-food-pantry-item-${item.id}`}>
                      <span className="text-sm flex-1 min-w-0 truncate">{item.displayName || item.ingredientKey}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-food-pantry-delete-${item.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
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
          <h2 className="font-semibold text-base">Household Essentials</h2>
        </div>
        {selected.size > 0 && (
          <Button
            size="sm"
            onClick={sendToBasket}
            disabled={sending}
            data-testid="button-send-to-basket"
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShoppingCart className="h-3 w-3 mr-1" />}
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
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : householdItems.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No household items yet.</p>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
            <Checkbox
              checked={selected.size === householdItems.length && householdItems.length > 0}
              onCheckedChange={toggleAll}
              data-testid="checkbox-select-all-household"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>
          {householdItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-1.5 group" data-testid={`row-household-item-${item.id}`}>
              <Checkbox
                checked={selected.has(item.id)}
                onCheckedChange={() => toggleSelect(item.id)}
                data-testid={`checkbox-household-${item.id}`}
              />
              <span className="flex-1 text-sm">{item.displayName || item.ingredientKey}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
                data-testid={`button-household-delete-${item.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function PantryPage() {
  const { data: items = [], isLoading } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry"],
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-pantry-title">My Pantry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your food staples and household essentials.
        </p>
      </div>

      <FoodPantrySection items={items} isLoading={isLoading} />
      <HouseholdSection items={items} isLoading={isLoading} />
    </div>
  );
}
