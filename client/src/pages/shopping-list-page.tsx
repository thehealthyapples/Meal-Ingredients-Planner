import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingCart, Copy, Trash2, RefreshCw, Scale,
  Search, ExternalLink, PoundSterling, TrendingDown, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown, Pencil, Check, X,
  Beef, Fish, Milk, Egg, Leaf, Apple, Wheat, Flower2,
  Droplets, FlaskConical, Nut, Bean, Croissant, Package,
  CircleDot, Plus, Minus, Info, Layers, Crown, Sprout, Tag,
  Download, UtensilsCrossed, Store, Maximize2, Minimize2,
  ChevronDown, ChevronUp, AlertTriangle, Microscope, Filter, SlidersHorizontal,
  Snowflake,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { api, buildUrl } from "@shared/routes";
import { formatItemDisplay } from "@/lib/unit-display";
import AppleRating from "@/components/AppleRating";
import BadAppleWarningModal from "@/components/BadAppleWarningModal";
import type { ShoppingListItem, ProductMatch, IngredientSource, SupermarketLink, FreezerMeal } from "@shared/schema";

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function formatQty(val: number | null, unit: string | null, pref: 'metric' | 'imperial', gramsVal?: number | null): { qty: string; unitLabel: string } {
  if (gramsVal !== null && gramsVal !== undefined && gramsVal > 0 && unit !== 'unit') {
    const isLiquid = unit === 'ml' || unit === 'L' || unit === 'cups' || unit === 'tbsp' || unit === 'tsp' || unit === 'fl oz';
    if (pref === 'metric') {
      if (isLiquid) {
        if (gramsVal >= 1000) return { qty: (gramsVal / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'L' };
        return { qty: Math.round(gramsVal).toString(), unitLabel: 'ml' };
      }
      if (gramsVal >= 1000) return { qty: (gramsVal / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'kg' };
      return { qty: Math.round(gramsVal).toString(), unitLabel: 'g' };
    } else {
      if (isLiquid) {
        if (gramsVal >= 240) return { qty: (gramsVal / 240).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'cups' };
        if (gramsVal >= 15) return { qty: (gramsVal / 15).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tbsp' };
        return { qty: (gramsVal / 5).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tsp' };
      }
      if (gramsVal >= 453.592) return { qty: (gramsVal / 453.592).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'lb' };
      return { qty: (gramsVal / 28.3495).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'oz' };
    }
  }
  if (val === null || val === undefined || !unit) return { qty: '-', unitLabel: '-' };
  if (unit === 'unit' && val === 1) return { qty: '1', unitLabel: '' };
  if (pref === 'metric') {
    if (unit === 'g') {
      if (val >= 1000) return { qty: (val / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'kg' };
      return { qty: Math.round(val).toString(), unitLabel: 'g' };
    }
    if (unit === 'ml') {
      if (val >= 1000) return { qty: (val / 1000).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'L' };
      return { qty: Math.round(val).toString(), unitLabel: 'ml' };
    }
  } else {
    if (unit === 'g') {
      if (val >= 453.592) return { qty: (val / 453.592).toFixed(2).replace(/\.?0+$/, ''), unitLabel: 'lb' };
      return { qty: (val / 28.3495).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'oz' };
    }
    if (unit === 'ml') {
      if (val >= 240) return { qty: (val / 240).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'cups' };
      if (val >= 15) return { qty: (val / 15).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tbsp' };
      return { qty: (val / 5).toFixed(1).replace(/\.?0+$/, ''), unitLabel: 'tsp' };
    }
  }
  if (unit === 'unit') return { qty: val % 1 === 0 ? val.toString() : val.toFixed(1), unitLabel: '' };
  return { qty: val % 1 === 0 ? val.toString() : val.toFixed(1), unitLabel: unit };
}

const CATEGORY_COLORS: Record<string, string> = {
  meat: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  fish: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  dairy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  eggs: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  produce: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  fruit: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  grains: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  herbs: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  oils: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  condiments: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  nuts: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
  legumes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  bakery: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  tinned: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const CATEGORY_ICONS: Record<string, typeof Beef> = {
  meat: Beef, fish: Fish, dairy: Milk, eggs: Egg, produce: Leaf, fruit: Apple,
  grains: Wheat, herbs: Flower2, oils: Droplets, condiments: FlaskConical,
  nuts: Nut, legumes: Bean, bakery: Croissant, tinned: Package, other: CircleDot,
};

const ALL_CATEGORIES = [
  'meat', 'fish', 'dairy', 'eggs', 'produce', 'fruit', 'grains',
  'herbs', 'oils', 'condiments', 'nuts', 'legumes', 'bakery', 'tinned', 'other',
];

const SUPERMARKET_NAMES = ['Tesco', "Sainsbury's", 'Asda', 'Morrisons', 'Aldi', 'Lidl', 'Waitrose', 'Marks & Spencer', 'Ocado'];

const TIER_LABELS: Record<string, { label: string; icon: typeof Tag; short: string }> = {
  budget: { label: 'Budget', icon: Tag, short: 'Bdgt' },
  standard: { label: 'Standard', icon: Layers, short: 'Std' },
  premium: { label: 'Premium', icon: Crown, short: 'Prem' },
  organic: { label: 'Organic', icon: Sprout, short: 'Org' },
};

type SortColumn = 'ingredient' | 'product' | 'category' | 'qty' | 'unit' | 'tier' | 'price' | 'shop' | 'smp' | 'meal';
type SortDirection = 'asc' | 'desc';
type PriceTier = 'budget' | 'standard' | 'premium' | 'organic';

interface EditState {
  itemId: number;
  field: 'productName' | 'quantityValue' | 'unit' | 'category';
  value: string;
}

const BOVAER_CATEGORIES = ['dairy', 'milk', 'cheese', 'yoghurt', 'yogurt', 'cream', 'butter', 'beef', 'meat', 'steak', 'mince', 'burger'];

function isBovaerRisk(product: any): boolean {
  const name = (product.product_name || '').toLowerCase();
  const cats = (product.categories_tags || []).map((c: string) => c.toLowerCase());
  const allText = [name, ...cats].join(' ');
  return BOVAER_CATEGORIES.some(kw => allText.includes(kw));
}

function getVerdict(product: any): string {
  const smp = product.upfAnalysis?.smpRating ?? 0;
  const additives = product.upfAnalysis?.additiveMatches?.length ?? 0;
  const emulsifiers = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.type === 'emulsifier').length ?? 0;
  const highRisk = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.riskLevel === 'high').length ?? 0;
  const isUltra = product.analysis?.isUltraProcessed;
  if (smp >= 5) return "Excellent choice. Minimal processing with whole food ingredients.";
  if (smp >= 4) return "Good quality product with limited processing. A solid everyday choice.";
  if (smp >= 3) {
    if (emulsifiers > 0) return "Moderately processed. Contains emulsifiers that may affect gut health.";
    return "Average product with moderate processing. Acceptable for occasional use.";
  }
  if (smp >= 2) {
    if (highRisk > 0) return `Below average. Contains ${highRisk} high-risk additive${highRisk > 1 ? 's' : ''}. Consider a cleaner alternative.`;
    return `Below average quality. Contains ${additives} additive${additives > 1 ? 's' : ''}. Better options exist.`;
  }
  if (isUltra) return "Highly ultra-processed with multiple concerning additives. Strongly consider switching to a cleaner alternative.";
  return "Poor quality product with significant processing. Look for a healthier option.";
}

function ProductAnalyseModal({ open, onOpenChange, item }: { open: boolean; onOpenChange: (v: boolean) => void; item: ShoppingListItem }) {
  const [searchQuery, setSearchQuery] = useState(item.productName);
  const [products, setProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hideUltraProcessed, setHideUltraProcessed] = useState(false);
  const [hideHighRiskAdditives, setHideHighRiskAdditives] = useState(false);
  const [hideEmulsifiers, setHideEmulsifiers] = useState(false);
  const [hideAcidityRegulators, setHideAcidityRegulators] = useState(false);
  const [hideBovaer, setHideBovaer] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [badAppleProduct, setBadAppleProduct] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open && item.productName) {
      setSearchQuery(item.productName);
      doSearch(item.productName);
    }
  }, [open, item.productName]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(q.trim())}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    const smpRating = product.upfAnalysis?.smpRating ?? 0;
    const additives = product.upfAnalysis?.additiveMatches?.length ?? 0;
    const nova = product.nova_group ?? null;
    if (smpRating <= 1 || (nova === 4 && additives > 5)) {
      setBadAppleProduct(product);
      return;
    }
    doSelectProduct(product);
  };

  const doSelectProduct = async (product: any) => {
    try {
      const url = buildUrl(api.shoppingList.update.path, { id: item.id });
      const productDisplayName = [product.brand, product.product_name].filter(Boolean).join(' - ');
      const storesArray: string[] = product.availableStores || [];
      const productSmpRating = product.upfAnalysis?.smpRating ?? null;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productDisplayName || product.product_name || item.productName,
          matchedProductId: product.barcode || null,
          matchedStore: product.brand || null,
          matchedPrice: null,
          availableStores: storesArray.length > 0 ? JSON.stringify(storesArray) : null,
          smpRating: productSmpRating,
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update');
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Product selected", description: `Selected "${productDisplayName || product.product_name}" for ${capitalizeWords(item.productName)}` });
      onOpenChange(false);
    } catch {
      toast({ title: "Failed to save selection", variant: "destructive" });
    }
  };

  const getNutriScoreColor = (grade: string | null) => {
    switch (grade?.toLowerCase()) {
      case 'a': return 'bg-green-600 text-white';
      case 'b': return 'bg-green-400 text-white';
      case 'c': return 'bg-yellow-400 text-black';
      case 'd': return 'bg-orange-400 text-white';
      case 'e': return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getNovaColor = (nova: number | null) => {
    switch (nova) {
      case 1: return 'bg-green-600 text-white';
      case 2: return 'bg-yellow-400 text-black';
      case 3: return 'bg-orange-400 text-white';
      case 4: return 'bg-red-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (hideUltraProcessed && p.analysis?.isUltraProcessed) return false;
      if (hideHighRiskAdditives && p.upfAnalysis?.additiveMatches?.some((a: any) => a.riskLevel === 'high')) return false;
      if (hideEmulsifiers && p.upfAnalysis?.additiveMatches?.some((a: any) => a.type === 'emulsifier')) return false;
      if (hideAcidityRegulators && p.upfAnalysis?.additiveMatches?.some((a: any) => a.type === 'acidity regulator' || a.type === 'acidity_regulator')) return false;
      if (hideBovaer && isBovaerRisk(p)) return false;
      if (minRating > 0 && (p.upfAnalysis?.smpRating ?? 0) < minRating) return false;
      return true;
    });
  }, [products, hideUltraProcessed, hideHighRiskAdditives, hideEmulsifiers, hideAcidityRegulators, hideBovaer, minRating]);

  const activeFilterCount = [hideUltraProcessed, hideHighRiskAdditives, hideEmulsifiers, hideAcidityRegulators, hideBovaer, minRating > 0].filter(Boolean).length;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Microscope className="h-5 w-5 text-primary" />
            Product Analysis: {capitalizeWords(item.productName)}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Find and compare real products by health score, UPF rating, and additives. Select the healthiest option for your basket.</p>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch(searchQuery); }}
            placeholder="Search products..."
            className="flex-1"
            data-testid="input-analyse-search"
          />
          <Button onClick={() => doSearch(searchQuery)} disabled={isSearching} data-testid="button-analyse-search">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
            data-testid="button-analyse-toggle-filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <Card data-testid="card-analyse-filters">
                <CardContent className="pt-4 pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="analyse-hide-upf" className="text-xs cursor-pointer">Hide ultra-processed</Label>
                      <Switch id="analyse-hide-upf" checked={hideUltraProcessed} onCheckedChange={setHideUltraProcessed} data-testid="switch-analyse-hide-upf" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="analyse-hide-additives" className="text-xs cursor-pointer">Hide high-risk additives</Label>
                      <Switch id="analyse-hide-additives" checked={hideHighRiskAdditives} onCheckedChange={setHideHighRiskAdditives} data-testid="switch-analyse-hide-additives" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="analyse-hide-emulsifiers" className="text-xs cursor-pointer">Hide emulsifiers</Label>
                      <Switch id="analyse-hide-emulsifiers" checked={hideEmulsifiers} onCheckedChange={setHideEmulsifiers} data-testid="switch-analyse-hide-emulsifiers" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="analyse-hide-acidity" className="text-xs cursor-pointer">Hide acidity regulators</Label>
                      <Switch id="analyse-hide-acidity" checked={hideAcidityRegulators} onCheckedChange={setHideAcidityRegulators} data-testid="switch-analyse-hide-acidity" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="analyse-hide-bovaer" className="text-xs cursor-pointer">Exclude Bovaer-risk (dairy/meat)</Label>
                      <Switch id="analyse-hide-bovaer" checked={hideBovaer} onCheckedChange={setHideBovaer} data-testid="switch-analyse-hide-bovaer" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Min SMP Rating</Label>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4, 5].map(r => (
                          <Button key={r} size="sm" variant={minRating === r ? 'default' : 'outline'} onClick={() => setMinRating(r)} data-testid={`button-analyse-min-rating-${r}`}>
                            {r === 0 ? 'All' : r}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {activeFilterCount > 0 && products.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Showing {filteredProducts.length} of {products.length} products
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 overflow-y-auto space-y-3">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isSearching && products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No products found. Try a different search term.</p>
            </div>
          )}
          {!isSearching && filteredProducts.length === 0 && products.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">All products filtered out</p>
              <p className="text-xs mt-1">Adjust your filters to see more results</p>
            </div>
          )}
          {!isSearching && filteredProducts.map((product, idx) => {
            const smpRating = product.upfAnalysis?.smpRating ?? 0;
            const additiveCount = product.upfAnalysis?.additiveMatches?.length ?? 0;
            const emulsifierCount = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.type === 'emulsifier').length ?? 0;
            const highRiskCount = product.upfAnalysis?.additiveMatches?.filter((a: any) => a.riskLevel === 'high').length ?? 0;
            const hasCape = product.upfAnalysis?.hasCape ?? false;
            const verdict = getVerdict(product);

            return (
            <Card key={`${product.barcode}-${idx}`} className="overflow-visible" data-testid={`card-analyse-product-${idx}`}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{product.product_name}</p>
                        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <AppleRating rating={smpRating} hasCape={hasCape} size="medium" />
                        <Button size="sm" onClick={() => handleSelectProduct(product)} data-testid={`button-select-product-${idx}`}>
                          <Check className="h-3 w-3 mr-1" />
                          Select
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {product.isUK && (
                        <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-600 dark:text-blue-400">UK</Badge>
                      )}
                      {product.nutriscore_grade && (
                        <Badge className={`text-[10px] ${getNutriScoreColor(product.nutriscore_grade)} no-default-hover-elevate`}>
                          Nutri-Score {product.nutriscore_grade.toUpperCase()}
                        </Badge>
                      )}
                      {product.nova_group && (
                        <Badge className={`text-[10px] ${getNovaColor(product.nova_group)} no-default-hover-elevate`}>
                          NOVA {product.nova_group}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground">Ultra-Processed</span>
                        <span className={product.analysis?.isUltraProcessed ? 'font-medium text-red-500 dark:text-red-400' : 'font-medium text-green-600 dark:text-green-400'}>
                          {product.analysis?.isUltraProcessed ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground">Additives</span>
                        <span className={`font-medium ${additiveCount > 3 ? 'text-red-500 dark:text-red-400' : additiveCount > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                          {additiveCount > 0 ? `${additiveCount} detected` : 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground">Emulsifiers</span>
                        <span className={`font-medium ${emulsifierCount > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                          {emulsifierCount > 0 ? `${emulsifierCount} detected` : 'None'}
                        </span>
                      </div>
                      {product.upfAnalysis && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-muted-foreground">UPF Score</span>
                          <span className={`font-medium ${product.upfAnalysis.upfScore < 30 ? 'text-green-600 dark:text-green-400' : product.upfAnalysis.upfScore < 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'}`}>
                            {product.upfAnalysis.upfScore}/100
                          </span>
                        </div>
                      )}
                      {product.analysis && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-muted-foreground">Health Score</span>
                          <span className={`font-medium ${product.analysis.healthScore >= 60 ? 'text-green-600 dark:text-green-400' : product.analysis.healthScore >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'}`}>
                            {product.analysis.healthScore}/100
                          </span>
                        </div>
                      )}
                      {highRiskCount > 0 && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-muted-foreground">High-Risk</span>
                          <span className="font-medium text-red-500 dark:text-red-400">{highRiskCount} additive{highRiskCount > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-2 italic leading-relaxed">{verdict}</p>

                    {product.availableStores && product.availableStores.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Store className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-[10px] text-muted-foreground mr-0.5">Sold at:</span>
                        {product.availableStores.map((store: string) => (
                          <Badge key={store} variant="outline" className="text-[10px] border-green-400 text-green-600 dark:text-green-400 no-default-hover-elevate">
                            {store}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {product.nutriments && (
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                        {product.nutriments.calories && <span>{product.nutriments.calories}</span>}
                        {product.nutriments.protein && <span>P: {product.nutriments.protein}</span>}
                        {product.nutriments.carbs && <span>C: {product.nutriments.carbs}</span>}
                        {product.nutriments.fat && <span>F: {product.nutriments.fat}</span>}
                      </div>
                    )}

                    {product.upfAnalysis && product.upfAnalysis.additiveMatches.length > 0 && (
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2 text-muted-foreground"
                          onClick={() => setExpandedProduct(expandedProduct === product.barcode ? null : product.barcode)}
                          data-testid={`button-toggle-additives-${idx}`}
                        >
                          <FlaskConical className="h-3 w-3 mr-1" />
                          {product.upfAnalysis.additiveMatches.length} additive{product.upfAnalysis.additiveMatches.length > 1 ? 's' : ''}
                          {expandedProduct === product.barcode ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                        </Button>
                        {expandedProduct === product.barcode && (
                          <div className="mt-1 space-y-1 pl-2 border-l-2 border-border">
                            {product.upfAnalysis.additiveMatches.map((additive: any, aIdx: number) => (
                              <div key={aIdx} className="text-xs flex items-center gap-1.5">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                  additive.riskLevel === 'high' ? 'bg-red-500' :
                                  additive.riskLevel === 'moderate' ? 'bg-orange-400' :
                                  additive.riskLevel === 'low' ? 'bg-yellow-400' : 'bg-green-400'
                                }`} />
                                <span className="font-medium">{additive.name}</span>
                                <span className="text-muted-foreground">({additive.type})</span>
                                {additive.description && (
                                  <span className="text-muted-foreground truncate">- {additive.description}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {product.upfAnalysis && product.upfAnalysis.processingIndicators.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {product.upfAnalysis.processingIndicators.map((indicator: string, iIdx: number) => (
                          <Badge key={iIdx} variant="outline" className="text-[10px] text-orange-500 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
    {badAppleProduct && (
      <BadAppleWarningModal
        open={!!badAppleProduct}
        onOpenChange={(v) => { if (!v) setBadAppleProduct(null); }}
        productName={badAppleProduct.product_name}
        riskSummary={{
          additiveCount: badAppleProduct.upfAnalysis?.additiveMatches?.length ?? 0,
          emulsifierCount: badAppleProduct.upfAnalysis?.additiveMatches?.filter((a: any) => a.type === 'emulsifier').length ?? 0,
          highRiskCount: badAppleProduct.upfAnalysis?.additiveMatches?.filter((a: any) => a.riskLevel === 'high').length ?? 0,
          novaGroup: badAppleProduct.nova_group ?? null,
          isUltraProcessed: badAppleProduct.analysis?.isUltraProcessed ?? false,
          upfScore: badAppleProduct.upfAnalysis?.upfScore ?? 0,
        }}
        onFindBetter={() => {
          setBadAppleProduct(null);
          setMinRating(3);
          setShowFilters(true);
        }}
        onAddAnyway={() => {
          doSelectProduct(badAppleProduct);
          setBadAppleProduct(null);
        }}
      />
    )}
    </>
  );
}

export default function ShoppingListPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "SMP \u2013 Analyse Basket";
    return () => { document.title = "The Healthy Apples"; };
  }, []);

  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editState, setEditState] = useState<EditState | null>(null);
  const [comparisonItem, setComparisonItem] = useState<ShoppingListItem | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSupermarket, setExportSupermarket] = useState<string>('Tesco');
  const [basketDialogOpen, setBasketDialogOpen] = useState(false);
  const [basketSending, setBasketSending] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [globalStore, setGlobalStore] = useState<string>('auto');
  const [analyseItem, setAnalyseItem] = useState<ShoppingListItem | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  const measurementPref = (user?.measurementPreference as 'metric' | 'imperial') || 'metric';
  const currentTier = (user?.preferredPriceTier as PriceTier) || 'standard';

  const { data: savedItems = [], isLoading: loadingSaved } = useQuery<ShoppingListItem[]>({
    queryKey: [api.shoppingList.list.path],
  });

  const { data: allPriceMatches = [] } = useQuery<ProductMatch[]>({
    queryKey: [api.shoppingList.prices.path],
  });

  const { data: ingredientSources = [] } = useQuery<IngredientSource[]>({
    queryKey: [api.shoppingList.sources.path],
  });

  const { data: freezerMeals = [] } = useQuery<FreezerMeal[]>({
    queryKey: ['/api/freezer'],
  });

  const frozenMealIds = useMemo(() => {
    const ids = new Set<number>();
    for (const f of freezerMeals) {
      if (f.remainingPortions > 0) ids.add(f.mealId);
    }
    return ids;
  }, [freezerMeals]);

  const { data: supermarkets = [] } = useQuery<SupermarketLink[]>({
    queryKey: [api.supermarkets.list.path],
  });

  const { data: totalCostData } = useQuery<{
    totalCheapest: number;
    customTotal: number;
    supermarketTotals: { supermarket: string; total: number }[];
    currency: string;
    preferredTier: string;
    tierTotals: Record<string, number>;
  }>({
    queryKey: [api.shoppingList.totalCost.path, currentTier],
    queryFn: async () => {
      const res = await fetch(`${api.shoppingList.totalCost.path}?tier=${currentTier}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch total cost');
      return res.json();
    },
    enabled: allPriceMatches.length > 0,
  });

  useEffect(() => {
    if (savedItems.length > 0) {
      const stores = savedItems.map(i => i.selectedStore).filter(Boolean);
      if (stores.length > 0 && stores.every(s => s === stores[0])) {
        setGlobalStore(stores[0]!);
      }
    }
  }, [savedItems]);

  const autoSmpRef = useRef<{ done: boolean; running: boolean }>({ done: false, running: false });
  const itemCount = savedItems.length;
  const missingSmpCount = savedItems.filter(i => i.smpRating === null || i.smpRating === undefined).length;
  useEffect(() => {
    if (loadingSaved || itemCount === 0 || missingSmpCount === 0) return;
    if (autoSmpRef.current.done || autoSmpRef.current.running) return;
    autoSmpRef.current.running = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(api.shoppingList.autoSmp.path, { method: 'POST', credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.updated && data.updated.length > 0) {
            queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
          }
        }
      } catch {}
      autoSmpRef.current.running = false;
      autoSmpRef.current.done = true;
    }, 2000);
    return () => { clearTimeout(timer); autoSmpRef.current.running = false; };
  }, [loadingSaved, itemCount, missingSmpCount, queryClient]);

  const getItemTier = useCallback((item: ShoppingListItem): PriceTier => {
    return (item.selectedTier as PriceTier) || currentTier;
  }, [currentTier]);

  const priceMatchesForItem = useCallback((itemId: number, tier: PriceTier) => {
    return allPriceMatches.filter(m => m.shoppingListItemId === itemId && m.tier === tier);
  }, [allPriceMatches]);

  const sourcesByItem = useMemo(() => {
    const map = new Map<number, IngredientSource[]>();
    for (const s of ingredientSources) {
      if (!map.has(s.shoppingListItemId)) map.set(s.shoppingListItemId, []);
      map.get(s.shoppingListItemId)!.push(s);
    }
    return map;
  }, [ingredientSources]);

  const pricesByItem = useMemo(() => {
    const map = new Map<number, Map<string, ProductMatch>>();
    for (const item of savedItems) {
      const tier = getItemTier(item);
      const matches = allPriceMatches.filter(m => m.shoppingListItemId === item.id && m.tier === tier);
      const storeMap = new Map<string, ProductMatch>();
      for (const m of matches) {
        storeMap.set(m.supermarket, m);
      }
      map.set(item.id, storeMap);
    }
    return map;
  }, [allPriceMatches, savedItems, getItemTier]);


  const togglePreference = useMutation({
    mutationFn: async () => {
      const newPref = measurementPref === 'metric' ? 'imperial' : 'metric';
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurementPreference: newPref }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });

  const changeTier = useMutation({
    mutationFn: async (tier: PriceTier) => {
      const res = await fetch(api.priceTier.update.path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update tier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
    },
  });

  const changeItemTier = useMutation({
    mutationFn: async ({ id, tier }: { id: number; tier: string | null }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTier: tier }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update item tier');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
    },
  });


  const lookupPrices = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shoppingList.lookupPrices.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to lookup prices');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({ title: "Products Matched", description: "Real grocery products matched and prices loaded across supermarkets." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not lookup prices.", variant: "destructive" });
    },
  });

  const updateGlobalStore = useMutation({
    mutationFn: async (store: string) => {
      const storeVal = store === 'auto' ? null : store;
      const res = await fetch(api.basket.updateStore.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: storeVal }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update global store');
      return res.json();
    },
    onSuccess: (_, store) => {
      setGlobalStore(store);
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      toast({
        title: store === 'auto' ? "Auto mode" : `${store} selected`,
        description: store === 'auto' ? "Each item uses its cheapest option." : `All items set to ${store}.`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update store.", variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, fields }: { id: number; fields: Record<string, any> }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      setEditState(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update item.", variant: "destructive" });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.shoppingList.remove.path, { id });
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to remove');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.shoppingList.clear.path, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to clear');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      toast({ title: "Cleared", description: "Basket has been cleared." });
    },
  });

  const toggleChecked = useMutation({
    mutationFn: async ({ id, checked }: { id: number; checked: boolean }) => {
      const url = buildUrl(api.shoppingList.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to toggle checked');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
    },
  });


  const copyToClipboard = () => {
    const items = savedItems.length > 0
      ? savedItems.map(i => {
          const display = formatItemDisplay(i.productName, i.quantityValue, i.unit, measurementPref);
          return `- ${display}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`;
        })
      : [];
    if (items.length === 0) return;
    navigator.clipboard.writeText("Basket:\n\n" + items.join("\n"));
    toast({ title: "Copied!", description: "Basket copied to clipboard." });
  };

  const getCheapestForItem = useCallback((itemId: number): { price: number; supermarket: string } | null => {
    const itemPrices = pricesByItem.get(itemId);
    if (!itemPrices) return null;
    let cheapest: { price: number; supermarket: string } | null = null;
    SUPERMARKET_NAMES.forEach(store => {
      const match = itemPrices.get(store);
      if (match && match.price !== null && (!cheapest || match.price < cheapest.price)) {
        cheapest = { price: match.price, supermarket: store };
      }
    });
    return cheapest;
  }, [pricesByItem]);

  const getItemSmpRating = useCallback((itemId: number, item?: ShoppingListItem): number => {
    if (item?.smpRating !== null && item?.smpRating !== undefined && item.smpRating > 0) {
      return item.smpRating;
    }
    const itemPrices = pricesByItem.get(itemId);
    if (!itemPrices) return 0;
    const store = item?.selectedStore || getCheapestForItem(itemId)?.supermarket;
    if (store) {
      const match = itemPrices.get(store);
      if (match?.smpRating !== null && match?.smpRating !== undefined) return match.smpRating;
    }
    let maxSmp = 0;
    itemPrices.forEach(match => {
      if (match.smpRating !== null && match.smpRating !== undefined && match.smpRating > maxSmp) {
        maxSmp = match.smpRating;
      }
    });
    return maxSmp;
  }, [pricesByItem, getCheapestForItem]);

  const hasPrices = allPriceMatches.length > 0;
  const hasItemOverrides = savedItems.some(i => i.selectedTier !== null);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sortedItems = useMemo(() => {
    if (!sortColumn) return savedItems;
    const sorted = [...savedItems].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'ingredient':
          cmp = (a.productName || '').localeCompare(b.productName || '');
          break;
        case 'product': {
          const aMatch = pricesByItem.get(a.id)?.values().next().value;
          const bMatch = pricesByItem.get(b.id)?.values().next().value;
          cmp = ((aMatch as any)?.productName || '').localeCompare((bMatch as any)?.productName || '');
          break;
        }
        case 'category':
          cmp = (a.category || 'other').localeCompare(b.category || 'other');
          break;
        case 'qty':
          cmp = (a.quantityValue || 0) - (b.quantityValue || 0);
          break;
        case 'unit':
          cmp = (a.unit || '').localeCompare(b.unit || '');
          break;
        case 'tier':
          cmp = (getItemTier(a)).localeCompare(getItemTier(b));
          break;
        case 'meal': {
          const aSources = sourcesByItem.get(a.id) || [];
          const bSources = sourcesByItem.get(b.id) || [];
          cmp = aSources.length - bSources.length;
          break;
        }
        case 'price': {
          const aStore = a.selectedStore || getCheapestForItem(a.id)?.supermarket || '';
          const bStore = b.selectedStore || getCheapestForItem(b.id)?.supermarket || '';
          const aPrice = (aStore ? pricesByItem.get(a.id)?.get(aStore)?.price : getCheapestForItem(a.id)?.price) ?? Infinity;
          const bPrice = (bStore ? pricesByItem.get(b.id)?.get(bStore)?.price : getCheapestForItem(b.id)?.price) ?? Infinity;
          cmp = aPrice - bPrice;
          break;
        }
        case 'shop': {
          const aShop = a.selectedStore || getCheapestForItem(a.id)?.supermarket || '';
          const bShop = b.selectedStore || getCheapestForItem(b.id)?.supermarket || '';
          cmp = aShop.localeCompare(bShop);
          break;
        }
        case 'smp': {
          const aSmp = getItemSmpRating(a.id, a);
          const bSmp = getItemSmpRating(b.id, b);
          if (aSmp === 0 && bSmp === 0) cmp = 0;
          else if (aSmp === 0) cmp = 1;
          else if (bSmp === 0) cmp = -1;
          else cmp = aSmp - bSmp;
          break;
        }
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [savedItems, sortColumn, sortDirection, pricesByItem, getCheapestForItem, getItemTier, getItemSmpRating, sourcesByItem]);

  const startEdit = (itemId: number, field: EditState['field'], currentValue: string) => {
    setEditState({ itemId, field, value: currentValue });
  };

  const saveEdit = () => {
    if (!editState) return;
    const { itemId, field, value } = editState;
    const fields: Record<string, any> = {};
    if (field === 'quantityValue') {
      fields.quantityValue = parseFloat(value) || 0;
    } else {
      fields[field] = value;
    }
    updateItem.mutate({ id: itemId, fields });
  };

  const cancelEdit = () => setEditState(null);

  const comparisonMatches = useMemo(() => {
    if (!comparisonItem) return [];
    return allPriceMatches.filter(m => m.shoppingListItemId === comparisonItem.id);
  }, [comparisonItem, allPriceMatches]);

  const handleExport = (format: 'list' | 'links') => {
    if (format === 'list') {
      const lines: string[] = [];
      lines.push(`Basket - ${new Date().toLocaleDateString()}`);
      lines.push(`Supermarket: ${exportSupermarket}`);
      lines.push('');
      lines.push('Ingredient | Qty | Unit | Tier | Price');
      lines.push('--- | --- | --- | --- | ---');
      for (const item of savedItems) {
        const { qty, unitLabel } = formatQty(item.quantityValue, item.unit, measurementPref);
        const tier = getItemTier(item);
        const tierLabel = TIER_LABELS[tier]?.label || 'Standard';
        const match = pricesByItem.get(item.id)?.get(exportSupermarket);
        const price = match?.price !== null && match?.price !== undefined ? `\u00A3${match.price.toFixed(2)}` : '-';
        lines.push(`${capitalizeWords(item.productName)} | ${qty} ${unitLabel} | ${tierLabel} | ${price}`);
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `basket-${exportSupermarket.toLowerCase().replace(/'/g, '')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported!", description: `Basket downloaded for ${exportSupermarket}.` });
    } else {
      const selectedStore = supermarkets.find(s =>
        s.name.toLowerCase().includes(exportSupermarket.toLowerCase())
      );
      if (selectedStore?.searchUrl) {
        for (const item of savedItems.slice(0, 10)) {
          const searchUrl = selectedStore.searchUrl.replace('{query}', encodeURIComponent(item.productName));
          window.open(searchUrl, '_blank');
        }
        if (savedItems.length > 10) {
          toast({ title: "Opened first 10 items", description: `${savedItems.length - 10} more items remaining. Use the text export for the full list.` });
        }
      } else {
        toast({ title: "No search URL", description: `Cannot open search links for ${exportSupermarket}. Try the text export instead.`, variant: "destructive" });
      }
    }
    setExportDialogOpen(false);
  };

  const [basketResult, setBasketResult] = useState<{
    supermarket: string;
    itemUrls: { name: string; url: string; productId?: string }[];
    matchedCount: number;
    totalCount: number;
    estimatedTotal?: number;
    message?: string;
  } | null>(null);

  const handleSendBasket = async (supermarket: string) => {
    if (savedItems.length === 0) {
      toast({ title: "Empty Basket", description: "Add items to your basket first.", variant: "destructive" });
      return;
    }
    setBasketSending(supermarket);
    setBasketResult(null);
    try {
      const res = await fetch('/api/basket/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ supermarket }),
      });
      if (!res.ok) throw new Error('Failed to create basket');
      const result = await res.json();

      if (result.success && result.itemUrls && result.itemUrls.length > 0) {
        setBasketResult(result);
        const urlsToOpen = result.itemUrls.slice(0, 8);
        for (const item of urlsToOpen) {
          window.open(item.url, '_blank');
        }
        const opened = urlsToOpen.length;
        const remaining = result.itemUrls.length - opened;
        toast({
          title: `${result.supermarket} Basket`,
          description: remaining > 0
            ? `Opened ${opened} of ${result.itemUrls.length} items. ${result.matchedCount} matched with product links.`
            : `Opened ${opened} product pages on ${result.supermarket}.`,
        });
      } else {
        toast({ title: "Could not send", description: result.message || "Unable to create basket.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: `Failed to send basket to ${supermarket}.`, variant: "destructive" });
    } finally {
      setBasketSending(null);
    }
  };

  const { data: enhancedSupermarkets = [] } = useQuery<{
    name: string;
    key: string;
    color: string;
    hasDirectBasket: boolean;
  }[]>({
    queryKey: ['/api/basket/supermarkets-enhanced'],
  });

  const primarySupermarkets = enhancedSupermarkets.filter(s => s.hasDirectBasket);
  const otherSupermarkets = enhancedSupermarkets.filter(s => !s.hasDirectBasket);

  const SortableHeader = ({ column, label, className = '' }: { column: SortColumn; label: string; className?: string }) => (
    <th
      className={`p-3 font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => handleSort(column)}
      data-testid={`sort-${column}`}
    >
      <span className="inline-flex items-center">
        {label}
        {getSortIcon(column)}
      </span>
    </th>
  );

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background overflow-auto p-4 sm:p-6' : 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>

      <div className="flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-6 border-b border-border">
            <div className="flex justify-between items-center gap-1 flex-wrap">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle className="text-[28px] font-semibold tracking-tight" data-testid="text-analyse-basket-title">Analyse Basket</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-items-count">
                    {savedItems.length} items to buy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {hasPrices && (
                  <>
                    <Select
                      value={globalStore}
                      onValueChange={(val) => updateGlobalStore.mutate(val)}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="select-global-store">
                        <Store className="h-3 w-3 mr-1 flex-shrink-0" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          <span className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Auto (Cheapest)
                          </span>
                        </SelectItem>
                        {SUPERMARKET_NAMES.map(store => (
                          <SelectItem key={store} value={store}>
                            {store}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={currentTier}
                      onValueChange={(val) => changeTier.mutate(val as PriceTier)}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs" data-testid="select-price-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIER_LABELS).map(([key, { label, icon: TierIcon }]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-1">
                              <TierIcon className="h-3 w-3" />
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePreference.mutate()}
                  disabled={togglePreference.isPending}
                  data-testid="button-toggle-units"
                  className="gap-1"
                >
                  <Scale className="h-3 w-3" />
                  {measurementPref === 'metric' ? 'Metric' : 'Imperial'}
                </Button>
                {savedItems.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => lookupPrices.mutate()}
                      disabled={lookupPrices.isPending}
                      data-testid="button-lookup-prices"
                      className="gap-1"
                    >
                      {lookupPrices.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                      Match Products
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBasketDialogOpen(true)}
                      data-testid="button-send-to-supermarket"
                      className="gap-1"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Send to Supermarket
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExportDialogOpen(true)}
                      data-testid="button-export-list"
                      className="gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </>
                )}
                <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={savedItems.length === 0} data-testid="button-copy">
                  <Copy className="h-4 w-4" />
                </Button>
                {savedItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => clearAll.mutate()}
                    disabled={clearAll.isPending}
                    data-testid="button-clear-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  data-testid="button-fullscreen-toggle"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>

          {hasPrices && totalCostData && savedItems.length > 0 && (
            <div className="border-b border-border p-4 bg-muted/20">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <PoundSterling className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg" data-testid="text-total-cost-title">Shopping Summary</h3>
                  <Badge variant="secondary" className="text-xs" data-testid="text-total-items">{savedItems.length} items</Badge>
                  <Badge variant="outline" className="text-xs" data-testid="text-current-tier">
                    {TIER_LABELS[currentTier]?.label || 'Standard'} default
                  </Badge>
                  {hasItemOverrides && (
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 dark:text-amber-400">
                      Custom tiers active
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {totalCostData.supermarketTotals.map((st, idx) => {
                    const isCheapest = idx === 0;
                    return (
                      <div
                        key={st.supermarket}
                        className={`rounded-md p-3 border ${isCheapest ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-border bg-card'}`}
                        data-testid={`card-total-${st.supermarket.replace(/'/g, '')}`}
                      >
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {isCheapest && <TrendingDown className="h-3 w-3 text-green-600 dark:text-green-400" />}
                          {st.supermarket}
                        </p>
                        <p className={`text-xl font-bold tabular-nums ${isCheapest ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          {"\u00A3"}{st.total.toFixed(2)}
                        </p>
                        {isCheapest && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">CHEAPEST</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalCostData.tierTotals && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
                    {Object.entries(totalCostData.tierTotals).map(([tier, total]) => {
                      const tierInfo = TIER_LABELS[tier];
                      if (!tierInfo) return null;
                      const TierIcon = tierInfo.icon;
                      const isActive = tier === currentTier;
                      return (
                        <div
                          key={tier}
                          className={`rounded-md p-2 text-center cursor-pointer border transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                          onClick={() => changeTier.mutate(tier as PriceTier)}
                          data-testid={`tier-total-${tier}`}
                        >
                          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                            <TierIcon className="h-3 w-3" />
                            {tierInfo.label}
                          </p>
                          <p className={`text-sm font-bold tabular-nums ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {"\u00A3"}{(total as number).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    {globalStore !== 'auto'
                      ? `${globalStore} basket total:`
                      : hasItemOverrides
                        ? 'Custom mix total (cheapest per item):'
                        : 'Best possible total (cheapest per item):'}
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums" data-testid="text-cheapest-total">
                    {"\u00A3"}{(hasItemOverrides || globalStore !== 'auto' ? totalCostData.customTotal : totalCostData.totalCheapest).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <CardContent className="flex-1 overflow-y-auto p-0">
            {loadingSaved ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-50 space-y-4 p-8">
                <ShoppingCart className="h-16 w-16 stroke-1" />
                <div>
                  <p>Your basket is empty.</p>
                  <p className="text-sm mt-1">Select meals on the left, set quantities with +/-,<br/>then click "Add to Basket".</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" data-testid="table-analyse-basket">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-2 py-2 w-8">
                        <span className="sr-only">Purchased</span>
                      </th>
                      <SortableHeader column="ingredient" label="Ingredient" className="text-left" />
                      <SortableHeader column="qty" label="Qty" className="text-right" />
                      <SortableHeader column="unit" label="Unit" className="text-left" />
                      {hasPrices && (
                        <SortableHeader column="product" label="Matched Product" className="text-left" />
                      )}
                      <SortableHeader column="category" label="Cat." className="text-left" />
                      {hasPrices && (
                        <SortableHeader column="tier" label="Tier" className="text-left" />
                      )}
                      <SortableHeader column="meal" label="Meal" className="text-center" />
                      {hasPrices && (
                        <>
                          <SortableHeader column="price" label="Price" className="text-right" />
                          <SortableHeader column="shop" label="Shop" className="text-left" />
                          <SortableHeader column="smp" label="SMP" className="text-center" />
                        </>
                      )}
                      <th className="px-2 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {sortedItems.map((item) => {
                        const { qty, unitLabel } = formatQty(item.quantityValue, item.unit, measurementPref, item.quantityInGrams);
                        const itemPrices = pricesByItem.get(item.id);
                        const cheapest = getCheapestForItem(item.id);
                        const cat = item.category || 'other';
                        const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
                        const CatIcon = CATEGORY_ICONS[cat] || CircleDot;
                        const isEditing = editState?.itemId === item.id;
                        const sources = sourcesByItem.get(item.id) || [];
                        const itemTier = getItemTier(item);
                        const tierInfo = TIER_LABELS[itemTier] || TIER_LABELS.standard;
                        const isOverridden = item.selectedTier !== null;

                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`border-b border-border/50 ${item.checked ? 'opacity-50' : ''}`}
                            data-testid={`shopping-item-${item.id}`}
                          >
                            <td className="px-2 py-1.5">
                              <Checkbox
                                checked={item.checked || false}
                                onCheckedChange={(checked) => toggleChecked.mutate({ id: item.id, checked: !!checked })}
                                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                data-testid={`checkbox-item-${item.id}`}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              {isEditing && editState?.field === 'productName' ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    value={editState.value}
                                    onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                    className="h-7 text-xs"
                                    autoFocus
                                    data-testid={`input-edit-name-${item.id}`}
                                  />
                                  <Button size="icon" variant="ghost" onClick={saveEdit} data-testid={`button-save-edit-${item.id}`}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="font-bold text-foreground cursor-pointer"
                                    onClick={() => startEdit(item.id, 'productName', item.productName)}
                                    data-testid={`text-item-name-${item.id}`}
                                  >
                                    {capitalizeWords(item.productName)}
                                  </span>
                                  {item.quantity > 1 && (
                                    <Badge variant="secondary" className="text-[10px]" data-testid={`badge-quantity-${item.id}`}>
                                      x{item.quantity}
                                    </Badge>
                                  )}
                                  {sources.some(s => frozenMealIds.has(s.mealId)) && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="text-[10px] text-blue-500 dark:text-blue-400 border-blue-300 dark:border-blue-600 gap-0.5" data-testid={`badge-frozen-source-${item.id}`}>
                                          <Snowflake className="h-2.5 w-2.5" />
                                          In Freezer
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">You have frozen portions of a meal that uses this ingredient</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {item.needsReview && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 gap-0.5" data-testid={`badge-review-${item.id}`}>
                                          <AlertTriangle className="h-2.5 w-2.5" />
                                          Review
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">{item.validationNote || 'This item may need manual review'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-foreground">
                              {isEditing && editState?.field === 'quantityValue' ? (
                                <div className="flex items-center gap-1 justify-end">
                                  <Input
                                    type="number"
                                    value={editState.value}
                                    onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                    className="h-7 text-xs w-20 text-right"
                                    autoFocus
                                    data-testid={`input-edit-qty-${item.id}`}
                                  />
                                  <Button size="icon" variant="ghost" onClick={saveEdit}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span
                                  className="cursor-pointer"
                                  onClick={() => startEdit(item.id, 'quantityValue', String(item.quantityValue || 0))}
                                  data-testid={`text-item-qty-${item.id}`}
                                >
                                  {qty}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground">
                              {isEditing && editState?.field === 'unit' ? (
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={editState.value}
                                    onValueChange={(val) => {
                                      updateItem.mutate({ id: item.id, fields: { unit: val } });
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-20" data-testid={`select-edit-unit-${item.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="g">g</SelectItem>
                                      <SelectItem value="kg">kg</SelectItem>
                                      <SelectItem value="ml">ml</SelectItem>
                                      <SelectItem value="L">L</SelectItem>
                                      <SelectItem value="unit">unit</SelectItem>
                                      <SelectItem value="tbsp">tbsp</SelectItem>
                                      <SelectItem value="tsp">tsp</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span
                                  className="cursor-pointer"
                                  onClick={() => startEdit(item.id, 'unit', item.unit || 'unit')}
                                  data-testid={`text-item-unit-${item.id}`}
                                >
                                  {unitLabel}
                                </span>
                              )}
                            </td>
                            {hasPrices && (() => {
                              const activeStore = item.selectedStore || cheapest?.supermarket;
                              const activeMatch = activeStore ? itemPrices?.get(activeStore) : (itemPrices?.values().next().value as ProductMatch | undefined);
                              const displayMatch = item.selectedStore ? activeMatch : (activeMatch || (itemPrices?.values().next().value as ProductMatch | undefined));
                              return (
                                <td className="px-2 py-1.5">
                                  {displayMatch ? (
                                    <div className="flex items-center gap-2 max-w-[180px]">
                                      {displayMatch.imageUrl && (
                                        <img
                                          src={displayMatch.imageUrl}
                                          alt={displayMatch.productName}
                                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                          data-testid={`img-product-${item.id}`}
                                        />
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-xs text-foreground break-words" data-testid={`text-product-name-${item.id}`}>
                                          {displayMatch.productName}
                                        </p>
                                        {displayMatch.productWeight && (
                                          <p className="text-[10px] text-muted-foreground">{displayMatch.productWeight}</p>
                                        )}
                                      </div>
                                    </div>
                                  ) : item.selectedStore ? (
                                    <span className="text-amber-500 text-xs flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      No match
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </td>
                              );
                            })()}
                            <td className="px-2 py-1.5">
                              {isEditing && editState?.field === 'category' ? (
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={editState.value}
                                    onValueChange={(val) => {
                                      updateItem.mutate({ id: item.id, fields: { category: val } });
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-24" data-testid={`select-edit-category-${item.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ALL_CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{capitalizeWords(c)}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 cursor-pointer ${catColor}`}
                                  onClick={() => startEdit(item.id, 'category', cat)}
                                  data-testid={`badge-category-${item.id}`}
                                >
                                  <CatIcon className="h-3 w-3 mr-1" />
                                  {capitalizeWords(cat)}
                                </Badge>
                              )}
                            </td>
                            {hasPrices && (
                              <td className="px-2 py-1.5">
                                <Select
                                  value={itemTier}
                                  onValueChange={(val) => {
                                    const newTier = val === currentTier ? null : val;
                                    changeItemTier.mutate({ id: item.id, tier: newTier });
                                  }}
                                >
                                  <SelectTrigger
                                    className={`h-7 w-[80px] text-xs ${isOverridden ? 'border-amber-400' : ''}`}
                                    data-testid={`select-item-tier-${item.id}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(TIER_LABELS).map(([key, { label, icon: TIcon }]) => (
                                      <SelectItem key={key} value={key}>
                                        <span className="flex items-center gap-1">
                                          <TIcon className="h-3 w-3" />
                                          {label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            )}
                            <td className="px-2 py-1.5 text-center">
                              {sources.length > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="gap-1 text-xs h-7 px-2"
                                      data-testid={`button-meal-source-${item.id}`}
                                    >
                                      <UtensilsCrossed className="h-3 w-3" />
                                      {sources.length}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-[220px]">
                                    <p className="text-xs font-medium mb-1">Used in:</p>
                                    {sources.map((s, idx) => (
                                      <p key={idx} className="text-xs text-muted-foreground">
                                        {s.mealName}{s.quantityMultiplier > 1 ? ` (x${s.quantityMultiplier})` : ''}
                                      </p>
                                    ))}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                            {hasPrices && (() => {
                              const selectedStore = item.selectedStore || cheapest?.supermarket || '';
                              const selectedMatch = selectedStore ? itemPrices?.get(selectedStore) : null;
                              const selectedPrice = selectedMatch?.price;
                              const isBestPrice = cheapest && selectedStore === cheapest.supermarket;
                              return (
                                <>
                                  <td className="px-2 py-1.5 text-right tabular-nums" data-testid={`text-price-${item.id}`}>
                                    {selectedPrice !== null && selectedPrice !== undefined ? (
                                      <span
                                        className={`cursor-pointer ${isBestPrice ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-foreground'}`}
                                        onClick={() => setComparisonItem(item)}
                                      >
                                        {"\u00A3"}{selectedPrice.toFixed(2)}
                                      </span>
                                    ) : item.selectedStore && !selectedMatch ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-amber-500 cursor-pointer inline-flex items-center gap-0.5" onClick={() => setComparisonItem(item)}>
                                            <AlertTriangle className="h-3 w-3" />
                                            <span className="text-[10px]">N/A</span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">Not available at {item.selectedStore}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span className="text-muted-foreground cursor-pointer" onClick={() => setComparisonItem(item)}>-</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {(() => {
                                      const availableStores = SUPERMARKET_NAMES.filter(store => itemPrices?.has(store));
                                      const knownStores: string[] = (() => {
                                        try {
                                          return item.availableStores ? JSON.parse(item.availableStores) : [];
                                        } catch { return []; }
                                      })();
                                      const isBranded = !!item.matchedProductId;
                                      return (
                                        <div className="flex items-center gap-1">
                                          <Select
                                            value={item.selectedStore || 'auto'}
                                            onValueChange={(val) => {
                                              updateItem.mutate({ id: item.id, fields: { selectedStore: val === 'auto' ? null : val } });
                                              setGlobalStore('auto');
                                            }}
                                          >
                                            <SelectTrigger className={`h-7 w-[100px] text-xs ${item.selectedStore ? 'border-amber-400' : ''}`} data-testid={`select-store-${item.id}`}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="auto">
                                                <span className="flex items-center gap-1">
                                                  <TrendingDown className="h-3 w-3" />
                                                  {isBranded ? 'Choose store' : 'Auto'}
                                                </span>
                                              </SelectItem>
                                              {availableStores.map(store => {
                                                const storeMatch = itemPrices?.get(store);
                                                const isKnownStock = knownStores.includes(store);
                                                return (
                                                  <SelectItem key={store} value={store}>
                                                    <span className="flex items-center gap-1">
                                                      {isBranded && isKnownStock && <Check className="h-3 w-3 text-green-500 flex-shrink-0" />}
                                                      {store}
                                                      {storeMatch?.price ? ` \u00A3${storeMatch.price.toFixed(2)}` : ''}
                                                      {isBranded && isKnownStock && <span className="text-[9px] text-green-600 dark:text-green-400">Stocked</span>}
                                                    </span>
                                                  </SelectItem>
                                                );
                                              })}
                                              {availableStores.length === 0 && (
                                                <SelectItem value="_none" disabled>
                                                  <span className="text-muted-foreground">No stores matched</span>
                                                </SelectItem>
                                              )}
                                            </SelectContent>
                                          </Select>
                                          {isBranded && item.selectedStore && (() => {
                                            const storeMatch = itemPrices?.get(item.selectedStore);
                                            return storeMatch?.productUrl ? (
                                              <a href={storeMatch.productUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-store-link-${item.id}`}>
                                                  <ExternalLink className="h-3 w-3" />
                                                </Button>
                                              </a>
                                            ) : null;
                                          })()}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs gap-1 text-muted-foreground"
                                            onClick={() => setAnalyseItem(item)}
                                            data-testid={`button-change-product-${item.id}`}
                                          >
                                            <Microscope className="h-3 w-3" />
                                            Change
                                          </Button>
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-2 py-1.5 text-center" data-testid={`text-smp-${item.id}`}>
                                    {(() => {
                                      const smp = getItemSmpRating(item.id, item);
                                      if (smp === 0) return <span className="text-muted-foreground text-xs">-</span>;
                                      return <AppleRating rating={smp} size="small" hasCape={smp === 5} />;
                                    })()}
                                  </td>
                                </>
                              );
                            })()}
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setAnalyseItem(item)}
                                  className="text-muted-foreground"
                                  data-testid={`button-analyse-${item.id}`}
                                >
                                  <Microscope className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEdit(item.id, 'productName', item.productName)}
                                  className="text-muted-foreground"
                                  data-testid={`button-edit-${item.id}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem.mutate(item.id)}
                                  className="text-muted-foreground"
                                  data-testid={`button-remove-${item.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {!hasPrices && savedItems.length > 0 && !lookupPrices.isPending && (
            <div className="border-t border-border p-4 bg-muted/10 text-center">
              <p className="text-sm text-muted-foreground">
                Click "Match Products" to find real grocery products and compare prices across supermarkets.
              </p>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!comparisonItem} onOpenChange={(open) => { if (!open) setComparisonItem(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" data-testid="dialog-price-comparison">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Price Comparison: {comparisonItem ? capitalizeWords(comparisonItem.productName) : ''}
            </DialogTitle>
          </DialogHeader>

          {comparisonItem && (
            <div className="space-y-6">
              {SUPERMARKET_NAMES.map(store => {
                const storeMatches = comparisonMatches.filter(m => m.supermarket === store);
                if (storeMatches.length === 0) return null;
                return (
                  <div key={store}>
                    <h3 className="font-semibold text-base mb-3 border-b border-border pb-2">{store}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {storeMatches.map((match, idx) => {
                        const mTierInfo = TIER_LABELS[match.tier] || TIER_LABELS.standard;
                        const TierIcon = mTierInfo.icon;
                        const itemTier = comparisonItem ? getItemTier(comparisonItem) : currentTier;

                        return (
                          <Card key={idx} className={`${match.tier === itemTier ? 'border-primary' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                {match.imageUrl && (
                                  <img
                                    src={match.imageUrl}
                                    alt={match.productName}
                                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" data-testid={`comparison-product-${idx}`}>
                                    {match.productName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-[10px]">
                                      <TierIcon className="h-3 w-3 mr-1" />
                                      {mTierInfo.label}
                                    </Badge>
                                    {match.productWeight && (
                                      <span className="text-xs text-muted-foreground">{match.productWeight}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className={`text-lg font-bold tabular-nums ${match.tier === itemTier ? 'text-primary' : 'text-foreground'}`}>
                                      {match.price !== null ? `\u00A3${match.price.toFixed(2)}` : '-'}
                                    </span>
                                    {match.pricePerUnit && (
                                      <span className="text-xs text-muted-foreground">{match.pricePerUnit}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {match.productUrl && (
                                      <a
                                        href={match.productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary inline-flex items-center gap-1"
                                      >
                                        View on {store}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    {match.tier !== itemTier && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-6 px-2"
                                        onClick={() => {
                                          changeItemTier.mutate({ id: comparisonItem.id, tier: match.tier === currentTier ? null : match.tier });
                                        }}
                                        data-testid={`button-select-tier-${match.tier}-${idx}`}
                                      >
                                        Select this tier
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={basketDialogOpen} onOpenChange={(open) => { setBasketDialogOpen(open); if (!open) setBasketResult(null); }}>
        <DialogContent className="sm:max-w-[560px]" data-testid="dialog-send-to-supermarket">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Send to Supermarket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Send your {savedItems.length} items to a supermarket. Matched products open directly; others open as search pages.
            </p>

            {primarySupermarkets.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direct Basket</p>
                <div className="grid grid-cols-3 gap-3">
                  {primarySupermarkets.map(store => (
                    <Button
                      key={store.key}
                      variant="outline"
                      className="flex flex-col items-center gap-1.5 py-3"
                      disabled={basketSending !== null}
                      onClick={() => handleSendBasket(store.name)}
                      data-testid={`button-basket-${store.key}`}
                    >
                      {basketSending === store.name ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span
                          className="flex items-center justify-center h-8 w-8 rounded-md text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: store.color }}
                        >
                          {store.name.charAt(0)}
                        </span>
                      )}
                      <span className="text-xs font-medium">{store.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {otherSupermarkets.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search Pages</p>
                <div className="grid grid-cols-3 gap-2">
                  {otherSupermarkets.map(store => (
                    <Button
                      key={store.key}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 justify-start"
                      disabled={basketSending !== null}
                      onClick={() => handleSendBasket(store.name)}
                      data-testid={`button-basket-${store.key}`}
                    >
                      {basketSending === store.name ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span
                          className="flex items-center justify-center h-4 w-4 rounded-sm text-white text-[8px] font-bold shrink-0"
                          style={{ backgroundColor: store.color }}
                        >
                          {store.name.charAt(0)}
                        </span>
                      )}
                      <span className="text-xs truncate">{store.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {basketResult && (
              <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{basketResult.supermarket} Basket</span>
                  {basketResult.estimatedTotal && (
                    <Badge variant="secondary" className="text-xs">
                      Est. total: {basketResult.estimatedTotal.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{basketResult.message}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{basketResult.matchedCount} product links</span>
                  <span className="text-muted-foreground">{basketResult.totalCount - basketResult.matchedCount} search pages</span>
                </div>
                {basketResult.itemUrls.length > 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 w-full"
                    onClick={() => {
                      const remaining = basketResult.itemUrls.slice(8);
                      for (const item of remaining) {
                        window.open(item.url, '_blank');
                      }
                      toast({ title: "Opened remaining items", description: `Opened ${remaining.length} more product pages.` });
                    }}
                    data-testid="button-open-remaining-items"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open remaining {basketResult.itemUrls.length - 8} items
                  </Button>
                )}
              </div>
            )}

            <div className="border-t border-border pt-3 flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Want a text file instead?{' '}
                <button
                  className="text-primary underline-offset-2 underline"
                  onClick={() => { setBasketDialogOpen(false); setExportDialogOpen(true); }}
                  data-testid="link-export-text-from-basket"
                >
                  Download formatted list
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[420px]" data-testid="dialog-export-list">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Export Basket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Choose Supermarket</label>
              <Select value={exportSupermarket} onValueChange={setExportSupermarket}>
                <SelectTrigger data-testid="select-export-supermarket">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPERMARKET_NAMES.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Export your {savedItems.length} items as a formatted text file, or open product search pages directly.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleExport('list')} className="gap-1" data-testid="button-export-text">
              <Download className="h-4 w-4" />
              Download List
            </Button>
            <Button onClick={() => handleExport('links')} className="gap-1" data-testid="button-export-links">
              <ExternalLink className="h-4 w-4" />
              Open Search Pages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {analyseItem && (
        <ProductAnalyseModal
          open={!!analyseItem}
          onOpenChange={(v) => { if (!v) setAnalyseItem(null); }}
          item={analyseItem}
        />
      )}
    </div>
  );
}
