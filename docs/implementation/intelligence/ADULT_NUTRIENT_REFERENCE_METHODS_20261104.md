# ANR1 method selection and input mapping — 2026-11-04

## Status and scope

Evidence-backed implementation specification under Food Intelligence Architecture §5.1 (ANR1), not new governing policy. User approved selecting reference methods and mapping inputs. Methods below are selected candidates for editorial/method verification; none is activated, seeded, clinically certified or marked reviewed by this document. No runtime, profile, database or schema change.

Repository tha-integrated-dev-g-native-20261003; feat/integrated-dev; base 3467abad4eca8d82ffc52756fee13874e389597f; 193 pre-existing status entries preserved. Red personal-nutrition specification; Implementation permitted YES under owner instruction and dev authority. Governing files read: AGENTS.md, PROJECT_GOVERNANCE.md preflight/dev authority, architecture README, ENGINEERING_WORKFLOW.md AI compliance, THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §5.1, NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md evidence/ownership. Schema, profile handler, nutrient vocabulary and household eater model inspected. THA operating-model skill applies. No delegation or authority conflict. Runtime availability remains unimplemented.

## Selected evidence register

Fetched on 2026-11-04; source publication date is distinct from retrieval date. Primary sources used; PDFs' adult tables inspected through text extraction and screenshot requests. Research verification is not the named editorial sign-off required for publication.

