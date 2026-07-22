/**
 * THE ORCHARD — Community as a place. (COMM2, 2026-07-19)
 * ===========================================================================
 *
 * WHICH ROOM IS THIS?  The room that looks outward. Every other room in the
 * house faces the household's own life; this one faces the households they
 * live near. It is the only room whose subject is not inside the walls.
 *
 * HOW SHOULD SOMEONE FEEL HERE?  Neighbourly, and unobserved. The Orchard's
 * whole emotional claim is that belonging somewhere costs you nothing — you
 * can see that you are among others without any of them being able to see you.
 *
 * THE ONE THING IT HELPS THEM DO:  Know where they belong, and answer an
 * invitation. That is the entire room.
 *
 * ---------------------------------------------------------------------------
 * ONE ROOM, FOUR PARTS — this is the governed shape (COMM2 owner ruling)
 * ---------------------------------------------------------------------------
 *
 * The Orchard, Neighbourhoods, the Village and the High Street are the
 * experience INSIDE this one room. They are NOT routes, NOT nav entries, and
 * NOT realms. Moving between them is state on this page, never navigation:
 *
 *   The Orchard      the overview — how many neighbourhoods, what is waiting
 *   Neighbourhoods   one community at a time; the households in it
 *   The Village      standing and invitations — where you join, answer, leave
 *   The High Street  the shops the village can reach (real retailers only)
 *
 * Making any of them a fourth nav entry would fork `NAV_ITEMS` into four owners
 * of one place and would admit three rooms to the map (Experience Blueprint
 * § 5.1) where governance admitted exactly one.
 *
 * ---------------------------------------------------------------------------
 * ORCHARD EXPOSURE — E2, opening to E3 when empty
 * ---------------------------------------------------------------------------
 *
 * E2, "the window" (Blueprint § 6.2): a framed partial presence in one region
 * content deliberately does not cover. The Orchard is a reflective room, not a
 * dense working one — nobody comes here to fill in a form.
 *
 * When the household belongs to no neighbourhood, it opens ONE level to E3.
 * That is rule 2 of the exposure scale, used exactly as written: "empty states
 * may open the window one level, never two." An orchard with nothing in it
 * showing more view is the honest picture, not a consolation prize.
 *
 * NOTE the thing this room does NOT do: it never renders an orchard, a village,
 * a street, a house, a tree, or a map. "The orchard is experienced through
 * windows and subtle connections, never walked into" (§ 6.2), and "the rendered
 * world" and "the theme park" are named spatial anti-patterns (§ 16). Every
 * place-word here is a FEELING TO DESIGN TOWARD, produced by light, material
 * and composition — never a picture to draw.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS ROOM CAN AND CANNOT KNOW — the privacy boundary, made visible
 * ---------------------------------------------------------------------------
 *
 * COMM1 § 2.3: "Membership is not a read grant. Two households in one community
 * learn that they share it, and nothing else. This is not a filter applied at
 * the edge; it is the absence of any method that could return more."
 *
 * So this page CANNOT show another household's name, and does not try. The API
 * returns `{ householdId, role }` and nothing else, because the owning service
 * has no method that returns anything else. A neighbour is therefore drawn as a
 * PRESENCE, not a profile — and the room says so out loud rather than leaving
 * the household to wonder what is being shared. The privacy boundary is the
 * feature, so it is stated, not hidden.
 *
 * This page adds ZERO new server surface. Every fact on it comes from a route
 * COMM1 already built. If a fact is not here, it is because no method returns
 * it — not because this page declined to render it.
 *
 * ---------------------------------------------------------------------------
 * DELIBERATELY NOT BUILT (scope lock, held)
 * ---------------------------------------------------------------------------
 *
 * No messaging. No feed. No recipe sharing. No planner sharing. No Community
 * Intelligence. No inter-household data exchange of any kind.
 *
 * ── THE INVITE FORM — COMM2's blocking gap, closed by COMM1A ───────────────
 *
 * COMM2 shipped with no invite form, and said so: `POST /api/community/:id/
 * invitations` takes a numeric `householdId`, a household has no way to learn
 * another household's id (COMM1 § 2.4 made communities probe-resistant), and
 * "building a form for an id nobody can obtain would be a door onto a wall."
 *
 * COMM1A built the wall a door fits in. `POST /api/invitations` is addressed to
 * an EMAIL — the only thing a household can honestly name about someone who may
 * not be here yet — and the id never appears. The form below is that door.
 *
 * It still creates no membership. The invited household signs up, COMM1 issues
 * a proper community invitation, and that household accepts it at the gate in
 * `VillageView`. Clicking a link never joins a neighbourhood.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Users, Store, MailOpen, ArrowRight, Send } from "lucide-react";

import { WorkspaceHeader, pageContainerClass } from "@/components/workspace-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadError } from "@/components/ui/load-error";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { apiRequest } from "@/lib/queryClient";
import { usePublishCompanionContext } from "@/components/conversation/companion-context";

// ── The shapes COMM1's routes actually return ──────────────────────────────
// Mirrored from server/routes.ts (the nine /api/community/* routes). Kept
// narrow on purpose: a field typed here that the route does not send is a
// fabrication waiting to be rendered.

interface CommunitySummary {
  id: number;
  name: string;
  kind: string;
}

interface CommunityMembers {
  communityId: number;
  memberCount: number;
  /** `{ householdId, role }` — there is no name, and no method that returns one. */
  members: { householdId: number; role: string }[];
}

