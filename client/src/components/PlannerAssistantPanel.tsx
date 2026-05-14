import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, Camera, Upload, X, Loader2, RefreshCw, ScanLine, Sparkles, DollarSign, Shield, Fish, Beef, Salad, LayoutGrid, Plus, Calendar, CalendarDays, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AssistantMode } from "@/contexts/PlannerContext";
import { TemplatesPanel } from "@/components/templates-panel";
import type { User, Meal } from "@shared/schema";
import { PlannerMealPickerPanel } from "@/components/PlannerMealPickerPanel";
import type { EntryTarget, PlannerProductResult } from "@/components/PlannerMealPickerPanel";
import { DayViewDrawer } from "@/components/day-view-drawer";
import { PlannerBulkAssignPanel } from "@/components/PlannerBulkAssignPanel";
import type { FullDay, FullWeek } from "@/lib/planner-types";

interface PlannerAssistantPanelProps {
  mode: AssistantMode;
  onClose: () => void;
  reviewContent?: React.ReactNode;
  user: User | null | undefined;
  onScanFile: (file: File) => void;
  onUploadClick: () => void;
  scanLoading: boolean;
  smartLoading: boolean;
  smartMealsPerDay: string;
  setSmartMealsPerDay: (v: string) => void;
  smartCuisine: string;
  setSmartCuisine: (v: string) => void;
  smartBudget: string;
  setSmartBudget: (v: string) => void;
  smartMaxUPF: string;
  setSmartMaxUPF: (v: string) => void;
  smartFishPerWeek: string;
  setSmartFishPerWeek: (v: string) => void;
  smartRedMeatPerWeek: string;
  setSmartRedMeatPerWeek: (v: string) => void;
  smartVegDays: boolean;
  setSmartVegDays: (v: boolean) => void;
  smartLeftovers: boolean;
  setSmartLeftovers: (v: boolean) => void;
  onRunSmartSuggest: () => void;
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

interface SmartContentProps {
  smartLoading: boolean;
  smartMealsPerDay: string;
  setSmartMealsPerDay: (v: string) => void;
  smartCuisine: string;
  setSmartCuisine: (v: string) => void;
  smartBudget: string;
  setSmartBudget: (v: string) => void;
  smartMaxUPF: string;
  setSmartMaxUPF: (v: string) => void;
  smartFishPerWeek: string;
  setSmartFishPerWeek: (v: string) => void;
  smartRedMeatPerWeek: string;
  setSmartRedMeatPerWeek: (v: string) => void;
  smartVegDays: boolean;
  setSmartVegDays: (v: boolean) => void;
  smartLeftovers: boolean;
  setSmartLeftovers: (v: boolean) => void;
  onRunSmartSuggest: () => void;
}

function SmartContent({
  smartLoading,
  smartMealsPerDay, setSmartMealsPerDay,
  smartCuisine, setSmartCuisine,
  smartBudget, setSmartBudget,
  smartMaxUPF, setSmartMaxUPF,
  smartFishPerWeek, setSmartFishPerWeek,
  smartRedMeatPerWeek, setSmartRedMeatPerWeek,
  smartVegDays, setSmartVegDays,
  smartLeftovers, setSmartLeftovers,
  onRunSmartSuggest,
}: SmartContentProps) {
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

function getPanelIcon(mode: AssistantMode) {
  if (mode === "smart") return <Sparkles className="h-4 w-4 text-primary" />;
  if (mode === "smart-review") return <Sparkles className="h-4 w-4 text-primary" />;
  if (mode === "templates") return <LayoutGrid className="h-4 w-4 text-primary" />;
  if (mode === "manual") return <Plus className="h-4 w-4 text-primary" />;
  if (mode === "bulk") return <Calendar className="h-4 w-4 text-primary" />;
  if (mode === "day") return <CalendarDays className="h-4 w-4 text-primary" />;
  if (mode === "scan-review") return <ScanSearch className="h-4 w-4 text-primary" />;
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
  smartLoading,
  smartMealsPerDay, setSmartMealsPerDay,
  smartCuisine, setSmartCuisine,
  smartBudget, setSmartBudget,
  smartMaxUPF, setSmartMaxUPF,
  smartFishPerWeek, setSmartFishPerWeek,
  smartRedMeatPerWeek, setSmartRedMeatPerWeek,
  smartVegDays, setSmartVegDays,
  smartLeftovers, setSmartLeftovers,
  onRunSmartSuggest,
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
}: PlannerAssistantPanelProps) {
  const isMobile = useIsMobile();

  if (!mode) return null;

  const titleLabel = getPanelTitle(mode, dayViewLabel);
  const titleIcon = getPanelIcon(mode);

  const panelContent = (
    <>
      {mode === "scan" && (
        <ScanContent
          onScanFile={onScanFile}
          scanLoading={scanLoading}
          onUploadClick={onUploadClick}
        />
      )}
      {mode === "smart" && (
        <SmartContent
          smartLoading={smartLoading}
          smartMealsPerDay={smartMealsPerDay}
          setSmartMealsPerDay={setSmartMealsPerDay}
          smartCuisine={smartCuisine}
          setSmartCuisine={setSmartCuisine}
          smartBudget={smartBudget}
          setSmartBudget={setSmartBudget}
          smartMaxUPF={smartMaxUPF}
          setSmartMaxUPF={setSmartMaxUPF}
          smartFishPerWeek={smartFishPerWeek}
          setSmartFishPerWeek={setSmartFishPerWeek}
          smartRedMeatPerWeek={smartRedMeatPerWeek}
          setSmartRedMeatPerWeek={setSmartRedMeatPerWeek}
          smartVegDays={smartVegDays}
          setSmartVegDays={setSmartVegDays}
          smartLeftovers={smartLeftovers}
          setSmartLeftovers={setSmartLeftovers}
          onRunSmartSuggest={onRunSmartSuggest}
        />
      )}
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
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-6 pt-5 h-auto max-h-[85vh] overflow-y-auto"
          data-testid="sheet-planner-assistant"
        >
          <SheetHeader className="flex-row items-center justify-between mb-4 space-y-0">
            <SheetTitle className="text-base flex items-center gap-2">
              {titleIcon}
              {titleLabel}
            </SheetTitle>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-accent/40 text-muted-foreground transition-colors"
              data-testid="button-assistant-close-mobile"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>
          {panelContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className="shrink-0 w-80 sticky top-20 self-start border border-border rounded-xl bg-card flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden"
      data-testid="panel-planner-assistant"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {titleIcon}
          {titleLabel}
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
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 pt-3">
        {panelContent}
      </div>
    </aside>
  );
}
