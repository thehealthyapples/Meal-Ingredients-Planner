# THA Intelligence Platform (foundation)

**Status:** INT1 foundation — infrastructure only. No user-facing AI behaviour.
**Governing architecture:** [`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1) · [`docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../../docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) (TIP2)

This directory is the **single canonical home** for the THA Intelligence Platform — the one orchestration point all future intelligence (User / Admin / Developer / Voice assistants) will share. It is a thin **orchestration + governance layer over existing services**, never a new application and never a chatbot.

## What it is

| Module | Responsibility |
|---|---|
| `types.ts` | The canonical type contract (roles, verbs, capability/intent shapes, outcomes). Models no business logic. |
| `capability-registry.ts` | The **Capability Registry** — the closed allow-list of capabilities, each a descriptor of an *existing* owner. Seeded with C1–C13 from TIP2. |
| `permissions.ts` | The **permission model** — extends `server/lib/access.ts`; server-side role + knowledge-class gates; deterministic confirmation tiers. |
| `intent-engine.ts` | The **Intent Engine** — orchestration only: locate → validate → permission → confirm → invoke → respond. Holds zero business rules. |
| `intelligence-platform.ts` | The canonical **entry point** (`intelligencePlatform` singleton) composing the above. |
| `index.ts` | The single import surface. |

## What it must never own

Business logic · business data · planner / shopping / nutrition / profile logic · conversation / memory / history. The platform **routes to** the existing owners; they remain the source of truth (Principles 2 & 7).

## Architecture

```
            interpreted typed Intent + IntelligenceContext (server-resolved role)
                                   │
                    ┌──────────────▼───────────────┐
                    │     IntelligencePlatform      │  canonical entry point
                    │  (capability lookup · route)  │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │              IntentEngine                │  orchestration only
              │  LOCATE → VALIDATE → PERMISSION →        │
              │  CONFIRM → INVOKE → RESPOND              │
              └───┬───────────────┬──────────────┬───────┘
                  │ lookup        │ permission   │ invoke (future)
        ┌─────────▼──────┐ ┌──────▼───────┐ ┌────▼─────────────────┐
        │ CapabilityReg. │ │ Permissions  │ │ CapabilityHandler    │
        │ (C1..C13)      │ │ (access.ts)  │ │ (none bound in INT1) │
        └────────────────┘ └──────────────┘ └────┬─────────────────┘
                                                  │ delegates to (future)
                                   ┌──────────────▼───────────────┐
                                   │   EXISTING THA SERVICES       │
                                   │ (planner, shopping, meals …)  │
                                   │   — unchanged source of truth │
                                   └───────────────────────────────┘
```

## Foundation state (INT1)

- Every capability is **`registered`** (metadata), not **`available`** — no execution handler is bound.
- Invoking any intent therefore returns an honest **`not_executable`** outcome naming the owning service — never a fabricated result (Principle 6).
- Honest **gaps** (e.g. "order shopping") return `gap`, not an invented owner (TIP2 §2.4).
- The developer capability is **`never`** in this user-facing plane (TIP1 §7 physical isolation).

## Usage (internal only — no HTTP/UI surface)

```ts
import { intelligencePlatform } from "server/intelligence";

const ctx = intelligencePlatform.contextFor(req.user);          // resolve role via access.ts
const outcome = await intelligencePlatform.handle(              // route a typed intent
  { verb: "read", capabilityId: "planner" },
  ctx,
);
// INT1: outcome.status === "not_executable" (foundation — no handler bound)
```

## Extending (future workstreams — INT2+)

A future workstream makes a capability executable by binding **one** handler that delegates to the owning service — and holds no business logic itself:

```ts
intelligencePlatform.registerHandler("shopping", async (intent, ctx) => {
  // call the EXISTING shopping service here; never re-implement shopping logic
});
```

Adding a brand-new capability is `registry.register(...)` — no architectural change required.

## Tests

`npm run test:intelligence-platform` — verifies discovery, the pipeline, permission gates, confirmation tiers, honest gaps, and the foundation `not_executable` state.
