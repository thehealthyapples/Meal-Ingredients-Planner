# batch-018-meat-game — Meat and Game

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_018_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `beef.yaml`
- `beef-mince.yaml`
- `beef-steak.yaml`
- `beef-joint.yaml`
- `beef-brisket.yaml`
- `beef-short-ribs.yaml`
- `pork.yaml`
- `pork-chops.yaml`
- `pork-mince.yaml`
- `pork-shoulder.yaml`
- `pork-tenderloin.yaml`
- `pork-belly.yaml`
- `lamb.yaml`
- `lamb-chops.yaml`
- `lamb-mince.yaml`
- `lamb-leg.yaml`
- `lamb-shoulder.yaml`
- `mutton.yaml`
- `venison.yaml`
- `venison-steak.yaml`
- `venison-mince.yaml`
- `rabbit.yaml`
- `goat.yaml`
- `veal.yaml`
- `wild-boar.yaml`
- `kangaroo.yaml`
- `ostrich.yaml`
- `bison.yaml`
- `elk.yaml`
- `hare.yaml`
