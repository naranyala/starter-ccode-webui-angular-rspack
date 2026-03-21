/* Main Application - Using DI System */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include "di/di.h"
#include "app_module.h"
#include "services/logger_service.h"
#include "services/config_service.h"
#include "services/webui_service.h"
#include "services/event_service.h"
#include "services/file_service.h"
#include "services/timer_service.h"

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
               config_get_app_name(config));
    
    /* Inject WebuiService */
    WebuiService* webui = webui_service_inject();
    if (!webui) {
        logger_log(logger, "ERROR", "Failed to inject WebuiService");
        app_module_destroy();
        return 1;
    }
    
    /* Initialize WebUI window */
    if (!webui_init_window(webui)) {
        logger_log(logger, "ERROR", "Failed to initialize WebUI window");
        app_module_destroy();
        return 1;
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
    
    /* Emit stopped event */
    event_emit(events, "app.stopped", "Application shutting down");
    
    /* Cleanup */
    logger_log(logger, "INFO", "Application shutting down...");
    app_module_destroy();
    
    return 0;
}
