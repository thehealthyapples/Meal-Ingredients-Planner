/**
 * PANTRY1 — Shopping-aware Pantry opportunity generation and delivery contracts.
 *
 * The active need generator and Decision Engine delivery tests remain executable.
 * Pantry-specific explanation, honest-gap and tautology requirements are retained
 * as a deferred specification comment before §5 until a Pantry explanation owner
 * exists; see the AFI3–5 completion record referenced there.
 */

import type { ShoppingListItem, UserPantryItem } from "@shared/schema";
import {
  identifyPantryNeedOpportunities,
  identifyPantryUnusedOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import { selectSurface } from "../intelligence/opportunity-delivery/framework.js";
import { noticeOpportunities } from "../intelligence/conversation/notice-engine.js";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let failures = 0;
let passes = 0;

function assert(condition: boolean, label: string, detail?: unknown): void {
  if (condition) {
    passes++;
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail !== undefined ? ` — got: ${JSON.stringify(detail)}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

// ---------------------------------------------------------------------------
// Builders — partials cast to the owner's row type (repo test convention).
//
// Copied from test-shop1-intelligent-shopping.ts rather than re-invented: the whole point
// of PANTRY1 is that the Pantry, Shopping and the Cookbook resolve food through the SAME
// canonical resolver, so their fixtures must not drift into disagreeing about what a
// pantry row is. Real canonical foods are used throughout so the REAL resolver resolves them.
// ---------------------------------------------------------------------------

function pantryItem(over: Partial<UserPantryItem> & { id: number; ingredientKey: string }): UserPantryItem {
  return {
    userId: 1,
    displayName: null,
    isDeleted: false,
    defaultHave: true,
    category: "larder",
    needQuantityValue: null,
    needUnit: null,
    ...over,
  } as unknown as UserPantryItem;
}

function shopItem(over: Partial<ShoppingListItem> & { id: number; productName: string }): ShoppingListItem {
  return {
    checked: false,
    normalizedName: null,
    ...over,
  } as unknown as ShoppingListItem;
}

async function main(): Promise<void> {
  // =========================================================================
    /*
   * Deferred Pantry explanation specification (PANTRY1 §§1–4c): preserve the
   * six-face reasoning, honest-gap and non-fabrication requirements as design
   * constraints until a Pantry explanation owner exists. The load-bearing §2
   * tautology guard remains explicit: “you already have this in your pantry”
   * is vacuously true of every pantry row and must not become a reason merely
   * because it has a citation. Preserve the wrong-subject and plural-grammar
   * guards when that owner is implemented. See
   * docs/implementation/intelligence/AFI3_5_AMBIENT_FOOD_INTELLIGENCE_COMPLETION.md.
   * Executable tests below continue to cover the implemented need generator and
   * inherited delivery contract.
   */
section("§5 — SHOPPING-AWARE PANTRY (the one new generator)");
  // =========================================================================
  {
    const needsMilk = pantryItem({
      id: 10,
      ingredientKey: "milk",
      displayName: "Milk",
      needQuantityValue: 2,
      needUnit: "litres",
    });

    const fired = identifyPantryNeedOpportunities([needsMilk], []);
    assert(fired.length === 1, "§5.1 a recorded need absent from the shopping list fires ONE card", fired.length);

    const card = fired[0]!;
    assert(card.type === "pantry-need-not-on-shopping-list", "§5.2 the card carries the new type", card.type);
    assert(card.owningDomain === "pantry", "§5.2 the card is owned by the PANTRY domain", card.owningDomain);
    assert(card.priority === "medium", "§5.2 a missed shop is an inconvenience, never `critical`", card.priority);
    assert(card.id === "pantry-need-not-on-shopping-list:10", "§5.3 the id is deterministic and row-keyed", card.id);
    assert(
      card.subject.entity === "pantry-item" && card.subject.id === 10 && card.subject.label === "Milk",
      "§5.3 the subject is the structured pantry row (PHASE5E)",
      card.subject,
    );
    assert(card.evidence.length === 2, "§5.4 Rule E1 — the claim cites BOTH owners it joined", card.evidence);
    assert(
      card.evidence.some((x) => x.source === "pantry-items") &&
        card.evidence.some((x) => x.source === "shopping-list"),
      "§5.4 the two owners are the pantry row and the shopping list",
      card.evidence.map((x) => x.source),
    );
    assert(
      card.explanation.includes("2 litres") && card.explanation.includes("Milk"),
      "§5.5 the card reports back what the household THEMSELVES declared",
      card.explanation,
    );

    // An EMPTY shopping list is a READ shopping list — the card must fire (this is precisely
    // the household the card is for). Contrast §5.9.
    assert(
      identifyPantryNeedOpportunities([needsMilk], []).length === 1,
      "§5.6 an EMPTY list is a read list — the need still fires",
    );

    // Already on the list → nothing to say. Matched on the canonical slug, so "Milk" the
    // pantry row and "milk" the shopping line are one food.
    const listed = identifyPantryNeedOpportunities(
      [needsMilk],
      [shopItem({ id: 1, productName: "Milk", normalizedName: "milk" })],
    );
    assert(listed.length === 0, "§5.7 a need already on the shopping list is SILENT", listed);

    // No declared need → no card. This generator never infers that a household is running
    // low; it only reports back what they typed.
    assert(
      identifyPantryNeedOpportunities([pantryItem({ id: 11, ingredientKey: "milk" })], []).length === 0,
      "§5.8 an item with no recorded need fires nothing — consumption is never modelled",
    );
    assert(
      identifyPantryNeedOpportunities(
        [pantryItem({ id: 12, ingredientKey: "milk", needQuantityValue: 0 })],
        [],
      ).length === 0,
      "§5.8 a zero need is not a need",
    );
    assert(
      identifyPantryNeedOpportunities(
        [pantryItem({ id: 13, ingredientKey: "milk", needQuantityValue: 2, isDeleted: true })],
        [],
      ).length === 0,
      "§5.8 a deleted pantry row is not read",
    );

    // THE REFUSAL. An unidentifiable food cannot be PROVEN absent from the shopping list, so
    // the generator is silent rather than falling back to a raw string comparison. Telling a
    // household to buy something they may already have listed is the exact failure this card
    // exists to prevent.
    const unresolvable = identifyPantryNeedOpportunities(
      [
        pantryItem({
          id: 14,
          ingredientKey: "zzz-not-a-real-food-xyz",
          displayName: "Grandma's Secret Spice Blend",
          needQuantityValue: 1,
          needUnit: "jar",
        }),
      ],
      [],
    );
    assert(
      unresolvable.length === 0,
      "§5.9 THE REFUSAL — an unidentifiable food is SILENT, never guessed at",
      unresolvable,
    );
  }

  // =========================================================================
  section("§6 — THE DECISION ENGINE CONTRACT (inherited, not rebuilt)");
  // =========================================================================
  {
    // Zero lines of routing were written: `pantry` was already enrolled.
    assert(selectSurface("pantry") === "pantry", "§6.1 the pantry domain routes to the pantry surface");

    const card: FoodOpportunity = identifyPantryNeedOpportunities(
      [pantryItem({ id: 10, ingredientKey: "milk", displayName: "Milk", needQuantityValue: 2, needUnit: "litres" })],
      [],
    )[0]!;

    // THE SILENT-DROP GUARD. `noticeOpportunities` drops an opportunity whose domain it
    // cannot map. Without the `pantry` → `pantry-opportunity` row, every card here would be
    // produced, delivered, budgeted, persisted and learned from — then dropped ONE STEP
    // before the household could read it. The row already exists; this asserts it.
    const notices = noticeOpportunities([
      {
        id: card.id,
        domain: card.owningDomain,
        priority: card.priority,
        explanation: card.explanation,
        suggestedAction: card.suggestedAction,
        evidence: card.evidence.map((e) => ({ source: e.source, detail: e.detail })),
      },
    ]);
    assert(
      notices.length === 1 && notices[0]?.category === "pantry-opportunity",
      "§6.2 a pantry card reaches the Companion as a `pantry-opportunity` notice",
      notices,
    );

    // Rule E1 at the boundary: no citation, no card.
    const uncited = noticeOpportunities([
      {
        id: card.id,
        domain: card.owningDomain,
        priority: card.priority,
        explanation: card.explanation,
        suggestedAction: card.suggestedAction,
        evidence: [],
      },
    ]);
    assert(uncited.length === 0, "§6.3 an UNCITED pantry card is DROPPED at the notice boundary (Rule E1)", uncited);

    // The canonical attention mechanics order the two pantry cards. PANTRY1 wrote no sort.
    const unused = identifyPantryUnusedOpportunities(
      [pantryItem({ id: 20, ingredientKey: "tomato", displayName: "Tomatoes" })],
      new Set<string>(),
    );
    const ordered = prioritizeOpportunities([...unused, card], 10);
    assert(
      ordered[0]?.priority === "medium" && ordered[ordered.length - 1]?.priority === "low",
      "§6.4 pantry cards are ordered by the canonical attention mechanics (medium before low)",
      ordered.map((o) => o.priority),
    );

    // ATTN1 invariant A2 — only `shopping-restriction-conflict` may be critical.
    assert(
      [...unused, card].every((o) => o.priority !== "critical"),
      "§6.5 no pantry card claims `critical` (ATTN1 invariant A2)",
    );
  }

  // -------------------------------------------------------------------------
  console.log(`\n${"─".repeat(60)}`);
  console.log(`PANTRY1: ${passes} passed, ${failures} failed`);
  console.log(`${"─".repeat(60)}\n`);
  if (failures > 0) process.exit(1);
}

void main();

