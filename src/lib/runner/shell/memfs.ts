/**
 * The terminal sandbox's disk: an in-memory filesystem with POSIX paths.
 * The shell uses its synchronous methods; isomorphic-git uses `promises`
 * (Node's fs.promises shape). Nothing touches the real disk or network.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Big enough for any lesson, small enough that `cat a >> a` can't eat the phone's memory. */
export const MAX_FILE_BYTES = 1_000_000;
export const MAX_TOTAL_BYTES = 20_000_000;

type FileNode = {
  type: "file";
  data: Uint8Array;
  mode: number;
  ino: number;
  mtimeMs: number;
};
type DirNode = {
  type: "dir";
  children: Map<string, Node>;
  mode: number;
  ino: number;
  mtimeMs: number;
};
type Node = FileNode | DirNode;

/** An error shaped like Node's (`code`, message "ENOENT: …"), which isomorphic-git expects. */
export class FsError extends Error {
  constructor(
    public code:
      | "ENOENT"
      | "EEXIST"
      | "ENOTDIR"
      | "EISDIR"
      | "ENOTEMPTY"
      | "ENOSPC"
      | "EINVAL"
      | "EFBIG",
    public path: string,
  ) {
    super(`${code}: ${FsError.text[code]}, '${path}'`);
  }

  static text = {
    ENOENT: "No such file or directory",
    EEXIST: "File exists",
    ENOTDIR: "Not a directory",
    EISDIR: "Is a directory",
    ENOTEMPTY: "Directory not empty",
    ENOSPC: "No space left on device",
    EINVAL: "Invalid argument",
    EFBIG: "File too large",
  };

  /** What a shell command prints: "No such file or directory". */
  get reason() {
    return FsError.text[this.code];
  }
}

export type Stats = {
  type: "file" | "dir";
  mode: number;
  size: number;
  ino: number;
  uid: number;
  gid: number;
  dev: number;
  mtimeMs: number;
  ctimeMs: number;
  isFile(): boolean;
  isDirectory(): boolean;
  isSymbolicLink(): boolean;
};

/** "/a/b/../c/./d" → "/a/c/d" (absolute input). */
export function normalize(path: string) {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return `/${parts.join("/")}`;
}

/** `path` from `cwd`, as an absolute normalized path. */
export function resolvePath(cwd: string, path: string) {
  return normalize(path.startsWith("/") ? path : `${cwd}/${path}`);
}

/** How ls and bash order names in an English locale: "apple.jpg" before "Beach.jpg". */
export const compareNames = (a: string, b: string) =>
  a.localeCompare(b, "en", { sensitivity: "base" }) ||
  (a < b ? -1 : a > b ? 1 : 0);

export const dirname = (path: string) =>
  normalize(path).replace(/\/[^/]*$/, "") || "/";
export const basename = (path: string) =>
  normalize(path).split("/").pop() ?? "";

export class MemFs {
  private root: DirNode;
  private nextIno = 1;
  private total = 0;
  /**
   * A clock that moves a second on every change: git compares file times to
   * spot edits, and two edits in the same real second would look the same.
   */
  private clock: number;

  constructor(start = Date.UTC(2026, 0, 5, 9, 0, 0)) {
    this.clock = start;
    this.root = this.dirNode();
  }

  private tick() {
    this.clock += 1000;
    return this.clock;
  }

  private dirNode(): DirNode {
    return {
      type: "dir",
      children: new Map(),
      mode: 0o40755,
      ino: this.nextIno++,
      mtimeMs: this.tick(),
    };
  }

  /** The node at an absolute path, or an FsError. */
  private find(path: string): Node {
    let node: Node = this.root;
    for (const part of normalize(path).split("/").filter(Boolean)) {
      if (node.type !== "dir") throw new FsError("ENOTDIR", path);
      const next: Node | undefined = node.children.get(part);
      if (!next) throw new FsError("ENOENT", path);
      node = next;
    }
    return node;
  }

