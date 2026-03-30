#include "database_service.h"
#include "sqlite_service.h"
#include "duckdb_service.h"
#include "logger_service.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static DatabaseService* g_database_service = NULL;

static int database_open_sqlite(DatabaseService* self, const char* path);
static int database_open_duckdb(DatabaseService* self, const char* path);
static void database_close_sqlite(DatabaseService* self);
static void database_close_duckdb(DatabaseService* self);
static bool database_is_connected_sqlite(DatabaseService* self);
static bool database_is_connected_duckdb(DatabaseService* self);
static const char* database_last_error_sqlite(DatabaseService* self);
static const char* database_last_error_duckdb(DatabaseService* self);
static int database_execute_sqlite(DatabaseService* self, const char* sql);
static int database_execute_duckdb(DatabaseService* self, const char* sql);
static int database_query_sqlite(DatabaseService* self, const char* sql, void** result);
static int database_query_duckdb(DatabaseService* self, const char* sql, void** result);
static void database_free_result_sqlite(DatabaseService* self, void* result);
static void database_free_result_duckdb(DatabaseService* self, void* result);
static const char* database_query_scalar_sqlite(DatabaseService* self, const char* sql);
static const char* database_query_scalar_duckdb(DatabaseService* self, const char* sql);

static void set_error(DatabaseService* self, const char* format, ...) {
    va_list args;
    va_start(args, format);
    char buffer[1024];
    vsnprintf(buffer, sizeof(buffer), format, va_end(args));
    free(self->error);
    self->error = strdup(buffer);
}

static void clear_error(DatabaseService* self) {
    free(self->error);
    self->error = NULL;
}

static int database_open_default(DatabaseService* self, const char* path) {
    switch (self->type) {
        case DATABASE_SQLITE:
            return database_open_sqlite(self, path);
        case DATABASE_DUCKDB:
            return database_open_duckdb(self, path);
        default:
            set_error(self, "Unknown database type: %d", self->type);
            return 0;
    }
}

static int database_open_config_default(DatabaseService* self, const DatabaseConfig* config) {
    if (!self || !config) return 0;
    
    database_service_set_type(self, config->type);
    
    switch (config->type) {
        case DATABASE_SQLITE: {
            SQLiteService* sqlite = database_service_get_sqlite(self);
            if (!sqlite) return 0;
            
            SQLiteConfig sqlite_config = {
                .path = config->path,
                .flags = config->config.sqlite.flags,
                .vfs = config->config.sqlite.vfs,
                .enable_foreign_keys = config->config.sqlite.enable_foreign_keys,
                .enable_wal = config->config.sqlite.enable_wal,
                .timeout_ms = config->config.sqlite.timeout_ms
            };
            return sqlite_open_config(sqlite, &sqlite_config);
        }
        case DATABASE_DUCKDB: {
            DuckDBService* duckdb = database_service_get_duckdb(self);
            if (!duckdb) return 0;
            
            DuckDBConfig duckdb_config = {
                .path = config->path,
                .read_only = config->config.duckdb.read_only,
                .max_memory = config->config.duckdb.max_memory,
                .threads = config->config.duckdb.threads
            };
            return duckdb_open_config(duckdb, &duckdb_config);
        }
        default:
            set_error(self, "Unknown database type: %d", config->type);
            return 0;
    }
}

static void database_close_default(DatabaseService* self) {
    switch (self->type) {
        case DATABASE_SQLITE:
            database_close_sqlite(self);
            break;
        case DATABASE_DUCKDB:
            database_close_duckdb(self);
            break;
    }
}

static bool database_is_connected_default(const DatabaseService* self) {
    switch (self->type) {
        case DATABASE_SQLITE:
            return self->sqlite && sqlite_is_open(self->sqlite);
        case DATABASE_DUCKDB:
            return self->duckdb && duckdb_is_open(self->duckdb);
        default:
            return false;
    }
}

