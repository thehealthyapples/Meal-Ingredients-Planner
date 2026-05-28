import { type ReactNode, useRef, useState, useEffect } from "react";
import { Wand2, Camera, X, ChevronLeft, ChevronDown, Upload, Plus, LayoutGrid, List, Sliders, BookOpen, Search, Loader2, ChefHat, Globe, Snowflake, Package } from "lucide-react";
import { CreateMealContent } from "@/components/create-meal-modal";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

export type CookbookWorkspaceMode = "build" | "scan" | "filter" | null;

interface Props {
  mode: CookbookWorkspaceMode;
  onSetMode: (mode: CookbookWorkspaceMode) => void;
  /** Scan: trigger camera capture */
  onCameraClick: () => void;
  /** Scan: called when a file is selected for upload */
  onScanFile: (file: File) => void;
  scanLoading: boolean;
  /** Build: called after meal is successfully created */
  onBuildCreated?: (mealId: number) => void;
  /** Add Recipe shortcut: trigger the existing CreateMealDialog */
  onAddRecipe?: () => void;
  /** Search */
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
  /** Display controls */
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filterCount: number;
  /** Filter panel content — rendered when mode === "filter" */
  filterContent?: ReactNode;
  /** Mobile drawer: true to open the workspace drawer */
  mobileOpen?: boolean;
  /** Mobile drawer: called when the drawer should close */
  onMobileClose?: () => void;
  /** Group filter state — passed from meals-page for mobile drawer Browse section */
  activeGroups?: Set<string>;
  onToggleGroup?: (group: string) => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// ── Idle hub ──────────────────────────────────────────────────────────────────

const GROUP_FILTERS = [
  { id: "cookbook", label: "My Cookbook", Icon: ChefHat },
  { id: "recipes", label: "Recipes", Icon: Globe },
  { id: "freezer", label: "My Freezer", Icon: Snowflake },
  { id: "packaged", label: "Packaged", Icon: Package },
] as const;

function WorkspaceIdleContent({
  onSetMode,
  onAddRecipe,
  viewMode,
  onViewModeChange,
  filterCount,
  searchTerm,
  onSearchChange,
  isSearching,
  isMobile = false,
  activeGroups,
  onToggleGroup,
}: {
  onSetMode: (mode: CookbookWorkspaceMode) => void;
  onAddRecipe?: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filterCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
  isMobile?: boolean;
  activeGroups?: Set<string>;
  onToggleGroup?: (group: string) => void;
}) {
  // On mobile: sections start collapsed. On desktop: always open.
  const [createOpen, setCreateOpen] = useState(!isMobile);
  const [displayOpen, setDisplayOpen] = useState(!isMobile);
  const [browseOpen, setBrowseOpen] = useState(true);

  // Sync open state if viewport crosses mobile breakpoint
  useEffect(() => {
    if (!isMobile) { setCreateOpen(true); setDisplayOpen(true); }
  }, [isMobile]);

  return (
    <div data-testid="cookbook-workspace-idle">
      <p className="text-[11px] text-muted-foreground/60 pb-2 leading-snug">
        Search the web or scan a recipe to grow your cookbook.
      </p>
      {/* Search */}
      <div className="pb-3">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider py-2">
          Search
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search cookbook..."
            className="pl-8 pr-8 h-9 w-full text-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="input-search-meals"
          />
          {isSearching && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-border/50 mb-1" />

      {/* Create section */}
      <button
        className="w-full flex items-center justify-between py-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        onClick={() => isMobile && setCreateOpen(v => !v)}
        aria-expanded={createOpen}
        aria-label="Create"
        data-testid="button-section-create-toggle"
        style={{ cursor: isMobile ? "pointer" : "default" }}
      >
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
          Create
        </span>
        {isMobile && (
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-150 ${createOpen ? "" : "-rotate-90"}`} />
        )}
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: createOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex gap-2 pb-2" data-testid="cookbook-workspace-create-buttons">
            <button
              className="flex-1 flex flex-col items-center gap-1.5 rounded-md border border-border realm-banner-btn px-1.5 py-3 transition-colors"
              onClick={() => onSetMode("build")}
              data-testid="button-cookbook-build"
            >
              <Wand2 className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium leading-none">Build</span>
            </button>
            <button
              className="flex-1 flex flex-col items-center gap-1.5 rounded-md border border-border realm-banner-btn px-1.5 py-3 transition-colors"
              onClick={() => onSetMode("scan")}
              data-testid="button-cookbook-scan"
            >
              <Camera className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium leading-none">Scan</span>
            </button>
            {onAddRecipe && (
              <button
                className="flex-1 flex flex-col items-center gap-1.5 rounded-md border border-border realm-banner-btn px-1.5 py-3 transition-colors"
                onClick={onAddRecipe}
                data-testid="button-cookbook-add-recipe"
              >
                <Plus className="h-4 w-4 text-primary/70" />
                <span className="text-[11px] font-medium leading-none">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border/50 my-1" />

      {/* Display section */}
      <button
        className="w-full flex items-center justify-between py-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        onClick={() => isMobile && setDisplayOpen(v => !v)}
        aria-expanded={displayOpen}
        aria-label="Display"
        data-testid="button-section-display-toggle"
        style={{ cursor: isMobile ? "pointer" : "default" }}
      >
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
          Display
        </span>
        {isMobile && (
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-150 ${displayOpen ? "" : "-rotate-90"}`} />
        )}
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: displayOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex gap-2 pb-2">
            <button
              className={`flex-1 flex flex-col items-center gap-1.5 rounded-md border border-border px-1.5 py-3 transition-colors realm-banner-btn ${viewMode === 'grid' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => onViewModeChange('grid')}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium leading-none">Grid</span>
            </button>
            <button
              className={`flex-1 flex flex-col items-center gap-1.5 rounded-md border border-border px-1.5 py-3 transition-colors realm-banner-btn ${viewMode === 'list' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => onViewModeChange('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium leading-none">List</span>
            </button>
            <button
              className={`flex-1 flex flex-col items-center gap-1.5 rounded-md border border-border px-1.5 py-3 transition-colors relative realm-banner-btn ${filterCount > 0 ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => onSetMode("filter")}
              data-testid="button-toggle-advanced-filters"
            >
              <Sliders className="h-4 w-4 text-primary/70" />
              <span className="text-[11px] font-medium leading-none">Filter</span>
              {filterCount > 0 && (
                <span className="absolute top-1 right-1.5 text-[9px] font-bold text-primary leading-none">
                  {filterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Browse section — only shown on mobile (group tabs are hidden from banner on mobile) */}
      {isMobile && activeGroups && onToggleGroup && (
        <>
          <div className="w-full h-px bg-border/50 my-1" />
          <button
            className="w-full flex items-center justify-between py-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
            onClick={() => setBrowseOpen(v => !v)}
            aria-expanded={browseOpen}
            aria-label="Browse"
            data-testid="button-section-browse-toggle"
          >
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Browse
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-150 ${browseOpen ? "" : "-rotate-90"}`} />
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: browseOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-1.5 pb-3" data-testid="cookbook-workspace-browse-buttons">
                {GROUP_FILTERS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => onToggleGroup(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      activeGroups.has(id)
                        ? "realm-banner-btn shadow-sm border-primary/30"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                    data-testid={`button-workspace-group-${id}`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// ── Scan mode ─────────────────────────────────────────────────────────────────

function WorkspaceScanContent({
  onCameraClick,
  onScanFile,
  scanLoading,
}: {
  onCameraClick: () => void;
  onScanFile: (file: File) => void;
  scanLoading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3" data-testid="cookbook-workspace-scan">
      <p className="text-xs text-muted-foreground leading-snug">
        Take a photo or upload an image of a recipe. THA AI will extract the ingredients and method for you.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onScanFile(f); }}
      />

      <button
        className="w-full flex items-center gap-3 rounded-md border border-border realm-banner-btn px-3 py-3 text-sm font-medium transition-colors disabled:opacity-50"
        onClick={onCameraClick}
        disabled={scanLoading}
        data-testid="button-workspace-camera"
      >
        <Camera className="h-4 w-4 text-primary/70 shrink-0" />
        <span>Take photo</span>
      </button>

      <button
        className="w-full flex items-center gap-3 rounded-md border border-border realm-banner-btn px-3 py-3 text-sm font-medium transition-colors disabled:opacity-50"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanLoading}
        data-testid="button-workspace-upload"
      >
        <Upload className="h-4 w-4 text-primary/70 shrink-0" />
        <span>Upload image</span>
      </button>

      {scanLoading && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Reading recipe…
        </p>
      )}

      <div className="w-full h-px bg-border/50" />
      <p className="text-[11px] text-muted-foreground/60 leading-snug">
        Works with printed recipes, handwritten cards, and cookbook pages.
      </p>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function CookbookWorkspacePanel({
  mode,
  onSetMode,
  onCameraClick,
  onScanFile,
  scanLoading,
  onBuildCreated,
  onAddRecipe,
  viewMode,
  onViewModeChange,
  filterCount,
  filterContent,
  searchTerm,
  onSearchChange,
  isSearching,
  mobileOpen = false,
  onMobileClose,
  activeGroups,
  onToggleGroup,
}: Props) {
  const isMobile = useIsMobile();
  const goBack = () => onSetMode(null);

  const panelBody = (
    <>
      {!mode && (
        <WorkspaceIdleContent
          onSetMode={onSetMode}
          onAddRecipe={onAddRecipe}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          filterCount={filterCount}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          isSearching={isSearching}
          isMobile={isMobile}
          activeGroups={activeGroups}
          onToggleGroup={onToggleGroup}
        />
      )}
      {mode === "build" && (
        <CreateMealContent
          key="cookbook-build-panel"
          onSaved={(mealId) => {
            onBuildCreated?.(mealId);
            onSetMode(null);
          }}
          onCancel={goBack}
        />
      )}
      {mode === "scan" && (
        <WorkspaceScanContent
          onCameraClick={() => { onSetMode(null); onCameraClick(); }}
          onScanFile={(f) => { onSetMode(null); onScanFile(f); }}
          scanLoading={scanLoading}
        />
      )}
      {mode === "filter" && filterContent}
    </>
  );

  // ── Mobile: Drawer ────────────────────────────────────────────────────────
  if (isMobile) {
    const drawerTitle = mode === "build" ? "Build Recipe"
      : mode === "scan" ? "Scan Recipe"
      : mode === "filter" ? "Filter"
      : "Cookbook Workspace";

    return (
      <Drawer
        open={mobileOpen || !!mode}
        onOpenChange={(v) => {
          if (!v) {
            onSetMode(null);
            onMobileClose?.();
          }
        }}
        shouldScaleBackground={false}
      >
        <DrawerContent
          className="flex flex-col max-h-[75vh]"
          data-testid="drawer-cookbook-workspace"
          data-realm="cookbook"
        >
          <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0 realm-header-bg">
            <div className="flex items-center gap-1.5">
              {mode && (
                <button
                  onClick={goBack}
                  className="rounded-md p-1 -ml-1 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
                  aria-label="Back to workspace"
                  data-testid="button-cookbook-workspace-back-mobile"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "var(--realm-accent)" }} />
                {drawerTitle}
              </DrawerTitle>
            </div>
            <button
              onClick={() => { onSetMode(null); onMobileClose?.(); }}
              className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
              aria-label="Close workspace"
              data-testid="button-cookbook-workspace-close-mobile"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="w-full h-px shrink-0 bg-[var(--realm-border)]" />
          <div
            className="flex-1 overflow-y-auto min-h-0 px-4 pt-3"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            {panelBody}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: sidebar ──────────────────────────────────────────────────────
  return (
    <aside
      className="shrink-0 w-[244px] sticky top-40 mt-4 self-start rounded-xl flex flex-col max-h-[calc(100vh-10rem)] overflow-hidden"
      style={{
        border: "1px solid var(--realm-border)",
        background: "var(--realm-bg)",
      }}
      data-testid="panel-cookbook-workspace"
    >
      {/* Header — only shown in active sub-modes, idle has no header */}
      {mode && (
        <>
          <div className="flex items-center justify-between px-2 pt-1.5 pb-1 shrink-0">
            <button
              onClick={goBack}
              className="rounded-md p-1 hover:bg-accent/40 text-muted-foreground transition-colors"
              aria-label="Back to workspace"
              data-testid="button-cookbook-workspace-back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goBack}
              className="rounded-md p-1 hover:bg-accent/40 text-muted-foreground transition-colors"
              aria-label="Close"
              data-testid="button-cookbook-workspace-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="w-full h-px bg-border shrink-0" />
        </>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2.5 pb-3 pt-2.5">
        {panelBody}
      </div>
    </aside>
  );
}
