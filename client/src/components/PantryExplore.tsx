import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, Atom, Apple, ChevronRight, Sparkles, Leaf } from "lucide-react";
import { normaliseForReuse } from "@/lib/ingredient-reuse";
import { getCategoryEmoji } from "@/lib/ingredient-imagery";
import {
  TERMINOLOGY,
  EMPTY_STATES,
  HEALTH_DISCLAIMER,
  listLibraryFoods,
  buildNutrientIndex,
  listHealthBenefitTopics,
} from "@/lib/health-benefits-model";

type ExploreLens = "benefits" | "nutrients" | "foods";

interface PantryItemLite {
  id: number;
  ingredientKey: string;
  displayName: string | null;
}

const LENSES: { key: ExploreLens; label: string; icon: typeof Heart }[] = [
  { key: "benefits", label: TERMINOLOGY.healthBenefits, icon: Heart },
  { key: "nutrients", label: TERMINOLOGY.keyNutrients, icon: Atom },
  { key: "foods", label: "Foods", icon: Apple },
];

function EmptyLensState({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <Sparkles className="h-5 w-5 mx-auto text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground/50">{message}</p>
    </div>
  );
}

/**
 * Pantry Nutrition Explore — the evergreen "Nutrition Knowledge Hub".
 *
 * Answers "What can I add?" by letting users browse the curated nutrition
 * libraries by Health Benefit, Key Nutrient, or Food. All content is sourced
 * from the shared Health Benefits display model; nothing is fabricated. The
 * Health Benefits lens shows a safe empty state until the benefit registry is
 * populated in a later, separately-approved data task.
 */
export function PantryExplore() {
  const [lens, setLens] = useState<ExploreLens>("foods");
  const [openNutrient, setOpenNutrient] = useState<string | null>(null);

  // Existing pantry inventory — read-only, used only to flag "In your pantry".
  const { data: pantryItems = [] } = useQuery<PantryItemLite[]>({
    queryKey: ["/api/pantry"],
  });

  const pantryKeys = useMemo(() => {
    const set = new Set<string>();
    for (const item of pantryItems) {
      set.add(normaliseForReuse(item.displayName ?? item.ingredientKey));
      set.add(item.ingredientKey);
    }
    return set;
  }, [pantryItems]);

  const foods = useMemo(() => listLibraryFoods(), []);
  const nutrientIndex = useMemo(() => buildNutrientIndex(), []);
  const benefitTopics = useMemo(() => listHealthBenefitTopics(), []);

  const inPantry = (key: string) =>
    pantryKeys.has(key) || pantryKeys.has(normaliseForReuse(key));

  return (
    <div className="rounded-2xl border border-border/50 bg-background overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-emerald-600/70 dark:text-emerald-400/70 flex-shrink-0" />
          <h2 className="text-base font-semibold">Nutrition Explore</h2>
        </div>
        <p className="text-xs text-muted-foreground/55 mt-0.5">
          Browse health benefits, key nutrients and foods. A knowledge hub for
          "what can I add?"
        </p>
      </div>

      {/* ── Lens tabs ───────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-border/50 bg-muted/10">
        <div className="flex items-center gap-1.5 flex-wrap" role="tablist">
          {LENSES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={lens === key}
              onClick={() => setLens(key)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                lens === key
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40 font-medium"
                  : "bg-muted/30 text-muted-foreground/60 border-border/40 hover:text-foreground/80"
              }`}
              data-testid={`button-explore-lens-${key}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lens body ───────────────────────────────────────────────────── */}
      <div>
        {/* Health Benefits — empty until benefit registry is populated */}
        {lens === "benefits" &&
          (benefitTopics.length === 0 ? (
            <EmptyLensState message={EMPTY_STATES.healthBenefitsComingSoon} />
          ) : (
            <div className="divide-y divide-border/30">
              {benefitTopics.map((b) => (
                <div key={b.name} className="px-5 py-3 text-sm text-foreground/80">
                  {b.emoji ? `${b.emoji} ` : ""}
                  {b.name}
                </div>
              ))}
            </div>
          ))}

        {/* Key Nutrients — real curated data, expand to see foods */}
        {lens === "nutrients" &&
          (nutrientIndex.length === 0 ? (
            <EmptyLensState message={EMPTY_STATES.noKeyNutrients} />
          ) : (
            <div className="divide-y divide-border/30">
              {nutrientIndex.map((group) => {
                const open = openNutrient === group.nutrient;
                return (
                  <div key={group.nutrient}>
                    <button
                      onClick={() =>
                        setOpenNutrient(open ? null : group.nutrient)
                      }
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-muted/20 transition-colors text-left"
                      data-testid={`button-nutrient-${group.nutrient}`}
                    >
                      <span className="text-sm font-medium text-emerald-700/80 dark:text-emerald-400/80">
                        {group.nutrient}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground/55">
                        {group.foods.length}{" "}
                        {group.foods.length === 1 ? "food" : "foods"}
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform duration-150 ${
                            open ? "rotate-90" : ""
                          }`}
                        />
                      </span>
                    </button>
                    {open && (
                      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                        {group.foods.map((food) => (
                          <span
                            key={food}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-muted/40 text-foreground/70 border border-border/40"
                          >
                            {food}
                            {inPantry(food) && (
                              <span className="text-emerald-600/70 dark:text-emerald-400/70">
                                ✓
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        {/* Foods — real curated data */}
        {lens === "foods" &&
          (foods.length === 0 ? (
            <EmptyLensState message="No foods in the library yet." />
          ) : (
            <div className="divide-y divide-border/30">
              {foods.map((food) => (
                <div key={food.canonicalKey} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base leading-none" aria-hidden="true">
                      {getCategoryEmoji(food.category ?? undefined)}
                    </span>
                    <span className="text-sm font-medium text-foreground/90">
                      {food.displayName}
                    </span>
                    {inPantry(food.canonicalKey) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        In your pantry
                      </span>
                    )}
                  </div>

                  {/* Health Benefits — safe empty state until data populated */}
                  <p className="text-[11px] text-muted-foreground/35 italic mb-1.5">
                    {TERMINOLOGY.healthBenefits}:{" "}
                    {EMPTY_STATES.healthBenefitsComingSoon}
                  </p>

                  {food.keyNutrients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {food.keyNutrients.map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  )}

                  {food.summary && (
                    <p className="text-xs text-foreground/65 leading-relaxed">
                      {food.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* ── Cross-link back to the weekly report ────────────────────────── */}
      <div className="px-5 py-4 border-t border-border/30">
        <Link
          href="/plant-diversity"
          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          data-testid="link-view-plant-diversity"
        >
          <Leaf className="h-3.5 w-3.5" />
          See how your week scores in the Plant Diversity Report
        </Link>
      </div>

      {/* ── Disclaimer ──────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-border/30">
        <p className="text-[11px] text-muted-foreground/40 leading-relaxed">
          {HEALTH_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
