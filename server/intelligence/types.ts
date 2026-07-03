/**
 * THA Intelligence Platform — Core Type Contract
 * ==============================================
 * The canonical type vocabulary the Intelligence Platform, Capability Registry,
 * and Intent Engine all bind to.
 *
 * GOVERNANCE: This is INT1 foundation — infrastructure only. These types describe
 * how the platform *routes* to existing business services. They intentionally model
 * NO business logic, NO business data, and NO conversation/memory state. See
 *   docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md  (TIP1)
 *   docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md (TIP2)
 *
 * The vocabulary here is lifted directly from the governing architecture so that
 * the runtime registry is a faithful, typed projection of the canonical contract.
 */

// ---------------------------------------------------------------------------
// Roles & permission primitives
// ---------------------------------------------------------------------------

/**
 * Intelligence roles. Established as architecture from day one (INT1 "Permissions").
 * `user` and `admin` map 1:1 to the existing `users.role` enum via server/lib/access.ts.
 * `developer` and `service` are ADDITIVE future roles (TIP1 §6.3) — they require no
 * schema change to *model*; granting them at runtime is a future, governed workstream.
 * No role-specific behaviour is implemented in INT1; only the architecture is established.
 */
export type IntelligenceRole = "user" | "admin" | "developer" | "service";

/**
 * Knowledge classification (TIP1 §3, §6). A property of a *source*, assigned at
 * indexing time and used to permission-filter retrieval BEFORE the model sees
 * anything. Foundation only in INT1 — no knowledge index is built here.
 */
export type KnowledgeClass = "public" | "admin" | "developer";

// ---------------------------------------------------------------------------
// Intent taxonomy (TIP2 §3.1) — the 20 canonical verbs
// ---------------------------------------------------------------------------

/**
 * The closed set of canonical intent verbs. An AI action is always exactly one
 * `(verb × capability)` pair resolving to exactly one existing service. A verb that
 * has no mapping to a real owner is an honest GAP, never an improvisation.
 */
export type IntentVerb =
  | "read"
  | "explain"
  | "search"
  | "recommend"
  | "suggest"
  | "generate"
  | "add"
  | "move"
  | "replace"
  | "delete"
  | "import"
  | "export"
  | "analyse"
  | "compare"
  | "optimise"
  | "share"
  | "order"
  | "review"
  | "report"
  | "approve";

// ---------------------------------------------------------------------------
// Capability classification & confirmation (TIP2 §4, §5.1)
// ---------------------------------------------------------------------------

/**
 * Server-side capability class. NOT an LLM judgement. Drives the confirmation tier.
 */
export type CapabilityClass =
  | "read-only"
  | "ai-assisted"
  | "write"
  | "destructive"
  | "long-running"
  | "human-confirmation-required"
  | "background"
  | "future";

/** Confirmation tier (TIP2 §5.1). */
export type ConfirmationTier = "none" | "light" | "required" | "strong";

/**
 * Future AI access posture (TIP2 §2 legend):
 *  R = read/answer only · R+A = read + AI-assisted advisory · W = write via confirmed
 *  intent · W! = write incl. destructive · future = desired but no owner (GAP) ·
 *  never = must never reach the user-facing plane.
 */
export type AiAccessPosture = "R" | "R+A" | "W" | "W!" | "future" | "never";

/**
 * Availability of a capability *to the Intelligence Platform*.
 *  - "registered": metadata exists and the owning service exists, but no execution
 *    handler is wired to the platform yet (the INT1 state for every capability).
 *  - "available": an execution handler is bound and the platform may invoke it.
 *  - "gap": desired capability with no owning service endpoint today (honest GAP).
 *  - "never": must never be exposed to the user-facing plane.
 */
export type CapabilityAvailability = "registered" | "available" | "gap" | "never";

