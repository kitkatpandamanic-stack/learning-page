// One-time setup for the nightly database backups (.github/workflows/backup.yml).
// Run it yourself, from the project folder:
//
//   node scripts/backup/setup.mjs
//
// It
//  1. creates your backup key pair: the private key stays on this computer
//     (~/.pandadev/backup-private-key.pem), the public key goes to GitHub
//     (variable BACKUP_PUBLIC_KEY) so backups can be encrypted there;
//  2. creates a read-only database role "backup_reader" with a new random
//     password (run again to change it) and saves its connection string as
//     the GitHub secret BACKUP_DATABASE_URL;
//  3. starts the first backup.
// No password or key is ever printed.
import { spawnSync } from "node:child_process";
import { createPublicKey, generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { neon } from "@neondatabase/serverless";

import { loadEnv } from "../telegram/lib.mjs";
import { DEFAULT_KEY_FILE, decrypt, encrypt } from "./crypt.mjs";

loadEnv();
const REPO = "kitkatpandamanic-stack/learning-page";
const ROLE = "backup_reader";

function gh(args, input) {
  const result = spawnSync("gh", [...args, "--repo", REPO], {
    input,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(
      `gh ${args.slice(0, 3).join(" ")} failed (is gh logged in?)`,
    );
}

// 1. Key pair
let publicKey;
if (existsSync(DEFAULT_KEY_FILE)) {
  publicKey = createPublicKey(readFileSync(DEFAULT_KEY_FILE)).export({
    type: "spki",
    format: "pem",
  });
  console.log(`✓ Using your existing private key (${DEFAULT_KEY_FILE})`);
} else {
  const pair = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  mkdirSync(dirname(DEFAULT_KEY_FILE), { recursive: true, mode: 0o700 });
  writeFileSync(DEFAULT_KEY_FILE, pair.privateKey, { mode: 0o600 });
  publicKey = pair.publicKey;
  console.log(`✓ Created your private key: ${DEFAULT_KEY_FILE}`);
}
// The pair must work together before anything depends on it.
const probe = randomBytes(64);
if (
  !decrypt(encrypt(probe, publicKey), readFileSync(DEFAULT_KEY_FILE)).equals(
    probe,
  )
)
  throw new Error("The key pair doesn't work");
gh(["variable", "set", "BACKUP_PUBLIC_KEY", "--body", publicKey]);
console.log("✓ Public key saved to GitHub (BACKUP_PUBLIC_KEY)");

// 2. Read-only role
const ownerUrl = process.env.DATABASE_URL;
if (!ownerUrl) throw new Error("DATABASE_URL is missing from .env.local");
const sql = neon(ownerUrl);
const password = randomBytes(24).toString("hex"); // hex: safe inside SQL quotes
const [{ exists }] = await sql.query(
  "select exists (select 1 from pg_roles where rolname = $1) as exists",
  [ROLE],
);
await sql.query(
  exists
    ? `alter role ${ROLE} with login password '${password}'`
    : `create role ${ROLE} with login password '${password}'`,
);
try {
  // Read access to every table, now and in the future.
  await sql.query(`grant pg_read_all_data to ${ROLE}`);
} catch {
  // Without that permission: grant reading table by table instead.
  for (const schema of ["public", "drizzle"]) {
    await sql.query(`grant usage on schema ${schema} to ${ROLE}`);
    await sql.query(
      `grant select on all tables in schema ${schema} to ${ROLE}`,
    );
    await sql.query(
      `grant select on all sequences in schema ${schema} to ${ROLE}`,
    );
    await sql.query(
      `alter default privileges in schema ${schema} grant select on tables to ${ROLE}`,
    );
    await sql.query(
      `alter default privileges in schema ${schema} grant select on sequences to ${ROLE}`,
    );
  }
}
console.log(`✓ Read-only database role "${ROLE}" is ready`);

const backupUrl = new URL(ownerUrl);
backupUrl.username = ROLE;
backupUrl.password = password;
// pg_dump needs a direct connection, not the pooler.
backupUrl.hostname = backupUrl.hostname.replace("-pooler", "");
backupUrl.searchParams.set("sslmode", "require");
backupUrl.searchParams.delete("channel_binding");

// The new role must be able to read, and must not be able to write.
const reader = neon(backupUrl.toString());
await reader.query('select count(*) from "user"');
const canWrite = await reader
  .query("create table backup_reader_write_test (id int)")
  .then(() => true)
  .catch(() => false);
if (canWrite) {
  await sql.query("drop table if exists backup_reader_write_test");
  throw new Error(`${ROLE} can write: not saving it`);
}
gh(["secret", "set", "BACKUP_DATABASE_URL"], backupUrl.toString());
console.log("✓ Connection saved to GitHub (BACKUP_DATABASE_URL)");

// 3. First backup
const run = spawnSync("gh", ["workflow", "run", "backup.yml", "--repo", REPO]);
console.log(
  run.status === 0
    ? "✓ Started the first backup (GitHub → Actions → Backup)"
    : "(Start the first backup from GitHub → Actions → Backup → Run workflow once it's merged.)",
);
console.log(`
Important: keep a copy of ${DEFAULT_KEY_FILE} somewhere safe besides this
computer (a password manager or a USB stick). Without it, no backup can be
opened. Never share it or put it in the repository.
Now tell Claude "backup done".`);
