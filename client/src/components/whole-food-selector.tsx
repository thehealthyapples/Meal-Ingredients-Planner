import { useState, useEffect } from "react";
import type { ShoppingListItem } from "@shared/schema";
import type { IngredientDef } from "@/lib/ingredient-catalogue";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";

interface WholeFoodSelectorProps {
  item: ShoppingListItem;
  catalogueDef: IngredientDef;
  variantSelections: Record<string, string>;
  attributePreferences: Record<string, boolean>;
  onVariantChange: (key: string, value: string) => void;
  onAttributeChange: (key: string, value: boolean) => void;
  /** When true, renders variant rows full-width with right-aligned qty steppers */
  showVariantQty?: boolean;
}

const SELECT_CLASS = "text-[11px] h-5 px-1.5 rounded border border-border/60 bg-background/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer max-w-[110px]";
const OTHER_INPUT_CLASS = "text-[11px] h-5 px-1.5 rounded border border-border/60 bg-background/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 w-[120px] placeholder:text-muted-foreground/40";
const QTY_BTN_CLASS = "h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors";
const QTY_INPUT_CLASS = "h-5 w-8 text-[11px] tabular-nums text-center rounded border border-border/60 bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function parseMultiRaw(raw: string): string[] {
  return raw.split(",").map(v => v.trim()).filter(Boolean);
}

/** True when a catalogue item has both "type" and "flavour" selectors — uses the type→flavour pairing pattern. */
function hasTypeFlavourPattern(def: IngredientDef): boolean {
  return def.selectorSchema.some(s => s.key === "type") && def.selectorSchema.some(s => s.key === "flavour");
}

