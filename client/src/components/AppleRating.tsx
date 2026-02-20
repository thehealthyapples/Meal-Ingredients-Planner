import { useState, useRef, useEffect } from "react";
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

const EXPRESSION_PATHS: Record<number, string> = {
  1: "M13.5 16.5 C14 15, 18 15, 18.5 16.5 M12 12 C12 12.5 11.5 12.5 11.5 12 M20 12 C20 12.5 19.5 12.5 19.5 12",
  2: "M13.5 16 C14.5 15.5 17.5 15.5 18.5 16 M12 12.5 C12 12 11.5 12 11.5 12.5 M20 12.5 C20 12 19.5 12 19.5 12.5",
  3: "M13.5 15.5 L18.5 15.5 M12 12 A0.5 0.5 0 1 1 11.5 12 M20 12 A0.5 0.5 0 1 1 19.5 12",
  4: "M13.5 15.5 C14 16.5 18 16.5 18.5 15.5 M12 12 A0.6 0.6 0 1 1 11.4 12 M20 12 A0.6 0.6 0 1 1 19.4 12",
  5: "M13 15 C14 17 18 17 19 15 M12 11.5 A0.7 0.7 0 1 1 11.3 11.5 M20 11.5 A0.7 0.7 0 1 1 19.3 11.5",
};

function AppleSVG({
  filled,
  colorSet,
  expression,
  hasCape,
  isGlow,
  animDelay,
  size,
}: {
  filled: boolean;
  colorSet: typeof RATING_COLORS[0];
  expression: string;
  hasCape: boolean;
  isGlow: boolean;
  animDelay: number;
  size: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`apple-svg${isGlow ? " apple-glow" : ""}`}
      style={{
        animation: `appleBounce 0.4s ease-out ${animDelay}s both`,
      }}
    >
      {hasCape && filled && (
        <path
          d="M16 3 L21 8 L19 9 L16 5 L13 9 L11 8 Z"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="0.5"
          opacity="0.9"
        />
      )}
      <path
        d="M16 6 C13 6, 8 8, 8 15 C8 22, 12 27, 16 27 C20 27, 24 22, 24 15 C24 8, 19 6, 16 6 Z"
        fill={filled ? colorSet.fill : "none"}
        stroke={filled ? colorSet.stroke : "currentColor"}
        strokeWidth="1.2"
        opacity={filled ? 1 : 0.15}
        className={filled ? "" : "text-muted-foreground"}
      />
      {filled && (
        <>
          <path
            d="M16 4 C16 4, 19 2, 21 3"
            stroke={colorSet.stem}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M17 5 C18 3, 21 2.5, 22 4 C21 3, 19 3.5, 17.5 5.5 Z"
            fill={colorSet.leaf}
            opacity="0.85"
          />
          <path
            d={expression}
            stroke="#1a1a1a"
            strokeWidth="0.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
          <ellipse cx="11" cy="14" rx="1.5" ry="1" fill="white" opacity="0.15" />
        </>
      )}
    </svg>
  );
}

export default function AppleRating({
  rating: rawRating,
  hasCape = false,
  size = "medium",
  showTooltip = true,
  animate = true,
}: AppleRatingProps) {
  const rating = Math.max(1, Math.min(5, Math.round(rawRating || 1)));
  const colorSet = RATING_COLORS[rating - 1];
  const expression = EXPRESSION_PATHS[rating];
  const label = RATING_LABELS[rating - 1];

  const sizeMap = { small: 16, medium: 22, large: 32 };
  const appleSize = sizeMap[size];

  const content = (
    <div
      className="inline-flex items-center gap-0.5 apple-rating-row"
      data-testid={`apple-rating-${rating}`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <AppleSVG
          key={i}
          filled={i < rating}
          colorSet={colorSet}
          expression={expression}
          hasCape={hasCape && i < rating}
          isGlow={rating >= 4 && i < rating}
          animDelay={animate ? i * 0.06 : 0}
          size={appleSize}
        />
      ))}
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
