# Curriculum map

Last refreshed: 2026-10-11 (repo HEAD `947f15b`). Generated from `course.yml`, lesson frontmatter and `##` headings
(the concepts each lesson teaches), then annotated by hand. Every EN lesson and problem listed here has a `.ru.mdx` twin.

## Totals

| Course | Levels | Modules (+ capstones) | Lessons | Exercises | Quizzes | Practice (easy/med/hard) |
| --- | --- | --- | --- | --- | --- | --- |
| JavaScript | 4 | 20 + 4 | 72 (L0 15 · L1 16 · L2 22 · L3 19) | 71 | 116 | 40 (12/18/10) |
| Python | 4 | 25 + 4 | 94 (L0 16 · L1 23 · L2 33 · L3 22) | 93 | 162 | 40 (12/18/10) |
| SQL | 4 | 16 + 4 | 60 (15 per level) | 60 | 113 | 40 (12/18/10) |
| TypeScript | 4 | 17 + 4 | 62 (L0 15 · L1 15 · L2 15 · L3 17) | 62 | 100 | 40 (12/18/10) |
| **All** | | **78 + 16** | **288** (+288 RU) | 286 | 491 | **160** (+160 RU) |

Lesson counts include capstone parts (3 per capstone). Module mini-projects present: JS 10/20, Python 14/25, SQL 2/16, TS 9/17 (35 of 78; 43 modules have none). Quiz counts updated 2026-10-11 after the basics mini-projects (JS 116, Python 162).

## How to read the lesson lines

`NN-slug` Title (duration, xp, exercises, quizzes) **[flags]**: the lesson's `##` sections = concepts taught, in order.
Prerequisite rule: a lesson may use anything from lessons above it in the same course. Known exceptions are listed under
"Prerequisite notes".

## Prerequisite notes (checked this run)

- JS `loops/for-of` (L0) uses an array literal `["apples", …]` without explaining it; arrays are taught in L1 `arrays`.
- JS L0 capstone part 3 uses DOM "glue code" on purpose, with a callout that L1 `the-dom` explains it. Accepted pattern.
- JS L1 `try-catch` has "Errors in async code" before async is taught (L2); framed as a preview.
- String method chaining (`.strip().upper()`, `.trim().toUpperCase()`) is taught in `basics/working-with-strings` (JS + Python) since 2026-10-11; Python `text-adventure` uses `.lower().strip()` and JS L1 `array-methods` chains array methods.
- Python L0 capstone avoids dictionaries on purpose (rooms are strings + `match`). Good model for L0 capstones.
- TS L0 `typed-data` introduces `Record` and `Partial` early; L1 `utility-types` covers them properly.
- JS and TS have **no lessons on recursion, regular expressions or algorithms/data structures**, but JS practice
  has 2 recursion, 5 algorithms and 3 text problems, and TS has 3 algorithms problems (see `gaps.md`).

## Cross-language map (same idea, lesson slug in each course)

| Concept | JavaScript | Python | TypeScript | SQL |
| --- | --- | --- | --- | --- |
| First program | hello-world | hello-world | hello-typescript | what-is-a-database |
| Variables & types | variables, data-types | variables, data-types | basic-types, special-types | number-functions (types, `::`) |
| Strings | working-with-strings | working-with-strings | basic-types | text-functions |
| Arithmetic | arithmetic | arithmetic | (basic-types) | number-functions |
| Comparisons & logic | comparisons-and-logic | comparisons-and-logic | conditions-and-narrowing | filtering-with-where |
| Branching | if-else (incl. switch, ternary) | if-elif-else (incl. match) | conditions-and-narrowing, literal-types-and-switch | case-and-pivots (L2) |
| Loops | for-loops, while-loops, for-of | for-loops, while-loops, looping-over-lists | loops | recursive-ctes (L2) |
| Functions | writing-functions, arrow-functions-and-scope | writing-functions, defaults-and-scope | typed-functions, optional-default-and-rest, arrow-functions-and-callbacks | functions-and-procedures (L2) |
| Missing values | data-types (null/undefined), spread-rest-and-optional-chaining | data-types (None) | special-types | null-values |
| Reading errors / debugging | reading-errors (L1) | reading-errors-and-debugging (L0) | (hello-typescript: compiler errors) | what-is-a-database ("When something goes wrong") |
| Lists / arrays | arrays | looping-over-lists, lists-in-depth | arrays-and-tuples | jsonb-and-arrays (L2) |
| Transform collections | array-methods | comprehensions | typed-data | aggregation, group-by |
| Key-value data | objects, map-set-and-generators (Map) | dictionaries | object-types-and-interfaces, utility-types (Record) | jsonb-and-arrays |
| Sets / tuples | map-set-and-generators (Set) | tuples-and-sets | arrays-and-tuples (tuples) | union-intersect-except |
| JSON / files | working-with-data (JSON), saving-with-localstorage | reading-and-writing-files, csv-and-json | type-guards-and-unknown (JSON) | jsonb-and-arrays |
| Exceptions | try-catch | exceptions | type-guards-and-unknown, validation-and-errors | upserts-and-transactions (ROLLBACK), functions-and-procedures (RAISE) |
| Classes | classes, inheritance | classes-and-objects, inheritance, special-methods | classes-and-access-modifiers, inheritance-interfaces-and-abstract-classes, structural-typing-and-class-design | — |
| Enums / tagged states | — | enums-and-pattern-matching | literal-types-and-switch, discriminated-unions | advanced-constraints (enum types) |
| Modules & packages | modules, npm-and-git | modules-and-imports, pip-and-virtual-environments | modules-and-declaration-files, tsconfig-and-the-compiler | — |
| Git | npm-and-git | — | — | — |
| Browser DOM | the-dom, events, building-pages | — | typing-the-dom | — |
| Regex / dates | — | regular-expressions, dates-and-times | — | text-functions, date-functions |
| Recursion & algorithms | — | recursion, big-o, searching-and-sorting, stacks-queues-and-hash-maps | — | recursive-ctes |
| Closures / decorators | closures-and-higher-order-functions | decorators | arrow-functions-and-callbacks (function types) | — |
| Generators / iterators | map-set-and-generators | generators-and-context-managers | (typed-sdk/the-client: async iterator) | — |
| Static types | — | type-hints | whole course | creating-tables (types) |
| Async | callbacks-and-the-event-loop, promises, async-await | async-await, concurrent-tasks, timeouts-and-cancellation | typing-promises-and-async | — |
| HTTP clients | fetch-basics, sending-data-and-handling-errors | http-requests, robust-api-clients | typed-fetch, runtime-validation | — |
| Testing | first-tests, mocks-and-async-tests, test-driven-development | first-tests, fixtures-and-parametrize, mocks-and-coverage | testing-typed-code, dependency-injection-and-fakes, testing-types | — |
| Web servers / APIs | node-and-express-basics, middleware-and-validation, notes-api | first-api, request-validation, todo-api | typed-express-apis, validation-and-errors, sharing-types-between-client-and-server | — |
| UI framework | react (4 lessons) | — | react (3 lessons) | — |
| Databases | — | sql-basics, sqlalchemy-orm, relationships-and-migrations | — | whole course |
| Transactions | — | sql-basics | — | upserts-and-transactions, acid-and-isolation-levels, row-locks-and-job-queues |
| Data / ML | — | data-analysis, statistics, machine-learning, deep-learning | — | analytics-dashboard, window-functions |
| Internals | how-engines-run-code, the-event-loop-in-depth, memory-and-garbage-collection | how-python-runs-code, memory-and-the-gil | how-the-compiler-works | mvcc-and-vacuum, explain-query-plans |
| Metaprogramming | proxies-reflect-and-symbols | descriptors-and-metaclasses | advanced-types, type-level-programming | — |
| Design patterns | solid-and-classic-patterns | design-patterns | branded-types-and-type-safe-apis | modeling-patterns |
| Clean architecture / DI | clean-architecture, dependency-injection-and-domain-modelling | clean-architecture, dependency-injection-and-ddd | designing-types-for-large-codebases, dependency-injection-and-fakes (L2) | — |
| Performance | measuring-performance, fast-code-in-the-browser, bundling-and-caching | profiling, caching-and-optimisation, threads-and-processes | faster-type-checking | explain-query-plans, choosing-indexes, query-tuning |
| Security | xss-and-injection, authentication-and-sessions, csrf-cors-and-secrets | secure-coding, auth-for-apis | — | roles-and-privileges, sql-injection, row-level-security |
| Deployment / CI | realtime-chat/the-client-and-shipping-it | containers-and-deployment | building-and-publishing-packages, typed-sdk/shipping-it | backups-and-replication |
| System design | designing-systems, real-time-and-resilience | designing-systems, resilience-patterns | monorepos-and-project-references | table-partitioning, choosing-a-database |
| Code review & mentoring | code-review-and-leadership | code-review-and-leadership | reviewing-typescript-code, leading-typescript-adoption | — |

## Capstones

| Course | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| JavaScript | number-guessing-game | todo-app | weather-dashboard | realtime-chat |
| Python | text-adventure | expense-tracker | rest-api | production-service |
| SQL | movie-night | shop-analytics | analytics-dashboard | multi-tenant-saas |
| TypeScript | quiz-game | habit-tracker | fullstack-todos | typed-sdk |

All 16 capstones exist with 3 parts each.

# Lessons by course

## JavaScript

### JavaScript L0 (4 modules + capstone, 15 lessons)

**Module `basics`: JavaScript Basics** · yml project: Personal greeting card generator · mini-project exercise: Personal greeting card generator (in `working-with-strings`, added 2026-10-11)

- `01-hello-world` Hello, World! (5m, 10xp, ex 1, quiz 1): Your first line of code; Printing more than one line; Comments
- `02-variables` Variables: let and const (8m, 15xp, ex 1, quiz 2): Creating a variable with const; Changing values with let; Which one should I use?; Naming rules
- `03-data-types` Data Types (10m, 15xp, ex 1, quiz 1): Strings: text; Numbers; Booleans: true or false; undefined and null; Checking a type with typeof
- `04-working-with-strings` Working with Strings (14m, 20xp, ex 1, quiz 2): Joining strings; Template literals; Length and characters; String methods; Chaining methods; Common mistakes (trim without saving, method without `()`, `${}` in normal quotes). Exercise = mini-project: 7-line card from 5 variables (trim, capitalise with `[0]` + `.slice(1)`, `.toUpperCase()`, `age + 1`, `.length`), 7 tests, 2 hints

**Module `operators-and-conditions`: Operators & Decisions** · yml project: Grade calculator · mini-project exercise: Grade calculator (in `if-else`)

- `01-arithmetic` Doing Maths (10m, 15xp, ex 1, quiz 1): The arithmetic operators; Order of operations; Updating variables; Strings and numbers don't mix well
- `02-comparisons-and-logic` Comparisons & Logic (12m, 20xp, ex 1, quiz 2): Comparison operators; Checking equality: always use ===; Combining conditions; Truthy and falsy
- `03-if-else` Making Decisions with if/else (12m, 20xp, ex 1, quiz 1): if; else; else if: more than two choices; The ternary operator; switch

**Module `loops`: Loops** · yml project: Multiplication table printer · mini-project exercise: Multiplication table (in `for-loops`)

- `01-for-loops` The for Loop (12m, 20xp, ex 1, quiz 1): Anatomy of a for loop; Counting in different ways; Doing work inside the loop; Looping over a string
- `02-while-loops` while Loops, break & continue (10m, 20xp, ex 1, quiz 1): while; do...while; break: stop early; continue: skip to the next round
- `03-for-of` The for…of Loop (8m, 15xp, ex 1, quiz 1): Looping over a list; Looping over a string; Which loop should I use?

**Module `functions`: Functions** · yml project: Tip and bill splitter · mini-project exercise: Tip and bill splitter (in `writing-functions`)

- `01-writing-functions` Writing Functions (12m, 20xp, ex 1, quiz 1): Declaring and calling a function; Parameters: giving a function input; return: getting a value back; Why use functions?
- `02-arrow-functions-and-scope` Arrow Functions & Scope (12m, 25xp, ex 1, quiz 2): Arrow functions; Default parameters; Scope: where variables live

**Capstone `number-guessing-game`: Number-guessing game in the browser**

- `01-game-logic` Part 1: The game logic (20m, 30xp, ex 1, quiz 1): Plan before you code; Checking a guess; Picking a random secret; Validating guesses
- `02-turns-and-scoring` Part 2: Turns, limits and scoring (20m, 30xp, ex 1, quiz 1): Counting attempts; Stopping when the player wins; A limit on attempts; Skipping invalid guesses; Keeping score; Putting it together: playGame
- `03-playing-in-the-browser` Part 3: Play it in the browser (25m, 30xp, ex 1, quiz 1): The page and the glue code; One click is one turn; Ending the game; Starting a new game

### JavaScript L1 (5 modules + capstone, 16 lessons)

**Module `arrays-and-objects`: Arrays & Objects** · yml project: Shopping list analyser · mini-project exercise: Shopping list analyser (in `working-with-data`)

- `01-arrays` Arrays: Lists of Values (12m, 20xp, ex 1, quiz 1): Creating an array; Indexes: finding items by position; Adding and removing items; Searching an array; slice vs splice; Arrays are references
- `02-array-methods` Array Methods: map, filter, reduce and Friends (15m, 25xp, ex 1, quiz 2): forEach: do something with each item; map: transform every item; filter: keep only some items; find and findIndex: the first match; some and every: yes/no questions; reduce: boil an array down to one value; Chaining methods; Sorting
- `03-objects` Objects: Grouping Related Data (15m, 25xp, ex 1, quiz 1): Creating an object; Dot vs bracket notation; Adding, changing and deleting properties; Methods and this; Looping over an object; Destructuring; Spread: copying and merging objects; Optional chaining
- `04-working-with-data` Working with Real Data (15m, 25xp, ex 1, quiz 1): Arrays of objects; Adding things up; Counting and grouping; Sorting records; JSON: saving and sending data

**Module `dom-and-events`: The DOM & Events** · yml project: Colour picker with live preview · mini-project exercise: Colour picker with live preview (in `building-pages`)

