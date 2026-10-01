import rehypePrettyCode, { type Options } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { defineCollection, defineConfig, s } from "velite";

import { languages } from "./src/lib/languages";

/**
 * Content layout
 *
 *   content/courses/<language>/course.yml            levels → modules outline
 *   content/courses/<language>/<module>/<NN-slug>.mdx lessons, ordered by NN
 */

const prettyCode: Options = {
  theme: "tokyo-night",
  // Background comes from our glass code block styles
  keepBackground: false,
  defaultLang: { block: "text", inline: "text" },
};

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
      toc: s.toc(),
      body: s.mdx(),
    })
    .transform(({ path, ...data }) => {
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
