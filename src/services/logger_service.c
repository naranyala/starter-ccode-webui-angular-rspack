/* Logger Service Implementation */

#include "services/logger_service.h"
#include <stdio.h>
#include <string.h>
#include <time.h>

DI_SERVICE_INIT(LoggerService, logger_service) {
    if (!self) return DI_ERROR_NULL_POINTER;
    
    self->prefix = "APP";
    self->debug_enabled = false;
    self->output = stdout;
    
    return DI_OK;
}

DI_SERVICE_CLEANUP(LoggerService, logger_service) {
    if (!self) return;
    /* Cleanup resources if needed */
}

DI_DEFINE_SERVICE(LoggerService, logger_service)

void logger_log(LoggerService* self, const char* level, const char* format, ...) {
    if (!self || !level || !format) return;
    
    /* Skip debug if not enabled */
    if (strcmp(level, "DEBUG") == 0 && !self->debug_enabled) return;
    
    /* Get timestamp */
    time_t now = time(NULL);
    struct tm* tm_info = localtime(&now);
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm_info);
    
    /* Print header */
    fprintf(self->output, "[%s] [%s] [%s] ", timestamp, self->prefix, level);
    
    /* Print message */
    va_list args;
    va_start(args, format);
    vfprintf(self->output, format, args);
    va_end(args);
    
    fprintf(self->output, "\n");
    fflush(self->output);
}

void logger_set_debug(LoggerService* self, bool enabled) {
    if (!self) return;
    self->debug_enabled = enabled;
}
