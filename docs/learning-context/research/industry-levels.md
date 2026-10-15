# What the industry expects at each level

Checked 2026-10-15 by the learning-architect (research-only run, no comparison with PandaDev yet).

Overview: this file records what public roadmaps (roadmap.sh), public engineering career ladders (Dropbox, GitLab,
Engineering Ladders, AvitoTech), interview-prep guides and Russian-language grade descriptions (Habr Career, Tproger,
Habr, Журнал «Код») say a developer should know at each level. Everything is summarised in my own words. Ladders
describe **scope and behaviour** far more than language features, so the language sections lean on roadmap.sh and
interview guides, and the "Non-language skills" and "Middle vs Senior" sections lean on the ladders.
Mapping used: Level 0 = before job-ready (intern / beginner roadmaps), 1 = Junior, 2 = Middle, 3 = Senior.

## Sources

roadmap.sh renders its roadmaps in the browser, so the topic lists below come from the node files in its public repo
(now `nilbuild/developer-roadmap`, formerly `kamranahmedse/developer-roadmap`). The repo has **one Markdown file per
node but no layout data**, so node _order_ and roadmap.sh's "recommended / optional" markers could not be checked.

| Ref | Name                                                       | URL                                                                                                                   | What it is                                                              | Date / version checked                                         |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| S1  | roadmap.sh JavaScript                                      | https://roadmap.sh/javascript (data: github.com/nilbuild/developer-roadmap/tree/master/roadmaps/javascript)           | Community roadmap, ~125 topic nodes                                     | Repo folder last changed 2026-07-27                            |
| S2  | roadmap.sh Python                                          | https://roadmap.sh/python                                                                                             | Community roadmap, ~85 nodes + FAQ                                      | Checked 2026-10-15 ("in 2026")                                 |
| S3  | roadmap.sh TypeScript                                      | https://roadmap.sh/typescript                                                                                         | Community roadmap, ~93 nodes                                            | Checked 2026-10-15                                             |
| S4  | roadmap.sh SQL                                             | https://roadmap.sh/sql                                                                                                | Community roadmap, ~110 nodes                                           | Checked 2026-10-15                                             |
| S5  | roadmap.sh PostgreSQL DBA                                  | https://roadmap.sh/postgresql-dba                                                                                     | Roadmap for database administrators, ~170 nodes                         | Checked 2026-10-15                                             |
| S6  | roadmap.sh Frontend + Frontend Beginner                    | https://roadmap.sh/frontend , https://roadmap.sh/frontend?r=frontend-beginner                                         | Full and short "beginner" versions                                      | Checked 2026-10-15                                             |
| S7  | roadmap.sh Backend + Backend Beginner                      | https://roadmap.sh/backend , https://roadmap.sh/backend?r=backend-beginner                                            | Full and short "beginner" versions                                      | Backend folder last changed 2026-10-02                         |
| S8  | roadmap.sh Node.js                                         | https://roadmap.sh/nodejs                                                                                             | Community roadmap, ~113 nodes                                           | Checked 2026-10-15                                             |
| S9  | roadmap.sh System Design + Software Design/Architecture    | https://roadmap.sh/system-design , https://roadmap.sh/software-design-architecture                                    | Topic lists (147 and 94 nodes)                                          | Checked 2026-10-15                                             |
| S10 | roadmap.sh interview question guides                       | https://roadmap.sh/questions/python , /questions/sql , /questions/javascript                                          | Question lists; Python and SQL grouped by level, JS by topic            | Checked 2026-10-15; no TypeScript guide (404)                  |
| S11 | Dropbox Engineering Career Framework                       | https://dropbox.github.io/dbx-career-framework/                                                                       | Public ladder, SWE IC1–IC7; read IC1–IC4                                | Guideline v2.9.1                                               |
| S12 | GitLab Backend Engineer job family                         | https://handbook.gitlab.com/job-families/engineering/backend-engineer/                                                | Public job family; Senior and Staff detailed, lower levels in a sheet   | Checked 2026-10-15                                             |
| S13 | Engineering Ladders                                        | http://www.engineeringladders.com/                                                                                    | Open framework: 5 axes (technology, system, people, process, influence) | No date shown                                                  |
| S14 | Tech Interview Handbook                                    | https://www.techinterviewhandbook.org/                                                                                | Free interview guide: coding prep, DSA priorities, senior behavioural   | "Last updated Aug 7, 2026"                                     |
| S15 | Front End Interview Handbook                               | https://www.frontendinterviewhandbook.com/javascript-questions                                                        | Free front-end interview guide; JS quiz topics                          | © 2026                                                         |
| S16 | System Design Primer                                       | https://github.com/donnemartin/system-design-primer                                                                   | Free system design study guide                                          | Checked 2026-10-15                                             |
| S17 | techinterview.org SQL guide                                | https://www.techinterview.org/post/3233460377/                                                                        | Secondary: SQL interview topics by tier (junior / senior / staff)       | Updated 2026-04-16                                             |
| S18 | TypeScript interview guides (secondary)                    | https://www.techinterview.org/post/3233460485/typescript-interview-questions/ (+ others via search)                   | Secondary: advanced TS interview topics                                 | 2025; read only through a search summary                       |
| S19 | Google Engineering Practices: code review                  | https://google.github.io/eng-practices/review/reviewer/looking-for.html                                               | What a reviewer checks; linked from roadmap.sh code-review guide        | Checked 2026-10-15                                             |
| S20 | OWASP Top 10:2025                                          | https://top10.owasp.org/2025 (owasp.org/Top10/2025 redirects here)                                                    | Web app security risk list                                              | 2025 edition, final (release date not shown on page)           |
| S21 | AvitoTech playbook: developer profiles                     | https://github.com/avito-tech/playbook/blob/master/developer-profile.md                                               | Public RU ladder E1–E8 (replaced Intern/Junior/Middle/Senior/Lead)      | File last changed 2025-10-16; no licence, so summary only      |
| S22 | Хабр Карьера: специализации и квалификации                 | https://career.habr.com/info/divisions_and_qualifications                                                             | RU job board's grade definitions, Intern → Lead                         | No date; raw page checked 2026-10-15                           |
| S23 | Tproger: отличия junior, middle и senior                   | https://tproger.ru/experts/junior-middle-senior-developers-differences                                                | RU expert round-up                                                      | 2018-08-04, edited 2026-03-28                                  |
| S24 | Tproger: матрица компетенций разработчиков                 | https://tproger.ru/articles/matrica-kompetencij-razrabotchikov-kak-ustroit-grejdy-ocenki-i                            | RU article on building a competency matrix                              | 2026-08-14                                                     |
| S25 | Tproger: инструменты для перехода из джунов в мидлы        | https://tproger.ru/articles/kakie-instrumenty-izuchit-chtoby-perejti-iz-dzhunov-v-middly-na-primere-frontend-i-nodejs | RU, frontend + Node.js junior → middle                                  | 2023-10-02                                                     |
| S26 | Habr: «Как и зачем вы Senior?»                             | https://habr.com/ru/articles/872460                                                                                   | RU opinion piece on grades                                              | 2025-01-10                                                     |
| S27 | Habr / AvitoTech: путь инженера от джуна до сеньора        | https://habr.com/ru/companies/avito/articles/743278/                                                                  | RU opinion piece by an Avito engineer                                   | 2023-06-22                                                     |
| S28 | Журнал «Код» (Яндекс Практикум): роадмап Python 2026       | https://thecode.media/roadmap-python-razrabotchika-2026/                                                              | RU Python roadmap by grade + hh.ru vacancy figures                      | Updated 2026-09-30                                             |
| S29 | Tproger: что работодатели ждут от Junior Python            | https://tproger.ru/articles/what-junior-python-dev-should-know                                                        | RU, junior Python expectations                                          | 2020-07-24 (old)                                               |
| —   | progression.fyi                                            | https://progression.fyi/                                                                                              | Used to list public company ladders                                     | **Now redirects to careerminds.com**; list no longer available |
| —   | career.hh.ru «Джун, мидл и сеньор: чем различаются грейды» | https://career.hh.ru/article/dzhun-midl-i-senor-chem-razlichayutsya-grejdy                                            | hh.ru career blog                                                       | **HTTP 451 from here** (region block); not read, not used      |

