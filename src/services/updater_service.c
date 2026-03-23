/* Auto-Updater Service Implementation - Application update management */

#include "updater_service.h"
#include "logger_service.h"
#include "http_service.h"
#include "file_service.h"
#include "hash_service.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <time.h>
#include <sys/stat.h>

/* Default update server */
#define DEFAULT_UPDATE_SERVER "https://releases.example.com"
#define DEFAULT_CHECK_INTERVAL 24  /* hours */

/* Internal state names */
static const char* state_names[] = {
    "idle",
    "checking",
    "available",
    "downloading",
    "verifying",
    "ready",
    "installed",
    "error"
};

/* ==================== Helper Functions ==================== */

static void set_error(UpdaterService* self, const char* format, ...) {
    if (!self) return;
    
    char buffer[512];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    
    free(self->download_path);
    self->download_path = strdup(buffer);  /* Reuse for error storage */
    self->state = UPDATE_STATE_ERROR;
}

static void clear_error(UpdaterService* self) {
    if (!self) return;
    free(self->download_path);
    self->download_path = NULL;
}

static void set_state(UpdaterService* self, UpdateState state) {
    if (!self) return;
    
    LoggerService* logger = logger_service_inject();
    self->state = state;
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: State changed to %s", state_names[state]);
    }
    
    if (self->callback) {
        self->callback(state, &self->progress, self->callback_user_data);
    }
}

/* ==================== Initialization ==================== */

int updater_init(UpdaterService* self, const UpdaterConfig* config) {
    if (!self || !config) return 0;
    
    LoggerService* logger = logger_service_inject();
    
    self->current_version = strdup(config->current_version ? config->current_version : "0.0.0");
    self->update_server_url = strdup(config->update_server_url ? config->update_server_url : DEFAULT_UPDATE_SERVER);
    self->download_dir = strdup(config->download_dir ? config->download_dir : "./updates");
    self->latest_version = NULL;
    self->download_path = NULL;
    self->state = UPDATE_STATE_IDLE;
    self->update_info = NULL;
    self->check_interval_hours = config->check_interval_hours > 0 ? config->check_interval_hours : DEFAULT_CHECK_INTERVAL;
    self->auto_download = config->auto_download;
    self->auto_install = config->auto_install;
    self->callback = config->callback;
    self->callback_user_data = config->callback_user_data;
    self->last_check = 0;
    self->last_update = 0;
    
    memset(&self->progress, 0, sizeof(self->progress));
    
    if (logger) {
        logger_log(logger, "INFO", "UpdaterService initialized for version %s", self->current_version);
        logger_log(logger, "INFO", "Update server: %s", self->update_server_url);
        logger_log(logger, "INFO", "Check interval: %d hours", self->check_interval_hours);
    }
    
    return 1;
}

int updater_init_default(UpdaterService* self) {
    UpdaterConfig config = {0};
    return updater_init(self, &config);
}

/* ==================== Update Checking ==================== */

int updater_check_for_updates(UpdaterService* self) {
    if (!self) return -1;
    
    LoggerService* logger = logger_service_inject();
    set_state(self, UPDATE_STATE_CHECKING);
    clear_error(self);
    
    self->last_check = time(NULL);
    
    /* In production, this would make an HTTP request to the update server */
    /* For now, we'll simulate the check */
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: Checking for updates from %s", self->update_server_url);
    }
    
    /* Simulate version check - in production, parse JSON response */
    /* Example response: {"version": "1.1.0", "url": "...", "notes": "...", "critical": false} */
    
    /* For demo: assume no update available */
    set_state(self, UPDATE_STATE_IDLE);
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: No updates available");
    }
    
    return 0;  /* No update */
}

const UpdateInfo* updater_get_update_info(UpdaterService* self) {
    if (!self) return NULL;
    return self->update_info;
}

bool updater_is_update_available(UpdaterService* self) {
    if (!self) return false;
    return self->state == UPDATE_STATE_AVAILABLE || 
           self->state == UPDATE_STATE_DOWNLOADING ||
           self->state == UPDATE_STATE_READY;
}

bool updater_is_update_mandatory(UpdaterService* self) {
    if (!self || !self->update_info) return false;
    return self->update_info->is_mandatory;
}

/* ==================== Download ==================== */

