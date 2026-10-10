// Points @panda_learning_bot at the site, so it answers messages, and sets
// its command menu and description (EN + RU). Reads TELEGRAM_BOT_TOKEN and
// TELEGRAM_WEBHOOK_SECRET from .env.local and never prints them.
//   node scripts/telegram/set-webhook.mjs          set everything up
//   node scripts/telegram/set-webhook.mjs --check  show the webhook's status
import { loadEnv, SITE, telegram } from "./lib.mjs";

loadEnv();

const commands = {
  en: [
    ["today", "Problem of the day"],
    ["quiz", "A quiz question from the lessons"],
    ["random", "A random practice problem (add python, js, ts or sql)"],
    ["streak", "Your streak and XP"],
    ["next", "Where you left off"],
    ["settings", "Reminders and the weekly leaderboard"],
    ["help", "What the bot can do"],
  ],
  ru: [
    ["today", "Задача дня"],
    ["quiz", "Вопрос из уроков"],
    ["random", "Случайная задача (python, js, ts или sql)"],
    ["streak", "Ваша серия и XP"],
    ["next", "Где вы остановились"],
    ["settings", "Напоминания и рейтинг недели"],
    ["help", "Что умеет бот"],
  ],
};

const about = {
  en: {
    short:
      "Learn to code a few minutes a day: problem of the day, quizzes, streaks. pandadev-chi.vercel.app",
    long: "🐼 PandaDev's bot: the problem of the day, quiz questions, random practice problems, your streak and an evening reminder. Free. Connect your account on your PandaDev profile.",
  },
  ru: {
    short:
      "Учитесь программировать по паре минут в день: задача дня, квизы, серии. pandadev-chi.vercel.app",
    long: "🐼 Бот PandaDev: задача дня, вопросы-квизы, случайные задачи, ваша серия и вечернее напоминание. Бесплатно. Подключите аккаунт в профиле на PandaDev.",
  },
};

if (process.argv.includes("--check")) {
  const info = await telegram("getWebhookInfo", {});
  console.log({
    url: info.url,
    pending: info.pending_update_count,
    lastError: info.last_error_message ?? null,
    lastErrorAt: info.last_error_date
      ? new Date(info.last_error_date * 1000).toISOString()
      : null,
  });
} else {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("TELEGRAM_WEBHOOK_SECRET isn't in .env.local yet.");
    process.exit(1);
  }
  await telegram("setWebhook", {
    url: `${SITE}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query", "inline_query"],
    drop_pending_updates: true,
  });
  console.log(`✓ webhook → ${SITE}/api/telegram/webhook`);
  for (const [lang, list] of Object.entries(commands)) {
    const scope = lang === "en" ? {} : { language_code: lang };
    const mapped = list.map(([command, description]) => ({
      command,
      description,
    }));
    await telegram("setMyCommands", { commands: mapped, ...scope });
    await telegram("setMyShortDescription", {
      short_description: about[lang].short,
      ...scope,
    });
    await telegram("setMyDescription", {
      description: about[lang].long,
      ...scope,
    });
  }
  console.log("✓ commands and description (EN + RU)");
}
