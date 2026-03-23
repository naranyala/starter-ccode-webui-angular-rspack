/* SQL Query Builder Implementation - Chainable API for building SQL queries */

#include "sql_query_builder.h"
#include "sqlite_service.h"
#include "logger_service.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <stdarg.h>

static char g_sql_buffer[8192];

static void qb_set_error(QueryBuilder* self, const char* format, ...) {
    va_list args;
    va_start(args, format);
    vsnprintf(self->error, sizeof(self->error), format, args);
    va_end(args);
}

QueryBuilder* qb_create(SQLiteService* db) {
    QueryBuilder* self = calloc(1, sizeof(QueryBuilder));
    if (self) {
        self->db = db;
        qb_reset(self);
    }
    return self;
}

void qb_destroy(QueryBuilder* self) {
    free(self);
}

void qb_reset(QueryBuilder* self) {
    if (!self) return;
    self->state = QB_STATE_NONE;
    self->table[0] = '\0';
    self->select_cols[0] = '\0';
    self->from_table[0] = '\0';
    self->join_clause[0] = '\0';
    self->where_clause[0] = '\0';
    self->set_clause[0] = '\0';
    self->order_clause[0] = '\0';
    self->limit_val = 0;
    self->offset_val = 0;
    self->group_by[0] = '\0';
    self->having[0] = '\0';
    self->distinct = 0;
    self->error[0] = '\0';
    self->is_where_first = 1;
    self->is_set_first = 1;
}

QueryBuilder* qb_select(QueryBuilder* self, const char* cols) {
    if (!self || !cols) return NULL;
    qb_reset(self);
    self->state = QB_STATE_SELECT;
    snprintf(self->select_cols, sizeof(self->select_cols), "%s", cols);
    return self;
}

QueryBuilder* qb_select_distinct(QueryBuilder* self, const char* cols) {
    if (!qb_select(self, cols)) return NULL;
    self->distinct = 1;
    return self;
}

QueryBuilder* qb_from(QueryBuilder* self, const char* table) {
    if (!self || !table) return NULL;
    snprintf(self->from_table, sizeof(self->from_table), "%s", table);
    return self;
}

QueryBuilder* qb_insert(QueryBuilder* self, const char* table) {
    if (!self || !table) return NULL;
    qb_reset(self);
    self->state = QB_STATE_INSERT;
    snprintf(self->table, sizeof(self->table), "%s", table);
    return self;
}

QueryBuilder* qb_insert_or(QueryBuilder* self, const char* or_action, const char* table) {
    if (!self || !table) return NULL;
    qb_reset(self);
    self->state = QB_STATE_INSERT;
    snprintf(self->table, sizeof(self->table), "%s", table);
    if (or_action) {
        snprintf(self->select_cols, sizeof(self->select_cols), "INSERT OR %s", or_action);
    }
    return self;
}

QueryBuilder* qb_update(QueryBuilder* self, const char* table) {
    if (!self || !table) return NULL;
    qb_reset(self);
    self->state = QB_STATE_UPDATE;
    snprintf(self->table, sizeof(self->table), "%s", table);
    return self;
}

QueryBuilder* qb_delete(QueryBuilder* self, const char* table) {
    if (!self || !table) return NULL;
    qb_reset(self);
    self->state = QB_STATE_DELETE;
    snprintf(self->table, sizeof(self->table), "%s", table);
    return self;
}

QueryBuilder* qb_set(QueryBuilder* self, const char* col, const char* value) {
    if (!self || !col) return NULL;
    if (self->is_set_first) {
        self->is_set_first = 0;
        snprintf(self->set_clause, sizeof(self->set_clause), "%s = %s", col, value);
    } else {
        size_t len = strlen(self->set_clause);
        snprintf(self->set_clause + len, sizeof(self->set_clause) - len, ", %s = %s", col, value);
    }
    return self;
}

QueryBuilder* qb_set_int(QueryBuilder* self, const char* col, int value) {
    char val[32];
    snprintf(val, sizeof(val), "%d", value);
    return qb_set(self, col, val);
}

QueryBuilder* qb_set_int64(QueryBuilder* self, const char* col, long long value) {
    char val[64];
    snprintf(val, sizeof(val), "%lld", value);
    return qb_set(self, col, val);
}

QueryBuilder* qb_set_double(QueryBuilder* self, const char* col, double value) {
    char val[64];
    snprintf(val, sizeof(val), "%.6f", value);
    return qb_set(self, col, val);
}

QueryBuilder* qb_set_null(QueryBuilder* self, const char* col) {
    if (!self || !col) return NULL;
    if (self->is_set_first) {
        self->is_set_first = 0;
        snprintf(self->set_clause, sizeof(self->set_clause), "%s = NULL", col);
    } else {
        size_t len = strlen(self->set_clause);
        snprintf(self->set_clause + len, sizeof(self->set_clause) - len, ", %s = NULL", col);
    }
    return self;
}

