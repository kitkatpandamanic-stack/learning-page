/**
 * The Mini App's Code tab: a sandbox with the site's code runners. The code
 * runs on the learner's device (Web Workers, Pyodide, PGlite), never on the
 * server. No server imports.
 */

/** The sandbox's languages, in the order of its buttons. */
export const sandboxLanguages = [
  "python",
  "javascript",
  "sql",
  "typescript",
] as const;

export type SandboxLanguage = (typeof sandboxLanguages)[number];

const isSandboxLanguage = (value: string): value is SandboxLanguage =>
  (sandboxLanguages as readonly string[]).includes(value);

/**
 * t.me/<bot>?startapp=sandbox opens the Code tab, sandbox_python opens it on
 * Python. Returns undefined when the link isn't for the sandbox, and a null
 * language when it names none (or one the sandbox doesn't have).
 */
export function sandboxStart(
  param: string,
): { language: SandboxLanguage | null } | undefined {
  const match = /^sandbox(?:_([a-z]+))?$/.exec(param);
  if (!match) return undefined;
  const language = match[1] ?? "";
  return { language: isSandboxLanguage(language) ? language : null };
}

/**
 * The keys above the phone keyboard: the ones that are hard to reach on it.
 * "tab" inserts the language's indent.
 */
export function sandboxKeys(language: SandboxLanguage) {
  const common = ["tab", "(", ")", '"', "'", "=", ":", ",", "."];
  if (language === "python") return [...common, "[", "]", "{", "}", "#"];
  if (language === "sql") return [...common, ";", "*", "<", ">", "%"];
  return [...common, "{", "}", "[", "]", ";", "=>", "`"];
}

/** t.me/<bot>?startapp=run_<id>: the code a ▶ Run button opens. */
export function snippetStart(param: string) {
  return /^run_([\w-]{6,16})$/.exec(param)?.[1];
}
