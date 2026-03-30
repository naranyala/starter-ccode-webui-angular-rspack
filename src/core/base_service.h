/**
 * @file base_service.h
 * @brief Base service macros and utilities for consistent service implementation
 * 
 * Provides DRY macros for service definition, initialization, and cleanup.
 * Inspired by Angular's dependency injection patterns.
 * 
 * @code
 * // Example usage:
 * DEFINE_SERVICE(MyService, my_service, MY_SERVICE)
 * 
 * SERVICE_INIT(MyService, my_service) {
 *     self->value = 42;
 *     return DI_OK;
 * }
 * 
 * SERVICE_CLEANUP(MyService, my_service) {
 *     free(self->resource);
 * }
 * @endcode
 */

#ifndef BASE_SERVICE_H
#define BASE_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <stddef.h>

/**
 * @defgroup Service Macros for Service Definition
 * @{
 */

/**
 * @brief Define a service with standard structure
 * @param ServiceType The service struct type (e.g., LoggerService)
 * @param service_name The service name in snake_case (e.g., logger_service)
 * @param SERVICE_PREFIX The prefix for macros in UPPER_SNAKE_CASE (e.g., LOGGER_SERVICE)
 */
#define DEFINE_SERVICE(ServiceType, service_name, SERVICE_PREFIX) \
    DI_DECLARE_SERVICE(ServiceType, service_name); \
    DI_SERVICE_INIT(ServiceType, service_name); \
    DI_SERVICE_CLEANUP(ServiceType, service_name); \
    DI_DEFINE_SERVICE(ServiceType, service_name)

/**
 * @brief Define a service without cleanup function
 * @param ServiceType The service struct type
 * @param service_name The service name in snake_case
 * @param SERVICE_PREFIX The prefix for macros in UPPER_SNAKE_CASE
 */
#define DEFINE_SERVICE_SIMPLE(ServiceType, service_name, SERVICE_PREFIX) \
    DI_DECLARE_SERVICE(ServiceType, service_name); \
    DI_SERVICE_INIT(ServiceType, service_name); \
    DI_DEFINE_SERVICE(ServiceType, service_name)

/**
 * @brief Register a singleton service in container
 * @param service_name The service name (e.g., logger_service)
 */
#define REGISTER_SINGLETON(service_name) \
    DI_REGISTER_SINGLETON(service_name)

/**
 * @brief Register a transient service in container
 * @param service_name The service name
 */
#define REGISTER_TRANSIENT(service_name) \
    DI_REGISTER_TRANSIENT(service_name)

/**
 * @brief Inject a service instance
 * @param service_name The service name
 * @return Pointer to service instance
 */
#define INJECT_SERVICE(service_name) \
    DI_INJECT(service_name)

/** @} */

/**
 * @defgroup Result Standard Result Types
 * @{
 */

/**
 * @brief Standard result type for service operations
 */
typedef enum {
    RESULT_OK = 0,
    RESULT_ERROR_INVALID_PARAM = -1,
    RESULT_ERROR_NOT_INITIALIZED = -2,
    RESULT_ERROR_OUT_OF_MEMORY = -3,
    RESULT_ERROR_IO = -4,
    RESULT_ERROR_NOT_FOUND = -5,
    RESULT_ERROR_ALREADY_EXISTS = -6,
    RESULT_ERROR_PERMISSION_DENIED = -7,
    RESULT_ERROR_TIMEOUT = -8,
    RESULT_ERROR_UNKNOWN = -9
} ServiceResult;

/**
 * @brief Convert result to string message
 * @param result The result code
 * @return Static string describing the result
 */
static inline const char* result_to_string(ServiceResult result) {
    switch (result) {
        case RESULT_OK: return "Success";
        case RESULT_ERROR_INVALID_PARAM: return "Invalid parameter";
        case RESULT_ERROR_NOT_INITIALIZED: return "Not initialized";
        case RESULT_ERROR_OUT_OF_MEMORY: return "Out of memory";
        case RESULT_ERROR_IO: return "I/O error";
        case RESULT_ERROR_NOT_FOUND: return "Not found";
        case RESULT_ERROR_ALREADY_EXISTS: return "Already exists";
        case RESULT_ERROR_PERMISSION_DENIED: return "Permission denied";
        case RESULT_ERROR_TIMEOUT: return "Timeout";
        case RESULT_ERROR_UNKNOWN: return "Unknown error";
        default: return "Unknown result code";
    }
}

