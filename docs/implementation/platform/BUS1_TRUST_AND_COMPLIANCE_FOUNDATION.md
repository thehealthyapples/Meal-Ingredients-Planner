# BUS1 — Trust & Compliance Foundation — Implementation

**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Creates three tables, an irreversible destructive operation (account erasure) reachable by every household, and the platform's first legally-binding published documents.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/BUS1-trust-and-compliance-foundation-20260718` → `8e25c195041f9298ace428db8e2ead304d9106de` |
| Working tree | **Intentionally dirty, and NOT this session's work** — 24 modified tracked files and 280 untracked paths from prior programmes (`HOUSE_ACT*`, `PROD3`/`PROD4`, `docs/ui-audit/` screenshots) were present at session start |
| What the tag does NOT cover | All of the above. A tag protects **committed state only** |
| Mitigation taken | Every dirty tracked file was snapshotted to the session scratchpad before any edit. This session committed only its own paths |
| Rollback to committed state | `git checkout rollback/BUS1-trust-and-compliance-foundation-20260718` |
| Database rollback | `DROP TABLE user_consents, support_requests, privacy_activity_log;` then `DELETE FROM schema_migrations WHERE id = '2026-07-18_bus1_trust_and_compliance';` The one `ALTER` (dropping a `NOT NULL`) is safe to leave — see Data Impact |

**One honest caveat on the commit.** `package.json` carried an addition (`test:nut-verify1`) authored by another in-flight session before this one began. It is preserved intact and was committed alongside this work, because this session's own test registration lives in the same file. Nothing was overwritten; the diff is 5 insertions and 2 deletions.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight principles + eight governance rules)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md`
- [x] `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` § 17, § 18 (UX Governance Checklist + Premium Standard)
- [x] `docs/architecture/THA_UI_ARCHITECTURE.md` § 17, § 18 (UI Governance Checklist, adoption register)
- [x] `docs/architecture/THA_EXPERIENCE_LANGUAGE.md` § 6, § 7 (Review Questions, Anti-Patterns)
- [x] `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` § 15.2, § 15.3 (Blueprint Checks, Experience Test)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `MIGRATIONS.md`
- [x] `docs/investigations/platform/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md` (the gap this closes)

---

## THE FINDING THAT SHAPED THE WORK

The mission asked for a Trust & Compliance layer. Reconnaissance found that the hardest part was not the missing features — it was that **the database could not support a correct erasure**, and nothing in the platform said so.

| Finding | Evidence | Consequence |
|---|---|---|
| The **core** of a household's data has no FK to `users` | `meals:93`, `shopping_list:178`, `planner_weeks:425`, `user_preferences:684`, `meal_plans:406`, `freezer_meals:838`, `basket_items:859`, `product_history:814` | Deleting a user leaves every row behind, silently and forever |
| ~10 tables have an FK with **no `ON DELETE`** | `admin_audit_log`, `recipe_source_audit_log`, the `knowledge_*` review chain, `meal_pairings`, `ingredient_products` | Postgres **BLOCKS** the delete |
| `admin_audit_log.admin_user_id` was **`NOT NULL`** + blocking FK | `shared/schema.ts:965` | **Art. 17 was unsatisfiable for every operator account in the platform's history.** Not "done badly" — refused outright |
| `household_eaters.user_id` is **`ON DELETE SET NULL`** | `shared/schema.ts:1215` | A person's declared **allergies** — Art. 9 health data — **outlive their account** as an orphan carrying their display name |
| The planner is 2 levels of parent, **no cascade at either** | `planner_weeks → planner_days → planner_entries` | Deleting a parent strands its children permanently |
| `session` is **invisible to Drizzle** | Created by raw SQL, `server/storage.ts:433` | A "deleted" account stays signed in on the device that deleted it |
| The only multi-table delete touched **13 of ~45** tables | `storage.cleanupDemoUser`, `server/storage.ts:3754` | And it was what a GDPR erasure would inevitably have been built on |
| `cleanupDemoUser` found planner weeks by `household_id` **alone** | `storage.ts:3761`; the column is nullable | Every week created before a household existed survived deletion |
| `cleanupDemoUser` deleted the **whole household** | `storage.ts:3785-3786` | As an erasure template it would have destroyed **other people's** data |

