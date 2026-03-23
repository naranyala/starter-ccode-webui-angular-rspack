/* SQLite Service Implementation - Database operations with migrations */

#include "sqlite_service.h"
#include "logger_service.h"
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>

/* Internal state */
typedef struct {
    sqlite3* db;
    char* error;
} sqlite_state;

/* Set error message */
static void set_error(SQLiteService* self, const char* format, ...) {
    if (self->db) {
        const char* db_error = sqlite3_errmsg(self->db);
        if (db_error && db_error[0] != '\0') {
            free(self->error);
            self->error = strdup(db_error);
            return;
        }
    }
    
    if (format) {
        va_list args;
        va_start(args, format);
        char buffer[1024];
        vsnprintf(buffer, sizeof(buffer), format, args);
        va_end(args);
        free(self->error);
        self->error = strdup(buffer);
    }
}

/* Clear error */
static void clear_error(SQLiteService* self) {
    free(self->error);
    self->error = NULL;
}

/* ==================== Connection Management ==================== */

int sqlite_open(SQLiteService* self, const char* path) {
    SQLiteConfig config = {
        .path = path,
        .flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE,
        .vfs = NULL,
        .enable_foreign_keys = 1,
        .enable_wal = 1,
        .timeout_ms = 5000
    };
    return sqlite_open_config(self, &config);
}

