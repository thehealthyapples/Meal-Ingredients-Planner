import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Layers, Loader2, ChevronDown, ChevronUp,
  Clock, ArrowRight, Info,
} from "lucide-react";
import AppleRatingWithTooltip from "@/components/AppleRating";
import { buildAnalyserViewModel } from "@/lib/analyser-view-model";
import type { InputProduct, PackagedSwap, WholeFoodSwap } from "@/lib/analyser-view-model";
import { effortLabel, effortColor, formatTime } from "@/lib/whole-food-alternatives";
import { rankChoices, buildWhyBetter } from "@/lib/analyser-choice";
import thaAppleSrc from "@/assets/icons/tha-apple.png";

type DietProfile = {
  dietPattern: string | null;
  dietRestrictions: string[];
};

interface Props {
  product: InputProduct;
  otherProducts: InputProduct[];
  onAddToBasket: () => void;
  onLinkToTemplate: () => void;
  onViewProduct: (product: InputProduct) => void;
  addToBasketPending?: boolean;
  linkToTemplatePending?: boolean;
  dietProfile?: DietProfile | null;
}

const RISK_TEXT: Record<string, string> = {
  high: "text-red-700 dark:text-red-400",
  moderate: "text-yellow-700 dark:text-yellow-500",
  low: "text-foreground",
};

const SECTION_LABEL = "text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/70";

const CONCERN_CHECKS: Array<{
  id: string;
  keywords: string[];
  label: string;
  relevantFor: (p: DietProfile) => boolean;
}> = [
  {
    id: "dairy",
    keywords: ["milk", "cream", "butter", "cheese", "yogurt", "yoghurt", "whey", "casein", "lactose", "ghee"],
    label: "dairy",
    relevantFor: (p) => p.dietRestrictions.includes("Dairy-Free") || p.dietPattern === "Vegan",
  },
  {
    id: "gluten",
    keywords: ["wheat", "flour", "gluten", "barley", "rye", "spelt", "semolina"],
    label: "gluten",
    relevantFor: (p) => p.dietRestrictions.includes("Gluten-Free"),
  },
  {
    id: "meat",
    keywords: ["chicken", "beef", "pork", "lamb", "turkey", "duck", "bacon", "ham", "sausage", "mince", "venison"],
    label: "meat",
    relevantFor: (p) => p.dietPattern === "Vegan" || p.dietPattern === "Vegetarian",
  },
  {
    id: "fish",
    keywords: ["fish", "salmon", "tuna", "cod", "haddock", "prawn", "shrimp", "anchovy", "mackerel"],
    label: "fish",
    relevantFor: (p) => p.dietPattern === "Vegan" || p.dietPattern === "Vegetarian",
  },
  {
    id: "eggs",
    keywords: ["egg", "eggs", "egg yolk", "egg white", "whole egg"],
    label: "eggs",
    relevantFor: (p) => p.dietPattern === "Vegan",
  },
];

function checkDietConcerns(ingredientsText: string | null, dietProfile: DietProfile | null): string[] {
  if (!ingredientsText || !dietProfile) return [];
  const text = ingredientsText.toLowerCase();
  const concerns: string[] = [];
  for (const check of CONCERN_CHECKS) {
    if (check.relevantFor(dietProfile) && check.keywords.some(kw => text.includes(kw))) {
      concerns.push(check.label);
    }
  }
  return concerns;
}

function hasDietPreferences(dietProfile: DietProfile | null): boolean {
  if (!dietProfile) return false;
  return (dietProfile.dietRestrictions.length > 0) || (dietProfile.dietPattern !== null);
}

