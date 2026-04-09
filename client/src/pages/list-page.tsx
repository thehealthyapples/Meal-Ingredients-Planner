import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { normalizeIngredientKey } from "@shared/normalize";
import {
  NotepadText, Store, Sparkles, ChevronRight, Loader2,
  Clock, X, RotateCcw,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const SHOPS = [
  "Tesco", "Sainsbury's", "Morrisons", "Ocado",
  "Waitrose", "Asda", "Aldi", "Lidl",
];

const QUICK_LIST_KEY = "tha-quick-list-history";
const MAX_HISTORY = 4;

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuickListBasket {
  id: string;
  rawText: string;
  parsedItems: string[];
  selectedShop: string | null;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseList(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function loadHistory(): QuickListBasket[] {
  try {
    return JSON.parse(localStorage.getItem(QUICK_LIST_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(basket: QuickListBasket) {
  try {
    const existing = loadHistory();
    const updated = [basket, ...existing.filter((b) => b.id !== basket.id)].slice(0, MAX_HISTORY);
    localStorage.setItem(QUICK_LIST_KEY, JSON.stringify(updated));
  } catch {}
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [rawText, setRawText] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shopPickerOpen, setShopPickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<QuickListBasket[]>(() => loadHistory());

  useEffect(() => {
    document.title = "List – The Healthy Apples";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  // Auto-focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const parsedItems = parseList(rawText);

  const processAndNavigate = async (shop: string | null) => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);

    // Each quick-list basket gets a unique label so items are never mixed
    // between sessions and can be cleanly filtered in the dedicated view.
    const basketId = Date.now().toString();
    const basketLabel = `quick_list_${basketId}`;

    try {
      // Add each item through the existing shopping-list endpoint.
      // Providing normalizedName lets the server's detectIngredientCategory run
      // automatically — no need for a parallel category system.
      for (const item of parsedItems) {
        await apiRequest("POST", api.shoppingList.add.path, {
          productName: item,
          normalizedName: normalizeIngredientKey(item),
          basketLabel,
        });
      }

      // Kick off auto-scoring so THA ratings are applied before the user sees items.
      try {
        await fetch(api.shoppingList.autoSmp.path, { method: "POST", credentials: "include" });
      } catch { /* non-fatal */ }

      // Invalidate cache so the quick-shop page sees the new items
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });

      // Persist to quick-list history (up to MAX_HISTORY)
      const basket: QuickListBasket = {
        id: basketId,
        rawText,
        parsedItems,
        selectedShop: shop,
        createdAt: new Date().toISOString(),
      };
      saveToHistory(basket);
      setHistory(loadHistory());

      // Navigate to the existing basket view, scoped to this basket label.
      // The basket page filters to these items and starts ShopModeView at the
      // cupboard-check phase directly (skipping the "Before you head out" intro).
      const navParams = new URLSearchParams({
        quickList: basketLabel,
        shopMode: "1",
      });
      if (shop) navParams.set("store", shop);
      navigate(`/analyse-basket?${navParams.toString()}`);

      toast({
        title: `${parsedItems.length} item${parsedItems.length !== 1 ? "s" : ""} added`,
        description: shop ? `Opening ${shop}…` : "Opening shop view…",
      });
    } catch {
      toast({ title: "Failed to process list", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const restoreFromHistory = (basket: QuickListBasket) => {
    setRawText(basket.rawText);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4 max-w-2xl mx-auto w-full">

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <NotepadText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Quick Shop List</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Type your shopping list — commas or new lines, your choice.
          </p>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"milk, eggs\noven chips\nbananas, yoghurt\npasta sauce"}
            rows={10}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            data-testid="textarea-quick-list"
          />
          {rawText.length > 0 && (
            <button
              onClick={() => setRawText("")}
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              aria-label="Clear"
              data-testid="button-clear-list"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Item preview */}
        {parsedItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" data-testid="parsed-items-preview">
            {parsedItems.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent text-xs font-medium text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-5">
          <Button
            size="lg"
            className="w-full gap-2 text-base font-semibold h-12"
            disabled={parsedItems.length === 0 || isProcessing}
            onClick={() => setSheetOpen(true)}
            data-testid="button-create-shop-list"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Store className="h-5 w-5" />
            )}
            {isProcessing ? "Building your list…" : "Create Shop List"}
          </Button>
          {parsedItems.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              {parsedItems.length} item{parsedItems.length !== 1 ? "s" : ""} ready
            </p>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5" />
              Recent lists
            </div>
            <div className="flex flex-col gap-2">
              {history.map((basket) => (
                <button
                  key={basket.id}
                  onClick={() => restoreFromHistory(basket)}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card/60 px-3.5 py-3 text-left hover:bg-accent/40 transition-colors"
                  data-testid={`history-item-${basket.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {basket.parsedItems.slice(0, 4).join(", ")}
                      {basket.parsedItems.length > 4 && ` +${basket.parsedItems.length - 4} more`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {basket.parsedItems.length} item{basket.parsedItems.length !== 1 ? "s" : ""}
                      {basket.selectedShop ? ` · ${basket.selectedShop}` : " · Best shop"}
                      {" · "}{formatRelativeTime(basket.createdAt)}
                    </p>
                  </div>
                  <RotateCcw className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom sheet: Where are you shopping? ── */}
      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!isProcessing) setSheetOpen(v); }}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-w-2xl mx-auto"
          data-testid="sheet-shop-choice"
        >
          <SheetHeader className="mb-5">
            <SheetTitle className="text-lg">Where are you shopping?</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 pb-4">
            <button
              onClick={() => { setSheetOpen(false); setShopPickerOpen(true); }}
              className="flex items-center justify-between w-full rounded-xl border border-border bg-card px-4 py-3.5 hover:bg-accent/40 transition-colors"
              data-testid="button-choose-shop"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary">
                  <Store className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Choose shop</p>
                  <p className="text-xs text-muted-foreground">Pick where you're heading</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => { setSheetOpen(false); processAndNavigate(null); }}
              className="flex items-center justify-between w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-3.5 hover:bg-primary/10 transition-colors"
              data-testid="button-best-shop"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/15 text-primary">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-primary">Auto-match shops</p>
                  <p className="text-xs text-muted-foreground">Open in auto mode — switch shops freely in view</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Bottom sheet: Shop picker ── */}
      <Sheet open={shopPickerOpen} onOpenChange={(v) => { if (!isProcessing) setShopPickerOpen(v); }}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-w-2xl mx-auto"
          data-testid="sheet-shop-picker"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg">Choose your shop</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 pb-4">
            {SHOPS.map((shop) => (
              <button
                key={shop}
                onClick={() => { setShopPickerOpen(false); processAndNavigate(shop); }}
                className="flex items-center justify-center h-12 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent/40 hover:border-primary/30 transition-colors"
                data-testid={`button-shop-${shop.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                {shop}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
