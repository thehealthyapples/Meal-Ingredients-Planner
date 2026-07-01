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

// ---------------------------------------------------------------------------
// OpenAIProvider — gpt-4o-mini (default production provider)
// ---------------------------------------------------------------------------

export class OpenAIProvider implements ILlmProvider {
  readonly modelName = "gpt-4o-mini";

  get isAvailable(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    // Lazy import mirrors the pattern used elsewhere in the codebase.
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: this.modelName,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 400,
      ...(request.jsonMode
        ? { response_format: { type: "json_object" as const } }
        : {}),
    });

    return {
      content: completion.choices[0]?.message?.content?.trim() ?? "",
      model: this.modelName,
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
