<#
PowerShell automation script: backup_and_apply_migration.ps1

What it does (interactive):
- Prompts for Supabase/Postgres connection string (keeps creds out of script)
- Creates timestamped backup directory under D:\Nishchal\backups
- Runs pg_dump (custom format + plain SQL)
- Zips backend server folder
- Shows migration file and asks confirmation before applying
- Optionally applies migration via psql
- Writes a log file with the operations

IMPORTANT: This script executes destructive operations if you confirm. Review outputs before proceeding.
#>

param(
    [switch]$ApplyMigration  # pass -ApplyMigration to automatically apply migration after backing up
)

function Read-SecureConnectionString {
    Write-Host "Enter your Postgres connection string (postgresql://user:pass@host:port/db):" -ForegroundColor Yellow
    $conn = Read-Host
    return $conn
}

# Defaults
$timestamp = Get-Date -Format yyyyMMdd_HHmmss
$backupRoot = "D:\Nishchal\backups"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

# Project paths (adjust if needed)
$projectRoot = "D:\Nishchal\Coding Projects\Club Cult 2.0"
$backendDir = Join-Path $projectRoot "server"
$migrationFile = Join-Path $projectRoot "supabase\migrations\20251207_fix_concurrency_and_realtime.sql"

$dumpFile = Join-Path $backupRoot "supabase_db_$timestamp.dump"
$sqlFile  = Join-Path $backupRoot "supabase_sql_$timestamp.sql"
$zipDest  = Join-Path $backupRoot "clubcult_backend_$timestamp.zip"
$logFile  = Join-Path $backupRoot "backup_log_$timestamp.txt"

Write-Host "Backups will be saved to: $backupRoot" -ForegroundColor Cyan

# Get connection string
$conn = Read-SecureConnectionString
if ([string]::IsNullOrWhiteSpace($conn)) {
    Write-Error "Connection string is required. Aborting."
    exit 1
}

# Test pg_dump availability
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Warning "pg_dump not found in PATH. Please install PostgreSQL client tools or add pg_dump to PATH. Aborting."
    exit 1
}

# Run pg_dump (custom format)
Write-Host "Creating custom-format dump: $dumpFile" -ForegroundColor Green
$pgDumpCmd = "pg_dump `"$conn`" -Fc -f `"$dumpFile`""
Write-Host $pgDumpCmd
$pgDumpResult = & pg_dump $conn -Fc -f $dumpFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump failed:`n$pgDumpResult"
    exit 1
}
Add-Content -Path $logFile -Value "[$(Get-Date)] Created custom dump: $dumpFile"

# Plain SQL dump
Write-Host "Creating plain SQL dump: $sqlFile" -ForegroundColor Green
$pgDumpPlainResult = & pg_dump $conn -f $sqlFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Plain SQL dump failed (non-fatal):`n$pgDumpPlainResult"
} else {
    Add-Content -Path $logFile -Value "[$(Get-Date)] Created SQL dump: $sqlFile"
}

# Zip backend
if (Test-Path $backendDir) {
    Write-Host "Zipping backend: $backendDir -> $zipDest" -ForegroundColor Green
    Compress-Archive -Path "$backendDir\*" -DestinationPath $zipDest -Force
    Add-Content -Path $logFile -Value "[$(Get-Date)] Zipped backend: $zipDest"
} else {
    Write-Warning "Backend folder not found at $backendDir. Skipping zip."
    Add-Content -Path $logFile -Value "[$(Get-Date)] Backend folder not found: $backendDir"
}

# Show migration file and confirm
if (-not (Test-Path $migrationFile)) {
    Write-Warning "Migration file not found at $migrationFile. Skipping migration apply step."
    Add-Content -Path $logFile -Value "[$(Get-Date)] Migration file not found: $migrationFile"
    exit 0
}

Write-Host "Migration file found: $migrationFile" -ForegroundColor Cyan
Write-Host "----- Begin migration preview -----" -ForegroundColor DarkCyan
Get-Content $migrationFile -TotalCount 200 | ForEach-Object { Write-Host $_ }
Write-Host "----- End preview -----" -ForegroundColor DarkCyan

if (-not $ApplyMigration) {
    $confirm = Read-Host "Apply migration now? Type 'APPLY' to proceed (or anything else to skip)"
    if ($confirm -ne 'APPLY') {
        Write-Host "Migration not applied. You can run this script again with -ApplyMigration to apply." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "[$(Get-Date)] Migration skipped by user."
        exit 0
    }
}

# Apply migration via psql
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Warning "psql not found in PATH. Please install PostgreSQL client tools or add psql to PATH. Aborting migration apply."
    Add-Content -Path $logFile -Value "[$(Get-Date)] psql not found. Migration not applied."
    exit 1
}

Write-Host "Applying migration file via psql..." -ForegroundColor Green
$psqlOutput = & psql $conn -f $migrationFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Migration failed:`n$psqlOutput"
    Add-Content -Path $logFile -Value "[$(Get-Date)] Migration failed: $psqlOutput"
    exit 1
}

Add-Content -Path $logFile -Value "[$(Get-Date)] Migration applied successfully: $migrationFile"
Write-Host "Migration applied successfully." -ForegroundColor Green
Write-Host "Log written to: $logFile" -ForegroundColor Cyan

exit 0
