/* Test Runner for Backend Services */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "di/di.h"
#include "app_module.h"
#include "services/logger_service.h"
#include "services/event_service.h"
#include "services/file_service.h"
#include "services/timer_service.h"
#include "services/json_service.h"
#include "services/hash_service.h"
#include "services/sqlite_service.h"
#include "services/auth_service.h"
#include "services/error_service.h"
#include "migrations.h"

/* Test counters */
static int tests_run = 0;
static int tests_passed = 0;
static int tests_failed = 0;

/* Test macros */
#define TEST(name) static int name(void)
#define RUN_TEST(name) do { \
    tests_run++; \
    printf("  Running: %s... ", #name); \
    fflush(stdout); \
    if (name() == 0) { \
        tests_passed++; \
        printf("✓ PASSED\n"); \
    } else { \
        tests_failed++; \
        printf("✗ FAILED\n"); \
    } \
} while(0)

#define ASSERT(cond) do { if (!(cond)) { \
    printf("Assertion failed: %s at %s:%d\n", #cond, __FILE__, __LINE__); \
    return 1; \
} } while(0)

#define ASSERT_NOT_NULL(ptr) ASSERT((ptr) != NULL)
#define ASSERT_NULL(ptr) ASSERT((ptr) == NULL)
#define ASSERT_EQ(a, b) ASSERT((a) == (b))
#define ASSERT_NE(a, b) ASSERT((a) != (b))
#define ASSERT_STR_EQ(a, b) ASSERT(strcmp((a), (b)) == 0)

/* ==================== Logger Service Tests ==================== */

TEST(test_logger_service_inject) {
    LoggerService* logger = logger_service_inject();
    ASSERT_NOT_NULL(logger);
    ASSERT_STR_EQ(logger->base.type_name, "LoggerService");
    return 0;
}

TEST(test_logger_log_info) {
    LoggerService* logger = logger_service_inject();
    logger_set_debug(logger, true);
    logger_log(logger, "INFO", "Test message");
    return 0;
}

TEST(test_logger_set_debug) {
    LoggerService* logger = logger_service_inject();
    logger_set_debug(logger, true);
    ASSERT(logger->debug_enabled == true);
    logger_set_debug(logger, false);
    ASSERT(logger->debug_enabled == false);
    return 0;
}

/* ==================== Event Service Tests ==================== */

static int event_received = 0;
static void test_event_handler(const char* event, const char* payload, void* user_data) {
    (void)event;
    (void)payload;
    event_received = 1;
}

TEST(test_event_service_inject) {
    EventService* events = event_service_inject();
    ASSERT_NOT_NULL(events);
    return 0;
}

TEST(test_event_subscribe_emit) {
    EventService* events = event_service_inject();
    event_received = 0;
    
    event_subscribe(events, "test.event", test_event_handler, NULL);
    event_emit(events, "test.event", "test payload");
    
    ASSERT(event_received == 1);
    return 0;
}

/* ==================== File Service Tests ==================== */

TEST(test_file_service_inject) {
    FileService* files = file_service_inject();
    ASSERT_NOT_NULL(files);
    return 0;
}

TEST(test_file_get_working_dir) {
    FileService* files = file_service_inject();
    const char* cwd = file_get_working_dir(files);
    ASSERT_NOT_NULL(cwd);
    ASSERT(strlen(cwd) > 0);
    return 0;
}

/* ==================== JSON Service Tests ==================== */

TEST(test_json_service_inject) {
    JsonService* json = json_service_inject();
    ASSERT_NOT_NULL(json);
    return 0;
}

TEST(test_json_create_object) {
    JsonService* json = json_service_inject();
    JsonValue* obj = json_create_object(json);
    ASSERT_NOT_NULL(obj);
    json_free(obj);
    return 0;
}

TEST(test_json_stringify) {
    JsonService* json = json_service_inject();
    JsonValue* obj = json_create_object(json);
    json_object_set(obj, "name", json_create_string(json, "test"));
    json_object_set(obj, "value", json_create_number(json, 42));
    
    char* str = json_stringify(obj, 2);
    ASSERT_NOT_NULL(str);
    ASSERT(strlen(str) > 0);
    
    free(str);
    json_free(obj);
    return 0;
}

/* ==================== Hash Service Tests ==================== */

TEST(test_hash_service_inject) {
    HashService* hash = hash_service_inject();
    ASSERT_NOT_NULL(hash);
    return 0;
}

