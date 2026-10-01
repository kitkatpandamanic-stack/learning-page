# PandaDev: Roadmap

**PandaDev** is a website for learning programming languages **from zero to senior**, built with Next.js and React.
The design follows the reference shot (dark UI, glowing 3D hero, card grid, dashboard preview,
testimonials, CTA banner). It adds **glassmorphism** and a **brighter, neon-style palette**.

---

## 1. Tech stack (Option B: Next.js full-stack)

| Area                          | Choice                                              | Why                                                                    |
| ----------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Framework                     | **Next.js 16 (App Router) + React 19 + TypeScript** | Frontend and backend in one project, server rendering for SEO          |
| Styling                       | **Tailwind CSS v4**                                 | Utility classes, `backdrop-blur` for glass, design tokens via `@theme` |
| Components                    | **shadcn/ui** (Radix UI underneath)                 | Accessible components copied into the repo and restyled to glass       |
| Animation                     | **Framer Motion** + **GSAP** (ScrollTrigger)        | UI motion, plus scroll-driven effects on the landing page              |
| 3D hero                       | **Spline** (`@splinetool/react-spline`)             | Glowing orb designed visually; fallback: React Three Fiber             |
| Icons                         | **Lucide React**                                    | Line icons that match the design                                       |
| Lesson content                | **MDX + Velite**                                    | Lessons as Markdown files, validated and typed at build time           |
| Syntax highlighting           | **Shiki** (via `rehype-pretty-code`)                | VS Code-quality highlighting, rendered on the server                   |
| Code editor                   | **CodeMirror 6** (`@uiw/react-codemirror`)          | Lightweight, works well on mobile                                      |
| Run code: JS/TS               | **Sandpack**                                        | In-browser bundler, instant feedback                                   |
| Run code: all other languages | **Judge0** (through our own `/api/run` route)       | Python, Java, C#, Go, Rust, C++… executed on a server                  |
| Database                      | **PostgreSQL on Neon** + **Drizzle ORM**            | Serverless Postgres with type-safe queries                             |
| Auth                          | **Auth.js** (NextAuth v5)                           | Sign in with GitHub or Google                                          |
| Server data                   | **TanStack Query** + Server Actions                 | Fetching, caching and saving progress                                  |
| Client state                  | **Zustand**                                         | Small UI state (editor, panels, quiz)                                  |
| Charts                        | **Tremor**                                          | Dashboard cards and charts                                             |
| Validation                    | **Zod**                                             | Shared schemas for forms, API and content                              |
| Quality                       | **ESLint, Prettier, Vitest, Playwright**            | Linting, formatting, unit and end-to-end tests                         |
| Hosting                       | **Vercel** (+ Vercel Analytics)                     | Auto-deploys on every push to `main`                                   |

---

## 2. Visual direction

- **Base:** deep space navy/black (`#070814` → `#0d0f24`) with large blurred colour "blobs" behind content.
- **Bright accents** (brighter than the reference):
  - Electric violet `#8B5CF6` (primary)
  - Neon cyan `#22D3EE`
  - Hot pink `#F472B6`
  - Lime `#A3E635` (success / completed)
  - Amber `#FBBF24` (XP / streaks)
  - Gradients: violet → pink and cyan → violet on headings, buttons, and progress bars.
- **Glass surfaces:** `bg-white/5–10`, `backdrop-blur-xl`, 1px `border-white/15`, a soft inner top highlight, and a coloured glow shadow on hover.
- **Each language gets its own accent colour** (JS yellow, Python blue/yellow, TS blue, Go cyan, Rust orange…).
- **Typography:** _Plus Jakarta Sans_ for UI, _JetBrains Mono_ for code (loaded with `next/font`).
- **Brand:** PandaDev logo, a minimal panda head mark with a violet → cyan glow.

---

## 3. Site structure

### Landing page (mirrors the reference sections)

1. **Navbar:** glass bar with the PandaDev logo, links (Languages, Roadmaps, Playground, Pricing), Sign in, and a "Start learning" button.
2. **Hero:** "Learn to code. **From Zero to Senior.**" with a glowing 3D orb and floating glass chips (`Python · Lesson 12 ✓`, `+50 XP`, `7-day streak 🔥`, a code snippet).
3. **Languages grid:** glass cards for JavaScript, Python, TypeScript, Java, Go, Rust…
4. **Path preview:** the 4 levels (Beginner → Junior → Middle → Senior) as a glowing connected track.
5. **Dashboard preview:** "Good morning, Alex 👋" with XP, lessons done, streak, hours, an activity chart, and per-language progress bars.
6. **Testimonials:** "Loved by learners worldwide".
7. **CTA banner:** "Ready to write your first line of code?"
8. **Footer.**

### App routes (Next.js App Router)

