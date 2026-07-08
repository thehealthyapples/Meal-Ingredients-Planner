# GOV2 — Canonical Alias Principle — Governing Document

**Status:** GOVERNING ARCHITECTURE — required reading before any import, resolver, search, or entity-authoring work
**Classification:** Entity Governance (canonical)
**Adopted:** 2026-07-07
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md)
**Specialises:** Core [Principle 1 — One canonical identity per entity](./ARCHITECTURE_PRINCIPLES.md#principle-1--one-canonical-identity-per-entity)
**Related:** [`NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`](./NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md), NK6F Canonical Vocabulary Ownership Audit, `shared/knowledge/`, `server/lib/canonical-foods-importer.ts`

> **What this document is.** A single governing principle that defines how alternate names for a canonical entity are handled. It **names and elevates** a rule that Core Principle 1 already implies (one canonical identity per entity) and that the canonical-food drafts already gesture at (the `aliases:` / `not_same_as:` fields). It introduces **no new entity, owner, or key space** — an alias is explicitly *not* a new identity. It removes ambiguity so no future workstream lets a synonym become a second entity.

---

## THE PRINCIPLE

> **One identity. One display name. Unlimited aliases. Every path in resolves aliases to the one identity; every path out shows the one display name. An alias never creates a second entity.**

This is the governing rule for every canonical entity (Food, Nutrient, Benefit, Meal, Product, and any future canonical vocabulary). It is a direct specialisation of Core Principle 1: if two strings name the same real-world thing, they resolve to the same key space — they do not fork it.

---

## THE SEVEN RULES

### Rule 1 — One canonical identity

Each real-world entity has exactly one canonical identity: one immutable `slug` in one key space. This is Core Principle 1, restated as the anchor every alias points back to. "Salmon" the food is one identity, whatever a source calls it.

**Fail test:** two slugs for the same real-world entity → fail. `tinned-salmon` and `salmon` are not two identities; the former is an alias of the latter.

### Rule 2 — One canonical display name

Each identity has exactly one human-facing display `name`, owned editorially. It is the only string the product presents as *the* name of the entity. Aliases are never promoted to the display name by a source, an importer, or the UI.

**Fail test:** two surfaces show a different primary name for the same identity → fail.

### Rule 3 — Unlimited aliases

An identity may carry any number of aliases: spelling variants, regional names, brand-neutral synonyms, source-specific labels, OCR/scan variants, historical names, casing/separator variants. Aliases are cheap and additive; adding one is a content edit, never a schema or identity change.

Aliases are **many-to-one**: many alias strings → one canonical identity. The reverse (one string → many identities) is forbidden; an ambiguous string is a resolver conflict to be disambiguated, not an alias.

### Rule 4 — All imports resolve aliases to the canonical identity

Every import path resolves incoming names through the canonical resolver **before** an entity is created or referenced. If an incoming name matches an alias, the import binds to the existing identity. If it matches nothing, the import surfaces a *new-identity decision* — it never silently mints one from an unrecognised string.

This is already the shape of `server/lib/canonical-foods-importer.ts` (`resolveNutrientSlugs` / `resolveBenefitSlugs` resolving draft references against the canonical set) and of the drafts' `aliases:` / `not_same_as:` declarations. This rule makes that behaviour mandatory and universal.

### Rule 5 — AI, search, OCR and external sources use the *same* resolver

There is exactly **one** resolver. AI/LLM extraction, free-text search, OCR/label scanning, and external-source ingestion all call it. No surface is permitted a private synonym table, a bespoke fuzzy-match, or a local normalisation step that could resolve a name differently from any other surface.

**Rationale:** divergent resolvers are how dual namespaces are re-introduced through the back door. One entity, one identity, one resolver — the resolver is the single enforcement point for Rule 1.

**Fail test:** two entry points map the same input string to different identities (or one to an identity and the other to a new entity) → fail.

### Rule 6 — UI always displays the canonical name, with optional "Also known as…"

Every surface renders the canonical display name (Rule 2). Aliases are never shown *as* the entity's name. Aliases may be surfaced additively, for user education and recognition, as secondary "Also known as…" information (e.g. helping a user connect the name they know to the canonical one).

- Primary label: **always** the canonical display name.
- Optional secondary: "Also known as: …" drawn from the alias set.
- The alias text is informational only; it is never an editable field on a value surface and never a second title.

### Rule 7 — Aliases never create duplicate entities

An alias is a pointer, not an entity. Recording an alias must never produce a second row, slug, or record for the same real-world thing. Any process that would create an entity whose meaning is already covered by an existing identity's alias set **stops** — it merges into (or resolves to) the existing identity, and only proceeds to create a new identity on an explicit, human-approved new-identity decision.

This mirrors the drafts' existing `duplicate_policy: stop_on_slug_conflict_or_merge_only_with_explicit_approval` and elevates it from a per-food note to a platform rule.

---

## WHAT AN ALIAS IS — AND IS NOT

| | Alias | New identity |
|---|---|---|
| Names an existing real-world entity by another string | ✅ | ❌ |
| Creates a slug / key space | ❌ (points at one) | ✅ |
| Owns facts, relationships, display | ❌ | ✅ |
| Added by | content edit | governed new-identity decision |
| Shown in UI | optionally, as "Also known as…" | as the canonical name |

**A different scope is not an alias.** Where two names denote genuinely different real-world things — the `not_same_as:` cases (`broccoli` vs `cauliflower`, `salmon` vs `trout`, a plain food vs a branded ready meal) — they are **separate identities**, not aliases. Aliasing them would violate Core Principle 1 in the opposite direction (collapsing two facts into one). The scope test from Core Principle 2 applies: *can these two names ever need to disagree on a fact?* If yes → separate identities. If no → alias.

---

## RELATIONSHIP TO THE CORE PRINCIPLES

- **Core Principle 1 (one canonical identity per entity):** this document *is* the alias-facing enforcement of it. Aliases are how the platform absorbs the messy plurality of real-world names *without* forking the key space.
- **Core Principle 2 (one owner per fact; scope test):** governs the alias-vs-separate-identity boundary. Same-thing synonyms alias; legitimately-different things stay separate.
- **Core Principle 6 (no fabricated knowledge):** the resolver never *guesses* an entity into existence from an unknown string; unresolved names become honest new-identity decisions, not silent duplicates.

---

## FAIL TESTS (SUMMARY)

A change violates GOV2 if any of the following is true:

1. The same real-world entity has more than one canonical slug or more than one display name.
2. An import, AI, search, OCR, or external path creates an entity from a string that an existing alias already covers.
3. Any surface resolves names through something other than the single shared resolver.
4. A UI surface presents an alias as the entity's primary name, or omits the canonical name.
5. Two distinct real-world things are merged under one identity via aliasing (scope violation).

---

## SCOPE

**In scope:** every canonical entity and canonical vocabulary — Food, Nutrient, Benefit, Meal, Product, Household member, and any future canonical list. The resolver, all import pipelines, all search/AI/OCR entry points, and all display surfaces.

**Out of scope:** this principle introduces no new owner, service, or business logic. It does not change *who* owns a vocabulary (see NK6F: TypeScript remains the canonical owner of the nutrient and benefit vocabularies) — it governs *how alternate names for those canonical identities are handled*.