Ladder mapping caveat: Dropbox titles IC1–IC4 all "Software Engineer" (no "Senior" in the page titles); Avito's E-levels
have no official Junior/Middle/Senior mapping in the file. Where I map them (Dropbox IC1 ≈ L1, IC2 ≈ L1–2, IC3 ≈ L2–3,
IC4 ≈ L3; Avito E1–E2 ≈ L1, E3–E4 ≈ L2, E5–E6 ≈ L3), that is **my inference**, not the companies' wording.

## JavaScript

### Level 0

- **Core syntax first** — roadmap.sh JS starts with what JS is, how to run it, `var`/`let`/`const` and naming rules,
  the 8 data types (incl. `null`, `undefined`, `Symbol`, `BigInt`), operators, `if`/`switch`, all loop forms
  (`for`, `while`, `do…while`, `for…of`, `for…in`, `break`/`continue`) and functions (params, defaults, rest, arrow) [S1].
- **Type conversion and equality are a named topic early on** — explicit vs implicit casting, coercion, and the three
  equality algorithms (`==`, `===`, `Object.is` / SameValueZero) have their own nodes [S1]; `==` vs `===` is also a
  standard interview trivia question [S15]. 2/2 sources.
- **Beginner front-end path is short and tool-inclusive** — HTML, CSS, JavaScript, Git, GitHub, npm, React, Tailwind
  and Vitest are the only 9 nodes of the beginner frontend roadmap: Git and a test runner sit _inside_ the beginner set [S6].
