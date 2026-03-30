/**
 * @file error_utils.h
 * @brief Centralized error handling utilities
 * 
 * Provides consistent error handling patterns across all services.
 */

#ifndef ERROR_UTILS_H
#define ERROR_UTILS_H

#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

/**
 * @defgroup Error Error Handling Types
 * @{
 */

/**
 * @brief Error severity levels
 */
typedef enum {
    ERROR_SEVERITY_INFO = 0,
    ERROR_SEVERITY_WARNING = 1,
    ERROR_SEVERITY_ERROR = 2,
    ERROR_SEVERITY_CRITICAL = 3,
    ERROR_SEVERITY_FATAL = 4
} ErrorSeverity;

/**
 * @brief Error codes for application-wide use
 */
typedef enum {
    ERR_NONE = 0,
    ERR_GENERIC = 1,
    ERR_INVALID_ARGUMENT = 2,
    ERR_OUT_OF_MEMORY = 3,
    ERR_NOT_FOUND = 4,
    ERR_ALREADY_EXISTS = 5,
    ERR_PERMISSION_DENIED = 6,
    ERR_TIMEOUT = 7,
    ERR_IO_ERROR = 8,
    ERR_NETWORK_ERROR = 9,
    ERR_DATABASE_ERROR = 10,
    ERR_AUTHENTICATION_FAILED = 11,
    ERR_AUTHORIZATION_FAILED = 12,
    ERR_VALIDATION_FAILED = 13,
    ERR_SERIALIZATION_ERROR = 14,
    ERR_NOT_INITIALIZED = 15,
    ERR_ALREADY_INITIALIZED = 16,
    ERR_INVALID_STATE = 17,
    ERR_UNSUPPORTED_OPERATION = 18,
    ERR_INTERNAL_ERROR = 19
} ErrorCode;

/**
 * @brief Error context for detailed error information
 */
typedef struct {
    ErrorCode code;
    ErrorSeverity severity;
    char message[512];
    char source[128];
    int line;
    int64_t timestamp;
} ErrorContext;

/** @} */

/**
 * @brief Convert error code to string
 * @param code The error code
 * @return Static string describing the error
 */
static inline const char* error_code_to_string(ErrorCode code) {
    switch (code) {
        case ERR_NONE: return "No error";
        case ERR_GENERIC: return "Generic error";
        case ERR_INVALID_ARGUMENT: return "Invalid argument";
        case ERR_OUT_OF_MEMORY: return "Out of memory";
        case ERR_NOT_FOUND: return "Not found";
        case ERR_ALREADY_EXISTS: return "Already exists";
        case ERR_PERMISSION_DENIED: return "Permission denied";
        case ERR_TIMEOUT: return "Timeout";
        case ERR_IO_ERROR: return "I/O error";
        case ERR_NETWORK_ERROR: return "Network error";
        case ERR_DATABASE_ERROR: return "Database error";
        case ERR_AUTHENTICATION_FAILED: return "Authentication failed";
        case ERR_AUTHORIZATION_FAILED: return "Authorization failed";
        case ERR_VALIDATION_FAILED: return "Validation failed";
        case ERR_SERIALIZATION_ERROR: return "Serialization error";
        case ERR_NOT_INITIALIZED: return "Not initialized";
        case ERR_ALREADY_INITIALIZED: return "Already initialized";
        case ERR_INVALID_STATE: return "Invalid state";
        case ERR_UNSUPPORTED_OPERATION: return "Unsupported operation";
        case ERR_INTERNAL_ERROR: return "Internal error";
        default: return "Unknown error";
    }
}

/**
 * @brief Convert severity to string
 * @param severity The severity level
 * @return Static string describing the severity
 */
static inline const char* error_severity_to_string(ErrorSeverity severity) {
    switch (severity) {
        case ERROR_SEVERITY_INFO: return "INFO";
        case ERROR_SEVERITY_WARNING: return "WARNING";
        case ERROR_SEVERITY_ERROR: return "ERROR";
        case ERROR_SEVERITY_CRITICAL: return "CRITICAL";
        case ERROR_SEVERITY_FATAL: return "FATAL";
        default: return "UNKNOWN";
    }
}

