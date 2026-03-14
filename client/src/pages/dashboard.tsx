import { useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { useMeals } from "@/hooks/use-meals";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Utensils, ShoppingBasket, Plus, ArrowRight,
  CalendarDays, Leaf, CheckCircle2, Circle,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { api } from "@shared/routes";
import OrchardHero from "@/components/illustrations/orchard-hero";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";

const BERRY = "hsl(340, 28%, 48%)";
const BERRY_LIGHT = "hsl(340, 24%, 94%)";
const GREEN_DEEP = "hsl(132, 25%, 30%)";
const GREEN_MID = "hsl(132, 18%, 46%)";
const GREEN_PALE = "hsl(132, 20%, 96%)";
const SAGE = "hsl(118, 16%, 91%)";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMealDisplayCat(meal: any): "user" | "web" | "ready" {
  if (meal.isReadyMeal || meal.mealFormat === "ready-meal") return "ready";
  if (meal.isSystemMeal || meal.sourceUrl) return "web";
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
  const { meals } = useMeals();

  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });

  const { data: plannerFull = [] } = useQuery<any[]>({
    queryKey: ["/api/planner/full"],
    enabled: !!user,
  });

  const userMeals = meals?.filter(m => !m.isSystemMeal) || [];

  const mealMix = useMemo(() => {
    if (!meals?.length) return [];
    const counts = { user: 0, web: 0, ready: 0 };
    meals.forEach(m => { counts[getMealDisplayCat(m)]++; });
    return [
      { name: "Saved Recipes", value: counts.user, color: GREEN_MID },
      { name: "From the Web", value: counts.web, color: "hsl(132, 14%, 65%)" },
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
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 100, opacity: 0.45 }}>
          <OrchardHero />
        </div>
        <div className="relative z-10" style={{ padding: "var(--space-8) var(--space-6) 80px" }}>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="h-4 w-4" style={{ color: GREEN_DEEP }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREEN_DEEP, opacity: 0.7 }}>
                The Healthy Apples
              </span>
            </div>
            <h1 className="title-page" data-testid="text-welcome" style={{ color: GREEN_DEEP }}>
              {getGreeting()}, {displayName.split("@")[0]}
            </h1>
            <p className="text-sm mt-2" style={{ color: GREEN_MID }}>
              {mealsPlannedThisWeek > 0
                ? `${mealsPlannedThisWeek} meal${mealsPlannedThisWeek !== 1 ? "s" : ""} planned this week · ${userMeals.length} in your collection`
                : userMeals.length > 0
                  ? `${userMeals.length} meal${userMeals.length !== 1 ? "s" : ""} in your collection — ready to plan your week?`
                  : "Start building your healthy meal collection"}
            </p>
          </motion.div>
        </div>
        <div className="relative z-10">
          <svg viewBox="0 0 1440 32" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="w-full" preserveAspectRatio="none" style={{ height: 32, display: "block" }}>
            <path d="M0 0C240 32 480 32 720 16C960 0 1200 0 1440 16V32H0V0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* ── Stat strip ── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

              <Link href="/meals" aria-label="Go to My Meals">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-total-meals"
                  style={{ background: GREEN_PALE, borderColor: "hsl(132,18%,85%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: GREEN_MID }}>My Meals</span>
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

              <Link href="/analyse-basket" aria-label="Go to Basket">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-basket-items"
                  style={{ background: BERRY_LIGHT, borderColor: "hsl(340,20%,86%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: BERRY }}>Basket</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(340,20%,88%)" }}>
                        <ShoppingBasket className="h-4 w-4" style={{ color: BERRY }} />
                      </div>
                    </div>
                    <div className="text-numeric" style={{ color: BERRY }}>{shoppingListItems.length}</div>
                    <p className="text-xs mt-1" style={{ color: BERRY, opacity: 0.75 }}>
                      {shoppingListItems.length === 1 ? "item to buy" : "items to buy"}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/weekly-planner" aria-label="Go to Planner" className="col-span-2 lg:col-span-1">
                <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200" data-testid="card-week-progress"
                  style={{ background: SAGE, borderColor: "hsl(118,14%,84%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Week</span>
                      <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-numeric">{daysWithMeals}</div>
                      <div className="text-sm text-muted-foreground mb-0.5">/ 7 days covered</div>
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
            </div>
          </motion.div>

          {/* ── Weekly planner chart ── */}
          <motion.div variants={item}>
            <div className="flex items-baseline justify-between mb-4">
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
                  <div className="flex flex-col items-center py-8 gap-3">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/25" />
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      No meals planned yet — head to the planner to map out your week.
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
                <h2 className="title-section mb-4">Your Collection</h2>
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
                <h2 className="title-section mb-4">Quick Actions</h2>
                <div className="flex flex-col gap-3">
                  <Link href="/meals">
                    <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-add-meal">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN_PALE }}>
                          <Plus className="h-5 w-5" style={{ color: GREEN_DEEP }} />
                        </div>
                        <div>
                          <p className="title-card">Add a Meal</p>
                          <p className="text-xs text-muted-foreground">Browse or create a new recipe</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/weekly-planner">
                    <Card className="group cursor-pointer hover-elevate transition-all duration-200" data-testid="action-view-planner">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: SAGE }}>
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
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: BERRY_LIGHT }}>
                          <ShoppingBasket className="h-5 w-5" style={{ color: BERRY }} />
                        </div>
                        <div>
                          <p className="title-card">Analyse Basket</p>
                          <p className="text-xs text-muted-foreground">Check prices and product health</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ── Recent Meals ── */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-4">
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
                <CardContent className="py-12 text-center">
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
                          {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""}
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
    </div>
  );
}
