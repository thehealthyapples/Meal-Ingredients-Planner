# CAPDOC1 — Capability product-document accuracy (partial)

Date: 2026-11-11. Scope: the 20 `cap-*.md` files under `docs/product/intelligence/{intelligence,knowledge,companion}-capabilities/`. Authority for executability is the live bootstrapped `intelligencePlatform.registry`, not pre-bind literals. No source or capability-doc edits.

## Live registry snapshot

A disposable tsx script imported `intelligencePlatform` and printed `.registry.list()` plus `.registry.get(id)` results. It was run from the repo root and deleted immediately afterward. Snapshot output and per-document comparison are being recorded incrementally in this report; docs remain unchecked until their claims and resolver reachability are compared.

## Document status (20 total)

### `intelligence-capabilities/`
- `cap-administration.md` — Not yet checked.
- `cap-analyser.md` — Not yet checked.
- `cap-community.md` — Not yet checked.
- `cap-discovery-capabilities.md` — Not yet checked (covers seven ids).
- `cap-food-intelligence.md` — Not yet checked.
- `cap-household.md` — Not yet checked.
- `cap-developer.md` — Not yet checked.
- `cap-diary.md` — Not yet checked.
- `cap-templates.md` — Not yet checked.
- `cap-shopping.md` — Not yet checked.
- `cap-profile.md` — Not yet checked.
- `cap-planner.md` — Not yet checked.
- `cap-partners.md` — Not yet checked.
- `cap-pantry.md` — Not yet checked.
- `cap-opportunity-delivery.md` — Not yet checked.
- `cap-meals.md` — Not yet checked.

### `knowledge-capabilities/`
- `cap-product-knowledge.md` — Not yet checked.
- `cap-nutrition-knowledge.md` — Not yet checked.
- `cap-evidence-learning.md` — Not yet checked.

### `companion-capabilities/`
- `cap-companion.md` — Not yet checked.

No clean verdict is inferred from this inventory.

## Runtime attempt status

The disposable registry script was created as described, but `npx --no-install tsx server/intelligence/.capdoc1-live-registry-check.ts` produced no output and remained running beyond 20 seconds. It was interrupted; the temporary script was then removed and verified absent. Therefore **no live registry snapshot was obtained** and no capability doc is checked yet. Retry with the repository's available local `tsx` executable/runtime after diagnosing why this command did not start; do not substitute static registry declarations.

## User-supplied snapshot availability

The follow-up message referred to a pasted JSON snapshot, but the message received in this thread contains the literal placeholder `[paste the full JSON snapshot above]` and no JSON records. I cannot map the 20 docs to live values from data that is not present. No registry/executability verdict is made on that basis.

## Additional source work

Confirmed the three requested directories with the literal command `rg --files docs/product/intelligence | rg 'cap-.*\.md$'`; it returned 20 paths (16 intelligence, 3 knowledge, 1 companion). A factual-claim scan was run with `rg -n '^\s*(entry|status|visibility|last_verified):|^#|can |cannot |supports|executable|conversation|search|write|read|invoke|intent|availability|discover' docs/product/intelligence --glob 'cap-*.md'`. This is discovery only; no per-document verdict is valid until the live snapshot is available and the complete body is read. Resolver claim verification likewise remains open.

No files were modified other than this investigation and its run checkpoint; the temporary script is absent. All 20 entries remain Not yet checked.

## Live snapshot received

The previously missing JSON was supplied in the user's attached text file `Pasted text.txt` and is now available as owner-provided verified post-bootstrap registry evidence for all 25 capabilities. It supersedes the failed local script attempt; no rerun is needed. The disposable script is absent. I will map entry ids and compare behavior claims against those values, then separately validate conversational reachability against resolver matchers. Per-document checks are being completed incrementally; unchecked entries remain explicit.

## Incremental checks — intelligence capability docs

### `cap-planner.md` — discrepancy

Frontmatter: `entry: cap-planner`, `status: live`, `visibility: household`, `last_verified: 2026-07-11`. Snapshot resolves `planner` as registered/available, with supported verbs including `add`, `move`, `replace`, and `delete`; executable verbs include `add`, `move`, and `replace` (not delete). The doc says both in its headline and “What it will never do” that Companion cannot change the plan and cannot add/move/swap/remove meals. That behavioral claim is stale: live registry now exposes add/move/replace as executable. Resolver source includes planner action routing (e.g. `pattern-intent-resolver.ts` planner matcher/action regions; exact action matcher audit remains pending). Registry alone is enough to disprove “cannot yet change it.” Snapshot does not include a `visibility` field, so runtime visibility cannot be independently confirmed from the supplied data.

### `cap-shopping.md` — discrepancy / not fully verifiable

Frontmatter: `entry: cap-shopping`, `status: live`, `visibility: household`, `last_verified: 2026-07-11`. Snapshot resolves `shopping` as registered/available, with executable verbs `read`, `explain`, `add`, and `delete`. The document says it can “prepare a basket ready to hand to a supermarket”; no `basket`/`prepare` verb appears in the supported or executable verb sets for this capability. That specific capability attribution is not supported by the live registry snapshot and is flagged for owner review. “Can never place an order” is consistent with the snapshot’s verb set but not independently provable from absence alone. Runtime visibility is not in the snapshot.

### `cap-meals.md` — checked, behavior consistent

Frontmatter maps `cap-meals` to `meals`, live/household, last verified 2026-07-11. Snapshot: `meals` is available; executable `read`, `search`; no write verbs. Its claim that Companion can find/explain recipes is broadly consistent with search/read; its statement that it does not create/edit/delete recipes is consistent with the executable set. Conversational examples (“ask Companion about a meal…”) have not yet been fully matched against resolver coverage. Snapshot omits runtime visibility.

### `cap-discovery-capabilities.md` — checked against snapshot, resolver check pending

Frontmatter: live/household, last verified 2026-11-10; one page covers seven ids. Snapshot confirms all seven ids exist and are available with executable `search`: `meal-discovery`, `nutrition-discovery`, `planner-discovery`, `pantry-discovery`, `diary-discovery`, `shopping-discovery`, `household-discovery`. It confirms only the first two also support `recommend` but do not execute it; the other five do not declare `recommend`. Thus the doc’s current verb/availability claims match the snapshot; conversational reachability claims and examples await per-id matcher confirmation. Snapshot omits runtime visibility.

## Remaining documents

All other 16 files remain **Not yet checked**. For the four checked files above, frontmatter visibility is recorded but runtime visibility is not in the supplied snapshot schema; no runtime visibility claim is asserted.
