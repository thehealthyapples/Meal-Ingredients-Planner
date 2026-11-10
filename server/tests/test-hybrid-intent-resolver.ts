/** Priority 7b — bounded LLM fallback for genuine pattern misses. */
import { HybridIntentResolver } from "../intelligence/hybrid-intent-resolver.js";
import type { IIntentResolver, IntentResolutionHints, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import { buildClarificationContext } from "../intelligence/conversation/conversation-gateway.js";

const hints: IntentResolutionHints = { surface: "floating", temporalAnchor: "2026-11-09" };
const unknown: ResolvedIntent[] = [{
  capability: "profile", verb: "read", parameters: {}, confidence: 0.5, baseline: true,
  gap: { kind: "unknown" },
}];
const recognised: ResolvedIntent[] = [{ capability: "planner", verb: "read", parameters: {}, confidence: 0.9 }];

class PatternStub implements IIntentResolver {
  calls = 0;
  constructor(private readonly result: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> { this.calls++; return this.result; }
}

class ProviderStub implements ILlmProvider {
  readonly modelName = "stub";
  isAvailable = true;
  calls: LlmRequest[] = [];
  constructor(private readonly content: string) {}
  async complete(request: LlmRequest): Promise<LlmResponse> {
    this.calls.push(request);
    return { content: this.content, model: this.modelName };
  }
}

async function main(): Promise<void> {
  const hitPattern = new PatternStub(recognised);
  const unusedProvider = new ProviderStub('{"kind":"route","capability":"planner","verb":"read","summary":null}');
  const hit = await new HybridIntentResolver(unusedProvider, hitPattern).resolve("show planner", hints);
  assert(hit === recognised && unusedProvider.calls.length === 0, "pattern hit bypasses model");

  const missPattern = new PatternStub(unknown);
  const provider = new ProviderStub('{"kind":"route","capability":"planner","verb":"read","summary":null}');
  const routed = await new HybridIntentResolver(provider, missPattern).resolve("what is on my plan", hints);
  assert(provider.calls.length === 1, "genuine unknown miss calls provider once");
  assert(routed[0]?.capability === "planner" && routed[0]?.verb === "read", "executable registered route accepted");
  assert(!routed.some((intent) => intent.gap?.kind === "unknown"), "accepted model route clears unknown gap");
  assert(Object.keys(routed[0]?.parameters ?? {}).length === 0, "model cannot invent route parameters");

  const invalidProvider = new ProviderStub('{"kind":"route","capability":"made-up","verb":"read","summary":null}');
  const invalid = await new HybridIntentResolver(invalidProvider, new PatternStub(unknown)).resolve("unknown", hints);
  assert(invalid === unknown, "unregistered capability preserves original fallback");

  const clarificationProvider = new ProviderStub(
    '{"kind":"clarify","capability":"planner","verb":"read","summary":"chicken appears on your planner this week"}',
  );
  const clarification = await new HybridIntentResolver(clarificationProvider, new PatternStub(unknown))
    .resolve("planner chicken how many this week", hints);
  assert(clarification[0]?.gap?.kind === "needs-clarification", "plausible ambiguous route asks a clarification");
  assert(
    clarification[0]?.gap?.clarificationPrompt === "Are you asking whether chicken appears on your planner this week?",
    "clarification is phrased as a confirmation question",
  );
  assert(clarification.length === 1, "clarification prevents surface-only capability reads");

  const candidateQuestion = "Are you asking whether chicken appears on your planner this week?";
  const exchange = {
    assistantPrompt: candidateQuestion,
    turns: [
      { role: "user" as const, utterance: "planner chicken how many this week" },
      { role: "assistant" as const, utterance: candidateQuestion },
    ],
  };
  const rejectionProvider = new ProviderStub('{"kind":"unknown","capability":null,"verb":null,"summary":null}');
  const rejected = await new HybridIntentResolver(rejectionProvider, new PatternStub(unknown))
    .resolve("No", { ...hints, clarificationContext: exchange });
  assert(
    rejected[0]?.gap?.clarificationPrompt === "No problem — what did you mean?",
    "a bare no invites the user to explain in their own words",
  );
  assert(rejectionProvider.calls.length === 0, "bare rejection does not spend another model call");

  const correctionProvider = new ProviderStub('{"kind":"route","capability":"planner","verb":"read","summary":null}');
  const correctionContext = {
    assistantPrompt: "No problem — what did you mean?",
    turns: [
      ...exchange.turns,
      { role: "user" as const, utterance: "No" },
      { role: "assistant" as const, utterance: "No problem — what did you mean?" },
    ],
  };
  const corrected = await new HybridIntentResolver(correctionProvider, new PatternStub(unknown))
    .resolve("I meant chicken ingredients across this week's plan", { ...hints, clarificationContext: correctionContext });
  assert(corrected[0]?.capability === "planner", "corrected reply resolves against the executable route");
  assert(
    correctionProvider.calls[0]?.messages[1]?.content.includes("planner chicken how many this week"),
    "correction call receives the bounded preceding conversation exchange",
  );

  const extracted = buildClarificationContext([
    { role: "user", utterance: "earlier question", fallbackState: null },
    { role: "assistant", utterance: candidateQuestion, fallbackState: "no-route" },
  ]);
  assert(extracted?.assistantPrompt === candidateQuestion, "Gateway selects the preceding resolver clarification");
  assert(
    buildClarificationContext([{ role: "assistant", utterance: "What meals do I have?", fallbackState: null }]) === undefined,
    "ordinary assistant questions are not added to resolver context",
  );

  const malformedProvider = new ProviderStub("not json");
  const malformed = await new HybridIntentResolver(malformedProvider, new PatternStub(unknown)).resolve("unknown", hints);
  assert(malformed === unknown, "malformed output preserves original fallback");

  const offlineProvider = new ProviderStub('{}');
  offlineProvider.isAvailable = false;
  const offline = await new HybridIntentResolver(offlineProvider, new PatternStub(unknown)).resolve("unknown", hints);
  assert(offline === unknown && offlineProvider.calls.length === 0, "unavailable provider preserves original fallback");

  console.log("Hybrid intent resolver checks passed.");
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`✓ ${message}`);
}

void main();
