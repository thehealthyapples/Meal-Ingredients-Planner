// BUS1 — the contact room.
//
// EXPERIENCE TEST (THA_EXPERIENCE_BLUEPRINT.md § 15.3):
//   Which room is this?  The counter you walk up to when the product has not
//                        answered you. Someone arrives here having already
//                        failed at something, or having found something wrong.
//   How should someone feel here?  Heard, and certain the message went
//                        somewhere. Not routed into a void, not asked to
//                        explain themselves twice, and never surprised by what
//                        was attached to what they wrote.
//   The one thing it helps them do?  SEND one message to a person, and then see
//                        that it arrived.
//
// The four kinds are one entity with a `kind` field, not four forms — see
// shared/support/support-request.ts for why. This page holds no wording of its
// own for them: every label, placeholder and acknowledgement comes from
// `GET /api/support/kinds`, so the form and the server agree by construction
// (ARCHITECTURE_PRINCIPLES.md Principle 2).
//
// Two things are shown rather than done quietly. The referring path is
// displayed before it is attached, because a page that silently posts where you
// have been is collecting rather than helping. And where a kind carries the UK
// GDPR Art. 16 one-month deadline, that is stated on the form — a right should
// not read like a favour.

import { useState } from "react";
import { Link, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { CheckCircle2, Inbox, Scale } from "lucide-react";
import {
  SUPPORT_REQUEST_KINDS,
  isSupportRequestKind,
  type SupportRequestKind,
  type SupportRequestKindDefinition,
} from "@shared/support/support-request";
import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadError } from "@/components/ui/load-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SupportKindsResponse {
  kinds: Record<SupportRequestKind, SupportRequestKindDefinition>;
  limits: { subjectMax: number; bodyMin: number; bodyMax: number };
  supportEmail: string;
}

/** The row as it arrives over JSON — timestamps are strings by the time we see them. */
interface SupportRequestRow {
  id: number;
  kind: string;
  subject: string;
  status: string;
  createdAt: string;
}

