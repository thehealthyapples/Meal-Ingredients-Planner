import { useState, useMemo, useEffect, useRef } from "react";
import { ImportDiaryModal } from "@/components/import-diary-modal";
import { UPFInfoModal } from "@/components/upf-info-modal";
import { FirstVisitHint } from "@/components/first-visit-hint";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Pencil, Check, X,
  Copy, Loader2, TrendingUp, Weight, Moon, Zap, BookOpen,
  Sun, Coffee, UtensilsCrossed, Droplets, Sparkles, ChefHat,
  ChevronDown, Heart, Flame, Target, Activity, Droplet,
  Gift, ClipboardCheck,
} from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { HealthSnapshot, GoalsPreferences, ProfileData } from "./profile-page";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ThaAppleIcon from "@/components/icons/ThaAppleIcon";
import AppleRating from "@/components/AppleRating";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "drink";

interface DiaryEntry {
  id: number;
  dayId: number;
  userId: number;
  mealSlot: string;
  name: string;
  notes: string | null;
  sourceType: string;
  sourcePlannerEntryId: number | null;
  createdAt: string;
}

interface DiaryMetrics {
  id: number;
  userId: number;
  date: string;
  weightKg: number | null;
  bmi: number | null;
  moodApples: number | null;
  sleepHours: number | null;
  energyApples: number | null;
  notes: string | null;
  stuckToPlan: boolean | null;
  customValues: Record<string, string> | null;
}

interface DiaryDay {
  id: number;
  userId: number;
  date: string;
  notes: string | null;
}

interface DiaryResponse {
  day: DiaryDay | null;
  entries: DiaryEntry[];
  metrics: DiaryMetrics | null;
}

interface SavedMeal {
  id: number;
  name: string;
  ingredients: string[];
  kind: string | null;
}

interface UsageItem { id: number; itemName: string; itemType: string; useCount: number; }

interface Countdown { id: string; name: string; date: string; }

interface CustomMetricDef { id: string; name: string; unit: string; }

const SLOTS: { key: MealSlot; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "lunch", label: "Lunch", icon: Sun },
  { key: "dinner", label: "Dinner", icon: UtensilsCrossed },
  { key: "snack", label: "Snacks", icon: Moon },
  { key: "drink", label: "Drinks", icon: Droplets },
];

type ProgressRange = "week" | "month" | "year";
const RANGE_DAYS: Record<ProgressRange, number> = { week: 7, month: 30, year: 365 };

const EXTRA_METRIC_OPTIONS = [
  { key: "sleep", label: "Sleep", icon: Moon, supported: true },
  { key: "stuckToPlan", label: "Stuck to plan", icon: ClipboardCheck, supported: true },
  { key: "notes", label: "Notes", icon: Sparkles, supported: true },
  { key: "bloodPressure", label: "Blood pressure", icon: Activity, supported: true },
  { key: "bloodSugar", label: "Blood sugar", icon: Droplet, supported: true },
  { key: "bpm", label: "Heart rate (BPM)", icon: Heart, supported: true },
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function getInsightText(trends: DiaryMetrics[], range: ProgressRange): string {
  if (trends.length === 0) return "";
  const daysWithData = trends.length;
  const rangeDays = RANGE_DAYS[range];
  const consistency = daysWithData / rangeDays;

  if (consistency >= 0.8) return "Focus on what matters, not just what's measurable. You're building a useful picture over time.";
  if (consistency >= 0.5) return "Small steps add up. Better choices today, stronger health over time.";
  if (daysWithData >= 3) return "Every entry helps — your trends will become clearer as you go.";
  return "You're just getting started. A few more entries will reveal useful patterns.";
}

// ── THA Apple Score Picker ──────────────────────────────────────────────────

function ThaAppleScorePicker({
  value,
  onChange,
  max = 5,
  testId,
  size = 20,
}: {
  value: number | null;
  onChange: (v: number) => void;
  max?: number;
  testId?: string;
  size?: number;
}) {
  return (
    <div className="flex gap-0.5" data-testid={testId}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          title={`${n} / ${max}`}
          className={`transition-all ${value !== null && n <= value ? "opacity-100 scale-100" : "opacity-20 hover:opacity-50 hover:scale-105"}`}
          data-testid={`${testId}-${n}`}
        >
          <ThaAppleIcon size={size} />
        </button>
      ))}
    </div>
  );
}

// ── THA Apple Score Display ─────────────────────────────────────────────────

function ThaAppleScoreDisplay({ value }: { value: number | null; max?: number }) {
  if (value === null) return <span className="text-muted-foreground text-xs">-</span>;
  return <AppleRating rating={value} sizePx={52} showTooltip={false} animate={false} />;
}

// ── Metric stat card ────────────────────────────────────────────────────────

function MetricStatCard({
  label, value, unit,
}: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="text-center px-3 py-2 rounded-md bg-muted/40 border border-border/50">
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 leading-none mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground leading-tight" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value !== null && value !== undefined ? `${value}${unit ? ` ${unit}` : ""}` : "-"}
      </p>
    </div>
  );
}

// ── Copy-from-planner modal ─────────────────────────────────────────────────

