import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, WifiOff } from "lucide-react";

interface RecipeSource {
  id: number;
  sourceKey: string;
  enabled: boolean;
  sourceType: "official_api" | "scraped";
  updatedAt: string;
  credentialStatus: "configured" | "missing" | "n/a";
}

interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  sourceName: string;
  urlOrQuery: string | null;
  reason: string;
  createdAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  themealdb: "TheMealDB",
  edamam: "Edamam",
  apininjas: "API-Ninjas Recipes",
  bigoven: "BigOven",
  fatsecret: "FatSecret",
  bbcgoodfood: "BBC Good Food",
  allrecipes: "AllRecipes",
  jamieoliver: "Jamie Oliver",
  seriouseats: "Serious Eats",
};

function CredentialBadge({ status }: { status: "configured" | "missing" | "n/a" }) {
  if (status === "n/a") return null;
  if (status === "configured") {
    return (
      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 flex items-center gap-1 text-xs" data-testid="badge-credentials-configured">
        <CheckCircle2 className="w-3 h-3" /> Configured
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 flex items-center gap-1 text-xs" data-testid="badge-credentials-missing">
      <AlertCircle className="w-3 h-3" /> Missing Keys
    </Badge>
  );
}

function SourceRow({ source, onToggle, isPending }: {
  source: RecipeSource;
  onToggle: (sourceKey: string, enabled: boolean) => void;
  isPending: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-3 px-1"
      data-testid={`row-source-${source.sourceKey}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <span className="font-medium text-sm" data-testid={`text-source-name-${source.sourceKey}`}>
            {SOURCE_LABELS[source.sourceKey] ?? source.sourceKey}
          </span>
        </div>
        <CredentialBadge status={source.credentialStatus} />
        {source.credentialStatus === "missing" && (
          <span className="text-xs text-muted-foreground hidden sm:inline">API keys required</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!source.enabled && (
          <span className="text-xs text-muted-foreground" data-testid={`text-source-disabled-${source.sourceKey}`}>
            Disabled
          </span>
        )}
        <Switch
          checked={source.enabled}
          disabled={isPending}
          onCheckedChange={(checked) => onToggle(source.sourceKey, checked)}
          data-testid={`switch-source-${source.sourceKey}`}
          aria-label={`Toggle ${SOURCE_LABELS[source.sourceKey] ?? source.sourceKey}`}
        />
      </div>
    </div>
  );
}

const REASON_LABELS: Record<string, string> = {
  source_disabled: "Source disabled",
  missing_credentials: "Missing credentials",
  upstream_error: "Upstream error",
};

export default function AdminRecipeSourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  const { data: sources, isLoading, isError } = useQuery<RecipeSource[]>({
    queryKey: ["/api/admin/recipe-sources"],
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<{ logs: AuditLog[]; total: number; page: number; pageSize: number }>({
    queryKey: ["/api/admin/recipe-audit-logs", auditPage],
    queryFn: () => apiRequest("GET", `/api/admin/recipe-audit-logs?page=${auditPage}&pageSize=20`).then(r => r.json()),
    enabled: auditOpen,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ sourceKey, enabled }: { sourceKey: string; enabled: boolean }) => {
      const res = await apiRequest("PUT", "/api/admin/recipe-sources", { updates: [{ sourceKey, enabled }] });
      return res.json();
    },
    onMutate: async ({ sourceKey, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/recipe-sources"] });
      const prev = queryClient.getQueryData<RecipeSource[]>(["/api/admin/recipe-sources"]);
      queryClient.setQueryData<RecipeSource[]>(["/api/admin/recipe-sources"], old =>
        old?.map(s => s.sourceKey === sourceKey ? { ...s, enabled } : s) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      queryClient.setQueryData(["/api/admin/recipe-sources"], context?.prev);
      toast({ title: "Update failed", description: "Could not update source setting.", variant: "destructive" });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/recipe-sources"], data);
      toast({ title: "Source updated", description: "Recipe source setting saved." });
    },
  });

  const officialSources = sources?.filter(s => s.sourceType === "official_api") ?? [];
  const scrapedSources = sources?.filter(s => s.sourceType === "scraped") ?? [];

  const totalAuditPages = auditData ? Math.ceil(auditData.total / (auditData.pageSize || 20)) : 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-recipe-sources">Recipe Sources</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Control which external recipe sources are active. Toggle a source off to stop fetching from it immediately.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card data-testid="card-sources-error">
          <CardContent className="flex items-start gap-3 py-5">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Could not load recipe sources</p>
              <p className="text-xs text-muted-foreground mt-1">
                This usually means your session has expired or you are not recognised as an admin in this environment. Try logging out and back in. If the problem persists, check the server logs.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card data-testid="card-official-apis">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Official / Licensed APIs
                <Badge variant="secondary" className="text-xs">{officialSources.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Require API keys — configure credentials via environment variables before enabling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {officialSources.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No official API sources configured.</p>
              ) : (
                <div className="divide-y">
                  {officialSources.map(source => (
                    <SourceRow
                      key={source.sourceKey}
                      source={source}
                      onToggle={(key, enabled) => toggleMutation.mutate({ sourceKey: key, enabled })}
                      isPending={toggleMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-scraped-sources">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Scraped Sources
                <Badge variant="secondary" className="text-xs">{scrapedSources.length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Web scrapers — toggle off to stop requests to these sites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {scrapedSources.map(source => (
                  <SourceRow
                    key={source.sourceKey}
                    source={source}
                    onToggle={(key, enabled) => toggleMutation.mutate({ sourceKey: key, enabled })}
                    isPending={toggleMutation.isPending}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card data-testid="card-audit-log">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Blocked Request Audit Log</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuditOpen(v => !v)}
              data-testid="button-toggle-audit-log"
              className="gap-1"
            >
              {auditOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {auditOpen ? "Hide" : "View"}
            </Button>
          </div>
          <CardDescription className="text-xs">
            Requests blocked due to disabled sources or missing credentials.
          </CardDescription>
        </CardHeader>

        {auditOpen && (
          <CardContent>
            {auditLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : !auditData || auditData.logs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                <WifiOff className="w-8 h-8 opacity-40" />
                <p className="text-sm">No blocked requests recorded yet.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs calm-table" data-testid="table-audit-log">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left pb-2 pr-3 font-medium">Date</th>
                        <th className="text-left pb-2 pr-3 font-medium">Action</th>
                        <th className="text-left pb-2 pr-3 font-medium">Source</th>
                        <th className="text-left pb-2 pr-3 font-medium">Reason</th>
                        <th className="text-left pb-2 font-medium">URL / Query</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditData.logs.map(log => (
                        <tr key={log.id} className="border-b last:border-0" data-testid={`row-audit-${log.id}`}>
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="py-2 pr-3 capitalize">{log.action}</td>
                          <td className="py-2 pr-3 font-medium">{SOURCE_LABELS[log.sourceName] ?? log.sourceName}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                              {REASON_LABELS[log.reason] ?? log.reason}
                            </Badge>
                          </td>
                          <td className="py-2 max-w-[180px] truncate text-muted-foreground" title={log.urlOrQuery ?? ""}>
                            {log.urlOrQuery ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalAuditPages > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Page {auditData.page} of {totalAuditPages} ({auditData.total} total)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                        disabled={auditPage <= 1}
                        data-testid="button-audit-prev"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditPage(p => p + 1)}
                        disabled={auditPage >= totalAuditPages}
                        data-testid="button-audit-next"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
