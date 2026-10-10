"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { cn } from "cn";
import { CornerDownLeft, Hash, Loader2, SearchIcon, XIcon } from "lucide-react";

import { LanguageMonogram } from "@/components/languages/language-card";
import { Link, useRouter } from "@/i18n/navigation";
import { languages } from "@/lib/languages";
import {
  prepareIndex,
  search,
  type SearchEntry,
  type SearchResult,
} from "@/lib/search";

type Index = ReturnType<typeof prepareIndex>;

/** Each locale's index is downloaded once, the first time search opens. */
const indexes = new Map<string, Promise<Index>>();

export function loadSearchIndex(locale: string) {
  let index = indexes.get(locale);
  if (!index) {
    index = fetch(`/search/${locale}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<SearchEntry[]>;
      })
      .then(prepareIndex);
    // Let a failed download be retried.
    index.catch(() => indexes.delete(locale));
    indexes.set(locale, index);
  }
  return index;
}

/** Typing in a field or the code editor: "/" types a slash there. */
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * Search over every lesson, lesson section and practice problem. Opens with
 * ⌘K / Ctrl+K or "/", and from the navbar buttons.
 */
export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("search");
  const tp = useTranslations("practice");
  const locale = useLocale();
  const router = useRouter();
  const [index, setIndex] = React.useState<Index>();
  const [failed, setFailed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [language, setLanguage] = React.useState<string>();
  const [active, setActive] = React.useState(0);
  const changeQuery = (value: string) => {
    setQuery(value);
    setActive(0);
  };
  const changeLanguage = (value: string | undefined) => {
    setLanguage(value);
    setActive(0);
  };
  const listRef = React.useRef<HTMLUListElement>(null);
  const listId = React.useId();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      } else if (event.key === "/" && !open && !isTyping(event.target)) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const load = React.useCallback(() => {
    loadSearchIndex(locale).then(
      (loaded) => {
        setFailed(false);
        setIndex(loaded);
      },
      () => setFailed(true),
    );
  }, [locale]);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  const results: SearchResult[] = React.useMemo(
    () => (index ? search(index, query, { language }) : []),
    [index, query, language],
  );

  // Languages that have something to find, in the catalogue's order.
  const filters = React.useMemo(
    () =>
      languages.filter((l) => index?.some((i) => i.entry.language === l.slug)),
    [index],
  );

  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const hrefOf = (result: SearchResult) =>
    result.section
      ? `${result.entry.url}${result.section.url}`
      : result.entry.url;

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      router.push(hrefOf(results[active]));
      onOpenChange(false);
    }
  };

  const trimmed = query.trim();
  const examples = t("examples").split(/,\s*/);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-space-950/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-4 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl text-white glass-strong sm:top-[12vh] sm:max-h-[76vh] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0"
        >
          <Dialog.Title className="sr-only">{t("title")}</Dialog.Title>
          <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4">
            <SearchIcon aria-hidden className="size-5 shrink-0 text-white/50" />
            <input
              autoFocus
              type="search"
              role="combobox"
              aria-label={t("title")}
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                results.length ? `${listId}-${active}` : undefined
              }
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={t("placeholder")}
              enterKeyHint="go"
              spellCheck={false}
              autoComplete="off"
              className="h-14 min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            <Dialog.Close className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <XIcon className="size-4" />
              <span className="sr-only">{t("keys.close")}</span>
            </Dialog.Close>
          </div>

          {filters.length > 1 && (
            <div
              role="group"
              aria-label={t("filter")}
              className="flex shrink-0 [scrollbar-width:none] gap-1.5 overflow-x-auto border-b border-white/10 px-4 py-2.5 [&::-webkit-scrollbar]:hidden"
            >
              {[undefined, ...filters].map((l) => (
                <button
                  key={l?.slug ?? "all"}
                  type="button"
                  aria-pressed={language === l?.slug}
                  onClick={() => changeLanguage(l?.slug)}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white/60 ring-1 ring-white/10 transition-colors hover:bg-white/8 hover:text-white aria-pressed:bg-white/12 aria-pressed:text-white aria-pressed:ring-white/25"
                >
                  {l?.name ?? t("all")}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {failed ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-white/70">
                <p>{t("error")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setFailed(false);
                    load();
                  }}
                  className="rounded-full px-4 py-1.5 font-medium text-violet-300 ring-1 ring-violet-300/40 hover:bg-violet-300/10"
                >
                  {t("retry")}
                </button>
              </div>
            ) : !index ? (
              <p className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-white/60">
                <Loader2 className="size-4 animate-spin" /> {t("loading")}
              </p>
            ) : !trimmed ? (
              <div className="flex flex-wrap items-center gap-2 px-4 py-5 text-sm">
                <span className="text-white/50">{t("suggestions")}:</span>
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => changeQuery(example)}
                    className="rounded-full bg-white/6 px-3 py-1 font-mono text-xs text-cyan-200 ring-1 ring-white/10 hover:bg-white/12"
                  >
                    {example}
                  </button>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm">
                <p className="text-white/80">
                  {t("noResults", { query: trimmed })}
                </p>
                <p className="mt-1 text-white/50">{t("noResultsHint")}</p>
              </div>
            ) : (
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={t("title")}
                className="flex flex-col gap-0.5 p-2"
              >
                {results.map((result, i) => {
                  const { entry, section } = result;
                  const lang = languages.find((l) => l.slug === entry.language);
                  return (
                    <li
                      key={`${entry.url}${section?.url ?? ""}`}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                    >
                      <Link
                        href={hrefOf(result)}
                        tabIndex={-1}
                        onClick={() => onOpenChange(false)}
                        onMouseMove={() => setActive(i)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                          i === active && "bg-white/10",
                        )}
                      >
                        {lang && (
                          <LanguageMonogram
                            language={lang}
                            className="mt-0.5 size-9 shrink-0 rounded-lg text-xs"
                          />
                        )}
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex min-w-0 flex-col font-semibold text-white sm:flex-row sm:items-center sm:gap-1.5">
                            <span className="truncate">{entry.title}</span>
                            {section && (
                              <span className="flex min-w-0 items-center gap-1 font-normal text-cyan-200">
                                <Hash className="size-3.5 shrink-0" />
                                <span className="truncate">
                                  {section.title}
                                </span>
                              </span>
                            )}
                          </span>
                          <span className="truncate text-xs text-white/50">
                            {entry.kind === "lesson"
                              ? `${t("lesson")} · ${entry.context}`
                              : `${t("problem")} · ${tp(`difficulty.${entry.context as "easy" | "medium" | "hard"}`)}`}
                            {" · "}
                            {entry.description}
                          </span>
                        </span>
                        {i === active && (
                          <CornerDownLeft
                            aria-hidden
                            className="mt-2.5 hidden size-4 shrink-0 text-white/40 sm:block"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p aria-live="polite" className="sr-only">
            {index && trimmed
              ? t("resultCount", { count: results.length })
              : ""}
          </p>
          <div className="hidden shrink-0 items-center gap-4 border-t border-white/10 px-4 py-2.5 text-xs text-white/45 sm:flex">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> {t("keys.move")}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Enter</Kbd> {t("keys.open")}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Esc</Kbd> {t("keys.close")}
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "rounded-md bg-white/8 px-1.5 py-0.5 font-sans text-[0.7rem] font-medium text-white/70 ring-1 ring-white/15",
        className,
      )}
      {...props}
    />
  );
}
