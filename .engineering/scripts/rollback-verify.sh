#!/usr/bin/env bash
# Assert the Rollback Protection Protocol — see ../protocols/ROLLBACK_PROTECTION_PROTOCOL.md.
#
#   .engineering/scripts/rollback-verify.sh                  # every active session
#   .engineering/scripts/rollback-verify.sh --session <ID>   # one session
#   .engineering/scripts/rollback-verify.sh <tag>            # one tag, standalone
#
# The protocol has been enforced by memory since EOM1: nothing checked that a
# recorded rollback identifier existed, was annotated, resolved to a commit, or
# matched between the run file and the dashboard. A session could therefore be
# registered against a rollback point that was never created, and nobody would
# discover it until the moment it was needed.
#
# This script defines NO rule. Every rule it asserts is stated in the protocol,
# which remains the owner; this is the execution of that document, not a rival
# to it.
#
# Severity is deliberately split. A tag that is missing, lightweight, or
# unresolvable FAILS — the protection is not there. A tag whose NAME does not
# match §7 only WARNS: §7 admits a historic `rollback/before-<name>-<date>` form
# and states that existing tags are never renamed, so failing on them would make
# this script permanently red on legitimate history — and a gate that cannot be
# satisfied is a gate that gets switched off.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SESSION_DIR=".engineering/session"
CURRENT="$SESSION_DIR/CURRENT.md"

EXCEPTIONS=".engineering/GOVERNANCE_EXCEPTIONS.md"

fail=0
warned=0
excepted=0
EXEMPT=""
CURRENT_SID=""

# Sessions the governance exceptions register has consciously accepted (ENGGOV1).
# The register OWNS this list; this script only reads it. A defect covered here is
# still printed and still counted — it reports as EXC, never as PASS — but it does
# not fail the run, because 12 of these sessions can NEVER be repaired (a rollback
# tag created today protects today, not the state the session began from), and a
# gate that can never go green is a gate that gets switched off.
if [ -f "$EXCEPTIONS" ]; then
  EXEMPT="$(sed -n '/<!-- EXEMPT:BEGIN/,/<!-- EXEMPT:END/p' "$EXCEPTIONS" \
            | grep -vE '^<!--|^```' | tr -d ' \t')"
fi

is_exempt() { # is_exempt <session-id>
  [ -n "$1" ] || return 1
  printf '%s\n' "$EXEMPT" | grep -qxF "$1"
}

check() { # check <description> <0-if-ok>
  if [ "$2" -eq 0 ]; then printf '  PASS  %s\n' "$1"
  elif is_exempt "$CURRENT_SID"; then
    printf '  EXC   %s  [accepted — GOVERNANCE_EXCEPTIONS.md]\n' "$1"; excepted=$((excepted + 1))
  else printf '  FAIL  %s\n' "$1"; fail=1; fi
}
warn() { printf '  WARN  %s\n' "$1"; warned=1; }

# --- One tag, against the protocol -----------------------------------------
verify_tag() { # verify_tag <tag> <context>
  local tag="$1" ctx="$2" type sha

  if ! git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1; then
    check "$ctx: tag exists — $tag" 1
    return
  fi
  check "$ctx: tag exists — $tag" 0

  # §2: an annotated tag. A lightweight tag carries no author, date or message.
  type="$(git cat-file -t "refs/tags/$tag" 2>/dev/null)"
  [ "$type" = "tag" ]
  check "$ctx: tag is annotated (-a), not lightweight" $?

  # §2: always resolve through ^{commit} — on an annotated tag a bare rev-parse
  # returns the tag object, not the commit it protects.
  sha="$(git rev-parse -q --verify "refs/tags/$tag^{commit}" 2>/dev/null)"
  [ -n "$sha" ]
  check "$ctx: resolves to a commit${sha:+ — ${sha:0:8}}" $?

  # §7: rollback/<WORKSTREAM>-<slug>-<YYYYMMDD>, or the historic before- form.
  if ! printf '%s' "$tag" | grep -Eq '^rollback/[A-Za-z0-9_]+-[A-Za-z0-9-]+-[0-9]{8}$'; then
    if printf '%s' "$tag" | grep -Eq '^rollback/before-'; then
      : # Historic form, explicitly admitted by §7. Never renamed.
    else
      warn "$ctx: name does not match §7 rollback/<WORKSTREAM>-<slug>-<YYYYMMDD> — $tag"
    fi
  fi
}

