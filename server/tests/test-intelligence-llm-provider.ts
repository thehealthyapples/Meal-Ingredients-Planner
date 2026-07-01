/**
 * test-intelligence-llm-provider.ts — INT18 Phase 2
 * ===================================================
 * Unit tests for the provider-neutral LLM interface.
 *
 * These tests run without any DB or real OpenAI key:
 *   npx tsx server/tests/test-intelligence-llm-provider.ts
 */

import {
  OpenAIProvider,
  NoOpProvider,
  createDefaultLlmProvider,
  type ILlmProvider,
  type LlmRequest,
} from "../intelligence/conversation/llm-provider.js";

// ---------------------------------------------------------------------------
// Tiny test harness (mirrors Phase 0 / Phase 1 pattern)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// ILlmProvider interface compliance checker
// ---------------------------------------------------------------------------

function assertProviderCompliance(provider: ILlmProvider, label: string): void {
  assert(typeof provider.modelName === "string" && provider.modelName.length > 0,
    `${label}: modelName is a non-empty string`);
  assert(typeof provider.isAvailable === "boolean",
    `${label}: isAvailable is a boolean`);
  assert(typeof provider.complete === "function",
    `${label}: complete is a function`);
}

// ---------------------------------------------------------------------------
// NoOpProvider tests
// ---------------------------------------------------------------------------

async function testNoOpProvider(): Promise<void> {
  section("NoOpProvider");

  const provider = new NoOpProvider();

  assertProviderCompliance(provider, "NoOpProvider");

  assert(provider.modelName === "noop",
    "modelName is 'noop'");

  assert(provider.isAvailable === false,
    "isAvailable is false");

  const req: LlmRequest = {
    messages: [{ role: "user", content: "Hello" }],
  };
  const response = await provider.complete(req);

  assert(typeof response.content === "string" && response.content.length > 0,
    "complete() returns non-empty content");

  assert(response.model === "noop",
    "complete() returns model 'noop'");

  // The content must be parseable JSON (the gateway expects JSON from the LLM)
  let parsed: unknown;
  try {
    parsed = JSON.parse(response.content);
  } catch {
    parsed = null;
  }
  assert(parsed !== null, "NoOpProvider response is valid JSON");
  assert(
    typeof (parsed as { text?: string }).text === "string",
    "NoOpProvider JSON response has a 'text' field",
  );

  // Canned message does not expose any hallucinated data
  assert(
    response.content.includes("available") || response.content.includes("configured"),
    "NoOpProvider message mentions availability/configuration",
  );

  // Multiple calls are idempotent
  const r2 = await provider.complete(req);
  assert(r2.content === response.content,
    "NoOpProvider returns the same content on every call");

  // Works with jsonMode: true (no extra fields break it)
  const jsonReq: LlmRequest = {
    messages: [{ role: "user", content: "Test" }],
    jsonMode: true,
  };
  const jsonResponse = await provider.complete(jsonReq);
  assert(typeof jsonResponse.content === "string",
    "NoOpProvider works with jsonMode:true");

  // Works with empty messages array
  const emptyReq: LlmRequest = { messages: [] };
  const emptyResponse = await provider.complete(emptyReq);
  assert(typeof emptyResponse.content === "string",
    "NoOpProvider handles empty messages array");

  // Works with system + user messages
  const multiMsg: LlmRequest = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What time is it?" },
    ],
  };
  const multiResponse = await provider.complete(multiMsg);
  assert(typeof multiResponse.content === "string",
    "NoOpProvider handles multi-message requests");
}

// ---------------------------------------------------------------------------
// OpenAIProvider interface tests (no actual API call)
// ---------------------------------------------------------------------------