**This is why the personal data registry is executable rather than declarative.** A metadata table interpreted by a generic engine would have needed an escape hatch for every row above.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity ✓
  user_consents, support_requests and privacy_activity_log all key on the
  existing users.id space. No new key space. privacy_activity_log holds a
  DELIBERATELY unconstrained integer — it must outlive the row it names.

□ One owner per fact ✓
  Four owners created (legal register, consent vocabulary, personal data
  registry, support vocabulary). Each owns a fact nothing else owned.
  One duplication REMOVED: supportEmail/suggestionsEmail existed as literals
  in BOTH server/auth.ts:217-218 and profile-page.tsx:1738-1739. Both now read
  shared/legal/company-profile.ts. Net owners of that fact: 2 → 1.

□ No duplicate entities ✓
  Support requests are ONE entity with a `kind`, not four. Verified no support
  table existed: 91 pgTable declarations searched; the only "feedback" table is
  companionResponseFeedback, a thumbs rating on a conversation turn with no
  free text and no lifecycle.

□ No duplicate ownership ✓
  The personal data registry ENUMERATES data owned by other domains; it owns
  none of it. Rule TC6 forbids export and erasure disagreeing.

□ No duplicate state ✓
  Consent state is derived (newest row per pair), never stored as state.
  Nothing caches "has consented".

□ Extends existing architecture ✓
  registerTrustRoutes(app) follows setupAuth(app). Bounded services follow
  knowledge-review-store.ts / classification-store.ts. Pure shared modules
  follow shared/time/household-time.ts. Pages follow WorkspaceHeader +
  pageContainerClass. Migration appended to the runner per MIGRATIONS.md.

□ Progressive enrichment where appropriate ✓ (N/A)
  All three tables are transactional/evidential, not knowledge entities.
  Enrichment is not added.

□ Knowledge domain compliance ✓
  Introduces no knowledge domain. Help Centre content is editorial, not
  knowledge, and carries its Governance Rule 6 retirement condition (§ below).

□ Honest gaps over fabricated information ✓
  Placeholder company facts render an undismissable notice naming each
  unverified field. A consent with no row reports granted:false, not an
  inferred yes. An unresolved {{token}} is left VISIBLE and warned, never
  replaced with an empty string. Export omissions are stated in the file.

□ No permanent synchronisation bridge ✓
  None. Consent state is derived on read. /api/config reads the company
  profile at request time rather than copying it.

□ Evolution over replacement ✓
  server/email.ts — REPLACED, migrated, DELETED in this change.
  storage.cleanupDemoUser — body replaced by an alias to the canonical
  erasure service; signature unchanged, both callers unaffected.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domains affected: 34 (Legal Agreement & Consent), 35 (Personal Data /
                  Subject Rights), 36 (Support Requests) — all NEW.
                  Touched, not owned: every domain the personal data
                  registry enumerates.
Declared SoT:     shared/legal/ + user_consents (34)
                  server/privacy/personal-data-registry.ts (35)
                  support_requests (36)
New store created? YES — three tables, three new domains.
  Retirement plan for any replaced store:
    server/email.ts        → deleted in this change.
    cleanupDemoUser body   → replaced by the canonical erasure service.
    Two hardcoded contact-address copies → converged onto the company profile.
Existing store extended? YES — admin_audit_log.admin_user_id NOT NULL dropped.
Consumer created? YES — 4 pages, 15 endpoints.
  Reads from declared SoT? YES, in every case.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
Domain:                        Personal Data (Subject Rights) — Register Domain 35
Current Canonical Owner:       server/privacy/personal-data-registry.ts
Current Runtime Consumer(s):   data-export-service.ts (Art. 15),
                               account-erasure-service.ts (Art. 17),
                               GET /api/privacy/summary (Privacy Settings),
                               storage.cleanupDemoUser (retired onto it)
