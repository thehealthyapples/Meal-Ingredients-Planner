import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");
const app = read("client/src/App.tsx");
const banner = read("client/src/components/admin-banner.tsx");
const hub = read("client/src/pages/admin-page.tsx");
const page = read("client/src/pages/admin-activity-monitor-page.tsx");

assert.match(app, /admin-activity-monitor-page/);
assert.match(app, /AdminActivityMonitorChrome = withAdminBanner\(AdminActivityMonitorPage\)/);
assert.match(app, /path="\/admin\/activity"[^\n]+ProtectedRoute component=\{AdminActivityMonitorChrome\}/);
assert.match(banner, /href: "\/admin\/activity", label: "Activity Monitor"/);
assert.match(hub, /Read-only bridge activity, projection metadata, and safety state/);
assert.match(page, /role !== "admin"\) return <NotFound \/>/);
assert.match(page, /queryKey: \["\/api\/admin\/activity"\]/);
assert.match(page, /ActivityMonitorLoading/);
assert.match(page, /ActivityMonitorError/);
assert.match(page, /activity-monitor-malformed/);
assert.match(page, /activity-monitor-projection-metadata/);
assert.match(page, /activity-monitor-safety-state/);
assert.match(page, /record\.kind/);
assert.match(page, /Filter by record kind/);
assert.match(page, /Filter by status/);
assert.match(page, /Filter by record ID/);
assert.match(page, /setSelectedId\(record\.id\)/);
assert.match(page, /activity\.refetch\(\)/);
assert.match(page, /No activity records were reported/);
assert.match(page, /No activity records match these filters/);
assert.match(page, /does not infer workflow, change statuses, trigger work, or become an authority/);
assert.doesNotMatch(page, /refetchInterval|setInterval/);
assert.doesNotMatch(page, /useMutation|\.mutate\(/);
assert.doesNotMatch(page, /process\.env|import\.meta\.env|authorization|bearer|token/i);

console.log("PASS: Activity Monitor is protected, connected, read-only, filterable, and truthful");
