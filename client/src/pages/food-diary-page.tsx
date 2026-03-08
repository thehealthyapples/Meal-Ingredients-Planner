import { useState, useMemo } from "react";
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
  ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Pencil, Check, X,
  Copy, Loader2, TrendingUp, Weight, Moon, Zap, BookOpen, ClipboardCheck,
  Sun, Coffee, UtensilsCrossed,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

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
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function AppleScorePicker({
  value,
  onChange,
  max = 5,
  testId,
}: {
  value: number | null;
  onChange: (v: number) => void;
  max?: number;
  testId?: string;
}) {
  return (
    <div className="flex gap-1" data-testid={testId}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-lg transition-opacity ${value !== null && n <= value ? "opacity-100" : "opacity-25 hover:opacity-60"}`}
          data-testid={`${testId}-${n}`}
        >
          🍎
        </button>
      ))}
    </div>
  );
}

function MetricStatCard({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="text-center px-3 py-2 rounded-md bg-muted/40 border border-border/50">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-base font-semibold text-foreground" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value !== null && value !== undefined ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
      </p>
    </div>
  );
}

export default function FoodDiaryPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [date, setDate] = useState<string>(toDateStr(new Date()));
  const [activeTab, setActiveTab] = useState<"diary" | "progress">("diary");

  const [addingSlot, setAddingSlot] = useState<MealSlot | null>(null);
  const [addingName, setAddingName] = useState("");
  const [editingEntry, setEditingEntry] = useState<{ id: number; name: string } | null>(null);

  const [metricsForm, setMetricsForm] = useState<{
    weightKg: string;
    moodApples: number | null;
    sleepHours: string;
    energyApples: number | null;
    notes: string;
    stuckToPlan: boolean;
  }>({ weightKg: "", moodApples: null, sleepHours: "", energyApples: null, notes: "", stuckToPlan: false });
  const [editingMetrics, setEditingMetrics] = useState(false);

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
    queryKey: ["/api/food-diary/metrics/trends"],
    queryFn: async () => {
      const res = await fetch("/api/food-diary/metrics/trends?days=90", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: activeTab === "progress",
  });

  const copyFromPlannerMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/food-diary/${date}/copy-from-planner`, {}),
    onSuccess: async (res) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: diaryKey });
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

  const saveMetricsMut = useMutation({
    mutationFn: (data: object) => apiRequest("PATCH", `/api/food-diary/${date}/metrics`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: diaryKey }); qc.invalidateQueries({ queryKey: ["/api/food-diary/metrics/trends"] }); setEditingMetrics(false); toast({ title: "Metrics saved" }); },
    onError: () => toast({ title: "Failed to save metrics", variant: "destructive" }),
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
    const base: Record<MealSlot, DiaryEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const e of diary?.entries ?? []) {
      const s = e.mealSlot as MealSlot;
      if (base[s]) base[s].push(e);
    }
    return base;
  }, [diary?.entries]);

  const startEditingMetrics = () => {
    const m = diary?.metrics;
    setMetricsForm({
      weightKg: m?.weightKg != null ? String(m.weightKg) : "",
      moodApples: m?.moodApples ?? null,
      sleepHours: m?.sleepHours != null ? String(m.sleepHours) : "",
      energyApples: m?.energyApples ?? null,
      notes: m?.notes ?? "",
      stuckToPlan: m?.stuckToPlan ?? false,
    });
    setEditingMetrics(true);
  };

  const submitMetrics = () => {
    const payload: Record<string, unknown> = {};
    if (metricsForm.weightKg.trim()) payload.weightKg = parseFloat(metricsForm.weightKg);
    if (metricsForm.moodApples !== null) payload.moodApples = metricsForm.moodApples;
    if (metricsForm.sleepHours.trim()) payload.sleepHours = parseFloat(metricsForm.sleepHours);
    if (metricsForm.energyApples !== null) payload.energyApples = metricsForm.energyApples;
    if (metricsForm.notes.trim()) payload.notes = metricsForm.notes;
    payload.stuckToPlan = metricsForm.stuckToPlan;
    saveMetricsMut.mutate(payload);
  };

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
  const weightChange = latestMetrics?.weightKg != null && weekAgoMetrics?.weightKg != null
    ? Math.round((latestMetrics.weightKg - weekAgoMetrics.weightKg) * 10) / 10
    : null;
  const avgSleep = trends.length >= 2
    ? Math.round((trends.reduce((s, t) => s + (t.sleepHours ?? 0), 0) / trends.filter(t => t.sleepHours != null).length) * 10) / 10
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          My Diary
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your meals and wellbeing day by day.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "diary" | "progress")}>
        <TabsList className="mb-5" data-testid="tabs-diary">
          <TabsTrigger value="diary" data-testid="tab-diary">Daily Log</TabsTrigger>
          <TabsTrigger value="progress" data-testid="tab-progress">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            Progress
          </TabsTrigger>
        </TabsList>

        {/* ── Daily Log Tab ──────────────────────────────────────────────── */}
        <TabsContent value="diary">
          {/* Date nav */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevDay} data-testid="button-prev-day">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[200px]">
                <p className="text-sm font-medium text-foreground" data-testid="text-diary-date">
                  {formatDisplayDate(date)}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={nextDay} data-testid="button-next-day">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {!isToday && (
                <Button variant="ghost" size="sm" onClick={goToday} data-testid="button-today">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Today
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyFromPlannerMut.mutate()}
                disabled={copyFromPlannerMut.isPending}
                data-testid="button-copy-from-planner"
              >
                {copyFromPlannerMut.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copy from Planner
              </Button>
            </div>
          </div>

          {/* Meal slots */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {SLOTS.map(({ key, label, icon: Icon }) => {
                const slotEntries = entriesBySlot[key];
                const isAddingThis = addingSlot === key;
                return (
                  <Card key={key} className="shadow-none border-border" data-testid={`card-slot-${key}`}>
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {label}
                        {slotEntries.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-[10px]" data-testid={`badge-count-${key}`}>
                            {slotEntries.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => { setAddingSlot(key); setAddingName(""); }}
                        data-testid={`button-add-${key}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      {slotEntries.length === 0 && !isAddingThis && (
                        <p className="text-xs text-muted-foreground italic" data-testid={`text-empty-${key}`}>Nothing logged yet.</p>
                      )}
                      <div className="space-y-1.5">
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
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateEntryMut.mutate({ id: entry.id, name: editingEntry.name })} data-testid={`button-save-entry-${entry.id}`}>
                                    <Check className="h-3 w-3 text-primary" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingEntry(null)}>
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
                                    <Button
                                      size="icon" variant="ghost" className="h-6 w-6"
                                      onClick={() => setEditingEntry({ id: entry.id, name: entry.name })}
                                      data-testid={`button-edit-entry-${entry.id}`}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive"
                                      onClick={() => deleteEntryMut.mutate(entry.id)}
                                      data-testid={`button-delete-entry-${entry.id}`}
                                    >
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
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7"
                              disabled={!addingName.trim() || addEntryMut.isPending}
                              onClick={() => addEntryMut.mutate({ name: addingName.trim(), mealSlot: key })}
                              data-testid={`button-confirm-add-${key}`}
                            >
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

              {/* Wellbeing metrics */}
              <Card className="shadow-none border-border mt-2" data-testid="card-metrics">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    Wellbeing
                  </CardTitle>
                  {!editingMetrics && (
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={startEditingMetrics} data-testid="button-edit-metrics">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  {!editingMetrics ? (
                    diary?.metrics ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="metrics-display">
                        <MetricStatCard label="Weight" value={diary.metrics.weightKg} unit="kg" />
                        <MetricStatCard label="BMI" value={diary.metrics.bmi} />
                        <MetricStatCard label="Sleep" value={diary.metrics.sleepHours} unit="hrs" />
                        <MetricStatCard label="Mood" value={diary.metrics.moodApples != null ? "🍎".repeat(diary.metrics.moodApples) : null} />
                        {diary.metrics.stuckToPlan != null && (
                          <div className="col-span-2 sm:col-span-4 flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            {diary.metrics.stuckToPlan ? "Stuck to plan ✓" : "Didn't stick to plan"}
                          </div>
                        )}
                        {diary.metrics.notes && (
                          <p className="col-span-2 sm:col-span-4 text-xs text-muted-foreground mt-1 italic">{diary.metrics.notes}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic" data-testid="text-no-metrics">No metrics recorded. Click the pencil to add.</p>
                    )
                  ) : (
                    <div className="space-y-4" data-testid="metrics-form">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">Weight (kg)</Label>
                          <Input
                            type="number" step="0.1" value={metricsForm.weightKg}
                            onChange={(e) => setMetricsForm(f => ({ ...f, weightKg: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="e.g. 72.5"
                            data-testid="input-weight"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Sleep (hours)</Label>
                          <Input
                            type="number" step="0.5" value={metricsForm.sleepHours}
                            onChange={(e) => setMetricsForm(f => ({ ...f, sleepHours: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="e.g. 7.5"
                            data-testid="input-sleep"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Mood</Label>
                        <AppleScorePicker
                          value={metricsForm.moodApples}
                          onChange={(v) => setMetricsForm(f => ({ ...f, moodApples: v }))}
                          testId="picker-mood"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Energy</Label>
                        <AppleScorePicker
                          value={metricsForm.energyApples}
                          onChange={(v) => setMetricsForm(f => ({ ...f, energyApples: v }))}
                          testId="picker-energy"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="stuck-to-plan"
                          checked={metricsForm.stuckToPlan}
                          onCheckedChange={(v) => setMetricsForm(f => ({ ...f, stuckToPlan: v }))}
                          data-testid="switch-stuck-to-plan"
                        />
                        <Label htmlFor="stuck-to-plan" className="text-xs cursor-pointer">Stuck to meal plan today</Label>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Notes</Label>
                        <Textarea
                          value={metricsForm.notes}
                          onChange={(e) => setMetricsForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="How did you feel today?"
                          className="text-sm min-h-[60px]"
                          data-testid="textarea-notes"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={submitMetrics} disabled={saveMetricsMut.isPending} data-testid="button-save-metrics">
                          {saveMetricsMut.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                          Save Metrics
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingMetrics(false)} data-testid="button-cancel-metrics">Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Progress Tab ───────────────────────────────────────────────── */}
        <TabsContent value="progress">
          {trends.length < 2 ? (
            <div className="text-center py-16 space-y-2" data-testid="text-empty-trends">
              <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Start recording to see trends</p>
              <p className="text-xs text-muted-foreground/70">Log your wellbeing metrics for at least 2 days to see charts.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="progress-stats">
                <MetricStatCard label="Current Weight" value={latestMetrics?.weightKg ?? null} unit="kg" />
                <MetricStatCard
                  label="7-day Change"
                  value={weightChange !== null ? (weightChange > 0 ? `+${weightChange}` : String(weightChange)) : null}
                  unit={weightChange !== null ? "kg" : undefined}
                />
                <MetricStatCard label="Current BMI" value={latestMetrics?.bmi ?? null} />
                <MetricStatCard label="Avg Sleep" value={avgSleep ?? null} unit="hrs" />
              </div>

              {/* Weight chart */}
              {trendChartData.some(d => d.weight != null) && (
                <Card className="shadow-none border-border p-4" data-testid="chart-weight">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    Weight (kg)
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
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
              {trendChartData.some(d => d.bmi != null) && (
                <Card className="shadow-none border-border p-4" data-testid="chart-bmi">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    BMI
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
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
              {trendChartData.some(d => d.mood != null || d.sleep != null || d.energy != null) && (
                <Card className="shadow-none border-border p-4" data-testid="chart-mood-sleep">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Mood, Energy & Sleep
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {trendChartData.some(d => d.mood != null) && (
                        <Line type="monotone" dataKey="mood" name="Mood (apples)" stroke="#e88c4a" strokeWidth={2} dot={false} connectNulls />
                      )}
                      {trendChartData.some(d => d.energy != null) && (
                        <Line type="monotone" dataKey="energy" name="Energy (apples)" stroke="#5aad6f" strokeWidth={2} dot={false} connectNulls />
                      )}
                      {trendChartData.some(d => d.sleep != null) && (
                        <Line type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#7c9fcb" strokeWidth={2} dot={false} connectNulls />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
