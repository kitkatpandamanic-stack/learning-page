# Gaps, ranked

Last refreshed: 2026-10-11 (repo HEAD `947f15b`). Rank = learner impact × how far it is from the ROADMAP promise,
with cheap fixes nudged up. "Who" says which audience feels it.

## Top 10

### 1. Module mini-projects: 43 of 78 modules have none

- ROADMAP: "Each module ends with a mini-project." Present: JS 10/20, Python 14/25, SQL 2/16, TS 9/17 (recounted 2026-10-11).
  No Level 3 module has one except Python `deep-learning`. SQL has only `aggregation` and `designing-tables`.
- ✅ 2026-10-11: the 5 wrong `course.yml` `project:` labels were fixed (EN + RU). Python `conditions`, `loops` and
  `functions` now name the projects their lessons build, and the labels for JS `basics` and Python `basics` were
  removed because neither module has a project. All 33 remaining labels match a "Mini-project:" exercise (first written as 35; recount: 35 today minus the 2 basics labels restored later).
  The Python L0 mini-projects copy the JS ones (same names, same order), except `basics`: greeting card (JS) vs Mad Libs (Python).
- ✅ 2026-10-11: JS `basics` ("Personal greeting card generator") and Python `basics` ("Mad Libs story generator") now have
  mini-projects as the Exercise of `basics/04-working-with-strings` (EN + RU), and their `project:` labels are restored in
  course.yml + course.ru.yml. All 35 labels (JS 10, Python 14, SQL 2, TS 9) match a "Mini-project:" exercise.
- Who: everyone. The labels are a visible broken promise. Missing projects weaken "finish with a portfolio".
- Fix (next): add mini-projects module by module, SQL L0–L2 first (each SQL module has 3 lessons and a natural "report" project).

### 2. Practice for Levels 2–3 is almost empty

- Problems by level of the linked lesson: JS L0 11 · L1 12 · L2 15 · L3 2; Python L0 13 · L1 26 · **L2 0** · L3 1;
  SQL L0 14 · L1 15 · L2 10 · L3 1; TS L0 9 · L1 18 · L2 4 · L3 9.
- 41 of 78 modules have no linked problem, e.g. Python power-tools, testing, web-apis, databases, async, web-clients,
  data-analysis, statistics, machine-learning; JS testing, react, node-and-express, security; SQL
  indexes-and-performance, views-and-functions, transactions-and-concurrency, security, scaling; TS testing, react, node.
- The problem of the day cycles through every problem, so engineers mostly get L0–L1 puzzles.
- Who: engineers and Middle/Senior learners.
- Fix: 8–10 problems per course at L2–3 (Python: decorators, generators, pytest-the-bug, FastAPI endpoint, pandas
  groupby, asyncio semaphore; SQL: rewrite to be sargable, write a trigger, RLS policy, SKIP LOCKED queue).
  The topic enum has no testing/http/data/security/react topic; new topics need a change to `src/lib/practice-meta.ts`
  (app code: owner decision, open question 7 in `site.md`).

### 3. Ladder modules missing in JavaScript and TypeScript (and smaller holes elsewhere)

- **Databases at Level 2** (ROADMAP + levels.json "Databases"): Python has `databases`; JS and TS have none. Their
  Express APIs only use in-memory repositories. A learner never connects Node to Postgres.
