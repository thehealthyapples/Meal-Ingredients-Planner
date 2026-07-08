/**
 * INT18 — ground-truth verification of the Context Composition Engine.
 *
 * Injects a recording `handleIntent` into the REAL gateway, so the Full Results
 * captured are exactly the ones the gateway passed to composeContext. Then:
 *   - entity preservation: every id emitted must exist in the raw Full Result
 *   - provenance preservation: provenance values present in raw must survive
 *   - Full Result immutability: byte-compare JSON before/after composition
 *   - engine latency: composeContext timed on the real per-turn inputs
 *   - engine metrics: budgetExceeded, enrichment, duplicates
 */
import fs from "node:fs";
import { storage } from "../../../storage.js";
import { intelligencePlatform } from "../../../intelligence/intelligence-platform.js";
import { ConversationGateway } from "../../../intelligence/conversation/conversation-gateway.js";
import { InMemoryConversationStore } from "../../../intelligence/conversation/conversation-store.js";
import { patternIntentResolver } from "../../../intelligence/pattern-intent-resolver.js";
import {
  composeContext,
  CONTEXT_TOKEN_BUDGET,
  CAPABILITY_CONTEXT_BUDGET_CHARS,
} from "../../../intelligence/context/context-composition-engine.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../../../intelligence/conversation/llm-provider.js";

const CORPUS = JSON.parse(fs.readFileSync("server/tests/benchmark/fixtures/companion-benchmark-100.v1.json", "utf8"));
const CANNED = JSON.stringify({ text: "x", entityRefs: [] });

class Stub implements ILlmProvider {
  readonly modelName = "gpt-4o-mini"; readonly isAvailable = true;
  async complete(_r: LlmRequest): Promise<LlmResponse> { return { content: CANNED, model: this.modelName }; }
}

/** Every id-shaped value anywhere in a payload. Mirrors the engine's entity-ref keys. */
function collectIds(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) { for (const x of v) collectIds(x, out); return out; }
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const isId = k === "id" || k === "slug" || /^[a-zA-Z]+Id$/.test(k);
      if (isId && (typeof val === "number" || typeof val === "string")) {
        out.add((typeof val === "number" ? "n:" : "s:") + String(val));
      }
      collectIds(val, out);
    }
  }
  return out;
}
function collectProvenance(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) { for (const x of v) collectProvenance(x, out); return out; }
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if ((k === "owningDomain" || k === "source") && typeof val === "string") out.add(val);
      if (k === "sources" && Array.isArray(val)) for (const s of val) if (typeof s === "string") out.add(s);
      collectProvenance(val, out);
    }
  }
  return out;
}
function emittedIds(text: string): Set<string> {
  const s = new Set<string>();
  for (const m of text.matchAll(/"(?:id|[a-zA-Z]+Id)"\s*:\s*(\d+)/g)) s.add("n:" + m[1]);
  for (const m of text.matchAll(/"(?:id|[a-zA-Z]+Id|slug)"\s*:\s*"([^"]+)"/g)) s.add("s:" + m[1]);
  return s;
}

