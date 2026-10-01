import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { providerCredentials } from "@/lib/auth-providers";

const { github, google } = providerCredentials;

export const auth = betterAuth({
  appName: "PandaDev",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: {
    ...(github && { github }),
    ...(google && { google }),
  },
  account: {
    // Signing in with GitHub and Google using the same email links to one PandaDev account.
    accountLinking: { enabled: true, trustedProviders: ["github", "google"] },
  },
  user: {
    // Lets learners delete their account and all their data from the profile page.
    deleteUser: { enabled: true },
  },
  session: {
    // Avoid a database round-trip on every request; re-validated every 5 minutes.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
