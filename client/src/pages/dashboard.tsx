import { useMemo, useState, useCallback } from "react";
import { householdGreeting } from "@/lib/greeting";
import { DECLARED_DEFAULT_ZONE } from "@shared/time/household-time";
import { useUser } from "@/hooks/use-user";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import HomeIntelligenceCompanion from "@/components/HomeIntelligenceCompanion";
import { AmbientIntelligence } from "@/components/intelligence";
import { useMealsSummary } from "@/hooks/use-meals-summary";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Utensils, ShoppingBasket, Plus, ArrowRight,
  CalendarDays, CheckCircle2, Circle, Apple, Scale,
  Sparkles, Moon, Zap, Activity, Droplet, Heart, ClipboardCheck,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppleRating from "@/components/AppleRating";
import { MealCard } from "@/components/MealCard";
import { canShowScoreForItem } from "@/lib/basket-item-classifier";
import ThaAppleIcon from "@/components/icons/ThaAppleIcon";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const GREEN_DEEP = "hsl(132, 25%, 30%)";
const GREEN_MID = "hsl(132, 18%, 46%)";
const GREEN_PALE = "hsl(132, 20%, 96%)";
const SAGE = "hsl(118, 16%, 91%)";

const BASKET_BG = "hsl(218, 30%, 96%)";
const BASKET_FG = "hsl(218, 28%, 42%)";
const BASKET_ICON_BG = "hsl(218, 26%, 90%)";
const BASKET_BORDER = "hsl(218, 20%, 87%)";

const APPLE_BG = "hsl(90, 32%, 95%)";
const APPLE_FG = "hsl(90, 28%, 36%)";
const APPLE_ICON_BG = "hsl(90, 26%, 89%)";
const APPLE_BORDER = "hsl(90, 20%, 85%)";

const BERRY = "hsl(340, 28%, 48%)";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// CONV1 P6 (Phase 3) — the local `getGreeting()` is RETIRED into
// `@/lib/greeting` (architecture § 14, target 3: 4 → 1). It read
// `new Date().getHours()` — the DEVICE's hour — with its own private 12/17
// boundary. Same words, same boundary; the hour is now the household's.

