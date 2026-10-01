import { CtaSection } from "@/components/landing/cta-section";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Hero } from "@/components/landing/hero";
import { LanguagesSection } from "@/components/landing/languages-section";
import { RoadmapSection } from "@/components/landing/roadmap-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

export default function Home() {
  return (
    <>
      <Hero />
      <LanguagesSection />
      <RoadmapSection />
      <DashboardPreview />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
