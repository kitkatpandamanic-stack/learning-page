# PandaDev: site context

Last refreshed: 2026-10-11 (repo HEAD `947f15b`). Sources: `ROADMAP.md`, `README.md`, `velite.config.ts`,
`src/lib/gamification.ts`, `src/lib/practice-meta.ts`, `src/lib/languages.ts`, `messages/en/{home,levels,welcome}.json`,
and a read of ~15 full lessons across all levels.

## What PandaDev is

- A bilingual (EN + RU) website that teaches programming languages "from Zero to Senior" (`ROADMAP.md`).
- Next.js 16 + React 19, MDX lessons built by Velite, code runs **in the learner's browser**:
  JS/TS in a Web Worker (TS type-checked strict first), Python on Pyodide 3.14, SQL on PGlite (PostgreSQL 18),
  DOM/React/TSX in a sandboxed iframe preview. Judge0 for other languages is planned, not used by any course yet.
- Live courses (`src/lib/languages.ts`, status `available`): **JavaScript, Python, TypeScript, SQL**.
  Coming soon: Java, C#, Go, Rust, C++ (tiles only, no content).
- Home copy: "Learn to code. From Zero to Senior." "Bite-sized lessons, real coding exercises and projects."
  "Every language follows the same four-level path." "Each level ends with a capstone project, so you finish with a portfolio, not just notes."

## Audience (what the repo actually says)

- From first-time coders to engineers. The `/welcome` flow asks "How much have you coded before?" with three
  self-reported options: 0 "I'm brand new to coding", 1 "I know the basics", 2 "I've built things before"
  (jumps into APIs, testing, real-world patterns). There is **no Level 3 start option and no placement test**.
- Daily goal options: 30 / 50 / 100 XP ("Casual / Regular / Serious").
- Age, country, prior-education and career goals of learners are **not stated** anywhere (see open questions).
  Examples use names like Mei, Ada, Tom, Zara and places like Tashkent, London.

## The 4-level ladder (source of truth: ROADMAP.md §4, mirrored in `messages/en/levels.json`)

| Level      | ROADMAP focus                                                                      | levels.json topics                                                    |
| ---------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 0 Beginner | Syntax, variables, types, conditions, loops, functions                             | Variables & types · Conditions & loops · Functions · First mini-games |
| 1 Junior   | Data structures, OOP/modules, errors, tooling, small projects                      | Data structures · OOP & modules · Errors & debugging · Git & tooling  |
| 2 Middle   | Async, testing, design patterns, frameworks, databases, APIs                       | Async & APIs · Testing · Design patterns · Databases                  |
| 3 Senior   | Architecture, performance, security, system design, code review, mentoring (CI/CD) | System design · Performance · Security · Code review & mentoring      |

Hierarchy: Language → Level → Module → Lesson. Every lesson: theory, code examples, an interactive exercise
with checks, a quiz. Every module ends with a mini-project; every level ends with a capstone.

Deviation in practice (all four courses): design patterns / architecture sit in **Level 3**, not Level 2.

## Tone of voice (learned from lessons)

- Short sentences, second person, friendly and concrete. Plain words first, then the term in **bold**
  ("A **variable** is a named box that holds a value.").
- Small, warm examples: "Panda", "Mei", bamboo, pandas napping, a film club, a shop. Practice problems are
  panda-themed stories ("The bamboo cache that goes stale").
- One emoji now and then in intros (🪟 🧠 🗺️ 🐧), never in headings except the final "Congratulations! 🎉🐼".
- Explains _why_ as well as _how_; Level 2–3 lessons add "In real projects", trade-offs, "When not to…",
  "Common mistakes", pitfalls and production notes.
- Error messages from real tools stay in English, also in RU lessons. Code identifiers stay in English;
  comments, prose and printed text are translated.
- RU lessons keep the English term in brackets on first use: «Словарь (dictionary, или **dict**)».

## Lesson format (house style)

Frontmatter (schema in `velite.config.ts`, collection `lessons`):

```yaml
---
title: "…" # max 80 chars
description: "…" # max 200 chars
duration: 12 # minutes, positive int
xp: 20 # positive int, default 10
---
```

No other lesson frontmatter fields exist. Do not invent new ones without a schema change (app code, out of scope).

Body order, seen in every regular lesson:

1. 1–3 intro paragraphs with no heading (why this matters, often with a question the lesson answers).
2. `## Section` headings (sometimes `###`), each with a `<CodeExample output={…}>` + fenced code block,
   bullet explanations and `<Callout type="note|tip|warning|danger" title="…">`.
   DOM/React lessons use `<TryIt html={…} code={…} />` or `<TryIt language="react|tsx|python" … />` instead of CodeExample.
3. One or two `<Quiz question options answer explanation />` near the end (`answer` is 0-based).
4. One `<Exercise title language starter tests>` with one or more progressive `<Hint>` and a `<Solution>` code block.
   Mini-projects are an Exercise titled `"Mini-project: …"`, usually in the module's last lesson.
5. `## Recap` bullet list.

Capstone parts: title `Part N: …`, end with `## What you built`; the last part adds `## Take it further`
and (for the level-3 capstone and TS L0) `## Congratulations! 🎉🐼`. Capstone parts 1 quiz each (L3: 2).

