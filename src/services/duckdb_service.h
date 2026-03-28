/* DuckDB Service - Database operations with DuckDB */

#ifndef DUCKDB_SERVICE_H
#define DUCKDB_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <stddef.h>

/* Forward declaration of duckdb structures */
typedef struct duckdb_database *duckdb_database;
typedef struct duckdb_connection *duckdb_connection;
typedef struct duckdb_result *duckdb_result;
typedef struct duckdb_prepared_statement *duckdb_prepared_statement;

/* Query result row */
typedef struct {
    char** columns;      /* Column names */
    char** values;       /* Column values */
    int column_count;    /* Number of columns */
} DuckDBRow;

/* Query result */
typedef struct {
    DuckDBRow* rows;     /* Array of rows */
    int row_count;       /* Number of rows */
    int column_count;    /* Number of columns */
    char** columns;      /* Column names */
    char* error;         /* Error message if failed */
    int success;         /* 1 if success, 0 if failure */
} DuckDBResult;

/* Database configuration */
typedef struct {
    const char* path;           /* Database file path */
    bool read_only;             /* Read-only mode */
    int max_memory;             /* Max memory in MB */
    int threads;                /* Number of threads */
} DuckDBConfig;

typedef struct DuckDBService {
    DI_Service base;
    duckdb_database db;         /* Database instance */
    duckdb_connection conn;     /* Connection */
    char* db_path;              /* Database file path */
    int is_open;                /* Connection status */
    int max_memory;             /* Max memory setting */
    int threads;                /* Thread count */
} DuckDBService;

DI_DECLARE_SERVICE(DuckDBService, duckdb_service);

/* ==================== Connection Management ==================== */

/**
 * Open DuckDB database with default settings
 * @param self DuckDB service instance
 * @param path Path to database file (":memory:" for in-memory)
 * @return 1 on success, 0 on failure
 */
int duckdb_open(DuckDBService* self, const char* path);

/**
 * Open DuckDB database with custom configuration
 * @param self DuckDB service instance
 * @param config Database configuration
 * @return 1 on success, 0 on failure
 */
int duckdb_open_config(DuckDBService* self, const DuckDBConfig* config);

/**
 * Close DuckDB database
 * @param self DuckDB service instance
 * @return 1 on success, 0 on failure
 */
int duckdb_close(DuckDBService* self);

/**
 * Check if database is open
 * @param self DuckDB service instance
 * @return 1 if open, 0 if closed
 */
int duckdb_is_open(DuckDBService* self);

/**
 * Get last error message
 * @param self DuckDB service instance
 * @return Error message string
 */
const char* duckdb_last_error(DuckDBService* self);

/* ==================== Query Execution ==================== */

/**
 * Execute a SQL statement (no results)
 * @param self DuckDB service instance
 * @param sql SQL statement to execute
 * @return 1 on success, 0 on failure
 */
int duckdb_execute(DuckDBService* self, const char* sql);

/**
 * Execute a query and return results
 * @param self DuckDB service instance
 * @param sql SQL SELECT statement
 * @return DuckDBResult with rows (must be freed with duckdb_free_result)
 */
DuckDBResult duckdb_query(DuckDBService* self, const char* sql);

/**
 * Execute a query and return single row
 * @param self DuckDB service instance
 * @param sql SQL SELECT statement
 * @return DuckDBResult with 0 or 1 row
 */
DuckDBResult duckdb_query_one(DuckDBService* self, const char* sql);

/**
 * Execute a query and return single value
 * @param self DuckDB service instance
 * @param sql SQL SELECT statement
 * @return First column of first row, or NULL
 */
const char* duckdb_query_scalar(DuckDBService* self, const char* sql);

/**
 * Free query result
 * @param result Result to free
 */
void duckdb_free_result(DuckDBResult* result);

/* ==================== Prepared Statements ==================== */

/**
 * Prepare a SQL statement
 * @param self DuckDB service instance
 * @param sql SQL statement to prepare
 * @return Prepared statement handle, or NULL on failure
 */
duckdb_prepared_statement duckdb_prepare(DuckDBService* self, const char* sql);

/**
 * Bind text parameter to prepared statement
 * @param stmt Prepared statement
 * @param index Parameter index (1-based)
 * @param value Value to bind (NULL for NULL)
 * @return 1 on success, 0 on failure
 */
int duckdb_bind_text(duckdb_prepared_statement stmt, int index, const char* value);

/**
 * Bind integer parameter to prepared statement
 * @param stmt Prepared statement
 * @param index Parameter index (1-based)
 * @param value Value to bind
 * @return 1 on success, 0 on failure
 */
int duckdb_bind_int(duckdb_prepared_statement stmt, int index, int value);

/**
 * Execute prepared statement (no results)
 * @param self DuckDB service instance
 * @param stmt Prepared statement
 * @return 1 on success, 0 on failure
 */
int duckdb_step_execute(DuckDBService* self, duckdb_prepared_statement stmt);

/**
 * Execute prepared statement and get results
 * @param self DuckDB service instance
 * @param stmt Prepared statement
 * @return DuckDBResult with rows
 */
DuckDBResult duckdb_step_query(DuckDBService* self, duckdb_prepared_statement stmt);

/**
 * Finalize prepared statement
 * @param stmt Prepared statement
 * @return 1 on success, 0 on failure
 */
int duckdb_finalize(duckdb_prepared_statement stmt);

/* ==================== Transactions ==================== */

/**
 * Begin a transaction
 * @param self DuckDB service instance
 * @return 1 on success, 0 on failure
 */
int duckdb_begin_transaction(DuckDBService* self);

/**
 * Commit a transaction
 * @param self DuckDB service instance
 * @return 1 on success, 0 on failure
 */
int duckdb_commit(DuckDBService* self);

/**
 * Rollback a transaction
 * @param self DuckDB service instance
 * @return 1 on success, 0 on failure
 */
int duckdb_rollback(DuckDBService* self);

/* ==================== Utility Functions ==================== */

/**
 * Get last inserted row ID
 * @param self DuckDB service instance
 * @return Row ID, or -1 on error
 */
long long duckdb_last_insert_rowid(DuckDBService* self);

/**
 * Get number of rows affected by last operation
 * @param self DuckDB service instance
 * @return Number of rows affected
 */
int duckdb_changes(DuckDBService* self);

/**
 * Get database statistics
 * @param self DuckDB service instance
 * @param out_total_rows Output total rows
 * @param out_total_tables Output total tables
 */
void duckdb_get_stats(DuckDBService* self, int* out_total_rows, int* out_total_tables);

#endif /* DUCKDB_SERVICE_H */
