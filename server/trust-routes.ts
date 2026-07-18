// BUS1 — Trust & Compliance HTTP surface.
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
//
// Registered by server/routes.ts via `registerTrustRoutes(app)`, following the
// same pattern as `setupAuth(app)` in server/auth.ts: a bounded domain owns its
// own endpoints in its own module rather than appending three hundred lines to
// the 13,000-line route monolith.
//
// Every handler follows the established route recipe from server/routes.ts —
// inline `req.isAuthenticated()`, zod validation, `{ message }` error bodies,
// `catch` → 500 — so nothing here is a second convention.

import type { Express } from "express";
import { z } from "zod";
import { assertAdmin } from "./lib/access";
import { comparePasswords } from "./auth";
import { storage } from "./storage";
import {
  COMPANY_PROFILE,
  SUB_PROCESSORS,
  isLegalDocumentSlug,
  legalDocumentSummaries,
  renderLegalDocument,
} from "@shared/legal";
import {
  CONSENT_DEFINITIONS,
  isConsentType,
  type ConsentType,
} from "@shared/privacy/consent";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  searchHelpArticles,
} from "@shared/support/help-centre";
import {
  SUPPORT_REQUEST_KIND_DEFINITIONS,
  SUPPORT_REQUEST_LIMITS,
  isSupportRequestKind,
  isSupportRequestStatus,
  type SupportRequestKind,
  type SupportRequestStatus,
} from "@shared/support/support-request";
import { consentContextFrom, consentHistory, currentConsents, recordConsent } from "./privacy/consent-service";
import { buildDataExport, exportFilename } from "./privacy/data-export-service";
import { eraseAccount } from "./privacy/account-erasure-service";
import { PERSONAL_DATA_REGISTRY } from "./privacy/personal-data-registry";
import { sendAccountDeletedEmail } from "./email";
import {
  createSupportRequest,
  listRequestsForOperator,
  listRequestsForUser,
  openRequestCounts,
  updateRequestStatus,
} from "./support/support-service";

