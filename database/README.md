# FoodBridge database

PostgreSQL schema and fictional development fixtures for FoodBridge. These scripts do not drop tables, truncate data, or overwrite existing rows.

## Requirements

- PostgreSQL 14 or newer
- `psql` available on `PATH`

## Create and populate a development database

Run these commands from the repository root. Choose a new database name ending in `_dev`; do not point the seed script at a production or shared database.

```powershell
createdb -U postgres foodbridge_dev
psql -U postgres -d foodbridge_dev -v ON_ERROR_STOP=1 -f database/schema.sql
psql -U postgres -d foodbridge_dev -v ON_ERROR_STOP=1 -f database/seed.sql
```

`createdb` fails if the name already exists, so these steps do not replace an existing database. The schema script creates the tables and indexes; run it before the seed script. The seed uses inserts only and can be re-run without duplicating its sample users, donations, pickup requests, history, or notification.

To confirm the objects and sample row counts:

```powershell
psql -U postgres -d foodbridge_dev -c "\dt"
psql -U postgres -d foodbridge_dev -c "SELECT role, count(*) FROM users GROUP BY role ORDER BY role;"
psql -U postgres -d foodbridge_dev -c "SELECT status, count(*) FROM donations GROUP BY status ORDER BY status;"
psql -U postgres -d foodbridge_dev -c "SELECT status, count(*) FROM pickup_requests GROUP BY status ORDER BY status;"
```

## Development fixtures and passwords

`seed.sql` creates three explicitly named development accounts:

- `foodbridge.dev.donor@example.invalid` — donor
- `foodbridge.dev.ngo@example.invalid` — verified NGO user
- `foodbridge.dev.volunteer@example.invalid` — volunteer

All fixture names are synthetic, emails use the reserved `.invalid` domain, phone values are null, and pickup locations are fictional placeholders. No real personal information is included.

Each account has a valid bcrypt hash generated from random bytes that were discarded and are not included in the repository. No sample plaintext password is stored or provided; the seeded accounts cannot be used to log in until a developer resets their passwords through a local-only flow. Do not use these fixtures or this schema as a substitute for production credentials or deployment review.

## Schema and backend contract

The schema follows the approved database design in the repository's `DATABASE_DESIGN.md`. That design records the backend mapping considerations, including NGO profile separation, `requested_at`, donor lookup through the donation, typed notification references, and the pickup status lifecycle. Coordinate any backend changes against that document before using this schema in an application environment.
