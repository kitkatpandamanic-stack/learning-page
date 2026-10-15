# Well-known free courses and curricula

Checked 2026-10-15 (research-only run, no comparison with PandaDev yet).

This file covers 27 source entries from 12 providers of free, public curricula in English and Russian. For each one it records the order topics come in, what counts as beginner and what as advanced, where the hard topics sit, and how projects, exercises and feedback work.
Where a site renders its table of contents client-side, I read the open-source structure files instead (freeCodeCamp, Exercism and The Odin Project on GitHub). Everything is summarised in my own words. "n/N sources" counts only the sources that have a syllabus for that language.
Main pattern: free curricula are dense at Levels 0–1, thinner at Level 2, and close to empty at Level 3 (system design, code review and mentoring).

## Sources

| ID  | Name                                            | URL                                                                                                                             | What it is                                                                                              | Date / version checked                                                                                                                                                              |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | freeCodeCamp JavaScript Certification (v9)      | https://github.com/freeCodeCamp/freeCodeCamp/blob/main/curriculum/structure/superblocks/javascript-v9.json                      | Module structure of the new JS cert; announcement at freecodecamp.org/news/...                          | Structure file last commit 2026-10-13; cert announced 2025-12-08                                                                                                                    |
| S2  | freeCodeCamp Python Certification (v9)          | https://github.com/freeCodeCamp/freeCodeCamp/blob/main/curriculum/structure/superblocks/python-v9.json                          | Module structure of the new Python cert                                                                 | Announced 2025-12-15; read 2026-10-15                                                                                                                                               |
| S3  | freeCodeCamp Relational Databases Cert (v9)     | https://github.com/freeCodeCamp/freeCodeCamp/blob/main/curriculum/structure/superblocks/relational-databases-v9.json            | Bash + PostgreSQL + Git cert                                                                            | Announced 2025-12-19; read 2026-10-15                                                                                                                                               |
| S4  | freeCodeCamp Front End Libraries (v9)           | https://github.com/freeCodeCamp/freeCodeCamp/blob/main/curriculum/structure/superblocks/front-end-development-libraries-v9.json | Holds the only fCC TypeScript module                                                                    | Read 2026-10-15                                                                                                                                                                     |
| S5  | The Odin Project: Foundations                   | https://www.theodinproject.com/paths/foundations/courses/foundations                                                            | Web + JS basics course                                                                                  | Read 2026-10-15                                                                                                                                                                     |
| S6  | The Odin Project: JavaScript course             | https://www.theodinproject.com/paths/full-stack-javascript/courses/javascript                                                   | Intermediate JS course                                                                                  | Read 2026-10-15                                                                                                                                                                     |
| S7  | The Odin Project: NodeJS course                 | https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs                                                       | Back-end course (Express, PostgreSQL, Prisma)                                                           | Read 2026-10-15                                                                                                                                                                     |
| S8  | TOP javascript-exercises + curriculum repos     | https://github.com/TheOdinProject/javascript-exercises , https://github.com/TheOdinProject/curriculum                           | Jest exercise repo; lesson sources                                                                      | main branch, 2026-10-15                                                                                                                                                             |
| S9  | CS50P (Harvard, Intro to Programming w/ Python) | https://cs50.harvard.edu/python/                                                                                                | 10-week Python course + final project                                                                   | Submission path says 2022 problems; deadline 2027-06-30                                                                                                                             |
| S10 | CS50x 2026                                      | https://cs50.harvard.edu/x/                                                                                                     | Intro CS (C → Python → SQL → web)                                                                       | 2026 edition                                                                                                                                                                        |
| S11 | CS50 SQL (Intro to Databases with SQL)          | https://cs50.harvard.edu/sql/                                                                                                   | 7-week SQL course, SQLite then PostgreSQL/MySQL                                                         | Links a "What's new for 2024" page; read 2026-10-15                                                                                                                                 |
| S12 | Exercism JavaScript track                       | https://github.com/exercism/javascript/blob/main/config.json                                                                    | Concept tree (prerequisites) + practice exercises                                                       | main, 2026-10-15: 37 concepts, 29 live concept exercises (26 beta, 3 active), 130 active practice                                                                                   |
| S13 | Exercism Python track                           | https://github.com/exercism/python/blob/main/config.json                                                                        | Concept tree + practice                                                                                 | main, 2026-10-15: 67 concepts declared, 17 beta + 3 WIP concept exercises, 129 active practice                                                                                      |
| S14 | Exercism TypeScript track                       | https://github.com/exercism/typescript/blob/main/config.json                                                                    | Practice-only track                                                                                     | main, 2026-10-15: 1 concept exercise (WIP), 108 active practice                                                                                                                     |
| S15 | Exercism SQLite / PL/SQL tracks                 | https://github.com/exercism/sqlite/blob/main/config.json                                                                        | Practice-only puzzle tracks                                                                             | main, 2026-10-15: SQLite 81 practice, 0 concepts; PL/SQL 11, no test runner                                                                                                         |
| S16 | javascript.info                                 | https://javascript.info/                                                                                                        | The Modern JavaScript Tutorial (EN)                                                                     | "Last updated" 2026-10-14                                                                                                                                                           |
| S17 | SQLBolt                                         | https://sqlbolt.com/                                                                                                            | Interactive SQL lessons                                                                                 | Read 2026-10-15 (no version)                                                                                                                                                        |
| S18 | Mode SQL Tutorial (now hosted by ThoughtSpot)   | https://www.thoughtspot.com/sql-tutorial                                                                                        | Analytics-oriented SQL tutorial; mode.com/sql-tutorial redirects here                                   | Read 2026-10-15: Basic 15, Intermediate 20, Analytics 8, Advanced 9 lessons                                                                                                         |
| S19 | PostgreSQL Exercises                            | https://pgexercises.com/                                                                                                        | Graded query problems on one dataset                                                                    | Read 2026-10-15 (no PG version stated)                                                                                                                                              |
| S20 | learn.javascript.ru                             | https://learn.javascript.ru/                                                                                                    | Russian original of javascript.info (same author, same structure)                                       | Updated 14.10.2026                                                                                                                                                                  |
| S21 | Хекслет: Основы JavaScript (free)               | https://ru.hexlet.io/courses/js-basics                                                                                          | 71 lessons, ~25 h                                                                                       | "Программа обновлена в сентябре 2026"                                                                                                                                               |
| S22 | Хекслет: Основы Python (free)                   | https://ru.hexlet.io/courses/python-basics                                                                                      | ~69–70 lessons, ~25 h (page disagrees with itself on the count)                                         | Updated September 2026                                                                                                                                                              |
| S23 | Хекслет: Основы SQL (free)                      | https://ru.hexlet.io/courses/sql-basics                                                                                         | 25 lessons, ~10 h, PostgreSQL                                                                           | Updated September 2026                                                                                                                                                              |
| S24 | Хекслет: TypeScript (paid; outline is public)   | https://ru.hexlet.io/courses/typescript-basics                                                                                  | Outline only. No free Hexlet TS course found                                                            | Read 2026-10-15                                                                                                                                                                     |
| S25 | Яндекс Хендбук «Основы Python»                  | https://contest.yandex.ru/tracks/python                                                                                         | Free interactive textbook + Yandex Contest checker (education.yandex.ru/handbook/python redirects here) | Read 2026-10-15. No JS or SQL handbook on the tracks list                                                                                                                           |
| S26 | Stepik «Поколение Python»: для начинающих       | https://stepik.org/course/58852/promo                                                                                           | Most popular free RU Python course                                                                      | **Stepik returned 502 on 2026-10-15**; facts from search snippets of the course page and a Habr Career listing (https://career.habr.com/courses/besplatnye/programmirovanie/python) |
| S27 | Metanit: Руководство по Python                  | https://metanit.com/python/tutorial/                                                                                            | Long-form RU reference tutorial, no checked exercises                                                   | "Последнее обновление: 13.09.2026"                                                                                                                                                  |

