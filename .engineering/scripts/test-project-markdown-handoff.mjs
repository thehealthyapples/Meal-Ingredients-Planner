#!/usr/bin/env node
/**
 * test-project-markdown-handoff.mjs — STUB, pending governed implementation.
 *
 * Tracked placeholder only, paired with project-markdown-handoff.mjs, for the
 * same reason (Gate 9's tracked-scope requirement). This file intentionally
 * contains no assertions yet. The governed implementation decision for
 * project-markdown-handoff.mjs must replace this stub with a real,
 * dependency-free regression suite proving at minimum:
 *
 *   1. investigation artifact projection
 *   2. implementation artifact projection
 *   3. correct provenance (repo/branch/HEAD/timestamp/artifact-type/worker)
 *   4. source remains byte-identical after projection
 *   5. traversal rejected
 *   6. non-Markdown source rejected
 *   7. out-of-tree source rejected
 *   8. symlink/reparse escape rejected where testable
 *   9. unrelated destination file is never overwritten
 *  10. distinct same-basename artifacts handled safely (no silent clobber)
 *  11. repeated projection is deterministic/idempotent where appropriate
 *  12. failed destination write leaves source untouched
 *  13. no partial destination artifact remains after failure
 *  14. Windows path-with-spaces destination handled correctly
 *  15. no filesystem interaction with any path containing "Project summaries"
 *
 * Until that decision executes, this stub exits non-zero so it can never be
 * mistaken for a passing verification result.
 */

console.error(
  'test-project-markdown-handoff.mjs is an unimplemented governance stub — no assertions have run.'
);
process.exit(1);
