# Official docs and release notes

Checked: 2026-10-15 (research-only run, learning-architect).

This file covers what the official sources say right now: MDN, TC39/Ecma, Node.js, python.org, the TypeScript team and PostgreSQL.
It lists current versions and dates, features worth teaching, deprecations and removals that old tutorials still teach,
and the order each official tutorial follows (its implied beginner path). It does not compare any of this with PandaDev.
Everything is summarised in my own words. Facts that change over time carry a date or version. Where a source was
secondary or I couldn't confirm something, the bullet says so.

## Sources

| #   | Name                                              | URL                                                                                                                                                  | What it is                                              | Date / version checked                                        |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| S1  | MDN JavaScript Guide                              | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide                                                                                        | Language guide, 20 chapters                             | Last modified 2025-11-07                                      |
| S2  | MDN Learn: Dynamic scripting with JavaScript      | https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting                                                                        | MDN's beginner JS course                                | Last modified 2026-08-27                                      |
| S3  | MDN Deprecated and obsolete features              | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Deprecated_and_obsolete_features                                                   | List of legacy JS features                              | 2026-10-15                                                    |
| S4  | MDN reference: Temporal, `using`, Iterator, Map   | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal (and `/Statements/using`, `/Iterator`, `/Map/getOrInsert`) | Reference pages with Baseline status                    | Temporal 2025-12-08; Iterator 2026-09-18                      |
| S5  | TC39 finished proposals                           | https://github.com/tc39/proposals/blob/main/finished-proposals.md                                                                                    | Stage 4 list by expected publication year               | 2026-10-15                                                    |
| S6  | TC39 active proposals + commit log                | https://github.com/tc39/proposals                                                                                                                    | Stage 3 / 2.7 tables; stage-change commits              | Commits to 2026-09-30                                         |
| S7  | Ecma: ECMA-262 17th edition                       | https://262.ecma-international.org/17.0/index.html                                                                                                   | ES2026 spec, approved by Ecma GA on 2026-06-30          | Approval via Ecma press note (found by search)                |
| S8  | Node.js release schedule                          | https://github.com/nodejs/Release and https://nodejs.org/en/about/previous-releases                                                                  | LTS / Current table with dates                          | 2026-10-15 (latest: v26.12.0 Current, v24.22.0 LTS)           |
| S9  | Node.js blog: Evolving the release schedule       | https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule                                                                        | New yearly cadence from Node 27                         | Found by search, 2026                                         |
| S10 | Node.js 22.0.0 / 24.0.0 / 26.0.0 release posts    | https://nodejs.org/en/blog/release/v22.0.0 (and v24.0.0, v26.0.0)                                                                                    | Notable changes per major                               | 2024-04-24 / 2025-05-06 / 2026-05-05                          |
| S11 | Node.js API docs                                  | https://nodejs.org/api/ (pages: `typescript`, `test`, `permissions`, `sqlite`, `globals`, `cli`)                                                     | Stability levels and version history                    | Docs v26.12.0                                                 |
| S12 | Node.js Learn                                     | https://nodejs.org/en/learn/getting-started/introduction-to-nodejs                                                                                   | Official Node guides, ordered sidebar                   | 2026-10-15                                                    |
| S13 | python.org downloads + PEP 790                    | https://www.python.org/downloads/ and https://peps.python.org/pep-0790/                                                                              | Release branches, 3.15 schedule                         | 2026-10-15                                                    |
| S14 | Python tutorial                                   | https://docs.python.org/3/tutorial/index.html                                                                                                        | Official tutorial, 16 chapters                          | Docs 3.15.0                                                   |
| S15 | What's New in Python 3.11–3.15                    | https://docs.python.org/3/whatsnew/3.15.html (and 3.14, 3.13, 3.12, 3.11)                                                                            | Release highlights, deprecations, removals              | Docs 3.15.0                                                   |
| S16 | Python Packaging User Guide: packaging tutorial   | https://packaging.python.org/en/latest/tutorials/packaging-projects/                                                                                 | Official `pyproject.toml` workflow                      | 2026-10-15 (no page date)                                     |
| S17 | TypeScript Handbook                               | https://www.typescriptlang.org/docs/handbook/intro.html                                                                                              | Handbook chapters + "Get Started" pages                 | Last updated 2026-10-13                                       |
| S18 | TypeScript release notes 5.0–5.9                  | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html (…5-1 to 5-9)                                                         | Feature list per release                                | 2026-10-15                                                    |
| S19 | TypeScript blog: 6.0 and 7.0 posts; GitHub tags   | https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ (and …-6-0/), https://github.com/microsoft/TypeScript/releases                  | Defaults, deprecations, native port                     | 6.0 on 2026-03-23; 7.0 on 2026-07-08; 7.0.2 tag on 2026-08-20 |
| S20 | PostgreSQL versioning policy + homepage news      | https://www.postgresql.org/support/versioning/ and https://www.postgresql.org/                                                                       | Supported majors, EOL dates, RC news                    | 2026-10-15                                                    |
| S21 | PostgreSQL tutorial (Part I)                      | https://www.postgresql.org/docs/current/tutorial.html                                                                                                | Official 3-chapter tutorial                             | Docs 18.6                                                     |
| S22 | PostgreSQL release notes 15–18                    | https://www.postgresql.org/docs/18/release-18.html (and /docs/17/release-17.html, 16, 15)                                                            | Major-version notes                                     | 2026-10-15                                                    |
| S23 | PostgreSQL 19 release notes (draft) + Beta 1 post | https://www.postgresql.org/docs/devel/release-19.html and https://www.postgresql.org/about/news/postgresql-19-beta-1-released-3313/                  | Upcoming major                                          | Draft "as of 2026-10-09"; Beta 1 2026-06-04; RC 1 2026-10-15  |
| S24 | PostgreSQL wiki: Don't Do This                    | https://wiki.postgresql.org/wiki/Don%27t_Do_This                                                                                                     | Community list of anti-patterns                         | Last edited 2024-11-21                                        |
| S25 | PostgreSQL docs: CREATE TABLE                     | https://www.postgresql.org/docs/current/sql-createtable.html                                                                                         | Identity, generated columns, WITHOUT OVERLAPS           | Docs 18.6                                                     |
| S26 | Secondary: Temporal browser support               | https://byteiota.com/javascript-temporal-api-ships-in-chrome-144-today/ and https://web.dev/blog/web-platform-05-2025                                | News coverage (not primary)                             | Found by search 2026-10-15                                    |
| S27 | Secondary: SQL:2023 summaries                     | https://en.wikipedia.org/wiki/SQL:2023 and https://blogs.oracle.com/developers/general-availability-of-the-sql2023-standard                          | The ISO text is paywalled, so these are summaries       | Found by search 2026-10-15                                    |
| S28 | Secondary: PostgreSQL 19 reverted features        | https://www.devx.com/cybersecurity/postgresql-19-new-features-release-date/                                                                          | News article (published 2026-09-29, updated 2026-10-08) | Only the headline and description were read                   |

