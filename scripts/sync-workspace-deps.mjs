#!/usr/bin/env node
/**
 * Restore workspace:* for internal @at-flux deps after multi-semantic-release.
 * MSR rewrites them to pinned versions for publish notes but breaks frozen-lockfile CI.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packagesDir = join(root, "packages");
const scopes = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

for (const dir of readdirSync(packagesDir, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const pkgPath = join(packagesDir, dir.name, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  let changed = false;

  for (const scope of scopes) {
    if (!pkg[scope]) continue;
    for (const [name, version] of Object.entries(pkg[scope])) {
      if (name.startsWith("@at-flux/") && version !== "workspace:*") {
        pkg[scope][name] = "workspace:*";
        changed = true;
        console.log(`${pkg.name}: ${scope}.${name} ${version} → workspace:*`);
      }
    }
  }

  if (changed) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}
