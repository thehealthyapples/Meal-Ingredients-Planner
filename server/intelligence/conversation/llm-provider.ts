// INT18 Phase 2 — Provider-neutral LLM interface.
//
// The ConversationGateway depends on THIS interface, never on OpenAI directly.
// Swap the provider at construction time — tests, staging, and alternative
// models all become one-line changes with no gateway logic touched.
//
// Public API:
//   ILlmProvider       — the interface every provider must satisfy
//   LlmMessage         — one message in a chat conversation
//   LlmRequest         — full request to the provider
//   LlmResponse        — what the provider returns
//   OpenAIProvider     — gpt-4o-mini, the default production provider
//   NoOpProvider       — returns a canned message; used when no key is set
//   createDefaultLlmProvider() — picks the right provider from env

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmRequest {
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  /** When true, the provider MUST return valid JSON. */
  jsonMode?: boolean;
  /**
   * COMP_TIER1 — override the provider's default model for this one call.
   * Omit for the provider's normal model (`gpt-4o-mini`). The gateway uses
   * this to route a turn needing real cross-referencing (multiple shopping/
   * pantry/meal/household records, not a single scalar fact) to a stronger
   * model — see conversation-gateway.ts's `selectCompanionModel`. Ignored by
   * providers that have only one model (e.g. NoOpProvider).
   */
  model?: string;
}

export interface LlmResponse {
  /** Raw text (or JSON string) returned by the model. */
  content: string;
  /** The model identifier actually used (e.g. "gpt-4o-mini"). */
  model: string;
}

export interface ILlmProvider {
  /** Send a chat request and return the model's response. */
  complete(request: LlmRequest): Promise<LlmResponse>;
  /** Canonical model identifier for logging/auditing. */
  readonly modelName: string;
  /** False if the provider is misconfigured (no API key, etc.). */
  readonly isAvailable: boolean;
}

/**
 * 2026-11-26 — Luna (and the other gpt-5.6/6.x "modern params" models) spend some
 * of their completion budget on hidden reasoning tokens before any visible content
 * is produced. The previous default (400, shared with the legacy gpt-4o-mini
 * branch, which has no reasoning overhead) could be exhausted by reasoning alone,
 * truncating the visible response to nothing. This is the real default for the
 * modern-params branch below; gpt-4o-mini keeps its own 400 default unchanged.
 */
export const DEFAULT_LUNA_MAX_COMPLETION_TOKENS = 1600;

/**
 * 2026-11-26 — every raw LLM SDK error carries the account's own request/response
 * text verbatim in `.message` (and often again in a nested `.error.message`) — safe
 * to log internally, never safe to let reach a user-visible surface uninspected.
 * Four call sites (`conversation-gateway.ts`, `matcher-suggester.ts`,
 * `companion-learning-recommender.ts`, `hybrid-intent-resolver.ts`) each independently
 * catch whatever `complete()` throws; normalizing it ONCE here — so `complete()` itself
 * only ever throws an already-safe error — means none of the four need to change.
 *
 * Preserves the classification fields every caller's catch block actually inspects
 * (`name`, `status`, `code`, `type`, `finish_reason`, `refusal`, and a trimmed nested
 * `error.{code,type}`) while stripping every field that could carry raw request/
 * response text (`message`, nested `error.message`). `refusal` is kept as the boolean
 * presence signal it is — never its text, which is exactly the kind of content this
 * function exists to keep off any surface that didn't ask for it.
 */
export function normalizeLlmProviderError(err: unknown, modelName: string): Error {
  if (!(err instanceof Error)) {
    return new Error(`[${modelName}] Provider request failed`);
  }

  const raw = err as Error & {
    status?: unknown;
    code?: unknown;
    type?: unknown;
    finish_reason?: unknown;
    refusal?: unknown;
    error?: { code?: unknown; type?: unknown };
  };

  const normalized: Error & {
    status?: unknown;
    code?: unknown;
    type?: unknown;
    finish_reason?: unknown;
    refusal?: unknown;
    error?: Record<string, unknown>;
  } = new Error(`[${modelName}] Provider request failed (${err.name})`);
  normalized.name = err.name;

  if (raw.status !== undefined) normalized.status = raw.status;
  if (raw.code !== undefined) normalized.code = raw.code;
  if (raw.type !== undefined) normalized.type = raw.type;
  if (raw.finish_reason !== undefined) normalized.finish_reason = raw.finish_reason;
  if (raw.refusal !== undefined) normalized.refusal = raw.refusal;
  if (raw.error && typeof raw.error === "object") {
    const nested: Record<string, unknown> = {};
    if (raw.error.code !== undefined) nested.code = raw.error.code;
    if (raw.error.type !== undefined) nested.type = raw.error.type;
    normalized.error = nested;
  }

  return normalized;
}

// ---------------------------------------------------------------------------
// OpenAIProvider — gpt-4o-mini (default production provider)
// ---------------------------------------------------------------------------

export class OpenAIProvider implements ILlmProvider {
  readonly modelName = "gpt-6-luna";

  get isAvailable(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    // Lazy import mirrors the pattern used elsewhere in the codebase.
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const model = request.model ?? this.modelName;
    // JUDGE_LIVE6 (2026-11-20) — live-caught in the benchmark judge that
    // `gpt-6.1-terra` shares BOTH of Luna's API quirks (rejects `max_tokens`,
    // requires `temperature: 1`), not just Luna specifically. The only model in
    // this codebase that does NOT need them is the legacy `gpt-4o-mini`; every
    // other model currently selectable (COMPANION_COMPLEX_MODEL in
    // conversation-gateway.ts, SIMPLE/COMPLEX_JUDGE_MODEL in judge.ts) is from
    // the newer gpt-5.6/6.x generation and needs the modern params. Revisit this
    // condition if a new legacy-style model is ever added.
    const needsModernParams = model !== "gpt-4o-mini";
    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        messages: request.messages,
        ...(needsModernParams
          ? { temperature: 1 }
          : { temperature: request.temperature ?? 0.3 }),
        ...(needsModernParams
          ? { max_completion_tokens: request.maxTokens ?? DEFAULT_LUNA_MAX_COMPLETION_TOKENS }
          : { max_tokens: request.maxTokens ?? 400 }),
        ...(request.jsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
      });
    } catch (err) {
      throw normalizeLlmProviderError(err, model);
    }

    return {
      content: completion.choices[0]?.message?.content?.trim() ?? "",
      model,
    };
  }
}

// ---------------------------------------------------------------------------
// NoOpProvider — graceful degradation when no provider is configured
// ---------------------------------------------------------------------------

const NO_OP_MESSAGE =
  "The AI assistant isn't available right now — it hasn't been configured yet.";

export class NoOpProvider implements ILlmProvider {
  readonly modelName = "noop";
  readonly isAvailable = false;

  async complete(_request: LlmRequest): Promise<LlmResponse> {
    // Return a JSON-shaped string so callers that parse JSON don't crash.
    return {
      content: JSON.stringify({ text: NO_OP_MESSAGE, entityRefs: [] }),
      model: this.modelName,
    };
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Returns an `OpenAIProvider` when `OPENAI_API_KEY` is set, otherwise a
 * `NoOpProvider` so the gateway degrades gracefully without throwing.
 */
export function createDefaultLlmProvider(): ILlmProvider {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }
  return new NoOpProvider();
}
