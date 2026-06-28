import { type ReactNode, createContext, useContext, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ShoppingCart, Search, Heart, User, ShieldCheck, Star, Sliders, LogOut,
} from "lucide-react";
import { api } from "@shared/routes";
import thaAppleSrc from "@/assets/icons/tha-apple.png";
import { useAppRealm } from "@/components/nav-bar";

/**
 * Portal slot provided by ProtectedRoute in App.tsx.
 * When set, WorkspaceHeader portals its content above the sidebar/main flex row
 * so the brand banner spans the full viewport width.
 */
export const WorkspaceHeaderSlotContext = createContext<HTMLElement | null>(null);

export type PageRealm =
  | "cookbook"
  | "planner"
  | "pantry"
  | "analyser"
  | "diary"
  | "basket"
  | "list"
  | "home"
  | "nutrition"
  | "shopping";

interface WorkspaceSearchConfig {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}

interface WorkspaceHeaderProps {
  title: string;
  realm: PageRealm;
  /** Contextual search — renders in center on desktop, below the bar on mobile. */
  search?: WorkspaceSearchConfig;
  /**
   * Override center column with arbitrary content (e.g. Analyser's search+barcode).
   * Takes precedence over `search` when both are provided.
   */
  centerContent?: ReactNode;
  /** Page-specific actions rendered LEFT of basket and profile in the right column. */
  actions?: ReactNode;
  /** Sticky strip below the 56px header: tabs, week nav, filters, mode switchers. */
  contextBar?: ReactNode;
  /** Prevent mobile search collapse while a popover is open. */
  collapseDisabled?: boolean;
  wide?: boolean;
  titleTestId?: string;
  className?: string;
}

