/**
 * companion-card.ts — EWO-ARCH-INT02 / INT37 Companion Card Experience
 * ====================================================================
 * The presentation-logic core of the Companion Card framework. It transforms a
 * Native Discovery Response (INT36) into a client-agnostic VIEW MODEL the
 * Conversation UI renders — Summary → Companion Cards → Next Steps.
 *
 * Companion Cards summarise information, surface key facts, and offer Next Steps
 * that NAVIGATE to canonical THA pages. They never own business data, editing or
 * provenance, and never bypass canonical navigation (see
 * docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md).
 *
 * FIREWALL (enforced here, in code):
 *   • Every action destination is a canonical, in-app THA path ("/…"). This
 *     module can never emit an external URL as a navigation target — by
 *     construction it only ever builds internal paths from a card's canonical
 *     `{ type, id }` ref or the domain's canonical landing route.
 *   • The one URL a card may carry is the meal's own canonical THA `imageUrl`
 *     (owned by the THA meal entity). It is an image source, never a link.
 *   • The summary is sanitised: raw markdown, markdown image syntax, and any
 *     external URLs are stripped before display, so the conversation never shows
 *     markdown or a provenance link.
 *
 * REUSE (every Intelligence domain):
 *   `buildCompanionCardView` is domain-agnostic. Meal discovery gets rich meal
 *   cards; every other domain (Planner, Shopping, Pantry, Nutrition, Diary,
 *   Household, Profile) flows through the SAME builder and adopts the SAME card
 *   framework — no domain-specific conversation layout.
 *
 * This module is pure (no React, no DOM, no "@/" imports) so it renders on Web,
 * Mobile and future clients and is exercised directly by the INT37 regression
 * tests.
 */

// ---------------------------------------------------------------------------
// Native Discovery Response contract (mirrors server/native-discovery.ts, INT36)
// ---------------------------------------------------------------------------

/** A canonical THA page reference — `{ type, id }`, never a URL. */
export interface ThaEntityRef {
  type: string;
  id: number | string;
}

/** One canonical THA entity card from a discovery response. */
export interface ThaDiscoveryCard {
  kind: "meal" | "entity";
  ref: ThaEntityRef;
  title: string;
  subtitle?: string;
  /** Canonical THA image (meal cards). Never an external source image. */
  imageUrl?: string;
  servings?: number;
  appleScore?: number;
  lastCooked?: string;
}

/** One available action on a discovery response. */
export interface DiscoveryAction {
  kind: "open" | "add-to-planner" | "add-to-shopping" | "view-all";
  label: string;
  appliesTo: "entity" | "results";
  query?: string;
}

/** A complete native THA discovery response for one domain. */
export interface NativeDiscoveryResponse {
  domain: string;
  summary: string;
  entities: ThaDiscoveryCard[];
  actions: DiscoveryAction[];
  entityRefs?: ThaEntityRef[];
}

// ---------------------------------------------------------------------------
// INT38 — cross-domain guidance suggestions (mirrors server/companion-guidance.ts)
// ---------------------------------------------------------------------------

/** One cross-domain guidance suggestion attached to a turn (not entity-scoped). */
export interface GuidanceSuggestion {
  sourceDomain: string;
  domain: string;
  label: string;
  /** INT39 — the underlying Capability Guidance Registry action (for goal-completion tracking). */
  sourceCapabilityId: string;
  targetCapabilityId: string;
  verb: string;
}

/** A guidance suggestion resolved to a canonical in-app navigation target. */
export interface CompanionGuidanceAction {
  kind: "explore";
  label: string;
  /** Canonical, in-app THA path ("/…"). Never an external URL. */
  href: string;
  domain: string;
  sourceDomain: string;
  /** INT39 — carried through so a click-through can be classified as goal-completing server-side. */
  sourceCapabilityId: string;
  targetCapabilityId: string;
  verb: string;
}

// ---------------------------------------------------------------------------
// INT41 — capability-owned contextual enrichment (mirrors
// server/companion-enrichment.ts). Purely informational: no navigation
// target, no mutation — the server shape IS the render shape, so unlike
// guidance/discovery there is no resolve step here.
// ---------------------------------------------------------------------------

