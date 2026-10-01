# PandaDev 🐼

Learn programming languages **from Zero to Senior**, with interactive lessons, exercises and projects.

See [ROADMAP.md](ROADMAP.md) for the full plan, stack and development phases.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui

## Getting started

Requires Node.js 24 (see `.nvmrc`).

```bash
nvm use
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

The lesson URL is `/learn/<language>/<slug>` (the file name without its number).
`npm run content` validates everything: unknown modules, missing number prefixes and
duplicate slugs fail the build with a clear message. New languages must also be added to
`src/lib/languages.ts`.

## Scripts

| Command                | What it does                      |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the dev server              |
| `npm run build`        | Production build                  |
| `npm run start`        | Serve the production build        |
| `npm run lint`         | ESLint                            |
| `npm run typecheck`    | TypeScript type check             |
| `npm run format`       | Format all files with Prettier    |
| `npm run format:check` | Check formatting                  |
| `npm run content`      | Build and validate course content |
