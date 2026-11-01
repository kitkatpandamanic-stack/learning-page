# Lessons learned

Rules that came from mistakes, corrections and feedback. **Every agent and session reads this file first and follows it.**
Add a rule when something went wrong or the site owner corrected you, phrased as what to do next time. Keep it short, and merge duplicates.

## Accuracy

- **Recount before you report.** (2026-10-11: the first learning-architect run said "6 project labels are wrong" but there were 5.) Any number in a report must come from a count you just ran, not from memory.
- Check each finding against the actual files before calling it a gap. A spot check by the main session is not enough.

## Content

- A `project:` label in `course.yml` must match a `Mini-project: …` Exercise title in that module's lessons. If a module has no mini-project, leave out `project:` (it's optional in the schema). Never label a project that doesn't exist. (2026-10-11: 5 labels fixed.)
- Every change to course content is made in both EN and RU: `.mdx` + `.ru.mdx`, `course.yml` + `course.ru.yml`.
- Mini-project placement: in the JS/Python/TS/SQL courses every lesson has exactly one `<Exercise>` (the Git & Terminal course, 2026-11-01, uses 2–3 small terminal exercises in some lessons; that works: ids are exercise-1, -2…), and at L0 the mini-project _is_ that Exercise in an existing lesson (JS/Python conditions, loops, functions, TS basics). Adding one to an existing lesson means replacing its exercise, so fold the old exercise's skill into the project. (2026-10-11: basics projects went into `04-working-with-strings`.)
- Exercise and Quiz ids are positional (`exercise-1`, `quiz-N` in document order; saved code is keyed `locale:path#exercise-1`, see `velite.config.ts` and `src/lib/saved-code.ts`). Add a new Quiz **after** the existing ones so old progress and review cards keep pointing at the same question. Replacing an exercise keeps its id: learners who did the old one see their old code and get no new +10 XP. Say so in the report. (2026-10-11: the site owner said replacing the exercise is fine: stale saved code and no repeat XP are acceptable.)
- For "change the values and run it again" generator exercises: actually run the solution with the values you suggest and check the promised effect happens (2026-10-11: the first suggested Mad Libs words gave a title of the same length, so the "underline grows or shrinks" claim didn't show). Test names are shown to learners, so phrase defaults as "like HAPPY BIRTHDAY, ZARA!", not as the only right answer.
- RU twins of fill-in-the-words exercises: write the template so inserted words never need declension or agreement (present tense for the hero, nominative slots, numbers standing alone instead of "7 пельменей"), and say the needed form in the starter comment ("прилагательное мужского рода").
- MDX: a `"…"` JSX attribute can't contain `\"`; use `{'…'}`. Inside a template-literal attribute (`output={`…`}`), write a literal `${` as `\${`.
- Before using a built-in in an L0–L1 lesson, grep the course for where it's first used (`grep -rn "isArray" content/courses/javascript`). If nothing earlier teaches it, explain it in one line where you use it. (2026-10-11: `Array.isArray`, `"".repeat()` and `push(...items)` were first used in the L1 capstone, L1 `reading-errors` and L2 respectively, so `recursion` explains each.)
- To show a crash at L1 before `try/catch` is taught, let the JS CodeExample end in the uncaught error: the runner prints it as `Name: message` as the last output line (e.g. `RangeError: Maximum call stack size exceeded`). The runner also prefixes all learner code with `"use strict"` (`src/lib/runner/execute.ts`), which matters for strict-only behaviour (tail calls in Safari, `this` in plain functions).
- Inserting a lesson into a module: URLs, saved code and progress use the slug, not the `NN-` prefix, so renumbering later files is safe (check with `grep -rn "<old NN-slug>"` anyway). Insert **before** the module's mini-project lesson so it stays last, and say in the report that learners who finished the module now have one new lesson in it.
- A practice problem's `lesson:` must be a lesson in the **same** course: the problem page looks the slug up in its own language (`src/app/[locale]/(site)/practice/[lang]/[problem]/page.tsx`), and the build only checks that some English lesson has that permalink. A cross-course link builds fine but shows no lesson.

- **Splitting a lesson:** quiz and exercise ids are `permalink#quiz-N` / `#exercise-N`, so a quiz moved into a new lesson gets a new id and any progress or review card on the old one is orphaned. That's free before the lesson is merged; after that, say so in the report. Keep the original slug for the first half (practice `lesson:` links and `reading-errors` point at it), and move each "next up" line to the real next lesson. (2026-10-17: `recursion` split into `recursion` + `recursion-or-loop` before merge.)
- **Graduated hints:** there's no `<HintSteps>` tag to write in MDX. An Exercise's `<Hint>` children are already shown one at a time with "Hint 1 of N" (`src/components/mdx/exercise.tsx`), so write 2–3 `<Hint>`s from nudge to concept.
- **"Survives deep input" tests:** build the deep data inside the check with a bottom-up loop in an IIFE (`(() => { let f = { folders: [] }; for (…) f = { folders: [f] }; return fn(f) === N; })()`), so the test doesn't depend on a starter helper the learner might delete. 100,000 levels overflows any recursive walk in Node. Don't `JSON.stringify` deep data in a check: it overflows too. A starter that crashes at the top level makes every test say "Fix the error in your code first", which is fine when the crash is the point of the exercise, but say so in the task text.

## Tooling

- `npm run content` (velite) takes ~1–3 minutes (53 s on 2026-10-11). Run it in the background. `CONTENT_LANGUAGES=javascript,python` content tests: 3,105 tests, ~4 minutes; add `--reporter=verbose` and grep to see your own lessons' results.
- The full `tests/content.test.ts` takes ~9 minutes (5,677 tests). Limit it with `CONTENT_LANGUAGES=python` (comma-separated) when only one course changed.
- The local Python is 3.9 and there's no `psql`, only `sqlite3`. Don't claim you ran code that needs a newer runtime.
- The shell is zsh: an unquoted `echo ====` fails (`=word` expansion). Quote separators: `echo "----"`.

- Run `npx prettier --check` on every file you created or changed (Markdown in `docs/` and `.claude/` included, MDX is ignored) before committing: CI's `npm run format:check` fails otherwise. (2026-10-11: PR #35's first CI run failed on 7 unformatted Markdown files.)

