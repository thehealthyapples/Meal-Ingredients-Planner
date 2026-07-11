# OPS1 — Production Media Storage — Implementation

**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Changes where uploaded meal photo bytes are written and how a failed write behaves. No data migration, no schema change, no client change — but production now *declines* an upload it would previously have accepted and silently destroyed.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/OPS1-production-media-storage-20260711` → `f86a094a0431929d90d6dab90bfe0ce05e196349` |
| Tagged commit | `REL2 — Deployment configuration convergence (closes REL1 Blocker 3)` |
| Working tree at tag time | **Dirty, and it still is.** See below. |
| This task's writes | `server/lib/media-storage.ts`, `server/routes.ts`, `server/index.ts`, `server/tests/test-ops1-media-storage.ts`, `package.json`, `package-lock.json`, `.env.example`, `RELEASE.md`, `docs/implementation/platform/REL1_RELEASE_PACKAGING.md`, `docs/implementation/platform/REL2_DEPLOYMENT_CONFIGURATION_CONVERGENCE.md`, `.engineering/session/runs/OPS1_Production_Media_Storage.md`, this file |
| Rollback to committed state | `git checkout rollback/OPS1-production-media-storage-20260711` |

> **The tag was created before implementation and is preserved, not regenerated** (Rollback Protection Protocol § 6). It resolves to the same commit as `HEAD` did at session start, because OPS1's work was entirely uncommitted when this session resumed.
>
> **What the tag does NOT cover.** A tag protects committed state only. When it was cut, the working tree already carried **unrelated, unauthored** work — `docs/product/`, the `PDA1` audit and its roadmap, `scripts/build-product-inventory.ts` and siblings, `.engineering/session/CURRENT.md`, `.engineering/session/INDEX.md`, and a tooling edit to `.replit`. **None of it is OPS1's, none of it is in OPS1's commit, and none of it was touched.** Rolling back to this tag restores OPS1's files; it does not restore or remove any of those, which remain exactly as they were.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — searched for a media/uploads row: **there is none.** Media bytes are not a registered fact domain; `server/lib/media-storage.ts` is their sole owner, and OPS1 keeps it that way.
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `docs/implementation/platform/REL1_RELEASE_PACKAGING.md` (Blocker 2 — the blocker this closes)
- [x] `docs/implementation/platform/REL2_DEPLOYMENT_CONFIGURATION_CONVERGENCE.md` (Blocker B — the same blocker, corrected to the real deploy target)
- [x] `RELEASE.md` § Deployment Configuration

---

## THE DEFECT

`server/lib/media-storage.ts` resolved every uploaded meal photo to `process.cwd()/uploads/meal-photos` and served it with Express static middleware.

**Production is Render.** A Render web service's filesystem is rebuilt on every deploy and is not shared between instances. So:

1. A household uploads a photo of their dinner. The platform writes it to a disk that is about to be destroyed, and **reports success.**
2. The URL is written to the `meals` row. It is durable. It is in Postgres.
3. The next deploy happens. The bytes are gone. The URL is not.
4. The household's photo is now a permanently broken image — and nothing anywhere logged an error, because nothing failed. The upload *worked*. The disk just stopped existing.

The database and the filesystem had different lifetimes, and the code was written as though they had the same one. That is `REL1` Blocker 2 / `REL2` Blocker B, and it is a data-loss defect: the household's own content, destroyed by a routine release, silently.

**Why it survived so long:** local disk was the default in *every* environment. Production never chose it. Production **inherited** it — and a default nobody chose is a decision nobody reviewed.

---

## WHAT WAS BUILT

**One canonical media store, two providers behind one unchanged interface.** `saveMediaFile()` and `deleteMediaFile()` keep their exact signatures; `server/routes.ts` never learns which provider is active.

| Provider | Where bytes live | Who serves them | When |
|---|---|---|---|
| `local` | `uploads/meal-photos/` on disk | Express static middleware | Development. Production **only** with a persistent volume mounted at `UPLOAD_DIR`, explicitly chosen. |
| `s3` | An S3-compatible bucket | The bucket, directly | **The canonical production provider.** Cloudflare R2 is the approved bucket; AWS S3 / B2 / MinIO also work. |

### The fix is the resolver, not the SDK

`resolveMediaStorage(env)` is pure, total, and reads nothing but the environment. It never throws and never touches the network, so the boot log, the tests, and an operator reading Render's env panel all reason about production the same way.

| Environment | `MEDIA_STORAGE_PROVIDER` | Credentials | → Resolves to |
|---|---|---|---|
| development | unset | — | `local` (costs nothing, the working copy) |
| **production** | **unset** | **none** | **`unavailable` ← the fix** |
| production | unset | present | `s3` |
| production | `s3` | **partial** | **`unavailable` — never a fallback to local disk** |
| production | `local` | — | `local` (a mounted volume — a human typed this) |
| any | anything else | — | `unavailable` (an unknown name is not a guess) |

Two rows carry the whole change:

- **Unconfigured production is `unavailable`, not `local`.** A production deployment that has not been told where media lives does not guess. It declines the upload and says so. This is the row that would have prevented the defect.
- **A half-configured bucket is `unavailable`, not a fallback.** The tempting "graceful degradation" here is the worst possible outcome: it writes bytes into a location nobody can read back, and reports success while doing it — the original defect, wearing a helmet. Declining is strictly safer than pretending.

Local storage in production remains *permitted* — a mounted Render disk is a legitimate answer — but only when someone types `MEDIA_STORAGE_PROVIDER=local`. **Permitted, never inherited.**

### Failure is safe, and "safe" means opposite things for save and delete

This is the part most likely to be "corrected" by a future reader, so it is stated plainly:

| | Behaviour | Why the opposite would be a bug |
|---|---|---|
| `saveMediaFile` | **MUST throw** | Returning a URL for bytes that were never stored writes a pointer to nothing into the `meals` row — the exact defect OPS1 exists to fix, recreated at a smaller scale. |
| `deleteMediaFile` | **MUST NOT throw** | `PATCH /api/meals/:id/image` deletes the *old* photo before writing the new URL. If a delete failure propagated, a storage hiccup would stop a household **replacing** a photo. An orphaned object costs a fraction of a cent; a blocked edit costs the household their work. |

A failed delete is therefore logged and swallowed, and the row update proceeds. That is a deliberate trade, not an oversight.

`MediaStorageUnavailableError` → **HTTP 503**, not 500: *"Photo storage is temporarily unavailable. Your recipe is safe — please try adding the photo again shortly."* Nothing is half-saved, because the upload endpoint is pure — the meal row is only touched by the separate `PATCH` once a URL exists.

### Delete stays inside its own storage

`meals.imageUrl` also holds DALL·E URLs and recipe images scraped from publisher sites. Delete ignores every URL this platform did not upload, refuses path traversal on both providers, and treats a legacy `/uploads/meal-photos/...` URL as a no-op under `s3` (it was never in the bucket) while still cleaning it up under `local`. **Rows written before OPS1 keep working.**

### One serving path, never two

When `s3` is active the Express static mount **is not registered at all** (`server/index.ts`). The bucket serves its own bytes. There is never a moment where two things could serve the same photo.

---

## FILES CHANGED

| File | Change |
|---|---|
| `server/lib/media-storage.ts` | **+380 / −49.** The provider resolver, the S3 provider (lazily-imported SDK), the local provider, `MediaStorageUnavailableError`, and `logMediaStorageStatus()`. Still the single owner of media bytes. |
| `server/routes.ts` | **+13 / −3.** Maps `MediaStorageUnavailableError` → 503. Comment corrections. No signature changed. |
| `server/index.ts` | **+12 / −7.** Logs the active provider at boot; mounts Express static **only** when the local provider is active. |
| `server/tests/test-ops1-media-storage.ts` | **NEW, 478 lines.** 41 assertions. |
| `package.json` | Adds `@aws-sdk/client-s3` and the `test:ops1-media-storage` script; wires it into `npm test`. |
| `package-lock.json` | The dependency tree for the above. |
| `.env.example` | Documents all seven `MEDIA_*` variables and states plainly that unset-in-production is a refusal, not a default. |
| `RELEASE.md` | New **§ Media storage** — the operator runbook: what to set in Render, and what happens if you don't. |
| `REL1_RELEASE_PACKAGING.md` | Blocker 2 marked **CLOSED by OPS1** (amend-in-place, the convention REL2 established). |
| `REL2_DEPLOYMENT_CONFIGURATION_CONVERGENCE.md` | Blocker B marked **CLOSED by OPS1**. |

**Not changed: the client.** Not one line. `<img src={meal.imageUrl}>` renders a relative path and an absolute URL identically — which is *why* the API did not have to change to support object storage, and is the reason this was safe to do behind the existing interface.

---

## VALIDATION PERFORMED

Every claim below is backed by a command that actually ran.

| Command | Result |
|---|---|
| `npm run test:ops1-media-storage` | **PASS — 41 passed, 0 failed** |
| `npx tsc --noEmit` (OPS1 files) | **No errors in any OPS1 file** |
| `npm run typecheck:ci` | **PASS** — baseline 175 errors, current 175. No new type errors. |
| `npm run build` | **PASS** — `dist/index.cjs` 3.7 MB, exit 0 |
| `npm run verify:deployment-config` | **FAIL — 4 passed, 2 failed. PRE-EXISTING AND NOT OPS1'S.** See below. |

### What the 41 assertions actually prove

Not "the code runs". The S3 path is exercised against a **real `@aws-sdk/client-s3` client** — real SigV4 signing, real HTTP — talking to an in-process S3-compatible endpoint. The code path under test is the code path production runs.

- **Persistence.** The local file survives a module reload; the bucket object survives the client being **thrown away and rebuilt**, which is what a redeploy is. This is the assertion that maps directly to the defect.
- **Production cannot silently go ephemeral.** Unconfigured production → `unavailable`. Half-configured bucket → `unavailable`, **explicitly not a fallback to local disk**. Explicit `local` → allowed, because a human chose it.
- **Failure is safe in both directions.** A sustained bucket outage makes `save` throw and `delete` not throw. The outage is *sustained* on purpose: the AWS SDK retries a 5xx three times, so a one-shot failure would be absorbed by the retry and the test would pass for the wrong reason — it would be testing the retry.
- **Delete stays inside its own storage.** DALL·E URLs, legacy local URLs, and traversal attempts are all refused; the household's other photo is untouched.
- **Structural.** The test greps `server/` and fails if a *second* media writer or a second `@aws-sdk/client-s3` importer ever appears. A future "quick" upload endpoint cannot quietly become the platform's second storage system.

### The deployment-config gate failure is not OPS1's

`verify:deployment-config` fails on two checks, both against `.replit`:

```
✗ Deployment config committed   — .replit has uncommitted changes (`M .replit`)
✗ No silent localhost exposure  — .replit sets exposeLocalhost (port 5599)
```

**This is the REL2 gate working exactly as designed, on a file OPS1 never touched.** REL2 reverted `exposeLocalhost = true` and built this gate to catch its return; Replit workspace tooling has re-added it. It is a security decision REL2 already ruled on, it is unauthored work in the tree, and the Rollback Protection Protocol § 3 is explicit: *do not touch it, do not commit it.* OPS1 leaves `.replit` alone and reports it as a **remaining deployment blocker** (below). It has no bearing on media storage.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□✓ One canonical identity
   Entity: an uploaded meal photo. Key space: ONE filename convention,
   `meal-<userId>-<timestamp>-<random>.<ext>`, shared by both providers — so a
   local file and an object key are literally the same name in two places.

□✓ One owner per fact
   Fact: "where do media bytes live". Owner: server/lib/media-storage.ts, and
   only it. The test enforces this by grep: no second writer, no second SDK
   importer anywhere in server/. Fact: "the URL of a meal's photo" — owner is
   unchanged, meals.imageUrl in Postgres.

□✓ No duplicate entities
   No new entity. A photo is still a photo; only the shelf it sits on changed.

□✓ No duplicate ownership
   No attribute gains a second owner. Notably, the media-config status is logged
   by media-storage.ts itself and was NOT added to platform-status.ts's env
   audit — that would have created a second owner of "is media configured", which
   must always agree with the resolver. It reads better and drifts silently.
   Declined deliberately.

□✓ No duplicate state
   No user state split. The bytes have one home; the URL has one home.

□✓ Extends existing architecture
   Extends the EXISTING upload pipeline. Same multer memory-storage handler, same
   two exported functions, same signatures, same routes, same client. A provider
   was added BEHIND the interface — the shape the original module's own comment
   anticipated ("swap the saveMediaFile / deleteMediaFile implementations below
   for an object-storage backend, keeping the same exported interface").

□✓ Progressive enrichment where appropriate
   N/A — transactional media, not a knowledge entity. No enrichment added.

□✓ Knowledge domain compliance
   N/A — introduces no knowledge domain. Media bytes are transactional content,
   not knowledge; they carry no claim, no evidence chain, and no graduation
   pipeline.

□✓ Honest gaps over fabricated information
   THE CENTRAL PRINCIPLE OF THIS CHANGE. Unconfigured storage renders as an
   honest, visible refusal (503 + a boot-log error), never as a fabricated
   success. The defect being fixed WAS a fabricated success.

□✓ No permanent synchronisation bridge
   None. The two providers are alternatives, never mirrors — exactly one is
   active per process, and nothing keeps them in sync because nothing has to.

□✓ Evolution over replacement
   The local provider is NOT retired — it is still the development default and a
   legitimate production choice with a mounted volume. What is retired is the
   SILENT DEFAULT: local disk in production, inherited rather than chosen.
```

