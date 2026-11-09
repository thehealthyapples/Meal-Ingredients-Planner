# Nutrition Claim Citation Re-verification — 2026-11-01

## Task and scope
Independently re-check the 49 cited food-nutrient claim rows, sample live cited pages, confirm the EU calcium claim, and inspect the render gate. Read-only audit; no database changes.

## Governance preflight
- Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- Branch: `feat/integrated-dev`; HEAD `3467abad4eca8d82ffc52756fee13874e389597f`
- Worktree: extensive pre-existing tracked modifications and untracked files; preserved.
- Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, `shared/knowledge/evidence.ts`, and the relevant `getFoodBenefitsForDisplay()` path in `server/services/nutrition-knowledge-registry.ts`.
- Risk: read-only review of health-claim evidence; no code or data writes.

## Database query and result
Used the connected Neon tool against project `thehealthyapples-staging`, branch `development-local` (project ID `raspy-lake-14694943`, branch ID `br-gentle-sun-a2yw79ge`). The literal local `DATABASE_URL` was not read or printed, in accordance with repository governance prohibiting access to secrets. The SELECT was:

```sql
SELECT food_slug, nutrient_slug, source_refs, reviewed_at
FROM knowledge_food_nutrients
WHERE source_refs IS NOT NULL
  AND jsonb_array_length(source_refs) > 0;
```

Independent aggregate returned **49 rows**, **49 with reviewed_at IS NULL**, 0 signed. A structural check mirroring `validateSourceRef()` in `shared/knowledge/evidence.ts` found at least one valid reference for **all 49**; 49 are active and 0 have `rejected_at` set. The 11 URLs are all NHS pages.

## Live page sample
Fetched all 11 distinct URLs. Checked 22 rows (two per URL), listed below; **22 matched, 0 mismatched, 0 unresolved**:

| Source page | Sample rows checked | Result |
|---|---|---|
| NHS Calcium | cheddar/calcium; milk/calcium | Both cited dairy source wording appears. |
| NHS Iodine | eggs/iodine; milk/iodine | Both egg and cows’ milk/dairy wording appears. |
| NHS Iron | beef/iron; chickpeas/iron | “Red meat” and beans/chickpeas appear. |
| NHS Others | bananas/potassium; brazil-nuts/selenium | Both food lists include the cited foods. |
| NHS B vitamins and folic acid | bananas/vitamin-B6; broccoli/folate | Both foods appear in their nutrient source lists. |
| NHS Vitamin C | broccoli/vitamin-C; brussels-sprouts/vitamin-C | Both appear in the listed good sources. |
| NHS Vitamin D | eggs/vitamin-D; mackerel/vitamin-D | Egg yolks and oily fish list match. |
| NHS Vitamin K | broccoli/vitamin-K; spinach/vitamin-K | Both appear in green leafy vegetables list. |
| NHS fibre guidance | brown-rice/fibre; chickpeas/fibre | Wholegrains list includes brown rice; pulses list includes chickpeas. |
| NHS Facts about fat | almonds/unsaturated-fats; avocado/unsaturated-fats | Almonds and avocados appear under monounsaturated fats (a subtype of unsaturated fats). |
| NHS Fish and shellfish | herring/omega-3; mackerel/omega-3 | Oily fish list and richest-source statement both match. |

Sources:
- [Calcium](https://www.nhs.uk/conditions/vitamins-and-minerals/calcium/)
- [Iodine](https://www.nhs.uk/conditions/vitamins-and-minerals/iodine/)
- [Iron](https://www.nhs.uk/conditions/vitamins-and-minerals/iron/)
- [Others](https://www.nhs.uk/conditions/vitamins-and-minerals/others/)
- [B vitamins and folic acid](https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-b/)
- [Vitamin C](https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/)
- [Vitamin D](https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/)
- [Vitamin K](https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-k/)
- [Fibre guidance](https://www.nhs.uk/live-well/eat-well/digestive-health/how-to-get-more-fibre-into-your-diet/)
- [Facts about fat](https://www.nhs.uk/live-well/eat-well/food-types/different-fats-nutrition/)
- [Fish and shellfish](https://www.nhs.uk/live-well/eat-well/food-types/fish-and-shellfish-nutrition/)

## Regulation (EU) No 432/2012
EUR-Lex was attempted first but only returned a JavaScript/robot verification page, so its claim text could not be checked directly in that browser fetch. The official UK legislation mirror’s Annex contains the exact entry “Calcium is needed for the maintenance of normal bones,” with a condition that the claim may be used only for food that is at least a source of calcium. Confirmed on the [legislation.gov.uk Annex](https://www.legislation.gov.uk/eur/2012/432/annex/2012-05-16/data.xht?view=snippet&wrap=true) and corroborated in the [full regulation mirror](https://www.legislation.gov.uk/eur/2012/432/data.xht?view=snippet&wrap=true).

## Gate logic and reviewer identity
`isEvidenceBackedClaim()` returns false unless:
1. `reviewedAt` is truthy;
2. `sourceRefs` is an array with at least one item; and
3. at least one item passes `isValidSourceRef()` / `validateSourceRef()` (string body/title/URL, trusted HTTPS domain, recognized evidence level, ISO date format).

Thus **for this render gate**, setting `reviewed_at` alone would make all 49 pass because their existing `source_refs` have at least one structurally valid reference. No source data needs modification for the gate check.

Separate review-state integrity is stricter: `validateReviewState()` requires `reviewedAt` to have a `reviewedBy` value, and repository comments/tests state this is enforced at the human sign-off boundary. Therefore an actual approval must record both fields together. Codex is not a human reviewer and must not be recorded as `reviewed_by`; that value must be the name (or auditable identity/email) of the human who actually reviewed and approved the claims.

Also, passing these 49 composition-edge checks alone does not guarantee every benefit chip appears: `getFoodBenefitsForDisplay()` additionally needs an evidence-backed nutrient→benefit route and a linked food→benefit record.

## Changes and checks
- No files in application source were modified.
- No database rows, schema, configuration, credentials, or services were changed.
- No tests were run; this was read-only verification.
- Investigation/report files only were written.

## Report paths
- Investigation: `docs/investigations/knowledge/NUTRIENT_SOURCE_CLAIM_REVERIFICATION_2026-11-01.md`
- Agent report: `G:\The Healthy Apples\Incoming\Agent Reports\Codex_Nutrient_Source_Claim_Reverification_2026-11-01.md`