static const char* database_last_error_default(DatabaseService* self) {
    switch (self->type) {
        case DATABASE_SQLITE:
            return database_last_error_sqlite(self);
        case DATABASE_DUCKDB:
            return database_last_error_duckdb(self);
        default:
            return "Unknown database type";
    }
}

static int database_execute_default(DatabaseService* self, const char* sql) {
    switch (self->type) {
        case DATABASE_SQLITE:
            return database_execute_sqlite(self, sql);
        case DATABASE_DUCKDB:
            return database_execute_duckdb(self, sql);
        default:
            set_error(self, "Unknown database type: %d", self->type);
            return 0;
    }
}

static int database_query_default(DatabaseService* self, const char* sql, void** result) {
    switch (self->type) {
        case DATABASE_SQLITE:
            return database_query_sqlite(self, sql, result);
        case DATABASE_DUCKDB:
            return database_query_duckdb(self, sql, result);
        default:
            set_error(self, "Unknown database type: %d", self->type);
            return 0;
    }
}

static void database_free_result_default(DatabaseService* self, void* result) {
    switch (self->type) {
        case DATABASE_SQLITE:
            database_free_result_sqlite(self, result);
            break;
        case DATABASE_DUCKDB:
            database_free_result_duckdb(self, result);
            break;
    }
}

static const char* database_query_scalar_default(DatabaseService* self, const char* sql) {
    switch (self->type) {
        case DATABASE_SQLITE:
            return database_query_scalar_sqlite(self, sql);
        case DATABASE_DUCKDB:
            return database_query_scalar_duckdb(self, sql);
        default:
            return NULL;
    }
}

static int database_open_sqlite(DatabaseService* self, const char* path) {
    if (!self->sqlite) {
        set_error(self, "SQLite service not initialized");
        return 0;
    }
    return sqlite_open(self->sqlite, path);
}

static int database_open_duckdb(DatabaseService* self, const char* path) {
    if (!self->duckdb) {
        set_error(self, "DuckDB service not initialized");
        return 0;
    }
    return duckdb_open(self->duckdb, path);
}

static void database_close_sqlite(DatabaseService* self) {
    if (self->sqlite) {
        sqlite_close(self->sqlite);
    }
}

static void database_close_duckdb(DatabaseService* self) {
    if (self->duckdb) {
        duckdb_close(self->duckdb);
    }
}

static bool database_is_connected_sqlite(DatabaseService* self) {
    return self->sqlite && sqlite_is_open(self->sqlite);
}

static bool database_is_connected_duckdb(DatabaseService* self) {
    return self->duckdb && duckdb_is_open(self->duckdb);
}

static const char* database_last_error_sqlite(DatabaseService* self) {
    if (self->sqlite) {
        return sqlite_last_error(self->sqlite);
    }
    return "SQLite not initialized";
}

static const char* database_last_error_duckdb(DatabaseService* self) {
    if (self->duckdb) {
        return duckdb_last_error(self->duckdb);
    }
    return "DuckDB not initialized";
}

static int database_execute_sqlite(DatabaseService* self, const char* sql) {
    if (!self->sqlite) {
        set_error(self, "SQLite not initialized");
        return 0;
    }
    return sqlite_execute(self->sqlite, sql);
}

static int database_execute_duckdb(DatabaseService* self, const char* sql) {
    if (!self->duckdb) {
        set_error(self, "DuckDB not initialized");
        return 0;
    }
    return duckdb_execute(self->duckdb, sql);
}

static int database_query_sqlite(DatabaseService* self, const char* sql, void** result) {
    if (!self->sqlite) {
        set_error(self, "SQLite not initialized");
        return 0;
    }
    SQLiteResult sqlite_result = sqlite_query(self->sqlite, sql);
    *(SQLiteResult**)result = malloc(sizeof(SQLiteResult));
    if (*(SQLiteResult**)result) {
        **((SQLiteResult**)result) = sqlite_result;
        return sqlite_result.success;
    }
    return 0;
}

static int database_query_duckdb(DatabaseService* self, const char* sql, void** result) {
    if (!self->duckdb) {
        set_error(self, "DuckDB not initialized");
        return 0;
    }
    return duckdb_query(self->duckdb, sql, (DuckDBResult**)result);
}

