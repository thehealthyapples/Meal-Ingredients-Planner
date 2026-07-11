# PKR1 / PKR2 — THA Product Knowledge Registry Architecture — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Architecture and documentation only — no code, schema, route, runtime, or API is touched, and nothing reads the artefact produced. Raised from 🟢 GREEN (at `PKR1`) to 🟡 AMBER by `PKR2` for two reasons, neither of which is about what was written: **(1)** `PKR2` *amends a boundary set by `PKR1` one commit earlier* — the prohibition on any runtime read of the registry — and a governing document that reverses itself deserves review, not a green light; **(2)** `PKR2` changes `ENGINEERING_WORKFLOW.md` and the implementation template, which bind **every future implementation in the repository**, not just this one. The blast radius of a governance edit is every task that follows it.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/PKR1-product-knowledge-registry-20260711` → `a4324004d667406f65599c3af34865c8921ee88a` |
| Preserved, not regenerated | **`PKR2` is a continuation of the `PKR1` session and reuses its rollback identifier.** `HEAD` has not moved — nothing from `PKR1` was committed — so the `PKR1` tag still points at the correct pre-work commit. Per `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` § 6: *"If a session is resumed, the identifier is preserved, never regenerated."* |
| Working tree | **Intentionally dirty — pre-existing, not authored by this task.** A large staged changeset from earlier sessions was present at session start: the `.engineering/` scaffold additions and the root-document deletions from the `HOUSE2`/`DOCSTRUCT1` housekeeping work. **The tag does NOT cover any of it** — a tag protects committed state only. That work was left untouched and uncommitted; this task neither modified nor committed it. |
| This task's writes | `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (new), `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`, `docs/implementation/governance/PKR1_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (this report) |
| Rollback to committed state | `git checkout rollback/PKR1-product-knowledge-registry-20260711` |

