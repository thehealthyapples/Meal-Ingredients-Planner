# INT36 — Native THA Discovery Responses

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Builds on:** [`INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md`](./INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md) · [`INT33_INTELLIGENCE_CAPABILITY_ORCHESTRATION_IMPLEMENTATION.md`](./INT33_INTELLIGENCE_CAPABILITY_ORCHESTRATION_IMPLEMENTATION.md) · discovery engines INT26–INT32
**Tests:** `npm run test:intelligence-native-discovery` (81 assertions) · included in the `npm test` chain

---

## 1. Objective

Before INT36, a discovery turn returned an LLM-written sentence and whatever entity refs the model chose to emit. Discovery results were flattened into a JSON blob for grounding; the response carried no canonical THA cards and no actions, and there was no structural guarantee that links pointed at THA pages rather than external recipe sources.

INT36 makes the Intelligence Platform **present and link to canonical THA entities** for every discovery domain. When a discovery capability returns THA entities (Meals, Planner, Shopping, Pantry, Diary, Nutrition, Household, Profile), the turn now carries a structured, client-agnostic **native THA discovery response**:

```
Summary                → the turn's text
Canonical THA entities → discoveries[].entities  (meal / entity cards → THA pages)
Available actions      → discoveries[].actions   (Open · Add to Planner · Add to Shopping · View All)
```

**Architecture decision (scope rule honoured):** no new assistant, no new state owner, no new capability, no schema change, no change to canonical ownership. The work is a pure **projection** over data the discovery capabilities already return — exactly as `turn-fallback.ts` (INT35) is gateway vocabulary rather than a new owner.

| Piece | Role in INT36 |
|---|---|
| `native-discovery.ts` (new module) | Transforms a discovery capability's honest result into a structured `NativeDiscoveryResponse`. No storage, no platform calls, no business logic. |
| `ConversationGateway` | Builds native responses from ok-data discovery outcomes; attaches them to the turn; merges canonical refs. LLM summary + INT33 coordination unchanged. |
| Discovery engines / handlers / ports (INT26–INT32) | **Unchanged.** Their result shapes are consumed, not altered. |
| Meals read handler (Meal Detail) | **Unchanged.** Continues to own provenance (`sourceUrl`). |
| Intelligence Platform / Intent Engine / Capability Registry | **Unchanged.** |

---

## 2. The one canonical-ownership rule INT36 enforces

> The conversation **discovers** content. THA pages **own** presentation. External sites own **provenance** only.

This is enforced structurally, not by convention:

- A discovery card's only link is a **`ThaEntityRef`** — `{ type, id }` where `type` is a THA page (`meal`, `meal_template`, `shopping_item`, `pantry_item`, `diary_entry`, `food`, `household_member`) and `id` is the canonical numeric id. A ref can never be a URL.
- The builder reads only a fixed set of canonical fields (title, THA `imageUrl`, servings, and — when a source exposes them — Apple score / last cooked). It **never** reads or copies `sourceUrl`. External recipe URLs and external images therefore cannot appear in a discovery response by construction.
- Provenance (`sourceUrl`) is surfaced **only** on the THA Meal Detail read projection (`MealView.sourceUrl` in `meals-read-handler.ts`), where it already lived — untouched by INT36.

The meal's own `imageUrl` (stored on the THA meal row) is treated as the canonical THA image for that entity and may appear on a card; the external *source website* (`sourceUrl`) is the provenance artefact that stays on Meal Detail.

---

## 3. The structured contract (`native-discovery.ts`)

Client-agnostic (EWO §6) — structured canonical entities, not presentation-specific markup:

```ts
interface ThaEntityRef   { type: string; id: number; }              // → a THA page, never a URL

interface ThaDiscoveryCard {
  kind: "meal" | "entity";
  ref: ThaEntityRef;                 // canonical THA page
  title: string;
  subtitle?: string;                 // source label / category / role …
  imageUrl?: string;                 // THA image, meal cards only, where available
  servings?: number;                 // meal cards only
  appleScore?: number;               // if a canonical source exposes it — never fabricated
  lastCooked?: string;               // if a canonical source exposes it — never fabricated
}

interface DiscoveryAction {
  kind: "open" | "add-to-planner" | "add-to-shopping" | "view-all";
  label: string;
  appliesTo: "entity" | "results";   // entity → use card.ref; results → whole set (View All)
  query?: string;                    // present on view-all
}

interface NativeDiscoveryResponse {
  domain: string;                    // meal | planner | shopping | pantry | diary | nutrition | household
  summary: string;                   // "I found 5 meals matching “pasta”."
  entities: ThaDiscoveryCard[];
  actions: DiscoveryAction[];
  entityRefs: EntityRef[];           // canonical refs flattened for traceability / pronoun resolution
}
```

### Meal cards (EWO §2)
Personal and system meals become `kind: "meal"` cards carrying title, THA image (where available), servings, and the source label as subtitle, referencing the canonical THA **meal** page. Templates are canonical THA entities but not saved meals, so they become `kind: "entity"` cards referencing the THA **template** page. Apple score and last cooked are part of the card contract and are populated only if a canonical source exposes them on the discovery item — today no discovery source does, so they are honestly omitted (never fabricated; deriving them would require cross-capability reads the discovery engines are explicitly forbidden from doing).

### Actions (EWO §3)
Meal discovery offers **Open Meal · Add to Planner · Add to Shopping · View All**. Other domains offer **Open · View All** (the meal-only actions never leak into other domains). `view-all` carries the query so the client can re-run it on the THA domain page.

---

## 4. Generality — one code path for every domain (EWO §7)

`buildNativeDiscoveryResponse` is domain-agnostic. Domains are recognised purely by the canonical `{ source: "<domain>-discovery" }` shape every discovery capability returns (no capability-id coupling), and each domain plugs in as **one row** in the `DISCOVERY_DOMAINS` table:

```ts
"meal-discovery":     { domain: "meal",     refType: "meal",          …, mealCards: true, mealActions: true }
"planner-discovery":  { domain: "planner",  refType: "meal",          …, idField: "mealId" }
"shopping-discovery": { domain: "shopping", refType: "shopping_item", …, idField: "shoppingItemId" }
"pantry-discovery":   { domain: "pantry",   refType: "pantry_item",   … }
"diary-discovery":    { domain: "diary",    refType: "diary_entry",   …, idField: "diaryEntryId" }
"nutrition-discovery":{ domain: "nutrition",refType: "food",          …, idField: "internalId" }
"household-discovery":{ domain: "household",refType: "household_member", …, idField: "userId" }
```

The canonical id for each card is the configured `idField`, falling back to the number in the composite `id` (`"<prefix>:<number>"`) that every discovery item already carries. Adding a discovery domain is a single table row; no other code changes. (Note: planner discovery links each planned meal to its canonical THA **meal** page — `refType: "meal"`, `idField: "mealId"`.)

---

## 5. Gateway wiring (`conversation-gateway.ts`)

INT36 runs on the **successful** path only — a non-null INT35 `fallbackState` (no-route / no-knowledge / no-results / internal-error) means no data came back, so no cards are built and empty search never produces an empty card block.

1. After querying, the gateway iterates the routed (non-baseline) ok-data outcomes and calls `buildNativeDiscoveryResponse(outcome.result)` for each. Non-null results become `discoveries[]`, ordered to match the resolver's intent order (deterministic; handles INT33 compound multi-domain turns — one response per domain).
2. The **LLM still writes the natural-language summary** and any coordinated multi-capability answer (INT33 preserved). The structured cards + actions are attached *alongside* it, so the turn as a whole follows the THA pattern: `text` = Summary, `discoveries[].entities` = Canonical entities, `discoveries[].actions` = Actions.
3. Canonical THA refs from every native response are **merged** into the turn's `entityRefs` (deduped by `type:id`), so a discovery turn always carries canonical THA page refs — *"meal discovery links open THA meal pages"* holds even when the LLM omits refs — and never introduces an external URL.
4. `TurnResult.discoveries` is surfaced on `POST /api/intelligence/conversation/turn` (omitted when empty).