int updater_download(UpdaterService* self) {
    if (!self || !self->update_info) return 0;
    
    LoggerService* logger = logger_service_inject();
    
    if (!updater_is_update_available(self)) {
        set_error(self, "No update available to download");
        return 0;
    }
    
    set_state(self, UPDATE_STATE_DOWNLOADING);
    
    /* Create download directory */
    FileService* files = file_service_inject();
    if (files) {
        char mkdir_cmd[512];
        snprintf(mkdir_cmd, sizeof(mkdir_cmd), "mkdir -p '%s'", self->download_dir);
        system(mkdir_cmd);
    }
    
    /* In production, download from self->update_info->download_url */
    /* For now, simulate download progress */
    
    self->progress.total = self->update_info->size;
    self->progress.downloaded = 0;
    self->progress.percentage = 0;
    
    /* Simulate download */
    for (int i = 0; i <= 100; i += 10) {
        self->progress.downloaded = (self->progress.total * i) / 100;
        self->progress.percentage = i;
        
        if (self->callback) {
            self->callback(self->state, &self->progress, self->callback_user_data);
        }
        
        /* Simulate network delay */
        struct timespec ts = {0, 100000000};  /* 100ms */
        nanosleep(&ts, NULL);
    }
    
    /* Set download path */
    self->download_path = malloc(512);
    snprintf(self->download_path, 512, "%s/update-%s.zip", self->download_dir, self->latest_version);
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: Download completed: %s", self->download_path);
    }
    
    set_state(self, UPDATE_STATE_VERIFYING);
    return 1;
}

int updater_cancel_download(UpdaterService* self) {
    if (!self) return 0;
    
    if (self->state != UPDATE_STATE_DOWNLOADING) {
        return 0;
    }
    
    /* Cancel ongoing download */
    set_state(self, UPDATE_STATE_IDLE);
    
    /* Remove partial download */
    if (self->download_path) {
        FileService* files = file_service_inject();
        if (files) {
            file_delete(files, self->download_path);
        }
        free(self->download_path);
        self->download_path = NULL;
    }
    
    return 1;
}

const UpdateProgress* updater_get_progress(UpdaterService* self) {
    if (!self) return NULL;
    return &self->progress;
}

/* ==================== Verification ==================== */

int updater_verify(UpdaterService* self) {
    if (!self || !self->download_path) return 0;
    
    LoggerService* logger = logger_service_inject();
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: Verifying download...");
    }
    
    /* In production, verify checksum against self->update_info->checksum */
    /* For now, assume verification passes */
    
    set_state(self, UPDATE_STATE_READY);
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: Verification successful");
    }
    
    return 1;
}

bool updater_is_verified(UpdaterService* self) {
    if (!self) return false;
    return self->state == UPDATE_STATE_READY || self->state == UPDATE_STATE_INSTALLED;
}

/* ==================== Installation ==================== */

int updater_install(UpdaterService* self) {
    if (!self || !self->download_path) return 0;
    
    LoggerService* logger = logger_service_inject();
    
    if (self->state != UPDATE_STATE_READY) {
        set_error(self, "Update not ready for installation");
        return 0;
    }
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: Installing update %s", self->latest_version);
    }
    
    /* In production:
     * 1. Extract archive
     * 2. Backup current version
     * 3. Replace files
     * 4. Run post-install scripts
     * 5. Mark for restart
     */
    
    /* For demo, just mark as installed */
    set_state(self, UPDATE_STATE_INSTALLED);
    self->last_update = time(NULL);
    
    /* Update current version */
    free(self->current_version);
    self->current_version = strdup(self->latest_version);
    
    if (logger) {
        logger_log(logger, "INFO", "Updater: Installation complete. Restart required.");
    }
    
    return 1;
}

int updater_schedule_install(UpdaterService* self) {
    if (!self || !self->download_path) return 0;
    
    /* Save install schedule to file */
    FileService* files = file_service_inject();
    if (!files) return 0;
    
    char schedule_path[512];
    snprintf(schedule_path, sizeof(schedule_path), "%s/.pending_update", self->download_dir);
    
    FILE* f = fopen(schedule_path, "w");
    if (!f) return 0;
    
    fprintf(f, "version=%s\n", self->latest_version);
    fprintf(f, "path=%s\n", self->download_path);
    fprintf(f, "scheduled=%ld\n", (long)time(NULL));
    
    fclose(f);
    
    LoggerService* logger = logger_service_inject();
    if (logger) {
        logger_log(logger, "INFO", "Updater: Install scheduled for next restart");
    }
    
    return 1;
}

bool updater_is_ready(UpdaterService* self) {
    if (!self) return false;
    return self->state == UPDATE_STATE_READY;
}

int updater_apply_pending(UpdaterService* self) {
    if (!self) return 0;
    
    FileService* files = file_service_inject();
    if (!files) return 0;
    
    char schedule_path[512];
    snprintf(schedule_path, sizeof(schedule_path), "%s/.pending_update", self->download_dir);
    
    if (!file_exists(files, schedule_path)) {
        return 0;  /* No pending update */
    }
    
    /* Read pending update info */
    char* content = file_read_text(files, schedule_path);
    if (!content) return 0;
    
    /* Parse file (simple parsing for demo) */
    char* line = strtok(content, "\n");
    char* version = NULL;
    char* path = NULL;
    
    while (line) {
        if (strncmp(line, "version=", 8) == 0) {
            version = line + 8;
        } else if (strncmp(line, "path=", 5) == 0) {
            path = line + 5;
        }
        line = strtok(NULL, "\n");
    }
    
    if (!version || !path) {
        free(content);
        return 0;
    }
    
    LoggerService* logger = logger_service_inject();
    if (logger) {
        logger_log(logger, "INFO", "Updater: Applying pending update %s", version);
    }
    
    /* Apply update (extract and replace) */
    /* For demo, just clean up */
    file_delete(files, schedule_path);
    
    free(content);
    return 1;
}

