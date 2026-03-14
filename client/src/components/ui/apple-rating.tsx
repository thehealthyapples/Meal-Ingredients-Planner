import thaAppleUrl from "@/assets/icons/tha-apple.png";

type Props = {
  rating: number;
  size?: number;
  className?: string;
  isOrganic?: boolean;
};

const OVERLAP = 0.38;

export default function AppleRating({ rating, size = 25, isOrganic = false }: Props) {
  const clamped = Math.max(0, Math.min(5, rating || 0));
  const fullCount = Math.floor(clamped);
  const hasHalf = clamped % 1 >= 0.5;
  const overlap = Math.round(size * OVERLAP);
  const showOrg = isOrganic && clamped >= 5;

  return (
    <div className="inline-flex items-center gap-1" data-testid={`apple-rating-icons-${rating}`}>
      <div className="inline-flex items-center">
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
      {showOrg && (
        <span
          className="inline-flex items-center rounded px-1 text-white font-semibold leading-none"
          style={{ fontSize: Math.max(8, Math.round(size * 0.42)), backgroundColor: "hsl(90,40%,38%)", paddingTop: 2, paddingBottom: 2 }}
          title="Organic"
        >
          Org
        </span>
      )}
    </div>
  );
}
