/**
 * INT18 verification probe — captures the REAL system prompt the gateway hands
 * to the LLM, for every question in the 100-question benchmark corpus.
 *
 * Runs identically in two trees:
 *   - main tree  (Context Composition Engine)  → label "after"
 *   - git worktree at HEAD 8b01fff + BENCH4 resolver (legacy truncation) → label "before"
 *
 * Determinism controls, so the ONLY difference between the two dumps is the
 * CONTEXT DATA block and the format note:
 *   - a fresh InMemoryConversationStore per question  → history is always empty
 *   - a stub ILlmProvider returning a FIXED canned response → assistant turns identical
 *   - no DB writes to conversation tables
 * The intelligence platform still reads the real database, so Full Results are real.
 *
 * Usage: tsx server/tests/benchmark/context-composition-verification/probe.ts <label>
 */
import fs from "node:fs";
import { storage } from "../../../storage.js";
import { intelligencePlatform } from "../../../intelligence/intelligence-platform.js";
import { ConversationGateway } from "../../../intelligence/conversation/conversation-gateway.js";
import { InMemoryConversationStore } from "../../../intelligence/conversation/conversation-store.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../../../intelligence/conversation/llm-provider.js";

const LABEL = process.argv[2] ?? "after";
const CORPUS = JSON.parse(
  fs.readFileSync("server/tests/benchmark/fixtures/companion-benchmark-100.v1.json", "utf8"),
);

const CANNED = JSON.stringify({ text: "Recorded for prompt capture.", entityRefs: [] });

class RecordingProvider implements ILlmProvider {
  readonly modelName = "gpt-4o-mini";
  readonly isAvailable = true;
  public captured: { system: string; user: string }[] = [];
  async complete(request: LlmRequest): Promise<LlmResponse> {
    const system = request.messages.find(m => m.role === "system")?.content ?? "";
    const user = request.messages.filter(m => m.role === "user").map(m => m.content).join("\n");
    this.captured.push({ system, user });
    return { content: CANNED, model: this.modelName };
  }
}

async function main() {
  const user = await storage.getUser(1);
  if (!user) throw new Error("no user 1");
  const ctx = intelligencePlatform.contextFor(user);

  const out: Array<{
    id: string; utterance: string; llmReached: boolean;
    system: string | null; turnMs: number;
  }> = [];

  for (const q of CORPUS.questions as Array<{ id: string; utterance: string }>) {
    const provider = new RecordingProvider();
    // Fresh store per question → recentHistory is empty, identically in both trees.
    const gateway = new ConversationGateway(new InMemoryConversationStore(), provider);
    const t0 = process.hrtime.bigint();
    try {
      await gateway.processUserTurn(user.id, q.utterance, "floating", {}, ctx);
    } catch (e) {
      console.error(`  ! ${q.id} threw: ${(e as Error).message}`);
    }
    const turnMs = Number(process.hrtime.bigint() - t0) / 1e6;
    const cap = provider.captured[0] ?? null;
    out.push({
      id: q.id,
      utterance: q.utterance,
      llmReached: cap !== null,
      system: cap?.system ?? null,
      turnMs,
    });
    process.stdout.write(`${cap ? "." : "x"}`);
  }
  process.stdout.write("\n");

  const reached = out.filter(o => o.llmReached).length;
  fs.writeFileSync(`server/tests/benchmark/context-composition-verification/out/prompts-${LABEL}.json`, JSON.stringify(out, null, 1));
  console.log(`[${LABEL}] ${out.length} questions, ${reached} reached the LLM → server/tests/benchmark/context-composition-verification/out/prompts-${LABEL}.json`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