export function registerTrustRoutes(app: Express): void {
  // ═══ LEGAL ══════════════════════════════════════════════════════════════
  // Public and unauthenticated, deliberately. A person must be able to read
  // what they are agreeing to BEFORE they have an account, and a privacy policy
  // behind a login is not published.

  app.get("/api/legal", (_req, res) => {
    res.json({
      documents: legalDocumentSummaries(),
      // The placeholder state travels with the content so no surface has to
      // decide for itself whether to warn. See shared/legal/company-profile.ts.
      companyPlaceholder: {
        active: COMPANY_PROFILE.placeholder,
        fields: COMPANY_PROFILE.placeholderFields,
      },
    });
  });

  app.get("/api/legal/:slug", (req, res) => {
    const { slug } = req.params;
    if (!isLegalDocumentSlug(slug)) {
      return res.status(404).json({ message: "Unknown legal document." });
    }
    res.json({
      document: renderLegalDocument(slug),
      subProcessors: slug === "privacy-policy" ? SUB_PROCESSORS : undefined,
      companyPlaceholder: {
        active: COMPANY_PROFILE.placeholder,
        fields: COMPANY_PROFILE.placeholderFields,
      },
    });
  });

  // ═══ HELP CENTRE ════════════════════════════════════════════════════════
  // Also public. Help that requires a working account cannot help someone whose
  // account is not working.

  app.get("/api/help", (req, res) => {
    const raw = req.query.q;
    const query = typeof raw === "string" ? raw : "";
    res.json({
      categories: HELP_CATEGORIES,
      articles: query ? searchHelpArticles(query) : HELP_ARTICLES,
      query,
    });
  });

  // ═══ SUPPORT REQUESTS ═══════════════════════════════════════════════════

  app.get("/api/support/kinds", (_req, res) => {
    res.json({
      kinds: SUPPORT_REQUEST_KIND_DEFINITIONS,
      limits: SUPPORT_REQUEST_LIMITS,
      supportEmail: COMPANY_PROFILE.supportEmail,
    });
  });

  const createRequestSchema = z.object({
    kind: z.string().refine(isSupportRequestKind, "Unknown request kind."),
    subject: z.string().trim().min(1).max(SUPPORT_REQUEST_LIMITS.subjectMax),
    body: z.string().trim().min(SUPPORT_REQUEST_LIMITS.bodyMin).max(SUPPORT_REQUEST_LIMITS.bodyMax),
    contextPath: z.string().max(500).optional().nullable(),
    contactEmail: z.string().email().optional().nullable(),
  });

  // Requires a signed-in account, and that is a deliberate limitation rather
  // than an oversight. An unauthenticated write endpoint that emails a mailbox
  // is a spam relay, and this platform has no captcha to put in front of one.
  // Signed-out visitors are given the support address to write to directly —
  // the route is never a dead end, it is just not a form.
  app.post("/api/support/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = createRequestSchema.parse(req.body);
      const created = await createSupportRequest({
        userId: req.user!.id,
        kind: input.kind as SupportRequestKind,
        subject: input.subject,
        body: input.body,
        contextPath: input.contextPath ?? null,
        contactEmail: input.contactEmail ?? null,
      });
      res.status(201).json({
        request: created,
        acknowledgement: SUPPORT_REQUEST_KIND_DEFINITIONS[created.kind as SupportRequestKind].acknowledgement,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Please check what you have written and try again." });
      }
      console.error("Error creating support request:", err);
      res.status(500).json({ message: "Failed to send your message. Please try again." });
    }
  });

  app.get("/api/support/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      res.json(await listRequestsForUser(req.user!.id));
    } catch (err) {
      console.error("Error listing support requests:", err);
      res.status(500).json({ message: "Failed to load your messages." });
    }
  });

  // ── Operator surface ──────────────────────────────────────────────────
  // The Support Hub had no inbound channel before BUS1: nothing a household did
  // anywhere in the product created a row an operator could read as "this
  // person needs help". These two endpoints are that channel.

  app.get("/api/admin/support/requests", assertAdmin, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" && isSupportRequestStatus(req.query.status)
        ? (req.query.status as SupportRequestStatus)
        : undefined;
      const kind = typeof req.query.kind === "string" && isSupportRequestKind(req.query.kind)
        ? (req.query.kind as SupportRequestKind)
        : undefined;
      res.json({
        requests: await listRequestsForOperator({ status, kind }),
        counts: await openRequestCounts(),
      });
    } catch (err) {
      console.error("Error listing support queue:", err);
      res.status(500).json({ message: "Failed to load the support queue." });
    }
  });

  app.patch("/api/admin/support/requests/:id", assertAdmin, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid request id." });
      const parsed = z
        .object({
          status: z.string().refine(isSupportRequestStatus, "Unknown status."),
          internalNote: z.string().max(5000).optional().nullable(),
        })
        .parse(req.body);
      const updated = await updateRequestStatus({
        id,
        status: parsed.status as SupportRequestStatus,
        internalNote: parsed.internalNote ?? null,
        operatorUserId: req.user!.id,
      });
      if (!updated) return res.status(404).json({ message: "Request not found." });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid update." });
      console.error("Error updating support request:", err);
      res.status(500).json({ message: "Failed to update the request." });
    }
  });

  // ═══ PRIVACY ════════════════════════════════════════════════════════════

  /**
   * What THA holds about you, described in categories.
   *
   * Built from the personal data registry — the SAME declaration the export and
   * the erasure read — so this page cannot describe a platform different from
   * the one that actually holds the data.
   */
  app.get("/api/privacy/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      res.json({
        categories: PERSONAL_DATA_REGISTRY.map((entry) => ({
          id: entry.id,
          label: entry.label,
          description: entry.description,
          group: entry.group,
          exported: entry.collect !== null,
          omittedBecause: entry.omittedBecause ?? null,
          erasureNote: entry.erasureNote ?? null,
        })),
        consents: await currentConsents(req.user!.id),
        consentDefinitions: CONSENT_DEFINITIONS,
        dataProtectionContact: COMPANY_PROFILE.dataProtectionContact,
        supervisoryAuthority: COMPANY_PROFILE.supervisoryAuthority,
      });
    } catch (err) {
      console.error("Error building privacy summary:", err);
      res.status(500).json({ message: "Failed to load your privacy settings." });
    }
  });

  app.get("/api/privacy/consents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      res.json(await consentHistory(req.user!.id));
    } catch (err) {
      console.error("Error loading consent history:", err);
      res.status(500).json({ message: "Failed to load your consent history." });
    }
  });

  app.post("/api/privacy/consents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = z
        .object({
          consentType: z.string().refine(isConsentType, "Unknown consent type."),
          granted: z.boolean(),
        })
        .parse(req.body);
      await recordConsent({
        userId: req.user!.id,
        consentType: parsed.consentType as ConsentType,
        granted: parsed.granted,
        source: "privacy-settings",
        context: consentContextFrom(req),
      });
      res.json({ consents: await currentConsents(req.user!.id) });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid consent update." });
      console.error("Error recording consent:", err);
      res.status(500).json({ message: "Failed to record your choice." });
    }
  });

  /**
   * Article 15 — download everything.
   *
   * Sent as an attachment rather than a JSON body so a browser saves a file the
   * person can keep, rather than rendering a wall of text they then have to work
   * out how to save.
   */
  app.get("/api/privacy/export", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user!.id;
      const payload = await buildDataExport(userId);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${exportFilename(userId)}"`);
      res.send(JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error("Error building data export:", err);
      res.status(500).json({ message: "Failed to build your data export. Please try again." });
    }
  });

  /**
   * Article 17 — erase the account.
   *
   * Two confirmations are required and both are checked server-side:
   *   • the account password, re-entered — because the session cookie alone
   *     should not be enough to destroy an account irreversibly; and
   *   • the literal word DELETE, so the action cannot be taken by a mis-click
   *     or by a double-submitted form.
   *
   * The email address is read BEFORE erasure and held only in memory, because
   * after this runs there is no row to read it from.
   */
  app.delete("/api/privacy/account", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    try {
      const parsed = z
        .object({
          password: z.string().min(1),
          confirmation: z.string(),
        })
        .parse(req.body);

      if (parsed.confirmation.trim().toUpperCase() !== "DELETE") {
        return res.status(400).json({ message: 'Please type DELETE to confirm.' });
      }

      const account = await storage.getUser(userId);
      if (!account) return res.status(404).json({ message: "Account not found." });

      if (!(await comparePasswords(parsed.password, account.password))) {
        return res.status(403).json({ message: "That password is not correct." });
      }

      const emailForConfirmation = account.username;
      const receipt = await eraseAccount(userId);

      // Sent after erasure, from an address held in memory only. See the
      // template in server/email/index.ts for why this is sent at all.
      sendAccountDeletedEmail(emailForConfirmation).catch((e) =>
        console.warn("[Privacy] Deletion confirmation email failed:", e?.message),
      );

      // The session is already gone — the erasure destroyed the session rows —
      // but logout is called so passport's in-memory state agrees with reality.
      req.logout((err) => {
        if (err) console.error("[Privacy] Logout after erasure failed:", err);
        res.json({
          message: "Your account and your data have been deleted.",
          receipt: { totalRowsAffected: receipt.totalRowsAffected, householdErased: receipt.householdErased },
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Please confirm your password and type DELETE." });
      }
      console.error("Error erasing account:", err);
      res.status(500).json({
        message:
          "We could not complete the deletion, and nothing has been removed. Please try again, or contact us.",
      });
    }
  });
}
