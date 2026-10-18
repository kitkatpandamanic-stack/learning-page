/** Code Wordle's word list: fair words, from the lessons, clues that don't give them away. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { wordleWords } from "@/lib/tg-app/words";

function lessons(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return lessons(path);
    return path.endsWith(".mdx") && !path.endsWith(".ru.mdx") ? [path] : [];
  });
}

describe("Code Wordle's words", () => {
  for (const [language, words] of Object.entries(wordleWords)) {
    it(`${language}: enough words, letters only, no repeats`, () => {
      expect(words.length).toBeGreaterThanOrEqual(45);
      const seen = new Set<string>();
      for (const { word } of words) {
        expect(word).toMatch(/^[a-z]{3,10}$/);
        expect(seen.has(word), word).toBe(false);
        seen.add(word);
      }
    });

    it(`${language}: every word appears in the course`, () => {
      const text = lessons(join(process.cwd(), "content/courses", language))
        .map((file) => readFileSync(file, "utf8"))
        .join("\n");
      for (const { word } of words) {
        const uses = text.match(new RegExp(`\\b${word}\\b`, "gi"))?.length ?? 0;
        expect(uses, `${word} in ${language} lessons`).toBeGreaterThanOrEqual(
          3,
        );
      }
    });

    it(`${language}: clues in both languages that don't say the word`, () => {
      for (const { word, en, ru } of words) {
        for (const clue of [en, ru]) {
          expect(clue.length, word).toBeGreaterThan(5);
          expect(clue.length, word).toBeLessThanOrEqual(90);
          expect(
            new RegExp(`\\b${word}\\b`, "i").test(clue),
            `${word}: ${clue}`,
          ).toBe(false);
        }
      }
    });
  }
});
