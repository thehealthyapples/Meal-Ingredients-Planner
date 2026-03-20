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
      className="w-full shrink-0 bg-green-600 text-white text-sm font-medium py-2.5 px-4 text-center"
      data-testid="banner-site"
      role="status"
    >
      {data.text}
    </div>
  );
}