- `01-the-dom` The DOM (14m, 20xp, ex 1, quiz 2) **[no CodeExample, 6 TryIt]**: What is the DOM?; Finding elements; Changing text: textContent vs innerHTML; Changing styles and classes; Attributes; Reading values from inputs
- `02-events` Events (15m, 20xp, ex 1, quiz 1) **[no CodeExample, 6 TryIt]**: Listening for a click; The event object; Typing: input and change; Keyboard events; Forms and preventDefault; Event delegation
- `03-building-pages` Creating Elements (15m, 25xp, ex 1, quiz 1) **[no CodeExample, 6 TryIt]**: Creating an element; Adding and removing: append, prepend and remove; Building a list from data; The render pattern; Storing extra info with dataset

**Module `errors-and-debugging`: Errors & Debugging** · yml project: — · mini-project exercise: NONE

- `01-reading-errors` Reading Error Messages (14m, 20xp, ex 1, quiz 1): The anatomy of an error; ReferenceError: a name JavaScript doesn't know; TypeError: the wrong kind of value; SyntaxError: code JavaScript can't read; RangeError: a value outside the allowed range; Debugging with console.log; Breakpoints and the debugger
- `02-try-catch` Handling Errors with try/catch (15m, 25xp, ex 1, quiz 1): try and catch; The error object; Throwing your own errors; Validating input; finally: code that always runs; Rethrowing errors you can't handle; Errors in async code; A preview: custom error classes

**Module `classes`: Classes & OOP** · yml project: Bank account simulator · mini-project exercise: Bank account simulator (in `inheritance`)

- `01-classes` Classes, Constructors and Methods (14m, 20xp, ex 1, quiz 1): Your first class; Methods: what objects can do; Fields: default values; Getters and setters; Static methods and properties
- `02-inheritance` Inheritance, Private Fields and Custom Errors (15m, 25xp, ex 1, quiz 1): extends: building on another class; super(): calling the parent constructor; Overriding methods; Checking types with instanceof; Private fields and methods; Custom error classes; Composition vs inheritance

**Module `modules-and-tooling`: Modules, npm & Git** · yml project: — · mini-project exercise: NONE

- `01-modules` Modules: import and export (13m, 20xp, ex 1, quiz 2): Why split code into modules?; Named exports; Default exports; Renaming with as; Importing everything with import * as; Modules have their own scope; Modules in the browser; Modules in Node.js
- `02-npm-and-git` npm & Git Essentials (15m, 20xp, ex 0, quiz 2) **[NO EXERCISE; no CodeExample]**: Node.js and npm; Starting a project with npm init; Installing packages; npm scripts; npx: run a package's command; node_modules: never commit it; Git: a history of your code; Your first commits; Ignoring files with .gitignore; Branches; Pushing to GitHub

**Capstone `todo-app`: Interactive to-do app that remembers your tasks**

- `01-state-and-rendering` Part 1: State and rendering (20m, 30xp, ex 1, quiz 1): Tasks as objects; Adding tasks with unique ids; Drawing the tasks; Connecting the form
- `02-completing-and-filtering` Part 2: Completing, deleting and filtering (25m, 30xp, ex 1, quiz 1): Finding a task by its id; Checkboxes and delete buttons; One listener for the whole list; Filtering the list; Counting what's left; Clearing completed tasks
- `03-saving-with-localstorage` Part 3: Remembering tasks (25m, 30xp, ex 1, quiz 1): Meet localStorage; Saving arrays and objects as JSON; Saving after every change; Loading tasks safely; Fixing the next id; Functions or a class?

### JavaScript L2 (6 modules + capstone, 22 lessons)

**Module `modern-javascript`: Modern JavaScript Power Tools** · yml project: — · mini-project exercise: NONE

- `01-spread-rest-and-optional-chaining` Spread, Rest and Optional Chaining (16m, 25xp, ex 1, quiz 2): Spread with arrays; Spread with objects; Rest parameters; Rest in destructuring; Nested destructuring; Optional chaining in depth; ?? versus ||; Shallow copies and structuredClone
- `02-closures-and-higher-order-functions` Closures and Higher-Order Functions (18m, 25xp, ex 1, quiz 2): Functions are values; Higher-order functions; Functions that return functions; Closures; Private state; Useful wrappers: once and memoize; The debounce idea; The classic loop bug with var
- `03-map-set-and-generators` Map, Set and Generators (18m, 25xp, ex 1, quiz 2): Map: a real key-value store; Set: unique values; WeakMap in brief; How for...of really works; Generators; Lazy sequences

**Module `async`: Asynchronous JavaScript** · yml project: — · mini-project exercise: NONE

- `01-callbacks-and-the-event-loop` Callbacks and the Event Loop (16m, 20xp, ex 1, quiz 2): Why code has to wait; Callbacks; Timers; The event loop; Callback hell
- `02-promises` Promises (18m, 25xp, ex 1, quiz 2): Creating a promise; then, catch and finally; Promisifying setTimeout; Chaining; Errors travel down the chain; Running promises together
- `03-async-await` async and await (18m, 25xp, ex 1, quiz 2): async functions; await; Errors: try, catch and finally; Talking to an API; One after another, or all at once?; Loops with await; Top-level await; Common mistakes

**Module `fetch-and-apis`: Fetch & REST APIs** · yml project: Movie search app · mini-project exercise: Movie search app (in `movie-search-app`)

- `01-fetch-basics` Fetch Basics: Getting Data from an API (18m, 20xp, ex 1, quiz 2): HTTP in two minutes; Your first fetch; Reading the response; Query strings with URL and URLSearchParams; When things go wrong: 404 vs network errors; A small getJSON helper; In real projects: API keys
- `02-sending-data-and-handling-errors` Sending Data and Handling Errors (20m, 25xp, ex 1, quiz 2): Sending data with POST; Changing and deleting; A robust request helper; Timeouts with AbortSignal; Retries with backoff
- `03-movie-search-app` Mini-project: Movie Search App (20m, 25xp, ex 1, quiz 2) **[no CodeExample, 2 TryIt]**: Step 1: search and show the results; Step 2: loading, error and empty states; Step 3: Load more; In real projects

**Module `testing`: Testing with Vitest** · yml project: — · mini-project exercise: NONE

- `01-first-tests` Your First Tests with Vitest (16m, 20xp, ex 1, quiz 2): Why automate your checks?; describe, it and expect; Running Vitest in a real project; Reading a failure report; toBe or toEqual?; Common matchers; Testing errors with toThrow; Arrange, act, assert; Which cases should you test?
- `02-mocks-and-async-tests` Mocks and Async Tests (18m, 25xp, ex 1, quiz 2): Testing async code; Test doubles with vi.fn; Injecting dependencies; Spying on existing methods with vi.spyOn; Fresh setup with beforeEach; Controlling time with fake timers
- `03-test-driven-development` Test-Driven Development (18m, 25xp, ex 1, quiz 2): Red, green, refactor; Tables of cases with it.each; Testing an API client with a fake fetch; What to test (and what not to); Measuring coverage

**Module `react`: React Fundamentals** · yml project: Recipe browser · mini-project exercise: Recipe browser (in `recipe-browser`)

- `01-components-and-jsx` Components and JSX (18m, 20xp, ex 1, quiz 2): Why React?; Your first component; JSX: HTML-like syntax in JavaScript; Props: passing data to components; Children: components that wrap content; Rendering lists with keys; Conditional rendering; In real projects
- `02-state-and-events` State and Events (18m, 20xp, ex 1, quiz 2): Why a normal variable isn't enough; useState: a component's memory; Handling events; Updating arrays and objects; Controlled inputs and forms; Lifting state up; Derive values, don't store them
- `03-effects-and-data` Effects and Data Fetching (18m, 20xp, ex 1, quiz 2) **[no CodeExample, 4 TryIt]**: Rendering must stay pure; Your first effect; The dependency array; Fetching data; Cleanup: cancelling stale requests; When you don't need an effect
- `04-recipe-browser` Mini-project: Recipe browser (20m, 25xp, ex 1, quiz 1): Building the URL; A custom hook for loading data; Switching between the list and the details; Loading, error and empty states; Starting a real project

**Module `node-and-express`: Node.js & Express** · yml project: Notes API · mini-project exercise: Notes API (in `notes-api`)

- `01-node-and-express-basics` Node.js & Your First Express Server (18m, 20xp, ex 1, quiz 2): What Node.js is; Setting up a real Express project; Your first Express app; Status codes; Route params and query strings; Testing your API with supertest
- `02-middleware-and-validation` Middleware, Routers & Validation (18m, 25xp, ex 1, quiz 2): What middleware is; Reading JSON bodies with express.json(); Organising routes with express.Router(); Validating input; 404 and error-handling middleware; Configuration: pass options in
- `03-notes-api` Mini-project: Notes API (20m, 25xp, ex 1, quiz 2): A repository for the data; Parsing and validating input; Wiring up the routes; Testing the API with Vitest and supertest; Running it for real

**Capstone `weather-dashboard`: Weather dashboard with React, a public API and tests**

- `01-the-api-client` Part 1: The API client (22m, 30xp, ex 1, quiz 1): Meet the weather endpoint; Building the URL; getWeather: one function for every request; Formatting helpers; Testing the client with a fake fetch
- `02-the-components` Part 2: The components (22m, 30xp, ex 1, quiz 1) **[no CodeExample, 3 TryIt]**: The component plan; Step 1: components from sample data; Step 2: the search form; Step 3: loading the weather with a custom hook; Step 4: putting it together
- `03-the-finished-dashboard` Part 3: The finished dashboard (25m, 30xp, ex 1, quiz 1): The °C / °F switch; Lists that change: pure helpers first; Saving lists in localStorage; Loading saved data when the app starts; Saving when the user acts; Empty and error states

### JavaScript L3 (5 modules + capstone, 19 lessons)

**Module `engine-internals`: Engine Internals & the Event Loop** · yml project: — · mini-project exercise: NONE

- `01-how-engines-run-code` How JavaScript Engines Run Your Code (24m, 25xp, ex 1, quiz 2): Engines: the programs that run JavaScript; From source code to machine code; Hidden classes and inline caches; Execution contexts and the call stack; Hoisting and the temporal dead zone; How this is decided
- `02-the-event-loop-in-depth` The Event Loop in Depth (23m, 25xp, ex 1, quiz 2): One thread, two queues; The exact order; async functions are promise chains; Microtask starvation; Rendering and requestAnimationFrame; Long tasks: keep the page responsive; Node's event loop; Async iteration
- `03-memory-and-garbage-collection` Memory and Garbage Collection (22m, 25xp, ex 1, quiz 2): The stack and the heap; Reachability and mark-and-sweep; Generational garbage collection; What leaks in real JavaScript apps; WeakMap and WeakSet: data that follows its object; WeakRef and FinalizationRegistry: handle with care; Removing many listeners at once with AbortController; Finding leaks with DevTools
- `04-proxies-reflect-and-symbols` Proxies, Reflect and Symbols (25m, 30xp, ex 1, quiz 2): Property descriptors; Getters and setters; Freezing and sealing; Symbols; Proxy: intercepting an object; Reactivity: how Vue and MobX know what changed; Costs and pitfalls

**Module `design-patterns`: Design Patterns & Architecture** · yml project: — · mini-project exercise: NONE

- `01-solid-and-classic-patterns` SOLID and Classic Patterns in JavaScript (24m, 25xp, ex 1, quiz 2): SOLID in JavaScript terms; Composition over inheritance; Strategy: functions are already strategies; Factory: hide how objects are made; Observer: events instead of calls; Adapter: make it fit; Decorator: wrap behaviour around a function; Singletons and module state; When patterns are over-engineering
- `02-clean-architecture` Clean Architecture in JavaScript (25m, 25xp, ex 1, quiz 2): Three layers; The domain: plain rules; The dependency rule; Ports in JavaScript; Use cases: one function per user action; Express is just an adapter; Testing each layer
- `03-dependency-injection-and-domain-modelling` Dependency Injection and Domain Modelling (25m, 30xp, ex 1, quiz 2): Hard-wired dependencies; Constructor and factory injection; The composition root; Do you need a DI container?; Value objects; Entities, invariants and domain events; Finite state machines

**Module `performance`: Performance** · yml project: — · mini-project exercise: NONE

- `01-measuring-performance` Measuring Performance (24m, 25xp, ex 1, quiz 2): Measure, don't guess; Timing code with performance.now; Micro-benchmark traps; Big-O in practice; Finding the slow part: profilers; Core Web Vitals; Measuring real users
- `02-fast-code-in-the-browser` Fast Code in the Browser (25m, 25xp, ex 1, quiz 2): The budget: 16 ms per frame; Memoisation: don't compute the same thing twice; Debounce vs throttle; Avoiding layout thrashing; Event delegation; Rendering huge lists; Breaking up long tasks; Web Workers for heavy work; React performance
- `03-bundling-and-caching` Bundling and Caching (25m, 30xp, ex 1, quiz 2): What bundlers do; Tree shaking; Code splitting with dynamic import(); Minification and compression; Images and fonts; Bundle analysis; HTTP caching with Cache-Control; ETags and 304 Not Modified; CDNs; Stale-while-revalidate; Service workers

**Module `security`: Security** · yml project: — · mini-project exercise: NONE

- `01-xss-and-injection` XSS and Injection Attacks (24m, 25xp, ex 1, quiz 2): Think like an attacker; Cross-site scripting (XSS); Escaping HTML: context matters; React escapes for you (mostly); Content-Security-Policy: a safety net; Injection on the server; Prototype pollution; eval, new Function and ReDoS
- `02-authentication-and-sessions` Authentication and Sessions (25m, 25xp, ex 1, quiz 2): Authentication vs authorisation; Storing passwords; Sessions with cookies; Signed tokens and JWTs; Where should the browser keep the token?; Authorisation middleware with roles; Slowing down password guessing
- `03-csrf-cors-and-secrets` CSRF, CORS, Security Headers and Secrets (25m, 30xp, ex 1, quiz 2): CSRF: requests your users didn't mean to send; CORS: who may read your responses; Security headers; Secrets: keep them out of code and bundles; Supply-chain security

**Module `system-design`: System Design & Leadership** · yml project: — · mini-project exercise: NONE

