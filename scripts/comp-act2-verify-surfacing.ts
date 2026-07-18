/**
 * COMP_ACT2 — verify the COMP_ACT1 write verbs really are surfaced as Companion
 * Action proposals, end-to-end, against a live server and a seeded demo household.
 *
 * Drives the REAL route (`POST /api/intelligence/conversation/turn`) with the REAL
 * surface hints a page publishes, and asserts on the proposals the turn returns —
 * so it exercises route hint-validation → context frame → gateway → the pure
 * builder → the action store, exactly as the browser does. Read-only w.r.t. the
 * product apart from the conversation turns it creates as the demo household.
 *
 *   COMP_ACT2_BASE_URL=http://localhost:5077 npx tsx scripts/comp-act2-verify-surfacing.ts
 *
 * Written by session COMP_ACT2_Companion_Action_Surfacing.
 */
const BASE = process.env.COMP_ACT2_BASE_URL ?? "http://localhost:5077";

let pass = 0, fail = 0;
const failures: string[] = [];
function assert(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; failures.push(label); console.log(`  ✗ ${label}`); }
}

interface Proposal {
  capabilityId: string; verb: string; label: string;
  parameters: Record<string, unknown>; confirmationTier: string; status: string;
}

async function main() {
  // ── Open the demo household and keep its cookie ──────────────────────────
  const demo = await fetch(`${BASE}/api/demo/start`, { method: "POST" });
  if (!demo.ok) throw new Error(`/api/demo/start → ${demo.status}`);
  const cookie = (demo.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  console.log(`\n  demo household opened (${demo.status})\n`);

  const turn = async (utterance: string, surfaceHints: Record<string, unknown>): Promise<Proposal[]> => {
    const res = await fetch(`${BASE}/api/intelligence/conversation/turn`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ utterance, surface: "floating", surfaceHints }),
    });
    if (!res.ok) throw new Error(`turn → ${res.status} ${await res.text()}`);
    const body: any = await res.json();
    return (body.actionProposals ?? body.actions ?? []) as Proposal[];
  };
  const find = (ps: Proposal[], capabilityId: string, verb: string) =>
    ps.find((p) => p.capabilityId === capabilityId && p.verb === verb);

  // ── 1. Shopping Delete — no hint needed; the surfaced row IS the context ──
  console.log("── Shopping Delete — a row on the household's own list ──");
  const shoppingTurn = await turn("what's on my shopping list?", {});
  const del = find(shoppingTurn, "shopping", "delete");
  assert(!!del, "a shopping-list turn surfaces a Shopping Delete proposal");
  if (del) {
    assert(typeof del.parameters.id === "number", `the target is a real row id (id=${del.parameters.id}) — the handler's own key`);
    assert(del.confirmationTier === "strong", `confirmation tier is 'strong' (${del.confirmationTier}) — a dialog before anything is removed`);
    assert(del.status === "proposed", "it is PROPOSED, not executed — nothing is written until the household confirms");
    console.log(`     → "${del.label}"`);
  }

  // ── 2. Pantry Remove ─────────────────────────────────────────────────────
  console.log("\n── Pantry Remove — a row in the household's own pantry ──");
  const pantryTurn = await turn("what's in my pantry?", {});
  const pdel = find(pantryTurn, "pantry", "delete");
  assert(!!pdel, "a pantry turn surfaces a Pantry Remove proposal");
  if (pdel) {
    assert(typeof pdel.parameters.id === "number", `the target is a real pantry row id (id=${pdel.parameters.id})`);
    assert(pdel.confirmationTier === "strong", `confirmation tier is 'strong' (${pdel.confirmationTier})`);
    console.log(`     → "${pdel.label}"`);
  }

  // ── 3. Pantry Add — the category gap, then the chosen category ───────────
  console.log("\n── Pantry Add — honest gap until the household has chosen a category ──");
  const noCat = await turn("what's in my pantry?", {});
  assert(!find(noCat, "pantry", "add"), "with no chosen category, Pantry Add is NOT offered — a food is never filed into a guessed cupboard");
  const withCat = await turn("what's in my pantry?", { selectedPantryCategory: "fridge" });
  const padd = find(withCat, "pantry", "add");
  assert(!!padd, "once a category tab has been chosen, Pantry Add IS offered");
  if (padd) {
    assert(padd.parameters.category === "fridge", `it uses the CHOSEN category (${padd.parameters.category}), never the render default 'larder'`);
    assert(typeof padd.parameters.ingredient === "string", "and the food in view as the ingredient — the handler's own keys");
    assert(padd.confirmationTier === "light", `confirmation tier is 'light' (${padd.confirmationTier}) — an inline tap`);
    console.log(`     → "${padd.label}"`);
  }

  // ── 4. Diary Log — needs BOTH a day and a slot ───────────────────────────
  console.log("\n── Diary Log — needs both a day and a slot, guesses neither ──");
  const dateOnly = await turn("what's in my pantry?", { selectedDiaryDate: "2026-07-18" });
  assert(!find(dateOnly, "diary", "add"), "a day with no slot does not produce a Diary Log proposal");
  const slotOnly = await turn("what's in my pantry?", { selectedDiarySlot: "lunch" });
  assert(!find(slotOnly, "diary", "add"), "a slot with no day does not either — 'today' is never resolved here");
  const both = await turn("what's in my pantry?", { selectedDiaryDate: "2026-07-18", selectedDiarySlot: "lunch" });
  const dlog = find(both, "diary", "add");
  assert(!!dlog, "with the diary showing a day and a slot open, Diary Log IS offered");
  if (dlog) {
    assert(dlog.parameters.date === "2026-07-18" && dlog.parameters.mealSlot === "lunch", `it logs against the day on screen and the slot opened (${dlog.parameters.date}/${dlog.parameters.mealSlot})`);
    assert(dlog.confirmationTier === "light", `confirmation tier is 'light' (${dlog.confirmationTier})`);
    console.log(`     → "${dlog.label}"`);
  }

  // ── 5. Planner Move — entry from the open sheet, target from the selection ─
  console.log("\n── Planner Move — the entry open, the day selected ──");
  const entryHints = { selectedPlannerEntryId: 1, selectedPlannerEntryDayId: 10, selectedPlannerEntrySlot: "dinner" };
  const noTarget = await turn("what's in my pantry?", entryHints);
  assert(!find(noTarget, "planner", "move"), "an open entry with no selected target day → no Move proposal");
  const sameDay = await turn("what's in my pantry?", { ...entryHints, selectedPlannerDayId: 10 });
  assert(!find(sameDay, "planner", "move"), "a target day equal to the entry's own day → refused, never a no-op button");
  const moved = await turn("what's in my pantry?", { ...entryHints, selectedPlannerDayId: 11 });
  const mv = find(moved, "planner", "move");
  assert(!!mv, "an open entry plus a DIFFERENT selected day → Move IS offered");
  if (mv) {
    assert(mv.parameters.entryId === 1 && mv.parameters.dayId === 11 && mv.parameters.mealSlot === "dinner", `parameters are the handler's keys, target from the selection, slot from the entry's own (${JSON.stringify(mv.parameters)})`);
    assert(mv.confirmationTier === "required", `confirmation tier is 'required' (${mv.confirmationTier}) — a dialog, not an inline tap`);
    console.log(`     → "${mv.label}"`);
  }

  // ── 6. Planner Replace — the open entry, a meal found this turn ──────────
  console.log("\n── Planner Replace — swap the open entry for a meal just found ──");
  const noEntry = await turn("find me a pasta meal", {});
  assert(!find(noEntry, "planner", "replace"), "a meal in view with no open entry → no Replace proposal");
  const replaced = await turn("find me a pasta meal", { selectedPlannerEntryId: 1, selectedPlannerEntryMealId: 999999 });
  const rp = find(replaced, "planner", "replace");
  assert(!!rp, "with an entry open, a meal found this turn IS offered as a replacement");
  if (rp) {
    assert(rp.parameters.entryId === 1 && typeof rp.parameters.mealId === "number", `parameters are the open entry + the discovered meal (${JSON.stringify(rp.parameters)})`);
    assert(rp.confirmationTier === "required", `confirmation tier is 'required' (${rp.confirmationTier})`);
    console.log(`     → "${rp.label}"`);
  }

  // ── 7. Nothing existing changed ──────────────────────────────────────────
  console.log("\n── No existing behaviour changed ──");
  const plannerAdd = await turn("find me a pasta meal", { selectedPantryCategory: "fridge" });
  assert(!find(plannerAdd, "planner", "add"), "COMP_ACT2's pointers do not switch on planner ADD — it still needs its own day+slot, exactly as before");

  console.log(`\n${"─".repeat(60)}\nCOMP_ACT2 end-to-end: ${pass} passed, ${fail} failed`);
  if (fail) { failures.forEach((f) => console.log(`  ✗ ${f}`)); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
