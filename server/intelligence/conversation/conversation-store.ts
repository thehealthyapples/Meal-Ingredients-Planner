/**
 * conversation-store.ts — INT18 Phase 0
 * ======================================
 * The single owner of the `conversations`, `conversation_threads`, and
 * `conversation_turns` tables. Exposes typed CRUD — no business logic.
 *
 * POINTER DISCIPLINE (TIP3 Risk R1): this store records IDs/references only.
 * No business rows (planner entries, shopping items, etc.) are ever stored here.
 * `entityRefs` = [{type,id}] pointers. `contextFrameRef` = snapshot of IDs.
 *
 * A separate `IConversationStore` interface (per INT18 Risk R5) keeps the
 * database coupling out of tests. `InMemoryConversationStore` implements the
 * same interface for unit testing without a real database.
 *
 * ConversationStore is NOT part of IStorage. It is independently injectable
 * into whatever module needs it (in Phase 1: the Conversation Gateway).
 *
 * Run tests: npx tsx server/tests/test-intelligence-conversation-store.ts
 */

import { pool } from "../../db.js";
import type {
  Conversation,
  ConversationThread,
  ConversationTurn,
} from "../../../shared/schema.js";

// ---------------------------------------------------------------------------
// Public domain types
// ---------------------------------------------------------------------------

export type ConversationSurface =
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

export type ConversationRole = "user" | "assistant" | "system";

/**
 * A typed reference to an entity the conversation mentioned.
 * Powers pronoun resolution ("it", "that meal") in follow-up turns.
 * Stores IDs only — never inline entity data.
 */
export interface EntityRef {
  type: string;         // "meal" | "planner_week" | "planner_day" | "shopping_list" | "food" | …
  id:   number | string;
}

/**
 * Input shape for appending a new turn.
 * All JSONB fields accept plain objects — the store serialises them.
 */
export interface NewConversationTurn {
  role:             ConversationRole;
  surface:          ConversationSurface;
  utterance:        string;
  /** Null for pure Q&A turns. {verb, capabilityId} for actioned intents. */
  resolvedIntent?:  Record<string, unknown> | null;
  /** Snapshot of POINTER IDs used this turn — not the data itself. */
  contextFrameRef?: Record<string, unknown> | null;
  /** [{type, id}] pointers for pronoun resolution. Default: []. */
  entityRefs?:      EntityRef[];
  /** {status, message} only — never the mutated business row. */
  outcomeRef?:      Record<string, unknown> | null;
  /**
   * INT39 — the honest unsuccessful-turn state (no-route / no-knowledge /
   * no-results / internal-error), set on assistant turns only. Null/omitted
   * for a successful/grounded turn.
   */
  fallbackState?:   string | null;
}

/**
 * INT39 — the minimal per-turn shape Goal Completion analytics read: enough
 * to derive "intent recognised" / "capability executed" (from resolvedIntent
 * + fallbackState) and "recovery after a failed conversation" (by walking
 * turns within the same thread in order). No utterance, no entity data, no
 * user/household id — the same privacy discipline as every other companion
 * analytics read.
 */
export interface GoalSignalTurn {
  readonly id: number;
  readonly threadId: number;
  readonly createdAt: Date;
  readonly fallbackState: string | null;
  readonly resolvedIntent: { capabilities?: { capabilityId: string; verb: string; status: string }[] } | null;
}

// ---------------------------------------------------------------------------
// IConversationStore interface
// ---------------------------------------------------------------------------

export interface IConversationStore {
  /**
   * Lazily get or create the single conversation for a user.
   * Safe to call on every request — idempotent.
   */
  getOrCreateConversation(userId: number): Promise<Conversation>;

  /**
   * Open a new thread within a conversation.
   * A thread represents a context-coherent stretch (e.g. one planning session).
   * Does NOT auto-close the previous thread — call closeThread() explicitly.
   */
  openThread(conversationId: number, surface: ConversationSurface): Promise<ConversationThread>;

  /**
   * Return the most recently opened thread that is still active (closedAt is null).
   * Returns null if no active thread exists.
   */
  getActiveThread(conversationId: number): Promise<ConversationThread | null>;

  /**
   * Close a thread. Idempotent — closing an already-closed thread is a no-op.
   */
  closeThread(threadId: number): Promise<void>;

  /**
   * Append a turn to a thread. Returns the persisted turn.
   * Does NOT validate role or surface — callers must supply valid values.
   */
  appendTurn(threadId: number, turn: NewConversationTurn): Promise<ConversationTurn>;

  /**
   * Return the most recent `limit` turns for a thread, oldest-first.
   * Bounded by default to 20 turns (INT18 Risk R8 — unbounded growth).
   */
  getRecentTurns(threadId: number, limit?: number): Promise<ConversationTurn[]>;

