# Smart Planner — External Dietary Filtering Investigation Summary

## Context

This is a meal planning app (The Healthy Apples). The Smart Planner feature auto-generates a weekly meal plan by combining the user's saved recipes with externally fetched recipes from 5 web sources. The app has a user Profile where dietary approaches are stored (Vegan, Vegetarian, Keto, Paleo, Mediterranean, DASH, MIND, Low-Carb, Carnivore, Flexitarian).

---

## The Problem

Profile dietary requirements are **never used when fetching external recipes**. The external search call always uses generic terms like "healthy dinner", "quick lunch" regardless of the user's diet. Dietary data only kicks in *after* recipes are retrieved — it penalises non-matching meals in scoring but doesn't stop them from entering the candidate pool.

---

## Active External Sources

| Source | How accessed | Ingredients returned at search? |
|--------|-------------|--------------------------------|
| TheMealDB | Free REST API | YES — full ingredient list |
| BBC Good Food | HTML scraper | NO — name + image only |
| AllRecipes | HTML scraper | NO — name only |
| Jamie Oliver | HTML scraper | NO — name only |
| Serious Eats | HTML scraper | NO — name only |

Three more sources exist as coded functions but are not active:
- **Edamam** — REST API with native dietary filtering (`&health=vegan`, `&health=keto-friendly`, etc.) + full ingredients. Not activated — no API key configured.
- **API-Ninjas** — REST API, full ingredients returned. API key IS configured but function not wired in.
- **BigOven** — REST API, dietary filter param exists. No key configured.

---

## Key Finding

The current search call is:
```
fetchExternalCandidates({ cuisine: "italian", query: "italian" })
// or with no preference:
fetchExternalCandidates({ cuisine: undefined, query: undefined })
// → searches "healthy dinner", "quick lunch", "easy breakfast"
```

It could be:
```
fetchExternalCandidates({ query: "vegan" })
// → searches "vegan healthy dinner", "vegan quick lunch", etc.
```

This single change would immediately affect all 5 active sources.

---

## Which Diets Work Well as Search Terms?

| Diet | Safe as search term? |
|------|---------------------|
| Vegan | YES |
| Vegetarian | YES |
| Keto | YES |
| Paleo | YES |
| Mediterranean | YES |
| Low-Carb | YES |
| Gluten-Free | YES |
| Dairy-Free | YES |
| DASH | PARTIAL — niche term, sparse results |
| MIND | PARTIAL — very niche, very sparse results |
| Flexitarian | PARTIAL — rarely tagged in recipes |
| Carnivore | PARTIAL — growing but still niche |

---

## Can We Trust Search Terms Alone?

No. A recipe titled "vegan pasta" can still contain dairy. Keyword searching improves the pool but doesn't guarantee compliance.

Only **TheMealDB** returns full ingredients at search time, so dietary compliance can be verified against the ingredient list. The 4 scraper sources return no ingredients — compliance cannot be checked without fetching each recipe's detail page.

**Edamam** is the only source with source-guaranteed filtering (`health=vegan` means Edamam has verified the recipe at ingredient level). It's the best long-term solution but needs an API key.

---

## Three Implementation Options

### Option A — Keyword prefix only
Add dietary term to the search query. `"vegan pasta"` instead of `"pasta"`.
- 1 line change at the call site
- Works for all 5 active sources immediately
- Cannot verify compliance (scrapers have no ingredients)
- Risk: LOW

### Option B — Keyword prefix + ingredient verification
Add dietary term AND check ingredients of retrieved recipes.
- Only TheMealDB benefits (only source with ingredients at search time)
- 4 of 5 sources still unverifiable
- Risk: LOW-MEDIUM

### Option C — Keyword prefix + ingredient verification + verified/unverified flag
Tag each candidate as `dietaryVerified: true/false`. Give scoring bonus to verified candidates.
- Cleanest architecture
- Requires interface changes to candidate + scoring types
- Only meaningful once Edamam is activated (providing a real verified pool)
- Risk: MEDIUM

---

## Recommended Approach

1. **Now:** Option A — add dietary keyword prefix to search queries for safe diets (Vegan, Vegetarian, Keto, Paleo, Mediterranean, Low-Carb, Gluten-Free, Dairy-Free). Add fallback: if filtered pool < 10 candidates, retry without dietary term.
2. **Quick win:** Activate API-Ninjas (key already configured, function already written). Provides second ingredient-verified source.
3. **Best long-term:** Activate Edamam (needs API key). Only source with genuine dietary filtering guarantees + full ingredients. Has free tier (1,000 calls/month).
4. **After Edamam:** Add Option C verified/unverified flag to scoring.

---

## Questions for ChatGPT

1. For the 4 scraper sources (BBC, AllRecipes, Jamie Oliver, Serious Eats) that return no ingredients — is there a better way to get ingredient data without scraping each recipe detail page?
2. Are there other recipe APIs with native dietary filtering that we may have missed?
3. For the keyword prefix approach — how should we handle users with multiple dietary requirements (e.g. Vegan + Gluten-Free)? Combine terms or use the most restrictive?
4. Is the pool thinning risk (30–60% fewer candidates) a material concern for a 7-day × 3-meal planner, and how would you mitigate it?
