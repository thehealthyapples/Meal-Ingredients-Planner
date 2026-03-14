import AppleRating from "@/components/ui/apple-rating";

type Props = {
  score: number;
  size?: number;
  className?: string;
  isOrganic?: boolean;
};

export default function ScoreBadge({ score, size = 25, className = "", isOrganic = false }: Props) {
  return <AppleRating rating={score} size={size} className={className} isOrganic={isOrganic} />;
}
