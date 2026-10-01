/**
 * Guards lesson content: every Code + Output example must print what the
 * lesson claims, and every interactive exercise must be solvable by its own
 * solution but not already solved by its starter code.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";

import {
  compareOutput,
  execute,
  type RunLanguage,
  type TestSpec,
} from "@/lib/runner/execute";
import { executePython } from "@/lib/runner/execute-python";
import { typeErrorResult } from "@/lib/runner/typecheck";

import { runDomInNode } from "./node-dom";
import { checkTypes } from "./node-typecheck";

/** The first lesson that imports pandas or FastAPI downloads it (cached after). */
const PACKAGE_TIMEOUT_MS = 120_000;

let pyodide: PyodideInterface;
beforeAll(async () => {
  pyodide = await loadPyodide();
}, 60_000);

/**
 * Runs lesson code the same way the browser does, in the right language.
 * TypeScript with type errors doesn't run, just like in the browser.
 */
async function run(code: string, language: RunLanguage, tests?: TestSpec[]) {
  if (language === "python") return executePython(pyodide, code, { tests });
  if (language === "typescript") {
    const diagnostics = checkTypes(code);
    if (diagnostics.length) return typeErrorResult(diagnostics, tests);
  }
  return execute(code, { language, tests });
}

const ROOT = join(__dirname, "..", "content", "courses");

function lessonFiles(dir = ROOT): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return lessonFiles(path);
    return entry.name.endsWith(".mdx") ? [path] : [];
  });
}

/** Reads `name="..."` and `name={expression}` attributes of a JSX opening tag. */
function parseAttributes(tag: string): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  let i = 0;
  while (i < tag.length) {
    const name = /^\s*([A-Za-z]+)=/.exec(tag.slice(i));
    if (!name) {
      i++;
      continue;
    }
    i += name[0].length;
    if (tag[i] === '"') {
      const end = tag.indexOf('"', i + 1);
      attrs[name[1]] = tag.slice(i + 1, end);
      i = end + 1;
    } else if (tag[i] === "{") {
      // Find the matching brace, skipping strings and template literals.
      let depth = 0;
      let j = i;
      let quote: string | null = null;
      for (; j < tag.length; j++) {
        const ch = tag[j];
        if (quote) {
          if (ch === "\\") j++;
          else if (ch === quote) quote = null;
        } else if (ch === '"' || ch === "'" || ch === "`") quote = ch;
        else if (ch === "{") depth++;
        else if (ch === "}" && --depth === 0) break;
      }
      attrs[name[1]] = new Function(`return (${tag.slice(i + 1, j)});`)();
      i = j + 1;
    }
  }
  return attrs;
}

type Exercise = {
  file: string;
  title: string;
  starter: string;
  language: RunLanguage;
  tests?: TestSpec[];
  expectedOutput?: string;
  /** DOM exercises: the page the code runs against */
  html?: string;
  solution?: string;
};

function exercisesIn(file: string): Exercise[] {
  const source = readFileSync(file, "utf8");
  const blocks = source.split(/^<Exercise\b/m).slice(1);
  return blocks.flatMap((block) => {
    const tagEnd = block.search(/^>$/m);
    const tag =
      tagEnd === -1
        ? block.slice(0, block.indexOf(">"))
        : block.slice(0, tagEnd);
    const attrs = parseAttributes(tag);
    if (typeof attrs.starter !== "string") return [];
    const body = block.slice(0, block.indexOf("</Exercise>"));
    const solution =
      /<Solution>\s*```(?:js|ts|python)[^\n]*\n([\s\S]*?)```/.exec(body)?.[1];
    return [
      {
        file: file.slice(ROOT.length + 1),
        title: (attrs.title as string) ?? "Your turn",
        starter: attrs.starter,
        language: (attrs.language as RunLanguage) ?? "javascript",
        tests: attrs.tests as TestSpec[] | undefined,
        expectedOutput: attrs.expectedOutput as string | undefined,
        html: attrs.html as string | undefined,
        solution,
      },
    ];
  });
}

