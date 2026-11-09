# Companion Browser Food Query Review — 2026-11-04

## Scope and preflight
- Owning repo/area: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, site Companion (Apple) browser interaction.
- Risk: Amber, user-facing application behavior. User explicitly requested live food questions in the site. Questions were read/query-only; no proposed action was confirmed.
- Governing sources already read in this session: repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, and applicable Intelligence Platform / benchmark guidance listed in the prior admin review. Computer-use skill and its required guidance and confirmation rules were read for UI control.
- Branch/HEAD observed in prior preflight: `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`. Existing worktree changes were preserved.

## Browser activity and outcomes
Used a separate in-app browser tab to avoid changing the user's benchmark report tab. The site was signed in as the existing local user. Opened Apple assistant and submitted three user-requested food questions; this creates conversation/telemetry records in the local app.

1. **“What's in my pantry?”** Apple summarized shampoo, toilet roll, tissues, milk, frozen peas, olive oil, onions, and gala apples. The same response displayed many “Open” suggestions, including shampoo, sponges, foil, fabric conditioner, toilet roll, tissues, cleaning supplies, and kitchen items. It also surfaced a workflow proposing to remove four pantry items (shampoo, sponges/scourers, aluminium foil, fabric conditioner). No remove/confirm action was accepted.
2. **“What are some high-protein foods I could add to a vegetarian lunch?”** Apple suggested carbonara butter beans, lasagne, matambre a la pizza, and salmon fish cakes; its result cards also included fish pie and chicken stir-fry. This answer violates the vegetarian constraint, with meat/fish suggestions presented among the leading options. Treat as a clear relevance/constraint-following failure.
3. **“Can I make a simple vegetarian dinner with milk, frozen peas, onions, gala apples, and olive oil?”** Apple gave a plausible creamy pea/onion meal idea and sliced apples as a side. Its follow-on card suggested “easy omelet” and offered Add to Planner/Add to Shopping, despite eggs not appearing in the supplied ingredients. A “Add ‘easy omelet’ to your shopping list” proposal appeared. No action was accepted.

## Assessment
The Companion can answer a straightforward pantry-context question and generate a plausible combination from stated ingredients. However, its retrieval/recommendation layer did not preserve a simple vegetarian constraint in the second query and proposed a meal requiring an unstated ingredient in the third. The pantry answer also pairs its summary with a broad set of cleaning/household items and a removal workflow, which may be a context-carryover issue. The user should review the visible cards before acting. The site correctly presented changes as suggestions requiring confirmation; no household data was changed by this review.

## Checks and limitations
- Browser observations only; no source change and no tests run.
- The browser UI provided no source citations or nutrition provenance for the protein amounts. Those numeric values are therefore unverified.
- No live service, external provider, scheduled job, or configuration was touched. Local app conversation and observation records may have been created by submitting the questions.
- No authority conflict identified. Recommendation correctness is assessed against the user's literal constraints and the visible response.

## Files changed
- Investigation note and agent report only. Neither was staged or committed; the worktree contains pre-existing user changes and no commit authorization was given.
