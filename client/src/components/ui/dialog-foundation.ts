/**
 * THA Dialog Foundation
 *
 * Establishes a shared semantic language for dialog sizing and presentation.
 * Modeled after useAdaptiveDensity, which introduced compact/comfortable/expanded
 * for layout density, DialogSize and DialogPresentation provide semantic constants
 * for dialog dimensions and visual presentation styles.
 *
 * IMPORTANT: Drawer is a PRESENTATION style, not a SIZE.
 * This distinction is intentional and must be preserved.
 *
 * A dialog is defined by both its size and presentation:
 *   size: how much horizontal space it consumes
 *   presentation: how it enters/exists and interacts with the viewport
 *
 * Example correct usage:
 *   { size: "workspace", presentation: "drawer" }
 *   { size: "compact", presentation: "modal" }
 *
 * Example INCORRECT usage (will cause type errors):
 *   { size: "drawer" }  ❌ drawer is not a DialogSize
 */

/**
 * DialogSize determines the maximum width a dialog can occupy.
 *
 * Compact (420px): Delete confirmations, remove boost, clear basket
 * Comfortable (540px): Simple forms, food knowledge, profile editing
 * Expanded (760px): Scan review, imports, larger forms
 * Workspace (2xl): Meal detail, planner assistant, comparison views
 */
export type DialogSize = "compact" | "comfortable" | "expanded" | "workspace";

/**
 * DialogPresentation determines how the dialog enters, exits, and visually appears.
 *
 * Modal: Standard centered dialog with overlay backdrop. Blocks interaction outside.
 * Drawer: Slides in from the edge (typically right on desktop, bottom on mobile).
 *         Emphasizes content hierarchy and navigation flow.
 * Sheet: Bottom sheet or slide-up panel. Common for mobile-first interactions,
 *        forms, and contextual menus.
 *
 * Presentation is independent of size. A workspace-sized dialog can be presented
 * as either a modal, drawer, or sheet.
 */
export type DialogPresentation = "modal" | "drawer" | "sheet";

/**
 * DialogDefinition pairs a size with a presentation style.
 * Use this when you need to capture both dimensions of a dialog config.
 *
 * Example:
 *   const confirmConfig: DialogDefinition = {
 *     size: "compact",
 *     presentation: "modal"
 *   };
 */
export interface DialogDefinition {
  size: DialogSize;
  presentation: DialogPresentation;
}

/**
 * Maps a DialogSize to its Tailwind width class.
 * Returns only the width class; does not include responsive prefixes.
 *
 * compact     → sm:max-w-[420px]
 * comfortable → sm:max-w-[540px]
 * expanded    → sm:max-w-[760px]
 * workspace   → max-w-2xl (512px on sm and up)
 *
 * Note: workspace uses max-w-2xl (Tailwind standard) rather than a custom width,
 * to align with the existing design system and provide more breathing room.
 */
export function getDialogWidthClass(size: DialogSize): string {
  switch (size) {
    case "compact":
      return "sm:max-w-[420px]";
    case "comfortable":
      return "sm:max-w-[540px]";
    case "expanded":
      return "sm:max-w-[760px]";
    case "workspace":
      return "max-w-2xl";
  }
}

/**
 * Maps a DialogSize to its numeric width in pixels (desktop/tablet breakpoint).
 * Useful for calculations, comparisons, or layout logic that needs actual values.
 *
 * compact     → 420px
 * comfortable → 540px
 * expanded    → 760px
 * workspace   → 768px (max-w-2xl = 2rem * 384px = 768px)
 */
export function getDialogWidthPixels(size: DialogSize): number {
  switch (size) {
    case "compact":
      return 420;
    case "comfortable":
      return 540;
    case "expanded":
      return 760;
    case "workspace":
      return 768;
  }
}

/**
 * Returns presentation-specific CSS classes for a DialogContent.
 *
 * modal   → "" (standard centred dialog; ui/dialog.tsx's base classes are it)
 * drawer  → "" (handled by the Drawer component, not DialogSize)
 * sheet   → full-viewport sheet on mobile, standard centred modal from sm: up.
 *
 * PX1-W1 (fnd-px-dialog-foundation-is-noop): the sheet presentation was fully
 * specified in prose and returned "" — adopting the foundation changed nothing.
 * The classes below are the ones camera-modal.tsx proved in production (it now
 * consumes this function): w-full/max-w-full + h-[100dvh] fills the phone
 * viewport (100dvh tracks browser chrome), rounded-none/border-0 removes the
 * card chrome at full bleed, and everything reverts at sm:. The max-h pair
 * overrides ui/dialog.tsx's base clamp on mobile and restores it on desktop.
 * Width still belongs to getDialogWidthClass — compose it after this string
 * and twMerge lets the size's sm:max-w-* win over the default sm:max-w-lg.
 */
export function getDialogPresentationClass(
  presentation: DialogPresentation
): string {
  switch (presentation) {
    case "modal":
      return "";
    case "drawer":
      return "";
    case "sheet":
      return "flex flex-col w-full max-w-full sm:max-w-lg h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[calc(100dvh-2rem)] rounded-none sm:rounded-lg border-0 sm:border";
  }
}

/**
 * Returns a human-readable label for a DialogSize.
 * Useful for debugging, logging, or displaying in UI.
 */
export function getDialogSizeLabel(size: DialogSize): string {
  switch (size) {
    case "compact":
      return "Compact (420px)";
    case "comfortable":
      return "Comfortable (540px)";
    case "expanded":
      return "Expanded (760px)";
    case "workspace":
      return "Workspace (768px)";
  }
}

/**
 * Returns a human-readable label for a DialogPresentation.
 * Useful for debugging, logging, or displaying in UI.
 */
export function getDialogPresentationLabel(
  presentation: DialogPresentation
): string {
  switch (presentation) {
    case "modal":
      return "Modal";
    case "drawer":
      return "Drawer";
    case "sheet":
      return "Sheet";
  }
}

/**
 * OPTIONAL: Predefined dialog configurations for common use cases.
 *
 * These presets capture both size and presentation together, providing
 * semantic names for common dialog patterns. They are NOT used by any
 * existing dialogs; they are exported for potential future use in migrations.
 *
 * When migrating a dialog to use this foundation, choose the preset that best
 * describes the dialog's semantic purpose, or define a custom DialogDefinition.
 */
export const DIALOG_PRESETS = {
  // Compact modal: Yes/No confirmations, delete warnings
  confirmCompact: { size: "compact", presentation: "modal" } as const,

  // Comfortable modal: Standard forms, settings, simple workflows
  formComfortable: { size: "comfortable", presentation: "modal" } as const,

  // Expanded modal: Complex forms, detailed editing, large content
  formExpanded: { size: "expanded", presentation: "modal" } as const,

  // Workspace modal: Full-screen-like dialogs, detailed views, complex workflows
  workspaceModal: { size: "workspace", presentation: "modal" } as const,

  // Workspace drawer: Side panel for navigation, filters, or detailed inspection
  workspaceDrawer: { size: "workspace", presentation: "drawer" } as const,

  // Comfortable sheet: Mobile-friendly forms, bottom sheets, contextual menus
  formSheet: { size: "comfortable", presentation: "sheet" } as const,
} as const;

/**
 * Type-safe way to access preset values while maintaining full type safety.
 *
 * Example:
 *   const config = DIALOG_PRESETS.confirmCompact satisfies DialogDefinition;
 */
export type DialogPreset = (typeof DIALOG_PRESETS)[keyof typeof DIALOG_PRESETS];
