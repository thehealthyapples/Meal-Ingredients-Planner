TASK: Validate and smoke-test Canonical Food Library Batch 002.

Scope:
- Do not import to production.
- Do not create new schema, new vocabularies, or new resolver logic.
- Validate the individual YAML files in docs/knowledge/canonical-foods/drafts/batch-002-extended-greens-brassicas-salad-pods-shoots/ against the existing NK importer path.

Required sequence:
1. Read docs/architecture/README.md.
2. Confirm git status.
3. Create rollback protection before any file changes or imports.
4. Copy/unzip the batch into docs/knowledge/canonical-foods/drafts/batch-002-extended-greens-brassicas-salad-pods-shoots/.
5. Validate/import brussels-sprouts.yaml only.
6. Validate/import brussels-sprouts.yaml, pak-choi.yaml and watercress.yaml.
7. Only if those pass, validate/import the full batch glob.
8. Report all resolved and rejected nutrient/benefit terms.
9. Confirm no duplicate canonical food identities were created.
10. Specifically check duplicate risk against existing kale, cabbage, lettuce, broccoli and spinach identities.
11. Confirm unresolved terms go to Knowledge Review and are not silently minted.

Definition of Done:
- One-food import works.
- Three-food smoke test works.
- Full-batch import either succeeds or fails with precise per-file warnings.
- No duplicate food identity is created.
- No new nutrient or benefit vocabulary is created by the import.
- All unresolved terms are honestly reported.

Output:
- Rollback identifier
- Files copied
- Commands run
- Import result table by file
- Resolved terms summary
- Rejected terms summary
- Duplicate check result
- Recommendation: proceed / revise batch / block
