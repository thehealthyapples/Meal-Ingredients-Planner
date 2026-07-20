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
  ShoppingCart, Search, User, ShieldCheck, LogOut, ArrowLeft, Leaf,
} from "lucide-react";
import { useRegisterPageHeader } from "@/components/layout/shell-slots";
import { openCompanion } from "@/components/conversation/companion-open";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  | "shopping"
  // COMM2 — the Orchard, the room that looks outward. One realm, not four:
  // the Orchard overview, Neighbourhoods, the Village and the High Street are
  // the experience INSIDE this room, never separate realms or destinations.
  | "orchard";

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
  /**
   * NAV1 — who is rendering this header.
   *
   * `"page"` (the default, and every existing call site) is a room drawing its
   * own header: it registers its presence with the shell and portals into the
   * shell's slot.
   *
   * `"shell"` is the application shell drawing the DEFAULT header for a page
   * that did not draw one. It deliberately does not register — a header that
   * registered its own presence would cancel the very fallback it is — and it
   * renders in place rather than portalling, because the shell already renders
   * it exactly where the slot is.
   */
  role?: "page" | "shell";
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
        {/* UX2 — THE SECOND APPLE IS RETIRED.
            This button rendered the canonical THA apple at 38 px, so the header
            carried the apple TWICE: once as the company's mark and once, larger,
            as "your account". BRAND1's whole finding is that the apple IS the
            house — spending it on a settings menu makes the household's own
            account the loudest brand statement on screen, and leaves the real
            mark competing with a copy of itself.
            One apple, one meaning. The account is a person, so it takes a person's
            glyph, in the same quiet weight as the Companion and basket beside it. */}
        <button
          className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Menu"
          data-testid="button-workspace-profile-menu"
        >
          <User className="h-4 w-4" />
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
  role = "page",
}: WorkspaceHeaderProps) {
  const { user, logout } = useUser();
  const [location, navigate] = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { setRealm } = useAppRealm();
  useLayoutEffect(() => { setRealm(realm); }, [realm, setRealm]);
  // NAV1 — tells the shell a page has drawn its own header, so the shell's
  // default one stands down. Only a page registers; the shell's own does not.
  useRegisterPageHeader(role === "page");

  const { data: shoppingListItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const itemCount = shoppingListItems.length;
  const isAdmin = (user as any)?.role === "admin";
  const maxW = wide ? WIDE_MAXW : NARROW_MAXW;

  // SHOP3 — one canonical Shopping destination; the duplicate paths redirect.
  const isBasketActive = location === "/shopping-workspace";

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
          // UX2 — THE BASKET IS QUIET UNTIL YOU ARE IN IT.
          // At rest this glyph was a saturated `hsl(190,38%,44%)` cyan sitting
          // between the Companion's leaf and the account glyph, both of which are
          // `text-muted-foreground`. Photographed rather than reasoned about, it
          // was the loudest thing in the header and it read as a NOTIFICATION —
          // "something is wrong with your basket" — rather than as a door.
          // This is UX_NAV1's move, applied to the one door that never made it onto
          // the shelf: the room's hue is spent on the LIT state, not on the resting
          // one. Wayfinding is preserved exactly — the basket still turns its own
          // shopping cyan when you are standing in Shopping — and the header goes
          // back to being one material with three quiet glyphs on it.
          // The unread-count badge is untouched: a number a household must act on
          // is not resting state, and it keeps its `--primary` fill.
          className={`relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
            isBasketActive
              ? "bg-[hsl(190,30%,86%)] text-[hsl(190,42%,20%)] dark:bg-[hsl(190,18%,17%)] dark:text-[hsl(190,32%,72%)]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

  /*
   * NAV1 — the Companion's entry in the permanent header.
   *
   * The Companion is "the friend at the counter — a presence, not a room"
   * (Experience Blueprint § 9), which is exactly why this is a doorway and not
   * a destination: it opens the one `FloatingAssistant` and appears in no
   * navigation list. It ASKS rather than controls (see companion-open.ts), so
   * the Companion keeps sole ownership of its own panel state.
   *
   * It sits beside the basket rather than replacing the floating trigger: the
   * floating one follows the household down a long room, this one is where the
   * house's fixed furniture lives. Both open the same single panel.
   */
  const companionButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={openCompanion}
          className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Ask the Companion"
          data-testid="button-workspace-companion"
        >
          <Leaf className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Ask the Companion</TooltipContent>
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
   * THE BRAND MARK — one element, one size, every arm (UX2).
   *
   * This replaces the 68 px `logo-long.png`. UX_REFINE1 D4 unified that raster at
   * 68 px everywhere, and that was the right fix to the WRONG ARTEFACT: it gave
   * one owner to a mark the branding line had already retired. BRAND1 § 7 and § 4
   * (C+D), BRAND2 § 6 and HOME_ARRIVAL_PRODUCTION_LOCK § 2 all agree — the
   * prominent band mark goes, and a single quiet apple stands where the logo was.
   *
   * What actually changed for the household: the top of every room stopped
   * shouting the company's name at them. A person who has signed in knows whose
   * software this is; a wordmark and a tagline above their own kitchen is the
   * brochure, indoors. The apple stays because a house may be signed — quietly,
   * in its own plaster, at the size of a maker's mark rather than a hoarding.
   *
   * The relief is decorative; the LINK carries the name. Same size in both desktop
   * arms and on mobile, because logo scale is an identity concern and not a
   * side-effect of a page's layout (UI Principle 4).
   */
  const brandMark = (
    <Link
      href="/home"
      aria-label="The Healthy Apples, home"
      className="flex-shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      data-testid="link-workspace-brand"
    >
      <span className="brand-mark" aria-hidden>
        <i className="bm-occ" />
        <i className="bm-rim-up" />
        <i className="bm-rim-lo" />
        <i className="bm-face" />
      </span>
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
      <header className="shell-header w-full">
        <div className={`${maxW} mx-auto px-3 sm:px-6 lg:px-8`}>

          {contextBar ? (
            /* ── Desktop: unified two-row banner ── */
            <div
              className="hidden md:grid gap-x-3"
              style={{ gridTemplateColumns: "auto auto 1fr auto", gridTemplateRows: "52px auto" }}
            >
              {/* Logo — spans both rows; divider self-stretches to full banner height */}
              <div
                className="flex items-center gap-3 shrink-0"
                style={{ gridRow: "1 / 3", gridColumn: "1" }}
              >
                {brandMark}
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
                {companionButton}
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
              className="hidden md:grid items-center min-h-[60px] gap-x-3"
              style={{ gridTemplateColumns: "auto auto 1fr auto" }}
            >
              {/* Col 1: Brand — logo + divider, identical to the two-row arm */}
              <div className="flex items-center gap-3 shrink-0 self-stretch">
                {brandMark}
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
                {companionButton}
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
                {/* UX2 — the phone gets the SAME mark, not a smaller wordmark.
                    UX_REFINE1 § R6 recorded that the mobile arm kept its own
                    `max-h-[28px]` logo and was never re-verified; the mark has one
                    owner now, so there is no second size to drift. On a 390 px
                    header the retired wordmark also cost up to 120 px of width
                    that the room's own name now uses. */}
                {brandMark}
                <h1
                  className="realm-title text-[16px] font-semibold tracking-tight leading-none truncate max-w-[190px]"
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
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    onClick={() => setMobileSearchOpen((v) => !v)}
                    aria-label="Search"
                    data-testid="button-workspace-mobile-search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}

                {companionButton}

                <Link
                  href="/shopping-workspace"
                  className={`relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
                    isBasketActive
                      // UX2 — the phone arm takes the same rest state as the desktop
                      // one, for the same reason and in the same words. Two layout
                      // branches rendering one door must not disagree about how loud
                      // it is (UI Principle 4 — one owning pattern per concern).
                      ? "bg-[hsl(190,28%,86%)] text-[hsl(190,42%,20%)] dark:bg-[hsl(190,18%,19%)] dark:text-[hsl(190,32%,72%)]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

  // A page's header portals up into the shell's slot so the banner spans the
  // full viewport width. The shell's own default header is ALREADY rendered in
  // that position, so it renders in place — portalling it into the slot it sits
  // beside would be a no-op with a round trip.
  return headerSlot && role === "page"
    ? createPortal(headerContent, headerSlot)
    : headerContent;
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