- `01-designing-systems` Designing Systems (25m, 25xp, ex 1, quiz 2): Start with requirements, not boxes; Back-of-the-envelope maths; Scaling up vs scaling out; Stateless servers; Load balancers and health checks; Cache layers; Databases: indexes, replicas and shards; Queues and background workers; CAP in plain words
- `02-real-time-and-resilience` Real-Time Features and Resilience (25m, 25xp, ex 1, quiz 2): Four ways to get live updates; How a WebSocket connection starts; Your first WebSocket server; Scaling WebSockets across servers; When things fail
- `03-code-review-and-leadership` Code Review and Technical Leadership (25m, 30xp, ex 1, quiz 2): What code review is for; Reading code like a reviewer; Writing kind, specific feedback; Design docs and RFCs; Tech debt; Estimates; Mentoring juniors; On-call and blameless postmortems

**Capstone `realtime-chat`: Design, build and deploy a real-time chat platform**

- `01-design-and-core` Part 1: Design and core (25m, 30xp, ex 1, quiz 2): Start with a design doc; The message protocol; Back-of-the-envelope numbers; Pages that don't move; Time, under our control; The chat service; Testing the core
- `02-the-realtime-server` Part 2: The realtime server (25m, 30xp, ex 1, quiz 2): Who's there? Authenticating the connection; Never trust a message; Rooms and broadcasting; Heartbeats: finding dead connections; Closing politely; Testing a WebSocket server
- `03-the-client-and-shipping-it` Part 3: The client and shipping it (25m, 30xp, ex 1, quiz 1): One page, server and client; The connection is a state machine; Reconnecting without a stampede; The useChat hook; Typing indicators, cheaply; Shipping it

## Python

### Python L0 (4 modules + capstone, 16 lessons)

**Module `basics`: Python Basics** · yml project: Mad Libs story generator · mini-project exercise: Mad Libs story generator (in `working-with-strings`, added 2026-10-11)

- `01-hello-world` Hello, World! (5m, 10xp, ex 1, quiz 1): Your first line of code; Printing more than one line; Comments
- `02-variables` Variables (8m, 15xp, ex 1, quiz 1): Creating a variable; Changing a value; Constants; Several at once; Naming rules
- `03-data-types` Data Types (10m, 15xp, ex 1, quiz 1): The basic types; Checking a type with type(); Numbers in quotes are text; Converting between types
- `04-working-with-strings` Working with Strings (14m, 20xp, ex 1, quiz 2): f-strings; Joining and repeating; Length, indexing and slicing; String methods; Chaining methods; Common mistakes (strip without saving, missing `f`, `"7" * 2`). Exercise = mini-project: 6-line story from 6 variables (strip, upper/lower, title underline `"=" * len(title)`, `int(number) * 2`), 7 tests, 2 hints. No `input()` (browser), no `if`

**Module `conditions`: Operators & Decisions** · yml project: Grade calculator · mini-project exercise: Grade calculator (in `if-elif-else`)

- `01-arithmetic` Doing Maths (10m, 15xp, ex 1, quiz 1): The operators; Two kinds of division; Order of operations; Updating variables
- `02-comparisons-and-logic` Comparisons & Logic (12m, 20xp, ex 1, quiz 2): Comparison operators; Chained comparisons; and, or, not; Truthy and falsy
- `03-if-elif-else` Making Decisions with if/elif/else (12m, 20xp, ex 1, quiz 1): if; else and elif; Conditional expressions; match

**Module `loops`: Loops** · yml project: Multiplication table · mini-project exercise: Multiplication table (in `for-loops`)

- `01-for-loops` The for Loop and range() (12m, 20xp, ex 1, quiz 1): for + range; Three ways to call range; Doing work in a loop; Looping over a string
- `02-while-loops` while Loops, break & continue (10m, 20xp, ex 1, quiz 1): while; break: stop early; continue: skip to the next round; Repeat until: while True + break
- `03-looping-over-lists` Looping over Lists (10m, 20xp, ex 1, quiz 1): Making a list; for over a list; Numbering items with enumerate; Counting with a loop

**Module `functions`: Functions** · yml project: Tip and bill splitter · mini-project exercise: Tip and bill splitter (in `writing-functions`)

- `01-writing-functions` Writing Functions (12m, 20xp, ex 1, quiz 1): Defining and calling; Parameters; return: giving a value back
- `02-reading-errors-and-debugging` Reading Errors & Debugging (14m, 20xp, ex 1, quiz 2): Reading a traceback; The errors you'll meet most; A debugging routine; assert: a quick sanity check
- `03-defaults-and-scope` Default Arguments & Scope (12m, 25xp, ex 1, quiz 1): Default values; Keyword arguments; Returning several values; Short functions with lambda; Scope: where variables live

**Capstone `text-adventure`: Text adventure game**

- `01-building-the-world` Part 1: Building the world (20m, 30xp, ex 1, quiz 1): Plan the map first; Describing a room; Moving between rooms; Taking a walk
- `02-commands-and-inventory` Part 2: Commands and inventory (25m, 30xp, ex 1, quiz 1): Reading a command; Where are the items?; Looking around; Taking and dropping; A locked door; Putting it together: handle()
- `03-playing-the-game` Part 3: Playing the game (20m, 30xp, ex 1, quiz 1): Commands as a list; Where the game state lives; The shape of a game loop; The real game loop; Playing for real with input()

### Python L1 (6 modules + capstone, 23 lessons)

**Module `collections`: Lists, Dicts, Sets & Tuples** · yml project: Word frequency counter · mini-project exercise: Word frequency counter (in `comprehensions`)

- `01-lists-in-depth` Lists in Depth (15m, 20xp, ex 1, quiz 2): Indexing from both ends; Slicing; Adding items; Removing and finding items; Sorting: sort() vs sorted(); Nested lists; Copying vs aliasing; Checking with in, and unpacking
- `02-dictionaries` Dictionaries (15m, 20xp, ex 1, quiz 2): Creating a dictionary; Reading values with [] and .get(); Adding, updating and deleting; Checking for a key with in; Looping over a dictionary; Counting with a dictionary; Nested dictionaries; Dicts remember their order
- `03-tuples-and-sets` Tuples and Sets (12m, 20xp, ex 1, quiz 2): Tuples: lists that can't change; Packing and unpacking; Returning several values; Tuples as dictionary keys; Sets: only unique items; Adding, removing and checking; Set maths; Choosing the right collection
- `04-comprehensions` Comprehensions (15m, 25xp, ex 1, quiz 2): List comprehensions; Filtering with if; Dict and set comprehensions; Nested comprehensions; enumerate and zip; When not to use a comprehension

**Module `files-and-exceptions`: Files & Exceptions** · yml project: — · mini-project exercise: NONE

- `01-exceptions` Exceptions (14m, 20xp, ex 1, quiz 2): Reading a traceback; Common exceptions; try and except; Catching specific exceptions with as e; else and finally; Raising your own exceptions; Validating input; EAFP vs LBYL
- `02-reading-and-writing-files` Reading and Writing Files (14m, 20xp, ex 1, quiz 1): Writing a file; Reading line by line; Newlines and strip(); Appending and writing many lines; pathlib: the modern way; When the file isn't there
- `03-csv-and-json` CSV and JSON (15m, 25xp, ex 1, quiz 2): Writing and reading CSV; DictReader: rows as dictionaries; DictWriter: writing dictionaries; JSON strings: dumps and loads; JSON files: dump and load; Saving and loading app data

**Module `classes`: Classes & OOP** · yml project: Library management system · mini-project exercise: Library management system (in `special-methods`)

- `01-classes-and-objects` Classes and Objects (15m, 25xp, ex 1, quiz 2): Your first class; Methods: functions that belong to a class; Objects remember their state; Class attributes vs instance attributes; Properties: attributes with validation; Alternative constructors with @classmethod
- `02-inheritance` Inheritance (15m, 25xp, ex 1, quiz 2): Creating a subclass; super().__init__: extending the setup; Overriding methods; isinstance and issubclass; Custom exceptions; Composition vs inheritance; @dataclass: a shortcut for data classes
- `03-enums-and-pattern-matching` Enums & Pattern Matching (18m, 20xp, ex 1, quiz 2): Magic strings and why they hurt; Your first enum; auto(), looping and looking up; Comparing members; match with enum members; Sequence patterns: matching lists; Mapping patterns: matching dictionaries; Class patterns: matching objects; When to use match (and when not)
- `04-special-methods` Special (Dunder) Methods (15m, 25xp, ex 1, quiz 2): __str__ and __repr__: printing objects; __eq__: when are two objects equal?; __lt__: sorting your objects; __len__, __contains__ and __iter__: acting like a collection

**Module `modules-and-packages`: Modules, pip & Virtual Environments** · yml project: — · mini-project exercise: NONE

- `01-modules-and-imports` Modules and Imports (15m, 20xp, ex 1, quiz 1): import; from … import and as; A tour of the standard library; Writing your own module; Running vs importing: if __name__ == "__main__":; Exploring with dir() and help()
- `02-pip-and-virtual-environments` pip and Virtual Environments (12m, 20xp, ex 0, quiz 2) **[NO EXERCISE; no CodeExample]**: Packages and PyPI; Why virtual environments?; Creating a virtual environment; Activating it; Installing packages with pip; requirements.txt and pip freeze; Keep .venv out of Git; The whole workflow

**Module `text-and-automation`: Text, Dates & Automation** · yml project: Log file analyser · mini-project exercise: Log file analyser (in `automating-files`)

- `01-regular-expressions` Regular Expressions (18m, 20xp, ex 1, quiz 2): Why regular expressions?; Raw strings: r"..."; search, match and fullmatch; Character classes; Quantifiers: how many?; Anchors: where the match is; Groups: pulling out the parts; finditer, sub and split; Flags; Compiling patterns; Validating vs extracting; Testing your patterns
- `02-dates-and-times` Dates and Times (18m, 20xp, ex 1, quiz 2): date, time and datetime; timedelta: lengths of time; Formatting with strftime; Parsing with strptime; Comparing and sorting dates; Naive vs aware datetimes; Time zones with zoneinfo; Store in UTC, show in local time; Date arithmetic pitfalls; Inject "now" for testable code
- `03-automating-files` Automating Files (20m, 25xp, ex 1, quiz 2): Paths with pathlib; Creating folders and checking what exists; Looking inside folders: iterdir, glob and rglob; Organising a Downloads folder; Batch renaming safely: dry run first; Copying and moving with shutil; Writing reports; Real scripts on your computer; Mini-project: Log file analyser

**Module `algorithms`: Algorithms & Data Structures** · yml project: Maze solver · mini-project exercise: Maze solver (in `stacks-queues-and-hash-maps`)

- `01-recursion` Recursion (16m, 20xp, ex 1, quiz 2): A function that calls itself; Base case and recursive case; The call stack; Recursion on lists; Recursion on nested data; RecursionError: when it never stops; When a loop is better; Memoisation: remembering answers
- `02-big-o` Big-O: How Fast Is Your Code? (16m, 20xp, ex 1, quiz 2): Count steps, not seconds; O(1): constant time; O(n²): loops inside loops; O(log n): halving the problem; O(n log n): good sorting; Best case and worst case; Why in is slow on a list but fast on a set; Space complexity; Rules of thumb
- `03-searching-and-sorting` Searching and Sorting (18m, 20xp, ex 1, quiz 2): Linear search: the simple way; Binary search: halve it every time; The bisect module; Insertion sort; Merge sort; sorted() and list.sort(): use these; Sorting by several keys; Top k with heapq
- `04-stacks-queues-and-hash-maps` Stacks, Queues and Hash Maps (20m, 25xp, ex 1, quiz 2): Stacks: last in, first out; Queues: first in, first out; Priority queues with heapq; Dicts and sets are hash maps; Graphs: dicts of neighbours; Breadth-first search; Grids are graphs too

**Capstone `expense-tracker`: Command-line expense tracker that saves to files**

- `01-modelling-expenses` Part 1: Modelling expenses (20m, 30xp, ex 1, quiz 1): A word about money and floats; The Expense dataclass; Checking a date; Validating with __post_init__; The ExpenseTracker class; Totals per category
- `02-saving-to-files` Part 2: Saving to files (25m, 30xp, ex 1, quiz 1): From an expense to a dict; Writing a CSV file; Reading it back: everything is text; When the file doesn't exist yet; Surviving a broken row; Saving and loading JSON; Picking the format from the file name; Round-trip tests
- `03-the-command-line` Part 3: The command line (25m, 30xp, ex 1, quiz 1): Splitting a command into words; Friendly errors for bad input; Lining up columns; Grouping by month; The command loop; Running it on your computer

### Python L2 (9 modules + capstone, 33 lessons)

**Module `power-tools`: Type Hints, Decorators & Generators** · yml project: — · mini-project exercise: NONE

- `01-type-hints` Type Hints (16m, 20xp, ex 1, quiz 2): Annotating a function; Python doesn't check them; Lists, dicts and other collections; Maybe nothing: X | None; Type aliases: naming a type; TypedDict and Literal; Why tools love type hints
- `02-decorators` Decorators (18m, 25xp, ex 1, quiz 2): Functions are values; Functions inside functions; Your first decorator; Keep the name with functools.wraps; Decorators with arguments; Built-in decorators; Why frameworks love decorators
- `03-generators-and-context-managers` Generators and Context Managers (20m, 25xp, ex 1, quiz 2): yield: a function that pauses; Lazy: values only when needed; Generator expressions; Generator pipelines; itertools: ready-made generator tools; with: always clean up; @contextlib.contextmanager: the short way

**Module `testing`: Testing with pytest** · yml project: — · mini-project exercise: NONE

- `01-first-tests` Your First Tests (16m, 25xp, ex 1, quiz 2): Why automate your checks?; Your first pytest tests; Reading a failure report; Arrange, act, assert; Testing errors with pytest.raises; Comparing decimals with pytest.approx; What should you test?
- `02-fixtures-and-parametrize` Fixtures and Parametrize (18m, 25xp, ex 1, quiz 2): The problem: copied setup; Fixtures: setup you ask for by name; Setup and teardown with yield; Fixture scope; Sharing fixtures with conftest.py; One test, many inputs: parametrize; Temporary files with tmp_path; Skip and xfail
- `03-mocks-and-coverage` Mocks, Coverage and TDD (18m, 25xp, ex 1, quiz 2): Test doubles; Mock: a double that records everything; side_effect: errors and sequences; patch: replace something for a moment; pytest's monkeypatch fixture; Time and randomness: inject them; Coverage: what did your tests miss?; The TDD loop: red, green, refactor

**Module `web-apis`: Web APIs with FastAPI** · yml project: To-do API · mini-project exercise: To-do API (in `todo-api`)

