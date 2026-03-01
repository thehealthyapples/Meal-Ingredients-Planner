import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Download, UserPlus, Leaf, Snowflake, Sun, Cloud } from "lucide-react";
import { useEffect } from "react";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_LABELS: Record<string, string> = { breakfast: "B", lunch: "L", dinner: "D" };
const SEASON_ICONS: Record<string, typeof Leaf> = { Spring: Leaf, Summer: Sun, Autumn: Cloud, Winter: Snowflake };

interface SharedItem {
  weekNumber: number;
  dayOfWeek: number;
  mealSlot: string;
  mealId: number;
}

interface SharedPlan {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  items: SharedItem[];
}

function ReadOnlyGrid({ items }: { items: SharedItem[] }) {
  const byWeekDay = new Map<string, Set<string>>();
  for (const item of items) {
    const key = `${item.weekNumber}:${item.dayOfWeek}`;
    if (!byWeekDay.has(key)) byWeekDay.set(key, new Set());
    byWeekDay.get(key)!.add(item.mealSlot);
  }

  return (
    <div className="overflow-x-auto" data-testid="grid-shared-plan">
      <table className="w-full border-collapse text-xs min-w-[520px]">
        <thead>
          <tr>
            <th className="text-left p-2 font-medium text-muted-foreground w-16">Week</th>
            {DAY_LABELS.map(d => (
              <th key={d} className="text-center p-2 font-medium text-muted-foreground">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6].map(week => (
            <tr key={week} className="border-t border-border">
              <td className="p-2 text-muted-foreground font-medium">W{week}</td>
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const slots = byWeekDay.get(`${week}:${day}`);
                const hasMeals = slots && slots.size > 0;
                return (
                  <td key={day} className="p-1.5 text-center">
                    {hasMeals ? (
                      <div className="flex flex-col items-center gap-0.5" data-testid={`cell-plan-w${week}-d${day}`}>
                        {["breakfast", "lunch", "dinner"].map(slot =>
                          slots.has(slot) ? (
                            <span
                              key={slot}
                              className="inline-block w-5 h-5 rounded-sm bg-primary/15 text-primary font-bold leading-5"
                            >
                              {SLOT_LABELS[slot]}
                            </span>
                          ) : null
                        )}
                      </div>
                    ) : (
                      <span className="inline-block w-5 h-5 rounded-sm bg-muted/40" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-primary/15 text-center text-primary font-bold leading-4">B</span> Breakfast</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-primary/15 text-center text-primary font-bold leading-4">L</span> Lunch</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-primary/15 text-center text-primary font-bold leading-4">D</span> Dinner</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-muted/40" /> Empty</span>
      </div>
    </div>
  );
}

export default function SharedPlanPage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useUser();
  const { toast } = useToast();

  const { data: plan, isLoading, isError } = useQuery<SharedPlan>({
    queryKey: ["/api/shared", token],
    queryFn: async () => {
      const res = await fetch(`/api/shared/${token}`);
      if (!res.ok) throw new Error("not found");
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (plan) {
      document.title = `${plan.name} | The Healthy Apples`;
    } else {
      document.title = "Shared Plan | The Healthy Apples";
    }
  }, [plan]);

  const importMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/plan-templates/${plan!.id}/import`, {
      scope: "all",
      mode: "keep",
    }),
    onSuccess: () => {
      toast({ title: "Plan imported!", description: "Head to your planner to see it." });
      window.location.href = "/weekly-planner";
    },
    onError: () => toast({ title: "Import failed", description: "Something went wrong.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4" data-testid="text-plan-not-found">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold">This plan is no longer shared</h1>
        <p className="text-muted-foreground text-center max-w-xs">
          The link may have expired or the owner has made it private.
        </p>
        <Link href="/">
          <Button variant="outline" data-testid="button-go-home">Go to The Healthy Apples</Button>
        </Link>
      </div>
    );
  }

  const SeasonIcon = plan.season ? (SEASON_ICONS[plan.season] ?? Leaf) : null;
  const mealCount = plan.items.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <img src="/favicon.ico" alt="" className="h-4 w-4" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            The Healthy Apples
          </div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-shared-plan-name">{plan.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {plan.season && SeasonIcon && (
              <Badge variant="secondary" className="gap-1">
                <SeasonIcon className="h-3 w-3" />
                {plan.season}
              </Badge>
            )}
            <Badge variant="outline">{mealCount} meal{mealCount !== 1 ? "s" : ""} planned</Badge>
          </div>
          {plan.description && (
            <p className="text-muted-foreground text-sm" data-testid="text-shared-plan-description">{plan.description}</p>
          )}
        </div>

        <Card className="p-4">
          <ReadOnlyGrid items={plan.items} />
        </Card>

        <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
          {user ? (
            <>
              <p className="text-sm font-medium">Want to use this plan?</p>
              <p className="text-xs text-muted-foreground">
                Import it into your planner with one click. It will only fill empty slots and won't overwrite your existing meals.
              </p>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-import-shared-plan"
              >
                {importMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Import into My Planner</>
                )}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Like this plan?</p>
              <p className="text-xs text-muted-foreground">
                Create a free account to import this 6-week meal plan into your own planner.
              </p>
              <Link href="/auth" data-testid="link-create-account">
                <Button className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create a Free Account to Import
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
