# Capability: Profile / Preferences

**Capability ID:** `profile`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Capability Card complete — **bound under INT12** (`availability: "available"`)
**Promoted:** EPIC 1.5 (2026-06-30), from `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
**Bound:** INT12 (2026-06-30) — see `docs/implementation/INT12_PROFILE_CAPABILITY_BINDING_IMPLEMENTATION.md` for the completed binding (port, handler, binding, tests).

> This document is the single canonical Capability Card for `profile`. It is governing architecture: required reading before any future binding implementation for this capability. The [Developer Capability Registry](../INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) indexes this card (implementation status, binding status, executable intents, owner, link) but does not duplicate its content — this is the only place the full card lives. The original investigation evidence and methodology remain in `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md`.

---

## Capability Card

```
Capability ID:          profile
Capability name:        Profile / Preferences
Owner service:          server/storage.ts — getUser() (line 395), getUserPreferences() (line 840).
                         NOTE: server/lib/sanitizeUser.ts is a sanitizer, not the owner — and is not
                         actually called by any of the routes below. server/routes.ts's local
                         buildProfileResponse() (lines 851–918) is the route-layer composer, not
                         a reusable owner method.
Source of Truth:        SoT D7, D26, D27 — `users` table (shared/schema.ts:8–41) +
                         `user_preferences` table (shared/schema.ts:642–676)
Access scope:           own-data only (user-scoped). Enforced structurally: every existing GET route
                         derives the id exclusively from req.user!.id (session), never from a param —
                         confirmed at server/routes.ts:921–924, 5277–5278, 6905–6907, 6953–6955.
Supported read intents: read, explain, add (per capability-registry.ts:114)
Executable intents:     read   — explain has no stored rationale to surface; add is a write.
Allowed scopes:         profile   — id, username, displayName, firstName, profilePhotoUrl,
                                    measurementPreference, preferredPriceTier, onboardingCompleted,
                                    isBetaUser, emailVerified, dietPattern, dietRestrictions,
                                    eatingSchedule, role, subscriptionTier/Status/ExpiresAt, isDemo,
                                    demoExpiresAt, createdAt, lastLoginAt, lastSeenAt,
                                    customMetricDefs, diaryExtraMetrics
                         preferences — all 32 fields on user_preferences (diet types, exclusions,
                                    health goals, budget, stores, calorie/height/weight, household
                                    counts, feature/planner toggles) — none are sensitive
Honest gaps:            explain verb — no stored rationale for any profile field — gap
                         add verb — write — gap
                         household eater dietary overrides (household_eaters table) — belong to
                           the household capability, not profile — gap if requested here
Permission model:       req.isAuthenticated() → 401 if not; id always taken from req.user!.id,
                         never from params/body, for every read route inspected. No explicit
                         "is this my own profile" check exists because the id can never be anyone
                         else's — own-data is structural, not a runtime branch.
Port methods:           getUser(userId)            → storage.getUser(userId)
                         getUserPreferences(userId) → storage.getUserPreferences(userId)
Handler responsibilities: read verb composes a profile projection (mirror buildProfileResponse's
                         allowlist) + a preferences projection (all 32 fields, none excluded).
                         OPEN DECISION: neither existing GET route calls sanitizeUser() — the route
                         layer uses its own explicit allowlist instead. A future binding must define
                         its own explicit allowlist (do not call storage.getUser() and forward the
                         raw row — it includes password, emailVerificationToken,
                         emailVerificationExpires, passwordResetToken, passwordResetExpires).
Binding registration:   PROFILE_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard INT7A Step 6 sections, plus an explicit assertion that
                         password / emailVerificationToken / emailVerificationExpires /
                         passwordResetToken / passwordResetExpires never appear in handler output.
Documentation updates:  server/intelligence/README.md row (future binding only)
Data impact:            Reads only — no writes, no schema change
Trust rules:            Never surface another user's profile (structural, not a runtime check —
                           still must be tested). Never surface password/token fields. Never pull
                           household_eaters overrides into a profile read.
```

---

**Source investigation:** `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
