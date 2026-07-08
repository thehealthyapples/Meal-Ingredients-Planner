# batch-020-milk-yoghurt-cultured-dairy — Milk, Yoghurt and Cultured Dairy

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_020_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `cow-milk.yaml`
- `whole-milk.yaml`
- `semi-skimmed-milk.yaml`
- `skimmed-milk.yaml`
- `uht-milk.yaml`
- `lactose-free-milk.yaml`
- `goat-milk.yaml`
- `sheep-milk.yaml`
- `single-cream.yaml`
- `double-cream.yaml`
- `whipping-cream.yaml`
- `clotted-cream.yaml`
- `soured-cream.yaml`
- `creme-fraiche.yaml`
- `natural-yoghurt.yaml`
- `greek-yoghurt.yaml`
- `live-yoghurt.yaml`
- `skyr.yaml`
- `quark.yaml`
- `kefir.yaml`
- `buttermilk.yaml`
- `fromage-frais.yaml`
- `cottage-cheese.yaml`
- `ricotta.yaml`
- `mascarpone.yaml`
- `cream-cheese.yaml`
- `labneh.yaml`
- `evaporated-milk.yaml`
- `milk-powder.yaml`
- `whey.yaml`
