/**
 * `git` for the practice terminal: real repositories (isomorphic-git) in the
 * in-memory filesystem, with the commands and messages of git 2.4x for what
 * lessons teach. Commits get times from a sandbox clock, so the same steps
 * always make the same commit hashes.
 */
import "./buffer-global";

import * as git from "isomorphic-git";

import { countChanges, hunks } from "./diff";
import { dirname, FsError, normalize } from "./memfs";
import { flags, type CommandContext, type Shell } from "./shell";

const DEFAULT_NAME = "Panda";
const DEFAULT_EMAIL = "panda@pandadev.dev";
const decoder = new TextDecoder();

/** Commands lessons will need later: a clear message instead of "not a git command". */
const LATER = new Set([
  "reset",
  "revert",
  "rebase",
  "stash",
  "cherry-pick",
  "remote",
  "clone",
  "push",
  "pull",
  "fetch",
  "bisect",
  "reflog",
  "blame",
]);

/** A git failure with git's exit code (128 for "fatal"). */
class GitExit {
  constructor(
    public code: number,
    public message = "",
  ) {}
}
const fatal = (message: string): never => {
  throw new GitExit(128, `fatal: ${message}\n`);
};

/** Short status codes like `git status -s`: "A ", " M", "??", "UU". */
export type ShortStatus = Record<string, string>;

export class GitSandbox {
  /** `git config --global` values */
  readonly global = new Map<string, string>();
  /** Seconds since 1970 for the next commit: one minute apart. */
  private clock = Date.UTC(2026, 0, 5, 9, 0, 0) / 1000;

  constructor(readonly shell: Shell) {}

  get fs() {
    return this.shell.fs;
  }

  /** The repository folder containing `path` (default: where you are), or null. */
  repoOf(path = this.shell.cwd): string | null {
    let dir = normalize(path);
    while (true) {
      if (this.fs.isDir(`${dir === "/" ? "" : dir}/.git`)) return dir;
      if (dir === "/") return null;
      dir = dirname(dir);
    }
  }

  private nextTime() {
    this.clock += 60;
    return this.clock;
  }

  async identity(dir: string) {
    const local = async (key: string) =>
      (await git.getConfig({ fs: this.fs, dir, path: key })) as
        string | undefined;
    return {
      name:
        (await local("user.name")) ??
        this.global.get("user.name") ??
        DEFAULT_NAME,
      email:
        (await local("user.email")) ??
        this.global.get("user.email") ??
        DEFAULT_EMAIL,
    };
  }

  async signature(dir: string) {
    return {
      ...(await this.identity(dir)),
      timestamp: this.nextTime(),
      timezoneOffset: 0,
    };
  }

  async head(dir: string): Promise<string | null> {
    try {
      return await git.resolveRef({ fs: this.fs, dir, ref: "HEAD" });
    } catch {
      return null;
    }
  }

  async branch(dir: string) {
    return (
      (await git.currentBranch({ fs: this.fs, dir, fullname: false })) ?? null
    );
  }

  async branches(dir: string) {
    return (await git.listBranches({ fs: this.fs, dir })).sort();
  }

  /** State files of a merge that stopped on conflicts. */
  merging(dir: string) {
    const head = `${dir}/.git/MERGE_HEAD`;
    if (!this.fs.isFile(head)) return null;
    const conflicts = `${dir}/.git/PANDA_CONFLICTS`;
    return {
      theirs: this.fs.readText(head).trim(),
      message: this.fs.isFile(`${dir}/.git/MERGE_MSG`)
        ? this.fs.readText(`${dir}/.git/MERGE_MSG`)
        : "Merge",
      conflicts: this.fs.isFile(conflicts)
        ? this.fs.readText(conflicts).split("\n").filter(Boolean)
        : [],
    };
  }

  private endMerge(dir: string) {
    for (const name of ["MERGE_HEAD", "MERGE_MSG", "PANDA_CONFLICTS"]) {
      const path = `${dir}/.git/${name}`;
      if (this.fs.exists(path)) this.fs.unlink(path);
    }
  }

  resolved(dir: string, paths: string[]) {
    const state = this.merging(dir);
    if (!state) return;
    const left = state.conflicts.filter((p) => !paths.includes(p));
    this.fs.writeFile(`${dir}/.git/PANDA_CONFLICTS`, left.join("\n"));
  }

  /** "XY" codes for every changed or untracked file, like `git status -s`. */
  async shortStatus(dir: string): Promise<ShortStatus> {
    const rows = await git.statusMatrix({ fs: this.fs, dir });
    const conflicts = this.merging(dir)?.conflicts ?? [];
    const out: ShortStatus = {};
    for (const [path, head, work, stage] of rows) {
      if (conflicts.includes(path)) {
        out[path] = "UU";
        continue;
      }
      if (stage === 0 && head === 0) {
        if (work) out[path] = "??";
        continue;
      }
      const x = head === 0 ? "A" : stage === 0 ? "D" : stage !== 1 ? "M" : " ";
      const y =
        stage === 0
          ? " "
          : work === 0
            ? "D"
            : stage === 3 || (stage === 1 && work === 2)
              ? "M"
              : " ";
      if (stage === 0 && head === 1 && work) {
        // Removed from git but still on disk: deleted + untracked.
        out[path] = "D ";
        continue;
      }
      if (x !== " " || y !== " ") out[path] = `${x}${y}`;
    }
    return out;
  }

