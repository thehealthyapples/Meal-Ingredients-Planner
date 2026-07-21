import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDialogWidthClass } from "@/components/ui/dialog-foundation";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { data, isPending: isLoading } = useQuery<FoodKnowledge>({
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
      <DialogContent className={getDialogWidthClass("comfortable")}>
        <DialogHeader>
          <DialogTitle className="text-base">
            {data?.title ?? slug}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          /* UINORTH1 — the canonical loading owner (UIA §12 "shape before spin",
             §17): section-shaped placeholders mirror the knowledge that is
             arriving, in place of a centred spinner and a literal "Loading…". */
          <div className="space-y-4 py-1" aria-busy="true" aria-label="Loading this food">
            {SECTION_LABELS.map(({ key }) => (
              <div key={key}>
                <Skeleton className="h-3 w-24 mb-1.5" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
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
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 mb-1">{label}</p>
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
