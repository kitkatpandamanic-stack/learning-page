// Daily posts for the PandaDev Telegram channel, in Russian and English:
//
//   node scripts/telegram/post.mjs morning   problem of the day (11:00 Tashkent)
//   node scripts/telegram/post.mjs quiz      quiz question as polls (16:00)
//   add --preview to print the posts instead of sending them,
//   and --date=2026-10-11 to post another day's picks.
//
// The picks come from the site (/api/daily), so they always match it.
import {
  CHAT,
  escapeHtml,
  loadEnv,
  SITE,
  telegram,
  TIME_ZONE,
  today,
} from "./lib.mjs";

loadEnv();
const args = process.argv.slice(2);
const mode = args.find((a) => !a.startsWith("--"));
const preview = args.includes("--preview");
const date = args.find((a) => a.startsWith("--date="))?.slice(7) ?? today();

const emoji = { python: "🐍", javascript: "🟨", typescript: "🔷", sql: "🗄" };
const difficulty = {
  ru: { easy: "лёгкая", medium: "средняя", hard: "сложная" },
  en: { easy: "easy", medium: "medium", hard: "hard" },
};

const day = (locale) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(new Date(`${date}T12:00:00Z`));

async function feed() {
  const res = await fetch(`${SITE}/api/daily?date=${date}`);
  if (!res.ok) throw new Error(`${SITE}/api/daily: HTTP ${res.status}`);
  return res.json();
}

const order = ["python", "javascript", "typescript", "sql"];

function morningPost(data) {
  const problems = [...data.problems].sort(
    (a, b) => order.indexOf(a.language) - order.indexOf(b.language),
  );
  const block = (locale, title, bonus) => [
    `🧩 <b>${title}</b> · ${day(locale)}`,
    bonus,
    "",
    ...problems.flatMap((p) => [
      `${emoji[p.language] ?? "💻"} <b>${p.name}</b> · ${difficulty[locale][p.difficulty]}`,
      `<a href="${p[locale].url}">${escapeHtml(p[locale].title)}</a>`,
    ]),
  ];
  return [
    ...block(
      "ru",
      "Задача дня",
      "Решите сегодня — получите <b>+20 XP</b> бонус на сайте.",
    ),
    "",
    "———",
    "",
    ...block(
      "en",
      "Problem of the day",
      "Solve one today for a <b>+20 XP</b> bonus on the site.",
    ),
    "",
    "#задачадня #problemoftheday",
  ].join("\n");
}

function quizIntro({ quiz }) {
  return [
    `❓ <b>Вопрос дня</b> · ${day("ru")} — из урока <a href="${quiz.lesson.ru.url}">«${escapeHtml(quiz.lesson.ru.title)}»</a>`,
    `❓ <b>Question of the day</b> · ${day("en")} — from <a href="${quiz.lesson.en.url}">“${escapeHtml(quiz.lesson.en.title)}”</a>`,
  ].join("\n");
}

function poll(quiz, flag) {
  const question = `${flag} ${quiz.question}`;
  return {
    chat_id: CHAT,
    type: "quiz",
    is_anonymous: true,
    question: question.length <= 300 ? question : quiz.question,
    options: quiz.options.map((text) => ({ text })),
    correct_option_id: quiz.answer,
    ...(quiz.explanation ? { explanation: quiz.explanation } : {}),
  };
}

const message = (text) => ({
  chat_id: CHAT,
  text,
  parse_mode: "HTML",
  link_preview_options: { is_disabled: true },
});

const data = await feed();
const sends =
  mode === "morning"
    ? [["sendMessage", message(morningPost(data))]]
    : mode === "quiz" && data.quiz
      ? [
          ["sendMessage", message(quizIntro(data))],
          ["sendPoll", poll(data.quiz.ru, "🇷🇺")],
          ["sendPoll", poll(data.quiz.en, "🇬🇧")],
        ]
      : null;
if (!sends) {
  console.error(
    "Usage: node scripts/telegram/post.mjs morning|quiz [--preview] [--date=YYYY-MM-DD]",
  );
  process.exit(1);
}

for (const [method, body] of sends) {
  if (preview) {
    console.log(`── ${method} ──`);
    console.log(
      method === "sendPoll"
        ? `${body.question}\n${body.options.map((o, i) => `${i === body.correct_option_id ? "✅" : "▫️"} ${o.text}`).join("\n")}\n💡 ${body.explanation ?? "(no explanation)"}`
        : body.text,
    );
  } else {
    await telegram(method, body);
    console.log(`✓ ${method} sent to ${CHAT}`);
  }
}
