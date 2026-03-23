/* DuckDB Query Builder - Fluent API for common operations */

#ifndef DUCKDB_QUERY_BUILDER_H
#define DUCKDB_QUERY_BUILDER_H

#include "services/duckdb_service.h"
#include <stdbool.h>

/* ============================================================================
   QUERY BUILDER STRUCTURES
   ============================================================================ */

/* Comparison operators */
typedef enum {
    QB_OP_EQ,      /* = */
    QB_OP_NE,      /* != */
    QB_OP_LT,      /* < */
    QB_OP_LE,      /* <= */
    QB_OP_GT,      /* > */
    QB_OP_GE,      /* >= */
    QB_OP_LIKE,    /* LIKE */
    QB_OP_ILIKE,   /* ILIKE (case-insensitive) */
    QB_OP_IN,      /* IN */
    QB_OP_IS_NULL, /* IS NULL */
    QB_OP_NOT_NULL /* IS NOT NULL */
} QBCompareOp;

/* Join types */
typedef enum {
    QB_JOIN_INNER,
    QB_JOIN_LEFT,
    QB_JOIN_RIGHT,
    QB_JOIN_FULL
} QBJoinType;

/* Order direction */
typedef enum {
    QB_ORDER_ASC,
    QB_ORDER_DESC
} QBOrderDirection;

/* Value types */
typedef enum {
    QB_VALUE_NULL,
    QB_VALUE_INT,
    QB_VALUE_DOUBLE,
    QB_VALUE_STRING,
    QB_VALUE_BOOL
} QBValueType;

/* Query builder value */
typedef struct {
    QBValueType type;
    union {
        int int_val;
        double double_val;
        char* string_val;
        bool bool_val;
    };
} QBValue;

/* Where condition */
typedef struct {
    char* column;
    QBCompareOp op;
    QBValue value;
    bool is_and;  /* true = AND, false = OR */
} QBWhere;

/* Order by clause */
typedef struct {
    char* column;
    QBOrderDirection direction;
} QBOrderBy;

/* Query builder structure */
typedef struct {
    /* Query components */
    char** select_columns;
    int select_count;
    
    char* table;
    char** join_tables;
    QBJoinType* join_types;
    char** join_conditions;
    int join_count;
    
    QBWhere* where_clauses;
    int where_count;
    
    QBOrderBy* order_by;
    int order_count;
    
    int limit;
    int offset;
    
    /* For INSERT/UPDATE */
    char** insert_columns;
    QBValue* insert_values;
    int insert_count;
    
    char** update_columns;
    QBValue* update_values;
    int update_count;
    
    /* State */
    char* error;
    bool success;
    
    /* Internal */
    DuckDBService* db;
    char* generated_sql;
} QueryBuilder;

/* ============================================================================
   QUERY BUILDER API
   ============================================================================ */

/**
 * Create a new query builder
 * @param db DuckDB service instance
 * @return Query builder instance
 */
QueryBuilder* qb_create(DuckDBService* db);

/**
 * Free query builder
 * @param qb Query builder to free
 */
void qb_free(QueryBuilder* qb);

/* ==================== SELECT ==================== */

/**
 * Start a SELECT query
 * @param qb Query builder
 * @param table Table name
 * @return Query builder (fluent)
 */
QueryBuilder* qb_select(QueryBuilder* qb, const char* table);

/**
 * Add columns to SELECT
 * @param qb Query builder
 * @param columns Column names (NULL-terminated array)
 * @return Query builder (fluent)
 */
QueryBuilder* qb_columns(QueryBuilder* qb, const char** columns);

/**
 * Add a single column to SELECT
 * @param qb Query builder
 * @param column Column name (can use "col AS alias")
 * @return Query builder (fluent)
 */
QueryBuilder* qb_column(QueryBuilder* qb, const char* column);

/**
 * Add COUNT(*) aggregation
 * @param qb Query builder
 * @param alias Alias for count (e.g., "total")
 * @return Query builder (fluent)
 */
QueryBuilder* qb_count(QueryBuilder* qb, const char* alias);

/**
 * Add SUM aggregation
 * @param qb Query builder
 * @param column Column to sum
 * @param alias Alias for result
 * @return Query builder (fluent)
 */
QueryBuilder* qb_sum(QueryBuilder* qb, const char* column, const char* alias);

/**
 * Add AVG aggregation
 * @param qb Query builder
 * @param column Column to average
 * @param alias Alias for result
 * @return Query builder (fluent)
 */
QueryBuilder* qb_avg(QueryBuilder* qb, const char* column, const char* alias);

/**
 * Add MAX aggregation
 * @param qb Query builder
 * @param column Column for max
 * @param alias Alias for result
 * @return Query builder (fluent)
 */
QueryBuilder* qb_max(QueryBuilder* qb, const char* column, const char* alias);

