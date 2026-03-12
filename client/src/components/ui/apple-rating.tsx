import thaAppleUrl from "@/assets/icons/tha-apple.png";

type Props = {
  rating: number;
  size?: number;
  className?: string;
};

function HalfApple({ size }: { size: number }) {
  return (
    <div style={{ width: size / 2, height: size, overflow: "hidden", flexShrink: 0, display: "inline-block" }}>
      <img src={thaAppleUrl} width={size} height={size} alt="" draggable={false} style={{ display: "block" }} />
    </div>
  );
}

export default function AppleRating({ rating, size = 25 }: Props) {
  const clamped = Math.max(0, Math.min(5, rating || 0));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped % 1 >= 0.5;
  return (
    <div className="flex items-center" style={{ gap: 2 }} data-testid={`apple-rating-icons-${rating}`}>
      {Array.from({ length: fullCount }).map((_, i) => (
        <img key={i} src={thaAppleUrl} width={size} height={size} alt="" draggable={false} style={{ display: "block", flexShrink: 0 }} />
      ))}
      {hasHalf && <HalfApple size={size} />}
    </div>
  );
}