int sqlite_open_config(SQLiteService* self, const SQLiteConfig* config) {
    if (!self || !config || !config->path) {
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    
    /* Close existing connection */
    if (self->db) {
        sqlite_close(self);
    }
    
    /* Open database */
    int rc = sqlite3_open_v2(config->path, &self->db, config->flags, config->vfs);
    if (rc != SQLITE_OK) {
        set_error(self, "Failed to open database: %s", sqlite3_errmsg(self->db));
        if (logger) logger_log(logger, "ERROR", "SQLite: %s", self->error);
        sqlite3_close(self->db);
        self->db = NULL;
        self->is_open = 0;
        return 0;
    }
    
    /* Set busy timeout */
    sqlite3_busy_timeout(self->db, config->timeout_ms);
    
    /* Enable foreign keys */
    if (config->enable_foreign_keys) {
        rc = sqlite3_exec(self->db, "PRAGMA foreign_keys = ON", NULL, NULL, NULL);
        if (rc != SQLITE_OK) {
            set_error(self, "Failed to enable foreign keys");
            if (logger) logger_log(logger, "WARN", "SQLite: %s", self->error);
        }
    }
    
    /* Enable WAL mode */
    if (config->enable_wal) {
        rc = sqlite3_exec(self->db, "PRAGMA journal_mode = WAL", NULL, NULL, NULL);
        if (rc != SQLITE_OK) {
            set_error(self, "Failed to enable WAL mode");
            if (logger) logger_log(logger, "WARN", "SQLite: %s", self->error);
        }
    }
    
    self->db_path = strdup(config->path);
    self->is_open = 1;
    self->current_version = -1;
    
    if (logger) logger_log(logger, "INFO", "SQLite: Opened database '%s'", config->path);
    
    return 1;
}

int sqlite_close(SQLiteService* self) {
    if (!self || !self->db) {
        return 1;
    }
    
    LoggerService* logger = logger_service_inject();
    
    int rc = sqlite3_close(self->db);
    if (rc != SQLITE_OK) {
        set_error(self, "Failed to close database: %s", sqlite3_errmsg(self->db));
        if (logger) logger_log(logger, "ERROR", "SQLite: %s", self->error);
        return 0;
    }
    
    free(self->db_path);
    self->db_path = NULL;
    self->db = NULL;
    self->is_open = 0;
    self->current_version = -1;
    clear_error(self);
    
    if (logger) logger_log(logger, "INFO", "SQLite: Database closed");
    
    return 1;
}

int sqlite_is_open(SQLiteService* self) {
    return self && self->is_open && self->db;
}

const char* sqlite_last_error(SQLiteService* self) {
    if (!self) return "Invalid service";
    if (self->error) return self->error;
    if (self->db) return sqlite3_errmsg(self->db);
    return "No error";
}

/* ==================== Query Execution ==================== */

int sqlite_execute(SQLiteService* self, const char* sql) {
    if (!self || !self->db || !sql) {
        return 0;
    }
    
    clear_error(self);
    
    char* error_msg = NULL;
    int rc = sqlite3_exec(self->db, sql, NULL, NULL, &error_msg);
    
    if (rc != SQLITE_OK) {
        set_error(self, "SQL error: %s", error_msg);
        sqlite3_free(error_msg);
        return 0;
    }
    
    return 1;
}

int sqlite_execute_params(SQLiteService* self, const char* sql, const char** params, int param_count) {
    if (!self || !self->db || !sql) {
        return 0;
    }
    
    clear_error(self);
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(self->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        set_error(self, "Failed to prepare statement: %s", sqlite3_errmsg(self->db));
        return 0;
    }
    
    /* Bind parameters */
    for (int i = 0; i < param_count && i < SQLITE_MAX_PARAMS; i++) {
        if (params[i]) {
            sqlite3_bind_text(stmt, i + 1, params[i], -1, SQLITE_STATIC);
        } else {
            sqlite3_bind_null(stmt, i + 1);
        }
    }
    
    rc = sqlite3_step(stmt);
    int success = (rc == SQLITE_DONE || rc == SQLITE_ROW);
    
    if (!success) {
        set_error(self, "Execution failed: %s", sqlite3_errmsg(self->db));
    }
    
    sqlite3_finalize(stmt);
    return success;
}

/* Result helper - create empty result */
static SQLiteResult create_result(int column_count) {
    SQLiteResult result = {0};
    result.column_count = column_count;
    result.rows = NULL;
    result.row_count = 0;
    result.columns = NULL;
    result.error = NULL;
    result.success = 1;
    return result;
}

/* Result helper - free result contents */
static void free_result_contents(SQLiteResult* result) {
    for (int i = 0; i < result->row_count; i++) {
        for (int j = 0; j < result->column_count; j++) {
            free(result->rows[i].values[j]);
        }
        free(result->rows[i].columns);
        free(result->rows[i].values);
    }
    free(result->rows);
    
    for (int i = 0; i < result->column_count; i++) {
        free(result->columns[i]);
    }
    free(result->columns);
    free(result->error);
    
    result->rows = NULL;
    result->row_count = 0;
    result->columns = NULL;
    result->column_count = 0;
    result->error = NULL;
}

SQLiteResult sqlite_query(SQLiteService* self, const char* sql) {
    if (!self || !self->db || !sql) {
        SQLiteResult result = create_result(0);
        result.success = 0;
        result.error = strdup("Invalid parameters");
        return result;
    }
    
    clear_error(self);
    SQLiteResult result = create_result(0);
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(self->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        result.success = 0;
        result.error = strdup(sqlite3_errmsg(self->db));
        return result;
    }
    
    /* Get column count */
    int col_count = sqlite3_column_count(stmt);
    result.column_count = col_count;
    
    /* Get column names */
    if (col_count > 0) {
        result.columns = malloc(col_count * sizeof(char*));
        for (int i = 0; i < col_count; i++) {
            result.columns[i] = strdup(sqlite3_column_name(stmt, i));
        }
    }
    
    /* Count rows first (for allocation) */
    int capacity = 64;
    result.rows = malloc(capacity * sizeof(SQLiteRow));
    
    /* Execute and fetch rows */
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        if (result.row_count >= capacity) {
            capacity *= 2;
            result.rows = realloc(result.rows, capacity * sizeof(SQLiteRow));
        }
        
        SQLiteRow* row = &result.rows[result.row_count];
        row->column_count = col_count;
        row->columns = malloc(col_count * sizeof(char*));
        row->values = malloc(col_count * sizeof(char*));
        
        for (int i = 0; i < col_count; i++) {
            row->columns[i] = result.columns[i]; /* Share column names */
            const char* val = (const char*)sqlite3_column_text(stmt, i);
            row->values[i] = val ? strdup(val) : NULL;
        }
        
        result.row_count++;
    }
    
    if (rc != SQLITE_DONE) {
        result.success = 0;
        result.error = strdup(sqlite3_errmsg(self->db));
    }
    
    sqlite3_finalize(stmt);
    return result;
}

