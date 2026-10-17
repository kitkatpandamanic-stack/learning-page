/**
 * What the Telegram Mini App says, in English and Russian. The app picks the
 * language from the linked account or the Telegram app, not from the URL,
 * so its texts live here rather than in messages/. No server imports.
 */
import type { OutfitId, PandaMood } from "@/lib/tg-app/panda";

export type AppLocale = "en" | "ru";

export const languageNames: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  sql: "SQL",
};

function ruPlural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const en = {
  loading: "Waking up the panda…",
  openInTelegram: "PandaDev's Mini App opens inside Telegram.",
  openBot: "Open @{bot}",
  failed:
    "Something went wrong. Pull down to reload, or try again in a minute.",
  tabs: { panda: "Panda", blitz: "Blitz" },
  hello: (name: string) => `Hi, ${name}!`,
  mood: {
    proud: "Today's goal is done. Your panda is proud of you!",
    happy: "You practised today. Your panda is happy.",
    worried: "Your streak is waiting for today's practice.",
    sleepy: "Your panda is napping. One exercise wakes it up.",
  } satisfies Record<PandaMood, string>,
  level: (n: number) => `Level ${n}`,
  days: (n: number) => `${n} ${n === 1 ? "day" : "days"}`,
  streak: "Streak",
  best: "Best",
  today: "Today",
  freezes: "Freezes",
  quizStreak: "Quiz streak",
  wardrobe: "Wardrobe",
  wardrobeHint:
    "Achievements unlock things to wear. Tap one to put it on or take it off.",
  locked: "Locked",
  outfits: {
    crown: "Crown · Earn 500 XP",
    cap: "Graduation cap · Finish a course level",
    headphones: "Headphones · Solve 10 exercises",
    headband: "Headband · 3 days in a row",
    glasses: "Glasses · Solve your first exercise",
    scarf: "Scarf · Finish a module",
    bowtie: "Bow tie · Complete 5 lessons",
  } satisfies Record<OutfitId, string>,
  sharePanda: "Share my panda",
  guestTitle: "Meet your panda",
  guestText:
    "Connect your PandaDev account and your panda grows with your level, keeps your streak and wears what you earn. Blitz works without an account too.",
  connect: "Connect my account",
  blitzTitle: (n: number) => `Daily Blitz #${n}`,
  blitzIntro: `10 questions from the lessons, 60 seconds, one try a day. Everyone gets the same questions.`,
  blitzXp: "+2 XP for each right answer, for your first Blitz today.",
  blitzNoXp:
    "Today's Blitz XP is already yours; your score still counts in the ranking.",
  blitzGuest: "Connect your account to get XP for the Blitz.",
  play: "Start",
  resume: "Continue",
  seeResult: "See result",
  doneToday: (score: number) => `${score}/10 today`,
  question: (i: number, n: number) => `Question ${i} of ${n}`,
  timeUp: "Time's up!",
  result: (score: number, size: number) => `${score}/${size}`,
  seconds: (ms: number) => `${Math.round(ms / 1000)} s`,
  place: (rank: number, total: number) => `#${rank} of ${total} today`,
  xpEarned: (xp: number) => `+${xp} XP`,
  topToday: "Today's top",
  anonymous: "Panda",
  you: "you",
  shareChat: "Share to a chat",
  shareStory: "Post to Story",
  review: "Answers",
  yourAnswer: "Your answer",
  rightAnswer: "Right answer",
  noAnswer: "No answer",
  back: "Back",
  comeBack: "A new Blitz comes tomorrow.",
  otherLanguage: "Try another language",
  shareCaption: (text: string) => `${text}\n\nCan you beat it?`,
  shareButton: "Play the Blitz",
  storyText: "My Daily Blitz on PandaDev",
};

type Texts = typeof en;

