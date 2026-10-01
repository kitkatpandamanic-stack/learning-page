import type { ComponentProps, ReactElement } from "react";
import * as runtime from "react/jsx-runtime";

import { Callout } from "@/components/mdx/callout";
import { CodeExample } from "@/components/mdx/code-example";
import { Exercise, Hint, Solution } from "@/components/mdx/exercise";
import { Pre } from "@/components/mdx/pre";
import { Quiz } from "@/components/mdx/quiz";
import { TryIt } from "@/components/mdx/try-it";
import { Link } from "@/i18n/navigation";

/** Links between lessons keep the reader in their language (/ru/learn/…). */
function MdxLink({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return <Link href={href} {...props} />;
  }
  return <a href={href} {...props} />;
}

/** Components available inside every lesson without importing them. */
const components = {
  a: MdxLink,
  pre: Pre,
  Callout,
  CodeExample,
  Exercise,
  Hint,
  Quiz,
  Solution,
  TryIt,
};

type MDXComponent = (props: { components: typeof components }) => ReactElement;

// Velite compiles MDX at build time into a function body; evaluate it with the JSX runtime.
function getMDXComponent(code: string): MDXComponent {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
}

export function MDXContent({ code }: { code: string }) {
  // Called as a plain function (it uses no hooks) rather than mounted as a new
  // component type on every render.
  return getMDXComponent(code)({ components });
}
