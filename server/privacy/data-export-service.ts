// BUS1 — Right of Access / Data Portability (UK GDPR Articles 15 and 20).
//
// Governing architecture: docs/architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md
//
// Reads the SAME registry the erasure service reads (./personal-data-registry.ts),
// which is the entire point: "what do you hold about me?" and "delete what you
// hold about me" must never be able to disagree about what THA holds.
//
// WHY THE EXPORT IS SYNCHRONOUS AND NOT A QUEUED JOB:
//   The conventional shape is "request an export, we'll email you a link". That
//   exists because most platforms cannot assemble the data quickly. THA can —
//   this is one household's rows across ~45 tables, not a warehouse — and the
//   queued shape would have required a job runner that does not exist in this
//   codebase (there is no scheduler of any kind; see the architecture document).
//   Inventing one to make a fast operation feel slow would be the "temporary
//   architecture" the mission forbids.
//
//   A household therefore clicks once and the file downloads. That is also the
//   better experience: Art. 15 is a right, and a right that arrives by email
//   tomorrow feels like a favour.
//
// WHAT THE FILE CONTAINS:
//   Real rows, not a summary. If THA holds it and it is about you, it is in the
//   file — with the sole exception of live credentials (your password hash and
//   any active tokens), which are omitted and SAID to be omitted, in the file
//   itself, with the reason. An omission a person can see is honest; a silent
//   one is not.

import { db } from "../db";
import { privacyActivityLog } from "@shared/schema";
import { COMPANY_PROFILE } from "@shared/legal";
import { PERSONAL_DATA_REGISTRY, resolveScope } from "./personal-data-registry";

export interface DataExport {
  /** What this file is, for a person who opens it in a text editor. */
  readme: {
    what: string;
    generatedAt: string;
    generatedFor: string;
    yourRights: string;
    questions: string;
  };
  /** Anything deliberately left out, and why. Never silent. */
  omissions: Array<{ category: string; reason: string }>;
  /** The data itself, keyed by personal-data category. */
  data: Record<string, unknown>;
}

export async function buildDataExport(userId: number): Promise<DataExport> {
  const scope = await resolveScope(userId);

  const data: Record<string, unknown> = {};
  const omissions: Array<{ category: string; reason: string }> = [];

  for (const entry of PERSONAL_DATA_REGISTRY) {
    if (entry.collect === null) {
      omissions.push({
        category: entry.label,
        reason: entry.omittedBecause ?? "Not exported.",
      });
      continue;
    }
    const collected = await entry.collect(scope);
    // An empty category is INCLUDED as an empty value rather than dropped.
    // A household reading this file should be able to see that THA holds no
    // food diary for them — not have to infer it from a missing key.
    data[entry.id] = collected ?? null;
  }

  await db.insert(privacyActivityLog).values({
    userId,
    action: "data-export",
    detail: { categories: Object.keys(data).length },
  });

  return {
    readme: {
      what:
        "This file contains the personal data The Healthy Apples holds about you, exported at your request under Article 15 of the UK GDPR. It is the real data from our database, not a summary.",
      generatedAt: new Date().toISOString(),
      generatedFor: `account ${userId}`,
      yourRights:
        "You can also ask us to correct this data, or delete your account entirely, from Privacy Settings in the product.",
      questions: `Questions about this file: ${COMPANY_PROFILE.dataProtectionContact}`,
    },
    omissions,
    data,
  };
}

/** A stable, human-meaningful filename for the download. */
export function exportFilename(userId: number): string {
  const date = new Date().toISOString().slice(0, 10);
  return `the-healthy-apples-data-export-${userId}-${date}.json`;
}