async function solves(code: string, ex: Exercise) {
  const result =
    ex.html !== undefined
      ? await runDomInNode(code, ex.html, ex.tests)
      : await run(code, ex.language, ex.tests);
  const output =
    ex.expectedOutput !== undefined
      ? compareOutput(result.output, ex.expectedOutput)
      : { passed: true };
  return {
    solved:
      !result.error &&
      (result.tests ?? []).every((t) => t.passed) &&
      output.passed,
    result,
    output,
  };
}

const files = lessonFiles();
const exercises = files.flatMap(exercisesIn);

describe("interactive exercises", () => {
  it("found exercises to check", () => {
    expect(exercises.length).toBeGreaterThan(0);
  });

  it.each(exercises.map((ex) => [`${ex.file} › ${ex.title}`, ex] as const))(
    "%s",
    async (_name, ex) => {
      expect(
        ex.solution,
        "exercise needs a <Solution> code block",
      ).toBeTruthy();
      expect(
        ex.tests?.length || ex.expectedOutput !== undefined,
        "exercise needs tests or expectedOutput",
      ).toBeTruthy();

      const fromSolution = await solves(ex.solution!, ex);
      expect(fromSolution.solved, JSON.stringify(fromSolution, null, 2)).toBe(
        true,
      );

      const fromStarter = await solves(ex.starter, ex);
      expect(
        fromStarter.solved,
        "the starter code should not already pass",
      ).toBe(false);
    },
    PACKAGE_TIMEOUT_MS,
  );
});

/** pytest says how long tests took ("3 passed in 0.02s"), which varies. */
const steadyTimes = (text: string) =>
  text.replace(/ in \d+\.\d+s\b/g, " in 0.01s");

describe("Code + Output examples", () => {
  const examples = files.flatMap((file) => {
    const source = readFileSync(file, "utf8");
    const pattern =
      /<CodeExample output=(?:"([^"]*)"|\{`([\s\S]*?)`\})>\s*```(js|ts|python)[^\n]*\n([\s\S]*?)```\s*<\/CodeExample>/g;
    return [...source.matchAll(pattern)].map((m, i) => ({
      name: `${file.slice(ROOT.length + 1)} #${i + 1}`,
      // Evaluate `…` the way the page does, so escapes like \n match.
      expected: (
        m[1] ?? (new Function(`return \`${m[2]}\`;`)() as string)
      ).trim(),
      language: ({ js: "javascript", ts: "typescript", python: "python" }[
        m[3]
      ] ?? "javascript") as RunLanguage,
      code: m[4],
    }));
  });

  it.each(examples.map((ex) => [ex.name, ex] as const))(
    "%s",
    async (_name, ex) => {
      const result = await run(ex.code, ex.language);
      const got = result.output
        .filter((l) => !l.image)
        .map((l) => l.text)
        .join("\n")
        .trim();
      expect(steadyTimes(got)).toBe(steadyTimes(ex.expected));
    },
    PACKAGE_TIMEOUT_MS,
  );
});

describe("TryIt live previews", () => {
  const blocks = files.flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return source
      .split(/^<TryIt\b/m)
      .slice(1)
      .map((block, i) => {
        const attrs = parseAttributes(block.slice(0, block.search(/^\/>$/m)));
        return {
          name: `${file.slice(ROOT.length + 1)} #${i + 1}`,
          html: attrs.html as string,
          code: attrs.code as string,
        };
      });
  });

  it.each(blocks.map((b) => [b.name, b] as const))(
    "%s runs without errors",
    async (_name, b) => {
      expect(typeof b.html, "TryIt needs html").toBe("string");
      expect(typeof b.code, "TryIt needs code").toBe("string");
      const result = await runDomInNode(b.code, b.html);
      expect(result.error, JSON.stringify(result.output)).toBeUndefined();
    },
  );
});

describe("links between lessons", () => {
  const slugs = new Set(
    files.map((file) => {
      const [language, , name] = file.slice(ROOT.length + 1).split("/");
      return `/learn/${language}/${name.replace(/^\d+-/, "").replace(/\.mdx$/, "")}`;
    }),
  );
  const links = files.flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/\]\((\/learn\/[^)#\s]+)/g)].map(
      (m) => [file.slice(ROOT.length + 1), m[1]] as const,
    ),
  );

  it.each(links)("%s links to %s", (_file, href) => {
    expect(slugs.has(href), `${href} is not a lesson`).toBe(true);
  });
});