  private parentOf(path: string): { dir: DirNode; name: string } {
    const parent = this.find(dirname(path));
    if (parent.type !== "dir") throw new FsError("ENOTDIR", path);
    const name = basename(path);
    if (!name) throw new FsError("EINVAL", path);
    return { dir: parent, name };
  }

  exists(path: string) {
    try {
      this.find(path);
      return true;
    } catch {
      return false;
    }
  }

  isDir(path: string) {
    try {
      return this.find(path).type === "dir";
    } catch {
      return false;
    }
  }

  isFile(path: string) {
    try {
      return this.find(path).type === "file";
    } catch {
      return false;
    }
  }

  stat(path: string): Stats {
    const node = this.find(path);
    const size = node.type === "file" ? node.data.length : 4096;
    return {
      type: node.type,
      mode: node.mode,
      size,
      ino: node.ino,
      uid: 1000,
      gid: 1000,
      dev: 1,
      mtimeMs: node.mtimeMs,
      ctimeMs: node.mtimeMs,
      isFile: () => node.type === "file",
      isDirectory: () => node.type === "dir",
      isSymbolicLink: () => false,
    };
  }

  readFile(path: string): Uint8Array {
    const node = this.find(path);
    if (node.type === "dir") throw new FsError("EISDIR", path);
    return node.data;
  }

  readText(path: string) {
    return decoder.decode(this.readFile(path));
  }

  writeFile(
    path: string,
    content: string | Uint8Array,
    options: { append?: boolean; mode?: number } = {},
  ) {
    const bytes =
      typeof content === "string" ? encoder.encode(content) : content;
    const { dir, name } = this.parentOf(path);
    const existing = dir.children.get(name);
    if (existing?.type === "dir") throw new FsError("EISDIR", path);
    const before = existing?.data ?? new Uint8Array();
    let data = bytes;
    if (options.append && existing) {
      data = new Uint8Array(before.length + bytes.length);
      data.set(before);
      data.set(bytes, before.length);
    }
    if (data.length > MAX_FILE_BYTES) throw new FsError("EFBIG", path);
    if (this.total - before.length + data.length > MAX_TOTAL_BYTES)
      throw new FsError("ENOSPC", path);
    this.total += data.length - before.length;
    if (existing) {
      existing.data = data;
      existing.mtimeMs = this.tick();
      if (options.mode) existing.mode = options.mode;
    } else {
      dir.children.set(name, {
        type: "file",
        data,
        mode: options.mode ?? 0o100644,
        ino: this.nextIno++,
        mtimeMs: this.tick(),
      });
      dir.mtimeMs = this.clock;
    }
  }

  /** Updates a file's time (like `touch`), creating it empty if missing. */
  touch(path: string) {
    if (!this.exists(path)) return this.writeFile(path, "");
    this.find(path).mtimeMs = this.tick();
  }

  chmod(path: string, mode: number) {
    const node = this.find(path);
    node.mode = (node.mode & ~0o7777) | (mode & 0o7777);
    node.mtimeMs = this.tick();
  }

  mkdir(path: string, options: { recursive?: boolean } = {}) {
    if (options.recursive) {
      let current = "";
      for (const part of normalize(path).split("/").filter(Boolean)) {
        current += `/${part}`;
        if (!this.exists(current)) this.mkdir(current);
        else if (!this.isDir(current)) throw new FsError("ENOTDIR", current);
      }
      return;
    }
    const { dir, name } = this.parentOf(path);
    if (dir.children.has(name)) throw new FsError("EEXIST", path);
    dir.children.set(name, this.dirNode());
    dir.mtimeMs = this.clock;
  }

  /** Names in a directory, sorted like `ls`. */
  readdir(path: string): string[] {
    const node = this.find(path);
    if (node.type !== "dir") throw new FsError("ENOTDIR", path);
    return [...node.children.keys()].sort(compareNames);
  }

