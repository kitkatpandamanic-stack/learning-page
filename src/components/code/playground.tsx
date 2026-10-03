"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "cn";

import { LazyCodeRunner } from "@/components/code/lazy-code-runner";
import type { RunLanguage } from "@/lib/runner/execute";

/** Starter programs; comments and printed text follow the page language. */
function starters(locale: string): Record<RunLanguage, string> {
  const ru = locale === "ru";
  return {
    javascript: ru
      ? `// Добро пожаловать в песочницу PandaDev! 🐼
// Напишите код на JavaScript и нажмите «Запустить» (или Ctrl/⌘ + Enter).

const languages = ["JavaScript", "Python", "TypeScript"];

for (const language of languages) {
  console.log(\`Я изучаю \${language}!\`);
}
`
      : `// Welcome to the PandaDev playground! 🐼
// Write some JavaScript and press Run (or Ctrl/⌘ + Enter).

const languages = ["JavaScript", "Python", "TypeScript"];

for (const language of languages) {
  console.log(\`I'm learning \${language}!\`);
}
`,
    python: ru
      ? `# Песочница Python: настоящий Python 3 прямо в браузере. 🐍

languages = ["JavaScript", "Python", "TypeScript"]

for language in languages:
    print(f"Я изучаю {language}!")
`
      : `# Python playground: real Python 3, running in your browser. 🐍

languages = ["JavaScript", "Python", "TypeScript"]

for language in languages:
    print(f"I'm learning {language}!")
`,
    typescript: ru
      ? `// Песочница TypeScript: сначала код проверяется на ошибки типов, потом запускается.
// Замените level на "zero" и нажмите «Запустить», чтобы увидеть ошибку типов.

type Learner = { name: string; level: number };

const panda: Learner = { name: "Панда", level: 0 };

function levelUp(learner: Learner): Learner {
  return { ...learner, level: learner.level + 1 };
}

console.log(levelUp(panda));
`
      : `// TypeScript playground: your code is type-checked, then it runs.
// Try changing level to "zero" and press Run to see a type error.

type Learner = { name: string; level: number };

const panda: Learner = { name: "Panda", level: 0 };

function levelUp(learner: Learner): Learner {
  return { ...learner, level: learner.level + 1 };
}

console.log(levelUp(panda));
`,
    react: ru
      ? `// Песочница React: компонент сразу появляется в окне предпросмотра ниже.
import { useState } from "react";
import { createRoot } from "react-dom/client";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      🐼 Нажато {count} раз
    </button>
  );
}

createRoot(document.getElementById("root")).render(<Counter />);
`
      : `// React playground: your component appears in the preview below.
import { useState } from "react";
import { createRoot } from "react-dom/client";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      🐼 Clicked {count} times
    </button>
  );
}

createRoot(document.getElementById("root")).render(<Counter />);
`,
    tsx: ru
      ? `// React + TypeScript: пропсы и состояние с типами, а компонент — в окне ниже.
import { useState } from "react";
import { createRoot } from "react-dom/client";

type CounterProps = { label: string; step?: number };

function Counter({ label, step = 1 }: CounterProps) {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + step)}>
      🐼 {label}: {count}
    </button>
  );
}

// Попробуйте step="2" — TypeScript заметит ошибку до запуска.
createRoot(document.getElementById("root")!).render(
  <Counter label="Нажато" step={2} />,
);
`
      : `// React + TypeScript: typed props and state; the component appears below.
import { useState } from "react";
import { createRoot } from "react-dom/client";

type CounterProps = { label: string; step?: number };

function Counter({ label, step = 1 }: CounterProps) {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + step)}>
      🐼 {label}: {count}
    </button>
  );
}

// Try step="2": TypeScript catches the mistake before anything runs.
createRoot(document.getElementById("root")!).render(
  <Counter label="Clicks" step={2} />,
);
`,
  };
}

export function Playground() {
  const [language, setLanguage] = React.useState<RunLanguage>("javascript");
  const locale = useLocale();
  const t = useTranslations("playground");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label={t("language")}
        className="inline-flex max-w-full self-start overflow-x-auto rounded-full p-1 glass"
      >
        {(["javascript", "python", "typescript", "react", "tsx"] as const).map(
          (lang) => (
            <button
              key={lang}
              type="button"
              aria-pressed={language === lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-white/70 transition hover:text-white",
                language === lang &&
                  "bg-gradient-brand text-white shadow-glow-violet",
              )}
            >
              {
                {
                  javascript: "JavaScript",
                  python: "Python",
                  typescript: "TypeScript",
                  react: "React",
                  tsx: "React + TS",
                }[lang]
              }
            </button>
          ),
        )}
      </div>
      {/* Remount per language so each keeps its own saved code */}
      <LazyCodeRunner
        key={language}
        starter={starters(locale)[language]}
        language={language}
        storageId={`playground-${language}`}
        minHeight="360px"
      />
      <p className="text-sm text-white/45">{t("note")}</p>
    </div>
  );
}
