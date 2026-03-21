/* Logger Service - Demonstrates basic DI service */

#ifndef LOGGER_SERVICE_H
#define LOGGER_SERVICE_H

#include "di/di.h"
#include <stdarg.h>
#include <stdio.h>
#include <stdbool.h>

typedef struct LoggerService {
    DI_Service base;
    const char* prefix;
    bool debug_enabled;
    FILE* output;
} LoggerService;

DI_DECLARE_SERVICE(LoggerService, logger_service);

/* Logger methods */
void logger_log(LoggerService* self, const char* level, const char* format, ...);
void logger_set_debug(LoggerService* self, bool enabled);

#endif /* LOGGER_SERVICE_H */
