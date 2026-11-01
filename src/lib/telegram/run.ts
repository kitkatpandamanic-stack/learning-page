/**
 * /run: code sent to the bot, to open in the Mini App's sandbox. Finding the
 * code and its language in a message, and the bot's words about it. No
 * server imports, so it's easy to test.
 */
import {
  escapeHtml,
  languageEmoji,
  languageFromArg,
  type BotLocale,
} from "@/lib/telegram/texts";
import { sandboxLanguages, type SandboxLanguage } from "@/lib/tg-app/sandbox";
import { languageNames } from "@/lib/tg-app/texts";

/** The longest code /run keeps (a Telegram message holds 4096 characters). */
export const RUN_MAX_CHARS = 4000;

/** A Telegram message entity: the parts of it /run reads. */
export type Entity = {
  type: string;
  offset: number;
  length: number;
  language?: string;
};

export type RunInput = {
  /** Empty when the message has none (e.g. "/run python" as a reply) */
  code: string;
  language: SandboxLanguage | null;
};

const sandboxLanguage = (word = ""): SandboxLanguage | null => {
  const slug = languageFromArg(word);
  return sandboxLanguages.find((l) => l === slug) ?? null;
};

/** Blank lines around the code go; the first line keeps its indent. */
const tidy = (code: string) => code.replace(/^\s*\n/, "").trimEnd();

/**
 * The code in a message and its language, when the message says it:
 *   - a code block (Telegram's ``` ```python … ``` ``` arrives as a "pre"
 *     entity, with its language when one was written)
 *   - ``` fences left as text by apps that don't turn them into a block
 *   - "/run py print(1)": a language word, then the code
 * `command`: the text starts with /run, which isn't code.
 */
export function parseRunCode(
  text: string,
  entities: Entity[] = [],
  command = true,
): RunInput {
  const head = command ? (/^\/\w+(?:@\w+)?/.exec(text)?.[0].length ?? 0) : 0;
  const block = entities.find((e) => e.type === "pre" && e.offset >= head);
  if (block) {
    // Telegram counts in UTF-16 code units, like JavaScript strings.
    const code = tidy(text.slice(block.offset, block.offset + block.length));
    const before = text.slice(head, block.offset).trim();
    return {
      code,
      language:
        sandboxLanguage(block.language) ??
        sandboxLanguage(before.split(/\s+/)[0]),
    };
  }
  const body = text.slice(head).trim();
  const fence = /^(\w*)\s*```([\w+-]*)[ \t]*\n?([\s\S]*?)```\s*$/.exec(body);
  if (fence)
    return {
      code: tidy(fence[3]),
      language: sandboxLanguage(fence[2]) ?? sandboxLanguage(fence[1]),
    };
  const [word] = body.split(/\s/, 1);
  const language = sandboxLanguage(word);
  if (language) return { code: tidy(body.slice(word.length)), language };
  return { code: tidy(body), language: null };
}

/** The first lines of the code, for a message; `cut` when there's more. */
export function codePreview(code: string, maxLines = 15, maxChars = 1200) {
  const lines = code.split("\n");
  let preview = lines.slice(0, maxLines).join("\n");
  if (preview.length > maxChars) preview = preview.slice(0, maxChars);
  return { preview, cut: preview.length < code.length };
}

const name = (language: SandboxLanguage) =>
  `${languageEmoji[language] ?? "💻"} ${languageNames[language]}`;

