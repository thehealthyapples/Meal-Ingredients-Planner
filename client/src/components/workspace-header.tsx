import { type ReactNode, type HTMLAttributes, createContext, useContext, useLayoutEffect, useState } from "react";
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
  ShoppingCart, Search, User, ShieldCheck, LogOut, ArrowLeft,
} from "lucide-react";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

/**
 * The canonical Back slot (PX1-W4.5, fnd-px-back-three-mechanisms).
 *
 * Back in THA is HIERARCHY, not history (EXP §8): it always leads to the page's
 * one parent, never to wherever the browser happens to have been. Before this
 * slot existed, "back" had three incompatible implementations — a `navigate()`,
 * a `<Link>`, and a `window.location.href` full page reload that discarded the
 * TanStack cache — and four subpages had none at all.
 */
interface WorkspaceBackConfig {
  /** The hierarchy parent — where Back always leads. */
  href: string;
  /** Visible label; defaults to "Back". Name the parent where it helps: "Cookbook". */
  label?: string;
  /**
   * Intercept before leaving (e.g. an unsaved-changes guard). Call `proceed`
   * to complete the navigation; don't call it to stay.
   */
  beforeNavigate?: (proceed: () => void) => void;
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
  /** Back to the hierarchy parent. Only subpages carry this; realms in the nav do not. */
  back?: WorkspaceBackConfig;
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
        {/* PROD2: the "Partners" entry was withdrawn. Every one of the 12
            partners in client/src/data/partners.ts is invented, with an
            example.com URL, shipped behind a real affiliate-disclosure notice —
            so THA was recommending health and nutrition practitioners that do
            not exist. The page and its data are kept for a real partner
            programme; the doors are closed until the partners are real. */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="workspace-menu-admin">
                <ShieldCheck className="h-4 w-4" />
                Admin
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
  back,
  wide = false,
  titleTestId,
  className,
}: WorkspaceHeaderProps) {
  const { user, logout } = useUser();
  const [location, navigate] = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { setRealm } = useAppRealm();
  useLayoutEffect(() => { setRealm(realm); }, [realm, setRealm]);

  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const itemCount = shoppingListItems.length;
  const isAdmin = (user as any)?.role === "admin";
  const maxW = wide ? WIDE_MAXW : NARROW_MAXW;

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

  /* ── Back to the hierarchy parent (shared across all three layouts) ── */
  const backButton = back ? (
    <Button
      variant="ghost"
      size="sm"
      className="shrink-0"
      onClick={() => {
        const go = () => navigate(back.href);
        if (back.beforeNavigate) back.beforeNavigate(go);
        else go();
      }}
      data-testid="button-workspace-back"
    >
      <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
      {back.label ?? "Back"}
    </Button>
  ) : null;

  /*
   * The canonical desktop brand mark — ONE element, ONE size, rendered by both
   * desktop header arms. Previously each arm declared its own <img>, so the logo
   * silently shrank to 24px on any page that happened not to pass a contextBar
   * (Home, the secondary pages, and every loading state). Logo scale is an
   * identity concern, not a side-effect of a page's layout: UI Principle 4 gives
   * every visual concern exactly one owning pattern.
   */
  const desktopLogo = (
    <Link href="/home" aria-label="Home" className="flex-shrink-0">
      <img
        src="/logo-long.png"
        alt="The Healthy Apples"
        style={{ height: "68px" }}
        className="w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
      />
    </Link>
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
       * logo + divider as a flex row). Both arms render the same `desktopLogo`
       * at the same size, so the brand mark does not change with the layout.
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
                {desktopLogo}
                <div className="w-px realm-header-border border-l self-stretch flex-shrink-0" />
              </div>

              {/* Row 1, Col 2: Page title */}
              <div
                className="flex items-center gap-1 min-w-0 shrink-0"
                style={{ gridRow: "1", gridColumn: "2" }}
              >
                {backButton}
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
              className="hidden md:grid items-center min-h-[76px] gap-x-3"
              style={{ gridTemplateColumns: "auto auto 1fr auto" }}
            >
              {/* Col 1: Brand — logo + divider, identical to the two-row arm */}
              <div className="flex items-center gap-3 shrink-0 self-stretch">
                {desktopLogo}
                <div className="w-px realm-header-border border-l self-stretch flex-shrink-0" />
              </div>

              {/* Col 2: Page title */}
              <div className="flex items-center gap-1 min-w-0 shrink-0">
                {backButton}
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
                {backButton}
                <Link href="/home" aria-label="Home" className="flex-shrink-0">
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
              <div className="flex items-center min-h-[36px] pb-2">
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

/* ── PageContainer ───────────────────────────────────────────────────────────── */

/**
 * The canonical page content column (PX1-W4.5, fnd-px-page-shell-hand-rolled).
 *
 * Before this existed, the container string was copy-pasted 17 times and the top
 * padding diverged seven ways (48px on Home → none at all on the Cookbook), so the
 * gap between the banner and the first card changed on every page. One owner, one
 * rhythm: it reads the SAME `wide` flag as `WorkspaceHeader`, so a page's content
 * column can no longer disagree with its own banner about how wide the page is.
 *
 * `pageContainerClass` is exported for the two surfaces whose container is chosen
 * conditionally (Shop mode's fullscreen escape) and cannot mount a component —
 * the string still has exactly one owner.
 */
const WIDE_MAXW = "max-w-screen-2xl 3xl:max-w-[1920px]";
const NARROW_MAXW = "max-w-screen-xl 2xl:max-w-screen-2xl 3xl:max-w-[1920px]";

export function pageContainerClass(wide = false): string {
  return `${wide ? WIDE_MAXW : NARROW_MAXW} mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6`;
}

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  wide?: boolean;
}

export function PageContainer({ wide = false, className, ...rest }: PageContainerProps) {
  return <div className={cn(pageContainerClass(wide), className)} {...rest} />;
}