async function main() {
  const user = await storage.getUser(1);
  if (!user) throw new Error("no user 1");
  const ctx = intelligencePlatform.contextFor(user);

  let fakeIds = 0, totalEmittedIds = 0, mutated = 0;
  let provLost = 0, provTotalRaw = 0;
  let budgetExceededTurns = 0, dupRemoved = 0, enrTotal = 0, enrShown = 0;
  let hoists = 0;
  const composeMs: number[] = [];
  const perTurn: any[] = [];

  for (const q of CORPUS.questions as Array<{ id: string; utterance: string }>) {
    const captured: Array<{ capabilityId: string; verb: string; result: unknown; status: string }> = [];
    const recording = async (intent: any, c: any) => {
      const outcome = await intelligencePlatform.handle(intent, c);
      captured.push({ capabilityId: intent.capabilityId, verb: intent.verb, result: outcome.result, status: outcome.status });
      return outcome;
    };
    const gw = new ConversationGateway(new InMemoryConversationStore(), new Stub(), undefined, recording as any);
    try { await gw.processUserTurn(user.id, q.utterance, "floating", {}, ctx); } catch {}

    // Mirrors queryCapability(): status "ok" with a non-null result becomes "ok-data".
    const okData = captured.filter(c => c.status === "ok" && c.result != null);
    if (okData.length === 0) continue;

    // Resolver supplies confidence + baseline, exactly as the gateway reads them.
    const resolved = await patternIntentResolver.resolve(q.utterance, {});
    const meta = new Map(resolved.map((r: any) => [r.capability, r]));

    const caps = okData.map(c => ({
      capabilityId: c.capabilityId,
      verb: c.verb,
      result: c.result,
      confidence: typeof meta.get(c.capabilityId)?.confidence === "number" ? meta.get(c.capabilityId)!.confidence : 0,
      baseline: meta.get(c.capabilityId)?.baseline === true,
    }));

    const before = caps.map(c => JSON.stringify(c.result));

    const t0 = process.hrtime.bigint();
    const composed = composeContext({
      utterance: q.utterance,
      capabilities: caps,
      enrichment: [],
      tokenBudget: CONTEXT_TOKEN_BUDGET,
      perCapabilityCharCeiling: CAPABILITY_CONTEXT_BUDGET_CHARS,
    });
    composeMs.push(Number(process.hrtime.bigint() - t0) / 1e6);

    // Full Result immutability
    caps.forEach((c, i) => { if (JSON.stringify(c.result) !== before[i]) mutated++; });

    // Entity preservation — every emitted id must be a real id from the raw payload
    const raw = new Set<string>();
    for (const c of caps) collectIds(c.result, raw);
    const emitted = emittedIds(composed.text);
    totalEmittedIds += emitted.size;
    const fakes = [...emitted].filter(id => !raw.has(id));
    fakeIds += fakes.length;

    // Provenance — values present in raw that survive into the emitted text
    const rawProv = new Set<string>();
    for (const c of caps) collectProvenance(c.result, rawProv);
    provTotalRaw += rawProv.size;
    const lost = [...rawProv].filter(p => !composed.text.includes(p));
    provLost += lost.length;

    const m = composed.metrics;
    if (m.budgetExceeded) budgetExceededTurns++;
    dupRemoved += m.duplicatesRemoved; hoists += m.sharedFieldsHoisted;
    enrTotal += m.enrichmentTotal; enrShown += m.enrichmentShown;

    perTurn.push({ id: q.id, fakes, lostProv: lost, chars: m.chars, legacyChars: m.legacyChars,
      capsRepresented: m.capabilitiesRepresented, capsContributing: m.capabilitiesContributing,
      wellFormed: m.wellFormed, budgetExceeded: m.budgetExceeded });
  }

  if (composeMs.length === 0) { console.error("NO TURNS CAPTURED"); process.exit(1); }
  const sorted = [...composeMs].sort((a, b) => a - b);
  const mean = composeMs.reduce((a, b) => a + b, 0) / composeMs.length;
  const balanceViolations = perTurn.filter(t => t.capsRepresented !== t.capsContributing).length;
  const notWellFormed = perTurn.filter(t => !t.wellFormed).length;
  const legacyTotal = perTurn.reduce((n, t) => n + t.legacyChars, 0);
  const composedTotal = perTurn.reduce((n, t) => n + t.chars, 0);

  console.log(`\n=== INT18 engine ground truth (n=${perTurn.length} data-bearing turns) ===\n`);
  console.log(`ENTITY PRESERVATION`);
  console.log(`  emitted ids: ${totalEmittedIds}   FAKE OR CLIPPED: ${fakeIds}`);
  console.log(`\nPROVENANCE PRESERVATION`);
  console.log(`  provenance values in raw payloads: ${provTotalRaw}   lost in emission: ${provLost}`);
  console.log(`\nFULL RESULT IMMUTABILITY`);
  console.log(`  capabilities whose Full Result was mutated: ${mutated}`);
  console.log(`\nBALANCE / WELL-FORMEDNESS (engine's own metrics)`);
  console.log(`  turns where capabilitiesRepresented != capabilitiesContributing: ${balanceViolations}`);
  console.log(`  turns not well-formed: ${notWellFormed}`);
  console.log(`  turns where guaranteed core exceeded the token budget: ${budgetExceededTurns}/${perTurn.length}`);
  console.log(`\nCONTEXT REDUCTION (engine metrics, capability sections only)`);
  console.log(`  legacy chars ${legacyTotal.toLocaleString()} → composed ${composedTotal.toLocaleString()}  (${((composedTotal-legacyTotal)/legacyTotal*100).toFixed(1)}%)`);
  console.log(`  duplicate evidence items removed: ${dupRemoved}   field hoists: ${hoists}`);
  console.log(`\nENGINE LATENCY (composeContext only)`);
  console.log(`  mean ${mean.toFixed(2)} ms   median ${sorted[Math.floor(sorted.length/2)].toFixed(2)} ms   worst ${sorted[sorted.length-1].toFixed(2)} ms`);

  fs.writeFileSync("server/tests/benchmark/context-composition-verification/out/engine.json", JSON.stringify({ fakeIds, totalEmittedIds, provLost, provTotalRaw, mutated, balanceViolations, notWellFormed, budgetExceededTurns, legacyTotal, composedTotal, dupRemoved, hoists, meanMs: mean, perTurn }, null, 1));
  console.log(`\n→ server/tests/benchmark/context-composition-verification/out/engine.json`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
