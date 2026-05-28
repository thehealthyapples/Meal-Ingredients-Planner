import { type ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type PageRealm =
  | "cookbook"
  | "planner"
  | "pantry"
  | "analyser"
  | "diary"
  | "basket"
  | "list"
  | "home";

interface PageHeaderProps {
  title: string;
  icon: ReactNode;
  realm: PageRealm;
  /** Subtitle shown below the title — used by single-row pages. */
  context?: ReactNode;
  /** Right-side actions (always). */
  actions?: ReactNode;
  /**
   * Center column content (triggers 2-row layout).
   * Row 1: Title | center (desktop) | actions
   * Row 2: meta status line
   * On mobile, center renders on its own row below the title.
   */
  center?: ReactNode;
  /** Second row: operational status / context line. Only used when center is provided. */
  meta?: ReactNode;
  /** Full-width control bar rendered below all header content. No forced text styling. */
  controlBar?: ReactNode;
  wide?: boolean;
  titleTestId?: string;
  className?: string;
}

// ── Mobile scroll-collapse hook ───────────────────────────────────────────────
// Auto-collapses after 4 s on mobile (once per mount), then collapses further
// on scroll-down and expands on scroll-up.
// Manual chevron click locks the state until the user clicks chevron again.
// Resets to expanded when scrolled back to top.
function useScrollCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobileRef = useRef(false);
  const manualRef = useRef<boolean | null>(null);
  const lastY = useRef(0);

  // Auto-collapse after 4 s on mobile (fires once; respects manual interaction)
  useEffect(() => {
    const isMobile = () => window.innerWidth < 1024;
    if (!isMobile()) return;
    const timer = setTimeout(() => {
      if (!isMobile()) return;           // window may have been resized
      if (manualRef.current === null) {  // skip if user already acted
        setIsCollapsed(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      isMobileRef.current = mobile;
      if (!mobile) {
        setIsCollapsed(false);
        manualRef.current = null;
      }
    };
    checkMobile();

    const onScroll = () => {
      if (!isMobileRef.current) return;
      const y = window.scrollY;
      if (y < 10) {
        manualRef.current = null;
        setIsCollapsed(false);
        lastY.current = y;
        return;
      }
      const delta = y - lastY.current;
      if (manualRef.current === null) {
        if (delta > 4) setIsCollapsed(true);
        else if (delta < -4) setIsCollapsed(false);
      }
      lastY.current = y;
    };

    window.addEventListener("resize", checkMobile, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleManual = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      manualRef.current = next;
      return next;
    });
  }, []);

  return { isCollapsed, toggleManual };
}

export function PageHeader({
  title,
  icon,
  realm,
  context,
  actions,
  center,
  meta,
  controlBar,
  wide = false,
  titleTestId,
  className,
}: PageHeaderProps) {
  const maxW = wide ? "max-w-screen-2xl" : "max-w-screen-xl";
  const { isCollapsed, toggleManual } = useScrollCollapse();

  const chevronBtn = (
    <button
      onClick={toggleManual}
      className="sm:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 touch-manipulation"
      aria-label={isCollapsed ? "Expand header" : "Collapse header"}
      aria-expanded={!isCollapsed}
    >
      {isCollapsed
        ? <ChevronDown className="h-3.5 w-3.5 opacity-40" />
        : <ChevronUp className="h-3.5 w-3.5 opacity-40" />
      }
    </button>
  );

  return (
    <div
      data-realm={realm}
      className={`page-sticky-header realm-header-bg border-b realm-header-border${className ? ` ${className}` : ""}`}
    >
      <div className={`${maxW} mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4`}>
        {center ? (
          /* ── 2-row operational layout (tabs, workspace) ── */
          <div>
            {/* Row 1: always visible on all viewports */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="min-w-0">
                <h1
                  className="realm-title text-[22px] font-semibold tracking-tight flex items-center gap-2"
                  data-testid={titleTestId}
                >
                  {icon}
                  {title}
                </h1>
                {/* context: desktop only here — mobile version is in collapsible below */}
                {context && (
                  <p className="hidden sm:block text-xs mt-0.5 leading-snug realm-title opacity-60">
                    {context}
                  </p>
                )}
              </div>
              {/* Center: hidden on mobile (appears in collapsible below), visible + centred on sm+ */}
              <div className="hidden sm:block">
                {center}
              </div>
              {/* Right column: actions (both viewports) + chevron (mobile only) */}
              <div className="flex justify-end items-center gap-1.5">
                {actions}
                {chevronBtn}
              </div>
            </div>

            {/* Collapsible: animates on mobile (grid-template-rows trick), always open on desktop */}
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: isCollapsed ? "0fr" : "1fr" }}
            >
              <div className="overflow-hidden">
                {/* context: mobile only (desktop has it in the title column above) */}
                {context && (
                  <p className="sm:hidden text-xs mt-0.5 leading-snug realm-title opacity-60">
                    {context}
                  </p>
                )}
                {/* Center on mobile: rendered below the title row */}
                <div className="mt-2 sm:hidden">
                  {center}
                </div>
                {/* Meta row: both viewports */}
                {meta && (
                  <div className="mt-1.5 pt-1.5 border-t border-border/30 text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap leading-none">
                    {meta}
                  </div>
                )}
                {/* Control bar: both viewports */}
                {controlBar && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    {controlBar}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Single-row layout (no center prop) ── */
          <div>
            {/* Always visible row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1
                  className="realm-title text-[22px] font-semibold tracking-tight flex items-center gap-2"
                  data-testid={titleTestId}
                >
                  {icon}
                  {title}
                </h1>
                {/* context: desktop only here — mobile version is in collapsible below */}
                {context && (
                  <p className="hidden sm:block text-xs mt-0.5 leading-snug realm-title opacity-60">
                    {context}
                  </p>
                )}
              </div>
              {/* Desktop: actions only */}
              {actions && <div className="hidden sm:block shrink-0">{actions}</div>}
              {/* Mobile: actions + chevron (chevron only if there's something to collapse) */}
              {(context || controlBar) && (
                <div className="flex items-center gap-1.5 sm:hidden shrink-0">
                  {actions}
                  {chevronBtn}
                </div>
              )}
              {/* Mobile: actions only, no collapse (nothing to collapse) */}
              {!(context || controlBar) && actions && (
                <div className="sm:hidden shrink-0">{actions}</div>
              )}
            </div>

            {/* Collapsible: mobile animates, desktop always open */}
            {(context || controlBar) && (
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: isCollapsed ? "0fr" : "1fr" }}
              >
                <div className="overflow-hidden">
                  {context && (
                    <p className="sm:hidden text-xs mt-0.5 leading-snug realm-title opacity-60">
                      {context}
                    </p>
                  )}
                  {controlBar && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      {controlBar}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