SQLiteResult sqlite_query_params(SQLiteService* self, const char* sql, const char** params, int param_count) {
    if (!self || !self->db || !sql) {
        SQLiteResult result = create_result(0);
        result.success = 0;
        result.error = strdup("Invalid parameters");
        return result;
    }
    
    clear_error(self);
    SQLiteResult result = create_result(0);
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(self->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        result.success = 0;
        result.error = strdup(sqlite3_errmsg(self->db));
        return result;
    }
    
    /* Bind parameters */
    for (int i = 0; i < param_count && i < SQLITE_MAX_PARAMS; i++) {
        if (params[i]) {
            sqlite3_bind_text(stmt, i + 1, params[i], -1, SQLITE_STATIC);
        } else {
            sqlite3_bind_null(stmt, i + 1);
        }
    }
    
    /* Get column count */
    int col_count = sqlite3_column_count(stmt);
    result.column_count = col_count;
    
    /* Get column names */
    if (col_count > 0) {
        result.columns = malloc(col_count * sizeof(char*));
        for (int i = 0; i < col_count; i++) {
            result.columns[i] = strdup(sqlite3_column_name(stmt, i));
        }
    }
    
    /* Fetch rows */
    int capacity = 64;
    result.rows = malloc(capacity * sizeof(SQLiteRow));
    
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        if (result.row_count >= capacity) {
            capacity *= 2;
            result.rows = realloc(result.rows, capacity * sizeof(SQLiteRow));
        }
        
        SQLiteRow* row = &result.rows[result.row_count];
        row->column_count = col_count;
        row->columns = malloc(col_count * sizeof(char*));
        row->values = malloc(col_count * sizeof(char*));
        
        for (int i = 0; i < col_count; i++) {
            row->columns[i] = result.columns[i];
            const char* val = (const char*)sqlite3_column_text(stmt, i);
            row->values[i] = val ? strdup(val) : NULL;
        }
        
        result.row_count++;
    }
    
    if (rc != SQLITE_DONE) {
        result.success = 0;
        result.error = strdup(sqlite3_errmsg(self->db));
    }
    
    sqlite3_finalize(stmt);
    return result;
}

SQLiteResult sqlite_query_one(SQLiteService* self, const char* sql) {
    SQLiteResult result = sqlite_query(self, sql);
    if (result.success && result.row_count > 1) {
        /* Free extra rows */
        for (int i = 1; i < result.row_count; i++) {
            for (int j = 0; j < result.column_count; j++) {
                free(result.rows[i].values[j]);
            }
            free(result.rows[i].columns);
            free(result.rows[i].values);
        }
        result.row_count = 1;
    }
    return result;
}

const char* sqlite_query_scalar(SQLiteService* self, const char* sql) {
    SQLiteResult result = sqlite_query_one(self, sql);
    if (result.success && result.row_count > 0 && result.column_count > 0) {
        return result.rows[0].values[0];
    }
    return NULL;
}

void sqlite_free_result(SQLiteResult* result) {
    if (!result) return;
    free_result_contents(result);
}

/* ==================== Prepared Statements ==================== */

sqlite3_stmt* sqlite_prepare(SQLiteService* self, const char* sql) {
    if (!self || !self->db || !sql) {
        return NULL;
    }
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v2(self->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        set_error(self, "Failed to prepare statement: %s", sqlite3_errmsg(self->db));
        return NULL;
    }
    
    return stmt;
}

