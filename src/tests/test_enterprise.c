/* Enterprise Services Tests - SQLite, Auth, Error, Updater */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "di/di.h"
#include "app_module.h"
#include "tests/test_utils.h"
#include "services/logger_service.h"
#include "services/sqlite_service.h"
#include "services/auth_service.h"
#include "services/error_service.h"
#include "services/updater_service.h"
#include "migrations.h"

/* ============================================================================
   SQLITE SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(sqlite_suite);

TEST(test_sqlite_injection) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    ASSERT_NOT_NULL(sqlite);
    ASSERT_STR_EQ(sqlite->base.name, "sqlite_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_open_memory) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    
    int result = sqlite_open(sqlite, ":memory:");
    ASSERT_TRUE(result);
    ASSERT_TRUE(sqlite_is_open(sqlite));
    
    sqlite_close(sqlite);
    ASSERT_FALSE(sqlite_is_open(sqlite));
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_execute_basic) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    int result = sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, name TEXT)");
    ASSERT_TRUE(result);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_insert_select) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE users (id INTEGER, name TEXT, email TEXT)");
    sqlite_execute(sqlite, "INSERT INTO users VALUES (1, 'Alice', 'alice@test.com')");
    sqlite_execute(sqlite, "INSERT INTO users VALUES (2, 'Bob', 'bob@test.com')");
    
    SQLiteResult result = sqlite_query(sqlite, "SELECT * FROM users ORDER BY id");
    ASSERT_TRUE(result.success);
    ASSERT_EQ(result.row_count, 2);
    ASSERT_EQ(result.column_count, 3);
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_update_delete) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, value TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES (1, 'initial')");
    
    /* Update */
    sqlite_execute(sqlite, "UPDATE test SET value = 'updated' WHERE id = 1");
    SQLiteResult result = sqlite_query(sqlite, "SELECT value FROM test WHERE id = 1");
    ASSERT_EQ(result.row_count, 1);
    ASSERT_STR_EQ(result.rows[0].values[0], "updated");
    sqlite_free_result(&result);
    
    /* Delete */
    sqlite_execute(sqlite, "DELETE FROM test WHERE id = 1");
    result = sqlite_query(sqlite, "SELECT * FROM test");
    ASSERT_EQ(result.row_count, 0);
    sqlite_free_result(&result);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_query_params) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER, name TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')");
    
    const char* params[] = {"2"};
    SQLiteResult result = sqlite_query_params(sqlite, "SELECT name FROM test WHERE id = ?", params, 1);
    ASSERT_TRUE(result.success);
    ASSERT_EQ(result.row_count, 1);
    ASSERT_STR_EQ(result.rows[0].values[0], "Bob");
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_query_one) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (value TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES ('single')");
    
    SQLiteResult result = sqlite_query_one(sqlite, "SELECT value FROM test");
    ASSERT_EQ(result.row_count, 1);
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_query_scalar) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE config (key TEXT, value TEXT)");
    sqlite_execute(sqlite, "INSERT INTO config VALUES ('version', '1.0.0')");
    
    const char* value = sqlite_query_scalar(sqlite, "SELECT value FROM config WHERE key = 'version'");
    ASSERT_NOT_NULL(value);
    ASSERT_STR_EQ(value, "1.0.0");
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_last_insert_rowid) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    sqlite_execute(sqlite, "INSERT INTO test (name) VALUES ('first')");
    
    long long id = sqlite_last_insert_rowid(sqlite);
    ASSERT_EQ(id, 1);
    
    sqlite_execute(sqlite, "INSERT INTO test (name) VALUES ('second')");
    id = sqlite_last_insert_rowid(sqlite);
    ASSERT_EQ(id, 2);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_changes) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER)");
    sqlite_execute(sqlite, "INSERT INTO test VALUES (1), (2), (3)");
    
    int changes = sqlite_changes(sqlite);
    ASSERT_EQ(changes, 3);
    
    sqlite_execute(sqlite, "DELETE FROM test WHERE id = 1");
    changes = sqlite_changes(sqlite);
    ASSERT_EQ(changes, 1);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_migrations) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    int result = sqlite_migrate(sqlite, migrations, migrations_count, -1);
    ASSERT_TRUE(result);
    
    int version = sqlite_get_version(sqlite);
    ASSERT_EQ(version, migrations_count);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_integrity_check) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER)");
    
    SQLiteResult result = sqlite_integrity_check(sqlite);
    ASSERT_TRUE(result.success);
    ASSERT_GT(result.row_count, 0);
    
    sqlite_free_result(&result);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_sqlite_vacuum) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    sqlite_open(sqlite, ":memory:");
    
    sqlite_execute(sqlite, "CREATE TABLE test (id INTEGER)");
    
    int result = sqlite_vacuum(sqlite);
    ASSERT_TRUE(result);
    
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   AUTH SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(auth_suite);

