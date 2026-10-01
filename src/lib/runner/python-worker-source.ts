import { PYTHON_DRIVER } from "./execute-python";

export const PYODIDE_VERSION = "314.0.7"; // keep in sync with the pyodide devDependency
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/**
 * Source of the Python Web Worker. It is started from a Blob as a native ES
 * module (Pyodide refuses the classic workers our bundler would produce).
 * Messages:  in  { id, code, checks }
 *            out { type: "ready" | "load-error" | "started" | "line" | "done" }
 */
export function pythonWorkerSource() {
  return `
const indexURL = ${JSON.stringify(PYODIDE_INDEX_URL)};
const DRIVER = ${JSON.stringify(PYTHON_DRIVER)};

const ready = (async () => {
  const { loadPyodide } = await import(indexURL + "pyodide.mjs");
  const pyodide = await loadPyodide({ indexURL });
  pyodide.runPython(DRIVER);
  return pyodide;
})();

ready.then(
  () => postMessage({ type: "ready" }),
  (error) => postMessage({ type: "load-error", message: String(error && error.message || error) }),
);

onmessage = async (event) => {
  const { id, code, checks } = event.data;
  const pyodide = await ready;
  postMessage({ type: "started", id });
  const run = pyodide.globals.get("_panda_run");
  const pyChecks = pyodide.toPy(checks);
  try {
    const raw = run(code, pyChecks, (level, text) =>
      postMessage({ type: "line", id, line: { level, text } }),
    );
    postMessage({ type: "done", id, raw });
  } finally {
    pyChecks.destroy();
    run.destroy();
  }
};
`;
}