## Research (from the 2026-10-15 outside-sources run)

- **Use primary sources for facts that change.** Take versions, stages and end-of-life dates from the primary table or log (github.com/nodejs/Release, tc39/proposals commits, python.org downloads), not news roundups or search summaries. On 2026-10-15, roundups put Temporal in ES2026 and called decorators Stage 3, and a search summary misquoted Habr Career's experience ranges. Check the raw page (`curl`) before you cite it.
- **Label how strong the evidence is:** meta-analysis, several studies, single study, or opinion. Never present practitioner opinion or company data as research. Take numbers from the primary paper, and say so when only a secondary summary was available.
- **Count carefully.** Count "n/N sources" over distinct providers that actually cover the topic, and recount after writing. For Russian word counts, match on word boundaries: "бот" also matches inside "работает".
- **Check features before teaching them.** For a beta or RC feature, check the latest release-notes draft first, because beta announcements list features that later get pulled (PG 19). "Learners can use it in the browser" means MDN Baseline, not the spec year.
- **Sites that build their contents in the browser** (roadmap.sh, freeCodeCamp, Exercism, Odin): read their open-source files on GitHub instead, and note the commit date. roadmap.sh: `nilbuild/developer-roadmap`, `roadmaps/<slug>/content/`.
- **Blocked or awkward from here:** Reddit (needs a login), hh.ru career pages (HTTP 451), and Stack Overflow's "frequent" tab (403). For Stack Overflow, use the API's linked-question count instead (about 300 requests a day without a key). Stepik was sometimes down (502). Old URLs redirect: mode.com/sql-tutorial → thoughtspot.com, and education.yandex.ru/handbook → contest.yandex.ru.
- **Long pages and PDFs:** WebFetch truncates long pages, so re-fetch the sections you need. It can't read many PDFs. Copy the PDF into its own scratchpad folder and extract the text with a `python3 -I` script kept elsewhere; there's no `pdftotext` here.
- **Read signals with care.** Top-voted Stack Overflow questions are mostly from 2008–2013, so check newer features against surveys. Download counts are mostly CI traffic: compare tools with them, never count learners.
- **Quizzes:** check where the correct answers sit and how long the options are. (2026-10-16: option 2 was correct in 336 of 491 quizzes, and the correct option was the longest in 64%.) Since 2026-11-01 the build shuffles options (see "Writing quizzes" below), so position no longer matters, but length still does.
- **Predict-first exercises:** quiz ids are positional, so you can't put a "predict" quiz before the existing quizzes. Use a `TryIt` with "decide what it prints, then press Run" instead.
- **Practice links:** check the linked lesson's prerequisites, not just its topic. Several Python problems linked to `working-with-strings`, which comes before `if`, loops and `def`.
- **TypeScript claims:** check compiler output and flag claims with the repo's own compiler (`node node_modules/typescript/bin/tsc`, in the scratchpad). `erasableSyntaxOnly` does not catch decorators, but Node rejects them.
- **Shell and tools:** `grep` here is ugrep. It rejects `--include=*.mdx`, and a pattern starting with `--` needs `-e`. `awk substr` miscounts multibyte symbols like ✅. The Read tool stops at about 25k tokens, so read long lessons with `offset`.
- **Subagents and report files:** the Write tool sometimes refuses a subagent's report-style file (2026-10-16: `research/summary.md`), while ordinary context files are allowed. If that happens, return the full file between `===== BEGIN <path> =====` and `===== END =====` markers, and the main session saves it.
- **Don't claim "no research exists"** without at least one targeted search. If nothing turns up, write "none found" and mark it as an open point.

