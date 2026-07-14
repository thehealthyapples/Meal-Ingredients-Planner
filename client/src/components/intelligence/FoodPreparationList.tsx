// SURF1A — Food Preparation List.
//
// The ONE client owner of preparation knowledge's presentation. Every surface
// that shows a preparation renders it through this component, so the domain's
// central trust rule can only be got wrong in one place.
//
// WS5A §4.3 names that rule: a household must be able to tell
//
//   "we know it doesn't matter"  (no-change — an evidenced finding, REASSURING)
//   from
//   "nobody knows yet"           (unreviewed — an absence, HONEST)
//
// They are different facts and they must never collapse into one vague line.
// So the two states render differently here, and an unreviewed preparation
// carries NO nutrition sentence at all — silence is the design (WS5A §4), and it
// must never be filled with a hedge to make the section look finished.
//
// This component authors no wording. `approvedWording` is the exact sentence the
// Layer-2 evidence gate signed off; it is printed verbatim or not at all. The
// citations that earned a claim the right to be spoken are printed with it.
//
// Existence is unconditional (Rule KC6): every preparation the owner links to a
// food is listed, whether or not the evidence says anything about it. An effect
// never gates a preparation's visibility.

import { Info, Check, ExternalLink } from "lucide-react";
import { IntelligenceChip } from "./IntelligenceChip";
import { cn } from "@/lib/utils";

// ── Wire type (mirrors the server's PreparationView) ──────────────────────────

export interface PreparationSourceRef {
  body: string;
  title: string;
  url: string;
  evidenceLevel: "established" | "emerging";
  lastReviewed: string;
}

export interface FoodPreparation {
  slug: string;
  name: string;
  /** state | preservation | cooking | processing (WS5A §1.6). */
  prepType: string;
  family: string | null;
  description: string | null;
  ranking: number;
  /** The three honest states. Switch on this — never render two of them alike. */
  state: "effect" | "no-change" | "unreviewed";
  /** Non-null for "effect" and "no-change"; ALWAYS null for "unreviewed". */
  approvedWording: string | null;
  uncertaintyNote: string | null;
  sourceRefs: PreparationSourceRef[];
  confidence: "established" | "strong" | "emerging" | "under-review" | null;
}

// ── Claim row ────────────────────────────────────────────────────────────────

function PreparationClaim({ preparation }: { preparation: FoodPreparation }) {
  // Guarded by the caller, but stated here too: no wording, no claim row. This
  // component will not compose a sentence to stand in for one it was not given.
  if (!preparation.approvedWording) return null;

  const reassuring = preparation.state === "no-change";

  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-2.5",
        reassuring
          ? "border-green-200 bg-green-50/60 dark:border-green-800/50 dark:bg-green-950/20"
          : "border-border/60 bg-muted/30",
      )}
      data-testid={`food-preparation-claim-${preparation.slug}`}
    >
      <div className="flex items-start gap-2">
        {reassuring ? (
          <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-700/80 dark:text-green-400/80" />
        ) : (
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-foreground/80">{preparation.name}</p>

          {/* The approved sentence, verbatim. */}
          <p className="text-sm leading-relaxed text-foreground/75">
            {preparation.approvedWording}
          </p>

          {/* The hedge shown alongside a weaker-than-established claim. */}
          {preparation.uncertaintyNote && (
            <p className="text-[11px] italic leading-snug text-muted-foreground/65">
              {preparation.uncertaintyNote}
            </p>
          )}

          {/* The citations that earned the claim the right to be spoken. */}
          {preparation.sourceRefs.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
              {preparation.sourceRefs.map((ref) => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={ref.title}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 underline-offset-2 hover:text-foreground hover:underline"
                  data-testid={`food-preparation-source-${preparation.slug}`}
                >
                  {ref.body}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

// ── The list ─────────────────────────────────────────────────────────────────

export function FoodPreparationList({
  preparations,
  className,
}: {
  preparations: FoodPreparation[];
  className?: string;
}) {
  if (preparations.length === 0) return null;

  // A claim exists only where the evidence gate signed one off. Today most foods
  // have none, and that is the correct, published state of the knowledge — the
  // list of forms below stands on its own without it.
  const claims = preparations.filter((p) => p.approvedWording !== null);

  return (
    <div className={cn("space-y-2.5", className)} data-testid="food-preparations">
      <div className="flex flex-wrap gap-1.5" role="list">
        {preparations.map((p) => (
          <span role="listitem" key={p.slug} data-testid={`food-preparation-${p.slug}`}>
            <IntelligenceChip label={p.name} kind="preparation" />
          </span>
        ))}
      </div>

      {claims.length > 0 && (
        <ul className="space-y-1.5">
          {claims.map((p) => (
            <PreparationClaim key={p.slug} preparation={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
