/**
 * The book library's catalog format (written by the book-library repo's sync
 * workflow) and how course pages arrange it. No server imports, so it can be
 * tested on its own; reading the catalog from storage is in library.ts.
 */

import type { Locale } from "@/lib/i18n";
import type { LevelNumber } from "@/lib/levels";

export const LIBRARY_LEVELS = [
  "beginner",
  "junior",
  "middle",
  "senior",
] as const;
export type LibraryLevel = (typeof LIBRARY_LEVELS)[number];

export const LIBRARY_TYPES = [
  "book",
  "slides",
  "notes",
  "exercises",
  "video",
  "article",
  "website",
] as const;
export type LibraryType = (typeof LIBRARY_TYPES)[number];

export type LibraryItem = {
  id: string;
  title: string;
  author?: string;
  type: string;
  level?: string;
  lang?: string;
  /** Path in the storage bucket, served through /api/library/… */
  file?: string;
  /** Outside link (videos, articles, websites) */
  url?: string;
  size?: number;
  added?: string;
};

export type LibraryCourse = {
  slug: string;
  title: string;
  description: string;
  items: LibraryItem[];
};

export type Catalog = {
  generated?: string;
  courses: LibraryCourse[];
  shared: LibraryItem[];
};

/** The catalog's level names on the site's 0–3 ladder. */
export const levelNumber: Record<LibraryLevel, LevelNumber> = {
  beginner: 0,
  junior: 1,
  middle: 2,
  senior: 3,
};

export function isLibraryLevel(value: unknown): value is LibraryLevel {
  return (LIBRARY_LEVELS as readonly unknown[]).includes(value);
}

export function isLibraryType(value: unknown): value is LibraryType {
  return (LIBRARY_TYPES as readonly unknown[]).includes(value);
}

/** A catalog read from storage, checked enough that pages can't crash on it. */
export function parseCatalog(value: unknown): Catalog {
  const data = (value ?? {}) as Partial<Catalog>;
  const items = (list: unknown) =>
    Array.isArray(list)
      ? (list as LibraryItem[]).filter(
          (i) =>
            i &&
            typeof i.id === "string" &&
            typeof i.title === "string" &&
            (typeof i.file === "string" || typeof i.url === "string"),
        )
      : [];
  return {
    generated: typeof data.generated === "string" ? data.generated : undefined,
    courses: Array.isArray(data.courses)
      ? data.courses
          .filter((c) => c && typeof c.slug === "string")
          .map((c) => ({
            slug: c.slug,
            title: typeof c.title === "string" ? c.title : c.slug,
            description: typeof c.description === "string" ? c.description : "",
            items: items(c.items),
          }))
      : [],
    shared: items(data.shared),
  };
}

/** True when `file` is one of the catalog's files (only those may be opened). */
export function catalogHasFile(catalog: Catalog, file: string) {
  return [...catalog.shared, ...catalog.courses.flatMap((c) => c.items)].some(
    (i) => i.file === file,
  );
}

export type LibraryGroup = {
  /** null: items without a level, shown last */
  level: LibraryLevel | null;
  items: LibraryItem[];
};

/**
 * Items grouped by level (beginner first), each group with the page's
 * language first, then the other language, keeping the catalog's order.
 */
export function groupLibrary(items: LibraryItem[], locale: Locale) {
  const rank = (i: LibraryItem) => (i.lang === locale ? 0 : i.lang ? 1 : 2);
  const sorted = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
    .map((x) => x.item);

  const groups: LibraryGroup[] = [...LIBRARY_LEVELS, null].map((level) => ({
    level,
    items: sorted.filter((i) =>
      level ? i.level === level : !isLibraryLevel(i.level),
    ),
  }));
  return groups.filter((g) => g.items.length > 0);
}

/** Where an item opens: our signed-link route for files, else its own https link. */
export function libraryHref(item: LibraryItem): string | null {
  if (item.file) {
    return `/api/library/${item.file.split("/").map(encodeURIComponent).join("/")}`;
  }
  if (item.url) {
    try {
      const url = new URL(item.url);
      return url.protocol === "https:" || url.protocol === "http:"
        ? url.href
        : null;
    } catch {
      return null;
    }
  }
  return null;
}
