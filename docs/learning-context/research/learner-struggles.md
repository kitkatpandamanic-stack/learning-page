# Where learners actually struggle

Checked 2026-10-15 by the learning-architect (research-only run, no comparison with PandaDev content yet).

Overview: the most-voted and most-duplicated Stack Overflow questions show which confusions keep coming back in each language. Async result handling in JS, closures and `this`, Python's reference/aliasing model, null handling in TS, and joins/NULL/"top row per group" in SQL are each hit by thousands of duplicate questions. Surveys (Stack Overflow 2025 and 2026, State of JS 2025, JetBrains 2025, Python Developers Survey 2024) show what people use today and how they learn. Documentation, search and AI come first. Stack Overflow question volume collapsed between 2022 and 2026. The Russian-language signal comes from a sample of Habr Q&A titles. Reddit was login-gated and could not be read.

How to read the numbers: **votes** = question score, **views** in millions, **linked** = number of other questions that link to it, mostly duplicates closed against it (from the API `/questions/{id}/linked`). Linked is the best available proxy for "asked again and again". `q/NNN` means `https://stackoverflow.com/q/NNN`.

## Sources

| Ref | Name                                                              | URL                                                                                                                                | What it is                                                                                                               | Checked / version                  |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| S1  | Stack Exchange API: top-voted questions per tag                   | https://api.stackexchange.com/2.3/questions?sort=votes&tagged=javascript&site=stackoverflow                                        | Top 60 by votes for javascript, python, typescript, sql, postgresql, plus title searches                                 | 2026-10-15                         |
| S2  | Stack Exchange API: linked counts                                 | https://api.stackexchange.com/2.3/questions/{id}/linked?site=stackoverflow&filter=total                                            | How many questions link to a canonical one (duplicate proxy)                                                             | 2026-10-15, 48 canonical questions |
| S3  | Stack Exchange API: new questions per month                       | https://api.stackexchange.com/2.3/questions?tagged=python&fromdate=…&filter=total                                                  | September counts, 2020–2026                                                                                              | 2026-10-15                         |
| S4  | Stack Overflow Developer Survey 2026                              | https://survey.stackoverflow.co/2026/ and https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/ | ~30.9k responses; results 2026-10-06; raw data "soon"                                                                    | 2026-10-15                         |
| S5  | Stack Overflow Developer Survey 2025                              | https://survey.stackoverflow.co/2025/technology, /developers, /ai                                                                  | Has "Learning to code" breakdowns and learning-resource data, which 2026 lacks                                           | 2026-10-15                         |
| S6  | State of JavaScript 2025                                          | https://2025.stateofjs.com/en-US/usage/ (also /libraries/, /features/, /other-tools/)                                              | 13,002 responses, Sept–Nov 2025, published 2026-02                                                                       | 2026-10-15                         |
| S7  | JetBrains State of Developer Ecosystem 2025                       | https://devecosystem-2025.jetbrains.com/ and a summary at https://heise.de/-10771317                                               | 24,534 devs, Apr–Jun 2025. Most chart values didn't extract; numbers via heise                                           | 2026-10-15                         |
| S8  | Python Developers Survey 2024 (PSF + JetBrains)                   | https://lp.jetbrains.com/python-developers-survey-2024/                                                                            | 25k+ usable responses, Oct–Nov 2024, published 2025-08. Latest edition found                                             | 2026-10-15                         |
| S9  | Typed Python Survey 2025 (Meta, JetBrains, community)             | https://engineering.fb.com/2025/12/22/developer-tools/python-typing-survey-2025-code-quality-flexibility-typing-adoption/          | 1,241 responses; only seen through search summaries, not read in full                                                    | 2026-10-15 (unverified)            |
| S10 | Python Programming FAQ                                            | https://docs.python.org/3/faq/programming.html                                                                                     | The official list of recurring Python questions                                                                          | Python 3.15.0 docs                 |
| S11 | Habr Q&A tag pages                                                | https://qna.habr.com/tag/python/questions (also javascript, sql, typescript)                                                       | 100 most recent question titles per tag (pages 1–5), 400 total; "sort=votes" and "interest" views gave no usable ranking | 2026-10-15                         |
| S12 | npm downloads API                                                 | https://api.npmjs.org/downloads/point/last-month/{pkg}                                                                             | Monthly downloads, 2026-09-13 to 2026-10-12                                                                              | 2026-10-15                         |
| S13 | pypistats                                                         | https://pypistats.org/api/packages/{pkg}/recent                                                                                    | Last-month PyPI downloads                                                                                                | 2026-10-15                         |
| S14 | Version checks                                                    | https://registry.npmjs.org/typescript, https://nodejs.org/dist/index.json, https://docs.python.org/3/                              | TypeScript 7.0.2 latest; Node 26.12.0 current, 24.x LTS; Python docs at 3.15.0                                           | 2026-10-15                         |
| S15 | State of HTML 2025                                                | https://2025.stateofhtml.com/en-US/                                                                                                | Results exist, but the pain-point figures didn't extract. Not used                                                       | 2026-10-15                         |
| S16 | r/learnprogramming, r/learnpython, r/learnjavascript, r/SQL wikis | https://www.reddit.com/r/learnpython/wiki/faq/                                                                                     | **Not accessed**: Reddit redirects to a login page; JSON endpoints too                                                   | 2026-10-15                         |

