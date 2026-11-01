import "server-only";

import { getLanguage } from "@/lib/content";
import { getDailyFeed } from "@/lib/daily-feed";
import { localizedPath, type Locale } from "@/lib/i18n";
import { getContinue } from "@/lib/learning";
import { getPracticeLanguages, getProblems } from "@/lib/practice";
import { evaluateAchievements, getStreakStatus } from "@/lib/progress";
import { prepareIndex, search, type Prepared } from "@/lib/search";
import { buildSearchIndex } from "@/lib/search-index";
import { siteUrl } from "@/lib/site";
import {
  BOT_USERNAME,
  CHANNEL_TIME_ZONE,
  sendMessage,
  telegram,
} from "@/lib/telegram/api";
import { dailyHint, dailyPost } from "@/lib/telegram/daily-post";
import {
  getLinkByTelegramId,
  pauseReminders,
  redeemLinkToken,
  setLinkOption,
  setReminderHour,
  unlinkTelegram,
  type TelegramLink,
} from "@/lib/telegram/links";
import { pingAchievements } from "@/lib/telegram/notify";
import { leagueParam, registerGroup, setWeeklyPost } from "@/lib/tg-app/league";
import { appLink } from "@/lib/tg-app/share";
import { createSnippet, setSnippetLanguage } from "@/lib/tg-app/snippet";
import {
  parseRunButton,
  parseRunCode,
  runLimitText,
  runMessage,
  runPickMessage,
  runPickRefusal,
  runTooLongText,
  runUsageText,
  type Entity,
} from "@/lib/telegram/run";
import {
  getQuizStats,
  recordPollAnswer,
  replyToAnswer,
  sendQuiz,
} from "@/lib/telegram/quiz";
import {
  appMessage,
  botLocale,
  dayIn,
  escapeHtml,
  helpText,
  hintPopup,
  hintSpoiler,
  hourKeyboard,
  hourPrompt,
  languageEmoji,
  languageFromArg,
  leagueAdminsOnlyText,
  leagueGroupMessage,
  leaguePrivateText,
  leagueToggledText,
  linkedText,
  linkFailedText,
  nextText,
  notLinkedText,
  parseButton,
  parseCommand,
  parseHintButton,
  pauseKeyboard,
  pausePrompt,
  randomText,
  settingsKeyboard,
  settingsText,
  streakText,
  takenText,
  todayText,
  unlinkedText,
  type BotLocale,
  type Settings,
} from "@/lib/telegram/texts";

/** Same order as the channel's daily post. */
const order = ["python", "javascript", "typescript", "sql"];

/** "Today" for people who haven't linked an account: the channel's clock. */
const DEFAULT_TIME_ZONE = CHANNEL_TIME_ZONE;

type From = {
  id: number;
  first_name?: string;
  username?: string;
  language_code?: string;
};

type Message = {
  chat: { id: number; type: string; title?: string };
  from?: From;
  text?: string;
  /** Code blocks ("pre", with their language), links, … */
  entities?: Entity[];
  /** The message this one answers (in groups, for /run on someone's code) */
  reply_to_message?: Omit<Message, "reply_to_message">;
};

