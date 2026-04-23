export function buildWhyBetter(product: any, currentScore: number | null): string[] {
  const reasons: string[] = [];
  const smp = product.upfAnalysis?.thaRating ?? 0;
  if (currentScore !== null && smp > currentScore) {
    reasons.push(`Higher THA score (${smp}/5)`);
  }
  const additiveCount = product.upfAnalysis?.additiveMatches?.length ?? 0;
  if (additiveCount === 0) reasons.push('No additives detected');
  else if (additiveCount <= 2) reasons.push(`Fewer additives (${additiveCount})`);
  const highRisk = (product.upfAnalysis?.additiveMatches ?? []).filter((a: any) => a.riskLevel === 'high').length;
  if (highRisk === 0 && (currentScore ?? 5) <= 3) reasons.push('No high-risk additives');
  const nova = product.nova_group ?? product.analysis?.novaGroup ?? null;
  if (nova !== null && nova <= 2) reasons.push(`Lower processing (NOVA ${nova})`);
  return reasons.slice(0, 3);
}

export function rankChoices(products: any[], currentScore: number | null, preferredStore?: string): any[] {
  const filtered = products.filter(p => {
    const smp = p.upfAnalysis?.thaRating ?? 0;
    return currentScore === null || smp > currentScore;
  });
  return [...filtered].sort((a, b) => {
    if (preferredStore) {
      const aInStore = (a.availableStores || []).includes(preferredStore);
      const bInStore = (b.availableStores || []).includes(preferredStore);
      if (aInStore && !bInStore) return -1;
      if (!aInStore && bInStore) return 1;
    }
    const aSmp = a.upfAnalysis?.thaRating ?? 0;
    const bSmp = b.upfAnalysis?.thaRating ?? 0;
    if (bSmp !== aSmp) return bSmp - aSmp;
    const aNova = a.nova_group ?? a.analysis?.novaGroup ?? 9;
    const bNova = b.nova_group ?? b.analysis?.novaGroup ?? 9;
    if (aNova !== bNova) return aNova - bNova;
    const aAdd = a.upfAnalysis?.additiveMatches?.length ?? 0;
    const bAdd = b.upfAnalysis?.additiveMatches?.length ?? 0;
    return aAdd - bAdd;
  });
}

// ── Shop view ranking ───────────────────────────────────────────────────────
// Central ranking logic for Quick List / Check Cupboard / Shop View.
// Default: quality-first — highest THA rating group, then cheapest within that group.

export type RankingMode = "quality_first" | "balanced" | "lowest_price" | "tha_pick";

export interface RankableMatch {
  thaRating: number | null;
  price: number | null;
}

const priceAsc = <T extends RankableMatch>(a: T, b: T): number => {
  if (a.price === null && b.price === null) return 0;
  if (a.price === null) return 1;
  if (b.price === null) return -1;
  return a.price - b.price;
};

const ratingDesc = <T extends RankableMatch>(a: T, b: T): number =>
  (b.thaRating ?? 0) - (a.thaRating ?? 0);

/**
 * Rank shop-view product matches according to the user's chosen mode.
 *
 * quality_first (default):
 *   1. Find the highest rating in the set.
 *   2. Take only that top group.
 *   3. Within the group → sort by price ASC (cheapest of the best).
 *   4. Remaining groups sorted by rating DESC then price ASC.
 *
 * balanced:
 *   Rating DESC, then price ASC as tiebreaker.
 *
 * lowest_price:
 *   Price ASC (nulls last), then rating DESC as tiebreaker.
 */
export function rankDisplayMatches<T extends RankableMatch>(
  matches: T[],
  mode: RankingMode = "quality_first",
): T[] {
  if (matches.length === 0) return matches;

  switch (mode) {
    case "quality_first": {
      const maxRating = Math.max(...matches.map(m => m.thaRating ?? 0));
      const topGroup = matches.filter(m => (m.thaRating ?? 0) === maxRating);
      const rest = matches.filter(m => (m.thaRating ?? 0) < maxRating);
      topGroup.sort(priceAsc);
      rest.sort((a, b) => {
        const rd = ratingDesc(a, b);
        return rd !== 0 ? rd : priceAsc(a, b);
      });
      return [...topGroup, ...rest];
    }
    case "balanced":
      return [...matches].sort((a, b) => {
        const rd = ratingDesc(a, b);
        return rd !== 0 ? rd : priceAsc(a, b);
      });
    case "lowest_price":
      return [...matches].sort((a, b) => {
        const pd = priceAsc(a, b);
        return pd !== 0 ? pd : ratingDesc(a, b);
      });
    case "tha_pick":
      return rankDisplayMatches(matches, "quality_first");
  }
}
