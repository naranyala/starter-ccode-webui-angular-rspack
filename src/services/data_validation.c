/**
 * @file data_validation.c
 * @brief Data validation service implementation
 */

#include "data_validation.h"
#include "core/base_service.h"
#include <stdio.h>
#include <string.h>

/* ============================================================================
 * Helper Functions
 * ============================================================================ */

/**
 * @brief Check dependencies and return validation result
 */
static ValidationCode check_dependencies(SQLiteService* sqlite, 
                                         const char* check_sql, 
                                         DependencyInfo* info) {
    if (!sqlite || !check_sql || !info) {
        return VALIDATION_ERROR;
    }

    SQLiteResult result = sqlite_query(sqlite, check_sql);
    
    if (!result.success || result.row_count == 0) {
        sqlite_free_result(&result);
        return VALIDATION_OK;
    }

    /* Has dependencies */
    info->count = atoi(result.rows[0].values[0]);
    
    if (info->count > 0) {
        sqlite_free_result(&result);
        return VALIDATION_HAS_DEPENDENCIES;
    }

    sqlite_free_result(&result);
    return VALIDATION_OK;
}

/* ============================================================================
 * Public API Implementation
 * ============================================================================ */

ValidationCode validate_user_delete(SQLiteService* sqlite, int user_id, DependencyInfo* info) {
    VALIDATE_PTR(sqlite, VALIDATION_ERROR);
    VALIDATE_PTR(info, VALIDATION_ERROR);
    
    /* Initialize info */
    memset(info, 0, sizeof(DependencyInfo));
    
    /* Check if user exists */
    if (!record_exists(sqlite, "users", user_id)) {
        return VALIDATION_NOT_FOUND;
    }

    /* Check for orders referencing this user */
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "SELECT COUNT(*) FROM orders WHERE user_id = %d", user_id);
    
    info->table = "orders";
    info->message = "This user has associated orders. Delete orders first.";
    
    return check_dependencies(sqlite, sql, info);
}

ValidationCode validate_category_delete(SQLiteService* sqlite, int category_id, DependencyInfo* info) {
    VALIDATE_PTR(sqlite, VALIDATION_ERROR);
    VALIDATE_PTR(info, VALIDATION_ERROR);
    
    memset(info, 0, sizeof(DependencyInfo));
    
    /* Check if category exists */
    if (!record_exists(sqlite, "categories", category_id)) {
        return VALIDATION_NOT_FOUND;
    }

    /* Check for products in this category */
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "SELECT COUNT(*) FROM products WHERE category_id = %d", category_id);
    
    info->table = "products";
    info->message = "This category has associated products. Delete products first or reassign them.";
    
    return check_dependencies(sqlite, sql, info);
}

ValidationCode validate_product_delete(SQLiteService* sqlite, int product_id, DependencyInfo* info) {
    VALIDATE_PTR(sqlite, VALIDATION_ERROR);
    VALIDATE_PTR(info, VALIDATION_ERROR);
    
    memset(info, 0, sizeof(DependencyInfo));
    
    /* Check if product exists */
    if (!record_exists(sqlite, "products", product_id)) {
        return VALIDATION_NOT_FOUND;
    }

    /* Check for order items referencing this product */
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "SELECT COUNT(*) FROM order_items WHERE product_id = %d", product_id);
    
    info->table = "order_items";
    info->message = "This product is in existing orders. Cannot delete historical data.";
    
    return check_dependencies(sqlite, sql, info);
}

ValidationCode validate_order_delete(SQLiteService* sqlite, int order_id, DependencyInfo* info) {
    VALIDATE_PTR(sqlite, VALIDATION_ERROR);
    VALIDATE_PTR(info, VALIDATION_ERROR);
    
    memset(info, 0, sizeof(DependencyInfo));
    
    /* Check if order exists */
    if (!record_exists(sqlite, "orders", order_id)) {
        return VALIDATION_NOT_FOUND;
    }

    /* Check for order items (always has items if order exists) */
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "SELECT COUNT(*) FROM order_items WHERE order_id = %d", order_id);
    
    info->table = "order_items";
    info->message = "This order has items. Use cascade delete or clear items first.";
    
    return check_dependencies(sqlite, sql, info);
}

const char* validation_code_to_string(ValidationCode code) {
    switch (code) {
        case VALIDATION_OK:
            return "Deletion is safe";
        case VALIDATION_HAS_DEPENDENCIES:
            return "Cannot delete: has dependent records";
        case VALIDATION_NOT_FOUND:
            return "Record not found";
        case VALIDATION_ERROR:
            return "Validation error occurred";
        case VALIDATION_SOFT_DELETE_ONLY:
            return "Must use soft delete for this record";
        default:
            return "Unknown validation code";
    }
}

bool soft_delete_record(SQLiteService* sqlite, const char* table, int id) {
    VALIDATE_PTR(sqlite, false);
    VALIDATE_STR(table, false);
    
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "UPDATE %s SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = %d",
             table, id);
    
    return sqlite_execute(sqlite, sql);
}

bool record_exists(SQLiteService* sqlite, const char* table, int id) {
    VALIDATE_PTR(sqlite, false);
    VALIDATE_STR(table, false);
    
    char sql[256];
    snprintf(sql, sizeof(sql), 
             "SELECT COUNT(*) FROM %s WHERE id = %d", table, id);
    
    const char* result = sqlite_query_scalar(sqlite, sql);
    return result != NULL && atoi(result) > 0;
}