  /** Every file of a commit (or none), as path → text. */
  async tree(dir: string, ref: string | null): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    if (!ref) return files;
    await git.walk({
      fs: this.fs,
      dir,
      trees: [git.TREE({ ref })],
      map: async (path, [entry]) => {
        if (path === "." || !entry) return;
        if ((await entry.type()) === "blob")
          files.set(
            path,
            decoder.decode((await entry.content()) ?? new Uint8Array()),
          );
        return true;
      },
    });
    return files;
  }

  /** Files of the staging area (the index), as path → text. */
  async stage(dir: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    await git.walk({
      fs: this.fs,
      dir,
      trees: [git.STAGE()],
      map: async (path, [entry]) => {
        if (path === "." || !entry) return;
        // Staged entries have no content of their own: read the blob they name.
        if ((await entry.type()) === "blob") {
          const { blob } = await git.readBlob({
            fs: this.fs,
            dir,
            oid: await entry.oid(),
          });
          files.set(path, decoder.decode(blob));
        }
        return true;
      },
    });
    return files;
  }

  /** Tracked files on disk, as path → text (untracked ones aren't diffed). */
  work(dir: string, tracked: Iterable<string>) {
    const files = new Map<string, string>();
    for (const path of tracked) {
      const full = `${dir}/${path}`;
      if (this.fs.isFile(full)) files.set(path, this.fs.readText(full));
    }
    return files;
  }

  async resolveCommit(dir: string, name: string): Promise<string | null> {
    // HEAD~2 / main^: walk first parents.
    const match = /^(.*?)((?:[~^]\d*)*)$/.exec(name);
    let base = match?.[1] || name;
    const steps = match?.[2] ?? "";
    if (base === "@") base = "HEAD";
    let oid: string | null = null;
    try {
      oid = await git.resolveRef({ fs: this.fs, dir, ref: base });
    } catch {
      if (/^[0-9a-f]{4,40}$/.test(base))
        try {
          oid = await git.expandOid({ fs: this.fs, dir, oid: base });
        } catch {
          oid = null;
        }
    }
    if (!oid) return null;
    // An annotated tag points at a tag object; follow it to the commit.
    try {
      const { type, object } = await git.readObject({ fs: this.fs, dir, oid });
      if (type === "tag") oid = (object as { object: string }).object;
    } catch {
      return null;
    }
    for (const step of steps.match(/[~^]\d*/g) ?? []) {
      const count = step.length > 1 ? Number(step.slice(1)) : 1;
      for (let i = 0; i < (step[0] === "~" ? count : 1); i++) {
        const { commit } = await git.readCommit({
          fs: this.fs,
          dir,
          oid: oid!,
        });
        const parent = commit.parent[step[0] === "^" ? count - 1 : 0];
        if (!parent) return null;
        oid = parent;
      }
    }
    return oid;
  }

  /** Branch and tag names (and HEAD) pointing at each commit, for `git log`. */
  async decorations(dir: string) {
    const labels = new Map<string, string[]>();
    const add = (oid: string, label: string) =>
      labels.set(oid, [...(labels.get(oid) ?? []), label]);
    const current = await this.branch(dir);
    const head = await this.head(dir);
    const branches = await this.branches(dir);
    if (head && !current) add(head, "HEAD");
    for (const name of [current, ...branches.filter((b) => b !== current)]) {
      if (!name) continue;
      const oid = await this.resolveCommit(dir, name);
      if (oid) add(oid, name === current ? `HEAD -> ${name}` : name);
    }
    for (const tag of await git.listTags({ fs: this.fs, dir })) {
      const oid = await this.resolveCommit(dir, tag);
      if (oid) add(oid, `tag: ${tag}`);
    }
    return labels;
  }

  async log(dir: string, ref = "HEAD") {
    const oid = await this.resolveCommit(dir, ref);
    if (!oid) return [];
    return git.log({ fs: this.fs, dir, ref: oid });
  }

  /** Commit (merges stopped on conflicts become two-parent commits). */
  async commit(
    dir: string,
    message: string,
    options: { amend?: boolean } = {},
  ) {
    const merge = this.merging(dir);
    const signature = await this.signature(dir);
    const head = await this.head(dir);
    const oid = await git.commit({
      fs: this.fs,
      dir,
      message,
      author: signature,
      committer: signature,
      amend: options.amend,
      ...(merge && head ? { parent: [head, merge.theirs] } : {}),
    });
    if (merge) this.endMerge(dir);
    return oid;
  }

  /** Command entry point: returns the exit code. */
  async run(ctx: CommandContext): Promise<number> {
    try {
      return await this.dispatch(ctx);
    } catch (error) {
      if (error instanceof GitExit) {
        if (error.message) ctx.io.err(error.message);
        return error.code;
      }
      if (error instanceof FsError) {
        ctx.io.err(`fatal: ${error.reason}\n`);
        return 128;
      }
      const e = error as { code?: string; message?: string };
      ctx.io.err(`fatal: ${e.message ?? String(error)}\n`);
      return 128;
    }
  }

  private async dispatch(ctx: CommandContext): Promise<number> {
    const [sub, ...args] = ctx.args;
    const { io } = ctx;
    if (!sub || sub === "help" || sub === "--help") {
      io.out(HELP);
      return sub ? 0 : 1;
    }
    if (sub === "--version" || sub === "version") {
      io.out("git version 2.47.1\n");
      return 0;
    }
    if (sub === "init") return this.init(ctx, args);
    if (sub === "config") return this.config(ctx, args);
    if (LATER.has(sub))
      throw new GitExit(
        1,
        `git: '${sub}' isn't in this practice terminal yet. It comes in later lessons.\n`,
      );
    const command = COMMANDS[sub];
    if (!command)
      throw new GitExit(
        1,
        `git: '${sub}' is not a git command. See 'git --help'.\n`,
      );
    const dir = this.repoOf();
    if (!dir)
      fatal("not a git repository (or any of the parent directories): .git");
    return command.call(this, ctx, args, dir!);
  }

  /** A path from where you are, as a path inside the repository ("" for its root). */
  rel(dir: string, path: string) {
    const full = this.shell.resolve(path);
    if (full !== dir && !full.startsWith(`${dir}/`))
      fatal(`${path}: '${path}' is outside repository at '${dir}'`);
    return full === dir ? "" : full.slice(dir.length + 1);
  }

  /** Repository paths shown relative to where you are, like git does. */
  shown(dir: string, path: string) {
    const here =
      this.shell.cwd === dir ? "" : this.shell.cwd.slice(dir.length + 1);
    if (!here) return path;
    const from = here.split("/");
    const to = path.split("/");
    while (from.length && to.length > 1 && from[0] === to[0]) {
      from.shift();
      to.shift();
    }
    return [...from.map(() => ".."), ...to].join("/");
  }

  private async init({ shell, io }: CommandContext, args: string[]) {
    const target = shell.resolve(args.find((a) => !a.startsWith("-")) ?? ".");
    const again = this.fs.isDir(`${target}/.git`);
    this.fs.mkdir(target, { recursive: true });
    await git.init({ fs: this.fs, dir: target, defaultBranch: "main" });
    io.out(
      `${again ? "Reinitialized existing" : "Initialized empty"} Git repository in ${target}/.git/\n`,
    );
    return 0;
  }

  private async config({ io }: CommandContext, args: string[]) {
    const global = args.includes("--global");
    const rest = args.filter((a) => a !== "--global" && a !== "--local");
    const dir = this.repoOf();
    if (rest[0] === "--list" || rest[0] === "-l") {
      for (const [key, value] of this.global) io.out(`${key}=${value}\n`);
      if (dir)
        for (const key of ["user.name", "user.email"]) {
          const value = await git.getConfig({ fs: this.fs, dir, path: key });
          if (value !== undefined) io.out(`${key}=${value}\n`);
        }
      return 0;
    }
    const [key, value] = rest;
    if (!key || !/^[a-z][\w-]*(\.[\w-]+)+$/i.test(key)) {
      throw new GitExit(
        1,
        key
          ? `error: invalid key: ${key}\n`
          : "usage: git config [--global] <name> [<value>]\n",
      );
    }
    // Reading works anywhere (the global value); setting needs a repository.
    if (!global && !dir && value !== undefined) fatal("not in a git directory");
    if (value === undefined) {
      const found =
        global || !dir
          ? this.global.get(key)
          : (((await git.getConfig({ fs: this.fs, dir, path: key })) as
              string | undefined) ?? this.global.get(key));
      if (found === undefined) return 1;
      io.out(`${found}\n`);
      return 0;
    }
    if (global) this.global.set(key, value);
    else await git.setConfig({ fs: this.fs, dir: dir!, path: key, value });
    return 0;
  }
}