| Route                    | Page                                               |
| ------------------------ | -------------------------------------------------- |
| `/`                      | Landing                                            |
| `/languages`             | All languages catalog                              |
| `/languages/[lang]`      | Language roadmap: levels → modules → lessons       |
| `/learn/[lang]/[lesson]` | Lesson player: theory, code editor, run, quiz      |
| `/playground`            | Free code sandbox                                  |
| `/dashboard`             | Personal progress, XP, streaks, charts (signed in) |
| `/profile`               | Settings, achievements (signed in)                 |
| `/sign-in`               | GitHub / Google sign-in                            |
| `/api/run`               | Server route that sends code to Judge0             |
| `/api/auth/*`            | Auth.js                                            |

### Folder structure

```
src/
  app/            routes, layouts, API routes
  components/
    ui/           shadcn + glass components
    landing/      hero, sections
    lesson/       player, editor, quiz
    dashboard/
  content/        MDX lessons: [lang]/[level]/[module]/[lesson].mdx
  db/             Drizzle schema + migrations
  lib/            auth, judge0, utils
  stores/         Zustand stores
```

---

## 4. Curriculum model ("0 → Senior")

Every language follows the same 4-level ladder:

| Level            | Focus                                                                      | Example (JavaScript)                     |
| ---------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| **0 · Beginner** | Syntax, variables, types, conditions, loops, functions                     | `let`, `if`, `for`, functions            |
| **1 · Junior**   | Data structures, OOP/modules, errors, tooling, small projects              | arrays/objects, classes, npm, DOM, fetch |
| **2 · Middle**   | Async, testing, design patterns, frameworks, databases, APIs               | promises, async/await, Jest, React, REST |
| **3 · Senior**   | Architecture, performance, security, system design, code review, mentoring | event loop internals, scaling, CI/CD     |

Hierarchy: **Language → Level → Module → Lesson**. Each lesson has:

- theory (MDX) · code examples · an interactive exercise with checks · a quiz.

Each module ends with a **mini-project**, and each level ends with a **capstone project**.

**Launch languages (MVP):** JavaScript, Python, TypeScript.
**Later:** Java, C#, Go, Rust, SQL, C++.

---

## 5. Development steps

Steps marked 👤 need you (creating an account or a key). I'll guide you through each one.

### Phase 0: Project setup ✅

1. Create the Next.js app (TypeScript, Tailwind v4, App Router, `src/`, ESLint)
2. Add Prettier, path aliases and the folder structure
3. Initialise shadcn/ui
4. Load the fonts with `next/font`
5. First commit and push to GitHub
6. 👤 Sign in to Vercel with GitHub and import the repo, which gives a live URL that auto-deploys

### Phase 1: Design system ✅

1. Colour, gradient, radius and shadow tokens in `globals.css`
2. Animated background: glowing blobs and a subtle star/grain layer
3. Glass components: `GlassCard`, `Button`, `Badge`, `Chip`, `StatCard`, `ProgressBar`, `GradientText`, `SectionHeading`
4. PandaDev logo (SVG)
5. Glass `Navbar` (sticky, with a mobile menu) and `Footer`

### Phase 2: Landing page

1. Hero with the 3D orb and floating glass chips
2. Languages grid
3. "Zero → Senior" level track
4. Dashboard preview (Tremor)
5. Testimonials
6. CTA banner
7. Scroll and hover animations (Framer Motion + GSAP)
8. Mobile layout, Lighthouse check, deploy

### Phase 3: Content system & catalog

1. Velite config with Zod schemas for language, level, module and lesson
2. `content/` folder with sample MDX
3. `/languages` catalog page
4. `/languages/[lang]` visual roadmap (levels → modules → lessons)
5. Static generation, SEO metadata, sitemap

### Phase 4: Lesson player

1. Lesson layout: module sidebar, content, table of contents, prev/next
2. Shiki code blocks with a copy button
3. MDX components: `Callout`, `Quiz`, `CodeExample`, `Exercise`
4. Write JavaScript Level 0 (about 10 lessons)

### Phase 5: Database & accounts

1. 👤 Create a free Neon database and give me the `DATABASE_URL`
2. Drizzle schema: `users`, `accounts`, `sessions`, `lesson_progress`, `xp_events`, `achievements`, then run the migrations
3. 👤 Create GitHub and Google OAuth apps for login
4. Auth.js setup, `/sign-in` page, user menu, protected routes

### Phase 6: Interactive coding

1. CodeMirror editor component styled to the glass theme
2. Sandpack runner for JS/TS
3. 👤 Get a Judge0 API key
4. `/api/run` route: sends code to Judge0, keeps the key secret, rate-limits requests
5. Exercise checker: runs tests or compares output, then marks the lesson complete

### Phase 7: Progress & gamification

1. Server Actions to save progress, with TanStack Query on the client
2. XP, user levels, daily streaks, achievement badges
3. `/dashboard` with Tremor charts (activity, per-language progress)
4. `/profile` page

### Phase 8: Content & launch

1. Python and TypeScript Level 0–1 content
2. Junior → Middle → Senior content for the MVP languages
3. `/playground` page
4. Accessibility pass, performance (lazy-load the 3D and editor bundles), Open Graph images, Vercel Analytics
5. 🚀 Launch
