/**
 * A small bash for lessons: runs parsed statements against the in-memory
 * filesystem. Commands and their messages follow bash and GNU coreutils, so
 * what learners see here is what they'll see on their own computer. Git is
 * a command registered from git.ts.
 */
import {
  basename,
  compareNames,
  dirname,
  FsError,
  MemFs,
  normalize,
  resolvePath,
} from "./memfs";
import {
  parse,
  type Command,
  type Pipeline,
  type Statement,
  type Word,
} from "./parse";

export const HOME = "/home/panda";
export const USER = "panda";

export type Io = {
  stdin: string;
  out: (text: string) => void;
  err: (text: string) => void;
};

export type CommandContext = { shell: Shell; args: string[]; io: Io };
export type CommandFn = (ctx: CommandContext) => number | Promise<number>;

/** `exit` stops the script, like in bash. */
class ExitSignal {
  constructor(public code: number) {}
}

export class Shell {
  readonly fs: MemFs;
  cwd = HOME;
  private oldPwd = HOME;
  readonly env = new Map<string, string>([
    ["HOME", HOME],
    ["USER", USER],
    ["SHELL", "/bin/bash"],
    ["PATH", "/usr/local/bin:/usr/bin:/bin"],
  ]);
  status = 0;
  readonly history: string[] = [];
  readonly commands = new Map<string, CommandFn>();
  exited = false;

  constructor(fs = new MemFs()) {
    this.fs = fs;
    fs.mkdir(HOME, { recursive: true });
    for (const [name, fn] of Object.entries(builtins))
      this.commands.set(name, fn);
  }

  /** "/home/panda/project" → "~/project", for prompts and `cwd` in checks. */
  display(path = this.cwd) {
    return path === HOME
      ? "~"
      : path.startsWith(`${HOME}/`)
        ? `~${path.slice(HOME.length)}`
        : path;
  }

  resolve(path: string) {
    return resolvePath(this.cwd, path);
  }

  /**
   * Runs a script. `onStatement` sees each line before it runs (for the
   * prompt); output goes to `io`. A syntax error stops before anything runs.
   */
  async run(
    script: string,
    io: { out: (text: string) => void; err: (text: string) => void },
    onStatement?: (statement: Statement) => void,
  ) {
    const statements = parse(script);
    for (const statement of statements) {
      if (this.exited) break;
      onStatement?.(statement);
      this.history.push(statement.source);
      try {
        await this.statement(statement, io);
      } catch (error) {
        if (error instanceof ExitSignal) {
          this.status = error.code;
          this.exited = true;
          break;
        }
        throw error;
      }
    }
    return this.status;
  }

  private async statement(statement: Statement, io: Pick<Io, "out" | "err">) {
    let skip = false;
    for (const { pipeline, next } of statement.items) {
      if (!skip) this.status = await this.pipeline(pipeline, io);
      // a && b runs b only if a worked; a || b only if it failed.
      skip =
        next === "&&"
          ? this.status !== 0
          : next === "||"
            ? this.status === 0
            : false;
    }
  }

  private async pipeline(pipeline: Pipeline, io: Pick<Io, "out" | "err">) {
    let stdin = "";
    let status = 0;
    for (const [index, command] of pipeline.entries()) {
      const last = index === pipeline.length - 1;
      let captured = "";
      status = await this.command(command, {
        stdin,
        out: last ? io.out : (text) => (captured += text),
        err: io.err,
      });
      stdin = captured;
    }
    return status;
  }

  private async command(command: Command, io: Io): Promise<number> {
    const args: string[] = [];
    for (const word of command.words) args.push(...this.expand(word));
    if (!args.length) {
      for (const { name, value } of command.assignments)
        this.env.set(name, this.expand(value, false).join(""));
    }

    // Redirects: where this command's input and output really go.
    let stdin = io.stdin;
    let out = io.out;
    let err = io.err;
    const files: { path: string; append: boolean; text: string }[] = [];
    for (const redirect of command.redirects) {
      if (redirect.op === ">&1") {
        err = (text) => out(text);
        continue;
      }
      const target = this.expand(redirect.target, false).join("");
      if (redirect.op === "<") {
        try {
          stdin = this.fs.readText(this.resolve(target));
        } catch (error) {
          io.err(`bash: ${target}: ${reason(error)}\n`);
          return 1;
        }
        continue;
      }
      if (target === "/dev/null") {
        if (redirect.fd !== 2) out = () => {};
        if (redirect.fd !== 1) err = () => {};
        continue;
      }
      const path = this.resolve(target);
      if (this.fs.isDir(path)) {
        io.err(`bash: ${target}: Is a directory\n`);
        return 1;
      }
      const file = { path, append: redirect.op === ">>", text: "" };
      // `>` empties the file before the command runs, like bash.
      try {
        if (!file.append) this.fs.writeFile(path, "");
        else if (!this.fs.exists(path)) this.fs.writeFile(path, "");
      } catch (error) {
        io.err(`bash: ${target}: ${reason(error)}\n`);
        return 1;
      }
      files.push(file);
      const write = (text: string) => (file.text += text);
      if (redirect.fd === 1 || redirect.fd === "both") out = write;
      if (redirect.fd === 2 || redirect.fd === "both") err = write;
    }

    let status = 0;
    if (args.length) {
      const [name, ...rest] = args;
      const fn = this.commands.get(name);
      if (!fn) {
        err(notFound(name));
        status = 127;
      } else {
        try {
          status = await fn({
            shell: this,
            args: rest,
            io: { stdin, out, err },
          });
        } catch (error) {
          if (error instanceof ExitSignal) throw error;
          if (error instanceof FsError) {
            err(`${name}: ${error.reason}\n`);
            status = 1;
          } else throw error;
        }
      }
    }
    for (const file of files) {
      try {
        this.fs.writeFile(file.path, file.text, { append: true });
      } catch (error) {
        io.err(`bash: ${basename(file.path)}: ${reason(error)}\n`);
        status = 1;
      }
    }
    return status;
  }