> A tag protects committed state only. The tree was dirty at session start with work this task did not author; that work is not captured by the tag and was deliberately not touched.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (Architecture Compliance Checklist, AI Architecture Compliance, Domain Impact, STEP 5 mandatory sections, STEP 9 Completion Gate)
- [x] `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP: *"does not own knowledge — owns an index of pointers into the existing owners"*)
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`
- [x] `docs/roles-and-subscriptions.md` — **`PKR2`**: `users.role` (`user`/`admin`) and `users.subscription_tier` (`free`/`premium`/`friends_family`) are independent; helpers live in `server/lib/access.ts`
- [x] `docs/admin-users.md` — **`PKR2`**: admin surfaces gate on `role = 'admin'`
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`

---

## THE AMENDMENT — READ THIS FIRST

**`PKR2` reverses a boundary `PKR1` set one commit earlier, and this report will not pretend otherwise.**

`PKR1` § 3.3 read: *"The registry is a description, never a dependency. No runtime code may read the registry. No behaviour may branch on it. No API may serve it."* § 4.3 added that the registry is *"deliberately not grounding data"*. Both statements are now false, by instruction: `PKR2` requires that the Intelligence Platform query the registry and the Companion read from it.

This is a legitimate architectural decision and the right one — a registry only people read is documentation with better governance; a registry the Companion reads is a product that can explain itself. But a governing document that quietly overwrites its own boundary teaches future readers that boundaries are soft. So § 3.3 now **records the amendment rather than replacing it**, and states what changed and why.

The reasoning `PKR1` used was sound: *a description that becomes a dependency stops being safe to correct.* What it got wrong was the conclusion. It protected correctability by forbidding **all reads**, when what actually threatens correctability is not *reading* — it is **depending**. A registry that code *reads for knowledge* stays safe to fix. A registry that code *branches on for behaviour* does not, because every correction becomes a behaviour change.

The boundary is redrawn along the line that was always the real one:

> **Rule PKR19 — The registry is read, never obeyed.** Intelligence may **read** it. **No code may branch on it.** Never a feature flag, never a routing table, never an authorisation source, never a control-flow input. It supplies **knowledge**, never **decisions**.

The load-bearing consequence is preserved exactly: **correcting a registry entry can never break the product.** If a correction could change behaviour, something has branched on it — and that is the defect, not the correction.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity ✅
  One permanent `id` per entry, never reused, never reissued after retirement
  (§7, §17). PKR2 adds `visibility` to the spine — a classification on the
  existing identity, not a second key space.

□ One owner per fact ✅
  Rules PKR5–PKR12 fix one owner per product concept, capability, page,
  journey, marketing message, screenshot, and inventory record — each a named
  human. PKR2 makes that owner accountable for one thing more: that the
  entry's visibility is correct (§9.1).

□ No duplicate entities ✅
  No entity created. PKR2's four tiers are FOUR AUDIENCES FOR ONE TRUTH, not
  four registries (§11). Rule PKR23 (monotonic visibility) is what enforces
  this: developer ⊇ admin ⊇ household ⊇ public, so no fact exists in two
  versions. A "public copy" and an "internal copy" would be two owners of one
  fact — precisely the failure the registry exists to end.

□ No duplicate ownership ✅
  Rule PKR1: cites data ownership, never declares it. Rule PKR2: never a second
  Capability Registry. Rule PKR20: enters Intelligence as a REGISTERED
  capability through INT17 — no bespoke path, no privileged read. Rule PKR25:
  server/lib/access.ts remains the SOLE authority on identity; the registry
  labels, it never authorises. Rule PKR27: the Companion queries and never
  duplicates. §4.6: the registry yields to all five architectures.

□ No duplicate state ✅
  No state. Rule PKR19 keeps the registry read-only and non-branching: no
  runtime path writes it, no behaviour depends on it.

□ Extends existing architecture ✅
  PKR2 adds nothing new to the platform. Permission-aware access is already a
  line in the AI ARCHITECTURE COMPLIANCE block. Registered-capabilities-only is
  already TIP's rule. INT17 already owns every byte the model reads. Rule PKR27
  is TIP's founding principle — "TIP does not own knowledge; it owns an index of
  pointers into the existing owners" — applied to the one domain TIP never had
  an owner to point at. The registry walks in the front door.

□ Progressive enrichment where appropriate ✅
  N/A — documentation, not a knowledge entity in the identity→core→optional→
  runtime sense.

□ Honest gaps over fabricated information ✅
  §12.3 requires the Companion to cite the registry id it answered from and to
  say "I don't know" where the registry is silent — which, today, is everywhere.
  §11.4/PKR22: visibility fails closed to `developer`; absence of a label is
  never permission. §22 states the DEVELOPER ROLE GAP openly: THA has no
  `developer` role, so that tier has no runtime role behind it and is served to
  no runtime consumer at all. §23 states convergence as 0%.

□ No permanent synchronisation bridge ✅
  None. Rule PKR17: JSON is generated from authored YAML — one act of
  authorship, nothing to keep in sync. Rule PKR21: Intelligence reads the
  generated inventory, never the prose, so there is no second path to diverge.

□ Evolution over replacement ✅
  Replaces nothing. PKR2 AMENDS PKR1's §3.3 explicitly and on the record (see
  above) rather than silently overwriting it. Product knowledge currently
  embedded in prompts is NAMED as a duplicate owner in §23 and forbidden going
  forward by Rule PKR27 — not silently tolerated, and not retired by this
  document either.
```

**Gate result: PASS.**

---

## AI ARCHITECTURE COMPLIANCE

**`PKR2` makes this section applicable where `PKR1`'s was not.** The registry is now defined as an Intelligence knowledge source, so the block is completed against the *architecture it defines* — noting throughout that **none of it is built** (§ Scope Lock).