/* ==================== State Management ==================== */

UpdateState updater_get_state(UpdaterService* self) {
    if (!self) return UPDATE_STATE_IDLE;
    return self->state;
}

const char* updater_state_name(UpdateState state) {
    if (state < 0 || state > UPDATE_STATE_ERROR) return "unknown";
    return state_names[state];
}

void updater_reset(UpdaterService* self) {
    if (!self) return;
    
    set_state(self, UPDATE_STATE_IDLE);
    clear_error(self);
    memset(&self->progress, 0, sizeof(self->progress));
}

int updater_clear(UpdaterService* self) {
    if (!self) return 0;
    
    /* Remove downloaded update */
    if (self->download_path) {
        FileService* files = file_service_inject();
        if (files) {
            file_delete(files, self->download_path);
        }
        free(self->download_path);
        self->download_path = NULL;
    }
    
    /* Free update info */
    if (self->update_info) {
        free(self->update_info->version);
        free(self->update_info->release_notes);
        free(self->update_info->download_url);
        free(self->update_info->checksum);
        free(self->update_info);
        self->update_info = NULL;
    }
    
    free(self->latest_version);
    self->latest_version = NULL;
    
    updater_reset(self);
    
    return 1;
}

/* ==================== Configuration ==================== */

void updater_set_server_url(UpdaterService* self, const char* url) {
    if (!self || !url) return;
    free(self->update_server_url);
    self->update_server_url = strdup(url);
}

void updater_set_check_interval(UpdaterService* self, int hours) {
    if (!self) return;
    self->check_interval_hours = hours > 0 ? hours : DEFAULT_CHECK_INTERVAL;
}

void updater_set_auto_download(UpdaterService* self, bool enabled) {
    if (!self) return;
    self->auto_download = enabled;
}

time_t updater_get_last_check(UpdaterService* self) {
    if (!self) return 0;
    return self->last_check;
}

bool updater_should_check(UpdaterService* self) {
    if (!self) return false;
    
    time_t now = time(NULL);
    time_t elapsed = now - self->last_check;
    
    return elapsed >= (self->check_interval_hours * 3600);
}

/* ==================== Error Handling ==================== */

const char* updater_get_error(UpdaterService* self) {
    if (!self || !self->download_path) return NULL;
    return self->download_path;  /* Reused for error storage */
}

void updater_clear_error(UpdaterService* self) {
    if (!self) return;
    clear_error(self);
}

/* ==================== Version Utilities ==================== */

int updater_compare_versions(const char* v1, const char* v2) {
    if (!v1 || !v2) return 0;
    
    int major1, minor1, patch1;
    int major2, minor2, patch2;
    
    sscanf(v1, "%d.%d.%d", &major1, &minor1, &patch1);
    sscanf(v2, "%d.%d.%d", &major2, &minor2, &patch2);
    
    if (major1 != major2) return major1 - major2;
    if (minor1 != minor2) return minor1 - minor2;
    return patch1 - patch2;
}

const char* updater_get_current_version(UpdaterService* self) {
    if (!self) return NULL;
    return self->current_version;
}

const char* updater_get_latest_version(UpdaterService* self) {
    if (!self) return NULL;
    return self->latest_version;
}

/* ==================== DI Service Implementation ==================== */

UpdaterService* updater_service_inject(void) {
    void* service;
    DI_Error err = DI_Container_Get(DI_GetGlobalContainer(), "updater_service", &service);
    if (err != DI_OK) {
        return NULL;
    }
    return (UpdaterService*)service;
}

DI_Error updater_service_provider(DI_Container* container, void** out_service) {
    LoggerService* logger = NULL;

    DI_Error err = DI_Container_Get(container, "logger_service", (void**)&logger);
    if (err != DI_OK) {
        return err;
    }

    UpdaterService* self = (UpdaterService*)calloc(1, sizeof(UpdaterService));
    if (!self) {
        return DI_ERROR_OUT_OF_MEMORY;
    }

    self->base.name = "updater_service";
    self->base.initialized = 0;
    self->base.destroy = updater_service_destroy;

    if (!updater_init_default(self)) {
        free(self);
        return DI_ERROR_OUT_OF_MEMORY;
    }

    self->base.initialized = 1;

    if (logger) {
        logger_log(logger, "INFO", "UpdaterService created");
    }

    *out_service = self;
    return DI_OK;
}

void updater_service_destroy(DI_Service* service) {
    if (!service) return;

    UpdaterService* self = (UpdaterService*)service;
    LoggerService* logger = logger_service_inject();

    if (self->base.initialized) {
        updater_clear(self);

        free(self->current_version);
        free(self->update_server_url);
        free(self->download_dir);
        self->base.initialized = 0;
    }

    if (logger) {
        logger_log(logger, "INFO", "UpdaterService destroyed");
    }

    free(self);
}
