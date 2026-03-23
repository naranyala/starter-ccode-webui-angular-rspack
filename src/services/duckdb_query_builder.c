/* DuckDB Query Builder Implementation */

#include "duckdb_query_builder.h"
#include "logger_service.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* ============================================================================
   HELPER FUNCTIONS
   ============================================================================ */

static char* safe_strdup(const char* str) {
    return str ? strdup(str) : NULL;
}

static void free_string_array(char** arr, int count) {
    if (!arr) return;
    for (int i = 0; i < count; i++) {
        free(arr[i]);
    }
    free(arr);
}

static const char* op_to_string(QBCompareOp op) {
    switch (op) {
        case QB_OP_EQ: return "=";
        case QB_OP_NE: return "!=";
        case QB_OP_LT: return "<";
        case QB_OP_LE: return "<=";
        case QB_OP_GT: return ">";
        case QB_OP_GE: return ">=";
        case QB_OP_LIKE: return "LIKE";
        case QB_OP_ILIKE: return "ILIKE";
        case QB_OP_IN: return "IN";
        case QB_OP_IS_NULL: return "IS NULL";
        case QB_OP_NOT_NULL: return "IS NOT NULL";
        default: return "=";
    }
}

static const char* join_type_to_string(QBJoinType type) {
    switch (type) {
        case QB_JOIN_INNER: return "INNER JOIN";
        case QB_JOIN_LEFT: return "LEFT JOIN";
        case QB_JOIN_RIGHT: return "RIGHT JOIN";
        case QB_JOIN_FULL: return "FULL JOIN";
        default: return "JOIN";
    }
}

static void set_error(QueryBuilder* qb, const char* format, ...) {
    if (!qb) return;
    
    char buffer[512];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    
    free(qb->error);
    qb->error = strdup(buffer);
    qb->success = false;
}

static void clear_error(QueryBuilder* qb) {
    if (!qb) return;
    free(qb->error);
    qb->error = NULL;
    qb->success = true;
}

/* ============================================================================
   QUERY BUILDER LIFECYCLE
   ============================================================================ */

QueryBuilder* qb_create(DuckDBService* db) {
    QueryBuilder* qb = (QueryBuilder*)calloc(1, sizeof(QueryBuilder));
    if (!qb) return NULL;
    
    qb->db = db;
    qb->success = true;
    qb->limit = -1;
    qb->offset = -1;
    
    return qb;
}

void qb_free(QueryBuilder* qb) {
    if (!qb) return;
    
    /* Free select columns */
    free_string_array(qb->select_columns, qb->select_count);
    
    /* Free table */
    free(qb->table);
    
    /* Free joins */
    free_string_array(qb->join_tables, qb->join_count);
    free(qb->join_types);
    free_string_array(qb->join_conditions, qb->join_count);
    
    /* Free where clauses */
    for (int i = 0; i < qb->where_count; i++) {
        free(qb->where_clauses[i].column);
        if (qb->where_clauses[i].value.type == QB_VALUE_STRING) {
            free(qb->where_clauses[i].value.string_val);
        }
    }
    free(qb->where_clauses);
    
    /* Free order by */
    for (int i = 0; i < qb->order_count; i++) {
        free(qb->order_by[i].column);
    }
    free(qb->order_by);
    
    /* Free insert values */
    free_string_array(qb->insert_columns, qb->insert_count);
    for (int i = 0; i < qb->insert_count; i++) {
        if (qb->insert_values[i].type == QB_VALUE_STRING) {
            free(qb->insert_values[i].string_val);
        }
    }
    free(qb->insert_values);
    
    /* Free update values */
    free_string_array(qb->update_columns, qb->update_count);
    for (int i = 0; i < qb->update_count; i++) {
        if (qb->update_values[i].type == QB_VALUE_STRING) {
            free(qb->update_values[i].string_val);
        }
    }
    free(qb->update_values);
    
    /* Free generated SQL */
    free(qb->generated_sql);
    
    /* Free error */
    free(qb->error);
    
    free(qb);
}

