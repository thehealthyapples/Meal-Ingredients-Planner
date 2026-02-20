import { useState, useMemo, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useMeals } from "@/hooks/use-meals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Loader2, ShoppingCart, Package, AlertTriangle, Heart,
  Leaf, ArrowRight, X, ChevronDown, ChevronUp, Shield,
  Scale, Beaker, Star, TrendingUp, Filter, Info, Layers,
  Plus, Minus, Save, RefreshCw, UtensilsCrossed, ScanLine, Flame,
  Settings2, Volume2, VolumeX, Award, Zap, History, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import AppleRating from "@/components/AppleRating";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import HealthTrendChart from "@/components/HealthTrendChart";

interface ParsedIngredient {
  name: string;
  percent: number | null;
  isUPF: boolean;
  isENumber: boolean;
}

interface ProductAnalysis {
  ingredients: ParsedIngredient[];
  novaGroup: number;
  healthScore: number;
  isUltraProcessed: boolean;
  warnings: string[];
  upfCount: number;
  totalIngredients: number;
}

interface AdditiveMatchInfo {
  name: string;
  type: string;
  riskLevel: string;
  description: string | null;
  foundIn: string;
}

interface UPFAnalysisInfo {
  upfScore: number;
  smpRating: number;
  hasCape: boolean;
  smpScore: number;
  additiveMatches: AdditiveMatchInfo[];
  processingIndicators: string[];
  ingredientCount: number;
  upfIngredientCount: number;
  riskBreakdown: {
    additiveRisk: number;
    processingRisk: number;
    ingredientComplexityRisk: number;
  };
  smpPenalties?: {
    nova: number;
    highRiskAdditives: number;
    emulsifiers: number;
    acidityRegulators: number;
    bovaerRisk: number;
  };
  smpBonuses?: {
    organic: number;
    superfoods: number;
    simplicity: number;
  };
}

const BOVAER_KEYWORDS = ['dairy', 'milk', 'cheese', 'yoghurt', 'yogurt', 'cream', 'butter', 'beef', 'meat', 'steak', 'mince', 'burger'];

function isBovaerRiskProduct(product: ProductResult): boolean {
  const name = (product.product_name || '').toLowerCase();
  const cats = (product.categories_tags || []).map(c => c.toLowerCase());
  const allText = [name, ...cats].join(' ');
  return BOVAER_KEYWORDS.some(kw => allText.includes(kw));
}

interface ProductResult {
  barcode: string | null;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  nova_group: number | null;
  nutriscore_grade: string | null;
  categories_tags: string[];
  isUK?: boolean;
  nutriments: {
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    sugar: string | null;
    salt: string | null;
  } | null;
  nutriments_raw: Record<string, any> | null;
  analysis: ProductAnalysis | null;
  upfAnalysis: UPFAnalysisInfo | null;
}