async function testOpenAIProviderInterface(): Promise<void> {
  section("OpenAIProvider (interface, no API call)");

  const provider = new OpenAIProvider();

  assertProviderCompliance(provider, "OpenAIProvider");

  assert(provider.modelName === "gpt-4o-mini",
    "modelName is 'gpt-4o-mini'");

  assert(typeof provider.isAvailable === "boolean",
    "isAvailable reflects OPENAI_API_KEY presence");

  // isAvailable must be false when no key is set (test environment)
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const providerNoKey = new OpenAIProvider();
  assert(providerNoKey.isAvailable === false,
    "OpenAIProvider.isAvailable is false when OPENAI_API_KEY is unset");
  if (originalKey) {
    process.env.OPENAI_API_KEY = originalKey;
  }

  // isAvailable must be true when a key is set
  process.env.OPENAI_API_KEY = "sk-test-dummy-key";
  const providerWithKey = new OpenAIProvider();
  assert(providerWithKey.isAvailable === true,
    "OpenAIProvider.isAvailable is true when OPENAI_API_KEY is set");
  if (originalKey) {
    process.env.OPENAI_API_KEY = originalKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
}

// ---------------------------------------------------------------------------
// createDefaultLlmProvider factory tests
// ---------------------------------------------------------------------------

async function testFactory(): Promise<void> {
  section("createDefaultLlmProvider()");

  const originalKey = process.env.OPENAI_API_KEY;

  // Without key → NoOpProvider
  delete process.env.OPENAI_API_KEY;
  const noKeyProvider = createDefaultLlmProvider();
  assert(noKeyProvider instanceof NoOpProvider,
    "Returns NoOpProvider when OPENAI_API_KEY is not set");
  assert(!noKeyProvider.isAvailable,
    "Factory provider is unavailable when key is missing");

  // With key → OpenAIProvider
  process.env.OPENAI_API_KEY = "sk-test-dummy-key";
  const withKeyProvider = createDefaultLlmProvider();
  assert(withKeyProvider instanceof OpenAIProvider,
    "Returns OpenAIProvider when OPENAI_API_KEY is set");
  assert(withKeyProvider.isAvailable,
    "Factory provider is available when key is present");

  // Restore
  if (originalKey) {
    process.env.OPENAI_API_KEY = originalKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }

  // Both are ILlmProvider-compliant
  assertProviderCompliance(noKeyProvider, "factory-noop");
  assertProviderCompliance(withKeyProvider, "factory-openai");
}

// ---------------------------------------------------------------------------
// Stub provider — verifies the interface can be satisfied by test doubles
// ---------------------------------------------------------------------------

async function testStubProvider(): Promise<void> {
  section("Custom stub ILlmProvider (test-double pattern)");

  class StubProvider implements ILlmProvider {
    readonly modelName = "stub";
    readonly isAvailable = true;
    calls: LlmRequest[] = [];

    async complete(req: LlmRequest): Promise<{ content: string; model: string }> {
      this.calls.push(req);
      return { content: JSON.stringify({ text: "Stub response", entityRefs: [] }), model: "stub" };
    }
  }

  const stub = new StubProvider();
  assertProviderCompliance(stub, "StubProvider");

  assert(stub.isAvailable === true, "Stub reports available");
  assert(stub.calls.length === 0, "No calls before invocation");

  const req: LlmRequest = {
    messages: [{ role: "user", content: "Hello" }],
    temperature: 0.5,
    jsonMode: true,
  };
  const res = await stub.complete(req);

  assert(stub.calls.length === 1, "Call recorded after complete()");
  assert(stub.calls[0].messages[0].content === "Hello",
    "Request passed through correctly");
  assert(stub.calls[0].jsonMode === true,
    "jsonMode flag passed through");
  assert(res.model === "stub", "Response carries model name");
  assert(JSON.parse(res.content).text === "Stub response",
    "Stub returns predictable JSON content");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("INT18 Phase 2 — LLM Provider Tests");
  console.log("====================================");

  await testNoOpProvider();
  await testOpenAIProviderInterface();
  await testFactory();
  await testStubProvider();

  console.log("\n────────────────────────────────────────");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
