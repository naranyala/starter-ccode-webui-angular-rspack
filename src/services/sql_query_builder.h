/* SQL Query Builder - Chainable API for building SQL queries */

#ifndef SQL_QUERY_BUILDER_H
#define SQL_QUERY_BUILDER_H

#include <stdbool.h>
#include <stddef.h>

/* Forward declarations */
typedef struct SQLiteService SQLiteService;
struct SQLiteResult;
typedef struct SQLiteResult SQLiteResult;

/* Query builder states */
typedef enum {
    QB_STATE_NONE,
    QB_STATE_SELECT,
    QB_STATE_INSERT,
    QB_STATE_UPDATE,
    QB_STATE_DELETE
} QueryBuilderState;

/* Comparison operators */
typedef enum {
    QB_OP_EQ,
    QB_OP_NE,
    QB_OP_GT,
    QB_OP_GTE,
    QB_OP_LT,
    QB_OP_LTE,
    QB_OP_LIKE,
    QB_OP_IN,
    QB_OP_NOT_IN,
    QB_OP_IS_NULL,
    QB_OP_IS_NOT_NULL
} QueryOperator;

/* SQL Query Builder */
typedef struct {
    SQLiteService* db;
    QueryBuilderState state;
    char table[128];
    char select_cols[512];
    char from_table[128];
    char join_clause[1024];
    char where_clause[1024];
    char set_clause[1024];
    char order_clause[256];
    int limit_val;
    int offset_val;
    char group_by[256];
    char having[512];
    int distinct;
    char error[512];
    int is_where_first;
    int is_set_first;
} QueryBuilder;

/* Create query builder */
QueryBuilder* qb_create(SQLiteService* db);

/* Free query builder */
void qb_destroy(QueryBuilder* self);

/* Reset builder */
void qb_reset(QueryBuilder* self);

/* ==================== SELECT ==================== */

/* Start SELECT - columns: "col1, col2" or "*" */
QueryBuilder* qb_select(QueryBuilder* self, const char* cols);

/* SELECT DISTINCT */
QueryBuilder* qb_select_distinct(QueryBuilder* self, const char* cols);

/* From table */
QueryBuilder* qb_from(QueryBuilder* self, const char* table);

/* ==================== INSERT ==================== */

/* INSERT INTO table */
QueryBuilder* qb_insert(QueryBuilder* self, const char* table);

/* INSERT OR REPLACE/IGNORE/etc */
QueryBuilder* qb_insert_or(QueryBuilder* self, const char* or_action, const char* table);

/* ==================== UPDATE ==================== */

/* UPDATE table */
QueryBuilder* qb_update(QueryBuilder* self, const char* table);

/* ==================== DELETE ==================== */

/* DELETE FROM table */
QueryBuilder* qb_delete(QueryBuilder* self, const char* table);

/* ==================== SET (for UPDATE/INSERT) ==================== */

/* SET col = 'value' */
QueryBuilder* qb_set(QueryBuilder* self, const char* col, const char* value);

/* SET col = value (integer) */
QueryBuilder* qb_set_int(QueryBuilder* self, const char* col, int value);

/* SET col = value (64-bit integer) */
QueryBuilder* qb_set_int64(QueryBuilder* self, const char* col, long long value);

/* SET col = value (double) */
QueryBuilder* qb_set_double(QueryBuilder* self, const char* col, double value);

/* SET col = NULL */
QueryBuilder* qb_set_null(QueryBuilder* self, const char* col);

/* ==================== WHERE ==================== */

/* WHERE col = 'value' */
QueryBuilder* qb_where(QueryBuilder* self, const char* col, QueryOperator op, const char* value);

/* WHERE col = value (integer) */
QueryBuilder* qb_where_int(QueryBuilder* self, const char* col, QueryOperator op, int value);

/* WHERE col = value (64-bit integer) */
QueryBuilder* qb_where_int64(QueryBuilder* self, const char* col, QueryOperator op, long long value);

/* AND (opens new condition group) */
QueryBuilder* qb_and(QueryBuilder* self);

/* OR (opens new condition group) */
QueryBuilder* qb_or(QueryBuilder* self);

/* ==================== JOIN ==================== */

/* INNER JOIN table ON condition */
QueryBuilder* qb_join(QueryBuilder* self, const char* table, const char* on);

/* LEFT JOIN table ON condition */
QueryBuilder* qb_left_join(QueryBuilder* self, const char* table, const char* on);

/* CROSS JOIN table */
QueryBuilder* qb_cross_join(QueryBuilder* self, const char* table);

/* ==================== ORDER BY ==================== */

/* ORDER BY col1, col2 */
QueryBuilder* qb_order_by(QueryBuilder* self, const char* cols);

/* ORDER BY col1 DESC, col2 */
QueryBuilder* qb_order_by_desc(QueryBuilder* self, const char* cols);

/* ==================== LIMIT/OFFSET ==================== */

/* LIMIT n */
QueryBuilder* qb_limit(QueryBuilder* self, int limit);

/* OFFSET n */
QueryBuilder* qb_offset(QueryBuilder* self, int offset);

/* ==================== GROUP BY ==================== */

/* GROUP BY cols */
QueryBuilder* qb_group_by(QueryBuilder* self, const char* cols);

/* HAVING condition */
QueryBuilder* qb_having(QueryBuilder* self, const char* condition);

/* ==================== EXECUTE ==================== */

/* Build SQL string (returns internal buffer, valid until next call) */
const char* qb_build(QueryBuilder* self);

/* Execute query and return results */
SQLiteResult qb_exec(QueryBuilder* self);

/* Execute and return first row only */
SQLiteResult qb_exec_one(QueryBuilder* self);

/* Execute and return single value (first col of first row) */
const char* qb_exec_scalar(QueryBuilder* self);

/* Get last error */
const char* qb_error(QueryBuilder* self);

/* ==================== CONVENIENCE METHODS ==================== */

/* Count rows */
int qb_count(QueryBuilder* self, const char* table);

/* Check if record exists */
int qb_exists(QueryBuilder* self, const char* table, const char* where_col, const char* where_val);

/* Get last inserted ID */
long long qb_last_insert_rowid(QueryBuilder* self);

#endif /* SQL_QUERY_BUILDER_H */
