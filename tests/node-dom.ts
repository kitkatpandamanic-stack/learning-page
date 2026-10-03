import { readFileSync } from "node:fs";

import { JSDOM, VirtualConsole } from "jsdom";

import {
  prepareDomCode,
  previewDocument,
  type DomRunResult,
} from "@/lib/runner/dom-harness";
import type { ExecuteResult, OutputLine, TestSpec } from "@/lib/runner/execute";
import {
  createFakeApi,
  type FakeRequest,
  type FakeResponse,
} from "@/lib/runner/fake-api";

import { buildReactVendor } from "../scripts/build-vendor.mjs";

let reactSource: string | undefined;
/** React for the page, inlined (jsdom doesn't load script files). */
function reactScript() {
  reactSource ??= readFileSync(buildReactVendor(), "utf8");
  return `<script>${reactSource.replaceAll("</script", "<\\/script")}</script>`;
}

/** Opens the preview page in jsdom, like the browser's sandboxed iframe. */
export function openPreview(html: string, options: { react?: boolean } = {}) {
  return new JSDOM(previewDocument(html, options.react ? reactScript() : ""), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    // Errors are reported through the harness; keep jsdom's own copies quiet.
    virtualConsole: new VirtualConsole(),
    // jsdom has no fetch API; lend it Node's, as browsers have their own.
    beforeParse(window) {
      Object.assign(window, { Request, Response, Headers });
    },
  });
}

/** Runs a DOM exercise the way the browser preview does. */
export async function runDomInNode(
  code: string,
  html: string,
  tests: TestSpec[] = [],
  /** localStorage before the run; updated in place as the page saves */
  storage?: Record<string, string>,
  options: { react?: boolean } = {},
): Promise<ExecuteResult> {
  const dom = openPreview(html, options);
  const api = createFakeApi();
  const window = dom.window as unknown as {
    __pandaRun(
      code: string,
      checks: string[],
      emit: (level: OutputLine["level"], text: string) => void,
      storage?: Record<string, string>,
      onStorage?: (data: Record<string, string>) => void,
      fetchBridge?: (request: FakeRequest) => Promise<FakeResponse>,
    ): Promise<DomRunResult>;
  };
  const output: OutputLine[] = [];
  const result = await window.__pandaRun(
    prepareDomCode(code, options),
    tests.map((t) => t.check),
    (level, text) => output.push({ level, text }),
    storage,
    (data) => {
      if (!storage) return;
      for (const key of Object.keys(storage)) delete storage[key];
      Object.assign(storage, data);
    },
    async (request) => api.handle(request),
  );
  dom.window.close();
  return {
    output,
    error: result.error ?? undefined,
    tests: tests.length
      ? tests.map((t, i) => ({ name: t.name, ...result.tests[i] }))
      : undefined,
  };
}
