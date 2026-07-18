// BUS1 — the consent ledger.
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
//
// Writes to `user_consents`, which is APPEND-ONLY: a withdrawal is a new row
// with `granted = false`, never an update. See shared/privacy/consent.ts for why
// (UK GDPR Art. 7(1) — a record you can overwrite demonstrates nothing).
//
// The vocabulary — which consents exist, their wording, their lawful basis — is
// owned by shared/privacy/consent.ts and is not restated here. This file owns
// only reading and writing the ledger.

import { desc, eq } from "drizzle-orm";
import type { Request } from "express";
import { db } from "../db";
import { userConsents } from "@shared/schema";
import {
  CONSENT_DEFINITIONS,
  CONSENT_TYPES,
  type ConsentRecordView,
  type ConsentSource,
  type ConsentType,
} from "@shared/privacy/consent";
import { legalDocumentVersion } from "@shared/legal";

/**
 * Evidence of the circumstances of a consent, retained under Art. 7(1).
 *
 * Both values are personal data, both are declared in the Privacy Policy, and
 * both are nulled when the account is erased. They are captured because "they
 * ticked a box" is not demonstrable on its own.
 */
export interface ConsentContext {
  ip: string | null;
  userAgent: string | null;
}

export function consentContextFrom(req: Request): ConsentContext {
  return {
    ip: req.ip ?? null,
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null,
  };
}

/**
 * Record a consent decision.
 *
 * The document version is looked up from the legal register rather than accepted
 * from the caller — a client-supplied version could claim agreement to a
 * document that was never shown.
 */
export async function recordConsent(params: {
  userId: number;
  consentType: ConsentType;
  granted: boolean;
  source: ConsentSource;
  context: ConsentContext;
}): Promise<void> {
  const definition = CONSENT_DEFINITIONS[params.consentType];
  const slug = definition.document;

  await db.insert(userConsents).values({
    userId: params.userId,
    consentType: params.consentType,
    granted: params.granted,
    documentSlug: slug,
    documentVersion: slug ? legalDocumentVersion(slug) : null,
    source: params.source,
    recordedIp: params.context.ip,
    recordedUserAgent: params.context.userAgent,
  });
}

/** Record several decisions at once — the registration case. */
export async function recordConsents(params: {
  userId: number;
  consentTypes: readonly ConsentType[];
  granted: boolean;
  source: ConsentSource;
  context: ConsentContext;
}): Promise<void> {
  for (const consentType of params.consentTypes) {
    await recordConsent({ ...params, consentType, granted: params.granted });
  }
}

/**
 * The current state of every consent for a person: the newest row per type.
 *
 * A type with no row at all is reported as `granted: false` with a null date —
 * the honest answer for an account created before consent was captured, rather
 * than a fabricated "yes" inferred from the fact that they have an account.
 */
export async function currentConsents(userId: number): Promise<ConsentRecordView[]> {
  const rows = await db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, userId))
    .orderBy(desc(userConsents.recordedAt));

  return CONSENT_TYPES.map((type) => {
    const newest = rows.find((r) => r.consentType === type);
    const definition = CONSENT_DEFINITIONS[type];
    const currentVersion = definition.document ? legalDocumentVersion(definition.document) : null;

    if (!newest) {
      return {
        consentType: type,
        granted: false,
        documentSlug: definition.document,
        documentVersion: null,
        recordedAt: "",
        source: "registration" as ConsentSource,
        supersededByNewerVersion: false,
      };
    }

    return {
      consentType: type,
      granted: newest.granted,
      documentSlug: (newest.documentSlug as ConsentRecordView["documentSlug"]) ?? null,
      documentVersion: newest.documentVersion,
      recordedAt: newest.recordedAt.toISOString(),
      source: newest.source as ConsentSource,
      // Surfaced so a household can see that the policy has moved on since they
      // agreed — the trigger for asking them again.
      supersededByNewerVersion:
        currentVersion !== null &&
        newest.documentVersion !== null &&
        newest.documentVersion !== currentVersion,
    };
  });
}

/** The full ledger for a person, newest first — shown in Privacy Settings. */
export async function consentHistory(userId: number): Promise<ConsentRecordView[]> {
  const rows = await db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, userId))
    .orderBy(desc(userConsents.recordedAt));

  return rows.map((r) => ({
    consentType: r.consentType as ConsentType,
    granted: r.granted,
    documentSlug: (r.documentSlug as ConsentRecordView["documentSlug"]) ?? null,
    documentVersion: r.documentVersion,
    recordedAt: r.recordedAt.toISOString(),
    source: r.source as ConsentSource,
    supersededByNewerVersion: false,
  }));
}
