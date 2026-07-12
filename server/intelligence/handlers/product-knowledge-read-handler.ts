/**
 * Product Knowledge Read Handler (PHASE5A)
 * ========================================
 * Makes the `product-knowledge` capability executable for read-only intents. It
 * is how THA answers questions about ITSELF — "what is the Planner for?", "what
 * can you do?", "what does THA integrate with?" — from an owned registry rather
 * than from a sentence somebody once typed into a prompt.
 *
 * Governing architecture:
 *   THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md §12 (PKR2 — the Companion
 *     queries the registry and never duplicates it)
 *   PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §9 (PKR3 — Product Knowledge
 *     as a platform knowledge domain)
 *
 * ── THE RULE THIS BINDING EXISTS TO ENFORCE ────────────────────────────────
 *
 *   Rule PKR27 — NO PRODUCT KNOWLEDGE IN A PROMPT. Not one sentence about THA
 *   in a system prompt, a template, a fallback string, or a capability's own
 *   code. If the Companion needs to know something about THA, it reads the
 *   registry.
 *
 * So notice what this file does NOT contain, and could not contain without
 * being wrong: there is no sentence in here describing what THA is, what any
 * page does, or what any capability offers. Every product fact this handler
 * emits came out of `docs/product/inventory/product.json` microseconds earlier.
 * A helpful hardcoded sentence here would be a SECOND OWNER of a product fact
 * (Rule PKR13) — it would not be updated when the product changed, because
 * nothing would point at it, and it would be wrong within a quarter, in the
 * most authoritative voice THA has.
 *
 * The strings below are about the REGISTRY (how grounding works, why a gap is a
 * gap). None is about the product. That line is the whole discipline, and it is
 * worth being pedantic about: "THA has a Planner" belongs in the registry;
 * "nothing here was invented" belongs here.
 *
 * ── PERMISSION ─────────────────────────────────────────────────────────────
 *
 * The caller's tier is derived from the role the platform ALREADY resolved via
 * `server/lib/access.ts` — this handler never inspects a session and never
 * decides who anyone is (Rule PKR25). The tier is passed into every port call,
 * and the port has no method that omits it, so an over-tier entry is not
 * something this handler could return even by mistake.
 *
 * Rule PKR29 — ABSENCE IS NEVER EXPLAINED. A filtered entry does not exist as
 * far as this handler is concerned. It never says "there is an admin feature I
 * can't tell you about" — the existence of a hidden surface is itself admin-tier
 * knowledge, and acknowledging a withheld thing discloses the fact the tier was
 * protecting. Its honest answer at that tier is that it does not know, which is
 * true, because at that tier it does not.
 */

import {
  CapabilityExecutionError,
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { ProductKnowledgeReadPort } from "./product-knowledge-read-port.js";
import { viewerTier, type ProductVisibility } from "../../services/product-knowledge-registry.js";
import { gap, readOnlyVerbGuard } from "./_read-kit.js";
import { PRODUCT_KNOWLEDGE_EXECUTABLE_INTENTS } from "../bindings/product-knowledge.js";

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

export interface ProductEntryResult {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly status: string;
  readonly purpose: string;
  readonly related: readonly string[];
}

export interface ProductKnowledgeReadResult {
  readonly scope: "entry" | "section" | "sections";
  readonly entries: readonly ProductEntryResult[];
  readonly sections?: readonly { readonly section: string; readonly count: number }[];
  readonly source: "product-knowledge-registry";
  readonly note: string;
}

export interface ProductKnowledgeSearchResult {
  readonly query: string;
  readonly entries: readonly ProductEntryResult[];
  readonly source: "product-knowledge-registry";
  readonly note: string;
}

export interface ProductKnowledgeExplainResult {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly status: string;
  readonly purpose: string;
  /** Entries the registry links this one to, and that this caller may also be
   *  told about. A related id the caller may NOT see is dropped silently — a
   *  dangling pointer to a surface above their tier is itself a disclosure. */
  readonly related: readonly ProductEntryResult[];
  readonly source: "product-knowledge-registry";
  readonly note: string;
}

// ---------------------------------------------------------------------------
// Notes — ABOUT THE REGISTRY, never about the product (Rule PKR27)
// ---------------------------------------------------------------------------

const GROUNDED_NOTE =
  "Answered from the Product Knowledge Registry, which is the single owner of what THA is. " +
  "Every statement above traces to a registry entry id. Nothing here was authored by the " +
  "Intelligence Platform, and nothing THA does not record about itself is shown.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length > 0 ? s : undefined;
}

/**
 * The caller's disclosure ceiling, from the role the platform already resolved.
 *
 * `context.userId` presence is the authenticated/anonymous signal, exactly as
 * `requireUserId` uses it elsewhere. An anonymous caller gets `public` — which
 * is correct and is why this handler does NOT call requireUserId: public product
 * knowledge (help, glossary, marketing) is answerable to anyone, and requiring a
 * session to be told what THA is would make the registry useless to the very
 * people it most needs to reach.
 */
