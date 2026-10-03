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
 *
 * The browser has no threads, so the driver also swaps in versions of the
 * few things that need them: `asyncio.run` gets a simple event loop, FastAPI's
 * TestClient runs the app on that loop, and `matplotlib`'s `plt.show()` sends
 * the chart to the output as an image.
 *
 * The code is also saved as `lesson.py`, so `pytest.main([__file__])` can
 * collect the tests in it.
 */
export const PYTHON_DRIVER = `
import asyncio, builtins, contextlib, io, json, os, re, selectors, sys, time, traceback
import importlib, importlib.util

_PANDA_MAX_LINES = __MAX_LINES__
_PANDA_DIR = "/home/pyodide/lesson"
_PANDA_FILE = _PANDA_DIR + "/lesson.py"

sys.dont_write_bytecode = True  # lesson.py changes every run
os.environ["MPLBACKEND"] = "agg"
os.environ["COLUMNS"] = "60"
os.environ["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"  # e.g. anyio's, which warns once imported
os.makedirs(_PANDA_DIR, exist_ok=True)
# No cache files, and no unraisableexception plugin, whose gc.collect()
# calls after each session cost ~0.3 s once FastAPI is loaded.
with open(_PANDA_DIR + "/pytest.ini", "w") as f:
    f.write("[pytest]\\naddopts = -q -p no:cacheprovider -p no:unraisableexception\\n")

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

class _PandaStream(io.TextIOBase):
    def __init__(self, level, emit, record=None):
        self.level, self.emit, self.record, self.buf = level, emit, record, ""
    @property
    def encoding(self):
        return "utf-8"
    def writable(self):
        return True
    def isatty(self):
        return False
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
        pass  # pytest flushes after each dot; lines are sent whole
    def finish(self):
        if self.buf:
            self._line(self.buf)
            self.buf = ""

_panda_emit = None  # the current run's output, for plt.show()

def _panda_no_input(*args, **kwargs):
    raise RuntimeError("input() isn't supported here yet. Set the value in a variable instead.")

def _panda_error(exc):
    line = getattr(exc, "lineno", None) if isinstance(exc, SyntaxError) else None
    if line is None:
        frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == "<lesson>"]
        line = frames[-1].lineno if frames else None
    message = str(exc) if not isinstance(exc, SyntaxError) else (exc.msg or str(exc))
    # Python adds hints when it prints an error ("Did you mean: 'score'?");
    # they aren't part of str(exc), so take them from the printed form.
    try:
        # (with the traceback: name hints come from the failing frame)
        printed = list(
            traceback.TracebackException.from_exception(exc).format_exception_only()
        )[-1].rstrip("\\n")
        hint = re.search(r"\\. (Did you mean: .+|Did you forget to import .+)$", printed)
        if hint and hint.group(1) not in message:
            message = f"{message}. {hint.group(1)}"
    except Exception:
        pass
    return {"name": type(exc).__name__, "message": message, "line": line}

# --- asyncio without threads or sockets ---------------------------------

class _PandaSelector(selectors.BaseSelector):
    """Nothing to watch, so "waiting" just means letting time pass."""
    def register(self, fileobj, events, data=None):
        raise RuntimeError("Network connections aren't available here.")
    def unregister(self, fileobj):
        raise KeyError(fileobj)
    def select(self, timeout=None):
        if timeout is None:
            raise RuntimeError("Your async code is waiting for something that never happens.")
        end = time.monotonic() + timeout
        while time.monotonic() < end:
            pass
        return []
    def get_map(self):
        return {}
    def close(self):
        pass

class _PandaLoop(asyncio.SelectorEventLoop):
    def __init__(self):
        super().__init__(_PandaSelector())
    def _make_self_pipe(self):
        pass
    def _close_self_pipe(self):
        pass
    def _write_to_self(self):
        pass
    def run_until_complete(self, future):
        # Pyodide's own browser event loop counts as "running"; step aside for it.
        outer = asyncio.events._get_running_loop()
        if isinstance(outer, _PandaLoop):
            return super().run_until_complete(future)  # raises the usual error
        asyncio.events._set_running_loop(None)
        try:
            return super().run_until_complete(future)
        finally:
            asyncio.events._set_running_loop(outer)
    def run_in_executor(self, executor, func, *args):
        # No threads: run it right away (asyncio.to_thread still works).
        future = self.create_future()
        try:
            future.set_result(func(*args))
        except BaseException as exc:
            future.set_exception(exc)
        return future

def _panda_asyncio_run(main, *, debug=None, loop_factory=None):
    if not asyncio.iscoroutine(main):
        raise ValueError(f"a coroutine was expected, got {main!r}")
    if isinstance(asyncio.events._get_running_loop(), _PandaLoop):
        main.close()
        raise RuntimeError("asyncio.run() cannot be called from a running event loop")
    loop = (loop_factory or _PandaLoop)()
    if debug is not None:
        loop.set_debug(debug)
    try:
        return loop.run_until_complete(main)
    finally:
        try:
            asyncio.runners._cancel_all_tasks(loop)
            loop.run_until_complete(loop.shutdown_asyncgens())
        finally:
            loop.close()

asyncio.run = _panda_asyncio_run
asyncio.new_event_loop = asyncio.events.new_event_loop = _PandaLoop

# --- libraries that expect threads, files or a screen --------------------

class _PandaPortal:
    """Stands in for anyio's blocking portal (used by TestClient) on one loop."""
    def __init__(self):
        self.loop = _PandaLoop()
    def _wrap(self, func, args):
        async def go():
            result = func(*args)
            return await result if hasattr(result, "__await__") else result
        return go()
    def call(self, func, *args):
        return self.loop.run_until_complete(self._wrap(func, args))
    def start_task_soon(self, func, *args, name=None):
        import concurrent.futures
        future = concurrent.futures.Future()
        task = self.loop.create_task(self._wrap(func, args))
        def done(t):
            if t.cancelled():
                future.cancel()
            elif t.exception() is not None:
                future.set_exception(t.exception())
            else:
                future.set_result(t.result())
        task.add_done_callback(done)
        return future
    def close(self):
        try:
            asyncio.runners._cancel_all_tasks(self.loop)
        finally:
            self.loop.close()

@contextlib.contextmanager
def _panda_blocking_portal(*args, **kwargs):
    portal = _PandaPortal()
    try:
        yield portal
    finally:
        portal.close()

async def _panda_inline(func, *args, **kwargs):
    return func(*args)

def _panda_show(*args, **kwargs):
    import base64
    import matplotlib.pyplot as plt
    if _panda_pytest_running:  # pytest importing lesson.py runs its code again
        plt.close("all")
        return
    for number in plt.get_fignums():
        buffer = io.BytesIO()
        plt.figure(number).savefig(buffer, format="png", dpi=80, bbox_inches="tight")
        if _panda_emit:
            _panda_emit("image", "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode())
    plt.close("all")

_panda_patched = set()
_panda_pytest_running = False

def _panda_patch():
    """Patches libraries once they've been imported."""
    if "anyio" in sys.modules and "anyio" not in _panda_patched:
        import anyio.from_thread, anyio.to_thread
        anyio.from_thread.start_blocking_portal = _panda_blocking_portal
        anyio.to_thread.run_sync = _panda_inline
        _panda_patched.add("anyio")
    if "matplotlib.pyplot" in sys.modules and "matplotlib" not in _panda_patched:
        import warnings
        import matplotlib
        import matplotlib.pyplot as plt
        # Pyodide's matplotlib build warns about its own internals.
        warnings.filterwarnings("ignore", category=matplotlib.MatplotlibDeprecationWarning)
        plt.show = _panda_show
        _panda_patched.add("matplotlib")
    if "pytest" in sys.modules and "pytest" not in _panda_patched:
        import pytest
        real_main = pytest.main
        def main(args=None, plugins=None):
            global _panda_pytest_running
            if _panda_pytest_running:
                return 0  # lesson.py calling pytest.main() while pytest imports it
            _panda_pytest_running = True
            sys.modules.pop("lesson", None)
            try:
                return real_main(args, plugins)
            finally:
                _panda_pytest_running = False
        pytest.main = main
        _panda_patched.add("pytest")

_PANDA_SKIP_IMPORTS = {"this", "antigravity", "__hello__", "__phello__", "lesson"}

def _panda_prepare(code):
    """Imports the code's packages up front, so slow imports don't count as running time."""
    from pyodide.code import find_imports
    try:
        names = find_imports(code)
    except SyntaxError:
        names = []
    for name in names:
        if name.split(".")[0] in _PANDA_SKIP_IMPORTS or name in sys.modules:
            continue
        try:
            if importlib.util.find_spec(name.split(".")[0]) is not None:
                importlib.import_module(name)
        except BaseException:
            pass
    _panda_patch()

# --- checking pytest results ---------------------------------------------

class _PandaTally:
    def __init__(self, patch):
        self.patch, self.passed, self.failed, self.errors = patch or {}, 0, 0, 0
    def pytest_collectreport(self, report):
        if report.failed:
            self.errors += 1
    def pytest_runtest_setup(self, item):
        for name, value in self.patch.items():
            setattr(item.module, name, value)
    def pytest_runtest_logreport(self, report):
        if report.when == "call":
            if report.passed:
                self.passed += 1
            elif report.failed:
                self.failed += 1
        elif report.failed:
            self.errors += 1

def _panda_pytest(patch=None):
    """For exercise checks: runs the tests in lesson.py quietly and counts results.
    \`patch\` replaces names in the module first, e.g. with a buggy function the tests should catch."""
    import pytest
    _panda_patch()
    tally = _PandaTally(patch)
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        code = pytest.main([_PANDA_FILE], plugins=[tally])
    return {"passed": tally.passed, "failed": tally.failed, "errors": tally.errors, "exit": int(code)}

# --- running learner code -------------------------------------------------

def _panda_run(code, checks, emit):
    global _panda_emit
    emit = _PandaCounter(emit)
    _panda_emit = emit
    with open(_PANDA_FILE, "w") as f:
        f.write(code)
    sys.modules.pop("lesson", None)
    if "logging" in sys.modules:
        # Handlers from an earlier run still write to that run's output.
        import logging
        for handler in logging.root.handlers[:]:
            logging.root.removeHandler(handler)
        logging.root.setLevel(logging.WARNING)
    output = []
    out = _PandaStream("log", emit, output)
    err = _PandaStream("error", emit)
    old_out, old_err, old_input, old_cwd = sys.stdout, sys.stderr, builtins.input, os.getcwd()
    sys.stdout, sys.stderr, builtins.input = out, err, _panda_no_input
    os.chdir(_PANDA_DIR)
    namespace = {"__name__": "__main__", "__file__": _PANDA_FILE, "__output": output}
    result = {"error": None, "tests": None}
    try:
        _panda_patch()
        exec(compile(code, "<lesson>", "exec"), namespace)
    except BaseException as exc:
        out.finish()
        result["error"] = _panda_error(exc)
        emit("error", f"{result['error']['name']}: {result['error']['message']}")
    finally:
        out.finish()
        err.finish()
        _panda_patch()  # the code may have imported something new
        sys.stdout, sys.stderr, builtins.input = old_out, old_err, old_input
    if checks:
        tests = []
        scope = {**namespace, "_panda_pytest": _panda_pytest}
        for check in checks:
            if result["error"]:
                tests.append({"passed": False, "error": "Fix the error in your code first."})
                continue
            try:
                tests.append({"passed": bool(eval(check, scope))})
            except BaseException as exc:
                tests.append({"passed": False, "error": f"{type(exc).__name__}: {exc}"})
        result["tests"] = tests
    os.chdir(old_cwd)
    _panda_emit = None
    return json.dumps(result)
`.replace("__MAX_LINES__", String(MAX_OUTPUT_LINES));

