# PandaDev 🐼

Learn programming languages **from Zero to Senior**, with interactive lessons, exercises and projects.

See [ROADMAP.md](ROADMAP.md) for the full plan, stack and development phases.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Better Auth · Drizzle · Neon Postgres

## Getting started

Requires Node.js 24 (see `.nvmrc`).

```bash
nvm use
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Accounts & database

Sign-in uses [Better Auth](https://better-auth.com) with GitHub and Google, and data lives in
[Neon](https://neon.tech) Postgres via Drizzle ORM. Until `DATABASE_URL` and
`BETTER_AUTH_SECRET` are set, the site works normally and the sign-in page says
sign-in isn't switched on yet.

1. Copy `.env.example` to `.env.local` and fill it in (see the comments in the file).
2. Create the tables: `npm run db:migrate`
3. For production, add the same variables in Vercel → Project → Settings →
   Environment Variables, with `BETTER_AUTH_URL` set to the live domain and
   production OAuth callback URLs (`https://<domain>/api/auth/callback/github` and `/google`).

XP rules live in `src/lib/gamification.ts` (lesson XP comes from each lesson's frontmatter;
exercises +10, quizzes answered right first time +5). The server validates every award
against the content and the database's unique index means each activity pays out once.

Schema changes: edit `src/db/schema.ts`, then `npm run db:generate` and `npm run db:migrate`.

## Writing content

Courses live in `content/courses/<language>/`:

```
content/courses/javascript/
  course.yml                 # intro + 4 levels → modules (slug, title, description, project)
  basics/                    # one folder per module slug
    01-hello-world.mdx       # lessons, ordered by the number prefix
    02-variables.mdx
```

Each lesson needs frontmatter:

```yaml
---
title: Hello, World!
description: Write and run your very first line of JavaScript.
duration: 5 # minutes
xp: 10
---
```

Lessons can use these components without importing them:

| Component                                                                                            | Use                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `<Callout type="note\|tip\|warning\|danger" title="…">`                                              | Highlighted box                                        |
| `<CodeExample output="…">` + a code block                                                            | Code with the output it prints                         |
| `<Quiz question="…" options={[…]} answer={1} explanation="…" />`                                     | Multiple-choice question (`answer` is 0-based)         |
| `<Exercise title="…" starter={`…`} tests={[…]} expectedOutput={`…`}>` with `<Hint>` and `<Solution>` | Practice task with an in-browser editor, Run and Check |
| `<TryIt html={`…`} code={`…`} />`                                                                    | Live HTML + JavaScript demo the learner can edit       |
| `<TryIt language="python" code={`…`} />`                                                             | Editable code to run, e.g. Python that draws a chart   |
| `<TryIt language="react" code={`…`} />`                                                              | Live React component (renders into `<div id="root">`)  |
| `<TryIt language="tsx" code={`…`} />`                                                                | The same in TypeScript, type-checked first             |

