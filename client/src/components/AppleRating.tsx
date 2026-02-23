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

export default function AppleRating({
  rating: rawRating,
  size = "medium",
  showTooltip = true,
  animate = true,
}: AppleRatingProps) {
  const rating = Math.max(1, Math.min(5, Math.round(rawRating || 1)));
  const label = RATING_LABELS[rating - 1];

  const sizeMap = { small: 28, medium: 36, large: 56 };
  const imgHeight = sizeMap[size];

  const content = (
    <div
      className="inline-flex items-center apple-rating-row"
      data-testid={`apple-rating-${rating}`}
      style={animate ? { animation: "appleBounce 0.4s ease-out both" } : undefined}
    >
      <img
        src={`/apple-rating-${rating}.png`}
        alt={`${rating} Apple${rating > 1 ? "s" : ""} - ${label}`}
        style={{ height: imgHeight, width: "auto" }}
        className="object-contain"
        draggable={false}
      />
    </div>
  );

  if (!showTooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <span>SMP Rating: {rating} — {label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export { AppleRating, RATING_LABELS, RATING_COLORS };
