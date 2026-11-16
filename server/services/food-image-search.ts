/**
 * Temporary long-tail food imagery lookup.
 *
 * Canonical image URLs remain owned by the Food Knowledge registry. This
 * service searches Pixabay only after a signed-in person selects an uncovered
 * food. Pixabay URLs are intended for temporary result display and expire
 * after 24 hours, so the bounded cache matches that window.
 * Results are never persisted to the database.
 */

export interface FoodImageSearchResult {
  imageUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
  provider: "Pixabay";
}

type PixabayHit = {
  webformatURL?: string;
  tags?: string;
  pageURL?: string;
  user?: string;
  user_id?: number;
};

type CacheEntry = { result: FoodImageSearchResult | null; expiresAt: number };

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const IMAGE_SEARCH_CACHE = new Map<string, CacheEntry>();
const IN_FLIGHT = new Map<string, Promise<FoodImageSearchResult | null>>();

function remember(key: string, result: FoodImageSearchResult | null): void {
  if (IMAGE_SEARCH_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = IMAGE_SEARCH_CACHE.keys().next().value;
    if (oldestKey) IMAGE_SEARCH_CACHE.delete(oldestKey);
  }
  IMAGE_SEARCH_CACHE.set(key, {
    result,
    expiresAt: Date.now() + (result ? CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS),
  });
}

/** Return one credited, temporarily hotlinked Pixabay result or null. */
export async function searchPixabayFoodImage(query: string): Promise<FoodImageSearchResult | null> {
  const cleaned = query.trim().replace(/\s+/g, " ").slice(0, 100);
  const cacheKey = cleaned.toLocaleLowerCase();
  if (cacheKey.length < 2) return null;

  const accessKey = process.env.PIXABAY_API_KEY;
  if (!accessKey) return null;

  const cached = IMAGE_SEARCH_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  IMAGE_SEARCH_CACHE.delete(cacheKey);

  const inFlight = IN_FLIGHT.get(cacheKey);
  if (inFlight) return inFlight;

  const request = (async () => {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", accessKey);
    url.searchParams.set("q", `${cleaned} food`);
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("orientation", "horizontal");
    url.searchParams.set("category", "food");
    url.searchParams.set("safesearch", "true");
    url.searchParams.set("per_page", "3");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        remember(cacheKey, null);
        return null;
      }

      const payload = await response.json() as { hits?: PixabayHit[] };
      const hit = payload.hits?.find((candidate) =>
        candidate.webformatURL && candidate.pageURL && candidate.user && candidate.user_id,
      );
      if (!hit?.webformatURL || !hit.pageURL || !hit.user || !hit.user_id) {
        remember(cacheKey, null);
        return null;
      }

      const result: FoodImageSearchResult = {
        imageUrl: hit.webformatURL,
        alt: hit.tags?.trim() || cleaned,
        photographer: hit.user,
        photographerUrl: `https://pixabay.com/users/${encodeURIComponent(hit.user)}-${hit.user_id}/`,
        photoUrl: hit.pageURL,
        provider: "Pixabay",
      };
      remember(cacheKey, result);
      return result;
    } catch {
      remember(cacheKey, null);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  })();

  IN_FLIGHT.set(cacheKey, request);
  try {
    return await request;
  } finally {
    IN_FLIGHT.delete(cacheKey);
  }
}