const COPY_SLOT_OPTIONS = [
  { value: "all", label: "Import All" },
  { value: "breakfast", label: "Breakfast Only" },
  { value: "lunch", label: "Lunch Only" },
  { value: "dinner", label: "Dinner Only" },
  { value: "snack", label: "Snacks Only" },
  { value: "drink", label: "Drinks Only" },
];

function CopyFromPlannerModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (slots: string[]) => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState("all");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Copy from Planner</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Import meals from your weekly planner for this day. Choose which meal slots to import.
        </p>
        <div className="space-y-2 py-1">
          {COPY_SLOT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition-colors ${selected === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
              data-testid={`option-copy-${opt.value}`}
            >
              <input
                type="radio"
                name="copy-slot"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
          <label
            className="flex items-center gap-3 px-3 py-2 rounded-md border border-border hover:bg-muted/40 cursor-pointer opacity-50"
            title="Coming soon"
          >
            <input type="radio" name="copy-slot" disabled />
            <span className="text-sm text-muted-foreground">Import from Cookbook</span>
            <Badge variant="outline" className="ml-auto text-[10px]">Soon</Badge>
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => onConfirm(selected === "all" ? [] : [selected])}
            disabled={isPending}
            data-testid="button-confirm-copy"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add entry modal ─────────────────────────────────────────────────────────

function AddEntryModal({
  slot,
  slotLabel,
  onClose,
  onAdd,
  onLogMeal,
  savedMeals,
  recentItems,
  frequentItems,
  isPending,
}: {
  slot: MealSlot | null;
  slotLabel: string;
  onClose: () => void;
  onAdd: (name: string) => void;
  onLogMeal: (meal: SavedMeal) => void;
  savedMeals: SavedMeal[];
  recentItems: UsageItem[];
  frequentItems: UsageItem[];
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [showFrequent, setShowFrequent] = useState(false);
  const suggestions = showFrequent ? frequentItems : recentItems;
  const visibleMeals = savedMeals.filter((m) => m.kind !== "component").slice(0, 10);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  };

  return (
    <Dialog open={slot !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to {slotLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Manual entry */}
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Add ${slotLabel.toLowerCase()}…`}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleAdd();
                if (e.key === "Escape") onClose();
              }}
              data-testid="input-add-modal"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!name.trim() || isPending}
              data-testid="button-confirm-add-modal"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Recent / Frequent chips */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Quick add</span>
                <button
                  className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors ml-auto"
                  onClick={() => setShowFrequent(!showFrequent)}
                >
                  {showFrequent ? "Recent" : "Frequent"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    className="text-xs bg-secondary/60 hover:bg-primary hover:text-primary-foreground rounded-full px-2.5 py-0.5 transition-colors truncate max-w-[160px] disabled:opacity-50"
                    onClick={() => onAdd(item.itemName)}
                    disabled={isPending}
                    title={`Log "${item.itemName}"`}
                  >
                    {item.itemName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved meals */}
          {visibleMeals.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Saved meals</p>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {visibleMeals.map((meal) => (
                  <button
                    key={meal.id}
                    className="w-full flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-muted/40 transition-colors disabled:opacity-50"
                    onClick={() => { onLogMeal(meal); onClose(); }}
                    disabled={isPending}
                    data-testid={`button-log-meal-modal-${meal.id}`}
                  >
                    <ChefHat className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meal.name}</p>
                      {meal.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {meal.ingredients.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add metric modal ────────────────────────────────────────────────────────

function AddMetricModal({
  open,
  onClose,
  extraEnabled,
  onExtraChange,
  customDefs,
  onCustomDefsChange,
}: {
  open: boolean;
  onClose: () => void;
  extraEnabled: string[];
  onExtraChange: (keys: string[]) => void;
  customDefs: CustomMetricDef[];
  onCustomDefsChange: (defs: CustomMetricDef[]) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const toggle = (key: string) => {
    onExtraChange(
      extraEnabled.includes(key)
        ? extraEnabled.filter((k) => k !== key)
        : [...extraEnabled, key],
    );
  };

  const addCustom = () => {
    if (!newName.trim()) return;
    const def: CustomMetricDef = { id: Date.now().toString(), name: newName.trim(), unit: newUnit.trim() };
    onCustomDefsChange([...customDefs, def]);
    setNewName("");
    setNewUnit("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add metric</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Built-in supported metrics */}
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Track these</p>
            {EXTRA_METRIC_OPTIONS.filter((m) => m.supported).map((m) => {
              const Icon = m.icon;
              const on = extraEnabled.includes(m.key);
              return (
                <div
                  key={m.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
                  data-testid={`metric-option-${m.key}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{m.label}</span>
                  <Switch
                    checked={on}
                    onCheckedChange={() => toggle(m.key)}
                    aria-label={`Toggle ${m.label}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Custom metrics */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Custom</p>
            {customDefs.map((def) => {
              const on = extraEnabled.includes(`custom:${def.id}`);
              return (
                <div key={def.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm">
                  <span className="flex-1">{def.name}{def.unit ? ` (${def.unit})` : ""}</span>
                  <Switch
                    checked={on}
                    onCheckedChange={() => toggle(`custom:${def.id}`)}
                    aria-label={`Toggle ${def.name}`}
                  />
                </div>
              );
            })}
            <div className="flex gap-2 pt-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Metric name"
                className="h-8 text-sm flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
                data-testid="input-custom-metric-name"
              />
              <Input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Unit"
                className="h-8 text-sm w-20"
                onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
                data-testid="input-custom-metric-unit"
              />
              <Button size="sm" onClick={addCustom} disabled={!newName.trim()} data-testid="button-add-custom-metric">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Daily Signals panel ─────────────────────────────────────────────────────

function DailySignalsPanel({
  metrics,
  date,
  onSaved,
  onCsvClick,
  extraEnabled,
  onExtraChange,
  customDefs,
  onCustomDefsChange,
  onWeightSaved,
}: {
  metrics: DiaryMetrics | null;
  date: string;
  onSaved: () => void;
  onCsvClick?: () => void;
  extraEnabled: string[];
  onExtraChange: (keys: string[]) => void;
  customDefs: CustomMetricDef[];
  onCustomDefsChange: (defs: CustomMetricDef[]) => void;
  onWeightSaved?: (kg: number) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addMetricOpen, setAddMetricOpen] = useState(false);
  // Holds the weight value being saved so onSuccess can sync the profile
  const pendingWeightRef = useRef<number | null>(null);

  const [form, setForm] = useState({
    weightKg: "",
    moodApples: null as number | null,
    energyApples: null as number | null,
    sleepHours: "",
    notes: "",
    stuckToPlan: false,
  });
  // Custom metric values — server is source of truth, localStorage is fallback
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(`tha_custom_values_${date}`) || "{}"); }
    catch { return {}; }
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({
      weightKg: metrics?.weightKg != null ? String(metrics.weightKg) : "",
      moodApples: metrics?.moodApples ?? null,
      energyApples: metrics?.energyApples ?? null,
      sleepHours: metrics?.sleepHours != null ? String(metrics.sleepHours) : "",
      notes: metrics?.notes ?? "",
      stuckToPlan: metrics?.stuckToPlan ?? false,
    });
    // Prefer server values; fall back to localStorage for unsaved/legacy data
    const serverValues = metrics?.customValues;
    if (serverValues && Object.keys(serverValues).length > 0) {
      setCustomValues(serverValues);
    } else {
      try {
        setCustomValues(JSON.parse(localStorage.getItem(`tha_custom_values_${date}`) || "{}"));
      } catch {}
    }
    setDirty(false);
  }, [date, metrics?.id]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const setCustomValue = (id: string, v: string) => {
    const updated = { ...customValues, [id]: v };
    setCustomValues(updated);
    try { localStorage.setItem(`tha_custom_values_${date}`, JSON.stringify(updated)); } catch {}
    setDirty(true);
  };

  const saveMut = useMutation({
    mutationFn: (data: object) => apiRequest("PATCH", `/api/food-diary/${date}/metrics`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/food-diary", date] });
      qc.invalidateQueries({ queryKey: ["/api/food-diary/metrics/trends"] });
      setDirty(false);
      onSaved();
      toast({ title: "Saved" });
      // Sync weight to profile so HealthSnapshot updates instantly
      if (pendingWeightRef.current !== null) {
        onWeightSaved?.(pendingWeightRef.current);
        pendingWeightRef.current = null;
      }
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const submit = () => {
    const payload: Record<string, unknown> = {};
    if (form.weightKg.trim()) {
      const kg = parseFloat(form.weightKg);
      payload.weightKg = kg;
      pendingWeightRef.current = kg;
    } else {
      pendingWeightRef.current = null;
    }
    if (form.moodApples !== null) payload.moodApples = form.moodApples;
    if (form.energyApples !== null) payload.energyApples = form.energyApples;
    if (extraEnabled.includes("sleep") && form.sleepHours.trim()) payload.sleepHours = parseFloat(form.sleepHours);
    if (extraEnabled.includes("notes") && form.notes.trim()) payload.notes = form.notes;
    if (extraEnabled.includes("stuckToPlan")) payload.stuckToPlan = form.stuckToPlan;
    if (Object.keys(customValues).length > 0) payload.customValues = customValues;
    saveMut.mutate(payload);
  };

  // Enabled custom defs (those whose id is in extraEnabled as "custom:{id}")
  const enabledCustomDefs = customDefs.filter((d) => extraEnabled.includes(`custom:${d.id}`));

  return (
    <>
      <Card className="shadow-none border-border" data-testid="card-daily-signals">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Daily Signals
          </CardTitle>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-[10px] text-muted-foreground">Unsaved</span>}
            {onCsvClick && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={onCsvClick}
                data-testid="button-import-csv"
              >
                + CSV
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-0 space-y-3" data-testid="metrics-form">
          {/* Weight */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Weight (kg)
              {metrics?.bmi != null && (
                <span className="ml-2 text-muted-foreground/60">BMI: {metrics.bmi}</span>
              )}
            </Label>
            <Input
              type="number" step="0.1" value={form.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
              className="h-8 text-sm"
              placeholder="e.g. 72.5"
              data-testid="input-weight"
            />
          </div>

          {/* Mood */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Mood</Label>
            <ThaAppleScorePicker
              value={form.moodApples}
              onChange={(v) => set("moodApples", v)}
              testId="picker-mood"
              size={22}
            />
          </div>

          {/* Energy */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Energy</Label>
            <ThaAppleScorePicker
              value={form.energyApples}
              onChange={(v) => set("energyApples", v)}
              testId="picker-energy"
              size={22}
            />
          </div>

          {/* Optional built-in extras */}
          {extraEnabled.includes("sleep") && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Sleep (hours)</Label>
              <Input
                type="number" step="0.5" value={form.sleepHours}
                onChange={(e) => set("sleepHours", e.target.value)}
                className="h-8 text-sm"
                placeholder="e.g. 7.5"
                data-testid="input-sleep"
              />
            </div>
          )}

          {extraEnabled.includes("stuckToPlan") && (
            <div className="flex items-center gap-2.5">
              <Switch
                id={`stuck-${date}`}
                checked={form.stuckToPlan}
                onCheckedChange={(v) => set("stuckToPlan", v)}
                data-testid="switch-stuck-to-plan"
              />
              <Label htmlFor={`stuck-${date}`} className="text-xs cursor-pointer">Stuck to meal plan</Label>
            </div>
          )}

          {extraEnabled.includes("notes") && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="How did today go?"
                className="text-sm min-h-[56px] resize-none"
                data-testid="textarea-notes"
              />
            </div>
          )}

          {extraEnabled.includes("bloodPressure") && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Blood pressure (mmHg)</Label>
              <Input
                type="text"
                value={customValues["bloodPressure"] ?? ""}
                onChange={(e) => setCustomValue("bloodPressure", e.target.value)}
                className="h-8 text-sm"
                placeholder="e.g. 120/80"
                data-testid="input-blood-pressure"
              />
            </div>
          )}

          {extraEnabled.includes("bloodSugar") && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Blood sugar (mmol/L)</Label>
              <Input
                type="number" step="0.1"
                value={customValues["bloodSugar"] ?? ""}
                onChange={(e) => setCustomValue("bloodSugar", e.target.value)}
                className="h-8 text-sm"
                placeholder="e.g. 5.4"
                data-testid="input-blood-sugar"
              />
            </div>
          )}

          {extraEnabled.includes("bpm") && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Heart rate (BPM)</Label>
              <Input
                type="number" step="1"
                value={customValues["bpm"] ?? ""}
                onChange={(e) => setCustomValue("bpm", e.target.value)}
                className="h-8 text-sm"
                placeholder="e.g. 68"
                data-testid="input-bpm"
              />
            </div>
          )}

          {/* Custom metrics */}
          {enabledCustomDefs.map((def) => (
            <div key={def.id}>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {def.name}{def.unit ? ` (${def.unit})` : ""}
              </Label>
              <Input
                type="text"
                value={customValues[def.id] ?? ""}
                onChange={(e) => setCustomValue(def.id, e.target.value)}
                className="h-8 text-sm"
                placeholder={def.unit ? `e.g. 120${def.unit ? `/${def.unit}` : ""}` : "Value"}
                data-testid={`input-custom-${def.id}`}
              />
            </div>
          ))}

          {/* + Add metric */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors py-0.5"
            onClick={() => setAddMetricOpen(true)}
            data-testid="button-add-metric"
          >
            <Plus className="h-3 w-3" />
            Add metric
          </button>

          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Your numbers don't define you — they simply help you understand your habits.
          </p>

          <Button
            size="sm"
            className="w-full"
            onClick={submit}
            disabled={saveMut.isPending}
            data-testid="button-save-metrics"
          >
            {saveMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5 mr-1" />
            )}
            Save
          </Button>
        </CardContent>
      </Card>

      <AddMetricModal
        open={addMetricOpen}
        onClose={() => setAddMetricOpen(false)}
        extraEnabled={extraEnabled}
        onExtraChange={onExtraChange}
        customDefs={customDefs}
        onCustomDefsChange={onCustomDefsChange}
      />
    </>
  );
}

// ── Looking Forward widget ──────────────────────────────────────────────────

function LookingForwardWidget() {
  const [items, setItems] = useState<Countdown[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("tha_diary_countdowns") || "[]");
    } catch {
      return [];
    }
  });
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");

  const persist = (updated: Countdown[]) => {
    setItems(updated);
    try { localStorage.setItem("tha_diary_countdowns", JSON.stringify(updated)); } catch {}
  };

  const addItem = () => {
    if (!newName.trim() || !newDate) return;
    persist([...items, { id: Date.now().toString(), name: newName.trim(), date: newDate }]);
    setNewName("");
    setNewDate("");
    setAdding(false);
  };

  const removeItem = (id: string) => persist(items.filter((i) => i.id !== id));

  const daysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T12:00:00");
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="shadow-none border-border" data-testid="card-looking-forward">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Gift className="h-4 w-4 text-muted-foreground" />
          Looking forward to…
        </CardTitle>
        <Button
          variant="ghost" size="sm" className="h-6 w-6 p-0"
          onClick={() => setAdding(!adding)}
          data-testid="button-add-countdown"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-2">
        {items.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground/50">
            Add something to look forward to — it helps.
          </p>
        )}

        {items.map((item) => {
          const days = daysUntil(item.date);
          const label =
            days > 0
              ? `${days} day${days !== 1 ? "s" : ""} away`
              : days === 0
              ? "Today!"
              : "Past";
          return (
            <div key={item.id} className="flex items-start gap-2 group" data-testid={`countdown-${item.id}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className={`text-xs ${days <= 7 && days >= 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {label}
                </p>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5"
                onClick={() => removeItem(item.id)}
                aria-label="Remove"
                data-testid={`button-remove-countdown-${item.id}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {adding && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Holiday, Birthday…"
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Escape") { setAdding(false); setNewName(""); setNewDate(""); } }}
              data-testid="input-countdown-name"
            />
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-8 text-sm"
              data-testid="input-countdown-date"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={addItem}
                disabled={!newName.trim() || !newDate}
                className="flex-1"
                data-testid="button-confirm-countdown"
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setAdding(false); setNewName(""); setNewDate(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Diary settings panel (THA apple button) ─────────────────────────────────

function DiarySettingsPanel({
  open,
  onClose,
  showHealthSnapshot,
  onToggleHealthSnapshot,
  profile,
  onSaveProfile,
}: {
  open: boolean;
  onClose: () => void;
  showHealthSnapshot: boolean;
  onToggleHealthSnapshot: (v: boolean) => void;
  profile: ProfileData | undefined;
  onSaveProfile: (data: any) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <img src={thaAppleSrc} alt="" className="h-5 w-5 object-contain" />
            Diary Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Visibility toggles */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Show on page</p>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm cursor-pointer">Health Snapshot</Label>
              </div>
              <Switch
                checked={showHealthSnapshot}
                onCheckedChange={onToggleHealthSnapshot}
                data-testid="switch-show-health-snapshot"
              />
            </div>
          </div>

          {/* Goals */}
          {profile && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Goals</p>
              <GoalsPreferences
                profile={profile}
                onSave={onSaveProfile}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function FoodDiaryPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [date, setDate] = useState<string>(toDateStr(new Date()));
  const [activeTab, setActiveTab] = useState<"diary" | "progress">("diary");
  const [progressRange, setProgressRange] = useState<ProgressRange>("month");

  // Add entry modal
  const [addModalSlot, setAddModalSlot] = useState<MealSlot | null>(null);
  const addModalLabel = SLOTS.find((s) => s.key === addModalSlot)?.label ?? "";

  // Editing entry
  const [editingEntry, setEditingEntry] = useState<{ id: number; name: string } | null>(null);

  // Modals
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [upfDismissed, setUpfDismissed] = useState(false);
  const [diarySettingsOpen, setDiarySettingsOpen] = useState(false);

  // Diary settings (localStorage-backed)
  const [showHealthSnapshot, setShowHealthSnapshot] = useState<boolean>(() => {
    try { return localStorage.getItem("tha_diary_show_health_snapshot") !== "false"; }
    catch { return true; }
  });
  const [extraMetrics, setExtraMetrics] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("tha_diary_extra_metrics") || "[]"); }
    catch { return []; }
  });
  const [customDefs, setCustomDefs] = useState<CustomMetricDef[]>(() => {
    try { return JSON.parse(localStorage.getItem("tha_custom_metrics") || "[]"); }
    catch { return []; }
  });
  const [expandedSlots, setExpandedSlots] = useState<Set<MealSlot>>(new Set());

  const toggleHealthSnapshot = (v: boolean) => {
    setShowHealthSnapshot(v);
    try { localStorage.setItem("tha_diary_show_health_snapshot", String(v)); } catch {}
  };

  const updateExtraMetrics = (keys: string[]) => {
    setExtraMetrics(keys);
    try { localStorage.setItem("tha_diary_extra_metrics", JSON.stringify(keys)); } catch {}
    updateProfileMutation.mutate({ diaryExtraMetrics: keys });
  };
  const updateCustomDefs = (defs: CustomMetricDef[]) => {
    setCustomDefs(defs);
    try { localStorage.setItem("tha_custom_metrics", JSON.stringify(defs)); } catch {}
    updateProfileMutation.mutate({ customMetricDefs: defs });
  };
  const toggleSlot = (key: MealSlot) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const diaryKey = ["/api/food-diary", date];

  const { data: diary, isLoading } = useQuery<DiaryResponse>({
    queryKey: diaryKey,
    queryFn: async () => {
      const res = await fetch(`/api/food-diary/${date}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch diary");
      return res.json();
    },
  });

  const { data: trends = [] } = useQuery<DiaryMetrics[]>({
    queryKey: ["/api/food-diary/metrics/trends", progressRange],
    queryFn: async () => {
      const days = RANGE_DAYS[progressRange];
      const res = await fetch(`/api/food-diary/metrics/trends?days=${days}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: activeTab === "progress",
  });

  const { data: userPrefs } = useQuery<any>({
    queryKey: ["/api/user/preferences"],
    queryFn: async () => {
      const res = await fetch("/api/user/preferences", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: profile } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: (data) => {
      qc.setQueryData(["/api/profile"], data);
    },
  });

  // Sync customDefs and extraMetrics from profile once loaded.
  // If server is empty and localStorage has data, migrate it to the server once.
  const hasSyncedFromProfileRef = useRef(false);
  useEffect(() => {
    if (!profile || hasSyncedFromProfileRef.current) return;
    hasSyncedFromProfileRef.current = true;
    const serverDefs = profile.customMetricDefs ?? [];
    const serverExtras = profile.diaryExtraMetrics ?? [];
    if (serverDefs.length > 0 || serverExtras.length > 0) {
      setCustomDefs(serverDefs);
      setExtraMetrics(serverExtras);
    } else {
      // One-time migration: push localStorage data to server if server is empty
      const localDefs: CustomMetricDef[] = (() => {
        try { return JSON.parse(localStorage.getItem("tha_custom_metrics") || "[]"); } catch { return []; }
      })();
      const localExtras: string[] = (() => {
        try { return JSON.parse(localStorage.getItem("tha_diary_extra_metrics") || "[]"); } catch { return []; }
      })();
      if (localDefs.length > 0 || localExtras.length > 0) {
        updateProfileMutation.mutate({ customMetricDefs: localDefs, diaryExtraMetrics: localExtras });
      }
    }
  }, [profile]);

  // Tracking visibility
  const showDetailedTracking = userPrefs?.eliteTrackingEnabled ?? true;
  const showWeightTracking = userPrefs?.healthTrendEnabled ?? true;

  const { data: recentItems = [] } = useQuery<UsageItem[]>({ queryKey: ["/api/user-items/recent"] });
  const { data: frequentItems = [] } = useQuery<UsageItem[]>({ queryKey: ["/api/user-items/frequent"] });
  const { data: savedMeals = [] } = useQuery<SavedMeal[]>({ queryKey: ["/api/meals"] });

  const copyFromPlannerMut = useMutation({
    mutationFn: (slots: string[]) =>
      apiRequest("POST", `/api/food-diary/${date}/copy-from-planner`, slots.length > 0 ? { slots } : {}),
    onSuccess: async (res) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: diaryKey });
      setCopyModalOpen(false);
      toast({
        title: "Copied from Planner",
        description: `${data.copied} meal${data.copied !== 1 ? "s" : ""} added${data.skipped > 0 ? `, ${data.skipped} already present` : ""}.`,
      });
    },
    onError: () => toast({ title: "Failed to copy from planner", variant: "destructive" }),
  });

  const logEntryMut = useMutation({
    mutationFn: (data: { name: string; mealSlot: MealSlot }) =>
      apiRequest("POST", `/api/food-diary/${date}/entries`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: diaryKey });
      qc.invalidateQueries({ queryKey: ["/api/user-items/recent"] });
      qc.invalidateQueries({ queryKey: ["/api/user-items/frequent"] });
    },
    onError: () => toast({ title: "Failed to log item", variant: "destructive" }),
  });

  const logMealMut = useMutation({
    mutationFn: async ({ meal, slot }: { meal: SavedMeal; slot: MealSlot }) => {
      const res = await apiRequest("POST", `/api/food-diary/${date}/log-meal`, {
        mealId: meal.id,
        mealSlot: slot,
      });
      return res.json() as Promise<{ logged: string[] }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: diaryKey });
      qc.invalidateQueries({ queryKey: ["/api/user-items/recent"] });
      qc.invalidateQueries({ queryKey: ["/api/user-items/frequent"] });
      toast({
        title: "Meal logged",
        description: `${data.logged.length} item${data.logged.length !== 1 ? "s" : ""} added.`,
        duration: 2000,
      });
    },
    onError: () => toast({ title: "Failed to log meal", variant: "destructive" }),
  });

  const updateEntryMut = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      apiRequest("PATCH", `/api/food-diary/entries/${id}`, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: diaryKey }); setEditingEntry(null); },
    onError: () => toast({ title: "Failed to update entry", variant: "destructive" }),
  });

  const deleteEntryMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/food-diary/entries/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: diaryKey }),
    onError: () => toast({ title: "Failed to delete entry", variant: "destructive" }),
  });

  const prevDay = () => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setDate(toDateStr(d));
  };
  const nextDay = () => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setDate(toDateStr(d));
  };
  const goToday = () => setDate(toDateStr(new Date()));
  const isToday = date === toDateStr(new Date());

  const entriesBySlot = useMemo<Record<MealSlot, DiaryEntry[]>>(() => {
    const base: Record<MealSlot, DiaryEntry[]> = {
      breakfast: [], lunch: [], dinner: [], snack: [], drink: [],
    };
    for (const e of diary?.entries ?? []) {
      const s = e.mealSlot as MealSlot;
      if (base[s]) base[s].push(e);
    }
    return base;
  }, [diary?.entries]);

  const trendChartData = useMemo(() => {
    return trends.map((t) => ({
      date: t.date.slice(5),
      weight: t.weightKg,
      bmi: t.bmi,
      mood: t.moodApples,
      sleep: t.sleepHours,
      energy: t.energyApples,
    }));
  }, [trends]);

  const latestMetrics = trends.length > 0 ? trends[trends.length - 1] : null;
  const weekAgoMetrics = trends.length >= 7 ? trends[trends.length - 8] : null;
  const weightChange =
    latestMetrics?.weightKg != null && weekAgoMetrics?.weightKg != null
      ? Math.round((latestMetrics.weightKg - weekAgoMetrics.weightKg) * 10) / 10
      : null;
  const avgSleep =
    trends.filter((t) => t.sleepHours != null).length >= 2
      ? Math.round(
          (trends.reduce((s, t) => s + (t.sleepHours ?? 0), 0) /
            trends.filter((t) => t.sleepHours != null).length) *
            10
        ) / 10
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              My Diary
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">No pressure. Just clearer choices.</p>
          </div>

          {/* THA apple settings button */}
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted/60 transition-colors"
            onClick={() => setDiarySettingsOpen(true)}
            aria-label="Diary settings"
            data-testid="button-diary-settings"
          >
            <img src={thaAppleSrc} alt="" className="h-7 w-7 object-contain opacity-70 hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* UPF awareness banner */}
        {!upfDismissed && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 mb-3">
            <span className="text-base shrink-0">🍎</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-foreground/80">
                <strong className="font-medium">Want to eat less processed food?</strong>{" "}
                Awareness beats restriction.{" "}
                <UPFInfoModal trigger={<span className="underline underline-offset-2 cursor-pointer text-primary hover:text-primary/80 transition-colors">Learn our approach →</span>} />
              </span>
            </div>
            <button
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setUpfDismissed(true)}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "diary" | "progress")}>
            <TabsList data-testid="tabs-diary">
              <TabsTrigger value="diary" data-testid="tab-diary">Daily Log</TabsTrigger>
              <TabsTrigger value="progress" data-testid="tab-progress">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />Progress
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "diary" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-accent text-sm"
                onClick={prevDay}
                data-testid="button-prev-day"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-sm font-medium px-2 min-w-[130px] text-center" data-testid="text-diary-date">
                {formatDisplayDate(date)}
              </span>
              <button
                type="button"
                className="flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-accent text-sm"
                onClick={nextDay}
                data-testid="button-next-day"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {!isToday && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={goToday} data-testid="button-today">
                  <Calendar className="h-3 w-3 mr-1" />Today
                </Button>
              )}
            </div>
          )}

          {activeTab === "diary" && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline" size="sm" className="h-8 text-xs"
                onClick={() => setCopyModalOpen(true)}
                data-testid="button-copy-from-planner"
              >
                <Copy className="h-3 w-3 mr-1" />Copy from Planner
              </Button>
            </div>
          )}

          {activeTab === "progress" && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-muted-foreground">Show:</span>
              {(["week", "month", "year"] as ProgressRange[]).map((r) => (
                <Button
                  key={r}
                  variant={progressRange === r ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setProgressRange(r)}
                  data-testid={`button-range-${r}`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Log ────────────────────────────────────────────── */}
      {activeTab === "diary" && (
        isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Health Snapshot — top of diary, conditional */}
            {showHealthSnapshot && profile && (
              <div className="mb-4">
                <HealthSnapshot profile={profile} />
              </div>
            )}

            <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-5">
              {/* ── Left: meal slots ──────────────────────────────── */}
              <div className="space-y-3">
                <FirstVisitHint
                  areaKey="diary"
                  message="Keep it simple — add anything you've eaten today."
                />

                {(diary?.entries?.length ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground/60 px-0.5">
                    Better choices today, stronger health over time.
                  </p>
                )}

                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                  {SLOTS.map(({ key, label, icon: Icon }) => {
                    const slotEntries = entriesBySlot[key];
                    const isExpanded = expandedSlots.has(key);
                    return (
                      <div key={key} data-testid={`card-slot-${key}`}>
                        {/* Slot header row */}
                        <div className="flex items-center gap-1 px-3 py-2.5 bg-background hover:bg-muted/20 transition-colors">
                          <button
                            type="button"
                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                            onClick={() => toggleSlot(key)}
                          >
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{label}</span>
                            {slotEntries.length > 0 ? (
                              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 shrink-0" data-testid={`badge-count-${key}`}>
                                {slotEntries.length}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground/35 ml-1" data-testid={`text-empty-${key}`}>Empty</span>
                            )}
                            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 ml-auto mr-0.5 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          <Button
                            variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 shrink-0"
                            onClick={() => setAddModalSlot(key)}
                            data-testid={`button-add-${key}`}
                          >
                            <Plus className="h-3 w-3" />Add
                          </Button>
                        </div>

                        {/* Expanded entries */}
                        {isExpanded && (
                          <div className="px-3 pb-2.5 pt-1.5 bg-muted/10 space-y-1 border-t border-border/40">
                            {slotEntries.length === 0 && (
                              <p className="text-xs text-muted-foreground/50 py-0.5">Nothing added yet — tap Add to log something.</p>
                            )}
                            {slotEntries.map((entry) => {
                              const isEditing = editingEntry?.id === entry.id;
                              return (
                                <div key={entry.id} className="flex items-center gap-2 group" data-testid={`entry-${entry.id}`}>
                                  {isEditing ? (
                                    <>
                                      <Input
                                        value={editingEntry.name}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                                        className="h-7 text-sm flex-1"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") updateEntryMut.mutate({ id: entry.id, name: editingEntry.name });
                                          if (e.key === "Escape") setEditingEntry(null);
                                        }}
                                        data-testid={`input-edit-entry-${entry.id}`}
                                      />
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateEntryMut.mutate({ id: entry.id, name: editingEntry.name })} data-testid={`button-save-entry-${entry.id}`}>
                                        <Check className="h-3 w-3 text-primary" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingEntry(null)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="flex-1 text-sm text-foreground truncate" data-testid={`text-entry-name-${entry.id}`}>{entry.name}</span>
                                      {entry.sourceType === "copied_from_planner" && (
                                        <Badge variant="outline" className="text-[10px] py-0 px-1 text-muted-foreground border-muted-foreground/30 shrink-0">Planner</Badge>
                                      )}
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingEntry({ id: entry.id, name: entry.name })} data-testid={`button-edit-entry-${entry.id}`}>
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive" onClick={() => deleteEntryMut.mutate(entry.id)} data-testid={`button-delete-entry-${entry.id}`}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Right: Daily Signals + Looking Forward ─────────── */}
              {(showDetailedTracking || showWeightTracking) && (
                <div className="mt-4 lg:mt-0 space-y-3">
                  <DailySignalsPanel
                    metrics={diary?.metrics ?? null}
                    date={date}
                    onSaved={() => {}}
                    onCsvClick={() => setImportModalOpen(true)}
                    extraEnabled={extraMetrics}
                    onExtraChange={updateExtraMetrics}
                    customDefs={customDefs}
                    onCustomDefsChange={updateCustomDefs}
                    onWeightSaved={(kg) => updateProfileMutation.mutate({ weightKg: kg })}
                  />
                  <LookingForwardWidget />
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* ── Progress Tab ─────────────────────────────────────────── */}
      {activeTab === "progress" && (
        <div className="space-y-5">
          {trends.length < 2 ? (
            <div className="text-center py-16 space-y-2" data-testid="text-empty-trends">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">When things drift, we help you find your way back — simply.</p>
              <p className="text-xs text-muted-foreground/60">Record a few days to start seeing useful patterns emerge.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-primary/5 border border-primary/15" data-testid="text-insight">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80">{getInsightText(trends, progressRange)}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="progress-stats">
                <MetricStatCard label="Current Weight" value={latestMetrics?.weightKg ?? null} unit="kg" />
                <MetricStatCard
                  label="7-day Change"
                  value={weightChange !== null ? (weightChange > 0 ? `+${weightChange}` : String(weightChange)) : null}
                  unit={weightChange !== null ? "kg" : undefined}
                />
                <MetricStatCard label="Current BMI" value={latestMetrics?.bmi ?? null} />
                <MetricStatCard label="Avg Sleep" value={avgSleep ?? null} unit="hrs" />
              </div>

              {(latestMetrics?.moodApples != null || latestMetrics?.energyApples != null) && (
                <div className="flex items-center gap-6 px-3 py-2 rounded-md bg-muted/30 border border-border/50">
                  {latestMetrics.moodApples != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Latest Mood</span>
                      <ThaAppleScoreDisplay value={latestMetrics.moodApples} />
                    </div>
                  )}
                  {latestMetrics.energyApples != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Latest Energy</span>
                      <ThaAppleScoreDisplay value={latestMetrics.energyApples} />
                    </div>
                  )}
                </div>
              )}

              {trendChartData.some((d) => d.weight != null) && (
                <Card className="shadow-none border-border p-4" data-testid="chart-weight">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    Weight (kg)
                  </p>
                  <ResponsiveContainer width="100%" height={170}>
                    <LineChart data={trendChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {trendChartData.some((d) => d.bmi != null) && (
                <Card className="shadow-none border-border p-4" data-testid="chart-bmi">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    BMI
                  </p>
                  <ResponsiveContainer width="100%" height={170}>
                    <LineChart data={trendChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="bmi" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {trendChartData.some((d) => d.mood != null || d.sleep != null || d.energy != null) && (
                <Card className="shadow-none border-border p-4" data-testid="chart-mood-sleep">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Mood, Energy & Sleep
                  </p>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={trendChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {trendChartData.some((d) => d.mood != null) && (
                        <Line type="monotone" dataKey="mood" name="Mood" stroke="#e88c4a" strokeWidth={2} dot={false} connectNulls />
                      )}
                      {trendChartData.some((d) => d.energy != null) && (
                        <Line type="monotone" dataKey="energy" name="Energy" stroke="#5aad6f" strokeWidth={2} dot={false} connectNulls />
                      )}
                      {trendChartData.some((d) => d.sleep != null) && (
                        <Line type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#7c9fcb" strokeWidth={2} dot={false} connectNulls />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────── */}
      <AddEntryModal
        slot={addModalSlot}
        slotLabel={addModalLabel}
        onClose={() => setAddModalSlot(null)}
        onAdd={(name) => {
          if (!addModalSlot) return;
          logEntryMut.mutate(
            { name, mealSlot: addModalSlot },
            { onSuccess: () => { /* keep modal open for rapid logging */ } },
          );
        }}
        onLogMeal={(meal) => {
          if (!addModalSlot) return;
          logMealMut.mutate({ meal, slot: addModalSlot });
        }}
        savedMeals={savedMeals}
        recentItems={recentItems}
        frequentItems={frequentItems}
        isPending={logEntryMut.isPending || logMealMut.isPending}
      />

      <CopyFromPlannerModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        onConfirm={(slots) => copyFromPlannerMut.mutate(slots)}
        isPending={copyFromPlannerMut.isPending}
      />

      <ImportDiaryModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />

      <DiarySettingsPanel
        open={diarySettingsOpen}
        onClose={() => setDiarySettingsOpen(false)}
        showHealthSnapshot={showHealthSnapshot}
        onToggleHealthSnapshot={toggleHealthSnapshot}
        profile={profile}
        onSaveProfile={(data) => updateProfileMutation.mutate(data)}
      />
    </div>
  );
}