---

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

*Applies: OPS1 adds exactly one thing a person can see — the 503 message on a failed upload. No layout, colour, component, or visual pattern changed.*

```
✓ UX Governance Checklist completed for the one user-facing surface (the error
    message). Errors: says what happened, reassures about what was NOT lost
    ("Your recipe is safe"), and names the next action ("try adding the photo
    again shortly"). It does not blame the household, and it does not leak
    infrastructure — the operator gets the reason in the log; the household gets
    a sentence they can act on.
✓ Premium Standard (EXP2 § 17): the care is perceptible in its ABSENCE — a
    household who would have lost their photo silently instead keeps their recipe
    and is told the truth. That is craft, not decoration.
✓ UI Governance Checklist: no visual change. No new pattern, so nothing to
    retire.
✓ Nothing here owns a fact at the presentation layer. The message is a fixed
    string about system state, not knowledge, and it renders an honest absence.
✓ No predecessor visual pattern exists to retire.
```

---

## PRODUCT REGISTRY COMPLIANCE / IMPACT

```
PRODUCT REGISTRY IMPACT
=======================
Registry affected: NO.

The test is "would a person's answer to 'what is THA?' be different after this
change?" It would not. THA let households add a photo to a meal before OPS1 and
lets them add a photo to a meal after it. No page, route, journey, capability,
dialog, setting, integration or claim is created, changed or retired. What
changed is that the photo now SURVIVES — an infrastructure guarantee beneath an
existing capability, not a new thing THA is.

Entries created: NONE
Entries updated: NONE
Entries retired: NONE
Any entry set to `public` or `household`: N/A
Product knowledge written into a prompt, template, fallback string, fine-tune,
or capability code: NO (Rule PKR27).
```

