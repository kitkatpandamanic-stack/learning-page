#!/usr/bin/env bash
# The nightly database backup (.github/workflows/backup.yml):
#  1. dumps the database with a read-only role (BACKUP_DATABASE_URL),
#  2. restores the dump into an empty PostgreSQL (RESTORE_URL) and checks that
#     every table came back with its rows: a backup that can't be restored
#     is no backup,
#  3. encrypts it with your public key (BACKUP_PUBLIC_KEY) into backup/.
# Nothing here prints a password or a row of data.
set -euo pipefail
: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is not set (node scripts/backup/setup.mjs)}"
: "${BACKUP_PUBLIC_KEY:?BACKUP_PUBLIC_KEY is not set (node scripts/backup/setup.mjs)}"
: "${RESTORE_URL:?RESTORE_URL is not set}"

day=$(date -u +%F)
mkdir -p backup
dump=$(mktemp)
trap 'rm -f "$dump"' EXIT

# "schema.table rows" for every table, sorted
counts() {
  local url=$1
  psql "$url" -Atq -v ON_ERROR_STOP=1 -c "
    select format('%I.%I', schemaname, relname)
    from pg_stat_user_tables order by 1" |
    while read -r table; do
      printf '%s %s\n' "$table" "$(psql "$url" -Atq -v ON_ERROR_STOP=1 -c "select count(*) from $table")"
    done
}

before=$(counts "$BACKUP_DATABASE_URL")
pg_dump --format=custom --no-owner --no-acl --dbname="$BACKUP_DATABASE_URL" --file="$dump"
after=$(counts "$BACKUP_DATABASE_URL")

# Restore drill. Neon-only settings may print warnings; the row check decides.
pg_restore --no-owner --no-acl --dbname="$RESTORE_URL" "$dump" ||
  echo "::warning::pg_restore reported errors; checking rows anyway"
restored=$(counts "$RESTORE_URL")

failed=0
tables=0
rows=0
while read -r table n_before; do
  n_after=$(awk -v t="$table" '$1 == t { print $2 }' <<<"$after")
  n_restored=$(awk -v t="$table" '$1 == t { print $2 }' <<<"$restored")
  low=$(( n_before < n_after ? n_before : n_after ))
  high=$(( n_before > n_after ? n_before : n_after ))
  # Rows may come and go while the dump runs: anything in between is right.
  if [ -z "$n_restored" ] || [ "$n_restored" -lt "$low" ] || [ "$n_restored" -gt "$high" ]; then
    echo "::error::$table: ${n_restored:-missing} rows restored, expected $low–$high"
    failed=1
  fi
  tables=$((tables + 1))
  rows=$((rows + ${n_restored:-0}))
done <<<"$before"
[ "$failed" = 0 ] || { echo "The restore check failed: not keeping this backup."; exit 1; }

out="backup/pandadev-db-$day.dump.enc"
node scripts/backup/crypt.mjs encrypt "$dump" "$out"
size=$(wc -c <"$out" | tr -d ' ')
echo "✓ $tables tables, $rows rows, restored and checked; $out ($size bytes)"
{
  echo "### Database backup $day"
  echo "- $tables tables, $rows rows: restored into an empty database and checked"
  echo "- Encrypted file: $size bytes, kept 30 days"
} >>"${GITHUB_STEP_SUMMARY:-/dev/null}"
