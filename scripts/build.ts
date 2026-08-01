import { cp, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

if (dist !== path.resolve(root, "dist")) {
  throw new Error("Refusing to build outside the repository dist directory.");
}

const copies = [
  ["index.html", "index.html"],
  ["index.html", "links/index.html"],
  ["styles.css", "styles.css"],
  ["_redirects", "_redirects"],
  ["dev/index.html", "dev/index.html"],
  ["art/index.html", "art/index.html"],
] as const;

const generatedBrowserFiles = ["config.js", "redirect.js", "site.js"] as const;
const expected = [
  ...copies.map(([, destination]) => destination),
  ...generatedBrowserFiles,
].sort();

async function prepare(): Promise<void> {
  await rm(dist, { recursive: true, force: true });

  for (const [source, destination] of copies) {
    const destinationPath = path.join(dist, destination);
    await mkdir(path.dirname(destinationPath), { recursive: true });
    await cp(path.join(root, source), destinationPath);
  }
}

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative)),
      );
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }

  return files;
}

async function verify(): Promise<void> {
  const actual = (await listFiles(dist)).sort();

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected dist contents:\n${actual.join("\n")}`);
  }

  for (const file of actual) {
    const content = await readFile(path.join(dist, file), "utf8");
    if (/jux/i.test(content)) {
      throw new Error(
        `Prohibited transitional reference found in dist/${file}`,
      );
    }
  }

  console.log("Built allowlisted static assets:");
  for (const file of actual) console.log(`dist/${file}`);
}

const phase = process.argv[2];

if (phase === "prepare") {
  await prepare();
} else if (phase === "verify") {
  await verify();
} else {
  throw new Error("Expected build phase: prepare or verify.");
}
