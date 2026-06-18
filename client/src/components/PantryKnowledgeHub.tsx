import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, X, ChevronLeft, ChevronRight, Leaf, Atom, Apple, Sparkles,
  Heart, Shield, Moon, Bone, Brain, Activity, Dumbbell, Zap, Eye, Clock,
  Smile, Flame, Sprout, type LucideIcon,
} from "lucide-react";
import { getCategoryEmoji } from "@/lib/ingredient-imagery";
import { HEALTH_DISCLAIMER } from "@/lib/health-benefits-model";

/**
 * WS1 — Pantry Explore V2 · Nutrition Knowledge Hub.
 *
 * A READ-ONLY view over the WS0 Nutrition Knowledge Registry (knowledge_* tables,
 * served by /api/knowledge/*). Users search and browse foods, nutrients and
 * health benefits, and drill into a food → its nutrients → other foods, etc.
 *
 * This is a KNOWLEDGE VIEW — not inventory, not the planner, not shopping. It
 * never writes, ranks or recommends. Sections the editorial registry does not
 * yet carry data for (timing, pairings, "your variety", meals) render as honest
 * "coming soon" placeholders rather than fabricating content.
 */

// ── Wire types (mirror the /api/knowledge/* display layer) ──────────────────────
interface FoodCard { slug: string; name: string; category: string; subcategory: string | null; description: string | null; }
interface BenefitChip { slug: string; name: string; icon: string | null; }
interface NutrientChip { slug: string; name: string; amount: string | null; }
interface NutrientLite { slug: string; name: string; category: string | null; }
interface CategoryCount { category: string; count: number; }

interface SearchResult { query: string; foods: FoodCard[]; nutrients: NutrientLite[]; benefits: BenefitChip[]; }
interface FoodDetail {
  food: { slug: string; name: string; category: string; subcategory: string | null; description: string | null;
    aliases: string[]; commonForms: string[]; storageGuidance: string | null; seasonality: string | null; imageUrl: string | null; };
  benefits: BenefitChip[];
  nutrients: NutrientChip[];
}
interface NutrientDetail { nutrient: { slug: string; name: string; description: string | null; category: string | null }; foods: FoodCard[]; benefits: BenefitChip[]; }
interface BenefitDetail { benefit: { slug: string; name: string; description: string | null; icon: string | null }; foods: FoodCard[]; }

// Health-benefit icons are stored as lucide names in WS0. Map to components.
const BENEFIT_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout, heart: Heart, shield: Shield, moon: Moon, bone: Bone, brain: Brain,
  activity: Activity, dumbbell: Dumbbell, sparkles: Sparkles, zap: Zap, eye: Eye,
  leaf: Leaf, clock: Clock, smile: Smile, flame: Flame,
};
function BenefitIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = (icon && BENEFIT_ICONS[icon]) || Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}

// ── Navigation model ───────────────────────────────────────────────────────────
type View =
  | { type: "browse" }
  | { type: "food"; slug: string }
  | { type: "nutrient"; slug: string }
  | { type: "benefit"; slug: string };

const PILL = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors";
const PILL_EMERALD = `${PILL} bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40`;
const PILL_MUTED = `${PILL} bg-muted/40 text-foreground/70 border-border/40 hover:text-foreground hover:border-border`;

