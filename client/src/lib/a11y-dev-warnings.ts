// PX1-W4.1 (fnd-px-forms-unlabelled).
//
// PX1 found 276 of 326 form controls with neither an `id` (for a `<label
// htmlFor>`) nor an `aria-label`: a screen-reader user could not reliably
// complete onboarding, create a meal, or edit their profile. Labelling the
// existing controls fixes today's forms; THIS makes the defect loud for
// tomorrow's — the canonical `Input`/`Textarea` warn in development the moment
// a control is rendered with no accessible name (UIA §13: "announced
// identically to assistive technology"). Production builds strip it.

const warned = new Set<string>();

interface Labelable {
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Controls hidden from assistive tech are exempt. */
  "aria-hidden"?: boolean | "true" | "false";
  type?: string;
  placeholder?: string;
  "data-testid"?: string;
}

/**
 * PROD4 — the same enforcement, for the other half of the defect.
 *
 * `warnIfUnlabelled` covers FORM controls, which are unlabelled when they carry
 * no `id` or `aria-label`. A BUTTON is different: it normally takes its
 * accessible name from its own text, so warning on every unnamed button would
 * be noise. The exception is `size="icon"` — a button whose entire content is a
 * glyph, which by construction has no text to be named by.
 *
 * PROD4 found 15 of these across the client, including a destructive delete
 * (`templates-panel.tsx`) and the copy button on the share surface. Several sat
 * inside Radix `Tooltip`s, which is the trap: a tooltip supplies
 * `aria-describedby` — a DESCRIPTION — and never a NAME, so the control still
 * announced as "button" while looking, to a sighted reviewer, perfectly labelled.
 *
 * This adds no new owner: it extends the module the Adoption Register already
 * records as the owner of accessible-name enforcement.
 */
export function warnIfUnnamedIconButton(props: Labelable & { title?: string }): void {
  if (!import.meta.env.DEV) return;
  if (props["aria-label"] || props["aria-labelledby"] || props.title) return;
  if (props["aria-hidden"] === true || props["aria-hidden"] === "true") return;

  const key = `IconButton:${props["data-testid"] ?? "?"}`;
  if (warned.has(key)) return;
  warned.add(key);

  console.warn(
    `[a11y] <Button size="icon"> rendered with no accessible name ` +
      `(testid: ${props["data-testid"] ?? "—"}). An icon-only button has no text to be ` +
      `named by, so it announces as just "button". Give it an aria-label. ` +
      `A tooltip is NOT a name — it supplies aria-describedby (PROD4, UIA §13).`,
  );
}

export function warnIfUnlabelled(component: string, props: Labelable): void {
  if (!import.meta.env.DEV) return;
  if (props.id || props["aria-label"] || props["aria-labelledby"]) return;
  if (props["aria-hidden"] === true || props["aria-hidden"] === "true") return;
  if (props.type === "hidden") return;

  const key = `${component}:${props["data-testid"] ?? props.placeholder ?? "?"}`;
  if (warned.has(key)) return;
  warned.add(key);

  console.warn(
    `[a11y] <${component}> rendered with no accessible name ` +
      `(testid: ${props["data-testid"] ?? "—"}, placeholder: ${props.placeholder ?? "—"}). ` +
      `Give it an id wired to a <label htmlFor>, or an aria-label. ` +
      `A placeholder is not a label (PX1 fnd-px-forms-unlabelled, UIA §13).`,
  );
}
