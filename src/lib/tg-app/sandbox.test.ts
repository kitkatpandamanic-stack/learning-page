import { describe, expect, it } from "vitest";

import {
  sandboxKeys,
  sandboxLanguages,
  sandboxStart,
} from "@/lib/tg-app/sandbox";
import { appTexts, languageNames } from "@/lib/tg-app/texts";

describe("the Code tab", () => {
  it("opens from t.me/<bot>?startapp=sandbox, on a language when it names one", () => {
    expect(sandboxStart("sandbox")).toEqual({ language: null });
    expect(sandboxStart("sandbox_sql")).toEqual({ language: "sql" });
    expect(sandboxStart("sandbox_python")).toEqual({ language: "python" });
    // A language it doesn't have still opens the tab.
    expect(sandboxStart("sandbox_react")).toEqual({ language: null });
    expect(sandboxStart("sandbox_")).toBeUndefined();
    expect(sandboxStart("blitz_python")).toBeUndefined();
    expect(sandboxStart("sandboxes")).toBeUndefined();
    expect(sandboxStart("")).toBeUndefined();
  });

  it("has keys for every language, without repeats", () => {
    for (const language of sandboxLanguages) {
      const keys = sandboxKeys(language);
      expect(keys).toContain("tab");
      expect(new Set(keys).size).toBe(keys.length);
      // "undo" is the editor's own first key.
      expect(keys).not.toContain("undo");
    }
    expect(sandboxKeys("python")).toContain("#");
    expect(sandboxKeys("sql")).toContain(";");
    expect(sandboxKeys("javascript")).toContain("=>");
  });

  it("names every language and says it in both app languages", () => {
    for (const language of sandboxLanguages)
      expect(languageNames[language]).toBeTruthy();
    for (const t of [appTexts.en, appTexts.ru]) {
      expect(t.tabs.code).toBeTruthy();
      expect(t.codeFirstRun("Python")).toContain("Python");
    }
  });
});
