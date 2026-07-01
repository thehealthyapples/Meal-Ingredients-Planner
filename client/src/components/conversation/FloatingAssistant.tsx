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
import { MessageSquare, X, Send, Leaf, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

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

// ── TurnBubble ────────────────────────────────────────────────────────────

interface TurnBubbleProps {
  turn: TurnRecord;
}

function TurnBubble({ turn }: TurnBubbleProps) {
  const isUser = turn.role === "user";

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
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <Leaf className="h-3.5 w-3.5 text-primary" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary/10 text-foreground rounded-2xl rounded-tr-sm"
            : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border/30",
        )}
      >
        {turn.utterance}

        {/* Entity pills — shown only on assistant turns with refs */}
        {!isUser &&
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
}

function ConversationThread({ turns, isLoading, isPending }: ConversationThreadProps) {
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
        <TurnBubble key={turn.id} turn={turn} />
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
        Apple reads your data — can't make changes yet.
      </p>
    </div>
  );
}

// ── FloatingAssistant ─────────────────────────────────────────────────────

export default function FloatingAssistant() {
  const surface = useSurface();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  // Optimistic turns added before the server responds
  const [optimisticTurns, setOptimisticTurns] = useState<TurnRecord[]>([]);
  const nextOptimisticId = useRef(-1);

  // Fetch existing turns when the panel opens
  const { data: turnsData, isLoading: isTurnsLoading } = useQuery<TurnsApiResponse>({
    queryKey: ["/api/intelligence/conversation/turns"],
    enabled: isOpen,
    staleTime: 0,
  });

  // Merge server turns with optimistic turns (server wins on ID overlap)
  const serverTurns: TurnRecord[] = turnsData?.turns ?? [];
  const serverIds = new Set(serverTurns.map((t) => t.id));
  const pendingOptimistic = optimisticTurns.filter((t) => !serverIds.has(t.id));
  const allTurns: TurnRecord[] = [...serverTurns, ...pendingOptimistic];

  const hasHistory = allTurns.length > 0;

  // Submit turn mutation
  const { mutate: sendTurn, isPending } = useMutation<TurnApiResponse, Error, string>({
    mutationFn: async (utterance: string) => {
      const res = await apiRequest("POST", "/api/intelligence/conversation/turn", {
        utterance,
        surface,
        surfaceHints: { currentPath: window.location.pathname },
      });
      return res.json() as Promise<TurnApiResponse>;
    },
    onMutate: (utterance: string) => {
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
    onSuccess: () => {
      // Refresh from server — clears optimistic turns cleanly
      queryClient.invalidateQueries({
        queryKey: ["/api/intelligence/conversation/turns"],
      });
      setOptimisticTurns([]);
    },
    onError: () => {
      // Remove last optimistic turn on error
      setOptimisticTurns((prev) => prev.slice(0, -1));
    },
  });

  const handleSubmit = useCallback(() => {
    const utterance = inputValue.trim();
    if (!utterance || isPending) return;
    setInputValue("");
    sendTurn(utterance);
  }, [inputValue, isPending, sendTurn]);

  const handleQuickAction = useCallback(
    (utterance: string) => {
      if (isPending) return;
      sendTurn(utterance);
    },
    [isPending, sendTurn],
  );

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
          "fixed bottom-6 right-6 z-50",
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
                />
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col justify-end">
                  {!isTurnsLoading && (
                    <>
                      {/* Empty-state greeting */}
                      <div className="px-4 pt-6 pb-2 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Leaf className="h-6 w-6 text-primary/70" />
                        </div>
                        <p
                          className="text-sm font-medium text-foreground"
                          style={{ fontFamily: "var(--font-display)" }}
                          data-testid="text-assistant-greeting"
                        >
                          Hi, I'm Apple!
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ask me anything about your food and plans.
                        </p>
                      </div>
                      <QuickActions
                        surface={surface}
                        onSelect={handleQuickAction}
                      />
                    </>
                  )}
                </div>
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
