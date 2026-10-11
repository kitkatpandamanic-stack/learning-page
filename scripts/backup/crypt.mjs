// Encrypts and decrypts PandaDev's database backups. Backups are encrypted on
// GitHub with your public key (repository variable BACKUP_PUBLIC_KEY); only
// your private key, which never leaves your computer, can open them.
//
//   node scripts/backup/crypt.mjs encrypt <dump> <out.enc>     (uses BACKUP_PUBLIC_KEY)
//   node scripts/backup/crypt.mjs decrypt <file.enc> <out.dump> [--key <private key file>]
//
// Format: "PDBK1\n", the AES key wrapped with RSA-OAEP-SHA256 (2-byte length
// first), a 12-byte IV, the 16-byte AES-256-GCM tag, then the ciphertext.
import {
  constants,
  createCipheriv,
  createDecipheriv,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const MAGIC = Buffer.from("PDBK1\n");
const OAEP = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" };
export const DEFAULT_KEY_FILE = join(
  homedir(),
  ".pandadev",
  "backup-private-key.pem",
);

export function encrypt(plain, publicKey) {
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  const wrapped = publicEncrypt({ key: publicKey, ...OAEP }, key);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(wrapped.length);
  return Buffer.concat([MAGIC, length, wrapped, iv, cipher.getAuthTag(), body]);
}

export function decrypt(file, privateKey) {
  if (!file.subarray(0, MAGIC.length).equals(MAGIC))
    throw new Error("Not a PandaDev backup");
  let at = MAGIC.length;
  const length = file.readUInt16BE(at);
  at += 2;
  const key = privateDecrypt(
    { key: privateKey, ...OAEP },
    file.subarray(at, at + length),
  );
  at += length;
  const iv = file.subarray(at, at + 12);
  const tag = file.subarray(at + 12, at + 28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  // final() throws if anything was changed: a damaged or tampered file.
  return Buffer.concat([
    decipher.update(file.subarray(at + 28)),
    decipher.final(),
  ]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, input, output] = process.argv.slice(2);
  const keyFlag = process.argv.indexOf("--key");
  if (command === "encrypt" && input && output) {
    const publicKey = process.env.BACKUP_PUBLIC_KEY;
    if (!publicKey) throw new Error("BACKUP_PUBLIC_KEY is not set");
    writeFileSync(output, encrypt(readFileSync(input), publicKey));
  } else if (command === "decrypt" && input && output) {
    const keyFile = keyFlag > 0 ? process.argv[keyFlag + 1] : DEFAULT_KEY_FILE;
    writeFileSync(output, decrypt(readFileSync(input), readFileSync(keyFile)));
    console.log(`✓ Decrypted to ${output}`);
  } else {
    console.error(
      "Usage: node scripts/backup/crypt.mjs encrypt <dump> <out.enc>\n" +
        "       node scripts/backup/crypt.mjs decrypt <file.enc> <out.dump> [--key <file>]",
    );
    process.exit(1);
  }
}
