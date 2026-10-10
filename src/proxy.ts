import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Pages only: skip the API, Next internals, Vercel scripts, files like
  // /icon.svg or /sitemap.xml, and generated share images. Those are linked
  // as /en/…/opengraph-image-…, which the locale router would redirect to a
  // URL without /en; link previews should get the image straight away.
  matcher: "/((?!api|_next|_vercel|monitoring|.*opengraph-image|.*\\..*).*)",
};
