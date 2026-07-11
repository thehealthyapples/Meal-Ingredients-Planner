# TRUST1 — Production Trust & Compliance Programme

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Workstream:** `platform`
**Risk:** 🟢 GREEN
**Reason:** Documentation only. No application code, schema, migration, or runtime behaviour is changed by this document. Every task it names is deliberately *not* implemented here.

**Status:** Canonical. This is the single source of truth for all production trust work required before The Healthy Apples launches.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/TRUST1-production-trust-and-compliance-20260711` → `27ed7f21bb9cca137684c219910f3a3837e9b333` |
| Working tree at tag time | **Intentionally dirty** — pre-existing, unauthored-by-this-task work from `PDA1` / `PKR` (`docs/product/`, `docs/investigations/ux/PDA1_*`, `data/cookbook/`, `data/development_world/`, four `scripts/*.ts`, `.engineering/session/*`). Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3, **the tag does not protect any of it.** It was not touched, staged, or committed by this task. |
| This task's writes | `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` (new file, this document) |
| Rollback to committed state | `git checkout rollback/TRUST1-production-trust-and-compliance-20260711` |
| Rollback of this task alone | `git rm docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap, canonical entry point
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — Architecture Compliance Checklist, Trust & Claims hard stops
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` — filing location (§1 rule 5, §4 workstreams)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` — rollback identifier
- [x] `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` (`EWO-PQA1`) — the governing parent of this programme
- [x] `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` — existing launch blockers and Launch Definition of Done
- [x] `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (`PKR1`–`PKR3`) — permission-aware disclosure
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` — Rule KC8 (declared vs enforced)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §6 — AI security & permission model
- [x] `.engineering/checklists/PRODUCTION_RELEASE.md` — existing go-live checklist
- [x] `docs/investigations/platform/THA_FULL_SYSTEM_LAUNCH_READINESS_AUDIT.md` — 2026-06-23 security baseline (point-in-time)
- [x] `docs/implementation/platform/PLATFORM_RESILIENCE_AND_OPERATIONS_IMPLEMENTATION.md` (`EWO-PRO1`)

---

## FILING NOTE — a governing-architecture conflict, resolved before writing

This document was requested at `docs/implementation/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md`.

That path is **forbidden** by `REPOSITORY_CONVENTIONS.md` §1 rule 5 and §4: no report may be written to the `docs/implementation/` root; every report is filed by workstream. The rule is mechanically enforced by `.engineering/scripts/repo-structure-verify.sh`, which fails on a loose file at that root. Per `ENGINEERING_WORKFLOW.md` STEP 2, the conflict was raised and approval obtained before any file was written. The document is filed under the `platform/` workstream — *"platform architecture & quality, resilience, operations, release engineering, launch-readiness"* — alongside `EWO-PRO1`, which is the nearest existing work.

---

# 1. Executive Summary

The Healthy Apples is not ready to be trusted with the data it already holds.

That is the finding, and it is not a matter of opinion or of standards yet to be chosen. The application today stores **health data** — weight, BMI, sleep hours, mood, energy, and free-text notes, per person per day (`shared/schema.ts:1299-1315`, `food_diary_metrics`) — and it stores **the names and allergies of named children who have no account of their own** (`shared/schema.ts:1179-1192`, `household_eaters`, whose `userId` is nullable with the comment *"Null for children who don't have an account"*, and whose `hardRestrictions[]` are documented as *"always enforced, never overridable"*). It also stores dietary patterns and restrictions, household composition including counts of children and babies, and every utterance a household has spoken to the Companion (`conversation_turns`).

Against that, the repository evidences:

- **no privacy notice, no terms of service, no consent record, and no data-rights UI anywhere** in `client/` — searched by filename and by content;
- **no way for a person to delete their account** — the only user-deletion code in the codebase is `storage.cleanupDemoUser()` for demo accounts (`server/auth.ts:395`, `:403`);
- **no way for a person to obtain their data** — the only export route is `GET /api/admin/meals/export`, which is admin-only and exports meal content, not personal data;
- **no retention policy for personal data** — the only retention constant in the codebase, `RETENTION_DAYS = 30`, governs operational telemetry (`server/intelligence/observation/observation-store.ts:37`);
- **a request logger that writes the full JSON body of every API response to stdout, unredacted and untruncated** (`server/index.ts:55-62`). This is not a theoretical exposure. It means every weight, every BMI, every child's name and allergy, and every Companion conversation is written in plaintext to the process log on the response that carries it;
- **a session secret that does not fail closed** — `server/auth.ts:41` supplies a hardcoded fallback when `SESSION_SECRET` is unset (the literal is `[REDACTED — TRUST1-S1; sha256:73d30df8…6ae140]`). The fallback is committed to this repository. Anyone holding it can forge a session cookie for any account, including an admin account, if the environment variable is ever absent;
- **a session cookie with `secure: false` hardcoded**, in production (`server/auth.ts:48`);
- **no `helmet`, no CSP, no HSTS, no CORS policy, no rate limiting, and no CSRF defence** — none of these are dependencies in `package.json`, and none are configured in `server/`. Login, register, and password-reset are unthrottled;
- **no CI**. There is no `.github/` directory, therefore no automated test gate, no dependency scanning, and no `npm audit` on any path to production. `deploy.sh` runs `git add -A`, commits everything, builds, and pushes to `main`, from which Render auto-deploys. It does not run the tests;
- **no auth or authorisation test coverage** — 0 of the 116 test files in `server/tests/` exercise `server/lib/access.ts`, `assertAdmin`, `requirePremium`, or any route guard;
- **no database backup or restore procedure**. Every document in the repository using the word "backup" means *git branch preservation*, not data.

There is also a **declared-versus-actual gap** that the programme must treat as a first-class defect rather than an embarrassment. `PLATFORM_QUALITY_ARCHITECTURE.md` §2 declares the Security, Privacy and Trust quality domains **"Mature — declared, enforced, audited."** The evidence above is what "mature" currently rests on. Separately, `EWO-PRO1`'s implementation report states that it shipped a `GET /api/health` liveness endpoint, a `GET /api/admin/platform/operations` surface, and a `platform_turn_outcomes` durable sink; **none of the three is present in the code today** — `grep` over `server/` finds no such routes, and `shared/schema.ts` contains no such table, though `server/lib/platform-resilience.ts` and `server/lib/platform-status.ts` do exist. This is exactly the failure `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC8 names: a control that is *declared* and not *enforced* is not a control, and a compliance programme built on declared controls certifies nothing. **Every control this programme claims must be verified against running code, and re-verified before launch.**

None of this is a reason for alarm about the engineering. The architecture is unusually disciplined, the authorisation model is real (51 of 51 admin routes are guarded; password hashing is scrypt with `timingSafeEqual`), and the domain work is excellent. What is missing is the *production trust layer* — the unglamorous, legally-load-bearing band of work that sits between a good application and a product a household can be asked to hand its children's medical information to. That layer has never been built, because it has never been anybody's workstream. **TRUST1 makes it one.**

This document creates **no new governing architecture**. It is subordinate to `PLATFORM_QUALITY_ARCHITECTURE.md`, which already owns the six quality domains (Security, Privacy, Performance, Observability, Accessibility, Trust) and whose §11 explicitly anticipates that *"each of these is a governed workstream in its own right."* TRUST1 *is* that workstream for Security, Privacy, Observability and Trust. It restates none of PQA's law, none of the Master Evolution Roadmap's launch gates, and none of the release protocol; it cites them and fills what they leave empty.

---

# 2. Production Trust Objectives

Five objectives. Each is stated so that its failure is observable.

| # | Objective | Failure looks like |
|---|---|---|
| **O1** | **A household can find out what THA knows about them, and make it stop.** Transparency at collection, access on request, erasure on demand — as working product surfaces, not policy prose. | A user emails asking to be deleted and no one in the company has a way to do it. |
| **O2** | **Personal data does not leave the boundary it was given to.** Not into logs, not into a prompt that did not need it, not to a processor without a contract, not to an unauthenticated caller. | A child's name and allergy appear in a plaintext stdout log shipped to a third-party log aggregator. |
| **O3** | **A session cannot be forged and an account cannot be brute-forced.** Authentication and authorisation fail closed, are rate-limited, and are covered by tests that run before every deploy. | An unset environment variable silently downgrades the platform to a publicly-known session secret. |
| **O4** | **When production breaks, someone knows, and someone can put it back.** Health checks, alerting, an incident procedure, and a *tested* database restore. | The database is corrupted by a migration and the restore procedure is being written for the first time during the incident. |
| **O5** | **Every trust claim THA makes is verified against running code before it is made.** Nothing is "mature" because a document says so. | A compliance document certifies a control that `grep` cannot find. |

These objectives are **not** a rival to the Launch Definition of Done in `THA_MASTER_EVOLUTION_ROADMAP.md` §9. They are the trust half of it, and TRUST1-V5 exists to reconcile the two into one gate rather than two.

---

# 3. Scope

### 3.1 In scope

- **Regulatory privacy** — UK GDPR / EU GDPR obligations: lawful basis, special-category data (health), children's data, transparency, data-subject rights (access, erasure, rectification, portability), retention, processors and international transfers, DPIA, breach notification, PECR/cookies.
- **Application security** — authentication and session integrity, authorisation coverage and testing, transport and header hardening, rate limiting, input validation coverage, secrets management, dependency and vulnerability scanning, threat modelling, penetration testing.
- **Production operations** — health checks, structured logging, error tracking, alerting and paging, incident response and runbooks, database backup and tested restore, deployment-pipeline safety, migration-mechanism convergence, media storage.
- **Production verification** — proving, mechanically and repeatedly, that every control this programme claims is actually present in the deployed system; reconciling declared controls against code; hardening the pre-deploy and post-deploy gates.
- **Future certification readiness** — the preparatory work (control mapping, policy set, asset and access registers, evidence capture) that makes Cyber Essentials, ISO 27001 or SOC 2 achievable later *without a second programme*, while explicitly committing to none of them now.

### 3.2 Out of scope

- **Any implementation.** This document plans; it builds nothing. Every task below is a future change requiring its own rollback identifier, its own compliance checklist, and its own approval.
- **New governing architecture.** TRUST1 is subordinate to `PLATFORM_QUALITY_ARCHITECTURE.md`. If a task below would require a change to governing law, that task's implementation must go through Rule 8 governance review — it may not amend governance by stealth.
- **Re-litigating existing governance.** The release, commit, deploy and rollback protocols (`.engineering/`), the launch gates (`THA_MASTER_EVOLUTION_ROADMAP.md` §6/§8/§9), the disclosure model (`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` §11 + `docs/product/VISIBILITY.md`), and the release matrix (`docs/release-matrix.md`) are cited, not restated, and not replaced.
- **Content licensing and copyright.** Owned by `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` (`FS3`), `FS1` and `FS2`. This is legal compliance of a different kind and has its own owner. TRUST1 does not touch it.
- **Accessibility and performance.** Named as open gaps by `PLATFORM_QUALITY_ARCHITECTURE.md` §11 and genuinely important, but they are quality domains, not trust domains, and folding them in would make this programme unlandable. They remain PQA's.
- **Billing and payment compliance (PCI).** `users.subscriptionTier` / `subscriptionStatus` columns exist, but **no payment processor is integrated** — there is no Stripe or equivalent in `package.json`. PCI scope is empty today and TRUST1 does not pre-build for it. *If billing is implemented, TRUST1 must be reopened.*
- **Marketing claim substantiation.** Owned by the Product Knowledge Registry's Marketing Message entries.

### 3.3 Assumed deployment context (from repository evidence)

| Fact | Evidence |
|---|---|
| Hosting: Render, autoscale (multi-instance) | `.replit` `[deployment] deploymentTarget = "autoscale"`; `docs/investigations/engineering/GITHUB_TO_RENDER_RELEASE_MODEL_CHECK_2026-06-28.md` |
| Database: managed Postgres (Neon) | `scripts/migrate-prod.sh`, `scripts/verify-prod.ts` |
| Deploy trigger: push to `main` → auto-deploy | `deploy.sh` |
| LLM processor: OpenAI, `gpt-4o-mini` default | `server/intelligence/conversation/llm-provider.ts:14`; `openai` in `package.json` |
| Email processor: SMTP (`mail.privateemail.com`) via `nodemailer`; `resend` also a dependency | `server/email.ts:1-25`; `package.json` |
| Media: **local disk**, served unauthenticated | `server/lib/media-storage.ts:24-27`; `server/index.ts:139` (`express.static`) |

The last row and the first row **contradict each other**: local-disk uploads cannot work correctly on a multi-instance autoscale deployment, and `server/lib/media-storage.ts:6-22` carries a `PRODUCTION NOTE` saying exactly that. This is captured as `TRUST1-O9`.

---

# 4. Workstreams

Five workstreams. Each has a single named accountable owner, per `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC14 (a control with no owner accountable for it being true *now* decays silently).

| ID | Workstream | Owns | Accountable owner |
|---|---|---|---|
| **TRUST1-P** | **GDPR & Privacy** | Lawful basis, transparency, data-subject rights, retention, processors, children's data, DPIA, breach notification, PECR | Colin Clapson |
| **TRUST1-S** | **Security** | Authentication and session integrity, authorisation coverage, transport and headers, rate limiting, secrets, dependency scanning, threat model, pen test | Colin Clapson |
| **TRUST1-O** | **Production Operations** | Health checks, logging, error tracking, alerting, incident response, backup and restore, deployment safety, migrations, media storage | Colin Clapson |
| **TRUST1-V** | **Production Verification** | Proving every claimed control exists in the deployed system; pre- and post-deploy gates; the launch trust gate | Colin Clapson |
| **TRUST1-C** | **Future Certification Readiness** | Control mapping, policy set, asset and access registers, evidence capture — *preparation only, no certification committed* | Colin Clapson |

**Why `TRUST1-V` is a workstream and not a phase.** Verification is separated from the work it verifies deliberately. The `EWO-PRO1` discrepancy in §1 — three controls declared shipped, none present in code — happened because the report *was* the verification. When the builder is the verifier, "declared" and "enforced" quietly become the same word (Rule KC8). TRUST1-V's job is to make them different words again, mechanically.

---

# 5. Detailed Task List

Every task carries an **Objective**, **Why it matters**, **Expected deliverable**, and **Priority**. Priorities are:

- **Critical** — launch is blocked. A Critical task open at launch means launching with a known, evidenced defect in the protection of personal data or the integrity of authentication.
- **High** — launch is blocked *unless* an explicit, written, dated risk acceptance is recorded by the accountable owner.
- **Medium** — not launch-blocking. Required for the programme to be complete, and for certification (TRUST1-C) to be achievable later.

---

## 5.1 Workstream P — GDPR & Privacy

> **The governing fact for this entire workstream:** THA processes health data (UK GDPR Art. 9 special category) and data about identifiable children who are not its users. Both attract the highest obligations in the regulation. Neither is currently supported by any lawful-basis record, transparency notice, consent mechanism, retention limit, or deletion path.

### TRUST1-P1 — Data inventory and Record of Processing Activities (ROPA)
- **Objective.** Produce the definitive inventory of every category of personal data THA processes: what it is, which table and column holds it, why it is collected, who it is shared with, how long it is kept, and its lawful basis. Cover all 87 tables in `shared/schema.ts`, not the obvious ones.
- **Why it matters.** Every other privacy task is a function of this one. You cannot write a privacy notice describing data you have not enumerated, cannot delete data you cannot find, and cannot set a retention period for a table you forgot exists. It is also a standalone legal obligation (Art. 30) for any organisation processing special-category data, regardless of headcount. Today the inventory does not exist in any form — the only GDPR sentence anywhere in the repository is a one-line instruction to admins in `docs/admin-users.md:82`.
- **Expected deliverable.** `docs/implementation/platform/TRUST1_P1_DATA_INVENTORY_AND_ROPA.md` — a table keyed on `table.column`, covering every personal-data field, with lawful basis, retention period, processor exposure, and special-category flag. Machine-checkable: a script that fails if a new personal-data column is added to `shared/schema.ts` without a ROPA row.
- **Priority.** **Critical**

### TRUST1-P2 — Lawful basis and special-category condition
- **Objective.** Determine and record the lawful basis (Art. 6) for each processing purpose, and the *additional* Art. 9 condition for the health data — weight, BMI, sleep, mood, energy, dietary restrictions, allergies. Decide explicitly whether the Art. 9 condition is **explicit consent** (Art. 9(2)(a)) and, if so, design where and how that consent is captured and withdrawn.
- **Why it matters.** Health data cannot be processed at all without an Art. 9 condition. "Legitimate interests" is not available for special-category data. There is currently no consent capture of any kind: `POST /api/register` (`server/auth.ts:120-174`) accepts `{ username, password }` and nothing else — no acceptance, no consent, no record. Every row in `food_diary_metrics` was therefore collected without a recorded condition, and if the answer is explicit consent, that is not a UI change — it is a change to what the product may do with data it already holds.
- **Expected deliverable.** A lawful-basis register (extending P1's ROPA), a written Art. 9 determination, and — if consent is the chosen condition — a consent design: a `consents` table (purpose, version, granted/withdrawn timestamp, evidence), capture at collection, and withdrawal in settings. **Plus a decision, recorded, on what happens to pre-existing rows collected without it.**
- **Priority.** **Critical**

### TRUST1-P3 — Privacy Notice (Art. 13) published and linked at collection
- **Objective.** Write, publish, and link a privacy notice that names the controller, the purposes, the lawful bases, the recipients (including OpenAI), the retention periods, the international transfers, and the data subject's rights and how to exercise them.
- **Why it matters.** Art. 13 transparency attaches **at the moment of collection**, unconditionally — it does not depend on cookies, consent, or scale. THA collects a weight and a child's allergy today, having told the user nothing. There is no privacy page, no route, and no file matching `*privacy*` anywhere in `client/`. This is the single most straightforward unmet legal obligation in the codebase, and it is also the one the user notices: a food-and-health product that asks for a child's allergies and offers no privacy notice does not read as careless, it reads as untrustworthy.
- **Expected deliverable.** A published privacy notice, a `/privacy` route in `client/src/App.tsx`, a link in the footer and at every collection point (registration, food diary onboarding, household eater creation), and a registry entry with `visibility: public`. Content derived from P1 and P2 — **not** written independently of them, or it will describe a product that does not exist.
- **Priority.** **Critical**

### TRUST1-P4 — Terms of Service and acceptance at registration
- **Objective.** Publish Terms of Service and capture versioned acceptance at registration. Include the health disclaimer — THA gives nutritional guidance, not medical advice.
- **Why it matters.** THA shows nutrition guidance to people who have told it their weight, their goals, and their children's allergies. The boundary between "guidance" and "medical advice" is the single largest product-liability exposure the company has, and it is currently drawn nowhere. `ENGINEERING_WORKFLOW.md` STEP 7 already hard-stops on *"any AI-generated health claim anywhere in the product"* — the Terms are where the standing disclaimer that makes the product safe to operate is recorded.
- **Expected deliverable.** A published `/terms` route, a versioned acceptance record (`users.termsAcceptedVersion`, `termsAcceptedAt`), an acceptance control in the registration flow, and a re-acceptance path for material changes.
- **Priority.** **High**

### TRUST1-P5 — Right to erasure: account deletion
- **Objective.** Build a self-service account-deletion path that removes or irreversibly anonymises every row of personal data belonging to the user and their household, honouring the cascade relationships already declared in the schema.
- **Why it matters.** There is **no way to delete a user**. The only deletion code in the codebase is `storage.cleanupDemoUser()` (`server/auth.ts:395`, `:403`), which handles demo accounts only. A real user who exercises their Art. 17 right today cannot be served by any code path, which means the obligation would be met by a manual `DELETE` against production by a human under time pressure — the highest-risk data operation imaginable, performed exactly when it is least safe to improvise. The schema's `onDelete: "cascade"` relationships mean the primitive is *nearly* there; what is missing is the deliberate decision about what cascades, what must be retained (and why), and what happens to a household when one of its members leaves.
- **Expected deliverable.** `DELETE /api/user` (re-authenticated, confirmed, rate-limited), a deletion service that enumerates every table from P1's ROPA, a documented decision on shared-household data and on `household_eaters` rows describing children, an audit record of the deletion itself (which must not itself retain the deleted data), and a test that asserts zero residual rows across all tables in the ROPA.
- **Priority.** **Critical**

### TRUST1-P6 — Right of access and portability: data export
- **Objective.** Build a self-service export that returns everything THA holds about a household in a structured, machine-readable format.
- **Why it matters.** Art. 15 (access) and Art. 20 (portability) are enforceable on a one-month deadline. There is no export path for personal data — the only `export` route is `GET /api/admin/meals/export` (`server/routes.ts:7336`), which is admin-only and returns meal content. Without this, a subject access request is served by an engineer hand-writing SQL, which is slow, error-prone, and itself a privacy risk (it puts the whole database in front of a human to answer a question about one row).
- **Expected deliverable.** `GET /api/user/export` (re-authenticated, rate-limited) returning JSON covering every ROPA table; a settings-page control; a test asserting the export's table coverage equals the ROPA's, so that a new personal-data table cannot silently escape the export.
- **Priority.** **High**

### TRUST1-P7 — Retention and deletion policy for personal data
- **Objective.** Set, record, and *enforce in code* a retention period for every category of personal data, including dormant accounts and Companion conversation history.
- **Why it matters.** Storage limitation (Art. 5(1)(e)) is a principle, not a nicety: data kept longer than necessary is unlawful even if it is kept perfectly. THA has no retention policy for personal data at all. The only retention that exists anywhere is `RETENTION_DAYS = 30` on operational telemetry (`server/intelligence/observation/observation-store.ts:37`). Meanwhile `conversation_turns` retains every sentence a household has ever spoken to the Companion, indefinitely, with no stated purpose for keeping it beyond the session in which it was said.
- **Expected deliverable.** A retention schedule (in the ROPA), a scheduled pruning job with the same shape as the existing observation-store pruner, a dormant-account policy, and a documented decision on Companion conversation retention. Enforcement, not declaration — a retention period no job implements is Rule KC8 again.
- **Priority.** **High**

### TRUST1-P8 — Eliminate personal data from application logs
- **Objective.** Stop the request logger writing API response bodies to stdout. Introduce redaction, and a rule that no personal data field may be logged.
- **Why it matters.** `server/index.ts:55-62` monkey-patches `res.json` to capture every response body and then writes it verbatim into the log line for every `/api` path — no redaction, no truncation, no allowlist. This means **the plaintext log contains every weight, BMI, sleep hour, mood score, dietary restriction, child's name, child's allergy, email address, and Companion utterance the system has ever returned** — because every one of those is returned in an API response. It is also how a `passwordResetToken` reaches the log (see `TRUST1-S8`). Logs are routinely shipped to third-party aggregators, retained far longer than application data, and read by people who have no business reading a child's medical information. **This is the single highest-severity privacy defect in the codebase and the cheapest to fix.**
- **Expected deliverable.** Response-body logging removed from `server/index.ts`; a structured logger with a field-level redaction allowlist (coordinated with `TRUST1-O4`, which owns the logger choice — P8 owns the *requirement*, O4 owns the *implementation*); a test asserting that no known personal-data field name appears in emitted log output.
- **Priority.** **Critical**

### TRUST1-P9 — Processor register, DPAs, and international transfers
- **Objective.** Enumerate every third party that receives personal data, execute a Data Processing Agreement with each, and record the transfer mechanism for any processing outside the UK/EEA.
- **Why it matters.** A controller is liable for its processors. Personal data demonstrably reaches **OpenAI** (`gpt-4o-mini` is the default production provider — `server/intelligence/conversation/llm-provider.ts:14`; the Companion sends household context and user utterances), an **SMTP provider** (`mail.privateemail.com` — email addresses), and the **hosting and database providers** (Render, Neon). `@anthropic-ai/sdk`, `@google/genai` and `resend` are also dependencies and must be confirmed as used or unused. Each is an Art. 28 processor requiring a contract, and each US-based one requires a transfer mechanism. None of this is currently recorded anywhere. The OpenAI relationship additionally requires a decision, recorded, on **whether household data may be used for model training** — the default answer must be no, and it must be contractually true rather than assumed.
- **Expected deliverable.** A processor register (name, purpose, data categories, location, transfer mechanism, DPA status, sub-processors), executed DPAs, and a written confirmation of the training-data position for every LLM processor. Plus a `package.json` reconciliation: any AI SDK that is a dependency but not a processor must be *removed*, so the register and the lockfile cannot drift.
- **Priority.** **High**

### TRUST1-P10 — Children's data
- **Objective.** Resolve the legal and product position on `household_eaters` rows that describe children who are not users — including their names and their allergies — and on the `childrenCount` / `babiesCount` fields in `user_preferences`.
- **Why it matters.** This is the most legally exposed processing THA performs and it has no dedicated treatment anywhere. `household_eaters` (`shared/schema.ts:1179-1192`) holds a `displayName` (not null) and `hardRestrictions[]` (allergies — special-category health data) for a person whose `userId` is *explicitly nullable because they have no account*. That child is a data subject with full rights, who cannot consent, has not been informed, cannot access their data, and cannot request erasure — and whose data was entered by a third party (their parent). UK GDPR and the ICO's Age Appropriate Design Code both attach heightened obligations here. The product need is entirely legitimate — you cannot plan a family's meals without knowing a child is allergic to peanuts — which is precisely why this must be got *right* rather than got *around*.
- **Expected deliverable.** A written determination covering: lawful basis and Art. 9 condition for children's data (parental responsibility), data minimisation (does the child need a *name*, or would an initial or label serve the product equally?), the parent's ability to exercise the child's rights, retention when a child leaves the household, and whether THA falls within the Age Appropriate Design Code. Feeds the DPIA (P12) and the privacy notice (P3).
- **Priority.** **Critical**

### TRUST1-P11 — Cookie and PECR posture
- **Objective.** Assess and record the cookie position, and confirm whether a consent banner is required.
- **Why it matters.** The evidence suggests THA's cookie exposure is genuinely **low** — the only cookies are the session cookie and a sidebar UI-state cookie (`client/src/components/ui/sidebar.tsx:86`), both plausibly "strictly necessary" and therefore exempt from PECR consent. There is no analytics, no PostHog, no Google Analytics, no advertising pixel — verified by grep across `package.json` and `client/`. **This is a good position and the task exists to record it, defend it, and prevent it being lost.** The moment any analytics SDK is added, consent becomes mandatory, and it will be added by someone who does not know that.
- **Expected deliverable.** A written PECR assessment concluding "no banner required, and here is why", a cookie table in the privacy notice, and a **guard**: a dependency-review rule (in `TRUST1-S10`'s scanning) that flags any new analytics or tracking package, because that package changes the legal answer.
- **Priority.** **Medium**

### TRUST1-P12 — Data Protection Impact Assessment (DPIA)
- **Objective.** Complete a DPIA covering the processing of health data, children's data, and the AI/Companion profiling of household behaviour.
- **Why it matters.** A DPIA is **mandatory** under Art. 35 where processing is likely to result in high risk — and the ICO's own criteria list special-category data, data concerning vulnerable subjects (children), and innovative technology / profiling as triggers. THA hits all three simultaneously. It is not a box-ticking exercise here: it is the document that decides whether the Companion may reason over a child's allergy at all, and under what constraints. Doing it *after* building the privacy surfaces would be doing it backwards — the DPIA's conclusions constrain what those surfaces must say.
- **Expected deliverable.** A completed DPIA: processing description, necessity and proportionality assessment, risk register with likelihood/severity, mitigations, residual risk, and sign-off by the accountable owner. Consumes P1, P2, P9, P10. Constrains P3.
- **Priority.** **High**

### TRUST1-P13 — AI processing transparency and minimisation
- **Objective.** Establish and enforce exactly what personal data may be composed into a prompt sent to a third-party LLM, and disclose it.
- **Why it matters.** `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17) is already *the single owner of every byte the model reads as grounding* — which is an enormous asset here, because it means there is exactly one place to enforce this and it already exists. The privacy question INT17 does not answer is *which* bytes are lawful to send: a household's meal plan is one thing; a child's name and allergy, a weight, and a mood score are another. The Product Knowledge Registry's `PKR26` already establishes the correct discipline — filter *before* composition, never by asking the model to withhold what it has been shown. This task applies that same discipline to personal data.
- **Expected deliverable.** A personal-data policy for context composition, enforced at INT17's boundary (not in capability code); a documented determination of what is sent to OpenAI; a corresponding plain-English paragraph in the privacy notice. **This task must not create a second context owner** — it constrains INT17, it does not bypass it.
- **Priority.** **High**

### TRUST1-P14 — Personal data breach procedure
- **Objective.** Write the procedure for detecting, assessing, containing, and — within 72 hours — reporting a personal data breach to the ICO, and to data subjects where required.
- **Why it matters.** The 72-hour clock (Art. 33) starts on *awareness*, not on resolution. A procedure written during a breach is written badly, by someone frightened, at the worst possible moment. THA has no incident procedure of any kind (see `TRUST1-O6`, which owns operational incidents; P14 owns the *regulatory* limb and the two must interlock rather than duplicate). Note the dependency: you cannot detect a breach you have no alerting for.
- **Expected deliverable.** A breach procedure with named roles, an assessment rubric (is it reportable?), ICO reporting templates, a data-subject notification template, and a breach register. Cross-referenced from `TRUST1-O6`'s incident runbook as its regulatory branch.
- **Priority.** **High**

---

## 5.2 Workstream S — Security

### TRUST1-S1 — Session secret must fail closed
- **Objective.** Remove the hardcoded session-secret fallback. The server must refuse to start without `SESSION_SECRET`.
- **Why it matters.** `server/auth.ts:41` supplies a hardcoded fallback secret when `SESSION_SECRET` is unset (the literal is `[REDACTED — TRUST1-S1; sha256:73d30df8…6ae140]`). That fallback string is **committed to this repository**. Express-session signs session cookies with it. Anyone who possesses it — which is anyone who has ever had read access to this repo, forever, including in every fork and every clone and every AI training corpus it may have reached — can forge a signed session cookie for **any user id, including an admin's**, if the environment variable is ever unset. And nothing prevents it being unset: `server/index.ts:77-104` detects the missing variable, logs `MISSING required env var: SESSION_SECRET`, collects it into a `missing[]` array — **and never acts on it.** The server boots. A single misconfiguration, one bad deploy, one new environment, silently converts the platform into one with no authentication at all, and the log line that says so scrolls past among four hundred others. This is a total authentication bypass gated on a configuration mistake, which is not a safe thing to gate it on.
- **Expected deliverable.** The `||` fallback deleted. `SESSION_SECRET` (and every other genuinely-required variable) validated at boot with a hard `process.exit(1)` on absence. The compromised string treated as burned: rotated, and never reused. A test asserting the server refuses to start without it.
- **Priority.** **Critical**

### TRUST1-S2 — Secure cookie flag in production
- **Objective.** Set `cookie.secure: true` in production (environment-conditional, so local HTTP development still works), and add `__Host-`-style hardening where compatible.
- **Why it matters.** `server/auth.ts:48` hardcodes `secure: false`. The session cookie is therefore transmitted over plaintext HTTP if any request ever reaches the app over HTTP — and `app.set("trust proxy", 1)` (`server/auth.ts:38`) confirms the app sits behind a proxy, which is exactly the topology where a misrouted or downgraded request is possible. `httpOnly` and `sameSite: "lax"` are correctly set; `secure` is the missing third of a three-part protection, and the cookie it protects is the one that *is* the user's identity.
- **Expected deliverable.** `secure: process.env.NODE_ENV === "production"` (or equivalent), HSTS set via `TRUST1-S4`'s headers, and a production verification check (`TRUST1-V2`) asserting the flag is actually set on a real response from the deployed app — not merely present in source.
- **Priority.** **Critical**

### TRUST1-S3 — Close unauthenticated write access to global meal templates
- **Objective.** Add authentication and authorisation to the `meal_templates` write routes.
- **Why it matters.** `meal_templates` is a **global table with no `userId` column** (`shared/schema.ts:49-80`) — its rows are shared platform content, not user data. And its write routes have no auth check at all: `POST /api/meal-templates` (`server/routes.ts:5085`), `PATCH /api/meal-templates/:id` (`:5097`), and — worst — `DELETE /api/meal-templates/:id` (`:5115`), whose entire body is `await storage.deleteMealTemplate(parseInt(req.params.id)); res.sendStatus(204);`. **Any anonymous caller on the internet can delete any global meal template, or inject content into one.** The same pattern repeats at `:5135`, `:5147`, `:5157`, `:5175`. This is the more remarkable because the rest of the codebase is genuinely disciplined here — all 51 admin routes are guarded — which is precisely why it went unnoticed: it is an outlier in an otherwise clean pattern, and nothing tests for it (see `TRUST1-S9`).
- **Expected deliverable.** `assertAdmin` (or the appropriate guard) on every `meal_templates` write route; an audit of all 237 `/api` routes to confirm no other write route is unguarded, with the deliberate public reads explicitly listed and justified; and a test in `TRUST1-S9`'s suite that fails if an unguarded write route is added.
- **Priority.** **Critical**

### TRUST1-S4 — Security headers (helmet, CSP, HSTS)
- **Objective.** Add `helmet` with a Content-Security-Policy, HSTS, `X-Content-Type-Options`, `X-Frame-Options` / `frame-ancestors`, and a Referrer-Policy.
- **Why it matters.** There are **no security headers at all** — `helmet` is not a dependency and no header is set manually in `server/`. (Note the trap: `script/build.ts:16` lists `express-rate-limit`, `cors` and `jsonwebtoken` in an esbuild bundling allowlist. **None of them are in `package.json` and none are used.** Anyone auditing the build config would conclude these protections exist. They do not.) Absent CSP, any XSS in a React escape hatch — `dangerouslySetInnerHTML`, a markdown renderer, LLM-returned content rendered as HTML — becomes full session theft, which matters especially in a product that renders model output to the user. Absent HSTS, `TRUST1-S2`'s secure cookie can still be stripped on a first request.
- **Expected deliverable.** `helmet` configured with a CSP tightened to what the app actually needs (report-only first, then enforcing), HSTS with a meaningful max-age, and a `TRUST1-V2` production check asserting the headers are present on a live response.
- **Priority.** **High**

### TRUST1-S5 — Rate limiting on authentication endpoints
- **Objective.** Rate-limit `/api/login`, `/api/register`, `/api/forgot-password`, `/api/reset-password`, and the new data-rights endpoints (`P5`, `P6`), by IP and by account.
- **Why it matters.** There is **no rate limiting anywhere** — no `express-rate-limit`, no equivalent, verified against `package.json` and `server/`. Combined with a **six-character minimum password** (`server/auth.ts:129`, `:283`, `:317`) and no account lockout, `/api/login` is an open, unthrottled, unlimited-attempt oracle against every account on the platform. An attacker does not need to be sophisticated; they need a wordlist and patience. The `THA_FULL_SYSTEM_LAUNCH_READINESS_AUDIT.md` flagged this on 2026-06-23 and it remains true today. Note that `TRUST1-P5`'s deletion endpoint makes this *more* urgent, not less: an unthrottled deletion endpoint is a denial-of-existence attack.
- **Expected deliverable.** Rate limiting on all authentication and data-rights routes, with per-IP and per-account limits, and a deliberate decision on lockout-versus-backoff (lockout is itself a denial-of-service vector against a known email). Tests asserting the limits fire.
- **Priority.** **Critical**

### TRUST1-S6 — CSRF posture decision
- **Objective.** Determine whether `sameSite: "lax"` alone is sufficient CSRF defence for THA's state-changing routes, and if not, implement token-based protection.
- **Why it matters.** There is no CSRF protection. `sameSite: "lax"` blocks the cookie on cross-site *sub-resource* and form-POST requests, which covers the classic attack — so the exposure is **genuinely lower than it first appears**, and this task exists to *decide*, on evidence, rather than to reflexively add a token layer that may be redundant. But "lax" is not "strict": it permits the cookie on top-level GET navigations, so any state-changing `GET` route is exposed, and it offers nothing against a same-site subdomain compromise. The decision must be written down, because the next person will otherwise ask the same question and get a different answer.
- **Expected deliverable.** A written CSRF determination: an enumeration of state-changing routes (confirming none are `GET`), a decision on token-based defence, and — if the decision is "lax is sufficient" — the *conditions* under which that stops being true, recorded, so the conclusion expires rather than rots.
- **Priority.** **High**

### TRUST1-S7 — Password policy and credential hygiene
- **Objective.** Raise the minimum password length, screen against breached-password lists, and decide the position on MFA.
- **Why it matters.** The floor is six characters (`server/auth.ts:129`, `:283`, `:317`). Six characters is not a password; it is a formality. The hashing underneath it is genuinely good — scrypt, 16-byte salt, `timingSafeEqual` (`server/auth.ts:22-33`) — which makes the weak floor the binding constraint: excellent hashing of a guessable secret protects nobody. Session lifetime is 7 days with no idle timeout (`server/auth.ts:49`). For an account holding a family's health data, that is generous.
- **Expected deliverable.** A raised minimum (NIST's guidance favours length over composition rules), breached-password screening at registration and reset, a documented session-lifetime and idle-timeout decision, and a written MFA position (offering it to admins at minimum, given an admin session reaches every household's data).
- **Priority.** **High**

### TRUST1-S8 — Stop leaking `passwordResetToken` in the user response
- **Objective.** Extend `server/lib/sanitizeUser.ts` to strip `passwordResetToken` and `passwordResetExpires`.
- **Why it matters.** `sanitizeUser` correctly strips `password`, `emailVerificationToken`, and `emailVerificationExpires` — but **not** `passwordResetToken` / `passwordResetExpires`, which are columns on the same `users` row (`shared/schema.ts:27-28`). They are therefore returned in the body of `GET /api/user`. Two consequences compound: first, a live password-reset token is disclosed to any client holding the session; second — and worse — that response body is then **written to the application log in plaintext** by `server/index.ts:55-62` (see `TRUST1-P8`). A reset token in a log is a password reset available to anyone who can read logs. The fix is three words in one file; the defect is severe purely because of what sits downstream of it.
- **Expected deliverable.** Both fields stripped in `sanitizeUser.ts`; a test asserting the sanitised shape is an allowlist (name the fields that *may* be returned) rather than a denylist — because a denylist has now failed twice and will fail again on the next column added to `users`.
- **Priority.** **Critical**

### TRUST1-S9 — Authorisation test suite
- **Objective.** Build a test suite that exercises every route's authentication and authorisation guard, and wire it into `npm test`.
- **Why it matters.** There are 116 test files in `server/tests/`, and **zero** of them test auth, authz, sessions, or access control — not one exercises `server/lib/access.ts`, `assertAdmin`, or `requirePremium`. The domain and intelligence coverage is genuinely impressive, which makes the gap sharper, not softer: the platform rigorously tests whether it gives correct nutrition advice and does not test at all whether it gives it to the right person. `TRUST1-S3` is the direct consequence — an anonymous-delete route survived in a codebase with 116 test files because no test could have caught it. This task is the one that stops the *next* `S3`.
- **Expected deliverable.** A route-guard test suite asserting, for every one of the 237 `/api` routes, that it is either (a) guarded, or (b) on an explicit, justified public allowlist. The allowlist is the deliverable's real value: it forces every public route to be a decision rather than an oversight. Wired into `npm test`, and therefore into `TRUST1-V3`'s pre-deploy gate.
- **Priority.** **High**

### TRUST1-S10 — Dependency and vulnerability scanning
- **Objective.** Introduce CI with automated dependency scanning, `npm audit` on every change, and an update policy.
- **Why it matters.** **There is no `.github/` directory.** No CI, no Actions, no Dependabot, no scheduled `npm audit` — nothing on any path to production runs any check at all. `deploy.sh` does not run the tests. This means (a) known-vulnerable dependencies enter production undetected, and (b) *every other quality gate in this programme is unenforceable*, because there is no mechanism that can enforce anything. `TRUST1-S9`'s test suite, `TRUST1-V3`'s pre-deploy gate, and `TRUST1-P11`'s analytics-package guard all presuppose a CI that does not exist. This is why S10's priority is higher than its subject matter alone suggests: it is the machinery the rest of the programme runs on.
- **Expected deliverable.** A CI workflow running `typecheck`, `test`, and `build` on every push and pull request; `npm audit` (or Dependabot / a SCA tool) with a severity threshold that fails the build; a documented patching SLA by severity; and the analytics-package guard from `TRUST1-P11`.
- **Priority.** **High**

### TRUST1-S11 — Secrets management and environment documentation
- **Objective.** Make `.env.example` complete, verify no secret is committed, and document rotation.
- **Why it matters.** `.env.example` contains **exactly one key** — `THEMEALDB_API_KEY`. It does not document `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`, `SMTP_USER`, `SMTP_PASS`, `APP_BASE_URL`, or any of the integration keys the code actually reads at `server/index.ts:77-96`. A new environment therefore *cannot* be configured correctly from the repository — which is not merely inconvenient, it is the direct cause of `TRUST1-S1`: the fallback secret exists precisely so that a misconfigured environment can still boot, and the misconfiguration it protects against is the one an incomplete `.env.example` guarantees. Fix the documentation and the temptation to fail open disappears with it. (`.env` is correctly gitignored and no hardcoded secrets were found beyond `S1`'s.)
- **Expected deliverable.** A complete `.env.example` generated from — and verified against — the variables `server/index.ts` actually reads; a rotation procedure; a secret-scanning check in `TRUST1-S10`'s CI; and confirmation that the burned session secret from `S1` is rotated everywhere.
- **Priority.** **High**

### TRUST1-S12 — Media storage: unauthenticated static serving and local disk
- **Objective.** Move meal-photo storage off local disk to object storage, and decide whether uploads may be served unauthenticated.
- **Why it matters.** Meal photos are written to local disk (`server/lib/media-storage.ts:24-27`) and served by unauthenticated `express.static` at `server/index.ts:139`. Three separate problems compound. **Correctness:** the deployment is Render `autoscale` (multi-instance), so a photo written on one instance does not exist on another — `server/lib/media-storage.ts:6-22` carries a `PRODUCTION NOTE` saying exactly this. **Privacy:** a meal photo is personal data, and anyone with the URL can fetch it without authenticating — URLs leak, through referrers, logs, and shared links. **Hygiene:** `uploads/` is not in `.gitignore` and image files are already tracked in git, so user-uploaded content is entering the repository's permanent history.
- **Expected deliverable.** Object storage (R2/S3) with signed, expiring URLs or an authenticated proxy; `uploads/` gitignored and existing tracked files assessed for removal from history; a decision recorded on whether meal photos are private by default (they should be).
- **Priority.** **High**

### TRUST1-S13 — Threat model
- **Objective.** Produce a threat model for the platform: assets, actors, trust boundaries, attack surfaces, and mitigations.
- **Why it matters.** Every task above was found by reading code, which finds the defects that exist but never the ones that were never considered. A threat model is how you find the second kind. THA's boundaries are unusual and worth modelling deliberately: a *household* is a shared trust boundary (members see each other's data — is that right in every case? what about a departing partner?); the Companion is a boundary where user text meets a third-party model; the admin role reaches every household on the platform. None of these has been reasoned about adversarially.
- **Expected deliverable.** A threat model (STRIDE or equivalent) with a prioritised mitigation list, feeding back into this programme's task list. Explicitly covering the household boundary and the admin blast radius.
- **Priority.** **Medium**

### TRUST1-S14 — Penetration test
- **Objective.** Commission an independent penetration test against a production-equivalent environment.
- **Why it matters.** Everything in this programme is self-assessment, and self-assessment has a ceiling — this document was written by reading the code, and it will have missed things that only an adversary looking for them will find. An external test is also the first artefact a certification body, an enterprise customer, or an insurer will ask for. It is deliberately sequenced **last**: testing before the Critical fixes land would produce a report that says what this document already says, at considerable expense.
- **Expected deliverable.** A pen-test report, a remediation plan with owners and dates, and a retest of anything rated high or critical.
- **Priority.** **Medium**

---

## 5.3 Workstream O — Production Operations

### TRUST1-O1 — Health and readiness endpoints
- **Objective.** Ship an unauthenticated liveness endpoint and a readiness endpoint that checks the database and critical dependencies. **And reconcile the `EWO-PRO1` discrepancy.**
- **Why it matters.** There is no health endpoint. `grep` over `server/` finds no `/api/health`, no `/healthz`, no `/api/ready` — the only match is `GET /api/admin/knowledge-review/health` (`server/routes.ts:8328`), which is `assertAdmin`-gated and is a domain check, not a probe. A load balancer therefore cannot tell a wedged instance from a healthy one, and no uptime monitor can watch the platform. **But the more important half of this task is the reconciliation:** `EWO-PRO1`'s implementation report states it shipped `GET /api/health`, `GET /api/admin/platform/operations`, and a `platform_turn_outcomes` table. None of the three is in the code (`server/lib/platform-resilience.ts` and `platform-status.ts` *are*). Something was reverted, lost in a merge, or never landed — and **nobody noticed for over a week**, because nothing verifies that a shipped control is still there. Fixing the endpoint without understanding how it disappeared fixes the symptom and leaves the mechanism.
- **Expected deliverable.** `GET /api/health` (liveness, unauthenticated, no data disclosure) and `GET /api/ready` (dependency checks); a written reconciliation of what happened to `EWO-PRO1`'s deliverables; and a `TRUST1-V1` check that asserts declared controls exist, so that the next disappearance is caught by a test rather than by a subsequent programme.
- **Priority.** **Critical**

### TRUST1-O2 — Error tracking
- **Objective.** Integrate an error-tracking service (Sentry or equivalent) for server and client.
- **Why it matters.** There is none — no Sentry, Bugsnag, Rollbar, Datadog, or New Relic in `package.json`. Errors go to `console.error` (`server/index.ts:154-165`) and are then lost in stdout. **No one finds out that a user hit a 500 unless the user tells them.** The global error handler also returns `err.message` directly to the client, which leaks internal detail on unexpected failures and should be sanitised in the same change. Note the ordering constraint: error tracking must not be integrated *before* `TRUST1-P8`, or the first thing it does is ship personal data to a third-party processor, at volume, in error payloads.
- **Expected deliverable.** Error tracking with PII scrubbing configured *before* first use; the global handler returning a generic message for unexpected errors while logging the detail; the provider added to `TRUST1-P9`'s processor register with a DPA.
- **Priority.** **High**

### TRUST1-O3 — Alerting and paging
- **Objective.** Alert a human when production is broken.
- **Why it matters.** `PLATFORM_QUALITY_ARCHITECTURE.md` §2 and `EWO-PRO1` both name this as the outstanding gap, in as many words: *"the durable log is auditable but nothing pages anyone."* Every operational control in this programme — health checks, error tracking, structured logs — produces information that no one is looking at. An alert is the difference between observability and surveillance-of-nobody. It is also a hard dependency of `TRUST1-P14`: the 72-hour breach clock starts on *awareness*, and a platform with no alerting has engineered itself to become aware last.
- **Expected deliverable.** Alerting rules on liveness failure, error-rate spikes, database unavailability, and circuit-breaker trips (`server/lib/platform-resilience.ts` already produces these signals); a routing destination that reaches a human out of hours; and a documented, *tested* escalation path — an alert nobody receives is the same as no alert.
- **Priority.** **High**

### TRUST1-O4 — Structured logging
- **Objective.** Replace `console.*` with a structured logger with levels, redaction, and a durable destination.
- **Why it matters.** There is no logging library — `winston`, `pino`, `bunyan` and `morgan` are all absent; logging is 410 `console.*` calls in `server/routes.ts` alone. This is the implementation half of `TRUST1-P8` (which owns the *requirement* that personal data never reach a log; O4 owns the *mechanism* that makes it structurally hard to). Unstructured logs are also unqueryable, so even where the information needed to diagnose an incident exists, it cannot be found under time pressure.
- **Expected deliverable.** A structured logger (`pino` or equivalent) with levels, a field-redaction allowlist satisfying `TRUST1-P8`, request correlation IDs, and a durable destination — which is itself a processor and goes in `TRUST1-P9`'s register.
- **Priority.** **High**

### TRUST1-O5 — Database backup and *tested* restore
- **Objective.** Establish, document, and **test** a database backup and restore procedure, with a stated RPO and RTO.
- **Why it matters.** **There is no backup or restore script, and no backup policy, anywhere in the repository.** Every document that uses the word "backup" — `PUSH_PRESERVATION_REMOTE_BACKUP.md`, `PHASE_C_REMOTE_BACKUP_CONFIRMATION.md` — means *git branch preservation*. The code is thoroughly protected. **The users' data is not.** Managed Postgres (Neon) almost certainly takes automatic backups, and that is the trap: an untested backup is a belief, not a control, and the belief is always tested for the first time on the worst day. This matters acutely here because of `TRUST1-O8`: `scripts/migrate-prod.sh` runs `drizzle-kit push --force` against production, which is a mechanism entirely capable of destroying data — and the restore path from that has never been walked.
- **Expected deliverable.** A documented backup configuration (frequency, retention, encryption, location); a written RPO and RTO; and — the actual deliverable — **a restore performed into a scratch environment and timed**, with the result recorded. Plus point-in-time recovery confirmed, and backup retention reconciled with `TRUST1-P7`'s retention policy (a backup that outlives the retention period undoes it).
- **Priority.** **Critical**

### TRUST1-O6 — Incident response and runbooks
- **Objective.** Write the incident response procedure: severity levels, roles, communication, and runbooks for the incidents most likely to happen.
- **Why it matters.** There is no incident procedure. The nearest thing is the excellent test embedded in `.engineering/templates/RELEASE_TEMPLATE.md` — *"if this fails at 3 a.m., can the on-call engineer follow this document alone?"* — which is exactly the right question and has never been asked of production itself. The rollback protocol covers *code*; nothing covers a corrupted table, a leaked credential, or an outage. `TRUST1-P14` owns the regulatory branch (the 72-hour ICO clock) and must be *reachable from* this procedure rather than duplicated inside it: a breach is discovered as an incident, and the person triaging it needs one document, not two.
- **Expected deliverable.** An incident procedure with severity definitions and named roles; runbooks for the top failure modes (database unavailable, bad migration, credential compromise, LLM provider outage, instance wedged); a link into `TRUST1-P14` at the point where an incident is assessed as a personal data breach.
- **Priority.** **High**

### TRUST1-O7 — Deployment pipeline safety
- **Objective.** Make it impossible to deploy code that has not passed the tests, and stop `deploy.sh` committing work indiscriminately.
- **Why it matters.** `deploy.sh` runs **`git add -A`**, commits *everything* in the working tree with a default message, builds, and pushes to `main`, whence Render auto-deploys. It does not run `npm test`. It does not run `npm run typecheck`. Two distinct failure modes follow. First, **untested code reaches production by default** — `npm run release:check` exists (`typecheck && test && build`) but nothing enforces it, so the only real gate is that the bundle compiles. Second, **`git add -A` will commit whatever happens to be lying in the working tree** — a `.env` file (gitignored, so safe), a scratch script, a database dump, or a half-finished change from another task. The working tree as this document was written contained eleven unrelated files from another workstream. `deploy.sh` would have shipped all of them, silently. This directly contradicts `.engineering/checklists/PRODUCTION_RELEASE.md`, which requires named human authorisation and pre-release verification — the checklist is right, and the script bypasses it.
- **Expected deliverable.** `deploy.sh` refusing to run on a dirty tree (never staging automatically); `release:check` enforced as a hard gate in CI (`TRUST1-S10`) with branch protection on `main` so it cannot be bypassed; and the script reconciled with the release checklist so that one of them is not quietly overriding the other.
- **Priority.** **Critical**

### TRUST1-O8 — Migration mechanism convergence
- **Objective.** Converge on one migration mechanism and remove `drizzle-kit push --force` from every path that touches production.
- **Why it matters.** **Two migration mechanisms run against the same database.** One is disciplined: a custom, transactional, versioned runner (`server/migrations/runner.ts`), invoked at boot, recording applied IDs in `schema_migrations`, documented across ten kilobytes of `MIGRATIONS.md`. The other is not: `scripts/migrate-prod.sh` runs **`npx drizzle-kit push --force`** directly against the production `DATABASE_URL` — a schema diff-and-sync with no review, no transaction boundary, no version record, and an explicit `--force`. It is entirely capable of dropping a column, and thereby the data in it. Worse, `scripts/post-merge.sh` is wired to `.replit`'s `[postMerge]` hook and runs `npm run db:push` **automatically after every merge** — a schema mutation triggered by a git operation, which is not a thing anyone decided to do. This is precisely the "two owners of one fact" pattern that `ARCHITECTURE_PRINCIPLES.md` forbids, applied to the schema itself, and it is the largest single data-loss risk in the platform. `TRUST1-O5` (tested restore) exists partly because of this task, and must land before it.
- **Expected deliverable.** One mechanism — the versioned runner. `drizzle-kit push` removed from every production path and from the post-merge hook; `scripts/migrate-prod.sh` deleted or rewritten to invoke the runner; a documented migration procedure with review; and a `TRUST1-V2` production check asserting the `schema_migrations` head matches the expected version (`scripts/verify-prod.ts` already does exactly this — it is a working control that simply needs to become a gate).
- **Priority.** **Critical**

### TRUST1-O9 — Uptime monitoring and service levels
- **Objective.** Monitor availability from outside the platform and state the service level THA intends to meet.
- **Why it matters.** Nothing currently watches THA from the outside; failure is discovered by a user. This is a genuine dependency of `TRUST1-O1` (an uptime monitor needs a health endpoint to watch) and it is deliberately **Medium**: it improves how fast a failure is *noticed*, whereas O1, O5 and O7 determine whether the failure happens and whether it can be undone. Notice-faster is worth less than break-less.
- **Expected deliverable.** External uptime monitoring against `TRUST1-O1`'s health endpoint, routed into `TRUST1-O3`'s alerting; a stated internal availability objective (not a customer-facing SLA — THA is not ready to promise one, and should not).
- **Priority.** **Medium**

---

## 5.4 Workstream V — Production Verification

> This workstream exists because of one sentence in §1: three controls were declared shipped by `EWO-PRO1` and none of them are in the code. **A control that is not verified is not a control, and a compliance programme that trusts its own documents certifies nothing.**

### TRUST1-V1 — Reconcile declared controls against running code
- **Objective.** Audit every trust, security, privacy and operations claim made by an existing governing or implementation document against the actual code, and correct the documents that are wrong.
- **Why it matters.** Two concrete, evidenced discrepancies are already known. **First:** `PLATFORM_QUALITY_ARCHITECTURE.md` §2 — a *governing* document — declares the Security, Privacy and Trust quality domains **"Mature — declared, enforced, audited."** Sections 5.1 and 5.2 of this document are what that maturity currently consists of: no privacy notice, no erasure path, no rate limiting, no security headers, an anonymous-delete route, and personal data in plaintext logs. **Second:** `EWO-PRO1` declares a health endpoint, an operations surface, and a durable telemetry table, none of which exist. Both discrepancies are Rule KC8 in its purest form — declared, not enforced — and both are more dangerous than the gaps themselves, because a false assurance stops anyone looking. Every future TRUST1 task will cite these documents; if they are wrong, the programme inherits the error.
- **Expected deliverable.** A reconciliation report: every trust-related claim in `docs/architecture/` and `docs/implementation/`, marked VERIFIED (with the file:line that enforces it), ABSENT, or PARTIAL. Corrections raised against the source documents — **including a proposed amendment to `PLATFORM_QUALITY_ARCHITECTURE.md` §2 to state the true maturity of the Security and Privacy domains.** That amendment touches governing architecture and therefore requires governance review; it may not be made unilaterally.
- **Priority.** **Critical**

### TRUST1-V2 — Trust verification suite against the deployed system
- **Objective.** Extend `scripts/verify-prod.ts` into a suite that asserts every trust control is present **in the running production system**, not in source.
- **Why it matters.** `scripts/verify-prod.ts` already exists, already connects to production, already emits PASS/FAIL/WARN, and already exits non-zero on failure — it is a working, well-built control that currently verifies the migration head and little else. It is the natural home for this and needs extending, not replacing. The distinction it must enforce is the one this whole workstream turns on: a header set in `server/index.ts` is a *claim*; a header observed on an HTTP response from the deployed application is a *fact*. `TRUST1-S2`'s secure cookie flag, `TRUST1-S4`'s CSP, and `TRUST1-O1`'s health endpoint can each be present in source and absent in production — through a build issue, a proxy, an env var, or a lost merge, which is exactly what appears to have happened to `EWO-PRO1`.
- **Expected deliverable.** An extended `verify-prod.ts` asserting, against the deployed app: security headers present; session cookie `Secure`/`HttpOnly`/`SameSite`; auth endpoints rate-limited; unauthenticated write routes rejected; health endpoint responding; `schema_migrations` head as expected; no personal-data field names in a log sample. Runnable on demand and after every deploy.
- **Priority.** **High**

### TRUST1-V3 — Pre-deploy gate
- **Objective.** Make `npm run release:check` (typecheck + test + build) a gate that cannot be bypassed on the path to production.
- **Why it matters.** The command exists and is good; nothing runs it. `deploy.sh` builds and pushes without it (`TRUST1-O7`), and no CI exists to enforce it (`TRUST1-S10`). Every test written by this programme — the authorisation suite (`S9`), the erasure-coverage test (`P5`), the log-redaction test (`P8`) — is worthless until something refuses to deploy when they fail. **This task is what converts the rest of the programme from documentation into enforcement.**
- **Expected deliverable.** CI running `release:check` on every push and PR; branch protection on `main` requiring it to pass; `deploy.sh` invoking it and aborting on failure. Wired to `TRUST1-S10`'s CI and `TRUST1-O7`'s deploy hardening — one gate, not three.
- **Priority.** **Critical**

### TRUST1-V4 — Post-deploy verification
- **Objective.** Run `TRUST1-V2`'s suite automatically after every production deploy, and fail loudly if a control has disappeared.
- **Why it matters.** This is the control that would have caught the `EWO-PRO1` regression the day it happened rather than a week later, by accident, during a different programme. Controls do not only fail to arrive; they *depart* — through a revert, a merge, a refactor, a dependency bump. A pre-deploy gate proves the control existed when it was built. Only a post-deploy check proves it exists now.
- **Expected deliverable.** Post-deploy execution of `verify-prod.ts`, wired into `TRUST1-O3`'s alerting so a regression pages a human, and recorded in the release documentation required by `.engineering/checklists/PRODUCTION_RELEASE.md`.
- **Priority.** **High**

### TRUST1-V5 — Reconcile the launch trust gate with the Master Evolution Roadmap
- **Objective.** Fold TRUST1's launch-blocking criteria into the existing **Launch Definition of Done** in `THA_MASTER_EVOLUTION_ROADMAP.md` §9, rather than maintaining a second, competing gate.
- **Why it matters.** `THA_MASTER_EVOLUTION_ROADMAP.md` §6, §8 and §9 already own launch blockers, production readiness, and the Launch Definition of Done with explicit stop conditions. That document is *governing*; §8 of this one is not. If TRUST1 keeps its own launch gate, THA will have two documents answering "may we launch?", they will disagree within a month, and the more convenient one will win — which is precisely the duplicate-ownership failure the architecture principles exist to prevent. **There must be exactly one answer to whether THA may launch.**
- **Expected deliverable.** A proposed amendment to `THA_MASTER_EVOLUTION_ROADMAP.md` §9 adding the TRUST1 trust gate to the existing stop conditions, submitted for governance review. On approval, §8 of *this* document is retired and replaced by a pointer to the roadmap.
- **Priority.** **High**

### TRUST1-V6 — Evidence pack
- **Objective.** Assemble the artefacts that demonstrate the programme's controls to an external party.
- **Why it matters.** An enterprise customer's security questionnaire, an insurer, an investor's diligence, and any future certification body (`TRUST1-C`) all ask for the same evidence, and each will ask separately. Assembling it once, as the work lands, costs almost nothing; reconstructing it a year later from git history costs weeks. This is `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC15 applied to compliance: maintenance is not a follow-up, it *is* the work, and the only cheap moment is now.
- **Expected deliverable.** An evidence index pointing to the ROPA, DPIA, processor register, policy set, test results, verification runs, pen-test report and incident log — assembled *as each lands*, not retrospectively.
- **Priority.** **Medium**

---

## 5.5 Workstream C — Future Certification Readiness

> **This workstream commits THA to no certification.** Its purpose is to ensure that the work in P, S, O and V is done in a shape that makes certification *achievable later without redoing it*. Certification is a business decision with real cost, and it is not being made here. **Every task is Medium: none blocks launch.**

### TRUST1-C1 — Certification target decision
- **Objective.** Decide whether, when, and which certification THA pursues — and record the decision, including a decision to pursue none.
- **Why it matters.** The three plausible targets differ by an order of magnitude in cost. **Cyber Essentials** (UK, ~£300, self-assessed, weeks) is a reasonable early signal. **ISO 27001** (months, an ISMS, an auditor) is the enterprise expectation. **SOC 2 Type II** (a US-market expectation, requiring an observation window of months) is the one that cannot be retrofitted quickly — it needs *evidence collected over time*, which means the decision to pursue it later still constrains what must be captured now. The point of deciding early is not to certify early; it is to know which evidence to keep.
- **Expected deliverable.** A written decision with rationale and, if deferred, the trigger that reopens it (a named enterprise customer, a funding round, a market entry). "Not now" is a valid and probably correct answer — but it must be *recorded*, or it will be re-asked forever (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC12: a declined discovery is recorded).
- **Priority.** **Medium**

### TRUST1-C2 — Control mapping
- **Objective.** Map TRUST1's controls onto the Cyber Essentials, ISO 27001 Annex A, and SOC 2 Trust Services Criteria frameworks.
- **Why it matters.** The mapping reveals what is genuinely missing versus what merely has an unfamiliar name — and the cheapest time to discover a gap is while the work that would close it is still in flight. It also stops the opposite error: building an ISO control THA does not need because it appeared on a list.
- **Expected deliverable.** A control-mapping matrix (TRUST1 task → framework control → status), showing coverage and residual gaps per framework.
- **Priority.** **Medium**

### TRUST1-C3 — Policy set
- **Objective.** Write the policies every framework expects: information security, access control, data protection, incident response, business continuity, secure development, acceptable use.
- **Why it matters.** These are the documents an auditor asks for first, and — more usefully — most of them are simply the *written form* of decisions this programme is already making. Written as the work lands, they cost little. Written from scratch for an audit, they become fiction: policies describing a company that does not exist, which is worse than having none, because every one is a claim that can be tested.
- **Expected deliverable.** A policy set, each policy owned by a named person, each with a review date, and each describing *what THA actually does* — verified against `TRUST1-V1`'s reconciliation.
- **Priority.** **Medium**

### TRUST1-C4 — Asset and access register
- **Objective.** Record the systems, data stores, and third parties THA depends on, and who has access to each.
- **Why it matters.** Every framework requires it, and it answers a question that matters regardless of certification: *when someone leaves, what do we revoke?* Today that question has no answer written down anywhere.
- **Expected deliverable.** An asset register and an access register, with a joiner/mover/leaver procedure and a periodic access review. Overlaps deliberately with `TRUST1-P9`'s processor register — **one register, cited twice, never two.**
- **Priority.** **Medium**

### TRUST1-C5 — Evidence automation
- **Objective.** Make evidence a by-product of the pipeline rather than a periodic scramble.
- **Why it matters.** SOC 2 Type II in particular requires evidence *over a window* — you cannot generate it retrospectively, and a company that has not been capturing it has to wait months before it can even begin. `TRUST1-V2`'s verification suite already produces exactly the artefact an auditor wants (a timestamped, machine-generated attestation that controls were present in production), so the marginal cost of retaining its output is close to zero — but only if the decision to retain it is made *before* the runs happen.
- **Expected deliverable.** Retention of `TRUST1-V2` / `V4` verification runs as dated, immutable evidence; automated collection of access reviews and dependency-scan results; the evidence index from `TRUST1-V6`.
- **Priority.** **Medium**

---

# 6. Dependencies

### 6.1 Hard dependencies — the task cannot correctly begin until its prerequisite lands

| Task | Depends on | Why the order is not negotiable |
|---|---|---|
| `P3` Privacy notice | `P1` ROPA, `P2` Lawful basis, `P9` Processors, `P12` DPIA | A privacy notice is a *statement of fact* about processing. Written before the facts are established, it becomes a public misrepresentation — a legal exposure worse than having no notice. |
| `P5` Erasure, `P6` Export | `P1` ROPA | You cannot delete or export data you have not enumerated. Both tasks' tests assert *coverage of the ROPA*, so the ROPA must exist first or the tests assert nothing. |
| `P7` Retention | `P1` ROPA | Same reason. Also depends on `O5`: a backup outliving the retention period silently undoes it. |
| `P12` DPIA | `P1`, `P2`, `P9`, `P10` | A DPIA is an assessment *of* the processing. It cannot precede the description of it. |
| `P14` Breach procedure | `O3` Alerting | The 72-hour clock starts on awareness. A breach procedure on a platform with no alerting begins with "wait to be told." |
| `O2` Error tracking | **`P8` PII in logs** | **Integrating error tracking before P8 ships personal data to a third-party processor at volume, in error payloads.** This ordering is a hard stop, not a preference. |
| `O4` Structured logging | `P8` | P8 sets the requirement (no personal data in logs); O4 builds the mechanism. Building the logger first means building it twice. |
| `O8` Migration convergence | **`O5` Tested restore** | O8 removes `drizzle-kit push --force` from production — a change to the mechanism that mutates the production schema. Doing that without a proven restore is changing the parachute mid-jump. |
| `S9` Authz tests, `V3` Pre-deploy gate, `P11` Analytics guard | **`S10` CI** | All three presuppose a CI that does not exist. **No test enforces anything until something refuses to deploy when it fails.** |
| `S14` Pen test | All Critical `S` tasks | Testing before the known defects are fixed produces a report restating this document, at cost. |
| `V2` Trust verification suite | The controls it verifies | Verification follows the control. But `V1` (reconciliation) depends on *nothing* and must go first. |
| `C2`–`C5` Certification prep | `C1` Target decision | Mapping to a framework not chosen is speculative work. |

### 6.2 The load-bearing dependency

**`TRUST1-S10` (CI) is the single most structurally important task in the programme**, and its subject matter — dependency scanning — is not why. There is no `.github/` directory, therefore no mechanism exists that can *enforce* anything. Until CI exists, every test this programme writes is advisory, every gate is a suggestion, and the entire programme is a document — the exact failure mode it was written to correct. It is scheduled in Phase 0 for this reason and not for its own sake.

### 6.3 External dependencies (not engineering)

- **Legal review** of the privacy notice, terms, DPIA and children's-data determination. This is not an engineering deliverable and will sit on the critical path — start it early.
- **Executed DPAs** with OpenAI, the SMTP provider, Render and Neon (`P9`) — these depend on counterparty response times.
- **Budget** for error tracking (`O2`), alerting (`O3`), object storage (`S12`) and the pen test (`S14`).

---

# 7. Success Criteria

The programme has succeeded when every one of these is demonstrably true — *demonstrably* meaning verified by `TRUST1-V2` against the deployed system, not asserted by a document.

| # | Criterion | How it is proven |
|---|---|---|
| **SC1** | A household can read, in plain English, what THA knows about them and why — **before** they are asked for it. | `/privacy` resolves in production; linked at every collection point. |
| **SC2** | A household can export everything THA holds about them, and delete it, without contacting anyone. | `GET /api/user/export` and `DELETE /api/user` exist, are tested, and their coverage equals the ROPA. |
| **SC3** | No personal data appears in any application log. | Automated check over a production log sample finds zero personal-data field names (`V2`). |
| **SC4** | Authentication cannot fail open. | The server refuses to boot without `SESSION_SECRET`; verified by test and by `V2`. |
| **SC5** | No write route is reachable without authorisation. | The route-guard suite (`S9`) covers all 237 routes; every public route is on a justified allowlist. |
| **SC6** | Authentication endpoints are rate-limited. | `V2` asserts a limit fires against the deployed app. |
| **SC7** | Nothing reaches production without passing typecheck, tests and build. | Branch protection on `main` requires CI; `deploy.sh` cannot bypass it. |
| **SC8** | The database can be restored, and this is known because it *has been*. | A restore has been performed into a scratch environment and timed, with RPO/RTO recorded. |
| **SC9** | One migration mechanism touches production, and it is versioned and reviewed. | `drizzle-kit push --force` is absent from every production path and from the post-merge hook. |
| **SC10** | When production breaks, a human is alerted. | An alert has been fired end-to-end in a test and reached a person. |
| **SC11** | Every control this programme claims is verified in the deployed system after every deploy. | `V4` runs `verify-prod.ts` post-deploy and alerts on regression. |
| **SC12** | No governing document claims a control that does not exist. | `V1`'s reconciliation is complete and `PLATFORM_QUALITY_ARCHITECTURE.md` §2 has been corrected. |
| **SC13** | The processing of children's health data has a recorded lawful basis, a DPIA, and a data-minimisation decision. | `P10` and `P12` complete, legally reviewed. |
| **SC14** | THA can answer a security questionnaire without new work. | The evidence pack (`V6`) exists and is current. |

---

# 8. Definition of Done

> **`TRUST1-V5` will retire this section.** The Launch Definition of Done in `THA_MASTER_EVOLUTION_ROADMAP.md` §9 is the *governing* gate, and THA must have exactly one answer to "may we launch?" This section states TRUST1's contribution to that gate, to be folded into it. It is deliberately temporary, and is recorded as such so that it cannot quietly become a rival authority.

### 8.1 Done for the programme

TRUST1 is complete when:

1. **Every Critical task is implemented and verified** — not documented, not planned. Verified means `TRUST1-V2` asserts it against the deployed system.
2. **Every High task is either implemented or carries a written, dated, owner-signed risk acceptance** naming what is being accepted and why.
3. **Every Medium task has an owner and a scheduled date**, or a recorded decision not to do it (Rule KC12 — a declined discovery is *recorded*, or it is rediscovered forever).
4. **`TRUST1-V1`'s reconciliation is complete** and no governing document claims a control that does not exist.
5. **All 14 Success Criteria in §7 are demonstrably true.**
6. **`TRUST1-V5` has folded the trust gate into `THA_MASTER_EVOLUTION_ROADMAP.md` §9** and this section is retired.

### 8.2 The launch trust gate — what blocks launch

**THA may not launch while any of these is true:**

- ❌ There is no privacy notice, or it describes processing that does not match the ROPA. *(`P1`, `P3`)*
- ❌ Health data or children's data is processed without a recorded lawful basis and Art. 9 condition. *(`P2`, `P10`)*
- ❌ A user cannot delete their account. *(`P5`)*
- ❌ Personal data is written to application logs. *(`P8`)*
- ❌ The session secret can fall back to a committed default, or the server boots without it. *(`S1`)*
- ❌ The session cookie is transmissible over HTTP in production. *(`S2`)*
- ❌ Any write route is reachable unauthenticated. *(`S3`)*
- ❌ Authentication endpoints are unthrottled. *(`S5`)*
- ❌ `passwordResetToken` is returned in an API response. *(`S8`)*
- ❌ There is no health endpoint. *(`O1`)*
- ❌ The database restore procedure has never been executed. *(`O5`)*
- ❌ Untested code can reach production. *(`O7`, `V3`)*
- ❌ `drizzle-kit push --force` remains on any production path. *(`O8`)*
- ❌ Any governing document declares a control that does not exist. *(`V1`)*

### 8.3 What must not break

- **No new source of truth.** No task in this programme may create a second owner of any fact. `server/lib/access.ts` remains the sole authority on identity and role (`PKR25`). INT17 remains the sole owner of every byte the model reads (`P13` constrains it; it does not bypass it).
- **No new governance.** TRUST1 is subordinate to `PLATFORM_QUALITY_ARCHITECTURE.md`. Where a task requires a change to governing architecture — `V1`'s correction to PQA §2, `V5`'s amendment to the roadmap — it goes through governance review and is *never* made unilaterally.
- **No second launch gate** (see `V5`).
- **No second incident procedure** — `P14` (regulatory) is reachable from `O6` (operational), not duplicated inside it.
- **No second register** — `P9`'s processor register and `C4`'s asset register are one artefact, cited twice.
- **The 116 existing tests must continue to pass.** This programme adds gates; it does not get to break the domain work to do so.

### 8.4 Manual test steps for *this document*

This is a documentation-only change with no runtime surface, so verification is structural:

1. `.engineering/scripts/repo-structure-verify.sh` — passes (the file is workstream-filed, not at a folder root).
2. `.engineering/scripts/session-verify.sh` — passes (nothing added to `.engineering/`).
3. `git status` — exactly one new file; no pre-existing working-tree file touched.
4. `npm run typecheck` — unaffected (no code changed).

---

# 9. Recommended Implementation Order

Six phases. The ordering is driven by three rules: **(1)** anything that can leak or forge goes first; **(2)** enforcement machinery precedes the things it enforces; **(3)** nothing is verified before it is reconciled.

---

### Phase 0 — Stop the bleeding *(days, not weeks)*

*Live, evidenced defects. Every one is Critical, and every one is small. Phase 0 is deliberately made of cheap fixes to severe problems — there is no reason for any of it to wait for a programme.*

| Task | What |
|---|---|
| **`S1`** | Session secret fails closed — **do this first** |
| `S2` | Secure cookie in production |
| `S8` | Stop returning `passwordResetToken` |
| `P8` | Stop logging API response bodies |
| `S3` | Close the anonymous meal-template write routes |
| `S5` | Rate-limit authentication endpoints |
| `S10` | **CI exists** — the machinery everything downstream needs |
| `V3` | Pre-deploy gate — `release:check` enforced |
| `O7` | `deploy.sh` stops `git add -A` and cannot skip the gate |

> `S10`, `V3` and `O7` are one piece of work in three tasks: *nothing reaches production without passing the tests.* Doing them in Phase 0 means every subsequent phase lands behind a gate instead of on trust.

### Phase 1 — Protect the data *(weeks)*

*The platform can no longer leak or be forged. Now make sure it cannot be lost.*

`O5` tested restore → `O8` migration convergence *(strictly in this order)* · `O1` health endpoints + the `EWO-PRO1` reconciliation · `V1` declared-vs-actual reconciliation · `S11` complete `.env.example` · `O4` structured logging · `O2` error tracking *(only after `P8`)*

### Phase 2 — Establish the privacy foundation *(weeks; legal review on the critical path)*

*Everything in Workstream P depends on the ROPA. Start it now and start legal review in parallel — legal will take longer than the engineering.*

`P1` ROPA → `P2` lawful basis · `P9` processors + DPAs · `P10` children's data · `P12` DPIA

### Phase 3 — Ship the data rights *(weeks)*

*Now the facts exist, build the surfaces that state and honour them.*

`P5` erasure · `P6` export · `P7` retention · `P3` privacy notice · `P4` terms · `P13` AI transparency · `P11` cookie assessment

### Phase 4 — Harden and operate *(weeks)*

`S4` security headers · `S6` CSRF determination · `S7` password policy · `S9` authorisation test suite · `S12` media storage · `O3` alerting · `O6` incident response · `P14` breach procedure · `O9` uptime monitoring

### Phase 5 — Verify, then prove *(before launch)*

`V2` trust verification suite · `V4` post-deploy verification · `V5` fold the trust gate into the roadmap · `S13` threat model · `S14` penetration test · `V6` evidence pack

### Phase 6 — Certification readiness *(post-launch; not launch-blocking)*

`C1` target decision → `C2` control mapping · `C3` policy set · `C4` asset & access register · `C5` evidence automation

---

## The recommended first implementation task

# ▶ `TRUST1-S1` — Session secret must fail closed

**Why this one, ahead of everything else:**

- **It is the only defect on the list that defeats every other control simultaneously.** Privacy notices, erasure paths, retention policies and DPIAs all assume that the person authenticated as a household *is* that household. If a session cookie can be forged, none of that work protects anyone. It is the floor the entire programme stands on.
- **The exposure is live and unbounded.** The fallback secret is committed to this repository at `server/auth.ts:41`. It cannot be un-published. Anyone who has ever cloned, forked, or read this repo holds it, permanently — and the only thing standing between that string and a forged admin session is an environment variable that `server/index.ts` will *notice* is missing, log about, and then boot without anyway.
- **It has no dependencies.** It needs no CI, no ROPA, no legal review, no budget, and no decision from anyone.
- **It is roughly an hour of work** — delete a `||`, make the boot-time env check exit non-zero, rotate the secret, add a test.

A one-hour change closing a total authentication bypass, blocked on nothing, is not a task that should be scheduled behind a programme. It should be done first, this week, and the rest of Phase 0 done immediately behind it.

---

# 10. Risk Assessment (RAG)

**Ratings are of the risk as it stands *today*, on the evidence in this document — not of the risk after the programme lands.**

🔴 **RED** — live, evidenced, and either exposes personal data or defeats authentication.
🟠 **AMBER** — a real gap with material consequence, but no evidenced live exposure.
🟢 **GREEN** — adequate today, or a gap with genuinely low consequence.

| # | Risk | Evidence | Impact | RAG | Mitigating task |
|---|---|---|---|---|---|
| **R1** | **Session forgery via committed fallback secret.** An unset env var silently downgrades the platform to a publicly-known signing key; the boot check logs the absence and proceeds. | `server/auth.ts:41`; `server/index.ts:77-104` | Total authentication bypass, any account, including admin | 🔴 | `S1` |
| **R2** | **Personal data — including children's names, allergies, weights and BMIs — written to plaintext logs.** Full API response bodies, unredacted, on every request. | `server/index.ts:55-62` | Special-category data disclosure at scale; reportable breach | 🔴 | `P8` |
| **R3** | **Health and children's data processed with no lawful basis, no notice, no consent, and no way out.** No privacy notice, no consent record, no erasure path, no export path, no retention limit. | `client/` (no privacy/terms route); `server/auth.ts:120-174`; no deletion or export route | Regulatory exposure across Arts. 5, 6, 9, 13, 15, 17; and a product asking families for a child's allergies while telling them nothing | 🔴 | `P1`–`P7`, `P10`, `P12` |
| **R4** | **Anonymous write and delete on global content.** `DELETE /api/meal-templates/:id` has no auth check whatsoever. | `server/routes.ts:5085, 5097, 5115, 5135, 5147` | Unauthenticated destruction or poisoning of platform content | 🔴 | `S3` |
| **R5** | **Untested code deploys by default, and `deploy.sh` commits whatever is in the tree.** No CI exists; `git add -A`; tests not run. | `deploy.sh`; no `.github/` | Any defect, including every one in this table, can reach production unblocked — and unrelated working-tree files ship silently | 🔴 | `S10`, `V3`, `O7` |
| **R6** | **`drizzle-kit push --force` runs against production, and a post-merge git hook triggers a schema push automatically.** Two migration mechanisms own one schema. | `scripts/migrate-prod.sh`; `scripts/post-merge.sh`; `.replit` `[postMerge]` | Irreversible data loss from an unreviewed, untransacted schema diff — triggered by a *merge* | 🔴 | `O8` (after `O5`) |
| **R7** | **No tested database restore.** No backup or restore script exists; provider backups are assumed, never exercised. | Searched `scripts/`, `docs/` — nothing | Total data loss. Compounds R6: the mechanism most likely to destroy data has no proven recovery | 🔴 | `O5` |
| **R8** | **Live password-reset tokens returned in `GET /api/user`** — and therefore written to the log by R2. | `server/lib/sanitizeUser.ts`; `shared/schema.ts:27-28` | Account takeover for anyone who can read a log | 🔴 | `S8` |
| **R9** | **Unthrottled authentication with a 6-character password floor.** No rate limiting exists anywhere. | `package.json` (no limiter); `server/auth.ts:129` | Credential brute-force against every account, unlimited attempts | 🔴 | `S5`, `S7` |
| **R10** | **Governing architecture declares controls that do not exist.** PQA §2 rates Security/Privacy "Mature — declared, enforced, audited"; `EWO-PRO1` declares three controls absent from the code. | `PLATFORM_QUALITY_ARCHITECTURE.md` §2; `EWO-PRO1`; `grep` over `server/` | False assurance — the failure that stops anyone looking. Every future decision citing these documents inherits the error | 🔴 | `V1` |
| **R11** | **No security headers, no CSP, no HSTS.** `helmet` is not a dependency; the build config's allowlist misleadingly implies otherwise. | `package.json`; `script/build.ts:16` | XSS escalates to session theft — in a product that renders LLM output to users | 🟠 | `S4` |
| **R12** | **No alerting.** Nothing pages anyone; failure is discovered by users. Named as the open gap by both PQA and `EWO-PRO1`. | `PLATFORM_QUALITY_ARCHITECTURE.md` §2 | Extended outages; and the 72-hour breach clock starts late, because awareness comes last | 🟠 | `O3`, `O1`, `O2` |
| **R13** | **Zero authorisation test coverage.** 0 of 116 test files exercise any route guard. | `server/tests/` | Regressions like R4 are undetectable — R4 exists *because* of this | 🟠 | `S9` |
| **R14** | **No dependency scanning.** No CI, no Dependabot, no `npm audit` on any path. | No `.github/` | Known CVEs enter production silently and stay | 🟠 | `S10` |
| **R15** | **Meal photos on local disk, served unauthenticated, on a multi-instance deployment — and tracked in git.** | `server/lib/media-storage.ts:24-27`; `server/index.ts:139`; `.replit` autoscale | Personal data readable by URL; photos lost or missing across instances; user content in permanent git history | 🟠 | `S12` |
| **R16** | **Personal data sent to OpenAI with no DPA and no recorded training-data position.** | `server/intelligence/conversation/llm-provider.ts:14` | Art. 28 processor exposure; unbounded international transfer | 🟠 | `P9`, `P13` |
| **R17** | **No incident procedure and no runbooks.** | Searched `.engineering/`, `docs/` — nothing | Incidents improvised; the 72-hour regulatory clock missed | 🟠 | `O6`, `P14` |
| **R18** | **Incomplete `.env.example`** (one key of many). A new environment cannot be configured correctly from the repo — which is *why* R1's fallback exists. | `.env.example` | Misconfiguration; and it is the root cause of R1 | 🟠 | `S11` |
| **R19** | **No CSRF token defence.** Mitigated substantially by `sameSite: "lax"`, but undecided and unrecorded. | `package.json`; `server/auth.ts:47` | Bounded — needs a decision, probably not a rewrite | 🟠 | `S6` |
| **R20** | **Client-side admin routes are login-gated, not role-gated** (the role check lives in the page). | `client/src/App.tsx:112, 128` vs `admin-page.tsx:169` | **Server-side enforcement is intact** — all 51 admin routes are guarded. This is a UI-consistency defect, not a data exposure | 🟢 | `S9` (covered by the route audit) |
| **R21** | **Cookie/PECR exposure.** Only strictly-necessary cookies; no analytics, no tracking, no advertising SDK anywhere. | `client/src/components/ui/sidebar.tsx:86`; `package.json` | **Genuinely low today.** The risk is *losing* this position when someone adds an analytics package without knowing it changes the legal answer | 🟢 | `P11` (record it and guard it) |
| **R22** | **No PCI scope.** Subscription columns exist but no payment processor is integrated. | `package.json` (no Stripe) | None today. **Reopens TRUST1 the day billing is implemented** | 🟢 | Out of scope; trigger recorded |
| **R23** | **Password hashing.** scrypt, 16-byte salt, `timingSafeEqual`. | `server/auth.ts:22-33` | **This is done correctly.** Recorded so it is not "improved" by someone unfamiliar with it | 🟢 | None |
| **R24** | **Admin route authorisation.** All 51 `/api/admin/*` routes are guarded; `admin_audit_log` exists. | `server/lib/access.ts`; `server/routes.ts` | **Also done correctly**, and worth stating plainly: the authorisation *model* is sound. What is missing is its *coverage* (R4) and its *tests* (R13) | 🟢 | None |

### Risk summary

| RAG | Count | Meaning |
|---|---|---|
| 🔴 **RED** | **10** | Live, evidenced. Every one is launch-blocking, and **six of the ten (`S1`, `S8`, `P8`, `S3`, `S2`, `S5`) are hours of work each.** |
| 🟠 **AMBER** | **9** | Real gaps. Launch-blocking unless a written risk acceptance is recorded. |
| 🟢 **GREEN** | **5** | Adequate, or genuinely low. Three of these (R23, R24, R21) are recorded **because they are correct** — a risk register that only lists failures teaches the next reader that nothing here works, which is both false and demoralising. |

**The shape of the finding.** Ten red risks sounds like a platform in trouble. It is not one. The architecture is disciplined, the authorisation model is sound, the password hashing is textbook, and the domain engineering is genuinely strong. What the red list actually describes is a platform that was built with care in every dimension *except the one nobody was assigned* — and the cost of that omission is now concentrated in a handful of small, cheap, unglamorous fixes that were each individually too boring to schedule. **Phase 0 is a week of work that moves six of the ten reds.** That is the honest summary, and it is a far better position to be in than the count suggests.

---

# 11. Relationship to Existing Governance

**TRUST1 creates no new governing architecture.** It is a *programme*, not a law. Stated explicitly, because "do not create duplicate governance" is the constraint most easily violated by a document of this size.

| Existing document | Owns | TRUST1's relationship |
|---|---|---|
| `PLATFORM_QUALITY_ARCHITECTURE.md` (`EWO-PQA1`) | The six quality domains and their compliance checklist. §11: *"each of these is a governed workstream in its own right."* | **Parent.** TRUST1 *is* that workstream for Security, Privacy, Observability and Trust. It restates none of PQA's law. `V1` proposes a correction to §2's maturity ratings — **through governance review, never unilaterally.** |
| `THA_MASTER_EVOLUTION_ROADMAP.md` | Launch blockers (§6), production readiness (§8), Launch Definition of Done (§9) | **The single launch gate.** `V5` folds TRUST1's trust gate *into* §9 and retires §8 of this document. THA gets one answer to "may we launch?", not two. |
| `ENGINEERING_WORKFLOW.md` | Architecture Compliance Checklist; Trust & Claims hard stops (STEP 7) | **Cited.** Every TRUST1 implementation completes its checklist. TRUST1 adds no new checklist. |
| `.engineering/` protocols and checklists | Rollback, commit/push/deploy, the production release checklist | **Cited.** `O7` and `V3` make `deploy.sh` *obey* `PRODUCTION_RELEASE.md` — which already requires human authorisation and pre-release verification. The checklist is right; the script bypasses it. TRUST1 does not write a second checklist. |
| `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (`PKR1`–`PKR3`) + `docs/product/VISIBILITY.md` | Permission-aware disclosure; `server/lib/access.ts` as the sole authority | **Cited and preserved.** `P13` applies `PKR26`'s discipline (filter before composition) to personal data. No TRUST1 task creates a second authority on identity or role. |
| `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17) | Every byte the model reads as grounding | **Constrained, not bypassed.** `P13` adds a personal-data policy *at INT17's boundary*. It does not create a second context owner. |
| `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` | Rule KC8 (declared vs enforced); KC12 (record a declined discovery); KC14 (a named owner accountable *now*); KC15 (maintenance *is* the work) | **The intellectual basis of Workstream V.** `V1` exists because Rule KC8 predicted `R10` before this programme found it. |
| `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` (`FS3`), `FS1`, `FS2` | Content licensing, copyright, third-party ToS | **Explicitly out of scope.** A different kind of legal compliance, with an existing owner. |
| `THA_FULL_SYSTEM_LAUNCH_READINESS_AUDIT.md` (2026-06-23) | The prior security baseline | **Superseded as a baseline, honoured as history.** Its §8 findings (session secret, `secure: false`, no rate limiting) were **re-verified against the code on 2026-07-11 and all remain true.** They are now `S1`, `S2` and `S5`. An investigation discovers; a programme owns. |

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity is created, altered, or keyed by this document.
  Explain: Documentation only. TRUST1 task IDs (TRUST1-P1 …) are document
  anchors, not runtime identifiers, and are not persisted anywhere.

☑ One owner per fact
  No attribute gains a store.
  Explain: No code, no schema, no data. Where future tasks touch owned facts,
  the owner is named and preserved: server/lib/access.ts remains the sole
  authority on identity and role (PKR25); INT17 remains the sole owner of
  model-facing context (P13 constrains it at its own boundary, and does not
  bypass it).

☑ No duplicate entities
  Explain: No entity created.

☑ No duplicate ownership
  Explain: The programme's chief design constraint (§11). PQA owns the quality
  domains; the Master Evolution Roadmap owns the launch gate; the .engineering
  protocols own release and rollback. TRUST1 cites all three and restates none.
  §8 is explicitly TEMPORARY and is retired by V5 into the roadmap's §9,
  precisely so that two launch gates never coexist. P9's processor register and
  C4's asset register are ONE artefact cited twice. P14 (regulatory breach) is
  REACHABLE FROM O6 (operational incident), not duplicated inside it.

☑ No duplicate state
  Explain: No state.

☑ Extends existing architecture
  Explain: Extends PLATFORM_QUALITY_ARCHITECTURE.md §11, which states that each
  quality domain "is a governed workstream in its own right." TRUST1 is that
  workstream for Security, Privacy, Observability and Trust. It builds on
  scripts/verify-prod.ts (extends, does not replace), server/lib/
  platform-resilience.ts, .engineering/checklists/PRODUCTION_RELEASE.md, and
  docs/product/VISIBILITY.md.

☑ Progressive enrichment where appropriate
  Explain: N/A — not a knowledge entity and not transactional state.

☑ Knowledge domain compliance
  Explain: TRUST1 introduces NO new knowledge domain and fills no §1.1 row. It
  is a programme of engineering work, not a body of knowledge THA ships. It
  APPLIES the PKCA's rules rather than extending them — Rule KC8 (declared vs
  enforced) is the basis of Workstream V; KC12 (record a declined discovery)
  governs C1 and S6; KC14 (a named owner accountable NOW) is why §4 names one;
  KC15 (maintenance IS the work) is why V6 assembles evidence as it lands.

☑ Honest gaps over fabricated information
  Explain: Every claim carries a file:line or a named negative search. Where the
  evidence conflicts, the conflict is REPORTED, not resolved by preference — see
  §1 and O1 on EWO-PRO1's three declared-but-absent controls, and V1/R10 on
  PQA §2's "Mature" rating. Where a control is adequate, it is recorded as
  adequate (R23, R24), not inflated into a finding.

☑ No permanent synchronisation bridge
  Explain: No bridge. O8 REMOVES one — the dual migration mechanism
  (drizzle-kit push --force alongside the versioned runner) is two owners of one
  schema, and the task converges them to one rather than reconciling them.

☑ Evolution over replacement
  Explain: Nothing is replaced. §8 of this document is the sole thing scheduled
  for retirement, by V5, into THA_MASTER_EVOLUTION_ROADMAP.md §9 — named,
  planned, and with the successor identified.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected:            None. Documentation only.
Declared SoT:               N/A — no data domain is read or written.
New store created?          NO
Existing store extended?    NO
Consumer created?           NO
```

Future TRUST1 *implementations* will touch data domains (notably `users`, `user_preferences`, `food_diary_metrics`, `household_eaters`, `conversation_turns`). Each must file its own Domain Impact declaration at that time. **This document creates none.**

---

## PRODUCT REGISTRY IMPACT

- **Registry affected:** **NO**
- **Entries created:** NONE
- **Entries updated:** NONE
- **Entries retired:** NONE
- **Any entry set to `public` or `household`:** N/A
- **Product knowledge written into a prompt, template, or fallback string:** **NO**

**Justification.** `ENGINEERING_WORKFLOW.md` is explicit that non-user-facing work owes the registry nothing, and the test is *"would a person's answer to 'what is THA?' be different after this change?"* A person's answer is unchanged: this document alters no page, route, journey, capability, dialog, integration, setting, or claim. Nothing ships.

**Forward notice — this changes at Phase 3.** `TRUST1-P3` (privacy notice), `P4` (terms), `P5` (account deletion) and `P6` (data export) each create **user-facing surfaces**, and each will therefore require registry entries (`/privacy` and `/terms` at `visibility: public`; the deletion and export controls at `visibility: household`), a named owner, and the full **Product Registry Compliance** and **Experience & UI Governance Compliance** blocks — *in the same change*, per Rule KC15 and the Completion Gate. Recorded here so those obligations are not rediscovered late.

---

## DATA IMPACT

- **Reads existing data:** NO
- **Writes new data:** NO
- **Changes meaning of existing data:** NO
- **Requires backfill:** NO

No database was connected to, queried, or modified in producing this document. All evidence is from source files in the repository at commit `27ed7f2`.

---

## TRUST CHECK

**Could this mislead the user?**
No user sees it. But it could mislead *an engineer*, which is the failure this programme was written to correct — so the standard applied is the stricter one. Every factual claim carries a `file:line` reference or an explicit negative search ("searched X, found nothing"). No finding is asserted on inference.

**Could this fabricate certainty?**
The deliberate guard against it: two evidence sweeps disagreed on whether `GET /api/health` exists. Rather than pick one, the claim was verified directly by `grep` against `server/` — no route, and no `platform_turn_outcomes` table, though `platform-resilience.ts` and `platform-status.ts` are present. The document reports the *discrepancy* and makes reconciling it a task (`O1`, `V1`); it does **not** assert what happened to the missing code, because the evidence does not say.

**Is anything guessed but shown as real?**
No. Three limits are stated plainly rather than papered over. **(1)** Legal conclusions (Art. 9 conditions, DPIA necessity, PECR position) are *engineering assessments requiring legal review* — `P2`, `P10`, `P12` and `P11` each name that review as a deliverable, not an optional extra. **(2)** Effort estimates are given only where the change is mechanically bounded (`S1`: delete a `||`, exit non-zero, rotate, test). No phase is given a date. **(3)** The database backup position is stated as *unevidenced in the repository* — Neon very likely takes automatic backups; the finding is that **THA has never tested a restore**, which is a different and provable claim.

**What happens if the system is wrong?**
If a finding here is wrong, work is scheduled that did not need doing — recoverable, and cheap. The asymmetric risk runs the other way: a *missed* finding launches. That is why `V1` (reconcile declared against actual) and `S13` (threat model) exist — this document was produced by reading code, which finds defects that exist and never the ones nobody thought of.

- **No architectural duplication introduced:** YES *(see §11 and the compliance checklist)*
- **No new source of truth created:** YES
- **No runtime behaviour altered:** YES — zero code, schema, migration, or configuration files changed

---

## ROLLBACK PLAN

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/TRUST1-production-trust-and-compliance-20260711` → `27ed7f21bb9cca137684c219910f3a3837e9b333` |
| **Files modified** | None |
| **Files created** | `docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` |
| **Rollback command** | `git rm docs/implementation/platform/TRUST1_PRODUCTION_TRUST_AND_COMPLIANCE.md` |
| **Full rollback** | `git checkout rollback/TRUST1-production-trust-and-compliance-20260711` |
| **Verification after rollback** | `.engineering/scripts/repo-structure-verify.sh` passes; `git status` shows the file gone; no other file affected. |
| **What the tag does NOT protect** | The eleven pre-existing, unauthored-by-this-task working-tree entries from `PDA1`/`PKR` (`docs/product/`, `data/cookbook/`, `data/development_world/`, `docs/investigations/ux/PDA1_*`, four `scripts/*.ts`, `.engineering/session/*`). Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3 they were **not touched, staged, or committed** by this task, and a rollback to the tag will not restore them. |

**Risk of rollback:** none. Deleting this document removes a plan and breaks no code.

---

## SCOPE LOCK

**Implemented scope**
- One document: the canonical TRUST1 Production Trust & Compliance programme.
- Five workstreams; 46 tasks, each with Objective, Why it matters, Expected deliverable, and Priority.
- Dependencies, Success Criteria, Definition of Done, recommended implementation order, and a RAG risk assessment of 24 risks.
- All findings grounded in repository evidence, cited by `file:line` or by an explicit negative search.

**Explicitly excluded**
- **All implementation.** No code, schema, migration, dependency, or configuration was changed. Not one of the 46 tasks was started — including `S1`, despite it being an hour of work, because doing it here would violate the decision-gated workflow and this document's own risk rating.
- **All new governing architecture.** No document in `docs/architecture/` was created or amended. The two amendments this programme *implies* — the correction to `PLATFORM_QUALITY_ARCHITECTURE.md` §2 (`V1`) and the trust gate into `THA_MASTER_EVOLUTION_ROADMAP.md` §9 (`V5`) — are **proposed as tasks requiring governance review**, and were deliberately not made here.
- Content licensing (`FS1`/`FS2`/`FS3`), accessibility and performance (PQA's), and PCI (no processor exists).
- Any investigation beyond repository evidence. No external counsel, no ICO guidance beyond what is common knowledge, no vendor documentation, no penetration testing.

**SUGGESTIONS — observed in scope, not implemented, requiring approval**

1. **`TRUST1-S1` should not wait for this programme's approval.** A committed session-secret fallback is a live, total authentication bypass gated on one environment variable, and the fix is under an hour with no dependencies. Recommend it is authorised as a standalone change **this week**.
2. **The `EWO-PRO1` disappearance is more alarming than the missing endpoint.** Three controls were reported shipped; none are in the code; nobody noticed for over a week. Whatever mechanism lost them is still running. Recommend `O1`'s reconciliation is scoped to find the *mechanism*, not just to rebuild the endpoint.
3. **`scripts/post-merge.sh` runs `db:push` automatically after every merge**, wired via `.replit` `[postMerge]`. A schema mutation triggered by a git operation is not a thing anyone decided to do, and it is the fastest path to R6. Recommend it is disabled **immediately**, ahead of `O8`, as a one-line change.
4. **`script/build.ts:16` lists `express-rate-limit`, `cors` and `jsonwebtoken` in its bundling allowlist.** None are in `package.json`; none are used. Anyone auditing the build config would reasonably conclude these protections exist. Recommend the dead allowlist entries are removed so the build config stops lying.
5. **`uploads/` is not gitignored and user-uploaded images are already tracked in git.** Recommend `.gitignore` is updated ahead of `S12`, before more user content enters permanent history.
6. **PQA §2's "Mature — declared, enforced, audited"** rating for Security and Privacy is, on this evidence, not currently true. It is *governing*, so engineers rely on it. Recommend `V1` is prioritised so the correction is made deliberately rather than discovered by the next person who trusts it.

---

*TRUST1 is the canonical production trust programme for The Healthy Apples. Every future implementation of production trust work follows this document. It creates no governing architecture, no new source of truth, and no second gate — and it implements nothing.*