## JavaScript

Syllabus sources: S1, S5/S6/S7, S12, S16/S20, S21 (5 independent syllabi: fCC, TOP, Exercism, javascript.info and learn.javascript.ru counted as one, Hexlet).

### Typical topic order, Levels 0–1

| Course                    | Order (→ = comes before)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| javascript.info [S16/S20] | console → variables → types → prompt/alert → type conversion → operators → comparisons → `if`/`?:` → logical ops → `??` → loops → `switch` → functions → function expressions → arrows → **code quality** (debugger, style, Mocha tests) → objects (references, `this`, `new`, `?.`) → primitives' methods, numbers, strings, arrays, array methods, iterables, Map/Set, destructuring, JSON → recursion → rest/spread → **closure** → `var` → timers → call/apply/bind → prototypes → classes → errors → promises/async → generators → modules |
| TOP [S5→S6]               | (HTML, CSS, Git, command line first) → variables/operators → install Node → types & conditionals → DevTools → functions → problem solving → reading errors → _project_ → clean code → loops & arrays → DOM & events → _project_ → object basics → _project_ ‖ JS course: objects & constructors → factory functions + **closures** + module pattern → classes → ES modules, npm, bundler → JSON → OOP principles → linting → async → testing → recursion & complexity                                                                           |
| fCC v9 [S1]               | variables & strings → numbers, operators, comparisons, conditionals → functions (incl. scope, arrows) → arrays → objects (JSON, `?.`, destructuring) → loops → "fundamentals review" (`var`/hoisting, modules, rest params, **closures**, linters) → higher-order functions → DOM → a11y → debugging → regex → forms → dates → Map/Set → localStorage → classes → recursion → data structures → algorithms → graphs → DP → functional programming → **async**                                                                                   |
| Exercism [S12]            | basics → booleans / numbers / strings → arrays, comparison, conditionals → for/while/switch → objects → null/undefined → functions, type conversion → callbacks, **closures**, destructuring, template strings → arrows, array methods, classes, rest/spread → errors, inheritance, recursion, regex, sets, dates → **promises** (deepest node)                                                                                                                                                                                                 |
| Hexlet [S21]              | hello world, statements, syntax errors → arithmetic (+ **linter** lesson) → strings → variables (naming, magic numbers, constants) → interpolation, slicing → types (undefined, weak typing, immutability, conversion) → **calling** functions → objects & method chaining → **defining** functions (+ modules, packages) → booleans → `if`/ternary/`switch` → loops (+ debugging)                                                                                                                                                              |