Caveat for S1/S2: the top-voted lists are dominated by 2008–2013 questions, when SO was growing. Newer features (`satisfies`, Temporal, `uv`, TS 7) are under-represented there, so surveys matter more for them. Caveat for S12/S13: downloads are mostly CI traffic. Use them to compare tools with each other, not to count learners.

## JavaScript

### Level 0

- **Removing an item from an array** (`splice` vs `filter`, mutate vs copy). It is the single most-voted JS question: 12,259 votes, 13.6M views, q/5767325 [S1].
- **Looping over arrays, and `for…in` on arrays.** "For each over an array" has 5,814 votes and 5.6M views. A second loop question has 4,096 votes and 5.6M views. "Why is `for…in` on arrays bad" has 2,102 votes and 920 linked (q/500504) [S1][S2]. Learners mix up `for…in` (keys) and `for…of` (values). Habr has a "for…of works, the other loop doesn't" thread [S11].
- **`==` vs `===`**: 5,642 votes, 2.2M views, 952 linked (q/359494) [S1][S2].
- **`let` vs `var`**: 6,417 votes, 2.4M views, 713 linked (q/762011) [S1][S2].
- **Truthiness, null and undefined.** The cluster: empty/undefined/null string check (4,167 votes, 5.9M views), checking for `undefined` (3,108, 3.8M), "a standard function for null, undefined or blank" (3,150, 3.2M), what `!!` does (4,219) and string to boolean (3,624, 3.7M) [S1].
- **Everyday string tasks**: contains a substring (7,402 votes, 8.4M views), replace all (5,519, 4.6M), capitalise the first letter (5,416, 4.7M), multiline strings (3,523) [S1]. `replaceAll` is now used by 79.7% of State of JS respondents [S6].
- **Floating point and rounding.** "Is floating-point math broken?" has 4,040 votes and **9,018 linked** (q/588004, language-agnostic: it hits JS and Python alike). "Round to at most 2 decimals" has 4,337 votes and 5.0M views [S1][S2].
- **Default `sort()` is lexicographic.** "Sort an array of integers": 1,464 votes, 1.3M views. "Why does `parseInt` give NaN with `map`": 340 votes [S1].
- **Dates.** Format a date: 3,612 votes, 7.1M views. Current date: 3,049, 4.4M. Detect an invalid date: 2,223 [S1]. "Date management" is pain point #4 in State of JS 2025, at 26.4% [S6]. Habr has "converting ms to a date adds a month instead of a day", a zero-based months confusion [S11].

### Level 1

- **Closures, especially in loops.** "How do closures work": 7,608 votes, 1,801 linked. "Closures in a loop capture the loop variable": 3,264 votes, **4,117 linked** (q/750486). The fix is block-scoped `let`, which ties back to `let` vs `var` [S1][S2].
- **`this`.** "How does `this` work": 1,500 votes, 2,028 linked. "Access the correct `this` inside a callback": 1,924 votes, **3,823 linked** (q/20279484). Losing `this` when a method is passed as a callback is the recurring form. `call` vs `apply`: 3,507 votes [S1][S2].
- **Function declaration vs expression (hoisting)**: 7,669 votes [S1].
- **References, copying and cloning.** Deep clone: 5,156 votes, 3.1M views. Clone an object: 3,830. Merge objects: 3,377. "Why does changing an array affect its copies": 109 [S1].
- **Working with objects**: remove a property (7,585 votes, 3.4M views), check a key exists (4,140), test for an empty object (3,889), loop over an object (3,628), object length (3,083), sort objects by a property (4,231, 3.5M), check for an array (3,361) [S1].
- **DOM timing and events.** "`getElementById` doesn't find the element" (the script runs before the markup): 619 votes, **3,503 linked**. Event binding on dynamically created elements (delegation): 1,673 votes, **4,273 linked**. `preventDefault` vs `return false`: 3,270 [S1][S2]. Habr's JS tag is mostly DOM, forms and widgets ("required doesn't fire", "elements aren't added", "filtering doesn't work") [S11].
- **Modules.** "Include a JS file in another file": 6,382 votes, 4.6M views. `require` vs `import`: 1,331. The ESM `ERR_REQUIRE_ESM` "use dynamic import()" error: 218 votes (2021) [S1].
- **Strict mode**: 8,548 votes [S1].