/** One contextual enrichment item attached to a turn (not entity-scoped). */
export interface CompanionEnrichmentItem {
  sourceDomain: string;
  sourceCapabilityId: string;
  kind: "insight" | "explanation" | "recommendation" | "educational";
  title: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Presentation view model (what the React components render)
// ---------------------------------------------------------------------------

/** A single Next Step / card action resolved to a canonical in-app destination. */
export interface CompanionCardAction {
  kind: DiscoveryAction["kind"];
  label: string;
  /** Canonical, in-app THA path ("/…"). Never an external URL. */
  href: string;
}

/** A meal fact rendered on a card ("4 servings", "Apple Score 82", "Cooked …"). */
export interface CompanionCardFact {
  key: "servings" | "appleScore" | "lastCooked";
  label: string;
}

/** One Companion Card ready for rendering. */
export interface CompanionCardView {
  kind: "meal" | "entity";
  title: string;
  subtitle?: string;
  /** Canonical THA image; present for meal cards that carry one. Never external. */
  imageUrl?: string;
  /** Compact canonical facts (servings / Apple Score / Last cooked). */
  facts: CompanionCardFact[];
  /** Per-card canonical actions (Open Meal / Add to Planner / Add to Shopping). */
  actions: CompanionCardAction[];
}

/** The full companion view for one discovery response. */
export interface CompanionCardView_Response {
  domain: string;
  /** Sanitised, markdown-free, URL-free summary line. */
  summary: string;
  cards: CompanionCardView[];
  /** Result-level Next Steps (e.g. "View All"). */
  nextSteps: CompanionCardAction[];
}

// ---------------------------------------------------------------------------
// Canonical navigation — the single place ref/domain → THA path is decided
// ---------------------------------------------------------------------------

/**
 * Canonical landing route for each discovery domain. Result-level Next Steps
 * ("View All") and any card whose ref type has no id-addressable detail page
 * navigate here — always an in-app THA route, never an external URL.
 */
const DOMAIN_LANDING: Readonly<Record<string, string>> = {
  meal:      "/meals",
  planner:   "/planner",
  shopping:  "/shopping-workspace",
  pantry:    "/pantry",
  diary:     "/diary",
  nutrition: "/foods",
  household: "/profile",
  // COMM2 — the Orchard. Added in the same change that admitted `community` to
  // COMPANION_ROOMS (server/intelligence/types.ts). `domainLandingPath` falls back
  // to "/" rather than throwing, so a room admitted there and forgotten here does
  // not error — it silently routes every Next Step home. That silence is why these
  // two lists move together or not at all.
  community: "/orchard",
};

/**
 * Canonical detail path for a ref that is addressable by id. Only entity types
 * with a real id-addressable THA detail route resolve here; everything else
 * returns null and the caller falls back to the domain landing route.
 * Returns an in-app path only — never an external URL.
 */
export function thaDetailPath(ref: ThaEntityRef): string | null {
  switch (ref.type) {
    case "meal":
      return `/meals/${encodeURIComponent(String(ref.id))}`;
    default:
      return null;
  }
}

/** Canonical landing path for a domain (falls back to home). */
export function domainLandingPath(domain: string): string {
  return DOMAIN_LANDING[domain] ?? "/";
}

/**
 * The canonical destination for a per-card action. Every meal action (Open Meal,
 * Add to Planner, Add to Shopping) navigates to the meal's canonical THA page —
 * the single owner of presentation and of those very actions — so the Companion
 * Card never edits in place or bypasses canonical navigation. Cards without an
 * id-addressable detail page fall back to the domain landing route.
 */
function cardActionHref(card: ThaDiscoveryCard, domain: string): string {
  return thaDetailPath(card.ref) ?? domainLandingPath(domain);
}

// ---------------------------------------------------------------------------
// Summary sanitisation — no markdown, no image syntax, no external URLs
// ---------------------------------------------------------------------------

/**
 * Strip anything the conversation must never display from a summary line:
 *   • markdown image syntax  ![alt](url)
 *   • markdown links         [text](url)  → keep the visible text only
 *   • bare external URLs      http(s)://…
 *   • emphasis / heading / code markdown markers
 * Whitespace left behind is collapsed. The result is plain, human text.
 */
export function sanitizeSummary(text: string): string {
  if (!text) return "";
  return text
    // markdown images first (before links, since they share the ](…) tail)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    // markdown links → visible text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // bare URLs (any scheme)
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, "")
    // leftover www.-style hosts
    .replace(/\bwww\.\S+/gi, "")
    // markdown emphasis / code / heading markers
    .replace(/[*_`~]+/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    // collapse whitespace the removals left behind
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,!?;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Fact projection — compact canonical facts, never fabricated
// ---------------------------------------------------------------------------

function cardFacts(card: ThaDiscoveryCard): CompanionCardFact[] {
  const facts: CompanionCardFact[] = [];
  if (typeof card.servings === "number" && Number.isFinite(card.servings)) {
    facts.push({
      key: "servings",
      label: `${card.servings} ${card.servings === 1 ? "serving" : "servings"}`,
    });
  }
  if (typeof card.appleScore === "number" && Number.isFinite(card.appleScore)) {
    facts.push({ key: "appleScore", label: `Apple Score ${card.appleScore}` });
  }
  if (typeof card.lastCooked === "string" && card.lastCooked.trim() !== "") {
    facts.push({ key: "lastCooked", label: `Last cooked ${card.lastCooked.trim()}` });
  }
  return facts;
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

/**
 * Build the Companion Card view model for one Native Discovery Response, or null
 * when there are no entities to present (an empty response is never rendered as
 * an empty card block — the empty state is an INT35 fallback, handled upstream).
 */
export function buildCompanionCardView(
  discovery: NativeDiscoveryResponse,
): CompanionCardView_Response | null {
  if (!discovery || !Array.isArray(discovery.entities) || discovery.entities.length === 0) {
    return null;
  }

  const domain = discovery.domain;

  // Per-card (entity) actions, resolved to canonical THA destinations.
  const entityActions = (discovery.actions ?? []).filter((a) => a.appliesTo === "entity");
  // Result-level Next Steps (e.g. View All), resolved to the domain landing route.
  const nextSteps: CompanionCardAction[] = (discovery.actions ?? [])
    .filter((a) => a.appliesTo === "results")
    .map((a) => ({ kind: a.kind, label: a.label, href: domainLandingPath(domain) }));

  const cards: CompanionCardView[] = discovery.entities.map((card) => ({
    kind: card.kind,
    title: card.title,
    ...(card.subtitle ? { subtitle: card.subtitle } : {}),
    ...(card.imageUrl ? { imageUrl: card.imageUrl } : {}),
    facts: cardFacts(card),
    actions: entityActions.map((a) => ({
      kind: a.kind,
      label: a.label,
      href: cardActionHref(card, domain),
    })),
  }));

  return {
    domain,
    summary: sanitizeSummary(discovery.summary ?? ""),
    cards,
    nextSteps,
  };
}

// ---------------------------------------------------------------------------
// INT38 — guidance suggestion → canonical navigation target
// ---------------------------------------------------------------------------

/**
 * Resolve INT38 cross-domain guidance suggestions to canonical in-app
 * navigation targets, via the same domainLandingPath() every other Next Step
 * already uses — so guidance chips share the exact in-app-path-only firewall
 * discovery Next Steps enforce. Turn-level (not entity-scoped): rendered
 * regardless of whether the turn also carries Companion Cards.
 */
export function buildGuidanceActions(guidance: GuidanceSuggestion[]): CompanionGuidanceAction[] {
  return guidance.map((g) => ({
    kind: "explore",
    label: g.label,
    href: domainLandingPath(g.domain),
    domain: g.domain,
    sourceDomain: g.sourceDomain,
    sourceCapabilityId: g.sourceCapabilityId,
    targetCapabilityId: g.targetCapabilityId,
    verb: g.verb,
  }));
}
