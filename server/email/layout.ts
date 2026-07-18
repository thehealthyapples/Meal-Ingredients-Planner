// BUS1 — the one email layout.
//
// Governing architecture: docs/architecture/THA_UI_ARCHITECTURE.md
// (§ 18 — "one visual language ... nothing introduces a second identity";
// Principle 5 — one canonical owner per visual concern, retire on introduction).
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS.
//
// Before BUS1, THA sent two emails and each carried its own complete inline
// HTML: its own wrapper div, its own heading, its own hand-written hex colour,
// its own button styling, its own footer rule. Two copies of one visual
// identity, kept in agreement by nobody. A third email could only have been a
// third copy — which is how a product ends up with three different greens in
// its inbox and no one able to say which is right.
//
// So there is one layout, one button, one set of values, and every email is
// content poured into it. The two pre-existing inline templates were MIGRATED
// onto it in the same change and their inline HTML deleted — not left dormant
// beside it (UI Principle 5).
//
// WHY THE VALUES ARE LITERALS HERE, WHEN THE PLATFORM FORBIDS RAW VALUES IN
// SURFACES: email is the one place THA's design tokens cannot reach. There is no
// CSS custom property support worth relying on across mail clients, no
// stylesheet, and no cascade — every value must be an inline literal in the
// HTML. This file is therefore the boundary at which tokens become literals, and
// it is the ONLY place in the platform permitted to hold them. A literal colour
// anywhere else in an email is a defect.
// ─────────────────────────────────────────────────────────────────────────────

/** The email palette. The single place THA's brand values become literals. */
const EMAIL = {
  green: "#16a34a",
  ink: "#374151",
  inkSoft: "#6b7280",
  inkFaint: "#9ca3af",
  rule: "#e5e7eb",
  font:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export interface EmailContent {
  /** The one thing this email is for. Appears as the heading. */
  heading: string;
  /** Body paragraphs, in order. Plain text; no markup. */
  paragraphs: string[];
  /** The single call to action, if the email has one. */
  action?: { label: string; url: string };
  /** The quiet closing note — expiry, "you can ignore this", and so on. */
  footnote?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Render an email to HTML.
 *
 * Every string passed in is escaped. These emails carry user-influenced values
 * (a support request kind, an address), and an unescaped one would make the
 * inbox an injection surface.
 */
export function renderEmail(content: EmailContent): string {
  const action = content.action
    ? `
          <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(content.action.url)}" style="background-color: ${EMAIL.green}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              ${escapeHtml(content.action.label)}
            </a>
          </div>
          <p style="color: ${EMAIL.inkSoft}; font-size: 14px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: ${EMAIL.inkSoft}; font-size: 13px; word-break: break-all;">
            ${escapeHtml(content.action.url)}
          </p>`
    : "";

  const footnote = content.footnote
    ? `
          <hr style="border: none; border-top: 1px solid ${EMAIL.rule}; margin: 32px 0;" />
          <p style="color: ${EMAIL.inkFaint}; font-size: 12px; line-height: 1.5;">
            ${escapeHtml(content.footnote)}
          </p>`
    : "";

  const paragraphs = content.paragraphs
    .map(
      (p) =>
        `<p style="color: ${EMAIL.ink}; font-size: 16px; line-height: 1.6;">${escapeHtml(p)}</p>`,
    )
    .join("\n          ");

  return `
        <div style="font-family: ${EMAIL.font}; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: ${EMAIL.green}; font-size: 24px; margin-bottom: 8px;">The Healthy Apples</h1>
          <p style="color: ${EMAIL.ink}; font-size: 18px; font-weight: 600; margin: 16px 0 8px;">${escapeHtml(content.heading)}</p>
          ${paragraphs}${action}${footnote}
        </div>
      `;
}

/**
 * A plain-text alternative, generated from the same content.
 *
 * Sent alongside every HTML email. A message with no text part is more likely to
 * be filtered as spam, and is unreadable to anyone using a text-only client or a
 * screen reader that prefers plain text. Generating it from the same object is
 * what stops the two versions saying different things.
 */
export function renderEmailText(content: EmailContent): string {
  const parts = ["The Healthy Apples", "", content.heading, "", ...content.paragraphs];
  if (content.action) parts.push("", `${content.action.label}: ${content.action.url}`);
  if (content.footnote) parts.push("", content.footnote);
  return parts.join("\n");
}