  /**
   * Return the entityRefs from the most recent turn in the thread that has
   * a non-empty entityRefs array. Used for pronoun/follow-up resolution.
   * Returns [] if no such turn exists.
   */
  getLastEntityRefs(threadId: number): Promise<EntityRef[]>;

  /**
   * List threads for a conversation, most-recently-opened first.
   * Bounded to `limit` rows (default 20).
   */
  listThreads(conversationId: number, limit?: number): Promise<ConversationThread[]>;

  /**
   * Count turns created at or after `since`, optionally filtered by role.
   * A pure aggregate (COUNT only) — no utterance content, no user/household id
   * is ever returned. INT35C reads this as the denominator for Companion
   * "understanding rate" / "successful conversation rate" metrics, since the
   * INT35 miss log records only failures and has no volume of its own.
   */
  countTurnsSince(since: Date, role?: ConversationRole): Promise<number>;

  /**
   * Resolve the owning user (and role) of a turn — the ownership check INT38
   * feedback/guidance-click routes use before accepting a write scoped to that
   * turn. Returns null when the turn does not exist. Read-only, no business
   * data returned.
   */
  getTurnOwner(turnId: number): Promise<{ userId: number; role: ConversationRole } | null>;

  /**
   * OBS2 — resolve a turn's observation correlation identifiers: its thread id
   * (the Observation Engine's sessionId for conversation telemetry) and, for
   * an assistant turn, the user turn that started the exchange (the Observation
   * Engine's turnId). Read-only ids only — no utterance, no business data —
   * used solely so the user-feedback observation can join the Execution
   * Timeline of the turn it rates. Returns null when the turn does not exist.
   */
  getTurnObservationRef(
    turnId: number,
  ): Promise<{ threadId: number; precedingUserTurnId: number | null } | null>;

  /**
   * INT39 — the assistant-turn Goal Completion signal rows, optionally bounded
   * to turns created at/after `since`, ordered by thread then time so callers
   * can walk each thread's turn sequence (recovery-after-failure analytics).
   * Read-only, no business data returned.
   */
  listAssistantTurnGoalSignals(since?: Date): Promise<GoalSignalTurn[]>;
}

// ---------------------------------------------------------------------------
// DatabaseConversationStore — production implementation
// ---------------------------------------------------------------------------

const DEFAULT_RECENT_TURNS_LIMIT = 20;