## JavaScript

### Cross-level

- **Spec editions and dates:** ECMAScript ships yearly. ES2026 (17th edition) was approved by the Ecma General Assembly on 2026-06-30 [S7]. Its contents, per the TC39 finished list [S5]: `Map`/`WeakMap` upsert (`getOrInsert`, `getOrInsertComputed`), `JSON.parse` source text access, Iterator sequencing (`Iterator.concat`), `Uint8Array` to/from base64 and hex, `Math.sumPrecise`, `Error.isError`, `Array.fromAsync`, `RegExp.escape`. Secondary write-ups disagree on this list (one put Temporal in ES2026). The TC39 list is authoritative and places Temporal in 2027 [S5, S7].
- **Earlier editions in one line each** [S5]:
  - ES2022: class fields, private `#methods`, static blocks, `#x in obj`, top-level `await`, `.at()`, `Object.hasOwn`, error `cause`, RegExp `/d` indices.
  - ES2023: `findLast`/`findLastIndex`, hashbang, symbols as WeakMap keys.
  - ES2024: change-array-by-copy (`toSorted`, `toReversed`, `toSpliced`, `with`), `Object.groupBy`/`Map.groupBy`, `Promise.withResolvers`, RegExp `/v`, well-formed Unicode strings, resizable ArrayBuffers.
  - ES2025: sync Iterator helpers, new `Set` methods (union, intersection…), `Promise.try`, import attributes + JSON modules, RegExp modifiers, duplicate named groups, `Float16Array`.
- **Already finished for ES2027** [S5, S6]: Temporal (Stage 4 on 2026-03-11), Explicit Resource Management (`using`, `await using`, `DisposableStack`; Stage 4 on 2026-05-19), `Atomics.pause`, Joint Iteration (`Iterator.zip`, `zipKeyed`), and, from the 2026-09-29 meeting, iterator chunking (`chunks`, `windows`), `Iterator.prototype.includes` and `join`.
- **Decorators moved back to Stage 2.7** on 2026-05-19, together with Decorator Metadata [S6]. They are no longer Stage 3. Node's TypeScript docs still describe them as Stage 3 [S11], so they lag behind. TypeScript has implemented the standard decorators since 5.0 [S18]. Anyone teaching decorators as "about to land" should treat that as unconfirmed.
- **Stage 3 now (examples)** [S6]: import defer ("Deferring Module Evaluation"), source phase imports, Import Text, RegExp buffer boundaries. Being at Stage 3 doesn't make a feature teachable as standard JS yet.
- **Baseline as the "can I use it" signal:** MDN marks each feature as Baseline widely available, newly available, or limited availability [S4].
  - `Iterator` and its helpers: widely available.
  - `Map.prototype.getOrInsert`: "Baseline 2026" since Feb 2026.
  - `using`: not Baseline.
  - Temporal: limited availability (page last modified 2025-12-08).
- **Temporal support (partly secondary):** Firefox 139 shipped it in May 2025, Chrome/Edge 144 in Jan 2026 [S26]. I couldn't confirm a stable Safari release; sources conflict. Node 26 enables Temporal by default [S10], and TypeScript 6.0 ships built-in Temporal types [S19]. In practice it works on servers now but needs care in browsers (1/1 primary source plus 2 secondary).
- **Deprecated features still found in old tutorials** [S3]:
  - `String.prototype.substr`, `trimLeft`/`trimRight`, the HTML string methods (`big`, `fontsize`…)
  - `__proto__`, `__defineGetter__` and friends
  - `arguments.callee`, `fn.caller`
  - `with`, `escape`/`unescape`, `getYear`/`setYear`, `toGMTString`
  - legacy `RegExp.$1`-style static properties, octal escapes
- **Import assertions → import attributes:** the `assert { type: 'json' }` form is gone. Node 22 removed it and only `with { … }` works [S10]. TypeScript 6.0 deprecates `asserts` on imports [S19]. Older blog posts still show `assert` (3/3 sources agree).

### Level 0

