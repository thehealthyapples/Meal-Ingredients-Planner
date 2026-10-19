import { useMemo, useState } from "react";
import { Activity, CircleDashed, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadError } from "@/components/ui/load-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NotFound from "./not-found";

type JsonRecord = Record<string, unknown>;
type ActivityRecord = { id: string; kind: string; status: string; timestamp: string | null; raw: JsonRecord };
type ActivityProjection = { records: ActivityRecord[]; metadata: JsonRecord; safety: JsonRecord | null };

const isObject = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function textValue(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function parseProjection(value: unknown): ActivityProjection | null {
  if (!isObject(value) || !Array.isArray(value.records)) return null;
  const records: ActivityRecord[] = [];
  for (const candidate of value.records) {
    if (!isObject(candidate)) return null;
    const id = textValue(candidate, ["id", "recordId"]);
    const kind = textValue(candidate, ["kind"]);
    const status = textValue(candidate, ["status"]);
    if (!id || !kind || !status) return null;
    records.push({
      id,
      kind,
      status,
      timestamp: textValue(candidate, ["occurredAt", "updatedAt", "createdAt", "timestamp"]),
      raw: candidate,
    });
  }
  const metadata = isObject(value.projection)
    ? value.projection
    : Object.fromEntries(Object.entries(value).filter(([key]) => key !== "records" && key !== "safety"));
  const safety = isObject(value.safety) ? value.safety : isObject(metadata.safety) ? metadata.safety : null;
  return { records, metadata, safety };
}

function displayValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function FactList({ facts, empty }: { facts: JsonRecord | null; empty: string }) {
  const entries = facts ? Object.entries(facts) : [];
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <dl className="grid gap-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(7rem,0.7fr)_minmax(0,1.3fr)] gap-3">
          <dt className="break-words text-muted-foreground">{key}</dt>
          <dd className="break-all font-mono text-xs">{displayValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ActivityMonitorLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6" data-testid="activity-monitor-loading">
      <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-full max-w-xl" /></div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
        <Skeleton className="h-80 w-full rounded-lg" /><Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ActivityMonitorError({ onRetry }: { onRetry?: () => void }) {
  return <LoadError what="governed activity" onRetry={onRetry} description="The Activity Monitor could not reach its governed data source. No activity result is being inferred." data-testid="activity-monitor-error" />;
}

function MalformedProjection({ onRetry }: { onRetry: () => void }) {
  return (
    <Card data-testid="activity-monitor-malformed">
      <CardHeader><CardTitle className="text-base font-medium">Activity data could not be displayed</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">The activity source returned a shape this page does not recognise. No records or states have been inferred from it.</p>
        <Button variant="outline" onClick={onRetry}>Try again</Button>
      </CardContent>
    </Card>
  );
}

export default function AdminActivityMonitorPage() {
  const { user, isLoading } = useUser();
  const activity = useQuery<unknown>({ queryKey: ["/api/admin/activity"] });
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [idFilter, setIdFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const projection = useMemo(() => parseProjection(activity.data), [activity.data]);
  const kinds = useMemo(() => [...new Set(projection?.records.map((record) => record.kind) ?? [])].sort(), [projection]);
  const statuses = useMemo(() => [...new Set(projection?.records.map((record) => record.status) ?? [])].sort(), [projection]);
  const filteredRecords = useMemo(() => {
    const id = idFilter.trim().toLocaleLowerCase();
    return (projection?.records ?? []).filter((record) =>
      (kindFilter === "all" || record.kind === kindFilter) &&
      (statusFilter === "all" || record.status === statusFilter) &&
      (!id || record.id.toLocaleLowerCase().includes(id)),
    );
  }, [projection, kindFilter, statusFilter, idFilter]);
  const selected = projection?.records.find((record) => record.id === selectedId) ?? null;

  if (isLoading || activity.isLoading) return <ActivityMonitorLoading />;
  if (!user || (user as any)?.role !== "admin") return <NotFound />;
  if (activity.isError) return <ActivityMonitorError onRetry={() => activity.refetch()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6" data-testid="admin-activity-monitor-page">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2"><Activity className="h-6 w-6 text-primary" aria-hidden="true" /></div>
          <div><h1 className="text-2xl font-semibold tracking-tight">Activity Monitor</h1><p className="mt-1 text-sm text-muted-foreground">A read-only view of activity reported by the THA bridge.</p></div>
          <Button variant="outline" className="ml-auto" onClick={() => activity.refetch()} disabled={activity.isFetching} data-testid="activity-monitor-refresh">
            <RefreshCw className={`mr-2 h-4 w-4 ${activity.isFetching ? "animate-spin" : ""}`} />{activity.isFetching ? "Refreshing" : "Refresh"}
          </Button>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">This monitor reports the projection as supplied. It does not infer workflow, change statuses, trigger work, or become an authority for these records.</p>
      </header>

      {!projection ? <MalformedProjection onRetry={() => activity.refetch()} /> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="activity-monitor-projection-metadata"><CardHeader><CardTitle className="text-base font-medium">Projection</CardTitle></CardHeader><CardContent><FactList facts={projection.metadata} empty="No projection metadata was reported." /></CardContent></Card>
            <Card data-testid="activity-monitor-safety-state"><CardHeader><CardTitle className="text-base font-medium">Safety state</CardTitle></CardHeader><CardContent><FactList facts={projection.safety} empty="No safety state was reported." /></CardContent></Card>
          </div>
          <Card data-testid="activity-monitor-filters"><CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
            <Select value={kindFilter} onValueChange={setKindFilter}><SelectTrigger aria-label="Filter by record kind"><SelectValue placeholder="All kinds" /></SelectTrigger><SelectContent><SelectItem value="all">All kinds</SelectItem>{kinds.map((kind) => <SelectItem key={kind} value={kind}>{kind}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
            <Input value={idFilter} onChange={(event) => setIdFilter(event.target.value)} placeholder="Filter by ID" aria-label="Filter by record ID" />
          </CardContent></Card>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
            <Card data-testid="activity-monitor-recent-work"><CardHeader><CardTitle className="text-base font-medium">Bridge records</CardTitle></CardHeader><CardContent className="p-0"><Table>
              <TableHeader><TableRow><TableHead>Kind</TableHead><TableHead>ID</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredRecords.map((record) => <TableRow key={`${record.kind}:${record.id}`} className="cursor-pointer" onClick={() => setSelectedId(record.id)} data-state={selectedId === record.id ? "selected" : undefined} data-testid={`activity-record-${record.id}`}><TableCell><Badge variant="outline">{record.kind}</Badge></TableCell><TableCell className="break-all font-mono text-xs">{record.id}</TableCell><TableCell>{record.status}</TableCell><TableCell className="text-muted-foreground">{record.timestamp ?? "Not reported"}</TableCell></TableRow>)}
                {filteredRecords.length === 0 ? <TableRow><TableCell colSpan={4} className="h-36 text-center text-sm text-muted-foreground">{projection.records.length === 0 ? "No activity records were reported." : "No activity records match these filters."}</TableCell></TableRow> : null}
              </TableBody>
            </Table></CardContent></Card>
            <Card data-testid="activity-monitor-detail"><CardHeader><CardTitle className="text-base font-medium">Record detail</CardTitle></CardHeader><CardContent>
              {selected ? <FactList facts={selected.raw} empty="This record contains no details." /> : <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><CircleDashed className="h-7 w-7 text-muted-foreground" aria-hidden="true" /><div className="space-y-1"><p className="text-sm font-medium">No record selected</p><p className="text-xs leading-relaxed text-muted-foreground">Select a bridge record to inspect the facts it reports.</p></div></div>}
            </CardContent></Card>
          </div>
        </>
      )}
    </div>
  );
}
