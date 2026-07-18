// BUS1 — support requests: create, read, triage.
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
//
// The vocabulary (the four kinds, their wording, their limits) is owned by
// shared/support/support-request.ts and is not restated here. This module owns
// only persistence and the notification that a message arrived.
//
// It follows the bounded-service pattern already used by
// server/lib/knowledge-review-store.ts and server/lib/classification-store.ts —
// a module that owns its own tables and talks to Drizzle directly — rather than
// extending the 4,000-line IStorage, which owns the core household domain.

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { supportRequests, privacyActivityLog, users } from "@shared/schema";
import type { SupportRequest } from "@shared/schema";
import {
  SUPPORT_REQUEST_LIMITS,
  type SupportRequestKind,
  type SupportRequestStatus,
} from "@shared/support/support-request";
import { sendSupportRequestReceivedEmail } from "../email";

export interface CreateSupportRequestInput {
  userId: number | null;
  kind: SupportRequestKind;
  subject: string;
  body: string;
  contextPath?: string | null;
  contactEmail?: string | null;
}

export async function createSupportRequest(
  input: CreateSupportRequestInput,
): Promise<SupportRequest> {
  const subject = input.subject.trim().slice(0, SUPPORT_REQUEST_LIMITS.subjectMax);
  const body = input.body.trim().slice(0, SUPPORT_REQUEST_LIMITS.bodyMax);

  // For a signed-in person, default the reply-to address to their account email
  // rather than asking them to type it again. `users.username` IS the email in
  // this platform (see server/auth.ts — registration takes an email as the
  // username), which is why this reads a column that does not look like one.
  let contactEmail = input.contactEmail?.trim() || null;
  if (!contactEmail && input.userId !== null) {
    const [account] = await db
      .select({ email: users.username })
      .from(users)
      .where(eq(users.id, input.userId));
    contactEmail = account?.email ?? null;
  }

  const [created] = await db
    .insert(supportRequests)
    .values({
      userId: input.userId,
      kind: input.kind,
      subject,
      body,
      contextPath: input.contextPath ?? null,
      contactEmail,
    })
    .returning();

  // A rectification request is a data-subject right with a one-month statutory
  // deadline, so it is recorded in the privacy activity log as well as the
  // support queue. The log is the accountability record (Art. 5(2)); the queue
  // is how a person actually answers it. Neither replaces the other.
  if (input.kind === "data-correction" && input.userId !== null) {
    await db.insert(privacyActivityLog).values({
      userId: input.userId,
      action: "correction-request",
      detail: { supportRequestId: created.id },
    });
  }

  // Best-effort. A failure to send the acknowledgement must never lose the
  // message the person took the trouble to write.
  if (contactEmail) {
    sendSupportRequestReceivedEmail(contactEmail, created.kind as SupportRequestKind).catch((e) =>
      console.warn("[Support] Acknowledgement email failed:", e?.message),
    );
  }

  console.log(`[Support] ${created.kind} request #${created.id} received`);
  return created;
}

/** A person's own requests, newest first — shown back to them so they can see it landed. */
export async function listRequestsForUser(userId: number): Promise<SupportRequest[]> {
  return db
    .select()
    .from(supportRequests)
    .where(eq(supportRequests.userId, userId))
    .orderBy(desc(supportRequests.createdAt));
}

/** The operator queue. */
export async function listRequestsForOperator(filter?: {
  status?: SupportRequestStatus;
  kind?: SupportRequestKind;
}): Promise<SupportRequest[]> {
  const conditions = [];
  if (filter?.status) conditions.push(eq(supportRequests.status, filter.status));
  if (filter?.kind) conditions.push(eq(supportRequests.kind, filter.kind));

  return db
    .select()
    .from(supportRequests)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(supportRequests.createdAt))
    .limit(200);
}

export async function updateRequestStatus(params: {
  id: number;
  status: SupportRequestStatus;
  internalNote?: string | null;
  operatorUserId: number;
}): Promise<SupportRequest | undefined> {
  const isClosing = params.status === "resolved" || params.status === "closed";
  const [updated] = await db
    .update(supportRequests)
    .set({
      status: params.status,
      internalNote: params.internalNote ?? undefined,
      resolvedByUserId: isClosing ? params.operatorUserId : null,
      resolvedAt: isClosing ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(supportRequests.id, params.id))
    .returning();
  return updated;
}

/** Counts by status, for the operator hub's at-a-glance view. */
export async function openRequestCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: supportRequests.status, count: sql<number>`count(*)::int` })
    .from(supportRequests)
    .groupBy(supportRequests.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}
