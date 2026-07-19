/**
 * test-comm1a-invitation-routes.ts (COMM1A)
 * ===========================================================================
 * ROUTE-LEVEL verification over real HTTP, with real sessions.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * COMM1 § 11.4 recorded, as an open follow-on: *"No route-level integration
 * test. The nine /api/community/* routes are asserted by source inspection
 * (session-resolved household, 404 parity), not by driving HTTP with two
 * authenticated sessions."* COMM2 did not close it either.
 *
 * COMM1A's brief requires runtime coverage of authenticated routes, so this
 * closes it for the invitation surface — and it closes it the way the gap was
 * described: **two real signed-in sessions, driven over the wire.**
 *
 * The class of defect only this can catch is the one where the SERVICE is
 * correct and the ROUTE is not: an endpoint that forgets its auth check, trusts
 * a household id from the body, leaks a token in a response, or returns a
 * different status for "not yours" than for "does not exist".
 *
 * HOW IT RUNS
 * -----------
 * It boots its own server on its own port with ENABLE_REGISTRATION=true, so the
 * end-to-end signup path is genuinely exercised rather than simulated. It does
 * not touch a server you already have running, and it cleans up after itself.
 *
 * Run with: npm run test:comm1a-invitation-routes
 */

import { spawn, type ChildProcess } from "node:child_process";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

const PORT = Number(process.env.COMM1A_TEST_PORT ?? 5199);
const BASE = `http://127.0.0.1:${PORT}`;
const MARK = "comm1a-routes";
const stamp = process.pid;

let pass = 0, fail = 0;
const ok = (c: boolean, l: string, d?: unknown) => {
  if (c) { console.log(`  ✓ ${l}`); pass++; }
  else { console.log(`  ✗ ${l}${d !== undefined ? ` — ${JSON.stringify(d)}` : ""}`); fail++; }
};

/** A session is a cookie jar. Two of these is the whole point of this file. */
class Session {
  private cookie = "";
  constructor(readonly label: string) {}

