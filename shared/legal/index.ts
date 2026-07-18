// BUS1 — the canonical register of THA's legal documents.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. This module is the ONE owner of "which
//     legal documents exist, what version each is at, and what they say".
//     The client renders from it; the server records consent against it. There
//     is no second copy in a database, a CMS, or a static HTML page.
//   Principle 4 — runtime consumes one assembled model. `renderLegalDocument()`
//     is that assembly: it resolves company tokens ONCE, and every surface takes
//     the resolved document rather than re-resolving tokens itself.
//   Principle 5 — this is a reference vocabulary beside the entity spine. It has
//     no table, no cache, no column and no DB owner.
//
// PURE AND ZERO-I/O. Safe to import from client and server alike.
//
// WHY VERSIONS MATTER MORE HERE THAN ANYWHERE ELSE IN THE PLATFORM:
//   UK GDPR Art. 7(1) requires THA to be able to DEMONSTRATE that a household
//   consented. A consent record that says "agreed to the privacy policy" without
//   saying WHICH privacy policy proves nothing, because the document may have
//   changed since. So `user_consents` stores the slug AND the version, and this
//   module is where that version comes from. Editing a document's prose without
//   bumping its `version` silently invalidates every consent record that cites
//   it — which is why the check below exists.

import type { LegalDocument, LegalDocumentSlug, LegalBlock, LegalSection } from "./types";
import { COMPANY_PROFILE, registeredAddressLine, type CompanyProfile } from "./company-profile";
import { PRIVACY_POLICY } from "./documents/privacy-policy";
import { TERMS_OF_SERVICE } from "./documents/terms-of-service";
import { COOKIE_POLICY } from "./documents/cookie-policy";

export type { LegalDocument, LegalDocumentSlug, LegalSection, LegalBlock } from "./types";
export type { SubProcessor } from "./types";
export { COMPANY_PROFILE, PLACEHOLDER_FIELDS } from "./company-profile";
export type { CompanyProfile } from "./company-profile";
export { SUB_PROCESSORS } from "./subprocessors";

/**
 * Every legal document THA publishes, keyed by slug.
 *
 * Adding a document means adding it here and nowhere else: the public route
 * `/legal/:slug`, the legal index page, the footer links, and the consent
 * vocabulary all derive from this record.
 */
export const LEGAL_DOCUMENTS: Readonly<Record<LegalDocumentSlug, LegalDocument>> = {
  "privacy-policy": PRIVACY_POLICY,
  "terms-of-service": TERMS_OF_SERVICE,
  "cookie-policy": COOKIE_POLICY,
};

/** The documents in the order they are presented to a household. */
export const LEGAL_DOCUMENT_ORDER: readonly LegalDocumentSlug[] = [
  "privacy-policy",
  "terms-of-service",
  "cookie-policy",
];

/** Narrow an arbitrary string to a known slug. Used by the route handler. */
export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
  return Object.prototype.hasOwnProperty.call(LEGAL_DOCUMENTS, value);
}

/**
 * The version of a document, for recording alongside a consent.
 * Throws on an unknown slug rather than returning a falsy version — a consent
 * record carrying an empty version would be worse than no record at all.
 */
export function legalDocumentVersion(slug: LegalDocumentSlug): string {
  const doc = LEGAL_DOCUMENTS[slug];
  if (!doc) throw new Error(`[legal] Unknown legal document: ${slug}`);
  return doc.version;
}

// ── Token resolution ────────────────────────────────────────────────────────

/**
 * The tokens a document may use. Kept explicit rather than walking the profile
 * object, so that an unresolved token is a compile-time-visible omission here
 * rather than a `{{company.whatever}}` leaking onto a published legal page.
 */
function tokenTable(profile: CompanyProfile): Record<string, string> {
  return {
    "company.legalName": profile.legalName,
    "company.tradingName": profile.tradingName,
    "company.companyNumber": profile.companyNumber,
    "company.vatNumber": profile.vatNumber,
    "company.registeredAddress": registeredAddressLine(profile),
    "company.jurisdiction": profile.jurisdiction,
    "company.courts": profile.courts,
    "company.dataProtectionContact": profile.dataProtectionContact,
    "company.icoRegistrationNumber": profile.icoRegistrationNumber,
    "company.supportEmail": profile.supportEmail,
    "company.suggestionsEmail": profile.suggestionsEmail,
    "company.supervisoryAuthority.name": profile.supervisoryAuthority.name,
    "company.supervisoryAuthority.url": profile.supervisoryAuthority.url,
    "company.supervisoryAuthority.helpline": profile.supervisoryAuthority.helpline,
  };
}

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/**
 * Resolve `{{company.*}}` tokens in a string.
 *
 * An UNKNOWN token is left verbatim and reported to the console rather than
 * replaced with an empty string. A silently-emptied token reads as a finished
 * sentence with a fact missing from it — the exact class of quiet falsehood a
 * legal document must never contain. Left visible, it is obviously a defect.
 */
export function resolveTokens(text: string, profile: CompanyProfile = COMPANY_PROFILE): string {
  const tokens = tokenTable(profile);
  return text.replace(TOKEN_PATTERN, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) return tokens[key];
    console.warn(`[legal] Unresolved token in legal content: ${match}`);
    return match;
  });
}

function resolveBlock(block: LegalBlock, profile: CompanyProfile): LegalBlock {
  switch (block.kind) {
    case "paragraph":
      return { kind: "paragraph", text: resolveTokens(block.text, profile) };
    case "list":
      return { kind: "list", items: block.items.map((i) => resolveTokens(i, profile)) };
    case "definitions":
      return {
        kind: "definitions",
        items: block.items.map((i) => ({
          term: resolveTokens(i.term, profile),
          definition: resolveTokens(i.definition, profile),
        })),
      };
    case "table":
      return {
        kind: "table",
        headers: block.headers.map((h) => resolveTokens(h, profile)),
        rows: block.rows.map((r) => r.map((c) => resolveTokens(c, profile))),
      };
  }
}

/**
 * The one assembly point: a legal document with every company token resolved.
 *
 * Every surface that shows legal content calls this. No surface resolves tokens
 * itself, and no surface renders a raw document straight out of LEGAL_DOCUMENTS.
 */
export function renderLegalDocument(
  slug: LegalDocumentSlug,
  profile: CompanyProfile = COMPANY_PROFILE,
): LegalDocument {
  const doc = LEGAL_DOCUMENTS[slug];
  if (!doc) throw new Error(`[legal] Unknown legal document: ${slug}`);
  return {
    ...doc,
    sections: doc.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => resolveBlock(block, profile)),
    })),
  };
}

/**
 * A one-line summary of each document, for the legal index and the footer.
 * Deliberately does not resolve tokens — summaries contain none, and resolving
 * three whole documents to render a list of three links would be waste.
 */
export function legalDocumentSummaries(): Array<{
  slug: LegalDocumentSlug;
  title: string;
  summary: string;
  version: string;
  effectiveDate: string;
}> {
  return LEGAL_DOCUMENT_ORDER.map((slug) => {
    const d = LEGAL_DOCUMENTS[slug];
    return {
      slug,
      title: d.title,
      summary: d.summary,
      version: d.version,
      effectiveDate: d.effectiveDate,
    };
  });
}
