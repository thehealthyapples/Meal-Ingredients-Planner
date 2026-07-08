# batch-021-core-cheeses — Core Cheeses

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_021_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `cheddar.yaml`
- `mature-cheddar.yaml`
- `red-leicester.yaml`
- `double-gloucester.yaml`
- `wensleydale.yaml`
- `stilton.yaml`
- `brie.yaml`
- `camembert.yaml`
- `mozzarella.yaml`
- `feta.yaml`
- `halloumi.yaml`
- `parmesan.yaml`
- `pecorino.yaml`
- `grana-padano.yaml`
- `gouda.yaml`
- `edam.yaml`
- `emmental.yaml`
- `gruyere.yaml`
- `goat-cheese.yaml`
- `cottage-cheese.yaml`
- `ricotta.yaml`
- `mascarpone.yaml`
- `paneer.yaml`
- `manchego.yaml`
- `roquefort.yaml`
- `gorgonzola.yaml`
- `lancashire-cheese.yaml`
- `cheshire-cheese.yaml`
- `caerphilly.yaml`
- `cornish-yarg.yaml`
