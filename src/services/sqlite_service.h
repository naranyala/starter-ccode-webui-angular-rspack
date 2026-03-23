/* SQLite Service - Database operations with migrations */

#ifndef SQLITE_SERVICE_H
#define SQLITE_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <stddef.h>

/* Forward declaration of sqlite3 structures */
typedef struct sqlite3 sqlite3;
typedef struct sqlite3_stmt sqlite3_stmt;

/* Maximum parameters in a query */
#define SQLITE_MAX_PARAMS 100

/* Migration function type */
typedef int (*sqlite_migration_fn)(sqlite3* db, void* user_data);

/* Migration definition */
typedef struct {
    int version;
    const char* name;
    sqlite_migration_fn up;
    sqlite_migration_fn down;
} SQLiteMigration;

/* Query result row */
typedef struct {
    char** columns;      /* Column names */
    char** values;       /* Column values */
    int column_count;    /* Number of columns */
} SQLiteRow;

/* Query result */
typedef struct {
    SQLiteRow* rows;     /* Array of rows */
    int row_count;       /* Number of rows */
    int column_count;    /* Number of columns */
    char** columns;      /* Column names */
    char* error;         /* Error message if failed */
    int success;         /* 1 if success, 0 if failure */
} SQLiteResult;

/* Database configuration */
typedef struct {
    const char* path;           /* Database file path */
    int flags;                  /* SQLite open flags */
    const char* vfs;            /* VFS name (NULL for default) */
    int enable_foreign_keys;    /* Enable foreign key constraints */
    int enable_wal;             /* Enable WAL mode */
    int timeout_ms;             /* Busy timeout in milliseconds */
} SQLiteConfig;

typedef struct SQLiteService {
    DI_Service base;
    sqlite3* db;                /* Database connection */
    char* db_path;              /* Database file path */
    char* error;                /* Last error message */
    int current_version;        /* Current schema version */
    int is_open;                /* Connection status */
} SQLiteService;

/* Forward declarations for DI system */
DI_Error sqlite_service_provider(DI_Container* container, void** out_service);
void sqlite_service_destroy(DI_Service* service);

/* Accessor function */
SQLiteService* sqlite_service_inject(void);

/* ==================== Connection Management ==================== */

/**
 * Open database connection with default settings
 * @param self SQLite service instance
 * @param path Path to database file (":memory:" for in-memory)
 * @return 1 on success, 0 on failure
 */
int sqlite_open(SQLiteService* self, const char* path);

/**
 * Open database connection with custom configuration
 * @param self SQLite service instance
 * @param config Database configuration
 * @return 1 on success, 0 on failure
 */
int sqlite_open_config(SQLiteService* self, const SQLiteConfig* config);

/**
 * Close database connection
 * @param self SQLite service instance
 * @return 1 on success, 0 on failure
 */
int sqlite_close(SQLiteService* self);

/**
 * Check if database is open
 * @param self SQLite service instance
 * @return 1 if open, 0 if closed
 */
int sqlite_is_open(SQLiteService* self);

/**
 * Get last error message
 * @param self SQLite service instance
 * @return Error message string
 */
const char* sqlite_last_error(SQLiteService* self);

/* ==================== Query Execution ==================== */

/**
 * Execute a SQL statement (no results)
 * @param self SQLite service instance
 * @param sql SQL statement to execute
 * @return 1 on success, 0 on failure
 */
int sqlite_execute(SQLiteService* self, const char* sql);

/**
 * Execute a SQL statement with parameters
 * @param self SQLite service instance
 * @param sql SQL statement with ? placeholders
 * @param params Array of parameter values (NULL for NULL)
 * @param param_count Number of parameters
 * @return 1 on success, 0 on failure
 */
int sqlite_execute_params(SQLiteService* self, const char* sql, const char** params, int param_count);

/**
 * Execute a query and return results
 * @param self SQLite service instance
 * @param sql SQL SELECT statement
 * @return SQLiteResult with rows (must be freed with sqlite_free_result)
 */
SQLiteResult sqlite_query(SQLiteService* self, const char* sql);

/**
 * Execute a query with parameters and return results
 * @param self SQLite service instance
 * @param sql SQL SELECT statement with ? placeholders
 * @param params Array of parameter values
 * @param param_count Number of parameters
 * @return SQLiteResult with rows (must be freed with sqlite_free_result)
 */
SQLiteResult sqlite_query_params(SQLiteService* self, const char* sql, const char** params, int param_count);

/**
 * Execute a query and return single row
 * @param self SQLite service instance
 * @param sql SQL SELECT statement
 * @return SQLiteResult with 0 or 1 row
 */
SQLiteResult sqlite_query_one(SQLiteService* self, const char* sql);

/**
 * Execute a query and return single value
 * @param self SQLite service instance
 * @param sql SQL SELECT statement
 * @return First column of first row, or NULL
 */
const char* sqlite_query_scalar(SQLiteService* self, const char* sql);

/**
 * Free query result
 * @param result Result to free
 */
void sqlite_free_result(SQLiteResult* result);

/* ==================== Prepared Statements ==================== */

/**
 * Prepare a SQL statement
 * @param self SQLite service instance
 * @param sql SQL statement to prepare
 * @return Prepared statement handle, or NULL on failure
 */
sqlite3_stmt* sqlite_prepare(SQLiteService* self, const char* sql);

/**
 * Bind text parameter to prepared statement
 * @param stmt Prepared statement
 * @param index Parameter index (1-based)
 * @param value Value to bind (NULL for NULL)
 * @return 1 on success, 0 on failure
 */
int sqlite_bind_text(sqlite3_stmt* stmt, int index, const char* value);

