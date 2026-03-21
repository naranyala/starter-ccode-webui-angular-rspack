/* App Module - Registers all services (similar to Angular NgModule) */

#ifndef APP_MODULE_H
#define APP_MODULE_H

#include <stdbool.h>
#include "di/di.h"

/* Forward declare service providers */
DI_Error logger_service_provider(DI_Container* container, void** out_service);
void logger_service_destroy(DI_Service* service);

DI_Error config_service_provider(DI_Container* container, void** out_service);
void config_service_destroy(DI_Service* service);

DI_Error webui_service_provider(DI_Container* container, void** out_service);
void webui_service_destroy(DI_Service* service);

DI_Error event_service_provider(DI_Container* container, void** out_service);
void event_service_destroy(DI_Service* service);

DI_Error file_service_provider(DI_Container* container, void** out_service);
void file_service_destroy(DI_Service* service);

DI_Error timer_service_provider(DI_Container* container, void** out_service);
void timer_service_destroy(DI_Service* service);

/**
 * Initialize the application module
 * Registers all services in the correct order (dependencies first)
 */
static inline int app_module_init(void) {
    DI_Container* container = DI_GetGlobalContainer();
    
    /* Register services in dependency order */
    
    /* 1. LoggerService - no dependencies (foundation) */
    DI_Error err = DI_Container_Register(
        container,
        "logger_service",
        DI_SCOPE_SINGLETON,
        logger_service_provider,
        logger_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register LoggerService: %s\n", DI_Error_Message(err));
        return 1;
    }
    
    /* 2. EventService - no dependencies (foundation) */
    err = DI_Container_Register(
        container,
        "event_service",
        DI_SCOPE_SINGLETON,
        event_service_provider,
        event_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register EventService: %s\n", DI_Error_Message(err));
        return 1;
    }
    
    /* 3. FileService - no dependencies (foundation) */
    err = DI_Container_Register(
        container,
        "file_service",
        DI_SCOPE_SINGLETON,
        file_service_provider,
        file_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register FileService: %s\n", DI_Error_Message(err));
        return 1;
    }
    
    /* 4. TimerService - no dependencies (foundation) */
    err = DI_Container_Register(
        container,
        "timer_service",
        DI_SCOPE_SINGLETON,
        timer_service_provider,
        timer_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register TimerService: %s\n", DI_Error_Message(err));
        return 1;
    }
    
    /* 5. ConfigService - depends on LoggerService */
    err = DI_Container_Register(
        container,
        "config_service",
        DI_SCOPE_SINGLETON,
        config_service_provider,
        config_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register ConfigService: %s\n", DI_Error_Message(err));
        return 1;
    }
    
    /* 6. WebuiService - depends on LoggerService and ConfigService */
    err = DI_Container_Register(
        container,
        "webui_service",
        DI_SCOPE_SINGLETON,
        webui_service_provider,
        webui_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register WebuiService: %s\n", DI_Error_Message(err));
        return 1;
    }
    
    /* Freeze container - no more registrations allowed */
    container->frozen = 1;
    
    return 0;
}

/**
 * Destroy the application module
 * Cleans up all services
 */
static inline void app_module_destroy(void) {
    DI_Container_Destroy(DI_GetGlobalContainer());
}

#endif /* APP_MODULE_H */
