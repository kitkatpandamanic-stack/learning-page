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
