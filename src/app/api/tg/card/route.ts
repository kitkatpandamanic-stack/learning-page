import type { NextRequest } from "next/server";

import { parseCard } from "@/lib/tg-app/card";
import { renderCard } from "@/lib/tg-app/card-image";

/**
 * A share picture from the Mini App (a Blitz result or a panda), for
 * Stories and chats: /api/tg/card?k=blitz&l=en&n=3&lang=python&g=1101…&t=41.
 * Only numbers and known names, so it can't be made to draw other text.
 */
export async function GET(request: NextRequest) {
  const card = parseCard(request.nextUrl.searchParams);
  if (!card) return new Response("Bad card", { status: 400 });
  const image = await renderCard(card);
  image.headers.set("Cache-Control", "public, s-maxage=604800, max-age=86400");
  return image;
}
