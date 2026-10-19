/**
 * Windows portability regression test for scripts/ci/typecheck-gate.ts.
 *
 * The gate used to shell out via `execFileSync("npx", ["tsc", "--noEmit"], ...)`. On Windows,
 * "npx" resolves to npx.cmd, which execFileSync cannot invoke without `shell: true` (a command
 * injection surface). The fix resolves the local tsc binary on disk and runs it directly through
 * `process.execPath`, so no shell and no *.cmd resolution is ever needed.
 *
 * This test proves the fix two ways:
 *
 *   1. STATIC — parses the gate's source with the TypeScript compiler API and finds every call
 *      whose callee identifier is bound to a NAMED IMPORT FROM node:child_process. This is the
 *      part that is easy to get wrong: a naive text/regex scan for ".exec(" or ".spawn(" would
 *      also match `DIAGNOSTIC.exec(line)` (a RegExp.exec call, unrelated to process spawning) and
 *      wrongly count it. Resolving the callee to the child_process import first avoids that.
 *      Exactly one such call must exist, and it must be `execFileSync(process.execPath,
 *      [TSC_BIN, "--noEmit"], options)` with no `shell: true` in options.
 *
 *   2. RUNTIME — actually runs the gate's `check` mode as a subprocess and confirms it reaches
 *      the point of printing the baseline-vs-current comparison. That line is only ever printed
 *      after tsc has genuinely executed and produced output; the historical bug instead failed
 *      before that point (spawn ENOENT trying to resolve npx.cmd without a shell). The baseline
 *      file is also confirmed byte-identical before and after, since `check` must never write it.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE_PATH = resolve(HERE, "typecheck-gate.ts");
const BASELINE_PATH = resolve(HERE, "typecheck-baseline.json");
const REPO_ROOT = resolve(HERE, "..", "..");

// ---------------------------------------------------------------------------------------------
// 1. STATIC — AST analysis of scripts/ci/typecheck-gate.ts
// ---------------------------------------------------------------------------------------------

const source = readFileSync(GATE_PATH, "utf8");
const sourceFile = ts.createSourceFile(GATE_PATH, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

/** Local names bound to named imports from node:child_process (or the bare "child_process"). */
const childProcessImportNames = new Set<string>();
ts.forEachChild(sourceFile, (node) => {
  if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return;
  if (node.moduleSpecifier.text !== "node:child_process" && node.moduleSpecifier.text !== "child_process") return;
  const bindings = node.importClause?.namedBindings;
  if (bindings && ts.isNamedImports(bindings)) {
    for (const el of bindings.elements) childProcessImportNames.add(el.name.text);
  }
});

assert.ok(
  childProcessImportNames.has("execFileSync"),
  "the gate must import execFileSync from node:child_process",
);

/** Every call whose callee is an identifier resolving to a node:child_process import. */
const spawnCalls: ts.CallExpression[] = [];
function findSpawnCalls(node: ts.Node): void {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && childProcessImportNames.has(node.expression.text)) {
    spawnCalls.push(node);
  }
  ts.forEachChild(node, findSpawnCalls);
}
findSpawnCalls(sourceFile);

// Control: DIAGNOSTIC.exec(...) is RegExp.exec, not a process spawn. It is a PropertyAccessExpression
// callee (`DIAGNOSTIC.exec`), never a bare identifier, so it can never land in spawnCalls above —
// but only if that call still exists in the file, proving the analysis isn't vacuously passing.
let sawRegExpExecControl = false;
function findRegExpExecControl(node: ts.Node): void {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "DIAGNOSTIC" &&
    node.expression.name.text === "exec"
  ) {
    sawRegExpExecControl = true;
  }
  ts.forEachChild(node, findRegExpExecControl);
}
findRegExpExecControl(sourceFile);
assert.ok(
  sawRegExpExecControl,
  "control failed: DIAGNOSTIC.exec(...) (a RegExp.exec call, not a spawn) must still be present " +
    "in the gate so this test can prove it is correctly excluded",
);

assert.equal(
  spawnCalls.length,
  1,
  `expected exactly one call resolved to a node:child_process import, found ${spawnCalls.length}`,
);

const [spawnCall] = spawnCalls;
assert.equal((spawnCall.expression as ts.Identifier).text, "execFileSync", "the single spawn call must be execFileSync");

const [executableArg, argvArg, optionsArg] = spawnCall.arguments;

assert.ok(
  executableArg &&
    ts.isPropertyAccessExpression(executableArg) &&
    ts.isIdentifier(executableArg.expression) &&
    executableArg.expression.text === "process" &&
    executableArg.name.text === "execPath",
  "execFileSync must run process.execPath, not a bare command name that needs shell/.cmd resolution",
);