- **First coding screens are small** — loop/output problems (FizzBuzz-style) and array transformations [S15].

### Level 1

- **Scope, hoisting, closures, `this`** — lexical scope, block/function/global scope, hoisting, closures, IIFEs, and
  `this` in methods, functions, arrow functions and event handlers, plus `call`/`apply`/`bind` [S1]. These are the
  most-listed JS interview trivia topics (closures, `this`, hoisting, `var`/`let`/`const`) [S15]. 2/2 sources.
- **Async basics** — callbacks (and "callback hell"), promises, `async`/`await`, `setTimeout`/`setInterval`, `fetch`,
  working with APIs, JSON [S1]; "promises vs callbacks", "sync vs async" are interview staples [S15]. 2/2.
- **Errors** — `try`/`catch`/`finally`, `throw`, built-in Error objects [S1].
- **Modules** — ES modules vs CommonJS both have nodes [S1, S8]; module systems are an interview question [S15]. 3/3.
- **Collections** — indexed (arrays, typed arrays) and keyed (`Map`, `Set`, `WeakMap`, `WeakSet`) collections [S1].
- **DOM and events** — DOM APIs [S1]; event bubbling and delegation, attributes vs properties, `DOMContentLoaded`
  vs `load` [S15].
- **Debugging with browser DevTools** is a JS roadmap node of its own [S1].
- **Higher-order array methods, destructuring, spread/rest, template literals** — expected interview fluency [S15].
- **RU market** — a junior "knows the syntax and 1–2 frameworks", needs constant review, estimates badly [S23].

### Level 2

- **Event loop in depth** — event loop, call stack, task queue as a topic [S1, S15]; Node adds `process.nextTick`,
  `setImmediate` and "handling async errors" [S8]. Named as a junior → middle step for Node in RU [S25]. 3/3.
- **Prototypes and classes** — prototypal inheritance, object prototype, classes [S1]; ES5 constructors vs ES6 classes in
  interviews [S15].
- **Iterators and generators**, `strict mode`, memory lifecycle and garbage collection [S1].
- **Debugging performance and memory leaks** — separate nodes from basic DevTools use [S1]; memory leaks also in Node [S8].
- **Node.js runtime** — `fs`, `path`, `http`, `process.env`/`argv`/`stdin`, streams, EventEmitter, exit codes, CLI apps,
  child processes, worker threads, cluster, npm (scripts, semver, workspaces) [S8].
- **Node back-end stack** — a framework (Express, Fastify, NestJS, Hono), DB access (native drivers, Prisma, Drizzle,
  Knex, TypeORM, Sequelize, Mongoose), auth (`jsonwebtoken`, Passport), logging (winston, morgan) [S8]. RU junior →
  middle list matches: NestJS/Fastify, PostgreSQL/MongoDB/Redis, an ORM, message brokers (RabbitMQ/Kafka), schema and
  API design [S25]. 2/2.
- **Front-end middle stack** — TypeScript "in depth", bundlers (Vite/Webpack/Rollup), tests (Jest, Playwright, Cypress),
  SSR (Next.js), PWA, reusable components, state architecture [S25]; the full frontend roadmap covers the same groups
  (module bundlers, testing, SSR/SSG, PWAs, type checkers) [S6]. 2/2.
