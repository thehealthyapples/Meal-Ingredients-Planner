import thaAppleUrl from "@/assets/icons/tha-apple.png";

type Props = {
  size?: number;
  className?: string;
};

export default function ThaAppleIcon({ size = 25, className = "" }: Props) {
  return (
    <img
      src={thaAppleUrl}
      width={size}
      height={size}
      className={className}
      alt="Healthy Apple"
      draggable="false"
      data-testid="icon-tha-apple"
    />
  );
}
