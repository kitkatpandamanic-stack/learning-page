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
 */

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
  let inFence = false;
  let inTag = false;
  for (const line of raw.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
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
  pattern: "courses/*/course.yml",
  schema: s
    .object({
      path: s.path(),
      intro: s.string(),
      levels: s
        .array(
          s.object({
            level: s.number().int().min(0).max(3),
            summary: s.string(),
            capstone: s.string(),
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
      const [, language, module, file] = path.split("/");
      const match = /^(\d+)-(.+)$/.exec(file);
      return {
        ...data,
        language,
        module,
        file,
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
    clean: true,
  },
  collections: { courses, lessons },
  mdx: {
    remarkPlugins: [remarkKeepAttributeIndentation, remarkActivityIds],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCode]],
  },
  // Cross-file checks that a single schema can't express. Any problem fails the build.
  prepare: ({ courses, lessons }) => {
    const problems: string[] = [];
    const known = new Set(languages.map((l) => l.slug));

    for (const course of courses) {
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
      const moduleSlugs = course.levels.flatMap((l) =>
        l.modules.map((m) => m.slug),
      );
      const dupes = moduleSlugs.filter((m, i) => moduleSlugs.indexOf(m) !== i);
      if (dupes.length) {
        problems.push(
          `courses/${course.language}: duplicate module slugs: ${dupes.join(", ")}`,
        );
      }
    }

    const seen = new Map<string, string>();
    for (const lesson of lessons) {
      const where = `courses/${lesson.language}/${lesson.module}/${lesson.file}.mdx`;
      const course = courses.find((c) => c.language === lesson.language);
      if (!course) {
        problems.push(`${where}: no course.yml for "${lesson.language}"`);
        continue;
      }
      if (
        !course.levels.some((l) =>
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
      const key = `${lesson.language}/${lesson.slug}`;
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
  },
});
