# BENCH2 — Benchmark Artifact Download Behaviour

**Status:** ✅ Complete — benchmark report artefact now has an explicit, correctly-named Download action alongside the existing view/open behaviour
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Scope:** UX + response-header improvement. No scoring change, no execution change, no artefact-content change.
**Related:** [`BENCH1B_BENCHMARK_RUNTIME_VERIFICATION.md`](./BENCH1B_BENCHMARK_RUNTIME_VERIFICATION.md) (made the `/report` endpoint reachable), [`BENCH1_BENCHMARK_HOUSEHOLDS_JSON_REGRESSION.md`](./BENCH1_BENCHMARK_HOUSEHOLDS_JSON_REGRESSION.md)

---

## 1. Executive summary

The benchmark run report (`GET /api/intelligence/benchmark/runs/:id/report`, a Markdown artefact) **opened in a new browser tab instead of downloading**, even though every button that pointed at it was labelled/iconed as "Download".

**Why:** the endpoint sent the Markdown with **no `Content-Disposition` header**, and the frontend links used `<a target="_blank">`. Browsers render `text/markdown` inline, so the artefact was displayed, never saved — and if saved manually it would land with a URL-derived name, not a meaningful filename.

**Intended behaviour** (inferred from the UI, which already had a separate in-app **View** button per history row and a `Download`-iconed control): viewing the raw report is useful, but the download controls should actually download, with a correct filename.

**Fix (smallest improvement):**
- **Backend:** the report endpoint now always sets `Content-Disposition` with a correct, safe filename — `inline` by default (view unchanged), `attachment` when the request carries `?download`. Same artefact bytes either way.
- **Frontend:** the download controls now hit `…/report?download=1` with the HTML `download` attribute (real save); the open-in-tab **view** behaviour is kept as an explicit, clearly-labelled action.

---

## 2. Intended artefact behaviour

| Control | Location | Intended | Was |
|---|---|---|---|
| **View** (in-app dashboard) | history row | Select the run, render dashboard in-page | ✅ worked (`onSelect`) |
| **View raw** (open Markdown) | shown-run header | Open the raw report to read without saving | Implicit only — the "Download" link did this |
| **Download** | history row + shown-run header | Save the `.md` artefact with a meaningful filename | ❌ opened a tab, no filename |

Both *view* and *download* are useful, so both are kept — but they are now distinct, honestly-labelled actions.

---

## 3. What changed

### Backend — `server/routes.ts` (`GET …/runs/:id/report`)

```ts
const runId = String(req.params.id);
const report = loadReport(runId);
if (report === null) return res.status(404).json({ message: "Run report not found" });
const safeId = runId.replace(/[^A-Za-z0-9._-]/g, "_");
const filename = `benchmark-report-${safeId}.md`;
const disposition = req.query.download !== undefined ? "attachment" : "inline";
res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
res.type("text/markdown").send(report);
```

- **Correct filename:** `benchmark-report-<runId>.md` (e.g. `benchmark-report-2026-07-07T19-23-12Z__45443a8.md`). `safeId` strips anything outside `[A-Za-z0-9._-]` so the header can never be malformed or injected — the run-id format is already dash-delimited, so in practice it is unchanged.
- **Headers support download where appropriate:** `attachment` only when `?download` is present; otherwise `inline` so the raw-view path is untouched.
- **404 and content unchanged:** same `loadReport`, same bytes, same `text/markdown` type.

### Frontend — `client/src/pages/admin-intelligence-page.tsx`

- Added `ExternalLink` to the lucide import.
- **History row** (already has an in-app **View** button beside it): the download-icon link now points at `…/report?download=1` with `download={`benchmark-report-${h.runId}.md`}` and drops `target="_blank"` → it downloads instead of opening a tab.
- **Shown-run header:** split the single mislabelled control into two honest actions —
  - **View raw** — `<a target="_blank">` opening the inline report (the previously-implicit behaviour, now explicit, ghost + `ExternalLink` icon).
  - **Download report** — `…/report?download=1` + `download` attribute (real save, outline + `Download` icon).

The `download` attribute (same-origin) supplies the filename client-side; the server `attachment` header supplies it even when the link is opened directly — belt and suspenders.

---

## 4. Verification

Against the running dev server (`localhost:5000`) with an authenticated admin session (a known password was temporarily set on the `test1@test.com` **test** admin, then its original hash restored — verified):

| Check | Result |
|---|---|
| `GET …/report` (default, view) | `200` · `Content-Type: text/markdown` · **`Content-Disposition: inline; filename="benchmark-report-<runId>.md"`** |
| `GET …/report?download=1` | `200` · `Content-Type: text/markdown` · **`Content-Disposition: attachment; filename="benchmark-report-<runId>.md"`** · 32 050 bytes · body starts `# THA Companion Benchmark — Run Report` |
| `GET …/report` for a missing run | `404` (unchanged) |
| Artefact bytes | Identical inline vs download — no content change |
| `tsc --noEmit` | No new errors in `routes.ts` or `admin-intelligence-page.tsx` |

The backend change required a server restart (`tsx` has no watcher — see BENCH1B §5); the dev server was restarted and the headers verified live.

---

## 5. Constraints honoured

- **No benchmark scoring change.** Untouched.
- **No benchmark execution change.** The run/engine paths are untouched; this only affects how the already-saved report artefact is served.
- **No artefact content change.** Same `loadReport` output, byte-for-byte, for both view and download.
- **Smallest improvement.** View/open kept; one query param + one header on the backend; download-attribute wiring on the frontend. Nothing else touched.
</content>
