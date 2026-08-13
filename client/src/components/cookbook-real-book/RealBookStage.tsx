import type React from "react";

import { RealBookPagePlane } from "./RealBookPagePlane";
import "./real-book.css";

/**
 * RealBookStage — the Real Cookbook physical-book stage (Claude-owned visual lane).
 *
 * A reusable, tested, photoreal book surface. It fits the approved raster plate,
 * projects two caller-owned semantic slots into measured curvature-aware page planes,
 * and blends their ink into the paper so live content reads as print. It owns ONLY
 * visual composition — no data, no actions, no route, no Companion, no planner.
 *
 * Contract: COOKBOOK_COLLABORATION_CONTRACT.md → "Drop-in visual API". Geometry:
 * COOKBOOK_PAGE_PLANE_SPEC.json. Treatment: COOKBOOK_PRINT_COMPOSITING_SPEC.md.
 * Approved desktop North Star: Revision 01 (heading scale/space + bottom-left Search).
 *
 * Desktop: the BLANK photoreal plate is the live base; the full two-page spread fits
 * the viewport minus the reserved bottom nav. Mobile: one physical page at a time on
 * a one-page crop of that same blank plate, with accessible page-turn controls and only the active
 * slot mounted. Slot CONTENT stays caller-owned; the stage owns only where it prints.
 */

export type RealBookMobilePage = "collection" | "recipe";

export interface RealBookStageProps {
  collectionPage: React.ReactNode;
  recipePage: React.ReactNode;
  mobilePage: RealBookMobilePage;
  onMobilePageChange: (page: RealBookMobilePage) => void;
  children?: never;
}

/**
 * Plates live in client/public and are served from the site root by Vite. The desktop
 * base is the BLANK plate; the populated spread candidate is only an accepted look
 * target, never a baked live surface. Mobile uses the two physical page plates.
 */
const DESKTOP_PLATE = "/images/cookbook/concept/open-family-cookbook-candidate.png";


export function RealBookStage({
  collectionPage,
  recipePage,
  mobilePage,
  onMobilePageChange,
}: RealBookStageProps): JSX.Element {
  const onCollection = mobilePage === "collection";
  return (
    <div className="rb-root" data-testid="real-book-stage">
      {/* ---- Desktop: one complete two-page spread ---------------------- */}
      <div className="rb-desktop">
        <div className="rb-stage">
          <img className="rb-plate" src={DESKTOP_PLATE} alt="" role="presentation" draggable={false} />
          <RealBookPagePlane variant="left" testId="real-book-desktop-collection">
            {collectionPage}
          </RealBookPagePlane>
          <RealBookPagePlane variant="right" testId="real-book-desktop-recipe">
            {recipePage}
          </RealBookPagePlane>
        </div>
      </div>

      {/* ---- Mobile: one physical page at a time ------------------------ */}
      <div className="rb-mobile">
        <div className={`rb-mobile__stage rb-mobile__stage--${mobilePage}`} data-testid="real-book-mobile-page" key={mobilePage}>
          <img className="rb-plate rb-mobile__plate" src={DESKTOP_PLATE} alt="" role="presentation" draggable={false} />
          {onCollection ? (
            <RealBookPagePlane variant="mobile-collection">{collectionPage}</RealBookPagePlane>
          ) : (
            <RealBookPagePlane variant="mobile-recipe">{recipePage}</RealBookPagePlane>
          )}
        </div>

        <button
          type="button"
          className="rb-pageturn rb-pageturn--back"
          aria-label="Turn to the collection page"
          disabled={onCollection}
          onClick={() => onMobilePageChange("collection")}
        >
          ‹ Collection
        </button>
        <button
          type="button"
          className="rb-pageturn rb-pageturn--forward"
          aria-label="Turn to the recipe page"
          disabled={!onCollection}
          onClick={() => onMobilePageChange("recipe")}
        >
          Recipe ›
        </button>
      </div>
    </div>
  );
}
