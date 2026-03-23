/* Logger Service Implementation - With file logging support */

#include "services/logger_service.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <unistd.h>

DI_SERVICE_INIT(LoggerService, logger_service) {
    if (!self) return DI_ERROR_NULL_POINTER;

    self->prefix = "APP";
    self->debug_enabled = false;
    self->output = stdout;
    self->file_output = NULL;
    self->log_file_path = NULL;
    self->output_mode = LOG_OUTPUT_CONSOLE;
    self->min_level = LOG_LEVEL_DEBUG;
    self->max_file_size = 10 * 1024 * 1024;  /* 10MB */
    self->rotate_count = 5;

    return DI_OK;
}

DI_SERVICE_CLEANUP(LoggerService, logger_service) {
    if (!self) return;
    
    if (self->file_output && self->file_output != stdout && self->file_output != stderr) {
        fclose(self->file_output);
    }
    free(self->log_file_path);
}

DI_DEFINE_SERVICE(LoggerService, logger_service)

/* Get log level from string */
static LogLevel get_level_from_string(const char* level) {
    if (strcmp(level, "DEBUG") == 0) return LOG_LEVEL_DEBUG;
    if (strcmp(level, "INFO") == 0) return LOG_LEVEL_INFO;
    if (strcmp(level, "WARN") == 0) return LOG_LEVEL_WARN;
    if (strcmp(level, "ERROR") == 0) return LOG_LEVEL_ERROR;
    if (strcmp(level, "FATAL") == 0) return LOG_LEVEL_FATAL;
    return LOG_LEVEL_INFO;  /* Default */
}

/* Get file size */
static long get_file_size(FILE* file) {
    if (!file) return 0;
    
    int fd = fileno(file);
    if (fd < 0) return 0;
    
    struct stat st;
    if (fstat(fd, &st) != 0) return 0;
    
    return st.st_size;
}

/* Rotate log files */
void logger_rotate_file(LoggerService* self) {
    if (!self || !self->log_file_path) return;
    
    /* Close current file */
    if (self->file_output) {
        fclose(self->file_output);
        self->file_output = NULL;
    }
    
    /* Rotate existing files */
    for (int i = self->rotate_count; i > 0; i--) {
        char old_path[1024];
        char new_path[1024];
        
        if (i == self->rotate_count) {
            /* Delete oldest file */
            snprintf(old_path, sizeof(old_path), "%s.%d", self->log_file_path, i);
            unlink(old_path);
        } else {
            /* Rename file */
            snprintf(old_path, sizeof(old_path), "%s.%d", self->log_file_path, i);
            snprintf(new_path, sizeof(new_path), "%s.%d", self->log_file_path, i + 1);
            rename(old_path, new_path);
        }
    }
    
    /* Rename current log file */
    char new_path[1024];
    snprintf(new_path, sizeof(new_path), "%s.1", self->log_file_path);
    rename(self->log_file_path, new_path);
    
    /* Open new log file */
    self->file_output = fopen(self->log_file_path, "a");
}

/* Check if file rotation is needed */
static void check_rotation(LoggerService* self) {
    if (!self || !self->file_output) return;
    
    long size = get_file_size(self->file_output);
    if (size >= self->max_file_size) {
        logger_rotate_file(self);
    }
}

void logger_log(LoggerService* self, const char* level, const char* format, ...) {
    if (!self || !level || !format) return;

    /* Check log level */
    LogLevel msg_level = get_level_from_string(level);
    if (msg_level < self->min_level) return;

    /* Skip debug if not enabled */
    if (msg_level == LOG_LEVEL_DEBUG && !self->debug_enabled) return;

    /* Get timestamp */
    time_t now = time(NULL);
    struct tm* tm_info = localtime(&now);
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm_info);

    /* Format message */
    char message[4096];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);

    /* Output to console if configured */
    if (self->output_mode == LOG_OUTPUT_CONSOLE || self->output_mode == LOG_OUTPUT_BOTH) {
        FILE* console = self->output ? self->output : stdout;
        fprintf(console, "[%s] [%s] [%s] %s\n", timestamp, self->prefix, level, message);
        fflush(console);
    }

    /* Output to file if configured */
    if ((self->output_mode == LOG_OUTPUT_FILE || self->output_mode == LOG_OUTPUT_BOTH) 
        && self->file_output) {
        
        check_rotation(self);
        
        if (self->file_output) {
            fprintf(self->file_output, "[%s] [%s] [%s] %s\n", timestamp, self->prefix, level, message);
            fflush(self->file_output);
        }
    }
}

void logger_set_debug(LoggerService* self, bool enabled) {
    if (!self) return;
    self->debug_enabled = enabled;
}

int logger_set_file_output(LoggerService* self, const char* path, int rotate_count) {
    if (!self || !path) return 0;
    
    /* Close existing file */
    if (self->file_output && self->file_output != stdout && self->file_output != stderr) {
        fclose(self->file_output);
        self->file_output = NULL;
    }
    
    free(self->log_file_path);
    self->log_file_path = strdup(path);
    self->rotate_count = rotate_count > 0 ? rotate_count : 5;
    
    /* Open file for appending */
    self->file_output = fopen(path, "a");
    if (!self->file_output) {
        return 0;
    }
    
    return 1;
}

int logger_set_output_mode(LoggerService* self, LogOutputMode mode) {
    if (!self) return 0;
    self->output_mode = mode;
    return 1;
}

int logger_set_min_level(LoggerService* self, LogLevel level) {
    if (!self) return 0;
    self->min_level = level;
    return 1;
}

void logger_flush(LoggerService* self) {
    if (!self) return;
    
    if (self->output) {
        fflush(self->output);
    }
    if (self->file_output) {
        fflush(self->file_output);
    }
}