  unlink(path: string) {
    const { dir, name } = this.parentOf(path);
    const node = dir.children.get(name);
    if (!node) throw new FsError("ENOENT", path);
    if (node.type === "dir") throw new FsError("EISDIR", path);
    this.total -= node.data.length;
    dir.children.delete(name);
    dir.mtimeMs = this.tick();
  }

  rmdir(path: string, options: { recursive?: boolean } = {}) {
    const { dir, name } = this.parentOf(path);
    const node = dir.children.get(name);
    if (!node) throw new FsError("ENOENT", path);
    if (node.type !== "dir") throw new FsError("ENOTDIR", path);
    if (node.children.size && !options.recursive)
      throw new FsError("ENOTEMPTY", path);
    this.total -= this.sizeOf(node);
    dir.children.delete(name);
    dir.mtimeMs = this.tick();
  }

  private sizeOf(node: Node): number {
    if (node.type === "file") return node.data.length;
    let size = 0;
    for (const child of node.children.values()) size += this.sizeOf(child);
    return size;
  }

  rename(from: string, to: string) {
    const source = this.parentOf(from);
    const node = source.dir.children.get(source.name);
    if (!node) throw new FsError("ENOENT", from);
    if (normalize(to).startsWith(`${normalize(from)}/`))
      throw new FsError("EINVAL", to);
    const target = this.parentOf(to);
    const existing = target.dir.children.get(target.name);
    if (existing?.type === "dir") throw new FsError("EISDIR", to);
    if (existing) this.total -= existing.data.length;
    source.dir.children.delete(source.name);
    target.dir.children.set(target.name, node);
    node.mtimeMs = this.tick();
  }

  /** Copies a file or (recursive) a directory. */
  copy(from: string, to: string) {
    const node = this.find(from);
    if (node.type === "file") {
      this.writeFile(to, node.data.slice(), { mode: node.mode });
      return;
    }
    if (normalize(to).startsWith(`${normalize(from)}/`))
      throw new FsError("EINVAL", to);
    if (!this.exists(to)) this.mkdir(to);
    for (const name of this.readdir(from))
      this.copy(`${normalize(from)}/${name}`, `${normalize(to)}/${name}`);
  }

  /** Every file under a directory, as paths relative to it (for checks). */
  walk(path: string, prefix = ""): string[] {
    const files: string[] = [];
    for (const name of this.readdir(path)) {
      const full = `${normalize(path)}/${name}`.replace("//", "/");
      if (this.isDir(full)) files.push(...this.walk(full, `${prefix}${name}/`));
      else files.push(`${prefix}${name}`);
    }
    return files;
  }

  /**
   * Node's fs.promises shape, for isomorphic-git. Files come back as
   * Buffers (git's code calls .toString on them) unless an encoding is asked.
   */
  readonly promises = {
    readFile: async (
      path: string,
      options?: string | { encoding?: string },
    ) => {
      const data = this.readFile(path);
      const encoding =
        typeof options === "string" ? options : options?.encoding;
      return encoding ? decoder.decode(data) : Buffer.from(data);
    },
    writeFile: async (
      path: string,
      data: string | Uint8Array,
      options?: { mode?: number } | string,
    ) =>
      this.writeFile(path, data, {
        mode: typeof options === "object" ? options.mode : undefined,
      }),
    mkdir: async (path: string) => this.mkdir(path),
    rmdir: async (path: string) => this.rmdir(path),
    unlink: async (path: string) => this.unlink(path),
    stat: async (path: string) => this.stat(path),
    lstat: async (path: string) => this.stat(path),
    readdir: async (path: string) => this.readdir(path),
    readlink: async (path: string): Promise<string> => {
      throw new FsError("EINVAL", path);
    },
    symlink: async (_target: string, path: string) => {
      throw new FsError("EINVAL", path);
    },
    chmod: async (path: string, mode: number) => this.chmod(path, mode),
  };
}