### Level 2

- **Returning a value from async code.** "How do I return the response from an asynchronous call?": 6,744 votes, 2.2M views, **18,840 linked** (q/14220321). This is the largest duplicate target of all 48 I checked. Its companion, "variable unaltered after modifying it inside a function (async)", has 4,225 linked (q/23667086) [S1][S2].
- **`async`/`await` in `forEach`**: 3,353 votes, 2.5M views, 1,374 linked (q/37576685). Also `await Promise.all()` vs several awaits (417), errors in `Promise.all` (465), the explicit-promise-construction antipattern (662), a `sleep()` equivalent (3,981 votes, 5.4M views), why `setTimeout(fn, 0)` (1,132), microtask vs macrotask (287) [S1].
- **CORS**: "Postman works, my browser code doesn't": 3,369 votes, 6.6M views, 1,510 linked (q/20035101) [S1][S2]. It shows up on Habr too [S11].
- **What working JS devs say hurts** (State of JS 2025, 10,171 answers): code architecture 37.4%, state management 34.3%, managing dependencies 31.5%, dates 26.4%, performance 25.3%, build tools 22.6%, debugging 21.4%, typing 18.8%, async 10.9% [S6]. Experienced devs rank async low, while beginners hit it constantly on SO.
- **Newer built-ins people do or don't use** (State of JS 2025, "have used"): `??` 86.7%, `replaceAll` 79.7%, dynamic import 66.5%, `Promise.allSettled` 52.5%, `toSorted` 46.7%, private fields 43.0%, `Object.groupBy` 38.6%, iterator methods 32.7%, Set union/intersection about 23%, `error.cause` 22.6%, `Promise.try` 16.0%, Temporal 9.4% (yet 52.6% named Temporal the most exciting proposal) [S6]. Awareness wasn't measured, so low use may mean low need.

### Level 3

- **Code is mostly compiled and typed.** On average 86% of respondents' browser code goes through a build step, and 77% of code is TypeScript [S6].
- **Security and JSON edge cases** are old but heavily read, e.g. "why Google prepends `while(1);` to JSON" (4,510 votes) [S1]. SO has no single high-traffic XSS canonical in the JS top 60.
- **Architecture and state management** are the top two pain points for experienced devs [S6]. Topics don't show up on SO as single questions, because they aren't one-answer problems.

### Cross-level

- 9 of the top 60 JS questions are tagged `jquery` (all 2008–2013) [S1]. Today jQuery is used by 23.4% of all SO 2025 respondents but 13.8% of those learning to code [S5].
- AI-generated code is now about 29% of respondents' code on average, up from 20% [S6].

## Python

### Level 0

- **Reading numbers from `input()`.** "How can I read inputs as numbers?": 1.1M views, **1,327 linked** (q/20449427). "Ask for input until the answer is valid": 1.1M views, **2,577 linked** (q/23294658) [S1][S2]. The related `TypeError: can only concatenate str (not "int") to str` has 0.68M views (q/51252580) [S1].
- **`if x == 1 or 2`.** "Test multiple variables against a single value": 852 votes, **2,352 linked** (q/15112125). It is a classic newcomer logic bug [S1][S2].
- **Loop index (`enumerate`)**: 5,682 votes, 5.1M views [S1].
- **Strings**: substring "contains" (3,585 votes, 7.6M views), slicing (4,712, 3.3M), empty-string check (2,230, 3.6M), str to float/int (2,787, 4.9M), lowercase (2,589), escaping `{}` in `.format` (2,724) [S1]. Python's FAQ also covers string-to-number, immutable strings and joining many strings [S10].
- **Dicts**: key exists (2,675 votes, 7.35M views), iterate keys (4,430, 6.2M), add keys (3,602, 5.65M), sort by value (3,413, 5.85M), merge (7,127) [S1].
- **Ternary expression**: 8,128 votes [S1].
- **Floating point**: the shared q/588004 (9,018 linked; see JavaScript). Integer vs float division (`/` vs `//`): 799 votes, mostly Python 2 era. The FAQ also covers "`-22 // 10` is `-3`" [S1][S10].

