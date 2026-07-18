// BUS1 — the consent vocabulary.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. This module owns "what a household can be
//     asked to consent to". The `user_consents` table owns "what they answered".
//     Those are different facts and neither restates the other.
//   Principle 5 — a reference vocabulary beside the entity spine. No table, no
//     cache, no column.
//
// PURE AND ZERO-I/O. Imported by client and server alike.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE LEDGER IS APPEND-ONLY, AND THAT IS THE WHOLE DESIGN.
//
// A withdrawal is a NEW ROW with `granted: false`, never an update to the row
// that granted it and never a deletion. The current answer is the newest row for
// a (userId, consentType) pair.
//
// This is not fastidiousness. UK GDPR Art. 7(1) requires THA to be able to
// DEMONSTRATE that consent was given — and a mutable consent record demonstrates
// nothing, because it cannot distinguish "they consented and later withdrew"
// from "they never consented and somebody edited the row". A ledger you can
// overwrite is not evidence.
//
// It is also why every row stores the document VERSION. "Agreed to the privacy
// policy" is not a fact; "agreed to privacy policy 1.0.0 on this date" is. See
// shared/legal/index.ts for where the version comes from.
// ─────────────────────────────────────────────────────────────────────────────

import type { LegalDocumentSlug } from "../legal/types";

/**
 * The things a household can be asked to agree to.
 *
 * Deliberately small. A consent type is added here when THA genuinely needs
 * permission for something it genuinely does — never speculatively, because a
 * consent prompt for a thing that does not happen teaches households that these
 * prompts are noise, and the next one that matters gets dismissed too.
 *
 * NOT PRESENT, DELIBERATELY: analytics, marketing, and cookie-category consents.
 * THA runs no analytics, sends no marketing, and sets one strictly-necessary
 * cookie (see shared/legal/documents/cookie-policy.ts, which records why at
 * length). When any of those becomes true, the change that makes it true adds
 * its consent type here — with the banner, the granular choice, and refusal made
 * exactly as easy as acceptance.
 */
export const CONSENT_TYPES = [
  "terms-of-service",
  "privacy-policy",
  "health-data-processing",
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

/** Where a consent decision was taken. Recorded so a record can be traced back. */
export const CONSENT_SOURCES = [
  "registration",
  "privacy-settings",
  "reconsent-prompt",
] as const;

export type ConsentSource = (typeof CONSENT_SOURCES)[number];

export interface ConsentDefinition {
  type: ConsentType;
  /** The exact sentence shown beside the control. This IS the consent wording. */
  prompt: string;
  /** Why THA needs it, in one plain line. Shown under the prompt. */
  why: string;
  /** The legal document this consent is given against, if any. */
  document: LegalDocumentSlug | null;
  /**
   * True when the product cannot lawfully be provided without it. A required
   * consent is refused by NOT signing up, never by a pre-ticked box — pre-ticked
   * boxes are not consent (UK GDPR Art. 4(11): consent must be a clear
   * affirmative action).
   */
  required: boolean;
  /** The UK GDPR article THA relies on. Shown in Privacy Settings. */
  lawfulBasis: string;
  /** What actually stops working if this is withdrawn. Told plainly before withdrawal. */
  withdrawalConsequence: string;
}

export const CONSENT_DEFINITIONS: Readonly<Record<ConsentType, ConsentDefinition>> = {
  "terms-of-service": {
    type: "terms-of-service",
    prompt: "I agree to the Terms of Service",
    why: "The agreement between you and us about how The Healthy Apples is used.",
    document: "terms-of-service",
    required: true,
    lawfulBasis: "Article 6(1)(b) — performance of a contract",
    withdrawalConsequence:
      "The agreement ends, which means closing your account. Delete your account from Privacy Settings.",
  },
  "privacy-policy": {
    type: "privacy-policy",
    prompt: "I have read the Privacy Policy",
    why: "What we hold about your household, why, and how to get it back or delete it.",
    document: "privacy-policy",
    required: true,
    lawfulBasis: "Article 6(1)(b) — performance of a contract",
    withdrawalConsequence:
      "We cannot run your account without processing your data. Withdrawing means deleting your account.",
  },
  "health-data-processing": {
    type: "health-data-processing",
    prompt:
      "I consent to The Healthy Apples storing my household's allergies, dietary restrictions and health goals",
    why:
      "This is health data, and the law protects it specially. We hold it so the product never suggests food someone in your household cannot safely eat.",
    document: "privacy-policy",
    required: true,
    lawfulBasis: "Article 9(2)(a) — explicit consent for special category data",
    withdrawalConsequence:
      "We erase the allergies, restrictions and health goals recorded for your household, and the product stops filtering food for them. Nothing will warn you about an ingredient again.",
  },
};

/** The consents a new account must give before it can be created. */
export const REQUIRED_CONSENTS_AT_REGISTRATION: readonly ConsentType[] = CONSENT_TYPES.filter(
  (t) => CONSENT_DEFINITIONS[t].required,
);

export function isConsentType(value: string): value is ConsentType {
  return (CONSENT_TYPES as readonly string[]).includes(value);
}

export function isConsentSource(value: string): value is ConsentSource {
  return (CONSENT_SOURCES as readonly string[]).includes(value);
}

/**
 * One row of the ledger as a household sees it in Privacy Settings.
 * The shape the API returns; the table shape lives in shared/schema.ts.
 */
export interface ConsentRecordView {
  consentType: ConsentType;
  granted: boolean;
  documentSlug: LegalDocumentSlug | null;
  documentVersion: string | null;
  recordedAt: string;
  source: ConsentSource;
  /** True when a newer version of the document has been published since. */
  supersededByNewerVersion: boolean;
}
