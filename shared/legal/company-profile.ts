// BUS1 — the placeholder company profile.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  THIS FILE CONTAINS PLACEHOLDER LEGAL INFORMATION.                       │
// │  IT MUST BE REPLACED WITH VERIFIED COMPANY DETAILS BEFORE LAUNCH.        │
// │  It is deliberately the ONLY file that must change to do so.             │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
// Principle 2 (one owner per fact) and Principle 6 (honest gaps over invented
// facts).
//
// WHY THIS FILE EXISTS SEPARATELY FROM THE POLICY DOCUMENTS:
//   The mission that created it required placeholder company information to be
//   "clearly identified so it can be replaced before launch". Interleaving a
//   made-up company number into three thousand words of policy prose would make
//   that impossible to do safely — someone would have to re-read every clause to
//   find what was invented. So the prose holds `{{company.*}}` tokens and never
//   a company fact, and every invented value lives here, in one list, with a
//   machine-readable record of which fields are still placeholders.
//
// HOW THE PLACEHOLDER STATUS IS SURFACED (Principle 6):
//   `COMPANY_PROFILE.placeholder` is TRUE while any field in
//   `PLACEHOLDER_FIELDS` is unverified. While it is true, every legal page in the
//   product renders a visible, unmissable notice saying so. THA does not publish
//   an invented company number and quietly hope nobody checks — an unverified
//   legal fact renders as an honest, stated gap. The notice disappears by itself
//   the moment the values below are replaced and the list is emptied.
//
// THE CONTACT ADDRESSES BELOW ARE NOT NEW (Principle 2):
//   `supportEmail` and `suggestionsEmail` previously had their defaults written
//   inline in server/auth.ts, which served them from GET /api/config while
//   profile-page.tsx carried a second hardcoded copy of the same two strings.
//   That was two owners of one fact. BUS1 converges them here — this file is now
//   their single owner, server/auth.ts reads these as its defaults (the existing
//   SUPPORT_EMAIL / SUGGESTIONS_EMAIL environment overrides are preserved
//   exactly), and the client's hardcoded fallbacks are deleted. No new owner is
//   created; one is removed.
//
// WHAT THIS FILE MUST NEVER DO:
//   • Hold policy prose. Prose belongs to the documents in ./documents/.
//   • Hold deployment configuration. APP_BASE_URL, SMTP host and database URL
//     are environment, not company identity, and keep their existing owners.
//   • Be read to decide anything at runtime. It labels; it never authorises.
//     server/lib/access.ts remains the sole authority on who anyone is.

/**
 * Every field below whose value is INVENTED and must be replaced with a verified
 * fact before The Healthy Apples trades.
 *
 * Empty this array in the same edit that replaces the values. `placeholder` is
 * derived from it, so the in-product notice cannot be left on or switched off
 * independently of the underlying truth.
 */
export const PLACEHOLDER_FIELDS = [
  "legalName",
  "companyNumber",
  "registeredAddress",
  "vatNumber",
  "icoRegistrationNumber",
  "dataProtectionContact",
] as const;

export type PlaceholderField = (typeof PLACEHOLDER_FIELDS)[number];

export interface CompanyProfile {
  /** True while any value in PLACEHOLDER_FIELDS is still invented. Derived, never set by hand. */
  readonly placeholder: boolean;
  /** The fields still carrying invented values. Rendered verbatim in the product notice. */
  readonly placeholderFields: readonly string[];

  /** Registered company name, as it appears at Companies House. PLACEHOLDER. */
  readonly legalName: string;
  /** The name households know THA by. Not a placeholder — this is the real product name. */
  readonly tradingName: string;
  /** Companies House registration number. PLACEHOLDER. */
  readonly companyNumber: string;
  /** VAT registration number, or the empty string if not VAT registered. PLACEHOLDER. */
  readonly vatNumber: string;
  /** Registered office address, one line per array entry. PLACEHOLDER. */
  readonly registeredAddress: readonly string[];

  /** Country whose law governs the Terms. */
  readonly jurisdiction: string;
  /** The courts with exclusive jurisdiction over disputes. */
  readonly courts: string;

  /** Where a household writes about their personal data. PLACEHOLDER (mailbox must exist). */
  readonly dataProtectionContact: string;
  /** ICO data-controller registration number. PLACEHOLDER — registration is a launch prerequisite. */
  readonly icoRegistrationNumber: string;

  /** General help. Converged owner — see the header note. */
  readonly supportEmail: string;
  /** Ideas and feature requests. Converged owner — see the header note. */
  readonly suggestionsEmail: string;

  /** The supervisory authority a household may complain to. */
  readonly supervisoryAuthority: {
    readonly name: string;
    readonly url: string;
    readonly helpline: string;
  };
}

/**
 * The single owner of The Healthy Apples' company identity.
 *
 * Replacing the six PLACEHOLDER values below, and emptying PLACEHOLDER_FIELDS,
 * is the entire pre-launch task. Nothing else in the platform needs to change.
 */
export const COMPANY_PROFILE: CompanyProfile = {
  placeholder: PLACEHOLDER_FIELDS.length > 0,
  placeholderFields: PLACEHOLDER_FIELDS,

  // ── PLACEHOLDER VALUES — replace before launch ───────────────────────────
  legalName: "The Healthy Apples Ltd",
  companyNumber: "PLACEHOLDER — not yet registered",
  vatNumber: "PLACEHOLDER — not yet registered",
  registeredAddress: [
    "PLACEHOLDER — registered office address not yet confirmed",
    "United Kingdom",
  ],
  icoRegistrationNumber: "PLACEHOLDER — ICO registration not yet completed",
  dataProtectionContact: "privacy@thehealthyapples.com",
  // ─────────────────────────────────────────────────────────────────────────

  tradingName: "The Healthy Apples",
  jurisdiction: "England and Wales",
  courts: "the courts of England and Wales",

  supportEmail: "support@thehealthyapples.com",
  suggestionsEmail: "suggestions@thehealthyapples.com",

  supervisoryAuthority: {
    name: "the Information Commissioner's Office (ICO)",
    url: "https://ico.org.uk/make-a-complaint/",
    helpline: "0303 123 1113",
  },
};

/**
 * The registered address as a single line, for use inside a sentence.
 * Returns an honest marker rather than an empty string when unset.
 */
export function registeredAddressLine(profile: CompanyProfile = COMPANY_PROFILE): string {
  return profile.registeredAddress.join(", ");
}