Practice problems (`content/practice/<lang>/NN-slug.mdx`): frontmatter `title`, `description`,
`difficulty` (easy/medium/hard = 10/20/30 XP), `topic` (enum in `src/lib/practice-meta.ts`), optional `lesson:`
(`/learn/<lang>/<slug>`), then a story-style statement with bullet rules and examples, then **exactly one**
`<Exercise>` with up to 3 progressive hints (last hint is a code skeleton) and a `<Solution>` that ends with a
short complexity / design note.

Allowed practice topics: strings, numbers, lists, arrays, dictionaries, objects, functions, classes, types, async,
recursion, algorithms, text, filtering, joins, grouping, subqueries, windows, changes, schema.
(No topic exists for testing, HTTP/APIs, data/pandas, security, React or DOM; adding one is an app-code change.)

## Exercise checks (README "Writing content")

- JS/TS: `tests={[{ name, check: "JS expression" }]}` run after the learner's code; `__output` holds printed lines;
  or `expectedOutput`. TS code with type errors doesn't run, so `// @ts-expect-error` lines can test types.
- Python: `language="python"`, checks in Python; `_panda_pytest()` to count tests; `_panda_requests` for HTTP.
- SQL: `language="sql"`, checks are JS over `rows`, `columns`, `results`, `query()`, `rerun(setupSql)` (so hard-coded answers fail).
- Built-in fakes: practice API `https://api.pandadev.test` (movies, weather, recipes, users, posts, todos, status, delay, flaky, offline),
  vitest, express + supertest, ws WebSockets, React 19; Python: requests/httpx, FastAPI TestClient, BeautifulSoup shop, pandas etc.
- `npm test` checks every solution passes and every starter fails; `npm run content` validates structure.

## Conventions

- Files: `content/courses/<lang>/<module>/NN-slug.mdx` + `NN-slug.ru.mdx`. URL `/learn/<lang>/<slug>` (no number).
  Slugs must be unique per language.
- `course.yml` + `course.ru.yml`: `intro`, exactly 4 `levels` with `summary`, `capstone` (`{slug,title,description}`),
  `modules[]` with `slug,title,description,project?`. The `project` string is shown on the course roadmap page
  (`src/components/languages/course-roadmap.tsx`).
- RU twins must match EN in exercise count, quiz count, xp and duration (build fails otherwise).
- XP: lesson XP from frontmatter; exercise +10; quiz right first time +5; practice 10/20/30; problem of the day +20;
  daily review once a day. Learner level L needs 50·L·(L−1) XP.
- Typical XP / duration seen: L0 10–25 xp, 5–15 min; L1 20–25 xp, 12–20 min; L2 20–30 xp, 16–25 min;
  L3 25–35 xp, 22–25 min; capstone parts 30–35 xp, 15–25 min. 25 min looks like a hard ceiling.

## Decision log

| Date       | Decision                                                                                          | Source                                           |
| ---------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 2026-10-01 | Same 4-level ladder for every language; module → mini-project, level → capstone                   | ROADMAP §4                                       |
| 2026-10-01 | Full Russian version of the site; translations share slug, XP and progress                        | commit "Add a full Russian version of the site"  |
| 2026-10-01 | Capstones are modules of "Part N" lessons listed after the level's modules                        | README, velite schema                            |
| 2026-10-04 | SQL added as a full course (PGlite in browser), although ROADMAP still lists SQL under "Later"    | commit #12, `languages.ts`                       |
| 2026-10-10 | Practice: 40 problems per language, 12 easy / 18 medium / 10 hard, with step-by-step hints        | commits #13, #23                                 |
| (observed) | Design patterns & architecture are taught at Level 3 in all courses, not Level 2 as ROADMAP lists | course.yml files                                 |
| (observed) | Level 0 DOM is used via provided "glue code" in the JS L0 capstone, explained in L1               | `number-guessing-game/03-playing-in-the-browser` |
| 2026-10-11 | Learning-context files created in `docs/learning-context/`                                        | this run                                         |

## Open questions for the site owner

1. Who exactly is the audience? Age range (one example uses `"age": 12`), countries, and whether kids or school use is a goal.
2. Should every Level 3 module end with its own mini-project, or does the level capstone cover Level 3? Same for SQL modules (14 of 16 have none).
3. Is `duration` capped at 25 minutes on purpose? Many L2–L3 lessons and capstone parts are 4,000–12,000 words.
4. Should JavaScript and TypeScript get a Level 2 databases module (levels.json promises "Databases" at Middle), or should they link to the SQL course?
5. Should TypeScript have its own Level 3 security and system-design modules, or point learners to the JavaScript ones?
6. Are placement checks / "already know this?" summaries wanted, and should `/welcome` offer a Level 3 start?
7. May the practice topic list (`src/lib/practice-meta.ts`) grow (testing, http, data, security, react)? That is an app-code change.
8. ROADMAP Phase 8 status line is out of date (says only Level 0 + JS Level 1 done) and lists SQL as "Later". Update it?
9. Timeline and order for the coming-soon languages (Java, C#, Go, Rust, C++).
