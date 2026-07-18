// BUS1 — Privacy Settings: where a household exercises its data rights.
//
// EXPERIENCE TEST (THA_EXPERIENCE_BLUEPRINT.md § 15.3):
//   Which room is this?  A quiet side room off Profile. Not a place anyone
//                        spends time, and it should not pretend otherwise.
//   How should someone feel here?  In control, and slightly surprised at how
//                        easy this is. Not warned, not guilt-tripped, not
//                        pursued.
//   The one thing it helps them do?  ACT on their own data — see it, take it,
//                        correct it, or leave.
//
// ─── THE RULE THIS PAGE IS BUILT AROUND ─────────────────────────────────────
// UX Governance Checklist, "Dark patterns": free of manufactured urgency, guilt
// copy, confirm-shaming, hidden opt-outs, and FRICTION ON LEAVING.
//
// Deleting an account is the single most dark-pattern-infested interaction in
// consumer software. So the rules here are explicit:
//   • Deletion is on this page, not buried three levels down or hidden behind an
//     email to support.
//   • The confirmation asks for a password and the word DELETE — friction that
//     protects the person from a mis-click, never friction that protects THA
//     from losing them.
//   • It does not ask why they are leaving. It does not offer a discount, a
//     pause, or "are you sure? you'll lose 47 recipes!". It tells them plainly
//     what will happen, and then it does it.
//   • The download-your-data option sits immediately above it, because that is
//     genuinely useful to someone about to leave — not as a diversion.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Download,
  FileText,
  Loader2,
  PencilLine,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";
import type { ConsentDefinition, ConsentRecordView, ConsentType } from "@shared/privacy/consent";

interface PrivacySummary {
  categories: Array<{
    id: string;
    label: string;
    description: string;
    group: string;
    exported: boolean;
    omittedBecause: string | null;
    erasureNote: string | null;
  }>;
  consents: ConsentRecordView[];
  consentDefinitions: Record<ConsentType, ConsentDefinition>;
  dataProtectionContact: string;
  supervisoryAuthority: { name: string; url: string; helpline: string };
}

