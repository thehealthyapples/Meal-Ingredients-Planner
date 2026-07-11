# WX15 — Platform Regression Fixes

Sequential issue-by-issue fix log. Each issue has its own rollback identifier, change record, and verification.

---

## Architecture Compliance Pre-Check

- ✓ No duplicate logo assets (single `tha-apple.png`, single `logo-long.png`)
- ✓ No duplicate icon systems (one `AppleRating` component, one `ScoreBadge` wrapper)
- ✓ No duplicate workspace shell implementations (`WorkspaceHeader` is the single shell)
- ✓ Existing Platform Shell extended, not replaced
- ✓ Existing Analyser score logic (thaRating from upfAnalysis) is authoritative — untouched
- ✓ Auth/account logic fully investigated before any change
- ✓ No schema changes required
- ✓ No unrelated refactoring

All checks pass.

---

## Issue 1 — Analyser Apple Score

**ROLLBACK IDENTIFIER:** `wx15-issue1-before`

**Root cause identified:**
`AnalyserDetailV2.tsx` renders the main score block using `AppleRatingWithTooltip` with `sizePx={48}`, which stacks 1–5 apple images (e.g., score 3 shows three side-by-side apples). The requirement is a single THA apple + numeric score.

**Files changed:**
- `client/src/components/analyser/AnalyserDetailV2.tsx`

**Change:** Replace the multi-apple rating display in the THA score block with a single THA apple icon + "N / 5" text, wrapped in the same tooltip.

**Verification:**
- Analyser score block shows one apple image + numeric score
- Tooltip shows "THA Score: N/5 - Label"
- Score value and verdict text unchanged
- No layout regression

---

## Issue 2 — Mobile Top-Left Logo

**ROLLBACK IDENTIFIER:** `wx15-issue2-before`

**Root cause identified:**
`workspace-header.tsx` contextBar desktop layout shows `logo-long.png` at 68px height when `contextBar` is present. This layout triggers at `sm:` breakpoint (≥640px), which includes large phones in landscape orientation. On true mobile (<640px), the layout already uses `thaAppleSrc` at 28px (correct). The fix reduces the contextBar logo height and optionally shifts breakpoint.

**Files changed:**
- `client/src/components/workspace-header.tsx`

**Change:** Reduce contextBar desktop logo from `height: "68px"` to a more proportionate height. Mobile (`sm:hidden`) layout is already correct with small apple icon.

**Verification:**
- Mobile header shows small THA apple top-left
- Desktop header unchanged in character
- Logo does not push controls off screen

---

## Issue 3 — Hotmail Account Failure Investigation

**ROLLBACK IDENTIFIER:** `wx15-issue3-before` (no code change)

**HOTMAIL ROOT CAUSE:**
The account `colinclapson@hotmail.co.uk` (user ID 1) exists in the database with:
- `email_verified: true`
- `is_beta_user: true`
- `role: admin`
- Password: set (scrypt hash present, 161 chars)
- No active password reset token

**Login failure analysis:**
1. Account lookup uses `lower()` case-insensitive match — email case is not the issue
2. Email verification is not blocking login
3. Beta access is not blocking login
4. The only remaining failure mode is: **incorrect password**

**Why password recovery may be blocked:**
The THA SMTP server is `mail.privateemail.com`. Microsoft Outlook/Hotmail is known to aggressively filter or reject emails from independent SMTP providers. Password reset emails to `@hotmail.co.uk` addresses are likely being delivered to junk or silently rejected, making self-service recovery impossible.

**No code fix made.** Reason: resetting a user's password requires writing to the `password` field of the `users` table — this touches auth persistence and account ownership. The task states: "If the fix touches auth meaning, persistence, schema, or account ownership: STOP and report recommended options."

**Recommended options:**
1. **Direct database reset (operational, safest):** Run: `UPDATE users SET password = <new_hash> WHERE id = 1;` using the `hashPassword()` function output. No code changes needed.
2. **Admin API endpoint:** Add a server-only admin endpoint (behind `role === "admin"` guard) to set a password by user ID. Requires auth code change.
3. **SMTP provider diversification:** Add a Microsoft-compatible email relay (e.g., SendGrid, AWS SES with proper DKIM/SPF) for password reset emails to Hotmail/Outlook domains.

**No commit for Issue 3.**

---

## Issue 4 — Cookbook Mobile Banner Buttons

**ROLLBACK IDENTIFIER:** `wx15-issue4-before`

**Root cause identified:**
The Cookbook (`meals-page.tsx`) `contextBar` uses `hidden sm:flex` on its tab strip. WorkspaceHeader renders the contextBar in a `min-h-[40px]` row on mobile — but the inner div is CSS-hidden, showing an empty strip with no tabs. The `CreateMealDialog` button in `actions` shows only a `+` icon on mobile (text is `hidden sm:inline`). Result: mobile Cookbook banner shows one icon button with no tab navigation.

