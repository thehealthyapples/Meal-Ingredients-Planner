# INT37 — Companion Card Experience Implementation

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**EWO:** EWO-ARCH-INT02 / INT37
**Governs:** [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md)
**Builds on:** [`INT36_NATIVE_THA_DISCOVERY_RESPONSES.md`](../intelligence/INT36_NATIVE_THA_DISCOVERY_RESPONSES.md) · [`INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md`](../intelligence/INT35_INTELLIGENT_FALLBACK_AND_NATURAL_LANGUAGE_COVERAGE.md)
**Tests:** `npm run test:intelligence-companion-card` (36 assertions) · included in the `npm test` chain

---

## 1. Objective

INT36 made every discovery turn carry a structured, client-agnostic **Native Discovery Response** (summary + canonical THA cards + actions), but the Conversation UI still rendered only the LLM's summary text and generic `type #id` entity pills — a discovery answer read as prose, and any markdown or URL the model emitted rendered raw.

INT37 promotes **Companion Cards** to the canonical Intelligence Experience pattern and ships the **first Companion Card UI**, rendering INT36 discovery responses as:

```
Summary          → the sanitised, markdown-free summary line
   ↓
Companion Cards  → one compact card per canonical THA entity (title, THA image,
                   servings, Apple Score, Last cooked) with canonical actions
   ↓
Next Steps       → result-level actions (View All) → canonical domain landing page
```

**Architecture decision (scope rule honoured):** no new assistant, no new state owner, no new capability, no schema change, no change to canonical ownership. The work is a **presentation projection** over the INT36 response the server already returns. Companion Card view models are derived per turn and held in **session memory only** (never persisted) — consistent with TIP3 "context is derived, never stored twice." Canonical THA pages remain the single owner of presentation, interaction, editing and provenance.

| Piece | Role in INT37 |
|---|---|
| `companion-card.ts` (new, pure) | Transforms a Native Discovery Response into a client-agnostic Companion Card **view model**: sanitised summary, cards with facts, canonical navigation targets. No React, no DOM, no external URLs. |
| `FloatingAssistant.tsx` | Renders discovery turns as Summary → Companion Cards → Next Steps; captures the turn's discoveries (keyed by assistant turn id) so they survive the `/turns` refetch; navigates to canonical THA pages and closes the panel. |
| Server (`native-discovery.ts`, `conversation-gateway.ts`, `routes.ts`) | **Unchanged.** INT36 already emits `discoveries` on `POST /turn`; INT37 consumes it. |
| Canonical THA pages (Meal Detail, Planner, …) | **Unchanged.** They remain the sole owner of presentation, editing, and provenance. |

---

## 2. The one rule INT37 enforces (in the UI)

> The conversation never displays raw markdown, markdown image syntax, external URLs, or provenance links. Every action navigates to a canonical THA page.

Enforced structurally in `companion-card.ts`, not by convention:

- **Every navigation target is an in-app THA path.** Card actions and Next Steps resolve through `thaDetailPath(ref)` / `domainLandingPath(domain)`, which only ever build `/…` routes. The module cannot emit an external URL as a link by construction. (Test §4: every href starts with `/`; none matches `https?://`.)
- **Summaries are sanitised.** `sanitizeSummary` strips markdown image syntax (`![…](…)`), reduces markdown links to their visible text, removes bare URLs of any scheme, and strips emphasis/heading/code markers — before the summary is ever displayed. (Test §1, §4.)
- **The only URL a card carries is the canonical THA image** (`imageUrl`), rendered as an `<img src>` — an image source, never a link. Provenance (`sourceUrl`) is never in the INT36 response and never surfaced. (Test §2, §4.)

---

## 3. The Companion Card view model (`companion-card.ts`)

Pure and client-agnostic — the same view model renders on Web, Mobile, and future clients, and is exercised directly by the regression tests:

```ts
buildCompanionCardView(discovery: NativeDiscoveryResponse): CompanionCardView_Response | null
```

- Returns `null` when there are no entities — an empty discovery is never rendered as an empty card block (the empty-search state is an INT35 fallback, handled upstream).
- **Summary** — `sanitizeSummary(discovery.summary)`.
- **Cards** — one per entity: `title`, optional `subtitle`, optional canonical `imageUrl`, compact **facts** (`servings` / `appleScore` / `lastCooked`, each rendered only when present — never fabricated), and per-card **actions** whose `href` is the entity's canonical THA page.
- **Next Steps** — the result-level (`appliesTo: "results"`) actions, resolved to the domain's canonical landing route.

### Canonical navigation map

