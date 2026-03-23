/* Auto-Updater Service - Application update management */

#ifndef UPDATER_SERVICE_H
#define UPDATER_SERVICE_H

#include "di/di.h"
#include <stdbool.h>
#include <time.h>

/* Update states */
typedef enum {
    UPDATE_STATE_IDLE = 0,
    UPDATE_STATE_CHECKING = 1,
    UPDATE_STATE_AVAILABLE = 2,
    UPDATE_STATE_DOWNLOADING = 3,
    UPDATE_STATE_VERIFYING = 4,
    UPDATE_STATE_READY = 5,
    UPDATE_STATE_INSTALLED = 6,
    UPDATE_STATE_ERROR = 7
} UpdateState;

/* Update info */
typedef struct {
    char* version;
    char* release_notes;
    char* download_url;
    long long size;
    char* checksum;
    time_t release_date;
    bool is_critical;
    bool is_mandatory;
} UpdateInfo;

/* Update progress */
typedef struct {
    int percentage;
    long long downloaded;
    long long total;
    double speed;  /* bytes per second */
    time_t eta;    /* estimated time remaining */
} UpdateProgress;

/* Update callback */
typedef void (*update_callback_fn)(UpdateState state, const UpdateProgress* progress, void* user_data);

/* Updater configuration */
typedef struct {
    const char* current_version;
    const char* update_server_url;
    const char* download_dir;
    int check_interval_hours;
    bool auto_download;
    bool auto_install;
    update_callback_fn callback;
    void* callback_user_data;
} UpdaterConfig;

typedef struct UpdaterService {
    DI_Service base;
    char* current_version;
    char* update_server_url;
    char* download_dir;
    char* latest_version;
    char* download_path;
    UpdateState state;
    UpdateProgress progress;
    UpdateInfo* update_info;
    int check_interval_hours;
    bool auto_download;
    bool auto_install;
    update_callback_fn callback;
    void* callback_user_data;
    time_t last_check;
    time_t last_update;
} UpdaterService;

/* Forward declarations for DI system */
DI_Error updater_service_provider(DI_Container* container, void** out_service);
void updater_service_destroy(DI_Service* service);

/* Accessor function */
UpdaterService* updater_service_inject(void);

/* ==================== Initialization ==================== */

/**
 * Initialize updater service with configuration
 * @param self Updater service instance
 * @param config Configuration options
 * @return 1 on success, 0 on failure
 */
int updater_init(UpdaterService* self, const UpdaterConfig* config);

/**
 * Initialize updater service with defaults
 * @param self Updater service instance
 * @return 1 on success, 0 on failure
 */
int updater_init_default(UpdaterService* self);

/* ==================== Update Checking ==================== */

/**
 * Check for available updates
 * @param self Updater service instance
 * @return 1 if update available, 0 if not, -1 on error
 */
int updater_check_for_updates(UpdaterService* self);

/**
 * Get latest update info
 * @param self Updater service instance
 * @return Update info, or NULL if no update available
 */
const UpdateInfo* updater_get_update_info(UpdaterService* self);

/**
 * Check if update is available
 * @param self Updater service instance
 * @return 1 if update available, 0 otherwise
 */
bool updater_is_update_available(UpdaterService* self);

/**
 * Check if update is mandatory
 * @param self Updater service instance
 * @return 1 if mandatory, 0 otherwise
 */
bool updater_is_update_mandatory(UpdaterService* self);

/* ==================== Download ==================== */

/**
 * Download available update
 * @param self Updater service instance
 * @return 1 on success, 0 on failure
 */
int updater_download(UpdaterService* self);

/**
 * Cancel ongoing download
 * @param self Updater service instance
 * @return 1 on success, 0 on failure
 */
int updater_cancel_download(UpdaterService* self);

/**
 * Get download progress
 * @param self Updater service instance
 * @return Current progress
 */
const UpdateProgress* updater_get_progress(UpdaterService* self);

/* ==================== Verification ==================== */

/**
 * Verify downloaded update
 * @param self Updater service instance
 * @return 1 if valid, 0 if invalid
 */
int updater_verify(UpdaterService* self);

/**
 * Get verification status
 * @param self Updater service instance
 * @return 1 if verified, 0 if not
 */
bool updater_is_verified(UpdaterService* self);

/* ==================== Installation ==================== */

/**
 * Install downloaded update
 * @param self Updater service instance
 * @return 1 on success, 0 on failure
 */
int updater_install(UpdaterService* self);

/**
 * Schedule update installation for next restart
 * @param self Updater service instance
 * @return 1 on success, 0 on failure
 */
int updater_schedule_install(UpdaterService* self);

/**
 * Check if update is ready to install
 * @param self Updater service instance
 * @return 1 if ready, 0 otherwise
 */
bool updater_is_ready(UpdaterService* self);

/**
 * Apply pending update (called at startup)
 * @param self Updater service instance
 * @return 1 on success, 0 on failure
 */
int updater_apply_pending(UpdaterService* self);

/* ==================== State Management ==================== */

/**
 * Get current updater state
 * @param self Updater service instance
 * @return Current state
 */
UpdateState updater_get_state(UpdaterService* self);

/**
 * Get state name string
 * @param state Update state
 * @return State name
 */
const char* updater_state_name(UpdateState state);

/**
 * Reset updater state
 * @param self Updater service instance
 */
void updater_reset(UpdaterService* self);

/**
 * Clear downloaded update
 * @param self Updater service instance
 * @return 1 on success, 0 on failure
 */
int updater_clear(UpdaterService* self);

/* ==================== Configuration ==================== */

/**
 * Set update server URL
 * @param self Updater service instance
 * @param url Server URL
 */
void updater_set_server_url(UpdaterService* self, const char* url);

/**
 * Set check interval
 * @param self Updater service instance
 * @param hours Interval in hours
 */
void updater_set_check_interval(UpdaterService* self, int hours);

/**
 * Enable/disable auto download
 * @param self Updater service instance
 * @param enabled Enable flag
 */
void updater_set_auto_download(UpdaterService* self, bool enabled);

/**
 * Get last check time
 * @param self Updater service instance
 * @return Last check timestamp
 */
time_t updater_get_last_check(UpdaterService* self);

/**
 * Check if it's time to check for updates
 * @param self Updater service instance
 * @return 1 if time to check, 0 otherwise
 */
bool updater_should_check(UpdaterService* self);

/* ==================== Error Handling ==================== */

/**
 * Get last error message
 * @param self Updater service instance
 * @return Error message
 */
const char* updater_get_error(UpdaterService* self);

/**
 * Clear error state
 * @param self Updater service instance
 */
void updater_clear_error(UpdaterService* self);

/* ==================== Version Utilities ==================== */

/**
 * Compare two version strings
 * @param v1 First version
 * @param v2 Second version
 * @return -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
int updater_compare_versions(const char* v1, const char* v2);

/**
 * Get current version string
 * @param self Updater service instance
 * @return Current version
 */
const char* updater_get_current_version(UpdaterService* self);

/**
 * Get latest version string
 * @param self Updater service instance
 * @return Latest version, or NULL if not checked
 */
const char* updater_get_latest_version(UpdaterService* self);

#endif /* UPDATER_SERVICE_H */
