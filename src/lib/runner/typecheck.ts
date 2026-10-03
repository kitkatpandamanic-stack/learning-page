import type * as TS from "typescript";

import type { ExecuteResult, OutputLine, TestSpec } from "./execute";
import { PAGE_MODULE_TYPES, WORKER_MODULE_TYPES } from "./module-types";

/** Must match the installed `typescript` package (a test keeps them in sync). */
export const TYPESCRIPT_VERSION = "6.0.3";

/**
 * Where the code runs decides what it can use: plain TypeScript runs in a
 * Web Worker (fetch, timers and crypto, but no DOM), page exercises and
 * React (TSX) run in a page with the DOM.
 */
export type TypeEnv = "worker" | "page" | "react";

const DOM_LIBS = [
  "lib.es2023.d.ts",
  "lib.dom.d.ts",
  "lib.dom.iterable.d.ts",
  "lib.dom.asynciterable.d.ts",
];

/** Standard library files for each environment (their references load too). */
export const ENV_LIBS: Record<TypeEnv, string[]> = {
  worker: [
    "lib.es2023.d.ts",
    "lib.webworker.d.ts",
    "lib.webworker.iterable.d.ts",
    "lib.webworker.asynciterable.d.ts",
  ],
  page: DOM_LIBS,
  react: DOM_LIBS,
};

/**
 * React's own type packages (@types/react, @types/react-dom and csstype),
 * as paths in the types folder (see scripts/vendor-name.mjs).
 */
export const REACT_TYPE_FILES = [
  "react/index.d.ts",
  "react/global.d.ts",
  "react/jsx-runtime.d.ts",
  "react-dom/index.d.ts",
  "react-dom/client.d.ts",
  "csstype/index.d.ts",
];

/** What `import … from "…"` finds in each environment. */
const ENV_MODULES: Record<TypeEnv, string> = {
  worker: WORKER_MODULE_TYPES,
  page: "",
  react: PAGE_MODULE_TYPES,
};

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

const MODULES = "/runner-modules.d.ts";
const LIB_DIR = "/lib/";
const TYPES_DIR = "/types/";

/**
 * Creates a reusable type checker for one environment. `readLib` returns
 * the text of a standard library file such as "lib.es2023.d.ts", or of a
 * React type file such as "types/react/index.d.ts" (read from disk in
 * tests, downloaded in the browser). Those files are parsed once and reused.
 */
export function createTypeChecker(
  ts: typeof TS,
  readLib: (fileName: string) => string | undefined,
  env: TypeEnv = "worker",
) {
  const react = env === "react";
  const LESSON = react ? "/lesson.tsx" : "/lesson.ts";
  const types = (name: string) => [`${TYPES_DIR}${name}`];
  const options: TS.CompilerOptions = {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    moduleDetection: ts.ModuleDetectionKind.Force,
    esModuleInterop: true,
    lib: ENV_LIBS[env],
    types: [],
    noEmit: true,
    ...(react && {
      jsx: ts.JsxEmit.ReactJSX,
      paths: {
        react: types("react/index.d.ts"),
        "react/jsx-runtime": types("react/jsx-runtime.d.ts"),
        "react-dom": types("react-dom/index.d.ts"),
        "react-dom/client": types("react-dom/client.d.ts"),
        csstype: types("csstype/index.d.ts"),
      },
    }),
  };
  const libFiles = new Map<string, TS.SourceFile | undefined>();
  let oldProgram: TS.Program | undefined;

  return function check(code: string): TypeDiagnostic[] {
    const files = new Map([
      [LESSON, code],
      [MODULES, ENV_MODULES[env]],
    ]);
    const readFile = (fileName: string) =>
      fileName.startsWith(LIB_DIR)
        ? readLib(fileName.slice(LIB_DIR.length))
        : fileName.startsWith(TYPES_DIR)
          ? readLib(fileName.slice(1))
          : files.get(fileName);

    const host: TS.CompilerHost = {
      getSourceFile(fileName, languageVersion) {
        if (fileName === LESSON) {
          return ts.createSourceFile(fileName, code, languageVersion);
        }
        // Everything else (libraries, module types) is parsed once.
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
      rootNames: [LESSON, MODULES],
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
        message: withHints(ts, d),
        code: d.code,
      };
    });
  };
}

/**
 * The message, plus hints the compiler attaches separately that an editor
 * shows with it, like "Did you forget to use 'await'?".
 */
function withHints(ts: typeof TS, d: TS.Diagnostic) {
  const hints = (d.relatedInformation ?? [])
    .filter((info) => HINT_CODES.has(info.code))
    .map((info) => ts.flattenDiagnosticMessageText(info.messageText, "\n"));
  return [ts.flattenDiagnosticMessageText(d.messageText, "\n"), ...hints].join(
    "\n  ",
  );
}

/** "Did you forget to use 'await'?" */
const HINT_CODES = new Set([2773]);

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