/** A line from the driver; charts arrive with the level "image". */
export function pythonLine(level: string, text: string): OutputLine {
  return level === "image"
    ? { level: "log", text: "", image: text }
    : { level: level as LogLevel, text };
}

/** Package names from Pyodide's "Loading pandas, numpy" messages. */
export function packagesFromMessage(message: string): string[] | null {
  const match = /^Loading (.+)$/.exec(message.trim());
  return match ? match[1].split(/,\s*/).filter(Boolean) : null;
}

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

/**
 * The code plus imports Pyodide can't see in it: zoneinfo finds its time
 * zones in the tzdata package. Used to pick the packages to install.
 */
export function withImpliedImports(code: string) {
  return /^\s*(?:import|from)\s+zoneinfo\b/m.test(code)
    ? `${code}\nimport tzdata`
    : code;
}

const driverLoaded = new WeakSet<PyodideInterface>();

/**
 * Runs Python with an already-loaded Pyodide (used by Node tests), installing
 * the packages the code imports first, like the browser does.
 */
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
  await pyodide.loadPackagesFromImports(withImpliedImports(code), {
    messageCallback: () => {},
  });
  const prepare = pyodide.globals.get("_panda_prepare");
  try {
    prepare(code);
  } finally {
    prepare.destroy();
  }
  const output: OutputLine[] = [];
  const emit = (level: string, text: string) => {
    const line = pythonLine(level, text);
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
