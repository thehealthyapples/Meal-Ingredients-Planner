/**
 * INT18 — analysis of the two captured prompt dumps.
 * Deterministic measures only (no network). Token measurement is tokens.ts.
 */
import fs from "node:fs";

type Row = { id: string; utterance: string; llmReached: boolean; system: string | null; turnMs: number };

const after: Row[] = JSON.parse(fs.readFileSync("server/tests/benchmark/context-composition-verification/out/prompts-after.json", "utf8"));
const before: Row[] = JSON.parse(fs.readFileSync("server/tests/benchmark/context-composition-verification/out/prompts-before.json", "utf8"));

const MARK = "\nCONTEXT DATA:\n";
const END = "\n\nRESPONSE FORMAT";

function ctxBlock(sys: string): string {
  const i = sys.indexOf(MARK);
  if (i < 0) return "";
  const j = sys.indexOf(END, i);
  return sys.slice(i + MARK.length, j < 0 ? undefined : j);
}
function scaffold(sys: string): string {
  const i = sys.indexOf(MARK);
  return sys.slice(0, i);
}

/** Sections are "### capability\n<payload>" separated by a blank line. */
function sections(block: string): { cap: string; body: string }[] {
  if (!block.trim() || block.startsWith("(No specific data")) return [];
  const out: { cap: string; body: string }[] = [];
  const parts = block.split(/\n(?=### )/);
  for (const p of parts) {
    const m = /^### (.+?)\n([\s\S]*)$/.exec(p.trim());
    if (m) out.push({ cap: m[1].trim(), body: m[2] });
  }
  return out;
}

/** Entity references the model is permitted to cite. */
function ids(body: string): Set<string> {
  const s = new Set<string>();
  for (const m of body.matchAll(/"(?:id|[a-zA-Z]+Id)"\s*:\s*(\d+)/g)) s.add("n:" + m[1]);
  for (const m of body.matchAll(/"(?:id|[a-zA-Z]+Id|slug)"\s*:\s*"([^"]+)"/g)) s.add("s:" + m[1]);
  return s;
}

const PROV = /"(owningDomain|source|sources)"\s*:/g;

const byId = new Map(before.map(r => [r.id, r]));
let ctxCharsA = 0, ctxCharsB = 0;
let secA = 0, secB = 0, wfA = 0, wfB = 0;
let idsA = new Set<string>(), idsB = new Set<string>();
let provA = 0, provB = 0;
let capsA = new Set<string>(), capsB = new Set<string>();
let noteChars = 0, noteTurns = 0;
const perQ: any[] = [];

for (const a of after) {
  if (!a.llmReached || !a.system) continue;
  const b = byId.get(a.id);
  if (!b?.llmReached || !b.system) { console.log(`! ${a.id} reached LLM only in AFTER`); continue; }

  const ba = ctxBlock(a.system), bb = ctxBlock(b.system);
  ctxCharsA += ba.length; ctxCharsB += bb.length;

  // format-note cost = the scaffold delta (scaffolds are otherwise identical by construction)
  const sa = scaffold(a.system), sb = scaffold(b.system);
  if (sa.length !== sb.length) { noteChars += sa.length - sb.length; noteTurns++; }

  const sA = sections(ba), sB = sections(bb);
  secA += sA.length; secB += sB.length;
  for (const s of sA) { capsA.add(s.cap); try { JSON.parse(s.body); wfA++; } catch {} for (const i of ids(s.body)) idsA.add(i); provA += (s.body.match(PROV) ?? []).length; }
  for (const s of sB) { capsB.add(s.cap); try { JSON.parse(s.body); wfB++; } catch {} for (const i of ids(s.body)) idsB.add(i); provB += (s.body.match(PROV) ?? []).length; }

  perQ.push({ id: a.id, ctxA: ba.length, ctxB: bb.length, secA: sA.length, secB: sB.length });
}

const n = perQ.length;
const worse = perQ.filter(p => p.ctxA > p.ctxB);
const secLost = perQ.filter(p => p.secA < p.secB);

console.log(`\n=== INT18 deterministic verification (n=${n} LLM-reaching questions) ===\n`);
console.log(`CONTEXT REDUCTION`);
console.log(`  CONTEXT DATA chars  BEFORE ${ctxCharsB.toLocaleString()}   AFTER ${ctxCharsA.toLocaleString()}   Δ ${(ctxCharsA-ctxCharsB).toLocaleString()} (${((ctxCharsA-ctxCharsB)/ctxCharsB*100).toFixed(1)}%)`);
console.log(`  format-note chars added: ${noteChars.toLocaleString()} across ${noteTurns} turns`);
console.log(`  net context+note chars: ${(ctxCharsA+noteChars-ctxCharsB).toLocaleString()} (${((ctxCharsA+noteChars-ctxCharsB)/ctxCharsB*100).toFixed(1)}%)`);
console.log(`  questions whose context grew: ${worse.length}`);

console.log(`\nEVIDENCE / WELL-FORMEDNESS`);
console.log(`  sections   BEFORE ${secB}   AFTER ${secA}`);
console.log(`  parse as JSON  BEFORE ${wfB}/${secB}   AFTER ${wfA}/${secA}`);
console.log(`  distinct capabilities represented  BEFORE ${capsB.size}   AFTER ${capsA.size}`);
console.log(`  questions losing a section: ${secLost.length}`);

console.log(`\nENTITY PRESERVATION`);
console.log(`  distinct entity refs in prompts  BEFORE ${idsB.size}   AFTER ${idsA.size}`);

console.log(`\nPROVENANCE`);
console.log(`  provenance keys emitted  BEFORE ${provB}   AFTER ${provA}`);

console.log(`\nLATENCY (end-to-end turn, in-process, stub LLM)`);
const ms = (rows: Row[]) => { const v = rows.filter(r=>r.llmReached).map(r=>r.turnMs).sort((x,y)=>x-y); return v[Math.floor(v.length/2)]; };
console.log(`  median turn ms  BEFORE ${ms(before).toFixed(0)}   AFTER ${ms(after).toFixed(0)}`);

fs.writeFileSync("server/tests/benchmark/context-composition-verification/out/analysis.json", JSON.stringify({ n, ctxCharsA, ctxCharsB, noteChars, noteTurns, secA, secB, wfA, wfB, idsA: idsA.size, idsB: idsB.size, provA, provB, worse: worse.length, secLost: secLost.length, perQ }, null, 1));
console.log(`\n→ server/tests/benchmark/context-composition-verification/out/analysis.json`);
