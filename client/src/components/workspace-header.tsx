import { type ReactNode, type HTMLAttributes, createContext, useContext, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { Search, ArrowLeft } from "lucide-react";
import { useRegisterPageHeader } from "@/components/layout/shell-slots";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppRealm } from "@/components/nav-bar";

/**
 * Portal slot provided by AppShell. When set, WorkspaceHeader portals its
 * content into the shell's sticky header zone inside the room's scroll flow.
 */
export const WorkspaceHeaderSlotContext = createContext<HTMLElement | null>(null);

/**
 * EXP1 — the chrome state the SHELL owns and every header reads.
 *
 * `stuck` — the household has scrolled the threshold away; the pill compresses
 * to a single strip and takes the room's name for orientation.
 * `roomIdentity` — the room's name and purpose are already on screen at rest
 * (the shell's threshold band, or Home's own welcome), so the pill does not
 * repeat them until it is stuck.
 *
 * One provider (the shell), many readers — never the other way around. A page
 * cannot declare itself stuck, for the same reason it cannot pick its exposure.
 */
export const WorkspaceChromeContext = createContext<{ stuck: boolean; roomIdentity: boolean }>({
  stuck: false,
  roomIdentity: false,
});

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
 * one parent, never to wherever the browser happens to have been.
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
  /** The room's one search — rendered in the pill. There is no second search. */
  search?: WorkspaceSearchConfig;
  /**
   * Override the search column with arbitrary content (e.g. Analyser's
   * search+barcode). Takes precedence over `search` when both are provided.
   */
  centerContent?: ReactNode;
  /** Page-specific actions rendered at the right end of the pill. */
  actions?: ReactNode;
  /** The room's workspace sections: tabs, week nav, filters, mode switchers. */
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
   * renders in place rather than portalling.
   */
  role?: "page" | "shell";
}

