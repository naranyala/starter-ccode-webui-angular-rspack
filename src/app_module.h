/* App Module - Registers all services (similar to Angular NgModule) */

#ifndef APP_MODULE_H
#define APP_MODULE_H

#include <stdbool.h>
#include "di/di.h"

/* Database type selection (can be set via environment variable or config) */
typedef enum {
    DB_AUTO,      /* Auto-detect based on file extension */
    DB_SQLITE,    /* Force SQLite */
    DB_DUCKDB     /* Force DuckDB */
} DatabaseMode;

/* Global database mode - can be set before app_module_init() */
static DatabaseMode g_database_mode = DB_AUTO;

/* Get database mode */
static inline DatabaseMode app_get_database_mode(void) {
    return g_database_mode;
}

/* Set database mode */
static inline void app_set_database_mode(DatabaseMode mode) {
    g_database_mode = mode;
}

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

DI_Error http_service_provider(DI_Container* container, void** out_service);
void http_service_destroy(DI_Service* service);

DI_Error json_service_provider(DI_Container* container, void** out_service);
void json_service_destroy(DI_Service* service);

DI_Error hash_service_provider(DI_Container* container, void** out_service);
void hash_service_destroy(DI_Service* service);

DI_Error sqlite_service_provider(DI_Container* container, void** out_service);
void sqlite_service_destroy(DI_Service* service);

DI_Error auth_service_provider(DI_Container* container, void** out_service);
void auth_service_destroy(DI_Service* service);

DI_Error error_service_provider(DI_Container* container, void** out_service);
void error_service_destroy(DI_Service* service);

DI_Error updater_service_provider(DI_Container* container, void** out_service);
void updater_service_destroy(DI_Service* service);

/**
 * Initialize the application module
 * Registers all services in the correct order (dependencies first)
 */
static inline int app_module_init(void) {
    DI_Container* container = DI_GetGlobalContainer();

    /* Register services in dependency order */

    /* 1. Foundation services - no dependencies */
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

    err = DI_Container_Register(
        container,
        "json_service",
        DI_SCOPE_SINGLETON,
        json_service_provider,
        json_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register JsonService: %s\n", DI_Error_Message(err));
        return 1;
    }

    err = DI_Container_Register(
        container,
        "hash_service",
        DI_SCOPE_SINGLETON,
        hash_service_provider,
        hash_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register HashService: %s\n", DI_Error_Message(err));
        return 1;
    }

    /* 2. Services with dependencies on foundation */
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

    err = DI_Container_Register(
        container,
        "http_service",
        DI_SCOPE_SINGLETON,
        http_service_provider,
        http_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register HttpService: %s\n", DI_Error_Message(err));
        return 1;
    }

    /* 3. High-level services - depend on multiple services */
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

    err = DI_Container_Register(
        container,
        "sqlite_service",
        DI_SCOPE_SINGLETON,
        sqlite_service_provider,
        sqlite_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register SQLiteService: %s\n", DI_Error_Message(err));
        return 1;
    }

    err = DI_Container_Register(
        container,
        "auth_service",
        DI_SCOPE_SINGLETON,
        auth_service_provider,
        auth_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register AuthService: %s\n", DI_Error_Message(err));
        return 1;
    }

    err = DI_Container_Register(
        container,
        "error_service",
        DI_SCOPE_SINGLETON,
        error_service_provider,
        error_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register ErrorService: %s\n", DI_Error_Message(err));
        return 1;
    }

    err = DI_Container_Register(
        container,
        "updater_service",
        DI_SCOPE_SINGLETON,
        updater_service_provider,
        updater_service_destroy
    );
    if (err != DI_OK) {
        fprintf(stderr, "Failed to register UpdaterService: %s\n", DI_Error_Message(err));
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
