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

export default function AppleRating({
  rating: rawRating,
  size = "medium",
  sizePx: sizePxProp,
  showTooltip = true,
  animate = true,
  additiveContext,
}: AppleRatingProps) {
  const clamped = Math.max(1, Math.min(5, rawRating || 1));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped % 1 >= 0.5;
  const labelIndex = Math.min(4, Math.max(0, Math.round(clamped) - 1));
  const label = RATING_LABELS[labelIndex];
  const px = sizePxProp ?? sizeMap[size] ?? 20;
  const overlap = Math.round(px * OVERLAP);

  const content = (
    <div
      className="inline-flex items-center"
      style={animate ? { animation: "appleBounce 0.4s ease-out both" } : undefined}
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

  if (!showTooltip) return content;

  const tooltipLines: string[] = [`THA Score: ${Math.round(clamped)}/5 — ${label}`];

  if (additiveContext) {
    const { total, regulatory, topType } = additiveContext;
    if (total === 0) {
      tooltipLines.push("No additives detected");
    } else {
      const typeHint = topType ? ` (${topType})` : "";
      const discretionary = total - regulatory;
      if (discretionary > 0 && regulatory > 0) {
        tooltipLines.push(
          `${discretionary} discretionary additive${discretionary !== 1 ? "s" : ""}${typeHint} · ${regulatory} regulatory`,
        );
      } else if (regulatory === total) {
        tooltipLines.push(
          `${total} regulatory additive${total !== 1 ? "s" : ""} (e.g. flour fortification)`,
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
      <TooltipContent side="top" className="text-xs max-w-[220px]">
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