# --- Extract the rollback identifier a session has recorded -----------------
# §6 requires the identifier to be identical in the run file and the dashboard.
#
# Rewritten in pure bash/awk (2026-11-09): the original shelled out to `python3`,
# which on this machine resolves to the Windows Store app-execution-alias stub
# rather than a real interpreter — so every call silently produced no output,
# and every session in the dashboard FAILed this check regardless of whether its
# rollback identifier was actually present. Confirmed by hand for
# KNOW3_UNCITED_CLAIM_FILTER_20261105: the dashboard row does carry
# `rollback/KNOW3-uncited-claim-filter-20261105`, yet the python3 path reported
# nothing. This version does the identical parse — find the dashboard row whose
# first cell is `` `<sid>` ``, take its third cell, extract the first
# `` `rollback/...` `` token — with no external interpreter dependency.
# Original (python3-based) version preserved at
# rollback-verify.sh.pre-python3-fix-<timestamp>.bak.
tag_from_dashboard() { # tag_from_dashboard <session-id>
  local sid="$1"
  [ -f "$CURRENT" ] || return 0
  awk -F'|' -v sid="$sid" '
    BEGIN { pat = "| `" sid "` |" }
    index($0, pat) == 1 {
      cell3 = $4
      if (match(cell3, /`rollback\/[^`]+`/)) {
        tok = substr(cell3, RSTART, RLENGTH)
        gsub(/`/, "", tok)
        print tok
      }
      exit
    }
  ' "$CURRENT"
}

tag_from_run_file() { # tag_from_run_file <session-id>
  local run="$SESSION_DIR/runs/$1.md"
  [ -f "$run" ] || return 0
  grep -oE '`rollback/[^`]+`' "$run" | head -1 | tr -d '`'
}

verify_session() { # verify_session <session-id>
  local sid="$1" dash run
  CURRENT_SID="$sid"
  dash="$(tag_from_dashboard "$sid")"
  run="$(tag_from_run_file "$sid")"

  echo "  $sid"

  [ -f "$SESSION_DIR/runs/$sid.md" ]
  check "$sid: run file exists" $?

  if [ -z "$dash" ]; then
    check "$sid: dashboard records a rollback identifier" 1
    return
  fi

  # §6: identical in all three. The report is prose and is not machine-checked
  # here; the two machine-readable records are.
  if [ -n "$run" ]; then
    [ "$dash" = "$run" ]
    check "$sid: identifier identical in run file and dashboard (§6)" $?
  else
    warn "$sid: run file records no rollback identifier (§6 requires it)"
  fi

  verify_tag "$dash" "$sid"
}

echo "Rollback Protection — protocol verification"
echo

MODE="${1:-}"
case "$MODE" in
  --session)
    SID="${2:-}"
    [ -n "$SID" ] || { echo "usage: $0 --session <SESSION_ID>" >&2; exit 2; }
    verify_session "$SID"
    ;;
  "")
    if [ ! -f "$CURRENT" ]; then
      echo "  no dashboard at $CURRENT — nothing to verify"
      exit 0
    fi
    mapfile -t SESSIONS < <(grep -oE '^\| `[^`]+`' "$CURRENT" | sed 's/^| `//; s/`$//')
    if [ "${#SESSIONS[@]}" -eq 0 ]; then
      echo "  no active sessions on the dashboard — nothing to verify"
      exit 0
    fi
    for sid in "${SESSIONS[@]}"; do
      verify_session "$sid"
    done
    ;;
  --*)
    echo "usage: $0 [--session <SESSION_ID> | <tag>]" >&2
    exit 2
    ;;
  *)
    verify_tag "$MODE" "tag"
    ;;
esac

echo
if [ "$excepted" -ne 0 ]; then
  echo "$excepted accepted exception(s) — recorded in GOVERNANCE_EXCEPTIONS.md, not silently passed."
fi
if [ "$fail" -ne 0 ]; then
  echo "Rollback protection is INCOMPLETE — see protocols/ROLLBACK_PROTECTION_PROTOCOL.md." >&2
  exit 1
fi
if [ "$warned" -ne 0 ]; then
  echo "Rollback protection present; naming advisories above (§7 admits historic forms)."
else
  echo "Rollback protection verified."
fi
exit 0
