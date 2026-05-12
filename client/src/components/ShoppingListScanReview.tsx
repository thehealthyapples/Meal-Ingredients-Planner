import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ChevronDown, Loader2, X, Camera, Sparkles, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

export interface ScannedShoppingItem {
  rawText: string;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  uncertain: boolean;
  normalisationApplied: boolean;
}

export interface ShoppingListScanData {
  mode: "shopping_list";
  rawText: string;
  parsed: { mode: "shopping_list"; items: ScannedShoppingItem[] } | null;
  parsedBy: "vision" | "ocr-fallback" | "failed";
  confidence: "high" | "medium" | "low" | "none";
  warnings: string[];
}

interface EditableItem extends ScannedShoppingItem {
  id: number;
  resolved: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanData: ShoppingListScanData | null;
}

export function ShoppingListScanReview({ open, onOpenChange, scanData }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rawOpen, setRawOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialItems = (): EditableItem[] =>
    (scanData?.parsed?.items ?? []).map((item, i) => ({
      ...item,
      id: i,
      resolved: !item.uncertain,
    }));

  const [items, setItems] = useState<EditableItem[]>(initialItems);

  // Re-initialise when new scanData arrives.
  const [lastScanData, setLastScanData] = useState<ShoppingListScanData | null>(null);
  if (scanData !== lastScanData) {
    setLastScanData(scanData);
    setItems(initialItems());
    setRawOpen(false);
  }

  const handleClose = () => onOpenChange(false);

  const updateItem = (id: number, field: keyof EditableItem, value: unknown) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value, resolved: field === "resolved" ? (value as boolean) : item.resolved } : item
    ));
  };

  const resolveItem = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, uncertain: false, resolved: true } : item));
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const hasUnresolvedItems = items.some(item => item.uncertain && !item.resolved);
  const confirmedCount = items.length;

  const handleConfirm = async () => {
    if (items.length === 0) {
      handleClose();
      return;
    }

    setSaving(true);
    let added = 0;
    let failed = 0;

    for (const item of items) {
      const productName = item.normalizedName.trim() || item.rawText.trim();
      if (!productName) continue;

      const body: Record<string, unknown> = { productName };
      if (item.quantity !== null && item.quantity > 0) body.quantityValue = item.quantity;
      if (item.unit) body.unit = item.unit;

      try {
        const res = await fetch(api.shoppingList.add.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        if (res.ok) {
          added++;
        } else {
          failed++;
          console.error(`[ShoppingListScanReview] failed to add "${productName}": ${res.status}`);
        }
      } catch {
        failed++;
      }
    }

    setSaving(false);
    queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });

    if (failed === 0) {
      toast({ title: `${added} item${added !== 1 ? "s" : ""} added to shopping list` });
    } else {
      toast({
        title: `${added} added, ${failed} failed`,
        description: "Some items could not be saved - please add them manually.",
        variant: "destructive",
      });
    }
    handleClose();
  };

  const isFailedParse = !scanData?.parsed || scanData.parsedBy === "failed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Review scanned items
            <Badge variant="secondary" className="text-xs ml-1">Shopping List</Badge>
          </DialogTitle>
          <DialogDescription>
            Review and edit the items below before adding to your shopping list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Extraction method indicator */}
          {scanData && !isFailedParse && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              scanData.parsedBy === "vision"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
            }`}>
              {scanData.parsedBy === "vision"
                ? <Sparkles className="h-3.5 w-3.5 shrink-0" />
                : <WifiOff className="h-3.5 w-3.5 shrink-0" />}
              <span>
                {scanData.parsedBy === "vision"
                  ? "AI image scan complete"
                  : "AI image service unavailable - using OCR fallback. Results may be less accurate."}
              </span>
            </div>
          )}

          {/* OCR fallback warnings (from the warnings array) */}
          {(scanData?.warnings ?? []).filter(w => w.includes("AI image service") || w.includes("AI had trouble")).map((w, i) => null)}

          {/* Non-fallback warnings (confidence low, parse issues) */}
          {scanData?.parsedBy !== "ocr-fallback" && (scanData?.confidence === "low" || scanData?.confidence === "medium") && !isFailedParse && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Some items need your attention - check items marked <strong>Check this</strong> before saving.</span>
            </div>
          )}

          {/* Other warnings from the API */}
          {(scanData?.warnings ?? []).filter(w => !w.includes("AI image service") && !w.includes("AI had trouble")).map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}

          {/* Failed parse */}
          {isFailedParse ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                We couldn't extract items from this image. Check the raw text below or try a clearer photo.
              </p>
              {scanData?.rawText && (
                <pre className="rounded-md bg-muted px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground max-h-48 overflow-y-auto">
                  {scanData.rawText}
                </pre>
              )}
            </div>
          ) : (
            <>
              {/* Items list */}
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No items extracted. Try a clearer photo.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {items.length} item{items.length !== 1 ? "s" : ""} found
                    {hasUnresolvedItems && " · resolve items marked Check this before saving"}
                  </p>
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-3 space-y-2 ${item.uncertain && !item.resolved ? "border-yellow-300 bg-yellow-50/60 dark:bg-yellow-950/20" : "border-border"}`}
                    >
                      <div className="flex items-center gap-2">
                        {item.uncertain && !item.resolved && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400 shrink-0">
                            Check this
                          </Badge>
                        )}
                        <div className="flex-1 min-w-0">
                          <Input
                            value={item.normalizedName}
                            onChange={e => updateItem(item.id, "normalizedName", e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Item name"
                          />
                          {item.normalisationApplied && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              Read as: {item.rawText}
                            </p>
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity ?? ""}
                          onChange={e => updateItem(item.id, "quantity", e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-8 text-sm w-16 shrink-0"
                          placeholder="Qty"
                        />
                        <Input
                          value={item.unit ?? ""}
                          onChange={e => updateItem(item.id, "unit", e.target.value || null)}
                          className="h-8 text-sm w-16 shrink-0"
                          placeholder="Unit"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {item.uncertain && !item.resolved && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => resolveItem(item.id)}
                        >
                          Looks correct - confirm
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Raw OCR text */}
              {scanData?.rawText && (
                <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-between">
                      View full scan text
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${rawOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-2 rounded-md bg-muted px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground max-h-40 overflow-y-auto">
                      {scanData.rawText}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            {!isFailedParse && (
              <Button
                onClick={handleConfirm}
                disabled={saving || items.length === 0 || hasUnresolvedItems}
                title={hasUnresolvedItems ? "Resolve all uncertain items before saving" : undefined}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</>
                  : `Add ${confirmedCount} item${confirmedCount !== 1 ? "s" : ""} to list`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
