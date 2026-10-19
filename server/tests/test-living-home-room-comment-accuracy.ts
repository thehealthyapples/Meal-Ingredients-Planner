import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.resolve(here, "../../client/src/pages/living-home-room.tsx");
const pageSource = readFileSync(pagePath, "utf8");

// Regression: the header comment must not claim an in-place action bar exists
// on Living Objects — that description is stale relative to the current
// pointer/touch/keyboard drag interaction model.
assert.doesNotMatch(
  pageSource,
  /in-place action bar/i,
  "The stale 'in-place action bar' wording must not appear in the file",
);

// The replacement wording must remain factual and comment-only: it should
// still describe that objects carry no buttons/action bar, and the keyboard
// sensor drives the same three destinations as pointer/touch drag.
assert.match(
  pageSource,
  /Objects carry no buttons and no action bar of any kind/,
  "The corrected header comment factually describes the current no-action-bar implementation",
);

assert.match(
  pageSource,
  /the keyboard sensor\s*\n\s*\(space to lift, arrows to carry\) drives the same three destinations as\s*\n\s*pointer\/touch drag\./,
  "The corrected header comment still describes the keyboard sensor driving the three destinations",
);

// Preservation: this must be a comment-only correction — the executable
// keyboard sensor wiring and drag orchestration remain unchanged.
assert.match(
  pageSource,
  /useSensor\(KeyboardSensor\)/,
  "The KeyboardSensor wiring is preserved",
);
assert.match(
  pageSource,
  /const onDragEnd = \(e: DragEndEvent\) => \{/,
  "The onDragEnd handler is preserved",
);

console.log("living-home-room comment accuracy: ok");