| Ref / domain | Canonical target |
|---|---|
| `meal` ref | `/meals/{id}` (the meal's canonical page — owner of Open / Add to Planner / Add to Shopping) |
| ref with no id-addressable detail page | domain landing route (fallback) |
| domain `meal` / `planner` / `shopping` / `pantry` / `diary` / `nutrition` / `household` | `/meals` · `/planner` · `/shopping-workspace` · `/pantry` · `/diary` · `/foods` · `/profile` |

Every meal-card action (Open Meal, Add to Planner, Add to Shopping) navigates to the meal's canonical THA page — the single owner of those actions — so a Companion Card never edits in place or bypasses canonical navigation.

---

## 4. UI wiring (`FloatingAssistant.tsx`)

1. **`CompanionCard`** — a compact, mobile-first, touch-friendly card: canonical THA image (or a domain glyph), title, subtitle, canonical fact chips, and a row of canonical action buttons.
2. **`DiscoveryBlock`** — renders one discovery response as its Companion Cards followed by a labelled **Next steps** row.
3. **`TurnBubble`** — an assistant turn with discoveries renders the sanitised summary in the bubble, then the Companion Card block(s) below it. Assistant turns *without* discoveries (legacy shape) render exactly as before (sanitised text + `type #id` entity pills), so legacy conversations are unchanged.
4. **Ephemeral discoveries.** `POST /turn` returns `discoveries` alongside the assistant turn; the UI refetches `/turns` after each turn (which does not carry discoveries, by design — they are derived, not stored). The mutation's `onSuccess` captures `data.discoveries` keyed by `data.assistantTurnId` into session state (`discoveriesByTurn`), so the cards bind to the server turn of the same id after the refetch. On a full reload the map is empty and the turn renders as its sanitised summary — canonical THA pages own the durable presentation.
5. **Navigation.** A card/Next Step click calls `handleNavigate(href)`, which closes the panel and routes via `wouter` to the canonical THA page.

No server or route change was required — INT36 already surfaces `discoveries` on the `/turn` response.

---

## 5. Files changed

| File | Change |
|---|---|
| `client/src/components/conversation/companion-card.ts` | **NEW** — pure Companion Card view model: `sanitizeSummary`, `thaDetailPath`, `domainLandingPath`, `buildCompanionCardView`; canonical-navigation + firewall by construction |
| `client/src/components/conversation/FloatingAssistant.tsx` | Render discovery turns as Summary → Companion Cards → Next Steps; `CompanionCard` / `DiscoveryBlock` components; ephemeral `discoveriesByTurn` state keyed by assistant turn id; canonical navigation that closes the panel; sanitise all assistant text |
| `server/tests/test-intelligence-companion-card.ts` | **NEW** — 36 assertions (§7) |
| `package.json` | `test:intelligence-companion-card` script; appended to the `npm test` chain |
| `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` | **NEW** — governing principle |
| `docs/architecture/README.md` | Index entry for the new principle |
| `docs/implementation/ux/INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md` | **NEW** — this document |

Not touched: `native-discovery.ts`, `conversation-gateway.ts`, `routes.ts`, discovery engines/handlers/ports, meals-read (Meal Detail) handler, intelligence-platform, intent-engine, capability-registry, resolvers, permissions, schema.

---

## 6. Regression verification

| EWO requirement | Proven by |
|---|---|
| **Companion Cards replace markdown discovery output** | §1: a discovery response yields a Companion Card view (one card per entity); the summary carries no markdown emphasis/image/link syntax |
| **Meal cards navigate to canonical THA pages** | §2: every meal-card action `href` is `/meals/42` (and `/meals/100` for the second card); `thaDetailPath` resolves a meal to its canonical route |
| **Next Steps render correctly** | §3: result-level actions become Next Steps (View All → `/meals`); per-card actions do not leak into Next Steps and vice-versa |
| **External URLs are suppressed** | §4: the planted external provenance URL is stripped from the summary; no summary/href matches `https?://`; every navigation target is an in-app `/…` path; direct `sanitizeSummary` checks |
| **Legacy conversations continue to render correctly** | §5: an empty discovery yields no card block; a plain legacy summary is unchanged by sanitisation; assistant turns without discoveries keep the legacy pill rendering (UI) |
| **Mobile and desktop layouts both function** | UI: the panel is `w-full sm:w-[380px]`; cards are compact, mobile-first, touch-friendly, and flow-wrap their actions — one layout scales across viewports |
| **Existing INT35 fallback behaviour unchanged** | `test:intelligence-fallback` 82/82; fallback turns carry `discoveries: []`, so no card block renders |
| **Existing INT36 discovery behaviour unchanged** | `test:intelligence-native-discovery` 81/81; the server response contract is consumed, not altered |

Full verification run (2026-07-02): `test:intelligence-companion-card` 36/36 · `test:intelligence-native-discovery` 81/81 · `test:intelligence-fallback` 82/82 · `tsc --noEmit` introduces no new errors in INT37 files.

---

## 7. Behavioural notes & accepted trade-offs

- **Derived, not stored.** Companion Cards are a per-turn projection held in session memory, not persisted with the turn. On reload a discovery turn renders as its sanitised summary; the canonical THA pages own the durable presentation. This keeps the conversation store a reference/outcome log (TIP3) and never a second home for business data.
- **Every meal action goes to the canonical meal page.** Open Meal, Add to Planner, and Add to Shopping all navigate to `/meals/{id}` — the single owner of those actions — rather than mutating from the card. The Companion Card surfaces the Next Step; the canonical page performs it. This honours the firewall (no editing, no bypassed navigation) and the platform's read-only conversation discipline (write intents are still rejected upstream, INT18/INT24).
- **Sanitisation is applied to all assistant text**, not only discovery turns. For legacy plain-text turns it is a no-op, so nothing regresses; for any turn where the model emits markdown or a URL, the conversation stays markdown-free and URL-free.
- **One framework, every domain.** `buildCompanionCardView` is domain-agnostic — meal discovery gets rich meal cards; Planner/Shopping/Pantry/Nutrition/Diary/Household flow through the same builder and the same layout (proven in §6). Future domains adopt the framework with no domain-specific conversation UI.