- `01-first-api` Your First API with FastAPI (18m, 20xp, ex 1, quiz 2): HTTP in 5 minutes; REST: nouns in the path, verbs in the method; A first FastAPI app; Running a real server; Path parameters; Query parameters; Same path, different methods; Automatic docs at /docs
- `02-request-validation` Request Bodies and Validation (18m, 25xp, ex 1, quiz 2): Pydantic models; Request bodies; Rules with Field; Status codes and HTTPException; response_model: control what goes out; model_dump for partial updates
- `03-todo-api` Mini-project: To-do API (20m, 25xp, ex 1, quiz 2): An in-memory store; Sharing logic with Depends; Organising with APIRouter; Testing the API with pytest; Running it for real

**Module `databases`: Databases & SQLAlchemy** · yml project: — · mini-project exercise: NONE

- `01-sql-basics` SQL Basics (20m, 25xp, ex 1, quiz 2): Tables, rows and primary keys; Creating a table and adding rows; SELECT with WHERE, ORDER BY and LIMIT; Rows you can read by name; UPDATE and DELETE; Counting and grouping; Joining two tables; Parameters and SQL injection; Transactions: all or nothing
- `02-sqlalchemy-orm` The SQLAlchemy ORM (18m, 25xp, ex 1, quiz 2): Why an ORM?; Defining a model; The Session: add and commit; Querying with select(); Updating and deleting
- `03-relationships-and-migrations` Relationships and Migrations (20m, 25xp, ex 1, quiz 2): ForeignKey and relationship(); Querying across a relationship; The N+1 problem and selectinload; Why migrations?; The Alembic workflow

**Module `async`: Async Python** · yml project: — · mini-project exercise: NONE

- `01-async-await` Async and Await (16m, 20xp, ex 1, quiz 2): Waiting vs working; Coroutines: async def; await: pause here, come back later; The event loop; Mistake 1: forgetting await; Mistake 2: blocking the event loop
- `02-concurrent-tasks` Running Tasks Concurrently (18m, 25xp, ex 1, quiz 2): gather: run several and collect the results; create_task: start now, await later; TaskGroup: the modern way; as_completed: handle results as they arrive; Limiting concurrency with a Semaphore; Producer and consumer with a Queue
- `03-timeouts-and-cancellation` Timeouts, Cancellation and Errors (20m, 25xp, ex 1, quiz 2): Timeouts: don't wait forever; Cancelling a task; Errors in gather; Errors in a TaskGroup: ExceptionGroup and except*; async with, async for and async generators; Where async is used for real

**Module `web-clients`: APIs & Web Scraping** · yml project: Data report generator · mini-project exercise: Data report generator (in `report-generator`)

- `01-http-requests` Calling APIs with requests (18m, 25xp, ex 1, quiz 2): The practice API; Your first request; Query parameters with params=; Reading the response; Sending data: POST, PATCH and DELETE; Request headers: who you are and what you want; Sessions: settings shared by many requests; Always set a timeout; httpx: the modern alternative
- `02-robust-api-clients` Robust API Clients (20m, 25xp, ex 1, quiz 2): Everything that can go wrong; Which errors are worth retrying?; Retries with exponential backoff; Pagination: getting every page; A small typed client class; Testing an API client; Many requests at once with httpx.AsyncClient; Caching responses
- `03-web-scraping` Web Scraping with Beautiful Soup (20m, 25xp, ex 1, quiz 2): Scrape or use an API?; HTML in two minutes, and your first soup; CSS selectors on a real page; Cleaning the values; Following links across pages; Detail pages; Reading robots.txt; Being polite; Scrapers that don't break easily
- `04-report-generator` Mini-project: Data Report Generator (20m, 30xp, ex 1, quiz 2): Collecting from an API; Collecting from the shop; Aggregating with plain Python; Writing Markdown; Writing the files with pathlib

**Module `data-analysis`: Data Analysis with pandas** · yml project: Analyse a public dataset · mini-project exercise: Analyse a public dataset (in `analyse-a-dataset`)

- `01-dataframes` Series and DataFrames (18m, 25xp, ex 1, quiz 2): Installing and importing pandas; Series: one labelled column; DataFrame: a whole table; Reading CSV data; A first look at the data; Selecting columns; Filtering rows; loc and iloc; Sorting; Adding new columns; Why not just loop?
- `02-cleaning-and-grouping` Cleaning and Grouping Data (20m, 25xp, ex 1, quiz 2): Meet the messy data; Missing values: isna, dropna, fillna; Fixing types: to_numeric, astype, to_datetime; Cleaning text with .str; Counting with value_counts; Grouping: split, apply, combine; Combining tables with merge; Your first chart
- `03-analyse-a-dataset` Mini-project: Analyse a Public Dataset (20m, 25xp, ex 1, quiz 1): The analysis workflow; Load and inspect; Clean; Who lives where?; Heaviest species, and males vs females; A new measurement: bill shape; Charts; Conclusions

**Module `statistics`: Charts & Statistics** · yml project: A/B test report · mini-project exercise: A/B test report (in `ab-test-report`)

- `01-better-charts` Better Charts (20m, 25xp, ex 1, quiz 2): Figure and Axes; Several charts in one figure; Choosing the right chart; Titles, labels, legends and annotations; Charts that mislead; Colours everyone can read; pandas charts on your own Axes; Saving charts for reports
- `02-describing-data` Describing Data (20m, 25xp, ex 1, quiz 2): The middle: mean, median and mode; Spread: how different are the values?; Spread in NumPy and pandas; Percentiles and the IQR; The shape of a distribution; Outliers; Correlation; Correlation is not causation; Always plot your data
- `03-samples-and-uncertainty` Samples and Uncertainty (20m, 25xp, ex 1, quiz 2): Populations and samples; Random numbers you can repeat; The law of large numbers; How much do sample means wobble?; Confidence intervals with the bootstrap; Is the difference real? Hypothesis testing; What a p-value is, and isn't; The same tests with scipy.stats; Big samples, tiny effects; Common mistakes
- `04-ab-test-report` Mini-project: A/B Test Report (20m, 30xp, ex 1, quiz 1): Plan before you look; The data; Step 1: conversion rates; Step 2: how sure are we?; Step 3: could it be luck?; Step 4: the decision; Step 5: a chart for the report; Step 6: check the guardrails; Step 7: write the report

**Module `machine-learning`: Machine Learning** · yml project: Spam detector · mini-project exercise: Spam detector (in `text-classification`)

- `01-numpy-arrays` NumPy Arrays (18m, 25xp, ex 1, quiz 2): Lists vs arrays; Shape, ndim and dtype; Creating arrays; Maths on whole arrays; Indexing, slicing and masks; Summaries along an axis; Reshaping; Why NumPy is fast; NumPy under pandas
- `02-your-first-model` Your First Model (18m, 25xp, ex 1, quiz 2): What is machine learning?; Features and labels; Regression or classification?; The scikit-learn recipe; Predicting rent with linear regression; Seeing the line; More than one feature; A classifier: which iris is it?; A model you can read: decision trees
- `03-evaluating-models` Evaluating Models (20m, 25xp, ex 1, quiz 2): Why training accuracy lies; Splitting into training and test data; Accuracy needs a baseline; The confusion matrix; Precision, recall and F1; Overfitting and underfitting; Cross-validation; Scaling features with a pipeline; Choosing a metric
- `04-text-classification` Mini-project: Text Classification (20m, 30xp, ex 1, quiz 1): Bag of words; TF-IDF: not all words are equal; A Naive Bayes classifier; A pipeline for text; Which words are spammy?; Limits and ethics

**Capstone `rest-api`: REST API with FastAPI, a database and full test coverage**

- `01-models-and-storage` Part 1: Models and storage (22m, 30xp, ex 1, quiz 1): The models; Why cascade matters; Repository functions; Optional filters; Testing the repository
- `02-the-endpoints` Part 2: The endpoints (22m, 30xp, ex 1, quiz 1): Schemas: what goes in and what comes out; One session per request; The project endpoints; Routes for tasks; Running it for real
- `03-tests-and-polish` Part 3: Tests and polish (22m, 30xp, ex 1, quiz 1): Two layers, two kinds of tests; A fresh database for every test; Fixtures on fixtures; Testing errors with parametrize; Did it really save?; Running it for real

### Python L3 (6 modules + capstone, 22 lessons)

**Module `internals`: Python Internals** · yml project: — · mini-project exercise: NONE

- `01-how-python-runs-code` How Python Runs Your Code (22m, 25xp, ex 1, quiz 2): CPython: the Python you're running; From source to bytecode; Reading bytecode with dis; .pyc files and __pycache__; Everything is an object; Names bind to objects; Aliasing bugs you'll meet in real code; Interning: a curiosity, not a feature; Frames and the call stack
- `02-memory-and-the-gil` Memory Management and the GIL (24m, 25xp, ex 1, quiz 2): Reference counting; Cycles and the garbage collector; Weak references for caches; __slots__ and object size; Finding a leak with tracemalloc; The GIL: what it actually is; Threads for I/O, processes for CPU; Free-threaded Python and sub-interpreters
- `03-descriptors-and-metaclasses` Descriptors and Metaclasses (25m, 30xp, ex 1, quiz 2): How Python finds an attribute; __getattr__ vs __getattribute__; Descriptors: objects that control attribute access; A reusable validated field; __init_subclass__: hooks for subclasses; Class decorators; Metaclasses: the class of a class

**Module `performance`: Performance & Concurrency** · yml project: — · mini-project exercise: NONE

- `01-profiling` Profiling (22m, 25xp, ex 1, quiz 2): Measure, don't guess; timeit: timing small pieces of code; Big-O in practice; cProfile: where does the time go?; tracemalloc: where does the memory go?; A profiling workflow
- `02-caching-and-optimisation` Caching and Optimisation (24m, 25xp, ex 1, quiz 2): Don't repeat work: functools.cache; lru_cache: a cache with a size limit; Cache invalidation pitfalls; Build your own: an LRU cache with OrderedDict; Save memory with generators; Vectorise with numpy; Cheap wins; When to reach for native code
- `03-threads-and-processes` Threads and Processes (25m, 30xp, ex 1, quiz 2): Concurrency vs parallelism; Threads for I/O; Race conditions and locks; Processes for CPU work; The concurrent.futures API; Threads, processes or asyncio?

**Module `deep-learning`: Deep Learning & LLMs** · yml project: Tiny language model · mini-project exercise: Tiny language model (in `tiny-language-model`)

- `01-neurons-and-gradient-descent` Neurons and Gradient Descent (22m, 30xp, ex 1, quiz 2): A neuron is a tiny function; Measuring how wrong: the loss; Derivative = slope; Gradient descent, by hand; The learning rate; One neuron that classifies; Vectorised training; The same loop in PyTorch
- `02-a-neural-network-from-scratch` A Neural Network from Scratch (25m, 30xp, ex 1, quiz 2): Layers are matrix multiplications; Activations; Why non-linearity matters; The forward pass; Backpropagation, step by step; Gradient checking; Training on XOR; Mini-batches and epochs; Reading handwritten digits; Overfitting, regularisation and dropout; How frameworks do it
- `03-how-llms-work` How LLMs Work (25m, 30xp, ex 1, quiz 2): From text to tokens; Embeddings: tokens as vectors; Predicting the next token; Attention: letting tokens look at each other; The transformer block; Training at scale; Context windows and hallucinations; Using an LLM from Python
- `04-tiny-language-model` Mini-project: Tiny Language Model (25m, 35xp, ex 1, quiz 1): Vocabulary, encoding and decoding; Training pairs; The baseline: counting; A neural bigram model; Generating text; From here to GPT

**Module `architecture`: Architecture & Design Patterns** · yml project: — · mini-project exercise: NONE

- `01-design-patterns` Design Patterns the Pythonic Way (22m, 25xp, ex 1, quiz 2): SOLID in Python terms; Composition over inheritance; Protocols: duck typing with type hints; Strategy: functions are already strategies; Factory and registry; Observer: events instead of calls; Adapter: make it fit; When patterns hurt
- `02-clean-architecture` Clean Architecture in Python (24m, 25xp, ex 1, quiz 2): Three layers; The dependency rule; The repository pattern; A SQLAlchemy repository; The unit of work; Testing with fakes
- `03-dependency-injection-and-ddd` Dependency Injection and Domain-Driven Design (25m, 30xp, ex 1, quiz 2): Hard-wired dependencies; Constructor injection; The composition root; FastAPI's Depends is dependency injection; DDD-light: speak the business language

**Module `security-and-deployment`: Security & Deployment** · yml project: — · mini-project exercise: NONE

- `01-secure-coding` Secure Coding (22m, 25xp, ex 1, quiz 2): Think like an attacker; Injection: never build queries from strings; Never eval or unpickle untrusted input; Validate everything at the boundary; Secrets belong in the environment; Hashing passwords: why not SHA-256?; Comparing secrets and making tokens; Auditing your dependencies
- `02-auth-for-apis` Authentication and Authorisation for APIs (24m, 25xp, ex 1, quiz 2): Authentication vs authorisation; Sessions or tokens?; How a signed token works; Protecting routes in FastAPI; Roles, permissions and ownership; Rate limiting
- `03-containers-and-deployment` Containers and Deployment (25m, 30xp, ex 1, quiz 2): Config from the environment (the 12-factor way); Structured logging; Health checks; Packaging the app in a container; Workers behind a reverse proxy; Continuous integration; Deploying without downtime; Monitoring and alerts

**Module `system-design`: System Design & Leadership** · yml project: — · mini-project exercise: NONE

- `01-designing-systems` Designing Systems (25m, 25xp, ex 1, quiz 2): Start with requirements, not boxes; Back-of-the-envelope maths; Scaling up vs scaling out; Load balancers; Caching; Database replicas and sharding; Queues and background workers; CAP in plain words
- `02-resilience-patterns` Resilience Patterns (25m, 25xp, ex 1, quiz 2): How things fail; Timeouts: never wait forever; Retries with exponential backoff; Idempotency keys: safe to repeat; Circuit breakers: stop calling a dead service; Rate limiting with a token bucket; Graceful degradation
- `03-code-review-and-leadership` Code Review and Technical Leadership (22m, 30xp, ex 1, quiz 2): What code review is for; Reading code like a reviewer; Writing kind, specific feedback; Design docs and RFCs; Tech debt; Estimates; Mentoring juniors