/**
 * @brief Check if result indicates success
 * @param result The result code
 * @return true if success, false otherwise
 */
static inline bool result_is_ok(ServiceResult result) {
    return result == RESULT_OK;
}

/** @} */

/**
 * @defgroup Memory Safe Memory Allocation
 * @{
 */

/**
 * @brief Safe memory allocation with null check
 * @param type The type to allocate
 * @param count Number of elements (for arrays)
 * @return Pointer to allocated memory, or NULL on failure
 */
#define SAFE_ALLOC(type, count) \
    ((type*)safe_calloc(count, sizeof(type)))

/**
 * @brief Safe memory allocation for single object
 * @param type The type to allocate
 * @return Pointer to allocated memory, or NULL on failure
 */
#define SAFE_ALLOC_ONE(type) \
    SAFE_ALLOC(type, 1)

/**
 * @brief Safe array allocation
 * @param type The type to allocate
 * @param count Number of elements
 * @param out_ptr Output pointer variable
 * @param on_error Code to execute on allocation failure
 */
#define SAFE_ALLOC_ARRAY(type, count, out_ptr, on_error) \
    do { \
        (out_ptr) = SAFE_ALLOC(type, count); \
        if ((out_ptr) == NULL && (count) > 0) { \
            on_error \
        } \
    } while (0)

/**
 * @brief Safe string duplication
 * @param str The string to duplicate
 * @return Duplicated string, or NULL on failure
 */
static inline char* safe_strdup(const char* str) {
    if (str == NULL) return NULL;
    
    size_t len = strlen(str) + 1;
    char* dup = (char*)malloc(len);
    if (dup != NULL) {
        memcpy(dup, str, len);
    }
    return dup;
}

/**
 * @brief Safe memory free with null check
 * @param ptr Pointer to free
 */
#define SAFE_FREE(ptr) \
    do { \
        if ((ptr) != NULL) { \
            free(ptr); \
            (ptr) = NULL; \
        } \
    } while (0)

/** @} */

/**
 * @defgroup Validation Parameter Validation Macros
 * @{
 */

/**
 * @brief Validate pointer parameter
 * @param ptr The pointer to validate
 * @param error_code Error code to return if NULL
 */
#define VALIDATE_PTR(ptr, error_code) \
    do { \
        if ((ptr) == NULL) { \
            return (error_code); \
        } \
    } while (0)

/**
 * @brief Validate pointer parameter with custom error handling
 * @param ptr The pointer to validate
 * @param error_code Error code to return if NULL
 * @param error_msg Error message to set
 */
#define VALIDATE_PTR_MSG(ptr, error_code, error_msg) \
    do { \
        if ((ptr) == NULL) { \
            if ((error_msg) != NULL) { \
                snprintf((error_msg), 256, "NULL pointer"); \
            } \
            return (error_code); \
        } \
    } while (0)

/**
 * @brief Validate string parameter (not NULL and not empty)
 * @param str The string to validate
 * @param error_code Error code to return if invalid
 */
#define VALIDATE_STR(str, error_code) \
    do { \
        if ((str) == NULL || (str)[0] == '\0') { \
            return (error_code); \
        } \
    } while (0)

/**
 * @brief Validate condition
 * @param cond The condition to check
 * @param error_code Error code to return if false
 */
#define VALIDATE_COND(cond, error_code) \
    do { \
        if (!(cond)) { \
            return (error_code); \
        } \
    } while (0)

/** @} */

/**
 * @defgroup Logging Logging Helper Macros
 * @{
 */

/**
 * @brief Log debug message
 * @param logger LoggerService pointer
 * @param msg Message format string
 * @param ... Format arguments
 */