```
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ Uses the canonical Intelligence Platform
    Rule PKR20 — Product Knowledge enters as a registered Knowledge Capability
    or not at all. No second platform, no bespoke path.

✓ Uses the Capability Registry
    Registered in server/intelligence/capability-registry.ts like Meals,
    Household, or Analyser. It gets no exemption and no privilege.

✓ Uses the Intent Engine
    Product questions route through the existing intent path. PKR2 defines no
    new routing.

✓ Reuses existing business services
    It reuses access.ts for identity (PKR25) and INT17 for composition (PKR20).
    It builds neither.

✓ Does not create another assistant
    The Companion is the only assistant. The registry is a knowledge source it
    reads — not a second voice.

✓ Does not duplicate conversation state
    None held. The registry is stateless and read-only.

✓ Uses registered capabilities only
    Rule PKR20.

✓ Uses permission-aware access
    §11 in full. Four tiers keyed on `role` via access.ts. Filtering happens in
    deterministic code BEFORE composition (Rule PKR26) — content above the
    user's tier never enters the prompt. The model is never asked to keep a
    secret it has been shown, because a prompt containing admin content plus an
    instruction not to reveal it has already leaked.

✓ Produces honest gaps rather than fabricated knowledge
    §12.3 — cite the entry or say "I don't know". Rule PKR29 — but never explain
    the ABSENCE, because "there's an admin feature I can't tell you about"
    discloses the very fact the tier was protecting.
```

**Gate result: PASS — against the architecture defined. Nothing is built.**

---

## PRODUCT REGISTRY COMPLIANCE

**Not applicable.** This implementation is the architecture *of* the registry; it is not a user-facing change and creates no product surface. The first implementation to complete this block will be the one that follows it.

---

## PRODUCT REGISTRY IMPACT

```
PRODUCT REGISTRY IMPACT
=======================
Registry affected: NO

Entries created:   NONE
Entries updated:   NONE
Entries retired:   NONE

Any entry set to `public` or `household`: N/A

Product knowledge written into a prompt, template, fallback
string, fine-tune, or capability code: NO
```

The registry is **defined and deliberately empty**. `docs/product/` does not exist.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Product Knowledge (knowledge about The Healthy Apples itself)
                 — a domain absent from the SoT Register's 27, because every one
                 of those is a domain of knowledge about the WORLD (food,
                 nutrition, planner state, households). None is knowledge about
                 the PRODUCT.
Declared SoT: The Product Knowledge Registry — docs/product/ (defined by this
              document; deliberately NOT created and NOT populated)
New store created? NO
  No data store, table, or runtime artefact. A documentation owner is defined.
  Rule PKR19 forbids the registry from ever becoming a control-flow dependency.
  Retirement plan for any replaced store: N/A — nothing is replaced.
Existing store extended? NO
Consumer created? NO
  PKR2 DEFINES the Intelligence read path (§12.2) and AUTHORISES none of it.
  No capability registered, no query path built, no filter written, no byte
  reaches a prompt.

AUTHORISATION IMPACT (PKR2)
  New authorisation source created? NO — and this is the load-bearing answer.
  server/lib/access.ts remains the SOLE authority on identity and role,
  unchanged, unshared, unduplicated (Rule PKR25). The registry CLASSIFIES what
  each tier may be told; it never DETERMINES what tier a user is in.
