// BUS1 — the Cookie Policy.
//
// PERMANENT POLICY CONTENT. Holds no company-specific fact — see
// ../company-profile.ts.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE MOST IMPORTANT DECISION IN THIS FILE, RECORDED SO IT IS NOT UNDONE BY
// SOMEONE ASSUMING IT WAS AN OVERSIGHT:
//
// THA SETS EXACTLY ONE COOKIE, AND THERE IS NO COOKIE CONSENT BANNER.
//
// This was verified, not assumed:
//   • server/auth.ts sessionCookieOptions() — one `connect.sid` session cookie,
//     httpOnly, sameSite lax, secure in production.
//   • server/auth.ts setupAuth() — `saveUninitialized: false`, which means no
//     cookie is set at all until you actually sign in.
//   • No analytics, tag manager, advertising pixel or third-party script exists
//     anywhere in client/. There is nothing to consent to.
//
// Under PECR reg. 6(4), a cookie strictly necessary to provide a service the
// user has requested requires no consent. A banner asking permission for a
// cookie that needs none — with categories for analytics and marketing that do
// not exist — would be consent theatre: it would train households to dismiss a
// dialog without reading it, and it would state, in the product's own voice,
// that THA does things it does not do. That is the fabrication
// ARCHITECTURE_PRINCIPLES.md Principle 6 forbids, and the "hidden opt-outs" and
// "manufactured urgency" the UX Governance Checklist's dark-patterns item
// forbids.
//
// So THA tells households the truth once, quietly, and gets out of the way.
// The consent LEDGER (shared/privacy + the user_consents table) exists and is
// general: on the day a non-essential cookie is genuinely introduced, that is
// the change which must add the banner, the categories, and the granular
// consent — and it will have somewhere to record them.
// ─────────────────────────────────────────────────────────────────────────────

import type { LegalDocument } from "../types";

export const COOKIE_POLICY: LegalDocument = {
  slug: "cookie-policy",
  title: "Cookie Policy",
  summary: "We use one cookie. It keeps you signed in. That is the whole policy.",
  version: "1.0.0",
  effectiveDate: "2026-07-18",
  sections: [
    {
      id: "short-version",
      heading: "The short version",
      blocks: [
        {
          kind: "paragraph",
          text: "The Healthy Apples uses one cookie, and only after you sign in. It is what keeps you signed in as you move around the product. We do not use cookies for analytics, advertising, or tracking — because we do not do analytics, advertising, or tracking.",
        },
        {
          kind: "paragraph",
          text: "That is why you have not been shown a banner asking you to accept cookies. There is nothing here to accept. We would rather tell you that plainly than ask you a question with only one honest answer.",
        },
      ],
    },
    {
      id: "the-cookie",
      heading: "The cookie we set",
      blocks: [
        {
          kind: "table",
          headers: ["Name", "What it does", "How long it lasts", "Can you refuse it?"],
          rows: [
            [
              "connect.sid",
              "Identifies your signed-in session, so the product knows it is still you on the next page.",
              "It expires when your session does, and is removed when you sign out.",
              "Not while signed in — without it we cannot keep you signed in. You can refuse it by not signing in, or by blocking cookies in your browser, in which case you can still read this page but cannot use your account.",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "This cookie is strictly necessary to provide a service you have asked for — being signed in — which is why the law does not require us to ask your permission for it (Privacy and Electronic Communications Regulations, regulation 6(4)).",
        },
      ],
    },
    {
      id: "how-it-is-protected",
      heading: "How that cookie is protected",
      blocks: [
        {
          kind: "list",
          items: [
            "It cannot be read by scripts running in the page, so a script injected into the page cannot steal your session.",
            "It is not sent when another website makes a request to us, so another site cannot act as you.",
            "In production it is only ever sent over an encrypted connection. If a request somehow arrives unencrypted, no cookie is issued at all.",
            "It contains no personal data — only a random identifier pointing at a session stored on our own server.",
          ],
        },
      ],
    },
    {
      id: "what-we-do-not-use",
      heading: "What we do not use",
      blocks: [
        {
          kind: "paragraph",
          text: "So that this is unambiguous, here is what is not present in The Healthy Apples:",
        },
        {
          kind: "list",
          items: [
            "No analytics of any kind — no Google Analytics, no Plausible, no PostHog, no Mixpanel.",
            "No advertising or marketing cookies, and no advertising pixels.",
            "No social media tracking buttons.",
            "No third-party tag manager.",
            "No cross-site tracking, and no data sold or shared with data brokers.",
            "No cookie set before you sign in.",
          ],
        },
      ],
    },
    {
      id: "local-storage",
      heading: "Things stored on your device that are not cookies",
      blocks: [
        {
          kind: "paragraph",
          text: "Your browser also lets us remember small preferences on your own device — for example that you have already read a notice, or how you like a view arranged. This stays on your device, is never sent to us, and clearing your browser data removes it.",
        },
      ],
    },
    {
      id: "managing",
      heading: "Managing cookies yourself",
      blocks: [
        {
          kind: "paragraph",
          text: "Every browser lets you see, block and delete cookies in its settings. Blocking ours will sign you out and prevent you signing back in, but nothing else in this product depends on cookies.",
        },
      ],
    },
    {
      id: "changes",
      heading: "If this ever changes",
      blocks: [
        {
          kind: "paragraph",
          text: "If we ever introduce a cookie that is not strictly necessary, we will ask your permission first, in a way that makes refusing as easy as accepting, and this page will be updated with the version and date shown at the top.",
        },
        {
          kind: "paragraph",
          text: "Questions about this policy go to {{company.dataProtectionContact}}.",
        },
      ],
    },
  ],
};