TEST(test_auth_injection) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    ASSERT_NOT_NULL(auth);
    ASSERT_STR_EQ(auth->base.name, "auth_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_hash_password) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    
    char* hash = auth_hash_password(auth, "TestPassword123!");
    ASSERT_NOT_NULL(hash);
    ASSERT_GT(strlen(hash), 0);
    ASSERT_STR_CONTAINS(hash, "$");  /* Should contain salt separator */
    
    free(hash);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_verify_password) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    
    char* hash = auth_hash_password(auth, "CorrectPassword123!");
    ASSERT_NOT_NULL(hash);
    
    ASSERT_TRUE(auth_verify_password(auth, "CorrectPassword123!", hash));
    ASSERT_FALSE(auth_verify_password(auth, "WrongPassword123!", hash));
    
    free(hash);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_valid) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "ValidPass123", &error);
    ASSERT_TRUE(result);
    ASSERT_NULL(error);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_too_short) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "Sh1!", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_no_uppercase) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "lowercase123", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_no_lowercase) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "UPPERCASE123", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_validate_password_no_digit) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    char* error = NULL;
    
    int result = auth_validate_password(auth, "NoDigitsHere!", &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    free(error);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_register_success) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    AuthRegisterData data = {
        .username = "newuser",
        .email = "newuser@test.com",
        .password = "NewUser123!"
    };
    
    AuthUser* user = NULL;
    char* error = NULL;
    
    int result = auth_register(auth, &data, &user, &error);
    ASSERT_TRUE(result);
    ASSERT_NOT_NULL(user);
    ASSERT_EQ(user->id, 1);
    ASSERT_STR_EQ(user->username, "newuser");
    
    auth_free_user(user);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_register_duplicate_username) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    AuthRegisterData data1 = {
        .username = "duplicate",
        .email = "dup1@test.com",
        .password = "DupUser123!"
    };
    
    AuthRegisterData data2 = {
        .username = "duplicate",
        .email = "dup2@test.com",
        .password = "DupUser123!"
    };
    
    AuthUser* user = NULL;
    char* error = NULL;
    
    /* First registration should succeed */
    ASSERT_TRUE(auth_register(auth, &data1, &user, &error));
    auth_free_user(user);
    free(error);
    error = NULL;
    
    /* Second registration should fail */
    int result = auth_register(auth, &data2, &user, &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    auth_free_user(user);
    free(error);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_login_success) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    /* Register first */
    AuthRegisterData reg = {
        .username = "loginuser",
        .email = "login@test.com",
        .password = "LoginPass123!"
    };
    AuthUser* reg_user = NULL;
    char* error = NULL;
    auth_register(auth, &reg, &reg_user, &error);
    auth_free_user(reg_user);
    free(error);
    
    /* Login */
    AuthLoginCredentials creds = {
        .username_or_email = "loginuser",
        .password = "LoginPass123!"
    };
    
    AuthToken* token = NULL;
    AuthUser* user = NULL;
    
    int result = auth_login(auth, &creds, &token, &user, &error);
    ASSERT_TRUE(result);
    ASSERT_NOT_NULL(token);
    ASSERT_NOT_NULL(token->access_token);
    ASSERT_NOT_NULL(token->refresh_token);
    ASSERT_NOT_NULL(user);
    ASSERT_STR_EQ(user->username, "loginuser");
    
    auth_free_token(token);
    auth_free_user(user);
    free(error);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_login_wrong_password) {
    TEST_START();
    SQLiteService* sqlite = sqlite_service_inject();
    AuthService* auth = auth_service_inject();
    
    sqlite_open(sqlite, ":memory:");
    sqlite_migrate(sqlite, migrations, migrations_count, -1);
    
    /* Register */
    AuthRegisterData reg = {
        .username = "wrongpw",
        .email = "wrongpw@test.com",
        .password = "CorrectPass123!"
    };
    AuthUser* reg_user = NULL;
    char* error = NULL;
    auth_register(auth, &reg, &reg_user, &error);
    auth_free_user(reg_user);
    free(error);
    
    /* Login with wrong password */
    AuthLoginCredentials creds = {
        .username_or_email = "wrongpw",
        .password = "WrongPass123!"
    };
    
    AuthToken* token = NULL;
    AuthUser* user = NULL;
    
    int result = auth_login(auth, &creds, &token, &user, &error);
    ASSERT_FALSE(result);
    ASSERT_NOT_NULL(error);
    
    auth_free_token(token);
    auth_free_user(user);
    free(error);
    sqlite_close(sqlite);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_token_generation) {
    TEST_START();
    AuthService* auth = auth_service_inject();
    
    char* access_token = auth_generate_access_token(auth, 123, AUTH_ROLE_USER);
    ASSERT_NOT_NULL(access_token);
    ASSERT_GT(strlen(access_token), 0);
    
    char* refresh_token = auth_generate_refresh_token(auth, 123);
    ASSERT_NOT_NULL(refresh_token);
    ASSERT_GT(strlen(refresh_token), 0);
    
    free(access_token);
    free(refresh_token);
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_role_name) {
    TEST_START();
    
    ASSERT_STR_EQ(auth_role_name(AUTH_ROLE_USER), "user");
    ASSERT_STR_EQ(auth_role_name(AUTH_ROLE_ADMIN), "admin");
    ASSERT_STR_EQ(auth_role_name(AUTH_ROLE_SUPER_ADMIN), "super_admin");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_auth_has_role) {
    TEST_START();
    
    ASSERT_TRUE(auth_has_role(AUTH_ROLE_ADMIN, AUTH_ROLE_USER));
    ASSERT_TRUE(auth_has_role(AUTH_ROLE_SUPER_ADMIN, AUTH_ROLE_ADMIN));
    ASSERT_FALSE(auth_has_role(AUTH_ROLE_USER, AUTH_ROLE_ADMIN));
    
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   ERROR SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(error_suite);

TEST(test_error_injection) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    ASSERT_NOT_NULL(errors);
    ASSERT_STR_EQ(errors->base.name, "error_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_report_app) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_app(errors, "Test application error");
    ASSERT_GT(id, 0);
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_NOT_NULL(error);
    ASSERT_STR_EQ(error->message, "Test application error");
    ASSERT_EQ(error->type, ERROR_TYPE_APPLICATION);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_report_by_type) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id1 = error_report_validation(errors, "Validation failed");
    long long id2 = error_report_auth(errors, "Auth failed");
    long long id3 = error_report_network(errors, "Network error");
    long long id4 = error_report_database(errors, "DB error");
    
    ASSERT_GT(id1, 0);
    ASSERT_GT(id2, 0);
    ASSERT_GT(id3, 0);
    ASSERT_GT(id4, 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_report_critical) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_critical(errors, "Critical system failure");
    ASSERT_GT(id, 0);
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_NOT_NULL(error);
    ASSERT_EQ(error->severity, ERROR_SEVERITY_CRITICAL);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_get_all) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    error_report_app(errors, "Error 1");
    error_report_app(errors, "Error 2");
    error_report_app(errors, "Error 3");
    
    int count = 0;
    const ErrorRecord* all = error_get_all(errors, &count);
    ASSERT_EQ(count, 3);
    ASSERT_NOT_NULL(all);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_get_by_severity) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_LOW, "Low", NULL);
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_MEDIUM, "Medium", NULL);
    error_report(errors, ERROR_TYPE_APPLICATION, ERROR_SEVERITY_HIGH, "High", NULL);
    error_report_critical(errors, "Critical");
    
    int count = 0;
    const ErrorRecord* high_errors = error_get_by_severity(errors, ERROR_SEVERITY_HIGH, &count);
    ASSERT_EQ(count, 2);  /* High + Critical */
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_get_by_type) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    error_report_database(errors, "DB error 1");
    error_report_database(errors, "DB error 2");
    error_report_network(errors, "Network error");
    
    int count = 0;
    const ErrorRecord* db_errors = error_get_by_type(errors, ERROR_TYPE_DATABASE, &count);
    ASSERT_EQ(count, 2);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_mark_reported) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_app(errors, "To be reported");
    ASSERT_TRUE(error_mark_reported(errors, id));
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_TRUE(error->is_reported);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_mark_resolved) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id = error_report_app(errors, "To be resolved");
    ASSERT_TRUE(error_mark_resolved(errors, id));
    
    const ErrorRecord* error = error_get_by_id(errors, id);
    ASSERT_TRUE(error->is_resolved);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_clear_reported) {
    TEST_START();
    ErrorService* errors = error_service_inject();
    
    long long id1 = error_report_app(errors, "Keep");
    long long id2 = error_report_app(errors, "Remove");
    error_mark_reported(errors, id2);
    
    error_clear_reported(errors);
    
    int count = 0;
    error_get_all(errors, &count);
    ASSERT_EQ(count, 1);
    
    const ErrorRecord* remaining = error_get_by_id(errors, id1);
    ASSERT_NOT_NULL(remaining);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_type_names) {
    TEST_START();
    
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_APPLICATION), "APPLICATION");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_VALIDATION), "VALIDATION");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_AUTHENTICATION), "AUTHENTICATION");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_NETWORK), "NETWORK");
    ASSERT_STR_EQ(error_type_name(ERROR_TYPE_DATABASE), "DATABASE");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_error_severity_names) {
    TEST_START();
    
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_LOW), "LOW");
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_MEDIUM), "MEDIUM");
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_HIGH), "HIGH");
    ASSERT_STR_EQ(error_severity_name(ERROR_SEVERITY_CRITICAL), "CRITICAL");
    
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   UPDATER SERVICE TESTS
   ============================================================================ */

