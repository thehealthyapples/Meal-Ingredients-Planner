# Mealime comparison status review

**Checked:** 19 November 2026
**Risk:** Amber — public comparison context.
**Rollback:** `rollback/CMP-Mealime-status-20261119` → `c3cbba878bc47b5f343366dc5db1437b09b89f19`.

## Finding

**Verified:** Mealime's official homepage currently displays a shutdown notice with the date 21 October 2026, now in the past. The official Apple App Store version history also says the app was shutting down on that date and that Pro subscriptions would not renew. Sources: [Mealime homepage](https://www.mealime.com/), [Apple App Store version history](https://apps.apple.com/us/app/mealime-meal-plans-recipes/id1079999103).

**Inferred:** The app/service is no longer a current alternative after the announced shutdown date. No hands-on service or account access test was made, so the comparison now clearly labels its row historical rather than making a stronger technical claim about endpoint availability.

## Change

Added a visible notice above the comparison table and changed the row hover description. Existing historical feature evidence remains intact for learning and comparison, but the page explicitly warns users not to interpret the entry as an active service.

## Product research implication

Exclude Mealime from the active 40-app candidate pool and the final current-competitor top 20. Retain it in the historical comparison evidence for continuity unless a later owner decision removes/archive its column.

## Architecture and trust

**Verified:** The existing comparison page remains the single static owner and consumer. No new state, data source, API, persistence or workflow. No product behavior or AI changed. Highest uncertainty is whether any Mealime service endpoints remain available after the announced shutdown; this notice avoids asserting that operational detail.