- **Testing tools** — Node roadmap lists `node:test`, Vitest, Jest, Playwright, Cypress [S8].
- **Coding interviews** — "JavaScript utility functions" and UI coding are their own categories [S15]. The usual
  examples (debounce, `Promise.all`) were **not confirmed** in the part of the page I read.

### Level 3

- **Web security** — CSP, CORS, HTTPS, auth strategies, OWASP risks are frontend roadmap nodes [S6]; OWASP list is
  now the 2025 edition [S20].
- **Performance and quality tooling** — performance, Lighthouse, accessibility, linters/formatters (ESLint, Prettier,
  Biome) [S6]. A 2026 RU article (seen only via search snippet, not read) says middle requirements have shifted toward
  performance, security and AI assistants; treat as unconfirmed.
- **Front-end system design** — a separate interview round type [S15]; system design rounds are mainly for mid/senior [S14].
- **Production Node** — keeping apps running (PM2), APM, memory leaks, uncaught exceptions [S8].

### Cross-level

- **AI-assisted coding is now in the roadmaps** — the frontend and backend roadmaps gained nodes for AI-assisted
  coding, agents, coding tools (Claude Code, Cursor, Copilot), MCP, prompting, "how LLMs work" and AI code reviews [S6, S7].
- **Fundamentals over frameworks** — the front-end interview guide says to focus on HTML/CSS/JS fundamentals, not only
  React/Vue/Angular [S15]; roadmap.sh's JS FAQ asks for core language + at least one framework [S1].

## Python

### Level 0

- **Basics block** — syntax, variables and data types, conditionals, loops, type casting, exceptions, functions and
  built-ins, lists, tuples, sets, dictionaries, strings [S2].
- **"Basics" interview questions** — mutable vs immutable, variable scope, built-in data structures, shallow vs deep
  copy, how arguments are passed, dict comprehensions [S10].
- **OOP is optional at the start** — the roadmap's FAQ says OOP can be skipped early because Python is multi-paradigm [S2].

### Level 1

- **Language features for a junior** — comprehensions, generator expressions, lambdas, decorators, iterators, context
  managers, regular expressions, file handling, modules [S2]; RU sources list the same "revise before the interview"
  set: decorators, generators/iterators, context managers, mutability, data structures and their complexity [S28, S29].
  3/3 sources.
- **OOP** — classes, inheritance, methods/dunders, encapsulation [S2]; RU vacancies ask for basic OOP [S28, S29].
- **Data structures and algorithms** — arrays/linked lists, hash maps, heaps/stacks/queues, binary search trees,
  recursion, sorting [S2]; RU junior expectations name algorithms + complexity [S28, S29]. Interview priority: arrays,
  strings, sorting/searching, trees, graphs high; hash tables, recursion, stacks/queues/heaps mid; DP low [S14].
- **Packaging and tooling** — pip, virtualenv, PyPI, `pyproject.toml`, and modern tools uv, Poetry, PDM, pipenv, pyenv,
  conda [S2]. The 2026 RU roadmap puts **uv, `pyproject.toml` and Ruff at junior level** [S28]. 2/2.
- **The stack around Python** — juniors are expected to bring SQL, Git, Linux and HTTP too; Docker, CI/CD and brokers are
  "the next step" [S28]. Older RU source: databases, Django/Flask, command line, some threading/async, GIL as a bonus [S29].

### Level 2

- **Typing** — type hints, `typing`, mypy / pyright / pyre, pydantic [S2]; middle-level typing named as Generics,
  Protocols, TypedDict [S28]. 2/2.
- **Concurrency and async** — asyncio, threading, multiprocessing, GIL, gevent, aiohttp [S2]; async and the event loop
  at middle level [S28]. 2/2.
- **Testing** — pytest, unittest, doctest, tox [S2]; pytest and the test pyramid at middle [S28]. 2/2.
- **Code formatting and linting** — black, ruff, yapf [S2].
- **Frameworks** — Django, Flask, FastAPI (plus Pyramid, Sanic, Tornado, Plotly Dash) [S2]; Python is mostly a back-end
  language per the roadmap FAQ [S2].
- **ORM internals** — know what the ORM does underneath: N+1 queries, indexes, `EXPLAIN`, transactions [S28]; same topics
  in the backend roadmap (ORMs, N+1, transactions, indexes) [S7]. 2/2.
- **Intermediate interview questions** — lambdas vs functions, `*args`/`**kwargs`, generators, magic methods [S10].

### Level 3

