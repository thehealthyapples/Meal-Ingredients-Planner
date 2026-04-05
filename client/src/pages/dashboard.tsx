import { useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useMealsSummary } from "@/hooks/use-meals-summary";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Utensils, ShoppingBasket, Plus, ArrowRight,
  CalendarDays, Leaf, CheckCircle2, Circle, Apple, Scale,
  Sparkles, Moon, Zap, Activity, Droplet, Heart, ClipboardCheck,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import OrchardHero from "@/components/illustrations/orchard-hero";
import AppleRating from "@/components/ui/apple-rating";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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
  const { meals } = useMealsSummary();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });

  const { data: plannerFull = [] } = useQuery<any[]>({
    queryKey: ["/api/planner/full"],
    enabled: !!user,
  });

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
      (i: any) => i.thaRating !== null && i.thaRating !== undefined && (i.thaRating as number) > 0
    );
    if (!rated.length) return null;
    return rated.reduce((sum: number, i: any) => sum + (i.thaRating as number), 0) / rated.length;
  }, [shoppingListItems]);

  const displayName = user?.displayName || user?.username || "there";

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, hsl(132,22%,90%) 0%, hsl(118,19%,94%) 50%, hsl(var(--background)) 100%)`,
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 90, opacity: 0.45 }}>
          <OrchardHero />
        </div>
        <div className="relative z-10" style={{ padding: "var(--space-5) 0 56px" }}>
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Leaf className="h-3.5 w-3.5" style={{ color: GREEN_DEEP }} />
              <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: GREEN_DEEP, opacity: 0.65 }}>
                The Healthy Apples
              </span>
            </div>
            <h1 className="title-page" data-testid="text-welcome" style={{ color: GREEN_DEEP }}>
              {getGreeting()}, {displayName.split("@")[0]}
            </h1>
            <p className="text-sm mt-1" style={{ color: GREEN_MID }}>
              {mealsPlannedThisWeek > 0
                ? `${mealsPlannedThisWeek} meal${mealsPlannedThisWeek !== 1 ? "s" : ""} planned this week · ${userMeals.length} in your collection`
                : userMeals.length > 0
                  ? `${userMeals.length} meal${userMeals.length !== 1 ? "s" : ""} in your collection - ready to plan your week?`
                  : "Start building your healthy meal collection"}
            </p>
          </motion.div>
          </div>
        </div>
        <div className="relative z-10">
          <svg viewBox="0 0 1440 24" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="w-full" preserveAspectRatio="none" style={{ height: 24, display: "block" }}>
            <path d="M0 0C240 24 480 24 720 12C960 0 1200 0 1440 12V24H0V0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

          {/* ── Stat strip ── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Cookbook */}
              <Link href="/meals" aria-label="Go to Cookbook">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-total-meals"
                  style={{ background: GREEN_PALE, borderColor: "hsl(132,18%,85%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: GREEN_MID }}>Cookbook</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(132,18%,88%)" }}>
                        <Utensils className="h-4 w-4" style={{ color: GREEN_DEEP }} />
                      </div>
                    </div>
                    <div className="text-numeric" style={{ color: GREEN_DEEP }} data-testid="text-meal-count">{userMeals.length}</div>
                    <p className="text-xs mt-1" style={{ color: GREEN_MID }}>
                      {userMeals.length === 1 ? "recipe saved" : "recipes saved"}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Basket - neutral blue, not a warning colour */}
              <Link href="/analyse-basket" aria-label="Go to Basket">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-basket-items"
                  style={{ background: BASKET_BG, borderColor: BASKET_BORDER }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: BASKET_FG }}>Basket</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BASKET_ICON_BG }}>
                        <ShoppingBasket className="h-4 w-4" style={{ color: BASKET_FG }} />
                      </div>
                    </div>
                    <div className="text-numeric" style={{ color: BASKET_FG }} data-testid="text-basket-count">{shoppingListItems.length}</div>
                    <p className="text-xs mt-1" style={{ color: BASKET_FG, opacity: 0.75 }}>
                      {shoppingListItems.length === 1 ? "item to buy" : "items to buy"}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* This Week */}
              <Link href="/weekly-planner" aria-label="Go to Planner">
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
              <Link href="/analyse-basket" aria-label="Go to Basket Analysis" className="col-span-2 lg:col-span-1">
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
                          <AppleRating rating={avgThaScore} size={22} />
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
              <Link href="/weekly-planner">
                <Button variant="ghost" className="text-sm text-muted-foreground gap-1" data-testid="link-go-planner">
                  Open planner <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <Card style={{ borderColor: "hsl(132,14%,87%)" }}>
              <CardContent className="p-5 pt-4">
                {mealsPlannedThisWeek === 0 ? (
                  <div className="flex flex-col items-center py-7 gap-3">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/25" />
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      No meals planned yet - head to the planner to map out your week.
                    </p>
                    <Link href="/weekly-planner">
                      <Button variant="outline" size="sm" data-testid="button-start-planning">Start planning</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekData} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "hsl(120, 5%, 50%)" }}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(120, 5%, 60%)" }}
                          width={28}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(132,14%,96%)", radius: 6 }}
                          contentStyle={{
                            border: "1px solid hsl(132,14%,87%)",
                            borderRadius: 8,
                            fontSize: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                          formatter={(v: number) => [`${v} meal${v !== 1 ? "s" : ""}`, ""]}
                          labelStyle={{ color: GREEN_DEEP, fontWeight: 600 }}
                        />
                        <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                          {weekData.map((d, i) => (
                            <Cell key={i} fill={d.count > 0 ? GREEN_MID : "hsl(132,14%,88%)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Meal mix + Quick actions ── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Meal mix */}
              <div>
                <h2 className="title-section mb-3">Your Collection</h2>
                <Card style={{ borderColor: "hsl(132,14%,87%)" }}>
                  <CardContent className="p-5">
                    {!meals?.length ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No meals in your collection yet.</p>
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
                          <Link href="/meals" className="mt-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 text-muted-foreground" data-testid="link-view-all-meals-mix">
                              View all <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick actions */}
              <div>
                <h2 className="title-section mb-3">Quick Actions</h2>
                <div className="flex flex-col gap-3">
                  <Link href="/meals">
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
                  <Link href="/weekly-planner">
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
                  <Link href="/analyse-basket">
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
                  <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-log-weight" onClick={() => setWeightOpen(true)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                        <Scale className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="title-card">Log Today's Weight</p>
                        <p className="text-xs text-muted-foreground">Keep track of your progress</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
                    </CardContent>
                  </Card>
                  <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-log-signals" onClick={() => setSignalsOpen(true)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="title-card">Log Daily Signals</p>
                        <p className="text-xs text-muted-foreground">Mood, energy, sleep &amp; more</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
                    </CardContent>
                  </Card>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ── Recent Meals ── */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="title-section">Recent Meals</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your latest additions</p>
              </div>
              {userMeals.length > 4 && (
                <Link href="/meals">
                  <Button variant="ghost" className="text-sm text-muted-foreground gap-1" data-testid="link-view-all-meals">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>

            {userMeals.length === 0 ? (
              <Card className="border-dashed" data-testid="card-empty-meals">
                <CardContent className="py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: GREEN_PALE }}>
                    <Utensils className="h-6 w-6" style={{ color: GREEN_DEEP }} />
                  </div>
                  <h3 className="font-semibold text-base">No meals yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Start by adding your favourite recipes to build your personal collection.
                  </p>
                  <Link href="/meals">
                    <Button className="mt-5" data-testid="button-add-first-meal">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Meal
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {userMeals.slice(0, 4).map((meal) => (
                  <Link key={meal.id} href={`/meals/${meal.id}`}>
                    <Card className="group cursor-pointer overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-recent-meal-${meal.id}`}>
                      {meal.imageUrl ? (
                        <div className="w-full aspect-[4/3] overflow-hidden bg-muted">
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-[4/3] flex items-center justify-center" style={{ background: GREEN_PALE }}>
                          <Utensils className="h-8 w-8" style={{ color: GREEN_MID, opacity: 0.4 }} />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="title-card truncate">{meal.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {meal.ingredientCount} ingredient{meal.ingredientCount !== 1 ? "s" : ""}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
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
              <Label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</Label>
              <Input
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
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Moon className="h-3.5 w-3.5" /> Sleep (hours)
              </Label>
              <Input
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
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Activity className="h-3.5 w-3.5" /> Blood pressure (mmHg)
              </Label>
              <Input
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
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Droplet className="h-3.5 w-3.5" /> Blood sugar (mmol/L)
              </Label>
              <Input
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
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Heart className="h-3.5 w-3.5" /> Heart rate (BPM)
              </Label>
              <Input
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
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5 block">
                <Zap className="h-3.5 w-3.5" /> Notes
              </Label>
              <Textarea
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
            <Button
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
            <Button
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
  );
}
