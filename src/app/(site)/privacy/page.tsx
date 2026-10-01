import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout/prose-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data PandaDev collects, why, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Privacy"
      eyebrowTone="cyan"
      title="Privacy Policy"
      description="In short: we collect as little as we can, never sell it, and you can delete everything at any time."
      updated="1 October 2026"
    >
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong>, only if you sign in: your name,
          email address and profile picture from GitHub or Google, plus which
          provider you used. We never see your GitHub or Google password.
        </li>
        <li>
          <strong>Learning progress</strong>: lessons you completed, XP you
          earned (and for what), and achievements you unlocked.
        </li>
        <li>
          <strong>Basic sign-in records</strong>: when you signed in, your IP
          address and browser type, kept with your session for security.
        </li>
      </ul>

      <h2>What stays on your device</h2>
      <ul>
        <li>
          <strong>Your code.</strong> Code you write in exercises and the
          playground runs in your own browser and is saved there (local
          storage). It is not sent to us.
        </li>
        <li>
          <strong>Your time zone</strong> is stored in a small cookie so your
          daily streak follows your own midnight.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use only the cookies the site needs to work: sign-in cookies while
        you sign in and stay signed in, and the time zone cookie. There are no
        advertising or tracking cookies.
      </p>

      <h2>Analytics</h2>
      <p>
        We use Vercel Web Analytics to count page views. It doesn&apos;t use
        cookies and doesn&apos;t identify you; we only see totals such as how
        many people visited a lesson.
      </p>

      <h2>Who processes the data</h2>
      <ul>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
        <li>
          <strong>Neon</strong> stores the database with accounts and progress.
        </li>
        <li>
          <strong>GitHub</strong> and <strong>Google</strong> handle sign-in if
          you choose them.
        </li>
        <li>
          <strong>jsDelivr</strong> serves Pyodide, the program that runs Python
          in your browser. Your browser downloads it from their network the
          first time you run Python code; your code itself never leaves your
          device.
        </li>
      </ul>
      <p>We never sell your data or share it for advertising.</p>

      <h2>Deleting your data</h2>
      <p>
        Go to your <Link href="/profile">profile</Link> and choose{" "}
        <strong>Delete account</strong>. This permanently removes your account,
        sessions, progress, XP and achievements straight away. To remove saved
        code, clear this site&apos;s data in your browser.
      </p>

      <h2>Questions</h2>
      <p>
        Ask anything about your data by{" "}
        <a href={siteConfig.contactUrl}>opening an issue on GitHub</a>.
      </p>
    </ProsePage>
  );
}
