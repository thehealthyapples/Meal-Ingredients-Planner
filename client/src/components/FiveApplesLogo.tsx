interface FiveApplesLogoProps {
  size?: number;
  className?: string;
}

export default function FiveApplesLogo({ size = 24, className = "" }: FiveApplesLogoProps) {
  return (
    <img
      src="/apple-logo.png"
      alt="The Healthy Apples logo"
      style={{ height: size, width: "auto" }}
      className={`object-contain ${className}`}
      draggable={false}
      data-testid="img-five-apples-logo"
    />
  );
}