function SectionCard({
  icon,
  title,
  description,
  children,
  testId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  testId: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5" data-testid={testId}>
      <div className="flex gap-3">
        <div className="mt-0.5 text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * The deletion flow.
 *
 * Deliberately inline rather than in a dialog. A modal that appears over the
 * page and can be dismissed by clicking away is the wrong shape for an
 * irreversible action — it invites a reflexive dismissal, and it hides the
 * consequences behind a scrim while asking the person to accept them.
 */
function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  // Feedback belongs to the mutation, never to the call site
  // (hooks/use-tracked-mutation.ts). The failure copy is required by the type,
  // and the raw error message is deliberately never forwarded — a household
  // being told "403: Forbidden" learns nothing except that THA is careless.
  const deleteAccount = useTrackedMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/privacy/account", { password, confirmation });
      return res.json();
    },
    // No success toast: the page navigates away, and the destination IS the
    // confirmation. A toast on a page that no longer exists is noise.
    feedback: {
      failure: "We could not delete your account",
      failureDescription:
        "Nothing has been removed and your account is unchanged. Check your password and try again, or write to us.",
    },
    onSuccess: () => {
      // A full reload, not a client-side navigate. The session is gone and every
      // cached query in memory belongs to an account that no longer exists;
      // clearing the whole page is the only honest state to leave the app in.
      window.location.href = "/auth?deleted=1";
    },
  });

  const canSubmit = password.length > 0 && confirmation.trim().toUpperCase() === "DELETE";

  return (
    <SectionCard
      icon={<Trash2 className="h-5 w-5" />}
      title="Delete your account"
      description="Erases your account and your data immediately. This cannot be undone, and we keep no copy."
      testId="section-delete-account"
    >
      {!open ? (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          data-testid="button-start-delete-account"
        >
          Delete my account
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div className="space-y-2 text-sm leading-relaxed text-foreground/85">
              <p className="font-semibold text-foreground">What will happen</p>
              <ul className="space-y-1.5">
                <li>Your meals, plans, shopping lists, pantry, diary and conversations are erased.</li>
                <li>The dietary needs recorded for you are erased with them.</li>
                <li>You are signed out on every device.</li>
                <li>
                  If other people share your household, the household continues and their data is
                  untouched.
                </li>
                <li>
                  Two anonymous records remain, both required by law: that consent was given, and
                  that an account was deleted today.
                </li>
              </ul>
              <p>If you want a copy of your data, download it first — this is your last chance.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-password">Your password</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              data-testid="input-delete-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">
              Type <span className="font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
              data-testid="input-delete-confirmation"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="destructive"
              disabled={!canSubmit || deleteAccount.isPending}
              onClick={() => deleteAccount.mutate()}
              data-testid="button-confirm-delete-account"
            >
              {deleteAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete my account permanently
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirmation("");
              }}
              data-testid="button-cancel-delete-account"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export default function PrivacySettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [downloading, setDownloading] = useState(false);

  const { data, isPending } = useQuery<PrivacySummary>({ queryKey: ["/api/privacy/summary"] });

  const setConsent = useTrackedMutation({
    mutationFn: async (input: { consentType: ConsentType; granted: boolean }) => {
      const res = await apiRequest("POST", "/api/privacy/consents", input);
      return res.json();
    },
    feedback: {
      success: "Your choice has been recorded",
      failure: "We could not record your choice",
      failureDescription: "Nothing has changed. Please try again in a moment.",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy/summary"] });
    },
  });

  /**
   * The download is triggered as a real navigation rather than fetched into
   * memory and turned into a blob. The server sends it as an attachment, so the
   * browser saves a file — which is what a person asked for.
   */
  async function downloadExport() {
    setDownloading(true);
    try {
      window.location.href = "/api/privacy/export";
    } finally {
      // The navigation does not unmount this page (it is a download), so the
      // button is released after a beat rather than left spinning forever.
      setTimeout(() => setDownloading(false), 2000);
    }
  }

  const back = { href: "/profile", label: "Profile" } as const;

  return (
    <>
      <WorkspaceHeader realm="diary" title="Privacy and your data" wide back={back} titleTestId="text-privacy-settings-title" />
      <div className={`${pageContainerClass(true)} space-y-4 sm:space-y-6`} data-testid="page-privacy-settings">
        <p className="text-base leading-relaxed text-muted-foreground">
          Everything here is a right you have under UK data protection law. None of it costs
          anything, none of it requires you to ask us, and none of it takes longer than a click.
        </p>

        {isPending ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          data && (
            <>
              {/* ── Article 15 ── */}
              <SectionCard
                icon={<Download className="h-5 w-5" />}
                title="Download your data"
                description="A file containing everything we hold about you. The real data, not a summary."
                testId="section-data-export"
              >
                <Button variant="default" onClick={downloadExport} disabled={downloading} data-testid="button-download-data">
                  {downloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download my data
                </Button>
              </SectionCard>

              {/* ── What we hold ── */}
              <SectionCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="What we hold about you"
                description="Every category of personal data in The Healthy Apples, and what happens to it if you leave."
                testId="section-data-categories"
              >
                <ul className="space-y-3">
                  {data.categories.map((c) => (
                    <li key={c.id} className="text-sm" data-testid={`data-category-${c.id}`}>
                      <p className="font-medium text-foreground">{c.label}</p>
                      <p className="mt-0.5 leading-relaxed text-muted-foreground">{c.description}</p>
                      {/* An omission is stated, never silent. */}
                      {!c.exported && c.omittedBecause && (
                        <p className="mt-1 leading-relaxed text-muted-foreground/80">
                          Not in your download: {c.omittedBecause}
                        </p>
                      )}
                      {c.erasureNote && (
                        <p className="mt-1 leading-relaxed text-muted-foreground/80">
                          On deletion: {c.erasureNote}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionCard>

              {/* ── Article 16 ── */}
              <SectionCard
                icon={<PencilLine className="h-5 w-5" />}
                title="Correct your data"
                description="Almost everything we hold is something you entered, and you can change it yourself in your profile. For anything you cannot reach, ask us and a person will put it right within one month."
                testId="section-data-correction"
              >
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild data-testid="button-edit-profile">
                    <Link href="/profile">Edit my profile</Link>
                  </Button>
                  <Button variant="outline" asChild data-testid="button-request-correction">
                    <Link href="/contact?kind=data-correction">Ask us to correct something</Link>
                  </Button>
                </div>
              </SectionCard>

              {/* ── Article 7 ── */}
              <SectionCard
                icon={<Check className="h-5 w-5" />}
                title="What you have agreed to"
                description="The version of each policy you agreed to, and when."
                testId="section-consents"
              >
                <ul className="space-y-4">
                  {data.consents.map((consent) => {
                    const definition = data.consentDefinitions[consent.consentType];
                    return (
                      <li key={consent.consentType} data-testid={`consent-${consent.consentType}`}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{definition.prompt}</p>
                          <p className="text-xs text-muted-foreground">
                            {consent.recordedAt
                              ? `${consent.granted ? "Agreed" : "Withdrawn"} ${new Date(consent.recordedAt).toLocaleDateString()}`
                              : "No record"}
                          </p>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {definition.why}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          Lawful basis: {definition.lawfulBasis}
                          {consent.documentVersion ? ` · Version ${consent.documentVersion}` : ""}
                        </p>
                        {consent.supersededByNewerVersion && (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                            This policy has been updated since you agreed to it.
                          </p>
                        )}
                        {/* Withdrawal states its consequence BEFORE it is taken —
                            the honest inverse of a hidden opt-out. */}
                        {consent.granted && (
                          <details className="mt-2">
                            <summary
                              className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                              data-testid={`withdraw-toggle-${consent.consentType}`}
                            >
                              Withdraw this consent
                            </summary>
                            <div className="mt-2 space-y-2 rounded-lg border border-border bg-background p-3">
                              <p className="text-sm leading-relaxed text-foreground/85">
                                {definition.withdrawalConsequence}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={setConsent.isPending}
                                onClick={() =>
                                  setConsent.mutate({
                                    consentType: consent.consentType,
                                    granted: false,
                                  })
                                }
                                data-testid={`button-withdraw-${consent.consentType}`}
                              >
                                I understand — withdraw it
                              </Button>
                            </div>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>

              {/* ── The policies ── */}
              <SectionCard
                icon={<FileText className="h-5 w-5" />}
                title="Our policies"
                description="What we hold, what we promise, and what we ask of you."
                testId="section-policies"
              >
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild data-testid="link-privacy-policy">
                    <Link href="/legal/privacy-policy">Privacy Policy</Link>
                  </Button>
                  <Button variant="outline" asChild data-testid="link-terms-of-service">
                    <Link href="/legal/terms-of-service">Terms of Service</Link>
                  </Button>
                  <Button variant="outline" asChild data-testid="link-cookie-policy">
                    <Link href="/legal/cookie-policy">Cookie Policy</Link>
                  </Button>
                </div>
              </SectionCard>

              <Separator />

              <DeleteAccountSection />

              <p className="pb-2 text-sm leading-relaxed text-muted-foreground">
                Questions about any of this go to{" "}
                <a
                  href={`mailto:${data.dataProtectionContact}`}
                  className="text-primary hover:underline"
                  data-testid="link-dpo-email"
                >
                  {data.dataProtectionContact}
                </a>
                . You can also complain to {data.supervisoryAuthority.name} at any time —{" "}
                <a
                  href={data.supervisoryAuthority.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                  data-testid="link-supervisory-authority"
                >
                  {data.supervisoryAuthority.url}
                </a>
                .
              </p>
            </>
          )
        )}
      </div>
    </>
  );
}
