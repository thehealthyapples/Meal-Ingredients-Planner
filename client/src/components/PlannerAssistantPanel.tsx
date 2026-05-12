import { useState, useEffect } from "react";
import { Camera, Upload, X, Loader2, ScanLine, Sparkles, DollarSign, Shield, Fish, Beef, Salad, LayoutGrid, Plus } from "lucide-react";
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

interface PlannerAssistantPanelProps {
  mode: AssistantMode;
  onClose: () => void;
  user: User | null | undefined;
  onOpenCamera: () => void;
  onUploadFile: () => void;
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

interface ScanContentProps {
  onOpenCamera: () => void;
  onUploadFile: () => void;
  scanLoading: boolean;
}

function ScanContent({ onOpenCamera, onUploadFile, scanLoading }: ScanContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 bg-muted/40 rounded-lg px-3 py-3">
        <ScanLine className="h-7 w-7 shrink-0 text-primary/60 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Photograph your handwritten or printed meal plan and we'll extract the meals into your planner.
        </p>
      </div>
      <div className="space-y-2">
        <Button
          className="w-full"
          onClick={onOpenCamera}
          disabled={scanLoading}
          data-testid="button-assistant-take-photo"
        >
          {scanLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          Take Photo
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={onUploadFile}
          disabled={scanLoading}
          data-testid="button-assistant-upload"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
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
  if (mode === "templates") return <LayoutGrid className="h-4 w-4 text-primary" />;
  if (mode === "manual") return <Plus className="h-4 w-4 text-primary" />;
  return <ScanLine className="h-4 w-4 text-primary" />;
}

function getPanelTitle(mode: AssistantMode) {
  if (mode === "smart") return "Plan My Week";
  if (mode === "scan") return "Scan Planner";
  if (mode === "templates") return "Templates";
  if (mode === "manual") return "Add Meal";
  return "Planner Assistant";
}

export function PlannerAssistantPanel({
  mode,
  onClose,
  user,
  onOpenCamera,
  onUploadFile,
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
}: PlannerAssistantPanelProps) {
  const isMobile = useIsMobile();

  if (!mode) return null;

  const titleLabel = getPanelTitle(mode);
  const titleIcon = getPanelIcon(mode);

  const panelContent = (
    <>
      {mode === "scan" && (
        <ScanContent
          onOpenCamera={onOpenCamera}
          onUploadFile={onUploadFile}
          scanLoading={scanLoading}
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
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-6 pb-8 pt-6 h-auto max-h-[85vh] overflow-y-auto"
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
      className="shrink-0 w-72 sticky top-20 self-start border border-border rounded-xl bg-card p-4 flex flex-col gap-3 max-h-[calc(100vh-6rem)] overflow-y-auto"
      data-testid="panel-planner-assistant"
    >
      <div className="flex items-center justify-between">
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
      <div className="w-full h-px bg-border" />
      {panelContent}
    </aside>
  );
}
