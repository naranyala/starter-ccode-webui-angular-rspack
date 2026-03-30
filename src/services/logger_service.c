/**
 * @file logger_service.c
 * @brief Production-ready logging service implementation
 */

#include "services/logger_service.h"
#include "core/base_service.h"
#include "core/error_utils.h"
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>

/**
 * @brief Get current timestamp string
 * @param buffer Output buffer
 * @param size Buffer size
 */
static void get_timestamp(char* buffer, size_t size) {
    time_t now = time(NULL);
    struct tm* tm_info = localtime(&now);
    strftime(buffer, size, "%Y-%m-%d %H:%M:%S", tm_info);
}

/**
 * @brief Get ANSI color code for log level
 * @param level Log level string
 * @param enable_colors Whether to return colors
 * @return ANSI color code or empty string
 */
static const char* get_color_code(const char* level, bool enable_colors) {
    if (!enable_colors) return "";
    
    if (strcmp(level, "DEBUG") == 0) return "\x1b[90m";      /* Gray */
    if (strcmp(level, "INFO") == 0)  return "\x1b[36m";      /* Cyan */
    if (strcmp(level, "WARN") == 0)  return "\x1b[33m";      /* Yellow */
    if (strcmp(level, "ERROR") == 0) return "\x1b[31m";      /* Red */
    if (strcmp(level, "FATAL") == 0) return "\x1b[35m";      /* Magenta */
    return "";
}

/**
 * @brief Get ANSI reset code
 * @param enable_colors Whether to return reset code
 * @return Reset code or empty string
 */
static const char* get_reset_code(bool enable_colors) {
    return enable_colors ? "\x1b[0m" : "";
}

/**
 * @brief Get file descriptor for log level
 * @param level Log level string
 * @return stdout for INFO/DEBUG, stderr for WARN/ERROR/FATAL
 */
static FILE* get_output_stream(const char* level) {
    if (strcmp(level, "DEBUG") == 0 || strcmp(level, "INFO") == 0) {
        return stdout;
    }
    return stderr;
}

/**
 * @brief Rotate log files
 * @param self Logger service instance
 */
void logger_rotate(LoggerService* self) {
    if (self == NULL || self->file_output == NULL) return;
    
    fflush(self->file_output);
    fclose(self->file_output);
    self->file_output = NULL;
    
    /* Delete oldest rotated file */
    char oldest_path[2048];
    snprintf(oldest_path, sizeof(oldest_path), "%s.%d", 
             self->log_file_path, self->rotate_count);
    remove(oldest_path);
    
    /* Rotate existing files */
    for (int i = self->rotate_count - 1; i >= 1; i--) {
        char old_path[2048], new_path[2048];
        snprintf(old_path, sizeof(old_path), "%s.%d", self->log_file_path, i);
        snprintf(new_path, sizeof(new_path), "%s.%d", self->log_file_path, i + 1);
        rename(old_path, new_path);
    }
    
    /* Rename current log file */
    char new_path[2048];
    snprintf(new_path, sizeof(new_path), "%s.1", self->log_file_path);
    rename(self->log_file_path, new_path);
    
    /* Open new log file */
    self->file_output = fopen(self->log_file_path, "a");
    if (self->file_output != NULL) {
        self->current_file_size = 0;
    }
    
    self->rotate_count = self->rotate_count; /* Keep configured count */
}

/**
 * @brief Check if file rotation is needed
 * @param self Logger service instance
 */
static void check_rotation(LoggerService* self) {
    if (self->file_output != NULL && 
        self->current_file_size >= self->max_file_size) {
        logger_rotate(self);
    }
}

/**
 * @brief Write log message to outputs
 * @param self Logger service instance
 * @param level Log level string
 * @param message Formatted message
 */
