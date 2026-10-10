"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { saveCode } from "@/app/actions/learning";
import { usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { chooseCode, isValidStorageId, type SavedCode } from "@/lib/code-sync";

export type SaveStatus = "saving" | "saved" | "error";

/** Wait this long after the last keystroke before saving to the account (ms). */
const SAVE_DELAY = 1200;

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the editor still works.
  }
}

/**
 * One editor's saved code: always in this browser, and in the learner's
 * account when they're signed in. `ready` turns true once both copies are
 * known; the editor then opens with `initialCode` (null = the starter).
 */
export function useCodeSync({
  storageId,
  starter,
}: {
  storageId?: string;
  starter: string;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session, isPending } = useSession();
  const signedIn = Boolean(session?.user);
  const synced = Boolean(storageId && isValidStorageId(storageId));

  // Each language keeps its own saved code (starters' comments differ).
  const storageKey = storageId
    ? `pandadev:code:${pathname}:${storageId}${locale === "en" ? "" : `:${locale}`}`
    : null;
  const editedKey = storageKey && `${storageKey}:edited`;

  const remote = useQuery({
    queryKey: ["saved-code", locale, pathname],
    enabled: synced && signedIn,
    staleTime: Infinity,
    queryFn: async (): Promise<Record<string, SavedCode>> => {
      const params = new URLSearchParams({ locale, path: pathname });
      const res = await fetch(`/api/code?${params}`);
      if (!res.ok) throw new Error("Could not load saved code");
      return (await res.json()).editors ?? {};
    },
  });

  const ready =
    !storageKey || (!isPending && (!signedIn || !synced || remote.isFetched));

  // Decided once, when the editor is about to open.
  const choice = React.useMemo(() => {
    if (!ready || !storageKey || !editedKey) return null;
    const local: SavedCode = {
      code: read(storageKey),
      editedAt: Number(read(editedKey) ?? 0) || 0,
    };
    const fromAccount =
      signedIn && synced
        ? remote.isSuccess
          ? (remote.data[storageId!] ?? null)
          : undefined
        : undefined;
    return { local, ...chooseCode(local, fromAccount), fromAccount };
    // Only the first ready state matters: the editor keeps its own code after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const [status, setStatus] = React.useState<SaveStatus | null>(null);
  const pending = React.useRef<{ code: string | null; at: number } | null>(
    null,
  );
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const flush = React.useCallback(async () => {
    clearTimeout(timer.current);
    const next = pending.current;
    if (!next || !storageId) return;
    pending.current = null;
    setStatus("saving");
    try {
      const result = await saveCode(
        locale,
        pathname,
        storageId,
        next.code,
        next.at,
      );
      setStatus(result.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }, [locale, pathname, storageId]);

  const queueSave = React.useCallback(
    (code: string | null, at: number, delay = SAVE_DELAY) => {
      pending.current = { code, at };
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush],
  );

  // Reconcile once: copy the account's newer code here, or upload this
  // browser's newer code (written while signed out or offline).
  React.useEffect(() => {
    if (!choice || !storageKey || !editedKey) return;
    if (choice.keepLocal && choice.fromAccount) {
      write(storageKey, choice.fromAccount.code);
      write(editedKey, String(choice.fromAccount.editedAt));
    }
    if (choice.upload && signedIn)
      queueSave(choice.code, choice.local.editedAt, 0);
  }, [choice, storageKey, editedKey, signedIn, queueSave]);

  // Don't lose the last edit when the tab is hidden or the page changes.
  React.useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush();
    };
  }, [flush]);

  /** Call on every edit; the starter itself is stored as "no code". */
  const record = React.useCallback(
    (code: string) => {
      if (!storageKey || !editedKey) return;
      const value = code === starter ? null : code;
      const at = Date.now();
      write(storageKey, value);
      write(editedKey, String(at));
      if (signedIn && synced) queueSave(value, at);
    },
    [storageKey, editedKey, starter, signedIn, synced, queueSave],
  );

  return {
    ready,
    initialCode: choice?.code ?? null,
    record,
    /** Only for signed-in learners: how saving to the account is going */
    status: signedIn && synced ? status : null,
  };
}
