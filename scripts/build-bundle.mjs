#!/usr/bin/env node
// Assemble the generated `bundle` release from the source submodules.
// Zero dependencies (Node built-ins only); runs on Windows/macOS/Linux and in CI.
// Safe no-op when nothing changed. Pushes only when invoked with --push.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  copyFileSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, "..");

const paths = {
  backend: join(root, "backend"),
  frontend: join(root, "frontend"),
  cli: join(root, "cli"),
  bundle: join(root, "bundle"),
};

const push = process.argv.includes("--push");
const isWindows = process.platform === "win32";

function run(cmd, args, cwd, shell = false) {
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit", shell });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function git(args, cwd = root) {
  run("git", args, cwd, false);
}

// Returns true when there is something staged to commit.
function hasStaged(cwd) {
  return spawnSync("git", ["diff", "--cached", "--quiet"], { cwd }).status !== 0;
}

function step(msg) {
  console.log(`\n>> ${msg}`);
}

// 1. Update the source submodules to their branch tips.
step("Updating source submodules to branch tips");
git(["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"]);

// 2. Build the frontend.
step("Building frontend");
run("npm", ["install"], paths.frontend, isWindows);
run("npx", ["ng", "build"], paths.frontend, isWindows);

const browserDir = join(paths.frontend, "dist", "snip-frontend", "browser");
const indexHtml = join(browserDir, "index.html");
if (!existsSync(indexHtml)) {
  throw new Error(
    `Frontend build output missing: ${indexHtml}\n` +
      "Expected Angular to emit dist/snip-frontend/browser/index.html."
  );
}

// 3. Assemble bundle/.
step("Assembling bundle/");
copyFileSync(join(paths.backend, "server.js"), join(paths.bundle, "server.js"));
copyFileSync(join(paths.cli, "cli.js"), join(paths.bundle, "cli.js"));

const bundlePublic = join(paths.bundle, "public");
rmSync(bundlePublic, { recursive: true, force: true });
mkdirSync(bundlePublic, { recursive: true });
cpSync(browserDir, bundlePublic, { recursive: true });

writeFileSync(join(paths.bundle, ".env"), "PUBLIC_DIR=./public\n");

writeFileSync(
  join(paths.bundle, "package.json"),
  JSON.stringify(
    {
      name: "snip-bundle",
      version: "1.0.0",
      private: true,
      scripts: { start: "bun server.js" },
    },
    null,
    2
  ) + "\n"
);

writeFileSync(
  join(paths.bundle, "Dockerfile"),
  [
    "FROM oven/bun:1-alpine",
    "WORKDIR /app",
    "COPY . .",
    "ENV PORT=3000",
    "EXPOSE 3000",
    "CMD [\"bun\", \"server.js\"]",
    "",
  ].join("\n")
);

writeFileSync(
  join(paths.bundle, ".dockerignore"),
  [".git", ".dockerignore", "Dockerfile", "railway.json", ""].join("\n")
);

writeFileSync(
  join(paths.bundle, "railway.json"),
  JSON.stringify(
    {
      $schema: "https://railway.app/railway.schema.json",
      build: { builder: "DOCKERFILE", dockerfilePath: "Dockerfile" },
    },
    null,
    2
  ) + "\n"
);

// 4. Commit inside bundle/ (guarded), push only with --push.
step("Committing bundle/");
git(["add", "-A"], paths.bundle);
if (hasStaged(paths.bundle)) {
  git(["commit", "-m", "Rebuild bundle"], paths.bundle);
  console.log("bundle: committed");
} else {
  console.log("bundle: unchanged, nothing to commit");
}
if (push) {
  // Submodule checkouts are often detached — push explicitly to the branch.
  git(["push", "origin", "HEAD:bundle"], paths.bundle);
  console.log("bundle: pushed");
}

// 5. Bump the submodule pointer in the superproject (guarded), push only with --push.
step("Bumping bundle pointer on main");
git(["add", "bundle"], root);
if (hasStaged(root)) {
  git(["commit", "-m", "Rebuild bundle release"], root);
  console.log("main: pointer bumped");
} else {
  console.log("main: unchanged, nothing to commit");
}
if (push) {
  git(["push", "origin", "HEAD:main"], root);
  console.log("main: pushed");
}

step(push ? "Done (pushed)." : "Done (local only; re-run with --push to publish).");
