// Solves every exercise on the site in a real Chrome, the way a learner
// would: opens each lesson, scrolls to the exercise, pastes its solution and
// presses Check. Also fails on page errors and Content-Security-Policy
// violations. Needs a running site (`npm run build && npm start`):
//
//   node tests/e2e/exercises.mjs [base URL] [--only=python] [--shard=1/2]
//     [--concurrency=4]
//
// Chrome comes from CHROME_PATH, or the usual place on macOS and Linux.
import { existsSync, readFileSync } from "node:fs";

import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const option = (name) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const base = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000";
const only = option("only")?.split(",");
const concurrency = Number(option("concurrency") ?? 4);
// --shard=1/2: every second lesson, so CI machines can share the work
const [shard, shards] = (option("shard") ?? "1/1").split("/").map(Number);

const chrome =
  process.env.CHROME_PATH ??
  [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ].find(existsSync);
if (!chrome) throw new Error("Chrome not found: set CHROME_PATH");

const lessons = JSON.parse(readFileSync(".velite/lessons.json", "utf8"))
  .filter((l) => l.exerciseCount > 0)
  .filter((l) => !only || only.includes(l.language))
  .filter((_, index) => index % shards === shard - 1)
  .map((l) => ({
    url: `${l.locale === "en" ? "" : `/${l.locale}`}${l.permalink}`,
    exercises: l.exerciseCount,
  }));

// One Chrome per worker: Chrome doesn't render background tabs, so pages
// sharing a browser would never see their editors come on screen.
const launch = () =>
  puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox"],
  });

/** Solves the exercises on one lesson page; returns problems (empty = all good). */
async function solveLesson(browser, url, expected) {
  const page = await browser.newPage();
  const problems = [];
  page.on("pageerror", (error) =>
    problems.push(`page error: ${error.message}`),
  );
  page.on("console", (message) => {
    const text = message.text();
    // Vercel's analytics scripts exist only on Vercel itself.
    if (
      /Content Security Policy|Refused to/i.test(text) &&
      !/_vercel/.test(text)
    )
      problems.push(`blocked: ${text.slice(0, 200)}`);
  });
  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(base + url, { waitUntil: "load", timeout: 60_000 });
    const found = await page.$$eval(
      "section.not-prose",
      (sections) => sections.filter((s) => s.querySelector("details")).length,
    );
    if (found !== expected)
      problems.push(`found ${found} exercises, expected ${expected}`);
    for (let index = 0; index < found; index++) {
      const result = await page.evaluate(solveInPage, index);
      if (result !== "solved")
        problems.push(`exercise ${index + 1}: ${result}`);
    }
  } catch (error) {
    problems.push(String(error));
  } finally {
    await page.close();
  }
  return problems;
}

/** Runs inside the page. */
async function solveInPage(index) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const section = [...document.querySelectorAll("section.not-prose")].filter(
    (s) => s.querySelector("details"),
  )[index];
  section.scrollIntoView({ block: "center" });
  const t0 = Date.now();
  while (!section.querySelector(".cm-content") && Date.now() - t0 < 30_000)
    await sleep(100);
  const content = section.querySelector(".cm-content");
  if (!content) return "the editor never loaded";
  await sleep(800); // let the editor settle (it may restore saved code)
  const solution = [...section.querySelectorAll("details")].find((d) =>
    /solution|решение/i.test(d.querySelector("summary").textContent),
  );
  if (!solution) return "no solution";
  // textContent: off-screen code blocks aren't rendered (content-visibility)
  const code = solution.querySelector("code").textContent;
  const view = content.cmTile.view;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: code },
  });
  await sleep(500);
  const check = [...section.querySelectorAll("button")].find((b) =>
    /^(Check|Проверить)$/.test(b.textContent.trim()),
  );
  check.click();
  const runner = content.closest(".not-prose");
  const t1 = Date.now();
  while (Date.now() - t1 < 120_000) {
    await sleep(250);
    const text = runner.innerText;
    if (/Solved|Решено/.test(text)) return "solved";
    if (/Not quite|Пока не/.test(text)) {
      const output = text.slice(
        text.lastIndexOf("\n", text.indexOf("Not quite") - 1),
      );
      return `not solved: ${output.replace(/\s+/g, " ").slice(0, 400)}`;
    }
  }
  return "timed out";
}

const started = Date.now();
const failures = [];
let done = 0;
const queue = [...lessons];
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    const browser = await launch();
    for (let lesson = queue.shift(); lesson; lesson = queue.shift()) {
      let problems = await solveLesson(browser, lesson.url, lesson.exercises);
      // One retry: a busy CI machine can make a timing-based check flaky.
      if (problems.length)
        problems = await solveLesson(browser, lesson.url, lesson.exercises);
      done++;
      if (problems.length) {
        failures.push({ url: lesson.url, problems });
        console.log(`✗ ${lesson.url}\n    ${problems.join("\n    ")}`);
      }
      if (done % 25 === 0)
        console.log(`${done}/${lessons.length} lessons checked`);
    }
    await browser.close();
  }),
);

const seconds = Math.round((Date.now() - started) / 1000);
const total = lessons.reduce((n, l) => n + l.exercises, 0);
console.log(
  `\n${lessons.length - failures.length}/${lessons.length} lessons (${total} exercises) solved in ${seconds}s`,
);
process.exit(failures.length ? 1 : 0);