void qb_reset(QueryBuilder* qb) {
    if (!qb) return;
    
    /* Free select columns */
    free_string_array(qb->select_columns, qb->select_count);
    qb->select_columns = NULL;
    qb->select_count = 0;
    
    /* Free table */
    free(qb->table);
    qb->table = NULL;
    
    /* Free joins */
    free_string_array(qb->join_tables, qb->join_count);
    free(qb->join_types);
    free_string_array(qb->join_conditions, qb->join_count);
    qb->join_tables = NULL;
    qb->join_types = NULL;
    qb->join_conditions = NULL;
    qb->join_count = 0;
    
    /* Free where clauses */
    for (int i = 0; i < qb->where_count; i++) {
        free(qb->where_clauses[i].column);
        if (qb->where_clauses[i].value.type == QB_VALUE_STRING) {
            free(qb->where_clauses[i].value.string_val);
        }
    }
    free(qb->where_clauses);
    qb->where_clauses = NULL;
    qb->where_count = 0;
    
    /* Free order by */
    for (int i = 0; i < qb->order_count; i++) {
        free(qb->order_by[i].column);
    }
    free(qb->order_by);
    qb->order_by = NULL;
    qb->order_count = 0;
    
    qb->limit = -1;
    qb->offset = -1;
    
    /* Free generated SQL */
    free(qb->generated_sql);
    qb->generated_sql = NULL;
    
    clear_error(qb);
}

/* ============================================================================
   VALUE HELPERS
   ============================================================================ */

QBValue qb_value_str(const char* str) {
    QBValue val = {0};
    val.type = QB_VALUE_STRING;
    val.string_val = safe_strdup(str);
    return val;
}

QBValue qb_value_int(int val) {
    QBValue v = {0};
    v.type = QB_VALUE_INT;
    v.int_val = val;
    return v;
}

QBValue qb_value_double(double val) {
    QBValue v = {0};
    v.type = QB_VALUE_DOUBLE;
    v.double_val = val;
    return v;
}

QBValue qb_value_bool(bool val) {
    QBValue v = {0};
    v.type = QB_VALUE_BOOL;
    v.bool_val = val;
    return v;
}

QBValue qb_value_null(void) {
    QBValue v = {0};
    v.type = QB_VALUE_NULL;
    return v;
}

/* ============================================================================
   SELECT
   ============================================================================ */

QueryBuilder* qb_select(QueryBuilder* qb, const char* table) {
    if (!qb || !table) return qb;
    qb->table = safe_strdup(table);
    return qb;
}

QueryBuilder* qb_column(QueryBuilder* qb, const char* column) {
    if (!qb || !column) return qb;
    
    qb->select_count++;
    qb->select_columns = realloc(qb->select_columns, 
                                  qb->select_count * sizeof(char*));
    qb->select_columns[qb->select_count - 1] = safe_strdup(column);
    
    return qb;
}

QueryBuilder* qb_columns(QueryBuilder* qb, const char** columns) {
    if (!qb || !columns) return qb;
    
    for (int i = 0; columns[i] != NULL; i++) {
        qb_column(qb, columns[i]);
    }
    
    return qb;
}

QueryBuilder* qb_count(QueryBuilder* qb, const char* alias) {
    if (!qb) return qb;
    
    char col[128];
    if (alias) {
        snprintf(col, sizeof(col), "COUNT(*) AS %s", alias);
    } else {
        snprintf(col, sizeof(col), "COUNT(*)");
    }
    
    return qb_column(qb, col);
}

QueryBuilder* qb_sum(QueryBuilder* qb, const char* column, const char* alias) {
    if (!qb || !column) return qb;
    
    char col[256];
    if (alias) {
        snprintf(col, sizeof(col), "SUM(%s) AS %s", column, alias);
    } else {
        snprintf(col, sizeof(col), "SUM(%s)", column);
    }
    
    return qb_column(qb, col);
}

QueryBuilder* qb_avg(QueryBuilder* qb, const char* column, const char* alias) {
    if (!qb || !column) return qb;
    
    char col[256];
    if (alias) {
        snprintf(col, sizeof(col), "AVG(%s) AS %s", column, alias);
    } else {
        snprintf(col, sizeof(col), "AVG(%s)", column);
    }
    
    return qb_column(qb, col);
}

QueryBuilder* qb_max(QueryBuilder* qb, const char* column, const char* alias) {
    if (!qb || !column) return qb;
    
    char col[256];
    if (alias) {
        snprintf(col, sizeof(col), "MAX(%s) AS %s", column, alias);
    } else {
        snprintf(col, sizeof(col), "MAX(%s)", column);
    }
    
    return qb_column(qb, col);
}

QueryBuilder* qb_min(QueryBuilder* qb, const char* column, const char* alias) {
    if (!qb || !column) return qb;
    
    char col[256];
    if (alias) {
        snprintf(col, sizeof(col), "MIN(%s) AS %s", column, alias);
    } else {
        snprintf(col, sizeof(col), "MIN(%s)", column);
    }
    
    return qb_column(qb, col);
}

/* ============================================================================
   WHERE
   ============================================================================ */