- **Internals** — GIL, memory allocation, threading vs multiprocessing as "advanced" interview topics [S10].
- **Senior Python, RU 2026** — service boundaries and architecture, profiling, reliability (logs, metrics, tracing,
  degradation under load, zero-downtime deploys), and influence through code review [S28].
- **Documentation** — Sphinx is a roadmap node [S2].

### Cross-level

- **Python as part of a stack** — an analysis of hh.ru vacancies (Aug 2025–Apr 2026) found plain Python almost never
  stands alone; it comes with SQL, Linux, Git, Docker. ~7.8k active Python vacancies a month; back-end is the biggest
  role group (~28%), then BI analysts and data scientists [S28]. Single secondary source; figures not re-checked.
- **Junior market under AI pressure (unconfirmed)** — S28 says AI tools cut the value of boilerplate junior tasks (CRUD,
  basic tests) and quotes a GMAC survey on reduced junior hiring; reading, debugging and reviewing existing or generated
  code is valued more. I did not check the survey itself.
- **Paths branch** — roadmap.sh's FAQ splits Python skills into back-end web, data science and automation paths [S2].

## TypeScript

Sourcing is thinner here: roadmap.sh has no TypeScript interview guide [S10], and the level-specific TS interview
material I found is secondary [S18]. Ladders never mention TS by name.

### Level 0

- **TS is a layer on JS** — the roadmap opens with "TypeScript vs JavaScript", TS/JS interoperability, install and
  configure, `tsconfig.json`, `tsc`, running TS (ts-node, playground) [S3]. No source treats TS as a first language.
- **Primitive and special types** — `boolean`, `number`, `string`, `null`, `undefined`, `void`, `any`, `unknown`,
  `never`, arrays, tuples, `object`, `enum` [S3].

### Level 1

- **Everyday typing** — type inference, typing functions, interfaces vs type aliases, union and intersection types,
  literal types, extending interfaces [S3].
- **Narrowing** — `typeof`, `instanceof`, equality and truthiness narrowing, type predicates [S3].
- **Assertions** — `as`, `as const`, `as any`, non-null assertion, and the newer `satisfies` operator (TS 4.9+) [S3].
- **Classes** — access modifiers, constructor parameters, abstract classes, method overriding, `readonly` [S3].
- **Built-in utility types** — `Partial`, `Pick`, `Omit`, `Record`, `Readonly`, `Exclude`, `Extract`, `NonNullable`,
  `ReturnType`, `Parameters`, `InstanceType`, `Awaited` [S3].

### Level 2

- **Generics** — generic types and constraints [S3]; constraints and defaults are common interview questions [S18].
- **Type-level programming** — `keyof`, `typeof` in types, mapped types, conditional types, template literal types,
  recursive types, type compatibility [S3, S18]. 2/2.
- **Modules and declarations** — external/ambient modules, namespaces, global and namespace augmentation [S3].
- **Tooling** — compiler options, build tools, linting, formatting, useful packages [S3].
- **TS as a junior → middle step** — the RU front-end junior → middle list starts with "TypeScript in depth" and calls
  it the modern standard [S25].

### Level 3

- **Advanced interview topics (secondary)** — `infer`, distributive conditional types, variance
  (co-/contra-/invariance), key remapping in mapped types; over-engineering types is named as a common mistake [S18].
