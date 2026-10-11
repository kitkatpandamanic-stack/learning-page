# Lessons learned

Rules that came from mistakes, corrections and feedback. **Every agent and session reads this file first and follows it.**
Add a rule when something went wrong or the site owner corrected you, phrased as what to do next time. Keep it short, and merge duplicates.

## Accuracy
- **Recount before you report.** (2026-10-11: the first learning-architect run said "6 project labels are wrong" but there were 5.) Any number in a report must come from a count you just ran, not from memory.
- Check each finding against the actual files before calling it a gap. A spot check by the main session is not enough.

## Content
- A `project:` label in `course.yml` must match a `Mini-project: …` Exercise title in that module's lessons. If a module has no mini-project, leave out `project:` (it's optional in the schema). Never label a project that doesn't exist. (2026-10-11: 5 labels fixed.)
- Every change to course content is made in both EN and RU: `.mdx` + `.ru.mdx`, `course.yml` + `course.ru.yml`.
- Mini-project placement: every lesson has exactly one `<Exercise>`, and at L0 the mini-project *is* that Exercise in an existing lesson (JS/Python conditions, loops, functions, TS basics). Adding one to an existing lesson means replacing its exercise, so fold the old exercise's skill into the project. (2026-10-11: basics projects went into `04-working-with-strings`.)
- Exercise and Quiz ids are positional (`exercise-1`, `quiz-N` in document order; saved code is keyed `locale:path#exercise-1`, see `velite.config.ts` and `src/lib/saved-code.ts`). Add a new Quiz **after** the existing ones so old progress and review cards keep pointing at the same question. Replacing an exercise keeps its id: learners who did the old one see their old code and get no new +10 XP. Say so in the report. (2026-10-11: the site owner said replacing the exercise is fine: stale saved code and no repeat XP are acceptable.)
- For "change the values and run it again" generator exercises: actually run the solution with the values you suggest and check the promised effect happens (2026-10-11: the first suggested Mad Libs words gave a title of the same length, so the "underline grows or shrinks" claim didn't show). Test names are shown to learners, so phrase defaults as "like HAPPY BIRTHDAY, ZARA!", not as the only right answer.
- RU twins of fill-in-the-words exercises: write the template so inserted words never need declension or agreement (present tense for the hero, nominative slots, numbers standing alone instead of "7 пельменей"), and say the needed form in the starter comment ("прилагательное мужского рода").
- MDX: a `"…"` JSX attribute can't contain `\"`; use `{'…'}`. Inside a template-literal attribute (`output={`…`}`), write a literal `${` as `\${`.

## Tooling
- `npm run content` (velite) takes ~1–3 minutes (53 s on 2026-10-11). Run it in the background. `CONTENT_LANGUAGES=javascript,python` content tests: 3,105 tests, ~4 minutes; add `--reporter=verbose` and grep to see your own lessons' results.
- The full `tests/content.test.ts` takes ~9 minutes (5,677 tests). Limit it with `CONTENT_LANGUAGES=python` (comma-separated) when only one course changed.
- The local Python is 3.9 and there's no `psql`, only `sqlite3`. Don't claim you ran code that needs a newer runtime.
- The shell is zsh: an unquoted `echo ====` fails (`=word` expansion). Quote separators: `echo "----"`.

## Working in this repo
- The site owner often has uncommitted work in progress in `src/`, `drizzle/` and `messages/`. Never touch, stage or commit it. If files change during a run, they belong to the owner.

## Checklist before reporting a lesson as done
- [ ] Every `CodeExample` was run and its `output` matches exactly
- [ ] Every `Solution` passes its `tests`, and the `Hint` doesn't give the answer away
- [ ] It uses no concept that comes later in `curriculum.md`
- [ ] The EN and RU versions match: same code, same tests, same quiz answer index
- [ ] `npm run content` and the content tests pass for that language
- [ ] Sources are recorded in `sources.md`, and nothing was copied from them
