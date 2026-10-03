import { setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { localeParam } from "@/lib/i18n";

export default async function SiteLayout({
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
      <Footer />
    </>
  );
}