Consensus order: values/operators → conditionals → loops/functions/arrays (order varies) → objects. Conditionals come before loops in 5/5 and objects after arrays in 4/4 that have both. Exceptions are Hexlet (functions before conditionals) and Exercism (function stubs from exercise 1, because tests call functions).

### Level 0

- **Arrays vs loops:** arrays come before or alongside loops in 3/5 (fCC, TOP, Exercism). javascript.info teaches loops in the fundamentals and arrays much later, under data types. Hexlet's free course has no arrays at all; they live in its paid follow-ups [S1][S5][S12][S16][S21].
- **Functions early:** Exercism has learners write functions from exercise 1. Hexlet has them _call_ built-in functions before they write their own. "Function first" thinking appears in 3/5 (Exercism, Hexlet, fCC: functions module before arrays) [S1][S12][S21].
- **Type conversion and coercion:** a named Level 0 topic in 4/5. fCC has a "debug type coercion errors" lab, javascript.info a chapter, Hexlet "слабая типизация", Exercism a `type-conversion` concept [S1][S12][S16][S21].
- **`??` and `?.`:** javascript.info teaches `??` among the fundamentals and `?.` with objects. fCC teaches `?.` with objects [S1][S16].
- **`var` and hoisting:** taught as legacy ("why not to use it") after `let`/`const`, and late: fCC in the review module, javascript.info after closures [S1][S16].
- **Tooling at L0:** TOP has learners install Node and use DevTools in the first JS weeks [S5]. Hexlet teaches a linter in lesson ~14 [S21]. javascript.info puts debugging, style and Mocha tests right after fundamentals [S16]. 3/5 introduce some quality tooling before objects.
- **Problem solving and reading errors:** TOP has dedicated lessons ("Problem Solving", "Understanding Errors") before the first project [S5]. Hexlet has "Синтаксические ошибки" in module 1 [S21].

### Level 1

