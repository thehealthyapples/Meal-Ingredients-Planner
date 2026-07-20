/**
 * EXP1 — THE STENCIL APPLE, for content surfaces.
 *
 * The canonical THA apple as a quiet monochrome outline — the same silhouette
 * the embossed reliefs press into the house's surfaces (`.brand-mark`,
 * `.wall-apple`, `.companion-emblem`), here as a stroke for the places a
 * relief cannot go: empty states and image placeholders, where the legacy
 * coloured raster (`tha-apple.png`) used to stand.
 *
 * One file, one owner (UIA § 10: brand assets are referenced from their
 * canonical source, never copied or restyled per surface). It inherits
 * `currentColor`, so a surface chooses only how quiet it is — never its own
 * apple. It is identity, not evidence: it never sits beside a number or a
 * claim, and it is not the rating apple (`AppleRating` owns scores).
 */
export function AppleStencil({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* the fruit — two shoulders, a soft waist at the base */}
      <path d="M12 7.6c-1.1-1.2-2.8-1.7-4.4-1.1C4.9 7.5 3.6 10.4 4.3 13.6c.7 3.2 2.8 5.9 4.9 6.6.9.3 1.9.2 2.8-.3.9.5 1.9.6 2.8.3 2.1-.7 4.2-3.4 4.9-6.6.7-3.2-.6-6.1-3.3-7.1-1.6-.6-3.3-.1-4.4 1.1Z" />
      {/* the stem */}
      <path d="M12 7.6V5.4c0-1 .5-1.9 1.3-2.4" />
      {/* the leaf */}
      <path d="M13.2 4.6c1.5-1.3 3.5-1.5 4.6-.9-.3 1.6-1.8 2.9-3.5 3-.6 0-1.1-.1-1.5-.4" />
    </svg>
  );
}
