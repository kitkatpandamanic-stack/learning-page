import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { ArrowLeft, Compass } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Link } from "@/i18n/navigation";

// A not-found file gets no params, and asking next-intl for the locale here
// reads request headers, which breaks lessons and problems built on their
// first visit (a missing one errored instead of showing this page). So the
// tab title is "404 · PandaDev" in every language; the page is translated.
export const metadata: Metadata = { title: "404" };

export default function NotFound() {
  const t = useTranslations("notFound");

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
            <p className="font-mono text-sm text-cyan-300">{t("code")}</p>
            <h1 className="text-4xl font-bold tracking-tight text-balance text-white">
              {t.rich("title", {
                gradient: (chunks) => <GradientText>{chunks}</GradientText>,
              })}
            </h1>
            <p className="text-muted-foreground">{t("body")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="gradient" size="xl">
                <Link href="/">
                  <ArrowLeft /> {t("backHome")}
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link href="/languages">
                  <Compass /> {t("browseCourses")}
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
