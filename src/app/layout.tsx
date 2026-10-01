import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SpaceBackground } from "@/components/layout/space-background";
import { MotionProvider } from "@/components/motion/motion-provider";
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
  title: {
    default: "PandaDev: Learn to code from Zero to Senior",
    template: "%s · PandaDev",
  },
  description:
    "Learn programming languages step by step, from your first line of code to senior level, with interactive lessons, exercises and projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SpaceBackground />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