### Level 1

- **Names point at objects (aliasing).** Clone a list "so it doesn't change unexpectedly": 3,371 votes, 2.3M views, 1,760 linked (q/2612802). List of lists changing together (`[[0]*n]*m`): **2,303 linked** (q/240178). Pass by reference: 3,365. "Why can a function modify some arguments but not others": 264 [S1][S2]. Python's FAQ has its own "changing `y` also changed `x`" entry [S10].
- **Mutable default arguments**: 3,512 votes, **1,972 linked** (q/1132941). It's in the official FAQ as "why are default values shared between objects" [S1][S2][S10]. A related form, a mutable class attribute shared across instances, shows up on Habr ("attribute is copied when creating a new instance") [S11].
- **Removing items while iterating**: 931 votes, 1,406 linked (q/1207406) [S1][S2].
- **Scope**: global variable in a function (4,050 votes, 4.3M views), `UnboundLocalError` (392 votes, 1.5M views), lambdas in a loop all returning the last value (late binding, in the FAQ) [S1][S10].
- **`is` vs `==`**: 628 votes, 379 linked. "`is` behaves unexpectedly with integers": 625 votes, 443 linked. Also `is None` vs `== None` [S1][S2].
- **`if __name__ == "__main__"`**: 8,444 votes, 5.1M views, 947 linked (q/419163) [S1][S2].
- **Functions and classes**: `yield` is the most-voted Python question (13,135 votes, 663 linked). Then `*args`/`**kwargs` (3,503), decorators (3,202), `@staticmethod` vs `@classmethod` (4,798), `super().__init__` (3,301), `__str__` vs `__repr__` (3,843), `append` vs `extend` (3,109) [S1].
- **Files and the OS**: list a directory (3,463 votes, 9.0M views), file exists (7,352, 6.1M), create directories (5,830), current/script directory (3,146), run a shell command (6,297) [S1].
- **Exceptions**: catch several in one line (3,967), raise one manually (3,323) [S1].
- **Imports, packages and environments.** This cluster is large: relative imports in Python 3 (1,894 votes, 2.2M views), relative-import `ModuleNotFoundError` (1.2M views), importing from another folder (2,672, 4.0M), `__init__.py` (3,946), leaving a virtualenv (2,862, 3.25M), pip on Windows (2,778) [S1]. Habr adds `uv add -r` vs `uv pip install`, a single shared venv manager, and "pipenv not recognised" in VS Code [S11].
- **Variable variables** (should be a dict): 566 votes [S1].

### Level 2

- **pandas** gets very high traffic: iterate rows (4,253 votes, 8.1M views), select rows by value (3,635, 6.9M), rename columns (3,074, 7.0M), `SettingWithCopyWarning` (1,495, 2.6M) [S1]. pandas is used by 80% of Python survey respondents, polars by 15% [S8].
- **Concurrency**: asyncio vs threads vs multiprocessing (399), how asyncio works (390), `requests` inside asyncio (220), the GIL (291) [S1]. Habr shows mixing asyncio with threads or GUIs, and running several bots without breaking the event loop [S11].
- **Type hints**: several types (725), function types (696), nullable returns (430) [S1]. A typing survey reports about 86% using hints "always/often", with selection bias likely [S9, unverified].
- **pytest**: seeing `print` output (981 votes), asserting that an exception is raised (929), running selected tests (819) [S1]. pytest is used by 53%, unittest by 23% [S8].
- **Data models**: dataclass vs Pydantic `BaseModel` (102), nested dicts into dataclasses (214) [S1].
- **Dates**: parsing strings to datetime (3,005 votes, 4.7M views), naive vs aware datetimes (527) [S1].
- **Logging**: duplicated log lines are a recurring Habr question [S11].

### Level 3

- **Metaclasses** (7,535 votes), `range` membership being O(1) (3,069), the FAQ's performance section [S1][S10].
- **SQL injection from string formatting.** "How can I use variables in an SQL statement in Python?": 481 linked (q/902408) [S1][S2].
- **Architecture questions on Habr**: SRP and abstract classes, where to keep the SQLAlchemy session in FastAPI, which layer converts DTOs, understanding a clean-architecture project [S11].

