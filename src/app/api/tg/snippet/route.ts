import { playerName } from "@/lib/tg-app/duel";
import { miniAppCaller } from "@/lib/tg-app/player";
import { sandboxLanguages } from "@/lib/tg-app/sandbox";
import { appLink, prepareTextShare } from "@/lib/tg-app/share";
import { createSnippet, getSnippet } from "@/lib/tg-app/snippet";
import { runButton, runShareText } from "@/lib/telegram/run";
import { languageNames } from "@/lib/tg-app/texts";

/**
 * Code for the Code tab:
 *   { action: "get", id }                        code from a ▶ Run link
 *   { action: "share", language, code, output, from? }
 *       a message to send to a chat: the code, what it printed, ▶ Run.
 *       `from`: the snippet it was opened from, reused if the code is the same
 */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    id?: string;
    language?: string;
    code?: string;
    output?: unknown;
    from?: string;
  } | null;
  const { init, locale } = caller;

  if (body?.action === "get") {
    const snippet = await getSnippet(String(body.id ?? ""));
    if (!snippet) return Response.json(null);
    return Response.json({
      id: snippet.id,
      language: snippet.language,
      code: snippet.code,
      author: snippet.authorName,
      yours: snippet.authorTelegramId === init.user.id,
    });
  }

  if (body?.action === "share") {
    const language = sandboxLanguages.find((l) => l === body.language);
    const code = typeof body.code === "string" ? body.code : "";
    if (!language || !code.trim())
      return new Response("Bad request", { status: 400 });
    const output = Array.isArray(body.output)
      ? body.output.filter((line) => typeof line === "string").slice(0, 50)
      : [];
    const name = playerName(init.user.first_name);
    const opened = body.from ? await getSnippet(String(body.from)) : null;
    const snippet =
      opened && opened.code === code && opened.language === language
        ? opened
        : await createSnippet({
            author: { telegramId: init.user.id, name },
            senderTelegramId: init.user.id,
            language,
            code,
          });
    if ("error" in snippet)
      return Response.json({ error: snippet.error }, { status: 400 });
    const link = appLink(`run_${snippet.id}`);
    const text = runShareText(locale, {
      language,
      author: name,
      code,
      output,
    });
    let messageId: string | null = null;
    try {
      messageId = await prepareTextShare(
        init.user.id,
        `${languageNames[language]} · ${name}`,
        text,
        runButton(locale, link),
      );
    } catch (error) {
      // Older Telegram apps: the app falls back to a t.me/share link.
      console.error("prepared message failed", error);
    }
    return Response.json({
      messageId,
      link,
      text: `${languageNames[language]}: ${link}`,
    });
  }

  return new Response("Bad request", { status: 400 });
}
