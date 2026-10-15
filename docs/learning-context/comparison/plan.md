# Improvement plan: from the comparison

Compiled 2026-10-16 from [javascript.md](javascript.md), [python.md](python.md), [sql.md](sql.md), [typescript.md](typescript.md) and [learning-experience.md](learning-experience.md), which compare PandaDev with the [research summary](../research/summary.md). Each item below links back to the file with the evidence, line numbers and details.

## Verdict

- **Levels 2–3 are PandaDev's big strength.** No free course in the research comes close at Middle and Senior (security, system design, architecture, tests that catch planted bugs). The TypeScript and SQL courses are current with TS 6/7 and PostgreSQL 18.
- **Coverage is nearly complete.** Across 130 consensus topics, only 3 are missing: JS Dates, TS decorators, and Python packaging/publishing. JS recursion is written but not merged.
- **The weak spots are at the start and inside lessons, not in the topic list:**
  - Classic traps and core ideas come too late: closures/`this` (JS), `is` vs `==` and aliasing (Python), `CASE` and injection (SQL).
  - Quiz answers are easy to guess: option 2 is correct in 336 of 491 quizzes.
  - Hints give away the code.
  - There's no "predict, then run".
  - Some Level 0 tests only check printed output.

| Course     | ✅ at level | ↑ later | ↓ earlier | ◐ partial | ❌ missing | ⏳ pending |
| ---------- | ----------- | ------- | --------- | --------- | ---------- | ---------- |
| JavaScript | 17          | 6       | 0         | 11        | 1          | 1          |
| Python     | 20          | 5       | 1         | 7         | 1          | 0          |
| SQL        | 17          | 4       | 4         | 9         | 0          | 0          |
| TypeScript | 15          | 3       | 3         | 4         | 1          | 0          |

Design-rules scorecard (16 rules): ✅ 3 · ◐ 11 · ❌ 1 (Parsons problems) · n/a 1 (AI help).

## Phase 1: fix what's wrong (content only, effort S, one PR)

All of these are verified, with file and line in the course files. Each one is fixed in EN and RU.

| #   | Fix                                                                                                                                                                                                         | Where                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1.1 | Python: "different types are never equal" (`1 == 1.0` is True); "That completes Python Junior" when 2 L1 modules follow; a quiz with two correct answers; the f-string quotes callout (outdated since 3.12) | [python.md](python.md)                   |
| 1.2 | JS: 4 dated lines (e.g. "Node 20.6+", but Node 20 is end of life) and 3 internal slips (e.g. `closest()` vs `matches()`)                                                                                    | [javascript.md](javascript.md)           |
| 1.3 | TS: the "not erasable" list leaves out decorators; compiler output the compiler doesn't produce; TS 7 described as upcoming; a CI matrix with Node 20                                                       | [typescript.md](typescript.md)           |
| 1.4 | SQL: 8 lines of `timestamp` → `timestamptz`; EXPLAIN BUFFERS is on by default in PG 18; one RU meaning slip. Check the `information_schema` NOT NULL claim before changing it                               | [sql.md](sql.md)                         |
| 1.5 | Practice links that point before the concepts they need: Python 01, 06, 13, 14, 18, 20; SQL 10, 16, 17, 20                                                                                                  | [python.md](python.md), [sql.md](sql.md) |

## Phase 2: make exercises and quizzes teach (content only, effort M, best-backed by research)

| #   | Change                                                                                                                                                                                            | Why                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 2.1 | **Quiz cues:** rewrite the ~190 correct options that are clearly longer than the distractors, and build distractors from known misconceptions                                                     | 68% of answers are option 2 and 64% are the longest. Guessable quizzes waste retrieval practice, the best-backed method |
| 2.2 | **Graduated hints:** split each lesson's single hint into nudge → concept → partial code (`<HintSteps>` already exists in practice). Add hints to the 9 exercises that have none. Start with L0–1 | 275 of 286 exercises have one hint, usually most of the code                                                            |
| 2.3 | **Predict, then run** at L0–1: one `TryIt` per lesson with "decide what it prints, then press Run"                                                                                                | Predict-before-run and tracing come before writing in the research. PandaDev has none                                   |
| 2.4 | **Real tests at L0:** 6 JS and 6 Python exercises only check printed output (including two Python mini-projects)                                                                                  | Weak tests pass wrong solutions                                                                                         |
| 2.5 | **Test names that say what to try next** (content side of better feedback)                                                                                                                        | Feedback that says what's wrong and what to do next beats right/wrong                                                   |

## Phase 3: teach the top confusions head-on, at the right level (content only, effort S–M)

| #   | Course | Change                                                                                                                                          |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Python | `is` vs `==`, `[[0]*n]*m` aliasing and mutable defaults at L1 (`collections/01`). `x == 1 or 2`, removing while looping and `0.1 + 0.2` at L0–1 |
| 3.2 | SQL    | `CASE` at L0–1 (new lesson); `=` vs `==`/`IS`, and DISTINCT on a key; latest row per group at L1; parameters/injection earlier than L3          |
| 3.3 | JS     | Closures and `this`/`bind` at L1 (now L2–3)                                                                                                     |
| 3.4 | TS     | String-key indexing (TS7053, `Object.keys` → `string[]`); `as const` and `satisfies` at L1                                                      |

## Phase 4: new lessons and restructuring (content only, effort M–L)

| #   | Change                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1 | JS: merge recursion and **split it** (2.3× the median length); an L0 arrays intro with `for…of` vs `for…in`; L0 debugging; L1 Dates with a Temporal preview; later a Node/databases module |
| 4.2 | TS: explain `map`/`filter`, the ternary and spread before L0 uses them; a short L1 lesson on enums → `as const`; a TS 6→7 migration section; split the 9 lessons over 5,000 words          |
| 4.3 | Python: `modules-and-packages/03` on `pyproject.toml`, uv and Ruff; an exercise for the pip lesson; a thicker L0 (360–522 words, one quiz per lesson)                                      |
| 4.4 | SQL: mini-projects for the 14 modules without one, L0–1 first                                                                                                                              |
| 4.5 | All courses: introduce Git, testing, HTTP and code review one level earlier, and AI-assisted coding (taught as hints-not-answers use) at L2–3                                              |

## Needs the infra session (app code, free to run)

| #   | Change                                                                                                                                                                                          | Effort |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| A1  | Shuffle quiz options in lessons and in review                                                                                                                                                   | S      |
| A2  | Show expected vs got when a test fails                                                                                                                                                          | S–M    |
| A3  | Pay XP for solving, not clicking: lesson XP after the exercise, less XP after opening the solution, and streak days that need real activity. 57% of course XP is now paid for "Complete lesson" | S–M    |
| A4  | A placement check / "Coming from JavaScript?" fast track (needs content too)                                                                                                                    | M      |
| A5  | A hidden-output mode for `CodeExample` (cleaner predict-then-run than TryIt)                                                                                                                    | S      |
| A6  | SQL sample database: `serial`/`timestamp` → identity/`timestamptz` (`src/lib/runner/sql-seed.ts`)                                                                                               | S      |

## Suggested order

1. **Phase 1** first: one small PR, and wrong facts are the worst kind of gap.
2. **Phase 2.1 + 2.2 + A1**: quizzes and hints are where the evidence is strongest, and every lesson benefits.
3. **Phase 3**, course by course, then **Phase 4**, which feeds the content-writer agent one lesson at a time.
4. Send **A1–A6** to the infra session whenever the site owner approves them.