const pre = (code: string, language: SandboxLanguage) =>
  `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;

/** "▶ Run": opens the code in the sandbox (t.me/<bot>?startapp=run_<id>). */
export function runButton(locale: BotLocale, link: string) {
  return { text: locale === "ru" ? "▶ Запустить" : "▶ Run", url: link };
}

/** The bot's answer to /run: the code's first lines and a ▶ Run button. */
export function runMessage(
  locale: BotLocale,
  r: { language: SandboxLanguage; author: string; code: string; link: string },
) {
  const { preview, cut } = codePreview(r.code);
  const from = locale === "ru" ? "код от" : "code from";
  const more = cut ? "\n…" : "";
  const tap =
    locale === "ru"
      ? "Нажмите «Запустить»: код откроется в песочнице и выполнится на вашем телефоне."
      : "Tap Run to open it in the sandbox. It runs on your phone.";
  return {
    text: `<b>${name(r.language)}</b> · ${from} ${escapeHtml(r.author)}\n${pre(preview, r.language)}${more}\n${tap}`,
    reply_markup: { inline_keyboard: [[runButton(locale, r.link)]] },
  };
}

/** The language buttons, when /run couldn't tell: run:<id>:<language>. */
export function runPickMessage(locale: BotLocale, id: string) {
  return {
    text:
      locale === "ru"
        ? "На каком языке этот код?"
        : "Which language is this code in?",
    reply_markup: {
      inline_keyboard: [
        sandboxLanguages.map((language) => ({
          text: languageNames[language],
          callback_data: `run:${id}:${language}`,
        })),
      ],
    },
  };
}

/** "run:<id>:<language>" from a language button. */
export function parseRunButton(data?: string) {
  const match = /^run:([\w-]{6,16}):([a-z]+)$/.exec(data ?? "");
  const language = match && sandboxLanguages.find((l) => l === match[2]);
  return match && language ? { id: match[1], language } : null;
}

export function runUsageText(locale: BotLocale) {
  return locale === "ru"
    ? '💻 <b>/run</b> открывает код в песочнице, где он выполняется на вашем телефоне.\n\nОтправьте <code>/run</code>, а за ним код, лучше в блоке кода с языком:\n<pre>/run python\nprint("Привет!")</pre>\nВ группе ответьте <code>/run</code> на сообщение с кодом. Языки: Python, JavaScript, SQL, TypeScript.'
    : '💻 <b>/run</b> opens code in the sandbox, where it runs on your phone.\n\nSend <code>/run</code> followed by the code, best as a code block with its language:\n<pre>/run python\nprint("Hello!")</pre>\nIn a group, reply <code>/run</code> to a message with code. Languages: Python, JavaScript, SQL, TypeScript.';
}

export function runTooLongText(locale: BotLocale) {
  return locale === "ru"
    ? `Код слишком длинный: до ${RUN_MAX_CHARS} символов. Для большого кода откройте песочницу: /app.`
    : `That code is too long: up to ${RUN_MAX_CHARS} characters. For bigger code, open the sandbox: /app.`;
}

export function runLimitText(locale: BotLocale) {
  return locale === "ru"
    ? "На сегодня хватит запусков из чата. Песочница в /app работает без ограничений."
    : "That's enough code from chat for today. The sandbox in /app has no limit.";
}

/** The answer to a language button that can't be used. */
export function runPickRefusal(
  locale: BotLocale,
  reason: "missing" | "not-yours",
) {
  if (reason === "not-yours")
    return locale === "ru"
      ? "Язык выбирает тот, кто отправил /run."
      : "Only the person who sent /run can pick the language.";
  return locale === "ru"
    ? "Этого кода уже нет. Отправьте /run ещё раз."
    : "This code is gone. Send /run again.";
}

/**
 * A run shared from the sandbox: the code, what it printed, and ▶ Run.
 * Output comes from the sharer's phone; it's their message to send.
 */
export function runShareText(
  locale: BotLocale,
  r: {
    language: SandboxLanguage;
    author: string;
    code: string;
    output: string[];
  },
) {
  const { preview, cut } = codePreview(r.code, 15, 1500);
  const out = codePreview(r.output.join("\n"), 12, 700);
  const output = out.preview.trim()
    ? `\n${locale === "ru" ? "Вывод" : "Output"}:\n<pre>${escapeHtml(out.preview)}${out.cut ? "\n…" : ""}</pre>`
    : "";
  return `<b>${name(r.language)}</b> · ${escapeHtml(r.author)}\n${pre(preview, r.language)}${cut ? "\n…" : ""}${output}`;
}
