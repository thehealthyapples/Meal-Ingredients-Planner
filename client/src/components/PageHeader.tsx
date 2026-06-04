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
  /**
   * When true, mobile collapse fully hides the entire header content and shows only
   * a centred down-chevron handle. Desktop is never affected.
   * Only applies to the single-row layout (no `center` prop).
   */
  fullCollapseOnMobile?: boolean;
  /**
   * When true, suppresses auto-collapse and scroll-based collapse.
   * Use while a popover/panel is open so its trigger cannot be hidden mid-interaction.
   * Manual chevron toggle still works.
   */
  collapseDisabled?: boolean;
  wide?: boolean;
  titleTestId?: string;
  className?: string;
}

// ── Mobile scroll-collapse hook ───────────────────────────────────────────────
// Auto-collapses after 4 s on mobile (once per mount), then collapses further
// on scroll-down and expands on scroll-up.
// Manual chevron click locks the state until the user clicks chevron again.
// Resets to expanded when scrolled back to top.
//
// lockAfterCollapse: when true, the auto-collapse is treated as a manual action
// (sets manualRef so scroll cannot undo it), and the at-top reset is disabled.
// Collapse state only changes via explicit chevron tap. Used by fullCollapseOnMobile.
//
// collapseDisabled: when true, suppresses both the auto-timer and scroll-based
// collapse. Stored as a ref so it never resets the 4 s timer. Manual toggle
// still works. Use while a popover/panel is open.
function useScrollCollapse(options?: { lockAfterCollapse?: boolean; collapseDisabled?: boolean }) {
  const lockAfterCollapse = options?.lockAfterCollapse ?? false;
  // Ref so that changes to collapseDisabled never cancel/restart the 4 s timer.
  const collapseDisabledRef = useRef(options?.collapseDisabled ?? false);
  collapseDisabledRef.current = options?.collapseDisabled ?? false;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobileRef = useRef(false);
  const manualRef = useRef<boolean | null>(null);
  const lastY = useRef(0);

  // Auto-collapse after 4 s on mobile (fires once; respects manual interaction)
  useEffect(() => {
    const isMobile = () => window.innerWidth < 1024;
    if (!isMobile()) return;
    const timer = setTimeout(() => {
      if (!isMobile()) return;                    // window may have been resized
      if (collapseDisabledRef.current) return;    // skip while popover/panel is open
      if (manualRef.current === null) {           // skip if user already acted
        setIsCollapsed(true);
        if (lockAfterCollapse) {
          // Treat auto-collapse as manual so scroll cannot re-expand
          manualRef.current = true;
        }
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [lockAfterCollapse]);

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
      if (collapseDisabledRef.current) return;    // skip while popover/panel is open
      const y = window.scrollY;
      if (y < 10) {
        // In lock mode, do not auto-expand at top of page
        if (!lockAfterCollapse) {
          manualRef.current = null;
          setIsCollapsed(false);
        }
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
  }, [lockAfterCollapse]);

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
  fullCollapseOnMobile = false,
  collapseDisabled = false,
  wide = false,
  titleTestId,
  className,
}: PageHeaderProps) {
  const maxW = wide ? "max-w-screen-2xl" : "max-w-screen-xl";
  const { isCollapsed, toggleManual } = useScrollCollapse({ lockAfterCollapse: fullCollapseOnMobile, collapseDisabled });

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
      {center ? (
        <div className={`${maxW} mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4`}>
          {/* ── 2-row operational layout (tabs, workspace) ── */}
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
        </div>
      ) : (
        /* ── Single-row layout (no center prop) ── */
        <>
          {/* Full header: always on desktop; on mobile only when not fully collapsed */}
          <div className={`${maxW} mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4${fullCollapseOnMobile && isCollapsed ? " hidden sm:block" : ""}`}>
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
                {/* Single render of actions for both desktop and mobile.
                    Chevron (sm:hidden) is invisible on desktop so adds no space there.
                    Rendering actions twice caused duplicate Popover portals to mount. */}
                {(actions || (context || controlBar || fullCollapseOnMobile)) && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {actions}
                    {(context || controlBar || fullCollapseOnMobile) && chevronBtn}
                  </div>
                )}
              </div>

              {/* Collapsible: mobile animates, desktop always open.
                  fullCollapseOnMobile: no transition needed — the outer wrapper hides
                  instantly via display:none, so the inner section is always fully open
                  when visible and never partially animated. */}
              {(context || controlBar) && (
                <div
                  className={`grid${fullCollapseOnMobile ? "" : " transition-[grid-template-rows] duration-200 ease-out"}`}
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
          </div>

          {/* Mobile full-collapse: title row matching standard header weight */}
          {fullCollapseOnMobile && isCollapsed && (
            <button
              onClick={toggleManual}
              className="sm:hidden w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors touch-manipulation"
              aria-label="Expand header"
              aria-expanded={false}
            >
              <h1 className="realm-title text-[22px] font-semibold tracking-tight flex items-center gap-2 min-w-0">
                {icon}
                <span className="truncate">{title}</span>
              </h1>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
