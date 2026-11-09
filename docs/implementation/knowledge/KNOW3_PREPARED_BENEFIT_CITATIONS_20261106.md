# KNOW3 prepared benefit citations — 6 November 2026

## Outcome

Continued the owner-requested citation work in Integrated Dev. Added 111 official-source references across the continuation: quantified CNF/CoFID composition evidence and NHS food-benefit evidence. All references were prepared as unsigned candidates. Codex did not approve or reject claims.

The newly opened Admin queue at `http://127.0.0.1:5001/admin/knowledge-claims` now shows **66 cited, awaiting a reviewer; 2,340 awaiting a source; 978 approved; 0 rejected**. This reconciles to the configured development database summary: composition 1,014 pending (27 cited); food-benefit 1,360 pending (39 cited); nutrient-benefit 32 pending (0 cited). The old already-open tab still displayed 2,412 awaiting a source; a fresh page load showed 2,340 and the new citations. Refresh the older tab to load current totals.

## Scope and evidence

### Composition

- Batches 5–7: 39 quantified Health Canada CNF 2026 / UK CoFID 2021 food-form citations.
- Batch 8: 2 CoFID records (sauerkraut fibre; starfruit fibre).
- Batch 9: 25 single-record quantified Health Canada CNF matches (raw spring onion, lime, pomegranate, nectarine, clementine and quince; plus specifically recorded spice, oil, caper and juice forms).

Every excerpt gives the record and amount per 100 g and asks the reviewer to confirm food form and ordinary-serving relevance. The excerpts do not establish that every food meets the application's notable-source wording.

### Direct food-benefit claims

- Batch 1: 6 claims supported by NHS sources on unsaturated fats, oily fish and heart health.
- Batch 2: 7 claims supported by NHS food-group guidance on seeds, fruit and oats.
- Batches 3–4: 24 pulse claims matched to an NHS Trust dietetics fact sheet which names pulse forms and discusses fibre/digestion, soluble fibre/cholesterol/heart health, and low-GI effects on blood glucose.
- Batch 5: 4 flax/chia entries matched to NHS IBS and coronary heart disease guidance. The excerpts state that IBS guidance is symptom-specific and that the seed evidence is food-group level.
- Batch 6: 4 oats/brown-rice digestive entries matched to the NHS digestion page. Its next review date (5 January 2026) has passed; this is stated in the citation excerpt for reviewer confirmation.

Sources used include [NHS “Facts about fat”](https://www.nhs.uk/live-well/eat-well/food-types/different-fats-nutrition/), [NHS “Fish and shellfish”](https://www.nhs.uk/live-well/eat-well/food-types/fish-and-shellfish-nutrition/), [NHS coronary heart disease prevention](https://www.nhs.uk/conditions/coronary-heart-disease/prevention/), [East Lancashire Hospitals NHS Trust “Pulses”](https://elht.nhs.uk/application/files/7016/7639/3728/pulses.pdf), [NHS digestion guidance](https://www.nhs.uk/Live-well/eat-well/digestive-health/good-foods-to-help-your-digestion/), and [NHS IBS diet guidance](https://www.nhs.uk/conditions/irritable-bowel-syndrome-ibs/diet-lifestyle-and-medicines/). Health Canada's official [Canadian Nutrient File](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-about-us.html) and UK [CoFID](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid) are the composition references.

## Governance and architecture

- **Owning repository/area:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, Nutrition Knowledge / Admin.
- **Branch/HEAD:** `feat/integrated-dev`, `2df56257a54942ce2c4d7718fe7a52c33db2d9f4`.
- **Risk:** RED — persistent nutrition evidence can be published after named human sign-off.
- **Authority:** owner’s ongoing explicit request to research and attach sources; repository standing `Implementation permitted: YES` for this development branch.
- **Rollback:** `rollback/KNOW3-benefit-citations-20261106` points to the recorded HEAD. Existing citation-removal operations can reverse a specific pending reference with an audit event. Pre-existing changes were preserved; no reset, branch change, commit, push or deployment occurred.
- **Canonical ownership:** claims and `source_refs` remain on existing knowledge-claim records; source history remains in the existing audit ledger. The existing Nutrition Knowledge registry is the household reader. No parallel source store or review workflow was added.
- **Human gate:** prepared refs have `lastReviewed` empty and are attributed to Codex as an LLM researcher. Claim decision and reviewer fields were not written by this task. Human source verification and approval remain separate.
- **Data impact:** development-local Neon claim rows and their existing source-attachment audit events only. No schema/migration, runtime restart, production/staging database or configuration changes.

## Checks and remaining work

- Composition batches 8 and 9 and benefit batches 2–6 passed guarded preview/apply/read-back verification. Batch 1 benefit source attaches are recorded in its receipt; a human reviewer subsequently approved those claims.
- The guarded importer checks development environment, pinned local endpoint, branch, exact identity, active/pending status, empty citation list, source-role policy and source validity. It uses the canonical transaction/audit writer.
- `npm run build` passed earlier in this implementation session after adding the internal prepared-claim guard and importer (existing build warnings only). No test suite was run; the user did not request tests.
- No approvals or rejections were made by Codex. The live Admin count was confirmed in a fresh browser page; an old tab had stale counts.
- **Still uncited:** 2,340 active pending claims: 987 composition, 1,321 food-benefit and 32 nutrient-benefit. Keep sourcing in conservative batches; where no exact trustworthy evidence exists, leave the claim uncited and document the reason. Human sign-off remains required.

## Artifacts

Manifests and receipts are in `G:\The Healthy Apples\Incoming\Agent Reports`:

- `2026-11-06__codex__KNOW3-citations-batch8.json` and its receipt/verify files.
- `2026-11-06__codex__KNOW3-citations-batch9.json` and its receipt/verify files.
- `2026-11-06__codex__KNOW3-food-benefit-batch1.json` through `...batch6.json` and their receipt/verify files.
- Continuation report: `2026-11-06__codex__KNOW3-citations-continuation-report.md`.
