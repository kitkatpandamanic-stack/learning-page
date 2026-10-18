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
  tabs: {
    panda: "Panda",
    blitz: "Blitz",
    duel: "Duel",
    wordle: "Wordle",
    league: "Leagues",
  },
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
  duelTitle: "Duels",
  duelIntro:
    "Play 5 questions in 30 seconds, then send the challenge to a chat. Anyone who opens it plays the same questions.",
  duelXp: "+5 XP for each finished duel and +5 more for a win (3 duels a day).",
  duelGuest: "Connect your account to get XP for duels.",
  challenge: "⚔️ Challenge a friend",
  pickLanguage: "Pick a language:",
  challengedBy: (name: string, language: string) =>
    `${name} challenges you to a ${language} duel`,
  toBeat: (score: number, size: number, ms: number) =>
    `Score to beat: ${score}/${size} in ${Math.round(ms / 1000)} s`,
  accept: "Accept the challenge",
  duelEnded: "This duel has ended. Start your own!",
  duelNotReady:
    "The challenger hasn't finished playing yet. Try again in a minute.",
  duelMissing: "This duel can't be played any more. Start your own!",
  won: "You won! 🏆",
  lost: "Not this time. Rematch?",
  yourDuel: (language: string) => `Your ${language} challenge`,
  sendChallenge: "Send the challenge",
  duelRanking: "This duel's ranking",
  challengerMark: "challenger",
  recentDuels: "Your recent duels",
  players: (n: number) => `${n} ${n === 1 ? "player" : "players"}`,
  notFinished: "not finished",
  duelLimit: "That's a lot of duels for today. Come back tomorrow!",
  duelCaption: (
    name: string,
    language: string,
    score: number,
    size: number,
    ms: number,
  ) =>
    `⚔️ ${name} challenges you to a ${language} duel: ${score}/${size} in ${Math.round(ms / 1000)} s. Can you beat it?`,
  duelButton: "⚔️ Accept the duel",
  rematch: "Rematch",
  leagueTitle: "Group leagues",
  leagueIntro:
    "A weekly XP table for your study group or class chat. Add the bot to the group and send /league there; everyone joins with the button it posts.",
  addToGroup: "Add the bot to a group",
  joinLeague: (title: string) => `Join the ${title} league`,
  leagueMembers: (n: number) => `${n} ${n === 1 ? "member" : "members"} so far`,
  leagueCounts:
    "XP from lessons, practice, the Blitz and duels counts. Your Telegram first name is shown to the group.",
  join: "Join",
  leave: "Leave",
  thisWeek: "This week",
  noAccount: "no account yet",
  leagueGuest: "Connect your PandaDev account so your XP counts in the league.",
  wordleTitle: (n: number) => `Code Wordle #${n}`,
  wordleIntro: (length: number) =>
    `Guess today's ${length}-letter code word in 6 tries. Green: right letter, right place. Yellow: in the word, elsewhere. Grey: not in it.`,
  wordleXp: "+10 XP for solving it (once a day).",
  wordleGuest: "Connect your account to get XP for the Wordle.",
  wordleHint: "Clue",
  wordleHintLater: "A clue appears after 3 wrong guesses.",
  wordleSolved: (tries: number) => `Solved in ${tries}!`,
  wordleFailed: "Out of tries. The word was:",
  wordleTooShort: (length: number) => `The word has ${length} letters.`,
  enter: "Enter",
  wordleComeBack: "A new word comes tomorrow.",
  wordleMissed: "Not this time!",
  leagueNotFound:
    "This league link doesn't work any more. Ask in the group for a new one: /league.",
  duelStoryText: "Beat my score in a PandaDev duel!",
};

type Texts = typeof en;

