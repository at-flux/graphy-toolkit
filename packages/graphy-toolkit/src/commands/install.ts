import { spawn } from "node:child_process";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCommand, buildRouteMap } from "@stricli/core";

function defaultBinDir(): string {
  if (process.platform === "win32") {
    return path.join(
      process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
      "graphy",
      "bin",
    );
  }
  return path.join(os.homedir(), ".local", "bin");
}

/** Directory passed to `npx skills add` (contains skills/graphy-toolkit). */
function skillInstallRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkgRoot = path.resolve(here, "../..");
  if (existsSync(path.join(pkgRoot, "skills", "graphy-toolkit", "SKILL.md"))) {
    return pkgRoot;
  }
  return path.resolve(pkgRoot, "../..");
}

function compiledBinaryPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkgRoot = path.resolve(here, "../..");
  return path.resolve(pkgRoot, "../../dist/bin/graphy");
}

async function runNpxSkills(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("npx", ["skills", "add", ...args], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`npx skills add exited with code ${code ?? "unknown"}`),
        );
    });
  });
}

async function installSkill(agents: string[]): Promise<void> {
  const root = skillInstallRoot();
  const agentFlags = agents.flatMap((a) => ["--agent", a]);
  await runNpxSkills([
    root,
    "--skill",
    "graphy-toolkit",
    "--global",
    "--yes",
    ...agentFlags,
  ]);
}

async function installBinary(binDir: string): Promise<string | null> {
  const compiled = compiledBinaryPath();
  try {
    await stat(compiled);
  } catch {
    return null;
  }
  await mkdir(binDir, { recursive: true });
  const dest = path.join(
    binDir,
    process.platform === "win32" ? "graphy.exe" : "graphy",
  );
  await copyFile(compiled, dest);
  return dest;
}

function pathHint(binDir: string): void {
  const onPath = (process.env.PATH ?? "")
    .split(path.delimiter)
    .includes(binDir);
  if (onPath) {
    console.log(`bin directory already on PATH: ${binDir}`);
    return;
  }
  if (process.platform === "win32") {
    console.log(`Add to PATH (PowerShell): $env:Path += ";${binDir}"`);
  } else {
    console.log(`Add to PATH: export PATH="${binDir}:$PATH"`);
  }
}

type InstallFlags = {
  binDir?: string;
  agent?: string;
};

const installSkillCommand = buildCommand({
  func: async (flags: InstallFlags) => {
    const agents = flags.agent ? [flags.agent] : ["cursor"];
    await installSkill(agents);
    console.log("skill installed");
  },
  parameters: {
    flags: {
      binDir: {
        brief: "Unused for skill-only install",
        kind: "parsed",
        parse: String,
        optional: true,
      },
      agent: {
        brief: "Agent harness (cursor, claude-code, …)",
        kind: "parsed",
        parse: String,
        optional: true,
      },
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Install graphy-toolkit agent skill via npx skills add" },
});

const installAllCommand = buildCommand({
  func: async (flags: InstallFlags) => {
    const agents = flags.agent ? [flags.agent] : ["cursor"];
    await installSkill(agents);
    const binDir = path.resolve(flags.binDir ?? defaultBinDir());
    const installed = await installBinary(binDir);
    if (installed) {
      console.log(`installed graphy binary: ${installed}`);
      pathHint(binDir);
    } else {
      console.log(
        "no compiled binary at dist/bin/graphy — run pnpm compile:graphy or npm i -g @at-flux/graphy-toolkit",
      );
      pathHint(binDir);
    }
  },
  parameters: {
    flags: {
      binDir: {
        brief: "Directory for graphy executable",
        kind: "parsed",
        parse: String,
        optional: true,
      },
      agent: {
        brief: "Agent harness for skill install",
        kind: "parsed",
        parse: String,
        optional: true,
      },
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: {
    brief:
      "Install skill and copy graphy binary to PATH (default for graphy install)",
  },
});

export const installRoutes = buildRouteMap({
  routes: {
    skill: installSkillCommand,
    all: installAllCommand,
  },
  defaultCommand: "all",
  docs: { brief: "Install graphy skill and/or binary" },
});