type Sub = (
  this: GitSandbox,
  ctx: CommandContext,
  args: string[],
  dir: string,
) => Promise<number>;

const isTracked = async (sandbox: GitSandbox, dir: string, path: string) =>
  (await sandbox.stage(dir)).has(path);

const COMMANDS: Record<string, Sub> = {
  async status({ io }, args, dir) {
    const short = args.includes("-s") || args.includes("--short");
    const status = await this.shortStatus(dir);
    const paths = Object.keys(status).sort();
    if (short) {
      for (const path of collapseUntracked(
        status,
        paths,
        await this.stage(dir),
      ))
        io.out(`${status[path] ?? "??"} ${this.shown(dir, path)}\n`);
      return 0;
    }
    await longStatus(this, dir, io, "No commits yet");
    return 0;
  },

  async add({ io }, args, dir) {
    const parsed = flags("git add", args, "Avf", "", {
      all: "A",
      verbose: "v",
      force: "f",
    });
    if (typeof parsed === "string") throw new GitExit(129, parsed);
    let specs = parsed.rest;
    if (parsed.set.has("A") && !specs.length) specs = [dir];
    if (!specs.length) {
      throw new GitExit(
        0,
        "Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?\n",
      );
    }
    const rows = await git.statusMatrix({ fs: this.fs, dir });
    const done: string[] = [];
    const ignored: string[] = [];
    for (const spec of specs) {
      const prefix = spec === dir ? "" : this.rel(dir, spec);
      const matches = rows.filter(
        ([path]) => !prefix || path === prefix || path.startsWith(`${prefix}/`),
      );
      if (!matches.length) {
        if (
          prefix &&
          this.fs.isFile(`${dir}/${prefix}`) &&
          (await git.isIgnored({ fs: this.fs, dir, filepath: prefix }))
        ) {
          if (parsed.set.has("f")) {
            await git.add({ fs: this.fs, dir, filepath: prefix, force: true });
            done.push(prefix);
          } else ignored.push(spec);
          continue;
        }
        fatal(`pathspec '${spec}' did not match any files`);
      }
      for (const [path, head, work, stage] of matches) {
        if (work === 0) {
          if (head || stage)
            await git.remove({ fs: this.fs, dir, filepath: path });
        } else await git.add({ fs: this.fs, dir, filepath: path });
        done.push(path);
        if (parsed.set.has("v")) io.out(`add '${path}'\n`);
      }
    }
    this.resolved(dir, done);
    if (ignored.length)
      throw new GitExit(
        1,
        `The following paths are ignored by one of your .gitignore files:\n${ignored.join("\n")}\nhint: Use -f if you really want to add them.\n`,
      );
    return 0;
  },

  async commit({ io }, args, dir) {
    const messages: string[] = [];
    let all = false;
    let amend = false;
    let allowEmpty = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === "-m" || arg === "--message") {
        if (args[i + 1] === undefined)
          throw new GitExit(129, "error: switch `m' requires a value\n");
        messages.push(args[++i]);
      } else if (arg.startsWith("--message=")) messages.push(arg.slice(10));
      else if (/^-a+m$/.test(arg) || arg === "-am") {
        all = true;
        if (args[i + 1] === undefined)
          throw new GitExit(129, "error: switch `m' requires a value\n");
        messages.push(args[++i]);
      } else if (arg.startsWith("-m") && arg.length > 2)
        messages.push(arg.slice(2));
      else if (arg === "-a" || arg === "--all") all = true;
      else if (arg === "--amend") amend = true;
      else if (arg === "--allow-empty") allowEmpty = true;
      else if (arg === "--no-edit") continue;
      else if (arg.startsWith("-"))
        throw new GitExit(
          129,
          `error: unknown option \`${arg.replace(/^-+/, "")}'\n`,
        );
      // Like git, other words are file names: `git commit -m Add soup`
      // (no quotes) reads "soup" as a file.
      else
        throw new GitExit(
          1,
          `error: pathspec '${arg}' did not match any file(s) known to git\n`,
        );
    }
    const merge = this.merging(dir);
    if (merge?.conflicts.length)
      throw new GitExit(
        128,
        "error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add/rm <file>'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.\n",
      );
    if (all) {
      const rows = await git.statusMatrix({ fs: this.fs, dir });
      for (const [path, head, work, stage] of rows) {
        if (!head && !stage) continue; // -a leaves untracked files alone
        if (work === 0) await git.remove({ fs: this.fs, dir, filepath: path });
        else if (work === 2)
          await git.add({ fs: this.fs, dir, filepath: path });
      }
    }
    const head = await this.head(dir);
    let message = messages.join("\n\n");
    if (!message && merge) message = merge.message;
    if (!message && amend && head)
      message = (await git.readCommit({ fs: this.fs, dir, oid: head })).commit
        .message;
    if (!message.trim())
      throw new GitExit(
        1,
        'Aborting commit due to empty commit message.\nhint: This terminal can\'t open an editor: write the message with -m, like git commit -m "Add the menu"\n',
      );
    if (amend && !head) fatal("You have nothing to amend.");
    const status = await this.shortStatus(dir);
    const staged = Object.values(status).some(
      (code) => code[0] !== " " && code[0] !== "?",
    );
    if (!staged && !amend && !allowEmpty && !merge) {
      // Like git: the same report as `git status`, and exit code 1.
      await longStatus(this, dir, io, "Initial commit");
      return 1;
    }
    const parent =
      amend && head
        ? ((await git.readCommit({ fs: this.fs, dir, oid: head })).commit
            .parent[0] ?? null)
        : head;
    const oid = await this.commit(
      dir,
      message.endsWith("\n") ? message : `${message}\n`,
      { amend },
    );
    const branch = await this.branch(dir);
    const where = branch ?? "detached HEAD";
    io.out(
      `[${where}${parent ? "" : " (root-commit)"} ${oid.slice(0, 7)}] ${message.split("\n")[0]}\n`,
    );
    // Like git, a merge commit gets no summary of changed files.
    if (!merge) io.out(await summary(this, dir, parent, oid, true));
    return 0;
  },

  async log({ io }, args, dir) {
    const parsed = flags("git log", args, "", "n", {
      oneline: "o",
      all: "a",
      "max-count": "n",
    });
    if (typeof parsed === "string")
      throw new GitExit(128, parsed.replace("git log: ", "fatal: "));
    const oneline = parsed.set.has("o");
    const max = parsed.values.has("n")
      ? Number(parsed.values.get("n"))
      : Infinity;
    if (args.includes("--graph"))
      throw new GitExit(
        1,
        "git log --graph isn't in this practice terminal yet: the picture under the output shows the graph.\n",
      );
    const head = await this.head(dir);
    let commits: Awaited<ReturnType<typeof git.log>> = [];
    if (parsed.set.has("a")) {
      const seen = new Map<string, (typeof commits)[number]>();
      for (const name of await this.branches(dir))
        for (const c of await this.log(dir, name)) seen.set(c.oid, c);
      if (head) for (const c of await this.log(dir, head)) seen.set(c.oid, c);
      commits = [...seen.values()].sort(
        (a, b) => b.commit.committer.timestamp - a.commit.committer.timestamp,
      );
    } else {
      const ref = parsed.rest[0] ?? "HEAD";
      if (!head && ref === "HEAD")
        fatal(
          `your current branch '${(await this.branch(dir)) ?? "main"}' does not have any commits yet`,
        );
      const oid = await this.resolveCommit(dir, ref);
      if (!oid)
        fatal(
          `ambiguous argument '${ref}': unknown revision or path not in the working tree.`,
        );
      commits = await this.log(dir, oid!);
    }
    const labels = await this.decorations(dir);
    commits.slice(0, max).forEach((c, i) => {
      const tags = labels.get(c.oid);
      const decoration = tags ? ` (${tags.join(", ")})` : "";
      const message = c.commit.message.replace(/\n+$/, "");
      if (oneline) {
        io.out(`${c.oid.slice(0, 7)}${decoration} ${message.split("\n")[0]}\n`);
        return;
      }
      io.out(`${i ? "\n" : ""}${formatCommit(c, decoration)}`);
    });
    return 0;
  },

  async show({ io }, args, dir) {
    const ref = args.find((a) => !a.startsWith("-")) ?? "HEAD";
    const oid = await this.resolveCommit(dir, ref);
    if (!oid)
      fatal(
        `ambiguous argument '${ref}': unknown revision or path not in the working tree.`,
      );
    const [entry] = await git.log({ fs: this.fs, dir, ref: oid!, depth: 1 });
    const labels = await this.decorations(dir);
    const tags = labels.get(oid!);
    io.out(formatCommit(entry, tags ? ` (${tags.join(", ")})` : ""));
    const before = await this.tree(dir, entry.commit.parent[0] ?? null);
    const after = await this.tree(dir, oid!);
    if (args.includes("--stat")) {
      const stat = await statText(before, after);
      if (stat) io.out(`\n${stat}`);
      return 0;
    }
    const patch = await patchText(before, after);
    if (patch) io.out(`\n${patch}`);
    return 0;
  },

  async diff({ io }, args, dir) {
    const staged = args.includes("--staged") || args.includes("--cached");
    const stat = args.includes("--stat");
    const paths = args
      .filter((a) => !a.startsWith("-") && a !== "--")
      .map((p) => this.rel(dir, p));
    const index = await this.stage(dir);
    let before: Map<string, string>;
    let after: Map<string, string>;
    if (staged) {
      before = await this.tree(dir, await this.head(dir));
      after = index;
    } else {
      before = index;
      after = this.work(dir, index.keys());
    }
    const keep = (path: string) =>
      !paths.length ||
      paths.some((p) => !p || path === p || path.startsWith(`${p}/`));
    for (const map of [before, after])
      for (const path of [...map.keys()]) if (!keep(path)) map.delete(path);
    if (stat) {
      io.out(await statText(before, after));
      return 0;
    }
    io.out(await patchText(before, after));
    return 0;
  },

  async restore(_ctx, args, dir) {
    const staged = args.includes("--staged") || args.includes("-S");
    const paths = args.filter((a) => !a.startsWith("-"));
    if (!paths.length)
      throw new GitExit(128, "fatal: you must specify path(s) to restore\n");
    const index = await this.stage(dir);
    const head = await this.tree(dir, await this.head(dir));
    for (const spec of paths) {
      const prefix = this.rel(dir, spec);
      const matches = [...new Set([...index.keys(), ...head.keys()])].filter(
        (p) => !prefix || p === prefix || p.startsWith(`${prefix}/`),
      );
      if (!matches.length)
        throw new GitExit(
          1,
          `error: pathspec '${spec}' did not match any file(s) known to git\n`,
        );
      for (const path of matches) {
        if (staged) await git.resetIndex({ fs: this.fs, dir, filepath: path });
        else if (index.has(path))
          this.fs.writeFile(`${dir}/${path}`, index.get(path)!);
      }
    }
    return 0;
  },

  async rm({ io }, args, dir) {
    const cached = args.includes("--cached");
    const recursive = args.includes("-r");
    const paths = args.filter((a) => !a.startsWith("-"));
    if (!paths.length)
      throw new GitExit(128, "usage: git rm [--cached] [-r] <file>...\n");
    const index = await this.stage(dir);
    for (const spec of paths) {
      const prefix = this.rel(dir, spec);
      const matches = [...index.keys()].filter(
        (p) => p === prefix || p.startsWith(`${prefix}/`),
      );
      if (!matches.length) fatal(`pathspec '${spec}' did not match any files`);
      if (matches.some((p) => p !== prefix) && !recursive)
        fatal(`not removing '${spec}' recursively without -r`);
      for (const path of matches) {
        await git.remove({ fs: this.fs, dir, filepath: path });
        if (!cached && this.fs.exists(`${dir}/${path}`))
          this.fs.unlink(`${dir}/${path}`);
        io.out(`rm '${path}'\n`);
      }
    }
    return 0;
  },

  async mv(_ctx, args, dir) {
    const [from, to] = args.filter((a) => !a.startsWith("-"));
    if (!from || !to)
      throw new GitExit(129, "usage: git mv <source> <destination>\n");
    const source = this.rel(dir, from);
    if (!(await isTracked(this, dir, source)))
      fatal(`not under version control, source=${from}, destination=${to}`);
    let target = this.rel(dir, to);
    if (this.fs.isDir(`${dir}/${target}`))
      target = `${target}/${source.split("/").pop()}`.replace(/^\//, "");
    this.fs.rename(`${dir}/${source}`, `${dir}/${target}`);
    await git.remove({ fs: this.fs, dir, filepath: source });
    await git.add({ fs: this.fs, dir, filepath: target });
    return 0;
  },

  async branch({ io }, args, dir) {
    const del = args.find((a) => a === "-d" || a === "-D" || a === "--delete");
    const names = args.filter((a) => !a.startsWith("-"));
    const current = await this.branch(dir);
    const head = await this.head(dir);
    if (del) {
      for (const name of names) {
        if (!(await this.branches(dir)).includes(name))
          throw new GitExit(1, `error: branch '${name}' not found\n`);
        if (name === current)
          throw new GitExit(
            1,
            `error: cannot delete branch '${name}' used by worktree at '${dir}'\n`,
          );
        const oid = (await this.resolveCommit(dir, name))!;
        const merged =
          oid === head ||
          (head
            ? await git.isDescendent({
                fs: this.fs,
                dir,
                oid: head,
                ancestor: oid,
              })
            : false);
        if (!merged && del !== "-D")
          throw new GitExit(
            1,
            `error: the branch '${name}' is not fully merged\nhint: If you are sure you want to delete it, run 'git branch -D ${name}'\n`,
          );
        await git.deleteBranch({ fs: this.fs, dir, ref: name });
        io.out(`Deleted branch ${name} (was ${oid.slice(0, 7)}).\n`);
      }
      return 0;
    }
    if (!names.length) {
      if (!current && head)
        io.out(`* (HEAD detached at ${head.slice(0, 7)})\n`);
      for (const name of await this.branches(dir))
        io.out(`${name === current ? "*" : " "} ${name}\n`);
      return 0;
    }
    if (!head) fatal(`not a valid object name: '${current ?? "main"}'`);
    const [name, start] = names;
    const at = start ? await this.resolveCommit(dir, start) : head;
    if (!at) fatal(`not a valid object name: '${start}'`);
    await createBranch(this, dir, name, at!);
    return 0;
  },

  async switch(ctx, args, dir) {
    const create = args.find(
      (a) => a === "-c" || a === "--create" || a === "-C",
    );
    const detach = args.includes("--detach");
    const [name, start] = args.filter((a) => !a.startsWith("-"));
    if (!name) fatal("missing branch or commit argument");
    if (create)
      return checkoutBranch(this, ctx, dir, name, { create: true, start });
    if ((await this.branches(dir)).includes(name))
      return checkoutBranch(this, ctx, dir, name, {});
    if (name === "-") return checkoutBranch(this, ctx, dir, name, {});
    const oid = await this.resolveCommit(dir, name);
    if (oid && detach) return checkoutDetached(this, ctx, dir, oid);
    if (oid)
      throw new GitExit(
        128,
        `fatal: a branch is expected, got commit '${name}'\nhint: If you want to detach HEAD at the commit, try again with the --detach option.\n`,
      );
    fatal(`invalid reference: ${name}`);
    return 128;
  },

  async checkout(ctx, args, dir) {
    const create = args.find((a) => a === "-b" || a === "-B");
    const dash = args.indexOf("--");
    const words = args.filter(
      (a, i) => !a.startsWith("-") && (dash === -1 || i < dash),
    );
    const files = dash === -1 ? [] : args.slice(dash + 1);
    if (create) {
      if (!words[0])
        throw new GitExit(129, "error: switch `b' requires a value\n");
      return checkoutBranch(this, ctx, dir, words[0], {
        create: true,
        start: words[1],
      });
    }
    if (!files.length && words.length === 1) {
      const name = words[0];
      if ((await this.branches(dir)).includes(name))
        return checkoutBranch(this, ctx, dir, name, {});
      const oid = await this.resolveCommit(dir, name);
      if (oid && !this.fs.exists(this.shell.resolve(name)))
        return checkoutDetached(this, ctx, dir, oid);
    }
    // git checkout [--] file…: put files back as they are in the staging area.
    const targets = files.length ? files : words;
    if (!targets.length) fatal("you must specify path(s) to restore");
    const index = await this.stage(dir);
    for (const spec of targets) {
      const prefix = this.rel(dir, spec);
      const matches = [...index.keys()].filter(
        (p) => !prefix || p === prefix || p.startsWith(`${prefix}/`),
      );
      if (!matches.length)
        throw new GitExit(
          1,
          `error: pathspec '${spec}' did not match any file(s) known to git\n`,
        );
      for (const path of matches)
        this.fs.writeFile(`${dir}/${path}`, index.get(path)!);
    }
    ctx.io.out(
      `Updated ${targets.length} path${targets.length === 1 ? "" : "s"} from the index\n`,
    );
    return 0;
  },

  async merge({ io }, args, dir) {
    if (args.includes("--abort")) {
      const merge = this.merging(dir);
      if (!merge) fatal("There is no merge to abort (MERGE_HEAD missing).");
      const branch = await this.branch(dir);
      await git.checkout({
        fs: this.fs,
        dir,
        ref: branch ?? (await this.head(dir))!,
        force: true,
      });
      this.fs.unlink(`${dir}/.git/MERGE_HEAD`);
      for (const name of ["MERGE_MSG", "PANDA_CONFLICTS"])
        if (this.fs.exists(`${dir}/.git/${name}`))
          this.fs.unlink(`${dir}/.git/${name}`);
      return 0;
    }
    if (this.merging(dir))
      fatal(
        "You have not concluded your merge (MERGE_HEAD exists).\nPlease, commit your changes before you merge.",
      );
    const noFf = args.includes("--no-ff");
    const name = args.find((a) => !a.startsWith("-"));
    if (!name) fatal("No remote for the current branch.");
    const current = await this.branch(dir);
    const head = await this.head(dir);
    const theirs = await this.resolveCommit(dir, name!);
    if (!theirs)
      throw new GitExit(1, `merge: ${name} - not something we can merge\n`);
    if (!current || !head)
      fatal(
        "merging into a detached HEAD or an empty branch isn't supported here",
      );
    if (
      theirs === head ||
      (await git.isDescendent({
        fs: this.fs,
        dir,
        oid: head!,
        ancestor: theirs!,
      }))
    ) {
      io.out("Already up to date.\n");
      return 0;
    }
    // Like git: refuse when uncommitted changes to tracked files could be lost.
    const dirty = Object.entries(await this.shortStatus(dir))
      .filter(([, c]) => c !== "??")
      .map(([p]) => p);
    if (dirty.length)
      throw new GitExit(
        1,
        `error: Your local changes to the following files would be overwritten by merge:\n${dirty.map((p) => `\t${p}`).join("\n")}\nPlease commit your changes or stash them before you merge.\nAborting\n`,
      );
    const message = `Merge branch '${name}'${current === "main" || current === "master" ? "" : ` into ${current}`}`;
    const signature = await this.signature(dir);
    const before = await this.tree(dir, head);
    try {
      const result = await git.merge({
        fs: this.fs,
        dir,
        ours: current!,
        // The name (not the hash) labels the conflict: >>>>>>> feature
        theirs: name!,
        fastForward: !noFf,
        abortOnConflict: false,
        message,
        author: signature,
        committer: signature,
      });
      await git.checkout({ fs: this.fs, dir, ref: current!, force: true });
      const after = await this.tree(dir, result.oid ?? theirs!);
      if (result.fastForward) {
        io.out(
          `Updating ${head!.slice(0, 7)}..${theirs!.slice(0, 7)}\nFast-forward\n`,
        );
      } else io.out("Merge made by the 'ort' strategy.\n");
      io.out(await statText(before, after, true));
      return 0;
    } catch (error) {
      if ((error as { code?: string }).code !== "MergeConflictError")
        throw error;
      const data = (
        error as {
          data: {
            filepaths: string[];
            bothModified: string[];
            deleteByUs: string[];
            deleteByTheirs: string[];
          };
        }
      ).data;
      const conflicts = data.filepaths;
      for (const path of conflicts) {
        const full = `${dir}/${path}`;
        if (this.fs.isFile(full))
          this.fs.writeFile(
            full,
            this.fs
              .readText(full)
              .replace(
                new RegExp(`^<{7} ${escapeRe(current!)}$`, "gm"),
                "<<<<<<< HEAD",
              ),
          );
      }
      this.fs.writeFile(`${dir}/.git/MERGE_HEAD`, `${theirs}\n`);
      this.fs.writeFile(`${dir}/.git/MERGE_MSG`, `${message}\n`);
      this.fs.writeFile(`${dir}/.git/PANDA_CONFLICTS`, conflicts.join("\n"));
      for (const path of conflicts) {
        io.out(`Auto-merging ${path}\n`);
        const kind =
          data.deleteByUs.includes(path) || data.deleteByTheirs.includes(path)
            ? "modify/delete"
            : "content";
        io.out(`CONFLICT (${kind}): Merge conflict in ${path}\n`);
      }
      io.out(
        "Automatic merge failed; fix conflicts and then commit the result.\n",
      );
      return 1;
    }
  },

  async tag({ io }, args, dir) {
    const del = args.includes("-d");
    const annotated = args.includes("-a") || args.includes("-m");
    const message = args[args.indexOf("-m") + 1];
    const names = args.filter(
      (a, i) => !a.startsWith("-") && args[i - 1] !== "-m",
    );
    if (!names.length) {
      for (const tag of (await git.listTags({ fs: this.fs, dir })).sort())
        io.out(`${tag}\n`);
      return 0;
    }
    const [name, target] = names;
    if (del) {
      const oid = await this.resolveCommit(dir, name);
      if (!oid) throw new GitExit(1, `error: tag '${name}' not found.\n`);
      await git.deleteTag({ fs: this.fs, dir, ref: name });
      io.out(`Deleted tag '${name}' (was ${oid.slice(0, 7)})\n`);
      return 0;
    }
    const oid = await this.resolveCommit(dir, target ?? "HEAD");
    if (!oid) fatal(`Failed to resolve '${target ?? "HEAD"}' as a valid ref.`);
    if ((await git.listTags({ fs: this.fs, dir })).includes(name))
      fatal(`tag '${name}' already exists`);
    if (annotated) {
      if (!message)
        throw new GitExit(
          1,
          'error: this terminal can\'t open an editor: add -m "message"\n',
        );
      await git.annotatedTag({
        fs: this.fs,
        dir,
        ref: name,
        object: oid!,
        message,
        tagger: await this.signature(dir),
      });
    } else await git.tag({ fs: this.fs, dir, ref: name, object: oid! });
    return 0;
  },
};