  /** A word's value(s): variables, ~ and (unquoted) * ? [ ] globs. */
  expand(word: Word, glob = true): string[] {
    let value = "";
    // The same text with quoted glob characters escaped, for matching.
    let pattern = "";
    let hasGlob = false;
    for (const [index, part] of word.entries()) {
      let text: string;
      if (part.kind === "var") {
        text =
          part.name === "?"
            ? String(this.status)
            : part.name === "PWD"
              ? this.cwd
              : part.name === "OLDPWD"
                ? this.oldPwd
                : (this.env.get(part.name) ?? "");
        value += text;
        pattern += escapeGlob(text);
        continue;
      }
      text = part.value;
      if (
        !part.quoted &&
        index === 0 &&
        (text === "~" || text.startsWith("~/"))
      )
        text = HOME + text.slice(1);
      value += text;
      if (part.quoted) pattern += escapeGlob(text);
      else {
        if (/[*?[]/.test(text)) hasGlob = true;
        pattern += text;
      }
    }
    if (glob && hasGlob) {
      const matches = this.glob(pattern);
      if (matches.length) return matches;
    }
    return [value];
  }

  private glob(pattern: string): string[] {
    const absolute = pattern.startsWith("/");
    const segments = pattern.split("/").filter(Boolean);
    let paths = [absolute ? "/" : ""];
    for (const segment of segments) {
      const next: string[] = [];
      for (const base of paths) {
        const dir =
          absolute || base ? resolvePath(this.cwd, base || "/") : this.cwd;
        const join = (name: string) =>
          base ? `${base.replace(/\/$/, "")}/${name}` : name;
        if (!/(^|[^\\])[*?[]/.test(segment)) {
          const name = unescapeGlob(segment);
          if (
            name === "." ||
            name === ".." ||
            this.fs.exists(resolvePath(dir, name))
          )
            next.push(join(name));
          continue;
        }
        if (!this.fs.isDir(dir)) continue;
        const regex = globRegex(segment);
        for (const name of this.fs.readdir(dir)) {
          if (name.startsWith(".") && !segment.startsWith(".")) continue;
          if (regex.test(name)) next.push(join(name));
        }
      }
      paths = next;
    }
    return paths.sort(compareNames);
  }

  cd(path: string) {
    this.oldPwd = this.cwd;
    this.cwd = path;
  }

  get previousDir() {
    return this.oldPwd;
  }
}

function escapeGlob(text: string) {
  return text.replace(/[*?[\]\\]/g, "\\$&");
}
function unescapeGlob(text: string) {
  return text.replace(/\\(.)/g, "$1");
}
function globRegex(segment: string) {
  let source = "";
  for (let i = 0; i < segment.length; i++) {
    const c = segment[i];
    if (c === "\\") source += escapeRegex(segment[++i] ?? "");
    else if (c === "*") source += "[^/]*";
    else if (c === "?") source += "[^/]";
    else if (c === "[") {
      const end = segment.indexOf("]", i + 2);
      if (end === -1) source += "\\[";
      else {
        let set = segment.slice(i + 1, end);
        if (set.startsWith("!")) set = `^${set.slice(1)}`;
        source += `[${set.replace(/\\/g, "\\\\")}]`;
        i = end;
      }
    } else source += escapeRegex(c);
  }
  return new RegExp(`^${source}$`);
}
const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

function reason(error: unknown) {
  return error instanceof FsError ? error.reason : String(error);
}

/** Learners try these; a hint helps more than "command not found". */
const HINTS: Record<string, string> = {
  nano: 'text editors don\'t open here. Write files with echo "text" > file',
  vim: 'text editors don\'t open here. Write files with echo "text" > file',
  vi: 'text editors don\'t open here. Write files with echo "text" > file',
  emacs: 'text editors don\'t open here. Write files with echo "text" > file',
  code: 'editors don\'t open here. Write files with echo "text" > file',
  python:
    "this terminal runs shell commands and git. Python runs in the Python course's editor",
  python3:
    "this terminal runs shell commands and git. Python runs in the Python course's editor",
  node: "this terminal runs shell commands and git. JavaScript runs in the JavaScript course's editor",
  npm: "npm isn't installed in this practice terminal",
  pip: "pip isn't installed in this practice terminal",
  apt: "installing programs isn't possible in this practice terminal",
  brew: "installing programs isn't possible in this practice terminal",
  ssh: "there's no network in this practice terminal",
  curl: "there's no network in this practice terminal",
  wget: "there's no network in this practice terminal",
};

function notFound(name: string) {
  const hint = HINTS[name];
  return `bash: ${name}: command not found\n${hint ? `hint: ${hint}\n` : ""}`;
}

/**
 * Flags like `-rf`, `-n 3`, `-n3`, `--all`. Returns the flags set and the
 * other arguments, or an error message like GNU tools print.
 */
export function flags(
  command: string,
  args: string[],
  allowed: string,
  withValue = "",
  long: Record<string, string> = {},
): { set: Set<string>; values: Map<string, string>; rest: string[] } | string {
  const set = new Set<string>();
  const values = new Map<string, string>();
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      rest.push(...args.slice(i + 1));
      break;
    }
    if (arg.startsWith("--") && arg.length > 2) {
      const [name, value] = arg.slice(2).split("=", 2);
      const short = long[name];
      if (!short)
        return `${command}: unrecognized option '${arg}'\nTry '${command} --help' for more information.\n`;
      if (withValue.includes(short)) {
        const v = value ?? args[++i];
        if (v === undefined)
          return `${command}: option '--${name}' requires an argument\n`;
        values.set(short, v);
      } else set.add(short);
      continue;
    }
    // A number like -3 for head/tail is -n 3.
    if (/^-\d+$/.test(arg) && withValue.includes("n")) {
      values.set("n", arg.slice(1));
      continue;
    }
    if (arg.startsWith("-") && arg.length > 1) {
      for (let j = 1; j < arg.length; j++) {
        const f = arg[j];
        if (withValue.includes(f)) {
          const v = arg.slice(j + 1) || args[++i];
          if (v === undefined)
            return `${command}: option requires an argument -- '${f}'\nTry '${command} --help' for more information.\n`;
          values.set(f, v);
          break;
        }
        if (!allowed.includes(f))
          return `${command}: invalid option -- '${f}'\nTry '${command} --help' for more information.\n`;
        set.add(f);
      }
      continue;
    }
    rest.push(arg);
  }
  return { set, values, rest };
}

