import { setRequestLocale } from "next-intl/server";

import { Navbar } from "@/components/layout/navbar";
import { localeParam } from "@/lib/i18n";

// Lessons get the navbar but no marketing footer, to keep focus on learning.
export default async function LearnLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  // Layouts render apart from their pages, so each one tells next-intl the
  // locale. Without it the navbar's and footer's translations read it from
  // the request headers, and every page under this layout is rendered per
  // visit instead of once at build time.
  setRequestLocale(await localeParam(params));
  return (
    <>
      <Navbar />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
