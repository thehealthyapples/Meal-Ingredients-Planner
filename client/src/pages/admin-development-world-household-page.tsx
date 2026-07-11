/**
 * admin-development-world-household-page.tsx — DEVWORLD3 Development World detail
 * ==============================================================================
 * READ-ONLY detail page for one Development World household (DEV only). Shows the
 * household summary, members, eaters, planner overview, pantry summary, cookbook
 * references, diary summary, evidence summary and validation status.
 *
 * There is NO edit control and NO impersonate control — the brief scopes
 * DEVWORLD3 to read-only. Every value is displayed, never mutated.
 */

import { Link, useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, AlertTriangle, ArrowLeft, Snowflake, ShieldCheck, ShieldAlert, Lock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API shapes (mirror server/development-world/)
// ---------------------------------------------------------------------------

interface AuthoredStats {
  eaters: number; pantryItems: number; plannerEntries: number; freezerMeals: number;
  shoppingExtras: number; diaryEntries: number; diaryMetricDays: number;
  evidenceEvents: number; cookbookRefs: number;
}
interface HouseholdState {
  id: string; slug: string; householdName: string; householdType: string; summary: string;
  members: number; subscriptionTier: string; companionPersonality: string; coldStart: boolean;
  seeded: boolean; ownerUserId: number | null; ownerUsername: string; householdId: number | null;
  lastResetAt: string | null; authored: AuthoredStats;
}
interface MealRef { name: string; category?: string }
interface HouseholdDetail {
  state: HouseholdState;
  fixture: {
    id: string; slug: string; householdType: string; householdName: string; summary: string; coldStart: boolean;
    accounts: { key: string; username: string; displayName: string; subscriptionTier: string | null; dietPattern: string | null }[];
    eaters: { displayName: string; ageYears?: number; accountKey?: string; defaultDietTypes: string[]; hardRestrictions: string[] }[];
    preferences: Record<string, unknown>;
    pantry: { ingredient: string; category: string; displayName?: string }[];
    cookbook: { adopted: MealRef[]; regular: MealRef[]; discoveryQueue: MealRef[]; notes: string | null };
    authored: AuthoredStats;
    knownGaps: string[];
  };
  live: {
    members: number; eaters: number; meals: number; pantryItems: number; plannerEntries: number;
    shoppingItems: number; diaryEntries: number; diaryMetricDays: number; evidenceEvents: number; learningSignals: number;
  } | null;
  validation: { worldValid: boolean; worldViolationCount: number; householdSeeded: boolean; knownGaps: string[] };
}

const TIER_LABEL: Record<string, string> = { free: "Free", premium: "Premium", friends_family: "Friends & Family" };
function tierLabel(t: string | null): string { return t ? (TIER_LABEL[t] ?? t) : "—"; }
function titleCase(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function fmtDate(val: string | null): string {
  if (!val) return "Never";
  return new Date(val).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function CookbookSection({ title, refs }: { title: string; refs: MealRef[] }) {
  if (refs.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-medium mb-1">{title} <span className="text-muted-foreground font-normal">({refs.length})</span></h4>
      <div className="flex flex-wrap gap-1">
        {refs.map((r, i) => <Badge key={i} variant="outline" className="font-normal">{r.name}</Badge>)}
      </div>
    </div>
  );
}

export default function AdminDevelopmentWorldHouseholdPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const params = useParams();
  const id = params.id as string;

  const { data: detail, isPending, error } = useQuery<HouseholdDetail>({
    queryKey: ["/api/admin/development-world", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetch(`/api/admin/development-world/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Failed to load household detail");
      return res.json();
    },
  });

  if ((user as any)?.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6" data-testid="admin-development-world-household-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/development-world"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Development World</Link>
        </Button>
        <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> Read-only</Badge>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {isPending || !detail ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* ── Summary ── */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-mono">{detail.fixture.id}</CardTitle>
                <span className="text-lg font-semibold">{detail.fixture.householdName}</span>
                {detail.fixture.coldStart && <Badge variant="secondary"><Snowflake className="h-3 w-3 mr-1" /> Cold-start</Badge>}
                {detail.state.seeded
                  ? <Badge className="bg-green-600 hover:bg-green-600">Seeded</Badge>
                  : <Badge variant="secondary">Not seeded</Badge>}
              </div>
              <CardDescription>{detail.fixture.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {detail.fixture.householdType}</div>
                <div><span className="text-muted-foreground">Tier:</span> {tierLabel(detail.state.subscriptionTier)}</div>
                <div><span className="text-muted-foreground">Companion:</span> {titleCase(detail.state.companionPersonality)}</div>
                <div><span className="text-muted-foreground">Owner:</span> <span className="font-mono">{detail.state.ownerUsername}</span></div>
                <div><span className="text-muted-foreground">Members:</span> {detail.state.members}</div>
                <div><span className="text-muted-foreground">Household ID:</span> {detail.state.householdId ?? "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Last import/reset:</span> {fmtDate(detail.state.lastResetAt)}</div>
              </div>
            </CardContent>
          </Card>

          {/* ── Overview stats (authored vs live) ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Overview</CardTitle>
              <CardDescription>Canonical authored figures.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <Stat label="Eaters" value={detail.fixture.authored.eaters} />
                <Stat label="Planner entries" value={detail.fixture.authored.plannerEntries} />
                <Stat label="Pantry items" value={detail.fixture.authored.pantryItems} />
                <Stat label="Cookbook refs" value={detail.fixture.authored.cookbookRefs} />
                <Stat label="Diary entries" value={detail.fixture.authored.diaryEntries} />
                <Stat label="Diary metric days" value={detail.fixture.authored.diaryMetricDays} />
                <Stat label="Freezer meals" value={detail.fixture.authored.freezerMeals} />
                <Stat label="Evidence events" value={detail.fixture.authored.evidenceEvents} />
              </div>
            </CardContent>
          </Card>

          {/* ── Members ── */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Members</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead><TableHead>Name</TableHead><TableHead>Username</TableHead>
                    <TableHead>Diet pattern</TableHead><TableHead>Tier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.fixture.accounts.map((a) => (
                    <TableRow key={a.username}>
                      <TableCell><Badge variant="outline">{titleCase(a.key)}</Badge></TableCell>
                      <TableCell>{a.displayName}</TableCell>
                      <TableCell className="font-mono text-xs">{a.username}</TableCell>
                      <TableCell className="text-sm">{a.dietPattern ?? "—"}</TableCell>
                      <TableCell className="text-sm">{tierLabel(a.subscriptionTier)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ── Eaters ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Eaters</CardTitle>
              <CardDescription>Household eaters with their diets and hard restrictions.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.fixture.eaters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No eaters (cold-start household).</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead><TableHead>Age</TableHead>
                      <TableHead>Diets</TableHead><TableHead>Hard restrictions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.fixture.eaters.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{e.displayName}{e.accountKey ? <span className="text-muted-foreground text-xs"> · {e.accountKey}</span> : null}</TableCell>
                        <TableCell className="text-sm">{e.ageYears ?? "—"}</TableCell>
                        <TableCell className="text-sm">{e.defaultDietTypes.length ? e.defaultDietTypes.join(", ") : "—"}</TableCell>
                        <TableCell className="text-sm">{e.hardRestrictions.length ? e.hardRestrictions.join(", ") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── Planner + Pantry + Diary + Evidence overview ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Planner, Pantry, Diary & Evidence</CardTitle>
              <CardDescription>Authored canonical figures vs the live DEV database snapshot.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Store</TableHead><TableHead className="text-right">Authored</TableHead><TableHead className="text-right">Live</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {([
                      ["Planner entries", detail.fixture.authored.plannerEntries, detail.live?.plannerEntries],
                      ["Pantry items", detail.fixture.authored.pantryItems, detail.live?.pantryItems],
                      ["Diary entries", detail.fixture.authored.diaryEntries, detail.live?.diaryEntries],
                      ["Diary metric days", detail.fixture.authored.diaryMetricDays, detail.live?.diaryMetricDays],
                      ["Evidence events", detail.fixture.authored.evidenceEvents, detail.live?.evidenceEvents],
                      ["Learning signals", "derived", detail.live?.learningSignals],
                      ["Members", detail.state.members, detail.live?.members],
                      ["Eaters", detail.fixture.authored.eaters, detail.live?.eaters],
                      ["Shopping list items", "derived", detail.live?.shoppingItems],
                    ] as Array<[string, number | string, number | undefined]>).map(([label, authored, live]) => (
                      <TableRow key={label}>
                        <TableCell>{label}</TableCell>
                        <TableCell className="text-right">{authored}</TableCell>
                        <TableCell className="text-right">{live ?? <span className="text-muted-foreground">not seeded</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ── Pantry summary ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pantry summary <span className="text-muted-foreground font-normal">({detail.fixture.pantry.length})</span></CardTitle>
            </CardHeader>
            <CardContent>
              {detail.fixture.pantry.length === 0 ? (
                <p className="text-sm text-muted-foreground">Empty pantry.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {detail.fixture.pantry.map((p, i) => (
                    <Badge key={i} variant="outline" className="font-normal">
                      {p.displayName ?? p.ingredient}
                      <span className="text-muted-foreground ml-1 text-xs">· {p.category}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Cookbook references ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cookbook references</CardTitle>
              <CardDescription>
                Meals this household references (validated against the system cookbook; segmentation is not persisted — DEVWORLD2 gap G-COOKBOOK).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.fixture.cookbook.adopted.length + detail.fixture.cookbook.regular.length + detail.fixture.cookbook.discoveryQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cookbook references.</p>
              ) : (
                <>
                  <CookbookSection title="Adopted" refs={detail.fixture.cookbook.adopted} />
                  <CookbookSection title="Regular" refs={detail.fixture.cookbook.regular} />
                  <CookbookSection title="Discovery queue" refs={detail.fixture.cookbook.discoveryQueue} />
                  {detail.fixture.cookbook.notes && (
                    <p className="text-xs text-muted-foreground italic">{detail.fixture.cookbook.notes}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Validation status ── */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Validation status</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                {detail.validation.worldValid
                  ? <><ShieldCheck className="h-4 w-4 text-green-600" /> Dataset validated — {detail.validation.worldViolationCount} violations</>
                  : <><ShieldAlert className="h-4 w-4 text-destructive" /> Dataset has {detail.validation.worldViolationCount} violations</>}
              </div>
              <div className="flex items-center gap-2">
                {detail.validation.householdSeeded
                  ? <><ShieldCheck className="h-4 w-4 text-green-600" /> Household seeded in this DEV database</>
                  : <><ShieldAlert className="h-4 w-4 text-amber-600" /> Household not currently seeded</>}
              </div>
              {detail.validation.knownGaps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Known gaps (honest, by design)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {detail.validation.knownGaps.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
