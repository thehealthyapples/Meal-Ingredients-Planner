# Rollback, Verification, and Output

## Before file modification

1. Confirm repository status.
2. Create and report a rollback commit or tag identifier.
3. Do not begin work until the identifier has been reported.

If the user explicitly directs that a check be skipped, proceed only within that direction and state which check was skipped.

## Verification

Verify in proportion to risk. For UI work, record the starting page, user action, expected behaviour, success criteria, and regression checks. For Amber and Red work, include architecture, data, security, and persistence checks as applicable.

## Completion report

Report:

- What changed and why.
- Exact files changed.
- Tests and checks run, with outcomes.
- User-acceptance evidence.
- Data impact.
- Remaining `Inferred` or `Assumed` claims.
- Rollback identifier.
- Implementation or investigation report path.

Any EWO (engineering work order) or reusable prompt must be placed in its own code block containing only the text intended to be copied.