### Cross-level

- **The Russian audience builds Telegram bots.** 10 of the 100 most recent Habr `python` questions are about Telegram bots (aiogram, telethon, telebot), 3 of 100 in `typescript` (telegraf) and 1 of 100 in `javascript`. Scraping (Selenium, Camoufox) also recurs [S11].
- 4% of Python survey respondents still use Python 2. 3.12 leads at 35%, then 3.11 at 21%, and 3.10 and 3.13 at 15% each [S8]. Half of respondents have 2 years or less of professional experience [S8].

## TypeScript

### Level 0

- **Why TypeScript at all**: 1,940 votes [S1].
- **`interface` vs `type`** is the most-voted TS question: 2,811 votes, 1.14M views, 104 linked (q/37233735) [S1][S2].
- **String to number**: 1,708 votes, 2.8M views [S1].
- **`string` vs `String`**: 568 votes [S1].
- **Typing functions and callbacks**: function-typed parameters (839), callback types (738), generic arrow-function syntax (827) [S1].

### Level 1

- **Null and undefined under `strict`.** This is the biggest TS cluster by views: `'string | undefined' is not assignable to 'string'` (1.32M views), "Object is possibly undefined" TS2532 (0.73M), suppressing TS2533 (1.03M), checking for null and undefined at once (1.35M), the `!` non-null operator (1,468 votes), nullable types (526) [S1]. Habr asks the same thing: how to drop `null` from a type, and how to type an `undefined` case [S11].
- **Class field initialisation**: "Property has no initializer" has 1,026 votes and 1.43M views [S1].
- **Enums**: string to enum (829), entry names (738), checking a value (561), looping over values (444) [S1]. Habr asks when to use an enum over a union [S11].
- **Running TS**: "run TS from the command line" (1.29M views), `Unknown file extension ".ts"` under ESM (0.96M), watching with ts-node (550), `--jsx` flag errors (569), importing JSON (532) [S1].

### Level 2

- **`unknown` vs `any`**: 898 votes, 0.39M views. It is moderate on SO but is the named confusion [S1].
- **Indexing and keys**: "Element implicitly has an 'any' type because a string can't index…" (889 votes, 1.14M views), `Object.keys` returns `string[]` (275 and 231), assigning properties dynamically (901), union index-signature error (615), `Record` (683), `keyof typeof` (395), a "valueof" (529) [S1].
- **`never` errors**: "not assignable to parameter of type `never`" has 906 votes and 1.48M views [S1].
- **Declaration files**: "Could not find a declaration file for module" (1,134 votes, 1.89M views, 73 linked), what `.d.ts` is (840), adding to `window` (1,327), "cannot find name `require`" (654) [S1][S2]. Habr has the same declaration-file error [S11].
- **Compile time vs runtime**: casting JSON to a class (663), runtime interface checks (723) [S1]. Zod is used by 48% of State of JS respondents [S6].
- **Escape hatches**: `@ts-ignore` for a block (646 votes) [S1].
- **React typing**: `JSX.Element` vs `ReactNode` (913), the `children` type (806), `onChange` event type (545) [S1].
- **Angular dominates part of the tag**: `formGroup` binding (1,390), no provider for `HttpClient` (768) [S1]. Many "TypeScript" questions are framework errors.
- **`satisfies`** gets little SO traffic (60 votes, 2022) [S1]. That is typical of post-2020 features.

### Level 3

- **Type-level complexity**: Habr shows "type instantiation is excessively deep", TS2590 "union type too complex", generic inference, typing `reduce`, and generic Vue components [S11]. On SO, constructing from a type parameter (230) and `ReturnType` of a generic (152) [S1].
- **Monorepos and path aliases** (ts-jest aliases, unresolved library in a monorepo, barrel-file cost) are recurring Habr themes [S11].
- **The ecosystem is TS-first**: 40% of State of JS respondents write only TS, 6% only JS. Lack of static typing is still the top language complaint [S6]. TypeScript leads JetBrains' 2025 "Language Promise Index" [S7]. TS 7.0.2 (the native compiler line) is the npm `latest` [S14].

## SQL

### Level 0

