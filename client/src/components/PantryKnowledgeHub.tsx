import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, X, ChevronLeft, ChevronRight, Leaf, Atom, Apple, Sparkles,
  Heart, Shield, Moon, Bone, Brain, Activity, Dumbbell, Zap, Eye, Clock,
  Smile, Flame, Sprout, ChevronDown, type LucideIcon,
} from "lucide-react";
import { getCategoryEmoji } from "@/lib/ingredient-imagery";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { HEALTH_DISCLAIMER } from "@/lib/health-benefits-model";
import { semanticSurface, semanticText } from "@/components/intelligence/intelligence-tokens";

/**
 * WS2 — Pantry Explore V2.
 *
 * Home of Food: a warm, read-only presentation layer over WS8–WS11 engines
 * and the WS0/WS1 Nutrition Knowledge Registry.
 *
 * Structure:
 *   Home → Search / Recent / This Season / Discover / Your Household / Explore Topics
 *   Food Page → Hero / Benefits / Nutrients / Varieties / Discover / Alternatives / Stories / Seasonal
 *
 * Trust rules (enforced, not aspirational):
 *   • No scores, rankings, grades, percentages anywhere.
 *   • Reasons/headlines rendered verbatim from engine output.
 *   • Empty sections are silent (never "nothing yet").
 *   • Chips are positive-only (favourite / in-season).
 *   • No familiar / source / internal engine metadata exposed.
 */

// ── Wire types (knowledge spine) ───────────────────────────────────────────────
interface FoodCard { slug: string; name: string; category: string; subcategory: string | null; description: string | null; }
interface BenefitChip { slug: string; name: string; icon: string | null; }
interface NutrientChip { slug: string; name: string; amount: string | null; }
interface NutrientLite { slug: string; name: string; category: string | null; }
interface CategoryCount { category: string; count: number; }
interface SearchResult { query: string; foods: FoodCard[]; nutrients: NutrientLite[]; benefits: BenefitChip[]; }
interface FoodDetail {
  food: {
    slug: string; name: string; category: string; subcategory: string | null;
    description: string | null; aliases: string[]; commonForms: string[];
    storageGuidance: string | null; seasonality: string | null; imageUrl: string | null;
  };
  benefits: BenefitChip[];
  nutrients: NutrientChip[];
}
interface NutrientDetail { nutrient: { slug: string; name: string; description: string | null; category: string | null }; foods: FoodCard[]; benefits: BenefitChip[]; }
interface BenefitDetail { benefit: { slug: string; name: string; description: string | null; icon: string | null }; foods: FoodCard[]; }

// ── Wire types (engine display layer — server-stripped) ─────────────────────────
interface DiscoverySuggestion { slug: string; name: string; type: string; reason: string; }
interface DiscoverySection { type: string; title: string; suggestions: DiscoverySuggestion[]; }
interface DiscoveryResult { anchor: { slug: string; name: string } | null; sections: DiscoverySection[]; }

interface AlternativeOption { slug: string; name: string; type: string; reason: string; note?: string; suitableFor: string[]; }
interface AlternativeSection { type: string; title: string; options: AlternativeOption[]; }
interface AlternativesResult { anchor: { slug: string; name: string } | null; sections: AlternativeSection[]; }

interface StoryFact { text: string; }
interface StoryCard { headline: string; facts: StoryFact[]; slug?: string; name?: string; }
interface StorySection { type: string; title: string; cards: StoryCard[]; }
interface StoriesResult { sections: StorySection[]; }

interface SeasonalBlock { type: string; title: string; cards: StoryCard[]; }
interface SeasonalStory { season: string; year: number; label: string; blocks: SeasonalBlock[]; }

// ── Benefit icons ────────────────────────────────────────────────────────────────
const BENEFIT_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout, heart: Heart, shield: Shield, moon: Moon, bone: Bone, brain: Brain,
  activity: Activity, dumbbell: Dumbbell, sparkles: Sparkles, zap: Zap, eye: Eye,
  leaf: Leaf, clock: Clock, smile: Smile, flame: Flame,
};
function BenefitIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = (icon && BENEFIT_ICONS[icon]) || Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}

// ── Navigation model ──────────────────────────────────────────────────────────────
type View =
  | { type: "home" }
  | { type: "browse" }
  | { type: "food"; slug: string }
  | { type: "nutrient"; slug: string }
  | { type: "benefit"; slug: string }
  | { type: "topic"; id: string };