// ---------------------------------------------------------------------------
// Capability Guidance (INT39 — extends the Capability Registry, never the
// Companion) — how a user should naturally continue after a SUCCESSFUL
// interaction with this capability, declared by the capability itself.
// ---------------------------------------------------------------------------

/**
 * One guidance action: a pointer at another (or the same) registered
 * capability + verb, with a human-readable label. This IS the executability
 * gate — resolving a suggestion always re-checks `(capabilityId, verb)`
 * against the live registry (CapabilityRegistry.isExecutable), so a
 * suggestion can never point at an unregistered or not-yet-executable
 * capability (TIP1 Principle 6 — honest gaps).
 */
export interface GuidanceAction {
  readonly capabilityId: string;
  readonly verb: IntentVerb;
  readonly label: string;
}

/**
 * A deterministic, honest definition of "done" for this capability's goal.
 * `satisfiedByAction` names the guidance action whose click-through is the
 * observable signal that the user actually continued the journey this
 * capability pointed them towards — the same click-through proxy pattern
 * INT38 already uses for task completion, applied per-capability instead of
 * per-domain. No new business-data ownership is introduced: completion is
 * never inferred from a write to another capability's own tables.
 */
export interface CompletionCriterion {
  readonly id: string;
  readonly description: string;
  readonly satisfiedByAction: GuidanceAction;
}

/**
 * Structured "where to next" guidance owned by a single capability. Optional
 * on every capability — absence means the capability has nothing to suggest,
 * never a fabricated default. The Companion consumes this via the registry;
 * it must never hold an equivalent table of its own (INT39 architecture rule
 * — guidance belongs to capabilities, not the Companion).
 */
export interface CapabilityGuidance {
  /** The single most natural next step after a successful interaction. */
  readonly primaryAction?: GuidanceAction;
  /** Lateral alternatives to the primary action — same "level", different capability. */
  readonly relatedActions?: readonly GuidanceAction[];
  /** Deeper next steps that make sense once the primary/related action is taken. */
  readonly followUpActions?: readonly GuidanceAction[];
  /** A named, ordered multi-step path across capabilities (e.g. Nutrition → Meal → Plan → Shop). */
  readonly recommendedJourneys?: readonly GuidanceAction[];
  /** What "goal completed" honestly means for this capability's own journey. */
  readonly completionCriteria?: readonly CompletionCriterion[];
}

// ---------------------------------------------------------------------------
// Capability Enrichment (INT41 — extends the Capability Registry, never the
// Companion) — contextual insights, explanations, recommendations and
// educational content a capability offers ALONGSIDE its primary response,
// as distinct from CapabilityGuidance's "where to next" navigation above.
// ---------------------------------------------------------------------------

/** The kind of enrichment content a capability may declare. */
export type EnrichmentKind = "insight" | "explanation" | "recommendation" | "educational";

/**
 * One piece of enrichment content, owned by the capability that declares it.
 * Static, deterministic prose the capability author writes once — never a
 * live computation, never personalised, never fabricated per-turn (Core
 * Principle 6). `appliesToVerbs` scopes an item to the verbs it is relevant
 * for; omitted means it applies whenever the capability produced grounding
 * data, regardless of verb.
 */
export interface CapabilityEnrichmentItem {
  readonly kind: EnrichmentKind;
  readonly title: string;
  readonly body: string;
  readonly appliesToVerbs?: readonly IntentVerb[];
}

/**
 * Structured enrichment owned by a single capability. Optional on every
 * capability — absence means the capability has nothing to add, never a
 * fabricated default. Consumed by the Companion (and any future Intelligence
 * surface) via the registry; no consumer may hold an equivalent table of its
 * own (mirrors the INT39 Capability Guidance Registry discipline — content
 * belongs to capabilities, not to any one presentation surface).
 */
export interface CapabilityEnrichment {
  readonly items: readonly CapabilityEnrichmentItem[];
}

// ---------------------------------------------------------------------------
// Capability metadata (the Capability Registry record)
// ---------------------------------------------------------------------------