```

---

## IMPLEMENTATION

### Files created (2)

| File | Purpose |
|---|---|
| `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` | The governing architecture. 24 sections, rules `PKR1`–`PKR29`. |
| `docs/implementation/governance/PKR1_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` | This report. |

### Files modified (3)

| File | Change |
|---|---|
| `docs/architecture/README.md` | Row in the **Platform Governance** table + explanatory blockquote, extended by `PKR2` to cover the permission model, the Companion path, the amendment, and its cost. |
| `docs/architecture/ENGINEERING_WORKFLOW.md` | **`PKR2` — three edits.** (1) STEP 5: **Product Registry Impact** added as the **seventh** mandatory section ("all six" → "all seven"). (2) New **PRODUCT REGISTRY COMPLIANCE** block, standing beside the Architecture Compliance Checklist and the AI Architecture Compliance block, with an explicit *not applicable to non-user-facing work* carve-out. (3) STEP 9 Completion Gate: a new step 3 — a user-facing task is not complete until its registry entries are updated and named. The embedded implementation template gains a **PRODUCT REGISTRY IMPACT** section. |
| `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` | **`PKR2`** — **Product Registry Compliance** and **Product Registry Impact** sections added, so every future report is *born* with the question in it. |

### What `PKR1` defined

| Required | Delivered in |
|---|---|
| Purpose · Scope · Ownership | §2 · §3 · §9 |
| Relationship to Platform, Data, Intelligence, Experience, UI | §4, with §4.6 precedence: all five win in any conflict |
| Canonical ownership rules | §6 — `PKR5`–`PKR15` |
| Discovery vs Ownership | §5 |
| Registry governance · Update responsibilities · Lifecycle · Versioning | §13 · §14 · §15 · §17 |
| Human- and machine-readable principles | §10 |
| How investigations populate / implementations maintain | §15.1 · §15.2, §16 |
| One owner per concept / capability / page / journey / message / screenshot / inventory record | Rules `PKR5`, `PKR6`, `PKR7`, `PKR8`, `PKR9`, `PKR10`, `PKR11` |
| The 28 canonical sections | §8 |
| Folder structure beneath `docs/product/`, without creating it | §18 |
| Governance checklist | §19 |

### What `PKR2` added

**1 — Permission-Aware Product Knowledge (§11).** Four tiers, one truth.

| Tier | Gate | Sees |
|---|---|---|
| `public` | none | Help, onboarding, FAQs, feature guidance |
| `household` | authenticated | User-facing product guidance relevant to their experience |
| `admin` | `users.role === 'admin'` | Product inventory, capabilities, journeys, diagnostics, screenshots |
| `developer` | *(no role exists — see Trust Check)* | Internal architecture, implementation mappings, technical metadata, governance |

Six rules make this safe rather than merely stated:

- **`PKR23` — monotonic.** `developer` ⊇ `admin` ⊇ `household` ⊇ `public`. `visibility` names the **lowest** tier permitted to be told. This is what stops four tiers becoming four registries: non-monotonic visibility would require two versions of one fact, which is the exact failure the registry exists to end.
- **`PKR24` — keys on `role`, never `subscription_tier`.** A `free` household may be told, fully, what a premium capability does. **Knowing about a feature is not access to it.** The alternative is a product that will not explain what it sells — and a Companion pretending capabilities do not exist. Feature gating stays with `hasPremiumAccess()` at the point of use.
- **`PKR25` — the registry classifies; `access.ts` authorises.** *The safety property the whole section rests on.* If registry visibility were the authorisation decision, **a Markdown edit would be a privilege escalation and a typo fix could open an admin surface to the public.** The registry is authored in prose and reviewed as documentation — it must never hold power it is not reviewed as holding.
- **`PKR22` — fails closed.** Missing, unrecognised, or invalid `visibility` ⇒ treated as `developer`, served to no one. **Absence of a label is never permission.**
- **`PKR26` — filter before compose.** Content above the user's tier never enters the prompt. The model is never asked to keep a secret it has been shown — *a prompt containing admin content plus an instruction not to reveal it has already leaked, and no amount of instruction-following makes it not have leaked.*
- **§11.5 — asymmetric gate.** Tightening: anyone, no approval. Loosening: the entry's owner. Wrongly hiding a fact costs a reader an answer; wrongly exposing one cannot be undone.

**2 — The Registry as Companion Knowledge (§12).**

- **`PKR27` — query, never duplicate.** No product knowledge in any system prompt, template, hard-coded string, fallback, fine-tune, or capability code. The rule exists to kill one small temptation: a single helpful sentence about THA dropped into a prompt because it is faster than adding an entry. That sentence is a second owner (Rule `PKR13`), nothing points at it, it will be wrong within a quarter — **and it will be wrong in the Companion's voice, the most authoritative voice THA has.** Corollary: the Companion describes *itself* from the registry too, which is the likeliest instance of this failure.
- **`PKR20` / §12.2 — the read path**, which preserves four ownerships intact: INT17 still owns every byte the model reads (Product Knowledge arrives as a **Context View**, composed by INT17 — it does not serialise itself into a prompt); the Runtime Capability Registry still owns capability metadata; `access.ts` still owns identity; the registry owns nothing but the knowledge.
- **`PKR21` — Intelligence reads the inventory, never the prose.** A model reading the Markdown has bypassed the schema that carries the `visibility` label, and with it every guarantee in §11.
- **`PKR29` — absence is never explained.** The Companion never says *"there's an admin feature I can't tell you about"*. **The existence of a hidden surface is itself admin-tier knowledge.** This is the rule most likely to be broken by a well-meaning implementation trying to be transparent — transparency about what you *don't know* is a virtue; transparency about what you are *hiding* is a leak.

**3 — Engineering Governance (§16).** The Definition of Done obligation, wired into the process rather than asserted in a document nobody is required to read: a mandatory **Product Registry Impact** section (STEP 5), a **Product Registry Compliance** block, a **Completion Gate** step (STEP 9), and both sections added to the implementation template.

---

## DEFINITION OF DONE

**What success looks like:**
- The registry is defined as governing architecture: purpose, scope, ownership, permission model, Companion integration, governance, lifecycle, versioning, 28 sections, folder structure.
- Product knowledge is permission-aware by construction, and the registry classifies without ever authorising.
- The Companion has one governed source of product knowledge and no licence to duplicate it.
- **The registry obligation binds every future user-facing implementation by default** — enforced in `ENGINEERING_WORKFLOW.md` and the template, not merely asserted.

**What must not break:**
- No code, schema, route, runtime, or API behaviour — none is touched.
- **No authorisation path.** `access.ts` is neither modified, bypassed, nor duplicated.
- No existing ownership: SoT Register, Runtime Capability Registry, INT17, Experience, UI.

**Manual test steps:**
1. `test -f docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` → exists.
2. `grep PRODUCT_KNOWLEDGE_REGISTRY docs/architecture/README.md` → indexed.
3. `grep "PRODUCT REGISTRY COMPLIANCE" docs/architecture/ENGINEERING_WORKFLOW.md` → present.
4. `grep "all seven sections" docs/architecture/ENGINEERING_WORKFLOW.md` → present.
5. `grep "PRODUCT REGISTRY IMPACT" .engineering/templates/IMPLEMENTATION_TEMPLATE.md` → present.
6. `test -d docs/product` → **must NOT exist.**
7. `git diff --stat server/ client/ shared/` → **empty.** No runtime code touched.

---

## VALIDATION PERFORMED

| Check | Outcome |
|---|---|
| Rollback tag preserved from `PKR1` (HEAD unmoved) | ✅ `rollback/PKR1-…-20260711` → `a4324004…` |
| Architecture document exists | ✅ |
| Indexed in `docs/architecture/README.md` | ✅ |
| `ENGINEERING_WORKFLOW.md` — Product Registry Compliance block | ✅ |
| `ENGINEERING_WORKFLOW.md` — "all seven sections" | ✅ |
| `ENGINEERING_WORKFLOW.md` — Completion Gate step 3 | ✅ |
| `IMPLEMENTATION_TEMPLATE.md` — both sections | ✅ |
| `docs/product/` does **not** exist | ✅ |
| No runtime code modified **by this task** | ✅ This task issued no write to `server/`, `client/`, or `shared/` — every edit went to the five Markdown files listed above. ⚠️ **But `git diff HEAD -- server/ client/ shared/` reports 65 changed files.** Those are **pre-existing**, from the earlier sessions that left the tree dirty; they are not this task's and are not covered by the rollback tag. The honest claim is *"this task modified no runtime file"* — **not** *"the runtime tree is clean"*, which is false. |
| `.engineering/scripts/repo-structure-verify.sh` | ✅ Repository structure clean |

**Build, typecheck, and test suite were not run, and deliberately so.** This change touches five Markdown files and no application source. There is no runtime surface to exercise: no code imports these files, no route serves them, no test asserts on them. Running the suite would report only on the pre-existing dirty tree, which this task did not author and must not be credited or blamed for.

---

## DATA IMPACT

- Reads existing data: **NO**
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- New source of truth for **data**: **NO** — SoT Register unchanged and senior
- New source of truth for **authorisation**: **NO** — `access.ts` unchanged and sole (Rule `PKR25`)
- Changes what the model reads as grounding: **NOT YET** — `PKR2` defines the path and authorises none of it

---

## TRUST CHECK

- **Could this mislead the user?** Not yet — nothing is populated, no query path exists. But `PKR2` creates the *conditions* under which it could, and the document says so rather than burying it: §12.5 states plainly that **the Companion will be more convincing than the registry is accurate.** That is true of every grounded assistant and is the reason grounding must be governed rather than merely enabled.
- **Could this fabricate certainty?** The registry's dangerous failure mode is being *trusted while stale*, and `PKR2` sharpens it from a documentation risk into a user-facing one. Under `PKR1` a stale entry misled a reader who went looking. Under `PKR2` it is read aloud to a household in the Companion's voice with the product's authority. Rules `PKR15`, `PKR18`, §15.3 (90-day presumed-stale, now a **trust metric**), and §16 (now enforced in the workflow) exist for exactly this. §12.3 requires the Companion to cite the entry it answered from and to say "I don't know" where the registry is silent — which, today, is everywhere.
- **Could this disclose something it should not?** *This is the new risk `PKR2` introduces*, and it is answered **structurally, not by care**: fail-closed to `developer` (`PKR22`); deterministic filtering before composition (`PKR26`); classify-never-authorise so a Markdown edit can never escalate privilege (`PKR25`); owner-gated loosening, ungated tightening (§11.5); never-explain-an-absence (`PKR29`); and `VISIBILITY.md` as a single reviewable surface, because a permission model spread across 28 folders is one nobody has ever seen whole — and one nobody has seen whole is one nobody has checked.
- **Is anything guessed but shown as real?** No. The registry, the permission model, and the Companion path are all **defined and none built** (§24). §23 states convergence as **0%**.
- **What happens if the system is wrong?** Nothing at runtime today. Once built: a wrong entry misinforms; a mislabelled entry discloses. Rule `PKR19` guarantees the first is always safe to fix, because no code may branch on the registry. The second is guarded by the five structural controls above.
- **HONEST GAP — the `developer` tier has no role behind it.** THA's `users.role` is `user` or `admin` only (`docs/roles-and-subscriptions.md`); there is no `developer` role. The tier is defined with nothing to resolve it, and **fails closed**: `developer`-visibility content is served to **no runtime consumer at all** and is reachable only by reading `docs/product/` directly. This is stated in §22 rather than papered over, and creating that role is **not authorised** by this document.
- **No architectural duplication introduced:** **YES** — Rules `PKR1`, `PKR2`, `PKR13`, `PKR20`, `PKR25`, `PKR27` each exist to prevent the registry becoming a second owner of something.
- **No new source of truth created:** **YES for data. YES for authorisation.** **NO for product knowledge** — a new owner *is* created for knowledge about THA itself, which is the document's stated purpose, and no prior owner existed to displace.
- **No runtime behaviour altered:** **YES**.
- **Every "verified" claim backed by a command that ran:** **YES** — including the explicit statement of what was *not* run, and why.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/PKR1-product-knowledge-registry-20260711` → `a4324004d667406f65599c3af34865c8921ee88a` *(preserved from `PKR1`, not regenerated)*
- **Rollback this task only (preferred):**
  ```bash
  # Restore from the INDEX, not from HEAD — see the warning below.
  git checkout -- docs/architecture/README.md \
                  docs/architecture/ENGINEERING_WORKFLOW.md \
                  .engineering/templates/IMPLEMENTATION_TEMPLATE.md
  rm docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md
  rm docs/implementation/governance/PKR1_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md
  ```
  Preferred over the tag, which would also discard the pre-existing staged changeset this task did not author.

  ⚠️ **Do NOT use `git checkout HEAD <file>` on these three.** All three carry *pre-existing staged* changes from earlier sessions (`git status` shows `MM` on `README.md` and `ENGINEERING_WORKFLOW.md`; `AM` on `IMPLEMENTATION_TEMPLATE.md`). `git checkout HEAD <file>` resets **both the index and the working tree** to `HEAD` — which would silently destroy that earlier, unrelated work. `IMPLEMENTATION_TEMPLATE.md` is worse still: it is `A` (newly added, never committed), so it has **no `HEAD` version at all** and `git checkout HEAD` on it errors out. `git checkout -- <file>` restores each file from the **index**, discarding only this task's unstaged edits and preserving the prior sessions' staged work — which is exactly the intended behaviour.
