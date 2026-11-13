import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlanToShoppingReviewItem } from "@/lib/plan-to-shopping-review-model";

interface PlanToShoppingReviewDialogProps {
  open: boolean;
  weekName: string;
  items: PlanToShoppingReviewItem[];
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PlanToShoppingReviewDialog({
  open,
  weekName,
  items,
  pending = false,
  onOpenChange,
  onConfirm,
}: PlanToShoppingReviewDialogProps) {
  const dayCount = new Set(items.map((item) => item.dayName)).size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-plan-to-shopping-review">
        <DialogHeader>
          <DialogTitle>Review this week for shopping</DialogTitle>
          <DialogDescription>
            {weekName}: {items.length} planned meal{items.length === 1 ? "" : "s"} across {dayCount} day{dayCount === 1 ? "" : "s"} will be added to your shared shopping list after you confirm.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2" aria-label="Meals being added to the shopping list">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-start gap-3 rounded-md border px-3 py-2"
              data-testid="shopping-review-meal"
            >
              <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                {item.dayName} · {item.slotName}
              </span>
              <span className="min-w-0 text-sm">
                <span className="block">{item.mealName}</span>
                {item.exactPantryMatches.length > 0 && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Exact pantry name match: {item.exactPantryMatches.join(", ")}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Pantry matches use exact ingredient names only. They do not check quantity or condition. You can review ingredients and quantities in Shopping after adding.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Keep planning
          </Button>
          <Button onClick={onConfirm} disabled={pending || items.length === 0} data-testid="button-confirm-plan-to-shopping">
            {pending ? "Adding…" : "Add meals to shopping list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