/* ── WorkspaceHeader ─────────────────────────────────────────────────────────
 *
 * EXP1 — REBUILT AS THE NORTH STAR'S PILL. The permanent white bar above every
 * room is retired, and with it the top-right utility cluster it carried:
 *
 *   • the brand-mark apple (a second apple placement; the Companion door is
 *     the page's one branded element now — UI §10, one apple)
 *   • the Companion leaf (a second Companion door; the embossed apple button
 *     is the only entry point)
 *   • the basket glyph (its count lives on the navigation's Shopping entry —
 *     global actions belong to the navigation, not floating above the room)
 *   • the profile menu (Household is a room on the shelf; Admin has its own
 *     admin-only entry; Log out lives in the Household room's Account section)
 *
 * What remains is the WORKSPACE's own furniture: the room's one search, its
 * sections, its actions, its Back — in one floating pill at the threshold's
 * fade boundary, compressing to one quiet strip when the household scrolls.
 * The public contract (props) is unchanged: not one room changed its call.
 */
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
  const [, navigate] = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { setRealm } = useAppRealm();
  const { stuck, roomIdentity } = useContext(WorkspaceChromeContext);
  useLayoutEffect(() => { setRealm(realm); }, [realm, setRealm]);
  // NAV1 — tells the shell a page has drawn its own header, so the shell's
  // default one stands down. Only a page registers; the shell's own does not.
  useRegisterPageHeader(role === "page");

  const maxW = wide ? WIDE_MAXW : NARROW_MAXW;

  // The room's name is on screen at rest (threshold band / Home's welcome), so
  // the pill holds it silently until the scroll takes the threshold away.
  const showTitle = stuck || !roomIdentity;

  // A room whose pill would be empty at rest draws nothing at rest — the
  // interface is quieter where the product needs nothing. The sticky zone
  // still exists, so the compressed strip appears the moment it is needed.
  const restEmpty = roomIdentity && !search && !centerContent && !contextBar && !actions && !back;

  /* ── Inline search input (the room's one search) ── */
  const searchInput = search ? (
    <div className="relative w-full max-w-xs sm:max-w-[300px]">
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

  /* ── Back to the hierarchy parent ── */
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

  const headerContent = (
    <div
      className={cn("page-sticky-header", className)}
      data-realm={realm}
      data-stuck={stuck || undefined}
      data-testid="workspace-header"
    >
      <header
        className={cn(
          "w-full transition-[background-color,box-shadow] duration-200",
          stuck ? "shell-header" : "bg-transparent",
        )}
      >
        <div className={`${maxW} mx-auto px-3 sm:px-6 lg:px-8 ws-door-gutter`}>
          {restEmpty && !stuck ? (
            // Nothing at rest — but keep the h1 for the document's structure,
            // silently. The room's visible name is the threshold's.
            <h1 className="sr-only" data-testid={titleTestId}>{title}</h1>
          ) : (
            <div className={cn(!stuck && "my-2 workspace-pill px-3 sm:px-4")}>
              {/* Row 1 — back · title · search · actions */}
              <div className="flex items-center gap-x-2 sm:gap-x-3 min-h-[48px] py-1">
                {backButton}
                <h1
                  className={cn(
                    "realm-title text-[17px] font-semibold tracking-tight leading-none truncate",
                    showTitle ? "shrink-0 max-w-[190px] sm:max-w-none" : "sr-only",
                  )}
                  data-testid={titleTestId}
                >
                  {title}
                </h1>

                {/* The room's one search — inline from sm up, behind its glyph below */}
                {centerContent ? (
                  <div className="hidden sm:flex flex-1 min-w-0 justify-start items-center">{centerContent}</div>
                ) : searchInput ? (
                  <div className="hidden sm:flex flex-1 min-w-0 items-center">{searchInput}</div>
                ) : (
                  <div className="flex-1 min-w-0" />
                )}

                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  {(search || centerContent) && (
                    <button
                      className="sm:hidden flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                      onClick={() => setMobileSearchOpen((v) => !v)}
                      aria-label="Search"
                      data-testid="button-workspace-mobile-search"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  )}
                  {actions && <div className="flex items-center gap-1">{actions}</div>}
                </div>
              </div>

              {/* Mobile search panel (expanded) */}
              {(search || centerContent) && mobileSearchOpen && (
                <div className="sm:hidden pb-2.5 flex items-center gap-2">
                  {centerContent ? (
                    <div className="flex-1 min-w-0">{centerContent}</div>
                  ) : (
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder={search!.placeholder}
                        value={search!.value}
                        onChange={(e) => search!.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { search!.onSubmit(); setMobileSearchOpen(false); }
                          if (e.key === "Escape") setMobileSearchOpen(false);
                        }}
                        autoFocus
                        className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/50 bg-background/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        data-testid="input-workspace-search-mobile"
                      />
                    </div>
                  )}
                  <button
                    className="text-muted-foreground hover:text-foreground text-sm shrink-0 px-1"
                    onClick={() => setMobileSearchOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Row 2 — the room's workspace sections */}
              {contextBar && (
                <div className="flex items-center min-h-[40px] pb-1.5 overflow-x-auto scrollbar-hide">
                  {contextBar}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );

  // A page's header portals up into the shell's sticky zone so the strip spans
  // the room's full width. The shell's own default header is ALREADY rendered
  // in that position, so it renders in place.
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
/*
 * UX3 — THE ROOM STOPS GETTING WIDER.
 *
 * These two strings used to end `3xl:max-w-[1920px]`, so on a large monitor the
 * content column grew to 1920 pixels and on an ultrawide it stayed there — the
 * house's answer to more space was simply more width. UIA § 6 says the opposite,
 * in terms: *"Content never stretches to fill whatever width exists; the column
 * serves reading, not the viewport."* A 1920-pixel measure does not serve reading
 * by any standard; it is a wall of text with the margins removed.
 *
 * The 1920 rung is retired. The column now settles at a calm reading width and
 * everything beyond it becomes MARGIN — which is not empty space, it is the air
 * that makes a large room feel composed instead of stretched.
 */
const WIDE_MAXW = "max-w-screen-2xl";
const NARROW_MAXW = "max-w-screen-xl 2xl:max-w-screen-2xl";

export function pageContainerClass(wide = false): string {
  return `${wide ? WIDE_MAXW : NARROW_MAXW} mx-auto w-full px-4 sm:px-6 lg:px-8 3xl:px-12 pt-4 sm:pt-6`;
}

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  wide?: boolean;
}

export function PageContainer({ wide = false, className, ...rest }: PageContainerProps) {
  return <div className={cn(pageContainerClass(wide), className)} {...rest} />;
}
