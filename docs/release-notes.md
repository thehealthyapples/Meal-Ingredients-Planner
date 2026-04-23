# Production Release Rules — The Healthy Apples

Never deploy code that expects new data without upgrading old production data.

If a change touches shopping list, planner, pantry, AI matching, product matching, pricing, required fields, schema, or how existing data is interpreted, assume production data may need reconciliation.

A release is not done when code deploys.
A release is done when production behaviour is verified.

---

## Mandatory Release Checklist

1. Run pre-deploy checks:
   - git status
   - npm run build

2. Classify the release:
   - code-only
   - schema-change
   - data-shape-change
   - shopping-list-change
   - planner-change
   - pantry/knowledge-change
   - AI/matching/pricing-change
   - unknown-risk

3. If release touches data, schema, shopping list, planner, pantry, AI matching, product matching, pricing, or required fields:
   - mark BACKFILL REQUIRED: YES
   - run the relevant production backfill
   - for shopping list/item resolution run:
     ```
     DATABASE_URL="<prod>" npx tsx server/scripts/backfill-item-resolution.ts
     ```

4. Deploy:
   - git push origin main
   - Render Manual Deploy
   - Clear build cache & deploy

5. Verify Render logs:
   - confirm `[Migrations] Schema at head: <latest>`

6. Run production verification:
   ```
   DATABASE_URL="<prod>" npx tsx scripts/verify-prod.ts
   ```

7. Manually test production:
   - Planner: 6 weeks visible and can add meal
   - Shopping list: manual item and planner item both work
   - Ambiguous items: fruit and berries trigger chooser/review
   - Apples rule: apples always shows 5 apples
   - Pantry opens without duplicate/missing data issues
   - Basket/pricing does not show fake matches or fake prices

8. Check production logs.

9. Only mark release complete when:
   - deploy succeeded
   - migrations are at head
   - required backfills ran
   - verify script passed
   - manual tests passed
   - logs are clean

---

## Release Report

At the end of every deployment, output this report in full. If any field is missing or unclear, the release is NOT complete.

```
RELEASE STATUS: success / blocked / rolled back

RELEASE TYPE:
BACKFILL REQUIRED:
BACKFILL RUN:
MIGRATIONS AT HEAD: yes/no
VERIFY SCRIPT: pass/fail

MANUAL TESTS:
- planner:
- shopping list:
- ambiguous items:
- apples rule:
- pantry:
- basket/pricing:

LOG CHECK:
- errors found: yes/no
- details:

FILES/COMMITS DEPLOYED:
```

---

## Stop Conditions

If any of these happen, stop immediately and fix or rollback:
- 500 error
- empty planner weeks
- chooser/review missing
- fake product matches
- missing data
- failed verify script
- migration not at head
- unexpected runtime errors
