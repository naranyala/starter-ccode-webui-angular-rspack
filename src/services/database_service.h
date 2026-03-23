/* Database Service - Abstraction layer for SQLite and DuckDB */

#ifndef DATABASE_SERVICE_H
#define DATABASE_SERVICE_H

#include <stdbool.h>
#include <stddef.h>

/* Database types */
typedef enum {
    DATABASE_SQLITE,
    DATABASE_DUCKDB
} DatabaseType;

/* Database configuration */
typedef struct {
    DatabaseType type;
    const char* path;
    union {
        struct {
            int flags;
            const char* vfs;
            int enable_foreign_keys;
            int enable_wal;
            int timeout_ms;
        } sqlite;
        struct {
            bool read_only;
            size_t max_memory;  /* MB */
            int threads;
        } duckdb;
    } config;
} DatabaseConfig;

/* Forward declarations */
struct SQLiteService;
struct DuckDBService;
typedef struct SQLiteService SQLiteService;
typedef struct DuckDBService DuckDBService;

/* Database Service */
typedef struct DatabaseService {
    DatabaseType type;
    bool is_open;
    char* error;

    /* SQLite backend */
    SQLiteService* sqlite;
    
    /* DuckDB backend */
    DuckDBService* duckdb;

    /* Methods */
    int (*open)(struct DatabaseService* self, const char* path);
    int (*open_config)(struct DatabaseService* self, const DatabaseConfig* config);
    void (*close)(struct DatabaseService* self);
    bool (*is_connected)(struct DatabaseService* self);
    const char* (*last_error)(struct DatabaseService* self);
    
    /* Query execution */
    int (*execute)(struct DatabaseService* self, const char* sql);
    int (*query)(struct DatabaseService* self, const char* sql, void** result);
    void (*free_result)(struct DatabaseService* self, void* result);
    const char* (*query_scalar)(struct DatabaseService* self, const char* sql);
    
} DatabaseService;

/* Constructor */
DatabaseService* database_service_create(DatabaseType type);
void database_service_destroy(DatabaseService* self);

/* Injector */
DatabaseService* database_service_inject(void);

/* Initialize database service */
int database_service_init(DatabaseService* self, DatabaseType type);

/* Set database type at runtime */
void database_service_set_type(DatabaseService* self, DatabaseType type);
DatabaseType database_service_get_type(const DatabaseService* self);

/* Convenience functions - auto-detect based on file extension */
int database_service_auto_open(DatabaseService* self, const char* path);

/* Get the underlying service */
SQLiteService* database_service_get_sqlite(DatabaseService* self);
DuckDBService* database_service_get_duckdb(DatabaseService* self);

/* Helper macro for creating config */
#define DATABASE_CONFIG_SQLITE(path) \
    (DatabaseConfig){ \
        .type = DATABASE_SQLITE, \
        .path = path, \
        .config.sqlite = { \
            .flags = 0x00000004 | 0x00000001, /* SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE */ \
            .vfs = NULL, \
            .enable_foreign_keys = 1, \
            .enable_wal = 1, \
            .timeout_ms = 5000 \
        } \
    }

#define DATABASE_CONFIG_DUCKDB(path) \
    (DatabaseConfig){ \
        .type = DATABASE_DUCKDB, \
        .path = path, \
        .config.duckdb = { \
            .read_only = false, \
            .max_memory = 0, \
            .threads = 0 \
        } \
    }

#define DATABASE_CONFIG_AUTO(path) \
    database_service_auto_config(path)

/* Auto-detect config based on file extension */
DatabaseConfig database_service_auto_config(const char* path);

#endif /* DATABASE_SERVICE_H */