**Capstone `production-service`: Design and deploy a scalable, production-ready service**

- `01-design-and-core` Part 1: Design and core (25m, 30xp, ex 1, quiz 2): Start with a design doc; Back-of-the-envelope numbers; Base62 codes; Value objects for codes and URLs; The link entity and the repository port; The LinkService; Testing the core
- `02-api-and-resilience` Part 2: API and resilience (25m, 30xp, ex 1, quiz 2): A SQL repository; Cache-aside in front of the repository; Rate limiting per client; API keys; Redirects, errors and logs; Wiring and testing the app
- `03-ship-it` Part 3: Ship it (25m, 30xp, ex 1, quiz 1): Settings from the environment; The composition root; Docker and Compose; Continuous integration; Observability and alerts; Load testing; The production checklist

## SQL

### SQL L0 (4 modules + capstone, 15 lessons)

**Module `first-queries`: Your First Queries** · yml project: — · mini-project exercise: NONE

- `01-what-is-a-database` What Is a Database? (12m, 15xp, ex 1, quiz 2): What is a database?; Tables, rows and columns; Your first query; Reading a result; A tour of the sample database; SQL's grammar rules; When something goes wrong
- `02-choosing-columns` Choosing Columns (14m, 20xp, ex 1, quiz 2): Picking the columns you want; Rows in a predictable order; Renaming columns with AS; Single quotes and double quotes; Calculating new columns; Removing duplicates with DISTINCT
- `03-filtering-with-where` Filtering Rows with WHERE (15m, 20xp, ex 1, quiz 2): Your first WHERE; Comparing values; Combining conditions with AND, OR and NOT; IN: matching one of a list; BETWEEN: a range of values; LIKE and ILIKE: matching patterns

**Module `sorting-and-limiting`: Sorting, Limiting & NULL** · yml project: — · mini-project exercise: NONE

- `01-sorting-with-order-by` Sorting with ORDER BY (13m, 20xp, ex 1, quiz 1): ORDER BY: smallest first; DESC: largest first; Sorting by several columns; Ties and tie-breakers; Sorting by a calculated value
- `02-limit-and-offset` LIMIT, OFFSET and Paging (13m, 20xp, ex 1, quiz 2): LIMIT: only the first few rows; OFFSET: skipping rows; Paging through results; FETCH FIRST: the standard way
- `03-null-values` NULL: Missing Values (15m, 20xp, ex 1, quiz 2): What NULL means; Why = NULL finds nothing; IS NULL and IS NOT NULL; Three-valued logic; NULL in calculations; COALESCE: a fallback for missing values; Sorting NULLs

**Module `functions`: Text, Numbers & Dates** · yml project: — · mini-project exercise: NONE

- `01-text-functions` Text Functions (14m, 20xp, ex 1, quiz 2): Gluing text together with ||; Changing capitals: upper, lower, initcap; Measuring and cutting: length, left, right, substring; Searching and replacing: position, replace, trim; Splitting text: split_part; Functions in WHERE and ORDER BY
- `02-number-functions` Numbers and Maths (14m, 20xp, ex 1, quiz 2): The arithmetic operators; The integer division trap; Rounding: round, ceil, floor; Types and casting with ::; numeric vs float: exact or fast
- `03-date-functions` Dates and Times (15m, 20xp, ex 1, quiz 2): Date and time types; Filtering by date; Calculating with dates; Pulling out parts with extract; Rounding dates with date_trunc; Formatting with to_char; How long ago: age

**Module `aggregation`: Counting & Grouping** · yml project: Shop sales summary · mini-project exercise: Shop sales summary (in `having`)

- `01-aggregate-functions` Counting and Totals (14m, 20xp, ex 1, quiz 2): Counting rows with count(*); count(column) skips NULLs; Counting different values: count(DISTINCT ...); Adding up and averaging: sum and avg; Smallest and largest: min and max; Several aggregates at once; When no rows match; Mixing aggregates and plain columns
- `02-group-by` Grouping with GROUP BY (15m, 20xp, ex 1, quiz 2): One row per group; The golden rule of GROUP BY; Sorting and limiting groups; WHERE first, then GROUP BY; Grouping by a calculation; Grouping by several columns
- `03-having` Filtering Groups with HAVING (15m, 25xp, ex 1, quiz 2): HAVING filters groups; WHERE vs HAVING; The order a query runs in; Mini-project: Shop sales summary

**Capstone `movie-night`: Movie night report**

- `01-movie-night-catalogue` Part 1: Exploring the catalogue (15m, 25xp, ex 1, quiz 2): Meet the catalogue; Question 1: What are our best films?; Question 2: Something short for a weeknight; Question 3: Which genres do we have?; Question 4: Searching by title; Question 5: Comedies and dramas from before 2020; Question 6: The catalogue, page by page
- `02-movie-night-numbers` Part 2: The numbers behind the films (15m, 25xp, ex 1, quiz 2): Runtimes people can read; Labels and ages; Planning the meeting; The catalogue in one row; Genres and decades with GROUP BY; Favourite directors with HAVING
- `03-movie-night-report` Part 3: The movie night report (15m, 25xp, ex 1, quiz 1): Planning the report; Sections 1 and 2: the headline; A little trivia; Section 4: tonight's film

### SQL L1 (4 modules + capstone, 15 lessons)

**Module `joins`: Joining Tables** · yml project: — · mini-project exercise: NONE

- `01-inner-join` Inner joins (15m, 20xp, ex 1, quiz 2): Why data lives in several tables; Your first JOIN; Table aliases with AS; Ambiguous columns; Joining on the wrong columns; How many rows come out?; Joining and grouping
- `02-outer-joins` Outer joins and missing rows (15m, 20xp, ex 1, quiz 2): The customers an inner join forgets; LEFT JOIN keeps every row on the left; Counting with a LEFT JOIN; Finding missing rows: the anti-join; ON or WHERE? It matters; RIGHT JOIN; FULL JOIN keeps both sides
- `03-self-joins` Self joins and multi-table joins (18m, 25xp, ex 1, quiz 2): A table that points at itself; Joining a table to itself; Keeping the boss; Counting direct reports; Pairs within one table; Joining three or more tables; CROSS JOIN: every combination

**Module `subqueries`: Subqueries & CTEs** · yml project: — · mini-project exercise: NONE

- `01-queries-inside-queries` Queries Inside Queries (18m, 25xp, ex 1, quiz 2): A subquery that returns one value; A list of values with IN; The NOT IN trap: NULL in the list; Yes or no with EXISTS; Correlated subqueries: one answer per row; Subqueries in FROM
- `02-common-table-expressions` Naming Steps with WITH (CTEs) (16m, 25xp, ex 1, quiz 1): Your first CTE; Several steps in a row; Using a step twice; Naming the columns; A CTE lives for one statement; CTEs or subqueries?
- `03-union-intersect-except` Combining Results with UNION, INTERSECT and EXCEPT (15m, 25xp, ex 1, quiz 2): UNION ALL: stacking two results; UNION removes duplicates; The rules, and the errors when you break them; INTERSECT: rows in both; EXCEPT: rows in the first but not the second; A report with a total row

**Module `changing-data`: Inserting, Updating & Deleting** · yml project: — · mini-project exercise: NONE

- `01-insert-rows` Adding Rows with INSERT (16m, 25xp, ex 1, quiz 2): Your first INSERT; Columns you leave out; Several rows at once; Getting values back with RETURNING; When the database says no; Copying rows with INSERT … SELECT; Using a new id straight away
- `02-update-and-delete` Changing and Removing Rows Safely (18m, 25xp, ex 1, quiz 2): UPDATE: change some rows; The missing WHERE; Seeing what changed with RETURNING; UPDATE … FROM: using another table; DELETE: remove rows
- `03-upserts-and-transactions` Upserts and Transactions (18m, 25xp, ex 1, quiz 2): ON CONFLICT DO NOTHING; ON CONFLICT DO UPDATE; Adding to a basket; The conflict target needs a unique rule; Transactions: all or nothing; ROLLBACK: the undo button; SAVEPOINT: undo part of a transaction

**Module `designing-tables`: Designing Tables** · yml project: Library database · mini-project exercise: Library database (in `normalisation-and-relationships`)

- `01-creating-tables` Creating Tables and Choosing Data Types (16m, 20xp, ex 1, quiz 2): Your first CREATE TABLE; Choosing data types; Identity columns: let the database number rows; Looking at a table's structure; Changing a table with ALTER TABLE; Removing a table with DROP TABLE
- `02-constraints-and-keys` Constraints and Keys (18m, 25xp, ex 1, quiz 2): A table with no rules; NOT NULL and DEFAULT; PRIMARY KEY; UNIQUE; CHECK; FOREIGN KEY: links between tables; Adding constraints to an existing table
- `03-normalisation-and-relationships` Normalisation and Relationships (18m, 30xp, ex 1, quiz 2): The trouble with one big table; Splitting into tables; One-to-many and many-to-many; The normal forms: 1NF, 2NF and 3NF; When to copy data on purpose; Mini-project: Library database

**Capstone `shop-analytics`: Online shop analytics**

- `01-shop-revenue-by-month` Shop Analytics: Revenue by Month (18m, 30xp, ex 1, quiz 1): Know your data first; Step 1: a total for every order; Step 2: the headline numbers; Step 3: revenue by month; Step 4: where the money comes from
- `02-shop-customers-and-products` Shop Analytics: Customers and Products (18m, 30xp, ex 1, quiz 1): The best customers; Do customers come back?; Customers who never ordered; Best sellers; Products that never sold: a trap
- `03-shop-board-report` Shop Analytics: Stock Alerts and the Board Report (18m, 30xp, ex 1, quiz 1): Stock alerts; Will the stock last?; Saving the restock list; The board report

### SQL L2 (4 modules + capstone, 15 lessons)

**Module `window-functions`: Window Functions** · yml project: — · mini-project exercise: NONE

- `01-window-functions-and-ranking` Window Functions, Partitions and Ranking (22m, 25xp, ex 1, quiz 2): GROUP BY squashes rows; OVER: an aggregate that keeps the rows; PARTITION BY: one window per group; Numbering rows: ROW_NUMBER, RANK and DENSE_RANK; Ranking inside each group; Top N per group; Windows on top of GROUP BY
- `02-running-totals-and-frames` Running Totals, Moving Averages and Frames (22m, 25xp, ex 1, quiz 2): Running totals; Running totals per group; Window frames: which rows does each row see?; ROWS vs RANGE: the peer trap; Moving averages with ROWS; RANGE with distances: time-based windows; Cumulative share: the 80/20 check
- `03-lag-lead-and-distribution` LAG, LEAD, NTILE and Friends (22m, 25xp, ex 1, quiz 2): LAG: look at the previous row; LEAD: look at the next row; FIRST_VALUE and LAST_VALUE; NTILE, PERCENT_RANK and CUME_DIST

**Module `advanced-queries`: Advanced Queries** · yml project: — · mini-project exercise: NONE

- `01-case-and-pivots` CASE, Conditional Aggregation and Pivots (20m, 25xp, ex 1, quiz 2): CASE: if/else inside a query; Simple CASE and custom sort orders; Grouping by a CASE; Conditional aggregation with FILTER; Pivoting money: quarter by quarter; Unpivoting: columns back into rows
- `02-recursive-ctes` Recursive CTEs (24m, 25xp, ex 1, quiz 2): The anatomy of WITH RECURSIVE; Loops with an unknown number of steps; Walking down a tree: the org chart; Walking up a tree: the chain of command; Totals for every subtree; Paths through a graph; Keeping recursion safe
- `03-jsonb-and-arrays` JSONB and Arrays (25m, 25xp, ex 1, quiz 2): Rows into lists: array_agg and string_agg; Array columns; Searching arrays: ANY, @> and &&; Lists back into rows: unnest; JSONB: documents inside a column; Filtering JSONB: ->>, @> and ?; Building JSON for an API; Changing JSONB; Indexes for JSONB and arrays: GIN

**Module `indexes-and-performance`: Indexes & Performance** · yml project: — · mini-project exercise: NONE

- `01-explain-query-plans` Reading Query Plans with EXPLAIN (22m, 25xp, ex 1, quiz 2): How PostgreSQL runs a query; A table big enough to matter; EXPLAIN ANALYZE: what really happened; Index scans; Sorting and limiting; How joins are planned; Estimates versus reality; On a real server
- `02-choosing-indexes` Choosing the Right Indexes (24m, 25xp, ex 1, quiz 2): What a B-tree index is; Multicolumn indexes: order matters; Partial indexes: index only the rows you query; Expression indexes; Covering indexes and index-only scans; Unique indexes; When indexes don't help; What indexes cost
- `03-query-tuning` Tuning Slow Queries (25m, 25xp, ex 1, quiz 2): Sargable conditions: leave the column alone; Don't SELECT * in application code; Pagination: keyset beats OFFSET; N+1 queries: the app-side killer; Statistics: keep the planner informed

**Module `views-and-functions`: Views, Functions & Triggers** · yml project: — · mini-project exercise: NONE

- `01-views-and-materialized-views` Views and Materialized Views (20m, 25xp, ex 1, quiz 2): Creating a view; A view stores the query, not the data; Changing and dropping views; Updatable views and WITH CHECK OPTION; Materialized views: store the result
- `02-functions-and-procedures` Functions, Procedures and DO Blocks (25m, 25xp, ex 1, quiz 1): Your first SQL function; Functions that return tables; Volatility: IMMUTABLE, STABLE, VOLATILE; PL/pgSQL: variables, IF and loops; Raising and catching errors; DO blocks: one-off scripts; Procedures: functions that can commit
- `03-triggers` Triggers (24m, 25xp, ex 1, quiz 2): Your first trigger: normalising data; BEFORE or AFTER, ROW or STATEMENT; Keeping updated_at current; An audit log; Validation triggers; Statement-level triggers; When not to use a trigger

**Capstone `analytics-dashboard`: Analytics dashboard queries**