static const char* op_to_str(QueryOperator op) {
    switch (op) {
        case QB_OP_EQ: return "=";
        case QB_OP_NE: return "<>";
        case QB_OP_GT: return ">";
        case QB_OP_GTE: return ">=";
        case QB_OP_LT: return "<";
        case QB_OP_LTE: return "<=";
        case QB_OP_LIKE: return "LIKE";
        case QB_OP_IN: return "IN";
        case QB_OP_NOT_IN: return "NOT IN";
        case QB_OP_IS_NULL: return "IS NULL";
        case QB_OP_IS_NOT_NULL: return "IS NOT NULL";
        default: return "=";
    }
}

QueryBuilder* qb_where(QueryBuilder* self, const char* col, QueryOperator op, const char* value) {
    if (!self || !col) return NULL;
    
    char cond[512];
    if (op == QB_OP_IS_NULL || op == QB_OP_IS_NOT_NULL) {
        snprintf(cond, sizeof(cond), "%s %s", col, op_to_str(op));
    } else if (op == QB_OP_IN || op == QB_OP_NOT_IN) {
        snprintf(cond, sizeof(cond), "%s %s %s", col, op_to_str(op), value);
    } else {
        snprintf(cond, sizeof(cond), "%s %s %s", col, op_to_str(op), value);
    }
    
    if (self->is_where_first) {
        self->is_where_first = 0;
        snprintf(self->where_clause, sizeof(self->where_clause), "%s", cond);
    } else {
        size_t len = strlen(self->where_clause);
        snprintf(self->where_clause + len, sizeof(self->where_clause) - len, " AND %s", cond);
    }
    return self;
}

QueryBuilder* qb_where_int(QueryBuilder* self, const char* col, QueryOperator op, int value) {
    char val[32];
    snprintf(val, sizeof(val), "%d", value);
    return qb_where(self, col, op, val);
}

QueryBuilder* qb_where_int64(QueryBuilder* self, const char* col, QueryOperator op, long long value) {
    char val[64];
    snprintf(val, sizeof(val), "%lld", value);
    return qb_where(self, col, op, val);
}

QueryBuilder* qb_and(QueryBuilder* self) {
    if (!self || self->is_where_first) return self;
    size_t len = strlen(self->where_clause);
    snprintf(self->where_clause + len, sizeof(self->where_clause) - len, " AND ");
    return self;
}

QueryBuilder* qb_or(QueryBuilder* self) {
    if (!self || self->is_where_first) return self;
    size_t len = strlen(self->where_clause);
    snprintf(self->where_clause + len, sizeof(self->where_clause) - len, " OR ");
    return self;
}

QueryBuilder* qb_join(QueryBuilder* self, const char* table, const char* on) {
    if (!self || !table || !on) return NULL;
    size_t len = strlen(self->join_clause);
    if (len == 0) {
        snprintf(self->join_clause, sizeof(self->join_clause), "INNER JOIN %s ON %s", table, on);
    } else {
        snprintf(self->join_clause + len, sizeof(self->join_clause) - len, 
                 " INNER JOIN %s ON %s", table, on);
    }
    return self;
}

QueryBuilder* qb_left_join(QueryBuilder* self, const char* table, const char* on) {
    if (!self || !table || !on) return NULL;
    size_t len = strlen(self->join_clause);
    if (len == 0) {
        snprintf(self->join_clause, sizeof(self->join_clause), "LEFT JOIN %s ON %s", table, on);
    } else {
        snprintf(self->join_clause + len, sizeof(self->join_clause) - len,
                 " LEFT JOIN %s ON %s", table, on);
    }
    return self;
}

QueryBuilder* qb_cross_join(QueryBuilder* self, const char* table) {
    if (!self || !table) return NULL;
    size_t len = strlen(self->join_clause);
    if (len == 0) {
        snprintf(self->join_clause, sizeof(self->join_clause), "CROSS JOIN %s", table);
    } else {
        snprintf(self->join_clause + len, sizeof(self->join_clause) - len,
                 ", %s", table);
    }
    return self;
}

QueryBuilder* qb_order_by(QueryBuilder* self, const char* cols) {
    if (!self || !cols) return NULL;
    snprintf(self->order_clause, sizeof(self->order_clause), "ORDER BY %s", cols);
    return self;
}

QueryBuilder* qb_order_by_desc(QueryBuilder* self, const char* cols) {
    if (!self || !cols) return NULL;
    snprintf(self->order_clause, sizeof(self->order_clause), "ORDER BY %s DESC", cols);
    return self;
}

QueryBuilder* qb_limit(QueryBuilder* self, int limit) {
    if (!self) return NULL;
    self->limit_val = limit;
    return self;
}

QueryBuilder* qb_offset(QueryBuilder* self, int offset) {
    if (!self) return NULL;
    self->offset_val = offset;
    return self;
}

QueryBuilder* qb_group_by(QueryBuilder* self, const char* cols) {
    if (!self || !cols) return NULL;
    snprintf(self->group_by, sizeof(self->group_by), "GROUP BY %s", cols);
    return self;
}

QueryBuilder* qb_having(QueryBuilder* self, const char* condition) {
    if (!self || !condition) return NULL;
    snprintf(self->having, sizeof(self->having), "HAVING %s", condition);
    return self;
}