// ── Style constants ────────────────────────────────────────────────────────────────
//
// PX1-W4b (fnd-px-ad-hoc-semantic-tints): the tints below were raw palette classes —
// this file's own private answer to "what colour is a notice", decided again here
// after `intelligence-tokens` had already decided it. The SHAPE stays local (these
// pills are bigger than a chip); only the TONE is now borrowed from the one owner,
// keyed by meaning rather than by hue. Three of the surfaces below had drifted apart
// even within this file — two of them forgot their dark border entirely.
const PILL = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors";
const PILL_POSITIVE = `${PILL} ${semanticSurface.positive} ${semanticText.positive}`;
const PILL_MUTED = `${PILL} bg-muted/40 text-foreground/70 border-border/40 hover:text-foreground hover:border-border`;
const PILL_NOTICE = `${PILL} ${semanticSurface.notice} ${semanticText.notice}`;
const PILL_INFO = `${PILL} ${semanticSurface.info} ${semanticText.info}`;

/** A tinted panel: one rounded surface, one tone, one owner. */
const NOTICE_PANEL = `rounded-xl border p-4 ${semanticSurface.notice}`;
const POSITIVE_PANEL = `rounded-xl border p-4 space-y-2 ${semanticSurface.positive}`;

// ── Explore Topics editorial manifest ─────────────────────────────────────────────
// Contents are always derived — only title / icon / query are editorial.
const EXPLORE_TOPICS = [
  { id: "mediterranean",     label: "Mediterranean",      icon: "🫒", searchQuery: "mediterranean" },
  { id: "healthy-fats",      label: "Healthy fats",       icon: "🥑", searchQuery: "healthy fats" },
  { id: "plant-protein",     label: "Plant protein",      icon: "🫘", searchQuery: "plant protein" },
  { id: "better-sleep",      label: "Better sleep",       icon: "🌙", searchQuery: "better sleep" },
  { id: "gut-health",        label: "Gut health",         icon: "🌱", searchQuery: "gut health" },
  { id: "family-favourites", label: "Family favourites",  icon: "❤️",  searchQuery: "", kind: "stories" as const },
  { id: "seasonal-foods",    label: "Seasonal foods",     icon: "🌿", searchQuery: "", kind: "seasonal" as const },
] as const;

// ── Recent foods (localStorage) ────────────────────────────────────────────────────
const RECENT_KEY = "pantry-explore-recent-v2";
const RECENT_MAX = 8;

function getRecentSlugs(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}

function recordRecentSlug(slug: string) {
  const current = getRecentSlugs().filter(s => s !== slug);
  const next = [slug, ...current].slice(0, RECENT_MAX);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
}

// ── Main component ─────────────────────────────────────────────────────────────────
export function PantryKnowledgeHub() {
  const [stack, setStack] = useState<View[]>([{ type: "home" }]);
  const view = stack[stack.length - 1];

  const push = useCallback((v: View) => setStack(s => [...s, v]), []);
  const back = useCallback(() => setStack(s => s.length > 1 ? s.slice(0, -1) : s), []);
  const reset = useCallback(() => setStack([{ type: "home" }]), []);

  // Track recent food views
  const openFood = useCallback((slug: string) => {
    recordRecentSlug(slug);
    push({ type: "food", slug });
  }, [push]);

  const showDisclaimer = view.type === "food" || view.type === "nutrient" || view.type === "benefit";

  return (
    <div className="rounded-2xl border border-border/50 bg-background overflow-hidden">
      {view.type === "home"    && <HomeView onOpenFood={openFood} onPush={push} />}
      {view.type === "browse"  && <BrowseView onOpenFood={openFood} onBack={back} onPush={push} />}
      {view.type === "topic"   && <TopicView id={view.id} onOpenFood={openFood} onBack={back} />}
      {view.type === "food"    && <FoodDetailView slug={view.slug} onBack={back} onHome={reset} onPush={push} />}
      {view.type === "nutrient" && <NutrientDetailView slug={view.slug} onBack={back} onHome={reset} onPush={push} />}
      {view.type === "benefit" && <BenefitDetailView slug={view.slug} onBack={back} onHome={reset} onPush={push} />}

      {showDisclaimer && (
        <div className="px-5 py-3 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground/40 leading-relaxed">{HEALTH_DISCLAIMER}</p>
        </div>
      )}
    </div>
  );
}

