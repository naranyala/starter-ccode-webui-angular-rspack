/* WebUI Service - Wrapper for WebUI library with DI */

#ifndef WEBUI_SERVICE_H
#define WEBUI_SERVICE_H

#include "di/di.h"
#include "services/logger_service.h"
#include "services/config_service.h"
#include "webui.h"
#include <stdbool.h>

typedef struct WebuiService {
    DI_Service base;
    LoggerService* logger;    /* Dependency */
    ConfigService* config;    /* Dependency */
    size_t window;
    bool initialized;
} WebuiService;

DI_DECLARE_SERVICE(WebuiService, webui_service);

/* WebUI methods */
bool webui_init_window(WebuiService* self);
void webui_show_content(WebuiService* self, const char* content);
void webui_wait_window(WebuiService* self);
void webui_cleanup_window(WebuiService* self);

#endif /* WEBUI_SERVICE_H */
