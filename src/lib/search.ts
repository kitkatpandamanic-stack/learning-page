/**
 * Site search: lessons (and their sections) and practice problems. The index
 * is built at build time (src/app/search/[file]/route.ts, one JSON file per
 * locale) and searched in the browser, so it works offline and costs nothing
 * per query. This file has no server imports: the search dialog uses it too.
 */

export type SearchEntry = {
  kind: "lesson" | "problem";
  /** Without the locale prefix, e.g. /learn/python/loops */
  url: string;
  title: string;
  description: string;
  /** Language slug, e.g. "python" */
  language: string;
  /** Lessons: the module's title. Problems: the difficulty. */
  context: string;
  /** Lessons: their ## and ### headings, with #anchors */
  sections: { title: string; url: string }[];
  /** Words from the page's inline code, space-separated */
  terms: string;
};

export type SearchResult = {
  entry: SearchEntry;
  score: number;
  /** A section that matches the query better than the page title does */
  section?: { title: string; url: string };
};

/** Typing a language name narrows the results to it: "sql join", "py loops". */
const languageAliases: Record<string, string[]> = {
  javascript: ["javascript", "js"],
  typescript: ["typescript", "ts"],
  python: ["python", "py", "питон"],
  sql: ["sql", "postgres", "postgresql"],
};

/** Lower case, no accents, ё = е: "Ёлка" and "елка" match. */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Words in `text`. A hyphenated word also counts as its parts, so "f-strings"
 * is found by "f-string" and "strings"; queries keep it whole (`parts: false`).
 */
function words(text: string, { parts = true } = {}) {
  const out: string[] = [];
  for (const piece of normalize(text).split(/[^\p{L}\p{N}_$.#+-]+/u)) {
    const word = piece.replace(/^[.-]+|[.-]+$/g, "");
    if (!word) continue;
    out.push(word);
    if (parts && word.includes("-"))
      out.push(...word.split("-").filter(Boolean));
  }
  return out;
}

/**
 * A query word and its rough stems, so plurals and Russian endings still
 * match: "generics" finds "Generic", "dictionary" finds "Dictionaries",
 * "циклы" finds "Цикл".
 */
function variants(token: string) {
  const out = [token];
  if (token.length <= 4) return out;
  if (token.endsWith("ies")) out.push(`${token.slice(0, -3)}y`);
  else if (token.endsWith("es")) out.push(token.slice(0, -2));
  if (/[sy]$/.test(token)) out.push(token.slice(0, -1));
  if (/[аеиоуыэюяйь]$/.test(token)) out.push(token.slice(0, -1));
  if (token.length > 5 && /(ов|ей|ам|ах|ми|ой|ий|ые|ая|ое|ым|ую)$/.test(token))
    out.push(token.slice(0, -2));
  return out;
}

type Prepared = {
  entry: SearchEntry;
  title: string;
  titleWords: string[];
  description: string;
  descriptionWords: string[];
  sections: { title: string; words: string[] }[];
  terms: string[];
};

/** Normalises an index once, so each keystroke only compares strings. */
export function prepareIndex(entries: SearchEntry[]): Prepared[] {
  return entries.map((entry) => ({
    entry,
    title: normalize(entry.title),
    titleWords: words(entry.title),
    description: normalize(entry.description),
    descriptionWords: words(entry.description),
    sections: entry.sections.map((s) => ({
      title: normalize(s.title),
      words: words(s.title),
    })),
    terms: entry.terms.split(" "),
  }));
}

/** How well one query word matches a list of words, 0 when it doesn't. */
function wordScore(token: string, list: string[], exact: number) {
  let best = 0;
  variants(token).forEach((variant, i) => {
    const weight = i === 0 ? exact : exact * 0.9;
    for (const word of list) {
      if (word === variant) best = Math.max(best, weight);
      else if (variant.length >= 2 && word.startsWith(variant))
        // A stem is cut short on purpose, so its prefix match counts more.
        best = Math.max(best, weight * (i === 0 ? 0.75 : 0.9));
      else if (variant.length >= 3 && word.includes(variant))
        best = Math.max(best, weight * 0.4);
    }
  });
  return best;
}

export function search(
  index: Prepared[],
  query: string,
  options: { limit?: number; language?: string } = {},
): SearchResult[] {
  const { limit = 30 } = options;
  let language = options.language;
  let tokens = words(query, { parts: false });
  const named = tokens.filter((t) =>
    Object.values(languageAliases).some((aliases) => aliases.includes(t)),
  );
  // A language name narrows the search, unless it's the whole query
  // ("python" alone still finds lessons that mention Python).
  if (named.length && named.length < tokens.length) {
    const slug = Object.keys(languageAliases).find((key) =>
      languageAliases[key].includes(named[0]),
    );
    language ??= slug;
    tokens = tokens.filter((t) => !named.includes(t));
  }
  if (!tokens.length) return [];
  const phrase = tokens.join(" ");

  const results: SearchResult[] = [];
  for (const item of index) {
    if (language && item.entry.language !== language) continue;

    let score = 0;
    let titleHits = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const title = wordScore(token, item.titleWords, 12);
      if (title) titleHits++;
      const best = Math.max(
        title,
        wordScore(token, item.terms, 7),
        ...item.sections.map((s) => wordScore(token, s.words, 6)),
        wordScore(token, item.descriptionWords, 3),
      );
      if (!best) {
        matchedAll = false;
        break;
      }
      score += best;
    }
    if (!matchedAll) continue;
    if (item.title.includes(phrase)) score += 10;
    else if (tokens.length > 1 && item.description.includes(phrase)) score += 4;

    // Point at a section when it has every word and the title doesn't.
    let section: SearchResult["section"];
    if (titleHits < tokens.length) {
      let bestSection = 0;
      item.sections.forEach((s, i) => {
        const hits = tokens.filter((t) => wordScore(t, s.words, 1)).length;
        const sectionScore = hits + (s.title.includes(phrase) ? 1 : 0);
        if (hits === tokens.length && sectionScore > bestSection) {
          bestSection = sectionScore;
          section = item.entry.sections[i];
        }
      });
      if (section) score += 2;
    }
    results.push({ entry: item.entry, score, section });
  }

  // Stable sort: equal scores keep the index order (course order, lessons first).
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
