import {
  DEFAULT_LUNA_MAX_COMPLETION_TOKENS,
  normalizeLlmProviderError,
} from "../intelligence/conversation/llm-provider.js";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

check("Luna completion budget allows reasoning plus visible response", DEFAULT_LUNA_MAX_COMPLETION_TOKENS === 1600);

const apiError = Object.assign(new Error("private request and response details"), {
  name: "RateLimitError",
  status: 429,
  code: "rate_limit_exceeded",
  type: "rate_limit_error",
  error: {
    code: "rate_limit_exceeded",
    type: "rate_limit_error",
    message: "private response details",
  },
});

const normalized = normalizeLlmProviderError(apiError, "gpt-6-luna") as Error & {
  status?: number;
  code?: string;
  type?: string;
  error?: { code?: string; type?: string };
};

check("retains provider error class", normalized.name === "RateLimitError");
check("retains HTTP status", normalized.status === 429);
check("retains provider code and type", normalized.code === "rate_limit_exceeded" && normalized.type === "rate_limit_error");
check("retains only safe nested error codes", normalized.error?.code === "rate_limit_exceeded" && normalized.error.type === "rate_limit_error");
check("adds model context", normalized.message.includes("gpt-6-luna"));
check("does not copy raw provider message", !normalized.message.includes("private request"));
check("does not copy nested provider message", !JSON.stringify(normalized).includes("private response"));

const emptyCompletion = normalizeLlmProviderError(Object.assign(
  new Error("private completion details"),
  { name: "ProviderResponseError", code: "empty_response", type: "completion", finish_reason: "content_filter", refusal: true },
), "gpt-6-luna") as Error & {
  code?: string;
  finish_reason?: string;
  refusal?: boolean;
};
check("retains empty-response classification", emptyCompletion.code === "empty_response");
check("retains safe completion finish reason", emptyCompletion.finish_reason === "content_filter");
check("records refusal presence without its text", emptyCompletion.refusal === true && !emptyCompletion.message.includes("private completion"));

const unknown = normalizeLlmProviderError("private payload", "gpt-4o-mini");
check("unknown failures get a safe generic message", unknown.message === "[gpt-4o-mini] Provider request failed");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