const char* qb_build(QueryBuilder* self) {
    if (!self) return NULL;
    g_sql_buffer[0] = '\0';
    
    switch (self->state) {
        case QB_STATE_SELECT: {
            if (self->select_cols[0]) {
                snprintf(g_sql_buffer, sizeof(g_sql_buffer), "SELECT %s%s FROM %s",
                        self->distinct ? "DISTINCT " : "",
                        self->select_cols[0] ? self->select_cols : "*",
                        self->from_table);
            } else {
                snprintf(g_sql_buffer, sizeof(g_sql_buffer), "SELECT * FROM %s", self->from_table);
            }
            size_t len = strlen(g_sql_buffer);
            if (self->join_clause[0]) {
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " %s", self->join_clause);
                len = strlen(g_sql_buffer);
            }
            if (self->where_clause[0]) {
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " WHERE %s", self->where_clause);
                len = strlen(g_sql_buffer);
            }
            if (self->group_by[0]) {
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " %s", self->group_by);
                len = strlen(g_sql_buffer);
            }
            if (self->having[0]) {
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " %s", self->having);
                len = strlen(g_sql_buffer);
            }
            if (self->order_clause[0]) {
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " %s", self->order_clause);
                len = strlen(g_sql_buffer);
            }
            if (self->limit_val > 0) {
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " LIMIT %d", self->limit_val);
                len = strlen(g_sql_buffer);
            }
            if (self->offset_val > 0) {
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " OFFSET %d", self->offset_val);
            }
            break;
        }
        case QB_STATE_INSERT: {
            if (self->select_cols[0]) {
                snprintf(g_sql_buffer, sizeof(g_sql_buffer), "INSERT OR %s INTO %s SET %s",
                        self->select_cols, self->table, self->set_clause);
            } else {
                snprintf(g_sql_buffer, sizeof(g_sql_buffer), "INSERT INTO %s SET %s",
                        self->table, self->set_clause);
            }
            break;
        }
        case QB_STATE_UPDATE: {
            snprintf(g_sql_buffer, sizeof(g_sql_buffer), "UPDATE %s SET %s", self->table, self->set_clause);
            if (self->where_clause[0]) {
                size_t len = strlen(g_sql_buffer);
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " WHERE %s", self->where_clause);
            }
            if (self->limit_val > 0) {
                size_t len = strlen(g_sql_buffer);
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " LIMIT %d", self->limit_val);
            }
            break;
        }
        case QB_STATE_DELETE: {
            snprintf(g_sql_buffer, sizeof(g_sql_buffer), "DELETE FROM %s", self->table);
            if (self->where_clause[0]) {
                size_t len = strlen(g_sql_buffer);
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " WHERE %s", self->where_clause);
            }
            if (self->limit_val > 0) {
                size_t len = strlen(g_sql_buffer);
                snprintf(g_sql_buffer + len, sizeof(g_sql_buffer) - len, " LIMIT %d", self->limit_val);
            }
            break;
        }
        default:
            break;
    }
    
    return g_sql_buffer;
}

SQLiteResult qb_exec(QueryBuilder* self) {
    if (!self || !self->db) {
        SQLiteResult empty = {0};
        return empty;
    }
    const char* sql = qb_build(self);
    if (!sql || !sql[0]) {
        SQLiteResult empty = {0};
        return empty;
    }
    return sqlite_query(self->db, sql);
}

SQLiteResult qb_exec_one(QueryBuilder* self) {
    qb_limit(self, 1);
    return qb_exec(self);
}

const char* qb_exec_scalar(QueryBuilder* self) {
    SQLiteResult result = qb_exec(self);
    if (result.row_count > 0 && result.columns > 0) {
        return result.data[0];
    }
    return NULL;
}

const char* qb_error(QueryBuilder* self) {
    return self ? self->error : "NULL builder";
}

int qb_count(QueryBuilder* self, const char* table) {
    if (!self || !table || !self->db) return 0;
    QueryBuilder tmp = {0};
    tmp.db = self->db;
    tmp.state = QB_STATE_SELECT;
    snprintf(tmp.select_cols, sizeof(tmp.select_cols), "COUNT(*)");
    snprintf(tmp.from_table, sizeof(tmp.from_table), "%s", table);
    SQLiteResult result = qb_exec(&tmp);
    if (result.row_count > 0) {
        return atoi(result.data[0]);
    }
    return 0;
}

int qb_exists(QueryBuilder* self, const char* table, const char* where_col, const char* where_val) {
    if (!self || !table || !where_col || !where_val) return 0;
    QueryBuilder tmp = {0};
    tmp.db = self->db;
    qb_select(&tmp, "1");
    qb_from(&tmp, table);
    qb_where(&tmp, where_col, QB_OP_EQ, where_val);
    SQLiteResult result = qb_exec(&tmp);
    return result.row_count > 0;
}

long long qb_last_insert_rowid(QueryBuilder* self) {
    if (!self || !self->db) return 0;
    const char* sql = "SELECT last_insert_rowid()";
    SQLiteResult result = sqlite_query(self->db, sql);
    if (result.row_count > 0) {
        return atoll(result.data[0]);
    }
    return 0;
}
