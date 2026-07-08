# batch-022-extended-cheeses-dairy-ingredients — Extended Cheeses and Dairy Ingredients

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_022_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `comte.yaml`
- `jarlsberg.yaml`
- `provolone.yaml`
- `taleggio.yaml`
- `morbier.yaml`
- `raclette.yaml`
- `reblochon.yaml`
- `burrata.yaml`
- `buffalo-mozzarella.yaml`
- `bocconcini.yaml`
- `goat-curd.yaml`
- `sheep-cheese.yaml`
- `feta-style-salad-cheese.yaml`
- `blue-cheese.yaml`
- `soft-blue-cheese.yaml`
- `hard-goat-cheese.yaml`
- `smoked-cheese.yaml`
- `emmenthal.yaml`
- `limburger.yaml`
- `fontina.yaml`
- `asiago.yaml`
- `scamorza.yaml`
- `dolcelatte.yaml`
- `st-agur.yaml`
- `cambozola.yaml`
- `yorkshire-blue.yaml`
- `somerset-brie.yaml`
- `goats-log.yaml`
- `cheese-curds.yaml`
- `whey-protein.yaml`