int sqlite_bind_text(sqlite3_stmt* stmt, int index, const char* value) {
    if (!stmt) return 0;
    int rc = sqlite3_bind_text(stmt, index, value ? value : "", -1, SQLITE_STATIC);
    return rc == SQLITE_OK;
}

int sqlite_bind_int(sqlite3_stmt* stmt, int index, int value) {
    if (!stmt) return 0;
    int rc = sqlite3_bind_int(stmt, index, value);
    return rc == SQLITE_OK;
}

int sqlite_bind_double(sqlite3_stmt* stmt, int index, double value) {
    if (!stmt) return 0;
    int rc = sqlite3_bind_double(stmt, index, value);
    return rc == SQLITE_OK;
}

int sqlite_step_execute(sqlite3_stmt* stmt) {
    if (!stmt) return 0;
    int rc = sqlite3_step(stmt);
    return (rc == SQLITE_DONE || rc == SQLITE_ROW);
}

SQLiteResult sqlite_step_query(SQLiteService* self, sqlite3_stmt* stmt) {
    SQLiteResult result = create_result(0);
    
    if (!self || !self->db || !stmt) {
        result.success = 0;
        result.error = strdup("Invalid parameters");
        return result;
    }
    
    int col_count = sqlite3_column_count(stmt);
    result.column_count = col_count;
    
    if (col_count > 0) {
        result.columns = malloc(col_count * sizeof(char*));
        for (int i = 0; i < col_count; i++) {
            result.columns[i] = strdup(sqlite3_column_name(stmt, i));
        }
    }
    
    int rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW) {
        result.row_count = 1;
        result.rows = malloc(sizeof(SQLiteRow));
        SQLiteRow* row = result.rows;
        row->column_count = col_count;
        row->columns = malloc(col_count * sizeof(char*));
        row->values = malloc(col_count * sizeof(char*));
        
        for (int i = 0; i < col_count; i++) {
            row->columns[i] = result.columns[i];
            const char* val = (const char*)sqlite3_column_text(stmt, i);
            row->values[i] = val ? strdup(val) : NULL;
        }
    } else if (rc != SQLITE_DONE) {
        result.success = 0;
        result.error = strdup(sqlite3_errmsg(self->db));
    }
    
    return result;
}

int sqlite_finalize(sqlite3_stmt* stmt) {
    if (!stmt) return 0;
    int rc = sqlite3_finalize(stmt);
    return rc == SQLITE_OK;
}

/* ==================== Transactions ==================== */

int sqlite_begin_transaction(SQLiteService* self) {
    return sqlite_execute(self, "BEGIN TRANSACTION");
}

int sqlite_commit(SQLiteService* self) {
    return sqlite_execute(self, "COMMIT");
}

int sqlite_rollback(SQLiteService* self) {
    return sqlite_execute(self, "ROLLBACK");
}

int sqlite_transaction(SQLiteService* self, int (*fn)(sqlite3* db, void* user_data), void* user_data) {
    if (!self || !self->db || !fn) {
        return 0;
    }
    
    if (!sqlite_begin_transaction(self)) {
        return 0;
    }
    
    int result = fn(self->db, user_data);
    
    if (result) {
        if (!sqlite_commit(self)) {
            sqlite_rollback(self);
            return 0;
        }
    } else {
        sqlite_rollback(self);
    }
    
    return result;
}

/* ==================== Migrations ==================== */

int sqlite_migrations_init(SQLiteService* self) {
    const char* sql = 
        "CREATE TABLE IF NOT EXISTS schema_migrations ("
        "  version INTEGER PRIMARY KEY,"
        "  name TEXT NOT NULL,"
        "  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")";
    return sqlite_execute(self, sql);
}

