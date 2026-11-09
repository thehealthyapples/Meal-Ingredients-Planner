// 2026-11-02 (owner) — "searching and doing compare in foods should show
// both foods from analyser and THA's own library": the Food Comparison
// Engine's own architecture doc (top of comparison-engine.ts) used to say
// "NEVER a live OpenFoodFacts fetch and NEVER a recompute" — a deliberate
// rule while this engine only ever resolved against the caller's OWN stored
// scan history. That rule was never a blanket platform rule, though:
// GET /api/search-products (server/routes.ts) already does a live OFF fetch
// plus a real computed score every time someone searches in Analyser — nobody
// had wired the comparison engine or the Food page's own search box to reach
// it too.
//
// This file is the one, shared, honestly-labelled way to do that live
// lookup — a single best match, not a results page — so the comparison
// engine and the Food page's search don't each grow their own, possibly
// drifting, copy of "fetch OFF, score it." It does NOT replace
// GET /api/search-products, which still owns the FULL multi-result search
// experience (dedup, store enrichment, canonical grouping) for Analyser
// itself; this is deliberately smaller.
//
// Trust posture: a match here was found THIS INSTANT from a public database,
// not scanned by the caller and not previously verified by anyone at THA.
// Every caller of this function must label it as such (see
// OWNER_LIVE_SEARCH in comparison-engine.ts) — it must never be presented
// with the same confidence as the caller's own scan history.

import axios from "axios";
import { analyzeProductUPF } from "./upf-analysis-service";
import type { Additive } from "@shared/schema";

export interface LiveProductMatch {
  barcode: string | null;
  name: string;
  brand: string | null;
  ingredientsText: string | null;
  novaGroup: number | null;
  thaRating: number | null;
  upfScore: number | null;
  additiveCount: number;
}

const OFF_HEADERS = {
  timeout: 15000,
  headers: { "User-Agent": "TheHealthyApples/1.0 (+https://thehealthyapples.com; support@thehealthyapples.com)" },
};
const OFF_FIELDS = "code,product_name,product_name_en,brands,nova_group,ingredients_text,ingredients_text_en";

/**
 * Live, single-best-match OpenFoodFacts search. Returns null for no match
 * AND for any fetch failure — an honest "couldn't find it live", never a
 * fabricated one (the same discipline comparison-engine.ts's own scan-history
 * read already follows: "an honest empty history, never a fabricated product
 * record").
 */
export async function findLiveProductMatch(
  query: string,
  additiveDb: Additive[],
): Promise<LiveProductMatch | null> {
  const q = query.trim();
  if (!q) return null;

  try {
    const params = new URLSearchParams({
      search_terms: q,
      json: "1",
      page: "1",
      page_size: "5",
      tagtype_0: "countries",
      tag_contains_0: "contains",
      tag_0: "united-kingdom",
      fields: OFF_FIELDS,
    });
    const url = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`;
    const { data } = await axios.get(url, OFF_HEADERS);
    const products: any[] = Array.isArray(data?.products) ? data.products : [];
    if (products.length === 0) return null;

    // Prefer a result with real ingredient text (scoreable) over the raw
    // first hit — OFF's own relevance ranking otherwise sometimes surfaces a
    // barely-populated record ahead of a fully-documented one.
    const best = products.find((p) => p.ingredients_text_en || p.ingredients_text) ?? products[0];

    const name: string | undefined = best.product_name_en || best.product_name;
    if (!name) return null;

    const ingredientsText: string | null = best.ingredients_text_en || best.ingredients_text || null;
    const novaGroup: number | null = best.nova_group ? Number(best.nova_group) : null;

    const upfResult =
      ingredientsText || novaGroup
        ? analyzeProductUPF(
            ingredientsText ?? "",
            additiveDb,
            50,
            { productName: name, categoriesTags: [], novaGroup },
            undefined,
            false,
          )
        : null;

    return {
      barcode: best.code || null,
      name,
      brand: best.brands || null,
      ingredientsText,
      novaGroup,
      thaRating: upfResult?.thaRating ?? null,
      upfScore: upfResult?.upfScore ?? null,
      additiveCount: upfResult?.additiveCount ?? 0,
    };
  } catch {
    return null;
  }
}