- `01-dashboard-activity-and-growth` Part 1: Active customers and growth (22m, 30xp, ex 1, quiz 2): One row per paid order; Monthly active customers; No gaps allowed: a calendar with generate_series; Growth vs the previous period; Rolling windows: active in the last 30 days
- `02-dashboard-retention-and-funnels` Part 2: Cohort retention and conversion funnels (25m, 30xp, ex 1, quiz 2): Cohorts: grouping customers by when they started; Months since the first order; The retention table; The conversion funnel; Comparing segments
- `03-dashboard-rankings-and-views` Part 3: Rankings, moving averages and the final dashboard (25m, 30xp, ex 1, quiz 2): Leaderboards: three ways to rank; Top 2 per category, with their share; Which customers matter most?; Trend lines: a 4-week moving average; Packaging the dashboard as views; The final dashboard query set

### SQL L3 (4 modules + capstone, 15 lessons)

**Module `transactions-and-concurrency`: Transactions & Concurrency** · yml project: — · mini-project exercise: NONE

- `01-acid-and-isolation-levels` ACID, Transactions and Isolation Levels (25m, 30xp, ex 1, quiz 2): ACID, one letter at a time; Atomicity in action; Transactions in depth; What goes wrong when transactions overlap; Isolation levels in PostgreSQL; Fixing the lost update
- `02-row-locks-and-job-queues` Locks, Job Queues and Deadlocks (25m, 30xp, ex 1, quiz 2): Row locks: writers wait for writers; SELECT … FOR UPDATE: lock while you decide; Job queues with SKIP LOCKED; Deadlocks; Table locks and the migration incident; Advisory locks: locks for your own ideas; Who is blocking whom?
- `03-mvcc-and-vacuum` MVCC, VACUUM and Long Transactions (25m, 30xp, ex 1, quiz 2): Every row has hidden columns; UPDATE writes a new version; Snapshots: who sees which version; Dead tuples and table bloat; VACUUM cleans up; Autovacuum; HOT updates and fillfactor; Long transactions: the silent killer

**Module `data-modeling`: Advanced Data Modelling** · yml project: — · mini-project exercise: NONE

- `01-modeling-patterns` Modelling Patterns (22m, 30xp, ex 1, quiz 2): Soft deletes; History: what was true, and when; Hierarchies: two ways to store a tree; Flexible attributes: columns, JSONB or EAV
- `02-advanced-constraints` Advanced Integrity Constraints (22m, 30xp, ex 1, quiz 2): Domains: a type with rules attached; Enum types; Generated columns; Exclusion constraints: no overlapping bookings; Deferrable constraints
- `03-zero-downtime-migrations` Zero-Downtime Migrations (25m, 30xp, ex 1, quiz 2): Every ALTER TABLE takes a lock; Fast changes and table rewrites; Constraints in two steps: NOT VALID, then VALIDATE; Expand and contract; Backfills in batches; PostgreSQL DDL is transactional

**Module `security`: Database Security** · yml project: — · mini-project exercise: NONE

- `01-roles-and-privileges` Roles and Privileges (22m, 30xp, ex 1, quiz 2): Roles: users and groups in one idea; GRANT and REVOKE; Default privileges: grants for tables that don't exist yet; A least-privilege layout
- `02-sql-injection` SQL Injection (22m, 30xp, ex 1, quiz 2): How it happens in application code; Seeing it happen; The fix: parameters; Dynamic identifiers: format() and allow-lists; Defence in depth
- `03-row-level-security` Row-Level Security (25m, 30xp, ex 1, quiz 2): Turning it on: deny by default; Who is the current user?; Writing policies: USING and WITH CHECK; The table owner, and FORCE; Setting the user safely with connection pools; Pitfalls that bypass your policies

**Module `scaling`: Scaling & Operations** · yml project: — · mini-project exercise: NONE

- `01-table-partitioning` Partitioning Big Tables (22m, 30xp, ex 1, quiz 2): What partitioning is; Range partitioning; Partition pruning; Indexes and keys on partitioned tables; List and hash partitioning; Retention: drop, don't delete; When partitioning is worth it
- `02-backups-and-replication` Backups, Replication & Connection Pooling (24m, 30xp, ex 1, quiz 2): RPO and RTO: decide what you need first; The WAL: how PostgreSQL remembers every change; Logical backups with pg_dump; Physical backups and point-in-time recovery; Replication: a live copy of the database; High availability and failover; Connection pooling
- `03-choosing-a-database` Choosing the Right Database (22m, 30xp, ex 1, quiz 2): Two kinds of workload: OLTP and OLAP; Why analytics loves column stores; Documents, key-value and wide-column stores; Search engines; Queues, streams and vectors; When PostgreSQL is enough

**Capstone `multi-tenant-saas`: Design a multi-tenant SaaS database**

- `01-saas-tenants-and-schema` Part 1: Tenants and the schema (25m, 35xp, ex 1, quiz 2): The brief; Three ways to host many tenants; Tenants, users and memberships; Making cross-tenant references impossible; Choosing ids
- `02-saas-tenant-isolation` Part 2: Isolating tenants (25m, 35xp, ex 1, quiz 2): Step 1: who is the current tenant?; Step 2: the app role and the policies; Step 3: protect every table, and keep it that way; Global tables and the edges of RLS
- `03-saas-launch-review` Part 3: Launch review (25m, 35xp, ex 1, quiz 2): Indexes for tenant data; Whales and noisy neighbours; Partitioning the activity log; A migration plan that won't take the site down; Exporting and deleting a tenant; The launch checklist

## TypeScript

### TypeScript L0 (4 modules + capstone, 15 lessons)

**Module `basics`: TypeScript Basics** · yml project: Typed greeting generator · mini-project exercise: Typed greeting generator (in `special-types`)

- `01-hello-typescript` Hello, TypeScript (10m, 15xp, ex 1, quiz 1): Your first program; Variables and your first type annotation; Catching mistakes before running; How PandaDev checks your code
- `02-basic-types` Basic Types (12m, 20xp, ex 1, quiz 1): The three everyday types; Type inference: TypeScript works it out; let vs const (and literal types); Arrays: a first look; A first look at functions; When should I annotate?
- `03-special-types` any, unknown, null & undefined (14m, 25xp, ex 1, quiz 1): any: switching the checker off; unknown: the safe "I don't know yet"; null and undefined: missing values; Handling missing values: ?. and ??

**Module `control-flow`: Control Flow** · yml project: — · mini-project exercise: NONE

- `01-conditions-and-narrowing` Conditions & Narrowing (14m, 20xp, ex 1, quiz 1): if, else if and else; Comparison and logical operators; Union types: this OR that; Narrowing with typeof; Truthiness narrowing for null
- `02-literal-types-and-switch` Literal Types & switch (13m, 20xp, ex 1, quiz 1): Literal types; Naming your types with type; switch: one value, many cases; Exhaustiveness checking with never
- `03-loops` Typed Loops (13m, 20xp, ex 1, quiz 1): The for loop; The while loop; for...of over typed arrays; break and continue; Building results

**Module `functions`: Typed Functions** · yml project: Typed calculator · mini-project exercise: Typed calculator (in `arrow-functions-and-callbacks`)

- `01-typed-functions` Typed Functions (12m, 20xp, ex 1, quiz 1): Typing parameters; Why you must annotate parameters; Return types; Inferred return types; void: functions that return nothing
- `02-optional-default-and-rest` Optional, Default and Rest Parameters (12m, 20xp, ex 1, quiz 1): Optional parameters with ?; Default values; Rest parameters: any number of arguments; Union parameters: more than one type
- `03-arrow-functions-and-callbacks` Arrow Functions and Callbacks (15m, 25xp, ex 1, quiz 1): Typed arrow functions; Function types; Naming function types with type; Contextual typing; Callbacks

**Module `arrays-and-objects`: Arrays, Objects & Interfaces** · yml project: Contact book · mini-project exercise: Contact book (in `typed-data`)

- `01-arrays-and-tuples` Arrays and Tuples (12m, 20xp, ex 1, quiz 1): T[] and Array<T>; Readonly arrays; Tuples: fixed-length arrays; Array methods know your types
- `02-object-types-and-interfaces` Object Types and Interfaces (14m, 20xp, ex 1, quiz 1): Object type annotations; Naming shapes with type; Interfaces; Optional and readonly properties; Excess property checks; Extending interfaces
- `03-typed-data` Working with Typed Data (15m, 25xp, ex 1, quiz 1): Arrays of objects; Filtering and mapping records; Sorting records; Lookups with Record<string, T>; Updating records with Partial<T>

**Capstone `quiz-game`: Typed quiz game**

- `01-modelling-questions` Part 1: Modelling the questions (20m, 30xp, ex 1, quiz 1): Difficulty: a union of literals; The Question interface; Let the types catch your mistakes; A typed question bank; Printing a question; Types check the shape, not the sense
- `02-grading-answers` Part 2: Grading answers (20m, 30xp, ex 1, quiz 1): What a graded answer looks like; Points by difficulty; Bonus points win; Grading an answer safely; Adding up the score
- `03-playing-the-quiz` Part 3: Playing the quiz (25m, 30xp, ex 1, quiz 1): Simulating the player; Feedback for the player; The results report; Playing the whole quiz; Choosing which questions to play

### TypeScript L1 (4 modules + capstone, 15 lessons)

**Module `unions-and-narrowing`: Unions & Narrowing** · yml project: Payment status handler · mini-project exercise: Payment status handler (in `type-guards-and-unknown`)

- `01-union-types` Union Types (16m, 20xp, ex 1, quiz 2): Unions of any types; What you can do with a union; The narrowing toolbox; TypeScript follows your code; Unions in arrays; Missing values: null and undefined in unions
- `02-discriminated-unions` Discriminated Unions (17m, 20xp, ex 1, quiz 2): The problem: flags and optional properties; Tagged unions; Narrowing with switch; Make impossible states impossible; Exhaustiveness with assertNever; Adding a new variant
- `03-type-guards-and-unknown` Type Guards & unknown (18m, 25xp, ex 1, quiz 2): When a boolean isn't enough; Type predicates: value is Type; unknown vs any, again; Validating unknown data step by step; Assertion functions: asserts value is Type; The non-null assertion !; as casts and their dangers

**Module `classes`: Classes & Access Modifiers** · yml project: Parking garage · mini-project exercise: Parking garage (in `structural-typing-and-class-design`)

- `01-classes-and-access-modifiers` Classes & Access Modifiers (16m, 20xp, ex 1, quiz 2): A class with typed fields; Every field must get a value; Parameter properties: a shortcut; public, private and protected; readonly fields; TypeScript's private vs JavaScript's #private; Methods and this; Getters and setters; Static members
- `02-inheritance-interfaces-and-abstract-classes` Inheritance, Interfaces & Abstract Classes (17m, 20xp, ex 1, quiz 2): extends and super; Overriding methods with override; protected in practice; implements: keeping a promise; Polymorphism through an interface; Abstract classes; Abstract class or interface?
- `03-structural-typing-and-class-design` Structural Typing & Class Design (18m, 25xp, ex 1, quiz 2): Structural typing: shapes, not names; Private members change the rules; A class is a type and a value; Narrowing with instanceof; Composition over inheritance; When a class is overkill

**Module `generics`: Generics** · yml project: Generic data store · mini-project exercise: Generic data store (in `utility-types`)

- `01-generic-functions` Generic Functions (16m, 20xp, ex 1, quiz 2): The problem: one job, many types; Type parameters; Inference vs explicit type arguments; Several type parameters; Constraints with extends; keyof and T[K]; Generic callbacks; Default type parameters; When NOT to use a generic
- `02-generic-types-and-classes` Generic Types and Classes (16m, 20xp, ex 1, quiz 1): Generic type aliases and interfaces; Result<T, E>: a generic discriminated union; Generic classes; Constraints in classes; Read-only arrays: ReadonlyArray<T>
- `03-utility-types` Utility Types (18m, 25xp, ex 1, quiz 2): Utility types are generic types; Partial, Required and Readonly; Pick and Omit: shaping objects; Record: complete lookup tables; Exclude, Extract and NonNullable; ReturnType, Parameters and Awaited; Combining utility types

**Module `dom-and-tooling`: DOM, Modules & Tooling** · yml project: — · mini-project exercise: NONE

- `01-typing-the-dom` Typing the DOM (18m, 20xp, ex 1, quiz 2) **[no CodeExample, 5 TryIt]**: Elements have types; Dealing with null; Getting the right element type; Creating elements; Typed events; event.target and delegation; Saving data with localStorage
- `02-modules-and-declaration-files` Modules & Declaration Files (17m, 20xp, ex 1, quiz 2): Modules in TypeScript; Type-only imports; Where types come from; Declaration files; Global declarations
- `03-tsconfig-and-the-compiler` tsconfig & the Compiler (18m, 25xp, ex 1, quiz 2): tsc: check and compile; tsconfig.json; Extra safety flags; Running TypeScript for real; Your editor runs TypeScript too

**Capstone `habit-tracker`: Typed habit tracker in the browser**

- `01-modelling-habits` Part 1: Modelling habits (25m, 30xp, ex 1, quiz 1): Dates as plain strings; Today is a parameter; Three kinds of schedule; Habits and check-ins; Is it due today?; Counting streaks; Testing with Vitest
- `02-the-habit-store` Part 2: The habit store (25m, 30xp, ex 1, quiz 1): The store, rebuilt; Errors that speak the tracker's language; The HabitTracker class; A day's numbers with Pick; Saving through an interface; Loading without trusting; Saving on every change
- `03-the-browser-app` Part 3: The browser app (25m, 30xp, ex 1, quiz 1) **[no CodeExample, 2 TryIt]**: One file here, modules in real life; The edge of the app; Reading the form into a Schedule; Drawing the day; One listener for the whole list; Changes flow one way

### TypeScript L2 (4 modules + capstone, 15 lessons)

**Module `async-and-apis`: Async & Typed APIs** · yml project: Typed API client · mini-project exercise: Typed API client (in `runtime-validation`)

- `01-typing-promises-and-async` Typing Promises & Async Code (18m, 25xp, ex 1, quiz 2): Promise<T>: a value that arrives later; Async functions return promises; Awaited<T>: what's inside the box; Promise.all with typed results; Promise.allSettled: narrowing each result; Callbacks vs promises; Errors in catch are unknown; Cancelling with AbortController; A typed timeout helper
- `02-typed-fetch` Typed Fetch (18m, 25xp, ex 1, quiz 2): What fetch gives you; Why as Movie is a lie; A generic getJson<T> and its honesty problem; HTTP errors: res.ok and a typed error class; Errors as values: a Result type; Query parameters from typed options
- `03-runtime-validation` Runtime Validation (20m, 30xp, ex 1, quiz 2): Types vanish at runtime; Hand-written guards drift; A schema: one definition, two jobs; Objects and arrays; Validating API responses; Testing with a fake fetch; What real projects use: zod and valibot