export class DatabaseConversationStore implements IConversationStore {
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<Conversation>(
        `INSERT INTO conversations (user_id, created_at, updated_at)
         VALUES ($1, NOW(), NOW())
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [userId],
      );
      return rows[0];
    } finally {
      client.release();
    }
  }

  async openThread(
    conversationId: number,
    surface: ConversationSurface,
  ): Promise<ConversationThread> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<ConversationThread>(
        `INSERT INTO conversation_threads (conversation_id, surface, opened_at)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [conversationId, surface],
      );
      return rows[0];
    } finally {
      client.release();
    }
  }

  async getActiveThread(
    conversationId: number,
  ): Promise<ConversationThread | null> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<ConversationThread>(
        `SELECT * FROM conversation_threads
         WHERE conversation_id = $1 AND closed_at IS NULL
         ORDER BY opened_at DESC
         LIMIT 1`,
        [conversationId],
      );
      return rows[0] ?? null;
    } finally {
      client.release();
    }
  }

  async closeThread(threadId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE conversation_threads SET closed_at = NOW()
         WHERE id = $1 AND closed_at IS NULL`,
        [threadId],
      );
    } finally {
      client.release();
    }
  }

  async appendTurn(
    threadId: number,
    turn: NewConversationTurn,
  ): Promise<ConversationTurn> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<ConversationTurn>(
        `INSERT INTO conversation_turns
           (thread_id, role, surface, utterance,
            resolved_intent, context_frame_ref, entity_refs, outcome_ref, fallback_state, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING *`,
        [
          threadId,
          turn.role,
          turn.surface,
          turn.utterance,
          turn.resolvedIntent  != null ? JSON.stringify(turn.resolvedIntent)  : null,
          turn.contextFrameRef != null ? JSON.stringify(turn.contextFrameRef) : null,
          JSON.stringify(turn.entityRefs ?? []),
          turn.outcomeRef != null ? JSON.stringify(turn.outcomeRef) : null,
          turn.fallbackState ?? null,
        ],
      );
      return rows[0];
    } finally {
      client.release();
    }
  }

  async getRecentTurns(
    threadId: number,
    limit = DEFAULT_RECENT_TURNS_LIMIT,
  ): Promise<ConversationTurn[]> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<ConversationTurn>(
        `SELECT * FROM (
           SELECT * FROM conversation_turns
           WHERE thread_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         ) t ORDER BY created_at ASC`,
        [threadId, limit],
      );
      return rows;
    } finally {
      client.release();
    }
  }

  async getLastEntityRefs(threadId: number): Promise<EntityRef[]> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<{ entity_refs: unknown }>(
        `SELECT entity_refs FROM conversation_turns
         WHERE thread_id = $1
           AND entity_refs IS NOT NULL
           AND entity_refs::text <> '[]'
         ORDER BY created_at DESC
         LIMIT 1`,
        [threadId],
      );
      if (!rows[0]) return [];
      const refs = rows[0].entity_refs;
      return Array.isArray(refs) ? (refs as EntityRef[]) : [];
    } finally {
      client.release();
    }
  }

  async listThreads(
    conversationId: number,
    limit = 20,
  ): Promise<ConversationThread[]> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<ConversationThread>(
        `SELECT * FROM conversation_threads
         WHERE conversation_id = $1
         ORDER BY opened_at DESC
         LIMIT $2`,
        [conversationId, limit],
      );
      return rows;
    } finally {
      client.release();
    }
  }

  async countTurnsSince(since: Date, role?: ConversationRole): Promise<number> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<{ count: string }>(
        role
          ? `SELECT COUNT(*) FROM conversation_turns WHERE created_at >= $1 AND role = $2`
          : `SELECT COUNT(*) FROM conversation_turns WHERE created_at >= $1`,
        role ? [since, role] : [since],
      );
      return Number(rows[0]?.count ?? 0);
    } finally {
      client.release();
    }
  }

  async getTurnOwner(turnId: number): Promise<{ userId: number; role: ConversationRole } | null> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<{ user_id: number; role: ConversationRole }>(
        `SELECT c.user_id AS user_id, t.role AS role
         FROM conversation_turns t
         JOIN conversation_threads th ON th.id = t.thread_id
         JOIN conversations c ON c.id = th.conversation_id
         WHERE t.id = $1`,
        [turnId],
      );
      if (!rows[0]) return null;
      return { userId: rows[0].user_id, role: rows[0].role };
    } finally {
      client.release();
    }
  }

  async getTurnObservationRef(
    turnId: number,
  ): Promise<{ threadId: number; precedingUserTurnId: number | null } | null> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<{ thread_id: number; preceding_user_turn_id: number | null }>(
        `SELECT t.thread_id AS thread_id,
                (SELECT MAX(u.id) FROM conversation_turns u
                 WHERE u.thread_id = t.thread_id AND u.role = 'user' AND u.id < t.id) AS preceding_user_turn_id
         FROM conversation_turns t
         WHERE t.id = $1`,
        [turnId],
      );
      if (!rows[0]) return null;
      return {
        threadId: rows[0].thread_id,
        precedingUserTurnId: rows[0].preceding_user_turn_id,
      };
    } finally {
      client.release();
    }
  }

  async listAssistantTurnGoalSignals(since?: Date): Promise<GoalSignalTurn[]> {
    const client = await pool.connect();
    try {
      const { rows } = await client.query<{
        id: number;
        thread_id: number;
        created_at: Date;
        fallback_state: string | null;
        resolved_intent: unknown;
      }>(
        since
          ? `SELECT id, thread_id, created_at, fallback_state, resolved_intent
             FROM conversation_turns
             WHERE role = 'assistant' AND created_at >= $1
             ORDER BY thread_id ASC, created_at ASC`
          : `SELECT id, thread_id, created_at, fallback_state, resolved_intent
             FROM conversation_turns
             WHERE role = 'assistant'
             ORDER BY thread_id ASC, created_at ASC`,
        since ? [since] : [],
      );
      return rows.map((r) => ({
        id: r.id,
        threadId: r.thread_id,
        createdAt: r.created_at,
        fallbackState: r.fallback_state,
        resolvedIntent: (r.resolved_intent as GoalSignalTurn["resolvedIntent"]) ?? null,
      }));
    } finally {
      client.release();
    }
  }
}

// ---------------------------------------------------------------------------
// InMemoryConversationStore — for unit tests (no database required)
// ---------------------------------------------------------------------------

let _nextId = 1;
function nextId(): number {
  return _nextId++;
}

export function resetInMemoryIds(): void {
  _nextId = 1;
}

export class InMemoryConversationStore implements IConversationStore {
  private conversations = new Map<number, Conversation>();
  private userToConversation = new Map<number, number>(); // userId → conversationId
  private threads = new Map<number, ConversationThread>();
  private turns = new Map<number, ConversationTurn>();

  private turnsForThread(threadId: number): ConversationTurn[] {
    return Array.from(this.turns.values())
      .filter(t => t.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getOrCreateConversation(userId: number): Promise<Conversation> {
    const existing = this.userToConversation.get(userId);
    if (existing !== undefined) {
      const conv = this.conversations.get(existing)!;
      const updated: Conversation = { ...conv, updatedAt: new Date() };
      this.conversations.set(conv.id, updated);
      return updated;
    }
    const now = new Date();
    const conv: Conversation = {
      id: nextId(),
      userId,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conv.id, conv);
    this.userToConversation.set(userId, conv.id);
    return conv;
  }

  async openThread(
    conversationId: number,
    surface: ConversationSurface,
  ): Promise<ConversationThread> {
    const thread: ConversationThread = {
      id: nextId(),
      conversationId,
      surface,
      openedAt: new Date(),
      closedAt: null,
    };
    this.threads.set(thread.id, thread);
    return thread;
  }

  async getActiveThread(conversationId: number): Promise<ConversationThread | null> {
    const active = Array.from(this.threads.values())
      .filter(t => t.conversationId === conversationId && t.closedAt === null)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime());
    return active[0] ?? null;
  }

  async closeThread(threadId: number): Promise<void> {
    const thread = this.threads.get(threadId);
    if (thread && thread.closedAt === null) {
      this.threads.set(threadId, { ...thread, closedAt: new Date() });
    }
  }

  async appendTurn(
    threadId: number,
    turn: NewConversationTurn,
  ): Promise<ConversationTurn> {
    const persisted: ConversationTurn = {
      id: nextId(),
      threadId,
      role: turn.role,
      surface: turn.surface,
      utterance: turn.utterance,
      resolvedIntent:  turn.resolvedIntent  ?? null,
      contextFrameRef: turn.contextFrameRef ?? null,
      entityRefs:      turn.entityRefs ?? [],
      outcomeRef:      turn.outcomeRef  ?? null,
      fallbackState:   turn.fallbackState ?? null,
      createdAt: new Date(),
    };
    this.turns.set(persisted.id, persisted);
    return persisted;
  }

  async getRecentTurns(
    threadId: number,
    limit = DEFAULT_RECENT_TURNS_LIMIT,
  ): Promise<ConversationTurn[]> {
    const all = this.turnsForThread(threadId);
    return all.slice(-limit);
  }

  async getLastEntityRefs(threadId: number): Promise<EntityRef[]> {
    const all = this.turnsForThread(threadId);
    for (let i = all.length - 1; i >= 0; i--) {
      const refs = all[i].entityRefs;
      if (Array.isArray(refs) && refs.length > 0) {
        return refs as EntityRef[];
      }
    }
    return [];
  }

  async listThreads(
    conversationId: number,
    limit = 20,
  ): Promise<ConversationThread[]> {
    return Array.from(this.threads.values())
      .filter(t => t.conversationId === conversationId)
      .sort((a, b) =>
        b.openedAt.getTime() - a.openedAt.getTime() || b.id - a.id,
      )
      .slice(0, limit);
  }

  async countTurnsSince(since: Date, role?: ConversationRole): Promise<number> {
    return Array.from(this.turns.values()).filter(
      t => t.createdAt.getTime() >= since.getTime() && (!role || t.role === role),
    ).length;
  }

  async getTurnOwner(turnId: number): Promise<{ userId: number; role: ConversationRole } | null> {
    const turn = this.turns.get(turnId);
    if (!turn) return null;
    const thread = this.threads.get(turn.threadId);
    if (!thread) return null;
    const conversation = this.conversations.get(thread.conversationId);
    if (!conversation) return null;
    return { userId: conversation.userId, role: turn.role as ConversationRole };
  }

  async getTurnObservationRef(
    turnId: number,
  ): Promise<{ threadId: number; precedingUserTurnId: number | null } | null> {
    const turn = this.turns.get(turnId);
    if (!turn) return null;
    const precedingUserTurnId = Array.from(this.turns.values())
      .filter((t) => t.threadId === turn.threadId && t.role === "user" && t.id < turn.id)
      .reduce<number | null>((max, t) => (max === null || t.id > max ? t.id : max), null);
    return { threadId: turn.threadId, precedingUserTurnId };
  }

  async listAssistantTurnGoalSignals(since?: Date): Promise<GoalSignalTurn[]> {
    return Array.from(this.turns.values())
      .filter((t) => t.role === "assistant" && (!since || t.createdAt.getTime() >= since.getTime()))
      .sort((a, b) => a.threadId - b.threadId || a.createdAt.getTime() - b.createdAt.getTime())
      .map((t) => ({
        id: t.id,
        threadId: t.threadId,
        createdAt: t.createdAt,
        fallbackState: t.fallbackState,
        resolvedIntent: t.resolvedIntent as GoalSignalTurn["resolvedIntent"],
      }));
  }
}
