# Capability: Plan Templates

**Capability ID:** `templates`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Bound under INT16 (`server/intelligence/bindings/templates.ts`, `availability: "available"`)
**Promoted:** EPIC 1.5 (2026-06-30), from `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)

> This document is the single canonical Capability Card for `templates`. It is governing architecture: required reading before any future binding implementation for this capability. The [Developer Capability Registry](../INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) indexes this card (implementation status, binding status, executable intents, owner, link) but does not duplicate its content — this is the only place the full card lives. The original investigation evidence and methodology remain in `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md`.

---

## Capability Card

```
Capability ID:          templates
Capability name:        Plan Templates
Owner service:          server/storage.ts — getMealTemplates() (line 926), getMealTemplate(id)
                         (line 930), getMealTemplateByName(name) (line 935), listTemplates()
                         (line 1515), getPublishedGlobalTemplates(tier) (line 1522),
                         getAllGlobalTemplatesAdmin() (line 1553), getUserPrivateTemplates(userId)
                         (line 1577), getTemplateWithItems(id) (line 1488), getDefaultTemplate()
                         (line 1505), countUserPrivateTemplates (line 1601).
                         CORRECTION to prior stub: server/template-migration.ts is a ONE-TIME
                         BACKFILL SCRIPT (runTemplateMigration(), line 5) with no read methods — not
                         a live owner. server/lib/meal-food-intelligence.ts does not exist at that
                         path; the actual file is server/services/meal-food-intelligence.ts and it is
                         unrelated to templates (per-meal ingredient intelligence).
Source of Truth:        SoT D13 — meal_templates (shared/schema.ts:48–77) + meal_plan_templates
                         (865–883) + meal_plan_template_items (885–901)
Access scope:           own-data (user-scoped private templates, ownerUserId = userId) PLUS public
                         (published global templates, ownerUserId IS NULL AND status = "published").
                         Publish/unpublish is admin-gated (isAdmin, server/lib/access.ts:6, assertAdmin
                         line 21).
Supported read intents: read, explain, search, recommend, generate, add, import, delete, share
                         (capability-registry.ts:184)
Executable intents:     read — search has no owner method (see gap below), so it is not executable.
Allowed scopes:         meal-templates list/detail — getMealTemplates() / getMealTemplate(id)
                         plan-templates library     — getPublishedGlobalTemplates(tier) +
                                                       getUserPrivateTemplates(userId) — own private
                                                       + published global only
                         plan-templates mine         — getUserPrivateTemplates(userId)
                         plan-templates default       — getDefaultTemplate()
                         plan-template detail by id  — getTemplateWithItems(id), WITH a mandatory
                                                       ownership/publish gate the handler must apply
                                                       itself (see Permission model — the existing
                                                       human route does NOT apply one)
Honest gaps:            search — NO search-by-name/tag method exists anywhere in storage.ts or
                           template-migration.ts (grepped; zero matches for searchTemplates /
                           searchMealTemplates / searchPlanTemplates / templatesByTag). Only an
                           exact-match getMealTemplateByName(name) exists (case-insensitive ilike,
                           not a search) — gap until the owner adds one.
                         recommend/generate/add/import/delete/share — write/generation — gap
                         explain — no stored rationale — gap
                         unpublished or other-user template requested by a non-owner, non-admin
                           caller — denied (see Permission model; this is STRICTER than the existing
                           human route)
Permission model:       mealPlanTemplates.ownerUserId distinguishes global (NULL) vs private
                         (=userId). getPublishedGlobalTemplates() filters isNull(ownerUserId) AND
                         status="published" + tier (server/storage.ts:1542–1546). Admin gate via
                         isAdmin()/assertAdmin (server/lib/access.ts:6,21), requiring
                         ownerUserId===null on admin routes.
                         CRITICAL FINDING: GET /api/plan-templates/:id (server/routes.ts:7522) has NO
                         owner/published/admin check at all in the live route — it returns ANY
                         template by id regardless of draft/owner status via getTemplateWithItems(id).
                         A capability handler must NOT simply delegate this as-is; it must apply the
                         same gate used elsewhere in the codebase (template.ownerUserId === null &&
                         status === "published") || ownerUserId === callerId || isAdmin(caller) —
                         otherwise the AI capability would be a NEW way to read other users' draft
                         templates that the existing human route already (under-)guards inconsistently
                         elsewhere. This is a documented stricter-than-existing-route decision the
                         card recommends, not a default the implementer should assume is already safe.
Port methods:           getMealTemplates()                  → storage.getMealTemplates()
                         getMealTemplate(id)                 → storage.getMealTemplate(id)
                         getPublishedGlobalTemplates(tier)   → storage.getPublishedGlobalTemplates(tier)
                         getUserPrivateTemplates(userId)     → storage.getUserPrivateTemplates(userId)
                         getTemplateWithItems(id)             → storage.getTemplateWithItems(id)
                                                                 [handler applies the gate above]
                         getDefaultTemplate()                 → storage.getDefaultTemplate()
Binding registration:   TEMPLATES_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard set + an explicit test that an unpublished/other-user template id
                         returns denied (not the existing route's permissive pass-through) + an
                         admin-vs-regular-user template visibility test.
Documentation updates:  server/intelligence/README.md row (future binding only). Developer Capability
                         Registry's owner-service field corrected from template-migration.ts → storage.ts;
                         meal-food-intelligence.ts path corrected.
Data impact:            Reads only
Trust rules:            Never surface an admin-unpublished or other-user's draft template to a
                         regular caller — the binding must be stricter here than the existing
                         under-gated human route.
```

---

**Source investigation:** `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
