import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="flex flex-1 flex-col">
        <Container className="flex flex-1 items-center justify-center py-20">
          <GlassCard
            variant="strong"
            glow="violet"
            padding="lg"
            className="flex max-w-lg flex-col items-center gap-5 text-center sm:p-12"
          >
            <LogoMark className="size-20 drop-shadow-[0_0_24px_rgb(139_92_246/0.8)] motion-safe:animate-float" />
            <p className="font-mono text-sm text-cyan-300">{"// error 404"}</p>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              This page wandered <GradientText>off the map</GradientText>
            </h1>
            <p className="text-muted-foreground">
              Even pandas get lost sometimes. The page you&apos;re looking for
              doesn&apos;t exist or has moved.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="gradient" size="xl">
                <Link href="/">
                  <ArrowLeft /> Back home
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link href="/languages">
                  <Compass /> Browse courses
                </Link>
              </Button>
            </div>
          </GlassCard>
        </Container>
      </main>
      <Footer />
    </>
  );
}
