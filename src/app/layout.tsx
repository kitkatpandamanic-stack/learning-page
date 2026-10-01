import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SpaceBackground } from "@/components/layout/space-background";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Providers } from "@/components/progress/providers";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PandaDev: Learn to code from Zero to Senior",
    template: "%s · PandaDev",
  },
  description:
    "Learn programming languages step by step, from your first line of code to senior level, with interactive lessons, exercises and projects.",
  openGraph: { siteName: "PandaDev", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-gradient-brand px-5 py-2.5 font-semibold text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <SpaceBackground />
        <MotionProvider>
          <Providers>{children}</Providers>
        </MotionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
