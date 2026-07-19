/**
 * THE INVITATION — where a link lands. (COMM1A, 2026-07-19)
 * ===========================================================================
 *
 * WHICH ROOM IS THIS?  The doorstep. It is not inside the house — the person
 * standing here may have no account at all, which is the entire problem this
 * workstream exists to solve. It renders bare, outside the authenticated shell,
 * exactly as `/shared/:token` does.
 *
 * HOW SHOULD SOMEONE FEEL HERE?  Expected. Somebody meant to send this, and
 * nothing has been decided on their behalf.
 *
 * THE ONE THING IT HELPS THEM DO:  Understand what they have been offered, and
 * choose. Nothing is joined by arriving.
 *
 * ── WHAT IT DELIBERATELY DOES NOT SAY ──────────────────────────────────────
 *
 * IT NEVER NAMES THE SENDING HOUSEHOLD. THA does not know that this recipient
 * knows that sender, and printing one household's name on a page a stranger
 * reached from an email would disclose a household to someone who has no
 * relationship with the product. The person who sent it will have said so
 * themselves.
 *
 * IT PROMISES NO REWARD. No discount, percentage, saving or term appears here.
 * Commercial Rule C3 forbids a price claim without configured pricing, and
 * pricing is unconfigured platform-wide — so an invitation that promised money
 * off would be the withdrawn `TrialBanner.tsx` copy in a new place. COMM1A
 * records that a referral happened; it says nothing about what it is worth,
 * because nothing in THA can currently answer that.
 *
 * IT SHOWS A MASKED ADDRESS. The recipient needs to know which address to sign
 * up with; a forwarded link should not hand out a contact.
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InvitationPreview {
  kind: "tha" | "community";
  invitedEmailMasked: string;
  communityName: string | null;
  expiresAt: string;
}

export default function InvitationPage() {
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);

  const previewQ = useQuery<InvitationPreview>({
    queryKey: [`/api/invitations/${token}/preview`],
    enabled: token.length > 0,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invitations/${token}/accept`, {});
      return res.json();
    },
    onSuccess: (data: { kind: string; communityToken?: string }) => {
      setAccepted(true);
      // A community invitation hands off to the Orchard's own gate, which is
      // where membership is explicitly accepted. Accepting HERE would have made
      // membership a side effect of clicking a link.
      if (data.kind === "community" && data.communityToken) {
        navigate(`/orchard?invitation=${encodeURIComponent(data.communityToken)}`);
      } else {
        navigate("/home");
      }
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        description:
          e.message?.includes("different email")
            ? "This invitation was sent to a different address than the one on your account."
            : "That invitation is not valid — it may have expired or already been used.",
      });
    },
  });

  // A signed-in household whose address matches can accept in place. A signed-in
  // household whose address does NOT match is refused by the server, and the
  // toast above says so plainly rather than leaving them guessing.
  useEffect(() => {
    if (accepted) return;
  }, [accepted]);

  if (!token) {
    return <Doorstep heading="This link is incomplete." body="Check the link in your email — it may have been cut short." />;
  }

  if (previewQ.isPending) {
    return (
      <Doorstep>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
      </Doorstep>
    );
  }

  if (previewQ.isError || !previewQ.data) {
    // One message for expired, withdrawn, already-used and never-existed alike —
    // the server answers all four identically, and so does this.
    return (
      <Doorstep
        heading="This invitation isn't available."
        body="It may have expired, been withdrawn, or already been used. Whoever sent it can send a new one."
      />
    );
  }

  const inv = previewQ.data;
  const toCommunity = inv.kind === "community" && inv.communityName;

  return (
    <Doorstep>
      <div className="space-y-4" data-testid="invitation-preview">
        <h1 className="title-page">
          {toCommunity
            ? `You've been invited to ${inv.communityName}.`
            : "You've been invited to The Healthy Apples."}
        </h1>

        <p className="text-muted-foreground">
          {toCommunity
            ? "A household already using The Healthy Apples has invited yours to their neighbourhood."
            : "A household already using The Healthy Apples thought you might like it too."}
        </p>

        {toCommunity && (
          <p className="text-sm text-muted-foreground">
            Neighbourhoods are quiet. Yours would share nothing about your plans,
            your food, or who eats with you — only that you're part of it.
          </p>
        )}

        <p className="text-sm text-muted-foreground" data-testid="invitation-address">
          This invitation was sent to <span className="font-medium">{inv.invitedEmailMasked}</span>,
          and only works for that address.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {user ? (
          <>
            <Button
              variant="default"
              onClick={() => accept.mutate()}
              disabled={accept.isPending}
              data-testid="invitation-accept"
            >
              {accept.isPending ? "…" : toCommunity ? "See the invitation" : "Accept"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {toCommunity
                ? "You'll be shown the neighbourhood before anything is joined."
                : "You're already signed in."}
            </p>
          </>
        ) : (
          <>
            {/* The token rides through to signup. This is the link that
                `/shared/:token` famously does NOT carry (it sends people to a
                bare /auth and drops what they came for), and carrying it is the
                whole point of COMM1A. */}
            <Link href={`/auth?invitation=${encodeURIComponent(token)}`}>
              <Button variant="default" data-testid="invitation-signup">
                Create an account
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sign up with the address above and this invitation will be waiting.
              Nothing is joined until you say so.
            </p>
          </>
        )}
      </div>
    </Doorstep>
  );
}

/** The bare frame. No app shell — the person here may have no account. */
function Doorstep({
  heading, body, children,
}: {
  heading?: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="p-8">
            {heading && <h1 className="title-page mb-3">{heading}</h1>}
            {body && <p className="text-muted-foreground">{body}</p>}
            {children}
            {heading && (
              <div className="mt-8">
                <Link href="/">
                  <Button variant="outline" data-testid="invitation-home">
                    Go to The Healthy Apples
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
