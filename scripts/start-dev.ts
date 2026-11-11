/**
 * Cross-platform entry point for the integrated-dev server.
 * `NODE_ENV=development command` is POSIX syntax and fails under Windows cmd.exe.
 * Set the mode inside Node before importing server/index.ts so all server modules see it.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(repositoryRoot);
process.env.NODE_ENV = "development";

if (process.argv.includes("--check")) {
  console.log(`Development launcher ready for ${repositoryRoot}; server start skipped.`);
  process.exit(0);
}

await import("../server/index.ts");
