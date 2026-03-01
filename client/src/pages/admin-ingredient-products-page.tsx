import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Edit2, Trash2, Star, RotateCcw } from "lucide-react";
import { normalizeIngredientKey } from "@shared/normalize";
import type { IngredientProduct } from "@shared/schema";

type PickForm = {
  ingredientKey: string;
  productName: string;
  retailer: string;
  size: string;
  notes: string;
  priority: number;
};

const emptyForm: PickForm = {
  ingredientKey: "",
  productName: "",
  retailer: "",
  size: "",
  notes: "",
  priority: 0,
};

export default function AdminIngredientProductsPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<IngredientProduct | null>(null);
  const [deactivateItem, setDeactivateItem] = useState<IngredientProduct | null>(null);

  const [form, setForm] = useState<PickForm>(emptyForm);

  if ((user as any)?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const queryKey = ["/api/admin/ingredient-products", activeQuery];

  const { data: picks = [], isLoading } = useQuery<IngredientProduct[]>({
    queryKey,
    queryFn: () =>
      apiRequest("GET", `/api/admin/ingredient-products?query=${encodeURIComponent(activeQuery)}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<PickForm, "size" | "notes"> & { size?: string; notes?: string }) =>
      apiRequest("POST", "/api/admin/ingredient-products", data).then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ingredient-products"] });
      toast({ title: "THA Pick created" });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      const msg = err?.error === "already_exists" ? "A pick with that key + product + retailer already exists." : "Failed to create THA Pick.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PickForm> }) =>
      apiRequest("PUT", `/api/admin/ingredient-products/${id}`, data).then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ingredient-products"] });
      toast({ title: "THA Pick updated" });
      setEditItem(null);
      setForm(emptyForm);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update THA Pick.", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/ingredient-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ingredient-products"] });
      toast({ title: "THA Pick deactivated" });
      setDeactivateItem(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate.", variant: "destructive" });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PUT", `/api/admin/ingredient-products/${id}`, { isActive: true }).then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ingredient-products"] });
      toast({ title: "THA Pick re-activated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to re-activate.", variant: "destructive" });
    },
  });

  function handleSearch() {
    setActiveQuery(searchInput.trim());
  }

  function openCreate() {
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function openEdit(pick: IngredientProduct) {
    setForm({
      ingredientKey: pick.ingredientKey,
      productName: pick.productName,
      retailer: pick.retailer,
      size: pick.size ?? "",
      notes: pick.notes ?? "",
      priority: pick.priority,
    });
    setEditItem(pick);
  }

  function handleFormChange(field: keyof PickForm, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleCreateSubmit() {
    createMutation.mutate({
      ingredientKey: form.ingredientKey.trim(),
      productName: form.productName.trim(),
      retailer: form.retailer.trim(),
      size: form.size.trim() || undefined,
      notes: form.notes.trim() || undefined,
      priority: form.priority,
    });
  }

  function handleEditSubmit() {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: {
        ingredientKey: form.ingredientKey.trim(),
        productName: form.productName.trim(),
        retailer: form.retailer.trim(),
        size: form.size.trim() || undefined,
        notes: form.notes.trim() || undefined,
        priority: form.priority,
      },
    });
  }

  const normalizedPreview = form.ingredientKey.trim()
    ? normalizeIngredientKey(form.ingredientKey.trim())
    : null;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Star className="h-6 w-6 text-amber-500" />
        <h1 className="text-2xl font-bold" data-testid="heading-tha-picks">THA Picks — Preferred Products</h1>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ingredient or product..."
            className="pl-9"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            data-testid="input-search-picks"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" data-testid="button-search-picks">Search</Button>
        <Button onClick={openCreate} className="ml-auto gap-2" data-testid="button-add-pick">
          <Plus className="h-4 w-4" />
          Add THA Pick
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient Key</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Retailer</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : picks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No THA Picks found.{activeQuery ? " Try a different search." : " Click \"Add THA Pick\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              picks.map(pick => (
                <TableRow key={pick.id} data-testid={`row-pick-${pick.id}`}>
                  <TableCell className="font-mono text-sm" data-testid={`text-key-${pick.id}`}>
                    {pick.ingredientKey}
                  </TableCell>
                  <TableCell data-testid={`text-name-${pick.id}`}>
                    <div>
                      <p className="font-medium">{pick.productName}</p>
                      {pick.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pick.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-retailer-${pick.id}`}>{pick.retailer}</TableCell>
                  <TableCell data-testid={`text-size-${pick.id}`}>{pick.size ?? "—"}</TableCell>
                  <TableCell className="text-center" data-testid={`text-priority-${pick.id}`}>{pick.priority}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={pick.isActive ? "default" : "secondary"}
                      data-testid={`badge-status-${pick.id}`}
                    >
                      {pick.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(pick)}
                        data-testid={`button-edit-${pick.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {pick.isActive ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeactivateItem(pick)}
                          data-testid={`button-deactivate-${pick.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => reactivateMutation.mutate(pick.id)}
                          disabled={reactivateMutation.isPending}
                          data-testid={`button-reactivate-${pick.id}`}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={open => { setCreateOpen(open); if (!open) setForm(emptyForm); }}>
        <DialogContent data-testid="dialog-create-pick">
          <DialogHeader>
            <DialogTitle>Add THA Pick</DialogTitle>
            <DialogDescription>Curate a preferred product for an ingredient.</DialogDescription>
          </DialogHeader>
          <PickFormFields form={form} onChange={handleFormChange} normalizedPreview={normalizedPreview} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending || !form.ingredientKey.trim() || !form.productName.trim() || !form.retailer.trim()}
              data-testid="button-submit-create"
            >
              {createMutation.isPending ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={open => { if (!open) { setEditItem(null); setForm(emptyForm); } }}>
        <DialogContent data-testid="dialog-edit-pick">
          <DialogHeader>
            <DialogTitle>Edit THA Pick</DialogTitle>
            <DialogDescription>Update the preferred product details.</DialogDescription>
          </DialogHeader>
          <PickFormFields form={form} onChange={handleFormChange} normalizedPreview={normalizedPreview} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditItem(null); setForm(emptyForm); }}>Cancel</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateMutation.isPending || !form.ingredientKey.trim() || !form.productName.trim() || !form.retailer.trim()}
              data-testid="button-submit-edit"
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deactivateItem} onOpenChange={open => { if (!open) setDeactivateItem(null); }}>
        <AlertDialogContent data-testid="dialog-deactivate-pick">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate THA Pick?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deactivateItem?.productName}" will be hidden from basket hints. You can re-activate it by editing the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-deactivate">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deactivateItem && deactivateMutation.mutate(deactivateItem.id)}
              data-testid="button-confirm-deactivate"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PickFormFields({
  form,
  onChange,
  normalizedPreview,
}: {
  form: PickForm;
  onChange: (field: keyof PickForm, value: string | number) => void;
  normalizedPreview: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pick-ingredient-key">Ingredient</Label>
        <Input
          id="pick-ingredient-key"
          placeholder="e.g. passata"
          value={form.ingredientKey}
          onChange={e => onChange("ingredientKey", e.target.value)}
          data-testid="input-ingredient-key"
        />
        {normalizedPreview && (
          <p className="text-xs text-muted-foreground" data-testid="text-normalized-preview">
            Will match: <span className="font-mono font-medium">{normalizedPreview}</span>
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pick-product-name">Product Name</Label>
        <Input
          id="pick-product-name"
          placeholder="e.g. Aldi Passata 500g"
          value={form.productName}
          onChange={e => onChange("productName", e.target.value)}
          data-testid="input-product-name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pick-retailer">Retailer</Label>
          <Input
            id="pick-retailer"
            placeholder="e.g. Aldi"
            value={form.retailer}
            onChange={e => onChange("retailer", e.target.value)}
            data-testid="input-retailer"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pick-size">Size (optional)</Label>
          <Input
            id="pick-size"
            placeholder="e.g. 500g"
            value={form.size}
            onChange={e => onChange("size", e.target.value)}
            data-testid="input-size"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pick-notes">Notes (optional)</Label>
        <Textarea
          id="pick-notes"
          placeholder="e.g. 100% tomatoes, no additives"
          value={form.notes}
          onChange={e => onChange("notes", e.target.value)}
          className="resize-none h-20"
          data-testid="input-notes"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pick-priority">Priority (higher = shown first)</Label>
        <Input
          id="pick-priority"
          type="number"
          value={form.priority}
          onChange={e => onChange("priority", parseInt(e.target.value) || 0)}
          data-testid="input-priority"
        />
      </div>
    </div>
  );
}
