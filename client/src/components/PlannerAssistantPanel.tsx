import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AlertTriangle, Camera, Upload, X, Loader2, RefreshCw, ScanLine, Sparkles, DollarSign, Shield, Fish, Beef, Salad, LayoutGrid, Plus, Calendar, CalendarDays, ScanSearch, Settings, Baby, PersonStanding, Wine, Search, Wand2, BookOpen, ChevronLeft, ChevronDown, ChefHat, CheckCircle2, ClipboardList, Lightbulb, Coffee, Sun, Moon, Cookie, GripVertical, ExternalLink } from "lucide-react";
import { DraggableProposalCard } from "@/components/PlannerDragDrop";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AssistantMode } from "@/contexts/PlannerContext";
import { usePlannerWorkspaceContext } from "@/contexts/PlannerWorkspaceContext";
import { TemplatesPanel } from "@/components/templates-panel";
import type { User, Meal } from "@shared/schema";
import { PlannerMealPickerPanel } from "@/components/PlannerMealPickerPanel";
import type { EntryTarget, PlannerProductResult } from "@/components/PlannerMealPickerPanel";
import { DayViewDrawer } from "@/components/day-view-drawer";
import { PlannerBulkAssignPanel } from "@/components/PlannerBulkAssignPanel";
import type { FullDay, FullWeek } from "@/lib/planner-types";

// ── Reduced prop surface (Phase 3A) ──────────────────────────────────────────
// Smart suggest controls and settings are now consumed from PlannerWorkspaceContext
// reducing this interface from ~34 props to ~19 props.

export interface PlaceholderItem {
  entryId: number;
  mealId: number;
  mealName: string;
  dayName: string;
  slotLabel: string;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  position: number;
}

export interface ResolveTarget {
  mealName: string;
  dayName: string;
  slotLabel: string;
  // Phase 3C: entry context for inline resolution
  entryId: number;
  dayId: number;
  mealType: string;
  audience: string;
  isDrink: boolean;
  position: number;
}

