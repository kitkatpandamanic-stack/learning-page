import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { namespaces } from "@/i18n/namespaces";
import { routing } from "@/i18n/routing";

const load = (locale: string, ns: string) =>
  JSON.parse(
    readFileSync(
      join(__dirname, "..", "messages", locale, `${ns}.json`),
      "utf8",
    ),
  ) as unknown;

/** "a.b.c" paths of every string, plus the {placeholders} each one uses. */
function flatten(value: unknown, prefix = ""): Map<string, string[]> {
  const out = new Map<string, string[]>();
  if (typeof value === "string") {
    // Top-level ICU arguments like {count} or {name}; plural branches vary by language.
    const args = [...value.matchAll(/\{(\w+)(?=[,}])/g)].map((m) => m[1]);
    out.set(prefix, [...new Set(args)].sort());
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      for (const [k, v] of flatten(child, prefix ? `${prefix}.${key}` : key))
        out.set(k, v);
    }
  }
  return out;
}

describe("interface translations", () => {
  for (const ns of namespaces) {
    const english = flatten(load("en", ns));
    for (const locale of routing.locales.filter((l) => l !== "en")) {
      it(`${locale}/${ns}.json has the same keys and placeholders as English`, () => {
        const translated = flatten(load(locale, ns));
        expect([...translated.keys()].sort()).toEqual(
          [...english.keys()].sort(),
        );
        for (const [key, args] of english) {
          expect(translated.get(key), `${ns}.${key}`).toEqual(args);
        }
      });
    }
  }
});
