import Link from "next/link";
import { ArrowRight, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";

// Temporary placeholder until the landing page is built in Phase 2.
export default function Home() {
  return (
    <Container className="flex flex-1 items-center justify-center py-24">
      <GlassCard
        glow="violet"
        padding="lg"
        className="flex max-w-xl flex-col items-center text-center sm:p-12"
      >
        <Badge tone="cyan" dot>
          Coming soon
        </Badge>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Learn to code.
          <br />
          <GradientText>From Zero to Senior.</GradientText>
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          PandaDev is getting ready. Interactive lessons, real projects and a
          clear path for every language.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gradient" size="xl">
            <Link href="/languages">
              Start learning <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="glass" size="xl">
            <Link href="/design">
              <Palette /> Design system
            </Link>
          </Button>
        </div>
      </GlassCard>
    </Container>
  );
}