static void database_free_result_sqlite(DatabaseService* self, void* result) {
    (void)self;
    if (result) {
        sqlite_free_result((SQLiteResult*)result);
    }
}

static void database_free_result_duckdb(DatabaseService* self, void* result) {
    (void)self;
    if (result) {
        duckdb_free_result((DuckDBResult*)result);
    }
}

static const char* database_query_scalar_sqlite(DatabaseService* self, const char* sql) {
    if (!self->sqlite) {
        set_error(self, "SQLite not initialized");
        return NULL;
    }
    return sqlite_query_scalar(self->sqlite, sql);
}

static const char* database_query_scalar_duckdb(DatabaseService* self, const char* sql) {
    if (!self->duckdb) {
        set_error(self, "DuckDB not initialized");
        return NULL;
    }
    return duckdb_query_scalar(self->duckdb, sql);
}

DatabaseConfig database_service_auto_config(const char* path) {
    if (!path) {
        return DATABASE_CONFIG_SQLITE("data/app.db");
    }
    
    size_t len = strlen(path);
    if (len > 8 && strcmp(path + len - 8, ".duckdb") == 0) {
        return DATABASE_CONFIG_DUCKDB(path);
    }
    
    return DATABASE_CONFIG_SQLITE(path);
}

static DatabaseService* database_service_create_internal(DatabaseType type) {
    DatabaseService* self = calloc(1, sizeof(DatabaseService));
    if (!self) return NULL;
    
    self->type = type;
    self->error = NULL;
    
    /* Initialize based on type */
    if (type == DATABASE_SQLITE) {
        self->sqlite = sqlite_service_inject();
        if (!self->sqlite) {
            free(self);
            return NULL;
        }
    } else if (type == DATABASE_DUCKDB) {
        self->duckdb = duckdb_service_inject();
        if (!self->duckdb) {
            free(self);
            return NULL;
        }
    }
    
    /* Set function pointers */
    self->open = database_open_default;
    self->open_config = database_open_config_default;
    self->close = database_close_default;
    self->is_connected = database_is_connected_default;
    self->last_error = database_last_error_default;
    self->execute = database_execute_default;
    self->query = database_query_default;
    self->free_result = database_free_result_default;
    self->query_scalar = database_query_scalar_default;
    
    return self;
}

DatabaseService* database_service_create(DatabaseType type) {
    return database_service_create_internal(type);
}

void database_service_destroy(DatabaseService* self) {
    if (!self) return;
    
    if (self->is_open) {
        self->close(self);
    }
    
    free(self->error);
    free(self);
    g_database_service = NULL;
}

int database_service_init(DatabaseService* self, DatabaseType type) {
    if (!self) return 0;
    
    /* If type changed, reinitialize */
    if (self->type != type) {
        self->close(self);
        
        if (type == DATABASE_SQLITE) {
            self->sqlite = sqlite_service_inject();
            self->duckdb = NULL;
        } else if (type == DATABASE_DUCKDB) {
            self->duckdb = duckdb_service_inject();
            self->sqlite = NULL;
        }
        
        self->type = type;
    }
    
    return 1;
}

void database_service_set_type(DatabaseService* self, DatabaseType type) {
    if (!self) return;
    database_service_init(self, type);
}

DatabaseType database_service_get_type(const DatabaseService* self) {
    return self ? self->type : DATABASE_SQLITE;
}

int database_service_auto_open(DatabaseService* self, const char* path) {
    DatabaseConfig config = database_service_auto_config(path);
    return self->open_config(self, &config);
}

SQLiteService* database_service_get_sqlite(DatabaseService* self) {
    return self ? self->sqlite : NULL;
}

DuckDBService* database_service_get_duckdb(DatabaseService* self) {
    return self ? self->duckdb : NULL;
}

DatabaseService* database_service_inject(void) {
    if (!g_database_service) {
        g_database_service = database_service_create(DATABASE_SQLITE);
    }
    return g_database_service;
}