**Module `testing`: Testing Typed Code** · yml project: — · mini-project exercise: NONE

- `01-testing-typed-code` Testing Typed Code (18m, 25xp, ex 1, quiz 2): Vitest runs TypeScript as it is; Test data factories; Typed mocks with vi.fn; Typed tables with it.each; Testing errors and Result types
- `02-dependency-injection-and-fakes` Dependency Injection and Fakes (20m, 25xp, ex 1, quiz 2): Hidden dependencies; Depend on interfaces, then inject them; Fakes, mocks, and keeping them in sync; Faking time; Test fixtures with satisfies; Faking fetch, with types
- `03-testing-types` Testing Types (20m, 30xp, ex 1, quiz 2): Why types need tests; Code that must not compile: @ts-expect-error; Exact types: Equal and Expect; Type tests guard design decisions; Type testing tools in real projects; Run the type checker in CI

**Module `react`: React with TypeScript** · yml project: Typed kanban board · mini-project exercise: Typed kanban board (in `reducers-context-and-hooks`)

- `01-typed-components-and-props` Typed Components and Props (18m, 25xp, ex 1, quiz 2) **[no CodeExample, 9 TryIt]**: A component in TypeScript; Typing props; Optional props and default values; Children: ReactNode; Variants as union props; Props that belong together; Callback props; Extending native element props; Generic components; Why not React.FC?
- `02-state-events-and-forms` State, Events and Forms (20m, 25xp, ex 1, quiz 2) **[no CodeExample, 6 TryIt]**: useState and inference; When inference isn't enough; Updating objects and arrays; Event types; Select values are just strings; Controlled forms with a typed form state; Refs: reaching the DOM element; Lifting state up with typed callbacks
- `03-reducers-context-and-hooks` Reducers, Context and Custom Hooks (20m, 30xp, ex 1, quiz 2): useReducer: every update in one place; Reducers are easy to test; Typed context; Generic custom hooks; In real projects

**Module `node`: Node.js & Express with TypeScript** · yml project: Typed notes API · mini-project exercise: Typed notes API (in `sharing-types-between-client-and-server`)

- `01-typed-express-apis` Typed Express APIs (18m, 25xp, ex 1, quiz 2): Express, now with types; Route params come from the path; Typing responses; req.body is any; Query strings aren't just strings; Routers, async handlers and a repository; Adding req.user with declare global; Testing typed routes
- `02-validation-and-errors` Validation & Error Handling (20m, 25xp, ex 1, quiz 2): Types vanish at runtime; Parse, don't just validate; Schemas: one source of truth; Typed errors with an HttpError class; One error handler for the whole app; Throwing or returning a Result?
- `03-sharing-types-between-client-and-server` Sharing Types Between Client and Server (20m, 30xp, ex 1, quiz 2): One contract for both sides; A client derived from the contract; Keeping the server in sync; How real projects share a contract

**Capstone `fullstack-todos`: Full-stack typed to-do app**

- `01-shared-types-and-the-api` Part 1: Shared types and the API (25m, 30xp, ex 1, quiz 1): Step 1: the design note; Step 2: shared schemas; Step 3: the contract; Step 4: parsing what clients send; Step 5: the server; Step 6: tests that hold the server to the contract
- `02-the-typed-client` Part 2: The typed client (25m, 30xp, ex 1, quiz 1): Step 1: trust, but verify; Step 2: one generic call; Step 3: a client for the app; Step 4: tests with a typed fake fetch; Step 5: contract tests against the practice API
- `03-the-react-client` Part 3: The React client (25m, 30xp, ex 1, quiz 1): Step 1: the state and its actions; Step 2: loading in a custom hook; Step 3: optimistic updates with rollback; Step 4: the real client; Shipping it

### TypeScript L3 (5 modules + capstone, 17 lessons)

**Module `advanced-types`: Advanced Types** · yml project: — · mini-project exercise: NONE

- `01-conditional-types-and-infer` Conditional Types & infer (22m, 25xp, ex 1, quiz 2): Types that make decisions; Testing types with Equal and Expect; Distribution: conditional types over unions; Pulling types apart with infer; Recursive conditional types; When conditional types get unreadable
- `02-mapped-types` Mapped Types (22m, 25xp, ex 1, quiz 2): Looping over keys; Modifiers: readonly and ?; Homomorphic mapped types keep modifiers; Key remapping with as; Mapped types over unions; When to derive, and when to write it out
- `03-template-literal-types` Template Literal Types (24m, 30xp, ex 1, quiz 2): Strings with holes; Changing case; Parsing strings with infer; Dotted paths; Typed event emitters; Limits, and when not to

**Module `type-level-programming`: Type-Level Programming** · yml project: — · mini-project exercise: NONE

- `01-building-utility-types` Building Your Own Utility Types (24m, 25xp, ex 1, quiz 2): The workbench: types with tests; Going deep: DeepReadonly; DeepPartial and deep merging; Filtering by value: PickByValue and OmitByValue; RequireAtLeastOne; UnionToIntersection; Simplify: readable results; Recursion limits and compile-time cost
- `02-variance-and-inference` Variance & Inference (24m, 25xp, ex 1, quiz 2): Assignability is about shape; Variance: when containers follow the rules; Arrays are covariant, and that's unsound; Function parameters are contravariant; Methods are bivariant, on purpose; Variance annotations: in and out; How TypeScript infers type arguments; satisfies vs annotation vs as const
- `03-branded-types-and-type-safe-apis` Branded Types & Type-Safe APIs (25m, 30xp, ex 1, quiz 2): When structural typing is too forgiving; Branded types; Smart constructors: the only way in; Units: cents are not pounds; Phantom types; Type-safe builders; Overloads vs generics vs unions; Make illegal states unrepresentable at the boundary

**Module `architecture`: Architecture at Scale** · yml project: — · mini-project exercise: NONE

- `01-designing-types-for-large-codebases` Designing Types for Large Codebases (24m, 25xp, ex 1, quiz 2): One concept, three types; unknown at the edges, validated types inside; An error strategy, not just error handling; Stopping any from spreading; Module boundaries and public APIs
- `02-monorepos-and-project-references` Monorepos & Project References (23m, 25xp, ex 1, quiz 2): Monorepo or many repos?; Workspaces link the packages; What goes in a shared package; Built packages and internal packages; Project references and tsc -b; Path aliases vs packages; Task runners: Turborepo and Nx
- `03-api-design-and-migrations` API Design & Migrations (25m, 30xp, ex 1, quiz 2): Design for the call site; Options objects, overloads and unions; Semver for types; Deprecating without breaking; Migrating JavaScript to TypeScript; Measuring progress

**Module `build-performance`: Compiler & Build Performance** · yml project: — · mini-project exercise: NONE

- `01-how-the-compiler-works` How the Compiler Works (22m, 25xp, ex 1, quiz 2): Five stages from text to JavaScript; What the emitter has to write; Transpile-only tools; Flags that keep files independent; Declaration files need the checker too; TypeScript 7: the same compiler, in Go
- `02-faster-type-checking` Faster Type Checking (24m, 25xp, ex 1, quiz 2): Measure first; Check less: incremental builds; The patterns that cost the most; Keeping the editor fast
- `03-building-and-publishing-packages` Building & Publishing Packages (25m, 30xp, ex 1, quiz 1): What a package really contains; The public API is a promise; Building: tsc or a bundler; package.json: telling tools where everything is; ESM, CommonJS and dual packages; Dependencies: who installs what; Versions are promises too; Check before you publish; Publishing to npm

**Module `leadership`: Code Review & Leadership** · yml project: — · mini-project exercise: NONE

- `01-reviewing-typescript-code` Reviewing TypeScript Code (25m, 30xp, ex 1, quiz 2): What to look for in a TypeScript diff; Escape hatches hide in plain sight; Types that are wider than the domain; Switches that won't notice a new case; Over-clever types; Writing review comments about types; Let typescript-eslint do the boring part
- `02-leading-typescript-adoption` Leading TypeScript Adoption (25m, 30xp, ex 1, quiz 2): A baseline everyone shares; Conventions: short, with reasons, enforced by tools; Rolling out strict mode in a big codebase; Measuring type safety honestly; Mentoring juniors on types; Design docs for type-heavy changes; When to stop adding types

**Capstone `typed-sdk`: Type-safe SDK for a public API**

- `01-designing-the-sdk` Part 1: Designing the SDK (25m, 30xp, ex 1, quiz 2): Start with a design doc; Schemas, one more time; Branded ids, parsed at the edge; One description for the whole API; Deriving the types; Type tests are the spec; From input to request
- `02-the-client` Part 2: The client (25m, 30xp, ex 1, quiz 2): Types outside, one cast inside; Every failure has a kind; Retries that don't make things worse; Pagination as an async iterator; Hooks for auth, logs and metrics; Testing the client
- `03-shipping-it` Part 3: Shipping it (25m, 30xp, ex 1, quiz 1): The public surface; Overloads where the return type depends on the input; Documentation that travels: JSDoc; Type tests for the whole surface; What users' TypeScript sees; The package; Versions, changelog and CI; Publishing to npm; The README

# Practice problems

All 160 EN problems link to an existing lesson (0 broken links) and have a RU twin. "Where" = course, level and module of the linked lesson.

### JavaScript practice (40 problems)

| # | Slug | Title | Diff | Topic | Linked lesson (where) |
|---|---|---|---|---|---|
| 01 | count-vowels | Count the vowels | easy | strings | working-with-strings (javascript L0 basics) |
| 02 | munch-nap-roll | Munch, Nap, Roll | easy | numbers | for-loops (javascript L0 loops) |
| 03 | digit-chain | The digit chain | easy | numbers | while-loops (javascript L0 loops) |
| 04 | title-case | Book title case | easy | strings | working-with-strings (javascript L0 basics) |
| 05 | make-a-range | Make a range | easy | arrays | for-loops (javascript L0 loops) |
| 06 | clean-tags | Tidy up the tags | easy | arrays | map-set-and-generators (javascript L2 modern-javascript) |
| 07 | best-bamboo-stretch | The best bamboo stretch | easy | arrays | arrays (javascript L1 arrays-and-objects) |
| 08 | letter-tally | Letter tally | easy | objects | objects (javascript L1 arrays-and-objects) |
| 09 | mirror-words | Mirror words | easy | strings | working-with-strings (javascript L0 basics) |
| 10 | ticket-numbers | Ticket number machine | easy | functions | closures-and-higher-order-functions (javascript L2 modern-javascript) |
| 11 | repeat-a-function | Do it n times | easy | functions | closures-and-higher-order-functions (javascript L2 modern-javascript) |
| 12 | dig-into-an-object | Dig into an object | easy | objects | spread-rest-and-optional-chaining (javascript L2 modern-javascript) |
| 13 | zip-the-columns | Zip the columns | medium | arrays | arrays (javascript L1 arrays-and-objects) |
| 14 | stock-changes | What changed in the stock? | medium | objects | objects (javascript L1 arrays-and-objects) |
| 15 | flatten-to-a-depth | Flatten to a depth | medium | arrays | spread-rest-and-optional-chaining (javascript L2 modern-javascript) |
| 16 | pipe-and-compose | Pipe and compose | medium | functions | closures-and-higher-order-functions (javascript L2 modern-javascript) |
| 17 | memoize-any-arguments | Remember every answer | medium | functions | closures-and-higher-order-functions (javascript L2 modern-javascript) |
| 18 | wrap-text | Wrap the text | medium | strings | working-with-strings (javascript L0 basics) |
| 19 | merge-settings | Merge the settings | medium | objects | spread-rest-and-optional-chaining (javascript L2 modern-javascript) |
| 20 | share-out-fairly | Share it out fairly | medium | numbers | arithmetic (javascript L0 operators-and-conditions) |
| 21 | panda-thermostat | The panda-house thermostat | medium | classes | classes (javascript L1 classes) |
| 22 | format-duration | How long did the panda nap? | medium | strings | working-with-strings (javascript L0 basics) |
| 23 | rotate-sprite | Spin the pixel panda | medium | arrays | arrays (javascript L1 arrays-and-objects) |
| 24 | parse-query-string | Read the search bar | medium | text | working-with-strings (javascript L0 basics) |
| 25 | merge-bookings | Squash the visiting slots | medium | algorithms | array-methods (javascript L1 arrays-and-objects) |
| 26 | first-tall-enough | The first tall-enough bamboo | medium | algorithms | measuring-performance (javascript L3 performance) |
| 27 | event-emitter | The bamboo-feed newsroom | medium | classes | closures-and-higher-order-functions (javascript L2 modern-javascript) |
| 28 | deep-equal | Are these two pandas the same? | medium | recursion | objects (javascript L1 arrays-and-objects) |
| 29 | flatten-to-dotted-keys | Flatten the settings file | medium | objects | objects (javascript L1 arrays-and-objects) |
| 30 | retry-with-backoff | Try, try again (with a nap in between) | medium | async | async-await (javascript L2 async) |
| 31 | panda-parade | Who can see whom at the panda parade? | hard | arrays | arrays (javascript L1 arrays-and-objects) |
| 32 | expiring-cache | The bamboo cache that goes stale | hard | objects | map-set-and-generators (javascript L2 modern-javascript) |
| 33 | deep-clone | Clone the whole panda family tree | hard | recursion | spread-rest-and-optional-chaining (javascript L2 modern-javascript) |
| 34 | build-order | Which job comes first? | hard | algorithms | map-set-and-generators (javascript L2 modern-javascript) |
| 35 | promise-pool | Only three trucks at a time | hard | async | promises (javascript L2 async) |
| 36 | debounce-async | Wait until the typing stops | hard | async | closures-and-higher-order-functions (javascript L2 modern-javascript) |
| 37 | spelling-suggestions | Did you mean "bamboo"? | hard | algorithms | measuring-performance (javascript L3 performance) |
| 38 | tokenizer | Chop code into tokens | hard | text | working-with-strings (javascript L0 basics) |
| 39 | grid-route | The panda's way out of the maze | hard | algorithms | arrays (javascript L1 arrays-and-objects) |
| 40 | mini-templates | A tiny template engine | hard | text | objects (javascript L1 arrays-and-objects) |

