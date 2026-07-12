// INT18 Phase 2 — Floating Assistant UI
//
// Six components, one file (they are tightly coupled and share local state
// via props — no external state library needed).
//
//   FloatingAssistant  ← mount once, globally, in ProtectedRoute
//   ├─ PersonaLabel    ← surface-aware contextual framing badge
//   ├─ ConversationThread ← scrollable turn list
//   │   └─ TurnBubble  ← single turn (user | assistant | loading)
//   ├─ QuickActions    ← pre-filled intent chips when thread is empty
//   └─ AssistantInput  ← textarea + submit
//
// Design: Calm Orchard palette, DM Sans headings, shadow-none border-border.
// The panel slides in from the right on all viewports.

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare, X, Send, Leaf, Loader2,
  BookOpen, CalendarPlus, ShoppingBasket, ArrowRight, Star, Users, Clock, UtensilsCrossed,
  Sparkles, ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Wand2, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import {
  buildCompanionCardView,
  buildGuidanceActions,
  sanitizeSummary,
  type NativeDiscoveryResponse,
  type CompanionCardView,
  type CompanionCardAction,
  type CompanionCardFact,
  type GuidanceSuggestion,
  type CompanionGuidanceAction,
  type CompanionEnrichmentItem,
} from "./companion-card";
import {
  buildCompanionActionWorkflowViews,
  buildWorkflowOutcomeSummary,
  type CompanionActionProposal,
  type CompanionActionView,
  type ActionProposalStatus,
} from "./companion-action";
import {
  useCompanionSurfaceHints,
  usePendingAsk,
  type CompanionSurfaceHints,
} from "./companion-context";

/**
 * PHASE5E — one turn's request. `askHints` are the pointers that belong to a single
 * question asked BY a surface (today: the opportunity card a household pressed "Why
 * this?" on), as distinct from the pointers a page publishes to describe what is on
 * screen. They are merged over the published hints for that one turn and never persist.
 */
interface TurnRequest {
  readonly utterance: string;
  readonly askHints?: CompanionSurfaceHints;
}

// ── Surface detection ──────────────────────────────────────────────────────

type ConversationSurface =
  | "floating"
  | "planner"
  | "shopping"
  | "nutrition"
  | "household"
  | "pantry"
  | "diary"
  | "meals"
  | "templates"
  | "partners"
  | "analyser"
  | "voice";

function useSurface(): ConversationSurface {
  const [location] = useLocation();
  if (/^\/(planner|weekly-planner)/.test(location)) return "planner";
  if (/^\/(basket|analyse-basket|shopping)/.test(location)) return "shopping";
  if (/^\/(analyser|products)/.test(location)) return "analyser";
  if (/^\/pantry/.test(location)) return "pantry";
  if (/^\/(diary|food-diary)/.test(location)) return "diary";
  if (/^\/(meals|cookbook)/.test(location)) return "meals";
  if (/^\/foods/.test(location)) return "nutrition";
  if (/^\/partners/.test(location)) return "partners";
  return "floating";
}

const SURFACE_LABEL: Record<ConversationSurface, string> = {
  planner: "Planner",
  shopping: "Shopping",
  nutrition: "Nutrition",
  household: "Household",
  pantry: "Pantry",
  diary: "Diary",
  meals: "Cookbook",
  templates: "Templates",
  partners: "Partners",
  analyser: "Analyser",
  floating: "Apple",
  voice: "Voice",
};

const QUICK_ACTIONS: Record<ConversationSurface, string[]> = {
  planner: [
    "What meals do I have this week?",
    "Which meals are high in protein?",
    "Any allergens to watch out for?",
  ],
  shopping: [
    "What's in my basket?",
    "Are there allergens in my list?",
    "Show me unresolved items",
  ],
  nutrition: [
    "What are the benefits of this food?",
    "What nutrients does it contain?",
    "Is it ultra-processed?",
  ],
  pantry: [
    "What's in my pantry?",
    "What can I make with what I have?",
    "What needs restocking?",
  ],
  diary: [
    "What did I log today?",
    "How am I tracking this week?",
    "What are my energy trends?",
  ],
  household: [
    "Who's in my household?",
    "Any shared dietary needs?",
    "What are everyone's preferences?",
  ],
  meals: [
    "What meals are available?",
    "Find me a high-protein meal",
    "What's quick to make?",
  ],
  templates: [
    "What plan templates do I have?",
    "Show me global templates",
    "What's in my private plans?",
  ],
  partners: [
    "Which stores do you support?",
    "How do I send my basket?",
    "What's the best value store?",
  ],
  analyser: [
    "What additives are in this product?",
    "What does NOVA classification mean?",
    "Is this ultra-processed?",
  ],
  floating: [
    "What's in my pantry?",
    "Summarise this week's plan",
    "What's high in protein?",
  ],
  voice: [
    "What's in my pantry?",
    "Summarise this week's plan",
    "What's high in protein?",
  ],
};

// ── API types ──────────────────────────────────────────────────────────────

interface EntityRef {
  type: string;
  id: number | string;
}

interface TurnRecord {
  id: number;
  role: "user" | "assistant" | "system";
  utterance: string;
  entityRefs?: EntityRef[] | null;
  createdAt: string;
}

