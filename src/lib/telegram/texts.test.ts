import { describe, expect, it } from "vitest";

import {
  botLocale,
  dailyCaption,
  dailyKeyboard,
  displayName,
  hintHtml,
  hintPopup,
  hintSpoiler,
  languageFromArg,
  leaderboardText,
  localHour,
  parseCommand,
  parseHintButton,
  reminderText,
  streakText,
} from "@/lib/telegram/texts";

describe("reading messages", () => {
  it("parses commands, also with the bot's name and an argument", () => {
    expect(parseCommand("/today")).toEqual({ command: "today", arg: "" });
    expect(parseCommand("/random@panda_learning_bot  js ")).toEqual({
      command: "random",
      arg: "js",
    });
    expect(parseCommand("/start abc_123-x")).toEqual({
      command: "start",
      arg: "abc_123-x",
    });
    expect(parseCommand("hello")).toBeNull();
  });

  it("understands language names and short forms", () => {
    expect(languageFromArg("py")).toBe("python");
    expect(languageFromArg("JS please")).toBe("javascript");
    expect(languageFromArg("питон")).toBe("python");
    expect(languageFromArg("cobol")).toBeUndefined();
    expect(languageFromArg("")).toBeUndefined();
  });

  it("answers in Russian to Russian Telegram apps, English otherwise", () => {
    expect(botLocale("ru")).toBe("ru");
    expect(botLocale("ru-RU")).toBe("ru");
    expect(botLocale("uz")).toBe("en");
    expect(botLocale(undefined)).toBe("en");
  });
});

describe("writing messages", () => {
  it("shortens names for the leaderboard", () => {
    expect(displayName("Anora Yusupova")).toBe("Anora Y.");
    expect(displayName("Mei")).toBe("Mei");
    expect(displayName("  ")).toBe("Panda");
  });

  it("knows the hour on the learner's clock", () => {
    const at = new Date("2026-10-10T15:30:00Z");
    expect(localHour("UTC", at)).toBe(15);
    expect(localHour("Asia/Tashkent", at)).toBe(20);
    expect(localHour("America/New_York", at)).toBe(11);
  });

  it("uses Russian plural forms", () => {
    const base = {
      longest: 5,
      activeToday: true,
      totalXp: 120,
      level: 2,
      todayXp: 10,
      dailyGoal: 50,
      freezes: 1,
    };
    expect(streakText("ru", { ...base, current: 1 })).toContain("1 день");
    expect(streakText("ru", { ...base, current: 3 })).toContain("3 дня");
    expect(streakText("ru", { ...base, current: 12 })).toContain("12 дней");
    expect(streakText("en", { ...base, current: 1 })).toContain("1 day");
  });

  it("escapes names in the leaderboard", () => {
    const text = leaderboardText(
      [
        { name: "<b>Hacker</b>", xp: 90 },
        { name: "Mei", xp: 40 },
      ],
      { from: "2026-10-05", to: "2026-10-11", siteUrl: "https://x.test" },
    );
    expect(text).toContain("&lt;b&gt;Hacker&lt;/b&gt;");
    expect(text).toContain("🥇");
    expect(text).toContain("🥈 Mei");
    expect(text).toContain("5 октября – 11 октября");
    expect(text).toContain("October 5 – October 11");
  });

  it("mentions freezes in reminders only when there are some", () => {
    const url = "https://x.test/practice";
    expect(reminderText("en", { streak: 4, freezes: 0, url })).not.toContain(
      "freeze",
    );
    expect(reminderText("en", { streak: 4, freezes: 2, url })).toContain(
      "2 freezes",
    );
  });
});

describe("the daily post", () => {
  const long = "A problem title that is about as long as titles get here!!";
  const problems = ["sql", "python", "typescript", "javascript"].map(
    (language) => ({
      language,
      name: language,
      difficulty: "medium",
      en: { title: long, url: `https://pandadev.test/practice/${language}/x` },
      ru: {
        title: long,
        url: `https://pandadev.test/ru/practice/${language}/x`,
      },
    }),
  );
  const visible = (html: string) => html.replace(/<[^>]+>/g, "");

  it("fits Telegram's 1024-character caption, Python first", () => {
    const caption = dailyCaption("both", "2026-10-12", problems, true);
    expect(visible(caption).length).toBeLessThanOrEqual(1024);
    expect(caption.indexOf("python")).toBeLessThan(caption.indexOf("sql"));
    expect(caption).toContain("12 октября");
    expect(caption).toContain("#problemoftheday");
    const en = dailyCaption("en", "2026-10-12", problems, false);
    expect(en).not.toMatch(/[а-я]/i);
  });

  it("has solve links, a hint button per language and the streak link", () => {
    const { inline_keyboard: rows } = dailyKeyboard(
      "both",
      "2026-10-12",
      problems,
      {
        siteUrl: "https://pandadev.test",
        bot: "panda_bot",
      },
    ) as {
      inline_keyboard: {
        text: string;
        url?: string;
        callback_data?: string;
      }[][];
    };
    expect(rows[0].map((b) => b.url)).toEqual([
      "https://pandadev.test/ru/practice",
      "https://pandadev.test/practice",
    ]);
    expect(rows[1].map((b) => b.callback_data)).toEqual([
      "hint:python:2026-10-12",
      "hint:javascript:2026-10-12",
      "hint:typescript:2026-10-12",
      "hint:sql:2026-10-12",
    ]);
    expect(rows[2][0].url).toBe("https://t.me/panda_bot?start=streak");
    expect(parseHintButton("hint:sql:2026-10-12")).toEqual({
      language: "sql",
      date: "2026-10-12",
    });
    expect(parseHintButton("toggle:reminders")).toBeNull();
  });

  it("formats hints for messages and pop-ups", () => {
    expect(hintHtml("Use `a < b` and **think**")).toBe(
      "Use <code>a &lt; b</code> and <b>think</b>",
    );
    expect(hintPopup("Use `len()`. Then **loop**.")).toBe(
      "Use len(). Then loop.",
    );
    const long = `${"First sentence is here. ".repeat(10)}And then more words follow`;
    const popup = hintPopup(long);
    expect(popup.length).toBeLessThanOrEqual(200);
    expect(popup.endsWith(".")).toBe(true);
    expect(hintSpoiler("ru", "x")).toBe(
      "💡 Подсказка: <tg-spoiler>x</tg-spoiler>",
    );
  });
});
