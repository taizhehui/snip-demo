#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");

const BASE = process.env.SNIP_API || "http://localhost:3000";

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function usage() {
  process.stdout.write(
    [
      "Snip — a tiny URL shortener CLI",
      "",
      "Usage:",
      "  snip add <url>     Shorten a URL and print the short link",
      "  snip ls            List all links (code, hits, url)",
      "  snip open <code>   Open a short code's target in your browser",
      "  snip help          Show this help",
      "",
      `API: ${BASE} (override with SNIP_API)`,
      "",
    ].join("\n")
  );
}

async function add(url) {
  if (!url) {
    fail("Usage: snip add <url>");
  }

  let res;
  try {
    res = await fetch(`${BASE}/api/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    fail(`Cannot reach backend at ${BASE}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail(data.error || `Request failed (${res.status})`);
  }

  process.stdout.write(`${data.shortUrl}\n`);
}

async function ls() {
  let res;
  try {
    res = await fetch(`${BASE}/api/links`);
  } catch {
    fail(`Cannot reach backend at ${BASE}`);
  }

  if (!res.ok) {
    fail(`Request failed (${res.status})`);
  }

  const links = await res.json().catch(() => []);
  if (!Array.isArray(links) || links.length === 0) {
    process.stdout.write("No links yet.\n");
    return;
  }

  const codeWidth = Math.max(4, ...links.map((l) => String(l.code).length));
  const hitsWidth = Math.max(4, ...links.map((l) => String(l.hits).length));

  const header = `${"CODE".padEnd(codeWidth)}  ${"HITS".padStart(hitsWidth)}  URL`;
  process.stdout.write(`${header}\n`);
  for (const link of links) {
    const code = String(link.code).padEnd(codeWidth);
    const hits = String(link.hits).padStart(hitsWidth);
    process.stdout.write(`${code}  ${hits}  ${link.url}\n`);
  }
}

async function open(code) {
  if (!code) {
    fail("Usage: snip open <code>");
  }

  let res;
  try {
    res = await fetch(`${BASE}/${code}`, { redirect: "manual" });
  } catch {
    fail(`Cannot reach backend at ${BASE}`);
  }

  const location = res.headers.get("location");
  if (!location) {
    fail(`Unknown code: ${code}`);
  }

  openInBrowser(location);
  process.stdout.write(`Opening ${location}\n`);
}

function openInBrowser(target) {
  const platform = process.platform;
  let command;
  let args;

  if (platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", target];
  } else if (platform === "darwin") {
    command = "open";
    args = [target];
  } else {
    command = "xdg-open";
    args = [target];
  }

  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.on("error", () => fail(`Could not open browser for ${target}`));
  child.unref();
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);

  switch (cmd) {
    case "add":
      await add(arg);
      break;
    case "ls":
      await ls();
      break;
    case "open":
      await open(arg);
      break;
    case undefined:
    case "help":
    case "-h":
    case "--help":
      usage();
      break;
    default:
      fail(`Unknown command: ${cmd}\nRun "snip help" for usage.`);
  }
}

main().catch((err) => fail(err && err.message ? err.message : String(err)));