static void write_log(LoggerService* self, const char* level, const char* message) {
    if (self == NULL) return;
    
    char timestamp[32] = {0};
    if (self->enable_timestamps) {
        get_timestamp(timestamp, sizeof(timestamp));
    }
    
    const char* color = get_color_code(level, self->enable_colors);
    const char* reset = get_reset_code(self->enable_colors);
    
    /* Console output */
    if (self->output_mode == LOG_OUTPUT_CONSOLE || 
        self->output_mode == LOG_OUTPUT_BOTH) {
        
        FILE* stream = get_output_stream(level);
        
        if (self->enable_timestamps) {
            fprintf(stream, "%s[%s]%s %s%s%s %s\n", 
                    color, timestamp, reset,
                    color, level, reset, message);
        } else {
            fprintf(stream, "%s%s%s %s\n", 
                    color, level, reset, message);
        }
        fflush(stream);
    }
    
    /* File output */
    if (self->output_mode == LOG_OUTPUT_FILE || 
        self->output_mode == LOG_OUTPUT_BOTH) {
        
        if (self->file_output != NULL) {
            int written;
            if (self->enable_timestamps) {
                written = fprintf(self->file_output, "[%s] %s %s\n", 
                                 timestamp, level, message);
            } else {
                written = fprintf(self->file_output, "%s %s\n", level, message);
            }
            self->current_file_size += written;
            fflush(self->file_output);
            
            check_rotation(self);
        }
    }
    
    /* Update statistics */
    self->total_logs++;
    if (strcmp(level, "DEBUG") == 0) self->logs_by_level[0]++;
    else if (strcmp(level, "INFO") == 0) self->logs_by_level[1]++;
    else if (strcmp(level, "WARN") == 0) self->logs_by_level[2]++;
    else if (strcmp(level, "ERROR") == 0) self->logs_by_level[3]++;
    else if (strcmp(level, "FATAL") == 0) self->logs_by_level[4]++;
}

/* ============================================================================
 * DI Service Implementation
 * ============================================================================ */

DI_SERVICE_INIT(LoggerService, logger_service) {
    if (!self) return DI_ERROR_NULL_POINTER;
    
    /* Initialize with defaults */
    memset(self, 0, sizeof(LoggerService));
    strcpy(self->app_name, "App");
    self->output_mode = LOG_OUTPUT_CONSOLE;
    self->min_level = LOG_LEVEL_DEBUG;
    self->enable_colors = true;
    self->enable_timestamps = true;
    self->file_output = NULL;
    self->current_file_size = 0;
    self->max_file_size = 10 * 1024 * 1024; /* 10MB */
    self->rotate_count = 5;
    
    /* Initialize mutex */
#ifdef _WIN32
    InitializeCriticalSection(&self->mutex);
#else
    pthread_mutex_init(&self->mutex, NULL);
#endif
    
    LOG_INFO(self, "LoggerService initialized");
    return DI_OK;
}

DI_SERVICE_CLEANUP(LoggerService, logger_service) {
    if (self == NULL) return;
    
    if (self->file_output != NULL) {
        logger_flush(self);
        fclose(self->file_output);
        self->file_output = NULL;
    }
    
    /* Destroy mutex */
#ifdef _WIN32
    DeleteCriticalSection(&self->mutex);
#else
    pthread_mutex_destroy(&self->mutex);
#endif
}

DI_DEFINE_SERVICE(LoggerService, logger_service)

/* ============================================================================
 * Public API Implementation
 * ============================================================================ */

ServiceResult logger_init_with_config(LoggerService* self, const LoggerConfig* config) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    
    LoggerConfig cfg = LOGGER_CONFIG_DEFAULT;
    if (config != NULL) {
        cfg = *config;
    }
    
    /* Copy configuration */
    if (cfg.app_name != NULL) {
        STR_SAFE_COPY(self->app_name, cfg.app_name, sizeof(self->app_name));
    }
    
    self->output_mode = cfg.output_mode;
    self->min_level = cfg.min_level;
    self->enable_colors = cfg.enable_colors;
    self->enable_timestamps = cfg.enable_timestamps;
    self->max_file_size = cfg.max_file_size_bytes;
    self->rotate_count = cfg.rotate_count;
    
    /* Set up file output if path provided */
    if (cfg.log_file_path != NULL) {
        return logger_set_file_output(self, cfg.log_file_path, cfg.rotate_count);
    }
    
    return RESULT_OK;
}

void logger_log(LoggerService* self, const char* level, const char* format, ...) {
    if (self == NULL || level == NULL || format == NULL) return;
    
    /* Check minimum log level */
    LogLevel msg_level = logger_string_to_level(level);
    if (msg_level < self->min_level) return;
    
    /* Lock mutex */
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    /* Format message */
    char message[4096];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);
    
    write_log(self, level, message);
    
    /* Unlock mutex */
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
}

