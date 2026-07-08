# batch-019-offal-high-nutrient-animal-foods — Offal and High-nutrient Animal Foods

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_019_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `beef-liver.yaml`
- `lamb-liver.yaml`
- `pork-liver.yaml`
- `chicken-liver.yaml`
- `duck-liver.yaml`
- `calves-liver.yaml`
- `lamb-kidney.yaml`
- `beef-kidney.yaml`
- `pork-kidney.yaml`
- `beef-heart.yaml`
- `lamb-heart.yaml`
- `chicken-hearts.yaml`
- `ox-heart.yaml`
- `beef-tongue.yaml`
- `lamb-tongue.yaml`
- `pork-tongue.yaml`
- `oxtail.yaml`
- `beef-cheek.yaml`
- `ox-cheek.yaml`
- `bone-marrow.yaml`
- `beef-bones.yaml`
- `chicken-bones.yaml`
- `lamb-bones.yaml`
- `tripe.yaml`
- `sweetbreads.yaml`
- `pork-trotters.yaml`
- `lamb-sweetbreads.yaml`
- `fish-head.yaml`
- `fish-bones.yaml`
- `chicken-feet.yaml`
