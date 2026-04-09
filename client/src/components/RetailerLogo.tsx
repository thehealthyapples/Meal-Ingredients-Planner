import logoTesco from "@/assets/Retailers/tesco-logo.svg";
import logoAsda from "@/assets/Retailers/ASDA Logo.avif";
import logoSainsburys from "@/assets/Retailers/sainsburys.svg";
import logoMorrisons from "@/assets/Retailers/morrisons-logo.9b4bf210.svg";
import logoOcado from "@/assets/Retailers/ocado.png";
import logoAldi from "@/assets/Retailers/aldi.jpg";
import logoLidl from "@/assets/Retailers/lidl-shop-great-britain-453962.svg";
import logoWaitrose from "@/assets/Retailers/Waitrose-Logo.wine.png";

const LOGOS: Record<string, string> = {
  "tesco":       logoTesco,
  "sainsbury's": logoSainsburys,
  "sainsburys":  logoSainsburys,
  "morrisons":   logoMorrisons,
  "ocado":       logoOcado,
  "waitrose":    logoWaitrose,
  "asda":        logoAsda,
  "aldi":        logoAldi,
  "lidl":        logoLidl,
};

interface RetailerLogoProps {
  name: string;
  /** Tailwind height class applied to the <img>. Default: "h-6" */
  size?: "h-4" | "h-5" | "h-6" | "h-7" | "h-8" | "h-10";
  className?: string;
}

/**
 * Renders a retailer logo on a white pill/square background with uniform sizing.
 * Falls back to a text initial if the retailer has no matching asset.
 */
export default function RetailerLogo({ name, size = "h-6", className = "" }: RetailerLogoProps) {
  const logo = LOGOS[name.toLowerCase()];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-white border border-black/[0.07] shadow-sm px-2 ${className}`}
      style={{ minWidth: "3rem", height: "2.25rem" }}
    >
      {logo ? (
        <img
          src={logo}
          alt={name}
          className={`${size} w-auto object-contain`}
        />
      ) : (
        <span className="text-[11px] font-semibold text-foreground/60 leading-none">
          {name}
        </span>
      )}
    </span>
  );
}
