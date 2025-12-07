Backup and Migration helper

This folder contains `backup_and_apply_migration.ps1`, a PowerShell script to help you safely back up your Supabase/Postgres database and optionally apply a migration.

Usage (local):
1. Open PowerShell and run:
   ```powershell
   cd "D:\Nishchal\Coding Projects\Club Cult 2.0\scripts"
   .\backup_and_apply_migration.ps1
   ```
2. When prompted, paste your Supabase Postgres connection string (format: `postgresql://user:pass@host:port/db`).
3. The script will create a timestamped folder under `D:\Nishchal\backups` and save:
   - A custom-format dump (`.dump`) usable with `pg_restore`
   - A plain `.sql` dump (optional)
   - A zip of the backend server folder
   - A log file of operations
4. The script shows a preview of the migration file. You must explicitly confirm (`APPLY`) to run the migration.

Safety notes:
- The script requires `pg_dump` and `psql` in your PATH. Install PostgreSQL client tools if not present.
- Review the migration file before applying.
- The script does not send credentials anywhere; you are prompted interactively.

If you want, I can add a CI workflow or encrypt backups to cloud storage — tell me where you want them stored (AWS S3, Azure, etc.).