static void add_where(QueryBuilder* qb, const char* column, QBCompareOp op, 
                      QBValue value, bool is_and) {
    if (!qb || !column) return;
    
    qb->where_count++;
    qb->where_clauses = realloc(qb->where_clauses, 
                                 qb->where_count * sizeof(QBWhere));
    
    QBWhere* w = &qb->where_clauses[qb->where_count - 1];
    w->column = safe_strdup(column);
    w->op = op;
    w->value = value;
    w->is_and = is_and;
}

QueryBuilder* qb_where(QueryBuilder* qb, const char* column, QBCompareOp op, QBValue value) {
    add_where(qb, column, op, value, true);
    return qb;
}

QueryBuilder* qb_where_eq_int(QueryBuilder* qb, const char* column, int value) {
    return qb_where(qb, column, QB_OP_EQ, qb_value_int(value));
}

QueryBuilder* qb_where_eq_str(QueryBuilder* qb, const char* column, const char* value) {
    return qb_where(qb, column, QB_OP_EQ, qb_value_str(value));
}

QueryBuilder* qb_where_like(QueryBuilder* qb, const char* column, const char* pattern) {
    return qb_where(qb, column, QB_OP_LIKE, qb_value_str(pattern));
}

QueryBuilder* qb_where_null(QueryBuilder* qb, const char* column) {
    return qb_where(qb, column, QB_OP_IS_NULL, qb_value_null());
}

QueryBuilder* qb_where_not_null(QueryBuilder* qb, const char* column) {
    return qb_where(qb, column, QB_OP_NOT_NULL, qb_value_null());
}

QueryBuilder* qb_and(QueryBuilder* qb, const char* column, QBCompareOp op, QBValue value) {
    add_where(qb, column, op, value, true);
    return qb;
}

QueryBuilder* qb_or(QueryBuilder* qb, const char* column, QBCompareOp op, QBValue value) {
    add_where(qb, column, op, value, false);
    return qb;
}

/* ============================================================================
   ORDER BY
   ============================================================================ */

QueryBuilder* qb_order_by(QueryBuilder* qb, const char* column, QBOrderDirection direction) {
    if (!qb || !column) return qb;
    
    qb->order_count++;
    qb->order_by = realloc(qb->order_by, qb->order_count * sizeof(QBOrderBy));
    
    qb->order_by[qb->order_count - 1].column = safe_strdup(column);
    qb->order_by[qb->order_count - 1].direction = direction;
    
    return qb;
}

QueryBuilder* qb_order_asc(QueryBuilder* qb, const char* column) {
    return qb_order_by(qb, column, QB_ORDER_ASC);
}

QueryBuilder* qb_order_desc(QueryBuilder* qb, const char* column) {
    return qb_order_by(qb, column, QB_ORDER_DESC);
}

/* ============================================================================
   LIMIT / OFFSET
   ============================================================================ */

QueryBuilder* qb_limit(QueryBuilder* qb, int limit) {
    if (!qb || limit < 0) return qb;
    qb->limit = limit;
    return qb;
}

QueryBuilder* qb_offset(QueryBuilder* qb, int offset) {
    if (!qb || offset < 0) return qb;
    qb->offset = offset;
    return qb;
}

QueryBuilder* qb_paginate(QueryBuilder* qb, int limit, int page) {
    if (!qb || limit <= 0 || page <= 0) return qb;
    qb->limit = limit;
    qb->offset = (page - 1) * limit;
    return qb;
}

/* ============================================================================
   SQL GENERATION
   ============================================================================ */

static char* value_to_sql(QBValue val) {
    char buffer[256];
    
    switch (val.type) {
        case QB_VALUE_NULL:
            return strdup("NULL");
        case QB_VALUE_INT:
            snprintf(buffer, sizeof(buffer), "%d", val.int_val);
            return strdup(buffer);
        case QB_VALUE_DOUBLE:
            snprintf(buffer, sizeof(buffer), "%f", val.double_val);
            return strdup(buffer);
        case QB_VALUE_BOOL:
            return strdup(val.bool_val ? "TRUE" : "FALSE");
        case QB_VALUE_STRING: {
            /* Escape single quotes */
            size_t len = strlen(val.string_val);
            char* escaped = malloc(len * 2 + 3);
            char* p = escaped;
            *p++ = '\'';
            for (size_t i = 0; i < len; i++) {
                if (val.string_val[i] == '\'') {
                    *p++ = '\'';
                    *p++ = '\'';
                } else {
                    *p++ = val.string_val[i];
                }
            }
            *p++ = '\'';
            *p = '\0';
            return escaped;
        }
        default:
            return strdup("NULL");
    }
}

