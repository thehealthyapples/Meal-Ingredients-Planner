# Engineering Investigations

Analysis of **engineering practice** — how we build, not what we build.

Examples of what belongs here: an investigation into why sessions are lost on
disconnect; an audit of rollback discipline across recent workstreams; a study of
whether the verification scripts catch what they claim to catch.

An investigation into the **product** — a capability, a bug, an architecture
question — belongs in `docs/investigations/` instead. The test: would this
document still be worth reading if the product were replaced entirely? If yes, it
is engineering practice and lives here.

Start from [`../../templates/INVESTIGATION_TEMPLATE.md`](../../templates/INVESTIGATION_TEMPLATE.md)
and follow [`../../checklists/INVESTIGATION.md`](../../checklists/INVESTIGATION.md).

An investigation analyses and recommends. It changes nothing. If it changed code,
it was an implementation, and its report belongs in
[`../implementation/`](../implementation/).
