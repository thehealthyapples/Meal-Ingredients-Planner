/**
 * admin-development-world-page.tsx — DEVWORLD3 Admin → Development World
 * ======================================================================
 * READ-ONLY operator view of the 50 Development World households DEVWORLD2
 * imported (DEV environment only). Lists every household with its summary and
 * authored statistics, supports search / sort / filter, and links to a
 * read-only detail page per household.
 *
 * There is NO seed, reset, edit or impersonate control here — the brief scopes
 * DEVWORLD3 to read-only. It reuses the shared shadcn primitives and the same
 * table/badge patterns as the Benchmark Households page rather than forking them.
 */

import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, AlertTriangle, Globe2, ChevronRight, ArrowUpDown, Snowflake, CheckCircle2, ShieldCheck,
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
interface ListResponse {
  version: string;
  validation: { valid: boolean; violationCount: number; validatedHouseholds: number; validatedRecipeRefs: number };
  households: HouseholdState[];
}

const ALL = "__all__";
const TIER_LABEL: Record<string, string> = {
  free: "Free", premium: "Premium", friends_family: "Friends & Family",
};

function tierLabel(t: string): string { return TIER_LABEL[t] ?? t; }
function titleCase(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function fmtDate(val: string | null): string {
  if (!val) return "Never";
  return new Date(val).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

type SortKey = "id" | "householdName" | "householdType" | "subscriptionTier" | "companionPersonality" | "members" | "plannerEntries" | "evidenceEvents" | "lastResetAt";

export default function AdminDevelopmentWorldPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [tierFilter, setTierFilter] = useState(ALL);
  const [personalityFilter, setPersonalityFilter] = useState(ALL);
  const [coldStartOnly, setColdStartOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(true);

  const { data, isPending, error } = useQuery<ListResponse>({
    queryKey: ["/api/admin/development-world"],
    queryFn: async () => {
      const res = await fetch("/api/admin/development-world", { credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Failed to load development world");
      return res.json();
    },
  });

  const households = useMemo(() => data?.households ?? [], [data]);

  const householdTypes = useMemo(
    () => Array.from(new Set(households.map((h) => h.householdType))).sort(),
    [households],
  );
  const tiers = useMemo(
    () => Array.from(new Set(households.map((h) => h.subscriptionTier))).sort(),
    [households],
  );
  const personalities = useMemo(
    () => Array.from(new Set(households.map((h) => h.companionPersonality))).sort(),
    [households],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = households.filter((h) => {
      if (typeFilter !== ALL && h.householdType !== typeFilter) return false;
      if (tierFilter !== ALL && h.subscriptionTier !== tierFilter) return false;
      if (personalityFilter !== ALL && h.companionPersonality !== personalityFilter) return false;
      if (coldStartOnly && !h.coldStart) return false;
      if (q) {
        const hay = `${h.id} ${h.householdName} ${h.householdType} ${h.ownerUsername} ${h.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const val = (h: HouseholdState): string | number => {
      switch (sortKey) {
        case "members": return h.members;
        case "plannerEntries": return h.authored.plannerEntries;
        case "evidenceEvents": return h.authored.evidenceEvents;
        case "lastResetAt": return h.lastResetAt ? new Date(h.lastResetAt).getTime() : 0;
        default: return (h[sortKey] ?? "") as string;
      }
    };
    rows.sort((a, b) => {
      const av = val(a), bv = val(b);
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [households, search, typeFilter, tierFilter, personalityFilter, coldStartOnly, sortKey, sortAsc]);

  if ((user as any)?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };
  const SortableHead = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
        data-testid={`sort-${k}`}
      >
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? "text-foreground" : "text-muted-foreground/50"}`} />
      </button>
    </TableHead>
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6" data-testid="admin-development-world-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe2 className="h-6 w-6" /> Development World
          </h1>
          <p className="text-sm text-muted-foreground">
            The 50 Development World households (v{data?.version ?? "…"}) imported by DEVWORLD2 — read-only, DEV environment only.
          </p>
        </div>
        {data?.validation && (
          <div className="flex items-center gap-2 text-sm">
            {data.validation.valid ? (
              <Badge className="bg-green-600 hover:bg-green-600"><ShieldCheck className="h-3 w-3 mr-1" /> Validated</Badge>
            ) : (
              <Badge variant="destructive">{data.validation.violationCount} violations</Badge>
            )}
            <span className="text-muted-foreground">
              {data.validation.validatedHouseholds} households · {data.validation.validatedRecipeRefs} meal refs
            </span>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {/* ── Filters ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Households</CardTitle>
          <CardDescription>
            Read-only. Select a household to open its detail page. Statistics are the canonical authored figures; seeded status and last import/reset are live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search id, name, type, owner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
              data-testid="dw-search"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-52" data-testid="dw-filter-type"><SelectValue placeholder="Household type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All household types</SelectItem>
                {householdTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-44" data-testid="dw-filter-tier"><SelectValue placeholder="Subscription tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All tiers</SelectItem>
                {tiers.map((t) => <SelectItem key={t} value={t}>{tierLabel(t)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={personalityFilter} onValueChange={setPersonalityFilter}>
              <SelectTrigger className="w-44" data-testid="dw-filter-personality"><SelectValue placeholder="Companion" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All personalities</SelectItem>
                {personalities.map((p) => <SelectItem key={p} value={p}>{titleCase(p)}</SelectItem>)}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="dw-filter-coldstart">
              <Checkbox checked={coldStartOnly} onCheckedChange={(v) => setColdStartOnly(Boolean(v))} />
              Cold-start only
            </label>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {households.length} households
          </div>

          {isPending ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead k="id">ID</SortableHead>
                    <SortableHead k="householdName">Household</SortableHead>
                    <SortableHead k="householdType">Type</SortableHead>
                    <SortableHead k="members" className="text-right">Members</SortableHead>
                    <SortableHead k="subscriptionTier">Tier</SortableHead>
                    <SortableHead k="companionPersonality">Companion</SortableHead>
                    <SortableHead k="plannerEntries" className="text-right">Planner</SortableHead>
                    <TableHead className="text-right">Pantry</TableHead>
                    <TableHead className="text-right">Diary</TableHead>
                    <SortableHead k="evidenceEvents" className="text-right">Evidence</SortableHead>
                    <TableHead>Cold-start</TableHead>
                    <SortableHead k="lastResetAt">Last import/reset</SortableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((h) => (
                    <TableRow key={h.id} data-testid={`dw-household-row-${h.id}`}>
                      <TableCell className="font-mono font-medium">{h.id}</TableCell>
                      <TableCell>
                        <Link href={`/admin/development-world/${h.id}`} className="font-medium hover:underline">
                          {h.householdName}
                        </Link>
                        <div className="text-xs text-muted-foreground font-mono">{h.ownerUsername}</div>
                      </TableCell>
                      <TableCell className="text-sm">{h.householdType}</TableCell>
                      <TableCell className="text-right">{h.members}</TableCell>
                      <TableCell><Badge variant="outline">{tierLabel(h.subscriptionTier)}</Badge></TableCell>
                      <TableCell className="text-sm">{titleCase(h.companionPersonality)}</TableCell>
                      <TableCell className="text-right">{h.authored.plannerEntries}</TableCell>
                      <TableCell className="text-right">{h.authored.pantryItems}</TableCell>
                      <TableCell className="text-right">{h.authored.diaryEntries}</TableCell>
                      <TableCell className="text-right">{h.authored.evidenceEvents}</TableCell>
                      <TableCell>
                        {h.coldStart
                          ? <Badge variant="secondary"><Snowflake className="h-3 w-3 mr-1" /> Cold</Badge>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {h.seeded && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                          {fmtDate(h.lastResetAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild data-testid={`dw-open-${h.id}`}>
                          <Link href={`/admin/development-world/${h.id}`}><ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                        No households match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
