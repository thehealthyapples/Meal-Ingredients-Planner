import { useState, useMemo, useEffect } from "react";
import { ImportDiaryModal } from "@/components/import-diary-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Pencil, Check, X,
  Copy, Loader2, TrendingUp, Weight, Moon, Zap, BookOpen, ClipboardCheck,
  Sun, Coffee, UtensilsCrossed, Droplets, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ThaAppleIcon from "@/components/icons/ThaAppleIcon";
import AppleRating from "@/components/AppleRating";
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

const SLOTS: { key: MealSlot; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "breakfast", label: "Breakfast", icon: Coffee },
  { key: "lunch", label: "Lunch", icon: Sun },
  { key: "dinner", label: "Dinner", icon: UtensilsCrossed },
  { key: "snack", label: "Snacks", icon: Moon },
  { key: "drink", label: "Drinks", icon: Droplets },
];

type ProgressRange = "week" | "month" | "year";
const RANGE_DAYS: Record<ProgressRange, number> = { week: 7, month: 30, year: 365 };

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

  if (consistency >= 0.8) return "You've been logging consistently — great work building this habit.";
  if (consistency >= 0.5) return "Good momentum. Small steps add up to a useful picture over time.";
  if (daysWithData >= 3) return "Every entry helps. Keep logging and your trends will become clearer.";
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
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  return <AppleRating rating={value} sizePx={52} showTooltip={false} animate={false} />;
}

// ── Metric stat card ────────────────────────────────────────────────────────

