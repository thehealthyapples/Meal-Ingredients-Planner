/**
 * INT18 — exact prompt_tokens for the 69 LLM-reaching prompts, before vs after.
 * Method: submit the captured (system,user) messages to gpt-4o-mini with
 * max_tokens:1 and read usage.prompt_tokens. Nothing estimated.
 */
import fs from "node:fs";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
type Row = { id: string; utterance: string; llmReached: boolean; system: string | null };

const after: Row[] = JSON.parse(fs.readFileSync("server/tests/benchmark/context-composition-verification/out/prompts-after.json", "utf8"));
const before: Row[] = JSON.parse(fs.readFileSync("server/tests/benchmark/context-composition-verification/out/prompts-before.json", "utf8"));
const B = new Map(before.map(r => [r.id, r]));

async function promptTokens(system: string, user: string): Promise<number> {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await client.chat.completions.create({
        model: "gpt-4o-mini", max_tokens: 1, temperature: 0,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      });
      return r.usage!.prompt_tokens;
    } catch (e) {
      if (attempt >= 4) throw e;
      await new Promise(res => setTimeout(res, 800 * (attempt + 1)));
    }
  }
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); process.stdout.write("."); }
  }));
  process.stdout.write("\n");
  return out;
}

async function main() {
  const pairs = after.filter(a => a.llmReached && a.system && B.get(a.id)?.llmReached)
    .map(a => ({ id: a.id, utterance: a.utterance, sysA: a.system!, sysB: B.get(a.id)!.system! }));
  console.log(`measuring ${pairs.length} question pairs (${pairs.length * 2} calls)…`);

  const res = await pool(pairs, 6, async p => ({
    id: p.id,
    before: await promptTokens(p.sysB, p.utterance),
    after: await promptTokens(p.sysA, p.utterance),
  }));

  const tb = res.reduce((n, r) => n + r.before, 0);
  const ta = res.reduce((n, r) => n + r.after, 0);
  const worse = res.filter(r => r.after > r.before);
  const same = res.filter(r => r.after === r.before);

  console.log(`\n=== EXACT PROMPT TOKENS (gpt-4o-mini, usage.prompt_tokens) ===`);
  console.log(`  questions            ${res.length}`);
  console.log(`  BEFORE (legacy)      ${tb.toLocaleString()}`);
  console.log(`  AFTER  (engine)      ${ta.toLocaleString()}`);
  console.log(`  DELTA                ${(ta - tb).toLocaleString()} (${((ta - tb) / tb * 100).toFixed(1)}%)`);
  console.log(`  mean per question    ${(tb / res.length).toFixed(0)} → ${(ta / res.length).toFixed(0)}`);
  console.log(`  questions costing MORE tokens: ${worse.length}   unchanged: ${same.length}`);
  if (worse.length) console.log(`  worse: ${worse.map(w => `${w.id} (+${w.after - w.before})`).join(", ")}`);

  fs.writeFileSync("server/tests/benchmark/context-composition-verification/out/tokens.json", JSON.stringify({ tb, ta, n: res.length, worse: worse.length, res }, null, 1));
  console.log(`\n→ server/tests/benchmark/context-composition-verification/out/tokens.json`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
