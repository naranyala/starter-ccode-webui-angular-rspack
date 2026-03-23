/* Main Application - Using DI System */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include "di/di.h"
#include "app_module.h"
#include "services/logger_service.h"
#include "services/config_service.h"
#include "services/webui_service.h"
#include "services/event_service.h"
#include "services/file_service.h"
#include "services/timer_service.h"
#include "services/http_service.h"
#include "services/json_service.h"
#include "services/hash_service.h"
#include "services/sqlite_service.h"
#include "services/duckdb_service.h"
#include "services/auth_service.h"
#include "services/crud_api.h"
#include "migrations.h"

/* Demo event handlers */
static void on_app_event(const char* event, const char* payload, void* user_data) {
    LoggerService* logger = (LoggerService*)user_data;
    logger_log(logger, "EVENT", "Received event '%s': %s", event, payload);
}

static void on_timer_tick(void* user_data) {
    LoggerService* logger = (LoggerService*)user_data;
    logger_log(logger, "DEBUG", "Timer tick!");
}

int main(void) {
    /* Initialize app module (registers all services) */
    if (app_module_init() != 0) {
        fprintf(stderr, "Failed to initialize app module\n");
        return 1;
    }

    /* Inject and use services - similar to Angular's inject() */
    LoggerService* logger = logger_service_inject();
    if (!logger) {
        fprintf(stderr, "Failed to inject LoggerService\n");
        app_module_destroy();
        return 1;
    }

    logger_log(logger, "INFO", "Application starting...");

    /* Inject FileService and demonstrate file operations */
    FileService* files = file_service_inject();
    if (!files) {
        logger_log(logger, "ERROR", "Failed to inject FileService");
        app_module_destroy();
        return 1;
    }

    logger_log(logger, "INFO", "Working directory: %s", file_get_working_dir(files));

    /* Inject EventService and demonstrate pub/sub */
    EventService* events = event_service_inject();
    if (!events) {
        logger_log(logger, "ERROR", "Failed to inject EventService");
        app_module_destroy();
        return 1;
    }

    /* Subscribe to events */
    event_subscribe(events, "app.started", on_app_event, logger);
    event_subscribe(events, "app.stopped", on_app_event, logger);
    logger_log(logger, "INFO", "Subscribed to events. Listeners: %d",
               event_get_listener_count(events, "app.started"));

    /* Emit events */
    event_emit(events, "app.started", "Application initialized successfully");

    /* Inject TimerService and demonstrate timers */
    TimerService* timers = timer_service_inject();
    if (!timers) {
        logger_log(logger, "ERROR", "Failed to inject TimerService");
        app_module_destroy();
        return 1;
    }

    /* Set up a repeating timer */
    int timer_id = timer_set_interval(timers, 1000, on_timer_tick, logger);
    logger_log(logger, "INFO", "Started timer with id: %d", timer_id);

    /* Inject ConfigService */
    ConfigService* config = config_service_inject();
    if (!config) {
        logger_log(logger, "ERROR", "Failed to inject ConfigService");
        app_module_destroy();
        return 1;
    }

    logger_log(logger, "INFO", "Starting %s v%s",
               config_get_app_name(config),
               config_get_app_version(config));

    /* Inject JsonService and demonstrate JSON operations */
    JsonService* json = json_service_inject();
    if (!json) {
        logger_log(logger, "ERROR", "Failed to inject JsonService");
        app_module_destroy();
        return 1;
    }
    (void)json; /* JSON service is stateless, just checking it's available */

    /* Inject HashService and demonstrate hashing */
    HashService* hash = hash_service_inject();
    if (!hash) {
        logger_log(logger, "ERROR", "Failed to inject HashService");
        app_module_destroy();
        return 1;
    }

    const char* test_data = "Hello, World!";
    char* md5_hash = hash_md5_hex(test_data, strlen(test_data));
    char* sha256_hash = hash_sha256_hex(test_data, strlen(test_data));
    logger_log(logger, "INFO", "MD5 of '%s': %s", test_data, md5_hash);
    logger_log(logger, "INFO", "SHA256 of '%s': %s", test_data, sha256_hash);
    free(md5_hash);
    free(sha256_hash);

    /* Set database mode - can be changed via: DB_SQLITE, DB_DUCKDB, or DB_AUTO */
    /* Example: app_set_database_mode(DB_DUCKDB); */
    DatabaseMode db_mode = app_get_database_mode();
    
    logger_log(logger, "INFO", "Database mode: %s", 
               db_mode == DB_SQLITE ? "SQLite" : 
               db_mode == DB_DUCKDB ? "DuckDB" : "Auto-detect");

    /* Inject SQLiteService and demonstrate database operations */
    SQLiteService* sqlite = sqlite_service_inject();
    if (!sqlite) {
        logger_log(logger, "ERROR", "Failed to inject SQLiteService");
        app_module_destroy();
        return 1;
    }

    /* Open database */
    if (sqlite_open(sqlite, "app.db")) {
        logger_log(logger, "INFO", "SQLite: Database opened successfully");

        /* Run migrations */
        if (sqlite_migrate(sqlite, migrations, migrations_count, -1)) {
            int version = sqlite_get_version(sqlite);
            logger_log(logger, "INFO", "SQLite: Database migrated to version %d", version);

            /* Demo: Create a test user via AuthService */
            AuthService* auth = auth_service_inject();
            if (auth) {
                logger_log(logger, "INFO", "AuthService injected successfully");

                /* Demo registration */
                AuthRegisterData reg_data = {
                    .username = "admin",
                    .email = "admin@example.com",
                    .password = "Admin123!"
                };

                AuthUser* new_user = NULL;
                char* reg_error = NULL;

                if (auth_register(auth, &reg_data, &new_user, &reg_error)) {
                    logger_log(logger, "INFO", "Auth: Registered user '%s' (id: %lld)",
                               new_user->username, new_user->id);
                    auth_free_user(new_user);
                } else {
                    logger_log(logger, "WARN", "Auth: Registration failed: %s",
                               reg_error ? reg_error : "unknown error");
                    free(reg_error);
                }

                /* Demo login */
                AuthLoginCredentials login_creds = {
                    .username_or_email = "admin",
                    .password = "Admin123!"
                };

                AuthToken* token = NULL;
                AuthUser* logged_user = NULL;
                char* login_error = NULL;

                if (auth_login(auth, &login_creds, &token, &logged_user, &login_error)) {
                    logger_log(logger, "INFO", "Auth: Login successful for user '%s'",
                               logged_user->username);
                    logger_log(logger, "INFO", "Auth: Access token generated (expires: %ld)",
                               (long)token->expires_at);
                    auth_free_token(token);
                    auth_free_user(logged_user);
                } else {
                    logger_log(logger, "WARN", "Auth: Login failed: %s",
                               login_error ? login_error : "unknown error");
                    free(login_error);
                }
            }
        } else {
            logger_log(logger, "ERROR", "SQLite: Migration failed: %s", sqlite_last_error(sqlite));
        }
    } else {
        logger_log(logger, "ERROR", "SQLite: Failed to open database: %s", sqlite_last_error(sqlite));
    }

    /* Inject WebuiService */
    WebuiService* webui = webui_service_inject();
    if (!webui) {
        logger_log(logger, "ERROR", "Failed to inject WebuiService");
        app_module_destroy();
        return 1;
    }

    /* Initialize WebUI window */
    if (webui_init_window(webui)) {
        /* Initialize CRUD API handlers */
        if (sqlite) {
            crud_api_init(webui, sqlite);
            logger_log(logger, "INFO", "CRUD API handlers bound to window");
        }
        
        /* Show the application */
        webui_show_content(webui, "index.html");

        /* Main loop with timer updates */
        logger_log(logger, "INFO", "Entering main loop...");

        /* Run timer updates for a few iterations before showing UI */
        for (int i = 0; i < 5; i++) {
            timer_update(timers);
            usleep(1100000); /* 1.1 seconds */
        }

        /* Clear the demo timer */
        timer_clear(timers, timer_id);
        logger_log(logger, "INFO", "Active timers: %d", timer_get_active_count(timers));

        /* Wait for window close */
        webui_wait_window(webui);
    } else {
        logger_log(logger, "WARN", "WebUI window initialization failed, running headless");
    }

    /* Emit stopped event */
    event_emit(events, "app.stopped", "Application shutting down");

    /* Cleanup */
    logger_log(logger, "INFO", "Application shutting down...");
    app_module_destroy();

    return 0;
}
