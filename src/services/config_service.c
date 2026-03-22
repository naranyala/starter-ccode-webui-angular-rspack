/* Config Service Implementation */

#include "services/config_service.h"
#include <stdio.h>

DI_SERVICE_INIT(ConfigService, config_service) {
    if (!self) return DI_ERROR_NULL_POINTER;
    
    /* Inject dependency - similar to Angular constructor injection */
    self->logger = logger_service_inject();
    if (!self->logger) {
        fprintf(stderr, "ConfigService: Failed to inject LoggerService\n");
        return DI_ERROR_INIT_FAILED;
    }
    
    /* Initialize config */
    self->app_name = "WebUI Angular App";
    self->app_version = "1.0.0";
    self->port = 8080;
    self->debug_mode = false;
    
    logger_log(self->logger, "INFO", "ConfigService initialized: %s v%s", 
               self->app_name, self->app_version);
    
    return DI_OK;
}

DI_SERVICE_CLEANUP(ConfigService, config_service) {
    if (!self) return;
    if (self->logger) {
        logger_log(self->logger, "DEBUG", "ConfigService cleanup");
    }
}

DI_DEFINE_SERVICE(ConfigService, config_service)

const char* config_get_app_name(ConfigService* self) {
    if (!self) return "Unknown";
    return self->app_name;
}

const char* config_get_app_version(ConfigService* self) {
    if (!self) return "0.0.0";
    return self->app_version;
}

int config_get_port(ConfigService* self) {
    if (!self) return 0;
    return self->port;
}

bool config_is_debug(ConfigService* self) {
    if (!self) return false;
    return self->debug_mode;
}
