/**
 * What the Telegram bot says, in English and Russian. No server imports, so
 * the wording is easy to test.
 */

export type BotLocale = "en" | "ru";

/** Russian for Telegram users whose app is in Russian, English otherwise. */
export function botLocale(languageCode?: string): BotLocale {
  return languageCode?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const a = (url: string, text: string) =>
  `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>`;

/** "/today@panda_learning_bot python" → { command: "today", arg: "python" } */
export function parseCommand(text: string) {
  const match = /^\/([a-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i.exec(text.trim());
  if (!match) return null;
  return { command: match[1].toLowerCase(), arg: (match[2] ?? "").trim() };
}

const languageAliases: Record<string, string[]> = {
  python: ["python", "py", "питон"],
  javascript: ["javascript", "js", "джаваскрипт"],
  typescript: ["typescript", "ts"],
  sql: ["sql", "postgres", "postgresql"],
};

/** "py" → "python"; undefined when it isn't a language. */
export function languageFromArg(arg: string) {
  const word = arg.toLowerCase().split(/\s+/)[0];
  if (!word) return undefined;
  return Object.keys(languageAliases).find((slug) =>
    languageAliases[slug].includes(word),
  );
}

export const languageEmoji: Record<string, string> = {
  python: "🐍",
  javascript: "🟨",
  typescript: "🔷",
  sql: "🗄",
};

const difficulty = {
  en: { easy: "easy", medium: "medium", hard: "hard" },
  ru: { easy: "лёгкая", medium: "средняя", hard: "сложная" },
} as const;
type Difficulty = keyof (typeof difficulty)["en"];

/** "Anora Yusupova" → "Anora Y.": enough for a leaderboard, no full names. */
export function displayName(name: string) {
  const [first = "", second] = name.trim().split(/\s+/);
  const short = first.slice(0, 20);
  return second ? `${short} ${second[0].toUpperCase()}.` : short || "Panda";
}

/** The hour (0–23) on the learner's clock. */
export function localHour(timeZone: string, now = new Date()) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

export function dayIn(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

/** Plural form for Russian: 1 день, 2 дня, 5 дней. */
function ruPlural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
const days = (n: number, locale: BotLocale) =>
  locale === "ru"
    ? `${n} ${ruPlural(n, "день", "дня", "дней")}`
    : `${n} ${n === 1 ? "day" : "days"}`;

// ---------------------------------------------------------------------------
// Replies
// ---------------------------------------------------------------------------

const commands = {
  en: [
    "/today: the problem of the day",
    "/quiz: a quiz question from the lessons",
    "/random python: a random practice problem (python, js, ts or sql)",
    "/streak: your streak and XP",
    "/next: where you left off",
    "/settings: reminders and the weekly leaderboard",
  ],
  ru: [
    "/today: задача дня",
    "/quiz: вопрос из уроков",
    "/random python: случайная задача (python, js, ts или sql)",
    "/streak: ваша серия и XP",
    "/next: где вы остановились",
    "/settings: напоминания и рейтинг недели",
  ],
};

export function helpText(
  locale: BotLocale,
  { linked, siteUrl, bot }: { linked: boolean; siteUrl: string; bot: string },
) {
  const profile = `${siteUrl}${locale === "ru" ? "/ru" : ""}/profile`;
  const intro =
    locale === "ru"
      ? "🐼 <b>PandaDev</b>: учитесь программировать по паре минут в день."
      : "🐼 <b>PandaDev</b>: learn to code a few minutes a day.";
  const connect = linked
    ? ""
    : locale === "ru"
      ? `\n\nЧтобы видеть свою серию и получать напоминания, подключите Telegram в ${a(profile, "профиле")}.`
      : `\n\nTo see your streak and get reminders, connect Telegram on your ${a(profile, "profile")}.`;
  const inline =
    locale === "ru"
      ? `\n\nВ любом чате напишите <code>@${bot} циклы</code>, чтобы найти и отправить урок.`
      : `\n\nIn any chat, type <code>@${bot} loops</code> to find and share a lesson.`;
  return `${intro}\n\n${commands[locale].join("\n")}${inline}${connect}`;
}

export type DailyItem = {
  language: string;
  name: string;
  difficulty: string;
  title: string;
  url: string;
};

export function todayText(
  locale: BotLocale,
  date: string,
  problems: DailyItem[],
) {
  const when = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  const lines = problems.map(
    (p) =>
      `${languageEmoji[p.language] ?? "•"} <b>${escapeHtml(p.name)}</b> · ${
        difficulty[locale][p.difficulty as Difficulty] ?? p.difficulty
      }\n${a(p.url, p.title)}`,
  );
  const head =
    locale === "ru"
      ? `🧩 <b>Задача дня</b> · ${when}\nРешите сегодня и получите <b>+20 XP</b> бонус на сайте.`
      : `🧩 <b>Problem of the day</b> · ${when}\nSolve one today for a <b>+20 XP</b> bonus on the site.`;
  return `${head}\n\n${lines.join("\n")}`;
}

export function randomText(locale: BotLocale, problem: DailyItem) {
  const head =
    locale === "ru" ? "🎲 <b>Случайная задача</b>" : "🎲 <b>Random problem</b>";
  return `${head}\n\n${languageEmoji[problem.language] ?? "•"} <b>${escapeHtml(problem.name)}</b> · ${
    difficulty[locale][problem.difficulty as Difficulty] ?? problem.difficulty
  }\n${a(problem.url, problem.title)}`;
}

export function notLinkedText(locale: BotLocale, profileUrl: string) {
  return locale === "ru"
    ? `Сначала подключите аккаунт: откройте ${a(profileUrl, "профиль на PandaDev")} и нажмите «Подключить Telegram».`
    : `Connect your account first: open your ${a(profileUrl, "PandaDev profile")} and tap “Connect Telegram”.`;
}

export type StreakInfo = {
  current: number;
  longest: number;
  activeToday: boolean;
  totalXp: number;
  level: number;
  todayXp: number;
  dailyGoal: number;
  freezes: number;
};

export function streakText(locale: BotLocale, s: StreakInfo) {
  const goal = Math.min(s.todayXp, s.dailyGoal);
  const done = s.todayXp >= s.dailyGoal;
  if (locale === "ru") {
    return [
      `🔥 <b>Серия: ${days(s.current, locale)}</b>${s.current > 0 && !s.activeToday ? " (сегодня ещё не занимались)" : ""}`,
      `🏅 Рекорд: ${days(s.longest, locale)}`,
      `⭐ Уровень ${s.level} · ${s.totalXp} XP`,
      `🎯 Сегодня: ${goal}/${s.dailyGoal} XP${done ? " ✅" : ""}`,
      `🧊 Заморозки: ${s.freezes}`,
    ].join("\n");
  }
  return [
    `🔥 <b>Streak: ${days(s.current, locale)}</b>${s.current > 0 && !s.activeToday ? " (not practised yet today)" : ""}`,
    `🏅 Best: ${days(s.longest, locale)}`,
    `⭐ Level ${s.level} · ${s.totalXp} XP`,
    `🎯 Today: ${goal}/${s.dailyGoal} XP${done ? " ✅" : ""}`,
    `🧊 Freezes: ${s.freezes}`,
  ].join("\n");
}

export function nextText(
  locale: BotLocale,
  target: {
    title: string;
    url: string;
    reason: "resume" | "next" | "start";
  } | null,
) {
  if (!target) {
    return locale === "ru"
      ? "🎉 Вы прошли всё, что есть. Загляните в /random за новой задачей."
      : "🎉 You've finished everything there is. Try /random for a problem.";
  }
  const label = {
    en: {
      resume: "Pick up where you left off",
      next: "Up next",
      start: "Start here",
    },
    ru: {
      resume: "Продолжите с того места, где остановились",
      next: "Дальше",
      start: "Начните отсюда",
    },
  }[locale][target.reason];
  return `▶️ <b>${label}</b>\n${a(target.url, target.title)}`;
}

export function linkedText(locale: BotLocale, name: string) {
  return locale === "ru"
    ? `✅ Готово, ${escapeHtml(name)}! Telegram подключён к PandaDev.\n\nТеперь работают /streak и /next. В /settings можно включить вечерние напоминания и рейтинг недели.`
    : `✅ Done, ${escapeHtml(name)}! Telegram is connected to PandaDev.\n\n/streak and /next work now. Turn on evening reminders and the weekly leaderboard in /settings.`;
}

export function linkFailedText(locale: BotLocale) {
  return locale === "ru"
    ? "Эта ссылка устарела или уже использована. Нажмите «Подключить Telegram» в профиле ещё раз."
    : "That link has expired or was already used. Tap “Connect Telegram” on your profile again.";
}

export function takenText(locale: BotLocale) {
  return locale === "ru"
    ? "Этот Telegram уже подключён к другому аккаунту PandaDev. Сначала отключите его там (/settings → Отключить)."
    : "This Telegram account is already connected to another PandaDev account. Disconnect it there first (/settings → Disconnect).";
}

export type Settings = { reminders: boolean; leaderboard: boolean };

export function settingsText(locale: BotLocale, s: Settings) {
  return locale === "ru"
    ? [
        "⚙️ <b>Настройки</b>",
        "",
        `🔔 Напоминание в 20:00, если серия под угрозой: <b>${s.reminders ? "вкл" : "выкл"}</b>`,
        `🏆 Ваше имя в рейтинге недели на канале: <b>${s.leaderboard ? "вкл" : "выкл"}</b>`,
      ].join("\n")
    : [
        "⚙️ <b>Settings</b>",
        "",
        `🔔 A reminder at 8 pm when your streak is at risk: <b>${s.reminders ? "on" : "off"}</b>`,
        `🏆 Your name on the channel's weekly leaderboard: <b>${s.leaderboard ? "on" : "off"}</b>`,
      ].join("\n");
}

export function settingsKeyboard(locale: BotLocale, s: Settings) {
  const ru = locale === "ru";
  return {
    inline_keyboard: [
      [
        {
          text: `🔔 ${ru ? "Напоминания" : "Reminders"}: ${s.reminders ? (ru ? "вкл" : "on") : ru ? "выкл" : "off"}`,
          callback_data: "toggle:reminders",
        },
      ],
      [
        {
          text: `🏆 ${ru ? "Рейтинг" : "Leaderboard"}: ${s.leaderboard ? (ru ? "вкл" : "on") : ru ? "выкл" : "off"}`,
          callback_data: "toggle:leaderboard",
        },
      ],
      [
        {
          text: ru ? "Отключить Telegram" : "Disconnect Telegram",
          callback_data: "unlink",
        },
      ],
    ],
  };
}

export function unlinkedText(locale: BotLocale) {
  return locale === "ru"
    ? "Telegram отключён от PandaDev. Подключить снова можно в профиле."
    : "Telegram is disconnected from PandaDev. You can connect it again on your profile.";
}

export function reminderText(
  locale: BotLocale,
  { streak, freezes, url }: { streak: number; freezes: number; url: string },
) {
  if (locale === "ru") {
    const freeze =
      freezes > 0
        ? `\n🧊 Заморозка есть (${freezes}), но лучше не тратить её.`
        : "";
    return `🔥 Ваша серия ${days(streak, locale)} закончится в полночь.\nОдно упражнение, и она продолжится: ${a(url, "задача дня")}.${freeze}`;
  }
  const freeze =
    freezes > 0
      ? `\n🧊 You have ${freezes} freeze${freezes > 1 ? "s" : ""}, but save it for a day you really need it.`
      : "";
  return `🔥 Your ${days(streak, locale)} streak ends at midnight.\nOne exercise keeps it going: ${a(url, "the problem of the day")}.${freeze}`;
}

export type LeaderboardEntry = { name: string; xp: number };

const medals = ["🥇", "🥈", "🥉"];

/** The weekly post for the channel, Russian then English. */
export function leaderboardText(
  entries: LeaderboardEntry[],
  { from, to, siteUrl }: { from: string; to: string; siteUrl: string },
) {
  const range = (locale: BotLocale) => {
    const f = (d: string) =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${d}T12:00:00Z`));
    return `${f(from)} – ${f(to)}`;
  };
  const rows = entries
    .map(
      (e, i) =>
        `${medals[i] ?? `${i + 1}.`} ${escapeHtml(e.name)} · <b>${e.xp} XP</b>`,
    )
    .join("\n");
  return [
    `🏆 <b>Рейтинг недели</b> · ${range("ru")}`,
    rows,
    `Хотите сюда? Подключите Telegram в ${a(`${siteUrl}/ru/profile`, "профиле")} и включите рейтинг в /settings у бота.`,
    "———",
    `🏆 <b>Leaderboard of the week</b> · ${range("en")}`,
    rows,
    `Want to be here? Connect Telegram on your ${a(`${siteUrl}/profile`, "profile")} and turn on the leaderboard in the bot's /settings.`,
    "",
    "#рейтинг #leaderboard",
  ].join("\n\n");
}
