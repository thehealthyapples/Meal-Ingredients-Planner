---
name: INT26 Capability count rule
description: Every new capability binding requires updating hardcoded live-count assertions across multiple test files; a grep pattern to find them all.
---

# Capability count update rule

When a new capability binding is added to `intelligence-platform.ts`, every test file that hardcodes the live capability count must be updated or the suite fails.

**Why:** The canonical `intelligencePlatform` singleton is imported by all binding tests and the platform test. Assertions like `live.length === 11` fail the moment a new binding activates.

**Grep patterns to find all affected assertions before and after adding a binding:**

```bash
grep -rn "live.length ===\|execCapabilities.length ===\|all.*capabilities registered" server/tests/
```

**Files that contained hardcoded counts through INT26 (12 live capabilities):**
- `test-intelligence-platform.ts` — `caps.length === N` (registered count, not live count)
- `test-intelligence-analyser-binding.ts` — `live.length` + "eleven live capabilities" string
- `test-intelligence-diary-binding.ts` — `live.length`
- `test-intelligence-household-binding.ts` — `live.length`
- `test-intelligence-meals-binding.ts` — `live.length`
- `test-intelligence-nutrition-knowledge-binding.ts` — `live.length` (one-liner)
- `test-intelligence-pantry-binding.ts` — `live.length`
- `test-intelligence-partners-binding.ts` — `live.length`
- `test-intelligence-profile-binding.ts` — `live.length`
- `test-intelligence-templates-binding.ts` — `live.length`
- `test-intelligence-registry-executability.ts` — `execCapabilities.length` + includes list

**How to apply:** Before adding a new binding, grep the above patterns. After adding it: update every match from N to N+1, update the descriptive string to include the new capability id, and add the new capability id to the `includes()` chain in the registry executability test. Also add the new `CAPABILITY_ID` import to `test-intelligence-registry-executability.ts`.

**Additional note:** `generateIntent` (write verb) against a capability whose `supportedIntents` does NOT include write verbs returns `unsupported_intent`, NOT `confirmation_required`. Only capabilities that declare write verbs in `supportedIntents` get the confirmation tier. Read-only capabilities like `meal-discovery` (supportedIntents: ["search","recommend"]) return `unsupported_intent` for all verbs not in that list.