interface PlannerAssistantPanelProps {
  mode: AssistantMode;
  onClose: () => void;
  reviewContent?: React.ReactNode;
  user: User | null | undefined;
  onScanFile: (file: File) => void;
  onUploadClick: () => void;
  scanLoading: boolean;
  pickerTarget: EntryTarget | null;
  meals: Meal[];
  plannerMealIdSet: Set<number>;
  categoryIdForSlot: Record<string, number | undefined>;
  onPickerSelect: (mealId: number) => void;
  addingEntry: boolean;
  onAddProduct: (product: PlannerProductResult) => void;
  dayViewDay: FullDay | null;
  dayViewLabel: string;
  getMeal: (id: number | null) => Meal | undefined;
  onPlannerInvalidate: () => void;
  fullPlanner: FullWeek[];
  resolveTarget?: ResolveTarget;
  onResolveAction?: (action: "build" | "scan" | "later" | "import") => void;
  onResolveRecipe?: (mealId: number) => void;
  isResolving?: boolean;
  placeholderItems?: PlaceholderItem[];
  onResolveRecipeFromReview?: (mealId: number, target: ResolveTarget) => void;
  /** Phase 3F: carry item context from review into build/scan workflows */
  onBuildFromReview?: (target: ResolveTarget) => void;
  onScanFromReview?: (target: ResolveTarget) => void;
  /** Phase 5E: navigate to /meals with full planner context */
  onImportFromReview?: (target: ResolveTarget) => void;
  /** Phase 5B: idle state controls */
  onSetMode?: (mode: AssistantMode) => void;
  onCreateIntent?: (name: string, mealType: string) => Promise<void>;
  selectedDayLabel?: string | null;
  /** Phase 5F: unified intake hub callbacks */
  onBrowseRecipes?: () => void;
  onBuildRecipe?: () => void;
  onScanRecipe?: () => void;
  /** Mobile drawer: open the assistant hub (idle state) on mobile */
  mobileOpen?: boolean;
  /** Mobile drawer: go back to the hub without closing the drawer */
  onBackToHub?: () => void;
  /** Phase A: proposal ID consumed by drag-to-planner; forwarded to IdlePanelContent for removal */
  consumedProposalId?: string | null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

type CameraStatus = "loading" | "live" | "captured" | "error";


interface ScanContentProps {
  onScanFile: (file: File) => void;
  scanLoading: boolean;
  onUploadClick: () => void;
}

function ScanContent({ onScanFile, scanLoading, onUploadClick }: ScanContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("loading");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [idleCameraMsg, setIdleCameraMsg] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => { stopStream(); };
  }, [stopStream]);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    stopStream();
    setCameraStatus("loading");
    setCameraError("");
    setCapturedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setCapturedFile(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const e = new Error("getUserMedia not available");
        (e as any).name = "NotSupportedError";
        throw e;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      stopStream();
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera access denied — use Upload Image instead."
          : err.name === "NotFoundError" || err.name === "DevicesNotFoundError"
          ? "No camera found — use Upload Image instead."
          : "Camera unavailable here — use Upload Image instead."
      );
      setCameraStatus("error");
    }
  }, [stopStream]);

  const openCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setIdleCameraMsg("Camera unavailable here — use Upload Image instead.");
      return;
    }
    setIdleCameraMsg("");
    setCameraOpen(true);
    startCamera(facingMode);
  };

  const closeCamera = () => {
    stopStream();
    setCapturedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setCapturedFile(null);
    setCameraOpen(false);
    setCameraStatus("loading");
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], "scan-capture.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      setCapturedFile(file);
      setCameraStatus("captured");
      stopStream();
    }, "image/jpeg", 0.92);
  };

  const retake = () => {
    setCapturedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setCapturedFile(null);
    startCamera(facingMode);
  };

  const flipCamera = () => {
    const next: "environment" | "user" = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const usePhoto = () => {
    if (!capturedFile) return;
    const file = capturedFile;
    setCapturedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    onScanFile(file);
  };

  const uploadButton = (
    <Button
      variant="outline"
      className="w-full"
      disabled={scanLoading}
      onClick={onUploadClick}
      data-testid="button-assistant-upload"
    >
      <Upload className="h-4 w-4 mr-2" />Upload Image
    </Button>
  );

  if (cameraOpen) {
    return (
      <div className="space-y-3" data-testid="panel-scan-camera">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
          {cameraStatus !== "captured" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => { if (streamRef.current) setCameraStatus("live"); }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity ${cameraStatus === "live" ? "opacity-100" : "opacity-0"}`}
              data-testid="video-panel-camera-feed"
            />
          )}
          {cameraStatus === "captured" && capturedUrl && (
            <img src={capturedUrl} alt="Captured" className="absolute inset-0 w-full h-full object-contain" data-testid="img-panel-capture" />
          )}
          {cameraStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            </div>
          )}
          {cameraStatus === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <p className="text-xs text-white/80">{cameraError}</p>
            </div>
          )}
          {cameraStatus === "live" && (
            <button
              onClick={flipCamera}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
              title="Flip camera"
              data-testid="button-panel-camera-flip"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {cameraStatus === "live" && (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={takePhoto} data-testid="button-panel-camera-capture">
              <Camera className="h-4 w-4 mr-2" />Capture
            </Button>
            <Button variant="ghost" size="icon" onClick={closeCamera} title="Cancel" data-testid="button-panel-camera-cancel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {cameraStatus === "captured" && (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={usePhoto} disabled={scanLoading} data-testid="button-panel-camera-use">
              {scanLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Scan this photo
            </Button>
            <Button variant="outline" onClick={retake} disabled={scanLoading} data-testid="button-panel-camera-retake">
              Retake
            </Button>
          </div>
        )}

        {(cameraStatus === "error" || cameraStatus === "loading") && (
          <div className="space-y-2">
            {uploadButton}
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={closeCamera} data-testid="button-panel-camera-cancel-error">
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="panel-scan-idle">
      <div className="flex items-start gap-2.5 bg-muted/40 rounded-lg px-3 py-3">
        <ScanLine className="h-7 w-7 shrink-0 text-primary/60 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Photograph your handwritten or printed meal plan and we'll extract the meals into your planner.
        </p>
      </div>
      <div className="space-y-2">
        <Button
          className="w-full"
          onClick={openCamera}
          disabled={scanLoading}
          data-testid="button-assistant-take-photo"
        >
          {scanLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
          Take Photo
        </Button>
        {idleCameraMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20 px-3 py-2.5" data-testid="panel-scan-camera-unavailable">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">{idleCameraMsg}</p>
          </div>
        )}
        {uploadButton}
      </div>
      {scanLoading && (
        <p className="text-xs text-center text-muted-foreground animate-pulse pt-1">
          Scanning your plan…
        </p>
      )}
    </div>
  );
}

// SmartContent now reads all controls from PlannerWorkspaceContext
function SmartContent() {
  const {
    smartMealsPerDay, setSmartMealsPerDay,
    smartCuisine, setSmartCuisine,
    smartBudget, setSmartBudget,
    smartMaxUPF, setSmartMaxUPF,
    smartFishPerWeek, setSmartFishPerWeek,
    smartRedMeatPerWeek, setSmartRedMeatPerWeek,
    smartVegDays, setSmartVegDays,
    smartLeftovers, setSmartLeftovers,
    smartLoading,
    onRunSmartSuggest,
  } = usePlannerWorkspaceContext();

  return (
    <div className="space-y-4" data-testid="panel-smart-content">
      <div className="flex items-start gap-2.5 bg-muted/40 rounded-lg px-3 py-3">
        <Sparkles className="h-6 w-6 shrink-0 text-primary/60 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Set your preferences and we'll propose a week of meals tailored to your household.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Meals per day</label>
          <Select value={smartMealsPerDay} onValueChange={setSmartMealsPerDay}>
            <SelectTrigger data-testid="select-meals-per-day"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 meal</SelectItem>
              <SelectItem value="2">2 meals</SelectItem>
              <SelectItem value="3">3 meals</SelectItem>
              <SelectItem value="4">3 meals + snack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Cuisine preference</label>
          <Select value={smartCuisine || "any"} onValueChange={v => setSmartCuisine(v === "any" ? "" : v)}>
            <SelectTrigger data-testid="select-cuisine"><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any cuisine</SelectItem>
              <SelectItem value="british">British</SelectItem>
              <SelectItem value="italian">Italian</SelectItem>
              <SelectItem value="mexican">Mexican</SelectItem>
              <SelectItem value="indian">Indian</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
              <SelectItem value="thai">Thai</SelectItem>
              <SelectItem value="mediterranean">Mediterranean</SelectItem>
              <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />Budget (£)
            </label>
            <Input
              placeholder="e.g. 80"
              value={smartBudget}
              onChange={e => setSmartBudget(e.target.value)}
              data-testid="input-smart-budget"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />Max UPF %
            </label>
            <Input
              placeholder="e.g. 30"
              value={smartMaxUPF}
              onChange={e => setSmartMaxUPF(e.target.value)}
              data-testid="input-smart-upf"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Fish className="h-3 w-3" />Fish/week
            </label>
            <Select value={smartFishPerWeek} onValueChange={setSmartFishPerWeek}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Beef className="h-3 w-3" />Red meat/wk
            </label>
            <Select value={smartRedMeatPerWeek} onValueChange={setSmartRedMeatPerWeek}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0,1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Switch
              id="panel-smart-veg-days"
              checked={smartVegDays}
              onCheckedChange={c => setSmartVegDays(!!c)}
              data-testid="toggle-smart-veg"
            />
            <label htmlFor="panel-smart-veg-days" className="text-xs flex items-center gap-1 cursor-pointer">
              <Salad className="h-3.5 w-3.5 text-green-500" />Vegetarian days
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="panel-smart-leftovers"
              checked={smartLeftovers}
              onCheckedChange={c => setSmartLeftovers(!!c)}
              data-testid="toggle-smart-leftovers"
            />
            <label htmlFor="panel-smart-leftovers" className="text-xs cursor-pointer">Include leftovers</label>
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={onRunSmartSuggest}
        disabled={smartLoading}
        data-testid="button-run-smart-suggest"
      >
        {smartLoading
          ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          : <Sparkles className="h-4 w-4 mr-2" />}
        {smartLoading ? "Planning your week…" : "Propose My Plan"}
      </Button>
    </div>
  );
}

// PlannerSettingsContent reads from PlannerWorkspaceContext
function PlannerSettingsContent() {
  const { plannerSettings, toggleSetting, settingsUpdating } = usePlannerWorkspaceContext();

  return (
    <div className="space-y-6 py-2" data-testid="panel-settings-content">
      <div className="flex items-start gap-2.5 bg-muted/40 rounded-lg px-3 py-3">
        <Settings className="h-5 w-5 shrink-0 text-primary/60 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Customise which rows appear in your planner grid.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Baby className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-sm font-medium" data-testid="label-enable-baby-meals">Baby Meals</span>
            </div>
            <p className="text-xs text-muted-foreground">Enable baby meal row in planner</p>
          </div>
          <Switch
            checked={plannerSettings?.enableBabyMeals ?? false}
            onCheckedChange={(v) => toggleSetting("enableBabyMeals", v)}
            disabled={settingsUpdating}
            data-testid="switch-enable-baby-meals"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <PersonStanding className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-sm font-medium" data-testid="label-enable-child-meals">Child Meals</span>
            </div>
            <p className="text-xs text-muted-foreground">Enable kids meal row in planner</p>
          </div>
          <Switch
            checked={plannerSettings?.enableChildMeals ?? false}
            onCheckedChange={(v) => toggleSetting("enableChildMeals", v)}
            disabled={settingsUpdating}
            data-testid="switch-enable-child-meals"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Wine className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-sm font-medium" data-testid="label-enable-drinks">Drinks</span>
            </div>
            <p className="text-xs text-muted-foreground">Enable drinks row in planner</p>
          </div>
          <Switch
            checked={plannerSettings?.enableDrinks ?? false}
            onCheckedChange={(v) => toggleSetting("enableDrinks", v)}
            disabled={settingsUpdating}
            data-testid="switch-enable-drinks"
          />
        </div>
      </div>
    </div>
  );
}

interface ResolveSearchContentProps {
  mealName: string;
  meals: Meal[];
  onSelectRecipe: (mealId: number) => void;
  onBack: () => void;
  isResolving: boolean;
}

function ResolveSearchContent({ mealName, meals, onSelectRecipe, onBack, isResolving }: ResolveSearchContentProps) {
  const [search, setSearch] = useState(mealName);

  const filteredMeals = useMemo(() => {
    const cookbookMeals = meals.filter(m =>
      m.mealSourceType !== "planner-placeholder" &&
      !m.isReadyMeal &&
      !m.isDrink
    );
    if (!search.trim()) return cookbookMeals.slice(0, 50);
    const q = search.toLowerCase();
    return cookbookMeals.filter(m => m.name.toLowerCase().includes(q)).slice(0, 50);
  }, [meals, search]);

  return (
    <div className="flex flex-col gap-3" data-testid="panel-resolve-search">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
        data-testid="button-resolve-search-back"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search your recipes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 h-8 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
          autoFocus
          data-testid="input-resolve-recipe-search"
        />
      </div>

      <div className="overflow-y-auto space-y-0.5" data-testid="list-resolve-recipes">
        {filteredMeals.length === 0 ? (
          <div className="text-center py-8">
            <ChefHat className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {search.trim() ? "No recipes found" : "No recipes in your cookbook yet"}
            </p>
            {search.trim() && (
              <button
                className="text-xs text-primary mt-1.5 hover:underline"
                onClick={() => setSearch("")}
                data-testid="button-resolve-clear-search"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredMeals.map(meal => (
            <button
              key={meal.id}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/40 text-left transition-colors disabled:opacity-50"
              onClick={() => onSelectRecipe(meal.id)}
              disabled={isResolving}
              data-testid={`button-resolve-select-${meal.id}`}
            >
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <ChefHat className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{meal.name}</p>
                {meal.servings > 1 && (
                  <p className="text-xs text-muted-foreground">{meal.servings} servings</p>
                )}
              </div>
              {isResolving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

interface ResolveContentProps {
  mealName: string;
  dayName: string;
  slotLabel: string;
  onSearch: () => void;
  onAction: (action: "build" | "scan" | "later" | "import") => void;
}

function ResolveContent({ mealName, dayName, slotLabel, onSearch, onAction }: ResolveContentProps) {
  return (
    <div className="space-y-4" data-testid="panel-resolve-content">
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{dayName} · {slotLabel}</p>
        <h3 className="text-sm font-semibold text-foreground leading-snug">{mealName}</h3>
      </div>

      <div className="flex items-start gap-2.5 bg-muted/40 rounded-lg px-3 py-3">
        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This meal is planned, but no full recipe has been linked yet.
        </p>
      </div>

      <div className="space-y-2">
        <button
          className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-card hover:bg-accent/40 px-3 py-2.5 text-sm text-foreground transition-colors text-left"
          onClick={onSearch}
          data-testid="button-resolve-search"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          Search cookbook
        </button>
        <button
          className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-card hover:bg-accent/40 px-3 py-2.5 text-sm text-foreground transition-colors text-left"
          onClick={() => onAction("build")}
          data-testid="button-resolve-build"
        >
          <Wand2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          Build recipe
        </button>
        <button
          className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-card hover:bg-accent/40 px-3 py-2.5 text-sm text-foreground transition-colors text-left"
          onClick={() => onAction("scan")}
          data-testid="button-resolve-scan"
        >
          <Camera className="h-4 w-4 shrink-0 text-muted-foreground" />
          Scan recipe
        </button>
        <button
          className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-card hover:bg-accent/40 px-3 py-2.5 text-sm text-foreground transition-colors text-left"
          onClick={() => onAction("import")}
          data-testid="button-resolve-import"
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          Browse / import recipes
        </button>
        <button
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
          onClick={() => onAction("later")}
          data-testid="button-resolve-later"
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          Add later / keep as planned
        </button>
      </div>
    </div>
  );
}

interface PlaceholderReviewContentProps {
  placeholderItems: PlaceholderItem[];
  onSearchRecipe: (item: PlaceholderItem) => void;
  onBuildRecipe: (item: PlaceholderItem) => void;
  onScanRecipe: (item: PlaceholderItem) => void;
  onImportRecipe?: (item: PlaceholderItem) => void;
  isResolving: boolean;
}

function PlaceholderReviewContent({
  placeholderItems,
  onSearchRecipe,
  onBuildRecipe,
  onScanRecipe,
  onImportRecipe,
  isResolving,
}: PlaceholderReviewContentProps) {
  if (placeholderItems.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-2" data-testid="panel-review-empty">
        <CheckCircle2 className="h-8 w-8 text-green-500/70" />
        <p className="text-sm font-medium text-foreground">All meals linked!</p>
        <p className="text-xs text-muted-foreground text-center">Every planned meal has a recipe.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5" data-testid="panel-placeholder-review">
      <p className="text-xs text-muted-foreground pb-2">
        {placeholderItems.length} unlinked meal{placeholderItems.length !== 1 ? "s" : ""}
      </p>
      {placeholderItems.map((item) => (
        <div
          key={item.entryId}
          className="flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-muted/40 border-b border-border/40 last:border-0 transition-colors group"
          data-testid={`review-item-${item.entryId}`}
        >
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-medium truncate text-foreground leading-snug">{item.mealName}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{item.dayName} · {item.slotLabel}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
              onClick={() => onSearchRecipe(item)}
              disabled={isResolving}
              title="Search cookbook"
              data-testid={`button-review-search-${item.entryId}`}
            >
              Search
            </button>
            <button
              className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
              onClick={() => onBuildRecipe(item)}
              disabled={isResolving}
              title="Build recipe"
              data-testid={`button-review-build-${item.entryId}`}
            >
              Build
            </button>
            <button
              className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-40"
              onClick={() => onScanRecipe(item)}
              disabled={isResolving}
              title="Scan recipe"
              data-testid={`button-review-scan-${item.entryId}`}
            >
              <Camera className="h-3 w-3" />
            </button>
            {onImportRecipe && (
              <button
                className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-40"
                onClick={() => onImportRecipe(item)}
                disabled={isResolving}
                title="Browse recipes"
                data-testid={`button-review-import-${item.entryId}`}
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const INTENT_MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "lunch",     label: "Lunch",     icon: Sun },
  { key: "dinner",    label: "Dinner",    icon: Moon },
  { key: "snacks",    label: "Snack",     icon: Cookie },
] as const;

interface IdlePanelContentProps {
  onSetMode: (mode: AssistantMode) => void;
  onCreateIntent?: (name: string, mealType: string) => Promise<void>;
  selectedDayLabel?: string | null;
  /** Phase 5F: unresolved placeholder count for Continue Planning section */
  placeholderCount?: number;
  /** Phase 5F: navigate to /meals to browse or import recipes */
  onBrowseRecipes?: () => void;
  /** Phase 5F: open create-recipe modal from idle state */
  onBuildRecipe?: () => void;
  /** Phase 5F: navigate to /meals with scan mode open */
  onScanRecipe?: () => void;
  /** Phase A: proposal ID consumed by drag-to-planner; triggers removal from tray */
  consumedProposalId?: string | null;
}

interface ProposalItem {
  id: string;
  name: string;
  mealType: string;
}

let _proposalSeq = 0;
function nextProposalId() { return `prop-${++_proposalSeq}`; }

// ── Phase A: Proposal tray session persistence ────────────────────────────────

const PROPOSAL_TRAY_KEY = "planner-proposal-tray";

interface StoredProposal {
  name: string;
  mealType: string;
}

function saveTraySession(proposals: ProposalItem[]): void {
  try {
    if (proposals.length === 0) {
      sessionStorage.removeItem(PROPOSAL_TRAY_KEY);
    } else {
      const stored: StoredProposal[] = proposals.map(p => ({ name: p.name, mealType: p.mealType }));
      sessionStorage.setItem(PROPOSAL_TRAY_KEY, JSON.stringify(stored));
    }
  } catch {}
}

function loadTraySession(): ProposalItem[] | null {
  try {
    const raw = sessionStorage.getItem(PROPOSAL_TRAY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      sessionStorage.removeItem(PROPOSAL_TRAY_KEY);
      return null;
    }
    const valid = (parsed as unknown[]).filter(
      (s): s is StoredProposal =>
        typeof s === "object" && s !== null &&
        typeof (s as StoredProposal).name === "string" &&
        (s as StoredProposal).name.trim().length > 0 &&
        typeof (s as StoredProposal).mealType === "string"
    );
    if (valid.length === 0) {
      sessionStorage.removeItem(PROPOSAL_TRAY_KEY);
      return null;
    }
    return valid.map(s => ({ id: nextProposalId(), name: s.name.trim(), mealType: s.mealType }));
  } catch {
    try { sessionStorage.removeItem(PROPOSAL_TRAY_KEY); } catch {}
    return null;
  }
}

// Tracks whether the restore banner has fired this page load. Prevents the
// banner re-appearing on every mode switch (which unmounts/remounts IdlePanelContent).
let _traySessionRestored = false;

function IdlePanelContent({ onSetMode, onCreateIntent, selectedDayLabel, placeholderCount = 0, onBrowseRecipes, onBuildRecipe, onScanRecipe, consumedProposalId }: IdlePanelContentProps) {
  const [intentOpen, setIntentOpen] = useState(false);
  const [intentName, setIntentName] = useState("");
  const [intentMealType, setIntentMealType] = useState<string>("dinner");
  const [intentSaving, setIntentSaving] = useState(false);

  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [proposalName, setProposalName] = useState("");
  const [proposalMealType, setProposalMealType] = useState<string>("dinner");
  const [trayRestored, setTrayRestored] = useState(false);

  // Phase 5G: collapsible section state
  const [planWeekOpen, setPlanWeekOpen] = useState(true);
  const [addMealsOpen, setAddMealsOpen] = useState(true);
  const hasContinueItems = proposals.length > 0 || placeholderCount > 0;
  const [continuePlanningOpen, setContinuePlanningOpen] = useState(true);

  // Phase A: restore from session on mount. Banner only fires on first mount per
  // page load (_traySessionRestored flag) — silent on subsequent mode-switch remounts.
  useEffect(() => {
    const restored = loadTraySession();
    if (restored) {
      setProposals(restored);
      if (!_traySessionRestored) setTrayRestored(true);
    }
    _traySessionRestored = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase A: persist to session whenever proposals change.
  useEffect(() => {
    saveTraySession(proposals);
  }, [proposals]);

  // Phase A: remove a proposal that was dragged onto the planner grid.
  useEffect(() => {
    if (!consumedProposalId) return;
    setProposals(prev => prev.filter(p => p.id !== consumedProposalId));
  }, [consumedProposalId]);

  const handleSubmitIntent = async () => {
    if (!intentName.trim() || !onCreateIntent) return;
    setIntentSaving(true);
    try {
      await onCreateIntent(intentName.trim(), intentMealType);
      setIntentName("");
      setIntentOpen(false);
    } finally {
      setIntentSaving(false);
    }
  };

  const addProposal = () => {
    const trimmed = proposalName.trim();
    if (!trimmed) return;
    setProposals(prev => [...prev, { id: nextProposalId(), name: trimmed, mealType: proposalMealType }]);
    setProposalName("");
  };

  const removeProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div data-testid="panel-assistant-idle">

      {/* ── Section A: Plan Your Week ── */}
      <div data-testid="section-plan-week">
        <button
          className="w-full flex items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          onClick={() => setPlanWeekOpen(v => !v)}
          aria-expanded={planWeekOpen}
          data-testid="button-section-plan-week-toggle"
        >
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider" data-testid="section-plan-week-label">
            Plan Your Week
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-150 ${planWeekOpen ? "" : "-rotate-90"}`} />
        </button>
        {planWeekOpen && (
          <div className="flex gap-1.5 pb-1.5" data-testid="section-plan-week-body">
            <button
              className="flex-1 flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/80 hover:bg-accent/50 px-2 py-2.5 text-foreground transition-colors"
              onClick={() => onSetMode("smart")}
              data-testid="button-idle-smart"
            >
              <Sparkles className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium">Smart</span>
            </button>
            <button
              className="flex-1 flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/80 hover:bg-accent/50 px-2 py-2.5 text-foreground transition-colors"
              onClick={() => onSetMode("scan")}
              data-testid="button-idle-scan"
            >
              <Camera className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium">Scan</span>
            </button>
            <button
              className="flex-1 flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/80 hover:bg-accent/50 px-2 py-2.5 text-foreground transition-colors"
              onClick={() => onSetMode("templates")}
              data-testid="button-idle-templates"
            >
              <LayoutGrid className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium">Templates</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* ── Section B: Add Meals ── */}
      <div data-testid="section-add-meals">
        <button
          className="w-full flex items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          onClick={() => setAddMealsOpen(v => !v)}
          aria-expanded={addMealsOpen}
          data-testid="button-section-add-meals-toggle"
        >
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider" data-testid="section-add-meals-label">
            Add Meals
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-150 ${addMealsOpen ? "" : "-rotate-90"}`} />
        </button>
        {addMealsOpen && (
          <div className="pb-1.5" data-testid="section-add-meals-body">
            <p className="text-[11px] text-muted-foreground/70 leading-snug mb-1">
              Start with ideas, refine recipes later.
            </p>
            <div className="space-y-0.5 mb-2">
              {onCreateIntent && (
                <button
                  className="w-full flex items-center gap-1.5 rounded-md border border-border/60 bg-card/80 hover:bg-accent/50 px-2.5 py-1.5 text-xs text-foreground transition-colors text-left"
                  onClick={() => setIntentOpen(v => !v)}
                  data-testid="button-idle-add-intent"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  Quick meal idea
                </button>
              )}
              {onBrowseRecipes && (
                <button
                  className="w-full flex items-center gap-1.5 rounded-md border border-border/60 bg-card/80 hover:bg-accent/50 px-2.5 py-1.5 text-xs text-foreground transition-colors text-left"
                  onClick={onBrowseRecipes}
                  data-testid="button-idle-browse-recipes"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  Browse / import recipes
                </button>
              )}
              {onBuildRecipe && (
                <button
                  className="w-full flex items-center gap-1.5 rounded-md border border-border/60 bg-card/80 hover:bg-accent/50 px-2.5 py-1.5 text-xs text-foreground transition-colors text-left"
                  onClick={onBuildRecipe}
                  data-testid="button-idle-build-recipe"
                >
                  <Wand2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  Build from scratch
                </button>
              )}
              {onScanRecipe && (
                <button
                  className="w-full flex items-center gap-1.5 rounded-md border border-border/60 bg-card/80 hover:bg-accent/50 px-2.5 py-1.5 text-xs text-foreground transition-colors text-left"
                  onClick={onScanRecipe}
                  data-testid="button-idle-scan-recipe"
                >
                  <Camera className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  Scan recipe
                </button>
              )}
            </div>

            {intentOpen && onCreateIntent && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 mb-2" data-testid="panel-intent-form">
                {selectedDayLabel ? (
                  <p className="text-xs text-muted-foreground">Adding to <span className="font-medium text-foreground">{selectedDayLabel}</span></p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Select a day first by clicking a day header in the grid.</p>
                )}
                <input
                  type="text"
                  placeholder="e.g. Pasta carbonara"
                  value={intentName}
                  onChange={e => setIntentName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmitIntent(); }}
                  className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                  data-testid="input-intent-name"
                />
                <div className="flex gap-1 flex-wrap">
                  {INTENT_MEAL_TYPES.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setIntentMealType(key)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                        intentMealType === key
                          ? "bg-primary/10 text-primary border-primary/40"
                          : "border-border text-muted-foreground hover:border-foreground/40"
                      }`}
                      data-testid={`button-intent-type-${key}`}
                    >
                      <Icon className="h-3 w-3" />{label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitIntent}
                    disabled={intentSaving || !intentName.trim() || !selectedDayLabel}
                    className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                    data-testid="button-intent-submit"
                  >
                    {intentSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    {intentSaving ? "Adding…" : "Add"}
                  </button>
                  <button
                    onClick={() => { setIntentOpen(false); setIntentName(""); }}
                    className="h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-intent-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Phase 5D+5G: Proposal staging tray — compact */}
            <div data-testid="panel-proposal-tray">
              <div className="flex gap-1.5 flex-wrap">
                <input
                  type="text"
                  placeholder="e.g. Fish cakes"
                  value={proposalName}
                  onChange={e => setProposalName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addProposal(); }}
                  className="flex-1 min-w-[80px] h-7 px-2.5 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  data-testid="input-proposal-name"
                />
                <select
                  value={proposalMealType}
                  onChange={e => setProposalMealType(e.target.value)}
                  className="h-7 px-1.5 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
                  data-testid="select-proposal-mealtype"
                >
                  {INTENT_MEAL_TYPES.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={addProposal}
                  disabled={!proposalName.trim()}
                  className="h-7 px-2.5 rounded-md bg-muted hover:bg-muted/80 disabled:opacity-40 text-xs font-medium transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                  data-testid="button-proposal-stage"
                >
                  <Plus className="h-3 w-3 shrink-0" />Stage
                </button>
              </div>

              {proposals.length > 0 && (
                <div className="mt-1.5" data-testid="list-proposal-cards">
                  {trayRestored && (
                    <div
                      className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/10 px-2.5 py-1.5 mb-1.5"
                      data-testid="banner-tray-restored"
                    >
                      <p className="text-[11px] text-blue-800 dark:text-blue-400 leading-snug">
                        {proposals.length} staged idea{proposals.length !== 1 ? "s" : ""} restored
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setTrayRestored(false)}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-tray-banner-dismiss"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => { setProposals([]); setTrayRestored(false); }}
                          className="text-[10px] text-destructive/70 hover:text-destructive transition-colors"
                          data-testid="button-tray-banner-clear"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 leading-snug mb-1">
                    Drag staged meals onto the planner.
                  </p>
                  <div className="space-y-0.5">
                    {proposals.map(p => (
                      <DraggableProposalCard
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        proposedMealType={p.mealType}
                      >
                        <div
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-dashed border-muted-foreground/30 bg-background hover:border-primary/40 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-colors group"
                          data-testid={`card-proposal-${p.id}`}
                        >
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          <span className="flex-1 text-xs truncate text-foreground">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground/60 shrink-0 capitalize">{p.mealType}</span>
                          <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); removeProposal(p.id); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-opacity shrink-0"
                            title="Remove"
                            data-testid={`button-proposal-remove-${p.id}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </DraggableProposalCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Section C: Continue Planning (shown only when there's pending work) ── */}
      {hasContinueItems && (
        <>
          <div className="w-full h-px bg-border/50" />
          <div data-testid="section-continue-planning">
            <button
              className="w-full flex items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              onClick={() => setContinuePlanningOpen(v => !v)}
              aria-expanded={continuePlanningOpen}
              data-testid="button-section-continue-toggle"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider" data-testid="section-continue-label">
                  Continue Planning
                </span>
                <span className="text-[10px] font-medium bg-muted text-muted-foreground rounded-full px-1.5 leading-4">
                  {proposals.length + placeholderCount}
                </span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-150 ${continuePlanningOpen ? "" : "-rotate-90"}`} />
            </button>
            {continuePlanningOpen && (
              <div className="space-y-1 pb-2" data-testid="section-continue-planning-body">
                {proposals.length > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 text-xs text-muted-foreground"
                    data-testid="text-staged-count"
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    {proposals.length} staged idea{proposals.length !== 1 ? "s" : ""} — drag onto planner
                  </div>
                )}
                {placeholderCount > 0 && (
                  <button
                    className="w-full flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 px-3 py-2 text-left transition-colors"
                    onClick={() => onSetMode("placeholder-review")}
                    data-testid="button-idle-placeholder-review"
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-amber-500/70" />
                    <span className="text-amber-700 dark:text-amber-400/80 flex-1 text-xs">
                      {placeholderCount} unresolved meal{placeholderCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 shrink-0">Review →</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getPanelIcon(mode: AssistantMode) {
  if (mode === "smart") return <Sparkles className="h-4 w-4 text-primary" />;
  if (mode === "smart-review") return <Sparkles className="h-4 w-4 text-primary" />;
  if (mode === "templates") return <LayoutGrid className="h-4 w-4 text-primary" />;
  if (mode === "manual") return <Plus className="h-4 w-4 text-primary" />;
  if (mode === "bulk") return <Calendar className="h-4 w-4 text-primary" />;
  if (mode === "day") return <CalendarDays className="h-4 w-4 text-primary" />;
  if (mode === "scan-review") return <ScanSearch className="h-4 w-4 text-primary" />;
  if (mode === "settings") return <Settings className="h-4 w-4 text-primary" />;
  if (mode === "resolve") return <BookOpen className="h-4 w-4 text-primary" />;
  if (mode === "placeholder-review") return <ClipboardList className="h-4 w-4 text-primary" />;
  return <ScanLine className="h-4 w-4 text-primary" />;
}

function getPanelTitle(mode: AssistantMode, dayLabel?: string) {
  if (mode === "smart") return "Plan My Week";
  if (mode === "smart-review") return "Proposed Week Plan";
  if (mode === "scan") return "Scan Planner";
  if (mode === "scan-review") return "Review Scan";
  if (mode === "templates") return "Templates";
  if (mode === "manual") return "Add Meal";
  if (mode === "bulk") return "Bulk Assign";
  if (mode === "day") return dayLabel || "Day View";
  if (mode === "settings") return "Planner Options";
  if (mode === "resolve") return "Link a Recipe";
  if (mode === "placeholder-review") return "Unlinked Meals";
  return "Planner Assistant";
}

export function PlannerAssistantPanel({
  mode,
  onClose,
  reviewContent,
  user,
  onScanFile,
  onUploadClick,
  scanLoading,
  pickerTarget,
  meals,
  plannerMealIdSet,
  categoryIdForSlot,
  onPickerSelect,
  addingEntry,
  onAddProduct,
  dayViewDay,
  dayViewLabel,
  getMeal,
  onPlannerInvalidate,
  fullPlanner,
  resolveTarget,
  onResolveAction,
  onResolveRecipe,
  isResolving = false,
  placeholderItems = [],
  onResolveRecipeFromReview,
  onBuildFromReview,
  onScanFromReview,
  onImportFromReview,
  onSetMode,
  onCreateIntent,
  selectedDayLabel,
  onBrowseRecipes,
  onBuildRecipe,
  onScanRecipe,
  mobileOpen = false,
  onBackToHub,
  consumedProposalId,
}: PlannerAssistantPanelProps) {
  const isMobile = useIsMobile();
  const [resolveSubview, setResolveSubview] = useState<"menu" | "search">("menu");
  const [reviewSearchTarget, setReviewSearchTarget] = useState<ResolveTarget | null>(null);

  useEffect(() => {
    if (mode !== "resolve") setResolveSubview("menu");
  }, [mode]);

  useEffect(() => {
    if (mode !== "placeholder-review") setReviewSearchTarget(null);
  }, [mode]);

  // Compute title/icon for the active-mode states (used by both mobile Drawer and desktop aside)
  const isSearchSubview =
    (mode === "resolve" && resolveSubview === "search") ||
    (mode === "placeholder-review" && reviewSearchTarget !== null);

  const activeTitleLabel = isSearchSubview ? "Search Recipes" : getPanelTitle(mode, dayViewLabel);
  const activeTitleIcon = isSearchSubview
    ? <Search className="h-4 w-4 text-primary" />
    : getPanelIcon(mode);

  // Panel content (mode-specific; safe to compute when mode is null — all checks are mode === X)
  const panelContent = (
    <>
      {mode === "scan" && (
        <ScanContent
          onScanFile={onScanFile}
          scanLoading={scanLoading}
          onUploadClick={onUploadClick}
        />
      )}
      {mode === "smart" && <SmartContent />}
      {mode === "settings" && <PlannerSettingsContent />}
      {mode === "templates" && (
        <TemplatesPanel inline open onClose={onClose} user={user} />
      )}
      {mode === "manual" && (
        <PlannerMealPickerPanel
          key={pickerTarget ? `${pickerTarget.dayId}-${pickerTarget.mealType}-${pickerTarget.audience}` : "empty"}
          target={pickerTarget}
          meals={meals}
          plannerMealIdSet={plannerMealIdSet}
          categoryIdForSlot={categoryIdForSlot}
          onSelect={onPickerSelect}
          addingEntry={addingEntry}
          onAddProduct={onAddProduct}
        />
      )}
      {mode === "day" && (
        <DayViewDrawer
          inline
          open={false}
          onClose={onClose}
          day={dayViewDay}
          dayLabel={dayViewLabel}
          getMeal={getMeal}
          allMeals={meals}
          onPlannerInvalidate={onPlannerInvalidate}
        />
      )}
      {mode === "bulk" && (
        <PlannerBulkAssignPanel
          fullPlanner={fullPlanner}
          meals={meals}
          plannerMealIdSet={plannerMealIdSet}
          onClose={onClose}
        />
      )}
      {(mode === "smart-review" || mode === "scan-review") && reviewContent}
      {mode === "resolve" && resolveTarget && (
        resolveSubview === "search" ? (
          <ResolveSearchContent
            mealName={resolveTarget.mealName}
            meals={meals}
            onSelectRecipe={(mealId) => {
              if (onResolveRecipe) onResolveRecipe(mealId);
            }}
            onBack={() => setResolveSubview("menu")}
            isResolving={isResolving}
          />
        ) : (
          <ResolveContent
            mealName={resolveTarget.mealName}
            dayName={resolveTarget.dayName}
            slotLabel={resolveTarget.slotLabel}
            onSearch={() => setResolveSubview("search")}
            onAction={(action) => {
              if (onResolveAction) onResolveAction(action);
            }}
          />
        )
      )}
      {mode === "placeholder-review" && (
        reviewSearchTarget ? (
          <ResolveSearchContent
            mealName={reviewSearchTarget.mealName}
            meals={meals}
            onSelectRecipe={(mealId) => {
              if (onResolveRecipeFromReview) onResolveRecipeFromReview(mealId, reviewSearchTarget);
              setReviewSearchTarget(null);
            }}
            onBack={() => setReviewSearchTarget(null)}
            isResolving={isResolving}
          />
        ) : (
          <PlaceholderReviewContent
            placeholderItems={placeholderItems}
            onSearchRecipe={(item) => {
              setReviewSearchTarget({
                mealName: item.mealName,
                dayName: item.dayName,
                slotLabel: item.slotLabel,
                entryId: item.entryId,
                dayId: item.dayId,
                mealType: item.mealType,
                audience: item.audience,
                isDrink: item.isDrink,
                position: item.position,
              });
            }}
            onBuildRecipe={(item) => {
              if (onBuildFromReview) {
                onBuildFromReview({
                  mealName: item.mealName,
                  dayName: item.dayName,
                  slotLabel: item.slotLabel,
                  entryId: item.entryId,
                  dayId: item.dayId,
                  mealType: item.mealType,
                  audience: item.audience,
                  isDrink: item.isDrink,
                  position: item.position,
                });
              } else if (onResolveAction) {
                onResolveAction("build");
              }
            }}
            onScanRecipe={(item) => {
              if (onScanFromReview) {
                onScanFromReview({
                  mealName: item.mealName,
                  dayName: item.dayName,
                  slotLabel: item.slotLabel,
                  entryId: item.entryId,
                  dayId: item.dayId,
                  mealType: item.mealType,
                  audience: item.audience,
                  isDrink: item.isDrink,
                  position: item.position,
                });
              } else if (onResolveAction) {
                onResolveAction("scan");
              }
            }}
            onImportRecipe={onImportFromReview ? (item) => onImportFromReview({
              mealName: item.mealName,
              dayName: item.dayName,
              slotLabel: item.slotLabel,
              entryId: item.entryId,
              dayId: item.dayId,
              mealType: item.mealType,
              audience: item.audience,
              isDrink: item.isDrink,
              position: item.position,
            }) : undefined}
            isResolving={isResolving}
          />
        )
      )}
    </>
  );

  // ── Mobile: vaul Drawer replaces Radix Sheet ─────────────────────────────
  if (isMobile) {
    const drawerOpen = !!(mobileOpen || mode);
    const drawerTitle = mode ? activeTitleLabel : "Planner Assistant";
    const drawerIcon = mode
      ? activeTitleIcon
      : <Lightbulb className="h-4 w-4 text-primary" />;

    const hubContent = onSetMode ? (
      <IdlePanelContent
        onSetMode={onSetMode}
        onCreateIntent={onCreateIntent}
        selectedDayLabel={selectedDayLabel}
        placeholderCount={placeholderItems.length}
        onBrowseRecipes={onBrowseRecipes}
        onBuildRecipe={onBuildRecipe}
        onScanRecipe={onScanRecipe}
        consumedProposalId={consumedProposalId}
      />
    ) : (
      <p className="text-xs text-muted-foreground">Select a mode to get started.</p>
    );

    return (
      <Drawer
        open={drawerOpen}
        onOpenChange={(v) => { if (!v) onClose(); }}
        shouldScaleBackground={false}
      >
        <DrawerContent
          className="flex flex-col max-h-[75vh]"
          data-testid="drawer-planner-assistant"
        >
          {/* Header — drag handle is rendered inside DrawerContent automatically above this */}
          <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
            <div className="flex items-center gap-1.5">
              {mode && onBackToHub && (
                <button
                  onClick={onBackToHub}
                  className="rounded-md p-1 -ml-1 hover:bg-accent/40 text-muted-foreground transition-colors"
                  aria-label="Back to hub"
                  data-testid="button-assistant-back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
                {drawerIcon}
                {drawerTitle}
              </DrawerTitle>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-accent/40 text-muted-foreground transition-colors"
              data-testid="button-assistant-close-mobile"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="w-full h-px bg-border shrink-0" />
          <div
            className="flex-1 overflow-y-auto min-h-0 px-4 pt-3"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            {mode ? panelContent : hubContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: idle sidebar ─────────────────────────────────────────────────
  if (!mode) {
    return (
      <aside
        className="shrink-0 w-64 sticky top-20 self-start border border-sky-100 dark:border-sky-900/40 rounded-xl bg-sky-50/70 dark:bg-sky-950/25 flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden"
        data-testid="panel-planner-assistant-idle"
      >
        <div className="flex items-center px-3 pt-3 pb-2.5 shrink-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Planner Assistant
          </h3>
        </div>
        <div className="w-full h-px bg-border shrink-0" />
        <div className="flex-1 overflow-y-auto min-h-0 px-2.5 pb-3 pt-2.5">
          {onSetMode ? (
            <IdlePanelContent
              onSetMode={onSetMode}
              onCreateIntent={onCreateIntent}
              selectedDayLabel={selectedDayLabel}
              placeholderCount={placeholderItems.length}
              onBrowseRecipes={onBrowseRecipes}
              onBuildRecipe={onBuildRecipe}
              onScanRecipe={onScanRecipe}
              consumedProposalId={consumedProposalId}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Select a mode to get started.</p>
          )}
        </div>
      </aside>
    );
  }

  // ── Desktop: active assistant sidebar ────────────────────────────────────
  return (
    <aside
      className="shrink-0 w-64 sticky top-20 self-start border border-sky-100 dark:border-sky-900/40 rounded-xl bg-sky-50/70 dark:bg-sky-950/25 flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden"
      data-testid="panel-planner-assistant"
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2.5 shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {activeTitleIcon}
          {activeTitleLabel}
        </h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent/40 text-muted-foreground transition-colors"
          data-testid="button-assistant-close"
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="w-full h-px bg-border shrink-0" />
      <div className="flex-1 overflow-y-auto min-h-0 px-2.5 pb-3 pt-2.5">
        {panelContent}
      </div>
    </aside>
  );
}
