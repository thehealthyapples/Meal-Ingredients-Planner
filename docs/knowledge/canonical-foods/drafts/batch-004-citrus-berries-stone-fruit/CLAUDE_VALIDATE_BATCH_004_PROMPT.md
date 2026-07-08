Validate Canonical Food 004 without importing unsafe records.

Use the attached zip for `batch-004-citrus-berries-stone-fruit`.

Before any action:
1. Read docs/architecture/README.md.
2. Run git status.
3. Confirm rollback protection or create a rollback tag/commit and report it.
4. Create report:
docs/investigations/BATCH_004_CANONICAL_FOOD_IMPORT_VALIDATION.md

Task:
- Extract the batch to docs/knowledge/canonical-foods/drafts/batch-004-citrus-berries-stone-fruit/
- Confirm there is one YAML file per food.
- Use the fixed alias-aware canonical food resolver.
- Run dry-run/validation only first: 1 file, 3 files, full batch.
- Do not use --force-upsert.
- Do not import manifest.yaml, README.md or this prompt.
- Classify each food as safe new import, existing exact identity, alias-resolved merge candidate, soft overlap, or blocked conflict.
- If safe-new foods exist and the active DATABASE_URL is confirmed lower environment, import only those.
- Do not import merge candidates or conflicts without explicit approval.

Output:
- rollback identifier
- database target confirmation
- commands run
- one-file dry-run result
- three-file dry-run result
- full-batch dry-run result
- safe imports performed, if any
- merge/enrichment candidates
- blocked conflicts
- report file location
