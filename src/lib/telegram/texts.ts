/**
 * What the Telegram bot says, in English and Russian. No server imports, so
 * the wording is easy to test.
 */

export type BotLocale = "en" | "ru";

/** Russian for Telegram users whose app is in Russian, English otherwise. */
export function botLocale(languageCode?: string): BotLocale {
  return languageCode?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

/** For Telegram's HTML: text and attribute values (quotes too, for href="…"). */
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    "/app: your panda, games and a code sandbox",
    "/league: a weekly XP table for your group (send it in a group)",
    "/today: the problem of the day",
    "/quiz: a quiz question (+5 XP when you're right)",
    "/run: code to run in the sandbox (send it after /run, or reply /run to it)",
    "/random python: a random practice problem (python, js, ts or sql)",
    "/streak: your streak and XP",
    "/next: where you left off",
    "/settings: reminders (time, pause) and the weekly leaderboard",
  ],
  ru: [
    "/app: ваша панда, игры и песочница для кода",
    "/league: рейтинг недели для вашей группы (отправьте в группе)",
    "/today: задача дня",
    "/quiz: вопрос из уроков (+5 XP за верный ответ)",
    "/run: код для песочницы (отправьте его после /run или ответьте /run на сообщение с ним)",
    "/random python: случайная задача (python, js, ts или sql)",
    "/streak: ваша серия и XP",
    "/next: где вы остановились",
    "/settings: напоминания (время, пауза) и рейтинг недели",
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

/**
 * /app: a button that opens the Mini App. In a private chat it opens right
 * there (web_app); groups only allow links, so it's the app's t.me link.
 */
export function appMessage(
  locale: BotLocale,
  {
    private: inPrivate,
    appUrl,
    link,
  }: { private: boolean; appUrl: string; link: string },
) {
  const ru = locale === "ru";
  const text = ru
    ? "🐼 <b>PandaDev в Telegram</b>\nВаша панда растёт вместе с вами, а блиц дня: 10 вопросов за 60 секунд. Сможете обогнать друзей?\n💻 На вкладке «Код» можно запускать Python, JavaScript, SQL и TypeScript."
    : "🐼 <b>PandaDev in Telegram</b>\nYour panda grows with you, and the Daily Blitz is 10 questions in 60 seconds. Can you beat your friends?\n💻 The Code tab runs Python, JavaScript, SQL and TypeScript.";
  const label = ru ? "⚡ Открыть" : "⚡ Open";
  const button = inPrivate
    ? { text: label, web_app: { url: appUrl } }
    : { text: label, url: link };
  return { text, reply_markup: { inline_keyboard: [[button]] } };
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
  /** Quiz polls answered in the bot */
  quiz?: QuizStats;
};

export type QuizStats = {
  /** The last 7 days, today included */
  answered: number;
  correct: number;
  /** Days in a row with a right answer in the bot */
  streak: number;
};

function quizLine(locale: BotLocale, q?: QuizStats) {
  if (!q || (q.answered === 0 && q.streak === 0))
    return locale === "ru"
      ? "🧠 /quiz: +5 XP за каждый верный ответ"
      : "🧠 /quiz: +5 XP for each right answer";
  const streak =
    q.streak > 0
      ? ` · ${locale === "ru" ? "серия" : "quiz streak"} ${days(q.streak, locale)}`
      : "";
  return locale === "ru"
    ? `🧠 Квизы в боте: ${q.correct}/${q.answered} верно за неделю${streak}`
    : `🧠 Bot quizzes: ${q.correct}/${q.answered} right this week${streak}`;
}

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
      quizLine(locale, s.quiz),
    ].join("\n");
  }
  return [
    `🔥 <b>Streak: ${days(s.current, locale)}</b>${s.current > 0 && !s.activeToday ? " (not practised yet today)" : ""}`,
    `🏅 Best: ${days(s.longest, locale)}`,
    `⭐ Level ${s.level} · ${s.totalXp} XP`,
    `🎯 Today: ${goal}/${s.dailyGoal} XP${done ? " ✅" : ""}`,
    `🧊 Freezes: ${s.freezes}`,
    quizLine(locale, s.quiz),
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
    ? `✅ Готово, ${escapeHtml(name)}! Telegram подключён к PandaDev.\n\nТеперь работают /streak и /next, а за верные ответы в /quiz начисляются XP. В /settings можно включить напоминания (и выбрать время) и рейтинг недели.`
    : `✅ Done, ${escapeHtml(name)}! Telegram is connected to PandaDev.\n\n/streak and /next work now, and right answers in /quiz earn XP. Turn on reminders (at a time you pick) and the weekly leaderboard in /settings.`;
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

export type Settings = {
  reminders: boolean;
  /** Local hour of the reminder, 0–23 */
  reminderHour: number;
  /** Reminders are paused before this local day (null: not paused) */
  pausedUntil: string | null;
  pings: boolean;
  leaderboard: boolean;
};

/** The hours offered for the reminder. */
export const REMINDER_HOUR_CHOICES = [8, 10, 12, 14, 16, 18, 19, 20, 21, 22];
/** "Pause reminders" lengths, in days. */
export const PAUSE_CHOICES = [1, 3, 7];

const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
const onOff = (locale: BotLocale, on: boolean) =>
  locale === "ru" ? (on ? "вкл" : "выкл") : on ? "on" : "off";

export function settingsText(locale: BotLocale, s: Settings) {
  const ru = locale === "ru";
  const reminder = ru
    ? `🔔 Напоминание, если серия под угрозой: <b>${onOff(locale, s.reminders)}</b>${s.reminders ? `, в <b>${clock(s.reminderHour)}</b>` : ""}`
    : `🔔 A reminder when your streak is at risk: <b>${onOff(locale, s.reminders)}</b>${s.reminders ? `, at <b>${clock(s.reminderHour)}</b>` : ""}`;
  const paused =
    s.reminders && s.pausedUntil
      ? ru
        ? `⏸ На паузе, снова с ${dayLabel(locale, s.pausedUntil)}`
        : `⏸ Paused, back on ${dayLabel(locale, s.pausedUntil)}`
      : null;
  return [
    ru ? "⚙️ <b>Настройки</b>" : "⚙️ <b>Settings</b>",
    "",
    reminder,
    ...(paused ? [paused] : []),
    ru
      ? `🏅 Сообщение о новом достижении: <b>${onOff(locale, s.pings)}</b>`
      : `🏅 A message when you unlock an achievement: <b>${onOff(locale, s.pings)}</b>`,
    ru
      ? `🏆 Ваше имя в рейтинге недели на канале: <b>${onOff(locale, s.leaderboard)}</b>`
      : `🏆 Your name on the channel's weekly leaderboard: <b>${onOff(locale, s.leaderboard)}</b>`,
  ].join("\n");
}

export function settingsKeyboard(locale: BotLocale, s: Settings) {
  const ru = locale === "ru";
  const reminderRow = s.reminders
    ? [
        [
          { text: `🕗 ${clock(s.reminderHour)}`, callback_data: "menu:hour" },
          s.pausedUntil
            ? {
                text: ru ? "▶️ Снять паузу" : "▶️ Resume",
                callback_data: "pause:0",
              }
            : { text: ru ? "⏸ Пауза" : "⏸ Pause", callback_data: "menu:pause" },
        ],
      ]
    : [];
  return {
    inline_keyboard: [
      [
        {
          text: `🔔 ${ru ? "Напоминания" : "Reminders"}: ${onOff(locale, s.reminders)}`,
          callback_data: "toggle:reminders",
        },
      ],
      ...reminderRow,
      [
        {
          text: `🏅 ${ru ? "Достижения" : "Achievements"}: ${onOff(locale, s.pings)}`,
          callback_data: "toggle:pings",
        },
      ],
      [
        {
          text: `🏆 ${ru ? "Рейтинг" : "Leaderboard"}: ${onOff(locale, s.leaderboard)}`,
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

const backButton = (locale: BotLocale) => ({
  text: locale === "ru" ? "« Назад" : "« Back",
  callback_data: "menu:main",
});

/** "At what time?": the hours, five to a row, the current one ticked. */
export function hourKeyboard(locale: BotLocale, current: number) {
  const buttons = REMINDER_HOUR_CHOICES.map((hour) => ({
    text: `${hour === current ? "✓ " : ""}${clock(hour)}`,
    callback_data: `hour:${hour}`,
  }));
  return {
    inline_keyboard: [
      buttons.slice(0, 5),
      buttons.slice(5),
      [backButton(locale)],
    ],
  };
}

export function pauseKeyboard(locale: BotLocale) {
  return {
    inline_keyboard: [
      PAUSE_CHOICES.map((n) => ({
        text: days(n, locale),
        callback_data: `pause:${n}`,
      })),
      [backButton(locale)],
    ],
  };
}

export function hourPrompt(locale: BotLocale) {
  return locale === "ru"
    ? "🕗 В какое время напоминать? Время ваше, местное."
    : "🕗 What time should the reminder come? Your local time.";
}

export function pausePrompt(locale: BotLocale) {
  return locale === "ru"
    ? "⏸ На сколько поставить напоминания на паузу? Серия от этого не защищена: для неё есть заморозки."
    : "⏸ Pause reminders for how long? This doesn't protect your streak: freezes do that.";
}

export type SettingsButton =
  | { kind: "toggle"; option: "reminders" | "pings" | "leaderboard" }
  | { kind: "menu"; menu: "main" | "hour" | "pause" }
  | { kind: "hour"; hour: number }
  | { kind: "pause"; days: number }
  | { kind: "unlink" }
  | { kind: "quiz" };

/** The buttons under /settings, reminders and quiz answers. */
export function parseButton(data?: string): SettingsButton | null {
  if (data === "unlink") return { kind: "unlink" };
  if (data === "quiz") return { kind: "quiz" };
  const [kind, value] = (data ?? "").split(":");
  if (
    kind === "toggle" &&
    (value === "reminders" || value === "pings" || value === "leaderboard")
  )
    return { kind, option: value };
  if (
    kind === "menu" &&
    (value === "main" || value === "hour" || value === "pause")
  )
    return { kind, menu: value };
  if (kind === "hour" && REMINDER_HOUR_CHOICES.includes(Number(value)))
    return { kind, hour: Number(value) };
  if (
    kind === "pause" &&
    (value === "0" || PAUSE_CHOICES.includes(Number(value)))
  )
    return { kind, days: Number(value) };
  return null;
}

export function unlinkedText(locale: BotLocale) {
  return locale === "ru"
    ? "Telegram отключён от PandaDev. Подключить снова можно в профиле."
    : "Telegram is disconnected from PandaDev. You can connect it again on your profile.";
}

export type Reminder = {
  streak: number;
  /** The learner's best streak */
  best: number;
  freezes: number;
  /** Whole hours left until midnight, rounded up (1–24) */
  hoursLeft: number;
  url: string;
};

export function reminderText(locale: BotLocale, r: Reminder) {
  if (locale === "ru") {
    const left =
      r.hoursLeft <= 1 ? "меньше часа" : `меньше ${r.hoursLeft} часов`;
    const record =
      r.streak >= r.best
        ? `\n🏅 Позанимайтесь сегодня, и это новый рекорд: ${days(r.streak + 1, locale)}.`
        : "";
    const freeze =
      r.freezes > 0
        ? `\n🧊 Заморозка есть (${r.freezes}), но лучше не тратить её.`
        : "";
    return `🔥 Ваша серия ${days(r.streak, locale)} под угрозой: до полуночи ${left}.\nХватит одного упражнения (${a(r.url, "задача дня")}) или верного ответа в квизе ниже.${record}${freeze}`;
  }
  const left =
    r.hoursLeft <= 1 ? "less than an hour" : `less than ${r.hoursLeft} hours`;
  const record =
    r.streak >= r.best
      ? `\n🏅 Practise today for a new record: ${days(r.streak + 1, locale)}.`
      : "";
  const freeze =
    r.freezes > 0
      ? `\n🧊 You have ${r.freezes} freeze${r.freezes > 1 ? "s" : ""}, but save it for a day you really need it.`
      : "";
  return `🔥 Your ${days(r.streak, locale)} streak is at risk: ${left} until midnight.\nOne exercise (${a(r.url, "the problem of the day")}) or one right quiz answer below keeps it going.${record}${freeze}`;
}

/** Under a reminder: a quiz right here, or the problem on the site. */
export function reminderKeyboard(locale: BotLocale, url: string) {
  const ru = locale === "ru";
  return {
    inline_keyboard: [
      [
        {
          text: ru ? "🧠 Быстрый квиз" : "🧠 Quick quiz",
          callback_data: "quiz",
        },
        { text: ru ? "🧩 Задача дня" : "🧩 Problem of the day", url },
      ],
    ],
  };
}

/** Whole hours until local midnight, rounded up. */
export function hoursUntilMidnight(timeZone: string, now = new Date()) {
  const [hour, minute] = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  })
    .format(now)
    .split(":")
    .map(Number);
  return Math.max(1, Math.ceil((24 * 60 - (hour * 60 + minute)) / 60));
}

// ---------------------------------------------------------------------------
// Quiz answers and achievement messages
// ---------------------------------------------------------------------------

export function quizAnswerText(
  locale: BotLocale,
  r: {
    correct: boolean;
    /** XP this answer earned (0 once today's quiz XP is used up) */
    xp: number;
    /** The right option's text, for a wrong answer */
    answer: string;
    stats: QuizStats;
  },
) {
  const ru = locale === "ru";
  const week = ru
    ? `${r.stats.correct}/${r.stats.answered} верно за неделю`
    : `${r.stats.correct}/${r.stats.answered} right this week`;
  if (!r.correct)
    return ru
      ? `❌ Не в этот раз. Ответ: <b>${escapeHtml(r.answer)}</b>\n${week}`
      : `❌ Not this time. The answer: <b>${escapeHtml(r.answer)}</b>\n${week}`;
  const head =
    r.xp > 0
      ? ru
        ? `✅ Верно! <b>+${r.xp} XP</b>`
        : `✅ Right! <b>+${r.xp} XP</b>`
      : ru
        ? "✅ Верно! XP за квизы на сегодня уже получены, но серия считается."
        : "✅ Right! Today's quiz XP is already yours, but the streak still counts.";
  const streak = ru
    ? `🔥 Серия квизов: ${days(r.stats.streak, locale)} · ${week}`
    : `🔥 Quiz streak: ${days(r.stats.streak, locale)} · ${week}`;
  return `${head}\n${streak}`;
}

export function anotherQuizKeyboard(locale: BotLocale) {
  return {
    inline_keyboard: [
      [
        {
          text: locale === "ru" ? "🧠 Ещё вопрос" : "🧠 Another question",
          callback_data: "quiz",
        },
      ],
    ],
  };
}

/** The caption under an achievement or finished-course picture. */
export function pingCaption(
  locale: BotLocale,
  ping:
    | { kind: "achievement"; emoji: string; title: string; description: string }
    | { kind: "course"; name: string },
) {
  const ru = locale === "ru";
  if (ping.kind === "course")
    return ru
      ? `🎓 <b>Курс ${escapeHtml(ping.name)} пройден!</b>\nВсе уроки позади. Чтобы не забыть, заглядывайте в /quiz и ежедневное повторение.`
      : `🎓 <b>You finished the ${escapeHtml(ping.name)} course!</b>\nEvery lesson, done. Keep it fresh with /quiz and the daily review.`;
  return ru
    ? `${ping.emoji} <b>Новое достижение: ${escapeHtml(ping.title)}</b>\n${escapeHtml(ping.description)}.`
    : `${ping.emoji} <b>Achievement unlocked: ${escapeHtml(ping.title)}</b>\n${escapeHtml(ping.description)}.`;
}

export function pingKeyboard(locale: BotLocale, url: string) {
  return {
    inline_keyboard: [
      [
        {
          text: locale === "ru" ? "🏅 Все достижения" : "🏅 All achievements",
          url,
        },
      ],
    ],
  };
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

// ---------------------------------------------------------------------------
// The daily post (channel and /today): a picture card, a caption, buttons
// ---------------------------------------------------------------------------

/** Who reads a post: the channel gets both languages, a chat gets one. */
export type Audience = BotLocale | "both";

export type DailyProblem = {
  language: string;
  name: string;
  difficulty: string;
  en: { title: string; url: string };
  ru: { title: string; url: string };
};

const dailyOrder = ["python", "javascript", "typescript", "sql"];
export const sortDaily = <T extends { language: string }>(problems: T[]) =>
  problems.toSorted(
    (a, b) => dailyOrder.indexOf(a.language) - dailyOrder.indexOf(b.language),
  );

const shortName: Record<string, string> = {
  python: "Python",
  javascript: "JS",
  typescript: "TS",
  sql: "SQL",
};

const dayLabel = (locale: BotLocale, date: string) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

/**
 * The caption under the daily picture (Telegram allows 1024 characters):
 * each problem links to the site, and a pointer to the hint buttons.
 */
export function dailyCaption(
  audience: Audience,
  date: string,
  problems: DailyProblem[],
  quizBelow: boolean,
) {
  const both = audience === "both";
  const head =
    audience === "en"
      ? `🧩 <b>Problem of the day</b> · ${dayLabel("en", date)}\nSolve one today for a <b>+20 XP</b> bonus on the site.`
      : `🧩 <b>Задача дня</b>${both ? " · Problem of the day" : ""} · ${dayLabel("ru", date)}\nРешите сегодня и получите <b>+20 XP</b> на сайте.${both ? "\nSolve one today for +20 XP on the site." : ""}`;
  const lines = sortDaily(problems).map((p) => {
    const level =
      audience === "en"
        ? difficulty.en[p.difficulty as Difficulty]
        : `${difficulty.ru[p.difficulty as Difficulty]}${both ? ` · ${difficulty.en[p.difficulty as Difficulty]}` : ""}`;
    const main = audience === "en" ? p.en : p.ru;
    const extra = both ? ` · ${a(p.en.url, "EN")}` : "";
    return `${languageEmoji[p.language] ?? "•"} <b>${escapeHtml(p.name)}</b> · ${level}\n${a(main.url, main.title)}${extra}`;
  });
  const hints =
    audience === "en"
      ? "💡 Stuck? Tap a hint button below."
      : `💡 Застряли? Нажмите кнопку с подсказкой ниже.${both ? "\n💡 Stuck? Tap a hint button below." : ""}`;
  const quiz = quizBelow
    ? audience === "en"
      ? "\n❓ Question of the day below."
      : `\n❓ Вопрос дня ниже.${both ? " · Question of the day below." : ""}`
    : "";
  const tags = both ? "\n\n#задачадня #problemoftheday" : "";
  return `${head}\n\n${lines.join("\n")}\n\n${hints}${quiz}${tags}`;
}

/** Buttons under the daily post: solve on the site, a hint per language. */
export function dailyKeyboard(
  audience: Audience,
  date: string,
  problems: DailyProblem[],
  { siteUrl, bot }: { siteUrl: string; bot: string },
) {
  const solve =
    audience === "both"
      ? [
          { text: "🇷🇺 Решить на сайте", url: `${siteUrl}/ru/practice` },
          { text: "🇬🇧 Solve on the site", url: `${siteUrl}/practice` },
        ]
      : [
          {
            text:
              audience === "ru" ? "🧩 Решить на сайте" : "🧩 Solve on the site",
            url: `${siteUrl}${audience === "ru" ? "/ru" : ""}/practice`,
          },
        ];
  const hints = sortDaily(problems).map((p) => ({
    text: `💡 ${shortName[p.language] ?? p.name}`,
    callback_data: `hint:${p.language}:${date}`,
  }));
  const rows: object[][] = [solve, hints];
  if (audience === "both")
    rows.push([
      {
        text: "🔥 Моя серия · My streak",
        url: `https://t.me/${bot}?start=streak`,
      },
    ]);
  return { inline_keyboard: rows };
}

/** "hint:python:2026-10-12" → the language and day of a hint button. */
export function parseHintButton(data?: string) {
  const match = /^hint:([a-z]+):(\d{4}-\d{2}-\d{2})$/.exec(data ?? "");
  return match ? { language: match[1], date: match[2] } : null;
}

/** A hint's markdown as Telegram HTML: `code` and **bold**, the rest escaped. */
export function hintHtml(markdown: string) {
  return escapeHtml(markdown)
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
}

/**
 * A hint as plain text for a pop-up (Telegram shows up to 200 characters):
 * whole sentences when they fit, else whole words and an ellipsis.
 */
export function hintPopup(markdown: string, max = 200) {
  const text = markdown
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  return sentence > max / 3
    ? cut.slice(0, sentence + 1)
    : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function hintSpoiler(locale: BotLocale, markdown: string) {
  return `💡 ${locale === "ru" ? "Подсказка" : "Hint"}: <tg-spoiler>${hintHtml(markdown)}</tg-spoiler>`;
}

// ---------------------------------------------------------------------------
// Group leagues (/league in a group)
// ---------------------------------------------------------------------------

export function leaguePrivateText(locale: BotLocale) {
  return locale === "ru"
    ? "👥 Лиги для групп: добавьте меня в учебную группу или чат класса и отправьте там /league. У группы появится свой рейтинг недели."
    : "👥 Leagues are for groups: add me to your study group or class chat and send /league there. The group gets its own weekly table.";
}

/** /league in a group: what it is, and the button that opens it. */
export function leagueGroupMessage(
  locale: BotLocale,
  { title, link }: { title: string; link: string },
) {
  const ru = locale === "ru";
  const text = ru
    ? `👥 <b>Лига «${escapeHtml(title)}»</b>\nРейтинг недели для этой группы: XP за уроки, задачи, блиц и дуэли на PandaDev. Нажмите кнопку, чтобы вступить.\n\nПо понедельникам я публикую итоги недели здесь. Админы могут выключить это: /league off.`
    : `👥 <b>${escapeHtml(title)} league</b>\nA weekly table for this group: XP from lessons, practice, the Blitz and duels on PandaDev. Tap the button to join.\n\nOn Mondays I post last week's results here. Admins can turn that off: /league off.`;
  return {
    text,
    reply_markup: {
      inline_keyboard: [
        [{ text: ru ? "👥 Вступить в лигу" : "👥 Join the league", url: link }],
      ],
    },
  };
}

export function leagueToggledText(locale: BotLocale, on: boolean) {
  if (locale === "ru")
    return on
      ? "✅ Итоги недели снова будут здесь по понедельникам."
      : "🔕 Итоги недели больше не будут публиковаться. Включить снова: /league on.";
  return on
    ? "✅ Last week's results will be posted here on Mondays again."
    : "🔕 No more Monday posts here. Turn them back on with /league on.";
}

export function leagueAdminsOnlyText(locale: BotLocale) {
  return locale === "ru"
    ? "Это могут сделать только админы группы."
    : "Only the group's admins can do that.";
}

/** The Monday post in a group: last week's table, both languages. */
export function leagueWeeklyText(
  title: string,
  rows: { name: string; xp: number }[],
  { from, to }: { from: string; to: string },
) {
  const range = (locale: BotLocale) =>
    `${dayLabel(locale, from)} – ${dayLabel(locale, to)}`;
  const table = rows
    .map(
      (r, i) =>
        `${medals[i] ?? `${i + 1}.`} ${escapeHtml(r.name)} · <b>${r.xp} XP</b>`,
    )
    .join("\n");
  return [
    `🏆 <b>${escapeHtml(title)}</b> · ${range("ru")} · ${range("en")}`,
    table,
    "Кто следующий? Вступайте в лигу кнопкой ниже. · Who's next? Join with the button below.",
  ].join("\n\n");
}

export function leagueButton(locale: BotLocale | "both", link: string) {
  const text =
    locale === "both"
      ? "👥 Лига · League"
      : locale === "ru"
        ? "👥 Открыть лигу"
        : "👥 Open the league";
  return { inline_keyboard: [[{ text, url: link }]] };
}