Duplicate Owners Remaining:    NONE. cleanupDemoUser was the only rival
                               enumeration of user-scoped data and now delegates.
Duplicate State Remaining:     NONE
Duplicate Workflows Remaining: NONE — export and erasure share one declaration.
Current Convergence (%):       100% of the ERASURE path — 21 declared personal
                               data categories covering ~45 user-attributable
                               tables, all reachable from one registry, verified
                               by 42 checks against a live database.
                               Evidence: 13 of ~45 tables covered before (28%),
                               all of them now.
Target Convergence (%):        100%
Next Planned Milestone:        N/A for this domain.
Remaining Architectural Risks: The SCHEMA remains irregular — ~8 core tables
                               still declare no FK to users. The registry now
                               handles that correctly, but a NEW table added
                               without an FK and without a registry entry would
                               be missed. Mitigated by a completeness gate
                               (registeredTables()) and the verification test;
                               NOT mitigated by the database itself. Adding the
                               missing foreign keys is a separate, larger
                               migration and is deliberately not attempted here.
```

---

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

```
✓ UX Governance Checklist (EXP §18) completed in full, including Premium Standard
✓ UI Governance Checklist (UIA §18) completed in full
✓ Experience Review Questions (EXPLANG §6) answered; no Anti-Pattern adopted
✓ Experience Test (EXPBLUE §15.3) answered per screen — recorded in each page's
    header comment, in the source, where the next person editing it will see it
✓ Blueprint Checks (EXPBLUE §15.2) — the shell is byte-untouched; no orchard,
    light, material or Living Detail was altered. Legal pages render OUTSIDE the
    house chrome deliberately (a document being read closely is not a room).
✓ Conflicts resolved in the Experience Architecture's favour — none arose
✓ Nothing owns a fact at the presentation layer; gaps render as honest absence
✓ Any new visual pattern retired its predecessor — server/email.ts's two inline
    HTML templates were migrated onto one layout and DELETED
