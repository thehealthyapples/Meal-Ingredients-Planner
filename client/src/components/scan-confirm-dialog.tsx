import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Plus, X, ChevronDown, Loader2, AlertTriangle, Camera } from "lucide-react";
import { IngredientRow, parseIngredientString, buildIngredientString } from "@/components/ingredient-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { api } from "@shared/routes";

type ScanResult =
  | { type: "recipe"; title: string; servings: number; ingredients: string[]; steps: string[]; confidence: "high" | "low" }
  | { type: "meal_plan"; days: { day: string; meals: string[] }[]; confidence: "high" | "low" }
  | { type: "unknown"; rawText: string };

interface ScanResponse {
  rawText: string;
  parsed: ScanResult;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanData: ScanResponse | null;
}

const WEEK_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"];
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_OF_WEEK_MAP: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

function RecipeForm({ parsed, rawText, onClose }: {
  parsed: Extract<ScanResult, { type: "recipe" }>;
  rawText: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(parsed.title || "");
  const [servings, setServings] = useState(parsed.servings || 1);
  type IngredientEntry = { amount: string; unit: string; name: string };
  const [ingredients, setIngredients] = useState<IngredientEntry[]>(
    parsed.ingredients.length
      ? parsed.ingredients.map(parseIngredientString)
      : [{ amount: "", unit: "", name: "" }]
  );
  const [steps, setSteps] = useState<string[]>(parsed.steps.length ? parsed.steps : [""]);
  const [rawOpen, setRawOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.meals.create.path, {
        name: title.trim() || "Scanned Recipe",
        ingredients: ingredients.map(i => buildIngredientString(i.amount, i.unit, i.name)).filter(Boolean),
        instructions: steps.filter(Boolean).join("\n"),
        servings,
        audience: "adult",
        isDrink: false,
      });
      return res;
    },
    onSuccess: () => {
      toast({ title: "Recipe saved", description: title });
      qc.invalidateQueries({ queryKey: [api.meals.list.path] });
      onClose();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Could not save recipe", description: err?.message || "Please try again." });
    },
  });

  const updateIngredientField = (i: number, field: "amount" | "unit" | "name", val: string) =>
    setIngredients(prev => prev.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i));
  const addIngredient = () => setIngredients(prev => [...prev, { amount: "", unit: "", name: "" }]);

  const updateStep = (i: number, val: string) => setSteps(prev => prev.map((x, idx) => idx === i ? val : x));
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));
  const addStep = () => setSteps(prev => [...prev, ""]);

  return (
    <div className="space-y-5">
      {parsed.confidence === "low" && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>The scan quality was low - please review and correct the fields below.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Recipe title</label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Recipe name"
          data-testid="input-scan-title"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Servings</label>
        <Input
          type="number"
          min={1}
          max={50}
          value={servings}
          onChange={e => setServings(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-24"
          data-testid="input-scan-servings"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Ingredients</label>
          <Button type="button" variant="ghost" size="sm" onClick={addIngredient} data-testid="button-scan-add-ingredient">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        <div className="text-xs text-muted-foreground flex gap-2 px-0.5">
          <span className="w-14 shrink-0 text-center">Qty</span>
          <span className="w-[72px] shrink-0">Unit</span>
          <span className="flex-1">Ingredient</span>
        </div>
        <div className="space-y-1.5">
          {ingredients.map((ing, i) => (
            <div key={i}>
              <IngredientRow
                index={i}
                amount={ing.amount}
                unit={ing.unit}
                name={ing.name}
                onAmountChange={v => updateIngredientField(i, "amount", v)}
                onUnitChange={v => updateIngredientField(i, "unit", v)}
                onNameChange={v => updateIngredientField(i, "name", v)}
                onRemove={() => removeIngredient(i)}
                showRemove={ingredients.length > 1}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Steps</label>
          <Button type="button" variant="ghost" size="sm" onClick={addStep} data-testid="button-scan-add-step">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                placeholder={`Step ${i + 1}`}
                rows={2}
                className="flex-1 min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid={`input-scan-step-${i}`}
              />
              {steps.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 self-start mt-1" onClick={() => removeStep(i)} data-testid={`button-scan-remove-step-${i}`}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {rawText && (
        <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-between" data-testid="button-scan-raw-toggle">
              Raw OCR text <ChevronDown className={`h-3.5 w-3.5 transition-transform ${rawOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 rounded-md bg-muted px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground max-h-40 overflow-y-auto" data-testid="pre-scan-raw-text">{rawText}</pre>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Separator />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose} data-testid="button-scan-cancel">Cancel</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title.trim()} data-testid="button-scan-save-recipe">
          {saveMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</> : "Save Recipe"}
        </Button>
      </div>
    </div>
  );
}

function MealPlanForm({ parsed, onClose }: {
  parsed: Extract<ScanResult, { type: "meal_plan" }>;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [weekIdx, setWeekIdx] = useState(0);
  const [editableDays, setEditableDays] = useState(
    DAY_ORDER
      .map(day => {
        const found = parsed.days.find(d => d.day === day);
        return { day, meals: found ? [...found.meals] : [] };
      })
      .filter(d => d.meals.length > 0)
  );
  const [importing, setImporting] = useState(false);

  const { data: plannerData } = useQuery<any>({
    queryKey: ["/api/planner/full"],
  });

  const updateMeal = (dayIdx: number, mealIdx: number, val: string) => {
    setEditableDays(prev => prev.map((d, di) =>
      di === dayIdx ? { ...d, meals: d.meals.map((m, mi) => mi === mealIdx ? val : m) } : d
    ));
  };

  const importToPlanner = async () => {
    if (!plannerData?.weeks?.[weekIdx]) {
      toast({ variant: "destructive", title: "Planner not loaded", description: "Please try again." });
      return;
    }

    setImporting(true);
    const week = plannerData.weeks[weekIdx];
    let imported = 0;

    try {
      for (const { day, meals } of editableDays) {
        const targetDow = DAY_OF_WEEK_MAP[day];
        const plannerDay = week.days?.find((d: any) => d.dayOfWeek === targetDow);
        if (!plannerDay) continue;

        for (const mealName of meals) {
          if (!mealName.trim()) continue;

          let mealId: number | null = null;

          try {
            const searchRes = await apiRequest("GET", `/api/meals?search=${encodeURIComponent(mealName.trim())}&limit=1`);
            const searchData = await searchRes.json?.() ?? searchRes;
            const results = Array.isArray(searchData) ? searchData : searchData?.meals ?? [];
            if (results.length > 0) {
              mealId = results[0].id;
            }
          } catch {}

          if (!mealId) {
            try {
              const createRes = await apiRequest("POST", api.meals.create.path, {
                name: mealName.trim(),
                ingredients: [],
                servings: 1,
                audience: "adult",
                isDrink: false,
              });
              const created = await createRes.json?.() ?? createRes;
              mealId = created?.id ?? null;
            } catch {}
          }

          if (!mealId) continue;

          try {
            await apiRequest("POST", `/api/planner/days/${plannerDay.id}/items`, {
              mealType: "dinner",
              audience: "adult",
              mealId,
              position: 0,
              isDrink: false,
              drinkType: null,
            });
            imported++;
          } catch {}
        }
      }

      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      qc.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: `Planner updated for ${WEEK_LABELS[weekIdx]}`, description: `${imported} meal${imported !== 1 ? "s" : ""} added.` });
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: "Import failed", description: "Some meals could not be imported." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {parsed.confidence === "low" && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>The scan quality was low - please review the days and meals below before importing.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Import to week</label>
        <Select value={String(weekIdx)} onValueChange={v => setWeekIdx(Number(v))}>
          <SelectTrigger className="w-40" data-testid="select-scan-week">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEK_LABELS.map((label, i) => (
              <SelectItem key={i} value={String(i)}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Detected meals</label>
        {editableDays.map((d, di) => (
          <div key={d.day} className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{d.day}</p>
            {d.meals.map((meal, mi) => (
              <Input
                key={mi}
                value={meal}
                onChange={e => updateMeal(di, mi, e.target.value)}
                placeholder="Recipe name"
                data-testid={`input-scan-meal-${di}-${mi}`}
              />
            ))}
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose} data-testid="button-scan-cancel-plan">Cancel</Button>
        <Button onClick={importToPlanner} disabled={importing || editableDays.length === 0} data-testid="button-scan-import-plan">
          {importing ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Importing…</> : "Import to Planner"}
        </Button>
      </div>
    </div>
  );
}

function UnknownForm({ rawText, onClose }: { rawText: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">We couldn't parse this - you can copy the text manually.</p>
      <textarea
        readOnly
        value={rawText}
        rows={10}
        className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm whitespace-pre-wrap text-muted-foreground resize-y"
        data-testid="textarea-scan-unknown"
      />
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose} data-testid="button-scan-close-unknown">Close</Button>
      </div>
    </div>
  );
}

export function ScanConfirmDialog({ open, onOpenChange, scanData }: Props) {
  const handleClose = () => onOpenChange(false);

  const getTitle = () => {
    if (!scanData) return "Scan Result";
    if (scanData.parsed.type === "recipe") return "Scanned Recipe";
    if (scanData.parsed.type === "meal_plan") return "Scanned Meal Plan";
    return "Scan Result";
  };

  const getDescription = () => {
    if (!scanData) return "";
    if (scanData.parsed.type === "recipe") return "Review and edit the extracted recipe before saving.";
    if (scanData.parsed.type === "meal_plan") return "Review the detected meals and choose a planner week.";
    return "We extracted the text below but couldn't determine the format.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {getTitle()}
            {scanData?.parsed.type !== "unknown" && (
              <Badge variant="secondary" className="text-xs capitalize ml-1">
                {scanData?.parsed.type === "recipe" ? "Recipe" : "Meal Plan"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        {scanData?.parsed.type === "recipe" && (
          <RecipeForm parsed={scanData.parsed} rawText={scanData.rawText} onClose={handleClose} />
        )}
        {scanData?.parsed.type === "meal_plan" && (
          <MealPlanForm parsed={scanData.parsed} onClose={handleClose} />
        )}
        {scanData?.parsed.type === "unknown" && (
          <UnknownForm rawText={scanData.rawText || scanData.parsed.rawText} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
