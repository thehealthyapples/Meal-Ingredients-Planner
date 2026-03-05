import thaAppleUrl from "@/assets/icons/tha-apple.svg?url";

type Props = {
  size?: number;
  className?: string;
};

export default function ThaAppleIcon({ size = 24, className = "" }: Props) {
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
