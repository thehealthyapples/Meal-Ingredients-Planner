import ThaAppleIcon from "@/components/icons/ThaAppleIcon";

type Props = {
  rating: number;
  size?: number;
};

export default function AppleRating({ rating, size = 25 }: Props) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-1" data-testid={`apple-rating-icons-${clamped}`}>
      {Array.from({ length: clamped }).map((_, i) => (
        <ThaAppleIcon key={i} size={size} />
      ))}
    </div>
  );
}