/** Each command's one-line usage, for `--help` and the `help` command. */
export const USAGE: Record<string, string> = {
  pwd: "pwd                      print the folder you're in",
  cd: "cd [folder]              go to a folder (no folder: home; -: back)",
  ls: "ls [-a] [-A] [-l] [-F] [path] list a folder (-a: hidden files too, -l: details)",
  tree: "tree [folder]            show folders and files as a tree",
  mkdir:
    "mkdir [-p] folder...     make folders (-p: with parents, no error if they exist)",
  touch: "touch file...            make empty files (or update their time)",
  cat: "cat [-n] [file...]       print files",
  echo: "echo [-n] [-e] text...   print text (-n: no newline, -e: \\n and \\t work)",
  cp: "cp [-r] from... to       copy files (-r: folders too)",
  mv: "mv from... to            move or rename",
  rm: "rm [-r] [-f] path...     delete (there's no undo!) (-r: folders, -f: no errors)",
  rmdir: "rmdir folder...          delete empty folders",
  head: "head [-n N] [file...]    the first lines (10 unless -n)",
  tail: "tail [-n N] [file...]    the last lines (10 unless -n; -n +2: from line 2)",
  wc: "wc [-l] [-w] [-m] [-c] [file...] count lines, words, characters and bytes",
  grep: "grep [-i -v -n -c -l -r -w -o -q -E -F] pattern [file...]  find lines",
  sort: "sort [-r] [-n] [-u] [file...]  sort lines",
  uniq: "uniq [-c] [file...]      drop repeated neighbouring lines (-c: count them)",
  cut: "cut -d X -f N[,N] | -c N-M [file...]  pick fields (split at X) or characters",
  tr: "tr [-d|-s] set1 [set2]   swap, delete (-d) or squeeze repeats of (-s) characters, like tr a-z A-Z",
  tee: "tee [-a] file...         copy what comes in to files and the screen (-a: add to the end)",
  printf:
    "printf format [text...]  print with a format: %s text, %d number, \\n new line",
  chmod: "chmod mode file...       change permissions (755, +x, u-w …)",
  history: "history                  the commands you've run",
  export: "export NAME=value        set a variable",
  env: "env                      list variables",
  whoami: "whoami                   your user name",
  date: "date                     the date and time",
  which: "which command            where a command lives",
  clear: "clear                    clear the screen",
  help: "help                     this list",
  exit: "exit [code]              stop",
  git: "git <command>            version control: git help shows what works here",
};

function usage(io: Io, name: string) {
  io.out(`Usage: ${USAGE[name]}\n`);
  return 0;
}

const pad = (text: string | number, width: number) =>
  String(text).padStart(width);

function modeString(mode: number, dir: boolean) {
  const bits = "rwxrwxrwx";
  let out = dir ? "d" : "-";
  for (let i = 0; i < 9; i++) out += mode & (1 << (8 - i)) ? bits[i] : "-";
  return out;
}

const MONTHS = [
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
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function lsDate(ms: number) {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate(), 2)} ${pad(d.getUTCHours(), 2).replace(" ", "0")}:${pad(d.getUTCMinutes(), 2).replace(" ", "0")}`;
}
function longDate(ms: number) {
  const d = new Date(ms);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate(), 2)} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}`;
}

/** Reads each file (or stdin when there are none), reporting missing ones. */
function inputs(
  ctx: CommandContext,
  name: string,
  paths: string[],
): { label: string; text: string }[] | null {
  if (!paths.length) return [{ label: "", text: ctx.io.stdin }];
  const out: { label: string; text: string }[] = [];
  let failed = false;
  for (const path of paths) {
    if (path === "-") {
      out.push({ label: "-", text: ctx.io.stdin });
      continue;
    }
    const full = ctx.shell.resolve(path);
    if (ctx.shell.fs.isDir(full)) {
      ctx.io.err(`${name}: ${path}: Is a directory\n`);
      failed = true;
      continue;
    }
    if (!ctx.shell.fs.exists(full)) {
      ctx.io.err(
        name === "head" || name === "tail"
          ? `${name}: cannot open '${path}' for reading: No such file or directory\n`
          : `${name}: ${path}: No such file or directory\n`,
      );
      failed = true;
      continue;
    }
    out.push({ label: path, text: ctx.shell.fs.readText(full) });
  }
  return failed && !out.length ? null : out;
}

/** tr's character sets: "a-z" → a…z, "\\n" → a new line. */
function expandSet(set: string) {
  const chars = [...set.replace(/\\n/g, "\n").replace(/\\t/g, "\t")];
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i + 1] === "-" && chars[i + 2] !== undefined) {
      const from = chars[i].codePointAt(0)!;
      const to = chars[i + 2].codePointAt(0)!;
      for (let c = from; c <= to; c++) out.push(String.fromCodePoint(c));
      i += 2;
    } else out.push(chars[i]);
  }
  return out;
}

const splitLines = (text: string) => {
  const all = text.split("\n");
  if (all.at(-1) === "") all.pop();
  return all;
};

