import {
  MAX_OUTPUT_LINES,
  type ExecuteResult,
  type LogLevel,
  type OutputLine,
  type TestResult,
  type TestSpec,
} from "./execute";
import { installGit, type ShortStatus } from "./shell/git";
import { resolvePath } from "./shell/memfs";
import { ShellSyntaxError } from "./shell/parse";
import { Shell } from "./shell/shell";

/**
 * Runs terminal commands (bash-like, with git) in a fresh in-memory sandbox:
 * `setup` first, silently (an exercise's starting folder and repository),
 * then the learner's commands, each shown after a prompt like
 * "~/project $ git status". Checks are JavaScript expressions (they may use
 * await) with these names in scope, paths taken from where setup ended:
 *   file(path)    the file's text, or null
 *   exists(path), isDir(path), ls(path = ".")
 *   cwd           where the learner ended up, like "~/project"
 *   run(command)  runs more commands, resolves to what they printed
 *   git           git.branch(), git.branches(), git.log(ref) → [{ hash,
 *                 short, message, parents }], git.status() → { path: "XY" }
 *                 (as git status -s), git.show(ref, path), git.tags(),
 *                 git.conflicts(), git.isRepo(path)
 *   commands      the lines the learner ran
 *   status        the last command's exit code
 *   __output      the printed lines
 */
export async function executeShell(
  code: string,
  options: {
    setup?: string;
    tests?: TestSpec[];
    onLine?: (line: OutputLine) => void;
    /** Checked between lines: true stops the run */
    stopped?: () => boolean;
  } = {},
): Promise<ExecuteResult> {
  const { setup, tests = [], onLine, stopped } = options;
  const output: OutputLine[] = [];
  let truncated = false;
  const emit = (level: LogLevel, text: string) => {
    if (output.length >= MAX_OUTPUT_LINES) {
      if (!truncated) {
        truncated = true;
        const line: OutputLine = {
          level: "warn",
          text: `Output stopped after ${MAX_OUTPUT_LINES} lines.`,
        };
        output.push(line);
        onLine?.(line);
      }
      return;
    }
    const line: OutputLine = { level, text };
    output.push(line);
    onLine?.(line);
  };

  const shell = new Shell();
  const git = installGit(shell);
  if (setup) {
    let failed = "";
    await shell.run(setup, { out: () => {}, err: (text) => (failed += text) });
    // Setup is the lesson's, not the learner's: authors see what went wrong.
    if (failed) emit("warn", `Exercise setup: ${failed.trim()}`);
    shell.history.length = 0;
    shell.status = 0;
  }
  const start = shell.cwd;

  // Output arrives in pieces; show whole lines as they complete.
  const pending: Record<"log" | "error", string> = { log: "", error: "" };
  const write = (level: "log" | "error") => (text: string) => {
    pending[level] += text;
    const lines = pending[level].split("\n");
    pending[level] = lines.pop() ?? "";
    for (const line of lines) emit(level, line);
  };
  const flush = () => {
    for (const level of ["log", "error"] as const) {
      if (pending[level]) emit(level, pending[level]);
      pending[level] = "";
    }
  };

  const commands: string[] = [];
  let error: ExecuteResult["error"];
  try {
    await shell.run(
      code,
      { out: write("log"), err: write("error") },
      (statement) => {
        flush();
        if (stopped?.()) throw new Stopped();
        commands.push(statement.source);
        const [first, ...more] = statement.source.split("\n");
        emit("info", `${shell.display()} $ ${first}`);
        for (const line of more) emit("info", `> ${line}`);
      },
    );
  } catch (caught) {
    if (caught instanceof ShellSyntaxError) {
      emit("error", `bash: line ${caught.line}: ${caught.message}`);
      error = {
        name: "SyntaxError",
        message: caught.message,
        line: caught.line,
      };
    } else if (!(caught instanceof Stopped)) throw caught;
  }
  flush();

  let testResults: TestResult[] | undefined;
  if (tests.length) {
    const fs = shell.fs;
    const at = (path: string) =>
      resolvePath(start, path.replace(/^~(?=\/|$)/, "/home/panda"));
    const file = (path: string) =>
      fs.isFile(at(path)) ? fs.readText(at(path)) : null;
    const exists = (path: string) => fs.exists(at(path));
    const isDir = (path: string) => fs.isDir(at(path));
    const ls = (path = ".") => (fs.isDir(at(path)) ? fs.readdir(at(path)) : []);
    const run = async (command: string) => {
      const saved = {
        cwd: shell.cwd,
        status: shell.status,
        history: shell.history.length,
      };
      shell.cwd = start;
      shell.exited = false;
      let text = "";
      try {
        await shell.run(command, {
          out: (t) => (text += t),
          err: (t) => (text += t),
        });
      } finally {
        shell.cwd = saved.cwd;
        shell.status = saved.status;
        shell.history.length = saved.history;
      }
      return text;
    };
    const repo = (path = ".") => git.repoOf(at(path));
    const needRepo = () => {
      const dir = repo();
      if (!dir) throw new Error("there's no git repository here");
      return dir;
    };
    const gitApi = {
      isRepo: (path = ".") => repo(path) !== null,
      branch: async () => {
        const dir = repo();
        return dir ? git.branch(dir) : null;
      },
      branches: async () => {
        const dir = repo();
        return dir ? git.branches(dir) : [];
      },
      log: async (ref = "HEAD") => {
        const dir = repo();
        if (!dir) return [];
        return (await git.log(dir, ref)).map((c) => ({
          hash: c.oid,
          short: c.oid.slice(0, 7),
          message: c.commit.message.replace(/\n+$/, ""),
          parents: c.commit.parent,
        }));
      },
      status: async (): Promise<ShortStatus> => {
        const dir = repo();
        return dir ? git.shortStatus(dir) : {};
      },
      show: async (ref: string, path: string) => {
        const dir = needRepo();
        const oid = await git.resolveCommit(dir, ref);
        if (!oid) return null;
        return (await git.tree(dir, oid)).get(path) ?? null;
      },
      tags: async () => {
        const dir = repo();
        if (!dir) return [];
        const { listTags } = await import("isomorphic-git");
        return listTags({ fs: shell.fs, dir });
      },
      conflicts: async () => {
        const dir = repo();
        return dir ? (git.merging(dir)?.conflicts ?? []) : [];
      },
    };
    const printed = output.filter((l) => l.level !== "warn").map((l) => l.text);
    testResults = [];
    for (const test of tests) {
      if (error) {
        testResults.push({
          name: test.name,
          passed: false,
          error: "Fix the error in your code first.",
        });
        continue;
      }
      try {
        const check = new Function(
          "file",
          "exists",
          "isDir",
          "ls",
          "cwd",
          "run",
          "git",
          "commands",
          "status",
          "__output",
          `return (async () => (${test.check}))();`,
        );
        const passed = await check(
          file,
          exists,
          isDir,
          ls,
          shell.display(),
          run,
          gitApi,
          commands,
          shell.status,
          printed,
        );
        testResults.push({ name: test.name, passed: Boolean(passed) });
      } catch (caught) {
        const e = caught as Error;
        testResults.push({
          name: test.name,
          passed: false,
          error: `${e.name}: ${e.message}`,
        });
      }
    }
  }

  return { output, error, tests: testResults };
}

class Stopped {}
