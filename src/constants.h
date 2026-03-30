/**
 * @file constants.h
 * @brief Centralized constants for the entire application
 * 
 * This file contains all named constants to avoid magic numbers
 * throughout the codebase.
 */

#ifndef CONSTANTS_H
#define CONSTANTS_H

/* ============================================================================
 * Buffer Sizes
 * ============================================================================ */

/** General purpose buffer sizes */
#define DEFAULT_BUFFER_SIZE         4096
#define SMALL_BUFFER_SIZE           1024
#define LARGE_BUFFER_SIZE           65536

/** Path and URL sizes */
#define MAX_FILE_PATH_SIZE          512
#define MAX_URL_SIZE                512
#define MAX_ERROR_MESSAGE_SIZE      512

/** String sizes */
#define MAX_NAME_SIZE               128
#define MAX_EMAIL_SIZE              256
#define MAX_TOKEN_SIZE              512

/* ============================================================================
 * Event Service Constants
 * ============================================================================ */

#define EVENT_MAX_HANDLERS          32
#define EVENT_MAX_NAME_LENGTH       64
#define EVENT_MAX_PAYLOAD_SIZE      1024

/* ============================================================================
 * Timer Service Constants
 * ============================================================================ */

#define TIMER_MAX_TIMERS            32
#define TIMER_DEFAULT_INTERVAL      1000    /* 1 second */

/* ============================================================================
 * JSON Service Constants
 * ============================================================================ */

#define JSON_DEFAULT_CAPACITY       8
#define JSON_MAX_DEPTH              32
#define JSON_DEFAULT_INDENT         2

/* ============================================================================
 * HTTP Service Constants
 * ============================================================================ */

#define HTTP_MAX_HEADERS            32
#define HTTP_MAX_URL_LENGTH         512
#define HTTP_MAX_RESPONSE_SIZE      65536
#define HTTP_DEFAULT_TIMEOUT_MS     30000

/* ============================================================================
 * SQLite Service Constants
 * ============================================================================ */

#define SQLITE_MAX_PARAMS           100
#define SQLITE_DEFAULT_PAGE_SIZE    4096
#define SQLITE_MAX_PATH_SIZE        512

/* ============================================================================
 * Logger Service Constants
 * ============================================================================ */

#define LOGGER_MAX_MESSAGE_SIZE     4096
#define LOGGER_MAX_PATH_SIZE        512
#define LOGGER_DEFAULT_ROTATE_COUNT 5
#define LOGGER_DEFAULT_MAX_FILE_SIZE (10 * 1024 * 1024)  /* 10MB */

/* ============================================================================
 * Auth Service Constants
 * ============================================================================ */

#define AUTH_TOKEN_SIZE             256
#define AUTH_PASSWORD_MIN_LENGTH    8
#define AUTH_PASSWORD_MAX_LENGTH    128
#define AUTH_USERNAME_MAX_LENGTH    64
#define AUTH_EMAIL_MAX_LENGTH       256
#define AUTH_ACCESS_TOKEN_EXPIRY    3600      /* 1 hour */
#define AUTH_REFRESH_TOKEN_EXPIRY   604800    /* 7 days */

/* ============================================================================
 * Error Service Constants
 * ============================================================================ */

#define ERROR_DEFAULT_CAPACITY      100
#define ERROR_MAX_CONTEXT_SIZE      128
#define ERROR_MAX_MESSAGE_SIZE      512

/* ============================================================================
 * Updater Service Constants
 * ============================================================================ */

#define UPdater_DEFAULT_CHECK_INTERVAL_HOURS 24
#define UPDATER_MAX_VERSION_LENGTH  32
#define UPDATER_DEFAULT_TIMEOUT_MS  60000

/* ============================================================================
 * WebUI Constants
 * ============================================================================ */

#define WEBUI_DEFAULT_WIDTH         1200
#define WEBUI_DEFAULT_HEIGHT        800
#define WEBUI_MIN_WIDTH             800
#define WEBUI_MIN_HEIGHT            600

/* ============================================================================
 * Database Constants
 * ============================================================================ */

#define DB_DEFAULT_PORT             5432
#define DB_MAX_CONNECTIONS          10
#define DB_CONNECTION_TIMEOUT_MS    5000

/* ============================================================================
 * Validation Constants
 * ============================================================================ */

#define VALIDATION_MAX_DEPENDENCIES 100

/* ============================================================================
 * API Constants
 * ============================================================================ */

#define API_VERSION_MAJOR           1
#define API_VERSION_MINOR           0
#define API_VERSION_PATCH           0
#define API_DEFAULT_TIMEOUT_MS      5000

/* ============================================================================
 * Frontend Constants (for reference)
 * ============================================================================ */

/* These are defined in TypeScript, listed here for cross-reference */
/* DEFAULT_TIMEOUT_MS (api.service.ts) */
/* EVENT_MAX_HANDLERS (communication.service.ts) */
/* STORAGE_DEFAULT_TTL (storage.service.ts) */

#endif /* CONSTANTS_H */
