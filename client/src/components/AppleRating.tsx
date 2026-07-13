import thaAppleUrl from "@/assets/icons/tha-apple.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdditiveContext {
  /** Total DB-matched additives (does not include soft UPF terms). */
  total: number;
  /** How many of those are regulatory (e.g. flour fortification). */
  regulatory: number;
  /** Most common additive type for display hint (e.g. "preservative"). */
  topType?: string;
}

interface AppleRatingProps {
  rating: number;
  size?: "small" | "medium" | "large";
  sizePx?: number;
  showTooltip?: boolean;
  animate?: boolean;
  /** When provided, the tooltip includes an additive breakdown line. */
  additiveContext?: AdditiveContext;
  className?: string;
  /**
   * The mark as illustration, not information: rendered `aria-hidden`, never named,
   * never tooltipped. For the one place the apples appear inside a decorative
   * illustration (KitchenToBasketVisual) rather than as a food's actual score —
   * announcing a score there would fabricate one (EXP §12).
   */
  decorative?: boolean;
}

const RATING_LABELS = [
  "Ultra-Processed",
  "Below Average",
  "Average",
  "Good",
  "Elite Whole Food",
];

const RATING_COLORS = [
  { fill: "#ef4444", stroke: "#dc2626", leaf: "#92400e", stem: "#78350f" },
  { fill: "#f97316", stroke: "#ea580c", leaf: "#65a30d", stem: "#78350f" },
  { fill: "#eab308", stroke: "#ca8a04", leaf: "#65a30d", stem: "#78350f" },
  { fill: "#22c55e", stroke: "#16a34a", leaf: "#15803d", stem: "#78350f" },
  { fill: "#10b981", stroke: "#059669", leaf: "#047857", stem: "#365314" },
];

const sizeMap: Record<string, number> = { small: 35, medium: 50, large: 70 };
const OVERLAP = 0.38;

/**
 * The THA score in words. PX1-W0 (fnd-px-apple-score-inaudible).
 *
 * This sentence already existed — at the tooltip below — and was the ONLY text
 * equivalent of the apple score anywhere in the product. It was delivered through a
 * hover tooltip on a non-focusable `<div>`, so it was unreachable by keyboard and
 * invisible to a screen reader, while the score itself was encoded purely as the
 * NUMBER of apple `<img>`s, every one of them `alt=""`.
 *
 * A blind or low-vision household member therefore could not learn whether any food
 * was good — the one question THA exists to answer.
 *
 * PX1-W4.12 collapsed the mark's rival entry points (`ui/apple-rating.tsx` and the
 * `ui/score-badge.tsx` alias) into this component: one apple, one name, one sentence.
 */
export function appleScoreLabel(rating: number): string {
  const clamped = Math.max(1, Math.min(5, rating || 1));
  const rounded = Math.round(clamped);
  const label = RATING_LABELS[Math.min(4, Math.max(0, rounded - 1))];
  return `THA Score: ${rounded} out of 5 — ${label}`;
}

export default function AppleRating({
  rating: rawRating,
  size = "medium",
  sizePx: sizePxProp,
  showTooltip = true,
  animate = true,
  additiveContext,
  className,
  decorative = false,
}: AppleRatingProps) {
  // No score is SILENCE, not a fabricated one (EXP §12). The retired
  // `ui/apple-rating.tsx` rendered zero apples for a 0 rating while still
  // announcing "THA Score: 1 out of 5" to a screen reader — an unscored item
  // read aloud as Ultra-Processed. One owner, one truth: unscored renders nothing.
  if (!decorative && (!rawRating || rawRating < 0.5)) return null;

  const clamped = Math.max(1, Math.min(5, rawRating || 1));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped % 1 >= 0.5;
  const px = sizePxProp ?? sizeMap[size] ?? 20;
  const overlap = Math.round(px * OVERLAP);

  const scoreLabel = appleScoreLabel(clamped);

  const content = (
    // `role="img"` + `aria-label` make the apples ONE named mark rather than a run of
    // decorative images whose count carried the meaning. The individual `<img alt="">`
    // are correct: they are the parts, and the parts are decorative once the whole is
    // named (UIA §10, §15 — "meaningful marks are named"; EXP §16).
    <div
      className={className ? `inline-flex items-center ${className}` : "inline-flex items-center"}
      style={animate ? { animation: "appleBounce 0.4s ease-out both" } : undefined}
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "img", "aria-label": scoreLabel })}
      data-testid={`apple-rating-${Math.round(clamped)}`}
    >
      {Array.from({ length: fullCount }).map((_, i) => (
        <img
          key={i}
          src={thaAppleUrl}
          width={px}
          height={px}
          alt=""
          draggable={false}
          style={{ display: "block", flexShrink: 0, marginLeft: i === 0 ? 0 : -overlap }}
        />
      ))}
      {hasHalf && (
        <div style={{ width: px / 2, height: px, overflow: "hidden", flexShrink: 0, marginLeft: fullCount === 0 ? 0 : -overlap }}>
          <img src={thaAppleUrl} width={px} height={px} alt="" draggable={false} style={{ display: "block" }} />
        </div>
      )}
    </div>
  );

  if (!showTooltip || decorative) return content;

  // The tooltip and the accessible name are now the SAME sentence, from the same
  // function. They were never allowed to be two.
  const tooltipLines: string[] = [scoreLabel];

  if (additiveContext) {
    const { total, regulatory, topType } = additiveContext;
    if (total === 0) {
      tooltipLines.push("No additives detected");
    } else {
      const typeHint = topType ? ` (${topType})` : "";
      const discretionary = total - regulatory;
      if (discretionary > 0 && regulatory > 0) {
        tooltipLines.push(
          `${discretionary} discretionary additive${discretionary !== 1 ? "s" : ""}${typeHint} · ${regulatory} mandatory fortification`,
        );
      } else if (regulatory === total) {
        tooltipLines.push(
          `${total} mandatory fortification additive${total !== 1 ? "s" : ""} (e.g. added iron or folic acid)`,
        );
      } else {
        tooltipLines.push(
          `${total} additive${total !== 1 ? "s" : ""}${typeHint}`,
        );
      }
      if (regulatory > 0) {
        tooltipLines.push("Regulatory additives still count toward score");
      }
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" align="end" sideOffset={8} className="text-xs max-w-[220px]">
        {tooltipLines.map((line, i) => (
          <p key={i} className={i === 0 ? "font-medium" : "text-muted-foreground mt-0.5"}>
            {line}
          </p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

export { AppleRating, RATING_LABELS, RATING_COLORS };