const ru: Texts = {
  loading: "Будим панду…",
  openInTelegram: "Мини-приложение PandaDev открывается внутри Telegram.",
  openBot: "Открыть @{bot}",
  failed:
    "Что-то пошло не так. Потяните вниз, чтобы обновить, или попробуйте через минуту.",
  tabs: {
    panda: "Панда",
    blitz: "Блиц",
    duel: "Дуэль",
    wordle: "Wordle",
    league: "Лиги",
  },
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
  duelTitle: "Дуэли",
  duelIntro:
    "Ответьте на 5 вопросов за 30 секунд и отправьте вызов в чат. Каждый, кто его откроет, получит те же вопросы.",
  duelXp:
    "+5 XP за каждую сыгранную дуэль и ещё +5 за победу (3 дуэли в день).",
  duelGuest: "Подключите аккаунт, чтобы получать XP за дуэли.",
  challenge: "⚔️ Вызвать друга",
  pickLanguage: "Выберите язык:",
  challengedBy: (name, language) =>
    `${name} вызывает вас на дуэль по ${language}`,
  toBeat: (score, size, ms) =>
    `Нужно обойти: ${score}/${size} за ${Math.round(ms / 1000)} с`,
  accept: "Принять вызов",
  duelEnded: "Эта дуэль уже закончилась. Начните свою!",
  duelNotReady: "Соперник ещё не доиграл. Попробуйте через минуту.",
  duelMissing: "В эту дуэль больше нельзя сыграть. Начните свою!",
  won: "Вы победили! 🏆",
  lost: "Не в этот раз. Реванш?",
  yourDuel: (language) => `Ваш вызов по ${language}`,
  sendChallenge: "Отправить вызов",
  duelRanking: "Рейтинг этой дуэли",
  challengerMark: "соперник",
  recentDuels: "Ваши последние дуэли",
  players: (n) => `${n} ${ruPlural(n, "игрок", "игрока", "игроков")}`,
  notFinished: "не закончена",
  duelLimit: "На сегодня дуэлей достаточно. Возвращайтесь завтра!",
  duelCaption: (name, language, score, size, ms) =>
    `⚔️ ${name} вызывает вас на дуэль по ${language}: ${score}/${size} за ${Math.round(ms / 1000)} с. Сможете лучше?`,
  duelButton: "⚔️ Принять дуэль",
  rematch: "Реванш",
  leagueTitle: "Лиги групп",
  leagueIntro:
    "Рейтинг недели для вашей учебной группы или чата класса. Добавьте бота в группу и отправьте там /league; все вступают кнопкой из его сообщения.",
  addToGroup: "Добавить бота в группу",
  joinLeague: (title) => `Вступить в лигу «${title}»`,
  leagueMembers: (n) =>
    `Уже ${n} ${ruPlural(n, "участник", "участника", "участников")}`,
  leagueCounts:
    "Считаются XP за уроки, задачи, блиц и дуэли. Группа увидит ваше имя из Telegram.",
  join: "Вступить",
  leave: "Выйти",
  thisWeek: "Эта неделя",
  noAccount: "ещё без аккаунта",
  leagueGuest: "Подключите аккаунт PandaDev, чтобы ваши XP считались в лиге.",
  wordleTitle: (n) => `Code Wordle #${n}`,
  wordleIntro: (length) =>
    `Угадайте слово из кода (${length} ${ruPlural(length, "буква", "буквы", "букв")}) за 6 попыток. Зелёная: буква на своём месте. Жёлтая: есть в слове, но в другом месте. Серая: её нет.`,
  wordleXp: "+10 XP за отгаданное слово (раз в день).",
  wordleGuest: "Подключите аккаунт, чтобы получать XP за Wordle.",
  wordleHint: "Подсказка",
  wordleHintLater: "Подсказка появится после 3 неверных попыток.",
  wordleSolved: (tries) => `Отгадано с ${tries}-й попытки!`,
  wordleFailed: "Попытки кончились. Это было слово:",
  wordleTooShort: (length) =>
    `В слове ${length} ${ruPlural(length, "буква", "буквы", "букв")}.`,
  enter: "Ввод",
  wordleComeBack: "Новое слово завтра.",
  wordleMissed: "Не в этот раз!",
  leagueNotFound:
    "Эта ссылка на лигу больше не работает. Попросите в группе новую: /league.",
  duelStoryText: "Обойдите мой результат в дуэли PandaDev!",
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

/**
 * The bot's message to a challenger when a friend finishes their duel.
 * Plain text (names are the players' own Telegram names).
 */
export function duelNotice(
  locale: AppLocale,
  n: {
    name: string;
    language: string;
    size: number;
    them: { score: number; ms: number };
    you: { score: number; ms: number };
    theyWon: boolean;
    bonus: boolean;
  },
) {
  const lang = languageNames[n.language] ?? n.language;
  const sec = (ms: number) => Math.round(ms / 1000);
  if (locale === "ru")
    return `⚔️ ${n.name} сыграл(а) вашу дуэль по ${lang}: ${n.them.score}/${n.size} за ${sec(n.them.ms)} с, у вас ${n.you.score}/${n.size} за ${sec(n.you.ms)} с.\n${
      n.theyWon
        ? `Победа за ${n.name}. Реванш?`
        : `Вы удержали победу!${n.bonus ? " +5 XP" : ""}`
    }`;
  return `⚔️ ${n.name} played your ${lang} duel: ${n.them.score}/${n.size} in ${sec(n.them.ms)} s vs your ${n.you.score}/${n.size} in ${sec(n.you.ms)} s.\n${
    n.theyWon
      ? `${n.name} wins. Rematch?`
      : `You held on!${n.bonus ? " +5 XP" : ""}`
  }`;
}

/** "PandaDev Wordle #3 · Python 4/6" and the coloured rows, to share. */
export function wordleShareText(r: {
  number: number;
  language: string;
  rows: ("g" | "y" | "x")[][];
  solved: boolean;
  tries: number;
}) {
  const name = languageNames[r.language] ?? r.language;
  const squares = { g: "🟩", y: "🟨", x: "⬛" };
  return `🔤 PandaDev Wordle #${r.number} · ${name} ${r.solved ? r.rows.length : "X"}/${r.tries}\n${r.rows
    .map((row) => row.map((m) => squares[m]).join(""))
    .join("\n")}`;
}
