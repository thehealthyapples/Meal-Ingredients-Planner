import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export const COMMON_UNITS = [
  { value: "",        label: "-" },
  { value: "g",       label: "g" },
  { value: "kg",      label: "kg" },
  { value: "ml",      label: "ml" },
  { value: "l",       label: "l" },
  { value: "tbsp",    label: "tbsp" },
  { value: "tsp",     label: "tsp" },
  { value: "cup",     label: "cup" },
  { value: "oz",      label: "oz" },
  { value: "lb",      label: "lb" },
  { value: "pinch",   label: "pinch" },
  { value: "slice",   label: "slice" },
  { value: "piece",   label: "piece" },
  { value: "breast",  label: "breast" },
  { value: "fillet",  label: "fillet" },
  { value: "clove",   label: "clove" },
  { value: "handful", label: "handful" },
  { value: "serving", label: "serving" },
  { value: "tin",     label: "tin" },
  { value: "can",     label: "can" },
  { value: "pack",    label: "pack" },
];

const UNIT_VALUES = COMMON_UNITS.map(u => u.value).filter(Boolean);

export function parseIngredientString(raw: string): { amount: string; unit: string; name: string } {
  const text = raw.trim();
  if (!text) return { amount: "", unit: "", name: "" };

  const unitsPattern = UNIT_VALUES.join("|");
  const re = new RegExp(
    `^([\\d\\s\\/½¼¾⅓⅔⅛⅜⅝⅞]+(?:[\\.,]\\d+)?)?\\s*(${unitsPattern})\\.?\\s+(.+)$`,
    "i"
  );
  const m = text.match(re);
  if (m) {
    return {
      amount: (m[1] || "").trim(),
      unit: m[2].toLowerCase(),
      name: m[3].trim(),
    };
  }

  const numOnly = text.match(/^([\d\s\/½¼¾⅓⅔⅛⅜⅝⅞]+(?:[.,]\d+)?)\s+(.+)$/);
  if (numOnly) {
    return { amount: numOnly[1].trim(), unit: "", name: numOnly[2].trim() };
  }

  return { amount: "", unit: "", name: text };
}

export function buildIngredientString(amount: string, unit: string, name: string): string {
  const a = amount.trim();
  const u = unit.trim();
  const n = name.trim();
  if (!n) return "";
  if (a && u) return `${a}${u} ${n}`;
  if (a) return `${a} ${n}`;
  return n;
}

interface IngredientRowProps {
  index: number;
  amount: string;
  unit: string;
  name: string;
  onAmountChange: (v: string) => void;
  onUnitChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function IngredientRow({
  index,
  amount,
  unit,
  name,
  onAmountChange,
  onUnitChange,
  onNameChange,
  onRemove,
  showRemove = true,
}: IngredientRowProps) {
  return (
    <div className="flex gap-1.5 items-center">
      <Input
        type="text"
        value={amount}
        onChange={e => onAmountChange(e.target.value)}
        placeholder="qty"
        className="w-14 shrink-0 text-center"
        data-testid={`input-ingredient-amount-${index}`}
      />
      <Select
        value={unit || "__none__"}
        onValueChange={v => onUnitChange(v === "__none__" ? "" : v)}
      >
        <SelectTrigger
          className="w-[72px] shrink-0"
          data-testid={`select-ingredient-unit-${index}`}
        >
          <SelectValue placeholder="-" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">-</SelectItem>
          {COMMON_UNITS.filter(u => u.value).map(u => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="text"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Ingredient"
        className="flex-1 min-w-0"
        data-testid={`input-ingredient-name-${index}`}
      />
      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="shrink-0 h-9 w-9"
          data-testid={`button-remove-ingredient-${index}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