const builtins: Record<string, CommandFn> = {
  pwd: ({ shell, io }) => {
    io.out(`${shell.cwd}\n`);
    return 0;
  },

  cd: ({ shell, args, io }) => {
    if (args[0] === "--help") return usage(io, "cd");
    if (args.length > 1) {
      io.err("bash: cd: too many arguments\n");
      return 1;
    }
    const target = args[0] ?? HOME;
    if (target === "-") {
      const back = shell.previousDir;
      shell.cd(back);
      io.out(`${back}\n`);
      return 0;
    }
    const path = shell.resolve(target);
    if (!shell.fs.exists(path)) {
      io.err(`bash: cd: ${target}: No such file or directory\n`);
      return 1;
    }
    if (!shell.fs.isDir(path)) {
      io.err(`bash: cd: ${target}: Not a directory\n`);
      return 1;
    }
    shell.cd(path);
    return 0;
  },

  ls: (ctx) => {
    const { shell, args, io } = ctx;
    if (args.includes("--help")) return usage(io, "ls");
    const parsed = flags("ls", args, "aAlF1R", "", {
      all: "a",
      "almost-all": "A",
    });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 2;
    }
    const { set, rest } = parsed;
    const paths = rest.length ? rest : ["."];
    let status = 0;
    const files: string[] = [];
    const dirs: string[] = [];
    // Like ls: files first, then folders, each in name order.
    for (const path of [...paths].sort(compareNames)) {
      const full = shell.resolve(path);
      if (!shell.fs.exists(full)) {
        io.err(`ls: cannot access '${path}': No such file or directory\n`);
        status = 2;
      } else if (shell.fs.isDir(full)) dirs.push(path);
      else files.push(path);
    }
    const name = (dir: string, entry: string) => {
      const full = resolvePath(shell.resolve(dir), entry);
      if (!set.has("F")) return entry;
      if (shell.fs.isDir(full)) return `${entry}/`;
      return shell.fs.stat(full).mode & 0o111 ? `${entry}*` : entry;
    };
    // A folder's link count: itself, its entry in the parent, and each subfolder's "..".
    const links = (full: string) =>
      shell.fs.isDir(full)
        ? 2 +
          shell.fs
            .readdir(full)
            .filter((e) => shell.fs.isDir(resolvePath(full, e))).length
        : 1;
    const show = (dir: string, entries: string[]) => {
      if (set.has("l")) {
        const stats = entries.map((e) =>
          shell.fs.stat(resolvePath(shell.resolve(dir), e)),
        );
        const width = Math.max(1, ...stats.map((s) => String(s.size).length));
        if (dir !== "")
          io.out(
            `total ${stats.reduce((sum, s) => sum + (s.isDirectory() ? 4 : Math.ceil(s.size / 4096) * 4), 0)}\n`,
          );
        entries.forEach((e, i) => {
          const s = stats[i];
          io.out(
            `${modeString(s.mode, s.isDirectory())} ${links(resolvePath(shell.resolve(dir), e))} ${USER} ${USER} ${pad(s.size, width)} ${lsDate(s.mtimeMs)} ${name(dir, e)}\n`,
          );
        });
      } else if (entries.length) {
        io.out(
          set.has("1")
            ? `${entries.map((e) => name(dir, e)).join("\n")}\n`
            : `${entries.map((e) => name(dir, e)).join("  ")}\n`,
        );
      }
    };
    if (files.length)
      show(
        "",
        files.map((f) => f),
      );
    dirs.forEach((dir, index) => {
      const full = shell.resolve(dir);
      let entries = shell.fs.readdir(full);
      if (set.has("a")) entries = [".", "..", ...entries];
      else if (!set.has("A"))
        entries = entries.filter((e) => !e.startsWith("."));
      if (paths.length > 1)
        io.out(`${index || files.length ? "\n" : ""}${dir}:\n`);
      show(dir, entries);
    });
    return status;
  },

  tree: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "tree");
    const root = args[0] ?? ".";
    const full = shell.resolve(root);
    if (!shell.fs.isDir(full)) {
      io.out(`${root} [error opening dir]\n\n0 directories, 0 files\n`);
      return 2;
    }
    let dirs = 0;
    let files = 0;
    io.out(`${root}\n`);
    const walk = (path: string, prefix: string) => {
      const entries = shell.fs.readdir(path).filter((e) => !e.startsWith("."));
      entries.forEach((entry, i) => {
        const last = i === entries.length - 1;
        const child = resolvePath(path, entry);
        io.out(`${prefix}${last ? "└── " : "├── "}${entry}\n`);
        if (shell.fs.isDir(child)) {
          dirs++;
          walk(child, `${prefix}${last ? "    " : "│   "}`);
        } else files++;
      });
    };
    walk(full, "");
    io.out(
      `\n${dirs} ${dirs === 1 ? "directory" : "directories"}, ${files} ${files === 1 ? "file" : "files"}\n`,
    );
    return 0;
  },

  mkdir: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "mkdir");
    const parsed = flags("mkdir", args, "pv", "", { parents: "p" });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    if (!parsed.rest.length) {
      io.err(
        "mkdir: missing operand\nTry 'mkdir --help' for more information.\n",
      );
      return 1;
    }
    let status = 0;
    for (const path of parsed.rest) {
      const full = shell.resolve(path);
      try {
        if (parsed.set.has("p")) shell.fs.mkdir(full, { recursive: true });
        else shell.fs.mkdir(full);
        if (parsed.set.has("v")) io.out(`mkdir: created directory '${path}'\n`);
      } catch (error) {
        io.err(`mkdir: cannot create directory '${path}': ${reason(error)}\n`);
        status = 1;
      }
    }
    return status;
  },

  touch: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "touch");
    if (!args.length) {
      io.err(
        "touch: missing file operand\nTry 'touch --help' for more information.\n",
      );
      return 1;
    }
    let status = 0;
    for (const path of args) {
      try {
        shell.fs.touch(shell.resolve(path));
      } catch (error) {
        io.err(`touch: cannot touch '${path}': ${reason(error)}\n`);
        status = 1;
      }
    }
    return status;
  },

  cat: (ctx) => {
    const { args, io } = ctx;
    if (args.includes("--help")) return usage(io, "cat");
    const parsed = flags("cat", args, "n", "", { number: "n" });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    const read = inputs(ctx, "cat", parsed.rest);
    if (!read) return 1;
    let n = 0;
    for (const { text } of read) {
      if (!parsed.set.has("n")) io.out(text);
      else
        io.out(
          splitLines(text)
            .map((line) => `${pad(++n, 6)}\t${line}\n`)
            .join(""),
        );
    }
    return read.length < parsed.rest.length ? 1 : 0;
  },

  echo: ({ args, io }) => {
    let newline = true;
    let escapes = false;
    let i = 0;
    for (; i < args.length && /^-[neE]+$/.test(args[i]); i++) {
      if (args[i].includes("n")) newline = false;
      if (args[i].includes("e")) escapes = true;
    }
    let text = args.slice(i).join(" ");
    if (escapes)
      text = text
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\");
    io.out(newline ? `${text}\n` : text);
    return 0;
  },

  cp: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "cp");
    const parsed = flags("cp", args, "rRv", "", { recursive: "r" });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    const recursive = parsed.set.has("r") || parsed.set.has("R");
    return moveOrCopy("cp", shell, parsed.rest, io, (from, to, label) => {
      if (shell.fs.isDir(from) && !recursive) {
        io.err(`cp: -r not specified; omitting directory '${label}'\n`);
        return false;
      }
      shell.fs.copy(from, to);
      return true;
    });
  },

  mv: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "mv");
    const parsed = flags("mv", args, "fv");
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    return moveOrCopy("mv", shell, parsed.rest, io, (from, to) => {
      shell.fs.rename(from, to);
      return true;
    });
  },

  rm: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "rm");
    const parsed = flags("rm", args, "rRfv", "", {
      recursive: "r",
      force: "f",
    });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    const recursive = parsed.set.has("r") || parsed.set.has("R");
    const force = parsed.set.has("f");
    if (!parsed.rest.length && !force) {
      io.err("rm: missing operand\nTry 'rm --help' for more information.\n");
      return 1;
    }
    let status = 0;
    for (const path of parsed.rest) {
      const full = shell.resolve(path);
      if (full === "/" || full === HOME) {
        io.err(
          `rm: refusing to remove '${path}': it would delete everything\n`,
        );
        status = 1;
        continue;
      }
      if (!shell.fs.exists(full)) {
        if (!force) {
          io.err(`rm: cannot remove '${path}': No such file or directory\n`);
          status = 1;
        }
        continue;
      }
      if (shell.fs.isDir(full)) {
        if (!recursive) {
          io.err(`rm: cannot remove '${path}': Is a directory\n`);
          status = 1;
          continue;
        }
        shell.fs.rmdir(full, { recursive: true });
      } else shell.fs.unlink(full);
      if (parsed.set.has("v")) io.out(`removed '${path}'\n`);
      // bash would leave you in a folder that's gone; go up to one that exists.
      if (shell.cwd === full || shell.cwd.startsWith(`${full}/`))
        shell.cd(dirname(full));
    }
    return status;
  },

  rmdir: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "rmdir");
    if (!args.length) {
      io.err("rmdir: missing operand\n");
      return 1;
    }
    let status = 0;
    for (const path of args) {
      try {
        shell.fs.rmdir(shell.resolve(path));
      } catch (error) {
        io.err(`rmdir: failed to remove '${path}': ${reason(error)}\n`);
        status = 1;
      }
    }
    return status;
  },

  head: (ctx) => headTail(ctx, "head"),
  tail: (ctx) => headTail(ctx, "tail"),

  wc: (ctx) => {
    const { args, io } = ctx;
    if (args.includes("--help")) return usage(io, "wc");
    const parsed = flags("wc", args, "lwcm", "", {
      lines: "l",
      words: "w",
      bytes: "c",
      chars: "m",
    });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    const show = parsed.set.size
      ? ["l", "w", "m", "c"].filter((f) => parsed.set.has(f))
      : ["l", "w", "c"];
    const read = inputs(ctx, "wc", parsed.rest);
    if (!read) return 1;
    const counts = read.map(({ label, text }) => ({
      label,
      l: (text.match(/\n/g) ?? []).length,
      w: text.split(/\s+/).filter(Boolean).length,
      c: new TextEncoder().encode(text).length,
      m: [...text].length,
    }));
    if (counts.length > 1)
      counts.push({
        label: "total",
        l: counts.reduce((s, c) => s + c.l, 0),
        w: counts.reduce((s, c) => s + c.w, 0),
        c: counts.reduce((s, c) => s + c.c, 0),
        m: counts.reduce((s, c) => s + c.m, 0),
      });
    const fromStdin = !parsed.rest.length;
    // GNU wc: one count of one input is printed bare. Otherwise columns are
    // as wide as the total size in bytes (at least 7 from a pipe).
    const width =
      show.length === 1 && read.length === 1
        ? 0
        : fromStdin
          ? 7
          : String(
              read.reduce(
                (s, r) => s + new TextEncoder().encode(r.text).length,
                0,
              ),
            ).length;
    for (const c of counts)
      io.out(
        `${show.map((f) => pad(c[f as "l"], width)).join(" ")}${c.label ? ` ${c.label}` : ""}\n`,
      );
    return read.length < parsed.rest.length ? 1 : 0;
  },

  grep: (ctx) => {
    const { shell, args, io } = ctx;
    if (args.includes("--help")) return usage(io, "grep");
    const parsed = flags("grep", args, "ivnclrRwEFhHqo", "e", {
      "ignore-case": "i",
      "invert-match": "v",
      "line-number": "n",
      count: "c",
      "files-with-matches": "l",
      recursive: "r",
      quiet: "q",
      "only-matching": "o",
    });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 2;
    }
    const { set, values } = parsed;
    const rest = [...parsed.rest];
    const pattern = values.get("e") ?? rest.shift();
    if (pattern === undefined) {
      io.err(
        "Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.\n",
      );
      return 2;
    }
    const source = set.has("F")
      ? escapeRegex(pattern)
      : set.has("E")
        ? pattern
        : // Basic regular expressions: + ? | ( ) { } are plain characters.
          pattern.replace(/\\([+?|(){}])|([+?|(){}])/g, (_, special, plain) =>
            special ? special : `\\${plain}`,
          );
    let regex: RegExp;
    try {
      regex = new RegExp(source, set.has("i") ? "i" : "");
      // A word is letters (any alphabet), digits and _, like GNU grep.
      if (set.has("w"))
        regex = new RegExp(
          `(?<![\\p{L}\\p{N}_])(?:${regex.source})(?![\\p{L}\\p{N}_])`,
          set.has("i") ? "iu" : "u",
        );
    } catch {
      if (set.has("w"))
        regex = new RegExp(`\\b(?:${source})\\b`, set.has("i") ? "i" : "");
      else {
        io.err(`grep: Invalid regular expression\n`);
        return 2;
      }
    }
    const recursive = set.has("r") || set.has("R");
    let files = rest;
    if (recursive) {
      files = [];
      for (const path of rest.length ? rest : ["."]) {
        const full = shell.resolve(path);
        if (shell.fs.isDir(full))
          files.push(
            ...shell.fs
              .walk(full)
              .filter((f) => !f.split("/").some((part) => part.startsWith(".")))
              // No folder named: plain paths; "." gives ./a.js, like GNU.
              .map((f) =>
                rest.length ? `${path.replace(/\/$/, "")}/${f}` : f,
              ),
          );
        else files.push(path);
      }
    }
    // Like GNU grep: names are shown when there are several file operands,
    // and each file is read (or reported missing) in order.
    const prefix =
      (set.has("H") || files.length > 1 || recursive) && !set.has("h");
    const quiet = set.has("q");
    let matched = false;
    let missing = false;
    for (const file of files.length ? files : [null]) {
      const read = inputs(ctx, "grep", file === null ? [] : [file]);
      if (!read?.length) {
        missing = true;
        continue;
      }
      const { label, text } = read[0];
      let count = 0;
      splitLines(text).forEach((line, i) => {
        if (regex.test(line) === set.has("v")) return;
        matched = true;
        count++;
        if (quiet || set.has("c") || set.has("l")) return;
        const head = `${prefix ? `${label}:` : ""}${set.has("n") ? `${i + 1}:` : ""}`;
        if (set.has("o") && !set.has("v")) {
          const all = new RegExp(regex.source, `${regex.flags}g`);
          for (const m of line.matchAll(all))
            if (m[0]) io.out(`${head}${m[0]}\n`);
        } else io.out(`${head}${line}\n`);
      });
      if (quiet) continue;
      if (set.has("c")) io.out(`${prefix ? `${label}:` : ""}${count}\n`);
      if (set.has("l") && count) io.out(`${label || "(standard input)"}\n`);
    }
    // -q: 0 as soon as anything matched, even if a file was missing.
    if (quiet && matched) return 0;
    return missing ? 2 : matched ? 0 : 1;
  },

  sort: (ctx) => {
    const { args, io } = ctx;
    if (args.includes("--help")) return usage(io, "sort");
    const parsed = flags("sort", args, "rnuf", "", {
      reverse: "r",
      "numeric-sort": "n",
      unique: "u",
    });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 2;
    }
    const read = inputs(ctx, "sort", parsed.rest);
    if (!read) return 2;
    let all = read.flatMap(({ text }) => splitLines(text));
    const key = (line: string) =>
      parsed.set.has("f") ? line.toLowerCase() : line;
    all.sort((a, b) => {
      if (parsed.set.has("n")) {
        const diff = (parseFloat(a) || 0) - (parseFloat(b) || 0);
        if (diff) return diff;
      }
      return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;
    });
    if (parsed.set.has("r")) all.reverse();
    if (parsed.set.has("u"))
      all = all.filter((line, i) => i === 0 || key(line) !== key(all[i - 1]));
    if (all.length) io.out(`${all.join("\n")}\n`);
    return 0;
  },

  cut: (ctx) => {
    const { args, io } = ctx;
    if (args.includes("--help")) return usage(io, "cut");
    const parsed = flags("cut", args, "", "dfc", {
      delimiter: "d",
      fields: "f",
      characters: "c",
    });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    const list = parsed.values.get("f") ?? parsed.values.get("c");
    if (!list) {
      io.err(
        "cut: you must specify a list of bytes, characters, or fields\nTry 'cut --help' for more information.\n",
      );
      return 1;
    }
    // "2", "1,3", "2-4", "3-" (1-based)
    const ranges = list.split(",").map((part) => {
      const [a, b] = part.split("-");
      const from = a ? Number(a) : 1;
      const to = part.includes("-") ? (b ? Number(b) : Infinity) : from;
      return [from, to] as const;
    });
    if (ranges.some(([a, b]) => !(a >= 1) || !(b >= a))) {
      io.err(
        `cut: invalid field range\nTry 'cut --help' for more information.\n`,
      );
      return 1;
    }
    const picked = (n: number) => ranges.some(([a, b]) => n >= a && n <= b);
    const delimiter = parsed.values.get("d") ?? "\t";
    if (delimiter.length !== 1) {
      io.err("cut: the delimiter must be a single character\n");
      return 1;
    }
    const read = inputs(ctx, "cut", parsed.rest);
    if (!read) return 1;
    for (const { text } of read)
      for (const line of splitLines(text)) {
        if (parsed.values.has("c")) {
          io.out(`${[...line].filter((_, i) => picked(i + 1)).join("")}\n`);
          continue;
        }
        // Like cut: a line without the delimiter is printed whole.
        if (!line.includes(delimiter)) {
          io.out(`${line}\n`);
          continue;
        }
        const fields = line.split(delimiter);
        io.out(`${fields.filter((_, i) => picked(i + 1)).join(delimiter)}\n`);
      }
    return read.length < parsed.rest.length ? 1 : 0;
  },

  tr: ({ args, io }) => {
    if (args.includes("--help")) return usage(io, "tr");
    const del = args[0] === "-d";
    // -s squeezes repeats of the (last) set into one: tr -s ' '
    const squeeze = args[0] === "-s";
    const words = del || squeeze ? args.slice(1) : args;
    const want = del ? 1 : squeeze ? Math.min(2, Math.max(1, words.length)) : 2;
    if (words.length !== want) {
      io.err(
        words.length > want
          ? `tr: extra operand '${words[want]}'\nTry 'tr --help' for more information.\n`
          : `tr: missing operand${words.length ? ` after '${words[0]}'` : ""}\nTry 'tr --help' for more information.\n`,
      );
      return 1;
    }
    const [from, to = []] = words.map(expandSet);
    let out = "";
    for (const ch of io.stdin) {
      const i = from.indexOf(ch);
      if (i === -1 || (squeeze && !to.length)) out += ch;
      else if (!del) out += to[Math.min(i, to.length - 1)] ?? "";
    }
    if (squeeze) {
      const set = to.length ? to : from;
      let squeezed = "";
      for (const ch of out)
        if (!(set.includes(ch) && squeezed.endsWith(ch))) squeezed += ch;
      out = squeezed;
    }
    io.out(out);
    return 0;
  },

  tee: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "tee");
    const append = args.includes("-a") || args.includes("--append");
    let status = 0;
    for (const path of args.filter((a) => !a.startsWith("-"))) {
      const full = shell.resolve(path);
      if (shell.fs.isDir(full)) {
        io.err(`tee: ${path}: Is a directory\n`);
        status = 1;
        continue;
      }
      const before =
        append && shell.fs.isFile(full) ? shell.fs.readText(full) : "";
      try {
        shell.fs.writeFile(full, before + io.stdin);
      } catch {
        io.err(`tee: ${path}: No such file or directory\n`);
        status = 1;
      }
    }
    io.out(io.stdin);
    return status;
  },

  printf: ({ args, io }) => {
    if (!args.length) {
      io.err("printf: usage: printf format [arguments]\n");
      return 2;
    }
    const [format, ...values] = args;
    let used = 0;
    // Like bash, the format repeats until every value is used.
    do {
      const start = used;
      const text = format.replace(/%([%sd])|\\(.)/g, (_, spec, escape) => {
        if (escape !== undefined)
          return (
            ({ n: "\n", t: "\t", "\\": "\\" } as Record<string, string>)[
              escape
            ] ?? `\\${escape}`
          );
        if (spec === "%") return "%";
        const value = values[used++] ?? "";
        return spec === "d" ? String(parseInt(value, 10) || 0) : value;
      });
      io.out(text);
      if (used === start) break;
    } while (used < values.length);
    return 0;
  },

  uniq: (ctx) => {
    const { args, io } = ctx;
    if (args.includes("--help")) return usage(io, "uniq");
    const parsed = flags("uniq", args, "cd", "", { count: "c" });
    if (typeof parsed === "string") {
      io.err(parsed);
      return 1;
    }
    const read = inputs(ctx, "uniq", parsed.rest.slice(0, 1));
    if (!read) return 1;
    const groups: { line: string; count: number }[] = [];
    for (const line of splitLines(read[0].text)) {
      const last = groups.at(-1);
      if (last && last.line === line) last.count++;
      else groups.push({ line, count: 1 });
    }
    for (const { line, count } of groups) {
      if (parsed.set.has("d") && count < 2) continue;
      io.out(parsed.set.has("c") ? `${pad(count, 7)} ${line}\n` : `${line}\n`);
    }
    return 0;
  },

  chmod: ({ shell, args, io }) => {
    if (args.includes("--help")) return usage(io, "chmod");
    const [mode, ...paths] = args;
    if (!mode || !paths.length) {
      io.err(
        "chmod: missing operand\nTry 'chmod --help' for more information.\n",
      );
      return 1;
    }
    let status = 0;
    for (const path of paths) {
      const full = shell.resolve(path);
      if (!shell.fs.exists(full)) {
        io.err(`chmod: cannot access '${path}': No such file or directory\n`);
        status = 1;
        continue;
      }
      const current = shell.fs.stat(full).mode & 0o777;
      const next = applyMode(current, mode);
      if (next === null) {
        io.err(`chmod: invalid mode: '${mode}'\n`);
        return 1;
      }
      shell.fs.chmod(full, next);
    }
    return status;
  },

  history: ({ shell, io }) => {
    shell.history.forEach((line, i) => io.out(`${pad(i + 1, 5)}  ${line}\n`));
    return 0;
  },

  export: ({ shell, args, io }) => {
    for (const arg of args) {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)(?:=([\s\S]*))?$/.exec(arg);
      if (!match) {
        io.err(`bash: export: \`${arg}': not a valid identifier\n`);
        return 1;
      }
      if (match[2] !== undefined) shell.env.set(match[1], match[2]);
      else if (!shell.env.has(match[1])) shell.env.set(match[1], "");
    }
    return 0;
  },
  unset: ({ shell, args }) => {
    for (const name of args) shell.env.delete(name);
    return 0;
  },
  env: ({ shell, io }) => {
    for (const [name, value] of [
      ...shell.env,
      ["PWD", shell.cwd] as [string, string],
    ].sort())
      io.out(`${name}=${value}\n`);
    return 0;
  },
  whoami: ({ io }) => {
    io.out(`${USER}\n`);
    return 0;
  },
  date: ({ io }) => {
    const now = Date.UTC(2026, 0, 5, 9, 0, 0);
    io.out(`${longDate(now)} UTC ${new Date(now).getUTCFullYear()}\n`);
    return 0;
  },
  which: ({ shell, args, io }) => {
    let status = 0;
    for (const name of args) {
      if (shell.commands.has(name)) io.out(`/usr/bin/${name}\n`);
      else status = 1;
    }
    return status;
  },
  clear: () => 0,
  true: () => 0,
  false: () => 1,
  exit: ({ args }) => {
    throw new ExitSignal(Number(args[0] ?? 0) || 0);
  },
  sudo: async (ctx) => {
    const [name, ...rest] = ctx.args;
    if (!name) {
      ctx.io.err("usage: sudo command\n");
      return 1;
    }
    const fn = ctx.shell.commands.get(name);
    if (!fn) {
      ctx.io.err(`sudo: ${name}: command not found\n`);
      return 1;
    }
    return fn({ ...ctx, args: rest });
  },
  man: ({ args, io }) => {
    const name = args[0];
    if (name && USAGE[name]) {
      io.out(`Usage: ${USAGE[name]}\n`);
      return 0;
    }
    io.err(`No manual entry for ${name ?? "nothing"}. Try: help\n`);
    return 16;
  },
  help: ({ io }) => {
    io.out("Commands in this practice terminal:\n\n");
    for (const line of Object.values(USAGE)) io.out(`  ${line}\n`);
    io.out(
      "\nAlso: | pipes, > and >> to write to a file, < to read one, && and ;\n",
    );
    return 0;
  },
};