assert.ok(argvArg && ts.isArrayLiteralExpression(argvArg), "the second argument must be an argv array literal");
const argvElements = (argvArg as ts.ArrayLiteralExpression).elements;
assert.equal(argvElements.length, 2, "argv must be exactly [<tsc bin>, \"--noEmit\"]");
assert.ok(
  ts.isIdentifier(argvElements[0]) && argvElements[0].text === "TSC_BIN",
  "argv[0] must reference a locally resolved tsc binary constant, not a literal \"tsc\"/\"npx\"",
);
assert.ok(
  ts.isStringLiteral(argvElements[1]) && argvElements[1].text === "--noEmit",
  "argv[1] must be the literal --noEmit flag",
);

assert.ok(optionsArg && ts.isObjectLiteralExpression(optionsArg), "execFileSync must be called with an options object");
for (const prop of (optionsArg as ts.ObjectLiteralExpression).properties) {
  if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === "shell") {
    assert.ok(
      prop.initializer.kind !== ts.SyntaxKind.TrueKeyword,
      "execFileSync options must not set shell: true",
    );
  }
}

/** TSC_BIN must be declared as resolve(REPO_ROOT, "node_modules", "typescript", "bin", "tsc"). */
let tscBinInitializer: ts.Expression | undefined;
function findTscBinDeclaration(node: ts.Node): void {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "TSC_BIN" && node.initializer) {
    tscBinInitializer = node.initializer;
  }
  ts.forEachChild(node, findTscBinDeclaration);
}
findTscBinDeclaration(sourceFile);

assert.ok(tscBinInitializer, "TSC_BIN must be declared at module scope");
assert.ok(
  tscBinInitializer && ts.isCallExpression(tscBinInitializer) && ts.isIdentifier(tscBinInitializer.expression) && tscBinInitializer.expression.text === "resolve",
  "TSC_BIN must be built with resolve(...)",
);
const tscBinArgs = (tscBinInitializer as ts.CallExpression).arguments;
assert.ok(
  ts.isIdentifier(tscBinArgs[0]) && tscBinArgs[0].text === "REPO_ROOT",
  "TSC_BIN must resolve relative to REPO_ROOT",
);
const expectedSegments = ["node_modules", "typescript", "bin", "tsc"];
expectedSegments.forEach((segment, i) => {
  const arg = tscBinArgs[i + 1];
  assert.ok(
    arg && ts.isStringLiteral(arg) && arg.text === segment,
    `TSC_BIN path segment ${i} must be "${segment}", matching the local install layout`,
  );
});

const TSC_BIN = resolve(REPO_ROOT, "node_modules", "typescript", "bin", "tsc");
assert.ok(existsSync(TSC_BIN), `the resolved local tsc binary must exist on disk at ${TSC_BIN}`);

console.log("[test-typecheck-gate-windows-fix] static AST checks passed: exactly one execFileSync(process.execPath, [TSC_BIN, \"--noEmit\"]) call, no shell:true.");

// ---------------------------------------------------------------------------------------------
// 2. RUNTIME — actually execute the gate's `check` mode
// ---------------------------------------------------------------------------------------------

const tsxPackageJson = JSON.parse(readFileSync(resolve(REPO_ROOT, "node_modules", "tsx", "package.json"), "utf8")) as {
  bin?: string | Record<string, string>;
};
const tsxBinRelative = typeof tsxPackageJson.bin === "string" ? tsxPackageJson.bin : tsxPackageJson.bin?.tsx;
assert.ok(tsxBinRelative, "could not resolve the tsx CLI entry point from node_modules/tsx/package.json");
const TSX_CLI = resolve(REPO_ROOT, "node_modules", "tsx", tsxBinRelative!);

const baselineBefore = readFileSync(BASELINE_PATH);

let output: string;
let exitCode = 0;
try {
  output = execFileSync(process.execPath, [TSX_CLI, GATE_PATH, "check"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (err: any) {
  exitCode = typeof err.status === "number" ? err.status : 1;
  output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
}

// Exit code 2 is the gate's own signal that tsc produced no output and failed to run at all —
// exactly what happened on Windows when npx/tsc.cmd couldn't be resolved without a shell. A
// pass (0) or a regression failure (1, e.g. from the 16 pre-existing baseline mismatches that
// are out of scope for this fix) both mean tsc genuinely ran; only 2 means it didn't.
assert.notEqual(
  exitCode,
  2,
  `the gate reported it could not run tsc at all (exit 2) — this is the historical Windows spawn failure. Output:\n${output}`,
);

assert.match(
  output,
  /\[typecheck-gate\] baseline: \d+ error\(s\)\s+current: \d+ error\(s\)/,
  `the gate must run real tsc, load the baseline, and print the comparison line. Output:\n${output}`,
);

const baselineAfter = readFileSync(BASELINE_PATH);
assert.ok(
  baselineBefore.equals(baselineAfter),
  "typecheck-baseline.json must be byte-identical after a `check` run — check must never write it",
);

console.log("[test-typecheck-gate-windows-fix] runtime check passed: real tsc ran, baseline comparison reached, baseline file untouched.");
