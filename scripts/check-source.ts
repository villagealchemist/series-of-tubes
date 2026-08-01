import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const run = promisify(execFile);
const excludedDirectories = new Set([
  ".build-tools",
  ".git",
  ".idea",
  ".wrangler",
  "dist",
  "node_modules",
  "sites",
]);
const excludedFiles = new Set(["package-lock.json"]);
const authoredFiles: string[] = [];

async function collect(directory: string): Promise<void> {
  const entries = await readdir(path.join(root, directory), {
    withFileTypes: true,
  });

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory() && !excludedDirectories.has(relative))
      await collect(relative);
    if (entry.isFile() && !excludedFiles.has(relative))
      authoredFiles.push(relative);
  }
}

await collect("");

const prohibited = String.fromCodePoint(0x2014);
const failures: string[] = [];
const prohibitedScriptExtensions = new Set([".cjs", ".js", ".mjs"]);
const prohibitedSuppressions = [
  ["@ts", "ignore"].join("-"),
  ["@ts", "nocheck"].join("-"),
  ["eslint", "disable"].join("-"),
];

for (const file of authoredFiles.sort()) {
  if (prohibitedScriptExtensions.has(path.extname(file))) {
    failures.push(`${file}: authored JavaScript is prohibited`);
  }

  const content = await readFile(path.join(root, file), "utf8");
  if (content.includes(prohibited)) failures.push(`${file}: contains U+2014`);
  if (
    path.extname(file) === ".ts" &&
    prohibitedSuppressions.some((suppression) => content.includes(suppression))
  ) {
    failures.push(`${file}: contains a prohibited suppression`);
  }
}

const { stdout: trackedOutput } = await run("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
});
const trackedFiles = trackedOutput
  .split("\0")
  .filter((file) => file.length > 0);

for (const file of trackedFiles) {
  if (file.startsWith("sites/jux/")) continue;
  if (prohibitedScriptExtensions.has(path.extname(file))) {
    failures.push(`${file}: tracked JavaScript is prohibited`);
  }
}

if (failures.length > 0) {
  console.error("Authored-source policy violations:");
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(
    `U+2014 check passed for ${authoredFiles.length} authored files.`,
  );
  console.log("Authored JavaScript and suppression checks passed.");
  console.log("Tracked generated JavaScript check passed.");
}
