# Database backups

Every night `.github/workflows/backup.yml` dumps the Neon database with a
read-only role, restores the dump into an empty PostgreSQL to check that every
table comes back with its rows, encrypts it with your public key and keeps it
for 30 days as a workflow artifact. `/admin/health` shows when the last backup
succeeded.

The repository is public, so anyone signed in to GitHub can download the
artifacts: that's why they're encrypted. Only your private key opens them.

## Set up (once)

```sh
node scripts/backup/setup.mjs
```

Then keep a copy of `~/.pandadev/backup-private-key.pem` somewhere safe besides
your computer (a password manager or a USB stick). Without it no backup can be
opened. Run the script again to give the backup role a new password; it keeps
your key.

## Restore

1. GitHub → Actions → **Backup** → the run you want → **Artifacts** →
   download `pandadev-db-backup` and unzip it.
2. Decrypt it (needs your private key):

   ```sh
   node scripts/backup/crypt.mjs decrypt pandadev-db-2026-10-12.dump.enc pandadev.dump
   ```

3. Restore it with PostgreSQL 18's `pg_restore`. Into a **new** Neon branch or
   database first, never straight over the live one:

   ```sh
   pg_restore --no-owner --no-acl --dbname "<connection string of the new database>" pandadev.dump
   ```

4. Check the data there, then point `DATABASE_URL` (Vercel and `.env.local`)
   at it, or copy the tables you need back.

The decrypted `pandadev.dump` holds every learner's data: delete it when you're
done.