const ru: Texts = {
  loading: "Будим панду…",
  openInTelegram: "Мини-приложение PandaDev открывается внутри Telegram.",
  openBot: "Открыть @{bot}",
  failed:
    "Что-то пошло не так. Потяните вниз, чтобы обновить, или попробуйте через минуту.",
  tabs: { panda: "Панда", blitz: "Блиц" },
  hello: (name) => `Привет, ${name}!`,
  mood: {
    proud: "Цель на сегодня выполнена. Панда вами гордится!",
    happy: "Сегодня вы уже занимались. Панда довольна.",
    worried: "Серия ждёт сегодняшнего занятия.",
    sleepy: "Панда дремлет. Одно упражнение её разбудит.",
  },
  level: (n) => `Уровень ${n}`,
  days: (n) => `${n} ${ruPlural(n, "день", "дня", "дней")}`,
  streak: "Серия",
  best: "Рекорд",
  today: "Сегодня",
  freezes: "Заморозки",
  quizStreak: "Серия квизов",
  wardrobe: "Гардероб",
  wardrobeHint: "Достижения открывают вещи. Нажмите, чтобы надеть или снять.",
  locked: "Закрыто",
  outfits: {
    crown: "Корона · Наберите 500 XP",
    cap: "Шапочка выпускника · Пройдите уровень курса",
    headphones: "Наушники · Решите 10 упражнений",
    headband: "Повязка · 3 дня подряд",
    glasses: "Очки · Решите первое упражнение",
    scarf: "Шарф · Пройдите модуль",
    bowtie: "Бабочка · Пройдите 5 уроков",
  },
  sharePanda: "Поделиться пандой",
  guestTitle: "Знакомьтесь, ваша панда",
  guestText:
    "Подключите аккаунт PandaDev, и панда будет расти с вашим уровнем, следить за серией и носить то, что вы заработали. Блиц работает и без аккаунта.",
  connect: "Подключить аккаунт",
  blitzTitle: (n) => `Блиц дня #${n}`,
  blitzIntro:
    "10 вопросов из уроков, 60 секунд, одна попытка в день. У всех одни и те же вопросы.",
  blitzXp: "+2 XP за каждый верный ответ в первом блице за день.",
  blitzNoXp:
    "XP за блиц сегодня уже получены; результат всё равно попадёт в рейтинг.",
  blitzGuest: "Подключите аккаунт, чтобы получать XP за блиц.",
  play: "Начать",
  resume: "Продолжить",
  seeResult: "Результат",
  doneToday: (score) => `${score}/10 сегодня`,
  question: (i, n) => `Вопрос ${i} из ${n}`,
  timeUp: "Время вышло!",
  result: (score, size) => `${score}/${size}`,
  seconds: (ms) => `${Math.round(ms / 1000)} с`,
  place: (rank, total) => `#${rank} из ${total} сегодня`,
  xpEarned: (xp) => `+${xp} XP`,
  topToday: "Лучшие сегодня",
  anonymous: "Панда",
  you: "вы",
  shareChat: "Отправить в чат",
  shareStory: "В историю",
  review: "Ответы",
  yourAnswer: "Ваш ответ",
  rightAnswer: "Верный ответ",
  noAnswer: "Нет ответа",
  back: "Назад",
  comeBack: "Новый блиц завтра.",
  otherLanguage: "Попробуйте другой язык",
  shareCaption: (text) => `${text}\n\nСможете лучше?`,
  shareButton: "Сыграть в блиц",
  storyText: "Мой блиц дня на PandaDev",
};

export const appTexts: Record<AppLocale, Texts> = { en, ru };

/** "⚡ PandaDev Blitz #3 · Python\n🟩🟩🟥…\n8/10 · 41 s": the result to share. */
export function blitzShareText(
  locale: AppLocale,
  r: {
    number: number;
    language: string;
    grid: boolean[];
    size: number;
    ms: number;
  },
) {
  const t = appTexts[locale];
  const score = r.grid.filter(Boolean).length;
  const cells = Array.from({ length: r.size }, (_, i) =>
    r.grid[i] === true ? "🟩" : r.grid[i] === false ? "🟥" : "⬜",
  ).join("");
  const name = languageNames[r.language] ?? r.language;
  const title = locale === "ru" ? "Блиц PandaDev" : "PandaDev Blitz";
  return `⚡ ${title} #${r.number} · ${name}\n${cells}\n${t.result(score, r.size)} · ${t.seconds(r.ms)}`;
}
