---
entry: hid-notice-engine
name: Companion Notice Engine (built, unreachable)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Companion Notice Engine (built, unreachable)

> Seven kinds of proactive notice — the whole reason Home has a Reminders
> section — served by an endpoint the client never calls.

## What it is

The Notice Engine is a fully built server engine that produces seven kinds of
proactive notice for the household — nutrition trend, streak milestone, plant
diversity milestone, planner gap, pantry opportunity, shopping opportunity and
seasonal highlight. Each notice is a verbatim projection of a fact an existing
platform owner already computed; the engine invents nothing, applies Silence
Rules server-side, and caps how many surface at once. It is the whole reason
Home has a Reminders section. Today that section always renders empty, because
the client never calls the endpoint that serves these notices.

## Where it lives

| | |
|---|---|
| Engine | `server/intelligence/conversation/notice-engine.ts` |
| Server route | `server/routes.ts#L11540` |
| Client hook | `client/src/hooks/use-companion-observations.ts#L27` |

Home consumes the hook at `client/src/pages/home-experience-page.tsx` and renders
up to three notices in its Reminders section.

## Why it is unreachable

The client and the server disagree on the endpoint, so every fetch 404s. There
is, in fact, a double mismatch:

1. **Path.** The client fetches `/api/intelligence/companion/observations`; the
   server only registers `/api/intelligence/companion/notices`. The
   `/observations` path is not served, so the request 404s.
2. **Payload shape.** Even were the path aligned, the server responds with
   `{ notices, trust }`, while the client hook types and reads
   `{ observations }`. Home slices `observationsData?.observations`, which would
   be `undefined` against the server's actual body.

Because the request fails, `observationsData` is undefined and Home's Reminders
section — which shows nothing when there are no notices — is silently empty. The
household never sees a single notice, no matter how many the engine would have
produced.

## What it would take to reach it

Align the client to the served endpoint. The engine, the route and Home's
rendering are all complete; the gap is one hook. Pointing
`use-companion-observations.ts` at `/api/intelligence/companion/notices` and
reading the `notices` field from the response (or, equivalently, renaming the
server's route and response key to `observations`) would connect all seven
notices to the household in a single change.

## Known defects

- `fnd-dead-reminders` — the Reminders section fetches an endpoint that does not
  exist, so it silently renders empty. See PDA1.

## Evidence

> The client fetches /api/intelligence/companion/observations; the server only
> serves /api/intelligence/companion/notices. Every fetch 404s and Reminders
> silently renders empty.

Confirmed verbatim against both files. Client
(`use-companion-observations.ts#L30`):
`const res = await fetch("/api/intelligence/companion/observations", {`. Server
(`routes.ts#L11540`):
`app.get("/api/intelligence/companion/notices", async (req, res) => {`. The
server's only response body is `res.json({ notices, trust: { ... } })`
(`routes.ts#L11629`), while the client hook declares
`{ readonly observations: readonly CompanionObservation[] }`.

## Related

- [[ntf-nutrition-trend]] — a notice this engine produces
- [[ntf-streak-milestone]] — a notice this engine produces
- [[ntf-diversity-milestone]] — a notice this engine produces
- [[page-home]] — the surface whose Reminders section this feeds

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
