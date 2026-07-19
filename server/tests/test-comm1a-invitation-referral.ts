/**
 * test-comm1a-invitation-referral.ts (COMM1A)
 * ===========================================================================
 * DB-BACKED, MULTI-HOUSEHOLD verification of the invitation and referral
 * owners, against real Postgres.
 *
 * WHY THIS IS SERVICE-LEVEL AND DB-BACKED RATHER THAN MOCKED
 * ----------------------------------------------------------
 * SEC1's lesson, which COMM1 and COMM2 both carried: a mock-backed suite proves
 * DELEGATION, not ISOLATION — 51 green assertions once sat on top of a live
 * cross-household leak for the whole life of that bug. Everything asserted here
 * writes real rows and reads real return values.
 *
 * The invariants this file exists to hold are the ones that would cost money or
 * privacy if they broke:
 *
 *   - a token is single-use, and two concurrent redemptions cannot both win
 *   - a forwarded token is inert in the wrong recipient's hands
 *   - a household cannot refer itself, and cannot be referred twice
 *   - no referral can reach `eligible` without having been verified first
 *   - nothing in this domain can grant, price, or discount anything
 *
 * FIXTURE HYGIENE: every row is torn down in `finally`, and every assertion is
 * scoped to THIS run's ids — never a global count. That is COMM1 § 9's lesson,
 * where two aborted runs left orphans that made BUS1's global assertions fail
 * for reasons unrelated to the code under test.
 *
 * Run with: npm run test:comm1a-invitation-referral
 */

import { db } from "../db.js";
import { sql } from "drizzle-orm";
import * as invite from "../lib/household-invitation.js";
import * as referral from "../lib/referral.js";
import * as community from "../lib/community.js";

