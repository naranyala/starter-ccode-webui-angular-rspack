# DuckDB Service

DuckDB integration for analytical queries.

## Overview

DuckDBService provides access to DuckDB, a column-oriented OLAP database optimized for analytical workloads.

## API

### Connection

| Function | Description |
|----------|-------------|
| `duckdb_open(DuckDBService*, path)` | Open database |
| `duckdb_close(DuckDBService*)` | Close database |
| `duckdb_execute(DuckDBService*, sql)` | Execute SQL |
| `duckdb_query(DuckDBService*, sql)` | Execute with results |

## Usage

```c
#include "services/duckdb_service.h"

// Get service
DuckDBService* db = duckdb_service_inject();

// Open database
duckdb_open(db, "analytics.db");

// Analytical query
DuckDBResult* result = duckdb_query(db, 
    "SELECT category, SUM(amount) as total "
    "FROM transactions "
    "GROUP BY category "
    "ORDER BY total DESC");

for (int i = 0; i < result->row_count; i++) {
    printf("Category: %s, Total: %s\n",
        result->rows[i].values[0],
        result->rows[i].values[1]);
}

duckdb_free_result(result);
duckdb_close(db);
```

## When to Use

| Scenario | Database |
|----------|----------|
| Transactional (OLTP) | SQLite |
| Analytical (OLAP) | DuckDB |
| Simple queries | Either |
| Complex aggregations | DuckDB |

## Related Documentation

- [SQLite Service](sqlite.md) - Transactional database
- ../DUCKDB_INTEGRATION.md - DuckDB setup
- ../DUCKDB_QUERY_BUILDER.md - Query builder
