import thaAppleUrl from "@/assets/icons/tha-apple.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppleRatingProps {
  rating: number;
  size?: "small" | "medium" | "large";
  sizePx?: number;
  showTooltip?: boolean;
  animate?: boolean;
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <span>THA Score: {Math.round(clamped)}/5 — {label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export { AppleRating, RATING_LABELS, RATING_COLORS };
