import type { ReactNode } from "react";

/**
 * RealBookPagePlane — internal visual helper for the Real Cookbook stage.
 *
 * Projects a single caller-owned semantic slot into one measured, non-rectangular,
 * curvature-aware page plane over the photoreal plate. It draws NO book: the clip
 * polygon, gutter mask, mild page tilt and warm ink blend all live in real-book.css,
 * keyed by `variant`. This component only wires the slot into the right plane and
 * exposes the `data-testid` Codex integrates against.
 *
 * Geometry per COOKBOOK_PAGE_PLANE_SPEC.json; treatment per
 * COOKBOOK_PRINT_COMPOSITING_SPEC.md §2–§4. Not part of the public drop-in API —
 * `RealBookStage` is the contract surface.
 */

export type RealBookPlaneVariant =
  | "left"
  | "right"
  | "mobile-collection"
  | "mobile-recipe";

export interface RealBookPagePlaneProps {
  variant: RealBookPlaneVariant;
  /** Stage DOM hook Codex relies on (e.g. "real-book-desktop-collection"). */
  testId?: string;
  children: ReactNode;
}

const VARIANT_CLASS: Record<RealBookPlaneVariant, string> = {
  left: "rb-plane rb-plane--left",
  right: "rb-plane rb-plane--right",
  "mobile-collection": "rb-plane rb-plane--mobile rb-plane--mobile-collection",
  "mobile-recipe": "rb-plane rb-plane--mobile rb-plane--mobile-recipe",
};

export function RealBookPagePlane({
  variant,
  testId,
  children,
}: RealBookPagePlaneProps): JSX.Element {
  return (
    <div className={VARIANT_CLASS[variant]}>
      <div className="rb-plane__safe" data-testid={testId}>
        {children}
      </div>
    </div>
  );
}
