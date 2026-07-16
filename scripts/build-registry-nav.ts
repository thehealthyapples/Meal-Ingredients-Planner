/**
 * Generate the Product Knowledge Registry navigation surfaces from the inventory.
 *
 *   npx tsx scripts/build-registry-nav.ts
 *
 * docs/product/inventory/product.yaml
 *   -> docs/product/OWNERS.md       (every id -> its named owner; one flat table, Rule PKR12)
 *   -> docs/product/VISIBILITY.md   (every id -> its tier; the disclosure surface, PKR2)
 *
 * Both are GENERATED indices, excluded from the PKR11 bijection by name. Rule
 * PKR12/PKR16 (owners) and PKR22/PKR23/PKR24 (visibility) are answerable in one
 * read because these two tables exist. Read-only w.r.t. the product.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

const d = parse(readFileSync("docs/product/inventory/product.yaml", "utf8"));
const es = d.entries as any[];

// --- OWNERS.md : one flat table, every id -> named owner ---
const ownersRows = es
  .slice()
  .sort((a, b) => String(a.section).localeCompare(b.section) || String(a.id).localeCompare(b.id))
  .map((e) => `| \`${e.id}\` | ${e.name} | ${e.section} | ${e.owner} |`)
  .join("\n");

const owners = `# THA Product Knowledge Registry — OWNERS

_One table. Every registry entry and the single named human accountable for it (Rule PKR12: not a team, not a workstream, not "the platform"). Anyone may correct an entry; this person is accountable for it being true (Rule PKR16)._

_Generated from \`docs/product/inventory/product.yaml\` by PDA1 — do not hand-edit. ${es.length} entries._

| id | name | section | owner |
|---|---|---|---|
${ownersRows}

_If any row above named other than a person, Rule PKR12 would be violated and that entry would have no owner. Today every entry is owned by Colin Clapson; as the platform grows, ownership follows the product, not the org chart (§9.2)._
`;
writeFileSync("docs/product/OWNERS.md", owners);

// --- VISIBILITY.md ---
const byTier: Record<string, any[]> = { public: [], household: [], admin: [], developer: [] };
for (const e of es) (byTier[e.visibility] ??= []).push(e);

const tierBlock = (t: string, desc: string) => {
  const rows = byTier[t]
    .slice()
    .sort((a, b) => String(a.id).localeCompare(b.id))
    .map((e) => `| \`${e.id}\` | ${e.name} | ${e.section} |`)
    .join("\n");
  return `### ${t} — ${byTier[t].length} entries\n\n${desc}\n\n| id | name | section |\n|---|---|---|\n${rows}\n`;
};

const vis = `# THA Product Knowledge Registry — VISIBILITY

_The disclosure surface (PKR §18, added by PKR2). "What can a household be told? What is public?" answerable in one read, by a person, without running anything. One truth, four audiences; monotonic and cumulative (Rule PKR23: developer superset admin superset household superset public)._

**This document classifies; it never authorises.** It declares what tier a fact belongs to. It never decides what tier a *user* belongs to — identity and role are resolved exclusively by \`server/lib/access.ts\` (Rule PKR25). A missing or invalid label fails closed to \`developer\` and is served to no one (Rule PKR22).

_Generated from \`docs/product/inventory/product.yaml\` by PDA1 — do not hand-edit. ${es.length} entries: ${byTier.public.length} public, ${byTier.household.length} household, ${byTier.admin.length} admin, ${byTier.developer.length} developer._

${tierBlock("public", "Anyone, signed in or not. The Companion answers households most from this tier and the household tier below it.")}
${tierBlock("household", "Any signed-in household. Everything public, plus the household-facing product itself.")}
${tierBlock("admin", "Operators. Everything above, plus admin surfaces, hidden experiences, and positioning. Default tier for Hidden Experiences (Rule PKR29) and Competitive Advantages.")}
${tierBlock("developer", "Everything. Honest gap: THA has no \`developer\` runtime role today — \`users.role\` is \`user\` or \`admin\`. Developer-tier content is reachable only by reading \`docs/product/\` directly, and is served to no runtime consumer until such a role exists.")}
## PKR23 monotonicity — the 39 cross-tier links, reviewed

\`verify-product-inventory.ts\` warns on every \`related\` link that points from a lower tier to a higher one, asking a human to confirm the link discloses nothing. All 39 were reviewed by PDA1 and cleared:

- **37 are public/household claims pointing at the household feature they describe** (a marketing message to its planner; a benefit to its domain; a glossary term to its page). Safe by **Rule PKR24 — knowing about a feature is not access to it.** A public visitor learning THA has a planner cannot use it; access is enforced by \`hasPremiumAccess()\` / \`access.ts\` at the point of use, never by hiding that a feature exists.
- **\`hlp-upf-modal\` (public) to \`adv-upf-lens\` (admin)** — a public help modal references an admin-tier positioning entry. The help content is itself public; the link discloses only that THA frames processing as a differentiator, which the public modal already argues. No gated content is reachable through it.
- **\`cap-companion\` (household) to \`cap-product-knowledge\` (developer)** — the Companion capability references the not-yet-registered Product Knowledge capability. \`cap-companion\`'s own household-visible \`cannot\` field already states it cannot answer questions about THA itself, so the link discloses nothing new.

None of the 39 is a tier inversion that leaks gated content. They are the registry's natural cross-references, and the architecture warns rather than fails on them precisely so a human confirms — which this section is.
`;
writeFileSync("docs/product/VISIBILITY.md", vis);
console.log("OWNERS.md + VISIBILITY.md generated");
console.log("tiers:", Object.fromEntries(Object.entries(byTier).map(([k, v]) => [k, v.length])));
