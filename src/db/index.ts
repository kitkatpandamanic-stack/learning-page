import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }
  return drizzle(neon(url), { schema });
}

export type Database = ReturnType<typeof createDb>;

let instance: Database | undefined;

/**
 * The database client, created on first use so the app still builds and the
 * public pages still work before DATABASE_URL is configured.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    instance ??= createDb();
    return Reflect.get(instance, prop, receiver);
  },
});
