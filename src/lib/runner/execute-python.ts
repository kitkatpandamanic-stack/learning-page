import type { PyodideInterface } from "pyodide";

import {
  MAX_OUTPUT_LINES,
  type ExecuteResult,
  type LogLevel,
  type OutputLine,
  type RunError,
  type TestResult,
  type TestSpec,
} from "./execute";

/**
 * Python side of the runner. Runs learner code in a fresh namespace, streams
 * printed lines to JavaScript, and evaluates test expressions in that same
 * namespace. Returns a JSON string so no Python objects leak into JS.
 */
export const PYTHON_DRIVER = `
import builtins, json, sys, traceback

_PANDA_MAX_LINES = __MAX_LINES__

class _PandaCounter:
    def __init__(self, emit):
        self.emit, self.count, self.stopped = emit, 0, False
    def __call__(self, level, text):
        if self.count >= _PANDA_MAX_LINES:
            if not self.stopped:
                self.stopped = True
                self.emit("warn", f"Output stopped after {_PANDA_MAX_LINES} lines.")
            return
        self.count += 1
        self.emit(level, text)

class _PandaStream:
    def __init__(self, level, emit, record=None):
        self.level, self.emit, self.record, self.buf = level, emit, record, ""
    def write(self, s):
        self.buf += s
        while "\\n" in self.buf:
            line, self.buf = self.buf.split("\\n", 1)
            self._line(line)
        return len(s)
    def _line(self, line):
        if self.record is not None:
            self.record.append(line)
        self.emit(self.level, line)
    def flush(self):
        if self.buf:
            self._line(self.buf)
            self.buf = ""

def _panda_no_input(*args, **kwargs):
    raise RuntimeError("input() isn't supported here yet. Set the value in a variable instead.")

def _panda_error(exc):
    line = getattr(exc, "lineno", None) if isinstance(exc, SyntaxError) else None
    if line is None:
        frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == "<lesson>"]
        line = frames[-1].lineno if frames else None
    message = str(exc) if not isinstance(exc, SyntaxError) else (exc.msg or str(exc))
    return {"name": type(exc).__name__, "message": message, "line": line}

def _panda_run(code, checks, emit):
    emit = _PandaCounter(emit)
    output = []
    out = _PandaStream("log", emit, output)
    err = _PandaStream("error", emit)
    old_out, old_err, old_input = sys.stdout, sys.stderr, builtins.input
    sys.stdout, sys.stderr, builtins.input = out, err, _panda_no_input
    namespace = {"__name__": "__main__", "__output": output}
    result = {"error": None, "tests": None}
    try:
        exec(compile(code, "<lesson>", "exec"), namespace)
    except BaseException as exc:
        out.flush()
        result["error"] = _panda_error(exc)
        emit("error", f"{result['error']['name']}: {result['error']['message']}")
    finally:
        out.flush()
        err.flush()
        sys.stdout, sys.stderr, builtins.input = old_out, old_err, old_input
    if checks:
        tests = []
        for check in checks:
            if result["error"]:
                tests.append({"passed": False, "error": "Fix the error in your code first."})
                continue
            try:
                tests.append({"passed": bool(eval(check, namespace))})
            except BaseException as exc:
                tests.append({"passed": False, "error": f"{type(exc).__name__}: {exc}"})
        result["tests"] = tests
    return json.dumps(result)
`.replace("__MAX_LINES__", String(MAX_OUTPUT_LINES));

/** Turns the driver's JSON into a runner result. Shared by the browser worker and Node tests. */
export function parsePythonResult(
  raw: string,
  tests: TestSpec[],
  output: OutputLine[],
): ExecuteResult {
  const parsed = JSON.parse(raw) as {
    error: { name: string; message: string; line: number | null } | null;
    tests: { passed: boolean; error?: string }[] | null;
  };
  const error: RunError | undefined = parsed.error
    ? {
        name: parsed.error.name,
        message: parsed.error.message,
        line: parsed.error.line ?? undefined,
      }
    : undefined;
  const results: TestResult[] | undefined = parsed.tests?.map((t, i) => ({
    name: tests[i].name,
    passed: t.passed,
    error: t.error,
  }));
  return { output, error, tests: tests.length ? results : undefined };
}

const driverLoaded = new WeakSet<PyodideInterface>();

/** Runs Python with an already-loaded Pyodide (used by Node tests). */
export async function executePython(
  pyodide: PyodideInterface,
  code: string,
  options: { tests?: TestSpec[]; onLine?: (line: OutputLine) => void } = {},
): Promise<ExecuteResult> {
  const { tests = [], onLine } = options;
  if (!driverLoaded.has(pyodide)) {
    pyodide.runPython(PYTHON_DRIVER);
    driverLoaded.add(pyodide);
  }
  const output: OutputLine[] = [];
  const emit = (level: LogLevel, text: string) => {
    const line = { level, text };
    output.push(line);
    onLine?.(line);
  };
  const run = pyodide.globals.get("_panda_run");
  const checks = pyodide.toPy(tests.map((t) => t.check));
  try {
    return parsePythonResult(run(code, checks, emit), tests, output);
  } finally {
    checks.destroy();
    run.destroy();
  }
}