Code blocks support titles and highlighted lines: ` ```js title="app.js" {2} `.

Interactive exercises run in a Web Worker in the learner's browser. Checks are either
`expectedOutput` (exact printed lines) or `tests`, JavaScript expressions run after the
learner's code in the same scope, e.g. `{ name: "adds", check: "add(2, 3) === 5" }`;
`__output` holds the printed lines. Every exercise needs a `<Solution>` code block:
`npm test` verifies each solution passes and each starter doesn't.

Python exercises add `language="python"` and write their `check`s in Python
(e.g. `"add(2, 3) == 5"`); they run on [Pyodide](https://pyodide.org) (Python 3.14),
loaded in the browser from jsDelivr and in tests from the `pyodide` package.
Packages the code imports (pandas, FastAPI, SQLAlchemy, pytest, matplotlib…) are
installed on first use. The browser has no threads, so the runner gives `asyncio.run`
a simple event loop and runs FastAPI's `TestClient` on it; `plt.show()` prints the chart
as an image. The code is saved as `lesson.py`, so `pytest.main([__file__])` runs its
tests, and checks can call `_panda_pytest()` (counts of passed/failed tests) or
`_panda_pytest(patch={"add": buggy})` to make sure the learner's tests catch a bug.
`requests` and `httpx` (sync and async) answer the practice API below from the browser
too, Beautiful Soup can scrape its HTML shop (`/shop`, `/shop/<id>`, `/robots.txt`), and
checks can read `_panda_requests`.

SQL exercises add `language="sql"` (```sql fences). They run on PostgreSQL 18 compiled to
WebAssembly ([PGlite](https://pglite.dev)), served from `public/vendor` like the TypeScript
compiler. Every run starts from a fresh copy of the sample database in
`src/lib/runner/sql-seed.ts` (a shop, a company and a film catalogue), runs the statements
one by one and prints what psql would: aligned tables, command tags (`INSERT 0 3`), and
errors with the line and a caret. Checks are JavaScript (they may `await`) and see `rows` and
`columns` of the last result, `results`, `query(sql)`, `lastQuery` and `rerun(setupSql)`,
which changes the data and runs the learner's last query again, so hard-coded answers fail;
each check runs in a transaction that's rolled back afterwards (`src/lib/runner/execute-sql.ts`).

JavaScript can `fetch` the built-in practice API at `https://api.pandadev.test`
(`/movies`, `/weather?city=`, `/recipes`, `/users`, `/posts`, `/todos` with full CRUD,
`/status/404`, `/delay/1500`, `/flaky`, `/offline`; see `src/lib/runner/fake-api.ts`). It answers
after a fixed 100 ms with the same data every run, and never touches the network; checks
can read `__requests` (method, URL, headers and body of each request). Code can also
`import { describe, it, expect, vi } from "vitest"` (tests run after the code, like
`vitest run`, and print a report; checks read `__vitest` or call
`await __retest([["a + b", "a - b"]])` to make sure the learner's tests catch a bug), and
`import express from "express"` / `import request from "supertest"` for an
Express-compatible server that tests call without a network (with `res.cookie()`,
`cookie-parser`, and `request.agent(app)`, which keeps cookies like a browser).
`import { WebSocketServer } from "ws"` starts a WebSocket server on an in-memory network
for that run, and the global `WebSocket` (or the `ws` client) connects to it, e.g.
`new WebSocket("ws://localhost:8080")`; messages arrive asynchronously, one task each,
like a real connection (`src/lib/runner/ws-shim.ts`).

React exercises use `language="react"`: JSX runs in the live preview with React 19
(bundled from `node_modules` by `scripts/build-vendor.mjs`, development build so learners
see React's warnings), on `<div id="root"></div>` unless `html` says otherwise. The same bundle brings the
WebSocket network, so one page can run a `ws` server and a React client together. Checks
can `await __click("button")`, `await __type("input", "Mei")` and `await __settle()` to
wait for renders and requests. To check a loading state without racing the response,
hold the practice API's answers: `(__hold(), __type("input", "p"),
await __release(await __waitFor(() => /* loading is shown */)))`.

TypeScript exercises add `language="typescript"`. Code is type-checked first (strict) with
the real TypeScript compiler, which `scripts/build-vendor.mjs` copies from `node_modules`
into `public/vendor` (so the site serves it, not a CDN); code with type errors doesn't run,
so a starter with deliberate type errors makes a good "fix the types" task. What the code
may use depends on where it runs (`src/lib/runner/typecheck.ts`):

- Plain TypeScript runs in a Web Worker: ES2023 plus the worker library (fetch, URL,
  crypto…, no DOM), and it can import the runner's libraries (`vitest`, `express`,
  `supertest`, `cookie-parser`, `ws`, `http`) with types shaped like the real packages'
  (`src/lib/runner/module-types.ts`; Express infers route parameters from the path).
- With `html={`…`}`, TypeScript is checked against the DOM library and runs in the preview.
- `language="tsx"` is React in TypeScript: checked with React's own types
  (`@types/react`, vendored by `scripts/build-vendor.mjs`) and run like `language="react"`.

Checks run after the types are stripped, so they can't see types; to test type-level work,
let the starter fail type-checking, e.g. with `// @ts-expect-error` lines that must be
errors ("Unused '@ts-expect-error' directive" fails a too-loose type). `npm test` fails if
any TypeScript example or solution has a type error. To show an error in a lesson, use a
plain code block with a `// ❌ Error: …` comment.

DOM exercises add `html={`…`}`: the code runs against that page in a sandboxed iframe
with a live preview, and each check is evaluated in the page afterwards, in order, so
checks can click (`document.querySelector("#add").click()`) and then inspect the page.
`<TryIt html={`…`} code={`…`} />` (closing `/>` on its own line) is an editable demo with
the same preview and no checks; `npm test` runs each one in jsdom to make sure it works.
Previews have an in-memory `localStorage` (the sandboxed page can't use the real one). The
site keeps its contents between runs, so pressing Run again behaves like reloading a page;
Reset clears it, and checks always start with empty storage.

Practice problems live in `content/practice/<language>/NN-slug.mdx` and appear at
`/practice/<language>/<slug>`: frontmatter `title`, `description`, `difficulty` (easy, medium,
hard: 10, 20 or 30 XP), `topic` (see `src/lib/practice-meta.ts`) and optionally a refresher
`lesson`, then the statement and exactly one `<Exercise>`. Translations sit next to them as
`NN-slug.ru.mdx`, like lessons.

Each level ends with a capstone project. In `course.yml` a level's `capstone` is either a
title, or `{ slug, title, description }` with its lessons ("parts") in
`content/courses/<language>/<slug>/`, listed after the level's modules.

The lesson URL is `/learn/<language>/<slug>` (the file name without its number).
`npm run content` validates everything: unknown modules, missing number prefixes and
duplicate slugs fail the build with a clear message. New languages must also be added to
`src/lib/languages.ts`.

## Languages of the site (English + Russian)

The site is bilingual with [next-intl](https://next-intl.dev): English at the plain URLs
(`/learn/python/variables`), Russian under `/ru` (`/ru/learn/python/variables`). Visitors
switch with the EN | RU toggle in the navbar; we don't redirect based on browser language.

- **Pages** live in `src/app/[locale]/…`. `src/proxy.ts` maps URLs to locales; links use
  `Link` from `@/i18n/navigation`, which adds `/ru` automatically.
- **Interface text** is in `messages/<locale>/<area>.json` (areas listed in
  `src/i18n/namespaces.ts`). Keys are type-checked against English, and `npm test` fails if
  the Russian files are missing a key or a `{placeholder}`. Russian plurals use ICU
  (`{count, plural, one {# урок} few {# урока} many {# уроков} other {# урока}}`).
- **Lessons**: a translation sits next to the English file as `NN-slug.ru.mdx`, and course
  outlines as `course.ru.yml`. A translation shares the lesson's slug, permalink and XP, so
  progress is the same in every language. The build fails if a translation's exercise/quiz
  counts, XP or duration differ from the English lesson, and `npm test` runs every
  translated example and exercise just like the English ones. Lessons without a
  translation fall back to English with a note.
- Keep code identifiers in English; translate comments, prose and printed text. Real error
  messages from JavaScript, Python and the TypeScript compiler stay in English.

## Deployment

The site is hosted on [Vercel](https://vercel.com) and connected to this GitHub repo:
every push to `main` deploys to production, and other branches get preview deployments.
Vercel runs `npm run vercel-build` on Node 24: Velite, then **all tests**, then Next.js.
If a test fails, the deployment fails and the current version stays live. GitHub
Actions (`.github/workflows/ci.yml`) also checks formatting, lint, types, tests and the
build on every push and pull request.

Production environment variables (Vercel → Project → Settings → Environment Variables):

| Variable                                            | Value                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`                                      | Neon connection string                                                         |
| `BETTER_AUTH_SECRET`                                | Its own random secret (`openssl rand -base64 32`), not the local one           |
| `BETTER_AUTH_URL`                                   | The production URL, e.g. `https://pandadev.vercel.app`                         |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`         | A separate GitHub OAuth app whose callback is `<url>/api/auth/callback/github` |
| `NEXT_PUBLIC_SENTRY_DSN`                            | Optional: turns on Sentry error reports (browser and server)                   |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Optional: upload source maps so Sentry shows real code lines                   |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`         | Optional, same idea with callback `<url>/api/auth/callback/google`             |

Without the database or auth variables the site still works, just without sign-in and
saved progress.

In production a service worker (`public/sw.js`) keeps Python, PostgreSQL, the TypeScript
compiler, React and the site's scripts after their first download, so the editor starts
instantly on later visits, and keeps visited lessons and practice problems for offline use. Printed values match Node's
`console.log`, including line breaking and promises (`Promise { <pending> }`).

## Scripts

| Command                | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Start the dev server (and Velite in watch mode, in its own process) |
| `npm run build`        | Production build                                                    |
| `npm run start`        | Serve the production build                                          |
| `npm run lint`         | ESLint                                                              |
| `npm run typecheck`    | TypeScript type check                                               |
| `npm run format`       | Format all files with Prettier                                      |
| `npm run format:check` | Check formatting                                                    |
| `npm run test:e2e`     | Solve every exercise in Chrome against a running site (`npm start`) |
| `npm run content`      | Build and validate course content                                   |
| `npm run db:generate`  | Create a migration from schema changes                              |
| `npm run db:migrate`   | Apply migrations to the database                                    |
| `npm run db:studio`    | Browse the database in Drizzle Studio                               |
