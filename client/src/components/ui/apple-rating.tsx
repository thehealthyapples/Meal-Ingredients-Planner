import thaAppleUrl from "@/assets/icons/tha-apple.png";

type Props = {
  rating: number;
  size?: number;
  className?: string;
};

const SCALE = 1.5;

function AppleIcon({ size }: { size: number }) {
  const rendered = size * SCALE;
  const offset = -((rendered - size) / 2);
  return (
    <div style={{ width: size, height: size, overflow: "hidden", flexShrink: 0, display: "inline-block" }}>
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

function HalfApple({ size }: { size: number }) {
  const rendered = size * SCALE;
  const offset = -((rendered - size) / 2);
  return (
    <div style={{ width: size / 2, height: size, overflow: "hidden", flexShrink: 0, display: "inline-block" }}>
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

export default function AppleRating({ rating, size = 25 }: Props) {
  const clamped = Math.max(0, Math.min(5, rating || 0));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped % 1 >= 0.5;
  return (
    <div className="flex items-center" style={{ gap: 0 }} data-testid={`apple-rating-icons-${rating}`}>
      {Array.from({ length: fullCount }).map((_, i) => (
        <AppleIcon key={i} size={size} />
      ))}
      {hasHalf && <HalfApple size={size} />}
    </div>
  );
}
