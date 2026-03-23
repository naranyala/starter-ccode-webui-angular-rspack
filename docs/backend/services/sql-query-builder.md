# SQL Query Builder

Fluent SQL query builder for SQLite.

## Overview

The SQL Query Builder provides a chainable API for building SQL queries with automatic escaping.

## API

### Query Building

| Method | Description |
|--------|-------------|
| `sql_select(const char* table)` | Start SELECT query |
| `sql_insert(const char* table)` | Start INSERT query |
| `sql_update(const char* table)` | Start UPDATE query |
| `sql_delete(const char* table)` | Start DELETE query |

### Clause Methods

| Method | Description |
|--------|-------------|
| `columns(char* cols, ...)` | SELECT columns |
| `where(const char* cond)` | WHERE clause |
| `wheref(const char* fmt, ...)` | WHERE with formatting |
| `order_by(const char* col)` | ORDER BY clause |
| `limit(int count)` | LIMIT clause |
| `offset(int count)` | OFFSET clause |
| `values(char* cols, ...)` | INSERT/UPDATE values |

### Execution

| Method | Description |
|--------|-------------|
| `execute(SQLiteService*)` | Execute query |
| `query(SQLiteService*)` | Execute with results |

## Usage

### SELECT

```c
#include "services/sql_query_builder.h"

// Simple select
SQLQuery* q = sql_select("users")
    ->columns("id", "name", "email", NULL)
    ->order_by("name")
    ->limit(10);

SQLiteResult* result = q->query(db);
for (int i = 0; i < result->row_count; i++) {
    printf("User: %s\n", result->rows[i].values[1]);
}
sql_query_free(q);
```

### INSERT

```c
sql_insert("users")
    ->values("name", "email", "age", NULL)
    ->execute(db);
```

### UPDATE

```c
sql_update("users")
    ->values("name", "John", "age", "30", NULL)
    ->wheref("id = %d", user_id)
    ->execute(db);
```

### DELETE

```c
sql_delete("users")
    ->wheref("id = %d", user_id)
    ->execute(db);
```

## Automatic Escaping

The query builder automatically escapes values:

```c
// Safe - no SQL injection
sql_select("users")
    ->wheref("name = %s", user_input)  // Properly escaped
```

## Related Documentation

- [SQLite Service](sqlite.md) - Database operations
