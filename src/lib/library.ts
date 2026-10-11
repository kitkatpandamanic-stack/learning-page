import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { parseCatalog, type Catalog } from "@/lib/library-items";

/**
 * The book library: books and materials from the private book-library repo,
 * which a GitHub workflow copies with a catalog.json to an S3-compatible
 * bucket (Cloudflare R2). The bucket stays private; signed-in learners get a
 * link that expires after a few minutes (app/api/library/[...path]).
 *
 * Until the STORAGE_* variables are set (see .env.example) the library is
 * off: getCatalog() returns null and course pages say it's coming soon.
 */

const env = {
  bucket: process.env.STORAGE_BUCKET,
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  region: process.env.STORAGE_REGION || "auto",
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
};

export const libraryConfigured = Boolean(
  env.bucket && env.accessKeyId && env.secretAccessKey,
);

let client: S3Client | undefined;
function s3() {
  client ??= new S3Client({
    region: env.region,
    endpoint: env.endpoint,
    // R2 (and local S3 stand-ins) take the bucket in the path; AWS itself
    // (no endpoint) keeps its usual bucket.s3.amazonaws.com addresses.
    forcePathStyle: Boolean(env.endpoint),
    credentials: {
      accessKeyId: env.accessKeyId!,
      secretAccessKey: env.secretAccessKey!,
    },
  });
  return client;
}

const CACHE_MS = 5 * 60_000;

// Kept for 5 minutes per server instance, so new books show up shortly after
// a push. Pages built at the same time share one download.
let cached: { at: number; data: Catalog } | undefined;
let pending: Promise<Catalog> | undefined;

async function downloadCatalog() {
  const obj = await s3().send(
    new GetObjectCommand({ Bucket: env.bucket, Key: "catalog.json" }),
  );
  if (!obj.Body) throw new Error("catalog.json is empty");
  return parseCatalog(JSON.parse(await obj.Body.transformToString()));
}

/**
 * The whole catalog, or null when storage isn't set up or can't be read.
 * A failed download keeps serving the last good copy, if there is one.
 */
export async function getCatalog(): Promise<Catalog | null> {
  if (!libraryConfigured) return null;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  pending ??= downloadCatalog().finally(() => {
    pending = undefined;
  });
  try {
    const data = await pending;
    cached = { at: Date.now(), data };
    return data;
  } catch (error) {
    console.error("[library] couldn't read catalog.json:", error);
    return cached?.data ?? null;
  }
}

/** One course's shelf, matched by its /languages/<slug>. */
export async function getCourseLibrary(slug: string) {
  return (await getCatalog())?.courses.find((c) => c.slug === slug) ?? null;
}

/** A link to one file in the private bucket that works for `expiresIn` seconds. */
export function signedFileUrl(file: string, expiresIn = 300) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: env.bucket, Key: file }),
    { expiresIn },
  );
}
