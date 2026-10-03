// `npm run dev`: Velite (lesson content, in watch mode) and the Next.js dev
// server run as separate processes. Compiling hundreds of MDX lessons with
// syntax highlighting takes a lot of memory; inside the dev server it pushed
// Next.js over its memory limit, which then restarted itself mid-session.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const bin = (name) => join("node_modules", ".bin", name);
const children = [];

function start(command, args, env = {}) {
  const child = spawn(bin(command), args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (signal === "SIGTERM" || signal === "SIGINT") return;
    stopAll();
    process.exit(code ?? 1);
  });
  return child;
}

function stopAll() {
  for (const child of children) if (child.exitCode === null) child.kill();
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopAll();
    process.exit(0);
  });
}

// Velite keeps its last output while it rebuilds, so Next never sees it missing.
start("velite", ["dev"], { VELITE_KEEP_OUTPUT: "1" });

// Wait for the first content build when there isn't one yet.
const ready = join(".velite", "index.js");
while (!existsSync(ready)) await new Promise((r) => setTimeout(r, 300));

start("next", ["dev", ...process.argv.slice(2)]);
