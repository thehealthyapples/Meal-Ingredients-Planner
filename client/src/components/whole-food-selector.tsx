import { useState, useEffect } from "react";
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

// Flavour options shown per-type for crisps — mirrors the catalogue flavour selector.
const CRISP_FLAVOUR_OPTIONS = [
  "Ready salted", "Salt & vinegar", "Cheese & onion", "Pickled onion",
  "Sweet chilli", "BBQ", "Beef", "Steak", "Prawn cocktail", "Sour cream & onion", "Other",
];

export default function WholeFoodSelector({
  item,
  catalogueDef,
  variantSelections,
  attributePreferences,
  onVariantChange,
  onAttributeChange,
}: WholeFoodSelectorProps) {
  // Local draft for free-text fields — flush to parent only on blur/Enter to avoid per-keystroke DB writes.
  const [freeTextDraft, setFreeTextDraft] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const sel of catalogueDef.selectorSchema) {
      if (sel.freeTextKey) init[sel.freeTextKey] = variantSelections[sel.freeTextKey] ?? "";
    }
    return init;
  });

  useEffect(() => {
    setFreeTextDraft(prev => {
      const next = { ...prev };
      let changed = false;
      for (const sel of catalogueDef.selectorSchema) {
        const k = sel.freeTextKey;
        if (!k) continue;
        const saved = variantSelections[k] ?? "";
        if (saved && prev[k] === "") { next[k] = saved; changed = true; }
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantSelections]);

  // ── Crisps-specific: per-type flavour ─────────────────────────────────────
  // flavourByType     → variantSelections["flavourByType"]       (JSON Record<type, option>)
  // customFlavourByType → variantSelections["customFlavourByType"] (JSON Record<type, freeText>)
  // Chip clicks flush immediately (single PATCH). Custom text is drafted locally and
  // flushed on blur/Enter to avoid per-keystroke writes.
  const isCrisps = catalogueDef.id === "crisps";

  // Parse saved chip selections directly from the prop — no local draft needed for chips.
  const flavourByType: Record<string, string> = (() => {
    try { return JSON.parse(variantSelections["flavourByType"] ?? "{}") as Record<string, string>; }
    catch { return {}; }
  })();

  // Local draft for the "Other" free-text input, keyed by crisp type.
  const [customFlavourByTypeDraft, setCustomFlavourByTypeDraft] = useState<Record<string, string>>(() => {
    try { return JSON.parse(variantSelections["customFlavourByType"] ?? "{}") as Record<string, string>; }
    catch { return {}; }
  });

  useEffect(() => {
    if (!isCrisps) return;
    setCustomFlavourByTypeDraft(prev => {
      try {
        const saved = JSON.parse(variantSelections["customFlavourByType"] ?? "{}") as Record<string, string>;
        const next = { ...prev };
        let changed = false;
        for (const [k, v] of Object.entries(saved)) {
          if (!prev[k]) { next[k] = v; changed = true; }
        }
        return changed ? next : prev;
      } catch { return prev; }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantSelections]);

  const crispsTypeRaw = isCrisps ? (variantSelections["type"] ?? "") : "";
  const selectedCrispsTypes = crispsTypeRaw
    ? crispsTypeRaw.split(",").map(v => v.trim()).filter(Boolean)
    : [];

  // Chip click: toggle a single flavour option for one crisp type (immediate flush).
  function selectFlavourForType(type: string, option: string) {
    const current = flavourByType[type];
    const next = { ...flavourByType };
    if (current === option) { delete next[type]; } else { next[type] = option; }
    onVariantChange("flavourByType", JSON.stringify(next));
    // When navigating away from "Other", clear the custom draft for that type so it
    // doesn't surface stale text if the user re-selects "Other" later.
    if (current === "Other" && option !== "Other") {
      setCustomFlavourByTypeDraft(prev => { const d = { ...prev }; delete d[type]; return d; });
    }
  }

  // Flush custom text for one type (called on blur/Enter when "Other" is selected).
  function flushCustomFlavourForType(type: string, value: string) {
    const parsed = (() => {
      try { return JSON.parse(variantSelections["customFlavourByType"] ?? "{}") as Record<string, string>; }
      catch { return {} as Record<string, string>; }
    })();
    const updated = { ...parsed };
    if (value) { updated[type] = value; } else { delete updated[type]; }
    onVariantChange("customFlavourByType", JSON.stringify(updated));
  }

  return (
    <div
      className="mt-2 space-y-2"
      data-testid={`whole-food-selector-${item.id}`}
    >
      {catalogueDef.selectorSchema.map((selector) => {
        // For crisps with types selected: suppress the global "Flavour" multi-select.
        // The per-type flavour section below replaces it.
        if (isCrisps && selector.key === "flavour" && selectedCrispsTypes.length > 0) return null;

        const currentRaw = variantSelections[selector.key] ?? "";
        const currentValues = selector.multi
          ? currentRaw.split(",").map((v) => v.trim()).filter(Boolean)
          : [];

        function toggleMulti(option: string) {
          const next = currentValues.includes(option)
            ? currentValues.filter((v) => v !== option)
            : [...currentValues, option];
          onVariantChange(selector.key, next.join(","));
          if (option === "Other" && selector.freeTextKey && currentValues.includes(option)) {
            onVariantChange(selector.freeTextKey, "");
          }
          // For crisps type deselect: clear the per-type custom flavour draft.
          // We do NOT call onVariantChange for flavourByType/customFlavourByType here to
          // avoid a race (two simultaneous PATCHes reading stale savedItems). The stale
          // DB entries are harmless — handleHeadToShop iterates the current type list only.
          if (isCrisps && selector.key === "type" && currentValues.includes(option)) {
            setCustomFlavourByTypeDraft(prev => { const d = { ...prev }; delete d[option]; return d; });
          }
        }

        return (
          <div key={selector.key}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {selector.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {selector.options.map((option) => {
                const isSelected = selector.multi
                  ? currentValues.includes(option)
                  : currentRaw === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      selector.multi
                        ? toggleMulti(option)
                        : onVariantChange(selector.key, isSelected ? "" : option)
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
            {selector.freeTextKey && currentValues.includes("Other") && (
              <input
                type="text"
                placeholder="Describe flavour..."
                value={freeTextDraft[selector.freeTextKey] ?? variantSelections[selector.freeTextKey] ?? ""}
                onChange={(e) => setFreeTextDraft(prev => ({ ...prev, [selector.freeTextKey!]: e.target.value }))}
                onBlur={() => onVariantChange(selector.freeTextKey!, freeTextDraft[selector.freeTextKey!] ?? "")}
                onKeyDown={(e) => { if (e.key === "Enter") onVariantChange(selector.freeTextKey!, freeTextDraft[selector.freeTextKey!] ?? ""); }}
                className="mt-1 w-full text-[11px] px-2 py-0.5 rounded border border-border bg-transparent focus:outline-none focus:border-primary/40"
                data-testid={`variant-freetext-${item.id}-${selector.freeTextKey}`}
              />
            )}
          </div>
        );
      })}

      {/* Crisps-specific: per-type flavour chips + optional custom text */}
      {isCrisps && selectedCrispsTypes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Flavour
          </p>
          <div className="space-y-2">
            {selectedCrispsTypes.map(type => {
              const selectedFlavour = flavourByType[type] ?? "";
              return (
                <div key={type}>
                  <p className="text-[10px] text-muted-foreground/55 mb-0.5">{type}</p>
                  <div className="flex flex-wrap gap-1">
                    {CRISP_FLAVOUR_OPTIONS.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectFlavourForType(type, option)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                          selectedFlavour === option
                            ? "bg-primary/10 text-primary border-primary/20 font-medium"
                            : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                        }`}
                        data-testid={`crisp-flavour-chip-${item.id}-${type.replace(/\s+/g, "-").toLowerCase()}-${option.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {selectedFlavour === "Other" && (
                    <input
                      type="text"
                      placeholder="Describe flavour..."
                      value={customFlavourByTypeDraft[type] ?? ""}
                      onChange={(e) => setCustomFlavourByTypeDraft(prev => ({ ...prev, [type]: e.target.value }))}
                      onBlur={() => flushCustomFlavourForType(type, customFlavourByTypeDraft[type] ?? "")}
                      onKeyDown={(e) => { if (e.key === "Enter") flushCustomFlavourForType(type, customFlavourByTypeDraft[type] ?? ""); }}
                      className="mt-1 w-full text-[11px] px-2 py-0.5 rounded border border-border bg-transparent focus:outline-none focus:border-primary/40"
                      data-testid={`crisp-custom-flavour-${item.id}-${type.replace(/\s+/g, "-").toLowerCase()}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