export default function WholeFoodSelector({
  item,
  catalogueDef,
  variantSelections,
  attributePreferences,
  onVariantChange,
  onAttributeChange,
  showVariantQty = false,
}: WholeFoodSelectorProps) {
  const isTypeFlavourItem = hasTypeFlavourPattern(catalogueDef);

  const firstTypeFlavourType = isTypeFlavourItem
    ? (variantSelections["type"] ?? "").split(",")[0].trim()
    : "";

  const flavourByType: Record<string, string> = (() => {
    try { return JSON.parse(variantSelections["flavourByType"] ?? "{}") as Record<string, string>; }
    catch { return {}; }
  })();

  const customFlavourByType: Record<string, string> = (() => {
    try { return JSON.parse(variantSelections["customFlavourByType"] ?? "{}") as Record<string, string>; }
    catch { return {}; }
  })();

  function selectFlavourForType(type: string, option: string) {
    const next = { ...flavourByType };
    if (option) { next[type] = option; } else { delete next[type]; }
    onVariantChange("flavourByType", JSON.stringify(next));
  }

  function selectCustomFlavourForType(type: string, text: string) {
    const next = { ...customFlavourByType };
    if (text) { next[type] = text; } else { delete next[type]; }
    onVariantChange("customFlavourByType", JSON.stringify(next));
  }

  const [multiSlots, setMultiSlots] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const sel of catalogueDef.selectorSchema) {
      if (sel.multi) {
        init[sel.key] = parseMultiRaw(variantSelections[sel.key] ?? "");
      }
    }
    return init;
  });
  // Draft qty values while user is typing (keyed by variety name)
  const [variantQtyDraft, setVariantQtyDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setMultiSlots(prev => {
      let changed = false;
      const next = { ...prev };
      for (const sel of catalogueDef.selectorSchema) {
        if (!sel.multi) continue;
        const newCommitted = parseMultiRaw(variantSelections[sel.key] ?? "");
        const prevSlots = prev[sel.key] ?? [];
        const prevCommitted = prevSlots.filter(Boolean);
        if (JSON.stringify(prevCommitted) !== JSON.stringify(newCommitted)) {
          const pendingCount = prevSlots.filter(v => v === "").length;
          next[sel.key] = [...newCommitted, ...Array(pendingCount).fill("")];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [variantSelections, catalogueDef]);

  const hasSelectors = catalogueDef.selectorSchema.length > 0;
  const hasAttributes = catalogueDef.relevantAttributes.length > 0;
  if (!hasSelectors && !hasAttributes) return null;

  const variantQuantities: Record<string, number> = (() => {
    try { return JSON.parse(variantSelections["variantQuantities"] ?? "{}") as Record<string, number>; }
    catch { return {}; }
  })();

  function updateVariantQty(selectorKey: string, variety: string, next: number) {
    const allVarieties = (multiSlots[selectorKey] ?? []).filter(Boolean);
    const qties: Record<string, number> = {};
    for (const v of allVarieties) {
      qties[v] = v === variety ? next : (variantQuantities[v] ?? 1);
    }
    onVariantChange("variantQuantities", JSON.stringify(qties));
  }

  function updateMultiSlot(key: string, idx: number, value: string) {
    const next = [...(multiSlots[key] ?? [])];
    next[idx] = value;
    setMultiSlots(m => ({ ...m, [key]: next }));
    onVariantChange(key, next.filter(Boolean).join(","));
  }

  function removeMultiSlot(key: string, idx: number) {
    const next = (multiSlots[key] ?? []).filter((_, i) => i !== idx);
    setMultiSlots(m => ({ ...m, [key]: next }));
    onVariantChange(key, next.filter(Boolean).join(","));
  }

  function addMultiSlot(key: string) {
    const current = multiSlots[key] ?? [];
    setMultiSlots(m => ({ ...m, [key]: [...current, ""] }));
  }

  const flavourSelectorDef = catalogueDef.selectorSchema.find(s => s.key === "flavour");

  return (
    <div
      className={showVariantQty
        ? "flex flex-col gap-1 mt-1.5 w-full"
        : "flex items-start flex-wrap gap-x-3 gap-y-1 mt-1.5"}
      data-testid={`whole-food-selector-${item.id}`}
    >
      {catalogueDef.selectorSchema.map((selector) => {
        if (isTypeFlavourItem && selector.key === "flavour") return null;

        if (selector.multi) {
          const slots = multiSlots[selector.key] ?? [];
          const displaySlots = slots.length === 0 ? [""] : slots;
          const hasMultiple = displaySlots.length > 1;

          // ── showVariantQty mode: full-width 2-column rows ──────────────
          if (showVariantQty) {
            return (
              <div key={selector.key} className="flex flex-col gap-1 w-full">
                {displaySlots.map((val, idx) => {
                  const isLast = idx === displaySlots.length - 1;
                  const vQty = val !== "" ? (variantQuantities[val] ?? 1) : 1;
                  const draft = variantQtyDraft[val];
                  return (
                    <div key={idx} className="flex items-center w-full gap-2">
                      {/* LEFT: label + select + optional free-text + remove + add-another */}
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="text-[10.5px] text-muted-foreground/70 whitespace-nowrap shrink-0">
                          {selector.label} {idx + 1}:
                        </span>
                        <select
                          value={val}
                          onChange={e => updateMultiSlot(selector.key, idx, e.target.value)}
                          className={SELECT_CLASS}
                          data-testid={`variant-select-${item.id}-${selector.key}-${idx}`}
                        >
                          <option value="">Any</option>
                          {selector.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {val === "Other" && selector.freeTextKey && (
                          <input
                            type="text"
                            value={variantSelections[selector.freeTextKey] ?? ""}
                            onChange={e => onVariantChange(selector.freeTextKey!, e.target.value)}
                            placeholder="Enter…"
                            className={OTHER_INPUT_CLASS}
                            data-testid={`variant-other-input-${item.id}-${selector.key}-${idx}`}
                          />
                        )}
                        {hasMultiple && (
                          <button
                            onClick={() => removeMultiSlot(selector.key, idx)}
                            className="h-4 w-4 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            aria-label={`Remove ${selector.label} ${idx + 1}`}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {isLast && (
                          <button
                            onClick={() => addMultiSlot(selector.key)}
                            className="text-[10px] text-primary/70 hover:text-primary ml-1 transition-colors whitespace-nowrap"
                            aria-label={`Add another ${selector.label.toLowerCase()}`}
                          >
                            + another {selector.label.toLowerCase()}
                          </button>
                        )}
                      </div>
                      {/* RIGHT: qty stepper, right-aligned */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {val !== "" ? (
                          <>
                            <button
                              onClick={() => {
                                const next = Math.max(1, vQty - 1);
                                setVariantQtyDraft(d => { const n = { ...d }; delete n[val]; return n; });
                                updateVariantQty(selector.key, val, next);
                              }}
                              className={QTY_BTN_CLASS}
                              aria-label={`Decrease qty for ${val}`}
                              data-testid={`cyc-variant-qty-minus-${item.id}-${val.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={draft ?? String(vQty)}
                              onChange={e => setVariantQtyDraft(d => ({ ...d, [val]: e.target.value }))}
                              onBlur={e => {
                                const parsed = parseInt(e.target.value);
                                const clamped = Math.max(1, isNaN(parsed) ? 1 : parsed);
                                setVariantQtyDraft(d => { const n = { ...d }; delete n[val]; return n; });
                                if (clamped !== vQty) updateVariantQty(selector.key, val, clamped);
                              }}
                              onKeyDown={e => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                if (e.key === "Escape") {
                                  setVariantQtyDraft(d => { const n = { ...d }; delete n[val]; return n; });
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className={QTY_INPUT_CLASS}
                              data-testid={`cyc-variant-qty-input-${item.id}-${val.replace(/\s+/g, "-").toLowerCase()}`}
                            />
                            <button
                              onClick={() => {
                                setVariantQtyDraft(d => { const n = { ...d }; delete n[val]; return n; });
                                updateVariantQty(selector.key, val, vQty + 1);
                              }}
                              className={QTY_BTN_CLASS}
                              aria-label={`Increase qty for ${val}`}
                              data-testid={`cyc-variant-qty-plus-${item.id}-${val.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </>
                        ) : (
                          // Invisible spacer keeps column width stable when slot is unselected
                          <span className="w-[68px]" aria-hidden />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // ── Default inline mode ────────────────────────────────────────
          return (
            <div key={selector.key} className="flex flex-col gap-1">
              {displaySlots.map((val, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-[10.5px] text-muted-foreground/70">
                    {selector.label} {idx + 1}:
                  </span>
                  <select
                    value={val}
                    onChange={e => updateMultiSlot(selector.key, idx, e.target.value)}
                    className={SELECT_CLASS}
                    data-testid={`variant-select-${item.id}-${selector.key}-${idx}`}
                  >
                    <option value="">Any</option>
                    {selector.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {val === "Other" && selector.freeTextKey && (
                    <input
                      type="text"
                      value={variantSelections[selector.freeTextKey] ?? ""}
                      onChange={e => onVariantChange(selector.freeTextKey!, e.target.value)}
                      placeholder="Enter…"
                      className={OTHER_INPUT_CLASS}
                      data-testid={`variant-other-input-${item.id}-${selector.key}-${idx}`}
                    />
                  )}
                  {hasMultiple && (
                    <button
                      onClick={() => removeMultiSlot(selector.key, idx)}
                      className="h-4 w-4 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      aria-label={`Remove ${selector.label} ${idx + 1}`}
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                  )}
                  {idx === displaySlots.length - 1 && (
                    <button
                      onClick={() => addMultiSlot(selector.key)}
                      className="text-[10px] text-primary/70 hover:text-primary ml-1 transition-colors whitespace-nowrap"
                      aria-label={`Add another ${selector.label.toLowerCase()}`}
                    >
                      + another {selector.label.toLowerCase()}
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        }

        const currentValue = variantSelections[selector.key] ?? "";

        return (
          <div key={selector.key} className="flex items-center gap-1">
            <span className="text-[10.5px] text-muted-foreground/70">{selector.label}:</span>
            <select
              value={currentValue}
              onChange={e => onVariantChange(selector.key, e.target.value)}
              className={SELECT_CLASS}
              data-testid={`variant-select-${item.id}-${selector.key}`}
            >
              <option value="">Any</option>
              {selector.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {currentValue === "Other" && selector.freeTextKey && (
              <input
                type="text"
                value={variantSelections[selector.freeTextKey] ?? ""}
                onChange={e => onVariantChange(selector.freeTextKey!, e.target.value)}
                placeholder="Enter…"
                className={OTHER_INPUT_CLASS}
                data-testid={`variant-other-input-${item.id}-${selector.key}`}
              />
            )}
          </div>
        );
      })}

      {/* Per-type flavour selector — shown for any type-flavour pattern item */}
      {isTypeFlavourItem && firstTypeFlavourType && flavourSelectorDef && (
        <div className="flex items-center gap-1">
          <span className="text-[10.5px] text-muted-foreground/70">{flavourSelectorDef.label}:</span>
          <select
            value={flavourByType[firstTypeFlavourType] ?? ""}
            onChange={e => selectFlavourForType(firstTypeFlavourType, e.target.value)}
            className={SELECT_CLASS}
            data-testid={`variant-flavour-${item.id}-${firstTypeFlavourType}`}
          >
            <option value="">Any</option>
            {flavourSelectorDef.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {flavourByType[firstTypeFlavourType] === "Other" && (
            <input
              type="text"
              value={customFlavourByType[firstTypeFlavourType] ?? ""}
              onChange={e => selectCustomFlavourForType(firstTypeFlavourType, e.target.value)}
              placeholder="Enter…"
              className={OTHER_INPUT_CLASS}
              data-testid={`variant-flavour-other-input-${item.id}`}
            />
          )}
        </div>
      )}

      {catalogueDef.relevantAttributes.map((attr) => {
        const label = attr.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const id = `attr-${item.id}-${attr}`;
        return (
          <div key={attr} className="flex items-center gap-1">
            <Checkbox
              id={id}
              checked={!!attributePreferences[attr]}
              onCheckedChange={checked => onAttributeChange(attr, !!checked)}
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
  );
}
