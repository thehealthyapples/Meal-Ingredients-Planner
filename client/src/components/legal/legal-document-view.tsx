// BUS1 — the one renderer for a legal document.
//
// Governing architecture: docs/architecture/THA_UI_ARCHITECTURE.md § 18
//   "One visual language" — a legal page is still THA, not a plain HTML dump
//   pasted into the product with its own browser-default typography.
//   "Semantic before literal" — every value below is a semantic token
//   (`text-muted-foreground`, `border-border`, the named type roles). There are
//   no raw colours and no hard-coded sizes.
//
// Registered in the Adoption Register as the canonical owner of "legal document
// presentation", with the legal page as its first consumer.
//
// WHY A RENDERER AND NOT THREE PAGES OF MARKUP:
//   Three policy documents rendered three times would be three chances for them
//   to disagree about what a heading looks like — and legal documents are the
//   surface where a household is most entitled to expect that the product is
//   paying attention. One renderer, three contents.
//
// It renders content it is GIVEN. It fetches nothing, owns no text, and decides
// nothing about what a document says — shared/legal owns every word.

import type { LegalBlock, LegalDocument } from "@shared/legal";
import { AlertTriangle } from "lucide-react";

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p className="text-base leading-relaxed text-foreground/85">{block.text}</p>
      );

    case "list":
      return (
        <ul className="space-y-2 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-base leading-relaxed text-foreground/85">
              <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "definitions":
      return (
        <dl className="space-y-4">
          {block.items.map((item, i) => (
            <div key={i}>
              <dt className="text-base font-semibold text-foreground">{item.term}</dt>
              <dd className="mt-1 text-base leading-relaxed text-foreground/85">{item.definition}</dd>
            </div>
          ))}
        </dl>
      );

    case "table":
      // Wrapped in its own horizontal scroll container so a wide table never
      // makes the PAGE scroll sideways on a phone.
      return (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {block.headers.map((h, i) => (
                  <th key={i} className="py-2 pr-4 align-bottom font-semibold text-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-border/50 last:border-0">
                  {row.map((cell, c) => (
                    <td key={c} className="py-3 pr-4 align-top leading-relaxed text-foreground/85">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/**
 * The placeholder notice.
 *
 * Shown whenever the company profile still carries invented values. It is
 * deliberately impossible to dismiss and deliberately at the top: THA publishing
 * a made-up company number without saying so would be precisely the fabricated
 * certainty ARCHITECTURE_PRINCIPLES.md Principle 6 forbids, and a legal document
 * is the worst possible place to start.
 *
 * It disappears by itself when shared/legal/company-profile.ts is completed —
 * no flag to remember to switch off.
 */
export function LegalPlaceholderNotice({ fields }: { fields: readonly string[] }) {
  return (
    <div
      className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
      data-testid="legal-placeholder-notice"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          This document contains placeholder company information
        </p>
        <p className="text-sm leading-relaxed text-foreground/80">
          The Healthy Apples is not yet trading, and the following details have not been confirmed:{" "}
          {fields.join(", ")}. Everything else on this page is the real policy.
        </p>
      </div>
    </div>
  );
}

export function LegalDocumentView({
  document,
  placeholderFields,
}: {
  document: LegalDocument;
  placeholderFields?: readonly string[];
}) {
  return (
    <article className="space-y-8" data-testid={`legal-document-${document.slug}`}>
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {document.title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">{document.summary}</p>
        <p className="text-sm text-muted-foreground/80">
          Version {document.version} · In effect from {document.effectiveDate}
        </p>
      </header>

      {placeholderFields && placeholderFields.length > 0 && (
        <LegalPlaceholderNotice fields={placeholderFields} />
      )}

      {document.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </section>
      ))}
    </article>
  );
}
