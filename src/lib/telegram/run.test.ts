import { describe, expect, it } from "vitest";

import {
  codePreview,
  parseRunButton,
  parseRunCode,
  runMessage,
  runPickMessage,
  runShareText,
} from "@/lib/telegram/run";
import { snippetStart } from "@/lib/tg-app/sandbox";

/** A message whose code block Telegram turned into a "pre" entity. */
function withBlock(before: string, code: string, language?: string) {
  const text = `${before}${code}`;
  return {
    text,
    entities: [
      { type: "bot_command", offset: 0, length: 4 },
      { type: "pre", offset: before.length, length: code.length, language },
    ],
  };
}

describe("/run finds the code", () => {
  it("in a code block, with the block's language", () => {
    const m = withBlock("/run\n", 'print("hi")', "python");
    expect(parseRunCode(m.text, m.entities)).toEqual({
      code: 'print("hi")',
      language: "python",
    });
  });

  it("in a block without a language, from the word after /run", () => {
    const m = withBlock("/run js\n", "console.log(1)");
    expect(parseRunCode(m.text, m.entities)).toEqual({
      code: "console.log(1)",
      language: "javascript",
    });
  });

  it("counts offsets like Telegram (UTF-16), past emoji", () => {
    const m = withBlock("/run 🐼\n", "SELECT 1;", "sql");
    expect(parseRunCode(m.text, m.entities).code).toBe("SELECT 1;");
  });

  it("in ``` fences left as text", () => {
    expect(parseRunCode("/run ```py\nx = 1\nprint(x)\n```")).toEqual({
      code: "x = 1\nprint(x)",
      language: "python",
    });
    expect(parseRunCode("/run ts ```\nlet a: number = 1\n```")).toEqual({
      code: "let a: number = 1",
      language: "typescript",
    });
  });

  it("after a language word, keeping the code's indent", () => {
    expect(
      parseRunCode(
        "/run@panda_learning_bot python\nfor i in range(2):\n    print(i)",
      ),
    ).toEqual({
      code: "for i in range(2):\n    print(i)",
      language: "python",
    });
  });

  it("without a language when nothing says it", () => {
    expect(parseRunCode("/run print(1)")).toEqual({
      code: "print(1)",
      language: null,
    });
  });

  it("finds nothing after a bare /run (or /run with only a language)", () => {
    expect(parseRunCode("/run")).toEqual({ code: "", language: null });
    expect(parseRunCode("/run sql")).toEqual({ code: "", language: "sql" });
  });

  it("reads a whole message that isn't a command", () => {
    const block = { type: "pre", offset: 0, length: 8, language: "python" };
    expect(parseRunCode("print(2)", [block], false)).toEqual({
      code: "print(2)",
      language: "python",
    });
    expect(parseRunCode("SELECT 2;", [], false).code).toBe("SELECT 2;");
  });
});

describe("/run's messages", () => {
  it("shows the first lines, escaped, with a ▶ Run link", () => {
    const code = Array.from({ length: 20 }, (_, i) => `print(${i} < 5)`).join(
      "\n",
    );
    const m = runMessage("en", {
      language: "python",
      author: "<Anna>",
      code,
      link: "https://t.me/b?startapp=run_abcdefgh",
    });
    expect(m.text).toContain("code from &lt;Anna&gt;");
    expect(m.text).toContain('<code class="language-python">');
    expect(m.text).toContain("print(14 &lt; 5)");
    expect(m.text).not.toContain("print(15");
    expect(m.text).toContain("\n…");
    expect(m.reply_markup.inline_keyboard[0][0]).toEqual({
      text: "▶ Run",
      url: "https://t.me/b?startapp=run_abcdefgh",
    });
    expect(
      runMessage("ru", { language: "sql", author: "A", code: "x", link: "l" })
        .reply_markup.inline_keyboard[0][0].text,
    ).toBe("▶ Запустить");
  });

  it("asks for the language with buttons it can read back", () => {
    const m = runPickMessage("en", "abc_DEF-12");
    const buttons = m.reply_markup.inline_keyboard[0];
    expect(buttons.map((b) => b.text)).toEqual([
      "Python",
      "JavaScript",
      "SQL",
      "TypeScript",
    ]);
    for (const b of buttons)
      expect(b.callback_data.length).toBeLessThanOrEqual(64);
    expect(parseRunButton(buttons[2].callback_data)).toEqual({
      id: "abc_DEF-12",
      language: "sql",
    });
    expect(parseRunButton("run:abc_DEF-12:cobol")).toBeNull();
    expect(parseRunButton("run:x:sql")).toBeNull();
    expect(parseRunButton("quiz")).toBeNull();
  });

  it("shares a run with its output, cut short", () => {
    const text = runShareText("en", {
      language: "javascript",
      author: "Bao",
      code: "console.log('<b>')",
      output: Array.from({ length: 30 }, (_, i) => `line ${i}`),
    });
    expect(text).toContain("console.log('&lt;b&gt;')");
    expect(text).toContain("Output:");
    expect(text).toContain("line 11");
    expect(text).not.toContain("line 12");
    expect(
      runShareText("ru", {
        language: "sql",
        author: "Bao",
        code: "SELECT 1;",
        output: [],
      }),
    ).not.toContain("Вывод");
  });

  it("cuts long previews by characters too", () => {
    const { preview, cut } = codePreview("x".repeat(5000));
    expect(preview).toHaveLength(1200);
    expect(cut).toBe(true);
    expect(codePreview("a\nb").cut).toBe(false);
  });

  it("opens from t.me/<bot>?startapp=run_<id>", () => {
    expect(snippetStart("run_abc_DEF-12")).toBe("abc_DEF-12");
    expect(snippetStart("run_x")).toBeUndefined();
    expect(snippetStart("sandbox")).toBeUndefined();
  });
});
