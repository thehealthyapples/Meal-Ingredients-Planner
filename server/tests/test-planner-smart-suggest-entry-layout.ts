/** Regression contract: Planner entry controls must expose the Smart panel in view. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const planner = readFileSync(join(root, "client/src/pages/weekly-planner-page.tsx"), "utf8");
const assistant = readFileSync(join(root, "client/src/components/PlannerAssistantPanel.tsx"), "utf8");
const physicalCss = readFileSync(join(root, "client/src/styles/planner-physical.css"), "utf8");
const context = readFileSync(join(root, "client/src/contexts/PlannerContext.tsx"), "utf8");
const smartSuggestHook = readFileSync(join(root, "client/src/hooks/use-smart-suggest.ts"), "utf8");

assert.match(planner, /onClick=\{\(\) => setAssistantMode\("smart"\)\}[\s\S]*?data-testid="button-plan-my-week"/);
assert.match(planner, /onClick=\{\(\) => setAssistantMode\("smart"\)\}[\s\S]*?data-testid="button-plan-empty-week"/);
assert.match(assistant, /mode === "smart" && <SmartContent \/>/);
assert.match(assistant, /<aside[\s\S]*?data-testid="panel-planner-assistant"/);
assert.match(assistant, /onClick=\{onRunSmartSuggest\}[\s\S]*?data-testid="button-run-smart-suggest"/);
assert.match(assistant, /className="[^"]*max-h-\[calc\(100dvh-11\.5rem\)\][^"]*"[\s\S]*?data-testid="panel-planner-assistant"/);
assert.match(assistant, /flex-1 overflow-y-auto min-h-0/);
assert.match(context, /"smart"/);
assert.match(planner, /onRunSmartSuggest:\s*\(\)\s*=>\s*runSmartSuggest\(\)/);
assert.match(smartSuggestHook, /apiRequest\('POST',\s*'\/api\/meal-plans\/smart-suggest'/);
assert.match(smartSuggestHook, /const data = await res\.json\(\) as SmartSuggestResult;[\s\S]*?setSmartResult\(data\);[\s\S]*?onReviewReady\?\.\(\)/);

assert.match(planner, /pageContainerClass\(true\)\} planner-physical-surface/);
assert.match(planner, /title="Planner"[\s\S]*?className="planner-workspace-header"/);
assert.match(physicalCss, /^\.planner-physical-surface\s*\{/m);
assert.doesNotMatch(physicalCss, /^\s*\[data-realm="planner"\]\s*\{/m);
assert.match(physicalCss, /\.planner-physical-surface\s*\{[\s\S]*?overflow:\s*hidden/);
assert.match(physicalCss, /\.planner-workspace-header:not\(\[data-stuck="true"\]\)[\s\S]*?margin-block:\s*0\.25rem/);
assert.match(physicalCss, /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)[\s\S]*?left:\s*1%;[\s\S]*?width:\s*calc\(98%\s*-\s*280px\)/);
assert.match(physicalCss, /\[data-testid="panel-planner-assistant"\][\s\S]*?width:\s*260px/);
assert.match(physicalCss, /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)\s*and\s*\(max-height:\s*700px\)[\s\S]*?max-height:\s*calc\(100dvh\s*-\s*20\.5rem\)/);

console.log("Planner Smart Suggest entry and layout contracts passed.");
