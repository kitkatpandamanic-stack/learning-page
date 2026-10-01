import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout/prose-page";
import { GradientText } from "@/components/ui/gradient-text";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why PandaDev exists and how it teaches programming from your first line of code to senior level.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="About"
      title={
        <>
          Learning to code should feel like <GradientText>play</GradientText>
        </>
      }
      description="PandaDev is a free, open-source place to learn programming, from your very first line of code to senior engineering."
    >
      <h2>Why PandaDev?</h2>
      <p>
        Most tutorials either stop at the basics or assume you already know
        everything. PandaDev gives every language one clear path through four
        levels, <strong>Beginner → Junior → Middle → Senior</strong>, so you
        always know what to learn next and why it matters.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>
          <strong>Short lessons</strong> explain one idea at a time, with
          examples that show exactly what the code prints.
        </li>
        <li>
          <strong>Code in your browser.</strong> Every exercise has an editor, a
          Run button and automatic checks. There&apos;s nothing to install.
        </li>
        <li>
          <strong>Quizzes, XP and streaks</strong> keep you motivated and show
          how far you&apos;ve come.
        </li>
        <li>
          <strong>Projects</strong> at the end of each module and level turn
          what you learned into something you can show.
        </li>
      </ul>

      <h2>Every lesson is tested</h2>
      <p>
        Every code example and every exercise solution in PandaDev is run
        automatically before it&apos;s published, so the output you see in a
        lesson is the output you&apos;ll really get.
      </p>

      <h2>Open source</h2>
      <p>
        PandaDev is built in the open with Next.js, React and TypeScript. You
        can read the code, suggest lessons or report a mistake{" "}
        <a href={siteConfig.githubUrl}>on GitHub</a>.
      </p>

      <h2>Get in touch</h2>
      <p>
        Found a bug or have an idea?{" "}
        <a href={siteConfig.contactUrl}>Open an issue on GitHub</a>. Ready to
        start? <Link href="/languages">Pick a language</Link>.
      </p>
    </ProsePage>
  );
}