- **Type-safe API design** — not TS-specific, but ladders expect seniors to design APIs that are "hard to misuse" [S11,
  S21]; in TS this is where types for public APIs/libraries matter (my link, not a source's claim).
- **Decorators** — a roadmap node [S3].

## SQL

### Level 0

- **Relational basics** — what relational databases are, RDBMS strengths and limits, SQL vs NoSQL, keywords, data types,
  operators [S4]; SQL vs general-purpose languages and dialects are "beginner" interview questions [S10]. 2/2.
- **First statements** — `SELECT`, `FROM`, `WHERE`, `ORDER BY`, `INSERT`, `UPDATE`, `DELETE` [S4].
- **Sublanguages** — DDL / DML / DCL as an early concept [S4, S10]. 2/2.

### Level 1

- **Keys and constraints** — primary key, foreign key, `UNIQUE`, `NOT NULL`, `CHECK` [S4]; PK/FK and constraints are
  beginner interview topics [S10]. 2/2.
- **Joins** — inner, left, right, full outer, self, cross [S4]; the four main join types are the #1 junior interview
  must-know [S17]; join types sit in "intermediate" at roadmap.sh [S10]. 3/3 agree they are expected by junior.
- **Aggregation** — `COUNT`/`SUM`/`AVG`/`MIN`/`MAX`, `GROUP BY`, `HAVING`; `WHERE` vs `HAVING` [S4, S10, S17]. 3/3.
- **Subqueries** — nested and correlated [S4, S10].
- **Classic junior tasks** — find duplicate rows, second-highest value [S10, S17]. 2/2.
- **Scalar functions** — string (`CONCAT`, `SUBSTRING`, `UPPER`, `REPLACE`, `LENGTH`), numeric (`ROUND`, `FLOOR`,
  `CEILING`, `MOD`), dates, `CASE`, `COALESCE`, `NULLIF` [S4].
- **DDL** — `CREATE` / `ALTER` / `DROP` / `TRUNCATE TABLE` [S4].

### Level 2

- **Window functions** — `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `LEAD` [S4]; ranking functions are "intermediate"
  questions [S10]; the most-tested patterns are top-N per group, ranking ties, running totals, lag/lead comparisons [S17].
  3/3.
- **CTEs and recursive queries**, views (create / modify / drop) [S4].
- **Indexes** — using and managing indexes [S4]; indexes are an intermediate interview topic [S10]; sargability
  (functions on indexed columns, leading `%` in `LIKE`) is a common question [S17]. 3/3.
- **Transactions** — `BEGIN`/`COMMIT`/`ROLLBACK`/`SAVEPOINT`, ACID, isolation levels [S4]; transactions + ACID are
  "advanced" at roadmap.sh [S10] but "beginner backend" in [S7]. Sources disagree on the level.
- **SQL for application developers** — ORMs, the N+1 problem, migrations, normalization [S7]; ORMs/N+1 also in RU
  middle Python [S28].
- **Security** — preventing SQL injection is an intermediate interview question [S10]; `GRANT`/`REVOKE` and DB security
  practices are roadmap nodes [S4]; Injection is A05 in OWASP 2025 [S20].
- **UNION vs UNION ALL** — listed as intermediate [S10] and senior [S17]. Sources disagree on the level.

### Level 3

- **Diagnosing queries** — reading `EXPLAIN` / `EXPLAIN ANALYZE`, query analysis, optimizing joins, reducing subqueries
  [S4, S17]; query optimization is "advanced" [S10]. 3/3.
- **Index internals** — how B-trees work [S17]; PostgreSQL index types B-tree, hash, GiST, SP-GiST, GIN, BRIN [S5];
  clustered vs non-clustered [S10, S17].
- **PostgreSQL engine** — MVCC, VACUUM, write-ahead log, locks, query planner, `pg_stat_statements`,
  `pg_stat_activity` [S5]; MVCC is a "staff" interview topic [S17].
- **Scaling and operations** — partitioning, sharding, replication (streaming, logical), backups and restore,
  connection pooling (PgBouncer), monitoring [S5]; scaling databases, replication and sharding in backend and system
  design roadmaps [S7, S9, S16]. 4/4.
- **Schema design** — normalization / normal forms [S5, S10]; schema design patterns and anti-patterns [S5];
  multi-tenant schemas with row-level security [S5, S17].
- **Procedural SQL** — stored procedures/functions, triggers, PL/pgSQL, dynamic SQL [S4, S5].
- **Advanced queries** — pagination done right [S10], pivot/unpivot [S4], gaps-and-islands [S17], cohort retention [S17].

### Cross-level

- **PostgreSQL is the default dialect in practice** — interview guides mostly use PostgreSQL-style examples [S17];
  PostgreSQL is the chosen relational DB in the backend beginner roadmap [S7].
- **Reasoning over syntax** — guides say interviewers look for _why_ (e.g. logical query order explains why a `SELECT`
  alias can't be used in `WHERE`) [S17].

## Non-language skills by level

### Level 0

- **Git and GitHub from day one** — both appear in the beginner frontend and backend roadmaps, and roadmap.sh has a
  separate Git/GitHub beginner roadmap (basics, collaboration) [S6, S7]. 2/2.
- **Testing is already in "beginner"** — Vitest in beginner frontend [S6]; unit, integration and functional testing in
  beginner backend [S7]. 2/2.
- **How the web works** — internet, HTTP, DNS, hosting, browsers [S6, S7]; backend beginner adds REST, JSON APIs,
  authentication, JWT, caching (Redis) [S7].
- **Intern profile (RU)** — student, part-time, needs a mentor; 0–6 months' experience [S22].

### Level 1 (Junior)

- **Scope** — does defined, small tasks (Avito: 1–2 day tasks broken down to the line of code) under a mentor [S11, S21,
  S22, S23]. 4/4 sources. Habr Career: Junior has 6 months to 1 year of experience and can do small parts alone [S22].
- **Testing** — writes good tests, knows when manual testing fits [S11]; at E1 checks "happy paths" and error handling
  by hand, from E3 writes automated tests following the team's test pyramid and checks failure paths too [S21].
- **Code review** — takes part and uses review to learn the codebase [S11]; their own code needs constant review [S23].
- **Operations** — joins on-call and bug triage, flags suspected regressions [S11]; from E2 watches monitoring after
  release [S21].
- **Ownership and communication** — keeps commitments, admits mistakes, says early when late, asks clarifying questions
  [S11, S21]; RU: willing to learn, accepts criticism, asks without repeating questions [S23]. 2/2 + RU.
- **Practices** — applies KISS/DRY (E2) [S21].
- **Git** — "has mastered the development process and version control" is part of the RU junior definition [S26].

### Level 2 (Middle)

- **Independence** — works without close supervision, makes few serious mistakes, finds and fixes bugs, argues for
  their view [S22, S23]; IC2/IC3: picks solutions for defined problems, then owns open-ended ones [S11]. 4/4 agree
  "independence" is the core Middle signal [S11, S21, S22, S23].
- **Debugging** — navigates a large codebase and debugs other people's code [S11]; analyses problems and fixes their
  visible symptoms (E3) [S21].
- **Decomposition and estimates** — splits tasks, estimates adequately [S23, S26]; Avito's E3 example: decompose into
  concrete changes, not vague components [S21].
- **Testing** — systematically grows automated test coverage, chooses the right test types (E3) [S21]; "develop
  well-tested, performant features" is shared across GitLab levels [S12].
- **Security basics** — avoids common OWASP vulnerabilities and consults on safe approaches (E3) [S21].
- **Observability** — adds metrics to features and monitors them after release; sets non-functional requirements (E3)
  [S21]; IC2 watches key metrics for degradation [S11].
- **Code review** — gives useful review comments [S23]; engages constructively with disagreement [S11]; meaningful review
  comments at E4 [S21].
- **System design** — understands and adjusts existing designs, keeps modules separate [S11]; system design interviews
  start at mid level [S14, S16]. 3/3.
- **Mentoring starts** — "may mentor" interns/new hires, joins interviewing [S11]; onboarding and tech interviews at E4
  [S21]; "sometimes helps juniors" [S23]. 3/3.
- **Tooling** — Docker, CI/CD, brokers named as the step after junior in RU Python [S28]; CI/CD is a backend roadmap node
  [S7].

### Level 3 (Senior)

- **Scope** — owns projects and team goals over quarters, works through ambiguity [S11, S12, S21]; designs
  architecture and chooses technology with the product's future in mind [S23]. 4/4.
- **Standards** — defines and upholds coding standards through code review [S11, S12, S23]; sets quality, testing,
  security and fault-tolerance standards (E4) [S21]. 4/4.
- **Design** — simple, testable components with hard-to-misuse APIs; knows when a big refactor pays off [S11, S21];
  multi-component designs that hold at system boundaries, safe rollouts with monitoring [S11].
- **Root causes and prevention** — finds the root cause of production issues and prevents repeats (E4) [S21]; GitLab
  seniors diagnose and prevent large-scale performance problems [S12].
- **Tech debt** — keeps it in check and explains its value to product owners (E6) [S21]; simplifies code to cut
  maintenance cost [S11].
- **Security** — finds unsafe approaches and vulnerabilities in review (E6) [S21]; raises security across the team [S12].
- **Mentoring and interviewing** — coaches juniors and plans their growth, trains interviewers [S11, S12, S21, S22]. 4/4.
- **Influence and communication** — cross-team work, RFCs, tech talks, adjusting the message to the audience [S11, S13];
  behavioural interviews for senior+ look for ownership, proactivity, handling ambiguity, conflict, mentoring and
  business impact [S14].
- **Code review checklist** — design, functionality, complexity, tests, naming, comments that explain _why_, style,
  docs; don't approve changes that worsen code health [S19].
- **Production reliability** — logging, metrics, tracing, degradation under load, zero-downtime deploys [S28];
  observability, instrumentation, graceful degradation, circuit breakers, twelve-factor apps [S7].
- **System design breadth** — scalability, latency vs throughput, CAP, caching strategies, load balancers, queues and
  back-pressure, replication/sharding, CDNs [S9, S16].

### What separates Middle from Senior

- **Executes a direction vs sets it** — Middle works well inside a given direction and may miss the whole picture;
  Senior chooses the direction and owns architecture, product or team outcomes [S23]. Middle owns decisions inside their
  tasks; Senior owns the effect on business, deadlines, team and process [S26].
- **Symptoms vs root causes** — Middle tends to react and fix symptoms; Senior sees links between problems and prevents
  them [S27]; the same step is written into Avito E3 → E4 [S21]. 2/2.
- **Breadth vs depth** — wide but shallow knowledge keeps engineers at Middle for years; at some point breadth must turn
  into depth [S27]; Senior is now described as T-shaped (deep stack + broad view) [S26].
- **Defined vs ambiguous problems** — IC2 picks solutions for defined problems; IC3–IC4 solve open-ended ones and set
  priorities [S11]; Avito E4 works on tasks where the "what" is known but not the "how", E6 where neither is [S21].
- **Follows standards vs sets them** — via review, docs and RFCs [S11, S12, S21].
- **Influence radius** — team → several teams → company [S13]; GitLab Senior also represents the company publicly [S12].
- **The gap is blurrier and harder to cross** — experts call Middle → Senior the hardest step, and the decision often
  involves a panel of experts or the CTO, not only the team lead [S23]; many companies now ask Middle+ for what used
  to be Senior [S26].

### Russian-market notes

- **No standard** — every RU source stresses that each company defines grades its own way [S22, S23, S24, S26]. 4/4.
- **Finer grades** — "strong junior" / "strong middle" steps exist (a Habr post seen only in a search snippet,
  habr.com/ru/post/659387, not read: unconfirmed); Avito replaced
  Intern/Junior/Middle/Senior/Lead with E1–E8 in 2021 [S21].
- **Matrix axes** — a "vertical" (depth in the main stack: language, framework, code quality, design), a "horizontal"
  (databases, infrastructure, business sense) and a separate soft-skills axis [S24]; Avito's 7 blocks: expertise,
  engineering culture, ownership, business focus, agile mindset, communication, learning and teaching [S21].
- **Grades follow independence, not years** — [S23, S24]; only Habr Career gives years, and only for Intern and Junior
  [S22].

## Takeaways for PandaDev

1. **Beginner paths already include tools.** roadmap.sh's beginner frontend and backend roadmaps put Git, GitHub, a test
   runner and HTTP/APIs in the beginner set, next to the language [S6, S7].
2. **Independence is the main Junior → Middle signal; scope and direction are the Middle → Senior signal.** Ladders
   describe levels by task size, ambiguity and who decides, not by language features [S11, S13, S21, S22, S23].
3. **Testing grows in clear steps:** manual happy-path checks → automated tests following a test pyramid, with failure
   cases → designing testable systems and setting test standards [S11, S21].
4. **Code review is on every rung:** learn from review (Junior) → give useful comments (Middle) → set standards and
   catch security issues through review (Senior) [S11, S12, S19, S21, S23].
5. **Middle-level SQL is about what the ORM does:** N+1, indexes, `EXPLAIN`, transactions, migrations [S7, S28];
   window functions and sargability are the most-tested interview topics [S17].
6. **Senior is production work:** observability (logs, metrics, tracing), incidents and root causes, safe rollouts,
   performance, OWASP-level security (2025 edition) [S7, S11, S20, S21, S28].
7. **System design starts at Middle in interviews** and is expected in depth at Senior; behavioural rounds for seniors
   look for ownership, ambiguity, conflict and mentoring [S14, S16].
8. **TypeScript is treated as a JS layer,** and "TS in depth" (generics, mapped and conditional types) is framed as a
   junior → middle step [S3, S25].
9. **Modern Python tooling has moved down a level:** a 2026 RU roadmap puts uv, `pyproject.toml` and Ruff at junior;
   typing (Protocols, Generics), asyncio and pytest at middle [S2, S28].
10. **AI-assisted coding is now in mainstream roadmaps and RU job ads,** and reading, debugging and reviewing generated
    code is named as a newly valued skill [S6, S7, S28].
