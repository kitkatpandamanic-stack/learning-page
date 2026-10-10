import "server-only";

import { getLanguage } from "@/lib/content";
import { dailyIndex, dailyProblem } from "@/lib/daily";
import { localizedPath, type Locale } from "@/lib/i18n";
import { getCatalog } from "@/lib/learning";
import { getDailyCandidates, getPracticeLanguages } from "@/lib/practice";
import { siteUrl } from "@/lib/site";

/** Telegram's limits for a quiz poll. */
const POLL = { question: 300, option: 100, explanation: 200, options: 10 };

const fitsPoll = (quiz: { question: string; options: string[] }) =>
  quiz.question.length <= POLL.question &&
  quiz.options.length >= 2 &&
  quiz.options.length <= POLL.options &&
  quiz.options.every((o) => o.length <= POLL.option);

const link = (path: string, locale: Locale) =>
  `${siteUrl}${localizedPath(path, locale)}`;

type Quiz = {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
};
type PollQuiz = { permalink: string; en: Quiz; ru: Quiz };
let pollQuizzes: PollQuiz[] | undefined;

/** Every lesson quiz that fits in a Telegram poll in both languages. */
export function getPollQuizzes() {
  if (pollQuizzes) return pollQuizzes;
  const en = getCatalog("en");
  const ru = getCatalog("ru");
  pollQuizzes = [...en.quizzes].flatMap(([permalink, list]) =>
    list.flatMap((quiz, i) => {
      const translated = ru.quizzes.get(permalink)?.[i] ?? quiz;
      return fitsPoll(quiz) && fitsPoll(translated)
        ? [{ permalink, en: quiz, ru: translated }]
        : [];
    }),
  );
  return pollQuizzes;
}

/** A poll's explanation: whole sentences when they fit, else whole words. */
export function clipExplanation(text?: string) {
  if (!text || text.length <= POLL.explanation) return text;
  const cut = text.slice(0, POLL.explanation);
  const sentence = cut.lastIndexOf(". ");
  return sentence > 60
    ? cut.slice(0, sentence + 1)
    : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * One day's problems and quiz question in English and Russian, for posts
 * outside the site (the Telegram channel). Same picks as the site itself.
 */
export function getDailyFeed(day: string) {
  const problems = getPracticeLanguages().flatMap((language) => {
    const en = dailyProblem(day, language, getDailyCandidates(language, "en"));
    const ru = dailyProblem(day, language, getDailyCandidates(language, "ru"));
    if (!en || !ru) return [];
    return [
      {
        language,
        name: getLanguage(language)?.name ?? language,
        difficulty: en.difficulty,
        en: { title: en.title, url: link(en.permalink, "en") },
        ru: { title: ru.title, url: link(ru.permalink, "ru") },
      },
    ];
  });

  const en = getCatalog("en");
  const ru = getCatalog("ru");
  const quizzes = getPollQuizzes();
  const pick = quizzes[dailyIndex(day, "quiz", quizzes.length)];
  const quiz = pick && {
    lesson: {
      en: {
        title: en.pages.get(pick.permalink)!.title,
        url: link(pick.permalink, "en"),
      },
      ru: {
        title: ru.pages.get(pick.permalink)!.title,
        url: link(pick.permalink, "ru"),
      },
    },
    en: { ...pick.en, explanation: clipExplanation(pick.en.explanation) },
    ru: { ...pick.ru, explanation: clipExplanation(pick.ru.explanation) },
  };

  return { date: day, problems, quiz: quiz ?? null, quizCount: quizzes.length };
}