The write-intent guard, no-provider degradation, and all four INT35 fallback states return `discoveries: []` — behaviour unchanged.

---

## 6. Files changed

| File | Change |
|---|---|
| `server/intelligence/conversation/native-discovery.ts` | **NEW** — structured contract, domain table, discovery detection, card/action/summary projection, canonical-ref flattening |
| `server/intelligence/conversation/conversation-gateway.ts` | Build native responses on the success path; `TurnResult.discoveries`; `mergeEntityRefs` (LLM refs ∪ canonical discovery refs) |
| `server/routes.ts` | Surface `discoveries` on the `/turn` response (omitted when empty) |
| `server/tests/test-intelligence-native-discovery.ts` | **NEW** — 81 assertions (§7) |
| `package.json` | `test:intelligence-native-discovery` script; appended to the `npm test` chain |

Not touched: discovery engines/handlers/ports (INT26–INT32), meals-read (Meal Detail) handler, intelligence-platform, intent-engine, capability-registry, resolvers, permissions, schema.

---

## 7. Test evidence (`test-intelligence-native-discovery.ts`)

| Scope requirement | Proven by |
|---|---|
| **Meal discovery links open THA meal pages** | §1: personal/system meal cards ref `{type:"meal", id:42/100}`; template → `{type:"meal_template", id:7}`; §4 end-to-end: canonical meal refs merged onto the turn even when the LLM returns none |
| **External URLs are not surfaced as primary links** | §2: an `EXTERNAL_URL` planted on the discovery item never appears in the serialized response; no `sourceUrl` field carried; every card ref is a canonical numeric THA ref |
| **Provenance remains available within Meal Detail** | §3: the meals-read `detail` scope still returns `meal.sourceUrl` (the external URL), while the discovery card for the same meal carries no provenance |
| **Existing discovery behaviour continues to function** | §4: LLM still writes the summary (call count 1); turn text is the LLM output; a non-discovery turn attaches no discoveries and its text is unchanged; empty search → null (no empty card block) |
| **Other discovery domains adopt the pattern without modification** | §5: planner, shopping, pantry, diary, nutrition, household all produce valid responses through the *same* builder, each linking to its canonical THA page, following the Open + View All action pattern, with no meal-only actions leaking and no external URLs |
| Standard THA response pattern (Summary / entities / actions) | §1: summary format, one card per result, full meal action set incl. View All carrying the query |

Full verification run (2026-07-02): `test:intelligence-native-discovery` 81/81 · `test-intelligence-fallback` 82/82 · `test-intelligence-conversation-gateway` 64/64 · `test-intent-resolver` 124/124 · `test-intelligence-compound-resolver` 109/109 · `tsc --noEmit` introduces no new errors (153 before and after, none in INT36 files).

---

## 8. Behavioural notes & accepted trade-offs

- **Additive, not a replacement.** INT36 keeps the LLM summary and INT33 coordinated answers intact and layers structured cards on top, rather than replacing the summary with a deterministic template. This preserves natural-language quality and compound behaviour while guaranteeing the canonical entities + actions and their THA-only links.
- **Apple score & last cooked are contract-ready but currently unpopulated.** No discovery source exposes them today; deriving a meal's Apple score or cook history would require cross-capability reads the discovery engines are forbidden from performing (and would risk fabrication). They are surfaced the moment a canonical source provides them on the discovery item — honest gap, consistent with the platform's no-fabrication discipline.
- **The `imageUrl`/`sourceUrl` split is the provenance firewall.** A meal's `imageUrl` is the canonical THA image for the entity and may appear on a card; the external *source website* (`sourceUrl`) is provenance and stays on Meal Detail. Discovery item shapes never carried `sourceUrl`, so the firewall holds structurally, and the test plants one to prove it is stripped.
- **Client-agnostic by design.** Responses are structured refs + fields, so Web, Mobile and future clients render cards and action buttons natively without parsing prose.