/**
 * `git status` (and `git commit` with nothing staged), spaced like git:
 * each section is followed by a blank line; "No commits yet" (or "Initial
 * commit", for git commit) sits between blank lines.
 */
async function longStatus(
  sandbox: GitSandbox,
  dir: string,
  io: CommandContext["io"],
  intro: "No commits yet" | "Initial commit",
) {
  const status = await sandbox.shortStatus(dir);
  const paths = Object.keys(status).sort();
  const index = await sandbox.stage(dir);
  const branch = await sandbox.branch(dir);
  const head = await sandbox.head(dir);
  const merge = sandbox.merging(dir);
  io.out(
    branch
      ? `On branch ${branch}\n`
      : `HEAD detached at ${head?.slice(0, 7)}\n`,
  );
  if (merge)
    io.out(
      merge.conflicts.length
        ? 'You have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)\n\n'
        : 'All conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)\n\n',
    );
  if (!head) io.out(`\n${intro}\n\n`);
  const staged = paths.filter(
    (p) => status[p][0] !== " " && status[p][0] !== "?" && status[p] !== "UU",
  );
  const unmerged = paths.filter((p) => status[p] === "UU");
  const unstaged = paths.filter(
    (p) => status[p][1] === "M" || status[p][1] === "D",
  );
  const untracked = collapseUntracked(
    status,
    paths.filter((p) => status[p] === "??"),
    index,
  );
  const label: Record<string, string> = {
    A: "new file:   ",
    M: "modified:   ",
    D: "deleted:    ",
  };
  const shown = (p: string) => sandbox.shown(dir, p);
  if (staged.length) {
    io.out(
      `Changes to be committed:\n  (use "${head ? "git restore --staged <file>..." : "git rm --cached <file>..."}" to unstage)\n`,
    );
    for (const p of staged) io.out(`\t${label[status[p][0]]}${shown(p)}\n`);
    io.out("\n");
  }
  if (unmerged.length) {
    io.out('Unmerged paths:\n  (use "git add <file>..." to mark resolution)\n');
    for (const p of unmerged) io.out(`\tboth modified:   ${shown(p)}\n`);
    io.out("\n");
  }
  if (unstaged.length) {
    io.out(
      'Changes not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n',
    );
    for (const p of unstaged) io.out(`\t${label[status[p][1]]}${shown(p)}\n`);
    io.out("\n");
  }
  if (untracked.length) {
    io.out(
      'Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n',
    );
    for (const p of untracked) io.out(`\t${shown(p)}\n`);
    io.out("\n");
  }
  // With something staged (or a merge to finish), git adds no summary line.
  if (staged.length || (merge && !merge.conflicts.length)) return;
  if (unstaged.length || unmerged.length)
    io.out(
      'no changes added to commit (use "git add" and/or "git commit -a")\n',
    );
  else if (untracked.length)
    io.out(
      'nothing added to commit but untracked files present (use "git add" to track)\n',
    );
  else if (!head)
    io.out(
      'nothing to commit (create/copy files and use "git add" to track)\n',
    );
  else io.out("nothing to commit, working tree clean\n");
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** git's default date: "Mon Jan 5 09:01:00 2026 +0000" (the day isn't padded). */
function gitDate(ms: number) {
  const d = new Date(ms);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${DAY_NAMES[d.getUTCDay()]} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())} ${d.getUTCFullYear()} +0000`;
}

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Untracked files inside a folder git doesn't track at all show as "folder/". */
function collapseUntracked(
  status: ShortStatus,
  paths: string[],
  index: Map<string, string>,
) {
  const tracked = [...index.keys()];
  const out = new Set<string>();
  for (const path of paths) {
    if (status[path] !== "??") {
      out.add(path);
      continue;
    }
    const parts = path.split("/");
    let shown = path;
    for (let i = 1; i < parts.length; i++) {
      const folder = parts.slice(0, i).join("/");
      if (!tracked.some((t) => t.startsWith(`${folder}/`))) {
        shown = `${folder}/`;
        break;
      }
    }
    out.add(shown);
  }
  return [...out].sort();
}

function formatCommit(
  entry: Awaited<ReturnType<typeof git.log>>[number],
  decoration: string,
) {
  const { commit } = entry;
  const lines = [`commit ${entry.oid}${decoration}`];
  if (commit.parent.length > 1)
    lines.push(`Merge: ${commit.parent.map((p) => p.slice(0, 7)).join(" ")}`);
  lines.push(`Author: ${commit.author.name} <${commit.author.email}>`);
  lines.push(`Date:   ${gitDate(commit.author.timestamp * 1000)}`);
  lines.push("");
  for (const line of commit.message.replace(/\n+$/, "").split("\n"))
    lines.push(line ? `    ${line}` : "");
  return `${lines.join("\n")}\n`;
}

async function blobId(text: string) {
  const { oid } = await git.hashBlob({ object: text });
  return oid.slice(0, 7);
}

/** `git diff`-style patches between two snapshots (path → text). */
async function patchText(
  before: Map<string, string>,
  after: Map<string, string>,
) {
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  let out = "";
  for (const path of paths) {
    const a = before.get(path);
    const b = after.get(path);
    if (a === b) continue;
    out += `diff --git a/${path} b/${path}\n`;
    if (a === undefined)
      out += `new file mode 100644\nindex 0000000..${await blobId(b!)}\n--- /dev/null\n+++ b/${path}\n`;
    else if (b === undefined)
      out += `deleted file mode 100644\nindex ${await blobId(a)}..0000000\n--- a/${path}\n+++ /dev/null\n`;
    else
      out += `index ${await blobId(a)}..${await blobId(b)} 100644\n--- a/${path}\n+++ b/${path}\n`;
    for (const line of hunks(a ?? "", b ?? "")) out += `${line}\n`;
  }
  return out;
}

/** " app.py | 2 +-" lines and the "1 file changed, …" total. */
async function statText(
  before: Map<string, string>,
  after: Map<string, string>,
  withModes = false,
) {
  const paths = [...new Set([...before.keys(), ...after.keys()])]
    .sort()
    .filter((p) => before.get(p) !== after.get(p));
  if (!paths.length) return "";
  const rows = paths.map((path) => ({
    path,
    ...countChanges(before.get(path) ?? "", after.get(path) ?? ""),
  }));
  const width = Math.max(...rows.map((r) => r.path.length));
  const numWidth = Math.max(
    ...rows.map((r) => String(r.insertions + r.deletions).length),
  );
  let out = "";
  for (const r of rows)
    out += ` ${r.path.padEnd(width)} | ${String(r.insertions + r.deletions).padStart(numWidth)} ${"+".repeat(r.insertions)}${"-".repeat(r.deletions)}\n`;
  out += totals(rows);
  if (withModes)
    for (const path of paths) {
      if (!before.has(path)) out += ` create mode 100644 ${path}\n`;
      else if (!after.has(path)) out += ` delete mode 100644 ${path}\n`;
    }
  return out;
}

function totals(rows: { insertions: number; deletions: number }[]) {
  const insertions = rows.reduce((s, r) => s + r.insertions, 0);
  const deletions = rows.reduce((s, r) => s + r.deletions, 0);
  let out = ` ${rows.length} file${rows.length === 1 ? "" : "s"} changed`;
  if (insertions || !deletions)
    out += `, ${insertions} insertion${insertions === 1 ? "" : "s"}(+)`;
  if (deletions)
    out += `, ${deletions} deletion${deletions === 1 ? "" : "s"}(-)`;
  return `${out}\n`;
}

/** The lines `git commit` prints after "[main abc1234] message". */
async function summary(
  sandbox: GitSandbox,
  dir: string,
  parent: string | null,
  oid: string,
  modes: boolean,
) {
  const before = await sandbox.tree(dir, parent);
  const after = await sandbox.tree(dir, oid);
  const paths = [...new Set([...before.keys(), ...after.keys()])]
    .sort()
    .filter((p) => before.get(p) !== after.get(p));
  const rows = paths.map((p) =>
    countChanges(before.get(p) ?? "", after.get(p) ?? ""),
  );
  let out = rows.length ? totals(rows) : " 0 files changed\n";
  if (modes)
    for (const path of paths) {
      if (!before.has(path)) out += ` create mode 100644 ${path}\n`;
      else if (!after.has(path)) out += ` delete mode 100644 ${path}\n`;
    }
  return out;
}

async function createBranch(
  sandbox: GitSandbox,
  dir: string,
  name: string,
  at: string,
) {
  if ((await sandbox.branches(dir)).includes(name))
    fatal(`a branch named '${name}' already exists`);
  if (
    !/^(?!-)(?!.*\.\.)(?!.*\/$)(?!.*\.lock$)[^\s~^:?*[\\]+$/.test(name) ||
    name === "HEAD"
  )
    fatal(`'${name}' is not a valid branch name`);
  await git.writeRef({
    fs: sandbox.fs,
    dir,
    ref: `refs/heads/${name}`,
    value: at,
  });
}

async function checkoutBranch(
  sandbox: GitSandbox,
  { io }: CommandContext,
  dir: string,
  name: string,
  options: { create?: boolean; start?: string },
) {
  const current = await sandbox.branch(dir);
  if (options.create) {
    const head = await sandbox.head(dir);
    const at = options.start
      ? await sandbox.resolveCommit(dir, options.start)
      : head;
    if (!at) {
      if (!head && !options.start) {
        // A new branch before the first commit: just point HEAD at it.
        await git.writeRef({
          fs: sandbox.fs,
          dir,
          ref: "HEAD",
          value: `refs/heads/${name}`,
          symbolic: true,
          force: true,
        });
        io.out(`Switched to a new branch '${name}'\n`);
        return 0;
      }
      fatal(`invalid reference: ${options.start}`);
    }
    await createBranch(sandbox, dir, name, at!);
  } else if (name === current) {
    io.out(`Already on '${name}'\n`);
    return 0;
  }
  try {
    await git.checkout({ fs: sandbox.fs, dir, ref: name });
  } catch (error) {
    if ((error as { code?: string }).code === "CheckoutConflictError") {
      const files = (error as { data: { filepaths: string[] } }).data.filepaths;
      throw new GitExit(
        1,
        `error: Your local changes to the following files would be overwritten by checkout:\n${files.map((f) => `\t${f}`).join("\n")}\nPlease commit your changes or stash them before you switch branches.\nAborting\n`,
      );
    }
    throw error;
  }
  io.out(
    options.create
      ? `Switched to a new branch '${name}'\n`
      : `Switched to branch '${name}'\n`,
  );
  return 0;
}

async function checkoutDetached(
  sandbox: GitSandbox,
  { io }: CommandContext,
  dir: string,
  oid: string,
) {
  try {
    await git.checkout({ fs: sandbox.fs, dir, ref: oid });
  } catch (error) {
    if ((error as { code?: string }).code === "CheckoutConflictError") {
      const files = (error as { data: { filepaths: string[] } }).data.filepaths;
      throw new GitExit(
        1,
        `error: Your local changes to the following files would be overwritten by checkout:\n${files.map((f) => `\t${f}`).join("\n")}\nPlease commit your changes or stash them before you switch branches.\nAborting\n`,
      );
    }
    throw error;
  }
  const { commit } = await git.readCommit({ fs: sandbox.fs, dir, oid });
  io.out(
    `Note: switching to '${oid.slice(0, 7)}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them, and you can discard any commits you make in this\nstate without impacting any branches by switching back to a branch.\n\nHEAD is now at ${oid.slice(0, 7)} ${commit.message.split("\n")[0]}\n`,
  );
  return 0;
}

const HELP = `usage: git <command> [<args>]

Commands in this practice terminal:

start a working area
   init       Create an empty Git repository
   config     Set your name and email (user.name, user.email)

work on the current change
   add        Add file contents to the index (staging area)
   mv         Move or rename a file
   restore    Restore working tree files (--staged: unstage)
   rm         Remove files from the working tree and from the index

examine the history and state
   diff       Show changes (--staged: what will be committed)
   log        Show commit logs (--oneline, -n 3, --all)
   show       Show a commit and its changes
   status     Show the working tree status (-s: short)

grow, mark and tweak your common history
   branch     List, create, or delete branches
   commit     Record changes to the repository (-m "message")
   merge      Join two development histories together
   switch     Switch branches (-c: create one)
   checkout   Switch branches or restore files
   tag        Create, list or delete tags
`;

/** Adds `git` to a shell. */
export function installGit(shell: Shell) {
  const sandbox = new GitSandbox(shell);
  shell.commands.set("git", (ctx) => sandbox.run(ctx));
  return sandbox;
}