void logger_log_v(LoggerService* self, const char* level, const char* format, va_list args) {
    if (self == NULL || level == NULL || format == NULL) return;
    
    LogLevel msg_level = logger_string_to_level(level);
    if (msg_level < self->min_level) return;
    
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    char message[4096];
    vsnprintf(message, sizeof(message), format, args);
    write_log(self, level, message);
    
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
}

ServiceResult logger_set_min_level(LoggerService* self, LogLevel level) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    self->min_level = level;
    
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
    
    return RESULT_OK;
}

ServiceResult logger_set_output_mode(LoggerService* self, LogOutputMode mode) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    self->output_mode = mode;
    
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
    
    return RESULT_OK;
}

ServiceResult logger_set_file_output(LoggerService* self, const char* path, int rotate_count) {
    VALIDATE_PTR(self, RESULT_ERROR_INVALID_PARAM);
    VALIDATE_STR(path, RESULT_ERROR_INVALID_PARAM);
    
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    /* Close existing file */
    if (self->file_output != NULL) {
        fclose(self->file_output);
        self->file_output = NULL;
    }
    
    /* Open new file */
    FILE* file = fopen(path, "a");
    if (file == NULL) {
#ifdef _WIN32
        LeaveCriticalSection(&self->mutex);
#else
        pthread_mutex_unlock(&self->mutex);
#endif
        return RESULT_ERROR_IO;
    }
    
    self->file_output = file;
    STR_SAFE_COPY(self->log_file_path, path, sizeof(self->log_file_path));
    self->rotate_count = rotate_count > 0 ? rotate_count : 5;
    
    /* Get current file size */
    struct stat st;
    if (stat(path, &st) == 0) {
        self->current_file_size = st.st_size;
    }
    
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
    
    return RESULT_OK;
}

void logger_set_colors(LoggerService* self, bool enabled) {
    if (self == NULL) return;
    
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    self->enable_colors = enabled;
    
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
}

void logger_flush(LoggerService* self) {
    if (self == NULL) return;
    
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    if (self->file_output != NULL) {
        fflush(self->file_output);
    }
    fflush(stdout);
    fflush(stderr);
    
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
}

void logger_get_stats(LoggerService* self, uint64_t* total, uint64_t by_level[5]) {
    if (self == NULL) return;
    
#ifdef _WIN32
    EnterCriticalSection(&self->mutex);
#else
    pthread_mutex_lock(&self->mutex);
#endif
    
    if (total != NULL) {
        *total = self->total_logs;
    }
    
    if (by_level != NULL) {
        memcpy(by_level, self->logs_by_level, sizeof(self->logs_by_level));
    }
    
#ifdef _WIN32
    LeaveCriticalSection(&self->mutex);
#else
    pthread_mutex_unlock(&self->mutex);
#endif
}

const char* logger_level_to_string(LogLevel level) {
    switch (level) {
        case LOG_LEVEL_DEBUG: return "DEBUG";
        case LOG_LEVEL_INFO:  return "INFO";
        case LOG_LEVEL_WARN:  return "WARN";
        case LOG_LEVEL_ERROR: return "ERROR";
        case LOG_LEVEL_FATAL: return "FATAL";
        default: return "INFO";
    }
}

LogLevel logger_string_to_level(const char* str) {
    if (str == NULL) return LOG_LEVEL_INFO;
    
    if (strcasecmp(str, "DEBUG") == 0) return LOG_LEVEL_DEBUG;
    if (strcasecmp(str, "INFO") == 0)  return LOG_LEVEL_INFO;
    if (strcasecmp(str, "WARN") == 0)  return LOG_LEVEL_WARN;
    if (strcasecmp(str, "WARNING") == 0) return LOG_LEVEL_WARN;
    if (strcasecmp(str, "ERROR") == 0) return LOG_LEVEL_ERROR;
    if (strcasecmp(str, "FATAL") == 0) return LOG_LEVEL_FATAL;
    if (strcasecmp(str, "CRITICAL") == 0) return LOG_LEVEL_FATAL;
    
    return LOG_LEVEL_INFO;
}
