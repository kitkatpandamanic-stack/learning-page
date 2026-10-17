import { describe, expect, it } from "vitest";

import {
  appMessage,
  botLocale,
  dailyCaption,
  dailyKeyboard,
  displayName,
  escapeHtml,
  hintHtml,
  hintPopup,
  hintSpoiler,
  languageFromArg,
  leaderboardText,
  localHour,
  hoursUntilMidnight,
  hourKeyboard,
  parseButton,
  parseCommand,
  parseHintButton,
  pingCaption,
  quizAnswerText,
  reminderText,
  settingsKeyboard,
  settingsText,
  streakText,
} from "@/lib/telegram/texts";

describe("escapeHtml", () => {
  it("is safe in text and inside attribute quotes", () => {
    expect(escapeHtml(`<a href="x">Tom & "Jerry"</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &quot;Jerry&quot;&lt;/a&gt;",
    );
  });
});

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
    const r = {
      streak: 4,
      best: 9,
      hoursLeft: 4,
      url: "https://x.test/practice",
    };
    expect(reminderText("en", { ...r, freezes: 0 })).not.toContain("freeze");
    expect(reminderText("en", { ...r, freezes: 2 })).toContain("2 freezes");
  });

  it("says how long is left, and when today would be a record", () => {
    const r = { streak: 5, best: 5, freezes: 0, hoursLeft: 4, url: "u" };
    expect(reminderText("en", r)).toContain("less than 4 hours until midnight");
    expect(reminderText("en", r)).toContain("new record: 6 days");
    expect(reminderText("en", { ...r, best: 8 })).not.toContain("record");
    expect(reminderText("ru", { ...r, hoursLeft: 1 })).toContain(
      "до полуночи меньше часа",
    );
    expect(reminderText("ru", r)).toContain("новый рекорд: 6 дней");
  });

  it("counts the hours to midnight on the learner's clock", () => {
    const at = new Date("2026-10-12T15:30:00Z");
    expect(hoursUntilMidnight("UTC", at)).toBe(9);
    expect(hoursUntilMidnight("Asia/Tashkent", at)).toBe(4); // 20:30
    expect(hoursUntilMidnight("UTC", new Date("2026-10-12T23:59:00Z"))).toBe(1);
  });

  it("adds the bot's quizzes to /streak", () => {
    const base = {
      current: 2,
      longest: 2,
      activeToday: true,
      totalXp: 10,
      level: 1,
      todayXp: 10,
      dailyGoal: 50,
      freezes: 0,
    };
    expect(streakText("en", base)).toContain("/quiz: +5 XP");
    const quiz = { answered: 5, correct: 4, streak: 3 };
    expect(streakText("en", { ...base, quiz })).toContain(
      "4/5 right this week · quiz streak 3 days",
    );
    expect(streakText("ru", { ...base, quiz })).toContain(
      "4/5 верно за неделю · серия 3 дня",
    );
  });

  it("answers quiz answers in both languages", () => {
    const stats = { answered: 2, correct: 1, streak: 1 };
    expect(
      quizAnswerText("en", { correct: true, xp: 5, answer: "", stats }),
    ).toContain("+5 XP");
    expect(
      quizAnswerText("ru", { correct: true, xp: 0, answer: "", stats }),
    ).toContain("XP за квизы на сегодня уже получены");
    expect(
      quizAnswerText("ru", { correct: false, xp: 0, answer: "<i>", stats }),
    ).toContain("Ответ: <b>&lt;i&gt;</b>");
  });

  it("writes achievement and course captions", () => {
    expect(
      pingCaption("ru", {
        kind: "achievement",
        emoji: "🔥",
        title: "В ударе",
        description: "Занимайтесь 3 дня подряд",
      }),
    ).toContain("Новое достижение: В ударе");
    expect(pingCaption("en", { kind: "course", name: "Python" })).toContain(
      "You finished the Python course!",
    );
  });
});

describe("settings", () => {
  const s = {
    reminders: true,
    reminderHour: 8,
    pausedUntil: null,
    pings: true,
    leaderboard: false,
  };

  it("shows the reminder time, a pause and every option", () => {
    expect(settingsText("en", s)).toContain("<b>on</b>, at <b>08:00</b>");
    const paused = settingsText("ru", { ...s, pausedUntil: "2026-10-20" });
    expect(paused).toContain("в <b>08:00</b>");
    expect(paused).toContain("На паузе, снова с 20 октября");
    expect(settingsText("en", { ...s, reminders: false })).not.toContain(
      "08:00",
    );
  });

  it("offers time and pause buttons only while reminders are on", () => {
    const on = JSON.stringify(settingsKeyboard("en", s));
    expect(on).toContain("menu:hour");
    expect(on).toContain("menu:pause");
    expect(on).toContain("toggle:pings");
    const paused = JSON.stringify(
      settingsKeyboard("en", { ...s, pausedUntil: "2026-10-20" }),
    );
    expect(paused).toContain("pause:0");
    const off = JSON.stringify(
      settingsKeyboard("en", { ...s, reminders: false }),
    );
    expect(off).not.toContain("menu:hour");
    expect(JSON.stringify(hourKeyboard("en", 20))).toContain("✓ 20:00");
  });

  it("reads only the buttons it made", () => {
    expect(parseButton("hour:21")).toEqual({ kind: "hour", hour: 21 });
    expect(parseButton("hour:3")).toBeNull();
    expect(parseButton("pause:7")).toEqual({ kind: "pause", days: 7 });
    expect(parseButton("pause:0")).toEqual({ kind: "pause", days: 0 });
    expect(parseButton("pause:30")).toBeNull();
    expect(parseButton("toggle:pings")).toEqual({
      kind: "toggle",
      option: "pings",
    });
    expect(parseButton("toggle:admin")).toBeNull();
    expect(parseButton("menu:hour")).toEqual({ kind: "menu", menu: "hour" });
    expect(parseButton("quiz")).toEqual({ kind: "quiz" });
    expect(parseButton(undefined)).toBeNull();
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

describe("/app", () => {
  it("opens the Mini App in private chats and links to it in groups", () => {
    const where = {
      appUrl: "https://x.test/tg",
      link: "https://t.me/b?startapp",
    };
    const inPrivate = appMessage("en", { ...where, private: true });
    expect(inPrivate.reply_markup.inline_keyboard[0][0]).toMatchObject({
      web_app: { url: "https://x.test/tg" },
    });
    const inGroup = appMessage("ru", { ...where, private: false });
    expect(inGroup.reply_markup.inline_keyboard[0][0]).toMatchObject({
      url: "https://t.me/b?startapp",
    });
    expect(inGroup.text).toContain("блиц дня");
  });
});
