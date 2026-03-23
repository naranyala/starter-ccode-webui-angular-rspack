/* Error Handling Service - Centralized error tracking and reporting */

#ifndef ERROR_SERVICE_H
#define ERROR_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <time.h>

/* Error severity levels */
typedef enum {
    ERROR_SEVERITY_LOW = 0,
    ERROR_SEVERITY_MEDIUM = 1,
    ERROR_SEVERITY_HIGH = 2,
    ERROR_SEVERITY_CRITICAL = 3
} ErrorSeverity;

/* Error types */
typedef enum {
    ERROR_TYPE_APPLICATION = 0,
    ERROR_TYPE_VALIDATION = 1,
    ERROR_TYPE_AUTHENTICATION = 2,
    ERROR_TYPE_AUTHORIZATION = 3,
    ERROR_TYPE_NETWORK = 4,
    ERROR_TYPE_DATABASE = 5,
    ERROR_TYPE_FILESYSTEM = 6,
    ERROR_TYPE_UNKNOWN = 7
} ErrorType;

/* Error context */
typedef struct {
    char* user_id;
    char* session_id;
    char* request_id;
    char* ip_address;
    char* user_agent;
    char* stack_trace;
    int line_number;
    char* file_name;
    char* function_name;
} ErrorContext;

/* Error record */
typedef struct {
    long long id;
    ErrorType type;
    ErrorSeverity severity;
    char* message;
    char* code;
    time_t timestamp;
    ErrorContext* context;
    int is_reported;
    int is_resolved;
} ErrorRecord;

/* Error handler callback */
typedef void (*error_handler_fn)(const ErrorRecord* error, void* user_data);

/* Error service configuration */
typedef struct {
    const char* log_file_path;
    int max_errors_in_memory;
    bool auto_report;
    bool include_stack_trace;
    error_handler_fn global_handler;
    void* handler_user_data;
} ErrorServiceConfig;

typedef struct ErrorService {
    DI_Service base;
    ErrorRecord** errors;  /* Array of pointers */
    int error_count;
    int error_capacity;
    int max_errors;
    bool auto_report;
    bool include_stack_trace;
    error_handler_fn global_handler;
    void* handler_user_data;
    char* log_file_path;
} ErrorService;

/* Forward declarations for DI system */
DI_Error error_service_provider(DI_Container* container, void** out_service);
void error_service_destroy(DI_Service* service);

/* Accessor function */
ErrorService* error_service_inject(void);

/* ==================== Initialization ==================== */

/**
 * Initialize error service with configuration
 * @param self Error service instance
 * @param config Configuration options
 * @return 1 on success, 0 on failure
 */
int error_service_init(ErrorService* self, const ErrorServiceConfig* config);

/**
 * Initialize error service with defaults
 * @param self Error service instance
 * @return 1 on success, 0 on failure
 */
int error_service_init_default(ErrorService* self);

/* ==================== Error Reporting ==================== */

/**
 * Report an error
 * @param self Error service instance
 * @param type Error type
 * @param severity Error severity
 * @param message Error message
 * @param error_code Optional error code
 * @return Error record ID, or -1 on failure
 */
long long error_report(ErrorService* self, ErrorType type, ErrorSeverity severity,
                       const char* message, const char* error_code);

/**
 * Report an application error
 * @param self Error service instance
 * @param message Error message
 * @return Error record ID
 */
long long error_report_app(ErrorService* self, const char* message);

/**
 * Report a validation error
 * @param self Error service instance
 * @param message Error message
 * @return Error record ID
 */
long long error_report_validation(ErrorService* self, const char* message);

/**
 * Report an authentication error
 * @param self Error service instance
 * @param message Error message
 * @return Error record ID
 */
long long error_report_auth(ErrorService* self, const char* message);

/**
 * Report a network error
 * @param self Error service instance
 * @param message Error message
 * @return Error record ID
 */
long long error_report_network(ErrorService* self, const char* message);

/**
 * Report a database error
 * @param self Error service instance
 * @param message Error message
 * @return Error record ID
 */
long long error_report_database(ErrorService* self, const char* message);

/**
 * Report a critical error
 * @param self Error service instance
 * @param message Error message
 * @return Error record ID
 */
long long error_report_critical(ErrorService* self, const char* message);

/* ==================== Error with Context ==================== */

/**
 * Report error with context information
 * @param self Error service instance
 * @param type Error type
 * @param severity Error severity
 * @param message Error message
 * @param context Error context
 * @return Error record ID
 */
long long error_report_with_context(ErrorService* self, ErrorType type, ErrorSeverity severity,
                                    const char* message, const ErrorContext* context);

/* ==================== Error Retrieval ==================== */

/**
 * Get error by ID
 * @param self Error service instance
 * @param error_id Error ID
 * @return Error record, or NULL if not found
 */
const ErrorRecord* error_get_by_id(ErrorService* self, long long error_id);

/**
 * Get all errors
 * @param self Error service instance
 * @param count Output parameter for number of errors
 * @return Array of error records
 */
const ErrorRecord* error_get_all(ErrorService* self, int* count);

/**
 * Get errors by type
 * @param self Error service instance
 * @param type Error type to filter
 * @param count Output parameter for number of errors
 * @return Array of error records
 */
const ErrorRecord* error_get_by_type(ErrorService* self, ErrorType type, int* count);

/**
 * Get errors by severity
 * @param self Error service instance
 * @param severity Minimum severity
 * @param count Output parameter for number of errors
 * @return Array of error records
 */
const ErrorRecord* error_get_by_severity(ErrorService* self, ErrorSeverity severity, int* count);

/**
 * Get unreported errors
 * @param self Error service instance
 * @param count Output parameter for number of errors
 * @return Array of error records
 */
const ErrorRecord* error_get_unreported(ErrorService* self, int* count);

/* ==================== Error Management ==================== */

/**
 * Mark error as reported
 * @param self Error service instance
 * @param error_id Error ID
 * @return 1 on success, 0 on failure
 */
int error_mark_reported(ErrorService* self, long long error_id);

/**
 * Mark error as resolved
 * @param self Error service instance
 * @param error_id Error ID
 * @return 1 on success, 0 on failure
 */
int error_mark_resolved(ErrorService* self, long long error_id);

/**
 * Clear all errors
 * @param self Error service instance
 */
void error_clear_all(ErrorService* self);

/**
 * Clear reported errors
 * @param self Error service instance
 */
void error_clear_reported(ErrorService* self);

/* ==================== Error Persistence ==================== */

/**
 * Save errors to file
 * @param self Error service instance
 * @param path File path
 * @return 1 on success, 0 on failure
 */
int error_save_to_file(ErrorService* self, const char* path);

/**
 * Load errors from file
 * @param self Error service instance
 * @param path File path
 * @return 1 on success, 0 on failure
 */
int error_load_from_file(ErrorService* self, const char* path);

/* ==================== Error Utilities ==================== */

/**
 * Get error type name
 * @param type Error type
 * @return Type name string
 */
const char* error_type_name(ErrorType type);

/**
 * Get severity name
 * @param severity Error severity
 * @return Severity name string
 */
const char* error_severity_name(ErrorSeverity severity);

/**
 * Format error for display
 * @param error Error record
 * @return Formatted string (must be freed)
 */
char* error_format(const ErrorRecord* error);

/* ==================== Memory Management ==================== */

/**
 * Free error record
 * @param error Error record to free
 */
void error_free_record(ErrorRecord* error);

/**
 * Free error context
 * @param context Error context to free
 */
void error_free_context(ErrorContext* context);

#endif /* ERROR_SERVICE_H */
