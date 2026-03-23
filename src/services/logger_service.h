/* Logger Service - Demonstrates basic DI service */

#ifndef LOGGER_SERVICE_H
#define LOGGER_SERVICE_H

#include "di/di.h"
#include <stdarg.h>
#include <stdio.h>
#include <stdbool.h>

/* Log levels */
typedef enum {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO = 1,
    LOG_LEVEL_WARN = 2,
    LOG_LEVEL_ERROR = 3,
    LOG_LEVEL_FATAL = 4
} LogLevel;

/* Log output mode */
typedef enum {
    LOG_OUTPUT_CONSOLE = 0,
    LOG_OUTPUT_FILE = 1,
    LOG_OUTPUT_BOTH = 2
} LogOutputMode;

typedef struct LoggerService {
    DI_Service base;
    const char* prefix;
    bool debug_enabled;
    FILE* output;
    FILE* file_output;        /* File handle for logging */
    char* log_file_path;      /* Path to log file */
    LogOutputMode output_mode; /* Output destination */
    LogLevel min_level;       /* Minimum log level to output */
    int max_file_size;        /* Max file size in bytes before rotation */
    int rotate_count;         /* Number of rotated files to keep */
} LoggerService;

DI_DECLARE_SERVICE(LoggerService, logger_service);

/* Logger methods */
void logger_log(LoggerService* self, const char* level, const char* format, ...);
void logger_set_debug(LoggerService* self, bool enabled);

/* File logging */
int logger_set_file_output(LoggerService* self, const char* path, int rotate_count);
int logger_set_output_mode(LoggerService* self, LogOutputMode mode);
int logger_set_min_level(LoggerService* self, LogLevel level);
void logger_rotate_file(LoggerService* self);
void logger_flush(LoggerService* self);

/* Convenience macros */
#define LOG_DEBUG(logger, ...) logger_log(logger, "DEBUG", __VA_ARGS__)
#define LOG_INFO(logger, ...) logger_log(logger, "INFO", __VA_ARGS__)
#define LOG_WARN(logger, ...) logger_log(logger, "WARN", __VA_ARGS__)
#define LOG_ERROR(logger, ...) logger_log(logger, "ERROR", __VA_ARGS__)
#define LOG_FATAL(logger, ...) logger_log(logger, "FATAL", __VA_ARGS__)

#endif /* LOGGER_SERVICE_H */
