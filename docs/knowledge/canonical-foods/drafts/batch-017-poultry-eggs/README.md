# batch-017-poultry-eggs — Poultry and Eggs

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_017_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `chicken.yaml`
- `whole-chicken.yaml`
- `chicken-breast.yaml`
- `chicken-thighs.yaml`
- `chicken-drumsticks.yaml`
- `chicken-wings.yaml`
- `chicken-mince.yaml`
- `turkey.yaml`
- `turkey-breast.yaml`
- `turkey-mince.yaml`
- `turkey-drumsticks.yaml`
- `duck.yaml`
- `duck-breast.yaml`
- `duck-legs.yaml`
- `goose.yaml`
- `quail.yaml`
- `pheasant.yaml`
- `guinea-fowl.yaml`
- `partridge.yaml`
- `pigeon.yaml`
- `hen-eggs.yaml`
- `free-range-eggs.yaml`
- `duck-eggs.yaml`
- `quail-eggs.yaml`
- `goose-eggs.yaml`
- `chicken-liver.yaml`
- `turkey-liver.yaml`
- `duck-liver.yaml`
- `chicken-hearts.yaml`
- `chicken-gizzards.yaml`
