import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Loader2, Trash2, Pencil, RefreshCw, Check, X,
  Plus, ChevronDown, ChevronRight, LayoutGrid, Camera,
  Globe, Lock
} from "lucide-react";
import type { User } from "@shared/schema";

interface MealPlanTemplate {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  isDefault: boolean;
  isPremium: boolean;
  status: string;
  publishedAt: string | null;
  ownerUserId: number | null;
  createdBy: number | null;
  itemCount: number;
}

interface TemplateItem {
  weekNumber: number;
  dayOfWeek: number;
  mealSlot: string;
  mealId: number;
}

interface TemplateWithItems extends MealPlanTemplate {
  items: TemplateItem[];
}

interface LibraryResponse {
  globalTemplates: MealPlanTemplate[];
  myTemplates: MealPlanTemplate[];
}

interface ConfigResponse {
  maxPrivateTemplatesFree: number;
  maxPrivateTemplatesPremium: number | null;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_SLOTS = ["breakfast", "lunch", "dinner"] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

interface TemplatePreviewProps {
  templateId: string;
  importMode: "replace" | "keep";
  onImport: (scope: { type: "all" | "week" | "day" | "meal"; weekNumber?: number; dayOfWeek?: number; mealSlot?: string }) => void;
  isImporting: boolean;
  canImport: boolean;
}

function TemplatePreview({ templateId, importMode, onImport, isImporting, canImport }: TemplatePreviewProps) {
  const { data: template, isLoading } = useQuery<TemplateWithItems>({
    queryKey: ["/api/plan-templates", templateId],
    queryFn: async () => {
      const res = await fetch(`/api/plan-templates/${templateId}`);
      if (!res.ok) throw new Error("Failed to load template");
      return res.json();
    },
    enabled: !!templateId,
  });

  const getMealsForCell = (weekNumber: number, dayOfWeek: number) => {
    if (!template) return {};
    const cells: Record<string, number> = {};
    for (const item of template.items) {
      if (item.weekNumber === weekNumber && item.dayOfWeek === dayOfWeek) {
        cells[item.mealSlot] = item.mealId;
      }
    }
    return cells;
  };

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4" data-testid="grid-template-preview">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="mt-4" data-testid="grid-template-preview">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{template?.items.length || 0} meals across 6 weeks</span>
        {canImport && (
          <Button
            size="sm"
            onClick={() => onImport({ type: "all" })}
            disabled={isImporting}
            data-testid="button-import-all"
          >
            {isImporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
            Import Entire Plan
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left p-1 text-muted-foreground font-normal w-16">Week</th>
              {DAY_NAMES.map((day, idx) => (
                <th key={day} className="text-center p-1 text-muted-foreground font-normal min-w-[80px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{day}</span>
                    {canImport && (
                      <button
                        className="text-[10px] text-primary hover:underline"
                        onClick={() => onImport({ type: "day", weekNumber: 1, dayOfWeek: idx + 1 })}
                        data-testid={`button-import-day-1-${idx + 1}`}
                        title={`Import all ${day}s`}
                      >
                        Import col
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(weekNum => (
              <tr key={weekNum} className="border-t border-border/40">
                <td className="p-1 align-top">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-muted-foreground font-medium">W{weekNum}</span>
                    {canImport && (
                      <button
                        className="text-[10px] text-primary hover:underline text-left"
                        onClick={() => onImport({ type: "week", weekNumber: weekNum })}
                        data-testid={`button-import-week-${weekNum}`}
                      >
                        Import
                      </button>
                    )}
                  </div>
                </td>
                {DAY_NAMES.map((_, dayIdx) => {
                  const dayOfWeek = dayIdx + 1;
                  const cells = getMealsForCell(weekNum, dayOfWeek);
                  return (
                    <td key={dayIdx} className="p-1 align-top border-l border-border/20">
                      <div className="space-y-0.5">
                        {MEAL_SLOTS.map(slot => {
                          const hasMeal = !!cells[slot];
                          return (
                            <div key={slot} className="flex items-center gap-0.5">
                              <span className={`text-[10px] truncate flex-1 ${hasMeal ? "text-foreground" : "text-muted-foreground/40"}`}>
                                {hasMeal ? `M${cells[slot]}` : "—"}
                              </span>
                              {canImport && hasMeal && (
                                <button
                                  className="text-[9px] text-primary hover:underline shrink-0"
                                  onClick={() => onImport({ type: "meal", weekNumber: weekNum, dayOfWeek, mealSlot: slot })}
                                  data-testid={`button-import-meal-${weekNum}-${dayOfWeek}-${slot}`}
                                  title={`Import ${slot}`}
                                >
                                  +
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TemplatePanelProps {
  open: boolean;
  onClose: () => void;
  user: User | null | undefined;
}

export function TemplatesPanel({ open, onClose, user }: TemplatePanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";
  const hasPremium = (user as any)?.hasPremiumAccess || isAdmin;

  const [importMode, setImportMode] = useState<"replace" | "keep">("replace");
  const [selectedGlobalId, setSelectedGlobalId] = useState<string | null>(null);
  const [selectedPrivateId, setSelectedPrivateId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [adminCreateOpen, setAdminCreateOpen] = useState(false);
  const [adminNewName, setAdminNewName] = useState("");
  const [adminNewSeason, setAdminNewSeason] = useState("");
  const [adminNewDesc, setAdminNewDesc] = useState("");

  const { data: library, isLoading: libraryLoading } = useQuery<LibraryResponse>({
    queryKey: ["/api/plan-templates/library"],
    enabled: open,
  });

  const { data: adminTemplates, isLoading: adminLoading } = useQuery<MealPlanTemplate[]>({
    queryKey: ["/api/admin/plan-templates"],
    enabled: open && isAdmin,
  });

  const { data: config } = useQuery<ConfigResponse>({
    queryKey: ["/api/config"],
  });

  const globalTemplates = isAdmin ? (adminTemplates ?? []) : (library?.globalTemplates ?? []);
  const myTemplates = library?.myTemplates ?? [];
  const maxFree = config?.maxPrivateTemplatesFree ?? 4;
  const privateCount = myTemplates.length;
  const atFreeLimit = !hasPremium && privateCount >= maxFree;

  const importMutation = useMutation({
    mutationFn: async ({ templateId, scope }: { templateId: string; scope: { type: "all" | "week" | "day" | "meal"; weekNumber?: number; dayOfWeek?: number; mealSlot?: string } }) => {
      const res = await apiRequest("POST", `/api/plan-templates/${templateId}/import`, {
        scope: scope.type,
        weekNumber: scope.weekNumber,
        dayOfWeek: scope.dayOfWeek,
        mealSlot: scope.mealSlot,
        mode: importMode,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Import failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
      toast({
        title: "Plan imported",
        description: `Added ${data.createdCount} meals, updated ${data.updatedCount}, skipped ${data.skippedCount}.`,
      });
      setImportingId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
      setImportingId(null);
    },
  });

  const handleImport = (templateId: string, scope: { type: "all" | "week" | "day" | "meal"; weekNumber?: number; dayOfWeek?: number; mealSlot?: string }) => {
    setImportingId(templateId);
    importMutation.mutate({ templateId, scope });
  };

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/plan-templates/mine", { name: saveName, description: saveDescription || undefined });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      toast({ title: "Template saved", description: `"${data.name}" saved with ${data.itemCount} meals.` });
      setSaveDialogOpen(false);
      setSaveName("");
      setSaveDescription("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save template", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      const res = await apiRequest("PUT", `/api/plan-templates/mine/${id}`, { name, description: description || undefined });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      setEditingId(null);
      toast({ title: "Template updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/plan-templates/mine/${id}`);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      setDeleteConfirmId(null);
      toast({ title: "Template deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const reSnapshotMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/plan-templates/mine/${id}/snapshot-from-planner`);
      if (!res.ok) throw new Error("Re-snapshot failed");
      return res.json();
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      qc.invalidateQueries({ queryKey: ["/api/plan-templates", id] });
      toast({ title: "Template updated", description: `${data.itemCount} meals captured from your planner.` });
    },
    onError: () => toast({ title: "Re-snapshot failed", variant: "destructive" }),
  });

  const adminCreateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/plan-templates", {
        name: adminNewName,
        season: adminNewSeason || undefined,
        description: adminNewDesc || undefined,
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/plan-templates"] });
      qc.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      setAdminCreateOpen(false);
      setAdminNewName("");
      setAdminNewSeason("");
      setAdminNewDesc("");
      toast({ title: "Template created as draft" });
    },
    onError: () => toast({ title: "Failed to create", variant: "destructive" }),
  });

  const adminSnapshotMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/plan-templates/${id}/snapshot-from-planner`);
      if (!res.ok) throw new Error("Snapshot failed");
      return res.json();
    },
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/plan-templates"] });
      qc.invalidateQueries({ queryKey: ["/api/plan-templates", id] });
      toast({ title: "Snapshot complete", description: `${data.itemCount} meals captured from your planner.` });
    },
    onError: () => toast({ title: "Snapshot failed", variant: "destructive" }),
  });

  const adminStatusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "publish" | "archive" | "restore" }) => {
      const res = await apiRequest("POST", `/api/admin/plan-templates/${id}/${action}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Action failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/plan-templates"] });
      qc.invalidateQueries({ queryKey: ["/api/plan-templates/library"] });
      toast({ title: "Template updated" });
    },
    onError: (err: Error) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const renderGlobalTemplateCard = (t: MealPlanTemplate) => {
    const isSelected = selectedGlobalId === t.id;
    const isPremiumLocked = !hasPremium && !t.isDefault;
    const canImport = !isPremiumLocked;

    return (
      <div key={t.id} className={`border rounded-lg overflow-hidden transition-colors ${isSelected ? "border-primary" : "border-border"}`} data-testid={`card-template-${t.id}`}>
        <div className="p-3 cursor-pointer" onClick={() => setSelectedGlobalId(isSelected ? null : t.id)}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-sm">{t.name}</span>
                {t.isDefault && <Badge variant="secondary" className="text-[10px] px-1.5">Standard</Badge>}
                {t.season && <Badge variant="outline" className="text-[10px] px-1.5">{t.season}</Badge>}
                {t.isPremium && <Badge className="text-[10px] px-1.5 bg-violet-100 text-violet-800">Premium</Badge>}
                {isAdmin && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] || ""}`} data-testid={`badge-status-${t.id}`}>{t.status}</span>}
              </div>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">{t.itemCount} meals</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isPremiumLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              {isSelected ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>

        {isSelected && (
          <div className="border-t bg-muted/30 p-3">
            {isPremiumLocked ? (
              <p className="text-sm text-muted-foreground text-center py-4">Upgrade to Premium to import this plan.</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">Import mode:</span>
                  <div className="flex rounded-md overflow-hidden border text-xs" data-testid="toggle-import-mode">
                    <button className={`px-2 py-1 ${importMode === "replace" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setImportMode("replace")}>Replace</button>
                    <button className={`px-2 py-1 ${importMode === "keep" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setImportMode("keep")}>Fill Empty</button>
                  </div>
                </div>
                <TemplatePreview
                  templateId={t.id}
                  importMode={importMode}
                  onImport={(scope) => handleImport(t.id, scope)}
                  isImporting={importingId === t.id && importMutation.isPending}
                  canImport={canImport}
                />
              </>
            )}

            {isAdmin && (
              <div className="mt-3 pt-3 border-t space-y-2" data-testid="section-admin-tools">
                <p className="text-xs font-medium text-muted-foreground">Admin actions</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="text-xs h-7"
                    onClick={() => adminSnapshotMutation.mutate(t.id)}
                    disabled={adminSnapshotMutation.isPending}
                    data-testid={`button-snapshot-${t.id}`}
                  >
                    {adminSnapshotMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Camera className="h-3 w-3 mr-1" />}
                    Snapshot My Planner
                  </Button>
                  {(t.status === "draft" || t.status === "archived") && (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-300"
                      onClick={() => adminStatusMutation.mutate({ id: t.id, action: "publish" })}
                      disabled={adminStatusMutation.isPending}
                      data-testid={`button-publish-${t.id}`}
                    >
                      Publish
                    </Button>
                  )}
                  {t.status === "published" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button size="sm" variant="outline" className="text-xs h-7 text-orange-700 border-orange-300"
                              onClick={() => adminStatusMutation.mutate({ id: t.id, action: "archive" })}
                              disabled={adminStatusMutation.isPending || t.isDefault}
                              data-testid={`button-archive-${t.id}`}
                            >
                              Archive
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {t.isDefault && <TooltipContent>Cannot archive the Standard template</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {t.status === "archived" && (
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => adminStatusMutation.mutate({ id: t.id, action: "restore" })}
                      disabled={adminStatusMutation.isPending}
                      data-testid={`button-restore-${t.id}`}
                    >
                      Restore to Draft
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPrivateTemplateCard = (t: MealPlanTemplate) => {
    const isSelected = selectedPrivateId === t.id;
    const isEditing = editingId === t.id;

    return (
      <div key={t.id} className={`border rounded-lg overflow-hidden transition-colors ${isSelected ? "border-primary" : "border-border"}`} data-testid={`card-template-${t.id}`}>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isEditing && setSelectedPrivateId(isSelected ? null : t.id)}>
              {isEditing ? (
                <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                  <Input className="h-7 text-sm" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Template name" />
                  <Input className="h-7 text-sm" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description (optional)" />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-xs" onClick={() => updateMutation.mutate({ id: t.id, name: editName, description: editDescription })} disabled={updateMutation.isPending}>Save</Button>
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm">{t.name}</span>
                    {t.season && <Badge variant="outline" className="text-[10px] px-1.5">{t.season}</Badge>}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">{t.itemCount} meals</p>
                </>
              )}
            </div>
            {!isEditing && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button size="icon" variant="ghost" className="h-6 w-6"
                  onClick={() => { setEditingId(t.id); setEditName(t.name); setEditDescription(t.description ?? ""); }}
                  data-testid={`button-edit-template-${t.id}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6"
                  onClick={() => reSnapshotMutation.mutate(t.id)}
                  disabled={reSnapshotMutation.isPending}
                  data-testid={`button-re-snapshot-${t.id}`}
                  title="Update from my current planner"
                >
                  {reSnapshotMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                  onClick={() => setDeleteConfirmId(t.id)}
                  data-testid={`button-delete-template-${t.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {isSelected ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            )}
          </div>
        </div>

        {isSelected && !isEditing && (
          <div className="border-t bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Import mode:</span>
              <div className="flex rounded-md overflow-hidden border text-xs">
                <button className={`px-2 py-1 ${importMode === "replace" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setImportMode("replace")}>Replace</button>
                <button className={`px-2 py-1 ${importMode === "keep" ? "bg-primary text-primary-foreground" : "bg-background"}`} onClick={() => setImportMode("keep")}>Fill Empty</button>
              </div>
            </div>
            <TemplatePreview
              templateId={t.id}
              importMode={importMode}
              onImport={(scope) => handleImport(t.id, scope)}
              isImporting={importingId === t.id && importMutation.isPending}
              canImport={true}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()} data-testid="sheet-templates">
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Meal Plan Templates
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="tha" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 shrink-0">
              <TabsTrigger value="tha" className="flex-1" data-testid="tab-tha-templates">
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                THA Templates
              </TabsTrigger>
              <TabsTrigger value="mine" className="flex-1" data-testid="tab-my-templates">
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                My Templates
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="tha" className="px-6 py-4 space-y-3 mt-0">
                {libraryLoading || adminLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : globalTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No published templates available.</p>
                ) : (
                  globalTemplates.map(renderGlobalTemplateCard)
                )}

                {isAdmin && (
                  <>
                    <Separator className="my-4" />
                    <div data-testid="section-admin-templates">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Admin: Create Template</p>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setAdminCreateOpen(true)} data-testid="button-create-admin-template">
                          <Plus className="h-3 w-3 mr-1" /> New Template
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Build your plan in the planner, then snapshot it into a template and publish it for users.</p>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="mine" className="px-6 py-4 space-y-3 mt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Your saved plans</p>
                    {!hasPremium && (
                      <p className="text-xs text-muted-foreground">{privateCount} / {maxFree} templates used</p>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={atFreeLimit}
                            onClick={() => setSaveDialogOpen(true)}
                            data-testid="button-save-as-template"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            Save Current Planner
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {atFreeLimit && (
                        <TooltipContent>Upgrade to Premium for unlimited saved templates</TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {myTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No saved templates yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Save your current 6-week planner as a reusable template.</p>
                  </div>
                ) : (
                  myTemplates.map(renderPrivateTemplateCard)
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Planner as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Template name (e.g. Summer 2025)"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              data-testid="input-save-template-name"
            />
            <Input
              placeholder="Description (optional)"
              value={saveDescription}
              onChange={e => setSaveDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveTemplateMutation.mutate()}
              disabled={!saveName.trim() || saveTemplateMutation.isPending}
              data-testid="button-confirm-save-template"
            >
              {saveTemplateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={(v) => !v && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will permanently delete the template and all its meal assignments. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminCreateOpen} onOpenChange={setAdminCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Template name (e.g. Summer)"
              value={adminNewName}
              onChange={e => setAdminNewName(e.target.value)}
              data-testid="input-admin-template-name"
            />
            <Input
              placeholder="Season (optional: Summer, Winter...)"
              value={adminNewSeason}
              onChange={e => setAdminNewSeason(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={adminNewDesc}
              onChange={e => setAdminNewDesc(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => adminCreateMutation.mutate()}
              disabled={!adminNewName.trim() || adminCreateMutation.isPending}
              data-testid="button-create-global-template"
            >
              {adminCreateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