```

**The checklist item this workstream is really about — dark patterns.** Deleting an account is the most dark-pattern-infested interaction in consumer software. The design rules were made explicit and are recorded in `privacy-settings-page.tsx`'s header: deletion is one step from Profile and not buried; the friction (password + the word `DELETE`) protects the person from a mis-click and never THA from losing them; it does not ask why they are leaving, offer a discount, offer a pause, or count what they will lose. Download-your-data sits immediately above it because it is genuinely useful to someone about to leave — not as a diversion.

**One Premium Standard note.** The deletion confirmation is inline, not a modal. A dialog that can be dismissed by clicking away is the wrong shape for an irreversible action: it invites reflexive dismissal and hides the consequences behind a scrim while asking the person to accept them.

---

## PRODUCT REGISTRY IMPACT

- Registry affected: **YES**
- Entries created: see `docs/product/inventory/product.yaml` — `dom-trust-and-compliance`, `page-legal` (**public**), `page-privacy-settings`, `page-help-centre`, `page-contact`, `set-privacy-and-data` (all `household` unless noted), each with owner *Colin Clapson* and `last_verified: 2026-07-18`
- Entries updated: `routes-map` (5 new routes, 2 of them public), `api-surface` (the BUS1 endpoint group)
- Entries retired: NONE
- `public` visibility justified: `page-legal` only. A policy a person must agree to before signing up cannot live behind a login (Rule TC9)
- Product knowledge written into a prompt, template, or fallback string: **NO**

---

## ADOPTION REGISTER IMPACT

- Register affected: **YES**
- Owners created: `legal-document-presentation` → `client/src/components/legal/legal-document-view.tsx`, first consumer `legal-page.tsx` (1 importer, floor 1)
- Owners adopted: `mutation-feedback` (`useTrackedMutation`) adopted by all 3 new mutations; `button-primitive` adopted by the 2 raw `<button>` elements in the Help Centre
- Predecessors retired: `server/email.ts` (not a client block, recorded for completeness)
- Rival ceilings raised: **1, deliberately.** `loading-state` / `<Loader2>` 179 → 181. Both new marks sit **inside a control** while an indeterminate request is in flight, which is the usage this concern's own rule assigns to `Loader2` rather than `Skeleton` (*"Skeleton owns content arriving; Loader2 owns indeterminate work inside a control"*). Content-arriving states on the same page use `Skeleton`, as the rule requires. Reason recorded in the JSON.
- Exemptions added: 1 — the sub-processor table on `legal-page.tsx` is not a clause of the document (it is generated from `subprocessors.ts` and renders as cards); routing it through the block renderer would have required a fifth block kind used by exactly one document
- `npm run adoption:check` passes: **YES — 83 passed · 0 notices · 0 failed** (was 82/0/0)

---

## DATA IMPACT

- Reads existing data: **YES** — the export reads ~45 user-attributable tables
- Writes new data: **YES** — three new tables
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

**The one alteration to an existing table**, stated plainly: `admin_audit_log.admin_user_id` had its `NOT NULL` dropped. It invalidates no existing row and no existing `INSERT` (every current writer supplies the column), and it is what makes Art. 17 satisfiable for operator accounts at all. Deleting the audit rows instead was rejected — an audit log a person can erase by asking is not an audit log, and this one records who approved THA's food and knowledge decisions.

**Accounts created before this change have no consent rows**, and Privacy Settings reports that honestly as `granted: false` rather than inferring a yes from the existence of the account. Re-consent prompting is `BUS2`.

---

## TRUST CHECK

- **Could this mislead the user?** The risk is concentrated in one place: telling a household their data is deleted when it is not. Addressed by making export and erasure share one declaration (Rule TC6), by an ordering that fails loudly rather than skipping (a registry entry with no erasure position aborts the operation), and by a verification test that erases a real account and then goes looking for what is left.
- **Could this fabricate certainty?** The two places it could: an invented company registration number, and an inferred consent. Both render as honest absence instead — an undismissable placeholder notice, and `granted: false`.
- **Is anything guessed but shown as real?** No. The sub-processor list was read out of the code (`llm-provider.ts`, `media-storage.ts`, `db.ts`, `email/index.ts`), not assumed. The Cookie Policy's claims were verified against `sessionCookieOptions()` and `saveUninitialized: false`.
- **What happens if the system is wrong?** Erasure is idempotent and resumable; the `users` row is deleted last, so any failure before it leaves the account fully intact and the operation safely retryable. The route says so: *"nothing has been removed"*.
- No architectural duplication introduced: **YES** (one removed)
- No new source of truth created: **NO** — three created, all declared in the Register as Domains 34–36
- No runtime behaviour altered: **NO** — registration now requires consent; this is intentional and is the point

---

## VALIDATION PERFORMED

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **94 errors — the pre-existing baseline, unchanged. 0 introduced** |
| `npm run build` | 🟢 green |
| `npm run adoption:check` | 🟢 **83 passed · 0 notices · 0 failed** |
| Migration | Applied; `[Migrations] Schema at head: 2026-07-18_bus1_trust_and_compliance` |
| `test:bus1-trust-and-compliance` | 🟢 **42/42 checks against a live database** |
| Live HTTP round-trip | 🟢 see below |

**The verification test creates a real account carrying rows in ~15 tables — chosen for the awkward shapes, not the easy ones** — exports it, erases it, and then goes looking for leftovers. It proves specifically that: the Art. 9 health data the database would have orphaned is gone; the two-level no-FK planner chain did not orphan; the sole-member household was erased while the code path for a shared one is not taken; the password hash never reaches the export; consent rows survive with `user_id`, IP and user-agent nulled; the support message text is redacted; and the erasure record contains no personal data. It sweeps residue from previous runs at **start**, because a test that only tidies up when it succeeds litters exactly when something is already wrong.

**Live HTTP, against the running server:**

```
GET  /api/legal                      3 documents, placeholder notice active
GET  /api/legal/privacy-policy       6 sub-processors served
GET  /api/legal/terms-of-service     tokens resolved ("The Healthy Apples Ltd")
GET  /api/help                       7 categories, 20 articles; ?q= search works
GET  /api/privacy/summary            401 signed out · 21 categories signed in
GET  /api/privacy/export             Content-Disposition attachment; 19 categories,
                                     2 stated omissions