// ── Home View ──────────────────────────────────────────────────────────────────────
function HomeView({ onOpenFood, onPush }: { onOpenFood: (slug: string) => void; onPush: (v: View) => void }) {
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQuery(raw.trim()), 200);
    return () => clearTimeout(t);
  }, [raw]);

  // Load recently viewed slugs from localStorage
  useEffect(() => { setRecentSlugs(getRecentSlugs()); }, []);

  const searching = query.length > 0;

  const { data: searchData, isPending: searchLoading } = useQuery<SearchResult>({
    queryKey: [`/api/knowledge/search?q=${encodeURIComponent(query)}`],
    enabled: searching,
  });

  const { data: seasonalData } = useQuery<SeasonalStory>({
    queryKey: ["/api/pantry/seasonal"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: discoverData } = useQuery<DiscoveryResult>({
    queryKey: ["/api/pantry/discover"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: storiesData } = useQuery<StoriesResult>({
    queryKey: ["/api/pantry/stories"],
    staleTime: 5 * 60 * 1000,
  });

  // Recent food card data (slugs → knowledge cards)
  const { data: allFoods = [] } = useQuery<FoodCard[]>({
    queryKey: ["/api/knowledge/foods"],
    enabled: recentSlugs.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const recentFoods = useMemo(() =>
    recentSlugs
      .map(slug => allFoods.find(f => f.slug === slug))
      .filter(Boolean)
      .slice(0, 3) as FoodCard[],
    [recentSlugs, allFoods]
  );

  // Seasonal hero: prefer seasonal_habits + looking_ahead blocks
  const seasonalHabitsBlock = seasonalData?.blocks.find(b => b.type === "seasonal_habits");
  const lookingAheadBlock = seasonalData?.blocks.find(b => b.type === "looking_ahead");
  const hasSeasonalContent = seasonalData && (seasonalHabitsBlock || lookingAheadBlock || seasonalData.blocks.length > 0);

  // Home story: first card from any section
  const homeStoryCard = storiesData?.sections[0]?.cards[0];

  // Discover: first section, max 3 suggestions
  const discoverSection = discoverData?.sections[0];

  return (
    <div>
      {/* 1. Search — always first */}
      <div className="px-5 py-4 border-b border-border/50 bg-muted/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <input
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder="Search foods…"
            className="w-full h-10 pl-9 pr-9 text-sm rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            data-testid="input-explore-search"
          />
          {raw && (
            <button
              onClick={() => setRaw("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {searching ? (
        <HomeSearchResults results={searchData} loading={searchLoading} onOpenFood={onOpenFood} onPush={onPush} />
      ) : (
        <div className="divide-y divide-border/30">

          {/* 2. Recent */}
          {recentFoods.length > 0 && (
            <HomeSection title="Recent">
              <div className="flex flex-wrap gap-2">
                {recentFoods.map(food => (
                  <button
                    key={food.slug}
                    onClick={() => onOpenFood(food.slug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-muted/30 hover:bg-muted/60 text-sm transition-colors"
                    data-testid={`button-recent-${food.slug}`}
                  >
                    <span aria-hidden="true">{getCategoryEmoji(food.category)}</span>
                    {food.name}
                  </button>
                ))}
              </div>
            </HomeSection>
          )}

          {/* 3. This Season */}
          {hasSeasonalContent && (
            <HomeSection title={`This season · ${seasonalData!.label}`} icon="🌿">
              <div className={POSITIVE_PANEL}>
                {seasonalHabitsBlock && seasonalHabitsBlock.cards.slice(0, 2).map((card, i) => (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed">{card.headline}</p>
                ))}
                {!seasonalHabitsBlock && seasonalData!.blocks[0]?.cards.slice(0, 1).map((card, i) => (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed">{card.headline}</p>
                ))}
                {lookingAheadBlock && lookingAheadBlock.cards.slice(0, 1).map((card, i) => (
                  <p key={i} className="text-[12px] text-muted-foreground/70 leading-relaxed italic">{card.headline}</p>
                ))}
              </div>
            </HomeSection>
          )}

          {/* 4. Discover */}
          {discoverSection && discoverSection.suggestions.length > 0 && (
            <HomeSection title="Discover — you might enjoy">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {discoverSection.suggestions.slice(0, 3).map(s => (
                  <button
                    key={s.slug}
                    onClick={() => onOpenFood(s.slug)}
                    className="flex flex-col gap-1 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 text-left transition-colors"
                    data-testid={`button-discover-${s.slug}`}
                  >
                    <span className="text-xl leading-none" aria-hidden="true">{getCategoryEmoji("")}</span>
                    <span className="text-sm font-medium truncate">{s.name}</span>
                    <span className="text-[11px] text-muted-foreground/60 leading-snug line-clamp-2">{s.reason}</span>
                  </button>
                ))}
              </div>
            </HomeSection>
          )}

          {/* 5. Your Household */}
          {homeStoryCard && (
            <HomeSection title="Your household">
              <div className={NOTICE_PANEL}>
                <p className="text-sm text-foreground/80 leading-relaxed">{homeStoryCard.headline}</p>
              </div>
            </HomeSection>
          )}

          {/* 6. Explore Topics */}
          <HomeSection title="Explore">
            <div className="flex flex-wrap gap-2">
              {EXPLORE_TOPICS.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => onPush({ type: "topic", id: topic.id })}
                  className={PILL_MUTED}
                  data-testid={`button-topic-${topic.id}`}
                >
                  <span aria-hidden="true">{topic.icon}</span>
                  {topic.label}
                </button>
              ))}
              <button
                onClick={() => onPush({ type: "browse" })}
                className={PILL_MUTED}
                data-testid="button-browse-all"
              >
                <Leaf className="h-3 w-3" />
                All foods
              </button>
            </div>
          </HomeSection>
        </div>
      )}
    </div>
  );
}

function HomeSearchResults({
  results, loading, onOpenFood, onPush,
}: {
  results?: SearchResult; loading: boolean;
  onOpenFood: (slug: string) => void; onPush: (v: View) => void;
}) {
  if (loading) return <HubLoading />;
  if (!results) return null;
  const total = results.foods.length + results.nutrients.length + results.benefits.length;
  if (total === 0) return <EmptyState variant="filtered" size="compact" icon={Sparkles} title="Nothing matched — try another word." />;

  return (
    <div className="divide-y divide-border/30">
      {results.foods.length > 0 && (
        <div>
          <ul className="divide-y divide-border/30">
            {results.foods.map(f => (
              <FoodRow key={f.slug} food={f} onOpen={() => onOpenFood(f.slug)} />
            ))}
          </ul>
        </div>
      )}
      {results.benefits.length > 0 && (
        <div className="px-5 py-3">
          <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground/50 mb-2">Health benefits</p>
          <div className="flex flex-wrap gap-1.5">
            {results.benefits.map(b => (
              <button key={b.slug} className={PILL_MUTED}
                onClick={() => onPush({ type: "benefit", slug: b.slug })}
                data-testid={`result-benefit-${b.slug}`}>
                <BenefitIcon icon={b.icon} className="h-3 w-3" />
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {results.nutrients.length > 0 && (
        <div className="px-5 py-3">
          <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground/50 mb-2">Key nutrients</p>
          <div className="flex flex-wrap gap-1.5">
            {results.nutrients.map(n => (
              <button key={n.slug} className={PILL_MUTED}
                onClick={() => onPush({ type: "nutrient", slug: n.slug })}
                data-testid={`result-nutrient-${n.slug}`}>
                {n.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Browse View (accessible from "All foods" tile on Home) ─────────────────────────
function BrowseView({
  onOpenFood, onBack, onPush,
}: {
  onOpenFood: (slug: string) => void; onBack: () => void; onPush: (v: View) => void;
}) {
  const [raw, setRaw] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(raw.trim()), 200);
    return () => clearTimeout(t);
  }, [raw]);

  const searching = query.length > 0;

  const { data: categories = [] } = useQuery<CategoryCount[]>({ queryKey: ["/api/knowledge/categories"] });

  const foodsUrl = activeCategory
    ? `/api/knowledge/foods?category=${encodeURIComponent(activeCategory)}`
    : "/api/knowledge/foods";
  const { data: foods = [], isPending: foodsLoading } = useQuery<FoodCard[]>({
    queryKey: [foodsUrl],
    enabled: !searching,
  });

  const { data: results, isPending: searchLoading } = useQuery<SearchResult>({
    queryKey: [`/api/knowledge/search?q=${encodeURIComponent(query)}`],
    enabled: searching,
  });

  return (
    <div>
      <div className="px-5 py-2.5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground" data-testid="button-browse-back">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-xs text-muted-foreground/40 ml-1">All foods</span>
      </div>

      <div className="px-5 py-3 border-b border-border/50 bg-muted/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <input
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder="Search a food, nutrient or health benefit…"
            className="w-full h-9 pl-9 pr-9 text-sm rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            data-testid="input-knowledge-search"
          />
          {raw && (
            <button onClick={() => setRaw("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {searching ? (
        <BrowseSearchResults results={results} loading={searchLoading} onOpenFood={onOpenFood} onPush={onPush} />
      ) : (
        <>
          <div className="px-5 py-3 border-b border-border/50">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setActiveCategory(null)} className={activeCategory === null ? PILL_POSITIVE : PILL_MUTED} data-testid="button-category-all">All foods</button>
              {categories.map(c => (
                <button key={c.category} onClick={() => setActiveCategory(c.category)}
                  className={activeCategory === c.category ? PILL_POSITIVE : PILL_MUTED}
                  data-testid={`button-category-${c.category}`}>
                  <span aria-hidden="true">{getCategoryEmoji(c.category)}</span>
                  {c.category}
                  <span className="text-muted-foreground/50">{c.count}</span>
                </button>
              ))}
            </div>
          </div>
          {foodsLoading ? <HubLoading /> : foods.length === 0 ? <EmptyState variant="empty" size="compact" icon={Sparkles} title="No foods here yet." /> : (
            <ul className="divide-y divide-border/30">
              {foods.map(f => <FoodRow key={f.slug} food={f} onOpen={() => onOpenFood(f.slug)} />)}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function BrowseSearchResults({
  results, loading, onOpenFood, onPush,
}: { results?: SearchResult; loading: boolean; onOpenFood: (slug: string) => void; onPush: (v: View) => void; }) {
  const total = results ? results.foods.length + results.nutrients.length + results.benefits.length : 0;
  if (loading) return <HubLoading />;
  if (!results || total === 0) return <EmptyState variant="filtered" size="compact" icon={Sparkles} title="Nothing matched. Try another word." />;

  return (
    <div className="divide-y divide-border/30">
      {results.benefits.length > 0 && (
        <SectionBlock title="Health Benefits" icon={Heart}>
          <div className="flex flex-wrap gap-1.5">
            {results.benefits.map(b => (
              <button key={b.slug} className={PILL_MUTED} onClick={() => onPush({ type: "benefit", slug: b.slug })} data-testid={`result-benefit-${b.slug}`}>
                <BenefitIcon icon={b.icon} className="h-3 w-3" />
                {b.name}
              </button>
            ))}
          </div>
        </SectionBlock>
      )}
      {results.nutrients.length > 0 && (
        <SectionBlock title="Key Nutrients" icon={Atom}>
          <div className="flex flex-wrap gap-1.5">
            {results.nutrients.map(n => (
              <button key={n.slug} className={PILL_MUTED} onClick={() => onPush({ type: "nutrient", slug: n.slug })} data-testid={`result-nutrient-${n.slug}`}>
                {n.name}
              </button>
            ))}
          </div>
        </SectionBlock>
      )}
      {results.foods.length > 0 && (
        <SectionBlock title="Foods" icon={Apple}>
          <ul className="-mx-5 divide-y divide-border/30 border-t border-border/30">
            {results.foods.map(f => <FoodRow key={f.slug} food={f} onOpen={() => onOpenFood(f.slug)} />)}
          </ul>
        </SectionBlock>
      )}
    </div>
  );
}

// ── Topic View ─────────────────────────────────────────────────────────────────────
function TopicView({ id, onOpenFood, onBack }: { id: string; onOpenFood: (slug: string) => void; onBack: () => void; }) {
  const topic = EXPLORE_TOPICS.find(t => t.id === id);
  if (!topic) return null;

  const kind = "kind" in topic ? topic.kind : undefined;

  // Knowledge-search topics
  const { data: searchResults } = useQuery<SearchResult>({
    queryKey: [`/api/knowledge/search?q=${encodeURIComponent(topic.searchQuery)}`],
    enabled: !kind && topic.searchQuery.length > 0,
  });

  // Stories-based topics (family favourites)
  const { data: storiesData } = useQuery<StoriesResult>({
    queryKey: ["/api/pantry/stories"],
    enabled: kind === "stories",
    staleTime: 5 * 60 * 1000,
  });

  // Seasonal-based topics
  const { data: discoverData } = useQuery<DiscoveryResult>({
    queryKey: ["/api/pantry/discover"],
    enabled: kind === "seasonal",
    staleTime: 5 * 60 * 1000,
  });

  const foods = searchResults?.foods ?? [];

  // Favourite foods from stories
  const favouriteSection = storiesData?.sections.find(s => s.type === "favourite_foods");

  // Seasonal foods from discover
  const seasonalSection = discoverData?.sections.find(s => s.type === "seasonal");

  return (
    <div>
      <div className="px-5 py-2.5 border-b border-border/50 bg-muted/10 flex items-center gap-2">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground" data-testid="button-topic-back">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60 ml-1">
          <span aria-hidden="true">{topic.icon}</span>
          {topic.label}
        </span>
      </div>

      {kind === "stories" && (
        favouriteSection && favouriteSection.cards.length > 0 ? (
          <div className="px-5 py-4 space-y-3">
            {favouriteSection.cards.map((card, i) => (
              <div key={i} className={NOTICE_PANEL}>
                <p className="text-sm text-foreground/80 leading-relaxed">{card.headline}</p>
              </div>
            ))}
          </div>
        ) : <EmptyState variant="unavailable" size="compact" icon={Sparkles} title="Nothing to show here yet." />
      )}

      {kind === "seasonal" && (
        seasonalSection && seasonalSection.suggestions.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-5 py-4">
            {seasonalSection.suggestions.slice(0, 6).map(s => (
              <button key={s.slug} onClick={() => onOpenFood(s.slug)}
                className="flex flex-col gap-1 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 text-left transition-colors"
                data-testid={`button-topic-seasonal-${s.slug}`}>
                <span className="text-xl leading-none" aria-hidden="true">{getCategoryEmoji("")}</span>
                <span className="text-sm font-medium truncate">{s.name}</span>
                <span className="text-[11px] text-muted-foreground/60 line-clamp-2">{s.reason}</span>
              </button>
            ))}
          </div>
        ) : <EmptyState variant="unavailable" size="compact" icon={Sparkles} title="Nothing to show here yet." />
      )}

      {!kind && (
        foods.length > 0 ? (
          <ul className="divide-y divide-border/30">
            {foods.map(f => <FoodRow key={f.slug} food={f} onOpen={() => onOpenFood(f.slug)} />)}
          </ul>
        ) : <EmptyState variant="unavailable" size="compact" icon={Sparkles} title="Nothing to show here yet." />
      )}
    </div>
  );
}

// ── Food Detail View (enhanced with WS8–WS11 engine sections) ─────────────────────
function FoodDetailView({
  slug, onBack, onHome, onPush,
}: { slug: string; onBack: () => void; onHome: () => void; onPush: (v: View) => void; }) {
  const { data, isPending: isLoading } = useQuery<FoodDetail>({ queryKey: ["/api/knowledge/foods", slug] });
  const [openDiet, setOpenDiet] = useState<string | null>(null);

  const { data: discoverData } = useQuery<DiscoveryResult>({
    queryKey: [`/api/pantry/discover?food=${encodeURIComponent(slug)}`],
    staleTime: 5 * 60 * 1000,
  });

  const { data: altData } = useQuery<AlternativesResult>({
    queryKey: openDiet
      ? [`/api/pantry/alternatives?food=${encodeURIComponent(slug)}&diet=${openDiet}`]
      : [`/api/pantry/alternatives?food=${encodeURIComponent(slug)}`],
    enabled: openDiet !== null,
    staleTime: 5 * 60 * 1000,
  });

  const { data: storiesData } = useQuery<StoriesResult>({
    queryKey: [`/api/pantry/stories?food=${encodeURIComponent(slug)}`],
    staleTime: 5 * 60 * 1000,
  });

  const { data: seasonalData } = useQuery<SeasonalStory>({
    queryKey: ["/api/pantry/seasonal"],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <DetailShell onBack={onBack} onHome={onHome} title="Loading…"><HubLoading /></DetailShell>;
  if (!data) return <DetailShell onBack={onBack} onHome={onHome} title="Not found"><EmptyState variant="unavailable" size="compact" icon={Sparkles} title="This food isn't in the library." /></DetailShell>;

  const { food, benefits, nutrients } = data;

  // Seasonal chip: is this food in season right now?
  const seasonalHabitsBlock = seasonalData?.blocks.find(b => b.type === "seasonal_habits");
  const lookingAheadBlock = seasonalData?.blocks.find(b => b.type === "looking_ahead");
  const seasonLabel = food.seasonality;

  const DIET_OPTIONS = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "dairy_free",  label: "Dairy-free" },
    { id: "keto",        label: "Keto" },
    { id: "lower_upf",   label: "Lower UPF" },
  ] as const;

  return (
    <DetailShell onBack={onBack} onHome={onHome} title={food.name} emoji={getCategoryEmoji(food.category)} subtitle={food.subcategory ?? food.category}>

      {/* 1. Hero chips (seasonal / positive-only) */}
      {seasonLabel && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={PILL_INFO}>🌿 {seasonLabel}</span>
        </div>
      )}

      {/* Description */}
      {food.description && <p className="text-sm text-foreground/75 leading-relaxed mb-4">{food.description}</p>}

      {/* 2. Benefits */}
      {benefits.length > 0 && (
        <FoodSection title="Benefits">
          <div className="flex flex-wrap gap-1.5">
            {benefits.map(b => (
              <button key={b.slug} className={PILL_POSITIVE} onClick={() => onPush({ type: "benefit", slug: b.slug })} data-testid={`food-benefit-${b.slug}`}>
                <BenefitIcon icon={b.icon} className="h-3 w-3" />
                {b.name}
              </button>
            ))}
          </div>
        </FoodSection>
      )}

      {/* 3. Key nutrients */}
      {nutrients.length > 0 && (
        <FoodSection title="Key nutrients">
          <div className="flex flex-wrap gap-1.5">
            {nutrients.map(n => (
              <button key={n.slug} className={PILL_MUTED} onClick={() => onPush({ type: "nutrient", slug: n.slug })} data-testid={`food-nutrient-${n.slug}`}>
                {n.name}
                {n.amount && <span className="text-muted-foreground/50">· {n.amount}</span>}
              </button>
            ))}
          </div>
        </FoodSection>
      )}

      {/* 4. Varieties */}
      {food.commonForms.length > 0 && (
        <FoodSection title="Varieties">
          <div className="flex flex-wrap gap-1.5">
            {food.commonForms.map(v => (
              <span key={v} className={PILL_MUTED}>{v}</span>
            ))}
          </div>
        </FoodSection>
      )}

      {/* 5. Discover (WS8) */}
      {discoverData && discoverData.sections.length > 0 && (
        <FoodSection title="Discover — you might enjoy">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {discoverData.sections[0].suggestions.slice(0, 3).map(s => (
              <button
                key={s.slug}
                onClick={() => onPush({ type: "food", slug: s.slug })}
                className="flex flex-col gap-1 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 text-left transition-colors"
                data-testid={`food-discover-${s.slug}`}
              >
                <span className="text-xl leading-none" aria-hidden="true">{getCategoryEmoji("")}</span>
                <span className="text-sm font-medium truncate">{s.name}</span>
                <span className="text-[11px] text-muted-foreground/60 line-clamp-2">{s.reason}</span>
              </button>
            ))}
          </div>
        </FoodSection>
      )}

      {/* 6. Alternatives (WS9) — collapsed by default, intent-triggered */}
      <FoodSection title="">
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted/20">
            <span className="text-sm text-foreground/70 font-medium mr-1">Need a swap?</span>
            {DIET_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setOpenDiet(openDiet === opt.id ? null : opt.id)}
                className={openDiet === opt.id ? PILL_NOTICE : PILL_MUTED}
                data-testid={`button-alternatives-${opt.id}`}
              >
                {opt.label}
                {openDiet === opt.id && <ChevronDown className="h-3 w-3 rotate-180 transition-transform" />}
              </button>
            ))}
          </div>

          {openDiet && altData && altData.sections.length > 0 && (
            <div className="px-4 py-3 space-y-3 border-t border-border/40">
              {altData.sections.map(section => (
                <div key={section.type}>
                  <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground/50 mb-2">{section.title}</p>
                  <div className="space-y-2">
                    {section.options.map(opt => (
                      <div key={opt.slug} className="rounded-lg bg-muted/30 p-3">
                        <p className="text-sm font-medium">{opt.name}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{opt.reason}</p>
                        {opt.note && <p className="text-[11px] text-muted-foreground/55 mt-1 italic leading-snug">{opt.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {openDiet && altData && altData.sections.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted-foreground/50 border-t border-border/40" />
          )}
        </div>
      </FoodSection>

      {/* 7. Stories (WS10) */}
      {storiesData && storiesData.sections.length > 0 && (
        <FoodSection title="Your household">
          {storiesData.sections.slice(0, 2).map(section =>
            section.cards.slice(0, 3).map((card, i) => (
              <div key={`${section.type}-${i}`} className={`${NOTICE_PANEL} mb-2`}>
                <p className="text-sm text-foreground/80 leading-relaxed">{card.headline}</p>
                {card.facts.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {card.facts.map((f, j) => (
                      <li key={j} className="text-[11px] text-muted-foreground/60 flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0 text-muted-foreground/30">·</span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </FoodSection>
      )}

      {/* 8. Seasonal (WS11) */}
      {seasonalData && seasonalData.blocks.length > 0 && (seasonalHabitsBlock || lookingAheadBlock) && (
        <FoodSection title={`${seasonalData.label}`}>
          <div className={POSITIVE_PANEL}>
            {seasonalHabitsBlock && seasonalHabitsBlock.cards.slice(0, 1).map((card, i) => (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed">{card.headline}</p>
            ))}
            {lookingAheadBlock && lookingAheadBlock.cards.slice(0, 1).map((card, i) => (
              <p key={i} className="text-[12px] text-muted-foreground/70 italic leading-relaxed">{card.headline}</p>
            ))}
          </div>
        </FoodSection>
      )}
    </DetailShell>
  );
}

// ── Nutrient detail ────────────────────────────────────────────────────────────────
function NutrientDetailView({ slug, onBack, onHome, onPush }: DetailProps) {
  const { data, isPending: isLoading } = useQuery<NutrientDetail>({ queryKey: ["/api/knowledge/nutrients", slug] });
  if (isLoading) return <DetailShell onBack={onBack} onHome={onHome} title="Loading…"><HubLoading /></DetailShell>;
  if (!data) return <DetailShell onBack={onBack} onHome={onHome} title="Not found"><EmptyState variant="unavailable" size="compact" icon={Sparkles} title="This nutrient isn't in the library." /></DetailShell>;

  const { nutrient, foods, benefits } = data;
  return (
    <DetailShell onBack={onBack} onHome={onHome} title={nutrient.name} emoji="⚛️" subtitle={nutrient.category ?? "Nutrient"}>
      {nutrient.description && <p className="text-sm text-foreground/75 leading-relaxed mb-4">{nutrient.description}</p>}
      {benefits.length > 0 && (
        <FoodSection title="Linked health benefits">
          <div className="flex flex-wrap gap-1.5">
            {benefits.map(b => (
              <button key={b.slug} className={PILL_POSITIVE} onClick={() => onPush({ type: "benefit", slug: b.slug })} data-testid={`nutrient-benefit-${b.slug}`}>
                <BenefitIcon icon={b.icon} className="h-3 w-3" />
                {b.name}
              </button>
            ))}
          </div>
        </FoodSection>
      )}
      {foods.length > 0 && (
        <FoodSection title="Foods rich in this">
          <ul className="-mx-5 divide-y divide-border/30 border-t border-border/30">
            {foods.map(f => <FoodRow key={f.slug} food={f} onOpen={() => onPush({ type: "food", slug: f.slug })} />)}
          </ul>
        </FoodSection>
      )}
    </DetailShell>
  );
}

// ── Benefit detail ─────────────────────────────────────────────────────────────────
function BenefitDetailView({ slug, onBack, onHome, onPush }: DetailProps) {
  const { data, isPending: isLoading } = useQuery<BenefitDetail>({ queryKey: ["/api/knowledge/benefits", slug] });
  if (isLoading) return <DetailShell onBack={onBack} onHome={onHome} title="Loading…"><HubLoading /></DetailShell>;
  if (!data) return <DetailShell onBack={onBack} onHome={onHome} title="Not found"><EmptyState variant="unavailable" size="compact" icon={Sparkles} title="This benefit isn't in the library." /></DetailShell>;

  const { benefit, foods } = data;
  return (
    <DetailShell onBack={onBack} onHome={onHome} title={benefit.name} icon={<BenefitIcon icon={benefit.icon} className="h-5 w-5 text-emerald-600/80" />} subtitle="Health benefit">
      {benefit.description && <p className="text-sm text-foreground/75 leading-relaxed mb-4">{benefit.description}</p>}
      {foods.length > 0 ? (
        <FoodSection title="Foods that support this">
          <ul className="-mx-5 divide-y divide-border/30 border-t border-border/30">
            {foods.map(f => <FoodRow key={f.slug} food={f} onOpen={() => onPush({ type: "food", slug: f.slug })} />)}
          </ul>
        </FoodSection>
      ) : (
        <EmptyState variant="empty" size="compact" icon={Sparkles} title="No foods linked yet." />
      )}
    </DetailShell>
  );
}

// ── Shared building blocks ─────────────────────────────────────────────────────────
interface DetailProps { slug: string; onBack: () => void; onHome: () => void; onPush: (v: View) => void; }

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

function HomeSection({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      {title && (
        <div className="flex items-center gap-1.5 mb-3">
          {icon && <span aria-hidden="true" className="text-sm">{icon}</span>}
          <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function FoodSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {title && <h4 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide mb-2">{title}</h4>}
      {children}
    </div>
  );
}

function SectionBlock({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}

// PX1-W4.8: the private `EmptyState` that lived here — and doubled as the hub's
// LOADING state, so waiting and having-nothing rendered identically — is retired.
// Absence is the canonical `ui/empty-state` owner's; waiting is `Skeleton`'s.
function HubLoading() {
  return (
    <div className="px-5 py-6 space-y-2" aria-hidden="true">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
    </div>
  );
}
