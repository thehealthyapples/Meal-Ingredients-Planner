import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(
  path.resolve(here, "../../client/src/pages/contact-page.tsx"),
  "utf8",
);

// The counter sits beneath the subject Input, inside the same field group,
// and reads the live subject length against the shared subjectMax limit.
const subjectFieldMatch = pageSource.match(
  /<Label htmlFor="contact-subject">[\s\S]*?<\/div>/,
);
assert.ok(subjectFieldMatch, "The subject field group is present");
const subjectField = subjectFieldMatch![0];

assert.match(
  subjectField,
  /data-testid="text-contact-subject-count"/,
  "The subject counter carries the required testid",
);
assert.match(
  subjectField,
  /\{subject\.length\}\s+of\s+\{limits\.subjectMax\}\s+characters/,
  "The subject counter renders the live subject length against subjectMax",
);
assert.match(
  subjectField,
  /<Input[\s\S]*data-testid="input-contact-subject"[\s\S]*?\/>[\s\S]*data-testid="text-contact-subject-count"/,
  "The counter is rendered beneath the subject Input",
);

// Preservation: the subject Input keeps its existing maxLength wiring.
assert.match(
  pageSource,
  /<Input[\s\S]*?id="contact-subject"[\s\S]*?maxLength=\{limits\.subjectMax\}[\s\S]*?data-testid="input-contact-subject"/,
  "The subject Input still enforces maxLength from limits.subjectMax",
);

// Preservation: subjectValid is untouched.
assert.match(
  pageSource,
  /const subjectValid =\s*\n\s*trimmedSubject\.length > 0 && \(!limits \|\| trimmedSubject\.length <= limits\.subjectMax\);/,
  "subjectValid validation logic is unchanged",
);

// Preservation: the existing body counter is unchanged.
assert.match(
  pageSource,
  /data-testid="text-contact-body-count"/,
  "The existing body counter testid is preserved",
);
assert.match(
  pageSource,
  /\{bodyCount\} of \{limits\.bodyMax\} characters/,
  "The existing body counter text pattern is preserved",
);

// Preservation: submission behavior (send button gating and mutation) is unchanged.
assert.match(
  pageSource,
  /disabled=\{!subjectValid \|\| !bodyValid \|\| sendMutation\.isPending\}/,
  "Send button gating on subjectValid/bodyValid is preserved",
);
assert.match(
  pageSource,
  /data-testid="button-contact-send"/,
  "The send button testid is preserved",
);
assert.match(
  pageSource,
  /apiRequest\("POST", "\/api\/support\/requests", \{/,
  "Submission still posts to the support requests endpoint",
);

console.log("contact subject counter contract: ok");
