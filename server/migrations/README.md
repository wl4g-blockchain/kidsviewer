# Database Migrations

This directory contains database migration files for the KidsViewer Server.

## Directory Structure

```
migrations/
├── postgres/
│   └── 20250926/
│       ├── 01_init.ddl.sql    # DDL (Data Definition Language) migrations
│       └── 02_init.dml.sql    # DML (Data Manipulation Language) migrations
├── sqlite/
│   └── 20250926/
│       ├── 01_init.ddl.sql    # DDL (Data Definition Language) migrations
│       └── 02_init.dml.sql    # DML (Data Manipulation Language) migrations
└── README.md
```

## Migration Naming Convention

- **Version**: `YYYYMMDD` format (e.g., `20250926`)
- **Type**: 
  - `ddl` - Data Definition Language (CREATE, ALTER, DROP statements)
  - `dml` - Data Manipulation Language (INSERT, UPDATE, DELETE statements)
- **Filename**: `{sequence}_{description}.{type}.sql`

## Migration Commands

### Run All Pending Migrations
```bash
./kidsviewer-server migrate up
```

### Check Migration Status
```bash
./kidsviewer-server migrate status
```

## Migration Execution Order

1. Migrations are executed in version order (ascending)
2. Within the same version, DDL migrations run before DML migrations
3. Migrations are tracked in the `schema_migrations` table

## Creating New Migrations

1. Create a new version directory (e.g., `20250927`)
2. Add DDL files for schema changes (e.g., `01_add_new_table.ddl.sql`)
3. Add DML files for data changes (e.g., `02_seed_new_data.dml.sql`)
4. Run migrations: `./kidsviewer-server migrate up`

## Database Support

- **PostgreSQL**: Full support with JSONB columns and advanced features
- **SQLite**: Full support with JSON stored as TEXT

## Migration Tracking

The system automatically tracks applied migrations in the `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    type VARCHAR(10) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Best Practices

1. **Always backup** your database before running migrations in production
2. **Test migrations** on a copy of production data first
3. **Use transactions** for complex migrations (handled automatically)
4. **Version your migrations** with meaningful dates
5. **Separate DDL and DML** into different files for better organization
6. **Use IF NOT EXISTS** for DDL statements to make migrations idempotent
7. **Use INSERT OR IGNORE** for SQLite and **ON CONFLICT DO NOTHING** for PostgreSQL for DML statements