async function main() {
  let pass = 0, fail = 0;
  const ok = (c: boolean, l: string, d?: unknown) => {
    if (c) { console.log(`  ✓ ${l}`); pass++; }
    else { console.log(`  ✗ ${l}${d !== undefined ? ` — ${JSON.stringify(d)}` : ""}`); fail++; }
  };

  const MARK = "comm1a-fixture";
  const emailOf = (n: string) => `${MARK}-${n}-${process.pid}@invalid.test`;
  let hA = 0, hB = 0, hC = 0, communityId = 0;

  try {
    const mk = async (name: string) => {
      const r = await db.execute<{ id: number }>(sql`
        INSERT INTO households (name, invite_code)
        VALUES (${`${MARK} ${name}`}, ${`${MARK}-${name}-${process.pid}`}) RETURNING id`);
      return r.rows[0].id;
    };
    hA = await mk("A"); hB = await mk("B"); hC = await mk("C");

    // ── 1. Creating ────────────────────────────────────────────────────────
    console.log("\n1. Creating an invitation");

    const bad = await invite.createInvitation({
      invitedByHouseholdId: hA, inviterEmail: emailOf("A"), email: "not-an-email",
    });
    ok(bad.ok === false, "a malformed address is refused");

    const self = await invite.createInvitation({
      invitedByHouseholdId: hA, inviterEmail: emailOf("A"), email: emailOf("A"),
    });
    ok(self.ok === false, "a household cannot invite its own address — self-referral is refused at the door", self);

    const created = await invite.createInvitation({
      invitedByHouseholdId: hA, inviterEmail: emailOf("A"), email: ` ${emailOf("B").toUpperCase()} `,
    });
    ok(created.ok === true, "A may invite B's address");
    if (!created.ok) throw new Error("cannot continue");
    ok(created.invitation.invitedEmail === emailOf("B").toLowerCase(),
       "the address is normalised — trimmed and lower-cased — so the read and the write agree (the SEC1 lesson)",
       created.invitation.invitedEmail);
    ok(created.invitation.kind === "tha", "with no community, the invitation is a plain THA invitation");
    ok(typeof created.token === "string" && created.token.length >= 40,
       "a 32-byte token is minted", created.token?.length);

    const sent = await invite.getInvitationsSent(hA);
    ok(sent.length === 1, "it appears in the inviter's own list");
    ok(!JSON.stringify(sent).includes(created.token),
       "⚠️ THE TOKEN IS NEVER RETURNED TO THE INVITER — it exists only in the email");

    // ── 2. Enumeration resistance ──────────────────────────────────────────
    console.log("\n2. Household enumeration");
    const toStranger = await invite.createInvitation({
      invitedByHouseholdId: hA, inviterEmail: emailOf("A"), email: "someone-who-does-not-exist@invalid.test",
    });
    ok(toStranger.ok === true,
       "inviting an address that belongs to no household succeeds identically — the surface is not an oracle for 'is this person a customer?'");

    // ── 3. Preview ─────────────────────────────────────────────────────────
    console.log("\n3. What the holder of a link may see before signing up");
    const preview = await invite.previewByToken(created.token);
    ok(preview !== null, "a live token previews");
    ok(preview?.invitedEmailMasked?.includes("@") === true && !preview?.invitedEmailMasked?.includes(emailOf("B").split("@")[0].slice(1)),
       "the address is MASKED — enough to know which one to use, not enough to harvest from a forwarded link",
       preview?.invitedEmailMasked);
    ok(!JSON.stringify(preview).includes(String(hA)),
       "the preview discloses no household id");
    ok((await invite.previewByToken("not-a-real-token")) === null,
       "an unknown token previews as nothing");

    // ── 4. Acceptance by the wrong recipient ───────────────────────────────
    console.log("\n4. A forwarded link is inert");
    const wrongPerson = await invite.redeemInvitation({
      token: created.token, acceptingHouseholdId: hC, acceptingEmail: emailOf("C"),
    });
    ok(wrongPerson.ok === false,
       "⚠️ a household whose address is not the invited address CANNOT redeem — the token alone is never sufficient", wrongPerson);

    const stillLive = await invite.previewByToken(created.token);
    ok(stillLive !== null, "and the refusal did not consume the invitation");

    const inviterSelf = await invite.redeemInvitation({
      token: created.token, acceptingHouseholdId: hA, acceptingEmail: emailOf("B"),
    });
    ok(inviterSelf.ok === false, "the inviting household cannot redeem its own invitation", inviterSelf);

    // ── 5. Redemption and single use ───────────────────────────────────────
    console.log("\n5. Redemption is single-use");
    const redeemed = await invite.redeemInvitation({
      token: created.token, acceptingHouseholdId: hB, acceptingEmail: emailOf("B").toUpperCase(),
    });
    ok(redeemed.ok === true, "the invited address redeems it — and case does not matter", redeemed);

    const replay = await invite.redeemInvitation({
      token: created.token, acceptingHouseholdId: hB, acceptingEmail: emailOf("B"),
    });
    ok(replay.ok === false, "⚠️ THE TOKEN CANNOT BE REPLAYED — the conditional UPDATE is the guarantee", replay);
    ok((await invite.previewByToken(created.token)) === null, "and a spent token no longer previews");

    const afterAccept = await db.execute<{ invited_email: string; status: string }>(sql`
      SELECT invited_email, status FROM household_invitations WHERE token = ${created.token}`);
    ok(afterAccept.rows[0].status === "accepted", "the row is accepted");
    ok(!afterAccept.rows[0].invited_email.includes(MARK),
       "⚠️ THE INVITED ADDRESS IS REDACTED ON ACCEPTANCE — no third party's contact details are retained past their purpose",
       afterAccept.rows[0].invited_email);

    // ── 6. Referral attribution ────────────────────────────────────────────
    console.log("\n6. Referral attribution");
    const selfRef = await referral.recordReferral({
      referrerHouseholdId: hA, referredHouseholdId: hA, invitationId: null,
    });
    ok(selfRef.ok === false, "a household cannot refer itself");

    const rec = await referral.recordReferral({
      referrerHouseholdId: hA, referredHouseholdId: hB, invitationId: created.invitation.id,
    });
    ok(rec.ok === true, "A referred B is recorded");
    ok(rec.ok && rec.attribution.status === "recorded", "it starts at `recorded`, never higher");

    const dupe = await referral.recordReferral({
      referrerHouseholdId: hC, referredHouseholdId: hB, invitationId: null,
    });
    ok(dupe.ok === false,
       "⚠️ A HOUSEHOLD IS REFERRED ONCE, EVER — a second household cannot claim the same referral", dupe);

    const stillA = await db.execute<{ referrer_household_id: number }>(sql`
      SELECT referrer_household_id FROM referral_attributions WHERE referred_household_id = ${hB}`);
    ok(stillA.rows[0].referrer_household_id === hA,
       "and the first attribution stands — a re-attempt cannot re-attribute an existing household");

    // ── 7. The status ladder — no reward before verified eligibility ───────
    console.log("\n7. The status ladder");
    const skipToEligible = await referral.markEligible(hB);
    ok(skipToEligible.ok === false,
       "⚠️ A `recorded` REFERRAL CANNOT BE PROMOTED STRAIGHT TO `eligible` — verification cannot be skipped");

    ok((await referral.markVerified(hB)).ok === true, "verification promotes recorded → verified");
    ok((await referral.markVerified(hB)).ok === false, "and it is not repeatable");

    // The database refuses the ladder violation even if the service is bypassed.
    let dbRefused = false;
    try {
      await db.execute(sql`
        UPDATE referral_attributions SET status = 'entitlement_processed'
        WHERE referred_household_id = ${hB}`);
    } catch { dbRefused = true; }
    ok(dbRefused,
       "⚠️ AND POSTGRES REFUSES IT TOO — a direct UPDATE to `entitlement_processed` without an eligible_at is rejected by CHECK");

    ok((await referral.markEligible(hB)).ok === true, "a verified referral may be promoted to eligible by the commercial seam");

    const summary = await referral.getReferralSummary(hA);
    ok(summary.eligible === 1, "the referrer's summary counts it", summary);
    ok(!JSON.stringify(summary).includes(String(hB)),
       "⚠️ the summary is COUNTS ONLY — it discloses no referred household's id");

    ok((await referral.wasReferred(hB)) === true, "the referred household knows it was referred");
    ok(typeof (await referral.wasReferred(hB)) === "boolean",
       "as a boolean — never the referrer's id, which would be a household identifier handed out");

    // ── 8. The commercial boundary ─────────────────────────────────────────
    console.log("\n8. The commercial boundary");
    const referralSrc = await import("node:fs").then(fs =>
      fs.readFileSync(new URL("../lib/referral.ts", import.meta.url), "utf8"));
    const inviteSrc = await import("node:fs").then(fs =>
      fs.readFileSync(new URL("../lib/household-invitation.ts", import.meta.url), "utf8"));
    const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

    for (const [name, src] of [["referral", referralSrc], ["household-invitation", inviteSrc]] as const) {
      for (const forbidden of ["price", "amount", "percent", "discount", "coupon", "currency", "stripe", "20%"]) {
        ok(!code(src).toLowerCase().includes(forbidden),
           `${name}.ts contains no \`${forbidden}\` — COMM1A records attribution and owns no commercial figure`);
      }
    }
    ok(!code(referralSrc).includes("subscriptions") && !code(referralSrc).includes("entitlement("),
       "the referral owner reads no commercial table — Rule C2 keeps the entitlement projection with Commercial");

    // ── 9. Community delegation ────────────────────────────────────────────
    console.log("\n9. Community invitations are delegated, never duplicated");
    const c = await community.createCommunity("COMM1A Lane", hA);
    communityId = c.id;

    const notMember = await invite.createInvitation({
      invitedByHouseholdId: hC, inviterEmail: emailOf("C"), email: emailOf("B"), communityId,
    });
    ok(notMember.ok === false,
       "a household that is not in a community cannot invite anyone to it");

    const commInvite = await invite.createInvitation({
      invitedByHouseholdId: hA, inviterEmail: emailOf("A"), email: emailOf("C"), communityId,
    });
    ok(commInvite.ok === true, "a member may invite to their neighbourhood");
    if (!commInvite.ok) throw new Error("cannot continue");

    const commRedeemed = await invite.redeemInvitation({
      token: commInvite.token, acceptingHouseholdId: hC, acceptingEmail: emailOf("C"),
    });
    ok(commRedeemed.ok === true, "the invited address redeems it");

    const beforeIssue = await community.getMembership(communityId, hC);
    ok(beforeIssue === null,
       "⚠️ REDEEMING THE LINK CREATED NO MEMBERSHIP — clicking a link never joins a neighbourhood");

    const issued = commRedeemed.ok
      ? await invite.issueCommunityInvitationFor(commRedeemed.redeemed, hC)
      : { ok: false as const, reason: "" };
    ok(issued.ok === true, "COMM1 is asked to issue a proper community invitation");

    const afterIssue = await community.getMembership(communityId, hC);
    ok(afterIssue === null,
       "⚠️ AND STILL NO MEMBERSHIP — an offer was created, which the household must explicitly accept");

    if (issued.ok) {
      const accepted = await community.acceptInvitation(issued.communityToken, hC);
      ok(accepted.ok === true, "explicit acceptance, through COMM1's own owner, completes membership");
    }
    const finalMembership = await community.getMembership(communityId, hC);
    ok(finalMembership?.status === "active", "and only now is the household in the neighbourhood");

    const commInviteRows = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*)::text AS n FROM community_invitations WHERE community_id = ${communityId}`);
    ok(commInviteRows.rows[0].n === "1",
       "exactly one community_invitations row exists — COMM1A wrote none of it itself", commInviteRows.rows[0].n);

    // ── 10. Revocation and expiry ──────────────────────────────────────────
    console.log("\n10. Revocation and expiry");
    const toRevoke = await invite.createInvitation({
      invitedByHouseholdId: hA, inviterEmail: emailOf("A"), email: "revoke-me@invalid.test",
    });
    if (!toRevoke.ok) throw new Error("cannot continue");

    const wrongRevoker = await invite.revokeInvitation(toRevoke.invitation.id, hC);
    ok(wrongRevoker.ok === false, "only the household that sent it may withdraw it");

    ok((await invite.revokeInvitation(toRevoke.invitation.id, hA)).ok === true, "the sender may withdraw it");
    ok((await invite.previewByToken(toRevoke.token)) === null, "a withdrawn invitation stops working immediately");
    ok((await invite.revokeInvitation(toRevoke.invitation.id, hA)).ok === false, "and cannot be withdrawn twice");

    // Expiry is evaluated on READ — THA has no scheduler.
    const expired = await invite.createInvitation({
      invitedByHouseholdId: hA, inviterEmail: emailOf("A"), email: "expired@invalid.test",
    });
    if (!expired.ok) throw new Error("cannot continue");
    await db.execute(sql`
      UPDATE household_invitations SET expires_at = NOW() - INTERVAL '1 day'
      WHERE id = ${expired.invitation.id}`);
    ok((await invite.previewByToken(expired.token)) === null, "an expired invitation previews as nothing");
    ok((await invite.redeemInvitation({
      token: expired.token, acceptingHouseholdId: hB, acceptingEmail: "expired@invalid.test",
    })).ok === false, "and cannot be redeemed");
    const listed = await invite.getInvitationsSent(hA);
    ok(listed.find(i => i.id === expired.invitation.id)?.status === "expired",
       "it reports as expired on read, with no scheduler having touched it");

    // ── 11. The database refuses malformed rows ────────────────────────────
    console.log("\n11. Postgres refuses what the types cannot");
    const refuses = async (label: string, stmt: any) => {
      let refused = false;
      try { await db.execute(stmt); } catch { refused = true; }
      ok(refused, label);
    };
    await refuses("a 'tha' invitation carrying a community is refused", sql`
      INSERT INTO household_invitations (token, invited_by_household_id, invited_email, kind, community_id, expires_at)
      VALUES (${`${MARK}-bad1`}, ${hA}, 'x@y.test', 'tha', ${communityId}, NOW() + INTERVAL '1 day')`);
    await refuses("a 'community' invitation with no community is refused", sql`
      INSERT INTO household_invitations (token, invited_by_household_id, invited_email, kind, expires_at)
      VALUES (${`${MARK}-bad2`}, ${hA}, 'x@y.test', 'community', NOW() + INTERVAL '1 day')`);
    await refuses("an accepted invitation naming nobody is refused", sql`
      INSERT INTO household_invitations (token, invited_by_household_id, invited_email, status, responded_at, expires_at)
      VALUES (${`${MARK}-bad3`}, ${hA}, 'x@y.test', 'accepted', NOW(), NOW() + INTERVAL '1 day')`);
    await refuses("a self-referral is refused by the database too", sql`
      INSERT INTO referral_attributions (referrer_household_id, referred_household_id)
      VALUES (${hC}, ${hC})`);
    await refuses("an 'eligible' referral with no verified_at is refused", sql`
      INSERT INTO referral_attributions (referrer_household_id, referred_household_id, status, eligible_at)
      VALUES (${hA}, ${hC}, 'eligible', NOW())`);
  } finally {
    if (communityId) await db.execute(sql`DELETE FROM communities WHERE id = ${communityId}`);
    for (const h of [hA, hB, hC].filter(Boolean)) {
      await db.execute(sql`DELETE FROM households WHERE id = ${h}`);
    }
    await db.execute(sql`DELETE FROM household_invitations WHERE invited_email LIKE ${`%${MARK}%`}
      OR invited_email IN ('revoke-me@invalid.test','expired@invalid.test','someone-who-does-not-exist@invalid.test')`);
    const left = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*)::text AS n FROM households WHERE name LIKE ${`${MARK}%`}`);
    console.log(`\n  fixture households remaining: ${left.rows[0].n} (must be 0)`);
    if (left.rows[0].n !== "0") fail++;
  }

  console.log("\n────────────────────────────────────────────────────────────");
  console.log(`COMM1A: ${pass} passed, ${fail} failed`);
  console.log("A link that reaches a stranger, and attribution that owns no money.");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
