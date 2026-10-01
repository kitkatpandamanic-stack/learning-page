import { Reveal } from "@/components/motion/reveal";
import { LanguageCard } from "@/components/languages/language-card";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { languages } from "@/lib/languages";

export function LanguagesSection() {
  return (
    <section id="languages" className="scroll-mt-28 py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Languages"
            title={
              <>
                Pick a language. <GradientText>Start today.</GradientText>
              </>
            }
            description="Every language follows the same four-level path, so you always know what to learn next."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((language, i) => (
            <Reveal key={language.slug} delay={(i % 3) * 0.08}>
              <LanguageCard language={language} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