interface TurnApiResponse {
  text: string;
  entityRefs: EntityRef[];
  userTurnId: number;
  assistantTurnId: number;
  conversationId: number;
  threadId: number;
  // INT36 native THA discovery responses — rendered as Companion Cards (INT37).
  discoveries?: NativeDiscoveryResponse[];
  // INT38/INT39: cross-domain guidance suggestions — "next-step" on a
  // successful turn, "recovery" (alternative actions) on an unsuccessful one.
  // Turn-level (not entity-scoped) — rendered independently of whether the
  // turn also carries Companion Cards.
  guidance?: GuidanceSuggestion[];
  guidanceKind?: "next-step" | "recovery";
  // INT41: capability-owned contextual enrichment — insights, explanations,
  // recommendations, educational content. Turn-level, purely informational
  // (no navigation, no mutation). Present only when a source capability
  // declared something to add.
  enrichment?: CompanionEnrichmentItem[];
  // INT40: Companion Action proposals — structured, executable operations
  // distinct from discoveries/guidance above. Present only when the turn had
  // something executable to propose.
  actions?: CompanionActionProposal[];
  // INT35B: the unsuccessful-turn state, present only when the turn did not
  // succeed (no-route / no-knowledge / no-results / internal-error). The honest
  // state-specific copy is already in `text`; this field lets the Companion treat
  // fallback turns consistently.
  fallbackState?: "no-route" | "no-knowledge" | "no-results" | "internal-error";
}

/**
 * CP2 — the Companion's own words for this panel, fetched from the Behaviour
 * Engine (GET /api/intelligence/companion/experience) in the user's chosen
 * voice. The client stores none of them.
 *
 * Before CP2 this file hardcoded the empty-state greeting and a
 * `TRANSPORT_ERROR_TEXT` const that was a VERBATIM COPY of the `companion`
 * personality's `internal-error` template — a second voice nobody chose, which
 * silently stayed in the default register no matter which voice the user
 * picked. Both are gone; both now arrive as registry content below.
 */
interface CompanionExperience {
  personalityId: string;
  personalityName: string;
  greeting: string;
  invitation: string;
  /**
   * INT35B: shown when the request never reaches the server — the one
   * unsuccessful path INT35's server-side states cannot classify. It IS the
   * `internal-error` disclosure, voiced; not a seventh phrasing of one fact.
   */
  transportError: string;
}

interface TurnsApiResponse {
  turns: TurnRecord[];
  threadId: number | null;
}

// ── PersonaLabel ──────────────────────────────────────────────────────────

interface PersonaLabelProps {
  surface: ConversationSurface;
}

