import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronDown, ChevronUp, ShoppingCart, ChefHat,
  Leaf, Loader2, Info, Store, Clock, Check, Package,
  X, ScanLine, Sparkles, Camera, AlertCircle, RefreshCw,
} from "lucide-react";
import ScoreBadge from "@/components/ui/score-badge";
import { rankChoices, buildWhyBetter } from "@/lib/analyser-choice";
import { getWholeFoodAlternative, effortLabel, effortColor, formatTime } from "@/lib/whole-food-alternatives";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem } from "@shared/schema";
import { BrowserMultiFormatReader } from "@zxing/browser";

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalizeWords(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function getCurrentProductInsight(item: ShoppingListItem): { headline: string; detail: string } {
  const rating = item.thaRating;
  const isWF = item.itemType === "whole_food";
  if (isWF) {
    return {
      headline: "Already a whole food",
      detail: "This ingredient is a whole or minimally processed food — no additives, no unnecessary processing.",
    };
  }
  if (rating === null || rating === undefined) {
    return {
      headline: "Not yet scored",
      detail: "This item hasn't been matched to a product yet. The options below may help you find a cleaner alternative.",
    };
  }
  if (rating >= 5) return { headline: "Top of its class", detail: "Minimal processing and a clean ingredient profile." };
  if (rating >= 4) return { headline: "A good packaged option", detail: "Limited processing with a relatively short and recognisable ingredient list." };
  if (rating >= 3) return { headline: "Average quality", detail: "Moderate processing. Worth checking the ingredient list for emulsifiers, stabilisers, or modified starches." };
  if (rating >= 2) return { headline: "Below average", detail: "This product likely contains several additives and significant processing. A cleaner option would be an improvement." };
  return { headline: "Highly processed", detail: "This product scores poorly due to heavy processing. A cleaner shop option or whole-food route is worth considering." };
}

function ratingColor(r: number | null) {
  if (!r) return "text-muted-foreground";
  if (r >= 4) return "text-green-600 dark:text-green-400";
  if (r >= 3) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

const SECTION_LABEL = "text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/70";

// ── Scan types ────────────────────────────────────────────────────────────────

type ScanState = "idle" | "processing" | "found" | "unresolved";

interface ScannedProduct {
  barcode: string;
  product_name: string;
  brand: string | null;
  thaRating: number | null;
  availableStores: string[];
  scanConfidence: "high" | "low";
  raw: any;
}

async function decodeBarcodeFromFile(file: File): Promise<string | null> {
  const blobUrl = URL.createObjectURL(file);
  try {
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(blobUrl);
    return result.getText();
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

// ── WorkspaceAnalyserSheet ────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingListItem | null;
  preferredStore?: string;
}

export function WorkspaceAnalyserSheet({ open, onOpenChange, item, preferredStore }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCurrentDetail, setShowCurrentDetail] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && item) {
      setProducts([]);
      setSelectedBarcode(null);
      setShowCurrentDetail(false);
      setScanState("idle");
      setScannedProduct(null);
      doSearch(item.productName);
    }
  }, [open, item?.id]);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(q.trim())}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast({ title: "Couldn't load alternatives", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }

  // Link a better product to the shopping list item without renaming the shopping intent
  async function handleSelectBetterOption(product: any) {
    if (!item) return;
    const storesArray: string[] = product.availableStores || [];
    const productThaRating = product.upfAnalysis?.thaRating ?? null;
    try {
      const url = buildUrl(api.shoppingList.update.path, { id: item.id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Do NOT change productName — preserve shopping intent
          matchedProductId: product.barcode || null,
          matchedStore: product.availableStores?.[0] || null,
          matchedPrice: null,
          availableStores: storesArray.length > 0 ? JSON.stringify(storesArray) : null,
          thaRating: productThaRating,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      setSelectedBarcode(product.barcode ?? null);
      toast({ title: "Better option noted", description: `Linked to "${product.product_name}" — your list item name is unchanged.` });
    } catch {
      toast({ title: "Couldn't save selection", variant: "destructive" });
    }
  }

  async function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setScanState("processing");
    setScannedProduct(null);

    try {
      const barcode = await decodeBarcodeFromFile(file);

      if (!barcode) {
        setScanState("unresolved");
        return;
      }

      const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`, {
        credentials: "include",
      });

      if (!res.ok) {
        setScanState("unresolved");
        return;
      }

      const data = await res.json();
      const p = data.product;
      if (!p?.product_name) {
        setScanState("unresolved");
        return;
      }

      setScannedProduct({
        barcode: p.barcode ?? barcode,
        product_name: p.product_name,
        brand: p.brand ?? null,
        thaRating: p.upfAnalysis?.thaRating ?? null,
        availableStores: p.availableStores ?? [],
        scanConfidence: p.scanConfidence ?? "high",
        raw: p,
      });
      setScanState("found");
    } catch {
      setScanState("unresolved");
    }
  }

  const rankedChoices = useMemo(
    () => (item ? rankChoices(products, item.thaRating ?? null, preferredStore).slice(0, 3) : []),
    [products, item?.thaRating, preferredStore],
  );

  const wholeFoodAlt = useMemo(
    () => (item ? getWholeFoodAlternative(item.productName) : null),
    [item?.productName],
  );

  if (!item) return null;

  const insight = getCurrentProductInsight(item);
  const isWF = item.itemType === "whole_food";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="max-h-[90vh] flex flex-col"
        data-testid="workspace-analyser-sheet"
      >
        {/* ── Handle + Header ────────────────────────────────────────── */}
        <DrawerHeader className="pb-2 pt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-base leading-snug" data-testid="analyser-sheet-title">
                {capitalizeWords(item.productName)}
              </DrawerTitle>
              <p className={`text-xs font-medium mt-0.5 ${ratingColor(item.thaRating ?? null)}`}>
                {insight.headline}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Shopping intent is unchanged by this analysis
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              {item.thaRating != null && (
                <ScoreBadge score={item.thaRating} size={36} />
              )}
              <DrawerClose asChild>
                <button
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Close analyser"
                  data-testid="analyser-sheet-close"
                >
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        {/* ── Scrollable content ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 space-y-5">

          {/* ── Why this score ─────────────────────────────────────────── */}
          <div data-testid="analyser-why-score">
            <p className={`${SECTION_LABEL} mb-2`}>Why this score</p>
            <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-1.5">
              <p className="text-xs leading-relaxed text-foreground/90">
                The Healthy Apples score looks at ingredients and asks: are these foods we recognise, or more industrial additions?
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                The closer a product is to real, familiar ingredients, the higher it scores.
              </p>
            </div>
          </div>

          {/* ── Current product ────────────────────────────────────────── */}
          <div data-testid="analyser-current-product">
            <p className={`${SECTION_LABEL} mb-2 flex items-center gap-1.5`}>
              <Package className="h-3 w-3" />
              Current product
            </p>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-snug">
                      {capitalizeWords(item.productName)}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${ratingColor(item.thaRating ?? null)}`}>
                      {insight.headline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.thaRating != null && <ScoreBadge score={item.thaRating} size={28} />}
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowCurrentDetail((v) => !v)}
                      data-testid="analyser-toggle-current-detail"
                    >
                      {showCurrentDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{insight.detail}</p>
                {showCurrentDetail && (
                  <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5" data-testid="analyser-current-detail">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {item.category && (
                        <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                      )}
                      {isWF && (
                        <Badge className="text-[10px] bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 no-default-hover-elevate">
                          <Leaf className="h-2.5 w-2.5 mr-1" />Whole food
                        </Badge>
                      )}
                    </div>
                    {item.matchedStore && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Store className="h-3 w-3" />Stocked at: {item.matchedStore}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Cleaner shop option ────────────────────────────────────── */}
          <div data-testid="analyser-cleaner-options">
            <div className="flex items-center justify-between mb-2">
              <p className={`${SECTION_LABEL} flex items-center gap-1.5`}>
                <ShoppingCart className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                <span className="text-blue-500 dark:text-blue-400">Cleaner shop option</span>
              </p>
              {preferredStore && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Store className="h-2.5 w-2.5" />{preferredStore} first
                </span>
              )}
            </div>

            {isSearching ? (
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span className="text-xs">Searching for alternatives…</span>
                </CardContent>
              </Card>
            ) : isWF ? (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    This is already a whole food — any packaged version would be a step down, not up.
                  </p>
                </CardContent>
              </Card>
            ) : rankedChoices.length > 0 ? (
              <div className="space-y-2">
                {rankedChoices.map((choice, idx) => {
                  const whyBetter = buildWhyBetter(choice, item.thaRating ?? null);
                  const isSelected = selectedBarcode !== null && selectedBarcode === choice.barcode;
                  return (
                    <Card
                      key={choice.barcode ?? idx}
                      className="border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20"
                      data-testid={`analyser-cleaner-option-${idx}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm leading-snug truncate">{choice.product_name}</p>
                            {choice.brand && <p className="text-xs text-muted-foreground">{choice.brand}</p>}
                            {whyBetter.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {whyBetter.map((reason: string, i: number) => (
                                  <Badge
                                    key={i}
                                    className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 no-default-hover-elevate"
                                  >
                                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {choice.availableStores && choice.availableStores.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <Store className="h-3 w-3 text-muted-foreground shrink-0" />
                                {choice.availableStores.map((s: string) => (
                                  <Badge key={s} variant="outline" className="text-[10px] no-default-hover-elevate">{s}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <ScoreBadge score={choice.upfAnalysis?.thaRating ?? 0} size={26} />
                            {isSelected ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="h-3 w-3" />Noted
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectBetterOption(choice)}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors touch-manipulation"
                                data-testid={`analyser-select-option-${idx}`}
                              >
                                <Check className="h-3 w-3 mr-1 inline-block" />
                                Better option
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : products.length > 0 ? (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    No clearly better packaged alternative found for this item.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    No results yet — alternatives load automatically.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Whole-food / from-scratch option ──────────────────────── */}
          <div data-testid="analyser-wholefood-option">
            <p className={`${SECTION_LABEL} mb-2 flex items-center gap-1.5`}>
              <ChefHat className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Whole-food / from-scratch option</span>
            </p>
            {wholeFoodAlt ? (
              <WholeFoodCard alt={wholeFoodAlt} />
            ) : (
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">
                    No from-scratch recipe available for this item yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Scan in store ─────────────────────────────────────────── */}
          <div data-testid="analyser-scan-section">
            {/* Native file input — visually hidden, triggered by button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleScanFile}
            />

            <p className={`${SECTION_LABEL} mb-2 flex items-center gap-1.5`}>
              <ScanLine className="h-3 w-3" />
              Scan in store
            </p>

            {scanState === "idle" && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-border/60 bg-muted/10 px-4 py-3.5 text-sm font-medium text-muted-foreground hover:bg-muted/20 hover:text-foreground active:bg-muted/30 transition-colors touch-manipulation"
                data-testid="analyser-scan-trigger"
              >
                <Camera className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Upload product photo</span>
                <span className="sm:hidden">Scan product</span>
              </button>
            )}

            {scanState === "processing" && (
              <Card className="border-border/60 bg-muted/10">
                <CardContent className="p-4 flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">Reading product…</p>
                </CardContent>
              </Card>
            )}

            {scanState === "unresolved" && (
              <Card className="border-border/60 bg-muted/10">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      THA could not identify this product. Try another photo or continue with your current choice.
                    </p>
                  </div>
                  <button
                    onClick={() => { setScanState("idle"); setScannedProduct(null); }}
                    className="text-xs text-primary hover:underline touch-manipulation flex items-center gap-1"
                    data-testid="analyser-scan-retry"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try again
                  </button>
                </CardContent>
              </Card>
            )}

            {scanState === "found" && scannedProduct && (
              <ScannedProductCard
                scannedProduct={scannedProduct}
                currentRating={item.thaRating ?? null}
                currentProductName={item.productName}
                selectedBarcode={selectedBarcode}
                onSelect={() => handleSelectBetterOption(scannedProduct.raw)}
                onRetry={() => { setScanState("idle"); setScannedProduct(null); }}
              />
            )}
          </div>

          {/* ── THA score explanation ─────────────────────────────────── */}
          <div className="rounded-lg bg-muted/20 border border-border/30 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">About THA scores</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Scores reflect how closely a product aligns with real, minimally processed ingredients. They are a guide, not a guarantee. Use them alongside your own knowledge and preferences.
            </p>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ── ScannedProductCard ────────────────────────────────────────────────────────

function ScannedProductCard({
  scannedProduct,
  currentRating,
  currentProductName,
  selectedBarcode,
  onSelect,
  onRetry,
}: {
  scannedProduct: ScannedProduct;
  currentRating: number | null;
  currentProductName: string;
  selectedBarcode: string | null;
  onSelect: () => void;
  onRetry: () => void;
}) {
  const isSelected = selectedBarcode === scannedProduct.barcode;
  const comparison = buildWhyBetter(scannedProduct.raw, currentRating);
  const isBetter =
    scannedProduct.thaRating !== null &&
    currentRating !== null &&
    scannedProduct.thaRating > currentRating;

  return (
    <Card
      className="border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20"
      data-testid="analyser-scanned-product"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm leading-snug">{scannedProduct.product_name}</p>
            {scannedProduct.brand && (
              <p className="text-xs text-muted-foreground">{scannedProduct.brand}</p>
            )}
            {scannedProduct.scanConfidence === "low" && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                Limited ingredient data — score is indicative only
              </p>
            )}
          </div>
          <div className="shrink-0">
            {scannedProduct.thaRating !== null && (
              <ScoreBadge score={scannedProduct.thaRating} size={28} />
            )}
          </div>
        </div>

        {comparison.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {comparison.map((reason, i) => (
              <Badge
                key={i}
                className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 no-default-hover-elevate"
              >
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                {reason}
              </Badge>
            ))}
          </div>
        )}

        {scannedProduct.availableStores.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Store className="h-3 w-3 text-muted-foreground shrink-0" />
            {scannedProduct.availableStores.map((s) => (
              <Badge key={s} variant="outline" className="text-[10px] no-default-hover-elevate">
                {s}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
          {isSelected ? (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Updated product choice. Your list item name is unchanged.
            </span>
          ) : (
            <button
              onClick={onSelect}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-500/20 active:bg-amber-500/30 transition-colors touch-manipulation"
              data-testid="analyser-select-scanned"
            >
              <Check className="h-3 w-3 mr-1 inline-block" />
              {isBetter ? "Choose this (cleaner option)" : "Choose as fulfilment"}
            </button>
          )}
          <button
            onClick={onRetry}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 touch-manipulation"
            data-testid="analyser-scan-again"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Scan again
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          Scanned product. Choosing this updates your fulfilment choice only — your list item "
          {capitalizeWords(currentProductName)}" is unchanged.
        </p>
      </CardContent>
    </Card>
  );
}

// ── WholeFoodCard ─────────────────────────────────────────────────────────────

function WholeFoodCard({ alt }: { alt: NonNullable<ReturnType<typeof getWholeFoodAlternative>> }) {
  const [showRecipe, setShowRecipe] = useState(false);

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-950/20" data-testid="analyser-wholefood-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm flex items-center gap-1.5">
              <span>{alt.emoji}</span>
              {alt.title}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${effortColor(alt.effort)}`}>
              {effortLabel(alt.effort)}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatTime(alt.timeMinutes)}
            </span>
          </div>
        </div>

        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 touch-manipulation"
          onClick={() => setShowRecipe((v) => !v)}
          data-testid="analyser-wholefood-toggle-recipe"
        >
          {showRecipe ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showRecipe ? "Hide recipe" : "View recipe"}
        </button>

        {showRecipe && (
          <div className="space-y-2.5 pt-1 border-t border-green-200/60 dark:border-green-800/40">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Ingredients</p>
              <ul className="space-y-0.5">
                {alt.ingredients.map((ing, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-muted-foreground/50 mt-0.5 shrink-0">·</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Method</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{alt.method}</p>
            </div>
            {alt.tip && (
              <p className="text-xs text-muted-foreground/70 italic">{alt.tip}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
