import "server-only";

import { randomBytes } from "node:crypto";
import { and, count, eq, gt, gte, lt } from "drizzle-orm";

import { db } from "@/db";
import { tgSnippet } from "@/db/schema";
import { RUN_MAX_CHARS } from "@/lib/telegram/run";
import { sandboxLanguages, type SandboxLanguage } from "@/lib/tg-app/sandbox";

/** How long a ▶ Run link works. */
export const SNIPPET_DAYS = 30;
/** Snippets one person can make in 24 hours (from /run and from sharing). */
export const SNIPPETS_PER_DAY = 30;

const DAY_MS = 86_400_000;

export type Snippet = typeof tgSnippet.$inferSelect;

/**
 * Saves code for a ▶ Run link. `language` is null when nobody has said it
 * yet (the bot then asks). Returns the snippet, or why it wasn't saved.
 */
export async function createSnippet(
  input: {
    author: { telegramId: number; name: string };
    senderTelegramId: number;
    language: SandboxLanguage | null;
    code: string;
  },
  now = new Date(),
): Promise<Snippet | { error: "empty" | "too-long" | "limit" }> {
  if (!input.code.trim()) return { error: "empty" };
  if (input.code.length > RUN_MAX_CHARS) return { error: "too-long" };
  const [{ today }] = await db
    .select({ today: count() })
    .from(tgSnippet)
    .where(
      and(
        eq(tgSnippet.senderTelegramId, input.senderTelegramId),
        gte(tgSnippet.createdAt, new Date(now.getTime() - DAY_MS)),
      ),
    );
  if (today >= SNIPPETS_PER_DAY) return { error: "limit" };
  const [snippet] = await db
    .insert(tgSnippet)
    .values({
      id: randomBytes(6).toString("base64url"),
      authorTelegramId: input.author.telegramId,
      authorName: input.author.name.trim().slice(0, 32) || "Panda",
      senderTelegramId: input.senderTelegramId,
      language: input.language ?? "",
      code: input.code,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SNIPPET_DAYS * DAY_MS),
    })
    .returning();
  return snippet;
}

/** A snippet whose link still works, or null. */
export async function getSnippet(id: string, now = new Date()) {
  if (!/^[\w-]{6,16}$/.test(id)) return null;
  const [snippet] = await db
    .select()
    .from(tgSnippet)
    .where(and(eq(tgSnippet.id, id), gt(tgSnippet.expiresAt, now)));
  return snippet ?? null;
}

/** The language picked with the bot's buttons; only whoever sent /run may pick. */
export async function setSnippetLanguage(
  id: string,
  telegramId: number,
  language: SandboxLanguage,
  now = new Date(),
): Promise<Snippet | { error: "missing" | "not-yours" }> {
  const snippet = await getSnippet(id, now);
  if (!snippet || !sandboxLanguages.includes(language))
    return { error: "missing" };
  if (snippet.senderTelegramId !== telegramId) return { error: "not-yours" };
  const [updated] = await db
    .update(tgSnippet)
    .set({ language })
    .where(eq(tgSnippet.id, id))
    .returning();
  return updated;
}

/** Links past their 30 days don't open any more: their code can go. */
export async function forgetOldSnippets(now = new Date()) {
  await db.delete(tgSnippet).where(lt(tgSnippet.expiresAt, now));
}
