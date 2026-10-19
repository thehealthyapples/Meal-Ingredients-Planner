# Risk and Approval

## Risk classes

- **Green** — documentation, copy, visual polish, or other non-functional UI with no behavioural change.
- **Amber** — business behaviour, application logic, user workflows, or capability behaviour.
- **Red** — schema, canonical ownership, persistence, AI reasoning, architecture, security, or production data.

Effort follows risk by default. State separately when the effort is unusually high or low for the classification.

## Approval gate

Every implementation requires explicit approval before work begins. A direct user instruction is approval for that stated scope; do not ask again for the same approval.

- **Green:** state what is changing and the risk class.
- **Amber:** state what the change controls, options and trade-offs, and the risk class.
- **Red:** include options and trade-offs, release timing, rollback, verification, data impact, and deployment checklist.

Never batch unrelated decisions. Amber and Red decisions are not batched.

## Scope lock

Implement only the approved scope. Put related but unapproved ideas under `SUGGESTIONS` and do not implement them silently.