TEST_SUITE_INIT(updater_suite);

TEST(test_updater_injection) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    ASSERT_NOT_NULL(updater);
    ASSERT_STR_EQ(updater->base.name, "updater_service");
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_get_current_version) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    const char* version = updater_get_current_version(updater);
    ASSERT_NOT_NULL(version);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_state_names) {
    TEST_START();
    
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_IDLE), "idle");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_CHECKING), "checking");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_AVAILABLE), "available");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_DOWNLOADING), "downloading");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_VERIFYING), "verifying");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_READY), "ready");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_INSTALLED), "installed");
    ASSERT_STR_EQ(updater_state_name(UPDATE_STATE_ERROR), "error");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_get_state) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    UpdateState state = updater_get_state(updater);
    ASSERT_EQ(state, UPDATE_STATE_IDLE);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_reset) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    /* Set some state */
    updater->state = UPDATE_STATE_CHECKING;
    
    updater_reset(updater);
    
    ASSERT_EQ(updater_get_state(updater), UPDATE_STATE_IDLE);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_set_server_url) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    updater_set_server_url(updater, "https://custom.server.com");
    
    ASSERT_NOT_NULL(updater->update_server_url);
    ASSERT_STR_CONTAINS(updater->update_server_url, "custom.server.com");
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_set_check_interval) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    updater_set_check_interval(updater, 48);
    ASSERT_EQ(updater->check_interval_hours, 48);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_version_compare) {
    TEST_START();
    
    ASSERT_EQ(updater_compare_versions("1.0.0", "1.0.0"), 0);
    ASSERT_LT(updater_compare_versions("1.0.0", "2.0.0"), 0);
    ASSERT_GT(updater_compare_versions("2.0.0", "1.0.0"), 0);
    ASSERT_LT(updater_compare_versions("1.0.0", "1.1.0"), 0);
    ASSERT_LT(updater_compare_versions("1.1.0", "1.1.1"), 0);
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_should_check) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    /* Initially should check (last_check = 0) */
    ASSERT_TRUE(updater_should_check(updater));
    
    /* Set last check to now */
    updater->last_check = time(NULL);
    ASSERT_FALSE(updater_should_check(updater));
    
    TEST_END(TEST_PASS, NULL);
}

