/* Config Service - Demonstrates service with dependencies */

#ifndef CONFIG_SERVICE_H
#define CONFIG_SERVICE_H

#include "di/di.h"
#include "services/logger_service.h"
#include <stdbool.h>

typedef struct ConfigService {
    DI_Service base;
    LoggerService* logger;  /* Dependency */
    const char* app_name;
    const char* app_version;
    int port;
    bool debug_mode;
} ConfigService;

DI_DECLARE_SERVICE(ConfigService, config_service);

/* Config methods */
const char* config_get_app_name(ConfigService* self);
const char* config_get_app_version(ConfigService* self);
int config_get_port(ConfigService* self);
bool config_is_debug(ConfigService* self);

#endif /* CONFIG_SERVICE_H */
