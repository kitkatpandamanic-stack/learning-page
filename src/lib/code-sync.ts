/**
 * Code saved to the learner's account: each exercise editor (and the
 * playground) keeps its code in this browser, and signed-in learners also
 * get it on the server, so it follows them to other devices. Shared by the
 * editor and the server; no server imports.
 */

/** Longest code saved per editor (characters). */
export const MAX_SAVED_CODE = 100_000;

/** Editors whose code is saved: lesson and problem exercises, the playground. */
export function isValidStorageId(id: string) {
  return /^(exercise-[1-9]\d{0,3}|playground-[a-z]+)$/.test(id);
}

/** One editor's code: null means the starter code (never edited, or reset). */
export type SavedCode = { code: string | null; editedAt: number };

/**
 * Which copy an editor opens with: the one edited last. `upload` when this
 * browser's copy is newer than the account's (edited while signed out or
 * offline); `keepLocal` when the account's copy should replace this one.
 */
export function chooseCode(
  local: SavedCode,
  remote: SavedCode | null | undefined,
) {
  if (remote === undefined) {
    // The account couldn't be reached: carry on with this browser's copy.
    return { code: local.code, upload: false, keepLocal: false };
  }
  if (remote === null || local.editedAt > remote.editedAt) {
    const edited = local.code !== null || local.editedAt > 0;
    return {
      code: local.code,
      upload: edited && local.code !== remote?.code,
      keepLocal: false,
    };
  }
  return {
    code: remote.code,
    upload: false,
    keepLocal: remote.code !== local.code || remote.editedAt !== local.editedAt,
  };
}
