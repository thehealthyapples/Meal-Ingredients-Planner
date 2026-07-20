import { useQuery } from "@tanstack/react-query";

type BannerSettings = {
  enabled: boolean;
  text: string;
};

export default function SiteBanner() {
  const { data } = useQuery<BannerSettings>({
    queryKey: ["/api/site-settings/banner"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.enabled || !data.text.trim()) return null;

  return (
    <div
      // UX2 — `bg-green-600 text-white` was a FOURTH green: not the house's
      // `--primary`, not Home's orchard hue, not the emerald the Shopping room
      // uses. A saturated stripe in an unowned colour, full-bleed above the
      // header, was the loudest thing in the product and it belonged to nothing.
      // This is THA speaking to every household at once (maintenance, an outage)
      // — a legitimate operational notice and NOT Companion coaching — so it
      // keeps its place and its role, in the house's own material.
      className="w-full shrink-0 bg-accent text-accent-foreground border-b border-border text-sm font-medium py-2.5 px-4 text-center"
      data-testid="banner-site"
      role="status"
    >
      {data.text}
    </div>
  );
}