export function PantryKnowledgeHub() {
  const [stack, setStack] = useState<View[]>([{ type: "browse" }]);
  const view = stack[stack.length - 1];

  const push = (v: View) => setStack((s) => [...s, v]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const reset = () => setStack([{ type: "browse" }]);

  return (
    <div className="rounded-2xl border border-border/50 bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-emerald-600/70 dark:text-emerald-400/70 flex-shrink-0" />
          <h2 className="text-base font-semibold">Nutrition Knowledge Hub</h2>
        </div>
        <p className="text-xs text-muted-foreground/55 mt-0.5">
          Explore foods, nutrients and health benefits. A knowledge view for "what could I add?"
        </p>
      </div>

      {view.type === "browse" && <BrowseView onOpen={push} />}
      {view.type === "food" && <FoodDetailView slug={view.slug} onBack={back} onHome={reset} onOpen={push} />}
      {view.type === "nutrient" && <NutrientDetailView slug={view.slug} onBack={back} onHome={reset} onOpen={push} />}
      {view.type === "benefit" && <BenefitDetailView slug={view.slug} onBack={back} onHome={reset} onOpen={push} />}

      {/* Disclaimer */}
      <div className="px-5 py-3 border-t border-border/30">
        <p className="text-[11px] text-muted-foreground/40 leading-relaxed">{HEALTH_DISCLAIMER}</p>
      </div>
    </div>
  );
}

// ── Browse: search + categories + food list ─────────────────────────────────────
function BrowseView({ onOpen }: { onOpen: (v: View) => void }) {
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQuery(raw.trim()), 200);
    return () => clearTimeout(t);
  }, [raw]);

  const searching = query.length > 0;

  const { data: categories = [] } = useQuery<CategoryCount[]>({ queryKey: ["/api/knowledge/categories"] });

  const foodsUrl = activeCategory
    ? `/api/knowledge/foods?category=${encodeURIComponent(activeCategory)}`
    : "/api/knowledge/foods";
  const { data: foods = [], isLoading: foodsLoading } = useQuery<FoodCard[]>({
    queryKey: [foodsUrl],
    enabled: !searching,
  });

  const { data: results, isLoading: searchLoading } = useQuery<SearchResult>({
    queryKey: [`/api/knowledge/search?q=${encodeURIComponent(query)}`],
    enabled: searching,
  });

  return (
    <div>
      {/* Search */}
      <div className="px-5 py-3 border-b border-border/50 bg-muted/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Search a food, nutrient or health benefit…"
            className="w-full h-9 pl-9 pr-9 text-sm rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            data-testid="input-knowledge-search"
          />
          {raw && (
            <button
              onClick={() => setRaw("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
              aria-label="Clear search"
              data-testid="button-knowledge-search-clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {searching ? (
        <SearchResults results={results} loading={searchLoading} onOpen={onOpen} />
      ) : (
        <>
          {/* Categories */}
          <div className="px-5 py-3 border-b border-border/50">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={activeCategory === null ? PILL_EMERALD : PILL_MUTED}
                data-testid="button-category-all"
              >
                All foods
              </button>
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => setActiveCategory(c.category)}
                  className={activeCategory === c.category ? PILL_EMERALD : PILL_MUTED}
                  data-testid={`button-category-${c.category}`}
                >
                  <span aria-hidden="true">{getCategoryEmoji(c.category)}</span>
                  {c.category}
                  <span className="text-muted-foreground/50">{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Food list */}
          {foodsLoading ? (
            <Empty message="Loading foods…" />
          ) : foods.length === 0 ? (
            <Empty message="No foods here yet." />
          ) : (
            <ul className="divide-y divide-border/30">
              {foods.map((f) => (
                <FoodRow key={f.slug} food={f} onOpen={() => onOpen({ type: "food", slug: f.slug })} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function SearchResults({ results, loading, onOpen }: { results?: SearchResult; loading: boolean; onOpen: (v: View) => void }) {
  const total = results ? results.foods.length + results.nutrients.length + results.benefits.length : 0;
  if (loading) return <Empty message="Searching…" />;
  if (!results || total === 0) return <Empty message="Nothing matched. Try another word." />;

  return (
    <div className="divide-y divide-border/30">
      {results.benefits.length > 0 && (
        <Section title="Health Benefits" icon={Heart}>
          <div className="flex flex-wrap gap-1.5">
            {results.benefits.map((b) => (
              <button key={b.slug} className={PILL_MUTED} onClick={() => onOpen({ type: "benefit", slug: b.slug })}
                data-testid={`result-benefit-${b.slug}`}>
                <BenefitIcon icon={b.icon} className="h-3 w-3" />
                {b.name}
              </button>
            ))}
          </div>
        </Section>
      )}
      {results.nutrients.length > 0 && (
        <Section title="Key Nutrients" icon={Atom}>
          <div className="flex flex-wrap gap-1.5">
            {results.nutrients.map((n) => (
              <button key={n.slug} className={PILL_MUTED} onClick={() => onOpen({ type: "nutrient", slug: n.slug })}
                data-testid={`result-nutrient-${n.slug}`}>
                {n.name}
              </button>
            ))}
          </div>
        </Section>
      )}
      {results.foods.length > 0 && (
        <Section title="Foods" icon={Apple}>
          <ul className="-mx-5 divide-y divide-border/30 border-t border-border/30">
            {results.foods.map((f) => (
              <FoodRow key={f.slug} food={f} onOpen={() => onOpen({ type: "food", slug: f.slug })} />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

// ── Food detail card ─────────────────────────────────────────────────────────────
function FoodDetailView({ slug, onBack, onHome, onOpen }: DetailProps) {
  const { data, isLoading } = useQuery<FoodDetail>({ queryKey: ["/api/knowledge/foods", slug] });

  if (isLoading) return <DetailShell onBack={onBack} onHome={onHome} title="Loading…"><Empty message="" /></DetailShell>;
  if (!data) return <DetailShell onBack={onBack} onHome={onHome} title="Not found"><Empty message="This food isn't in the library." /></DetailShell>;

  const { food, benefits, nutrients } = data;
  const hasContext = food.seasonality || food.storageGuidance || food.commonForms.length > 0;

  return (
    <DetailShell onBack={onBack} onHome={onHome} title={food.name} emoji={getCategoryEmoji(food.category)} subtitle={food.subcategory ?? food.category}>
      {food.description && <p className="text-sm text-foreground/75 leading-relaxed mb-4">{food.description}</p>}

      {benefits.length > 0 && (
        <CardSection title="Health Benefits">
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((b) => (
              <button key={b.slug} className={PILL_EMERALD} onClick={() => onOpen({ type: "benefit", slug: b.slug })}
                data-testid={`food-benefit-${b.slug}`}>
                <BenefitIcon icon={b.icon} className="h-3 w-3" />
                {b.name}
              </button>
            ))}
          </div>
        </CardSection>
      )}

      {nutrients.length > 0 && (
        <CardSection title="Key Nutrients">
          <div className="flex flex-wrap gap-1.5">
            {nutrients.map((n) => (
              <button key={n.slug} className={PILL_MUTED} onClick={() => onOpen({ type: "nutrient", slug: n.slug })}
                data-testid={`food-nutrient-${n.slug}`}>
                {n.name}
                {n.amount && <span className="text-muted-foreground/50">· {n.amount}</span>}
              </button>
            ))}
          </div>
        </CardSection>
      )}

      {hasContext && (
        <CardSection title="Nutrition Context">
          <dl className="space-y-1.5 text-xs">
            {food.seasonality && <ContextRow label="In season" value={food.seasonality} />}
            {food.commonForms.length > 0 && <ContextRow label="Common forms" value={food.commonForms.join(", ")} />}
            {food.storageGuidance && <ContextRow label="Storage" value={food.storageGuidance} />}
          </dl>
        </CardSection>
      )}

      {/* Sections the WS0 registry does not yet carry data for. */}
      <ComingSoon title="Best Time" hint="When in the day this food fits best" />
      <ComingSoon title="Best Pairings" hint="Foods that go well together" />
      <ComingSoon title="Things To Be Aware Of" hint="Editorial notes" />
      <ComingSoon title="Your Variety" hint="How this fits your recent plants" />
      <ComingSoon title="Meals" hint="Meals that feature this food" />
    </DetailShell>
  );
}

// ── Nutrient detail ──────────────────────────────────────────────────────────────
function NutrientDetailView({ slug, onBack, onHome, onOpen }: DetailProps) {
  const { data, isLoading } = useQuery<NutrientDetail>({ queryKey: ["/api/knowledge/nutrients", slug] });
  if (isLoading) return <DetailShell onBack={onBack} onHome={onHome} title="Loading…"><Empty message="" /></DetailShell>;
  if (!data) return <DetailShell onBack={onBack} onHome={onHome} title="Not found"><Empty message="This nutrient isn't in the library." /></DetailShell>;

  const { nutrient, foods, benefits } = data;
  return (
    <DetailShell onBack={onBack} onHome={onHome} title={nutrient.name} emoji="⚛️" subtitle={nutrient.category ?? "Nutrient"}>
      {nutrient.description && <p className="text-sm text-foreground/75 leading-relaxed mb-4">{nutrient.description}</p>}

      {benefits.length > 0 && (
        <CardSection title="Linked Health Benefits">
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((b) => (
              <button key={b.slug} className={PILL_EMERALD} onClick={() => onOpen({ type: "benefit", slug: b.slug })}
                data-testid={`nutrient-benefit-${b.slug}`}>
                <BenefitIcon icon={b.icon} className="h-3 w-3" />
                {b.name}
              </button>
            ))}
          </div>
        </CardSection>
      )}

      {foods.length > 0 && (
        <CardSection title="Foods Rich In This">
          <ul className="-mx-5 divide-y divide-border/30 border-t border-border/30">
            {foods.map((f) => (
              <FoodRow key={f.slug} food={f} onOpen={() => onOpen({ type: "food", slug: f.slug })} />
            ))}
          </ul>
        </CardSection>
      )}
    </DetailShell>
  );
}

// ── Benefit detail ───────────────────────────────────────────────────────────────
function BenefitDetailView({ slug, onBack, onHome, onOpen }: DetailProps) {
  const { data, isLoading } = useQuery<BenefitDetail>({ queryKey: ["/api/knowledge/benefits", slug] });
  if (isLoading) return <DetailShell onBack={onBack} onHome={onHome} title="Loading…"><Empty message="" /></DetailShell>;
  if (!data) return <DetailShell onBack={onBack} onHome={onHome} title="Not found"><Empty message="This benefit isn't in the library." /></DetailShell>;

  const { benefit, foods } = data;
  return (
    <DetailShell onBack={onBack} onHome={onHome} title={benefit.name} icon={<BenefitIcon icon={benefit.icon} className="h-5 w-5 text-emerald-600/80" />} subtitle="Health benefit">
      {benefit.description && <p className="text-sm text-foreground/75 leading-relaxed mb-4">{benefit.description}</p>}
      {foods.length > 0 ? (
        <CardSection title="Foods That Support This">
          <ul className="-mx-5 divide-y divide-border/30 border-t border-border/30">
            {foods.map((f) => (
              <FoodRow key={f.slug} food={f} onOpen={() => onOpen({ type: "food", slug: f.slug })} />
            ))}
          </ul>
        </CardSection>
      ) : (
        <Empty message="No foods linked yet." />
      )}
    </DetailShell>
  );
}

// ── Shared building blocks ───────────────────────────────────────────────────────
interface DetailProps { slug: string; onBack: () => void; onHome: () => void; onOpen: (v: View) => void; }

function DetailShell({
  title, subtitle, emoji, icon, onBack, onHome, children,
}: {
  title: string; subtitle?: string; emoji?: string; icon?: React.ReactNode;
  onBack: () => void; onHome: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-5 py-2.5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground" data-testid="button-detail-back">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-muted-foreground/30">/</span>
        <button onClick={onHome} className="text-xs text-muted-foreground/60 hover:text-foreground" data-testid="button-detail-home">
          Explore
        </button>
      </div>
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          {icon ?? (emoji && <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>)}
          <div>
            <h3 className="text-lg font-semibold leading-tight" data-testid="text-detail-title">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground/55">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

function FoodRow({ food, onOpen }: { food: FoodCard; onOpen: () => void }) {
  return (
    <li>
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors text-left"
        data-testid={`button-food-${food.slug}`}
      >
        <span className="text-lg leading-none flex-shrink-0" aria-hidden="true">{getCategoryEmoji(food.category)}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground/90 truncate">{food.name}</span>
          <span className="block text-[11px] text-muted-foreground/50 truncate">{food.subcategory ?? food.category}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
      </button>
    </li>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide mb-2">{title}</h4>
      {children}
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground/55 flex-shrink-0 w-24">{label}</dt>
      <dd className="text-foreground/75">{value}</dd>
    </div>
  );
}

function ComingSoon({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-3 opacity-60">
      <h4 className="text-xs font-semibold text-muted-foreground/55 uppercase tracking-wide">{title}</h4>
      <p className="text-[11px] text-muted-foreground/40 italic">{hint} — coming soon</p>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <Sparkles className="h-5 w-5 mx-auto text-muted-foreground/30 mb-2" />
      {message && <p className="text-sm text-muted-foreground/50">{message}</p>}
    </div>
  );
}