- **MDN's beginner path (Learn: Dynamic scripting)** [S2]:
  1. What JS is, a first walkthrough, then troubleshooting.
  2. Variables, then numbers and operators.
  3. Strings, then string methods.
  4. Arrays, then a story-generator challenge.
  5. Conditionals, then loops.
  6. Functions: using them, building one, return values.
  7. Events and event bubbling.
  8. Object basics, then DOM scripting and an image-gallery challenge.
  9. Network requests, JSON, a data-UI challenge.
  10. Debugging and error handling at the end.
  - Each topic is followed by a short "Test your skills" page, and a challenge closes each group of topics.
- **Order notes from S2:** debugging comes early ("what went wrong?" right after the first program), and comes back at the end. Arrays come before conditionals and loops. Objects come after functions and events. Network requests and JSON are still part of the core beginner module.
- **Browser-first framing:** MDN teaches JS through the web page (events, DOM) inside the beginner module [S2]. Node's Learn section starts with how Node differs from the browser and how much JS you need first [S12].

### Level 1

- **MDN Guide order (the reference path after basics)** [S1]:
  1. Grammar and types
  2. Control flow and errors
  3. Loops
  4. Functions
  5. Operators
  6. Numbers and strings
  7. Dates
  8. RegExp
  9. Indexed collections
  10. Keyed collections (Map/Set/WeakMap/WeakSet)
  11. Objects
  12. Classes
  13. Promises
  14. Typed arrays
  15. Iterators and generators
  16. **Resource management** (`using`, `DisposableStack`), a recent chapter
  17. Internationalization (Intl)
  18. Modules
  19. Advanced topics (prototype chain, equality, closures, meta-programming, memory)
- **Modern idioms the docs now show as standard:**
  - `Object.groupBy`, `toSorted` and the other non-mutating array methods, `.at(-1)`, `structuredClone` [S5, S11].
  - `Map.getOrInsert` instead of a `has()`/`set()` pair [S4].
  - Iterator helpers (`map`, `filter`, `take`) used lazily on iterables such as `map.values()` [S4].
- **Error handling:** `Error.isError` (ES2026) and error `cause` (ES2022) are the current tools for checking and wrapping errors [S5].
- **Modules:** ESM with named and default exports, plus dynamic `import()`, is the Guide's module model [S1]. Node can `require()` synchronous ESM graphs since 22 [S10].

### Level 2

- **Async:** the MDN Guide covers Promises (chaining, errors, composition, timing) [S1]. `Array.fromAsync` (ES2026) collects async iterables [S5]. `Promise.withResolvers` (ES2024) and `Promise.try` (ES2025) are newer helpers [S5].
- **fetch is built in everywhere:** global `fetch` in Node is unflagged since 18 and stable since 21 [S11]. The global `WebSocket` client is stable since 22.4 [S11]. Node Learn has "Fetching data" and a guide on moving from Axios to fetch [S12].
- **Built-in test runner (`node:test`):** added in 18, stable since 20 [S11]. Features:
  - `describe`/`it`, subtests, skip/todo, `only`, name filters.
  - Mocks: `mock.fn`, `mock.method`, `mock.module`, and mock timers and `Date`.
  - Snapshots, stable since 23.4.
  - Reporters: spec, tap, dot, junit, lcov.
  - Still experimental: coverage (`--experimental-test-coverage`) and `--test --watch`. Early development: tags, randomized order, global setup [S11].
  - Node Learn has guides on using it, mocking, coverage, and migrating from Mocha [S12].
- **Dev-loop flags:** `--watch` stable since 22 [S10]. `node --run <script>` runs package.json scripts (22) [S10]. `--env-file` / `--env-file-if-exists` are no longer experimental since 24.10 / 22.21 [S11]. `fs.glob` is built in (22) [S10].
- **Built-in SQLite (`node:sqlite`):** no flag needed since 23.4 / 22.13. Release candidate (stability 1.2) since 25.7. The class is now `Database`, and `DatabaseSync` is a deprecated alias [S11]. Not marked stable yet.
- **Node's async model:** Node Learn teaches callbacks, promises, timers, blocking vs non-blocking, the event loop, `process.nextTick`, `setImmediate`, and "don't block the event loop" [S12].

### Level 3

- **Permission model:** `--permission` with `--allow-fs-read`, `--allow-fs-write`, `--allow-net`, `--allow-child-process`, `--allow-worker` and more. Stable since 23.5 / 22.13 [S11]. The docs say it is a safety belt against accidents, not a sandbox against malicious code [S11]. Audit mode is `--permission-audit`.
- **Explicit resource management:** `using` is enabled in Node 24+ through V8 [S10] and is in the MDN Guide [S1]. MDN warns about two traps: closures that run after disposal, and exporting a `using` binding [S4].
- **Runtime deprecations to unlearn:**
  - `url.parse()` → WHATWG `URL` (runtime-deprecated in 24) [S10].
  - `util.isArray` and the other `util.is*` helpers (runtime-deprecated in 22) [S10].
  - `crypto.createCipher` → `createCipheriv` (end-of-life) [S10].
  - `module.register()` (runtime-deprecated in 26) [S10].
  - Node 24 removed the promises returned by test-runner `test()` [S10].
- **Diagnostics in official docs:** Node Learn covers heap snapshots, the heap profiler, GC tracing, perf and flame graphs, and the inspector [S12]. Node 24 makes `AsyncLocalStorage` use AsyncContextFrame by default [S10].
- **Security basics from Node Learn:** a "Security Best Practices" page sits in Getting Started [S12]. MDN lists `with`, `eval`-adjacent legacy and `__proto__` as legacy [S3].