- **Rollback `PKR2` only, keeping `PKR1`:** revert the three modified files and remove §11, §12, §16, Rules `PKR19`–`PKR29`, and the `visibility` field from the architecture document. The two are separable, and §24 Scope Lock states precisely which additions belong to which.
- **Verification after rollback:** no Product Knowledge Registry row in the architecture README; no Product Registry blocks in `ENGINEERING_WORKFLOW.md`; `docs/product/` still absent.

---

## SCOPE LOCK

**Implemented scope (`PKR1`):** the governing architecture — mandate, purpose, scope, relationship to and precedence beneath the five existing architectures, Discovery vs Ownership, rules `PKR1`–`PKR18`, the entry spine, the 28 canonical sections, the ownership model, the two forms, registry governance, update responsibilities, the lifecycle, the Definition of Done obligation, versioning, the `docs/product/` folder structure, and the Product Registry Governance Checklist. Plus the architecture README index row.

**Implemented scope (`PKR2`):** exactly three additions and one amendment. **(1) Permission-Aware Product Knowledge** (§11) — four tiers; mandatory `visibility` field; Rules `PKR22`–`PKR26`; the asymmetric change gate. **(2) The Registry as Companion Knowledge** (§12) — Rules `PKR20`, `PKR21`, `PKR27`, `PKR28`, `PKR29`; the read path through INT17. **(3) Engineering Governance** (§16) — the DoD obligation wired into `ENGINEERING_WORKFLOW.md` (STEP 5 mandatory section, Product Registry Compliance block, STEP 9 Completion Gate) and `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`. **(4) The amendment** — `PKR1` §3.3's prohibition on any runtime read is replaced by Rule `PKR19` (*read, never obeyed*), **on the record, in §3.3**, rather than silently overwritten.

