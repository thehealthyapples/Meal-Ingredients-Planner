# batch-011-nuts-seeds-mushrooms — Nuts, Seeds and Mushrooms

Draft canonical-food batch for The Healthy Apples.

Contents:

- 30 individual food YAML files
- `manifest.yaml`
- `CLAUDE_VALIDATE_BATCH_011_PROMPT.md`

Import stance:

- Validate first through the fixed NK identity resolver.
- Do not use `--force-upsert`.
- Do not import `manifest.yaml` or README/prompt files.
- Existing identities should become merge/enrichment candidates, not duplicate foods.
- New foods should only be imported into the confirmed lower environment after dry-run classification.

Food files:

- `almonds.yaml`
- `brazil-nuts.yaml`
- `cashew-nuts.yaml`
- `hazelnuts.yaml`
- `macadamia-nuts.yaml`
- `peanuts.yaml`
- `pecans.yaml`
- `pine-nuts.yaml`
- `pistachios.yaml`
- `walnuts.yaml`
- `chestnuts.yaml`
- `chia-seeds.yaml`
- `flaxseeds.yaml`
- `hemp-seeds.yaml`
- `pumpkin-seeds.yaml`
- `sesame-seeds.yaml`
- `sunflower-seeds.yaml`
- `poppy-seeds.yaml`
- `button-mushrooms.yaml`
- `chestnut-mushrooms.yaml`
- `portobello-mushrooms.yaml`
- `shiitake-mushrooms.yaml`
- `oyster-mushrooms.yaml`
- `king-oyster-mushrooms.yaml`
- `enoki-mushrooms.yaml`
- `porcini-mushrooms.yaml`
- `chanterelle-mushrooms.yaml`
- `morel-mushrooms.yaml`
- `mixed-wild-mushrooms.yaml`
- `truffle.yaml`