interface PendingInvitation {
  id: number;
  communityId: number;
  expiresAt: string;
}

/** A real retailer, from the `partners` capability (getBasketSupermarkets). */
interface Retailer {
  name: string;
  key: string;
  color: string;
  hasDirectBasket: boolean;
}

type OrchardPart = "orchard" | "neighbourhood" | "village" | "highstreet";

export default function OrchardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // An invitation is TARGETED and single-use, and its token is issued once — to
  // the invited household, in the link they were sent. It is deliberately never
  // listed back by `GET /api/community/invitations` (COMM1 § 5: "a live bearer
  // token sitting in a file is a standing grant to join a community"). So the
  // only place this room can honestly obtain one is the link itself.
  const search = useSearch();
  const invitationToken = new URLSearchParams(search).get("invitation");

  // Which part of the room is in view, and which neighbourhood is being looked
  // at. BOTH are page state, never routes — see the header note.
  const [part, setPart] = useState<OrchardPart>(invitationToken ? "village" : "orchard");
  const [openCommunityId, setOpenCommunityId] = useState<number | null>(null);

  // The Orchard holds no pointer any other surface can act on — a community is
  // not an entity the Companion can write to. Publishing nothing is the honest
  // call; an absent pointer is always safer than a guessed one.
  usePublishCompanionContext({});

  const communitiesQ = useQuery<CommunitySummary[]>({
    queryKey: ["/api/community"],
    enabled: !!user,
  });

  const invitationsQ = useQuery<PendingInvitation[]>({
    queryKey: ["/api/community/invitations"],
    enabled: !!user,
  });

  const membersQ = useQuery<CommunityMembers>({
    queryKey: [`/api/community/${openCommunityId}/members`],
    enabled: !!user && openCommunityId !== null,
  });

  // The High Street is only loaded when the household walks to it. The
  // retailers are real and static, but a room should not fetch what nobody
  // has asked to see.
  const retailersQ = useQuery<Retailer[]>({
    queryKey: ["/api/basket/supermarkets-enhanced"],
    enabled: !!user && part === "highstreet",
  });

  const communities = communitiesQ.data ?? [];
  const invitations = invitationsQ.data ?? [];

  const refreshCommunity = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/community"] });
    queryClient.invalidateQueries({ queryKey: ["/api/community/invitations"] });
  };

  const answerInvitation = useMutation({
    mutationFn: async ({ token, accept }: { token: string; accept: boolean }) => {
      const path = accept
        ? "/api/community/invitations/accept"
        : "/api/community/invitations/decline";
      return apiRequest("POST", path, { token });
    },
    onSuccess: (_data, variables) => {
      refreshCommunity();
      // Drop the token from the address bar the moment it is spent. It is
      // single-use, so a stale one in a copied URL is only ever a confusing
      // failure — and a bearer token has no business lingering in history.
      navigate("/orchard");
      toast({
        description: variables.accept
          ? "You've joined. Your neighbours can see that you're here — nothing more."
          : "Declined. Nothing was shared.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "That invitation couldn't be answered. It may have expired.",
      });
    },
  });

  const leaveCommunity = useMutation({
    mutationFn: async (communityId: number) =>
      apiRequest("POST", `/api/community/${communityId}/leave`, {}),
    onSuccess: () => {
      refreshCommunity();
      setOpenCommunityId(null);
      setPart("orchard");
      toast({ description: "You've left. Nothing of yours stayed behind." });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description:
          "You're the last person looking after this neighbourhood, so it can't be left empty.",
      });
    },
  });

  const waiting = communitiesQ.isPending || invitationsQ.isPending;
  const broken = communitiesQ.isError;

  // Blueprint § 6.2 rule 2 — an empty orchard opens the window ONE level, E2 → E3,
  // and returns to E2 the moment the household belongs anywhere.
  // A household holding an invitation link is not in an empty orchard — it is
  // standing at a gate. Showing "your orchard is quiet" over the top of an
  // invitation it can actually answer would be the room contradicting itself.
  const isEmptyOrchard =
    !waiting && !broken && !invitationToken &&
    communities.length === 0 && invitations.length === 0;
  const exposure = isEmptyOrchard ? "e3" : "e2";

  return (
    <>
      <WorkspaceHeader
        realm="orchard"
        title="Orchard"
        titleTestId="text-orchard-title"
        wide
      />

      <div className={pageContainerClass(true)} data-orchard-exposure={exposure}>
        {broken ? (
          <LoadError
            what="your orchard"
            onRetry={() => communitiesQ.refetch()}
          />
        ) : waiting ? (
          <OrchardWaiting />
        ) : isEmptyOrchard ? (
          <EmptyOrchard />
        ) : (
          <div className="space-y-10 py-6">
            {/* ── Moving between the parts of the room. Not navigation. ── */}
            <nav aria-label="The Orchard" className="flex flex-wrap gap-2">
              <PartTab id="orchard"      label="The Orchard"     active={part} onSelect={setPart} />
              <PartTab id="village"      label="The Village"     active={part} onSelect={setPart} />
              <PartTab id="highstreet"   label="The High Street" active={part} onSelect={setPart} />
            </nav>

            {part === "orchard" && (
              <OrchardOverview
                communities={communities}
                invitationCount={invitations.length}
                onOpen={(id) => {
                  setOpenCommunityId(id);
                  setPart("neighbourhood");
                }}
                onGoToVillage={() => setPart("village")}
              />
            )}

            {part === "neighbourhood" && openCommunityId !== null && (
              <NeighbourhoodView
                community={communities.find((c) => c.id === openCommunityId)}
                members={membersQ.data}
                isPending={membersQ.isPending}
                isError={membersQ.isError}
                onRetry={() => membersQ.refetch()}
                onBack={() => {
                  setOpenCommunityId(null);
                  setPart("orchard");
                }}
                onLeave={() => leaveCommunity.mutate(openCommunityId)}
                leaving={leaveCommunity.isPending}
              />
            )}

            {part === "village" && (
              <VillageView
                communities={communities}
                invitations={invitations}
                invitationToken={invitationToken}
                onAnswer={(token, accept) => answerInvitation.mutate({ token, accept })}
                answering={answerInvitation.isPending}
              />
            )}

            {part === "highstreet" && (
              <HighStreetView
                retailers={retailersQ.data ?? []}
                isPending={retailersQ.isPending}
                isError={retailersQ.isError}
                onRetry={() => retailersQ.refetch()}
                onGoShopping={() => navigate("/shopping-workspace")}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// The parts of the room
// ───────────────────────────────────────────────────────────────────────────

function PartTab({
  id, label, active, onSelect,
}: {
  id: OrchardPart;
  label: string;
  active: OrchardPart;
  onSelect: (p: OrchardPart) => void;
}) {
  // `neighbourhood` is reached by opening one, never by a tab — so while a
  // neighbourhood is open, "The Orchard" stays the lit tab it belongs under.
  const isActive = active === id || (active === "neighbourhood" && id === "orchard");
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-current={isActive ? "true" : undefined}
      data-testid={`orchard-part-${id}`}
      className={
        isActive
          ? "rounded-[--radius-support] bg-[hsl(20,34%,89%)] px-4 py-2 text-sm font-medium text-[hsl(20,44%,22%)] dark:bg-[hsl(20,20%,18%)] dark:text-[hsl(20,32%,72%)]"
          : "rounded-[--radius-support] px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
      }
    >
      {label}
    </button>
  );
}

function OrchardWaiting() {
  return (
    <div className="space-y-6 py-6" data-testid="orchard-waiting">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/**
 * The empty Orchard — E3, the open view.
 *
 * INTLANG1: a gap is spoken as a gap, and silence is a valid complete answer.
 * There is no manufactured urgency, no "get started!", and no invitation to
 * go and find people. It states what is true and stops.
 */
function EmptyOrchard() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center py-12 text-center"
      data-testid="orchard-empty"
    >
      <div className="max-w-xl space-y-4">
        <h2 className="title-section">Your orchard is quiet.</h2>
        <p className="text-muted-foreground">
          You don't belong to a neighbourhood yet. When someone invites your
          household to one, it will be waiting here.
        </p>
        <p className="text-sm text-muted-foreground">
          A neighbourhood only ever tells your neighbours that you share it.
          Nothing about your household — your plans, your food, who lives with
          you — is ever visible to them.
        </p>
      </div>
    </div>
  );
}

function OrchardOverview({
  communities, invitationCount, onOpen, onGoToVillage,
}: {
  communities: CommunitySummary[];
  invitationCount: number;
  onOpen: (id: number) => void;
  onGoToVillage: () => void;
}) {
  return (
    <section className="space-y-6" data-testid="orchard-overview">
      <header className="space-y-2">
        <h2 className="title-section">
          {communities.length === 1
            ? "One neighbourhood."
            : `${communities.length} neighbourhoods.`}
        </h2>
        {invitationCount > 0 && (
          <p className="text-muted-foreground">
            {invitationCount === 1
              ? "An invitation is waiting in the Village."
              : `${invitationCount} invitations are waiting in the Village.`}{" "}
            <button
              type="button"
              onClick={onGoToVillage}
              className="underline underline-offset-4"
              data-testid="orchard-goto-village"
            >
              Go there
            </button>
          </p>
        )}
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {communities.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onOpen(c.id)}
              data-testid={`orchard-neighbourhood-${c.id}`}
              className="group w-full rounded-[--radius-primary] border border-border bg-card p-5 text-left transition-colors hover:bg-accent"
            >
              <span className="title-card block">{c.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {c.kind === "neighbourhood" ? "Neighbourhood" : c.kind}
              </span>
              <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * One neighbourhood — the households in it, drawn as PRESENCE.
 *
 * This is the component where the privacy boundary is visible rather than
 * described. There is no name to render because no method returns one; what a
 * household is here is a quiet mark and a standing, and the room says so.
 */
function NeighbourhoodView({
  community, members, isPending, isError, onRetry, onBack, onLeave, leaving,
}: {
  community: CommunitySummary | undefined;
  members: CommunityMembers | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onBack: () => void;
  onLeave: () => void;
  leaving: boolean;
}) {
  if (isError) {
    return <LoadError what="that neighbourhood" onRetry={onRetry} />;
  }

  return (
    <section className="space-y-6" data-testid="orchard-neighbourhood-view">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground underline underline-offset-4"
        data-testid="orchard-back-to-overview"
      >
        Back to the Orchard
      </button>

      <header className="space-y-1">
        <h2 className="title-section">{community?.name ?? "Neighbourhood"}</h2>
        {isPending ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <p className="text-muted-foreground">
            {members?.memberCount === 1
              ? "Yours is the only household here so far."
              : `${members?.memberCount} households here, yours among them.`}
          </p>
        )}
      </header>

      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <>
          {/* The one sign of life (Blueprint § 12): the neighbourhood is inhabited.
              One detail, not a set — the presences themselves, and nothing more. */}
          <ul
            className="flex flex-wrap gap-3"
            aria-label="Households in this neighbourhood"
            data-testid="orchard-presences"
          >
            {(members?.members ?? []).map((m) => (
              <li
                key={m.householdId}
                className="flex items-center gap-2 rounded-[--radius-support] border border-border bg-card px-4 py-3"
              >
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm">
                  A household
                  {m.role !== "member" && (
                    <span className="text-muted-foreground"> · looks after this place</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <p className="max-w-xl text-sm text-muted-foreground" data-testid="orchard-privacy-note">
            THA shows you that you share this neighbourhood, and nothing else.
            Your neighbours cannot see your name, your household, your plans, your
            shopping or anyone who eats with you — and you cannot see theirs.
          </p>

          <Button
            variant="outline"
            onClick={onLeave}
            disabled={leaving}
            data-testid="orchard-leave"
          >
            {leaving ? "Leaving…" : "Leave this neighbourhood"}
          </Button>
        </>
      )}
    </section>
  );
}

/**
 * The Village — standing and invitations. The civic part of the room: where a
 * household answers what has been offered, and sees where it stands.
 */
function VillageView({
  communities, invitations, invitationToken, onAnswer, answering,
}: {
  communities: CommunitySummary[];
  invitations: PendingInvitation[];
  invitationToken: string | null;
  onAnswer: (token: string, accept: boolean) => void;
  answering: boolean;
}) {
  return (
    <section className="space-y-8" data-testid="orchard-village">
      <header className="space-y-2">
        <h2 className="title-section">The Village</h2>
        <p className="text-muted-foreground">
          Where you're known, and what's been offered.
        </p>
      </header>

      {/* The gate. Present only when the household arrived holding a token —
          which is the only way this surface can honestly obtain one. */}
      {invitationToken && (
        <div
          className="rounded-[--radius-primary] border border-border bg-card p-5"
          data-testid="orchard-invitation-gate"
        >
          <h3 className="title-card">Your household has been invited.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Joining tells this neighbourhood that your household is part of it.
            It shares nothing else — not your name, your plans, your food, or
            anyone who eats with you.
          </p>
          <div className="mt-4 flex gap-3">
            {/* The one primary action of this surface (UIA § 7): answering the
                invitation is the only reason the household is standing here. */}
            <Button
              variant="default"
              onClick={() => onAnswer(invitationToken, true)}
              disabled={answering}
              data-testid="orchard-accept-invitation"
            >
              {answering ? "…" : "Join"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onAnswer(invitationToken, false)}
              disabled={answering}
              data-testid="orchard-decline-invitation"
            >
              No thank you
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="title-card flex items-center gap-2">
          <MailOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Invitations
        </h3>

        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="orchard-no-invitations">
            Nothing is waiting.
          </p>
        ) : (
          <ul className="space-y-3" data-testid="orchard-invitations">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="rounded-[--radius-primary] border border-border bg-card p-5"
              >
                <p className="text-sm">
                  Your household has been invited to a neighbourhood.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The invitation is open until{" "}
                  {new Date(inv.expiresAt).toLocaleDateString(undefined, {
                    day: "numeric", month: "long",
                  })}
                  .
                </p>
                {/* No Join button here, and that is not an omission. The token is
                    issued ONCE, to the invited household, in the link they were
                    sent; `GET /api/community/invitations` deliberately strips it
                    (COMM1 § 5 — "a live bearer token sitting in a file is a
                    standing grant to join a community"). This list can therefore
                    honestly say something is waiting, but it does not hold the
                    means to accept it. The gate above does, when the household
                    arrives by their link. */}
                <p className="mt-3 text-sm text-muted-foreground">
                  Open the link you were sent to answer it.
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="title-card">Where you're known</h3>
        {communities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nowhere yet.</p>
        ) : (
          <ul className="space-y-2" data-testid="orchard-standing">
            {communities.map((c) => (
              <li key={c.id} className="text-sm">
                <span className="font-medium">{c.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InviteSomeone communities={communities} />
    </section>
  );
}

/**
 * The door COMM2 could not build.
 *
 * It asks for an EMAIL ADDRESS and never a household id — COMM1A's whole
 * contribution. The response is identical whether or not that address already
 * belongs to a THA household, so this form cannot be used to discover who is on
 * the platform.
 *
 * It promises nothing. No discount, saving, percentage or term appears here:
 * Commercial Rule C3 forbids a price claim without configured pricing, and
 * pricing is unconfigured platform-wide.
 */
function InviteSomeone({ communities }: { communities: CommunitySummary[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [communityId, setCommunityId] = useState<number | "">("");

  const sentQ = useQuery<{ id: number; invitedEmail: string; kind: string; status: string }[]>({
    queryKey: ["/api/invitations"],
  });

  const invite = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/invitations", {
        email,
        ...(communityId === "" ? {} : { communityId }),
      }),
    onSuccess: async (res: Response) => {
      const data = await res.json().catch(() => ({}));
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({
        description: data?.delivered === false
          ? "The invitation was created, but the email couldn't be sent just now."
          : "Invitation sent. Nothing is shared unless they accept.",
      });
    },
    onError: () => {
      toast({ variant: "destructive", description: "That invitation couldn't be sent." });
    },
  });

  const withdraw = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/invitations/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({ description: "Withdrawn. That link no longer works." });
    },
  });

  const pending = (sentQ.data ?? []).filter((i) => i.status === "pending");

  return (
    <div className="space-y-4 border-t border-border pt-8" data-testid="orchard-invite">
      <div className="space-y-1">
        <h3 className="title-card flex items-center gap-2">
          <Send className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Invite a household
        </h3>
        <p className="text-sm text-muted-foreground">
          We'll email them a link. They choose whether to accept, and nothing of
          yours is shared either way.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Their email address"
          aria-label="Their email address"
          className="sm:max-w-xs"
          data-testid="orchard-invite-email"
        />
        {/* The canonical Select owner, not a raw <select>. A room is a USE of
            the canonical component owners, never a fork of them (Blueprint
            § 5.2 — the component owners may not vary per domain). */}
        {communities.length > 0 && (
          <Select
            value={communityId === "" ? "tha" : String(communityId)}
            onValueChange={(v) => setCommunityId(v === "tha" ? "" : Number(v))}
          >
            <SelectTrigger
              className="sm:w-56"
              aria-label="Invite them to a neighbourhood"
              data-testid="orchard-invite-community"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tha">To The Healthy Apples</SelectItem>
              {communities.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>To {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="default"
          onClick={() => invite.mutate()}
          disabled={invite.isPending || email.trim().length === 0}
          data-testid="orchard-invite-send"
        >
          {invite.isPending ? "…" : "Send"}
        </Button>
      </div>

      {pending.length > 0 && (
        <ul className="space-y-2" data-testid="orchard-invitations-sent">
          {pending.map((i) => (
            <li key={i.id} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{i.invitedEmail}</span>
              <button
                type="button"
                onClick={() => withdraw.mutate(i.id)}
                className="underline underline-offset-4 text-muted-foreground"
                data-testid={`orchard-invite-withdraw-${i.id}`}
              >
                Withdraw
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The High Street — the shops the village can reach.
 *
 * REAL RETAILERS ONLY. These nine come from the registered `partners`
 * capability (`getBasketSupermarkets`) and are the same nine the Shopping room
 * already uses. The twelve "wellness partners" in client/src/data/partners.ts
 * are invented businesses on example.com; PROD2 withdrew that route under Core
 * Principle 6 and COMM2 does not reopen it. A health-adjacent product does not
 * recommend practitioners that do not exist, and a new room is not a loophole.
 *
 * THE HIGH STREET DOES NO SHOPPING. Shopping is owned by the Shopping room and
 * stays there — this is presence, not a second basket, and there is exactly one
 * door back to the owner. Duplicating the work here would give one job two
 * owners, which is the rule this whole workstream is bound by.
 */
function HighStreetView({
  retailers, isPending, isError, onRetry, onGoShopping,
}: {
  retailers: Retailer[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onGoShopping: () => void;
}) {
  if (isError) {
    return <LoadError what="the High Street" onRetry={onRetry} />;
  }

  return (
    <section className="space-y-6" data-testid="orchard-high-street">
      <header className="space-y-2">
        <h2 className="title-section">The High Street</h2>
        <p className="text-muted-foreground">
          The shops your household can order from.
        </p>
      </header>

      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="orchard-retailers">
          {retailers.map((r) => (
            <li
              key={r.key}
              className="flex items-center gap-3 rounded-[--radius-support] border border-border bg-card px-4 py-3"
            >
              <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm">{r.name}</span>
              {r.hasDirectBasket && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Sends your list straight through
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Shopping happens in the Shopping room, where your list already lives.
          The High Street only shows you which shops are on it.
        </p>
        {/* The High Street's one primary action — the door back to the owner. */}
        <Button variant="default" onClick={onGoShopping} data-testid="orchard-goto-shopping">
          Go to Shopping
        </Button>
      </div>
    </section>
  );
}