/** The parts of a Telegram update the bot uses. */
export type Update = {
  message?: Message;
  callback_query?: {
    id: string;
    from: From;
    data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
  inline_query?: { id: string; from: From; query: string };
  /** An answer to a quiz poll the bot sent (only from non-anonymous polls) */
  poll_answer?: { poll_id: string; user?: From; option_ids: number[] };
};

const url = (path: string, locale: Locale) =>
  `${siteUrl}${localizedPath(path, locale)}`;

export async function handleUpdate(update: Update) {
  if (update.message?.text && update.message.from)
    return onMessage(
      update.message.chat,
      update.message.from,
      update.message.text,
      update.message,
    );
  if (update.callback_query) return onButton(update.callback_query);
  if (update.inline_query) return onInlineQuery(update.inline_query);
  if (update.poll_answer) return onPollAnswer(update.poll_answer);
}

async function onMessage(
  chat: { id: number; type: string; title?: string },
  from: From,
  text: string,
  message: Message = { chat },
) {
  // In groups, only commands meant for the bot; in private chats, anything.
  const parsed = parseCommand(text);
  if (!parsed && chat.type !== "private") return;
  // In a private chat, a code block on its own means /run.
  const codeBlock = !parsed && message.entities?.some((e) => e.type === "pre");
  const link = await getLinkByTelegramId(from.id);
  const locale: BotLocale = link
    ? (link.locale as BotLocale)
    : botLocale(from.language_code);
  const reply = (message: string, extra?: Record<string, unknown>) =>
    sendMessage(chat.id, message, extra);
  const profile = url("/profile", locale);
  if (codeBlock) return run(from, message, text, false, locale, reply);

  switch (parsed?.command) {
    case "start":
      // t.me/<bot>?startgroup=league: the bot was just added to a group.
      if (parsed.arg === "league" && chat.type !== "private")
        return league(chat, from, "", locale, reply);
      // t.me/<bot>?start=streak, from the "My streak" button under posts.
      if (parsed.arg === "streak") {
        if (!link) return reply(notLinkedText(locale, profile));
        return reply(await streak(link));
      }
      if (parsed.arg) {
        const result = await redeemLinkToken(parsed.arg, from);
        if (result.ok) return reply(linkedText(result.locale, result.name));
        return reply(
          result.reason === "taken"
            ? takenText(locale)
            : linkFailedText(locale),
        );
      }
      return reply(
        helpText(locale, { linked: Boolean(link), siteUrl, bot: BOT_USERNAME }),
      );
    case "today": {
      const post = dailyPost(
        dayIn(link?.timeZone ?? DEFAULT_TIME_ZONE),
        locale,
      );
      try {
        return await telegram("sendPhoto", {
          chat_id: chat.id,
          photo: post.photo,
          caption: post.caption,
          parse_mode: "HTML",
          reply_markup: post.reply_markup,
        });
      } catch (error) {
        // No picture (say, the image didn't load in time): the text still helps.
        console.error(error);
        return reply(today(locale, link));
      }
    }
    case "app": {
      const message = appMessage(locale, {
        private: chat.type === "private",
        appUrl: `${siteUrl}${locale === "ru" ? "/ru" : ""}/tg`,
        link: `https://t.me/${BOT_USERNAME}?startapp`,
      });
      return reply(message.text, { reply_markup: message.reply_markup });
    }
    case "league":
      return league(chat, from, parsed.arg, locale, reply);
    case "quiz":
      return sendQuiz(chat.id, locale, link);
    case "run":
      return run(from, message, text, true, locale, reply);
    case "random":
      return reply(randomProblem(locale, parsed.arg));
    case "streak":
      if (!link) return reply(notLinkedText(locale, profile));
      return reply(await streak(link));
    case "next": {
      if (!link) return reply(notLinkedText(locale, profile));
      const { target } = await getContinue(link.userId, locale);
      return reply(
        nextText(
          locale,
          target && {
            title: target.title,
            url: url(target.permalink, locale),
            reason: target.reason,
          },
        ),
      );
    }
    case "settings":
      if (!link) return reply(notLinkedText(locale, profile));
      return reply(settingsText(locale, settingsOf(link)), {
        reply_markup: settingsKeyboard(locale, settingsOf(link)),
      });
    default:
      return reply(
        helpText(locale, { linked: Boolean(link), siteUrl, bot: BOT_USERNAME }),
      );
  }
}

/**
 * /league: in a group, the group's league and its join button (/league off
 * and /league on, for admins, switch the Monday post); in a private chat,
 * how to start one.
 */
async function league(
  chat: { id: number; type: string; title?: string },
  from: From,
  arg: string,
  locale: BotLocale,
  reply: (text: string, extra?: Record<string, unknown>) => Promise<unknown>,
) {
  if (chat.type === "private") return reply(leaguePrivateText(locale));
  const toggle = arg.toLowerCase();
  if (toggle === "off" || toggle === "on") {
    const member = await telegram<{ status: string }>("getChatMember", {
      chat_id: chat.id,
      user_id: from.id,
    });
    if (member.status !== "administrator" && member.status !== "creator")
      return reply(leagueAdminsOnlyText(locale));
    await registerGroup(chat.id, chat.title ?? "");
    await setWeeklyPost(chat.id, toggle === "on");
    return reply(leagueToggledText(locale, toggle === "on"));
  }
  await registerGroup(chat.id, chat.title ?? "");
  const message = leagueGroupMessage(locale, {
    title: chat.title ?? "",
    link: `https://t.me/${BOT_USERNAME}?startapp=${leagueParam(chat.id)}`,
  });
  return reply(message.text, { reply_markup: message.reply_markup });
}

/**
 * /run: saves the code for a ▶ Run link that opens it in the Mini App's
 * sandbox (it runs on the phone of whoever taps, never on the server). The
 * code follows /run, or is the message /run replies to; when nothing says
 * the language, the bot asks with buttons.
 */
async function run(
  from: From,
  message: Message,
  text: string,
  command: boolean,
  locale: BotLocale,
  reply: (text: string, extra?: Record<string, unknown>) => Promise<unknown>,
) {
  let input = parseRunCode(text, message.entities, command);
  let author = from;
  const replied = message.reply_to_message;
  if (!input.code && replied?.text) {
    const theirs = parseRunCode(replied.text, replied.entities, false);
    input = { code: theirs.code, language: theirs.language ?? input.language };
    author = replied.from ?? from;
  }
  if (!input.code) return reply(runUsageText(locale));
  const snippet = await createSnippet({
    author: { telegramId: author.id, name: author.first_name ?? "" },
    senderTelegramId: from.id,
    language: input.language,
    code: input.code,
  });
  if ("error" in snippet)
    return reply(
      snippet.error === "too-long"
        ? runTooLongText(locale)
        : snippet.error === "limit"
          ? runLimitText(locale)
          : runUsageText(locale),
    );
  const answer = input.language
    ? runMessage(locale, {
        language: input.language,
        author: snippet.authorName,
        code: snippet.code,
        link: appLink(`run_${snippet.id}`),
      })
    : runPickMessage(locale, snippet.id);
  return reply(answer.text, { reply_markup: answer.reply_markup });
}

function today(locale: BotLocale, link: TelegramLink | null) {
  const day = dayIn(link?.timeZone ?? DEFAULT_TIME_ZONE);
  const feed = getDailyFeed(day);
  return todayText(
    locale,
    day,
    feed.problems
      .toSorted((a, b) => order.indexOf(a.language) - order.indexOf(b.language))
      .map((p) => ({
        language: p.language,
        name: p.name,
        difficulty: p.difficulty,
        ...p[locale],
      })),
  );
}

function randomProblem(locale: BotLocale, arg: string) {
  const all = getPracticeLanguages();
  const asked = languageFromArg(arg);
  const language =
    asked && all.includes(asked)
      ? asked
      : all[Math.floor(Math.random() * all.length)];
  const problems = getProblems(language, locale);
  const problem = problems[Math.floor(Math.random() * problems.length)];
  const text = randomText(locale, {
    language,
    name: getLanguage(language)?.name ?? language,
    difficulty: problem.difficulty,
    title: problem.title,
    url: url(problem.permalink, locale),
  });
  return problem.hint
    ? `${text}\n\n${hintSpoiler(locale, problem.hint)}`
    : text;
}

async function streak(link: TelegramLink) {
  const [{ streak, ...status }, quiz] = await Promise.all([
    getStreakStatus(link.userId, link.timeZone),
    getQuizStats(link.userId, link.timeZone),
  ]);
  return streakText(link.locale as BotLocale, {
    ...status,
    current: streak.current,
    longest: streak.longest,
    activeToday: streak.activeToday,
    quiz,
  });
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** What /settings shows; a pause that has ended doesn't count. */
function settingsOf(link: TelegramLink): Settings {
  const today = dayIn(link.timeZone);
  return {
    reminders: link.reminders,
    reminderHour: link.reminderHour,
    pausedUntil:
      link.remindersResumeOn && link.remindersResumeOn > today
        ? link.remindersResumeOn
        : null,
    pings: link.pings,
    leaderboard: link.leaderboard,
  };
}

/** A quiz answered: XP, the reply, and a picture for any badge it unlocked. */
async function onPollAnswer(answer: NonNullable<Update["poll_answer"]>) {
  if (!answer.user) return;
  const link = await getLinkByTelegramId(answer.user.id);
  const result = await recordPollAnswer(
    answer.poll_id,
    answer.option_ids,
    link,
  );
  if (!link || !result) return;
  await replyToAnswer(link, result);
  if (result.xp > 0) {
    const { newAchievements } = await evaluateAchievements(
      link.userId,
      link.timeZone,
    );
    await pingAchievements(
      link.userId,
      newAchievements.map((a) => a.id),
    );
  }
}

async function onButton(query: NonNullable<Update["callback_query"]>) {
  const link = await getLinkByTelegramId(query.from.id);
  // A language button under /run's question: the code's ▶ Run message.
  const runPick = parseRunButton(query.data);
  if (runPick) {
    const locale = link
      ? (link.locale as BotLocale)
      : botLocale(query.from.language_code);
    const snippet = await setSnippetLanguage(
      runPick.id,
      query.from.id,
      runPick.language,
    );
    if ("error" in snippet)
      return telegram("answerCallbackQuery", {
        callback_query_id: query.id,
        text: runPickRefusal(locale, snippet.error),
      });
    if (query.message) {
      const answer = runMessage(locale, {
        language: runPick.language,
        author: snippet.authorName,
        code: snippet.code,
        link: appLink(`run_${snippet.id}`),
      });
      await telegram("editMessageText", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: answer.text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: answer.reply_markup,
      });
    }
    return telegram("answerCallbackQuery", { callback_query_id: query.id });
  }
  // 💡 under a daily post (in the channel or a chat): the hint, privately.
  const hintButton = parseHintButton(query.data);
  if (hintButton) {
    const locale = link
      ? (link.locale as BotLocale)
      : botLocale(query.from.language_code);
    const hint = dailyHint(hintButton.language, hintButton.date, locale);
    return telegram("answerCallbackQuery", {
      callback_query_id: query.id,
      text: hint
        ? hintPopup(hint)
        : locale === "ru"
          ? "Для этой задачи пока нет подсказки."
          : "There's no hint for this one yet.",
      show_alert: true,
    });
  }
  const message = query.message;
  const button = parseButton(query.data);
  // "Quick quiz" under a reminder, "Another question" under an answer.
  if (button?.kind === "quiz" && message) {
    const locale = link
      ? (link.locale as BotLocale)
      : botLocale(query.from.language_code);
    await telegram("answerCallbackQuery", { callback_query_id: query.id });
    return sendQuiz(message.chat.id, locale, link);
  }
  if (!link || !message || !button) {
    return telegram("answerCallbackQuery", { callback_query_id: query.id });
  }
  const locale = link.locale as BotLocale;
  const edit = (text: string, reply_markup?: object) =>
    telegram("editMessageText", {
      chat_id: message.chat.id,
      message_id: message.message_id,
      text,
      parse_mode: "HTML",
      ...(reply_markup ? { reply_markup } : {}),
    });
  const showSettings = (settings: Settings) =>
    edit(settingsText(locale, settings), settingsKeyboard(locale, settings));
  const current = settingsOf(link);

  switch (button.kind) {
    case "unlink":
      await unlinkTelegram(query.from.id);
      await edit(unlinkedText(locale));
      break;
    case "toggle": {
      const value = !current[button.option];
      await setLinkOption(link.userId, button.option, value);
      await showSettings({ ...current, [button.option]: value });
      break;
    }
    case "menu":
      if (button.menu === "hour")
        await edit(hourPrompt(locale), hourKeyboard(locale, link.reminderHour));
      else if (button.menu === "pause")
        await edit(pausePrompt(locale), pauseKeyboard(locale));
      else await showSettings(current);
      break;
    case "hour":
      await setReminderHour(link.userId, button.hour);
      await showSettings({
        ...current,
        reminders: true,
        reminderHour: button.hour,
      });
      break;
    case "pause": {
      const resumeOn =
        button.days > 0 ? addDays(dayIn(link.timeZone), button.days) : null;
      await pauseReminders(link.userId, resumeOn);
      await showSettings({ ...current, pausedUntil: resumeOn });
      break;
    }
  }
  return telegram("answerCallbackQuery", { callback_query_id: query.id });
}

const indexes = new Map<Locale, Prepared[]>();

/** "@panda_learning_bot loops" in any chat: lessons and problems to share. */
async function onInlineQuery(query: NonNullable<Update["inline_query"]>) {
  const locale = botLocale(query.from.language_code);
  let index = indexes.get(locale);
  if (!index) {
    index = prepareIndex(buildSearchIndex(locale));
    indexes.set(locale, index);
  }
  const results = query.query.trim()
    ? search(index, query.query, { limit: 10 })
    : [];
  return telegram("answerInlineQuery", {
    inline_query_id: query.id,
    cache_time: 3600,
    results: results.map(({ entry, section }, i) => {
      const link = url(section?.url ?? entry.url, locale);
      const name = getLanguage(entry.language)?.name ?? entry.language;
      const title = section ? `${entry.title} › ${section.title}` : entry.title;
      return {
        type: "article",
        id: String(i),
        title: `${languageEmoji[entry.language] ?? ""} ${title}`.trim(),
        description: `${name} · ${entry.description}`.slice(0, 200),
        url: link,
        input_message_content: {
          message_text: `${languageEmoji[entry.language] ?? "📘"} <b>${escapeHtml(title)}</b>\n${escapeHtml(entry.description)}\n\n<a href="${escapeHtml(link)}">PandaDev · ${escapeHtml(name)}</a>`,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        },
      };
    }),
  });
}