- **JOIN types.** INNER vs OUTER: 5,293 votes, 2.7M views, 549 linked (q/38549). INNER/LEFT/RIGHT/FULL: 2,223, 2.3M. LEFT vs LEFT OUTER: 2,120. JOIN vs INNER JOIN: 1,482 [S1][S2]. Many hits are about naming: the same join has several spellings.
- **NULL comparisons.** `<>` on NULL (390 votes, 0.63M views), "not null and not empty" (385, 1.07M), NULLs inside `NOT IN` (330, 114 linked), `NOT IN` vs `NOT EXISTS` (653, 2.0M) [S1][S2]. Habr has "NOT IN, NOT EXISTS or something else?" [S11].
- **CASE as "IF…THEN" in SELECT**: 1,815 votes, 4.8M views [S1].
- **Text matching**: "WHERE field contains words" (5.0M views), case-insensitive Postgres queries (635), escaping single quotes (1,441, and 812 for Postgres) [S1].
- **Inserting several rows** (2,110 votes, 3.8M views), multi-column ORDER BY (967), GROUP BY on several columns (1,548, 2.4M) [S1].
- **Small syntax doubts**: `!=` vs `<>` (920), `COUNT(*)` vs `COUNT(1)` (907) [S1].
- **Postgres client basics are a huge share of `postgresql` traffic**: show tables (2,649 votes, 3.4M views), describe a table (2,263), exit psql (1,979), switch database (1,599), role/database "does not exist" (1,114, 1,042), peer and password authentication failures (1,255, 608), changing a password (2,014) [S1].

### Level 1

- **Greatest-n-per-group ("latest row per user").** First row in each group: 2,074 votes, 1.9M views, 740 linked (q/3800551). Max value per group: 1,686, 2.2M. Last record per group (MySQL): 1,367. Join to only the first row: 964 [S1][S2]. Habr has "last record for a field" and "max quarter in each year" [S11].
- **WHERE vs HAVING**: three separate questions (300, 297, 283) [S1].
- **ON vs WHERE in joins**: 996 votes and 1,140. Filtering a LEFT JOIN's right table in WHERE silently turns it into an inner join [S1].
- **JOIN fan-out (duplicates, inflated sums).** "Two LEFT JOINs give the wrong result": only 40 votes but **164 linked** (q/12464037) [S1][S2]. Habr has "query returns the wrong number of rows" and "how to group two tables without duplication" [S11].
- **UPDATE/DELETE with data from another table**: UPDATE from a SELECT (4,352 votes, 5.7M views), UPDATE with JOIN (1,703), Postgres update+join (893), DELETE with JOIN (1,805) [S1].
- **Duplicates**: find and delete them (2,549 votes, 4.1M views) [S1].
- **UNION vs UNION ALL**: 1,735 votes [S1].
- **Upsert and "insert if not exists"**: MySQL (1,188, 1,104), Postgres (823, 722) [S1].
- **String aggregation**: 2,451 votes, 3.5M views, plus `GROUP_CONCAT` (1,502). MySQL's `only_full_group_by` error: 511 votes, 235 linked [S1][S2].
- **Keys and sequences**: getting the inserted id (1,395), Postgres' AUTO_INCREMENT equivalent (700), a sequence out of sync (762), resetting AUTO_INCREMENT (1,675), UUID generation (714) [S1].
- **Types**: `text` vs `varchar` (1,100), date part of a datetime (2,229, 4.0M) [S1].

### Level 2

- **Indexes**: how indexing works (2,908 votes), indexes on FKs in Postgres (532), unique constraint vs index (301), forcing an index (199), indexing JSON (195). Reading EXPLAIN gets low SO traffic: 156 votes, and 67 for EXPLAIN vs EXPLAIN ANALYZE [S1].
- **N+1 queries from ORMs**: 2,440 votes, 0.87M views, 326 linked (q/97197) [S1][S2].
- **SQL injection**: "How can I prevent SQL injection in PHP?" has **18,319 linked** (q/60174), the second-largest duplicate target I checked. Parameterising an IN list: 1,150 [S1][S2].
- **JSON in the database**: JSON vs columns (346), JSONB explained (533) [S1].
- **Join vs subquery** (1,149), CROSS APPLY vs JOIN (1,166) [S1].
- **Window functions** get surprisingly little SO traffic: "filter on a window function result" has 31 votes [S1]. Habr asks how to reshape tables and rank rows with them [S11].
- **Hierarchies and recursion**: storing trees (1,624 votes). Habr has recursive queries and child categories [S11].

### Level 3

