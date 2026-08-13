/**
 * Real Cookbook — visual lane public surface.
 *
 * The drop-in visual API Codex/ChatGPT integrate against is `RealBookStage` and its
 * types (COOKBOOK_COLLABORATION_CONTRACT.md). `RealBookPagePlane` is an internal
 * visual helper, re-exported only for advanced reuse; it is not the contract surface.
 */
export { RealBookStage } from "./RealBookStage";
export type { RealBookStageProps, RealBookMobilePage } from "./RealBookStage";
export { RealBookPagePlane } from "./RealBookPagePlane";
export type { RealBookPagePlaneProps, RealBookPlaneVariant } from "./RealBookPagePlane";
