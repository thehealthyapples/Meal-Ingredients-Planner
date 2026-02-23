import { Apple } from "lucide-react";

interface FiveApplesLogoProps {
  size?: number;
  className?: string;
}

export default function FiveApplesLogo({ size = 24, className = "" }: FiveApplesLogoProps) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label="The Healthy Apples logo"
      data-testid="img-five-apples-logo"
    >
      {[...Array(5)].map((_, i) => (
        <Apple
          key={i}
          className="text-green-500 fill-green-500"
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}
