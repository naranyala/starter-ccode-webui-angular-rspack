/* DuckDB Service Implementation */

#include "duckdb_service.h"
#include "logger_service.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Include DuckDB C API */
#include "../../thirdparty/libduckdb-linux-amd64/duckdb.h"

/* Internal state */
typedef struct {
    duckdb_database db;
    duckdb_connection conn;
    char* error;
} duckdb_state;

/* Set error message */
static void set_error(DuckDBService* self, const char* format, ...) {
    if (self->db) {
        const char* db_error = duckdb_query_error(*((duckdb_result*)self->conn));
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
static void clear_error(DuckDBService* self) {
    free(self->error);
    self->error = NULL;
}

/* ==================== Connection Management ==================== */

int duckdb_open(DuckDBService* self, const char* path) {
    DuckDBConfig config = {
        .path = path,
        .read_only = false,
        .max_memory = 0,
        .threads = 0
    };
    return duckdb_open_config(self, &config);
}

int duckdb_open_config(DuckDBService* self, const DuckDBConfig* config) {
    if (!self || !config || !config->path) {
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    
    /* Close existing connection */
    if (self->db) {
        duckdb_close(self);
    }
    
    /* Create config */
    duckdb_config db_config = NULL;
    duckdb_create_config(&db_config);
    
    /* Set options */
    if (config->max_memory > 0) {
        char mem_str[32];
        snprintf(mem_str, sizeof(mem_str), "%dMB", config->max_memory);
        duckdb_set_config(db_config, "max_memory", mem_str);
    }
    
    if (config->threads > 0) {
        char thread_str[16];
        snprintf(thread_str, sizeof(thread_str), "%d", config->threads);
        duckdb_set_config(db_config, "threads", thread_str);
    }
    
    /* Open database */
    duckdb_state state = duckdb_open(config->path, &self->db);
    if (state == DuckDBError) {
        set_error(self, "Failed to open database");
        if (logger) logger_log(logger, "ERROR", "DuckDB: %s", self->error);
        duckdb_close(self->db);
        self->db = NULL;
        self->is_open = 0;
        duckdb_destroy_config(&db_config);
        return 0;
    }
    
    /* Connect */
    state = duckdb_connect(self->db, &self->conn);
    if (state == DuckDBError) {
        set_error(self, "Failed to connect to database");
        if (logger) logger_log(logger, "ERROR", "DuckDB: %s", self->error);
        duckdb_close(self->db);
        self->db = NULL;
        self->conn = NULL;
        self->is_open = 0;
        duckdb_destroy_config(&db_config);
        return 0;
    }
    
    self->db_path = strdup(config->path);
    self->is_open = 1;
    self->max_memory = config->max_memory;
    self->threads = config->threads;
    
    if (logger) logger_log(logger, "INFO", "DuckDB: Opened database '%s'", config->path);
    
    duckdb_destroy_config(&db_config);
    return 1;
}

int duckdb_close(DuckDBService* self) {
    if (!self || !self->conn) {
        return 1;
    }
    
    LoggerService* logger = logger_service_inject();
    
    duckdb_disconnect(&self->conn);
    self->conn = NULL;
    
    if (self->db) {
        duckdb_close(&self->db);
        self->db = NULL;
    }
    
    free(self->db_path);
    self->db_path = NULL;
    self->is_open = 0;
    clear_error(self);
    
    if (logger) logger_log(logger, "INFO", "DuckDB: Database closed");
    
    return 1;
}

int duckdb_is_open(DuckDBService* self) {
    return self && self->is_open && self->conn;
}

const char* duckdb_last_error(DuckDBService* self) {
    if (!self) return "Invalid service";
    if (self->error) return self->error;
    return "No error";
}

/* ==================== Query Execution ==================== */

int duckdb_execute(DuckDBService* self, const char* sql) {
    if (!self || !self->conn || !sql) {
        return 0;
    }
    
    clear_error(self);
    
    duckdb_result result;
    duckdb_state state = duckdb_query(self->conn, sql, &result);
    
    if (state == DuckDBError) {
        set_error(self, "SQL error: %s", duckdb_result_error(&result));
        duckdb_destroy_result(&result);
        return 0;
    }
    
    duckdb_destroy_result(&result);
    return 1;
}

/* Result helper - create empty result */
static DuckDBResult create_result(int column_count) {
    DuckDBResult result = {0};
    result.column_count = column_count;
    result.rows = NULL;
    result.row_count = 0;
    result.columns = NULL;
    result.error = NULL;
    result.success = 1;
    return result;
}

/* Result helper - free result contents */
static void free_result_contents(DuckDBResult* result) {
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

DuckDBResult duckdb_query(DuckDBService* self, const char* sql) {
    if (!self || !self->conn || !sql) {
        DuckDBResult result = create_result(0);
        result.success = 0;
        result.error = strdup("Invalid parameters");
        return result;
    }
    
    clear_error(self);
    DuckDBResult result = create_result(0);
    
    duckdb_result db_result;
    duckdb_state state = duckdb_query(self->conn, sql, &db_result);
    
    if (state == DuckDBError) {
        result.success = 0;
        result.error = strdup(duckdb_result_error(&db_result));
        duckdb_destroy_result(&db_result);
        return result;
    }
    
    /* Get column count */
    idx_t col_count = duckdb_column_count(&db_result);
    result.column_count = (int)col_count;
    
    /* Get column names */
    if (col_count > 0) {
        result.columns = malloc(col_count * sizeof(char*));
        for (idx_t i = 0; i < col_count; i++) {
            result.columns[i] = strdup(duckdb_column_name(&db_result, i));
        }
    }
    
    /* Fetch rows */
    idx_t row_count = duckdb_row_count(&db_result);
    result.row_count = (int)row_count;
    result.rows = malloc(row_count * sizeof(DuckDBRow));
    
    for (idx_t row_idx = 0; row_idx < row_count; row_idx++) {
        DuckDBRow* row = &result.rows[row_idx];
        row->column_count = (int)col_count;
        row->columns = malloc(col_count * sizeof(char*));
        row->values = malloc(col_count * sizeof(char*));
        
        for (idx_t col_idx = 0; col_idx < col_count; col_idx++) {
            row->columns[col_idx] = result.columns[col_idx];
            
            /* Get value based on type */
            duckdb_type type = duckdb_column_type(&db_result, col_idx);
            void* data = duckdb_column_data(&db_result, col_idx);
            
            switch (type) {
                case DUCKDB_TYPE_BOOLEAN:
                    row->values[col_idx] = strdup(((bool*)data)[row_idx] ? "true" : "false");
                    break;
                case DUCKDB_TYPE_TINYINT:
                    row->values[col_idx] = malloc(8);
                    snprintf(row->values[col_idx], 8, "%d", ((int8_t*)data)[row_idx]);
                    break;
                case DUCKDB_TYPE_SMALLINT:
                    row->values[col_idx] = malloc(8);
                    snprintf(row->values[col_idx], 8, "%d", ((int16_t*)data)[row_idx]);
                    break;
                case DUCKDB_TYPE_INTEGER:
                    row->values[col_idx] = malloc(16);
                    snprintf(row->values[col_idx], 16, "%d", ((int32_t*)data)[row_idx]);
                    break;
                case DUCKDB_TYPE_BIGINT:
                    row->values[col_idx] = malloc(32);
                    snprintf(row->values[col_idx], 32, "%lld", (long long)((int64_t*)data)[row_idx]);
                    break;
                case DUCKDB_TYPE_FLOAT:
                    row->values[col_idx] = malloc(32);
                    snprintf(row->values[col_idx], 32, "%f", ((float*)data)[row_idx]);
                    break;
                case DUCKDB_TYPE_DOUBLE:
                    row->values[col_idx] = malloc(32);
                    snprintf(row->values[col_idx], 32, "%f", ((double*)data)[row_idx]);
                    break;
                case DUCKDB_TYPE_VARCHAR: {
                    char* str = ((char**)data)[row_idx];
                    row->values[col_idx] = str ? strdup(str) : NULL;
                    break;
                }
                default:
                    row->values[col_idx] = NULL;
            }
        }
    }
    
    duckdb_destroy_result(&db_result);
    return result;
}

DuckDBResult duckdb_query_one(DuckDBService* self, const char* sql) {
    DuckDBResult result = duckdb_query(self, sql);
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

const char* duckdb_query_scalar(DuckDBService* self, const char* sql) {
    DuckDBResult result = duckdb_query_one(self, sql);
    if (result.success && result.row_count > 0 && result.column_count > 0) {
        return result.rows[0].values[0];
    }
    return NULL;
}

void duckdb_free_result(DuckDBResult* result) {
    if (!result) return;
    free_result_contents(result);
}

/* ==================== Prepared Statements ==================== */

duckdb_prepared_statement duckdb_prepare(DuckDBService* self, const char* sql) {
    if (!self || !self->conn || !sql) {
        return NULL;
    }
    
    duckdb_prepared_statement stmt;
    duckdb_state state = duckdb_prepare(self->conn, sql, &stmt);
    if (state == DuckDBError) {
        set_error(self, "Failed to prepare statement");
        return NULL;
    }
    
    return stmt;
}

int duckdb_bind_text(duckdb_prepared_statement stmt, int index, const char* value) {
    if (!stmt) return 0;
    duckdb_state state = duckdb_bind_varchar(stmt, index, value ? value : "");
    return state == DuckDBSuccess;
}

int duckdb_bind_int(duckdb_prepared_statement stmt, int index, int value) {
    if (!stmt) return 0;
    duckdb_state state = duckdb_bind_int32(stmt, index, value);
    return state == DuckDBSuccess;
}

int duckdb_step_execute(DuckDBService* self, duckdb_prepared_statement stmt) {
    if (!self || !stmt) return 0;
    
    duckdb_result result;
    duckdb_state state = duckdb_execute_prepared(stmt, &result);
    int success = (state == DuckDBSuccess);
    
    if (!success) {
        set_error(self, "Execution failed");
    }
    
    duckdb_destroy_result(&result);
    return success;
}

DuckDBResult duckdb_step_query(DuckDBService* self, duckdb_prepared_statement stmt) {
    DuckDBResult result = create_result(0);
    
    if (!self || !stmt) {
        result.success = 0;
        result.error = strdup("Invalid parameters");
        return result;
    }
    
    duckdb_result db_result;
    duckdb_state state = duckdb_execute_prepared(stmt, &db_result);
    
    if (state == DuckDBError) {
        result.success = 0;
        result.error = strdup(duckdb_result_error(&db_result));
        duckdb_destroy_result(&db_result);
        return result;
    }
    
    /* Similar to duckdb_query - fetch results */
    idx_t col_count = duckdb_column_count(&db_result);
    result.column_count = (int)col_count;
    
    if (col_count > 0) {
        result.columns = malloc(col_count * sizeof(char*));
        for (idx_t i = 0; i < col_count; i++) {
            result.columns[i] = strdup(duckdb_column_name(&db_result, i));
        }
    }
    
    idx_t row_count = duckdb_row_count(&db_result);
    result.row_count = (int)row_count;
    result.rows = malloc(row_count * sizeof(DuckDBRow));
    
    for (idx_t row_idx = 0; row_idx < row_count; row_idx++) {
        DuckDBRow* row = &result.rows[row_idx];
        row->column_count = (int)col_count;
        row->columns = malloc(col_count * sizeof(char*));
        row->values = malloc(col_count * sizeof(char*));
        
        for (idx_t col_idx = 0; col_idx < col_count; col_idx++) {
            row->columns[col_idx] = result.columns[col_idx];
            char* str = ((char**)duckdb_column_data(&db_result, col_idx))[row_idx];
            row->values[col_idx] = str ? strdup(str) : NULL;
        }
    }
    
    duckdb_destroy_result(&db_result);
    return result;
}

int duckdb_finalize(duckdb_prepared_statement stmt) {
    if (!stmt) return 0;
    duckdb_destroy_prepare(&stmt);
    return 1;
}

/* ==================== Transactions ==================== */

int duckdb_begin_transaction(DuckDBService* self) {
    return duckdb_execute(self, "BEGIN TRANSACTION");
}

int duckdb_commit(DuckDBService* self) {
    return duckdb_execute(self, "COMMIT");
}

int duckdb_rollback(DuckDBService* self) {
    return duckdb_execute(self, "ROLLBACK");
}

/* ==================== Utility Functions ==================== */

long long duckdb_last_insert_rowid(DuckDBService* self) {
    if (!self || !self->conn) return -1;
    
    const char* result = duckdb_query_scalar(self, "SELECT lastval()");
    if (result) {
        return atoll(result);
    }
    return -1;
}

int duckdb_changes(DuckDBService* self) {
    if (!self || !self->conn) return 0;
    /* DuckDB doesn't have a direct equivalent to sqlite3_changes */
    return 1;
}

void duckdb_get_stats(DuckDBService* self, int* out_total_rows, int* out_total_tables) {
    if (!self || !self->conn) {
        if (out_total_rows) *out_total_rows = 0;
        if (out_total_tables) *out_total_tables = 0;
        return;
    }
    
    /* Get table count */
    const char* tables = duckdb_query_scalar(self, 
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'main'");
    if (out_total_tables && tables) {
        *out_total_tables = atoi(tables);
    }
    
    /* This is simplified - actual row counting would require querying each table */
    if (out_total_rows) *out_total_rows = 0;
}

/* ==================== DI Service Implementation ==================== */

DI_Error duckdb_service_provider(DI_Container* container, void** out_service) {
    LoggerService* logger = NULL;
    
    DI_Error err = DI_Container_Resolve(container, "logger_service", (void**)&logger);
    if (err != DI_OK) {
        return err;
    }
    
    DuckDBService* self = (DuckDBService*)malloc(sizeof(DuckDBService));
    if (!self) {
        return DI_ERROR_OUT_OF_MEMORY;
    }
    
    memset(self, 0, sizeof(DuckDBService));
    self->base.type_name = "DuckDBService";
    self->base.scope = DI_SCOPE_SINGLETON;
    self->db = NULL;
    self->conn = NULL;
    self->db_path = NULL;
    self->is_open = 0;
    self->error = NULL;
    
    logger_log(logger, "INFO", "DuckDBService created");
    
    *out_service = self;
    return DI_OK;
}

void duckdb_service_destroy(DI_Service* service) {
    if (!service) return;
    
    DuckDBService* self = (DuckDBService*)service;
    LoggerService* logger = logger_service_inject();
    
    if (self->conn) {
        duckdb_close(self);
    }
    
    if (logger) {
        logger_log(logger, "INFO", "DuckDBService destroyed");
    }
    
    free(self->error);
    free(self);
}
