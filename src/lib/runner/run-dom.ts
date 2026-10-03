import {
  prepareDomCode,
  previewDocument,
  type DomRunResult,
} from "./dom-harness";
import type { OutputLine, TestSpec } from "./execute";
import { createFakeApi, type FakeRequest } from "./fake-api";
import { RUN_TIMEOUT_MS, type RunResult } from "./run-code";

type FrameMessage =
  | { type: "line"; token: string; line: OutputLine }
  | { type: "storage"; token: string; data: Record<string, string> }
  | { type: "fetch"; token: string; id: number; request: FakeRequest }
  | { type: "done"; token: string; result: DomRunResult };

export type DomRun = {
  result: Promise<RunResult>;
  /** Ends a run that hasn't finished yet */
  cancel: () => void;
  /** Stops listening and removes the page (hidden runs remove themselves) */
  dispose: () => void;
};

/**
 * Runs learner JavaScript against an HTML page in a sandboxed iframe. With a
 * `container`, the page stays visible and interactive after the run, and
 * console lines from later events keep arriving through `onLine`. Without
 * one, the page runs hidden (for checks) and is removed when done.
 */
let reactScript: Promise<string> | null = null;

/** React for preview pages (see scripts/build-vendor.mjs), fetched once. */
function loadReactScript() {
  reactScript ??= fetch(process.env.NEXT_PUBLIC_REACT_VENDOR ?? "")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    // Inline, "</script" would end the tag early.
    .then(
      (code) => `<script>${code.replaceAll("</script", "<\\/script")}</script>`,
    )
    .catch((error: unknown) => {
      reactScript = null; // try again next time
      throw error;
    });
  return reactScript;
}

export function runDom(
  code: string,
  options: {
    html: string;
    tests?: TestSpec[];
    container?: HTMLElement;
    onLine?: (line: OutputLine) => void;
    timeoutMs?: number;
    /** What the page's localStorage starts with */
    storage?: Record<string, string>;
    /** Called with all of localStorage whenever the page changes it */
    onStorage?: (data: Record<string, string>) => void;
    /** Load React into the page and turn JSX into JavaScript */
    react?: boolean;
  },
): DomRun {
  const {
    html,
    tests,
    container,
    onLine,
    timeoutMs = RUN_TIMEOUT_MS,
    storage,
    onStorage,
    react = false,
  } = options;
  const token = Math.random().toString(36).slice(2);
  const started = performance.now();
  const lines: OutputLine[] = [];

  const frame = document.createElement("iframe");
  // Scripts run, but in an opaque origin: no access to this page or cookies.
  frame.sandbox.add("allow-scripts", "allow-forms");
  frame.title = "Preview of your page";
  frame.className = "block h-full w-full border-0 bg-[#0b0d1f]";
  // Each page gets its own practice API, so its data starts fresh.
  const api = createFakeApi();
  if (!container) {
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    Object.assign(frame.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "800px",
      height: "600px",
    });
  }

  let finish: (r: RunResult) => void = () => {};
  const result = new Promise<RunResult>((resolve) => {
    finish = (r) => {
      clearTimeout(timer);
      finish = () => {};
      if (!container) dispose();
      resolve(r);
    };
  });

  const stop = (message: string) => {
    frame.remove();
    finish({
      output: [...lines, { level: "error", text: message }],
      error: { name: "TimeoutError", message },
      tests: tests?.map((t) => ({
        name: t.name,
        passed: false,
        error: "Your code didn't finish.",
      })),
      timedOut: true,
      durationMs: performance.now() - started,
    });
  };
  const timer = setTimeout(
    () =>
      stop(
        `Stopped after ${timeoutMs / 1000} seconds. Is there an infinite loop?`,
      ),
    timeoutMs,
  );

  const onMessage = (event: MessageEvent<FrameMessage>) => {
    if (event.source !== frame.contentWindow) return;
    const message = event.data;
    if (message?.token !== token) return;
    if (message.type === "line") {
      lines.push(message.line);
      onLine?.(message.line);
    } else if (message.type === "storage") {
      onStorage?.(message.data);
    } else if (message.type === "fetch") {
      frame.contentWindow?.postMessage(
        {
          type: "panda-fetch",
          token,
          id: message.id,
          response: api.handle(message.request),
        },
        "*",
      );
    } else if (message.type === "done") {
      const { error, tests: results } = message.result;
      finish({
        output: [...lines],
        error: error ?? undefined,
        tests: tests?.length
          ? tests.map((t, i) => ({
              name: t.name,
              passed: results[i]?.passed ?? false,
              error: results[i]?.error,
            }))
          : undefined,
        timedOut: false,
        durationMs: performance.now() - started,
      });
    }
  };

  function dispose() {
    window.removeEventListener("message", onMessage);
    frame.remove();
  }

  window.addEventListener("message", onMessage);
  // React is inlined into the page: a sandboxed page may not load scripts
  // from some origins (e.g. localhost), but inline scripts always run.
  const head = react ? loadReactScript() : Promise.resolve("");
  head.then(
    (script) => {
      frame.srcdoc = previewDocument(html, script);
    },
    () => stop("React couldn't load. Check your connection and try again."),
  );
  frame.addEventListener("load", () =>
    frame.contentWindow?.postMessage(
      {
        type: "panda-run",
        token,
        code: prepareDomCode(code, { react }),
        checks: (tests ?? []).map((t) => t.check),
        storage: storage ?? {},
      },
      "*",
    ),
  );
  if (container) container.replaceChildren(frame);
  else document.body.appendChild(frame);

  return {
    result,
    cancel: () => stop("Stopped."),
    dispose: () => {
      finish = () => {};
      clearTimeout(timer);
      dispose();
    },
  };
}
