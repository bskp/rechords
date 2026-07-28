#!/usr/bin/env node
/**
 * Installs the x64 native bindings that an Intel (Rosetta) Meteor needs on an
 * Apple Silicon host.
 *
 * rspack and swc ship their native binaries as per-platform optional
 * dependencies. npm resolves those against the *host* arch, so on an arm64 Mac
 * it installs the arm64 binaries — but if `meteor` is the x86_64 build, the
 * bundler runs under Rosetta and asks for the x64 ones. The mismatch shows up
 * as "Failed to load native binding".
 *
 * The x64 packages refuse to install on an arm64 host (EBADPLATFORM), so they
 * need --force, which in turn means they cannot live in package.json without
 * breaking installs for everyone else. Hence this script.
 *
 * None of this is needed once Meteor itself is the arm64 build — that is the
 * real fix. Run `npm run fix:rosetta` after any install until then.
 *
 * No-ops on every other platform, so it is safe in CI.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const NEEDED = [
  "@rspack/binding-darwin-x64",
  "@rspack/resolver-binding-darwin-x64",
  "@swc/core-darwin-x64",
];

/** The arm64 twin whose version the x64 copy must match exactly. */
const TWIN = {
  "@rspack/binding-darwin-x64": "@rspack/binding-darwin-arm64",
  "@rspack/resolver-binding-darwin-x64": "@rspack/resolver-binding-darwin-arm64",
  "@swc/core-darwin-x64": "@swc/core-darwin-arm64",
};

const version = (pkg) => {
  const p = join("node_modules", pkg, "package.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).version : null;
};

if (process.platform !== "darwin" || process.arch !== "arm64") {
  console.log("rosetta-bindings: not an arm64 Mac, nothing to do.");
  process.exit(0);
}

const toolDir = join(homedir(), ".meteor", "packages", "meteor-tool");
const meteorIsIntel =
  existsSync(toolDir) &&
  readdirSync(toolDir).some((v) =>
    existsSync(join(toolDir, v, "mt-os.osx.x86_64")),
  );

if (!meteorIsIntel) {
  console.log("rosetta-bindings: Meteor is not the Intel build, nothing to do.");
  process.exit(0);
}

const missing = NEEDED.filter((pkg) => {
  const want = version(TWIN[pkg]);
  const have = version(pkg);
  return want !== null && have !== want;
});

if (missing.length === 0) {
  console.log("rosetta-bindings: all x64 bindings present and matching.");
  process.exit(0);
}

const specs = missing.map((pkg) => `${pkg}@${version(TWIN[pkg])}`);
console.log(`rosetta-bindings: installing ${specs.join(", ")}`);

// --force is required: npm refuses these on an arm64 host.
execFileSync("npm", ["install", "-D", "--force", ...specs], {
  stdio: "inherit",
});

// Keep them out of package.json so ordinary installs stay portable.
execFileSync(
  "npm",
  ["pkg", "delete", ...missing.map((p) => `devDependencies.${p}`)],
  { stdio: "inherit" },
);

console.log("rosetta-bindings: done.");