| ID | Primary source | Role and selection |
|---|---|---|
| UK-COMA-PROTEIN-1991 | [Department of Health, Dietary Reference Values: A Guide, protein section p15](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/743790/Dietary_Reference_Values_-_A_Guide__1991_.pdf) | UK adult baseline: RNI 0.75 g/kg/day for ages 19+. Method assumptions include adequate energy/other nutrients and protein quality. Do not turn the RNI into an invented range or use reference-person table amounts as measured personal needs. |
| UK-PHE-DRV-2016 | [Government Dietary Recommendations, adult Tables 2, 4, 6 and footnotes](https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/618167/government_dietary_recommendations.pdf) | UK table lookup for vitamins/minerals by published age/sex stratum; preserve each unit and reference meaning. Iron has an additional age boundary within the adult band. Energy-derived thiamin/niacin values need their footnote assumptions retained. No sports multiplier for micronutrients. |
| UK-SACN-TERMS-2025 | [SACN statement on expressing energy, fat and carbohydrate recommendations](https://www.gov.uk/government/publications/sacn-statement-on-expressing-fat-and-carbohydrate-recommendations/sacn-statement-on-expressing-energy-fat-and-carbohydrate-intakes-and-recommendations) | Current interpretation overrides outdated terminology: fat/carbohydrate DRVs generally express population-average intake, not individual requirements. Preserve energy-excluding-ethanol basis. Fibre guidance is a population reference. No personalised calorie prescription or automatic conversion into individual gram targets. SACN states protein review is future work; monitor for replacement. |
| EU-EFSA-PROTEIN-2012 | [EFSA protein PRI](https://www.efsa.europa.eu/en/press/news/120209) and linked scientific opinion | Alternative explicitly labelled EU standard: 0.83 g/kg/day adult PRI. Different standard, not an average with UK RNI. Review the linked full opinion and eligibility before enabling. No body-outcome claim. |
| EU-EFSA-DRV-CURRENT | [EFSA DRV topic/index](https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values) | Index for future separately versioned EU nutrient methods and updated ULs. AR, PRI, AI, macronutrient RI and UL differ. Do not freeze old summary-report upper limits without checking nutrient-specific updates. |
| ISSN-PROTEIN-EXERCISE-2017 | [ISSN position stand: protein and exercise, DOI 10.1186/s12970-017-0177-8](https://link.springer.com/article/10.1186/s12970-017-0177-8) | Candidate exercise-specific food-protein range 1.4–2.0 g/kg/day for most healthy exercising individuals; source population and exercise context must be confirmed. A muscle goal alone does not prove eligibility. Supplement, per-dose, high-dose/energy-deficit or body-outcome claims in the paper are not admitted by this selection. |

Do not mistake older publication dates for proof of invalidity or current validity; check source-specific supersession on release and record that check. Government population values, product-label RIs and a person's actual requirement are distinct. No label-based 50g protein or generic energy allowance should silently replace the selected personal method.

## Method decisions

| Method | Initial release scope | Inputs actually required | Output |
|---|---|---|---|
| uk-adult-protein-rni-v1 | General-wellbeing UK adults ≥19; excluded situations handled under ANR1 | Confirmed adult age eligibility, stated body mass in kg, scope eligibility | Single RNI reference amount: mass × 0.75 g/day; source and assumptions. Not a min–max range or a deficiency cutoff. |
| uk-adult-micronutrient-table-v1 | Published adult UK strata only | Stated age sufficient for exact source band; source-required sex category only for differing rows; scope eligibility | Source lookup, with nutrient/unit/reference type and age/sex band. No weight/activity scaling absent an explicit source method. |
| adult-exercise-protein-range-v1 | Initial product scope restricted to eligible adults 19–64; this narrower band is a conservative release scope, not a source-derived biological boundary | Age, mass, stated exercise/training context and explicit muscle/strength goal, scope eligibility | Source-labelled exercise range: mass × [1.4, 2.0] g/day; no prediction of muscle gain. Separate baseline remains available and labelled. Older adults need method-specific review before exercise personalisation. |
| efsa-adult-protein-pri-v1 | Explicit EU-standard selection, release eligibility pending full-opinion review | Eligible adult population, mass, scope eligibility | mass × 0.83 g/day PRI; never blended with UK. Not selected automatically from an uncertain location. |
| uk-population-food-guidance-v1 | General information, not a personal requirement calculator | No additional body measurements | Clearly labelled population guidance for fibre/fat/carbohydrate/free sugars/salt where source supports it. No unsupported conversion from generic calories into a personal target. |

Coverage: first release aims at protein, UK-table vitamins and minerals, plus properly labelled population food guidance. Nutrients with no reviewed method remain unsupported. This does not claim complete coverage of all nutrients, absorption, hydration losses or all activity types. Include only canonical nutrient identities already owned by Nutrition Knowledge; source concepts not mapped exactly must remain unmapped rather than being forced into a similar slug. Examples: total sugar ≠ free sugar; sodium ≠ salt; niacin equivalents ≠ plain niacin; folate units/forms and vitamin A equivalents need explicit conversion semantics.

## Existing input mapping

Verified from shared/schema.ts and server/intelligence/handlers/profile-read-handler.ts:

| Input | Current owner / availability | Implementation handling |
|---|---|---|
| Person identity | user_preferences.userId; household_eaters.userId can link an eater to an account | First runtime scope: authenticated adult asking for themselves. Resolve linked user; never apply account holder's measurements to another eater or infer adulthood from having an account. |
| Weight | user_preferences.weightKg; exposed by profile reader | Reuse. Require explicit confirmation of the value used and normalise units. Measurement timestamp/provenance is missing; no silent freshness assumption. |
| Height | user_preferences.heightCm; exposed | Reuse if a future reviewed method needs it. Current selected protein/table methods do not require height; do not ask merely to fill a profile. |
| Activity | user_preferences.activityLevel, default moderate; exposed | Default is not a stated fact. Require explicit confirmation; this coarse field alone does not establish resistance/exercise eligibility. |
| Goal | user_preferences.healthGoals and goalType; exposed; goalType defaults maintain | Confirm relevant goal and its attribution. No inference from default, weight, purchases or previous questions. Muscle/exercise eligibility needs structured confirmation beyond a free-text goal. |
| Age / source age band | No corresponding field found in current schema | Needed before personalised selection. Prefer minimum age-band information that resolves the exact source row; age-50 iron boundary must not be lost. Confirm at read time initially; persistence needs an approved schema/privacy decision. |
| Source-required sex category | No corresponding field found | Ask only for applicable methods; permit decline. Do not derive from name, gender identity or appearance. If a source category cannot be selected validly, provide unpersonalised source information. |
| Scope eligibility / consent | No ANR1-specific eligibility/attribution record found | Confirm method scope and purpose. Do not infer absence of medical conditions/pregnancy/lactation from missing records. Avoid collecting clinical detail; offer general information if eligibility is unknown. Persistent consent/eligibility design requires existing privacy-owner review. |
| Food quantities/intake | food_diary_entries stores names/notes, not structured portions/food identity/composition | Personal reference can be calculated independently; intake comparison remains unavailable until Diary-owned structured amounts and composition coverage exist. Shopping/planning is not consumption. |
| Existing calorieTarget | user_preferences.calorieTarget | Do not overwrite or use as a new ANR1 energy prescription. This scope does not approve personalised calories. |

Account-less adults and cross-person household requests remain unavailable for personal calculations until explicit adult identification, consent and access are designed. Existing hard dietary restrictions still gate all food suggestions.

## Calculation contract and data flow

Implementation extends existing Nutrition Knowledge and Food Intelligence, registered through the existing Capability Registry/Intent Engine; no new assistant or parallel profile. Persisted new inputs require a separate schema decision. Suggested calculation input/output shapes are design contracts, not new state owners:

```
request: personRef, methodId, statedInputs[{value, unit, source, confirmedAt}], goal
result: status (ready | missing-input | out-of-scope | method-unreviewed),
        personRef, methodId/version, nutrientSlug, referenceType,
        value OR {lower,upper}, unit, timeBasis,
        inputsUsed, assumptions, exclusions, sourceRefs, reviewedAt,
        missingInputs, generatedAt
```

Only reviewed methods execute. Validate identity/access before retrieving personal factors. Reject missing/ambiguous units, non-finite/non-positive mass and impossible categorical inputs; unusual values ask for confirmation rather than silently clamping to a default. Use approved unit conversion without premature rounding. Arithmetic is in deterministic services; LLM receives the completed result through Context Composition and may not replace inputs/methods or invent missing values. Output fixed RNI/PRI as fixed reference, genuine ranges as ranges, and population recommendations as population guidance.

Do not materialise a second persistent personal target table merely for this feature. If caching is later justified, use derived, rebuildable output keyed on person, confirmed input versions, goal and reviewed method version; changed inputs invalidate it. All citations/version and scope limitations survive composition. Follow existing confirmation behavior for saving a goal or changing a plan.

## Independent verification cases

Candidate arithmetic expectations, not patient advice or released recommendations:

- UK baseline: 80kg × 0.75 = 60g/day; 60kg × 0.75 = 45g/day.
- Named EFSA method: 80kg × 0.83 = 66.4g/day. It must not be returned under the UK method ID.
- Eligible exercise method: 80kg × [1.4,2.0] = [112,160]g/day. Same weight without confirmed exercise/scope must not select it just because the user says “muscle”.
- Unit-equivalent weight produces the same result within defined rounding tolerance; zero/negative/NaN/ambiguous mass yields no result.
- Exact UK table boundary cases: age 18/19; 49/50; 64/65; 74/75. Expected values must be independently transcribed and dual-checked from adult rows/footnotes before seeding.
- Unknown sex category should not block a source row that is genuinely identical across categories; it must block a differing row. Do not collapse clinically different strata into a fabricated midpoint.
- Default activity/goal unconfirmed; missing age; pregnancy/lactation or clinical scope uncertainty; unreviewed/superseded method; changed mass; another person's request; partial diary; missing nutrient quantities: verify honest outcomes and absence of leakage.
- End-to-end Companion assertions compare exact numeric result, units, method label, source and limits with the deterministic result. Fluent but inaccurate wording fails. Benchmarks retain their questions/scoring and distinguish factual calculations from routing metrics.

## Release work and completion boundary

Completed: primary-source selection, current input/consumer audit, method-selection rules and testable contract. Remaining: qualified named reviewer signs off candidate methods and table transcription under existing evidence gates; source population/assumptions/license/supersession review; privacy/per-person ownership and missing-field schema decisions; deterministic service/registered operation; input-confirmation experience; independent tests and real Companion verification; Product Knowledge availability update. Do not mark this research as reviewed/published, seed formulas as active or advertise runtime availability.

Data impact: specification only. No live services, databases, scheduled tasks, secrets, configuration, schema or provider calls beyond public web research. No tests/build appropriate for this document-only task. Scoped document review/whitespace check performed. Risk/authority: ANR1 stays canonical and unchanged; no duplicate fact owner introduced. Highest unverified claim is method release suitability, explicitly awaiting editorial sign-off. No clinical implementation implied.

Rollback: rollback/adult-nutrient-method-selection-20261104 → 3467abad4eca8d82ffc52756fee13874e389597f, created/reported before writing. Revert this newly added specification only; preserve the dirty tree. No commit/push/deploy. Remaining gaps are evidence-review, schema/privacy and repository implementation dependencies, not model capability gaps.
