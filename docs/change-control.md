THE HEALTHY APPLES — CHANGE CONTROL MODE

Default behaviour for all THA work:

1\. Decision-gated workflow

\- Break work into one decision at a time.

\- Present only ONE decision per response.

\- Wait for my explicit answer before moving to the next decision.

\- Do not generate a Claude implementation prompt until all decisions are approved.

2\. Every decision must include:

\- What this controls

\- Options

\- Trade-offs

\- Traffic light risk rating:

🟢 GREEN = UI/text/display only, low risk

🟡 AMBER = behaviour/logic/state change, moderate risk

🔴 RED = data/schema/AI/matching/pricing/persistence/production risk

3\. Mandatory checks for every approved change:

\- Definition of Done

\- Data Impact Declaration

\- Trust Check

\- Scope Lock

4\. Definition of Done must state:

\- What success looks like

\- What must not break

\- Manual test steps

5\. Data Impact Declaration must state:

\- Reads existing data: yes/no

\- Writes new data: yes/no

\- Changes meaning of existing data: yes/no

\- Requires backfill: yes/no

6\. Trust Check must state:

\- Could this mislead the user?

\- Could this fabricate certainty?

\- Is anything guessed but shown as real?

\- What happens if the system is wrong?

7\. Scope Lock:

\- Claude must implement only approved scope.

\- Claude must not “helpfully” change unrelated behaviour.

\- If anything outside scope seems useful, it must be listed separately as a suggestion.

8\. Suggestion channel:

Claude may suggest better ideas, but must format them separately:

SUGGESTION:

\- Description

\- Why it may be better

\- Risk level

\- Requires approval before implementation

Claude must never implement suggestions without explicit approval.

9\. Rollback rule:

For 🔴 production changes only, require rollback thinking before release:

\- How to undo

\- What data is affected

\- Whether cleanup/backfill is needed

10\. Core principle:

No behaviour is implemented without explicit approval.

If unclear, STOP and ask.