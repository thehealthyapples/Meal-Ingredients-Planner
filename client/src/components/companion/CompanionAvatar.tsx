import { cn } from "@/lib/utils";
import thaAppleBadge from "@/assets/icons/tha-apple-badge.png";

interface CompanionAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CompanionAvatar({ size = "md", className }: CompanionAvatarProps) {
  const sizes = {
    sm: { box: "w-6 h-6", icon: "h-[27px] w-[27px]" },
    md: { box: "w-7 h-7", icon: "h-[30px] w-[30px]" },
    lg: { box: "w-12 h-12", icon: "h-[54px] w-[54px]" },
  }[size];

  return (
    <div
      className={cn(
        sizes.box,
        "rounded-full bg-primary/15 flex items-center justify-center shrink-0 overflow-hidden",
        className
      )}
      data-testid="companion-avatar"
    >
      <img
        src={thaAppleBadge}
        alt="Apple Companion"
        className={cn(sizes.icon, "flex-shrink-0 object-contain")}
      />
    </div>
  );
}