#define LOG_DEBUG(logger, msg, ...) \
    do { \
        if ((logger) != NULL) { \
            logger_log((logger), "DEBUG", msg, ##__VA_ARGS__); \
        } \
    } while (0)

/**
 * @brief Log info message
 * @param logger LoggerService pointer
 * @param msg Message format string
 * @param ... Format arguments
 */
#define LOG_INFO(logger, msg, ...) \
    do { \
        if ((logger) != NULL) { \
            logger_log((logger), "INFO", msg, ##__VA_ARGS__); \
        } \
    } while (0)

/**
 * @brief Log warning message
 * @param logger LoggerService pointer
 * @param msg Message format string
 * @param ... Format arguments
 */
#define LOG_WARN(logger, msg, ...) \
    do { \
        if ((logger) != NULL) { \
            logger_log((logger), "WARN", msg, ##__VA_ARGS__); \
        } \
    } while (0)

/**
 * @brief Log error message
 * @param logger LoggerService pointer
 * @param msg Message format string
 * @param ... Format arguments
 */
#define LOG_ERROR(logger, msg, ...) \
    do { \
        if ((logger) != NULL) { \
            logger_log((logger), "ERROR", msg, ##__VA_ARGS__); \
        } \
    } while (0)

/** @} */

/**
 * @defgroup Mutex Thread Safety Utilities
 * @{
 */

#ifdef _WIN32
    #include <windows.h>
    typedef CRITICAL_SECTION mutex_t;
    
    #define MUTEX_INIT(m) InitializeCriticalSection(&(m))
    #define MUTEX_LOCK(m) EnterCriticalSection(&(m))
    #define MUTEX_UNLOCK(m) LeaveCriticalSection(&(m))
    #define MUTEX_DESTROY(m) DeleteCriticalSection(&(m))
#else
    #include <pthread.h>
    typedef pthread_mutex_t mutex_t;
    
    #define MUTEX_INIT(m) pthread_mutex_init(&(m), NULL)
    #define MUTEX_LOCK(m) pthread_mutex_lock(&(m))
    #define MUTEX_UNLOCK(m) pthread_mutex_unlock(&(m))
    #define MUTEX_DESTROY(m) pthread_mutex_destroy(&(m))
#endif

/**
 * @brief Mutex guard for automatic unlock
 * @param m The mutex to lock
 */
#define MUTEX_GUARD(m) \
    pthread_mutex_lock(&(m)); \
    __attribute__((cleanup(cleanup_mutex))) \
    volatile int _mutex_guard_##__LINE__ = 1; \
    (void)_mutex_guard_##__LINE__

static inline void cleanup_mutex(volatile int* guard) {
    (void)guard;
    /* Mutex already unlocked by explicit call */
}

/** @} */

/**
 * @defgroup String String Utilities
 * @{
 */

/**
 * @brief Safe string copy with null termination
 * @param dest Destination buffer
 * @param src Source string
 * @param size Destination buffer size
 */
#define STR_SAFE_COPY(dest, src, size) \
    do { \
        strncpy((dest), (src), (size) - 1); \
        (dest)[(size) - 1] = '\0'; \
    } while (0)

/**
 * @brief Safe string format with null termination
 * @param buffer Destination buffer
 * @param size Buffer size
 * @param fmt Format string
 * @param ... Format arguments
 */
#define STR_SAFE_FORMAT(buffer, size, fmt, ...) \
    snprintf((buffer), (size), (fmt), ##__VA_ARGS__); \
    (buffer)[(size) - 1] = '\0'

/**
 * @brief String equals check
 * @param a First string
 * @param b Second string
 * @return true if equal, false otherwise
 */
static inline bool str_equals(const char* a, const char* b) {
    if (a == NULL && b == NULL) return true;
    if (a == NULL || b == NULL) return false;
    return strcmp(a, b) == 0;
}

/**
 * @brief String is null or empty check
 * @param str The string to check
 * @return true if NULL or empty, false otherwise
 */
static inline bool str_is_empty(const char* str) {
    return str == NULL || str[0] == '\0';
}

/** @} */

/**
 * @defgroup Array Array Utilities
 * @{
 */

/**
 * @brief Get array length
 * @param arr The array
 * @return Number of elements in array
 */
#define ARRAY_LENGTH(arr) (sizeof(arr) / sizeof((arr)[0]))

/**
 * @brief Safe array access with bounds check
 * @param arr The array
 * @param index The index
 * @param length Array length
 * @param default_value Value to return if out of bounds
 * @return Element at index or default value
 */
#define ARRAY_SAFE_GET(arr, index, length, default_value) \
    (((index) >= 0 && (index) < (length)) ? (arr)[(index)] : (default_value))

/** @} */

#endif /* BASE_SERVICE_H */
