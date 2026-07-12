import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Check, ChevronDown, ChevronUp, Loader2, AlertTriangle, Pencil, ShieldCheck } from "lucide-react";
import type { Meal } from "@shared/schema";
import type { HouseholdSafePreview } from "@shared/meal-adaptation";

// ─── Variant name generation ───────────────────────────────────────────────────

function extractIngredientNameClient(s: string): string {
  return s
    .replace(/^\d+(\.\d+)?\s*(g|kg|ml|l|tblsp?|tbsp?|tsp|oz|lb|lbs|rashers?|cloves?|sticks?|medium|large|small|x)\.?\s+/i, "")
    .replace(/^[½¼¾]\s+/, "")
    .trim();
}

export function generateVariantName(
  originalName: string,
  preview: HouseholdSafePreview,
): string {
  const accommodates = preview.accommodates ?? [];
  const changes = preview.ingredientChanges;

  const isVegan = accommodates.some(a => /\bvegan\b/i.test(a.restriction));
  const isVegetarian = isVegan || accommodates.some(a => /\bvegetarian\b/i.test(a.restriction));
  const isDairyFree = !isVegetarian && accommodates.some(a => /\bdairy[\s-]?free\b|\bdairy\b/i.test(a.restriction));
  const isGlutenFree = !isVegetarian && !isDairyFree && accommodates.some(a => /\bgluten[\s-]?free\b|\bgluten\b/i.test(a.restriction));

  let prefix = "";
  if (isVegan) prefix = "Vegan";
  else if (isVegetarian) prefix = "Vegetarian";
  else if (isDairyFree) prefix = "Dairy-Free";
  else if (isGlutenFree) prefix = "Gluten-Free";

  if (!prefix) return `${originalName} (Household-Safe)`;

  let name = originalName;
  if (isVegetarian || isVegan) {
    const proteinSwap = changes.find(
      c =>
        c.replacement !== null &&
        /\b(beef|pork|chicken|lamb|fish|prawn|shrimp|mince|minced|meat|turkey|salmon|cod|haddock|tuna|bacon|sausage)\b/i.test(c.original),
    );
    if (proteinSwap?.replacement) {
      const origIngName = extractIngredientNameClient(proteinSwap.original);
      const replIngName = extractIngredientNameClient(proteinSwap.replacement);
      if (origIngName && replIngName && origIngName.toLowerCase() !== replIngName.toLowerCase()) {
        const origWords = origIngName.split(/\s+/).filter(w => w.length > 3);
        for (const word of origWords) {
          const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const wordRe = new RegExp(`\\b${escaped}s?\\b`, "gi");
          if (wordRe.test(name)) {
            name = name.replace(wordRe, replIngName);
            break;
          }
        }
      }
    }
  }

  if (name.toLowerCase().startsWith(prefix.toLowerCase())) return name;
  return `${prefix} ${name}`;
}

// ─── Step diff ────────────────────────────────────────────────────────────────

interface StepEntry {
  adapted: string;
  original?: string;
  isChanged: boolean;
  adaptedIndex: number;
}

