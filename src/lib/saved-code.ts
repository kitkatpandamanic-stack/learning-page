import "server-only";

import { and, count, eq, like, sql } from "drizzle-orm";

import { db } from "@/db";
import { savedCode } from "@/db/schema";
import {
  isValidStorageId,
  MAX_SAVED_CODE,
  type SavedCode,
} from "@/lib/code-sync";
import { locales, type Locale } from "@/lib/i18n";
import { isPage } from "@/lib/learning";

/** Editors one learner can keep code for (every exercise is about 1,000). */
const MAX_EDITORS = 3000;

/** "en:/learn/python/loops#exercise-1", or null when any part is unknown. */
export function codeKey(locale: string, path: string, storageId: string) {
  const known =
    (locales as readonly string[]).includes(locale) &&
    (path === "/playground" || isPage(path)) &&
    isValidStorageId(storageId);
  return known ? `${locale}:${path}#${storageId}` : null;
}

/** Every editor's saved code on one page, by editor id. */
export async function getSavedCode(
  userId: string,
  locale: Locale,
  path: string,
) {
  const prefix = `${locale}:${path}#`;
  const rows = await db
    .select({
      key: savedCode.key,
      code: savedCode.code,
      editedAt: savedCode.editedAt,
    })
    .from(savedCode)
    .where(
      and(eq(savedCode.userId, userId), like(savedCode.key, `${prefix}%`)),
    );
  return Object.fromEntries(
    rows.map((r): [string, SavedCode] => [
      r.key.slice(prefix.length),
      { code: r.code, editedAt: r.editedAt.getTime() },
    ]),
  );
}

/**
 * Saves one editor's code (null = reset). An edit older than the saved one
 * (from a device that was offline) doesn't overwrite it. Returns false when
 * refused: too long, or too many editors.
 */
export async function putSavedCode(
  userId: string,
  key: string,
  code: string | null,
  editedAt: number,
) {
  if (code !== null && code.length > MAX_SAVED_CODE) return false;
  // A device clock running fast can't push its edits into the future.
  const at = new Date(Math.min(editedAt, Date.now()));
  const [existing] = await db
    .select({ n: count() })
    .from(savedCode)
    .where(eq(savedCode.userId, userId));
  if (existing.n >= MAX_EDITORS) {
    const [same] = await db
      .select({ key: savedCode.key })
      .from(savedCode)
      .where(and(eq(savedCode.userId, userId), eq(savedCode.key, key)));
    if (!same) return false;
  }
  await db
    .insert(savedCode)
    .values({ userId, key, code, editedAt: at })
    .onConflictDoUpdate({
      target: [savedCode.userId, savedCode.key],
      set: { code, editedAt: at, updatedAt: sql`now()` },
      setWhere: sql`${savedCode.editedAt} <= ${at}`,
    });
  return true;
}
