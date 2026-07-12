---
entry: dev-benchmark-world
name: Benchmark World
section: developer-experiences
status: internal
visibility: developer
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Benchmark World

> The fixture households and harness the Companion is scored against before release.

## What it is

The deterministic fixtures and harness used to score the Companion before a
release. It pairs a permanent set of deterministic households with the benchmark
runner that drives each question through the single Companion seam, scores it,
aggregates the result, compares against a baseline, and writes a run report to
history. It runs in three modes — quick, full and certification — and is invoked
from the CLI runner or the Benchmark Households admin page. The seeded households
are a development-environment tool.

## Where it lives

| | |
|---|---|
| Harness | `server/tests/benchmark/` |
| Admin surface | `client/src/pages/admin-benchmark-households-page.tsx` |

## Related

- [[adm-benchmark-households]] — the admin surface that seeds and runs against this world

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
