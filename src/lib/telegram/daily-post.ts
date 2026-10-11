import "server-only";

import { dailyProblem } from "@/lib/daily";
import { getDailyFeed } from "@/lib/daily-feed";
import { getDailyCandidates } from "@/lib/practice";
import { siteUrl } from "@/lib/site";
import { BOT_USERNAME } from "@/lib/telegram/api";
import {
  dailyCaption,
  dailyKeyboard,
  type Audience,
  type BotLocale,
} from "@/lib/telegram/texts";

/**
 * A day's post: a picture of the problems, a caption with links, buttons for
 * hints, and (for the channel) the quiz question as two polls.
 */
export function dailyPost(day: string, audience: Audience) {
  const feed = getDailyFeed(day);
  const withQuiz = audience === "both" && feed.quiz !== null;
  const poll = (locale: BotLocale, flag: string) => {
    const quiz = feed.quiz![locale];
    const question = `${flag} ${quiz.question}`;
    return {
      type: "quiz",
      is_anonymous: true,
      question: question.length <= 300 ? question : quiz.question,
      options: quiz.options.map((text) => ({ text })),
      correct_option_id: quiz.answer,
      ...(quiz.explanation ? { explanation: quiz.explanation } : {}),
    };
  };
  return {
    date: day,
    photo: `${siteUrl}/api/telegram/daily-card?date=${day}&lang=${audience}`,
    caption: dailyCaption(audience, day, feed.problems, withQuiz),
    reply_markup: dailyKeyboard(audience, day, feed.problems, {
      siteUrl,
      bot: BOT_USERNAME,
    }),
    polls: withQuiz ? [poll("ru", "🇷🇺"), poll("en", "🇬🇧")] : [],
  };
}

/** The first hint (a nudge) of a language's problem of the day. */
export function dailyHint(language: string, day: string, locale: BotLocale) {
  return dailyProblem(day, language, getDailyCandidates(language, locale))
    ?.hint;
}
