# Batch 002 — Extended Greens, Brassicas, Salad Leaves, Pods & Shoots

This zip contains **30 individual canonical-food YAML files** for The Healthy Apples.

It follows the safer import path: one food per YAML file, then import with a glob. Do not combine these into one multi-food YAML unless the importer is explicitly changed and tested for that structure.

## Target repo path

```text
docs/knowledge/canonical-foods/drafts/batch-002-extended-greens-brassicas-salad-pods-shoots/
```

## Duplicate-avoidance notes

- `cavolo nero` is not included because Batch 001 `kale` already owns it as an alias.
- Standard cabbage varieties are not included because Batch 001 `cabbage` already owns them.
- Standard lettuce varieties are not included because Batch 001 `lettuce` already owns them.
- `broccoli` and `spinach` are not included because they belong to the earlier canonical starter set.

## Smoke test first

Run one file first:

```bash
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/batch-002-extended-greens-brassicas-salad-pods-shoots/brussels-sprouts.yaml
```

Then run three files:

```bash
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/batch-002-extended-greens-brassicas-salad-pods-shoots/{brussels-sprouts,pak-choi,watercress}.yaml
```

Then run the full batch:

```bash
npm run import:canonical-foods docs/knowledge/canonical-foods/drafts/batch-002-extended-greens-brassicas-salad-pods-shoots/*.yaml
```

## Do not import to production until

- The repo validator/importer accepts the files.
- The first 3 smoke-test files import cleanly or produce only expected review warnings.
- Any unresolved nutrient/benefit terms are captured by Knowledge Review, not silently minted.
- Claude confirms no duplicate canonical foods are being created, especially around kale/cabbage/lettuce/broccoli ownership.

## Files

- `brussels-sprouts.yaml` — Brussels Sprouts
- `spring-greens.yaml` — Spring Greens
- `pak-choi.yaml` — Pak Choi
- `chinese-leaf.yaml` — Chinese Leaf
- `swiss-chard.yaml` — Swiss Chard
- `watercress.yaml` — Watercress
- `rocket.yaml` — Rocket
- `lambs-lettuce.yaml` — Lamb's Lettuce
- `radicchio.yaml` — Radicchio
- `chicory.yaml` — Chicory
- `frisee.yaml` — Frisée
- `cress.yaml` — Cress
- `pea-shoots.yaml` — Pea Shoots
- `bean-sprouts.yaml` — Bean Sprouts
- `alfalfa-sprouts.yaml` — Alfalfa Sprouts
- `okra.yaml` — Okra
- `mangetout.yaml` — Mangetout
- `sugar-snap-peas.yaml` — Sugar Snap Peas
- `runner-beans.yaml` — Runner Beans
- `broad-beans.yaml` — Broad Beans
- `baby-corn.yaml` — Baby Corn
- `globe-artichoke.yaml` — Globe Artichoke
- `kohlrabi.yaml` — Kohlrabi
- `romanesco.yaml` — Romanesco
- `celeriac.yaml` — Celeriac
- `bamboo-shoots.yaml` — Bamboo Shoots
- `water-chestnuts.yaml` — Water Chestnuts
- `samphire.yaml` — Samphire
- `fresh-chilli-pepper.yaml` — Fresh Chilli Pepper
- `mizuna.yaml` — Mizuna
