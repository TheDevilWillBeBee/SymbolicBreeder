# Database Management

All commands assume you are in the `backend/` directory with `DATABASE_URL` exported.

## Environment setup

Local:

```bash
cd backend
export DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname
```

Production (via Vercel):

```bash
cd backend
set -a
source ../.env.vercel
set +a
export DATABASE_URL="${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}"
```

## Applying migrations

```bash
alembic upgrade head
```

This runs all pending migrations in order.

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Authenticated users | `id`, `external_id`, `email`, `display_name` |
| `sessions` | Breeding sessions | `id`, `name`, `modality`, `context_profile`, `owner_user_id` |
| `programs` | Individual program variants | `id`, `code`, `modality`, `generation`, `parent_ids` (JSON), `session_id`, `creator_user_id` |
| `shared_programs` | Publicly shared snapshots of programs | `id`, `program_id` (FK to programs), `sharer_name`, `modality`, `code`, `lineage` (JSON), `llm_model` |
| `program_reactions` | User upvotes/downvotes on programs | `id`, `user_id`, `program_id`, `reaction` (-1 or 1), unique per user+program |

All tables have `created_at` timestamps. `users` and `program_reactions` also have `updated_at`.

## Clearing a single table

Delete all rows but keep the table structure:

```bash
psql "$DATABASE_URL" -c "DELETE FROM shared_programs;"
```

Or, for faster deletion (resets sequences, requires no FK references pointing in):

```bash
psql "$DATABASE_URL" -c "TRUNCATE TABLE shared_programs;"
```

To truncate a table that other tables reference via foreign keys, cascade:

```bash
psql "$DATABASE_URL" -c "TRUNCATE TABLE programs CASCADE;"
```

This will also clear rows in `shared_programs` and `program_reactions` that reference `programs`.

## Resetting the entire database

Roll back all migrations, then re-apply:

```bash
alembic downgrade base
alembic upgrade head
```

This drops and recreates all tables. All data is lost.

## Migration: Adding context_profile (v0003)

Migration `20260318_0003` adds a `context_profile` column to `sessions`. To apply:

```bash
cd backend
alembic upgrade head
```

If running on Vercel Postgres and you prefer to apply SQL directly:

```sql
ALTER TABLE sessions ADD COLUMN context_profile VARCHAR DEFAULT 'intermediate';
```

## Checking migration state

See which migration the database is currently on:

```bash
alembic current
```

See the full migration history and which revisions have been applied:

```bash
alembic history --verbose
```
