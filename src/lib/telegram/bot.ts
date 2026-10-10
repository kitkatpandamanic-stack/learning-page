import "server-only";

import { getLanguage } from "@/lib/content";
import {
  clipExplanation,
  getDailyFeed,
  getPollQuizzes,
} from "@/lib/daily-feed";
import { localizedPath, type Locale } from "@/lib/i18n";
import { getContinue } from "@/lib/learning";
import { getPracticeLanguages, getProblems } from "@/lib/practice";
import { getStreakStatus } from "@/lib/progress";
import { prepareIndex, search, type Prepared } from "@/lib/search";
import { buildSearchIndex } from "@/lib/search-index";
import { siteUrl } from "@/lib/site";
import { BOT_USERNAME, sendMessage, telegram } from "@/lib/telegram/api";
import {
  getLinkByTelegramId,
  redeemLinkToken,
  setLinkOption,
  unlinkTelegram,
  type TelegramLink,
} from "@/lib/telegram/links";
import {
  botLocale,
  dayIn,
  escapeHtml,
  helpText,
  languageEmoji,
  languageFromArg,
  linkedText,
  linkFailedText,
  nextText,
  notLinkedText,
  parseCommand,
  randomText,
  settingsKeyboard,
  settingsText,
  streakText,
  takenText,
  todayText,
  unlinkedText,
  type BotLocale,
} from "@/lib/telegram/texts";

/** Same order as the channel's daily post. */
const order = ["python", "javascript", "typescript", "sql"];

/** "Today" for people who haven't linked an account: the channel's clock. */
const DEFAULT_TIME_ZONE = "Asia/Tashkent";

type From = { id: number; username?: string; language_code?: string };

/** The parts of a Telegram update the bot uses. */
export type Update = {
  message?: { chat: { id: number; type: string }; from?: From; text?: string };
  callback_query?: {
    id: string;
    from: From;
    data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
  inline_query?: { id: string; from: From; query: string };
};

const url = (path: string, locale: Locale) =>
  `${siteUrl}${localizedPath(path, locale)}`;

export async function handleUpdate(update: Update) {
  if (update.message?.text && update.message.from)
    return onMessage(
      update.message.chat,
      update.message.from,
      update.message.text,
    );
  if (update.callback_query) return onButton(update.callback_query);
  if (update.inline_query) return onInlineQuery(update.inline_query);
}

async function onMessage(
  chat: { id: number; type: string },
  from: From,
  text: string,
) {
  // In groups, only commands meant for the bot; in private chats, anything.
  const parsed = parseCommand(text);
  if (!parsed && chat.type !== "private") return;
  const link = await getLinkByTelegramId(from.id);
  const locale: BotLocale = link
    ? (link.locale as BotLocale)
    : botLocale(from.language_code);
  const reply = (message: string, extra?: Record<string, unknown>) =>
    sendMessage(chat.id, message, extra);
  const profile = url("/profile", locale);

  switch (parsed?.command) {
    case "start":
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
    case "today":
      return reply(today(locale, link));
    case "quiz":
      return sendQuiz(chat.id, locale);
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
      return reply(settingsText(locale, link), {
        reply_markup: settingsKeyboard(locale, link),
      });
    default:
      return reply(
        helpText(locale, { linked: Boolean(link), siteUrl, bot: BOT_USERNAME }),
      );
  }
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

async function sendQuiz(chatId: number, locale: BotLocale) {
  const quizzes = getPollQuizzes();
  const pick = quizzes[Math.floor(Math.random() * quizzes.length)];
  if (!pick) return;
  const quiz = pick[locale];
  await telegram("sendPoll", {
    chat_id: chatId,
    question: quiz.question,
    options: quiz.options.map((text) => ({ text })),
    type: "quiz",
    correct_option_id: quiz.answer,
    explanation: clipExplanation(quiz.explanation),
    is_anonymous: false,
  });
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
  return randomText(locale, {
    language,
    name: getLanguage(language)?.name ?? language,
    difficulty: problem.difficulty,
    title: problem.title,
    url: url(problem.permalink, locale),
  });
}

async function streak(link: TelegramLink) {
  const { streak, ...status } = await getStreakStatus(
    link.userId,
    link.timeZone,
  );
  return streakText(link.locale as BotLocale, {
    ...status,
    current: streak.current,
    longest: streak.longest,
    activeToday: streak.activeToday,
  });
}

async function onButton(query: NonNullable<Update["callback_query"]>) {
  const link = await getLinkByTelegramId(query.from.id);
  const message = query.message;
  if (!link || !message) {
    return telegram("answerCallbackQuery", { callback_query_id: query.id });
  }
  const locale = link.locale as BotLocale;
  if (query.data === "unlink") {
    await unlinkTelegram(query.from.id);
    await telegram("editMessageText", {
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: unlinkedText(locale),
    });
  } else if (
    query.data === "toggle:reminders" ||
    query.data === "toggle:leaderboard"
  ) {
    const option =
      query.data === "toggle:reminders" ? "reminders" : "leaderboard";
    const settings = { ...link, [option]: !link[option] };
    await setLinkOption(link.userId, option, settings[option]);
    await telegram("editMessageText", {
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: settingsText(locale, settings),
      parse_mode: "HTML",
      reply_markup: settingsKeyboard(locale, settings),
    });
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
