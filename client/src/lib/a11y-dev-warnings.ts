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