- **Objects before classes:** 4/4 that teach classes (Hexlet basics has none). TOP goes constructors → factory functions → classes → OOP principles [S6]. javascript.info goes objects → prototypes → classes, and puts prototypes _before_ class syntax [S16]. fCC teaches classes late, after localStorage [S1].
- **Closures:** placed after functions and arrays in 4/4 that cover them (Hexlet basics doesn't), but framed differently.
  - javascript.info: a long chapter built on a "Lexical Environment" model with many diagrams and 10 tasks. It comes right after recursion and rest/spread [S16].
  - TOP: closures are taught inside the factory functions / module pattern lesson as the way to get private state, with external readings (MDN, Wes Bos) [S6][S8].
  - fCC: one short lecture (~760 words incl. code), paired with memory management in the fundamentals-review module, before higher-order functions [S1].
  - Exercism: the closures exercise needs only arrays + functions as prerequisites [S12].
  - Hexlet basics: absent.
- **Higher-order functions / array methods:** fCC gives them a whole module (callbacks with `forEach`, then map, filter, reduce, chaining, sort, every/some) [S1]. Exercism makes callbacks a prerequisite for arrow functions and array methods [S12].
- **Modules and packages:** TOP covers ES modules + npm + a bundler (Webpack) in the JS course, followed by a project [S6]. Hexlet mentions modules and packages in beginner function lessons [S21]. javascript.info leaves modules to the end of Part 1 [S16].
- **Errors:** javascript.info has try/catch and custom errors after classes [S16]. Exercism ties errors to inheritance [S12]. TOP introduces reading error messages at L0 [S5].
- **Recursion:** this varies widely. javascript.info opens "advanced functions" with recursion and the call stack [S16]. TOP puts it in "A Bit of Computer Science", after testing, with a project [S6]. fCC puts it after classes, followed by data structures and algorithms [S1]. Exercism puts it late (it needs destructuring and array transformations) [S12]. 2/4 (TOP, fCC) treat it as a CS/algorithms topic rather than a "functions" topic.
- **DOM:** TOP (Foundations) and fCC (after HOFs) teach DOM + events at L0–L1. javascript.info keeps the browser in Part 2 [S1][S5][S16].

### Level 2

- **Async order:** callbacks → promises → `async/await` → fetch/APIs in 4/4 that cover it [S1][S6][S12][S16].
  - TOP: an async lesson, then APIs, then async/await, then a Weather App project [S6].
  - javascript.info: callbacks → promise → chaining → error handling → Promise API → promisification → microtasks → async/await [S16].
  - fCC: async is the **last** module of the cert. It covers sync vs async, script `async`/`defer`, fetch, promises, async/await, and engine/runtime, and is followed by a Weather App certification project [S1].
- **Event loop:** never a standalone Level 1 lesson. javascript.info explains microtasks in Part 1 but keeps "Event loop: microtasks and macrotasks" in the browser part [S16]. TOP delegates it to two external videos [S6][S8]. fCC folds it into one "engine and runtime" lecture [S1].
- **Testing:** TOP puts "Testing Basics" + a testing-practice project + "More Testing" after async [S6]. In fCC, testing is a module of the Front End Libraries cert, not of the JS cert [S4]. javascript.info has an early Mocha chapter [S16]. 2/3 place testing after async (TOP, fCC); javascript.info puts it early.
- **Back end:** TOP NodeJS: Node intro → env variables → Express (routes, controllers, views) → deployment → forms → PostgreSQL → auth → Prisma ORM → API basics + API security → testing routes and DB → full-stack projects → final project [S7].

### Level 3

- **Senior topics are rare.** The closest items are TOP's API security and DB testing [S7], fCC's single lecture on code reviews, branching, deployment and CI/CD (inside the Relational DB cert) [S3], and javascript.info's Proxy/Reflect, WeakRef/FinalizationRegistry and GC notes [S16]. None of the 5 JS sources has a system-design, architecture or mentoring module.

### Cross-level

- **Project cadence:** TOP has a project every 3–5 lessons, unchecked and shared with the community, ending in Battleship (JS course) and Odin-Book (Node) [S5][S6][S7]. fCC has many "workshops" (guided, step-by-step) and "labs" (user stories + tests) inside each module, plus 5 certification projects and a 50-question exam [S1].
- **CS50x** teaches JavaScript only in Week 8 (HTML/CSS/JS) after C, Python and SQL. That suits learners switching languages, not newcomers [S10].

## Python

Syllabus sources: S2, S9, S13, S22, S25, S26, S27 (7).

### Typical topic order, Levels 0–1

| Course                 | Order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CS50P [S9]             | W0 functions **and** variables (`def`, return values, f-strings, int/float) → W1 conditionals → W2 loops (with lists/dicts) → W3 **exceptions** → W4 libraries (modules, pip, APIs) → W5 **unit tests** (pytest) → W6 file I/O → W7 regex → W8 OOP → W9 "et cetera" (sets, globals, constants, type hints, docstrings, argparse, unpacking, `*args/**kwargs`, map/filter, comprehensions, `enumerate`, generators)                                                                                        |
| fCC v9 [S2]            | basics (variables, types, strings, numbers, booleans + conditionals, **functions and scope**) → installing Python → loops & sequences (lists, tuples, range, enumerate/zip, comprehensions, lambdas) → dicts & sets + modules → _cert project_ → error handling (common errors, debugging, try/except, raise) → classes → _cert project_ → OOP pillars → _cert project_ → linear data structures → _cert project_ → recursion → searching/sorting → _cert project_ → graphs & trees → dynamic programming |
| Exercism [S13]         | basics (incl. `def`) → bools, numbers → conditionals → comparisons, strings → lists, string methods → list methods → loops → string formatting, tuples → dicts → dict methods, sets, unpacking → classes, None → enums, generators                                                                                                                                                                                                                                                                        |
| Hexlet [S22]           | hello world, comments, statements, syntax errors → arithmetic (+ linter) → strings → variables → interpolation, slicing → types (tuples, strong typing, immutability, conversion) → calling functions → methods → defining functions (named args, **type annotations**, modules, packages) → logic → `if`/`elif`/ternary/**`match`** → `while`, `for`, `range`, debugging                                                                                                                                 |
| Yandex Handbook [S25]  | intro + checker → I/O, conditions, loops → collections (str, tuple, list, set, dict) + **memory model** + files + JSON → functions (scope, params, recursion, decorators, generators) → OOP (classes, magic methods, inheritance, exceptions, modules) → libraries (math, NumPy, pandas, requests, APIs)                                                                                                                                                                                                  |
| Поколение Python [S26] | (per a Habr article summary, not checked against the live syllabus) I/O → conditional operator → data types → `for`/`while` → strings → lists. Functions are **not** confirmed in the beginners' course; the free "для продвинутых" sequel continues                                                                                                                                                                                                                                                      |
| Metanit [S27]          | intro → basics → **OOP** → exceptions → lists/tuples/dicts → modules & packages → strings → pattern matching → files → dates → threads, multiprocessing, **asyncio**                                                                                                                                                                                                                                                                                                                                      |

Consensus: values → conditionals → loops → collections → functions → errors → OOP. Where functions go is the big difference: CS50P, fCC and Exercism write `def` in the first unit, while Yandex and Поколение wait until after collections (3 vs 2–3 sources). The two oldest-style RU sources (Поколение, Yandex) start from `input()`/`print()` I/O, like olympiad-style task sets.

### Level 0

- **I/O-first:** Поколение Python and Yandex Handbook start with `input()`/`print()` and stdin/stdout task checking [S25][S26]. CS50P starts with `input()` too, but inside `def main()` from week 0 [S9]. fCC and Exercism are function-and-return based, checked by tests [S2][S13].
- **`match`:** Hexlet's beginner conditionals include `match` [S22], and Metanit has a pattern-matching chapter [S27]. CS50P, fCC and Exercism don't list it at L0 (2/7).
- **Type hints at L0:** Hexlet teaches type annotations among the beginner function lessons [S22]. CS50P puts them in the final "et cetera" week [S9]. The others don't name them at L0.
- **Volume of practice:** RU platforms are high-volume: Поколение has 500+ auto-checked tasks [S26], and Hexlet has one trainer exercise + one quiz per lesson, ~69 each [S22]. CS50P has ~5 problems per week [S9].

### Level 1

- **Exceptions early:** CS50P week 3, before libraries and tests [S9]. fCC teaches errors and debugging right after dicts/sets [S2]. Yandex groups exceptions with OOP [S25]. Metanit puts them right after OOP [S27]. 4/4 that cover them (CS50P, fCC, Yandex, Metanit) place exceptions before or right next to classes.
- **OOP placement:** late in CS50P (W8), Exercism (depth 11 of 12) and Yandex (ch. 5) [S9][S13][S25]. fCC gives two modules: classes, then encapsulation / inheritance / polymorphism / abstraction [S2]. Metanit is the outlier, with OOP as chapter 3, before lists [S27].
- **Comprehensions, lambdas, `enumerate`/`zip`:** fCC teaches them with lists at L0–1 [S2]. CS50P saves them for the final week [S9].
- **Recursion:** fCC gives recursion its own module after linear data structures [S2]. Yandex puts it in the functions chapter [S25]. Neither CS50P nor Exercism names it in the syllabus.
- **Closures / decorators:** no Python source has a lesson named "closures". Decorators appear in Yandex's functions chapter [S25] and in CS50P's OOP week (properties) [S9].
- **Generators:** taught late everywhere they appear: CS50P last week, Exercism deepest node, Yandex functions chapter [S9][S13][S25].
- **Tooling:** fCC has a separate "Python installation" module after basics, since code runs in the browser until then [S2]. CS50P teaches pip/libraries in W4 [S9]. Hexlet introduces a linter at L0 [S22].

### Level 2

- **Testing:** only CS50P makes unit testing (pytest) a core week (W5), and its final project _requires_ pytest tests for 3 functions [S9]. fCC Python and Exercism expose tests (learners pass them) but don't teach writing them [S2][S13].
- **Async (`asyncio`):** 1/7 (Metanit, final chapter) [S27]. CS50P, fCC, Exercism, Hexlet basics and the Yandex chapter list don't cover it.
- **Files, regex, APIs:** CS50P W4 (requests/APIs), W6 (CSV, images), W7 (regex) [S9]. Yandex covers files + JSON with collections, and requests in the libraries chapter [S25].
- **Algorithms emphasis:** fCC Python v9 is half algorithms and data structures: linked list, hash table, binary search, merge/quick/selection sort, BFS/DFS, N-queens, DP [S2].

### Level 3

- **None of the 7 Python sources** covers architecture, performance profiling, security or code review. The deepest items are Metanit's threads/multiprocessing/asyncio [S27] and Yandex's NumPy/pandas [S25].

### Cross-level

- **CS50P final project:** `project.py` with `main` + ≥3 top-level functions, `test_project.py` with pytest tests for ≥3 of them, `requirements.txt`, a README of ~500 words, and a ≤3-minute video [S9].
- **fCC cert projects** come between modules (user configuration manager, budget app, polygon area calculator, hash table, Tower of Hanoi). The Python editor runs in the browser [S2].

## TypeScript

Syllabus sources are scarce: S4 (fCC module) and S24 (Hexlet, paid but with a public outline). Exercism TS has no concept syllabus [S14]. TOP has no TypeScript lesson files in its curriculum repo [S8]. javascript.info and learn.javascript.ru don't cover TS [S16][S20]. Expect the official TS handbook (another agent's group) to be the main reference.

### Level 0

- **Prerequisite:** both syllabi assume JS first. fCC puts TS after React, performance, testing and CSS frameworks [S4]. Hexlet sells TS as a separate skill after its JS track [S24].
- **First topics (fCC):** what TS is and why industry uses it → primitive types → function types → object and array types [S4]. Hexlet starts the same way: first program → variables, functions, basic types → data types and structures [S24].

### Level 1

- **Type composition:** fCC groups `any`/`unknown`/`never`/`void`, unions, interfaces, type aliases and type assertions in one lecture block [S4]. Hexlet part 1 ends with "type combinations", then structural typing and **variance** (covariance/contravariance) [S24].
- **tsconfig:** fCC gives it its own lecture near the end of the module [S4].

### Level 2

- **Generics:** placed after type composition in 2/2. fCC pairs generics with **type narrowing** in one lecture [S4]. Hexlet puts generics in "part 2" (advanced), with classes, index signatures, **mapped types**, interfaces + `implements`, `Record`, and static/abstract classes [S24].

### Level 3

- **No free source** found for advanced type-level programming (conditional types, `infer`, template literal types), declaration files or TS-specific build/perf topics.

### Cross-level

- **Practice style:** Exercism TS is pure practice: 108 active test-driven puzzles, no concept tree [S14]. fCC uses workshops (type-safe user profile, math toolkit, shape manager, …) and labs [S4].

## SQL

Syllabus sources: S3, S11, S17, S18, S19, S23 (6). The Exercism SQLite track is algorithm puzzles (leap year, Luhn, roman numerals…) solved in SQL, not a database syllabus [S15].

### Typical topic order, Levels 0–1

| Course                  | Order                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQLBolt [S17]           | SELECT → WHERE (2 parts) → ORDER BY/LIMIT → review → **INNER JOIN** → OUTER JOIN → **NULL** (right after outer joins) → expressions → aggregates (2 parts) → **order of execution** → INSERT/UPDATE/DELETE → CREATE/ALTER/DROP → extra topics: subqueries, UNION/INTERSECT/EXCEPT                                                                                                                                                                                                                                                                                                                           |
| Mode [S18]              | Basic: SELECT, WHERE, operators, LIKE, IN, BETWEEN, **IS NULL**, AND/OR/NOT, ORDER BY → Intermediate: aggregates, GROUP BY, HAVING, **CASE**, DISTINCT, joins (inner, outer, self), UNION → Analytics training → Advanced: data types, dates, strings, subqueries, **window functions**, performance tuning, pivoting. Section labels confirmed for IS NULL (Basic), CASE and INNER JOIN (Intermediate), window functions (Advanced); full per-lesson order from memory of the site plus secondary sources                                                                                                  |
| CS50 SQL [S11]          | W0 querying (SELECT, LIMIT, WHERE, **NULL**, LIKE, ranges, ORDER BY, aggregates) → W1 relating (ER diagrams, primary/foreign keys, subqueries, IN, **JOIN** incl. outer, set ops, GROUP BY) → W2 designing (normalising, CREATE TABLE, types/affinities, table and column constraints, ALTER) → W3 writing (INSERT, DELETE, UPDATE, triggers, soft deletes) → W4 viewing (views, **CTE**, partitioning, securing) → W5 optimizing (indexes and trade-offs, partial index, VACUUM, **transactions, race conditions**) → W6 scaling (MySQL, PostgreSQL, stored procedures, access control, **SQL injection**) |
| pgexercises [S19]       | Basic (SELECT/WHERE, CASE, UNION, simple aggregates; 12) → **joins & subqueries** → modifying data → aggregates (22; the later ones, such as running count, numbering, ranking, top-3, thirds and rolling average, are window-function problems by their titles) → dates → strings → **recursive** queries                                                                                                                                                                                                                                                                                                  |
| Hexlet Основы SQL [S23] | DB architecture → psql → types → primary keys/autoincrement → SELECT → WHERE + **NULL** → LIKE/regex → complex conditions → ORDER/LIMIT → DISTINCT → aggregation/grouping → INSERT/UPDATE → constraints → ALTER → **transactions**. The listed topics include **no JOIN**                                                                                                                                                                                                                                                                                                                                   |
| fCC Relational DB [S3]  | code editors → Bash basics → relational DBs (what/why, Postgres, CREATE, types, INSERT/SELECT, **primary/foreign keys, relationship types, joins**) → _cert: celestial bodies DB_ → Bash scripting → SQL + Bash (normalisation, **SQL injection**, **N+1**) → _cert: World Cup DB, salon scheduler_ → nano + Git (incl. code review / CI/CD lecture) → _cert: periodic table, number guessing game_                                                                                                                                                                                                         |

### Level 0

- **Read before write:** SELECT/WHERE/ORDER BY come first in 5/6, and DML/DDL come after querying in SQLBolt, CS50 SQL and Hexlet [S11][S17][S23]. fCC is the schema-first exception: it creates tables in the first SQL lecture [S3].
- **NULL is introduced early** in 5/6: with WHERE in Mode, CS50 SQL and Hexlet; in pgexercises' basics; in SQLBolt right after outer joins, which is where NULLs naturally appear [S11][S17][S18][S19][S23]. CS50 SQL notes that `COUNT` skips NULLs [S11].
- **Joins vs aggregates:** aggregates come first in 3 (Mode, CS50 SQL, Hexlet), joins first in 2 (SQLBolt, pgexercises). fCC puts joins inside its first SQL lecture [S3]. There is no consensus.
- **"Order of execution"** of a query (FROM → WHERE → GROUP BY → … → ORDER BY) is its own lesson in SQLBolt, placed right after aggregates [S17].

### Level 1

- **Keys and relationships:** CS50 SQL teaches ER diagrams + PK/FK before JOIN [S11]. fCC teaches PK/FK → relationship types → joins in one lecture [S3]. Hexlet has primary keys but no FK or join in the free course [S23].
- **Outer joins:** SQLBolt gives a full lesson [S17]. CS50 SQL shows only LEFT JOIN with an example; RIGHT and FULL get a one-line mention [S11].
- **Subqueries:** an "extra topic" in SQLBolt [S17], Advanced in Mode [S18], W1 (before JOIN) in CS50 SQL [S11]. Placement varies from L1 to L2.
- **Set operations** (UNION/INTERSECT/EXCEPT): in 4/6 (SQLBolt topics, Mode, CS50 SQL W1, pgexercises Basic) [S11][S17][S18][S19].
- **Constraints and schema design:** CS50 SQL W2 (normalising, table and column constraints) [S11]. Hexlet covers constraints and ALTER [S23]. fCC teaches normalisation [S3].

### Level 2

- **Window functions:** present in 2/6. Mode treats them as Advanced; pgexercises puts them late in Aggregates [S18][S19]. They are absent from SQLBolt, Hexlet basics, fCC lecture titles and the CS50 SQL notes I checked (W0, W1, W4; W4's "partitioning" looks like splitting data into views, not `OVER (PARTITION BY)`, but this is unconfirmed) [S3][S11][S17][S23].
- **CTEs:** CS50 SQL W4 (with views) [S11]. pgexercises has recursive CTEs as its final category [S19]. Not found in SQLBolt or Hexlet basics.
- **Transactions:** Hexlet's last basics topic [S23]. CS50 SQL W5 adds race conditions [S11]. 2/6 cover them.
- **Views and triggers:** CS50 SQL only (W3 triggers, W4 views + soft deletes) [S11].

### Level 3

- **Indexes and performance:** CS50 SQL W5 covers indexes, their space/time trade-offs, partial indexes and VACUUM [S11]. Mode has performance tuning in Advanced [S18]. That makes 2/6.
- **Security:** SQL injection appears in CS50 SQL W6 and in fCC (along with N+1) [S3][S11]. Access control appears in CS50 SQL W6 [S11].
- **Scaling and engines:** CS50 SQL starts on SQLite and ends with PostgreSQL/MySQL, stored procedures and "scaling" [S11]. No source covers replication, sharding or query-plan reading (EXPLAIN) in depth (EXPLAIN not confirmed in Mode's tuning lesson).

### Cross-level

- **Fixed dataset vs evolving schema:** pgexercises uses one small country-club dataset (members, facilities, bookings) for every question, and warns that the schema is deliberately flawed [S19]. SQLBolt uses a movies table per lesson [S17]. fCC builds a new DB per project [S3].
- **Environment:** fCC's SQL work runs in a Linux VM or Codespaces, not the browser [S3]. CS50 SQL uses a terminal SQLite [S11]. SQLBolt, Mode and pgexercises run in the browser [S17][S18][S19].

## Takeaways for PandaDev

1. **The level split is lopsided everywhere.** All 12 providers are dense at Levels 0–1, a few reach Level 2 (async, testing, transactions, indexes), and none has a real Level 3 module on system design, architecture, code review or mentoring. The nearest are single lectures (fCC code review/CI, CS50 SQL injection/access control) [S3][S11].
2. **Two styles of exercise exist.** One is test-driven tasks where the learner writes a function and passes tests (fCC labs, Exercism, Hexlet trainer, TOP's Jest repo, CS50 check-style psets) [S1][S8][S12][S21]. The other is guided step-by-step building (fCC workshops) [S1]. fCC deliberately pairs them: a workshop first, then a lab on the same skill.
3. **Lessons are short and checked often.** fCC lectures are short with 3 comprehension questions each, a 20-question quiz per module (18 to pass) and a 50-question exam [S1]. Hexlet has one exercise + one quiz per lesson, ~20 min each (~70 lessons ≈ 25 h) [S21][S22]. SQLBolt gives ~4 paragraphs of theory, then tasks that must all pass before moving on, with a per-task solution reveal [S17]. javascript.info is the long-form exception (closure chapter ~20–30 min, 10 tasks rated by importance with collapsible solutions) [S16].
4. **Projects are frequent and small, then capstone-shaped.** TOP has a project every 3–5 lessons. fCC has 5 cert projects per cert. CS50P/CS50x end with a self-chosen project that needs a README (~500/~750 words) and a ≤3-minute video, and CS50P also requires pytest tests. CS50x allows AI if cited [S5][S6][S9][S10].
5. **Hard topics are placed fairly consistently:**
   - Closures come after functions + arrays and before async (4/4 JS sources that cover them). Some teach them as a model (javascript.info diagrams), others for what they're for (TOP: private state in factories).
   - The event loop is never a first-class beginner lesson; it gets folded into async or delegated to videos.
   - Promises are the deepest node in Exercism JS [S1][S6][S12][S16].
6. **Python sources disagree on when to define functions** (week 0 in CS50P, fCC and Exercism; after collections in Yandex and Поколение). Most leave OOP late, and almost none cover `asyncio` (1/7) or teach writing tests (CS50P only) [S2][S9][S13][S25][S26][S27].
7. **SQL has no agreed order for joins vs aggregates** (3 vs 2). It agrees on read-before-write (5/6) and early NULL (5/6). Window functions and CTEs are "advanced" where they appear at all (2/6), and the deepest free treatment of indexes, transactions and injection is CS50 SQL [S11][S17][S18][S19][S23].
8. **TypeScript is the least-served language** in free curricula. There are two syllabi (fCC module, Hexlet paid outline), both assume JS first and put generics in the second half. Exercism TS is practice-only and TOP has no TS lessons [S4][S8][S14][S24].
9. **What the Russian-language courses do differently** [S21–S27]:
   - Hexlet introduces a **linter, naming styles, "magic numbers" and determinism** at Level 0. It teaches _calling_ functions before conditionals and has a lesson on how solutions are checked.
   - Поколение Python and the Yandex Handbook are I/O-driven with very high task volume (500+ auto-checked tasks). Поколение unlocks forum hints only after 3 failed attempts.
   - Yandex teaches a **memory model** with collections.
   - Metanit puts OOP before lists and ends with asyncio.
   - learn.javascript.ru is the original of javascript.info, so EN and RU JS learners share the same reference structure.
   - Free RU SQL (Hexlet) stops before JOINs.
10. **The engines in use matter for SQL.** Sources split between SQLite (CS50 SQL start), PostgreSQL (fCC, Hexlet, pgexercises) and dialect-light browser engines (SQLBolt). Mode's material is analytics-flavoured (pivoting, dates, window functions) [S3][S11][S17][S18][S19][S23].

## Not confirmed

- Поколение Python's live module list: Stepik returned 502 on 2026-10-15. Whether functions are in the beginners' course is unconfirmed.
- Mode/ThoughtSpot full per-lesson order: the site lists only section counts. Section placement was checked page by page for IS NULL, CASE, INNER JOIN and window functions only.
- Whether pgexercises checks answers automatically, and which exact Aggregates exercises use window functions (inferred from titles).
- CS50P lecture lengths and the check50 grading details. They aren't stated on the pages read.
- Whether CS50 SQL's W4 "partitioning" means window functions (probably not).
