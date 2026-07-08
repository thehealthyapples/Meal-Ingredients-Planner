TASK: Validate and smoke-test Canonical Food Library Batch 001.

Scope:
- Do not import to production.
- Do not create new schema, new vocabularies, or new resolver logic.
- Validate the individual YAML files in docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/ against the existing NK importer path.

Required sequence:
1. Confirm git status.
2. Create rollback protection before any file changes or imports.
3. Copy/unzip the batch into docs/knowledge/canonical-foods/drafts/batch-001-core-everyday-vegetables/.
4. Validate/import carrot.yaml only.
5. Validate/import carrot.yaml, onion.yaml and tomato.yaml.
6. Only if those pass, validate/import the full batch glob.
7. Report all resolved and rejected nutrient/benefit terms.
8. Confirm no duplicate canonical food identities were created.
9. Confirm unresolved terms go to Knowledge Review and are not silently minted.

Definition of Done:
- One-food import works.
- Three-food smoke test works.
- Full-batch import either succeeds or fails with precise per-file warnings.
- No duplicate food identity is created.
- No new nutrient or benefit vocabulary is created by the import.
- All unresolved terms are honestly reported.

Output:
- Files copied
- Commands run
- Import result table by file
- Resolved terms summary
- Rejected terms summary
- Duplicate check result
- Recommendation: proceed / revise batch / block