/**
 * Required-permission descriptor for a capability. Permission is enforced
 * server-side by the platform against the existing access.ts primitives — never by
 * prompt wording (TIP1 §6.2 boundary 3).
 */
export interface CapabilityPermissions {
  /** Lowest role permitted to invoke this capability at all. */
  readonly minimumRole: IntelligenceRole;
  /** Knowledge class this capability reads/answers from (read-only knowledge gating). */
  readonly knowledgeClass: KnowledgeClass;
  /** Whether the caller must own the target rows (delegated to the owning service). */
  readonly ownershipScoped: boolean;
  /** Whether privileged invocations must be written to admin_audit_log. */
  readonly audited: boolean;
}

/**
 * A registered capability — a coherent domain of action THA already exposes through
 * an existing service + API. The registry record is a *descriptor of an existing
 * owner*; it never re-declares or re-owns anything (TIP2 §2).
 */
export interface Capability {
  /** Unique, stable identifier (e.g. "planner"). */
  readonly id: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** What the capability does, in one line. */
  readonly description: string;
  /** The single canonical owner from the SoT Register (table / module). */
  readonly owner: string;
  /** The existing service module(s) that own the business logic. */
  readonly owningService: string;
  /** The real existing API surface (route prefix) — descriptive, not invoked here. */
  readonly apiSurface: string;
  /** Verbs the platform may express against this capability (closed allow-list, architecture-declared). */
  readonly supportedIntents: readonly IntentVerb[];
  /**
   * Verbs this capability can actually execute right now via a bound handler.
   * Empty until a handler is bound. Automatically updated by CapabilityRegistry.bindHandler().
   * Always a subset of supportedIntents.
   *
   * Discovery surfaces MUST use executableIntents (not supportedIntents) to determine
   * what the platform can currently do. A verb in supportedIntents but absent from
   * executableIntents has a declared architectural endpoint but no live handler — it is
   * registered, not executable. Advertising it as executable would be over-advertising
   * functionality (INT6A).
   */
  readonly executableIntents: readonly IntentVerb[];
  /** Permission requirements, enforced server-side. */
  readonly permissions: CapabilityPermissions;
  /** Server-side class driving confirmation. */
  readonly capabilityClass: CapabilityClass;
  /** Future AI access posture. */
  readonly aiAccess: AiAccessPosture;
  /** Availability to the platform. */
  readonly availability: CapabilityAvailability;
  /** INT39 — structured, capability-owned "where to next" guidance. Optional. */
  readonly guidance?: CapabilityGuidance;
  /** INT41 — structured, capability-owned contextual enrichment. Optional. */
  readonly enrichment?: CapabilityEnrichment;
}

// ---------------------------------------------------------------------------
// Intent (the transient, typed request object — NOT a stored entity)
// ---------------------------------------------------------------------------

/**
 * A typed, interpreted intent handed to the platform. The platform does NOT do
 * natural-language parsing in INT1 — it receives an already-interpreted typed intent
 * (the "PARSE" stage is a future workstream / external interpreter). The intent is a
 * transient request object, never persisted (TIP1 Principle 1, "Conversation" = out of scope).
 */
export interface Intent {
  /** The canonical verb. */
  readonly verb: IntentVerb;
  /** The target capability id. */
  readonly capabilityId: string;
  /** Opaque, typed-by-the-future-handler parameters. The platform does not interpret these. */
  readonly parameters?: Readonly<Record<string, unknown>>;
}

/**
 * The execution context: who is asking, resolved from the existing session/access.ts.
 * The platform trusts the *server-resolved* role, never anything the LLM produced.
 */
export interface IntelligenceContext {
  readonly role: IntelligenceRole;
  /** Authenticated user id, when acting on behalf of a user. */
  readonly userId?: string;
  /** Whether the caller has premium access (from hasPremiumAccess()). */
  readonly premium?: boolean;
}