**Files changed:**
- `client/src/pages/meals-page.tsx`

**Change:** Remove `hidden sm:` from the Cookbook contextBar tab div so tabs are visible on mobile. Tabs are already horizontally scrollable (`overflow-x-auto no-scrollbar`).

**Verification:**
- Cookbook mobile shows tab strip (My Cookbook, Recipes, My Freezer, Packaged) scrollable
- Desktop Cookbook unchanged
- Buttons align with header and do not overflow
- Actions button (+) unchanged

---

## Issue 5 — Nutrition and Diary Workspace Shell

**ROLLBACK IDENTIFIER:** `wx15-issue5-before`

**Investigation result:**
Both pages already use `WorkspaceHeader`:
- `plant-diversity-page.tsx`: `realm="nutrition"` with contextBar tabs (Foods, Nutrients, Benefits, Suggestions) — tabs have no `hidden sm:` so they show on mobile ✓
- `food-diary-page.tsx`: `realm="diary"` with contextBar tabs (Daily Log, Progress) — also show on mobile ✓

CSS realm variables exist for both `[data-realm="nutrition"]` and `[data-realm="diary"]`.

**Verdict:** Both pages correctly use the Platform Workspace Shell. No code fix required for Issue 5.

**If the visual regression was real in an earlier state:** Both pages were likely brought into WorkspaceHeader in a previous commit (WX9.2 or similar) and are now correct.

**No commit for Issue 5.**

---

## Issue 6 — Shopping Icon and Colour Polish

**ROLLBACK IDENTIFIER:** `wx15-issue6-before`

**Root cause identified:**
WX14 (c3b9cc5) correctly replaced `ShoppingBasket` with `ShoppingCart` in `workspace-header.tsx` and applied teal (HSL 190) colours to the header basket icon. However, the `shopping-workspace-page.tsx` WorkspaceHeader still uses `realm="basket"` which maps to a brownish palette (HSL 26) — creating a visual mismatch where the banner background is brown but the basket icon is teal.

**Files changed:**
- `client/src/index.css` — add `[data-realm="shopping"]` with teal palette
- `client/src/components/workspace-header.tsx` — add `"shopping"` to `PageRealm` type
- `client/src/pages/shopping-workspace-page.tsx` — change `realm="basket"` → `realm="shopping"`

**Change:** Introduce a `shopping` realm that uses the teal identity (HSL 190) matching the nav sidebar Shopping item. The `basket` realm remains for basket/analyse-basket pages.

**Verification:**
- Shopping workspace header uses teal colour matching nav
- Left nav Shopping item and header icon match
- Badge count still displays
- `ShoppingCart` icon used throughout (already from WX14)

---

## Final Verification

**Build:** `npm run build`
**TypeCheck:** `npm run check` or `tsc`

**Manual verification targets:**
- Analyser: score shows single apple + number
- Mobile header: small apple top-left on all workspace pages
- Login flow for colinclapson@hotmail.co.uk: documented as password/email delivery issue
- Cookbook mobile: tabs visible and scrollable
- Nutrition: correct workspace header (already working)
- Diary: correct workspace header (already working)
- Shopping: teal banner, trolley icon, badge count

---

## Final Report (to be filled on completion)

**IMPLEMENTATION STATUS:** complete — build passes ✓

**ROLLBACK IDENTIFIERS:**
1. wx15-issue1-before
2. wx15-issue2-before
3. wx15-issue3-before (no code change)
4. wx15-issue4-before
5. wx15-issue5-before (no code change)
6. wx15-issue6-before

**COMMITS CREATED:**
1. 4a99a03 — feat(wx15-1): Analyser score — single THA apple + N/5 text replaces stacked apples
2. dd18222 — feat(wx15-2): Header breakpoint sm→md — compact logo on phones in landscape
3. n/a
4. d7de432 — feat(wx15-4): Cookbook contextBar tabs always visible — remove hidden sm:flex
5. n/a
6. ba5eac4 — feat(wx15-6): Shopping workspace — teal realm identity matching nav sidebar

**FILES CHANGED BY ISSUE:**
1. client/src/components/analyser/AnalyserDetailV2.tsx
2. client/src/components/workspace-header.tsx
3. n/a
4. client/src/pages/meals-page.tsx
5. n/a
6. client/src/index.css, client/src/components/workspace-header.tsx, client/src/pages/shopping-workspace-page.tsx

**DATA IMPACT:**
- Reads existing data: yes (auth investigation reads users table)
- Writes new data: no
- Changes meaning of existing data: no
- Requires backfill: no

**TRUST CHECK:**
- No fabricated icons
- No duplicate shells
- No unproven auth changes
- No unrelated refactoring
