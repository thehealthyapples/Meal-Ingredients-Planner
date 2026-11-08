# Recipe Relicensing Roadmap

**Purpose:** Document THA's path to legitimate commercial licensing for third-party recipe content  
**Status:** In-progress (app pre-production)  
**Target:** Production launch with Apify/commercial contracts

---

## Current State (Pre-Production)

### Meals Under Relicensing Path

**163 user-imported meals from unlicensed sources:**

| Source | Count | Licensing Path | Current Status | Future Plan |
|--------|-------|-----------------|-----------------|------------|
| BBC Good Food | 156 | Immediate Media syndication | User imports (unlicensed) | Commercial contract via Immediate Media |
| AllRecipes | 7 | Dotdash Meredith licensing | User imports (unlicensed) | Commercial contract via Dotdash Meredith |

### Licensing Evidence Base

Reference: `docs/investigations/cookbook/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md`

**BBC Good Food:**
- Publisher: Immediate Media Company
- Current status: robots.txt disallows scraped searches; ToS prohibits automated access
- Compliance action: **Negotiate commercial syndication license** (FS2 §3.1)
- Commercial path: Immediate Media offers content syndication to B2B partners

**AllRecipes:**
- Publisher: Dotdash Meredith
- Current status: Scraping breached ToS
- Compliance action: **Negotiate commercial content license** (FS2 §3.2)
- Commercial path: Dotdash Meredith licenses content to cooking/nutrition apps

---

## Production Roadmap

### Phase 1: Pre-Production (Now — App Launch)

**Meals:** Keep 163 imported recipes as-is for household testing  
**Usage:** Visible in Cookbook, Planner, meal-discovery  
**Status:** Unlicensed (user imports)  
**Action:** Document intent to relicense before revenue-generating production

### Phase 2: Launch + Early Revenue (Post-Production)

**Trigger:** App generating revenue from subscriptions/ads  
**Action:** Initiate licensing negotiations
- Contact Immediate Media (BBC Good Food syndication)
- Contact Dotdash Meredith (AllRecipes content licensing)
- Establish Apify contract for ongoing legitimate data imports

**Outcome:** Secure commercial licenses for both sources

### Phase 3: Licensed Production (Post-Contract)

**Trigger:** Contracts signed and active  
**Action:** 
- Transition 163 meals to `licensed_discovery` lane
- Update `acquisitionType` to `licensed_import`
- Set `licenceRef` to contract identifiers
- Ongoing: Use Apify for daily/weekly meal updates from licensed sources

**Status:** Fully compliant, commercial usage

---

## Commercial Licensing Strategy

### Immediate Media (BBC Good Food)

**Contact:** Business development (Immediate Media Company Ltd)  
**Licensing Model:** B2B content syndication  
**Terms:** (To be negotiated)
- Content scope (recipe database vs. curated collections)
- Update frequency (static snapshot vs. ongoing feed)
- Attribution requirements
- Attribution text example: "Recipe from BBC Good Food"

**Timeline:** 6–12 weeks typical for partnership negotiation

### Dotdash Meredith (AllRecipes)

**Contact:** Partner/licensing team (Dotdash Meredith)  
**Licensing Model:** Content licensing for apps  
**Terms:** (To be negotiated)
- Content scope (recipes, nutrition data, reviews)
- Update cadence
- Attribution/linking requirements
- Link requirements example: "Full recipe at AllRecipes.com"

**Timeline:** 6–12 weeks typical for partnership negotiation

### Apify (Ongoing Legitimate Data)

**Purpose:** Scheduled, legal recipe imports post-launch  
**Model:** Commercial data scraping service (legal under their ToS)  
**Setup:**
- Apify actors for BBC Good Food recipe extraction
- Apify actors for AllRecipes recipe extraction
- Schedule: Daily/weekly updates to meals table
- Licensing: Apify provides legal compliance layer

**Cost:** Apify pricing based on usage

---

## Meals Annotation

**All 163 meals marked with:**
- `licensing_status: "pending_relicense"`
- `relicense_source_key: "immediate_media"` or `"dotdash_meredith"`
- `relicense_target_date: null` (to be updated on contract signing)

**Code reference:** Search for `pending_relicense` in codebase to find all affected meals

---

## Compliance Notes

### Current Position (Pre-Production)

- Meals are user imports (`acquisitionLane: personal_cookbook`)
- Each user imported from these sources themselves
- THA has no storage obligation under current FS3 policy
- **Action:** Document path to licensing before production revenue

### Post-Contract Position

- Meals transition to `acquisitionLane: licensed_discovery`
- THA holds valid commercial license
- Attribution and compliance tracking in place
- Fully auditable licensing chain

---

## Success Criteria

**Phase 2 complete when:**
- At least one licensing contract signed with Immediate Media OR Dotdash Meredith
- Apify integration tested and ready for daily/weekly imports
- 163 meals re-classified to `licensed_discovery` lane
- Attribution text updated on meal cards

**Phase 3 complete when:**
- Both sources licensed OR alternative sources providing same recipe coverage
- Apify running scheduled meal imports
- New meals arriving with proper `licenceRef` and `attributionText`
- Zero unlicensed user imports of these sources (enforcement via policy)

---

## References

- **FS2 Licensing Review:** `docs/investigations/cookbook/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md` (Sections 3.1, 3.2)
- **FS3 Recipe Acquisition:** `shared/recipe-acquisition.ts` (ACQUISITION_SOURCE_REGISTER, ACQUISITION_SOURCE_POLICY)
- **Immediate Media:** https://www.immediate.co.uk/publishing/partnerships/
- **Dotdash Meredith:** https://www.dotdashmeredith.com/partnerships/
- **Apify:** https://apify.com/ (data extraction and automation)

---

## Decision Trail

**2026-11-08 — Priority 3 Investigation:**
- Identified 163 meals from forbidden sources
- User decision: Keep meals, pursue legitimate licensing via Apify post-launch
- Document relicensing path and mark meals appropriately
- No data deletion or archiving

**This document establishes the compliance strategy and relicensing timeline.**
