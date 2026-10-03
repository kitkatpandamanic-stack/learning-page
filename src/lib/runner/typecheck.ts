import type * as TS from "typescript";

import type { ExecuteResult, OutputLine, TestSpec } from "./execute";

/** Must match the installed `typescript` package (a test keeps them in sync). */
export const TYPESCRIPT_VERSION = "6.0.3";

/** Standard library for lesson code: modern JavaScript, no DOM. */
export const TS_LIB = "lib.es2023.d.ts";

/** Globals the code runner provides (see execute.ts). */
export const RUNNER_GLOBALS = `
declare var console: {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  debug(...data: any[]): void;
  table(...data: any[]): void;
};
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
`;

export type TypeDiagnostic = {
  /** 1-based */
  line: number;
  /** 1-based */
  column: number;
  /** Offset into the code, for editor underlines */
  start: number;
  length: number;
  message: string;
  code: number;
};

const LESSON = "/lesson.ts";
const GLOBALS = "/runner-globals.d.ts";
const LIB_DIR = "/lib/";

/**
 * Creates a reusable type checker. `readLib` returns the text of a standard
 * library file such as "lib.es2023.d.ts" (read from disk in tests, fetched
 * from a CDN in the browser). Library files are parsed once and reused.
 */
export function createTypeChecker(
  ts: typeof TS,
  readLib: (fileName: string) => string | undefined,
) {
  const options: TS.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleDetection: ts.ModuleDetectionKind.Force,
    lib: [TS_LIB],
    types: [],
    noEmit: true,
  };
  const libFiles = new Map<string, TS.SourceFile | undefined>();
  let oldProgram: TS.Program | undefined;

  return function check(code: string): TypeDiagnostic[] {
    const files = new Map([
      [LESSON, code],
      [GLOBALS, RUNNER_GLOBALS],
    ]);
    const readFile = (fileName: string) =>
      fileName.startsWith(LIB_DIR)
        ? readLib(fileName.slice(LIB_DIR.length))
        : files.get(fileName);

    const host: TS.CompilerHost = {
      getSourceFile(fileName, languageVersion) {
        if (fileName.startsWith(LIB_DIR)) {
          if (!libFiles.has(fileName)) {
            const text = readFile(fileName);
            libFiles.set(
              fileName,
              text === undefined
                ? undefined
                : ts.createSourceFile(fileName, text, languageVersion),
            );
          }
          return libFiles.get(fileName);
        }
        const text = files.get(fileName);
        return text === undefined
          ? undefined
          : ts.createSourceFile(fileName, text, languageVersion);
      },
      getDefaultLibFileName: () => `${LIB_DIR}lib.d.ts`,
      getDefaultLibLocation: () => LIB_DIR.slice(0, -1),
      writeFile: () => {},
      getCurrentDirectory: () => "/",
      getCanonicalFileName: (fileName) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      fileExists: (fileName) => readFile(fileName) !== undefined,
      readFile,
      directoryExists: () => true,
      getDirectories: () => [],
    };

    const program = ts.createProgram({
      rootNames: [LESSON, GLOBALS],
      options,
      host,
      oldProgram,
    });
    oldProgram = program;
    const source = program.getSourceFile(LESSON)!;
    const syntactic = program.getSyntacticDiagnostics(source);
    // Type errors in code that doesn't parse are mostly noise.
    const diagnostics = syntactic.length
      ? syntactic
      : [
          ...program.getGlobalDiagnostics(),
          ...program.getSemanticDiagnostics(source),
        ];

    return diagnostics.map((d) => {
      const start = d.start ?? 0;
      const { line, character } =
        d.file === source
          ? source.getLineAndCharacterOfPosition(start)
          : { line: 0, character: 0 };
      return {
        line: line + 1,
        column: character + 1,
        start: d.file === source ? start : 0,
        length: d.file === source ? (d.length ?? 0) : 0,
        message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
        code: d.code,
      };
    });
  };
}

export function formatTypeError(d: TypeDiagnostic) {
  return `Line ${d.line}: ${d.message}`;
}

/** What a run reports when the code has type errors: it doesn't run at all. */
export function typeErrorResult(
  diagnostics: TypeDiagnostic[],
  tests: TestSpec[] = [],
): ExecuteResult {
  const output: OutputLine[] = diagnostics.map((d) => ({
    level: "error",
    text: formatTypeError(d),
  }));
  const count = diagnostics.length;
  const message = `${count} type error${count === 1 ? "" : "s"}. Fix ${count === 1 ? "it" : "them"} to run your code.`;
  output.push({ level: "warn", text: message });
  return {
    output,
    error: { name: "TypeError", message },
    tests: tests.length
      ? tests.map((t) => ({
          name: t.name,
          passed: false,
          error: "Fix the type errors first.",
        }))
      : undefined,
  };
}
