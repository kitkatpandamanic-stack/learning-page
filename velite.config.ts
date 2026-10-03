import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { transformSync } from "esbuild";
import tokyoNight from "@shikijs/themes/tokyo-night";
import { parse as parseJs } from "acorn";
import rehypePrettyCode, { type Options, type Theme } from "rehype-pretty-code";
import GithubSlugger from "github-slugger";
import rehypeSlug from "rehype-slug";
import { visit } from "unist-util-visit";
import { defineCollection, defineConfig, s } from "velite";

import { languages } from "./src/lib/languages";

/**
 * Content layout
 *
 *   content/courses/<language>/course.yml            levels → modules outline
 *   content/courses/<language>/<module>/<NN-slug>.mdx lessons, ordered by NN
 *
 * Translations sit next to the English file with the locale before the
 * extension: course.ru.yml, NN-slug.ru.mdx. A translation shares its lesson's
 * slug and permalink, so progress and XP are the same in every language.
 */

const LOCALES = ["en", "ru"] as const;

/** "01-hello-world.ru" → { base: "01-hello-world", locale: "ru" } */
function splitLocale(name: string) {
  const match = /^(.*)\.([a-z]{2})$/.exec(name);
  return match && (LOCALES as readonly string[]).includes(match[2])
    ? { base: match[1], locale: match[2] }
    : { base: name, locale: "en" };
}

// Tokyo Night with brighter comments: its default #51597d is too faint to read
// on our dark background, and lessons explain a lot in code comments.
const readableTokyoNight = {
  ...tokyoNight,
  name: "tokyo-night-readable",
  tokenColors: (tokyoNight.tokenColors ?? []).map((rule) =>
    rule.settings.foreground === "#51597d"
      ? { ...rule, settings: { ...rule.settings, foreground: "#9aa5ce" } }
      : rule,
  ),
} as Theme;

const prettyCode: Options = {
  theme: readableTokyoNight,
  // Background comes from our glass code block styles
  keepBackground: false,
  defaultLang: { block: "text", inline: "text" },
};

/**
 * Gives every <Exercise> and <Quiz> a stable id ("exercise-1", "quiz-2", …) in
 * document order. The server uses these ids to award XP once per activity.
 */
function remarkActivityIds() {
  return (tree: Parameters<typeof visit>[0]) => {
    const counters: Record<string, number> = { Exercise: 0, Quiz: 0 };
    visit(tree, "mdxJsxFlowElement", (node) => {
      const el = node as {
        name?: string | null;
        attributes: { type: string; name: string; value: string }[];
      };
      if (el.name === "Exercise" || el.name === "Quiz") {
        const n = ++counters[el.name];
        el.attributes.push({
          type: "mdxJsxAttribute",
          name: "activityId",
          value: `${el.name.toLowerCase()}-${n}`,
        });
      }
    });
  };
}

/**
 * MDX strips two spaces from every line of a multi-line attribute expression,
 * which mangles code in `starter={`…`}` and `code={`…`}`. Re-read each
 * multi-line expression from the original source so indentation survives.
 */
function remarkKeepAttributeIndentation() {
  return (tree: Parameters<typeof visit>[0], file: { value: unknown }) => {
    const source = String(file.value);
    visit(tree, ["mdxJsxFlowElement", "mdxJsxTextElement"], (node) => {
      const el = node as unknown as {
        attributes: {
          type: string;
          position?: { start: { offset?: number }; end: { offset?: number } };
          value?: { type?: string; value: string; data?: { estree?: unknown } };
        }[];
      };
      for (const attr of el.attributes) {
        const value = attr.value;
        const start = attr.position?.start.offset;
        const end = attr.position?.end.offset;
        if (
          attr.type !== "mdxJsxAttribute" ||
          value?.type !== "mdxJsxAttributeValueExpression" ||
          !value.value.includes("\n") ||
          start === undefined ||
          end === undefined
        )
          continue;
        const raw = source.slice(start, end);
        const open = raw.indexOf("={");
        if (open === -1 || !raw.endsWith("}")) continue;
        const expression = raw.slice(open + 2, -1);
        value.value = expression;
        value.data = {
          ...value.data,
          estree: parseJs(expression, {
            ecmaVersion: "latest",
            sourceType: "module",
          }),
        };
      }
    });
  };
}

/** Counts activities with the same rule as remarkActivityIds (top-level tags in order). */
function countTags(raw: string, tag: string) {
  return raw.match(new RegExp(`^<${tag}\\b`, "gm"))?.length ?? 0;
}

type TocEntry = { title: string; url: string; items: TocEntry[] };

