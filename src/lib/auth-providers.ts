// Kept separate from auth.ts so pages can list providers without starting Better Auth.

export type SocialProvider = "github" | "google";

// In the order the sign-in page shows them: most beginners have Google.
export const providerCredentials = {
  google:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }
      : undefined,
  github:
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }
      : undefined,
};

/** True once the database and auth secret are set; until then nobody can sign in. */
export const authConfigured = Boolean(
  process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET,
);

/** Providers the sign-in page should offer. */
export const enabledProviders: SocialProvider[] = authConfigured
  ? (Object.keys(providerCredentials) as SocialProvider[]).filter(
      (p) => providerCredentials[p],
    )
  : [];
