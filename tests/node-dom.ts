import { JSDOM, VirtualConsole } from "jsdom";

import {
  prepareDomCode,
  previewDocument,
  type DomRunResult,
} from "@/lib/runner/dom-harness";
import type { ExecuteResult, OutputLine, TestSpec } from "@/lib/runner/execute";

/** Opens the preview page in jsdom, like the browser's sandboxed iframe. */
export function openPreview(html: string) {
  return new JSDOM(previewDocument(html), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    // Errors are reported through the harness; keep jsdom's own copies quiet.
    virtualConsole: new VirtualConsole(),
  });
}

/** Runs a DOM exercise the way the browser preview does. */
export async function runDomInNode(
  code: string,
  html: string,
  tests: TestSpec[] = [],
  /** localStorage before the run; updated in place as the page saves */
  storage?: Record<string, string>,
): Promise<ExecuteResult> {
  const dom = openPreview(html);
  const window = dom.window as unknown as {
    __pandaRun(
      code: string,
      checks: string[],
      emit: (level: OutputLine["level"], text: string) => void,
      storage?: Record<string, string>,
      onStorage?: (data: Record<string, string>) => void,
    ): Promise<DomRunResult>;
  };
  const output: OutputLine[] = [];
  const result = await window.__pandaRun(
    prepareDomCode(code),
    tests.map((t) => t.check),
    (level, text) => output.push({ level, text }),
    storage,
    (data) => {
      if (!storage) return;
      for (const key of Object.keys(storage)) delete storage[key];
      Object.assign(storage, data);
    },
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