/* ── Profile / Apple Menu dropdown ──────────────────────────────────────────── */
function ProfileMenu({
  isAdmin,
  logout,
}: {
  isAdmin: boolean;
  logout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
          aria-label="Menu"
          data-testid="button-workspace-profile-menu"
        >
          <img src={thaAppleSrc} alt="Menu" className="h-[38px] w-[38px] object-contain" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="workspace-menu-profile">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/partners" className="flex items-center gap-2 cursor-pointer" data-testid="workspace-menu-partners">
            <Heart className="h-4 w-4" />
            Partners
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/users" className="flex items-center gap-2 cursor-pointer" data-testid="workspace-menu-admin-users">
                <ShieldCheck className="h-4 w-4" />
                Users
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/ingredient-products" className="flex items-center gap-2 cursor-pointer" data-testid="workspace-menu-admin-picks">
                <Star className="h-4 w-4" />
                Picks
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/recipe-sources" className="flex items-center gap-2 cursor-pointer" data-testid="workspace-menu-admin-sources">
                <Sliders className="h-4 w-4" />
                Recipe Sources
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="text-muted-foreground hover:text-destructive focus:text-destructive cursor-pointer"
          data-testid="workspace-menu-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── WorkspaceHeader ─────────────────────────────────────────────────────────── */
export function WorkspaceHeader({
  title,
  realm,
  search,
  centerContent,
  actions,
  contextBar,
  wide = false,
  titleTestId,
  className,
}: WorkspaceHeaderProps) {
  const { user, logout } = useUser();
  const [location] = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { setRealm } = useAppRealm();
  useLayoutEffect(() => { setRealm(realm); }, [realm, setRealm]);

  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const itemCount = shoppingListItems.length;
  const isAdmin = (user as any)?.role === "admin";
  const maxW = wide ? "max-w-screen-2xl 3xl:max-w-[1920px]" : "max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1920px]";

  const isBasketActive = location === "/shopping-workspace" || location === "/basket" || location === "/analyse-basket";

  /* ── Inline search input (desktop center / mobile panel) ── */
  const searchInput = search ? (
    <div className="relative w-full max-w-xs sm:max-w-[280px]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder={search.placeholder}
        value={search.value}
        onChange={(e) => search.onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") search.onSubmit();
        }}
        className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/50 bg-background/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-colors"
        data-testid="input-workspace-search"
      />
    </div>
  ) : null;

  const headerSlot = useContext(WorkspaceHeaderSlotContext);

  /* ── Basket icon (shared between single-row and two-row desktop layouts) ── */
  const basketIcon = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/shopping-workspace"
          className={`relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
            isBasketActive
              ? "bg-[hsl(190,30%,86%)] text-[hsl(190,42%,20%)] dark:bg-[hsl(190,18%,17%)] dark:text-[hsl(190,32%,72%)]"
              : "text-[hsl(190,38%,44%)] hover:bg-[hsl(190,22%,92%)] hover:text-[hsl(190,42%,28%)] dark:text-[hsl(190,28%,58%)] dark:hover:bg-[hsl(190,12%,18%)] dark:hover:text-[hsl(190,28%,68%)]"
          }`}
          aria-label="Shopping"
          data-testid="button-workspace-basket"
        >
          <ShoppingCart className="h-4.5 w-4.5" style={{ width: "18px", height: "18px" }} />
          {itemCount > 0 && (
            <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none pointer-events-none">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>Shopping{itemCount > 0 ? ` (${itemCount})` : ""}</TooltipContent>
    </Tooltip>
  );

  const headerContent = (
    <div
      className={`page-sticky-header${className ? ` ${className}` : ""}`}
      data-realm={realm}
      data-testid="workspace-header"
    >
      {/*
       * Unified platform banner — ONE component, ONE border-b.
       *
       * When contextBar is present the grid is 2D:
       *   Col 1 (auto)  — THA Long Logo, spans rows 1–2
       *   Col 2 (auto)  — Row 1: page title  |  Row 2: workspace navigation (spans to end)
       *   Col 3 (1fr)   — Row 1: search / center content
       *   Col 4 (auto)  — Row 1: actions + basket + profile
       *
       * When contextBar is absent, a simple single-row grid is used (Col 1 contains
       * logo + divider as a flex row; logo stays at compact size).
       */}
      <header className="realm-header-bg border-b realm-header-border w-full">
        <div className={`${maxW} mx-auto px-3 sm:px-6 lg:px-8`}>

          {contextBar ? (
            /* ── Desktop: unified two-row banner ── */
            <div
              className="hidden md:grid gap-x-3"
              style={{ gridTemplateColumns: "auto auto 1fr auto", gridTemplateRows: "48px auto" }}
            >
              {/* Logo — spans both rows; divider self-stretches to full banner height */}
              <div
                className="flex items-center gap-3 shrink-0"
                style={{ gridRow: "1 / 3", gridColumn: "1" }}
              >
                <Link href="/dashboard" aria-label="Dashboard" className="flex-shrink-0">
                  <img
                    src="/logo-long.png"
                    alt="The Healthy Apples"
                    style={{ height: "68px" }}
                    className="w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                  />
                </Link>
                <div className="w-px realm-header-border border-l self-stretch flex-shrink-0" />
              </div>

              {/* Row 1, Col 2: Page title */}
              <div
                className="flex items-center min-w-0 shrink-0"
                style={{ gridRow: "1", gridColumn: "2" }}
              >
                <h1
                  className="realm-title text-[17px] font-semibold tracking-tight leading-none truncate"
                  data-testid={titleTestId}
                >
                  {title}
                </h1>
              </div>

              {/* Row 1, Col 3: Center — search or custom content */}
              <div
                className="flex justify-center items-center px-3"
                style={{ gridRow: "1", gridColumn: "3" }}
              >
                {centerContent ?? searchInput}
              </div>

              {/* Row 1, Col 4: Right — actions + basket + profile */}
              <div
                className="flex items-center gap-1 shrink-0"
                style={{ gridRow: "1", gridColumn: "4" }}
              >
                {actions && (
                  <div className="flex items-center gap-1 mr-1">
                    {actions}
                  </div>
                )}
                {basketIcon}
                <ProfileMenu isAdmin={isAdmin} logout={logout} />
              </div>

              {/* Row 2, Cols 2–4: Workspace navigation — left edge aligns with page title */}
              <div
                className="flex items-center min-h-[40px]"
                style={{ gridRow: "2", gridColumn: "2 / -1" }}
              >
                {contextBar}
              </div>
            </div>
          ) : (
            /* ── Desktop: single-row header (no workspace navigation) ── */
            <div
              className="hidden md:grid items-center h-12 gap-x-3"
              style={{ gridTemplateColumns: "auto auto 1fr auto" }}
            >
              {/* Col 1: Brand — logo + divider */}
              <div className="flex items-center gap-3 shrink-0">
                <Link href="/dashboard" aria-label="Dashboard" className="flex-shrink-0">
                  <img
                    src="/logo-long.png"
                    alt="The Healthy Apples"
                    className="max-h-6 h-auto w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                  />
                </Link>
                <div className="h-4 w-px realm-header-border border-l flex-shrink-0" />
              </div>

              {/* Col 2: Page title */}
              <div className="flex items-center min-w-0 shrink-0">
                <h1
                  className="realm-title text-[17px] font-semibold tracking-tight leading-none truncate"
                  data-testid={titleTestId}
                >
                  {title}
                </h1>
              </div>

              {/* Col 3: Center */}
              <div className="flex justify-center px-3">
                {centerContent ?? searchInput}
              </div>

              {/* Col 4: Right */}
              <div className="flex items-center gap-1 shrink-0">
                {actions && (
                  <div className="flex items-center gap-1 mr-1">
                    {actions}
                  </div>
                )}
                {basketIcon}
                <ProfileMenu isAdmin={isAdmin} logout={logout} />
              </div>
            </div>
          )}

          {/* ── Mobile layout (unchanged for both contextBar variants) ── */}
          <div className="md:hidden">
            {/* Row 1: title | basket + search toggle + profile */}
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2 min-w-0">
                <Link href="/dashboard" aria-label="Dashboard" className="flex-shrink-0">
                  <img
                    src="/logo-long.png"
                    alt="The Healthy Apples"
                    className="h-auto max-h-[28px] w-auto max-w-[120px] object-contain opacity-90"
                  />
                </Link>
                <h1
                  className="realm-title text-[16px] font-semibold tracking-tight leading-none truncate max-w-[160px]"
                  data-testid={titleTestId}
                >
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {actions && (
                  <div className="flex items-center gap-0.5 mr-0.5">
                    {actions}
                  </div>
                )}

                {search && (
                  <button
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    onClick={() => setMobileSearchOpen((v) => !v)}
                    aria-label="Search"
                    data-testid="button-workspace-mobile-search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}

                <Link
                  href="/shopping-workspace"
                  className={`relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
                    isBasketActive
                      ? "bg-[hsl(190,28%,86%)] text-[hsl(190,42%,20%)] dark:bg-[hsl(190,18%,19%)] dark:text-[hsl(190,32%,72%)]"
                      : "text-[hsl(190,38%,44%)] hover:bg-[hsl(190,22%,92%)] dark:text-[hsl(190,28%,58%)] dark:hover:bg-[hsl(190,12%,20%)]"
                  }`}
                  aria-label="Shopping"
                  data-testid="button-workspace-basket"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none pointer-events-none">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>

                <ProfileMenu isAdmin={isAdmin} logout={logout} />
              </div>
            </div>

            {/* Search panel (expanded) */}
            {search && mobileSearchOpen && (
              <div className="pb-2.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder={search.placeholder}
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { search.onSubmit(); setMobileSearchOpen(false); }
                      if (e.key === "Escape") setMobileSearchOpen(false);
                    }}
                    autoFocus
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/50 bg-background/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    data-testid="input-workspace-search-mobile"
                  />
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground text-sm shrink-0 px-1"
                  onClick={() => setMobileSearchOpen(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* centerContent on mobile */}
            {centerContent && (
              <div className="pb-2.5">
                {centerContent}
              </div>
            )}

            {/* Workspace navigation on mobile */}
            {contextBar && (
              <div className="min-h-[40px] flex items-center">
                {contextBar}
              </div>
            )}
          </div>

        </div>
      </header>
    </div>
  );

  return headerSlot ? createPortal(headerContent, headerSlot) : headerContent;
}