function tierFor(context: IntelligenceContext): ProductVisibility {
  return viewerTier(context.role, context.userId != null);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

async function handleRead(
  intent: Intent,
  context: IntelligenceContext,
  port: ProductKnowledgeReadPort,
): Promise<ProductKnowledgeReadResult> {
  const tier = tierFor(context);
  const id = toStr(intent.parameters?.id);
  const section = toStr(intent.parameters?.section);

  if (id) {
    const entry = await port.getEntry(tier, id);
    if (!entry) {
      // Unknown id AND above-tier id land here identically. That is deliberate
      // (Rule PKR29) — the message must not hint that the entry might exist.
      throw gap(
        `Honest gap: the Product Knowledge Registry has nothing recorded under ${JSON.stringify(id)} ` +
          "that can be surfaced for this request. The Intelligence Platform will not describe a part " +
          "of THA the registry does not own.",
      );
    }
    return { scope: "entry", entries: [entry], source: "product-knowledge-registry", note: GROUNDED_NOTE };
  }

  if (section) {
    const entries = await port.listEntries(tier, section);
    if (entries.length === 0) {
      throw gap(
        `Honest gap: the Product Knowledge Registry has nothing recorded in section ${JSON.stringify(section)} ` +
          "that can be surfaced for this request. The Intelligence Platform will not invent one.",
      );
    }
    return { scope: "section", entries, source: "product-knowledge-registry", note: GROUNDED_NOTE };
  }

  // Neither id nor section → the map of what can be answered, at this tier.
  const sections = await port.listSections(tier);
  if (sections.length === 0) {
    throw gap(
      "Honest gap: the Product Knowledge Registry has nothing that can be surfaced for this request. " +
        "The Intelligence Platform will not describe THA from anything other than the registry.",
    );
  }
  return { scope: "sections", entries: [], sections, source: "product-knowledge-registry", note: GROUNDED_NOTE };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

async function handleSearch(
  intent: Intent,
  context: IntelligenceContext,
  port: ProductKnowledgeReadPort,
): Promise<ProductKnowledgeSearchResult> {
  const query = toStr(intent.parameters?.query);
  if (!query) throw gap("Searching product knowledge needs a non-empty { query } string.");

  const entries = await port.searchEntries(tierFor(context), query);
  if (entries.length === 0) {
    throw gap(
      `Honest gap: the Product Knowledge Registry records nothing matching ${JSON.stringify(query)} ` +
        "that can be surfaced for this request. The Intelligence Platform will not answer a question " +
        "about THA from anything other than the registry — if the registry does not hold it, THA does " +
        "not claim it.",
    );
  }
  return { query, entries, source: "product-knowledge-registry", note: GROUNDED_NOTE };
}

// ---------------------------------------------------------------------------
// Explain
// ---------------------------------------------------------------------------

async function handleExplain(
  intent: Intent,
  context: IntelligenceContext,
  port: ProductKnowledgeReadPort,
): Promise<ProductKnowledgeExplainResult> {
  const tier = tierFor(context);
  const id = toStr(intent.parameters?.id);
  if (!id) throw gap("Explaining a part of THA needs { id } — the registry entry's id.");

  const entry = await port.getEntry(tier, id);
  if (!entry) {
    throw gap(
      `Honest gap: the Product Knowledge Registry has nothing recorded under ${JSON.stringify(id)} ` +
        "that can be surfaced for this request. The Intelligence Platform will not explain a part of " +
        "THA the registry does not own.",
    );
  }

  // Resolve the related graph THROUGH the same tier filter. A related id the
  // caller may not be told about is dropped, not listed-but-empty: naming an id
  // the caller cannot open tells them a surface exists, which is the disclosure
  // Rule PKR29 forbids.
  const related: ProductEntryResult[] = [];
  for (const relatedId of entry.related) {
    const found = await port.getEntry(tier, relatedId);
    if (found) related.push(found);
  }

  return {
    id: entry.id,
    name: entry.name,
    section: entry.section,
    status: entry.status,
    purpose: entry.purpose,
    related,
    source: "product-knowledge-registry",
    note: GROUNDED_NOTE,
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createProductKnowledgeReadHandler(
  resolvePort: () => Promise<ProductKnowledgeReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, PRODUCT_KNOWLEDGE_EXECUTABLE_INTENTS, "Product Knowledge");

    switch (intent.verb) {
      case "read":
        return handleRead(intent, context, await resolvePort());
      case "search":
        return handleSearch(intent, context, await resolvePort());
      case "explain":
        return handleExplain(intent, context, await resolvePort());
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Product Knowledge is bound to the Intelligence Platform read-only: "${intent.verb}" is not ` +
            "executable via the platform. The registry is authored in docs/product/ by a named human " +
            "owner and generated to its machine form — nothing at runtime may create, edit or retire " +
            "an entry.",
          intent.verb,
        );
    }
  };
}
