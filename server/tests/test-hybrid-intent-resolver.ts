/** Priority 7b — bounded LLM fallback for genuine pattern misses. */
import { HybridIntentResolver } from "../intelligence/hybrid-intent-resolver.js";
import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
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
  const productionPatternResolver = new PatternIntentResolver();

  const hitPattern = new PatternStub(recognised);
  const unusedProvider = new ProviderStub('{"kind":"route","capability":"planner","verb":"read","summary":null}');
  const hit = await new HybridIntentResolver(unusedProvider, hitPattern).resolve("show planner", hints);
  assert(hit === recognised && unusedProvider.calls.length === 0, "pattern hit bypasses model");

  const weakUtterances = [
    "how many chicken meals on my planner",
    "how many meals are on my plan this week",
    "how much chicken do I have on the planner this week",
  ];
  for (const utterance of weakUtterances) {
    const patternResult = await productionPatternResolver.resolveWithProvenance(utterance, hints);
    assert(patternResult.matcherTier === "weak", `${utterance}: generic/keyword-only match is marked weak`);
    const weakProvider = new ProviderStub(
      '{"kind":"route","capability":"planner-discovery","verb":"search","summary":null}',
    );
    const weakRoute = await new HybridIntentResolver(weakProvider, productionPatternResolver).resolve(utterance, hints);
    assert(weakProvider.calls.length === 1, `${utterance}: weak-only turn reaches model fallback once`);
    assert(
      weakRoute[0]?.capability === "planner-discovery" && weakRoute[0]?.verb === "search",
      `${utterance}: executable planner discovery route is accepted`,
    );
    assert(
      Object.keys(weakRoute[0]?.parameters ?? {}).length === 0,
      `${utterance}: model-supplied parameters remain untrusted and are discarded`,
    );
  }

  const queryProvider = new ProviderStub(
    '{"kind":"route","capability":"planner-discovery","verb":"search","summary":null,"query":"chicken"}',
  );
  const queryRoute = await new HybridIntentResolver(queryProvider, productionPatternResolver)
    .resolve("how many chicken meals on my planner", hints);
  assert(
    queryRoute[0]?.capability === "planner-discovery" && queryRoute[0]?.verb === "search",
    "weak planner wording reaches planner-discovery search",
  );
  assert(queryRoute[0]?.parameters.query === "chicken", "verified utterance term is passed as the search query");

  const hallucinatedQueryProvider = new ProviderStub(
    '{"kind":"route","capability":"planner-discovery","verb":"search","summary":null,"query":"beef"}',
  );
  const hallucinatedQueryRoute = await new HybridIntentResolver(hallucinatedQueryProvider, productionPatternResolver)
    .resolve("how many chicken meals on my planner", hints);
  assert(
    hallucinatedQueryRoute[0]?.capability === "planner-discovery" &&
      hallucinatedQueryRoute[0]?.verb === "search" &&
      hallucinatedQueryRoute[0]?.parameters.query === undefined,
    "query absent from utterance is rejected and never accepted verbatim",
  );

  const nonSearchQueryProvider = new ProviderStub(
    '{"kind":"route","capability":"planner","verb":"read","summary":null,"query":"chicken"}',
  );
  const nonSearchQueryRoute = await new HybridIntentResolver(nonSearchQueryProvider, productionPatternResolver)
    .resolve("wibble flurble", hints);
  assert(
    nonSearchQueryRoute[0]?.capability === "planner" &&
      nonSearchQueryRoute[0]?.verb === "read" &&
      nonSearchQueryRoute[0]?.parameters.query === undefined,
    "capability/verb without a free-text query contract never receives a query field",
  );

  const strongUtterances = [
    "what's on my planner?",
    "is chicken planned for Saturday?",
    "what high-protein meals do I have planned?",
  ];
  for (const utterance of strongUtterances) {
    const patternResult = await productionPatternResolver.resolveWithProvenance(utterance, hints);
    assert(patternResult.matcherTier === "strong", `${utterance}: compound/specific match is marked strong`);
    const strongProvider = new ProviderStub(
      '{"kind":"route","capability":"planner-discovery","verb":"search","summary":null}',
    );
    await new HybridIntentResolver(strongProvider, productionPatternResolver).resolve(utterance, hints);
    assert(strongProvider.calls.length === 0, `${utterance}: compound/specific match does not spend a model call`);
  }

  const missPattern = new PatternStub(unknown);
  const provider = new ProviderStub('{"kind":"route","capability":"planner","verb":"read","summary":null}');
  const routed = await new HybridIntentResolver(provider, missPattern).resolve("what is on my plan", hints);
  assert(provider.calls.length === 1, "genuine unknown miss calls provider once");
  assert(routed[0]?.capability === "planner" && routed[0]?.verb === "read", "executable registered route accepted");
  assert(!routed.some((intent) => intent.gap?.kind === "unknown"), "accepted model route clears unknown gap");
  assert(Object.keys(routed[0]?.parameters ?? {}).length === 0, "model cannot invent route parameters");

  const unknownProvider = new ProviderStub('{"kind":"route","capability":"planner","verb":"read","summary":null}');
  const unknownRoute = await new HybridIntentResolver(unknownProvider, productionPatternResolver)
    .resolve("wibble flurble", hints);
  assert(unknownProvider.calls.length === 1, "original zero-match unknown path still calls provider once");
  assert(unknownRoute[0]?.capability === "planner", "original zero-match path still accepts a validated route");

  const invalidProvider = new ProviderStub('{"kind":"route","capability":"made-up","verb":"read","summary":null}');
  const invalid = await new HybridIntentResolver(invalidProvider, new PatternStub(unknown)).resolve("unknown", hints);
  assert(invalid === unknown, "unregistered capability preserves original fallback");

  const clarificationProvider = new ProviderStub(
    '{"kind":"clarify","capability":"planner","verb":"read","clarificationQuestion":"Do you mean the chicken needed by meals planned this week, or the amount already on your shopping list?"}',
  );
  const clarification = await new HybridIntentResolver(clarificationProvider, new PatternStub(unknown))
    .resolve("planner chicken how many this week", hints);
  assert(clarification[0]?.gap?.kind === "needs-clarification", "plausible ambiguous route asks a clarification");
  assert(
    clarification[0]?.gap?.clarificationPrompt === "Do you mean the chicken needed by meals planned this week, or the amount already on your shopping list?",
    "clarification distinguishes two meanings without confirming a paraphrase",
  );
  assert(clarification.length === 1, "clarification prevents surface-only capability reads");

  const candidateQuestion = "Do you mean the chicken needed by meals planned this week, or the amount already on your shopping list?";
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

  const oldStyleClarificationProvider = new ProviderStub(
    '{"kind":"clarify","capability":"planner","verb":"read","clarificationQuestion":"Are you asking whether amount of chicken is needed this week?"}',
  );
  const oldStyleClarification = await new HybridIntentResolver(oldStyleClarificationProvider, new PatternStub(unknown))
    .resolve("how much chicken is needed this week", hints);
  assert(
    oldStyleClarification[0]?.gap?.clarificationPrompt === undefined,
    "confirmation-style paraphrase is rejected instead of shown as a clarification",
  );

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
  const oldClarification = "Are you asking whether chicken appears on your planner this week?";
  const oldExtracted = buildClarificationContext([
    { role: "assistant", utterance: oldClarification, fallbackState: "no-route" },
  ]);
  assert(oldExtracted?.assistantPrompt === oldClarification, "Gateway keeps recognizing historical clarification wording");
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
