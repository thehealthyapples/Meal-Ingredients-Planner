// BUS1 — the support request vocabulary.
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
// ARCHITECTURE_PRINCIPLES.md Principle 2 — one owner per fact.
//
// PURE AND ZERO-I/O. Imported by client and server alike.
//
// ─────────────────────────────────────────────────────────────────────────────
// ONE ENTITY, FOUR KINDS — and the reason it is not four entities.
//
// "Contact us", "report a problem", "suggest a feature" and "correct my data"
// look like four features. They are one: a person writes THA a message about
// something, and a person at THA has to read it, act on it, and close it. They
// differ ONLY in what the sender wants. Everything else — who sent it, what they
// said, where they were, what state it is in, who answered — is identical.
//
// Four tables would have meant four triage states, four operator queues, four
// notification paths, and four chances for one of them to be the queue nobody
// watches. It would also have put a UK GDPR Art. 16 rectification request —
// which carries a one-month legal deadline — into a separate pipe from ordinary
// support, which is exactly how a lawful request goes unanswered.
//
// So `kind` is a field, not a table.
// ─────────────────────────────────────────────────────────────────────────────

/** What the person wants. Determines routing and the form's wording, nothing else. */
export const SUPPORT_REQUEST_KINDS = [
  "question",
  "issue",
  "feature",
  "data-correction",
] as const;

export type SupportRequestKind = (typeof SUPPORT_REQUEST_KINDS)[number];

/** The operator-side lifecycle. Deliberately short. */
export const SUPPORT_REQUEST_STATUSES = ["new", "acknowledged", "resolved", "closed"] as const;

export type SupportRequestStatus = (typeof SUPPORT_REQUEST_STATUSES)[number];

export interface SupportRequestKindDefinition {
  kind: SupportRequestKind;
  /** The heading on the form. */
  title: string;
  /** One line under the heading: what this is for. */
  description: string;
  /** The label on the subject field — different words for different intents. */
  subjectLabel: string;
  /** The label on the body field. */
  bodyLabel: string;
  /** Placeholder guidance for the body. Shapes a message a person can act on. */
  bodyPlaceholder: string;
  /** The confirmation shown after sending. Honest about what happens next. */
  acknowledgement: string;
  /** True when the client should attach the route the person was on. */
  capturesContextPath: boolean;
  /**
   * True when this kind carries a legal response deadline. Shown to the person,
   * so a right does not read like a favour.
   */
  hasStatutoryDeadline: boolean;
}

export const SUPPORT_REQUEST_KIND_DEFINITIONS: Readonly<
  Record<SupportRequestKind, SupportRequestKindDefinition>
> = {
  question: {
    kind: "question",
    title: "Ask a question",
    description: "Anything you cannot find an answer to in the Help Centre.",
    subjectLabel: "What is your question about?",
    bodyLabel: "Your question",
    bodyPlaceholder: "Tell us what you are trying to do, and what is not clear.",
    acknowledgement:
      "Thank you — we have your question. A person reads these, and we will reply by email.",
    capturesContextPath: false,
    hasStatutoryDeadline: false,
  },
  issue: {
    kind: "issue",
    title: "Report a problem",
    description: "Something is broken, wrong, or not doing what it should.",
    subjectLabel: "What went wrong?",
    bodyLabel: "What happened",
    bodyPlaceholder:
      "What were you doing, what did you expect to happen, and what happened instead?",
    acknowledgement:
      "Thank you — this is logged with the page you were on, so we can look into it without asking you to explain again.",
    capturesContextPath: true,
    hasStatutoryDeadline: false,
  },
  feature: {
    kind: "feature",
    title: "Suggest an idea",
    description: "Something that would make The Healthy Apples more useful for your household.",
    subjectLabel: "Your idea, in a few words",
    bodyLabel: "Tell us more",
    bodyPlaceholder:
      "What would you like to be able to do, and what would it help you with at home?",
    acknowledgement:
      "Thank you — we read every one of these. We cannot promise to build it, and we will not pretend otherwise.",
    capturesContextPath: false,
    hasStatutoryDeadline: false,
  },
  "data-correction": {
    kind: "data-correction",
    title: "Ask us to correct your data",
    description:
      "For anything about you that is wrong and that you cannot change yourself.",
    subjectLabel: "What is wrong?",
    bodyLabel: "What should it say instead?",
    bodyPlaceholder:
      "Tell us what is incorrect and what the correct information is, so we can put it right.",
    acknowledgement:
      "Thank you. This is a request under Article 16 of the UK GDPR, and we will respond within one month.",
    capturesContextPath: false,
    hasStatutoryDeadline: true,
  },
};

export function isSupportRequestKind(value: string): value is SupportRequestKind {
  return (SUPPORT_REQUEST_KINDS as readonly string[]).includes(value);
}

export function isSupportRequestStatus(value: string): value is SupportRequestStatus {
  return (SUPPORT_REQUEST_STATUSES as readonly string[]).includes(value);
}

/** Field limits, shared so the client and the server agree on them exactly. */
export const SUPPORT_REQUEST_LIMITS = {
  subjectMax: 200,
  bodyMin: 10,
  bodyMax: 5000,
} as const;