POST /api/support/requests           created; reply-to defaulted from the account
POST /api/privacy/consents           withdrawal recorded as a new row
DELETE /api/privacy/account          wrong password → 403
                                     missing "DELETE" → 400
                                     correct → erased; session destroyed (401 after)
GET  /api/admin/support/requests      403 for a non-admin
```

---

## DEFINITION OF DONE

**What success looks like:** a household can read all three policies before signing up; agrees to them explicitly at registration and that agreement is provable; can see what THA holds, download it, ask for it to be corrected, and delete their account without asking permission; and can reach a person from inside the product.

**What must not break:** existing sign-in, registration for accounts already created, the demo cleanup path (both callers unchanged), and every existing email.

**Manual test steps:** visit `/legal` signed out → all three render with the placeholder notice; register → the Create Account button is disabled until the box is ticked; Profile → *Privacy and your data* → download the file and read it; Profile → *Help and contact* → search, open an article, send a message; delete a test account and confirm you are signed out everywhere.

---

## SCOPE LOCK

**Implemented:** Privacy Policy · Terms of Service · Cookie Policy · GDPR compliance architecture · consent management · Privacy Settings · data export (Art. 15) · account deletion (Art. 17) · data correction workflow (Art. 16) · Help Centre · contact and support flows · report an issue · feature request · transactional email templates (welcome, verification, password reset, support acknowledgement, account deleted).

**Explicitly excluded:** live payment processing, subscriptions, billing, and commercial terms — the Terms state plainly that there are none rather than shipping dormant clauses for a thing that does not exist. Also excluded: a scheduler, grace-period deletion, re-consent prompting, and adding the missing foreign keys to the ~8 core tables that lack them.

### SUGGESTIONS — observed, not implemented, not approved

1. **`client/src/components/TrialBanner.tsx` advertises "25% off your first 6 months."** THA processes no payments and has no subscription. That is a commercial claim the platform cannot substantiate, in a product whose own Trust and Claims hard stops forbid exactly this. It is pre-existing and out of scope, but it should be withdrawn or substantiated before launch, and it belongs to `BUS2`.
2. **`server/lib/planner-compliance.ts` gates only system-generated planner writes** — its own header says deliberate user-manual placement is intentionally not gated. So a household can hand-place a meal conflicting with a hard restriction. The Help Centre articles state this plainly rather than implying blanket enforcement; whether it is the right behaviour is a safety question for its owner.
3. **`.env.example` documents neither `SMTP_*`, `EMAIL_FROM`, `SUPPORT_EMAIL` nor `SUGGESTIONS_EMAIL`**, and the running server warns `SMTP_HOST` is unset while email is otherwise configured.
4. **`APP_BASE_URL` is still duplicated** across `server/auth.ts:25` and `server/email/index.ts:3`. Deployment configuration rather than company identity, so deliberately left alone here.
5. **The ~8 core tables with no foreign key to `users`** (`meals`, `shopping_list`, `planner_weeks`, `user_preferences`, `meal_plans`, `freezer_meals`, `basket_items`, `product_history`) are now handled correctly by the registry, but the *database* still offers no protection. A migration adding those constraints would make a whole class of orphaning impossible rather than merely handled.

---

## NEXT STEPS — BUS2 (Commercial Platform)

Carried forward, with the reason each was deferred: commercial terms and payment processing (no dormant clauses shipped); a scheduler (none exists — expired trials are still only cleaned by a manual admin call, and any timed retention policy has nothing to hang off); grace-period deletion (needs the scheduler; immediate erasure is fully compliant without it); Help Centre editorial workflow (at 20 entries, moves to the database at ~30 or when a non-developer must edit it — Governance Rule 6); re-consent prompting when a policy version moves (the ledger already detects it and Privacy Settings already shows it); and **replacing the six placeholder values in `shared/legal/company-profile.ts`**, which is a one-file task and the only thing in this layer still blocking launch.
