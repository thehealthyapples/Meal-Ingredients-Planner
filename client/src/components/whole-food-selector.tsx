import type { ShoppingListItem } from "@shared/schema";
import type { IngredientDef } from "@/lib/ingredient-catalogue";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WholeFoodSelectorProps {
  item: ShoppingListItem;
  catalogueDef: IngredientDef;
  variantSelections: Record<string, string>;
  attributePreferences: Record<string, boolean>;
  onVariantChange: (key: string, value: string) => void;
  onAttributeChange: (key: string, value: boolean) => void;
}

export default function WholeFoodSelector({
  item,
  catalogueDef,
  variantSelections,
  attributePreferences,
  onVariantChange,
  onAttributeChange,
}: WholeFoodSelectorProps) {
  return (
    <div
      className="mt-2 space-y-2"
      data-testid={`whole-food-selector-${item.id}`}
    >
      {catalogueDef.selectorSchema.map((selector) => (
        <div key={selector.key}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {selector.label}
          </p>
          <div className="flex flex-wrap gap-1">
            {selector.options.map((option) => {
              const isSelected = variantSelections[selector.key] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onVariantChange(selector.key, isSelected ? "" : option)
                  }
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary border-primary/20 font-medium"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  }`}
                  data-testid={`variant-chip-${item.id}-${selector.key}-${option.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {catalogueDef.relevantAttributes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {catalogueDef.relevantAttributes.map((attr) => {
            const id = `attr-${item.id}-${attr}`;
            const label = attr.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            return (
              <div key={attr} className="flex items-center gap-1.5">
                <Checkbox
                  id={id}
                  checked={!!attributePreferences[attr]}
                  onCheckedChange={(checked) => onAttributeChange(attr, !!checked)}
                  data-testid={`attr-checkbox-${item.id}-${attr}`}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={id} className="text-[11px] text-muted-foreground cursor-pointer select-none">
                  {label}
                </Label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
