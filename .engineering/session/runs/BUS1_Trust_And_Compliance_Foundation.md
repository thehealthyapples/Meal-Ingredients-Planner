# Session: BUS1_Trust_And_Compliance_Foundation

| Field | Value |
|---|---|
| **Session ID** | `BUS1_Trust_And_Compliance_Foundation` |
| **Rollback ID** | `rollback/BUS1-trust-and-compliance-foundation-20260718` → `8e25c195` |
| **Start time** | 2026-07-18T22:30:00Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Implement the complete Trust & Compliance layer required for commercial launch:
legal policy content, GDPR compliance architecture (consent, export, erasure,
correction), Privacy Settings, Help Centre and support flows, and transactional
email templates. No live payment processing.

## Rollback coverage warning — READ BEFORE ROLLING BACK
The working tree was **already dirty at session start** with work this session did
not author (24 modified tracked files, 280 untracked paths from `HOUSE_ACT*`,
`PROD3`/`PROD4` and `docs/ui-audit/`). Every dirty tracked file was snapshotted
before edit and this session committed only its own paths.

**Two other sessions committed on top of the rollback point WHILE this session ran:**
`e5cd889e` (EXPERIENCE_VERIFY1, 22:43) and `5406d3f7` (NUT_VERIFY1, 23:09).
The tag is therefore **two commits behind HEAD**, and `git checkout` of the tag
would also undo those two sessions' work. Prefer reverting this session's commit
by SHA over checking out the tag. Neither commit swept up any BUS1 file
(verified); the only overlap is `package.json`, where NUT_VERIFY1's `test:` script
and this session's sit in the same lines.

## Files created (32)
`shared/legal/` (types, company-profile, subprocessors, index, documents/×3) ·
`shared/privacy/consent.ts` · `shared/support/` (help-centre, support-request) ·
`server/privacy/` (personal-data-registry, data-export-service,
account-erasure-service, consent-service) · `server/support/support-service.ts` ·
`server/email/` (index, layout) · `server/trust-routes.ts` ·
`server/tests/test-bus1-trust-and-compliance.ts` ·
`client/src/components/legal/legal-document-view.tsx` ·
`client/src/pages/` (legal, privacy-settings, help-centre, contact) ·
`docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md` ·
`docs/implementation/platform/BUS1_TRUST_AND_COMPLIANCE_FOUNDATION.md` ·
7 `docs/product/` entries

## Files modified (13)
`shared/schema.ts` (3 tables + `admin_audit_log` NOT NULL dropped) ·
`server/migrations/runner.ts` · `server/auth.ts` · `server/routes.ts` ·
`server/storage.ts` · `client/src/App.tsx` · `client/src/pages/auth-page.tsx` ·
`client/src/pages/profile-page.tsx` · `client/src/hooks/use-user.ts` ·
`package.json` · `docs/architecture/README.md` ·
`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domains 34–36) ·
`docs/implementation/ux/adoption-register.json`

## Files deleted (1)
`server/email.ts` — replaced by `server/email/`, migrated and retired in the same
change (Principle 8).

## Checkpoints
- [x] Rollback tag created and reported
- [x] Architecture bootstrap read
- [x] Reconnaissance — found the schema could not support a correct erasure
- [x] Architecture Compliance Checklist completed
- [x] Legal content layer, consent, personal data registry, support, email
- [x] Client surfaces + routes wired
- [x] Verification: 42/42 against a live database; live HTTP round-trip
- [x] Gates: typecheck 94 (baseline, 0 introduced) · build 🟢 · adoption 83/0/0
- [x] Documentation: architecture doc, SoT Domains 34–36, product registry, report
- [x] Committed

**Last checkpoint:** Committed; all gates green.

## Next action
Owner to review `docs/implementation/platform/BUS1_TRUST_AND_COMPLIANCE_FOUNDATION.md`.
Then `BUS2 — Commercial Platform`, whose handover is § 11 of the architecture doc.
**The one thing still blocking launch in this layer is six placeholder values in
`shared/legal/company-profile.ts`** — a one-file task.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