// ---------------------------------------------------------------------------
// Execution outcome
// ---------------------------------------------------------------------------

export type IntentOutcomeStatus =
  /** Capability id not in the registry. */
  | "unknown_capability"
  /** Capability exists but does not support the requested verb (closed allow-list / honest GAP). */
  | "unsupported_intent"
  /** Caller's role/permission is insufficient (server-side denial). */
  | "denied"
  /** Capability is a GAP — desired but no owning service endpoint exists today. */
  | "gap"
  /** Capability requires human confirmation before invoke; engine returns the plan to confirm. */
  | "confirmation_required"
  /** No execution handler is bound (the INT1 foundation state). Honest gap, not a fabricated result. */
  | "not_executable"
  /** A bound handler executed and returned a result. */
  | "ok";

/**
 * The result of routing/executing an intent. Always structured and honest — the
 * platform never fabricates a success (TIP1 Principle 6, Risk R2).
 */
export interface IntentOutcome {
  readonly status: IntentOutcomeStatus;
  /** The resolved capability, when one was found. */
  readonly capabilityId?: string;
  readonly verb?: IntentVerb;
  /** Confirmation tier that applied (for confirmation_required / executed writes). */
  readonly confirmation?: ConfirmationTier;
  /** Human-readable, honest explanation of the outcome. */
  readonly message: string;
  /** Handler result payload, only present when status === "ok". */
  readonly result?: unknown;
}

// ---------------------------------------------------------------------------
// Execution handler (the future binding point — none bound in INT1)
// ---------------------------------------------------------------------------

/**
 * The contract a future workstream implements to make a capability executable. The
 * handler is the ONLY place that calls an existing business service. The platform
 * provides routing/permission/confirmation; the handler provides the single service
 * call. INT1 binds zero handlers — capabilities remain "registered" (honest gap on invoke).
 *
 * A handler MUST delegate all business validity and mutation to the owning service.
 * It must never re-implement planner/shopping/nutrition logic (TIP1 §5, Risk R4/R6).
 */
export type CapabilityHandler = (
  intent: Intent,
  context: IntelligenceContext,
) => Promise<unknown>;

// ---------------------------------------------------------------------------
// Honest execution failure (INT2) — a bound handler reporting an honest outcome
// ---------------------------------------------------------------------------

/**
 * The honest, non-"ok" statuses a *bound* handler may surface at invoke time. The
 * INT1 engine could only distinguish failures it detected itself (unknown capability,
 * unsupported verb, permission). INT2 lets the owning-service binding report a runtime
 * outcome that is still honest and structured — never a fabricated success (Principle 6,
 * Risk R2). The engine maps this onto the existing IntentOutcomeStatus vocabulary.
 *
 *  - "gap":               the request is well-formed but the planner owns no answer for it
 *                         (e.g. "today" has no calendar mapping; a verb the read-only
 *                         binding does not execute). An HONEST GAP, not an error.
 *  - "denied":            ownership-scoped authorization failed at invoke time
 *                         (e.g. the target row is not in the caller's household). The
 *                         platform delegates ownership checks to the owning service.
 *  - "unsupported_intent": the handler cannot express this request shape at all.
 */
export type ExecutionFailureStatus = "gap" | "denied" | "unsupported_intent";

/**
 * Thrown by a bound CapabilityHandler to report an honest, structured non-success
 * outcome. The Intent Engine catches this and returns the corresponding IntentOutcome
 * — so the platform stays honest end-to-end and never reports "ok" for a non-result.
 *
 * It carries NO business data and encodes NO business rule; it is purely the honest
 * shape of a delegated outcome the owning service produced.
 */
export class CapabilityExecutionError extends Error {
  constructor(
    readonly failureStatus: ExecutionFailureStatus,
    message: string,
    readonly verb?: IntentVerb,
  ) {
    super(message);
    this.name = "CapabilityExecutionError";
  }
}