function MetricStatCard({
  label, value, unit,
}: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="text-center px-3 py-2 rounded-md bg-muted/40 border border-border/50">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground leading-tight" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value !== null && value !== undefined ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
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
  const { toast } = useToast();
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
            <span className="text-sm text-muted-foreground">Import from My Meals</span>
            <Badge variant="outline" className="ml-auto text-[9px]">Soon</Badge>
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

// ── Wellbeing panel ─────────────────────────────────────────────────────────

function WellbeingPanel({
  metrics,
  date,
  onSaved,
  onCsvClick,
}: {
  metrics: DiaryMetrics | null;
  date: string;
  onSaved: () => void;
  onCsvClick?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    weightKg: "",
    moodApples: null as number | null,
    sleepHours: "",
    energyApples: null as number | null,
    notes: "",
    stuckToPlan: false,
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({
      weightKg: metrics?.weightKg != null ? String(metrics.weightKg) : "",
      moodApples: metrics?.moodApples ?? null,
      sleepHours: metrics?.sleepHours != null ? String(metrics.sleepHours) : "",
      energyApples: metrics?.energyApples ?? null,
      notes: metrics?.notes ?? "",
      stuckToPlan: metrics?.stuckToPlan ?? false,
    });
    setDirty(false);
  }, [date, metrics?.id]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const saveMut = useMutation({
    mutationFn: (data: object) => apiRequest("PATCH", `/api/food-diary/${date}/metrics`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/food-diary", date] });
      qc.invalidateQueries({ queryKey: ["/api/food-diary/metrics/trends"] });
      setDirty(false);
      onSaved();
      toast({ title: "Wellbeing saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const submit = () => {
    const payload: Record<string, unknown> = {};
    if (form.weightKg.trim()) payload.weightKg = parseFloat(form.weightKg);
    if (form.moodApples !== null) payload.moodApples = form.moodApples;
    if (form.sleepHours.trim()) payload.sleepHours = parseFloat(form.sleepHours);
    if (form.energyApples !== null) payload.energyApples = form.energyApples;
    if (form.notes.trim()) payload.notes = form.notes;
    payload.stuckToPlan = form.stuckToPlan;
    saveMut.mutate(payload);
  };

  return (
    <Card className="shadow-none border-border" data-testid="card-metrics">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Weight className="h-4 w-4 text-muted-foreground" />
          Wellbeing
        </CardTitle>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-[10px] text-muted-foreground">Unsaved changes</span>
          )}
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
        {/* Weight + Sleep */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</Label>
            <Input
              type="number" step="0.1" value={form.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
              className="h-8 text-sm"
              placeholder="e.g. 72.5"
              data-testid="input-weight"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              BMI
              {metrics?.bmi != null && (
                <span className="ml-1 font-medium text-foreground">{metrics.bmi}</span>
              )}
            </Label>
            <div className="h-8 flex items-center px-2 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground">
              Auto-calculated
            </div>
          </div>
        </div>
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
        {/* Stuck to plan */}
        <div className="flex items-center gap-2.5">
          <Switch
            id={`stuck-${date}`}
            checked={form.stuckToPlan}
            onCheckedChange={(v) => set("stuckToPlan", v)}
            data-testid="switch-stuck-to-plan"
          />
          <Label htmlFor={`stuck-${date}`} className="text-xs cursor-pointer">Stuck to meal plan</Label>
        </div>
        {/* Notes */}
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
        {/* Save */}
        <Button
          size="sm"
          className="w-full"
          onClick={submit}
          disabled={saveMut.isPending}
          data-testid="button-save-metrics"
        >
          {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
          Save Wellbeing
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function FoodDiaryPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [date, setDate] = useState<string>(toDateStr(new Date()));
  const [activeTab, setActiveTab] = useState<"diary" | "progress">("diary");
  const [progressRange, setProgressRange] = useState<ProgressRange>("month");

  const [addingSlot, setAddingSlot] = useState<MealSlot | null>(null);
  const [addingName, setAddingName] = useState("");
  const [editingEntry, setEditingEntry] = useState<{ id: number; name: string } | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

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

  const addEntryMut = useMutation({
    mutationFn: (data: { name: string; mealSlot: MealSlot }) =>
      apiRequest("POST", `/api/food-diary/${date}/entries`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: diaryKey }); setAddingSlot(null); setAddingName(""); },
    onError: () => toast({ title: "Failed to add entry", variant: "destructive" }),
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

      {/* ── Compact header ────────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          My Diary
        </h1>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "diary" | "progress")}>
            <TabsList className="h-8" data-testid="tabs-diary">
              <TabsTrigger value="diary" className="text-xs px-3 h-7" data-testid="tab-diary">Daily Log</TabsTrigger>
              <TabsTrigger value="progress" className="text-xs px-3 h-7" data-testid="tab-progress">
                <TrendingUp className="h-3 w-3 mr-1" />Progress
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Date nav (diary only) */}
          {activeTab === "diary" && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevDay} data-testid="button-prev-day">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[130px] text-center" data-testid="text-diary-date">
                {formatDisplayDate(date)}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextDay} data-testid="button-next-day">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              {!isToday && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={goToday} data-testid="button-today">
                  <Calendar className="h-3 w-3 mr-1" />Today
                </Button>
              )}
            </div>
          )}

          {/* Actions (diary only) */}
          {activeTab === "diary" && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline" size="sm" className="h-8 text-xs"
                onClick={() => setCopyModalOpen(true)}
                data-testid="button-copy-from-planner"
              >
                <Copy className="h-3 w-3 mr-1" />Copy from Planner
              </Button>
              <Button
                variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
                onClick={() => toast({ title: "Import Data", description: "Coming soon — import from CSV or another source." })}
                data-testid="button-import-data"
              >
                Import Data
              </Button>
            </div>
          )}

          {/* Progress range (progress only) */}
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
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-5">
            {/* Left: meal slots */}
            <div className="space-y-3">
              {SLOTS.map(({ key, label, icon: Icon }) => {
                const slotEntries = entriesBySlot[key];
                const isAddingThis = addingSlot === key;
                return (
                  <Card key={key} className="shadow-none border-border" data-testid={`card-slot-${key}`}>
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {label}
                        {slotEntries.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1" data-testid={`badge-count-${key}`}>
                            {slotEntries.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => { setAddingSlot(key); setAddingName(""); }}
                        data-testid={`button-add-${key}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      {slotEntries.length === 0 && !isAddingThis && (
                        <p className="text-xs text-muted-foreground/60 italic" data-testid={`text-empty-${key}`}>
                          Nothing logged yet.
                        </p>
                      )}
                      <div className="space-y-1">
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
                                  <span className="flex-1 text-sm text-foreground" data-testid={`text-entry-name-${entry.id}`}>{entry.name}</span>
                                  {entry.sourceType === "copied_from_planner" && (
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 text-muted-foreground border-muted-foreground/30">Planner</Badge>
                                  )}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
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
                        {isAddingThis && (
                          <div className="flex items-center gap-2 mt-1" data-testid={`form-add-${key}`}>
                            <Input
                              value={addingName}
                              onChange={(e) => setAddingName(e.target.value)}
                              placeholder={`Add ${label.toLowerCase()}…`}
                              className="h-7 text-sm flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && addingName.trim()) addEntryMut.mutate({ name: addingName.trim(), mealSlot: key });
                                if (e.key === "Escape") { setAddingSlot(null); setAddingName(""); }
                              }}
                              data-testid={`input-add-${key}`}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!addingName.trim() || addEntryMut.isPending} onClick={() => addEntryMut.mutate({ name: addingName.trim(), mealSlot: key })} data-testid={`button-confirm-add-${key}`}>
                              {addEntryMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-primary" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAddingSlot(null); setAddingName(""); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Right: Wellbeing panel */}
            <div className="mt-3 lg:mt-0">
              <WellbeingPanel
                metrics={diary?.metrics ?? null}
                date={date}
                onSaved={() => {}}
                onCsvClick={() => setImportModalOpen(true)}
              />
            </div>
          </div>
        )
      )}

      {/* ── Progress Tab ─────────────────────────────────────────── */}
      {activeTab === "progress" && (
        <div className="space-y-5">
          {trends.length < 2 ? (
            <div className="text-center py-16 space-y-2" data-testid="text-empty-trends">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Start recording to see trends</p>
              <p className="text-xs text-muted-foreground/60">Log your wellbeing for at least 2 days to unlock charts.</p>
            </div>
          ) : (
            <>
              {/* Insight */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-primary/5 border border-primary/15" data-testid="text-insight">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80">{getInsightText(trends, progressRange)}</p>
              </div>

              {/* Stat cards */}
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

              {/* Current mood + energy display */}
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

              {/* Weight chart */}
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

              {/* BMI chart */}
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

              {/* Mood + Sleep + Energy chart */}
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

      {/* Copy from planner modal */}
      <CopyFromPlannerModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        onConfirm={(slots) => copyFromPlannerMut.mutate(slots)}
        isPending={copyFromPlannerMut.isPending}
      />

      {/* Import diary modal */}
      <ImportDiaryModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
    </div>
  );
}
