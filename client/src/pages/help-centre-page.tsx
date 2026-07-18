// BUS1 — the Help Centre.
//
// EXPERIENCE TEST (THA_EXPERIENCE_BLUEPRINT.md § 15.3):
//   Which room is this?  The reference shelf. Somebody comes here mid-task,
//                        already slightly stuck, wanting one answer and then to
//                        get back to what they were doing.
//   How should someone feel here?  Calm and capable. Not lectured at, not sold
//                        to, and never handed a confident answer that was
//                        generated rather than written.
//   The one thing it helps them do?  FIND the one article that answers the
//                        question they arrived with — or find out plainly that
//                        we have not written it, and where to ask instead.
//
// Search is the API's job, not this page's. `GET /api/help` calls
// `searchHelpArticles` in shared/support/help-centre.ts, which is the single
// owner of what "matching" means (ARCHITECTURE_PRINCIPLES.md Principle 2). This
// page renders what comes back and nothing else — when a search matches nothing
// it says so and offers the contact page. It never assembles a suggestion of
// its own, because a made-up answer here would be read as a written one.

import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LifeBuoy, Search } from "lucide-react";
import type { HelpArticle, HelpBlock, HelpCategory } from "@shared/support/help-centre";
import { helpArticle } from "@shared/support/help-centre";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadError } from "@/components/ui/load-error";

interface HelpResponse {
  categories: HelpCategory[];
  articles: HelpArticle[];
  query: string;
}

/** One block of an article. `note` is the only kind that gets a box, and only ever quietly. */
function ArticleBlock({ block }: { block: HelpBlock }) {
  if (block.kind === "paragraph") {
    return <p className="text-sm leading-relaxed text-foreground/85">{block.text}</p>;
  }

  if (block.kind === "steps") {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <p className="text-sm leading-relaxed text-foreground/85">{block.text}</p>
    </div>
  );
}

function ArticleView({
  article,
  onSelect,
  onBack,
}: {
  article: HelpArticle;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const related = (article.related ?? [])
    .map((id) => helpArticle(id))
    .filter((a): a is HelpArticle => Boolean(a));

  return (
    <div className="space-y-6" data-testid={`help-article-${article.id}`}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={onBack}
        data-testid="button-help-back-to-list"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        All articles
      </Button>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {article.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
      </div>

      <div className="space-y-4">
        {article.body.map((block, i) => (
          <ArticleBlock key={i} block={block} />
        ))}
      </div>

      {article.deepLink && (
        <Link
          href={article.deepLink}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          data-testid={`link-help-deeplink-${article.id}`}
        >
          Take me there
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      {related.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Also worth reading</h2>
            <ul className="space-y-1">
              {related.map((r) => (
                <li key={r.id}>
                  <Button
                    variant="ghost"
                    className="h-auto justify-start p-0 text-left text-sm text-primary hover:underline"
                    onClick={() => onSelect(r.id)}
                    data-testid={`button-help-related-${r.id}`}
                  >
                    {r.title}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default function HelpCentrePage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const trimmed = query.trim();
  const path = trimmed ? `/api/help?q=${encodeURIComponent(trimmed)}` : "/api/help";
  const { data, isPending, isError, refetch } = useQuery<HelpResponse>({ queryKey: [path] });

  const articles = data?.articles ?? [];
  const selected = selectedId
    ? articles.find((a) => a.id === selectedId) ?? helpArticle(selectedId)
    : undefined;

  const openArticle = (id: string) => {
    setSelectedId(id);
    window.scrollTo({ top: 0 });
  };

  const stillStuck = (
    <Card data-testid="card-help-still-stuck">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Still stuck?</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Send us a message and a person will read it.
          </p>
        </div>
        <Link href="/contact" data-testid="link-help-contact">
          <Button variant="outline" className="w-full sm:w-auto">
            <LifeBuoy className="mr-2 h-4 w-4" aria-hidden="true" />
            Contact us
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <>
      <WorkspaceHeader
        realm="diary"
        title="Help Centre"
        wide
        back={{ href: "/profile", label: "Profile" }}
      />

      <div
        className={`${pageContainerClass(true)} space-y-4 sm:space-y-6`}
        data-testid="page-help-centre"
      >
        {selected ? (
          <>
            <ArticleView
              article={selected}
              onSelect={openArticle}
              onBack={() => setSelectedId(null)}
            />
            {stillStuck}
          </>
        ) : (
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help"
                aria-label="Search help articles"
                className="pl-9"
                data-testid="input-help-search"
              />
            </div>

            {isPending && (
              <div className="space-y-3" aria-busy="true" aria-label="Loading help articles">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            )}

            {isError && (
              <LoadError
                what="the Help Centre"
                onRetry={() => refetch()}
                data-testid="error-help-centre"
              />
            )}

            {data && trimmed && articles.length === 0 && (
              <EmptyState
                variant="filtered"
                icon={Search}
                title={`Nothing matches "${trimmed}"`}
                description="We have not written an article about that. Ask us instead and we will answer you directly."
                action={
                  <Link href="/contact" data-testid="link-help-contact-empty">
                    <Button variant="outline" size="sm">
                      Contact us
                    </Button>
                  </Link>
                }
                data-testid="empty-help-search"
              />
            )}

            {data && articles.length > 0 && (
              <div className="space-y-6">
                {trimmed && (
                  <p className="text-sm text-muted-foreground" data-testid="text-help-result-count">
                    {articles.length === 1 ? "1 article" : `${articles.length} articles`} match
                    {articles.length === 1 ? "es" : ""} "{trimmed}".
                  </p>
                )}

                {data.categories.map((category) => {
                  const inCategory = articles.filter((a) => a.category === category.id);
                  if (inCategory.length === 0) return null;

                  return (
                    <section key={category.id} className="space-y-3">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">{category.title}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="space-y-2">
                        {inCategory.map((article) => (
                          <Button
                            key={article.id}
                            variant="ghost"
                            onClick={() => openArticle(article.id)}
                            className="block h-auto w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
                            data-testid={`button-help-article-${article.id}`}
                          >
                            <h3 className="text-sm font-semibold text-foreground">{article.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-normal">
                              {article.summary}
                            </p>
                          </Button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {stillStuck}
          </>
        )}
      </div>
    </>
  );
}
