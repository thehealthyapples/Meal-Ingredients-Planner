/** Focused regression contracts for the read-only synthetic review UI fixes. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const shell = readFileSync(join(root, "client/src/components/layout/app-shell.tsx"), "utf8");
const smartReview = readFileSync(join(root, "client/src/components/SmartReviewPanelContent.tsx"), "utf8");
const preview = readFileSync(join(root, "client/src/components/MealPreviewBubble.tsx"), "utf8");
const routes = readFileSync(join(root, "server/routes.ts"), "utf8");

function check(name: string, assertion: () => void): void {
  assertion();
  console.log(`  ✓ ${name}`);
}

check("the shell reads the existing impersonation status and renders the return control only for a confirmed impersonating session", () => {
  assert.match(shell, /queryKey:\s*\["\/api\/benchmark-impersonation"\]/);
  assert.match(shell, /impersonationStatus\.data\?\.impersonating\s*&&/);
  assert.match(shell, /data-testid="button-return-to-admin"[\s\S]*?Return to Admin/);
  assert.match(shell, /role="status"[\s\S]*?aria-live="polite"/);
});

check("return activation uses the supported stop route, reports failure accessibly, and navigates only after success", () => {
  assert.match(shell, /apiRequest\("POST",\s*"\/api\/benchmark-impersonation\/stop"\)/);
  assert.match(shell, /if \(!result\.ok\)[\s\S]*?setReturnError\(true\)/);
  assert.match(shell, /onError:\s*\(\)\s*=>\s*setReturnError\(true\)/);
  assert.match(shell, /role="alert"[\s\S]*?Couldn’t confirm the return to Admin/);
  assert.match(shell, /window\.location\.assign\("\/admin\/benchmark-households"\)/);
  assert.match(routes, /app\.get\("\/api\/benchmark-impersonation"[\s\S]*?impersonating:\s*Boolean\(imp\)/);
  assert.match(routes, /app\.post\("\/api\/benchmark-impersonation\/stop"[\s\S]*?storage\.getUser\(imp\.adminUserId\)[\s\S]*?req\.login\(admin[\s\S]*?delete \(req\.session as any\)\.benchmarkImpersonation/);
});

check("Preview is an explicit accessible action that opens for every viewport", () => {
  assert.match(smartReview, /const \[showPreview, setShowPreview\] = useState\(false\)/);
  assert.match(smartReview, /onClick=\{\(\) => setShowPreview\(true\)\}[\s\S]*?aria-expanded=\{showPreview\}[\s\S]*?aria-controls=\{`smart-preview-\$\{key\}`\}/);
  assert.match(smartReview, /\{showPreview && \([\s\S]*?<MealPreviewInline[\s\S]*?showAllIngredients/);
  assert.doesNotMatch(smartReview, /isMobile && showPreview/);
});

check("the opened Preview uses no write/navigation action and is honest when ingredient data is absent", () => {
  const inlineCall = smartReview.match(/\{showPreview && \([\s\S]*?<MealPreviewInline([\s\S]*?)\/>\s*\)\}/)?.[1] ?? "";
  assert.ok(inlineCall, "Preview must render its read-only detail surface");
  assert.doesNotMatch(inlineCall, /onAction|actionLabel|navigate|apiRequest|mutate/);
  assert.match(smartReview, /meal\s*\?\s*\{\s*kind:\s*"meal",\s*meal\s*\}/);
  assert.match(smartReview, /kind:\s*"web"[\s\S]*?ingredients:\s*entry\.candidate\.ingredients\s*\?\?\s*\[\]/);
  assert.match(preview, /Ingredients are unavailable in the preview data\./);
  assert.match(preview, /\{ingredients\.length > 0 \?[\s\S]*?showAllIngredients/);
});

console.log("\n4 focused synthetic review UI contracts passed.");
