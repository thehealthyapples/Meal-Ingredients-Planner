---
entry: int-openai
name: OpenAI
section: integrations
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# OpenAI

> The language model behind the Companion, and the enrichment behind
> imported recipes and scanned products.

## What it is

OpenAI is the external language model THA calls when it needs to talk or to
reason about food in words. It powers the Companion's replies, and it enriches
imported recipes and scanned products with the short, plain descriptions a
household reads. It is an admin-configured connection: a household never sees it
directly, only the results it produces.

## Where it lives

| | |
|---|---|
| Source | `server/intelligence/conversation/llm-provider.ts` |
| Source | `server/lib/openai-enrichment.ts` |

## What breaks without it

When no OpenAI key is configured, the conversation gateway swaps in a
`NoOpProvider` — a stand-in that returns a canned message saying it is not
configured rather than throwing (`llm-provider.ts`, the `NoOpProvider` class and
its factory). Enrichment degrades separately: `openai-enrichment.ts` checks for
`OPENAI_API_KEY` and, when it is absent, skips the enrichment step entirely, so
scan and text-import fall back to the heuristic parser instead of AI-written
descriptions. Nothing errors; the household simply gets plainer, unenriched
results.

## Related

- [[dom-companion]] — the domain this model speaks for
- [[cap-companion]] — the Companion capability it underpins

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
