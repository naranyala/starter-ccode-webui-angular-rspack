/* WebUI Service Implementation */

#include "services/webui_service.h"
#include <stdio.h>
#include <string.h>
#include <libgen.h>
#include <unistd.h>
#include <limits.h>

static void get_exe_dir(char *buf, size_t size) {
    ssize_t len = readlink("/proc/self/exe", buf, size - 1);
    if (len != -1) {
        buf[len] = '\0';
        char *dir = dirname(buf);
        memmove(buf, dir, strlen(dir) + 1);
    } else {
        buf[0] = '.';
        buf[1] = '\0';
    }
}

DI_SERVICE_INIT(WebuiService, webui_service) {
    if (!self) return DI_ERROR_NULL_POINTER;
    
    /* Inject dependencies - similar to Angular constructor injection */
    self->logger = logger_service_inject();
    self->config = config_service_inject();
    
    if (!self->logger) {
        fprintf(stderr, "WebuiService: Failed to inject LoggerService\n");
        return DI_ERROR_INIT_FAILED;
    }
    if (!self->config) {
        fprintf(stderr, "WebuiService: Failed to inject ConfigService\n");
        return DI_ERROR_INIT_FAILED;
    }
    
    self->window = 0;
    self->initialized = false;
    
    logger_log(self->logger, "INFO", "WebuiService initialized");
    
    return DI_OK;
}

DI_SERVICE_CLEANUP(WebuiService, webui_service) {
    if (!self) return;
    if (self->initialized) {
        webui_clean();
        self->initialized = false;
    }
    if (self->logger) {
        logger_log(self->logger, "DEBUG", "WebuiService cleanup");
    }
}

DI_DEFINE_SERVICE(WebuiService, webui_service)

bool webui_init_window(WebuiService* self) {
    if (!self || !self->logger || !self->config) return false;
    
    /* Get executable directory */
    char exe_dir[PATH_MAX];
    get_exe_dir(exe_dir, sizeof(exe_dir));
    
    /* Build frontend path */
    char temp_path[PATH_MAX * 2];
    snprintf(temp_path, sizeof(temp_path), "%s/../frontend/dist/browser", exe_dir);
    
    /* Normalize path */
    char normalized_path[PATH_MAX];
    if (realpath(temp_path, normalized_path) == NULL) {
        logger_log(self->logger, "ERROR", "Failed to resolve frontend path: %s", temp_path);
        return false;
    }
    
    logger_log(self->logger, "INFO", "Frontend path: %s", normalized_path);
    
    /* Create window */
    self->window = webui_new_window();
    
    /* Set root folder */
    if (!webui_set_root_folder(self->window, normalized_path)) {
        logger_log(self->logger, "ERROR", "Failed to set root folder");
        return false;
    }
    
    self->initialized = true;
    logger_log(self->logger, "INFO", "WebUI window initialized");
    
    return true;
}

void webui_show_content(WebuiService* self, const char* content) {
    if (!self || !self->logger) return;
    
    logger_log(self->logger, "INFO", "Showing content: %s", content);
    
    if (!webui_show(self->window, content)) {
        logger_log(self->logger, "ERROR", "Failed to show web UI");
    }
}

void webui_wait_window(WebuiService* self) {
    if (!self || !self->logger) return;
    
    logger_log(self->logger, "INFO", "Waiting for window close...");
    webui_wait();
}

void webui_cleanup_window(WebuiService* self) {
    if (!self || !self->logger) return;
    
    logger_log(self->logger, "INFO", "Cleaning up WebUI window");
    webui_clean();
    self->initialized = false;
}
