import type { ReactNode } from "react";

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

  return (
    <div
      data-realm={realm}
      className={`page-sticky-header realm-header-bg border-b realm-header-border${className ? ` ${className}` : ""}`}
    >
      <div className={`${maxW} mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4`}>
        {center ? (
          /* ── 2-row operational layout (Basket workspace) ── */
          <div>
            {/* Row 1: Title | Center (desktop) | Actions */}
            <div className="flex items-center gap-3">
              <div className="min-w-0 shrink-0">
                <h1
                  className="realm-title text-2xl font-semibold tracking-tight flex items-center gap-2"
                  data-testid={titleTestId}
                >
                  {icon}
                  {title}
                </h1>
              </div>
              {/* Center: hidden on mobile, visible + auto-centered on sm+ */}
              <div className="hidden sm:flex flex-1 justify-center">
                {center}
              </div>
              {/* Actions: pushed to far right */}
              {actions && (
                <div className="shrink-0 ml-auto sm:ml-0">
                  {actions}
                </div>
              )}
            </div>
            {/* Center on mobile: renders below title row */}
            <div className="mt-2 sm:hidden">
              {center}
            </div>
            {/* Row 2: Operational status / context */}
            {meta && (
              <div className="mt-1.5 pt-1.5 border-t border-border/30 text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap leading-none">
                {meta}
              </div>
            )}
            {/* Row 3: Control bar (filters, sort, stage controls) */}
            {controlBar && (
              <div className="mt-2 pt-2 border-t border-border/30">
                {controlBar}
              </div>
            )}
          </div>
        ) : (
          /* ── Original single-row layout (all other pages) ── */
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1
                className="realm-title text-2xl font-semibold tracking-tight flex items-center gap-2"
                data-testid={titleTestId}
              >
                {icon}
                {title}
              </h1>
              {context && (
                <p className="text-sm mt-1 leading-snug realm-title opacity-60">
                  {context}
                </p>
              )}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
