import { PYTHON_DRIVER, withImpliedImports } from "./execute-python";

export const PYODIDE_VERSION = "314.0.7"; // keep in sync with the pyodide devDependency
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/**
 * Source of the Python Web Worker. It is started from a Blob as a native ES
 * module (Pyodide refuses the classic workers our bundler would produce).
 * Messages:  in  { id, code, checks }
 *            out { type: "ready" | "load-error" | "installing" | "started" | "line" | "done" }
 */
export function pythonWorkerSource() {
  return `
const indexURL = ${JSON.stringify(PYODIDE_INDEX_URL)};
const DRIVER = ${JSON.stringify(PYTHON_DRIVER)};
const withImpliedImports = ${withImpliedImports.toString()};

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

function importsOf(code) {
  return [...code.matchAll(/^\\s*(?:import|from)\\s+([A-Za-z_]\\w*)/gm)].map((m) => m[1]);
}

onmessage = async (event) => {
  const { id, code, checks } = event.data;
  const pyodide = await ready;
  // Install the packages the code imports (pandas, pytest…), once per page.
  // Pyodide lists every dependency; name just the ones the code imports.
  try {
    await pyodide.loadPackagesFromImports(withImpliedImports(code), {
      messageCallback: (message) => {
        const match = /^Loading (.+)$/.exec(String(message).trim());
        if (!match) return;
        const all = match[1].split(/,\\s*/);
        const imported = new Set(importsOf(code).map((n) => n.toLowerCase()));
        const named = all.filter((n) => imported.has(n.toLowerCase()));
        postMessage({ type: "installing", id, packages: (named.length ? named : all.slice(0, 3)).join(", ") });
      },
      errorCallback: () => {},
    });
  } catch {
    // Unknown packages fail later with a normal ModuleNotFoundError.
  }
  const prepare = pyodide.globals.get("_panda_prepare");
  try {
    prepare(code);
  } finally {
    prepare.destroy();
  }
  postMessage({ type: "started", id });
  const run = pyodide.globals.get("_panda_run");
  const pyChecks = pyodide.toPy(checks);
  try {
    const raw = run(code, pyChecks, (level, text) =>
      postMessage({ type: "line", id, level, text }),
    );
    postMessage({ type: "done", id, raw });
  } finally {
    pyChecks.destroy();
    run.destroy();
  }
};
`;
}