### Python practice (40 problems)

| # | Slug | Title | Diff | Topic | Linked lesson (where) |
|---|---|---|---|---|---|
| 01 | count-vowels | Count the vowels | easy | strings | working-with-strings (python L0 basics) |
| 02 | bamboo-buzz | Bamboo, Panda, BambooPanda | easy | numbers | for-loops (python L0 loops) |
| 03 | digit-sum | Add up the digits | easy | numbers | arithmetic (python L0 conditions) |
| 04 | running-totals | Running totals | easy | lists | looping-over-lists (python L0 loops) |
| 05 | convert-temperature | Celsius or Fahrenheit? | easy | functions | defaults-and-scope (python L0 functions) |
| 06 | palindrome-phrase | Palindrome phrases | easy | strings | working-with-strings (python L0 basics) |
| 07 | find-duplicates | Spot the duplicates | easy | lists | dictionaries (python L1 collections) |
| 08 | is-prime | Is it prime? | easy | numbers | while-loops (python L0 loops) |
| 09 | word-counts | Word frequencies | easy | dictionaries | dictionaries (python L1 collections) |
| 10 | price-tag | Price tags | easy | functions | defaults-and-scope (python L0 functions) |
| 11 | second-largest | The runner-up | easy | lists | lists-in-depth (python L1 collections) |
| 12 | group-by-letter | Group by first letter | easy | dictionaries | dictionaries (python L1 collections) |
| 13 | password-check | Password checker | medium | strings | working-with-strings (python L0 basics) |
| 14 | caesar-cipher | Caesar cipher | medium | strings | working-with-strings (python L0 basics) |
| 15 | compress-letters | Squash repeated letters | medium | strings | while-loops (python L0 loops) |
| 16 | rotate-list | Rotate a list | medium | lists | lists-in-depth (python L1 collections) |
| 17 | merge-counts | Merge stock counts | medium | dictionaries | dictionaries (python L1 collections) |
| 18 | top-n | Top of the leaderboard | medium | functions | defaults-and-scope (python L0 functions) |
| 19 | anagram-groups | Anagram groups | medium | dictionaries | dictionaries (python L1 collections) |
| 20 | pipeline | Build a pipeline | medium | functions | defaults-and-scope (python L0 functions) |
| 21 | bamboo-bank-account | The bamboo bank account | medium | classes | classes-and-objects (python L1 classes) |
| 22 | flatten-nested-lists | Unpack the nesting dolls | medium | recursion | recursion (python L1 algorithms) |
| 23 | roman-numerals | Roman numerals, there and back | medium | algorithms | dictionaries (python L1 collections) |
| 24 | snack-pair | Two snacks, exact budget | medium | dictionaries | stacks-queues-and-hash-maps (python L1 algorithms) |
| 25 | first-bad-bracket | Find the broken bracket | medium | algorithms | stacks-queues-and-hash-maps (python L1 algorithms) |
| 26 | parse-log-lines | Read the server's diary | medium | text | regular-expressions (python L1 text-and-automation) |
| 27 | count-workdays | How many working days? | medium | text | dates-and-times (python L1 text-and-automation) |
| 28 | top-k-words | The k most popular words | medium | dictionaries | searching-and-sorting (python L1 algorithms) |
| 29 | spiral-matrix | Walk the bamboo spiral | medium | lists | lists-in-depth (python L1 collections) |
| 30 | sudoku-conflicts | Sudoku referee | medium | algorithms | tuples-and-sets (python L1 collections) |
| 31 | cut-bamboo | Cut the bamboo fairly | hard | algorithms | searching-and-sorting (python L1 algorithms) |
| 32 | unflatten-dotted-keys | Dotted settings, folded and unfolded | hard | dictionaries | dictionaries (python L1 collections) |
| 33 | undo-redo-editor | Undo, redo, repeat | hard | classes | stacks-queues-and-hash-maps (python L1 algorithms) |
| 34 | free-time-slots | When is the panda free? | hard | lists | searching-and-sorting (python L1 algorithms) |
| 35 | decode-nested-repeats | Unzip the panda message | hard | recursion | recursion (python L1 algorithms) |
| 36 | lru-cache | The forgetful bamboo cache | hard | classes | caching-and-optimisation (python L3 performance) |
| 37 | unique-arrangements | Shuffle the letter tiles | hard | recursion | recursion (python L1 algorithms) |
| 38 | meeting-dates | Every last Friday | hard | text | dates-and-times (python L1 text-and-automation) |
| 39 | break-one-wall | Smash one wall | hard | algorithms | stacks-queues-and-hash-maps (python L1 algorithms) |
| 40 | power-calculator | Build a pocket calculator | hard | algorithms | recursion (python L1 algorithms) |

### SQL practice (40 problems)

| # | Slug | Title | Diff | Topic | Linked lesson (where) |
|---|---|---|---|---|---|
| 01 | bargains-in-stock | Bargains in stock | easy | filtering | filtering-with-where (sql L0 first-queries) |
| 02 | long-films-for-a-rainy-sunday | Long films for a rainy Sunday | easy | filtering | filtering-with-where (sql L0 first-queries) |
| 03 | customers-without-a-city | Customers without a city | easy | filtering | null-values (sql L0 sorting-and-limiting) |
| 04 | film-chart-page-two | Film chart, page two | easy | filtering | limit-and-offset (sql L0 sorting-and-limiting) |
| 05 | conference-name-badges | Conference name badges | easy | text | text-functions (sql L0 functions) |
| 06 | charm-price-tags | Charm price tags | easy | numbers | number-functions (sql L0 functions) |
| 07 | spring-work-anniversaries | Spring work anniversaries | easy | text | date-functions (sql L0 functions) |
| 08 | panda-gift-box | Panda gift box | medium | filtering | filtering-with-where (sql L0 first-queries) |
| 09 | salary-bands | Salary bands | medium | filtering | case-and-pivots (sql L2 advanced-queries) |
| 10 | payroll-shares | Payroll shares | medium | numbers | number-functions (sql L0 functions) |
| 11 | parcels-on-the-way | Parcels on the way | easy | joins | inner-join (sql L1 joins) |
| 12 | films-per-genre | Films per genre | easy | grouping | group-by (sql L0 aggregation) |
| 13 | shop-at-a-glance | The shop at a glance | easy | grouping | aggregate-functions (sql L0 aggregation) |
| 14 | still-waiting-for-a-first-order | Still waiting for a first order | medium | joins | outer-joins (sql L1 joins) |
| 15 | how-far-from-the-boss | How far from the boss? | medium | joins | self-joins (sql L1 joins) |
| 16 | the-regulars | The regulars | medium | grouping | having (sql L0 aggregation) |
| 17 | revenue-by-category | Revenue by category | medium | grouping | group-by (sql L0 aggregation) |
| 18 | who-got-which-book | Who got which book? | medium | joins | inner-join (sql L1 joins) |
| 19 | monthly-order-board | The monthly order board | hard | grouping | case-and-pivots (sql L2 advanced-queries) |
| 20 | the-complete-kitchen-set | The complete kitchen set | hard | joins | having (sql L0 aggregation) |
| 21 | overstocked-shelves | Overstocked shelves | easy | subqueries | queries-inside-queries (sql L1 subqueries) |
| 22 | tea-drinkers | Tea drinkers | medium | subqueries | queries-inside-queries (sql L1 subqueries) |
| 23 | big-spenders | Big spenders, step by step | medium | subqueries | common-table-expressions (sql L1 subqueries) |
| 24 | where-to-open-next | Where to open the next office | medium | subqueries | union-intersect-except (sql L1 subqueries) |
| 25 | pay-ladder | The pay ladder | medium | windows | window-functions-and-ranking (sql L2 window-functions) |
| 26 | road-to-a-thousand | The road to 1,000 | medium | windows | running-totals-and-frames (sql L2 window-functions) |
| 27 | panda-weigh-ins | Panda weigh-ins | medium | windows | lag-lead-and-distribution (sql L2 window-functions) |
| 28 | best-of-the-decade | Best of the decade | hard | windows | window-functions-and-ranking (sql L2 window-functions) |
| 29 | study-streaks | Longest study streaks | hard | windows | window-functions-and-ranking (sql L2 window-functions) |
| 30 | revenue-league-table | The customer league table | hard | subqueries | common-table-expressions (sql L1 subqueries) |
| 31 | fresh-releases | Fresh releases for film night | easy | changes | insert-rows (sql L1 changing-data) |
| 32 | london-pay-rise | A pay rise for London | medium | changes | update-and-delete (sql L1 changing-data) |
| 33 | sold-out-lines | Take sold-out products out of open orders | medium | changes | update-and-delete (sql L1 changing-data) |
| 34 | stock-delivery | The stock delivery | medium | changes | upserts-and-transactions (sql L1 changing-data) |
| 35 | product-reviews | A table for product reviews | medium | schema | constraints-and-keys (sql L1 designing-tables) |
| 36 | delivery-addresses | Delivery addresses with house rules | hard | schema | modeling-patterns (sql L3 data-modeling) |
| 37 | branch-of-the-tree | Which branch of the tree? | hard | recursion | recursive-ctes (sql L2 advanced-queries) |
| 38 | tea-dry-spells | Dry spells at the tea counter | hard | recursion | recursive-ctes (sql L2 advanced-queries) |
| 39 | basket-checkout | Checkout without overselling | hard | changes | upserts-and-transactions (sql L1 changing-data) |
| 40 | new-or-returning | New money or returning money? | hard | grouping | dashboard-retention-and-funnels (sql L2 analytics-dashboard) |

### TypeScript practice (40 problems)

| # | Slug | Title | Diff | Topic | Linked lesson (where) |
|---|---|---|---|---|---|
| 01 | order-total | Order total | easy | types | object-types-and-interfaces (typescript L0 arrays-and-objects) |
| 02 | first-and-last | First and last | easy | types | generic-functions (typescript L1 generics) |
| 03 | letter-count | Letter count | easy | strings | union-types (typescript L1 unions-and-narrowing) |
| 04 | vote-tally | Vote tally | easy | objects | typed-data (typescript L0 arrays-and-objects) |
| 05 | sorted-copy | Sorted copy | easy | arrays | arrays-and-tuples (typescript L0 arrays-and-objects) |
| 06 | traffic-lights | Traffic lights | easy | types | literal-types-and-switch (typescript L0 control-flow) |
| 07 | lowest-and-highest | Lowest and highest | easy | arrays | arrays-and-tuples (typescript L0 arrays-and-objects) |
| 08 | delivery-city | Delivery city | easy | objects | special-types (typescript L0 basics) |
| 09 | price-tags | Price tags | easy | strings | utility-types (typescript L1 generics) |
| 10 | pluck | Pluck a property | easy | functions | generic-functions (typescript L1 generics) |
| 11 | profile-update | Profile update | easy | objects | typed-data (typescript L0 arrays-and-objects) |
| 12 | is-it-a-user | Is it a user? | easy | types | type-guards-and-unknown (typescript L1 unions-and-narrowing) |
| 13 | group-by | Typed groupBy | medium | functions | generic-functions (typescript L1 generics) |
| 14 | shape-areas | Shape areas | medium | types | discriminated-unions (typescript L1 unions-and-narrowing) |
| 15 | result-type | Results, not exceptions | medium | types | generic-types-and-classes (typescript L1 generics) |
| 16 | typed-omit | A typed omit | medium | objects | utility-types (typescript L1 generics) |
| 17 | parse-duration | Parse a duration | medium | strings | union-types (typescript L1 unions-and-narrowing) |
| 18 | zip-and-unzip | Zip and unzip | medium | arrays | arrays-and-tuples (typescript L0 arrays-and-objects) |
| 19 | map-values | Map an object's values | medium | functions | generic-functions (typescript L1 generics) |
| 20 | multi-sort | Sort by several keys | medium | arrays | typed-data (typescript L0 arrays-and-objects) |
| 21 | plate-stack | A stack of any plates | medium | classes | generic-types-and-classes (typescript L1 generics) |
| 22 | order-lifecycle | An order that can't be wrong | medium | types | discriminated-unions (typescript L1 unions-and-narrowing) |
| 23 | typed-emitter | An event emitter that knows its events | medium | classes | generic-types-and-classes (typescript L1 generics) |
| 24 | retry-with-backoff | Try, wait, try again | medium | async | typing-promises-and-async (typescript L2 async-and-apis) |
| 25 | typed-memoize | Remember every answer | medium | functions | generic-functions (typescript L1 generics) |
| 26 | guard-the-events | Guard the event log | medium | types | type-guards-and-unknown (typescript L1 unions-and-narrowing) |
| 27 | branded-ids | Don't mix up the IDs | medium | types | branded-types-and-type-safe-apis (typescript L3 type-level-programming) |
| 28 | ttl-cache | A cache that forgets on time | medium | classes | classes-and-access-modifiers (typescript L1 classes) |
| 29 | load-everything | Load everything at once | medium | async | typing-promises-and-async (typescript L2 async-and-apis) |
| 30 | sort-by-keys | Sort by this, then by that | medium | algorithms | generic-functions (typescript L1 generics) |
| 31 | update-at-a-path | Change one leaf, keep the tree | hard | types | template-literal-types (typescript L3 advanced-types) |
| 32 | schema-with-all-errors | A schema that reports every mistake | hard | types | runtime-validation (typescript L2 async-and-apis) |
| 33 | request-builder | A builder that won't build too early | hard | types | branded-types-and-type-safe-apis (typescript L3 type-level-programming) |
| 34 | typed-router | A router that reads its own patterns | hard | types | template-literal-types (typescript L3 advanced-types) |
| 35 | build-order | What to build first | hard | algorithms | variance-and-inference (typescript L3 type-level-programming) |
| 36 | batching-loader | One trip for many requests | hard | async | typing-promises-and-async (typescript L2 async-and-apis) |
| 37 | deep-patches | Patches all the way down | hard | types | building-utility-types (typescript L3 type-level-programming) |
| 38 | cheapest-route | The cheapest way through the forest | hard | algorithms | variance-and-inference (typescript L3 type-level-programming) |
| 39 | typed-cli-args | Command-line flags with types | hard | text | mapped-types (typescript L3 advanced-types) |
| 40 | typed-query | A query builder that knows your rows | hard | classes | branded-types-and-type-safe-apis (typescript L3 type-level-programming) |
