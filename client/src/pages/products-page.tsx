import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// PROD1 — adopt the canonical absence owner (PX1-W4.8). This room already told the
// two absences apart correctly; it simply hand-rolled both.
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Loader2, ShoppingBasket, ListPlus, Package, AlertTriangle, Heart,
  Leaf, ArrowRight, X, ChevronDown, ChevronUp, Shield,
  Scale, Beaker, Star, Filter, Info, Layers,
  ScanLine,
  Award, Zap, History, Trash2,
  ChefHat, Check, Sparkles, Store, Clock, Microscope,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { api } from "@shared/routes";
import { appendPendingIngredient } from "@/lib/quick-list";
import AppleRating from "@/components/AppleRating";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import BarcodeScanner from "@/components/BarcodeScanner";
import { getWholeFoodAlternative, effortLabel, effortColor, formatTime } from "@/lib/whole-food-alternatives";
import { rankChoices, buildWhyBetter } from "@/lib/analyser-choice";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { FirstVisitHint } from "@/components/first-visit-hint";
import AnalyserDetailV2 from "@/components/analyser/AnalyserDetailV2";
import { WholeFoodAnalysisCard } from "@/components/analyser/WholeFoodAnalysisCard";
import { AddToWeekModal } from "@/components/AddToWeekModal";
import type { HouseholdEater } from "@shared/household-eater";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

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
  isRegulatory?: boolean;
}

interface UPFAnalysisInfo {
  upfScore: number;
  thaRating: number;
  additiveCount: number;
  regulatoryCount: number;
  additiveMatches: AdditiveMatchInfo[];
  processingIndicators: string[];
  ingredientCount: number;
  upfIngredientCount: number;
  riskBreakdown: {
    additiveRisk: number;
    processingRisk: number;
    ingredientComplexityRisk: number;
  };
}

const BOVAER_KEYWORDS = ['dairy', 'milk', 'cheese', 'yoghurt', 'yogurt', 'cream', 'butter', 'beef', 'meat', 'steak', 'mince', 'burger'];

function isBovaerRiskProduct(product: ProductResult): boolean {
  const name = (product.product_name || '').toLowerCase();
  const cats = (product.categories_tags || []).map(c => c.toLowerCase());
  const allText = [name, ...cats].join(' ');
  return BOVAER_KEYWORDS.some(kw => allText.includes(kw));
}

const SEED_OIL_TERMS = [
  'sunflower oil', 'rapeseed oil', 'palm oil', 'vegetable oil',
  'soybean oil', 'soya oil', 'corn oil', 'cottonseed oil',
  'safflower oil', 'canola oil', 'rice bran oil',
];

function isSeedOilProduct(product: ProductResult): boolean {
  const text = (product.ingredients_text || '').toLowerCase();
  return SEED_OIL_TERMS.some(term => text.includes(term));
}

// ── Canonical size grouping ───────────────────────────────────────────────────

function getCanonicalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\d+(\s*)(ml|l|g|kg|oz|lb)[^\s,]*/gi, '')
    .replace(/\s*\b(\d+\s*)?(pack|x\d+|bottle|can|tin|jar|pouch|sachet)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDisplayName(name: string): string {
  return name
    .replace(/\s*\d+(\s*)(ml|l|g|kg|oz|lb)[^\s,]*/gi, '')
    .replace(/\s*\b(\d+\s*)?(pack|x\d+|bottle|can|tin|jar|pouch|sachet)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface CanonicalGroup {
  key: string;
  representative: ProductResult;
  variants: ProductResult[];
  mergedStores: string[];
  mergedConfirmedStores: string[];
  mergedInferredStores: string[];
}

interface ProductResult {
  barcode: string | null;
  product_name: string;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  ingredientsUnavailable?: boolean;
  nova_group: number | null;
  nutriscore_grade: string | null;
  categories_tags: string[];
  isUK?: boolean;
  availableStores?: string[];
  confirmedStores?: string[];
  inferredStores?: string[];
  storeConfidence?: Record<string, number>;
  packVariants?: string[];
  /** Set when this result represents a canonical product group (e.g. "Cherry Coke") */
  canonicalProductName?: string;
  /** How many raw OFF variants were merged into this result */
  variantCount?: number;
  /** Original raw product names before canonicalisation - for detail views */
  nameVariants?: string[];
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
  quantity?: string | null;
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
      <span className={`absolute text-xs font-semibold ${color}`} data-testid="text-health-score">
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

  const regulatory = additives.filter(a => a.isRegulatory);
  const discretionary = additives.filter(a => !a.isRegulatory);

  const AdditiveRow = ({ a, i }: { a: AdditiveMatchInfo; i: number }) => (
    <div
      key={i}
      className={`flex items-start gap-2 text-xs p-2 rounded-md border ${riskColors[a.riskLevel] || riskColors.low}`}
      data-testid={`additive-item-${i}`}
    >
      <Beaker className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold">{a.name}</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1 border-current">{a.type}</Badge>
          <Badge variant="outline" className="text-[10px] py-0 px-1 border-current">{a.riskLevel} risk</Badge>
        </div>
        {a.description && (
          <p className="text-xs text-muted-foreground/80 mt-0.5 leading-tight">{a.description}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3" data-testid="additives-list">
      {discretionary.length > 0 && (
        <div className="space-y-1.5">
          {regulatory.length > 0 && (
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Discretionary additives</p>
          )}
          {discretionary.map((a, i) => <AdditiveRow key={i} a={a} i={i} />)}
        </div>
      )}

      {regulatory.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Mandatory fortification</p>
          {regulatory.map((a, i) => <AdditiveRow key={i} a={a} i={i} />)}
          <p className="text-[10px] text-muted-foreground leading-snug px-1">
            Mandatory fortification (e.g. added iron or folic acid required in some foods), but still contributes to the overall ingredient profile.
          </p>
        </div>
      )}
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
  const [location] = useLocation();

  // Read URL params once on mount (e.g. navigated from Planner with ?q=oven+chips&shop=Tesco)
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return { q: params.get("q") ?? "", shop: params.get("shop") ?? "" };
  }, [location]);

  const [searchQuery, setSearchQuery] = useState(urlParams.q);
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  // wholeFoodAnalysis is populated when the search query is recognised as a whole
  // food by THA's classification logic. It is distinct from product search results
  // and must be rendered with explicit "Whole Food Analysis" labelling.
  const [wholeFoodAnalysis, setWholeFoodAnalysis] = useState<{ isWholeFood: true; query: string; thaRating: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [addToWeekProduct, setAddToWeekProduct] = useState<ProductResult | null>(null);
  const [compareProducts, setCompareProducts] = useState<ProductResult[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showDetailWFRecipe, setShowDetailWFRecipe] = useState(false);
  const [hideUltraProcessed, setHideUltraProcessed] = useState(false);
  const [hideHighRiskAdditives, setHideHighRiskAdditives] = useState(false);
  const [hideEmulsifiers, setHideEmulsifiers] = useState(false);
  const [hideAcidityRegulators, setHideAcidityRegulators] = useState(false);
  const [hidePreservatives, setHidePreservatives] = useState(false);
  const [hideFlavourings, setHideFlavourings] = useState(false);
  const [hideStabilisers, setHideStabilisers] = useState(false);
  const [hideModifiedStarches, setHideModifiedStarches] = useState(false);
  const [hideSeedOils, setHideSeedOils] = useState(false);
  const [hideBovaer, setHideBovaer] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [excludedAdditives, setExcludedAdditives] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'default' | 'score-desc' | 'score-asc' | 'shop'>('default');
  const [retailerFilter, setRetailerFilter] = useState<string>(urlParams.shop);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  // Tracks the barcode used by the last scan so we can re-fetch it if settings change.
  // null means the last fetch was a text search (not a barcode scan).
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  // Ref to detect genuine toggle changes vs. the setting loading for the first time.
  const prevRegulatoryRef = useRef<boolean | undefined>(undefined);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ href: string }>).detail?.href === "/analyser") {
        setMobileFiltersOpen(true);
      }
    };
    window.addEventListener("tha:open-workspace", handler);
    return () => window.removeEventListener("tha:open-workspace", handler);
  }, []);

  const { data: userProfile } = useQuery<{
    dietPattern: string | null;
    dietRestrictions: string[];
  }>({
    queryKey: ["/api/profile"],
    select: (d: any) => ({ dietPattern: d.dietPattern ?? null, dietRestrictions: d.dietRestrictions ?? [] }),
  });

  // Household eaters — used by the restriction safety panel in the analyser.
  // Stale time is generous: eater profiles change infrequently.
  const { data: householdEaters = [] } = useQuery<HouseholdEater[]>({
    queryKey: ["/api/household/eaters"],
    staleTime: 5 * 60 * 1000,
  });

  // Build eater profiles for the restriction safety computation.
  // Only eaters with hard restrictions contribute; others are omitted.
  const householdEaterProfiles = householdEaters
    .filter(e => (e.hardRestrictions ?? []).length > 0)
    .map(e => ({ displayName: e.displayName, hardRestrictions: e.hardRestrictions ?? [] }));

  const { data: intelligenceSettings } = useQuery<{
    soundEnabled: boolean;
    eliteTrackingEnabled: boolean;
    healthTrendEnabled: boolean;
    barcodeScannerEnabled: boolean;
    includeRegulatoryAdditivesInScoring: boolean;
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
  const { playScanComplete } = useSoundEffects({ enabled: soundEnabled });

  // PX1-W0 (fnd-px-silent-optimistic-rollback). The rollback below was correct and
  // silent: the household flipped a switch, watched it move, and watched it snap
  // back with no explanation — which reads as a broken control, not as a failure.
  // The rollback now SAYS it rolled back.
  const updateSettingsMutation = useTrackedMutation({
    mutationFn: async (settings: Partial<{ soundEnabled: boolean; eliteTrackingEnabled: boolean; healthTrendEnabled: boolean; barcodeScannerEnabled: boolean; includeRegulatoryAdditivesInScoring: boolean }>) => {
      const res = await fetch("/api/user/intelligence-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: ["/api/user/intelligence-settings"] });
      const previous = queryClient.getQueryData(["/api/user/intelligence-settings"]);
      queryClient.setQueryData(["/api/user/intelligence-settings"], (old: any) => ({ ...old, ...settings }));
      return { previous };
    },
    onError: (_err, _settings, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/user/intelligence-settings"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/intelligence-settings"] });
    },
    feedback: {
      // The switch moving back IS the success confirmation; a toast per toggle
      // would be noise (EXP §14 — alarm is reserved, and so is applause).
      failure: "Couldn't save that setting",
      failureDescription: "We've put it back the way it was. Please try again.",
    },
  });

  const recordStreakMutation = useMutation({
    mutationFn: async (thaRating: number) => {
      const res = await fetch("/api/user/streak/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thaRating }),
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
    thaRating: number | null;
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
        thaRating: product.upfAnalysis?.thaRating || null,
        upfScore: product.upfAnalysis?.upfScore || null,
        healthScore: product.analysis?.healthScore || null,
        source,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/product-history"] });
    },
  });

  const deleteHistoryMutation = useTrackedMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/user/product-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/product-history"] });
    },
    feedback: {
      // The row leaving the list is the confirmation. Its failure was not.
      failure: "Couldn't remove that analysis",
      failureDescription: "It's still in your history. Please try again.",
    },
  });

  // PX1-W0 (fnd-px-clear-history-unguarded). This wiped every product analysis the
  // household had ever run, straight from an `onClick`: no confirmation, no undo, no
  // word that it had happened, and no word if it failed. EXP §12 — nothing
  // irreversible happens as a side effect. It is now guarded by the canonical
  // AlertDialog and it says what it did.
  const clearHistoryMutation = useTrackedMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/user/product-history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/product-history"] });
      setClearHistoryOpen(false);
    },
    onError: () => setClearHistoryOpen(false),
    feedback: {
      success: "Analysis history cleared",
      failure: "Couldn't clear your history",
      failureDescription: "Your analyses are still here. Please try again.",
    },
  });

  // Auto-trigger search when navigated from Planner with ?q= (and optional ?shop=) URL params.
  //
  // Guard: track the exact param combination last searched so we can:
  //   - fire again when params change (new Planner → Analyser navigation)
  //   - skip when only intelligenceSettings loads/re-renders with the same params
  //   - never loop
  const lastAutoSearchKey = useRef<string>("");

  useEffect(() => {
    if (!urlParams.q.trim()) return;
    // Wait until intelligenceSettings are loaded.
    if (intelligenceSettings === undefined) return;

    const key = `${urlParams.q}||${urlParams.shop}`;
    // Same params as the last auto-search - nothing to do.
    if (key === lastAutoSearchKey.current) return;
    lastAutoSearchKey.current = key;

    // Sync visible state so the input/chip reflect the incoming params.
    setSearchQuery(urlParams.q);
    setRetailerFilter(urlParams.shop);
    setSelectedProduct(null);

    // Bake retailer into the query for better server-side relevance; client-side filter also runs.
    const baseQ = urlParams.q.trim();
    const q = urlParams.shop ? `${urlParams.shop} ${baseQ}` : baseQ;
    const includeRegulatory = intelligenceSettings?.includeRegulatoryAdditivesInScoring ?? true;
    setIsSearching(true);
    setHasSearched(false);
    fetch(`/api/search-products?q=${encodeURIComponent(q)}&includeRegulatoryInScoring=${includeRegulatory}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { products: [] })
      .then(data => {
        setSearchResults(data.products || []);
        setWholeFoodAnalysis(data.wholeFoodAnalysis ?? null);
        setHasSearched(true);
      })
      .catch(() => {})
      .finally(() => setIsSearching(false));
  }, [intelligenceSettings, urlParams.q, urlParams.shop]);

  // Auto-refresh visible results when the regulatory scoring preference is toggled.
  // Uses a ref to distinguish a genuine toggle change from the setting loading on first render.
  useEffect(() => {
    const current = intelligenceSettings?.includeRegulatoryAdditivesInScoring;
    const prev = prevRegulatoryRef.current;
    prevRegulatoryRef.current = current;

    // First load: setting arrives for the first time - record and skip.
    if (prev === undefined) return;
    // No actual change (re-render without toggle) - skip.
    if (prev === current) return;
    // Nothing visible to refresh.
    if (!hasSearched) return;

    const includeRegulatory = current ?? true;

    if (lastBarcode) {
      // Last result came from a barcode scan - re-fetch that single product silently.
      setBarcodeLoading(true);
      fetch(`/api/products/barcode/${lastBarcode}?includeRegulatoryInScoring=${includeRegulatory}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.product) {
            setSearchResults([data.product]);
            setSelectedProduct(prev => prev ? data.product : null);
          }
        })
        .catch(() => {})
        .finally(() => setBarcodeLoading(false));
    } else if (searchQuery.trim()) {
      // Last result came from a text search - re-run it silently.
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intelligenceSettings?.includeRegulatoryAdditivesInScoring]);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setShowBarcodeScanner(false);
    setBarcodeLoading(true);
    try {
      const includeRegulatory = intelligenceSettings?.includeRegulatoryAdditivesInScoring ?? true;
      console.log(`[SCAN-REQUEST] GET /api/products/barcode/${barcode}?includeRegulatoryInScoring=${includeRegulatory}`);
      const res = await fetch(`/api/products/barcode/${barcode}?includeRegulatoryInScoring=${includeRegulatory}`, { credentials: "include" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const scanStatus = body.scanStatus as string | undefined;
        if (scanStatus === 'not_found_off' || res.status === 404) {
          toast({ title: "Not Found", description: "This barcode wasn't found in Open Food Facts.", variant: "destructive" });
        } else if (scanStatus === 'timeout' || res.status === 504) {
          toast({ title: "Timeout", description: "The lookup timed out. Please try again.", variant: "destructive" });
        } else {
          toast({ title: "Scan Error", description: "Something went wrong during barcode lookup.", variant: "destructive" });
        }
        return;
      }

      const data = await res.json();
      if (data.product) {
        setLastBarcode(barcode);
        setSearchResults([data.product]);
        setSelectedProduct(data.product);
        // DEBUG: log store fields for barcode scan result
        console.log('[THA-STORE-DEBUG] Barcode scan result:', data.product.product_name, {
          confirmedStores: data.product.confirmedStores ?? [],
          inferredStores: data.product.inferredStores ?? [],
          availableStores: data.product.availableStores ?? [],
        });
        setHasSearched(true);
        setSearchQuery(data.product.product_name || barcode);

        saveToHistoryMutation.mutate({ product: data.product, source: "barcode" });

        // PX1-W4b (fnd-px-sound-moralises-food): the tone confirms the scan landed.
        // It no longer varies with the score, so it is no longer conditional on one.
        playScanComplete();

        if (data.product.upfAnalysis?.thaRating) {
          if (intelligenceSettings?.eliteTrackingEnabled !== false) {
            recordStreakMutation.mutate(data.product.upfAnalysis.thaRating);
          }
        }

        if (data.product.scanConfidence === 'low') {
          toast({ title: "Product Found", description: `${data.product.product_name} - ingredient data is limited` });
        } else {
          toast({ title: "Product Found", description: data.product.product_name });
        }
      } else {
        toast({ title: "Not Found", description: `No product found for barcode ${barcode}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Scan Error", description: "Something went wrong during barcode lookup.", variant: "destructive" });
    } finally {
      setBarcodeLoading(false);
    }
  }, [playScanComplete, intelligenceSettings, toast]);

  const handleProductSelect = (product: ProductResult) => {
    setSelectedProduct(product);
    setShowDetailWFRecipe(false);
    saveToHistoryMutation.mutate({ product, source: "search" });
    playScanComplete();
    if (product.upfAnalysis?.thaRating && intelligenceSettings?.eliteTrackingEnabled !== false) {
      recordStreakMutation.mutate(product.upfAnalysis.thaRating);
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
    if (retailerFilter) {
      const r = retailerFilter.toLowerCase();
      const stores = [
        ...(p.confirmedStores ?? []),
        ...(p.inferredStores ?? []),
        ...(p.availableStores ?? []),
      ];
      if (!stores.some(s => s.toLowerCase().includes(r))) return false;
    }
    if (hideUltraProcessed && p.analysis?.isUltraProcessed) return false;
    if (hideHighRiskAdditives && p.upfAnalysis?.additiveMatches.some(a => a.riskLevel === 'high')) return false;
    if (hideEmulsifiers && p.upfAnalysis?.additiveMatches.some(a => a.type === 'emulsifier')) return false;
    if (hideAcidityRegulators && p.upfAnalysis?.additiveMatches.some(a =>
      a.type === 'acidity regulator' || a.type === 'acidity_regulator')) return false;
    if (hidePreservatives && p.upfAnalysis?.additiveMatches.some(a =>
      a.type.toLowerCase().includes('preservative'))) return false;
    if (hideFlavourings && (
      p.upfAnalysis?.additiveMatches.some(a => a.type.toLowerCase().includes('flavour') || a.type.toLowerCase().includes('flavor')) ||
      p.upfAnalysis?.processingIndicators.some(pi => pi.toLowerCase().includes('flavour') || pi.toLowerCase().includes('flavor'))
    )) return false;
    if (hideStabilisers && p.upfAnalysis?.additiveMatches.some(a =>
      a.type.toLowerCase().includes('stabilis') || a.type.toLowerCase().includes('stabiliz'))) return false;
    if (hideModifiedStarches && (
      p.upfAnalysis?.processingIndicators.some(pi => pi.toLowerCase().includes('modified starch')) ||
      /modified\s+\w*\s*starch/i.test(p.ingredients_text || '')
    )) return false;
    if (hideSeedOils && isSeedOilProduct(p)) return false;
    if (hideBovaer && isBovaerRiskProduct(p)) return false;
    if (minRating > 0 && (p.upfAnalysis?.thaRating ?? 0) < minRating) return false;
    if (excludedAdditives.size > 0 && p.upfAnalysis?.additiveMatches.some(a => excludedAdditives.has(a.name))) return false;
    return true;
  });

  const allDetectedAdditives = useMemo(() => {
    const seen = new Map<string, AdditiveMatchInfo>();
    for (const p of deduplicatedResults) {
      for (const a of p.upfAnalysis?.additiveMatches || []) {
        if (!seen.has(a.name)) seen.set(a.name, a);
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1;
      if (b.riskLevel === 'high' && a.riskLevel !== 'high') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [deduplicatedResults]);

  const toggleAdditiveExclusion = (name: string) => {
    setExcludedAdditives(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const canonicalGroups = useMemo(() => {
    const acc: Record<string, CanonicalGroup> = {};
    for (const product of filteredResults) {
      const key = getCanonicalName(product.product_name) + '||' + (product.brand || '').toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = {
          key,
          representative: product,
          variants: [product],
          mergedStores: [...(product.availableStores ?? [])],
          mergedConfirmedStores: [...(product.confirmedStores ?? [])],
          mergedInferredStores: [...(product.inferredStores ?? [])],
        };
      } else {
        acc[key].variants.push(product);
        for (const s of product.availableStores ?? []) {
          if (!acc[key].mergedStores.includes(s)) acc[key].mergedStores.push(s);
        }
        for (const s of product.confirmedStores ?? []) {
          if (!acc[key].mergedConfirmedStores.includes(s)) acc[key].mergedConfirmedStores.push(s);
        }
        for (const s of product.inferredStores ?? []) {
          if (!acc[key].mergedInferredStores.includes(s)) acc[key].mergedInferredStores.push(s);
        }
        const newRating = product.upfAnalysis?.thaRating ?? 0;
        const repRating = acc[key].representative.upfAnalysis?.thaRating ?? 0;
        if (newRating > repRating || (!acc[key].representative.image_url && product.image_url)) {
          acc[key].representative = product;
        }
      }
    }
    return Object.values(acc);
  }, [filteredResults]);

  const canonicalDisplayResults = useMemo(() => {
    const base = [...canonicalGroups];
    if (sortBy === 'score-desc') return base.sort((a, b) => (b.representative.upfAnalysis?.thaRating ?? 0) - (a.representative.upfAnalysis?.thaRating ?? 0));
    if (sortBy === 'score-asc') return base.sort((a, b) => (a.representative.upfAnalysis?.thaRating ?? 0) - (b.representative.upfAnalysis?.thaRating ?? 0));
    if (sortBy === 'shop') return base.sort((a, b) => (a.mergedStores[0] ?? 'zzz').localeCompare(b.mergedStores[0] ?? 'zzz'));
    return base;
  }, [canonicalGroups, sortBy]);

  const shopGroups = useMemo(() => {
    if (sortBy !== 'shop') return null;
    const groups = new Map<string, CanonicalGroup[]>();
    for (const g of canonicalGroups) {
      const store = g.mergedStores[0] || 'Other';
      if (!groups.has(store)) groups.set(store, []);
      groups.get(store)!.push(g);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b));
  }, [canonicalGroups, sortBy]);

  const addToList = useMutation({
    mutationFn: async (product: ProductResult) => {
      const res = await apiRequest('POST', api.shoppingList.add.path, {
        productName: product.product_name,
        imageUrl: product.image_url,
        quantity: 1,
        brand: product.brand,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.list.path] });
      toast({ title: "Added to basket", description: "Product added" });
    },
    onError: () => {
      toast({ title: "Couldn't add product", description: "Something went wrong - try again", variant: "destructive" });
    },
  });

  const handleAddToQuickList = (product: ProductResult) => {
    const ingredient = product.product_name + (product.brand ? ` (${product.brand})` : "");
    appendPendingIngredient(ingredient);
    toast({ title: "Added to quick list" });
  };

  // RM3 (2026-07-15): the "Link to template" flow was retired. It wrote the duplicate
  // meal_template_products representation (a throwaway meal_templates shell + a
  // denormalized product row) that no live feature consumed (RM1 §3.3, §8). Adding an
  // analysed product to the plan now goes through the canonical Analyser→Planner
  // journey (RM2A): "Add to Week" resolve-or-creates a `meals` identity by barcode.

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLastBarcode(null);
    setIsSearching(true);
    setSelectedProduct(null);
    try {
      const includeRegulatory = intelligenceSettings?.includeRegulatoryAdditivesInScoring ?? true;
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(searchQuery.trim())}&includeRegulatoryInScoring=${includeRegulatory}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const products: ProductResult[] = data.products || [];
      setSearchResults(products);
      setWholeFoodAnalysis(data.wholeFoodAnalysis ?? null);
      setHasSearched(true);

      // DEBUG: log store fields for key test products
      const debugTargets = products.filter(p => {
        const n = (p.product_name || '').toLowerCase();
        const b = (p.brand || '').toLowerCase();
        return n.includes('cherry') || n.includes('nairn') || b.includes('ben') || n.includes('cookie dough');
      });
      if (debugTargets.length > 0) {
        console.group('[THA-STORE-DEBUG] Search results store data:');
        debugTargets.forEach(p => {
          console.log(`${p.product_name} (${p.brand})`, {
            confirmedStores: p.confirmedStores ?? [],
            inferredStores: p.inferredStores ?? [],
            availableStores: p.availableStores ?? [],
          });
        });
        console.groupEnd();
      }
    } catch {
      toast({ title: "Search Error", description: "Could not search products.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };


  const toggleCompare = (product: ProductResult) => {
    setCompareProducts(prev => {
      const exists = prev.find(p => p.barcode === product.barcode);
      if (exists) return prev.filter(p => p.barcode !== product.barcode);
      if (prev.length >= 4) {
        toast({ title: "Limit reached", description: "You can compare up to 4 products." });
        return prev;
      }
      return [...prev, product];
    });
  };

  const isInCompare = (product: ProductResult) =>
    compareProducts.some(p => p.barcode === product.barcode);

  const activeFilterCount = [
    hideUltraProcessed, hideHighRiskAdditives, hideEmulsifiers, hideAcidityRegulators,
    hidePreservatives, hideFlavourings, hideStabilisers, hideModifiedStarches, hideSeedOils,
    hideBovaer, minRating > 0, excludedAdditives.size > 0, !!retailerFilter,
  ].filter(Boolean).length;

  return (
    <>
    <WorkspaceHeader
      title="Analyser"
      realm="analyser"
      wide
      titleTestId="text-products-title"
      centerContent={
        <div className="flex items-center gap-2 w-full max-w-xl">
          <Input
            placeholder="Search packaged foods (e.g. ketchup, cereal...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => setSearchInputFocused(true)}
            onBlur={() => setSearchInputFocused(false)}
            aria-label="Search packaged foods"
            data-testid="input-product-search"
            className="h-8"
          />
          {intelligenceSettings?.barcodeScannerEnabled !== false && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 realm-banner-btn"
              onClick={() => setShowBarcodeScanner(true)}
              disabled={barcodeLoading}
              aria-label="Scan barcode"
              data-testid="button-barcode-scan"
            >
              {barcodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="default"
            size="sm"
            className="h-8 shrink-0 gap-1.5 realm-banner-btn"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            aria-label="Analyse"
            data-testid="button-search-products"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          {compareProducts.length >= 2 && (
            <Button variant="default"
              onClick={() => setShowCompare(true)}
              className="gap-2"
              data-testid="button-open-compare"
            >
              <Scale className="h-4 w-4" />
              Compare ({compareProducts.length})
            </Button>
          )}
          {/* Desktop-only filter popover — mobile uses the workspace drawer */}
          <div className="hidden md:block">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="relative flex items-center justify-center h-8 w-8 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Filters"
                  data-testid="button-filters-menu"
                >
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0" data-testid="panel-filters-menu">
                <FilterPanelContent
                  retailerFilter={retailerFilter}
                  setRetailerFilter={setRetailerFilter}
                  hideUltraProcessed={hideUltraProcessed} setHideUltraProcessed={setHideUltraProcessed}
                  hideHighRiskAdditives={hideHighRiskAdditives} setHideHighRiskAdditives={setHideHighRiskAdditives}
                  hideEmulsifiers={hideEmulsifiers} setHideEmulsifiers={setHideEmulsifiers}
                  hideAcidityRegulators={hideAcidityRegulators} setHideAcidityRegulators={setHideAcidityRegulators}
                  hidePreservatives={hidePreservatives} setHidePreservatives={setHidePreservatives}
                  hideFlavourings={hideFlavourings} setHideFlavourings={setHideFlavourings}
                  hideStabilisers={hideStabilisers} setHideStabilisers={setHideStabilisers}
                  hideModifiedStarches={hideModifiedStarches} setHideModifiedStarches={setHideModifiedStarches}
                  hideSeedOils={hideSeedOils} setHideSeedOils={setHideSeedOils}
                  hideBovaer={hideBovaer} setHideBovaer={setHideBovaer}
                  minRating={minRating} setMinRating={setMinRating}
                  intelligenceSettings={intelligenceSettings}
                  updateSettingsMutation={updateSettingsMutation}
                  activeFilterCount={activeFilterCount}
                  canonicalGroupsLength={canonicalGroups.length}
                  deduplicatedResultsLength={deduplicatedResults.length}
                  searchResultsLength={searchResults.length}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Analyser workspace"
                data-testid="button-analyser-workspace-menu"
              >
                <img src={thaAppleSrc} alt="" className="h-[34px] w-[34px] object-contain" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => updateSettingsMutation.mutate({ includeRegulatoryAdditivesInScoring: !(intelligenceSettings?.includeRegulatoryAdditivesInScoring ?? true) })}
                data-testid="button-analyser-ws-regulatory"
              >
                <Shield className="h-4 w-4 mr-2" />
                Regulatory scoring
                {intelligenceSettings?.includeRegulatoryAdditivesInScoring !== false && <Check className="h-4 w-4 ml-auto text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateSettingsMutation.mutate({ soundEnabled: !(intelligenceSettings?.soundEnabled !== false) })}
                data-testid="button-analyser-ws-sound"
              >
                <Zap className="h-4 w-4 mr-2" />
                Sound effects
                {intelligenceSettings?.soundEnabled !== false && <Check className="h-4 w-4 ml-auto text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => updateSettingsMutation.mutate({ barcodeScannerEnabled: !(intelligenceSettings?.barcodeScannerEnabled !== false) })}
                data-testid="button-analyser-ws-barcode"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Barcode scanner
                {intelligenceSettings?.barcodeScannerEnabled !== false && <Check className="h-4 w-4 ml-auto text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
      contextBar={
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Min rating:</span>
          <div className="flex items-center gap-1 shrink-0">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(minRating === r ? 0 : r)}
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                  minRating >= r && minRating > 0
                    ? "realm-banner-btn shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70"
                }`}
                aria-label={`Minimum ${r} apple${r !== 1 ? "s" : ""}`}
                data-testid={`button-toolbar-min-rating-${r}`}
              >
                <span className="flex items-center gap-0.5">
                  {r}<img src={thaAppleSrc} alt="apple" className="h-3 w-3 object-contain" />
                </span>
              </button>
            ))}
          </div>
          {minRating > 0 && (
            <button
              type="button"
              onClick={() => setMinRating(0)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              data-testid="button-toolbar-clear-rating"
            >
              Clear
            </button>
          )}
        </div>
      }
    />
    <div className={pageContainerClass(true)} data-realm="analyser">
      <div className="space-y-6">
        <FirstVisitHint
          areaKey="analyser"
          message="Search any packaged food to see its ingredients, additives, and health rating. Spot ultra-processed products and find less processed alternatives before you buy."
        />

        {hasSearched && retailerFilter && filteredResults.length === 0 && searchResults.length > 0 && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products confirmed at {retailerFilter} in these results.</p>
            <p className="text-xs mt-1">Try a different retailer or clear the filter to see all results.</p>
          </div>
        )}

        {/* Whole Food Analysis — shown when the search query is recognised as a whole
            food. Rendered above packaged-product results (or alone when there are none).
            Distinct from product search: "Recognised" not "Found". */}
        {hasSearched && wholeFoodAnalysis && !isSearching && (
          <WholeFoodAnalysisCard
            foodName={wholeFoodAnalysis.query}
            thaRating={wholeFoodAnalysis.thaRating}
            householdEaterProfiles={householdEaterProfiles.length > 0 ? householdEaterProfiles : undefined}
          />
        )}

        {/* Suppress the "no products found" empty state when a whole food analysis
            is already shown — the WF card is the analysis for that query. */}
        {/* PROD1 — both absences below already told the two truths apart correctly
            (a search that matched nothing vs filters hiding real results); they were
            simply hand-rolled. Adopting the canonical owner keeps that distinction
            and makes it structural rather than a convention this page happened to
            follow. Both are `filtered`: a catalogue exists, and the household's own
            query or filter is what is hiding it — never "you have nothing". */}
        {hasSearched && searchResults.length === 0 && !isSearching && !wholeFoodAnalysis && (
          <EmptyState
            variant="filtered"
            icon={Package}
            title={`No products found for “${searchQuery}”`}
            description="Try a different search term like “ketchup” or “cereal”."
            data-testid="empty-search-no-results"
          />
        )}

        {hasSearched && filteredResults.length === 0 && searchResults.length > 0 && !isSearching && !retailerFilter && (
          <EmptyState
            variant="filtered"
            icon={Filter}
            title="All products filtered out"
            description="Your search did find products — the current filters are hiding them."
            data-testid="empty-all-filtered"
          />
        )}

        {!hasSearched && productHistoryData && productHistoryData.length > 0 && (
          <Card data-testid="card-product-history">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Recently Analysed
              </CardTitle>
              <AlertDialog open={clearHistoryOpen} onOpenChange={setClearHistoryOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    disabled={clearHistoryMutation.isPending}
                    data-testid="button-clear-history"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-testid="dialog-clear-history">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear your analysis history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes all {productHistoryData.length}{" "}
                      {productHistoryData.length === 1 ? "product" : "products"} you've analysed.
                      It can't be undone — you'd need to scan or search for them again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-clear-history-cancel">Keep them</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        clearHistoryMutation.mutate();
                      }}
                      disabled={clearHistoryMutation.isPending}
                      data-testid="button-clear-history-confirm"
                    >
                      {clearHistoryMutation.isPending ? "Clearing…" : "Clear all"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {productHistoryData.map((item) => {
                  const novaConfig = item.novaGroup ? NOVA_CONFIG[item.novaGroup] : null;
                  const openHistoryItem = () => {
                    setSearchQuery(item.productName);
                    setHasSearched(true);
                    setIsSearching(true);
                    fetch(`/api/search-products?q=${encodeURIComponent(item.productName)}`, { credentials: 'include' })
                      .then(r => r.json())
                      .then(data => {
                        setSearchResults(data.products || []);
                        setWholeFoodAnalysis(data.wholeFoodAnalysis ?? null);
                        const match = (data.products || []).find((p: ProductResult) => p.barcode === item.barcode);
                        if (match) setSelectedProduct(match);
                      })
                      .finally(() => setIsSearching(false));
                  };
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="flex items-center gap-3 p-3 rounded-md border border-border hover-elevate cursor-pointer group relative"
                      onClick={openHistoryItem}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          if (e.key === " ") e.preventDefault();
                          openHistoryItem();
                        }
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
                          {item.thaRating !== null && (
                            <AppleRating rating={item.thaRating} sizePx={20} showTooltip={false} animate={false} />
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
                        className="h-7 w-7 hover-reveal group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryMutation.mutate(item.id);
                        }}
                        aria-label="Delete from history"
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

        <div>
          {/* ── Sort Controls ─────────────────────────────────────────────────── */}
          {canonicalGroups.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Sort:</span>
              {(
                [
                  { key: 'default', label: 'Default' },
                  { key: 'score-desc', label: '★ Best first' },
                  { key: 'score-asc', label: '★ Worst first' },
                  { key: 'shop', label: 'By Shop' },
                ] as const
              ).map(opt => (
                <Button
                  key={opt.key}
                  size="sm"
                  variant={sortBy === opt.key ? 'default' : 'outline'}
                  onClick={() => setSortBy(opt.key)}
                  className="realm-banner-btn"
                  data-testid={`button-sort-${opt.key}`}
                >
                  {opt.label}
                </Button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {canonicalGroups.length} result{canonicalGroups.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex-1">
            {shopGroups ? (
              /* ── Grouped by shop ─────────────────────────────────────────── */
              <div className="space-y-8">
                {shopGroups.map(([store, groups]) => (
                  <div key={store}>
                    <div className="flex items-center gap-2 mb-3">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-sm">{store}</h3>
                      <span className="text-xs text-muted-foreground">({groups.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {groups.map((group, index) => {
                        const product = group.representative;
                        const displayName = getDisplayName(product.product_name);
                        const isSelected = group.variants.some(v => v.barcode === selectedProduct?.barcode);
                        const variantSizes = Array.from(new Set(group.variants.flatMap(v => v.packVariants?.length ? v.packVariants : (v.quantity ? [v.quantity] : [])))).sort();
                        return (
                          <motion.div
                            key={group.key || index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            layout
                          >
                            <Card
                              role="button"
                              tabIndex={0}
                              aria-label={`View ${displayName}`}
                              className={`overflow-visible h-full flex flex-col cursor-pointer transition-colors ${
                                isSelected ? 'ring-2 ring-primary' : ''
                              }`}
                              onClick={() => handleProductSelect(product)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  if (e.key === " ") e.preventDefault();
                                  handleProductSelect(product);
                                }
                              }}
                              data-testid={`card-product-${product.barcode || index}`}
                            >
                              <div className="flex gap-4 p-4">
                                {product.image_url ? (
                                  <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                    <img src={product.image_url} alt={displayName} className="w-full h-full object-contain" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                                    <Package className="h-8 w-8 text-muted-foreground/50" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-1 flex-wrap">
                                        <h3 className="font-semibold text-sm leading-tight line-clamp-2" data-testid={`text-product-name-${product.barcode || index}`}>{displayName}</h3>
                                        {product.isUK && (<Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 border-blue-400 text-blue-600 dark:text-blue-400">UK</Badge>)}
                                        {group.variants.length > 1 && (
                                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 border-muted-foreground/40 text-muted-foreground gap-0.5">
                                            <Layers className="h-2.5 w-2.5" />
                                            {group.variants.length}
                                          </Badge>
                                        )}
                                      </div>
                                      {product.brand && (<p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>)}
                                      {variantSizes.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{variantSizes.join(' · ')}</p>
                                      )}
                                      {group.mergedConfirmedStores.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Available at {group.mergedConfirmedStores.slice(0, 3).join(' · ')}</p>
                                      )}
                                      {group.mergedInferredStores.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Likely at {group.mergedInferredStores.slice(0, 3).join(' · ')}</p>
                                      )}
                                      {!group.mergedConfirmedStores.length && !group.mergedInferredStores.length && group.mergedStores.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1"><Store className="h-3 w-3 flex-shrink-0" />{group.mergedStores.slice(0, 2).join(' · ')}</p>
                                      )}
                                    </div>
                                    {product.upfAnalysis && (<div className="flex-shrink-0"><AppleRating rating={product.upfAnalysis.thaRating} sizePx={34} showTooltip={false} animate={false} /></div>)}
                                  </div>
                                </div>
                              </div>
                              {product.upfAnalysis && product.upfAnalysis.additiveMatches.length > 0 && (
                                <div className="px-4 pb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {product.upfAnalysis.additiveMatches.filter(a => a.riskLevel === 'high').slice(0, 2).map((a, i) => (
                                      <Badge key={i} variant="outline" className="text-[10px] border-red-300 text-red-600 dark:text-red-400"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />{a.name}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="px-4 pb-2">
                                {product.ingredients_text ? (
                                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{product.ingredients_text.split(',').map(i => i.trim()).filter(Boolean).slice(0, 6).join(', ')}{product.ingredients_text.split(',').length > 6 ? '…' : ''}</p>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />{product.ingredientsUnavailable ? 'Ingredient detail unavailable in English' : 'Ingredient detail incomplete'}</Badge>
                                )}
                              </div>
                              <div className="px-4 pb-4 mt-auto flex gap-2">
                                <Button variant="default" size="sm" className="flex-1 gap-1 realm-banner-btn" onClick={(e) => { e.stopPropagation(); addToList.mutate(product); }} disabled={addToList.isPending} data-testid={`button-add-product-${product.barcode || index}`}>
                                  <ShoppingBasket className="h-3.5 w-3.5" />Add to basket
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1 realm-banner-btn" onClick={(e) => { e.stopPropagation(); handleAddToQuickList(product); }} aria-label="Add to quick list" data-testid={`button-quick-list-product-grouped-${product.barcode || index}`}>
                                  <ListPlus className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant={isInCompare(product) ? 'default' : 'outline'} onClick={(e) => { e.stopPropagation(); toggleCompare(product); }} className="gap-1 realm-banner-btn" data-testid={`button-compare-${product.barcode || index}`}>
                                  <Scale className="h-3.5 w-3.5" />{isInCompare(product) ? 'Added' : 'Compare'}
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : canonicalGroups.length > 0 ? (
              /* ── Flat sorted grid ─────────────────────────────────────────── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AnimatePresence mode="popLayout">
                  {canonicalDisplayResults.map((group, index) => {
                    const product = group.representative;
                    const displayName = getDisplayName(product.product_name);
                    const isSelected = group.variants.some(v => v.barcode === selectedProduct?.barcode);
                    const variantSizes = Array.from(new Set(group.variants.flatMap(v => v.packVariants?.length ? v.packVariants : (v.quantity ? [v.quantity] : [])))).sort();
                    return (
                      <motion.div
                        key={group.key || index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        layout
                      >
                        <Card
                          role="button"
                          tabIndex={0}
                          aria-label={`View ${displayName}`}
                          className={`overflow-visible h-full flex flex-col cursor-pointer transition-colors ${
                            isSelected ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleProductSelect(product)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              if (e.key === " ") e.preventDefault();
                              handleProductSelect(product);
                            }
                          }}
                          data-testid={`card-product-${product.barcode || index}`}
                        >
                          <div className="flex gap-4 p-4">
                            {product.image_url ? (
                              <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                <img
                                  src={product.image_url}
                                  alt={displayName}
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
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1 flex-wrap">
                                    <h3 className="font-semibold text-sm leading-tight line-clamp-2" data-testid={`text-product-name-${product.barcode || index}`}>
                                      {displayName}
                                    </h3>
                                    {product.isUK && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 border-blue-400 text-blue-600 dark:text-blue-400">UK</Badge>
                                    )}
                                    {group.variants.length > 1 && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 border-muted-foreground/40 text-muted-foreground gap-0.5">
                                        <Layers className="h-2.5 w-2.5" />
                                        {group.variants.length}
                                      </Badge>
                                    )}
                                  </div>
                                  {product.brand && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                                  )}
                                  {variantSizes.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{variantSizes.join(' · ')}</p>
                                  )}
                                  {group.mergedConfirmedStores.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Available at {group.mergedConfirmedStores.slice(0, 3).join(' · ')}</p>
                                  )}
                                  {group.mergedInferredStores.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Likely at {group.mergedInferredStores.slice(0, 3).join(' · ')}</p>
                                  )}
                                  {!group.mergedConfirmedStores.length && !group.mergedInferredStores.length && group.mergedStores.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                      <Store className="h-3 w-3 flex-shrink-0" />
                                      {group.mergedStores.slice(0, 2).join(' · ')}
                                    </p>
                                  )}
                                </div>
                                {product.upfAnalysis && (
                                  <div className="flex-shrink-0">
                                    <AppleRating rating={product.upfAnalysis.thaRating} sizePx={34} showTooltip={false} animate={false} />
                                  </div>
                                )}
                              </div>
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

                          <div className="px-4 pb-2">
                            {product.ingredients_text ? (
                              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                {product.ingredients_text.split(',').map(i => i.trim()).filter(Boolean).slice(0, 6).join(', ')}
                                {product.ingredients_text.split(',').length > 6 ? '…' : ''}
                              </p>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                {product.ingredientsUnavailable ? 'Ingredient detail unavailable in English' : 'Ingredient detail incomplete'}
                              </Badge>
                            )}
                          </div>

                          <div className="px-4 pb-4 mt-auto flex gap-2">
                            <Button variant="default"
                              size="sm"
                              className="flex-1 gap-1 realm-banner-btn"
                              onClick={(e) => { e.stopPropagation(); addToList.mutate(product); }}
                              disabled={addToList.isPending}
                              data-testid={`button-add-product-${product.barcode || index}`}
                            >
                              <ShoppingBasket className="h-3.5 w-3.5" />
                              Add to basket
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 realm-banner-btn"
                              onClick={(e) => { e.stopPropagation(); handleAddToQuickList(product); }}
                              aria-label="Add to quick list"
                              data-testid={`button-quick-list-product-${product.barcode || index}`}
                            >
                              <ListPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant={isInCompare(product) ? 'default' : 'outline'}
                              onClick={(e) => { e.stopPropagation(); toggleCompare(product); }}
                              className="gap-1 realm-banner-btn"
                              data-testid={`button-compare-${product.barcode || index}`}
                            >
                              <Scale className="h-3.5 w-3.5" />
                              {isInCompare(product) ? 'Added' : 'Compare'}
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Product Detail Dialog ────────────────────────────────────────── */}
        <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto" data-testid="dialog-product-detail">
            <DialogTitle className="sr-only">
              {selectedProduct?.product_name ?? "Product detail"}
            </DialogTitle>
            {selectedProduct && (() => {
              const snap = selectedProduct;
              return (
              <AnalyserDetailV2
                product={snap}
                otherProducts={searchResults}
                onAddToBasket={() => addToList.mutate(snap)}
                onAddToQuickList={() => handleAddToQuickList(snap)}
                onAddToWeek={() => {
                  setSelectedProduct(null);
                  setAddToWeekProduct(snap);
                }}
                onViewProduct={(p) => handleProductSelect(p as ProductResult)}
                addToBasketPending={addToList.isPending}
                dietProfile={userProfile ?? null}
                householdEaterProfiles={householdEaterProfiles.length > 0 ? householdEaterProfiles : undefined}
              />
              );
            })()}
          </DialogContent>
        </Dialog>

      </div>

      {addToWeekProduct && (
        <AddToWeekModal
          open={addToWeekProduct !== null}
          product={addToWeekProduct}
          onClose={() => setAddToWeekProduct(null)}
        />
      )}

      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" data-testid="dialog-compare">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Product Comparison
            </DialogTitle>
            <p className="text-xs text-muted-foreground pt-1">
              Apple rating combines E-number additives, soft UPF ingredients (yeast extract, natural flavourings, maltodextrin…) and NOVA group - NOVA 4 products are capped at 3 apples or lower.
            </p>
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
                  <CompareRow label="THA Score" products={compareProducts} render={(p) => {
                    if (!p.upfAnalysis) return <span className="text-muted-foreground">N/A</span>;
                    return <AppleRating rating={p.upfAnalysis.thaRating} sizePx={20} showTooltip={false} animate={false} />;
                  }} highlightBest={(products) => {
                    const ratings = products.map(p => p.upfAnalysis?.thaRating ?? -1);
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
                  <CompareRow label="Retailer" products={compareProducts} render={(p) => (
                    p.confirmedStores && p.confirmedStores.length > 0
                      ? <span>Available at {p.confirmedStores.slice(0, 2).join(', ')}</span>
                      : p.inferredStores && p.inferredStores.length > 0
                        ? <span className="text-muted-foreground/70">Likely at {p.inferredStores.slice(0, 2).join(', ')}</span>
                        : p.availableStores && p.availableStores.length > 0
                          ? <span className="flex items-center justify-center gap-1"><Store className="h-3 w-3" />{p.availableStores.slice(0, 2).join(', ')}</span>
                          : <span className="text-muted-foreground">Unknown</span>
                  )} />
                  <CompareRow label="Ingredients" products={compareProducts} render={(p) => {
                    if (!p.ingredients_text) return (
                      <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        {p.ingredientsUnavailable ? 'Not in English' : 'Missing'}
                      </Badge>
                    );
                    const items = p.ingredients_text.split(',').map(i => i.trim()).filter(Boolean);
                    return (
                      <span className="text-[10px] text-left block leading-relaxed">
                        {items.slice(0, 4).join(', ')}{items.length > 4 ? `… +${items.length - 4} more` : ''}
                      </span>
                    );
                  }} />
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

    {/* Mobile search + filters workspace drawer */}
    <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen} shouldScaleBackground={false}>
      <DrawerContent className="flex flex-col max-h-[85vh]" data-testid="drawer-analyser-filters" data-realm="analyser">
        <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0 realm-header-bg">
          <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
            <Microscope className="h-4 w-4" style={{ color: "var(--realm-accent)" }} />
            Analyser
          </DrawerTitle>
          <button
            onClick={() => setMobileFiltersOpen(false)}
            className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
            aria-label="Close"
            data-testid="button-analyser-filters-drawer-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="w-full h-px shrink-0 bg-[var(--realm-border)]" />
        <div
          className="flex-1 overflow-y-auto min-h-0 px-4 pt-3 space-y-4"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Search + scan */}
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
              <Input
                placeholder="Search packaged foods…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleSearch(); setMobileFiltersOpen(false); }
                }}
                className="pl-9 h-10"
                aria-label="Search packaged foods"
                data-testid="input-drawer-product-search"
                autoFocus
              />
            </div>
            {intelligenceSettings?.barcodeScannerEnabled !== false && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 realm-banner-btn"
                onClick={() => { setShowBarcodeScanner(true); setMobileFiltersOpen(false); }}
                disabled={barcodeLoading}
                aria-label="Scan barcode"
                data-testid="button-drawer-barcode-scan"
              >
                {barcodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="default"
              className="h-10 shrink-0 realm-banner-btn"
              onClick={() => { handleSearch(); setMobileFiltersOpen(false); }}
              disabled={isSearching || !searchQuery.trim()}
              aria-label="Search products"
              data-testid="button-drawer-search-products"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Shop — collapsible */}
          <AnalyserDrawerSection
            label="Shop"
            badge={retailerFilter ? 1 : 0}
          >
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                {retailerFilter && (
                  <button
                    className="text-[10px] text-muted-foreground/70 hover:text-foreground underline underline-offset-2 ml-auto"
                    onClick={() => setRetailerFilter("")}
                    data-testid="button-clear-retailer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {["Tesco", "Sainsbury's", "Asda", "Morrisons", "Aldi", "Lidl", "Waitrose", "M&S", "Co-op"].map((shop) => (
                  <Button
                    key={shop}
                    size="sm"
                    variant={retailerFilter === shop ? "default" : "outline"}
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setRetailerFilter(retailerFilter === shop ? "" : shop)}
                    data-testid={`button-retailer-${shop.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  >
                    {shop}
                  </Button>
                ))}
              </div>
            </div>
          </AnalyserDrawerSection>

          {/* Filters — collapsible */}
          <AnalyserDrawerSection
            label="Filters"
            badge={activeFilterCount - (retailerFilter ? 1 : 0)}
          >
            <div className="pt-2 space-y-3">
              {([
                { id: 'hide-upf-d', label: 'Hide ultra-processed foods', checked: hideUltraProcessed, set: setHideUltraProcessed, testId: 'switch-hide-upf' },
                { id: 'hide-additives-d', label: 'Hide high-risk additives', checked: hideHighRiskAdditives, set: setHideHighRiskAdditives, testId: 'switch-hide-additives' },
                { id: 'hide-emulsifiers-d', label: 'Hide emulsifiers', checked: hideEmulsifiers, set: setHideEmulsifiers, testId: 'switch-hide-emulsifiers' },
                { id: 'hide-acidity-d', label: 'Hide acidity regulators', checked: hideAcidityRegulators, set: setHideAcidityRegulators, testId: 'switch-hide-acidity-regulators' },
                { id: 'hide-preservatives-d', label: 'Hide preservatives', checked: hidePreservatives, set: setHidePreservatives, testId: 'switch-hide-preservatives' },
                { id: 'hide-flavourings-d', label: 'Hide flavourings', checked: hideFlavourings, set: setHideFlavourings, testId: 'switch-hide-flavourings' },
                { id: 'hide-stabilisers-d', label: 'Hide stabilisers', checked: hideStabilisers, set: setHideStabilisers, testId: 'switch-hide-stabilisers' },
                { id: 'hide-modified-starches-d', label: 'Hide modified starches', checked: hideModifiedStarches, set: setHideModifiedStarches, testId: 'switch-hide-modified-starches' },
                { id: 'hide-seed-oils-d', label: 'Hide seed oils', checked: hideSeedOils, set: setHideSeedOils, testId: 'switch-hide-seed-oils' },
                { id: 'hide-bovaer-d', label: 'Hide Bovaer-risk products', checked: hideBovaer, set: setHideBovaer, testId: 'switch-hide-bovaer' },
              ] as const).map(f => (
                <div key={f.id} className="flex items-center justify-between gap-3">
                  <Label htmlFor={f.id} className="text-sm font-normal cursor-pointer text-foreground/80">{f.label}</Label>
                  <Switch id={f.id} checked={f.checked} onCheckedChange={f.set} data-testid={f.testId} />
                </div>
              ))}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Min Apple Rating</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map(r => (
                    <Button key={r} size="sm" variant={minRating === r ? 'default' : 'outline'} onClick={() => setMinRating(r)} className="h-8 px-3 text-xs" data-testid={`button-min-rating-${r}`}>
                      {r === 0 ? 'All' : <span className="flex items-center gap-0.5">{r}<img src={thaAppleSrc} alt="apple" className="h-3 w-3 object-contain" /></span>}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-border/40 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Settings</p>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="d-regulatory-scoring" className="text-sm font-normal cursor-pointer text-foreground/80">Include mandatory fortification in scoring</Label>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-snug">Whether nutrients added as mandatory fortification affect your score.</p>
                  </div>
                  <Switch id="d-regulatory-scoring" checked={intelligenceSettings?.includeRegulatoryAdditivesInScoring !== false} onCheckedChange={(v) => updateSettingsMutation.mutate({ includeRegulatoryAdditivesInScoring: v })} data-testid="switch-regulatory-scoring" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="d-sound" className="text-sm font-normal cursor-pointer text-foreground/80">Sound effects</Label>
                  <Switch id="d-sound" checked={intelligenceSettings?.soundEnabled !== false} onCheckedChange={(v) => updateSettingsMutation.mutate({ soundEnabled: v })} data-testid="switch-sound-enabled" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="d-barcode" className="text-sm font-normal cursor-pointer text-foreground/80">Barcode scanner</Label>
                  <Switch id="d-barcode" checked={intelligenceSettings?.barcodeScannerEnabled !== false} onCheckedChange={(v) => updateSettingsMutation.mutate({ barcodeScannerEnabled: v })} data-testid="switch-barcode-enabled" />
                </div>
              </div>
              {activeFilterCount > 0 && searchResults.length > 0 && (
                <p className="text-xs text-muted-foreground">Showing {canonicalGroups.length} of {deduplicatedResults.length} products</p>
              )}
            </div>
          </AnalyserDrawerSection>
        </div>
      </DrawerContent>
    </Drawer>
    </>
  );
}

function AnalyserDrawerSection({
  label,
  badge = 0,
  children,
}: {
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="flex items-center gap-2">
          {label}
          {badge > 0 && (
            <span className="h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center leading-none">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/40">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterPanelContent({
  retailerFilter, setRetailerFilter,
  hideUltraProcessed, setHideUltraProcessed,
  hideHighRiskAdditives, setHideHighRiskAdditives,
  hideEmulsifiers, setHideEmulsifiers,
  hideAcidityRegulators, setHideAcidityRegulators,
  hidePreservatives, setHidePreservatives,
  hideFlavourings, setHideFlavourings,
  hideStabilisers, setHideStabilisers,
  hideModifiedStarches, setHideModifiedStarches,
  hideSeedOils, setHideSeedOils,
  hideBovaer, setHideBovaer,
  minRating, setMinRating,
  intelligenceSettings,
  updateSettingsMutation,
  activeFilterCount,
  canonicalGroupsLength,
  deduplicatedResultsLength,
  searchResultsLength,
}: {
  retailerFilter: string; setRetailerFilter: (v: string) => void;
  hideUltraProcessed: boolean; setHideUltraProcessed: (v: boolean) => void;
  hideHighRiskAdditives: boolean; setHideHighRiskAdditives: (v: boolean) => void;
  hideEmulsifiers: boolean; setHideEmulsifiers: (v: boolean) => void;
  hideAcidityRegulators: boolean; setHideAcidityRegulators: (v: boolean) => void;
  hidePreservatives: boolean; setHidePreservatives: (v: boolean) => void;
  hideFlavourings: boolean; setHideFlavourings: (v: boolean) => void;
  hideStabilisers: boolean; setHideStabilisers: (v: boolean) => void;
  hideModifiedStarches: boolean; setHideModifiedStarches: (v: boolean) => void;
  hideSeedOils: boolean; setHideSeedOils: (v: boolean) => void;
  hideBovaer: boolean; setHideBovaer: (v: boolean) => void;
  minRating: number; setMinRating: (v: number) => void;
  intelligenceSettings: any;
  updateSettingsMutation: any;
  activeFilterCount: number;
  canonicalGroupsLength: number;
  deduplicatedResultsLength: number;
  searchResultsLength: number;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Retailer</p>
          {retailerFilter && (
            <button
              className="text-[10px] text-muted-foreground/70 hover:text-foreground underline underline-offset-2"
              onClick={() => setRetailerFilter("")}
              data-testid="button-clear-retailer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {["Tesco", "Sainsbury's", "Asda", "Morrisons", "Aldi", "Lidl", "Waitrose", "M&S", "Co-op"].map((shop) => (
            <Button
              key={shop}
              size="sm"
              variant={retailerFilter === shop ? "default" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setRetailerFilter(retailerFilter === shop ? "" : shop)}
              data-testid={`button-retailer-${shop.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            >
              {shop}
            </Button>
          ))}
        </div>
      </div>
      <div className="pt-4 border-t border-border/40 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Filters</p>
        {([
          { id: 'hide-upf', label: 'Hide ultra-processed foods', checked: hideUltraProcessed, set: setHideUltraProcessed, testId: 'switch-hide-upf' },
          { id: 'hide-additives', label: 'Hide high-risk additives', checked: hideHighRiskAdditives, set: setHideHighRiskAdditives, testId: 'switch-hide-additives' },
          { id: 'hide-emulsifiers', label: 'Hide emulsifiers', checked: hideEmulsifiers, set: setHideEmulsifiers, testId: 'switch-hide-emulsifiers' },
          { id: 'hide-acidity', label: 'Hide acidity regulators', checked: hideAcidityRegulators, set: setHideAcidityRegulators, testId: 'switch-hide-acidity-regulators' },
          { id: 'hide-preservatives', label: 'Hide preservatives', checked: hidePreservatives, set: setHidePreservatives, testId: 'switch-hide-preservatives' },
          { id: 'hide-flavourings', label: 'Hide flavourings', checked: hideFlavourings, set: setHideFlavourings, testId: 'switch-hide-flavourings' },
          { id: 'hide-stabilisers', label: 'Hide stabilisers', checked: hideStabilisers, set: setHideStabilisers, testId: 'switch-hide-stabilisers' },
          { id: 'hide-modified-starches', label: 'Hide modified starches', checked: hideModifiedStarches, set: setHideModifiedStarches, testId: 'switch-hide-modified-starches' },
          { id: 'hide-seed-oils', label: 'Hide seed oils', checked: hideSeedOils, set: setHideSeedOils, testId: 'switch-hide-seed-oils' },
          { id: 'hide-bovaer', label: 'Hide Bovaer-risk products', checked: hideBovaer, set: setHideBovaer, testId: 'switch-hide-bovaer' },
        ] as const).map(f => (
          <div key={f.id} className="flex items-center justify-between gap-3">
            <Label htmlFor={f.id} className="text-sm font-normal cursor-pointer text-foreground/80">{f.label}</Label>
            <Switch id={f.id} checked={f.checked} onCheckedChange={f.set} data-testid={f.testId} />
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-border/40 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Minimum Apple Rating</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[0, 1, 2, 3, 4, 5].map(r => (
            <Button
              key={r}
              size="sm"
              variant={minRating === r ? 'default' : 'outline'}
              onClick={() => setMinRating(r)}
              className="h-8 px-3 text-xs"
              data-testid={`button-min-rating-${r}`}
            >
              {r === 0 ? 'All' : <span className="flex items-center gap-0.5">{r}<img src={thaAppleSrc} alt="apple" className="h-3 w-3 object-contain" /></span>}
            </Button>
          ))}
        </div>
      </div>
      <div className="pt-4 border-t border-border/40 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Settings</p>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="menu-regulatory-scoring" className="text-sm font-normal cursor-pointer text-foreground/80">Include mandatory fortification in scoring</Label>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-snug">Some products contain nutrients added as part of mandatory fortification (e.g. iron, folic acid). You can choose whether these affect your score.</p>
          </div>
          <Switch
            id="menu-regulatory-scoring"
            checked={intelligenceSettings?.includeRegulatoryAdditivesInScoring !== false}
            onCheckedChange={(v) => updateSettingsMutation.mutate({ includeRegulatoryAdditivesInScoring: v })}
            data-testid="switch-regulatory-scoring"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="menu-sound" className="text-sm font-normal cursor-pointer text-foreground/80">Sound effects</Label>
          <Switch
            id="menu-sound"
            checked={intelligenceSettings?.soundEnabled !== false}
            onCheckedChange={(v) => updateSettingsMutation.mutate({ soundEnabled: v })}
            data-testid="switch-sound-enabled"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="menu-barcode" className="text-sm font-normal cursor-pointer text-foreground/80">Barcode scanner</Label>
          <Switch
            id="menu-barcode"
            checked={intelligenceSettings?.barcodeScannerEnabled !== false}
            onCheckedChange={(v) => updateSettingsMutation.mutate({ barcodeScannerEnabled: v })}
            data-testid="switch-barcode-enabled"
          />
        </div>
      </div>
      {activeFilterCount > 0 && searchResultsLength > 0 && (
        <p className="text-xs text-muted-foreground pt-1">
          Showing {canonicalGroupsLength} of {deduplicatedResultsLength} products
        </p>
      )}
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
      <td className="p-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">{label}</td>
      {products.map((p, i) => (
        <td key={i} className={`p-3 text-center ${i === bestIdx ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
