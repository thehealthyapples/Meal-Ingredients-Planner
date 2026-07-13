// PX1-W4.10 — the canonical overlay container (fnd-px-overlay-container-arbitrary).
//
// PX1 found four overlay containers chosen per-FILE, not per-interaction: Dialog
// (30 files), Drawer (11), Sheet (3), plus hand-rolled fixed panels — the same
// decision arriving from the bottom, the side, or the middle depending on which
// realm asked, with the dismissal gesture changing along the way. Names lied:
// `WorkspaceAnalyserSheet` is a Drawer; `day-view-drawer` was a Dialog half the
// time.
//
// This is the ONE owner of that decision, promoted from the pattern
// `day-view-drawer.tsx` had already proven: **bottom sheet on a phone, centred
// dialog on a desktop** — decided by the canonical breakpoint
// (`useIsMobile`, PX1-W2.4), never by the calling file's taste. Focus trap,
// Escape, scroll-lock and focus return arrive from Radix in both presentations.
//
// New overlays compose this. Existing Dialog/Drawer call sites migrate here as
// they are touched; a surface with a genuine reason to differ (e.g. the camera's
// full-bleed capture sheet) states it at the call site by not using Overlay.

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-adaptive-density";
import { cn } from "@/lib/utils";

interface OverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The overlay's accessible name. Required — every overlay announces itself. */
  title: ReactNode;
  /** Optional supporting sentence under the title (desktop dialog only). */
  description?: ReactNode;
  /** Replaces the standard header row entirely (title still names the overlay). */
  header?: ReactNode;
  children: ReactNode;
  /** Extra classes for the content container of BOTH presentations. */
  className?: string;
  /** Max width of the desktop dialog; the mobile sheet is always full-width. */
  desktopClassName?: string;
  "data-testid"?: string;
}

export function Overlay({
  open,
  onOpenChange,
  title,
  description,
  header,
  children,
  className,
  desktopClassName = "sm:max-w-lg",
  "data-testid": testId,
}: OverlayProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent className={cn("flex flex-col max-h-[85vh]", className)} data-testid={testId}>
          {header ?? (
            <div className="px-4 pt-1 pb-3 shrink-0">
              <DrawerTitle className="text-sm font-semibold">{title}</DrawerTitle>
            </div>
          )}
          <div
            className="flex-1 overflow-y-auto min-h-0 px-4 pt-2 space-y-4"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(desktopClassName, className)} data-testid={testId}>
        {header ?? (
          <DialogHeader>
            <DialogTitle className="text-base">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
