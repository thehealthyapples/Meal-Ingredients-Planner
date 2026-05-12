import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ChevronDown, Loader2, Plus, X, Camera, Strikethrough, Sparkles, WifiOff } from "lucide-react";
import { IngredientRow, parseIngredientString, buildIngredientString } from "@/components/ingredient-input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

// TODO (future phase - multi-page recipe capture):
//   Some recipes span multiple pages (cookbook page 1 + page 2, or ingredients page + steps page).
//   Affected areas: CameraModal (multi-capture flow), RecipeScanReview (merge/ordering UI),
//   /api/scan route (accept array of images), recipeParser (merge DestinationParsed results).
//   Storage: no schema change needed until merge strategy is decided.
//   Ordering concern: ingredients/steps from page 2 must append, not overwrite.
//
// TODO (future phase - recipe photos):
//   Users may want to attach a cookbook cover image, a finished meal photo, or a user-taken
//   food photo to a saved recipe.
//   Affected areas: meals schema (imageUrl field), CreateMealDialog, meal card display.
//   Storage: likely Cloudflare R2 / presigned URL; do NOT store base64 in DB.
//   Architecture: separate upload endpoint from scan endpoint; scan is OCR, photo is display-only.

export interface ScannedIngredient {
  rawText: string;
  quantity: string | null;
  unit: string | null;
  name: string;
  struckThrough: boolean;
  uncertain: boolean;
}

export interface ScannedStep {
  rawText: string;
  stepNumber: number;
  uncertain: boolean;
}

export interface RecipeScanData {
  mode: "recipe";
  rawText: string;
  parsed: {
    mode: "recipe";
    title: string | null;
    servings: number | null;
    ingredients: ScannedIngredient[];
    steps: ScannedStep[];
    warnings: string[];
  } | null;
  parsedBy: "vision" | "ocr-fallback" | "failed";
  confidence: "high" | "medium" | "low" | "none";
  warnings: string[];
}

interface EditableIngredient {
  id: number;
  amount: string;
  unit: string;
  name: string;
  rawText: string;
  struckThrough: boolean;
  uncertain: boolean;
  struckDecision: "include" | "exclude" | "pending";
}

interface EditableStep {
  id: number;
  text: string;
  uncertain: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanData: RecipeScanData | null;
  /** True while the server-side scan request is in flight. Modal stays open and shows loading UI. */
  scanning?: boolean;
  /** Set to a message when the scan request failed. Shown inside the modal. */
  scanError?: string;
  onSaved?: () => void;
  /** Called after the meal is successfully created, with the new meal's id and name. */
  onMealCreated?: (mealId: number, mealName: string) => void;
}

const SCAN_LOADING_MESSAGES = [
  "Reading recipe...",
  "Understanding ingredients...",
  "Preparing editable draft...",
] as const;

function toEditableIngredient(ing: ScannedIngredient, id: number): EditableIngredient {
  // Vision AI may return quantity as a number despite the string type; coerce at this boundary
  // so downstream code (buildIngredientString) always receives a string.
  const rawQty = (ing as any).quantity;
  const amount = rawQty != null ? String(rawQty) : "";
  return {
    id,
    amount,
    unit: ing.unit != null ? String(ing.unit) : "",
    name: ing.name,
    rawText: ing.rawText,
    struckThrough: ing.struckThrough,
    uncertain: ing.uncertain,
    struckDecision: ing.struckThrough ? "pending" : "include",
  };
}

