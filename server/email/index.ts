// BUS1 — transactional email.
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
//
// ─── WHAT CHANGED, AND WHAT DELIBERATELY DID NOT ─────────────────────────────
// This module REPLACES server/email.ts, which is deleted in the same change
// (ARCHITECTURE_PRINCIPLES.md Principle 8 — retire on introduction; no dormant
// predecessor). Every existing import of `../email` and `./email` resolves here
// unchanged, and the two functions that already existed keep their exact
// signatures and behaviour:
//
//   sendVerificationEmail(to, token)   → unchanged contract, same URL, same expiry
//   sendPasswordResetEmail(to, token)  → unchanged contract, same URL, same expiry
//
// What changed is that their hand-written HTML now comes from the one layout
// (./layout.ts) instead of two divergent inline copies, and every message now
// carries a plain-text alternative it did not have before.
//
// The SMTP transport is byte-for-byte the behaviour of the module it replaces:
// same environment variables, same defaults, same "disabled with a warning when
// unconfigured" posture. Sending mail was not the problem being solved, and a
// refactor that quietly changed how mail is delivered would have been a much
// bigger change than the one that was asked for.
// ─────────────────────────────────────────────────────────────────────────────

import nodemailer from "nodemailer";
import { COMPANY_PROFILE } from "@shared/legal";
import {
  SUPPORT_REQUEST_KIND_DEFINITIONS,
  type SupportRequestKind,
} from "@shared/support/support-request";
import { renderEmail, renderEmailText, type EmailContent } from "./layout";

const APP_BASE_URL = process.env.APP_BASE_URL || "https://www.thehealthyapples.com";
const EMAIL_FROM = process.env.EMAIL_FROM || "hello@thehealthyapples.com";
const SMTP_HOST = process.env.SMTP_HOST || "mail.privateemail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (SMTP_USER && SMTP_PASS) {
  const useSSL = SMTP_PORT === 465;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: useSSL,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  console.log(`[Email] SMTP configured via ${SMTP_HOST}:${SMTP_PORT} (secure=${useSSL}) as ${SMTP_USER}`);
} else {
  console.warn("[Email] SMTP_USER or SMTP_PASS not set — email sending is disabled");
}

/**
 * The one send path. Every template goes through it, so the transport check,
 * the from-address, the text alternative and the logging exist once.
 */
async function send(params: {
  to: string;
  subject: string;
  content: EmailContent;
  /** For the log line — never the recipient's address. */
  kind: string;
}): Promise<{ success: boolean }> {
  if (!transporter) {
    console.warn(`[Email] Cannot send ${params.kind} — SMTP not configured`);
    return { success: false };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${COMPANY_PROFILE.tradingName}" <${EMAIL_FROM}>`,
      to: params.to,
      subject: params.subject,
      html: renderEmail(params.content),
      text: renderEmailText(params.content),
    });

    if (info.rejected && info.rejected.length > 0) {
      console.warn(`[Email] ${params.kind} rejected: ${JSON.stringify(info.rejected)}`);
    }

    const accepted = Boolean(info.accepted && info.accepted.length > 0);
    console.log(`[Email] ${params.kind} — messageId ${info.messageId}, accepted=${accepted}`);
    return { success: accepted };
  } catch (err: unknown) {
    console.error(`[Email] Failed to send ${params.kind}:`, err);
    return { success: false };
  }
}

// ── Templates ───────────────────────────────────────────────────────────────

/** Unchanged contract. Called by server/auth.ts on registration and resend. */
export async function sendVerificationEmail(to: string, token: string): Promise<{ success: boolean }> {
  const verifyUrl = `${APP_BASE_URL}/api/verify-email?token=${token}`;
  return send({
    to,
    kind: "verification email",
    subject: "Verify your email — The Healthy Apples",
    content: {
      heading: "Please confirm your email address",
      paragraphs: [
        "Thanks for creating an account. Confirming your address is the last step, and then your kitchen is ready.",
      ],
      action: { label: "Verify Email Address", url: verifyUrl },
      footnote:
        "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
    },
  });
}

/** Unchanged contract. Called by server/auth.ts on forgot-password. */
export async function sendPasswordResetEmail(to: string, token: string): Promise<{ success: boolean }> {
  const resetUrl = `${APP_BASE_URL}/auth?reset_token=${token}`;
  return send({
    to,
    kind: "password reset email",
    subject: "Reset your password — The Healthy Apples",
    content: {
      heading: "Reset your password",
      paragraphs: [
        "We received a request to reset the password for your account. Choose a new one using the button below.",
      ],
      action: { label: "Reset Password", url: resetUrl },
      footnote:
        "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.",
    },
  });
}

/**
 * NEW in BUS1. Sent once, after email verification succeeds — not at
 * registration, because an unverified address may not belong to the person who
 * typed it, and a welcome is a poor thing to send to a stranger.
 *
 * It contains no marketing and asks for nothing. It orients a household and
 * points at the two things a new person most often wants.
 */
