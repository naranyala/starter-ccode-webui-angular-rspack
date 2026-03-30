/**
 * @file logger_service.h
 * @brief Production-ready logging service with file rotation and structured output
 * 
 * Features:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Console and file output with rotation
 * - Thread-safe logging with mutex protection
 * - Structured log format with timestamps
 * - Configurable output modes and minimum log level
 * 
 * @code
 * // Usage example:
 * LoggerService* logger = INJECT_SERVICE(logger_service);
 * LOG_INFO(logger, "Application started, version=%s", APP_VERSION);
 * LOG_ERROR(logger, "Failed to connect to database: %s", db_error);
 * @endcode
 */

#ifndef LOGGER_SERVICE_H
#define LOGGER_SERVICE_H

#include "di/di.h"
#include "core/base_service.h"
#include <stdarg.h>
#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>

#ifdef _WIN32
    #include <windows.h>
#else
    #include <pthread.h>
#endif

/**
 * @brief Log severity levels
 */
typedef enum {
    LOG_LEVEL_DEBUG = 0,    /**< Debug messages (verbose) */
    LOG_LEVEL_INFO = 1,     /**< Informational messages */
    LOG_LEVEL_WARN = 2,     /**< Warning messages */
    LOG_LEVEL_ERROR = 3,    /**< Error messages */
    LOG_LEVEL_FATAL = 4     /**< Fatal/critical messages */
} LogLevel;

/**
 * @brief Log output destination
 */
typedef enum {
    LOG_OUTPUT_CONSOLE = 0, /**< Output to stdout/stderr */
    LOG_OUTPUT_FILE = 1,    /**< Output to file only */
    LOG_OUTPUT_BOTH = 2     /**< Output to both console and file */
} LogOutputMode;

/**
 * @brief Logger service configuration
 */
typedef struct {
    const char* app_name;           /**< Application name for log prefix */
    const char* log_file_path;      /**< Path to log file (NULL for console only) */
    LogOutputMode output_mode;      /**< Output destination */
    LogLevel min_level;             /**< Minimum log level to output */
    int max_file_size_bytes;        /**< Max file size before rotation (default: 10MB) */
    int rotate_count;               /**< Number of rotated files to keep (default: 5) */
    bool enable_colors;             /**< Enable ANSI colors in console (default: true) */
    bool enable_timestamps;         /**< Enable timestamps in logs (default: true) */
} LoggerConfig;

/**
 * @brief Logger service instance
 */
typedef struct LoggerService {
    DI_Service base;                /**< DI base structure */
    
    /* Configuration */
    char app_name[64];              /**< Application name */
    LogOutputMode output_mode;      /**< Output destination */
    LogLevel min_level;             /**< Minimum log level */
    bool enable_colors;             /**< Console colors enabled */
    bool enable_timestamps;         /**< Timestamps enabled */
    
    /* File logging */
    FILE* file_output;              /**< File handle */
    char log_file_path[1024];       /**< Log file path */
    int64_t current_file_size;      /**< Current file size in bytes */
    int max_file_size;              /**< Max file size before rotation */
    int rotate_count;               /**< Number of rotated files to keep */
    
    /* Thread safety */
#ifdef _WIN32
    CRITICAL_SECTION mutex;         /**< Windows mutex */
#else
    pthread_mutex_t mutex;          /**< POSIX mutex */
#endif
    
    /* Statistics */
    uint64_t total_logs;            /**< Total log messages */
    uint64_t logs_by_level[5];      /**< Count per log level */
} LoggerService;

/**
 * @brief Default logger configuration
 */
#define LOGGER_CONFIG_DEFAULT { \
    .app_name = "App", \
    .log_file_path = NULL, \
    .output_mode = LOG_OUTPUT_CONSOLE, \
    .min_level = LOG_LEVEL_DEBUG, \
    .max_file_size_bytes = 10 * 1024 * 1024, \
    .rotate_count = 5, \
    .enable_colors = true, \
    .enable_timestamps = true \
}

/* DI declarations */
DI_DECLARE_SERVICE(LoggerService, logger_service);

/**
 * @brief Initialize logger with configuration
 * @param self Logger service instance
 * @param config Configuration options (can be NULL for defaults)
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult logger_init_with_config(LoggerService* self, const LoggerConfig* config);

/**
 * @brief Log a message with level and format
 * @param self Logger service instance
 * @param level Log level string (DEBUG, INFO, WARN, ERROR, FATAL)
 * @param format Printf-style format string
 * @param ... Format arguments
 */
void logger_log(LoggerService* self, const char* level, const char* format, ...);

/**
 * @brief Log a message with va_list (for wrapper functions)
 * @param self Logger service instance
 * @param level Log level string
 * @param format Printf-style format string
 * @param args Va_list of arguments
 */
void logger_log_v(LoggerService* self, const char* level, const char* format, va_list args);

/**
 * @brief Set minimum log level
 * @param self Logger service instance
 * @param level Minimum level to output
 * @return RESULT_OK on success
 */
ServiceResult logger_set_min_level(LoggerService* self, LogLevel level);

/**
 * @brief Set output mode
 * @param self Logger service instance
 * @param mode Output destination
 * @return RESULT_OK on success
 */
ServiceResult logger_set_output_mode(LoggerService* self, LogOutputMode mode);

/**
 * @brief Set file output with rotation
 * @param self Logger service instance
 * @param path Path to log file
 * @param rotate_count Number of rotated files to keep
 * @return RESULT_OK on success, error code on failure
 */
ServiceResult logger_set_file_output(LoggerService* self, const char* path, int rotate_count);

/**
 * @brief Enable/disable console colors
 * @param self Logger service instance
 * @param enabled True to enable colors
 */
void logger_set_colors(LoggerService* self, bool enabled);

/**
 * @brief Flush log buffers
 * @param self Logger service instance
 */
void logger_flush(LoggerService* self);

/**
 * @brief Rotate log files
 * @param self Logger service instance
 */
void logger_rotate(LoggerService* self);

/**
 * @brief Get log statistics
 * @param self Logger service instance
 * @param total Output for total log count
 * @param by_level Output array for per-level counts (size 5)
 */
void logger_get_stats(LoggerService* self, uint64_t* total, uint64_t by_level[5]);

/**
 * @brief Convert log level to string
 * @param level The log level
 * @return Static string representation
 */
const char* logger_level_to_string(LogLevel level);

/**
 * @brief Convert string to log level
 * @param str The string (case-insensitive)
 * @return Log level, or LOG_LEVEL_INFO on invalid input
 */
LogLevel logger_string_to_level(const char* str);

/* Convenience macros - commented out to avoid conflict with base_service.h */
/*
#define LOG_DEBUG(logger, ...) \
    logger_log((logger), "DEBUG", __VA_ARGS__)

#define LOG_INFO(logger, ...) \
    logger_log((logger), "INFO", __VA_ARGS__)

#define LOG_WARN(logger, ...) \
    logger_log((logger), "WARN", __VA_ARGS__)

#define LOG_ERROR(logger, ...) \
    logger_log((logger), "ERROR", __VA_ARGS__)

#define LOG_FATAL(logger, ...) \
    logger_log((logger), "FATAL", __VA_ARGS__)

#define LOG_IF(logger, level, condition, ...) \
    do { \
        if (condition) { \
            logger_log((logger), (level), __VA_ARGS__); \
        } \
    } while (0)
*/

#endif /* LOGGER_SERVICE_H */
