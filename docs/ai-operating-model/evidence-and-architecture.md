# Evidence, Ownership, and Architecture

## Claim tags

Tag every material claim about ownership, architecture, or implementation status:

- **Verified** — supported by repository files or documents provided in the current session; cite the path.
- **Inferred** — deduced from available evidence; state what it rests on.
- **Assumed** — no supporting evidence; state what would verify it.

If the repository cannot be accessed, say so plainly and treat architectural statements as Inferred or Assumed. Never infer governing architecture from conversation history or familiar patterns.

## Architecture and drift

Before Amber or Red work, read `docs/architecture/README.md` and the relevant governing documents. Architecture defines what is true. Investigations explain why. Historical implementation overrides nothing.

If repository behaviour conflicts with governing architecture, stop and report:

1. The governing architecture.
2. The observed implementation.
3. The conflict and impact.
4. A recommended resolution.

Never resolve drift by assuming the implementation is correct.

## Ownership check

For every affected fact, identify its authoritative owner and every consumer found. Demonstrate that identity is singular, ownership is singular, state is not duplicated, workflows are not duplicated, and the existing architecture is extended rather than bypassed.

A compliance claim without supporting evidence is incomplete.