TEST(test_updater_clear_error) {
    TEST_START();
    UpdaterService* updater = updater_service_inject();
    
    /* Set error state */
    updater->state = UPDATE_STATE_ERROR;
    
    updater_clear_error(updater);
    
    /* Error should be cleared */
    ASSERT_NULL(updater_get_error(updater));
    
    TEST_END(TEST_PASS, NULL);
}

/* ============================================================================
   MAIN - RUN ALL TESTS
   ============================================================================ */

int main(void) {
    printf("\n");
    printf("╔═══════════════════════════════════════════════════════════╗\n");
    printf("║        ENTERPRISE SERVICES TEST SUITE                     ║\n");
    printf("╚═══════════════════════════════════════════════════════════╝\n");
    
    /* Initialize DI */
    if (app_module_init() != 0) {
        fprintf(stderr, "Failed to initialize app module\n");
        return 1;
    }
    
    LoggerService* logger = logger_service_inject();
    logger_log(logger, "INFO", "Starting enterprise services tests...");
    
    /* Run test suites */
    test_suite_run(&sqlite_suite);
    test_suite_run(&auth_suite);
    test_suite_run(&error_suite);
    test_suite_run(&updater_suite);
    
    /* Report individual suites */
    printf("\n");
    printf("═══════════════════════════════════════════════════════════\n");
    printf("                    SUITE REPORTS\n");
    printf("═══════════════════════════════════════════════════════════\n");
    
    test_suite_report(&sqlite_suite);
    test_suite_report(&auth_suite);
    test_suite_report(&error_suite);
    test_suite_report(&updater_suite);
    
    /* Overall summary */
    TestSuite* suites[] = {
        &sqlite_suite,
        &auth_suite,
        &error_suite,
        &updater_suite
    };
    test_suite_summary(suites, 4);
    
    /* Cleanup */
    app_module_destroy();
    
    /* Return failure if any tests failed */
    int total_failed = 0;
    for (int i = 0; i < 4; i++) {
        total_failed += suites[i]->failed;
    }
    
    return total_failed > 0 ? 1 : 0;
}
