#!/usr/bin/env node
/**
 * project-markdown-handoff.mjs — STUB, pending governed implementation.
 *
 * This file is a tracked placeholder only. It exists so that its exact
 * repo-relative path can be admitted as `scope` in a governed
 * `createThaDecision` call (Gate 9 requires every scope file to already be
 * git-tracked before a decision can be created against it).
 *
 * No implementation logic belongs here until a THA decision scoped to this
 * exact file (and its companion test, test-project-markdown-handoff.mjs) has
 * been approved and executed through Gate 8.
 *
 * Intended contract (for the implementing decision, not enforced here):
 *   projectMarkdownHandoff(sourceRepoRelativePath, { worker, requestId?, decisionId?, executionId? })
 *   - Accepts only regular .md files from docs/investigations/ or docs/implementation/.
 *   - Rejects traversal, absolute paths, non-.md sources, symlinks/reparse escapes,
 *     and sources outside the approved trees.
 *   - Derives repository/branch/HEAD/timestamp/artifact-type where possible.
 *   - Never mutates the source artifact.
 *   - Projects (copies, atomically, collision-safe) into the fixed external root
 *     C:\Users\Colin\The Healthy Apples\Markdown files
 *   - Never touches Project summaries.
 *   - On failure: deterministic non-zero exit, source untouched, no partial
 *     destination file, no deletion of existing projections.
 */

throw new Error(
  'project-markdown-handoff.mjs is an unimplemented governance stub. ' +
    'Implementation is pending a governed THA decision scoped to this file.'
);