const NOVA_CONFIG: Record<number, { label: string; color: string; bg: string; description: string }> = {
  1: { label: 'Whole Food', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30', description: 'Unprocessed or minimally processed' },
  2: { label: 'Processed Ingredient', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/30', description: 'Processed culinary ingredient' },
  3: { label: 'Processed Food', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/30', description: 'Processed food product' },
  4: { label: 'Ultra-Processed', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30', description: 'Ultra-processed food product' },
};

function NovaGroupBadge({ group, size = 'default' }: { group: number; size?: 'default' | 'lg' }) {
  const config = NOVA_CONFIG[group] || NOVA_CONFIG[4];
  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.color} border-0 ${size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs'}`}
      data-testid={`badge-nova-${group}`}
    >
      {size === 'lg' && <Shield className="h-3.5 w-3.5 mr-1" />}
      NOVA {group} - {config.label}
    </Badge>
  );
}


function HealthScoreCircle({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = 'text-red-500';
  if (score >= 70) color = 'text-green-500';
  else if (score >= 50) color = 'text-yellow-500';
  else if (score >= 30) color = 'text-orange-500';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} data-testid="health-score-circle">
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className={`absolute text-xs font-bold ${color}`} data-testid="text-health-score">
        {score}
      </span>
    </div>
  );
}

function UPFScoreBar({ score }: { score: number }) {
  let color = 'bg-green-500';
  if (score >= 60) color = 'bg-red-500';
  else if (score >= 40) color = 'bg-orange-500';
  else if (score >= 20) color = 'bg-yellow-500';

  return (
    <div className="space-y-1" data-testid="upf-score-bar">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">UPF Score</span>
        <span className="text-xs font-semibold">{score}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function AdditivesList({ additives }: { additives: AdditiveMatchInfo[] }) {
  if (additives.length === 0) return null;

  const riskColors: Record<string, string> = {
    high: 'border-red-300 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    moderate: 'border-yellow-300 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-green-300 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  };

  return (
    <div className="space-y-1.5" data-testid="additives-list">
      {additives.map((a, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 text-xs p-2 rounded-md border ${riskColors[a.riskLevel] || riskColors.low}`}
          data-testid={`additive-item-${i}`}
        >
          <Beaker className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold">{a.name}</span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-current">{a.type}</Badge>
              <Badge variant="outline" className="text-[9px] py-0 px-1 border-current">{a.riskLevel} risk</Badge>
            </div>
            {a.description && (
              <p className="text-[11px] opacity-80 mt-0.5 leading-tight">{a.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function IngredientsList({ ingredients }: { ingredients: ParsedIngredient[] }) {
  return (
    <div className="space-y-1" data-testid="ingredients-list">
      {ingredients.map((ing, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-2 text-sm px-2 py-1 rounded-md ${
            ing.isUPF
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'text-foreground'
          }`}
          data-testid={`ingredient-item-${idx}`}
        >
          {ing.isUPF && <AlertTriangle className="h-3 w-3 flex-shrink-0 text-red-500" />}
          <span className={ing.isUPF ? 'font-medium' : ''}>
            {ing.name}
          </span>
          {ing.percent !== null && (
            <span className="text-muted-foreground text-xs ml-auto">{ing.percent}%</span>
          )}
          {ing.isENumber && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 border-red-300 text-red-600 dark:text-red-400">E-number</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function NutritionPanel({ nutriments }: { nutriments: ProductResult['nutriments'] }) {
  if (!nutriments) return null;
  const items = [
    { label: 'Calories', value: nutriments.calories },
    { label: 'Protein', value: nutriments.protein },
    { label: 'Carbs', value: nutriments.carbs },
    { label: 'Fat', value: nutriments.fat },
    { label: 'Sugar', value: nutriments.sugar },
    { label: 'Salt', value: nutriments.salt },
  ].filter(item => item.value);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2" data-testid="nutrition-panel">
      {items.map(item => (
        <div key={item.label} className="text-center p-2 bg-muted/30 rounded-md">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function RiskBreakdownPanel({ breakdown }: { breakdown: UPFAnalysisInfo['riskBreakdown'] }) {
  const segments = [
    { label: 'Additives', value: breakdown.additiveRisk, max: 40, color: 'bg-red-500' },
    { label: 'Processing', value: breakdown.processingRisk, max: 30, color: 'bg-orange-500' },
    { label: 'Complexity', value: breakdown.ingredientComplexityRisk, max: 10, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-2" data-testid="risk-breakdown">
      {segments.map(seg => (
        <div key={seg.label} className="space-y-0.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium">{seg.value}/{seg.max}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${seg.color}`}
              style={{ width: `${(seg.value / seg.max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { meals } = useMeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [compareProducts, setCompareProducts] = useState<ProductResult[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [alternativesFor, setAlternativesFor] = useState<ProductResult | null>(null);
  const [alternatives, setAlternatives] = useState<ProductResult[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hideUltraProcessed, setHideUltraProcessed] = useState(false);
  const [hideHighRiskAdditives, setHideHighRiskAdditives] = useState(false);
  const [hideEmulsifiers, setHideEmulsifiers] = useState(false);
  const [hideAcidityRegulators, setHideAcidityRegulators] = useState(false);
  const [hideBovaer, setHideBovaer] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [mealCounts, setMealCounts] = useState<Record<number, number>>({});
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);

  const { data: intelligenceSettings } = useQuery<{
    soundEnabled: boolean;
    eliteTrackingEnabled: boolean;
    healthTrendEnabled: boolean;
    barcodeScannerEnabled: boolean;
  }>({
    queryKey: ["/api/user/intelligence-settings"],
  });

  const { data: streakData } = useQuery<{
    currentEliteStreak: number;
    bestEliteStreak: number;
    weeklyEliteCount: number;
    lastEliteDate: string | null;
  }>({
    queryKey: ["/api/user/streak"],
    enabled: intelligenceSettings?.eliteTrackingEnabled !== false,
  });

  const soundEnabled = intelligenceSettings?.soundEnabled !== false;
  const { playSound } = useSoundEffects({ enabled: soundEnabled });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<{ soundEnabled: boolean; eliteTrackingEnabled: boolean; healthTrendEnabled: boolean; barcodeScannerEnabled: boolean }>) => {
      const res = await fetch("/api/user/intelligence-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/intelligence-settings"] });
    },
  });

  const recordStreakMutation = useMutation({
    mutationFn: async (smpRating: number) => {
      const res = await fetch("/api/user/streak/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smpRating }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/health-trends"] });
    },
  });

  const { data: productHistoryData } = useQuery<Array<{
    id: number;
    barcode: string | null;
    productName: string;
    brand: string | null;
    imageUrl: string | null;
    novaGroup: number | null;
    nutriscoreGrade: string | null;
    smpRating: number | null;
    upfScore: number | null;
    healthScore: number | null;
    scannedAt: string;
    source: string;
  }>>({
    queryKey: ["/api/user/product-history"],
  });

  const saveToHistoryMutation = useMutation({
    mutationFn: async (data: { product: ProductResult; source: string }) => {
      const { product, source } = data;
      return apiRequest("POST", "/api/user/product-history", {
        barcode: product.barcode || null,
        productName: product.product_name,
        brand: product.brand || null,
        imageUrl: product.image_url || null,
        novaGroup: product.nova_group || product.analysis?.novaGroup || null,
        nutriscoreGrade: product.nutriscore_grade || null,
        smpRating: product.upfAnalysis?.smpRating || null,
        upfScore: product.upfAnalysis?.upfScore || null,
        healthScore: product.analysis?.healthScore || null,
        source,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/product-history"] });
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/user/product-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/product-history"] });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/user/product-history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/product-history"] });
    },
  });

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setShowBarcodeScanner(false);
    setBarcodeLoading(true);
    try {
      const res = await fetch(`/api/products/barcode/${barcode}`, { credentials: "include" });
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      if (data.product) {
        setSearchResults([data.product]);
        setSelectedProduct(data.product);
        setHasSearched(true);
        setSearchQuery(data.product.product_name || barcode);

        saveToHistoryMutation.mutate({ product: data.product, source: "barcode" });

        if (data.product.upfAnalysis?.smpRating) {
          playSound(data.product.upfAnalysis.smpRating);
          if (intelligenceSettings?.eliteTrackingEnabled !== false) {
            recordStreakMutation.mutate(data.product.upfAnalysis.smpRating);
          }
        }

        toast({ title: "Product Found", description: data.product.product_name });
      } else {
        toast({ title: "Not Found", description: `No product found for barcode ${barcode}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Scan Error", description: "Could not look up this barcode.", variant: "destructive" });
    } finally {
      setBarcodeLoading(false);
    }
  }, [playSound, intelligenceSettings, toast]);

  const handleProductSelect = (product: ProductResult) => {
    setSelectedProduct(product);
    saveToHistoryMutation.mutate({ product, source: "search" });
    if (product.upfAnalysis?.smpRating && soundEnabled) {
      playSound(product.upfAnalysis.smpRating);
    }
    if (product.upfAnalysis?.smpRating && intelligenceSettings?.eliteTrackingEnabled !== false) {
      recordStreakMutation.mutate(product.upfAnalysis.smpRating);
    }
  };

  const selectedMealIds = useMemo(() => {
    return Object.keys(mealCounts).map(Number).filter(id => mealCounts[id] > 0);
  }, [mealCounts]);

  const totalSelectedMeals = useMemo(() => {
    return Object.values(mealCounts).reduce((sum, c) => sum + c, 0);
  }, [mealCounts]);

  const previewList = useMemo(() => {
    if (!meals) return [];
    const allIngredients: string[] = [];
    for (const [mealId, count] of Object.entries(mealCounts)) {
      const meal = meals.find(m => m.id === Number(mealId));
      if (meal && count > 0) {
        for (let i = 0; i < count; i++) {
          allIngredients.push(...meal.ingredients);
        }
      }
    }
    return Array.from(new Set(allIngredients.map(i => i.toLowerCase().trim())))
      .map(key => allIngredients.find(i => i.toLowerCase().trim() === key) || key)
      .sort();
  }, [meals, mealCounts]);

  const setMealCount = (mealId: number, delta: number) => {
    setMealCounts(prev => {
      const current = prev[mealId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[mealId];
      } else {
        updated[mealId] = next;
      }
      return updated;
    });
  };

  const toggleMeal = (mealId: number) => {
    setMealCounts(prev => {
      if (prev[mealId] && prev[mealId] > 0) {
        const updated = { ...prev };
        delete updated[mealId];
        return updated;
      }
      return { ...prev, [mealId]: 1 };
    });
  };

  const saveToBasket = useMutation({
    mutationFn: async (selections: { mealId: number; count: number }[]) => {
      const res = await fetch(api.shoppingList.generateFromMeals.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealSelections: selections }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.prices.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.totalCost.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.sources.path] });
      setMealCounts({});
      toast({ title: "Added to basket", description: "Ingredients consolidated and added to your basket." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add to basket.", variant: "destructive" });
    },
  });

  const handleSaveMeals = () => {
    const selections = Object.entries(mealCounts)
      .filter(([_, count]) => count > 0)
      .map(([mealId, count]) => ({ mealId: Number(mealId), count }));
    if (selections.length > 0) {
      saveToBasket.mutate(selections);
    }
  };

  const deduplicatedResults = searchResults.filter((product, index, arr) => {
    if (product.barcode) {
      return arr.findIndex(p => p.barcode === product.barcode) === index;
    }
    const nameKey = product.product_name.toLowerCase().trim();
    const brandKey = (product.brand || '').toLowerCase().trim();
    return arr.findIndex(p =>
      p.product_name.toLowerCase().trim() === nameKey &&
      (p.brand || '').toLowerCase().trim() === brandKey
    ) === index;
  });

  const filteredResults = deduplicatedResults.filter(p => {
    if (hideUltraProcessed && p.analysis?.isUltraProcessed) return false;
    if (hideHighRiskAdditives && p.upfAnalysis?.additiveMatches.some(a => a.riskLevel === 'high')) return false;
    if (hideEmulsifiers && p.upfAnalysis?.additiveMatches.some(a => a.type === 'emulsifier')) return false;
    if (hideAcidityRegulators && p.upfAnalysis?.additiveMatches.some(a => a.type === 'acidity regulator' || a.type === 'acidity_regulator')) return false;
    if (hideBovaer && isBovaerRiskProduct(p)) return false;
    if (minRating > 0 && (p.upfAnalysis?.smpRating ?? 0) < minRating) return false;
    return true;
  });

  const addToList = useMutation({
    mutationFn: async (product: ProductResult) => {
      const res = await fetch(api.shoppingList.add.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productName: product.product_name,
          imageUrl: product.image_url,
          quantity: 1,
          brand: product.brand,
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added", description: "Product added to your basket." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add product.", variant: "destructive" });
    },
  });

  const linkToTemplate = useMutation({
    mutationFn: async (product: ProductResult) => {
      const templateName = product.product_name.replace(/\s*\d+g$/i, '').trim();
      const createRes = await apiRequest('POST', '/api/meal-templates', { name: templateName, category: 'dinner' });
      const template = await createRes.json();

      await apiRequest('POST', `/api/meal-templates/${template.id}/products`, {
        productName: product.product_name,
        brand: product.brand || null,
        store: null,
        qualityTier: 'standard',
        estimatedPrice: null,
        upfScore: product.upfAnalysis?.upfScore || null,
        imageUrl: product.image_url || null,
        barcode: product.barcode || null,
      });
      return template;
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meal-templates'] });
      toast({ title: "Template Created", description: `"${template.name}" template created with this product as a ready meal option.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create meal template.", variant: "destructive" });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedProduct(null);
    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(searchQuery.trim())}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.products || []);
      setHasSearched(true);
    } catch {
      toast({ title: "Search Error", description: "Could not search products.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const fetchAlternatives = async (product: ProductResult) => {
    setAlternativesFor(product);
    setLoadingAlternatives(true);
    setAlternatives([]);
    try {
      const nameWords = product.product_name.split(' ').slice(0, 3).join(' ');
      const res = await fetch(`/api/product-alternatives?q=${encodeURIComponent(nameWords)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const filtered = (data.alternatives || []).filter((a: ProductResult) =>
        a.barcode !== product.barcode
      );
      setAlternatives(filtered);
    } catch {
      toast({ title: "Error", description: "Could not find alternatives.", variant: "destructive" });
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const toggleCompare = (product: ProductResult) => {
    setCompareProducts(prev => {
      const exists = prev.find(p => p.barcode === product.barcode);
      if (exists) return prev.filter(p => p.barcode !== product.barcode);
      if (prev.length >= 3) {
        toast({ title: "Limit reached", description: "You can compare up to 3 products." });
        return prev;
      }
      return [...prev, product];
    });
  };

  const isInCompare = (product: ProductResult) =>
    compareProducts.some(p => p.barcode === product.barcode);

  const activeFilterCount = [hideUltraProcessed, hideHighRiskAdditives, hideEmulsifiers, hideAcidityRegulators, hideBovaer, minRating > 0].filter(Boolean).length;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight" data-testid="text-products-title">Product Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">Search packaged foods, detect ultra-processed ingredients, and find healthier alternatives</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={showMealSelector ? 'default' : 'outline'}
              onClick={() => setShowMealSelector(!showMealSelector)}
              className="gap-2"
              data-testid="button-toggle-meal-selector"
            >
              <UtensilsCrossed className="h-4 w-4" />
              Select Meals
              {totalSelectedMeals > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">{totalSelectedMeals}</Badge>
              )}
            </Button>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">{activeFilterCount}</Badge>
              )}
            </Button>
            <Button
              variant={showIntelligence ? 'default' : 'outline'}
              onClick={() => setShowIntelligence(!showIntelligence)}
              className="gap-2"
              data-testid="button-toggle-intelligence"
            >
              <Settings2 className="h-4 w-4" />
              Intelligence
            </Button>
            {compareProducts.length > 0 && (
              <Button
                onClick={() => setShowCompare(true)}
                className="gap-2"
                data-testid="button-open-compare"
              >
                <Scale className="h-4 w-4" />
                Compare ({compareProducts.length})
              </Button>
            )}
          </div>
        </div>

        <Card data-testid="card-product-search">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                placeholder="Search packaged foods (e.g. ketchup, mayonnaise, cereal...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-product-search"
              />
              {intelligenceSettings?.barcodeScannerEnabled !== false && (
                <Button
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(true)}
                  disabled={barcodeLoading}
                  data-testid="button-barcode-scan"
                >
                  {barcodeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                  Scan
                </Button>
              )}
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                data-testid="button-search-products"
              >
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Analyse
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card data-testid="card-filters">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="hide-upf" className="text-sm cursor-pointer">Hide ultra-processed</Label>
                      <Switch
                        id="hide-upf"
                        checked={hideUltraProcessed}
                        onCheckedChange={setHideUltraProcessed}
                        data-testid="switch-hide-upf"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="hide-additives" className="text-sm cursor-pointer">Hide high-risk additives</Label>
                      <Switch
                        id="hide-additives"
                        checked={hideHighRiskAdditives}
                        onCheckedChange={setHideHighRiskAdditives}
                        data-testid="switch-hide-additives"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="hide-emulsifiers" className="text-sm cursor-pointer">Hide emulsifiers</Label>
                      <Switch
                        id="hide-emulsifiers"
                        checked={hideEmulsifiers}
                        onCheckedChange={setHideEmulsifiers}
                        data-testid="switch-hide-emulsifiers"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="hide-acidity-regulators" className="text-sm cursor-pointer">Hide acidity regulators</Label>
                      <Switch
                        id="hide-acidity-regulators"
                        checked={hideAcidityRegulators}
                        onCheckedChange={setHideAcidityRegulators}
                        data-testid="switch-hide-acidity-regulators"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="hide-bovaer" className="text-sm cursor-pointer">Exclude Bovaer-risk (dairy/meat)</Label>
                      <Switch
                        id="hide-bovaer"
                        checked={hideBovaer}
                        onCheckedChange={setHideBovaer}
                        data-testid="switch-hide-bovaer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Minimum SMP Rating</Label>
                      <div className="flex items-center gap-2">
                        {[0, 1, 2, 3, 4, 5].map(r => (
                          <Button
                            key={r}
                            size="sm"
                            variant={minRating === r ? 'default' : 'outline'}
                            onClick={() => setMinRating(r)}
                            data-testid={`button-min-rating-${r}`}
                          >
                            {r === 0 ? 'All' : r}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {activeFilterCount > 0 && searchResults.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Showing {filteredResults.length} of {searchResults.length} products
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showIntelligence && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card data-testid="card-intelligence-settings">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Intelligence Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="toggle-sound" className="text-sm cursor-pointer flex items-center gap-2">
                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        Sound Effects
                      </Label>
                      <Switch
                        id="toggle-sound"
                        checked={intelligenceSettings?.soundEnabled !== false}
                        onCheckedChange={(v) => updateSettingsMutation.mutate({ soundEnabled: v })}
                        data-testid="switch-sound-enabled"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="toggle-streak" className="text-sm cursor-pointer flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        Elite Streak Tracking
                      </Label>
                      <Switch
                        id="toggle-streak"
                        checked={intelligenceSettings?.eliteTrackingEnabled !== false}
                        onCheckedChange={(v) => updateSettingsMutation.mutate({ eliteTrackingEnabled: v })}
                        data-testid="switch-streak-enabled"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="toggle-trends" className="text-sm cursor-pointer flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Health Score Trends
                      </Label>
                      <Switch
                        id="toggle-trends"
                        checked={intelligenceSettings?.healthTrendEnabled !== false}
                        onCheckedChange={(v) => updateSettingsMutation.mutate({ healthTrendEnabled: v })}
                        data-testid="switch-trends-enabled"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="toggle-barcode" className="text-sm cursor-pointer flex items-center gap-2">
                        <ScanLine className="h-4 w-4" />
                        Barcode Scanner
                      </Label>
                      <Switch
                        id="toggle-barcode"
                        checked={intelligenceSettings?.barcodeScannerEnabled !== false}
                        onCheckedChange={(v) => updateSettingsMutation.mutate({ barcodeScannerEnabled: v })}
                        data-testid="switch-barcode-enabled"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {intelligenceSettings?.eliteTrackingEnabled !== false && streakData && (streakData.currentEliteStreak > 0 || streakData.weeklyEliteCount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card data-testid="card-streak-current">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Elite Streak</p>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-current-streak">{streakData.currentEliteStreak} day{streakData.currentEliteStreak !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-streak-best">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-best-streak">{streakData.bestEliteStreak} day{streakData.bestEliteStreak !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-streak-weekly">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-weekly-elite">{streakData.weeklyEliteCount} elite pick{streakData.weeklyEliteCount !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <AnimatePresence>
          {showMealSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card data-testid="card-meal-selector">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg" data-testid="text-selected-count">
                      Select Meals ({totalSelectedMeals})
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedMealIds.length > 0 && (
                        <>
                          <Button
                            className="gap-2"
                            size="sm"
                            onClick={handleSaveMeals}
                            disabled={saveToBasket.isPending}
                            data-testid="button-save-to-basket"
                          >
                            {saveToBasket.isPending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Add to Basket
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setMealCounts({})} data-testid="button-clear-selection">
                            Clear
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedMealIds.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-preview-count">
                      {previewList.length} unique ingredients from {totalSelectedMeals} meal servings
                    </p>
                  )}
                </CardHeader>
                <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                  {meals?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No meals available. Go create some!
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {meals?.map((meal) => {
                        const count = mealCounts[meal.id] || 0;
                        const isSelected = count > 0;
                        return (
                          <div
                            key={meal.id}
                            className={`px-4 py-3 flex items-center gap-3 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                            data-testid={`meal-select-${meal.id}`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleMeal(meal.id)}
                              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleMeal(meal.id)}>
                              {meal.imageUrl && (
                                <img
                                  src={meal.imageUrl}
                                  alt={meal.name}
                                  className="w-8 h-8 rounded-md object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  {meal.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {meal.ingredients.length} ingredients
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setMealCount(meal.id, -1)}
                                disabled={count === 0}
                                data-testid={`button-meal-minus-${meal.id}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium tabular-nums" data-testid={`text-meal-count-${meal.id}`}>
                                {count}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setMealCount(meal.id, 1)}
                                data-testid={`button-meal-plus-${meal.id}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {intelligenceSettings?.healthTrendEnabled !== false && (
          <HealthTrendChart />
        )}

        {hasSearched && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No products found for "{searchQuery}"</p>
            <p className="text-sm mt-1">Try a different search term like "ketchup" or "cereal"</p>
          </div>
        )}

        {hasSearched && filteredResults.length === 0 && searchResults.length > 0 && !isSearching && (
          <div className="text-center py-12 text-muted-foreground">
            <Filter className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">All products filtered out</p>
            <p className="text-sm mt-1">Try adjusting your filters to see more results</p>
          </div>
        )}

        {!hasSearched && productHistoryData && productHistoryData.length > 0 && (
          <Card data-testid="card-product-history">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Recently Analysed
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                data-testid="button-clear-history"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {productHistoryData.map((item) => {
                  const novaConfig = item.novaGroup ? NOVA_CONFIG[item.novaGroup] : null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate cursor-pointer group relative"
                      onClick={() => {
                        setSearchQuery(item.productName);
                        setHasSearched(true);
                        setIsSearching(true);
                        fetch(`/api/search-products?q=${encodeURIComponent(item.productName)}`, { credentials: 'include' })
                          .then(r => r.json())
                          .then(data => {
                            setSearchResults(data.products || []);
                            const match = (data.products || []).find((p: ProductResult) => p.barcode === item.barcode);
                            if (match) setSelectedProduct(match);
                          })
                          .finally(() => setIsSearching(false));
                      }}
                      data-testid={`history-item-${item.id}`}
                    >
                      {item.imageUrl ? (
                        <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      ) : (
                        <div className="w-12 h-12 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`history-name-${item.id}`}>{item.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.brand && (
                            <span className="text-xs text-muted-foreground truncate">{item.brand}</span>
                          )}
                          {item.smpRating !== null && (
                            <AppleRating rating={item.smpRating} size="small" />
                          )}
                          {novaConfig && (
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${novaConfig.bg} ${novaConfig.color}`}>
                              NOVA {item.novaGroup}
                            </Badge>
                          )}
                          {item.source === "barcode" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              <ScanLine className="h-2.5 w-2.5 mr-0.5" />
                              Scanned
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(item.scannedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 invisible group-hover:visible flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryMutation.mutate(item.id);
                        }}
                        data-testid={`button-delete-history-${item.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {filteredResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredResults.map((product, index) => {
                    const nova = product.nova_group || product.analysis?.novaGroup;
                    return (
                      <motion.div
                        key={product.barcode || index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        layout
                      >
                        <Card
                          className={`overflow-visible h-full flex flex-col cursor-pointer transition-colors ${
                            selectedProduct?.barcode === product.barcode
                              ? 'ring-2 ring-primary'
                              : ''
                          }`}
                          onClick={() => handleProductSelect(product)}
                          data-testid={`card-product-${product.barcode || index}`}
                        >
                          <div className="flex gap-4 p-4">
                            {product.image_url ? (
                              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                <img
                                  src={product.image_url}
                                  alt={product.product_name}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-1.5 flex-wrap">
                                <h3 className="font-semibold text-sm leading-tight line-clamp-2" data-testid={`text-product-name-${product.barcode || index}`}>
                                  {product.product_name}
                                </h3>
                                {product.isUK && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 border-blue-400 text-blue-600 dark:text-blue-400">UK</Badge>
                                )}
                              </div>
                              {product.brand && (
                                <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {nova && <NovaGroupBadge group={nova} />}
                                {product.analysis && (
                                  <HealthScoreCircle score={product.analysis.healthScore} size={28} />
                                )}
                              </div>
                              {product.upfAnalysis && (
                                <div className="mt-1.5">
                                  <AppleRating rating={product.upfAnalysis.smpRating} size="small" />
                                </div>
                              )}
                            </div>
                          </div>

                          {product.upfAnalysis && product.upfAnalysis.additiveMatches.length > 0 && (
                            <div className="px-4 pb-2">
                              <div className="flex flex-wrap gap-1">
                                {product.upfAnalysis.additiveMatches
                                  .filter(a => a.riskLevel === 'high')
                                  .slice(0, 2)
                                  .map((a, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] border-red-300 text-red-600 dark:text-red-400">
                                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                      {a.name}
                                    </Badge>
                                  ))}
                                {product.upfAnalysis.processingIndicators.slice(0, 1).map((pi, i) => (
                                  <Badge key={`pi-${i}`} variant="outline" className="text-[10px] border-orange-300 text-orange-600 dark:text-orange-400">
                                    <Beaker className="h-2.5 w-2.5 mr-0.5" />
                                    {pi}
                                  </Badge>
                                ))}
                                {(product.upfAnalysis.additiveMatches.filter(a => a.riskLevel === 'high').length > 2 ||
                                  product.upfAnalysis.processingIndicators.length > 1) && (
                                  <Badge variant="outline" className="text-[10px]">
                                    +{Math.max(0, product.upfAnalysis.additiveMatches.filter(a => a.riskLevel === 'high').length - 2) +
                                      Math.max(0, product.upfAnalysis.processingIndicators.length - 1)} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {(!product.upfAnalysis || product.upfAnalysis.additiveMatches.length === 0) &&
                            product.analysis && product.analysis.warnings.length > 0 && (
                            <div className="px-4 pb-2">
                              <div className="flex flex-wrap gap-1">
                                {product.analysis.warnings.slice(0, 2).map((w, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] border-red-300 text-red-600 dark:text-red-400">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                    {w}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="px-4 pb-4 mt-auto flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={(e) => { e.stopPropagation(); addToList.mutate(product); }}
                              disabled={addToList.isPending}
                              data-testid={`button-add-product-${product.barcode || index}`}
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Add to List
                            </Button>
                            <Button
                              size="sm"
                              variant={isInCompare(product) ? 'default' : 'outline'}
                              onClick={(e) => { e.stopPropagation(); toggleCompare(product); }}
                              data-testid={`button-compare-${product.barcode || index}`}
                            >
                              <Scale className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-[420px] flex-shrink-0"
            >
              <Card className="sticky top-20" data-testid="card-product-detail">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight" data-testid="text-detail-name">
                        {selectedProduct.product_name}
                      </CardTitle>
                      {selectedProduct.brand && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedProduct.brand}</p>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setSelectedProduct(null)} data-testid="button-close-detail">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {selectedProduct.image_url && (
                    <div className="w-full h-40 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.product_name}
                        className="h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {selectedProduct.upfAnalysis && (
                    <div className="space-y-3 p-3 rounded-md bg-muted/30 border border-border">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">SMP Rating</p>
                          <AppleRating rating={selectedProduct.upfAnalysis.smpRating} size="large" hasCape={selectedProduct.upfAnalysis.hasCape} />
                        </div>
                        {selectedProduct.analysis && (
                          <div className="flex items-center gap-2">
                            <HealthScoreCircle score={selectedProduct.analysis.healthScore} size={56} />
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Health Score</p>
                              <p className="text-lg font-bold" data-testid="text-detail-score">{selectedProduct.analysis.healthScore}/100</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <UPFScoreBar score={selectedProduct.upfAnalysis.upfScore} />

                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{selectedProduct.upfAnalysis.ingredientCount} ingredients</span>
                        <span>{selectedProduct.upfAnalysis.upfIngredientCount} flagged</span>
                        <span>{selectedProduct.upfAnalysis.additiveMatches.length} additives</span>
                      </div>

                      <RiskBreakdownPanel breakdown={selectedProduct.upfAnalysis.riskBreakdown} />
                    </div>
                  )}

                  {!selectedProduct.upfAnalysis && selectedProduct.analysis && (
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <NovaGroupBadge group={selectedProduct.analysis.novaGroup} size="lg" />
                      <div className="flex items-center gap-2">
                        <HealthScoreCircle score={selectedProduct.analysis.healthScore} size={56} />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Health Score</p>
                          <p className="text-lg font-bold" data-testid="text-detail-score">{selectedProduct.analysis.healthScore}/100</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProduct.analysis && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <NovaGroupBadge group={selectedProduct.analysis.novaGroup} size="lg" />
                    </div>
                  )}

                  {selectedProduct.upfAnalysis && selectedProduct.upfAnalysis.additiveMatches.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Additives Detected ({selectedProduct.upfAnalysis.additiveMatches.length})
                      </p>
                      <AdditivesList additives={selectedProduct.upfAnalysis.additiveMatches} />
                    </div>
                  )}

                  {selectedProduct.upfAnalysis && selectedProduct.upfAnalysis.processingIndicators.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Processing Indicators
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProduct.upfAnalysis.processingIndicators.map((pi, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-orange-300 text-orange-600 dark:text-orange-400">
                            <Beaker className="h-3 w-3 mr-1" />
                            {pi}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.analysis && selectedProduct.analysis.warnings.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warnings</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProduct.analysis.warnings.map((w, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-red-300 text-red-600 dark:text-red-400" data-testid={`badge-warning-${i}`}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {w}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.analysis && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Ingredients ({selectedProduct.analysis.totalIngredients})
                        {selectedProduct.analysis.upfCount > 0 && (
                          <span className="text-red-500 ml-1">
                            - {selectedProduct.analysis.upfCount} flagged
                          </span>
                        )}
                      </p>
                      <IngredientsList ingredients={selectedProduct.analysis.ingredients} />
                    </div>
                  )}

                  <NutritionPanel nutriments={selectedProduct.nutriments} />

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      className="w-full gap-2"
                      onClick={() => addToList.mutate(selectedProduct)}
                      disabled={addToList.isPending}
                      data-testid="button-detail-add-to-list"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Basket
                      {selectedProduct.analysis?.isUltraProcessed && (
                        <Badge variant="outline" className="text-[10px] border-yellow-400 text-yellow-600 dark:text-yellow-400 ml-1">UPF</Badge>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => linkToTemplate.mutate(selectedProduct)}
                      disabled={linkToTemplate.isPending}
                      data-testid="button-link-template"
                    >
                      {linkToTemplate.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Layers className="h-4 w-4" />
                      )}
                      Create Meal Template
                    </Button>

                    {selectedProduct.analysis && selectedProduct.analysis.novaGroup >= 3 && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => fetchAlternatives(selectedProduct)}
                        disabled={loadingAlternatives}
                        data-testid="button-find-alternatives"
                      >
                        {loadingAlternatives ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Leaf className="h-4 w-4 text-green-600" />
                        )}
                        Find Healthier Alternatives
                      </Button>
                    )}
                  </div>

                  {alternativesFor?.barcode === selectedProduct.barcode && alternatives.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Leaf className="h-3.5 w-3.5 text-green-600" />
                        Healthier Alternatives
                      </p>
                      {alternatives.map((alt, idx) => (
                        <div
                          key={alt.barcode || idx}
                          className="flex items-center gap-3 p-2 rounded-md bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/50"
                          data-testid={`alternative-${idx}`}
                        >
                          {alt.image_url ? (
                            <img src={alt.image_url} alt={alt.product_name} className="w-10 h-10 rounded object-contain bg-white" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">{alt.product_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {alt.analysis && <NovaGroupBadge group={alt.analysis.novaGroup} />}
                              {alt.upfAnalysis && <AppleRating rating={alt.upfAnalysis.smpRating} size="small" />}
                              {!alt.upfAnalysis && alt.analysis && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Score: {alt.analysis.healthScore}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedProduct(alt)}
                            data-testid={`button-view-alt-${idx}`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {alternativesFor?.barcode === selectedProduct.barcode && !loadingAlternatives && alternatives.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-3 border-t border-border">
                      No healthier alternatives found. Try searching with a different term.
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" data-testid="dialog-compare">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Product Comparison
            </DialogTitle>
          </DialogHeader>
          {compareProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left text-muted-foreground font-medium">Metric</th>
                    {compareProducts.map((p, i) => (
                      <th key={i} className="p-3 text-center min-w-[150px]">
                        <div className="flex flex-col items-center gap-1">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.product_name} className="w-14 h-14 object-contain rounded bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-14 h-14 rounded bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                          <span className="font-semibold text-xs leading-tight text-center line-clamp-2">{p.product_name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive text-xs px-2"
                            onClick={() => toggleCompare(p)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="SMP Rating" products={compareProducts} render={(p) => {
                    if (!p.upfAnalysis) return <span className="text-muted-foreground">N/A</span>;
                    return <AppleRating rating={p.upfAnalysis.smpRating} size="small" />;
                  }} highlightBest={(products) => {
                    const ratings = products.map(p => p.upfAnalysis?.smpRating ?? -1);
                    return ratings.indexOf(Math.max(...ratings));
                  }} />
                  <CompareRow label="UPF Score" products={compareProducts} render={(p) => {
                    if (!p.upfAnalysis) return <span className="text-muted-foreground">N/A</span>;
                    return <span className={p.upfAnalysis.upfScore >= 60 ? 'text-red-600 font-semibold' : p.upfAnalysis.upfScore >= 30 ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>{p.upfAnalysis.upfScore}/100</span>;
                  }} highlightBest={(products) => {
                    const scores = products.map(p => p.upfAnalysis?.upfScore ?? Infinity);
                    return scores.indexOf(Math.min(...scores));
                  }} />
                  <CompareRow label="NOVA Group" products={compareProducts} render={(p) => {
                    const nova = p.nova_group || p.analysis?.novaGroup;
                    return nova ? <NovaGroupBadge group={nova} /> : <span className="text-muted-foreground">N/A</span>;
                  }} />
                  <CompareRow label="Health Score" products={compareProducts} render={(p) => {
                    if (!p.analysis) return <span className="text-muted-foreground">N/A</span>;
                    return <HealthScoreCircle score={p.analysis.healthScore} size={40} />;
                  }} highlightBest={(products) => {
                    const scores = products.map(p => p.analysis?.healthScore ?? -1);
                    return scores.indexOf(Math.max(...scores));
                  }} />
                  <CompareRow label="Additives" products={compareProducts} render={(p) => {
                    if (!p.upfAnalysis) return <span className="text-muted-foreground">N/A</span>;
                    const highRisk = p.upfAnalysis.additiveMatches.filter(a => a.riskLevel === 'high');
                    return (
                      <div className="space-y-0.5">
                        <span className={highRisk.length > 0 ? 'text-red-600 font-semibold' : ''}>
                          {p.upfAnalysis.additiveMatches.length} total
                        </span>
                        {highRisk.length > 0 && (
                          <p className="text-[10px] text-red-600">{highRisk.length} high risk</p>
                        )}
                      </div>
                    );
                  }} highlightBest={(products) => {
                    const counts = products.map(p => p.upfAnalysis?.additiveMatches.length ?? Infinity);
                    return counts.indexOf(Math.min(...counts));
                  }} />
                  <CompareRow label="Ultra-Processed?" products={compareProducts} render={(p) => {
                    if (!p.analysis) return <span className="text-muted-foreground">N/A</span>;
                    return p.analysis.isUltraProcessed
                      ? <Badge variant="outline" className="text-xs border-red-300 text-red-600">Yes</Badge>
                      : <Badge variant="outline" className="text-xs border-green-300 text-green-600">No</Badge>;
                  }} />
                  <CompareRow label="Calories" products={compareProducts} render={(p) => (
                    <span>{p.nutriments?.calories || 'N/A'}</span>
                  )} />
                  <CompareRow label="Protein" products={compareProducts} render={(p) => (
                    <span>{p.nutriments?.protein || 'N/A'}</span>
                  )} />
                  <CompareRow label="Sugar" products={compareProducts} render={(p) => (
                    <span>{p.nutriments?.sugar || 'N/A'}</span>
                  )} />
                  <CompareRow label="Fat" products={compareProducts} render={(p) => (
                    <span>{p.nutriments?.fat || 'N/A'}</span>
                  )} />
                  <CompareRow label="Salt" products={compareProducts} render={(p) => (
                    <span>{p.nutriments?.salt || 'N/A'}</span>
                  )} />
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No products selected for comparison. Click the compare button on product cards to add them.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </div>
  );
}

function CompareRow({ label, products, render, highlightBest }: {
  label: string;
  products: ProductResult[];
  render: (p: ProductResult) => JSX.Element;
  highlightBest?: (products: ProductResult[]) => number;
}) {
  const bestIdx = highlightBest ? highlightBest(products) : -1;
  return (
    <tr className="border-b border-border/50">
      <td className="p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{label}</td>
      {products.map((p, i) => (
        <td key={i} className={`p-3 text-center ${i === bestIdx ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
