import AppleRating from "@/components/ui/apple-rating";

type Props = {
  score: number;
  size?: number;
  className?: string;
};

export default function ScoreBadge({ score, size = 20, className = "" }: Props) {
  return <AppleRating rating={score} size={size} className={className} />;
}