/**
 * Bind integer parameter to prepared statement
 * @param stmt Prepared statement
 * @param index Parameter index (1-based)
 * @param value Value to bind
 * @return 1 on success, 0 on failure
 */
int sqlite_bind_int(sqlite3_stmt* stmt, int index, int value);

/**
 * Bind double parameter to prepared statement
 * @param stmt Prepared statement
 * @param index Parameter index (1-based)
 * @param value Value to bind
 * @return 1 on success, 0 on failure
 */
int sqlite_bind_double(sqlite3_stmt* stmt, int index, double value);

/**
 * Execute prepared statement (no results)
 * @param self SQLite service instance
 * @param stmt Prepared statement
 * @return 1 on success, 0 on failure
 */
int sqlite_step_execute(sqlite3_stmt* stmt);

/**
 * Execute prepared statement and get one row
 * @param self SQLite service instance
 * @param stmt Prepared statement
 * @return SQLiteResult with 0 or 1 row
 */
SQLiteResult sqlite_step_query(SQLiteService* self, sqlite3_stmt* stmt);

/**
 * Finalize prepared statement
 * @param stmt Prepared statement
 * @return 1 on success, 0 on failure
 */
int sqlite_finalize(sqlite3_stmt* stmt);

/* ==================== Transactions ==================== */

/**
 * Begin a transaction
 * @param self SQLite service instance
 * @return 1 on success, 0 on failure
 */
int sqlite_begin_transaction(SQLiteService* self);

/**
 * Commit a transaction
 * @param self SQLite service instance
 * @return 1 on success, 0 on failure
 */
int sqlite_commit(SQLiteService* self);

/**
 * Rollback a transaction
 * @param self SQLite service instance
 * @return 1 on success, 0 on failure
 */
int sqlite_rollback(SQLiteService* self);

/**
 * Execute within a transaction (auto commit/rollback)
 * @param self SQLite service instance
 * @param fn Function to execute
 * @param user_data User data to pass to function
 * @return 1 on success (committed), 0 on failure (rolled back)
 */
int sqlite_transaction(SQLiteService* self, int (*fn)(sqlite3* db, void* user_data), void* user_data);

/* ==================== Migrations ==================== */

/**
 * Initialize migrations table
 * @param self SQLite service instance
 * @return 1 on success, 0 on failure
 */
int sqlite_migrations_init(SQLiteService* self);

/**
 * Get current schema version
 * @param self SQLite service instance
 * @return Current version number, or -1 on error
 */
int sqlite_get_version(SQLiteService* self);

/**
 * Run migrations up to target version
 * @param self SQLite service instance
 * @param migrations Array of migrations
 * @param migration_count Number of migrations
 * @param target_version Target version (-1 for latest)
 * @return 1 on success, 0 on failure
 */
int sqlite_migrate(SQLiteService* self, const SQLiteMigration* migrations, int migration_count, int target_version);

/**
 * Rollback migrations to target version
 * @param self SQLite service instance
 * @param migrations Array of migrations
 * @param migration_count Number of migrations
 * @param target_version Target version (0 for empty)
 * @return 1 on success, 0 on failure
 */
int sqlite_rollback_to(SQLiteService* self, const SQLiteMigration* migrations, int migration_count, int target_version);

/* ==================== Utility Functions ==================== */

/**
 * Escape a string for safe use in SQL
 * @param self SQLite service instance
 * @param input String to escape
 * @return Escaped string (must be freed)
 */
char* sqlite_escape_string(SQLiteService* self, const char* input);

/**
 * Get last inserted row ID
 * @param self SQLite service instance
 * @return Row ID, or -1 on error
 */
long long sqlite_last_insert_rowid(SQLiteService* self);

/**
 * Get number of rows affected by last operation
 * @param self SQLite service instance
 * @return Number of rows affected
 */
int sqlite_changes(SQLiteService* self);

/**
 * Vacuum the database
 * @param self SQLite service instance
 * @return 1 on success, 0 on failure
 */
int sqlite_vacuum(SQLiteService* self);

/**
 * Run integrity check
 * @param self SQLite service instance
 * @return SQLiteResult with check results
 */
SQLiteResult sqlite_integrity_check(SQLiteService* self);

/* ==================== Persistence Functions ==================== */

/**
 * Get database file path
 * @param self SQLite service instance
 * @return Database path, or NULL
 */
const char* sqlite_get_path(SQLiteService* self);

/**
 * Checkpoint WAL file (flush to main database)
 * @param self SQLite service instance
 * @param aggressive If true, use TRUNCATE mode
 * @return 1 on success, 0 on failure
 */
int sqlite_checkpoint(SQLiteService* self, int aggressive);

/**
 * Backup database to file
 * @param self SQLite service instance
 * @param backup_path Path for backup file
 * @return 1 on success, 0 on failure
 */
int sqlite_backup_to_file(SQLiteService* self, const char* backup_path);

/**
 * Restore database from backup
 * @param self SQLite service instance
 * @param backup_path Path to backup file
 * @return 1 on success, 0 on failure
 */
int sqlite_restore_from_backup(SQLiteService* self, const char* backup_path);

/**
 * Get database file size
 * @param self SQLite service instance
 * @return Size in bytes, or -1 on error
 */
long long sqlite_get_file_size(SQLiteService* self);

/**
 * Get WAL file size
 * @param self SQLite service instance
 * @return Size in bytes, or -1 if no WAL
 */
long long sqlite_get_wal_size(SQLiteService* self);

/**
 * Get database status info
 * @param self SQLite service instance
 * @param page_count Output: number of pages
 * @param freelist_count Output: free pages
 * @param schema_version Output: schema version
 */
void sqlite_get_status(SQLiteService* self, int* page_count, int* freelist_count, int* schema_version);

#endif /* SQLITE_SERVICE_H */
