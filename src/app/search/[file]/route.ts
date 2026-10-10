import { locales } from "@/lib/i18n";
import { buildSearchIndex } from "@/lib/search-index";

// One static file per locale, written at build time: /search/en.json, /search/ru.json.
// (The dot keeps it out of the locale middleware, like other files.)
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ file: `${locale}.json` }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/search/[file]">,
) {
  const { file } = await params;
  const locale = locales.find((l) => file === `${l}.json`);
  if (!locale) return new Response("Not found", { status: 404 });
  return Response.json(buildSearchIndex(locale));
}
