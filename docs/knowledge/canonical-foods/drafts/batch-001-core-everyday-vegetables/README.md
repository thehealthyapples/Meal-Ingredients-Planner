# Batch 001 — Core Everyday Vegetables

This zip contains **30 individual canonical-food YAML files** for The Healthy Apples.

It follows the safer import path: one food per YAML file, then import with a glob. Do not combine these into one multi-food YAML unless the importer is explicitly changed and tested for that structure.

## Target repo path

```text
docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/
```

## Smoke test first

Run one file first:

```bash
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/carrot.yaml
```

Then run three files:

```bash
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/{carrot,onion,tomato}.yaml
```

Then run the full batch:

```bash
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/*.yaml
```

## Do not import to production until

- The repo validator/importer accepts the files.
- The first 3 smoke-test files import cleanly or produce only expected review warnings.
- Any unresolved nutrient/benefit terms are captured by Knowledge Review, not silently minted.
- Claude confirms no duplicate canonical foods are being created.

## Files

- `carrot.yaml` — Carrot
- `onion.yaml` — Onion
- `garlic.yaml` — Garlic
- `shallot.yaml` — Shallot
- `spring-onion.yaml` — Spring Onion
- `leek.yaml` — Leek
- `celery.yaml` — Celery
- `cucumber.yaml` — Cucumber
- `tomato.yaml` — Tomato
- `sweet-pepper.yaml` — Sweet Pepper
- `aubergine.yaml` — Aubergine
- `courgette.yaml` — Courgette
- `cauliflower.yaml` — Cauliflower
- `cabbage.yaml` — Cabbage
- `kale.yaml` — Kale
- `lettuce.yaml` — Lettuce
- `beetroot.yaml` — Beetroot
- `parsnip.yaml` — Parsnip
- `swede.yaml` — Swede
- `turnip.yaml` — Turnip
- `radish.yaml` — Radish
- `potato.yaml` — Potato
- `sweet-potato.yaml` — Sweet Potato
- `butternut-squash.yaml` — Butternut Squash
- `pumpkin.yaml` — Pumpkin
- `asparagus.yaml` — Asparagus
- `green-beans.yaml` — Green Beans
- `garden-peas.yaml` — Garden Peas
- `sweetcorn.yaml` — Sweetcorn
- `fennel-bulb.yaml` — Fennel Bulb
