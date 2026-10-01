import type { Metadata } from "next";

import { LanguageCatalog } from "@/components/languages/language-catalog";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCourseStats } from "@/lib/content";
import { languages } from "@/lib/languages";

export const metadata: Metadata = {
  title: "All languages",
  description:
    "Choose a programming language and follow a clear path from Beginner to Senior: JavaScript, Python, TypeScript and more.",
  alternates: { canonical: "/languages" },
};

export default function LanguagesPage() {
  const items = languages.map((language) => ({
    language,
    stats: getCourseStats(language.slug),
  }));

  return (
    <Container className="flex flex-col gap-12 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Languages"
        title={
          <>
            What do you want to <GradientText>learn?</GradientText>
          </>
        }
        description="Every language follows the same four levels: Beginner, Junior, Middle and Senior. Pick one and start with your first lesson."
      />
      <LanguageCatalog items={items} />
    </Container>
  );
}