/**
 * Add MIN aggregation
 * @param qb Query builder
 * @param column Column for min
 * @param alias Alias for result
 * @return Query builder (fluent)
 */
QueryBuilder* qb_min(QueryBuilder* qb, const char* column, const char* alias);

/**
 * Add GROUP BY clause
 * @param qb Query builder
 * @param columns Columns to group by (NULL-terminated array)
 * @return Query builder (fluent)
 */
QueryBuilder* qb_group_by(QueryBuilder* qb, const char** columns);

/* ==================== JOIN ==================== */

/**
 * Add JOIN clause
 * @param qb Query builder
 * @param type Join type
 * @param table Table to join
 * @param condition Join condition (e.g., "a.id = b.a_id")
 * @return Query builder (fluent)
 */
QueryBuilder* qb_join(QueryBuilder* qb, QBJoinType type, const char* table, const char* condition);

/**
 * Add INNER JOIN
 * @param qb Query builder
 * @param table Table to join
 * @param condition Join condition
 * @return Query builder (fluent)
 */
QueryBuilder* qb_inner_join(QueryBuilder* qb, const char* table, const char* condition);

/**
 * Add LEFT JOIN
 * @param qb Query builder
 * @param table Table to join
 * @param condition Join condition
 * @return Query builder (fluent)
 */
QueryBuilder* qb_left_join(QueryBuilder* qb, const char* table, const char* condition);

/* ==================== WHERE ==================== */

/**
 * Add WHERE condition
 * @param qb Query builder
 * @param column Column name
 * @param op Comparison operator
 * @param value Value to compare
 * @return Query builder (fluent)
 */
QueryBuilder* qb_where(QueryBuilder* qb, const char* column, QBCompareOp op, QBValue value);

/**
 * Add WHERE column = value
 * @param qb Query builder
 * @param column Column name
 * @param value Integer value
 * @return Query builder (fluent)
 */
QueryBuilder* qb_where_eq_int(QueryBuilder* qb, const char* column, int value);

/**
 * Add WHERE column = value
 * @param qb Query builder
 * @param column Column name
 * @param value String value
 * @return Query builder (fluent)
 */
QueryBuilder* qb_where_eq_str(QueryBuilder* qb, const char* column, const char* value);

/**
 * Add WHERE column LIKE value
 * @param qb Query builder
 * @param column Column name
 * @param pattern LIKE pattern (use % as wildcard)
 * @return Query builder (fluent)
 */
QueryBuilder* qb_where_like(QueryBuilder* qb, const char* column, const char* pattern);

/**
 * Add WHERE column IN (...)
 * @param qb Query builder
 * @param column Column name
 * @param values Array of integer values
 * @param count Number of values
 * @return Query builder (fluent)
 */
QueryBuilder* qb_where_in_int(QueryBuilder* qb, const char* column, int* values, int count);

/**
 * Add WHERE column IS NULL
 * @param qb Query builder
 * @param column Column name
 * @return Query builder (fluent)
 */
QueryBuilder* qb_where_null(QueryBuilder* qb, const char* column);

/**
 * Add WHERE column IS NOT NULL
 * @param qb Query builder
 * @param column Column name
 * @return Query builder (fluent)
 */
QueryBuilder* qb_where_not_null(QueryBuilder* qb, const char* column);

/**
 * Add AND condition
 * @param qb Query builder
 * @param column Column name
 * @param op Comparison operator
 * @param value Value to compare
 * @return Query builder (fluent)
 */
QueryBuilder* qb_and(QueryBuilder* qb, const char* column, QBCompareOp op, QBValue value);

/**
 * Add OR condition
 * @param qb Query builder
 * @param column Column name
 * @param op Comparison operator
 * @param value Value to compare
 * @return Query builder (fluent)
 */
QueryBuilder* qb_or(QueryBuilder* qb, const char* column, QBCompareOp op, QBValue value);

/* ==================== ORDER BY ==================== */

/**
 * Add ORDER BY clause
 * @param qb Query builder
 * @param column Column to order by
 * @param direction Order direction
 * @return Query builder (fluent)
 */
QueryBuilder* qb_order_by(QueryBuilder* qb, const char* column, QBOrderDirection direction);

/**
 * Add ORDER BY ASC
 * @param qb Query builder
 * @param column Column to order by
 * @return Query builder (fluent)
 */
QueryBuilder* qb_order_asc(QueryBuilder* qb, const char* column);

/**
 * Add ORDER BY DESC
 * @param qb Query builder
 * @param column Column to order by
 * @return Query builder (fluent)
 */
QueryBuilder* qb_order_desc(QueryBuilder* qb, const char* column);

/* ==================== LIMIT/OFFSET ==================== */

