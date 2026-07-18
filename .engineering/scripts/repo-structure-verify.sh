#!/usr/bin/env bash
# Assert the repository structure rules in docs/architecture/REPOSITORY_CONVENTIONS.md.
#
#   .engineering/scripts/repo-structure-verify.sh
#
# Fails if a report or artefact has appeared at the repository root, if a
# document has more than one home, or if docs/implementation/ has loose files.
# Read-only: it inspects the tree and never modifies it.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

fail=0
check() { if [ "$2" -eq 0 ]; then printf '  PASS  %s\n' "$1"
          else printf '  FAIL  %s\n' "$1"; fail=1; fi }

echo "Repository structure verification"
echo

# 1. Root allowlist. Everything permitted at the root, per REPOSITORY_CONVENTIONS §2.
#    Gitignored files are not the repository's business and are skipped.
ALLOWED="package.json package-lock.json tsconfig.json vite.config.ts \
tailwind.config.ts postcss.config.js drizzle.config.ts capacitor.config.ts \
components.json .replit .gitignore .env.example deploy.sh \
RELEASE.md MIGRATIONS.md replit.md eng.traineddata"
ALLOWED="$(printf '%s' "$ALLOWED" | tr -s '[:space:]' ' ')"   # one line, single-spaced

strays=""
while IFS= read -r f; do
  b="${f#./}"
  # In a LINKED WORKTREE, .git is a FILE (a gitdir pointer), not a directory, so
  # `find -type f` returns it and it was reported as a stray. That made this
  # verifier unusable in exactly the place OPERATING_MANUAL.md Step 6 sends you —
  # "compare against the rollback tag in a temporary worktree if unsure".
  # .git is never a stray in either form. Fixed by ENGGOV1.
  [ "$b" = ".git" ] && continue
  git check-ignore -q "$b" 2>/dev/null && continue     # gitignored: not ours
  case " $ALLOWED " in *" $b "*) continue;; esac
  strays="$strays $b"
done < <(find . -maxdepth 1 -type f)

[ -z "$strays" ]
check "root contains only permitted files" $?
[ -n "$strays" ] && for s in $strays; do echo "        stray: $s"; done

# 2. No reports at root — the specific failure this system exists to prevent.
! ls *.md 2>/dev/null | grep -qvE '^(RELEASE|MIGRATIONS|replit)\.md$'
check "no report .md files at root" $?
[ -z "$(ls *.txt 2>/dev/null)" ]
check "no .txt reports/diagnostics at root" $?

# 3. docs/implementation/ and docs/investigations/ are filed by workstream: the only
#    file permitted at their top level is an index/governance README.md (DOCSTRUCT1).
impl_loose="$(find docs/implementation -maxdepth 1 -type f ! -name 'README.md' | wc -l)"
[ "$impl_loose" -eq 0 ]
check "docs/implementation/ has no loose files (all filed by workstream; README.md index only)" $?
inv_loose="$(find docs/investigations -maxdepth 1 -type f ! -name 'README.md' | wc -l)"
[ "$inv_loose" -eq 0 ]
check "docs/investigations/ has no loose files (all filed by workstream; README.md index only)" $?

# 4. Every document has one canonical home. Detected by CONTENT, not filename:
#    an investigation and its implementation report legitimately share an EWO
#    name (e.g. DEC1_CANONICAL_DECISION_ENGINE.md) but are different documents.
#    A true duplicate is the same bytes in two places.
dupes="$(find docs -type f \( -name '*.md' -o -name '*.txt' \) -not -path 'docs/investigations/backups/*' \
          -exec sha1sum {} + 2>/dev/null | sort | uniq -w40 -d --all-repeated=separate)"
[ -z "$dupes" ]
check "no duplicate documents (identical content in two places)" $?
[ -n "$dupes" ] && echo "$dupes" | sed 's/^/        /'

# 5. Engineering tooling is not in docs/.
[ ! -d docs/session ] && [ ! -f docs/implementation/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md ]
check "no engineering tooling under docs/" $?

# 6. The conventions document exists and is indexed in the architecture README.
[ -f docs/architecture/REPOSITORY_CONVENTIONS.md ]
check "REPOSITORY_CONVENTIONS.md exists" $?
grep -q "REPOSITORY_CONVENTIONS.md" docs/architecture/README.md 2>/dev/null
check "REPOSITORY_CONVENTIONS.md indexed in architecture README" $?

# 7. Every governing architecture document is indexed in its README (DOCGOV1).
#    An architecture doc in the right folder but absent from the index is still
#    drift — "invisible by navigation" — so a new one cannot land silently.
#    Capability Cards live in the capabilities/ subtree and are indexed there.
unindexed=""
for f in docs/architecture/*.md; do
  b="$(basename "$f")"
  [ "$b" = "README.md" ] && continue
  grep -q "$b" docs/architecture/README.md 2>/dev/null || unindexed="$unindexed $b"
done
[ -z "$unindexed" ]
check "every architecture document indexed in README.md" $?
[ -n "$unindexed" ] && for u in $unindexed; do echo "        unindexed: $u"; done

# 8. Companion and House reports live in their own workstreams (DOCGOV2), never in
#    the generic ux/ folder. Loose-root filing is already caught by #3. A small,
#    documented allow-list grandfathers pre-existing ux/ files that cannot move
#    (governing-doc citation lock, an unresolved ux/architecture name-duplication,
#    or a genuine cross-domain owner call) — see REPOSITORY_CONVENTIONS.md §4.
CH_ALLOW="CP2_COMPANION_PERSONALITIES_ACTIVATION.md EWX1_LIVING_COMPANION_EXPERIENCE.md \
INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md EXP5_ONE_HOME_MANY_PLACES.md \
DESIGN1_HOME_VISUAL_DESIGN.md HOUSE1_THE_ENTRANCE_HALL.md \
NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT.md WX2_HOME_INTELLIGENCE_COMPANION_IMPLEMENTATION.md \
WX3_PLANNER_INTELLIGENCE_COMPANION_IMPLEMENTATION.md"
CH_ALLOW="$(printf '%s' "$CH_ALLOW" | tr -s '[:space:]' ' ')"
misfiled=""
for f in docs/implementation/ux/*.md docs/investigations/ux/*.md; do
  [ -e "$f" ] || continue
  b="$(basename "$f")"
  case " $CH_ALLOW " in *" $b "*) continue;; esac
  if printf '%s' "$b" | grep -qE 'COMPANION|^CP[0-9]'; then misfiled="$misfiled companion→$f"; fi
  if printf '%s' "$b" | grep -qE 'ARRIVAL|NORTH[0-9]|(^|_)HOME(_|\.)|HOUSE[0-9]|ORCHARD_HOUSE'; then misfiled="$misfiled house→$f"; fi
done
[ -z "$misfiled" ]
check "no Companion/House reports in the generic ux/ folder (belong in companion/ , house/)" $?
[ -n "$misfiled" ] && for m in $misfiled; do echo "        misfiled: $m"; done

echo
if [ "$fail" -eq 0 ]; then echo "Repository structure is clean."
else echo "Structure violations found — see docs/architecture/REPOSITORY_CONVENTIONS.md" >&2; fi
exit "$fail"