function formatConcernList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export default function AnalyserDetailV2({
  product,
  otherProducts,
  onAddToBasket,
  onLinkToTemplate,
  onViewProduct,
  addToBasketPending,
  linkToTemplatePending,
  dietProfile = null,
}: Props) {
  const vm = buildAnalyserViewModel(product, otherProducts);

  const [showRawIngredients, setShowRawIngredients] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showRecipeIndex, setShowRecipeIndex] = useState<number | null>(null);
  const [showMoreAlternatives, setShowMoreAlternatives] = useState(false);

  const wholeFoodSwaps = vm.swaps.filter((s): s is WholeFoodSwap => s.type === "whole-food");
  const packagedSwaps = vm.swaps.filter((s): s is PackagedSwap => s.type === "packaged");

  // ── Shop alternative ────────────────────────────────────────────────────
  const primaryStore = (product as any).availableStores?.[0] ?? null;
  const currentScore = (product as any).upfAnalysis?.thaRating ?? null;
  let topOptions: any[] = [];
  if (primaryStore) {
    const storeProducts = otherProducts.filter((p: any) =>
      p.barcode !== product.barcode &&
      (p.availableStores ?? []).includes(primaryStore)
    );
    const ranked = rankChoices(storeProducts, currentScore);
    topOptions = ranked.slice(0, 5);
  }
  const bestOption = topOptions[0] ?? null;
  const bestOptionReason = bestOption
    ? (buildWhyBetter(bestOption, currentScore)[0] ?? null)
    : null;

  const dietConcerns = checkDietConcerns(product.ingredients_text ?? null, dietProfile);
  const showDietBanner = hasDietPreferences(dietProfile);

  return (
    <div className="space-y-6" data-testid="analyser-detail-v2">

      {/* ── Card 1: Product identity + THA score ─────────────────────── */}
      <Card className="border-border shadow-none" data-testid="card-header">
        <CardContent className="p-5 space-y-6">

          {/* Product image */}
          {vm.product.imageUrl && (
            <div className="w-full h-44 bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={vm.product.imageUrl}
                alt={vm.product.name}
                className="h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Name + brand + pack size + retailers */}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-snug text-foreground" data-testid="text-v2-name">
              {vm.product.name}
            </h2>
            {vm.product.brand && (
              <p className="text-sm text-muted-foreground">{vm.product.brand}</p>
            )}
            {vm.product.packVariants.length > 1 ? (
              <p className="text-xs text-muted-foreground/70">Available in {vm.product.packVariants.join(' · ')}</p>
            ) : vm.product.packSize ? (
              <p className="text-xs text-muted-foreground/70">{vm.product.packSize}</p>
            ) : null}
            {vm.product.confirmedRetailers.length > 0 && (
              <p className="text-xs text-muted-foreground/70 pt-0.5">
                Available at {vm.product.confirmedRetailers.join(" · ")}
              </p>
            )}
            {vm.product.inferredRetailers.length > 0 && (
              <p className="text-xs text-muted-foreground/70 pt-0.5">
                Likely at {vm.product.inferredRetailers.slice(0, 4).join(" · ")}
              </p>
            )}
            {vm.product.confirmedRetailers.length === 0 && vm.product.inferredRetailers.length === 0 && vm.product.retailers.length > 0 && (
              <p className="text-xs text-muted-foreground/70 pt-0.5">
                {vm.product.retailers.join(" · ")}
              </p>
            )}
          </div>

          {/* Diet / allergen banner */}
          {showDietBanner && (
            <div data-testid="diet-concern-banner">
              {dietConcerns.length > 0 ? (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/40">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-px" />
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
                    Contains {formatConcernList(dietConcerns)} — may not suit your diet
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/60" data-testid="text-no-allergen-concerns">
                  No allergen concerns for your diet
                </p>
              )}
            </div>
          )}

          {/* THA score block */}
          <div className="flex items-start justify-between gap-4 pt-5 border-t border-border">
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-foreground leading-tight" data-testid="text-v2-score-label">
                {vm.score.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed" data-testid="text-v2-verdict">
                {vm.score.verdict}
              </p>
            </div>
            <div className="shrink-0 pt-0.5">
              <AppleRatingWithTooltip
                rating={vm.score.rating}
                sizePx={48}
                additiveContext={vm.score.additiveContext}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            <Button
              className="w-full gap-2"
              onClick={onAddToBasket}
              disabled={addToBasketPending}
              data-testid="button-v2-add-to-basket"
            >
              {addToBasketPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ShoppingCart className="h-4 w-4" />}
              Add to Basket
            </Button>
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
              onClick={onLinkToTemplate}
              disabled={linkToTemplatePending}
              data-testid="button-v2-link-template"
            >
              {linkToTemplatePending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Layers className="h-4 w-4" />}
              Create Meal Template
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* ── Shop alternative ─────────────────────────────────────────── */}
      {bestOption && (
        <Card className="border-border shadow-none" data-testid="card-shop-alternative">
          <CardContent className="p-5 space-y-4">
            <p className={SECTION_LABEL}>Best swap in {primaryStore}</p>

            {/* Best option — always visible */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug" data-testid="text-shop-alt-name">
                  {bestOption.product_name}
                </p>
                {bestOption.brand && (
                  <p className="text-xs text-muted-foreground mt-0.5">{bestOption.brand}</p>
                )}
                <div className="flex items-center gap-2.5 mt-1.5">
                  <AppleRatingWithTooltip
                    rating={bestOption.upfAnalysis?.thaRating ?? 0}
                    sizePx={18}
                    additiveContext={undefined}
                  />
                  {bestOptionReason && (
                    <span className="text-xs text-muted-foreground">{bestOptionReason}</span>
                  )}
                </div>
              </div>
              <button
                className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-0.5"
                onClick={() => onViewProduct(bestOption)}
                data-testid="button-shop-alternative-view"
                aria-label={`View ${bestOption.product_name}`}
              >
                View <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Expand toggle — only when more than 1 option */}
            {topOptions.length > 1 && (
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowMoreAlternatives((v) => !v)}
                data-testid="button-view-more-alternatives"
              >
                {showMoreAlternatives ? "Hide options" : "View more options"}
                {showMoreAlternatives
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />}
              </button>
            )}

            {/* Expanded list — options 2–5 */}
            {showMoreAlternatives && topOptions.length > 1 && (
              <div className="space-y-4 pt-1 border-t border-border/60" data-testid="section-more-alternatives">
                {topOptions.slice(1).map((opt, idx) => {
                  const reason = buildWhyBetter(opt, currentScore)[0] ?? null;
                  return (
                    <div key={opt.barcode ?? idx} className="flex items-start gap-3 pt-3 first:pt-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {opt.product_name}
                        </p>
                        {opt.brand && (
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.brand}</p>
                        )}
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <AppleRatingWithTooltip
                            rating={opt.upfAnalysis?.thaRating ?? 0}
                            sizePx={16}
                            additiveContext={undefined}
                          />
                          {reason && (
                            <span className="text-xs text-muted-foreground">{reason}</span>
                          )}
                        </div>
                      </div>
                      <button
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors pt-0.5"
                        onClick={() => onViewProduct(opt)}
                        aria-label={`View ${opt.product_name}`}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Card 2: Why this score ────────────────────────────────────── */}
      {vm.scoreDrivers.length > 0 && (
        <Card className="border-border shadow-none" data-testid="card-score-drivers">
          <CardContent className="p-5 space-y-4">
            <p className={SECTION_LABEL}>Why this score</p>
            <div className="space-y-4">
              {vm.scoreDrivers.slice(0, 3).map((driver, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`h-1.5 w-1.5 rounded-full mt-[7px] flex-shrink-0 ${
                      driver.polarity === "positive"
                        ? "bg-green-500 dark:bg-green-400"
                        : "bg-orange-400 dark:bg-orange-400"
                    }`}
                  />
                  <p className="text-sm text-foreground leading-snug">{driver.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Card 3: THA editorial review ─────────────────────────────── */}
      <Card className="border-border shadow-none" data-testid="card-tha-review">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <img src={thaAppleSrc} alt="" className="h-4 w-4 object-contain opacity-80" />
            <p className={SECTION_LABEL}>THA Review</p>
          </div>
          <p className="text-[15px] text-foreground leading-relaxed" data-testid="text-v2-review">
            {vm.thaReview}
          </p>
        </CardContent>
      </Card>

      {/* ── Card 4: Ingredients ──────────────────────────────────────── */}
      {vm.uiMeta.hasIngredients && (
        <Card className="border-border shadow-none" data-testid="card-ingredients">
          <CardContent className="p-5 space-y-5">
            <p className={SECTION_LABEL}>What&apos;s in it</p>

            {/* Additives */}
            {vm.uiMeta.hasAdditives && (
              <div className="space-y-3" data-testid="section-v2-additives">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {vm.ingredients.additives.length === 0
                      ? "No additives detected"
                      : `${vm.ingredients.additives.length} additive${vm.ingredients.additives.length !== 1 ? "s" : ""} detected`}
                  </p>
                  {(vm.score.additiveContext.regulatory ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground/70">
                      {vm.score.additiveContext.regulatory} regulatory
                    </p>
                  )}
                </div>

                {vm.ingredients.allAdditivesRegulatory && (
                  <p className="text-xs text-muted-foreground leading-snug">
                    All additives present are regulatory requirements (e.g. UK flour fortification), not manufacturing choices.
                  </p>
                )}

                <div className="space-y-0">
                  {vm.ingredients.additives.map((a, i) => (
                    <div
                      key={i}
                      className="py-3 border-b border-border/60 last:border-0"
                      data-testid={`v2-additive-${i}`}
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${RISK_TEXT[a.riskLevel] ?? RISK_TEXT.low}`}>
                          {a.name}
                        </span>
                        <span className="text-xs text-muted-foreground/70">{a.type}</span>
                        {a.isRegulatory && (
                          <span className="text-xs text-muted-foreground/60 italic">regulatory</span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground leading-snug mt-1">{a.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing indicators */}
            {vm.ingredients.processingIndicators.length > 0 && (
              <div className="space-y-2" data-testid="section-v2-processing-indicators">
                <p className="text-sm font-medium text-foreground">Processing indicators</p>
                <p className="text-sm text-muted-foreground leading-snug">
                  {vm.ingredients.processingIndicators.join(", ")}
                </p>
              </div>
            )}

            {/* Raw ingredient text - progressive disclosure */}
            {vm.ingredients.unavailable ? (
              <p className="text-xs text-muted-foreground/60 italic" data-testid="text-v2-ingredients-unavailable">
                Ingredient detail unavailable in English
              </p>
            ) : vm.ingredients.rawText ? (
              <div data-testid="section-v2-raw-ingredients">
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowRawIngredients((v) => !v)}
                  data-testid="button-v2-toggle-raw-ingredients"
                >
                  {showRawIngredients
                    ? <ChevronUp className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                  {showRawIngredients ? "Hide" : "Show"} full ingredient list
                </button>
                {showRawIngredients && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-3" data-testid="text-v2-raw-ingredients">
                    {vm.ingredients.rawText}
                  </p>
                )}
              </div>
            ) : null}

          </CardContent>
        </Card>
      )}

      {/* ── Card 5: Better options ───────────────────────────────────── */}
      {vm.uiMeta.hasSwaps && (
        <Card className="border-border shadow-none" data-testid="card-swaps">
          <CardContent className="p-5 space-y-5">
            <p className={SECTION_LABEL}>A better option?</p>

            {/* Simply Made - whole food */}
            {wholeFoodSwaps.length > 0 && (
              <div className="space-y-3" data-testid="section-v2-simply-made">
                <p className="text-xs font-medium text-muted-foreground">Simply Made</p>
                {wholeFoodSwaps.map((swap, idx) => (
                  <div key={idx} className="rounded-lg bg-muted/30 p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        <span className="mr-1.5">{swap.emoji}</span>
                        {swap.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${effortColor(swap.effort)}`}>
                          {effortLabel(swap.effort)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatTime(swap.timeMinutes)}
                        </span>
                      </div>
                    </div>

                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      onClick={() => setShowRecipeIndex(showRecipeIndex === idx ? null : idx)}
                      data-testid={`button-v2-toggle-recipe-${idx}`}
                    >
                      {showRecipeIndex === idx
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />}
                      {showRecipeIndex === idx ? "Hide recipe" : "View recipe"}
                    </button>

                    {showRecipeIndex === idx && (
                      <div className="space-y-2.5 pt-1">
                        <ul className="space-y-1.5">
                          {swap.ingredients.map((ing, i) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/50 mt-0.5 flex-shrink-0">·</span>
                              {ing}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground leading-relaxed">{swap.method}</p>
                        {swap.tip && (
                          <p className="text-xs text-muted-foreground/70 italic">{swap.tip}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Confidently Choose - packaged alternatives */}
            {packagedSwaps.length > 0 && (
              <div className="space-y-3" data-testid="section-v2-confidently-choose">
                <p className="text-xs font-medium text-muted-foreground">Confidently Choose</p>
                {packagedSwaps.map((swap, idx) => (
                  <div
                    key={swap.product.barcode ?? idx}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3"
                    data-testid={`v2-packaged-swap-${idx}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug truncate">
                        {swap.name}
                      </p>
                      {swap.brand && (
                        <p className="text-xs text-muted-foreground mt-0.5">{swap.brand}</p>
                      )}
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <AppleRatingWithTooltip
                          rating={swap.rating}
                          sizePx={18}
                          additiveContext={undefined}
                        />
                        {swap.whyBetter[0] && (
                          <span className="text-xs text-muted-foreground">{swap.whyBetter[0]}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="flex-shrink-0 p-2 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => onViewProduct(swap.product)}
                      data-testid={`button-v2-view-swap-${idx}`}
                      aria-label={`View ${swap.name}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* ── Card 6: Nutrition (collapsed by default) ─────────────────── */}
      {vm.uiMeta.hasNutrition && vm.nutrition && (
        <Card className="border-border shadow-none" data-testid="card-nutrition">
          <CardContent className="p-5 space-y-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setShowNutrition((v) => !v)}
              data-testid="button-v2-toggle-nutrition"
            >
              <p className={SECTION_LABEL}>Nutrition</p>
              {showNutrition
                ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
            </button>

            {showNutrition && (
              <div className="grid grid-cols-3 gap-2" data-testid="v2-nutrition-grid">
                {[
                  { label: "Calories", value: vm.nutrition.calories },
                  { label: "Protein", value: vm.nutrition.protein },
                  { label: "Carbs", value: vm.nutrition.carbs },
                  { label: "Fat", value: vm.nutrition.fat },
                  { label: "Sugar", value: vm.nutrition.sugar },
                  { label: "Salt", value: vm.nutrition.salt },
                ]
                  .filter((item) => item.value !== null)
                  .map((item) => (
                    <div key={item.label} className="text-center py-3 px-2 bg-muted/20 rounded-lg">
                      <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
