// The daily post for the PandaDev Telegram channel, in Russian and English:
// a picture of the problems of the day with hint buttons, then the quiz
// question as two polls.
//
//   node scripts/telegram/post.mjs daily               send today's post
//   node scripts/telegram/post.mjs daily --preview     print it instead
//   node scripts/telegram/post.mjs daily --date=2026-10-12
//
// The site builds the post (/api/telegram/daily-post), so it always matches
// the problems of the day there.
//
// Normally the site sends the post itself (/api/telegram/cron?job=daily-post,
// once a day). Sending from here skips that once-a-day check: use --preview,
// or send by hand only when the scheduled post didn't go out.
import { CHAT, loadEnv, SITE, telegram, today } from "./lib.mjs";

loadEnv();
const args = process.argv.slice(2);
const mode = args.find((a) => !a.startsWith("--"));
const preview = args.includes("--preview");
const date = args.find((a) => a.startsWith("--date="))?.slice(7) ?? today();

if (mode !== "daily") {
  console.error(
    "Usage: node scripts/telegram/post.mjs daily [--preview] [--date=YYYY-MM-DD]",
  );
  process.exit(1);
}

const res = await fetch(`${SITE}/api/telegram/daily-post?date=${date}`);
if (!res.ok)
  throw new Error(`${SITE}/api/telegram/daily-post: HTTP ${res.status}`);
const post = await res.json();

const sends = [
  [
    "sendPhoto",
    {
      chat_id: CHAT,
      photo: post.photo,
      caption: post.caption,
      parse_mode: "HTML",
      reply_markup: post.reply_markup,
    },
  ],
  ...post.polls.map((poll) => ["sendPoll", { chat_id: CHAT, ...poll }]),
];

for (const [method, body] of sends) {
  if (preview) {
    console.log(`── ${method} ──`);
    if (method === "sendPhoto") {
      console.log(`[picture] ${body.photo}\n${body.caption}`);
      console.log(
        body.reply_markup.inline_keyboard
          .map((row) => row.map((b) => `[${b.text}]`).join(" "))
          .join("\n"),
      );
      console.log(
        `(${body.caption.replace(/<[^>]+>/g, "").length}/1024 characters)`,
      );
    } else {
      console.log(
        `${body.question}\n${body.options.map((o, i) => `${i === body.correct_option_id ? "✅" : "▫️"} ${o.text}`).join("\n")}\n💡 ${body.explanation ?? "(no explanation)"}`,
      );
    }
  } else {
    await telegram(method, body);
    console.log(`✓ ${method} sent to ${CHAT}`);
  }
}