TEST(test_hash_md5) {
    HashService* hash = hash_service_inject();
    char* md5 = hash_md5_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(md5);
    ASSERT_EQ(strlen(md5), 32);  /* MD5 produces 32 hex chars */
    free(md5);
    return 0;
}

TEST(test_hash_sha256) {
    HashService* hash = hash_service_inject();
    char* sha256 = hash_sha256_hex("Hello, World!", 13);
    ASSERT_NOT_NULL(sha256);
    ASSERT_EQ(strlen(sha256), 64);  /* SHA256 produces 64 hex chars */
    free(sha256);
    return 0;
}

/* ==================== SQLite Service Tests ==================== */

TEST(test_sqlite_service_inject) {
    SQLiteService* sqlite = sqlite_service_inject();
    ASSERT_NOT_NULL(sqlite);
    return 0;
}

TEST(test_sqlite_open_close) {
    SQLiteService* sqlite = sqlite_service_inject();
    
    /* Open in-memory database */
    int result = sqlite_open(sqlite, ":memory:");
    ASSERT(result == 1);
    ASSERT(sqlite_is_open(sqlite) == 1);
    
    /* Close database */
    sqlite_close(sqlite);
    ASSERT(sqlite_is_open(sqlite) == 0);
    
    return 0;
}

TEST(test_sqlite_execute) {
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    /* Create table */
    int result = sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, name TEXT)");
    ASSERT(result == 1);
    
    /* Insert data */
    result = sqlite_execute(sqlite, "INSERT INTO test VALUES (1, 'Alice'), (2, 'Bob')");
    ASSERT(result == 1);
    
    sqlite_close(sqlite);
    return 0;
}

TEST(test_sqlite_query) {
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, name TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES (1, 'Alice'), (2, 'Bob')");
    
    SQLiteResult result = sqlite_query(sqlite, "SELECT * FROM test ORDER BY id");
    ASSERT(result.success == 1);
    ASSERT(result.row_count == 2);
    ASSERT(result.column_count == 2);
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    return 0;
}

TEST(test_sqlite_migrations) {
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    /* Run migrations */
    int result = sqlite_migrate(sqlite, migrations, migrations_count, -1);
    ASSERT(result == 1);
    
    /* Check version */
    int version = sqlite_get_version(sqlite);
    ASSERT(version == migrations_count);
    
    sqlite_close(sqlite);
    return 0;
}

/* ==================== Auth Service Tests ==================== */

TEST(test_auth_service_inject) {
    AuthService* auth = auth_service_inject();
    ASSERT_NOT_NULL(auth);
    return 0;
}

TEST(test_auth_hash_password) {
    AuthService* auth = auth_service_inject();
    char* hash = auth_hash_password(auth, "TestPassword123!");
    ASSERT_NOT_NULL(hash);
    ASSERT(strlen(hash) > 0);
    free(hash);
    return 0;
}

TEST(test_auth_validate_password) {
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    /* Valid password */
    int result = auth_validate_password(auth, "ValidPass123", &error);
    ASSERT(result == 1);
    ASSERT_NULL(error);
    
    /* Too short */
    result = auth_validate_password(auth, "Short1!", &error);
    ASSERT(result == 0);
    ASSERT_NOT_NULL(error);
    free(error);
    
    return 0;
}

TEST(test_auth_register_login) {
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    /* Open and migrate database */
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    /* Register user */
    AuthRegisterData reg_data = {
        .username = "testuser",
        .email = "test@example.com",
        .password = "TestPass123!"
    };
    
    AuthUser* user = NULL;
    char* error = NULL;
    
    int result = auth_register(auth, &reg_data, &user, &error);
    ASSERT(result == 1);
    ASSERT_NOT_NULL(user);
    ASSERT_EQ(user->id, 1);
    ASSERT_STR_EQ(user->username, "testuser");
    
    auth_free_user(user);
    
    /* Login */
    AuthLoginCredentials creds = {
        .username_or_email = "testuser",
        .password = "TestPass123!"
    };
    
    AuthToken* token = NULL;
    AuthUser* logged_user = NULL;
    
    result = auth_login(auth, &creds, &token, &logged_user, &error);
    ASSERT(result == 1);
    ASSERT_NOT_NULL(token);
    ASSERT_NOT_NULL(logged_user);
    ASSERT_NOT_NULL(token->access_token);
    ASSERT_NOT_NULL(token->refresh_token);
    
    auth_free_token(token);
    auth_free_user(logged_user);
    
    sqlite_close(sqlite);
    return 0;
}

/* ==================== Error Service Tests ==================== */

