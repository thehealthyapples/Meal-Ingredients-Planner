import thaAppleUrl from "@/assets/icons/tha-apple.png";
import { appleScoreLabel } from "@/components/AppleRating";

// PX1-W0 (fnd-px-apple-score-inaudible). This is the entry point the score reaches
// the household through on the shopping list, the workspace, products, the analyser,
// the dashboard and the product picker — 15+ call sites, most of them via
// `ScoreBadge`. The score was encoded as the NUMBER of apple images, every one
// `alt=""`, with no `aria-label`, no `role` and no text anywhere in the file: THA's
// central judgement of a food was, to a screen reader, silence.
//
// The sentence it now speaks is not a new one. It comes from `appleScoreLabel` in
// `components/AppleRating.tsx` — the mark's other implementation, and the one that
// already held `RATING_LABELS` and the text equivalent. Importing it rather than
// re-writing it means the two entry points cannot drift into saying different things
// about the same score, and it leaves the collapse of the three rivals to PX1-W4.12
// with the vocabulary already shared.

type Props = {
  rating: number;
  size?: number;
  className?: string;
};

const OVERLAP = 0.38;

export default function AppleRating({ rating, size = 25, className }: Props) {
  const clamped = Math.max(0, Math.min(5, rating || 0));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped % 1 >= 0.5;
  const overlap = Math.round(size * OVERLAP);

  return (
    <div
      className={`inline-flex items-center gap-1 align-middle${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={appleScoreLabel(clamped)}
      data-testid={`apple-rating-icons-${rating}`}
    >
      <div className="inline-flex items-center" aria-hidden="true">
        {Array.from({ length: fullCount }).map((_, i) => (
          <img
            key={i}
            src={thaAppleUrl}
            width={size}
            height={size}
            alt=""
            draggable={false}
            style={{ display: "block", flexShrink: 0, marginLeft: i === 0 ? 0 : -overlap }}
          />
        ))}
        {hasHalf && (
          <div style={{ width: size / 2, height: size, overflow: "hidden", flexShrink: 0, marginLeft: fullCount === 0 ? 0 : -overlap }}>
            <img src={thaAppleUrl} width={size} height={size} alt="" draggable={false} style={{ display: "block" }} />
          </div>
        )}
      </div>
    </div>
  );
}
