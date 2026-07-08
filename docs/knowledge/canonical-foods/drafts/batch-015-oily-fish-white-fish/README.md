# batch-015-oily-fish-white-fish — Oily Fish and White Fish

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_015_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `cod.yaml`
- `haddock.yaml`
- `pollock.yaml`
- `hake.yaml`
- `plaice.yaml`
- `lemon-sole.yaml`
- `dover-sole.yaml`
- `sea-bass.yaml`
- `sea-bream.yaml`
- `monkfish.yaml`
- `halibut.yaml`
- `turbot.yaml`
- `trout.yaml`
- `rainbow-trout.yaml`
- `mackerel.yaml`
- `sardines.yaml`
- `pilchards.yaml`
- `anchovies.yaml`
- `herring.yaml`
- `kippers.yaml`
- `tuna.yaml`
- `albacore-tuna.yaml`
- `tilapia.yaml`
- `basa.yaml`
- `coley.yaml`
- `whiting.yaml`
- `skate.yaml`
- `red-mullet.yaml`
- `snapper.yaml`
- `whitebait.yaml`
