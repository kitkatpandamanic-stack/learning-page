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

Code blocks support titles and highlighted lines: ` ```js title="app.js" {2} `.

Interactive exercises run in a Web Worker in the learner's browser. Checks are either
`expectedOutput` (exact printed lines) or `tests`, JavaScript expressions run after the
learner's code in the same scope, e.g. `{ name: "adds", check: "add(2, 3) === 5" }`;
`__output` holds the printed lines. Every exercise needs a `<Solution>` code block:
`npm test` verifies each solution passes and each starter doesn't.

The lesson URL is `/learn/<language>/<slug>` (the file name without its number).
`npm run content` validates everything: unknown modules, missing number prefixes and
duplicate slugs fail the build with a clear message. New languages must also be added to
`src/lib/languages.ts`.

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