TEST(test_error_service_inject) {
    ErrorService* errors = error_service_inject();
    ASSERT_NOT_NULL(errors);
    return 0;
}

TEST(test_error_report) {
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_app(errors, "Test error message");
    ASSERT(id > 0);
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_NOT_NULL(error);
    ASSERT_STR_EQ(error->message, "Test error message");
    
    return 0;
}

TEST(test_error_get_all) {
    ErrorService* errors = error_service_inject();
    int count = 0;
    
    error_report_app(errors, "Error 1");
    error_report_database(errors, "Error 2");
    error_report_network(errors, "Error 3");
    
    const ErrorRecord* all = error_get_all(errors, &count);
    ASSERT(count == 3);
    ASSERT_NOT_NULL(all);
    
    return 0;
}

TEST(test_error_get_by_severity) {
    ErrorService* errors = error_service_inject();
    int count = 0;
    
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_LOW, "Low error", NULL);
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_MEDIUM, "Medium error", NULL);
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_HIGH, "High error", NULL);
    error_report_critical(errors, "Critical error");
    
    /* Get high and critical */
    const ErrorRecord* high_errors = error_get_by_severity(errors, ERROR_SEVERITY_HIGH, &count);
    ASSERT(count == 2);
    
    return 0;
}

/* ==================== Test Runner ==================== */

static void print_header(const char* title) {
    printf("\n%s\n", title);
    printf("========================================\n");
}

int main(void) {
    printf("\n");
    printf("╔══════════════════════════════════════╗\n");
    printf("║     Backend Service Test Suite       ║\n");
    printf("╚══════════════════════════════════════╝\n");
    printf("\n");
    
    /* Initialize app module */
    if (app_module_init() != 0) {
        fprintf(stderr, "Failed to initialize app module\n");
        return 1;
    }
    
    LoggerService* logger = logger_service_inject();
    logger_log(logger, "INFO", "Starting test suite...");
    
    /* Logger Service Tests */
    print_header("Logger Service Tests");
    RUN_TEST(test_logger_service_inject);
    RUN_TEST(test_logger_log_info);
    RUN_TEST(test_logger_set_debug);
    
    /* Event Service Tests */
    print_header("Event Service Tests");
    RUN_TEST(test_event_service_inject);
    RUN_TEST(test_event_subscribe_emit);
    
    /* File Service Tests */
    print_header("File Service Tests");
    RUN_TEST(test_file_service_inject);
    RUN_TEST(test_file_get_working_dir);
    
    /* JSON Service Tests */
    print_header("JSON Service Tests");
    RUN_TEST(test_json_service_inject);
    RUN_TEST(test_json_create_object);
    RUN_TEST(test_json_stringify);
    
    /* Hash Service Tests */
    print_header("Hash Service Tests");
    RUN_TEST(test_hash_service_inject);
    RUN_TEST(test_hash_md5);
    RUN_TEST(test_hash_sha256);
    
    /* SQLite Service Tests */
    print_header("SQLite Service Tests");
    RUN_TEST(test_sqlite_service_inject);
    RUN_TEST(test_sqlite_open_close);
    RUN_TEST(test_sqlite_execute);
    RUN_TEST(test_sqlite_query);
    RUN_TEST(test_sqlite_migrations);
    
    /* Auth Service Tests */
    print_header("Auth Service Tests");
    RUN_TEST(test_auth_service_inject);
    RUN_TEST(test_auth_hash_password);
    RUN_TEST(test_auth_validate_password);
    RUN_TEST(test_auth_register_login);
    
    /* Error Service Tests */
    print_header("Error Service Tests");
    RUN_TEST(test_error_service_inject);
    RUN_TEST(test_error_report);
    RUN_TEST(test_error_get_all);
    RUN_TEST(test_error_get_by_severity);
    
    /* Cleanup */
    app_module_destroy();
    
    /* Print summary */
    printf("\n");
    printf("╔══════════════════════════════════════╗\n");
    printf("║           Test Summary               ║\n");
    printf("╚══════════════════════════════════════╝\n");
    printf("\n");
    printf("  Total:    %d\n", tests_run);
    printf("  Passed:   %d\n", tests_passed);
    printf("  Failed:   %d\n", tests_failed);
    printf("\n");
    
    if (tests_failed > 0) {
        printf("  ❌ Some tests failed!\n");
    } else {
        printf("  ✅ All tests passed!\n");
    }
    printf("\n");
    
    return tests_failed > 0 ? 1 : 0;
}