- **Concurrency and correctness**: NOLOCK vs isolation levels (141) [S1]. Habr asks how to avoid a race condition on insert, how to decrement stock safely, and how to guarantee a monotonically increasing value [S11].
- **Schema design debates**: singular vs plural table names (1,931 votes), normalisation (117). Habr has product-variant tables and when cascading updates are bad [S1][S11].
- **Operations**: dropping a DB with active connections (874), read-only users (652), superuser (757), dump and restore (592, 738), connecting to Postgres in Docker (618), logging queries (519). Habr has connection pools shared by FastAPI and Go services [S1][S11].

### Cross-level

- SQL is the #2 language in SO 2026 (58.4%), and it ranks first among devs with 16+ years of experience (63%) [S4]. Among people learning to code in 2025, it was lower (45.4% vs 58.6% overall) [S5].
- Dialect differences cause many questions (SQL Server, MySQL and Oracle-specific titles fill the `sql` top 60) [S1].
- Habr has a question about using AI to write SQL queries [S11].

## Tools people use (2025–2026)

**Languages** (SO 2026, all respondents): JavaScript 62.0%, SQL 58.4%, Python 58.0%, Bash 51.3%, TypeScript 43.8% [S4]. Among people learning to code (SO 2025): Python 71.8%, HTML/CSS 66.6%, JS 62.8%, SQL 45.4%, TS 31.9% [S5].

**Databases** (SO 2026): PostgreSQL 57.9%, SQLite 42.1%, MySQL 35.1%, Redis 28.3%, MongoDB 19.0% [S4]. Learners (SO 2025): MySQL 47.7% leads PostgreSQL at 39.2% [S5]. Python devs: PostgreSQL 49%, SQLite 37%, MySQL 31% [S8].

**JS frameworks and runtimes**

- SO 2025 (all / learning): Node.js 48.7/53.3%, React 44.7/43.5%, Next.js 20.8/21.3%, Express 19.9/25.9%, Vue 17.6/14.1%, Angular 18.2/9.5% [S5].
- State of JS 2025 "used" (satisfaction): React 83.6% (72%), Express 79.9% (81%), Next.js 58.6% (55%, down from 68%). Highest satisfaction: Vite 98%, Vitest 97%, Hono 95%, Playwright 94%, Astro 94%, Bun 91% [S6].
- Runtimes (State of JS): Node about 90%, Bun about 21%, Deno about 11% [S6].
- npm last month (millions) [S12]: react 833, vite 855, webpack 256, express 636, hono 311, next 284, vue 76, @nestjs/core 70, fastify 66, @angular/core 28.

**JS/TS testing**

- State of JS 2025: Jest 74.4% used but 65% satisfied. Vitest 53.8% used, 97% satisfied (+14 points of usage). Playwright +14 points, 94% satisfied. Cypress 57% satisfied [S6].
- npm last month [S12]: vitest 516M, @playwright/test 312M, jest 214M, cypress 28M.

**JS/TS tooling**

- Linting and formatting (State of JS): ESLint about 90%, Prettier about 86%, Biome about 16% [S6].
- Validation: Zod about 48%, Yup about 12% [S6]. zod has 1,432M monthly npm downloads [S12].
- Dates: date-fns leads Moment, Day.js and Luxon [S6].
- Package managers and build tools (SO 2025): npm 56.8%, Vite 25.4%, pnpm 13.4%, Webpack 18.4% [S5]. typescript has 1,348M monthly npm downloads [S12].

**JS/TS ORMs** (npm last month; no survey figure found) [S12]: drizzle-orm 115M, kysely 84M, prisma 81M (@prisma/client 78M), typeorm 24M, sequelize 13M. Blogs disagree about Drizzle vs Prisma, so I used the npm API directly.

**Python** [S8], with PyPI last month in brackets [S13]

- Web frameworks: FastAPI 38% (up from 29%), Django 35%, Flask 34%, DRF 20% [fastapi 382M, flask 137M, django 41M]. In SO 2025, learners favour Flask (21.1%) and Django (17.2%) over FastAPI (15.0%) [S5].
- Testing: pytest 53%, unittest 23% [pytest 762M].
- Data: pandas 80%, NumPy 75%, polars 15% [pandas 547M, polars 51M].
- ORMs: SQLAlchemy 39%, Django ORM 26%, raw SQL 12% [sqlalchemy 330M].
- Environments: venv 62%, virtualenv 25%, Conda 19%, Poetry 18%, uv 11%.
- Dependencies: pip 74%, Poetry 20%, uv 12% [uv 128M, poetry 40M]. uv was SO 2025's most-admired technology at 74% (via a search summary; not seen on the SO page itself).
- Other PyPI: pydantic 843M, ruff 304M, mypy 161M. Typing survey: mypy about 58%, Rust-based checkers about 20% combined [S9, unverified].
- Editors: VS Code 48%, PyCharm 25% [S8].