- **TS Level 3 security and system design**: ROADMAP L3 lists both; TS has neither (JS and Python do).
- **Algorithms, recursion, regex in JS/TS**: Python L1 has `algorithms` (4 lessons) and `regular-expressions`. JS/TS have none,
  yet JS practice has 2 recursion, 5 algorithms and 3 text problems and TS has 3 algorithms problems (see #7).
- **Git in Python**: levels.json L1 lists "Git & tooling"; Git is only taught in JS `npm-and-git`.
- **Code review & mentoring in SQL**: none (JS, Python, TS each have one). Lower priority: SQL is a data course.
- Who: learners who pick JS/TS as their only language. Engineers switching languages find no matching lesson.
- Fix: plan "JS L2: Databases from Node" (SQL basics recap → node-postgres/parameters → a repository + migrations, linking
  to the SQL course), "TS L3: Security", and a JS L1 "Recursion & algorithms" module mirroring Python's.

### 4. JavaScript Level 0 is thin, and arrays are used before they're taught

- JS L0 lessons are 390–720 words (TS L0: 920–1,650; SQL L0: 1,480–2,200). `functions` has 2 lessons
  (Python: 3, TS: 3); no L0 debugging lesson (Python has `reading-errors-and-debugging` at L0).
- `loops/for-of` uses `const fruits = ["apples", …]` with no word on what an array is; arrays come in L1 `arrays`.
  Practice `05-make-a-range` (easy, "arrays") links to L0 `for-loops` and needs arrays too.
- Python L0 has the same short lessons (360–520 words) except `reading-errors-and-debugging`.
- Who: newcomers, the most fragile audience, on the most popular first language.
- Fix: add a short "Lists: a first look" section (or lesson) before `for-of`, a JS L0 "Reading errors" lesson, and a third
  functions lesson (callbacks / functions as values, a gentle one). Deepen L0 lessons with one more example + quiz each.

### 5. No fast track for engineers

- No placement checks and no "Already know this?" summaries in any lesson. `/welcome` is self-reported (levels 0–2 only,
  no Level 3 start).
- Who: working engineers, career switchers with experience.
- Fix (content only): a short "Already know this?" `Callout` at the top of each L0–L1 module's first lesson, linking to
  the module's mini-project or a practice problem as a skip test. A per-level "placement" practice set (3 problems per level)
  needs no schema change. A real placement quiz or a Level 3 start option is app work (open question 6).

### 6. Two lessons have no Exercise

- `content/courses/javascript/modules-and-tooling/02-npm-and-git.mdx` (and its RU twin): 0 exercises, 0 CodeExample.
- `content/courses/python/modules-and-packages/02-pip-and-virtual-environments.mdx` (and RU): 0 exercises, 0 CodeExample.
- Both are shell/tooling lessons the browser runner can't execute. No lesson lacks a Quiz.
- Who: everyone at Junior; breaks "every lesson has an exercise".
- Fix: exercises that check _files_ instead of commands: build a `package.json` object with the right scripts and
  dependencies, write a `.gitignore` string that ignores `node_modules` but not `src/`, parse a `requirements.txt`
  and pin versions. Remember RU twins must have the same exercise count.

### 7. Practice links that point to the wrong lesson (or to nothing that teaches the idea)

- No broken links: all 160 `lesson:` values resolve. But some don't teach what the problem needs:
  - JS `28-deep-equal`, `33-deep-clone` (recursion) → `objects`, `spread-rest-and-optional-chaining`: JS teaches no recursion.
  - JS `25-merge-bookings`, `31-panda-parade`, `39-grid-route` (interval merging, a visibility stack, grid BFS) → `array-methods`, `arrays`, `arrays`.
  - JS `26-first-tall-enough` (binary search), `37-spelling-suggestions` (edit distance) → L3 `measuring-performance`.
  - JS `38-tokenizer` (hard, text) → L0 `working-with-strings`; JS has no regex lesson.
  - TS `35-build-order` (topological sort), `38-cheapest-route` (shortest path) → `variance-and-inference`.
  - JS `05-make-a-range` (easy) → L0 `for-loops`, but returns an array (arrays are L1).
- Who: newcomers who click "refresher lesson" and find nothing relevant.
- Fix: relink after #3 adds JS/TS algorithm lessons; until then, link to the closest real lesson and add a one-line
  "You'll need recursion: see Python's `recursion` lesson for the idea" in the statement (EN + RU).

### 8. Durations look unrealistic for long lessons

- Duration seems capped at 25 min. TS L2 lessons are 3,650–7,230 words at 18–20 min; capstone parts reach 9,000–12,000
  words (TS `typed-sdk/02-the-client`: 11,949 words, 25 min). JS L3 `authentication-and-sessions`: 6,048 words, 25 min.
  Word counts include code, but still far above a 25-minute read plus an exercise.
- Who: everyone planning a daily session; hurts trust in "about N min a day".
- Fix: owner decision (open question 3). Either split long lessons/parts or raise durations (EN and RU together).

### 9. Thin modules (2 lessons where siblings have 3–4)

- JS L0 `functions` (2), JS L1 `errors-and-debugging` (2), `classes` (2), `modules-and-tooling` (2), Python L1
  `modules-and-packages` (2), TS L3 `leadership` (2). Every SQL and most TS modules have 3.
- Who: Junior learners. JS L1 `classes` has no lesson on `this` binding, static vs instance trade-offs or composition depth.
- Fix: low priority after #1–#4.

### 10. Translations: none missing

- 288/288 lessons, 160/160 problems and 4/4 `course.ru.yml` have RU twins; no orphan RU files; exercise/quiz counts match.
- Four RU titles are intentionally untranslated loanwords or puns ("DOM", "ORM SQLAlchemy", "Munch, Nap, Roll",
  "Bamboo, Panda, BambooPanda"). Nothing to do.

## By category (quick lookup)

| Category                               | Status                                                                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Missing levels                         | None. Every course has 4 levels and 4 capstones (3 parts each).                                                                  |
| Thin levels                            | JS L0 (short lessons, 12 module lessons); otherwise levels are 15–33 lessons. Python L2 is the heaviest (9 modules, 33 lessons). |
| Ladder deviations                      | Design patterns at L3, not L2 (all courses). JS/TS no databases at L2. TS no security/system design at L3.                       |
| Missing prerequisites                  | Arrays before JS L1 (`for-of`); recursion/algorithms/regex never taught in JS/TS but needed by practice.                         |
| Lessons without Exercise               | 2 (`npm-and-git`, `pip-and-virtual-environments`).                                                                               |
| Lessons without Quiz                   | 0.                                                                                                                               |
| Lessons without CodeExample            | 12: 10 DOM/React/TSX lessons or capstone parts that use `TryIt` instead (fine), plus the 2 tooling lessons above.                |
| Missing translations                   | 0.                                                                                                                               |
| Problems with no or broken lesson link | 0 / 0. Weak links: see #7.                                                                                                       |
| Modules with no practice problem       | JS 12/20, Python 16/25, SQL 5/16, TS 8/17.                                                                                       |
| Modules with no mini-project           | JS 10/20, Python 11/25, SQL 14/16, TS 8/17 (2026-10-11, after the basics projects).                                              |