/** The operator lifecycle said in the words a household would use. */
const STATUS_LABELS: Record<string, string> = {
  new: "Received",
  acknowledged: "Being looked at",
  resolved: "Answered",
  closed: "Closed",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ContactPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const kindParam = params.get("kind");
  const fromPath = params.get("from");

  const [kind, setKind] = useState<SupportRequestKind>(
    kindParam && isSupportRequestKind(kindParam) ? kindParam : "question",
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sentAcknowledgement, setSentAcknowledgement] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const kindsQuery = useQuery<SupportKindsResponse>({ queryKey: ["/api/support/kinds"] });
  const requestsQuery = useQuery<SupportRequestRow[]>({ queryKey: ["/api/support/requests"] });

  const definition = kindsQuery.data?.kinds[kind];
  const limits = kindsQuery.data?.limits;

  const attachesPath = Boolean(definition?.capturesContextPath && fromPath);

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();
  const subjectValid =
    trimmedSubject.length > 0 && (!limits || trimmedSubject.length <= limits.subjectMax);
  const bodyValid =
    !!limits && trimmedBody.length >= limits.bodyMin && trimmedBody.length <= limits.bodyMax;

  // Feedback belongs to the mutation, not the call site
  // (hooks/use-tracked-mutation.ts). The raw error message is never forwarded to
  // the household — the failure copy below is the only wording ever shown.
  const sendMutation = useTrackedMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/support/requests", {
        kind,
        subject: trimmedSubject,
        body: trimmedBody,
        contextPath: attachesPath ? fromPath : null,
      }),
    feedback: {
      success: "Message sent",
      successDescription: definition?.acknowledgement,
      failure: "We could not send your message",
      failureDescription:
        "Nothing was sent. What you wrote is still here — please try again in a moment.",
    },
    onSuccess: () => {
      setSentAcknowledgement(definition?.acknowledgement ?? null);
      setSubject("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/support/requests"] });
    },
  });

  const changeKind = (value: string) => {
    if (!isSupportRequestKind(value)) return;
    setKind(value);
    setSentAcknowledgement(null);
  };

  const header = (
    <WorkspaceHeader
      realm="diary"
      title="Contact us"
      wide
      back={{ href: "/profile", label: "Profile" }}
    />
  );

  if (kindsQuery.isPending) {
    return (
      <>
        {header}
        <div className={`${pageContainerClass(true)} space-y-4 sm:space-y-6`}>
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (kindsQuery.isError || !kindsQuery.data || !definition || !limits) {
    return (
      <>
        {header}
        <div className={`${pageContainerClass(true)} space-y-4 sm:space-y-6`}>
          <LoadError
            what="the contact form"
            onRetry={() => kindsQuery.refetch()}
            data-testid="error-contact-kinds"
          />
        </div>
      </>
    );
  }

  const bodyCount = body.length;
  const bodyOverLimit = bodyCount > limits.bodyMax;

  return (
    <>
      {header}

      <div
        className={`${pageContainerClass(true)} space-y-4 sm:space-y-6`}
        data-testid="page-contact"
      >
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A person reads every message. If you are looking for how something works, the{" "}
          <Link href="/help" className="text-primary hover:underline" data-testid="link-contact-help">
            Help Centre
          </Link>{" "}
          may answer it faster.
        </p>

        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="space-y-2">
              <Label htmlFor="contact-kind">What would you like to do?</Label>
              <Select value={kind} onValueChange={changeKind}>
                <SelectTrigger id="contact-kind" data-testid="select-contact-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_REQUEST_KINDS.map((k) => (
                    <SelectItem key={k} value={k} data-testid={`option-contact-kind-${k}`}>
                      {kindsQuery.data.kinds[k].title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{definition.description}</p>
            </div>

            {definition.hasStatutoryDeadline && (
              <div
                className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4"
                data-testid="notice-contact-statutory-deadline"
              >
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-foreground/85">
                  This is a request under Article 16 of the UK GDPR. We must respond within one
                  month. That is a legal deadline, not a target.
                </p>
              </div>
            )}

            {attachesPath && (
              <div
                className="rounded-lg border border-border bg-muted/40 p-4"
                data-testid="notice-contact-context-path"
              >
                <p className="text-sm leading-relaxed text-foreground/85">
                  We will attach the page you came from, so you do not have to describe where you
                  were:
                </p>
                <p className="mt-1 font-mono text-sm text-foreground">{fromPath}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="contact-subject">{definition.subjectLabel}</Label>
              <Input
                id="contact-subject"
                value={subject}
                maxLength={limits.subjectMax}
                onChange={(e) => setSubject(e.target.value)}
                data-testid="input-contact-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-body">{definition.bodyLabel}</Label>
              <Textarea
                id="contact-body"
                value={body}
                rows={7}
                placeholder={definition.bodyPlaceholder}
                onChange={(e) => setBody(e.target.value)}
                data-testid="textarea-contact-body"
              />
              <p
                className={`text-xs ${bodyOverLimit ? "text-destructive" : "text-muted-foreground"}`}
                data-testid="text-contact-body-count"
              >
                {bodyCount} of {limits.bodyMax} characters
                {trimmedBody.length < limits.bodyMin
                  ? ` · at least ${limits.bodyMin} needed`
                  : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="default"
                onClick={() => sendMutation.mutate()}
                disabled={!subjectValid || !bodyValid || sendMutation.isPending}
                data-testid="button-contact-send"
              >
                {sendMutation.isPending ? "Sending" : "Send message"}
              </Button>
              <span className="text-sm text-muted-foreground">
                We reply to the email address on your account.
              </span>
            </div>

            {sentAcknowledgement && (
              <div
                className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4"
                data-testid="notice-contact-acknowledgement"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-foreground/85">{sentAcknowledgement}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          If you cannot sign in, write to{" "}
          <a
            href={`mailto:${kindsQuery.data.supportEmail}`}
            className="text-primary hover:underline"
            data-testid="link-contact-support-email"
          >
            {kindsQuery.data.supportEmail}
          </a>{" "}
          instead.
        </p>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Your messages</h2>

          {requestsQuery.isPending && (
            <div className="space-y-2" aria-busy="true" aria-label="Loading your messages">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          )}

          {requestsQuery.isError && (
            <LoadError
              what="your messages"
              onRetry={() => requestsQuery.refetch()}
              data-testid="error-contact-requests"
            />
          )}

          {requestsQuery.data && requestsQuery.data.length === 0 && (
            <EmptyState
              variant="empty"
              icon={Inbox}
              title="You have not sent us anything yet"
              description="Anything you send will be listed here, so you can see it arrived."
              data-testid="empty-contact-requests"
            />
          )}

          {requestsQuery.data && requestsQuery.data.length > 0 && (
            <ul className="space-y-2">
              {requestsQuery.data.map((request) => (
                <li
                  key={request.id}
                  className="rounded-xl border border-border bg-card p-4"
                  data-testid={`row-contact-request-${request.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{request.subject}</p>
                    <Badge variant="secondary">
                      {STATUS_LABELS[request.status] ?? request.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isSupportRequestKind(request.kind)
                      ? kindsQuery.data.kinds[request.kind].title
                      : request.kind}
                    {" · "}
                    {formatDate(request.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
