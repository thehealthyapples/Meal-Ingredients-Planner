/**
 * admin-benchmark-households-page.tsx — INTQ6 Admin → Benchmark Households
 * =========================================================================
 * The operator page for the permanent Benchmark Household World (DEV-only):
 * view all ten "Name (Auto)" households, inspect a household's canonical
 * fixture vs its live seeded state, impersonate one, reset one (or all) to
 * canonical state, and run the Intelligence Benchmark against one / multiple /
 * all households. Runs execute server-side through the ONE Companion seam
 * (INTQ4 engine) and land in the same run history the Intelligence Benchmark
 * page displays — this page never scores anything itself.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, RotateCcw, Eye, UserCheck, PlayCircle, Sprout, AlertTriangle, Home, BarChart3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API shapes (mirror server/benchmark/)
// ---------------------------------------------------------------------------

interface HouseholdState {
  id: string; slug: string; archetype: string; householdName: string; summary: string;
  seeded: boolean; ownerUserId: number | null; ownerUsername: string;
  householdId: number | null; lastResetAt: string | null; accounts: number;
  knownGaps: string[]; coldStart: boolean;
}
interface ListResponse { version: string; households: HouseholdState[]; }

interface HouseholdDetail {
  state: HouseholdState;
  fixture: {
    id: string; archetype: string; householdName: string; summary: string;
    accounts: { username: string; displayName: string }[];
    eaters: { displayName: string; ageYears?: number; hardRestrictions?: string[]; defaultDietTypes?: string[] }[];
    persona: {
      lifestyle: string; shoppingHabits: string; cookingConfidence: string;
      weeknightCookingTime: string; budget: string; kitchenEquipment: string[];
      favouriteMeals: string[]; dislikedFoods: string[];
    };
    preferences: Record<string, unknown>;
    pantry: unknown[]; meals: { name: string }[]; planner: unknown[]; shopping: unknown[];
    diaryEntries: unknown[]; diaryMetrics: unknown[]; evidence: unknown[];
    knownGaps: string[];
  };
  live: {
    members: number; eaters: number; meals: number; pantryItems: number;
    plannerEntries: number; shoppingItems: number; diaryEntries: number;
    diaryMetricDays: number; evidenceEvents: number; learningSignals: number;
  } | null;
}

interface RunSummary {
  benchmarkHouseholdId: string; runId: string; headline: number; honestGapRate: number;
  gatesFired: number; verdict: string; questionsScored: number;
}

function fmtDate(val: string | null): string {
  if (!val) return "Never";
  return new Date(val).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminBenchmarkHouseholdsPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [inspectId, setInspectId] = useState<string | null>(null);
  const [impersonateTarget, setImpersonateTarget] = useState<HouseholdState | null>(null);
  const [resetTarget, setResetTarget] = useState<HouseholdState | null>(null);
  const [confirmSeedAll, setConfirmSeedAll] = useState(false);

  // Run controls
  const [runMode, setRunMode] = useState<"quick" | "full">("quick");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastRuns, setLastRuns] = useState<RunSummary[] | null>(null);

  const { data, isPending, error } = useQuery<ListResponse>({
    queryKey: ["/api/admin/benchmark-households"],
    queryFn: async () => {
      const res = await fetch("/api/admin/benchmark-households", { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Failed to load benchmark households");
      return res.json();
    },
  });

  const { data: detail, isPending: detailLoading } = useQuery<HouseholdDetail>({
    queryKey: ["/api/admin/benchmark-households", inspectId],
    enabled: inspectId !== null,
    queryFn: async () => {
      const res = await fetch(`/api/admin/benchmark-households/${inspectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load household detail");
      return res.json();
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/benchmark-households"] });

  const seedAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/benchmark-households/seed"),
    onSuccess: () => {
      invalidate();
      toast({ title: "Benchmark World seeded", description: "All 10 households reset to canonical state." });
    },
    onError: (e: Error) => toast({ title: "Seed failed", description: e.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/benchmark-households/${id}/reset`),
    onSuccess: (_res, id) => {
      invalidate();
      toast({ title: `${id} reset`, description: "Household restored to canonical state." });
    },
    onError: (e: Error) => toast({ title: "Reset failed", description: e.message, variant: "destructive" }),
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/benchmark-households/${id}/impersonate`),
    onSuccess: () => {
      // The session is now the benchmark user — full reload into their world.
      window.location.href = "/";
    },
    onError: (e: Error) => toast({ title: "Impersonation failed", description: e.message, variant: "destructive" }),
  });

  const runMutation = useMutation({
    mutationFn: async (payload: { mode: string; households: "all" | string[] }) => {
      const res = await apiRequest("POST", "/api/admin/benchmark-households/run-benchmark", payload);
      return res.json() as Promise<{ runs: RunSummary[] }>;
    },
    onSuccess: (result) => {
      setLastRuns(result.runs);
      invalidate();
      toast({ title: "Benchmark complete", description: `${result.runs.length} household run(s) recorded.` });
    },
    onError: (e: Error) => toast({ title: "Benchmark run failed", description: e.message, variant: "destructive" }),
  });

  if ((user as any)?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const households = data?.households ?? [];
  const anySeeded = households.some((h) => h.seeded);
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const runHouseholds: "all" | string[] = selected.size === 0 || selected.size === households.length
    ? "all" : Array.from(selected);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6" data-testid="admin-benchmark-households-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="h-6 w-6" /> Benchmark Households
          </h1>
          <p className="text-sm text-muted-foreground">
            The permanent deterministic world (v{data?.version ?? "…"}) the Companion Intelligence Benchmark runs
            against — 10 real “(Auto)” households, DEV environment only.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/intelligence"><BarChart3 className="h-4 w-4 mr-1" /> Benchmark dashboard</Link>
          </Button>
          <Button onClick={() => setConfirmSeedAll(true)} disabled={seedAllMutation.isPending} data-testid="seed-world-button">
            {seedAllMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sprout className="h-4 w-4 mr-1" />}
            {anySeeded ? "Reset entire world" : "Seed world"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {/* ── Household table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Households</CardTitle>
          <CardDescription>
            Every household has a permanent Benchmark Household ID and is reset to its canonical
            fixture state on demand. Tick households to target a benchmark run (none ticked = all).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Archetype</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last reset</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {households.map((h) => (
                    <TableRow key={h.id} data-testid={`benchmark-household-row-${h.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(h.id)}
                          onCheckedChange={() => toggle(h.id)}
                          aria-label={`Select ${h.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">{h.id}</TableCell>
                      <TableCell>{h.archetype}</TableCell>
                      <TableCell>
                        <div className="font-medium">{h.householdName}</div>
                        <div className="text-xs text-muted-foreground">{h.ownerUsername}</div>
                      </TableCell>
                      <TableCell>
                        {h.seeded
                          ? <Badge className="bg-green-600 hover:bg-green-600">Seeded</Badge>
                          : <Badge variant="secondary">Not seeded</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(h.lastResetAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setInspectId(h.id)} title="Inspect" data-testid={`inspect-${h.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setImpersonateTarget(h)} disabled={!h.seeded} title="Impersonate" data-testid={`impersonate-${h.id}`}>
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setResetTarget(h)} disabled={resetMutation.isPending} title="Reset to canonical state" data-testid={`reset-${h.id}`}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Run benchmark ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> Run Intelligence Benchmark</CardTitle>
          <CardDescription>
            Executes through the one Companion seam as each selected household’s owner. Households are
            reset to canonical state before the run; one run artefact per household is recorded in the
            benchmark history (world mode “benchmark-world”).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={runMode} onValueChange={(v) => setRunMode(v as "quick" | "full")}>
              <SelectTrigger className="w-44" data-testid="run-mode-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick (10 questions)</SelectItem>
                <SelectItem value="full">Full (100 questions)</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              Target: {runHouseholds === "all" ? `all ${households.length} households` : `${(runHouseholds as string[]).length} selected (${(runHouseholds as string[]).join(", ")})`}
            </div>
            <Button
              onClick={() => runMutation.mutate({ mode: runMode, households: runHouseholds })}
              disabled={runMutation.isPending || households.length === 0}
              data-testid="run-benchmark-button"
            >
              {runMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1" />}
              {runMutation.isPending ? "Running…" : "Run benchmark"}
            </Button>
          </div>

          {lastRuns && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Honest-gap rate</TableHead>
                    <TableHead>Gates</TableHead>
                    <TableHead>Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastRuns.map((r) => (
                    <TableRow key={r.runId}>
                      <TableCell className="font-mono">{r.benchmarkHouseholdId}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.runId} ({r.questionsScored} q)</TableCell>
                      <TableCell className="font-medium">{r.headline.toFixed(1)}</TableCell>
                      <TableCell>{Math.round(r.honestGapRate * 100)}%</TableCell>
                      <TableCell>{r.gatesFired === 0 ? <Badge className="bg-green-600 hover:bg-green-600">0</Badge> : <Badge variant="destructive">{r.gatesFired}</Badge>}</TableCell>
                      <TableCell>
                        <Badge variant={r.verdict === "PASS" ? "default" : r.verdict === "PARTIAL" ? "secondary" : "destructive"}>{r.verdict}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">
                Full breakdowns, trends and downloadable reports live on the{" "}
                <Link href="/admin/intelligence" className="underline">Intelligence Benchmark dashboard</Link>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Inspect dialog ── */}
      <Dialog open={inspectId !== null} onOpenChange={(open) => !open && setInspectId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">{inspectId} — {detail?.fixture.archetype ?? ""}</DialogTitle>
            <DialogDescription>{detail?.fixture.summary}</DialogDescription>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold mb-1">Accounts</h3>
                {detail.fixture.accounts.map((a) => (
                  <div key={a.username} className="flex justify-between gap-2">
                    <span>{a.displayName}</span>
                    <span className="text-muted-foreground font-mono text-xs">{a.username}</span>
                  </div>
                ))}
              </section>
              <section>
                <h3 className="font-semibold mb-1">Eaters</h3>
                <div className="flex flex-wrap gap-1">
                  {detail.fixture.eaters.map((e, i) => (
                    <Badge key={i} variant="outline">
                      {e.displayName}
                      {e.ageYears ? ` (${e.ageYears})` : ""}
                      {e.hardRestrictions?.length ? ` — no ${e.hardRestrictions.join(", ")}` : ""}
                    </Badge>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="font-semibold mb-1">Persona</h3>
                <p><span className="text-muted-foreground">Lifestyle:</span> {detail.fixture.persona.lifestyle}</p>
                <p><span className="text-muted-foreground">Shopping:</span> {detail.fixture.persona.shoppingHabits}</p>
                <p>
                  <span className="text-muted-foreground">Cooking:</span> {detail.fixture.persona.cookingConfidence} confidence,{" "}
                  {detail.fixture.persona.weeknightCookingTime}; budget {detail.fixture.persona.budget}
                </p>
                {detail.fixture.persona.kitchenEquipment.length > 0 && (
                  <p><span className="text-muted-foreground">Equipment (narrative only, not stored):</span> {detail.fixture.persona.kitchenEquipment.join(", ")}</p>
                )}
                {detail.fixture.persona.favouriteMeals.length > 0 && (
                  <p><span className="text-muted-foreground">Favourites:</span> {detail.fixture.persona.favouriteMeals.join(", ")}</p>
                )}
                {detail.fixture.persona.dislikedFoods.length > 0 && (
                  <p><span className="text-muted-foreground">Dislikes:</span> {detail.fixture.persona.dislikedFoods.join(", ")}</p>
                )}
              </section>
              <section>
                <h3 className="font-semibold mb-1">Canonical fixture vs live database</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store</TableHead>
                        <TableHead>Fixture</TableHead>
                        <TableHead>Live</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {([
                        ["Cookbook meals", detail.fixture.meals.length, detail.live?.meals],
                        ["Pantry items", detail.fixture.pantry.length, detail.live?.pantryItems],
                        ["Planner entries", detail.fixture.planner.length, detail.live?.plannerEntries],
                        ["Shopping items", detail.fixture.shopping.length, detail.live?.shoppingItems],
                        ["Diary entries", detail.fixture.diaryEntries.length, detail.live?.diaryEntries],
                        ["Diary metric days", detail.fixture.diaryMetrics.length, detail.live?.diaryMetricDays],
                        ["Evidence events", detail.fixture.evidence.length, detail.live?.evidenceEvents],
                        ["Learning signals", "derived", detail.live?.learningSignals],
                        ["Eaters", detail.fixture.eaters.length, detail.live?.eaters],
                      ] as Array<[string, number | string, number | undefined]>).map(([label, fixture, live]) => (
                        <TableRow key={label}>
                          <TableCell>{label}</TableCell>
                          <TableCell>{fixture}</TableCell>
                          <TableCell>{live ?? <span className="text-muted-foreground">not seeded</span>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
              <section>
                <h3 className="font-semibold mb-1">Known gaps (deliberate honest-gap traps)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {detail.fixture.knownGaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Impersonate confirm ── */}
      <AlertDialog open={impersonateTarget !== null} onOpenChange={(open) => !open && setImpersonateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Impersonate {impersonateTarget?.householdName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your session becomes {impersonateTarget?.ownerUsername} and the app reloads into their world.
              A “return to admin” banner will bring you back. Anything you do while impersonating changes
              this benchmark household’s data — reset it afterwards if you make changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => impersonateTarget && impersonateMutation.mutate(impersonateTarget.id)}>
              Impersonate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reset one confirm ── */}
      <AlertDialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {resetTarget?.id} to canonical state?</AlertDialogTitle>
            <AlertDialogDescription>
              All data for {resetTarget?.householdName} is wiped and re-seeded from the frozen fixture.
              This affects only this benchmark household’s accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetTarget && resetMutation.mutate(resetTarget.id)}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Seed / reset all confirm ── */}
      <AlertDialog open={confirmSeedAll} onOpenChange={setConfirmSeedAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{anySeeded ? "Reset the entire Benchmark World?" : "Seed the Benchmark World?"}</AlertDialogTitle>
            <AlertDialogDescription>
              All 10 benchmark households are {anySeeded ? "wiped and re-seeded" : "created"} from the frozen
              fixtures ({data?.version}). Only “(Auto)” benchmark accounts are touched. DEV environment only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => seedAllMutation.mutate()}>
              {anySeeded ? "Reset world" : "Seed world"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