function normalizeStep(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function stepSimilarity(a: string, b: string): number {
  const na = normalizeStep(a);
  const nb = normalizeStep(b);
  if (na === nb) return 1;
  const aWords = na.split(" ").filter(w => w.length > 2);
  const bWords = new Set(nb.split(" ").filter(w => w.length > 2));
  if (aWords.length === 0 || bWords.size === 0) return 0;
  const common = aWords.filter(w => bWords.has(w)).length;
  return common / Math.max(aWords.length, bWords.size);
}

function buildStepDiff(originalSteps: string[], adaptedSteps: string[]): StepEntry[] {
  if (adaptedSteps.length === 0) {
    return originalSteps.map((s, i) => ({ adapted: s, original: s, isChanged: false, adaptedIndex: i }));
  }
  const maxLen = Math.max(originalSteps.length, adaptedSteps.length);
  const entries: StepEntry[] = [];
  for (let i = 0; i < maxLen; i++) {
    const orig = originalSteps[i];
    const adpt = adaptedSteps[i] ?? "";
    if (!orig) {
      entries.push({ adapted: adpt, isChanged: true, adaptedIndex: i });
    } else {
      const sim = stepSimilarity(orig, adpt || "");
      entries.push({ adapted: adpt || orig, original: orig, isChanged: sim < 0.8, adaptedIndex: i });
    }
  }
  return entries;
}

// Group consecutive unchanged steps together for collapsing
interface UnchangedGroup { type: "unchanged"; entries: StepEntry[]; startIndex: number }
interface ChangedEntry { type: "changed"; entry: StepEntry }
type DiffGroup = UnchangedGroup | ChangedEntry;

function groupDiff(entries: StepEntry[]): DiffGroup[] {
  const groups: DiffGroup[] = [];
  let unchangedBuffer: StepEntry[] = [];
  let bufferStart = 0;

  function flushUnchanged() {
    if (unchangedBuffer.length > 0) {
      groups.push({ type: "unchanged", entries: [...unchangedBuffer], startIndex: bufferStart });
      unchangedBuffer = [];
    }
  }

  for (const entry of entries) {
    if (!entry.isChanged) {
      if (unchangedBuffer.length === 0) bufferStart = entry.adaptedIndex;
      unchangedBuffer.push(entry);
    } else {
      flushUnchanged();
      groups.push({ type: "changed", entry });
    }
  }
  flushUnchanged();
  return groups;
}

// ─── Reason chip derivation ────────────────────────────────────────────────────

function deriveReasonChips(preview: HouseholdSafePreview): string[] {
  const chips = new Set<string>();
  for (const { restriction } of preview.accommodates ?? []) {
    const r = restriction.toLowerCase();
    if (/vegan/.test(r)) chips.add("Vegan substitution");
    else if (/vegetarian/.test(r)) chips.add("Vegetarian substitution");
    if (/dairy/.test(r)) chips.add("Dairy-free substitution");
    if (/gluten/.test(r)) chips.add("Gluten-free adjustment");
    if (/nut/.test(r)) chips.add("Nut-free adjustment");
  }
  // Check method changes for cooking technique clues
  const allMethod = preview.methodChanges.join(" ").toLowerCase();
  if (/simmer|longer|extra.*min/.test(allMethod)) chips.add("Longer simmer required");
  if (/moisture|liquid|water|stock/.test(allMethod)) chips.add("Moisture adjustment");
  return Array.from(chips);
}

// ─── Summary banner data ──────────────────────────────────────────────────────

function deriveBadges(preview: HouseholdSafePreview): string[] {
  const badges = new Set<string>();
  for (const { restriction } of preview.accommodates ?? []) {
    const r = restriction.toLowerCase();
    if (/\bvegan\b/.test(r)) { badges.add("Vegan"); badges.add("Vegetarian"); }
    else if (/\bvegetarian\b/.test(r)) badges.add("Vegetarian");
    if (/\bdairy[\s-]?free\b|\bdairy\b/.test(r)) badges.add("Dairy-Free");
    if (/\bgluten[\s-]?free\b|\bgluten\b/.test(r)) badges.add("Gluten-Free");
  }
  return Array.from(badges);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AdaptationReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: number;
  preview: HouseholdSafePreview;
  /** The meal whose instructions are used as the "before" baseline for the diff */
  baseMeal: { name: string; instructions?: string[] | null };
  /** Name of the original recipe for the "Variant of" display */
  originalMealName: string;
  onAccepted: (variantMeal: Meal) => void;
}

export function AdaptationReviewSheet({
  open,
  onOpenChange,
  entryId,
  preview,
  baseMeal,
  originalMealName,
  onAccepted,
}: AdaptationReviewSheetProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const suggestedName = useMemo(
    () => generateVariantName(originalMealName, preview),
    [originalMealName, preview],
  );

  const [variantName, setVariantName] = useState(suggestedName);
  const [editingName, setEditingName] = useState(false);

  // Step diff
  const originalSteps = useMemo(() => baseMeal.instructions ?? [], [baseMeal.instructions]);
  const stepEntries = useMemo(
    () => buildStepDiff(originalSteps, preview.methodChanges),
    [originalSteps, preview.methodChanges],
  );
  const diffGroups = useMemo(() => groupDiff(stepEntries), [stepEntries]);
  const changedStepCount = stepEntries.filter(e => e.isChanged).length;

  // User edits to changed steps (index → edited text)
  const [editedSteps, setEditedSteps] = useState<Map<number, string>>(new Map());
  const [expandedUnchanged, setExpandedUnchanged] = useState<Set<number>>(new Set());
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  const reasonChips = useMemo(() => deriveReasonChips(preview), [preview]);
  const badges = useMemo(() => deriveBadges(preview), [preview]);

  // Build final instructions array from diff + user edits
  const finalInstructions = useMemo(() => {
    return stepEntries.map(e => editedSteps.get(e.adaptedIndex) ?? e.adapted);
  }, [stepEntries, editedSteps]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/planner/entries/${entryId}/accept-household-safe-variant`, {
        variantName: variantName.trim() || suggestedName,
        editedInstructions: finalInstructions,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).message ?? "Failed to save variant");
      }
      return res.json() as Promise<{ variantMeal: Meal; originalMealId: number }>;
    },
    onSuccess: data => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
      onAccepted(data.variantMeal);
      onOpenChange(false);
    },
    onError: (err: Error) => {
      // PX1-W0 (fnd-px-technical-errors-to-household): forwarded the raw response body.
      console.error("[adaptation:save-variant]", err);
      toast({ title: "Couldn't save this version", description: "Your original recipe is untouched. Please try again.", variant: "destructive" });
    },
  });

  // Reset editable name when preview/originalMealName changes
  // (using useMemo above for initial, then allow user to edit)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92dvh] flex flex-col p-0 rounded-t-2xl overflow-hidden">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <SheetTitle className="text-base">Adaptation Review</SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review all changes before saving your household-safe version.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* ── Summary banner ───────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5 items-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200/60 dark:border-teal-800/40">
            {preview.ingredientChanges.length > 0 && (
              <span className="text-xs font-medium text-teal-800 dark:text-teal-300">
                {preview.ingredientChanges.length} ingredient {preview.ingredientChanges.length === 1 ? "swap" : "swaps"}
              </span>
            )}
            {changedStepCount > 0 && (
              <>
                <span className="text-teal-300 dark:text-teal-600 text-xs">·</span>
                <span className="text-xs font-medium text-teal-800 dark:text-teal-300">
                  {changedStepCount} method {changedStepCount === 1 ? "change" : "changes"}
                </span>
              </>
            )}
            {badges.map(b => (
              <Badge
                key={b}
                variant="outline"
                className="text-[10px] border-teal-400/60 text-teal-700 dark:text-teal-300 bg-white/50 dark:bg-transparent"
              >
                {b}
              </Badge>
            ))}
          </div>

          {/* ── Variant name ─────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Variant name</label>
              <button
                onClick={() => setEditingName(e => !e)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                <Pencil className="h-3 w-3" />
                {editingName ? "Done" : "Edit"}
              </button>
            </div>
            {editingName ? (
              <Input
                value={variantName}
                onChange={e => setVariantName(e.target.value)}
                className="text-sm h-8"
                placeholder={suggestedName}
                autoFocus
              />
            ) : (
              <div className="text-sm font-medium px-3 py-2 bg-muted/40 rounded-md">{variantName || suggestedName}</div>
            )}
            <p className="text-xs text-muted-foreground">Variant of: {originalMealName}</p>
          </div>

          {/* ── Ingredient swaps ─────────────────────────────────────────── */}
          {preview.ingredientChanges.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Ingredient swaps</h3>
              <div className="space-y-1">
                {/* Column headers */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr_auto] gap-x-2 px-2 pb-1 border-b border-border/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Original</span>
                  <span />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Replacement</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Reason</span>
                </div>
                {preview.ingredientChanges.map((change, i) => (
                  <div key={i} className={`rounded-sm ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                    {/* Desktop */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_auto_1fr_auto] gap-x-2 px-2 py-1.5 items-center">
                      <span className="text-xs text-muted-foreground">{change.original}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      <span className={`text-xs font-medium ${change.replacement ? "" : "text-rose-600 dark:text-rose-400"}`}>
                        {change.replacement ?? "Removed"}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap">{change.reason}</span>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden px-2 py-2 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/55 shrink-0 mt-0.5 w-16">Original</span>
                        <span className="text-xs text-muted-foreground">{change.original}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/55 shrink-0 mt-0.5 w-16">Replaces with</span>
                        <span className={`text-xs font-medium ${change.replacement ? "" : "text-rose-600 dark:text-rose-400"}`}>
                          {change.replacement ?? "Removed"}
                        </span>
                      </div>
                      {change.reason && (
                        <Badge variant="secondary" className="text-[10px]">{change.reason}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Method steps diff ────────────────────────────────────────── */}
          {stepEntries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Cooking method</h3>
                {changedStepCount > 0 && (
                  <span className="text-xs text-muted-foreground">{changedStepCount} changed</span>
                )}
              </div>

              {/* Reason chips for changed steps */}
              {changedStepCount > 0 && reasonChips.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {reasonChips.map(chip => (
                    <Badge key={chip} variant="secondary" className="text-[10px] font-normal">{chip}</Badge>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                {diffGroups.map((group, gi) => {
                  if (group.type === "unchanged") {
                    const isExpanded = expandedUnchanged.has(gi);
                    return (
                      <div key={gi}>
                        <button
                          onClick={() => setExpandedUnchanged(s => {
                            const n = new Set(s);
                            n.has(gi) ? n.delete(gi) : n.add(gi);
                            return n;
                          })}
                          className="w-full flex items-center gap-2 py-1.5 px-2 rounded text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                          <span className="italic">
                            {group.entries.length} unchanged {group.entries.length === 1 ? "step" : "steps"}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="ml-5 space-y-1 mt-1">
                            {group.entries.map((e, ei) => (
                              <div key={ei} className="text-xs text-muted-foreground/70 bg-muted/20 px-2 py-1.5 rounded flex gap-2">
                                <span className="shrink-0 text-muted-foreground/40 font-mono">{e.adaptedIndex + 1}.</span>
                                {e.adapted}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Changed step
                  const entry = group.entry;
                  const isEditingStep = editingStepIndex === entry.adaptedIndex;
                  const currentText = editedSteps.get(entry.adaptedIndex) ?? entry.adapted;

                  return (
                    <div key={gi} className="border border-amber-200/60 dark:border-amber-800/40 rounded-lg overflow-hidden">
                      {/* Original step */}
                      {entry.original && (
                        <div className="px-3 py-2 bg-rose-50/60 dark:bg-rose-950/20 border-b border-border/40">
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] uppercase tracking-wide text-rose-500/70 dark:text-rose-400/70 shrink-0 mt-0.5 font-semibold w-14">Original</span>
                            <span className="text-xs text-muted-foreground line-through decoration-rose-400/50">{entry.original}</span>
                          </div>
                        </div>
                      )}

                      {/* Adapted step */}
                      <div className="px-3 py-2 bg-teal-50/40 dark:bg-teal-950/20">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] uppercase tracking-wide text-teal-600/80 dark:text-teal-400/70 shrink-0 mt-0.5 font-semibold w-14">Adapted</span>
                          <div className="flex-1 min-w-0">
                            {isEditingStep ? (
                              <Textarea
                                value={currentText}
                                onChange={e => setEditedSteps(m => new Map(m).set(entry.adaptedIndex, e.target.value))}
                                className="text-xs min-h-[72px] resize-none"
                                autoFocus
                                onBlur={() => setEditingStepIndex(null)}
                              />
                            ) : (
                              <button
                                className="text-xs text-left w-full text-foreground hover:text-foreground/80 group"
                                onClick={() => setEditingStepIndex(entry.adaptedIndex)}
                              >
                                {currentText}
                                <Pencil className="inline h-2.5 w-2.5 ml-1.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Revert to original */}
                        {editedSteps.has(entry.adaptedIndex) && (
                          <button
                            onClick={() => setEditedSteps(m => { const n = new Map(m); n.delete(entry.adaptedIndex); return n; })}
                            className="mt-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground underline"
                          >
                            Revert to AI suggestion
                          </button>
                        )}
                        {!editedSteps.has(entry.adaptedIndex) && entry.original && (
                          <button
                            onClick={() => setEditedSteps(m => new Map(m).set(entry.adaptedIndex, entry.original!))}
                            className="mt-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground underline"
                          >
                            Revert to original
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Trade-offs ───────────────────────────────────────────────── */}
          {preview.tradeoffs && preview.tradeoffs.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">Trade-offs to be aware of</p>
              <ul className="space-y-0.5">
                {preview.tradeoffs.map((t, i) => (
                  <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                    <span className="shrink-0 mt-1">·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Validation failure ───────────────────────────────────────── */}
          {preview.validationFailed && (
            <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 rounded-lg px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">This adaptation needs review</p>
                <p className="text-[11px] text-rose-700/70 dark:text-rose-400/70 mt-0.5">
                  The adapted method may contain instructions that don't make sense for the substituted ingredients. Re-run tailoring to generate a corrected version.
                </p>
              </div>
            </div>
          )}

          {/* ── Trust disclaimer ─────────────────────────────────────────── */}
          <p className="text-[10px] text-muted-foreground/50 italic">
            AI-generated adaptation. Review substitutions before cooking. Not a medically guaranteed safe recipe. Original recipe is never modified.
          </p>

          {/* Spacer so content isn't hidden behind the sticky footer */}
          <div className="h-4" />
        </div>

        {/* ── Sticky approve footer ─────────────────────────────────────── */}
        <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-background/95 backdrop-blur-sm">
          <Button
            className="w-full h-11 text-sm font-medium"
            disabled={acceptMutation.isPending || !!preview.validationFailed}
            onClick={() => acceptMutation.mutate()}
          >
            {acceptMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving variant…</>
            ) : (
              <><Check className="h-4 w-4 mr-2" />Use this household-safe version</>
            )}
          </Button>
          {preview.validationFailed && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Fix validation issues above before approving.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