export async function sendWelcomeEmail(to: string): Promise<{ success: boolean }> {
  return send({
    to,
    kind: "welcome email",
    subject: "Welcome to The Healthy Apples",
    content: {
      heading: "Your kitchen is ready",
      paragraphs: [
        "Your email is confirmed and your account is set up. There is nothing else you need to do.",
        "A good first step is to tell us who you cook for — the people in your household and anything they cannot eat. Everything else in The Healthy Apples works better once it knows that.",
        "If you get stuck, the Help Centre is in your profile, and a real person reads the contact form.",
      ],
      action: { label: "Open The Healthy Apples", url: `${APP_BASE_URL}/home` },
      footnote: `You are receiving this because you created an account at ${APP_BASE_URL}. We only send emails about your account — never marketing.`,
    },
  });
}

/**
 * NEW in BUS1. Confirms a support request landed, so nobody is left wondering
 * whether the form worked. The wording per kind is owned by
 * shared/support/support-request.ts and is not restated here.
 */
export async function sendSupportRequestReceivedEmail(
  to: string,
  kind: SupportRequestKind,
): Promise<{ success: boolean }> {
  const definition = SUPPORT_REQUEST_KIND_DEFINITIONS[kind];
  return send({
    to,
    kind: `support acknowledgement (${kind})`,
    subject: "We have your message — The Healthy Apples",
    content: {
      heading: "Thank you — we have your message",
      paragraphs: [
        definition.acknowledgement,
        definition.hasStatutoryDeadline
          ? "Because this is a request about your personal data, we will respond within one month, as the law requires."
          : "We read every message a household sends us.",
      ],
      footnote: `You are receiving this because you contacted us through The Healthy Apples. Replies go to ${COMPANY_PROFILE.supportEmail}.`,
    },
  });
}

/**
 * NEW in BUS1. Sent as the LAST act of an account erasure.
 *
 * There is a real tension here and it is worth naming: sending an email to a
 * person whose data has just been erased means using their address moments after
 * deleting it. It is sent anyway, from the address held in memory and never
 * re-stored, because the alternative — an account that vanishes in silence — is
 * worse. A person is entitled to confirmation that the thing they asked for
 * actually happened, and Art. 12(3) requires THA to inform them of the action
 * taken on their request.
 */
export async function sendAccountDeletedEmail(to: string): Promise<{ success: boolean }> {
  return send({
    to,
    kind: "account deletion confirmation",
    subject: "Your account has been deleted — The Healthy Apples",
    content: {
      heading: "Your account has been deleted",
      paragraphs: [
        "This is confirmation that your account and your household data have been erased from The Healthy Apples, as you asked.",
        "This cannot be undone, and we have kept no copy. Two records remain, neither of which identifies you: that consent was given, and that an account was deleted on this date. Both are required by law.",
        "This is the last email we will send you. Thank you for having tried us.",
      ],
      footnote: `If you did not ask for this, contact ${COMPANY_PROFILE.dataProtectionContact} immediately.`,
    },
  });
}

/**
 * NEW in COMM1A. The invitation one household sends to another.
 *
 * THIS EMAIL IS THE ONLY PLACE THE TOKEN IS EVER DELIVERED. It is not returned
 * by the route that creates the invitation, not shown to the sender, and not
 * logged — because the link is what authorises acceptance, and the sender is
 * not the party it authorises.
 *
 * THE SENDING HOUSEHOLD IS NOT NAMED, and that is deliberate rather than an
 * omission. THA does not know that the recipient knows the sender, and putting
 * one household's name in an unsolicited email to a stranger discloses a
 * household to someone who has no relationship with THA at all. The person who
 * sent it will have said so themselves; the product does not need to.
 *
 * No discount, percentage, saving or commercial term appears here. Commercial
 * Rule C3 forbids a price claim without configured pricing, and pricing is
 * unconfigured platform-wide — so an invitation that promised money off would
 * be exactly the withdrawn `TrialBanner.tsx` copy, in a new envelope.
 */
export async function sendHouseholdInvitationEmail(
  to: string,
  token: string,
  options: { communityName?: string | null } = {},
): Promise<{ success: boolean }> {
  const acceptUrl = `${APP_BASE_URL}/invitation?token=${encodeURIComponent(token)}`;
  const toCommunity = !!options.communityName;

  return send({
    to,
    kind: "household invitation",
    subject: toCommunity
      ? `You've been invited to ${options.communityName} — The Healthy Apples`
      : "Someone has invited you to The Healthy Apples",
    content: {
      heading: toCommunity
        ? `You've been invited to ${options.communityName}`
        : "You've been invited to The Healthy Apples",
      paragraphs: [
        toCommunity
          ? "A household already using The Healthy Apples has invited yours to their neighbourhood. Neighbourhoods are quiet: yours would share nothing about your plans, your food, or who eats with you — only that you are part of it."
          : "A household already using The Healthy Apples thought you might like it too. It helps families plan what to eat, shop for it, and eat a little better without much effort.",
        "You'll be asked to create an account first. Nothing is shared, and nothing is joined, until you say so.",
      ],
      action: { label: toCommunity ? "See the invitation" : "Accept the invitation", url: acceptUrl },
      footnote:
        `This invitation was sent to ${to} and only works for that address. It expires in 14 days, and whoever sent it can withdraw it at any time. If you weren't expecting it, you can ignore this email — nobody is told either way.`,
    },
  });
}