**Explicitly excluded scope:** any code, schema, route, validator, or runtime change; **the creation of `docs/product/` or any folder beneath it**; **the population of any registry section, entry, or inventory record**; the authoring of the inventory schema; **the registration of the Product Knowledge capability in `server/intelligence/capability-registry.ts`**; **the construction of any query path, permission filter, or Context View**; **any change to `server/lib/access.ts`**; **the creation of a `developer` role**; any audit or removal of product knowledge currently embedded in Companion prompts or capability code; any change to the SoT Register, INT17, the Capability Registries, the Experience, UI, Intelligence Platform or Companion Platform Architectures, or any Capability Card; and any commit, push, or deployment.

**SUGGESTION** *(out of scope — do not implement without approval)*

1. **Population must precede the Companion path — this is now a correctness constraint, not a preference.** §15.1 and §23 both say it: *a grounded assistant pointed at an empty knowledge source is worse than an ungrounded one*, because it has been given permission to speak on a subject where it knows nothing. Build content first (coverage-first: Domains, Pages, Routes, Journeys), the read path second. Marketing Messages and Competitive Advantages come last — they are claims *about* product truth and cannot be substantiated before it exists.

2. **Audit what the Companion already says about THA.** Rule `PKR27` forbids product knowledge in prompts *going forward*; it does not remove what is there now. §23 names this as an unaudited duplicate owner. Somebody should grep the system prompts and capability code for sentences describing THA — they are second owners of product facts, and they are almost certainly already stale.