export function RecipeScanReview({ open, onOpenChange, scanData, scanning = false, scanError, onSaved, onMealCreated }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rawOpen, setRawOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Cycle through staged loading messages while scan is in flight.
  useEffect(() => {
    if (!scanning) {
      setLoadingMsgIdx(0);
      return;
    }
    setLoadingMsgIdx(0);
    const t1 = setTimeout(() => setLoadingMsgIdx(1), 4000);
    const t2 = setTimeout(() => setLoadingMsgIdx(2), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [scanning]);

  const initTitle = () => scanData?.parsed?.title ?? "";
  const initServings = () => scanData?.parsed?.servings ?? 1;
  const initIngredients = (): EditableIngredient[] =>
    (scanData?.parsed?.ingredients ?? []).map((ing, i) => toEditableIngredient(ing, i));
  const initSteps = (): EditableStep[] =>
    (scanData?.parsed?.steps ?? []).map((s, i) => ({ id: i, text: s.rawText, uncertain: s.uncertain }));

  const [title, setTitle] = useState(initTitle);
  const [servings, setServings] = useState(initServings);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>(initIngredients);
  const [steps, setSteps] = useState<EditableStep[]>(initSteps);

  // Re-initialise when new scanData arrives.
  const [lastScanData, setLastScanData] = useState<RecipeScanData | null>(null);
  if (scanData !== lastScanData) {
    setLastScanData(scanData);
    setTitle(initTitle());
    setServings(initServings());
    setIngredients(initIngredients());
    setSteps(initSteps());
    setRawOpen(false);
  }

  // Explicit close: always allowed (used by Cancel button, even during scanning).
  const handleClose = () => onOpenChange(false);

  const updateIngredient = (id: number, field: keyof EditableIngredient, value: unknown) => {
    setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const removeIngredient = (id: number) => setIngredients(prev => prev.filter(ing => ing.id !== id));
  const addIngredient = () => {
    const nextId = (ingredients[ingredients.length - 1]?.id ?? -1) + 1;
    setIngredients(prev => [...prev, { id: nextId, amount: "", unit: "", name: "", rawText: "", struckThrough: false, uncertain: false, struckDecision: "include" }]);
  };

  const updateStep = (id: number, text: string) => setSteps(prev => prev.map(s => s.id === id ? { ...s, text } : s));
  const removeStep = (id: number) => setSteps(prev => prev.filter(s => s.id !== id));
  const addStep = () => {
    const nextId = (steps[steps.length - 1]?.id ?? -1) + 1;
    setSteps(prev => [...prev, { id: nextId, text: "", uncertain: false }]);
  };

  const hasPendingStruckDecision = ingredients.some(
    ing => ing.struckThrough && ing.struckDecision === "pending"
  );
  const hasUncertainIngredients = ingredients.some(ing => ing.uncertain && !ing.struckThrough);
  const isFailedParse = !scanData?.parsed || scanData.parsedBy === "failed";

  const canConfirm = !hasPendingStruckDecision && !hasUncertainIngredients && !!title.trim();

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const includedIngredients = ingredients
        .filter(ing => ing.struckDecision !== "exclude")
        .map(ing => buildIngredientString(ing.amount, ing.unit, ing.name))
        .filter(Boolean);

      const instructions = steps
        .map(s => s.text.trim())
        .filter(Boolean);

      const mealRes = await apiRequest("POST", api.meals.create.path, {
        name: title.trim() || "Scanned Recipe",
        ingredients: includedIngredients,
        instructions,
        servings,
        audience: "adult",
        isDrink: false,
      });
      const savedMeal = await mealRes.json();

      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
      toast({ title: "Recipe saved", description: title.trim() || "Scanned Recipe" });
      onMealCreated?.(savedMeal.id, savedMeal.name || title.trim() || "Scanned Recipe");
      onSaved?.();
      handleClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Could not save recipe",
        description: err?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const allWarnings = [
    ...(scanData?.warnings ?? []),
    ...(scanData?.parsed?.warnings ?? []),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Block Escape/overlay-click closes while scan is in flight.
        // The explicit Cancel button calls handleClose() directly, bypassing this guard.
        if (!newOpen && scanning) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {scanning ? "Scanning recipe…" : "Review scanned recipe"}
            <Badge variant="secondary" className="text-xs ml-1">Recipe</Badge>
          </DialogTitle>
          <DialogDescription>
            {scanning
              ? "AI recipe scans can take around 5–15 seconds depending on image quality."
              : "Review and edit the recipe below before saving. Nothing is saved until you confirm."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Loading state - scan in flight */}
          {scanning && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {SCAN_LOADING_MESSAGES[loadingMsgIdx]}
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                AI recipe scans can take around 5–15 seconds depending on image quality.
              </p>
              <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
                Cancel scan
              </Button>
            </div>
          )}

          {/* Scan error state */}
          {!scanning && scanError && !scanData && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{scanError}</span>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleClose}>Close</Button>
              </div>
            </div>
          )}

          {/* Normal review content - only when not scanning and no top-level error */}
          {!scanning && !(scanError && !scanData) && (<>
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

          {/* Confidence banner (non-fallback) */}
          {scanData?.parsedBy !== "ocr-fallback" && (scanData?.confidence === "low") && !isFailedParse && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Scan quality was low - please review all fields carefully.</span>
            </div>
          )}

          {/* Recipe-level warnings (not fallback warnings) */}
          {allWarnings.filter(w => !w.includes("AI image service") && !w.includes("AI had trouble")).map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}

          {isFailedParse ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                We couldn't extract a recipe from this image. Check the raw text below or try a clearer photo.
              </p>
              {scanData?.rawText && (
                <pre className="rounded-md bg-muted px-3 py-2 text-xs whitespace-pre-wrap text-muted-foreground max-h-48 overflow-y-auto">
                  {scanData.rawText}
                </pre>
              )}
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Recipe title</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Recipe name"
                />
              </div>

              {/* Servings */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Servings</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={servings}
                  onChange={e => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Ingredients</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addIngredient}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground flex gap-2 px-0.5">
                  <span className="w-14 shrink-0 text-center">Qty</span>
                  <span className="w-[72px] shrink-0">Unit</span>
                  <span className="flex-1">Ingredient</span>
                </div>
                <div className="space-y-2">
                  {ingredients.map(ing => (
                    <div key={ing.id} className="space-y-1">
                      {/* Struck-through decision banner */}
                      {ing.struckThrough && (
                        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300">
                          <Strikethrough className="h-3.5 w-3.5 shrink-0" />
                          <span className="flex-1">Struck through in original - include or exclude?</span>
                          <Button
                            type="button"
                            size="sm"
                            variant={ing.struckDecision === "include" ? "default" : "outline"}
                            className="h-6 text-xs px-2"
                            onClick={() => updateIngredient(ing.id, "struckDecision", "include")}
                          >
                            Include
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={ing.struckDecision === "exclude" ? "destructive" : "outline"}
                            className="h-6 text-xs px-2"
                            onClick={() => updateIngredient(ing.id, "struckDecision", "exclude")}
                          >
                            Exclude
                          </Button>
                        </div>
                      )}
                      {/* Uncertain ingredient warning */}
                      {ing.uncertain && !ing.struckThrough && (
                        <div className="flex items-center gap-1.5 px-1">
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
                            Check this
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">Read as: {ing.rawText}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-5 text-xs px-1.5 ml-auto"
                            onClick={() => updateIngredient(ing.id, "uncertain", false)}
                          >
                            Confirm
                          </Button>
                        </div>
                      )}
                      <div className={ing.struckDecision === "exclude" ? "opacity-40 line-through" : ""}>
                        <IngredientRow
                          index={ing.id}
                          amount={ing.amount}
                          unit={ing.unit}
                          name={ing.name}
                          onAmountChange={v => updateIngredient(ing.id, "amount", v)}
                          onUnitChange={v => updateIngredient(ing.id, "unit", v)}
                          onNameChange={v => updateIngredient(ing.id, "name", v)}
                          onRemove={() => removeIngredient(ing.id)}
                          showRemove
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Steps</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addStep}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        {step.uncertain && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
                            Check this
                          </Badge>
                        )}
                        <textarea
                          value={step.text}
                          onChange={e => updateStep(step.id, e.target.value)}
                          placeholder={`Step ${idx + 1}`}
                          rows={2}
                          className="w-full min-h-[56px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      {steps.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 self-start mt-1"
                          onClick={() => removeStep(step.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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

          {/* Confirm gate hints */}
          {!isFailedParse && !canConfirm && (
            <p className="text-xs text-muted-foreground">
              {hasPendingStruckDecision && "Decide include/exclude for struck-through ingredients. "}
              {hasUncertainIngredients && "Confirm uncertain ingredients. "}
              {!title.trim() && "Add a recipe title. "}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            {!isFailedParse && (
              <Button
                onClick={handleConfirm}
                disabled={saving || !canConfirm}
                title={!canConfirm ? "Resolve all issues above before saving" : undefined}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</>
                  : "Save Recipe"}
              </Button>
            )}
          </div>
          </>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
