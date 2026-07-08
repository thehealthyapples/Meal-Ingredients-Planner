# NK6 — Validate batch-020-milk-yoghurt-cultured-dairy

Validate this batch through the fixed canonical food identity resolver.

Classify every food as:

- New canonical food
- Existing canonical food
- Merge / enrichment
- Editorial review

Do not create duplicate foods.
Do not use --force-upsert.
Do not import manifest.yaml, README.md or prompt files.

Import only safe new foods after dry-run validation.
Leave merge candidates for review.

Produce a short validation/import report under docs/investigations/.