3. **The `developer` role does not exist.** `users.role` is `user`/`admin` only. The tier is defined and fails closed, so nothing leaks — but nothing is served either. Decide whether to create the role or to fold `developer` into `admin` at runtime. Do not let it drift as a tier that means nothing.

4. **`VISIBILITY.md` deserves a mechanical check**, the way `repo-structure-verify.sh` checks repository structure: *does every entry have a visibility? does anything in `surfaces/hidden/` claim `public`?* A permission model that is only ever reviewed by eye is one that will eventually be reviewed by nobody. That is a script under `scripts/`, and it is not authorised here.

5. **`PKR2` widened `ENGINEERING_WORKFLOW.md` for every future task in the repository.** The Product Registry Compliance block adds real work to user-facing implementations. It carries a deliberate carve-out (*"not applicable to non-user-facing work"*), because a checklist that fires on every refactor is a checklist that gets skipped on the change that mattered. Watch whether that boundary holds in practice; if it becomes noise, tighten the trigger rather than letting the block be ignored.

---

## OUTCOME

The Healthy Apples now has a governing owner for knowledge about itself — and, under `PKR2`, a governed way to *speak* it.

THA has rigorous governance for knowledge about the *world*: the SoT Register names one owner per data domain, NK1/NK2 govern nutrition, INT17 owns every byte the model reads. Every fact about food has a home. But the answer to "what pages does THA have?", "what does the Companion do?", "what is this dialog for?" was reconstructed from code and 380+ investigations on every ask — rediscovered, never retained. And the Companion, which can explain a nutrient and plan a week, could not answer a single question about THA itself, because the product had never written itself down.

