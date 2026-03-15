import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { FoodKnowledge } from "@shared/schema";

interface Props {
  slug: string | null;
  onClose: () => void;
}

const SECTION_LABELS: { key: keyof FoodKnowledge; label: string }[] = [
  { key: "shortSummary", label: "What is it?" },
  { key: "whyThaHighlightsThis", label: "Why THA highlights this" },
  { key: "whatToKnow", label: "What to know" },
  { key: "simplerAlternatives", label: "Simpler alternatives" },
];

export default function FoodKnowledgeModal({ slug, onClose }: Props) {
  const { data, isLoading } = useQuery<FoodKnowledge>({
    queryKey: ["/api/food-knowledge", slug],
    queryFn: async () => {
      const res = await fetch(`/api/food-knowledge/${slug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Dialog open={!!slug} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isLoading ? "Loading…" : (data?.title ?? slug)}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground py-4">No information available for this item yet.</p>
        ) : (
          <div className="space-y-4 py-1">
            {SECTION_LABELS.map(({ key, label }) => {
              const value = data[key] as string | null;
              if (!value) return null;
              return (
                <div key={key}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm leading-relaxed">{value}</p>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
