// BUS1 — the shape of a THA legal document.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
// (Principle 2 — one owner per fact; Principle 5 — reference vocabularies sit
// beside the entity spine; Principle 6 — honest gaps over invented facts).
//
// This module is a pure, zero-I/O type vocabulary. It owns the SHAPE of a legal
// document and none of its content, and none of the company's identity.
//
// WHY A DOCUMENT IS STRUCTURED AND NOT A MARKDOWN BLOB:
//   • A section carries a stable `id`, so Privacy Settings can deep-link to the
//     rights section and a consent record can cite the clause a household agreed
//     to. A blob has no addressable parts.
//   • The client renders sections with the platform's own type roles and spacing
//     (THA_UI_ARCHITECTURE.md § 18 — "only named type roles and spacing steps"),
//     rather than shipping a second typographic system inside a Markdown renderer.
//   • Every document carries a `version`. Consent is meaningless without knowing
//     WHAT was consented to, and UK GDPR Art. 7(1) requires THA to be able to
//     demonstrate it (see shared/legal/index.ts).
//
// WHAT THIS MODULE MUST NEVER DO:
//   • Hold a company name, address, registration number or contact address.
//     Those are the placeholder company profile's, and exist there precisely so
//     they can be replaced in one file before launch.
//   • Hold a fact that another owner already holds. Policy prose states what THA
//     does; it never becomes a second source of truth for how THA behaves.

/** The stable slug of a legal document. Also its public route: `/legal/<slug>`. */
export type LegalDocumentSlug = "privacy-policy" | "terms-of-service" | "cookie-policy";

/**
 * A block of content within a section.
 *
 * Deliberately small. Every block kind here exists because a real clause needed
 * it; there is no generic "html" escape hatch, because one would let unreviewed
 * markup into a legal document and defeat the point of structuring it at all.
 */
export type LegalBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "definitions"; items: Array<{ term: string; definition: string }> }
  /**
   * A table. `rows` must every one be the same length as `headers`; a ragged
   * table is a defect in the document, not something the renderer papers over.
   */
  | { kind: "table"; headers: string[]; rows: string[][] };

/** One addressable section of a legal document. */
export interface LegalSection {
  /** Stable anchor. Never renumbered — inbound links and consent citations use it. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

/**
 * A complete legal document.
 *
 * `version` and `effectiveDate` move together: any change to `sections` that a
 * household would care about MUST bump the version, because consent records
 * store the version and a silent edit makes every stored consent a lie about
 * what was agreed.
 */
export interface LegalDocument {
  slug: LegalDocumentSlug;
  title: string;
  /** One plain-language line: what this document is, for someone who will not read it. */
  summary: string;
  /** Semantic-ish version. Bump on any material change. */
  version: string;
  /** ISO civil date (YYYY-MM-DD) this version took effect. */
  effectiveDate: string;
  sections: LegalSection[];
}

/**
 * A third party that processes household data on THA's behalf.
 *
 * Honest by construction: a processor is listed because it is wired into the
 * platform, and each entry names what it actually receives. An entry whose
 * `activeWhen` condition is not met in a given deployment is still listed, with
 * its condition stated — because "we might send your data here" is the fact a
 * household needs, and pretending otherwise would be the fabrication
 * Principle 6 forbids.
 */
export interface SubProcessor {
  id: string;
  name: string;
  /** What THA uses it for, in plain language. */
  purpose: string;
  /** The personal data it actually receives. Never "may include various data". */
  dataReceived: string[];
  /** Where processing takes place, or "Configurable — set at deployment". */
  location: string;
  /** The condition under which this processor is active, in plain language. */
  activeWhen: string;
}
