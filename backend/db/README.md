Database migrations

This folder contains SQL migrations (currently `migrations/001_create_schema.sql`) that create the core schema: `users`, `locations`, `listings`, `images`, and `favorites`.

Run the migration using `psql` or your preferred Postgres client.

1) Run with `psql` (PowerShell / Windows)

```powershell
# ensure environment variables are set or use connection params
$env:PGHOST='localhost'
$env:PGPORT='5432'
$env:PGUSER='your_db_user'
$env:PGPASSWORD='your_db_password'
$env:PGDATABASE='your_db_name'

psql "host=$env:PGHOST port=$env:PGPORT user=$env:PGUSER dbname=$env:PGDATABASE" -f migrations/001_create_schema.sql
```

2) Run with a connection string

```powershell
psql "postgres://user:password@localhost:5432/dbname" -f migrations/001_create_schema.sql
```

Quick verification using `psql`:

```powershell
psql "host=localhost port=5432 user=your_db_user dbname=your_db_name" -c "\dt"
```

Notes:
- The migration file is idempotent (`IF NOT EXISTS`) and wrapped in a transaction.
- The backend's `src/db/index.js` reads connection values from the environment variables shown in `backend/.env.example`.
- If port 5432 is already in use on your machine, update `PGPORT` in `.env` or stop the conflicting service.