  async request(method: string, path: string, body?: unknown) {
    // A freshly-booted child accepts connections slightly before it is ready to
    // serve them, and the first request occasionally came back ECONNRESET —
    // which failed the whole file for a reason that had nothing to do with the
    // routes. Retried a few times on CONNECTION errors only; an HTTP status of
    // any kind is a real answer and is never retried, because retrying a 401 or
    // a 429 would hide exactly what this suite exists to assert.
    let res: Response | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        res = await fetch(`${BASE}${path}`, {
          method,
          headers: {
            "content-type": "application/json",
            ...(this.cookie ? { cookie: this.cookie } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          redirect: "manual",
        });
        break;
      } catch (e) {
        lastErr = e;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    if (!res) throw lastErr;
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* html or empty */ }
    return { status: res.status, json, text };
  }
}

async function waitForServer(child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`test server exited early (${child.exitCode})`);
    try {
      // TWO consecutive successes. One is not enough: the server answers
      // /api/version during boot and can still reset the next connection.
      const a = await fetch(`${BASE}/api/version`);
      if (a.ok) {
        await new Promise(r => setTimeout(r, 750));
        const b = await fetch(`${BASE}/api/version`);
        if (b.ok) { await new Promise(r => setTimeout(r, 500)); return; }
      }
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error("test server did not start within 120s");
}

async function main() {
  const emailA = `${MARK}-a-${stamp}@invalid.test`;
  const emailB = `${MARK}-b-${stamp}@invalid.test`;
  const emailC = `${MARK}-c-${stamp}@invalid.test`;
  const PASSWORD = "comm1a-test-password";

  const child = spawn("npx", ["tsx", "server/index.ts"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      ENABLE_REGISTRATION: "true",
      NODE_ENV: "development",
      // SMTP is deliberately left unconfigured: `send()` fails soft, so the
      // route must still succeed and report `delivered: false` honestly.
      SMTP_USER: "", SMTP_PASS: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", () => {});
  child.stderr?.on("data", () => {});

  try {
    await waitForServer(child);
    console.log(`\n  test server up on ${PORT}\n`);

    // TRUST1-S5's auth rate limiter is a SHARED, IP-KEYED counter in Postgres,
    // and this file registers and logs in several times from one address — so a
    // second run inside the same window is refused with 429 before a single
    // assertion is meaningful. That happened, and the first symptom was ten
    // failures that looked like broken routes.
    //
    // The counters are transient rows with an expiry, so the fixture clears
    // them rather than the test disabling a security control or the limiter
    // gaining a test-only bypass. What is asserted below is the invitation
    // surface; the rate limiter has its own suite and keeps its own behaviour.
    await db.execute(sql`DELETE FROM auth_rate_limits`);

    // ── 1. Auth is required ────────────────────────────────────────────────
    console.log("1. Every route except the public preview requires a session");
    const anon = new Session("anonymous");
    for (const [method, path] of [
      ["POST", "/api/invitations"],
      ["GET", "/api/invitations"],
      ["DELETE", "/api/invitations/1"],
      ["POST", "/api/invitations/whatever/accept"],
      ["GET", "/api/referrals/summary"],
    ] as const) {
      const r = await anon.request(method, path, method === "POST" ? {} : undefined);
      ok(r.status === 401, `${method} ${path} → 401 without a session`, r.status);
    }

    // ── 2. Registration ────────────────────────────────────────────────────
    console.log("\n2. Two households register");
    const A = new Session("A");
    const regA = await A.request("POST", "/api/register", {
      username: emailA, password: PASSWORD, acceptedAgreements: true,
    });
    ok(regA.status === 201, "household A registers", regA.status);

    // Verify + log in. Verification is required to log in only in production,
    // but we mark it directly so the referral-verification path is exercised.
    await db.execute(sql`UPDATE users SET email_verified = true WHERE username = ${emailA}`);
    const loginA = await A.request("POST", "/api/login", { username: emailA, password: PASSWORD });
    ok(loginA.status === 200, "and signs in", loginA.status);

    // ── 3. Creating an invitation ──────────────────────────────────────────
    console.log("\n3. A invites an address that has no account");
    const created = await A.request("POST", "/api/invitations", { email: emailB });
    ok(created.status === 201, "the invitation is created", created.status);
    ok(created.json?.delivered === false,
       "and reports delivered:false honestly, because SMTP is unconfigured here — the route does not pretend a link went out",
       created.json);

    ok(!JSON.stringify(created.json ?? {}).match(/[A-Za-z0-9_-]{40,}/),
       "⚠️ NO TOKEN IN THE RESPONSE — the link exists only in the email", created.json);
    ok(created.json?.invitedEmail === emailB, "it echoes the address the caller typed");

    const listed = await A.request("GET", "/api/invitations");
    ok(listed.status === 200 && Array.isArray(listed.json), "the sender can list their invitations");
    ok(!JSON.stringify(listed.json).match(/[A-Za-z0-9_-]{40,}/),
       "⚠️ AND NO TOKEN IN THE LIST EITHER");

    // The token is read from the database — the only place it exists.
    const tokenRow = await db.execute<{ token: string; id: number }>(sql`
      SELECT token, id FROM household_invitations WHERE invited_email = ${emailB}`);
    const token = tokenRow.rows[0]?.token;
    ok(!!token, "the token exists in the database");

    // ── 4. The public preview ──────────────────────────────────────────────
    console.log("\n4. The public preview — the only route a stranger may call");
    const preview = await anon.request("GET", `/api/invitations/${token}/preview`);
    ok(preview.status === 200, "an unauthenticated stranger may preview a link they hold", preview.status);
    ok(preview.json?.invitedEmailMasked?.includes("•"), "the address is masked", preview.json?.invitedEmailMasked);
    ok(!JSON.stringify(preview.json).includes(emailB),
       "⚠️ the full address is NOT disclosed to whoever holds the link");

    const badPreview = await anon.request("GET", `/api/invitations/definitely-not-a-token/preview`);
    ok(badPreview.status === 404, "an unknown token → 404", badPreview.status);

    // ── 5. Enumeration parity ──────────────────────────────────────────────
    console.log("\n5. 'Not yours' and 'does not exist' answer alike");
    const C = new Session("C");
    await C.request("POST", "/api/register", { username: emailC, password: PASSWORD, acceptedAgreements: true });
    await db.execute(sql`UPDATE users SET email_verified = true WHERE username = ${emailC}`);
    await C.request("POST", "/api/login", { username: emailC, password: PASSWORD });

    const revokeNotMine = await C.request("DELETE", `/api/invitations/${tokenRow.rows[0].id}`);
    const revokeMissing = await C.request("DELETE", `/api/invitations/999999999`);
    ok(revokeNotMine.status === revokeMissing.status && revokeNotMine.status === 403,
       "revoking someone else's invitation and revoking one that does not exist return the SAME status",
       [revokeNotMine.status, revokeMissing.status]);
    ok(JSON.stringify(revokeNotMine.json) === JSON.stringify(revokeMissing.json),
       "and byte-identical bodies — the surface cannot be used to enumerate invitations",
       [revokeNotMine.json, revokeMissing.json]);

    // ── 6. Acceptance by the wrong recipient, over HTTP ────────────────────
    console.log("\n6. A forwarded link is inert over the wire too");
    const cSteals = await C.request("POST", `/api/invitations/${token}/accept`);
    ok(cSteals.status === 403,
       "⚠️ a signed-in household whose address is not the invited one CANNOT accept", cSteals.status);

    const stillLive = await anon.request("GET", `/api/invitations/${token}/preview`);
    ok(stillLive.status === 200, "and the failed attempt did not consume the invitation");

    // ── 7. Signup completes the invitation ─────────────────────────────────
    console.log("\n7. A new user signs up through the link and the referral is attributed");
    const B = new Session("B");
    const regB = await B.request("POST", "/api/register", {
      username: emailB, password: PASSWORD, acceptedAgreements: true, invitationToken: token,
    });
    ok(regB.status === 201, "the invited stranger registers, passing the token", regB.status);

    const spent = await db.execute<{ status: string; accepted_by_household_id: number | null }>(sql`
      SELECT status, accepted_by_household_id FROM household_invitations WHERE id = ${tokenRow.rows[0].id}`);
    ok(spent.rows[0].status === "accepted",
       "⚠️ THE INVITATION WAS CONSUMED BY SIGNUP — it survived the round-trip from email to account", spent.rows[0]);
    ok(spent.rows[0].accepted_by_household_id !== null, "and records which household spent it");

    const attribution = await db.execute<{ status: string; referrer_household_id: number }>(sql`
      SELECT ra.status, ra.referrer_household_id FROM referral_attributions ra
      JOIN household_members hm ON hm.household_id = ra.referred_household_id
      JOIN users u ON u.id = hm.user_id WHERE u.username = ${emailB}`);
    ok(attribution.rows.length === 1, "a referral was attributed", attribution.rows);
    ok(attribution.rows[0]?.status === "recorded",
       "⚠️ AT `recorded`, NOT `verified` — the address has not been proven yet, and no reward may be computed from a claim",
       attribution.rows[0]?.status);

    const summaryA = await A.request("GET", "/api/referrals/summary");
    ok(summaryA.status === 200 && summaryA.json?.recorded === 1, "the referrer's summary shows it", summaryA.json);
    ok(!JSON.stringify(summaryA.json).match(/\d{3,}/),
       "⚠️ the summary is counts only — it contains no household id", summaryA.json);

    // ── 8. Verification promotes the referral ──────────────────────────────
    console.log("\n8. Email verification promotes recorded → verified");
    const verifyRow = await db.execute<{ email_verification_token: string }>(sql`
      SELECT email_verification_token FROM users WHERE username = ${emailB}`);
    const verifyToken = verifyRow.rows[0]?.email_verification_token;
    ok(!!verifyToken, "a verification token was issued at registration");

    await anon.request("GET", `/api/verify-email?token=${verifyToken}`);
    // The promotion is fire-and-forget, so allow it a moment to land.
    await new Promise(r => setTimeout(r, 1500));

    const afterVerify = await db.execute<{ status: string; verified_at: string | null }>(sql`
      SELECT ra.status, ra.verified_at FROM referral_attributions ra
      JOIN household_members hm ON hm.household_id = ra.referred_household_id
      JOIN users u ON u.id = hm.user_id WHERE u.username = ${emailB}`);
    ok(afterVerify.rows[0]?.status === "verified",
       "⚠️ VERIFYING THE ADDRESS PROMOTES THE REFERRAL — this is what makes the attribution *verified* rather than claimed",
       afterVerify.rows[0]);
    ok(afterVerify.rows[0]?.verified_at !== null, "and stamps when");

    // ── 9. No reward, anywhere ─────────────────────────────────────────────
    console.log("\n9. No commercial figure is reachable");
    const summaryAfter = await A.request("GET", "/api/referrals/summary");
    const body = JSON.stringify(summaryAfter.json ?? {}).toLowerCase();
    for (const forbidden of ["discount", "percent", "%", "price", "amount", "reward", "off"]) {
      ok(!body.includes(forbidden),
         `the referral summary contains no \`${forbidden}\` — Rule C3 forbids a commercial claim without configured pricing`);
    }
    const eligibleCount = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*)::text AS n FROM referral_attributions WHERE status IN ('eligible','entitlement_processed')`);
    ok(eligibleCount.rows[0].n === "0",
       "⚠️ NO REFERRAL ANYWHERE IN THE DATABASE HAS REACHED `eligible` — nothing in COMM1A can promote one, by design",
       eligibleCount.rows[0].n);

    // ── 10. Replay over HTTP ───────────────────────────────────────────────
    console.log("\n10. The spent token is dead");
    ok((await anon.request("GET", `/api/invitations/${token}/preview`)).status === 404,
       "a spent token no longer previews");
    const bReplay = await B.request("POST", "/api/login", { username: emailB, password: PASSWORD });
    if (bReplay.status === 200) {
      const replay = await B.request("POST", `/api/invitations/${token}/accept`);
      ok(replay.status === 403, "and cannot be accepted again", replay.status);
    } else {
      ok(false, "B could not sign in to attempt a replay", bReplay.status);
    }
  } finally {
    // WAIT FOR THE CHILD TO ACTUALLY EXIT before returning.
    //
    // Not doing so made this suite flaky in exactly the way flaky suites are
    // worst: run alone it passed, run back-to-back the port was still held by
    // the previous child and the whole file produced NO output — which reads
    // like a crash, not like a port collision. A test that fails for a reason
    // unrelated to the code under test teaches people to ignore it.
    await new Promise<void>((resolve) => {
      if (child.exitCode !== null) return resolve();
      const done = () => resolve();
      child.once("exit", done);
      child.kill("SIGTERM");
      setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 8000);
    });
    // Teardown, scoped to this run's fixtures only.
    for (const email of [emailA, emailB, emailC]) {
      const u = await db.execute<{ id: number }>(sql`SELECT id FROM users WHERE username = ${email}`);
      const userId = u.rows[0]?.id;
      if (!userId) continue;
      const h = await db.execute<{ household_id: number }>(sql`
        SELECT household_id FROM household_members WHERE user_id = ${userId}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
      for (const row of h.rows) {
        await db.execute(sql`DELETE FROM households WHERE id = ${row.household_id}`);
      }
    }
    await db.execute(sql`DELETE FROM household_invitations WHERE invited_email LIKE ${`%${MARK}%`}`);
    const left = await db.execute<{ n: string }>(sql`
      SELECT COUNT(*)::text AS n FROM users WHERE username LIKE ${`%${MARK}%`}`);
    console.log(`\n  fixture users remaining: ${left.rows[0].n} (must be 0)`);
    if (left.rows[0].n !== "0") fail++;
  }

  console.log("\n────────────────────────────────────────────────────────────");
  console.log(`COMM1A routes: ${pass} passed, ${fail} failed`);
  console.log("Two sessions, one link, over the wire.");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