/**
 * Add LIMIT clause
 * @param qb Query builder
 * @param limit Maximum rows to return
 * @return Query builder (fluent)
 */
QueryBuilder* qb_limit(QueryBuilder* qb, int limit);

/**
 * Add OFFSET clause
 * @param qb Query builder
 * @param offset Number of rows to skip
 * @return Query builder (fluent)
 */
QueryBuilder* qb_offset(QueryBuilder* qb, int offset);

/**
 * Add LIMIT and OFFSET (for pagination)
 * @param qb Query builder
 * @param limit Rows per page
 * @param page Page number (1-based)
 * @return Query builder (fluent)
 */
QueryBuilder* qb_paginate(QueryBuilder* qb, int limit, int page);

/* ==================== INSERT ==================== */

/**
 * Start an INSERT query
 * @param qb Query builder
 * @param table Table name
 * @return Query builder (fluent)
 */
QueryBuilder* qb_insert_into(QueryBuilder* qb, const char* table);

/**
 * Add values for INSERT
 * @param qb Query builder
 * @param columns Column names
 * @param values Values to insert
 * @param count Number of columns
 * @return Query builder (fluent)
 */
QueryBuilder* qb_insert_values(QueryBuilder* qb, const char** columns, QBValue* values, int count);

/**
 * Helper to create a string value
 * @param str String value
 * @return QBValue
 */
QBValue qb_value_str(const char* str);

/**
 * Helper to create an integer value
 * @param val Integer value
 * @return QBValue
 */
QBValue qb_value_int(int val);

/**
 * Helper to create a double value
 * @param val Double value
 * @return QBValue
 */
QBValue qb_value_double(double val);

/**
 * Helper to create a boolean value
 * @param val Boolean value
 * @return QBValue
 */
QBValue qb_value_bool(bool val);

/**
 * Helper to create a NULL value
 * @return QBValue
 */
QBValue qb_value_null(void);

/* ==================== UPDATE ==================== */

/**
 * Start an UPDATE query
 * @param qb Query builder
 * @param table Table name
 * @return Query builder (fluent)
 */
QueryBuilder* qb_update(QueryBuilder* qb, const char* table);

/**
 * Add SET clause for UPDATE
 * @param qb Query builder
 * @param columns Column names
 * @param values New values
 * @param count Number of columns
 * @return Query builder (fluent)
 */
QueryBuilder* qb_set(QueryBuilder* qb, const char** columns, QBValue* values, int count);

/**
 * Add SET column = value
 * @param qb Query builder
 * @param column Column name
 * @param value New value
 * @return Query builder (fluent)
 */
QueryBuilder* qb_set_str(QueryBuilder* qb, const char* column, const char* value);

/**
 * Add SET column = value
 * @param qb Query builder
 * @param column Column name
 * @param value New integer value
 * @return Query builder (fluent)
 */
QueryBuilder* qb_set_int(QueryBuilder* qb, const char* column, int value);

/* ==================== DELETE ==================== */

/**
 * Start a DELETE query
 * @param qb Query builder
 * @param table Table name
 * @return Query builder (fluent)
 */
QueryBuilder* qb_delete_from(QueryBuilder* qb, const char* table);

/* ==================== EXECUTION ==================== */

/**
 * Execute SELECT query
 * @param qb Query builder
 * @return Query result
 */
DuckDBResult qb_execute_select(QueryBuilder* qb);

/**
 * Execute INSERT query and return new ID
 * @param qb Query builder
 * @return New row ID, or -1 on error
 */
long long qb_execute_insert(QueryBuilder* qb);

/**
 * Execute UPDATE query
 * @param qb Query builder
 * @return Number of rows affected
 */
int qb_execute_update(QueryBuilder* qb);

/**
 * Execute DELETE query
 * @param qb Query builder
 * @return Number of rows deleted
 */
int qb_execute_delete(QueryBuilder* qb);

/**
 * Execute and get single row
 * @param qb Query builder
 * @return Single row result
 */
DuckDBResult qb_execute_single(QueryBuilder* qb);

/**
 * Execute and get count
 * @param qb Query builder
 * @return Count value
 */
int qb_execute_count(QueryBuilder* qb);

/* ==================== UTILITIES ==================== */

/**
 * Get generated SQL
 * @param qb Query builder
 * @return SQL string
 */
const char* qb_get_sql(QueryBuilder* qb);

/**
 * Get last error
 * @param qb Query builder
 * @return Error message
 */
const char* qb_get_error(QueryBuilder* qb);

/**
 * Check if query is valid
 * @param qb Query builder
 * @return true if valid
 */
bool qb_is_valid(QueryBuilder* qb);

/**
 * Reset query builder for reuse
 * @param qb Query builder
 */
void qb_reset(QueryBuilder* qb);

#endif /* DUCKDB_QUERY_BUILDER_H */