**Editors** (SO 2026): VS Code 70.9%, Notepad++ 27.8%, Visual Studio 27.6% [S4].

**AI assistants**

- SO 2026 [S4]:
  - Coding agents/assistants: Claude Code 66%, GitHub Copilot 59%. 73% of their users use them daily.
  - Model makers: Anthropic 74.6%, OpenAI 74.3%, Google 54.5%. Next year, 49% want to work with Claude, 32% with OpenAI.
  - Uses: code in a familiar area 69%, debugging/refactoring 64%, writing tests 58%, code in an unfamiliar area 56%.
  - Trust: 48% trust AI only when they can easily verify the output.
- State of JS 2025: ChatGPT about 60%, Copilot about 51%, Claude about 44%, Cursor about 26% [S6]. This survey ran in late 2025.
- Python devs (Oct–Nov 2024): ChatGPT 82%, Copilot 39%, Gemini 23%, Claude 17% [S8]. These are old numbers.
- JetBrains 2025: 85% regularly use AI, 62% use an assistant daily. Concerns include uneven quality and skill atrophy [S7].
- SO 2025 frustrations: "almost right, but not quite" 66%, debugging AI code takes longer 45.2%, about 20% less confident in their own problem-solving. Learners use AI less than professionals: 39.5% daily vs 50.6% [S5].

## Takeaways for PandaDev

1. **A small set of confusions makes up most of the repeat questions.** Thousands of duplicates point at each of these: async return values in JS (18,840 linked), floating point (9,018), event delegation (4,273), closures in loops (4,117), `this` in callbacks (3,823), DOM-before-script (3,503), Python input validation (2,577), `x == 1 or 2` (2,352), list-of-lists aliasing (2,303), mutable defaults (1,972) [S2].
2. **Python's newcomer struggles are about the object model and environment, not syntax**: references and aliasing, scope, `is` vs `==`, imports and venvs. The official FAQ lists most of these [S1][S10].
3. **TS learners struggle most with strict null handling, indexing and keys, and declaration files and tooling**, more than with advanced generics. Advanced type-level problems show up later, in real projects (Habr) [S1][S11].
4. **SQL learners hit the same handful of problems**: join types and their naming, NULL logic (`NOT IN`, `<>`), greatest-n-per-group, WHERE vs HAVING, and fan-out duplicates. Postgres newcomers also lose time on psql navigation and authentication [S1].
5. **Security has the second-largest duplicate count**: SQL injection (18,319 linked). The Python equivalent is "variables in SQL statements" [S2].
6. **Experienced JS devs list different pains**: architecture, state, dependencies, dates, performance and build tools. Async ranks low (10.9%) [S6].
7. **Stack Overflow is no longer where new learners ask.** New September questions fell from 21,586 (2020) to 123 (2026) in `python`, and from 16,640 to 54 in `javascript` [S3]. Recent months may still shift and deleted questions aren't counted, but the drop is about 99% either way. Developers now go to docs (67.8%), search, videos (50%) and AI (44% for learning in 2025, about 70% "ask an AI agent" when facing something new in 2026) [S4][S5]. Learners trust AI slightly more than professionals do, and 66% of all devs report "almost right" AI answers [S5].
8. **The current default stack**:
   - JS/TS: TypeScript, Vite, Vitest and Playwright, ESLint and Prettier, Zod, React and Express or Hono, PostgreSQL.
   - Python: pytest, FastAPI/Django/Flask, SQLAlchemy, pandas, with uv growing.
   - Learners lean more to MySQL, Flask and Express than professionals do [S4][S5][S6][S8][S12][S13].
9. **The Russian-speaking audience on Habr asks practical, project-shaped questions**: Telegram bots (10/100 recent Python questions), scraping, DOM widgets, and TS errors in React/Vue projects. They ask few textbook-concept questions [S11].
10. **Newer language features get little use and little SO traffic**: Set methods about 20%, Temporal 9.4%, `satisfies`. Surveys, not Q&A sites, are the signal for them [S1][S6].
