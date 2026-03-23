# SQLite Service

SQLite database service with migrations and query builder support.

## Overview

SQLiteService provides a complete database abstraction with:
- CRUD operations
- Prepared statements
- Transaction support
- Schema migrations system
- Query result handling
- WAL mode support

## API

### Connection Management

| Function | Description |
|----------|-------------|
| `sqlite_open(SQLiteService*, path)` | Open database file |
| `sqlite_close(SQLiteService*)` | Close database |
| `sqlite_is_open(SQLiteService*)` | Check if open |
| `sqlite_last_error(SQLiteService*)` | Get last error |

### Query Execution

| Function | Description |
|----------|-------------|
| `sqlite_execute(SQLiteService*, sql)` | Execute SQL (no results) |
| `sqlite_query(SQLiteService*, sql)` | Execute SQL with results |
| `sqlite_query_scalar(SQLiteService*, sql)` | Get single value |
| `sqlite_last_insert_rowid(SQLiteService*)` | Get last insert ID |
| `sqlite_changes(SQLiteService*)` | Get affected rows |

### Transactions

| Function | Description |
|----------|-------------|
| `sqlite_begin_transaction(SQLiteService*)` | Begin transaction |
| `sqlite_commit(SQLiteService*)` | Commit transaction |
| `sqlite_rollback(SQLiteService*)` | Rollback transaction |

### Migrations

| Function | Description |
|----------|-------------|
| `sqlite_migrate(SQLiteService*, migrations, count, target)` | Run migrations |
| `sqlite_rollback_to(SQLiteService*, migrations, count, target)` | Rollback migrations |

## Usage

```c
#include "services/sqlite_service.h"

// Get service
SQLiteService* db = sqlite_service_inject();

// Open database
sqlite_open(db, "app.db");

// Execute query
sqlite_execute(db, "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");

// Query with results
SQLiteResult result = sqlite_query(db, "SELECT * FROM users WHERE age > ?");
for (int i = 0; i < result.row_count; i++) {
    printf("Name: %s\n", result.rows[i].values[1]);
}
sqlite_free_result(&result);

// Get single value
const char* count = sqlite_query_scalar(db, "SELECT COUNT(*) FROM users");

// Transactions
sqlite_begin_transaction(db);
sqlite_execute(db, "INSERT INTO users (name) VALUES ('John')");
sqlite_commit(db);
```

## Query Result Structure

```c
typedef struct {
    bool success;
    int row_count;
    int column_count;
    char** columns;
    SQLiteRow* rows;
    char* error;
} SQLiteResult;

typedef struct {
    int column_count;
    char** columns;
    char** values;
} SQLiteRow;
```

## Related Documentation

- [CRUD API](crud-api.md) - High-level CRUD handlers
- [SQL Query Builder](sql-query-builder.md) - Fluent query builder