/**
 * Builds "On this page" from the lesson's ## and ### headings. Skips code
 * fences and multi-line component tags, so a Python "# comment" inside an
 * exercise's starter code is never mistaken for a heading. Slugs match
 * rehype-slug, which adds the ids to the rendered headings.
 */
function buildToc(raw: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];
  // The open code fence, e.g. "````": only a fence of the same character
  // and at least as long closes it, so blocks can show fenced code inside.
  let fence = "";
  let inTag = false;
  for (const line of raw.split("\n")) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (
        marker?.[0] === fence[0] &&
        marker.length >= fence.length &&
        /^\s*[`~]+\s*$/.test(line)
      )
        fence = "";
      continue;
    }
    if (marker) {
      fence = marker;
      continue;
    }
    if (inTag) {
      if (/^\s*\/?>\s*$/.test(line)) inTag = false;
      continue;
    }
    if (/^<[A-Z][A-Za-z]*\s*$/.test(line)) {
      inTag = true; // e.g. "<Exercise" whose attributes span several lines
      continue;
    }
    const match = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (!match) continue;
    const title = match[2]
      .replace(/`([^`]*)`/g, "$1")
      .replace(/\*\*([^*]*)\*\*/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    const entry = { title, url: `#${slugger.slug(title)}`, items: [] };
    if (match[1] === "###" && toc.length > 0)
      toc[toc.length - 1].items.push(entry);
    else toc.push(entry);
  }
  return toc;
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const courses = defineCollection({
  name: "Course",
  pattern: "courses/*/course*.yml",
  schema: s
    .object({
      path: s.path(),
      intro: s.string(),
      levels: s
        .array(
          s.object({
            level: s.number().int().min(0).max(3),
            summary: s.string(),
            /**
             * A title, or a module of lessons that builds the project:
             * { slug, title, description } with lessons in <language>/<slug>/.
             */
            capstone: s.union([
              s.string().transform((title) => ({
                title,
                slug: undefined as string | undefined,
                description: undefined as string | undefined,
              })),
              s.object({
                slug: s.string().regex(slugPattern),
                title: s.string(),
                description: s.string(),
              }),
            ]),
            modules: s
              .array(
                s.object({
                  slug: s.string().regex(slugPattern),
                  title: s.string(),
                  description: s.string(),
                  project: s.string().optional(),
                }),
              )
              .min(1),
          }),
        )
        .length(4),
    })
    .transform(({ path, ...data }) => ({
      ...data,
      language: path.split("/")[1],
      locale: splitLocale(path.split("/")[2]).locale,
    })),
});

const lessons = defineCollection({
  name: "Lesson",
  pattern: "courses/*/*/*.mdx",
  schema: s
    .object({
      title: s.string().max(80),
      description: s.string().max(200),
      /** Estimated minutes to finish */
      duration: s.number().int().positive(),
      xp: s.number().int().positive().default(10),
      path: s.path(),
      body: s.mdx(),
      raw: s.raw(),
    })
    .transform(({ path, raw, ...data }) => {
      const [, language, module, name] = path.split("/");
      const { base: file, locale } = splitLocale(name);
      const match = /^(\d+)-(.+)$/.exec(file);
      return {
        ...data,
        language,
        module,
        file,
        locale,
        order: match ? Number(match[1]) : -1,
        slug: match ? match[2] : file,
        permalink: `/learn/${language}/${match ? match[2] : file}`,
        toc: buildToc(raw),
        exerciseCount: countTags(raw, "Exercise"),
        quizCount: countTags(raw, "Quiz"),
      };
    }),
});

export default defineConfig({
  root: "content",
  strict: true,
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    // `npm run dev` keeps the last output while it rebuilds (scripts/dev.mjs).
    clean: !process.env.VELITE_KEEP_OUTPUT,
  },
  collections: { courses, lessons },
  mdx: {
    // Minified with short lines instead (see compactBody below).
    minify: false,
    remarkPlugins: [remarkKeepAttributeIndentation, remarkActivityIds],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCode]],
  },
  // Cross-file checks that a single schema can't express. Any problem fails the build.
  prepare: ({ courses, lessons }) => {
    const problems: string[] = [];
    const known = new Set(languages.map((l) => l.slug));

    const english = courses.filter((c) => c.locale === "en");
    const outline = (c: (typeof courses)[number]) =>
      c.levels
        .map(
          (l) =>
            `${l.level}:${l.capstone.slug ?? ""}:${l.modules.map((m) => m.slug).join(",")}`,
        )
        .join("|");

    for (const course of courses) {
      if (course.locale !== "en") {
        const original = english.find((c) => c.language === course.language);
        if (!original) {
          problems.push(
            `courses/${course.language}/course.${course.locale}.yml: no English course.yml`,
          );
        } else if (outline(original) !== outline(course)) {
          problems.push(
            `courses/${course.language}/course.${course.locale}.yml: levels, modules and capstone slugs must match course.yml exactly`,
          );
        }
        continue;
      }
      if (!known.has(course.language)) {
        problems.push(
          `courses/${course.language}: unknown language (add it to src/lib/languages.ts)`,
        );
      }
      const levels = course.levels.map((l) => l.level).join(",");
      if (levels !== "0,1,2,3") {
        problems.push(
          `courses/${course.language}: levels must be 0, 1, 2, 3 in order`,
        );
      }
      const moduleSlugs = course.levels.flatMap((l) => [
        ...l.modules.map((m) => m.slug),
        ...(l.capstone.slug ? [l.capstone.slug] : []),
      ]);
      const dupes = moduleSlugs.filter((m, i) => moduleSlugs.indexOf(m) !== i);
      if (dupes.length) {
        problems.push(
          `courses/${course.language}: duplicate module slugs: ${dupes.join(", ")}`,
        );
      }
    }

    const seen = new Map<string, string>();
    for (const lesson of lessons) {
      const suffix = lesson.locale === "en" ? "" : `.${lesson.locale}`;
      const where = `courses/${lesson.language}/${lesson.module}/${lesson.file}${suffix}.mdx`;
      const course = english.find((c) => c.language === lesson.language);
      if (!course) {
        problems.push(`${where}: no course.yml for "${lesson.language}"`);
        continue;
      }
      if (
        !course.levels.some(
          (l) =>
            l.capstone.slug === lesson.module ||
            l.modules.some((m) => m.slug === lesson.module),
        )
      ) {
        problems.push(
          `${where}: module "${lesson.module}" is not listed in course.yml`,
        );
      }
      if (lesson.order < 0) {
        problems.push(
          `${where}: file name must start with a number, e.g. 01-${lesson.file}.mdx`,
        );
      }
      if (lesson.locale !== "en") {
        // A translation must match its original wherever progress depends on it.
        const original = lessons.find(
          (l) =>
            l.locale === "en" &&
            l.language === lesson.language &&
            l.module === lesson.module &&
            l.file === lesson.file,
        );
        if (!original) {
          problems.push(`${where}: no English lesson ${lesson.file}.mdx`);
        } else {
          for (const field of [
            "exerciseCount",
            "quizCount",
            "xp",
            "duration",
          ] as const) {
            if (original[field] !== lesson[field]) {
              problems.push(
                `${where}: ${field} is ${lesson[field]} but the English lesson has ${original[field]}`,
              );
            }
          }
        }
      }
      const key = `${lesson.language}/${lesson.slug}/${lesson.locale}`;
      if (seen.has(key)) {
        problems.push(
          `${where}: lesson slug "${lesson.slug}" is already used by ${seen.get(key)}`,
        );
      }
      seen.set(key, where);
    }

    if (problems.length) {
      throw new Error(`Content problems:\n  - ${problems.join("\n  - ")}`);
    }

    // Lesson bodies are 90% of all content (tens of MB). Each goes in its own
    // file, which only that lesson's page loads (src/lib/lesson-body.ts);
    // lessons.json keeps the light metadata every other page needs.
    for (const lesson of lessons) {
      // In watch mode Velite reuses unchanged lessons from the last build,
      // whose body was already written (and removed below): keep that file.
      if (typeof lesson.body !== "string") continue;
      writeIfChanged(
        bodyFile(lesson),
        JSON.stringify(compactBody(lesson.body)),
      );
      delete (lesson as { body?: string }).body;
    }
  },
});

/**
 * Minifies a compiled lesson into lines of at most ~500 characters. Velite's
 * own minifier puts a lesson on one line of up to 470,000 characters; in
 * development React builds a fake stack frame for each component, padded with
 * as many spaces as its column, which cost ~100 MB of memory per page view
 * (the dev server then ran out of memory and restarted).
 */
function compactBody(body: string) {
  const { code } = transformSync(`var __mdx=function(){${body}\n};`, {
    minify: true,
    lineLimit: 500,
    legalComments: "none",
  });
  // "var __mdx=function(){…};" → the function body again
  return code.slice(code.indexOf("{") + 1, code.lastIndexOf("}"));
}

/** .velite/bodies/<language>/<slug>.<locale>.json */
function bodyFile(lesson: { language: string; slug: string; locale: string }) {
  return join(
    ".velite",
    "bodies",
    lesson.language,
    `${lesson.slug}.${lesson.locale}.json`,
  );
}

/** Unchanged files stay untouched, so the dev server only reloads edited lessons. */
function writeIfChanged(file: string, text: string) {
  try {
    if (readFileSync(file, "utf8") === text) return;
  } catch {
    // not written yet
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}
