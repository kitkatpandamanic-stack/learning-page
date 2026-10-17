import { miniAppHome } from "@/lib/tg-app/home";
import { miniAppCaller } from "@/lib/tg-app/player";

/** The Mini App's first screen: the panda, today's Blitz. POST, so nothing caches it. */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  return Response.json(await miniAppHome(caller));
}