static char* generate_select_sql(QueryBuilder* qb) {
    if (!qb || !qb->table) return NULL;
    
    char* sql = malloc(4096);
    char* p = sql;
    char* end = sql + 4096;
    
    /* SELECT */
    p += snprintf(p, end - p, "SELECT ");
    
    if (qb->select_count > 0) {
        for (int i = 0; i < qb->select_count; i++) {
            if (i > 0) p += snprintf(p, end - p, ", ");
            p += snprintf(p, end - p, "%s", qb->select_columns[i]);
        }
    } else {
        p += snprintf(p, end - p, "*");
    }
    
    /* FROM */
    p += snprintf(p, end - p, " FROM %s", qb->table);
    
    /* JOINs */
    for (int i = 0; i < qb->join_count; i++) {
        p += snprintf(p, end - p, " %s %s ON %s", 
                      join_type_to_string(qb->join_types[i]),
                      qb->join_tables[i],
                      qb->join_conditions[i]);
    }
    
    /* WHERE */
    if (qb->where_count > 0) {
        p += snprintf(p, end - p, " WHERE ");
        for (int i = 0; i < qb->where_count; i++) {
            QBWhere* w = &qb->where_clauses[i];
            
            if (i > 0) {
                p += snprintf(p, end - p, " %s ", w->is_and ? "AND" : "OR");
            }
            
            p += snprintf(p, end - p, "%s ", w->column);
            
            if (w->op == QB_OP_IS_NULL) {
                p += snprintf(p, end - p, "IS NULL");
            } else if (w->op == QB_OP_NOT_NULL) {
                p += snprintf(p, end - p, "IS NOT NULL");
            } else if (w->op == QB_OP_IN) {
                p += snprintf(p, end - p, "IN (...)");
            } else {
                char* val_sql = value_to_sql(w->value);
                p += snprintf(p, end - p, "%s %s", op_to_string(w->op), val_sql);
                free(val_sql);
            }
        }
    }
    
    /* ORDER BY */
    if (qb->order_count > 0) {
        p += snprintf(p, end - p, " ORDER BY ");
        for (int i = 0; i < qb->order_count; i++) {
            if (i > 0) p += snprintf(p, end - p, ", ");
            p += snprintf(p, end - p, "%s %s", 
                          qb->order_by[i].column,
                          qb->order_by[i].direction == QB_ORDER_ASC ? "ASC" : "DESC");
        }
    }
    
    /* LIMIT / OFFSET */
    if (qb->limit >= 0) {
        p += snprintf(p, end - p, " LIMIT %d", qb->limit);
    }
    if (qb->offset >= 0) {
        p += snprintf(p, end - p, " OFFSET %d", qb->offset);
    }
    
    p += snprintf(p, end - p, ";");
    
    return sql;
}

const char* qb_get_sql(QueryBuilder* qb) {
    if (!qb) return NULL;
    
    free(qb->generated_sql);
    qb->generated_sql = generate_select_sql(qb);
    
    return qb->generated_sql;
}

/* ============================================================================
   EXECUTION
   ============================================================================ */

DuckDBResult qb_execute_select(QueryBuilder* qb) {
    if (!qb || !qb->db) {
        DuckDBResult result = {0};
        result.success = 0;
        result.error = strdup("Invalid query builder");
        return result;
    }
    
    const char* sql = qb_get_sql(qb);
    if (!sql) {
        DuckDBResult result = {0};
        result.success = 0;
        result.error = strdup("Failed to generate SQL");
        return result;
    }
    
    LoggerService* logger = logger_service_inject();
    if (logger) {
        logger_log(logger, "DEBUG", "QB Execute: %s", sql);
    }
    
    return duckdb_query(qb->db, sql);
}

DuckDBResult qb_execute_single(QueryBuilder* qb) {
    qb_limit(qb, 1);
    return qb_execute_select(qb);
}

int qb_execute_count(QueryBuilder* qb) {
    DuckDBResult result = qb_execute_single(qb);
    if (result.success && result.row_count > 0 && result.column_count > 0) {
        int count = atoi(result.rows[0].values[0]);
        duckdb_free_result(&result);
        return count;
    }
    duckdb_free_result(&result);
    return 0;
}

const char* qb_get_error(QueryBuilder* qb) {
    if (!qb) return "Invalid query builder";
    return qb->error ? qb->error : "No error";
}

bool qb_is_valid(QueryBuilder* qb) {
    return qb && qb->success && !qb->error;
}
