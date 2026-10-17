# Sources

External sources a run relied on, grouped by the lesson they informed. Facts only; nothing was copied.

## content/courses/javascript/basics/04-working-with-strings (2026-10-11, greeting card mini-project)

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim : `trim()` removes whitespace and line terminators from both ends, returns a new string, never changes the original.
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice : `slice(start)` with one argument returns from `start` to the end; past the end gives `""`. (`""[0]` is `undefined`, so the name capitalisation assumes a non-empty name.)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals : any expression works inside `${}`; with normal quotes `${name}` prints literally (used in "Common mistakes"); `\${` escapes a literal placeholder (used in the CodeExample `output`).

## content/courses/python/basics/04-working-with-strings (2026-10-11, Mad Libs mini-project)

- https://docs.python.org/3/library/stdtypes.html#str.strip : `strip()`, `upper()`, `lower()` return new strings (strings are immutable); `s * n` repeats a sequence. Checked `title()`/`capitalize()` caveats and decided not to introduce them at L0.
- https://docs.python.org/3/library/functions.html#input : `input()` always returns `str` (reason the starter keeps `number = "7"` as text); `int(" 7 ")` accepts surrounding spaces, `int("7.5")` raises `ValueError`.
- https://www.python.org/downloads/ (via search, 2026-10-11): latest stable is 3.14.x (3.14.7, Aug 2026); 3.15 was due in Oct 2026. Nothing in the lesson depends on the version; all code also runs on the local 3.9.
- Common beginner Mad Libs mistakes (forgetting the `f`, quote clashes inside f-strings, "1 dumplings" plurals), checked to choose the "Common mistakes" and grammar callouts (from a web search summary of these pages, not read in full): https://python-forum.io/post-3866.html, https://kidscodecs.com/python-mad-libs, https://forum.freecodecamp.org/t/madlibs-project-beginner-python/607457, https://textbooks.cs.ksu.edu/intro-python-v2/strings-input/input-practice/

## content/courses/javascript/arrays-and-objects/04-recursion (2026-10-11, new JS recursion lesson)

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Too_much_recursion : exact messages: Chrome `RangeError: Maximum call stack size exceeded`, Safari the same with a trailing full stop, Firefox `InternalError: too much recursion`. Also checked locally: Node v24.21.0 prints `RangeError: Maximum call stack size exceeded`, and a one-line recursive function overflows at 10,371 frames.
- https://developer.mozilla.org/en-US/docs/Glossary/Recursion : base case / recursive case wording; the stack-size limit has no fixed number (used "roughly ten thousand in Chrome and Node").
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray : `Array.isArray` is true for arrays, false for plain objects (why the lesson checks it before `typeof value === "object"`).
- https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html (§15.10 Tail Position Calls, read 2026-10-11): `IsInTailPosition` returns false when the code isn't strict, so proper tail calls exist only for strict-mode code; still in the current draft.
- https://compat-table.github.io/compat-table/es6/ ("proper tail calls (tail call optimisation)"): Safari 15.6–26.4 and WebKit 2/2; Chrome, Edge, Firefox, Node 18–25 and Deno 0/2.
- https://v8.dev/blog/modern-javascript (29 April 2016): V8 implemented PTC but didn't ship it because of developer-experience concerns (lost stack frames for debugging and error telemetry); the `--harmony-tailcalls` flags were later removed.
- https://bugzilla.mozilla.org/show_bug.cgi?id=445363 (via search): SpiderMonkey tail calls resolved WONTFIX. Only used for "Firefox never shipped it either".
- https://javascript.info/recursion : checked for common confusions (missing base case, "about 10,000 is safe", naive Fibonacci). Nothing copied; examples, structure and exercise are our own.
- Runner check (repo, not web): `src/lib/runner/execute.ts` prefixes learner code with `"use strict"`, so in Safari a strict tail call in an exercise could finish where Chrome/Firefox overflow. The lesson only says Safari is the exception, without promising output.

## content/courses/javascript/arrays-and-objects/05-recursion-or-loop (2026-10-17, split from `04-recursion`)

- The "When a loop is better" and "Tail calls" sections moved here unchanged, so the MDN, TC39, compat-table, V8 and Bugzilla sources above still apply (checked 2026-10-11).
- New exercise "Folders too deep for the stack", checked locally (Node v24.21.0, strict mode like the runner): the recursive `totalSize` overflows with `RangeError: Maximum call stack size exceeded` on a 100,000-level folder chain, and the `while`-loop solution returns `100000` for both functions. Browser stack limits weren't measured; the test relies on 100,000 levels being well above Chrome/Node's roughly ten thousand frames.
