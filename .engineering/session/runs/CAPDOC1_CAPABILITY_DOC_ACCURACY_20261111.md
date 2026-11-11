# CAPDOC1 session run — checkpoint

Date: 2026-11-11. Repo `tha-integrated-dev-g-native-20261003`, branch feat/integrated-dev, HEAD `82f23226f43a3a8e8298f8863c483239a3e2a89d`. Read-only audit; user forbids changes to cap docs and source. Existing dirty files preserved.

Governance read: workspace AGENTS, repo AGENTS and PROJECT_GOVERNANCE, architecture index/conventions, `server/intelligence/intelligence-platform.ts`. Git status inspected with command-local safe.directory; no global config change.

- [x] Enumerated 20 matching cap docs using `rg --files docs/product/intelligence | rg 'cap-.*\\.md$'`; distribution: 16 intelligence, 3 knowledge, 1 companion.
- [ ] Run disposable live registry script and map every id.
- [ ] Read frontmatter/body claims and compare executable verbs/visibility for all 20.
- [ ] Cross-check conversational claims against Intent Resolver matchers.
- [ ] Finish report and list precise discrepancies.

Report: `docs/investigations/platform/CAPDOC1_CAPABILITY_DOC_ACCURACY_20261111.md`. Resume with live registry snapshot before evaluating doc claims. Do not treat static pre-bind registry literals as runtime truth.

Live registry attempt update:
- [x] Wrote the requested disposable script importing intelligencePlatform and calling registry.list()/get().
- [ ] Script execution did not produce output; `npx --no-install tsx ...` remained running >20s and was interrupted. No registry snapshot obtained.
- [x] Removed temporary script and verified it absent.
- [ ] Diagnose local tsx invocation and obtain live registry output; docs remain not checked.

User follow-up checkpoint:
- The promised registry JSON was not present in the received message; it contained only the placeholder `[paste the full JSON snapshot above]`.
- [x] Re-ran verified path enumeration with literal `rg --files docs/product/intelligence | rg 'cap-.*\\.md$'`: 20 matches confirmed.
- [x] Ran a discovery scan for frontmatter and behavioral claims (not sufficient for verdicts).
- [ ] Await actual snapshot content before resolving ids/executable verbs; do not fall back to static declarations.
- [ ] Read each doc fully and compare visibility/claims plus resolver matchers.
No docs have a clean/discrepancy verdict yet. All 20 remain Not yet checked. Temporary tsx script removed.

Snapshot continuation:
- [x] Retrieved attachment `C:\Users\Colin\.codex\attachments\f0ad9f0e-39d8-45a3-9bd3-781915b20563\Pasted text.txt`; it contains the complete 25-capability user-verified post-bootstrap JSON snapshot.
- [x] Treat this as authoritative live evidence; no local import rerun.
- [ ] Compare each document's complete behavioral claims and frontmatter against snapshot and resolver.

Incremental comparisons using the attached live snapshot:
- [x] cap-planner.md — discrepancy: doc says no plan changes; snapshot shows executable add/move/replace.
- [x] cap-shopping.md — discrepancy: doc attributes basket preparation to shopping, but snapshot has no basket/prepare verb; no order verb appears.
- [x] cap-meals.md — behavioral read/search and no-write claims consistent; resolver examples pending.
- [x] cap-discovery-capabilities.md — all seven IDs/availability/search/recommend distinctions match snapshot; matcher/example verification pending.
- [ ] Remaining 16 docs pending.
- [ ] Runtime visibility cannot be confirmed from supplied snapshot fields (no visibility key).
