/**
 * @file data_validation.h
 * @brief Data validation service for safe delete operations
 * 
 * Provides foreign key constraint checking and dependency validation
 * before allowing delete operations to maintain data integrity.
 */

#ifndef DATA_VALIDATION_H
#define DATA_VALIDATION_H

#include "services/sqlite_service.h"
#include <stdbool.h>

/**
 * @brief Validation result codes
 */
typedef enum {
    VALIDATION_OK = 0,              /* Deletion is safe */
    VALIDATION_HAS_DEPENDENCIES,    /* Cannot delete, has dependencies */
    VALIDATION_NOT_FOUND,           /* Record not found */
    VALIDATION_ERROR,               /* Validation error occurred */
    VALIDATION_SOFT_DELETE_ONLY     /* Must use soft delete */
} ValidationCode;

/**
 * @brief Dependency information
 */
typedef struct {
    const char* table;      /* Table that references this record */
    int count;              /* Number of referencing records */
    const char* message;    /* Human-readable message */
} DependencyInfo;

/**
 * @brief Validate if a user can be safely deleted
 * @param sqlite SQLite service instance
 * @param user_id User ID to validate
 * @param info Output dependency info (if has dependencies)
 * @return ValidationCode indicating if deletion is safe
 */
ValidationCode validate_user_delete(SQLiteService* sqlite, int user_id, DependencyInfo* info);

/**
 * @brief Validate if a category can be safely deleted
 * @param sqlite SQLite service instance
 * @param category_id Category ID to validate
 * @param info Output dependency info
 * @return ValidationCode indicating if deletion is safe
 */
ValidationCode validate_category_delete(SQLiteService* sqlite, int category_id, DependencyInfo* info);

/**
 * @brief Validate if a product can be safely deleted
 * @param sqlite SQLite service instance
 * @param product_id Product ID to validate
 * @param info Output dependency info
 * @return ValidationCode indicating if deletion is safe
 */
ValidationCode validate_product_delete(SQLiteService* sqlite, int product_id, DependencyInfo* info);

/**
 * @brief Validate if an order can be safely deleted
 * @param sqlite SQLite service instance
 * @param order_id Order ID to validate
 * @param info Output dependency info
 * @return ValidationCode indicating if deletion is safe
 */
ValidationCode validate_order_delete(SQLiteService* sqlite, int order_id, DependencyInfo* info);

/**
 * @brief Get human-readable error message for validation code
 * @param code The validation code
 * @return Static string message
 */
const char* validation_code_to_string(ValidationCode code);

/**
 * @brief Perform soft delete on a record (sets is_active = 0)
 * @param sqlite SQLite service instance
 * @param table Table name
 * @param id Record ID
 * @return true on success, false on failure
 */
bool soft_delete_record(SQLiteService* sqlite, const char* table, int id);

/**
 * @brief Check if a record exists
 * @param sqlite SQLite service instance
 * @param table Table name
 * @param id Record ID
 * @return true if exists, false otherwise
 */
bool record_exists(SQLiteService* sqlite, const char* table, int id);

#endif /* DATA_VALIDATION_H */
