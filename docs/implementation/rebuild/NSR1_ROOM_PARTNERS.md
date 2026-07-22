# NSR1 Phase 2 — Partners (craft wave — minimal; room needs a ground-up reframe)

**Room:** Partners / Supermarkets — `/supermarkets` → `client/src/pages/supermarkets-page.tsx`
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Owners:** `capabilities/partners.md` · Commercial Architecture §C3 · UIOWN1 (partners defers to the capability card) · CRAFT1 §5 · GEA8/21 · Core Principle 6

## Honest scope note
The audit's verdict on Partners is **NEEDS-GROUND-UP-REBUILD** — it presents a country-filtered
directory of *all* retailers rather than the household's *chosen* shops. But that reframe requires a
**shop-selection data model that does not exist** and **retailer brand-asset rights** — both owner/
backend decisions, outside this presentation-only wave. So this craft pass is deliberately small: it
fixes the one clearly in-scope defect and flags the rest for the ground-up work.

## Change (presentation-only)
- **Empty-state voice + false geo claim.** "Try another country, and **we'll** show what's **nearby**"
  → "Try another country to see the shops available there." Removes the first-person companion voice a
  room may not use (**GEA8/21** — rooms report), and the "nearby" **proximity claim it cannot
  substantiate** (it is a country filter, not location — **Core Principle 6**). Title's "yet" dropped.

## Not done — owner/backend (the ground-up reframe)
- **Household-chosen shops** — model "these are my shops" (selection/pinning); default to the
   household's shops, discovery secondary (GEA23; capability card). *No data model exists.*
- **Real shop identity marks** (`client/src/assets/Retailers`) in place of the generic `Store` icon —
   needs brand-asset usage rights, and must honour GEA §9.4 (a mark must not read as a THA endorsement).
- **Direct-basket vs honest search-only handoff** (`hasDirectBasket`), and offering only countries that
   actually have retailer data (source is 9 UK retailers). Backend/data.

## Positives to preserve (already at standard)
No fabricated saving/discount/price anywhere (Commercial §C3 satisfied — nothing to withdraw); no
retailer scoring/ranking (GEA13 clean); no return-frequency mechanics (GEA3); canonical skeleton loader.

## Verification
`tsc --noEmit`: 0 errors in `supermarkets-page.tsx`. Single-string change. Live review recommended.

## Data / Trust / Scope
No schema/API/business-logic change; `server/` untouched. Rollback: reset to the NSR1 tag.

## Quality Standard
The craft wave removed the one voice/honesty slip; a genuine "happily spend time here" needs the
ground-up reframe to the household's chosen shops — an owner/backend decision, recommended as a
follow-on alongside the Larder rebuild.
