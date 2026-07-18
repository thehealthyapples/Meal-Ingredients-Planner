// BUS1 — the public legal pages.
//
// EXPERIENCE TEST (THA_EXPERIENCE_BLUEPRINT.md § 15.3):
//   Which room is this?  The doorway. It is reachable from outside the house,
//                        before anyone has an account, because a policy behind
//                        a login is not published.
//   How should someone feel here?  Unhurried, and treated as an adult. Nothing
//                        is hidden, nothing is dressed up, nothing is rushing
//                        them toward a button.
//   The one thing it helps them do?  READ what they are agreeing to.
//
// It is deliberately plain. There is no orchard, no Living Detail and no motion
// here — not because the room was forgotten, but because every one of those
// would be the product performing at a person while they read a contract.

import { lazy, Suspense } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import type { LegalDocument, LegalDocumentSlug, SubProcessor } from "@shared/legal";
import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { Skeleton } from "@/components/ui/skeleton";

interface LegalIndexResponse {
  documents: Array<{
    slug: LegalDocumentSlug;
    title: string;
    summary: string;
    version: string;
    effectiveDate: string;
  }>;
  companyPlaceholder: { active: boolean; fields: string[] };
}

interface LegalDocumentResponse {
  document: LegalDocument;
  subProcessors?: SubProcessor[];
  companyPlaceholder: { active: boolean; fields: string[] };
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">{children}</div>
    </div>
  );
}

/**
 * The sub-processor table.
 *
 * Rendered from the list the platform actually uses (shared/legal/subprocessors.ts,
 * itself written from the code), rather than from a paragraph somebody typed —
 * which is why the privacy policy can say it "cannot quietly fall out of date"
 * without that being a boast.
 */
function SubProcessorTable({ processors }: { processors: SubProcessor[] }) {
  return (
    <section id="sub-processors" className="scroll-mt-24 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">The service providers we use</h2>
      <div className="space-y-4">
        {processors.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-border bg-card p-4"
            data-testid={`subprocessor-${p.id}`}
          >
            <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/85">{p.purpose}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-medium text-foreground/70">What they receive</dt>
                <dd className="mt-0.5 text-foreground/85">
                  <ul className="space-y-1">
                    {p.dataReceived.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <div>
                  <dt className="font-medium text-foreground/70">Where</dt>
                  <dd className="mt-0.5 text-foreground/85">{p.location}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground/70">When</dt>
                  <dd className="mt-0.5 text-foreground/85">{p.activeWhen}</dd>
                </div>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function LegalIndex() {
  const { data, isPending } = useQuery<LegalIndexResponse>({ queryKey: ["/api/legal"] });

  return (
    <PageFrame>
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-legal-home">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        The Healthy Apples
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Policies</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        What we hold, what we promise, and what we ask of you. Written to be read.
      </p>

      <div className="mt-8 space-y-3">
        {isPending
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          : data?.documents.map((doc) => (
              <Link
                key={doc.slug}
                href={`/legal/${doc.slug}`}
                className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                data-testid={`link-legal-${doc.slug}`}
              >
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{doc.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{doc.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground/70">
                      Version {doc.version} · {doc.effectiveDate}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </PageFrame>
  );
}

function LegalDocumentPage({ slug }: { slug: string }) {
  const { data, isPending, isError } = useQuery<LegalDocumentResponse>({
    queryKey: [`/api/legal/${slug}`],
  });

  return (
    <PageFrame>
      <Link href="/legal" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-legal-index">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All policies
      </Link>

      {isPending && (
        <div className="space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <div data-testid="legal-not-found">
          <h1 className="text-2xl font-semibold text-foreground">We could not find that policy</h1>
          <p className="mt-3 text-base text-muted-foreground">
            It may have moved. All of our policies are listed on the{" "}
            <Link href="/legal" className="text-primary hover:underline">
              policies page
            </Link>
            .
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          <LegalDocumentView
            document={data.document}
            placeholderFields={data.companyPlaceholder.active ? data.companyPlaceholder.fields : undefined}
          />
          {data.subProcessors && data.subProcessors.length > 0 && (
            <SubProcessorTable processors={data.subProcessors} />
          )}
        </div>
      )}
    </PageFrame>
  );
}

export default function LegalPage() {
  const [isDocument, params] = useRoute("/legal/:slug");
  if (isDocument && params?.slug) return <LegalDocumentPage slug={params.slug} />;
  return <LegalIndex />;
}