### Node.js versions (as of 2026-10-15)

- **Current:** 26.x (latest 26.12.0), released 2026-05-05. It becomes **Active LTS on 2026-10-28**, with end of life on 2029-04-30 [S8].
- **Active LTS:** 24.x "Krypton" (latest 24.22.0). It moves to **Maintenance on 2026-10-20**, with end of life on 2028-04-30 [S8].
- **Maintenance LTS:** 22.x "Jod" until 2027-04-30. **Node 20 reached end of life on 2026-04-30**, and 18 on 2025-04-30 [S8].
- **New cadence:** starting with 27, there is one major release a year (April) and every release becomes LTS (October). Odd/even no longer means anything, and a six-month Alpha channel opens before each release [S9]. One secondary interview said only odd versions become LTS. The official post says all do [S9].
- **Note:** the "previous releases" table on nodejs.org labels a column "Last updated", which is easy to misread as end of life. Use the nodejs/Release table for EOL dates [S8].

## Python

### Cross-level

- **Versions (2026-10-15)** [S13]:
  - **3.15.0** was released on 2026-10-09 (bugfix until 2031-10).
  - 3.14 is in bugfix (first released 2025-10-07).
  - 3.13, 3.12 and 3.11 get security fixes only (end of life 2029-10, 2028-10 and 2027-10).
  - **3.10 reached end of life in Oct 2026.**
  - 3.16 is planned for 2027-10. Releases are yearly in October (PEP 602).
- **Tutorial's beginner path (docs 3.15)** [S14]:
  1. Why Python.
  2. Running the interpreter.
  3. Informal intro: Python as a calculator with numbers, text and lists, then first steps toward programs.
  4. Control flow: `if`, `for`, `range`, `break`/`continue`, loop `else`, `pass`, **`match`**, then functions in depth (defaults, keyword-only and positional-only parameters, `*args`/`**kwargs`, lambdas, docstrings, annotations) and a short coding-style break.
  5. Data structures: list methods, comprehensions, `del`, tuples, sets, dicts, looping techniques.
  6. Modules and packages.
  7. Input/output: f-strings, `format`, files, `json`.
  8. Errors and exceptions, including chaining, exception groups and notes.
  9. Classes, iterators, generators.
  10. and 11. Two tours of the standard library.
  11. Virtual environments and pip.
  12. to 16. What now, interactive editing, floating-point issues, and an appendix.