function headTail(ctx: CommandContext, name: "head" | "tail") {
  const { args, io } = ctx;
  if (args.includes("--help")) return usage(io, name);
  const parsed = flags(name, args, "qv", "n", { lines: "n" });
  if (typeof parsed === "string") {
    io.err(parsed);
    return 1;
  }
  const raw = parsed.values.get("n") ?? "10";
  // tail -n +2: from line 2 to the end (skips a header line).
  const from = name === "tail" && raw.startsWith("+");
  const n = Number(from ? raw.slice(1) : raw);
  if (!Number.isInteger(n) || n < 0) {
    io.err(`${name}: invalid number of lines: '${parsed.values.get("n")}'\n`);
    return 1;
  }
  const read = inputs(ctx, name, parsed.rest);
  if (!read) return 1;
  // Like GNU: a header per file whenever several were named.
  read.forEach(({ label, text }, i) => {
    if (parsed.rest.length > 1) io.out(`${i ? "\n" : ""}==> ${label} <==\n`);
    const all = splitLines(text);
    const picked =
      name === "head"
        ? all.slice(0, n)
        : from
          ? all.slice(Math.max(0, n - 1))
          : n
            ? all.slice(-n)
            : [];
    if (picked.length) io.out(`${picked.join("\n")}\n`);
  });
  return read.length < parsed.rest.length ? 1 : 0;
}