/**
 * @brief Initialize error context
 * @param ctx The error context to initialize
 * @param code The error code
 * @param severity The severity level
 * @param message The error message
 * @param source Source file/function
 * @param line Source line number
 */
static inline void error_init(ErrorContext* ctx, ErrorCode code, 
                              ErrorSeverity severity, const char* message,
                              const char* source, int line) {
    if (ctx == NULL) return;
    
    memset(ctx, 0, sizeof(ErrorContext));
    ctx->code = code;
    ctx->severity = severity;
    
    if (message != NULL) {
        strncpy(ctx->message, message, sizeof(ctx->message) - 1);
    }
    
    if (source != NULL) {
        strncpy(ctx->source, source, sizeof(ctx->source) - 1);
    }
    
    ctx->line = line;
    ctx->timestamp = 0; /* Could use time() here */
}

/**
 * @brief Print error context to stream
 * @param ctx The error context
 * @param stream The output stream (e.g., stderr)
 */
static inline void error_print(const ErrorContext* ctx, FILE* stream) {
    if (ctx == NULL || stream == NULL) return;
    
    fprintf(stream, "[%s] %s: %s\n", 
            error_severity_to_string(ctx->severity),
            error_code_to_string(ctx->code),
            ctx->message);
    
    if (ctx->source[0] != '\0') {
        fprintf(stream, "  at %s:%d\n", ctx->source, ctx->line);
    }
}

/**
 * @brief Check if error indicates success
 * @param code The error code
 * @return true if no error, false otherwise
 */
static inline bool error_is_success(ErrorCode code) {
    return code == ERR_NONE;
}

/**
 * @brief Check if error indicates failure
 * @param code The error code
 * @return true if error, false otherwise
 */
static inline bool error_is_failure(ErrorCode code) {
    return code != ERR_NONE;
}

/** @} */

/**
 * @defgroup ErrorMacros Error Handling Macros
 * @{
 */

/**
 * @brief Return error if condition is true
 * @param cond The condition to check
 * @param code Error code to return
 * @param msg Error message
 */
#define RETURN_IF_ERROR(cond, code, msg) \
    do { \
        if (cond) { \
            return (code); \
        } \
    } while (0)

/**
 * @brief Return error if pointer is NULL
 * @param ptr The pointer to check
 * @param code Error code to return
 */
#define RETURN_IF_NULL(ptr, code) \
    do { \
        if ((ptr) == NULL) { \
            return (code); \
        } \
    } while (0)

/**
 * @brief Return error if string is NULL or empty
 * @param str The string to check
 * @param code Error code to return
 */
#define RETURN_IF_EMPTY(str, code) \
    do { \
        if ((str) == NULL || (str)[0] == '\0') { \
            return (code); \
        } \
    } while (0)

/**
 * @brief Set error context and return
 * @param ctx Error context to set
 * @param code Error code
 * @param msg Error message
 */
#define SET_ERROR_AND_RETURN(ctx, code, msg) \
    do { \
        error_init((ctx), (code), ERROR_SEVERITY_ERROR, (msg), __FILE__, __LINE__); \
        return (code); \
    } while (0)

/**
 * @brief Log error and return
 * @param logger Logger service pointer
 * @param code Error code
 * @param msg Error message
 */
#define LOG_ERROR_AND_RETURN(logger, code, msg) \
    do { \
        if ((logger) != NULL) { \
            logger_log((logger), "ERROR", "%s: %s", error_code_to_string(code), (msg)); \
        } \
        return (code); \
    } while (0)

/**
 * @brief Check result and propagate error
 * @param expr Expression to evaluate
 * @param error_ctx Error context to set on failure
 */
#define CHECK_RESULT(expr, error_ctx) \
    do { \
        ServiceResult _result = (expr); \
        if (!result_is_ok(_result)) { \
            SET_ERROR_AND_RETURN((error_ctx), ERR_GENERIC, result_to_string(_result)); \
        } \
    } while (0)

/** @} */

#endif /* ERROR_UTILS_H */
