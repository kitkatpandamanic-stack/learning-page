import type { Metadata } from "next";
import Link from "next/link";

import { ProsePage } from "@/components/layout/prose-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using PandaDev.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Terms"
      eyebrowTone="amber"
      title="Terms of Use"
      description="The simple rules for using PandaDev."
      updated="1 October 2026"
    >
      <h2>Using PandaDev</h2>
      <p>
        PandaDev is a free learning website. You can read lessons, run code and
        practise without an account. By using the site you agree to these terms
        and our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>
          You sign in with GitHub or Google and are responsible for keeping that
          account secure.
        </li>
        <li>
          You can delete your PandaDev account at any time from your{" "}
          <Link href="/profile">profile</Link>.
        </li>
        <li>
          We may suspend accounts that abuse the service, for example by trying
          to cheat XP or attack the site.
        </li>
      </ul>

      <h2>Your code</h2>
      <p>
        Code you write in exercises and the playground is yours. It runs in your
        own browser, so please don&apos;t run code you don&apos;t trust.
      </p>

      <h2>Our content</h2>
      <p>
        Lessons, exercises and the PandaDev design are made by PandaDev. You are
        welcome to use what you learn anywhere, but please don&apos;t copy whole
        lessons to publish elsewhere. The website&apos;s source code is
        available on <a href={siteConfig.githubUrl}>GitHub</a>.
      </p>

      <h2>No guarantees</h2>
      <p>
        We work hard to keep lessons accurate and the site running, but PandaDev
        is provided &ldquo;as is&rdquo;, without warranties of any kind. To the
        extent the law allows, we are not liable for any loss arising from using
        the site.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as PandaDev grows. The date at the top shows
        when they last changed.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? <a href={siteConfig.contactUrl}>Open an issue on GitHub</a>.
      </p>
    </ProsePage>
  );
}
