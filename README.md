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

Code blocks support titles and highlighted lines: ` ```js title="app.js" {2} `.

Interactive exercises run in a Web Worker in the learner's browser. Checks are either
`expectedOutput` (exact printed lines) or `tests`, JavaScript expressions run after the
learner's code in the same scope, e.g. `{ name: "adds", check: "add(2, 3) === 5" }`;
`__output` holds the printed lines. Every exercise needs a `<Solution>` code block:
`npm test` verifies each solution passes and each starter doesn't.

Python exercises add `language="python"` and write their `check`s in Python
(e.g. `"add(2, 3) == 5"`); they run on [Pyodide](https://pyodide.org) (Python 3.14),
loaded in the browser from jsDelivr and in tests from the `pyodide` package.

TypeScript exercises add `language="typescript"`. Code is type-checked first (strict,
ES2023 library, no DOM) with the real TypeScript compiler, loaded from jsDelivr in the
browser and from `node_modules` in tests; code with type errors doesn't run, so a starter
with deliberate type errors makes a good "fix the types" task. `npm test` fails if any
TypeScript example or solution has a type error. To show an error in a lesson, use a plain
code block with a `// ❌ Error: …` comment.

DOM exercises add `html={`…`}`: the code runs against that page in a sandboxed iframe
with a live preview, and each check is evaluated in the page afterwards, in order, so
checks can click (`document.querySelector("#add").click()`) and then inspect the page.
`<TryIt html={`…`} code={`…`} />` (closing `/>` on its own line) is an editable demo with
the same preview and no checks; `npm test` runs each one in jsdom to make sure it works.
Previews have an in-memory `localStorage` (the sandboxed page can't use the real one). The
site keeps its contents between runs, so pressing Run again behaves like reloading a page;
Reset clears it, and checks always start with empty storage.

Each level ends with a capstone project. In `course.yml` a level's `capstone` is either a
title, or `{ slug, title, description }` with its lessons ("parts") in
`content/courses/<language>/<slug>/`, listed after the level's modules.

The lesson URL is `/learn/<language>/<slug>` (the file name without its number).
`npm run content` validates everything: unknown modules, missing number prefixes and
duplicate slugs fail the build with a clear message. New languages must also be added to
`src/lib/languages.ts`.

## Deployment

The site is hosted on [Vercel](https://vercel.com) and connected to this GitHub repo:
every push to `main` deploys to production, and other branches get preview deployments.
Vercel runs `npm run build` (Velite, then Next.js) on Node 24.

Production environment variables (Vercel → Project → Settings → Environment Variables):

| Variable                                    | Value                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`                              | Neon connection string                                                         |
| `BETTER_AUTH_SECRET`                        | Its own random secret (`openssl rand -base64 32`), not the local one           |
| `BETTER_AUTH_URL`                           | The production URL, e.g. `https://pandadev.vercel.app`                         |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | A separate GitHub OAuth app whose callback is `<url>/api/auth/callback/github` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional, same idea with callback `<url>/api/auth/callback/google`             |

Without the database or auth variables the site still works, just without sign-in and
saved progress.

## Scripts

| Command                | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start the dev server                   |
| `npm run build`        | Production build                       |
| `npm run start`        | Serve the production build             |
| `npm run lint`         | ESLint                                 |
| `npm run typecheck`    | TypeScript type check                  |
| `npm run format`       | Format all files with Prettier         |
| `npm run format:check` | Check formatting                       |
| `npm run content`      | Build and validate course content      |
| `npm run db:generate`  | Create a migration from schema changes |
| `npm run db:migrate`   | Apply migrations to the database       |
| `npm run db:studio`    | Browse the database in Drizzle Studio  |
