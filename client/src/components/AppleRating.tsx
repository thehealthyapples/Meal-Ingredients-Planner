import thaAppleUrl from "@/assets/icons/tha-apple.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppleRatingProps {
  rating: number;
  hasCape?: boolean;
  size?: "small" | "medium" | "large";
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

const SCALE = 1.5;

function AppleIcon({ px }: { px: number }) {
  const rendered = px * SCALE;
  const offset = -((rendered - px) / 2);
  return (
    <div style={{ width: px, height: px, overflow: "hidden", flexShrink: 0, display: "inline-block" }}>
      <img
        src={thaAppleUrl}
        width={rendered}
        height={rendered}
        alt=""
        draggable={false}
        style={{ display: "block", marginLeft: offset, marginTop: offset }}
      />
    </div>
  );
}

function HalfApple({ px }: { px: number }) {
  const rendered = px * SCALE;
  const offset = -((rendered - px) / 2);
  return (
    <div style={{ width: px / 2, height: px, overflow: "hidden", flexShrink: 0, display: "inline-block" }}>
      <img
        src={thaAppleUrl}
        width={rendered}
        height={rendered}
        alt=""
        draggable={false}
        style={{ display: "block", marginLeft: offset, marginTop: offset }}
      />
    </div>
  );
}

export default function AppleRating({
  rating: rawRating,
  size = "medium",
  showTooltip = true,
  animate = true,
}: AppleRatingProps) {
  const clamped = Math.max(1, Math.min(5, rawRating || 1));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped % 1 >= 0.5;
  const labelIndex = Math.min(4, Math.max(0, Math.round(clamped) - 1));
  const label = RATING_LABELS[labelIndex];
  const px = sizeMap[size] ?? 20;

  const content = (
    <div
      className="inline-flex items-center"
      style={{ gap: 0, ...(animate ? { animation: "appleBounce 0.4s ease-out both" } : {}) }}
      data-testid={`apple-rating-${Math.round(clamped)}`}
    >
      {Array.from({ length: fullCount }).map((_, i) => (
        <AppleIcon key={i} px={px} />
      ))}
      {hasHalf && <HalfApple px={px} />}
    </div>
  );

  if (!showTooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <span>SMP Rating: {Math.round(clamped)} — {label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export { AppleRating, RATING_LABELS, RATING_COLORS };