`PKR1` made that knowledge **owned**: 28 canonical sections, one named human per entry, one owner per page, journey, capability, claim, screenshot, and inventory record, under a single distinction — **investigations discover; the registry owns**.

`PKR2` makes it **speakable, safely**. The registry is now the single source of truth the Intelligence Platform queries and the Companion reads — permission-aware across four tiers, so what a person is told about THA depends on who they are. It classifies without ever authorising: `server/lib/access.ts` remains the sole authority on identity, so a Markdown edit can never become a privilege escalation. It is read, never obeyed: Intelligence may read it, no code may branch on it, and a correction can therefore never break the product. The Companion queries it and may never duplicate one sentence of it into a prompt. And the obligation to keep it true is no longer an assertion in a document nobody must read — it is wired into `ENGINEERING_WORKFLOW.md` and the implementation template, so a user-facing task is **not complete** until its registry entries are current.

The registry itself remains defined and deliberately empty: `docs/product/` is specified, not created; not one entry is populated; no capability is registered; no byte reaches a prompt. What exists today is the architecture — and an honest account of what it will cost to keep it honest.

## NEXT STEPS

**Awaiting approval — nothing has been committed, pushed, or deployed.**

1. **Approve the amendment explicitly, or reject it.** `PKR2` reverses a `PKR1` boundary written one commit earlier: the registry may now be read at runtime. § 3.3 records the reversal on the record rather than overwriting it, and the new line — *read, never obeyed* — preserves the property the original was protecting. **This is the one decision in `PKR2` that is not merely additive, and it should be signed off deliberately rather than absorbed.**

2. **Note that `PKR2` binds every future implementation in the repository**, not just the next one. `ENGINEERING_WORKFLOW.md` and the implementation template now require a Product Registry Impact section and a compliance block for all user-facing work. That is the intended effect — §16 exists because documentation that *can* be skipped, is — but it is a change to how everyone works, and it deserves to be seen as one. See SUGGESTION 5.

3. **Commit.** This task's writes are five files. The working tree also carries a large pre-existing staged changeset from earlier sessions that this task did not author and did not touch. **Decide separately whether that is committed with this work or before it** — it should not be swept into a `PKR` commit by accident.

4. **Authorise the first population workstream** — coverage-first, per SUGGESTION 1 — **and do not build the Companion read path until it has content.** Without population, this is an architecture for a registry that does not exist (§23, risk 1). With the read path but without content, THA ships an assistant confidently grounded in nothing (§23, risk 3).

5. **Audit product knowledge already living in prompts** (SUGGESTION 2). Rule `PKR27` binds the future; it does not clean the past.
