"use client";

import * as React from "react";
import { cn } from "cn";

import { LazyCodeRunner } from "@/components/code/lazy-code-runner";
import type { RunLanguage } from "@/lib/runner/execute";

const starters: Record<RunLanguage, string> = {
  javascript: `// Welcome to the PandaDev playground! 🐼
// Write some JavaScript and press Run (or Ctrl/⌘ + Enter).

const languages = ["JavaScript", "Python", "TypeScript"];

for (const language of languages) {
  console.log(\`I'm learning \${language}!\`);
}
`,
  python: `# Python playground: real Python 3, running in your browser. 🐍

languages = ["JavaScript", "Python", "TypeScript"]

for language in languages:
    print(f"I'm learning {language}!")
`,
  typescript: `// TypeScript playground: type annotations are removed, then the code runs.
// (Type errors are not reported yet.)

type Learner = { name: string; level: number };

const panda: Learner = { name: "Panda", level: 0 };

function levelUp(learner: Learner): Learner {
  return { ...learner, level: learner.level + 1 };
}

console.log(levelUp(panda));
`,
};

export function Playground() {
  const [language, setLanguage] = React.useState<RunLanguage>("javascript");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Language"
        className="inline-flex self-start rounded-full p-1 glass"
      >
        {(["javascript", "python", "typescript"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            aria-pressed={language === lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium text-white/70 transition hover:text-white",
              language === lang &&
                "bg-gradient-brand text-white shadow-glow-violet",
            )}
          >
            {
              {
                javascript: "JavaScript",
                python: "Python",
                typescript: "TypeScript",
              }[lang]
            }
          </button>
        ))}
      </div>
      {/* Remount per language so each keeps its own saved code */}
      <LazyCodeRunner
        key={language}
        starter={starters[language]}
        language={language}
        storageId={`playground-${language}`}
        minHeight="360px"
      />
      <p className="text-sm text-white/45">
        Your code is saved in this browser. Python runs on Pyodide and loads the
        first time you run it.
      </p>
    </div>
  );
}