> The registry itself (`docs/product/`) is uncommitted work-in-progress from a concurrent `PDA1` session. OPS1 does not write to it, and would owe it nothing even if it were committed.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Media (uploaded meal photos)
Declared SoT:    Bytes — server/lib/media-storage.ts (sole owner, both providers)
                 URL   — meals.imageUrl (Postgres) — UNCHANGED
New store created? YES — an S3-compatible bucket, for the bytes.
  Retirement plan for the replaced store: The ephemeral local disk is retired AS
  A PRODUCTION DEFAULT — it can no longer be reached in production by inheritance,
  only by explicit choice with a mounted volume. The local provider itself is
  deliberately retained (development, and a valid production answer). There is no
  period in which both are authoritative: exactly one provider is active per
  process, chosen at boot.
Existing store extended? YES — media-storage.ts, extended behind its own
  unchanged interface.
Consumer created? NO. server/routes.ts is the existing, unchanged consumer.
```

---

## DATA IMPACT

- **Reads existing data:** YES — existing `meals.imageUrl` values, which continue to resolve exactly as before.
- **Writes new data:** YES — new photos go to the bucket. New URLs are absolute rather than relative; both render identically in `<img src>`.
- **Changes meaning of existing data:** NO. A pre-OPS1 `/uploads/meal-photos/...` URL still means what it meant.
- **Requires backfill:** **NO — and this needs saying honestly.** Nothing needs migrating **because there is nothing left to migrate**: any photo uploaded to production before OPS1 was already destroyed by the next deploy. The bytes are gone and OPS1 cannot recover them. Rows may therefore still carry `/uploads/meal-photos/...` URLs pointing at bytes that no longer exist — **a pre-existing, pre-OPS1 condition that OPS1 neither creates nor repairs.** See *Next Steps*.

---

## TRUST CHECK

- **Could this mislead the user?** No — it removes a lie. The platform previously told a household their photo was saved when it was about to be destroyed.
- **Could this fabricate certainty?** No. An unconfigured or broken store produces a visible refusal, never a false success.
- **Is anything guessed but shown as real?** No. An unknown provider name resolves to `unavailable` rather than a guess.
- **What happens if the system is wrong?** Uploads decline with a 503; every other feature is unaffected; the operator sees `[Startup] Media storage UNAVAILABLE` in the log with the exact missing variables named. Media failure is contained to media.
- **No architectural duplication introduced:** YES (grep-enforced by the test).
- **No new source of truth created:** YES — `media-storage.ts` remains the sole owner.
- **Every "verified" claim backed by a command that ran:** YES — see *Validation Performed*, including the one gate that FAILS and why it is not OPS1's.

---

## DEFINITION OF DONE

**Success looks like:** a household uploads a photo; a deploy happens; the photo is still there. Configuration is a Render dashboard change, not a code change.

**What must not break:** existing meals with local or DALL·E image URLs; the `PATCH /api/meals/:id/image` replace-photo flow; development, which must keep working with zero configuration.

**Manual test steps (post-deploy):**
1. Confirm the boot log reads `[Startup] Media storage: S3-COMPATIBLE OBJECT STORAGE → bucket="…"`. If it says `UNAVAILABLE`, the env vars are not set — see `RELEASE.md` § Media storage.
2. Upload a meal photo. Confirm the returned URL is on `MEDIA_PUBLIC_BASE_URL` and the image renders.
3. **Trigger a redeploy. Reload the meal. The photo is still there.** This is the whole workstream in one step.
4. Replace the photo. Confirm the new one renders and the old object is gone from the bucket.
5. Open a meal whose photo predates OPS1. Confirm nothing 500s (the image may be broken — see *Data Impact*).

---

## ROLLBACK PLAN

- **Identifier:** `rollback/OPS1-production-media-storage-20260711` → `f86a094a0431929d90d6dab90bfe0ce05e196349`
- **Files modified:** listed under *Files Changed*.
- **Commands:** `git checkout rollback/OPS1-production-media-storage-20260711` — restores committed state. It does **not** remove the concurrent unauthored working-tree files, which were never OPS1's.
- **Verification after rollback:** `npm run build` and `npm test`. Note that rolling back **restores the data-loss defect** — production would return to writing photos to an ephemeral disk and reporting success. Rolling back OPS1 is only safe on a release that does not let households upload photos.
- **Cheaper alternative to a code rollback:** OPS1 is configuration-driven. If the bucket misbehaves, set `MEDIA_STORAGE_PROVIDER=local` with a mounted volume, or unset the variables to decline uploads honestly — no deploy of code required.

---

## SCOPE LOCK

**Implemented scope:** one canonical persistent media store (S3-compatible object storage, approved 2026-07-11) behind the existing upload pipeline and unchanged exported interface; safe failure in both directions; boot-time visibility; documentation of every new variable; the operator runbook; 41 tests.

**Explicitly excluded scope — named, not silently omitted:**
- **No deployment.** Nothing was pushed or released. OPS1 deploys nothing.
- **No bucket was provisioned.** Creating the R2 bucket and setting the Render variables is a human step with dashboard access.
- **No backfill of pre-OPS1 photos.** They no longer exist to migrate (*Data Impact*).
- **No image resizing, thumbnailing, CDN, signed URLs, or lifecycle rules.** The bucket is public-read, as the old `/uploads/` path was.
- **`.replit` was not touched**, though it fails the deployment gate. Not OPS1's, and not OPS1's to fix.
- **No change to `platform-status.ts`'s env audit** — deliberate; it would have created a second owner of "is media configured".

**SUGGESTION (out of scope — do not implement without approval):**
1. **A sweep for dead image URLs.** Rows may point at bytes destroyed by past deploys. A read-only script could count them; a household would rather see "no photo" than a broken image. Needs approval — it writes to `meals`.
2. **`uploads/` holds 30+ tracked development screenshots** unrelated to meal photos. Harmless, but they are not release artefacts.
3. **Signed URLs / a private bucket**, if meal photos should ever not be world-readable. Today they are public by URL, which is exactly what `/uploads/` was — this changes nothing, but it is now a deliberate choice worth naming.

---

## OUTCOME

**A household's photo now survives the next release.** That is the whole of it, and it was not true before: production wrote meal photos to a disk Render destroys on every deploy, reported success, and left a durable database URL pointing at bytes that no longer existed — a data-loss defect that produced no error anywhere.

THA now has **one canonical persistent media store**: S3-compatible object storage (Cloudflare R2, approved), behind the same two functions, the same routes, the same upload pipeline, and a completely unchanged client. Local disk remains the development default and a legitimate production choice with a mounted volume — but it is now *chosen*, never *inherited*, and that distinction is the fix. A production deployment that has not been told where media lives no longer guesses: it declines the upload, tells the household the truth, tells the operator exactly which variables are missing, and writes nothing. A half-configured bucket declines too, because bytes written where they cannot be read back are worse than bytes not written.

`REL1` Blocker 2 / `REL2` Blocker B — **CLOSED in code.** It closes in production the moment the Render variables are set.

---

## NEXT STEPS

1. **Provision the bucket and set the Render variables** — Colin. Cloudflare R2, then the seven `MEDIA_*` variables in `RELEASE.md` § Media storage. **Until this is done, production declines photo uploads with a 503.** That is the intended, safe state — not a regression — but it is a *visible* state, and it is the last step of this workstream.
2. **`.replit` has drifted again** — `exposeLocalhost = true` is back, re-added by workspace tooling, and `verify:deployment-config` fails on it. This is REL2's gate doing its job. It needs a human decision (revert again, or amend the check with a reason in `RELEASE.md`). **It is a remaining deployment blocker and it is not OPS1's.**
3. **Blocker A (REL2) remains open** — Render's service configuration still lives only in the dashboard.
4. **Nothing is pushed.** The branch `int1-intelligence-platform` is unpushed and awaits no deployment approval from OPS1, because **OPS1 deploys nothing.**