int sqlite_get_version(SQLiteService* self) {
    if (!self || !self->db) return -1;
    
    /* Check if migrations table exists */
    const char* check_sql = 
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'";
    SQLiteResult result = sqlite_query(self, check_sql);
    
    if (!result.success || result.row_count == 0) {
        sqlite_free_result(&result);
        return 0; /* No migrations table means version 0 */
    }
    sqlite_free_result(&result);
    
    /* Get max version */
    const char* version_sql = "SELECT MAX(version) FROM schema_migrations";
    const char* version_str = sqlite_query_scalar(self, version_sql);
    
    if (!version_str) return 0;
    return atoi(version_str);
}

int sqlite_migrate(SQLiteService* self, const SQLiteMigration* migrations, int migration_count, int target_version) {
    if (!self || !self->db || !migrations) {
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    
    /* Initialize migrations table */
    if (!sqlite_migrations_init(self)) {
        if (logger) logger_log(logger, "ERROR", "SQLite: Failed to initialize migrations table");
        return 0;
    }
    
    int current = sqlite_get_version(self);
    if (current < 0) {
        if (logger) logger_log(logger, "ERROR", "SQLite: Failed to get current version");
        return 0;
    }
    
    /* Determine target */
    if (target_version < 0) {
        target_version = migration_count; /* Latest */
    }
    
    if (current >= target_version) {
        if (logger) logger_log(logger, "INFO", "SQLite: Database already at version %d (target: %d)", current, target_version);
        return 1;
    }
    
    if (logger) logger_log(logger, "INFO", "SQLite: Migrating from version %d to %d", current, target_version);
    
    /* Apply migrations */
    for (int i = current; i < target_version; i++) {
        const SQLiteMigration* m = &migrations[i];
        
        if (logger) logger_log(logger, "INFO", "SQLite: Applying migration %d: %s", m->version, m->name);
        
        if (!sqlite_begin_transaction(self)) {
            if (logger) logger_log(logger, "ERROR", "SQLite: Failed to begin transaction for migration %d", m->version);
            return 0;
        }
        
        /* Run migration */
        if (m->up && !m->up(self->db, NULL)) {
            sqlite_rollback(self);
            if (logger) logger_log(logger, "ERROR", "SQLite: Migration %d failed: %s", m->version, m->name);
            return 0;
        }
        
        /* Record migration */
        char sql[512];
        snprintf(sql, sizeof(sql), 
            "INSERT INTO schema_migrations (version, name) VALUES (%d, '%s')",
            m->version, m->name);
        
        if (!sqlite_execute(self, sql)) {
            sqlite_rollback(self);
            if (logger) logger_log(logger, "ERROR", "SQLite: Failed to record migration %d", m->version);
            return 0;
        }
        
        if (!sqlite_commit(self)) {
            if (logger) logger_log(logger, "ERROR", "SQLite: Failed to commit migration %d", m->version);
            return 0;
        }
        
        if (logger) logger_log(logger, "INFO", "SQLite: Migration %d applied successfully", m->version);
    }
    
    self->current_version = target_version;
    
    if (logger) logger_log(logger, "INFO", "SQLite: Migration completed. Database at version %d", target_version);
    return 1;
}

int sqlite_rollback_to(SQLiteService* self, const SQLiteMigration* migrations, int migration_count, int target_version) {
    (void)migration_count; /* Unused - migrations array is traversed by version */
    
    if (!self || !self->db || !migrations) {
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    
    int current = sqlite_get_version(self);
    if (current <= target_version) {
        if (logger) logger_log(logger, "INFO", "SQLite: No rollback needed (current: %d, target: %d)", current, target_version);
        return 1;
    }
    
    if (logger) logger_log(logger, "INFO", "SQLite: Rolling back from version %d to %d", current, target_version);
    
    /* Rollback migrations in reverse order */
    for (int i = current - 1; i >= target_version; i--) {
        const SQLiteMigration* m = &migrations[i];
        
        if (logger) logger_log(logger, "INFO", "SQLite: Rolling back migration %d: %s", m->version, m->name);
        
        if (!sqlite_begin_transaction(self)) {
            if (logger) logger_log(logger, "ERROR", "SQLite: Failed to begin transaction for rollback %d", m->version);
            return 0;
        }
        
        /* Run rollback */
        if (m->down && !m->down(self->db, NULL)) {
            sqlite_rollback(self);
            if (logger) logger_log(logger, "ERROR", "SQLite: Rollback %d failed: %s", m->version, m->name);
            return 0;
        }
        
        /* Remove migration record */
        char sql[256];
        snprintf(sql, sizeof(sql), 
            "DELETE FROM schema_migrations WHERE version = %d", m->version);
        
        if (!sqlite_execute(self, sql)) {
            sqlite_rollback(self);
            if (logger) logger_log(logger, "ERROR", "SQLite: Failed to remove migration record %d", m->version);
            return 0;
        }
        
        if (!sqlite_commit(self)) {
            if (logger) logger_log(logger, "ERROR", "SQLite: Failed to commit rollback %d", m->version);
            return 0;
        }
        
        if (logger) logger_log(logger, "INFO", "SQLite: Rollback %d completed", m->version);
    }
    
    self->current_version = target_version;
    
    if (logger) logger_log(logger, "INFO", "SQLite: Rollback completed. Database at version %d", target_version);
    return 1;
}

/* ==================== Utility Functions ==================== */

char* sqlite_escape_string(SQLiteService* self, const char* input) {
    (void)self; /* Uses global sqlite3_mprintf, doesn't need connection */
    
    if (!input) return NULL;

    char* escaped = sqlite3_mprintf("%q", input);
    return escaped ? strdup(escaped) : NULL;
}

long long sqlite_last_insert_rowid(SQLiteService* self) {
    if (!self || !self->db) return -1;
    return sqlite3_last_insert_rowid(self->db);
}

int sqlite_changes(SQLiteService* self) {
    if (!self || !self->db) return 0;
    return sqlite3_changes(self->db);
}

int sqlite_vacuum(SQLiteService* self) {
    return sqlite_execute(self, "VACUUM");
}

SQLiteResult sqlite_integrity_check(SQLiteService* self) {
    return sqlite_query(self, "PRAGMA integrity_check");
}

/* ==================== DI Service Implementation ==================== */

SQLiteService* sqlite_service_inject(void) {
    void* service;
    DI_Error err = DI_Container_Get(DI_GetGlobalContainer(), "sqlite_service", &service);
    if (err != DI_OK) {
        return NULL;
    }
    return (SQLiteService*)service;
}

DI_Error sqlite_service_provider(DI_Container* container, void** out_service) {
    LoggerService* logger = NULL;

    /* Get LoggerService dependency */
    DI_Error err = DI_Container_Get(container, "logger_service", (void**)&logger);
    if (err != DI_OK) {
        return err;
    }

    /* Create service */
    SQLiteService* self = (SQLiteService*)calloc(1, sizeof(SQLiteService));
    if (!self) {
        return DI_ERROR_OUT_OF_MEMORY;
    }

    self->base.name = "sqlite_service";
    self->base.initialized = 0;
    self->base.destroy = sqlite_service_destroy;
    self->db = NULL;
    self->db_path = NULL;
    self->current_version = 0;
    self->is_open = 0;
    self->error = NULL;

    self->base.initialized = 1;

    if (logger) {
        logger_log(logger, "INFO", "SQLiteService created");
    }

    *out_service = self;
    return DI_OK;
}

void sqlite_service_destroy(DI_Service* service) {
    if (!service) return;

    SQLiteService* self = (SQLiteService*)service;
    LoggerService* logger = logger_service_inject();

    if (self->base.initialized) {
        if (self->db) {
            sqlite_close(self);
        }
        self->base.initialized = 0;
    }

    if (logger) {
        logger_log(logger, "INFO", "SQLiteService destroyed");
    }

    free(self->error);
    free(self);
}