- **Order notes from S14:** the tutorial reaches `match` and advanced function parameters before data structures. It brings in f-strings only in the I/O chapter. Exception groups and `add_note` are part of the beginner tutorial's exceptions chapter. Classes come late (chapter 9). Virtual environments come right after the stdlib tours.
- **Error messages keep getting better** (3/3 What's New pages agree):
  - 3.11: tracebacks point at the exact failing expression.
  - 3.12: "did you mean" for stdlib modules and `self.x`.
  - 3.14: misspelled keywords like `whille`.
  - 3.15: `AttributeError` hints, including common names from other languages: `.push` → `append`, `.put` → item assignment [S15].
- **Runtime-version sensitivity:** 3.15-only syntax (`lazy import`, `frozendict`, `*` in comprehensions) doesn't run on 3.14 or older. 3.14-only syntax (t-strings, `except A, B:`) doesn't run on 3.13 or older [S15].

### Level 0

- **UTF-8 is the default text encoding from 3.15 (PEP 686):** `open()` without `encoding=` now uses UTF-8 on every OS. Passing `encoding` explicitly is still the advice when code must run on older versions [S15]. This matters for any lesson on files that has Windows users or Cyrillic text.
- **f-strings were loosened in 3.12 (PEP 701):** the same quote type can be reused inside, along with backslashes, comments and multiple lines [S15]. Old "you can't reuse the quote" warnings only apply to ≤3.11.
- **Interactive shell:** a new colour REPL with multi-line editing in 3.13 [S15]. 3.14 adds syntax highlighting and import completion, and 3.15 adds coloured tab completion [S15].
- **`match` is beginner material in the official tutorial** (chapter 4) [S14].

### Level 1

- **Exceptions:**
  - 3.11 added `ExceptionGroup`/`except*` and `add_note()` (PEP 654, 678) [S15].
  - 3.14 allows `except A, B:` without brackets when there's no `as` (PEP 758), and warns on `return`/`break`/`continue` inside `finally` (PEP 765) [S15].
  - The tutorial teaches groups and notes [S14].
- **New built-ins in 3.15:** `frozendict` (immutable, hashable mapping, PEP 814; not a `dict` subclass, so `isinstance(x, dict)` is False), `sentinel` (PEP 661), and `*`/`**` unpacking inside comprehensions (PEP 798) [S15].
- **Packaging today** [S16]: `pyproject.toml` with `[build-system]` and `[project]`, a `src/` layout, SPDX `license` (PEP 639), `python -m build`, then Twine to TestPyPI. Hatchling is the default backend, with Setuptools, Flit, PDM and uv-build shown as alternatives. A `pylock.toml` lock-file spec exists in the guide's navigation, but the tutorial doesn't use it [S16].
- **Removed "dead batteries" (3.13, PEP 594):** `cgi`, `cgitb`, `telnetlib`, `imghdr`, `pipes`, `crypt`, `nntplib`, `audioop`, `aifc`, `chunk`, `mailcap`, `msilib`, `nis`, `ossaudiodev`, `sndhdr`, `spwd`, `sunau`, `uu`, `xdrlib`. `2to3`/`lib2to3` and `tkinter.tix` were also removed [S15]. `distutils` was removed in 3.12 [S15].
- **`re.match` is soft-deprecated in 3.15** in favour of `re.prefixmatch` (same behaviour, clearer name). `re.search` is unchanged [S15].
- **`itertools.batched` (3.12) and `pathlib.Path.walk()` (3.12)** are newer helpers [S15].

### Level 2

- **Typing timeline:**
  - 3.11: `Self`, `LiteralString`, `TypeVarTuple`, `Required`/`NotRequired`.
  - 3.12: `def f[T](...)`, `class C[T]`, the `type X = ...` statement (PEP 695), `@override`.
  - 3.13: `TypeIs`, `ReadOnly`, type-parameter defaults, `warnings.deprecated`.
  - 3.14: lazily evaluated annotations, so forward references no longer need quotes (PEP 649/749), plus `annotationlib`.
  - 3.15: TypedDict extra items, `TypeForm`, disjoint bases [S15].
- **asyncio:**
  - 3.11 added `TaskGroup`, and the docs recommend it over bare `create_task` + `gather` [S15].
  - 3.14: `asyncio.get_event_loop()` raises `RuntimeError` when no loop is running instead of creating one. The policy API (`set_event_loop_policy` and others) is deprecated for removal in 3.16, so pass `loop_factory=` to `asyncio.run` [S15].
  - 3.15 adds `TaskGroup.cancel()` [S15].
  - `asyncio.run(main())` is the hello-world form [S15].
- **Dates:** `datetime.utcnow()` / `utcfromtimestamp()` have been deprecated since 3.12. Use `datetime.now(tz=UTC)` [S15]. What's New 3.15 points out that many tutorials still use them.
- **Template strings (t-strings, 3.14, PEP 750):** `t"..."` builds a `Template` object instead of a `str`, so libraries can escape the interpolated parts, for example for HTML or SQL [S15]. `pprint` supports t-strings from 3.15.
- **Other removals that break old examples:**
  - 3.14: `sqlite3` named placeholders with a sequence now raise an error.
  - 3.14: `ast.Num`/`ast.Str` are gone.
  - 3.15: `NamedTuple("P", x=int)` keyword form is gone.
  - 3.15: `datetime.strptime` with `%d` and no year raises.
  - 3.15: `http.server` CGI handler is gone [S15].
- **Tooling:** `tomllib` (3.11) [S15]. 3.15 adds the `profiling` package (`profiling.tracing`, and `profiling.sampling` "Tachyon", which can attach to a running process); the old `profile` module is deprecated for 3.17 [S15]. 3.14 can attach `pdb` to a running process (`python -m pdb -p PID`) and has `python -m asyncio ps/pstree` [S15].

### Level 3

- **Performance:** 3.11 was 10–60% faster than 3.10, about 1.25× on average [S15]. The JIT was experimental in 3.13 (build flag). In 3.15 it gives a 7–8% geometric-mean speed-up on x86-64 Linux and 11–12% on AArch64 macOS, with some benchmarks slower [S15]. 3.12 inlines comprehensions, up to 2× faster [S15].
- **Concurrency:**
  - Free-threaded (no-GIL) builds: experimental in 3.13 (PEP 703), officially supported in 3.14 (PEP 779, ~5–10% single-thread cost), with a stable ABI `abi3t` in 3.15 [S15].
  - 3.14 exposes multiple interpreters in the stdlib (`concurrent.interpreters`, PEP 734) [S15].
  - On Linux, multiprocessing's default start method changed from `fork` to `forkserver` in 3.14 [S15].
- **Start-up:** `lazy import` in 3.15 (PEP 810) defers module loading. It is only allowed at module level, and a global switch exists [S15].
- **GC caveat:** an incremental GC shipped in 3.14.0–3.14.4 and was reverted to the generational GC in 3.14.5 and 3.15 [S15]. Material written about it in 2025 is now out of date.

## TypeScript

### Cross-level

- **Versions (2026-10-15)** [S19]:
  - **TypeScript 7.0** was released on 2026-07-08, and the latest tag is 7.0.2 (2026-08-20).
  - **6.0** was released on 2026-03-23 (6.0.3 on 2026-04-16).
  - 5.9 was released on 2025-08-01.
  - 7.0 is the **native port written in Go**, about 10× faster: the post lists 7.7–11.9× faster full builds and 6–26% less memory. It installs as the same `typescript` package and runs as `tsc`; the post doesn't use the name "tsgo".
  - 6.0 was the last release built on the JavaScript codebase, a bridge to 7.0.
- **7.0 limits** [S19]:
  - No stable programmatic API yet (a new one is expected in 7.1).
  - Embedding tools (Volar for Vue/Astro/Svelte/MDX, Angular template checking) are told to stay on 6.0.
  - JSDoc support was reworked: `@enum`, Closure-style function types and postfix `!` no longer work.
  - `@typescript/typescript6` provides `tsc6` for running both.
  - New flags: `--checkers` and `--builders`, both experimental.
- **Defaults changed in 6.0 and enforced in 7.0** [S19]:
  - `strict: true` by default
  - `module: esnext`
  - `target` = latest ES (es2025 in 6.0)
  - `types: []` (you must list `node`)
  - `rootDir` = the folder of tsconfig
  - `noUncheckedSideEffectImports: true`
- **Deprecated in 6.0, hard errors in 7.0** [S19]:
  - `target: es5` and `downlevelIteration`
  - `moduleResolution: node`/`node10` (and `classic` is removed)
  - module formats amd/umd/system/none
  - `outFile`
  - `baseUrl` as a lookup root
  - `esModuleInterop: false`
  - `alwaysStrict: false`
  - `module Foo {}` namespace syntax
  - `asserts` on imports
  - Old tsconfigs and tutorials that set these will fail on 7.0 (2/2 posts agree).
- **Handbook path** [S17]:
  1. The Basics
  2. Everyday Types
  3. Narrowing
  4. More on Functions
  5. Object Types
  6. Type Manipulation (generics, `keyof`, `typeof`, indexed access, conditional, mapped and template-literal types)
  7. Classes
  8. Modules
  - It has separate "Get Started" entry pages for four backgrounds: new programmers, JS programmers ("TS in 5 minutes"), Java/C# (OOP) programmers and functional programmers, plus a tooling page.
  - Last updated 2026-10-13. The release-notes sidebar there stops at 6.0, and I found no 7.0 page in the Handbook.

### Level 0

- **Beginner order** [S17]: types you meet every day come first, then narrowing (`typeof`, truthiness, equality, `in`, `instanceof`, discriminated unions). After that come functions and object types. Generics live under Type Manipulation, after objects. Classes come near the end.
- **`strict` is now the default** (6.0+) [S19]. Beginners no longer meet a non-strict TS by default, and `tsc --init` generates a minimal, updated config since 5.9 [S18].
- **Running TS without a build step:** Node strips types by default since 23.6 / 22.18, and this has been stable since 25.2 / 24.12 [S11]. Node Learn has "Running TypeScript natively", "with a runner" and "via transpilation" guides [S12]. Node ignores `tsconfig` and doesn't type-check [S11].

### Level 1

- **Erasable-only TypeScript is becoming the norm for Node:** type stripping rejects syntax that generates JS: `enum`, namespaces with runtime code, constructor parameter properties, `import =` aliases, decorators, and `paths` (use `#` subpath imports instead) [S11]. `--experimental-transform-types` was **removed in Node 26** [S10, S11]. TS 5.8 added `--erasableSyntaxOnly` to enforce this [S18]. Node recommends `erasableSyntaxOnly`, `verbatimModuleSyntax` (requires `import type`), `rewriteRelativeImportExtensions`, `module: nodenext` and TS ≥5.8 [S11]. Enums and parameter properties are still valid TypeScript, but they don't run under plain Node (3/3 sources agree).
- **Narrowing got smarter in 5.x** [S18]:
  - 5.3: `switch (true)` and comparisons to booleans.
  - 5.4: narrowing kept inside closures after the last assignment.
  - 5.5: inferred type predicates, so `arr.filter(x => x !== undefined)` narrows, and narrowing on constant indexed access.
- **Useful newer checks** [S18]:
  - 5.6 flags conditions that are always truthy or nullish.
  - 5.7 flags variables that are never initialized.
  - 5.8 checks each branch of a conditional in a `return`.
  - 5.5 checks regex syntax.
- **Modules:** `--moduleResolution bundler` and `--verbatimModuleSyntax` (5.0), `export type *` (5.0) [S18]. Import attributes (5.3) [S18]. `require()` of ESM under `nodenext` (5.8), and `--module node18`/`node20` (5.8/5.9) [S18]. Subpath imports starting with `#/` (6.0) [S19].

### Level 2

- **Generics and inference:** `const` type parameters (5.0) and the `NoInfer<T>` utility (5.4) [S18]. 6.0 changed inference for methods that don't use `this` [S19].
- **New JS features, typed:**
  - `using` / `Symbol.dispose` (5.2), decorator metadata (5.2), Set methods (5.5) [S18].
  - Iterator helper types and `--strictBuiltinIteratorReturn` (5.6), `Object.groupBy`/`Map.groupBy` types (5.4), `import defer` (5.9) [S18].
  - `es2024` target (5.7) [S18]; `es2025` target, Temporal and `getOrInsert` types (6.0) [S19].
- **Decorators:** TS has implemented the standard (non-experimental) decorators since 5.0 [S18]. TC39 moved them back to Stage 2.7 in May 2026 [S6], and Node's type stripping rejects them [S11].
- **Enums:** since 5.0, every enum is a union enum [S18]. Their runtime output is why they fail under erasable-only setups [S11].

### Level 3

- **Build performance at scale:** 7.0's parallel `--checkers` (default 4) and `--builders` for project references, plus the new watch mode [S19]. `--isolatedDeclarations` (5.5) lets other tools emit `.d.ts` files in parallel [S18]. `--noCheck` (5.6) skips type checking for faster emit [S18].
- **Library publishing:** `${configDir}` in shared configs (5.5), declarations that follow `package.json` dependencies (5.5), and `--rewriteRelativeImportExtensions` (5.7) [S18]. Node Learn has "Publishing a TypeScript package" [S12].
- **Migration practice the TS team recommends:** clear all 6.0 deprecation warnings, then turn on `--stableTypeOrdering` to match 7.0's type ordering (it can slow checks by up to 25%), then upgrade [S19]. `ignoreDeprecations: "6.0"` silences warnings but doesn't carry into 7.0 [S19].

## SQL

### Cross-level

- **PostgreSQL versions (2026-10-15)** [S20]:
  - **18 is current (18.6, released 2026-08-13).** 17.11, 16.15, 15.19 and 14.24 are also supported.
  - **PostgreSQL 14 reaches end of life on 2026-11-12.**
  - **19 RC 1 was released on 2026-10-15.** GA has no date yet; the Beta 1 post said "around September/October 2026" [S23].
  - Each major is supported for 5 years, and the project advises always running the latest minor [S20].
- **Official tutorial path (docs 18.6)** [S21]:
  1. Getting started: install, architecture, create a database, connect.
  2. The SQL language: concepts, `CREATE TABLE`, inserting rows, querying, joins, aggregates, `UPDATE`, `DELETE`.
  3. Advanced: views, foreign keys, transactions, window functions, inheritance.
  - It is short (3 chapters). It reaches joins before aggregates, and leaves foreign keys and transactions to "advanced".
- **SQL standard:** SQL:2023 (ISO/IEC 9075:2023) is the latest edition. It adds Part 16 Property Graph Queries (SQL/PGQ), a JSON data type with simplified accessors, and `ANY_VALUE`, `GREATEST`/`LEAST` among smaller items [S27]. The ISO text is paywalled, so this rests on secondary summaries.
- **"Don't do this" (community wiki)** [S24]:
  - `NOT IN` with subqueries, because of NULL traps → use `NOT EXISTS`.
  - `BETWEEN` on timestamps → use `>=` and `<`.
  - Unquoted upper-case names → use lowercase with underscores.
  - `timestamp` without time zone → use `timestamptz`.
  - `char(n)` and default `varchar(n)` → use `text` (+ `CHECK`).
  - `money` → use `numeric`.
  - **`serial` → use identity columns.**
  - Rules → use triggers. Table inheritance → use FKs or partitioning.
  - `trust` auth over TCP.
  - The official tutorial still has an inheritance section [S21], and the CREATE TABLE reference still uses `serial` in some examples [S25]. So the official docs and the community advice disagree here.
- **Identity columns** are the standard-SQL way to auto-number: `GENERATED {ALWAYS | BY DEFAULT} AS IDENTITY`, implicitly NOT NULL [S25].

### Level 0

- **Beginner order per the official tutorial:** create a table, insert, select (with `WHERE`, `ORDER BY`, `DISTINCT`), join, aggregate (`GROUP BY`/`HAVING`), update, delete [S21].
- **Numeric literals:** `1_000_000`, hex `0x`, octal `0o` and binary `0b` work since 16 [S22]. Since 15, a number with trailing junk like `123abc` is an error [S22].
- **Dates and text:** use `timestamptz` and `text` rather than `timestamp` and `varchar(n)` [S24]. `casefold()` for case-insensitive matching is new in 18 [S22].

### Level 1

- **Constraints:**
  - `UNIQUE NULLS NOT DISTINCT` (15) makes two NULLs conflict [S22].
  - Since 18, NOT NULL constraints can have names, and `CHECK`/FK constraints can be `NOT ENFORCED` [S22].
  - 19 adds `ALTER CONSTRAINT … [NOT] ENFORCED` for CHECK [S23].
- **Generated columns:** since 18, **virtual (computed on read) is the default**, and `STORED` must be written explicitly [S22, S25]. Old tutorials that say generated columns are always stored are out of date for 18+ (2/2 sources agree).
- **Upserts and `RETURNING`:**
  - `MERGE` arrived in 15 [S22].
  - 17 adds `MERGE … RETURNING` with `merge_action()` and `WHEN NOT MATCHED BY SOURCE` [S22].
  - 18 lets `RETURNING` show both `old.` and `new.` values [S22].
  - 19 (RC) adds `INSERT … ON CONFLICT DO SELECT … RETURNING` [S23].
- **UUIDs:** `uuidv7()` (time-ordered, index-friendly) and `uuidv4()` are built in since 18 [S22].
- **Window functions** are in the official tutorial's advanced chapter [S21]. 19 (RC) adds `IGNORE NULLS`/`RESPECT NULLS` for `lead`, `lag`, `first_value`, `last_value` and `nth_value` [S23].

### Level 2

- **JSON, SQL-standard style:**
  - 16: `IS JSON`, `JSON_ARRAY`, `JSON_OBJECT` and their aggregates, `ANY_VALUE` [S22].
  - 17: `JSON_TABLE` (JSON to rows), `JSON_EXISTS`, `JSON_QUERY`, `JSON_VALUE`, `JSON()` [S22].
  - 19 (RC): more `jsonpath` string methods, and **`json_array()` with no rows returns `[]` instead of NULL** [S23].
- **Bulk loading:** `COPY … ON_ERROR ignore` (17) skips bad rows [S22]. `REJECT_LIMIT` (18) [S22]. 19 (RC) adds `ON_ERROR SET_NULL`, multi-line headers and `COPY TO` JSON output [S23].
- **Query plans:** `EXPLAIN ANALYZE` includes `BUFFERS` automatically since 18 [S22]. `EXPLAIN (GENERIC_PLAN)` (16) [S22]. 19 (RC) adds `EXPLAIN (ANALYZE, IO)` [S23].
- **Index behaviour that changes advice:**
  - B-tree **skip scan** (18) can use a multicolumn index without a filter on the leading column. This softens the old "leading column only" rule [S22].
  - Faster `IN (…)` lists on B-trees (17) [S22].
- **Temporal data:** `PRIMARY KEY`/`UNIQUE … WITHOUT OVERLAPS` and FK `PERIOD` (18) work on range columns and use GiST [S22, S25]. `UPDATE/DELETE … FOR PORTION OF` was announced in 19 Beta 1 [S23], but it doesn't appear in the 19 release-notes draft dated 2026-10-09 (see Level 3).
- **Transactions and views:** transactions and views are in the tutorial's advanced chapter [S21]. `security_invoker` views (15) run with the caller's privileges [S22].

### Level 3

- **Security defaults:**
  - Since 15, new databases no longer let everyone `CREATE` in `public` [S22].
  - 16 tightened `CREATEROLE` [S22].
  - 18 deprecates MD5 passwords (warnings; SCRAM is the path) and adds OAuth auth [S22].
  - 19 (RC) warns after MD5 logins, adds password-expiry warnings and removes RADIUS [S23].
  - The wiki says never to use `trust` over TCP [S24].
- **Performance and operations:**
  - 18: asynchronous I/O (`io_method`), and `pg_upgrade` keeps planner statistics [S22].
  - 17: incremental backups (`pg_basebackup --incremental`) [S22].
  - 16: the `pg_stat_io` view [S22].
  - 19 (RC): `REPACK [CONCURRENTLY]` replaces `VACUUM FULL`/`CLUSTER` without blocking reads and writes; `WAIT FOR LSN` gives read-your-writes on replicas; the `pg_plan_advice` extension; parallel autovacuum; faster FK checks [S23].
- **PostgreSQL 19 defaults that change advice (RC, may still change)** [S23]:
  - **JIT is off by default.**
  - TOAST compression defaults to `lz4`.
  - `standard_conforming_strings` is always on.
  - `max_locks_per_transaction` default 64 → 128.
  - `log_lock_waits` is on.
- **19 features that may not ship:** Beta 1 announced SQL/PGQ graph queries, `FOR PORTION OF`, `GROUP BY ALL`, and `MERGE`/`SPLIT PARTITIONS` [S23]. None of them appear in the release-notes draft dated 2026-10-09 (checked by text search) [S23]. A news article says six features, including SQL/PGQ, were reverted in beta 4 [S28]. I couldn't confirm the exact list from a primary source. Check again at GA.
- **Upgrades and migrations:** every major needs dump/restore, `pg_upgrade` or logical replication [S22]. Since 18, `initdb` turns data checksums on by default, which affects `pg_upgrade` from clusters without checksums [S22]. 17 runs maintenance commands with a safe `search_path`, so functions in index expressions need schema-qualified names [S22].

## Takeaways for PandaDev

1. **The current versions all moved in 2026.** Node 26 becomes LTS on 2026-10-28 and 24 enters maintenance on 2026-10-20 (Node 20 is end of life). Python 3.15.0 came out on 2026-10-09, and 3.10 is end of life. TypeScript 7.0 (native Go) came out on 2026-07-08, after 6.0 in March. PostgreSQL 18.6 is current, 19 is at RC 1 (2026-10-15), and 14 is end of life on 2026-11-12.
2. **The TypeScript 6/7 cut-over removes options many old tsconfigs and tutorials still use:** es5 targets, `moduleResolution: node`, `baseUrl`, `outFile`, `esModuleInterop: false`. `strict: true` and `types: []` are now the defaults.
3. **Running TS directly in Node is now stable, but only for erasable syntax.** That makes `enum`, parameter properties, runtime namespaces and decorators the parts official guidance steers away from. TS's `--erasableSyntaxOnly` exists to enforce this.
4. **Standard JS grew a lot of everyday helpers between 2022 and 2026:** `.at()`, `Object.hasOwn`, `toSorted`, `Object.groupBy`, Set methods, Iterator helpers, `Map.getOrInsert`, `Error.isError`, `Promise.try`, `RegExp.escape`. Temporal and `using` are finished for ES2027 and already on in Node 24/26, but they aren't Baseline in browsers yet. Decorators moved back to Stage 2.7 in May 2026.
5. **Node now ships tools that used to be npm packages:** fetch, WebSocket, `node:test` (mocks, mock timers, snapshots), `--watch`, `--env-file`, `node --run`, `fs.glob` and a permission model. `node:sqlite` is a release candidate. Node's own Learn section has guides for moving off Axios, Chalk and Mocha.
6. **The official beginner paths order topics differently.** MDN puts debugging right after the first program and teaches arrays before conditionals and loops. The Python tutorial teaches `match` and advanced function parameters before data structures, and exceptions (including groups and notes) before classes. The Postgres tutorial teaches joins before aggregates. The TS Handbook teaches narrowing before functions and objects, and has separate entry pages by learner background.
7. **Python changes that make old examples wrong:** UTF-8 default (3.15), relaxed f-strings (3.12), deprecated `datetime.utcnow()`, `asyncio.get_event_loop()` no longer creating a loop (3.14), the 19 dead-battery modules removed in 3.13, `distutils` removed in 3.12, `NamedTuple` keyword form removed in 3.15. Error messages now suggest fixes, including for habits carried over from JS (`.push`).
8. **Postgres practice has moved past `serial`, `timestamp`, `varchar(n)` and "generated columns are stored".** Identity columns, `timestamptz`, `text`, virtual generated columns (18), `uuidv7()`, `MERGE … RETURNING`, `RETURNING old/new`, SQL-standard JSON (`JSON_TABLE`) and B-tree skip scan are the current tools. The official tutorial itself still teaches table inheritance, which the community wiki advises against.
9. **Several features announced in previews may still change:** PG 19's SQL/PGQ, `FOR PORTION OF` and `GROUP BY ALL` appear to have been pulled. Temporal still has no confirmed stable Safari support. Some Node test-runner features (coverage, watch, tags) are still experimental.
