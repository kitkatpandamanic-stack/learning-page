import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Pages only: skip the API, Next internals, Vercel scripts and files like
  // /icon.svg or /sitemap.xml.
  matcher: "/((?!api|_next|_vercel|monitoring|.*\\..*).*)",
};