## Fixing existing content (from the 2026-10-16 Phase 1 run)

- **Version wording that stays true:** don't write "Node X.Y+" for a feature. Write "any supported Node version (N+)", plus the version where it became stable if that matters. When a Node line reaches end of life, update the CI matrix, `engines` and every "Node N+" line together. Take end-of-life dates from github.com/nodejs/Release.
- **Pins with a known switch date:** a pin that's correct today but has a known switch date goes in `gaps.md` with that date, rather than being fixed early. (Node 24 → 26 after 2026-10-28, e.g. `realtime-chat/03` `node:24-alpine`.)
- **TC39 features:** give the stage and the month you checked it (from the tc39/proposals README). Avoid open-ended phrases like "arriving now" or "most engines", and test runtime claims in local Node.
- **Back-references:** for "you met X in lesson Y", grep lesson Y first. If X is first used here, introduce it in one sentence.
- **"You finished Level N" or "next up" lines:** check the `course.yml` order, and move the line to the real last lesson rather than deleting it.
- **A quiz with two correct answers:** change the distractor that's also correct, and keep `answer` as it is, so saved progress stays valid.
- **Practice links:** `lesson:` points to the earliest lesson that teaches everything the hints and solution use (`[::-1]`, `.index`, `sorted(key=)`, closures), not just the topic. In SQL, chaining 3+ tables is first taught in `joins/03-self-joins`, and scalar subqueries in `subqueries/01`.
- **Fixes that also exist on an unmerged branch:** copy that branch's exact line, so the merge stays clean.
- **Python "since 3.x" notes:** check the python.org What's New page, and say which version the claim covers. Don't claim defaults for versions you haven't checked. The site runs Pyodide with CPython 3.14.
- **TypeScript output:** with `strict`, tsc emits `"use strict";` for a file with no import/export, and `export {};` only with `moduleDetection: force`. Generate any shown tsc output from the lesson's exact config.
- **SQL time zones:** PGlite takes its session TimeZone from the learner's machine. Any example that prints `timestamptz`/`tstzrange` values must start with `SET timezone = 'UTC'`. Check by running with `TZ=UTC` and with another time zone.
- **Checking SQL without velite:** use a scratchpad `.mts` script run with `npx tsx`, importing `src/lib/runner/execute-sql.ts`, `sql-seed.ts` and PGlite by absolute path. For claims like "since PG N, X shows up in Y", check `information_schema.sql` on the `REL_N_STABLE` branch, not just the release notes.
- **Shell:** use `perl -Mutf8 -CSD` for Cyrillic patterns; without `-Mutf8` they silently match nothing. `sed -n 'Np'` over several files counts lines across all of them, so loop over the files.
- **Parallel fix runs:** several agents can edit different courses at the same time, but only one may run `npm run content`/vitest (velite builds collide). The main session builds and tests once at the end.
- **RU terms:** TypeScript parameter properties = «свойства-параметры».
- **UI strings (house style from the infra session, 2026-10-16):** English errors say what happened and what to do, with no "Please", and use "Couldn't" rather than "Could not". On touch screens, interactive elements are at least 44px. Small text is `text-white/55` or brighter.

## Writing quizzes (from the 2026-11-01 Phase 2 run)