function getMealDisplayCat(meal: any): "user" | "web" | "tha" | "ready" {
  if (meal.isReadyMeal || meal.mealFormat === "ready-meal") return "ready";
  if (meal.isSystemMeal) return "tha";
  if (meal.sourceUrl) return "web";
  return "user";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

export default function Dashboard() {
  const { user } = useUser();
  // PX1-W0 (fnd-px-false-empty-dashboard). This page destructured only `{ meals }`
  // from a hook that has always exposed `isLoading`, and defaulted its other two
  // queries to `= []`. Every visit therefore began by telling the household their
  // cookbook was empty, their week was unplanned and their collection did not
  // exist — the best-designed empty states in the codebase, firing falsely — and a
  // failed request said exactly the same thing as a genuinely empty household.
  // Waiting, broken and empty are three states and are now rendered as three.
  const { meals, isLoading: mealsLoading, isError: mealsError, refetch: refetchMeals } = useMealsSummary();
  const { toast } = useToast();
  const qc = useQueryClient();

  // CONV1 P6 / greeting — the household's own clock. `timeZone` is null until the
  // household tells THA where it lives; the DECLARED default resolves at read time
  // and is never written to the row (CP8).
  const { data: householdForClock } = useQuery<{ timeZone: string | null }>({
    queryKey: ["/api/household"],
    enabled: !!user,
  });
  const householdZone = householdForClock?.timeZone ?? DECLARED_DEFAULT_ZONE;

  const shoppingQuery = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });

  const plannerQuery = useQuery<any[]>({
    queryKey: ["/api/planner/full"],
    enabled: !!user,
  });

  const shoppingListItems = shoppingQuery.data ?? [];
  const plannerFull = plannerQuery.data ?? [];

  const [weightOpen, setWeightOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  const saveWeightMutation = useMutation({
    mutationFn: async (weightKg: number) => {
      const res = await apiRequest("PUT", "/api/profile", { weightKg });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Weight saved", description: `${weightInput} kg logged for today.` });
      setWeightOpen(false);
      setWeightInput("");
    },
    onError: () => toast({ title: "Failed to save weight", variant: "destructive" }),
  });

  const today = new Date().toISOString().slice(0, 10);

  const [signalsOpen, setSignalsOpen] = useState(false);
  const [signalsForm, setSignalsForm] = useState({
    weightKg: "",
    moodApples: null as number | null,
    energyApples: null as number | null,
    sleepHours: "",
    notes: "",
    stuckToPlan: false,
    bloodPressure: "",
    bloodSugar: "",
    bpm: "",
  });

  const setSignal = <K extends keyof typeof signalsForm>(k: K, v: (typeof signalsForm)[K]) =>
    setSignalsForm((f) => ({ ...f, [k]: v }));

  const resetSignalsForm = () =>
    setSignalsForm({ weightKg: "", moodApples: null, energyApples: null, sleepHours: "", notes: "", stuckToPlan: false, bloodPressure: "", bloodSugar: "", bpm: "" });

  const saveSignalsMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await apiRequest("PATCH", `/api/food-diary/${today}/metrics`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/food-diary", today] });
      toast({ title: "Daily signals saved" });
      setSignalsOpen(false);
      resetSignalsForm();
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const submitSignals = () => {
    const payload: Record<string, unknown> = {};
    if (signalsForm.weightKg.trim()) payload.weightKg = parseFloat(signalsForm.weightKg);
    if (signalsForm.moodApples !== null) payload.moodApples = signalsForm.moodApples;
    if (signalsForm.energyApples !== null) payload.energyApples = signalsForm.energyApples;
    if (signalsForm.sleepHours.trim()) payload.sleepHours = parseFloat(signalsForm.sleepHours);
    if (signalsForm.notes.trim()) payload.notes = signalsForm.notes;
    payload.stuckToPlan = signalsForm.stuckToPlan;
    const customVals: Record<string, string> = {};
    if (signalsForm.bloodPressure.trim()) customVals.bloodPressure = signalsForm.bloodPressure;
    if (signalsForm.bloodSugar.trim()) customVals.bloodSugar = signalsForm.bloodSugar;
    if (signalsForm.bpm.trim()) customVals.bpm = signalsForm.bpm;
    if (Object.keys(customVals).length > 0) payload.customValues = customVals;
    saveSignalsMutation.mutate(payload);
  };

  const userMeals = meals?.filter(m => !m.isSystemMeal) || [];

  const mealMix = useMemo(() => {
    if (!meals?.length) return [];
    const counts = { user: 0, web: 0, tha: 0, ready: 0 };
    meals.forEach(m => { counts[getMealDisplayCat(m)]++; });
    return [
      { name: "Saved Recipes", value: counts.user, color: GREEN_MID },
      { name: "From the Web", value: counts.web, color: "hsl(132, 14%, 65%)" },
      { name: "The Healthy Apples", value: counts.tha, color: "hsl(118, 16%, 72%)" },
      { name: "Ready Meals", value: counts.ready, color: BERRY },
    ].filter(d => d.value > 0);
  }, [meals]);

  const weekData = useMemo(() => {
    if (!plannerFull.length) {
      return DAY_LABELS.map(d => ({ day: d, count: 0 }));
    }
    const firstWeek = plannerFull[0];
    const days = [...(firstWeek?.days || [])].sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek);
    return DAY_LABELS.map((label, i) => {
      const day = days[i];
      return { day: label, count: day?.entries?.length ?? 0 };
    });
  }, [plannerFull]);

  const mealsPlannedThisWeek = weekData.reduce((s, d) => s + d.count, 0);
  const daysWithMeals = weekData.filter(d => d.count > 0).length;

  const avgThaScore = useMemo(() => {
    const rated = shoppingListItems.filter(
      (i: any) =>
        canShowScoreForItem(i) &&
        i.thaRating !== null && i.thaRating !== undefined && (i.thaRating as number) > 0
    );
    if (!rated.length) return null;
    return rated.reduce((sum: number, i: any) => sum + (i.thaRating as number), 0) / rated.length;
  }, [shoppingListItems]);

  const displayName = user?.displayName || user?.username || "there";
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      navigate(`/cookbook?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }, [searchQuery, navigate]);

  return (
    <>
    <WorkspaceHeader
      realm="home"
      title="Dashboard"
      wide
      titleTestId="text-dashboard-title"
      search={{
        placeholder: "Search meals...",
        value: searchQuery,
        onChange: setSearchQuery,
        onSubmit: handleSearch,
      }}
      actions={
        <p className="text-sm font-medium realm-title leading-none hidden sm:block whitespace-nowrap" data-testid="text-welcome">
          {householdGreeting(new Date(), householdZone)}, {displayName.split("@")[0]}
        </p>
      }
      contextBar={
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <Link href="/my-diary">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium realm-banner-btn shrink-0 transition-colors"
              data-testid="button-dashboard-log-food"
            >
              <Utensils className="h-3.5 w-3.5" />
              <span>Log Food</span>
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setSignalsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 transition-colors"
            data-testid="button-dashboard-log-signals"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Log Signals</span>
          </button>
          <button
            type="button"
            onClick={() => setWeightOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 transition-colors"
            data-testid="button-dashboard-log-weight"
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Log Weight</span>
          </button>
          <Link href="/planner">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0 transition-colors"
              data-testid="button-dashboard-plan-week"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Plan Week</span>
            </button>
          </Link>
        </div>
      }
    />
    <div>

      <div className={`${pageContainerClass(true)} pb-3 space-y-4`}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

          {/* ── Home Intelligence Companion ── */}
          <motion.div variants={item}>
            <HomeIntelligenceCompanion />
          </motion.div>

          {/* PHASE5C — the Decision Engine's own opportunities, aggregated across
              every domain. The Dashboard is the ONE sanctioned aggregate view
              (Home stays the calm landing and keeps the Notice Engine's silence-
              ruled reminders — Home unharmed). Unlike the companion above, these
              carry their evidence ("Why") and are resolvable, which is what feeds
              Evidence back into Household Learning. */}
          <motion.div variants={item}>
            <AmbientIntelligence surfaceKey="dashboard" title="Things you could do" />
          </motion.div>

          {/* ── Recent Meals — conversational first, before numbers ── */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="title-section">Recent Meals</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your latest additions</p>
              </div>
              {userMeals.length > 4 && (
                <Link href="/cookbook">
                  <Button variant="ghost" className="text-sm text-muted-foreground gap-1" data-testid="link-view-all-meals">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>

            {mealsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="loading-recent-meals">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-full aspect-[4/3] rounded-xl" />
                ))}
              </div>
            ) : mealsError ? (
              <LoadError
                what="your recent meals"
                onRetry={() => refetchMeals()}
                data-testid="error-recent-meals"
              />
            ) : userMeals.length === 0 ? (
              <EmptyState
                variant="empty"
                icon={Utensils}
                title="No meals yet"
                description="Start by adding your favourite recipes to build your personal collection."
                action={
                  <Link href="/cookbook">
                    <Button variant="default" data-testid="button-add-first-meal">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Meal
                    </Button>
                  </Link>
                }
                data-testid="card-empty-meals"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {userMeals.slice(0, 4).map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    variant="tile"
                    meta={`${meal.ingredientCount} ingredient${meal.ingredientCount !== 1 ? "s" : ""}`}
                    data-testid={`card-recent-meal-${meal.id}`}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Stat strip ── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Cookbook */}
              <Link href="/cookbook" aria-label="Go to Cookbook">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-total-meals"
                  style={{ background: GREEN_PALE, borderColor: "hsl(132,18%,85%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: GREEN_MID }}>Cookbook</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(132,18%,88%)" }}>
                        <Utensils className="h-4 w-4" style={{ color: GREEN_DEEP }} />
                      </div>
                    </div>
                    {/* A count is a claim. While it is unknown, THA says nothing rather than "0". */}
                    {mealsLoading ? (
                      <Skeleton className="h-9 w-14" data-testid="loading-meal-count" />
                    ) : (
                      <div className="text-numeric" style={{ color: GREEN_DEEP }} data-testid="text-meal-count">
                        {mealsError ? "—" : userMeals.length}
                      </div>
                    )}
                    <p className="text-xs mt-1" style={{ color: GREEN_MID }}>
                      {mealsError ? "count unavailable" : userMeals.length === 1 ? "recipe saved" : "recipes saved"}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Basket */}
              <Link href="/basket" aria-label="Go to Basket">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-basket-items"
                  style={{ background: BASKET_BG, borderColor: BASKET_BORDER }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: BASKET_FG }}>Basket</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BASKET_ICON_BG }}>
                        <ShoppingBasket className="h-4 w-4" style={{ color: BASKET_FG }} />
                      </div>
                    </div>
                    {shoppingQuery.isLoading ? (
                      <Skeleton className="h-9 w-14" data-testid="loading-basket-count" />
                    ) : (
                      <div className="text-numeric" style={{ color: BASKET_FG }} data-testid="text-basket-count">
                        {shoppingQuery.isError ? "—" : shoppingListItems.length}
                      </div>
                    )}
                    <p className="text-xs mt-1" style={{ color: BASKET_FG, opacity: 0.75 }}>
                      {shoppingQuery.isError
                        ? "count unavailable"
                        : shoppingListItems.length === 1 ? "item to buy" : "items to buy"}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* This Week */}
              <Link href="/planner" aria-label="Go to Planner">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-week-progress"
                  style={{ background: SAGE, borderColor: "hsl(118,14%,84%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">This Week</span>
                      <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-numeric">{daysWithMeals}</div>
                      <div className="text-sm text-muted-foreground mb-0.5">/ 7 days</div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {weekData.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                          {d.count > 0
                            ? <CheckCircle2 className="h-3 w-3" style={{ color: GREEN_MID }} />
                            : <Circle className="h-3 w-3 text-muted-foreground/30" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* THA Health Score */}
              <Link href="/basket" aria-label="Go to Basket Analysis" className="col-span-2 lg:col-span-1">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-tha-score"
                  style={{ background: APPLE_BG, borderColor: APPLE_BORDER }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: APPLE_FG }}>THA Score</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: APPLE_ICON_BG }}>
                        <Apple className="h-4 w-4" style={{ color: APPLE_FG }} />
                      </div>
                    </div>
                    {avgThaScore !== null ? (
                      <>
                        <div className="mt-1 mb-1">
                          <AppleRating rating={avgThaScore} sizePx={22} showTooltip={false} animate={false} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: APPLE_FG, opacity: 0.8 }}>
                          {avgThaScore >= 4.5
                            ? "Excellent basket health"
                            : avgThaScore >= 3.5
                            ? "Good basket health"
                            : avgThaScore >= 2.5
                            ? "Fair basket health"
                            : "Room to improve"}
                          {" · "}avg {avgThaScore.toFixed(1)}/5
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-numeric" style={{ color: APPLE_FG }}>-</div>
                        <p className="text-xs mt-1" style={{ color: APPLE_FG, opacity: 0.75 }}>
                          {shoppingListItems.length > 0 ? "Analyse basket to score" : "Add items to basket"}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>

            </div>
          </motion.div>

          {/* ── Weekly planner chart ── */}
          <motion.div variants={item}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="title-section">This Week's Plan</h2>
              <Link href="/planner">
                <Button variant="ghost" className="text-sm text-muted-foreground gap-1" data-testid="link-go-planner">
                  Open planner <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            {plannerQuery.isError ? (
              <LoadError
                what="this week's plan"
                onRetry={() => plannerQuery.refetch()}
                data-testid="error-week-plan"
              />
            ) : (
            <Card>
              <CardContent className="p-5 pt-4">
                {plannerQuery.isLoading ? (
                  <Skeleton className="h-36 w-full" data-testid="loading-week-plan" />
                ) : mealsPlannedThisWeek === 0 ? (
                  <EmptyState
                    variant="empty"
                    size="compact"
                    icon={CalendarDays}
                    title="No meals planned yet"
                    description="Head to the planner to map out your week."
                    action={
                      <Link href="/planner">
                        <Button variant="outline" size="sm" data-testid="button-start-planning">Start planning</Button>
                      </Link>
                    }
                    data-testid="empty-week-plan"
                  />
                ) : (
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekData} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          width={28}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))", radius: 6 }}
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            color: "hsl(var(--popover-foreground))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                          formatter={(v: number) => [`${v} meal${v !== 1 ? "s" : ""}`, ""]}
                          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                        />
                        <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                          {weekData.map((d, i) => (
                            <Cell key={i} fill={d.count > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </motion.div>

          {/* ── Collection overview + Quick actions ── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Meal mix */}
              <div>
                <h2 className="title-section mb-3">Your Collection</h2>
                {mealsError ? (
                  <LoadError
                    what="your collection"
                    onRetry={() => refetchMeals()}
                    data-testid="error-collection"
                  />
                ) : (
                <Card>
                  <CardContent className="p-5">
                    {mealsLoading ? (
                      <Skeleton className="h-[110px] w-full" data-testid="loading-collection" />
                    ) : !meals?.length ? (
                      <EmptyState
                        variant="empty"
                        size="compact"
                        title="No meals in your collection yet."
                        data-testid="empty-collection"
                      />
                    ) : (
                      <div className="flex items-center gap-6">
                        <div className="shrink-0" style={{ width: 110, height: 110 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={mealMix}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={3}
                                strokeWidth={0}
                              >
                                {mealMix.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-2">
                          {mealMix.map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                              <div>
                                <span className="text-sm font-medium">{d.value}</span>
                                <span className="text-xs text-muted-foreground ml-1">{d.name}</span>
                              </div>
                            </div>
                          ))}
                          <Link href="/cookbook" className="mt-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-muted-foreground" data-testid="link-view-all-meals-mix">
                              View all <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
              </div>

              {/* Quick actions — 3 primary actions */}
              <div>
                <h2 className="title-section mb-3">Quick Actions</h2>
                <div className="flex flex-col gap-3">
                  <Link href="/cookbook">
                    <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-add-meal">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="title-card">Add Recipe</p>
                          <p className="text-xs text-muted-foreground">Browse or create a new recipe</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/planner">
                    <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-view-planner">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                          <CalendarDays className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="title-card">Plan Your Week</p>
                          <p className="text-xs text-muted-foreground">Map out meals for the next 7 days</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/basket">
                    <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-analyse-basket">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                          <ShoppingBasket className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="title-card">Analyse Basket</p>
                          <p className="text-xs text-muted-foreground">Check prices and product health</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                  {/* Secondary health-tracking actions — compact row */}
                  <div className="flex gap-2 pt-1">
                    <button
                      className="flex-1 text-left text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border/50 hover:border-border transition-colors"
                      onClick={() => setWeightOpen(true)}
                      data-testid="action-log-weight"
                    >
                      <Scale className="h-3.5 w-3.5 inline mr-1.5 opacity-60" />
                      Log weight
                    </button>
                    <button
                      className="flex-1 text-left text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border/50 hover:border-border transition-colors"
                      onClick={() => setSignalsOpen(true)}
                      data-testid="action-log-signals"
                    >
                      <Sparkles className="h-3.5 w-3.5 inline mr-1.5 opacity-60" />
                      Log signals
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </motion.div>
      </div>

      <Dialog open={signalsOpen} onOpenChange={(v) => { if (!v) { setSignalsOpen(false); resetSignalsForm(); } }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Log Daily Signals
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Weight */}
            <div>
              <Label htmlFor="signals-weight" className="text-xs text-muted-foreground mb-1 block">Weight (kg)</Label>
              <Input
                id="signals-weight"
                type="number" step="0.1"
                placeholder="e.g. 72.5"
                value={signalsForm.weightKg}
                onChange={(e) => setSignal("weightKg", e.target.value)}
                className="h-8 text-sm"
                data-testid="input-signals-weight"
              />
            </div>

            {/* Mood + Energy */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Mood</Label>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSignal("moodApples", n)}
                      aria-label={`Set mood to ${n} of 5`}
                      className={`transition-all ${signalsForm.moodApples !== null && n <= signalsForm.moodApples ? "opacity-100 scale-100" : "opacity-20 hover:opacity-50 hover:scale-105"}`}
                    >
                      <ThaAppleIcon size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Energy</Label>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSignal("energyApples", n)}
                      aria-label={`Set energy to ${n} of 5`}
                      className={`transition-all ${signalsForm.energyApples !== null && n <= signalsForm.energyApples ? "opacity-100 scale-100" : "opacity-20 hover:opacity-50 hover:scale-105"}`}
                    >
                      <ThaAppleIcon size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sleep */}
            <div>
              <Label htmlFor="signals-sleep" className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Moon className="h-3.5 w-3.5" /> Sleep (hours)
              </Label>
              <Input
                id="signals-sleep"
                type="number" step="0.5"
                placeholder="e.g. 7.5"
                value={signalsForm.sleepHours}
                onChange={(e) => setSignal("sleepHours", e.target.value)}
                className="h-8 text-sm"
                data-testid="input-signals-sleep"
              />
            </div>

            {/* Stuck to plan */}
            <div className="flex items-center gap-2.5">
              <Switch
                id="signals-stuck"
                checked={signalsForm.stuckToPlan}
                onCheckedChange={(v) => setSignal("stuckToPlan", v)}
                data-testid="switch-signals-stuck"
              />
              <Label htmlFor="signals-stuck" className="text-xs cursor-pointer flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" /> Stuck to meal plan
              </Label>
            </div>

            {/* Blood pressure */}
            <div>
              <Label htmlFor="signals-bp" className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Activity className="h-3.5 w-3.5" /> Blood pressure (mmHg)
              </Label>
              <Input
                id="signals-bp"
                type="text"
                placeholder="e.g. 120/80"
                value={signalsForm.bloodPressure}
                onChange={(e) => setSignal("bloodPressure", e.target.value)}
                className="h-8 text-sm"
                data-testid="input-signals-bp"
              />
            </div>

            {/* Blood sugar */}
            <div>
              <Label htmlFor="signals-sugar" className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Droplet className="h-3.5 w-3.5" /> Blood sugar (mmol/L)
              </Label>
              <Input
                id="signals-sugar"
                type="number" step="0.1"
                placeholder="e.g. 5.4"
                value={signalsForm.bloodSugar}
                onChange={(e) => setSignal("bloodSugar", e.target.value)}
                className="h-8 text-sm"
                data-testid="input-signals-sugar"
              />
            </div>

            {/* Heart rate */}
            <div>
              <Label htmlFor="signals-bpm" className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Heart className="h-3.5 w-3.5" /> Heart rate (BPM)
              </Label>
              <Input
                id="signals-bpm"
                type="number" step="1"
                placeholder="e.g. 68"
                value={signalsForm.bpm}
                onChange={(e) => setSignal("bpm", e.target.value)}
                className="h-8 text-sm"
                data-testid="input-signals-bpm"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="signals-notes" className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Zap className="h-3.5 w-3.5" /> Notes
              </Label>
              <Textarea
                id="signals-notes"
                placeholder="How did today go?"
                value={signalsForm.notes}
                onChange={(e) => setSignal("notes", e.target.value)}
                className="text-sm min-h-[56px] resize-none"
                data-testid="textarea-signals-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setSignalsOpen(false); resetSignalsForm(); }}>Cancel</Button>
            <Button variant="default"
              size="sm"
              onClick={submitSignals}
              disabled={saveSignalsMutation.isPending}
              data-testid="button-save-signals"
            >
              {saveSignalsMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={weightOpen} onOpenChange={(v) => { if (!v) { setWeightOpen(false); setWeightInput(""); } }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Log Today's Weight
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-3">Enter your current weight in kilograms.</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="e.g. 74.5"
                aria-label="Weight in kilograms"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && weightInput && !saveWeightMutation.isPending) {
                    saveWeightMutation.mutate(Number(weightInput));
                  }
                }}
                data-testid="input-quick-weight"
              />
              <span className="text-sm text-muted-foreground shrink-0">kg</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setWeightOpen(false); setWeightInput(""); }}>Cancel</Button>
            <Button variant="default"
              size="sm"
              onClick={() => saveWeightMutation.mutate(Number(weightInput))}
              disabled={!weightInput || Number(weightInput) <= 0 || saveWeightMutation.isPending}
              data-testid="button-save-quick-weight"
            >
              {saveWeightMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
