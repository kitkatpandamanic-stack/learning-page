import { describe, expect, it } from "vitest";

import {
  botLocale,
  displayName,
  languageFromArg,
  leaderboardText,
  localHour,
  parseCommand,
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