function PersonaLabel({ surface }: PersonaLabelProps) {
  const label = SURFACE_LABEL[surface];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                 bg-primary/10 text-primary text-[11px] font-semibold tracking-wide"
      data-testid="persona-label"
    >
      <Leaf className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Companion Cards (INT37) ───────────────────────────────────────────────
//
// A discovery turn is rendered as the canonical Companion Card experience:
//
//     Summary  →  Companion Cards  →  Next Steps
//
// Cards summarise canonical THA entities and every action NAVIGATES to a
// canonical THA page — the conversation never renders raw markdown, an external
// URL, a provenance link, or edits an entity in place. The presentation view
// model is built by the pure `companion-card` module (shared, client-agnostic).

/** Icon for each action kind (per-card actions + result-level Next Steps). */
function actionIcon(kind: CompanionCardAction["kind"]) {
  switch (kind) {
    case "open":            return <BookOpen className="h-3.5 w-3.5" />;
    case "add-to-planner":  return <CalendarPlus className="h-3.5 w-3.5" />;
    case "add-to-shopping": return <ShoppingBasket className="h-3.5 w-3.5" />;
    case "view-all":        return <ArrowRight className="h-3.5 w-3.5" />;
  }
}

/** Icon for a compact canonical fact chip on a meal card. */
function factIcon(key: CompanionCardFact["key"]) {
  switch (key) {
    case "servings":   return <Users className="h-3 w-3" />;
    case "appleScore": return <Star className="h-3 w-3" />;
    case "lastCooked": return <Clock className="h-3 w-3" />;
  }
}

interface CompanionCardProps {
  card: CompanionCardView;
  onNavigate: (href: string) => void;
}

/** A single, compact, touch-friendly Companion Card. */
function CompanionCard({ card, onNavigate }: CompanionCardProps) {
  const isMeal = card.kind === "meal";
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-background/80 overflow-hidden",
        "shadow-sm",
      )}
      data-testid="companion-card"
    >
      <div className="flex gap-3 p-2.5">
        {/* Canonical THA image (meal cards only) or a domain glyph */}
        <div className="flex-shrink-0">
          {isMeal && card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.title}
              loading="lazy"
              className="w-16 h-16 rounded-lg object-cover bg-muted"
              data-testid="companion-card-image"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="h-6 w-6 text-primary/60" />
            </div>
          )}
        </div>

        {/* Title, subtitle, canonical facts */}
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold text-foreground leading-snug truncate"
            data-testid="companion-card-title"
          >
            {card.title}
          </p>
          {card.subtitle && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {card.subtitle}
            </p>
          )}
          {card.facts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {card.facts.map((fact) => (
                <span
                  key={fact.key}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
                             bg-muted text-[10px] font-medium text-foreground/70"
                  data-testid={`companion-card-fact-${fact.key}`}
                >
                  {factIcon(fact.key)}
                  {fact.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canonical THA actions — navigate, never edit in place */}
      {card.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2.5 pb-2.5">
          {card.actions.map((action, i) => (
            <button
              key={`${action.kind}-${i}`}
              onClick={() => onNavigate(action.href)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
                "text-[11px] font-medium",
                i === 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-accent/60 text-foreground/80 hover:bg-accent hover:text-foreground border border-border/40",
                "active:scale-95 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              data-testid={`companion-card-action-${action.kind}`}
            >
              {actionIcon(action.kind)}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DiscoveryBlockProps {
  discovery: NativeDiscoveryResponse;
  onNavigate: (href: string) => void;
}

/** One discovery response rendered as Companion Cards + Next Steps. */
function DiscoveryBlock({ discovery, onNavigate }: DiscoveryBlockProps) {
  const view = buildCompanionCardView(discovery);
  if (!view) return null;
  return (
    <div className="mt-2 space-y-2" data-testid="companion-card-block">
      {/* Companion Cards */}
      <div className="space-y-2">
        {view.cards.map((card, i) => (
          <CompanionCard key={i} card={card} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Next Steps (result-level actions, e.g. View All) */}
      {view.nextSteps.length > 0 && (
        <div data-testid="companion-card-next-steps">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
            Next steps
          </p>
          <div className="flex flex-wrap gap-1.5">
            {view.nextSteps.map((step, i) => (
              <button
                key={`${step.kind}-${i}`}
                onClick={() => onNavigate(step.href)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
                  "text-[11px] font-medium",
                  "bg-accent/60 text-foreground/80 hover:bg-accent hover:text-foreground",
                  "border border-border/40 active:scale-95 transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                data-testid={`companion-card-next-step-${step.kind}`}
              >
                {actionIcon(step.kind)}
                {step.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Enrichment (INT41) ────────────────────────────────────────────────────
//
// Capability-owned contextual insights, explanations, recommendations and
// educational content — attached alongside a turn's primary answer. Purely
// informational: no navigation target, no mutation, rendered in its own
// block distinct from Companion Cards (navigate-only) and Companion Actions
// (execute-only). This is the "surface key insights" allowance the Companion
// Card Experience Principle grants, applied turn-level rather than per-card.

const ENRICHMENT_KIND_LABEL: Record<CompanionEnrichmentItem["kind"], string> = {
  insight: "Insight",
  explanation: "Good to know",
  recommendation: "Suggestion",
  educational: "Learn",
};

interface EnrichmentBlockProps {
  enrichment: CompanionEnrichmentItem[];
}

function EnrichmentBlock({ enrichment }: EnrichmentBlockProps) {
  if (enrichment.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5" data-testid="companion-enrichment-block">
      {enrichment.map((item, i) => (
        <div
          key={`${item.sourceCapabilityId}-${i}`}
          className="flex items-start gap-1.5 rounded-lg border border-border/30 bg-accent/30 px-2.5 py-2"
          data-testid={`companion-enrichment-item-${item.sourceCapabilityId}-${i}`}
        >
          <Lightbulb className="h-3.5 w-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {ENRICHMENT_KIND_LABEL[item.kind]}
            </p>
            <p className="text-[12px] text-foreground/90 leading-snug">
              <span className="font-medium">{item.title}</span> — {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Guidance (INT38) ──────────────────────────────────────────────────────
//
// Turn-level cross-domain "Next Step" suggestions — rendered independently of
// whether the turn also carries Companion Cards, so even a plain Q&A answer
// can nudge the user towards the next domain worth exploring. A click both
// navigates (same canonical, in-app-path-only discipline as every other
// Companion Card action) and fires a best-effort click-through event.

interface GuidanceBlockProps {
  guidance: GuidanceSuggestion[];
  /** INT39 — "recovery" relabels the block for an unsuccessful turn's alternative actions. */
  guidanceKind?: "next-step" | "recovery";
  assistantTurnId: number;
  onNavigate: (href: string) => void;
}

function GuidanceBlock({ guidance, guidanceKind, assistantTurnId, onNavigate }: GuidanceBlockProps) {
  const actions = buildGuidanceActions(guidance);
  if (actions.length === 0) return null;

  const handleClick = (action: CompanionGuidanceAction) => {
    onNavigate(action.href);
    // Fire-and-forget click-through event — advisory observability only,
    // never blocks navigation and never affects Companion behaviour.
    apiRequest("POST", `/api/intelligence/conversation/turns/${assistantTurnId}/guidance-click`, {
      domain: action.domain,
      sourceDomain: action.sourceDomain,
      sourceCapabilityId: action.sourceCapabilityId,
      targetCapabilityId: action.targetCapabilityId,
      verb: action.verb,
    }).catch(() => {});
  };

  return (
    <div className="mt-2 space-y-1.5" data-testid="companion-guidance-block">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {guidanceKind === "recovery" ? "You could also try" : "Where to next?"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action, i) => (
          <button
            key={`${action.domain}-${i}`}
            onClick={() => handleClick(action)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
              "text-[11px] font-medium",
              "bg-primary/10 text-primary hover:bg-primary/20",
              "border border-primary/20 active:scale-95 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            data-testid={`companion-guidance-action-${action.domain}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Companion Actions (INT40) ─────────────────────────────────────────────
//
// Structured, EXECUTABLE operations the Companion performs on the user's
// behalf, always behind explicit confirmation — rendered in their own block,
// never inside or attached to a Companion Card (see companion-action.ts header
// for the architectural rationale). Confirmation UI is proportional to the
// server-computed `confirmationTier`: "light" is a single inline confirm
// button; "required"/"strong" (not reachable via the two bound capabilities
// today, but built for capabilities bound in future workstreams) show an
// explicit echo + Confirm/Cancel dialog before the confirm call is made.

interface CompanionActionRowProps {
  action: CompanionActionView;
  isRunning: boolean;
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function CompanionActionRow({ action, isRunning, disabled, onConfirm, onCancel }: CompanionActionRowProps) {
  if (action.status === "succeeded") {
    return (
      <div className="flex items-center gap-1.5 text-[12px] text-primary" data-testid={`companion-action-row-${action.id}`}>
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{action.resultSummary ?? action.label}</span>
      </div>
    );
  }
  if (action.status === "failed") {
    return (
      <div className="flex items-start gap-1.5 text-[12px] text-destructive" data-testid={`companion-action-row-${action.id}`}>
        <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <span>
          Couldn't {action.label.toLowerCase()}
          {action.errorMessage ? ` — ${action.errorMessage}` : " — please try again from the relevant page."}
        </span>
      </div>
    );
  }
  if (action.status === "cancelled") {
    return (
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60" data-testid={`companion-action-row-${action.id}`}>
        <span>Skipped — {action.label.toLowerCase()}</span>
      </div>
    );
  }
  if (isRunning) {
    return (
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground" data-testid={`companion-action-row-${action.id}`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
        <span>{action.label}…</span>
      </div>
    );
  }

  // "proposed" — awaiting confirmation, presented per its confirmation tier.
  if (action.confirmationPresentation === "dialog") {
    return (
      <div
        className="rounded-lg border border-border/40 bg-background/60 p-2 space-y-1.5"
        data-testid={`companion-action-row-${action.id}`}
      >
        <p className="text-[12px] text-foreground">{action.label}?</p>
        <div className="flex gap-1.5">
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid={`button-confirm-action-${action.id}`}
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            disabled={disabled}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-accent/60 text-foreground/70 hover:bg-accent disabled:opacity-40 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid={`button-cancel-action-${action.id}`}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5" data-testid={`companion-action-row-${action.id}`}>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
          "text-[11px] font-medium",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "active:scale-95 transition-all duration-150 disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        data-testid={`button-confirm-action-${action.id}`}
      >
        <Wand2 className="h-3.5 w-3.5" />
        {action.label}
      </button>
      <button
        onClick={onCancel}
        disabled={disabled}
        aria-label="Not now"
        className="text-[11px] text-muted-foreground/50 hover:text-foreground px-1 disabled:opacity-40 transition-colors duration-150"
        data-testid={`button-cancel-action-${action.id}`}
      >
        Not now
      </button>
    </div>
  );
}

interface CompanionActionBlockProps {
  actions: CompanionActionProposal[];
}

/**
 * One turn's Companion Action proposals, grouped into workflows (a single
 * proposal is a length-1 workflow). Confirming/cancelling updates LOCAL state
 * only — this block owns the live status of its own proposals for the rest of
 * the session; it never re-fetches the turn to pick up server state.
 */
function CompanionActionBlock({ actions: initialActions }: CompanionActionBlockProps) {
  const [liveActions, setLiveActions] = useState<CompanionActionProposal[]>(initialActions);
  const [runningId, setRunningId] = useState<number | null>(null);

  const applyUpdate = (id: number, patch: Partial<CompanionActionProposal>) => {
    setLiveActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const { mutateAsync: confirmAction } = useMutation({
    mutationFn: async (actionId: number) => {
      const res = await apiRequest("POST", `/api/intelligence/conversation/actions/${actionId}/confirm`, {});
      return res.json() as Promise<{
        id: number;
        status: ActionProposalStatus;
        resultSummary: string | null;
        errorCode: string | null;
        errorMessage: string | null;
      }>;
    },
  });
  const { mutateAsync: cancelAction } = useMutation({
    mutationFn: async (actionId: number) => {
      const res = await apiRequest("POST", `/api/intelligence/conversation/actions/${actionId}/cancel`, {});
      return res.json() as Promise<{ id: number; status: ActionProposalStatus }>;
    },
  });

  // Runs one action's confirmation and waits for its outcome before returning —
  // this IS the progress-reporting mechanism for a multi-action workflow: each
  // step is awaited in order so the UI can show "Step X of N" as it advances,
  // and a failure on one step never blocks the next (partial completion).
  const runOne = async (actionId: number) => {
    setRunningId(actionId);
    try {
      const result = await confirmAction(actionId);
      applyUpdate(actionId, {
        status: result.status,
        resultSummary: result.resultSummary,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
    } catch {
      applyUpdate(actionId, {
        status: "failed",
        errorCode: "transport_error",
        errorMessage: "Something went wrong confirming this — please try again.",
      });
    } finally {
      setRunningId(null);
    }
  };

  const handleCancel = async (actionId: number) => {
    try {
      const result = await cancelAction(actionId);
      applyUpdate(actionId, { status: result.status });
    } catch {
      /* leave as proposed — the user can retry the confirm or cancel */
    }
  };

  const runWorkflow = async (actionIds: number[]) => {
    for (const id of actionIds) {
      await runOne(id);
    }
  };

  const workflows = buildCompanionActionWorkflowViews(liveActions);
  if (workflows.length === 0) return null;

  return (
    <div className="mt-2 space-y-2.5" data-testid="companion-action-block">
      {workflows.map((workflow) => {
        const outcome = buildWorkflowOutcomeSummary(workflow);
        const pendingIds = workflow.actions.filter((a) => a.status === "proposed").map((a) => a.id);
        return (
          <div
            key={workflow.workflowId}
            className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 space-y-2"
            data-testid="companion-action-workflow"
          >
            {workflow.totalCount > 1 && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Guided workflow · Step {Math.min(workflow.resolvedCount + 1, workflow.totalCount)} of {workflow.totalCount}
                </p>
                {pendingIds.length > 1 && (
                  <button
                    onClick={() => runWorkflow(pendingIds)}
                    disabled={runningId != null}
                    className="text-[11px] font-medium text-primary hover:underline disabled:opacity-40 flex-shrink-0"
                    data-testid="button-confirm-workflow"
                  >
                    Confirm all
                  </button>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              {workflow.actions.map((action) => (
                <CompanionActionRow
                  key={action.id}
                  action={action}
                  isRunning={runningId === action.id}
                  disabled={runningId != null}
                  onConfirm={() => runOne(action.id)}
                  onCancel={() => handleCancel(action.id)}
                />
              ))}
            </div>
            {outcome && (
              <p
                className={cn(
                  "text-[11px] font-medium",
                  workflow.isPartialCompletion
                    ? "text-amber-600"
                    : workflow.failedCount > 0
                      ? "text-destructive"
                      : "text-primary",
                )}
                data-testid="companion-action-outcome"
              >
                {outcome}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Feedback (INT38) ──────────────────────────────────────────────────────
//
// A simple 👍/👎 on every real assistant turn. Anonymous, advisory-only —
// submitting feedback never changes what the Companion says or how it routes.
// A 👎 reveals an optional, closed set of reason chips.

const FEEDBACK_REASONS: { code: string; label: string }[] = [
  { code: "not_relevant", label: "Didn't answer my question" },
  { code: "inaccurate", label: "Information seemed wrong" },
  { code: "already_knew", label: "I already knew this" },
  { code: "too_generic", label: "Too generic" },
  { code: "other", label: "Other" },
];

interface FeedbackControlsProps {
  turnId: number;
}

function FeedbackControls({ turnId }: FeedbackControlsProps) {
  const [submitted, setSubmitted] = useState<"up" | "down" | null>(null);
  const [showReasons, setShowReasons] = useState(false);

  const { mutate: sendFeedback } = useMutation({
    mutationFn: async (body: { rating: "up" | "down"; reasonCode?: string }) => {
      await apiRequest("POST", `/api/intelligence/conversation/turns/${turnId}/feedback`, body);
    },
  });

  if (submitted) {
    return (
      <p className="mt-1.5 text-[10px] text-muted-foreground/50" data-testid="text-feedback-thanks">
        Thanks for the feedback.
      </p>
    );
  }

  const buttonClass = (active: boolean) =>
    cn(
      "inline-flex items-center justify-center w-6 h-6 rounded-md",
      "text-muted-foreground/50 hover:text-foreground hover:bg-accent",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active && "text-foreground bg-accent",
    );

  return (
    <div className="mt-1.5" data-testid="feedback-controls">
      {!showReasons ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSubmitted("up");
              sendFeedback({ rating: "up" });
            }}
            aria-label="Helpful"
            className={buttonClass(false)}
            data-testid="button-feedback-up"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowReasons(true)}
            aria-label="Not helpful"
            className={buttonClass(false)}
            data-testid="button-feedback-down"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1" data-testid="feedback-reasons">
          {FEEDBACK_REASONS.map((r) => (
            <button
              key={r.code}
              onClick={() => {
                setSubmitted("down");
                sendFeedback({ rating: "down", reasonCode: r.code });
              }}
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-medium",
                "bg-accent/60 text-foreground/70 hover:bg-accent hover:text-foreground",
                "border border-border/30 transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              data-testid={`button-feedback-reason-${r.code}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TurnBubble ────────────────────────────────────────────────────────────

interface TurnBubbleProps {
  turn: TurnRecord;
  /** Discovery responses for this assistant turn → rendered as Companion Cards. */
  discoveries?: NativeDiscoveryResponse[];
  /** INT38/INT39 cross-domain guidance suggestions for this assistant turn. */
  guidance?: GuidanceSuggestion[];
  guidanceKind?: "next-step" | "recovery";
  /** INT41 capability-owned contextual enrichment for this assistant turn. */
  enrichment?: CompanionEnrichmentItem[];
  /** INT40 Companion Action proposals for this assistant turn. */
  actions?: CompanionActionProposal[];
  onNavigate: (href: string) => void;
}

function TurnBubble({ turn, discoveries, guidance, guidanceKind, enrichment, actions, onNavigate }: TurnBubbleProps) {
  const isUser = turn.role === "user";
  const hasDiscoveries = !isUser && Array.isArray(discoveries) && discoveries.length > 0;
  const hasGuidance = !isUser && Array.isArray(guidance) && guidance.length > 0;
  const hasEnrichment = !isUser && Array.isArray(enrichment) && enrichment.length > 0;
  const hasActions = !isUser && Array.isArray(actions) && actions.length > 0;
  // Only a real, server-persisted assistant turn (positive id) can carry
  // feedback — optimistic transport-error bubbles use negative placeholder ids.
  const isRealAssistantTurn = !isUser && turn.id > 0;

  return (
    <div
      className={cn(
        "flex gap-2.5 items-end",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      data-testid={`turn-bubble-${turn.id}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center self-start mt-0.5">
          <Leaf className="h-3.5 w-3.5 text-primary" />
        </div>
      )}

      {/* Bubble + (assistant) companion cards */}
      <div className={cn(isUser ? "max-w-[82%]" : "flex-1 min-w-0")}>
        {/* Summary text — markdown/URLs suppressed on discovery turns */}
        <div
          className={cn(
            "px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary/10 text-foreground rounded-2xl rounded-tr-sm"
              : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border/30",
            !isUser && "inline-block max-w-full",
          )}
        >
          {isUser ? turn.utterance : sanitizeSummary(turn.utterance)}

          {/* Entity pills — assistant turns WITHOUT companion cards (legacy shape) */}
          {!isUser &&
            !hasDiscoveries &&
            Array.isArray(turn.entityRefs) &&
            turn.entityRefs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(turn.entityRefs as EntityRef[]).map((ref, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                               bg-secondary/20 text-secondary-foreground text-[10px] font-medium"
                    data-testid={`entity-pill-${ref.type}-${ref.id}`}
                  >
                    {ref.type} #{ref.id}
                  </span>
                ))}
              </div>
            )}
        </div>

        {/* Companion Cards + Next Steps */}
        {hasDiscoveries &&
          discoveries!.map((discovery, i) => (
            <DiscoveryBlock key={i} discovery={discovery} onNavigate={onNavigate} />
          ))}

        {/* INT41 — capability-owned contextual enrichment: informational only */}
        {hasEnrichment && <EnrichmentBlock enrichment={enrichment!} />}

        {/* INT40 — Companion Actions: distinct from Companion Cards, always confirmed */}
        {hasActions && <CompanionActionBlock actions={actions!} />}

        {/* INT38/INT39 — cross-domain guidance, independent of Companion Cards */}
        {hasGuidance && (
          <GuidanceBlock guidance={guidance!} guidanceKind={guidanceKind} assistantTurnId={turn.id} onNavigate={onNavigate} />
        )}

        {/* INT38 — 👍/👎 feedback on every real assistant turn */}
        {isRealAssistantTurn && <FeedbackControls turnId={turn.id} />}
      </div>
    </div>
  );
}

// Loading bubble — three pulsing dots
function LoadingBubble() {
  return (
    <div className="flex gap-2.5 items-end" data-testid="turn-bubble-loading">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
        <Leaf className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="px-3.5 py-3 bg-muted rounded-2xl rounded-tl-sm border border-border/30">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ConversationThread ────────────────────────────────────────────────────

interface ConversationThreadProps {
  turns: TurnRecord[];
  isLoading: boolean;
  isPending: boolean;
  /** Companion Card discoveries keyed by assistant turn id (ephemeral, this session). */
  discoveriesByTurn: Record<number, NativeDiscoveryResponse[]>;
  /** INT38 guidance suggestions keyed by assistant turn id (ephemeral, this session). */
  guidanceByTurn: Record<number, GuidanceSuggestion[]>;
  /** INT39 guidance kind ("next-step" | "recovery") keyed by assistant turn id. */
  guidanceKindByTurn: Record<number, "next-step" | "recovery">;
  /** INT41 capability-owned contextual enrichment keyed by assistant turn id. */
  enrichmentByTurn: Record<number, CompanionEnrichmentItem[]>;
  /** INT40 Companion Action proposals keyed by assistant turn id. */
  actionsByTurn: Record<number, CompanionActionProposal[]>;
  onNavigate: (href: string) => void;
}

function ConversationThread({
  turns,
  isLoading,
  isPending,
  discoveriesByTurn,
  guidanceByTurn,
  guidanceKindByTurn,
  enrichmentByTurn,
  actionsByTurn,
  onNavigate,
}: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, isPending]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      data-testid="conversation-thread"
    >
      {turns.map((turn) => (
        <TurnBubble
          key={turn.id}
          turn={turn}
          discoveries={discoveriesByTurn[turn.id]}
          guidance={guidanceByTurn[turn.id]}
          guidanceKind={guidanceKindByTurn[turn.id]}
          enrichment={enrichmentByTurn[turn.id]}
          actions={actionsByTurn[turn.id]}
          onNavigate={onNavigate}
        />
      ))}
      {isPending && <LoadingBubble />}
      <div ref={bottomRef} />
    </div>
  );
}

// ── QuickActions ──────────────────────────────────────────────────────────

interface QuickActionsProps {
  surface: ConversationSurface;
  onSelect: (utterance: string) => void;
}

function QuickActions({ surface, onSelect }: QuickActionsProps) {
  const actions = QUICK_ACTIONS[surface];
  return (
    <div className="px-4 py-3" data-testid="quick-actions">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
        Quick questions
      </p>
      <div className="flex flex-col gap-1.5">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => onSelect(action)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm",
              "bg-accent/50 hover:bg-accent text-foreground/80 hover:text-foreground",
              "border border-border/30 hover:border-border/60",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            data-testid={`quick-action-${action.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AssistantInput ────────────────────────────────────────────────────────

interface AssistantInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

function AssistantInput({ value, onChange, onSubmit, isPending }: AssistantInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isPending) onSubmit();
    }
  };

  return (
    <div
      className="border-t border-border/20 px-3 py-3 bg-background/80 backdrop-blur-sm"
      data-testid="assistant-input-area"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Apple anything…"
          rows={1}
          disabled={isPending}
          className={cn(
            "flex-1 resize-none rounded-xl px-3 py-2.5 text-sm",
            "bg-muted/60 border border-border/40 text-foreground",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring/30",
            "transition-colors duration-150",
            "disabled:opacity-50",
          )}
          data-testid="input-assistant-message"
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isPending}
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          data-testid="button-submit-assistant"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground/40 text-center">
        Apple can suggest a few actions — nothing changes until you confirm.
      </p>
    </div>
  );
}

// ── FloatingAssistant ─────────────────────────────────────────────────────

export default function FloatingAssistant() {
  const surface = useSurface();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // PHASE5D — the pointers the surface the household is actually looking at has
  // published (the planner week on screen, the meal card open, the food being
  // read). Before PHASE5D this was `{ currentPath }`, a field the route does not
  // read — so the Context Frame's pointer slots arrived empty on every turn and
  // "it" / "this" had nothing to resolve against (TIP3 §5.3).
  const surfaceHints = useCompanionSurfaceHints();
  // PHASE5E — a question a surface is asking on the household's behalf, if any.
  const { ask, clearAsk } = usePendingAsk();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  // Optimistic turns added before the server responds
  const [optimisticTurns, setOptimisticTurns] = useState<TurnRecord[]>([]);
  const nextOptimisticId = useRef(-1);
  // INT37: native discovery responses, keyed by assistant turn id, rendered as
  // Companion Cards. Derived-not-stored (INT36/TIP3) — held in session memory
  // only, never persisted; canonical THA pages own the durable presentation.
  const [discoveriesByTurn, setDiscoveriesByTurn] = useState<
    Record<number, NativeDiscoveryResponse[]>
  >({});
  // INT38: cross-domain guidance suggestions, keyed by assistant turn id, same
  // ephemeral session-memory discipline as discoveriesByTurn above.
  const [guidanceByTurn, setGuidanceByTurn] = useState<
    Record<number, GuidanceSuggestion[]>
  >({});
  // INT39: which guidance mode ("next-step" | "recovery") each turn's suggestions were built in.
  const [guidanceKindByTurn, setGuidanceKindByTurn] = useState<
    Record<number, "next-step" | "recovery">
  >({});
  // INT41: capability-owned contextual enrichment, keyed by assistant turn id,
  // same ephemeral session-memory discipline as discoveriesByTurn/guidanceByTurn.
  const [enrichmentByTurn, setEnrichmentByTurn] = useState<
    Record<number, CompanionEnrichmentItem[]>
  >({});
  // INT40: Companion Action proposals, keyed by assistant turn id, same ephemeral
  // session-memory discipline as discoveriesByTurn/guidanceByTurn above. Live
  // status updates (confirm/cancel) are owned by CompanionActionBlock's own local
  // state, not re-synced back here.
  const [actionsByTurn, setActionsByTurn] = useState<
    Record<number, CompanionActionProposal[]>
  >({});

  // Navigate to a canonical THA page and close the assistant panel.
  const handleNavigate = useCallback(
    (href: string) => {
      setIsOpen(false);
      navigate(href);
    },
    [navigate],
  );

  // Fetch existing turns when the panel opens
  const { data: turnsData, isLoading: isTurnsLoading } = useQuery<TurnsApiResponse>({
    queryKey: ["/api/intelligence/conversation/turns"],
    enabled: isOpen,
    staleTime: 0,
  });

  // CP2: the Companion's own words for this panel, in the user's chosen voice.
  // Every string below comes from the Personality Registry via the Behaviour
  // Engine — the client stores none of them. Fetched when the panel opens, so
  // it is already resolved by the time a turn can fail in transport.
  const { data: experience } = useQuery<CompanionExperience>({
    queryKey: ["/api/intelligence/companion/experience"],
    enabled: isOpen,
  });

  // Merge server turns with optimistic turns (server wins on ID overlap)
  const serverTurns: TurnRecord[] = turnsData?.turns ?? [];
  const serverIds = new Set(serverTurns.map((t) => t.id));
  const pendingOptimistic = optimisticTurns.filter((t) => !serverIds.has(t.id));
  const allTurns: TurnRecord[] = [...serverTurns, ...pendingOptimistic];

  const hasHistory = allTurns.length > 0;

  // CP2: set only when a turn failed in transport AND the Companion's voice was
  // never fetched, so no registry text exists to answer with. Renders platform
  // chrome, never an assistant turn — see the mutation's onError below.
  const [transportFailed, setTransportFailed] = useState(false);

  // Submit turn mutation
  //
  // PHASE5E — the variable is now `{ utterance, askHints? }` rather than a bare string.
  // `askHints` carries the pointers that belong to ONE question (today:
  // `selectedOpportunityId`, set only when a household presses a specific card's "Why
  // this?" button). They are merged over — never into — the surface's published pointers,
  // so a question's pointer lives exactly as long as the question and cannot leak into
  // the next turn.
  const { mutate: sendTurn, isPending } = useMutation<TurnApiResponse, Error, TurnRequest>({
    mutationFn: async ({ utterance, askHints }: TurnRequest) => {
      const res = await apiRequest("POST", "/api/intelligence/conversation/turn", {
        utterance,
        surface,
        // Pointer IDs only — the server re-reads every one of them from its owning
        // service before use. A hint says where the household is looking; it never
        // says what is true (TIP3 §5.4 — the non-duplication guarantee).
        surfaceHints: { ...surfaceHints, ...askHints },
      });
      return res.json() as Promise<TurnApiResponse>;
    },
    onMutate: ({ utterance }: TurnRequest) => {
      setTransportFailed(false);
      // Optimistic user turn
      const id = nextOptimisticId.current--;
      const userTurn: TurnRecord = {
        id,
        role: "user",
        utterance,
        createdAt: new Date().toISOString(),
      };
      setOptimisticTurns((prev) => [...prev, userTurn]);
    },
    onSuccess: (data) => {
      // INT37: capture this turn's discovery responses, keyed by the real
      // assistant turn id, so they survive the /turns refetch and render as
      // Companion Cards against the server turn of the same id.
      if (data.assistantTurnId != null && Array.isArray(data.discoveries) && data.discoveries.length > 0) {
        setDiscoveriesByTurn((prev) => ({
          ...prev,
          [data.assistantTurnId]: data.discoveries!,
        }));
      }
      // INT38/INT39: capture this turn's guidance suggestions + kind the same way.
      if (data.assistantTurnId != null && Array.isArray(data.guidance) && data.guidance.length > 0) {
        setGuidanceByTurn((prev) => ({
          ...prev,
          [data.assistantTurnId]: data.guidance!,
        }));
        if (data.guidanceKind) {
          setGuidanceKindByTurn((prev) => ({
            ...prev,
            [data.assistantTurnId]: data.guidanceKind!,
          }));
        }
      }
      // INT41: capture this turn's contextual enrichment the same way.
      if (data.assistantTurnId != null && Array.isArray(data.enrichment) && data.enrichment.length > 0) {
        setEnrichmentByTurn((prev) => ({
          ...prev,
          [data.assistantTurnId]: data.enrichment!,
        }));
      }
      // INT40: capture this turn's Companion Action proposals the same way.
      if (data.assistantTurnId != null && Array.isArray(data.actions) && data.actions.length > 0) {
        setActionsByTurn((prev) => ({
          ...prev,
          [data.assistantTurnId]: data.actions!,
        }));
      }
      // Refresh from server — clears optimistic turns cleanly
      queryClient.invalidateQueries({
        queryKey: ["/api/intelligence/conversation/turns"],
      });
      setOptimisticTurns([]);
    },
    onError: () => {
      // INT35B: keep the user's turn and append an honest assistant error bubble
      // (rather than silently dropping the question), so a transport failure is
      // handled consistently with the INT35 internal-error fallback.
      //
      // CP2: the bubble's words are registry content in the user's voice. If
      // the experience payload never loaded we do NOT know the user's voice, so
      // we must not put words in the Companion's mouth (INT21 §10 — no voiced
      // surface presented as voiced when no transform ran). We surface a plain,
      // clearly platform-owned connection notice instead.
      const voicedError = experience?.transportError;
      if (!voicedError) {
        setTransportFailed(true);
        return;
      }
      const id = nextOptimisticId.current--;
      const errorTurn: TurnRecord = {
        id,
        role: "assistant",
        utterance: voicedError,
        createdAt: new Date().toISOString(),
      };
      setOptimisticTurns((prev) => [...prev, errorTurn]);
    },
  });

  const handleSubmit = useCallback(() => {
    const utterance = inputValue.trim();
    if (!utterance || isPending) return;
    setInputValue("");
    sendTurn({ utterance });
  }, [inputValue, isPending, sendTurn]);

  const handleQuickAction = useCallback(
    (utterance: string) => {
      if (isPending) return;
      sendTurn({ utterance });
    },
    [isPending, sendTurn],
  );

  // PHASE5E — a surface asked the Companion a question ("Why this?" on an ambient
  // opportunity card). Open, ask it, and clear it.
  //
  // The question enters the thread as an ordinary user turn, through the ordinary
  // gateway, because that is what it is: the household asked, and a surface typed on
  // their behalf. There is no second response path and no privileged answer — which is
  // precisely why the answer can be trusted.
  //
  // `clearAsk()` runs immediately, so one press asks exactly once: an ask can never be
  // replayed by a re-render, and a stale ask can never fire when the panel is next opened.
  useEffect(() => {
    if (!ask) return;
    clearAsk();
    if (isPending) return;
    setIsOpen(true);
    sendTurn({ utterance: ask.utterance, askHints: ask.hints });
  }, [ask, clearAsk, isPending, sendTurn]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <>
      {/* ── Trigger button ───────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close Apple assistant" : "Open Apple assistant"}
        className={cn(
          // PX1-W1 (fnd-px-fab-covers-nav): the FAB sat at bottom-6 z-50 — the
          // same z as the BottomNav, painted later, covering the last nav item
          // (Analyser) and meal-detail's floating Save. It now clears the nav's
          // reserved zone (.main-safe: safe-area + 80px) and yields z to it.
          "fixed right-6 z-40 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)]",
          "w-12 h-12 rounded-full",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
          "flex items-center justify-center",
          "hover:bg-primary/90 active:scale-95",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isOpen && "rotate-0",
        )}
        data-testid="button-open-assistant"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Drawer panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — mobile only */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 sm:hidden"
              onClick={() => setIsOpen(false)}
              data-testid="assistant-backdrop"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 z-50",
                "w-full sm:w-[380px]",
                "flex flex-col",
                "bg-background/97 backdrop-blur-md",
                "border-l border-border/30",
                "shadow-2xl",
              )}
              data-testid="assistant-panel"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <Leaf className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold text-foreground"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Apple
                    </p>
                    <PersonaLabel surface={surface} />
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    "text-muted-foreground hover:text-foreground hover:bg-accent",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  data-testid="button-close-assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Thread or quick actions */}
              {hasHistory || isPending ? (
                <ConversationThread
                  turns={allTurns}
                  isLoading={isTurnsLoading}
                  isPending={isPending}
                  discoveriesByTurn={discoveriesByTurn}
                  guidanceByTurn={guidanceByTurn}
                  guidanceKindByTurn={guidanceKindByTurn}
                  enrichmentByTurn={enrichmentByTurn}
                  actionsByTurn={actionsByTurn}
                  onNavigate={handleNavigate}
                />
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col justify-end">
                  {!isTurnsLoading && (
                    <>
                      {/* CP2 — empty-state greeting, in the user's chosen voice.
                          Rendered only once the registry text has arrived: an
                          empty panel is honest, an invented greeting is not. */}
                      {experience && (
                        <div className="px-4 pt-6 pb-2 text-center">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Leaf className="h-6 w-6 text-primary/70" />
                          </div>
                          <p
                            className="text-sm font-medium text-foreground"
                            style={{ fontFamily: "var(--font-display)" }}
                            data-testid="text-assistant-greeting"
                          >
                            {experience.greeting}
                          </p>
                          <p
                            className="text-xs text-muted-foreground mt-1"
                            data-testid="text-assistant-invitation"
                          >
                            {experience.invitation}
                          </p>
                        </div>
                      )}
                      <QuickActions
                        surface={surface}
                        onSelect={handleQuickAction}
                      />
                    </>
                  )}
                </div>
              )}

              {/* CP2 — platform chrome, deliberately NOT the Companion's voice.
                  Shown only when a turn failed in transport before the user's
                  voice could be fetched, so no registry text exists to say it
                  in. Speaking here would be a voice nobody chose. */}
              {transportFailed && (
                <p
                  className="px-4 pb-2 text-xs text-destructive"
                  data-testid="text-assistant-transport-error"
                >
                  Couldn't reach the assistant. Check your connection and try again.
                </p>
              )}

              {/* Input */}
              <AssistantInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                isPending={isPending}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
