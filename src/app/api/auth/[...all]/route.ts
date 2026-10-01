import { authConfigured } from "@/lib/auth-providers";

async function handler(request: Request) {
  if (!authConfigured) {
    // Until the database and secret are set, report "nobody signed in" so the
    // navbar renders normally, and refuse everything else.
    if (new URL(request.url).pathname.endsWith("/get-session")) {
      return Response.json(null);
    }
    return Response.json(
      { message: "Sign-in is not configured yet." },
      { status: 503 },
    );
  }
  const { auth } = await import("@/lib/auth");
  return auth.handler(request);
}

export { handler as GET, handler as POST };
