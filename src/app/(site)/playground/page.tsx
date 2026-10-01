import type { Metadata } from "next";

import { Playground } from "@/components/code/playground";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Write and run JavaScript and TypeScript right in your browser. No setup needed.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return (
    <Container className="flex max-w-5xl flex-col gap-10 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Playground"
        eyebrowTone="cyan"
        title={
          <>
            Write code. <GradientText>Run it instantly.</GradientText>
          </>
        }
        description="Experiment freely. Everything runs right in your browser, so there's nothing to install."
      />
      <Playground />
    </Container>
  );
}