/** `cp`/`mv`: one source to a target, or several into a folder. */
function moveOrCopy(
  name: "cp" | "mv",
  shell: Shell,
  args: string[],
  io: Io,
  act: (from: string, to: string, label: string) => boolean,
) {
  if (args.length < 2) {
    io.err(
      args.length
        ? `${name}: missing destination file operand after '${args[0]}'\nTry '${name} --help' for more information.\n`
        : `${name}: missing file operand\nTry '${name} --help' for more information.\n`,
    );
    return 1;
  }
  const target = args.at(-1)!;
  const sources = args.slice(0, -1);
  const targetFull = shell.resolve(target);
  const intoDir = shell.fs.isDir(targetFull);
  // "css/" means a folder: if there isn't one, refuse rather than rename.
  if (target.endsWith("/") && !intoDir) {
    for (const source of sources)
      io.err(
        name === "mv"
          ? `mv: cannot move '${source}' to '${target}': Not a directory\n`
          : `cp: cannot create regular file '${target}': Not a directory\n`,
      );
    return 1;
  }
  if (sources.length > 1 && !intoDir) {
    io.err(`${name}: target '${target}' is not a directory\n`);
    return 1;
  }
  let status = 0;
  for (const source of sources) {
    const from = shell.resolve(source);
    if (!shell.fs.exists(from)) {
      io.err(`${name}: cannot stat '${source}': No such file or directory\n`);
      status = 1;
      continue;
    }
    const to = intoDir ? resolvePath(targetFull, basename(from)) : targetFull;
    if (normalize(from) === normalize(to)) {
      io.err(`${name}: '${source}' and '${target}' are the same file\n`);
      status = 1;
      continue;
    }
    try {
      if (!act(from, to, source)) status = 1;
    } catch (error) {
      io.err(
        error instanceof FsError && error.code === "EINVAL"
          ? `${name}: cannot ${name === "cp" ? "copy" : "move"} '${source}' into itself\n`
          : `${name}: cannot ${name === "cp" ? "create" : "move"} '${target}': ${reason(error)}\n`,
      );
      status = 1;
    }
  }
  return status;
}

/** "755", "+x", "u-w", "go=r" → the new permission bits, or null if invalid. */
function applyMode(current: number, mode: string): number | null {
  if (/^[0-7]{3,4}$/.test(mode)) return parseInt(mode, 8) & 0o777;
  let result = current;
  for (const clause of mode.split(",")) {
    const match = /^([ugoa]*)([+\-=])([rwx]*)$/.exec(clause);
    if (!match) return null;
    const who = match[1] || "a";
    let bits = 0;
    for (const p of match[3]) bits |= p === "r" ? 4 : p === "w" ? 2 : 1;
    let mask = 0;
    if (who.includes("u") || who.includes("a")) mask |= bits << 6;
    if (who.includes("g") || who.includes("a")) mask |= bits << 3;
    if (who.includes("o") || who.includes("a")) mask |= bits;
    const whoMask =
      (who.includes("u") || who.includes("a") ? 0o700 : 0) |
      (who.includes("g") || who.includes("a") ? 0o070 : 0) |
      (who.includes("o") || who.includes("a") ? 0o007 : 0);
    if (match[2] === "+") result |= mask;
    else if (match[2] === "-") result &= ~mask;
    else result = (result & ~whoMask) | mask;
  }
  return result;
}

export { parse };