- **Options are shuffled at build time** (`src/lib/quiz-order.ts`, keyed by `language/slug#quiz-n`; EN and RU share the order, and "Try again" reshuffles). Write the right answer at any `answer` index. **Never refer to an option by position** in options, questions or explanations ("the first option", "both of the above", "A and B"): name its value instead ("the line with `and`").
- **Length must not give the answer away.** The right option should not stand out as the longest (or the shortest). Cut the right answer down to its core claim and move the detail into the explanation. Give each wrong option the same shape: a claim plus its own plausible reason ("TypeError, because async calls need await"). Use the same opening words in every option, and describe every option the same way ("Hi on one line" / "H then i on separate lines").
- **Wrong options are real misconceptions** (the lesson's "Common mistakes", the confusions in research/summary.md and comparison/<course>.md). Before using one, check it can't also be true, and that the question's own setup doesn't contradict it. When a new wrong option teaches a misconception, the explanation gets one sentence on why it's wrong.
- **If one phrase marks the right option** (e.g. "after SET lock_timeout"), add it to the wrong options too, and let the explanation say why that phrase isn't enough.
- **When an exact error message or code must be the right answer,** make the wrong options real-looking error lines or code of the same shape, and run each one (node, python3, PGlite, tsc) to prove it's wrong.
- **RU options run about 10–20% longer than EN:** shorten by restructuring the sentence, not by abbreviating.
- **Quote rules:** inside the `options={[…]}` JS array, `\"` is fine; inside an `explanation="…"` attribute it isn't, so use `{'…'}` there.
- **Parsing quizzes in scripts:** read each `<Quiz` block attribute by attribute with brace and string matching (like `extractQuizzes` in velite.config.ts). A regex up to the first `/>` breaks on JSX inside a question. A checked parser lives in the scratchpad pattern `quizzes.mjs`.
- **Editing many quizzes:** use a script with a table of (file, quiz-n) → new options/explanation that replaces only that array, keeping its one-line or multi-line style. Then rerun the length check and a parse check, and diff against HEAD to prove nothing outside `<Quiz>` changed.

## Terminal lessons (from the 2026-11-01 Git & Terminal Level 0 run)

- Show terminal output with `<CodeExample setup={…} output={…}>` + a ```bash fence: the content tests run every one through the practice terminal and compare (output = stdout and errors in order, no prompts). Paste outputs from a real run, never from memory.
- The practice terminal is our own small bash plus real git (isomorphic-git). Where it differed from real git or bash, fix the runner (`src/lib/runner/shell/`) rather than teaching its quirk: writers compared with real git 2.50 and found git status spacing, git's unpadded date (`Mon Jan 5`), the empty-commit report, ls sorting and `mv file css/` into a missing folder, all fixed. Still different and worth a sentence where it shows: ls prints one line (no columns or colours) and doesn't quote names with spaces.
- Check results, not keystrokes: prefer `file()`, `ls()`, `git.log()`, `git.status()`; use `commands` only when using a specific command is the point (ls -a, git log --oneline).
- Commit hashes are deterministic (sandbox clock), so lessons may show them. Translated commit messages change the hashes: run the RU examples too.
- YAML frontmatter: quote a `description` that contains `: ` (common in RU). An unquoted one breaks `npm run content` for the whole site.
- Branches and merges are hard to picture from text. Every run with a repository draws a **Commits** graph under its output; in the lesson text, `<GitGraph setup={`…`} caption="…" />` draws one at build time (the content tests run each setup). Show the shape before asking the learner to make it, and refer to the picture by its name, "Commits" / «Коммиты».
- Lessons in one module can't link to another module's lessons until those files exist (the link test fails). Writing modules in parallel, link within your module, and add cross-module links in a final pass.

## Working in this repo

- A worktree's `node_modules` is a symlink to `site/node_modules`. After a PR adds a dependency, run `npm install` in `site/` (on main, once it's merged); otherwise every worktree's tests fail with "Cannot find package". (2026-11-01: isomorphic-git was missing after #70.)

- The site owner often has uncommitted work in progress in `src/`, `drizzle/` and `messages/`. Never touch, stage or commit it. If files change during a run, they belong to the owner.

## Checklist before reporting a lesson as done

- [ ] Every `CodeExample` was run and its `output` matches exactly
- [ ] Every `Solution` passes its `tests`, and the `Hint` doesn't give the answer away
- [ ] It uses no concept that comes later in `curriculum.md`
- [ ] The EN and RU versions match: same code, same tests, same quiz answer index
- [ ] `npm run content` and the content tests pass for that language
- [ ] `npx prettier --check` passes on the changed `.md`/`.yml` files
- [ ] Sources are recorded in `sources.md`, and nothing was copied from them
